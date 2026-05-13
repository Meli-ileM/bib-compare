// -----------------------------------------------------------------------------
// MULTI_LINE COMPARE - Series lineaires multi-items / multi-cles
// -----------------------------------------------------------------------------
const payload = {
  keys: ["value", "reference", "objectif"],
  items: [
    {
      uid: "fr-75",
      name: "Paris",
      data: {
        value: { title: "Valeur", d: 13200, color: "#2563eb", formatters: { value: { suffix: "hab." } } },
        reference: { title: "Reference", d: 9800, color: "#10b981", formatters: { value: { suffix: "hab." } } },
        objectif: { title: "Objectif", d: 12000, color: "#f59e0b", formatters: { value: { suffix: "hab." } } }
      }
    },
    {
      uid: "fr-69",
      name: "Lyon",
      data: {
        value: { title: "Valeur", d: 10800, color: "#2563eb", formatters: { value: { suffix: "hab." } } },
        reference: { title: "Reference", d: 9100, color: "#10b981", formatters: { value: { suffix: "hab." } } },
        objectif: { title: "Objectif", d: 10000, color: "#f59e0b", formatters: { value: { suffix: "hab." } } }
      }
    },
    {
      uid: "fr-13",
      name: "Marseille",
      data: {
        value: { title: "Valeur", d: 8900, color: "#2563eb", formatters: { value: { suffix: "hab." } } },
        reference: { title: "Reference", d: 9700, color: "#10b981", formatters: { value: { suffix: "hab." } } },
        objectif: { title: "Objectif", d: 9300, color: "#f59e0b", formatters: { value: { suffix: "hab." } } }
      }
    },
    {
      uid: "fr-31",
      name: "Toulouse",
      data: {
        value: { title: "Valeur", d: 7600, color: "#2563eb", formatters: { value: { suffix: "hab." } } },
        reference: { title: "Reference", d: 7400, color: "#10b981", formatters: { value: { suffix: "hab." } } },
        objectif: { title: "Objectif", d: 7900, color: "#f59e0b", formatters: { value: { suffix: "hab." } } }
      }
    }
  ]
};

document.getElementById("payload").textContent = JSON.stringify(payload, null, 2);

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

class MultiLineChartStandalone {
  constructor(host, data) {
    this.host = host;
    this.data = data;
    this.contentRect = { width: host.clientWidth, height: host.clientHeight };
  }

  get abscissKeys() {
    return this.data.keys.filter((k) => this.data.items.some((it) => it.data[k]?.d != null));
  }

  get margin() {
    return { t: 20, b: 46, r: 10, l: 10 };
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

  getSeries({ sX, sY }) {
    // Construit les points (x,y) de chaque serie a partir des items.
    // y inclut le meme ajustement que la version plateforme en cas de negatif.
    return this.abscissKeys.map((prop) => {
      const points = this.data.items.map((item, i) => {
        const d = item.data[prop].d;
        const ty = Math.min(0, Math.abs(sY(0) - sY(d)));
        return {
          d,
          prop,
          item,
          x: sX(i),
          y: sY(d) + ty,
          lbl: buildConverter(item.data[prop])(d),
          color: item.data[prop].color || "#64748b",
          vAlign: "start"
        };
      });
      return { prop, points };
    });
  }

  draw() {
    const margin = this.margin;
    const { width, height } = this.innerSize;
    const N = this.data.items.length;
    const minV = Math.min(...this.flatTuples);
    const maxV = Math.max(...this.flatTuples);
    const domain = [Math.min(0, minV), Math.max(0, maxV)];
    const textMarginBottom = 10;
    const circleR = 4;
    const textHeight = margin.b + textMarginBottom - circleR - 2;
    const itemMargin = width / N;
    const sX = (i) => (i + 0.5) * itemMargin;
    const sY = d3.scaleLinear().rangeRound([height - textMarginBottom - circleR, 0]).domain(domain);
    const lineD = d3.line().curve(d3.curveNatural).x((d) => d.x).y((d) => d.y);
    const itemValueFontSize = 13;
    const series = this.getSeries({ sX, sY });

    // Evite les collisions de labels quand des valeurs sont tres proches.
    for (let i = 0; i < this.data.items.length; i += 1) {
      const ys = series.map((s) => s.points[i].y);
      const mn = Math.min(...ys);
      const mx = Math.max(...ys);
      const diff = mx - mn;
      if (Math.abs(diff) < 2 * itemValueFontSize) {
        const idx = ys.findIndex((y) => y === mx);
        if (idx !== -1) {
          series[idx].points[i].vAlign = "end";
        }
      }
    }

    this.host.innerHTML = "";
    const svg = d3.create("svg").attr("width", this.contentRect.width).attr("height", this.contentRect.height);
    const root = svg.append("g").attr("transform", `translate(${margin.l}, ${margin.t})`);

    this.data.items.forEach((item, i) => {
      const g = root.append("g").attr("transform", `translate(${sX(i)}, 0)`);
      g.append("line")
        .attr("x1", 0)
        .attr("x2", 0)
        .attr("y1", 2)
        .attr("y2", height + margin.b - textHeight)
        .attr("stroke", "#e5e7eb");
      g.append("text")
        .attr("x", 0)
        .attr("y", height + margin.b - textHeight + 14)
        .attr("text-anchor", "middle")
        .attr("font-size", 12)
        .attr("fill", "#374151")
        .text(item.name);
    });

    if (minV <= 0) {
      const origin = root.append("g");
      origin.append("line")
        .attr("x1", margin.l)
        .attr("x2", width)
        .attr("y1", sY(0))
        .attr("y2", sY(0))
        .attr("stroke", "#cccccc");
      origin.append("text")
        .attr("x", width)
        .attr("y", sY(0) + 3)
        .attr("font-size", 11)
        .attr("fill", "#9ca3af")
        .text("0");
    }

    series.forEach((serie) => {
      const color = serie.points[0].color;
      root.append("path")
        .attr("d", lineD(serie.points))
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 2);

      serie.points.forEach((p) => {
        const g = root.append("g").attr("transform", `translate(${p.x}, ${p.y})`);
        g.append("circle").attr("r", 4).attr("fill", color);
        const labelY = p.vAlign === "end" ? -10 : 16;
        g.append("text")
          .attr("x", 0)
          .attr("y", labelY)
          .attr("text-anchor", "middle")
          .attr("font-size", 12)
          .attr("fill", "#111827")
          .text(p.lbl);
      });
    });

    this.host.appendChild(svg.node());
  }
}

class MultiLineChartEChartsStandalone extends MultiLineChartStandalone {
  draw() {
    this.host.innerHTML = "";
    const keys = this.abscissKeys;
    const vals = this.flatTuples;
    const minV = Math.min(...vals);
    const maxV = Math.max(...vals);
    const pad = Math.max(1, Math.round((maxV - minV) * 0.08));
    const chart = chartInstance(this.host);

    // ECharts equivalent: une serie line par cle, lissage, labels et domaine identique.
    chart.setOption({
      animation: true,
      legend: { top: 0, data: keys },
      grid: {
        top: 34,
        bottom: 36,
        left: 24,
        right: 20,
        containLabel: true
      },
      tooltip: { trigger: "axis" },
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
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 8,
        lineStyle: { width: 2 },
        itemStyle: { color: this.data.items[0].data[key]?.color || "#64748b" },
        data: this.data.items.map((item) => item.data[key]?.d),
        label: {
          show: true,
          position: "top",
          fontSize: 12,
          formatter: (p) => buildConverter(this.data.items[p.dataIndex].data[key])(p.value)
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
  new MultiLineChartStandalone(d3Host, payload).draw();
  new MultiLineChartEChartsStandalone(echartsHost, payload).draw();
}

render();
window.addEventListener("resize", render);
