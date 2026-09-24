// ==UserScript==
// @name         Aurora Dex · Galerías (escalera y camino)
// @namespace    auroradex-galerias
// @version      0.16.0
// @description  Minijuego de bajar plantas: resalta la escalera y el camino más corto, explora solo (combates, remolinos, jarrones, capturas con Poké Ball, aceite y cuerda) y se para con aviso ante un variocolor o legendario para que tires tú la Master Ball.
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
    panel.querySelector('.axg-msg').textContent = msg;
    panel.querySelector('[data-a="auto"]').textContent = explorando ? '■ Parar exploración' : '🧭 Explorar hasta la escalera';
  }

  const norm = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  const visible = el => !!(el.offsetParent || el.getClientRects().length);
  const ajeno = el => el.closest('#' + PANEL_ID) || el.closest('#axg-barra');
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
    // Variocolor o legendario: la macro se PARA del todo, avisa (mensaje + una vibración) y deja la ventana abierta
    // para que la captura la hagas tú a mano (con Master Ball). Luego se vuelve a activar la macro.
    if (rara) {
      const texto = `${r.shiny ? '✨ ¡VARIOCOLOR!' : '👑 ¡LEGENDARIO!'} ${r.nombre}: captúralo tú. Macro parada.`;
      explorando = false;
      msg = texto;
      vibrar();
      toast(texto, 6000);
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

  async function atenderPuerta(manual = false) {
    if (await atenderRunas(manual)) return true;
    const huecos = botonesVisibles().filter(b => /^Hueco \d/.test(b.getAttribute('aria-label') || ''));
    if (huecos.length < 2) {
      // Recién chocada una puerta y se abre una ventana que no conozco (runas, suelo pulido…): me paro para que me pases su HTML
      const cerrar = Date.now() - ultimaPuerta < 8000 && botonesVisibles().find(x => x.getAttribute('aria-label') === 'Cerrar');
      if (!cerrar) return false;
      puertaFin[plantaActual()] = true; ultimaPuerta = 0;
      explorando = false; vibrar();
      const ventana = cerrar.closest('div.overflow-y-auto') || cerrar.parentElement;
      console.log('[axg] ventana de puerta desconocida:', ventana && ventana.outerHTML);
      msg = '🚪 Puerta de otro tipo: parado. Copia el HTML de la ventana y pásamelo.'; toast('Puerta de otro tipo: parado', 5000); pintar();
      return true;
    }
    const simbolos = botonesVisibles().filter(b => !b.getAttribute('aria-label') && b.querySelector('span.capitalize') && !ajeno(b));
    const nombres = simbolos.map(b => sinArticulo(b.querySelector('span.capitalize').textContent));
    const lineas = $$('li').filter(li => visible(li) && !ajeno(li)).map(li => norm(li.textContent));
    const sol = new Array(huecos.length).fill(null);
    for (const l of lineas) {
      const ord = ORDINALES.find(([re]) => re.test(l));
      const ns = nombres.filter(n => new RegExp('\\b' + n + '\\b').test(l));
      if (ord && ns.length === 1 && ord[1] <= sol.length) sol[ord[1] - 1] = ns[0];
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
            (combatir && e.tipo === 'entrenador' && !combatidos.has(planta + '|' + e.nombre)) ||
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
            if (e.tipo === 'entrenador') combatidos.add(planta + '|' + e.nombre); else contadoresPlanta[e.tipo]++;
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
      if (!meta || meta.length < 2) { msg = 'No queda nada por explorar desde aquí (sin ruta a zonas nuevas). Parado.'; console.log('[axg] parado: sin frontera', t.jugador, t.entidades); break; }
      msg = esperaPuerta ? `🚪 Planta con puerta: busco la puerta… (${pasos(meta)} pasos)` : `Explorando… (${pasos(meta)} pasos al siguiente hueco)`; pintar();
      const destino = meta[meta.length - 1];
      if (!(await clicCelda(destino, t))) { if (++sinCambio > 3) { msg = 'El juego no responde a los clics. Parado.'; break; } } else sinCambio = 0;
      await pausa(600, 1000);
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
    const huecos = botonesVisibles().some(b => /^Hueco \d/.test(b.getAttribute('aria-label') || ''));
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

  esperarHidratacion().then(() => {
    setInterval(botonResolver, 600);
    asegurarPanel();
    setInterval(asegurarPanel, 500);
  });
})();
