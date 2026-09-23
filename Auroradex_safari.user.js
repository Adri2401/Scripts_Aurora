// ==UserScript==
// @name         Aurora Dex · Safari Auto
// @namespace    http://tampermonkey.net/
// @version      1.1.0
// @description  Panel integrado con dos modos: spam de Balls y estrategia adaptativa (Cebo/Roca/Ball/Dejar marchar) calculada con los porcentajes reales de cada encuentro. Vale para cualquier Safari y cualquier Pokémon.
// @match        https://auroradex.es/*
// @match        https://www.auroradex.es/*
// @updateURL    https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_safari.user.js
// @downloadURL  https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_safari.user.js
// @run-at       document-idle
// @grant        none
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


  /* ------------------------------------------------------------------ *
   *  CONFIG
   * ------------------------------------------------------------------ */
  const CFG = {
    delayMin: 550,
    delayMax: 1000,
    maxPrep: 3,
    maxRock: 2,
    maxBait: 2,
    autoEnter: true,
    letGoEnabled: true,
    defRock: { pm: 1.50, qm: 1.80 },
    defBait: { pm: 0.85, qm: 0.50 },
    defEncRate: 0.75,
    defAvgP: 0.40,
    mountDelay: 1200,   // espera a que React termine de hidratar antes de tocar el DOM
  };

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

  const LS_KEY = 'ax_safari_learn_v1';
  const PANEL_ID = 'ax-safari-auto';

  /* ------------------------------------------------------------------ *
   *  UTILIDADES
   * ------------------------------------------------------------------ */
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const txt = (el) => (el && el.textContent ? el.textContent.replace(/\s+/g, ' ').trim() : '');
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const rndDelay = () => CFG.delayMin + Math.random() * (CFG.delayMax - CFG.delayMin);
  const clampP = (x) => Math.min(0.97, Math.max(0.01, x));

  // Los botones son <button><span>Ball</span><span>quedan 31</span></button>.
  // textContent los pega sin espacio ("Ballquedan 31"), así que unimos hijo a hijo.
  function btnText(b) {
    if (!b) return '';
    let s = '';
    b.childNodes.forEach((n) => { s += ' ' + (n.textContent || ''); });
    return s.replace(/\s+/g, ' ').trim();
  }

  function findBtn(re, includeDisabled) {
    return $$('button').find((b) => (includeDisabled || !b.disabled) && re.test(btnText(b)));
  }

  function isSafariPage() {
    if (!/\/safari/i.test(location.pathname)) return false;
    const main = document.querySelector('main.contenedor-app');
    if (!main) return false;
    const t = txt(main);
    return /Safari|Pantano/i.test(t) && /Pasos|Balls|Entrar/i.test(t);
  }

  /* ------------------------------------------------------------------ *
   *  LECTURA DEL DOM
   * ------------------------------------------------------------------ */
  function statByLabel(label) {
    const p = $$('p').find((x) => txt(x).toLowerCase() === label.toLowerCase());
    if (!p || !p.nextElementSibling) return null;
    const m = txt(p.nextElementSibling).match(/-?\d+/);
    return m ? parseInt(m[0], 10) : null;
  }

  function pctByLabel(label) {
    const s = $$('span').find((x) => txt(x) === label);
    if (!s || !s.parentElement) return null;
    const m = txt(s.parentElement).match(/(\d+)\s*%/);
    return m ? parseInt(m[1], 10) / 100 : null;
  }

  function encounterSection() {
    const ball = findBtn(/^Ball\s/i) || findBtn(/^Ball$/i);
    if (!ball) return null;
    return ball.closest('section') || ball.parentElement.parentElement;
  }

  function readState() {
    const st = {
      screen: 'desconocida',
      steps: statByLabel('Pasos'),
      balls: statByLabel('Balls'),
      caught: statByLabel('Atrapados'),
      p: null, q: null, name: null, level: '', shiny: false, msg: '',
    };

    const msgEl = $$('p.tarjeta').find((x) => /text-center/.test(x.className || ''));
    if (msgEl) st.msg = txt(msgEl);

    if (findBtn(/Se acabó/i, true)) { st.screen = 'fin'; return st; }

    const sec = encounterSection();
    if (sec) {
      st.screen = 'encuentro';
      st.p = pctByLabel('Lo atrapas');
      st.q = pctByLabel('Se te escapa');
      const nameEl = sec.querySelector('p.font-display');
      st.name = nameEl ? txt(nameEl) : '?';
      const lvlEl = $$('p', sec).find((x) => /^Nv\./i.test(txt(x)));
      st.level = lvlEl ? txt(lvlEl) : '';
      const img = sec.querySelector('img');
      st.shiny = /✨|variocolor|shiny/i.test(txt(sec)) ||
                 (!!img && /shiny|vario/i.test((img.className || '') + ' ' + (img.src || '')));
      const bm = btnText(findBtn(/^Ball\s/i)).match(/quedan\s+(\d+)/i);
      if (bm) st.balls = parseInt(bm[1], 10);
      return st;
    }

    if (findBtn(/^Andar/i)) { st.screen = 'andar'; return st; }
    if (findBtn(/^Entrar/i)) { st.screen = 'entrada'; return st; }
    return st;
  }

  /* ------------------------------------------------------------------ *
   *  APRENDIZAJE (mide el efecto real de Cebo y Roca en tu servidor)
   * ------------------------------------------------------------------ */
  function freshLearn() {
    return {
      rock: { pm: CFG.defRock.pm, qm: CFG.defRock.qm, n: 0 },
      bait: { pm: CFG.defBait.pm, qm: CFG.defBait.qm, n: 0 },
      risk: { rock: { base: 0, flee: 0, n: 0 }, bait: { base: 0, flee: 0, n: 0 } },
      enc:  { steps: 0, found: 0, sumP: 0, nP: 0 },
    };
  }
  let L = freshLearn();
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) L = Object.assign(freshLearn(), JSON.parse(raw));
  } catch (e) { /* ignore */ }
  const saveLearn = () => { try { localStorage.setItem(LS_KEY, JSON.stringify(L)); } catch (e) {} };

  function learnEffect(kind, before, after) {
    const m = L[kind];
    const pm = clampP(after.p) / Math.max(0.01, before.p);
    const qm = clampP(after.q) / Math.max(0.01, before.q);
    const w = Math.min(0.35, 1 / (m.n + 2));
    m.pm = m.pm * (1 - w) + pm * w;
    m.qm = m.qm * (1 - w) + qm * w;
    m.n++;
    saveLearn();
  }

  function riskFor(kind, qBefore, qAfter) {
    const base = Math.max(0.01, (qBefore + qAfter) / 2);
    const r = L.risk[kind];
    if (r.n >= 6 && r.base > 0) {
      const emp = r.flee / r.n;
      const exp = r.base / r.n;
      const mult = Math.min(2.5, Math.max(0.4, emp / Math.max(0.01, exp)));
      const shrink = Math.min(1, r.n / 20);
      return Math.min(0.9, base * (1 + (mult - 1) * shrink));
    }
    return Math.min(0.9, base);
  }

  function noteRisk(kind, base, fled) {
    const r = L.risk[kind];
    r.base += base; r.flee += fled ? 1 : 0; r.n++;
    saveLearn();
  }

  const encRate = () => (L.enc.steps >= 15 ? Math.max(0.3, L.enc.found / L.enc.steps) : CFG.defEncRate);
  const avgP    = () => (L.enc.nP >= 8 ? L.enc.sumP / L.enc.nP : CFG.defAvgP);

  /* ------------------------------------------------------------------ *
   *  DECISIÓN
   *    P(captura solo Balls) = p/(p+q)   ·   E[Balls] = 1/(p+q)
   *    score = P(captura) − λ·E[Balls],  λ = coste de oportunidad de una Ball
   * ------------------------------------------------------------------ */
  function lambdaFor(balls, steps, shiny) {
    if (shiny) return 0;
    const encLeft = Math.max(0.5, (steps || 0) * encRate());
    const bpe = (balls || 0) / encLeft;
    return Math.max(0, Math.min(0.45, 0.45 * (1 - bpe / 3)));
  }

  function simulate(p, q, prep, lambda) {
    let surv = 1, cp = p, cq = q;
    for (const a of prep) {
      const m = a === 'rock' ? L.rock : L.bait;
      const np = clampP(cp * m.pm);
      const nq = clampP(cq * m.qm);
      surv *= (1 - riskFor(a, cq, nq));
      cp = np; cq = nq;
      const tot = cp + cq;
      if (tot > 0.99) { const k = 0.99 / tot; cp *= k; cq *= k; }
    }
    const tot = Math.max(0.02, cp + cq);
    const pCatch = surv * (cp / tot);
    const eBalls = surv * (1 / tot);
    return { prep, pCatch, eBalls, score: pCatch - lambda * eBalls };
  }

  function bestPlan(st) {
    const lambda = lambdaFor(st.balls, st.steps, st.shiny);
    const plans = [[]];
    for (let r = 1; r <= CFG.maxRock; r++) plans.push(Array(r).fill('rock'));
    for (let b = 1; b <= CFG.maxBait; b++) plans.push(Array(b).fill('bait'));
    plans.push(['rock', 'bait'], ['bait', 'rock']);
    let best = null;
    for (const pr of plans) {
      if (pr.length > CFG.maxPrep) continue;
      const s = simulate(st.p, st.q, pr, lambda);
      if (!best || s.score > best.score) best = s;
    }
    best.lambda = lambda;
    return best;
  }

  /* ------------------------------------------------------------------ *
   *  BUCLE
   * ------------------------------------------------------------------ */
  let running = false, mode = null, ticking = false, idleTicks = 0;
  // Estadísticas de la sesión para el panel
  let ses = { t0: 0, t1: 0, enc: 0, ball: 0, rock: 0, bait: 0, go: 0, caught0: null, caught: null, shiny: 0 };
  let ultimo = null;   // último encuentro visto: { name, level, p, q, plan, shiny }
  let enc = { key: null, rock: 0, bait: 0, lastAction: null, before: null };

  function newEncounter(st) {
    enc = { key: st.name + '|' + st.level, rock: 0, bait: 0, lastAction: null, before: null };
    ses.enc++;
    if (st.shiny) {
      ses.shiny++;
      kAviso(`¡${st.name} SHINY en el Safari!`);
    }
    L.enc.found++;
    if (st.p != null) { L.enc.sumP += st.p; L.enc.nP++; }
    saveLearn();
  }

  function stop(reason) {
    if (running) ses.t1 = Date.now();
    running = false; mode = null;
    if (reason) log(reason);
    paint();
  }

  function clickAct(kind, st) {
    const map = { ball: /^Ball/i, bait: /^Cebo/i, rock: /^Roca/i, go: /Dejarlo marchar/i };
    const b = findBtn(map[kind]);
    if (!b) { stop('No encuentro el botón "' + kind + '".'); return; }
    if (st && kind !== 'go') { enc.lastAction = kind; enc.before = { p: st.p, q: st.q, name: st.name }; }
    ses[kind] = (ses[kind] || 0) + 1;
    b.click();
  }

  async function tick() {
    if (!running || ticking) return;
    ticking = true;
    try {
      const st = readState();
      if (st.caught != null) { if (ses.caught0 == null) ses.caught0 = st.caught; ses.caught = st.caught; }
      if (st.screen === 'encuentro') ultimo = { name: st.name, level: st.level, p: st.p, q: st.q, shiny: st.shiny, plan: null };

      // resolver el resultado de la última preparación (Cebo/Roca)
      if (enc.lastAction && enc.before) {
        if (st.screen === 'encuentro' && st.name === enc.before.name && st.p != null) {
          if (enc.lastAction !== 'ball') {
            learnEffect(enc.lastAction, enc.before, st);
            noteRisk(enc.lastAction, (enc.before.q + st.q) / 2, false);
          }
        } else if (st.screen !== 'encuentro') {
          if (enc.lastAction !== 'ball' && /escurre|se larga|huy|escap/i.test(st.msg)) {
            noteRisk(enc.lastAction, enc.before.q, true);
          }
        }
        enc.lastAction = null; enc.before = null;
      }

      if (st.screen === 'fin') { stop('Se acabó. Atrapados: ' + (st.caught ?? '?')); return; }

      if (st.screen === 'entrada') {
        if (!CFG.autoEnter) { stop('Estás en la entrada.'); return; }
        log('Entrando…');
        findBtn(/^Entrar/i).click();
        return;
      }

      if (st.screen === 'andar') {
        idleTicks = 0;
        if (st.balls === 0) { stop('Sin Balls. Toca salir.'); return; }
        enc.key = null;
        L.enc.steps++; saveLearn();
        log('Andando · ' + (st.steps ?? '?') + ' pasos · ' + (st.balls ?? '?') + ' Balls');
        findBtn(/^Andar/i).click();
        return;
      }

      if (st.screen === 'encuentro') {
        idleTicks = 0;
        if (enc.key !== st.name + '|' + st.level) newEncounter(st);

        if (st.p == null || st.q == null) { log('No leo los %; lanzo Ball.'); clickAct('ball', null); return; }

        if (mode === 'spam') {
          log(`${st.name} · ${Math.round(st.p * 100)}% · Ball (${st.balls})`);
          clickAct('ball', st);
          return;
        }

        const plan = bestPlan(st);
        if (ultimo) ultimo.plan = plan;
        const tag = st.shiny ? '✨ ' : '';
        const head = `${tag}${st.name} ${Math.round(st.p * 100)}/${Math.round(st.q * 100)}`;

        if (CFG.letGoEnabled && !st.shiny && plan.score <= 0.02 && (st.steps || 0) >= 2) {
          log(`${head} · no compensa → marchar`);
          clickAct('go', st);
          return;
        }

        let next = plan.prep[0] || null;
        if (next === 'rock' && enc.rock >= CFG.maxRock) next = null;
        if (next === 'bait' && enc.bait >= CFG.maxBait) next = null;
        if (enc.rock + enc.bait >= CFG.maxPrep) next = null;

        const info = `${head} · P≈${Math.round(plan.pCatch * 100)}% ~${plan.eBalls.toFixed(1)}b`;
        if (next === 'rock') { log(info + ' → Roca'); enc.rock++; clickAct('rock', st); return; }
        if (next === 'bait') { log(info + ' → Cebo'); enc.bait++; clickAct('bait', st); return; }
        log(info + ' → Ball');
        clickAct('ball', st);
        return;
      }

      // pantalla no reconocida
      idleTicks++;
      const vistos = $$('button').map(btnText).filter(Boolean).slice(0, 4).join(' | ');
      log('Esperando… (botones: ' + (vistos || 'ninguno') + ')');
      if (idleTicks > 12) stop('No reconozco la pantalla. Parado.');
    } catch (e) {
      console.error('[SafariAuto]', e);
      stop('Error: ' + e.message);
    } finally {
      ticking = false;
      paint();
    }
  }

  async function loop() {
    while (running) {
      await tick();
      await sleep(rndDelay());
    }
  }

  function start(which) {
    if (!isSafariPage() || running) return;
    mode = which; running = true; idleTicks = 0;
    ses = { t0: Date.now(), t1: 0, enc: 0, ball: 0, rock: 0, bait: 0, go: 0, caught0: null, caught: null, shiny: 0 };
    ultimo = null;
    try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); } catch { /* nada */ }
    log(which === 'spam' ? 'Modo Balls a saco.' : 'Modo estrategia.');
    paint();
    loop();
  }

  /* ------------------------------------------------------------------ *
   *  PANEL
   * ------------------------------------------------------------------ */
  const UP = '#' + PANEL_ID;
  let panel = null, logEl = null;
  let logLine = 'Anda solo y decide con los % reales de cada encuentro.';

  function buildPanel() {
    kStyle('ax-safari-kit', UP);
    const sec = document.createElement('section');
    sec.id = PANEL_ID;
    sec.className = 'tarjeta space-y-3 p-3';
    sec.setAttribute('data-ax-ignore', '1');
    sec.innerHTML = `
      ${kHead('🌾', 'Safari · Automático', 'Elige un modo para empezar')}
      <div class="ax-modes k-seg">
        <button type="button" data-ax="spam"><span>🎯</span><span>Solo Balls</span><span class="text-[10px] font-bold opacity-70">rápido y directo</span></button>
        <button type="button" data-ax="smart"><span>🧠</span><span>Estrategia</span><span class="text-[10px] font-bold opacity-70">Cebo · Roca · Ball</span></button>
      </div>
      <button type="button" class="boton-secundario w-full" data-ax="stop" hidden>■ Parar</button>
      <div class="ax-enc flex items-center gap-2 rounded-card border-2 border-crema-200 bg-crema-50 p-2" hidden>
        <div class="min-w-0 flex-1">
          <p class="ax-enc-n truncate text-sm font-extrabold leading-tight"></p>
          <p class="ax-enc-d truncate text-[11px] font-bold text-tinta-400"></p>
        </div>
        <div class="text-right">
          <p class="ax-enc-p font-display text-base font-extrabold leading-tight text-hoja-700 tabular-nums"></p>
          <p class="text-[9px] font-extrabold uppercase opacity-70">captura</p>
        </div>
      </div>
      <div class="k-tiles">
        <div class="${K_TILE}"><b class="ax-t-steps tabular-nums">–</b><small>Pasos</small></div>
        <div class="${K_TILE}"><b class="ax-t-balls tabular-nums">–</b><small>Balls</small></div>
        <div class="${K_TILE}"><b class="ax-t-caught tabular-nums">0</b><small>Atrapados</small></div>
        <div class="${K_TILE}"><b class="ax-t-time tabular-nums">00:00</b><small>Tiempo</small></div>
      </div>
      <p class="ax-ses text-center text-[11px] font-bold text-tinta-400 tabular-nums"></p>
      <p class="rounded-card border-2 border-crema-200 bg-crema-50 p-2 text-center text-[11px] font-bold text-tinta-600" data-ax="log"></p>
      <details class="rounded-card border-2 border-crema-200 bg-crema-50">
        <summary class="cursor-pointer list-none p-2 text-[11px] font-extrabold text-tinta-500">📈 Lo aprendido en tu Safari ▾</summary>
        <div class="space-y-1 px-2 pb-2 text-[11px] font-semibold text-tinta-500">
          <p class="ax-learn-rock"></p><p class="ax-learn-bait"></p><p class="ax-learn-enc"></p>
          <button type="button" class="boton-suave w-full !py-2 text-[11px]" data-ax="reset">Olvidar lo aprendido</button>
        </div>
      </details>`;
    logEl = sec.querySelector('[data-ax="log"]');
    logEl.textContent = logLine;
    const on = (sel, fn) => sec.querySelector(sel).addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); fn(); });
    on('[data-ax="spam"]', () => start('spam'));
    on('[data-ax="smart"]', () => start('smart'));
    on('[data-ax="stop"]', () => stop('Parado a mano.'));
    on('[data-ax="reset"]', () => {
      if (!confirm('¿Olvidar lo aprendido sobre Cebo, Roca y encuentros?')) return;
      L = freshLearn(); saveLearn(); log('Aprendizaje reiniciado.'); paint();
    });
    return sec;
  }

  function log(s) { logLine = s; if (logEl) logEl.textContent = s; }

  const pct = x => (x == null ? '–' : Math.round(x * 100) + '%');

  function paint() {
    if (!panel) return;
    const st = isSafariPage() ? readState() : null;
    kBadge(panel.querySelector('.k-badge'), running ? 'on' : 'off',
      running ? (mode === 'spam' ? 'BALLS' : 'ESTRATEGIA') : st && st.screen === 'fin' ? 'TERMINADO' : 'LISTO');
    const tiempo = ses.t0 ? kTime((running ? Date.now() : ses.t1 || Date.now()) - ses.t0) : '00:00';
    kSet(panel.querySelector('.k-sub'), running ? (mode === 'spam' ? 'Lanza Ball a todo lo que salga' : 'Decide Cebo/Roca/Ball/Dejar con los %')
      : 'Elige un modo para empezar');

    for (const b of panel.querySelectorAll('.ax-modes > button')) {
      const activo = running && mode === b.dataset.ax;
      const cls = activo ? K_ON : K_OFF;
      if (b.className !== cls) b.className = cls;
      b.disabled = running && !activo;
    }
    panel.querySelector('[data-ax="stop"]').hidden = !running;

    kSet(panel.querySelector('.ax-t-steps'), st && st.steps != null ? String(st.steps) : '–');
    kSet(panel.querySelector('.ax-t-balls'), st && st.balls != null ? String(st.balls) : '–');
    const caught = ses.caught != null && ses.caught0 != null ? ses.caught - ses.caught0 : 0;
    kSet(panel.querySelector('.ax-t-caught'), ses.t0 ? '+' + caught : st && st.caught != null ? String(st.caught) : '0');
    kSet(panel.querySelector('.ax-t-time'), tiempo);
    kSet(panel.querySelector('.ax-ses'), ses.t0
      ? `Encuentros ${ses.enc} · Balls ${ses.ball} · Rocas ${ses.rock} · Cebos ${ses.bait} · Dejados ${ses.go}${ses.shiny ? ' · ✨' + ses.shiny : ''}`
      : '');

    const box = panel.querySelector('.ax-enc');
    box.hidden = !(running && ultimo);
    if (!box.hidden) {
      kSet(panel.querySelector('.ax-enc-n'), `${ultimo.shiny ? '✨ ' : ''}${ultimo.name || '?'} ${ultimo.level || ''}`.trim());
      const pl = ultimo.plan;
      kSet(panel.querySelector('.ax-enc-d'), `Atrapa ${pct(ultimo.p)} · Huye ${pct(ultimo.q)}${pl ? ` · ~${pl.eBalls.toFixed(1)} Balls` : ''}`);
      kSet(panel.querySelector('.ax-enc-p'), pl ? pct(pl.pCatch) : pct(ultimo.p));
    }

    kSet(panel.querySelector('.ax-learn-rock'), `🪨 Roca: captura ×${L.rock.pm.toFixed(2)} · huida ×${L.rock.qm.toFixed(2)} (${L.rock.n} medidas)`);
    kSet(panel.querySelector('.ax-learn-bait'), `🍓 Cebo: captura ×${L.bait.pm.toFixed(2)} · huida ×${L.bait.qm.toFixed(2)} (${L.bait.n} medidas)`);
    kSet(panel.querySelector('.ax-learn-enc'), `👣 Encuentro cada ${(1 / encRate()).toFixed(1)} pasos · captura media ${pct(avgP())}`);
  }
  setInterval(() => { if (running) paint(); }, 1000);

  // El panel va justo ENCIMA de la tarjeta "En el saco".
  function anchorPoint(main) {
    const saco = $$('h2, p', main).find((h) => /^En el saco$/i.test(txt(h)) && !h.closest('#' + PANEL_ID));
    if (saco) {
      const card = saco.closest('section') || saco.parentElement;
      if (card && card.parentElement === main) return card;
    }
    const divider = $$(':scope > div', main).find((d) => /border-dashed/.test(d.className || ''));
    return divider || null;   // null = al final del main
  }

  function ensurePanel() {
    const main = document.querySelector('main.contenedor-app');
    if (!isSafariPage() || !main) {
      if (panel && panel.parentElement) panel.remove();
      if (running) stop('Fuera del Safari. Parado.');
      return;
    }
    if (!panel) { panel = buildPanel(); paint(); }
    const ref = anchorPoint(main);
    if (ref) {
      if (panel.nextElementSibling !== ref || panel.parentElement !== main) main.insertBefore(panel, ref);
    } else if (panel.parentElement !== main || panel.nextElementSibling) {
      main.appendChild(panel);
    }
  }

  // Montar solo cuando React ya ha hidratado, para no romper la página.
  function boot() {
    ensurePanel();
    setInterval(ensurePanel, 800);
  }
  esperarHidratacion().then(boot);
})();