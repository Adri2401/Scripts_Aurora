// ==UserScript==
// @name         Aurora Dex · Frente Batalla (automático)
// @namespace    auroradex-frente
// @version      0.2.0
// @updateURL    https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_frente.user.js
// @downloadURL  https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_frente.user.js
// @description  En cada edificio del Frente Batalla (/frontera/…): elige a los mejores para esa regla (todo a Nv.50, contra rivales de todos los tipos), empieza la tanda y va pulsando «Seguir» hasta el final. Si sale una pantalla que aún no conoce, se para, avisa y deja copiar su HTML. En la Cúpula, antes de cada combate, pone a los tuyos en el mejor orden contra los tres que te esperan.
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
   *  EDIFICIOS DEL FRENTE (/frontera/<edificio>)
   * ------------------------------------------------------------------ */
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const pausa = (a, b) => sleep(a + Math.random() * (b - a));
  const EDIFICIOS = {
    torre: { nombre: 'Torre Batalla', icono: '🗼', nota: 'Tres contra tres, en fila.' },
    cupula: { nombre: 'Cúpula Batalla', icono: '🏟️', nota: 'Ve al rival antes de cada combate y ordena a los tuyos para ganarle.' },
    palacio: { nombre: 'Palacio Batalla', icono: '🏛️', nota: 'Los tuyos atacan con lo que les apetece: cuentan más las estadísticas que los tipos.' },
    arena: { nombre: 'Arena Batalla', icono: '⚖️', nota: 'Uno contra uno, tres turnos: el que más pega y aguanta.' },
    fabrica: { nombre: 'Fábrica Batalla', icono: '🏭', nota: 'Tres de alquiler: los mejores de los que ofrecen.' },
    senda: { nombre: 'Senda Batalla', icono: '🚪', nota: 'Puertas a ciegas: se elige al azar.' },
    piramide: { nombre: 'Pirámide Batalla', icono: '🔺', nota: 'Sin objetos y sin curarse entre combates: cuenta más el aguante.' },
  };
  const edificio = () => { const m = location.pathname.match(/^\/frontera\/([a-z]+)\/?$/); return m && EDIFICIOS[m[1]] ? m[1] : null; };
  const ajeno = el => !!(el.closest('#axf-panel') || el.closest('#k-avisos'));
  const visible = el => !!(el.offsetParent || el.getClientRects().length);
  const texto = el => (el.textContent || '').replace(/\s+/g, ' ').trim();

  // Sección de elegir («Alista tres», «Elige uno», «Alquila tres») con sus Pokémon y el botón de empezar
  function eleccion() {
    const h = $$('main h2.titulo-seccion').find(x => /alista|elige|alquila/i.test(texto(x)));
    const sec = h && h.closest('section');
    if (!sec) return null;
    const cont = $$('span', h.parentElement).map(texto).map(t => t.match(/^(\d+)\s*\/\s*(\d+)$/)).find(Boolean);
    const pokes = $$('ul li > button', sec).map(b => {
      const img = b.querySelector('img[src*="/sprites/"]');
      const m = img && (img.getAttribute('src') || '').match(/\/(\d+)\.(?:png|gif|webp)/);
      return { b, nombre: img ? img.alt : texto(b), num: m ? +m[1] : null, vale: !b.disabled };
    });
    const empezar = $$('button', sec).find(b => /empezar la tanda/i.test(texto(b)));
    return { sec, pokes, elegidos: cont ? +cont[1] : 0, necesarios: cont ? +cont[2] : 3, empezar };
  }

  /* ------------------------------------------------------------------ *
   *  MODELO DE COMBATE (el mismo que el script de Tiers, todo a Nv.50)
   *  Tipos y estadísticas base de PokéAPI (misma memoria que Tiers y el Metro). El «Especial» del juego es la media
   *  de At. Esp. y Def. Esp. y sirve para atacar y defender. Muy eficaz ×1,65, poco eficaz ×0,6.
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
  const eficacia = (a, def) => def.reduce((m, d) => m * ((TABLA[a] || {})[d] ?? 1), 1);
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } };
  const lsPut = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin storage */ } };
  const LS_POKE = 'axm-poke';
  const datos = lsGet(LS_POKE, {});
  async function datosDe(num) {
    if (!num) return null;
    if (datos[num]) return datos[num];
    try {
      const d = await (await fetch('https://pokeapi.co/api/v2/pokemon/' + num)).json();
      const t = (d.types || []).sort((a, b) => a.slot - b.slot).map(x => DE_INGLES[x.type.name]).filter(Boolean);
      const s = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'].map(k => ((d.stats || []).find(x => x.stat.name === k) || {}).base_stat || 50);
      if (!t.length) return null;
      datos[num] = { t, s };
      const g = lsGet(LS_POKE, {}); g[num] = datos[num]; lsPut(LS_POKE, g);
      return datos[num];
    } catch { return null; }
  }
  function stats(b, L = 50) {
    const st = x => Math.floor(2 * x * L / 100) + 5;
    return { hp: Math.floor(3 * b[0] * L / 100) + L + 14, atk: st(b[1]), def: st(b[2]), esp: st(Math.round((b[3] + b[4]) / 2)), spe: st(b[5]), fis: b[1] >= b[3] };
  }
  const luchador = (d, num, nombre) => ({ ...stats(d.s), L: 50, tipos: d.t, num, nombre });
  function tipoAtaque(a, b, aleatorio) {
    if (aleatorio) return { t: a.tipos[0], e: eficacia(a.tipos[0], b.tipos), propio: true, media: true };
    let m = null;
    for (const t of a.tipos) { const e = eficacia(t, b.tipos); if (!m || e > m.e) m = { t, e, propio: true }; }
    if (m.e < 1) { const en = eficacia('normal', b.tipos); if (en > m.e) return { t: 'normal', e: en, propio: a.tipos.includes('normal') }; }
    return m;
  }
  const efJuego = (t, tipos) => tipos.reduce((m, x) => { const v = (TABLA[t] || {})[x] ?? 1; return m * (v === 0 ? 0 : v > 1 ? 1.65 : v < 1 ? 0.6 : 1); }, 1);
  // Parte de la vida del rival que quita cada golpe (con la media de los críticos). En el Palacio los tuyos pegan con lo
  // que les da la gana: se usa la media de sus tipos y del Normal en vez del mejor
  function golpe(a, b, aleatorio = false) {
    const opciones = aleatorio ? [...a.tipos, 'normal'] : [tipoAtaque(a, b).t];
    let tot = 0;
    for (const t of opciones) {
      const propio = a.tipos.includes(t), fis = !propio || a.fis, A = fis ? a.atk : a.esp, D = fis ? b.def : b.esp;
      const e = efJuego(t, b.tipos);
      tot += e === 0 ? b.hp / 16 : (22 * 30.5 * A / D / 50 + 2) * (propio ? 1.5 : 1) * e * 1.057;
    }
    return tot / opciones.length / b.hp;
  }
  const HOLGAZAN = 289;
  // Probabilidad (suave) de que `a` gane a `b` en un 1 contra 1: golpes que necesita cada uno, medio turno al más rápido
  function ventaja(a, b, aleatorio = false) {
    let hA = 1 / golpe(a, b, aleatorio), hB = 1 / golpe(b, a);
    if (a.num === HOLGAZAN) hA = 2 * hA - 1;
    if (b.num === HOLGAZAN) hB = 2 * hB - 1;
    const r = Math.max(0.05, hB + (a.spe > b.spe ? 0.5 : a.spe < b.spe ? -0.5 : 0)) / hA;
    return r * r * r / (r * r * r + 1);
  }
  // Arena: tres turnos y, si nadie cae, gana quien quite más barra (hay que sacarle un 10 %)
  function ventajaArena(a, b) {
    const gA = golpe(a, b), gB = golpe(b, a), primero = a.spe >= b.spe;
    let vA = 1, vB = 1;
    for (let t = 0; t < 3; t++) {
      if (primero) { vB -= gA; if (vB <= 0) return 1; vA -= gB; if (vA <= 0) return 0; }
      else { vA -= gB; if (vA <= 0) return 0; vB -= gA; if (vB <= 0) return 1; }
    }
    const dif = vA - vB;
    return dif >= 0.1 ? 0.85 : dif <= -0.1 ? 0.15 : 0.5 + dif * 3;
  }
  // Rivales de referencia: todos los tipos (simples y dobles comunes) × 4 repartos de estadísticas, fuertes (evoluciones
  // finales: el Frente no deja legendarios pero los rivales llevan lo mejor)
  const GEN = ['normal', 'fuego', 'agua', 'planta', 'electrico', 'hielo', 'lucha', 'veneno', 'tierra', 'volador', 'psiquico', 'bicho', 'roca', 'fantasma', 'dragon', 'siniestro', 'acero', 'hada',
    'agua/tierra', 'fuego/volador', 'planta/veneno', 'dragon/volador', 'acero/psiquico', 'agua/volador', 'roca/tierra', 'bicho/volador', 'normal/volador', 'siniestro/fantasma', 'electrico/acero', 'hielo/agua', 'lucha/acero', 'dragon/tierra', 'psiquico/hada', 'veneno/siniestro'];
  const PERFILES = [[95, 95, 95, 95, 95, 95], [85, 120, 85, 70, 80, 115], [115, 85, 115, 90, 110, 60], [85, 70, 80, 125, 100, 105]];
  const BANCO = GEN.flatMap(t => PERFILES.map(p => ({ ...stats(p), L: 50, tipos: t.split('/'), num: 0 })));
  const ed = () => edificio();
  const v1 = (a, r) => ed() === 'arena' ? ventajaArena(a, r) : ventaja(a, r, ed() === 'palacio');
  // Nota de un equipo: contra cada rival de referencia, probabilidad de que alguno de los tuyos le gane (en la Pirámide,
  // sin curarse entre combates, pesa más que ganen varios: se usa la media en vez del «alguno»)
  function notaEquipo(eq) {
    let tot = 0;
    for (const r of BANCO) {
      if (ed() === 'piramide') tot += eq.reduce((x, a) => x + v1(a, r), 0) / eq.length;
      else tot += 1 - eq.reduce((x, a) => x * (1 - v1(a, r)), 1);
    }
    return tot / BANCO.length;
  }
  const nota1 = a => BANCO.reduce((x, r) => x + v1(a, r), 0) / BANCO.length;
  function combinaciones(arr, k) {
    const out = [];
    const rec = (i, act) => { if (act.length === k) { out.push(act.slice()); return; } for (let j = i; j < arr.length; j++) { act.push(arr[j]); rec(j + 1, act); act.pop(); } };
    rec(0, []);
    return out;
  }
  // Los mejores: todas las combinaciones de los que valen; en orden, el más fuerte primero
  async function recomendacion() {
    const E = eleccion();
    if (!E) return null;
    const validos = [];
    for (const p of E.pokes.filter(x => x.vale)) {
      const d = await datosDe(p.num);
      if (d) validos.push({ p, l: luchador(d, p.num, p.nombre) });
    }
    if (validos.length < E.necesarios) return { E, eq: null, validos };
    let mejor = null;
    for (const c of combinaciones(validos, E.necesarios)) {
      const n = notaEquipo(c.map(x => x.l));
      if (!mejor || n > mejor.n) mejor = { c, n };
    }
    const eq = mejor.c.map(x => ({ ...x, n1: nota1(x.l) })).sort((a, b) => b.n1 - a.n1);
    return { E, eq, nota: mejor.n, validos };
  }

  /* ------------------------------------------------------------------ *
   *  CÚPULA: antes de cada combate enseña los tres del rival («Lo que te espera»). Se simula el combate en fila (cada uno
   *  pelea hasta caer y el que gana sigue con la vida que le quede) con los 6 órdenes posibles de los tuyos y se pone el
   *  mejor con los ▲ del juego. Cuenta sobre todo el orden en que salen los suyos tal como se ven, y para desempatar la
   *  media contra todos sus órdenes.
   * ------------------------------------------------------------------ */
  const numSprite = img => { const m = img && (img.getAttribute('src') || '').match(/\/(\d+)\.(?:png|gif|webp)/); return m ? +m[1] : null; };
  const sinTildes = t => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  function pantallaCupula() {
    const h2 = re => $$('main h2.titulo-seccion').find(x => !ajeno(x) && re.test(texto(x)));
    const hT = h2(/^la tanda$/i), hR = h2(/lo que te espera/i);
    const secT = hT && hT.closest('section'), secR = hR && hR.closest('section');
    if (!secT || !secR) return null;
    const mios = $$('ul > li', secT).map(li => {
      const img = li.querySelector('img[src*="/sprites/"]'), b = li.querySelector('button');
      if (!img) return null;
      const ps = texto(li).match(/(\d+)\s*\/\s*(\d+)/);
      return { nombre: img.alt, num: numSprite(img), vida: ps && +ps[2] ? Math.min(1, +ps[1] / +ps[2]) : 1, subir: b && !b.disabled ? b : null };
    }).filter(Boolean);
    const rivales = $$('ul > li', secR).map(li => {
      const img = li.querySelector('img[src*="/sprites/"]');
      if (!img) return null;
      const tipos = (texto(li.lastElementChild || li).split('/').map(sinTildes)).filter(t => TABLA[t]);
      return { nombre: img.alt, num: numSprite(img), tipos };
    }).filter(Boolean);
    return mios.length > 1 && rivales.length ? { mios, rivales } : null;
  }
  // Combate en fila, con el daño medio de cada golpe. Devuelve 1 + vida que te sobra si ganas, o lo que le quitas si pierdes
  function fila(mios, rivales) {
    const A = mios.map(x => ({ l: x.l, v: x.vida ?? 1 })), B = rivales.map(x => ({ l: x.l, v: 1 }));
    const g = (x, y) => golpe(x, y) * (x.num === HOLGAZAN ? 0.5 : 1);
    let i = 0, j = 0;
    for (let n = 0; i < A.length && j < B.length && n < 300; n++) {
      const a = A[i], b = B[j];
      if (a.l.spe >= b.l.spe) { b.v -= g(a.l, b.l); if (b.v <= 0) { j++; continue; } a.v -= g(b.l, a.l); if (a.v <= 0) i++; }
      else { a.v -= g(b.l, a.l); if (a.v <= 0) { i++; continue; } b.v -= g(a.l, b.l); if (b.v <= 0) j++; }
    }
    const resto = (L, k) => L.slice(k).reduce((x, y) => x + Math.max(0, y.v), 0);
    return j >= B.length ? 1 + resto(A, i) / A.length : 1 - resto(B, j) / B.length - 1;
  }
  function permutaciones(arr) {
    if (arr.length <= 1) return [arr.slice()];
    return arr.flatMap((x, i) => permutaciones([...arr.slice(0, i), ...arr.slice(i + 1)]).map(r => [x, ...r]));
  }
  async function planCupula(P) {
    const mios = [], rivales = [];
    for (const m of P.mios) { const d = await datosDe(m.num); if (!d) return null; mios.push({ ...m, l: luchador(d, m.num, m.nombre) }); }
    for (const r of P.rivales) { const d = await datosDe(r.num); if (!d) return null; rivales.push({ ...r, l: { ...luchador(d, r.num, r.nombre), tipos: r.tipos.length ? r.tipos : d.t } }); }
    const ordenesRival = permutaciones(rivales);
    let mejor = null, actual = null;
    for (const o of permutaciones(mios)) {
      const visto = fila(o, rivales);
      const media = ordenesRival.reduce((x, r) => x + fila(o, r), 0) / ordenesRival.length;
      const r = { orden: o.map(x => x.nombre), visto, media, gana: ordenesRival.filter(ro => fila(o, ro) > 0).length, de: ordenesRival.length, v: 3 * visto + media };
      if (o.every((x, i) => x.nombre === P.mios[i].nombre)) actual = r;
      if (!mejor || r.v > mejor.v + 1e-9) mejor = r;
    }
    // si el orden que ya hay es igual de bueno, se deja
    return actual && actual.v >= mejor.v - 1e-9 ? actual : mejor;
  }
  let cupula = null;              // { firma, orden, visto, media, rivales, hecho, intentos }
  let ordenandoCupula = null;
  const firmaCupula = P => P.rivales.map(r => r.num).join(',') + '|' + P.mios.map(m => m.nombre).sort().join(',');
  function ordenarCupula() {
    if (!ordenandoCupula) ordenandoCupula = (async () => {
      const P = pantallaCupula();
      if (!P) return;
      const firma = firmaCupula(P);
      if (cupula && cupula.firma === firma && (cupula.hecho || cupula.intentos >= 2)) return;
      const plan = await planCupula(P);
      if (!plan) { cupula = { firma, error: 'No he podido traer los datos de algún Pokémon.', intentos: 9 }; pintar(); return; }
      cupula = { firma, ...plan, rivales: P.rivales.map(r => r.nombre), hecho: false, intentos: ((cupula && cupula.firma === firma && cupula.intentos) || 0) + 1 };
      pintar();
      // se sube a cada uno con ▲ hasta su sitio, de delante hacia atrás
      for (let k = 0; k < plan.orden.length; k++) {
        for (let n = 0; n < 5; n++) {
          const Q = pantallaCupula();
          if (!Q) return;
          const idx = Q.mios.findIndex(m => m.nombre === plan.orden[k]);
          if (idx <= k || !Q.mios[idx].subir) break;
          const antes = Q.mios.map(m => m.nombre).join();
          Q.mios[idx].subir.click();
          for (let t = 0; t < 40; t++) { await sleep(150); const R = pantallaCupula(); if (!R || R.mios.map(m => m.nombre).join() !== antes) break; }
          await pausa(150, 300);
        }
      }
      const F = pantallaCupula();
      cupula.hecho = !!F && F.mios.map(m => m.nombre).join() === plan.orden.join();
      log(`🔀 Contra ${cupula.rivales.join(', ')}: ${plan.orden.join(' → ')}${cupula.hecho ? '' : ' (no he podido ponerlo del todo)'} · ${plan.visto > 0 ? 'debería ganar' : 'se pone difícil'}.`);
      pintar();
    })().finally(() => { ordenandoCupula = null; });
    return ordenandoCupula;
  }

  /* ------------------------------------------------------------------ *
   *  LA TANDA SOLA: elegir, empezar y avanzar con los botones del juego. Si sale una pantalla que no conoce, se para
   *  y deja copiar su HTML (para enseñarle a hacerla).
   * ------------------------------------------------------------------ */
  const RE_AVANCE = /^[^a-z0-9¡]*[¡]?\s*(seguir|continuar|siguiente|al siguiente|siguiente combate|adelante|a por el siguiente|pelear|luchar|combatir|empezar el combate|al combate|saltar|ver (el )?resultado|aceptar|vale|entendido|genial|recoger|cobrar|retar)\b/i;
  const RE_PELIGRO = /abandon|rendir|retir|salir|cancelar|dejarlo|borrar|vender|canjear/i;
  let corriendo = false, parar = false, msg = '', desconocida = false;
  const registro = [];
  const log = t => { registro.push([Date.now(), t]); if (registro.length > 40) registro.shift(); kLog(document.querySelector('#axf-panel .axf-log'), t); };
  function botonAvance() {
    return $$('main button, div.fixed button').filter(b => !ajeno(b) && visible(b) && !b.disabled)
      .find(b => { const t = texto(b); return RE_AVANCE.test(t) && !RE_PELIGRO.test(t); });
  }
  // Cambios de verdad en la pantalla del juego (elementos nuevos o quitados dentro del contenido): no cuentan los
  // relojes de la cabecera (energía, que cambian cada segundo) ni el propio panel
  let cambios = 0;
  new MutationObserver(ms => {
    for (const m of ms) {
      if (m.type !== 'childList' || !(m.addedNodes.length || m.removedNodes.length)) continue;
      const t = m.target;
      if (t.nodeType !== 1 || !t.closest('main') || t.closest('#axf-panel') || t.closest('header') || t.closest('#k-avisos')) continue;
      cambios++; return;
    }
  }).observe(document.documentElement, { childList: true, subtree: true });

  // Energía normal de la cabecera («⚡ 51/54»)
  function energia() {
    const ico = $$('header span').find(x => texto(x) === '⚡');
    const m = ico && texto(ico.parentElement).match(/(\d+)\s*\/\s*\d+/);
    return m ? +m[1] : null;
  }
  // Textos de avisos y mensajes del juego (los flotantes y los párrafos del edificio), para saber qué ha contestado
  function textosJuego() {
    const els = [...$$('[role="status"],[role="alert"],[aria-live],div.fixed,section.fixed'), ...$$('main p, main h2, main h3')];
    return [...new Set(els.filter(el => !ajeno(el) && !el.closest('#mh-panel') && !el.closest('nav') && !el.closest('header') && visible(el))
      .map(texto).filter(t => t && t.length < 200))];
  }
  const RE_CONFIRMAR = /^[^a-z0-9¡]*[¡]?\s*(s[ií]\b|empezar|vamos|adelante|confirmar|pagar|aceptar|dale|a por ello)/i;
  // Pulsa «Empezar la tanda» y espera a ver qué hace el juego: 'empezada' (cambia la pantalla o sale un botón de seguir),
  // 'hecha' (vuelve a la pantalla de elegir pero ha gastado ⚡: se ha jugado entera de golpe) o 'no' (no ha pasado nada)
  async function empezarTanda(boton) {
    const antes = energia(), vistos = new Set(textosJuego()), textos = [];
    const apunta = () => { for (const t of textosJuego()) if (!vistos.has(t)) { vistos.add(t); textos.push(t); } };
    boton.click();
    let confirmados = 0;
    for (let t = 0; t < 10000; t += 300) {
      await sleep(300);
      apunta();
      const E = eleccion();
      if (!E || !E.empezar || !E.empezar.isConnected) return { estado: 'empezada', textos };
      // ¿pide confirmar? (una ventana con «Sí» / «Empezar»…)
      const conf = confirmados < 2 && $$('[role="dialog"] button, [aria-modal="true"] button, div.fixed button')
        .find(b => !ajeno(b) && visible(b) && !b.disabled && RE_CONFIRMAR.test(texto(b)) && !RE_PELIGRO.test(texto(b)));
      if (conf) { log(`Confirmo «${texto(conf)}»`); conf.click(); confirmados++; continue; }
      if (botonAvance()) return { estado: 'empezada', textos };
      const ahora = energia();
      if (antes != null && ahora != null && ahora < antes && t >= 2000) return { estado: 'hecha', textos, antes, despues: ahora };
    }
    apunta();
    const ahora = energia();
    console.log('[axf] tras pulsar «Empezar»: energía', antes, '→', ahora, 'textos nuevos', textos, document.querySelector('main') && document.querySelector('main').outerHTML);
    if (antes != null && ahora != null && ahora < antes) return { estado: 'hecha', textos, antes, despues: ahora };
    return { estado: 'no', textos };
  }

  async function hacerTanda() {
    if (corriendo) { parar = true; return; }
    corriendo = true; parar = false; desconocida = false;
    kPedirPermiso();
    try {
      // a mitad de tanda (p. ej. en la Cúpula antes de un combate): se sigue desde ahí
      if (!eleccion() && (pantallaCupula() || botonAvance())) log('▶ Sigo la tanda donde está.');
      else {
        const R = await recomendacion();
        if (!R || !R.eq) throw new Error(R ? `Solo ${R.validos.length} Pokémon valen aquí y hacen falta ${R.E.necesarios}.` : 'No veo dónde elegir.');
        // 1) quitar lo que haya elegido y marcar los recomendados, en orden
        // (si ya había alguno marcado a mano: se toca cada uno que no toca; si el contador baja, estaba marcado y ya no;
        // si sube, no lo estaba y se vuelve a tocar para dejarlo como estaba)
        if (eleccion().elegidos > 0) {
          for (const p of eleccion().pokes.filter(y => y.vale && !R.eq.some(x => x.p.nombre === y.nombre))) {
            const antes = eleccion().elegidos;
            if (!antes) break;
            p.b.click(); await pausa(250, 400);
            if (eleccion().elegidos > antes) { p.b.click(); await pausa(250, 400); }
          }
        }
        for (const x of R.eq) {
          const p = eleccion().pokes.find(y => y.nombre === x.p.nombre && y.vale);
          if (!p) throw new Error(`No encuentro a ${x.p.nombre}.`);
          const antes = eleccion().elegidos;
          p.b.click(); await pausa(300, 500);
          if (eleccion().elegidos <= antes) { p.b.click(); await pausa(300, 500); }   // ya estaba marcado: se desmarcó
        }
        // se deja al juego un momento para que apunte la elección antes de empezar
        await pausa(1200, 1800);
        const E = eleccion();
        if (E.elegidos !== E.necesarios) throw new Error(`Hay ${E.elegidos} de ${E.necesarios} elegidos; revísalo.`);
        log(`✅ Elegidos: ${R.eq.map(x => x.p.nombre).join(', ')}.`);
        if (!E.empezar || E.empezar.disabled) throw new Error('El botón de empezar está apagado (¿sin energía?).');
        if (parar) throw new Error('Parado.');
        const arranque = await empezarTanda(E.empezar);
        if (arranque.estado === 'hecha') {
          log(`🏁 La tanda se ha jugado de golpe (⚡ ${arranque.antes} → ${arranque.despues}).${arranque.textos.length ? ' ' + arranque.textos.join(' · ') : ''}`);
          kAviso({ tipo: 'fin', app: 'Frente Batalla', icono: EDIFICIOS[edificio()].icono, titulo: 'Tanda terminada', lineas: [EDIFICIOS[edificio()].nombre, ...arranque.textos.slice(0, 3), ...rachaTexto()] });
          return;
        }
        if (arranque.estado === 'no') throw new Error(arranque.textos.length
          ? `El juego no ha empezado la tanda: «${arranque.textos.join(' · ')}».`
          : 'El juego no ha empezado la tanda: al pulsar «Empezar» no ha cambiado nada ni ha gastado ⚡. Pulsa tú «Empezar la tanda» y, si sale algún mensaje, pásamelo.');
        log('▶ Tanda empezada.');
        await pausa(600, 900);
      }
      // 2) avanzar con los botones del juego hasta volver a la pantalla de elegir
      let ultimo = Date.now(), ultimoBoton = Date.now(), cambiosAntes = cambios, pulsados = 0;
      while (!parar) {
        if (!edificio()) throw new Error('Has salido del edificio.');
        const E2 = eleccion();
        if (E2 && E2.empezar && pulsados > 0) { log('🏁 Tanda terminada.'); kAviso({ tipo: 'fin', app: 'Frente Batalla', icono: EDIFICIOS[edificio()].icono, titulo: 'Tanda terminada', lineas: [EDIFICIOS[edificio()].nombre, ...rachaTexto()] }); break; }
        // Cúpula: antes de cada combate, los tuyos en el mejor orden contra los que te esperan
        if (pantallaCupula()) { await ordenarCupula(); if (parar) break; }
        const b = botonAvance();
        if (b) {
          await pausa(500, 900);
          if (!b.isConnected || b.disabled) continue;
          msg = `Pulso «${texto(b)}»`; pintar();
          b.click(); pulsados++; ultimo = ultimoBoton = Date.now();
          await pausa(700, 1100);
          continue;
        }
        if (cambios !== cambiosAntes) { cambiosAntes = cambios; ultimo = Date.now(); }   // algo se mueve (animación del combate)
        // sin botón conocido: 8 s con la pantalla quieta, o 30 s como mucho aunque se mueva algo
        if (Date.now() - ultimo > 8000 || Date.now() - ultimoBoton > 30000) {
          desconocida = true;
          console.log('[axf] pantalla desconocida:', document.querySelector('main') && document.querySelector('main').outerHTML);
          log('⏸ Pantalla que no conozco: la dejo para ti.');
          kAviso({ tipo: 'aviso', app: 'Frente Batalla', icono: '🧩', titulo: 'Pantalla que no conozco', texto: 'Hazla tú y, si quieres que la aprenda, pulsa «Copiar el HTML de esta pantalla» en el panel y pásamelo.' });
          break;
        }
        const seg = Math.round((Date.now() - ultimoBoton) / 1000);
        if (seg >= 3) { const t = `Esperando al juego… ${seg} s`; if (msg !== t) { msg = t; pintar(); } }
        await sleep(400);
      }
      if (parar) log('■ Parado.');
    } catch (e) {
      log('⚠ ' + (e && e.message));
      kAviso({ tipo: 'error', app: 'Frente Batalla', titulo: 'Tanda parada', texto: String(e && e.message) });
    } finally { corriendo = false; parar = false; msg = ''; pintar(); }
  }
  const rachaTexto = () => { const p = $$('main p').map(texto).find(t => /llevas \d+ tanda/i.test(t)); return p ? [p] : []; };

  /* ------------------------------------------------------------------ *
   *  PANEL (arriba del todo del edificio; se queda durante la tanda)
   * ------------------------------------------------------------------ */
  let reco = null, recoFirma = '';
  async function actualizarReco() {
    const E = eleccion();
    const firma = E ? E.pokes.map(p => p.nombre + (p.vale ? '1' : '0')).join(',') + '|' + E.necesarios + '|' + edificio() : '';
    if (!E || firma === recoFirma) return;
    recoFirma = firma;
    reco = await recomendacion();
    pintar();
  }
  const pct = x => Math.round(x * 100) + '%';
  function pintar() {
    const p = document.getElementById('axf-panel');
    if (!p) return;
    const id = edificio(), info = EDIFICIOS[id];
    kSet(p.querySelector('.k-sub'), info ? `${info.nombre} · ${info.nota}` : '');
    kBadge(p.querySelector('.k-badge'), corriendo ? 'on' : desconocida ? 'warn' : 'off', corriendo ? 'EN MARCHA' : desconocida ? 'TE TOCA' : 'LISTO');
    const r = p.querySelector('.axf-reco');
    const html = !reco ? '<p class="text-[11px] font-semibold text-tinta-400">Calculando los mejores…</p>'
      : !reco.eq ? `<p class="text-[11px] font-semibold text-rojo-600">Solo ${reco.validos.length} de los tuyos valen aquí y hacen falta ${reco.E.necesarios}.</p>`
      : `<div class="flex flex-wrap justify-center gap-2">${reco.eq.map((x, i) => `<span class="axf-poke"><img src="/sprites/${x.p.num}.png" alt=""><b>${i + 1}. ${kEsc(x.p.nombre)}</b><small>${pct(x.n1)}</small></span>`).join('')}</div>
         <p class="text-center text-[10px] font-semibold text-tinta-400">Equipo: gana a ≈ ${pct(reco.nota)} de los rivales de referencia (todos los tipos, a Nv.50, sin objetos).</p>`;
    if (r.dataset.h !== html) { r.innerHTML = html; r.dataset.h = html; }
    const c = p.querySelector('.axf-cupula');
    const PC = id === 'cupula' && pantallaCupula();
    const hc = !PC ? ''
      : !cupula || cupula.firma !== firmaCupula(PC) ? '<p class="text-[11px] font-semibold text-tinta-400">Calculando el orden contra los que te esperan…</p>'
      : cupula.error ? `<p class="text-[11px] font-semibold text-rojo-600">${kEsc(cupula.error)}</p>`
      : `<p class="text-[11px] font-extrabold ${cupula.visto > 0 ? 'text-hoja-700' : 'text-rojo-600'}">🔀 Contra ${kEsc(cupula.rivales.join(', '))}: ${cupula.orden.map((n, i) => `${i + 1}. ${kEsc(n)}`).join(' · ')}</p>
         <p class="text-[10px] font-semibold text-tinta-400">${cupula.visto > 0 ? `Con este orden les gana (le sobra ≈ ${pct(cupula.visto - 1)} de vida)` : 'Con cualquier orden se pone difícil: este es el que más les quita'}; si sacaran a los suyos en otro orden, ganaría en ${cupula.gana} de ${cupula.de}.${cupula.hecho ? ' ✔ Puesto.' : ''}</p>`;
    if (c.dataset.h !== hc) { c.innerHTML = hc; c.dataset.h = hc; }
    c.hidden = !hc;
    const b = p.querySelector('.axf-tanda');
    const aMitad = !eleccion() && (PC || botonAvance());
    b.disabled = !corriendo && !(reco && reco.eq && eleccion()) && !aMitad;
    kSet(b, corriendo ? '■ Parar' : aMitad ? '🤖 Seguir la tanda' : `🤖 Elegir y hacer la tanda`);
    kSet(p.querySelector('.axf-msg'), msg);
    p.querySelector('.axf-copiar').hidden = !desconocida;
  }
  const CSS = `
    #axf-panel .axf-poke{display:flex;flex-direction:column;align-items:center;gap:1px;min-width:78px;padding:6px 8px;border-radius:16px;background:rgb(var(--crema-50));border:2px solid rgb(var(--crema-200))}
    #axf-panel .axf-poke img{width:44px;height:44px;image-rendering:pixelated}
    #axf-panel .axf-poke b{font-size:11px;font-weight:800;color:rgb(var(--tinta-800))}
    #axf-panel .axf-poke small{font-size:10px;font-weight:800;color:rgb(var(--tinta-400))}
    #axf-panel .axf-msg:empty{display:none}`;
  function montar() {
    const id = edificio();
    let p = document.getElementById('axf-panel');
    if (!id) { if (p) p.remove(); return; }
    const main = document.querySelector('main main') || document.querySelector('main');
    if (!main) return;
    if (!p) {
      kStyle('axf-kit', '#axf-panel', '#3D6EA8');
      if (!document.getElementById('axf-css')) { const st = document.createElement('style'); st.id = 'axf-css'; st.textContent = CSS; document.head.appendChild(st); }
      p = document.createElement('section');
      p.id = 'axf-panel';
      p.className = 'tarjeta space-y-2 p-3';
      p.setAttribute('data-ax-ignore', '1');
      p.innerHTML = `${kHead('🏝️', 'Frente Batalla automático', '')}
        <div class="axf-reco"></div>
        <div class="axf-cupula space-y-0.5 rounded-card border-2 border-crema-200 bg-crema-50 p-2" hidden></div>
        <button type="button" class="axf-tanda boton-principal w-full !py-2.5 text-sm"></button>
        <p class="text-[10px] font-semibold leading-snug text-tinta-400">Elige a los mejores (todas las combinaciones de los que valen aquí, contra rivales de todos los tipos), empieza la tanda (se pagan los ⚡ del botón del juego) y va pulsando «Seguir» / «Continuar» hasta el final. En la Cúpula, antes de cada combate ordena a los tuyos contra los que te esperan. Si sale algo que aún no sé hacer (las puertas de la Senda, rebuscar en la Pirámide…), se para y te avisa.</p>
        <p class="axf-msg text-center text-[11px] font-bold text-tinta-500"></p>
        <button type="button" class="axf-copiar boton-suave w-full !py-2 text-[11px]" hidden>📋 Copiar el HTML de esta pantalla</button>
        <div class="axf-log ${K_LOG}"></div>`;
      for (const [ts, t] of registro) { const d = new Date(ts), q = document.createElement('p'); q.textContent = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}  ${t}`; p.querySelector('.axf-log').appendChild(q); }
      p.querySelector('.axf-tanda').addEventListener('click', e => { e.preventDefault(); hacerTanda(); });
      p.querySelector('.axf-copiar').addEventListener('click', async e => {
        e.preventDefault();
        const m = (document.querySelector('main') || document.body).cloneNode(true);
        const yo = m.querySelector('#axf-panel'); if (yo) yo.remove();
        const modales = $$('div.fixed.inset-0').map(x => x.outerHTML).join('\n');
        try { await navigator.clipboard.writeText(m.outerHTML + '\n' + modales); msg = '📋 Copiado: pégamelo en el chat.'; }
        catch { console.log('[axf] HTML:', m.outerHTML, modales); msg = 'No pude copiar: está en la consola (F12).'; }
        pintar();
      });
    }
    if (main.firstElementChild !== p) main.insertBefore(p, main.firstElementChild);
    pintar();
    actualizarReco();
    // en la Cúpula se ordena solo en cuanto se ve a los rivales (también si la tanda la llevas tú)
    if (id === 'cupula' && pantallaCupula()) ordenarCupula();
  }
  let tMontar = null;
  new MutationObserver(ms => {
    if (ms.every(m => m.target.nodeType === 1 && m.target.closest && m.target.closest('[data-ax-ignore]'))) return;
    clearTimeout(tMontar); tMontar = setTimeout(montar, 300);
  }).observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(montar, 1200);
  window.__axFrente = { recomendacion, notaEquipo, ventaja, ventajaArena, BANCO };
})();
