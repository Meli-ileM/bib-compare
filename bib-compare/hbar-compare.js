// =============================================================================
//  HBAR D3 vs ECHARTS — Comparaison commentée
// =============================================================================
//
//  Ce fichier implémente le même graphique (barres horizontales) DEUX FOIS :
//  une fois avec D3, une fois avec ECharts — à partir du même payload backend.
//
//  PHILOSOPHIE FONDAMENTALE
//  ─────────────────────────
//  ┌─────────────────────────────────────────────────────────────────────────┐
//  │  D3 = bibliothèque BAS NIVEAU                                           │
//  │  Tu calcules tout toi-même : positions, dimensions, axes, labels...     │
//  │  Tu crées chaque élément SVG à la main avec .append(), .attr(), etc.   │
//  │                                                                         │
//  │  ECharts = bibliothèque HAUT NIVEAU                                     │
//  │  Tu décris CE QUE tu veux dans un objet de config (setOption).         │
//  │  ECharts calcule les positions, dessine sur Canvas, gère tout seul.    │
//  └─────────────────────────────────────────────────────────────────────────┘
//
//  RÉSULTAT VISUEL : identique.
//  VOLUME DE CODE : D3 ≈ 120 lignes de logique, ECharts ≈ 60 lignes de config.
//  INTERACTIVITÉ : ECharts gratuite (hover, tooltip, zoom), D3 = code manuel.
//
// =============================================================================
//
// PAYLOAD DE TEST AU FORMAT LE PLUS PROCHE POSSIBLE DE CE QUI ARRIVE AU HBar
// -----------------------------------------------------------------------------
// Dans la plateforme, report-indicator-graph.tsx normalise les données backend
// pour produire un objet de cette forme:
// {
//   item: {
//     uid,
//     name,
//     keys: ["value", "reference", ...],
//     data: {
//       value: { d, formatters, color, title },
//       reference: { d, formatters, color, title }
//     }
//   }
// }
// C'est ce shape que HBarChart consomme ensuite via VizSingleTupleMixin.
const backendLikePayload = {
  item: {
    uid: "report-template-uuid-demo",
    name: "Population active et revenu médian",
    keys: ["value", "reference", "delta"],
    data: {
      value: {
        title: "Valeur",
        d: 12450,
        color: "#2563eb",
        formatters: { value: { format: ",.0f", suffix: "hab." } }
      },
      reference: {
        title: "Référence",
        d: 9800,
        color: "#10b981",
        formatters: { value: { format: ",.0f", suffix: "hab." } }
      },
      delta: {
        title: "Delta",
        d: 2650,
        color: "#ef4444",
        formatters: { value: { format: ",.0f", suffix: "hab." } }
      }
    }
  }
};

document.getElementById("payload").textContent = JSON.stringify(backendLikePayload, null, 2);

// -----------------------------------------------------------------------------
// STUBS DES DEPENDANCES INTERNES DU PROJET
// -----------------------------------------------------------------------------
// Objectif: garder la structure et l'intention du composant original, mais avec
// des valeurs de test pour les imports qui, dans la vraie app, viennent d'autres
// modules Vue / helpers / directives du projet.
//
// ⚠ Ces helpers sont PARTAGÉS entre D3 et ECharts — preuve que la logique
//   métier (formater un nombre, colorier une barre) est indépendante de la
//   bibliothèque de rendu. Seule la manière de "dessiner" diffère.

const BAR_BORDER_RADIUS = 3;
const DEFAULT_POPPER_OPTIONS = { placement: "right" };

function buildConverter(from) {
  const suffix = from?.formatters?.value?.suffix || "";
  const formatter = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
  return (value) => {
    if (value == null) return "";
    const base = formatter.format(value);
    return suffix ? `${base} ${suffix}` : base;
  };
}

function classBrewer(prop) {
  return `of-${prop}`;
}

function chartInstance(host) {
  const existing = echarts.getInstanceByDom(host);
  if (existing) existing.dispose();
  return echarts.init(host);
}

// =============================================================================
//  VERSION D3 — Rendu IMPÉRATIF, élément par élément
// =============================================================================
//
//  Avec D3, le développeur est le "peintre" : il crée chaque forme SVG à la
//  main, calcule chaque pixel, positionne chaque texte.
//
//  Le flux de travail D3 pour ce graphique :
//  1. Créer un <svg> avec les bonnes dimensions
//  2. Calculer une échelle (scaleLinear) pour mapper valeurs → pixels
//  3. Pour chaque barre : calculer tx (départ X), barW (largeur), ty (hauteur Y)
//  4. Créer un <g> de groupe, y mettre un <rect> (la barre) + un <text> (label)
//  5. Gérer manuellement la ligne de zéro si des valeurs négatives existent
//
//  Il n'y a pas de "tooltip" natif — il faudrait ajouter des écouteurs
//  mouseover/mouseout et un <div> positionné manuellement.
//
class HBarChartStandalone {
  constructor(host, payload) {
    this.host = host;
    this.data = payload;
    this.item = payload.item;
    this.contentRect = {
      width: host.clientWidth,
      height: host.clientHeight
    };
  }

  // Equivalent de VizSingleTupleMixin.abscissKeys
  get abscissKeys() {
    return this.item.keys.filter((k) => this.item.data[k]?.d != null);
  }

  // ⚑ D3 SPÉCIFIQUE — ECharts n'a pas besoin de ce calcul.
  // Avec ECharts, la ligne de zéro est gérée automatiquement par l'axe.
  // Avec D3, on doit la détecter manuellement pour savoir s'il faut appeler drawOrigin().
  /** Vrai si au moins une valeur est négative — affiche la ligne verticale de zéro. */
  get hasNegative() {
    return this.abscissKeys.some((k) => this.item.data[k]?.d < 0);
  }

  // ⚑ D3 SPÉCIFIQUE — Les marges sont calculées manuellement en pixels.
  // Avec D3, on doit réserver l'espace pour les labels (r: 62) et les axes (t/b/l)
  // AVANT de dessiner quoi que ce soit. Un oubli = les textes débordent.
  // Avec ECharts, on donne juste { containLabel: true } dans grid et c'est géré.
  /** Marges du SVG. r: 62 réserve l'espace pour les labels à droite des barres. */
  get margin() {
    return {
      t: 10, b: 10,
      r: 62, l: 10
    };
  }

  // ⚑ D3 SPÉCIFIQUE — La taille "utile" du SVG après soustraction des marges.
  // ECharts calcule cela automatiquement. Avec D3, si on se trompe de 1px
  // dans innerSize ou margin, les éléments se chevauchent.
  get innerSize() {
    return {
      width: this.contentRect.width - this.margin.r - this.margin.l,
      height: this.contentRect.height - this.margin.t - this.margin.b
    };
  }

  // ⚑ D3 SPÉCIFIQUE — L'échelle sW est le cœur du rendu D3.
  // d3.scaleLinear() crée une fonction qui traduit une valeur métier
  // (ex: 12450) en pixels (ex: 187px). C'est un mapping mathématique :
  //   domain = [min_data, max_data] (monde réel)
  //   range  = [0, width_pixels]   (monde pixel)
  //
  // Avec ECharts, on ne crée JAMAIS une scale. On donne juste
  // xAxis: { type: 'value', min: ..., max: ... } et ECharts le fait seul.
  //
  // barSpacing et textMarginLeft sont aussi gérés manuellement — ECharts
  // les calcule via barCategoryGap et label: { position: 'right' }.
  /**
   * Constantes de rendu pré-calculées :
   * - sW : échelle D3 linéaire qui mappe les valeurs -> pixels (axe horizontal)
   */
  get constants() {
    const { min, max } = Math;
    const dOrd = this.abscissKeys,
          items = dOrd.map((k) => this.item.data[k]),
          { width } = this.innerSize;
    return {
      dOrd, items,
      barSpacing: 12,
      textMarginLeft: 5,
      // ← Cette scale est l'équivalent de xAxis.type:'value' en ECharts
      sW: d3.scaleLinear().rangeRound([0, width]).domain([
        min(0, ...items.map((i) => i.d)),
        max(0, ...items.map((i) => i.d))
      ])
    };
  }

  drawTooltip({ item, props }) {
    const lines = props.map((prop) => {
      const datum = item.data[prop];
      const text = buildConverter(datum)(datum.d);
      return `${datum.title || prop}: ${text}`;
    });
    return lines.join("\n");
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  D3 : drawBars() — LA DIFFÉRENCE PRINCIPALE AVEC ECHARTS
  // ═══════════════════════════════════════════════════════════════════════
  //
  //  Avec D3, cette méthode fait tout à la main :
  //  • Calculer ty (position Y de chaque barre) en pixels — maths manuelle
  //  • Calculer tx (position X du départ de la barre) — différent si négatif
  //  • Calculer barW (largeur en pixels) — via la scale sW
  //  • Créer un <g> SVG, y mettre un <rect> et un <text>
  //  • Mettre à jour chaque attribut SVG un par un (.attr('width', barW) etc.)
  //
  //  L'équivalent en ECharts est juste : series[0].data = items.map(i => i.d)
  //  ECharts calcule tout le reste seul.
  //
  /**
   * Dessine chaque barre SVG horizontale :
   * - tx : départ depuis sW(0) ou sW(d) si valeur négative (barre vers la gauche)
   * - barW : largeur = distance absolue entre sW(0) et sW(d)
   * - Label de valeur positionné à droite de la barre
   */
  drawBars(root) {
    const { abs, min } = Math;
    const { dOrd, items, sW, barSpacing, textMarginLeft } = this.constants,
          { height } = this.innerSize,
          n = items.length,
          barHeight = min(0.25 * height, 64);

    items.forEach((itm, i) => {
      const ty = height / 2 + (i - n / 2) * (barHeight + barSpacing) + barSpacing / 2,
            tx = itm.d < 0 ? sW(itm.d) : sW(0),
            barW = abs(sW(0) - sW(itm.d)),
            textX = barW + textMarginLeft,
            ofClass = classBrewer(dOrd[i], itm),
            popperOpts = {
              tooltip: this.drawTooltip({ item: this.item, props: [dOrd[i]] }),
              options: { ...DEFAULT_POPPER_OPTIONS, placement: "right" }
            };

      // ─── D3 : chaque forme = une instruction .append() + des .attr() ───
      // Avec ECharts, tout ce bloc se résume à UN objet dans series[].data :
      // { value: itm.d, itemStyle: { color: itm.color, borderRadius: ... } }
      const group = root.append("g")        // ← Crée un <g> SVG manuellement
        .attr("class", `bar ${ofClass}`)
        .attr("transform", `translate(${tx}, ${ty})`); // ← positionne en pixels calculés

      group.append("rect")                  // ← Dessine le rectangle de la barre
        .attr("x", 0)
        .attr("y", 0)
        .attr("height", barHeight)          // ← hauteur calculée manuellement
        .attr("width", barW)                // ← largeur = sW(d) - sW(0), calculé ci-dessus
        .attr("rx", BAR_BORDER_RADIUS)      // ← coins arrondis, 1 attr à la fois
        .attr("ry", BAR_BORDER_RADIUS)
        .attr("fill", itm.color || "#64748b")
        .append("title")                    // ← tooltip natif SVG (pas de librairie)
        .text(popperOpts.tooltip);          //   ↑ très basique, pas de style CSS possible

      // ─── D3 : le label numérique est un <text> SVG positionné à la main ───
      // Avec ECharts : label: { show: true, position: 'right', fontSize: 15 }
      group.append("text")
        .attr("class", "value")
        .attr("transform", `translate(${textX}, ${barHeight / 2})`) // ← position manuelle
        .attr("dominant-baseline", "middle")
        .attr("font-size", 15)
        .attr("fill", "#111827")
        .text(buildConverter(itm)(itm.d));
    });
  }

  // ─── D3 : la ligne de zéro est une MÉTHODE ENTIÈRE à écrire soi-même ───
  // On crée un <g>, on y met une <line> (y1→y2 = hauteur calculée), puis un
  // <text> "0" positionné manuellement.
  //
  // Avec ECharts, c'est juste 5 lignes dans markLine: { data: [{ xAxis: 0 }] }
  // et ECharts gère le positionnement, la couleur, le label, tout seul.
  /** Dessine la ligne verticale de zéro, affichée uniquement si des valeurs négatives existent. */
  drawOrigin(root) {
    const { sW } = this.constants,
          { height } = this.innerSize;
    const origin = root.append("g")
      .attr("class", "origin")
      .attr("transform", `translate(${sW(0)}, 0)`); // ← sW(0) = pixel de la valeur 0

    origin.append("line")   // ← une <line> SVG dessinée à la main
      .attr("x1", 0)
      .attr("x2", 0)
      .attr("y1", 0)
      .attr("y2", height)   // ← height = innerSize calculé dans margin/innerSize
      .attr("stroke", "#9ca3af")
      .attr("stroke-width", 1.2);

    origin.append("text")  // ← le label "0" est aussi un élément à créer manuellement
      .attr("x", 3)
      .attr("y", 12)
      .attr("fill", "#6b7280")
      .attr("font-size", 11)
      .text("0");
  }

  // ─── D3 : draw() orchestre tout le rendu SVG manuellement ───
  // Étapes obligatoires :
  //   1. Vider le conteneur (innerHTML = '')
  //   2. Créer le <svg> avec les bonnes dimensions
  //   3. Créer un <g> racine décalé des marges (translate)
  //   4. Appeler drawOrigin() SI valeurs négatives (vérification manuelle)
  //   5. Appeler drawBars() pour dessiner les barres
  //   6. Injecter le nœud SVG dans le DOM
  //
  // Avec ECharts : juste chart.setOption({...}) — une seule instruction.
  // ECharts gère l'effacement, le <canvas>, les marges, l'ordre de rendu.
  /** Point d'entrée du rendu SVG. Compose la ligne zéro (si besoin) et les barres horizontales. */
  draw() {
    this.host.innerHTML = "";  // ← Nettoyage manuel obligatoire avec D3

    // ← D3 : créer le <svg> manuellement avec largeur et hauteur explicites
    // ECharts : le canvas est créé automatiquement par echarts.init(el)
    const svg = d3.create("svg")
      .attr("width", this.contentRect.width)
      .attr("height", this.contentRect.height);

    // ← D3 : appliquer les marges via une transformation CSS translate
    // Chaque pixel est sous la responsabilité du développeur
    const root = svg.append("g")
      .attr("class", "bar-chart")
      .attr("transform", `translate(${this.margin.l}, ${this.margin.t})`);

    if (this.hasNegative) {
      this.drawOrigin(root);  // ← méthode entière = 15 lignes (voir ci-dessus)
    }

    this.drawBars(root);            // ← méthode entière = ~40 lignes
    this.host.appendChild(svg.node()); // ← injection manuelle dans le DOM
  }
}

// =============================================================================
//  VERSION ECHARTS — Rendu DÉCLARATIF, configuration par objet
// =============================================================================
//
//  Avec ECharts, on ne "dessine" pas — on DÉCRIT le graphique.
//  Toute la configuration tient dans un seul objet passé à setOption().
//  ECharts se charge de calculer les pixels, positionner les labels,
//  gérer le Canvas, les animations, les tooltips, le resize...
//
//  Cette classe hérite de HBarChartStandalone pour réutiliser :
//  - abscissKeys, hasNegative, margin, constants (logique métier commune)
//  Elle écrase UNIQUEMENT la méthode draw() — c'est la seule différence.
//
//  COMPARAISON RÉSUMÉE :
//  ┌─────────────────────┬─────────────────────────────────────────────────┐
//  │ D3                  │ ECharts                                         │
//  ├─────────────────────┼─────────────────────────────────────────────────┤
//  │ SVG element by ele. │ Canvas (ou SVG) géré automatiquement            │
//  │ Marge = math manue. │ grid: { containLabel: true }                    │
//  │ Scale d3.scaleLinea.│ xAxis: { type: 'value', min, max }              │
//  │ rect + text à la m. │ series: [{ type: 'bar', label: { show: true }}] │
//  │ markLine = 15 ligne │ markLine: { data: [{ xAxis: 0 }] }              │
//  │ resize = redraw()   │ ResizeObserver → chart.resize()                 │
//  │ Tooltip = title SVG │ tooltip: { trigger: 'item', formatter: fn }     │
//  └─────────────────────┴─────────────────────────────────────────────────┘
//
class HBarChartEChartsStandalone extends HBarChartStandalone {
  draw() {
    // ← ECharts aussi a besoin d'un conteneur propre, mais pour une raison
    // différente : éviter d'empiler plusieurs instances Canvas sur le même élément.
    this.host.innerHTML = "";

    const { dOrd, items } = this.constants;

    // ← Ces calculs min/max existent aussi dans D3 (dans constants → sW.domain).
    // La différence : en D3 ils servent à créer une scale (fonction pixel),
    // en ECharts ils sont juste passés comme config et ECharts fait la scale.
    const values = items.map((itm) => itm.d);
    const minValue = Math.min(0, ...values);
    const maxValue = Math.max(0, ...values);

    // ← Padding pour que les barres ne collent pas au bord.
    // En D3 cet ajustement se fait dans la scale (rangeRound + domain).
    const xPadding = Math.max(1, Math.round((maxValue - minValue) * 0.08));

    // ← Même helper de formatage qu'en D3 — la logique métier est identique.
    const xAxisFormatter = buildConverter(items[0]);

    // ← ECharts : une seule fonction pour initialiser et lier au DOM.
    // D3 : on crée svg = d3.create('svg'), puis on l'injecte avec appendChild.
    const chart = chartInstance(this.host);

    // ← setOption() = la seule instruction de rendu en ECharts.
    // Tout ce qui suit est une déclaration, pas du code impératif.
    chart.setOption({
      animation: true, // ← gratuit avec ECharts, absent en D3 (animation = code manuel)

      // ─── GRILLE ────────────────────────────────────────────────────────────
      // D3 : les marges sont calculées manuellement (voir margin + innerSize)
      //      et appliquées via transform="translate(l, t)" sur le <g> racine.
      // ECharts : on déclare juste les marges + containLabel: true,
      //           ECharts s'occupe du reste (réserve l'espace pour les labels).
      grid: {
        top: this.margin.t,
        bottom: this.margin.b,
        left: this.margin.l + 8,
        right: this.margin.r,
        containLabel: true // ← équivalent automatique de margin.r = 62 en D3
      },

      // ─── TOOLTIP ───────────────────────────────────────────────────────────
      // D3 : tooltip = <title> SVG natif (non stylable) ou un <div> flottant
      //      avec des listeners mouseover/mouseout codés manuellement (~20 lignes).
      // ECharts : tooltip déclaré ici, positionné et stylé automatiquement.
      tooltip: {
        trigger: "item",
        formatter: (params) => this.drawTooltip({ item: this.item, props: [dOrd[params.dataIndex]] }).replace(/\n/g, "<br/>")
        // ↑ On réutilise drawTooltip() — même logique métier que D3
      },

      // ─── AXE X (valeurs) ───────────────────────────────────────────────────
      // D3 : l'équivalent est d3.scaleLinear().domain([min, max]).range([0, width])
      //      puis on appelle sW(valeur) à chaque barre pour obtenir les pixels.
      // ECharts : on déclare juste le type et les bornes, ECharts fait la scale.
      xAxis: {
        type: "value",      // ← équivalent de d3.scaleLinear()
        min: minValue - xPadding,
        max: maxValue + xPadding,
        axisLine: {
          show: true,
          lineStyle: { color: "#9ca3af", width: 1 }
        },
        axisTick: {
          show: true,
          lineStyle: { color: "#9ca3af" }
        },
        axisLabel: {
          show: true,
          color: "#6b7280",
          formatter: (v) => xAxisFormatter(v) // ← même helper que D3
        },
        splitLine: {
          show: true,
          lineStyle: { color: "#eef2f7", type: "dashed" }
        }
      },

      // ─── AXE Y (catégories) ────────────────────────────────────────────────
      // D3 : il n'y a PAS d'axe Y dans la version D3 de ce composant.
      //      Les labels de catégories sont des <text> dessinés manuellement
      //      à côté de chaque barre dans drawBars() (drawTooltip + group).
      // ECharts : l'axe Y est déclaré une fois, ECharts place les labels seul.
      yAxis: {
        type: "category",
        data: items.map((itm) => itm.title || ""), // ← automatiquement aligné sur chaque barre
        axisLine: { show: true, lineStyle: { color: "#d1d5db", width: 1 } },
        axisTick: { show: true, lineStyle: { color: "#d1d5db" } },
        axisLabel: { show: true, color: "#374151" }
      },

      // ─── SÉRIE ─────────────────────────────────────────────────────────────
      // D3 : drawBars() fait ~40 lignes pour ce que series[] fait ici en ~15.
      //      Chaque item D3 = un <g> + un <rect> + un <text> créés à la main.
      //      Chaque item ECharts = juste { value, itemStyle }.
      series: [{
        type: "bar",

        // ← L'équivalent D3 est : items.forEach(itm => group.append('rect').attr('width', sW(itm.d) - sW(0)))
        data: items.map((itm) => ({
          value: itm.d,
          itemStyle: {
            color: itm.color || "#64748b",
            borderRadius: [BAR_BORDER_RADIUS, BAR_BORDER_RADIUS, BAR_BORDER_RADIUS, BAR_BORDER_RADIUS]
            // ↑ En D3 : .attr('rx', BAR_BORDER_RADIUS).attr('ry', BAR_BORDER_RADIUS) sur chaque <rect>
          }
        })),

        barCategoryGap: "40%", // ← En D3 : barSpacing = 12 (calculé manuellement dans ty)
        barMaxWidth: 64,       // ← En D3 : min(0.25 * height, 64) calculé manuellement

        // ← Le label numérique = l'équivalent du group.append('text') en D3
        //   D3 : position calculée (textX = barW + textMarginLeft, ty = barHeight/2)
        //   ECharts : position: 'right' suffit
        label: {
          show: true,
          position: "right",
          color: "#111827",
          fontSize: 15,
          formatter: (params) => buildConverter(items[params.dataIndex])(params.value)
          // ↑ Même buildConverter() que D3 — logique métier partagée
        },

        // ─── LIGNE DE ZÉRO ─────────────────────────────────────────────────
        // D3 : drawOrigin() = méthode entière (~15 lignes) avec <g> + <line> + <text>
        //      appelée conditionnellement si hasNegative.
        // ECharts : 5 lignes de config — ECharts calcule la position pixel seul.
        markLine: {
          symbol: ["none", "none"],
          silent: true,
          label: {
            show: this.hasNegative, // ← même condition que D3 : if (hasNegative) drawOrigin()
            formatter: "0",
            color: "#6b7280",
            distance: 6
          },
          lineStyle: { color: "#9ca3af", width: 1.2 },
          data: [{ xAxis: 0 }] // ← en D3 : sW(0) calculé manuellement + transform translate
        }
      }]
    });

    // ─── RESPONSIVE ──────────────────────────────────────────────────────────
    // D3 : pas de resize natif → window.addEventListener('resize', renderBoth)
    //      qui recrée tout le SVG from scratch.
    // ECharts : chart.resize() recalcule les positions sans recréer le canvas.
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(this.host);
  }
}

function renderBoth() {
  const d3Host = document.getElementById("d3Chart");
  const echartsHost = document.getElementById("echartsChart");

  new HBarChartStandalone(d3Host, backendLikePayload).draw();
  new HBarChartEChartsStandalone(echartsHost, backendLikePayload).draw();
}

renderBoth();
window.addEventListener("resize", renderBoth);
