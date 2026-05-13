// -----------------------------------------------------------------------------
// MULTI_VBAR COMPARE - Format multi tuples (items[] + cles de series)
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

class MultiVBarChartStandalone {
  constructor(host, data) {
    this.host = host;
    this.data = data;
    this.contentRect = { width: host.clientWidth, height: host.clientHeight };
  }

  get abscissKeys() {
    return this.data.keys.filter((k) => this.data.items.some((it) => it.data[k]?.d != null));
  }

  get margin() {
    return { t: 30, b: 36, r: 10, l: 10 };
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

  draw() {
    // Reprise des equations de layout du composant plateforme:
    // barWidth, boxW, itemMargin, wgt et echelle verticale sH.
    const margin = this.margin;
    const { width, height } = this.innerSize;
    const n = this.abscissKeys.length;
    const N = this.data.items.length;
    const minV = Math.min(...this.flatTuples);
    const maxV = Math.max(...this.flatTuples);
    const domain = [Math.min(0, minV), Math.max(0, maxV)];
    const barSpacing = 8;
    const barWidth = Math.min(N === 1 ? 64 : 36, Math.max(width / (n * N) - barSpacing * 1.5, 2));
    const boxW = n * barWidth + (n - 1) * barSpacing;
    const itemMargin = Math.max(11, (width - N * boxW) / (N + 1));
    const wgt = boxW + itemMargin;
    const textMarginBottom = 12;
    const textHeight = margin.b + textMarginBottom - 2;
    const sH = d3.scaleLinear().rangeRound([height - textMarginBottom, 0]).domain(domain);

    this.host.innerHTML = "";
    const svg = d3.create("svg").attr("width", this.contentRect.width).attr("height", this.contentRect.height);
    const root = svg.append("g").attr("transform", `translate(${margin.l}, ${margin.t})`);

    this.data.items.forEach((item, i) => {
      const grp = root.append("g").attr("transform", `translate(${itemMargin / 2 + i * wgt}, 0)`);
      grp.append("text")
        .attr("x", wgt / 2)
        .attr("y", height + margin.b - textHeight + 14)
        .attr("text-anchor", "middle")
        .attr("font-size", 12)
        .attr("fill", "#374151")
        .text(item.name);

      this.abscissKeys.forEach((k, j) => {
        if (!item.data[k]) return;
        const datum = item.data[k];
        // ty + barH reproduisent la gestion positive/negative du composant D3.
        const d = datum.d;
        const tx = wgt / 2 - boxW / 2 + j * (barWidth + barSpacing);
        const ty = Math.min(0, sH(0) - sH(d));
        const barH = Math.abs(sH(0) - sH(d));
        const textY = sH(d) - textMarginBottom;

        const g = grp.append("g").attr("transform", `translate(${tx}, ${ty})`);
        g.append("rect")
          .attr("x", 0)
          .attr("y", sH(d))
          .attr("width", barWidth)
          .attr("height", barH)
          .attr("rx", BAR_BORDER_RADIUS)
          .attr("ry", BAR_BORDER_RADIUS)
          .attr("fill", datum.color || "#64748b")
          .append("title")
          .text(`${datum.title || k}: ${buildConverter(datum)(d)}`);

        g.append("text")
          .attr("x", barWidth / 2)
          .attr("y", textY)
          .attr("text-anchor", "middle")
          .attr("font-size", 13)
          .attr("fill", "#111827")
          .text(buildConverter(datum)(d));
      });
    });

    if (minV <= 0) {
      const origin = root.append("g");
      origin.append("line")
        .attr("x1", margin.l)
        .attr("x2", width)
        .attr("y1", sH(0))
        .attr("y2", sH(0))
        .attr("stroke", "#cccccc");
      origin.append("text")
        .attr("x", width)
        .attr("y", sH(0) + 3)
        .attr("font-size", 11)
        .attr("fill", "#9ca3af")
        .text("0");
    }

    this.host.appendChild(svg.node());
  }
}

class MultiVBarChartEChartsStandalone extends MultiVBarChartStandalone {
  draw() {
    this.host.innerHTML = "";
    const keys = this.abscissKeys;
    const values = this.flatTuples;
    const minV = Math.min(...values);
    const maxV = Math.max(...values);
    const pad = Math.max(1, Math.round((maxV - minV) * 0.08));
    const chart = chartInstance(this.host);

    // Variante ECharts equivalente: grouped bars avec une serie par cle.
    chart.setOption({
      xAxis: {
        type: "category",
        data: this.data.items.map((it) => it.name),
        axisLabel: { color: "#374151" }
      },
      yAxis: {
        type: "value",
        min: Math.min(0, minV) - pad,
        max: Math.max(0, maxV) + pad,
        axisLabel: {
          color: "#6b7280",
          formatter: (v) => buildConverter(this.data.items[0].data[keys[0]])(v)
        },
        splitLine: { lineStyle: { color: "#eef2f7", type: "dashed" } }
      },
      series: keys.map((key) => ({
        name: key,
        type: "bar",
        barMaxWidth: 34,
        data: this.data.items.map((item) => {
          const datum = item.data[key];
          return {
            value: datum?.d,
            itemStyle: {
              color: datum?.color || "#64748b",
              borderRadius: [BAR_BORDER_RADIUS, BAR_BORDER_RADIUS, 0, 0]
            }
          };
        }),
        label: {
          show: true,
          position: "top",
          fontSize: 12,
          formatter: (p) => {
            const datum = this.data.items[p.dataIndex].data[key];
            return buildConverter(datum)(p.value);
          }
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
  new MultiVBarChartStandalone(d3Host, payload).draw();
  new MultiVBarChartEChartsStandalone(echartsHost, payload).draw();
}

render();
window.addEventListener("resize", render);
