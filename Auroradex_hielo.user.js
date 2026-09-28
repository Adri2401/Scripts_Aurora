// ==UserScript==
// @name         Aurora Dex · Suelo Helado (resuelto)
// @namespace    auroradex-hielo
// @version      1.0.0
// @description  Solo en /hielo. Resuelve «El Suelo Helado» con la jugada perfecta (búsqueda en anchura con las reglas exactas del juego: resbalas hasta chocar con una roca o el borde y te paras encima de la nieve o de la salida) y la juega sola. «🔁 Jugar las que quedan» empieza partidas en la dificultad que elijas (pagando con dinero o con energía) hasta gastar las del día. Panel con lo que va haciendo y botón para parar.
// @match        https://auroradex.es/*
// @match        https://www.auroradex.es/*
// @updateURL    https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_hielo.user.js
// @downloadURL  https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_hielo.user.js
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  'use strict';
  const VERSION = '1.0.0';
  const PANEL_ID = 'axh-panel';
  const LS_CONF = 'axh-conf';
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const pausa = (a, b) => sleep(a + Math.random() * (b - a));
  const texto = el => (el && el.textContent || '').replace(/\s+/g, ' ').trim();
  const norm = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const ajeno = el => !!el.closest('#' + PANEL_ID);
  const visible = el => !!el && el.getClientRects().length > 0;
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } };
  const lsPut = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* nada */ } };
  const enHielo = () => /^\/hielo\/?$/.test(location.pathname);

  function esperarHidratacion(maxMs = 20000) {
    return new Promise(resolve => {
      const t0 = Date.now();
      let quieto = Date.now();
      const obs = new MutationObserver(() => { quieto = Date.now(); });
      obs.observe(document.documentElement, { childList: true, subtree: true });
      const marcado = el => !el || Object.keys(el).some(k => k.startsWith('__reactFiber$'));
      const tick = () => {
        const listo = document.readyState === 'complete' && marcado(document.querySelector('main')) && Date.now() - quieto >= 800;
        if (listo || Date.now() - t0 > maxMs) { obs.disconnect(); setTimeout(resolve, 300); } else setTimeout(tick, 200);
      };
      tick();
    });
  }

  /* ══════════ Reglas (las mismas que el juego) ══════════
   * Casillas: '.' hielo · '#' roca · 'o' nieve · 'S' salida · 'P' inicio (hielo). Al moverte resbalas hasta que la
   * siguiente es roca o borde (te quedas en la de antes), o hasta pisar nieve o la salida (te quedas encima). */
  const DIRS = { arriba: [0, -1], abajo: [0, 1], izquierda: [-1, 0], derecha: [1, 0] };
  function deslizar(filas, pos, dir) {
    const [dx, dy] = DIRS[dir], alto = filas.length, ancho = filas[0].length;
    let { x, y } = pos;
    for (;;) {
      const nx = x + dx, ny = y + dy;
      const c = nx < 0 || ny < 0 || nx >= ancho || ny >= alto ? '#' : filas[ny][nx];
      if (c === '#') return { x, y };
      x = nx; y = ny;
      if (c === 'o' || c === 'S') return { x, y };
    }
  }
  // Camino más corto (en movimientos) hasta la salida: lista de direcciones, o null si no se puede
  function resolver(filas, pos) {
    let salida = null;
    filas.forEach((f, y) => { const x = f.indexOf('S'); if (x >= 0) salida = { x, y }; });
    if (!salida) return null;
    const K = p => p.x + ',' + p.y;
    const prev = new Map([[K(pos), null]]), cola = [pos];
    while (cola.length) {
      const p = cola.shift();
      if (p.x === salida.x && p.y === salida.y) {
        const ruta = [];
        for (let k = K(p); prev.get(k); k = prev.get(k).de) ruta.unshift(prev.get(k).dir);
        return ruta;
      }
      for (const dir of Object.keys(DIRS)) {
        const n = deslizar(filas, p, dir), k = K(n);
        if (prev.has(k)) continue;
        prev.set(k, { de: K(p), dir });
        cola.push(n);
      }
    }
    return null;
  }

  /* ══════════ Leer la partida ══════════
   * La partida viene del estado de React (filas, pos, gastados, max, estado); se prueban las dos copias de la fibra
   * y se queda la que cuadra con dónde está dibujado el personaje. */
  function tablero() {
    const s = $$('main span').find(x => /salida\.png/.test(x.style.backgroundImage || ''));
    return s ? s.parentElement : null;
  }
  function posDibujada(raiz) {
    const yo = $$(':scope > span', raiz).find(s => /\/personajes\//.test(s.style.backgroundImage || ''));
    const celda = $$(':scope > span', raiz).find(s => /suelo-|deco-hielo/.test(s.style.backgroundImage || ''));
    if (!yo || !celda) return null;
    const B = parseFloat(celda.style.width);
    return { x: Math.round((parseFloat(yo.style.left) + parseFloat(yo.style.width) / 2) / B - 1.5), y: Math.round(parseFloat(yo.style.top) / B) };
  }
  function partida() {
    const raiz = tablero();
    if (!raiz) return null;
    const k = Object.keys(raiz).find(x => x.startsWith('__reactFiber$'));
    if (!k) return null;
    const dib = posDibujada(raiz), cands = [];
    for (const f0 of [raiz[k], raiz[k].alternate]) {
      for (let f = f0, n = 0; f && n < 40; f = f.return, n++) {
        let h = f.memoizedState, i = 0;
        while (h && typeof h === 'object' && i++ < 40) {
          const v = h.memoizedState;
          if (v && Array.isArray(v.filas) && v.pos && typeof v.estado === 'string') { cands.push(v); break; }
          h = h.next;
        }
      }
    }
    if (!cands.length) return null;
    return cands.find(c => dib && c.pos.x === dib.x && c.pos.y === dib.y) || cands[0];
  }
  const quedanHoy = () => { const m = texto(document.querySelector('main')).match(/te quedan\s*(\d+)\s*de\s*(\d+)\s*partidas/i); return m ? +m[1] : null; };

  /* ══════════ Jugar ══════════ */
  const conf = Object.assign({ dificultad: 'Maestro', pago: 'dinero' }, lsGet(LS_CONF, {}));
  let modo = null;                     // null · 'una' (esta partida) · 'todas' (hasta gastar las del día)
  let ganadas = 0, perdidas = 0;
  const bitacora = [];
  function log(t) {
    const h = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    bitacora.unshift(`${h}  ${t}`); bitacora.length = Math.min(bitacora.length, 14);
    console.log('[hielo]', t); pintar();
  }
  const boton = re => $$('main button').find(b => !ajeno(b) && !b.disabled && visible(b) && re.test(texto(b)));
  const botonDir = dir => $$('main button').find(b => b.getAttribute('aria-label') === 'Deslizar hacia ' + dir && !b.disabled);
  // el bloque de una dificultad: el elemento más pequeño que contiene su nombre y sus dos botones de pago
  function botonPagar() {
    const n = norm(conf.dificultad);
    const bs = $$('main button').filter(b => !ajeno(b) && visible(b) && (conf.pago === 'energia' ? /^⚡\s*\d/.test(texto(b)) : /^[\d.]+\s*\$$/.test(texto(b))));
    for (const b of bs) {
      let el = b.parentElement;
      for (let i = 0; i < 6 && el; i++, el = el.parentElement) {
        const t = norm(texto(el));
        const nombres = ['facil', 'normal', 'dificil', 'experto', 'maestro'].filter(x => t.includes(x));
        if (nombres.length === 1) { if (nombres[0] === n) return b; break; }
        if (nombres.length > 1) break;
      }
    }
    return null;
  }
  let corriendo = false;
  async function bucle() {
    if (corriendo) return;
    corriendo = true;
    let quietoDesde = Date.now();
    try {
      while (modo && enHielo()) {
        // resultado de una partida: «Seguir»
        const seguir = boton(/^seguir$/i);
        const P = partida();
        // al acabar, el tablero se quita y sale el resultado («¡Has llegado a la salida!» / «Te has quedado sin movimientos»)
        let res = seguir && seguir.closest('section');
        let tRes = texto(res);
        // el cofre se abre un segundo después: se espera para poder apuntar lo que ha salido
        if (seguir && /has llegado a la salida/i.test(tRes)) { await sleep(1500); res = seguir.closest('section') || res; tRes = texto(res); }
        if (seguir && /has llegado a la salida|sin movimientos/i.test(tRes)) {
          if (/has llegado a la salida/i.test(tRes)) {
            ganadas++;
            const m = tRes.match(/en (\d+) movimientos(?: · la jugada perfecta eran (\d+))?/i);
            const premio = tRes.replace(/^.*?movimientos(?: · la jugada perfecta eran \d+)?\.?/i, '').replace(/seguir$/i, '').trim();
            log(`🏆 Ganada${m ? ` en ${m[1]} movimientos${m[2] ? ` (la perfecta: ${m[2]})` : ''}` : ''}${premio ? ` · 🎁 ${premio.slice(0, 80)}` : ''}.`);
          } else { perdidas++; log(`❌ Perdida: ${tRes.slice(0, 120)}`); }
          await pausa(900, 1500); seguir.click(); await pausa(900, 1400);
          if (modo === 'una') { modo = null; break; }
          quietoDesde = Date.now(); continue;
        }
        if (P && P.estado === 'activa') {
          const ruta = resolver(P.filas, P.pos);
          if (!ruta) {
            // desde aquí no hay salida (no debería pasar): volver al inicio no gasta
            const v = boton(/volver al inicio/i);
            if (v) { log('↺ Desde aquí no hay salida: vuelvo al inicio.'); v.click(); await pausa(900, 1300); continue; }
            log('⚠ No encuentro la salida en este mapa.'); modo = null; break;
          }
          if (P.gastados + ruta.length > P.max) log(`⚠ Me quedan ${P.max - P.gastados} movimientos y hacen falta ${ruta.length}.`);
          const dir = ruta[0], b = botonDir(dir);
          if (!b) { await sleep(300); if (Date.now() - quietoDesde > 15000) { log('⚠ No encuentro los botones de mover.'); modo = null; } continue; }
          const antes = P.pos, espero = deslizar(P.filas, P.pos, dir);
          await pausa(350, 700);
          b.click();
          // se espera a que el juego lo apunte (la posición cambia al momento y luego llega la del servidor)
          for (let i = 0; i < 30; i++) { await sleep(120); const Q = partida(); if (!Q || Q.estado !== 'activa' || (Q.pos.x === espero.x && Q.pos.y === espero.y)) break; }
          await pausa(350, 650);
          const Q = partida();
          if (Q && Q.estado === 'activa' && Q.pos.x === antes.x && Q.pos.y === antes.y) await sleep(600);   // aún ocupado: se reintenta
          quietoDesde = Date.now();
          continue;
        }
        if (modo === 'una') { log('No hay ninguna partida empezada.'); modo = null; break; }
        // modo «todas»: empezar otra si quedan
        const q = quedanHoy();
        if (q === 0) { log(`🏁 Hechas las del día: ${ganadas} ganada(s)${perdidas ? `, ${perdidas} perdida(s)` : ''}.`); modo = null; break; }
        const pagar = botonPagar();
        if (pagar) {
          await pausa(800, 1400);
          if (!modo) break;
          log(`▶ Empiezo una de ${conf.dificultad} (${texto(pagar)}). Quedan ${q ?? '?'}.`);
          pagar.click();
          for (let i = 0; i < 40; i++) { await sleep(150); const Q = partida(); if (Q && Q.estado === 'activa') break; }
          quietoDesde = Date.now();
          continue;
        }
        if (Date.now() - quietoDesde > 12000) { log(`⚠ No puedo empezar una de ${conf.dificultad} pagando con ${conf.pago} (¿sin ${conf.pago === 'energia' ? 'energía' : 'dinero'}?).`); modo = null; break; }
        await sleep(400);
      }
    } catch (e) { console.warn('[hielo]', e); log('⚠ ' + (e && e.message)); modo = null; }
    finally { corriendo = false; pintar(); }
  }

  /* ══════════ Panel ══════════ */
  function pintar() {
    const p = document.getElementById(PANEL_ID);
    if (!p) return;
    const P = partida();
    let est = modo === 'todas' ? '🔁 Jugando las del día' : modo === 'una' ? '🧊 Resolviendo' : '⏸ Quieto';
    if (P && P.estado === 'activa') { const r = resolver(P.filas, P.pos); est += ` · ${P.gastados}/${P.max} mov. · ${r ? `salida a ${r.length}: ${r.map(d => ({ arriba: '↑', abajo: '↓', izquierda: '←', derecha: '→' }[d])).join(' ')}` : 'sin salida desde aquí'}`; }
    p.querySelector('.axh-estado').textContent = est;
    p.querySelector('.axh-una').textContent = modo === 'una' ? '■ Parar' : '🧊 Resolver esta';
    p.querySelector('.axh-todas').textContent = modo === 'todas' ? '■ Parar' : '🔁 Jugar las que quedan';
    p.querySelector('.axh-log').textContent = bitacora.join('\n') || `Gana siempre con la jugada perfecta. Hoy: ${ganadas} ganada(s).`;
  }
  function montar() {
    if (document.getElementById(PANEL_ID)) return;
    const h1 = $$('main h1').find(h => /suelo helado/i.test(texto(h)));
    const sec = h1 && (h1.closest('section') || h1);
    if (!sec) return;
    const p = document.createElement('section');
    p.id = PANEL_ID;
    p.setAttribute('data-ax-ignore', '');
    p.style.cssText = 'background:#12263a;border:2px solid #2d5b80;color:#d7ecfa;border-radius:22px;padding:12px;font-size:12px;line-height:1.4;margin:0 0 12px';
    const sel = (cls, ops, v) => `<select class="${cls}" style="background:#2d5b80;color:#fff;border-radius:10px;padding:3px 6px">${ops.map(([k, t]) => `<option value="${k}"${k === v ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
    p.innerHTML = `<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><b style="flex:1">❄️ Suelo Helado · jugada perfecta</b>
        ${sel('axh-dif', ['Fácil', 'Normal', 'Difícil', 'Experto', 'Maestro'].map(x => [x, x]), conf.dificultad)}
        ${sel('axh-pago', [['dinero', '💰 con dinero'], ['energia', '⚡ con energía']], conf.pago)}</div>
      <p class="axh-estado" style="margin:6px 0;font-weight:700"></p>
      <div style="display:flex;gap:6px"><button type="button" class="axh-una" style="flex:1;background:#2d5b80;color:#fff;border-radius:12px;padding:6px;font-weight:800"></button>
        <button type="button" class="axh-todas" style="flex:1;background:#3f86b8;color:#fff;border-radius:12px;padding:6px;font-weight:800"></button></div>
      <pre class="axh-log" style="white-space:pre-wrap;margin:6px 0 0;font:11px/1.4 ui-monospace,monospace;color:#a9cbe3;max-height:150px;overflow:auto"></pre>
      <p style="margin-top:4px;font-size:10px;color:#6f93ad">Suelo Helado v${VERSION}</p>`;
    p.querySelector('.axh-dif').addEventListener('change', e => { conf.dificultad = e.target.value; lsPut(LS_CONF, conf); });
    p.querySelector('.axh-pago').addEventListener('change', e => { conf.pago = e.target.value; lsPut(LS_CONF, conf); });
    p.querySelector('.axh-una').addEventListener('click', () => { modo = modo === 'una' ? null : 'una'; pintar(); if (modo) bucle(); });
    p.querySelector('.axh-todas').addEventListener('click', () => { modo = modo === 'todas' ? null : 'todas'; pintar(); if (modo) bucle(); });
    sec.insertAdjacentElement('afterend', p);
    pintar();
  }

  esperarHidratacion().then(() => {
    const tick = () => { if (enHielo()) { montar(); pintar(); } else if (modo) modo = null; };
    setInterval(tick, 1000);
    tick();
  });
  window.__axHielo = { resolver, deslizar, partida };
})();
