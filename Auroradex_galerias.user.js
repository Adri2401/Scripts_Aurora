// ==UserScript==
// @name         Aurora Dex · Galerías (escalera y camino)
// @namespace    auroradex-galerias
// @version      0.6.0
// @description  Minijuego de bajar plantas: resalta la escalera y el camino más corto, explora solo, combate a los entrenadores (SEGUIR), captura con Poké Ball y usa Master Ball con variocolor y legendarios (una vibración), y despide al mercader.
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
      if (/personajes\//.test(bg)) { tipo = /ricach|mercader|vendedor|nomada/i.test(nombre) ? 'mercader' : 'personaje'; pos = spritePos(el); }
      else {
        tipo = /entrenadores\//.test(src) ? 'entrenador' : /remolino|torbellino|vortice|portal|trampa/i.test(nombre) ? 'remolino' : 'objeto';
        pos = { c: Math.floor((left + wd / 2) / w), f: Math.floor((top + ht / 2) / w) };
      }
      entidades.push({ c: pos.c, f: pos.f, tipo, nombre });
    }
    const ocupadas = new Set(entidades.filter(e => e.tipo !== 'objeto').map(e => e.c + ',' + e.f));
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
      personaje: 'box-shadow:inset 0 0 0 2px #ff9800;background:rgba(255,152,0,.22)',
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
  let mostrar = true, explorando = false, combatir = true, msg = '';
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
    if (!panel) return;
    const a = analizar();
    const estado = panel.querySelector('.axg-est');
    if (!a) { estado.textContent = 'No veo el tablero.'; return; }
    if (mostrar) dibujar(a.t, a.ruta, a.escaleras, a.otros); else quitarDibujo();
    const partes = [];
    partes.push(a.escaleras.length ? `🪜 Escalera a la vista${a.ruta ? ` · ${pasos(a.ruta)} pasos` : ' (sin camino conocido)'}` : '🪜 Escalera aún no descubierta');
    const cuenta = tp => a.otros.filter(o => o.tipo === tp).length;
    if (cuenta('entrenador')) partes.push(`👤 ${cuenta('entrenador')} entrenador(es)`);
    if (cuenta('mercader')) partes.push(`🛒 mercader`);
    if (cuenta('personaje')) partes.push(`🧍 ${cuenta('personaje')} personaje(s)`);
    if (cuenta('remolino')) partes.push(`🌀 ${cuenta('remolino')} remolino(s)`);
    if (cuenta('objeto')) partes.push(`✨ ${cuenta('objeto')} objeto(s)`);
    estado.textContent = partes.join(' · ');
    panel.querySelector('.axg-msg').textContent = msg;
    panel.querySelector('[data-a="auto"]').textContent = explorando ? '■ Parar exploración' : '🧭 Explorar hasta la escalera';
  }

  const norm = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  const visible = el => !!(el.offsetParent || el.getClientRects().length);
  const ajeno = el => el.closest('#' + PANEL_ID) || el.closest('#axg-pill');
  const botonesVisibles = () => $$('button').filter(b => !ajeno(b) && visible(b));

  // Aviso discreto: una vibración corta y un mensaje breve (sin notificaciones ni sonido)
  function vibrar() { try { if (navigator.vibrate) navigator.vibrate(220); } catch { /* sin vibración */ } }
  function toast(texto, ms = 2500) {
    const viejo = document.getElementById('axg-toast');
    if (viejo) viejo.remove();
    const t = document.createElement('div');
    t.id = 'axg-toast';
    t.textContent = texto;
    t.style.cssText = 'position:fixed;left:50%;bottom:calc(var(--nav-alto,4rem) + 1.25rem);transform:translateX(-50%);z-index:2147483000;' +
      'max-width:88vw;padding:4px 12px;border-radius:999px;text-align:center;pointer-events:none;font:700 13px/1.3 system-ui,sans-serif;' +
      'color:rgba(255,255,255,.85);background:rgba(0,0,0,.28);opacity:0;transition:opacity .25s ease';
    document.body.appendChild(t);
    requestAnimationFrame(() => { t.style.opacity = '1'; });
    setTimeout(() => { t.style.opacity = '0'; }, Math.max(0, ms - 300));
    setTimeout(() => t.remove(), ms);
  }

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
    return { shiny, legendario, nombre: sprite ? sprite.alt : '?' };
  }

  let ultimaCaptura = { clave: '', n: 0 };
  async function atenderCaptura() {
    const v = ventanaCaptura();
    if (!v) { ultimaCaptura = { clave: '', n: 0 }; return false; }
    const r = leerRareza(v.hoja);
    const rara = r.shiny || r.legendario;
    const quiero = rara ? 'master' : 'poke';
    const b = v.bolas.find(x => tipoBola(norm(x.textContent)) === quiero && !x.disabled) || (rara ? v.bolas.find(x => tipoBola(norm(x.textContent)) === 'ultra' && !x.disabled) : null);
    if (!b) { msg = `No tengo ${quiero === 'master' ? 'Master Ball' : 'Poké Ball'} disponible para ${r.nombre}.`; pintar(); return false; }
    const clave = r.nombre + '|' + (rara ? 'r' : 'n');
    if (ultimaCaptura.clave === clave) ultimaCaptura.n++; else ultimaCaptura = { clave, n: 1 };
    if (ultimaCaptura.n > 12) { explorando = false; msg = `No consigo capturar a ${r.nombre}. Parado.`; return false; }
    if (rara && ultimaCaptura.n === 1) {
      vibrar();
      toast(`${r.shiny ? '✨ VARIOCOLOR' : '👑 LEGENDARIO'}: ${r.nombre} → Master Ball`);
    }
    msg = `${rara ? '⭐ ' : ''}${r.nombre}: ${rara ? 'Master Ball' : 'Poké Ball'}`;
    pintar();
    await sleep(250);
    b.click();
    await sleep(700);
    return true;
  }

  // Pantalla de combate: «SEGUIR» hasta acabar (y «Continuar/Aceptar» de los cierres)
  async function atenderCombate() {
    const b = botonesVisibles().find(x => !x.disabled && /^\s*(seguir|continuar|aceptar)\s*$/i.test(x.textContent || ''));
    if (!b) return false;
    msg = '⚔️ Combate: sigo…';
    pintar();
    await sleep(200);
    b.click();
    await sleep(450);
    return true;
  }

  // Si se ha abierto la ventana del mercader nómada, se cierra y se sigue
  async function despedirse() {
    const b = botonesVisibles().find(x => !x.disabled && /^\s*Despedirse\s*$/i.test(x.textContent || ''));
    if (!b) return false;
    const quien = ($$('h3').map(h => h.textContent.trim()).find(t => /mercader|nomada|nómada/i.test(t))) || 'ventana';
    b.click();
    msg = `Despedido de «${quien}»; sigo buscando la escalera.`;
    pintar();
    await sleep(350);
    return true;
  }

  const atenderPantallas = async () => (await atenderCaptura()) || (await despedirse()) || (await atenderCombate());

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
      vibrar();
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
  const combatidos = new Set();

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

  async function explorar() {
    if (explorando) { explorando = false; msg = 'Exploración parada.'; pintar(); return; }
    explorando = true;
    mostrarPildora(true);
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

      // Todos los combates posibles: primero los entrenadores que se vean
      if (combatir) {
        const planta = plantaActual();
        const e = t.entidades.find(x => x.tipo === 'entrenador' && !combatidos.has(planta + '|' + x.nombre));
        const cel = e && t.celdas.get(e.c + ',' + e.f);
        if (cel && cel.pisable && rutaA(t, c => c === cel)) {
          combatidos.add(planta + '|' + e.nombre);
          msg = '⚔️ Voy a por un entrenador…'; pintar();
          await clicCelda(cel, t);
          await sleep(300);
          continue;
        }
      }

      const esc = [...t.celdas.values()].find(c => c.tipo === 'escalera');
      if (esc) {
        const r = rutaA(t, c => c.tipo === 'escalera');
        if (r && r.length > 1) {
          msg = `Escalera a ${pasos(r)} pasos: voy.`; pintar();
          if (!(await clicCelda(esc, t))) sinCambio++; else sinCambio = 0;
          if (sinCambio > 2) { msg = 'No consigo llegar a la escalera.'; break; }
          continue;
        }
        msg = '🪜 Ya estás en la escalera o sin camino. Parado.'; break;
      }
      const meta = rutaA(t, esFrontera(t));
      if (!meta || meta.length < 2) { msg = 'No queda nada por explorar desde aquí. Parado.'; break; }
      msg = `Explorando… (${pasos(meta)} pasos al siguiente hueco)`; pintar();
      const destino = meta[meta.length - 1];
      if (!(await clicCelda(destino, t))) { if (++sinCambio > 3) { msg = 'El juego no responde a los clics. Parado.'; break; } } else sinCambio = 0;
      await sleep(150);
    }
    explorando = false;
    mostrarPildora(false);
    pintar();
  }

  // Botón flotante para parar aunque el panel no se vea (durante los combates el tablero desaparece)
  function mostrarPildora(si) {
    let p = document.getElementById('axg-pill');
    if (!si) { if (p) p.remove(); return; }
    if (p) return;
    p = document.createElement('button');
    p.id = 'axg-pill';
    p.type = 'button';
    p.textContent = '■ Parar galerías';
    p.style.cssText = 'position:fixed;left:12px;bottom:calc(var(--nav-alto,4rem) + 4.2rem);z-index:2147483000;padding:6px 12px;border-radius:999px;' +
      'font:800 12px system-ui,sans-serif;color:#fff;background:rgba(200,60,40,.85);border:2px solid rgba(255,255,255,.5)';
    p.addEventListener('click', () => { explorando = false; msg = 'Exploración parada.'; });
    document.body.appendChild(p);
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
      </div>
      <label class="flex items-center justify-between gap-2 text-[11px] font-extrabold text-tinta-500">🪔 Aceite (o cuerda si no queda) con ≤
        <input type="number" min="0" class="axg-luz w-20 rounded-card border-2 border-crema-200 bg-crema-50 px-2 py-1 text-sm font-semibold text-tinta-600 outline-none"> pasos</label>
      <button type="button" class="boton-principal w-full !py-2 text-[11px]" data-a="auto"></button>
      <p class="text-[10px] font-semibold text-tinta-400">Al explorar: combate a todos los entrenadores (pulsa SEGUIR), captura con Poké Ball a todos los Pokémon y usa Master Ball con los variocolor y legendarios (vibra una vez).</p>
      <button type="button" class="boton-suave w-full !py-2 text-[11px]" data-a="diag">📋 Copiar diagnóstico del juego</button>
      <p class="axg-msg text-[11px] font-semibold text-tinta-400"></p>`;
    const on = (sel, fn) => sec.querySelector(sel).addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); fn(); });
    on('[data-a="ver"]', () => { mostrar = !mostrar; sec.querySelector('[data-a="ver"]').textContent = mostrar ? '👁 Camino: sí' : '👁 Camino: no'; pintar(); });
    on('[data-a="combatir"]', () => { combatir = !combatir; sec.querySelector('[data-a="combatir"]').textContent = combatir ? '⚔️ Combatir: sí' : '⚔️ Combatir: no'; });
    const campoLuz = sec.querySelector('.axg-luz');
    campoLuz.value = String(umbralLuz());
    campoLuz.addEventListener('input', () => { try { localStorage.setItem(LS_LUZ, campoLuz.value.trim()); } catch { /* sin storage */ } });
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
  window.__axGalerias = { leerTablero, camino, esFrontera, diagnostico, asegurarPanel, despedirse, gestionarLuz, leerLuz, ventanaCaptura, leerRareza, atenderCaptura, atenderCombate, atenderPantallas };

  esperarHidratacion().then(() => {
    asegurarPanel();
    setInterval(asegurarPanel, 500);
  });
})();
