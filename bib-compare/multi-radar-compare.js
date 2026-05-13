// -----------------------------------------------------------------------------
// MULTI_RADAR COMPARE - Projection polaire des valeurs multi-tuples
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

class MultiRadarChartStandalone {
  constructor(host, data) {
    this.host = host;
    this.data = data;
    this.levels = 3;
    this.contentRect = { width: host.clientWidth, height: host.clientHeight };
  }

  get abscissKeys() {
    return this.data.keys.filter((k) => this.data.items.some((it) => it.data[k]?.d != null));
  }

  get margin() {
    const w = this.contentRect.width;
    const side = Math.max(40, Math.min(120, w / 3));
    return { t: 30, b: 30, r: side, l: side };
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
    // Meme principe que le composant D3:
    // - grille concentrique
    // - axes categories
    // - un polygone par cle
    const { width, height } = this.innerSize;
    const r = Math.min(width / 2, height / 2);
    const n = this.data.items.length;
    const minV = Math.min(...this.flatTuples);
    const maxV = Math.max(...this.flatTuples);
    const domain = [Math.min(0, minV), Math.max(0, maxV)];
    const sR = d3.scaleLinear().rangeRound([0, r]).domain(domain);
    const center = { x: width / 2, y: height / 2 - (n % 2 === 1 ? ((Math.cos(Math.PI / n) * r - r) / 2) : 0) };

    this.host.innerHTML = "";
    const svg = d3.create("svg").attr("width", this.contentRect.width).attr("height", this.contentRect.height);
    const root = svg.append("g").attr("transform", `translate(${this.margin.l}, ${this.margin.t})`);

    for (let i = 0; i <= this.levels; i += 1) {
      const lr = r * (i / this.levels);
      const pts = d3.range(0, n).map((j) => {
        const t = (j * 2 * Math.PI) / n - Math.PI / 2;
        return [center.x + lr * Math.cos(t), center.y + lr * Math.sin(t)];
      });
      root.append("polygon")
        .attr("points", pts.map((p) => p.join(",")).join(" "))
        .attr("fill", "none")
        .attr("stroke", "#d1d5db");
    }

    this.data.items.forEach((item, i) => {
      const t = (i * 2 * Math.PI) / n - Math.PI / 2;
      const x2 = center.x + r * Math.cos(t);
      const y2 = center.y + r * Math.sin(t);
      root.append("line")
        .attr("x1", center.x)
        .attr("y1", center.y)
        .attr("x2", x2)
        .attr("y2", y2)
        .attr("stroke", "#d1d5db");
      root.append("text")
        .attr("x", center.x + (r + 16) * Math.cos(t))
        .attr("y", center.y + (r + 16) * Math.sin(t))
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-size", 12)
        .attr("fill", "#374151")
        .text(item.name);
    });

    this.abscissKeys.forEach((key) => {
      // Conversion valeur -> rayon, puis conversion polaire -> cartesienne.
      const pts = this.data.items.map((item, i) => {
        const d = item.data[key].d;
        const t = (i * 2 * Math.PI) / n - Math.PI / 2;
        return {
          x: center.x + sR(d) * Math.cos(t),
          y: center.y + sR(d) * Math.sin(t),
          d,
          color: item.data[key].color || "#64748b"
        };
      });

      root.append("polygon")
        .attr("points", pts.map((p) => `${p.x},${p.y}`).join(" "))
        .attr("fill", pts[0].color)
        .attr("fill-opacity", 0.25)
        .attr("stroke", pts[0].color)
        .attr("stroke-width", 1.5);

      pts.forEach((p, idx) => {
        root.append("circle")
          .attr("cx", p.x)
          .attr("cy", p.y)
          .attr("r", 4)
          .attr("fill", p.color)
          .append("title")
          .text(`${this.data.items[idx].name} - ${key}: ${buildConverter(this.data.items[idx].data[key])(p.d)}`);
      });
    });

    this.host.appendChild(svg.node());
  }
}

class MultiRadarChartEChartsStandalone extends MultiRadarChartStandalone {
  draw() {
    this.host.innerHTML = "";
    const maxV = Math.max(...this.flatTuples);
    const chart = chartInstance(this.host);

    // ECharts equivalent: radar indicator par item + serie par cle.
    chart.setOption({
      animation: true,
      legend: { top: 0, data: this.abscissKeys },
      tooltip: { trigger: "item" },
      radar: {
        radius: "62%",
        indicator: this.data.items.map((item) => ({ name: item.name, max: maxV * 1.1 })),
        splitNumber: 3,
        axisName: { color: "#374151" },
        splitLine: { lineStyle: { color: "#d1d5db" } },
        splitArea: { areaStyle: { color: ["#ffffff", "#f8fafc"] } }
      },
      series: [{
        type: "radar",
        data: this.abscissKeys.map((key) => ({
          name: key,
          value: this.data.items.map((item) => item.data[key].d),
          areaStyle: { opacity: 0.2 },
          lineStyle: { width: 2 },
          symbolSize: 6
        }))
      }]
    });

    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(this.host);
  }
}

function render() {
  const d3Host = document.getElementById("d3Chart");
  const echartsHost = document.getElementById("echartsChart");
  new MultiRadarChartStandalone(d3Host, payload).draw();
  new MultiRadarChartEChartsStandalone(echartsHost, payload).draw();
}

render();
window.addEventListener("resize", render);
