// -----------------------------------------------------------------------------
// WATERFALL COMPARE - Variations successives entre items consecutifs
// -----------------------------------------------------------------------------
const payload = {
  keys: ["value"],
  items: [
    { uid: "m1", name: "Jan", data: { value: { title: "Valeur", d: 1200, color: "#2563eb", formatters: { value: { suffix: "k" } } } } },
    { uid: "m2", name: "Fev", data: { value: { title: "Valeur", d: 1500, color: "#10b981", formatters: { value: { suffix: "k" } } } } },
    { uid: "m3", name: "Mar", data: { value: { title: "Valeur", d: 900, color: "#ef4444", formatters: { value: { suffix: "k" } } } } },
    { uid: "m4", name: "Avr", data: { value: { title: "Valeur", d: 1800, color: "#10b981", formatters: { value: { suffix: "k" } } } } },
    { uid: "m5", name: "Mai", data: { value: { title: "Valeur", d: 1600, color: "#ef4444", formatters: { value: { suffix: "k" } } } } }
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

class WaterfallChartStandalone {
  constructor(host, data) {
    this.host = host;
    this.data = data;
    this.contentRect = { width: host.clientWidth, height: host.clientHeight };
  }

  get abscissKeys() {
    return this.data.keys;
  }

  get margin() {
    return { t: 30, b: 30, r: 10, l: 10 };
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
    // Reprise de la logique waterfall plateforme:
    // dp = valeur precedente, delta = d - dp, barH = amplitude de variation.
    const margin = this.margin;
    const { width, height } = this.innerSize;
    const n = this.abscissKeys.length;
    const N = this.data.items.length;
    const minV = Math.min(...this.flatTuples);
    const maxV = Math.max(...this.flatTuples);
    const domain = [Math.min(0, minV), Math.max(0, maxV)];
    const barSpacing = 8;
    const barWidth = Math.min(N === 1 ? 64 : 42, Math.max(width / (n * N) - barSpacing * 1.5, 2));
    const boxW = n * barWidth + (n - 1) * barSpacing;
    const itemMargin = Math.max(11, (width - N * boxW) / (N + 1));
    const wgt = boxW + itemMargin;
    const txAt = (i) => itemMargin / 2 + i * wgt;
    const lblMarginBottom = 12;
    const barsMarginBottom = 24;
    const sH = d3.scaleLinear().rangeRound([height - barsMarginBottom, 0]).domain(domain);

    this.host.innerHTML = "";
    const svg = d3.create("svg").attr("width", this.contentRect.width).attr("height", this.contentRect.height);
    const root = svg.append("g").attr("transform", `translate(${margin.l}, ${margin.t})`);

    this.data.items.forEach((item, i, items) => {
      const grp = root.append("g").attr("transform", `translate(${txAt(i)}, 0)`);
      grp.append("text")
        .attr("x", wgt / 2)
        .attr("y", height + 14)
        .attr("text-anchor", "middle")
        .attr("font-size", 12)
        .attr("fill", "#374151")
        .text(item.name);

      this.abscissKeys.forEach((k, j) => {
        const datum = item.data[k];
        if (!datum) return;
        const d = datum.d;
        const dp = i > 0 ? items[i - 1].data[k].d : 0;
        const rh = (v) => sH(0) - sH(v);
        // sign pilote couleur et etiquette d'evolution (hausse / baisse / stable).
        const sign = Math.sign(i * (d - dp));
        const tx = wgt / 2 - boxW / 2 + j * (barWidth + barSpacing);
        const by = sH(sign >= 0 ? d : dp);
        const ty = Math.min(0, rh(d));
        const barH = Math.abs(rh(d - dp));
        let textY = sH(d) - (((sign | 1) + (sign >> 1)) * lblMarginBottom);
        if (textY > height - lblMarginBottom) textY = sH(dp) - lblMarginBottom;

        const g = grp.append("g").attr("transform", `translate(${tx}, ${ty})`);
        g.append("rect")
          .attr("x", 0)
          .attr("y", by)
          .attr("width", barWidth)
          .attr("height", barH)
          .attr("rx", BAR_BORDER_RADIUS)
          .attr("ry", BAR_BORDER_RADIUS)
          .attr("fill", sign >= 0 ? "#10b981" : "#ef4444")
          .append("title")
          .text(`${datum.title || k}: ${buildConverter(datum)(d)} (delta ${buildConverter(datum)(d - dp)})`);

        if (i < items.length - 1) {
          g.append("line")
            .attr("x1", BAR_BORDER_RADIUS)
            .attr("x2", txAt(1) - txAt(0) + barWidth - BAR_BORDER_RADIUS)
            .attr("y1", sH(d))
            .attr("y2", sH(d))
            .attr("stroke", "#A0A0A0")
            .attr("stroke-dasharray", "3");
        }

        g.append("text")
          .attr("x", barWidth / 2)
          .attr("y", textY - 6)
          .attr("text-anchor", "middle")
          .attr("font-size", 12)
          .text(buildConverter(datum)(d));

        const evolution = sign > 0 ? `↗ (+${buildConverter(datum)(d - dp)})` : sign < 0 ? `↘ (${buildConverter(datum)(d - dp)})` : "(=)";
        g.append("text")
          .attr("x", barWidth / 2)
          .attr("y", textY + 8)
          .attr("text-anchor", "middle")
          .attr("font-size", 11)
          .text(evolution);
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

class WaterfallChartEChartsStandalone extends WaterfallChartStandalone {
  draw() {
    this.host.innerHTML = "";
    const key = this.abscissKeys[0];
    const values = this.data.items.map((item) => item.data[key].d);
    const converters = this.data.items.map((item) => buildConverter(item.data[key]));
    const base = values.map((v, i) => (i === 0 ? 0 : values[i - 1]));
    const delta = values.map((v, i) => (i === 0 ? v : v - values[i - 1]));
    const colors = delta.map((v) => (v >= 0 ? "#10b981" : "#ef4444"));
    const evolutionLabels = delta.map((d, i) => {
      if (i === 0) return "(=)";
      const conv = converters[i];
      if (d > 0) return `↗ (+${conv(d)})`;
      if (d < 0) return `↘ (${conv(d)})`;
      return "(=)";
    });
    const connectorData = values.slice(0, -1).map((v, i) => [i, i + 1, v]);
    const minV = Math.min(...values, ...base);
    const maxV = Math.max(...values, ...base);
    const pad = Math.max(1, Math.round((maxV - minV) * 0.08));
    const chart = chartInstance(this.host);

    // Equivalent ECharts proche du D3:
    // - stack base + variation
    // - labels valeur + evolution
    // - connecteurs pointilles entre colonnes
    chart.setOption({
      animation: true,
      animationDuration: 550,
      animationEasing: "cubicOut",
      grid: {
        top: 28, // un peu moins de marge pour compenser les labels d'evolution
        bottom: 34,
        left: 24,
        right: 24,
        containLabel: true
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params) => {
          const idx = params[0].dataIndex;
          const conv = converters[idx];
          const val = values[idx];
          const del = delta[idx];
          return `${this.data.items[idx].name}<br/>Valeur: ${conv(val)}<br/>Evolution: ${conv(del)}`;
        }
      },
      xAxis: {
        type: "category",
        data: this.data.items.map((it) => it.name),
        axisLine: { lineStyle: { color: "#d1d5db" } },
        axisLabel: { color: "#374151" }
      },
      yAxis: {
        type: "value",
        min: Math.min(0, minV) - pad,
        max: Math.max(0, maxV) + pad,
        axisLabel: {
          color: "#6b7280",
          formatter: (v) => converters[0](v)
        },
        axisLine: { show: true, lineStyle: { color: "#d1d5db" } },
        splitLine: { lineStyle: { color: "#eef2f7", type: "dashed" } }
      },
      series: [
        {
          name: "base",
          type: "bar",
          stack: "waterfall",
          itemStyle: { color: "transparent" },
          emphasis: { itemStyle: { color: "transparent" } }, // evite de surligner la partie transparente au hover
          silent: true,
          data: base
        },
        {
          name: "positive_bars",
          type: "bar",
          stack: "waterfall",
          barMaxWidth: 40,
          data: delta.map((v, i) => ({
            value: v >= 0 ? v : 0,
            itemStyle: { color: v >= 0 ? colors[i] : "transparent", borderRadius: [BAR_BORDER_RADIUS, BAR_BORDER_RADIUS, BAR_BORDER_RADIUS, BAR_BORDER_RADIUS] }
          })),
          label: {
            show: true,
            position: (p) => (p.value >= 0 ? "top" : "bottom"),
            distance: 8,
            color: "#111827",
            fontSize: 11,
            lineHeight: 14,
            formatter: (p) => {
              const idx = p.dataIndex;
              return delta[idx] >= 0 ? `${converters[idx](values[idx])}\n${evolutionLabels[idx]}` : "";
            }
          },
          markLine: {
            symbol: ["none", "none"],
            silent: true,
            label: { show: minV < 0, formatter: "0", color: "#6b7280" },
            lineStyle: { color: "#9ca3af", width: 1.1 },
            data: [{ yAxis: 0 }]
          }
        },
        {
          name: "negative_bars",
          type: "custom",
          silent: false,
          z: 3,
          data: delta,
          renderItem: (params, api) => {
            const idx = params.dataIndex;
            const d = delta[idx];
            if (d >= 0) return null;
            const b = base[idx];
            const p0 = api.coord([idx, b]);
            const p1 = api.coord([idx, b + d]);
            const x = p0[0] - 20;
            const y = Math.min(p0[1], p1[1]);
            const h = Math.abs(p1[1] - p0[1]);
            return {
              type: "rect",
              shape: { x, y, width: 40, height: h },
              style: { fill: colors[idx], stroke: colors[idx], lineWidth: 0 }
            };
          }
        },
        {
          name: "negative_labels",
          type: "custom",
          silent: true,
          z: 5,
          data: delta,
          renderItem: (params, api) => {
            const idx = params.dataIndex;
            const d = delta[idx];
            if (d >= 0) return null;
            const b = base[idx];
            const p0 = api.coord([idx, b]);
            const p1 = api.coord([idx, b + d]);
            const textX = p0[0];
            const textY = Math.min(p0[1], p1[1]) - 32;
            const textContent = `${converters[idx](values[idx])}\n${evolutionLabels[idx]}`;
            return {
              type: "group",
              children: [
                {
                  type: "text",
                  style: {
                    text: converters[idx](values[idx]),
                    x: textX,
                    y: textY,
                    fill: "#111827",
                    fontSize: 11,
                    textAlign: "center",
                    textVerticalAlign: "bottom"
                  }
                },
                {
                  type: "text",
                  style: {
                    text: evolutionLabels[idx],
                    x: textX,
                    y: textY + 14,
                    fill: "#111827",
                    fontSize: 11,
                    textAlign: "center",
                    textVerticalAlign: "top"
                  }
                }
              ]
            };
          }
        },
        {
          name: "connectors",
          type: "custom",
          silent: true,
          z: 4,
          data: connectorData,
          renderItem: (params, api) => {
            const from = api.value(0);
            const to = api.value(1);
            const y = api.value(2);
            const p0 = api.coord([from, y]);
            const p1 = api.coord([to, y]);
            return {
              type: "line",
              shape: {
                x1: p0[0] + 16,
                y1: p0[1],
                x2: p1[0] - 16,
                y2: p1[1]
              },
              style: {
                stroke: "#A0A0A0",
                lineWidth: 1.1,
                lineDash: [4, 3]
              }
            };
          }
        }
      ]
    });

    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(this.host);
  }
}

function render() {
  const d3Host = document.getElementById("d3Chart");
  const echartsHost = document.getElementById("echartsChart");
  new WaterfallChartStandalone(d3Host, payload).draw();
  new WaterfallChartEChartsStandalone(echartsHost, payload).draw();
}

render();
window.addEventListener("resize", render);
