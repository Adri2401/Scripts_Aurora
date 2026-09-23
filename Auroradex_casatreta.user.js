// ==UserScript==
// @name         Aurora Dex · Casa Treta Auto-Solver
// @namespace    auroradex-casatreta-autosolver
// @version      1.0.0
// @updateURL    https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_casatreta.user.js
// @downloadURL  https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_casatreta.user.js
// @description  Resuelve «La Casa Treta»: izquierda/derecha por búsqueda binaria y frío/caliente con la estrategia óptima. Panel con el estado de las 8 plantas.
// @match        https://auroradex.es/*
// @match        https://www.auroradex.es/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
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

  /* ── Kit visual común (mismo aspecto en todos los scripts de Aurora Dex) ──── */
  const KIT_CSS = (U) => `
    ${U} [hidden]{display:none!important}
    ${U} .k-ico{width:40px;height:40px;display:grid;place-items:center;font-size:20px;flex-shrink:0}
    ${U} .k-dot{width:8px;height:8px;border-radius:999px;background:currentColor;display:inline-block;flex-shrink:0}
    ${U} .k-badge{display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
    ${U} .k-badge[data-s="on"] .k-dot{animation:k-pulso 1.2s ease-in-out infinite}
    @keyframes k-pulso{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(.7)}}
    @media (prefers-reduced-motion:reduce){${U} .k-dot{animation:none!important}}
    ${U} .k-tiles{display:grid;grid-template-columns:repeat(var(--k-cols,4),minmax(0,1fr));gap:6px}
    ${U} .k-tile{text-align:center;padding:6px 2px;min-width:0}
    ${U} .k-tile b{display:block;font-size:15px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    ${U} .k-tile small{display:block;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;opacity:.75}
    ${U} .k-bar{height:10px}
    ${U} .k-bar>span{display:block;height:100%;border-radius:999px;transition:width .5s}
    ${U} .k-log{max-height:150px;overflow-y:auto;font-variant-numeric:tabular-nums}
    ${U} .k-log>p{margin:0;padding:1px 0}
    ${U} .k-log:empty{display:none}
    ${U} .k-chips{display:flex;flex-wrap:wrap;gap:6px}
    ${U} .k-chips>button{flex:1;padding:4px 6px;font-size:11px;font-weight:800;white-space:nowrap}
    ${U} .k-chips>button[aria-pressed="true"]{box-shadow:inset 0 0 0 2px currentColor}
    ${U} .k-seg{display:grid;grid-template-columns:repeat(var(--k-cols,2),minmax(0,1fr));gap:6px}
    ${U} .k-seg>button{padding:8px 4px;font-size:11px;font-weight:800;display:flex;flex-direction:column;align-items:center;gap:2px;line-height:1.15}
    ${U} .k-seg>button>span:first-child{font-size:18px}
    ${U} .k-switch{display:flex;align-items:center;gap:10px;cursor:pointer;user-select:none}
    ${U} .k-switch input{appearance:none;-webkit-appearance:none;width:38px;height:22px;border-radius:999px;position:relative;flex-shrink:0;cursor:pointer;margin:0;transition:background .2s;background:rgba(127,127,127,.35);color:#fff}
    ${U} .k-switch input:checked{background:#2FA84F}
    ${U} .k-switch input::after{content:"";position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:999px;background:currentColor;transition:transform .2s}
    ${U} .k-switch input:checked::after{transform:translateX(16px)}
    ${U} .k-x{width:28px;height:28px;display:grid;place-items:center;font-size:14px;flex-shrink:0;cursor:pointer}
    ${U} button:disabled{opacity:.55;cursor:not-allowed}
    ${U} input[type=number]{-moz-appearance:textfield}
    ${U} input[type=number]::-webkit-outer-spin-button,${U} input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
  `;
  const K_BADGE = {
    off: 'k-badge pastilla border-2 border-crema-200 bg-crema-50 text-tinta-500',
    on: 'k-badge pastilla border-2 border-hoja-200 bg-hoja-50 text-hoja-700',
    warn: 'k-badge pastilla border-2 border-ambar-200 bg-ambar-50 text-ambar-700',
    ok: 'k-badge pastilla border-2 border-hoja-300 bg-hoja-50 text-hoja-700',
    err: 'k-badge pastilla border-2 border-rojo-100 bg-lienzo text-rojo-600',
  };
  const K_TILE = 'k-tile rounded-card border-2 border-crema-200 bg-crema-50';
  const K_FIELD = 'w-full rounded-card border-2 border-crema-200 bg-crema-50 px-3 py-2 text-sm font-semibold text-tinta-600 outline-none';
  const K_BAR = 'k-bar w-full overflow-hidden rounded-pill border-2 border-tinta-700/10 bg-crema-200';
  const K_LOG = 'k-log rounded-card border-2 border-crema-200 bg-crema-50 p-2 text-[11px] font-semibold leading-relaxed text-tinta-600';
  const K_ON = 'rounded-card border-2 border-hoja-400 bg-hoja-50 text-hoja-700';
  const K_OFF = 'rounded-card border-2 border-crema-200 bg-crema-50 text-tinta-500';
  const kEsc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const kSet = (el, v) => { if (el && el.textContent !== v) el.textContent = v; };
  function kStyle(id, U) {
    if (document.getElementById(id)) return;
    const st = document.createElement('style');
    st.id = id; st.textContent = KIT_CSS(U);
    document.head.appendChild(st);
  }
  function kBadge(el, s, text) {
    if (!el) return;
    if (el.dataset.s !== s) { el.className = K_BADGE[s] || K_BADGE.off; el.dataset.s = s; }
    kSet(el.querySelector('.k-badge-t'), text);
  }
  const kBadgeHTML = (text = 'LISTO') => `<span class="${K_BADGE.off}" data-s="off"><span class="k-dot"></span><span class="k-badge-t">${text}</span></span>`;
  const kHead = (ico, title, sub = '') => `
      <div class="flex items-center gap-3">
        <span class="k-ico rounded-card border-2 border-crema-200 bg-crema-100">${ico}</span>
        <div class="min-w-0 flex-1">
          <p class="font-display text-base font-extrabold leading-tight">${title}</p>
          <p class="k-sub truncate text-[11px] font-bold text-tinta-400">${sub}</p>
        </div>
        ${kBadgeHTML()}
      </div>`;
  // Aviso con sonido + vibración + notificación (para momentos importantes)
  function kAviso(texto) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [880, 1320, 1760].forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.value = f; o.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.16);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.16 + 0.14);
        o.start(ctx.currentTime + i * 0.16); o.stop(ctx.currentTime + i * 0.16 + 0.15);
      });
    } catch { /* sin audio */ }
    try { if (navigator.vibrate) navigator.vibrate([300, 120, 300]); } catch { /* sin vibración */ }
    try { if ('Notification' in window && Notification.permission === 'granted') new Notification('Aurora Dex', { body: texto }); } catch { /* nada */ }
  }
  // Log en panel: líneas con hora, las más nuevas abajo, máximo `max`
  function kLog(box, texto, max = 60) {
    if (!box) return;
    const p = document.createElement('p');
    const h = new Date();
    p.textContent = `${String(h.getHours()).padStart(2, '0')}:${String(h.getMinutes()).padStart(2, '0')}:${String(h.getSeconds()).padStart(2, '0')}  ${texto}`;
    if (/✅|🎉|¡/.test(texto)) p.className = 'text-hoja-700';
    else if (/❌|⚠|error/i.test(texto)) p.className = 'text-rojo-600';
    box.appendChild(p);
    while (box.children.length > max) box.firstChild.remove();
    box.scrollTop = box.scrollHeight;
  }
  const kTime = ms => {
    const t = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
    return (h ? h + ':' : '') + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  };

  const SCRIPT_VERSION = '1.0.0';
  const CFG = {
    panelId: 'ct-embedded-panel',
    titleSelector: 'h1',
    titleText: 'la casa treta',
    anchorFinder: () =>
      Array.from(document.querySelectorAll('p.tarjeta'))
        .find((p) => /hoy quedan/i.test(p.textContent)),
    floorCardSelector: 'section.tarjeta.border-2',
    doorSelector: 'button[aria-label^="Puerta "]',
    stepDelayMs: 700,
    floors: [
      { n: 1, doors: 4,  attempts: 3, type: 'lado' },
      { n: 2, doors: 5,  attempts: 3, type: 'lado' },
      { n: 3, doors: 7,  attempts: 3, type: 'lado' },
      { n: 4, doors: 10, attempts: 4, type: 'lado' },
      { n: 5, doors: 15, attempts: 4, type: 'lado' },
      { n: 6, doors: 8,  attempts: 4, type: 'frio_caliente' },
      { n: 7, doors: 12, attempts: 5, type: 'frio_caliente' },
      { n: 8, doors: 16, attempts: 6, type: 'frio_caliente' },
    ],
  };

  const state = { running: false, floors: {}, current: 0, startedAt: 0, clicks: 0 };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const U = '#' + CFG.panelId;

  /* ============================================================
     PANEL
     ============================================================ */
  function isOnCasaTreta() {
    return Array.from(document.querySelectorAll(CFG.titleSelector))
      .some((h) => h.textContent.trim().toLowerCase() === CFG.titleText);
  }

  // Estado de cada planta: pending | run | ok | fail | skip
  const FLOOR_UI = {
    pending: { ico: '',   cls: 'rounded-card border-2 border-crema-200 bg-crema-50 text-tinta-400' },
    run:     { ico: '🔄', cls: 'rounded-card border-2 border-ambar-200 bg-ambar-50 text-ambar-700' },
    ok:      { ico: '✅', cls: 'rounded-card border-2 border-hoja-300 bg-hoja-50 text-hoja-700' },
    fail:    { ico: '❌', cls: 'rounded-card border-2 border-rojo-100 bg-lienzo text-rojo-600' },
    skip:    { ico: '⏳', cls: 'rounded-card border-2 border-crema-200 bg-crema-100 text-tinta-400' },
  };

  function buildPanel() {
    kStyle('ct-style', U);
    const st = document.createElement('style');
    st.id = 'ct-style-extra';
    st.textContent = `
      ${U} .ct-floors{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:4px}
      ${U} .ct-floor{text-align:center;padding:5px 0 4px;line-height:1.1}
      ${U} .ct-floor b{display:block;font-size:13px}
      ${U} .ct-floor small{display:block;font-size:10px;min-height:12px}
      ${U} .ct-floor[data-s="run"]{animation:k-pulso 1.2s ease-in-out infinite}`;
    if (!document.getElementById('ct-style-extra')) document.head.appendChild(st);

    const section = document.createElement('section');
    section.id = CFG.panelId;
    section.className = 'tarjeta space-y-3 p-3';
    section.innerHTML = `
      ${kHead('🗝️', 'Casa Treta · Auto', 'Listo para subir las 8 plantas')}
      <div class="ct-floors">
        ${CFG.floors.map(f => `
          <div class="ct-floor ${FLOOR_UI.pending.cls}" data-f="${f.n}" data-s="pending" title="Planta ${f.n} · ${f.doors} puertas · ${f.type === 'lado' ? 'izquierda/derecha' : 'frío/caliente'}">
            <b>${f.n}</b><small></small>
          </div>`).join('')}
      </div>
      <div>
        <div class="mb-1 flex items-baseline justify-between text-[11px] font-extrabold text-tinta-500">
          <span>🏠 Plantas subidas</span><span class="ct-prog-t tabular-nums">0 / 8</span>
        </div>
        <div class="${K_BAR}"><span class="ct-bar" style="width:0%;background-color:#2FA84F"></span></div>
      </div>
      <div class="k-tiles" style="--k-cols:3">
        <div class="${K_TILE}"><b class="ct-t-ok tabular-nums">0</b><small>Subidas</small></div>
        <div class="${K_TILE}"><b class="ct-t-clk tabular-nums">0</b><small>Puertas</small></div>
        <div class="${K_TILE}"><b class="ct-t-time tabular-nums">00:00</b><small>Tiempo</small></div>
      </div>
      <button type="button" class="ct-btn boton-principal w-full">▶ Resolver las 8 plantas</button>
      <div class="ct-log ${K_LOG}"></div>
    `;
    return section;
  }

  function mountPanel() {
    if (document.getElementById(CFG.panelId)) return;
    const anchor = CFG.anchorFinder();
    const panel = buildPanel();
    if (anchor && anchor.parentElement) {
      anchor.insertAdjacentElement('afterend', panel);
    } else {
      const firstFloor = document.querySelector(CFG.floorCardSelector);
      const main = document.querySelector('main') || document.body;
      if (firstFloor && firstFloor.parentElement) firstFloor.insertAdjacentElement('beforebegin', panel);
      else main.prepend(panel);
    }
    panel.querySelector('.ct-btn').addEventListener('click', () => {
      if (state.running) { state.running = false; log('⏸ Deteniendo tras el intento actual…'); render(); return; }
      start();
    });
    render();
  }

  function unmountPanel() {
    if (state.running) state.running = false;
    const el = document.getElementById(CFG.panelId);
    if (el) el.remove();
  }

  function start() {
    state.running = true;
    state.floors = {};
    state.current = 0;
    state.clicks = 0;
    state.startedAt = Date.now();
    const box = document.querySelector(`${U} .ct-log`);
    if (box) box.innerHTML = '';
    render();
    runAll().catch((e) => {
      if (e && e.message === 'DETENIDO') log('⏹ Detenido.');
      else { log('⚠ Error: ' + e.message); console.error(e); }
    }).finally(() => {
      state.running = false;
      state.endedAt = Date.now();
      render();
    });
  }

  function setFloor(n, s, note = '') {
    state.floors[n] = { s, note };
    render();
  }

  function render() {
    const p = document.getElementById(CFG.panelId);
    if (!p) return;
    const done = Object.values(state.floors).filter(f => f.s === 'ok').length;
    const fails = Object.values(state.floors).filter(f => f.s === 'fail').length;
    const finished = !state.running && state.startedAt;

    let badge = ['off', 'LISTO'];
    if (state.running) badge = ['on', state.current ? `PLANTA ${state.current}` : 'EN MARCHA'];
    else if (finished) badge = fails ? ['warn', `${done}/8`] : ['ok', 'COMPLETO'];
    if (isHouseLocked()) badge = ['warn', 'CERRADA'];
    kBadge(p.querySelector('.k-badge'), badge[0], badge[1]);

    kSet(p.querySelector('.k-sub'), state.running
      ? `Planta ${state.current || '…'} de 8 · no gasta energía`
      : finished ? `Terminado: ${done}/8 plantas subidas${fails ? ` · ${fails} sin resolver` : ''}` : 'Listo para subir las 8 plantas');

    for (const el of p.querySelectorAll('.ct-floor')) {
      const f = state.floors[el.dataset.f] || { s: 'pending', note: '' };
      if (el.dataset.s !== f.s) { el.dataset.s = f.s; el.className = 'ct-floor ' + FLOOR_UI[f.s].cls; }
      kSet(el.querySelector('small'), FLOOR_UI[f.s].ico);
      if (f.note) el.title = `Planta ${el.dataset.f}: ${f.note}`;
    }
    kSet(p.querySelector('.ct-prog-t'), `${done} / 8`);
    const bar = p.querySelector('.ct-bar');
    if (bar) bar.style.width = (done / 8 * 100) + '%';
    kSet(p.querySelector('.ct-t-ok'), String(done));
    kSet(p.querySelector('.ct-t-clk'), String(state.clicks));
    kSet(p.querySelector('.ct-t-time'), kTime(state.startedAt ? (state.running ? Date.now() : state.endedAt || Date.now()) - state.startedAt : 0));

    const btn = p.querySelector('.ct-btn');
    const cls = state.running ? 'ct-btn boton-secundario w-full' : 'ct-btn boton-principal w-full';
    if (btn.className !== cls) btn.className = cls;
    kSet(btn, state.running ? '■ Detener' : finished ? '↻ Volver a intentar' : '▶ Resolver las 8 plantas');
  }
  setInterval(() => { if (state.running) render(); }, 1000);

  function log(text) {
    console.log('%c[CasaTreta]', 'color:#c07a1e;font-weight:bold', text);
    kLog(document.querySelector(`${U} .ct-log`), text.trim());
  }

  /* ============================================================
     Observador de navegación (SPA)
     ============================================================ */
  let syncScheduled = false;
  function scheduleSync() {
    if (syncScheduled) return;
    syncScheduled = true;
    requestAnimationFrame(() => {
      syncScheduled = false;
      const onPage = isOnCasaTreta();
      if (onPage && !document.getElementById(CFG.panelId)) mountPanel();
      if (!onPage && document.getElementById(CFG.panelId)) unmountPanel();
    });
  }

  /* ============================================================
     Interacción con la planta / puertas
     ============================================================ */
  function findFloorCard(floorNumber) {
    // Se empareja el título exacto de cada tarjeta (vive en su propio <p>): al concatenar
    // textContent, «Planta 1» y «4 puertas…» quedaban pegados como «Planta 14 puertas…».
    const titleP = Array.from(document.querySelectorAll('p.text-sm.font-extrabold'))
      .find((p) => p.textContent.trim() === `Planta ${floorNumber}`);
    if (!titleP) return null;
    const card = titleP.closest(CFG.floorCardSelector);
    if (card && card.id === CFG.panelId) return null;
    return card || null;
  }

  function findButtonByText(card, regex) {
    return Array.from(card.querySelectorAll('button')).find((b) => regex.test(b.textContent.trim()));
  }

  async function enterFloor(floorNumber) {
    let card = findFloorCard(floorNumber);
    if (!card) { log(`No encuentro la Planta ${floorNumber} en la página.`); return null; }
    const text = card.textContent;
    if (/se te acabaron los intentos de hoy/i.test(text)) {
      log(`⏳ Planta ${floorNumber}: sin intentos hoy, la salto.`);
      return 'SIN_INTENTOS';
    }
    const yaAbierta = getDoors(card).length > 0;
    if (!yaAbierta) {
      const enterBtn = findButtonByText(card, /^entrar/i);
      if (!enterBtn) {
        // Sin «Entrar», sin puertas y sin aviso de intentos: ya está subida hoy
        log(`✅ Planta ${floorNumber}: ya estaba subida hoy.`);
        return 'YA_HOY';
      }
      enterBtn.click();
      await sleep(CFG.stepDelayMs);
      if (!state.running) throw new Error('DETENIDO');
      card = findFloorCard(floorNumber);
    } else {
      log(`Planta ${floorNumber} ya estaba abierta, sigo desde ahí.`);
    }
    return card;
  }

  function isHouseLocked() {
    return /la casa treta est[aá] en/i.test(document.body.textContent);
  }

  async function exitFloor(floorNumber) {
    const card = findFloorCard(floorNumber);
    if (!card) return;
    const salirBtn = findButtonByText(card, /^salir$/i);
    if (salirBtn) { salirBtn.click(); await sleep(CFG.stepDelayMs); }
  }

  function getDoors(card) {
    return Array.from(card.querySelectorAll(CFG.doorSelector));
  }

  // Historial «Puerta N: pista» de hoy: esas puertas no se vuelven a pulsar (el aviso se quedaría
  // congelado con el mensaje antiguo y no llegaría pista nueva).
  function getKnownHints(card) {
    const map = {};
    Array.from(card.querySelectorAll('p, div, span, li'))
      .filter((el) => el.children.length === 0)
      .forEach((el) => {
        const m = (el.textContent || '').trim().match(/^Puerta\s+(\d+)\s*:\s*(.+)$/i);
        if (m) map[parseInt(m[1], 10)] = m[2].trim().toLowerCase();
      });
    return map;
  }

  function getRemainingAttempts(card, fallback) {
    const m = card && card.textContent.match(/Te quedan\s+(\d+)\s+intentos?/i);
    return m ? parseInt(m[1], 10) : fallback;
  }

  // Las pistas son toasts <button class="pointer-events-auto …"><span>texto</span></button>.
  // El sitio reutiliza el mismo elemento y le cambia el texto, así que se compara TEXTO.
  const CFG_TOAST_SELECTOR = 'button.pointer-events-auto';
  function getLatestToastText() {
    const toasts = document.querySelectorAll(CFG_TOAST_SELECTOR);
    if (!toasts.length) return null;
    return (toasts[toasts.length - 1].textContent || '').trim().toLowerCase();
  }

  function waitForToastChange(beforeText, timeoutMs) {
    return new Promise((resolve) => {
      const start = Date.now();
      const tick = () => {
        if (!state.running) { resolve(''); return; }
        const current = getLatestToastText();
        if (current !== null && current !== beforeText) { resolve(current); return; }
        if (Date.now() - start > timeoutMs) { resolve(current || ''); return; }
        requestAnimationFrame(tick);
      };
      tick();
    });
  }

  async function clickDoorAndGetHint(floorNumber, index1based) {
    // La tarjeta se busca viva en cada clic: la web la redibuja tras cada intento
    const card = findFloorCard(floorNumber);
    if (!card) { log(`No encuentro la Planta ${floorNumber} en la página.`); return ''; }
    const btn = getDoors(card)[index1based - 1];
    if (!btn) { log(`No encuentro la puerta ${index1based} en esta planta.`); return ''; }
    const beforeText = getLatestToastText();
    btn.click();
    state.clicks++;
    render();
    const hint = await waitForToastChange(beforeText, 3000);
    if (!state.running) throw new Error('DETENIDO');
    await sleep(150);
    return hint;
  }

  function isSuccessHint(hint) {
    // «+N llaves» es el patrón fiable en todas las plantas
    return /\+\s*\d+\s*llaves/.test(hint) || /acert|subes|correct|¡sub/.test(hint);
  }
  function sideHintDirection(hint) {
    if (/izquierda/.test(hint)) return -1;
    if (/derecha/.test(hint)) return 1;
    return 0;
  }
  // 1 = más caliente (más cerca que la anterior), -1 = más frío, 0 = igual de lejos, null = no reconocida
  function hotColdCompare(hint) {
    if (/igual de lejos|misma distancia/.test(hint)) return 0;
    if (/m[aá]s caliente|caliente/.test(hint)) return 1;
    if (/m[aá]s fr[ií]o|fr[ií]o/.test(hint)) return -1;
    return null;
  }

  /* ---------- Estrategias ---------- */

  // Izquierda/derecha: búsqueda binaria. Aprovecha las pistas de hoy si la planta ya estaba empezada.
  async function solveLado(floorNumber, doors, attempts, known) {
    let lo = 1, hi = doors;
    for (const [d, h] of Object.entries(known)) {
      const dir = sideHintDirection(h), n = +d;
      if (dir === -1) hi = Math.min(hi, n - 1);
      else if (dir === 1) lo = Math.max(lo, n + 1);
    }
    if (Object.keys(known).length) log(`  Pistas de hoy: la puerta está entre ${lo} y ${hi}.`);
    for (let i = 0; i < attempts && lo <= hi; i++) {
      const guess = Math.floor((lo + hi) / 2);
      const hint = await clickDoorAndGetHint(floorNumber, guess);
      log(`  Intento ${i + 1}: puerta ${guess} → ${hint || '(sin pista)'}`);
      if (isSuccessHint(hint)) { log(`✅ Planta ${floorNumber}: puerta ${guess}`); return true; }
      const dir = sideHintDirection(hint);
      if (dir === -1) hi = guess - 1;
      else if (dir === 1) lo = guess + 1;
      else if (hint) log('  ⚠ Pista no reconocida como izquierda/derecha.');
    }
    return false;
  }

  // Frío/caliente: cada pista compara la puerta nueva con la anterior, o sea, dice a qué lado de la
  // mediatriz entre las dos está el premio. En cada paso se elige la puerta que deja el MENOR número
  // de candidatas en el peor caso. Simulado sobre todas las posiciones: resuelve 8/8, 12/12 y 16/16
  // (la estrategia anterior, de pasos que se doblan, se quedaba en 5/8, 7/12 y 9/16).
  async function solveFrioCaliente(floorNumber, doors, attempts, known) {
    const tried = new Set(Object.keys(known).map(Number));
    const verdict = (t, prev, g) => {
      if (g === t) return 'ok';
      const dp = Math.abs(t - prev), dg = Math.abs(t - g);
      return dg < dp ? 'hot' : dg > dp ? 'cold' : 'eq';
    };
    let cands = [];
    for (let d = 1; d <= doors; d++) if (!tried.has(d)) cands.push(d);

    // Primera puerta: la del centro (su pista no compara con nada)
    const center = Math.ceil(doors / 2);
    let prev = cands.includes(center) ? center : cands.reduce((a, d) => (Math.abs(d - center) < Math.abs(a - center) ? d : a), cands[0]);
    let hint = await clickDoorAndGetHint(floorNumber, prev);
    let used = 1;
    tried.add(prev);
    log(`  Intento 1: puerta ${prev} → ${hint || '(sin pista)'}`);
    if (isSuccessHint(hint)) { log(`✅ Planta ${floorNumber}: puerta ${prev}`); return true; }
    cands = cands.filter(c => c !== prev);

    while (used < attempts && cands.length) {
      let best = null;
      for (let g = 1; g <= doors; g++) {
        if (tried.has(g)) continue;
        const buckets = {};
        for (const c of cands) { const v = verdict(c, prev, g); if (v !== 'ok') buckets[v] = (buckets[v] || 0) + 1; }
        const worst = Math.max(0, ...Object.values(buckets));
        const key = worst * 2 + (cands.includes(g) ? 0 : 1);   // desempate: mejor si puede ser la buena
        if (!best || key < best.key) best = { key, g };
      }
      if (!best) break;
      const g = best.g;
      hint = await clickDoorAndGetHint(floorNumber, g);
      used++;
      tried.add(g);
      log(`  Intento ${used}: puerta ${g} → ${hint || '(sin pista)'}  [${cands.length} posibles]`);
      if (isSuccessHint(hint)) { log(`✅ Planta ${floorNumber}: puerta ${g}`); return true; }
      const cmp = hotColdCompare(hint);
      const want = cmp === 1 ? 'hot' : cmp === -1 ? 'cold' : cmp === 0 ? 'eq' : null;
      const next = want ? cands.filter(c => c !== g && verdict(c, prev, g) === want) : cands.filter(c => c !== g);
      if (!want && hint) log('  ⚠ Pista no reconocida como frío/caliente.');
      cands = next.length ? next : cands.filter(c => c !== g);
      prev = g;
    }
    return false;
  }

  /* ---------- Bucle principal ---------- */

  async function playFloor(floor) {
    state.current = floor.n;
    setFloor(floor.n, 'run');
    log(`— Planta ${floor.n} · ${floor.doors} puertas · ${floor.type === 'lado' ? 'izquierda/derecha' : 'frío/caliente'}`);
    const card = await enterFloor(floor.n);
    if (card === 'YA_HOY') { setFloor(floor.n, 'ok', 'ya subida hoy'); return true; }
    if (card === 'SIN_INTENTOS') { setFloor(floor.n, 'skip', 'sin intentos hoy'); return false; }
    if (!card) { setFloor(floor.n, 'fail', 'no encontrada'); return false; }

    const known = getKnownHints(card);
    const attempts = getRemainingAttempts(card, floor.attempts);
    const ok = floor.type === 'lado'
      ? await solveLado(floor.n, floor.doors, attempts, known)
      : await solveFrioCaliente(floor.n, floor.doors, attempts, known);
    if (!ok) log(`❌ Planta ${floor.n}: no resuelta con los intentos disponibles.`);
    setFloor(floor.n, ok ? 'ok' : 'fail', ok ? 'subida' : 'sin resolver');
    await exitFloor(floor.n);
    return ok;
  }

  async function runAll() {
    if (isHouseLocked()) { log('⚠ La Casa Treta está cerrada ahora mismo.'); return; }
    let subidas = 0;
    for (const floor of CFG.floors) {
      if (!state.running) throw new Error('DETENIDO');
      if (!findFloorCard(floor.n)) { setFloor(floor.n, 'skip', 'aún bloqueada (medallas)'); continue; }
      if (await playFloor(floor)) subidas++;
    }
    state.current = 0;
    log(`🎉 Recorrido completo: ${subidas}/8 plantas subidas.`);
  }

  window.casaTretaAutoSolver = { run: () => start(), playFloor, CFG, state };

  esperarHidratacion().then(() => {
    new MutationObserver(scheduleSync).observe(document.body, { childList: true, subtree: true });
    scheduleSync();
  });

  console.log(`%c🔑 CasaTreta Auto-Solver v${SCRIPT_VERSION} cargado`,
    'background:#2b1a0e;color:#f5c554;font-weight:bold;padding:4px 8px;border-radius:4px;');
})();
