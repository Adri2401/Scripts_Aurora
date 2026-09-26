// ==UserScript==
// @name         Aurora Dex · Entrañas del Monte Plateado
// @namespace    auroradex-entranas
// @version      0.1.0
// @updateURL    https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_entranas.user.js
// @downloadURL  https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_entranas.user.js
// @description  Solo en /entranas. Graba cada pantalla, cada elección y cada golpe de tus bajadas (y lo exporta), aprende de ello (nivel de los rivales por piso, qué sale en cada bioma, cuánto pegan de verdad los tuyos con tus mejoras) y recomienda con ⭐ en cada decisión: prestado, bendición (o volver a tirar), puerta y orden del equipo, con un modelo de combate que cuenta las reglas de cada bioma. Enseña los mejores Pokémon de la Pokédex para cada bioma. Con ▶ baja solo, parándose ante lo que no conoce; nunca pulsa «Retirarse».
// @match        https://auroradex.es/*
// @match        https://www.auroradex.es/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  'use strict';
  const VERSION = '0.1.0';
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

  /* ------------------------------------------------------------------ *
   *  ENTRAÑAS DEL MONTE PLATEADO (/entranas)
   *  Bajada sin fondo: un prestado, reclutas, bendiciones y puertas. 6 biomas de 5 pisos (el 5º, guardián) y desde el
   *  31 vuelta a empezar, más fuerte. Este script:
   *   · GRABA cada pantalla, lo que eliges y cada golpe de cada combate (para aprender y para exportarlo).
   *   · APRENDE de lo grabado: nivel de los rivales por piso, qué especies salen en cada bioma y cuánto pegan de verdad
   *     los tuyos y los rivales (tus mejoras 💎 cambian las cuentas).
   *   · RECOMIENDA en cada decisión (prestado, bendición, puerta, reclutar) con un modelo de combate con las reglas de
   *     cada bioma, y lo marca con ⭐ en la propia pantalla.
   *   · BAJA SOLO si quieres (▶), parándose ante cualquier pantalla que no conozca. Nunca pulsa «Retirarse».
   * ------------------------------------------------------------------ */
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const pausa = (a, b) => sleep(a + Math.random() * (b - a));
  const texto = el => (el && el.textContent || '').replace(/\s+/g, ' ').trim();
  const norm = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const enEntranas = () => /^\/entranas(\/|$)/.test(location.pathname);
  const PANEL_ID = 'axe-panel';
  const ajeno = el => !!(el.closest('#' + PANEL_ID) || el.closest('#k-avisos') || el.closest('[data-ax-ignore]'));
  const visible = el => !!el && el.getClientRects().length > 0;
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } };
  const lsPut = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };
  const numSprite = img => { const m = img && (img.getAttribute('src') || '').match(/\/sprites\/(?:[a-z-]+\/)*(\d+)\.(?:png|gif|webp)/); return m ? +m[1] : null; };
  const pct = x => Math.round(x * 100) + '%';

  /* ─── Tipos (tabla completa; el juego: muy eficaz ×1,65 y poco eficaz ×0,6 por cada tipo) ─── */
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
  const TIPOS = Object.keys(TABLA);
  const eficacia = (t, tipos) => tipos.reduce((m, x) => { const v = (TABLA[t] || {})[x] ?? 1; return m * (v === 0 ? 0 : v > 1 ? 1.65 : v < 1 ? 0.6 : 1); }, 1);
  const tipoDe = t => { const n = norm(t); return TABLA[n] ? n : null; };

  /* ─── Pokédex 1-649 (PokéAPI): estadísticas base PS.ATQ.DEF.ATE.DFE.VEL : tipos : nombre (* = legendario/singular) ─── */
  const DEX = {}, DEX_NOMBRE = {};
  DEX_DATOS.split(',').forEach((x, i) => {
    const [s, t, n] = x.split(':');
    const leg = n.endsWith('*'), nombre = leg ? n.slice(0, -1) : n;
    DEX[i + 1] = { num: i + 1, s: s.split('.').map(Number), t: t.split('/'), nombre, leg };
    DEX_NOMBRE[norm(nombre)] = i + 1;
  });
  const numDeNombre = n => DEX_NOMBRE[norm(n)] || null;

  /* ─── Biomas (del propio juego) y lo que se supone que sale en cada uno (se corrige con lo que se va viendo) ─── */
  const BIOMAS = [
    { id: 'roca', nombre: 'Galerías de Roca', ico: '🪨', efecto: 'Sin sorpresas.', tipos: ['roca', 'tierra'] },
    { id: 'lago', nombre: 'Lago Subterráneo', ico: '💧', efecto: 'Tus Agua van un 20% más fuertes en todo.', tipos: ['agua'] },
    { id: 'bosque', nombre: 'Bosque de Raíces', ico: '🌿', efecto: 'Los salvajes salen de dos en dos.', tipos: ['planta', 'bicho'] },
    { id: 'cripta', nombre: 'Cripta de Niebla', ico: '🌫️', efecto: 'No se ve qué hay tras cada puerta.', tipos: ['fantasma', 'psiquico', 'siniestro'] },
    { id: 'glaciar', nombre: 'Glaciar de Acero', ico: '❄️', efecto: 'Al acabar cada piso, los que no son Hielo pierden un 8% de PS.', tipos: ['hielo', 'acero'] },
    { id: 'magma', nombre: 'Cámara de Magma', ico: '🌋', efecto: 'Los rivales pegan un 15% más; tus Fuego, también.', tipos: ['fuego'] },
  ];
  const biomaDePiso = p => BIOMAS[Math.floor((Math.max(1, p) - 1) / 5) % 6];
  const vueltaDePiso = p => Math.floor((Math.max(1, p) - 1) / 30) + 1;
  const biomaPorNombre = n => BIOMAS.find(b => norm(n).includes(norm(b.nombre))) || null;

  /* ------------------------------------------------------------------ *
   *  APRENDIZAJE (se guarda en el navegador y va en el export)
   *  · niveles: [piso, nivel del rival, tipo de puerta] · especies[bioma][num] = veces vistas
   *  · k.mio / k.rival: daño real ÷ daño previsto (media geométrica), de cada golpe sin crítico del registro
   * ------------------------------------------------------------------ */
  const LS_APR = 'axe-aprende', LS_REG = 'axe-registro', LS_PANT = 'axe-pantallas', LS_CONF = 'axe-conf', SS_AUTO = 'axe-auto';
  const apr = Object.assign({ niveles: [], especies: {}, k: { mio: { n: 0, s: 0 }, rival: { n: 0, s: 0 } }, bajadas: [] }, lsGet(LS_APR, {}));
  const guardaApr = () => lsPut(LS_APR, apr);
  const K_DEF = { mio: 1.1, rival: 1 };            // primeras cuentas con tu combate del piso 2-3: los tuyos pegan un 7-14% más
  const kDe = lado => { const x = apr.k[lado]; return x && x.n >= 3 ? Math.exp(x.s / x.n) : K_DEF[lado]; };
  function nivelRival(piso, puerta = 'combate') {
    const pts = apr.niveles.filter(x => (x[2] || 'combate') === puerta || puerta === 'combate');
    if (pts.length >= 4) {             // recta por mínimos cuadrados (nivel = a + b·piso)
      const n = pts.length, sx = pts.reduce((s, p) => s + p[0], 0), sy = pts.reduce((s, p) => s + p[1], 0);
      const sxx = pts.reduce((s, p) => s + p[0] * p[0], 0), sxy = pts.reduce((s, p) => s + p[0] * p[1], 0);
      const b = (n * sxx - sx * sx) ? (n * sxy - sx * sy) / (n * sxx - sx * sx) : 1.5, a = (sy - b * sx) / n;
      const L = a + b * piso;
      return Math.max(2, Math.round(puerta === 'elite' ? L + 3 : puerta === 'guardian' ? L + 4 : L));
    }
    const L = 11 + 1.5 * piso;
    return Math.round(puerta === 'elite' ? L + 3 : puerta === 'guardian' ? L + 4 : L);
  }

  /* ------------------------------------------------------------------ *
   *  MODELO DE COMBATE (el de Tiers, con niveles): PS = 3·base·Nv/100 + Nv + 14 · resto = 2·base·Nv/100 + 5 · una
   *  sola «Especial» (media de At. Esp. y Def. Esp.) · pega con su tipo más eficaz, físico si su Ataque ≥ At. Esp. ·
   *  daño = ((2·Nv/5+2)·30,5·A/D/50 + 2) · 1,5 si es de su tipo · eficacia · k (lo aprendido) · críticos ~9% ×1,64.
   *  Bioma: Lago (Agua tuyos ×1,2 en todo), Magma (rivales ×1,15 de daño y tus Fuego también), Glaciar (los tuyos que
   *  no son Hielo, −8% de PS por piso), Bosque (salvajes de dos en dos).
   * ------------------------------------------------------------------ */
  function stats(b, L) {
    const st = x => Math.floor(2 * x * L / 100) + 5;
    return { hp: Math.floor(3 * b[0] * L / 100) + L + 14, atk: st(b[1]), def: st(b[2]), esp: st(Math.round((b[3] + b[4]) / 2)), spe: st(b[5]), fis: b[1] >= b[3] };
  }
  // Un luchador. mods: { hp, atk, def, esp, spe } multiplicadores; vida: fracción de PS con la que empieza
  function luchador(num, L, o = {}) {
    const d = DEX[num];
    const base = d ? d.s : [60, 60, 60, 60, 60, 60];
    const st = stats(base, L), m = o.mods || {};
    const tipos = o.tipos && o.tipos.length ? o.tipos : d ? d.t : ['normal'];
    const x = { num, nombre: o.nombre || (d ? d.nombre : '?'), L, tipos, mio: !!o.mio, fis: st.fis,
      hp: Math.round((o.hpMax || st.hp) * (m.hp || 1)), atk: st.atk * (m.atk || 1), def: st.def * (m.def || 1), esp: st.esp * (m.esp || 1), spe: st.spe * (m.spe || 1) };
    x.vida = o.vida ?? 1;
    return x;
  }
  function conBioma(x, bioma) {
    if (!bioma) return x;
    if (bioma.id === 'lago' && x.mio && x.tipos.includes('agua')) return { ...x, hp: x.hp * 1.2, atk: x.atk * 1.2, def: x.def * 1.2, esp: x.esp * 1.2, spe: x.spe * 1.2 };
    if (bioma.id === 'glaciar' && x.mio && !x.tipos.includes('hielo')) return { ...x, vida: x.vida * 0.92 };
    return x;
  }
  function danoPS(a, b, bioma) {
    let m = null;
    for (const t of a.tipos) { const e = eficacia(t, b.tipos); if (!m || e > m.e) m = { t, e, propio: true }; }
    if (m.e < 1) { const en = eficacia('normal', b.tipos); if (en > m.e) m = { t: 'normal', e: en, propio: a.tipos.includes('normal') }; }
    if (m.e === 0) return b.hp / 16;
    const fis = !m.propio || a.fis, A = fis ? a.atk : a.esp, D = fis ? b.def : b.esp;
    let d = ((2 * a.L / 5 + 2) * 30.5 * A / D / 50 + 2) * (m.propio ? 1.5 : 1) * m.e * kDe(a.mio ? 'mio' : 'rival');
    if (bioma && bioma.id === 'magma' && (!a.mio || a.tipos.includes('fuego'))) d *= 1.15;
    return d;
  }
  const golpe = (a, b, bioma) => danoPS(a, b, bioma) * (1 + 0.09 * 0.64) / b.hp;
  const HOLGAZAN = 289;
  // Combate en fila (pelean los tres primeros que sigan en pie; el que gana sigue con lo que le queda)
  function fila(mios, rivales, bioma) {
    const A = mios.filter(x => x.vida > 0).slice(0, 3).map(x => ({ l: x, v: x.vida })), B = rivales.map(x => ({ l: x, v: 1 }));
    const g = (x, y) => golpe(x, y, bioma) * (x.num === HOLGAZAN ? 0.5 : 1);
    let i = 0, j = 0;
    for (let n = 0; i < A.length && j < B.length && n < 400; n++) {
      const a = A[i], b = B[j];
      if (a.l.spe >= b.l.spe) { b.v -= g(a.l, b.l); if (b.v <= 0) { j++; continue; } a.v -= g(b.l, a.l); if (a.v <= 0) i++; }
      else { a.v -= g(b.l, a.l); if (a.v <= 0) { i++; continue; } b.v -= g(a.l, b.l); if (b.v <= 0) j++; }
    }
    const gana = j >= B.length;
    const perdida = A.reduce((s, x, k) => s + (x.l.vida - (k < i ? 0 : Math.max(0, x.v))), 0);
    return { gana, perdida };
  }

  /* ─── Rivales esperados: especies vistas en ese bioma (si hay bastantes) o, si no, sus tipos con 4 repartos ─── */
  const PERFILES = [[60, 65, 60, 55, 55, 60], [50, 80, 50, 45, 50, 75], [80, 60, 80, 55, 70, 40], [55, 50, 55, 80, 70, 65]];
  function bancoRivales(bioma, L) {
    const vistas = Object.entries(apr.especies[bioma.id] || {}).filter(([n]) => DEX[n]);
    if (vistas.length >= 5) return vistas.flatMap(([n, c]) => Array(Math.min(4, c)).fill(0).map(() => luchador(+n, L)));
    const tipos = [...bioma.tipos, ...bioma.tipos.map(t => t + '/' + (t === 'roca' ? 'tierra' : 'volador'))];
    return tipos.flatMap(t => PERFILES.map(p => { const x = luchador(0, L, { tipos: t.split('/') }); const st = stats(p, L); return { ...x, ...st, tipos: t.split('/'), mio: false, vida: 1 }; }));
  }
  // Grupos de rivales de una puerta (reproducibles): combate 1 (2 en el Bosque), élite 2, guardián 3
  function gruposRivales(piso, puerta, n = 40, Lfijo = null) {
    const bioma = biomaDePiso(piso), L = Lfijo || nivelRival(piso, puerta), banco = bancoRivales(bioma, L);
    const cuantos = puerta === 'guardian' ? 3 : puerta === 'elite' ? 2 : bioma.id === 'bosque' ? 2 : 1;
    let s = 7 + piso * 13; const azar = () => (s = (s * 16807) % 2147483647) / 2147483647;
    return Array.from({ length: n }, () => Array.from({ length: cuantos }, () => banco[Math.floor(azar() * banco.length)]));
  }
  // Probabilidad de ganar una puerta y PS que cuesta (media)
  function evaluarPuerta(equipo, piso, puerta) {
    const bioma = biomaDePiso(piso), mios = equipo.map(x => conBioma(x, bioma));
    const grupos = gruposRivales(piso, puerta);
    let g = 0, p = 0;
    for (const gr of grupos) { const r = fila(mios, gr, bioma); if (r.gana) g++; p += r.perdida; }
    return { gana: g / grupos.length, coste: p / grupos.length };
  }
  // Fuerza de un equipo para lo que viene: media de ganar la élite del piso siguiente y el guardián de su bioma
  function fuerza(equipo, piso) {
    const sig = piso + 1, guard = Math.ceil(piso / 5) * 5 + (piso % 5 === 0 ? 5 : 0);
    return 0.5 * evaluarPuerta(equipo, sig, 'elite').gana + 0.5 * evaluarPuerta(equipo, guard, 'guardian').gana;
  }

  /* ------------------------------------------------------------------ *
   *  LEER LA PANTALLA
   * ------------------------------------------------------------------ */
  const raiz = () => document.querySelector('main main') || document.querySelector('main');
  const seccionCon = re => $$('main section').find(s => !ajeno(s) && re.test(texto(s.querySelector('p') || s)));
  let ultimaCab = null;
  function cabecera() {
    const p = $$('main p').find(x => !ajeno(x) && /^piso \d+$/i.test(texto(x)));
    if (!p) return null;
    ultimaCab = null;
    const sec = p.closest('section');
    const piso = +texto(p).match(/\d+/)[0];
    const bioma = biomaPorNombre(texto(sec.querySelector('p'))) || biomaDePiso(piso);
    const esq = texto(sec).match(/💎\s*(\d+) en esta bajada/);
    ultimaCab = { piso, bioma, vuelta: vueltaDePiso(piso), esquirlas: esq ? +esq[1] : null, pluma: /pluma lista/i.test(texto(sec)) };
    return ultimaCab;
  }
  const tiposEn = el => $$('span', el).filter(s => !s.children.length).map(s => tipoDe(texto(s))).filter(Boolean);
  function equipoActual() {
    const sec = seccionCon(/^tu equipo/i);
    if (!sec) return [];
    return $$('li[data-id]', sec).map(li => {
      const img = li.querySelector('img'), num = numSprite(img) || numDeNombre(img && img.alt);
      const t = texto(li), L = +((t.match(/Nv\.\s*(\d+)/) || [])[1] || 20), ps = t.match(/(\d+)\s*\/\s*(\d+)\s*$/) || t.match(/(\d+)\s*\/\s*(\d+)/);
      const hpMax = ps ? +ps[2] : null, hp = ps ? +ps[1] : hpMax;
      const l = luchador(num, L, { mio: true, hpMax, tipos: tiposEn(li), nombre: img && img.alt });
      l.vida = hpMax ? hp / hpMax : 1; l.id = li.dataset.id; l.li = li;
      return l;
    });
  }
  const bendicionesTengo = () => { const s = seccionCon(/^bendiciones$/i); return s ? $$('span[title]', s).map(x => ({ nombre: texto(x).replace(/^\S+\s/, ''), desc: x.title })) : []; };
  // Tipo de pantalla y sus opciones
  function pantalla() {
    if (!enEntranas()) return null;
    const modal = $$('div.fixed.inset-0').find(d => !ajeno(d) && visible(d));
    if (modal) {
      const b = $$('button', modal).find(x => /^seguir$|^continuar$|^vale$|^aceptar$/i.test(texto(x)));
      return { tipo: 'aviso', texto: texto(modal), boton: b || null, raiz: modal };
    }
    const cab = cabecera();
    const secP = seccionCon(/elige tu prestado/i);
    if (secP) return { tipo: 'prestado', cab, opciones: $$('button', secP).map(b => {
      const img = b.querySelector('img'), t = texto(b);
      return { b, num: numSprite(img) || numDeNombre(img && img.alt), nombre: img ? img.alt : t, L: +((t.match(/Nv\.\s*(\d+)/) || [])[1] || 20), hpMax: +((t.match(/(\d+)\s*PS/) || [])[1] || 0) || null, tipos: tiposEn(b) };
    }) };
    const secB = seccionCon(/elige una bendici/i);
    if (secB) {
      const ops = $$('button', secB).filter(b => b.querySelector('span.block'));
      return { tipo: 'bendicion', cab, opciones: ops.map(b => ({ b, nombre: texto(b.querySelector('span.block')), desc: texto($$('span.block', b)[1]), ico: texto(b.querySelector('[aria-hidden]')) })),
        reroll: $$('button', secB).find(b => /volver a tirar/i.test(texto(b)) && !b.disabled) || null };
    }
    const hP = $$('main p').find(x => !ajeno(x) && /^elige puerta/i.test(texto(x)));
    if (hP) {
      const sec = hP.closest('section');
      return { tipo: 'puerta', cab, opciones: $$('button', sec).map(b => {
        const sp = $$('span.block', b).filter(x => !x.hasAttribute('aria-hidden')), nombre = texto(sp[0]) || texto(b);
        const n = norm(nombre), clase = /guardian/.test(n) ? 'guardian' : /elite/.test(n) ? 'elite' : /descanso/.test(n) ? 'descanso' : /combate/.test(n) ? 'combate' : /misterio/.test(n) ? 'misterio' : 'oculta';
        return { b, nombre, desc: texto(sp[1]), clase, ico: texto(b.querySelector('span[aria-hidden]')) };
      }) };
    }
    const reclutar = $$('main button').find(b => !ajeno(b) && visible(b) && /reclut/i.test(texto(b)));
    if (reclutar) return { tipo: 'reclutar', cab, botones: $$('main button').filter(b => !ajeno(b) && visible(b)), boton: reclutar };
    const seguir = $$('main button.boton-principal').find(b => !ajeno(b) && visible(b) && /^seguir$/i.test(texto(b)));
    if (seguir && $$('main button').some(b => /repasar/i.test(texto(b)))) return { tipo: 'combate', boton: seguir, cab: cab || ultimaCab };
    const bajar = $$('main button').find(b => !ajeno(b) && visible(b) && /bajar/i.test(texto(b)) && /⛰/.test(texto(b)));
    if (bajar) return { tipo: 'lobby', boton: bajar, gratis: /gratis/i.test(texto(bajar)) };
    const mejoras = $$('main nav button[aria-pressed="true"]').find(b => /mejoras/i.test(texto(b)));
    if (mejoras) return { tipo: 'mejoras' };
    return { tipo: 'otra', cab };
  }

  /* ------------------------------------------------------------------ *
   *  COMBATE: leer el registro (quién pega a quién, con qué, cuánto y si fue crítico) y aprender de él
   * ------------------------------------------------------------------ */
  function leerCombate() {
    const caja = $$('main .tarjeta').find(t => !ajeno(t) && /overflow-y-auto/.test(t.className));
    if (!caja) return null;
    const lineas = [];
    let mio = null, rival = null;
    for (const el of caja.children) {
      const t = texto(el);
      let m;
      if (el.tagName === 'P') {
        if ((m = t.match(/^(.+?) \(Nv\.(\d+)\) sale al paso de (.+?) \(Nv\.(\d+)\)/))) { mio = { nombre: m[1], L: +m[2] }; rival = { nombre: m[3], L: +m[4] }; }
        else if ((m = t.match(/el rival saca a (.+?) \(Nv\.(\d+)\)/i))) rival = { nombre: m[1], L: +m[2] };
        else if ((m = t.match(/^(?:sacas a |sale )(.+?) \(Nv\.(\d+)\)/i))) mio = { nombre: m[1], L: +m[2] };
        lineas.push({ t });
        continue;
      }
      const movEl = el.querySelector('span.truncate span.truncate') || el.querySelector('span.truncate');
      const sp = [texto(movEl), texto(el.querySelector('span.block.truncate'))];
      const dmg = +((t.match(/−\s*(\d+)\s*PS/) || t.match(/-\s*(\d+)\s*PS/) || [])[1] || 0);
      const quien = (sp[1] || '').split('·')[0].trim();
      const tipoMov = tipoDe(((sp[1] || '').match(/\(([^)]+)\)\s*$/) || [])[1] || '');
      const deMio = /border-hoja/.test(el.className);
      lineas.push({ mov: sp[0] || '', quien, tipo: tipoMov, fis: /FÍS/.test(t), dmg, crit: /crítico/i.test(t), efic: /muy eficaz/i.test(t) ? 'muy' : /poco eficaz|no es muy/i.test(t) ? 'poco' : /no afecta/i.test(t) ? 'nada' : '',
        lado: deMio ? 'mio' : 'rival', a: deMio ? mio : rival, d: deMio ? rival : mio });
    }
    // rivales de la tarjeta de arriba (nombre, nivel, tipos, PS máx) y cuántos eran
    const tarj = $$('main h3').filter(h => !ajeno(h)).map(h => { const c = h.closest('div.rounded-card') || h.parentElement.parentElement; const t = texto(c); return { nombre: texto(h), L: +((t.match(/Nv\.(\d+)/) || [])[1] || 0), tipos: tiposEn(c), ps: t.match(/(\d+)\/(\d+) PS/) }; });
    const titulo = texto($$('main p').find(p => !ajeno(p) && /rival|salvaje|guardi|paso/i.test(texto(p)) && p.closest('main main')) || null);
    return { lineas, tarjetas: tarj, titulo };
  }
  // Aprende de un combate: niveles de los rivales, especies del bioma y k de daño (golpes sin crítico y con efecto)
  function aprenderCombate(c, cab, puerta) {
    if (!c || !cab) return;
    const b = cab.bioma.id;
    const vistos = new Set();
    for (const l of c.lineas) {
      if (!l.t) continue;
      let m;
      if ((m = l.t.match(/sale al paso de (.+?) \(Nv\.(\d+)\)/)) || (m = l.t.match(/el rival saca a (.+?) \(Nv\.(\d+)\)/i))) {
        const n = numDeNombre(m[1]);
        if (!vistos.has(m[1])) { vistos.add(m[1]); apr.niveles.push([cab.piso, +m[2], puerta || 'combate']); if (n) { apr.especies[b] = apr.especies[b] || {}; apr.especies[b][n] = (apr.especies[b][n] || 0) + 1; } }
      }
    }
    for (const l of c.lineas) {
      if (l.t || !l.dmg || l.crit || !l.a || !l.d || !l.tipo) continue;
      const na = numDeNombre(l.a.nombre), nd = numDeNombre(l.d.nombre);
      if (!na || !nd) continue;
      const A = luchador(na, l.a.L, { mio: l.lado === 'mio' }), D = luchador(nd, l.d.L, { mio: l.lado !== 'mio' });
      const propio = A.tipos.includes(l.tipo), Aa = l.fis ? A.atk : A.esp, Dd = l.fis ? D.def : D.esp;
      let prev = ((2 * A.L / 5 + 2) * 30.5 * Aa / Dd / 50 + 2) * (propio ? 1.5 : 1) * eficacia(l.tipo, D.tipos);
      if (cab.bioma.id === 'magma' && (l.lado === 'rival' || A.tipos.includes('fuego'))) prev *= 1.15;
      if (cab.bioma.id === 'lago' && l.lado === 'mio' && A.tipos.includes('agua')) prev *= 1.2;
      if (prev < 3 || l.dmg < 3) continue;                  // golpes muy pequeños: el redondeo pesa demasiado
      const r = Math.log(l.dmg / prev);
      if (Math.abs(r) > 1) continue;                        // algo raro (bendición, objeto…): no se cuenta
      const k = apr.k[l.lado]; k.n++; k.s += r;
    }
    if (apr.niveles.length > 400) apr.niveles = apr.niveles.slice(-400);
    guardaApr();
  }

  /* ------------------------------------------------------------------ *
   *  DECISIONES
   * ------------------------------------------------------------------ */
  const conf = Object.assign({ prioridad: 'pisos', empezarGratis: true }, lsGet(LS_CONF, {}));
  const guardaConf = () => lsPut(LS_CONF, conf);
  // Prestado: el que más fuerza da para los próximos biomas (a su nivel y PS reales)
  function decidirPrestado(P) {
    const piso = (P.cab && P.cab.piso) || 1;
    const ops = P.opciones.map(o => {
      const l = luchador(o.num, o.L, { mio: true, hpMax: o.hpMax, tipos: o.tipos, nombre: o.nombre });
      // media ponderada de los tres primeros biomas (las bajadas suelen acabar antes de que importe el resto)
      const v = [[piso + 1, 0.4], [piso + 6, 0.35], [piso + 11, 0.25]].reduce((s, [p, w]) => s + w * (0.5 * evaluarPuerta([l], p, 'combate').gana + 0.5 * evaluarPuerta([l], p, 'elite').gana), 0);
      return { ...o, v };
    }).sort((a, b) => b.v - a.v);
    return { mejor: ops[0], lista: ops, texto: ops.map(o => `${o.nombre} ${pct(o.v)}`).join(' · ') };
  }
  // Bendición: se lee su efecto y se simula («+15% de Velocidad a todo el equipo», «+25% de Ataque y Especial a los de
  // tipo Tierra», «sube 3 niveles»…). Lo que no es de estadísticas lleva un valor fijo.
  function efectoBendicion(o) {
    const d = norm(o.desc + ' ' + o.nombre);
    let m;
    if ((m = d.match(/\+(\d+)% de ([a-z ]+?) a (todo el equipo|los de tipo ([a-z]+))/))) {
      const f = 1 + (+m[1]) / 100, st = m[2], tipo = m[4] ? tipoDe(m[4]) : null;
      const mods = {};
      if (/ps/.test(st)) mods.hp = f;
      if (/ataque/.test(st)) mods.atk = f;
      if (/especial/.test(st)) mods.esp = f;
      if (/defensa/.test(st)) { mods.def = f; }
      if (/velocidad/.test(st)) mods.spe = f;
      if (Object.keys(mods).length) return { mods, tipo };
    }
    if ((m = d.match(/sube (\d+) niveles/))) return { niveles: +m[1] };
    if (/esquirlas/.test(d)) return { fijo: conf.prioridad === 'esquirlas' ? 0.08 : 0.012, porque: 'más esquirlas' };
    if (/descansos? curan/.test(d)) return { fijo: 0.03, porque: 'descansos mejores' };
    if (/reclut/.test(d)) return { fijo: equipoActual().length < 4 ? 0.04 : 0.015, porque: 'reclutas más fuertes' };
    return { fijo: 0.02, porque: 'efecto que no sé medir' };
  }
  function aplicarEfecto(equipo, ef) {
    if (ef.mods) return equipo.map(x => (ef.tipo && !x.tipos.includes(ef.tipo)) ? x : { ...x, hp: x.hp * (ef.mods.hp || 1), atk: x.atk * (ef.mods.atk || 1), def: x.def * (ef.mods.def || 1), esp: x.esp * (ef.mods.esp || 1), spe: x.spe * (ef.mods.spe || 1) });
    if (ef.niveles) return equipo.map(x => { const y = luchador(x.num, x.L + ef.niveles, { mio: true, tipos: x.tipos, nombre: x.nombre }); const f = x.hp / luchador(x.num, x.L, { mio: true }).hp; return { ...y, hp: y.hp * f, vida: x.vida }; });
    return equipo;
  }
  function decidirBendicion(P) {
    const eq = equipoActual(), piso = (P.cab && P.cab.piso) || 1;
    if (!eq.length) return null;
    const base = fuerza(eq, piso);
    const ops = P.opciones.map(o => {
      const ef = efectoBendicion(o);
      const v = ef.fijo != null ? ef.fijo : fuerza(aplicarEfecto(eq, ef), piso) - base;
      return { ...o, v, porque: ef.porque || '' };
    }).sort((a, b) => b.v - a.v);
    const tirar = P.reroll && ops[0].v < 0.015;
    return { mejor: ops[0], lista: ops, tirar, texto: ops.map(o => `${o.nombre} ${o.v >= 0 ? '+' : ''}${(o.v * 100).toFixed(1)}`).join(' · ') + (tirar ? ' → mejor volver a tirar' : '') };
  }
  // Puerta: ganar, lo que cuesta y lo que da. Perder un combate es acabar la bajada.
  function decidirPuerta(P) {
    const eq = equipoActual(), piso = (P.cab && P.cab.piso) || 1;
    const vivos = eq.filter(x => x.vida > 0), caidos = eq.length - vivos.length;
    const vida = eq.length ? eq.reduce((s, x) => s + x.vida, 0) / eq.length : 1;
    const brasas = bendicionesTengo().some(b => /descansos? curan el doble/i.test(b.desc));
    const esq = conf.prioridad === 'esquirlas' ? 2 : 1;
    const ops = P.opciones.map(o => {
      let v, ev = null, porque = '';
      if (o.clase === 'guardian') { ev = evaluarPuerta(eq, piso, 'guardian'); v = 1; porque = `ganas ${pct(ev.gana)}`; }
      else if (o.clase === 'descanso') {
        const cura = brasas ? 0.8 : 0.4, sube = brasas ? 0.5 : 0.25;
        const tras = eq.map(x => ({ ...x, vida: x.vida > 0 ? Math.min(1, x.vida + cura) : sube }));
        v = (fuerza(tras, piso) - fuerza(eq, piso)) * 1.2 + (caidos ? 0.05 * caidos : 0);
        porque = `vida ${pct(vida)} → ${pct(tras.reduce((s, x) => s + x.vida, 0) / tras.length)}`;
      } else if (o.clase === 'combate' || o.clase === 'elite') {
        ev = evaluarPuerta(eq, piso, o.clase);
        const premio = o.clase === 'elite' ? 0.07 * esq : 0.035 + (eq.length < 4 ? 0.07 : 0.01);
        v = ev.gana * premio - (1 - ev.gana) * 1 - ev.coste * 0.08;
        porque = `ganas ${pct(ev.gana)} · cuesta ${pct(ev.coste / Math.max(1, vivos.length))} de vida`;
      } else if (o.clase === 'misterio') { v = 0.02 - (vida < 0.5 ? 0.03 : 0); porque = 'a ciegas'; }
      else { ev = evaluarPuerta(eq, piso, 'combate'); v = 0.01 + ev.gana * 0.02 - (1 - ev.gana) * 0.5; porque = 'no se ve (niebla)'; }
      return { ...o, v, ev, porque };
    }).sort((a, b) => b.v - a.v);
    return { mejor: ops[0], lista: ops, texto: ops.map(o => `${o.nombre}: ${o.porque}`).join(' · ') };
  }
  // Orden recomendado del equipo (pelean los tres primeros que sigan en pie) contra la élite y el guardián que vienen
  let memoOrden = { firma: '', r: null };
  function ordenRecomendado(piso) {
    const eq = equipoActual().filter(x => x.vida > 0);
    if (eq.length < 2) return null;
    const firma = piso + '|' + eq.map(x => x.num + ':' + x.L + ':' + x.vida).join(',') + '|' + apr.niveles.length;
    if (memoOrden.firma === firma) return memoOrden.r;
    memoOrden = { firma, r: ordenRecomendado0(eq, piso) };
    return memoOrden.r;
  }
  function ordenRecomendado0(eq, piso) {
    const perms = [];
    const rec = (pref, resto) => { if (!resto.length) { perms.push(pref); return; } resto.forEach((x, i) => rec([...pref, x], resto.filter((_, j) => j !== i))); };
    rec([], eq);
    let mejor = null;
    for (const o of perms) { const v = fuerza(o, piso); if (!mejor || v > mejor.v + 1e-9) mejor = { o, v }; }
    const actual = fuerza(eq, piso);
    return mejor && mejor.v > actual + 0.01 ? { orden: mejor.o.map(x => x.nombre), v: mejor.v, actual } : { orden: eq.map(x => x.nombre), v: actual, actual, yaBien: true };
  }
  let memoDecidir = { firma: '', R: null };
  function decidir(P) {
    if (!P) return null;
    const firma = P.tipo + '|' + (P.opciones ? P.opciones.map(o => o.nombre + (o.desc || '')).join(',') : '') + '|' + resumenEquipo().map(x => x.num + ':' + x.vida).join(',') + '|' + conf.prioridad + '|' + apr.niveles.length;
    if (memoDecidir.firma === firma) return memoDecidir.R;
    const R = decidir0(P);
    memoDecidir = { firma, R };
    return R;
  }
  function decidir0(P) {
    try {
      if (P.tipo === 'prestado') return decidirPrestado(P);
      if (P.tipo === 'bendicion') return decidirBendicion(P);
      if (P.tipo === 'puerta') return decidirPuerta(P);
    } catch (e) { console.warn('[axe] decidir', e); }
    return null;
  }

  /* ------------------------------------------------------------------ *
   *  LOS MEJORES DE LA POKÉDEX PARA CADA BIOMA (a Nv.40, contra lo que sale ahí y con su regla)
   * ------------------------------------------------------------------ */
  let rankingBiomas = null;
  async function calcularRanking() {
    const res = {};
    for (const bioma of BIOMAS) {
      // tú a Nv.40 contra dos rivales de su bioma a Nv.46: cuenta ganar y la vida que te queda (así pesan los tipos,
      // Ausente y la regla del bioma)
      const piso = BIOMAS.indexOf(bioma) * 5 + 3, L = 40;
      const grupos = gruposRivales(piso, 'elite', 16, L + 6);
      const lista = [];
      for (const d of Object.values(DEX)) {
        if (d.leg) continue;
        const l = conBioma(luchador(d.num, L, { mio: true }), bioma);
        let v = 0;
        for (const gr of grupos) { const r = fila([l], gr, bioma); v += r.gana ? 1 + Math.max(0, l.vida - r.perdida) : 0; }
        lista.push({ d, v: v / grupos.length });
      }
      lista.sort((a, b) => b.v - a.v);
      res[bioma.id] = lista.slice(0, 6);
      await sleep(0);
    }
    rankingBiomas = res;
    pintar();
  }

  /* ------------------------------------------------------------------ *
   *  GRABADORA: cada pantalla nueva (con su HTML la primera vez de cada tipo), lo que pulsas y cada combate
   * ------------------------------------------------------------------ */
  let registro = lsGet(LS_REG, []);
  const pantallas = lsGet(LS_PANT, {});
  function apunta(x) {
    registro.push({ t: Date.now(), ...x });
    if (registro.length > 3000) registro = registro.slice(-3000);
    if (!lsPut(LS_REG, registro)) { registro = registro.slice(-800); lsPut(LS_REG, registro); }
  }
  function guardaPantalla(tipo) {
    const lista = pantallas[tipo] = pantallas[tipo] || [];
    if (lista.length >= 3) return;
    const m = raiz(); if (!m) return;
    const c = m.cloneNode(true); const yo = c.querySelector('#' + PANEL_ID); if (yo) yo.remove();
    lista.push({ t: Date.now(), html: c.outerHTML.slice(0, 60000) + $$('div.fixed.inset-0').filter(d => !ajeno(d)).map(d => d.outerHTML).join('').slice(0, 20000) });
    lsPut(LS_PANT, pantallas);
  }
  const resumenEquipo = () => equipoActual().map(x => ({ num: x.num, nombre: x.nombre, L: x.L, vida: Math.round(x.vida * 100) / 100, hp: x.hp, tipos: x.tipos }));
  let firmaAnt = '', puertaElegida = null, combateGrabado = '', enBajada = false;
  function grabar(P) {
    if (!P) return;
    const cab = P.cab || cabecera();
    const opc = P.opciones ? P.opciones.map(o => o.nombre + (o.desc ? ': ' + o.desc : '') + (o.L ? ` Nv.${o.L}` : '')) : null;
    const firma = P.tipo + '|' + (cab ? cab.piso : '') + '|' + (opc ? opc.join(',') : P.texto || '');
    if (P.tipo === 'combate') {
      const c = leerCombate();
      const f = c ? c.lineas.map(l => l.t || l.mov + l.dmg).join('|') : '';
      if (c && f !== combateGrabado) {
        combateGrabado = f;
        apunta({ tipo: 'combate', piso: cab && cab.piso, bioma: cab && cab.bioma.id, puerta: puertaElegida, combate: { lineas: c.lineas.map(l => { const { a, d, ...r } = l; return { ...r, a: a && `${a.nombre} Nv.${a.L}`, d: d && `${d.nombre} Nv.${d.L}` }; }), tarjetas: c.tarjetas.map(t => ({ ...t, ps: t.ps && t.ps[0] })) }, equipo: resumenEquipo() });
        aprenderCombate(c, cab, puertaElegida);
      }
    }
    if (firma === firmaAnt) return;
    firmaAnt = firma;
    if (P.tipo !== 'lobby' && P.tipo !== 'mejoras' && P.tipo !== 'otra') enBajada = true;
    if (P.tipo === 'lobby' && enBajada) {
      enBajada = false;
      const m = texto(raiz()).match(/caíste en el piso (\d+) y subiste con (\d+) esquirlas/i);
      if (m) { apr.bajadas.push({ t: Date.now(), piso: +m[1], esquirlas: +m[2] }); guardaApr(); log(`🏁 Bajada terminada: piso ${m[1]}, ${m[2]} 💎.`); }
    }
    apunta({ tipo: P.tipo, piso: cab && cab.piso, bioma: cab && cab.bioma.id, esquirlas: cab && cab.esquirlas, opciones: opc, texto: P.tipo === 'aviso' ? P.texto : undefined, equipo: P.tipo === 'lobby' ? undefined : resumenEquipo(), bendiciones: bendicionesTengo().map(b => b.nombre) });
    guardaPantalla(P.tipo);
  }
  // Lo que pulsas tú (o el piloto): el texto del botón y en qué pantalla
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('main button');
    if (!b || ajeno(b) || !enEntranas()) return;
    const P = pantalla();
    const t = texto(b).slice(0, 80);
    if (P && P.tipo === 'puerta') { const o = P.opciones.find(x => x.b === b); if (o) puertaElegida = o.clase; }
    apunta({ tipo: 'pulsa', en: P && P.tipo, boton: t, piso: P && P.cab && P.cab.piso, auto: pilotoPulsa });
  }, true);
  function exportar() {
    const datos = { script: 'Aurora Dex · Entrañas', version: VERSION, exportado: new Date().toISOString(), aprende: apr, registro, pantallas };
    const json = JSON.stringify(datos);
    try {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      a.download = `entranas-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      log(`📤 Exportado (${Math.round(json.length / 1024)} KB): pásame el fichero.`);
    } catch (e) {
      navigator.clipboard.writeText(json).then(() => log('📋 Copiado al portapapeles: pégamelo.'), () => log('⚠ No he podido exportar.'));
    }
  }

  /* ------------------------------------------------------------------ *
   *  PILOTO: baja solo con las decisiones de arriba. Se para ante lo que no conoce, si le das a ■, si cae la bajada o
   *  si no es gratis empezar. Nunca pulsa «Retirarse».
   * ------------------------------------------------------------------ */
  let piloto = sessionStorage.getItem(SS_AUTO) === '1', pilotoPulsa = false, pilotoEnMarcha = false, msg = '';
  const setPiloto = v => { piloto = v; try { sessionStorage.setItem(SS_AUTO, v ? '1' : '0'); } catch { /* nada */ } pintar(); if (v) bucle(); };
  const parar = (porque, tipo = 'aviso') => { setPiloto(false); msg = ''; if (porque) { log(porque); kAviso({ tipo, app: 'Entrañas', icono: '⛰️', titulo: 'Piloto parado', texto: porque }); } };
  async function pulsar(b, que) {
    if (!b || !b.isConnected || b.disabled) return false;
    if (/retirarse/i.test(texto(b))) return false;
    await pausa(500, 900);
    if (!piloto || !b.isConnected) return false;
    msg = que; pintar();
    pilotoPulsa = true; try { b.click(); } finally { pilotoPulsa = false; }
    const antes = firmaAnt;
    for (let i = 0; i < 30; i++) { await sleep(200); const P = pantalla(); grabar(P); if (firmaAnt !== antes || !b.isConnected) break; }
    return true;
  }
  async function bucle() {
    if (pilotoEnMarcha) return;
    pilotoEnMarcha = true;
    let quieto = Date.now();
    try {
      while (piloto && enEntranas()) {
        const P = pantalla();
        grabar(P);
        const R = decidir(P);
        pintar(P, R);
        let hecho = false;
        if (P.tipo === 'aviso' && P.boton) hecho = await pulsar(P.boton, `Pulso «${texto(P.boton)}»`);
        else if (P.tipo === 'combate') hecho = await pulsar(P.boton, 'Combate: sigo');
        else if (P.tipo === 'prestado' && R) { log(`🤲 Prestado: ${R.mejor.nombre} (${R.texto}).`); hecho = await pulsar(R.mejor.b, `Elijo a ${R.mejor.nombre}`); }
        else if (P.tipo === 'bendicion' && R) {
          if (R.tirar) { log(`🎲 Bendiciones flojas (${R.texto}): vuelvo a tirar.`); hecho = await pulsar(P.reroll, 'Vuelvo a tirar'); }
          else { log(`✨ ${R.mejor.nombre} (${R.texto}).`); hecho = await pulsar(R.mejor.b, `Elijo ${R.mejor.nombre}`); }
        } else if (P.tipo === 'puerta' && R) { log(`🚪 Piso ${P.cab ? P.cab.piso : '?'}: ${R.mejor.nombre} (${R.mejor.porque}).`); hecho = await pulsar(R.mejor.b, `Puerta: ${R.mejor.nombre}`); }
        else if (P.tipo === 'reclutar') {
          if (equipoActual().length < 4 && /^\W*reclutar/i.test(texto(P.boton))) { log('🤝 Recluto (hay hueco en el equipo).'); hecho = await pulsar(P.boton, 'Recluto'); }
          else { parar('Pantalla de reclutar con el equipo lleno: elige tú (y exporta el registro para que aprenda a hacerlo).'); break; }
        } else if (P.tipo === 'lobby') {
          if (enBajada) { parar('🏁 Bajada terminada.', 'fin'); break; }
          if (conf.empezarGratis && P.gratis) { log('⛰️ Empiezo la bajada (hoy es gratis).'); hecho = await pulsar(P.boton, 'Bajo'); }
          else { parar(P.gratis ? 'Para empezar, dale tú a «Bajar».' : 'Bajar hoy ya no es gratis: no empiezo solo.'); break; }
        }
        if (hecho) { quieto = Date.now(); continue; }
        if (Date.now() - quieto > 9000) {
          guardaPantalla('desconocida');
          parar('⏸ Pantalla que no conozco: hazla tú. Ya la he guardado para aprenderla (📤 Exportar).');
          break;
        }
        await sleep(400);
      }
    } catch (e) { console.warn('[axe] piloto', e); parar('⚠ ' + (e && e.message)); }
    finally { pilotoEnMarcha = false; msg = ''; pintar(); }
  }

  /* ------------------------------------------------------------------ *
   *  PANEL (arriba del todo, con los colores de las Entrañas)
   * ------------------------------------------------------------------ */
  const CSS = `
    #${PANEL_ID}{background:#131A2B;border:2px solid #2E3B57;color:#C9D3E3;border-radius:22px;padding:12px;font-size:12px}
    #${PANEL_ID} b{color:#EEF3FA}
    #${PANEL_ID} .t{font-family:var(--font-display),system-ui,sans-serif;font-weight:800;font-size:15px;color:#EEF3FA}
    #${PANEL_ID} .s{font-size:10px;font-weight:700;color:#8391AB}
    #${PANEL_ID} .caja{background:#1B2438;border:1.5px solid #2E3B57;border-radius:16px;padding:8px 10px;margin-top:8px}
    #${PANEL_ID} .reco{border-color:#E8C35A;box-shadow:0 0 12px rgba(232,195,90,.25)}
    #${PANEL_ID} .reco .t2{color:#E8C35A;font-weight:800}
    #${PANEL_ID} .bts{display:grid;grid-template-columns:2fr 1fr 1fr;gap:6px;margin-top:8px}
    #${PANEL_ID} button{border-radius:14px;padding:8px 6px;font-weight:800;font-size:12px;border:1.5px solid #2E3B57;background:#1B2438;color:#C9D3E3}
    #${PANEL_ID} button.pri{background:linear-gradient(180deg,#F4F8FF 0%,#C9D3E3 55%,#8D9BB5 100%);color:#0C1120;border-bottom:4px solid #5A6884}
    #${PANEL_ID} button.on{background:#E8C35A;color:#0C1120;border-bottom:4px solid #9A7A2A}
    #${PANEL_ID} .chips{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}
    #${PANEL_ID} .chip{display:inline-flex;align-items:center;gap:3px;border-radius:999px;padding:1px 7px 1px 2px;background:#24314B;font-size:10px;font-weight:800;color:#EEF3FA}
    #${PANEL_ID} .chip img{width:24px;height:24px;image-rendering:pixelated}
    #${PANEL_ID} details summary{cursor:pointer;font-weight:800;color:#EEF3FA;list-style:none}
    #${PANEL_ID} details summary::-webkit-details-marker{display:none}
    #${PANEL_ID} .log{max-height:130px;overflow-y:auto;font-size:10.5px;font-weight:600;line-height:1.45}
    #${PANEL_ID} .log p{margin:0;padding:1px 0}
    #${PANEL_ID} .log:empty{display:none}
    #${PANEL_ID} .opt{display:flex;gap:6px;align-items:center;margin-top:6px;flex-wrap:wrap}
    #${PANEL_ID} .opt label{display:flex;gap:4px;align-items:center;font-size:10.5px;font-weight:700}
    [data-axe-reco]{outline:3px solid #E8C35A!important;outline-offset:2px;position:relative}
    [data-axe-reco]::after{content:"⭐";position:absolute;right:-6px;top:-8px;font-size:15px;filter:drop-shadow(0 0 2px #000)}`;
  const registroLog = lsGet('axe-log', []);
  function log(t) {
    const d = new Date(), h = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    registroLog.push(`${h}  ${t}`); while (registroLog.length > 60) registroLog.shift();
    lsPut('axe-log', registroLog);
    const box = document.querySelector(`#${PANEL_ID} .log`);
    if (box) { const p = document.createElement('p'); p.textContent = `${h}  ${t}`; box.appendChild(p); box.scrollTop = box.scrollHeight; }
  }
  function marcarRecomendado(b) {
    for (const x of $$('[data-axe-reco]')) if (x !== b) x.removeAttribute('data-axe-reco');
    if (b && !b.hasAttribute('data-axe-reco')) b.setAttribute('data-axe-reco', '1');
  }
  const chip = d => `<span class="chip" title="${kEsc(d.t.join(' / '))}"><img src="/sprites/${d.num}.png" alt="">${kEsc(d.nombre)}</span>`;
  function htmlReco(P, R) {
    if (!P) return '';
    if (P.tipo === 'prestado' && R) return `<p class="t2">⭐ Prestado: ${kEsc(R.mejor.nombre)}</p><p class="s">Fuerza para los próximos biomas: ${kEsc(R.texto)}</p>`;
    if (P.tipo === 'bendicion' && R) return `<p class="t2">⭐ ${R.tirar ? '🎲 Vuelve a tirar' : kEsc(R.mejor.nombre)}</p><p class="s">Puntos de fuerza que suma cada una: ${kEsc(R.texto)}</p>`;
    if (P.tipo === 'puerta' && R) return `<p class="t2">⭐ Puerta: ${kEsc(R.mejor.nombre)}</p><p class="s">${R.lista.map(o => `${kEsc(o.nombre)}: ${kEsc(o.porque)}`).join('<br>')}</p>`;
    if (P.tipo === 'combate') return '<p class="t2">⚔️ Combate</p><p class="s">Lo apunto todo para ajustar el modelo.</p>';
    if (P.tipo === 'reclutar') return `<p class="t2">🤝 Reclutar</p><p class="s">${equipoActual().length < 4 ? 'Hay hueco: recluta.' : 'Equipo lleno: aún no sé decidir a quién cambiar.'}</p>`;
    if (P.tipo === 'lobby') return `<p class="t2">⛰️ ${P.gratis ? 'Hoy bajar es gratis' : 'Bajar ya no es gratis hoy'}</p>`;
    return '';
  }
  let ultimoP = null, ultimoR = null;
  function pintar(P = ultimoP, R = ultimoR) {
    ultimoP = P; ultimoR = R;
    const p = document.getElementById(PANEL_ID);
    if (!p) return;
    const cab = (P && P.cab) || cabecera();
    const set = (sel, html) => { const el = p.querySelector(sel); if (el && el.dataset.h !== html) { el.innerHTML = html; el.dataset.h = html; } };
    // dónde estás y lo que viene
    let lugar = '';
    if (cab) {
      const sig = [1, 2].map(k => biomaDePiso((Math.floor((cab.piso - 1) / 5) + k) * 5 + 1));
      const pisoSig = k => (Math.floor((cab.piso - 1) / 5) + k) * 5 + 1;
      lugar = `<p><b>${cab.bioma.ico} ${kEsc(cab.bioma.nombre)} · piso ${cab.piso}</b> <span class="s">vuelta ${cab.vuelta}${cab.esquirlas != null ? ` · 💎 ${cab.esquirlas}` : ''}</span></p>
        <p class="s">${kEsc(cab.bioma.efecto)}</p>
        <p class="s" style="margin-top:4px">Después: ${sig.map((b, k) => `${b.ico} ${kEsc(b.nombre)} (piso ${pisoSig(k + 1)}): ${kEsc(b.efecto)}`).join('<br>')}</p>`;
      const o = ordenRecomendado(cab.piso);
      if (o && !o.yaBien) lugar += `<p class="s" style="margin-top:4px;color:#E8C35A">🔀 Mejor orden: ${o.orden.map((n, i) => `${i + 1}. ${kEsc(n)}`).join(' · ')} (${pct(o.actual)} → ${pct(o.v)}). Muévelos tú: aún no sé hacerlo solo.</p>`;
    } else {
      const b = apr.bajadas.slice(-5);
      lugar = `<p class="s">${b.length ? 'Últimas bajadas: ' + b.map(x => `piso ${x.piso} (${x.esquirlas} 💎)`).join(' · ') : 'Aún no he visto ninguna bajada entera.'}</p>`;
    }
    set('.lugar', lugar);
    const hr = htmlReco(P, R);
    set('.reco', hr);
    p.querySelector('.reco').hidden = !hr;
    marcarRecomendado(R ? (R.tirar ? P.reroll : R.mejor && R.mejor.b) : null);
    // ranking por bioma
    set('.rank', !rankingBiomas ? '<p class="s">Calculando…</p>' : BIOMAS.map(b => `<p style="margin-top:6px"><b>${b.ico} ${kEsc(b.nombre)}</b> <span class="s">${kEsc(b.efecto)}</span></p><div class="chips">${rankingBiomas[b.id].map(x => chip(x.d)).join('')}</div>`).join('') + '<p class="s" style="margin-top:6px">A Nv.40 contra lo que sale en cada bioma (lo que se ha visto o, si aún no, sus tipos), sin legendarios. Sirve para saber a quién reclutar.</p>');
    // aprendizaje
    const kM = kDe('mio'), kR = kDe('rival');
    set('.apr', `<p class="s">Aprendido: ${apr.k.mio.n + apr.k.rival.n} golpes (los tuyos pegan ×${kM.toFixed(2)}, los rivales ×${kR.toFixed(2)}) · ${apr.niveles.length} rivales vistos · ${Object.values(apr.especies).reduce((s, x) => s + Object.keys(x).length, 0)} especies · registro de ${registro.length} pasos.</p>`);
    const bp = p.querySelector('.piloto');
    const t = piloto ? '■ Parar' : '▶ Bajar solo';
    if (bp.textContent !== t) bp.textContent = t;
    bp.className = 'piloto ' + (piloto ? 'on' : 'pri');
    set('.msg', msg ? kEsc(msg) : '');
  }
  function montar() {
    let p = document.getElementById(PANEL_ID);
    if (!enEntranas()) { if (p) p.remove(); marcarRecomendado(null); return; }
    const m = raiz();
    if (!m) return;
    if (!p) {
      if (!document.getElementById('axe-css')) { const st = document.createElement('style'); st.id = 'axe-css'; st.textContent = CSS; document.head.appendChild(st); }
      p = document.createElement('section');
      p.id = PANEL_ID;
      p.setAttribute('data-ax-ignore', '1');
      p.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px"><span style="font-size:22px">⛏️</span><div style="flex:1"><p class="t">Entrañas · asistente</p><p class="s">Graba, aprende y recomienda (⭐). Con ▶ baja solo.</p></div></div>
        <div class="caja lugar"></div>
        <div class="caja reco" hidden></div>
        <div class="bts"><button type="button" class="piloto pri"></button><button type="button" class="exp">📤 Exportar</button><button type="button" class="cop">📋 HTML</button></div>
        <p class="s msg" style="text-align:center;margin-top:4px"></p>
        <div class="opt">
          <label><input type="checkbox" class="o-gratis"> empezar solo si es gratis</label>
          <label>prioridad <select class="o-prio"><option value="pisos">bajar más</option><option value="esquirlas">más 💎</option></select></label>
        </div>
        <details class="caja"><summary>🗺️ Los mejores para cada bioma ▾</summary><div class="rank"></div></details>
        <div class="caja apr"></div>
        <div class="caja log"></div>`;
      p.querySelector('.log').innerHTML = registroLog.map(t => `<p>${kEsc(t)}</p>`).join('');
      p.querySelector('.piloto').addEventListener('click', e => { e.preventDefault(); kPedirPermiso(); setPiloto(!piloto); });
      p.querySelector('.exp').addEventListener('click', e => { e.preventDefault(); exportar(); });
      p.querySelector('.cop').addEventListener('click', async e => {
        e.preventDefault();
        const c = raiz().cloneNode(true); const yo = c.querySelector('#' + PANEL_ID); if (yo) yo.remove();
        const html = c.outerHTML + $$('div.fixed.inset-0').filter(d => !ajeno(d)).map(d => d.outerHTML).join('\n');
        try { await navigator.clipboard.writeText(html); log('📋 HTML de esta pantalla copiado.'); } catch { console.log('[axe] HTML:', html); log('No pude copiar: está en la consola (F12).'); }
      });
      const g = p.querySelector('.o-gratis'), pr = p.querySelector('.o-prio');
      g.checked = !!conf.empezarGratis; pr.value = conf.prioridad;
      g.addEventListener('change', () => { conf.empezarGratis = g.checked; guardaConf(); });
      pr.addEventListener('change', () => { conf.prioridad = pr.value; guardaConf(); ultimoR = decidir(ultimoP); pintar(); });
      const box = p.querySelector('.log'); box.scrollTop = box.scrollHeight;
      if (!rankingBiomas) setTimeout(calcularRanking, 300);
    }
    if (m.firstElementChild !== p) m.insertBefore(p, m.firstElementChild);
    const P = pantalla();
    grabar(P);
    pintar(P, decidir(P));
    if (piloto) bucle();
  }
  let tMontar = null;
  new MutationObserver(ms => {
    if (ms.every(m => m.target.nodeType === 1 && m.target.closest && m.target.closest('[data-ax-ignore]'))) return;
    clearTimeout(tMontar); tMontar = setTimeout(montar, 250);
  }).observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(montar, 1000);
  window.__axEntranas = { pantalla, decidir, equipoActual, fuerza, evaluarPuerta, apr, exportar };
})();
