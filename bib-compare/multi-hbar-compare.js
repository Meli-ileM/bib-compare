// -----------------------------------------------------------------------------
// MULTI_HBAR COMPARE - Meme donnee que multi-vbar, layout horizontal
// -----------------------------------------------------------------------------
const payload = {
  keys: ["value", "reference", "delta"],
  items: [
    {
      uid: "fr-75",
      name: "Paris",
      data: {
        value: { title: "Valeur", d: 13200, color: "#2563eb", formatters: { value: { suffix: "hab." } } },
        reference: { title: "Reference", d: 9800, color: "#10b981", formatters: { value: { suffix: "hab." } } },
        delta: { title: "Delta", d: 3400, color: "#ef4444", formatters: { value: { suffix: "hab." } } }
      }
    },
    {
      uid: "fr-69",
      name: "Lyon",
      data: {
        value: { title: "Valeur", d: 10800, color: "#2563eb", formatters: { value: { suffix: "hab." } } },
        reference: { title: "Reference", d: 9100, color: "#10b981", formatters: { value: { suffix: "hab." } } },
        delta: { title: "Delta", d: 1700, color: "#ef4444", formatters: { value: { suffix: "hab." } } }
      }
    },
    {
      uid: "fr-13",
      name: "Marseille",
      data: {
        value: { title: "Valeur", d: 8900, color: "#2563eb", formatters: { value: { suffix: "hab." } } },
        reference: { title: "Reference", d: 9700, color: "#10b981", formatters: { value: { suffix: "hab." } } },
        delta: { title: "Delta", d: -800, color: "#ef4444", formatters: { value: { suffix: "hab." } } }
      }
    }
  ]
};

document.getElementById("payload").textContent = JSON.stringify(payload, null, 2);

const BAR_BORDER_RADIUS = 3;

function buildConverter(from) {
  const suffix = from?.formatters?.value?.suffix || "";
  const formatter = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
  return (value) => {
    if (value == null) return "";
    const base = formatter.format(value);
    return suffix ? `${base} ${suffix}` : base;
  };
}

function chartInstance(host) {
  const existing = echarts.getInstanceByDom(host);
  if (existing) existing.dispose();
  return echarts.init(host);
}

class MultiHBarChartStandalone {
  constructor(host, data) {
    this.host = host;
    this.data = data;
    this.contentRect = { width: host.clientWidth, height: host.clientHeight };
  }

  get abscissKeys() {
    return this.data.keys.filter((k) => this.data.items.some((it) => it.data[k]?.d != null));
  }

  get margin() {
    const l = Math.min(Math.max(100, 0.15 * this.contentRect.width), 180);
    return { t: 10, b: 10, r: 62, l };
  }

  get innerSize() {
    return {
      width: this.contentRect.width - this.margin.r - this.margin.l,
      height: this.contentRect.height - this.margin.t - this.margin.b
    };
  }

  get flatTuples() {
    return this.data.items.flatMap((item) => this.abscissKeys.map((k) => item.data[k]?.d).filter((v) => v != null));
  }

  getOptimumLayout() {
    // Recherche de la plus grande hauteur de barre qui tient dans le conteneur.
    // Cette logique suit l'intention de getOptimumLayout() plateforme.
    const height = this.innerSize.height;
    const N = this.data.items.length;
    const n = this.abscissKeys.length;
    const layout = (h) => {
      const barSpacing = 6;
      const barHeight = Math.max(Math.min(N === 1 ? 64 : 32, h), 4);
      const itemHeight = n * barHeight + (n - 1) * barSpacing;
      const itemMargin = Math.max(barSpacing + 2, (height - N * itemHeight) / N);
      return { barN: n, barHeight, barSpacing, itemMargin, itemHeight, fontSize: 11 };
    };

    let best = layout(4);
    for (let h = 4; h <= 32; h += 2) {
      const probe = layout(h);
      if (Math.round(height - (probe.itemHeight + probe.itemMargin) * N) >= 0) {
        best = probe;
      }
    }
    return best;
  }

  draw() {
    const margin = this.margin;
    const { width, height } = this.innerSize;
    const minV = Math.min(...this.flatTuples);
    const maxV = Math.max(...this.flatTuples);
    const domain = [Math.min(0, minV), Math.max(0, maxV)];
    const { barN, barHeight, barSpacing, itemMargin, itemHeight, fontSize } = this.getOptimumLayout();
    // sW mappe valeur -> position X, avec domaine centre sur 0.
    const sW = d3.scaleLinear().rangeRound([margin.l, width + margin.l]).domain(domain);
    const textMarginLeft = this.data.items.length === 1 ? 15 : 5;

    this.host.innerHTML = "";
    const svg = d3.create("svg").attr("width", this.contentRect.width).attr("height", this.contentRect.height);
    const root = svg.append("g").attr("transform", `translate(0, ${margin.t})`);

    this.data.items.forEach((item, i) => {
      const hgt = itemHeight + itemMargin;
      const grp = root.append("g").attr("transform", `translate(0, ${itemMargin / 2 + i * hgt})`);

      grp.append("text")
        .attr("x", margin.l - 4)
        .attr("y", (barN * barHeight + (barN - 1) * barSpacing) / 2)
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "middle")
        .attr("font-size", 12)
        .attr("fill", "#374151")
        .text(item.name);

      this.abscissKeys.forEach((k, j) => {
        if (!item.data[k]) return;
        const datum = item.data[k];
        const d = +datum.d;
        const ty = j * (barHeight + barSpacing);
        const tx = d < 0 ? sW(d) : sW(0);
        const barW = Math.abs(sW(d) - sW(0));
        const textX = barW + textMarginLeft;

        const g = grp.append("g").attr("transform", `translate(${tx}, ${ty})`);
        g.append("rect")
          .attr("x", 0)
          .attr("y", 0)
          .attr("width", barW)
          .attr("height", barHeight)
          .attr("rx", BAR_BORDER_RADIUS)
          .attr("ry", BAR_BORDER_RADIUS)
          .attr("fill", datum.color || "#64748b")
          .append("title")
          .text(`${datum.title || k}: ${buildConverter(datum)(d)}`);

        g.append("text")
          .attr("x", textX)
          .attr("y", barHeight / 2)
          .attr("dominant-baseline", "middle")
          .attr("font-size", fontSize)
          .attr("fill", "#111827")
          .text(buildConverter(datum)(d));
      });
    });

    if (minV <= 0) {
      const origin = root.append("g");
      origin.append("line")
        .attr("x1", sW(0))
        .attr("x2", sW(0))
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke", "#cccccc");
      origin.append("text")
        .attr("x", sW(0) + 3)
        .attr("y", height)
        .attr("font-size", 11)
        .attr("fill", "#9ca3af")
        .text("0");
    }

    this.host.appendChild(svg.node());
  }
}

class MultiHBarChartEChartsStandalone extends MultiHBarChartStandalone {
  draw() {
    this.host.innerHTML = "";
    const keys = this.abscissKeys;
    const vals = this.flatTuples;
    const minV = Math.min(...vals);
    const maxV = Math.max(...vals);
    const pad = Math.max(1, Math.round((maxV - minV) * 0.08));
    const chart = chartInstance(this.host);

    // ECharts equivalent: barres horizontales groupees + markLine sur x=0.
    chart.setOption({
      animation: true,
      legend: { top: 0, data: keys },
      grid: {
        top: 34,
        bottom: 16,
        left: 110,
        right: 70,
        containLabel: true
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" }
      },
      xAxis: {
        type: "value",
        min: Math.min(0, minV) - pad,
        max: Math.max(0, maxV) + pad,
        axisLabel: {
          color: "#6b7280",
          formatter: (v) => buildConverter(this.data.items[0].data[keys[0]])(v)
        },
        splitLine: { lineStyle: { color: "#eef2f7", type: "dashed" } }
      },
      yAxis: {
        type: "category",
        data: this.data.items.map((it) => it.name),
        axisLabel: { color: "#374151" }
      },
      series: keys.map((key) => ({
        name: key,
        type: "bar",
        barMaxWidth: 20,
        data: this.data.items.map((item) => {
          const datum = item.data[key];
          return {
            value: datum?.d,
            itemStyle: {
              color: datum?.color || "#64748b",
              borderRadius: [BAR_BORDER_RADIUS, BAR_BORDER_RADIUS, BAR_BORDER_RADIUS, BAR_BORDER_RADIUS]
            }
          };
        }),
        label: {
          show: true,
          position: "right",
          fontSize: 11,
          formatter: (p) => {
            const datum = this.data.items[p.dataIndex].data[key];
            return buildConverter(datum)(p.value);
          }
        },
        markLine: {
          symbol: ["none", "none"],
          silent: true,
          label: { show: minV < 0, formatter: "0", color: "#6b7280" },
          lineStyle: { color: "#9ca3af", width: 1.1 },
          data: [{ xAxis: 0 }]
        }
      }))
    });

    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(this.host);
  }
}

function render() {
  const d3Host = document.getElementById("d3Chart");
  const echartsHost = document.getElementById("echartsChart");
  new MultiHBarChartStandalone(d3Host, payload).draw();
  new MultiHBarChartEChartsStandalone(echartsHost, payload).draw();
}

render();
window.addEventListener("resize", render);
