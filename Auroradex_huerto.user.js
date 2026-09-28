// ==UserScript==
// @name         Aurora Dex · Huerto de Bayas (automático)
// @namespace    auroradex-huerto
// @version      1.5.0
// @updateURL    https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_huerto.user.js
// @downloadURL  https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_huerto.user.js
// @description  En el Huerto de Bayas: eliges una baya (solo su icono) o 🥾 (solo Meloc y Latano, en la proporción de las Botas de Andar) y con un botón cosecha lo que esté listo, planta en todo lo vacío y riega todo, con los botones de la propia página. «🥾 Ponerme las Botas de Andar» las usa (o las prepara) para el Subsuelo; /huerto?botas=1&volver=… lo hace solo.
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
  // React guarda dos copias de cada componente (la de pantalla y la anterior) y a veces se leía la anterior: justo
  // después de plantar decía «nada que regar». Se miran las dos y se queda la más reciente según lo que se ve
  function estadoHuerto() {
    const h1 = $$('main h1').find(h => /huerto de bayas/i.test(h.textContent || ''));
    for (let f = actual(fibraDe(h1)), i = 0; f && i < 40; f = f.return, i++) {
      const cands = [f, f.alternate].map(x => x && x.memoizedProps && x.memoizedProps.estado).filter(e => e && Array.isArray(e.parcelas));
      if (!cands.length) continue;
      if (cands.length === 1 || cands[0] === cands[1]) return cands[0];
      // la más reciente: la que cuadra con los botones de la página (si «Regar todo» está encendido, hay algo que regar…)
      const nota = e => (!!libre(bRegar()) === regables(e).length > 0 ? 1 : 0) + (!!libre(bCosechar()) === listas(e).length > 0 ? 1 : 0) + (!!libre(bPlantar()) === vacias(e).length > 0 ? 1 : 0);
      return nota(cands[1]) > nota(cands[0]) ? cands[1] : cands[0];
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
   *  (con los botones de la propia página).
   * ------------------------------------------------------------------ */
  const LS_BAYA = 'axh-baya';
  // para que el Subsuelo sepa que este script está (y le puede pedir las Botas)
  try { localStorage.setItem('axh-v', '1.5.0'); } catch { /* nada */ }
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } };
  const lsPut = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin storage */ } };
  let enMarcha = false;
  // el registro se guarda aparte por si la página vuelve a pintar el panel
  const registro = [];
  const log = t => { registro.push([Date.now(), t]); if (registro.length > 40) registro.shift(); kLog(document.querySelector('#axh-panel .axh-log'), t); };

  // Tras cada botón la página se queda «ocupada» (todos los botones apagados) hasta que el servidor responde y se
  // vuelve a pintar: antes de pulsar el siguiente se espera a que esté libre (si no, se saltaba el riego)
  // (se nota en que un botón que debería estar activo según el huerto está apagado)
  const ocupada = () => {
    const e = estadoHuerto(); if (!e) return true;
    const apagado = b => !b || b.disabled;
    return (listas(e).length > 0 && apagado(bCosechar())) || (regables(e).length > 0 && apagado(bRegar())) || (vacias(e).length > 0 && apagado(bPlantar()));
  };
  async function esperarLibre(ms = 12000) { await sleep(300); await esperarA(() => !ocupada(), ms); await sleep(250); }
  // Si la lista de «¿Qué plantas en las…?» se ha quedado abierta, se cierra (puede tapar o apagar «Regar todo»)
  async function cerrarListaPlantar() {
    const lista = () => $$('main section').find(s => /qu[eé] plantas en las/i.test(s.textContent || ''));
    const l = lista();
    if (!l) return;
    const x = $$('button', l).find(b => /cerrar|cancelar|volver|listo|^✕$|^×$/i.test((b.textContent || '').trim() || b.getAttribute('aria-label') || ''));
    if (x) { x.click(); await esperarA(() => !lista(), 3000); await sleep(200); }
  }
  /* ── 🥾 Modo Botas: solo Meloc y Latano, en la proporción de las Botas de Andar (5 Latano + 3 Meloc) ──
   * Se planta la que menos pares de botas da contando la bolsa y lo que ya está creciendo. */
  const BOTAS = 'botas';
  const RECETA_BOTAS = { 'baya-latano': 5, 'baya-meloc': 3 };
  function cuentaBotas(e) {
    const n = { ...RECETA_BOTAS };
    for (const id of Object.keys(n)) {
      const cat = e.catalogo.find(c => c.id === id);
      const creciendo = e.parcelas.filter(p => p.bayaId === id).reduce((x, p) => x + (p.cosecha || (cat && cat.cosecha) || 0), 0);
      n[id] = (((e.bolsa || {})[id] || 0) + creciendo) / RECETA_BOTAS[id];
    }
    return n;
  }
  function bayaAPlantar(e) {
    const sel = lsGet(LS_BAYA, null);
    if (sel !== BOTAS) return sel ? e.catalogo.find(c => c.id === sel) : null;
    const n = cuentaBotas(e);
    const id = n['baya-meloc'] <= n['baya-latano'] ? 'baya-meloc' : 'baya-latano';
    return e.catalogo.find(c => c.id === id) || e.catalogo.find(c => c.id === (id === 'baya-meloc' ? 'baya-latano' : 'baya-meloc'));
  }

  /* ── 🥾 Ponerse las Botas de Andar («El puesto»): si no las llevas puestas, usa unas de la bolsa y, si no
   * tienes, las prepara con las bayas. Guarda hasta cuándo duran (axh-botas-hasta) para el script del Subsuelo. */
  const LS_BOTAS_HASTA = 'axh-botas-hasta';
  const pestana = re => $$('main nav button, main nav a').find(b => !b.closest('#axh-panel') && re.test(b.textContent || ''));
  const cartaBotas = () => $$('main .rounded-card').find(c => { const p = c.querySelector('p'); return p && /botas de andar/i.test(p.textContent || ''); });
  const quedanMs = t => { const m = String(t || '').match(/quedan\s*(?:(\d+)\s*h)?\s*(?:(\d+)\s*min)?/i); return m && (m[1] || m[2]) ? ((+m[1] || 0) * 60 + (+m[2] || 0)) * 6e4 : 0; };
  const botasQuedan = c => quedanMs(c && c.textContent);
  async function ponerBotas() {
    if (!cartaBotas()) { const t = pestana(/puesto/i); if (t) t.click(); await esperarA(cartaBotas, 6000); }
    const c = cartaBotas();
    if (!c) { log('⚠ No encuentro las Botas de Andar en «El puesto».'); return false; }
    const guardar = ms => lsPut(LS_BOTAS_HASTA, Date.now() + ms);
    let q = botasQuedan(c);
    if (q > 0) { guardar(q); log(`🥾 Ya llevas las Botas de Andar (quedan ${falta(q)}).`); return true; }
    const bot = re => { const b = $$('button', cartaBotas() || c).find(x => re.test(x.textContent || '')); return b && !b.disabled ? b : null; };
    if (!bot(/usar el que tenga/i)) {
      const prep = bot(/preparar/i);
      if (!prep) { log('⚠ No tienes Botas de Andar ni bayas para prepararlas (5 Latano + 3 Meloc).'); return false; }
      prep.click();
      log('🥾 Preparando unas Botas de Andar…');
      if (!await esperarA(() => bot(/usar el que tenga/i), 8000)) { log('⚠ No he podido preparar las Botas.'); return false; }
      await sleep(400);
    }
    bot(/usar el que tenga/i).click();
    q = await esperarA(() => botasQuedan(cartaBotas()), 8000);
    if (!q) { log('⚠ He usado las Botas pero no veo cuánto duran.'); return false; }
    guardar(q);
    log(`🥾 Botas de Andar puestas: ${falta(q)}. El Subsuelo cobra cada 9 pasos.`);
    kAviso({ tipo: 'exito', app: 'Huerto de Bayas', titulo: 'Botas de Andar puestas', texto: `Durante ${falta(q)} el Subsuelo cobra la energía cada 9 pasos.` });
    return true;
  }
  // /huerto?botas=1[&volver=/subsuelo?explorar=1]: se pone las botas y vuelve (lo usan el Subsuelo y el bot)
  async function botasDesdeEnlace() {
    const q = new URLSearchParams(location.search);
    if (!enHuerto() || !q.has('botas')) return;
    const volver = q.get('volver');
    history.replaceState(history.state, '', location.pathname);
    if (!await esperarA(() => estadoHuerto(), 15000)) return;
    const ok = await ponerBotas();
    try { sessionStorage.setItem('axh-botas-resultado', ok ? 'ok' : 'no'); } catch { /* nada */ }
    console.log('[axh] botas', ok ? 'puestas' : 'no');
    if (volver && /^\/[\w\-/?=&]*$/.test(volver)) { await sleep(1200); location.assign(volver); }
    else { const t = pestana(/terreno/i); if (t) t.click(); }
  }

  let desdeMarcha = 0;
  async function hacerTodo() {
    if (enMarcha && Date.now() - desdeMarcha < 90000) return;      // por si alguna vez se quedara colgado
    let e = estadoHuerto();
    if (!e) return;
    enMarcha = true; desdeMarcha = Date.now();
    const hecho = [];
    try {
      pintar();
      // hasta 3 vueltas: al cosechar o plantar puede quedar algo nuevo que regar
      let plantadoAhora = 0;
      for (let vuelta = 0; vuelta < 3; vuelta++) {
        let algo = false;
        await esperarLibre();
        e = estadoHuerto() || e;
        // 1) cosechar
        if (listas(e).length && libre(bCosechar())) {
          const n = listas(e).reduce((x, p) => x + (p.cosecha || 0), 0);
          bCosechar().click();
          await esperarA(() => { const x = estadoHuerto(); return x && !listas(x).length; });
          await esperarLibre();
          hecho.push(`🧺 ${n} baya${n === 1 ? '' : 's'} cosechada${n === 1 ? '' : 's'}`);
          log(`🧺 Cosechado (${n}).`);
          e = estadoHuerto() || e; algo = true;
        }
        // 2) plantar la baya elegida en todo lo vacío (en modo 🥾, la que más falta para las Botas)
        const cat = bayaAPlantar(e);
        if (vacias(e).length) {
          if (!cat) log('⚠ Elige arriba qué baya plantar.');
          else if (e.dinero < cat.semilla * vacias(e).length) log(`⚠ No llega el dinero para plantar ${vacias(e).length} ${cat.nombre} (${cat.semilla * vacias(e).length} $).`);
          else if (libre(bPlantar())) {
            const cuantas = vacias(e).length;
            const lista = () => $$('main section').find(s => /qu[eé] plantas en las/i.test(s.textContent || ''));
            if (!lista()) { bPlantar().click(); await esperarA(lista, 4000); }
            const boton = () => { const li = lista() && $$('li', lista()).find(l => { const p = l.querySelector('p'); return p && p.textContent.trim().startsWith(cat.nombre); }); return li && li.querySelector('button'); };
            const b = await esperarA(() => libre(boton()) && boton(), 5000);
            if (!b) log(`⚠ No encuentro el botón para plantar ${cat.nombre}.`);
            else {
              b.click();
              await esperarA(() => { const x = estadoHuerto(); return x && !vacias(x).length; });
              await esperarLibre();
              plantadoAhora = cuantas;
              hecho.push(`🌱 ${cuantas} ${cat.nombre} plantada${cuantas === 1 ? '' : 's'}`);
              log(`🌱 Plantadas ${cuantas} ${cat.nombre} (${cat.semilla * cuantas} $).`);
              e = estadoHuerto() || e; algo = true;
            }
          }
        }
        // 3) regar todo lo que se pueda. Se decide por el botón «Regar todo» de la página (los datos pueden ir un paso
        // por detrás justo después de plantar); si se acaba de plantar se le dan unos segundos para encenderse
        if (plantadoAhora) await cerrarListaPlantar();
        e = estadoHuerto() || e;
        if (regables(e).length || plantadoAhora || libre(bRegar())) {
          const b = await esperarA(() => libre(bRegar()) && bRegar(), plantadoAhora || regables(e).length ? 7000 : 800);
          if (!b) {
            if (regables(e).length || plantadoAhora) log(bRegar() ? '⚠ El botón «Regar todo» está apagado: el juego no deja regar ahora.' : '⚠ No encuentro el botón «Regar todo».');
          } else {
            const n = regables(e).length || plantadoAhora || 0;
            b.click();
            await esperarA(() => { const x = estadoHuerto(); return !libre(bRegar()) || (x && !regables(x).length); }, 8000);
            await esperarLibre();
            hecho.push(n ? `💧 ${n} regada${n === 1 ? '' : 's'}` : '💧 regado');
            log(n ? `💧 Regadas ${n}.` : '💧 Regado.');
            e = estadoHuerto() || e; algo = true;
          }
        }
        plantadoAhora = 0;
        if (!algo) break;
      }
      if (!hecho.length) log('Nada que hacer ahora mismo.');
    } catch (err) {
      console.warn('[axh]', err);
      log('⚠ Error: ' + (err && err.message));
      kAviso({ tipo: 'error', app: 'Huerto de Bayas', titulo: 'El huerto automático se ha parado', texto: String(err && err.message) });
    } finally {
      enMarcha = false;
      try { pintar(); } catch (err) { console.warn('[axh]', err); }
    }
  }


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
      fila.innerHTML = `<button type="button" class="axh-baya" data-id="${BOTAS}" style="--c:#B9855A" title="Solo Meloc y Latano: planta la que más falta para las Botas de Andar (5 Latano + 3 Meloc)" aria-label="Meloc y Latano para Botas"><span style="font-size:24px">🥾</span></button>` + e.catalogo.map(c => `<button type="button" class="axh-baya" data-id="${kEsc(c.id)}" style="--c:${kEsc(c.color)}" title="${kEsc(c.nombre)} · ${c.horas} h · da ${c.cosecha} · semilla ${c.semilla} $" aria-label="${kEsc(c.nombre)}"><img src="/items/${kEsc(c.id)}.png?v=5" alt=""></button>`).join('');
      for (const b of $$('.axh-baya', fila)) b.addEventListener('click', () => { lsPut(LS_BAYA, b.dataset.id); pintar(); });
    }
    for (const b of $$('.axh-baya', fila)) b.setAttribute('aria-pressed', String(b.dataset.id === baya));
    const cat = bayaAPlantar(e);
    const t = proxima(e), r = proxRiego(e);
    // cuándo hará falta volver (lo usa el bot para despertar el PC solo cuando haya cosecha): ya, si hay algo listo o vacío
    lsPut('axh-proxima', listas(e).length || vacias(e).length ? Date.now() : (t || 0));
    kSet(p.querySelector('.axh-t-listas'), String(listas(e).length));
    kSet(p.querySelector('.axh-t-prox'), listas(e).length ? '¡Ya!' : t ? falta(t - Date.now()) : '–');
    kSet(p.querySelector('.axh-t-riego'), regables(e).length ? `${regables(e).length} ya` : r ? falta(r - Date.now()) : 'hecho');
    const nb = baya === BOTAS && cuentaBotas(e);
    kSet(p.querySelector('.k-sub'), nb ? `🥾 Meloc + Latano · ahora ${cat ? cat.nombre.replace(/^Baya /, '') : '–'} (para ${Math.floor(Math.min(nb['baya-meloc'], nb['baya-latano']))} botas)` : cat ? `Planta ${cat.nombre} · ${cat.horas} h · ${cat.semilla} $ la semilla` : 'Elige qué baya plantar');
    kBadge(p.querySelector('.k-badge'), enMarcha ? 'on' : 'off', enMarcha ? 'HACIENDO' : 'LISTO');
    const b = p.querySelector('.axh-todo');
    b.disabled = enMarcha;
    kSet(b, enMarcha ? '⏳ Haciéndolo…' : '🤖 Cosechar, plantar y regar');
    const hasta = lsGet(LS_BOTAS_HASTA, 0), bb = p.querySelector('.axh-botas');
    bb.disabled = enMarcha;
    kSet(bb, hasta > Date.now() ? `🥾 Botas puestas · ${falta(hasta - Date.now())}` : '🥾 Ponerme las Botas de Andar');
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
        <button type="button" class="axh-botas boton-suave w-full !py-2 text-xs">🥾 Ponerme las Botas de Andar</button>
        <div class="axh-log ${K_LOG}"></div>`;
      const caja = p.querySelector('.axh-log');
      for (const [ts, t] of registro) { const d = new Date(ts), q = document.createElement('p'); q.textContent = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}  ${t}`; caja.appendChild(q); }
      p.querySelector('.axh-todo').addEventListener('click', e => { e.preventDefault(); hacerTodo(); });
      p.querySelector('.axh-botas').addEventListener('click', async e => {
        e.preventDefault();
        if (enMarcha) return;
        enMarcha = true; pintar();
        try { await ponerBotas(); } finally { enMarcha = false; const t = pestana(/terreno/i); if (t) t.click(); }
      });
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
  setTimeout(botasDesdeEnlace, 1200);
})();
