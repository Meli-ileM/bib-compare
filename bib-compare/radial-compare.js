// -----------------------------------------------------------------------------
// RADIAL COMPARE - Arcs concentriques independants (single tuple)
// -----------------------------------------------------------------------------
const payload = {
  item: {
    uid: "radial-demo",
    name: "Synthèse capacite",
    keys: ["value", "reference", "objectif"],
    data: {
      value: { title: "Valeur", d: 0.72, color: "#2563eb", formatters: { value: { suffix: "%" } } },
      reference: { title: "Reference", d: 0.58, color: "#10b981", formatters: { value: { suffix: "%" } } },
      objectif: { title: "Objectif", d: 0.9, color: "#f59e0b", formatters: { value: { suffix: "%" } } }
    }
  }
};

document.getElementById("payload").textContent = JSON.stringify(payload, null, 2);

function buildConverter(from) {
  const suffix = from?.formatters?.value?.suffix || "";
  const formatter = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
  return (value) => {
    if (value == null) return "";
    const asPercent = suffix === "%" ? value * 100 : value;
    const base = formatter.format(asPercent);
    return suffix ? `${base}${suffix === "%" ? suffix : ` ${suffix}`}` : base;
  };
}

function chartInstance(host) {
  const existing = echarts.getInstanceByDom(host);
  if (existing) existing.dispose();
  return echarts.init(host);
}

class RadialChartStandalone {
  constructor(host, data) {
    this.host = host;
    this.item = data.item;
    this.contentRect = { width: host.clientWidth, height: host.clientHeight };
  }

  get abscissKeys() {
    return this.item.keys.filter((k) => this.item.data[k]?.d != null);
  }

  get margin() {
    return { t: 10, b: 10, r: 10, l: 10 }; // Pas de marge pour le radial, on utilise tout l'espace disponible
  }

  get innerSize() {
    return {
      width: this.contentRect.width - this.margin.r - this.margin.l,
      height: this.contentRect.height - this.margin.t - this.margin.b
    };
  }

  drawBars(root) {
    // Meme base que radial.tsx:
    // sTeta convertit [0..1] en angle [0..2PI], un arc par cle.
    const { width, height } = this.innerSize;
    const r = Math.min(width / 2, height / 2);
    const barThickness = 9;
    const barSpacing = 4;
    const sTeta = d3.scaleLinear().range([0, 2 * Math.PI]).domain([0, 1]);

    this.abscissKeys.forEach((k, i) => {
      const itm = this.item.data[k];
      const dr = i * (barSpacing + barThickness);
      const arcPath = d3.arc()({
        innerRadius: r - dr - barThickness,
        outerRadius: r - dr,
        startAngle: 0,
        endAngle: sTeta(itm.d)
      });

      const g = root.append("g").attr("transform", `translate(${width / 2}, ${height / 2})`);
      g.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", r - barThickness / 2 - dr)
        .attr("fill", "none")
        .attr("stroke", "#f0f0f0");
      g.append("path")
        .attr("d", arcPath)
        .attr("fill", itm.color || "#64748b")
        .append("title")
        .text(`${itm.title || k}: ${buildConverter(itm)(itm.d)}`);
      g.append("text")
        .attr("x", 0)
        .attr("y", -8 + i * 16)
        .attr("text-anchor", "middle")
        .attr("font-size", 15)
        .attr("font-weight", "700")
        .attr("fill", "#111827")
        .text(`${itm.title || k}: ${buildConverter(itm)(itm.d)}`);
    });
  }

  draw() {
    this.host.innerHTML = "";
    const svg = d3.create("svg").attr("width", this.contentRect.width).attr("height", this.contentRect.height);
    const root = svg.append("g").attr("transform", `translate(${this.margin.l}, ${this.margin.t})`);
    this.drawBars(root);
    this.host.appendChild(svg.node());
  }
}

class RadialChartEChartsStandalone extends RadialChartStandalone {
  draw() {
    this.host.innerHTML = "";
    const keys = this.abscissKeys;
    const chart = chartInstance(this.host);

    // Equivalent ECharts: une jauge circulaire par cle, superposee par rayon.
    chart.setOption({
      animation: true,
      series: keys.map((key, i) => {
        const itm = this.item.data[key];
        const radius = `${88 - i * 16}%`; // Espacement de 16% entre les jauges, pour un max de 3 jauges dans cet exemple.
        return {
          type: "gauge",
          min: 0,
          max: 1,
          startAngle: 90,
          endAngle: -270,
          radius,
          pointer: { show: false },
          progress: {
            show: true,
            roundCap: true,
            width: 10,
            itemStyle: { color: itm.color || "#64748b" }
          },
          axisLine: {
            roundCap: true,
            lineStyle: {
              width: 10,
              color: [[1, "#edf2f7"]]
            }
          },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          title: { show: false },
          detail: {
            valueAnimation: true,
            offsetCenter: [0, `${-42 + i * 13}%`],
            color: "#111827",
            fontSize: 14,
            formatter: () => `${itm.title || key}: ${buildConverter(itm)(itm.d)}`
          },
          data: [{ value: itm.d }]
        };
      })
    });

    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(this.host);
  }
}

function render() {
  const d3Host = document.getElementById("d3Chart");
  const echartsHost = document.getElementById("echartsChart");
  new RadialChartStandalone(d3Host, payload).draw();
  new RadialChartEChartsStandalone(echartsHost, payload).draw();
}

render();
window.addEventListener("resize", render);
