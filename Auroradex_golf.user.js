// ==UserScript==
// @name         Aurora Dex · Golf (hoyo en el mínimo de golpes)
// @namespace    auroradex-golf
// @version      1.0.0
// @description  Solo en /golf. Calcula con la física del propio juego el tiro (ángulo y fuerza) que mete la bola en el mínimo de golpes y lo tira solo.
// @match        https://auroradex.es/*
// @match        https://www.auroradex.es/*
// @updateURL    https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_golf.user.js
// @downloadURL  https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_golf.user.js
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

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const PANEL_ID = 'axgolf-panel';

  /* ------------------------------------------------------------------ *
   *  FÍSICA (la misma que usa el juego)
   *  Casillas: '#' pared (rebota), '.' césped, 'S' salida (césped), '~' agua (la bola vuelve a donde estaba),
   *  'o' arena (frena ×3), 'i' hielo (frena ×1/3), '>' '<' '^' 'v' impulsores (cambian la dirección), 'H' hoyo.
   *  La bola avanza a pasos de 0,05 casillas y cada paso gasta 0,05 × lo que frene la casilla donde está.
   * ------------------------------------------------------------------ */
  const IMPULSO = { '>': [1, 0], '<': [-1, 0], '^': [0, -1], v: [0, 1] };
  const FRENO = { o: 3, i: 1 / 3 };
  const POTENCIAS = []; for (let p = 1; p <= 12; p += 0.5) POTENCIAS.push(p);

  function nivelDe(filas) { return { ancho: filas[0].length, alto: filas.length, filas }; }
  function casilla(n, x, y) {
    if (x < 0 || y < 0 || x >= n.ancho || y >= n.alto) return '#';
    const s = n.filas[y][x];
    return s === 'S' ? '.' : s;
  }

  // Copia exacta del tiro del juego: devuelve { final, evento: 'hoyo' | 'agua' | 'parada' }
  function tiroExacto(n, pos, angulo, potencia) {
    const rad = angulo * Math.PI / 180;
    let dx = Math.cos(rad), dy = Math.sin(rad), x = pos.x, y = pos.y, p = potencia;
    for (let k = 0; k < 2e4; k++) {
      const cx = Math.floor(x), cy = Math.floor(y), aqui = casilla(n, cx, cy), g = (FRENO[aqui] ?? 1) * 0.05;
      if (p - g <= 0) break;
      const nx = x + 0.05 * dx, ny = y + 0.05 * dy, ncx = Math.floor(nx), ncy = Math.floor(ny);
      if (ncx === cx && ncy === cy) { p -= g; x = nx; y = ny; continue; }
      const h = ncx !== cx ? casilla(n, ncx, cy) : aqui, v = ncy !== cy ? casilla(n, cx, ncy) : aqui;
      let rx = h === '#', ry = v === '#';
      if (!rx && !ry && ncx !== cx && ncy !== cy && casilla(n, ncx, ncy) === '#') { rx = true; ry = true; }
      if (rx || ry) { if (rx) dx = -dx; if (ry) dy = -dy; continue; }
      p -= g; x = nx; y = ny;
      const t = casilla(n, ncx, ncy);
      if (t === '~') return { final: pos, evento: 'agua' };
      if (t === 'H') return { final: { x: ncx + 0.5, y: ncy + 0.5 }, evento: 'hoyo' };
      const imp = IMPULSO[t];
      if (imp) [dx, dy] = imp;
    }
    return { final: { x, y }, evento: 'parada' };
  }

  // Un solo recorrido por ángulo sirve para todas las fuerzas (la trayectoria es la misma; solo cambia dónde se para).
  // Devuelve, para cada fuerza de POTENCIAS, { evento, final }.
  function abanico(n, pos, angulo) {
    const rad = angulo * Math.PI / 180;
    let dx = Math.cos(rad), dy = Math.sin(rad), x = pos.x, y = pos.y, gastado = 0, maximo = 0, j = 0;
    const res = new Array(POTENCIAS.length);
    const MAXP = POTENCIAS[POTENCIAS.length - 1];
    for (let k = 0; k < 2e4 && j < POTENCIAS.length; k++) {
      const cx = Math.floor(x), cy = Math.floor(y), aqui = casilla(n, cx, cy), g = (FRENO[aqui] ?? 1) * 0.05;
      const umbral = gastado + g;
      if (umbral > maximo) maximo = umbral;
      while (j < POTENCIAS.length && POTENCIAS[j] <= maximo + 1e-9) res[j++] = { evento: 'parada', final: { x, y } };
      if (maximo >= MAXP) break;
      const nx = x + 0.05 * dx, ny = y + 0.05 * dy, ncx = Math.floor(nx), ncy = Math.floor(ny);
      if (ncx === cx && ncy === cy) { gastado += g; x = nx; y = ny; continue; }
      const h = ncx !== cx ? casilla(n, ncx, cy) : aqui, v = ncy !== cy ? casilla(n, cx, ncy) : aqui;
      let rx = h === '#', ry = v === '#';
      if (!rx && !ry && ncx !== cx && ncy !== cy && casilla(n, ncx, ncy) === '#') { rx = true; ry = true; }
      if (rx || ry) { if (rx) dx = -dx; if (ry) dy = -dy; continue; }
      gastado += g; x = nx; y = ny;
      const t = casilla(n, ncx, ncy);
      if (t === '~' || t === 'H') {
        const ev = t === '~' ? { evento: 'agua', final: pos } : { evento: 'hoyo', final: { x: ncx + 0.5, y: ncy + 0.5 }, margen: 0 };
        while (j < POTENCIAS.length) res[j++] = ev;
        break;
      }
      const imp = IMPULSO[t];
      if (imp) [dx, dy] = imp;
    }
    while (j < POTENCIAS.length) res[j++] = { evento: 'parada', final: { x, y } };
    return res;
  }

  // Distancia en casillas hasta el hoyo (sin atravesar paredes ni agua): sirve para ordenar las posiciones prometedoras
  function mapaDistancias(n) {
    const d = Array.from({ length: n.alto }, () => new Array(n.ancho).fill(Infinity));
    const cola = [];
    for (let y = 0; y < n.alto; y++) for (let x = 0; x < n.ancho; x++) if (n.filas[y][x] === 'H') { d[y][x] = 0; cola.push([x, y]); }
    while (cola.length) {
      const [x, y] = cola.shift();
      for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + ax, ny = y + ay, t = casilla(n, nx, ny);
        if (t === '#' || t === '~' || d[ny][nx] !== Infinity) continue;
        d[ny][nx] = d[y][x] + 1; cola.push([nx, ny]);
      }
    }
    return d;
  }

  // Tiros que meten la bola desde `pos` (verificados con la física exacta). Se prefiere el de más margen de fuerza.
  function tirosAlHoyo(n, pos) {
    const buenos = [];
    for (let a = 0; a < 360; a++) {
      const r = abanico(n, pos, a);
      for (let j = 0; j < r.length; j++) if (r[j].evento === 'hoyo') {
        // de las fuerzas que entran, la del medio (la más segura)
        let k = j; while (k + 1 < r.length && r[k + 1].evento === 'hoyo') k++;
        const pot = POTENCIAS[Math.floor((j + k) / 2)];
        if (tiroExacto(n, pos, a, pot).evento === 'hoyo') buenos.push({ angulo: a, potencia: pot, holgura: k - j });
        break;
      }
    }
    buenos.sort((p, q) => q.holgura - p.holgura);
    return buenos;
  }

  /* Búsqueda por niveles: golpe 1 → ¿entra? Si no, se miran las posiciones a las que se llega (ordenadas por cercanía
   * al hoyo) y desde cuáles entra con el golpe 2, y así sucesivamente. Se devuelve el primer golpe del mejor plan. */
  async function planificar(n, pos, alAvisar) {
    const directo = tirosAlHoyo(n, pos);
    if (directo.length) return { golpes: 1, tiro: directo[0] };
    const dist = mapaDistancias(n);
    const puntuar = p => { const c = dist[Math.floor(p.y)]?.[Math.floor(p.x)]; return c === undefined ? Infinity : c; };
    let nivel = [{ pos, primero: null }];
    const vistos = new Set([pos.x.toFixed(2) + ',' + pos.y.toFixed(2)]);
    for (let golpes = 2; golpes <= 7; golpes++) {
      // hijos del nivel actual
      const hijos = [];
      for (const s of nivel) {
        for (let a = 0; a < 360; a++) {
          const r = abanico(n, s.pos, a);
          for (let j = 0; j < r.length; j++) {
            if (r[j].evento !== 'parada') continue;
            const f = r[j].final, clave = f.x.toFixed(2) + ',' + f.y.toFixed(2);
            if (vistos.has(clave)) continue;
            vistos.add(clave);
            hijos.push({ pos: f, primero: s.primero || { angulo: a, potencia: POTENCIAS[j] }, h: puntuar(f) });
          }
        }
        await sleep(0);
      }
      hijos.sort((p, q) => p.h - q.h);
      // variedad: como mucho 3 posiciones por casilla
      const porCasilla = {}, candidatos = [];
      for (const hj of hijos) {
        if (hj.h === Infinity) continue;
        const k = Math.floor(hj.pos.x) + ',' + Math.floor(hj.pos.y);
        if ((porCasilla[k] = (porCasilla[k] || 0) + 1) > 3) continue;
        candidatos.push(hj);
      }
      alAvisar(`Buscando un plan de ${golpes} golpes… (${candidatos.length} posiciones)`);
      const t0 = Date.now();
      for (let i = 0; i < candidatos.length && Date.now() - t0 < 8000; i++) {
        const c = candidatos[i];
        if (tirosAlHoyo(n, c.pos).length) {
          // el primer golpe debe llevar exactamente ahí (comprobado con la física exacta)
          const r = tiroExacto(n, pos, c.primero.angulo, c.primero.potencia);
          if (golpes > 2 || (r.evento === 'parada' && tirosAlHoyo(n, r.final).length)) return { golpes, tiro: c.primero };
        }
        if (i % 20 === 19) await sleep(0);
      }
      nivel = candidatos.slice(0, 250);
    }
    return null;
  }

  /* ------------------------------------------------------------------ *
   *  CONEXIÓN CON EL JUEGO (props del tablero: filas, bola, bloqueado y disparar)
   * ------------------------------------------------------------------ */
  function tablero() {
    const div = document.querySelector('main div.relative.touch-none.select-none');
    if (!div) return null;
    const k = Object.keys(div).find(x => x.startsWith('__reactFiber$'));
    for (let f = k && div[k]; f; f = f.return) {
      const p = f.memoizedProps;
      if (p && Array.isArray(p.filas) && p.bola && typeof p.disparar === 'function') return { div, props: p };
    }
    return null;
  }
  const leer = () => { const t = tablero(); return t && t.props; };
  const enHoyo = p => { const t = p.filas[Math.floor(p.bola.y)]?.[Math.floor(p.bola.x)]; return t === 'H'; };

  let jugando = false, estado = '';
  function decir(t) { estado = t; const el = document.querySelector('#' + PANEL_ID + ' .axgolf-msg'); if (el) el.textContent = t; }

  async function jugarHoyo() {
    if (jugando) { jugando = false; decir('Parado.'); pintarBoton(); return; }
    jugando = true; pintarBoton();
    try {
      for (let golpe = 0; golpe < 12 && jugando; golpe++) {
        let p = leer();
        const t0 = Date.now();
        while (p && p.bloqueado && Date.now() - t0 < 15000) { await sleep(200); p = leer(); }
        if (!p) { decir('No veo el tablero.'); break; }
        if (enHoyo(p) || /dentro en/i.test(document.querySelector('main')?.textContent || '')) { decir('⛳ ¡Dentro!'); break; }
        const n = nivelDe(p.filas), pos = { x: p.bola.x, y: p.bola.y };
        decir('Calculando el mejor tiro…');
        await sleep(30);
        const plan = await planificar(n, pos, decir);
        if (!jugando) break;
        if (!plan) { decir('No encuentro cómo meterla (ni en 7 golpes). Tíralo tú.'); break; }
        decir(`Plan: ${plan.golpes} golpe(s) · tiro a ${plan.tiro.angulo}° con fuerza ${plan.tiro.potencia}.`);
        await sleep(500);
        const antes = JSON.stringify(p.bola);
        p.disparar(plan.tiro.angulo, plan.tiro.potencia);
        // espera a que la bola termine de moverse
        const t1 = Date.now();
        await sleep(400);
        while (Date.now() - t1 < 20000) {
          const q = leer();
          if (!q) break;
          if (!q.bloqueado && JSON.stringify(q.bola) !== antes) break;
          if (!q.bloqueado && Date.now() - t1 > 3000) break;
          await sleep(200);
        }
        await sleep(600);
      }
    } catch (e) {
      console.error('[axgolf]', e);
      decir('Error: ' + (e && e.message || e));
    } finally {
      jugando = false; pintarBoton();
    }
  }

  /* ------------------------------------------------------------------ *
   *  PANEL (debajo del tablero, con el estilo del campo)
   * ------------------------------------------------------------------ */
  function pintarBoton() {
    const b = document.querySelector('#' + PANEL_ID + ' button');
    if (b) b.textContent = jugando ? '■ Parar' : '⛳ Meter la bola (mínimo de golpes)';
  }
  function montar() {
    const t = tablero();
    let panel = document.getElementById(PANEL_ID);
    if (!t) { if (panel) panel.remove(); return; }
    const ancla = t.div.closest('div.w-full')?.parentElement ? t.div.closest('div.w-full') : null;
    if (!ancla) return;
    if (panel && panel.previousElementSibling === ancla) return;
    if (panel) panel.remove();
    panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.setAttribute('data-ax-ignore', '1');
    panel.className = 'space-y-1';
    panel.innerHTML = `<button type="button" class="w-full rounded-card py-2 text-xs font-extrabold transition active:scale-[0.98]"
        style="background:#FBF8EE;color:#1F2A1E;border:1.5px solid #FBF8EE"></button>
      <p class="axgolf-msg text-center text-[11px] font-semibold" style="color:#8FD17A"></p>`;
    panel.querySelector('button').addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); jugarHoyo(); });
    ancla.insertAdjacentElement('afterend', panel);
    pintarBoton();
    decir(estado);
  }

  const enGolf = () => /^\/golf(\/|$)/.test(location.pathname);
  function tick() {
    if (!enGolf()) { jugando = false; const p = document.getElementById(PANEL_ID); if (p) p.remove(); return; }
    montar();
  }

  // Para probar sin la web
  window.__axGolf = { tiroExacto, abanico, tirosAlHoyo, planificar, nivelDe };

  esperarHidratacion().then(() => { tick(); setInterval(tick, 600); });
})();
