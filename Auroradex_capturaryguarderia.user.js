// ==UserScript==
// @name         Auroradex · Macro de exploración, captura y guardería
// @namespace    https://auroradex.es/
// @version      2.9.0
// @description  Auto-explora y captura; ante shiny/legendario vibra, notifica y PARA la macro para captura manual. Límite de energía opcional. Guardería por crianza (Ditto u otro + pareja) o con Huevo Misterioso.
// @match        https://auroradex.es/*
// @match        https://www.auroradex.es/*
// @run-at       document-idle
// @grant        none
// @updateURL    https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_capturaryguarderia.user.js
// @downloadURL  https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_capturaryguarderia.user.js
// ==/UserScript==

(() => {
  'use strict';

  /* ── Espera a que Next.js/React termine de hidratar ─────────────────────────
   * Si se mete algo en el DOM antes, React da un error de hidratación (#418/#423),
   * vuelve a pintar la página entera desde cero y el <html> pierde la clase
   * «oscuro» que la web pone al cargar → la página se queda en MODO CLARO.
   * Señal: <main> y <nav> ya marcados por React, carga completa y 800 ms sin cambios. */
  function esperarHidratacion(maxMs = 20000) {
    return new Promise(resolve => {
      const t0 = Date.now();
      let quietSince = Date.now();
      const obs = new MutationObserver(() => { quietSince = Date.now(); });
      obs.observe(document.documentElement, { childList: true, subtree: true });
      const marcado = el => !el || Object.keys(el).some(k => k.startsWith('__reactFiber$'));
      const tick = () => {
        const listo = document.readyState === 'complete' &&
          marcado(document.querySelector('main')) && marcado(document.querySelector('nav')) &&
          Date.now() - quietSince >= 800;
        if (listo || Date.now() - t0 > maxMs) {
          obs.disconnect();
          if ('requestIdleCallback' in window) requestIdleCallback(() => resolve(), { timeout: 1500 });
          else setTimeout(resolve, 300);
        } else setTimeout(tick, 200);
      };
      tick();
    });
  }


  if (window.__adxMacroLoaded) return;
  window.__adxMacroLoaded = true;

  /* ════════════════════════════════════════════════════════════════
   *  CONFIGURACIÓN
   * ════════════════════════════════════════════════════════════════ */
  const CONFIG = {
    UI_ID: 'adx-macro-ui',
    PARTNER_KEY: 'adx_macro_partner',      // Pokémon 2 de la crianza (se mantiene la clave antigua)
    PARENT1_KEY: 'adx_macro_parent1',      // Pokémon 1 de la crianza (por defecto Ditto)
    MODE_KEY: 'adx_macro_nursery_mode',    // off | pair | mystery
    X2_KEY: 'adx_macro_egg_x2',            // '1': alguien del equipo lleva la Piedra Cálida (los huevos progresan el doble)
    ENERGY_KEY: 'adx_macro_energy_limit',  // energía máxima a gastar por sesión (vacío = sin límite; 0 = solo lo gratis de la manada)
    DEFAULT_PARENT1: 'Ditto',

    // Retardos "humanos" (ms) → [mínimo, máximo]
    EXPLORE_DELAY: [200, 500],      // jitter antes de pulsar ¡EXPLORAR! (ya con las animaciones terminadas)
    ACTION_DELAY: [120, 300],       // jitter antes de pulsar bola / Continuar / Seguir a lo mío
    POLL: [150, 350],               // entre lecturas cuando no hay nada que hacer
    LONG_PAUSE_CHANCE: 0.02,        // probabilidad de una pausa larga aleatoria
    LONG_PAUSE: [900, 1800],
    ANIM_MAX_MS: 4000,              // tope de espera por animaciones del juego (finitas) antes de cada acción
    OUTCOME_MS: 2500,               // tras ¡EXPLORAR!: espera máxima a que aparezca encuentro/diálogo
    NURSERY_GRACE_MS: 2500,         // pantalla quieta este tiempo (sin encuentro pendiente) antes de ir a la Guardería
    NO_BALL_MS: 6000,               // bolas visibles pero deshabilitadas más de este tiempo => se detiene

    // Seguridad
    ENERGY_SETTLE_MS: 3000,         // sin energía confirmada este tiempo (por si aún llega un encuentro) => se detiene
    DISABLED_MS: 6000,              // ¡EXPLORAR! deshabilitado este tiempo => se detiene
    STUCK_MS: 25000,
    MODAL_TRANSITION_MS: 30000,     // pantalla sin botones (animación de captura, combate…): espera máxima
    MODAL_UNKNOWN_MS: 12000,        // ventana con botones que no sé pulsar: espera máxima antes de parar
    GENERIC_BLOCK_RE: /soltar|liberar|vender|abandon|rendir|huir|cancel|dejarlo|salir|comprar|borrar|eliminar|evoluc/,
    MAX_THROWS_PER_ENCOUNTER: 20,   // tope de lanzamientos seguidos sin que cambie la pantalla

    // Guardería
    NURSERY_FALLBACK_EXPLORES: 5,   // se revisa al iniciar; luego justo cuando al huevo le falten 0 exploraciones

    // Capturas
    USE_MASTER_BALL: true,
    UNREGISTERED_RE: /sin registrar/,   // pastilla «⭐ Sin registrar» (Pokémon que aún no está en tu Pokédex)
    SUPER_MIN_PCT: 70,                  // sin registrar: probabilidad >= 70% => Super Ball; < 70% => Ultra Ball
    MIN_RETHROW_MS: 600,                // separación mínima entre dos lanzamientos seguidos

    // Etiquetas (sin tildes, en minúsculas) que se buscan SOLO en las pastillas, el <h3> y el sprite del encuentro.
    // Cualquiera de las dos => Master Ball.
    SHINY_RE: /shiny|shinny|variocolor|cromatic|brillante|✨/,
    LEGENDARY_RE: /legendari|legendary/,
    RARE_LOG_RE: /mitic|singular|epic/,      // solo se registran en consola (llevan Poké Ball)

    THROW_CHECK_MS: 1800,           // tiempo para comprobar que el lanzamiento hizo algo en pantalla

    // Guardería: botón que aparece al elegir la pareja
    CONFIRM_RE: /^[^a-z0-9]*dejarlos juntos\b/,
    // Guardería: botón «Incubar Huevo Misterioso (34)»
    MYSTERY_RE: /incubar huevo misterioso/,
  };

  const RE = {
    seguir: /^[^a-z0-9]*seguir a lo mio\b/,
    continuar: /^[^a-z0-9]*continuar\b/,
    explorar: /^[^a-z0-9]*(explorar|manada)\b/,   // «¡MANADA!» es una variante gratuita de ¡EXPLORAR! con cupo limitado (p. ej. "10 quedan")
    adelante: /^[^a-z0-9]*adelante\b/,           // desafío de entrenador: «¡ADELANTE!»
    volver: /^[^a-z0-9]*volver al mapa\b/,         // fin del combate contra un entrenador
    bienvenido: /^[^a-z0-9]*bienvenido\b/,   // botón del diálogo «¡El huevo se ha abierto!»
    saltar: /^[^a-z0-9]*saltar al resultado\b/,   // combate contra entrenador: saltar directo al resultado
  };

  /* ════════════════════════════════════════════════════════════════
   *  UTILIDADES
   * ════════════════════════════════════════════════════════════════ */
  const log = (...a) => console.log('%c[ADX]', 'color:#34d399;font-weight:bold', ...a);
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const nativeSetTimeout = window.setTimeout.bind(window);
  const sleep = ms => new Promise(r => nativeSetTimeout(r, ms));
  const rand = (a, b) => Math.floor(a + Math.random() * (b - a + 1));

  // minúsculas, sin tildes, espacios colapsados
  const norm = s =>
    String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/\s+/g, ' ').trim();

  const ours = el => !!el.closest('#' + CONFIG.UI_ID + ', #adx-stop-pill');
  const isVisible = el =>
    el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
  const isDisabled = el => el.disabled === true || el.getAttribute('aria-disabled') === 'true';

  const labelOf = el =>
    norm(
      [
        el.textContent,
        el.getAttribute('aria-label'),
        el.getAttribute('title'),
        ...$$('img', el).map(i => `${i.alt || ''} ${i.getAttribute('src') || ''}`),
      ].join(' ')
    );

  // Versión del DOM (sube con cada cambio ajeno a la macro): invalida cachés y despierta las esperas
  let DOMV = 0;
  const wakers = new Set();
  const wake = () => { for (const f of Array.from(wakers)) f(); };
  function nextChange(ms) {                       // espera al siguiente cambio del DOM o, como mucho, ms
    return new Promise(res => {
      const done = () => { wakers.delete(done); clearTimeout(t); res(); };
      const t = nativeSetTimeout(done, ms);
      wakers.add(done);
    });
  }

  // Lista de botones con su etiqueta, cacheada mientras el DOM no cambie (evita re-escanear en cada sondeo)
  let btnCache = { v: -1, t: 0, list: [] };
  function buttonEntries() {
    const now = performance.now();
    if (btnCache.v === DOMV && now - btnCache.t < 400) return btnCache.list;
    const list = [];
    for (const el of document.querySelectorAll('button, [role="button"]')) {
      if (!ours(el)) list.push({ el, label: labelOf(el) });
    }
    btnCache = { v: DOMV, t: now, list };
    return list;
  }
  const buttons = () => buttonEntries().filter(e => isVisible(e.el)).map(e => e.el);
  // Solo se comprueba la visibilidad (costosa) de los botones cuyo texto coincide
  const findByText = re => {
    for (const { el, label } of buttonEntries()) if (re.test(label) && isVisible(el)) return el;
    return undefined;
  };

  const onMap = () => location.pathname.replace(/\/+$/, '') === '/mapa';

  // Escribe en un <input> de React usando el setter nativo y dispara los eventos que React escucha
  function setInputValue(input, value) {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  const lsGet = (k, def = '') => { try { const v = localStorage.getItem(k); return v === null ? def : v; } catch { return def; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* sin storage */ } };

  const getPartner = () => lsGet(CONFIG.PARTNER_KEY).trim();
  const getParent1 = () => lsGet(CONFIG.PARENT1_KEY, CONFIG.DEFAULT_PARENT1).trim() || CONFIG.DEFAULT_PARENT1;
  // Modo de Guardería. Migración: quien ya tenía pareja guardada de la v2.1 entra en «crianza».
  const getMode = () => {
    const m = lsGet(CONFIG.MODE_KEY);
    if (m === 'off' || m === 'pair' || m === 'mystery') return m;
    return getPartner() ? 'pair' : 'off';
  };
  // null = sin límite; 0 = no gastar energía (solo las exploraciones gratis de ¡MANADA!); n = tope de energía
  const getEnergyLimit = () => {
    const raw = String(lsGet(CONFIG.ENERGY_KEY) ?? '').trim();
    if (raw === '') return null;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : null;
  };
  const nurseryOn = () => getMode() === 'mystery' || (getMode() === 'pair' && !!getPartner());

  /* ════════════════════════════════════════════════════════════════
   *  ESTADO
   * ════════════════════════════════════════════════════════════════ */
  class Abort extends Error {}   // parada manual o cambio de ejecución
  class Fail extends Error {     // parada con mensaje corto para el usuario (+ detalle opcional solo para la consola)
    constructor(msg, detail) { super(msg); this.detail = detail; }
  }

  const S = {
    running: false,
    run: 0,
    phase: 'off',            // off | on | nursery
    msg: '',
    explores: 0,
    throws: 0,
    sinceNursery: 0,
    nurseryIn: 5,            // exploraciones que faltan para volver a la Guardería
    hatched: 0,
    shiny: 0,                // encuentros shiny/variocolor vistos en esta sesión
    legendary: 0,            // encuentros legendarios vistos en esta sesión
    noBallsSince: 0,
    noBallUsableSince: 0,
    modalSince: 0,
    lastThrowAt: 0,
    trainers: 0,
    lastExploreAt: 0,
    seenRarities: {},        // etiquetas de rareza vistas: {rara: 12, comun: 30…}
    nurseryDue: false,
    encThrows: 0,
    encKey: '',
    lastProgress: 0,
    disabledSince: 0,
    noEffect: 0,
    spent: 0,                // energía gastada en esta sesión (⚡ + 🌿)
    startedAt: 0,
    endedAt: 0,
    eggMax: 0,               // exploraciones totales del huevo que se está vigilando
    last: null,              // último encuentro: { who, det, sprite, ball }
    lastActionAt: 0,         // último clic de la macro (explorar, bola, diálogo)
  };

  const alive = run => S.running && S.run === run;
  const assertAlive = run => { if (!alive(run)) throw new Abort(); };
  async function pause(run, a, b) {
    await sleep(rand(a, b));
    assertAlive(run);
  }

  // Espera a que fn() sea verdadera. Se reevalúa en cuanto cambia el DOM (con un mínimo entre lecturas) o cada `interval` ms
  async function waitFor(run, fn, timeout = 8000, interval = 150) {
    const t0 = Date.now();
    const gap = 45;
    while (Date.now() - t0 < timeout) {
      assertAlive(run);
      const t1 = performance.now();
      const v = fn();
      if (v) return v;
      await nextChange(interval);
      const rest = gap - (performance.now() - t1);
      if (rest > 0) await sleep(rest);
    }
    return null;
  }

  // Espera del bucle principal cuando no hay nada que hacer: reacciona en cuanto el DOM cambia
  async function idleWait(run) {
    const max = rand(...CONFIG.POLL);
    const t1 = performance.now();
    await nextChange(max);
    const rest = 60 - (performance.now() - t1);
    if (rest > 0) await sleep(rest);
    assertAlive(run);
  }

  /* ════════════════════════════════════════════════════════════════
   *  LECTURAS DEL DOM (mapa)
   * ════════════════════════════════════════════════════════════════ */
  const findExplore = () => {
    for (const { el, label } of buttonEntries()) if (RE.explorar.test(label) && el.closest('main')) return el;
    return undefined;
  };

  // Cabecera: "⚡ 0/54" (normal) y "🌿 1/30" (veterana)
  function readEnergy() {
    const box = $('header span[title^="Tiempo para el siguiente punto"]');
    if (!box) return null;
    const nums = $$('span', box)
      .map(s => s.textContent.trim())
      .filter(t => /^\d+\/\d+$/.test(t))
      .map(t => parseInt(t, 10));
    if (!nums.length) return null;
    return { normal: nums[0], vet: nums[1] ?? 0 };
  }

  function kindFromLabel(t) {
    if (/master ?ball|items\/master-ball/.test(t)) return 'master';
    if (/ultra ?ball|items\/ultra-ball/.test(t)) return 'ultra';
    if (/super ?ball|great ?ball|items\/great-ball/.test(t)) return 'super';
    if (/poke ?ball|items\/poke-ball/.test(t)) return 'poke';
    return null;
  }
  const BALL_NAME = { master: 'Master Ball', ultra: 'Ultra Ball', super: 'Super Ball', poke: 'Poké Ball' };

  // Una bola se puede usar si el botón no está deshabilitado y su stock («x33») no es 0. «Ilimitadas» no tiene stock.
  function ballInfo(el, label, kind) {
    const m = /(?:^|[^a-z0-9])x\s*(\d+)\b/.exec(label);
    const stock = m ? +m[1] : null;
    return { el, kind, stock, disabled: isDisabled(el) || stock === 0 };
  }
  // Solo cuentan como bolas los <button> que están DENTRO de una ventana del juego (el encuentro).
  // Antes valía cualquier botón de la página que mencionase una Ball, y un aviso cualquiera
  // (p. ej. el de «tu Pokémon puede evolucionar») se tomaba por un encuentro.
  const OVERLAY_SEL = 'div.fixed.inset-0';
  const getBalls = () => {
    const out = [];
    for (const { el, label } of buttonEntries()) {
      if (el.tagName !== 'BUTTON' || !el.closest(OVERLAY_SEL)) continue;
      const kind = kindFromLabel(label);
      if (kind && isVisible(el)) out.push(ballInfo(el, label, kind));
    }
    return out;
  };

  // Contenedor del encuentro: primer ancestro de la bola que contiene el <h3> (nombre/nivel) y el sprite
  // Nunca sube más allá de la ventana del encuentro: antes podía llegar a <main> y mirar el
  // «Equipo de exploración», donde tu Tyranitar es shiny → falso «¡SHINY!».
  function encounterScope(ballBtn) {
    const ov = ballBtn.closest(OVERLAY_SEL);
    if (!ov) return null;
    for (let n = ballBtn.parentElement; n; n = n.parentElement) {
      if ($('h3', n) && $('img[src*="/sprites/"]', n)) return n;
      if (n === ov) break;
    }
    return null;
  }

  // Sprite principal del encuentro: el más grande en pantalla (los iconos pequeños no cuentan)
  function mainSprite(scope) {
    let best = null, area = 0;
    for (const img of $$('img[src*="/sprites/"]', scope)) {
      const r = img.getBoundingClientRect();
      const a = r.width * r.height;
      if (a > area) { area = a; best = img; }
    }
    return best;
  }

  // Datos del Pokémon en pantalla. Rareza y tipos son <span class="pastilla">; el nombre está en el alt del sprite
  function readEncounter(scope) {
    const sprite = mainSprite(scope);
    const h3 = $('h3', scope);
    const lv = h3 && $$('span', h3).map(s => /nv\.?\s*(\d+)/i.exec(s.textContent)).find(Boolean);

    const pills = $$('.pastilla,[class*="rounded-pill"]', scope)
      .map(e => norm(e.textContent))
      .filter(t => t && t.length <= 40);
    const shinySprite = !!sprite && /\/sprites\/shiny\//.test(sprite.getAttribute('src') || '');

    const rp = $('.absolute .pastilla', scope);          // pastilla de rareza (esquina superior derecha)
    const rarity = rp ? norm(rp.textContent) : (pills[0] || null);

    // Textos donde puede aparecer la etiqueta. NO se mira el resto de la tarjeta (los objetos/ventajas
    // como «Amuleto Iris» podrían nombrar «shiny» sin que el encuentro lo sea).
    const texts = [...pills, h3 ? norm(h3.textContent) : '', sprite ? norm(sprite.alt) : ''];
    const shinyHit = texts.find(t => CONFIG.SHINY_RE.test(t));
    const legendHit = texts.find(t => CONFIG.LEGENDARY_RE.test(t));
    const shiny = shinySprite || !!shinyHit;
    const legendary = !!legendHit;
    const unregistered = pills.some(t => CONFIG.UNREGISTERED_RE.test(t));

    // «Probabilidad de captura  56%»
    const pl = $$('.titulo-seccion', scope).find(e => norm(e.textContent).includes('probabilidad de captura'));
    const pm = pl && pl.parentElement ? /(\d+(?:[.,]\d+)?)\s*%/.exec(pl.parentElement.textContent) : null;
    const pct = pm ? parseFloat(pm[1].replace(',', '.')) : null;

    return {
      name: sprite ? sprite.alt : null,
      level: lv ? +lv[1] : null,
      pills,
      rarity,
      shiny,
      legendary,
      unregistered,
      pct,
      rare: pills.filter(t => CONFIG.RARE_LOG_RE.test(t)),
      hasCatchPct: !!pl,
      sprite: sprite ? sprite.getAttribute('src') : null,
      masterReason: shinySprite ? 'sprite shiny' : shinyHit || legendHit || null,
    };
  }

  /* ════════════════════════════════════════════════════════════════
   *  LECTURAS DEL DOM (guardería)
   * ════════════════════════════════════════════════════════════════ */
  // Prioriza el contador «Huevos (x/y)»; si no existe, usa el texto «No tienes huevos en marcha»
  function readEggs() {
    const h = $$('h2, h3').find(e => /^huevos \(\d+\/\d+\)/.test(norm(e.textContent)));
    if (h) {
      const m = /\((\d+)\/(\d+)\)/.exec(h.textContent);
      const cur = +m[1], max = +m[2];
      return { cur, max, empty: cur === 0 };
    }
    const emptyText = $$('main p').some(p => norm(p.textContent).includes('no tienes huevos en marcha'));
    return emptyText ? { cur: 0, max: null, empty: true } : null;
  }

  // Huevos en marcha: <li class="tarjeta"> con «Exploraciones n/m» y botón «Abrir» (deshabilitado hasta completarse)
  function readEggItems() {
    const h = $$('h2, h3').find(e => /^huevos \(\d+\/\d+\)/.test(norm(e.textContent)));
    const section = h && h.closest('section');
    if (!section) return [];
    return $$('li.tarjeta', section).map(li => {
      const prog = $$('span.tabular-nums', li).map(e => /^(\d+)\/(\d+)$/.exec(e.textContent.trim())).find(Boolean);
      const btn = $$('button', li).find(b => /^abrir\b/.test(norm(b.textContent)));
      return prog && { li, cur: +prog[1], max: +prog[2], btn, ready: !!btn && !isDisabled(btn) };
    }).filter(Boolean);
  }

  const findSearch = () =>
    $$('input').find(i =>
      norm(i.getAttribute('aria-label')).includes('buscar en la guarderia') ||
      norm(i.placeholder).includes('buscar por nombre')
    );

  const listCards = () =>
    $$('main ul.grid li > button')
      .map(btn => {
        const img = $('img[alt]', btn);
        return img && {
          btn,
          name: img.alt,
          key: norm(img.alt),
          disabled: isDisabled(btn),
          shiny: /\/sprites\/shiny\//.test(img.getAttribute('src') || ''),
        };
      })
      .filter(Boolean);

  // Coincidencia exacta de nombre; prefiere habilitados y no-shiny; respeta el orden de la lista
  const isSelectedCard = c => /border-hoja-500/.test(c.btn.className);
  function findCard(name) {
    const k = norm(name);
    const c = listCards().filter(x => x.key === k && !x.disabled && !isSelectedCard(x));
    return c.find(x => !x.shiny) || c[0] || null;
  }

  const visibleLabels = (n = 8) =>
    buttons().map(b => (b.textContent || '').trim().replace(/\s+/g, ' '))
      .filter(t => t && t.length < 40).slice(0, n).join(' | ');

  /* ════════════════════════════════════════════════════════════════
   *  INTERFAZ (inyectada bajo ¡EXPLORAR! / IR AL MAPA)
   * ════════════════════════════════════════════════════════════════ */
  // Solo lo estrictamente necesario para el pin de parada (posicion fija/arrastre) y para
  // ocultar el mensaje cuando esta vacio. El resto de la tarjeta usa las clases propias
  // del juego (tarjeta, pastilla, titulo-seccion, boton-principal...) para heredar su estilo.
  function ensureStyle() {
    if ($('#adx-style')) return;
    const st = document.createElement('style');
    st.id = 'adx-style';
    const U = '#' + CONFIG.UI_ID;
    st.textContent = `
      ${U} .adx-msg:empty{display:none}
      ${U} [hidden]{display:none!important}
      ${U} .adx-head-ico{width:40px;height:40px;display:grid;place-items:center;font-size:20px;flex-shrink:0}
      ${U} .adx-dot{width:8px;height:8px;border-radius:999px;background:currentColor;display:inline-block}
      ${U} .adx-badge[data-s="on"] .adx-dot,${U} .adx-badge[data-s="nursery"] .adx-dot{animation:adx-pulso 1.2s ease-in-out infinite}
      @keyframes adx-pulso{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.7)}}
      ${U} .adx-lbl{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:6px}
      ${U} .adx-step{display:grid;grid-template-columns:42px 1fr 42px;gap:6px}
      ${U} .adx-step button{height:42px;font-size:18px;font-weight:800;line-height:1}
      ${U} .adx-step input{text-align:center;height:42px;-moz-appearance:textfield}
      ${U} .adx-step input::-webkit-outer-spin-button,${U} .adx-step input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
      ${U} .adx-chips{display:flex;gap:6px;margin-top:6px}
      ${U} .adx-chips button{flex:1;padding:4px 0;font-size:11px;font-weight:800}
      ${U} .adx-seg{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
      ${U} .adx-seg button{padding:8px 4px;font-size:11px;font-weight:800;display:flex;flex-direction:column;align-items:center;gap:2px;line-height:1.15}
      ${U} .adx-seg button span:first-child{font-size:18px}
      ${U} .adx-pair{display:grid;grid-template-columns:1fr auto 1fr;gap:6px;align-items:center}
      ${U} .adx-x2{width:100%;display:flex;align-items:center;gap:10px;padding:8px 10px;text-align:left;margin-top:8px;transition:box-shadow .2s, background .2s}
      ${U} .adx-x2 img{width:30px;height:30px;image-rendering:pixelated;flex-shrink:0;transition:filter .3s, transform .3s}
      ${U} .adx-x2[aria-checked="false"] img{filter:grayscale(1) opacity(.55)}
      ${U} .adx-x2[aria-checked="true"] img{filter:drop-shadow(0 0 5px #FF8A3A);transform:scale(1.06)}
      ${U} .adx-x2[aria-checked="true"]{box-shadow:0 0 0 1px #FFB347, 0 0 14px -4px #FF8A3A}
      ${U} .adx-x2 .adx-x2-t{flex:1;min-width:0;line-height:1.2}
      ${U} .adx-x2 .adx-x2-t b{display:block;font-size:12px;font-weight:800}
      ${U} .adx-x2 .adx-x2-t small{display:block;font-size:10px;font-weight:700;opacity:.75}
      ${U} .adx-x2 .adx-sw{position:relative;width:38px;height:22px;border-radius:999px;flex-shrink:0;background:rgba(127,127,127,.35);transition:background .2s}
      ${U} .adx-x2 .adx-sw::after{content:"";position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:999px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.3);transition:transform .2s}
      ${U} .adx-x2[aria-checked="true"] .adx-sw{background:linear-gradient(90deg,#FF8A3A,#E0473A)}
      ${U} .adx-x2[aria-checked="true"] .adx-sw::after{transform:translateX(16px)}
      ${U} .adx-heart{font-size:16px;opacity:.8}
      ${U} .adx-err{box-shadow:0 0 0 2px #E0473A}
      ${U} .adx-tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
      ${U} .adx-tile{text-align:center;padding:6px 2px}
      ${U} .adx-tile b{display:block;font-size:15px;line-height:1.2}
      ${U} .adx-tile small{display:block;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;opacity:.75}
      ${U} .adx-bar{height:10px}
      ${U} .adx-bar > span{display:block;height:100%;border-radius:999px;transition:width .5s}
      ${U} .adx-last img.adx-spr{width:44px;height:44px;image-rendering:pixelated;flex-shrink:0}
      ${U} .adx-last img.adx-ball{width:22px;height:22px;image-rendering:pixelated}
      ${U} button:disabled{opacity:.55;cursor:not-allowed}
      #adx-stop-pill{position:fixed;left:12px;
        bottom:calc(var(--nav-alto, 4rem) + 3.5rem + env(safe-area-inset-bottom, 0px));z-index:2147483000;
        cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none;
        transition:opacity .12s;font-variant-numeric:tabular-nums}
      #adx-stop-pill.adx-drag{cursor:grabbing;transition:none;opacity:.85}
    `;
    document.head.appendChild(st);
  }

  // Clases tomadas literalmente de otros sitios del juego para que la tarjeta se vea nativa
  // (y cambie sola con el modo oscuro y el tema de color).
  const BADGE_CLASS = {
    off: 'adx-badge pastilla border-2 border-rojo-100 bg-lienzo text-rojo-600 flex items-center gap-1.5',
    on: 'adx-badge pastilla border-2 border-hoja-200 bg-hoja-50 text-hoja-700 flex items-center gap-1.5',
    nursery: 'adx-badge pastilla border-2 border-ambar-200 bg-ambar-50 text-ambar-700 flex items-center gap-1.5',
  };
  const BTN_CLASS = {
    start: 'adx-btn boton-principal w-full',
    stop: 'adx-btn boton-secundario w-full',
  };
  const SEG_ON = 'rounded-card border-2 border-hoja-400 bg-hoja-50 text-hoja-700';
  const SEG_OFF = 'rounded-card border-2 border-crema-200 bg-crema-50 text-tinta-500';
  const FIELD = 'w-full rounded-card border-2 border-crema-200 bg-crema-50 px-3 py-2 text-sm font-semibold text-tinta-600 outline-none';
  const BALL_IMG = { poke: 'poke-ball', super: 'great-ball', ultra: 'ultra-ball', master: 'master-ball' };
  const MYSTERY_LEFT_KEY = 'adx_macro_mystery_left';
  // Piedra Cálida: cada exploración suma 2 al huevo (uno de 5 se abre en 3 exploraciones)
  const eggX2 = () => lsGet(CONFIG.X2_KEY, '0') === '1';
  const pasoHuevo = () => (eggX2() ? 2 : 1);

  const fmtTime = ms => {
    const t = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), sec = t % 60;
    const mm = String(m).padStart(2, '0'), ss = String(sec).padStart(2, '0');
    return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  };
  const sessionMs = () => (S.startedAt ? (S.running ? Date.now() : S.endedAt || Date.now()) - S.startedAt : 0);

  function buildCard() {
    const card = document.createElement('div');
    card.id = CONFIG.UI_ID;
    card.className = 'tarjeta space-y-3 p-3';
    card.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="adx-head-ico rounded-card border-2 border-crema-200 bg-crema-100">🎯</span>
        <div class="min-w-0 flex-1">
          <p class="font-display text-base font-extrabold leading-tight">Macro de captura</p>
          <p class="adx-sub truncate text-[11px] font-bold text-tinta-400"></p>
        </div>
        <span class="${BADGE_CLASS.off}" data-s="off"><span class="adx-dot"></span><span class="adx-badge-t">DETENIDO</span></span>
      </div>

      <div class="adx-settings space-y-3">
        <div>
          <div class="adx-lbl">
            <label class="titulo-seccion" for="adx-energy">⚡ Energía a gastar</label>
            <span class="adx-have text-[11px] font-bold text-tinta-400 tabular-nums"></span>
          </div>
          <div class="adx-step">
            <button type="button" class="boton-suave" data-e="-1" aria-label="Menos energía">−</button>
            <input id="adx-energy" class="adx-in-energy ${FIELD} font-display !text-base font-extrabold tabular-nums" type="number" min="0" step="1" inputmode="numeric" placeholder="∞  toda" autocomplete="off">
            <button type="button" class="boton-suave" data-e="1" aria-label="Más energía">+</button>
          </div>
          <div class="adx-chips">
            <button type="button" class="boton-suave" data-q="0">0</button>
            <button type="button" class="boton-suave" data-q="7">7</button>
            <button type="button" class="boton-suave" data-q="20">20</button>
            <button type="button" class="boton-suave" data-q="">Toda</button>
          </div>
        </div>

        <div>
          <div class="adx-lbl"><span class="titulo-seccion">🥚 Guardería</span></div>
          <div class="adx-seg" role="radiogroup" aria-label="Guardería">
            <button type="button" data-mode="off" role="radio"><span>🚫</span><span>Sin usar</span></button>
            <button type="button" data-mode="pair" role="radio"><span>💞</span><span>Crianza</span></button>
            <button type="button" data-mode="mystery" role="radio"><span>🎁</span><span>Misterioso</span></button>
          </div>
          <div class="adx-pair mt-1" style="margin-top:8px">
            <input id="adx-parent1" class="adx-in-p1 ${FIELD}" type="text" placeholder="Ditto" aria-label="Pokémon 1" autocomplete="off" spellcheck="false">
            <span class="adx-heart">💗</span>
            <input id="adx-partner" class="adx-in-p2 ${FIELD}" type="text" placeholder="Pareja" aria-label="Pokémon 2" autocomplete="off" spellcheck="false">
          </div>
          <button type="button" role="switch" class="adx-x2 rounded-card border-2 border-ambar-200 bg-ambar-50 text-ambar-700" aria-checked="false">
            <img src="/items/piedra-calida.png?v=5" alt="">
            <span class="adx-x2-t"><b>Piedra Cálida</b><small class="adx-x2-s"></small></span>
            <span class="adx-sw" aria-hidden="true"></span>
          </button>
          <p class="adx-mystery-info mt-1 flex items-center gap-2 rounded-card border-2 p-1.5 text-[11px] font-extrabold border-ambar-200 bg-ambar-50 text-ambar-700" style="margin-top:8px">
            <img src="/items/mystery-egg.png?v=5" alt="" width="18" height="18" class="pixelado" style="width:18px;height:18px"><span class="adx-mystery-t"></span>
          </p>
        </div>
      </div>

      <button class="${BTN_CLASS.start}" type="button" data-s="start">▶ Iniciar macro</button>

      <div class="adx-progress space-y-2">
        <div>
          <div class="mb-1 flex items-baseline justify-between text-[11px] font-extrabold text-tinta-500">
            <span>⚡ Energía gastada</span><span class="adx-en-t tabular-nums"></span>
          </div>
          <div class="adx-bar w-full overflow-hidden rounded-pill border-2 border-tinta-700/10 bg-crema-200"><span class="adx-en-bar" style="width:0%;background-color:#F2B632"></span></div>
        </div>
        <div class="adx-egg">
          <div class="mb-1 flex items-baseline justify-between text-[11px] font-extrabold text-tinta-500">
            <span>🥚 Próximo huevo</span><span class="adx-egg-t tabular-nums"></span>
          </div>
          <div class="adx-bar w-full overflow-hidden rounded-pill border-2 border-tinta-700/10 bg-crema-200"><span class="adx-egg-bar" style="width:0%;background-color:#2FA84F"></span></div>
        </div>
      </div>

      <div class="adx-last flex items-center gap-2 rounded-card border-2 border-crema-200 bg-crema-50 p-2" hidden>
        <img class="adx-spr pixelado" alt="">
        <div class="min-w-0 flex-1">
          <p class="adx-last-n truncate text-sm font-extrabold leading-tight"></p>
          <p class="adx-last-d truncate text-[11px] font-bold text-tinta-400"></p>
        </div>
        <img class="adx-ball pixelado" alt="">
      </div>

      <div class="adx-tiles">
        <div class="adx-tile rounded-card border-2 border-crema-200 bg-crema-50"><b class="adx-t-exp tabular-nums">0</b><small>Explor.</small></div>
        <div class="adx-tile rounded-card border-2 border-crema-200 bg-crema-50"><b class="adx-t-thr tabular-nums">0</b><small>Balls</small></div>
        <div class="adx-tile rounded-card border-2 border-crema-200 bg-crema-50"><b class="adx-t-egg tabular-nums">0</b><small>Huevos</small></div>
        <div class="adx-tile rounded-card border-2 border-crema-200 bg-crema-50"><b class="adx-t-time tabular-nums">00:00</b><small>Tiempo</small></div>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <span class="pastilla border-2 border-ambar-200 bg-ambar-50 text-ambar-700 flex items-center justify-center gap-1" data-k="shiny">✨ Shiny <b>0</b></span>
        <span class="pastilla border-2 border-rojo-100 bg-lienzo text-rojo-600 flex items-center justify-center gap-1" data-k="legendary">👑 Legendarios <b>0</b></span>
      </div>
      <p class="adx-msg rounded-card border-2 border-crema-200 bg-crema-50 p-2 text-[11px] font-bold text-tinta-600"></p>
    `;
    const inEnergy = $('.adx-in-energy', card);
    const inP1 = $('.adx-in-p1', card);
    const inP2 = $('.adx-in-p2', card);
    inEnergy.value = getEnergyLimit() ?? '';
    inP1.value = getParent1();
    inP2.value = getPartner();

    const setEnergy = v => {
      const vacio = v === '' || v === null || v === undefined;
      const n = vacio ? null : Math.max(0, parseInt(v, 10) || 0);
      inEnergy.value = n ?? '';
      lsSet(CONFIG.ENERGY_KEY, n === null ? '' : String(n));
      renderUI();
    };
    inEnergy.addEventListener('input', () => { lsSet(CONFIG.ENERGY_KEY, inEnergy.value.trim()); renderUI(); });
    for (const b of $$('[data-e]', card)) b.addEventListener('click', () => setEnergy(Math.max(0, (getEnergyLimit() ?? 0) + +b.dataset.e)));
    for (const b of $$('[data-q]', card)) b.addEventListener('click', () => setEnergy(b.dataset.q));
    for (const b of $$('[data-mode]', card)) b.addEventListener('click', () => { lsSet(CONFIG.MODE_KEY, b.dataset.mode); renderUI(); });
    const x2 = $('.adx-x2', card);
    if (x2) x2.addEventListener('click', () => {
      const on = !eggX2();
      lsSet(CONFIG.X2_KEY, on ? '1' : '0');
      // lo que faltaba para el huevo se recalcula con el nuevo ritmo
      if (S.eggMax > 0) {
        const faltaProgreso = Math.max(0, (S.nurseryIn - S.sinceNursery) * (on ? 1 : 2));
        S.nurseryIn = S.sinceNursery + Math.max(1, Math.ceil(faltaProgreso / (on ? 2 : 1)));
      }
      renderUI();
    });

    inP1.addEventListener('input', () => lsSet(CONFIG.PARENT1_KEY, inP1.value.trim()));
    // Si se deja vacío, al salir del campo vuelve a Ditto
    inP1.addEventListener('blur', () => { if (!inP1.value.trim()) { inP1.value = CONFIG.DEFAULT_PARENT1; lsSet(CONFIG.PARENT1_KEY, CONFIG.DEFAULT_PARENT1); } });
    inP2.addEventListener('input', () => { lsSet(CONFIG.PARTNER_KEY, inP2.value.trim()); inP2.classList.remove('adx-err'); });
    // Enter en cualquier campo = iniciar
    for (const i of [inEnergy, inP1, inP2]) i.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); toggle(); } });
    $('.adx-btn', card).addEventListener('click', toggle);
    return card;
  }

  const setText = (el, v) => { if (el && el.textContent !== v) el.textContent = v; };

  // Botón ovalado de parada: visible en cualquier página mientras la macro esté en marcha.
  // Se puede arrastrar a donde no moleste; la posición se recuerda.
  const PILL_POS_KEY = 'adx_macro_pill_pos';

  function placePill(pill, x, y) {
    const w = pill.offsetWidth || 90, h = pill.offsetHeight || 28;
    const cx = Math.min(Math.max(0, x), Math.max(0, window.innerWidth - w));
    const cy = Math.min(Math.max(0, y), Math.max(0, window.innerHeight - h));
    pill.style.left = cx + 'px';
    pill.style.top = cy + 'px';
    pill.style.bottom = 'auto';
    return { x: cx, y: cy };
  }

  function makePill() {
    const pill = document.createElement('button');
    pill.id = 'adx-stop-pill';
    pill.type = 'button';
    pill.className = 'pastilla border-2 border-rojo-100 bg-lienzo text-rojo-600 shadow-suave px-3 py-1.5 font-extrabold';
    pill.title = 'Detener la macro (arrástrame para moverme)';
    pill.textContent = '■ Parar';
    document.body.appendChild(pill);

    try {
      const pos = JSON.parse(localStorage.getItem(PILL_POS_KEY) || 'null');
      if (pos && Number.isFinite(pos.x) && Number.isFinite(pos.y)) placePill(pill, pos.x, pos.y);
    } catch { /* posición por defecto */ }

    let drag = null, moved = false;
    pill.addEventListener('pointerdown', e => {
      if (e.button !== undefined && e.button !== 0) return;
      const r = pill.getBoundingClientRect();
      drag = { dx: e.clientX - r.left, dy: e.clientY - r.top, sx: e.clientX, sy: e.clientY };
      moved = false;
      try { pill.setPointerCapture(e.pointerId); } catch { /* ignorar */ }
    });
    pill.addEventListener('pointermove', e => {
      if (!drag) return;
      if (!moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 6) return;
      moved = true;
      pill.classList.add('adx-drag');
      placePill(pill, e.clientX - drag.dx, e.clientY - drag.dy);
    });
    const end = () => {
      if (!drag) return;
      drag = null;
      pill.classList.remove('adx-drag');
      if (moved) {
        try {
          const r = pill.getBoundingClientRect();
          localStorage.setItem(PILL_POS_KEY, JSON.stringify({ x: Math.round(r.left), y: Math.round(r.top) }));
        } catch { /* sin storage */ }
      }
    };
    pill.addEventListener('pointerup', end);
    pill.addEventListener('pointercancel', end);
    pill.addEventListener('click', () => {
      if (moved) { moved = false; return; }          // fue un arrastre, no una pulsación
      stop('Detenida manualmente.');
    });
    return pill;
  }

  function syncStopPill() {
    let pill = document.getElementById('adx-stop-pill');
    if (!S.running) { if (pill) pill.remove(); return; }
    ensureStyle();
    if (!pill) makePill();
    else if (!pill.isConnected) document.body.appendChild(pill);
  }

  function renderUI() {
    syncStopPill();
    const pill = document.getElementById('adx-stop-pill');
    if (pill && S.running) setText(pill, `■ Parar · ${fmtTime(sessionMs())}`);
    const card = document.getElementById(CONFIG.UI_ID);
    if (!card) return;

    const mode = getMode();
    const lim = getEnergyLimit();

    // Cabecera
    const badge = $('.adx-badge', card);
    if (badge && badge.dataset.s !== S.phase) {
      badge.className = BADGE_CLASS[S.phase] || BADGE_CLASS.off;
      badge.dataset.s = S.phase;
    }
    setText($('.adx-badge-t', card), S.phase === 'on' ? 'ACTIVO' : S.phase === 'nursery' ? 'GUARDERÍA' : 'DETENIDO');
    const nurseryTxt = mode === 'mystery' ? '🎁 Huevo Misterioso'
      : mode === 'pair' ? `💞 ${getParent1()} + ${getPartner() || '¿?'}` : 'sin Guardería';
    setText($('.adx-sub', card), `${lim === null ? '⚡ toda la energía' : lim === 0 ? '⚡ 0 · solo gratis' : '⚡ ' + lim} · ${nurseryTxt}`);

    // Ajustes: se ocultan con la macro en marcha (el resumen queda en la cabecera)
    const settings = $('.adx-settings', card);
    if (settings) settings.hidden = S.running;
    const en = readEnergy();
    setText($('.adx-have', card), en ? `tienes ⚡ ${en.normal}${en.vet ? ' · 🌿 ' + en.vet : ''}` : '');
    for (const b of $$('[data-q]', card)) {
      const on = b.dataset.q === '' ? lim === null : lim === +b.dataset.q;
      b.style.boxShadow = on ? 'inset 0 0 0 2px currentColor' : '';
    }
    for (const b of $$('[data-mode]', card)) {
      const on = b.dataset.mode === mode;
      const cls = on ? SEG_ON : SEG_OFF;
      if (b.className !== cls) b.className = cls;
      b.setAttribute('aria-checked', String(on));
    }
    const pair = $('.adx-pair', card);
    if (pair) pair.hidden = mode !== 'pair';
    const x2b = $('.adx-x2', card);
    if (x2b) {
      const on = eggX2();
      x2b.hidden = mode === 'off';
      if (x2b.getAttribute('aria-checked') !== String(on)) x2b.setAttribute('aria-checked', String(on));
      setText($('.adx-x2-s', card), on ? 'Los huevos progresan ×2: uno de 5 se abre en 3 exploraciones' : 'Actívalo si alguien del equipo la lleva (huevos ×2)');
    }
    const mys = $('.adx-mystery-info', card);
    if (mys) {
      mys.hidden = mode !== 'mystery';
      const left = lsGet(MYSTERY_LEFT_KEY);
      setText($('.adx-mystery-t', card), left !== '' ? `Te quedan ${left} (según la última visita)` : 'Se incuba uno cada vez que la Guardería se vacía');
    }

    // Botón principal
    const btn = $('.adx-btn', card);
    const runKey = S.running ? 'stop' : 'start';
    if (btn && btn.dataset.s !== runKey) {
      btn.className = BTN_CLASS[runKey];
      btn.dataset.s = runKey;
    }
    setText(btn, S.running ? '■ Detener macro' : '▶ Iniciar macro');

    // Barras de progreso
    setText($('.adx-en-t', card), lim === null ? `${S.spent} · sin límite` : `${S.spent} / ${lim}`);
    const enBar = $('.adx-en-bar', card);
    if (enBar) enBar.style.width = (lim ? Math.min(100, (S.spent / lim) * 100) : 0) + '%';

    const egg = $('.adx-egg', card);
    const eggKnown = nurseryOn() && S.eggMax > 0 && (S.running || S.explores > 0);
    if (egg) egg.hidden = !eggKnown;
    if (eggKnown) {
      const left = Math.max(0, S.nurseryIn - S.sinceNursery);
      const done = Math.max(0, Math.min(S.eggMax, S.eggMax - left * pasoHuevo()));
      setText($('.adx-egg-t', card), left ? `faltan ${left} exploraciones${eggX2() ? ' · ×2' : ''}` : '¡listo para abrir!');
      const eb = $('.adx-egg-bar', card);
      if (eb) eb.style.width = Math.round((done / S.eggMax) * 100) + '%';
    }

    // Último encuentro
    const last = $('.adx-last', card);
    if (last) {
      last.hidden = !S.last;
      if (S.last) {
        const spr = $('.adx-spr', last), ball = $('.adx-ball', last);
        if (S.last.sprite && spr.getAttribute('src') !== S.last.sprite) spr.setAttribute('src', S.last.sprite);
        spr.hidden = !S.last.sprite;
        const bsrc = `/items/${BALL_IMG[S.last.ball] || 'poke-ball'}.png?v=5`;
        if (ball.getAttribute('src') !== bsrc) { ball.hidden = false; ball.onerror = () => { ball.hidden = true; }; ball.setAttribute('src', bsrc); }
        ball.alt = BALL_NAME[S.last.ball] || '';
        setText($('.adx-last-n', last), S.last.who);
        setText($('.adx-last-d', last), S.last.det);
      }
    }

    // Contadores
    setText($('.adx-t-exp', card), String(S.explores));
    setText($('.adx-t-thr', card), String(S.throws));
    setText($('.adx-t-egg', card), String(S.hatched));
    setText($('.adx-t-time', card), fmtTime(sessionMs()));
    setText($('[data-k="shiny"] b', card), String(S.shiny));
    setText($('[data-k="legendary"] b', card), String(S.legendary));
    setText($('.adx-msg', card), S.msg);

    for (const el of $$('input, .adx-settings button', card)) el.disabled = S.running;
  }

  // Reloj de la sesión (solo refresca textos mientras la macro está en marcha)
  setInterval(() => { if (S.running) renderUI(); }, 1000);

  // Inyectar antes de que React termine de hidratar provoca los errores #418/#423 y Next.js deja la
  // página EN BLANCO. React marca los nodos (__reactProps$) ya durante la hidratación, ANTES de terminarla,
  // así que eso solo no basta: además se exige carga completa y un rato sin cambios en el DOM.
  // Y ya no se fuerza la inserción a los 15 s: si no está claro, se sigue esperando.
  let hydrated = false;
  function waitHydration() {
    esperarHidratacion(60000).then(() => { hydrated = true; syncUI(); });
  }

  function syncUI() {
    try { syncUIInner(); } catch (e) { console.warn('[ADX] syncUI:', e); }
  }
  function syncUIInner() {
    let card = document.getElementById(CONFIG.UI_ID);

    if (!onMap()) { if (card) card.remove(); return; }   // solo en la vista del mapa
    if (!hydrated) return;
    syncStopPill();

    // Salida rápida: la tarjeta sigue pegada al contenedor de ¡EXPLORAR! (no hace falta buscar nada)
    const prev = card && card.isConnected ? card.previousElementSibling : null;
    if (prev && prev.querySelector('button.boton-principal')) { renderUI(); return; }

    const ex = findExplore();
    const anchor = ex && ex.parentElement;               // contenedor de ¡EXPLORAR! + IR AL MAPA
    if (!card) { ensureStyle(); card = buildCard(); }

    if (anchor) {
      if (!card.isConnected || card.previousElementSibling !== anchor) {
        anchor.insertAdjacentElement('afterend', card);
      }
    } else if (!card.isConnected && S.running) {
      const main = $('main');
      if (main) main.prepend(card);                      // el macro sigue vivo: no perder el botón de parar
    }
    renderUI();
  }

  let syncTimer = null;
  const observer = new MutationObserver(records => {
    const card = document.getElementById(CONFIG.UI_ID);
    const pill = document.getElementById('adx-stop-pill');
    const foreign = records.some(r => !(card && card.contains(r.target)) && !(pill && (pill === r.target || pill.contains(r.target))));
    if (!foreign) return;                                            // ignorar nuestros propios cambios
    DOMV++;
    wake();
    clearTimeout(syncTimer);
    syncTimer = nativeSetTimeout(syncUI, 80);
  });

  /* ════════════════════════════════════════════════════════════════
   *  AVISOS Y CONTROL
   * ════════════════════════════════════════════════════════════════ */
  function setMsg(t) {
    S.msg = t;
    renderUI();
  }

  // Mensaje discreto y breve (texto casi transparente abajo). Sin notificaciones del sistema ni sonido.
  function toast(text, ms = 2500) {
    const viejo = document.getElementById('adx-toast');
    if (viejo) viejo.remove();
    const t = document.createElement('div');
    t.id = 'adx-toast';
    t.textContent = text;
    t.style.cssText = 'position:fixed;left:50%;bottom:calc(var(--nav-alto,4rem) + 1.25rem);transform:translateX(-50%);z-index:2147483000;' +
      'max-width:88vw;padding:4px 12px;border-radius:999px;text-align:center;pointer-events:none;' +
      'font:700 13px/1.3 system-ui,sans-serif;color:rgba(255,255,255,.8);background:rgba(0,0,0,.22);opacity:0;transition:opacity .25s ease';
    document.body.appendChild(t);
    requestAnimationFrame(() => { t.style.opacity = '1'; });
    setTimeout(() => { t.style.opacity = '0'; }, Math.max(0, ms - 300));
    setTimeout(() => t.remove(), ms);
  }

  function notify(text) {
    console.warn('[ADX]', text);
    toast(text);
  }

  // Una sola vibración corta (móvil)
  function vibrate() {
    try {
      if (navigator.vibrate) navigator.vibrate(220);
    } catch { /* sin vibración (navegador de escritorio, permisos, etc.) */ }
  }

  // Notificación del sistema (solo para shiny/legendario). El permiso se pide al iniciar la macro (hace falta un toque).
  function pedirPermisoNotif() {
    try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); } catch { /* sin notificaciones */ }
  }
  function notificarSistema(texto) {
    try {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      const opts = { body: texto, tag: 'adx-raro', renotify: true, requireInteraction: true, icon: '/favicon.ico' };
      try { new Notification('Aurora Dex', opts); }
      catch {                                   // Chrome de Android no deja «new Notification»: se usa el service worker
        if (navigator.serviceWorker) navigator.serviceWorker.getRegistration().then(r => r && r.showNotification('Aurora Dex', opts)).catch(() => {});
      }
    } catch { /* sin notificaciones */ }
  }

  /* Aviso completo: tarjeta en la página (con sprite, título y datos) + notificación del sistema + vibración.
   * tipo: 'fin' (verde), 'aviso' (ámbar), 'error' (rojo), 'shiny' (dorado, con sonido y sin cerrarse sola). */
  const AVISO_COLOR = {
    fin: ['#2FA84F', 'linear-gradient(135deg,#1F7A3A,#2FA84F)'],
    aviso: ['#E0A21E', 'linear-gradient(135deg,#B8791A,#E0A21E)'],
    error: ['#E0473A', 'linear-gradient(135deg,#A8322A,#E0473A)'],
    shiny: ['#FFB23E', 'linear-gradient(135deg,#F5A300,#F97316 55%,#E0473A)'],
  };
  function sonido() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [880, 1320, 1760, 2349].forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'triangle'; o.frequency.value = f; o.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(0.11, ctx.currentTime + i * 0.13);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.13 + 0.25);
        o.start(ctx.currentTime + i * 0.13); o.stop(ctx.currentTime + i * 0.13 + 0.26);
      });
    } catch { /* sin audio */ }
  }
  function avisar({ tipo = 'fin', titulo, lineas = [], sprite = null }) {
    const [color, fondo] = AVISO_COLOR[tipo] || AVISO_COLOR.fin;
    const icono = sprite ? new URL(sprite, location.origin).href : new URL('/icono-app.svg', location.origin).href;
    // tarjeta en la página
    const viejo = document.getElementById('adx-aviso');
    if (viejo) viejo.remove();
    const d = document.createElement('div');
    d.id = 'adx-aviso';
    d.setAttribute('role', 'alert');
    d.style.cssText = 'position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 12px);transform:translate(-50%,-20px);z-index:2147483001;' +
      `width:min(380px,calc(100vw - 24px));border-radius:18px;overflow:hidden;box-shadow:0 14px 36px -10px rgba(0,0,0,.55),0 0 0 2px ${color};` +
      'background:rgb(var(--lienzo,255 255 255));color:inherit;opacity:0;transition:opacity .3s ease,transform .3s ease;font-family:inherit';
    const esc = x => String(x ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    d.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:${fondo};color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.28)">
        <div style="width:52px;height:52px;flex-shrink:0;border-radius:14px;background:rgba(255,255,255,.22);display:grid;place-items:center;${tipo === 'shiny' ? 'box-shadow:0 0 18px rgba(255,240,180,.9)' : ''}">
          ${sprite ? `<img src="${esc(sprite)}" alt="" style="width:48px;height:48px;image-rendering:pixelated">` : `<span style="font-size:26px">${tipo === 'error' ? '⚠️' : tipo === 'aviso' ? '⚡' : '✅'}</span>`}
        </div>
        <div style="min-width:0;flex:1">
          <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;opacity:.85">Macro de captura</p>
          <p style="margin:0;font-size:16px;font-weight:900;line-height:1.2">${esc(titulo)}</p>
        </div>
        <button type="button" aria-label="Cerrar" style="width:30px;height:30px;border-radius:999px;border:0;background:rgba(0,0,0,.18);color:#fff;font-weight:900;cursor:pointer">✕</button>
      </div>
      ${lineas.length ? `<ul style="margin:0;padding:10px 16px 12px;list-style:none;display:grid;gap:4px;font-size:12px;font-weight:700">${lineas.map(l => `<li>${esc(l)}</li>`).join('')}</ul>` : ''}`;
    d.querySelector('button').addEventListener('click', () => d.remove());
    document.body.appendChild(d);
    requestAnimationFrame(() => { d.style.opacity = '1'; d.style.transform = 'translate(-50%,0)'; });
    if (tipo !== 'shiny') setTimeout(() => { if (d.isConnected) { d.style.opacity = '0'; setTimeout(() => d.remove(), 350); } }, 12000);
    // sonido y vibración
    if (tipo === 'shiny') { sonido(); try { navigator.vibrate && navigator.vibrate([300, 120, 300, 120, 500]); } catch { /* nada */ } }
    else vibrate();
    // notificación del sistema
    try {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      const opts = { body: lineas.join('\n'), icon: icono, badge: icono, tag: 'adx-macro-' + tipo, renotify: true, requireInteraction: tipo === 'shiny' || tipo === 'error', silent: tipo !== 'shiny' };
      try { new Notification(titulo, opts); }
      catch { if (navigator.serviceWorker) navigator.serviceWorker.getRegistration().then(r => r && r.showNotification(titulo, opts)).catch(() => {}); }
    } catch { /* sin notificaciones */ }
  }
  // Resumen de la sesión para los avisos
  function lineasResumen() {
    const l = [`🔍 ${S.explores} exploraciones · ⚡ ${S.spent} de energía · ⏱ ${fmtTime((S.endedAt || Date.now()) - S.startedAt)}`];
    const extra = [S.hatched ? `🥚 ${S.hatched} huevo${S.hatched > 1 ? 's' : ''}` : null, S.shiny ? `✨ ${S.shiny} shiny` : null, S.legendary ? `👑 ${S.legendary} legendario${S.legendary > 1 ? 's' : ''}` : null, S.trainers ? `🎌 ${S.trainers} entrenador${S.trainers > 1 ? 'es' : ''}` : null].filter(Boolean);
    if (extra.length) l.push(extra.join(' · '));
    const en = readEnergy();
    if (en) l.push(`Te queda ⚡ ${en.normal}${en.vet ? ' · 🌿 ' + en.vet : ''}`);
    return l;
  }

  function start() {
    if (S.running) return;
    pedirPermisoNotif();
    if (!onMap()) { notify('Abre la vista del mapa para iniciar la macro.'); return; }
    if (getMode() === 'pair' && !getPartner()) {
      const p2 = document.querySelector('#' + CONFIG.UI_ID + ' .adx-in-p2');
      if (p2) { p2.classList.add('adx-err'); p2.focus(); }
      setMsg('Escribe el Pokémon 2 de la crianza (o elige «Sin usar» / «Misterioso»).');
      return;
    }
    const lim0 = getEnergyLimit(), en0 = readEnergy();
    if (lim0 && en0 && en0.normal + en0.vet < lim0) log(`Aviso: pides ${lim0} de energía y ahora tienes ${en0.normal + en0.vet}; parará antes si se acaba.`);
    Object.assign(S, {
      running: true, phase: 'on', explores: 0, throws: 0, sinceNursery: 0, hatched: 0, shiny: 0, legendary: 0, noBallsSince: 0,
      nurseryIn: CONFIG.NURSERY_FALLBACK_EXPLORES, nurseryDue: true, encThrows: 0, encKey: '', noEffect: 0, lastProgress: Date.now(), disabledSince: 0,
      modalSince: 0, noBallUsableSince: 0, spent: 0, lastActionAt: 0,
      startedAt: Date.now(), endedAt: 0, eggMax: 0, last: null,
    });
    const run = ++S.run;
    const mode = getMode();
    const lim = getEnergyLimit();
    const nurseryTxt = mode === 'mystery' ? 'Guardería: Huevo Misterioso'
      : mode === 'pair' ? `Guardería: ${getParent1()} + ${getPartner()}`
      : 'sin Guardería';
    setMsg(`Macro en marcha · ${lim === null ? 'sin límite de energía' : lim === 0 ? 'sin gastar energía (solo exploraciones gratis)' : 'hasta ' + lim + ' de energía'} · ${nurseryTxt}.`);
    log('Iniciada.');
    loop(run);
  }

  function stop(reason, opts = {}) {
    const alert = !!opts.alert;
    if (!S.running) return;
    S.running = false;
    S.run++;
    S.phase = 'off';
    S.endedAt = Date.now();
    const resumen = `${S.explores} exploraciones · ${S.spent} de energía · ${S.hatched} huevos · ${fmtTime(S.endedAt - S.startedAt)}`;
    setMsg(`${reason || 'Macro detenida.'} — ${resumen}`);
    log('Detenida:', reason || '(manual)');
    if (alert && !opts.sinAviso) {
      const r = String(reason || 'Exploración terminada');
      const tipo = /l[ií]mite|hecho|energ/i.test(r) ? (/sin energ|no te queda|se acab/i.test(r) ? 'aviso' : 'fin') : 'error';
      const titulo = /l[ií]mite de energ/i.test(r) ? 'Límite de energía alcanzado' : /^hecho/i.test(r) ? 'Exploraciones gratis hechas' : /energ/i.test(r) ? 'Sin energía' : 'La macro se ha parado';
      avisar({ tipo, titulo, lineas: [...(tipo === 'error' || titulo === 'Sin energía' ? [r] : []), ...lineasResumen()] });
    }
  }

  const toggle = () => (S.running ? stop('Detenida manualmente.') : start());

  /* ════════════════════════════════════════════════════════════════
   *  BUCLE PRINCIPAL
   * ════════════════════════════════════════════════════════════════ */
  async function loop(run) {
    try {
      while (alive(run)) {
        const acted = await step(run);
        if (!acted) await idleWait(run);
      }
    } catch (e) {
      if (e instanceof Abort) return;
      if (e instanceof Fail) {
        if (e.detail) console.warn('[ADX] Detalle:', e.detail);
        stop(e.message, { alert: true });
        return;
      }
      console.error('[ADX]', e);
      stop('Error interno: ' + (e && e.message), { alert: true });
    }
  }

  // Botones de diálogo que la macro sabe aceptar en el mapa
  // «Volver al mapa» solo se acepta si está dentro de una ventana del juego (no confundir con botones del propio mapa)
  const volverBtn = () => {
    const b = findByText(RE.volver);
    return b && b.closest('div.fixed.inset-0') ? b : undefined;
  };
  const dialogBtn = () =>
    findByText(RE.saltar) || findByText(RE.seguir) || findByText(RE.continuar) || findByText(RE.adelante) || volverBtn();

  // Ventana con UN solo botón principal (todas las de confirmación del juego lo son: Continuar, ¡ADELANTE!, Volver al mapa…)
  // que no está en mi lista: se acepta en vez de quedarse esperando. Nunca si el texto suena a acción destructiva.
  function genericPrimary() {
    for (const ov of overlays()) {
      if ($('button.touch-none', ov)) continue;                          // es un encuentro con bolas
      const prim = $$('button.boton-principal', ov).filter(b => isVisible(b) && !isDisabled(b));
      if (prim.length !== 1) continue;
      if (CONFIG.GENERIC_BLOCK_RE.test(norm(prim[0].textContent))) continue;
      return prim[0];
    }
    return null;
  }

  // Ventanas del juego abiertas: overlays «fixed inset-0» que reciben clics y tienen contenido
  // (aunque de momento no tengan botones, p. ej. durante la animación de un combate)
  let ovCache = { v: -1, t: 0, list: [] };
  const overlays = () => {
    const now = performance.now();
    if (ovCache.v === DOMV && now - ovCache.t < 250) return ovCache.list;
    const list = $$('div.fixed.inset-0').filter(e =>
      !ours(e) && isVisible(e) && getComputedStyle(e).pointerEvents !== 'none' &&
      (!!e.querySelector('button, img') || (e.textContent || '').trim().length > 0)
    );
    ovCache = { v: DOMV, t: now, list };
    return list;
  };

  // Texto identificativo de la ventana abierta (para el log)
  function modalTitle() {
    const ov = overlays()[0];
    if (!ov) return '';
    const t = $('h3', ov) || $('h2', ov) || $('p', ov);
    return t ? t.textContent.trim().replace(/\s+/g, ' ') : '';
  }

  // ¿Hay una ventana modal del juego abierta? (overlay «fixed inset-0» con botones dentro)
  const modalOpen = () => overlays().length > 0;

  // Ventana con botones que NO es un encuentro (sin bolas): candidata a «ventana desconocida»
  const unknownModalOpen = () =>
    overlays().some(o => o.querySelector('button') && !o.querySelector('button.touch-none'));

  // Animaciones/transiciones CSS finitas en curso (se ignoran las infinitas, p. ej. el sprite que flota)
  function runningAnimations() {
    try {
      return document.getAnimations().filter(a => {
        if (a.playState !== 'running') return false;
        const t = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming() : null;
        if (!t || t.iterations === Infinity || t.endTime === Infinity) return false;
        const tg = a.effect.target;
        return !(tg && tg.closest && tg.closest('#' + CONFIG.UI_ID + ', #adx-stop-pill'));
      }).length;
    } catch { return 0; }
  }
  // Espera a que terminen las animaciones del juego (con tope), sin añadir tiempo si no hay ninguna
  const waitAnimations = (run, max = CONFIG.ANIM_MAX_MS) =>
    waitFor(run, () => runningAnimations() === 0, max, 50);

  // Tras ¡EXPLORAR!: espera a que salga el resultado (encuentro / diálogo) para atenderlo antes que nada
  async function waitOutcome(run) {
    const seen = await waitFor(
      run,
      () => modalOpen() || getBalls().length || dialogBtn(),
      CONFIG.OUTCOME_MS, 50
    );
    if (!seen) log(`Sin encuentro ni diálogo tras explorar (${CONFIG.OUTCOME_MS / 1000}s).`);
  }

  async function clickWithPause(run, el, label) {
    await waitAnimations(run);
    await pause(run, ...CONFIG.ACTION_DELAY);
    if (!el.isConnected || isDisabled(el)) return false;
    el.click();
    S.lastProgress = S.lastActionAt = Date.now();
    log('Click:', label);
    return true;
  }

  function exploreCost(btn) {
    const m = /(⚡|🌿)\uFE0F?\s*[−–-]\s*(\d+)/.exec(btn.textContent || '');
    return m ? { sym: m[1], n: +m[2] } : null;
  }

  // Energía disponible frente al coste de ¡EXPLORAR! («⚡ −1» normal o «🌿 −1» veterana)
  function energyState(ex) {
    const en = readEnergy();
    const cost = exploreCost(ex);
    const have = en && cost ? (cost.sym === '⚡' ? en.normal : en.vet) : null;
    const noEnergy = cost
      ? have !== null && have < cost.n
      : !!en && en.normal === 0 && en.vet === 0;
    return { en, cost, have, noEnergy };
  }
  const noEnergyMsg = es => es.cost
    ? `Sin energía: ¡EXPLORAR! cuesta ${es.cost.sym} ${es.cost.n} y tienes ${es.cost.sym} ${es.have}.`
    : `Sin energía (⚡ ${es.en.normal} · 🌿 ${es.en.vet}).`;

  // ¡EXPLORAR! deshabilitado: decide si hay que parar (sin energía / bloqueado sin motivo) o seguir esperando
  function exploreBlocked(ex) {
    const es = energyState(ex);
    if (!S.disabledSince) S.disabledSince = Date.now();
    const waited = Date.now() - S.disabledSince;

    // Se espera unos segundos por si el último clic aún trae un encuentro que capturar
    if (es.noEnergy && waited >= CONFIG.ENERGY_SETTLE_MS) throw new Fail(noEnergyMsg(es));
    if (!es.noEnergy && waited > CONFIG.DISABLED_MS) {
      throw new Fail(
        '¡EXPLORAR! sigue bloqueado y no sé por qué. Detalles en la consola.',
        `energía: ${es.en ? `⚡ ${es.en.normal} · 🌿 ${es.en.vet}` : 'no legible'}; botón: «${(ex.textContent || '').trim()}»; botones visibles: ${visibleLabels()}`
      );
    }
    return false;
  }

  // Devuelve true si hizo algo, false si no había nada que hacer en este ciclo
  async function step(run) {
    if (!onMap()) throw new Fail('Saliste de la vista del mapa: macro detenida.');

    // 1) Diálogos: «Saltar al resultado» (combate), «Seguir a lo mío» (trampas/desvíos),
    //    «Continuar» (tras combate/captura) y «¡ADELANTE!» (entrenadores)
    const dlg = dialogBtn();
    if (dlg) {
      const dlgLbl = labelOf(dlg);
      S.disabledSince = 0;
      S.modalSince = 0;
      if (RE.adelante.test(dlgLbl)) {
        const who = modalTitle() || 'Entrenador';
        S.trainers++;
        // la exploración que trae un entrenador no cuenta para el huevo: se descuenta (una vez por exploración)
        if (S.exploreEgg) { S.exploreEgg = false; S.sinceNursery = Math.max(0, S.sinceNursery - 1); }
        log('Entrenador:', who, '→ acepto el desafío', nurseryOn() ? '(esta exploración no cuenta para el huevo)' : '');
        setMsg(`Entrenador: ${who}`);
      } else if (RE.saltar.test(dlgLbl)) {
        log('Combate: salto al resultado.');
      }
      await clickWithPause(run, dlg, (dlg.textContent || '').trim());
      S.encKey = '';
      // esperar a que el diálogo se cierre y termine su animación antes de seguir
      await waitFor(run, () => !dialogBtn(), 3000, 50);
      await waitAnimations(run);
      return true;
    }

    // 2) Encuentro con bolas visibles
    const balls = getBalls();
    if (balls.length) {
      S.disabledSince = 0;
      S.noBallsSince = 0;
      return await handleEncounter(run, balls);
    }
    S.encThrows = 0;
    S.noEffect = 0;
    S.noBallUsableSince = 0;
    if (!S.noBallsSince) S.noBallsSince = Date.now();
    if (Date.now() - S.noBallsSince > 2000) S.encKey = '';   // encuentro terminado

    // 3) Ventana con un único botón principal que no está en mi lista: aceptarla sin esperar
    const gen = genericPrimary();
    if (gen) {
      S.disabledSince = 0;
      S.modalSince = 0;
      log('Ventana no listada, acepto su único botón principal:', `«${(gen.textContent || '').trim()}»`, '←', `«${modalTitle()}»`);
      await clickWithPause(run, gen, (gen.textContent || '').trim());
      S.encKey = '';
      await waitFor(run, () => !gen.isConnected || !isVisible(gen), 3000, 50);
      return true;
    }

    // 4) Ventana sin botones (animación de captura «. .. ...», combate…) o con botones que no sé pulsar:
    //    esperar sin tocar nada detrás, reaccionando en cuanto cambie
    if (modalOpen()) return modalWait();
    S.modalSince = 0;

    const ex = findExplore();

    // 5) Guardería: solo con la última exploración RESUELTA. Antes bastaban 0,8 s desde el clic en ¡EXPLORAR!,
    //    y si el encuentro tardaba en salir la macro se iba con él a medias (y esa exploración no contaba
    //    para el huevo). Ahora: ¡EXPLORAR! visible y habilitado, sin animaciones y 2,5 s sin ninguna acción.
    if (nurseryOn() && (S.nurseryDue || S.sinceNursery >= S.nurseryIn)) {
      const idle = ex && !isDisabled(ex) && runningAnimations() === 0 &&
        Date.now() - Math.max(S.lastExploreAt, S.lastActionAt) >= CONFIG.NURSERY_GRACE_MS;
      if (!idle) return false;
      await nurseryRoutine(run);
      return true;
    }

    // 6) Explorar
    if (!ex) return stuckCheck();

    if (isDisabled(ex)) return exploreBlocked(ex);
    S.disabledSince = 0;

    await waitAnimations(run);
    await pause(run, ...CONFIG.EXPLORE_DELAY);
    if (Math.random() < CONFIG.LONG_PAUSE_CHANCE) await pause(run, ...CONFIG.LONG_PAUSE);

    const ex2 = findExplore();
    if (!ex2 || isDisabled(ex2) || modalOpen()) return true;

    // Límite de energía: se comprueba ANTES de explorar, así el último encuentro ya está resuelto
    const lim = getEnergyLimit();
    const cost = exploreCost(ex2);           // null en ¡MANADA! (gratis)
    const n = cost ? cost.n : 0;
    if (lim !== null && n > 0 && S.spent + n > lim) {
      stop(lim === 0 ? `Hecho: ${S.explores} exploraciones gratis, sin gastar energía.` : `Límite de energía alcanzado: gastadas ${S.spent} de ${lim}.`, { alert: true });
      return true;
    }
    ex2.click();
    S.spent += n;
    S.explores++;
    S.sinceNursery++;
    S.exploreEgg = true;
    S.lastExploreAt = S.lastActionAt = Date.now();
    S.lastProgress = Date.now();
    setMsg('Explorando…');
    await waitOutcome(run);           // atender el resultado (captura) antes de cualquier otra cosa
    return true;
  }

  function modalWait() {
    const hasButtons = overlays().some(o => o.querySelector('button'));
    if (!S.modalSince) {
      S.modalSince = Date.now();
      // Solo se registra si tiene botones desconocidos; las pantallas sin botones son animaciones normales
      if (hasButtons) log('Ventana del juego no reconocida:', modalTitle() || '(sin título)', '| botones:', visibleLabels());
    }
    const limit = hasButtons ? CONFIG.MODAL_UNKNOWN_MS : CONFIG.MODAL_TRANSITION_MS;
    if (Date.now() - S.modalSince > limit) {
      throw new Fail(
        hasButtons
          ? `Ventana del juego no reconocida: «${modalTitle() || 'sin título'}». Detalles en la consola.`
          : `La pantalla del juego no cambia desde hace ${Math.round(limit / 1000)} s: «${modalTitle() || 'sin título'}».`,
        `botones visibles: ${visibleLabels()}`
      );
    }
    return false;
  }

  function stuckCheck() {
    if (Date.now() - S.lastProgress > CONFIG.STUCK_MS) {
      throw new Fail(
        `No reconozco la pantalla actual (${CONFIG.STUCK_MS / 1000}s sin poder actuar). Detalles en la consola.`,
        `botones visibles: ${visibleLabels() || 'ninguno'}`
      );
    }
    return false;
  }

  /* ════════════════════════════════════════════════════════════════
   *  CAPTURA
   * ════════════════════════════════════════════════════════════════ */
  // Qué bola usar, por orden de preferencia (se coge la primera disponible):
  //   shiny / legendario           → Master, y si no hay: Ultra → Super → Poké
  //   sin registrar, prob. >= 70%  → Super, y si no hay: Poké
  //   sin registrar, prob. <  70%  → Ultra, y si no hay: Poké
  //   resto                        → Poké
  function ballPlan(info) {
    const master = CONFIG.USE_MASTER_BALL ? ['master'] : [];
    if (info.masterReason) return { prefs: [...master, 'ultra', 'super', 'poke'], why: info.masterReason };
    if (info.unregistered) {
      const sup = info.pct !== null && info.pct >= CONFIG.SUPER_MIN_PCT;
      return { prefs: [sup ? 'super' : 'ultra', 'poke'], why: `sin registrar (${info.pct !== null ? info.pct + '%' : 'prob. desconocida'})` };
    }
    return { prefs: ['poke'], why: null };
  }

  // Contadores y log del encuentro (una sola vez por encuentro).
  function announceEncounter(info, plan, pick, wantKind) {
    const key = `${info.name}|${info.level}|${info.pills.join(',')}`;
    if (key === S.encKey) return;
    S.encKey = key;
    if (info.shiny) S.shiny++;
    if (info.legendary) S.legendary++;
    if (info.rarity && !S.seenRarities[info.rarity]) log('Etiqueta de rareza nueva:', info.rarity);
    if (info.rarity) S.seenRarities[info.rarity] = (S.seenRarities[info.rarity] || 0) + 1;

    const kindTxt = BALL_NAME[pick.kind];
    const who = `${info.name || 'Pokémon'}${info.level ? ' Nv.' + info.level : ''}`;
    const rare = info.shiny || info.legendary;
    S.last = {
      who,
      det: [info.rarity, info.unregistered ? '⭐ sin registrar' : null, info.pct !== null ? info.pct + '%' : null, kindTxt].filter(Boolean).join(' · '),
      sprite: info.sprite,
      ball: pick.kind,
    };

    const det = `${info.rarity || '?'} · ✨${info.shiny ? 'SÍ' : 'no'} · 👑${info.legendary ? 'SÍ' : 'no'} · ${info.unregistered ? '⭐SIN REGISTRAR' : 'registrado'}${info.pct !== null ? ' · ' + info.pct + '%' : ''}`;
    const fallback = pick.kind !== wantKind ? ` — no hay ${BALL_NAME[wantKind]}, uso ${kindTxt}` : '';
    const why = plan.why ? ` (motivo: ${plan.why}${fallback})` : '';
    log('Encuentro:', who, '|', det, '→', kindTxt, why, '· pastillas:', info.pills);
    setMsg(`${who} · ${det} → ${kindTxt}`);

    if (rare) {
      const txt = `${info.shiny ? '¡SHINY!' : ''}${info.shiny && info.legendary ? ' ' : ''}${info.legendary ? '¡LEGENDARIO!' : ''} ${who} → ${kindTxt}`;
      notify(txt);
    }
  }

  // Shiny o legendario: NO se lanza ninguna bola. Se avisa (vibración, mensaje breve y notificación)
  // y se detiene la macro por completo para que captures a mano.
  function handleRareEncounter(info) {
    if (info.shiny) S.shiny++;
    if (info.legendary) S.legendary++;
    const who = `${info.name || 'Pokémon'}${info.level ? ' Nv.' + info.level : ''}`;
    const tag = `${info.shiny ? '¡SHINY! ' : ''}${info.legendary ? '¡LEGENDARIO! ' : ''}`;
    const txt = `${tag}${who} — ¡captúralo tú! Macro detenida.`;
    log('★', txt);
    stop(txt, { alert: true, sinAviso: true });
    avisar({
      tipo: 'shiny',
      titulo: `${info.shiny ? '✨ ¡Shiny' : '👑 ¡Legendario'}: ${info.name || 'Pokémon'}!`,
      sprite: info.sprite,
      lineas: [`${who}${info.rarity ? ' · ' + info.rarity : ''}${info.unregistered ? ' · ⭐ sin registrar' : ''}${info.pct !== null ? ' · ' + info.pct + '% de captura' : ''}`, 'Macro parada: captúralo tú.', ...lineasResumen()],
    });
    return true;
  }

  async function handleEncounter(run, balls) {
    const scope = encounterScope(balls[0].el);
    if (!scope) {
      // Botones de Ball en una ventana que no parece un encuentro (sin nombre ni sprite): no se toca
      if (!S.noBallUsableSince) { S.noBallUsableSince = Date.now(); log('Ventana con Balls pero sin encuentro reconocible; espero.'); }
      if (Date.now() - S.noBallUsableSince > CONFIG.NO_BALL_MS) {
        throw new Fail('Hay botones de Ball en una ventana que no parece un encuentro. Revísalo a mano.', `botones visibles: ${visibleLabels()}`);
      }
      return false;
    }
    const info = readEncounter(scope);
    // Un encuentro de verdad enseña la «Probabilidad de captura» o varias Balls distintas
    const kinds = new Set(balls.map(b => b.kind));
    if (!info.hasCatchPct && kinds.size < 2) {
      if (!S.noBallUsableSince) { S.noBallUsableSince = Date.now(); log('Ventana con una Ball pero sin datos de captura; no la trato como encuentro.', info.name); }
      if (Date.now() - S.noBallUsableSince > CONFIG.NO_BALL_MS) {
        throw new Fail(`Ventana con Ball que no parece un encuentro («${modalTitle() || info.name || 'sin título'}»). Revísala a mano.`, `botones visibles: ${visibleLabels()}`);
      }
      return false;
    }
    if (info.shiny || info.legendary) {
      // Confirmación: se vuelve a leer tras un instante y ambas lecturas deben coincidir
      await pause(run, 350, 500);
      const b2 = getBalls();
      const scope2 = b2.length ? encounterScope(b2[0].el) : null;
      const again = scope2 && readEncounter(scope2);
      if (again && again.name === info.name && (again.shiny || again.legendary)) return handleRareEncounter(again);
      log('Aviso de shiny/legendario descartado (no se confirmó en la segunda lectura):', info.name, info.masterReason, info.pills);
      return true;
    }
    const plan = ballPlan(info);
    const wantKind = plan.prefs[0];
    const pick = plan.prefs.map(k => balls.find(b => b.kind === k && !b.disabled)).find(Boolean);

    if (!pick) {
      // Las bolas suelen quedar deshabilitadas mientras el juego procesa el lanzamiento: esperar, no abortar
      if (!S.noBallUsableSince) S.noBallUsableSince = Date.now();
      if (Date.now() - S.noBallUsableSince > CONFIG.NO_BALL_MS) {
        throw new Fail(`No hay ninguna bola utilizable para este encuentro (quería ${BALL_NAME[wantKind]}).`);
      }
      return false;
    }
    S.noBallUsableSince = 0;

    const kindTxt = BALL_NAME[pick.kind];
    announceEncounter(info, plan, pick, wantKind);

    if (Date.now() - S.lastThrowAt < CONFIG.MIN_RETHROW_MS) return false;   // no repetir lanzamiento demasiado pronto

    // Dejar que termine la animación de entrada del encuentro / del lanzamiento anterior
    await waitAnimations(run);
    await pause(run, ...CONFIG.ACTION_DELAY);
    if (!pick.el.isConnected || isDisabled(pick.el)) return true;

    if (++S.encThrows > CONFIG.MAX_THROWS_PER_ENCOUNTER) {
      throw new Fail(`${CONFIG.MAX_THROWS_PER_ENCOUNTER} lanzamientos seguidos sin que cambie la pantalla. Revisa el encuentro a mano.`);
    }

    // Lanzar (un clic en la bola) y comprobar que la pantalla reacciona
    let touched = false;
    const mo = new MutationObserver(() => { touched = true; });
    mo.observe(scope, { childList: true, subtree: true, attributes: true, characterData: true });
    try {
      pick.el.click();
      S.throws++;
      S.lastThrowAt = Date.now();
      S.lastProgress = Date.now();
      log(`Lanzo ${kindTxt}`);
      const changed = await waitFor(
        run,
        () => touched || !pick.el.isConnected || isDisabled(pick.el) || dialogBtn(),
        CONFIG.THROW_CHECK_MS, 50
      );
      if (changed) {
        S.noEffect = 0;
        await waitAnimations(run);   // dejar que se vea el lanzamiento completo antes del siguiente paso
        return true;
      }
    } finally {
      mo.disconnect();
    }

    S.noEffect = (S.noEffect || 0) + 1;
    if (S.noEffect >= 2) {
      throw new Fail('Pulsé la bola dos veces y la pantalla no reaccionó. Revisa el encuentro a mano.');
    }
    log('El clic en la bola no produjo cambios; reintento una vez.');
    return true;
  }

  /* ════════════════════════════════════════════════════════════════
   *  GUARDERÍA
   * ════════════════════════════════════════════════════════════════ */
  // Navegación de cliente (sin recargar: la macro conserva su estado). Salto directo con el router de Next si está
  // expuesto (window.next.router); si no, pulsando el enlace real (a /guarderia solo se llega desde /menu).
  async function navigate(run, path) {
    if (location.pathname === path) return;
    const router = window.next && window.next.router;
    if (router && typeof router.push === 'function') {
      try {
        router.push(path);
        if (await waitFor(run, () => location.pathname === path, 4000, 30)) {
          await pause(run, 80, 160);
          return;
        }
      } catch (e) { if (e instanceof Abort) throw e; /* se cae al método de enlaces */ }
    }
    if (path === '/guarderia' && location.pathname !== '/menu') await navigate(run, '/menu');
    const link = await waitFor(run, () => $(`a[href="${path}"]`), 8000, 30);
    if (!link) throw new Fail(`No encuentro el enlace a ${path}.`);
    link.click();
    const ok = await waitFor(run, () => location.pathname === path, 10000, 30);
    if (!ok) throw new Fail(`No se pudo abrir ${path}.`);
    await pause(run, 80, 160);
  }

  async function pickPokemon(run, name) {
    const input = await waitFor(run, findSearch, 8000);
    if (!input) throw new Fail('No encuentro el buscador de la Guardería.');

    setInputValue(input, '');
    await pause(run, 100, 200);
    setInputValue(input, name);
    await pause(run, 450, 750);                      // debounce del filtro de la caja

    const card = await waitFor(run, () => findCard(name), 5000, 50);
    if (!card) {
      const present = listCards().some(c => c.key === norm(name));
      throw new Fail(
        present
          ? `«${name}» aparece en la caja pero está deshabilitado (no puede criar).`
          : `No encontré a «${name}» en la caja de la Guardería.`
      );
    }
    await pause(run, 120, 300);
    card.btn.click();
    log('Guardería: seleccionado', card.name, card.shiny ? '(shiny)' : '');

    // La tarjeta elegida cambia a border-hoja-500 / bg-hoja-50
    const selected = await waitFor(run, () => card.btn.isConnected ? isSelectedCard(card) : listCards().some(c => c.key === card.key && isSelectedCard(c)), 2500);
    if (!selected) throw new Fail(`No pude seleccionar a «${name}»: la tarjeta no cambió de estado tras pulsarla.`);
    await pause(run, 150, 350);
  }

  async function confirmPair(run) {
    const hasEgg = () => { const e = readEggs(); return e && !e.empty; };

    const btn = await waitFor(run, () => {
      const b = findByText(CONFIG.CONFIRM_RE);
      return b && !isDisabled(b) ? b : null;
    }, 5000);
    if (!btn) {
      throw new Fail(
        'No aparece el botón «Dejarlos juntos» habilitado. Detalles en la consola.',
        `botones visibles: ${visibleLabels()}`
      );
    }
    await pause(run, 250, 600);
    btn.click();
    log('Guardería: pulso «Dejarlos juntos».');

    if (!(await waitFor(run, hasEgg, 6000))) {
      throw new Fail(
        'Pulsé «Dejarlos juntos» pero el contador de huevos no cambió. Detalles en la consola.',
        `botones visibles: ${visibleLabels()}`
      );
    }
  }

  // «Incubar Huevo Misterioso (34)»: se pulsa y se espera a que el contador de huevos suba.
  // Si el juego pide confirmación con un único botón principal no destructivo, se acepta.
  async function incubateMystery(run) {
    const before = (readEggs() || {}).cur ?? 0;
    const btn = await waitFor(run, () => findByText(CONFIG.MYSTERY_RE), 5000);
    if (!btn) throw new Fail('No encuentro el botón «Incubar Huevo Misterioso» en la Guardería.', `botones visibles: ${visibleLabels()}`);
    const left = /\((\d+)\)/.exec(btn.textContent || '');
    if (left) lsSet(MYSTERY_LEFT_KEY, left[1]);
    if ((left && +left[1] === 0) || isDisabled(btn)) throw new Fail('No te quedan Huevos Misteriosos (o el botón está bloqueado).');
    await waitAnimations(run, 2000);
    await pause(run, 250, 600);
    btn.click();
    log('Guardería: incubo un Huevo Misterioso', left ? `(quedaban ${left[1]})` : '');
    if (left) lsSet(MYSTERY_LEFT_KEY, String(Math.max(0, +left[1] - 1)));

    const done = () => { const e = readEggs(); return e && e.cur > before; };
    for (let i = 0; i < 3 && !(await waitFor(run, done, 2000)); i++) {
      const gen = genericPrimary();
      if (gen) { await pause(run, 200, 450); gen.click(); log('Guardería: confirmo', `«${(gen.textContent || '').trim()}»`); }
    }
    if (!done()) throw new Fail('Pulsé «Incubar Huevo Misterioso» pero el contador de huevos no subió.', `botones visibles: ${visibleLabels()}`);
    setMsg('Huevo Misterioso en incubación.');
  }

  // Diálogo de eclosión: «¡El huevo se ha abierto!» + nombre del Pokémon + botón «¡Bienvenido!»
  function readHatch() {
    const p = $$('p').find(e => norm(e.textContent).includes('el huevo se ha abierto'));
    const card = p && p.closest('.tarjeta');
    const h3 = card && $('h3', card);
    return h3 ? h3.textContent.replace(/✨/g, '').trim() : null;
  }
  // ¿El que acaba de nacer es shiny? (sprite de /shiny/ o el diálogo lo dice)
  function hatchInfo() {
    const p = $$('p').find(e => norm(e.textContent).includes('el huevo se ha abierto'));
    const card = p && (p.closest('.tarjeta') || p.parentElement);
    if (!card) return null;
    const img = $$('img', card).find(i => /\/sprites\//.test(i.getAttribute('src') || ''));
    const src = img ? img.getAttribute('src') : null;
    const shiny = /\/shiny\//i.test(src || '') || /variocolor|shiny|✨/i.test(card.textContent || '');
    return { name: readHatch(), sprite: src, shiny };
  }

  const hatchDialogBtn = () => {
    const b = findByText(RE.bienvenido) || findByText(RE.continuar);
    return b && !isDisabled(b) ? b : null;
  };

  // Pulsa «Abrir». El contador baja al instante pero el diálogo «¡Bienvenido!» tarda en salir:
  // se espera al diálogo (no al contador) y se acepta enseguida.
  async function openEgg(run, item) {
    const before = (readEggs() || {}).cur ?? 1;
    await waitAnimations(run, 2000);
    await pause(run, 250, 600);
    item.btn.click();
    log('Guardería: abro el huevo.');

    let name = null, clicks = 0, nacido = null;
    let b = await waitFor(run, hatchDialogBtn, 15000, 60);
    while (b) {
      name = readHatch() || name;
      const hi = hatchInfo();
      if (hi && (hi.shiny || !nacido)) nacido = hi;
      await waitAnimations(run);                       // dejar que se vea la animación de la eclosión
      await pause(run, 200, 450);
      if (b.isConnected) { b.click(); clicks++; log('Click:', (b.textContent || '').trim(), name ? `(nació: ${name})` : ''); }
      await waitFor(run, () => !hatchDialogBtn(), 5000, 60);
      b = await waitFor(run, hatchDialogBtn, 1200, 60);   // por si encadena otro diálogo
    }
    if (!clicks) log('Aviso: no apareció el diálogo de eclosión en 15 s.');

    const gone = await waitFor(run, () => { const e = readEggs(); return e && e.cur < before; }, 8000);
    if (!gone) throw new Fail('Pulsé «Abrir» pero el huevo no desapareció. Detalles en la consola.', `botones visibles: ${visibleLabels()}`);
    S.hatched++;
    if (name) setMsg(`Nació: ${name}`);
    if (nacido && nacido.shiny) {
      S.shiny++;
      const txt = `✨ ¡Ha nacido un ${nacido.name || 'Pokémon'} SHINY en la Guardería! Macro detenida.`;
      log('★', txt);
      stop(txt, { alert: true, sinAviso: true });
      avisar({ tipo: 'shiny', titulo: `✨ ¡Nació shiny: ${nacido.name || 'Pokémon'}!`, sprite: nacido.sprite, lineas: ['Ha salido de un huevo de la Guardería. He parado la macro.', ...lineasResumen()] });
      throw new Abort();
    }
  }

  // Cierra cualquier diálogo pendiente antes de tocar la caja
  async function dismissDialogs(run) {
    let b = hatchDialogBtn();
    for (let n = 0; b && n < 5; n++) {
      await pause(run, 200, 500);
      if (b.isConnected) { b.click(); log('Click:', (b.textContent || '').trim(), '(diálogo pendiente)'); }
      await waitFor(run, () => !hatchDialogBtn(), 4000, 60);
      b = await waitFor(run, hatchDialogBtn, 800, 60);
    }
  }

  async function nurseryRoutine(run) {
    S.phase = 'nursery';
    setMsg('Comprobando la Guardería…');
    try {
      await navigate(run, '/guarderia');

      let eggs = await waitFor(run, readEggs, 10000);
      if (!eggs) throw new Fail('No pude leer el contador «Huevos (x/y)» en la Guardería.');

      const arrival = readEggItems();
      if (!S.nurseryDue && arrival.length && !arrival.some(x => x.ready)) {
        log(`Guardería: llegué antes de tiempo (conté ${S.sinceNursery} exploraciones; huevos: ${arrival.map(x => x.cur + '/' + x.max).join(', ')}). Recalculo.`);
      }

      // 1) Abrir los huevos que ya están completos (5/5)
      for (const it of readEggItems().filter(x => x.ready)) {
        setMsg(`Huevo completo (${it.cur}/${it.max}): abriéndolo…`);
        await openEgg(run, it);
      }
      eggs = await waitFor(run, readEggs, 5000) || eggs;

      // 2) Si no queda ningún huevo: crianza (Pokémon 1 + Pokémon 2) o Huevo Misterioso
      await dismissDialogs(run);
      if (eggs.empty) {
        if (getMode() === 'mystery') {
          setMsg('Guardería vacía: incubando un Huevo Misterioso…');
          await incubateMystery(run);
        } else {
          const p1 = getParent1(), p2 = getPartner();
          if (!p2) throw new Fail('Falta el Pokémon 2 de la crianza: escríbelo en la tarjeta de la macro.');
          setMsg(`Guardería vacía: asignando ${p1} + ${p2}…`);
          await pickPokemon(run, p1);
          await pickPokemon(run, p2);
          await confirmPair(run);
          log(`Guardería: pareja asignada (${p1} + ${p2}).`);
        }
      }

      // 3) Programar la próxima visita: cuando falten 0 exploraciones para el huevo
      const items = await waitFor(run, () => { const l = readEggItems(); return l.length ? l : null; }, 4000);
      const stuck = items && items.find(x => x.cur >= x.max && !x.ready);
      if (stuck) throw new Fail(`Huevo completo (${stuck.cur}/${stuck.max}) pero «Abrir» sigue deshabilitado.`);
      // con la Piedra Cálida cada exploración suma 2: faltan la mitad (redondeando hacia arriba)
      const remaining = items
        ? Math.min(...items.map(x => Math.max(1, Math.ceil((x.max - x.cur) / pasoHuevo()))))
        : CONFIG.NURSERY_FALLBACK_EXPLORES;

      S.nurseryIn = remaining;
      const watched = items && items.reduce((a, x) => (!a || x.max - x.cur < a.max - a.cur ? x : a), null);
      S.eggMax = watched ? watched.max : 0;
      log(`Guardería: próxima revisión en ${remaining} exploraciones${eggX2() ? ' (Piedra Cálida: ×2)' : ''}.`, items ? items.map(x => `${x.cur}/${x.max}`) : '(sin huevo legible)');
    } catch (e) {
      if (e instanceof Fail) await navigate(run, '/mapa').catch(() => {});  // intentar dejarte en el mapa con el aviso visible
      throw e;
    }

    await navigate(run, '/mapa');
    await waitFor(run, findExplore, 10000);
    S.nurseryDue = false;
    S.sinceNursery = 0;
    S.phase = 'on';
    S.lastProgress = Date.now();
    setMsg('Guardería revisada. Continuando…');
  }

  /* ════════════════════════════════════════════════════════════════
   *  ARRANQUE
   * ════════════════════════════════════════════════════════════════ */
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  waitHydration();
  syncUI();
  log('Script cargado.');
})();