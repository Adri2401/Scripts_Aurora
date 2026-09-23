// ==UserScript==
// @name         Aurora Dex · Salón Malvalona Auto
// @namespace    auroradex-salon-auto
// @version      1.0.0
// @description  Juega solo a «Sube o Baja» del Salón de Malvalona: cuenta las cartas que quedan en la baraja y decide Mayor / Menor / Plantarse con programación dinámica exacta, aprendiendo cómo crece el bote.
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
    defaultGrowth: 1.6,          // crecimiento del bote por acierto mientras no se conozca
    defaultGames: 10,
    defaultReserve: 5,           // energía que se deja sin gastar
  };
  const LS_POT = 'ax_salon_pot_v1';
  const LS_GAMES = 'ax_salon_games';
  const LS_RESERVE = 'ax_salon_reserve';
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
    ${U} button:disabled{opacity:.55;cursor:not-allowed}
    ${U} input[type=number]{-moz-appearance:textfield}
    ${U} input[type=number]::-webkit-outer-spin-button,${U} input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
  `;
  const K_BADGE = {
    off: 'k-badge pastilla border-2 border-crema-200 bg-crema-50 text-tinta-500',
    on: 'k-badge pastilla border-2 border-hoja-200 bg-hoja-50 text-hoja-700',
    warn: 'k-badge pastilla border-2 border-ambar-200 bg-ambar-50 text-ambar-700',
  };
  const K_TILE = 'k-tile rounded-card border-2 border-crema-200 bg-crema-50';
  const K_FIELD = 'w-full rounded-card border-2 border-crema-200 bg-crema-50 px-2 py-1.5 text-sm font-semibold text-tinta-600 outline-none';
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
  const kTime = ms => {
    const t = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
    return (h ? h + ':' : '') + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  };

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

  // Los botones llevan texto en varios <span>: se unen con espacio («▲ MAYOR 67%»)
  function btnText(b) {
    if (!b) return '';
    let s = '';
    b.childNodes.forEach(n => { s += ' ' + (n.textContent || ''); });
    return s.replace(/\s+/g, ' ').trim();
  }
  const findBtn = (re, includeDisabled) =>
    $$('button').find(b => !b.closest('#' + PANEL_ID) && (includeDisabled || !b.disabled) && re.test(btnText(b)));

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

  function readVales() {
    const m = txt(document.querySelector('main')).match(/(\d+)\s*vales/i);
    return m ? parseInt(m[1], 10) : null;
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
      const otra = txt(document.querySelector('main')).match(/con otra:\s*(\d+)/i);
      st.next = otra ? parseInt(otra[1], 10) : null;
      return st;
    }
    const play = findBtn(/^JUGAR/i, true);
    if (play) { st.screen = 'inicio'; st.play = play; st.canPlay = !play.disabled; return st; }
    return st;
  }

  /* ------------------------------------------------------------------ *
   *  APRENDIZAJE DEL BOTE (bote tras k aciertos seguidos)
   * ------------------------------------------------------------------ */
  let pots = {};
  try { pots = JSON.parse(lsGet(LS_POT, '{}')) || {}; } catch { pots = {}; }
  const savePots = () => lsSet(LS_POT, JSON.stringify(pots));
  pots[0] = 0;

  function notePot(k, pot, next) {
    let ch = false;
    if (pot != null && pots[k] !== pot) { pots[k] = pot; ch = true; }
    if (next != null && pots[k + 1] !== next) { pots[k + 1] = next; ch = true; }
    if (ch) savePots();
  }

  // Bote esperado tras k aciertos: lo visto, o extrapolado con el último crecimiento conocido
  function potAt(k, table) {
    if (table[k] != null) return table[k];
    let k0 = k;
    while (k0 > 0 && table[k0] == null) k0--;
    const base = table[k0] || 0;
    let r = CFG.defaultGrowth;
    if (k0 >= 2 && table[k0 - 1] > 0) r = table[k0] / table[k0 - 1];
    else if (k0 === 1 && table[1] > 0) r = CFG.defaultGrowth;
    return base * Math.pow(Math.max(1, r), k - k0);
  }

  /* ------------------------------------------------------------------ *
   *  DECISIÓN (valor esperado exacto)
   *
   *  Estado: cartas que quedan (máscara), carta actual c y aciertos seguidos k.
   *  Plantarse → bote(k). Seguir → se elige Mayor o Menor; se saca una de las
   *  cartas que quedan (todas igual de probables); si se acierta, se pasa al
   *  estado siguiente con un acierto más; si se falla, se pierde todo (0).
   * ------------------------------------------------------------------ */
  function solve(deck, card, k, table) {
    const memo = new Map();
    let mask0 = 0;
    for (const n of Object.keys(deck)) if (deck[n] > 0) mask0 |= 1 << (n - 1);

    function V(mask, c, kk) {
      const key = (mask << 8) | (c << 4) | kk;
      const hit = memo.get(key);
      if (hit) return hit;
      const stand = potAt(kk, table);
      let best = { v: stand, a: 'stand', up: 0, down: 0 };
      if (mask) {
        let cnt = 0, up = 0, down = 0;
        for (let n = 1; n <= 10; n++) {
          if (!(mask & (1 << (n - 1)))) continue;
          cnt++;
          const nv = V(mask & ~(1 << (n - 1)), n, kk + 1).v;
          if (n > c) up += nv; else if (n < c) down += nv;
        }
        up /= cnt; down /= cnt;
        if (up > best.v + 1e-9 && up >= down) best = { v: up, a: 'mayor', up, down };
        else if (down > best.v + 1e-9) best = { v: down, a: 'menor', up, down };
        else { best.up = up; best.down = down; }
      }
      memo.set(key, best);
      return best;
    }
    return V(mask0, card, k);
  }

  // Tabla efectiva: lo aprendido, y para el paso inmediato lo que enseña la pantalla
  const tableNow = (g, k) => {
    const t = { ...pots };
    if (g.pot != null) t[k] = g.pot;
    if (g.next != null) t[k + 1] = g.next;
    return t;
  };

  /* ------------------------------------------------------------------ *
   *  BUCLE
   * ------------------------------------------------------------------ */
  let running = false, ticking = false, idle = 0;
  let ses = { t0: 0, t1: 0, games: 0, wins: 0, vales0: null, vales: null, best: 0 };
  let game = { k: 0, lastAction: null, stuck: 0 };
  let limitGames = 0, reserve = CFG.defaultReserve;

  const deckSig = (g) => JSON.stringify([g.card, g.deck]);

  function stop(reason) {
    if (running) ses.t1 = Date.now();
    running = false;
    if (reason) log(reason);
    paint();
  }

  function log(s) { logLine = s; if (logEl) logEl.textContent = s; }

  async function waitChange(prevSig, prevScreen) {
    const t0 = Date.now();
    while (running && Date.now() - t0 < CFG.changeTimeout) {
      const g = readGame();
      if (g.screen !== prevScreen) return g;
      if (g.screen === 'juego' && deckSig(g) !== prevSig) return g;
      await sleep(40);
    }
    return null;
  }

  async function tick() {
    if (!running || ticking) return;
    ticking = true;
    try {
      const g = readGame();
      ses.vales = readVales() ?? ses.vales;
      if (ses.vales0 == null) ses.vales0 = ses.vales;

      if (g.screen === 'juego') {
        idle = 0;
        if (g.disabled || g.card == null) return;           // animación en curso

        // Resincroniza la racha con el bote que enseña la pantalla (por si se perdió la cuenta)
        if (g.pot != null) {
          if (g.pot === 0) game.k = 0;
          else {
            const ks = Object.keys(pots).map(Number).filter(x => pots[x] === g.pot);
            if (ks.length && !ks.includes(game.k)) game.k = ks[0];
          }
        }
        notePot(game.k, g.pot, g.next);

        // Decisión: cuenta exacta de cartas, salvo que la baraja no se lea o los % de la pantalla no cuadren
        const restantes = Object.keys(g.deck).filter(n => g.deck[n] > 0);
        let d = null, modo = 'exacto';
        const teo = restantes.length ? restantes.filter(n => +n > g.card).length / restantes.length : null;
        const cuadra = teo != null && g.pUpShown != null && Math.abs(teo - g.pUpShown) <= 0.03;
        if (restantes.length && cuadra) {
          d = solve(g.deck, g.card, game.k, tableNow(g, game.k));
        } else if (g.pUpShown != null && g.pDownShown != null && g.next != null) {
          // Plan B (un solo paso) con los % que enseña el juego
          modo = 'miope';
          const up = g.pUpShown * g.next, down = g.pDownShown * g.next, pot = g.pot ?? 0;
          d = up >= down ? { a: 'mayor', v: up, up, down } : { a: 'menor', v: down, up, down };
          if (pot >= d.v) d = { a: 'stand', v: pot, up, down };
        }
        if (!d) { log('No puedo leer la baraja ni los %. Parado.'); stop(); return; }
        if (d.a === 'stand' && !g.stand) d = { ...d, a: d.up >= d.down ? 'mayor' : 'menor' };

        const info = `carta ${g.card} · bote ${g.pot ?? '?'} · racha ${game.k}${modo === 'miope' ? ' · ⚠ % de pantalla ≠ mi cuenta' : ''}`;
        const prevSig = deckSig(g);
        await sleep(rnd(...CFG.actionDelay));
        if (!running) return;

        if (d.a === 'stand') {
          log(`${info} → Plantarse (seguir valdría ${Math.max(d.up, d.down).toFixed(1)})`);
          game.lastAction = 'stand';
          g.stand.click();
        } else {
          const btn = d.a === 'mayor' ? g.mayor : g.menor;
          log(`${info} → ${d.a === 'mayor' ? '▲ Mayor' : '▼ Menor'} (esperado ${d.v.toFixed(1)} vs plantarse ${g.pot ?? 0})`);
          game.lastAction = d.a;
          btn.click();
        }
        const after = await waitChange(prevSig, 'juego');
        if (!after) {
          if (++game.stuck >= 3) { stop('El juego no reacciona a los clics. Parado.'); return; }
        } else game.stuck = 0;
        await sleep(CFG.settle);
        if (after && after.screen === 'juego' && game.lastAction !== 'stand') {
          game.k++;   // acierto: sigue la partida
        }
        return;
      }

      if (g.screen === 'inicio') {
        idle = 0;
        // fin de una partida en curso
        if (game.lastAction) {
          ses.games++;
          if (game.lastAction === 'stand') ses.wins++;
          game = { k: 0, lastAction: null, stuck: 0 };
          log(`Partida ${ses.games} terminada · vales ${ses.vales ?? '?'}`);
        }
        if (limitGames > 0 && ses.games >= limitGames) { stop(`✅ ${ses.games} partidas hechas. Vales: ${ses.vales != null && ses.vales0 != null ? '+' + (ses.vales - ses.vales0) : '?'}`); kAviso('Salón: terminado'); return; }
        const en = readEnergy();
        if (en != null && en <= reserve) { stop(`Energía en ${en} (reserva ${reserve}). Parado.`); return; }
        if (!g.canPlay) { stop('El botón JUGAR está deshabilitado (¿sin energía?). Parado.'); return; }
        await sleep(rnd(...CFG.actionDelay));
        if (!running) return;
        game = { k: 0, lastAction: null, stuck: 0 };
        g.play.click();
        log('Nueva partida…');
        await waitChange('', 'inicio');
        await sleep(CFG.settle);
        return;
      }

      // pantalla no reconocida (resultado, transición…)
      idle++;
      const extra = findBtn(/^(continuar|seguir|aceptar|volver|otra vez|de acuerdo|vale)/i);
      if (extra) { log('Click: ' + btnText(extra)); extra.click(); await sleep(300); idle = 0; return; }
      if (idle > 25) {
        const vistos = $$('button').filter(b => !b.closest('#' + PANEL_ID)).map(btnText).filter(Boolean).slice(0, 4).join(' | ');
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
    game = { k: 0, lastAction: null, stuck: 0 };
    ses = { t0: Date.now(), t1: 0, games: 0, wins: 0, vales0: readVales(), vales: readVales(), best: 0 };
    try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); } catch { /* nada */ }
    log('Jugando…');
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
          <p class="k-sub truncate text-[11px] font-bold text-tinta-400">Mayor · Menor · Plantarse con la mejor estrategia</p>
        </div>
        <span class="${K_BADGE.off}" data-s="off"><span class="k-dot"></span><span class="k-badge-t">LISTO</span></span>
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
        <div class="${K_TILE}"><b class="ax-t-time tabular-nums">00:00</b><small>Tiempo</small></div>
      </div>
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
      if (!confirm('¿Olvidar los botes aprendidos?')) return;
      pots = { 0: 0 }; savePots(); log('Aprendizaje reiniciado.'); paint();
    });
    return sec;
  }

  function paint() {
    if (!panel) return;
    kBadge(panel.querySelector('.k-badge'), running ? 'on' : 'off', running ? 'JUGANDO' : 'LISTO');
    panel.querySelector('[data-ax="go"]').hidden = running;
    panel.querySelector('[data-ax="stop"]').hidden = !running;
    for (const i of panel.querySelectorAll('input')) i.disabled = running;
    const ganado = ses.vales != null && ses.vales0 != null ? ses.vales - ses.vales0 : null;
    kSet(panel.querySelector('.ax-t-games'), String(ses.games));
    kSet(panel.querySelector('.ax-t-vales'), ganado != null ? (ganado >= 0 ? '+' : '') + ganado : (readVales() ?? '–').toString());
    const en = readEnergy();
    kSet(panel.querySelector('.ax-t-en'), en != null ? String(en) : '–');
    kSet(panel.querySelector('.ax-t-time'), ses.t0 ? kTime((running ? Date.now() : ses.t1 || Date.now()) - ses.t0) : '00:00');
    const ks = Object.keys(pots).map(Number).sort((a, b) => a - b);
    kSet(panel.querySelector('.ax-learn'), '💰 Bote tras 0, 1, 2… aciertos: ' + ks.map(k => pots[k]).join(' → '));
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

  // Sale de la ventana de pruebas para no depender de la web
  window.__axSalon = { solve, potAt, readGame };

  esperarHidratacion().then(() => {
    ensurePanel();
    setInterval(ensurePanel, 800);
  });
})();
