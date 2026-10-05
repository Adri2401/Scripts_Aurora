// ==UserScript==
// @name         Aurora Dex · Ciudad Negra (IA)
// @namespace    auroradex-ciudadnegra
// @version      1.0.1
// @description  Solo en /ciudad-negra. Elige el mejor cuarteto para la norma de la semana y baja solo: en cada puerta, tienda y bendición juega cada opción muchas veces por delante (Monte Carlo, con las fórmulas del juego) y escoge la que más cerca deja de ganar al siguiente guardián; ordena a tu equipo antes de cada combate, gasta el dinero en lo que más rinde y aprende de cada combate (nivel de los rivales por piso, cuánto pega cada lado, qué da cada puerta).
// @match        https://auroradex.es/*
// @match        https://www.auroradex.es/*
// @updateURL    https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_ciudadnegra.user.js
// @downloadURL  https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_ciudadnegra.user.js
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  'use strict';
  // Solo en la pestaña de la página (no en ventanas ocultas de otros scripts)
  try { if (window.top !== window) return; } catch { return; }
  const VERSION = '1.0.1';
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
  const DEX_DATOS = '45.49.49.65.65.45:planta/veneno:Bulbasaur,60.62.63.80.80.60:planta/veneno:Ivysaur,80.82.83.100.100.80:planta/veneno:Venusaur,39.52.43.60.50.65:fuego:Charmander,58.64.58.80.65.80:fuego:Charmeleon,78.84.78.109.85.100:fuego/volador:Charizard,44.48.65.50.64.43:agua:Squirtle,59.63.80.65.80.58:agua:Wartortle,79.83.100.85.105.78:agua:Blastoise,45.30.35.20.20.45:bicho:Caterpie,50.20.55.25.25.30:bicho:Metapod,60.45.50.90.80.70:bicho/volador:Butterfree,40.35.30.20.20.50:bicho/veneno:Weedle,45.25.50.25.25.35:bicho/veneno:Kakuna,65.90.40.45.80.75:bicho/veneno:Beedrill,40.45.40.35.35.56:normal/volador:Pidgey,63.60.55.50.50.71:normal/volador:Pidgeotto,83.80.75.70.70.101:normal/volador:Pidgeot,30.56.35.25.35.72:normal:Rattata,55.81.60.50.70.97:normal:Raticate,40.60.30.31.31.70:normal/volador:Spearow,65.90.65.61.61.100:normal/volador:Fearow,35.60.44.40.54.55:veneno:Ekans,60.95.69.65.79.80:veneno:Arbok,35.55.40.50.50.90:electrico:Pikachu,60.90.55.90.80.110:electrico:Raichu,50.75.85.20.30.40:tierra:Sandshrew,75.100.110.45.55.65:tierra:Sandslash,55.47.52.40.40.41:veneno:Nidoran♀,70.62.67.55.55.56:veneno:Nidorina,90.92.87.75.85.76:veneno/tierra:Nidoqueen,46.57.40.40.40.50:veneno:Nidoran♂,61.72.57.55.55.65:veneno:Nidorino,81.102.77.85.75.85:veneno/tierra:Nidoking,70.45.48.60.65.35:hada:Clefairy,95.70.73.95.90.60:hada:Clefable,38.41.40.50.65.65:fuego:Vulpix,73.76.75.81.100.100:fuego:Ninetales,115.45.20.45.25.20:normal/hada:Jigglypuff,140.70.45.85.50.45:normal/hada:Wigglytuff,40.45.35.30.40.55:veneno/volador:Zubat,75.80.70.65.75.90:veneno/volador:Golbat,45.50.55.75.65.30:planta/veneno:Oddish,60.65.70.85.75.40:planta/veneno:Gloom,75.80.85.110.90.50:planta/veneno:Vileplume,35.70.55.45.55.25:bicho/planta:Paras,60.95.80.60.80.30:bicho/planta:Parasect,60.55.50.40.55.45:bicho/veneno:Venonat,70.65.60.90.75.90:bicho/veneno:Venomoth,10.55.25.35.45.95:tierra:Diglett,35.100.50.50.70.120:tierra:Dugtrio,40.45.35.40.40.90:normal:Meowth,65.70.60.65.65.115:normal:Persian,50.52.48.65.50.55:agua:Psyduck,80.82.78.95.80.85:agua:Golduck,40.80.35.35.45.70:lucha:Mankey,65.105.60.60.70.95:lucha:Primeape,55.70.45.70.50.60:fuego:Growlithe,90.110.80.100.80.95:fuego:Arcanine,40.50.40.40.40.90:agua:Poliwag,65.65.65.50.50.90:agua:Poliwhirl,90.95.95.70.90.70:agua/lucha:Poliwrath,25.20.15.105.55.90:psiquico:Abra,40.35.30.120.70.105:psiquico:Kadabra,55.50.45.135.95.120:psiquico:Alakazam,70.80.50.35.35.35:lucha:Machop,80.100.70.50.60.45:lucha:Machoke,90.130.80.65.85.55:lucha:Machamp,50.75.35.70.30.40:planta/veneno:Bellsprout,65.90.50.85.45.55:planta/veneno:Weepinbell,80.105.65.100.70.70:planta/veneno:Victreebel,40.40.35.50.100.70:agua/veneno:Tentacool,80.70.65.80.120.100:agua/veneno:Tentacruel,40.80.100.30.30.20:roca/tierra:Geodude,55.95.115.45.45.35:roca/tierra:Graveler,80.120.130.55.65.45:roca/tierra:Golem,50.85.55.65.65.90:fuego:Ponyta,65.100.70.80.80.105:fuego:Rapidash,90.65.65.40.40.15:agua/psiquico:Slowpoke,95.75.110.100.80.30:agua/psiquico:Slowbro,25.35.70.95.55.45:electrico/acero:Magnemite,50.60.95.120.70.70:electrico/acero:Magneton,52.90.55.58.62.60:normal/volador:Farfetch’d,35.85.45.35.35.75:normal/volador:Doduo,60.110.70.60.60.110:normal/volador:Dodrio,65.45.55.45.70.45:agua:Seel,90.70.80.70.95.70:agua/hielo:Dewgong,80.80.50.40.50.25:veneno:Grimer,105.105.75.65.100.50:veneno:Muk,30.65.100.45.25.40:agua:Shellder,50.95.180.85.45.70:agua/hielo:Cloyster,30.35.30.100.35.80:fantasma/veneno:Gastly,45.50.45.115.55.95:fantasma/veneno:Haunter,60.65.60.130.75.110:fantasma/veneno:Gengar,35.45.160.30.45.70:roca/tierra:Onix,60.48.45.43.90.42:psiquico:Drowzee,85.73.70.73.115.67:psiquico:Hypno,30.105.90.25.25.50:agua:Krabby,55.130.115.50.50.75:agua:Kingler,40.30.50.55.55.100:electrico:Voltorb,60.50.70.80.80.150:electrico:Electrode,60.40.80.60.45.40:planta/psiquico:Exeggcute,95.95.85.125.75.55:planta/psiquico:Exeggutor,50.50.95.40.50.35:tierra:Cubone,60.80.110.50.80.45:tierra:Marowak,50.120.53.35.110.87:lucha:Hitmonlee,50.105.79.35.110.76:lucha:Hitmonchan,90.55.75.60.75.30:normal:Lickitung,40.65.95.60.45.35:veneno:Koffing,65.90.120.85.70.60:veneno:Weezing,80.85.95.30.30.25:tierra/roca:Rhyhorn,105.130.120.45.45.40:tierra/roca:Rhydon,250.5.5.35.105.50:normal:Chansey,65.55.115.100.40.60:planta:Tangela,105.95.80.40.80.90:normal:Kangaskhan,30.40.70.70.25.60:agua:Horsea,55.65.95.95.45.85:agua:Seadra,45.67.60.35.50.63:agua:Goldeen,80.92.65.65.80.68:agua:Seaking,30.45.55.70.55.85:agua:Staryu,60.75.85.100.85.115:agua/psiquico:Starmie,40.45.65.100.120.90:psiquico/hada:Mr. Mime,70.110.80.55.80.105:bicho/volador:Scyther,65.50.35.115.95.95:hielo/psiquico:Jynx,65.83.57.95.85.105:electrico:Electabuzz,65.95.57.100.85.93:fuego:Magmar,65.125.100.55.70.85:bicho:Pinsir,75.100.95.40.70.110:normal:Tauros,20.10.55.15.20.80:agua:Magikarp,95.125.79.60.100.81:agua/volador:Gyarados,130.85.80.85.95.60:agua/hielo:Lapras,48.48.48.48.48.48:normal:Ditto,55.55.50.45.65.55:normal:Eevee,130.65.60.110.95.65:agua:Vaporeon,65.65.60.110.95.130:electrico:Jolteon,65.130.60.95.110.65:fuego:Flareon,65.60.70.85.75.40:normal:Porygon,35.40.100.90.55.35:roca/agua:Omanyte,70.60.125.115.70.55:roca/agua:Omastar,30.80.90.55.45.55:roca/agua:Kabuto,60.115.105.65.70.80:roca/agua:Kabutops,80.105.65.60.75.130:roca/volador:Aerodactyl,160.110.65.65.110.30:normal:Snorlax,90.85.100.95.125.85:hielo/volador:Articuno*,90.90.85.125.90.100:electrico/volador:Zapdos*,90.100.90.125.85.90:fuego/volador:Moltres*,41.64.45.50.50.50:dragon:Dratini,61.84.65.70.70.70:dragon:Dragonair,91.134.95.100.100.80:dragon/volador:Dragonite,106.110.90.154.90.130:psiquico:Mewtwo*,100.100.100.100.100.100:psiquico:Mew*,45.49.65.49.65.45:planta:Chikorita,60.62.80.63.80.60:planta:Bayleef,80.82.100.83.100.80:planta:Meganium,39.52.43.60.50.65:fuego:Cyndaquil,58.64.58.80.65.80:fuego:Quilava,78.84.78.109.85.100:fuego:Typhlosion,50.65.64.44.48.43:agua:Totodile,65.80.80.59.63.58:agua:Croconaw,85.105.100.79.83.78:agua:Feraligatr,35.46.34.35.45.20:normal:Sentret,85.76.64.45.55.90:normal:Furret,60.30.30.36.56.50:normal/volador:Hoothoot,100.50.50.86.96.70:normal/volador:Noctowl,40.20.30.40.80.55:bicho/volador:Ledyba,55.35.50.55.110.85:bicho/volador:Ledian,40.60.40.40.40.30:bicho/veneno:Spinarak,70.90.70.60.70.40:bicho/veneno:Ariados,85.90.80.70.80.130:veneno/volador:Crobat,75.38.38.56.56.67:agua/electrico:Chinchou,125.58.58.76.76.67:agua/electrico:Lanturn,20.40.15.35.35.60:electrico:Pichu,50.25.28.45.55.15:hada:Cleffa,90.30.15.40.20.15:normal/hada:Igglybuff,35.20.65.40.65.20:hada:Togepi,55.40.85.80.105.40:hada/volador:Togetic,40.50.45.70.45.70:psiquico/volador:Natu,65.75.70.95.70.95:psiquico/volador:Xatu,55.40.40.65.45.35:electrico:Mareep,70.55.55.80.60.45:electrico:Flaaffy,90.75.85.115.90.55:electrico:Ampharos,75.80.95.90.100.50:planta:Bellossom,70.20.50.20.50.40:agua/hada:Marill,100.50.80.60.80.50:agua/hada:Azumarill,70.100.115.30.65.30:roca:Sudowoodo,90.75.75.90.100.70:agua:Politoed,35.35.40.35.55.50:planta/volador:Hoppip,55.45.50.45.65.80:planta/volador:Skiploom,75.55.70.55.95.110:planta/volador:Jumpluff,55.70.55.40.55.85:normal:Aipom,30.30.30.30.30.30:planta:Sunkern,75.75.55.105.85.30:planta:Sunflora,65.65.45.75.45.95:bicho/volador:Yanma,55.45.45.25.25.15:agua/tierra:Wooper,95.85.85.65.65.35:agua/tierra:Quagsire,65.65.60.130.95.110:psiquico:Espeon,95.65.110.60.130.65:siniestro:Umbreon,60.85.42.85.42.91:siniestro/volador:Murkrow,95.75.80.100.110.30:agua/psiquico:Slowking,60.60.60.85.85.85:fantasma:Misdreavus,48.72.48.72.48.48:psiquico:Unown,190.33.58.33.58.33:psiquico:Wobbuffet,70.80.65.90.65.85:normal/psiquico:Girafarig,50.65.90.35.35.15:bicho:Pineco,75.90.140.60.60.40:bicho/acero:Forretress,100.70.70.65.65.45:normal:Dunsparce,65.75.105.35.65.85:tierra/volador:Gligar,75.85.200.55.65.30:acero/tierra:Steelix,60.80.50.40.40.30:hada:Snubbull,90.120.75.60.60.45:hada:Granbull,65.95.85.55.55.85:agua/veneno:Qwilfish,70.130.100.55.80.65:bicho/acero:Scizor,20.10.230.10.230.5:bicho/roca:Shuckle,80.125.75.40.95.85:bicho/lucha:Heracross,55.95.55.35.75.115:siniestro/hielo:Sneasel,60.80.50.50.50.40:normal:Teddiursa,90.130.75.75.75.55:normal:Ursaring,40.40.40.70.40.20:fuego:Slugma,60.50.120.90.80.30:fuego/roca:Magcargo,50.50.40.30.30.50:hielo/tierra:Swinub,100.100.80.60.60.50:hielo/tierra:Piloswine,65.55.95.65.95.35:agua/roca:Corsola,35.65.35.65.35.65:agua:Remoraid,75.105.75.105.75.45:agua:Octillery,45.55.45.65.45.75:hielo/volador:Delibird,85.40.70.80.140.70:agua/volador:Mantine,65.80.140.40.70.70:acero/volador:Skarmory,45.60.30.80.50.65:siniestro/fuego:Houndour,75.90.50.110.80.95:siniestro/fuego:Houndoom,75.95.95.95.95.85:agua/dragon:Kingdra,90.60.60.40.40.40:tierra:Phanpy,90.120.120.60.60.50:tierra:Donphan,85.80.90.105.95.60:normal:Porygon2,73.95.62.85.65.85:normal:Stantler,55.20.35.20.45.75:normal:Smeargle,35.35.35.35.35.35:lucha:Tyrogue,50.95.95.35.110.70:lucha:Hitmontop,45.30.15.85.65.65:hielo/psiquico:Smoochum,45.63.37.65.55.95:electrico:Elekid,45.75.37.70.55.83:fuego:Magby,95.80.105.40.70.100:normal:Miltank,255.10.10.75.135.55:normal:Blissey,90.85.75.115.100.115:electrico:Raikou*,115.115.85.90.75.100:fuego:Entei*,100.75.115.90.115.85:agua:Suicune*,50.64.50.45.50.41:roca/tierra:Larvitar,70.84.70.65.70.51:roca/tierra:Pupitar,100.134.110.95.100.61:roca/siniestro:Tyranitar,106.90.130.90.154.110:psiquico/volador:Lugia*,106.130.90.110.154.90:fuego/volador:Ho-Oh*,100.100.100.100.100.100:psiquico/planta:Celebi*,40.45.35.65.55.70:planta:Treecko,50.65.45.85.65.95:planta:Grovyle,70.85.65.105.85.120:planta:Sceptile,45.60.40.70.50.45:fuego:Torchic,60.85.60.85.60.55:fuego/lucha:Combusken,80.120.70.110.70.80:fuego/lucha:Blaziken,50.70.50.50.50.40:agua:Mudkip,70.85.70.60.70.50:agua/tierra:Marshtomp,100.110.90.85.90.60:agua/tierra:Swampert,35.55.35.30.30.35:siniestro:Poochyena,70.90.70.60.60.70:siniestro:Mightyena,38.30.41.30.41.60:normal:Zigzagoon,78.70.61.50.61.100:normal:Linoone,45.45.35.20.30.20:bicho:Wurmple,50.35.55.25.25.15:bicho:Silcoon,60.70.50.100.50.65:bicho/volador:Beautifly,50.35.55.25.25.15:bicho:Cascoon,60.50.70.50.90.65:bicho/veneno:Dustox,40.30.30.40.50.30:agua/planta:Lotad,60.50.50.60.70.50:agua/planta:Lombre,80.70.70.90.100.70:agua/planta:Ludicolo,40.40.50.30.30.30:planta:Seedot,70.70.40.60.40.60:planta/siniestro:Nuzleaf,90.100.60.90.60.80:planta/siniestro:Shiftry,40.55.30.30.30.85:normal/volador:Taillow,60.85.60.75.50.125:normal/volador:Swellow,40.30.30.55.30.85:agua/volador:Wingull,60.50.100.95.70.65:agua/volador:Pelipper,28.25.25.45.35.40:psiquico/hada:Ralts,38.35.35.65.55.50:psiquico/hada:Kirlia,68.65.65.125.115.80:psiquico/hada:Gardevoir,40.30.32.50.52.65:bicho/agua:Surskit,70.60.62.100.82.80:bicho/volador:Masquerain,60.40.60.40.60.35:planta:Shroomish,60.130.80.60.60.70:planta/lucha:Breloom,60.60.60.35.35.30:normal:Slakoth,80.80.80.55.55.90:normal:Vigoroth,150.160.100.95.65.100:normal:Slaking,31.45.90.30.30.40:bicho/tierra:Nincada,61.90.45.50.50.160:bicho/volador:Ninjask,1.90.45.30.30.40:bicho/fantasma:Shedinja,64.51.23.51.23.28:normal:Whismur,84.71.43.71.43.48:normal:Loudred,104.91.63.91.73.68:normal:Exploud,72.60.30.20.30.25:lucha:Makuhita,144.120.60.40.60.50:lucha:Hariyama,50.20.40.20.40.20:normal/hada:Azurill,30.45.135.45.90.30:roca:Nosepass,50.45.45.35.35.50:normal:Skitty,70.65.65.55.55.90:normal:Delcatty,50.75.75.65.65.50:siniestro/fantasma:Sableye,50.85.85.55.55.50:acero/hada:Mawile,50.70.100.40.40.30:acero/roca:Aron,60.90.140.50.50.40:acero/roca:Lairon,70.110.180.60.60.50:acero/roca:Aggron,30.40.55.40.55.60:lucha/psiquico:Meditite,60.60.75.60.75.80:lucha/psiquico:Medicham,40.45.40.65.40.65:electrico:Electrike,70.75.60.105.60.105:electrico:Manectric,60.50.40.85.75.95:electrico:Plusle,60.40.50.75.85.95:electrico:Minun,65.73.75.47.85.85:bicho:Volbeat,65.47.75.73.85.85:bicho:Illumise,50.60.45.100.80.65:planta/veneno:Roselia,70.43.53.43.53.40:veneno:Gulpin,100.73.83.73.83.55:veneno:Swalot,45.90.20.65.20.65:agua/siniestro:Carvanha,70.120.40.95.40.95:agua/siniestro:Sharpedo,130.70.35.70.35.60:agua:Wailmer,170.90.45.90.45.60:agua:Wailord,60.60.40.65.45.35:fuego/tierra:Numel,70.100.70.105.75.40:fuego/tierra:Camerupt,70.85.140.85.70.20:fuego:Torkoal,60.25.35.70.80.60:psiquico:Spoink,80.45.65.90.110.80:psiquico:Grumpig,60.60.60.60.60.60:normal:Spinda,45.100.45.45.45.10:tierra:Trapinch,50.70.50.50.50.70:tierra/dragon:Vibrava,80.100.80.80.80.100:tierra/dragon:Flygon,50.85.40.85.40.35:planta:Cacnea,70.115.60.115.60.55:planta/siniestro:Cacturne,45.40.60.40.75.50:normal/volador:Swablu,75.70.90.70.105.80:dragon/volador:Altaria,73.115.60.60.60.90:normal:Zangoose,73.100.60.100.60.65:veneno:Seviper,90.55.65.95.85.70:roca/psiquico:Lunatone,90.95.85.55.65.70:roca/psiquico:Solrock,50.48.43.46.41.60:agua/tierra:Barboach,110.78.73.76.71.60:agua/tierra:Whiscash,43.80.65.50.35.35:agua:Corphish,63.120.85.90.55.55:agua/siniestro:Crawdaunt,40.40.55.40.70.55:tierra/psiquico:Baltoy,60.70.105.70.120.75:tierra/psiquico:Claydol,66.41.77.61.87.23:roca/planta:Lileep,86.81.97.81.107.43:roca/planta:Cradily,45.95.50.40.50.75:roca/bicho:Anorith,75.125.100.70.80.45:roca/bicho:Armaldo,20.15.20.10.55.80:agua:Feebas,95.60.79.100.125.81:agua:Milotic,70.70.70.70.70.70:normal:Castform,60.90.70.60.120.40:normal:Kecleon,44.75.35.63.33.45:fantasma:Shuppet,64.115.65.83.63.65:fantasma:Banette,20.40.90.30.90.25:fantasma:Duskull,40.70.130.60.130.25:fantasma:Dusclops,99.68.83.72.87.51:planta/volador:Tropius,75.50.80.95.90.65:psiquico:Chimecho,65.130.60.75.60.75:siniestro:Absol,95.23.48.23.48.23:psiquico:Wynaut,50.50.50.50.50.50:hielo:Snorunt,80.80.80.80.80.80:hielo:Glalie,70.40.50.55.50.25:hielo/agua:Spheal,90.60.70.75.70.45:hielo/agua:Sealeo,110.80.90.95.90.65:hielo/agua:Walrein,35.64.85.74.55.32:agua:Clamperl,55.104.105.94.75.52:agua:Huntail,55.84.105.114.75.52:agua:Gorebyss,100.90.130.45.65.55:agua/roca:Relicanth,43.30.55.40.65.97:agua:Luvdisc,45.75.60.40.30.50:dragon:Bagon,65.95.100.60.50.50:dragon:Shelgon,95.135.80.110.80.100:dragon/volador:Salamence,40.55.80.35.60.30:acero/psiquico:Beldum,60.75.100.55.80.50:acero/psiquico:Metang,80.135.130.95.90.70:acero/psiquico:Metagross,80.100.200.50.100.50:roca:Regirock*,80.50.100.100.200.50:hielo:Regice*,80.75.150.75.150.50:acero:Registeel*,80.80.90.110.130.110:dragon/psiquico:Latias*,80.90.80.130.110.110:dragon/psiquico:Latios*,100.100.90.150.140.90:agua:Kyogre*,100.150.140.100.90.90:tierra:Groudon*,105.150.90.150.90.95:dragon/volador:Rayquaza*,100.100.100.100.100.100:acero/psiquico:Jirachi*,50.150.50.150.50.150:psiquico:Deoxys*,55.68.64.45.55.31:planta:Turtwig,75.89.85.55.65.36:planta:Grotle,95.109.105.75.85.56:planta/tierra:Torterra,44.58.44.58.44.61:fuego:Chimchar,64.78.52.78.52.81:fuego/lucha:Monferno,76.104.71.104.71.108:fuego/lucha:Infernape,53.51.53.61.56.40:agua:Piplup,64.66.68.81.76.50:agua:Prinplup,84.86.88.111.101.60:agua/acero:Empoleon,40.55.30.30.30.60:normal/volador:Starly,55.75.50.40.40.80:normal/volador:Staravia,85.120.70.50.60.100:normal/volador:Staraptor,59.45.40.35.40.31:normal:Bidoof,79.85.60.55.60.71:normal/agua:Bibarel,37.25.41.25.41.25:bicho:Kricketot,77.85.51.55.51.65:bicho:Kricketune,45.65.34.40.34.45:electrico:Shinx,60.85.49.60.49.60:electrico:Luxio,80.120.79.95.79.70:electrico:Luxray,40.30.35.50.70.55:planta/veneno:Budew,60.70.65.125.105.90:planta/veneno:Roserade,67.125.40.30.30.58:roca:Cranidos,97.165.60.65.50.58:roca:Rampardos,30.42.118.42.88.30:roca/acero:Shieldon,60.52.168.47.138.30:roca/acero:Bastiodon,40.29.45.29.45.36:bicho:Burmy,60.59.85.79.105.36:bicho/planta:Wormadam,70.94.50.94.50.66:bicho/volador:Mothim,30.30.42.30.42.70:bicho/volador:Combee,70.80.102.80.102.40:bicho/volador:Vespiquen,60.45.70.45.90.95:electrico:Pachirisu,55.65.35.60.30.85:agua:Buizel,85.105.55.85.50.115:agua:Floatzel,45.35.45.62.53.35:planta:Cherubi,70.60.70.87.78.85:planta:Cherrim,76.48.48.57.62.34:agua:Shellos,111.83.68.92.82.39:agua/tierra:Gastrodon,75.100.66.60.66.115:normal:Ambipom,90.50.34.60.44.70:fantasma/volador:Drifloon,150.80.44.90.54.80:fantasma/volador:Drifblim,55.66.44.44.56.85:normal:Buneary,65.76.84.54.96.105:normal:Lopunny,60.60.60.105.105.105:fantasma:Mismagius,100.125.52.105.52.71:siniestro/volador:Honchkrow,49.55.42.42.37.85:normal:Glameow,71.82.64.64.59.112:normal:Purugly,45.30.50.65.50.45:psiquico:Chingling,63.63.47.41.41.74:veneno/siniestro:Stunky,103.93.67.71.61.84:veneno/siniestro:Skuntank,57.24.86.24.86.23:acero/psiquico:Bronzor,67.89.116.79.116.33:acero/psiquico:Bronzong,50.80.95.10.45.10:roca:Bonsly,20.25.45.70.90.60:psiquico/hada:Mime Jr.,100.5.5.15.65.30:normal:Happiny,76.65.45.92.42.91:normal/volador:Chatot,50.92.108.92.108.35:fantasma/siniestro:Spiritomb,58.70.45.40.45.42:dragon/tierra:Gible,68.90.65.50.55.82:dragon/tierra:Gabite,108.130.95.80.85.102:dragon/tierra:Garchomp,135.85.40.40.85.5:normal:Munchlax,40.70.40.35.40.60:lucha:Riolu,70.110.70.115.70.90:lucha/acero:Lucario,68.72.78.38.42.32:tierra:Hippopotas,108.112.118.68.72.47:tierra:Hippowdon,40.50.90.30.55.65:veneno/bicho:Skorupi,70.90.110.60.75.95:veneno/siniestro:Drapion,48.61.40.61.40.50:veneno/lucha:Croagunk,83.106.65.86.65.85:veneno/lucha:Toxicroak,74.100.72.90.72.46:planta:Carnivine,49.49.56.49.61.66:agua:Finneon,69.69.76.69.86.91:agua:Lumineon,45.20.50.60.120.50:agua/volador:Mantyke,60.62.50.62.60.40:planta/hielo:Snover,90.92.75.92.85.60:planta/hielo:Abomasnow,70.120.65.45.85.125:siniestro/hielo:Weavile,70.70.115.130.90.60:electrico/acero:Magnezone,110.85.95.80.95.50:normal:Lickilicky,115.140.130.55.55.40:tierra/roca:Rhyperior,100.100.125.110.50.50:planta:Tangrowth,75.123.67.95.85.95:electrico:Electivire,75.95.67.125.95.83:fuego:Magmortar,85.50.95.120.115.80:hada/volador:Togekiss,86.76.86.116.56.95:bicho/volador:Yanmega,65.110.130.60.65.95:planta:Leafeon,65.60.110.130.95.65:hielo:Glaceon,75.95.125.45.75.95:tierra/volador:Gliscor,110.130.80.70.60.80:hielo/tierra:Mamoswine,85.80.70.135.75.90:normal:Porygon-Z,68.125.65.65.115.80:psiquico/lucha:Gallade,60.55.145.75.150.40:roca/acero:Probopass,45.100.135.65.135.45:fantasma:Dusknoir,70.80.70.80.70.110:hielo/fantasma:Froslass,50.50.77.95.77.91:electrico/fantasma:Rotom,75.75.130.75.130.95:psiquico:Uxie*,80.105.105.105.105.80:psiquico:Mesprit*,75.125.70.125.70.115:psiquico:Azelf*,100.120.120.150.100.90:acero/dragon:Dialga*,90.120.100.150.120.100:agua/dragon:Palkia*,91.90.106.130.106.77:fuego/acero:Heatran*,110.160.110.80.110.100:normal:Regigigas*,150.100.120.100.120.90:fantasma/dragon:Giratina*,120.70.110.75.120.85:psiquico:Cresselia*,80.80.80.80.80.80:agua:Phione*,100.100.100.100.100.100:agua:Manaphy*,70.90.90.135.90.125:siniestro:Darkrai*,100.100.100.100.100.100:planta:Shaymin*,120.120.120.120.120.120:normal:Arceus*,100.100.100.100.100.100:psiquico/fuego:Victini*,45.45.55.45.55.63:planta:Snivy,60.60.75.60.75.83:planta:Servine,75.75.95.75.95.113:planta:Serperior,65.63.45.45.45.45:fuego:Tepig,90.93.55.70.55.55:fuego/lucha:Pignite,110.123.65.100.65.65:fuego/lucha:Emboar,55.55.45.63.45.45:agua:Oshawott,75.75.60.83.60.60:agua:Dewott,95.100.85.108.70.70:agua:Samurott,45.55.39.35.39.42:normal:Patrat,60.85.69.60.69.77:normal:Watchog,45.60.45.25.45.55:normal:Lillipup,65.80.65.35.65.60:normal:Herdier,85.110.90.45.90.80:normal:Stoutland,41.50.37.50.37.66:siniestro:Purrloin,64.88.50.88.50.106:siniestro:Liepard,50.53.48.53.48.64:planta:Pansage,75.98.63.98.63.101:planta:Simisage,50.53.48.53.48.64:fuego:Pansear,75.98.63.98.63.101:fuego:Simisear,50.53.48.53.48.64:agua:Panpour,75.98.63.98.63.101:agua:Simipour,76.25.45.67.55.24:psiquico:Munna,116.55.85.107.95.29:psiquico:Musharna,50.55.50.36.30.43:normal/volador:Pidove,62.77.62.50.42.65:normal/volador:Tranquill,80.115.80.65.55.93:normal/volador:Unfezant,45.60.32.50.32.76:electrico:Blitzle,75.100.63.80.63.116:electrico:Zebstrika,55.75.85.25.25.15:roca:Roggenrola,70.105.105.50.40.20:roca:Boldore,85.135.130.60.80.25:roca:Gigalith,65.45.43.55.43.72:psiquico/volador:Woobat,67.57.55.77.55.114:psiquico/volador:Swoobat,60.85.40.30.45.68:tierra:Drilbur,110.135.60.50.65.88:tierra/acero:Excadrill,103.60.86.60.86.50:normal:Audino,75.80.55.25.35.35:lucha:Timburr,85.105.85.40.50.40:lucha:Gurdurr,105.140.95.55.65.45:lucha:Conkeldurr,50.50.40.50.40.64:agua:Tympole,75.65.55.65.55.69:agua/tierra:Palpitoad,105.95.75.85.75.74:agua/tierra:Seismitoad,120.100.85.30.85.45:lucha:Throh,75.125.75.30.75.85:lucha:Sawk,45.53.70.40.60.42:bicho/planta:Sewaddle,55.63.90.50.80.42:bicho/planta:Swadloon,75.103.80.70.80.92:bicho/planta:Leavanny,30.45.59.30.39.57:bicho/veneno:Venipede,40.55.99.40.79.47:bicho/veneno:Whirlipede,60.100.89.55.69.112:bicho/veneno:Scolipede,40.27.60.37.50.66:planta/hada:Cottonee,60.67.85.77.75.116:planta/hada:Whimsicott,45.35.50.70.50.30:planta:Petilil,70.60.75.110.75.90:planta:Lilligant,70.92.65.80.55.98:agua:Basculin,50.72.35.35.35.65:tierra/siniestro:Sandile,60.82.45.45.45.74:tierra/siniestro:Krokorok,95.117.80.65.70.92:tierra/siniestro:Krookodile,70.90.45.15.45.50:fuego:Darumaka,105.140.55.30.55.95:fuego:Darmanitan,75.86.67.106.67.60:planta:Maractus,50.65.85.35.35.55:bicho/roca:Dwebble,70.105.125.65.75.45:bicho/roca:Crustle,50.75.70.35.70.48:siniestro/lucha:Scraggy,65.90.115.45.115.58:siniestro/lucha:Scrafty,72.58.80.103.80.97:psiquico/volador:Sigilyph,38.30.85.55.65.30:fantasma:Yamask,58.50.145.95.105.30:fantasma:Cofagrigus,54.78.103.53.45.22:agua/roca:Tirtouga,74.108.133.83.65.32:agua/roca:Carracosta,55.112.45.74.45.70:roca/volador:Archen,75.140.65.112.65.110:roca/volador:Archeops,50.50.62.40.62.65:veneno:Trubbish,80.95.82.60.82.75:veneno:Garbodor,40.65.40.80.40.65:siniestro:Zorua,60.105.60.120.60.105:siniestro:Zoroark,55.50.40.40.40.75:normal:Minccino,75.95.60.65.60.115:normal:Cinccino,45.30.50.55.65.45:psiquico:Gothita,60.45.70.75.85.55:psiquico:Gothorita,70.55.95.95.110.65:psiquico:Gothitelle,45.30.40.105.50.20:psiquico:Solosis,65.40.50.125.60.30:psiquico:Duosion,110.65.75.125.85.30:psiquico:Reuniclus,62.44.50.44.50.55:agua/volador:Ducklett,75.87.63.87.63.98:agua/volador:Swanna,36.50.50.65.60.44:hielo:Vanillite,51.65.65.80.75.59:hielo:Vanillish,71.95.85.110.95.79:hielo:Vanilluxe,60.60.50.40.50.75:normal/planta:Deerling,80.100.70.60.70.95:normal/planta:Sawsbuck,55.75.60.75.60.103:electrico/volador:Emolga,50.75.45.40.45.60:bicho:Karrablast,70.135.105.60.105.20:bicho/acero:Escavalier,69.55.45.55.55.15:planta/veneno:Foongus,114.85.70.85.80.30:planta/veneno:Amoonguss,55.40.50.65.85.40:agua/fantasma:Frillish,100.60.70.85.105.60:agua/fantasma:Jellicent,165.75.80.40.45.65:agua:Alomomola,50.47.50.57.50.65:bicho/electrico:Joltik,70.77.60.97.60.108:bicho/electrico:Galvantula,44.50.91.24.86.10:planta/acero:Ferroseed,74.94.131.54.116.20:planta/acero:Ferrothorn,40.55.70.45.60.30:acero:Klink,60.80.95.70.85.50:acero:Klang,60.100.115.70.85.90:acero:Klinklang,35.55.40.45.40.60:electrico:Tynamo,65.85.70.75.70.40:electrico:Eelektrik,85.115.80.105.80.50:electrico:Eelektross,55.55.55.85.55.30:psiquico:Elgyem,75.75.75.125.95.40:psiquico:Beheeyem,50.30.55.65.55.20:fantasma/fuego:Litwick,60.40.60.95.60.55:fantasma/fuego:Lampent,60.55.90.145.90.80:fantasma/fuego:Chandelure,46.87.60.30.40.57:dragon:Axew,66.117.70.40.50.67:dragon:Fraxure,76.147.90.60.70.97:dragon:Haxorus,55.70.40.60.40.40:hielo:Cubchoo,95.130.80.70.80.50:hielo:Beartic,80.50.50.95.135.105:hielo:Cryogonal,50.40.85.40.65.25:bicho:Shelmet,80.70.40.100.60.145:bicho:Accelgor,109.66.84.81.99.32:tierra/electrico:Stunfisk,45.85.50.55.50.65:lucha:Mienfoo,65.125.60.95.60.105:lucha:Mienshao,77.120.90.60.90.48:dragon:Druddigon,59.74.50.35.50.35:tierra/fantasma:Golett,89.124.80.55.80.55:tierra/fantasma:Golurk,45.85.70.40.40.60:siniestro/acero:Pawniard,65.125.100.60.70.70:siniestro/acero:Bisharp,95.110.95.40.95.55:normal:Bouffalant,70.83.50.37.50.60:normal/volador:Rufflet,100.123.75.57.75.80:normal/volador:Braviary,70.55.75.45.65.60:siniestro/volador:Vullaby,110.65.105.55.95.80:siniestro/volador:Mandibuzz,85.97.66.105.66.65:fuego:Heatmor,58.109.112.48.48.109:bicho/acero:Durant,52.65.50.45.50.38:siniestro/dragon:Deino,72.85.70.65.70.58:siniestro/dragon:Zweilous,92.105.90.125.90.98:siniestro/dragon:Hydreigon,55.85.55.50.55.60:bicho/fuego:Larvesta,85.60.65.135.105.100:bicho/fuego:Volcarona,91.90.129.90.72.108:acero/lucha:Cobalion*,91.129.90.72.90.108:roca/lucha:Terrakion*,91.90.72.90.129.108:planta/lucha:Virizion*,79.115.70.125.80.111:volador:Tornadus*,79.115.70.125.80.111:electrico/volador:Thundurus*,100.120.100.150.120.90:dragon/fuego:Reshiram*,100.150.120.120.100.90:dragon/electrico:Zekrom*,89.125.90.115.80.101:tierra/volador:Landorus*,125.130.90.130.90.95:dragon/hielo:Kyurem*,91.72.90.129.90.108:agua/lucha:Keldeo*,100.77.77.128.128.90:normal/psiquico:Meloetta*,71.120.95.120.95.99:bicho/acero:Genesect*';

  /* ═══════════════════════════════════════════════════════════════════════════════════════════════════
   *  CIUDAD NEGRA · asistente con aprendizaje (/ciudad-negra)
   *
   *  Cómo está hecho (de abajo arriba):
   *   1. MODELO     combate por turnos con las fórmulas del juego (comprobadas con sus propios registros de combate),
   *                 más lo que se va aprendiendo: cuánto más pegan de verdad los rivales y los tuyos.
   *   2. SABER      lo aprendido (nivel de los rivales por piso, qué especies salen en cada barrio, cuántos niveles da
   *                 cada puerta, qué dan los misterios, qué venden las tiendas) se guarda en el navegador.
   *   3. LECTOR     lee el estado de la partida directamente de la pantalla del juego (equipo, puertas, tienda…).
   *   4. DECISIONES equipo (mejor cuarteto para la norma de la semana), puerta, compra, bendición y orden de salida: cada
   *                 opción se juega muchas veces por delante (Monte Carlo) y se elige la que más cerca deja de ganar al
   *                 siguiente guardián sin arriesgar la bajada.
   *   5. PILOTO     juega solo la bajada (y los intentos que quieras) y se para ante lo que no conoce.
   * ═══════════════════════════════════════════════════════════════════════════════════════════════════ */
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const pausa = (a, b) => sleep(a + Math.random() * (b - a));
  const texto = el => (el && el.textContent || '').replace(/\s+/g, ' ').trim();
  const norm = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  const visible = el => !!el && el.getClientRects().length > 0;
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } };
  const lsPut = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const media = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
  const pct = x => Math.round(x * 100) + '%';
  const enCN = () => /^\/ciudad-negra(\/|$)/.test(location.pathname);
  const PANEL_ID = 'acn-panel';
  const ajeno = el => !!(el.closest('#' + PANEL_ID) || el.closest('#k-avisos') || el.closest('[data-ax-ignore]'));

  /* ─── Tipos (el juego: muy eficaz ×1,65 y poco eficaz ×0,6 por cada tipo) ─── */
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
  const eficacia = (t, tipos) => tipos.reduce((m, x) => { const v = (TABLA[t] || {})[x] ?? 1; return m * (v === 0 ? 0 : v > 1 ? 1.65 : v < 1 ? 0.6 : 1); }, 1);
  const tipoDe = t => { const n = norm(t).replace(/[^a-z]/g, ''); return n && n.length <= 10 ? n : null; };

  /* ─── Pokédex 1-649: base PS.ATQ.DEF.ATE.DFE.VEL : tipos : nombre (* legendario/singular) ─── */
  const DEX = {}, DEX_NOMBRE = {};
  DEX_DATOS.split(',').forEach((x, i) => {
    const [s, t, n] = x.split(':');
    const leg = n.endsWith('*'), nombre = leg ? n.slice(0, -1) : n;
    DEX[i + 1] = { num: i + 1, s: s.split('.').map(Number), t: t.split('/'), nombre, leg };
    DEX_NOMBRE[norm(nombre)] = i + 1;
  });

  /* ─── Los seis barrios (cinco pisos cada uno; el quinto es el guardián; tras el sexto se vuelve al primero, más fuerte) ─── */
  const BARRIOS = [
    { id: 'bosque', tipos: ['planta', 'bicho', 'normal'] },
    { id: 'neon', tipos: ['siniestro', 'veneno', 'electrico'] },
    { id: 'lago', tipos: ['agua', 'hielo', 'volador'] },
    { id: 'torres', tipos: ['acero', 'psiquico', 'fantasma'] },
    { id: 'claro', tipos: ['fuego', 'dragon', 'hada'] },
    { id: 'mercado', tipos: ['lucha', 'roca', 'tierra'] },
  ];
  const barrioDePiso = piso => BARRIOS[Math.floor((Math.max(1, piso) - 1) / 5) % 6];
  // rivales posibles de un barrio: especies de Teselia (494-649) no legendarias de sus tipos
  const POOLS = {};
  for (const b of BARRIOS) POOLS[b.id] = Object.values(DEX).filter(d => d.num >= 494 && d.num <= 649 && !d.leg && d.t.some(t => b.tipos.includes(t)));

  /* ─── Estadísticas: PS = 3·base·Nv/100 + Nv + 14 · resto = 2·base·Nv/100 + 5 · una sola «Especial» (media de At. Esp. y
   *     Def. Esp.). Comprobado con los PS de cada Pokémon y rival que enseña el juego. ─── */
  function stats(b, L) {
    const st = x => Math.floor(2 * x * L / 100) + 5;
    const esp = Math.round((b[3] + b[4]) / 2);
    return { hp: Math.floor(3 * b[0] * L / 100) + L + 14, atk: st(b[1]), def: st(b[2]), esp: st(esp), spe: st(b[5]), fis: b[1] > esp };
  }
  const CS = ['atk', 'def', 'esp', 'spe'];
  // Un luchador. m: multiplicadores {atk, def, esp, spe} (bendiciones y reglas del barrio). vida: fracción de PS (0..1)
  function luchador(num, L, mio, m, vida = 1) {
    const d = DEX[num], st = stats(d.s, L);
    const x = { num, nombre: d.nombre, L, tipos: d.t, mio, fis: st.fis, hp: st.hp, raw: { atk: st.atk, def: st.def, esp: st.esp, spe: st.spe }, atk: st.atk, def: st.def, esp: st.esp, spe: st.spe, vida };
    if (m) for (const c of CS) x[c] = st[c] * (m[c] || 1);
    return x;
  }

  /* ─── Daño. ((2·Nv/5+2)·30,5·A/D/50 + 2) · 1,5 si es de su tipo · eficacia · ajuste aprendido · regla del barrio ─── */
  function danoBase(A, D, tipo, fis) {
    const a = fis ? A.atk : A.esp, d = fis ? D.def : D.esp;
    return ((2 * A.L / 5 + 2) * 30.5 * a / Math.max(1, d) / 50 + 2) * (A.tipos.includes(tipo) ? 1.5 : 1) * eficacia(tipo, D.tipos);
  }
  // Cómo ataca el juego (visto en sus registros): con el más eficaz de sus tipos; físico o especial según sus estadísticas
  function mejorAtaque(A, D) {
    let m = null;
    for (const t of A.tipos) { const e = eficacia(t, D.tipos); if (!m || e > m.e) m = { t, e }; }
    let fis = A.fis;
    if (m.e < 1) { const en = eficacia('normal', D.tipos); if (en > m.e) { m = { t: 'normal', e: en }; fis = true; } }
    if (m.e === 0) return D.hp / 16;
    return danoBase(A, D, m.t, fis);
  }
  const TOPE_GOLPES = 150;
  // Un combate: pelean los tres primeros que sigan en pie; el que gana sigue con lo que le queda. rng: dados (o null →
  // cuenta media). ctx: { kM, kR (ajuste aprendido de lo que pega cada lado), aguante, rivalDano (×), }
  // Devuelve { gana, tumbados, caidos } y deja la vida de los tuyos en `mios` (fracción).
  function combate(mios, rivales, ctx, rng) {
    const A = mios.filter(x => x.vida > 0).slice(0, 3), B = rivales.map(x => ({ l: x, v: 1 }));
    const kM = ctx.kM || 1, kR = (ctx.kR || 1) * (ctx.rivalDano || 1);
    const memo = new Map();
    const dano = (x, y, k) => { const key = x.nombre + x.L + (x.mio ? 'm' : 'r') + '>' + y.nombre + y.L; let d = memo.get(key); if (d === undefined) memo.set(key, (d = mejorAtaque(x, y) * k / y.hp)); return d; };
    const tirada = () => rng ? (0.85 + 0.3 * rng()) * (rng() < 0.09 ? 1.5 : 1) : 1.04;
    let i = 0, j = 0, golpes = 0, aguante = !!ctx.aguante;
    const golpeA = () => { golpes++; B[j].v -= dano(A[i], B[j].l, kM) * tirada(); if (B[j].v <= 0) j++; };
    const golpeB = () => {
      golpes++;
      A[i].vida -= dano(B[j].l, A[i], kR) * tirada();
      if (A[i].vida <= 0) { if (aguante) { A[i].vida = 1 / A[i].hp; aguante = false; } else { A[i].vida = 0; i++; } }
    };
    while (i < A.length && j < B.length && golpes < TOPE_GOLPES) {
      const a = A[i], b = B[j].l;
      const primero = a.spe > b.spe || (a.spe === b.spe && (rng ? rng() < 0.5 : true));
      if (primero) { golpeA(); if (j < B.length && B[j].l === b && golpes < TOPE_GOLPES) golpeB(); }
      else { golpeB(); if (i < A.length && A[i] === a && golpes < TOPE_GOLPES) golpeA(); }
    }
    return { gana: j >= B.length, tumbados: j, caidos: A.filter(x => x.vida <= 0).length };
  }
  const rngDe = seed => { let s = (seed >>> 0) || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };

  /* ══════════ 2 · SABER (lo aprendido, en el navegador) ══════════ */
  const KB_KEY = 'acn-kb';
  const kb = (() => {
    const d = lsGet(KB_KEY, null) || {};
    return { v: 1, k: {}, niv: { combate: [], elite: [], guardian: [] }, ganan: {}, esp: {}, evt: {}, tienda: {}, runs: [], pisos: {}, semana: '', ...d };
  })();
  let kbT = 0;
  const guardaKb = (ya = false) => { clearTimeout(kbT); if (ya) { lsPut(KB_KEY, kb); return; } kbT = setTimeout(() => lsPut(KB_KEY, kb), 600); };
  // diario compacto (los últimos 400 apuntes) para poder revisarlo
  const DIARIO_KEY = 'acn-diario';
  const apunta = o => { const d = lsGet(DIARIO_KEY, []); d.push({ t: Date.now(), ...o }); while (d.length > 400) d.shift(); lsPut(DIARIO_KEY, d); };

  // Nivel de los rivales por piso y tipo de puerta: recta por mínimos cuadrados con lo visto (y unos puntos de partida)
  const NIV_PRIOR = { combate: [[2, 6.4], [5, 14.6], [10, 28.2], [20, 55.4], [30, 82.6], [34, 86]], elite: [[3, 12.5], [6, 21], [10, 33]], guardian: [[5, 14], [10, 26.5], [15, 40], [20, 52.3], [25, 63.7], [30, 77], [35, 91.3]] };
  const memoNiv = {};
  function nivelRival(piso, tipo) {
    const t = NIV_PRIOR[tipo] ? tipo : 'combate';
    const obs = kb.niv[t] || [];
    let m = memoNiv[t];
    if (!m || m.n !== obs.length) {
      const pts = [...NIV_PRIOR[t].map(p => [p[0], p[1], 1]), ...obs.map(p => [p[0], p[1], 2])];
      let sw = 0, sx = 0, sy = 0, sxx = 0, sxy = 0;
      for (const [x, y, w] of pts) { sw += w; sx += w * x; sy += w * y; sxx += w * x * x; sxy += w * x * y; }
      const den = sw * sxx - sx * sx, b = den > 0 ? (sw * sxy - sx * sy) / den : 2.7, a = (sy - b * sx) / sw;
      m = memoNiv[t] = { n: obs.length, a, b };
    }
    return Math.max(1, Math.round(m.a + m.b * piso));
  }
  // Ajuste del daño por lado y tramo de 10 pisos (lo que pega cada uno de verdad frente a la fórmula)
  const K_PRIOR = { m: [0.94, 0.84, 0.55, 0.4, 0.38, 0.36], r: [0.9, 1.0, 1.35, 2.3, 2.5, 2.6] };
  const tramoK = piso => clamp(Math.floor(Math.max(1, piso) / 10), 0, 5);
  function kLado(lado, piso) {
    const t = tramoK(piso), prior = K_PRIOR[lado][t], c = kb.k[lado + t];
    if (!c) return prior;
    const w = 12;
    return (c.s + prior * w) / (c.n + w);
  }
  const ganaNiv = tipo => { const g = kb.ganan[tipo]; const prior = { combate: 3, elite: 4.5, guardian: 4, evento: 1.5 }[tipo] ?? 0; if (!g || !g.n) return prior; return (g.s + prior * 3) / (g.n + 3); };
  const apuntaGana = (tipo, d) => { const g = kb.ganan[tipo] || (kb.ganan[tipo] = { n: 0, s: 0 }); g.n++; g.s += d; guardaKb(); };

  /* Bendiciones: lo que suman a las estadísticas, leído de su propio texto («+12% de Ataque y de Especial a todo el equipo»).
   * Las que no suben estadísticas (Aguante, Brasas Vivas…) se reconocen por su id. */
  const STAT_PAL = [['velocidad', 'spe'], ['ataque', 'atk'], ['defensa', 'def'], ['especial', 'esp']];
  function efectoTexto(t) {
    const s = norm(t), out = {}; let hay = false;
    const ms = [...s.matchAll(/([+-])\s*(\d+)\s*%/g)];
    ms.forEach((m, i) => {
      const fin = i + 1 < ms.length ? ms[i + 1].index : s.length;
      const seg = s.slice(m.index + m[0].length, fin).split(/[.;]/)[0];
      for (const [w, c] of STAT_PAL) if (new RegExp('\\b' + w).test(seg)) { out[c] = (out[c] || 0) + (m[1] === '-' ? -1 : 1) * +m[2] / 100; hay = true; }
    });
    return hay ? out : null;
  }
  // multiplicadores del equipo y ventajas especiales según las bendiciones que llevas
  function bendiciones(lista) {
    const r = { m: { atk: 1, def: 1, esp: 1, spe: 1 }, aguante: false, brasas: 0, n: {} };
    for (const b of lista || []) {
      r.n[b.id] = (r.n[b.id] || 0) + 1;
      const ef = efectoTexto(b.texto);
      if (ef) for (const [c, v] of Object.entries(ef)) r.m[c] += v;
      else if (/aguante/.test(b.id)) r.aguante = true;
      else if (/hoguera|brasas/.test(b.id)) r.brasas++;
    }
    return r;
  }
  // reglas del barrio (de su cabecera): [tus Pokémon de tipo X van un N% más fuertes], [los rivales pegan un N% más]
  function reglasBarrio(bar) {
    const t = norm(bar && bar.regla || ''), r = { tipoMio: null, rivalDano: 1, cura: 0, pares: false };
    let m;
    if ((m = t.match(/de tipo ([a-z]+) y ([a-z]+) van un (\d+)% mas fuertes/))) r.tipoMio = { tipos: [m[1], m[2]], x: 1 + m[3] / 100 };
    if ((m = t.match(/rivales pegan un (\d+)% mas/))) r.rivalDano = 1 + m[1] / 100;
    if ((m = t.match(/tipo ([a-z]+) y ([a-z]+), tambien/))) r.tipoMio = { tipos: [m[1], m[2]], x: r.rivalDano };
    if ((m = t.match(/recupera un (\d+)% de ps/))) r.cura = m[1] / 100;
    if (/de dos en dos/.test(t)) r.pares = true;
    return r;
  }
  // Un luchador tuyo a partir de una ficha de la partida
  function mioDe(e, bend, regla) {
    const num = e.speciesId || DEX_NOMBRE[norm(e.nombre)];
    if (!DEX[num]) return null;
    const m = { ...bend.m };
    const x = luchador(num, e.nivel, true, m, e.hpMax ? e.hp / e.hpMax : 1);
    if (regla && regla.tipoMio && x.tipos.some(t => regla.tipoMio.tipos.includes(t))) for (const c of CS) x[c] *= regla.tipoMio.x;
    x.refId = e.refId; x.hpReal = e.hp; x.hpMaxReal = e.hpMax; x.cayo = !!e.cayo;
    return x;
  }

  /* ══════════ 3 · LECTOR (el estado de la partida, directo de la pantalla del juego) ══════════ */
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
  function leerJuego() {
    const el = $$('main button').find(b => !ajeno(b)) || $$('main li').find(b => !ajeno(b)) || document.querySelector('main');
    let f = actual(fibraDe(el));
    for (let i = 0; f && i < 90; f = f.return, i++) {
      if (typeof f.type === 'function' && f.memoizedState) {
        const v = f.memoizedState.memoizedState;
        if (v && typeof v === 'object' && 'abierta' in v && 'intentosUsados' in v) {
          const ev = f.memoizedState.next && f.memoizedState.next.memoizedState;
          return { E: v, ev: Array.isArray(ev) ? ev : [] };
        }
      }
    }
    return null;
  }
  // una firma corta de la pantalla, para saber cuándo ha cambiado algo
  const firma = J => !J ? 'x' : JSON.stringify([J.ev.length, J.ev[0] && (J.ev[0].tipo + (J.ev[0].titulo || '')), J.E.intentosUsados, J.E.partida && [J.E.partida.piso, J.E.partida.pendiente && J.E.partida.pendiente.tipo, J.E.partida.equipo.map(e => e.hp + '/' + e.nivel + '/' + e.refId).join(), (J.E.partida.puertas || []).map(p => p.tipo).join(), (J.E.partida.bendiciones || []).length, J.E.partida.gastado]]);

  /* ══════════ 4 · DECISIONES (cada opción se juega por delante muchas veces) ══════════ */
  const CUENTA_PRIOR = { combate: 1, elite: 2, guardian: 3 };
  const cuentaRivales = (tipo, pares) => {
    const c = kb.cnt && kb.cnt[tipo + (pares ? '|p' : '')];
    if (c && c.n >= 2) return Math.max(1, Math.round(c.s / c.n));
    return (CUENTA_PRIOR[tipo] || 1) + (pares && tipo !== 'guardian' ? 1 : 0);
  };
  // Estado compacto de la partida (lo que hace falta para jugar hacia delante)
  function estadoDe(P, dinero) {
    return {
      piso: P.piso, pb: P.pisoEnBarrio, dinero: dinero || 0,
      eq: P.equipo.map(e => ({ num: e.speciesId || DEX_NOMBRE[norm(e.nombre)], L: e.nivel, vida: e.hpMax ? e.hp / e.hpMax : 1, nombre: e.nombre, refId: e.refId, hp: e.hp, hpMax: e.hpMax })),
      bl: (P.bendiciones || []).map(b => ({ id: b.id, texto: b.texto })), bend: bendiciones(P.bendiciones), barrio: P.barrio, regla: reglasBarrio(P.barrio),
    };
  }
  const clonar = S => ({ ...S, eq: S.eq.map(x => ({ ...x })) });
  function luchadoresDe(S) {
    return S.eq.map(e => {
      const x = luchador(e.num, e.L, true, S.bend.m, e.vida);
      if (S.regla.tipoMio && x.tipos.some(t => S.regla.tipoMio.tipos.includes(t))) for (const c of CS) x[c] *= S.regla.tipoMio.x;
      return x;
    });
  }
  const POND = {};
  function especieAl(barrioId, rng) {
    const pool = POOLS[barrioId], obs = kb.esp[barrioId] || {};
    let tot = 0; const w = pool.map(d => { const v = 1 + (obs[d.nombre] || 0) * 2; tot += v; return v; });
    let r = rng() * tot, i = 0; while (i < pool.length - 1 && (r -= w[i]) > 0) i++;
    return pool[i];
  }
  function rivalesDe(piso, tipo, rng, regla) {
    const bar = barrioDePiso(piso), n = cuentaRivales(tipo, regla && regla.pares), base = nivelRival(piso, tipo);
    const out = [];
    for (let i = 0; i < n; i++) out.push(luchador(especieAl(bar.id, rng).num, Math.max(1, base + Math.round((rng() - 0.5) * 2)), false, null, 1));
    return out;
  }
  // Juega la puerta `tipo` N veces con los mismos dados para cualquier opción. Devuelve la probabilidad de ganar y cómo
  // queda el equipo de media cuando se gana.
  function simula(S, tipo, N = 30, seed = 1) {
    const kM = kLado('m', S.piso), kR = kLado('r', S.piso);
    const ctx = { kM, kR, aguante: S.bend.aguante, rivalDano: S.regla.rivalDano };
    let gana = 0, caidos = 0; const vidas = S.eq.map(() => 0), contaV = S.eq.map(() => 0);
    for (let k = 0; k < N; k++) {
      const rng = rngDe(seed * 7919 + k * 104729 + S.piso * 13);
      const mios = luchadoresDe(S), riv = rivalesDe(S.piso, tipo, rng, S.regla);
      const r = combate(mios, riv, ctx, rng);
      caidos += r.caidos;
      if (r.gana) { gana++; mios.forEach((x, i) => { vidas[i] += x.vida; contaV[i]++; }); }
    }
    const D = clonar(S);
    D.piso = S.piso + 1; D.pb = S.pb >= 5 ? 1 : S.pb + 1;
    const g = ganaNiv(tipo);
    D.eq.forEach((e, i) => { e.vida = contaV[i] ? clamp(vidas[i] / contaV[i] + S.regla.cura, 0, 1) : 0; e.L = Math.round(e.L + g); });
    return { pW: gana / N, caidos: caidos / N, despues: D };
  }
  function curarEstado(S, frac, reviveFrac) {
    const D = clonar(S);
    D.eq.forEach(e => { e.vida = e.vida > 0 ? Math.min(1, e.vida + frac) : Math.min(1, reviveFrac ?? frac * 0.9); });
    D.piso = S.piso + 1; D.pb = S.pb >= 5 ? 1 : S.pb + 1;
    return D;
  }
  // ¿Se gana el guardián que viene? Con las bendiciones y los niveles que se espera tener cuando llegue (se pelea cada
  // piso que falta y los de la hoguera/descansos devuelven algo de vida por el camino)
  function listoGuardian(S, N = 24) {
    // S ya está en el piso siguiente a la puerta: faltan (5 − S.pb) pisos antes del guardián, que está en S.piso + (5 − S.pb)
    const faltan = Math.max(0, 5 - S.pb), D = clonar(S);
    D.piso = S.piso + faltan;
    const gl = ganaNiv('combate') * faltan * 0.9;
    D.eq.forEach(e => { e.L = Math.round(e.L + gl); e.vida = e.vida > 0 ? Math.min(1, e.vida + 0.1 * faltan) : Math.min(1, 0.35 + 0.1 * faltan); });
    return simula(D, 'guardian', N, 5).pW;
  }
  // Valor de quedar en el estado S: lo cerca que se está de ganar el siguiente guardián + un poquito por tener más nivel
  const valorEstado = (S, N) => listoGuardian(S, N);

  // Cada puerta: probabilidad de pasarla y valor del estado en el que se queda el equipo
  function evaluaPuertas(S, puertas) {
    const out = [];
    const qActual = valorEstado(S, 16);
    const lamb = 0.02;
    let gen = null;
    for (const p of puertas) {
      let r = { p, tipo: p.tipo };
      if (p.tipo === 'combate' || p.tipo === 'elite' || p.tipo === 'guardian') {
        const s = simula(S, p.tipo, 36, 3);
        const q = valorEstado(s.despues, 24);
        r.pW = s.pW; r.caidos = s.caidos; r.q = q; r.u = s.pW * (q + lamb * ganaNiv(p.tipo)); r.nota = `gano ≈ ${pct(s.pW)}, guardián ≈ ${pct(q)}`;
      } else if (p.tipo === 'descanso') {
        const D = curarEstado(S, 0.4 * (1 + S.bend.brasas), 0.5 + (S.bend.brasas ? 0.1 : 0));
        const q = valorEstado(D, 24);
        r.pW = 1; r.q = q; r.u = q; r.nota = `curo y llego al guardián ≈ ${pct(q)}`;
      } else if (p.tipo === 'tienda') {
        const mejor = mejorCompra(S, null, true);
        r.pW = 1; r.q = mejor ? mejor.q : qActual; r.u = r.q * 0.985; r.nota = mejor ? `tienda: ${mejor.nombre}, guardián ≈ ${pct(r.q)}` : 'tienda';
      } else if (p.tipo === 'evento') {
        const D = clonar(S); D.piso = S.piso + 1; D.pb = S.pb >= 5 ? 1 : S.pb + 1;
        D.eq.forEach(e => { e.L = Math.round(e.L + ganaNiv('evento')); if (e.vida > 0) e.vida = Math.min(1, e.vida + 0.1); });
        const q = valorEstado(D, 24);
        r.pW = 0.98; r.q = q; r.u = 0.97 * q; r.nota = `misterio, guardián ≈ ${pct(q)}`;
      } else {
        // puerta tapada (Apagón) o de un tipo nuevo: se valora por lo que suele haber detrás
        if (!gen) gen = evaluaPuertas(S, ['combate', 'elite', 'descanso', 'tienda', 'evento'].map((t, i) => ({ i, tipo: t, nombre: t })));
        const W = { combate: 0.4, elite: 0.15, descanso: 0.15, tienda: 0.1, evento: 0.2 };
        let u = 0, pw = 0, q = 0;
        for (const g of gen) { u += W[g.tipo] * g.u; pw += W[g.tipo] * g.pW; q += W[g.tipo] * g.q; }
        r.pW = pw; r.q = q; r.u = u * 0.97; r.nota = `puerta tapada: de media, guardián ≈ ${pct(q)}`;
      }
      out.push(r);
    }
    // Puertas tapadas (Apagón): se valoran por lo que suele salir
    return out.sort((a, b) => b.u - a.u || b.pW - a.pW);
  }
  const OCULTA = p => /^(\?|¿\?|oculta|puerta)/i.test(p.nombre || '') && !/combate|elite|élite|descanso|tienda|guardi|misterio/i.test(p.nombre || '') || p.tipo === 'oculta' || p.tipo === 'desconocida';

  // Compras de la tienda. opciones: [{id, nombre, texto, precio, noDisponible}]
  function mejorCompra(S, opciones, hipotetica) {
    if (restanteTienda() <= 0) return null;       // sin tope de gasto no se compra nada
    const reserva = reservaDinero();
    const ops = hipotetica ? [{ id: 'hiperpocion', nombre: 'Hiperpoción', precio: 4000 }, { id: 'amuleto', nombre: 'Amuleto', precio: 9000 }, { id: 'cinta', nombre: 'Cinta de Campeón', precio: 18000 }] : opciones;
    let mejor = null;
    const base = valorEstado(S, 24);
    for (const o of ops) {
      if (o.noDisponible) continue;
      if (S.dinero - o.precio < reserva) continue;
      if (o.precio > restanteTienda()) continue;   // tope de gasto en tiendas por bajada (0 por defecto: no se compra nada)
      const D = efectoCompra(S, o, hipotetica);
      if (!D) continue;
      const q = valorEstado(D, 24);
      const u = q + 0.0000001 * (o.precio ? 0 : 0);
      if (!mejor || u > mejor.q + 0.004 || (Math.abs(u - mejor.q) <= 0.004 && o.precio > mejor.precio)) mejor = { ...o, q: u, base };
    }
    return mejor;
  }
  // Qué le hace una compra al equipo (se entiende por su texto: «Todo el equipo recupera un 50% de PS», bendiciones…)
  const BEND_CINTA = ['furia', 'piel-dura', 'viento'];
  const BEND_TEXTO = { furia: '+12% de Ataque y de Especial', 'piel-dura': '+15% de Defensa', viento: '+15% de Velocidad' };
  function conBendicion(S, id, texto) {
    const D = clonar(S);
    D.bl = [...(S.bl || []), { id, texto: texto || BEND_TEXTO[id] || '' }];
    D.bend = bendiciones(D.bl);
    return D;
  }
  function efectoCompra(S, o, avanza) {
    const sig = D => { if (avanza) { D.piso = S.piso + 1; D.pb = S.pb >= 5 ? 1 : S.pb + 1; } return D; };
    const t = norm((o.texto || '') + ' ' + o.nombre + ' ' + o.id);
    let m;
    if ((m = t.match(/recupera(?:n)? un (\d+)% de ps/)) || /pocion/.test(t)) {
      const f = m ? m[1] / 100 : 0.5, D = clonar(S);
      D.eq.forEach(e => { if (e.vida > 0) e.vida = Math.min(1, e.vida + f); });
      return sig(D);
    }
    if (/revivir|revive/.test(t)) {
      const D = clonar(S); D.eq.forEach(e => { if (e.vida <= 0) e.vida = 0.5; }); return sig(D);
    }
    if (/cinta/.test(t) || /tres bendiciones/.test(t)) {
      let D = clonar(S);
      for (const b of BEND_CINTA) D = conBendicion(D, b);
      return sig(D);
    }
    if (/amuleto|eliges una bendicion/.test(t)) {
      // se elige la mejor de tres al azar: se valora como la media de las tres típicas
      let D = clonar(S);
      D = conBendicion(D, 'furia'); return sig(D);
    }
    if (/caramelo/.test(t)) { const D = clonar(S); D.eq.forEach(e => { e.L += 1; }); return sig(D); }
    return null;
  }
  // el dinero que se deja sin gastar: lo que cuesten los intentos de pago que queden por jugar
  function reservaDinero() {
    const o = conf, E = estadoJuego;
    let r = o.reserva || 0;
    if (E) {
      const usados = E.intentosUsados, max = E.intentosMax;
      const costes = [0, 0, 0, 10000, 25000];
      if (o.pago) for (let i = usados + 1; i < max; i++) r += costes[i] || 0;
    }
    return r;
  }

  // Bendición a elegir: la que más deja la preparación para el guardián (más un pequeño extra por lo que no se ve en la prueba)
  function mejorBendicion(S, opciones) {
    let mejor = null;
    for (let i = 0; i < opciones.length; i++) {
      const o = opciones[i];
      const D = conBendicion(S, o.id, o.texto);
      let q = valorEstado(D, 28);
      if (/hoguera|brasas/.test(o.id)) q += 0.02 / (1 + S.bend.brasas);
      if (/aguante/.test(o.id) && S.bend.aguante) q -= 0.5;
      if (!mejor || q > mejor.q) mejor = { i, o, q };
    }
    return mejor;
  }

  // Orden de salida: se prueban los órdenes posibles de los que siguen en pie (los tres primeros pelean) contra la puerta elegida
  function mejorOrden(S, tipo, N = 16) {
    const vivos = S.eq.map((e, i) => i).filter(i => S.eq[i].vida > 0), muertos = S.eq.map((e, i) => i).filter(i => S.eq[i].vida <= 0);
    if (vivos.length < 2) return null;
    const perms = [];
    const gen = (arr, k, cur) => { if (cur.length === k) { perms.push([...cur]); return; } for (const x of arr) if (!cur.includes(x)) { cur.push(x); gen(arr, k, cur); cur.pop(); } };
    gen(vivos, Math.min(3, vivos.length), []);
    let mejor = null;
    for (const p of perms) {
      const resto = vivos.filter(i => !p.includes(i));
      const orden = [...p, ...resto, ...muertos];
      const D = clonar(S); D.eq = orden.map(i => S.eq[i]);
      const s = simula(D, tipo, N, 11);
      const nota = s.pW * 100 - s.caidos;
      if (!mejor || nota > mejor.nota + 0.01) mejor = { orden, nota, pW: s.pW };
    }
    const actual = vivos.slice(0, 3).concat(vivos.slice(3), muertos);
    return mejor && mejor.orden.map(i => S.eq[i].refId).join() !== S.eq.map(e => e.refId).join() ? mejor : { orden: null, pW: mejor && mejor.pW };
  }

  /* ─── Equipo para la norma de la semana ─── */
  const LEGEND = n => !!(DEX[n] && DEX[n].leg);
  function valeNorma(nombre, num) {
    // lo que dice el propio juego (noVale) manda; esto solo es para ordenar si falta
    return true;
  }
  // Los cuatro que mejor bajan: se prueban los trios contra rivales de los seis barrios a niveles medios
  function mejorEquipo(cands, plazas = 4, valida = () => true) {
    const L = 40;
    const lista = cands.filter(c => DEX[c.speciesId]).map(c => ({ c, num: c.speciesId, base: DEX[c.speciesId].s.reduce((a, b) => a + b, 0) }));
    // 1) preselección: poder suelto de cada uno (gana a trios de rivales de los seis barrios, 1 contra 3)
    const piso = 20;
    const ctx = { kM: kLado('m', piso), kR: kLado('r', piso), aguante: true, rivalDano: 1 };
    const S0 = { regla: { rivalDano: 1, tipoMio: null, cura: 0 }, bend: bendiciones([]) };
    const puntuar = it => {
      let t = 0; const N = 72;
      for (let k = 0; k < N; k++) {
        const rng = rngDe(777 + k * 31);
        const LL = k % 3 === 0 ? 18 : k % 3 === 1 ? 32 : L;       // niveles de principio, medios y de fondo
        const b = BARRIOS[k % 6], rivs = [0, 1, 2].map(() => luchador(especieAl(b.id, rng).num, LL, false, null, 1));
        const m = luchador(it.num, LL, true, null, 1);
        const r = combate([m], rivs, { ...ctx, aguante: false }, rng);
        t += r.tumbados + (r.gana ? 1 + m.vida : 0);
      }
      return t / N;
    };
    for (const it of lista) it.poder = puntuar(it);
    lista.sort((a, b) => b.poder - a.poder);
    let top = lista.slice(0, 14);
    // 2) el mejor cuarteto: se prueban todos contra rivales de los barrios con los dados fijos
    let mejor = null;
    const comb = (arr, k, ini, cur, f) => { if (cur.length === k) { f(cur); return; } for (let i = ini; i < arr.length; i++) { cur.push(arr[i]); comb(arr, k, i + 1, cur, f); cur.pop(); } };
    const probar = eq => {
      if (!valida(eq.map(x => x.num))) return;
      let ganadas = 0, vida = 0, tumb = 0; const N = 36;
      for (let k = 0; k < N; k++) {
        const rng = rngDe(9001 + k * 17), b = BARRIOS[k % 6];
        const LL = k % 3 === 0 ? 18 : k % 3 === 1 ? 32 : L;
        const rivs = [0, 1, 2].map(() => luchador(especieAl(b.id, rng).num, LL + Math.round(LL / 10), false, null, 1));
        const mios = eq.map(it => luchador(it.num, LL, true, null, 1));
        const r = combate(mios, rivs, { ...ctx, aguante: true }, rng);
        tumb += r.tumbados;
        if (r.gana) { ganadas++; vida += mios.slice(0, 3).reduce((a, x) => a + x.vida, 0); }
      }
      const nota = tumb + ganadas * 3 + vida / 3;
      if (!mejor || nota > mejor.nota) mejor = { eq: [...eq], nota, p: ganadas / N };
    };
    comb(top, Math.min(plazas, top.length), 0, [], probar);
    if (!mejor && lista.length > top.length) { top = lista.slice(0, 26); comb(top, Math.min(plazas, top.length), 0, [], probar); }
    if (!mejor) return null;
    // orden: el de más poder delante
    mejor.eq.sort((a, b) => b.poder - a.poder);
    return { eq: mejor.eq.map(x => x.c), p: mejor.p, todos: lista };
  }

  /* ══════════ 5 · APRENDER (de cada combate, puerta y suceso) ══════════ */
  let estadoJuego = null;                   // el estado del lobby/partida que se leyó la última vez
  let ultimaDec = null;                     // lo que se decidió en la última puerta (para aprender de lo que pasa después)
  const vistos = new WeakSet();
  const esp = (b, n) => { const e = kb.esp[b] || (kb.esp[b] = {}); e[n] = (e[n] || 0) + 1; };
  function aprendeCombate(ev, dec) {
    if (!dec || !ev.rivales || !ev.rivales.length) return;
    const piso = dec.piso, tipo = dec.tipo;
    const bar = barrioDePiso(piso);
    for (const r of ev.rivales) esp(bar.id, r.nombre);
    const niv = media(ev.rivales.map(r => r.nivel));
    if (NIV_PRIOR[tipo]) { const a = kb.niv[tipo]; a.push([piso, niv]); while (a.length > 150) a.shift(); }
    const cnt = (kb.cnt = kb.cnt || {}), k = tipo + (dec.S && dec.S.regla && dec.S.regla.pares ? '|p' : '');
    const c = cnt[k] || (cnt[k] = { n: 0, s: 0 }); c.n++; c.s += ev.rivales.length;
    // lo que pega cada lado de verdad frente a la fórmula (por golpe): ratio visto / previsto
    const S = dec.S; if (!S) { guardaKb(); return; }
    const lv = {};
    for (const q of ev.equipo || []) lv[q.refId] = { mio: true, nombre: q.nombre, L: q.nivel, tipo1: q.tipo1, tipo2: q.tipo2 };
    for (const q of ev.rivales) lv[q.refId] = { mio: false, nombre: q.nombre, L: q.nivel, tipo1: q.tipo1, tipo2: q.tipo2 };
    const mk = (q, mio) => {
      const num = DEX_NOMBRE[norm(q.nombre)]; if (!DEX[num]) return null;
      const x = luchador(num, q.L, mio, mio ? S.bend.m : null, 1);
      if (mio && S.regla.tipoMio && x.tipos.some(t => S.regla.tipoMio.tipos.includes(t))) for (const c2 of CS) x[c2] *= S.regla.tipoMio.x;
      return x;
    };
    let n = 0;
    for (const h of ev.log || []) {
      if (!h.dano || (h.actor !== 'jugador' && h.actor !== 'rival') || !h.tipoMovimiento) continue;
      const aId = h.actor === 'jugador' ? h.activoJugador : h.activoRival, dId = h.actor === 'jugador' ? h.activoRival : h.activoJugador;
      const a = lv[aId], d = lv[dId]; if (!a || !d) continue;
      const A = mk(a, a.mio), D = mk(d, d.mio); if (!A || !D) continue;
      const t = tipoDe(h.tipoMovimiento); if (!t) continue;
      let pred = danoBase(A, D, t, h.categoriaMovimiento === 'fisico');
      if (!a.mio) pred *= S.regla.rivalDano;
      if (!(pred > 0)) continue;
      const lado = a.mio ? 'm' : 'r', tr = tramoK(piso), cc = kb.k[lado + tr] || (kb.k[lado + tr] = { n: 0, s: 0 });
      cc.n++; cc.s += (h.dano / pred) / 1.045; n++;
    }
    apunta({ tipo: 'combate', piso, puerta: tipo, nivel: Math.round(niv), rivales: ev.rivales.map(r => r.nombre + ' Nv' + r.nivel), gano: ev.victoria, golpes: n });
    guardaKb();
  }
  function aprendeEvento(ev) {
    if (ev.tipo === 'texto') {
      const e = kb.evt[ev.titulo] || (kb.evt[ev.titulo] = { n: 0, texto: ev.texto });
      e.n++; e.texto = ev.texto; guardaKb();
    }
  }

  /* ══════════ 6 · ACCIONES (pulsar lo que pulsaría una persona) ══════════ */
  const conf = { pago: false, reserva: 20000, tope: 0, velocidad: 'normal', todos: true, ...lsGet('acn-conf', {}) };
  let gastadoTienda = 0;                                  // lo gastado en tiendas en la bajada de ahora
  const restanteTienda = () => Math.max(0, (+conf.tope || 0) - gastadoTienda);
  const guardaConf = () => lsPut('acn-conf', conf);
  const VEL = { rapida: [50, 120], normal: [350, 700], tranquila: [1000, 1800] };
  const SS_AUTO = 'acn-auto';
  let piloto = (() => { try { return sessionStorage.getItem(SS_AUTO) === '1'; } catch { return false; } })(), enMarcha = false, msg = '', ultimaNota = '';
  const logs = [];
  const log = (t) => { logs.push(t); while (logs.length > 80) logs.shift(); try { const b = document.querySelector('#' + PANEL_ID + ' .acn-log'); if (b) kLog(b, t); } catch { /* nada */ } console.log('[cn] ' + t); };
  const secPuertas = () => $$('main section').find(s => !ajeno(s) && /elige puerta/i.test(texto(s.querySelector('p'))));
  const secConTexto = re => $$('main section, div.fixed section').find(s => !ajeno(s) && re.test(texto(s).slice(0, 80)));
  const botonSeguir = () => $$('button').find(b => !ajeno(b) && !b.disabled && visible(b) && /^seguir$/i.test(texto(b)));
  const botonSaltar = () => $$('button').find(b => !ajeno(b) && !b.disabled && visible(b) && /saltar al resultado/i.test(texto(b)));
  let clicPropio = false;
  async function pulsar(b, que, espera = true) {
    // el juego procesa cada acción en el servidor: mientras tanto los botones salen desactivados
    for (let i = 0; i < 100 && b && b.isConnected && b.disabled; i++) await sleep(60);
    if (!b || !b.isConnected || b.disabled || /retirarse/i.test(texto(b))) return false;
    await pausa(...(VEL[conf.velocidad] || VEL.normal));
    if (!piloto || !b.isConnected) return false;
    msg = que; pintar();
    const antes = firma(leerJuego());
    clicPropio = true; try { b.click(); } finally { clicPropio = false; }
    if (!espera) return true;
    for (let i = 0; i < 80; i++) { await sleep(60); if (firma(leerJuego()) !== antes || !b.isConnected) break; }
    return true;
  }
  // Arrastrar a un Pokémon del equipo por su «⠿» (como con el dedo): el orden en que salen
  async function arrastrar(asa, destino) {
    const r0 = asa.getBoundingClientRect(), r1 = destino.getBoundingClientRect();
    const x = r0.left + r0.width / 2, y0 = r0.top + r0.height / 2, y1 = r1.top + r1.height / 2 + (r1.top > r0.top ? 6 : -6);
    const ev = (tipo, y, el = asa) => {
      const o = { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: tipo === 'pointerup' ? 0 : 1 };
      el.dispatchEvent(new PointerEvent(tipo, o));
      const mt = { pointerdown: 'mousedown', pointermove: 'mousemove', pointerup: 'mouseup' }[tipo];
      el.dispatchEvent(new MouseEvent(mt, o));
    };
    ev('pointerdown', y0);
    for (let k = 1; k <= 10; k++) { await sleep(25); const y = y0 + (y1 - y0) * k / 10; ev('pointermove', y, document); ev('pointermove', y, asa); }
    await sleep(30); ev('pointerup', y1, document); ev('pointerup', y1, asa);
    const ids0 = filasEquipo().map(f => f.id).join();
    for (let i = 0; i < 100; i++) { await sleep(60); if (filasEquipo().map(f => f.id).join() !== ids0) break; }
    await sleep(120);
  }
  const filasEquipo = () => $$('main li[data-id]').filter(li => !ajeno(li)).map(li => ({ id: li.dataset.id, li, asa: li.querySelector('[role="button"][aria-label^="Mover"]') }));
  async function ponerOrden(refIds) {
    for (let k = 0; k < refIds.length; k++) {
      const f = filasEquipo(); if (f.length < 2) return true;
      const ids = f.map(x => x.id), i = ids.indexOf(refIds[k]);
      if (i < 0 || i === k) continue;
      if (!f[i].asa) return false;
      await arrastrar(f[i].asa, f[k].li);
      let tras = filasEquipo().map(x => x.id);
      for (let w = 0; w < 40 && tras.indexOf(refIds[k]) !== k; w++) { await sleep(100); tras = filasEquipo().map(x => x.id); }
      if (tras.indexOf(refIds[k]) !== k) return false;
    }
    return true;
  }
  const setInput = (inp, v) => { const d = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value'); d.set.call(inp, v); inp.dispatchEvent(new Event('input', { bubbles: true })); };
  // Lobby: la lista de candidatos y las plazas (los huecos dicen «Quitar a X» cuando están ocupados)
  const botonesCand = () => $$('main ul li > button').filter(b => !ajeno(b) && b.querySelector('img') && /\d+\s*base|cansado/i.test(texto(b)));
  const nombreCand = b => ((b.querySelector('img') || {}).alt || '').trim();
  const slotsLlenos = () => $$('main button').filter(b => !ajeno(b) && /^quitar a /i.test(b.getAttribute('aria-label') || ''));
  const nombreSlot = b => (b.getAttribute('aria-label') || '').replace(/^quitar a /i, '').trim();
  const botonBajar = () => $$('main button').find(b => !ajeno(b) && visible(b) && /bajar/i.test(texto(b)) && /⚡/.test(texto(b)));
  const eligeCand = async nombre => {
    const buscar = () => botonesCand().find(b => nombreCand(b) === nombre && !b.disabled);
    let b = buscar();
    if (!b) {
      const inp = $$('main input').find(i => !ajeno(i) && /buscar/i.test(i.placeholder || ''));
      if (inp) { setInput(inp, nombre); await sleep(500); b = buscar(); }
    }
    if (!b) return false;
    b.click(); await sleep(260);
    return true;
  };
  async function montarEquipo(nombres) {
    for (let k = 0; k < 8 && slotsLlenos().length; k++) { slotsLlenos()[0].click(); await sleep(220); }     // se vacía y se monta en orden
    for (const n of nombres) if (!(await eligeCand(n))) return false;
    await sleep(250);
    const hay = slotsLlenos().map(nombreSlot);
    return nombres.every((n, i) => hay[i] === n);
  }

  /* ══════════ 7 · PILOTO ══════════ */
  const setPiloto = v => { piloto = v; try { sessionStorage.setItem(SS_AUTO, v ? '1' : '0'); } catch { /* nada */ } pintar(); if (v) bucle(); };
  const parar = (porque, tipo = 'aviso') => {
    setPiloto(false); msg = '';
    if (porque) { log(porque); try { kAviso({ tipo, app: 'Ciudad Negra', icono: '🌃', titulo: porque.replace(/^[^\p{L}\p{N}¿¡]+/u, ''), sistema: tipo === 'fin' }); } catch { /* nada */ } }
  };
  const nivelMedio = P => media(P.equipo.map(e => e.nivel));
  const bendLista = P => (P.bendiciones || []).map(b => ({ id: b.id, texto: b.texto }));
  let intentosSesion = 0, enBajada = false, pasosSin = 0;
  const norma = () => estadoJuego && estadoJuego.norma && estadoJuego.norma.id;
  function validoEquipo(nums) {
    const N = norma(), ds = nums.map(n => DEX[n]);
    if (ds.some(d => !d)) return false;
    if (ds.some(d => d.leg)) return false;
    if (N === 'teselia' && nums.some(n => n < 494 || n > 649)) return false;
    if (N === 'clasicos' && nums.some(n => n > 251)) return false;
    if (N === 'variado') { const s = new Set(); for (const d of ds) for (const t of d.t) { if (s.has(t)) return false; s.add(t); } }
    return true;
  }
  function candidatosValidos(E) { return (E.candidatos || []).filter(c => !c.cansado && !c.noVale && DEX[c.speciesId]); }
  function recomendarEquipo(E) {
    const cands = candidatosValidos(E);
    if (!cands.length) return null;
    return mejorEquipo(cands, E.plazas || 4, validoEquipo);
  }

  async function resolverEvento(J, ev0) {
    if (!vistos.has(ev0)) {
      vistos.add(ev0);
      aprendeEvento(ev0);
      if (ev0.tipo === 'combate') { aprendeCombate(ev0, ultimaDec); log(`${ev0.victoria ? '⚔️' : '💀'} ${ev0.titulo.replace(/^[^\p{L}\p{N}¿¡]+/u, '')} · rivales ${ev0.rivales.map(r => r.nombre + ' Nv' + r.nivel).join(', ')}`); }
      else if (ev0.tipo === 'fin') registrarFin(ev0);
      else if (ev0.tipo === 'texto') log(`📜 ${ev0.titulo}${ev0.texto ? ': ' + ev0.texto : ''}`);
    }
    const s = ev0.tipo === 'combate' ? (botonSaltar() || botonSeguir()) : botonSeguir();
    if (!s) { await sleep(300); return false; }
    return pulsar(s, ev0.tipo === 'combate' ? 'Combate: salto al resultado' : '«' + (ev0.titulo || '') + '»: sigo');
  }
  function registrarFin(ev) {
    const E = estadoJuego || {};
    const run = { semana: E.semana, piso: ev.piso, motivo: ev.motivo, gastado: ev.gastado, cofre: (ev.cofre || []).map(c => c.texto), cansados: ev.cansados, t: Date.now() };
    kb.runs.push(run); while (kb.runs.length > 60) kb.runs.shift(); guardaKb(true);
    apunta({ tipo: 'fin', ...run });
    log(`🏁 ${ev.motivo === 'derrota' ? 'Caigo' : 'Me retiro'} en el piso ${ev.piso}. Cofre: ${(ev.cofre || []).map(c => c.texto).join(', ') || '—'}.`);
    enBajada = false;
  }
  async function decidirPendiente(J, P) {
    const pen = P.pendiente, E = J.E;
    const S = estadoDe(P, E.dinero);
    if (pen.tipo === 'bendicion') {
      const r = mejorBendicion(S, pen.opciones);
      const sec = secConTexto(/elige una bendici/i), bs = sec ? $$('button', sec).filter(b => b.querySelector('span.block') || /bendici/i.test(texto(b)) || true) : [];
      const b = bs[r.i];
      log(`✨ Bendición: ${r.o.nombre} (${r.o.texto}) → guardián ≈ ${pct(r.q)}`);
      return pulsar(b, `Bendición: ${r.o.nombre}`);
    }
    if (pen.tipo === 'tienda') {
      const c = mejorCompra(S, pen.opciones, false);
      const sec = secConTexto(/una tienda abierta/i), bs = sec ? $$('button', sec) : [];
      for (const o of pen.opciones) if (!kb.tienda[o.id]) { kb.tienda[o.id] = { nombre: o.nombre, texto: o.texto, precios: [] }; }
      for (const o of pen.opciones) { const t = kb.tienda[o.id]; if (!t.precios.includes(o.precio)) { t.precios.push(o.precio); guardaKb(); } }
      if (c) {
        const b = bs.find(x => texto(x).includes(c.nombre));
        log(`🛒 Compro ${c.nombre} (${c.precio} $) → guardián ≈ ${pct(c.q)}`);
        const ok = await pulsar(b, `Compro ${c.nombre}`);
        if (ok) gastadoTienda += c.precio;
        return ok;
      }
      const salir = bs.find(x => /salir sin comprar/i.test(texto(x)));
      log('🛒 No compro nada.');
      return pulsar(salir, 'Salgo de la tienda');
    }
    parar(`⚠ Algo que no conozco («${pen.tipo}»): lo dejo en tus manos.`, 'aviso');
    return false;
  }
  async function decidirPuerta(J, P) {
    const E = J.E;
    const S = estadoDe(P, E.dinero);
    const puertas = P.puertas || [];
    if (!puertas.length) { await sleep(400); return false; }
    { const s0 = secPuertas(); if (!s0 || $$('button', s0).every(x => x.disabled)) { await sleep(300); return false; } }
    // se guarda lo que ofrecía el piso (la ciudad es la misma para todos durante la semana)
    kb.pisos[P.piso] = { puertas: puertas.map(p => p.tipo), semana: E.semana };
    let el, nota;
    if (puertas.length === 1) { el = puertas[0]; nota = 'única puerta'; }
    else {
      const ev = evaluaPuertas(S, puertas);
      el = ev[0].p; nota = ev[0].nota;
      ultimaNota = `${el.nombre}: ${nota}`;
      pintar();
    }
    // orden de salida para esta puerta
    if (el.tipo === 'combate' || el.tipo === 'elite' || el.tipo === 'guardian') {
      msg = 'Pensando el orden de salida…'; pintar();
      await sleep(30);
      const o = mejorOrden(S, el.tipo);
      if (o && o.orden) {
        const refIds = o.orden.map(i => S.eq[i].refId);
        const ok = await ponerOrden(refIds);
        log(ok ? `↕️ Orden: ${o.orden.map(i => S.eq[i].nombre).join(' › ')} (gano ≈ ${pct(o.pW)})` : '↕️ No he podido reordenar: sigo con el orden de ahora.');
        const J2 = leerJuego(); if (J2 && J2.E.partida) { const P2 = J2.E.partida; S.eq = estadoDe(P2, E.dinero).eq; }
      }
    }
    const bs = (secPuertas() ? $$('button', secPuertas()) : []);
    const b = bs[el.i];
    log(`🚪 Piso ${P.piso} · ${el.nombre} — ${nota}`);
    ultimaDec = { piso: P.piso, tipo: el.tipo, S: clonar(S), nivel0: nivelMedio(P), nivelAprendido: false };
    ultimaDec.S.regla = S.regla; ultimaDec.S.bend = S.bend;
    return pulsar(b, `Puerta: ${el.nombre}`);
  }
  async function iniciarBajada(J) {
    const E = J.E;
    if (!E.siguiente) { parar('🏁 Ya no quedan intentos esta semana.', 'fin'); return false; }
    if (E.intentosUsados >= E.intentosGratis && !conf.pago) { parar('🏁 Hechos los intentos gratis. (Los de pago están desactivados en el panel.)', 'fin'); return false; }
    if (E.siguiente.dinero > 0 && E.dinero - E.siguiente.dinero < conf.reserva) { parar('⚠ Con lo que tienes no llega para el intento de pago y la reserva.', 'aviso'); return false; }
    if (intentosSesion > 0 && !conf.todos) { parar('🏁 Intento hecho.', 'fin'); return false; }
    msg = 'Eligiendo el mejor equipo…'; pintar(); await sleep(60);
    const r = recomendarEquipo(E);
    if (!r) { parar('⚠ No tienes cuatro Pokémon que valgan esta semana.', 'aviso'); return false; }
    const nombres = r.eq.map(c => c.nombre);
    log(`🧮 Equipo: ${nombres.join(' › ')} (gano a los guardianes de prueba ≈ ${pct(r.p)})`);
    const ok = await montarEquipo(nombres);
    if (!ok) { parar('⚠ No he podido montar el equipo en la pantalla.', 'error'); return false; }
    const bj = botonBajar();
    if (!bj || bj.disabled) { parar('⚠ El botón de bajar no está disponible.', 'aviso'); return false; }
    kb.semana = E.semana; guardaKb();
    intentosSesion++; enBajada = true; ultimaDec = null; gastadoTienda = 0;
    log(`🌃 Bajada ${E.intentosUsados + 1} de ${E.intentosMax}.`);
    return pulsar(bj, 'Bajo');
  }
  async function paso(J) {
    const E = J.E, P = E.partida, ev0 = J.ev[0];
    if (!E.abierta) { parar('🔒 Ciudad Negra está cerrada ahora.', 'aviso'); return false; }
    if (ev0) return resolverEvento(J, ev0);
    if (P) {
      enBajada = true;
      // lo que subió de nivel la última puerta (para saber cuánto da cada una)
      if (ultimaDec && !ultimaDec.nivelAprendido) { ultimaDec.nivelAprendido = true; const d = nivelMedio(P) - ultimaDec.nivel0; if (d >= 0 && d < 12) apuntaGana(ultimaDec.tipo, d); }
      if (P.pendiente) return decidirPendiente(J, P);
      return decidirPuerta(J, P);
    }
    return iniciarBajada(J);
  }
  async function bucle() {
    if (enMarcha) return;
    enMarcha = true;
    let errores = 0;
    try {
      while (piloto && enCN()) {
        try {
          const J = leerJuego();
          if (!J) { await sleep(500); continue; }
          estadoJuego = J.E;
          const f0 = firma(J);
          const hecho = await paso(J);
          if (!piloto) break;
          if (hecho === false) { pasosSin++; if (pasosSin > 40) { parar('⚠ Me he quedado sin saber qué hacer.', 'error'); break; } await sleep(350); }
          else pasosSin = 0;
          errores = 0;
        } catch (e) {
          errores++; console.warn('[cn piloto]', e);
          if (errores >= 4) { parar('⚠ Error: ' + (e && e.message), 'error'); break; }
          await sleep(900);
        }
      }
    } finally { enMarcha = false; msg = ''; pintar(); }
  }

  /* ══════════ 8 · PANEL ══════════ */
  const euros = n => String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  let recomendado = null, hintFirma = '', hintTexto = '';
  function montar() {
    if (document.getElementById(PANEL_ID)) return;
    const main = document.querySelector('main');
    if (!main) return;
    kStyle('acn-kit', '#' + PANEL_ID, '#F5C451');
    const p = document.createElement('section');
    p.id = PANEL_ID; p.className = 'tarjeta space-y-2 p-3'; p.setAttribute('data-ax-ignore', '1');
    p.innerHTML = `${kHead('🌃', 'Ciudad Negra · asistente', 'Juega cada intento con cabeza')}
      <div class="k-tiles" style="--k-cols:4">
        <div class="${K_TILE}"><b class="acn-t-rec">—</b><small>Récord</small></div>
        <div class="${K_TILE}"><b class="acn-t-sem">—</b><small>Semana</small></div>
        <div class="${K_TILE}"><b class="acn-t-int">—</b><small>Intentos</small></div>
        <div class="${K_TILE}"><b class="acn-t-din">—</b><small>Dinero</small></div>
      </div>
      <p class="acn-msg text-[11px] font-bold text-tinta-500"></p>
      <div class="acn-lobby space-y-2">
        <div class="acn-rec text-[11px] font-semibold text-tinta-500"></div>
        <div class="flex gap-2">
          <button type="button" class="acn-b-equipo boton-suave flex-1 !py-2 text-xs">🧮 Elegir el mejor equipo</button>
          <button type="button" class="acn-b-solo boton-principal flex-1 !py-2 text-xs">▶ Bajar solo</button>
        </div>
        <label class="k-switch text-[11px] font-bold text-tinta-600"><input type="checkbox" class="acn-o-pago"> Usar también los intentos de pago (10.000 $ y 25.000 $)</label>
        <label class="k-switch text-[11px] font-bold text-tinta-600"><input type="checkbox" class="acn-o-todos"> Jugar todos los intentos que queden, uno tras otro</label>
        <label class="flex items-center gap-2 text-[11px] font-bold text-tinta-600">Máximo a gastar en tiendas por bajada <input type="number" min="0" step="1000" class="acn-o-tope ${K_FIELD}" style="width:110px;padding:4px 8px"> $ (0 = no compra nada)</label>
        <label class="flex items-center gap-2 text-[11px] font-bold text-tinta-600">Dinero que no se gasta <input type="number" min="0" step="1000" class="acn-o-res ${K_FIELD}" style="width:110px;padding:4px 8px"> $</label>
      </div>
      <div class="acn-juego hidden space-y-2">
        <p class="acn-plan text-[11px] font-semibold text-tinta-600"></p>
        <button type="button" class="acn-b-solo2 boton-principal w-full !py-2 text-xs">▶ Seguir solo</button>
      </div>
      <button type="button" class="acn-b-parar boton-suave w-full !py-2 text-xs" hidden>⏹ Parar</button>
      <div class="${K_LOG} acn-log"></div>
      <button type="button" class="acn-b-copiar text-[10px] font-bold text-tinta-400 underline">📋 Copiar lo aprendido (para revisarlo)</button>`;
    main.insertBefore(p, main.firstChild);
    const $p = s => p.querySelector(s);
    $p('.acn-b-equipo').addEventListener('click', async () => {
      const J = leerJuego(); if (!J || J.E.partida) return;
      const b = $p('.acn-b-equipo'); b.disabled = true; b.textContent = '⏳ Probando equipos…';
      await sleep(40);
      try { recomendado = recomendarEquipo(J.E); if (recomendado) { await montarEquipo(recomendado.eq.map(c => c.nombre)); log(`🧮 Equipo puesto: ${recomendado.eq.map(c => c.nombre).join(' › ')}`); } else log('⚠ No tienes cuatro que valgan esta semana.'); }
      catch (e) { log('⚠ ' + (e && e.message)); }
      b.disabled = false; b.textContent = '🧮 Elegir el mejor equipo'; pintar();
    });
    $p('.acn-b-solo').addEventListener('click', () => { intentosSesion = 0; setPiloto(true); });
    $p('.acn-b-solo2').addEventListener('click', () => setPiloto(true));
    $p('.acn-b-parar').addEventListener('click', () => parar('⏹ Parado.', 'info'));
    $p('.acn-o-pago').addEventListener('change', e => { conf.pago = e.target.checked; guardaConf(); });
    $p('.acn-o-todos').addEventListener('change', e => { conf.todos = e.target.checked; guardaConf(); });
    $p('.acn-o-tope').addEventListener('change', e => { conf.tope = Math.max(0, +e.target.value || 0); guardaConf(); });
    $p('.acn-o-res').addEventListener('change', e => { conf.reserva = Math.max(0, +e.target.value || 0); guardaConf(); });
    $p('.acn-b-copiar').addEventListener('click', e => {
      const txt = JSON.stringify({ version: VERSION, kb, diario: lsGet(DIARIO_KEY, []) });
      const ok = () => { e.target.textContent = '✔ Copiado: pégamelo'; };
      try { navigator.clipboard.writeText(txt).then(ok, () => prompt('Copia esto:', txt)); } catch { prompt('Copia esto:', txt); }
    });
    $p('.acn-o-pago').checked = !!conf.pago; $p('.acn-o-todos').checked = !!conf.todos; $p('.acn-o-res').value = conf.reserva; $p('.acn-o-tope').value = conf.tope;
    for (const l of logs) kLog($p('.acn-log'), l);
  }
  function pintar() {
    const p = document.getElementById(PANEL_ID);
    if (!p) return;
    const $p = s => p.querySelector(s), E = estadoJuego;
    kBadge($p('.k-badge'), piloto ? 'on' : 'off', piloto ? 'JUGANDO' : 'PARADO');
    if (E) {
      kSet($p('.acn-t-rec'), E.mejorPiso || '—'); kSet($p('.acn-t-sem'), E.miSemana || '—');
      kSet($p('.acn-t-int'), `${E.intentosUsados}/${E.intentosMax}`); kSet($p('.acn-t-din'), euros(E.dinero));
      kSet($p('.k-sub'), `${E.norma ? E.norma.nombre : ''}${E.partida ? ' · piso ' + E.partida.piso : ''}`);
    }
    const enPartida = !!(E && E.partida);
    $p('.acn-lobby').classList.toggle('hidden', enPartida || !E);
    $p('.acn-juego').classList.toggle('hidden', !enPartida);
    $p('.acn-b-parar').hidden = !piloto;
    $p('.acn-b-solo2').hidden = piloto;
    $p('.acn-b-solo').hidden = piloto;
    const rec = $p('.acn-rec');
    const h = recomendado ? `Equipo recomendado: <b>${kEsc(recomendado.eq.map(c => c.nombre).join(' › '))}</b> (guardianes de prueba ≈ ${pct(recomendado.p)}).` : 'Elige el mejor cuarteto para la norma de esta semana, o pulsa «Bajar solo» y lo elijo yo.';
    if (rec.dataset.h !== h) { rec.dataset.h = h; rec.innerHTML = h; }
    kSet($p('.acn-msg'), piloto ? (msg || 'Jugando…') : (E && !E.abierta ? '🔒 Cerrada ahora.' : ''));
    kSet($p('.acn-plan'), hintTexto || ultimaNota || '');
  }
  // Sin piloto: se dice qué puerta conviene (se calcula una vez por pantalla)
  function pista() {
    if (piloto || !estadoJuego || !estadoJuego.partida) { hintTexto = ''; return; }
    const P = estadoJuego.partida;
    if (P.pendiente || !(P.puertas || []).length) { hintTexto = ''; return; }
    const f = P.piso + '|' + P.equipo.map(e => e.hp + '/' + e.nivel).join() + '|' + P.puertas.map(x => x.tipo).join() + '|' + (P.bendiciones || []).length;
    if (f === hintFirma) return;
    hintFirma = f;
    try {
      const S = estadoDe(P, estadoJuego.dinero);
      if (P.puertas.length === 1) { hintTexto = `Solo hay una puerta (${P.puertas[0].nombre}).`; return; }
      const ev = evaluaPuertas(S, P.puertas);
      hintTexto = '🤖 Te conviene: ' + ev.map((r, i) => `${i ? '· ' : ''}${r.p.nombre} (${r.nota})`).join(' ');
    } catch (e) { hintTexto = ''; }
  }
  function esperarHidratacion(maxMs = 20000) {
    return new Promise(resolve => {
      const t0 = Date.now(); let quieto = Date.now();
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
  function tick() {
    if (!enCN()) { const p = document.getElementById(PANEL_ID); if (p) p.remove(); return; }
    const J = leerJuego();
    if (J) estadoJuego = J.E;
    montar(); pista(); pintar();
    if (piloto && !enMarcha) bucle();
  }
  esperarHidratacion().then(() => { setInterval(tick, 900); tick(); });
  window.__axCiudadNegra = { kb, leerJuego, evaluaPuertas, estadoDe, mejorEquipo, simula, nivelRival, kLado, listoGuardian, mejorOrden, mejorBendicion, mejorCompra, recomendarEquipo, candidatosValidos, luchador, combate, rngDe, DEX, POOLS, barrioDePiso, ganaNiv, cuentaRivales };
})();
