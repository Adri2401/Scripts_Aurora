// ==UserScript==
// @name         Aurora Dex · Accesos Directos
// @namespace    auroradex-accesos
// @version      0.9.1
// @description  Accesos directos bajo el Equipo de exploración: Tiendas, Competir, Para hoy (con lo que ya hiciste hoy), Minijuegos, Tu base y Lo demás; los de otra región viajan solos. Subasta con objeto, puja y tiempo. Bloques plegables.
// @match        https://auroradex.es/*
// @match        https://www.auroradex.es/*
// @updateURL    https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_interfaz.user.js
// @downloadURL  https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_interfaz.user.js
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

  const PANEL_ID = 'adx-accesos-panel';
  const U = '#' + PANEL_ID;
  const ESTADO_KEY = 'adx-accesos-estado';      // pastillas leídas del Menú (hecho hoy, 21 de 30…)
  const PLEGADO_KEY = 'adx-accesos-plegado';    // bloques plegados
  const PLEGADO_INICIAL = ['demas'];            // bloques que empiezan plegados hasta que los abras

  // region: la actividad solo existe en esa región; al pulsarla se viaja allí primero
  const BLOQUES = [
    { id: 'tiendas', titulo: 'Tiendas', icono: '🛍️', items: [
      { href: '/guarderia',   icon: '🥚', label: 'Guardería' },
      { href: '/mercado',     icon: '🛒', label: 'Mercado' },
      { href: '/boutique',    icon: '💎', label: 'Boutique' },
      { href: '/subasta',     icon: '🔨', label: 'Subastas' },
      { href: '/mercadillo',  icon: '🏪', label: 'Mercadillo' },
      { href: '/laboratorio', icon: '🔬', label: 'Laboratorio' },
      { href: '/oficios',     icon: '⚒️', label: 'Oficios' },
      { href: '/cartas',      icon: '🃏', label: 'Cartas' },
      { href: '/esmalte',     icon: '🏛️', label: 'Vitrina de Esmalte' },
    ] },
    { id: 'pvp', titulo: 'Competir', sub: 'Contra los demás', icono: '⚔️', items: [
      { href: '/torre',    icon: '🗼', label: 'Torre Desafío' },
      { href: '/metro',    icon: '🚇', label: 'Metro Batalla' },
      { href: '/entranas', icon: '⛰️', label: 'Monte Plateado' },
      { href: '/castillo', icon: '🏰', label: 'Castillo Ancestral' },
      { href: '/tronos',   icon: '👑', label: 'Los Tronos' },
      { href: '/golf',     icon: '⛳', label: 'Golf' },
      { href: '/ranking',  icon: '🏆', label: 'Ranking' },
      { href: '/liga',     icon: '🏅', label: 'Liga' },
    ] },
    { id: 'diario', titulo: 'Para hoy', icono: '📅', diario: true, items: [
      { href: '/manadas',        icon: '📺', label: 'Canal Manadas' },
      { href: '/siluetas',       icon: '❓', label: '¿Quién es?' },
      { href: '/tren',           icon: '🚂', label: 'Tren de Biscuit', region: 'teselia', regionLabel: 'Teselia' },
      { href: '/carreras',       icon: '🐀', label: 'Carreras' },
      { href: '/safari', icon: '🌾', label: 'Safari', region: 'kanto',   regionLabel: 'Kanto',   porRegion: true },
      { href: '/safari', icon: '🌾', label: 'Safari', region: 'johto',   regionLabel: 'Johto',   porRegion: true },
      { href: '/safari', icon: '🌾', label: 'Safari', region: 'hoenn',   regionLabel: 'Hoenn',   porRegion: true },
      { href: '/safari', icon: '🌾', label: 'Safari', region: 'sinnoh',  regionLabel: 'Sinnoh',  porRegion: true },
      { href: '/safari', icon: '🌾', label: 'Safari', region: 'teselia', regionLabel: 'Teselia', porRegion: true },
      { href: '/pokeathlon',     icon: '🏟️', label: 'Pokéathlon' },
      { href: '/pesca',          icon: '🎣', label: 'El Muelle' },
      { href: '/cantera',        icon: '⛏️', label: 'La Cantera' },
      { href: '/album',          icon: '📷', label: 'Álbum' },
      { href: '/buceo',          icon: '🤿', label: 'Buceo' },
      { href: '/jessie-y-james', icon: '🎈', label: 'Jessie y James' },
      { href: '/huerto',         icon: '🌱', label: 'Huerto', region: 'sinnoh', regionLabel: 'Sinnoh' },
    ] },
    { id: 'minijuegos', titulo: 'Minijuegos', icono: '🎲', items: [
      { href: '/trigal', icon: '🎰', label: 'Voltorb Flip' },
      { href: '/ruinas', icon: '👁️', label: 'Ruinas Alfa' },
      { href: '/casa',   icon: '🚪', label: 'Casa Treta' },
      { href: '/casino', icon: '🎰', label: 'Casino' },
      { href: '/hielo',  icon: '❄️', label: 'Suelo Helado' },
      { href: '/salon',  icon: '🎴', label: 'Salón' },
      { href: '/solar',  icon: '🌙', label: 'Solar', region: 'teselia', regionLabel: 'Teselia' },
      { href: '/fondo',  icon: '🏮', label: 'Fondo' },
    ] },
    { id: 'base', titulo: 'Tu base', sub: 'Y lo que aparece por temporadas', icono: '🏠', items: [
      { href: '/valle', icon: '🌄', label: 'Valle Aurora' },
      { href: '/base',  icon: '🏠', label: 'Base Secreta' },
      { href: '/isla',  icon: '🏝️', label: 'Isla Espejismo' },
    ] },
    { id: 'demas', titulo: 'Lo demás', icono: '🧰', items: [
      { href: '/equipos',    icon: '🌊', label: 'Los equipos' },
      { href: '/gachapon',   icon: '🎰', label: 'Máquina de Fichas' },
      { href: '/exclusivos', icon: '🎨', label: 'Exclusivos' },
      { href: '/sorteos',    icon: '🎁', label: 'Premios' },
      { href: '/misiones',   icon: '🎯', label: 'Misiones y códigos' },
      { href: '/tipos',      icon: '⚔️', label: 'Ventajas de tipo' },
      { href: '/comparar',   icon: '🆚', label: 'Comparar Pokémon' },
      { href: '/encuesta',   icon: '📋', label: 'La encuesta' },
      { href: '/votacion',   icon: '🗳️', label: 'Votación' },
      { href: '/guia',       icon: '📜', label: 'Guía' },
    ] },
  ];

  const lsJSON = (k, def) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } };
  const lsPut = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin storage */ } };
  const hoy = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };

  /* ─── Región actual y viaje automático ─────────────────────────────── */
  const ADX_PENDING_KEY = 'adx-pending-region-nav';
  const URL_VIAJAR = '/johto'; // pantalla «Viajar a otra región»

  function normalizarTexto(t) {
    return t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  // Región actual desde el JSON que Next.js inyecta («"region":{"id":"hoenn"…»)
  function regionActual() {
    for (const s of document.querySelectorAll('script')) {
      const m = s.textContent.replace(/\\"/g, '"').match(/"region":\{"id":"([a-z0-9_-]+)"/);
      if (m) return m[1];
    }
    return null;
  }

  // Plan B en la pantalla de viaje: texto visible «Estás en» / «Sinnoh»
  function regionEnPantallaDeViaje() {
    for (const p of document.querySelectorAll('p.titulo-seccion')) {
      if (normalizarTexto(p.textContent) === 'estas en' && p.nextElementSibling) return normalizarTexto(p.nextElementSibling.textContent);
    }
    return null;
  }

  function irConCambioDeRegion(regionDestino, etiquetaDestino, hrefDestino) {
    sessionStorage.setItem(ADX_PENDING_KEY, JSON.stringify({ region: regionDestino, etiqueta: etiquetaDestino, href: hrefDestino, t: Date.now() }));
    window.location.href = URL_VIAJAR;
  }

  function continuarViajePendiente() {
    const raw = sessionStorage.getItem(ADX_PENDING_KEY);
    if (!raw) return;
    let pend;
    try { pend = JSON.parse(raw); } catch { sessionStorage.removeItem(ADX_PENDING_KEY); return; }
    // Formato raro o viaje de hace más de 2 minutos: se descarta (evita saltos inesperados más tarde)
    if (!pend || !pend.region || !pend.etiqueta || !pend.href || (pend.t && Date.now() - pend.t > 120000)) {
      sessionStorage.removeItem(ADX_PENDING_KEY);
      return;
    }
    const yaEstamos = regionActual() === pend.region || regionEnPantallaDeViaje() === normalizarTexto(pend.etiqueta);
    if (yaEstamos) {
      sessionStorage.removeItem(ADX_PENDING_KEY);
      window.location.href = pend.href;
      return;
    }
    const buscada = normalizarTexto(pend.etiqueta);
    const btn = [...document.querySelectorAll('button:not([disabled])')].find(b => normalizarTexto(b.textContent).includes(buscada));
    if (btn) btn.click();
  }

  /* ─── Qué actividades hay en cada región, aprendido del Menú ────────────
   * El Menú solo lista lo que existe en la región donde estás. Cada vez que se abre se apunta;
   * si un acceso no está en el Menú de la región actual pero sí en el de otra, al pulsarlo se viaja allí.
   * (Lo que lleve «region» a mano en BLOQUES manda sobre lo aprendido.) */
  const MENUS_KEY = 'adx-accesos-menus';
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  function anotarMenuDeRegion() {
    const reg = regionActual();
    if (!reg) return;
    const hrefs = [...new Set([...document.querySelectorAll('main a[href^="/"]')].map(a => a.getAttribute('href')))];
    if (hrefs.length < 10) return;   // menú a medio pintar
    const menus = lsJSON(MENUS_KEY, {});
    if (JSON.stringify(menus[reg]) === JSON.stringify(hrefs)) return;
    menus[reg] = hrefs;
    lsPut(MENUS_KEY, menus);
  }

  // Región a la que hay que viajar para usar el acceso, o null si sirve donde estás
  function regionNecesaria(item) {
    if (item.region) return { id: item.region, label: item.regionLabel || cap(item.region) };
    const cur = regionActual(), menus = lsJSON(MENUS_KEY, {});
    if (!cur || !menus[cur] || menus[cur].includes(item.href)) return null;
    const otra = Object.keys(menus).find(r => r !== cur && menus[r].includes(item.href));
    return otra ? { id: otra, label: cap(otra) } : null;
  }

  /* ─── Actividades nuevas: se colocan solas en su bloque ─────────────────
   * El Menú agrupa cada actividad bajo un título («Competir», «Tu colección»…). Lo que aparezca allí y no esté
   * en BLOQUES se guarda con su emoji y nombre, y el panel lo pone en el bloque equivalente. */
  const EXTRAS_KEY = 'adx-accesos-extras';
  const SECCION_A_BLOQUE = {          // título de sección del Menú → id de bloque del panel
    'competir': 'pvp', 'tu coleccion': 'tiendas', 'para hoy': 'diario', 'tu base': 'base',
    'la historia': 'demas', 'lo demas': 'demas',
  };
  const NO_ACCESO = new Set(['/menu', '/mapa', '/johto', '/personaje', '/pokedex', '/equipo', '/trueques']);
  const hrefsConocidos = () => new Set(BLOQUES.flatMap(b => b.items.map(i => i.href)));

  function leerItemDeMenu(a) {
    const ico = a.querySelector('[aria-hidden="true"]');
    const bloque = a.querySelector('span.block');
    const hojas = [...a.querySelectorAll('span')].filter(s => s !== ico && !s.querySelector('span') && !s.classList.contains('pastilla') && s.textContent.trim());
    const label = ((bloque || hojas[0] || {}).textContent || '').replace(/\s+/g, ' ').trim();
    const icon = ico && !ico.querySelector('svg, img') ? ico.textContent.trim() : '';
    return label ? { icon: icon || '🔹', label } : null;
  }

  function anotarNovedadesDelMenu() {
    const conocidos = hrefsConocidos();
    const extras = lsJSON(EXTRAS_KEY, {});
    let cambio = false;
    for (const a of document.querySelectorAll('main a[href^="/"]')) {
      const href = a.getAttribute('href');
      if (conocidos.has(href) || NO_ACCESO.has(href)) continue;
      const h2 = a.closest('section') && a.closest('section').querySelector('h2.titulo-seccion');
      const bloque = h2 && SECCION_A_BLOQUE[normalizarTexto(h2.textContent)];
      if (!h2) continue;                                   // banners y tarjetas sueltas: no son accesos de un bloque
      const datos = leerItemDeMenu(a);
      if (!datos) continue;
      const nuevo = { ...datos, bloque: bloque || 'demas' };
      if (JSON.stringify(extras[href]) !== JSON.stringify(nuevo)) { extras[href] = nuevo; cambio = true; }
    }
    if (cambio) lsPut(EXTRAS_KEY, extras);
  }

  // Accesos de un bloque: los escritos a mano + los aprendidos (+ un Safari por cada región que lo tenga en su Menú)
  function itemsDe(b) {
    const items = [...b.items];
    const ya = new Set(items.map(i => i.href));
    const extras = lsJSON(EXTRAS_KEY, {});
    for (const href of Object.keys(extras)) {
      if (extras[href].bloque === b.id && !ya.has(href)) items.push({ href, icon: extras[href].icon, label: extras[href].label });
    }
    if (b.id === 'diario') {
      const conSafari = new Set(items.filter(i => i.href === '/safari').map(i => i.region));
      const menus = lsJSON(MENUS_KEY, {});
      for (const r of Object.keys(menus)) {
        if (menus[r].includes('/safari') && !conSafari.has(r)) items.push({ href: '/safari', icon: '🌾', label: 'Safari', region: r, regionLabel: cap(r), porRegion: true });
      }
    }
    return items;
  }

  /* ─── Estado de las actividades, leído del Menú ────────────────────────
   * En /menu cada actividad lleva su pastilla («hecho hoy», «21 de 30 hoy», «1 h»…).
   * Se guarda con la fecha y el panel del mapa la enseña solo si es de hoy. */
  function leerEstadoDelMenu() {
    if (!/^\/menu\/?$/.test(location.pathname)) return;
    anotarMenuDeRegion();
    anotarNovedadesDelMenu();
    const estado = {};
    // Lo de otras regiones («/safari@johto»…) se conserva del mismo día: el Menú solo enseña la región actual
    const previo = estadoDeHoy();
    if (previo) for (const k of Object.keys(previo.estado)) if (k.includes('@')) estado[k] = previo.estado[k];
    const reg = regionActual();
    for (const a of document.querySelectorAll('main a[href^="/"]')) {
      const p = a.querySelector('.pastilla');
      if (!p) continue;
      const txt = p.textContent.replace(/\s+/g, ' ').trim();
      const href = a.getAttribute('href');
      estado[href] = txt;
      if (reg) estado[`${href}@${reg}`] = txt;
    }
    if (Object.keys(estado).length) lsPut(ESTADO_KEY, { dia: hoy(), t: Date.now(), estado });
  }
  // Pastilla de un acceso; los de varias regiones (Safari) guardan una por región: «/safari@kanto»
  const claveEstado = it => it.porRegion ? `${it.href}@${it.region}` : it.href;
  const pillDe = (it, est) => (est && est.estado[claveEstado(it)]) || '';

  function estadoDeHoy() {
    const e = lsJSON(ESTADO_KEY, null);
    return e && e.dia === hoy() ? e : null;
  }

  /* ─── Subasta en curso (objeto, precio y tiempo), leída de /subasta ──── */
  const SUBASTA_KEY = 'adx-accesos-subasta';
  const SUBASTA_REFRESCO = 10 * 60 * 1000;   // el precio cambia con las pujas: se relee cada 10 min
  let subastaPidiendo = false, subastaIntento = 0;

  function tiempoAMs(t) {
    let ms = 0, hay = false;
    for (const m of String(t).matchAll(/(\d+)\s*(d|h|min|s)\b/gi)) {
      hay = true;
      ms += parseInt(m[1], 10) * ({ d: 864e5, h: 36e5, min: 6e4, s: 1e3 }[m[2].toLowerCase()]);
    }
    return hay ? ms : null;
  }
  function textoRestante(ms) {
    const m = Math.max(0, Math.ceil(ms / 6e4)), d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60);
    return d ? `${d} d ${h} h` : h ? `${h} h ${m % 60} min` : `${m} min`;
  }

  function parsearSubasta(root) {
    const sec = [...root.querySelectorAll('section')].find(s => /casa de subastas/i.test(s.textContent || ''));
    if (!sec) return null;
    const limpio = el => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
    const nombre = limpio(sec.querySelector('h1'));
    const precio = limpio([...sec.querySelectorAll('p')].find(p => /text-3xl/.test(p.className || '')));
    const cierre = (limpio(sec.querySelector('header')).match(/cierra en\s*(.+)$/i) || [])[1];
    const resto = cierre ? tiempoAMs(cierre) : null;
    if (!nombre || !precio || resto == null) return null;
    return { nombre, precio, cierraAt: Date.now() + resto, t: Date.now() };
  }

  function subastaVigente() {
    const s = lsJSON(SUBASTA_KEY, null);
    return s && s.cierraAt > Date.now() ? s : null;
  }

  function guardarSubasta(s) {
    if (!s) return;
    lsPut(SUBASTA_KEY, s);
    const panel = document.getElementById(PANEL_ID);
    if (panel) panel.replaceWith(crearPanel());
  }

  async function refrescarSubasta() {
    if (/^\/subasta\/?$/.test(location.pathname)) {
      const s = parsearSubasta(document);
      if (s) { const p = lsJSON(SUBASTA_KEY, null); if (!p || p.nombre !== s.nombre || p.precio !== s.precio || Math.abs(p.cierraAt - s.cierraAt) > 6e4) guardarSubasta(s); }
      return;
    }
    const s = lsJSON(SUBASTA_KEY, null);
    if (subastaPidiendo || Date.now() - subastaIntento < 5 * 6e4 || (s && s.cierraAt > Date.now() && Date.now() - s.t < SUBASTA_REFRESCO)) return;
    subastaIntento = Date.now();
    subastaPidiendo = true;
    try {
      const r = await fetch('/subasta', { credentials: 'same-origin' });
      if (r.ok) guardarSubasta(parsearSubasta(new DOMParser().parseFromString(await r.text(), 'text/html')));
    } catch { /* sin red: se queda lo guardado */ }
    finally { subastaPidiendo = false; }
  }

  function subastaHTML() {
    const s = subastaVigente();
    if (!s) return '';
    return `<span class="ax-sub"><b>${kEsc(s.nombre)}</b><span>${kEsc(s.precio)} · ${textoRestante(s.cierraAt - Date.now())}</span></span>`;
  }

  /* ─── Panel ─────────────────────────────────────────────────────────── */
  function estilos() {
    kStyle('adx-accesos-kit', U);
    if (document.getElementById('adx-accesos-css')) return;
    const st = document.createElement('style');
    st.id = 'adx-accesos-css';
    st.textContent = `
      ${U} details>summary{list-style:none;cursor:pointer;user-select:none}
      ${U} details>summary::-webkit-details-marker{display:none}
      ${U} details>summary .ax-chev{transition:transform .2s;display:inline-block}
      ${U} details[open]>summary .ax-chev{transform:rotate(180deg)}
      ${U} .ax-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
      ${U} .ax-item{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:4px;padding:10px 4px 8px;text-align:center;height:100%;transition:transform .12s}
      ${U} .ax-item:active{transform:scale(.96)}
      ${U} .ax-item .ax-ico{font-size:24px;line-height:1}
      ${U} .ax-item .ax-lbl{font-size:10px;font-weight:800;line-height:1.15}
      ${U} .ax-item.ax-hecho{opacity:.5}
      ${U} .ax-item .ax-tag{position:absolute;top:-6px;right:-4px;font-size:9px;padding:1px 6px;line-height:1.4}
      ${U} .ax-sub{display:flex;flex-direction:column;gap:1px;max-width:100%;font-size:9px;font-weight:700;line-height:1.2;opacity:.85}
      ${U} .ax-sub>b{font-size:9px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
      ${U} .ax-sub>span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      ${U} .ax-item.ax-aqui{outline:2px solid #2FA84F;outline-offset:-2px}`;
    document.head.appendChild(st);
  }

  function crearItem(item, est) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = item.href;
    const pill = pillDe(item, est);
    const hecho = pill && /hecho|parado/i.test(pill);
    a.className = 'ax-item tarjeta' + (hecho ? ' ax-hecho' : '') + (location.pathname === item.href && (!item.porRegion || regionActual() === item.region) ? ' ax-aqui' : '');
    let tag = '';
    if (pill) {
      tag = hecho
        ? `<span class="ax-tag pastilla border-2 border-crema-200 bg-crema-50 text-tinta-400">✓</span>`
        : `<span class="ax-tag pastilla border-2 border-hoja-300 bg-hoja-50 text-hoja-700">${kEsc(pill.replace(/\s*hoy$/i, ''))}</span>`;
    }
    const req = regionNecesaria(item);
    a.title = item.label + (pill ? ` · ${pill}` : '') + (req ? ` · en ${req.label}` : '');
    a.innerHTML = `
      ${tag}
      <span class="ax-ico" aria-hidden="true">${item.icon}</span>
      <span class="ax-lbl">${kEsc(item.label)}</span>
      ${item.href === '/subasta' ? subastaHTML() : ''}
      ${req ? `<span class="text-[9px] font-extrabold uppercase tracking-wide text-cielo-600">${kEsc(req.label)}</span>` : ''}`;

    if (req) {
      a.addEventListener('click', (ev) => {
        if (ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
        ev.preventDefault();
        if (regionActual() === req.id) window.location.href = item.href;
        else irConCambioDeRegion(req.id, req.label, item.href);
      });
    }
    li.appendChild(a);
    return li;
  }

  function crearBloque(b, est, plegados) {
    const det = document.createElement('details');
    det.className = 'tarjeta overflow-hidden';
    det.dataset.bloque = b.id;
    det.open = !plegados.includes(b.id);

    let resumen = b.sub || '';
    if (b.diario && est) {
      const conEstado = itemsDe(b).filter(i => pillDe(i, est));
      const hechos = conEstado.filter(i => /hecho|parado/i.test(pillDe(i, est))).length;
      if (conEstado.length) resumen = `${hechos} de ${conEstado.length} hechos hoy`;
    }
    det.innerHTML = `
      <summary class="flex items-center gap-2 p-3">
        <span class="text-lg" aria-hidden="true">${b.icono}</span>
        <span class="titulo-seccion flex-1">${kEsc(b.titulo)}</span>
        <span class="text-[11px] font-bold text-tinta-400">${kEsc(resumen)}</span>
        <span class="ax-chev text-tinta-300" aria-hidden="true">▾</span>
      </summary>
      <ul class="ax-grid px-3 pb-3"></ul>`;
    const ul = det.querySelector('ul');
    // En «Para hoy», lo pendiente primero y lo hecho al final
    const items = b.diario && est
      ? itemsDe(b).sort((x, y) => (/hecho|parado/i.test(pillDe(x, est)) ? 1 : 0) - (/hecho|parado/i.test(pillDe(y, est)) ? 1 : 0))
      : itemsDe(b);
    for (const it of items) ul.appendChild(crearItem(it, est));
    det.addEventListener('toggle', () => {
      const p = lsJSON(PLEGADO_KEY, PLEGADO_INICIAL).filter(x => x !== b.id);
      if (!det.open) p.push(b.id);
      lsPut(PLEGADO_KEY, p);
    });
    return det;
  }

  function crearPanel() {
    estilos();
    const est = estadoDeHoy();
    const plegados = lsJSON(PLEGADO_KEY, PLEGADO_INICIAL);
    const wrapper = document.createElement('div');
    wrapper.id = PANEL_ID;
    wrapper.className = 'space-y-2';
    const mins = est ? Math.round((Date.now() - est.t) / 60000) : null;
    wrapper.innerHTML = `
      <div class="flex items-baseline justify-between gap-2 px-1">
        <h2 class="titulo-seccion">⭐ Accesos directos</h2>
        <a href="/menu" class="text-[11px] font-bold text-tinta-400">${est ? `estado de hace ${mins < 1 ? 'un momento' : mins + ' min'} · ↻` : 'abre el Menú para ver qué queda hoy ›'}</a>
      </div>`;
    for (const b of BLOQUES) wrapper.appendChild(crearBloque(b, est, plegados));
    return wrapper;
  }

  // Debajo de «Equipo de exploración», dentro del mismo contenedor del mapa
  function montar() {
    if (document.getElementById(PANEL_ID)) return;
    const h3 = [...document.querySelectorAll('h3.titulo-seccion')]
      .find(h => h.textContent.trim().toLowerCase().startsWith('equipo de exploracion'));
    const seccion = h3 && h3.closest('section');
    if (seccion) seccion.insertAdjacentElement('afterend', crearPanel());
  }

  function desmontarSiNoToca() {
    const panel = document.getElementById(PANEL_ID);
    if (!panel) return;
    const sigue = [...document.querySelectorAll('h3.titulo-seccion')]
      .some(h => h.textContent.trim().toLowerCase().startsWith('equipo de exploracion'));
    if (!sigue) panel.remove();
  }

  /* ─── Observador (Next.js no recarga al navegar) ──────────────────── */
  let syncT = null;
  const observer = new MutationObserver(() => {
    clearTimeout(syncT);
    syncT = setTimeout(() => {
      continuarViajePendiente();
      leerEstadoDelMenu();
      refrescarSubasta();
      desmontarSiNoToca();
      montar();
    }, 150);
  });

  esperarHidratacion().then(() => {
    observer.observe(document.body, { childList: true, subtree: true });
    continuarViajePendiente();
    leerEstadoDelMenu();
    refrescarSubasta();
    montar();
  });
})();
