// ==UserScript==
// @name         Aurora Dex · Grutas del Subsuelo (todas las vetas)
// @namespace    auroradex-grutas
// @version      0.8.0
// @description  Solo en /subsuelo. «🧭 Explorar y picar»: recorre el mapa deprisa y pica cada veta (y Poké Ball) que ve de los tipos elegidos. «⛏️ Picarlas todas»: el camino más corto por todas las que conoce (el mínimo de pasos, que es lo que cuesta energía al andar; con botas, 1 ⚡ cada 9). Usa los datos del propio juego (el trozo de mapa del servidor con cada veta, su tipo y cuándo vuelve, y el mapa entero de «Ver mapa») y recuerda todo lo que ve. Sabe qué es cada casilla (la lava la reconoce por su dibujo) y nunca pisa lava, escaleras, la Sima ni puertas. Eliges qué tipos picar y el ritmo (humano por defecto). Dibuja el camino y se para si no llega la energía; sigue donde lo dejó. Antes de andar se pone las Botas de Andar del Huerto (con su script). /subsuelo?explorar=1 empieza solo.
// @match        https://auroradex.es/*
// @match        https://www.auroradex.es/*
// @updateURL    https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_grutas.user.js
// @downloadURL  https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_grutas.user.js
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  'use strict';
  // En la ventana oculta del robot de Diarias sí corre (lo usa para el Subsuelo); en otras ventanas, no
  try { if (window.top !== window && window.name !== 'axd-fondo') return; } catch { return; }

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

  /* ── Kit Aurora 2 (mismo aspecto y mismos avisos en todos los scripts de Aurora Dex) ──────────────
   * Todo sale de los colores de la propia web (--lienzo, --tinta-*, --crema-*, --hoja-*…), así que cambia solo
   * entre modo claro y oscuro. Paneles: kHead/kBadge/K_TILE/K_BAR/K_LOG… · Avisos: kAviso({ tipo, titulo, … }). */
  const KIT_CSS = (U, acento = '#2FA84F') => `
    ${U}{--k-acento:${acento}}
    ${U}.tarjeta{position:relative;overflow:hidden}
    ${U}.tarjeta::before{content:"";position:absolute;left:0;right:0;top:0;height:4px;background:linear-gradient(90deg,var(--k-acento),color-mix(in srgb,var(--k-acento) 45%,#3BA7E0));pointer-events:none}
    ${U} [hidden]{display:none!important}
    ${U} .k-ico{width:42px;height:42px;display:grid;place-items:center;font-size:21px;flex-shrink:0;border-radius:15px!important;border:2px solid color-mix(in srgb,var(--k-acento) 30%,transparent)!important;background:linear-gradient(150deg,color-mix(in srgb,var(--k-acento) 24%,rgb(var(--lienzo))),color-mix(in srgb,var(--k-acento) 8%,rgb(var(--lienzo))))!important;box-shadow:inset 0 -3px 0 color-mix(in srgb,var(--k-acento) 22%,transparent),0 4px 10px -6px color-mix(in srgb,var(--k-acento) 70%,transparent)}
    ${U} .k-ico+div>p:first-child{font-family:var(--font-display),system-ui,sans-serif;font-size:17px;letter-spacing:-.005em}
    ${U} .k-dot{width:8px;height:8px;border-radius:999px;background:currentColor;display:inline-block;flex-shrink:0}
    ${U} .k-badge{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;letter-spacing:.03em;box-shadow:0 2px 6px -4px rgba(0,0,0,.35)}
    ${U} .k-badge[data-s="on"] .k-dot{animation:k-pulso 1.2s ease-in-out infinite;box-shadow:0 0 0 3px color-mix(in srgb,currentColor 22%,transparent)}
    @keyframes k-pulso{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.7)}}
    @keyframes k-brillo{from{background-position:200% 0}to{background-position:-200% 0}}
    @keyframes k-entra{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
    ${U} .k-tiles{display:grid;grid-template-columns:repeat(var(--k-cols,4),minmax(0,1fr));gap:6px}
    ${U} .k-tile{text-align:center;padding:7px 2px 6px;min-width:0;background:linear-gradient(180deg,rgb(var(--crema-50)),rgb(var(--crema-100)))!important;box-shadow:inset 0 -2px 0 rgb(var(--crema-200))}
    ${U} .k-tile b{display:block;font-family:var(--font-display),system-ui,sans-serif;font-size:17px;font-weight:800;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:rgb(var(--tinta-800))}
    ${U} .k-tile small{display:block;margin-top:1px;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:rgb(var(--tinta-400))}
    ${U} .k-bar{height:12px;padding:1px;box-shadow:inset 0 1px 2px rgba(0,0,0,.12)}
    ${U} .k-bar>span{display:block;height:100%;border-radius:999px;transition:width .5s cubic-bezier(.22,1,.36,1);background-image:linear-gradient(180deg,rgba(255,255,255,.28),rgba(255,255,255,0) 60%)}
    ${U}:has(.k-badge[data-s="on"]) .k-bar>span{background-image:linear-gradient(100deg,rgba(255,255,255,0) 30%,rgba(255,255,255,.42) 50%,rgba(255,255,255,0) 70%);background-size:200% 100%;animation:k-brillo 1.6s linear infinite}
    ${U} .k-log{max-height:160px;overflow-y:auto;font-variant-numeric:tabular-nums;scrollbar-width:thin;box-shadow:inset 0 2px 4px rgba(0,0,0,.06)}
    ${U} .k-log>p{margin:0;padding:2px 0 2px 11px;position:relative;animation:k-entra .25s ease both}
    ${U} .k-log>p::before{content:"";position:absolute;left:1px;top:.72em;width:5px;height:5px;border-radius:999px;background:currentColor;opacity:.4}
    ${U} .k-log>p+p{border-top:1px dashed rgb(var(--crema-200))}
    ${U} .k-log:empty{display:none}
    ${U} .k-chips{display:flex;flex-wrap:wrap;gap:6px}
    ${U} .k-chips>button{flex:1;padding:5px 8px;font-size:11px;font-weight:800;white-space:nowrap;transition:transform .1s,box-shadow .15s}
    ${U} .k-chips>button[aria-pressed="true"]{box-shadow:inset 0 0 0 2px currentColor,0 3px 8px -5px currentColor}
    ${U} .k-seg{display:grid;grid-template-columns:repeat(var(--k-cols,2),minmax(0,1fr));gap:6px}
    ${U} .k-seg>button{padding:9px 4px;font-size:11px;font-weight:800;display:flex;flex-direction:column;align-items:center;gap:3px;line-height:1.15;transition:transform .1s,box-shadow .15s}
    ${U} .k-seg>button>span:first-child{font-size:19px}
    ${U} .k-seg>button:active,${U} .k-chips>button:active{transform:translateY(1px)}
    ${U} .k-switch{display:flex;align-items:center;gap:10px;cursor:pointer;user-select:none}
    ${U} .k-switch input{appearance:none;-webkit-appearance:none;width:40px;height:24px;border-radius:999px;position:relative;flex-shrink:0;cursor:pointer;margin:0;transition:background .2s;background:rgb(var(--crema-300));color:#fff;box-shadow:inset 0 1px 3px rgba(0,0,0,.18)}
    ${U} .k-switch input:checked{background:var(--k-acento)}
    ${U} .k-switch input::after{content:"";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:999px;background:currentColor;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:transform .2s cubic-bezier(.3,1.4,.5,1)}
    ${U} .k-switch input:checked::after{transform:translateX(16px)}
    ${U} .k-x{width:28px;height:28px;display:grid;place-items:center;font-size:14px;flex-shrink:0;cursor:pointer}
    ${U} .boton-principal:not(:disabled){box-shadow:0 8px 16px -10px rgba(47,168,79,.9)}
    ${U} button:disabled{opacity:.55;cursor:not-allowed}
    ${U} input[type=number]{-moz-appearance:textfield}
    ${U} input[type=number]::-webkit-outer-spin-button,${U} input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
    @media (prefers-reduced-motion:reduce){${U} *{animation:none!important}}
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
  // `acento`: color del script (la franja de arriba, el icono y los interruptores)
  function kStyle(id, U, acento) {
    kAvisosCSS();
    if (document.getElementById(id)) return;
    const st = document.createElement('style');
    st.id = id; st.textContent = KIT_CSS(U, acento);
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
  // Log en panel: líneas con hora, las más nuevas abajo, máximo `max`
  function kLog(box, texto, max = 60) {
    if (!box) return;
    const p = document.createElement('p');
    const h = new Date();
    p.textContent = `${String(h.getHours()).padStart(2, '0')}:${String(h.getMinutes()).padStart(2, '0')}:${String(h.getSeconds()).padStart(2, '0')}  ${texto}`;
    if (/✅|🎉|✨|¡/.test(texto)) p.className = 'text-hoja-700';
    else if (/❌|⚠|error/i.test(texto)) p.className = 'text-rojo-600';
    box.appendChild(p);
    while (box.children.length > max) box.firstChild.remove();
    box.scrollTop = box.scrollHeight;
  }
  const kTime = ms => {
    const t = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
    return (h ? h + ':' : '') + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  };

  /* ── Avisos dentro del juego (tarjeta arriba + sonido de 8 bits) ─────────────────────────────────
   * kAviso({ tipo, titulo, texto, lineas, sprite, icono, app, sonido, duracion, fijo, sistema })
   *   tipo: 'exito' · 'fin' · 'info' · 'aviso' · 'energia' · 'error' · 'shiny' · 'legendario'
   *   Cada tipo tiene su sonido (para saber qué pasa sin mirar); 'shiny', 'legendario' y 'error' no se cierran solos.
   *   Se cierran tocando en cualquier parte del aviso.
   *   sistema: notificación del móvil/PC, solo si la pestaña no se está viendo (para no repetir el aviso).
   * El sonido se puede silenciar desde el propio aviso (🔊) y vale para todos los scripts. */
  const K_AVISO = {
    exito: { c: '#2FA84F', f: 'linear-gradient(135deg,#1F8A3E,#3CC065)', i: '✅' },
    fin: { c: '#2FA84F', f: 'linear-gradient(135deg,#1F8A3E,#3CC065)', i: '🏁' },
    info: { c: '#3BA7E0', f: 'linear-gradient(135deg,#1F7FB8,#48B6EC)', i: 'ℹ️' },
    aviso: { c: '#E0A21E', f: 'linear-gradient(135deg,#C07A12,#F0B436)', i: '⚠️' },
    energia: { c: '#F2B632', f: 'linear-gradient(135deg,#6B4E16,#C9912A 55%,#F2B632)', i: '🪫' },
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
      #k-avisos .k-av{pointer-events:auto;position:relative;overflow:hidden;border-radius:20px;background:rgb(var(--lienzo,255 255 255));color:rgb(var(--tinta-800,33 36 29));border:2px solid color-mix(in srgb,var(--k-c) 55%,rgb(var(--lienzo,255 255 255)));box-shadow:0 4px 0 0 rgba(0,0,0,.08),0 16px 34px -14px rgba(0,0,0,.55),0 0 0 1px rgba(0,0,0,.04);animation:k-av-entra .42s cubic-bezier(.2,1.25,.4,1) both;cursor:pointer;user-select:none;-webkit-tap-highlight-color:transparent}
      #k-avisos .k-av:active{transform:scale(.985)}
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
    energia: [[988, 0, .11, 'square'], [784, .12, .11, 'square'], [587, .24, .11, 'square'], [392, .36, .14, 'square'], [196, .52, .4, 'triangle']],
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
    if (o.sonido ?? true) kSonido(tipo);
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
      // tocando en cualquier parte se cierra (menos en el botón del sonido)
      d.addEventListener('click', e => { if (!e.target.closest('[data-k="son"]')) cerrar(); });
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

  /* ------------------------------------------------------------------ *
   *  AJUSTES Y MEMORIA
   * ------------------------------------------------------------------ */
  const PANEL_ID = 'axsub-panel', U = '#' + PANEL_ID, DIBUJO_ID = 'axsub-dibujo';
  const VERSION = '0.8.0';
  const LS_CFG = 'axsub-cfg', LS_MEM = 'axsub-mem-v1';
  const H12 = 12 * 3600e3, H24 = 24 * 3600e3;
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const pausa = (a, b) => sleep(a + Math.random() * (b - a));
  const enGrutas = () => /^\/subsuelo\/?$/.test(location.pathname);
  const K = (x, y) => x + ',' + y;
  const deK = k => { const [x, y] = k.split(',').map(Number); return { x, y }; };
  const lsLee = (k, def) => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v ?? def; } catch { return def; } };
  const lsPon = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin storage */ } };

  const cfg = Object.assign({ agua: true, dibujar: true, ritmo: 'humano', botas: true }, lsLee(LS_CFG, {}));
  // Ritmo: «humano» (por defecto) mete pausas al azar entre pasos, antes y después de picar y, de vez en cuando,
  // un descanso más largo, para no ir a golpe de reloj; «rápido» va tan deprisa como deja el juego
  const RITMOS = {
    humano: { paso: [420, 1150], antesPicar: [650, 1500], trasPicar: [900, 2000], descanso: 0.07, largo: [1800, 4500] },
    rapido: { paso: [40, 140], antesPicar: [150, 300], trasPicar: [250, 500], descanso: 0, largo: [0, 0] },
    // explorando con ritmo humano: más deprisa, pero sin ir a golpe de reloj
    explorar: { paso: [90, 260], antesPicar: [400, 900], trasPicar: [450, 1000], descanso: 0.02, largo: [700, 1600] },
  };
  const ritmoActual = () => cfg.ritmo === 'rapido' ? RITMOS.rapido : (corriendo && modo === 'explorar') ? RITMOS.explorar : RITMOS.humano;
  async function respiro(tipo) {
    const r = ritmoActual();
    await pausa(r[tipo][0], r[tipo][1]);
    if (tipo === 'paso' && Math.random() < r.descanso) await pausa(r.largo[0], r.largo[1]);
  }
  const guardaCfg = () => lsPon(LS_CFG, cfg);

  // Memoria por mapa (marco): lo que se ha visto en el dibujo, dónde hay vetas y cosas, qué casillas no dejan pasar
  //   celdas: {"x,y": tipo} · objs: {"x,y": {t, titulo, visto}} · vetas: {"x,y": {visto, vacia, picada, titulo, t}}
  //   sinPaso: {"x,y": ts} · rutaVetas: dónde están las vetas en los datos de la página
  let mems = lsLee(LS_MEM, {});
  let marco = null;
  function mem() {
    if (!marco) return null;
    if (!mems[marco]) mems[marco] = { celdas: {}, objs: {}, vetas: {}, sinPaso: {}, t: Date.now() };
    return mems[marco];
  }
  // Se guarda como mucho cada 2 s (pero siempre: aunque no pare de haber cambios) y al salir de la página
  let guardarT = null;
  function guardarAhora() {
    clearTimeout(guardarT); guardarT = null;
    const m = mem();
    if (m) { for (const [k, ts] of Object.entries(m.sinPaso)) if (Date.now() - ts > H24) delete m.sinPaso[k]; m.t = Date.now(); }
    // solo los 3 mapas más recientes
    const claves = Object.keys(mems).sort((a, b) => (mems[b].t || 0) - (mems[a].t || 0));
    for (const k of claves.slice(3)) delete mems[k];
    lsPon(LS_MEM, mems);
  }
  function guardarMem() { if (!guardarT) guardarT = setTimeout(guardarAhora, 2000); }
  addEventListener('pagehide', () => { if (guardarT) guardarAhora(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && guardarT) guardarAhora(); });

  /* ------------------------------------------------------------------ *
   *  EL TABLERO (canvas del terreno + casillas de encima: vetas, puertas, losas, la Sima y tú)
   * ------------------------------------------------------------------ */
  function tablero() {
    const cv = $$('main canvas').find(c => c.parentElement && c.parentElement.querySelector(':scope > div.absolute.inset-0'));
    if (!cv || !cv.width) return null;
    const caja = cv.parentElement;
    const capa = [...caja.children].find(e => e !== cv && e.tagName === 'DIV' && /\binset-0\b/.test(e.className) && /\bz-10\b/.test(e.className))
      || [...caja.children].find(e => e !== cv && e.tagName === 'DIV' && /\binset-0\b/.test(e.className) && e.style.cursor === 'pointer');
    if (!capa) return null;
    const anchoCss = parseFloat(cv.style.width) || cv.getBoundingClientRect().width || cv.width;
    const escala = anchoCss / cv.width;
    // tamaño de casilla: 16 px de dibujo (las imágenes de la leyenda) por el zoom del canvas. No se saca de lo que hay
    // encima: la Sima ocupa 2×2 y, si es lo único a la vista, daría una casilla del doble
    const tc = 16, ts = tc * escala;
    const cols = Math.round(cv.width / tc), rows = Math.round(cv.height / tc);
    return { cv, caja, capa, escala, ts, tc, cols, rows };
  }

  const fondoDe = el => [el, ...el.querySelectorAll('*')].map(x => (x.style && x.style.backgroundImage) || '').join(' ');
  function leerCosas(t) {
    const cosas = [], sprites = [];
    let entreCasillas = false;                      // algo a medio camino entre dos casillas: la cámara se está moviendo
    const fuera = v => { const r = ((v % t.ts) + t.ts) % t.ts; return r > 1.5 && r < t.ts - 1.5; };
    for (const el of t.caja.children) {
      if (el === t.cv || el === t.capa || el.id === DIBUJO_ID || !el.style || el.style.left === '') continue;
      const left = parseFloat(el.style.left) || 0, top = parseFloat(el.style.top) || 0;
      const bg = fondoDe(el);
      if (/\/personajes\//.test(bg) || (/\bz-30\b/.test(el.className) && /pointer-events-none/.test(el.className))) {
        sprites.push({ c: Math.round(left / t.ts), f: Math.round((top + 8) / t.ts), fuera: fuera(left) || fuera(top + 8) });
        continue;
      }
      if (/\bz-40\b/.test(el.className) || /pointer-events-none/.test(el.className)) continue;   // viñeta y adornos
      const descolocada = fuera(left) || fuera(top);
      const titulo = el.title || el.getAttribute('title') || '';
      const txt = (el.textContent || '').trim();
      let tipo = 'objeto';
      if (/pok[eé]\s*ball|pok[eé]bola|abrir/i.test(titulo) || /poke_?ball|pokebola|\/ball/i.test(bg)) tipo = 'ball';
      else if (/nodo|filon|veta|mineral/i.test(bg) || /picar|veta|fil[oó]n/i.test(titulo)) tipo = 'veta';
      else if (/breakable_door/.test(bg) || /^base de/i.test(titulo)) tipo = 'puerta';
      else if (el.querySelector('.boca-sima') || el.classList.contains('boca-sima') || /sima/i.test(titulo)) tipo = 'sima';
      else if (/c[aá]mara|losa|sellad/i.test(titulo) || /🔒|🔆|🚪/u.test(txt)) tipo = 'losa';
      const op = parseFloat(getComputedStyle(el).opacity);
      const clases = el.className + ' ' + [...el.querySelectorAll('*')].map(x => typeof x.className === 'string' ? x.className : '').join(' ');
      const apagada = (op < 0.6) || /grayscale|opacity-[1-5]0\b/.test(clases) || /(nodo|veta|filon)[^/)"']*(vac|agot|gast|usad|rot|picad|seca)/i.test(bg)
        || /vuelve|agotad|vac[ií]a|recarg|ya (la )?has picado|ya recogid|cu[aá]nto falta|dentro de \d/i.test(titulo);
      const w = Math.max(1, Math.round((parseFloat(el.style.width) || t.ts) / t.ts)), h = Math.max(1, Math.round((parseFloat(el.style.height) || t.ts) / t.ts));
      cosas.push({ el, tipo, titulo, c: Math.round(left / t.ts), f: Math.round(top / t.ts), w, h, vacia: (tipo === 'veta' || tipo === 'ball') && apagada, descolocada });
    }
    // si hay más de un personaje, tú eres el del centro (la cámara te sigue)
    const cc = (t.cols - 1) / 2, cf = (t.rows - 1) / 2;
    sprites.sort((a, b) => Math.hypot(a.c - cc, a.f - cf) - Math.hypot(b.c - cc, b.f - cf));
    // la cámara se está moviendo si tu muñeco está entre dos casillas o lo están la mayoría de las cosas de una casilla
    const unas = cosas.filter(c => c.w === 1 && c.h === 1 && c.tipo !== 'sima');
    entreCasillas = !!(sprites[0] && sprites[0].fuera) || (unas.length > 0 && unas.filter(c => c.descolocada).length * 2 > unas.length);
    return { cosas, yo: sprites[0] || null, entreCasillas };
  }

  /* ── Terreno leído del dibujo: cada casilla se compara con las imágenes de la leyenda ── */
  const TIPOS = ['suelo', 'pared', 'agua', 'lava', 'salida'];
  const LETRA = { suelo: '.', pared: '#', agua: '~', lava: '^', salida: 'E', fuera: ' ', raro: '?' };
  let refs = null, refsN = 0, refsError = '';
  async function cargarRefs(n) {
    if (refs && refsN === n) return refs;
    const out = [];
    for (const nombre of TIPOS) {
      try {
        const img = new Image();
        img.src = `/mapa/subsuelo/${nombre}.png`;
        await img.decode();
        const c = document.createElement('canvas'); c.width = c.height = n;
        const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(img, 0, 0, n, n);
        const px = x.getImageData(0, 0, n, n).data, media = [0, 0, 0];
        for (let i = 0; i < px.length; i += 4) { media[0] += px[i]; media[1] += px[i + 1]; media[2] += px[i + 2]; }
        out.push({ tipo: nombre, px, media: media.map(v => v / (n * n)) });
      } catch { refsError = 'No cargo la imagen ' + nombre + '.png'; }
    }
    refs = out; refsN = n;
    return refs;
  }
  // Se compara el dibujo de la casilla (quitando su color medio) y, aparte, el color medio: así un tinte, una
  // sombra o un adorno pequeño no cambian lo que es
  function clasificarCelda(d, W, x0, y0, n) {
    let oscuro = 0, trans = 0;
    const m = [0, 0, 0];
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const i = ((y0 + y) * W + x0 + x) * 4;
      if (d[i + 3] < 20) trans++;
      else if (d[i] + d[i + 1] + d[i + 2] < 70) oscuro++;
      m[0] += d[i]; m[1] += d[i + 1]; m[2] += d[i + 2];
    }
    const nn = n * n;
    if (trans > nn * 0.9 || oscuro > nn * 0.97) return { t: 'fuera', d: 0 };
    m[0] /= nn; m[1] /= nn; m[2] /= nn;
    let mejor = 'raro', bd = Infinity;
    for (const r of refs) {
      const rm = r.media;
      let s = 0;
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const i = ((y0 + y) * W + x0 + x) * 4, j = (y * n + x) * 4;
        s += Math.abs(d[i] - m[0] - r.px[j] + rm[0]) + Math.abs(d[i + 1] - m[1] - r.px[j + 1] + rm[1]) + Math.abs(d[i + 2] - m[2] - r.px[j + 2] + rm[2]);
      }
      s = s / nn + 0.35 * (Math.abs(m[0] - rm[0]) + Math.abs(m[1] - rm[1]) + Math.abs(m[2] - rm[2]));
      if (s < bd) { bd = s; mejor = r.tipo; }
    }
    return bd <= 200 ? { t: mejor, d: bd } : { t: 'raro', d: bd };
  }
  function leerVista(t) {
    let d;
    try { d = t.cv.getContext('2d').getImageData(0, 0, t.cv.width, t.cv.height).data; }
    catch (e) { return { error: 'No puedo leer el dibujo del mapa: ' + (e && e.message) }; }
    let hash = 0;
    for (let i = 0; i < d.length; i += 97) hash = (hash * 31 + d[i]) | 0;
    const tipos = [], difs = [];
    for (let r = 0; r < t.rows; r++) {
      const fila = [], fd = [];
      for (let c = 0; c < t.cols; c++) { const x = clasificarCelda(d, t.cv.width, c * t.tc, r * t.tc, t.tc); fila.push(x.t); fd.push(Math.round(x.d)); }
      tipos.push(fila); difs.push(fd);
    }
    return { tipos, difs, hash };
  }

  /* ------------------------------------------------------------------ *
   *  DATOS DE LA PÁGINA (React): se busca el mapa entero y las listas de cosas con posición
   * ------------------------------------------------------------------ */
  const fibraDe = el => { if (!el) return null; const k = Object.keys(el).find(x => x.startsWith('__reactFiber$')); return k ? el[k] : null; };
  function actual(f) {
    if (!f) return f;
    for (const c of [f, f.alternate]) {
      if (!c) continue;
      let r = c; while (r.return) r = r.return;
      if (r.tag === 3 && r.stateNode && r.stateNode.current === r) return c;
    }
    return f;
  }
  const nombreFibra = f => (f && f.type && (f.type.displayName || f.type.name)) || (f && typeof f.type === 'string' ? f.type : '?');
  // (primero el estado y luego las props: el estado es lo que se actualiza al andar; las props se quedan como al cargar)
  function valoresFibra(f) {
    const out = [];
    if (f.tag === 0 || f.tag === 11 || f.tag === 14 || f.tag === 15) {
      let h = f.memoizedState, i = 0;
      while (h && typeof h === 'object' && 'memoizedState' in h && i < 80) {
        let v = h.memoizedState;
        if (Array.isArray(v) && v.length === 2 && (Array.isArray(v[1]) || v[1] === null)) v = v[0];   // useMemo
        if (v && typeof v === 'object') out.push(['hook' + i, v]);
        h = h.next; i++;
      }
    } else if (f.tag === 1 && f.memoizedState && typeof f.memoizedState === 'object') out.push(['state', f.memoizedState]);
    if (typeof f.type !== 'string' && f.memoizedProps && typeof f.memoizedProps === 'object') out.push(['props', f.memoizedProps]);
    return out;
  }
  const PARES = [['x', 'y'], ['col', 'fila'], ['columna', 'fila'], ['c', 'f'], ['col', 'row'], ['cx', 'cy']];
  function posDe(o) {
    if (!o || typeof o !== 'object') return null;
    if (Array.isArray(o)) return o.length === 2 && Number.isInteger(o[0]) && Number.isInteger(o[1]) ? { x: o[0], y: o[1] } : null;
    for (const [a, b] of PARES) if (Number.isInteger(o[a]) && Number.isInteger(o[b])) return { x: o[a], y: o[b] };
    for (const k of ['pos', 'posicion', 'coords', 'celda', 'casilla']) { const p = o[k] && typeof o[k] === 'object' && !Array.isArray(o[k]) ? posDe(o[k]) : null; if (p) return p; }
    return null;
  }
  const valorCelda = v => (v && typeof v === 'object') ? String(v.tipo ?? v.t ?? v.type ?? v.kind ?? v.id ?? JSON.stringify(v).slice(0, 20)) : String(v);
  function comoRejilla(arr) {
    if (arr.length < 5) return null;
    if (arr.every(s => typeof s === 'string')) {
      const w = arr[0].length;
      if (w >= 5 && arr.every(s => s.length === w)) return { w, h: arr.length, get: (x, y) => arr[y][x] };
      return null;
    }
    if (arr.every(r => Array.isArray(r))) {
      const w = arr[0].length;
      if (w >= 5 && arr.every(r => r.length === w) && arr[0].slice(0, 5).every(v => v == null || typeof v !== 'object' || !Array.isArray(v)))
        return { w, h: arr.length, get: (x, y) => valorCelda(arr[y][x]) };
    }
    return null;
  }
  function rejillaPlana(o) {
    const w = [o.ancho, o.width, o.w, o.cols, o.columnas].find(Number.isInteger);
    const h = [o.alto, o.height, o.h, o.rows, o.filas].find(Number.isInteger);
    if (!w || !h || w * h < 50) return null;
    for (const v of Object.values(o)) {
      if (typeof v === 'string' && v.length === w * h) return { w, h, get: (x, y) => v[y * w + x] };
      if (Array.isArray(v) && v.length === w * h && typeof v[0] !== 'object') return { w, h, get: (x, y) => valorCelda(v[y * w + x]) };
    }
    return null;
  }
  // La ventana que manda el servidor: un trozo del mapa (19×15) alrededor de ti, con sus coordenadas de verdad
  const comoPlano = o => o && Number.isInteger(o.ancho) && Number.isInteger(o.alto) && !('xBase' in o) && o.ancho * o.alto >= 2000
    && Array.isArray(o.tiles) && o.tiles.length === o.ancho * o.alto;
  const comoVentana = o => o && Number.isInteger(o.xBase) && Number.isInteger(o.yBase) && Number.isInteger(o.ancho) && Number.isInteger(o.alto)
    && Array.isArray(o.tiles) && o.tiles.length === o.ancho * o.alto;
  function escanear(v, ruta, visto, res, prof) {
    if (!v || typeof v !== 'object' || visto.has(v) || prof > 5) return;
    if (typeof Node !== 'undefined' && v instanceof Node) return;
    if (v === window || v.$$typeof || v instanceof Promise) return;
    visto.add(v);
    if (Array.isArray(v)) {
      const g = comoRejilla(v);
      if (g) { res.rejillas.push({ ruta, ...g, crudo: v }); return; }
      if (v.length && v.length <= 3000) {
        const ps = v.map(posDe);
        const n = ps.filter(Boolean).length;
        if (n && n >= v.length * 0.8) res.listas.push({ ruta, items: v, pos: ps });
        for (let i = 0; i < Math.min(v.length, 6); i++) escanear(v[i], ruta + '[' + i + ']', visto, res, prof + 1);
      }
      return;
    }
    if (comoVentana(v)) res.ventanas.push({ ruta, v });
    else if (comoPlano(v)) res.planos.push({ ruta, v });
    else { const g = rejillaPlana(v); if (g) res.rejillas.push({ ruta, ...g, crudo: v }); }
    const p = posDe(v);
    if (p) res.posiciones.push({ ruta, ...p });
    let n = 0;
    for (const k in v) {
      if (++n > 80) break;
      let x; try { x = v[k]; } catch { continue; }
      if (typeof x === 'function') { res.funciones.add(ruta + '.' + k); continue; }
      if (k === 'return' || k === 'child' || k === 'sibling' || k === 'alternate' || k === '_owner' || k === 'stateNode') continue;
      escanear(x, ruta + '.' + k, visto, res, prof + 1);
    }
  }
  let datosMemo = { t: 0, v: null };
  let sitioVentana = null;                        // {tipo, donde}: en qué componente y estado está la ventana (para leerla rápido)
  function ventanaRapida(t) {
    if (!sitioVentana) return null;
    let f = actual(fibraDe(t.cv));
    for (let i = 0; f && i < 30; f = f.return, i++) {
      if (f.type !== sitioVentana.tipo) continue;
      // React guarda dos copias del componente (la de pantalla y la anterior): se cogen las dos y luego se elige
      // la que encaja con lo que se ve
      const cands = [];
      for (const ff of [f, f.alternate]) {
        if (!ff) continue;
        const vals = valoresFibra(ff);
        const plano = vals.find(([, v]) => comoPlano(v));
        if (plano) guardarPlano(plano[1]);
        const par = vals.find(([k]) => k === sitioVentana.donde);
        if (par && comoVentana(par[1]) && !cands.some(c => c.v === par[1])) cands.push({ ruta: sitioVentana.ruta, v: par[1] });
      }
      return cands.length ? { ...cands[0], alternativas: cands } : null;
    }
    return null;
  }
  function datosPagina(t, forzar = false) {
    // la ventana cambia con cada paso: se lee siempre fresca (por el camino rápido si ya se sabe dónde está)
    const rapida = !forzar && ventanaRapida(t);
    if (rapida && datosMemo.v && Date.now() - datosMemo.t < 1500) { datosMemo.v.ventana = rapida; return datosMemo.v; }
    if (!forzar && !sitioVentana && datosMemo.v && Date.now() - datosMemo.t < 1500) return datosMemo.v;
    const res = { rejillas: [], listas: [], posiciones: [], funciones: new Set(), fibras: [], ventanas: [], planos: [] };
    const vistas = new Set(), visto = new Set();
    for (const el of [t.cv, t.capa, t.caja]) {
      let f = actual(fibraDe(el));
      for (let i = 0; f && i < 30; f = f.return, i++) {
        if (vistas.has(f)) continue;
        vistas.add(f);
        const vals = valoresFibra(f);
        if (!vals.length) continue;
        const nom = nombreFibra(f);
        res.fibras.push({ nivel: i, nombre: nom, vals });
        for (const [dónde, v] of vals) {
          const antes = res.ventanas.length;
          escanear(v, nom + '.' + dónde, visto, res, 0);
          for (const w of res.ventanas.slice(antes)) if (w.ruta === nom + '.' + dónde) { w.tipo = f.type; w.donde = dónde; }
        }
      }
    }
    res.rejillas.sort((a, b) => b.w * b.h - a.w * a.h);
    // el mapa entero: más grande que lo que se ve (una rejilla del tamaño de la pantalla es solo la vista)
    res.rejilla = res.rejillas.find(g => g.w * g.h >= 100 && (g.w > t.cols || g.h > t.rows)) || null;
    // la ventana buena es la del estado (se actualiza al andar), no la inicial de las props
    if (res.planos.length) guardarPlano(res.planos[0].v);
    res.ventana = res.ventanas.find(w => /\.hook\d+$/.test(w.ruta) && w.tipo) || res.ventanas.find(w => w.tipo) || res.ventanas[0] || null;
    if (res.ventana && res.ventana.tipo && /^hook\d+$/.test(res.ventana.donde || '')) sitioVentana = { tipo: res.ventana.tipo, donde: res.ventana.donde, ruta: res.ventana.ruta };
    datosMemo = { t: Date.now(), v: res };
    return res;
  }

  /* ------------------------------------------------------------------ *
   *  DÓNDE ESTÁS: se encaja lo que se ve en el mapa (del juego o el aprendido)
   * ------------------------------------------------------------------ */
  const TIPO_I = { suelo: 0, pared: 1, agua: 2, lava: 3, salida: 4, fuera: 5 };
  function idsRejilla(G) {
    if (G._ids) return G._ids;
    const dic = new Map([['∅', 0]]), ids = new Uint16Array(G.w * G.h), chars = ['∅'];
    for (let y = 0; y < G.h; y++) for (let x = 0; x < G.w; x++) {
      const ch = G.get(x, y);
      let id = dic.get(ch);
      if (id == null) { id = chars.length; dic.set(ch, id); chars.push(ch); }
      ids[y * G.w + x] = id;
    }
    G._ids = { ids, chars };
    return G._ids;
  }
  function alinearJuego(G, vista, cerca) {
    const { ids, chars } = idsRejilla(G);
    const nC = chars.length, rows = vista.length, cols = vista[0].length;
    const cel = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const ti = TIPO_I[vista[r][c]]; if (ti != null) cel.push(c, r, ti); }
    if (cel.length < 30) return null;
    const tally = new Int32Array(nC * 6);
    const [x0, x1, y0, y1] = cerca ? [cerca.x - 6, cerca.x + 6, cerca.y - 6, cerca.y + 6] : [-cols + 1, G.w - 1, -rows + 1, G.h - 1];
    const res = [];
    for (let oy = y0; oy <= y1; oy++) for (let ox = x0; ox <= x1; ox++) {
      tally.fill(0);
      for (let i = 0; i < cel.length; i += 3) {
        const x = ox + cel[i], y = oy + cel[i + 1];
        const id = (x < 0 || y < 0 || x >= G.w || y >= G.h) ? 0 : ids[y * G.w + x];
        tally[id * 6 + cel[i + 2]]++;
      }
      let s = 0;
      for (let ch = 0; ch < nC; ch++) { let m = 0; for (let k = 0; k < 6; k++) if (tally[ch * 6 + k] > m) m = tally[ch * 6 + k]; s += m; }
      res.push({ x: ox, y: oy, r: s / (cel.length / 3) });
    }
    return elegirEncaje(res, cerca);
  }
  function alinearMem(m, vista, cerca) {
    const rows = vista.length, cols = vista[0].length;
    const claves = Object.keys(m.celdas);
    if (!claves.length) return null;
    let x0, x1, y0, y1;
    if (cerca) [x0, x1, y0, y1] = [cerca.x - 6, cerca.x + 6, cerca.y - 6, cerca.y + 6];
    else {
      const ps = claves.map(deK);
      x0 = Math.min(...ps.map(p => p.x)) - cols + 1; x1 = Math.max(...ps.map(p => p.x));
      y0 = Math.min(...ps.map(p => p.y)) - rows + 1; y1 = Math.max(...ps.map(p => p.y));
    }
    const res = [];
    for (let oy = y0; oy <= y1; oy++) for (let ox = x0; ox <= x1; ox++) {
      let solape = 0, ok = 0;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const t = vista[r][c]; if (t === 'raro' || t === 'fuera') continue;
        const e = m.celdas[K(ox + c, oy + r)];
        if (e == null) continue;
        solape++; if (e === t) ok++;
      }
      if (solape >= 30) res.push({ x: ox, y: oy, r: ok / solape - (solape < 60 ? 0.02 : 0) });
    }
    return elegirEncaje(res, cerca);
  }
  function elegirEncaje(res, cerca) {
    if (!res.length) return null;
    const max = Math.max(...res.map(e => e.r));
    const top = res.filter(e => e.r >= max - 0.001);
    const dist = e => cerca ? Math.abs(e.x - cerca.x) + Math.abs(e.y - cerca.y) : 0;
    top.sort((a, b) => dist(a) - dist(b));
    const dudoso = !cerca && top.length > 1;
    return { x: top[0].x, y: top[0].y, r: max, dudoso, empates: top.length };
  }

  /* ------------------------------------------------------------------ *
   *  OBSERVAR: tablero + terreno + cosas + posición, y lo apunta en la memoria
   * ------------------------------------------------------------------ */
  let camPrev = null, prediccion = null;
  let ultimaObs = null;
  async function observar() {
    const t = tablero();
    if (!t) return { error: 'No veo el mapa de las grutas.' };
    const { cosas, yo, entreCasillas } = leerCosas(t);
    if (!yo) return { error: 'No te veo en el mapa.' };
    if (entreCasillas) return { error: 'Moviéndose…', moviendo: true, t, cosas, yo };
    const datos0 = datosPagina(t);
    await cargarRefs(t.tc);
    if (datos0.ventana) return observarDatos(t, cosas, yo, datos0);
    if (!refs.length) return { error: refsError || 'No cargo las imágenes de la leyenda.' };
    const v = leerVista(t);
    if (v.error) return { error: v.error };
    const dibujadas = v.tipos.flat().filter(x => x !== 'fuera' && x !== 'raro').length;
    if (dibujadas < 30) return { error: dibujadas ? 'No reconozco el dibujo del mapa (pulsa «📋 Copiar datos» y pégamelo).' : 'El mapa aún no se ha dibujado.', t, v, cosas, yo };
    const datos = datos0;
    const G = datos.rejilla;
    const nuevoMarco = G ? 'juego:' + G.w + 'x' + G.h : 'propio';
    if (nuevoMarco !== marco) { marco = nuevoMarco; camPrev = null; prediccion = null; }
    const m = mem();
    let cam = null, fuente = G ? 'juego' : 'propio';
    const cerca = prediccion || camPrev;
    if (G) {
      cam = alinearJuego(G, v.tipos, cerca);
      if (cam && cerca && cam.r < 0.9) cam = alinearJuego(G, v.tipos, null);
      if (cam && cam.dudoso) {
        // se desempata con las posiciones que tenga la página (la tuya estará entre ellas)
        // (solo posiciones sueltas, no las de las listas de vetas o puertas)
        const alt = datos.posiciones.filter(p => !/\[\d+\]/.test(p.ruta)).map(p => ({ x: p.x - yo.c, y: p.y - yo.f }));
        const todos = alinearTodos(G, v.tipos);
        const buenas = todos.filter(e => e.r >= cam.r - 0.001 && alt.some(a => a.x === e.x && a.y === e.y));
        if (buenas.length === 1) cam = { ...buenas[0], dudoso: false };
      }
      if (cam && cam.r < 0.9) cam = null;
    } else {
      if (!Object.keys(m.celdas).length) cam = { x: 0, y: 0, r: 1 };
      else {
        cam = alinearMem(m, v.tipos, cerca);
        if ((!cam || cam.r < 0.95) && cerca) cam = alinearMem(m, v.tipos, null);
        if ((!cam || cam.r < 0.95) && !camPrev) {
          // zona que no se reconoce: se empieza un mapa nuevo
          mems[marco] = { celdas: {}, objs: {}, vetas: {}, sinPaso: {}, t: Date.now() };
          cam = { x: 0, y: 0, r: 1 };
        } else if (cam && cam.r < 0.95) cam = null;
      }
    }
    prediccion = null;
    if (!cam) return { error: 'No encajo lo que se ve con el mapa. Muévete una casilla y vuelvo a mirar.', t, v, cosas, yo, datos };
    if (cam.dudoso) return { error: 'Aquí todo se parece: muévete un poco para que sepa dónde estás.', t, v, cosas, yo, datos };
    camPrev = { x: cam.x, y: cam.y };
    const mm = mem();
    const ahora = Date.now();
    // terreno visto
    for (let r = 0; r < t.rows; r++) for (let c = 0; c < t.cols; c++) {
      const tp = v.tipos[r][c];
      if (tp !== 'raro' && tp !== 'fuera') mm.celdas[K(cam.x + c, cam.y + r)] = tp;
    }
    // cosas vistas (y lo que ya no está)
    const enVista = (x, y) => x >= cam.x && y >= cam.y && x < cam.x + t.cols && y < cam.y + t.rows;
    const ocupadas = new Set();
    for (const o of cosas) {
      o.x = cam.x + o.c; o.y = cam.y + o.f;
      for (let dy = 0; dy < o.h; dy++) for (let dx = 0; dx < o.w; dx++) {
        const k = K(o.x + dx, o.y + dy);
        ocupadas.add(k);
        if (o.tipo === 'veta' || o.tipo === 'ball') {
          const vv = mm.vetas[k] || (mm.vetas[k] = {});
          vv.visto = ahora; vv.t = o.tipo; vv.titulo = o.titulo; vv.n = Math.min(99, (vv.n || 0) + 1);
          if (o.vacia) vv.vacia = vv.vacia || ahora; else { delete vv.vacia; delete vv.picada; }
          delete mm.objs[k];
        } else mm.objs[k] = { t: o.tipo, titulo: o.titulo, visto: ahora };
      }
    }
    for (const [k, vv] of Object.entries(mm.vetas)) {
      const p = deK(k);
      if (!enVista(p.x, p.y) || ocupadas.has(k)) continue;
      // vista pocas veces y ya no está: era una lectura mala, no una veta
      if ((vv.n || 0) < 3 && !vv.picada) delete mm.vetas[k];
      else vv.vacia = vv.vacia || ahora;
    }
    for (const k of Object.keys(mm.objs)) { const p = deK(k); if (enVista(p.x, p.y) && !ocupadas.has(k)) delete mm.objs[k]; }
    guardarMem();
    const pos = { x: cam.x + yo.c, y: cam.y + yo.f };
    const o = { ok: true, t, v, cosas, yo, cam, pos, datos, G, fuente, hash: v.hash, enVista };
    ultimaObs = o;
    return o;
  }
  /* ── Con los datos del juego: coordenadas de verdad, lo que es cada casilla y cada veta con su tipo ── */
  // Códigos de casilla vistos en el juego: 1 suelo, 3 agua, 0 roca, 7 veta, 9 puerta de base, 11 cámara
  // 0 roca (se dibuja como la roca de la leyenda), 1 suelo, 3 agua, 7 veta, 8 escalera (no se pisa), 9 puerta, 11 losa.
  // El resto (2, 4, 5, 6, 10, 12…) se sabe por cómo lo dibuja el juego o al pisarlo
  // Códigos de casilla del juego. Comprobados en partida: 4, 5, 6 y 12 se pisan (suelos de otro dibujo) y 10 es lava
  // (antes se aprendía mirando el dibujo y, con la memoria vacía, intentaba pisarla). El 2 se queda sin fijar: se
  // dibuja como agua pero hay sitios donde se pisa; lo decide lo aprendido.
  const CODIGOS = { 0: 'pared', 1: 'suelo', 3: 'agua', 4: 'suelo', 5: 'suelo', 6: 'suelo', 7: 'nodo', 8: 'salida', 9: 'puerta', 10: 'lava', 11: 'losa', 12: 'suelo' };
  const lista = v => Array.isArray(v) ? v : (v && typeof v === 'object' ? [v] : []);
  function hashCanvas(t) {
    try { const d = t.cv.getContext('2d').getImageData(0, 0, t.cv.width, t.cv.height).data; let h = 0; for (let i = 0; i < d.length; i += 97) h = (h * 31 + d[i]) | 0; return h; }
    catch { return 0; }
  }
  // El mapa entero se guarda aparte (no depende del sitio) y se refresca como mucho una vez al día
  let planoMemo = lsLee('axsub-plano', null);
  function guardarPlano(v) {
    if (planoMemo && planoMemo.ancho === v.ancho && planoMemo.alto === v.alto && Date.now() - planoMemo.t < 3600e3) return;
    planoMemo = { ancho: v.ancho, alto: v.alto, tiles: v.tiles.slice(), t: Date.now() };
    lsPon('axsub-plano', planoMemo);
  }
  const codPlano = (x, y) => (planoMemo && x >= 0 && y >= 0 && x < planoMemo.ancho && y < planoMemo.alto) ? planoMemo.tiles[y * planoMemo.ancho + x] : undefined;
  // Si no se tiene el mapa entero (o es de hace más de un día), se abre «Ver mapa» un momento y se cierra
  async function leerPlano() {
    if (planoMemo && Date.now() - planoMemo.t < H24) return true;
    const b = $$('main button').find(x => /ver mapa/i.test(x.textContent || '') && !x.disabled && !x.closest('[data-ax-ignore]'));
    if (!b) return false;
    const t0 = planoMemo ? planoMemo.t : 0;
    b.click();
    const tb = tablero();
    for (let i = 0; i < 30 && (!planoMemo || planoMemo.t === t0); i++) { await sleep(200); if (tb) datosPagina(tb, true); }
    // cerrar la ventana del mapa
    for (let i = 0; i < 10; i++) {
      const modal = $$('div.fixed.inset-0').find(d => /mapa del subsuelo/i.test(d.textContent || ''));
      if (!modal) break;
      const x = $$('button', modal).find(bb => bb.getAttribute('aria-label') === 'Cerrar' || /^[✕×]$/.test((bb.textContent || '').trim()));
      if (x) x.click();
      await sleep(250);
    }
    if (planoMemo && planoMemo.t !== t0) { log(`🗺️ Mapa entero leído: ${planoMemo.ancho}×${planoMemo.alto} casillas.`); return true; }
    return false;
  }
  let ultimoDibujo = null;
  function observarDatos(t, cosas, yo, datos) {
    if (marco !== 'datos') { marco = 'datos'; camPrev = null; prediccion = null; }
    const m = mem();
    for (const k of ['cod', 'nodos', 'objs', 'vetas', 'sinPaso', 'pisables', 'costes', 'codMal', 'votos']) if (!m[k]) m[k] = {};
    // (las cuentas viejas de «no deja pasar» eran por intento, no por casilla: se tiran)
    for (const c of Object.keys(m.codMal)) if (!Array.isArray(m.codMal[c])) delete m.codMal[c];
    const vista = refs && refs.length ? leerVista(t) : null;
    // cámara: la ventana del juego va centrada en ti; lo que se ve encima (puertas por su nombre, vetas y cámaras en su
    // sitio) y el suelo dibujado lo confirman. Si hay dos copias de los datos (la actual y la anterior), gana la que encaja
    const probar = w => {
      const bases = lista(w.basesVisibles), nodosV = lista(w.nodosVisibles).filter(Boolean), camaras = lista(w.camarasVisibles);
      const baseDe = c => { const nom = c.titulo.replace(/^base (secreta )?de\s*/i, '').trim(); return bases.find(x => x && x.nombre === nom) || null; };
      const encaje = cm => {
        let bien = 0, mal = 0;
        for (const c of cosas) {
          const x = cm.x + c.c, y = cm.y + c.f;
          let hay = null;
          if (c.tipo === 'puerta') { const b = baseDe(c); if (b) hay = b.x === x && b.y === y; }
          else if (c.tipo === 'veta') hay = nodosV.some(n => n.x === x && n.y === y);
          else if (c.tipo === 'losa' && camaras.length) hay = camaras.some(n => n && n.x === x && n.y === y);
          if (hay === true) bien++; else if (hay === false) mal++;
        }
        return { nota: bien - 2 * mal, mal };
      };
      // el suelo que se ve dibujado tal cual (la imagen de la leyenda) debe caer en casillas de suelo, no de roca
      const suelo = cm => {
        let bien = 0, mal = 0;
        if (!vista || !vista.tipos) return { bien, mal };
        for (let r = 0; r < t.rows; r++) for (let c = 0; c < t.cols; c++) {
          if (vista.tipos[r][c] !== 'suelo' || vista.difs[r][c] > 20) continue;
          const x = cm.x + c - w.xBase, y = cm.y + r - w.yBase;
          if (x < 0 || y < 0 || x >= w.ancho || y >= w.alto) continue;
          const cod = w.tiles[y * w.ancho + x];
          if (cod === 0) mal++; else bien++;
        }
        return { bien, mal };
      };
      const centro = { x: w.xBase + Math.floor((w.ancho - t.cols) / 2), y: w.yBase + Math.floor((w.alto - t.rows) / 2) };
      let cam = centro, e = encaje(centro);
      if (e.nota < 0) for (const c of cosas) {
        if (c.tipo !== 'puerta') continue;
        const b = baseDe(c);
        if (!b) continue;
        const cm = { x: b.x - c.c, y: b.y - c.f }, e2 = encaje(cm);
        if (e2.nota > e.nota) { cam = cm; e = e2; }
      }
      const sl = suelo(cam);
      return { vp: w, cam, nota: e.nota * 3 + sl.bien - 3 * sl.mal, limpio: e.mal === 0 && sl.mal <= Math.max(2, sl.bien * 0.08) };
    };
    const opciones = (datos.ventana.alternativas || [datos.ventana]).map(w => probar(w.v));
    opciones.sort((a, b) => b.nota - a.nota);
    const { vp, cam, limpio } = opciones[0];
    camPrev = cam;
    const ahora = Date.now();
    const x0 = vp.xBase, y0 = vp.yBase, x1 = x0 + vp.ancho - 1, y1 = y0 + vp.alto - 1;
    const enVentana = (x, y) => x >= x0 && y >= y0 && x <= x1 && y <= y1;
    for (let y = 0; y < vp.alto; y++) for (let x = 0; x < vp.ancho; x++) m.cod[K(x0 + x, y0 + y)] = vp.tiles[y * vp.ancho + x];
    // vetas (todas las de la ventana vienen en la lista: las que ya no están se borran)
    const visible = (x, y) => x >= cam.x && y >= cam.y && x < cam.x + t.cols && y < cam.y + t.rows;
    for (const k of Object.keys(m.nodos)) { const p = deK(k); if (enVentana(p.x, p.y) && (!m.nodos[k].dom || visible(p.x, p.y))) delete m.nodos[k]; }
    for (const n of lista(vp.nodosVisibles)) {
      if (!n || !Number.isInteger(n.x) || !Number.isInteger(n.y)) continue;
      m.nodos[K(n.x, n.y)] = { tipo: String(n.tipoId ?? n.tipo ?? 'veta'), activo: n.activo !== false, disp: n.disponibleEn ?? null, visto: ahora };
    }
    for (const c of cosas) {
      if (c.tipo !== 'ball') continue;
      const k = K(cam.x + c.c, cam.y + c.f);
      if (!m.nodos[k]) m.nodos[k] = { tipo: 'pokeball', activo: !c.vacia, disp: null, visto: ahora, dom: true };
    }
    // lo que no se puede pisar: puertas de bases, cámaras, escaleras, la Sima
    for (const k of Object.keys(m.objs)) { const p = deK(k); if (enVentana(p.x, p.y)) delete m.objs[k]; }
    const poner = (it, tipo, titulo) => {
      if (!it || !Number.isInteger(it.x) || !Number.isInteger(it.y)) return;
      const w = Number.isInteger(it.ancho) ? it.ancho : Number.isInteger(it.w) ? it.w : 1, h = Number.isInteger(it.alto) ? it.alto : Number.isInteger(it.h) ? it.h : 1;
      for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) m.objs[K(it.x + dx, it.y + dy)] = { t: tipo, titulo, visto: ahora };
    };
    for (const b of lista(vp.basesVisibles)) poner(b, 'puerta', 'Base de ' + (b && b.nombre));
    for (const c of lista(vp.camarasVisibles)) poner(c, 'losa', c && c.nombre);
    for (const s of lista(vp.salidasVisibles)) poner(s, 'salida', 'Escalera');
    for (const s of lista(vp.simaVisible)) poner(s, 'sima', 'La Sima');
    // y cualquier otra cosa que se vea encima del mapa y no venga en los datos
    for (const c of cosas) {
      c.x = cam.x + c.c; c.y = cam.y + c.f;
      if (c.tipo === 'veta' || c.tipo === 'ball' || c.tipo === 'puerta' || c.tipo === 'losa') continue;
      for (let dy = 0; dy < c.h; dy++) for (let dx = 0; dx < c.w; dx++) m.objs[K(c.x + dx, c.y + dy)] = { t: c.tipo, titulo: c.titulo, visto: ahora };
    }
    // Qué es cada código según cómo lo dibuja el juego: cada casilla a la vista que se parece mucho a una imagen
    // de la leyenda (suelo, roca, agua, lava, escalera) vota por ella; así la lava se sabe antes de pisarla
    // (solo con la pantalla quieta: justo al andar, el dibujo va un paso por detrás de los datos)
    const hc = hashCanvas(t), quieta = ultimoDibujo && ultimoDibujo.h === hc && ultimoDibujo.x === cam.x && ultimoDibujo.y === cam.y;
    ultimoDibujo = { h: hc, x: cam.x, y: cam.y };
    if (quieta && limpio && vista) {
      if (vista.tipos) {
        const ocupada = new Set(cosas.map(c => K(c.c, c.f)));
        for (let r = 0; r < t.rows; r++) for (let c = 0; c < t.cols; c++) {
          const tp = vista.tipos[r][c];
          // (la lava tiene un color tan suyo que se le deja algo más de margen)
          if (tp === 'fuera' || tp === 'raro' || vista.difs[r][c] > 35 || ocupada.has(K(c, r)) || (c === yo.c && r === yo.f)) continue;
          const cod = m.cod[K(cam.x + c, cam.y + r)];
          if (cod == null) continue;
          const vv = m.votos[cod] || (m.votos[cod] = {});
          if ((vv[tp] || 0) < 500) vv[tp] = (vv[tp] || 0) + 1;
        }
      }
    }
    const pos = { x: cam.x + yo.c, y: cam.y + yo.f };
    // si estás encima de una casilla, esa clase de casilla se puede pisar (así se aprenden los códigos nuevos)
    const bajo = m.cod[K(pos.x, pos.y)];
    if (bajo != null && !CODIGOS[bajo]) m.pisables[bajo] = true;
    guardarMem();
    const enVista = (x, y) => x >= cam.x && y >= cam.y && x < cam.x + t.cols && y < cam.y + t.rows;
    const o = { ok: true, t, cosas, yo, cam, pos, datos, vp, fuente: 'datos', hash: hc ^ (pos.x * 7919 + pos.y), enVista,
      pasosHastaGasto: vp.pasosHastaGasto, pasosPorEnergia: vp.pasosPorEnergia };
    ultimaObs = o;
    return o;
  }
  const EMOJI_TIPO = [[/roja/i, '🔴'], [/azul/i, '🔵'], [/f[oó]sil|cr[aá]neo|coraza/i, '🦴'], [/magma/i, '🌋'], [/placa/i, '📜'], [/ball|poke/i, '⚪'], [/fil[oó]n|brillante/i, '🌟'], [/mineral/i, '💠'], [/veta|peque|grande/i, '💎']];
  const emojiTipo = tp => (EMOJI_TIPO.find(([re]) => re.test(tp)) || [0, '⛏️'])[1];
  const nombreTipo = tp => { const s = String(tp).replace(/[-_]+/g, ' ').trim(); return s.charAt(0).toUpperCase() + s.slice(1); };
  // Un tipo nuevo (que aparece más tarde) se pica solo si no has quitado ninguno: si has elegido, lo nuevo empieza quitado
  const quiereTipo = tp => {
    const t = cfg.tipos || {};
    if (tp in t) return t[tp] !== false;
    return !Object.values(t).some(v => v === false);
  };
  // Lo que dice el dibujo de un código: al menos 4 casillas vistas y 7 de cada 10 iguales
  function votado(m, c) {
    const vv = m.votos && m.votos[c];
    if (!vv) return null;
    const tot = Object.values(vv).reduce((a, b) => a + b, 0);
    const [tp, n] = Object.entries(vv).sort((a, b) => b[1] - a[1])[0] || [];
    return tot >= 8 && n / tot >= 0.85 ? tp : null;
  }
  // relajado: no se fía de lo aprendido al fallar pasos (ni de las casillas sueltas que no dejaron pasar): sirve para
  // volver a intentarlo antes de dar el mapa por acabado
  function construirMapaDatos(o, relajado = false) {
    const m = mem(), ahora = Date.now();
    const tipoDeCod = c => {
      if (m.pisables[c] && CODIGOS[c] !== 'agua') return 'suelo';
      if (CODIGOS[c]) return CODIGOS[c];
      const vd = votado(m, c);
      if (vd === 'lava' || vd === 'salida') return vd;
      if (vd === 'pared' && !relajado) return vd;
      if (Array.isArray(m.codMal[c]) && m.codMal[c].length >= (relajado ? 5 : 3)) return 'pared';
      if (vd === 'agua') return 'agua';
      if (vd === 'suelo') return 'suelo';
      return 'probar';
    };
    const codEn = (x, y) => { const c = m.cod[K(x, y)]; return c == null ? codPlano(x, y) : c; };
    const tipoEn = (x, y) => { const c = codEn(x, y); return c == null ? 'desconocido' : tipoDeCod(c); };
    const bloqueadas = new Set([...Object.keys(m.objs), ...Object.keys(m.nodos), ...(relajado ? [] : Object.keys(m.sinPaso))]);
    const pisable = (x, y) => {
      if (x === o.pos.x && y === o.pos.y) return true;
      const t = tipoEn(x, y);
      if (!(t === 'suelo' || t === 'probar' || (t === 'agua' && cfg.agua))) return false;
      return !bloqueadas.has(K(x, y));
    };
    const vetas = [];
    for (const [k, n] of Object.entries(m.nodos)) {
      const { x, y } = deK(k), mv = m.vetas[k];
      const t = aTiempo(n.disp);
      let ok = n.activo && (!t || t <= ahora);
      if (!n.activo && t && t <= ahora) ok = true;                   // ya se ha vuelto a llenar desde que la viste
      if (mv && mv.picada && mv.picada >= n.visto && ahora - mv.picada < H12) ok = false;
      const existe = ok;
      if (fallidas.has(k)) ok = false;
      const coste = m.costes[n.tipo] ?? costeDeTexto(n.tipo);
      vetas.push({ x, y, k, t: 'veta', tipoId: n.tipo, ok: ok && quiereTipo(n.tipo), existe, coste, deTipo: quiereTipo(n.tipo) });
    }
    let X0 = Infinity, X1 = -Infinity, Y0 = Infinity, Y1 = -Infinity;
    for (const k in m.cod) { const i = k.indexOf(','), x = +k.slice(0, i), y = +k.slice(i + 1); if (x < X0) X0 = x; if (x > X1) X1 = x; if (y < Y0) Y0 = y; if (y > Y1) Y1 = y; }
    if (planoMemo) { X0 = Math.min(X0, 0); Y0 = Math.min(Y0, 0); X1 = Math.max(X1, planoMemo.ancho - 1); Y1 = Math.max(Y1, planoMemo.alto - 1); }
    return { tipoEn, codEn, tipoDeCod, pisable, vetas: vetas.filter(v => v.deTipo), todasVetas: vetas, x0: X0, y0: Y0, x1: X1, y1: Y1, charTipo: new Map() };
  }
  function alinearTodos(G, vista) {
    // todas las posiciones con su encaje (solo para desempatar la primera vez)
    const { ids, chars } = idsRejilla(G);
    const rows = vista.length, cols = vista[0].length, out = [];
    const cel = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const ti = TIPO_I[vista[r][c]]; if (ti != null) cel.push(c, r, ti); }
    const tally = new Int32Array(chars.length * 6);
    for (let oy = -rows + 1; oy < G.h; oy++) for (let ox = -cols + 1; ox < G.w; ox++) {
      tally.fill(0);
      for (let i = 0; i < cel.length; i += 3) {
        const x = ox + cel[i], y = oy + cel[i + 1];
        tally[((x < 0 || y < 0 || x >= G.w || y >= G.h) ? 0 : ids[y * G.w + x]) * 6 + cel[i + 2]]++;
      }
      let s = 0;
      for (let ch = 0; ch < chars.length; ch++) { let m = 0; for (let k = 0; k < 6; k++) m = Math.max(m, tally[ch * 6 + k]); s += m; }
      out.push({ x: ox, y: oy, r: s / (cel.length / 3) });
    }
    return out;
  }

  /* ------------------------------------------------------------------ *
   *  EL MAPA PARA PLANIFICAR: qué hay en cada casilla y qué vetas hay
   * ------------------------------------------------------------------ */
  const PRIOR = [[/suelo|floor|camino|tierra|^\.$/i, 'suelo'], [/pared|roca|muro|wall|^#$/i, 'pared'], [/agua|water|^~$/i, 'agua'], [/lava/i, 'lava'], [/salida|escalera|exit|stairs/i, 'salida']];
  function construirMapa(o, relajado = false) {
    if (o.fuente === 'datos') return conRejilla(construirMapaDatos(o, relajado));
    return conRejilla(construirMapaVista(o));
  }
  // Se precalcula qué se puede pisar en una rejilla (para que buscar caminos sea rápido en mapas grandes)
  function conRejilla(mapa) {
    const W = mapa.x1 - mapa.x0 + 1, H = mapa.y1 - mapa.y0 + 1;
    if (!(W > 0 && H > 0)) { mapa.x0 = mapa.y0 = 0; mapa.x1 = mapa.y1 = 0; }
    const w = mapa.x1 - mapa.x0 + 1, h = mapa.y1 - mapa.y0 + 1;
    const pasa = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) pasa[y * w + x] = mapa.pisable(mapa.x0 + x, mapa.y0 + y) ? 1 : 0;
    mapa.pasa = pasa;
    return mapa;
  }
  function construirMapaVista(o) {
    const m = mem(), G = o.G;
    // de cada letra del mapa del juego: qué es (por lo que se ha visto de ella) y si es una veta u otra cosa
    const charTipo = new Map(), charVeta = new Map();
    if (G) {
      const tal = new Map(), vet = new Map();
      const suma = (mp, ch, t) => { const x = mp.get(ch) || {}; x[t] = (x[t] || 0) + 1; mp.set(ch, x); };
      for (const [k, t] of Object.entries(m.celdas)) {
        const p = deK(k);
        if (p.x < 0 || p.y < 0 || p.x >= G.w || p.y >= G.h) continue;
        const ch = G.get(p.x, p.y);
        if (m.vetas[k]) suma(vet, ch, 'veta'); else if (m.objs[k]) suma(vet, ch, 'obj'); else suma(vet, ch, 'nada');
        suma(tal, ch, t);
      }
      for (const [ch, x] of tal) {
        const tot = Object.values(x).reduce((a, b) => a + b, 0);
        const [t, n] = Object.entries(x).sort((a, b) => b[1] - a[1])[0];
        if (n / tot >= 0.6) charTipo.set(ch, t);
      }
      for (const [ch, x] of vet) if ((x.veta || 0) >= 1 && (x.veta || 0) >= 3 * (x.nada || 0)) charVeta.set(ch, 'veta');
      for (const ch of idsRejilla(G).chars) if (!charTipo.has(ch)) { const p = PRIOR.find(([re]) => re.test(ch)); if (p) charTipo.set(ch, p[1]); }
    }
    const tipoEn = (x, y) => {
      const k = K(x, y);
      if (G) { if (x < 0 || y < 0 || x >= G.w || y >= G.h) return 'fuera'; return charTipo.get(G.get(x, y)) || m.celdas[k] || 'desconocido'; }
      return m.celdas[k] || 'desconocido';
    };
    // vetas: las vistas, las de las letras del mapa y las de las listas de la página
    const vetas = new Map();
    const ahora = Date.now();
    const añadir = (x, y, info) => { const k = K(x, y); const v = vetas.get(k) || { x, y, k, t: 'veta' }; Object.assign(v, info); vetas.set(k, v); };
    if (G && charVeta.size) for (let y = 0; y < G.h; y++) for (let x = 0; x < G.w; x++) if (charVeta.has(G.get(x, y))) añadir(x, y, { deMapa: true });
    const lista = listaVetas(o);
    if (lista) for (let i = 0; i < lista.items.length; i++) {
      const p = lista.pos[i]; if (!p) continue;
      añadir(p.x, p.y, { item: lista.items[i], disp: dispDeItem(lista.items[i]), coste: costeDe(lista.items[i]) });
    }
    for (const [k, mv] of Object.entries(m.vetas)) { const p = deK(k); añadir(p.x, p.y, { mem: mv, t: mv.t || 'veta' }); }
    // disponible o no
    for (const v of vetas.values()) {
      const mv = m.vetas[v.k];
      const visible = o.enVista(v.x, v.y);
      const respawn = v.t === 'ball' ? H24 : H12;
      if (visible) v.ok = !!(mv && mv.visto && !mv.vacia);
      else if (mv && mv.picada && ahora - mv.picada < respawn) v.ok = false;
      else if (v.disp != null) v.ok = v.disp;
      else if (mv && mv.vacia && ahora - mv.vacia < respawn) v.ok = false;
      else v.ok = true;
      if (v.coste == null) v.coste = costeDeTexto((mv && mv.titulo) || '') ?? (v.t === 'ball' ? 0 : null);
      if (fallidas.has(v.k)) v.ok = false;
    }
    const bloqueadas = new Set([...Object.keys(m.objs), ...vetas.keys(), ...Object.keys(m.sinPaso)]);
    if (o.G) for (const l of o.datos.listas) if (l !== lista && coincideCon(o, l, x => x.tipo !== 'veta' && x.tipo !== 'ball')) for (const p of l.pos) if (p) bloqueadas.add(K(p.x, p.y));
    const pisable = (x, y) => {
      const t = tipoEn(x, y);
      if (!(t === 'suelo' || (t === 'agua' && cfg.agua))) return false;
      return !bloqueadas.has(K(x, y));
    };
    // límites
    let x0, y0, x1, y1;
    if (G) { x0 = 0; y0 = 0; x1 = G.w - 1; y1 = G.h - 1; }
    else {
      const ps = Object.keys(m.celdas).map(deK);
      x0 = Math.min(...ps.map(p => p.x)); x1 = Math.max(...ps.map(p => p.x));
      y0 = Math.min(...ps.map(p => p.y)); y1 = Math.max(...ps.map(p => p.y));
    }
    return { tipoEn, pisable, vetas: [...vetas.values()], x0, y0, x1, y1, charTipo };
  }
  function coincideCon(o, l, filtro) {
    return l.pos.some(p => p && o.cosas.some(c => filtro(c) && c.x === p.x && c.y === p.y));
  }
  function listaVetas(o) {
    if (!o.G) return null;                        // sin el mapa del juego, sus coordenadas no casan con las aprendidas
    const m = mem();
    let l = o.datos.listas.find(x => coincideCon(o, x, c => c.tipo === 'veta'));
    if (l) { m.rutaVetas = l.ruta; return l; }
    return m.rutaVetas ? o.datos.listas.find(x => x.ruta === m.rutaVetas) || null : null;
  }
  const aTiempo = v => typeof v === 'number' ? (v > 1e12 ? v : v > 1e9 ? v * 1000 : null) : (typeof v === 'string' && /^\d{4}-\d\d-\d\d/.test(v) ? Date.parse(v) : null);
  function dispDeItem(it) {
    if (!it || typeof it !== 'object') return null;
    for (const [k, v] of Object.entries(it)) {
      const kn = k.toLowerCase();
      if (typeof v === 'boolean') {
        if (/disponible|^lista?$|listo|activ|llena|^hay|visible|puede/.test(kn)) return v;
        if (/picad|agotad|vaci|usad|recogid|abiert|cogid|hecha|gastad/.test(kn)) return !v;
      }
      if (/vuelve|recarga|hasta|proxim|listaen|disponiblee?n|reaparece/.test(kn)) { const t = aTiempo(v); if (t) return t <= Date.now(); if (v == null) return true; }
      if (/picad[ao]en|ultima|abiert[ao]en|cogid[ao]en/.test(kn)) { const t = aTiempo(v); if (t) return Date.now() - t >= H12; if (v == null) return true; }
    }
    return null;
  }
  const costeDeTexto = s => /peque|chica/i.test(s) ? 2 : /mineral|media/i.test(s) ? 4 : /fil[oó]n|brillante|grande/i.test(s) ? 8 : null;
  function costeDe(it) {
    if (!it || typeof it !== 'object') return null;
    for (const [k, v] of Object.entries(it)) {
      if (/coste|cost|energia|precio/i.test(k) && Number.isFinite(v)) return v;
      if (typeof v === 'string') { const c = costeDeTexto(v); if (c != null) return c; }
    }
    return null;
  }

  /* ------------------------------------------------------------------ *
   *  CAMINO ÓPTIMO: distancias reales (BFS) y el orden que menos pasos suma
   * ------------------------------------------------------------------ */
  const V4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  function bfs(mapa, desde, conPrev = false) {
    const W = mapa.x1 - mapa.x0 + 1, H = mapa.y1 - mapa.y0 + 1;
    const dist = new Int32Array(W * H).fill(-1), prev = conPrev ? new Int32Array(W * H).fill(-1) : null;
    const idx = (x, y) => (y - mapa.y0) * W + (x - mapa.x0);
    const cola = new Int32Array(W * H);
    let a = 0, b = 0;
    const s = idx(desde.x, desde.y);
    if (s < 0 || s >= W * H) return { dist, prev, idx, W };
    dist[s] = 0; cola[b++] = s;
    while (a < b) {
      const i = cola[a++], x = i % W + mapa.x0, y = Math.floor(i / W) + mapa.y0;
      for (const [dx, dy] of V4) {
        const nx = x + dx, ny = y + dy;
        if (nx < mapa.x0 || ny < mapa.y0 || nx > mapa.x1 || ny > mapa.y1) continue;
        const j = idx(nx, ny);
        if (dist[j] >= 0 || !(mapa.pasa ? mapa.pasa[j] : mapa.pisable(nx, ny))) continue;
        dist[j] = dist[i] + 1; if (prev) prev[j] = i; cola[b++] = j;
      }
    }
    return { dist, prev, idx, W };
  }
  const INF = 1e9;
  function planificar(o, tope = 700) {
    const mapa = construirMapa(o);
    const inicio = o.pos;
    const disp = mapa.vetas.filter(v => v.ok);
    // casillas desde las que se pica cada veta (al lado, sin diagonales)
    const obj = [];
    for (const v of disp) {
      const libreEn = p => (p.x === inicio.x && p.y === inicio.y) || mapa.pisable(p.x, p.y);
      let lados = V4.map(([dx, dy]) => ({ x: v.x + dx, y: v.y + dy })).filter(libreEn);
      // sin ningún lado libre, se prueba desde una esquina (si el juego no deja, se apunta como fallida)
      if (!lados.length) lados = [[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([dx, dy]) => ({ x: v.x + dx, y: v.y + dy })).filter(libreEn);
      if (lados.length) obj.push({ v, lados });
    }
    const nodos = [inicio];
    const deNodo = [];
    obj.forEach((ob, i) => { ob.ids = []; for (const l of ob.lados) { ob.ids.push(nodos.length); nodos.push(l); deNodo.push(i); } });
    const n = nodos.length;
    const D = new Float64Array(n * n).fill(INF);
    for (let a = 0; a < n; a++) {
      const r = bfs(mapa, nodos[a]);
      for (let b = 0; b < n; b++) {
        const i = r.idx(nodos[b].x, nodos[b].y);
        const d = i >= 0 && i < r.dist.length ? r.dist[i] : -1;
        if (d >= 0) D[a * n + b] = d;
      }
    }
    // solo las que se pueden alcanzar
    const alcanzables = obj.filter(ob => ob.ids.some(id => D[id] < INF));
    const sinCamino = disp.length - alcanzables.length;
    const orden = alcanzables.length <= (tope >= 700 ? 15 : 14) ? ordenExacto(alcanzables, D, n) : ordenHeuristico(alcanzables, D, n, tope);
    // camino completo
    const ruta = [{ ...inicio }], paradas = [];
    let desde = inicio;
    for (const { ob, id } of orden) {
      const hasta = nodos[id];
      const r = bfs(mapa, desde, true);
      const tramo = [];
      let i = r.idx(hasta.x, hasta.y);
      const s = r.idx(desde.x, desde.y);
      while (i !== s && i >= 0) { tramo.push({ x: i % r.W + mapa.x0, y: Math.floor(i / r.W) + mapa.y0 }); i = r.prev[i]; }
      tramo.reverse();
      ruta.push(...tramo);
      paradas.push({ idx: ruta.length - 1, v: ob.v });
      desde = hasta;
    }
    const pasos = ruta.length - 1;
    const picar = paradas.reduce((a, p) => a + (p.v.coste || 0), 0);
    const costesDesconocidos = paradas.filter(p => p.v.coste == null).length;
    return { ruta, paradas, pasos, picar, costesDesconocidos, sinCamino, total: mapa.vetas.length, disponibles: disp.length, mapa, cursor: 0, t: Date.now(), firma: firmaDe(mapa), agua: cfg.agua };
  }
  function planExplorar(o, relajado = false) {
    const mapa = construirMapa(o, relajado), m = mem();
    const r = bfs(mapa, o.pos, true);
    const W = r.W, H = mapa.y1 - mapa.y0 + 1;
    const vacio = { explorar: true, ruta: [{ ...o.pos }], paradas: [], mapa, cursor: 0, t: Date.now(), agua: cfg.agua, pasos: 0, total: 0, disponibles: 0, sinCamino: 0 };
    let mejor = -1, sinVer;
    if (o.fuente === 'datos' && planoMemo) {
      // Con el mapa entero: ir al sitio más cercano desde el que la ventana del juego (19×15, centrada en ti)
      // enseñe alguna casilla de suelo que aún no se ha visto (no hace falta pisarlo todo, basta verlo)
      const RX = o.vp ? Math.floor(o.vp.ancho / 2) : 9, RY = o.vp ? Math.floor(o.vp.alto / 2) : 7;
      const interes = (x, y) => { if (m.cod[K(x, y)] != null) return 0; const c = codPlano(x, y); return c != null && codInteresa(mapa, c) ? 1 : 0; };
      // sumas acumuladas para contar en un rectángulo al momento
      const P = new Int32Array((W + 1) * (H + 1));
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) P[(y + 1) * (W + 1) + x + 1] = interes(mapa.x0 + x, mapa.y0 + y) + P[y * (W + 1) + x + 1] + P[(y + 1) * (W + 1) + x] - P[y * (W + 1) + x];
      const cuenta = (cx, cy) => {
        const a = Math.max(0, cx - mapa.x0 - RX), b = Math.max(0, cy - mapa.y0 - RY), c = Math.min(W - 1, cx - mapa.x0 + RX), d = Math.min(H - 1, cy - mapa.y0 + RY);
        if (a > c || b > d) return 0;
        return P[(d + 1) * (W + 1) + c + 1] - P[b * (W + 1) + c + 1] - P[(d + 1) * (W + 1) + a] + P[b * (W + 1) + a];
      };
      let md = Infinity, mc = 0;
      for (let i = 0; i < r.dist.length; i++) {
        const d = r.dist[i];
        if (d < 1 || d > md) continue;
        const n = cuenta(i % W + mapa.x0, Math.floor(i / W) + mapa.y0);
        if (n && (d < md || n > mc)) { md = d; mc = n; mejor = i; }
      }
      sinVer = (x, y) => cuenta(x, y) > 0;
    } else {
      sinVer = (x, y) => V4.some(([dx, dy]) => (o.fuente === 'datos' ? m.cod[K(x + dx, y + dy)] == null : mapa.tipoEn(x + dx, y + dy) === 'desconocido'));
      let md = Infinity;
      for (let i = 0; i < r.dist.length; i++) {
        const d = r.dist[i];
        if (d < 1 || d >= md) continue;
        if (sinVer(i % W + mapa.x0, Math.floor(i / W) + mapa.y0)) { md = d; mejor = i; }
      }
    }
    if (mejor < 0) return vacio;
    const ruta = [];
    const s0 = r.idx(o.pos.x, o.pos.y);
    for (let i = mejor; i !== s0 && i >= 0; i = r.prev[i]) ruta.push({ x: i % W + mapa.x0, y: Math.floor(i / W) + mapa.y0 });
    ruta.push({ ...o.pos });
    ruta.reverse();
    const meta = ruta[ruta.length - 1];
    return { ...vacio, ruta, paradas: [{ idx: ruta.length - 1, meta }], pasos: ruta.length - 1, sinVer };
  }
  // Qué hay en lo que queda sin ver y qué cree el script de cada código (para el mensaje final y «Copiar datos»)
  function resumenCodigos() {
    const m = mem();
    if (!m || !m.cod) return [];
    const sinVer = {}, total = {};
    if (planoMemo) for (let y = 0; y < planoMemo.alto; y++) for (let x = 0; x < planoMemo.ancho; x++) {
      const c = planoMemo.tiles[y * planoMemo.ancho + x];
      total[c] = (total[c] || 0) + 1;
      if (m.cod[K(x, y)] == null) sinVer[c] = (sinVer[c] || 0) + 1;
    }
    const mapa = ultimaObs && ultimaObs.ok && ultimaObs.fuente === 'datos' ? construirMapaDatos(ultimaObs) : null;
    const tipo = c => { if (!mapa) return '?'; for (const k in m.cod) if (m.cod[k] == c) { const p = deK(k); return mapa.tipoEn(p.x, p.y); } return 'sin ver'; };
    return Object.keys(total).map(c => ({ cod: +c, total: total[c], sinVer: sinVer[c] || 0, cree: CODIGOS[c] || tipo(c), pisado: !!(m.pisables && m.pisables[c]), votos: m.votos && m.votos[c], noDejo: m.codMal && m.codMal[c] }));
  }
  function motivoSinVer() {
    const r = resumenCodigos().filter(x => x.sinVer && x.cree !== 'pared' && x.cree !== 'lava' && x.cree !== 'salida').sort((a, b) => b.sinVer - a.sinVer);
    return 'Sin ver: ' + r.slice(0, 6).map(x => `${x.sinVer} de código ${x.cod} (${x.cree})`).join(', ') + '. Si es suelo al que se puede llegar, pulsa «📋 Copiar datos» y pégamelo.';
  }
  // Un código «interesa» para explorar si puede ser suelo (donde hay vetas): no la roca, la lava ni las escaleras
  const codInteresa = (mapa, c) => { const tp = mapa && mapa.tipoDeCod ? mapa.tipoDeCod(c) : (c === 0 ? 'pared' : 'probar'); return tp !== 'pared' && tp !== 'lava' && tp !== 'salida'; };
  // Lo que queda por ver (del mapa entero) y a lo que no se llega
  function porVer() {
    if (!planoMemo) return null;
    const m = mem();
    let n = 0;
    const mapa = ultimaObs && ultimaObs.ok && ultimaObs.fuente === 'datos' ? construirMapaDatos(ultimaObs) : null;
    const si = {};
    for (let y = 0; y < planoMemo.alto; y++) for (let x = 0; x < planoMemo.ancho; x++) { const c = planoMemo.tiles[y * planoMemo.ancho + x]; if (m.cod[K(x, y)] != null) continue; if (!(c in si)) si[c] = codInteresa(mapa, c); if (si[c]) n++; }
    return n;
  }
  // Vetas que se saben disponibles (de los tipos elegidos) y no se van a picar, con el motivo
  function vetasSinPicar(o) {
    if (o.fuente !== 'datos') return [];
    const mapa = construirMapa(o);
    const r = bfs(mapa, o.pos);
    const llega = (x, y) => { const i = r.idx(x, y); return i >= 0 && i < r.dist.length && r.dist[i] >= 0; };
    const out = [];
    for (const v of mapa.todasVetas || []) {
      if (!v.existe || !v.deTipo) continue;
      const lados = [...V4, [1, 1], [1, -1], [-1, 1], [-1, -1]].map(([dx, dy]) => ({ x: v.x + dx, y: v.y + dy }));
      const alcanzable = lados.some(p => llega(p.x, p.y));
      if (fallidas.has(v.k)) out.push({ v, por: 'no se deja picar' });
      else if (!alcanzable) {
        const cerca = lados.map(p => mapa.tipoEn(p.x, p.y));
        out.push({ v, por: cerca.includes('agua') && !cfg.agua ? 'rodeada de agua (activa «Cruzar el agua»)' : cerca.includes('lava') ? 'entre lava' : 'sin camino hasta ella' });
      }
    }
    return out;
  }
  function planExplorarVale(p, o) {
    if (!p || !p.explorar || !p.paradas.length || p.agua !== cfg.agua) return false;
    const i = p.ruta.findIndex((c, j) => j >= p.cursor && c.x === o.pos.x && c.y === o.pos.y);
    if (i < 0) return false;
    p.cursor = i;
    const { meta } = p.paradas[0];
    // desde la meta aún se vería algo nuevo (si ya se ve todo, se busca la siguiente)
    return i < p.paradas[0].idx && p.sinVer(meta.x, meta.y);
  }
  function ordenExacto(obj, D, n) {
    const N = obj.length;
    if (!N) return [];
    const ids = obj.map(o => o.ids);
    const m = n;                                  // índice de nodo como columna
    const tam = (1 << N) * m;
    const dp = new Float64Array(tam).fill(INF), par = new Int32Array(tam).fill(-1);
    for (let i = 0; i < N; i++) for (const id of ids[i]) dp[(1 << i) * m + id] = D[id];
    const deQuien = new Int32Array(n).fill(-1);
    for (let i = 0; i < N; i++) for (const id of ids[i]) deQuien[id] = i;
    for (let mask = 1; mask < (1 << N); mask++) {
      for (let i = 0; i < N; i++) {
        if (!(mask & (1 << i))) continue;
        for (const a of ids[i]) {
          const base = dp[mask * m + a];
          if (base >= INF) continue;
          for (let j = 0; j < N; j++) {
            if (mask & (1 << j)) continue;
            const nm = mask | (1 << j);
            for (const b of ids[j]) {
              const nd = base + D[a * n + b];
              if (nd < dp[nm * m + b]) { dp[nm * m + b] = nd; par[nm * m + b] = a; }
            }
          }
        }
      }
    }
    // la mejor terminación que incluya todas las alcanzables
    const full = (1 << N) - 1;
    let mejor = INF, fin = -1;
    for (let i = 0; i < N; i++) for (const id of ids[i]) if (dp[full * m + id] < mejor) { mejor = dp[full * m + id]; fin = id; }
    if (fin < 0) return [];
    const out = [];
    let mask = full, id = fin;
    while (id >= 0) {
      const i = deQuien[id];
      out.push({ ob: obj[i], id });
      const p = par[mask * m + id];
      mask &= ~(1 << i);
      id = p;
    }
    return out.reverse();
  }
  function costeOrden(obj, orden, D, n, elegir = false) {
    // mejor casilla de cada veta para un orden dado (programación dinámica por capas)
    let prev = [{ id: 0, c: 0, desde: null }];
    const capas = [];
    for (const k of orden) {
      const cur = obj[k].ids.map(id => {
        let best = { c: INF, desde: null };
        for (const p of prev) { const c = p.c + D[p.id * n + id]; if (c < best.c) best = { c, desde: p }; }
        return { id, c: best.c, desde: best.desde };
      });
      capas.push(cur); prev = cur;
    }
    let fin = prev.reduce((a, b) => (b.c < a.c ? b : a), { c: INF });
    if (!elegir) return fin.c;
    const ids = [];
    for (let p = fin; p && p.desde; p = p.desde) ids.push(p.id);
    return ids.reverse();
  }
  function ordenHeuristico(obj, D, n, tope = 700) {
    // vecino más cercano
    const quedan = new Set(obj.map((_, i) => i)), orden = [];
    let actualId = 0;
    while (quedan.size) {
      let mejor = null, md = INF;
      for (const i of quedan) for (const id of obj[i].ids) if (D[actualId * n + id] < md) { md = D[actualId * n + id]; mejor = { i, id }; }
      if (!mejor) break;
      orden.push(mejor.i); quedan.delete(mejor.i); actualId = mejor.id;
    }
    // mejoras: dar la vuelta a tramos (2-opt) y mover tramos de 1 a 3; luego se sacude el orden y se vuelve a mejorar
    const t0 = performance.now();
    const mejorar = ord => {
      let c = costeOrden(obj, ord, D, n), mejora = true;
      while (mejora && performance.now() - t0 < tope) {
        mejora = false;
        for (let a = 0; a < ord.length - 1 && !mejora; a++) for (let b = a + 1; b < ord.length; b++) {
          const o2 = ord.slice(0, a).concat(ord.slice(a, b + 1).reverse(), ord.slice(b + 1));
          const c2 = costeOrden(obj, o2, D, n);
          if (c2 < c - 1e-9) { ord = o2; c = c2; mejora = true; break; }
        }
        for (let len = 1; len <= 3 && !mejora; len++) for (let a = 0; a + len <= ord.length && !mejora; a++) {
          const seg = ord.slice(a, a + len), resto = ord.slice(0, a).concat(ord.slice(a + len));
          for (let p = 0; p <= resto.length; p++) {
            if (p === a) continue;
            const o2 = resto.slice(0, p).concat(seg, resto.slice(p));
            const c2 = costeOrden(obj, o2, D, n);
            if (c2 < c - 1e-9) { ord = o2; c = c2; mejora = true; break; }
          }
        }
      }
      return { ord, c };
    };
    let mejor = mejorar(orden);
    while (orden.length >= 8 && performance.now() - t0 < tope) {
      // «doble puente»: se corta en cuatro trozos y se recolocan
      const L = mejor.ord.length, cortes = [1, 2, 3].map(() => 1 + Math.floor(Math.random() * (L - 1))).sort((x, y) => x - y);
      const [p1, p2, p3] = cortes, o = mejor.ord;
      const r = mejorar(o.slice(0, p1).concat(o.slice(p3), o.slice(p2, p3), o.slice(p1, p2)));
      if (r.c < mejor.c - 1e-9) mejor = r;
    }
    orden.splice(0, orden.length, ...mejor.ord);
    const ids = costeOrden(obj, orden, D, n, true);
    return orden.map((k, i) => ({ ob: obj[k], id: ids[i] }));
  }

  /* ------------------------------------------------------------------ *
   *  ENERGÍA
   * ------------------------------------------------------------------ */
  function energia() {
    const caja = $$('header [title]').find(e => /energ[ií]a/i.test(e.title));
    const sp = caja && $$('span', caja).find(s => /⚡/.test((s.parentElement || {}).textContent || '') && /^\s*\d+\s*\/\s*\d+\s*$/.test(s.textContent));
    const m = sp && sp.textContent.match(/(\d+)\s*\/\s*(\d+)/);
    return m ? { e: +m[1], max: +m[2] } : null;
  }
  function pasosParaCobro() {
    if (ultimaObs && ultimaObs.ok && Number.isInteger(ultimaObs.pasosHastaGasto) && ultimaObs.pasosHastaGasto > 0) return ultimaObs.pasosHastaGasto;
    const el = $$('main [title]').find(e => /andar cuesta/i.test(e.title));
    const m = el && el.textContent.match(/(\d+)\s*pasos?/i);
    return m ? +m[1] : null;
  }
  // energía que cuesta andar N pasos si faltan r pasos para el siguiente cobro (1 cada 5)
  const pasosPorPunto = () => (ultimaObs && ultimaObs.ok && Number.isInteger(ultimaObs.pasosPorEnergia) && ultimaObs.pasosPorEnergia > 0) ? ultimaObs.pasosPorEnergia : 5;
  const cobroAndar = (N, r, per = pasosPorPunto()) => { r = r || per; return N < r ? 0 : 1 + Math.floor((N - r) / per); };

  /* ------------------------------------------------------------------ *
   *  MOVERSE Y PICAR (con los mismos controles que tú: flechas, clic en el mapa y clic en la veta)
   * ------------------------------------------------------------------ */
  const TECLAS = { '1,0': ['ArrowRight', 39], '-1,0': ['ArrowLeft', 37], '0,1': ['ArrowDown', 40], '0,-1': ['ArrowUp', 38] };
  function tecla(t, dx, dy) {
    const [key, kc] = TECLAS[dx + ',' + dy];
    try { if (document.activeElement && document.activeElement.closest && document.activeElement.closest('#' + PANEL_ID)) document.activeElement.blur(); } catch { /* nada */ }
    for (const tipo of ['keydown', 'keyup']) t.capa.dispatchEvent(new KeyboardEvent(tipo, { key, code: key, keyCode: kc, which: kc, bubbles: true, cancelable: true }));
  }
  let modoClic = 'clic';                          // 'clic' · 'puntero' · 'recto' (solo en línea) · 'no'
  let fallosClic = 0, movOk = 0, pasoConClic = false;
  const intentosPaso = {};
  function clicCasilla(t, c, f) {
    const r = t.capa.getBoundingClientRect();
    const x = r.left + (c + 0.5) * t.ts, y = r.top + (f + 0.5) * t.ts;
    const o = { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, view: window };
    if (modoClic === 'puntero') {
      t.capa.dispatchEvent(new PointerEvent('pointerdown', { ...o, buttons: 1, pointerId: 1, pointerType: 'mouse', isPrimary: true }));
      t.capa.dispatchEvent(new PointerEvent('pointerup', { ...o, buttons: 0, pointerId: 1, pointerType: 'mouse', isPrimary: true }));
    } else t.capa.dispatchEvent(new MouseEvent('click', o));
  }
  // para clicar varias casillas de golpe, todas tienen que ser conocidas (las de código por probar se prueban de una en una)
  const esSeguro = (mapa, x, y) => mapa.pisable(x, y) && (!mapa.tipoEn || mapa.tipoEn(x, y) !== 'probar');
  function puedeClicar(o, mapa, desde, hasta) {
    if (modoClic === 'no') return false;
    const dx = hasta.x - desde.x, dy = hasta.y - desde.y;
    if (modoClic === 'recto' && dx && dy) return false;
    const c = hasta.x - o.cam.x, f = hasta.y - o.cam.y;
    if (c < 0 || f < 0 || c >= o.t.cols || f >= o.t.rows) return false;
    // todo el rectángulo libre: cualquier camino corto que elija el juego pasa por casillas seguras
    for (let y = Math.min(desde.y, hasta.y); y <= Math.max(desde.y, hasta.y); y++)
      for (let x = Math.min(desde.x, hasta.x); x <= Math.max(desde.x, hasta.x); x++)
        if (!(x === desde.x && y === desde.y) && !esSeguro(mapa, x, y)) return false;
    return true;
  }
  // espera a que cambies de casilla (o a que pase el tiempo) y devuelve la observación nueva
  // «Quieto»: con los datos del juego basta con que la posición y la ventana no cambien entre dos lecturas;
  // sin ellos, que el dibujo no cambie
  const huellaObs = o => !o || !o.ok ? 'x' : o.fuente === 'datos' ? [o.pos.x, o.pos.y, o.vp.xBase, o.vp.yBase].join(',') : String(o.hash);
  async function esperarMovimiento(antes, ms = 2500) {
    const t0 = Date.now();
    let o = null;
    while (Date.now() - t0 < ms && corriendo) {
      await sleep(o && o.fuente === 'datos' ? 90 : 140);
      o = await observar();
      if (o.ok && (o.pos.x !== antes.x || o.pos.y !== antes.y)) {
        // que termine de andar antes de seguir
        let h = huellaObs(o);
        for (let i = 0; i < 12; i++) { await sleep(o.fuente === 'datos' ? 90 : 110); const o2 = await observar(); if (!o2.ok) { if (o2.moviendo) continue; break; } o = o2; const h2 = huellaObs(o2); if (h2 === h) break; h = h2; }
        return o;
      }
    }
    return o;
  }
  async function esperarQuieto(maxMs = 1500) {
    let o = await observar(), h = huellaObs(o);
    const t0 = Date.now();
    while (Date.now() - t0 < maxMs) { await sleep(o && o.fuente === 'datos' ? 80 : 120); const o2 = await observar(); o = o2; const h2 = huellaObs(o2); if (h2 === h) break; h = h2; }
    return o;
  }

  // Ventanas que salen al picar
  const RE_SEGUIR = /picar|golpe|excavar|extraer|romper|confirmar|^s[ií]\b/i;
  const RE_CERRAR = /\b(aceptar|seguir|cerrar|vale|ok|genial|recoger|guardar|continuar|listo)\b|^[✕×]$/i;
  const ventanas = () => $$('[role="dialog"], [aria-modal="true"], div.fixed.inset-0')
    .filter(e => !e.closest('[data-ax-ignore]') && !e.closest('#k-avisos') && (e.offsetParent || e.getClientRects().length) && e.querySelector('button'));
  let htmlDesconocido = '';
  async function atenderVentana(antes) {
    const nuevas = ventanas().filter(v => !antes.has(v));
    if (!nuevas.length) return 'nada';
    const v = nuevas[nuevas.length - 1];
    const bts = $$('button', v).filter(b => !b.disabled);
    const b = bts.find(x => RE_SEGUIR.test((x.textContent || '').trim())) || bts.find(x => RE_CERRAR.test((x.textContent || '').trim() || x.getAttribute('aria-label') || ''));
    if (!b) { htmlDesconocido = v.outerHTML; return 'desconocida'; }
    b.click();
    await pausa(350, 600);
    return 'ok';
  }
  // Botones que salen al picar, estén donde estén (ventana, hoja de abajo o dentro de la página)
  const botonesVisibles = () => $$('button').filter(b => !b.closest('[data-ax-ignore]') && !b.closest('#k-avisos') && (b.offsetParent || b.getClientRects().length));
  const textoBoton = b => ((b.textContent || '').replace(/\s+/g, ' ').trim() || b.getAttribute('aria-label') || b.title || '');
  async function atenderBotonesNuevos(antes, pulsados) {
    const nuevos = botonesVisibles().filter(b => !antes.has(b) && !b.disabled && !b.closest('[aria-live]'));
    if (!nuevos.length) return 'nada';
    const b = nuevos.find(x => RE_SEGUIR.test(textoBoton(x)) && (pulsados.get(x) || 0) < 10)
      || nuevos.find(x => RE_CERRAR.test(textoBoton(x)) && !pulsados.has(x));
    if (!b) {
      if (nuevos.every(x => pulsados.has(x))) return 'nada';
      const caja = nuevos[0].closest('[role="dialog"], [aria-modal="true"], .fixed, section, main') || nuevos[0].parentElement;
      htmlDesconocido = caja.outerHTML;
      return 'desconocida';
    }
    pulsados.set(b, (pulsados.get(b) || 0) + 1);
    b.click();
    await pausa(300, 550);
    return 'ok';
  }
  function elementoVeta(o, v) {
    const c = o.cosas.find(x => (x.tipo === 'veta' || x.tipo === 'ball') && x.x === v.x && x.y === v.y)
      // con los datos del juego se sabe que ahí hay algo que picar (p. ej. una Poké Ball con otro dibujo): vale lo que haya encima
      || (o.fuente === 'datos' ? o.cosas.find(x => x.x === v.x && x.y === v.y && x.tipo !== 'puerta' && x.tipo !== 'losa') : null);
    if (c) return c;
    // y si no hay nada encima (lo dibuja el propio mapa), se hace clic en su casilla
    if (o.fuente === 'datos' && o.enVista(v.x, v.y)) return { el: null, casilla: true, vacia: false, titulo: '' };
    return null;
  }
  // Lo que sale en pantalla mientras se pica (para apuntar qué ha dado la veta)
  const RE_BOTIN = /has (recogido|conseguido|obtenido|encontrado)|te llevas|sacas/i;
  function escucharBotin() {
    const vistos = [];
    const obs = new MutationObserver(muts => {
      for (const m of muts) for (const n of m.addedNodes) {
        if (n.nodeType !== 1 || n.closest('[data-ax-ignore]') || n.closest('#k-avisos')) continue;
        const s = (n.textContent || '').replace(/\s+/g, ' ').trim();
        if (s && s.length < 160 && /esfera|f[oó]sil|piedra|placa|pok[eé] ball|poci[oó]n|ficha|\$|has (conseguido|obtenido|encontrado)|sacas|te llevas/i.test(s)) vistos.push(s);
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
    const fin = () => { obs.disconnect(); return [...new Set(vistos)]; };
    fin.hay = () => vistos.some(v => RE_BOTIN.test(v));
    return fin;
  }
  const fallidas = new Set(), intentosPicar = new Map();
  let picadas = 0, botinSesion = [];
  // ¿Sigue la veta por picar según los datos del juego? (null si no hay datos o no está en la ventana)
  const activaEnDatos = (ob, v) => {
    if (!ob || !ob.ok || !ob.vp) return null;
    const n = lista(ob.vp.nodosVisibles).find(x => x && x.x === v.x && x.y === v.y);
    return n ? n.activo !== false : null;
  };
  async function picar(o, v) {
    const m = mem();
    const e0 = energia();
    const antes = new Set(botonesVisibles()), pulsados = new Map();
    const fin = escucharBotin();
    let hecho = false;
    try {
      for (let intento = 0; intento < 3 && corriendo && !hecho; intento++) {
        const ob = await esperarQuieto(600);
        let cosa = ob.ok ? elementoVeta(ob, v) : null;
        const act = activaEnDatos(ob, v);
        if (act === true && (!cosa || cosa.vacia)) cosa = { el: cosa && cosa.el, vacia: false, titulo: '' };   // los datos mandan
        if (act === false || !cosa || cosa.vacia) { hecho = intento > 0 || act === false; if (!hecho) { const mv = m.vetas[v.k] || (m.vetas[v.k] = {}); mv.vacia = Date.now(); } break; }
        if (intento === 0) await respiro('antesPicar');
        if (intento === 0) log(`⛏️ Pico ${v.tipoId ? emojiTipo(v.tipoId) + ' ' + nombreTipo(v.tipoId) : cosa.titulo && !/acércate/i.test(cosa.titulo) ? cosa.titulo : 'la veta'} (${v.x},${v.y})…`);
        if (cosa.el) cosa.el.click(); else clicCasilla(ob.t, v.x - ob.cam.x, v.y - ob.cam.y);
        const t0 = Date.now();
        while (Date.now() - t0 < 6000 && corriendo) {
          await sleep(200);
          const r = await atenderBotonesNuevos(antes, pulsados);
          if (r === 'desconocida') { parar('Al picar ha salido algo que no conozco: lo dejo para ti. Pulsa «📋 Copiar datos» y pégamelo.', 'aviso'); return false; }
          if (r === 'ok') continue;
          if (fin.hay()) { hecho = true; break; }
          const o2 = await observar();
          const act2 = activaEnDatos(o2, v);
          if (act2 === false) { hecho = true; break; }
          if (act2 === null) {                       // sin datos del juego: por el dibujo
            const c2 = o2.ok ? elementoVeta(o2, v) : null;
            if (!c2 || c2.vacia) { hecho = true; break; }
          }
          const e1 = energia();
          if (e0 && e1 && e1.e < e0.e && Date.now() - t0 > 1500) { hecho = true; break; }
        }
      }
    } finally {
      const botin = fin();
      if (hecho) {
        const mv = m.vetas[v.k] || (m.vetas[v.k] = {});
        mv.picada = Date.now(); mv.vacia = Date.now();
        picadas++;
        const e1 = energia();
        const gasto = e0 && e1 ? e0.e - e1.e : null;
        if (v.tipoId && gasto > 0 && m.costes) m.costes[v.tipoId] = gasto;
        log(`✅ ${v.tipoId ? emojiTipo(v.tipoId) + ' ' + nombreTipo(v.tipoId) : 'Veta'} picada${gasto != null && gasto > 0 ? ` (−${gasto} ⚡)` : ''}${botin.length ? ': ' + botin.slice(0, 2).join(' · ') : ''}`);
        botinSesion.push(...botin);
        guardarMem();
      }
    }
    if (!hecho) {
      const n = (intentosPicar.get(v.k) || 0) + 1;
      intentosPicar.set(v.k, n);
      if (n >= 2) { fallidas.add(v.k); log(`⚠️ No he podido picar ${v.tipoId ? emojiTipo(v.tipoId) + ' ' + nombreTipo(v.tipoId) : 'la veta'} (${v.x},${v.y}) dos veces; la dejo para el final.`); }
      else log(`⚠️ No he podido picar la veta (${v.x},${v.y}); lo vuelvo a intentar luego.`);
    }
    return hecho;
  }

  /* ------------------------------------------------------------------ *
   *  EL RECORRIDO
   * ------------------------------------------------------------------ */
  let corriendo = false, plan = null, ultimoError = '';
  // Resumen para el robot de Diarias (y cualquiera que lo quiera leer): cuántas vetas del mapa están picadas (y así
  // vacías, doce horas) sobre cuántas conoces, y cuándo vuelve a llenarse la primera
  function resumenVetas() {
    try {
      const m = mem(); if (!m) return null;
      const ahora = Date.now(), nodos = m.nodos || {};
      let total = 0, picadas = 0, proxima = 0;
      for (const [k, n] of Object.entries(nodos)) {
        total++;
        const mv = (m.vetas || {})[k];
        if (mv && mv.picada && mv.picada >= (n.visto || 0) - 5000 && ahora - mv.picada < H12) { picadas++; const vuelve = mv.picada + H12; if (!proxima || vuelve < proxima) proxima = vuelve; }
      }
      const r = { total, picadas, proxima, t: ahora };
      lsPon('axsub-resumen', r);
      return r;
    } catch { return null; }
  }
  let resumenT = 0;
  function parar(motivo, tipo = 'info') {
    corriendo = false;
    resumenVetas();
    lsPon('axsub-fin', { t: Date.now(), motivo: motivo || '', picadas });
    if (motivo) { log((tipo === 'aviso' || tipo === 'error' ? '⚠️ ' : '') + motivo); kAviso({ tipo, app: 'Grutas', icono: '⛏️', titulo: motivo.length < 60 ? motivo : 'Grutas: me he parado', texto: motivo.length < 60 ? '' : motivo }); }
    pintar();
  }
  const firmaDe = mapa => mapa.vetas.filter(v => v.ok).map(v => v.k).sort().join('|');
  function planVale(p, o) {
    if (!p || Date.now() - p.t > 120000 || p.agua !== cfg.agua) return false;
    if (o.fuente === 'datos') {
      // con los datos del juego: vale mientras sigas en el camino y las vetas buscadas sean las mismas
      const i = p.ruta.findIndex((c, j) => j >= p.cursor && c.x === o.pos.x && c.y === o.pos.y);
      if (i < 0 || firmaDe(construirMapaDatos(o)) !== p.firma) return false;
      p.cursor = i;
      return !!p.paradas.find(x => x.idx >= i);
    }
    const i = p.ruta.findIndex((c, j) => j >= p.cursor && c.x === o.pos.x && c.y === o.pos.y);
    if (i < 0) return false;
    p.cursor = i;
    const sig = p.paradas.find(x => x.idx >= i);
    if (!sig) return false;
    const mv = mem().vetas[sig.v.k];
    if (o.enVista(sig.v.x, sig.v.y) && (!mv || mv.vacia)) return false;
    return true;
  }
  let modo = 'picar';
  const anunciadas = new Set();
  async function recorrer(nuevoModo = 'picar') {
    if (corriendo) { parar('Parado.'); return; }
    modo = nuevoModo; plan = null;
    corriendo = true; picadas = 0; botinSesion = []; fallidas.clear(); intentosPicar.clear(); anunciadas.clear(); htmlDesconocido = '';
    { const m = mem(); if (m) m.sinPaso = {}; for (const k in intentosPaso) delete intentosPaso[k]; }
    kPedirPermiso();
    pintar();
    if (marco === 'datos' && !(await leerPlano()) && !planoMemo) log('ℹ️ No he podido leer el mapa entero («Ver mapa»): sigo con lo que voy viendo.');
    log(modo === 'explorar' ? '🧭 Exploro lo que falta del mapa y pico cada veta que vea.' : '▶ Empiezo: camino más corto por todas las vetas.');
    let fallosSeguidos = 0, esperasMov = 0, pasosExplorando = 0, reintentos = 0, reintentoFallidas = false;
    try {
      while (corriendo) {
        if (!enGrutas() || !tablero()) { parar('Has salido de las grutas.'); break; }
        if (ventanas().length && (await atenderVentana(new Set())) === 'desconocida') { parar('Hay una ventana abierta que no conozco. Ciérrala tú (o pulsa «📋 Copiar datos» y pégamelo).', 'aviso'); break; }
        const o = await esperarQuieto(900);
        if (o.ok) esperasMov = 0;
        if (!o.ok && o.moviendo && ++esperasMov < 60) { await sleep(200); continue; }
        if (!o.ok) { ultimoError = o.error; if (++fallosSeguidos > 8) { parar(o.error, 'error'); break; } await sleep(500); continue; }
        if (modo === 'explorar') {
          // Explorar y picar: si hay vetas por picar (de los tipos elegidos) se va a por ellas en el mejor orden;
          // si no, al sitio más cercano desde el que se vea algo nuevo. Si aparece una veta nueva, se cambia de plan
          const firmaV = o.fuente === 'datos' ? firmaDe(construirMapaDatos(o)) : '';
          const vale = plan && (plan.explorar ? planExplorarVale(plan, o) : planVale(plan, o)) && plan.firmaV === firmaV && !(plan.relajado && Object.keys(mem().sinPaso).length);
          if (!vale) {
            const pp = firmaV ? planificar(o, 400) : null;
            plan = pp && pp.paradas.length ? pp : planExplorar(o);
            plan.firmaV = firmaV;
            if (!plan.explorar) for (const pa of plan.paradas) if (!anunciadas.has(pa.v.k)) { anunciadas.add(pa.v.k); log(`👀 ${pa.v.tipoId ? emojiTipo(pa.v.tipoId) + ' ' + nombreTipo(pa.v.tipoId) : 'Veta'} a la vista (${pa.v.x},${pa.v.y}): voy a picarla.`); }
            pintar();
          }
          if (plan.explorar && !plan.paradas.length && porVer() && reintentos < 6) {
            const pr = planExplorar(o, true);
            if (pr.paradas.length) {
              reintentos++;
              const m = mem(); m.sinPaso = {};
              log(`🔁 Quedan ${porVer()} casillas sin ver: vuelvo a probar por donde antes no me dejó pasar.`);
              plan = pr; plan.firmaV = firmaV; plan.relajado = true;
              pintar();
            }
          }
          if (plan.explorar && !plan.paradas.length && fallidas.size && !reintentoFallidas) {
            reintentoFallidas = true;
            log(`🔁 Vuelvo a por ${fallidas.size} veta(s) que no pude picar antes.`);
            fallidas.clear(); plan = null; continue;
          }
          if (plan.explorar && !plan.paradas.length) {
            const m = mem(), nv = Object.keys(m.nodos || {}).length;
            const pv = porVer(o);
            if (pv) log('ℹ️ ' + motivoSinVer());
            const quedan = vetasSinPicar(o);
            if (quedan.length) log(`ℹ️ Quedan ${quedan.length} veta(s) sin picar: ` + quedan.slice(0, 8).map(q => `${emojiTipo(q.v.tipoId || '')} ${nombreTipo(q.v.tipoId || 'veta')} (${q.v.x},${q.v.y}): ${q.por}`).join(' · '));
            parar(`🗺️ Ya he visto todo lo que se puede alcanzar y he picado lo que había (${picadas} veta(s); ${nv} apuntadas${pv ? `; ${pv} casillas no se alcanzan: agua sin cruzar, lava, losas o zonas cerradas` : ''}). Cuando se vuelvan a llenar, «Picarlas todas» hace el camino óptimo por todas.`, 'fin');
            break;
          }
          const en = energia();
          if (en && en.e <= 0 && pasosParaCobro() <= 1) { parar('Sin energía para seguir explorando. Lo que he visto queda apuntado.', 'energia'); break; }
          if (++pasosExplorando % 25 === 0) { const m = mem(); log(`🧭 Conozco ${Object.keys(m.cod || m.celdas || {}).length} casillas y ${Object.keys(m.nodos || {}).length} veta(s).`); }
        } else if (!planVale(plan, o) || plan.rapido) { plan = planificar(o); pintar(); }
        const sig = plan.paradas.find(x => x.idx >= plan.cursor);
        if (!sig && modo === 'explorar') { plan = null; continue; }
        const explorando = !!plan.explorar;
        if (!sig) {
          const partes = [];
          if (plan.sinCamino) partes.push(`No llego a ${plan.sinCamino} veta(s): el camino pasaría por escaleras, la Sima, puertas, otras vetas o zonas que aún no he visto.`);
          if (o.fuente === 'datos' && planExplorar(o).paradas.length) partes.push('Queda mapa sin ver: puede haber más vetas. «🧭 Explorar y picar» lo recorre y pica las que encuentre.');
          if (o.fuente === 'propio') partes.push('Solo conozco las vetas que ya he visto: si hay zonas del mapa sin ver, puede haber más.');
          parar(`🏁 Hecho: ${picadas} veta(s) picada(s).${partes.length ? ' ' + partes.join(' ') : ''}`, 'fin');
          break;
        }
        // ¿llega la energía para este tramo y su veta?
        if (!explorando && (plan.cursor === 0 || plan.paradas.some(x => x.idx === plan.cursor))) {
          const en = energia(), N = sig.idx - plan.cursor;
          const hace = cobroAndar(N, pasosParaCobro()) + (sig.v.coste || 0);
          if (en && en.e < hace) { parar(`Sin energía: la siguiente veta pide ${hace} ⚡ (andar ${N} pasos + picar) y tienes ${en.e}. Vuelve cuando tengas más y sigo donde lo dejé.`, 'energia'); break; }
        }
        if (plan.cursor === sig.idx && explorando) { plan = null; continue; }
        if (plan.cursor === sig.idx) {
          await picar(o, sig.v);
          if (!corriendo) break;
          plan = null;
          fallosSeguidos = 0;
          await respiro('trasPicar');
          continue;
        }
        // siguiente trozo del camino: un clic (hasta 3 casillas) si es seguro; si no, una flecha
        const desde = plan.ruta[plan.cursor];
        let salto = 1;
        const maxSalto = cfg.ritmo === 'rapido' || modo === 'explorar' ? 3 : [1, 2, 3, 3, 3][Math.floor(Math.random() * 5)];
        for (let j = Math.min(maxSalto, sig.idx - plan.cursor); j >= 2; j--) {
          const h = plan.ruta[plan.cursor + j];
          if (Math.abs(h.x - desde.x) + Math.abs(h.y - desde.y) === j && puedeClicar(o, plan.mapa, desde, h)) { salto = j; break; }
        }
        const meta = plan.ruta[plan.cursor + salto];
        const e0 = energia();
        const conClic = salto > 1 || pasoConClic;
        if (conClic) clicCasilla(o.t, meta.x - o.cam.x, meta.y - o.cam.y);
        else tecla(o.t, meta.x - desde.x, meta.y - desde.y);
        prediccion = { x: o.cam.x + (meta.x - desde.x), y: o.cam.y + (meta.y - desde.y) };
        let o2 = await esperarMovimiento(o.pos);
        if (!corriendo) break;
        const movido = x => x && x.ok && (x.pos.x !== o.pos.x || x.pos.y !== o.pos.y);
        // las flechas aún no han funcionado nunca: se prueba con un clic en la casilla de al lado
        let probadoClic = false;
        if (!movido(o2) && !conClic && modoClic !== 'no') {
          probadoClic = true;
          clicCasilla(o.t, meta.x - o.cam.x, meta.y - o.cam.y);
          o2 = await esperarMovimiento(o.pos);
          if (movido(o2)) { pasoConClic = true; log('ℹ️ Las flechas no me funcionan aquí: ando con clics.'); }
        }
        if (movido(o2)) { movOk++; fallosSeguidos = 0; if (salto > 1) fallosClic = 0; await respiro('paso'); continue; }
        // no se ha movido
        const e1 = energia();
        if (e1 && e1.e === 0 && e0 && e0.e === 0) { parar('Te has quedado sin energía para andar.', 'energia'); break; }
        const tipoMeta = plan && plan.mapa && plan.mapa.tipoEn ? plan.mapa.tipoEn(meta.x, meta.y) : '';
        if (!movOk && salto === 1 && tipoMeta !== 'probar') { parar('No consigo moverme: ni con las flechas ni con clics. Pulsa «📋 Copiar datos» y pégamelo.', 'error'); break; }
        if (salto > 1) {
          const o3 = await esperarMovimiento(o.pos, 4000);
          if (movido(o3)) { movOk++; fallosSeguidos = 0; continue; }
          fallosClic++;
          if (fallosClic >= 2) { modoClic = modoClic === 'clic' ? 'puntero' : modoClic === 'puntero' ? 'recto' : 'no'; fallosClic = 0; log(`ℹ️ El clic en el mapa no mueve así: pruebo ${modoClic === 'no' ? 'solo con flechas' : modoClic === 'recto' ? 'clics en línea recta' : 'otro tipo de clic'}.`); }
        } else {
          // quizá el servidor va lento: se espera a que llegue el paso antes de mandar nada más (si ya se ha probado
          // también con clic, esa espera ya ha pasado)
          const o3 = probadoClic ? o2 : await esperarMovimiento(o.pos, 4000);
          if (movido(o3)) { movOk++; fallosSeguidos = 0; continue; }
          const kk = K(meta.x, meta.y);
          intentosPaso[kk] = (intentosPaso[kk] || 0) + 1;
          if (intentosPaso[kk] < (probadoClic ? 1 : 2)) { fallosSeguidos++; continue; }
          mem().sinPaso[kk] = Date.now();
          const cm = plan && plan.mapa && plan.mapa.codEn ? plan.mapa.codEn(meta.x, meta.y) : null;
          if (cm != null && !CODIGOS[cm]) {
            const m = mem(); m.codMal = m.codMal || {};
            const l = Array.isArray(m.codMal[cm]) ? m.codMal[cm] : (m.codMal[cm] = []);
            if (!l.includes(kk) && l.length < 10) l.push(kk);
          }
          guardarMem();
          log(`ℹ️ No se puede pasar por (${meta.x},${meta.y}): busco otro camino.`);
          plan = null;
        }
        if (++fallosSeguidos > 8) { parar('No consigo moverme. ¿Funcionan las flechas del teclado aquí?', 'error'); break; }
      }
    } catch (e) {
      console.error('[axsub]', e);
      parar('Error: ' + (e && e.message || e), 'error');
    } finally {
      corriendo = false;
      if (modo === 'explorar') plan = null;
      pintar();
    }
  }

  /* ------------------------------------------------------------------ *
   *  DIBUJO DEL CAMINO ENCIMA DEL MAPA
   * ------------------------------------------------------------------ */
  function dibujar(o) {
    let ov = document.getElementById(DIBUJO_ID);
    if (!cfg.dibujar || !o || !o.ok || !plan) { if (ov) ov.remove(); return; }
    const t = o.t;
    if (!ov || ov.parentElement !== t.caja) {
      if (ov) ov.remove();
      ov = document.createElement('div');
      ov.id = DIBUJO_ID;
      ov.setAttribute('data-ax-ignore', '1');
      ov.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:25';
      t.caja.appendChild(ov);
    }
    const S = t.ts, cx = x => (x - o.cam.x + 0.5) * S, cy = y => (y - o.cam.y + 0.5) * S;
    const tramo = plan.ruta.slice(plan.cursor);
    const pts = tramo.map(p => cx(p.x).toFixed(0) + ',' + cy(p.y).toFixed(0)).join(' ');
    let html = `<svg width="${t.cols * S}" height="${t.rows * S}" style="position:absolute;left:0;top:0;overflow:visible">`;
    if (tramo.length > 1) html += `<polyline points="${pts}" fill="none" stroke="rgba(0,0,0,.55)" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/><polyline points="${pts}" fill="none" stroke="#FFD640" stroke-width="3.5" stroke-dasharray="7 5" stroke-linejoin="round" stroke-linecap="round"/>`;
    let n = 0;
    for (const p of plan.paradas) {
      if (p.idx < plan.cursor || !p.v) continue;
      n++;
      html += `<g transform="translate(${cx(p.v.x)},${cy(p.v.y)})"><circle r="15" fill="none" stroke="#FF4D4D" stroke-width="3"/><circle cx="11" cy="-11" r="8" fill="#FF4D4D"/><text x="11" y="-7.5" font-size="10" font-weight="800" fill="#fff" text-anchor="middle" font-family="system-ui">${n}</text></g>`;
    }
    html += '</svg>';
    if (ov.dataset.h !== html) { ov.innerHTML = html; ov.dataset.h = html; }
  }

  /* ------------------------------------------------------------------ *
   *  DATOS PARA ARREGLARLO (se copian al portapapeles)
   * ------------------------------------------------------------------ */
  function forma(v, prof = 0) {
    if (v == null) return v;
    if (typeof v === 'function') return 'ƒ';
    if (typeof v !== 'object') return typeof v === 'string' && v.length > 60 ? v.slice(0, 60) + '…' : v;
    if (Array.isArray(v)) return prof > 1 ? `[${v.length}]` : [`[${v.length}]`, ...v.slice(0, 2).map(x => forma(x, prof + 1))];
    if (prof > 1) return '{' + Object.keys(v).slice(0, 12).join(',') + '}';
    const o = {};
    for (const k of Object.keys(v).slice(0, 25)) { try { o[k] = forma(v[k], prof + 1); } catch { o[k] = '!'; } }
    return o;
  }
  // Repaso de todos los componentes de la página: rejillas grandes y listas con posiciones, estén donde estén
  function repasoArbol(t) {
    let raiz = actual(fibraDe(t.cv));
    while (raiz && raiz.return) raiz = raiz.return;
    const res = { rejillas: [], listas: [], posiciones: [], funciones: new Set(), fibras: [], ventanas: [] }, visto = new Set();
    const pila = raiz ? [raiz] : [];
    let n = 0;
    const t0 = performance.now();
    while (pila.length && n < 20000 && performance.now() - t0 < 1500) {
      const f = pila.pop(); n++;
      if (typeof f.type !== 'string') for (const [dónde, v] of valoresFibra(f)) escanear(v, nombreFibra(f) + '.' + dónde, visto, res, 1);
      if (f.sibling) pila.push(f.sibling);
      if (f.child) pila.push(f.child);
    }
    return {
      fibras: n,
      rejillas: res.rejillas.filter(g => g.w * g.h > 300).slice(0, 5).map(g => ({ ruta: g.ruta, w: g.w, h: g.h })),
      ventanas: res.ventanas.map(w => ({ ruta: w.ruta, xBase: w.v.xBase, yBase: w.v.yBase, ancho: w.v.ancho, alto: w.v.alto })),
      listas: res.listas.filter(l => l.items.length >= 3).slice(0, 15).map(l => ({ ruta: l.ruta, n: l.items.length, muestra: l.items.slice(0, 2).map(x => forma(x)) })),
    };
  }
  async function copiarDatos() {
    const t = tablero();
    const out = { script: 'Grutas ' + VERSION, url: location.pathname, hora: new Date().toISOString(), energia: energia(), pasosParaCobro: pasosParaCobro(), ultimoError, modoClic };
    if (t) {
      out.tablero = { canvas: [t.cv.width, t.cv.height], escala: t.escala, casilla: t.ts, casillaDibujo: t.tc, cols: t.cols, rows: t.rows };
      const { cosas, yo } = leerCosas(t);
      out.yo = yo;
      out.cosas = cosas.map(c => ({ tipo: c.tipo, titulo: c.titulo, c: c.c, f: c.f, w: c.w, h: c.h, vacia: c.vacia }));
      await cargarRefs(t.tc);
      const v = leerVista(t);
      if (v.tipos) { out.vista = v.tipos.map(f => f.map(x => LETRA[x] || '?').join('')); out.difs = v.difs.map(f => f.join(' ')); }
      out.refs = refs && refs.map(r => r.tipo);
      const d = datosPagina(t, true);
      out.fibras = d.fibras.slice(0, 14).map(f => ({ nivel: f.nivel, nombre: f.nombre, vals: f.vals.map(([k, v]) => [k, forma(v)]) }));
      out.rejillas = d.rejillas.slice(0, 3).map(g => ({ ruta: g.ruta, w: g.w, h: g.h, filas: Array.from({ length: Math.min(g.h, 150) }, (_, y) => Array.from({ length: Math.min(g.w, 150) }, (_, x) => { const c = String(g.get(x, y)); return c.length === 1 ? c : '[' + c + ']'; }).join('')) }));
      out.listas = d.listas.slice(0, 12).map(l => ({ ruta: l.ruta, n: l.items.length, muestra: l.items.slice(0, 3).map(x => forma(x)) }));
      out.posiciones = d.posiciones.slice(0, 20);
      out.funciones = [...d.funciones].slice(0, 40);
    }
    const o = ultimaObs;
    if (o && o.ok) out.encaje = { fuente: o.fuente, cam: o.cam, pos: o.pos, marco };
    if (o && o.ok && o.vp) {
      const vp = o.vp, hist = {};
      for (const c of vp.tiles) hist[c] = (hist[c] || 0) + 1;
      out.ventana = { ruta: o.datos.ventana.ruta, xBase: vp.xBase, yBase: vp.yBase, ancho: vp.ancho, alto: vp.alto, codigos: hist, claves: Object.keys(vp),
        nodos: lista(vp.nodosVisibles).slice(0, 30), salidas: lista(vp.salidasVisibles).slice(0, 10), sima: vp.simaVisible, jugadores: lista(vp.jugadoresCerca).slice(0, 5).map(x => forma(x)) };
    }
    if (t) out.arbol = repasoArbol(t);
    if (plan) out.plan = { pasos: plan.pasos, vetas: plan.paradas.map(p => [p.v.x, p.v.y, p.v.coste]), disponibles: plan.disponibles, total: plan.total, sinCamino: plan.sinCamino, chars: [...plan.mapa.charTipo] };
    const m = mem();
    out.codigos = resumenCodigos();
    try { if (ultimaObs && ultimaObs.ok) out.sinPicar = vetasSinPicar(ultimaObs).map(q => ({ x: q.v.x, y: q.v.y, tipo: q.v.tipoId, por: q.por })); } catch { /* nada */ }
    if (m) out.memoria = { celdas: Object.keys(m.celdas || {}).length, cod: Object.keys(m.cod || {}).length, nodos: m.nodos, pisables: m.pisables, codMal: m.codMal, votos: m.votos, costes: m.costes, vetas: m.vetas, objs: Object.keys(m.objs || {}).length, sinPaso: m.sinPaso };
    if (htmlDesconocido) out.htmlVentana = htmlDesconocido.slice(0, 20000);
    out.registro = registro.slice(-40).map(([ts, tx]) => new Date(ts).toTimeString().slice(0, 8) + '  ' + tx);
    const txt = JSON.stringify(out, null, 1);
    try { await navigator.clipboard.writeText(txt); log('📋 Datos copiados: pégamelos en el chat.'); }
    catch { console.log('[axsub] datos:', txt); log('No he podido copiar: están en la consola (F12).'); }
  }

  /* ------------------------------------------------------------------ *
   *  PANEL
   * ------------------------------------------------------------------ */
  const PANEL_CSS = `
    ${U} .axsub-info{font-size:11px;font-weight:700;color:rgb(var(--tinta-500));line-height:1.35}
    ${U} .axsub-info b{color:rgb(var(--tinta-700))}
    ${U} .axsub-err{font-size:11px;font-weight:800;color:rgb(var(--rojo-600))}
    ${U} .axsub-mini{font-size:10px;padding:5px 8px}
  `;
  const registro = [];
  function log(txt) {
    registro.push([Date.now(), txt]);
    while (registro.length > 60) registro.shift();
    kLog(document.querySelector(U + ' .k-log'), txt);
  }
  function montar() {
    const t = tablero();
    let p = document.getElementById(PANEL_ID);
    if (!t) { if (p) p.remove(); return null; }
    const ancla = t.caja.closest('div.flex.justify-center') || t.caja.parentElement;
    if (!p) {
      kStyle('axsub-kit', U, '#D2463C');
      if (!document.getElementById('axsub-css')) { const st = document.createElement('style'); st.id = 'axsub-css'; st.textContent = PANEL_CSS; document.head.appendChild(st); }
      p = document.createElement('section');
      p.id = PANEL_ID;
      p.className = 'tarjeta space-y-3 p-3';
      p.setAttribute('data-ax-ignore', '1');
      p.innerHTML = `
        ${kHead('⛏️', 'Todas las vetas', 'El camino más corto para picarlas todas')}
        <div class="k-tiles" style="--k-cols:4">
          <div class="${K_TILE}"><b class="axsub-t-vetas tabular-nums">–</b><small>⛏️ Vetas</small></div>
          <div class="${K_TILE}"><b class="axsub-t-pasos tabular-nums">–</b><small>👟 Pasos</small></div>
          <div class="${K_TILE}"><b class="axsub-t-gasto tabular-nums">–</b><small>⚡ Gasto</small></div>
          <div class="${K_TILE}"><b class="axsub-t-tienes tabular-nums">–</b><small>⚡ Tienes</small></div>
        </div>
        <div hidden><p class="axsub-info" style="margin-bottom:4px">Qué picar (toca para quitar o poner; el número es cuántas hay ahora):</p><div class="axsub-tipos k-chips"></div></div>
        <p class="axsub-info"></p>
        <p class="axsub-err" hidden></p>
        <label class="k-switch"><input type="checkbox" class="axsub-agua"><span class="text-xs font-bold text-tinta-600">🌊 Cruzar el agua (Medalla Ciénaga)</span></label>
        <div class="k-seg axsub-ritmo" style="--k-cols:2"><button type="button" data-r="humano"><span>🐢</span>Ritmo humano</button><button type="button" data-r="rapido"><span>🐇</span>Rápido</button></div>
        <label class="k-switch"><input type="checkbox" class="axsub-dib"><span class="text-xs font-bold text-tinta-600">🗺️ Dibujar el camino en el mapa</span></label>
        <label class="k-switch"><input type="checkbox" class="axsub-botas"><span class="text-xs font-bold text-tinta-600">🥾 Antes, ponerme las Botas de Andar del Huerto (cobra cada 9 pasos)</span></label>
        <button type="button" class="axsub-go boton-principal w-full !py-2.5 text-sm">⛏️ Picarlas todas (camino más corto)</button>
        <button type="button" class="axsub-exp boton-secundario w-full !py-2 text-xs">🧭 Explorar y picar lo que encuentre</button>
        <div class="${K_LOG}"></div>
        <button type="button" class="axsub-copiar boton-suave axsub-mini w-full">📋 Copiar datos (si algo no va bien, pégamelos)</button>`;
      const caja = p.querySelector('.k-log');
      for (const [ts, tx] of registro) { const d = new Date(ts), q = document.createElement('p'); q.textContent = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}  ${tx}`; caja.appendChild(q); }
      const ag = p.querySelector('.axsub-agua'), di = p.querySelector('.axsub-dib');
      ag.checked = cfg.agua; di.checked = cfg.dibujar;
      const bo = p.querySelector('.axsub-botas');
      bo.checked = cfg.botas !== false;
      bo.addEventListener('change', () => { cfg.botas = bo.checked; guardaCfg(); });
      ag.addEventListener('change', () => { cfg.agua = ag.checked; guardaCfg(); plan = null; refrescar(true); });
      di.addEventListener('change', () => { cfg.dibujar = di.checked; guardaCfg(); dibujar(ultimaObs); });
      p.querySelector('.axsub-go').addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); iniciar('picar'); });
      p.querySelector('.axsub-exp').addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); iniciar('explorar'); });
      p.querySelector('.axsub-copiar').addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); copiarDatos(); });
      p.querySelector('.axsub-ritmo').addEventListener('click', e => {
        const b = e.target.closest('button[data-r]');
        if (!b) return;
        e.preventDefault(); e.stopPropagation();
        cfg.ritmo = b.dataset.r; guardaCfg(); pintar();
      });
      p.querySelector('.axsub-tipos').addEventListener('click', e => {
        const b = e.target.closest('button[data-tipo]');
        if (!b) return;
        e.preventDefault(); e.stopPropagation();
        cfg.tipos = cfg.tipos || {};
        const tp = b.dataset.tipo;
        // al tocar uno se fija la elección de todos los que se ven (para que lo nuevo no cambie lo elegido)
        for (const x of p.querySelectorAll('.axsub-tipos button[data-tipo]')) cfg.tipos[x.dataset.tipo] = quiereTipo(x.dataset.tipo);
        cfg.tipos[tp] = !cfg.tipos[tp];
        if (Object.values(cfg.tipos).every(Boolean)) cfg.tipos = {};
        guardaCfg(); plan = null; refrescar(true);
      });
    }
    if (p.previousElementSibling !== ancla) ancla.insertAdjacentElement('afterend', p);
    return p;
  }
  function pintar() {
    const p = document.getElementById(PANEL_ID);
    if (!p) return;
    const o = ultimaObs;
    kBadge(p.querySelector('.k-badge'), corriendo ? 'on' : (o && !o.ok ? 'warn' : 'off'), corriendo ? 'PICANDO' : (o && !o.ok ? 'AVISO' : 'LISTO'));
    const b = p.querySelector('.axsub-go');
    kSet(b, corriendo && modo === 'picar' ? '■ Parar' : '⛏️ Picarlas todas (camino más corto)');
    const bx = p.querySelector('.axsub-exp');
    kSet(bx, corriendo && modo === 'explorar' ? '■ Parar de explorar' : '🧭 Explorar y picar lo que encuentre');
    b.disabled = corriendo && modo !== 'picar'; bx.disabled = corriendo && modo !== 'explorar';
    const en = energia();
    kSet(p.querySelector('.axsub-t-tienes'), en ? String(en.e) : '–');
    const err = p.querySelector('.axsub-err');
    const msg = o && !o.ok ? o.error : '';
    kSet(err, msg); err.hidden = !msg;
    if (plan && plan.explorar && corriendo) {
      const m = mem();
      const info = p.querySelector('.axsub-info:not([style])');
      kSet(info, `🧭 Explorando: conozco ${Object.keys(m.cod || m.celdas || {}).length} casillas y ${Object.keys(m.nodos || {}).length} veta(s).`);
      delete info.dataset.h;
    } else if (plan && !plan.explorar) {
      const quedan = plan.paradas.filter(x => x.idx >= plan.cursor && x.v);
      const pasos = quedan.length ? quedan[quedan.length - 1].idx - plan.cursor : 0;
      const andar = cobroAndar(pasos, pasosParaCobro());
      const picarC = quedan.reduce((a, x) => a + (x.v.coste || 0), 0), dudas = quedan.some(x => x.v.coste == null);
      kSet(p.querySelector('.axsub-t-vetas'), `${quedan.length}/${plan.total}`);
      kSet(p.querySelector('.axsub-t-pasos'), String(pasos));
      kSet(p.querySelector('.axsub-t-gasto'), (andar + picarC) + (dudas ? '+' : ''));
      const fuente = o && o.ok ? (o.fuente === 'datos' ? (planoMemo ? `mapa entero del juego (${planoMemo.ancho}×${planoMemo.alto}); vetas de ${Object.keys(mem().cod).length} casillas vistas${porVer(o) ? ` (quedan ${porVer(o)} de suelo sin ver: «🧭 Explorar y picar»)` : ''}` : `mapa del juego: ${Object.keys(mem().cod).length} casillas conocidas (se amplía al andar)`) : o.fuente === 'juego' ? `mapa del juego (${o.G.w}×${o.G.h})` : `mapa aprendido (${Object.keys(mem().celdas).length} casillas vistas)`) : '';
      const partes = [];
      const txtPicar = dudas && !picarC ? 'picar (lo que cueste: aún no sé cuánto)' : `picar (−${picarC}${dudas ? '+' : ''} ⚡)`;
      partes.push(quedan.length ? `<b>${quedan.length}</b> veta(s) por picar: <b>${pasos}</b> pasos (−${andar} ⚡ andando) + ${txtPicar}.` : 'No queda ninguna veta disponible que conozca.');
      if (plan.sinCamino) partes.push(`${plan.sinCamino} sin camino (habría que pisar escaleras, la Sima, puertas u otras vetas, o es zona sin ver).`);
      if (plan.total - plan.disponibles > 0) partes.push(`${plan.total - plan.disponibles} ya picada(s) o vacía(s).`);
      if (fuente) partes.push('Usando el ' + fuente + '.');
      const info = p.querySelector('.axsub-info:not([style])');
      const html = partes.join(' ');
      if (info.dataset.h !== html) { info.innerHTML = html; info.dataset.h = html; }
    } else {
      kSet(p.querySelector('.axsub-t-vetas'), '–'); kSet(p.querySelector('.axsub-t-pasos'), '–'); kSet(p.querySelector('.axsub-t-gasto'), '–');
    }
    for (const b of p.querySelectorAll('.axsub-ritmo button')) { const on = b.dataset.r === cfg.ritmo; b.className = on ? K_ON : K_OFF; b.setAttribute('aria-pressed', String(on)); }
    pintarTipos(p);
    dibujar(o);
  }
  // Qué tipos de veta picar (salen los que se conocen; todos marcados de primeras)
  function pintarTipos(p) {
    const caja = p.querySelector('.axsub-tipos');
    const m = mem();
    const cuenta = new Map();
    if (m && m.nodos && marco === 'datos') {
      const mapa = ultimaObs && ultimaObs.ok && ultimaObs.fuente === 'datos' ? construirMapaDatos(ultimaObs) : null;
      for (const n of Object.values(m.nodos)) if (!cuenta.has(n.tipo)) cuenta.set(n.tipo, 0);
      if (mapa) for (const v of mapa.todasVetas) if (v.existe) cuenta.set(v.tipoId, (cuenta.get(v.tipoId) || 0) + 1);
    }
    const tipos = [...cuenta.keys()].sort();
    const html = tipos.map(tp => { const on = quiereTipo(tp); return `<button type="button" data-tipo="${kEsc(tp)}" aria-pressed="${on}" class="${on ? K_ON : K_OFF}" title="${on ? 'Se pica' : 'No se pica'}">${emojiTipo(tp)} ${kEsc(nombreTipo(tp))} · ${cuenta.get(tp)}</button>`; }).join('');
    caja.parentElement.hidden = !tipos.length;
    if (caja.dataset.h !== html) { caja.innerHTML = html; caja.dataset.h = html; }
  }
  let refrescando = false, ultimaHuella = '';
  async function refrescar(forzar = false) {
    if (refrescando || corriendo) return;
    refrescando = true;
    try {
      const o = await observar();
      if (o.ok) {
        const huella = [o.pos.x, o.pos.y, o.cosas.map(c => c.tipo + c.x + ',' + c.y + (c.vacia ? 'v' : '')).join('|'), cfg.agua, o.fuente === 'datos' ? firmaDe(construirMapaDatos(o)) : ''].join(';');
        if (forzar || huella !== ultimaHuella || !plan || Date.now() - plan.t > 30000) { ultimaHuella = huella; plan = planificar(o, 150); plan.rapido = true; }
        else planVale(plan, o);
      } else if (!o.moviendo) ultimaObs = o;
      pintar();
    } catch (e) { console.warn('[axsub]', e); }
    finally { refrescando = false; }
  }

  function tick() {
    if (!enGrutas()) {
      corriendo = false;
      const p = document.getElementById(PANEL_ID); if (p) p.remove();
      const d = document.getElementById(DIBUJO_ID); if (d) d.remove();
      return;
    }
    if (!montar()) return;
    if (!corriendo) refrescar();
  }

  // Para probar sin la web
  window.__axSub = { leerVista, codPlano, porVer, planExplorar, tablero, leerCosas, energia, pasosParaCobro, planificar, construirMapa, ordenExacto, ordenHeuristico, cobroAndar, observar, copiarDatos, mems: () => mems };

  /* ── 🥾 Botas de Andar: antes de andar, si no las llevas puestas, se va al Huerto a ponérselas (lo hace el script del
   * Huerto con /huerto?botas=1&volver=…) y se vuelve aquí a seguir. Un intento cada 10 min como mucho. ── */
  const BOTAS_SS = 'axsub-botas-intento';
  function faltanBotas() {
    if (cfg.botas === false || corriendo) return false;
    try { if (!localStorage.getItem('axh-v')) return false; } catch { return false; }   // sin el script del Huerto no se va
    if (lsLee('axh-botas-hasta', 0) > Date.now() + 20 * 60 * 1000) return false;
    let t = 0; try { t = +sessionStorage.getItem(BOTAS_SS) || 0; } catch { /* nada */ }
    return Date.now() - t > 10 * 60 * 1000;
  }
  function iniciar(m) {
    if (faltanBotas()) {
      try { sessionStorage.setItem(BOTAS_SS, String(Date.now())); } catch { /* nada */ }
      log('🥾 Voy al Huerto a ponerme las Botas de Andar y vuelvo.');
      location.assign('/huerto?botas=1&volver=' + encodeURIComponent('/subsuelo?' + m + '=1'));
      return;
    }
    recorrer(m);
  }
  // /subsuelo?explorar=1 o ?picar=1: empieza solo (lo usan el bot y la vuelta del Huerto)
  async function arranqueDesdeEnlace() {
    const q = new URLSearchParams(location.search);
    const m = q.has('explorar') ? 'explorar' : q.has('picar') ? 'picar' : null;
    if (!m || !enGrutas()) return;
    history.replaceState(history.state, '', location.pathname);
    for (let i = 0; i < 60 && !montar(); i++) await sleep(500);
    await sleep(1500);
    if (!corriendo) iniciar(m);
  }

  esperarHidratacion().then(() => { tick(); setInterval(() => { tick(); if (corriendo && Date.now() - resumenT > 20000) { resumenT = Date.now(); resumenVetas(); } }, 1500); arranqueDesdeEnlace(); });
})();
