// ==UserScript==
// @name         Aurora Dex · Golf (hoyo en el mínimo de golpes)
// @namespace    auroradex-golf
// @version      1.1.1
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

  // Ceder el turno al navegador sin las esperas mínimas de setTimeout (así la página no se congela y no se pierde tiempo)
  const ceder = () => new Promise(r => { const c = new MessageChannel(); c.port1.onmessage = () => r(); c.port2.postMessage(0); });

  // Mejor tiro al hoyo desde `pos` a partir de los abanicos ya calculados: la fuerza del medio del tramo que entra
  // (la más segura), comprobado con la física exacta. null si ninguno entra.
  function tiroAlHoyo(n, pos, abanicos) {
    let mejor = null;
    for (let a = 0; a < 360; a++) {
      const r = abanicos[a];
      for (let j = 0; j < r.length; j++) if (r[j].evento === 'hoyo') {
        let k = j; while (k + 1 < r.length && r[k + 1].evento === 'hoyo') k++;
        if (!mejor || k - j > mejor.holgura) {
          const pot = POTENCIAS[Math.floor((j + k) / 2)];
          if (tiroExacto(n, pos, a, pot).evento === 'hoyo') mejor = { angulo: a, potencia: pot, holgura: k - j };
        }
        break;
      }
    }
    return mejor;
  }

  /* Búsqueda por niveles (golpe 1, 2, 3…). Cada posición se calcula una sola vez: sus 360 abanicos dicen a la vez si
   * alguno entra en el hoyo y a qué sitios se puede llegar. De cada nivel se sigue con las posiciones más cercanas al
   * hoyo (por el recorrido real, sin atravesar paredes ni agua). Devuelve la lista completa de tiros. */
  async function planificar(n, pos, avisar = () => {}) {
    const dist = mapaDistancias(n);
    const puntuar = p => { const c = dist[Math.floor(p.y)]?.[Math.floor(p.x)]; return c === undefined ? Infinity : c; };
    const clave = p => Math.round(p.x * 20) + ',' + Math.round(p.y * 20);
    const vistos = new Set([clave(pos)]);
    let nivel = [{ pos, tiros: [] }];
    let ultimoCeder = performance.now();
    for (let golpes = 1; golpes <= 9 && nivel.length; golpes++) {
      avisar(`Calculando… (planes de ${golpes} golpe${golpes > 1 ? 's' : ''})`);
      const hijos = [];
      for (const s of nivel) {
        const abanicos = new Array(360);
        for (let a = 0; a < 360; a++) abanicos[a] = abanico(n, s.pos, a);
        const t = tiroAlHoyo(n, s.pos, abanicos);
        if (t) return { golpes, tiros: [...s.tiros, t] };
        for (let a = 0; a < 360; a++) {
          const r = abanicos[a];
          for (let j = 0; j < r.length; j++) {
            if (r[j].evento !== 'parada') continue;
            const f = r[j].final, k = clave(f);
            if (vistos.has(k)) continue;
            vistos.add(k);
            const h = puntuar(f);
            if (h !== Infinity) hijos.push({ pos: f, tiros: [...s.tiros, { angulo: a, potencia: POTENCIAS[j] }], h });
          }
        }
        if (performance.now() - ultimoCeder > 40) { await ceder(); ultimoCeder = performance.now(); }
      }
      hijos.sort((p, q) => p.h - q.h);
      const porCasilla = {};
      nivel = hijos.filter(hj => {
        const k = Math.floor(hj.pos.x) + ',' + Math.floor(hj.pos.y);
        return (porCasilla[k] = (porCasilla[k] || 0) + 1) <= 2;
      }).slice(0, 160);
    }
    return null;
  }

  // Comprueba el plan con la física exacta desde la posición real; devuelve los tiros válidos o null
  function planValido(n, pos, tiros) {
    let p = pos;
    for (let i = 0; i < tiros.length; i++) {
      const r = tiroExacto(n, p, tiros[i].angulo, tiros[i].potencia);
      if (r.evento === 'hoyo') return i === tiros.length - 1;
      if (r.evento !== 'parada') return false;
      p = r.final;
    }
    return false;
  }
  /* ------------------------------------------------------------------ *
   *  CONEXIÓN CON EL JUEGO (props del tablero: filas, bola, bloqueado y disparar)
   * ------------------------------------------------------------------ */
  function actual(f) {
    if (!f) return f;
    for (const c of [f, f.alternate]) {
      if (!c) continue;
      let r = c; while (r.return) r = r.return;
      if (r.tag === 3 && r.stateNode && r.stateNode.current === r) return c;
    }
    return f;
  }
  // Posición de la bola según el dibujo (img «La bola», 38 px centrada en casillas de 32 px con 4 px de borde)
  function bolaEnPantalla() {
    const img = document.querySelector('main img[alt="La bola"]');
    if (!img) return null;
    return { x: (parseFloat(img.style.left) + 19 - 4) / 32, y: (parseFloat(img.style.top) + 19 - 4) / 32 };
  }
  function tablero() {
    const div = document.querySelector('main div.relative.touch-none.select-none');
    if (!div) return null;
    const k = Object.keys(div).find(x => x.startsWith('__reactFiber$'));
    // La fibra guardada en el nodo puede ser la copia vieja (React alterna dos): se usa la que está en pantalla
    for (let f = k && actual(div[k]); f; f = f.return) {
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
    let plan = null;
    try {
      for (let golpe = 0; golpe < 12 && jugando; golpe++) {
        let p = leer();
        const t0 = Date.now();
        while (p && p.bloqueado && Date.now() - t0 < 15000) { await sleep(150); p = leer(); }
        if (!p) { decir('No veo el tablero.'); break; }
        if (enHoyo(p) || /dentro en/i.test(document.querySelector('main')?.textContent || '')) { decir('⛳ ¡Dentro!'); break; }
        const n = nivelDe(p.filas), pos = { x: p.bola.x, y: p.bola.y };
        // El plan se calcula una vez por hoyo; mientras la bola acabe donde se esperaba, se siguen sus tiros sin recalcular
        if (!plan || !planValido(n, pos, plan.tiros)) {
          const t0 = performance.now();
          plan = await planificar(n, pos, decir);
          if (!jugando) break;
          if (!plan) { decir('No encuentro cómo meterla (ni en 9 golpes). Tíralo tú.'); break; }
          console.log(`[axgolf] plan de ${plan.golpes} golpes en ${Math.round(performance.now() - t0)} ms`, plan.tiros);
        }
        const tiro = plan.tiros.shift();
        decir(`Plan: ${plan.tiros.length + 1} golpe(s) más · tiro a ${tiro.angulo}° con fuerza ${tiro.potencia}.`);
        await sleep(350);
        p.disparar(tiro.angulo, tiro.potencia);
        // Espera a que la bola se quede quieta en pantalla y el juego vuelva a dejar tirar
        const t1 = Date.now();
        let ultima = '', quietaDesde = Date.now();
        await sleep(500);
        while (Date.now() - t1 < 25000 && jugando) {
          const b = JSON.stringify(bolaEnPantalla()), q = leer();
          if (b !== ultima) { ultima = b; quietaDesde = Date.now(); }
          if (!q) break;
          if (!q.bloqueado && Date.now() - quietaDesde > 450) break;
          await sleep(120);
        }
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
  window.__axGolf = { tiroExacto, abanico, planificar, planValido, nivelDe };

  esperarHidratacion().then(() => { tick(); setInterval(tick, 600); });
})();
