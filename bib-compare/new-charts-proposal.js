/* ════════════════════════════════════════════════════════════════════════
   new-charts-proposal.js — 12 graphiques ECharts avec données GME réalistes
   ════════════════════════════════════════════════════════════════════════ */

/* ── Chart instance registry ── */
window._charts = {};  // { id: { instance: EChartsInstance, name: string } }

/* ── Export helpers ── */
function exportChart(id, filename) {
  const entry = window._charts[id];
  if (!entry) { alert('Graphique introuvable : ' + id); return; }
  const btn = document.querySelector(`[onclick*="'${id}'"]`);
  if (btn) { btn.textContent = '…'; btn.style.pointerEvents = 'none'; }

  // pixelRatio 2 = résolution double pour les présentations
  const dataUrl = entry.instance.getDataURL({
    type: 'png',
    pixelRatio: 2,
    backgroundColor: '#0f172a'
  });

  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `GME-${filename}-${new Date().toISOString().slice(0,10)}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  if (btn) {
    btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/></svg> Exporté !`;
    btn.style.color = '#34d399';
    btn.style.borderColor = '#34d399';
    btn.style.pointerEvents = 'auto';
    setTimeout(() => {
      btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/><path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/></svg> Exporter PNG`;
      btn.style.color = '';
      btn.style.borderColor = '';
    }, 2000);
  }
}

function exportAll() {
  const ids = Object.keys(window._charts);
  if (!ids.length) { alert('Aucun graphique chargé'); return; }
  // Décalage de 300ms entre chaque pour éviter le spam de téléchargement
  ids.forEach((id, i) => {
    setTimeout(() => exportChart(id, window._charts[id].name), i * 350); 
  });
}

/* ── Helpers ── */
function initChart(id, exportName) {
  const el = document.getElementById(id);
  if (!el) return null;
  const instance = echarts.init(el, 'dark');
  window._charts[id] = { instance, name: exportName || id };
  return instance;
}

function showPayload(id, data) {
  const el = document.getElementById('payload-' + id);
  if (el) el.textContent = JSON.stringify(data, null, 2);
}

/* ── Shared design tokens ── */
const FONT   = "'Segoe UI', system-ui, sans-serif";
const ANIM   = { duration: 900, easing: 'cubicOut' };
const GRID   = { top: 32, right: 20, bottom: 48, left: 60, containLabel: true };
const COLORS = ['#3b82f6','#10b981','#f59e0b','#f43f5e','#8b5cf6','#06b6d4','#f97316','#ec4899'];

const AXIS_STYLE = {
  axisLine: { lineStyle: { color: '#334155' } },
  splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
  axisLabel: { color: '#64748b', fontFamily: FONT, fontSize: 11 },
  axisTick:  { lineStyle: { color: '#334155' } },
};
const TOOLTIP = {
  backgroundColor: '#1e293b',
  borderColor: '#334155',
  borderWidth: 1,
  textStyle: { color: '#f1f5f9', fontFamily: FONT, fontSize: 13 },
  extraCssText: 'box-shadow:0 8px 24px rgba(0,0,0,.5);border-radius:8px;'
};

/* ════════════════════════════════════════════════════════════════════════
   01 — SCATTER  (Corrélation IRI × Taux dégradation)
   ════════════════════════════════════════════════════════════════════════ */
(function() {
  const payload = {
    keys: ['iri_score', 'degradation_rate'],
    items: [
      { uid:'z01', name:'Centre-ville',     data:{ iri_score:{ d:72 }, degradation_rate:{ d:18 } } },
      { uid:'z02', name:'Périphérie Nord',  data:{ iri_score:{ d:45 }, degradation_rate:{ d:52 } } },
      { uid:'z03', name:'Zone Industrielle',data:{ iri_score:{ d:38 }, degradation_rate:{ d:61 } } },
      { uid:'z04', name:'Résidentiel Est',  data:{ iri_score:{ d:81 }, degradation_rate:{ d:12 } } },
      { uid:'z05', name:'Rocade Sud',       data:{ iri_score:{ d:29 }, degradation_rate:{ d:74 } } },
      { uid:'z06', name:'Commerce Ouest',   data:{ iri_score:{ d:66 }, degradation_rate:{ d:24 } } },
      { uid:'z07', name:'Rural A',          data:{ iri_score:{ d:54 }, degradation_rate:{ d:38 } } },
      { uid:'z08', name:'Rural B',          data:{ iri_score:{ d:48 }, degradation_rate:{ d:45 } } },
      { uid:'z09', name:'Zone Scolaire',    data:{ iri_score:{ d:77 }, degradation_rate:{ d:15 } } },
      { uid:'z10', name:'Tourisme',         data:{ iri_score:{ d:62 }, degradation_rate:{ d:29 } } },
      { uid:'z11', name:'Logistique',       data:{ iri_score:{ d:33 }, degradation_rate:{ d:68 } } },
      { uid:'z12', name:'Port Fluvial',     data:{ iri_score:{ d:41 }, degradation_rate:{ d:57 } } },
    ]
  }; 

  // Build scatter series per quadrant
  function quadrant(item) {
    const x = item.data.iri_score.d;
    const y = item.data.degradation_rate.d;
    if (x >= 60 && y <= 35) return 0; // vert : bon état
    if (x <  60 && y >  35) return 1; // rouge : double risque
    return 2;                          // orange : risque partiel
  }
  const pts = payload.items.map(it => ({
    name: it.name,
    value: [it.data.iri_score.d, it.data.degradation_rate.d],
    q: quadrant(it)
  }));

  const qColors = ['#10b981','#f43f5e','#f59e0b'];
  const qNames  = ['Bon état (IRI ≥ 60 & Dégr. ≤ 35)','Double risque','Risque partiel'];

  // Linear regression
  const xs = pts.map(p => p.value[0]), ys = pts.map(p => p.value[1]);
  const n = xs.length;
  const mx = xs.reduce((a,b)=>a+b)/n, my = ys.reduce((a,b)=>a+b)/n;
  const num = xs.reduce((s,x,i)=>s+(x-mx)*(ys[i]-my),0);
  const den = xs.reduce((s,x)=>s+(x-mx)**2,0);
  const slope = num/den, intercept = my - slope*mx;
  const trendData = [[10, 10*slope+intercept],[95, 95*slope+intercept]];

  const chart = initChart('chart-scatter', 'Correlation-IRI-Degradation');
  if (!chart) return;

  chart.setOption({
    backgroundColor:'#0f172a',
    animation: true, animationDuration: ANIM.duration, animationEasing: ANIM.easing,
    tooltip: { ...TOOLTIP,
      formatter: p => `<b>${p.name}</b><br>IRI : ${p.value[0]}<br>Dégradation : ${p.value[1]} %`
    },
    legend: {
      data: qNames, bottom: 4, textStyle: { color:'#94a3b8', fontSize:11, fontFamily:FONT },
      icon:'circle', itemWidth:8
    },
    xAxis: { ...AXIS_STYLE, name:'Score IRI', nameLocation:'middle', nameGap:28, min:0, max:100,
      nameTextStyle:{ color:'#64748b', fontSize:11 },
      markLine:{}
    },
    yAxis: { ...AXIS_STYLE, name:'Taux dégradation (%)', nameGap:8, min:0, max:100,
      nameTextStyle:{ color:'#64748b', fontSize:11 }
    },
    grid: { top:12, right:16, bottom:60, left:16, containLabel:true },
    series: [
      // Quadrant backgrounds
      { type:'custom', silent:true, animation:false,
        renderItem: (params, api) => ({
          type:'group', children:[
            { type:'rect', shape:{ x: api.coord([60,35])[0], y: api.coord([60,100])[1],
                width: api.coord([100,35])[0]-api.coord([60,35])[0],
                height: api.coord([60,0])[1]-api.coord([60,35])[1] },
              style:{ fill:'rgba(16,185,129,.06)' } },
            { type:'rect', shape:{ x: api.coord([0,35])[0], y: api.coord([0,100])[1],
                width: api.coord([60,35])[0]-api.coord([0,35])[0],
                height: api.coord([0,0])[1]-api.coord([0,35])[1] },
              style:{ fill:'rgba(244,63,94,.06)' } },
          ]
        }),
        data:[[0,0]]
      },
      // Quadrant markLines
      { type:'line', silent:true, animation:false,
        markLine:{ symbol:['none','none'], lineStyle:{ color:'#334155', type:'dashed', width:1 },
          label:{ show:false },
          data:[ [{ xAxis:60 },{ xAxis:60 }], [{ yAxis:35 },{ yAxis:35 }] ] },
        data:[]
      },
      // Trend line
      { type:'line', name:'Tendance', data: trendData,
        smooth:false, symbol:'none',
        lineStyle:{ color:'rgba(139,92,246,.5)', width:2, type:'dashed' },
        emphasis:{ disabled:true }
      },
      // Scatter groups
      ...qNames.map((name, qi) => ({
        type:'scatter', name, symbolSize: 9,
        data: pts.filter(p=>p.q===qi).map(p=>({ name:p.name, value:p.value })),
        itemStyle:{ color: qColors[qi], borderColor: '#0f172a', borderWidth:1.5 },
        emphasis:{ itemStyle:{ borderWidth:2, shadowBlur:8, shadowColor:qColors[qi] } }
      }))
    ]
  });

  showPayload('scatter', payload);
})();

/* ════════════════════════════════════════════════════════════════════════
   02 — HEATMAP  (Matrice zones × indicateurs)
   ════════════════════════════════════════════════════════════════════════ */
(function() {
  const zones = ['Zone A — Centre','Zone B — Nord','Zone C — Est','Zone D — Périph.','Zone E — Indus.','Zone F — Rural','Zone G — Résid.','Zone H — Rocade'];
  const indicators = ['IRI','Qualité insp.','Dégradations','Inspection','Âge revêt.','Budget'];
  const raw = [
    [70,62,61,95,72,60],[45,51,38,72,34,41],[88,79,85,100,88,74],
    [22,18,12,48,15,22],[34,42,25,60,28,55],[56,60,55,81,52,33],
    [67,71,63,88,66,48],[14,20,8,35,10,18]
  ];

  const data = [];
  raw.forEach((row, zi) => row.forEach((v, ii) => data.push([ii, zi, v])));

  const payload = {
    keys: indicators,
    items: zones.map((name, zi) => ({
      uid: 'zone-' + zi, name,
      data: Object.fromEntries(indicators.map((k, ii) => [k, { d: raw[zi][ii], color: null }]))
    }))
  };

  const chart = initChart('chart-heatmap', 'Heatmap-Zones-Indicateurs');
  if (!chart) return;

  chart.setOption({
    backgroundColor:'#0f172a',
    animation: true, animationDuration: ANIM.duration,
    tooltip: { ...TOOLTIP,
      formatter: p => {
        const z = zones[p.value[1]], ind = indicators[p.value[0]], v = p.value[2];
        const emoji = v >= 70 ? '🟢' : v >= 50 ? '🟡' : '🔴';
        return `<b>${z}</b><br>${ind} : <b>${v}/100</b> ${emoji}`;
      }
    },
    grid: { top:8, right:16, bottom:8, left:8, containLabel:true },
    xAxis: { type:'category', data: indicators,
      axisLabel:{ color:'#94a3b8', fontSize:11, fontFamily:FONT, rotate:0 },
      axisLine:{ lineStyle:{ color:'#334155' } },
      axisTick:{ show:false },
      splitArea:{ show:true, areaStyle:{ color:['rgba(255,255,255,.01)','transparent'] } }
    },
    yAxis: { type:'category', data: zones,
      axisLabel:{ color:'#94a3b8', fontSize:11, fontFamily:FONT },
      axisLine:{ lineStyle:{ color:'#334155' } },
      axisTick:{ show:false }
    },
    visualMap: {
      min:0, max:100, calculable:true, orient:'horizontal',
      left:'center', bottom:0,
      inRange:{ color:['#f43f5e','#f59e0b','#10b981'] },
      textStyle:{ color:'#94a3b8', fontSize:11 },
      itemWidth:120, itemHeight:10
    },
    series: [{
      type:'heatmap', data,
      label:{ show:true, color:'#fff', fontSize:11, fontWeight:600, fontFamily:FONT },
      emphasis:{ itemStyle:{ shadowBlur:10, shadowColor:'rgba(0,0,0,.5)' } },
      itemStyle:{ borderColor:'#0f172a', borderWidth:2, borderRadius:4 }
    }]
  });

  showPayload('heatmap', payload);
})();

/* ════════════════════════════════════════════════════════════════════════
   03 — STACKED AREA  (Budget travaux pluriannuel)
   ════════════════════════════════════════════════════════════════════════ */
(function() {
  const years = ['2019','2020','2021','2022','2023','2024'];
  const categories = [
    { name:'Revêtement',  color:'#3b82f6', data:[1200,1050,1380,1520,1690,1840] },
    { name:'Structure',   color:'#8b5cf6', data:[680,  720,  640,  810,  870,  920] },
    { name:'Signalisation',color:'#10b981', data:[220,  195,  240,  260,  290,  310] },
    { name:'Entretien courant',color:'#f59e0b', data:[480,  510,  460,  530,  560,  590] },
  ];

  const payload = {
    keys: categories.map(c => c.name.toLowerCase().replace(/ /g,'_')),
    items: years.map((y, yi) => ({
      uid: y, name: y,
      data: Object.fromEntries(categories.map(c => [
        c.name.toLowerCase().replace(/ /g,'_'),
        { d: c.data[yi], title: c.name, color: c.color, formatters:{ value:{ suffix:'k€' } } }
      ]))
    }))
  };

  const chart = initChart('chart-area', 'Budget-Travaux-Pluriannuel');
  if (!chart) return;

  chart.setOption({
    backgroundColor:'#0f172a',
    animation: true, animationDuration: ANIM.duration,
    tooltip: { ...TOOLTIP, trigger:'axis', axisPointer:{ type:'cross', lineStyle:{ color:'#334155' } },
      formatter: params => {
        const year = params[0].name;
        const total = params.reduce((s,p) => s + p.value, 0);
        return `<b>${year}</b><br>${params.map(p =>
          `${p.marker}${p.seriesName} : <b>${p.value} k€</b>`).join('<br>')}
          <br><hr style="border-color:#334155;margin:4px 0">Total : <b>${total} k€</b>`;
      }
    },
    legend: { data: categories.map(c=>c.name), bottom:0,
      textStyle:{ color:'#94a3b8', fontSize:11, fontFamily:FONT }, icon:'roundRect', itemWidth:14 },
    grid: { top:12, right:16, bottom:56, left:16, containLabel:true },
    xAxis: { ...AXIS_STYLE, type:'category', data: years,
      boundaryGap:false },
    yAxis: { ...AXIS_STYLE, name:'Budget (k€)', nameTextStyle:{ color:'#64748b', fontSize:11 } },
    series: categories.map(c => ({
      type:'line', name: c.name, data: c.data,
      smooth: true, stack:'total',
      areaStyle:{ color: c.color, opacity:.25 },
      lineStyle:{ color: c.color, width:2 },
      itemStyle:{ color: c.color },
      symbol:'circle', symbolSize:5,
      emphasis:{ focus:'series' }
    }))
  });

  showPayload('area', payload);
})();

/* ════════════════════════════════════════════════════════════════════════
   04 — CALENDAR  (Activité inspection 2024)
   ════════════════════════════════════════════════════════════════════════ */
(function() {
  function pad(n){ return String(n).padStart(2,'0'); }
  const calData = [];
  // Simulate spring campaign (mars-mai) and autumn (sept-nov) with some gaps
  for (let m = 1; m <= 12; m++) {
    const days = new Date(2024,m,0).getDate();
    for (let d = 1; d <= days; d++) {
      const date = `2024-${pad(m)}-${pad(d)}`;
      let val = 0;
      if ((m >= 3 && m <= 5) || (m >= 9 && m <= 11)) {
        // Campaign months: weekdays only, with variation
        const dow = new Date(2024,m-1,d).getDay();
        if (dow > 0 && dow < 6) {
          const base = (m === 3 || m === 9) ? 3 : (m === 5 || m === 11) ? 4 : 6;
          val = Math.max(0, Math.round(base + (Math.random()-0.3)*3));
        }
      } else if (m === 6 || m === 7 || m === 8) {
        // Summer: occasional light activity
        const dow = new Date(2024,m-1,d).getDay();
        if (dow === 2 && Math.random() > 0.5) val = 1;
      }
      if (val > 0) calData.push([date, val]);
    }
  }

  const payload = {
    item: {
      uid: 'inspection-2024', name: 'Inspections terrain 2024',
      keys: ['count'],
      data: Object.fromEntries(calData.map(([date,v]) => [date, {
        d: v, title: 'Inspections', formatters:{ value:{ suffix:' tronçons' } }
      }]))
    }
  };

  const chart = initChart('chart-calendar', 'Calendrier-Inspections-2024');
  if (!chart) return;

  chart.setOption({
    backgroundColor:'#0f172a',
    animation: true, animationDuration: ANIM.duration,
    tooltip: { ...TOOLTIP,
      formatter: p => {
        if (!p.value) return '';
        const [date, val] = Array.isArray(p.value) ? p.value : [p.data[0], p.data[1]];
        return `<b>${date}</b><br>Tronçons inspectés : <b>${val}</b>`;
      }
    },
    visualMap: {
      min:0, max:8, type:'piecewise',
      pieces:[
        { value:0, color:'#1e293b', label:'Aucun' },
        { min:1, max:3, color:'#0ea5e9', label:'1–3' },
        { min:4, max:6, color:'#3b82f6', label:'4–6' },
        { min:7, color:'#8b5cf6', label:'7+' }
      ],
      orient:'horizontal', bottom:6, left:'center',
      textStyle:{ color:'#94a3b8', fontSize:11 },
      itemWidth:12, itemHeight:12
    },
    calendar: {
      top:20, left:36, right:10, bottom:52,
      range:'2024',
      cellSize:['auto', 'auto'],
      splitLine:{ lineStyle:{ color:'#0f172a', width:2 } },
      itemStyle:{ borderWidth:2, borderColor:'#0f172a', borderRadius:2 },
      yearLabel:{ show:false },
      monthLabel:{ color:'#64748b', fontSize:11, fontFamily:FONT },
      dayLabel:{ color:'#64748b', fontSize:10, fontFamily:FONT, firstDay:1,
        nameMap:['Di','Lu','Ma','Me','Je','Ve','Sa'] }
    },
    series: [{
      type:'heatmap', coordinateSystem:'calendar',
      data: calData,
      emphasis:{ itemStyle:{ shadowBlur:10, shadowColor:'rgba(59,130,246,.8)' } }
    }]
  });

  showPayload('calendar', payload);
})();

/* ════════════════════════════════════════════════════════════════════════
   05 — TREEMAP  (Budget hiérarchique)
   ════════════════════════════════════════════════════════════════════════ */
(function() {
  const payload = {
    keys: ['budget'],
    items: [{
      uid:'prog-voirie', name:'Voirie', data:{ budget:{ d:4850, color:'#3b82f6', formatters:{ value:{ suffix:'k€' } } } },
      children:[
        { uid:'sp-chaussee', name:'Chaussées 2 200 k€', value:2200 },
        { uid:'sp-trottoir', name:'Trottoirs 1 100 k€', value:1100 },
        { uid:'sp-equipements', name:'Équipements 730 k€', value:730 },
        { uid:'sp-signal', name:'Signalisation 820 k€', value:820 },
      ]
    },{
      uid:'prog-reseaux', name:'Réseaux', data:{ budget:{ d:3120, color:'#8b5cf6', formatters:{ value:{ suffix:'k€' } } } },
      children:[
        { uid:'sp-eau', name:'Eau potable 1 480 k€', value:1480 },
        { uid:'sp-assaini', name:'Assainissement 940 k€', value:940 },
        { uid:'sp-elec', name:'Électrique 700 k€', value:700 },
      ]
    },{
      uid:'prog-bat', name:'Bâtiments', data:{ budget:{ d:2030, color:'#10b981', formatters:{ value:{ suffix:'k€' } } } },
      children:[
        { uid:'sp-scolaire', name:'Scolaire 920 k€', value:920 },
        { uid:'sp-culture', name:'Culturel 640 k€', value:640 },
        { uid:'sp-sport', name:'Sportif 470 k€', value:470 },
      ]
    }]
  };

  const buildTree = items => items.map(item => ({
    name: item.name,
    value: item.data ? item.data.budget.d : item.value,
    itemStyle: { borderRadius: item.children ? 6 : 3 },
    children: item.children ? item.children.map(c => ({ name: c.name, value: c.value })) : undefined
  }));

  const chart = initChart('chart-treemap', 'Treemap-Budget-Hierarchique');
  if (!chart) return;

  chart.setOption({
    backgroundColor:'#0f172a',
    animation: true, animationDuration: ANIM.duration,
    tooltip: { ...TOOLTIP,
      formatter: p => `<b>${p.name}</b><br>Budget : <b>${p.value} k€</b>`
    },
    series: [{
      type:'treemap', roam:false,
      data: buildTree(payload.items),
      top:8, bottom:8, left:8, right:8,
      label:{ show:true, color:'#fff', fontSize:12, fontWeight:600, fontFamily:FONT,
        formatter: p => p.value >= 400 ? `▶ ${p.name}` : '' },
      breadcrumb:{ show:false },
      levels:[
        { itemStyle:{ borderColor:'#0f172a', borderWidth:3, gapWidth:3, borderRadius:8 },
          upperLabel:{ show:true, color:'#fff', fontSize:14, fontWeight:700, fontFamily:FONT, height:28,
            backgroundColor:'rgba(0,0,0,.35)' }
        },
        { colorSaturation:[.4,.8],
          itemStyle:{ borderColorSaturation:.7, gapWidth:2, borderWidth:2, borderRadius:4 },
          label:{ show:true, fontSize:11 }
        }
      ],
      colorBy:'id',
      color:['#3b82f6','#8b5cf6','#10b981']
    }]
  });

  showPayload('treemap', payload);
})();

/* ════════════════════════════════════════════════════════════════════════
   06 — SUNBURST  (Hiérarchie territoriale)
   ════════════════════════════════════════════════════════════════════════ */
(function() {
  function scoreColor(s){ return s>=70?'#10b981':s>=55?'#f59e0b':'#f43f5e'; }

  const payload = {
    territory:'Département 69',
    hierarchy:[
      { uid:'epci-a', name:'CC Rhône Sud', score:68, communes:[
        { uid:'c01', name:'Givors', score:61 }, { uid:'c02', name:'Grigny', score:73 },
        { uid:'c03', name:'Chasse-sur-Rhône', score:58 }, { uid:'c04', name:'Loire/Rhône', score:79 }
      ]},
      { uid:'epci-b', name:'Est Lyonnais', score:72, communes:[
        { uid:'c05', name:'Bron', score:82 }, { uid:'c06', name:'Vénissieux', score:65 },
        { uid:'c07', name:'Saint-Priest', score:74 }, { uid:'c08', name:'Mions', score:68 }
      ]},
      { uid:'epci-c', name:'Beaujolais Vert', score:48, communes:[
        { uid:'c09', name:'Belleville', score:41 }, { uid:'c10', name:'Villefranche', score:53 },
        { uid:'c11', name:'Beaujeu', score:38 }, { uid:'c12', name:'Gleizé', score:62 }
      ]},
    ]
  };

  const sunData = payload.hierarchy.map(epci => ({
    name: epci.name,
    itemStyle: { color: scoreColor(epci.score) + '33', borderColor: scoreColor(epci.score), borderWidth:1 },
    children: epci.communes.map(c => ({
      name: c.name, value: 1,
      itemStyle: { color: scoreColor(c.score), opacity:.85 },
      label: { color:'#fff', fontSize:10 }
    }))
  }));

  const chart = initChart('chart-sunburst', 'Sunburst-Hierarchie-Territoriale');
  if (!chart) return;

  chart.setOption({
    backgroundColor:'#0f172a',
    animation: true, animationDuration: ANIM.duration,
    tooltip: { ...TOOLTIP,
      formatter: p => {
        const isEpci = !p.data.children?.length || p.data.children?.[0]?.value === 1;
        const epci = payload.hierarchy.find(e => e.name === p.name
          || e.communes.some(c => c.name === p.name));
        if (epci && epci.name === p.name)
          return `<b>${p.name}</b><br>Score IRI moyen : <b>${epci.score}/100</b>`;
        const commune = payload.hierarchy.flatMap(e=>e.communes).find(c=>c.name===p.name);
        if (commune) return `<b>${commune.name}</b><br>Score IRI : <b>${commune.score}/100</b>`;
        return `<b>${p.name}</b>`;
      }
    },
    legend: {
      data:[
        { name:'Score ≥ 70 (Bon état)', icon:'circle', itemStyle:{ color:'#10b981' } },
        { name:'Score 55–69 (Vigilance)', icon:'circle', itemStyle:{ color:'#f59e0b' } },
        { name:'Score < 55 (Prioritaire)', icon:'circle', itemStyle:{ color:'#f43f5e' } },
      ],
      bottom:0, textStyle:{ color:'#94a3b8', fontSize:11, fontFamily:FONT }, itemWidth:8
    },
    series: [{
      type:'sunburst', data: sunData,
      radius:['18%','80%'], center:['50%','48%'],
      sort:'desc',
      label:{ rotate:'radial', color:'#f1f5f9', fontSize:11, fontFamily:FONT,
        minAngle:8, overflow:'truncate', width:60 },
      emphasis:{ focus:'ancestor', itemStyle:{ shadowBlur:10, shadowColor:'rgba(0,0,0,.5)' } },
      levels:[
        {},
        { r0:'18%', r:'45%', label:{ rotate:'tangential', align:'center', fontSize:11, fontWeight:600 },
          itemStyle:{ borderWidth:2 }
        },
        { r0:'48%', r:'80%', label:{ align:'center', fontSize:10 },
          itemStyle:{ borderWidth:1 }
        }
      ]
    }]
  });

  showPayload('sunburst', payload);
})();

/* ════════════════════════════════════════════════════════════════════════
   07 — BOXPLOT  (Distribution IRI par classe de route)
   ════════════════════════════════════════════════════════════════════════ */
(function() {
  const classes = ['Autoroute','Nationale','Départementale','Communale Urbaine','Communale Rurale'];
  // [min, Q1, median, Q3, max]
  const boxData = [
    [72,80,86,91,97],[58,68,74,82,94],[38,52,63,75,89],[21,38,52,67,84],[12,27,41,58,78]
  ];
  const outliers = [
    [[0,65],[0,68]],
    [[1,55],[1,58]],
    [[2,22],[2,94]],
    [[3,18],[3,89]],
    [[4,8],[4,84],[4,87]]
  ];
  const allOutliers = outliers.flatMap((pts,i) => pts.map(([xi,yi]) => [xi,yi]));

  const payload = {
    keys: classes.map(c=>c.toLowerCase().replace(/ /g,'_')),
    items: classes.map((name,i) => ({
      uid:'class-'+i, name,
      data: {
        [name.toLowerCase().replace(/ /g,'_')]: {
          d: boxData[i], title: name, color: COLORS[i],
          formatters:{ value:{ description:'[min, Q1, médiane, Q3, max]' } }
        }
      }
    }))
  };

  const chart = initChart('chart-boxplot', 'Boxplot-Distribution-IRI');
  if (!chart) return;

  chart.setOption({
    backgroundColor:'#0f172a',
    animation: true, animationDuration: ANIM.duration,
    tooltip: { ...TOOLTIP, trigger:'item',
      formatter: p => {
        if (p.seriesType === 'scatter')
          return `Outlier : <b>${p.value[1]}</b>`;
        const [min,q1,med,q3,max] = p.data;
        return `<b>${classes[p.dataIndex]}</b><br>
          Médiane : <b>${med}</b><br>
          Q1–Q3 : ${q1}–${q3}<br>
          Min–Max : ${min}–${max}`;
      }
    },
    grid: { top:16, right:20, bottom:60, left:16, containLabel:true },
    xAxis: { ...AXIS_STYLE, type:'category', data: classes,
      axisLabel:{ color:'#94a3b8', fontSize:11, fontFamily:FONT, rotate:0, interval:0,
        overflow:'break', width:90 } },
    yAxis: { ...AXIS_STYLE, name:'Score IRI', min:0, max:100,
      nameTextStyle:{ color:'#64748b', fontSize:11 },
      splitLine:{ lineStyle:{ color:'#1e293b', type:'dashed' } } },
    series: [{
      type:'boxplot', name:'Distribution IRI',
      data: boxData,
      itemStyle:{ borderColor:COLORS[0], borderWidth:2, color:'rgba(59,130,246,.15)' },
      boxWidth:['30%','50%'],
      emphasis:{
        itemStyle:{ borderColor:COLORS[0], borderWidth:2.5,
          shadowBlur:10, shadowColor:'rgba(59,130,246,.4)' }
      }
    },{
      type:'scatter', name:'Outliers',
      data: allOutliers,
      symbolSize:7,
      itemStyle:{ color:'#f43f5e', borderColor:'#0f172a', borderWidth:1.5 },
      tooltip:{ formatter: p => `Outlier : <b>${p.value[1]}</b>` }
    }]
  });

  showPayload('boxplot', payload);
})();

/* ════════════════════════════════════════════════════════════════════════
   08 — GAUGE  (Score synthétique + sous-indicateurs HTML)
   ════════════════════════════════════════════════════════════════════════ */
(function() {
  const payload = {
    item: {
      uid:'territoire-demo', name:'Score territoire — Démo',
      keys:['score_global','iri','degradations','inspection','budget'],
      data:{
        score_global:{ d:63.4, title:'Score global', color:'#3b82f6',  formatters:{ value:{ suffix:'/100' } } },
        iri:         { d:72,   title:'IRI',          color:'#10b981',  formatters:{ value:{ suffix:'/100' } } },
        degradations:{ d:48,   title:'Dégradations', color:'#f43f5e',  formatters:{ value:{ suffix:'/100' } } },
        inspection:  { d:81,   title:'Inspection',   color:'#8b5cf6',  formatters:{ value:{ suffix:'/100' } } },
        budget:      { d:52,   title:'Budget',       color:'#f59e0b',  formatters:{ value:{ suffix:'/100' } } },
      }
    }
  };

  const score = payload.item.data.score_global.d;
  const gaugeColor = score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#f43f5e';

  const chart = initChart('chart-gauge', 'Gauge-Score-Synthetique');
  if (!chart) return;

  chart.setOption({
    backgroundColor:'#0f172a',
    animation: true, animationDuration: ANIM.duration,
    series: [{
      type:'gauge',
      center:['50%','60%'], radius:'82%',
      startAngle:210, endAngle:-30,
      min:0, max:100,
      splitNumber:10,
      axisLine:{
        lineStyle:{ width:18,
          color:[[.5,'#f43f5e'],[.7,'#f59e0b'],[1,'#10b981']]
        }
      },
      progress:{ show:true, width:18, itemStyle:{ color: gaugeColor } },
      splitLine:{ length:12, distance:-18, lineStyle:{ color:'#334155', width:2 } },
      axisTick:{ distance:-10, length:6, lineStyle:{ color:'#475569', width:1.5 } },
      axisLabel:{ distance:-48, color:'#64748b', fontSize:11, fontFamily:FONT,
        formatter: v => v % 20 === 0 ? v : '' },
      pointer:{ icon:'path://M12.8,0.7l12.3,0.3L25,38.3l-36.1,44.6l-3.4-1.5l4.8-40L12.8,0.7z',
        length:'60%', width:10, offsetCenter:[0,'5%'],
        itemStyle:{ color: gaugeColor, shadowBlur:8, shadowColor:gaugeColor+'88' }
      },
      anchor:{ show:true, showAbove:false, size:18,
        itemStyle:{ color: gaugeColor, borderWidth:2, borderColor:'#1e293b' }
      },
      title:{ offsetCenter:[0,'28%'], color:'#94a3b8', fontSize:12, fontFamily:FONT },
      detail:{
        valueAnimation:true,
        offsetCenter:[0,'8%'],
        fontSize:36, fontWeight:800, fontFamily:FONT,
        color:'#f1f5f9',
        formatter:'{value}/100'
      },
      data:[{ value: score, name: payload.item.name.split('—')[0].trim() }]
    }]
  });

  // Render sub-indicators as HTML progress bars
  const metricsEl = document.getElementById('gauge-metrics');
  if (metricsEl) {
    const subKeys = ['iri','degradations','inspection','budget'];
    metricsEl.innerHTML = subKeys.map(k => {
      const it = payload.item.data[k];
      const pct = Math.round(it.d);
      return `
        <div class="gm-item">
          <div class="gm-header">
            <span class="gm-title">${it.title}</span>
            <span class="gm-val">${pct}/100</span>
          </div>
          <div class="gm-track">
            <div class="gm-fill" style="width:${pct}%;background:${it.color}"></div>
          </div>
        </div>`;
    }).join('');
  }

  showPayload('gauge', payload);
})();

/* ════════════════════════════════════════════════════════════════════════
   09 — SANKEY  (Flux budget sources → types → zones)
   ════════════════════════════════════════════════════════════════════════ */
(function() {
  const payload = {
    nodes:[
      // Sources
      { id:'src-etat',  name:'État (DSIL)',      category:'source' },
      { id:'src-region',name:'Région',            category:'source' },
      { id:'src-dept',  name:'Département',       category:'source' },
      { id:'src-propre',name:'Autofinancement',   category:'source' },
      // Types de travaux
      { id:'type-rev',  name:'Revêtement',        category:'type' },
      { id:'type-str',  name:'Structure',          category:'type' },
      { id:'type-sig',  name:'Signalisation',      category:'type' },
      { id:'type-ent',  name:'Entretien',          category:'type' },
      // Zones
      { id:'zone-urb',  name:'Zones Urbaines',     category:'zone' },
      { id:'zone-per',  name:'Zones Périurbaines', category:'zone' },
      { id:'zone-rur',  name:'Zones Rurales',      category:'zone' },
    ],
    links:[
      // État → types
      { source:'État (DSIL)',       target:'Revêtement',   value:580 },
      { source:'État (DSIL)',       target:'Structure',    value:320 },
      // Région → types
      { source:'Région',            target:'Revêtement',   value:410 },
      { source:'Région',            target:'Signalisation',value:180 },
      { source:'Région',            target:'Structure',    value:190 },
      // Département → types
      { source:'Département',       target:'Revêtement',   value:650 },
      { source:'Département',       target:'Entretien',    value:290 },
      { source:'Département',       target:'Structure',    value:210 },
      // Autofinancement → types
      { source:'Autofinancement',   target:'Revêtement',   value:200 },
      { source:'Autofinancement',   target:'Entretien',    value:300 },
      { source:'Autofinancement',   target:'Signalisation',value:130 },
      // Types → zones
      { source:'Revêtement',        target:'Zones Urbaines',    value:780 },
      { source:'Revêtement',        target:'Zones Périurbaines', value:620 },
      { source:'Revêtement',        target:'Zones Rurales',     value:440 },
      { source:'Structure',         target:'Zones Urbaines',    value:340 },
      { source:'Structure',         target:'Zones Périurbaines', value:280 },
      { source:'Structure',         target:'Zones Rurales',     value:100 },
      { source:'Signalisation',     target:'Zones Urbaines',    value:210 },
      { source:'Signalisation',     target:'Zones Rurales',     value:100 },
      { source:'Entretien',         target:'Zones Périurbaines', value:290 },
      { source:'Entretien',         target:'Zones Rurales',     value:300 },
    ]
  };

  const nodeColors = {
    source: '#3b82f6', type: '#8b5cf6', zone: '#10b981'
  };

  const chart = initChart('chart-sankey', 'Sankey-Flux-Budget');
  if (!chart) return;

  chart.setOption({
    backgroundColor:'#0f172a',
    animation: true, animationDuration: ANIM.duration,
    tooltip: { ...TOOLTIP,
      formatter: p => {
        if (p.dataType === 'node') return `<b>${p.name}</b>`;
        return `<b>${p.data.source}</b> → <b>${p.data.target}</b><br>Budget : <b>${p.data.value} k€</b>`;
      }
    },
    series: [{
      type:'sankey',
      emphasis:{ focus:'adjacency' },
      nodeWidth:16, nodeGap:12,
      left:'2%', right:'22%', top:12, bottom:12,
      data: payload.nodes.map(n => ({
        name: n.name,
        itemStyle:{ color: nodeColors[n.category], borderColor: nodeColors[n.category] },
        label:{ color:'#f1f5f9', fontFamily:FONT, fontSize:11, fontWeight:600 }
      })),
      links: payload.links,
      lineStyle:{
        color:'gradient', opacity:.25, curveness:.5
      },
      label:{ fontFamily:FONT, color:'#f1f5f9', fontSize:11 }
    }]
  });

  showPayload('sankey', payload);
})();

/* ════════════════════════════════════════════════════════════════════════
   10 — FUNNEL  (Pipeline d'inspection)
   ════════════════════════════════════════════════════════════════════════ */
(function() {
  const steps = [
    { name:'Tronçons identifiés',       value:2840, color:'#3b82f6' },
    { name:'Demandes créées',           value:2210, color:'#06b6d4' },
    { name:'Inspections planifiées',    value:1680, color:'#8b5cf6' },
    { name:'Inspections réalisées',     value:1420, color:'#10b981' },
    { name:'Rapports validés',          value:1095, color:'#f59e0b' },
    { name:'Travaux programmés',        value: 780, color:'#f97316' },
  ];

  const payload = {
    keys: ['count'],
    items: steps.map(s => ({
      uid: s.name.toLowerCase().replace(/ /g,'_'),
      name: s.name,
      data: { count: { d:s.value, title:s.name, color:s.color, formatters:{ value:{} } } }
    }))
  };

  const chart = initChart('chart-funnel', 'Funnel-Pipeline-Inspection');
  if (!chart) return;

  chart.setOption({
    backgroundColor:'#0f172a',
    animation: true, animationDuration: ANIM.duration,
    tooltip: { ...TOOLTIP,
      formatter: p => {
        const idx = steps.findIndex(s=>s.name===p.name);
        const pct = idx === 0 ? 100 : Math.round(steps[idx].value/steps[0].value*100);
        const conv = idx > 0 ? Math.round(steps[idx].value/steps[idx-1].value*100) : null;
        return `<b>${p.name}</b><br>Volume : <b>${p.value.toLocaleString('fr-FR')}</b><br>
          Taux global : <b>${pct}%</b>${conv ? `<br>Conversion étape précédente : <b>${conv}%</b>` : ''}`;
      }
    },
    series: [{
      type:'funnel',
      top:12, bottom:12, left:16, right:16,
      min:0, max:3000,
      minSize:'30%', maxSize:'90%',
      sort:'descending', gap:3,
      label:{
        show:true, position:'inside',
        formatter: p => {
          const idx = steps.findIndex(s=>s.name===p.name);
          const conv = idx > 0 ? `  (→ ${Math.round(steps[idx].value/steps[idx-1].value*100)}%)` : '';
          return `{name|${p.name}}{num|${p.value.toLocaleString('fr-FR')}${conv}}`;
        },
        rich:{
          name:{ color:'#fff', fontWeight:700, fontSize:12, fontFamily:FONT },
          num:{ color:'rgba(255,255,255,.7)', fontSize:11, fontFamily:FONT }
        }
      },
      itemStyle:{ borderWidth:0, opacity:.88 },
      emphasis:{ label:{ fontSize:13 }, itemStyle:{ opacity:1 } },
      data: steps.map(s => ({
        name: s.name, value: s.value,
        itemStyle:{ color: s.color }
      }))
    }]
  });

  showPayload('funnel', payload);
})();

/* ════════════════════════════════════════════════════════════════════════
   11 — PARALLEL COORDINATES  (Profil multi-indicateurs)
   ════════════════════════════════════════════════════════════════════════ */
(function() {
  const territories = [
    { name:'Bron',          cat:0, vals:[82,15,88,74,22] },
    { name:'Vénissieux',    cat:0, vals:[65,32,72,62,35] },
    { name:'Givors',        cat:1, vals:[61,38,65,58,42] },
    { name:'Grigny',        cat:1, vals:[73,24,78,68,18] },
    { name:'Belleville',    cat:2, vals:[41,58,44,35,68] },
    { name:'Villefranche',  cat:2, vals:[53,44,58,47,55] },
    { name:'Beaujeu',       cat:2, vals:[38,62,32,29,78] },
    { name:'Saint-Priest',  cat:0, vals:[74,22,81,71,28] },
    { name:'Mions',         cat:0, vals:[68,28,75,64,32] },
    { name:'Gleizé',        cat:2, vals:[62,35,60,58,44] },
    { name:'Chasse/Rhône',  cat:1, vals:[58,42,61,55,49] },
    { name:'Loire/Rhône',   cat:1, vals:[79,18,84,72,20] },
  ];
  const catColors = ['#3b82f6','#10b981','#f43f5e'];
  const catNames  = ['Est Lyonnais','CC Rhône Sud','Beaujolais Vert'];

  const axes = [
    { dim:0, name:'IRI Score', min:0, max:100 },
    { dim:1, name:'Dégradations %', min:0, max:80, inverse:true },
    { dim:2, name:'Inspection %', min:0, max:100 },
    { dim:3, name:'Budget exec. %', min:0, max:100 },
    { dim:4, name:'Âge revêt. ans', min:0, max:90, inverse:true },
  ];

  const payload = {
    keys: axes.map(a=>a.name.toLowerCase().replace(/ /g,'_')),
    items: territories.map(t => ({
      uid: t.name.toLowerCase().replace(/ /g,'-'), name: t.name,
      data: Object.fromEntries(axes.map((a,i) => [a.name, {
        d:t.vals[i], title:a.name, color:catColors[t.cat]
      }]))
    }))
  };

  const chart = initChart('chart-parallel', 'Parallel-Coordonnees-Profil');
  if (!chart) return;

  chart.setOption({
    backgroundColor:'#0f172a',
    animation: true, animationDuration: ANIM.duration,
    tooltip: { ...TOOLTIP, trigger:'item',
      formatter: p => {
        if (!p.data) return '';
        const t = territories[p.dataIndex];
        if (!t) return '';
        return `<b>${t.name}</b> (${catNames[t.cat]})<br>` +
          axes.map((a,i) => `${a.name} : <b>${t.vals[i]}</b>`).join('<br>');
      }
    },
    legend: {
      data: catNames, bottom:2,
      textStyle:{ color:'#94a3b8', fontSize:11, fontFamily:FONT }, icon:'line', itemWidth:18
    },
    parallel: {
      top:28, bottom:48, left:16, right:16,
      parallelAxisDefault:{
        nameLocation:'start', nameGap:8,
        nameTextStyle:{ color:'#94a3b8', fontFamily:FONT, fontSize:11 },
        axisLine:{ lineStyle:{ color:'#334155', width:1.5 } },
        axisTick:{ lineStyle:{ color:'#334155' } },
        axisLabel:{ color:'#64748b', fontSize:10, fontFamily:FONT },
        splitLine:{ show:false },
      }
    },
    parallelAxis: axes.map(a => ({
      dim:a.dim, name:a.name, min:a.min, max:a.max,
      inverse: a.inverse || false
    })),
    series: catNames.map((catName, ci) => ({
      type:'parallel', name: catName,
      lineStyle:{ color: catColors[ci], width:2, opacity:.65 },
      emphasis:{ lineStyle:{ width:3, opacity:1 } },
      data: territories.filter(t => t.cat === ci).map(t => t.vals)
    }))
  });

  showPayload('parallel', payload);
})();

/* ════════════════════════════════════════════════════════════════════════
   12 — NIGHTINGALE ROSE  (Types de dégradation)
   ════════════════════════════════════════════════════════════════════════ */
(function() {
  const types = [
    { name:'Fissuration longitudinale', value:38, severity:'haute',   color:'#f43f5e' },
    { name:'Orniérage',                  value:22, severity:'haute',   color:'#f97316' },
    { name:'Nids-de-poule',              value:18, severity:'critique',color:'#ef4444' },
    { name:'Déformation transversale',   value:31, severity:'haute',   color:'#f59e0b' },
    { name:'Remontée de liant',          value:12, severity:'moyenne', color:'#eab308' },
    { name:'Arrachement',                value:26, severity:'haute',   color:'#8b5cf6' },
    { name:'Pelade',                     value:15, severity:'moyenne', color:'#a78bfa' },
    { name:'Fissuration transversale',   value:29, severity:'haute',   color:'#6366f1' },
  ];

  const payload = {
    item: {
      uid:'degradations-zone-demo', name:'Types de dégradation — Zone démonstration',
      keys: types.map(t => t.name.toLowerCase().replace(/ /g,'_').replace(/[éè]/g,'e').replace(/î/g,'i')),
      data: Object.fromEntries(types.map(t => [
        t.name.toLowerCase().replace(/ /g,'_').replace(/[éè]/g,'e').replace(/î/g,'i'),
        { d:t.value, title:t.name, color:t.color,
          formatters:{ value:{ suffix:'% occurrence', description:`Sévérité : ${t.severity}` } } }
      ]))
    }
  };

  const chart = initChart('chart-nightingale', 'Nightingale-Types-Degradation');
  if (!chart) return;

  chart.setOption({
    backgroundColor:'#0f172a',
    animation: true, animationDuration: ANIM.duration,
    tooltip: { ...TOOLTIP,
      formatter: p => {
        const t = types.find(d => d.name === p.name);
        const sev = t ? t.severity : '';
        const sevColor = { critique:'#ef4444', haute:'#f97316', moyenne:'#eab308' }[sev] || '#64748b';
        return `<b>${p.name}</b><br>Occurrence : <b>${p.value}%</b><br>
          Sévérité : <span style="color:${sevColor};font-weight:700">${sev}</span>`;
      }
    },
    legend: {
      type:'scroll', orient:'vertical', right:4, top:0, bottom:0,
      textStyle:{ color:'#94a3b8', fontSize:11, fontFamily:FONT },
      icon:'circle', itemWidth:8,
      data: types.map(t => t.name)
    },
    series: [{
      type:'pie', name:'Dégradations',
      roseType:'area',
      radius:['12%','72%'],
      center:['38%','52%'],
      startAngle: 90,
      sort:'descending',
      label:{
        show:true, color:'#94a3b8', fontFamily:FONT, fontSize:10,
        formatter: p => p.percent > 7 ? `${p.value}%` : ''
      },
      labelLine:{ show:true, lineStyle:{ color:'#334155', width:1 } },
      itemStyle:{ borderColor:'#0f172a', borderWidth:2, borderRadius:3 },
      emphasis:{ itemStyle:{ shadowBlur:12, shadowColor:'rgba(0,0,0,.5)' },
        label:{ fontSize:13, fontWeight:700, color:'#f1f5f9' }
      },
      data: types.map(t => ({
        name: t.name, value: t.value,
        itemStyle:{ color: t.color, opacity:.88 }
      }))
    }]
  });

  showPayload('nightingale', payload);
})();
