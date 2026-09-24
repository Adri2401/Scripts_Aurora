// ==UserScript==
// @name         Aurora Dex · Galerías (escalera y camino)
// @namespace    auroradex-galerias
// @version      0.1.0
// @description  Minijuego de bajar plantas: resalta la escalera y los objetos que se vean, dibuja el camino más corto, explora solo hasta encontrar la escalera y permite copiar un diagnóstico del estado interno del juego.
// @match        https://auroradex.es/*
// @match        https://www.auroradex.es/*
// @updateURL    https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_galerias.user.js
// @downloadURL  https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_galerias.user.js
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

  const PANEL_ID = 'axg-panel';
  const OVERLAY_ID = 'axg-overlay';
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Tipos de casilla según la imagen de fondo (/mapa/castillo/pared.png, suelo.png, suelo2.png…)
  const RE_PARED = /pared|muro|roca|wall|columna|pilar/i;
  const RE_SUELO = /suelo|piso|floor|arena|camino/i;
  const RE_ESCALERA = /escal|stair|bajada|bajar|salida|hueco|descens|down/i;

  /* ------------------------------------------------------------------ *
   *  LECTURA DEL TABLERO (solo lo que el juego ya dibuja en pantalla)
   * ------------------------------------------------------------------ */
  function raizTablero() {
    const b = document.querySelector('button[aria-label="Sin explorar"], button[aria-label^="Casilla "]');
    return b ? b.parentElement : null;
  }

  function leerTablero() {
    const raiz = raizTablero();
    if (!raiz) return null;
    const botones = $$(':scope > button', raiz);
    if (!botones.length) return null;
    const w = parseFloat(botones[0].style.width) || 48;
    const celdas = new Map();
    let maxC = 0, maxF = 0;
    for (const b of botones) {
      const c = Math.round(parseFloat(b.style.left) / w), f = Math.round(parseFloat(b.style.top) / w);
      const etiqueta = b.getAttribute('aria-label') || '';
      const img = (b.style.backgroundImage.match(/\/([^\/"')]+)\.(?:png|webp|gif|jpe?g)/i) || [])[1] || '';
      let tipo;
      if (/sin explorar/i.test(etiqueta)) tipo = 'niebla';
      else if (RE_ESCALERA.test(img) || RE_ESCALERA.test(etiqueta)) tipo = 'escalera';
      else if (RE_PARED.test(img)) tipo = 'pared';
      else if (RE_SUELO.test(img)) tipo = 'suelo';
      else tipo = 'otro';
      const pisable = b.style.cursor === 'pointer' && tipo !== 'niebla';
      celdas.set(c + ',' + f, { c, f, tipo, img, pisable, btn: b });
      maxC = Math.max(maxC, c); maxF = Math.max(maxF, f);
    }
    // Jugador: el sprite de /personajes/ mide 2 casillas de alto; pisa la de abajo
    let jugador = null;
    for (const s of $$(':scope > span', raiz)) {
      if (!/personajes\//.test(s.style.backgroundImage || '')) continue;
      const c = Math.round(parseFloat(s.style.left) / w);
      const f = Math.round(parseFloat(s.style.top) / w + (parseFloat(s.style.height) / w || 1) - 1);
      jugador = { c, f };
    }
    return { raiz, w, celdas, cols: maxC + 1, filas: maxF + 1, jugador };
  }

  const VECINOS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  // Camino más corto (en pasos) a la casilla que cumpla `esMeta`, por casillas pisables ya visibles
  function camino(t, esMeta) {
    if (!t.jugador) return null;
    const ini = t.jugador.c + ',' + t.jugador.f;
    const prev = new Map([[ini, null]]);
    const cola = [ini];
    while (cola.length) {
      const k = cola.shift();
      const cel = t.celdas.get(k);
      if (cel && k !== ini && esMeta(cel)) {
        const ruta = [];
        for (let x = k; x; x = prev.get(x)) ruta.push(t.celdas.get(x));
        return ruta.reverse();
      }
      const [c, f] = k.split(',').map(Number);
      for (const [dc, df] of VECINOS) {
        const nk = (c + dc) + ',' + (f + df);
        if (prev.has(nk)) continue;
        const n = t.celdas.get(nk);
        if (!n || !(n.pisable || n.tipo === 'escalera')) continue;
        prev.set(nk, k);
        cola.push(nk);
      }
    }
    return null;
  }

  // Casilla pisable que toca la niebla: el mejor sitio al que ir a descubrir más mapa
  const esFrontera = t => cel => cel.pisable && VECINOS.some(([dc, df]) => {
    const n = t.celdas.get((cel.c + dc) + ',' + (cel.f + df));
    return n && n.tipo === 'niebla';
  });

  /* ------------------------------------------------------------------ *
   *  DIBUJO SOBRE EL TABLERO
   * ------------------------------------------------------------------ */
  function dibujar(t, ruta, escaleras, otros) {
    let ov = document.getElementById(OVERLAY_ID);
    if (!ov || ov.parentElement !== t.raiz) {
      if (ov) ov.remove();
      ov = document.createElement('div');
      ov.id = OVERLAY_ID;
      ov.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:15';
      t.raiz.appendChild(ov);
    }
    const marca = (cel, estilo) => `<span style="position:absolute;left:${cel.c * t.w}px;top:${cel.f * t.w}px;width:${t.w}px;height:${t.w}px;${estilo}"></span>`;
    let html = '';
    if (ruta) ruta.slice(1).forEach((cel, i) => {
      html += marca(cel, `display:grid;place-items:center;color:#fff;font:800 11px system-ui;background:rgba(255,214,64,.38);box-shadow:inset 0 0 0 2px rgba(255,214,64,.9)`).replace('></span>', `>${i + 1}</span>`);
    });
    for (const e of escaleras) html += marcar(e, 'box-shadow:inset 0 0 0 3px #3ddc84,0 0 14px 4px rgba(61,220,132,.8);background:rgba(61,220,132,.28)');
    for (const o of otros) html += marcar(o, 'box-shadow:inset 0 0 0 2px #4fc3f7;background:rgba(79,195,247,.22)');
    function marcar(cel, estilo) { return marca(cel, estilo); }
    if (ov.dataset.h !== html) { ov.innerHTML = html; ov.dataset.h = html; }
  }
  const quitarDibujo = () => { const ov = document.getElementById(OVERLAY_ID); if (ov) ov.remove(); };

  /* ------------------------------------------------------------------ *
   *  DIAGNÓSTICO DEL ESTADO INTERNO (React) — para saber si el mapa entero llega al navegador
   * ------------------------------------------------------------------ */
  function diagnostico() {
    const t = leerTablero();
    const lineas = [];
    if (!t) return 'No hay tablero en pantalla.';
    const tipos = {}, imgs = {};
    for (const cel of t.celdas.values()) { tipos[cel.tipo] = (tipos[cel.tipo] || 0) + 1; if (cel.img) imgs[cel.img] = (imgs[cel.img] || 0) + 1; }
    lineas.push(`Tablero visible: ${t.cols}×${t.filas} · jugador: ${t.jugador ? t.jugador.c + ',' + t.jugador.f : '?'}`);
    lineas.push('Tipos: ' + JSON.stringify(tipos));
    lineas.push('Imágenes: ' + JSON.stringify(imgs));
    const otrasImgs = $$('img, span, button', t.raiz.parentElement).map(e => e.style && e.style.backgroundImage).filter(x => x && !/castillo\/(pared|suelo)/.test(x));
    lineas.push('Otras imágenes de fondo: ' + JSON.stringify([...new Set(otrasImgs)].slice(0, 20)));

    // Estado de React: se suben unos cuantos niveles desde el tablero y se buscan listas grandes y textos de escalera
    const btn = $$(':scope > button', t.raiz)[0];
    const clave = btn && Object.keys(btn).find(k => k.startsWith('__reactFiber$'));
    let f = clave ? btn[clave] : null;
    const hallazgos = [];
    const visto = new WeakSet();
    const RE = /escal|stair|salida|descens|bajad|trampa|cofre|jarr/i;
    const mirar = (v, ruta, d) => {
      if (d > 5 || v == null || typeof v === 'function') return;
      if (typeof v === 'string') { if (RE.test(v)) hallazgos.push(`${ruta} = "${v.slice(0, 60)}"`); return; }
      if (typeof v !== 'object' || visto.has(v)) return;
      visto.add(v);
      if (v instanceof Node) return;
      if (Array.isArray(v) && v.length >= 20) hallazgos.push(`${ruta}: lista de ${v.length} (${typeof v[0] === 'object' ? 'objetos' : typeof v[0]})`);
      const claves = Object.keys(v);
      if (claves.length > 400) return;
      for (const k of claves.slice(0, 60)) { try { mirar(v[k], ruta + '.' + k, d + 1); } catch { /* getter */ } }
    };
    for (let i = 0; f && i < 12; i++, f = f.return) {
      const nombre = (f.type && (f.type.displayName || f.type.name)) || (typeof f.type === 'string' ? f.type : '?');
      if (f.memoizedProps && typeof f.type !== 'string') {
        lineas.push(`Fibra ${i} <${nombre}> props: ${Object.keys(f.memoizedProps).slice(0, 15).join(', ')}`);
        mirar(f.memoizedProps, `f${i}.props`, 0);
      }
      let h = f.memoizedState, n = 0;
      while (h && n++ < 12 && typeof f.type !== 'string') { mirar(h.memoizedState, `f${i}.hook${n}`, 0); h = h.next; }
    }
    lineas.push('Hallazgos: ' + (hallazgos.length ? '\n  ' + hallazgos.slice(0, 40).join('\n  ') : 'ninguno'));
    return lineas.join('\n');
  }

  /* ------------------------------------------------------------------ *
   *  PANEL Y ACCIONES
   * ------------------------------------------------------------------ */
  let mostrar = true, explorando = false, msg = '';
  let panel = null;

  function pasos(ruta) { return ruta ? ruta.length - 1 : null; }

  function analizar() {
    const t = leerTablero();
    if (!t) return null;
    const escaleras = [...t.celdas.values()].filter(c => c.tipo === 'escalera');
    const otros = [...t.celdas.values()].filter(c => c.tipo === 'otro');
    const ruta = escaleras.length ? camino(t, c => c.tipo === 'escalera') : null;
    return { t, escaleras, otros, ruta };
  }

  function pintar() {
    if (!panel) return;
    const a = analizar();
    const estado = panel.querySelector('.axg-est');
    if (!a) { estado.textContent = 'No veo el tablero.'; return; }
    if (mostrar) dibujar(a.t, a.ruta, a.escaleras, a.otros); else quitarDibujo();
    const partes = [];
    partes.push(a.escaleras.length ? `🪜 Escalera a la vista${a.ruta ? ` · ${pasos(a.ruta)} pasos` : ' (sin camino conocido)'}` : '🪜 Escalera aún no descubierta');
    if (a.otros.length) partes.push(`✨ ${a.otros.length} objetos/personajes visibles`);
    estado.textContent = partes.join(' · ');
    panel.querySelector('.axg-msg').textContent = msg;
    panel.querySelector('[data-a="auto"]').textContent = explorando ? '■ Parar exploración' : '🧭 Explorar hasta la escalera';
  }

  async function clicCelda(cel, t) {
    const antes = t.jugador ? `${t.jugador.c},${t.jugador.f}` : '';
    cel.btn.click();
    const t0 = Date.now();
    while (Date.now() - t0 < 4000 && explorando) {
      await sleep(120);
      const n = leerTablero();
      if (!n) return false;
      // el tablero se desplaza con la cámara: se considera hecho cuando cambia lo que se ve
      const firma = [...n.celdas.values()].map(c => c.tipo[0]).join('');
      const firmaAntes = [...t.celdas.values()].map(c => c.tipo[0]).join('');
      if (firma !== firmaAntes || (n.jugador && `${n.jugador.c},${n.jugador.f}` !== antes)) return true;
    }
    return false;
  }

  async function explorar() {
    if (explorando) { explorando = false; msg = 'Exploración parada.'; pintar(); return; }
    explorando = true;
    let sinCambio = 0;
    while (explorando) {
      const t = leerTablero();
      if (!t) { msg = 'Sin tablero: parado.'; break; }
      const esc = [...t.celdas.values()].find(c => c.tipo === 'escalera');
      if (esc) {
        const r = camino(t, c => c.tipo === 'escalera');
        if (r && r.length > 1) {
          msg = `Escalera a ${pasos(r)} pasos: voy.`; pintar();
          if (!(await clicCelda(esc, t))) sinCambio++; else sinCambio = 0;
          if (sinCambio > 2) { msg = 'No consigo llegar a la escalera.'; break; }
          continue;
        }
        msg = '🪜 Ya estás en la escalera o sin camino. Parado.'; break;
      }
      const meta = camino(t, esFrontera(t));
      if (!meta || meta.length < 2) { msg = 'No queda nada por explorar desde aquí. Parado.'; break; }
      msg = `Explorando… (${pasos(meta)} pasos al siguiente hueco)`; pintar();
      const destino = meta[meta.length - 1];
      if (!(await clicCelda(destino, t))) { if (++sinCambio > 3) { msg = 'El juego no responde a los clics. Parado.'; break; } } else sinCambio = 0;
      await sleep(150);
    }
    explorando = false;
    pintar();
  }

  function construirPanel() {
    const sec = document.createElement('section');
    sec.id = PANEL_ID;
    sec.className = 'tarjeta space-y-2 p-3';
    sec.setAttribute('data-ax-ignore', '1');
    sec.innerHTML = `
      <p class="font-display text-sm font-extrabold">🪜 Galerías · escalera y camino</p>
      <p class="axg-est text-[11px] font-bold text-tinta-500"></p>
      <div class="flex flex-wrap gap-2">
        <button type="button" class="boton-suave flex-1 !py-2 text-[11px]" data-a="ver">👁 Camino: sí</button>
        <button type="button" class="boton-principal flex-1 !py-2 text-[11px]" data-a="auto"></button>
      </div>
      <button type="button" class="boton-suave w-full !py-2 text-[11px]" data-a="diag">📋 Copiar diagnóstico del juego</button>
      <p class="axg-msg text-[11px] font-semibold text-tinta-400"></p>`;
    const on = (sel, fn) => sec.querySelector(sel).addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); fn(); });
    on('[data-a="ver"]', () => { mostrar = !mostrar; sec.querySelector('[data-a="ver"]').textContent = mostrar ? '👁 Camino: sí' : '👁 Camino: no'; pintar(); });
    on('[data-a="auto"]', explorar);
    on('[data-a="diag"]', async () => {
      const txt = diagnostico();
      try { await navigator.clipboard.writeText(txt); msg = 'Diagnóstico copiado: pégamelo en el chat.'; }
      catch { msg = 'No pude copiar; está en la consola (F12).'; console.log(txt); }
      pintar();
    });
    return sec;
  }

  function asegurarPanel() {
    const t = leerTablero();
    if (!t) { if (panel && panel.parentElement) panel.remove(); quitarDibujo(); explorando = false; return; }
    const caja = t.raiz.parentElement;
    if (!panel) panel = construirPanel();
    if (panel.previousElementSibling !== caja) caja.insertAdjacentElement('afterend', panel);
    pintar();
  }

  // Para probar sin la web
  window.__axGalerias = { leerTablero, camino, esFrontera, diagnostico, asegurarPanel };

  esperarHidratacion().then(() => {
    asegurarPanel();
    setInterval(asegurarPanel, 500);
  });
})();
