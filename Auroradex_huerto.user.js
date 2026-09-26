// ==UserScript==
// @name         Aurora Dex · Huerto de Bayas (automático)
// @namespace    auroradex-huerto
// @version      1.0.0
// @updateURL    https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_huerto.user.js
// @downloadURL  https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_huerto.user.js
// @description  En el Huerto de Bayas: eliges una baya (solo su icono) y con un botón, o solo cada minuto si lo activas, cosecha lo que esté listo, planta esa baya en todo lo vacío y riega todo, con los botones de la propia página.
// @match        https://auroradex.es/*
// @match        https://www.auroradex.es/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

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
   *  DATOS DEL HUERTO: los mismos que usa la página (parcelas, catálogo, bolsa, dinero)
   * ------------------------------------------------------------------ */
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const enHuerto = () => /^\/huerto\/?$/.test(location.pathname);
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
  function estadoHuerto() {
    const h1 = $$('main h1').find(h => /huerto de bayas/i.test(h.textContent || ''));
    for (let f = actual(fibraDe(h1)), i = 0; f && i < 40; f = f.return, i++) {
      const p = f.memoizedProps;
      if (p && p.estado && Array.isArray(p.estado.parcelas)) return p.estado;
    }
    return null;
  }
  const boton = re => $$('main button').find(b => !b.closest('#axh-panel') && re.test(b.textContent || ''));
  const libre = b => b && !b.disabled;
  const bCosechar = () => boton(/cosechar todo/i);
  const bRegar = () => boton(/regar todo/i);
  const bPlantar = () => boton(/plantar todo lo vac/i);
  const listas = e => e.parcelas.filter(p => p.bayaId && p.lista);
  const vacias = e => e.parcelas.filter(p => !p.bayaId);
  const regables = e => e.parcelas.filter(p => p.bayaId && !p.lista && p.puedeRegar);
  const proxima = e => { const t = e.parcelas.filter(p => p.bayaId && !p.lista && p.listaEn).map(p => Date.parse(p.listaEn)).sort((a, b) => a - b)[0]; return t || null; };
  const proxRiego = e => { const t = e.parcelas.filter(p => p.bayaId && !p.lista && !p.puedeRegar && p.riegos < p.riegosMax && p.proximoRiegoEn).map(p => Date.parse(p.proximoRiegoEn)).sort((a, b) => a - b)[0]; return t || null; };
  const falta = ms => { const m = Math.max(0, Math.ceil(ms / 6e4)), h = Math.floor(m / 60); return h ? `${h} h ${m % 60} min` : `${m} min`; };
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  async function esperarA(cond, ms = 10000) {
    const t0 = Date.now();
    for (;;) { const v = cond(); if (v || Date.now() - t0 > ms) return v; await sleep(200); }
  }

  /* ------------------------------------------------------------------ *
   *  HACERLO TODO: cosechar lo que esté listo, plantar la baya elegida en lo vacío y regar todo
   *  (con los botones de la propia página). «Automático»: se repite solo mientras tengas el huerto abierto.
   * ------------------------------------------------------------------ */
  const LS_BAYA = 'axh-baya', LS_AUTO = 'axh-auto';
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } };
  const lsPut = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin storage */ } };
  let enMarcha = false;
  // el registro se guarda aparte por si la página vuelve a pintar el panel
  const registro = [];
  const log = t => { registro.push([Date.now(), t]); if (registro.length > 40) registro.shift(); kLog(document.querySelector('#axh-panel .axh-log'), t); };

  async function hacerTodo(auto = false) {
    if (enMarcha) return;
    let e = estadoHuerto();
    if (!e) return;
    enMarcha = true; pintar();
    const hecho = [];
    try {
      // 1) cosechar
      if (listas(e).length && libre(bCosechar())) {
        const n = listas(e).reduce((x, p) => x + (p.cosecha || 0), 0);
        bCosechar().click();
        await esperarA(() => { const x = estadoHuerto(); return x && !listas(x).length; });
        hecho.push(`🧺 ${n} baya${n === 1 ? '' : 's'} cosechada${n === 1 ? '' : 's'}`);
        log(`🧺 Cosechado (${n}).`);
        await sleep(400);
        e = estadoHuerto() || e;
      }
      // 2) plantar la baya elegida en todo lo vacío
      const baya = lsGet(LS_BAYA, null), cat = baya && e.catalogo.find(c => c.id === baya);
      if (vacias(e).length) {
        if (!cat) log('⚠ Elige arriba qué baya plantar.');
        else if (e.dinero < cat.semilla * vacias(e).length) log(`⚠ No llega el dinero para plantar ${vacias(e).length} ${cat.nombre} (${cat.semilla * vacias(e).length} $).`);
        else if (libre(bPlantar())) {
          const cuantas = vacias(e).length;
          const lista = () => $$('main section').find(s => /qu[eé] plantas en las/i.test(s.textContent || ''));
          if (!lista()) { bPlantar().click(); await esperarA(lista, 4000); }
          const li = lista() && $$('li', lista()).find(l => { const p = l.querySelector('p'); return p && p.textContent.trim().startsWith(cat.nombre); });
          const b = li && li.querySelector('button');
          if (!libre(b)) log(`⚠ No encuentro el botón para plantar ${cat.nombre}.`);
          else {
            b.click();
            await esperarA(() => { const x = estadoHuerto(); return x && !vacias(x).length; });
            hecho.push(`🌱 ${cuantas} ${cat.nombre} plantada${cuantas === 1 ? '' : 's'}`);
            log(`🌱 Plantadas ${cuantas} ${cat.nombre} (${cat.semilla * cuantas} $).`);
            await sleep(400);
            e = estadoHuerto() || e;
          }
        }
      }
      // 3) regar todo lo que se pueda
      if (regables(e).length && libre(bRegar())) {
        const n = regables(e).length;
        bRegar().click();
        await esperarA(() => { const x = estadoHuerto(); return x && !regables(x).length; });
        hecho.push(`💧 ${n} regada${n === 1 ? '' : 's'}`);
        log(`💧 Regadas ${n}.`);
      }
      if (!hecho.length && !auto) log('Nada que hacer ahora mismo.');
      if (hecho.length && auto) {
        const x = estadoHuerto(), t = x && proxima(x);
        kAviso({ tipo: 'exito', app: 'Huerto de Bayas', icono: '🌱', titulo: 'Huerto al día', lineas: [...hecho, t ? `Próxima cosecha en ${falta(t - Date.now())}` : null] });
      }
    } catch (err) {
      console.warn('[axh]', err);
      log('⚠ Error: ' + (err && err.message));
      kAviso({ tipo: 'error', app: 'Huerto de Bayas', titulo: 'El huerto automático se ha parado', texto: String(err && err.message) });
    } finally {
      enMarcha = false; pintar();
    }
  }
  // Automático: cada minuto mira si hay algo que cosechar, plantar o regar
  setInterval(() => {
    if (!enHuerto() || !lsGet(LS_AUTO, false) || enMarcha || !document.getElementById('axh-panel')) return;
    const e = estadoHuerto();
    if (e && (listas(e).length || (vacias(e).length && lsGet(LS_BAYA, null)) || regables(e).length)) hacerTodo(true);
  }, 60000);

  /* ------------------------------------------------------------------ *
   *  PANEL (en «El terreno», debajo de las pestañas)
   * ------------------------------------------------------------------ */
  const U = '#axh-panel';
  const HUERTO_CSS = `
    ${U} .axh-bayas{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;padding:4px 0 2px}
    ${U} .axh-baya{position:relative;width:48px;height:48px;border-radius:999px;border:0;padding:0;cursor:pointer;display:grid;place-items:center;background:var(--c);box-shadow:inset 0 -4px 0 rgba(0,0,0,.18),0 3px 8px -4px rgba(0,0,0,.5);transition:transform .15s cubic-bezier(.3,1.5,.5,1),box-shadow .15s,filter .15s;filter:saturate(.65) brightness(.92);opacity:.8}
    ${U} .axh-baya img{width:32px;height:32px;image-rendering:pixelated;filter:drop-shadow(0 2px 1px rgba(0,0,0,.3))}
    ${U} .axh-baya:hover{transform:translateY(-2px);opacity:1}
    ${U} .axh-baya[aria-pressed="true"]{transform:scale(1.14);opacity:1;filter:none;box-shadow:inset 0 -4px 0 rgba(0,0,0,.18),0 0 0 3px rgb(var(--lienzo)),0 0 0 6px var(--k-acento),0 8px 18px -6px var(--c)}
    ${U} .axh-baya[aria-pressed="true"]::after{content:"✓";position:absolute;right:-5px;top:-5px;width:18px;height:18px;border-radius:999px;display:grid;place-items:center;font-size:10px;font-weight:900;color:#fff;background:var(--k-acento);box-shadow:0 0 0 2px rgb(var(--lienzo))}
    ${U} .axh-baya:disabled{cursor:default}`;
  function pintar() {
    const p = document.getElementById('axh-panel');
    if (!p) return;
    const e = estadoHuerto();
    if (!e) return;
    const baya = lsGet(LS_BAYA, null);
    // iconos de las bayas (solo el icono; una elegida a la vez)
    const fila = p.querySelector('.axh-bayas');
    const firma = e.catalogo.map(c => c.id).join();
    if (fila.dataset.firma !== firma) {
      fila.dataset.firma = firma;
      fila.innerHTML = e.catalogo.map(c => `<button type="button" class="axh-baya" data-id="${kEsc(c.id)}" style="--c:${kEsc(c.color)}" title="${kEsc(c.nombre)} · ${c.horas} h · da ${c.cosecha} · semilla ${c.semilla} $" aria-label="${kEsc(c.nombre)}"><img src="/items/${kEsc(c.id)}.png?v=5" alt=""></button>`).join('');
      for (const b of $$('.axh-baya', fila)) b.addEventListener('click', () => { lsPut(LS_BAYA, b.dataset.id); pintar(); });
    }
    for (const b of $$('.axh-baya', fila)) b.setAttribute('aria-pressed', String(b.dataset.id === baya));
    const cat = baya && e.catalogo.find(c => c.id === baya);
    const t = proxima(e), r = proxRiego(e);
    kSet(p.querySelector('.axh-t-listas'), String(listas(e).length));
    kSet(p.querySelector('.axh-t-prox'), listas(e).length ? '¡Ya!' : t ? falta(t - Date.now()) : '–');
    kSet(p.querySelector('.axh-t-riego'), regables(e).length ? `${regables(e).length} ya` : r ? falta(r - Date.now()) : 'hecho');
    kSet(p.querySelector('.k-sub'), cat ? `Planta ${cat.nombre} · ${cat.horas} h · ${cat.semilla} $ la semilla` : 'Elige qué baya plantar');
    const auto = lsGet(LS_AUTO, false);
    kBadge(p.querySelector('.k-badge'), enMarcha ? 'on' : auto ? 'ok' : 'off', enMarcha ? 'HACIENDO' : auto ? 'AUTOMÁTICO' : 'LISTO');
    const b = p.querySelector('.axh-todo');
    b.disabled = enMarcha;
    kSet(b, enMarcha ? '⏳ Haciéndolo…' : '🤖 Cosechar, plantar y regar');
    const sw = p.querySelector('.axh-auto');
    if (sw.checked !== auto) sw.checked = auto;
  }
  function montar() {
    let p = document.getElementById('axh-panel');
    const nav = enHuerto() && $$('main nav').find(n => /el terreno/i.test(n.textContent || ''));
    const terreno = nav && bCosechar();
    if (!terreno || !estadoHuerto()) { if (p) p.remove(); return; }
    if (!p) {
      kStyle('axh-kit', U, '#5FAE3A');
      if (!document.getElementById('axh-css')) { const st = document.createElement('style'); st.id = 'axh-css'; st.textContent = HUERTO_CSS; document.head.appendChild(st); }
      p = document.createElement('section');
      p.id = 'axh-panel';
      p.className = 'tarjeta space-y-3 p-3';
      p.setAttribute('data-ax-ignore', '1');
      p.innerHTML = `
        ${kHead('🌱', 'Huerto automático', '')}
        <div class="axh-bayas"></div>
        <div class="k-tiles" style="--k-cols:3">
          <div class="${K_TILE}"><b class="axh-t-listas tabular-nums">0</b><small>🧺 Listas</small></div>
          <div class="${K_TILE}"><b class="axh-t-prox tabular-nums">–</b><small>Próxima</small></div>
          <div class="${K_TILE}"><b class="axh-t-riego tabular-nums">–</b><small>💧 Riego</small></div>
        </div>
        <button type="button" class="axh-todo boton-principal w-full !py-2.5 text-sm">🤖 Cosechar, plantar y regar</button>
        <label class="k-switch text-[11px] font-bold leading-snug text-tinta-600"><input type="checkbox" class="axh-auto"><span>Hacerlo solo mientras tengas el huerto abierto (mira cada minuto)</span></label>
        <div class="axh-log ${K_LOG}"></div>`;
      const caja = p.querySelector('.axh-log');
      for (const [ts, t] of registro) { const d = new Date(ts), q = document.createElement('p'); q.textContent = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}  ${t}`; caja.appendChild(q); }
      p.querySelector('.axh-todo').addEventListener('click', e => { e.preventDefault(); hacerTodo(false); });
      p.querySelector('.axh-auto').addEventListener('change', e => { lsPut(LS_AUTO, e.target.checked); pintar(); if (e.target.checked) { kPedirPermiso(); hacerTodo(true); } });
    }
    if (p.previousElementSibling !== nav) nav.insertAdjacentElement('afterend', p);
    pintar();
  }

  // Next.js no recarga al navegar: se vigila la página (sin reaccionar a los cambios del propio panel)
  let t = null;
  new MutationObserver(muts => {
    if (muts.every(m => m.target.nodeType === 1 && m.target.closest && m.target.closest('[data-ax-ignore]'))) return;
    clearTimeout(t); t = setTimeout(montar, 250);
  }).observe(document.documentElement, { childList: true, subtree: true });
  setInterval(() => { if (enHuerto()) pintar(); }, 30000);
  setTimeout(montar, 1500);
})();
