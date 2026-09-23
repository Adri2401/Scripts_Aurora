// ==UserScript==
// @name         Aurora Dex · Salón Malvalona Auto
// @namespace    auroradex-salon-auto
// @version      1.1.0
// @description  Juega solo a «Sube o Baja» del Salón de Malvalona con cuenta exacta de cartas. Modo Respiros: gana los vales justos con el menor número de partidas y compra todos los «Un respiro» del cupo diario. Modo Vales: maximiza el valor esperado.
// @match        https://auroradex.es/*
// @match        https://www.auroradex.es/*
// @updateURL    https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_salon.user.js
// @downloadURL  https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_salon.user.js
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  /* ── Espera a que Next.js/React termine de hidratar (si no, modo claro y errores #418/#423) ── */
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

  /* ------------------------------------------------------------------ *
   *  CONFIG
   * ------------------------------------------------------------------ */
  const CFG = {
    actionDelay: [140, 260],     // pausa antes de pulsar (ms)
    changeTimeout: 5000,         // espera máxima a que el juego reaccione a un clic
    settle: 220,                 // deja acabar la animación de la carta antes de leer
    potStep: 8,                  // el bote sube de 8 en 8 por acierto (se corrige solo si la pantalla dice otra cosa)
    maxK: 9,                     // aciertos máximos: 10 cartas → 9 aciertos
    defaultPrice: 15,            // precio de «Un respiro» en vales (se lee del Mostrador)
    defaultGames: 0,             // 0 = sin límite
    defaultReserve: 0,           // energía que se deja sin gastar
  };
  const LS_POT = 'ax_salon_pot_v2';
  const LS_GAMES = 'ax_salon_games';
  const LS_RESERVE = 'ax_salon_reserve';
  const LS_MODE = 'ax_salon_mode';
  const LS_ER = 'ax_salon_energy_per_respiro';
  const PANEL_ID = 'ax-salon-auto';

  /* ── Kit visual común (recortado a lo que usa este panel) ──── */
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
    ${U} .k-seg{display:grid;grid-template-columns:repeat(var(--k-cols,2),minmax(0,1fr));gap:6px}
    ${U} .k-seg>button{padding:8px 4px;font-size:11px;font-weight:800;display:flex;flex-direction:column;align-items:center;gap:2px;line-height:1.15}
    ${U} .k-seg>button>span:first-child{font-size:18px}
    ${U} button:disabled{opacity:.55;cursor:not-allowed}
    ${U} input[type=number]{-moz-appearance:textfield}
    ${U} input[type=number]::-webkit-outer-spin-button,${U} input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
  `;
  const K_BADGE = {
    off: 'k-badge pastilla border-2 border-crema-200 bg-crema-50 text-tinta-500',
    on: 'k-badge pastilla border-2 border-hoja-200 bg-hoja-50 text-hoja-700',
    ok: 'k-badge pastilla border-2 border-hoja-300 bg-hoja-50 text-hoja-700',
    warn: 'k-badge pastilla border-2 border-ambar-200 bg-ambar-50 text-ambar-700',
  };
  const K_TILE = 'k-tile rounded-card border-2 border-crema-200 bg-crema-50';
  const K_FIELD = 'w-full rounded-card border-2 border-crema-200 bg-crema-50 px-2 py-1.5 text-sm font-semibold text-tinta-600 outline-none';
  const K_ON = 'rounded-card border-2 border-hoja-400 bg-hoja-50 text-hoja-700';
  const K_OFF = 'rounded-card border-2 border-crema-200 bg-crema-50 text-tinta-500';
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
  function kAviso(texto) {
    try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch { /* sin vibración */ }
    try { if ('Notification' in window && Notification.permission === 'granted') new Notification('Aurora Dex', { body: texto }); } catch { /* nada */ }
  }

  /* ------------------------------------------------------------------ *
   *  UTILIDADES
   * ------------------------------------------------------------------ */
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const txt = el => (el && el.textContent ? el.textContent.replace(/\s+/g, ' ').trim() : '');
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const num = s => { const m = String(s || '').match(/-?\d+/); return m ? parseInt(m[0], 10) : null; };
  const lsGet = (k, def) => { try { const v = localStorage.getItem(k); return v === null ? def : v; } catch { return def; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* sin storage */ } };
  const popcount = m => { let c = 0; while (m) { c += m & 1; m >>= 1; } return c; };

  // Los botones llevan texto en varios <span>: se unen con espacio («▲ MAYOR 67%»)
  function btnText(b) {
    if (!b) return '';
    let s = '';
    b.childNodes.forEach(n => { s += ' ' + (n.textContent || ''); });
    return s.replace(/\s+/g, ' ').trim();
  }
  const enPanel = el => !!el.closest('#' + PANEL_ID);
  const findBtn = (re, includeDisabled) =>
    $$('button').find(b => !enPanel(b) && (includeDisabled || !b.disabled) && re.test(btnText(b)));

  const enSalon = () => /^\/salon\/?$/.test(location.pathname);

  /* ------------------------------------------------------------------ *
   *  LECTURA DEL DOM
   * ------------------------------------------------------------------ */
  function readEnergy() {
    const box = document.querySelector('header span[title^="Tiempo para el siguiente punto"]');
    if (!box) return null;
    const n = $$('span', box).map(txt).find(t => /^\d+\/\d+$/.test(t));
    return n ? parseInt(n, 10) : null;
  }

  const mainText = () => txt(document.querySelector('main'));

  function readVales() {
    const m = mainText().match(/(\d+)\s*vales/i);
    return m ? parseInt(m[1], 10) : null;
  }

  // «Te quedan 6 de 20 de energía por comprar hoy»
  function readCupo() {
    const m = mainText().match(/Te quedan\s+(\d+)\s+de\s+(\d+)\s+de energ/i);
    return m ? { left: parseInt(m[1], 10), total: parseInt(m[2], 10) } : null;
  }

  // Botón «Un respiro» del Mostrador y su precio (el último número del botón)
  const respiroBtn = (includeDisabled) => findBtn(/Un respiro/i, includeDisabled);
  function respiroPrice() {
    const b = respiroBtn(true);
    const m = b && btnText(b).match(/(\d+)\s*$/);
    return m ? parseInt(m[1], 10) : CFG.defaultPrice;
  }

  function readGame() {
    const st = { screen: 'desconocida' };
    const may = findBtn(/MAYOR/i, true), men = findBtn(/MENOR/i, true);
    if (may && men) {
      st.screen = 'juego';
      st.mayor = may; st.menor = men;
      st.disabled = may.disabled || men.disabled;
      const pm = btnText(may).match(/(\d+)\s*%/), pn = btnText(men).match(/(\d+)\s*%/);
      st.pUpShown = pm ? parseInt(pm[1], 10) / 100 : null;
      st.pDownShown = pn ? parseInt(pn[1], 10) / 100 : null;

      const card = $$('span').find(x => /text-5xl/.test(x.className || ''));
      st.card = card ? num(txt(card)) : null;

      // «Quedan en la baraja»: <span title="1 de 4"> = (copias que quedan) de (número)
      st.deck = {};
      for (const el of $$('span[title]')) {
        const m = (el.getAttribute('title') || '').match(/^(\d+)\s+de\s+(\d+)$/);
        if (m) st.deck[parseInt(m[2], 10)] = parseInt(m[1], 10);
      }

      const stand = findBtn(/Plantarse/i, true);
      st.stand = stand;
      st.pot = stand ? num(btnText(stand)) : null;
      const otra = mainText().match(/con otra:\s*(\d+)/i);
      st.next = otra ? parseInt(otra[1], 10) : null;
      return st;
    }
    // Pantalla de inicio («JUGAR · ⚡ −1») o de resultado («OTRA · ⚡ −1», «DEJARLO POR HOY»)
    const play = findBtn(/^(JUGAR|OTRA)\b/i, true);
    if (play) { st.screen = 'inicio'; st.play = play; st.canPlay = !play.disabled; return st; }
    return st;
  }

  /* ------------------------------------------------------------------ *
   *  BOTE: 0, 8, 16, 24… (se corrige solo con lo que enseña la pantalla)
   * ------------------------------------------------------------------ */
  let pots = {};
  try { pots = JSON.parse(lsGet(LS_POT, '{}')) || {}; } catch { pots = {}; }
  for (let k = 0; k <= CFG.maxK; k++) if (pots[k] == null) pots[k] = CFG.potStep * k;
  pots[0] = 0;
  const savePots = () => lsSet(LS_POT, JSON.stringify(pots));

  function notePot(k, pot, next) {
    let ch = false;
    if (pot != null && pots[k] !== pot) { pots[k] = pot; ch = true; }
    if (next != null && pots[k + 1] !== next) { pots[k + 1] = next; ch = true; }
    if (ch) { savePots(); goalCache.clear(); }
  }
  const potAt = k => (pots[k] != null ? pots[k] : pots[CFG.maxK] + (k - CFG.maxK) * CFG.potStep);

  /* ------------------------------------------------------------------ *
   *  ESTRATEGIA
   *
   *  Estado de una partida: cartas que quedan (máscara de 10 bits) y carta actual.
   *  Los aciertos seguidos salen de la máscara: k = 9 − cartas que quedan.
   *  Se elige Mayor o Menor; se saca una de las cartas que quedan (todas igual de
   *  probables); si se acierta se sigue con el bote siguiente; si se falla, se pierde todo.
   *  Plantarse cobra el bote de esa racha.
   * ------------------------------------------------------------------ */
  const FULL = (1 << 10) - 1;
  const POP = Array.from({ length: 1 << 10 }, (_, m) => popcount(m));

  function maskOf(deck) {
    let m = 0;
    for (const n of Object.keys(deck)) if (deck[n] > 0) m |= 1 << (n - 1);
    return m;
  }

  // Recorrido genérico con memoria compartida. leaf(k) = valor/coste de plantarse con racha k; lose = el de fallar;
  // better(a, b) = true si a es mejor que b. V(mask, c) da el valor del estado; ACT[(mask<<4)|c] la acción (0 plantarse, 1 mayor, 2 menor).
  function makeSolver(leaf, lose, better) {
    const memo = new Float64Array(1 << 14).fill(NaN);   // (mask << 4) | c
    const act = new Uint8Array(1 << 14);

    function V(mask, c) {
      const key = (mask << 4) | c;
      const hit = memo[key];
      if (hit === hit) return hit;
      const k = 9 - POP[mask];
      let best = leaf(k), a = 0;
      if (mask) {
        let cnt = 0, up = 0, down = 0, nUp = 0, nDown = 0;
        for (let n = 1; n <= 10; n++) {
          if (!(mask & (1 << (n - 1)))) continue;
          cnt++;
          const nv = V(mask & ~(1 << (n - 1)), n);
          if (n > c) { up += nv; nUp++; } else { down += nv; nDown++; }
        }
        const vUp = (up + nDown * lose) / cnt, vDown = (down + nUp * lose) / cnt;
        const [bv, ba] = better(vUp, vDown) ? [vUp, 1] : [vDown, 2];
        if (better(bv, best) && Math.abs(bv - best) > 1e-9) { best = bv; a = ba; }
      }
      memo[key] = best; act[key] = a;
      return best;
    }
    return { V, act };
  }

  // MODO VALES: maximiza el valor esperado del bote
  function solveEV(deck, card) {
    const s = makeSolver(k => potAt(k), 0, (x, y) => x > y);
    const mask = maskOf(deck), val = s.V(mask, card);
    return { a: ['stand', 'mayor', 'menor'][s.act[(mask << 4) | card]], v: val };
  }

  // MODO RESPIROS: minimiza las partidas esperadas hasta reunir T vales.
  // G(v) = partidas esperadas desde v vales. Cada partida cuesta 1; al plantarse con racha k se pasa a v + bote(k).
  const goalCache = new Map();
  const potUp = k => Math.max(1, potAt(k));   // siempre avanza (evita bucles si la pantalla dijera 0)
  function G(v, T) {
    if (v >= T) return 0;
    const key = T + '|' + v;
    if (goalCache.has(key)) return goalCache.get(key);
    const up = [];
    for (let k = 1; k <= CFG.maxK; k++) up[k] = G(v + potUp(k), T);
    // punto fijo: g = 1 + coste medio de una partida jugada óptimamente (fallar o plantarse en 0 = seguir en v = g)
    let g = 6;
    for (let it = 0; it < 80; it++) {
      const s = makeSolver(k => (k === 0 ? g : up[k]), g, (x, y) => x < y);
      let sum = 0;
      for (let c = 1; c <= 10; c++) sum += s.V(FULL & ~(1 << (c - 1)), c);
      const ng = 1 + sum / 10;
      if (Math.abs(ng - g) < 1e-7) { g = ng; break; }
      g = ng;
    }
    goalCache.set(key, g);
    return g;
  }

  function solveGoal(deck, card, v, T) {
    const g = G(v, T);
    const up = [];
    for (let k = 1; k <= CFG.maxK; k++) up[k] = G(v + potUp(k), T);
    const s = makeSolver(k => (k === 0 ? g : up[k]), g, (x, y) => x < y);
    const mask = maskOf(deck), val = s.V(mask, card);
    return { a: ['stand', 'mayor', 'menor'][s.act[(mask << 4) | card]], v: val, g };
  }

  /* ------------------------------------------------------------------ *
   *  BUCLE
   * ------------------------------------------------------------------ */
  let running = false, ticking = false, idle = 0;
  let mode = lsGet(LS_MODE, 'respiros');
  let ses = { games: 0, wins: 0, vales0: null, vales: null, energy0: null, respiros: 0 };
  let game = { lastAction: null, stuck: 0 };
  let limitGames = 0, reserve = CFG.defaultReserve;
  let energyPerRespiro = parseInt(lsGet(LS_ER, '0'), 10) || 0;

  const deckSig = g => JSON.stringify([g.card, g.deck]);

  function stop(reason) {
    running = false;
    if (reason) log(reason);
    paint();
  }
  function log(s) { logLine = s; if (logEl) logEl.textContent = s; }

  async function waitChange(prevSig, prevScreen, ms = CFG.changeTimeout) {
    const t0 = Date.now();
    while (running && Date.now() - t0 < ms) {
      const g = readGame();
      if (g.screen !== prevScreen) return g;
      if (g.screen === 'juego' && deckSig(g) !== prevSig) return g;
      await sleep(40);
    }
    return null;
  }

  // Compra un «Un respiro» y aprende cuánta energía da (lo que baja el cupo diario)
  async function comprarRespiro() {
    const b = respiroBtn(false);
    if (!b) return false;
    const antes = { v: readVales(), cupo: readCupo(), en: readEnergy() };
    await sleep(rnd(...CFG.actionDelay));
    if (!running) return false;
    b.click();
    const t0 = Date.now();
    let confirmado = false;
    while (running && Date.now() - t0 < 4000) {
      const v = readVales(), cupo = readCupo();
      if ((v != null && antes.v != null && v < antes.v) || (cupo && antes.cupo && cupo.left < antes.cupo.left)) { confirmado = true; break; }
      // por si el juego pide confirmar la compra
      const ok = findBtn(/^(comprar|confirmar|s[ií]\b|aceptar)/i);
      if (ok) { ok.click(); await sleep(200); }
      await sleep(60);
    }
    if (!confirmado) return false;
    await sleep(CFG.settle);
    const despues = { v: readVales(), cupo: readCupo(), en: readEnergy() };
    if (antes.cupo && despues.cupo && antes.cupo.left > despues.cupo.left) {
      energyPerRespiro = antes.cupo.left - despues.cupo.left;
      lsSet(LS_ER, String(energyPerRespiro));
    }
    ses.respiros++;
    log(`🥤 Respiro comprado (${antes.v} → ${despues.v ?? '?'} vales${energyPerRespiro ? ' · +' + energyPerRespiro + ' energía' : ''})`);
    return true;
  }

  // Vales que faltan para comprar todos los respiros que quedan hoy (T) según el cupo
  function objetivo() {
    const cupo = readCupo();
    const price = respiroPrice();
    if (!cupo) return { cupo: null, price, need: null, T: null };
    if (cupo.left <= 0) return { cupo, price, need: 0, T: 0 };
    const need = energyPerRespiro > 0 ? Math.ceil(cupo.left / energyPerRespiro) : 1;   // hasta saber cuánto da cada uno, de uno en uno
    return { cupo, price, need, T: need * price };
  }

  async function tick() {
    if (!running || ticking) return;
    ticking = true;
    try {
      const g = readGame();
      ses.vales = readVales() ?? ses.vales;
      if (ses.vales0 == null) ses.vales0 = ses.vales;
      if (ses.energy0 == null) ses.energy0 = readEnergy();

      /* ── Partida en curso ───────────────────────────────────────── */
      if (g.screen === 'juego') {
        idle = 0;
        if (g.disabled || g.card == null) return;           // animación en curso

        const mask = maskOf(g.deck);
        const restantes = POP[mask];
        const k = 9 - restantes;                              // aciertos seguidos, sacado de la baraja
        notePot(k, g.pot, g.next);

        // La cuenta exacta solo vale si los % de la pantalla coinciden con mi cuenta de cartas
        const teo = restantes ? Object.keys(g.deck).filter(n => g.deck[n] > 0 && +n > g.card).length / restantes : null;
        const cuadra = teo != null && g.pUpShown != null && Math.abs(teo - g.pUpShown) <= 0.03;

        let d = null, nota = '';
        if (cuadra) {
          if (mode === 'respiros') {
            const o = objetivo();
            const v = readVales() ?? 0;
            d = o.T ? solveGoal(g.deck, g.card, v, o.T) : solveEV(g.deck, g.card);
            nota = o.T ? ` · objetivo ${o.T} vales (~${d.g.toFixed(1)} partidas)` : '';
          } else {
            d = solveEV(g.deck, g.card);
          }
        } else if (g.pUpShown != null && g.pDownShown != null && g.next != null) {
          // Plan B (un solo paso) con los % que enseña el juego
          const up = g.pUpShown * g.next, down = g.pDownShown * g.next, pot = g.pot ?? 0;
          d = up >= down ? { a: 'mayor', v: up } : { a: 'menor', v: down };
          if (pot >= d.v) d = { a: 'stand', v: pot };
          nota = ' · ⚠ % de pantalla ≠ mi cuenta';
        }
        if (!d) { stop('No puedo leer la baraja ni los %. Parado.'); return; }
        if (d.a === 'stand' && !g.stand) d = { a: (g.pUpShown ?? 0) >= (g.pDownShown ?? 0) ? 'mayor' : 'menor', v: d.v };

        const info = `carta ${g.card} · bote ${g.pot ?? '?'} · racha ${k}${nota}`;
        const prevSig = deckSig(g);
        await sleep(rnd(...CFG.actionDelay));
        if (!running) return;

        if (d.a === 'stand') {
          log(`${info} → Plantarse`);
          game.lastAction = 'stand';
          g.stand.click();
        } else {
          log(`${info} → ${d.a === 'mayor' ? '▲ Mayor' : '▼ Menor'}`);
          game.lastAction = d.a;
          (d.a === 'mayor' ? g.mayor : g.menor).click();
        }
        const after = await waitChange(prevSig, 'juego');
        if (!after) {
          if (++game.stuck >= 3) { stop('El juego no reacciona a los clics. Parado.'); return; }
        } else game.stuck = 0;
        await sleep(CFG.settle);
        return;
      }

      /* ── Inicio o resultado: comprar respiros / empezar otra ────── */
      if (g.screen === 'inicio') {
        idle = 0;
        if (game.lastAction) {   // acaba de terminar una partida
          ses.games++;
          if (game.lastAction === 'stand') ses.wins++;
          game = { lastAction: null, stuck: 0 };
        }

        if (mode === 'respiros') {
          const o = objetivo();
          if (o.cupo && o.cupo.left <= 0) {
            stop(`✅ Todos los respiros de hoy comprados (${ses.respiros} en esta sesión, ${ses.games} partidas).`);
            kAviso('Salón: respiros completos');
            return;
          }
          const v = readVales() ?? 0;
          const rb = respiroBtn(false);
          if (rb && v >= o.price) { if (await comprarRespiro()) return; }
          if (!o.cupo && !respiroBtn(true)) { stop('No encuentro el Mostrador ni el cupo de energía. Parado.'); return; }
        }

        if (limitGames > 0 && ses.games >= limitGames) {
          stop(`✅ ${ses.games} partidas hechas. Vales: ${ses.vales != null && ses.vales0 != null ? ses.vales - ses.vales0 : '?'}`);
          kAviso('Salón: terminado');
          return;
        }
        const en = readEnergy();
        if (en != null && en <= reserve) { stop(`Energía en ${en} (reserva ${reserve}). Parado.`); return; }
        if (!g.canPlay) { stop('El botón de jugar está deshabilitado (¿sin energía?). Parado.'); return; }
        await sleep(rnd(...CFG.actionDelay));
        if (!running) return;
        game = { lastAction: null, stuck: 0 };
        g.play.click();
        log('Nueva partida…');
        await waitChange('', 'inicio');
        await sleep(CFG.settle);
        return;
      }

      /* ── Pantalla no reconocida ─────────────────────────────────── */
      idle++;
      const extra = findBtn(/^(continuar|seguir|aceptar|volver|de acuerdo|vale)/i);
      if (extra) { log('Click: ' + btnText(extra)); extra.click(); await sleep(300); idle = 0; return; }
      if (idle > 25) {
        const vistos = $$('button').filter(b => !enPanel(b)).map(btnText).filter(Boolean).slice(0, 4).join(' | ');
        stop('No reconozco la pantalla (botones: ' + (vistos || 'ninguno') + '). Parado.');
      }
    } catch (e) {
      console.error('[SalonAuto]', e);
      stop('Error: ' + e.message);
    } finally {
      ticking = false;
      paint();
    }
  }

  async function loop() {
    while (running) {
      await tick();
      await sleep(60);
    }
  }

  function start() {
    if (!enSalon() || running) return;
    limitGames = Math.max(0, parseInt(panel.querySelector('.ax-games').value, 10) || 0);
    reserve = Math.max(0, parseInt(panel.querySelector('.ax-reserve').value, 10) || 0);
    lsSet(LS_GAMES, String(limitGames)); lsSet(LS_RESERVE, String(reserve));
    running = true; idle = 0;
    game = { lastAction: null, stuck: 0 };
    ses = { games: 0, wins: 0, vales0: readVales(), vales: readVales(), energy0: readEnergy(), respiros: 0 };
    try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); } catch { /* nada */ }
    log(mode === 'respiros' ? 'Objetivo: comprar todos los respiros de hoy…' : 'Jugando para maximizar vales…');
    paint();
    loop();
  }

  /* ------------------------------------------------------------------ *
   *  PANEL
   * ------------------------------------------------------------------ */
  const UP = '#' + PANEL_ID;
  let panel = null, logEl = null;
  let logLine = 'Cuenta cartas y decide con el valor esperado exacto.';

  function buildPanel() {
    kStyle('ax-salon-kit', UP);
    const sec = document.createElement('section');
    sec.id = PANEL_ID;
    sec.className = 'tarjeta space-y-3 p-3';
    sec.setAttribute('data-ax-ignore', '1');
    sec.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="k-ico rounded-card border-2 border-crema-200 bg-crema-100">🎴</span>
        <div class="min-w-0 flex-1">
          <p class="font-display text-base font-extrabold leading-tight">Sube o Baja · Automático</p>
          <p class="k-sub truncate text-[11px] font-bold text-tinta-400"></p>
        </div>
        <span class="${K_BADGE.off}" data-s="off"><span class="k-dot"></span><span class="k-badge-t">LISTO</span></span>
      </div>
      <div class="ax-modes k-seg">
        <button type="button" data-mode="respiros"><span>🥤</span><span>Respiros</span><span class="text-[10px] font-bold opacity-70">compra todo el cupo diario</span></button>
        <button type="button" data-mode="vales"><span>🎟️</span><span>Vales</span><span class="text-[10px] font-bold opacity-70">máximo valor esperado</span></button>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <label class="block text-[10px] font-extrabold uppercase text-tinta-400">Partidas (0 = sin límite)
          <input type="number" min="0" class="ax-games ${K_FIELD}"></label>
        <label class="block text-[10px] font-extrabold uppercase text-tinta-400">Dejar de energía
          <input type="number" min="0" class="ax-reserve ${K_FIELD}"></label>
      </div>
      <button type="button" class="boton-principal w-full" data-ax="go">▶ Jugar solo</button>
      <button type="button" class="boton-secundario w-full" data-ax="stop" hidden>■ Parar</button>
      <div class="k-tiles">
        <div class="${K_TILE}"><b class="ax-t-games tabular-nums">0</b><small>Partidas</small></div>
        <div class="${K_TILE}"><b class="ax-t-vales tabular-nums">–</b><small>Vales</small></div>
        <div class="${K_TILE}"><b class="ax-t-en tabular-nums">–</b><small>Energía</small></div>
        <div class="${K_TILE}"><b class="ax-t-resp tabular-nums">0</b><small>Respiros</small></div>
      </div>
      <p class="ax-goal text-center text-[11px] font-bold text-tinta-400"></p>
      <p class="rounded-card border-2 border-crema-200 bg-crema-50 p-2 text-center text-[11px] font-bold text-tinta-600" data-ax="log"></p>
      <details class="rounded-card border-2 border-crema-200 bg-crema-50">
        <summary class="cursor-pointer list-none p-2 text-[11px] font-extrabold text-tinta-500">📈 Lo aprendido ▾</summary>
        <div class="space-y-1 px-2 pb-2 text-[11px] font-semibold text-tinta-500">
          <p class="ax-learn"></p>
          <button type="button" class="boton-suave w-full !py-2 text-[11px]" data-ax="reset">Olvidar lo aprendido</button>
        </div>
      </details>`;
    sec.querySelector('.ax-games').value = lsGet(LS_GAMES, String(CFG.defaultGames));
    sec.querySelector('.ax-reserve').value = lsGet(LS_RESERVE, String(CFG.defaultReserve));
    logEl = sec.querySelector('[data-ax="log"]');
    logEl.textContent = logLine;
    const on = (sel, fn) => sec.querySelector(sel).addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); fn(); });
    on('[data-ax="go"]', start);
    on('[data-ax="stop"]', () => stop('Parado a mano.'));
    on('[data-ax="reset"]', () => {
      if (!confirm('¿Olvidar los botes y la energía por respiro aprendidos?')) return;
      pots = {}; for (let k = 0; k <= CFG.maxK; k++) pots[k] = CFG.potStep * k;
      savePots(); goalCache.clear(); energyPerRespiro = 0; lsSet(LS_ER, '0');
      log('Aprendizaje reiniciado.'); paint();
    });
    for (const b of sec.querySelectorAll('.ax-modes > button')) {
      b.addEventListener('click', e => {
        e.preventDefault(); e.stopPropagation();
        if (running) return;
        mode = b.dataset.mode; lsSet(LS_MODE, mode); paint();
      });
    }
    return sec;
  }

  function paint() {
    if (!panel) return;
    kBadge(panel.querySelector('.k-badge'), running ? 'on' : 'off', running ? 'JUGANDO' : 'LISTO');
    kSet(panel.querySelector('.k-sub'), mode === 'respiros' ? 'Vales justos, con las menos partidas posibles' : 'Maximiza los vales de cada partida');
    panel.querySelector('[data-ax="go"]').hidden = running;
    panel.querySelector('[data-ax="stop"]').hidden = !running;
    for (const i of panel.querySelectorAll('input')) i.disabled = running;
    for (const b of panel.querySelectorAll('.ax-modes > button')) {
      const cls = mode === b.dataset.mode ? K_ON : K_OFF;
      if (b.className !== cls) b.className = cls;
      b.disabled = running && mode !== b.dataset.mode;
    }

    const v = readVales();
    const ganado = ses.vales != null && ses.vales0 != null ? ses.vales - ses.vales0 : null;
    kSet(panel.querySelector('.ax-t-games'), String(ses.games));
    kSet(panel.querySelector('.ax-t-vales'), v != null ? String(v) : '–');
    const en = readEnergy();
    kSet(panel.querySelector('.ax-t-en'), en != null ? String(en) : '–');
    kSet(panel.querySelector('.ax-t-resp'), String(ses.respiros));

    const o = objetivo();
    kSet(panel.querySelector('.ax-goal'),
      mode !== 'respiros' ? (ganado != null && ses.games ? `Ganado en esta sesión: ${ganado >= 0 ? '+' : ''}${ganado} vales` : '')
        : !o.cupo ? 'Abre el Mostrador para leer el cupo diario'
          : o.cupo.left <= 0 ? '✅ Cupo de energía de hoy completo'
            : `🎯 Quedan ${o.cupo.left} de ${o.cupo.total} de energía por comprar${energyPerRespiro ? ` (${o.need} respiros · ${o.T} vales)` : ' · ' + o.price + ' vales el primero'}`);

    kSet(panel.querySelector('.ax-learn'),
      `💰 Bote tras 0, 1, 2… aciertos: ${Object.keys(pots).map(Number).sort((a, b) => a - b).map(k => pots[k]).join(' → ')} · ⚡ por respiro: ${energyPerRespiro || 'aún no sé'}`);
  }
  setInterval(() => { if (running) paint(); }, 1000);

  function ensurePanel() {
    if (!enSalon()) {
      if (panel && panel.parentElement) panel.remove();
      if (running) stop('Fuera del Salón. Parado.');
      return;
    }
    const h1 = $$('h1').find(h => /sal[oó]n malvalona/i.test(txt(h)));
    const cab = h1 && h1.closest('section');
    if (!cab || !cab.parentElement) return;
    if (!panel) { panel = buildPanel(); paint(); }
    if (panel.previousElementSibling !== cab) cab.insertAdjacentElement('afterend', panel);
  }

  // Para poder probar la estrategia sin la web
  window.__axSalon = { solveEV, solveGoal, G, readGame, potAt, maskOf, pots };

  esperarHidratacion().then(() => {
    ensurePanel();
    setInterval(ensurePanel, 800);
  });
})();
