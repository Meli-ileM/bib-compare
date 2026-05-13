// -----------------------------------------------------------------------------
// VBAR COMPARE - Donnees de test proches du format plateforme (single tuple)
// -----------------------------------------------------------------------------
const payload = {
  item: {
    uid: "report-template-vbar-demo",
    name: "Revenu median",
    keys: ["value", "reference", "delta"],
    data: {
      value: { title: "Valeur", d: 12450, color: "#2563eb", formatters: { value: { suffix: "EUR" } } },
      reference: { title: "Reference", d: 9800, color: "#10b981", formatters: { value: { suffix: "EUR" } } },
      delta: { title: "Delta", d: 2650, color: "#ef4444", formatters: { value: { suffix: "EUR" } } }
    }
  }
};

document.getElementById("payload").textContent = JSON.stringify(payload, null, 2);

const BAR_BORDER_RADIUS = 3;

// Reprend l'idee de formatter.ts: format numerique + suffixe unite.
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

class VBarChartStandalone {
  constructor(host, data) {
    this.host = host;
    this.item = data.item;
    this.contentRect = { width: host.clientWidth, height: host.clientHeight };
  }

  get abscissKeys() {
    return this.item.keys.filter((k) => this.item.data[k]?.d != null);
  }

  get hasNegative() {
    return this.abscissKeys.some((k) => this.item.data[k]?.d < 0);
  }

  get margin() {
    return { t: 26, b: this.hasNegative ? 20 : 10, r: 20, l: 20 };
  }

  get innerSize() {
    return {
      width: this.contentRect.width - this.margin.r - this.margin.l,
      height: this.contentRect.height - this.margin.t - this.margin.b
    };
  }

  get constants() {
    // Meme logique que vbar-chart.tsx:
    // sH mappe valeur -> coordonnee verticale SVG, domaine centre sur 0.
    const dOrd = this.abscissKeys;
    const items = dOrd.map((k) => this.item.data[k]);
    const h = this.innerSize.height;
    return {
      dOrd,
      items,
      barSpacing: 12,
      textMarginBottom: 5,
      sH: d3.scaleLinear().rangeRound([h, 0]).domain([
        Math.min(0, ...items.map((i) => i.d)),
        Math.max(0, ...items.map((i) => i.d))
      ])
    };
  }

  drawBars(root) {
    const { width } = this.innerSize;
    const { dOrd, items, sH, barSpacing, textMarginBottom } = this.constants;
    const n = items.length;
    const barWidth = Math.min(0.25 * width, 64);

    items.forEach((itm, i) => {
      // tx: position horizontale de la barre dans le groupe.
      // ty: decalage pour gerer les valeurs negatives (barre vers le bas).
      // barH: hauteur absolue entre sH(0) et sH(d).
      const tx = width / 2 + (i - n / 2) * (barWidth + barSpacing) + barSpacing / 2;
      const ty = Math.min(0, sH(0) - sH(itm.d));
      const barH = Math.abs(sH(0) - sH(itm.d));
      const textY = sH(itm.d) - textMarginBottom;

      const g = root.append("g").attr("transform", `translate(${tx}, ${ty})`);
      g.append("rect")
        .attr("x", 0)
        .attr("y", sH(itm.d))
        .attr("width", barWidth)
        .attr("height", barH)
        .attr("rx", BAR_BORDER_RADIUS)
        .attr("ry", BAR_BORDER_RADIUS)
        .attr("fill", itm.color || "#64748b")
        .append("title")
        .text(`${itm.title || dOrd[i]}: ${buildConverter(itm)(itm.d)}`);

      g.append("text")
        .attr("x", barWidth / 2)
        .attr("y", textY)
        .attr("text-anchor", "middle")
        .attr("font-size", 14)
        .attr("fill", "#111827")
        .text(buildConverter(itm)(itm.d));
    });
  }

  drawOrigin(root) {
    const { width } = this.innerSize;
    const { sH } = this.constants;
    const g = root.append("g").attr("transform", `translate(0, ${sH(0)})`);
    g.append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", 0)
      .attr("y2", 0)
      .attr("stroke", "#9ca3af")
      .attr("stroke-width", 1.2);
    g.append("text")
      .attr("x", 0)
      .attr("y", -3)
      .attr("font-size", 11)
      .attr("fill", "#6b7280")
      .text("0");
  }

  draw() {
    this.host.innerHTML = "";
    const svg = d3.create("svg")
      .attr("width", this.contentRect.width)
      .attr("height", this.contentRect.height);
    const root = svg.append("g")
      .attr("transform", `translate(${this.margin.l}, ${this.margin.t})`);

    if (this.hasNegative) this.drawOrigin(root);
    this.drawBars(root);
    this.host.appendChild(svg.node());
  }
}

class VBarChartEChartsStandalone extends VBarChartStandalone {
  draw() {
    this.host.innerHTML = "";
    const { dOrd, items } = this.constants;
    const values = items.map((i) => i.d);
    const minV = Math.min(0, ...values);
    const maxV = Math.max(0, ...values);
    const pad = Math.max(1, Math.round((maxV - minV) * 0.08));
    const chart = chartInstance(this.host);

    // Configuration ECharts qui garde la meme intention metier:
    // meme domaine Y, meme labels de valeur, meme ligne de zero.
    chart.setOption({
      animation: true,
      grid: {
        top: this.margin.t,
        bottom: this.margin.b,
        left: this.margin.l,
        right: this.margin.r,
        containLabel: true
      },
      tooltip: {
        trigger: "item",
        formatter: (p) => {
          const item = items[p.dataIndex];
          return `${item.title || dOrd[p.dataIndex]}: ${buildConverter(item)(item.d)}`;
        }
      },
      xAxis: {
        type: "category",
        data: items.map((i) => i.title || ""),
        axisLabel: { color: "#374151" }
      },
      yAxis: {
        type: "value",
        min: minV - pad,
        max: maxV + pad,
        axisLabel: {
          color: "#6b7280",
          formatter: (v) => buildConverter(items[0])(v)
        },
        splitLine: { lineStyle: { color: "#eef2f7", type: "dashed" } }
      },
      series: [{
        type: "bar",
        data: items.map((i) => ({
          value: i.d,
          itemStyle: {
            color: i.color || "#64748b",
            borderRadius: [BAR_BORDER_RADIUS, BAR_BORDER_RADIUS, 0, 0]
          }
        })),
        barMaxWidth: 64,
        label: {
          show: true,
          position: (p) => (p.value >= 0 ? "top" : "bottom"),
          color: "#111827",
          fontSize: 14,
          formatter: (p) => buildConverter(items[p.dataIndex])(p.value)
        },
        markLine: {
          symbol: ["none", "none"],
          silent: true,
          label: { show: this.hasNegative, formatter: "0", color: "#6b7280" },
          lineStyle: { color: "#9ca3af", width: 1.1 },
          data: [{ yAxis: 0 }]
        }
      }]
    });

    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(this.host);
  }
}

function render() {
  const d3Host = document.getElementById("d3Chart");
  const echartsHost = document.getElementById("echartsChart");
  new VBarChartStandalone(d3Host, payload).draw();
  new VBarChartEChartsStandalone(echartsHost, payload).draw();
}

render();
window.addEventListener("resize", render);
