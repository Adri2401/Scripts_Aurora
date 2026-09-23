// ==UserScript==
// @name         Aurora Dex · Ruinas Alfa Solver
// @namespace    http://tampermonkey.net/
// @version      1.1.0
// @description  Solver de Ruinas Alfa que se adapta solo a la dificultad (casillas, intentos y letras leídos de la pantalla)
// @match        https://auroradex.es/*
// @match        https://www.auroradex.es/*
// @updateURL    https://gist.github.com/Adri2401/fb20e78d7c97a21333b7521d54ba7c74/raw/Auroradex_ruinasalfa_extremo.user.js
// @downloadURL  https://gist.github.com/Adri2401/fb20e78d7c97a21333b7521d54ba7c74/raw/Auroradex_ruinasalfa_extremo.user.js
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

    let running = false;
    let solving = false;
    // Estado para el panel
    const R = { N: 0, L: 0, letters: '', max: 0, used: 0, remaining: null, phase: 0, guess: [], mode: '', result: '', t0: 0, t1: 0, history: [] };

    // ===================== NÚCLEO (lógica pura, sin DOM) =====================
    // CORE-START
    const sleep = (ms) => new Promise(res => setTimeout(res, ms));

    // Si letras^casillas <= este límite se usa filtrado de candidatos directo.
    // Por encima (p. ej. extremo: 26^5 ≈ 11,8 M) se usa la exploración por grupos.
    const FULL_LIMIT = 300000;

    // Feedback estilo Mastermind con letras como índices numéricos.
    // Devuelve verdes*100 + amarillos.
    function makeFeedback(L) {
        const cs = new Int8Array(L);
        return function (g, s, n) {
            let green = 0, yellow = 0;
            for (let i = 0; i < n; i++) {
                if (g[i] === s[i]) green++; else cs[s[i]]++;
            }
            for (let i = 0; i < n; i++) {
                if (g[i] !== s[i] && cs[g[i]] > 0) { cs[g[i]]--; yellow++; }
            }
            for (let i = 0; i < n; i++) {
                if (g[i] !== s[i]) cs[s[i]] = 0;
            }
            return green * 100 + yellow;
        };
    }

    function createStrategy(letters, N) {
        const L = letters.length;
        const idx = new Map(letters.map((l, i) => [l, i]));
        const fb = makeFeedback(L);
        const fullMode = Math.pow(L, N) <= FULL_LIMIT;
        const groupCount = Math.floor(L / N);
        const groups = [];
        for (let i = 0; i < groupCount; i++) groups.push(letters.slice(i * N, (i + 1) * N));
        const leftover = letters.slice(groupCount * N);

        let noRepeat = false;
        let candidates = null;
        let applied = 0;

        const toRow = (h) => ({ g: h.guess.map(l => idx.get(l)), code: h.green * 100 + h.yellow });

        function consistent(cand, rows) {
            for (let r = 0; r < rows.length; r++) {
                if (fb(rows[r].g, cand, N) !== rows[r].code) return false;
            }
            return true;
        }

        async function build(pool, rows, isRunning) {
            const P = pool.length;
            const res = [];
            if (P === 0) return res;
            const total = Math.pow(P, N);
            const it = new Array(N).fill(0);
            const cand = new Array(N);
            for (let c = 0; c < total; c++) {
                for (let i = 0; i < N; i++) cand[i] = pool[it[i]];
                if ((!noRepeat || new Set(cand).size === N) && consistent(cand, rows)) {
                    res.push(cand.slice());
                }
                let p = N - 1;
                while (p >= 0) {
                    if (++it[p] < P) break;
                    it[p] = 0;
                    p--;
                }
                if ((c & 0xFFFFF) === 0xFFFFF) {
                    await sleep(0);
                    if (!isRunning()) return null;
                }
            }
            return res;
        }

        // Elige, entre los candidatos, el que deja el menor espacio restante esperado
        // (suma de cuadrados de los tamaños de cada posible respuesta).
        const GUESS_CAP = 400;
        const TARGET_CAP = 3000;
        function evenSample(arr, cap) {
            if (arr.length <= cap) return arr;
            const out = [];
            const step = arr.length / cap;
            for (let i = 0; i < cap; i++) out.push(arr[Math.floor(i * step)]);
            return out;
        }
        function pickGuess(cands) {
            if (cands.length <= 2) return cands[0];
            const guesses = evenSample(cands, GUESS_CAP);
            const targets = evenSample(cands, TARGET_CAP);
            const size = N * 100 + N + 1;
            let best = null, bestScore = Infinity;
            const buckets = new Int32Array(size);
            for (let gi = 0; gi < guesses.length; gi++) {
                const g = guesses[gi];
                buckets.fill(0);
                for (let ti = 0; ti < targets.length; ti++) buckets[fb(g, targets[ti], N)]++;
                let score = 0;
                for (let b = 0; b < size; b++) score += buckets[b] * buckets[b];
                if (score < bestScore) { bestScore = score; best = g; }
            }
            return best;
        }

        // history: [{ guess: ['A','B',...], green, yellow }, ...]
        async function next(history, isRunning) {
            const rows = history.map(toRow);
            const explHistory = history.slice(0, groupCount);
            const totalHits = explHistory.reduce((s, h) => s + h.green + h.yellow, 0);
            const exploring = !fullMode && history.length < groupCount && totalHits < N;

            if (exploring) {
                return { guess: groups[history.length], phase: 1 };
            }

            if (candidates === null) {
                let pool;
                if (fullMode) {
                    pool = letters.map((_, i) => i);
                } else {
                    const set = new Set();
                    explHistory.forEach(h => {
                        if (h.green + h.yellow > 0) h.guess.forEach(l => set.add(idx.get(l)));
                    });
                    if (totalHits < N) leftover.forEach(l => set.add(idx.get(l)));
                    pool = Array.from(set);
                }
                const built = await build(pool, rows, isRunning);
                if (built === null) return { aborted: true };
                candidates = built;
                applied = rows.length;
                if (fullMode) {
                    // Prioriza códigos sin letras repetidas (por si alguna dificultad no las admite)
                    const dist = (c) => new Set(c).size;
                    candidates = candidates
                        .map(c => ({ c, d: dist(c) }))
                        .sort((a, b) => b.d - a.d)
                        .map(o => o.c);
                }
                pool = null;
            } else if (applied < rows.length) {
                const fresh = rows.slice(applied);
                candidates = candidates.filter(c => consistent(c, fresh));
                applied = rows.length;
            }

            if (candidates.length === 0) return { error: 'sin candidatos', remaining: 0 };
            const chosen = rows.length === 0 ? candidates[0] : pickGuess(candidates);
            return { guess: chosen.map(i => letters[i]), phase: 2, remaining: candidates.length };
        }

        function forbidRepeats() {
            noRepeat = true;
            if (candidates) candidates = candidates.filter(c => new Set(c).size === N);
        }

        return { next, forbidRepeats, fullMode, groupCount, groups, leftover, isNoRepeat: () => noRepeat };
    }
    // CORE-END

    // ===================== DOM =====================
    function log(msg) {
        console.log(`%c[Ruinas Alfa Solver]%c ${msg}`, 'color: #EF4444; font-weight: bold;', 'color: inherit;');
        kLog(document.querySelector('#ruinas-solver-panel-v2 .ru-log'), msg);
    }

    function isVisible(elem) {
        return !!(elem && (elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length));
    }

    // ¿Está en pantalla el minijuego? (botones de Unown + página de Ruinas Alfa)
    function gameScreenInfo() {
        const unownButtons = document.querySelectorAll('button img[src*="/sprites/unown/"]').length;
        const hasTitle = document.body.innerText.toLowerCase().includes('ruinas alfa');
        const hasProbar = !!findButtonByText('probar código');
        return { unownButtons, hasTitle, hasProbar, ok: unownButtons > 0 && (hasTitle || hasProbar) };
    }

    function isGameScreen() {
        return gameScreenInfo().ok;
    }

    function cleanClick(elem) {
        if (!elem) return;
        elem.click();
    }

    function findButtonByText(text) {
        const buttons = Array.from(document.querySelectorAll('button'));
        const targetText = text.toLowerCase().trim();
        return buttons.find(b => {
            const bText = (b.innerText || b.textContent || '').toLowerCase().replace(/\s+/g, ' ');
            return bText.includes(targetText) && isVisible(b);
        });
    }

    function letterOf(img) {
        return (img.alt || img.src.split('/').pop().replace('.png', '')).toUpperCase();
    }

    function getUnownMap() {
        const buttons = Array.from(document.querySelectorAll('button')).filter(b => b.querySelector('img[src*="/sprites/unown/"]'));
        const map = new Map();
        buttons.forEach(btn => {
            const img = btn.querySelector('img');
            if (img) map.set(letterOf(img), btn);
        });
        return map;
    }

    // Lee "Intento X de Y" y cuenta las casillas del código (el bloque que lo sigue).
    function getAttemptInfo() {
        const el = Array.from(document.querySelectorAll('div')).find(d =>
            d.children.length === 0 && /^Intento\s+\d+\s+de\s+\d+$/i.test((d.textContent || '').trim())
        );
        if (!el) return null;
        const m = el.textContent.trim().match(/(\d+)\s+de\s+(\d+)/i);
        let slots = 0;
        let sib = el.nextElementSibling;
        for (let k = 0; k < 3 && sib; k++, sib = sib.nextElementSibling) {
            if (sib.children.length > 0 && Array.from(sib.children).every(c => c.tagName === 'SPAN')) {
                slots = sib.children.length;
                break;
            }
        }
        return { current: parseInt(m[1], 10), max: parseInt(m[2], 10), slots };
    }

    function getHistoryRows() {
        const historyContainer = document.querySelector('section .space-y-2');
        if (!historyContainer) return [];
        return Array.from(historyContainer.children).filter(el => !el.textContent.includes('Todavía no'));
    }

    // Los círculos pueden venir como rgb(...) (renderizados en cliente) o como #hex (renderizados en servidor).
    const GREEN_RE = /76\s*,\s*194\s*,\s*106|#4cc26a/i;
    const YELLOW_RE = /242\s*,\s*194\s*,\s*48|#f2c230/i;
    function countColored(row, re) {
        return Array.from(row.querySelectorAll('[style]')).filter(el => {
            const st = el.getAttribute('style') || '';
            return re.test(st);
        }).length;
    }

    function parseRow(row) {
        const greens = countColored(row, GREEN_RE);
        const yellows = countColored(row, YELLOW_RE);
        const imgs = Array.from(row.querySelectorAll('img[src*="/sprites/unown/"]'));
        const guess = imgs.map(letterOf);
        return { guess, green: greens, yellow: yellows };
    }

    async function clearInput() {
        let safety = 0;
        while (safety < 15) {
            const btnBorrar = findButtonByText('borrar');
            if (btnBorrar && !btnBorrar.disabled) {
                cleanClick(btnBorrar);
                await sleep(100);
            } else {
                break;
            }
            safety++;
        }
    }

    // Devuelve 'ok' | 'stopped' | 'rejected'
    async function submitGuess(letters) {
        await clearInput();
        const map = getUnownMap();
        for (const letter of letters) {
            if (!running) return 'stopped';
            const btn = map.get(letter);
            if (!btn || btn.disabled) return 'rejected';
            cleanClick(btn);
            await sleep(120);
        }
        await sleep(150);
        if (!running) return 'stopped';
        const btnProbar = findButtonByText('probar código');
        if (!btnProbar || btnProbar.disabled) return 'rejected';
        cleanClick(btnProbar);
        return 'ok';
    }

    // Devuelve 'ok' | 'screen' | 'timeout' | 'stopped'
    async function waitForNewRow(prevCount) {
        let ticks = 0;
        while (getHistoryRows().length === prevCount && ticks < 30) {
            if (!running) return 'stopped';
            if (!isGameScreen()) return 'screen';
            await sleep(200);
            ticks++;
        }
        if (getHistoryRows().length === prevCount) return isGameScreen() ? 'timeout' : 'screen';
        return 'ok';
    }

    async function solveInner() {
        log('Iniciando resolución...');
        const unownMap = getUnownMap();
        if (unownMap.size === 0) {
            log('Error: no se han detectado botones de Unown.');
            return;
        }

        await clearInput();

        const info = getAttemptInfo();
        let N = info && info.slots ? info.slots : 0;
        let maxAttempts = info && info.max ? info.max : 0;
        if (!N) {
            N = 5;
            log('⚠️ No pude leer el nº de casillas; uso 5 (valor del script extremo).');
        }
        if (!maxAttempts) {
            maxAttempts = 12;
            log('⚠️ No pude leer el máximo de intentos; uso 12 (valor del script extremo).');
        }

        const letters = Array.from(unownMap.keys()).sort();
        const strat = createStrategy(letters, N);
        Object.assign(R, { N, L: letters.length, letters: letters.join(''), max: maxAttempts, mode: strat.fullMode ? 'filtrado directo' : 'exploración por grupos', result: '', remaining: null, phase: 0, guess: [] });
        updateUI();
        log(`Detectado: ${N} casillas, ${letters.length} letras (${letters.join('')}), ${maxAttempts} intentos → modo ${strat.fullMode ? 'filtrado directo' : 'exploración por grupos'}.`);

        while (running) {
            const history = getHistoryRows().map(parseRow);
            const attemptsMade = history.length;
            R.used = attemptsMade;
            R.history = history;
            updateUI();

            const bad = history.find(h => h.guess.length !== N || h.guess.some(l => !letters.includes(l)));
            if (bad) {
                log(`Error: no pude leer bien una fila del historial (letras leídas: ${bad.guess.join('') || 'ninguna'}, esperaba ${N}).`);
                break;
            }

            if (attemptsMade > 0 && history[attemptsMade - 1].green === N) {
                log('🎉 ¡CÓDIGO RESUELTO!');
                R.result = 'ok';
                kAviso('Ruinas Alfa: ¡código resuelto!');
                break;
            }

            if (attemptsMade >= maxAttempts) {
                log('❌ Fin de los intentos.');
                R.result = 'fail';
                break;
            }

            const step = await strat.next(history, () => running);
            if (step.aborted) break;
            if (step.error) {
                log('Error: no se encontró ninguna combinación compatible. Si hiciste intentos a mano antes, prueba con una partida nueva.');
                break;
            }

            if (step.phase === 1) {
                log(`[Fase 1 - Intento ${attemptsMade + 1}/${maxAttempts}] Grupo: ${step.guess.join('-')}`);
            } else {
                log(`[Fase 2 - Intento ${attemptsMade + 1}/${maxAttempts}] Candidatos: ${step.remaining} → Probando: ${step.guess.join('-')}`);
            }

            R.phase = step.phase; R.remaining = step.remaining ?? null; R.guess = step.guess;
            updateUI();
            const hasRepeats = new Set(step.guess).size < step.guess.length;
            const sent = await submitGuess(step.guess);
            if (sent === 'stopped') break;

            let ok = sent === 'ok';
            if (ok) {
                const waited = await waitForNewRow(attemptsMade);
                if (waited === 'stopped') break;
                if (waited === 'screen') {
                    log('La pantalla ha cambiado (posible fin de partida).');
                    break;
                }
                ok = waited === 'ok';
            }

            if (!ok) {
                if (hasRepeats && !strat.isNoRepeat()) {
                    log('El juego no aceptó un código con letras repetidas → pruebo solo códigos sin repetidas.');
                    strat.forbidRepeats();
                    continue;
                }
                log('No se pudo introducir o enviar el código (botón no disponible o sin respuesta de la app).');
                break;
            }
        }
    }

    async function solve() {
        if (solving) return;
        solving = true;
        try {
            await solveInner();
        } catch (e) {
            log('Error inesperado: ' + (e && e.message ? e.message : e));
        } finally {
            running = false;
            solving = false;
            updateUI();
        }
    }

    // ===================== UI =====================
    const PANEL = 'ruinas-solver-panel-v2';
    const UP = '#' + PANEL;
    const enRuinas = () => /^\/ruinas/i.test(location.pathname);

    function createUI() {
        if (document.getElementById(PANEL)) return;
        kStyle('ruinas-kit', UP);
        if (!document.getElementById('ruinas-css')) {
            const st = document.createElement('style');
            st.id = 'ruinas-css';
            st.textContent = `
              ${UP}.ru-float{position:fixed;right:12px;bottom:calc(var(--nav-alto,4rem) + 1rem + env(safe-area-inset-bottom,0px));z-index:2147483000;width:min(360px,calc(100vw - 1.5rem))}
              ${UP} .ru-code{display:flex;gap:4px;justify-content:center;min-height:36px}
              ${UP} .ru-code img{width:32px;height:32px;image-rendering:pixelated}
              ${UP} .ru-code span{width:32px;height:32px;display:grid;place-items:center;font-weight:800}`;
            document.head.appendChild(st);
        }
        const panel = document.createElement('section');
        panel.id = PANEL;
        panel.className = 'tarjeta space-y-3 p-3';
        panel.innerHTML = `
          ${kHead('👁️', 'Ruinas Alfa · Solver', 'Abre una partida para empezar')}
          <div class="ru-info k-tiles" style="--k-cols:3">
            <div class="${K_TILE}"><b class="ru-t-n tabular-nums">–</b><small>Casillas</small></div>
            <div class="${K_TILE}"><b class="ru-t-l tabular-nums">–</b><small>Letras</small></div>
            <div class="${K_TILE}"><b class="ru-t-c tabular-nums">–</b><small>Posibles</small></div>
          </div>
          <div>
            <div class="mb-1 flex items-baseline justify-between text-[11px] font-extrabold text-tinta-500">
              <span>🔢 Intentos</span><span class="ru-int-t tabular-nums">0 / –</span>
            </div>
            <div class="${K_BAR}"><span class="ru-bar" style="width:0%;background-color:#F2B632"></span></div>
          </div>
          <div class="ru-next rounded-card border-2 border-crema-200 bg-crema-50 p-2" hidden>
            <p class="mb-1 text-center text-[11px] font-extrabold text-tinta-500 ru-next-t">Siguiente código</p>
            <div class="ru-code"></div>
          </div>
          <button type="button" class="ru-btn boton-principal w-full">🔥 Resolver</button>
          <div class="ru-log ${K_LOG}"></div>`;
        panel.querySelector('.ru-btn').addEventListener('click', () => {
            running = !running;
            if (running) {
                R.t0 = Date.now(); R.t1 = 0;
                const box = panel.querySelector('.ru-log'); if (box) box.innerHTML = '';
                try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); } catch { /* nada */ }
            }
            updateUI();
            if (running) solve();
        });
        placePanel(panel);
    }

    // Debajo de la tarjeta del juego (la que tiene «Probar código»); si no, flotante
    function placePanel(panel) {
        const probar = findButtonByText('probar código');
        const sec = probar && probar.closest('section');
        if (sec && sec.parentElement) {
            panel.classList.remove('ru-float');
            if (sec.nextElementSibling !== panel) sec.insertAdjacentElement('afterend', panel);
        } else {
            const main = document.querySelector('main');
            if (main) {
                panel.classList.remove('ru-float');
                if (panel.parentElement !== main || main.lastElementChild !== panel) main.appendChild(panel);
            } else if (!panel.isConnected || !panel.classList.contains('ru-float')) {
                panel.classList.add('ru-float');
                document.body.appendChild(panel);
            }
        }
    }

    function unownImg(letter) {
        const b = getUnownMap().get(letter);
        const img = b && b.querySelector('img');
        return img ? img.getAttribute('src') : null;
    }

    function updateUI() {
        const panel = document.getElementById(PANEL);
        if (!panel) return;
        const info = gameScreenInfo();

        let badge = ['off', 'LISTO'];
        if (running) badge = ['on', R.phase === 1 ? 'EXPLORANDO' : 'RESOLVIENDO'];
        else if (R.result === 'ok') badge = ['ok', 'RESUELTO'];
        else if (R.result === 'fail') badge = ['err', 'SIN INTENTOS'];
        else if (!info.ok) badge = ['off', 'SIN PARTIDA'];
        kBadge(panel.querySelector('.k-badge'), badge[0], badge[1]);

        kSet(panel.querySelector('.k-sub'),
            R.N ? `${R.mode}${R.t0 ? ' · ' + kTime((running ? Date.now() : R.t1 || Date.now()) - R.t0) : ''}`
                : info.ok ? 'Partida detectada · pulsa Resolver' : 'Abre una partida para empezar');
        const at0 = R.N ? null : getAttemptInfo();
        kSet(panel.querySelector('.ru-t-n'), R.N ? String(R.N) : at0 && at0.slots ? String(at0.slots) : '–');
        kSet(panel.querySelector('.ru-t-l'), R.L ? String(R.L) : info.unownButtons ? String(info.unownButtons) : '–');
        kSet(panel.querySelector('.ru-t-c'), R.remaining != null ? R.remaining.toLocaleString('es-ES') : R.phase === 1 ? '…' : '–');

        const at = getAttemptInfo();
        const max = R.max || (at && at.max) || 0;
        const used = running || R.result ? R.used : at ? Math.max(0, at.current - 1) : 0;
        kSet(panel.querySelector('.ru-int-t'), `${used} / ${max || '–'}`);
        const bar = panel.querySelector('.ru-bar');
        if (bar) {
            bar.style.width = (max ? Math.min(100, used / max * 100) : 0) + '%';
            bar.style.backgroundColor = R.result === 'ok' ? '#2FA84F' : used / (max || 1) > 0.75 ? '#E0473A' : '#F2B632';
        }

        const next = panel.querySelector('.ru-next');
        next.hidden = !(running && R.guess && R.guess.length);
        if (!next.hidden) {
            kSet(panel.querySelector('.ru-next-t'), R.phase === 1 ? 'Probando grupo de letras' : 'Probando código');
            const code = panel.querySelector('.ru-code');
            const key = R.guess.join('');
            if (code.dataset.k !== key) {
                code.dataset.k = key;
                code.innerHTML = R.guess.map(l => {
                    const src = unownImg(l);
                    return src ? `<img src="${kEsc(src)}" alt="${kEsc(l)}" title="${kEsc(l)}">` : `<span class="rounded-card border-2 border-crema-200">${kEsc(l)}</span>`;
                }).join('');
            }
        }

        const btn = panel.querySelector('.ru-btn');
        const cls = running ? 'ru-btn boton-secundario w-full' : 'ru-btn boton-principal w-full';
        if (btn.className !== cls) btn.className = cls;
        btn.disabled = !running && !info.ok;
        kSet(btn, running ? '■ Detener' : R.result ? '🔥 Resolver otra' : '🔥 Resolver');
    }

    log('Script cargado. Esperando la pantalla del minijuego…');
    let lastState = null;

    esperarHidratacion().then(() => setInterval(() => {
        // Ahora corre en toda la web (la navegación es de SPA): solo pinta en /ruinas
        if (!enRuinas()) {
            const p = document.getElementById(PANEL);
            if (p) p.remove();
            if (running) running = false;
            return;
        }
        createUI();
        const panel = document.getElementById(PANEL);
        if (!panel) return;
        placePanel(panel);

        const info = gameScreenInfo();
        if (!info.ok && running) running = false;
        if (!running && R.t0 && !R.t1) R.t1 = Date.now();
        updateUI();

        const st = `${info.ok}|${info.unownButtons}|${info.hasTitle}|${info.hasProbar}`;
        if (st !== lastState) {
            lastState = st;
            console.log('[Ruinas Alfa Solver] pantalla:', st);
        }
    }, 500));
})();
