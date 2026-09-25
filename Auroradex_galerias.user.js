// ==UserScript==
// @name         Aurora Dex · Galerías (escalera y camino)
// @namespace    auroradex-galerias
// @version      0.20.0
// @description  Solo en /castillo. Minijuego de bajar plantas: resalta la escalera y el camino más corto, explora solo (combates, remolinos, jarrones, capturas con Poké Ball, aceite y cuerda) y se para con aviso ante un variocolor o legendario para que tires tú la Master Ball.
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
  const pausa = (a, b) => sleep(a + Math.random() * (b - a));   // pausa con algo de azar (más natural y menos frenética)
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

  const entradas = new Set();                    // escaleras de entrada por planta (planta|columna,fila)
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
    // Jugador: el centro de la luz de la antorcha («circle at 168px 168px») cae en su casilla. Otros sprites de
    // /personajes/ (como el mercader) son personajes del tablero. Un sprite mide 2 casillas de alto y pisa la de abajo.
    const spritePos = s => ({
      c: Math.round(parseFloat(s.style.left) / w),
      f: Math.round(parseFloat(s.style.top) / w + (parseFloat(s.style.height) / w || 1) - 1),
    });
    let jugador = null, spriteJugador = null;
    const luz = $$(':scope > span', raiz).map(s => (s.style.background || s.style.backgroundImage || '').match(/circle at\s+([\d.]+)px\s+([\d.]+)px/)).find(Boolean);
    const sprites = $$(':scope > span', raiz).filter(s => /personajes\//.test(s.style.backgroundImage || ''));
    if (luz) {
      const c = Math.floor(parseFloat(luz[1]) / w), f = Math.floor(parseFloat(luz[2]) / w);
      spriteJugador = sprites.find(s => { const p = spritePos(s); return p.c === c && p.f === f; }) || null;
      jugador = { c, f };
    } else if (sprites.length) {
      spriteJugador = sprites[sprites.length - 1];
      jugador = spritePos(spriteJugador);
    }
    // Entidades dibujadas encima del suelo (no son botones): entrenadores, mercader, remolinos y otros objetos
    const entidades = [];
    for (const el of $$(':scope > img, :scope > span', raiz)) {
      const st = el.style, bg = st.backgroundImage || '', src = el.tagName === 'IMG' ? (el.getAttribute('src') || '') : '';
      if (el === spriteJugador || /inset-0/.test(el.className || '')) continue;      // jugador y capa de oscuridad
      const left = parseFloat(st.left), top = parseFloat(st.top);
      if (Number.isNaN(left) || Number.isNaN(top)) continue;
      const wd = parseFloat(st.width) || w, ht = parseFloat(st.height) || w;
      const nombre = ((src || bg).match(/\/([^\/"')]+)\.(?:png|webp|gif|jpe?g)/i) || [])[1] || '';
      let tipo, pos;
      if (/personajes\//.test(bg)) { tipo = /ricach|mercader|vendedor|nomada/i.test(nombre) ? 'mercader' : /espeleolog|arqueolog/i.test(nombre) ? 'arqueologo' : 'personaje'; pos = spritePos(el); }
      else {
        tipo = /entrenadores\//.test(src) ? 'entrenador' : /remolino|torbellino|vortice|portal|trampa/i.test(nombre) ? 'remolino' : /lapida|tumba|sepultura/i.test(nombre) ? 'lapida' : /jarron|vasija|urna|tinaja/i.test(nombre) ? 'jarron' : /movediza|arena|cienaga|pantano/i.test(nombre) ? 'movediza' : /puerta/i.test(nombre) ? 'puerta' : 'objeto';
        pos = { c: Math.floor((left + wd / 2) / w), f: Math.floor((top + ht / 2) / w) };
      }
      entidades.push({ c: pos.c, f: pos.f, tipo, nombre });
    }
    // La escalera sobre la que apareces es la de entrada (subida), no la de bajada: no cuenta como objetivo
    const pk = plantaActual(), cj = jugador && celdas.get(jugador.c + ',' + jugador.f);
    if (cj && cj.tipo === 'escalera') entradas.add(pk + '|' + cj.c + ',' + cj.f);
    for (const cel of celdas.values()) if (cel.tipo === 'escalera' && entradas.has(pk + '|' + cel.c + ',' + cel.f)) { cel.tipo = 'suelo'; cel.entrada = true; }
    // Las arenas movedizas se pisan como suelo normal (el botón puede no marcarse como pisable)
    for (const e of entidades) if (e.tipo === 'movediza') { const c = celdas.get(e.c + ',' + e.f); if (c) { c.pisable = true; c.tipo = 'escalera'; c.movediza = true; } }   // lleva a otro piso: cuenta como escalera
    const ocupadas = new Set(entidades.filter(e => e.tipo !== 'objeto' && e.tipo !== 'movediza').map(e => e.c + ',' + e.f));
    return { raiz, w, celdas, cols: maxC + 1, filas: maxF + 1, jugador, entidades, ocupadas };
  }

  const VECINOS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  // Camino más corto (en pasos) a la casilla que cumpla `esMeta`, por casillas pisables ya visibles
  // `evitar`: casillas con entrenador o remolino; se rodean si hay otra ruta (si no, se pasa por ellas)
  function camino(t, esMeta, evitar = true) {
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
        if (evitar && t.ocupadas && t.ocupadas.has(nk) && n.tipo !== 'escalera' && !esMeta(n)) continue;
        prev.set(nk, k);
        cola.push(nk);
      }
    }
    return null;
  }

  // Casilla pisable que toca la niebla: el mejor sitio al que ir a descubrir más mapa
  const rutaA = (t, esMeta) => camino(t, esMeta, true) || camino(t, esMeta, false);

  const esFrontera = t => cel => cel.pisable && !(t.ocupadas && t.ocupadas.has(cel.c + ',' + cel.f)) && VECINOS.some(([dc, df]) => {
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
    const ESTILO = {
      entrenador: 'box-shadow:inset 0 0 0 2px #ff9800;background:rgba(255,152,0,.25)',
      remolino: 'box-shadow:inset 0 0 0 2px #b388ff;background:rgba(179,136,255,.28)',
      mercader: 'box-shadow:inset 0 0 0 2px #ffd54f;background:rgba(255,213,79,.28)',
      lapida: 'box-shadow:inset 0 0 0 2px #90a4ae;background:rgba(144,164,174,.3)',
      jarron: 'box-shadow:inset 0 0 0 2px #ffb74d;background:rgba(255,183,77,.3)',
      personaje: 'box-shadow:inset 0 0 0 2px #ff9800;background:rgba(255,152,0,.22)',
      puerta: 'box-shadow:inset 0 0 0 2px #ba68c8;background:rgba(186,104,200,.3)',
      movediza: 'box-shadow:inset 0 0 0 2px #ffb74d;background:rgba(255,183,77,.3)',
      objeto: 'box-shadow:inset 0 0 0 2px #4fc3f7;background:rgba(79,195,247,.22)',
    };
    for (const o of otros) html += marcar(o, ESTILO[o.tipo] || ESTILO.objeto);
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

    // Estructura del estado del juego (nombres de claves, tipos y tamaños; sin volcar datos personales)
    const resumir = (v, d = 0, ruta = '') => {
      if (v == null) return String(v);
      if (typeof v === 'string') return `"${v.slice(0, 30)}${v.length > 30 ? '…' : ''}"`;
      if (typeof v !== 'object') return String(v);
      if (Array.isArray(v)) {
        if (d >= 4) return `[${v.length}]`;
        return `[${v.length}] ` + (v.length ? resumir(v[0], d + 1, ruta + '[0]') : '');
      }
      const claves = Object.keys(v);
      if (d >= 4) return `{${claves.length} claves}`;
      return '{' + claves.slice(0, 25).map(k => `${/escal|salida|stair|trampa|jarr|cofre|objeto|mapa|celda|tablero|vist/i.test(k) ? '★' : ''}${k}: ${resumir(v[k], d + 1, ruta + '.' + k)}`).join(', ') + (claves.length > 25 ? ', …' : '') + '}';
    };
    let g = clave ? btn[clave] : null;
    for (let i = 0; g && i < 14; i++, g = g.return) {
      const p = g.memoizedProps;
      if (p && typeof g.type !== 'string' && p.exp && typeof p.exp === 'object') {
        lineas.push('ESTRUCTURA exp: ' + resumir(p.exp).slice(0, 3500));
        if (p.estado && typeof p.estado === 'object') lineas.push('ESTRUCTURA estado: ' + resumir(p.estado).slice(0, 2500));
        break;
      }
    }
    return lineas.join('\n');
  }

  /* ------------------------------------------------------------------ *
   *  PANEL Y ACCIONES
   * ------------------------------------------------------------------ */
  let mostrar = true, explorando = false, combatir = true, recoger = true, msg = '';
  let panel = null;

  function pasos(ruta) { return ruta ? ruta.length - 1 : null; }

  function analizar() {
    const t = leerTablero();
    if (!t) return null;
    const escaleras = [...t.celdas.values()].filter(c => c.tipo === 'escalera');
    const otros = [...[...t.celdas.values()].filter(c => c.tipo === 'otro').map(c => ({ c: c.c, f: c.f, tipo: 'objeto' })), ...t.entidades];
    const ruta = escaleras.length ? rutaA(t, c => c.tipo === 'escalera') : null;
    return { t, escaleras, otros, ruta };
  }

  function pintar() {
    actualizarBarra();
    if (!panel) return;
    const a = analizar();
    const estado = panel.querySelector('.axg-est');
    if (!a) { estado.textContent = 'No veo el tablero.'; return; }
    if (mostrar) dibujar(a.t, a.ruta, a.escaleras, a.otros); else quitarDibujo();
    const partes = [];
    partes.push(a.escaleras.length ? `🪜 Escalera a la vista${a.ruta ? ` · ${pasos(a.ruta)} pasos` : ' (sin camino conocido)'}` : '🪜 Escalera (o arena movediza) aún no descubierta');
    const cuenta = tp => a.otros.filter(o => o.tipo === tp).length;
    if (cuenta('entrenador')) partes.push(`👤 ${cuenta('entrenador')} entrenador(es)`);
    if (cuenta('mercader')) partes.push(`🛒 mercader`);
    if (cuenta('personaje')) partes.push(`🧍 ${cuenta('personaje')} personaje(s)`);
    if (cuenta('remolino')) partes.push(`🌀 ${cuenta('remolino')} remolino(s)`);
    if (cuenta('lapida')) partes.push(`🪦 ${cuenta('lapida')} lápida(s)`);
    if (cuenta('jarron')) partes.push(`🏺 ${cuenta('jarron')} jarrón(es)`);
    if (cuenta('arqueologo')) partes.push('📜 arqueólogo');
    if (cuenta('puerta')) partes.push(`🚪 ${cuenta('puerta')} puerta(s)`);
    if (cuenta('objeto')) partes.push(`✨ ${cuenta('objeto')} objeto(s)`);
    estado.textContent = partes.join(' · ');
    panel.querySelector('.axg-msg').textContent = msg + (ultimaParada && !explorando && msg !== ultimaParada ? ' · Última parada: ' + ultimaParada : '');
    panel.querySelector('[data-a="auto"]').textContent = explorando ? '■ Parar exploración' : '🧭 Explorar hasta la escalera';
  }

  const norm = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  const visible = el => !!(el.offsetParent || el.getClientRects().length);
  const ajeno = el => el.closest('#' + PANEL_ID) || el.closest('#axg-barra');
  const botonesVisibles = () => $$('button').filter(b => !ajeno(b) && visible(b));

  /* ── Kit Aurora 2 · avisos (el mismo aviso con sonido en todos los scripts de Aurora Dex) ── */
  const kEsc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  /* ── Avisos dentro del juego (tarjeta arriba + sonido de 8 bits) ─────────────────────────────────
   * kAviso({ tipo, titulo, texto, lineas, sprite, icono, app, sonido, duracion, fijo, sistema })
   *   tipo: 'exito' · 'fin' · 'info' · 'aviso' · 'error' · 'shiny' · 'legendario'
   *   'info' va sin sonido; 'shiny', 'legendario' y 'error' no se cierran solos.
   *   sistema: notificación del móvil/PC, solo si la pestaña no se está viendo (para no repetir el aviso).
   * El sonido se puede silenciar desde el propio aviso (🔊) y vale para todos los scripts. */
  const K_AVISO = {
    exito: { c: '#2FA84F', f: 'linear-gradient(135deg,#1F8A3E,#3CC065)', i: '✅' },
    fin: { c: '#2FA84F', f: 'linear-gradient(135deg,#1F8A3E,#3CC065)', i: '🏁' },
    info: { c: '#3BA7E0', f: 'linear-gradient(135deg,#1F7FB8,#48B6EC)', i: 'ℹ️' },
    aviso: { c: '#E0A21E', f: 'linear-gradient(135deg,#C07A12,#F0B436)', i: '⚡' },
    error: { c: '#E0473A', f: 'linear-gradient(135deg,#B8322A,#EE5A4B)', i: '⚠️' },
    shiny: { c: '#FFB23E', f: 'linear-gradient(120deg,#FF8A2F,#FFC94A 40%,#FFE9A6 50%,#FFC94A 60%,#FF8A2F)', i: '✨' },
    legendario: { c: '#8B5CF6', f: 'linear-gradient(135deg,#5B21B6,#8B5CF6 55%,#D4A72C)', i: '👑' },
  };
  function kAvisosCSS() {
    if (document.getElementById('k-avisos-css-2')) return;
    const st = document.createElement('style');
    st.id = 'k-avisos-css-2';
    st.textContent = `
      #k-avisos{position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 10px);transform:translateX(-50%);z-index:2147483600;width:min(400px,calc(100vw - 20px));display:flex;flex-direction:column;gap:8px;pointer-events:none;font-family:inherit}
      #k-avisos .k-av{pointer-events:auto;position:relative;overflow:hidden;border-radius:20px;background:rgb(var(--lienzo,255 255 255));color:rgb(var(--tinta-800,33 36 29));border:2px solid color-mix(in srgb,var(--k-c) 55%,rgb(var(--lienzo,255 255 255)));box-shadow:0 4px 0 0 rgba(0,0,0,.08),0 16px 34px -14px rgba(0,0,0,.55),0 0 0 1px rgba(0,0,0,.04);animation:k-av-entra .42s cubic-bezier(.2,1.25,.4,1) both;cursor:default}
      #k-avisos .k-av.k-sale{animation:k-av-sale .28s ease forwards}
      @keyframes k-av-entra{from{opacity:0;transform:translateY(-18px) scale(.94)}to{opacity:1;transform:none}}
      @keyframes k-av-sale{to{opacity:0;transform:translateY(-12px) scale(.96)}}
      @keyframes k-av-tiempo{from{transform:scaleX(1)}to{transform:scaleX(0)}}
      @keyframes k-av-brillo{from{background-position:0% 0}to{background-position:200% 0}}
      @keyframes k-av-chispa{0%,100%{opacity:0;transform:scale(.3) rotate(0)}50%{opacity:1;transform:scale(1) rotate(90deg)}}
      @keyframes k-av-flota{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
      #k-avisos .k-av-cab{position:relative;display:flex;align-items:center;gap:11px;padding:11px 12px 11px 11px;background:var(--k-f);color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.25)}
      #k-avisos .k-av[data-t="shiny"] .k-av-cab{background-size:200% 100%;animation:k-av-brillo 3s linear infinite;color:#4A2600;text-shadow:0 1px 0 rgba(255,255,255,.5)}
      #k-avisos .k-av-ico{position:relative;width:50px;height:50px;flex-shrink:0;border-radius:15px;display:grid;place-items:center;font-size:25px;background:rgba(255,255,255,.24);box-shadow:inset 0 -3px 0 rgba(0,0,0,.12),0 0 0 2px rgba(255,255,255,.35)}
      #k-avisos .k-av-ico img{width:48px;height:48px;image-rendering:pixelated;object-fit:contain;animation:k-av-flota 2.4s ease-in-out infinite;filter:drop-shadow(0 2px 2px rgba(0,0,0,.3))}
      #k-avisos .k-av[data-t="shiny"] .k-av-ico,#k-avisos .k-av[data-t="legendario"] .k-av-ico{box-shadow:0 0 18px rgba(255,236,170,.95),0 0 0 2px rgba(255,255,255,.7)}
      #k-avisos .k-av-chispa{position:absolute;width:10px;height:10px;pointer-events:none;background:radial-gradient(circle,#fff 0 20%,transparent 21%),linear-gradient(0deg,transparent 42%,#fff 42% 58%,transparent 58%),linear-gradient(90deg,transparent 42%,#fff 42% 58%,transparent 58%);animation:k-av-chispa 1.6s ease-in-out infinite}
      #k-avisos .k-av-txt{min-width:0;flex:1}
      #k-avisos .k-av-app{margin:0;font-size:10px;font-weight:900;letter-spacing:.09em;text-transform:uppercase;opacity:.85}
      #k-avisos .k-av-tit{margin:1px 0 0;font-family:var(--font-display),system-ui,sans-serif;font-size:17px;font-weight:800;line-height:1.15}
      #k-avisos .k-av-bts{display:flex;flex-direction:column;gap:5px;align-self:flex-start}
      #k-avisos .k-av-bts button{width:28px;height:28px;border:0;border-radius:999px;display:grid;place-items:center;cursor:pointer;font-size:12px;font-weight:900;color:inherit;background:rgba(0,0,0,.16);text-shadow:none;transition:background .15s}
      #k-avisos .k-av-bts button:hover{background:rgba(0,0,0,.28)}
      #k-avisos .k-av-cuerpo{padding:9px 14px 12px}
      #k-avisos .k-av-cuerpo p{margin:0;font-size:12.5px;font-weight:700;line-height:1.4;color:rgb(var(--tinta-600,72 75 66))}
      #k-avisos .k-av-cuerpo ul{margin:4px 0 0;padding:0;list-style:none;display:grid;gap:3px}
      #k-avisos .k-av-cuerpo li{font-size:11.5px;font-weight:700;color:rgb(var(--tinta-500,99 102 92));padding-left:12px;position:relative}
      #k-avisos .k-av-cuerpo li::before{content:"";position:absolute;left:2px;top:.55em;width:5px;height:5px;border-radius:999px;background:var(--k-c)}
      #k-avisos .k-av-tiempo{position:absolute;left:0;right:0;bottom:0;height:3px;background:var(--k-c);opacity:.75;transform-origin:left;animation:k-av-tiempo var(--k-dur) linear forwards}
      #k-avisos .k-av:hover .k-av-tiempo{animation-play-state:paused}
      @media (prefers-reduced-motion:reduce){#k-avisos *{animation:none!important}}`;
    (document.head || document.documentElement).appendChild(st);
  }
  const kSilencio = () => { try { return localStorage.getItem('aurora-kit-silencio') === '1'; } catch { return false; } };
  let kAudio = null;
  function kCtx() {
    try {
      if (!kAudio) kAudio = new (window.AudioContext || window.webkitAudioContext)();
      if (kAudio.state === 'suspended') kAudio.resume();
      return kAudio;
    } catch { return null; }
  }
  // el navegador no deja sonar nada hasta que tocas la página: se prepara el audio con el primer toque
  try { addEventListener('pointerdown', () => kCtx(), { once: true, capture: true }); } catch { /* nada */ }
  // Sonidos de 8 bits: [frecuencia, inicio (s), duración (s), onda]
  const K_SONIDOS = {
    exito: [[784, 0, .09, 'square'], [988, .09, .09, 'square'], [1175, .18, .09, 'square'], [1568, .27, .22, 'square']],
    fin: [[523, 0, .12, 'square'], [659, .12, .12, 'square'], [784, .24, .12, 'square'], [1047, .36, .3, 'triangle'], [784, .36, .3, 'square']],
    info: [[1175, 0, .06, 'triangle'], [1568, .07, .09, 'triangle']],
    aviso: [[880, 0, .12, 'triangle'], [698, .14, .12, 'triangle'], [880, .3, .12, 'triangle'], [698, .44, .16, 'triangle']],
    error: [[233, 0, .16, 'square'], [185, .18, .3, 'square']],
    shiny: [[1319, 0, .07, 'triangle'], [1760, .07, .07, 'triangle'], [2093, .14, .07, 'triangle'], [2637, .21, .12, 'triangle'], [2093, .36, .07, 'triangle'], [2637, .43, .07, 'triangle'], [3136, .5, .1, 'triangle'], [3520, .6, .28, 'sine']],
    legendario: [[392, 0, .16, 'square'], [523, .16, .16, 'square'], [659, .32, .16, 'square'], [784, .48, .5, 'square'], [523, .48, .5, 'triangle'], [659, .48, .5, 'triangle']],
  };
  function kSonido(nombre) {
    if (kSilencio()) return;
    const notas = K_SONIDOS[nombre];
    const ctx = notas && kCtx();
    if (!ctx) return;
    try {
      const t0 = ctx.currentTime + 0.02, vol = ctx.createGain();
      vol.gain.value = 0.07; vol.connect(ctx.destination);
      for (const [f, ini, dur, onda] of notas) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = onda; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0 + ini);
        g.gain.exponentialRampToValueAtTime(onda === 'square' ? 0.55 : 1, t0 + ini + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + ini + dur);
        o.connect(g); g.connect(vol);
        o.start(t0 + ini); o.stop(t0 + ini + dur + 0.02);
      }
    } catch { /* sin audio */ }
  }
  const kUltimos = new Map();
  function kAviso(o) {
    if (typeof o === 'string') o = { tipo: 'exito', titulo: o };
    const tipo = K_AVISO[o.tipo] ? o.tipo : 'exito', T = K_AVISO[tipo];
    const titulo = String(o.titulo || ''), lineas = (o.lineas || []).filter(Boolean);
    // el mismo aviso dos veces seguidas no se repite
    const clave = tipo + '|' + titulo + '|' + (o.texto || '');
    if (Date.now() - (kUltimos.get(clave) || 0) < 2500) return;
    kUltimos.set(clave, Date.now());
    const importante = tipo === 'shiny' || tipo === 'legendario' || tipo === 'error';
    const fijo = o.fijo ?? importante, dur = o.duracion || (lineas.length ? 9000 : 6000);
    if (o.sonido ?? tipo !== 'info') kSonido(tipo);
    if (importante) { try { navigator.vibrate && navigator.vibrate(tipo === 'error' ? [200, 100, 200] : [300, 120, 300, 120, 500]); } catch { /* nada */ } }
    // tarjeta dentro del juego
    try {
      kAvisosCSS();
      let pila = document.getElementById('k-avisos');
      if (!pila) { pila = document.createElement('div'); pila.id = 'k-avisos'; pila.setAttribute('data-ax-ignore', '1'); pila.setAttribute('aria-live', 'polite'); document.body.appendChild(pila); }
      while (pila.children.length >= 4) pila.firstElementChild.remove();
      const d = document.createElement('div');
      d.className = 'k-av'; d.dataset.t = tipo; d.setAttribute('role', importante ? 'alert' : 'status');
      d.style.setProperty('--k-c', T.c); d.style.setProperty('--k-f', T.f); d.style.setProperty('--k-dur', dur + 'ms');
      const chispas = tipo === 'shiny' || tipo === 'legendario' ? [[4, 6, 0], [40, 2, .5], [36, 38, 1], [2, 40, .9]].map(([x, y, r]) => `<span class="k-av-chispa" style="left:${x}px;top:${y}px;animation-delay:${r}s"></span>`).join('') : '';
      d.innerHTML = `
        <div class="k-av-cab">
          <div class="k-av-ico">${o.sprite ? `<img src="${kEsc(o.sprite)}" alt="">` : kEsc(o.icono || T.i)}${chispas}</div>
          <div class="k-av-txt"><p class="k-av-app">${kEsc(o.app || 'Aurora Dex')}</p><p class="k-av-tit">${kEsc(titulo)}</p></div>
          <div class="k-av-bts"><button type="button" data-k="x" aria-label="Cerrar">✕</button><button type="button" data-k="son" aria-label="Sonido" title="Sonido de los avisos">${kSilencio() ? '🔇' : '🔊'}</button></div>
        </div>
        ${o.texto || lineas.length ? `<div class="k-av-cuerpo">${o.texto ? `<p>${kEsc(o.texto)}</p>` : ''}${lineas.length ? `<ul>${lineas.map(l => `<li>${kEsc(l)}</li>`).join('')}</ul>` : ''}</div>` : ''}
        ${fijo ? '' : '<div class="k-av-tiempo"></div>'}`;
      const cerrar = () => { if (!d.isConnected || d.classList.contains('k-sale')) return; d.classList.add('k-sale'); setTimeout(() => d.remove(), 300); };
      d.querySelector('[data-k="x"]').addEventListener('click', cerrar);
      d.querySelector('[data-k="son"]').addEventListener('click', e => {
        const callar = !kSilencio();
        try { localStorage.setItem('aurora-kit-silencio', callar ? '1' : '0'); } catch { /* nada */ }
        e.currentTarget.textContent = callar ? '🔇' : '🔊';
        if (!callar) kSonido('info');
      });
      const barra = d.querySelector('.k-av-tiempo');
      if (barra) barra.addEventListener('animationend', cerrar);
      pila.appendChild(d);
    } catch { /* sin DOM */ }
    // notificación del sistema: solo si no estás mirando la pestaña
    if ((o.sistema ?? tipo !== 'info') && document.hidden) {
      try {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;
        const icono = new URL(o.sprite || '/icono-app.svg', location.origin).href;
        const opts = { body: [o.texto, ...lineas].filter(Boolean).join('\n'), icon: icono, badge: icono, tag: 'aurora-' + tipo, renotify: true, requireInteraction: importante, silent: true };
        try { new Notification(titulo, opts); }
        catch { if (navigator.serviceWorker) navigator.serviceWorker.getRegistration().then(r => r && r.showNotification(titulo, opts)).catch(() => {}); }
      } catch { /* sin notificaciones */ }
    }
  }
  // Pide permiso de notificaciones (solo al arrancar algo largo: una macro, un bucle…)
  function kPedirPermiso() { try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); } catch { /* nada */ } }

  // Mensaje breve arriba (sin sonido salvo que se pida otro tipo de aviso)
  function toast(texto, ms = 2500, tipo = 'info') { kAviso({ tipo, app: 'Galerías', icono: '⛏️', titulo: texto, duracion: ms + 1500 }); }

  /* ------------------------------------------------------------------ *
   *  PANTALLAS QUE NO SON EL TABLERO: mercader, combate y captura
   * ------------------------------------------------------------------ */
  const RE_BOLA = /poke ?ball|super ?ball|ultra ?ball|master ?ball/;
  const tipoBola = txt => /master/.test(txt) ? 'master' : /ultra/.test(txt) ? 'ultra' : /super/.test(txt) ? 'super' : 'poke';
  const RE_SHINY = /shiny|shinny|variocolor|cromatic|brillante|✨/;
  const RE_LEGENDARIO = /legendari|legendary/;

  // Ventana de captura: botones de Poké/Super/Ultra/Master Ball juntos
  function ventanaCaptura() {
    const bolas = botonesVisibles().filter(b => RE_BOLA.test(norm(b.textContent)));
    if (bolas.length < 2) return null;
    const hoja = bolas[0].closest('div.overflow-y-auto') || bolas[0].closest('div.fixed') || bolas[0].parentElement.parentElement;
    return { bolas, hoja };
  }

  // Lee si el Pokémon de la ventana es variocolor o legendario (mismas señales que la macro de captura)
  function leerRareza(hoja) {
    const imgs = $$('img[src*="/sprites/"]', hoja);
    const sprite = imgs.sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];
    const pastillas = $$('.pastilla,[class*="rounded-pill"]', hoja).map(e => norm(e.textContent)).filter(t => t && t.length <= 40);
    const h3 = hoja.querySelector('h3');
    const textos = [...pastillas, h3 ? norm(h3.textContent) : '', sprite ? norm(sprite.alt) : ''];
    const shiny = (!!sprite && /\/sprites\/shiny\//.test(sprite.getAttribute('src') || '')) || textos.some(t => RE_SHINY.test(t));
    const legendario = textos.some(t => RE_LEGENDARIO.test(t));
    return { shiny, legendario, nombre: sprite ? sprite.alt : '?', sprite: sprite ? sprite.getAttribute('src') : null };
  }

  let ultimaCaptura = { clave: '', n: 0 };
  async function atenderCaptura() {
    const v = ventanaCaptura();
    if (!v) { ultimaCaptura = { clave: '', n: 0 }; return false; }
    const r = leerRareza(v.hoja);
    const rara = r.shiny || r.legendario;
    // Variocolor o legendario: la macro se PARA del todo, avisa (mensaje + una vibración) y deja la ventana abierta
    // para que la captura la hagas tú a mano (con Master Ball). Luego se vuelve a activar la macro.
    if (rara) {
      const texto = `${r.shiny ? '✨ ¡VARIOCOLOR!' : '👑 ¡LEGENDARIO!'} ${r.nombre}: captúralo tú. Macro parada.`;
      explorando = false;
      msg = texto;
      kAviso({ tipo: r.shiny ? 'shiny' : 'legendario', app: 'Galerías', titulo: `¡${r.shiny ? 'Variocolor' : 'Legendario'}: ${r.nombre}!`, sprite: r.sprite, lineas: ['Captúralo tú (mejor con Master Ball).', 'He parado la exploración.'] });
      pintar();
      return true;                                           // se para: el bucle acaba en esta vuelta
    }
    const b = v.bolas.find(x => tipoBola(norm(x.textContent)) === 'poke' && !x.disabled);
    if (!b) { msg = `No tengo Poké Ball disponible para ${r.nombre}.`; pintar(); return false; }
    const clave = r.nombre + '|n';
    if (ultimaCaptura.clave === clave) ultimaCaptura.n++; else ultimaCaptura = { clave, n: 1 };
    if (ultimaCaptura.n > 12) { explorando = false; msg = `No consigo capturar a ${r.nombre}. Parado.`; return false; }
    msg = `${r.nombre}: Poké Ball`;
    pintar();
    await pausa(350, 650);
    b.click();
    await pausa(900, 1400);
    return true;
  }

  // Pantalla de combate: «SEGUIR» hasta acabar (y «Continuar/Aceptar» de los cierres)
  async function atenderCombate() {
    const b = botonesVisibles().find(x => !x.disabled && /^\s*(seguir|continuar|aceptar)\s*$/i.test(x.textContent || ''));
    if (!b) return false;
    msg = '⚔️ Combate: sigo…';
    pintar();
    await pausa(500, 900);
    b.click();
    await pausa(700, 1100);
    return true;
  }

  // Si se ha abierto la ventana del mercader nómada, se cierra y se sigue
  // Plantas con «Puerta de la Canción»: hay que abrirla antes de bajar
  const PLANTAS_PUERTA = new Set([5, 10, 13, 16, 20, 23, 26, 30, 33, 36, 39]);   // todas las cámaras (canción, runas, suelo pulido)
  const escFallo = {};                           // planta → la escalera no se alcanza con clics: se explora por otro lado
  let ultimaPuerta = 0;
  const puertaIntentos = {};
  const puertaFin = {};                          // planta → puerta abierta o descartada (faltan pistas / no aparece)
  const numPlanta = () => {
    const el = $$('main span, main p, main h1, main h2').find(x => !ajeno(x) && !x.children.length && /^\s*planta\s+\d+\s*$/i.test(x.textContent || ''));
    const m = ((el && el.textContent) || plantaActual()).match(/(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  };
  const camaraPendiente = () => { const n = numPlanta(); return n != null && PLANTAS_PUERTA.has(n) && !puertaFin[plantaActual()]; };
  let traducciones = 0;
  async function despedirse() {
    const b = botonesVisibles().find(x => !x.disabled && /^\s*Despedirse\s*$/i.test(x.textContent || ''));
    if (!b) return false;
    // El arqueólogo: se le pide traducir todo lo que pueda (el botón se desactiva cuando ya no queda nada) y luego se despide
    const trad = botonesVisibles().find(x => !x.disabled && /📜|traduc/i.test(x.textContent || '') && !/no le queda/i.test(x.textContent || ''));
    if (trad && (++traducciones) <= 12) {
      msg = '📜 El arqueólogo traduce la canción…'; pintar();
      await pausa(500, 900);
      trad.click();
      await pausa(700, 1100);
      return true;
    }
    traducciones = 0;
    const quien = ($$('h3').map(h => h.textContent.trim()).find(t => /mercader|nomada|nómada/i.test(t))) || 'ventana';
    b.click();
    msg = `Despedido de «${quien}»; sigo buscando la escalera.`;
    pintar();
    await sleep(350);
    return true;
  }

  /* ---- Puerta con acertijo: cuatro símbolos en orden según las líneas de las lápidas ---- */
  const ORDINALES = [[/\bprimer[oa]?\b/, 1], [/\bsegund[oa]\b/, 2], [/\btercer[oa]?\b/, 3], [/\bcuart[oa]\b/, 4]];
  const sinArticulo = s => norm(s).replace(/^(el|la|los|las)\s+/, '');
  // Templo de las Runas: apagar/encender con las cuatro vecinas (Lights Out); se busca la combinación con menos toques
  async function atenderRunas(manual = false) {
    const runas = () => botonesVisibles().filter(b => /^Runa \d+, (encendida|apagada)/.test(b.getAttribute('aria-label') || ''));
    const rs = runas();
    const n = rs.length, lado = Math.round(Math.sqrt(n));
    if (n < 4 || lado * lado !== n) return false;
    const estado = rs.map(b => /encendida/.test(b.getAttribute('aria-label')));
    const efecto = i => {                          // máscara de las casillas que cambian al tocar i
      let m = 1 << i; const c = i % lado, f = Math.floor(i / lado);
      if (c > 0) m |= 1 << (i - 1);
      if (c < lado - 1) m |= 1 << (i + 1);
      if (f > 0) m |= 1 << (i - lado);
      if (f < lado - 1) m |= 1 << (i + lado);
      return m;
    };
    const efectos = Array.from({ length: n }, (_, i) => efecto(i));
    let falta = 0;                                 // casillas apagadas que hay que cambiar
    estado.forEach((on, i) => { if (!on) falta |= 1 << i; });
    let mejor = null;
    for (let mask = 0; mask < (1 << n); mask++) {
      let r = 0, k = 0;
      for (let i = 0; i < n; i++) if (mask & (1 << i)) { r ^= efectos[i]; k++; }
      if (r === falta && (mejor === null || k < mejor.k)) mejor = { mask, k };
    }
    const planta = plantaActual();
    if (!mejor && manual) { toast('Esta combinación de runas no tiene solución', 3500); return true; }
    if (!mejor) {
      msg = '🚪 Runas: esta combinación no tiene solución; la dejo.'; pintar();
      puertaFin[planta] = true;
      const b = botonesVisibles().find(x => /^\s*dejarlo para luego/i.test(norm(x.textContent))) || botonesVisibles().find(x => x.getAttribute('aria-label') === 'Cerrar');
      if (b) b.click();
      await sleep(400);
      return true;
    }
    msg = `🚪 Runas: ${mejor.k} toques para encenderlas todas.`; pintar();
    for (let i = 0; i < n && (explorando || manual); i++) {
      if (!(mejor.mask & (1 << i))) continue;
      const b = runas().find(x => new RegExp('^Runa ' + (i + 1) + ',').test(x.getAttribute('aria-label')));
      if (!b) break;
      await pausa(250, 450);
      b.click();
    }
    puertaFin[planta] = true;
    await pausa(900, 1400);
    // Si tras abrirla sale una ventana de cierre/recompensa, se acepta
    const fin = botonesVisibles().find(x => !x.disabled && /^\s*(recoger|reclamar|coger|continuar|aceptar|cerrar|genial|vale|ok)\b/i.test(norm(x.textContent)));
    if (fin && !runas().length) { fin.click(); await sleep(400); }
    return true;
  }

  // Espejo del Sol / Suelo Pulido: en las losas se resbala hasta chocar (roca o borde), la arena frena y hay que llegar al pedestal.
  // Se busca el camino con menos movimientos (BFS) y se replanifica tras cada movimiento por si alguna regla difiere.
  async function atenderPatinaje(manual = false) {
    const boton = d => botonesVisibles().find(b => (b.getAttribute('aria-label') || '') === 'Resbalar hacia ' + d);
    if (!boton('arriba')) return false;
    const DIRS = { arriba: [0, -1], abajo: [0, 1], izquierda: [-1, 0], derecha: [1, 0] };
    const leer = () => {
      const ref = $$('span.absolute').find(x => /castillo\/(losa|monton|pedestal)/.test(x.style.backgroundImage || ''));
      if (!ref) return null;
      const w = parseFloat(ref.style.width) || 33;
      const S = { rocas: new Set(), arena: new Set(), pedestal: null, yo: null, cols: 0, filas: 0 };
      for (const el of ref.parentElement.children) {
        const bg = el.style.backgroundImage || '', l = parseFloat(el.style.left), t = parseFloat(el.style.top);
        if (Number.isNaN(l) || Number.isNaN(t)) continue;
        const c = Math.round(l / w), f = Math.round(t / w);
        if (/personajes\//.test(bg)) { S.yo = { c, f: f + Math.round((parseFloat(el.style.height) || w) / w) - 1 }; continue; }
        S.cols = Math.max(S.cols, c + 1); S.filas = Math.max(S.filas, f + 1);
        if (/deco-roca/.test(bg)) S.rocas.add(c + ',' + f);
        else if (/monton/.test(bg)) S.arena.add(c + ',' + f);
        else if (/pedestal/.test(bg)) S.pedestal = { c, f };
      }
      return S.yo && S.pedestal ? S : null;
    };
    const resbalar = (S, p, [dc, df]) => {                       // → { c, f, meta } o null si no se mueve
      let c = p.c, f = p.f;
      for (;;) {
        const nc = c + dc, nf = f + df;
        if (nc < 0 || nf < 0 || nc >= S.cols || nf >= S.filas || S.rocas.has(nc + ',' + nf)) break;
        c = nc; f = nf;
        if (c === S.pedestal.c && f === S.pedestal.f) return { c, f, meta: true };
        if (S.arena.has(c + ',' + f)) break;
      }
      return c === p.c && f === p.f ? null : { c, f, meta: false };
    };
    const buscar = (S, maxMov) => {
      const ini = S.yo.c + ',' + S.yo.f;
      const prev = new Map([[ini, null]]);
      let nivel = [S.yo];
      for (let n = 1; n <= maxMov && nivel.length; n++) {
        const sig = [];
        for (const p of nivel) for (const d of Object.keys(DIRS)) {
          const r = resbalar(S, p, DIRS[d]);
          if (!r) continue;
          const k = r.c + ',' + r.f;
          if (prev.has(k)) continue;
          prev.set(k, { de: p.c + ',' + p.f, d });
          if (r.meta) { const ruta = []; for (let x = k; prev.get(x); x = prev.get(x).de) ruta.push(prev.get(x).d); return ruta.reverse(); }
          sig.push(r);
        }
        nivel = sig;
      }
      return null;
    };
    const restantes = () => { const m = (document.body.textContent || '').match(/(\d+) de (\d+) movimientos/); return m ? parseInt(m[2], 10) - parseInt(m[1], 10) : 99; };
    let reiniciado = false;
    for (let it = 0; it < 25 && (explorando || manual); it++) {
      const S = leer();
      if (!S) break;                                              // la ventana se ha cerrado
      if (S.yo.c === S.pedestal.c && S.yo.f === S.pedestal.f) break;
      const ruta = buscar(S, restantes());
      if (!ruta) {
        const ini = botonesVisibles().find(x => !x.disabled && /al principio/i.test(x.textContent || ''));
        if (ini && !reiniciado) { reiniciado = true; ini.click(); await pausa(500, 800); continue; }
        if (manual) { toast('No encuentro camino al pedestal con los movimientos que quedan', 3500); return true; }
        msg = '🚪 Suelo pulido: sin camino al pedestal; lo dejo.'; pintar();
        puertaFin[plantaActual()] = true;
        const c = botonesVisibles().find(x => /^\s*dejarlo para luego/i.test(norm(x.textContent))) || botonesVisibles().find(x => x.getAttribute('aria-label') === 'Cerrar');
        if (c) c.click();
        await sleep(400);
        return true;
      }
      msg = `🚪 Suelo pulido: ${ruta.length} movimiento(s) hasta el pedestal.`; pintar();
      const b = boton(ruta[0]);
      if (!b || b.disabled) break;
      await pausa(300, 500);
      b.click();
      await pausa(500, 800);
    }
    puertaFin[plantaActual()] = true;
    await pausa(700, 1100);
    const fin = botonesVisibles().find(x => !x.disabled && /^\s*(recoger|reclamar|coger|continuar|aceptar|cerrar|genial|vale|ok)\b/i.test(norm(x.textContent)));
    if (fin && !boton('arriba')) { fin.click(); await sleep(400); }
    return true;
  }

  async function atenderPuerta(manual = false) {
    if (await atenderRunas(manual)) return true;
    if (await atenderPatinaje(manual)) return true;
    const huecos = botonesVisibles().filter(b => /^Hueco \d/.test(b.getAttribute('aria-label') || ''));
    if (huecos.length < 2) {
      // Recién chocada una puerta y se abre una ventana que no conozco (runas, suelo pulido…): me paro para que me pases su HTML
      const cerrar = Date.now() - ultimaPuerta < 8000 && botonesVisibles().find(x => x.getAttribute('aria-label') === 'Cerrar');
      if (!cerrar) return false;
      puertaFin[plantaActual()] = true; ultimaPuerta = 0;
      explorando = false;
      const ventana = cerrar.closest('div.overflow-y-auto') || cerrar.parentElement;
      console.log('[axg] ventana de puerta desconocida:', ventana && ventana.outerHTML);
      msg = '🚪 Puerta de otro tipo: parado. Copia el HTML de la ventana y pásamelo.'; kAviso({ tipo: 'aviso', app: 'Galerías', icono: '🚪', titulo: 'Puerta de otro tipo: parado', texto: 'No conozco esta ventana. Copia su HTML y pásamelo.' }); pintar();
      return true;
    }
    const simbolos = botonesVisibles().filter(b => !b.getAttribute('aria-label') && b.querySelector('span.capitalize') && !ajeno(b));
    const nombres = simbolos.map(b => sinArticulo(b.querySelector('span.capitalize').textContent));
    const crudas = $$('li').filter(li => visible(li) && !ajeno(li)).map(li => (li.textContent || '').normalize('NFD').replace(/[̀-ͯ]/g, ''));
    const sol = new Array(huecos.length).fill(null);
    // El símbolo va con mayúscula en la frase («el Cocodrilo»); «el sol se puso» en minúscula es solo decoración
    const cand = [];
    for (const l of crudas) {
      const ord = ORDINALES.find(([re]) => re.test(l.toLowerCase()));
      if (!ord || ord[1] > sol.length) continue;
      let ns = nombres.filter(n => new RegExp('\\b' + n[0].toUpperCase() + n.slice(1) + '\\b').test(l));
      if (!ns.length) ns = nombres.filter(n => new RegExp('\\b' + n + '\\b', 'i').test(l));
      cand.push({ pos: ord[1] - 1, ns });
    }
    for (let vuelta = 0; vuelta < 4; vuelta++) {                // se descartan los símbolos ya asignados a otro puesto
      for (const c of cand) {
        const libres = c.ns.filter(n => !sol.some((x, i) => x === n && i !== c.pos));
        if (libres.length === 1) sol[c.pos] = libres[0];
      }
    }
    const cerrarPuerta = async () => {
      const b = botonesVisibles().find(x => /^\s*dejarlo para luego/i.test(norm(x.textContent))) || botonesVisibles().find(x => x.getAttribute('aria-label') === 'Cerrar');
      if (b) b.click();
      await sleep(400);
    };
    if (sol.some(x => x === null) || new Set(sol).size !== sol.length) {
      msg = `🚪 Puerta: solo conozco ${sol.filter(Boolean).length} de ${sol.length} símbolos; la dejo para luego.`; pintar();
      if (manual) { toast(`Solo conozco ${sol.filter(Boolean).length} de ${sol.length} símbolos`, 3500); return true; }
      puertaFin[plantaActual()] = true;          // faltan pistas: no se insiste, se baja
      await cerrarPuerta();
      return true;
    }
    msg = `🚪 Puerta: canto ${sol.join(', ')}.`; pintar();
    for (const n of sol) {
      const b = simbolos[nombres.indexOf(n)];
      if (!b) { await cerrarPuerta(); return true; }
      await pausa(300, 500); b.click();
    }
    await pausa(400, 700);
    const cantar = botonesVisibles().find(x => !x.disabled && /cantar ante la puerta/i.test(norm(x.textContent)));
    if (cantar) { cantar.click(); puertaIntentos[plantaActual()] = (puertaIntentos[plantaActual()] || 0) + 1; if (puertaIntentos[plantaActual()] >= 2) puertaFin[plantaActual()] = true; await pausa(900, 1400); const sigue = botonesVisibles().some(x => /cantar ante la puerta/i.test(norm(x.textContent))); if (!sigue) puertaFin[plantaActual()] = true; } else await cerrarPuerta();
    return true;
  }

  const atenderPantallas = async () => (await atenderCaptura()) || (await despedirse()) || (await atenderPuerta()) || (await atenderCombate());

  /* ------------------------------------------------------------------ *
   *  ANTORCHA: cuando quedan pocos pasos, Frasco de aceite; sin aceite, Cuerda. El agua no se usa.
   * ------------------------------------------------------------------ */
  const LS_LUZ = 'axg_luz_min';
  const umbralLuz = () => { const n = parseInt((() => { try { return localStorage.getItem(LS_LUZ); } catch { return ''; } })(), 10); return Number.isFinite(n) && n >= 0 ? n : 15; };

  // «154 pasos» junto a la llama de la cabecera
  function leerLuz() {
    const el = $$('span').find(s => !ajeno(s) && !s.children.length && /^\s*\d+\s*pasos\s*$/i.test(s.textContent || ''));
    return el ? parseInt(el.textContent, 10) : null;
  }
  const botonObjeto = re => botonesVisibles().find(b => re.test(norm(b.textContent)) && b.closest('main'));

  let usoLuz = { antes: null, n: 0 }, cuerdaUsada = '';
  async function gestionarLuz() {
    const luz = leerLuz();
    if (luz == null || luz > umbralLuz()) { usoLuz = { antes: null, n: 0 }; return false; }
    const aceite = botonObjeto(/aceite/);
    if (aceite && !aceite.disabled) {
      if (usoLuz.antes !== null && luz <= usoLuz.antes) usoLuz.n++; else usoLuz.n = 0;   // ¿funcionó el último?
      if (usoLuz.n < 3) {
        usoLuz.antes = luz;
        msg = `🪔 Quedan ${luz} pasos: uso un Frasco de aceite.`; pintar();
        aceite.click();
        await sleep(600);
        return true;
      }
    }
    const cuerda = botonObjeto(/cuerda/);
    const sinAceite = !aceite || aceite.disabled || usoLuz.n >= 3;
    const clave = plantaActual();
    if (sinAceite && cuerda && !cuerda.disabled && cuerdaUsada !== clave) {
      cuerdaUsada = clave;
      toast(`Sin aceite y ${luz} pasos: uso la cuerda`);
      msg = `🪢 Sin aceite y quedan ${luz} pasos: uso la Cuerda.`; pintar();
      cuerda.click();
      await sleep(800);
      return true;
    }
    return false;
  }

  /* ------------------------------------------------------------------ *
   *  MOVIMIENTO Y EXPLORACIÓN AUTOMÁTICA
   * ------------------------------------------------------------------ */
  const plantaActual = () => ((document.querySelector('h1') || {}).textContent || '').replace(/\s+/g, ' ').trim();
  // Un paso con las flechas del juego («Andar hacia arriba/abajo/izquierda/derecha»)
  async function andar(dc, df) {
    const dir = dc > 0 ? 'derecha' : dc < 0 ? 'izquierda' : df > 0 ? 'abajo' : 'arriba';
    const b = $$('button').find(x => (x.getAttribute('aria-label') || '') === 'Andar hacia ' + dir);
    if (!b || b.disabled) return false;
    b.click();
    return true;
  }

  const combatidos = new Set();
  const MAX_REMOLINOS = 5;                       // por planta, por si un remolino no desapareciera tras usarlo
  const MAX_JARRONES = 20;
  const puertaVisitas = {};                      // planta|puerta → nº de tumbas leídas la última vez que se probó
  const MAX_LAPIDAS = 4;                         // por planta

  const tumbasVistas = new Set();                // cada tumba se chequea una sola vez (planta|columna,fila)
  let tumbasLeidas = 0;                         // el propio juego apunta las líneas leídas («Lo que has leído esta semana»)
  let contadoresPlanta = { planta: '', remolino: 0, jarron: 0, lapida: 0, puerta: 0, arqueologo: 0 };

  async function clicCelda(cel, t) {
    const antes = t.jugador ? `${t.jugador.c},${t.jugador.f}` : '';
    cel.btn.click();
    const t0 = Date.now();
    while (Date.now() - t0 < 4000 && explorando) {
      await sleep(120);
      const n = leerTablero();
      if (!n) return true;                                   // otra pantalla (combate, ventana…)
      if (ventanaCaptura() || botonesVisibles().some(x => /^\s*(despedirse|seguir)\s*$/i.test(x.textContent || ''))) return true;
      // el tablero se desplaza con la cámara: se considera hecho cuando cambia lo que se ve
      const firma = [...n.celdas.values()].map(c => c.tipo[0]).join('');
      const firmaAntes = [...t.celdas.values()].map(c => c.tipo[0]).join('');
      if (firma !== firmaAntes || (n.jugador && `${n.jugador.c},${n.jugador.f}` !== antes)) return true;
    }
    return false;
  }

  // Sin zonas nuevas a la vista: si un entrenador, personaje, lápida… está pegado a la niebla, se choca con él (máx. 3 veces cada uno)
  const bloqueadores = {};
  async function empujarBloqueador(t) {
    if (!t.jugador) return false;
    const planta = plantaActual();
    const clave = e => planta + '|' + e.c + ',' + e.f;
    let mejor = null;
    for (const e of t.entidades) {
      if (e.tipo === 'objeto' || e.tipo === 'movediza' || (bloqueadores[clave(e)] || 0) >= 3) continue;
      if (!VECINOS.some(([dc, df]) => { const c = t.celdas.get((e.c + dc) + ',' + (e.f + df)); return c && c.tipo === 'niebla'; })) continue;
      const dist = Math.abs(e.c - t.jugador.c) + Math.abs(e.f - t.jugador.f);
      const r = dist === 1 ? [null] : rutaA(t, c => c.pisable && !t.ocupadas.has(c.c + ',' + c.f) && Math.abs(c.c - e.c) + Math.abs(c.f - e.f) === 1);
      if (r && (!mejor || r.length < mejor.r.length)) mejor = { e, r, dist };
    }
    if (!mejor) return false;
    const { e, r, dist } = mejor;
    msg = `Algo tapa el paso (${e.tipo}): pruebo a chocar con ello…`; pintar();
    if (dist === 1) { bloqueadores[clave(e)] = (bloqueadores[clave(e)] || 0) + 1; await andar(e.c - t.jugador.c, e.f - t.jugador.f); await pausa(900, 1300); return true; }
    if (r.length > 1) { await clicCelda(r[r.length - 1], t); await pausa(700, 1100); return true; }
    return false;
  }

  let ultimaParada = '';
  async function explorar() {
    if (explorando) { explorando = false; msg = 'Exploración parada.'; pintar(); return; }
    explorando = true;
    mostrarPildora(true);
    { const pl = plantaActual(); delete puertaFin[pl]; delete puertaIntentos[pl]; delete escFallo[pl]; for (const k of Object.keys(puertaVisitas)) if (k.startsWith(pl + '|')) delete puertaVisitas[k]; if (contadoresPlanta.planta === pl) contadoresPlanta.puerta = 0; }
    let sinCambio = 0, sinPantalla = 0;
    while (explorando) {
      if (await atenderPantallas()) { sinPantalla = 0; continue; }
      const t = leerTablero();
      if (!t) {                                               // ni tablero ni pantalla conocida: se espera un poco
        if (++sinPantalla > 60) { msg = 'No reconozco la pantalla. Parado.'; break; }
        await sleep(200);
        continue;
      }
      sinPantalla = 0;
      if (await gestionarLuz()) continue;

      // Objetivos con los que chocar: entrenadores (combate), remolinos (encuentro salvaje) y jarrones (reliquias)
      if (combatir || recoger) {
        const planta = plantaActual();
        if (contadoresPlanta.planta !== planta) contadoresPlanta = { planta, remolino: 0, jarron: 0, lapida: 0, puerta: 0, arqueologo: 0 };
        let mejor = null;
        for (const fase of [0, 1]) {                            // primero todo lo demás (tumbas, arqueólogo…); la puerta, la última
        for (const e of t.entidades) {
          if ((fase === 0) === (e.tipo === 'puerta')) continue;
          const ok =
            (combatir && e.tipo === 'entrenador' && !combatidos.has(planta + '|' + e.nombre + '|' + e.c + ',' + e.f)) ||
            (combatir && e.tipo === 'remolino' && contadoresPlanta.remolino < MAX_REMOLINOS) ||
            (recoger && e.tipo === 'jarron' && contadoresPlanta.jarron < MAX_JARRONES) ||
            (recoger && e.tipo === 'lapida' && contadoresPlanta.lapida < MAX_LAPIDAS && !tumbasVistas.has(planta + '|' + e.c + ',' + e.f)) ||
            (recoger && e.tipo === 'arqueologo' && contadoresPlanta.arqueologo < 2) ||
            (recoger && e.tipo === 'puerta' && contadoresPlanta.puerta < 3 && !puertaFin[planta] && puertaVisitas[planta + '|' + e.nombre] !== tumbasLeidas);
          if (!ok) continue;
          const yo = t.jugador;
          const dist = yo ? Math.abs(e.c - yo.c) + Math.abs(e.f - yo.f) : 99;
          const ady = c => c.pisable && !t.ocupadas.has(c.c + ',' + c.f) && Math.abs(c.c - e.c) + Math.abs(c.f - e.f) === 1;
          const r = dist === 1 ? [null] : rutaA(t, ady);          // ya al lado, o ruta hasta una casilla contigua
          if (r && (!mejor || r.length < mejor.r.length)) mejor = { e, r, dist };
        }
        if (mejor) break;
        }
        if (mejor) {
          const { e, r, dist } = mejor;
          const TXT = {
            entrenador: ['⚔️ Reto a un entrenador…', '⚔️ Me acerco a un entrenador…'],
            remolino: ['🌀 Piso el remolino (encuentro salvaje)…', '🌀 Me acerco a un remolino…'],
            jarron: ['🏺 Rompo un jarrón…', '🏺 Voy a por un jarrón…'],
            lapida: ['🪦 Leo una tumba…', '🪦 Voy a leer una tumba…'],
            arqueologo: ['📜 Hablo con el arqueólogo…', '📜 Voy a ver al arqueólogo…'],
            puerta: ['🚪 Pruebo la puerta…', '🚪 Voy a la puerta…'],
          }[e.tipo];
          if (dist === 1) {
            // Al lado: se choca con la flecha (pulsar la casilla solo lleva hasta el borde)
            if (e.tipo === 'entrenador') combatidos.add(planta + '|' + e.nombre + '|' + e.c + ',' + e.f); else contadoresPlanta[e.tipo]++;
            msg = TXT[0]; pintar();
            if (e.tipo === 'puerta') ultimaPuerta = Date.now();
            if (e.tipo === 'puerta') puertaVisitas[planta + '|' + e.nombre] = tumbasLeidas;
            if (await andar(e.c - t.jugador.c, e.f - t.jugador.f)) {
              if (e.tipo === 'lapida') { tumbasVistas.add(planta + '|' + e.c + ',' + e.f); tumbasLeidas++; await pausa(500, 800); const c = botonesVisibles().find(x => x.getAttribute('aria-label') === 'Cerrar' || /^\s*(cerrar|entendido|ok|vale)\s*$/i.test(x.textContent || '')); if (c) c.click(); }
              await pausa(900, 1300); continue;
            }
          } else if (r.length > 1) {
            msg = TXT[1]; pintar();
            await clicCelda(r[r.length - 1], t);
            await pausa(700, 1100);
            continue;
          }
        }
      }

      // En las plantas con puerta de canción no se baja hasta abrirla: se sigue explorando (sin escalera) hasta encontrarla
      const esperaPuerta = camaraPendiente();
      let esc = esperaPuerta || escFallo[plantaActual()] ? null : [...t.celdas.values()].find(c => c.tipo === 'escalera');
      let r = esc ? rutaA(t, c => c.tipo === 'escalera') : null;
      // Si el camino a la escalera pasa por un personaje que no se mueve (arqueólogo, mercader, puerta, lápida…), no vale: se busca otra ruta
      if (r && r.slice(1, -1).some(c => { const en = t.entidades.find(x => x.c === c.c && x.f === c.f); return en && !['entrenador', 'remolino', 'objeto', 'movediza'].includes(en.tipo); })) { esc = null; r = null; }
      if (esc) {
        if (r && r.length > 1) {
          msg = `Escalera a ${pasos(r)} pasos: voy.`; pintar();
          const dc = esc.c - t.jugador.c, df = esc.f - t.jugador.f;
          if (esc.movediza && Math.abs(dc) + Math.abs(df) === 1) { await andar(dc, df); await pausa(900, 1300); continue; }   // al lado: se pisa con la flecha
          if (!(await clicCelda(esc, t))) sinCambio++; else sinCambio = 0;
          if (sinCambio > 2) { escFallo[plantaActual()] = true; sinCambio = 0; msg = 'No llego a la escalera: busco otra ruta.'; }
          continue;
        }
        msg = '🪜 Ya estás en la escalera o sin camino. Parado.'; break;
      }
      const meta = rutaA(t, esFrontera(t));
      if ((!meta || meta.length < 2) && esperaPuerta) { puertaFin[plantaActual()] = true; continue; }   // no aparece la puerta: se baja igualmente
      if ((!meta || meta.length < 2) && (await empujarBloqueador(t))) continue;   // algo tapa el paso hacia la niebla: se prueba a chocar con ello
      if (!meta || meta.length < 2) { msg = 'No queda nada por explorar desde aquí (sin ruta a zonas nuevas). Parado.'; console.log('[axg] parado: sin frontera', t.jugador, t.entidades); break; }
      msg = esperaPuerta ? `🚪 Planta con puerta: busco la puerta… (${pasos(meta)} pasos)` : `Explorando… (${pasos(meta)} pasos al siguiente hueco)`; pintar();
      const destino = meta[meta.length - 1];
      if (!(await clicCelda(destino, t))) { if (++sinCambio > 3) { msg = 'El juego no responde a los clics. Parado.'; break; } } else sinCambio = 0;
      await pausa(600, 1000);
    }
    if (msg && msg !== 'Exploración parada.') ultimaParada = msg;
    // se ha parado sola: aviso (los variocolor, legendarios y puertas raras ya avisan al momento)
    if (msg && msg !== 'Exploración parada.' && !/VARIOCOLOR|LEGENDARIO|Puerta de otro tipo/i.test(msg)) {
      const llegada = /^🪜/.test(msg), nada = /No queda nada/.test(msg);
      kAviso({ tipo: llegada ? 'fin' : nada ? 'aviso' : 'error', app: 'Galerías', icono: llegada ? '🪜' : '⛏️', titulo: llegada ? 'Has llegado a la escalera' : nada ? 'No queda nada por explorar' : 'La exploración se ha parado', texto: llegada || nada ? null : msg, lineas: [plantaActual() || null] });
    }
    explorando = false;
    mostrarPildora(false);
    pintar();
  }

  // Barra integrada en la página (con las tarjetas del propio juego): estado de la macro y botón de parar.
  // Va arriba del contenido y sigue visible durante los combates, cuando el tablero desaparece.
  function mostrarPildora(si) {
    let b = document.getElementById('axg-barra');
    if (!si) { if (b) b.remove(); return; }
    if (b) return;
    b = document.createElement('div');
    b.id = 'axg-barra';
    b.className = 'tarjeta flex items-center gap-2 p-2';
    b.setAttribute('data-ax-ignore', '1');
    b.innerHTML = '<span aria-hidden="true">🧭</span><span class="axg-b-msg min-w-0 flex-1 truncate text-[11px] font-bold text-tinta-500"></span>' +
      '<button type="button" class="boton-secundario shrink-0 !px-3 !py-1.5 text-[11px]">■ Parar</button>';
    b.querySelector('button').addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); explorando = false; msg = 'Exploración parada.'; actualizarBarra(); });
    const contenedor = document.querySelector('main main') || document.querySelector('main');
    if (contenedor) contenedor.insertBefore(b, contenedor.firstChild); else document.body.prepend(b);
    actualizarBarra();
  }
  function actualizarBarra() {
    const b = document.getElementById('axg-barra');
    if (!b) return;
    const t = b.querySelector('.axg-b-msg');
    if (t && t.textContent !== msg) t.textContent = msg || 'Explorando…';
    // si el contenedor cambió (otra pantalla), se vuelve a colgar arriba
    const contenedor = document.querySelector('main main') || document.querySelector('main');
    if (contenedor && b.parentElement !== contenedor) contenedor.insertBefore(b, contenedor.firstChild);
  }

  function construirPanel() {
    const sec = document.createElement('section');
    sec.id = PANEL_ID;
    sec.className = 'tarjeta space-y-2 p-3';
    sec.setAttribute('data-ax-ignore', '1');
    sec.innerHTML = `
      <p class="font-display text-sm font-extrabold">🪜 Galerías · escalera, combates y capturas</p>
      <p class="axg-est text-[11px] font-bold text-tinta-500"></p>
      <div class="grid grid-cols-2 gap-2">
        <button type="button" class="boton-suave !py-2 text-[11px]" data-a="ver">👁 Camino: sí</button>
        <button type="button" class="boton-suave !py-2 text-[11px]" data-a="combatir">⚔️ Combatir: sí</button>
        <button type="button" class="boton-suave col-span-2 !py-2 text-[11px]" data-a="recoger">🏺 Jarrones y tumbas: sí</button>
      </div>
      <label class="flex items-center justify-between gap-2 text-[11px] font-extrabold text-tinta-500">🪔 Aceite (o cuerda si no queda) con ≤
        <input type="number" min="0" class="axg-luz w-20 rounded-card border-2 border-crema-200 bg-crema-50 px-2 py-1 text-sm font-semibold text-tinta-600 outline-none"> pasos</label>
      <button type="button" class="boton-principal w-full !py-2 text-[11px]" data-a="auto"></button>
      <p class="text-[10px] font-semibold text-tinta-400">Al explorar: combate a todos los entrenadores (pulsa SEGUIR), pisa los remolinos (encuentro salvaje), captura con Poké Ball a todos los Pokémon. Si sale un variocolor o legendario, se para del todo, avisa (vibra una vez) y la Master Ball la tiras tú.</p>
      <button type="button" class="boton-suave w-full !py-2 text-[11px]" data-a="diag">📋 Copiar diagnóstico del juego</button>
      <p class="axg-msg text-[11px] font-semibold text-tinta-400"></p>`;
    const on = (sel, fn) => sec.querySelector(sel).addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); fn(); });
    on('[data-a="ver"]', () => { mostrar = !mostrar; sec.querySelector('[data-a="ver"]').textContent = mostrar ? '👁 Camino: sí' : '👁 Camino: no'; pintar(); });
    on('[data-a="combatir"]', () => { combatir = !combatir; sec.querySelector('[data-a="combatir"]').textContent = combatir ? '⚔️ Combatir: sí' : '⚔️ Combatir: no'; });
    const campoLuz = sec.querySelector('.axg-luz');
    campoLuz.value = String(umbralLuz());
    campoLuz.addEventListener('input', () => { try { localStorage.setItem(LS_LUZ, campoLuz.value.trim()); } catch { /* sin storage */ } });
    on('[data-a="recoger"]', () => { recoger = !recoger; sec.querySelector('[data-a="recoger"]').textContent = recoger ? '🏺 Jarrones y tumbas: sí' : '🏺 Jarrones y tumbas: no'; });
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
    if (!t) { if (panel && panel.parentElement) panel.remove(); quitarDibujo(); return; }   // la exploración sigue durante combates
    const caja = t.raiz.parentElement;
    if (!panel) panel = construirPanel();
    if (panel.previousElementSibling !== caja) caja.insertAdjacentElement('afterend', panel);
    pintar();
  }

  // Para probar sin la web
  window.__axGalerias = { andar, mostrarPildora, explorar, leerTablero, camino, esFrontera, diagnostico, asegurarPanel, despedirse, gestionarLuz, leerLuz, ventanaCaptura, leerRareza, atenderCaptura, atenderCombate, atenderPantallas, atenderPuerta };

  // Botón «Resolver solo» dentro de la ventana de la puerta (para usarlo en manual)
  let resolviendo = false;
  function botonResolver() {
    const runas = botonesVisibles().some(b => /^Runa \d+, (encendida|apagada)/.test(b.getAttribute('aria-label') || ''));
    const huecos = botonesVisibles().some(b => /^(Hueco \d|Resbalar hacia)/.test(b.getAttribute('aria-label') || ''));
    const viejo = document.getElementById('axg-resolver');
    if (!runas && !huecos) { if (viejo) viejo.remove(); return; }
    if (viejo) return;
    const dejar = botonesVisibles().find(x => /^\s*dejarlo para luego/i.test(norm(x.textContent)));
    if (!dejar) return;
    const b = document.createElement('button');
    b.id = 'axg-resolver'; b.type = 'button';
    b.className = 'boton-principal mt-3 w-full text-xs';
    b.setAttribute('data-ax-ignore', '1');
    b.textContent = '🧩 Resolver solo';
    b.addEventListener('click', async e => {
      e.preventDefault(); e.stopPropagation();
      if (resolviendo) return;
      resolviendo = true; b.disabled = true;
      try { await atenderPuerta(true); } finally { resolviendo = false; b.disabled = false; }
    });
    dejar.insertAdjacentElement('beforebegin', b);
  }

  // Solo funciona en /castillo. La web no recarga al navegar, así que si sales se para la exploración y se quita todo.
  const enCastillo = () => /^\/castillo(\/|$)/.test(location.pathname);
  function quitarTodo() {
    if (explorando) { explorando = false; msg = ''; }
    if (panel && panel.parentElement) panel.remove();
    quitarDibujo();
    for (const id of ['axg-barra', 'axg-resolver', 'axg-toast']) { const el = document.getElementById(id); if (el) el.remove(); }
  }
  function tick() {
    if (!enCastillo()) { quitarTodo(); return; }
    asegurarPanel();
  }

  esperarHidratacion().then(() => {
    setInterval(() => { if (enCastillo()) botonResolver(); }, 600);
    tick();
    setInterval(tick, 500);
  });
})();
