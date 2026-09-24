// ==UserScript==
// @name         Aurora Dex · Accesos Directos
// @namespace    auroradex-accesos
// @version      1.5.0
// @description  Accesos directos bajo el Equipo de exploración en cuatro bloques: Tiendas, PvE, PvP y Extra. Los de otra región viajan solos, los Safari se marcan como hechos al pulsarlos (y se reinician cada día), y las actividades nuevas del Menú se colocan solas.
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
  const PLEGADO_INICIAL = ['extra'];            // bloques que empiezan plegados hasta que los abras

  // region: la actividad solo existe en esa región; al pulsarla se viaja allí primero
  const T = { region: 'teselia', regionLabel: 'Teselia' };
  const SAFARI = (r, l) => ({ href: '/safari', icon: '🌾', label: 'Safari', region: r, regionLabel: l, porRegion: true });
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
      { href: '/gachapon',    icon: '🎰', label: 'Máquina de Fichas' },
    ] },
    { id: 'pvp', titulo: 'PvP', sub: 'Contra los demás', icono: '⚔️', items: [
      { href: '/isla',     icon: '🏝️', label: 'Isla Espejismo' },
      { href: '/valle',    icon: '🌄', label: 'Valle Aurora' },
      { href: '/torre',    icon: '🗼', label: 'Torre Desafío' },
      { href: '/tronos',   icon: '👑', label: 'Los Tronos' },
      { href: '/entranas', icon: '⛰️', label: 'Monte Plateado' },
      { href: '/metro',    icon: '🚇', label: 'Metro Batalla', ...T },
      { href: '/castillo', icon: '🏰', label: 'Castillo Ancestral', ...T },
      { href: '/golf',     icon: '⛳', label: 'Golf' },
    ] },
    // Los Safari (porRegion) se dibujan siempre al final del bloque, aparte y sin título
    { id: 'pve', titulo: 'PvE', sub: 'Lo de cada día', icono: '📅', diario: true, items: [
      { href: '/solar',          icon: '🌙', label: 'Solar', ...T },
      { href: '/huerto',         icon: '🌱', label: 'Huerto', region: 'sinnoh', regionLabel: 'Sinnoh' },
      { href: '/manadas',        icon: '📺', label: 'Canal Manadas' },
      { href: '/siluetas',       icon: '❓', label: '¿Quién es?' },
      { href: '/tren',           icon: '🚂', label: 'Tren de Biscuit', ...T },
      { href: '/carreras',       icon: '🐀', label: 'Carreras' },
      { href: '/pokeathlon',     icon: '🏟️', label: 'Pokéathlon' },
      { href: '/pesca',          icon: '🎣', label: 'El Muelle' },
      { href: '/cantera',        icon: '⛏️', label: 'La Cantera' },
      { href: '/album',          icon: '📷', label: 'Álbum' },
      { href: '/buceo',          icon: '🤿', label: 'Buceo' },
      { href: '/jessie-y-james', icon: '🎈', label: 'Jessie y James' },
      { href: '/salon',          icon: '🎴', label: 'Salón' },
      SAFARI('kanto', 'Kanto'), SAFARI('johto', 'Johto'), SAFARI('hoenn', 'Hoenn'), SAFARI('sinnoh', 'Sinnoh'), SAFARI('teselia', 'Teselia'),
    ] },
    { id: 'extra', titulo: 'Extra', icono: '🧰', items: [
      { href: '/ranking',    icon: '🏆', label: 'Ranking' },
      { href: '/liga',       icon: '🏅', label: 'Liga' },
      { href: '/miel',       icon: '🍯', label: 'Árboles de Miel' },
      { href: '/concurso',   icon: '🎣', label: 'Concurso de Captura' },
      { href: '/trigal',     icon: '🎰', label: 'Voltorb Flip' },
      { href: '/ruinas',     icon: '👁️', label: 'Ruinas Alfa' },
      { href: '/casa',       icon: '🚪', label: 'Casa Treta' },
      { href: '/casino',     icon: '🎰', label: 'Casino' },
      { href: '/hielo',      icon: '❄️', label: 'Suelo Helado' },
      { href: '/fondo',      icon: '🏮', label: 'Fondo Comunitario' },
      { href: '/subsuelo',   icon: '⛏️', label: 'Grutas del Subsuelo' },
      { href: '/base',       icon: '🏠', label: 'Base Secreta' },
      { href: '/equipos',    icon: '🌊', label: 'Los equipos' },
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
  // Bloques antiguos (guardados por versiones anteriores) → bloques actuales; y accesos que se fuerzan a un bloque
  const ALIAS_BLOQUE = { diario: 'pve', minijuegos: 'extra', base: 'extra', demas: 'extra' };
  const FORZAR_BLOQUE = { '/miel': 'extra', '/concurso': 'extra', '/subsuelo': 'extra' };

  const lsJSON = (k, def) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } };
  const lsPut = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin storage */ } };
  const hoy = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };

  /* ─── Región actual y viaje automático ─────────────────────────────── */
  const ADX_PENDING_KEY = 'adx-pending-region-nav';
  const URL_VIAJAR = '/johto'; // pantalla «Viajar a otra región»

  function normalizarTexto(t) {
    return t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  /* Región actual. Se mira, por orden: la chapa «Mapa de Kanto» del mapa, «Estás en» de la pantalla de viaje,
   * «Estás aquí» del panel de regiones de la cabecera y el JSON de Next.js. La última vista se guarda, así que
   * en páginas sin ninguna de esas pistas (el Menú, una actividad…) se usa la última conocida. */
  const REGION_KEY = 'adx-region-actual';
  function regionEnChapa(raiz = document) {
    for (const el of raiz.querySelectorAll('span,div,button,p,h2,h3')) {
      if (el.children.length > 2) continue;
      const m = normalizarTexto(el.textContent || '').match(/^[^a-z]*mapa de ([a-z]+)$/);
      if (m) return m[1];
    }
    return null;
  }
  function regionEnPanelMedallas() {
    for (const sp of document.querySelectorAll('li button span')) {
      if (sp.children.length || !/^estas aqui$/.test(normalizarTexto(sp.textContent || ''))) continue;
      const n = normalizarTexto(sp.parentElement.textContent.replace(sp.textContent, '')).match(/^[a-z]+/);
      if (n) return n[0];
    }
    return null;
  }
  function regionEnJSON(texto) {
    const m = String(texto).replace(/\\"/g, '"').match(/"region"\s*:\s*\{\s*"id"\s*:\s*"([a-z0-9_-]+)"/);
    return m ? m[1] : null;
  }
  let regionMemo = { t: 0, v: null };
  function regionActual() {
    if (Date.now() - regionMemo.t < 400) return regionMemo.v;
    let r = regionEnChapa() || regionEnPantallaDeViaje() || regionEnPanelMedallas();
    if (!r) for (const sc of document.querySelectorAll('script')) { r = regionEnJSON(sc.textContent); if (r) break; }
    if (r) { const g = lsJSON(REGION_KEY, null); if (!g || g.id !== r) lsPut(REGION_KEY, { id: r, t: Date.now() }); }
    else { const g = lsJSON(REGION_KEY, null); r = g ? g.id : null; }
    regionMemo = { t: Date.now(), v: r };
    return r;
  }

  // Plan B en la pantalla de viaje: texto visible «Estás en» / «Sinnoh»
  function regionEnPantallaDeViaje() {
    for (const p of document.querySelectorAll('p.titulo-seccion')) {
      if (normalizarTexto(p.textContent) === 'estas en' && p.nextElementSibling) return (normalizarTexto(p.nextElementSibling.textContent).match(/^[a-z]+/) || [null])[0];
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

  function anotarMenuDeRegion(raiz = document, reg = regionActual()) {
    if (!reg) return;
    const hrefs = [...new Set([...raiz.querySelectorAll('main a[href^="/"]')].map(a => a.getAttribute('href')))];
    if (hrefs.length < 10) return;   // menú a medio pintar
    const menus = lsJSON(MENUS_KEY, {});
    if (JSON.stringify(menus[reg]) === JSON.stringify(hrefs)) return;
    menus[reg] = hrefs;
    lsPut(MENUS_KEY, menus);
  }

  // Región a la que hay que viajar para usar el acceso, o null si sirve donde estás
  function regionNecesaria(item) {
    const cur = regionActual();
    if (item.region) return cur === item.region ? null : { id: item.region, label: item.regionLabel || cap(item.region) };
    const menus = lsJSON(MENUS_KEY, {});
    if (!cur || !menus[cur] || menus[cur].includes(item.href)) return null;
    const otra = Object.keys(menus).find(r => r !== cur && menus[r].includes(item.href));
    return otra ? { id: otra, label: cap(otra) } : null;
  }

  /* ─── Actividades nuevas: se colocan solas en su bloque ─────────────────
   * El Menú agrupa cada actividad bajo un título («Competir», «Tu colección»…). Lo que aparezca allí y no esté
   * en BLOQUES se guarda con su emoji y nombre, y el panel lo pone en el bloque equivalente. */
  const EXTRAS_KEY = 'adx-accesos-extras';
  const SECCION_A_BLOQUE = {          // título de sección del Menú → id de bloque del panel
    'competir': 'pvp', 'tu coleccion': 'tiendas', 'para hoy': 'pve', 'tu base': 'extra',
    'la historia': 'extra', 'lo demas': 'extra',
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

  const regionesConocidas = () => new Set(['kanto', 'johto', 'hoenn', 'sinnoh', 'teselia', ...Object.keys(lsJSON(MENUS_KEY, {}))]);

  function anotarNovedadesDelMenu(raiz = document) {
    const conocidos = hrefsConocidos();
    const extras = lsJSON(EXTRAS_KEY, {});
    let cambio = false;
    for (const a of raiz.querySelectorAll('main a[href^="/"]')) {
      const href = a.getAttribute('href');
      if (conocidos.has(href) || NO_ACCESO.has(href)) continue;
      const h2 = a.closest('section') && a.closest('section').querySelector('h2.titulo-seccion');
      const bloque = h2 && SECCION_A_BLOQUE[normalizarTexto(h2.textContent)];
      if (!h2) continue;                                   // banners y tarjetas sueltas: no son accesos de un bloque
      const datos = leerItemDeMenu(a);
      if (!datos) continue;
      const nuevo = { ...datos, bloque: FORZAR_BLOQUE[href] || bloque || 'extra' };
      // Si el Menú dice «Solo en Teselia» (o cualquier región conocida), el acceso viaja solo hasta allí
      const solo = a.textContent.replace(/\s+/g, ' ').match(/solo (?:en|aparece en|se puede en)\s+([A-Za-zÁÉÍÓÚáéíóúñ]+)/i);
      const reg = solo && normalizarTexto(solo[1]);
      if (reg && regionesConocidas().has(reg)) nuevo.region = reg;
      if (JSON.stringify(extras[href]) !== JSON.stringify(nuevo)) { extras[href] = nuevo; cambio = true; }
    }
    if (cambio) lsPut(EXTRAS_KEY, extras);
  }

  // Accesos de un bloque: los escritos a mano + los aprendidos (+ un Safari por cada región que lo tenga en su Menú)
  function itemsDe(b) {
    const items = [...b.items];
    const ya = new Set(items.map(i => i.href));
    const conocidos = hrefsConocidos();
    const extras = lsJSON(EXTRAS_KEY, {});
    for (const href of Object.keys(extras)) {
      const destino = FORZAR_BLOQUE[href] || ALIAS_BLOQUE[extras[href].bloque] || extras[href].bloque;
      if (destino === b.id && !conocidos.has(href) && !ya.has(href)) {
        const it = { href, icon: extras[href].icon, label: extras[href].label };
        if (extras[href].region) { it.region = extras[href].region; it.regionLabel = cap(extras[href].region); }
        items.push(it);
      }
    }
    if (b.id === 'pve') {
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
    leerEstadoDe(document, regionActual(), true);
  }
  // `seguro`: la región viene de la propia página (si no, no se aprende el Menú de esa región para no mezclarlo)
  function leerEstadoDe(raiz, reg, seguro) {
    if (seguro) anotarMenuDeRegion(raiz, reg);
    anotarNovedadesDelMenu(raiz);
    const estado = {};
    // Lo de otras regiones («/safari@johto»…) se conserva del mismo día: el Menú solo enseña la región actual
    const previo = estadoDeHoy();
    if (previo) for (const k of Object.keys(previo.estado)) if (k.includes('@')) estado[k] = previo.estado[k];
    for (const a of raiz.querySelectorAll('main a[href^="/"]')) {
      const p = a.querySelector('.pastilla');
      if (!p) continue;
      const txt = p.textContent.replace(/\s+/g, ' ').trim();
      const href = a.getAttribute('href');
      estado[href] = txt;
      if (reg) estado[`${href}@${reg}`] = txt;
    }
    if (Object.keys(estado).length) lsPut(ESTADO_KEY, { dia: hoy(), t: Date.now(), estado });
    return Object.keys(estado).length > 0;
  }

  /* ─── El estado se refresca solo: se pide el Menú en segundo plano cada pocos minutos ─── */
  const MENU_REFRESCO = 3 * 60 * 1000;
  let menuPidiendo = false, menuIntento = 0;
  async function refrescarMenu(forzar = false) {
    if (/^\/menu\/?$/.test(location.pathname) || menuPidiendo) return;
    if (!forzar && !document.getElementById(PANEL_ID)) return;           // solo mientras se ve el panel
    const e = estadoDeHoy();
    if (!forzar && (Date.now() - menuIntento < 60000 || (e && Date.now() - e.t < MENU_REFRESCO))) return;
    menuIntento = Date.now();
    menuPidiendo = true;
    try {
      const r = await fetch('/menu', { credentials: 'same-origin' });
      if (!r.ok) return;
      const html = await r.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const propia = regionEnJSON(html);
      if (leerEstadoDe(doc, propia || regionActual(), !!propia)) repintarPanel();
    } catch { /* sin red: se queda lo guardado */ }
    finally { menuPidiendo = false; }
  }
  /* ─── Golf: retos con apuesta pendientes (el mismo número que enseña el botón «Retos con apuesta») ───
   * Cuenta los retos que te han mandado y aún no has aceptado y los que están en juego y te toca tirar.
   * Se leen de los datos que trae la propia página /golf, pedida en segundo plano. */
  const GOLF_KEY = 'adx-accesos-golf';
  let golfPidiendo = false, golfIntento = 0;
  // Texto de los datos de Next.js («self.__next_f.push([1,"…"])») ya desescapado
  function textoFlight(html) {
    let t = '';
    const re = /self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g;
    let m;
    while ((m = re.exec(html))) { try { t += JSON.parse(m[1]); } catch { /* trozo raro */ } }
    return t;
  }
  function sacarLista(t, clave) {
    const i = t.indexOf('"' + clave + '":[');
    if (i < 0) return null;
    const j = t.indexOf('[', i);
    let d = 0, str = false, esc = false;
    for (let k = j; k < t.length; k++) {
      const ch = t[k];
      if (str) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') str = false; continue; }
      if (ch === '"') str = true;
      else if (ch === '[' || ch === '{') d++;
      else if (ch === ']' || ch === '}') { if (--d === 0) { try { return JSON.parse(t.slice(j, k + 1)); } catch { return null; } } }
    }
    return null;
  }
  function contarRetosGolf(t) {
    const retos = sacarLista(t, 'retos'), mi = (t.match(/"miId":"([^"]+)"/) || [])[1];
    if (!Array.isArray(retos) || !mi) return null;
    const nada = v => v == null || v === '$undefined';
    return retos.filter(r => {
      const soyRetador = r.retadorId === mi, misTiros = soyRetador ? r.tirosRetador : r.tirosRetado;
      return (r.estado === 'jugando' && nada(misTiros)) || (r.estado === 'pendiente' && !soyRetador);
    }).length;
  }
  function guardarRetosGolf(n) {
    if (n == null) return;
    const g = lsJSON(GOLF_KEY, null);
    lsPut(GOLF_KEY, { n, t: Date.now() });
    if (!g || g.n !== n) repintarPanel();
  }
  // En /golf mismo: el globo rojo del botón «Retos con apuesta»
  function leerRetosGolfEnPantalla() {
    if (!/^\/golf\/?$/.test(location.pathname)) return;
    const b = [...document.querySelectorAll('nav[aria-label="Secciones del campo"] button')].find(x => /retos con apuesta/i.test(x.textContent || ''));
    if (!b) return;
    const globo = b.querySelector('span');
    guardarRetosGolf(globo ? parseInt(globo.textContent, 10) || 0 : 0);
  }
  async function refrescarGolf(forzar = false) {
    if (golfPidiendo || /^\/golf\/?$/.test(location.pathname)) return;
    if (!forzar && !document.getElementById(PANEL_ID)) return;
    const g = lsJSON(GOLF_KEY, null);
    if (!forzar && (Date.now() - golfIntento < 60000 || (g && Date.now() - g.t < MENU_REFRESCO))) return;
    golfIntento = Date.now();
    golfPidiendo = true;
    try {
      const r = await fetch('/golf', { credentials: 'same-origin' });
      if (r.ok) guardarRetosGolf(contarRetosGolf(textoFlight(await r.text())));
    } catch { /* sin red: se queda lo guardado */ }
    finally { golfPidiendo = false; }
  }

  /* ─── Solar de los Sueños: ¿hay alguien durmiendo, ya despierto o está libre? ───
   * «Despertarlo» / «Ya se ha despertado» → despierto · «soñando…» → durmiendo (si pone cuánto falta, se apunta la hora)
   * · nada de eso → libre. Se lee en /solar y, fuera, pidiendo la página en segundo plano. */
  const SOLAR_KEY = 'adx-accesos-solar';
  let solarPidiendo = false, solarIntento = 0;
  function leerSolar(raiz) {
    const main = raiz.querySelector('main');
    if (!main) return null;
    const txt = main.textContent.replace(/\s+/g, ' ');
    if (!/solar de los sue[ñn]os/i.test(txt)) return null;                // no es la página del Solar (otra región, error…)
    const botonDespertar = [...main.querySelectorAll('button')].some(b => /^\s*despertarlo\s*$/i.test(b.textContent || ''));
    if (botonDespertar || /ya se ha despertado/i.test(txt)) return { estado: 'despierto' };
    // La tarjeta del Pokémon que duerme («Nv.79 · soñando…»); el tiempo que falte se busca solo dentro de ella
    const linea = [...main.querySelectorAll('p')].find(q => /so[ñn]ando|durmiendo/i.test(q.textContent || ''));
    if (linea) {
      const tarjeta = (linea.closest('.tarjeta-sueno') || linea.parentElement).textContent.replace(/\s+/g, ' ');
      const m = tarjeta.match(/(\d+)\s*h(?:oras?)?\b(?:\s*(?:y\s*)?(\d+)\s*min)?|(\d+)\s*min/i);
      const min = m ? (m[1] ? parseInt(m[1], 10) * 60 + parseInt(m[2] || '0', 10) : parseInt(m[3], 10)) : 0;
      return { estado: 'durmiendo', despiertaAt: min ? Date.now() + min * 60000 : null };
    }
    return { estado: 'libre' };
  }
  function guardarSolar(e) {
    if (!e) return;
    const g = lsJSON(SOLAR_KEY, null);
    lsPut(SOLAR_KEY, { ...e, t: Date.now() });
    if (!g || g.estado !== e.estado) repintarPanel();
  }
  function pillSolar() {
    const g = lsJSON(SOLAR_KEY, null);
    if (!g) return null;
    if (g.estado === 'despierto' || (g.estado === 'durmiendo' && g.despiertaAt && Date.now() >= g.despiertaAt)) return 'Despierto';
    if (g.estado === 'durmiendo') return g.despiertaAt ? `durmiendo · ${textoRestante(g.despiertaAt - Date.now())}` : 'durmiendo';
    return 'libre';
  }
  async function refrescarSolar(forzar = false) {
    if (/^\/solar\/?$/.test(location.pathname)) { guardarSolar(leerSolar(document)); return; }
    if (solarPidiendo || (!forzar && !document.getElementById(PANEL_ID))) return;
    const g = lsJSON(SOLAR_KEY, null);
    if (!forzar && (Date.now() - solarIntento < 60000 || (g && Date.now() - g.t < MENU_REFRESCO))) return;
    solarIntento = Date.now();
    solarPidiendo = true;
    try {
      const r = await fetch('/solar', { credentials: 'same-origin' });
      if (r.ok) guardarSolar(leerSolar(new DOMParser().parseFromString(await r.text(), 'text/html')));
    } catch { /* sin red: se queda lo guardado */ }
    finally { solarPidiendo = false; }
  }

  function repintarPanel() {
    const panel = document.getElementById(PANEL_ID);
    if (panel) panel.replaceWith(crearPanel());
  }

  /* ─── ¿Tarea hecha? (se pinta con ✓) ─────────────────────────────────── */
  function esHecho(it, pill) {
    if (!pill) return false;
    const p = normalizarTexto(pill);
    if (/^durmiendo/.test(p)) return true;
    if (/hecho|parado|complet|terminad|agotad|conseguid|cobrad|recogid|reclamad|manana|sin (intentos|energia|tiradas|vidas|usos|turnos)|no quedan|ya has/.test(p)) return true;
    const m = p.match(/^(\d+)\s*(?:de|\/)\s*(\d+)/);
    if (!m) return false;
    if (it.href === '/salon') return +m[1] === 0;                        // Salón: «N de 20» es lo que queda por comprar
    return +m[2] > 0 && +m[1] >= +m[2];                                   // «30 de 30 hoy»: completo
  }
  // Pastilla de un acceso; los de varias regiones (Safari) guardan una por región: «/safari@kanto»
  const claveEstado = it => it.porRegion ? `${it.href}@${it.region}` : it.href;
  // «Hecho hoy» puesto a mano al pulsar el acceso (Safari): se borra solo al cambiar de día
  const HECHOS_KEY = 'adx-accesos-hechos';
  const hechosHoy = () => { const h = lsJSON(HECHOS_KEY, null); return h && h.dia === hoy() ? h.keys : []; };
  function marcarHecho(it) {
    const k = claveEstado(it), keys = hechosHoy();
    if (!keys.includes(k)) { keys.push(k); lsPut(HECHOS_KEY, { dia: hoy(), keys }); }
  }
  const pillDe = (it, est) => {
    if (it.href === '/salon') return pillSalon();
    if (it.href === '/solar') { const sp = pillSolar(); if (sp) return sp; }
    if (it.href === '/golf') { const g = lsJSON(GOLF_KEY, null); if (g && g.n > 0) return `${g.n} reto${g.n > 1 ? 's' : ''}`; }
    const leida = (est && est.estado[claveEstado(it)]) || '';
    if (!it.porRegion) return leida;
    if (hechosHoy().includes(claveEstado(it))) return 'hecho hoy';
    return leida || 'te toca';
  };

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

  /* ─── Salón: energía que queda por comprar hoy («Te quedan 18 de 20 de energía…») ─── */
  const SALON_KEY = 'adx-accesos-salon';
  let salonIntento = 0, salonPidiendo = false;

  function parsearCupoSalon(raiz) {
    const t = (raiz.body ? raiz.body : raiz).textContent.replace(/\s+/g, ' ');
    const m = t.match(/Te quedan\s+(\d+)\s+de\s+(\d+)\s+de energ/i);
    return m ? { left: parseInt(m[1], 10), total: parseInt(m[2], 10) } : null;
  }

  function guardarCupoSalon(c) {
    if (!c) return;
    const p = lsJSON(SALON_KEY, null);
    if (p && p.dia === hoy() && p.left === c.left && p.total === c.total) return;
    lsPut(SALON_KEY, { dia: hoy(), left: c.left, total: c.total, t: Date.now() });
    const panel = document.getElementById(PANEL_ID);
    if (panel) panel.replaceWith(crearPanel());
  }

  // «18 de 20»; si el último dato es de otro día, el cupo ya se ha renovado entero
  function pillSalon() {
    const s = lsJSON(SALON_KEY, null);
    if (!s) return '';
    return `${s.dia === hoy() ? s.left : s.total} de ${s.total}`;
  }

  async function refrescarSalon() {
    if (/^\/salon\/?$/.test(location.pathname)) { guardarCupoSalon(parsearCupoSalon(document)); return; }
    const s = lsJSON(SALON_KEY, null);
    if (salonPidiendo || Date.now() - salonIntento < 5 * 6e4 || (s && s.dia === hoy() && Date.now() - s.t < SUBASTA_REFRESCO)) return;
    salonIntento = Date.now();
    salonPidiendo = true;
    try {
      const r = await fetch('/salon', { credentials: 'same-origin' });
      if (r.ok) guardarCupoSalon(parsearCupoSalon(new DOMParser().parseFromString(await r.text(), 'text/html')));
    } catch { /* sin red: se queda lo guardado */ }
    finally { salonPidiendo = false; }
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
      ${U} .ax-aparte{margin:2px 12px 0;padding:10px 0 12px;border-top:2px solid rgba(127,127,127,.28)}
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
    const hecho = esHecho(item, pill);
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

    if (item.porRegion) a.addEventListener('click', (ev) => { if (ev.button === 0) marcarHecho(item); });   // Safari: al pulsarlo cuenta como hecho hoy
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
    if (b.diario) {
      const conEstado = itemsDe(b).filter(i => pillDe(i, est));
      const hechos = conEstado.filter(i => esHecho(i, pillDe(i, est))).length;
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
    // En PvE, lo pendiente primero y lo hecho al final; los Safari van siempre aparte, al final y sin título
    const hecho = i => (esHecho(i, pillDe(i, est)) ? 1 : 0);
    const todos = b.diario ? itemsDe(b).sort((x, y) => hecho(x) - hecho(y)) : itemsDe(b);
    const esSafari = i => i.porRegion && i.href === '/safari';
    for (const it of todos.filter(i => !esSafari(i))) ul.appendChild(crearItem(it, est));
    const aparte = todos.filter(esSafari);
    if (aparte.length) {
      const ul2 = document.createElement('ul');
      ul2.className = 'ax-grid ax-aparte px-3 pb-3';
      for (const it of aparte) ul2.appendChild(crearItem(it, est));
      ul.insertAdjacentElement('afterend', ul2);
    }
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
    const enlace = wrapper.querySelector('a[href="/menu"]');
    if (est && enlace) enlace.addEventListener('click', ev => {             // ↻ refresca aquí mismo, sin ir al Menú
      if (ev.button !== 0 || ev.metaKey || ev.ctrlKey) return;
      ev.preventDefault();
      enlace.textContent = 'actualizando…';
      Promise.all([refrescarMenu(true), refrescarGolf(true), refrescarSolar(true)]).then(() => repintarPanel());
    });
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
      refrescarSalon();
      desmontarSiNoToca();
      montar();
      refrescarMenu();
      refrescarGolf();
      leerRetosGolfEnPantalla();
      refrescarSolar();
    }, 150);
  });

  esperarHidratacion().then(() => {
    observer.observe(document.body, { childList: true, subtree: true });
    continuarViajePendiente();
    leerEstadoDelMenu();
    refrescarSubasta();
    refrescarSalon();
    montar();
    refrescarMenu();
    refrescarGolf();
    refrescarSolar();
    // Cada minuto: se pide el Menú si toca y se repinta (para que «hace N min» y las ✓ estén al día)
    setInterval(() => { refrescarMenu(); refrescarGolf(); refrescarSolar(); if (document.visibilityState === 'visible') repintarPanel(); }, 60000);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { refrescarMenu(); refrescarGolf(); refrescarSolar(); } });
  });
})();
