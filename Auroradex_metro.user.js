// ==UserScript==
// @name         Aurora Dex · Metro Batalla (pelear en bucle y ventaja de tipos)
// @namespace    auroradex-metro
// @version      1.4.0
// @description  Solo en /metro. Al elegir equipo analiza tus seis (debilidades, estadísticas, flojos) y recomienda el mejor orden (lo pones tú); en cada parada predice el combate. Pulsa «Pelear» en bucle con tope de paradas o de racha.
// @match        https://auroradex.es/*
// @match        https://www.auroradex.es/*
// @updateURL    https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_metro.user.js
// @downloadURL  https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_metro.user.js
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// @connect      pokeapi.co
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
      const tick = () => {
        const listo = document.readyState === 'complete' && document.querySelector('main') && Date.now() - quietSince >= 800;
        if (listo || Date.now() - t0 > maxMs) { obs.disconnect(); setTimeout(resolve, 300); }
        else setTimeout(tick, 200);
      };
      tick();
    });
  }

  const PANEL_ID = 'axm-panel';
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const pausa = (a, b) => sleep(a + Math.random() * (b - a));
  const norm = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  const visible = el => !!(el && (el.offsetParent || el.getClientRects().length));
  const ajeno = el => !!el.closest('#' + PANEL_ID);
  const COLOR_TIPO = { normal: '#A8A77A', fuego: '#EE8130', agua: '#6390F0', planta: '#7AC74C', electrico: '#F7D02C', hielo: '#96D9D6', lucha: '#C22E28', veneno: '#A33EA1', tierra: '#E2BF65', volador: '#A98FF3', psiquico: '#F95587', bicho: '#A6B91A', roca: '#B6A136', fantasma: '#735797', dragon: '#6F35FC', siniestro: '#705746', acero: '#B7B7CE', hada: '#D685AD' };
  // Paneles con el estilo oscuro de la pantalla del metro
  function axmEstilo() {
    if (document.getElementById('axm-css')) return;
    const st = document.createElement('style');
    st.id = 'axm-css';
    st.textContent = `
      .axm-caja{position:relative;overflow:hidden;background:linear-gradient(180deg,#1C2230,#141821)!important;border:2px solid #2F3644!important;box-shadow:0 4px 0 0 rgba(0,0,0,.25),0 12px 26px -14px rgba(0,0,0,.8),inset 0 1px 0 rgba(255,255,255,.06);color:#E8ECF3}
      .axm-caja::before{content:"";position:absolute;left:0;right:0;top:0;height:3px;background:linear-gradient(90deg,#3BA7E0,#8B5CF6,#E0473A);opacity:.9}
      .axm-tit{display:flex;align-items:center;gap:8px;font-family:var(--font-display),system-ui,sans-serif;font-size:14px;font-weight:800;letter-spacing:.02em;color:#F2F5FA}
      .axm-tit i{font-style:normal;width:26px;height:26px;border-radius:9px;display:grid;place-items:center;font-size:14px;background:linear-gradient(150deg,#2B3446,#1B2130);box-shadow:inset 0 -2px 0 rgba(0,0,0,.35),0 0 0 1px #343D50}
      .axm-veredicto{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:900;background:color-mix(in srgb,var(--c) 16%,transparent);color:var(--c);box-shadow:inset 0 0 0 1.5px color-mix(in srgb,var(--c) 45%,transparent)}
      .axm-fila{background:linear-gradient(90deg,#222938,#1B202C);border-left:3px solid var(--c,#343D50);box-shadow:inset 0 0 0 1px #2A3140;animation:axm-entra .25s ease both}
      @keyframes axm-entra{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:none}}
      .axm-chip{display:inline-block;padding:0 6px;border-radius:999px;font-size:8.5px;font-weight:900;text-transform:uppercase;letter-spacing:.03em;color:#fff;text-shadow:0 1px 1px rgba(0,0,0,.45);line-height:14px}
      .axm-campo{background:#0D1016!important;border:1.5px solid #2F3644!important;color:#E8ECF3!important;transition:border-color .15s}
      .axm-campo:focus{border-color:#3BA7E0!important}
      .axm-boton{background:linear-gradient(180deg,#F4F7FB,#D9E0EA)!important;color:#101319!important;border:0;border-bottom:4px solid #9AA6B8!important;box-shadow:0 10px 18px -12px rgba(0,0,0,.9);font-family:var(--font-display),system-ui,sans-serif;letter-spacing:.03em}
      .axm-boton.axm-on{background:linear-gradient(180deg,#FF7A6E,#E0473A)!important;color:#fff!important;border-bottom-color:#9E2B22!important}
      .axm-msg:empty{display:none}
      .axm-msg{margin:0 auto;width:fit-content;max-width:100%;padding:3px 12px;border-radius:999px;background:rgba(255,255,255,.05);box-shadow:inset 0 0 0 1px #2A3140}
      .axm-sw{accent-color:#3BA7E0;width:16px;height:16px}`;
    document.head.appendChild(st);
  }
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

  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
  const lsPut = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin storage */ } };
  const enMetro = () => /^\/metro(\/|$)/.test(location.pathname);

  /* ------------------------------------------------------------------ *
   *  TABLA DE TIPOS (ataque → defensa). Lo que no aparece es ×1.
   * ------------------------------------------------------------------ */
  const TABLA = {
    normal: { roca: .5, acero: .5, fantasma: 0 },
    fuego: { planta: 2, hielo: 2, bicho: 2, acero: 2, fuego: .5, agua: .5, roca: .5, dragon: .5 },
    agua: { fuego: 2, tierra: 2, roca: 2, agua: .5, planta: .5, dragon: .5 },
    planta: { agua: 2, tierra: 2, roca: 2, fuego: .5, planta: .5, veneno: .5, volador: .5, bicho: .5, dragon: .5, acero: .5 },
    electrico: { agua: 2, volador: 2, electrico: .5, planta: .5, dragon: .5, tierra: 0 },
    hielo: { planta: 2, tierra: 2, volador: 2, dragon: 2, fuego: .5, agua: .5, hielo: .5, acero: .5 },
    lucha: { normal: 2, hielo: 2, roca: 2, siniestro: 2, acero: 2, veneno: .5, volador: .5, psiquico: .5, bicho: .5, hada: .5, fantasma: 0 },
    veneno: { planta: 2, hada: 2, veneno: .5, tierra: .5, roca: .5, fantasma: .5, acero: 0 },
    tierra: { fuego: 2, electrico: 2, veneno: 2, roca: 2, acero: 2, planta: .5, bicho: .5, volador: 0 },
    volador: { planta: 2, lucha: 2, bicho: 2, electrico: .5, roca: .5, acero: .5 },
    psiquico: { lucha: 2, veneno: 2, psiquico: .5, acero: .5, siniestro: 0 },
    bicho: { planta: 2, psiquico: 2, siniestro: 2, fuego: .5, lucha: .5, veneno: .5, volador: .5, fantasma: .5, acero: .5, hada: .5 },
    roca: { fuego: 2, hielo: 2, volador: 2, bicho: 2, lucha: .5, tierra: .5, acero: .5 },
    fantasma: { psiquico: 2, fantasma: 2, siniestro: .5, normal: 0 },
    dragon: { dragon: 2, acero: .5, hada: 0 },
    siniestro: { psiquico: 2, fantasma: 2, lucha: .5, siniestro: .5, hada: .5 },
    acero: { hielo: 2, roca: 2, hada: 2, fuego: .5, agua: .5, electrico: .5, acero: .5 },
    hada: { lucha: 2, dragon: 2, siniestro: 2, fuego: .5, veneno: .5, acero: .5 },
  };
  const DE_INGLES = { normal: 'normal', fire: 'fuego', water: 'agua', grass: 'planta', electric: 'electrico', ice: 'hielo', fighting: 'lucha', poison: 'veneno', ground: 'tierra', flying: 'volador', psychic: 'psiquico', bug: 'bicho', rock: 'roca', ghost: 'fantasma', dragon: 'dragon', dark: 'siniestro', steel: 'acero', fairy: 'hada' };
  const NOMBRE_TIPO = { electrico: 'Eléctrico', psiquico: 'Psíquico', dragon: 'Dragón' };
  const bonito = t => NOMBRE_TIPO[t] || (t.charAt(0).toUpperCase() + t.slice(1));
  const eficacia = (ataque, defensa) => defensa.reduce((m, d) => m * ((TABLA[ataque] || {})[d] ?? 1), 1);
  // Lo mejor que le hace A a B con sus propios tipos (se supone que cada uno ataca con los suyos)
  const mejorGolpe = (a, b) => a.tipos.length ? Math.max(...a.tipos.map(t => eficacia(t, b.tipos))) : 1;

  /* ------------------------------------------------------------------ *
   *  TIPOS DE LOS RIVALES: la web solo enseña nombre y sprite; el tipo se busca por nº de Pokédex en PokéAPI
   *  (solo se manda el número) y se guarda para no volver a pedirlo.
   * ------------------------------------------------------------------ */
  const LS_TIPOS = 'axm-tipos';
  const tiposGuardados = lsGet(LS_TIPOS, {});
  const pidiendo = new Set();
  function pedirJSON(url) {
    return new Promise((ok, mal) => {
      if (typeof GM_xmlhttpRequest === 'function') {
        GM_xmlhttpRequest({ method: 'GET', url, timeout: 10000, onload: r => { try { ok(JSON.parse(r.responseText)); } catch (e) { mal(e); } }, onerror: mal, ontimeout: mal });
      } else fetch(url).then(r => r.json()).then(ok, mal);
    });
  }
  async function tiposDe(num) {
    if (!num) return null;
    if (tiposGuardados[num]) return tiposGuardados[num];
    if (pidiendo.has(num)) return null;
    pidiendo.add(num);
    try {
      const d = await pedirJSON('https://pokeapi.co/api/v2/pokemon/' + num);
      const t = (d.types || []).sort((a, b) => a.slot - b.slot).map(x => DE_INGLES[x.type.name]).filter(Boolean);
      if (t.length) { tiposGuardados[num] = t; lsPut(LS_TIPOS, tiposGuardados); refrescarTodo(); }
      return t;
    } catch { return null; }
    finally { pidiendo.delete(num); }
  }

  /* ------------------------------------------------------------------ *
   *  LECTURA DE LA PANTALLA
   * ------------------------------------------------------------------ */
  function seccionParada() {
    return $$('main section').find(s => !ajeno(s) && /^\s*parada\s+\d+/i.test((s.querySelector('p') || {}).textContent || ''));
  }
  function leerTarjeta(card) {
    const img = card.querySelector('img');
    if (!img) return null;
    const src = img.getAttribute('src') || '';
    const num = parseInt((src.match(/\/(\d+)(?:[-_][a-z0-9]+)?\.(?:png|gif|webp)/i) || [])[1], 10) || null;
    const ps = $$('p', card).map(p => p.textContent.trim());
    const nivel = parseInt((ps.find(t => /^Nv\.\s*\d+/i.test(t)) || '').replace(/\D/g, ''), 10) || null;
    const tiposPills = $$('span.rounded-pill', card).map(s => norm(s.textContent)).filter(t => TABLA[t]);
    const barra = card.querySelector('span.block.h-full');
    const vida = barra ? parseFloat(barra.style.width) : null;
    const nombre = img.getAttribute('alt') || ps[0] || '?';
    return { card, nombre, num, nivel, tipos: tiposPills.length ? tiposPills : (tiposGuardados[num] || []), conPills: tiposPills.length > 0, vida, debil: parseFloat(card.style.opacity || '1') < 0.9 };
  }
  function leerCombate() {
    const sec = seccionParada();
    if (!sec) return null;
    const grid = sec.querySelector('div.grid');
    if (!grid || grid.children.length < 3) return null;
    const mios = $$(':scope > div', grid.children[0]).map(leerTarjeta).filter(Boolean);
    const rivales = $$(':scope > div', grid.children[2]).map(leerTarjeta).filter(Boolean);
    const parada = parseInt(((sec.querySelector('p') || {}).textContent || '').replace(/\D/g, ''), 10) || null;
    return { sec, mios, rivales, parada };
  }
  const racha = () => {
    const p = $$('main p').find(x => !ajeno(x) && /^racha$/i.test(x.textContent.trim()));
    const v = p && p.previousElementSibling;
    return v ? parseInt(v.textContent, 10) : null;
  };
  const botonPelear = () => $$('main button').find(b => !ajeno(b) && visible(b) && /pelear/i.test(b.textContent || ''));
  const botonCambiarVia = () => $$('main button').find(b => !ajeno(b) && visible(b) && /cambiar v[ií]a/i.test(b.textContent || ''));
  const cambiosQuedan = () => { const b = botonCambiarVia(); const m = b && b.textContent.match(/quedan?\s+(\d+)/i); return m ? parseInt(m[1], 10) : 0; };
  const energia = () => {
    const el = $$('header span, header p, header div').find(e => !e.children.length && /^\s*\d+\s*\/\s*\d+\s*$/.test(e.textContent || ''));
    return el ? parseInt(el.textContent, 10) : null;
  };

  /* ------------------------------------------------------------------ *
   *  ANÁLISIS: cada uno de los tuyos contra cada rival (tipos + nivel)
   *  Puntos por cruce: log2(lo que le haces) − log2(lo que te hace) + ajuste por nivel (±1 cada ~15 niveles)
   * ------------------------------------------------------------------ */
  function cruce(a, b) {
    const ataque = mejorGolpe(a, b), defensa = mejorGolpe(b, a);
    const lg = x => (x === 0 ? -3 : Math.log2(x));
    const nivel = a.nivel && b.nivel ? (a.nivel - b.nivel) / 15 : 0;
    return { ataque, defensa, puntos: lg(ataque) - lg(defensa) + nivel };
  }
  function analizar(c) {
    if (!c || !c.mios.length || !c.rivales.length) return null;
    const sinTipos = [...c.mios, ...c.rivales].some(p => !p.tipos.length);
    const filas = c.rivales.map(r => {
      const opciones = c.mios.filter(m => !m.debil).map(m => ({ m, ...cruce(m, r) })).sort((x, y) => y.puntos - x.puntos);
      return { r, mejor: opciones[0] || null, peor: opciones[opciones.length - 1] || null };
    });
    const suma = filas.reduce((s, f) => s + (f.mejor ? f.mejor.puntos : -2), 0) / filas.length;
    // En orden (1.º contra 1.º…), por si el combate va así
    const enOrden = c.rivales.map((r, i) => c.mios[i] ? cruce(c.mios[i], r).puntos : -2).reduce((s, x) => s + x, 0) / c.rivales.length;
    const nota = (suma + enOrden) / 2;
    const veredicto = nota >= 0.8 ? { txt: 'Ventaja clara', color: '#8FD88A' } : nota >= 0 ? { txt: 'Igualado, algo a favor', color: '#E6D36A' } : nota >= -0.8 ? { txt: 'Igualado, algo en contra', color: '#FFB23E' } : { txt: 'Desventaja', color: '#FF6B6B' };
    return { filas, nota, veredicto, sinTipos };
  }

  const mult = x => (x === 0 ? '×0' : x === 0.25 ? '×¼' : x === 0.5 ? '×½' : '×' + x);
  let firmaAnalisis = '';
  const refrescarTodo = () => { firmaAnalisis = ''; firmaEquipo = ''; memoEquipo = null; pintarAnalisis(); pintarEquipo(); };
  function pintarAnalisis() {
    const panel = document.getElementById(PANEL_ID);
    if (!panel) return;
    const c = leerCombate();
    if (c) for (const p of [...c.mios, ...c.rivales]) if (!pokeGuardados[p.num]) datosDe(p.num);
    if (c && c.rivales.length && c.rivales.every(r => r.num)) { apuntarRivales(c); guardarParada(c); }
    const a = analizar(c);
    const pr = prediccion(c);
    const caja = panel.querySelector('.axm-analisis');
    const firma = JSON.stringify(a && [a.nota, pr && pr.duelos.map(d => [d.m.nombre, d.r.nombre, d.ganaM, Math.round(d.resto * 100)]), FACT, c.rivales.map(r => r.tipos)]);
    if (firma === firmaAnalisis) return;
    firmaAnalisis = firma;
    if (!a) { caja.innerHTML = ''; return; }
    const chip = t => `<span class="axm-chip" style="background:${COLOR_TIPO[t] || '#5B6475'}">${bonito(t)}</span>`;
    const pct = x => Math.max(1, Math.round(x * 100)) + '%';
    const veredicto = pr
      ? (pr.gana ? (pr.vivos >= 2 ? { txt: `Ganas · te quedan ${pr.vivos}`, color: '#8FD88A' } : { txt: 'Ganas justo', color: '#E6D36A' }) : { txt: `Pierdes · le quedan ${pr.restantes}`, color: '#FF6B6B' })
      : a.veredicto;
    const filaDuelo = d => {
      const e1 = tipoDeAtaque(d.m, d.r), e2 = tipoDeAtaque(d.r, d.m);
      return `
        <div class="axm-fila flex items-center gap-2 rounded-card p-1.5" style="--c:${d.ganaM ? '#8FD88A' : '#FF6B6B'}">
          <div class="min-w-0 flex-1">
            <p class="truncate text-[11px] font-extrabold" style="color:#E8ECF3">${d.m.nombre} <span style="color:#8A93A6">vs</span> ${d.r.nombre}</p>
            <p class="text-[9px] font-bold" style="color:#8A93A6">le hace ${e1.e === 0 ? 'Forcejeo' : mult(e1.e) + ' (' + bonito(e1.t) + ')'} · recibe ${e2.e === 0 ? 'Forcejeo' : mult(e2.e) + ' (' + bonito(e2.t) + ')'}</p>
          </div>
          <p class="shrink-0 text-right text-[10px] font-extrabold" style="color:${d.ganaM ? '#8FD88A' : '#FF6B6B'}">${d.ganaM ? '✔' : '✖'} ${d.ganaM ? d.m.nombre : d.r.nombre}<br><span class="text-[9px]" style="color:#8A93A6">le queda ${pct(d.resto)}</span></p>
        </div>`;
    };
    const calibrado = Object.values(lsGet(LS_CALIB, {})).reduce((n, b) => n + b.mio.length + b.rival.length, 0);
    caja.innerHTML = `
      <div class="flex items-center justify-between gap-2">
        <p class="axm-tit"><i>⚔️</i>Así irá el combate</p>
        <span class="axm-veredicto" style="--c:${veredicto.color}">${veredicto.txt}</span>
      </div>
      <div class="flex flex-wrap items-center gap-1 text-[9px] font-bold" style="color:#8A93A6">Rival: ${c.rivales.map(r => `<span>${r.nombre}</span> ${r.tipos.map(chip).join('')}`).join(' <span>→</span> ')}</div>
      ${pr ? pr.duelos.map(filaDuelo).join('') : '<p class="text-[10px] font-semibold" style="color:#8A93A6">Buscando estadísticas…</p>'}
      <p class="text-[9px] font-semibold" style="color:#8A93A6">En orden, de arriba a abajo. Estimación ${calibrado >= 6 ? `ajustada con ${calibrado} golpes reales vistos` : 'con datos de partida (se ajusta sola con cada combate que veas)'}.</p>
      ${pr && !pr.gana && cambiosQuedan() > 0 ? '<p class="text-[11px] font-bold" style="color:#FFB23E">💡 Mala pinta: quizá compense «Cambiar vía».</p>' : ''}`;
  }

  /* ------------------------------------------------------------------ *
   *  MODELO DE COMBATE (aproximado: el juego calcula el combate en su servidor)
   *  1 contra 1, sin cambios: el ganador sigue con la vida que le quede contra el siguiente. Cada uno ataca con
   *  el mejor de SUS tipos (ataque de 80 de potencia, ×1,5 por ser de su tipo), usa el mayor de Ataque/At. Esp.
   *  contra la defensa que toque, y pega primero el más rápido. Estadísticas: las base de PokéAPI al nivel que toque.
   * ------------------------------------------------------------------ */
  const LS_POKE = 'axm-poke';
  const pokeGuardados = lsGet(LS_POKE, {});
  const pidiendoPoke = new Set();
  async function datosDe(num) {
    if (!num) return null;
    if (pokeGuardados[num]) return pokeGuardados[num];
    if (pidiendoPoke.has(num)) return null;
    pidiendoPoke.add(num);
    try {
      const d = await pedirJSON('https://pokeapi.co/api/v2/pokemon/' + num);
      const t = (d.types || []).sort((a, b) => a.slot - b.slot).map(x => DE_INGLES[x.type.name]).filter(Boolean);
      const orden = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];
      const s = orden.map(k => ((d.stats || []).find(x => x.stat.name === k) || {}).base_stat || 70);
      if (t.length) {
        pokeGuardados[num] = { t, s };
        lsPut(LS_POKE, pokeGuardados);
        tiposGuardados[num] = t; lsPut(LS_TIPOS, tiposGuardados);
        refrescarTodo();
      }
      return pokeGuardados[num];
    } catch { return null; }
    finally { pidiendoPoke.delete(num); }
  }

  // Luchador listo para el modelo: tipos (los de la web si los enseña), estadísticas al nivel dado.
  // `lado`: 'mio' o 'rival' (el daño real de cada lado se calibra por separado con los combates vistos)
  function luchador(p, nivelForzado, baseDirecta, lado = 'mio') {
    const d = baseDirecta ? { s: baseDirecta, t: p.tipos } : pokeGuardados[p.num];
    if (!d) return null;
    const L = nivelForzado || p.nivel || 50, b = d.s;
    const st = i => Math.floor(2 * b[i] * L / 100) + 5;
    const esp = Math.floor(2 * Math.round((b[3] + b[4]) / 2) * L / 100) + 5;
    return { nombre: p.nombre, num: p.num, lado, nivel: L, tipos: (p.tipos && p.tipos.length) ? p.tipos : d.t, hp: Math.floor(3 * b[0] * L / 100) + L + 14, atk: st(1), def: st(2), spa: st(3), spd: st(4), esp, fis: b[1] >= b[3], spe: st(5), bst: b.reduce((x, y) => x + y, 0) };
  }
  /* ---- Modelo del juego, sacado del log de un combate de la Torre (donde se ven las estadísticas exactas) ----
   * PS = 3·base·Nv/100 + Nv + 14. El juego tiene una sola ESP (media de At. Esp. y Def. Esp.) para atacar y defender.
   * Pega cuerpo a cuerpo (ATQ contra DEF) si su Ataque base es igual o mayor que su At. Esp. base; si no, a distancia
   * (ESP contra ESP). Ataca con su tipo más eficaz (si empatan, el primero); si todos los suyos son poco eficaces y un
   * ataque Normal no lo es tanto, usa ataques Normal (cuerpo a cuerpo, sin el ×1,5 de su tipo). Muy eficaz ×1,65 y poco
   * eficaz ×0,6 por cada tipo del que recibe. Críticos: ~9% de los golpes, ×1,64 (de media, ×1,06). */
  function tipoDeAtaque(a, b) {
    let mejor = null;
    for (const t of a.tipos) { const e = eficacia(t, b.tipos); if (!mejor || e > mejor.e) mejor = { t, e, propio: true }; }
    if (!mejor) mejor = { t: 'normal', e: eficacia('normal', b.tipos), propio: true };
    if (mejor.e < 1) { const en = eficacia('normal', b.tipos); if (en > mejor.e) return { t: 'normal', e: en, propio: a.tipos.includes('normal') }; }
    return mejor;
  }
  const eficaciaJuego = (t, tipos) => tipos.reduce((m, x) => { const v = (TABLA[t] || {})[x] ?? 1; return m * (v === 0 ? 0 : v > 1 ? 1.65 : v < 1 ? 0.6 : 1); }, 1);
  const MEDIA_CRITICOS = 1 + 0.09 * 0.64;
  function dano(a, b) {
    const at = tipoDeAtaque(a, b);
    const fis = !at.propio || a.fis, A = fis ? a.atk : a.esp, D = fis ? b.def : b.esp;
    return ((2 * a.nivel / 5 + 2) * 30.5 * A / D / 50 + 2) * (at.propio ? 1.5 : 1) * eficaciaJuego(at.t, b.tipos);
  }

  /* ---- Calibración: cuánto quita de verdad cada golpe comparado con el modelo (se aprende de los logs) ----
   * Datos de partida: con este modelo tus golpes encajan tal cual (×1) y los del rival del Metro quitan ~0,55 de lo que
   * dice la fórmula (en los logs del Metro sus Pokémon pegan bastante menos). Con 6 golpes o más vistos, manda lo
   * aprendido. (La clave es nueva: lo aprendido con el modelo anterior no vale para este.) */
  const LS_CALIB = 'axm-calibra2';
  const PRIOR = { mio: 1, rival: 0.55 };
  const mediana = a => { const x = [...a].sort((p, q) => p - q); return x[Math.floor(x.length / 2)]; };
  let FACT = { ...PRIOR };
  function calcularFactores() {
    const todos = Object.values(lsGet(LS_CALIB, {})), l = lineaActual();
    const f = {};
    for (const lado of ['mio', 'rival']) {
      const deLinea = todos.filter(b => b.linea === l).flatMap(b => b[lado] || []);
      const global = todos.filter(b => lado === 'rival' || (b.linea === 'azul') === (l === 'azul')).flatMap(b => b[lado] || []);
      // En la Azul el equipo es prestado (sin entrenar): mientras no haya datos de esa línea, pega como un rival
      const sinDatos = l === 'azul' && lado === 'mio' ? PRIOR.rival : global.length >= 6 ? mediana(global) : PRIOR[lado];
      f[lado] = deLinea.length >= 6 ? mediana(deLinea) : sinDatos;
    }
    FACT = f;
    return f;
  }
  // Parte de la vida del rival que quita cada golpe (Forcejeo: 1/16 si no le afecta ninguno de sus tipos)
  function golpe(a, b) {
    if (tipoDeAtaque(a, b).e === 0) return 1 / 16;
    return dano(a, b) * MEDIA_CRITICOS / b.hp * (FACT[a.lado] || 0.8);
  }
  // Un duelo con la vida en fracciones (1 = entera): quién gana y con cuánta vida
  // Única habilidad del juego: Slaking (nº 289) ataca un turno sí y otro no (empieza atacando)
  const HOLGAZAN = 289;
  const turnos = (x, t) => (x.num === HOLGAZAN ? 2 * t - 1 : t);          // turnos para dar t golpes
  const golpesEn = (x, k) => (x.num === HOLGAZAN ? Math.ceil(k / 2) : k);  // golpes dados en k turnos
  function duelo(a, fa, b, fb) {
    const dA = golpe(a, b), dB = golpe(b, a);
    const tA = turnos(a, Math.ceil(fb / dA - 1e-9)), tB = turnos(b, Math.ceil(fa / dB - 1e-9));
    const primeroA = a.spe > b.spe || (a.spe === b.spe && fa >= fb);
    if (primeroA) return tA <= tB ? { ganaA: true, fa: fa - golpesEn(b, tA - 1) * dB, fb: 0 } : { ganaA: false, fa: 0, fb: fb - golpesEn(a, tB) * dA };
    return tB <= tA ? { ganaA: false, fa: 0, fb: fb - golpesEn(a, tB - 1) * dA } : { ganaA: true, fa: fa - golpesEn(b, tA) * dB, fb: 0 };
  }
  // Combate completo EN ORDEN (arriba → abajo): el que gana sigue con la vida que le quede.
  // `vidaA`: fracciones de vida de salida (Línea Negra). Con `detalle` devuelve también cada duelo.
  function combate(mios, rivales, vidaA, detalle) {
    let i = 0, j = 0, fa = mios.length ? (vidaA ? vidaA[0] : 1) : 0, fb = 1;
    const duelos = [];
    while (i < mios.length && j < rivales.length) {
      if (fa <= 0) { i++; fa = i < mios.length ? (vidaA ? vidaA[i] : 1) : 0; continue; }
      const r = duelo(mios[i], fa, rivales[j], fb);
      if (detalle) duelos.push({ m: mios[i], r: rivales[j], ganaM: r.ganaA, resto: r.ganaA ? r.fa : r.fb });
      if (r.ganaA) { fa = r.fa; j++; fb = 1; }
      else { fb = r.fb; i++; fa = i < mios.length ? (vidaA ? vidaA[i] : 1) : 0; }
    }
    return { gana: j >= rivales.length, vivos: mios.length - i, restantes: rivales.length - j, duelos };
  }

  /* ---- Rivales vistos por línea (para comparar con rivales de verdad) ---- */
  const LS_RIVALES = 'axm-rivales';
  let lineaVista = lsGet('axm-linea', 'metro');
  const lineaActual = () => {
    const h = $$('main h1').find(x => /^\s*l[ií]nea\s/i.test(x.textContent || ''));
    if (h) { const l = norm(h.textContent).replace(/^linea\s+/, ''); if (l !== lineaVista) { lineaVista = l; lsPut('axm-linea', l); } }
    return lineaVista;
  };
  function apuntarRivales(c) {
    const todos = lsGet(LS_RIVALES, {}), l = lineaActual(), lista = todos[l] || [];
    const clave = c.rivales.map(r => r.num + '@' + r.nivel).join(',');
    if (lista.some(e => e.clave === clave)) return;
    lista.push({ clave, equipo: c.rivales.map(r => ({ num: r.num, nombre: r.nombre, nivel: r.nivel })) });
    todos[l] = lista.slice(-80);
    lsPut(LS_RIVALES, todos);
  }
  // Rivales de referencia: los vistos en esta línea (si hay bastantes) o un banco genérico de todos los tipos
  const GENERICOS = ['normal', 'fuego', 'agua', 'planta', 'electrico', 'hielo', 'lucha', 'veneno', 'tierra', 'volador', 'psiquico', 'bicho', 'roca', 'fantasma', 'dragon', 'siniestro', 'acero',
    'agua/tierra', 'fuego/volador', 'planta/veneno', 'dragon/volador', 'acero/psiquico', 'agua/volador', 'roca/tierra', 'bicho/volador', 'psiquico/fantasma', 'siniestro/fantasma', 'electrico/acero', 'hielo/agua', 'lucha/acero', 'normal/volador', 'dragon/tierra'];
  function bancoRivales(nivel, base = 85) {
    const vistos = (lsGet(LS_RIVALES, {})[lineaActual()] || []);
    const equipos = [];
    for (const e of vistos) {
      for (const p of e.equipo) if (!pokeGuardados[p.num]) datosDe(p.num);
      const eq = e.equipo.map(p => luchador({ ...p, tipos: null }, lineaActual() === 'verde' ? 50 : p.nivel, null, 'rival')).filter(Boolean);
      if (eq.length === e.equipo.length && eq.length) equipos.push(eq);
    }
    if (equipos.length >= 8) return { equipos, origen: `${equipos.length} equipos rivales que ya te han salido en esta línea` };
    // genérico: tríos al azar de un banco de 32 tipos con la misma fuerza media que tu equipo (así se nota quién rinde más)
    let semilla = 7; const azar = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647;
    // cada tipo en 4 variantes (rápido, lento, de ataque, de aguante) con la misma suma de estadísticas
    const PERFILES = [[0, 0, 0, 0, 0, 25], [10, 5, 10, 5, 10, -40], [-5, 20, -10, 20, -10, -15], [20, -10, 15, -10, 15, -30]];
    const banco = [];
    for (const t of GENERICOS) PERFILES.forEach((pf, i) => {
      const b6 = pf.map(d => Math.max(30, base + d + Math.round((azar() - 0.5) * 10)));
      banco.push(luchador({ nombre: t + ' · ' + i, num: 'g', tipos: t.split('/'), nivel }, nivel, b6, 'rival'));
    });
    for (let k = 0; k < 300; k++) { const a = [...banco].sort(() => azar() - 0.5).slice(0, 3); equipos.push(a); }
    return { equipos, origen: vistos.length ? `rivales genéricos (solo llevas ${vistos.length} equipos vistos en esta línea)` : 'rivales genéricos de todos los tipos (aún no has visto rivales en esta línea)' };
  }

  // Debilidades y resistencias de un Pokémon por sus tipos
  function defensa(tipos) {
    const deb = [], res = [], inm = [];
    for (const t of Object.keys(TABLA)) {
      const e = eficacia(t, tipos);
      if (e >= 2) deb.push(e >= 4 ? bonito(t) + ' ×4' : bonito(t));
      else if (e === 0) inm.push(bonito(t));
      else if (e < 1) res.push(bonito(t));
    }
    return { deb, res, inm, x4: deb.some(d => /×4/.test(d)) };
  }

  /* ---- Pantalla «¿Con quién subes?»: análisis de los seis y mejor orden ---- */
  function seccionElegir() {
    return $$('main section').find(s => !ajeno(s) && /con qui[eé]n subes|elige tres/i.test((s.querySelector('p') || {}).textContent || ''));
  }
  function leerBanquillo() {
    const sec = seccionElegir();
    if (!sec) return null;
    const tam = parseInt(((sec.querySelector('span span') || sec.querySelector('span') || {}).textContent || '').split('/')[1], 10) || 3;
    const cands = $$('div.grid button', sec).map(b => {
      const img = b.querySelector('img'), ps = $$('p', b).map(p => p.textContent.trim());
      const num = parseInt(((img && img.getAttribute('src')) || '').match(/\/(\d+)(?:[-_][a-z0-9]+)?\.(?:png|gif|webp)/i)?.[1], 10) || null;
      const marca = b.querySelector('span.absolute');
      return { boton: b, nombre: ps[0] || '?', nivel: parseInt((ps.find(t => /^Nv\./.test(t)) || '').replace(/\D/g, ''), 10) || 50, num, orden: marca ? parseInt(marca.textContent, 10) : 0, tipos: null };
    });
    return { sec, tam, cands };
  }
  function permutaciones(arr, k) {
    const out = [];
    const rec = (pref, resto) => { if (pref.length === k) { out.push(pref); return; } resto.forEach((x, i) => rec([...pref, x], resto.filter((_, j) => j !== i))); };
    rec([], arr);
    return out;
  }
  function analizarEquipo(b) {
    const verde = lineaActual() === 'verde';
    calcularFactores();
    const mios = b.cands.map(c => ({ c, l: luchador(c, verde ? 50 : c.nivel, null, 'mio') }));
    const faltan = mios.filter(m => !m.l);
    if (faltan.length) return { faltan: faltan.length };
    const nivelMedio = Math.round(mios.reduce((s, m) => s + m.l.nivel, 0) / mios.length);
    const baseMedia = Math.round(mios.reduce((s, m) => s + m.l.bst, 0) / mios.length / 6);
    const { equipos, origen } = bancoRivales(verde ? 50 : nivelMedio, baseMedia);
    // cada uno por separado: qué parte de los rivales tumba de uno en uno
    const rivalesSueltos = [...new Map(equipos.flat().map(r => [r.nombre + r.nivel, r])).values()];
    const fichas = mios.map(m => {
      const gana = rivalesSueltos.filter(r => duelo(m.l, 1, r, 1).ganaA).length / rivalesSueltos.length;
      const d = defensa(m.l.tipos);
      const ojo = [];
      if (d.x4) ojo.push('una debilidad ×4');
      if (d.deb.length >= 5) ojo.push(`${d.deb.length} debilidades`);
      if (m.l.bst < 420) ojo.push(`estadísticas bajas (${m.l.bst})`);
      return { ...m, gana, d, ojo, flojo: false };
    });
    // «Flojo»: de los que peor rinden del grupo y además con motivos (o muy por debajo de la media)
    const media = fichas.reduce((s, f) => s + f.gana, 0) / fichas.length;
    for (const f of fichas) f.flojo = f.gana < media - 0.15 || (f.gana < media && f.ojo.length > 0);
    // el mejor orden: todos los tríos ordenados contra los mismos equipos rivales
    let mejor = null;
    for (const orden of permutaciones(fichas, Math.min(b.tam, fichas.length))) {
      let ganadas = 0, vivos = 0;
      for (const eq of equipos) { const r = combate(orden.map(f => f.l), eq); if (r.gana) { ganadas++; vivos += r.vivos; } }
      const nota = ganadas / equipos.length + vivos / equipos.length / 100;
      if (!mejor || nota > mejor.nota) mejor = { orden, nota, ganadas: ganadas / equipos.length };
    }
    return { fichas, mejor, origen };
  }

  let firmaEquipo = '', memoEquipo = null;
  function pintarEquipo() {
    let caja = document.getElementById('axm-equipo');
    const b = enMetro() ? leerBanquillo() : null;
    if (!b || !b.cands.length) { if (caja) caja.remove(); firmaEquipo = ''; return; }
    for (const c of b.cands) if (!pokeGuardados[c.num]) datosDe(c.num);
    if (!caja) {
      caja = document.createElement('section');
      caja.id = 'axm-equipo';
      caja.className = 'axm-caja space-y-2 rounded-card p-3';
      axmEstilo();
    }
    if (caja.previousElementSibling !== b.sec) b.sec.insertAdjacentElement('afterend', caja);
    const entrada = JSON.stringify([lineaActual(), b.cands.map(c => [c.num, c.nivel, !!pokeGuardados[c.num]]), (lsGet(LS_RIVALES, {})[lineaActual()] || []).length]);
    if (!memoEquipo || memoEquipo.entrada !== entrada) memoEquipo = { entrada, a: analizarEquipo(b) };
    const a = memoEquipo.a;
    const firma = JSON.stringify(a.faltan ? ['f', a.faltan] : [a.origen, a.mejor.orden.map(f => f.c.nombre), a.fichas.map(f => [f.c.nombre, Math.round(f.gana * 100)])]);
    if (firma === firmaEquipo) return;
    firmaEquipo = firma;
    if (a.faltan) { caja.innerHTML = `<p class="text-[11px] font-semibold" style="color:#8A93A6">Buscando estadísticas de ${a.faltan} Pokémon…</p>`; return; }
    const chip = t => `<span class="axm-chip" style="background:${COLOR_TIPO[t] || '#5B6475'}">${bonito(t)}</span>`;
    const pct = x => Math.round(x * 100) + '%';
    const color = x => (x >= 0.6 ? '#8FD88A' : x >= 0.4 ? '#E6D36A' : '#FF6B6B');
    caja.innerHTML = `
      <div class="flex items-center justify-between gap-2">
        <p class="axm-tit"><i>🚇</i>Mejor orden</p>
        <span class="axm-veredicto" style="--c:${color(a.mejor.ganadas)}">gana ~${pct(a.mejor.ganadas)}</span>
      </div>
      <p class="text-sm font-extrabold" style="color:#E8ECF3">${a.mejor.orden.map((f, i) => `${i + 1}. ${f.c.nombre}`).join(' · ')}</p>
      <p class="text-[10px] font-semibold" style="color:#8A93A6">Márcalos tú en ese orden. Comparado con ${a.origen}. «Gana» es contra rivales de tu mismo nivel de fuerza. Es una estimación: el juego no enseña su fórmula de combate.</p>
      ${a.fichas.slice().sort((x, y) => y.gana - x.gana).map(f => `
        <div class="axm-fila rounded-card p-1.5" style="--c:${f.flojo ? '#FFB23E' : color(f.gana)}">
          <div class="flex items-center justify-between gap-2">
            <p class="truncate text-[11px] font-extrabold" style="color:#E8ECF3">${f.flojo ? '⚠️ ' : ''}${f.c.nombre} <span style="color:#8A93A6">· ${f.l.bst} base</span></p>
            <span class="text-[10px] font-extrabold" style="color:${color(f.gana)}">gana ${pct(f.gana)} de 1 en 1</span>
          </div>
          <span class="flex flex-wrap gap-0.5">${f.l.tipos.map(chip).join('')}</span>
          <p class="text-[9px] font-bold" style="color:#8A93A6">Débil a: ${f.d.deb.join(', ') || 'nada'}${f.d.inm.length ? ' · inmune a: ' + f.d.inm.join(', ') : ''}</p>
          ${f.flojo ? `<p class="text-[9px] font-bold" style="color:#FFB23E">Flojo: mejor no llevarlo${f.ojo.length ? ' (' + f.ojo.join(', ') + ')' : ''}.</p>` : f.ojo.length ? `<p class="text-[9px] font-bold" style="color:#8A93A6">Ojo: ${f.ojo.join(', ')}.</p>` : ''}
        </div>`).join('')}`;
  }

  // Predicción del combate de la parada con el orden actual (tuyos de arriba a abajo, igual que el rival)
  function prediccion(c) {
    if (!c) return null;
    calcularFactores();
    const verde = lineaActual() === 'verde';
    const mios = c.mios.map(p => luchador(p, verde ? 50 : p.nivel, null, 'mio'));
    const rivales = c.rivales.map(p => luchador({ ...p, tipos: null }, verde ? 50 : p.nivel, null, 'rival'));
    if (mios.some(x => !x) || rivales.some(x => !x)) return null;
    const vida = lineaActual() === 'negra' ? c.mios.map(p => (p.vida == null ? 1 : p.vida / 100)) : null;
    return combate(mios, rivales, vida, true);
  }

  /* ------------------------------------------------------------------ *
   *  APRENDER DEL LOG DEL COMBATE
   *  Mientras se ve el combate se leen los golpes («Dialga · … −52 PS», «¡crítico!», «Forcejeo») y los relevos
   *  («sale al paso de», «El rival saca a», «Relevas con»). La vida máxima de cada uno sale de su tarjeta
   *  («310/383 PS») o, si cae, de todo el daño que recibió. Cada golpe normal da una muestra: daño real / modelo.
   * ------------------------------------------------------------------ */
  function guardarParada(c) {
    const quitar = x => ({ nombre: x.nombre, num: x.num, nivel: x.nivel, tipos: x.tipos });
    lsPut('axm-ultima-parada', { linea: lineaActual(), parada: c.parada, mios: c.mios.map(quitar), rivales: c.rivales.map(quitar) });
  }
  function leerLog() {
    const caja = $$('main div.overflow-y-auto').find(d => !ajeno(d) && d.querySelector(':scope > .animate-slide-up'));
    if (!caja) return null;
    const ev = [];
    for (const el of caja.children) {
      const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (el.tagName === 'P') { ev.push({ msg: t }); continue; }
      const linea = $$('span.block', el).map(x => x.textContent.trim()).find(x => / · /.test(x)) || '';
      const m = t.match(/[−-]\s*(\d+)\s*PS/);
      ev.push({ atacante: linea.split(' · ')[0], dano: m ? parseInt(m[1], 10) : null, critico: /cr[ií]tico/i.test(t), forcejeo: /forcejeo|[uú]ltimo recurso/i.test(t) });
    }
    return ev;
  }
  const hpTarjeta = {};
  function aprenderDelCombate() {
    const P = lsGet('axm-ultima-parada', null), ev = leerLog();
    if (!P || !ev || !ev.length) return;
    const primero = ev.find(e => e.msg);
    if (!primero) return;
    const id = P.linea + '|' + P.parada + '|' + primero.msg;
    const lado = n => (P.mios.some(x => x.nombre === n) ? 'm' : P.rivales.some(x => x.nombre === n) ? 'r' : null);
    // vida máxima vista en las tarjetas del combate
    for (const h of $$('main h3')) {
      const caja = h.closest('div.rounded-card') || h.parentElement.parentElement;
      const m = (caja && caja.textContent || '').match(/(\d+)\s*\/\s*(\d+)\s*PS/);
      const nombre = h.textContent.trim(), l = lado(nombre);
      if (m && l) hpTarjeta[id + '|' + l + ':' + nombre] = parseInt(m[2], 10);
    }
    let mio = null, riv = null;
    const recibido = {}, maxHP = {}, golpes = [];
    for (const e of ev) {
      if (e.msg) {
        let m;
        if ((m = e.msg.match(/^(.+?) \(Nv\.\d+\) sale al paso de (.+?) \(Nv\.\d+\)/))) { mio = m[1]; riv = m[2]; }
        else if ((m = e.msg.match(/^El rival saca a (.+?) \(Nv/))) riv = m[1];
        else if ((m = e.msg.match(/^Relevas con (.+?) \(Nv/))) mio = m[1];
        else if ((m = e.msg.match(/^(.+?) (?:se queda sin fuerzas|no puede continuar)/))) {
          const k = (m[1] === riv ? 'r:' : 'm:') + m[1];
          if (recibido[k]) maxHP[k] = recibido[k];
        }
        continue;
      }
      if (!e.dano || !mio || !riv) continue;
      const deMio = e.atacante === mio;
      if (!deMio && e.atacante !== riv) continue;
      const kdef = deMio ? 'r:' + riv : 'm:' + mio;
      recibido[kdef] = (recibido[kdef] || 0) + e.dano;
      if (!e.critico && !e.forcejeo) golpes.push({ lado: deMio ? 'mio' : 'rival', atk: e.atacante, def: deMio ? riv : mio, kdef, dano: e.dano });
    }
    const verde = P.linea === 'verde';
    const buscar = (n, l) => { const x = (l === 'mio' ? P.mios : P.rivales).find(q => q.nombre === n); return x && luchador(l === 'mio' ? x : { ...x, tipos: null }, verde ? 50 : x.nivel, null, l); };
    const muestras = { mio: [], rival: [] };
    for (const g of golpes) {
      const vida = hpTarjeta[id + '|' + g.kdef] || maxHP[g.kdef];
      if (!vida) continue;
      const A = buscar(g.atk, g.lado), D = buscar(g.def, g.lado === 'mio' ? 'rival' : 'mio');
      if (!A || !D || tipoDeAtaque(A, D).e === 0) continue;
      const modelo = dano(A, D) / D.hp;
      if (modelo > 0) muestras[g.lado].push((g.dano / vida) / modelo);
    }
    if (!muestras.mio.length && !muestras.rival.length) return;
    const todos = lsGet(LS_CALIB, {});
    const prev = todos[id];
    if (prev && prev.mio.length === muestras.mio.length && prev.rival.length === muestras.rival.length) return;
    todos[id] = { linea: P.linea, t: Date.now(), ...muestras };
    const ids = Object.keys(todos).sort((x, y) => todos[y].t - todos[x].t);
    for (const k of ids.slice(40)) delete todos[k];
    lsPut(LS_CALIB, todos);
  }

  /* ------------------------------------------------------------------ *
   *  PELEAR EN BUCLE
   * ------------------------------------------------------------------ */
  const LS_OPC = 'axm-opciones';
  const opc = Object.assign({ maxParadas: '', pararRacha: '', cambiarVia: false }, lsGet(LS_OPC, {}));
  let enMarcha = false, msg = '', hechas = 0;
  function decir(t) { msg = t; const el = document.querySelector('#' + PANEL_ID + ' .axm-msg'); if (el) el.textContent = t; }
  function vibrar() { try { if (navigator.vibrate) navigator.vibrate(220); } catch { /* sin vibración */ } }

  // Botones de las pantallas de combate/resultado que llevan a la siguiente parada
  const RE_SEGUIR = /^\s*(seguir|continuar|siguiente( parada)?|aceptar|vale|ok|cobrar|recoger|volver a la l[ií]nea|a la siguiente)\b/i;
  const RE_NO_TOCAR = /panel de salidas|cambiar v[ií]a|rendir|abandonar|retirar|salir/i;

  async function bucle() {
    if (enMarcha) { enMarcha = false; decir('Parado.'); pintarBoton(); return; }
    enMarcha = true; hechas = 0; pintarBoton();
    kPedirPermiso();
    const r00 = racha();
    const max = parseInt(opc.maxParadas, 10) || Infinity, objetivo = parseInt(opc.pararRacha, 10) || Infinity;
    let sinNada = 0;
    try {
      while (enMarcha) {
        const r0 = racha();
        if (r0 != null && r0 >= objetivo) { decir(`🎯 Racha ${r0}: objetivo cumplido. Parado.`); vibrar(); break; }
        if (hechas >= max) { decir(`Hechas ${hechas} paradas. Parado.`); break; }
        const e = energia();
        if (e != null && e < 2) { decir('Sin energía (hace falta 2). Parado.'); break; }

        const pel = botonPelear();
        if (pel && !pel.disabled) {
          // ¿Rival malo y quedan cambios de vía? (opcional)
          const a = analizar(leerCombate());
          const pr = prediccion(leerCombate());
          if (opc.cambiarVia && a && !a.sinTipos && (pr ? !pr.gana : a.nota < -0.8) && cambiosQuedan() > 0) {
            decir(`Rival en desventaja para ti (${a.veredicto.txt}): cambio de vía.`);
            botonCambiarVia().click();
            await pausa(1200, 1800);
            continue;
          }
          decir(`🚇 Parada ${(leerCombate() || {}).parada || '?'} · peleo (racha ${r0 ?? '?'}).`);
          await pausa(500, 900);
          pel.click();
          hechas++;
          const t0 = Date.now();
          // Espera al resultado: se pulsa lo que haga falta hasta que vuelva el botón de pelear
          let vuelto = false;
          await sleep(1200);
          while (enMarcha && Date.now() - t0 < 60000) {
            const b = $$('button').find(x => !ajeno(x) && visible(x) && !x.disabled && RE_SEGUIR.test(x.textContent || '') && !RE_NO_TOCAR.test(x.textContent || ''));
            if (b) { await pausa(400, 800); b.click(); await sleep(700); continue; }
            const p2 = botonPelear();
            if (p2 && !p2.disabled && Date.now() - t0 > 1500) { vuelto = true; break; }
            if (p2 && p2.disabled && energia() != null && energia() < 2) break;
            await sleep(300);
          }
          const r1 = racha();
          if (r0 != null && r1 != null && r1 < r0) { decir(`💥 Perdida la racha de ${r0}. Parado.`); vibrar(); break; }
          if (!vuelto) {
            if (++sinNada >= 2) { decir('No reconozco la pantalla tras el combate. Parado (pásame su HTML).'); break; }
          } else sinNada = 0;
          await pausa(300, 600);
          continue;
        }
        // Sin botón de pelear: quizá una pantalla de resultado
        const b = $$('button').find(x => !ajeno(x) && visible(x) && !x.disabled && RE_SEGUIR.test(x.textContent || '') && !RE_NO_TOCAR.test(x.textContent || ''));
        if (b) { b.click(); await pausa(700, 1100); continue; }
        if (pel && pel.disabled) { decir('El botón de pelear está desactivado (¿sin energía?). Parado.'); break; }
        if (++sinNada > 30) { decir('No veo el botón «Pelear». Parado.'); break; }
        await sleep(300);
      }
    } catch (e) {
      console.error('[axm]', e);
      decir('Error: ' + (e && e.message || e));
    } finally {
      if (enMarcha && !/parado/i.test(msg)) decir(`Hecho: ${hechas} parada(s).`);
      // se ha parado sola (si lo paras tú, enMarcha ya es false): aviso con el motivo
      if (enMarcha) {
        const objetivo = /^🎯/.test(msg), perdida = /^💥/.test(msg), energia = /energía/i.test(msg), hecho = /^Hech[ao]/.test(msg);
        const rf = racha();
        kAviso({
          tipo: objetivo || hecho ? 'exito' : perdida || energia ? 'aviso' : 'error', app: 'Metro Batalla', icono: '🚇',
          titulo: objetivo ? '¡Objetivo de racha cumplido!' : perdida ? 'Se ha perdido la racha' : energia ? 'Sin energía' : hecho ? 'Paradas hechas' : 'El bucle se ha parado',
          texto: objetivo || hecho ? null : msg,
          lineas: [`🥊 ${hechas} combate${hechas === 1 ? '' : 's'}${r00 != null && rf != null ? ` · racha ${r00} → ${rf}` : ''}`],
        });
      }
      enMarcha = false; pintarBoton();
    }
  }

  /* ------------------------------------------------------------------ *
   *  PANEL (tras el botón de pelear, con el estilo oscuro de la línea)
   * ------------------------------------------------------------------ */
  function pintarBoton() {
    const b = document.querySelector('#' + PANEL_ID + ' [data-a="bucle"]');
    if (b) { b.textContent = enMarcha ? '■ Parar' : '🔁 Pelear en bucle'; b.classList.toggle('axm-on', enMarcha); }
  }
  function construir() {
    const p = document.createElement('section');
    p.id = PANEL_ID;
    axmEstilo();
    p.className = 'axm-caja space-y-2 rounded-card p-3';
    const campo = 'axm-campo w-16 rounded-card px-2 py-1 text-xs font-bold outline-none';
    const estilo = '';
    p.innerHTML = `
      <div class="axm-analisis space-y-1.5"></div>
      <div class="grid grid-cols-2 gap-2 text-[10px] font-extrabold uppercase tracking-wide" style="color:#8A93A6">
        <label class="flex items-center justify-between gap-1">Máx. paradas <input type="number" min="1" data-o="maxParadas" class="${campo}" style="${estilo}" placeholder="∞"></label>
        <label class="flex items-center justify-between gap-1">Parar en racha <input type="number" min="1" data-o="pararRacha" class="${campo}" style="${estilo}" placeholder="—"></label>
      </div>
      <label class="flex items-center gap-2 text-[11px] font-bold" style="color:#C9CFDB"><input type="checkbox" class="axm-sw" data-o="cambiarVia"> Usar «Cambiar vía» solo si hay desventaja clara</label>
      <button type="button" data-a="bucle" class="axm-boton w-full rounded-pill py-2.5 text-sm font-extrabold uppercase transition active:scale-[0.98]"></button>
      <p class="axm-msg text-center text-[11px] font-semibold" style="color:#AEB6C6"></p>`;
    for (const i of $$('input[data-o]', p)) {
      const k = i.dataset.o;
      if (i.type === 'checkbox') i.checked = !!opc[k]; else i.value = opc[k] || '';
      i.addEventListener('input', () => { opc[k] = i.type === 'checkbox' ? i.checked : i.value.trim(); lsPut(LS_OPC, opc); });
      i.addEventListener('change', () => { opc[k] = i.type === 'checkbox' ? i.checked : i.value.trim(); lsPut(LS_OPC, opc); });
    }
    p.querySelector('[data-a="bucle"]').addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); bucle(); });
    return p;
  }
  function montar() {
    let panel = document.getElementById(PANEL_ID);
    if (!enMetro()) { enMarcha = false; if (panel) panel.remove(); pintarEquipo(); return; }
    try { aprenderDelCombate(); } catch (e) { console.warn('[axm] log', e); }
    const pel = botonPelear();
    if (!pel && !seccionParada()) pintarEquipo();
    const ancla = pel || (seccionParada() && seccionParada().parentElement.lastElementChild);
    if (!ancla) { if (panel && !enMarcha) panel.remove(); return; }
    if (!panel) { panel = construir(); firmaAnalisis = ''; }
    pintarEquipo();
    if (pel && panel.previousElementSibling !== pel) pel.insertAdjacentElement('afterend', panel);
    else if (!pel && !panel.isConnected) ancla.insertAdjacentElement('afterend', panel);
    pintarBoton();
    decir(msg);
    pintarAnalisis();
  }

  esperarHidratacion().then(() => { montar(); setInterval(montar, 700); });
})();
