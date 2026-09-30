// ==UserScript==
// @name         Aurora Dex · Valle Aurora (todo en un botón)
// @namespace    auroradex-valle
// @version      1.3.0
// @description  Solo en /valle. Un botón que lo hace todo de la forma más rentable: recoge cuando toca (la primera del día con el almacén casi lleno, para aprovechar el ×2 de la Hora punta, con Tónico si compensa), cobra los encargos, coloca a los mejores (y reorganiza cuando cambia el tipo en racha), compra Silos, gasta los puntos de investigación (Planos → Contratos → Ojo de Oak…), echa las 3 manos del día en otros valles y gasta el Brillo en lo que más producción da por cada Brillo (edificios con sus hitos ×2 vistos con antelación, huecos nuevos, Monumento y residentes; ahorra en vez de gastar en algo mucho peor). Dice cuándo volver (lo usa el robot de Diarias). Opcional: Horas extra y repetirlo solo cada 30 min.
// @match        https://auroradex.es/*
// @match        https://www.auroradex.es/*
// @updateURL    https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_valle.user.js
// @downloadURL  https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_valle.user.js
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
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

  const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
  const lsPut = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin storage */ } };
  const espera = ms => new Promise(ok => setTimeout(ok, ms));
  const enValle = () => /^\/valle(\/|$)/.test(location.pathname);
  const hoy = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  const fmt = n => (n >= 1e6 ? (n / 1e6).toFixed(1).replace('.', ',') + ' M' : n >= 1e3 ? (n / 1e3).toFixed(1).replace('.', ',') + ' mil' : String(Math.round(n)));
  const texto = el => (el && el.textContent || '').replace(/\s+/g, ' ').trim();

  /* ------------------------------------------------------------------ *
   *  ESTADO DEL VALLE: el mismo objeto que usa la página (estado de React de «PantallaValle»), siempre al día
   *  después de cada acción: brillo, edificios (nivel, coste, Brillo/h, hitos, huecos, trabajadores), Monumento,
   *  Tónicos, encargos, residentes…
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
  function estadoValle() {
    const el = document.getElementById('valle-pestanas') || $$('main section')[0];
    let f = actual(fibraDe(el));
    for (let i = 0; f && i < 80; i++, f = f.return) {
      let h = f.memoizedState;
      for (let k = 0; h && typeof h === 'object' && k < 80; k++, h = h.next) {
        const v = h.memoizedState;
        if (v && typeof v === 'object' && Array.isArray(v.edificios) && typeof v.brillo === 'number') return v;
      }
    }
    return null;
  }

  /* ------------------------------------------------------------------ *
   *  EN QUÉ GASTAR: cada compra se puntúa por la producción que añade (Brillo/h) dividida entre lo que cuesta, y
   *  se compra la mejor mientras llegue el Brillo (se vuelve a mirar después de cada compra).
   *  · Edificio: su producción crece con el nivel y se duplica en los niveles 10, 25, 50, 100 y 150. Subir de n a n+1
   *    añade su Brillo/h × ((n+1)/n) − 1, o ×2 si llega a un hito; si con ese nivel abre un hueco, además lo que
   *    rinde un trabajador medio de ahí. Si un encargo pide subir niveles, su premio abarata cada subida.
   *  · Monumento: +2% a todo el valle por piso.
   *  · Residente (comida del día): su bonus repartido entre las comidas que le faltan, sobre sus edificios.
   *  Lo aprendido de verdad (cuánto subió de verdad un edificio al subirlo) corrige la estimación con el tiempo.
   * ------------------------------------------------------------------ */
  const HITOS = [10, 25, 50, 100, 150];
  const LS_APRENDE = 'axv-subidas';
  function factorAprendido(id) {
    const g = lsGet(LS_APRENDE, {})[id];
    return g && g.n >= 2 ? Math.min(3, Math.max(0.3, g.r)) : 1;
  }
  function apuntarSubida(id, estimado, real) {
    if (!(estimado > 0) || !(real > 0)) return;
    const g = lsGet(LS_APRENDE, {}), a = g[id] || { r: 1, n: 0 };
    const r = real / estimado;
    a.r = (a.r * a.n + r) / (a.n + 1); a.n = Math.min(a.n + 1, 20);
    g[id] = a; lsPut(LS_APRENDE, g);
  }
  // Cuánto crece el coste de un edificio por nivel (≈ ×1,17): se afina con lo que se ve al comprar
  const LS_CRECE = 'axv-crece';
  const crece = () => { const g = lsGet(LS_CRECE, null); return g && g.n >= 2 ? Math.min(1.5, Math.max(1.05, g.r)) : 1.17; };
  function apuntarCrece(antes, despues) {
    if (!(antes > 0) || !(despues > 0)) return;
    const r = despues / antes; if (r < 1.03 || r > 1.6) return;
    const g = lsGet(LS_CRECE, { r: 1.17, n: 0 });
    g.r = (g.r * g.n + r) / (g.n + 1); g.n = Math.min(g.n + 1, 30); lsPut(LS_CRECE, g);
  }
  function opciones(x) {
    const ops = [];
    const encNiv = (x.hoy && x.hoy.encargos || []).find(e => /niveles/.test(e.id) && !e.cobrado && e.progreso < e.meta);
    const restEnc = encNiv ? encNiv.meta - encNiv.progreso : 0;
    const premioNivel = encNiv ? encNiv.brillo / Math.max(1, restEnc) : 0;
    const R = crece();
    for (const e of x.edificios) {
      if (!e.abierto || !e.coste || e.candado) continue;
      const n = e.nivel, bh = e.brilloHora || 0, c = e.coste.brillo;
      if (n < 1) continue;                                          // construir uno nuevo lo decides tú
      const f = factorAprendido(e.id), trab = (e.trabajadores || []).length;
      // lo que rinde subir k niveles seguidos (con los hitos ×2 del camino y el hueco nuevo, si se abre) por lo que cuestan
      // todos ellos: así se ve venir un hito (p. ej. del 48 al 50, ×2) aunque el primer escalón, solo, parezca poco
      let plan = null, costeK = 0;
      for (let k = 1; k <= 12; k++) {
        costeK += c * Math.pow(R, k - 1);
        const T = n + k, hitos = HITOS.filter(h => h > n && h <= T).length;
        let d = bh * (T / n * Math.pow(2, hitos) - 1);
        if (e.siguienteHueco > n && e.siguienteHueco <= T && trab) d += bh / trab;
        d *= f;
        const roi = d / Math.max(1, costeK - premioNivel * Math.min(k, restEnc));
        if (!plan || roi > plan.roi * 1.0001) plan = { k, roi, d, coste: costeK, hito: hitos > 0 };
      }
      // el escalón que se compra ahora (para apuntarlo y para lo que se dice)
      let d1 = bh * ((n + 1) / n * (HITOS.includes(n + 1) ? 2 : 1) - 1);
      if (e.siguienteHueco === n + 1 && trab) d1 += bh / trab;
      d1 *= f;
      const rumbo = plan.k > 1 ? ` (rumbo a Nv ${n + plan.k}${plan.hito ? ' ×2' : ''})` : '';
      ops.push({ tipo: 'edificio', id: e.id, nombre: `${e.nombre} → Nv ${n + 1}${HITOS.includes(n + 1) ? ' (×2)' : ''}${rumbo}`, coste: c, dinero: e.coste.dinero || 0, d: d1, dPlan: plan.d, costePlan: plan.coste, roi: plan.roi, bh });
    }
    if (x.monumento && x.monumento.coste) {
      const d = (x.brilloHora || 0) * 0.02 / (1 + (x.monumento.bonus || 0));
      ops.push({ tipo: 'monumento', nombre: `Monumento → piso ${x.monumento.nivel + 1}`, coste: x.monumento.coste, dinero: 0, d, roi: d / x.monumento.coste });
    }
    const mud = x.mudanza || {};
    for (const r of x.residentes || []) {
      if (r.comidoHoy || !r.coste) continue;
      const sobre = x.edificios.filter(e => (r.edificios || []).includes(e.nombre)).reduce((s, e) => s + (e.brilloHora || 0), 0);
      const d = (mud.bonus || 0) * sobre / Math.max(1, (mud.comidas || 3) - (r.comidas || 0));
      ops.push({ tipo: 'residente', id: r.speciesId, nombre: `Dar de comer a ${r.nombre}`, coste: r.coste, dinero: 0, d, roi: d / r.coste });
    }
    return ops.sort((a, b) => b.roi - a.roi);
  }
  // Qué comprar ahora: lo que más rinde si llega; si lo mejor aún no llega pero llega pronto (menos de 3 h de producción)
  // y lo que sí llega rinde mucho menos, se ahorra en vez de gastarlo en algo malo
  function elegirCompra(x, ops = opciones(x)) {
    const top = ops[0];
    const asequible = ops.find(o => o.coste <= x.brillo && o.dinero <= (x.dinero || 0));
    if (!top || !asequible) return { op: null, ahorro: null };
    if (asequible !== top && top.coste - x.brillo <= 3 * (x.brilloHora || 0) && asequible.roi < 0.5 * top.roi) return { op: null, ahorro: top };
    return { op: asequible, ahorro: null };
  }

  /* ------------------------------------------------------------------ *
   *  CUÁNDO RECOGER. La Hora punta (nodo de investigación) da el DOBLE a la primera recogida del día: cuanto más lleno
   *  esté el almacén en ese momento, mejor (con el Tónico, más aún). Así que esa se hace con el almacén casi lleno (≥ 90%,
   *  o en la última media hora del día, para no perder el ×2). Las demás valen igual pronto que tarde (recoger no pierde
   *  nada): con recoger un poco ya cuentan para «Recoge N veces» y para las visitas; y ese encargo se asegura antes de que
   *  acabe el día.
   * ------------------------------------------------------------------ */
  const H = 3600e3, MIN = 60e3;
  const medianoche = (ahora = Date.now()) => { const d = new Date(ahora); d.setHours(24, 0, 0, 0); return d.getTime(); };
  const cdRecoger = () => Math.min(90 * MIN, Math.max(5 * MIN, +lsGet('axv-cd', 35 * MIN)));
  function decidirRecoger(x, ahora, o, cd = 35 * MIN) {
    const lleno = x.lleno || 0, horas = x.horas || 12, hastaLleno = Math.max(0, x.llenoEn || 0);
    const finDia = medianoche(ahora) - ahora;
    const hasta = t => Math.max(0, hastaLleno - (1 - t) * horas * H);            // ms hasta llegar a esa fracción del almacén
    const tonico = (x.tonicos || 0) > 0 && o.tonico && ((x.tonicos || 0) >= (x.maxTonicos || 6) || lleno >= 0.8 || !!x.horaPunta);
    if (o.punta && x.horaPunta) {
      const limite = finDia - 40 * MIN;
      const tObj = hasta(0.9);
      if (tObj <= 0) return { ya: true, motivo: 'almacén casi lleno: hora punta ×2', tonico, punta: true };
      if (limite <= 0) return { ya: true, motivo: 'última hora del día: no dejo pasar el ×2 de la hora punta', tonico, punta: true };
      return { ya: false, motivo: 'espero al almacén casi lleno para la hora punta ×2', volver: ahora + Math.min(tObj, limite) + MIN, tonico, punta: true };
    }
    const enc = (x.hoy && x.hoy.encargos || []).find(e => /recog/i.test(e.texto || '') && !e.cobrado && e.progreso < e.meta);
    const faltan = enc ? enc.meta - enc.progreso : 0;
    const feriaRec = !!(x.hoy && x.hoy.feria && /recog|cosech/i.test(x.hoy.feria.unidad || ''));
    const minimo = o.mitad && feriaRec ? 0.5 : 0.25;
    // para «Recoge N veces» hacen falta N recogidas antes de que acabe el día (cada una, con su espera)
    const apuro = faltan > 0 && finDia - 15 * MIN <= faltan * cd + 30 * MIN;
    if (lleno >= minimo) return { ya: true, motivo: lleno >= 0.9 ? 'almacén lleno' : `almacén al ${Math.round(lleno * 100)}%`, tonico };
    if (apuro) return { ya: true, motivo: `«Recoge ${enc.meta} veces»: que dé tiempo antes de que acabe el día`, tonico: false };
    const t = [ahora + hasta(minimo) + MIN];
    if (faltan > 0) t.push(ahora + finDia - (faltan * cd + 45 * MIN));
    return { ya: false, motivo: `almacén al ${Math.round(lleno * 100)}%: espero`, volver: Math.max(ahora + MIN, Math.min(...t)), tonico };
  }
  // Cuándo tiene sentido volver a mirar el valle (lo lee el robot de Diarias): la recogida, los puntos de investigación
  // para el siguiente nodo, y el día nuevo (encargos, manos y hora punta vuelven a estar)
  const LS_PROXIMA = 'axv-proxima';
  function calcularProxima(x) {
    if (!x) return null;
    const ahora = Date.now(), d = decidirRecoger(x, ahora, opc, cdRecoger());
    const enfria = x.recogerEn ? Date.parse(x.recogerEn) : 0;
    const c = [];
    let que = '';
    if (d.ya) { c.push(Math.max(ahora + 2 * MIN, enfria + 30e3)); que = 'recoger'; }
    else if (d.volver) { c.push(d.volver); que = d.punta ? 'recoger con la hora punta ×2' : 'recoger'; }
    if (opc.investigar && x.funciones && x.funciones.investigar && x.piHora > 0 && x.pi < x.costeCasilla) {
      const t = ahora + (x.costeCasilla - x.pi) / x.piHora * H + 5 * MIN;
      if (!c.length || t < Math.min(...c)) que = 'investigar';
      c.push(t);
    }
    const t = Math.min(...c, medianoche(ahora) + 3 * MIN);
    if (t === medianoche(ahora) + 3 * MIN && !c.some(v => v <= t)) que = 'el día nuevo';
    const r = { t, que, info: `${que} a las ${new Date(t).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`, hecho: ahora };
    lsPut(LS_PROXIMA, r);
    return r;
  }

  /* ------------------------------------------------------------------ *
   *  BOTONES DE LA PÁGINA (se pulsan los mismos que pulsarías tú)
   * ------------------------------------------------------------------ */
  const botones = () => $$('main button').filter(b => !b.closest('#axv-panel'));
  const libre = b => b && !b.disabled && b.isConnected;
  const bRecoger = () => botones().find(b => /^Recoger/.test(texto(b)));
  const bColocar = () => botones().find(b => /Colocar/.test(texto(b)) && !/Reorganizar/.test(texto(b)));
  const bReorganizar = () => botones().find(b => /Reorganizar/.test(texto(b)));
  const bMonumento = () => botones().find(b => /^Subir un piso/.test(texto(b)));
  const bHorasExtra = () => botones().find(b => /Horas extra/.test(texto(b)));
  const bSubir = id => { const s = document.getElementById('ed-' + id); return s && $$('button.boton-principal', s).find(b => /^(Subir|Construir)/.test(texto(b))); };
  const bEncargos = () => botones().filter(b => /\+.*✦/.test(texto(b)) && b.closest('li') && !b.disabled);
  const bComer = () => botones().find(b => /^🧺/.test(texto(b)));
  const bVamos = () => $$('button').find(b => /^¡?Vamos!?$/.test(texto(b)));
  const huecosLibres = () => $$('main button[aria-label="Poner a alguien a trabajar"]').length;

  // Pulsa y espera a que la página termine (el estado cambia y los botones dejan de estar ocupados)
  async function pulsar(b, ms = 5000) {
    if (!libre(b)) return false;
    const antes = estadoValle();
    b.click();
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      await espera(150);
      if (estadoValle() !== antes) break;
    }
    await espera(350);
    const v = bVamos(); if (v) { v.click(); await espera(300); }
    return true;
  }

  /* ------------------------------------------------------------------ *
   *  SILOS: +2 h de almacén cada uno (hasta 24 h en total: más no sirve, la hora punta es una al día). Cuestan poco.
   * ------------------------------------------------------------------ */
  const bSilo = () => botones().find(b => /^\+\s*2\s*h/.test(texto(b)));
  async function comprarSilos() {
    let n = 0;
    for (let i = 0; i < 6; i++) {
      const x = estadoValle();
      if (!x || !x.silo || x.silo.coste == null || (x.horas || 0) >= 24) break;
      if (x.silo.coste > x.brillo || x.silo.coste > 6 * (x.brilloHora || 0)) break;
      const b = bSilo(); if (!libre(b)) break;
      await pulsar(b);
      const x2 = estadoValle(); if (!x2 || x2 === x) break;
      n++; log(`🏚️ Silo nuevo: el almacén pasa de ${x.horas} a ${x2.horas} h (✦ ${fmt(x.silo.coste)}).`);
    }
    return n;
  }

  /* ------------------------------------------------------------------ *
   *  INVESTIGAR: gasta los puntos del Observatorio en lo que más da, para siempre (no se pierde al migrar). Primero
   *  «Planos» (−5% al coste de subir edificios), que abre «Contratos» (+1 hueco en TODOS los edificios), luego el resto.
   * ------------------------------------------------------------------ */
  const PRIO_NODOS = ['planos', 'contratos', 'oak', 'especialistas', 'red', 'buenOjo', 'veta', 'regateo', 'maestro', 'turnoNoche'];
  const esInvestigar = b => /^Investigar\s*·/.test(texto(b)) && !b.closest('#axv-panel');
  const botonNodo = nd => {
    for (const b of $$('main button').filter(esInvestigar)) {
      let c = b.parentElement;
      for (let i = 0; c && i < 4; i++, c = c.parentElement) if (texto(c).includes(nd.nombre) && $$('button', c).filter(esInvestigar).length === 1) return b;
    }
    return null;
  };
  async function investigar() {
    let x = estadoValle(), n = 0;
    if (!x || !x.funciones || !x.funciones.investigar) return 0;
    for (let i = 0; i < 8; i++) {
      x = estadoValle();
      if (!x || !(x.pi >= x.costeCasilla)) break;
      const cand = PRIO_NODOS.map(id => (x.nodos || []).find(nn => nn.id === id)).find(nn => nn && nn.nivel < nn.max && !nn.bloqueado);
      if (!cand) break;
      if (!n) {
        const tab = pestana(/Investigar/); if (!tab) break;
        tab.click();
        for (let k = 0; k < 24 && !botonNodo(cand); k++) await espera(250);
      }
      const b = botonNodo(cand); if (!libre(b)) break;
      await pulsar(b);
      const x2 = estadoValle(); if (!x2 || x2 === x) break;
      n++; log(`🔭 Investigado «${cand.nombre}» (nivel ${cand.nivel + 1} de ${cand.max}): ${cand.texto}.`);
    }
    if (n) await volverValle();
    return n;
  }

  /* ------------------------------------------------------------------ *
   *  MANOS: «Echar una mano» en el valle de otro jugador (ganáis los dos media hora de vuestra producción; hasta 3 al
   *  día; además cuenta para el encargo de las manos y la Feria). Se visita uno al azar y se le echa la mano.
   * ------------------------------------------------------------------ */
  async function echarManos() {
    let x = estadoValle(), hechas = 0;
    if (!x || !x.ayudas || x.ayudas.dadas >= x.ayudas.max) return 0;
    const tab = pestana(/Feria/); if (!tab) return 0;
    tab.click();
    let fallos = 0;
    for (let i = 0; i < 10 && fallos < 4; i++) {
      x = estadoValle(); if (!x || x.ayudas.dadas >= x.ayudas.max) break;
      let b = null;
      for (let k = 0; k < 24 && !b; k++) { b = $$('main button').find(y => /Visitar un valle al azar/i.test(texto(y)) && !y.disabled); if (!b) await espera(250); }
      if (!b) break;
      b.click();
      let dlg = null;
      for (let k = 0; k < 28 && !dlg; k++) { await espera(250); dlg = $$('[role="dialog"]').find(d => /^El valle de/i.test(d.getAttribute('aria-label') || '')); }
      if (!dlg) { fallos++; continue; }
      const quien = (dlg.getAttribute('aria-label') || '').replace(/^El valle de\s*/i, '');
      const cerrar = () => { const c = $$('button[aria-label="Cerrar"]', dlg)[0] || $$('button', dlg).find(y => /^✕$/.test(texto(y))); if (c) c.click(); };
      const mano = $$('button', dlg).find(y => /Echar una mano/i.test(texto(y)) && !y.disabled);
      if (!mano) { fallos++; cerrar(); await espera(500); continue; }
      const antes = x.ayudas.dadas;
      mano.click();
      for (let k = 0; k < 28; k++) { await espera(250); const y2 = estadoValle(); if (y2 && y2.ayudas.dadas > antes) break; }
      const y3 = estadoValle();
      if (y3 && y3.ayudas.dadas > antes) { hechas++; log(`🤝 Mano echada en el valle de ${quien} (${y3.ayudas.dadas}/${y3.ayudas.max} hoy).`); } else fallos++;
      cerrar(); await espera(600);
    }
    await volverValle();
    return hechas;
  }

  /* ------------------------------------------------------------------ *
   *  HACER TODO
   * ------------------------------------------------------------------ */
  const LS_OPC = 'axv-opciones', LS_RACHA = 'axv-racha';
  const opc = Object.assign({ tonico: true, mitad: true, reorganizar: true, horasExtra: false, repetir: false, expedicion: true, punta: true, silos: true, investigar: true, manos: true }, lsGet(LS_OPC, {}));
  let enMarcha = false, repetirT = null;
  const log = t => kLog(document.querySelector('#axv-panel .axv-log'), t);
  let hecho = false;
  async function hacerTodo() {
    if (enMarcha) return;
    enMarcha = true; hecho = false; pintarBoton();
    try {
      const v0 = bVamos(); if (v0) { v0.click(); await espera(400); }
      let x = estadoValle();
      if (!x) { log('⚠ No encuentro el estado del valle (¿estás en la pestaña «Valle»?).'); return; }

      // 1) Recoger, cuando toca (ver «CUÁNDO RECOGER»): la primera del día, con el almacén casi lleno (×2 de la hora punta)
      const rec = bRecoger();
      const dec = decidirRecoger(x, Date.now(), opc, cdRecoger());
      if (libre(rec) && dec.ya) {
        const t = document.getElementById('valle-tonico');
        const quiero = !!dec.tonico;
        if (t && t.checked !== quiero) { t.click(); await espera(200); }
        const antes = x.brillo, t0 = Date.now();
        await pulsar(bRecoger());
        x = estadoValle() || x;
        if (x.recogerEn) { const cd = Date.parse(x.recogerEn) - t0; if (cd > MIN && cd < 3 * H) lsPut('axv-cd', cd); }
        log(`✦ Recogido ${fmt(Math.max(0, x.brillo - antes))}${dec.punta ? ' (hora punta ×2)' : ''}${quiero ? ' (con Tónico)' : ''}: ${dec.motivo}.`);
      } else if (libre(rec)) log(`⏳ ${dec.motivo}${dec.volver ? `: vuelvo a las ${new Date(dec.volver).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}` : ''}.`);
      else if (x.recogerEn && Date.parse(x.recogerEn) > Date.now()) log(`Recoger aún no se puede: en ${Math.ceil((Date.parse(x.recogerEn) - Date.now()) / MIN)} min.`);
      x = estadoValle() || x;
      if (x.hoy && x.hoy.visita) log(`🚪 Te espera una visita («${x.hoy.visita.titulo || 'visita'}»): elige tú qué hacer, que cada opción es distinta.`);

      // 2) Trabajadores: reorganizar cuando cambia el tipo en racha; si no, llenar huecos
      const racha = x.hoy && x.hoy.tipoRacha ? x.hoy.tipoRacha.tipo : null;
      const ultima = lsGet(LS_RACHA, null);
      if (opc.reorganizar && racha && (!ultima || ultima.dia !== hoy() || ultima.tipo !== racha) && libre(bReorganizar())) {
        await pulsar(bReorganizar());
        lsPut(LS_RACHA, { dia: hoy(), tipo: racha });
        log(`♻️ Reorganizado para el tipo en racha de hoy (${racha} ×${x.hoy.tipoRacha.mult}).`);
      } else if (huecosLibres() && libre(bColocar())) {
        await pulsar(bColocar());
        log('✨ Huecos libres rellenados con los mejores de la caja.');
      }

      // 3) Horas extra (opcional: gasta energía; una al día, que además cumple el encargo)
      x = estadoValle() || x;
      if (opc.horasExtra && x.turno && x.turno.hechos < 1 && x.turno.energia >= x.turno.coste && libre(bHorasExtra())) {
        await pulsar(bHorasExtra());
        log(`⚡ Horas extra: +${fmt(x.turno.brillo)} por ${x.turno.coste} de energía.`);
      }

      // 4) Encargos listos
      for (let i = 0; i < 5; i++) { const b = bEncargos()[0]; if (!b) break; await pulsar(b); log('📜 Encargo cobrado.'); }

      // 5) Silos, investigación y gastar el Brillo en lo que más rinde
      if (opc.silos) { try { await comprarSilos(); } catch (e) { console.warn('[axv silos]', e); } }
      if (opc.investigar) { try { await investigar(); } catch (e) { console.warn('[axv investigar]', e); log('⚠️ Investigar: ' + (e && e.message)); } }
      let compras = 0, ahorro = null;
      for (let paso = 0; paso < 80; paso++) {
        x = estadoValle();
        if (!x) break;
        const ch = elegirCompra(x);
        const op = ch.op; ahorro = ch.ahorro;
        if (!op) break;
        const b = op.tipo === 'edificio' ? bSubir(op.id) : op.tipo === 'monumento' ? bMonumento() : bComer();
        if (!libre(b)) break;
        const antes = op.tipo === 'edificio' ? (x.edificios.find(e => e.id === op.id) || {}).brilloHora : 0;
        await pulsar(b);
        const x2 = estadoValle();
        if (!x2 || x2 === x) { log(`⚠️ No pude: ${op.nombre}.`); break; }
        if (op.tipo === 'edificio') {
          const e2 = x2.edificios.find(e => e.id === op.id) || {};
          apuntarSubida(op.id, op.d / factorAprendido(op.id), (e2.brilloHora || 0) - (antes || 0));
          apuntarCrece(op.coste, e2.coste && e2.coste.brillo);
        }
        compras++;
        log(`⬆️ ${op.nombre} · ✦ ${fmt(op.coste)} → +${fmt(op.d)}/h (se paga en ${Math.max(1, Math.round(op.coste / Math.max(op.d, 1)))} h)`);
      }
      if (ahorro) log(`💰 Ahorro para «${ahorro.nombre}» (✦ ${fmt(ahorro.coste)}, se paga en ${Math.max(1, Math.round((ahorro.costePlan || ahorro.coste) / Math.max(ahorro.dPlan || ahorro.d, 1)))} h) en vez de gastar en algo que rinde mucho menos.`);
      // 6) Las manos del día y la expedición gratis
      if (opc.manos) { try { await echarManos(); } catch (e) { console.warn('[axv manos]', e); log('⚠️ Manos: ' + (e && e.message)); } }
      // 6b) La expedición gratis del día (con los tres más fuertes de la caja)
      if (opc.expedicion) { try { await expedicionGratis(); } catch (e) { console.warn('[axv expedición]', e); log('⚠️ Expedición: ' + (e && e.message)); } }
      // encargos que se hayan cumplido comprando (o con la expedición)
      for (let i = 0; i < 5; i++) { const b = bEncargos()[0]; if (!b) break; await pulsar(b); log('📜 Encargo cobrado.'); }
      x = estadoValle() || x;
      const sig = opciones(x)[0];
      const prox = calcularProxima(x);
      log(`✅ Hecho${compras ? ` (${compras} mejora${compras > 1 ? 's' : ''})` : ''}. Producción: ${fmt(x.brilloHora || 0)}/h.${sig ? ` Lo siguiente que más rinde: ${sig.nombre} (✦ ${fmt(sig.coste)}).` : ''}${prox ? ` Vuelvo a mirar: ${prox.info}.` : ''}`);
      hecho = true;
      pintarCifras(x);
    } catch (e) {
      console.warn('[axv]', e);
      log('⚠️ Error: ' + (e && e.message || e));
      kAviso({ tipo: 'error', app: 'Valle Aurora', icono: '🌄', titulo: '«Hacerlo todo» se ha parado', texto: String(e && e.message || e) });
    } finally {
      enMarcha = false; pintarBoton();
    }
  }

  /* ------------------------------------------------------------------ *
   *  EXPEDICIÓN GRATIS: solo si hoy queda alguna gratis (nunca gasta energía). Elige a los tres primeros de la lista
   *  del juego (legendarios, variocolor y más nivel primero: cuanto más fuerte, mejor botín y más suerte), sale y en
   *  cada tramo coge camino: con un equipo fuerte, el arriesgado; si no, el seguro. Luego vuelve a la pestaña del Valle.
   * ------------------------------------------------------------------ */
  const pestana = re => $$('main button').find(b => !b.closest('#axv-panel') && re.test(texto(b)) && texto(b).length < 30);
  const seccionExp = () => $$('main section').find(sc => /Tramo \d+ de \d+|Más allá del valle/i.test(texto(sc)));
  async function expedicionGratis() {
    const tab = pestana(/Expedici[oó]n/);
    if (!tab) return;
    tab.click();
    for (let i = 0; i < 20 && !seccionExp(); i++) await espera(250);
    let sc = seccionExp();
    if (!sc) { log('⚠️ No veo las expediciones.'); return volverValle(); }
    // sin expedición en marcha: ¿queda alguna gratis hoy?
    if (!/Tramo \d+ de \d+/.test(texto(sc))) {
      const m = texto(sc).match(/Gratis \((\d+) hoy\)/i);
      if (!m || +m[1] < 1) { log('🧭 Hoy ya no quedan expediciones gratis.'); return volverValle(); }
      // (la lista de la caja va en otra tarjeta, debajo: se busca en toda la página)
      const caja = () => $$('main button').filter(b => !b.closest('#axv-panel') && /Nv\s*\d+/.test(texto(b)) && !b.disabled);
      for (let i = 0; i < 20 && caja().length < 3; i++) await espera(250);      // la lista tarda un poco más en salir
      const cands = caja().slice(0, 3);
      if (cands.length < 3) { log('⚠️ Expedición: no encuentro a tres de la caja.'); return volverValle(); }
      for (const b of cands) { b.click(); await espera(250); }
      const salir = $$('main button').find(b => /Salir de expedici/i.test(texto(b)));
      if (!salir || salir.disabled || /⚡/.test(texto(salir))) { log('⚠️ Expedición: el botón de salir no es gratis; no salgo.'); return volverValle(); }
      await pulsar(salir);
      log(`🧭 De expedición con ${cands.map(b => texto(b).replace(/\s*Nv.*$/, '').replace(/^✨/, '')).join(', ')}.`);
      for (let i = 0; i < 20 && !/Tramo \d+ de \d+/.test(texto(seccionExp() || document.body)); i++) await espera(250);
    }
    // tramos: el camino arriesgado si el equipo es fuerte (poder ≥ 3); si no, el seguro
    for (let paso = 0; paso < 8; paso++) {
      sc = seccionExp();
      if (!sc || !/Tramo \d+ de \d+/.test(texto(sc))) break;
      const poder = parseFloat(((texto(sc).match(/Poder\s*([\d,.]+)/) || [])[1] || '0').replace(',', '.'));
      const opciones = $$('main ol li button').filter(b => !b.disabled && !b.closest('#axv-panel'));
      if (!opciones.length) break;
      const riesgo = b => /arriesg|peligr|riesgo|a lo loco|jug[aá]rsela/i.test(texto(b)) ? 1 : /segur|tranquil|sin riesgo|calma/i.test(texto(b)) ? -1 : 0;
      const orden = [...opciones].sort((a, b) => (poder >= 3 ? riesgo(b) - riesgo(a) : riesgo(a) - riesgo(b)));
      const elegido = orden[0];
      console.log('[axv] tramo', { poder, opciones: opciones.map(texto), elegido: texto(elegido) });
      await pulsar(elegido);
      log(`🧭 Tramo: ${texto(elegido.querySelector('span:nth-child(2)') || elegido).slice(0, 40)} (poder ${poder.toFixed(1)}).`);
      await espera(600);
    }
    // la vuelta (con el cofre): se cierra el aviso
    const vuelta = $$('[aria-label="Vuelta de la expedición"]')[0];
    if (vuelta) { const x = $$('button', vuelta).find(b => /seguir|cerrar|vale|genial|^✕$/i.test(texto(b))) || $$('button', vuelta)[0]; if (x) x.click(); log(`🎁 ${texto(vuelta).slice(0, 80)}`); }
    return volverValle();
  }
  async function volverValle() {
    await espera(400);
    const t = pestana(/^🏡\s*Valle$|^Valle$/);
    if (t) { t.click(); await espera(800); }
  }

  /* ------------------------------------------------------------------ *
   *  PANEL (debajo del valle)
   * ------------------------------------------------------------------ */
  function pintarBoton() {
    const p = document.getElementById('axv-panel');
    if (!p) return;
    const b = p.querySelector('.axv-todo');
    if (b) { b.disabled = enMarcha; b.textContent = enMarcha ? '⏳ Haciéndolo…' : '🤖 Hacerlo todo'; }
    kBadge(p.querySelector('.k-badge'), enMarcha ? 'on' : hecho ? 'ok' : 'off', enMarcha ? 'EN MARCHA' : hecho ? 'HECHO' : opc.repetir ? 'CADA 30 MIN' : 'LISTO');
  }
  // Producción, almacén y Brillo en las cifras de arriba
  function pintarCifras(x) {
    const p = document.getElementById('axv-panel');
    if (!p || !x) return;
    kSet(p.querySelector('.axv-t-prod'), fmt(x.brilloHora || 0));
    kSet(p.querySelector('.axv-t-alm'), Math.round((x.lleno || 0) * 100) + '%');
    kSet(p.querySelector('.axv-t-bri'), fmt(x.brillo || 0));
    const bar = p.querySelector('.axv-bar');
    if (bar) { bar.style.width = Math.min(100, Math.round((x.lleno || 0) * 100)) + '%'; bar.style.backgroundColor = (x.lleno || 0) >= 0.5 ? '#2FA84F' : '#F2B632'; }
    const sig = opciones(x)[0];
    kSet(p.querySelector('.k-sub'), sig ? `Lo que más rinde: ${sig.nombre} (✦ ${fmt(sig.coste)})` : 'Todo al día');
    pintarPlan(x);
  }
  // Qué va a pasar con la recogida y la investigación (se ve sin darle a nada)
  function pintarPlan(x) {
    const p = document.getElementById('axv-panel'); if (!p || !x) return;
    const el = p.querySelector('.axv-plan'); if (!el) return;
    const hh = t => new Date(t).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const d = decidirRecoger(x, Date.now(), opc, cdRecoger());
    const l = [];
    l.push(d.ya ? `✦ Recoger ya: ${d.motivo}${d.tonico ? ' (con Tónico)' : ''}.` : `⏳ ${d.motivo}${d.volver ? ` · a las ${hh(d.volver)}` : ''}.`);
    if (x.horaPunta) l.push('🌅 La hora punta (×2) de hoy sigue sin usar.'); else if ((x.nodos || []).some(n => n.id === 'horaPunta' && n.nivel > 0)) l.push('🌅 Hora punta de hoy: ya usada.');
    if (opc.investigar && x.funciones && x.funciones.investigar) l.push(x.pi >= x.costeCasilla ? `🔭 Puntos para investigar: ${fmt(x.pi)} (hacen falta ${fmt(x.costeCasilla)}).` : `🔭 Investigación: ${fmt(x.pi)} de ${fmt(x.costeCasilla)} puntos (+${(x.piHora || 0).toFixed(1)}/h).`);
    if (x.ayudas) l.push(`🤝 Manos hoy: ${x.ayudas.dadas}/${x.ayudas.max}.`);
    const t = l.join('\n'); if (el.dataset.h !== t) { el.dataset.h = t; el.style.whiteSpace = 'pre-line'; el.textContent = t; }
  }
  function programarRepeticion() {
    clearInterval(repetirT);
    if (opc.repetir) repetirT = setInterval(() => { if (enValle() && document.getElementById('axv-panel')) hacerTodo(); }, 30 * 60 * 1000);
  }
  function montar() {
    if (!enValle()) { const p = document.getElementById('axv-panel'); if (p) p.remove(); return; }
    if (document.getElementById('axv-panel')) return;
    const ancla = $$('main section').find(s => /grid-cols-3/.test(s.className) && /Colocar/.test(texto(s)));
    if (!ancla) return;
    kStyle('axv-kit', '#axv-panel', '#D4A72C');
    const p = document.createElement('section');
    p.id = 'axv-panel';
    p.className = 'tarjeta space-y-3 p-3';
    p.setAttribute('data-ax-ignore', '1');
    const casilla = (k, t) => `<label class="k-switch text-[11px] font-bold leading-snug text-tinta-600"><input type="checkbox" data-k="${k}" ${opc[k] ? 'checked' : ''}><span>${t}</span></label>`;
    p.innerHTML = `
      ${kHead('🌄', 'Valle Aurora · Todo en un botón', '')}
      <div class="k-tiles" style="--k-cols:3">
        <div class="${K_TILE}"><b class="axv-t-prod tabular-nums">–</b><small>✦ por hora</small></div>
        <div class="${K_TILE}"><b class="axv-t-alm tabular-nums">–</b><small>Almacén</small></div>
        <div class="${K_TILE}"><b class="axv-t-bri tabular-nums">–</b><small>✦ Brillo</small></div>
      </div>
      <div class="${K_BAR}"><span class="axv-bar" style="width:0%;background-color:#F2B632"></span></div>
      <button type="button" class="axv-todo boton-principal w-full !py-2.5 text-sm">🤖 Hacerlo todo</button>
      <p class="axv-plan rounded-card border-2 border-crema-200 bg-crema-50 p-2 text-[11px] font-bold leading-snug text-tinta-600"></p>
      <div class="space-y-2">
        ${casilla('punta', 'Hora punta ×2: la primera recogida del día, con el almacén casi lleno (o en la última media hora)')}
        ${casilla('tonico', 'Usar Tónico en las recogidas grandes (la de la hora punta, o con el almacén al 80%+)')}
        ${casilla('mitad', 'Si la Feria cuenta recogidas, recoger solo con el almacén a la mitad o más')}
        ${casilla('silos', 'Comprar Silos (+2 h de almacén cada uno, hasta 24 h)')}
        ${casilla('investigar', 'Gastar los puntos de investigación (Planos → Contratos → Ojo de Oak…)')}
        ${casilla('manos', 'Echar las 3 manos del día en otros valles (ganáis los dos)')}
        ${casilla('reorganizar', 'Reorganizar trabajadores cuando cambia el tipo en racha')}
        ${casilla('expedicion', 'La expedición gratis del día (nunca gasta energía)')}
        ${casilla('horasExtra', 'Una tanda de Horas extra al día (gasta energía)')}
        ${casilla('repetir', 'Repetirlo solo cada 30 min mientras tengas el valle abierto')}
      </div>
      <p class="text-[10px] font-semibold text-tinta-400">Gasta el Brillo en lo que más producción da por cada Brillo: edificios (con sus hitos ×2 y huecos nuevos), pisos del Monumento y la comida de los residentes. No construye edificios nuevos, no migra ni compra en la tienda.</p>
      <div class="axv-log ${K_LOG}"></div>`;
    ancla.insertAdjacentElement('afterend', p);
    p.querySelector('.axv-todo').addEventListener('click', e => { e.preventDefault(); hacerTodo(); });
    for (const c of $$('input[data-k]', p)) c.addEventListener('change', () => { opc[c.dataset.k] = c.checked; lsPut(LS_OPC, opc); programarRepeticion(); pintarBoton(); });
    pintarBoton();
    // qué haría ahora
    const x = estadoValle();
    pintarCifras(x);
    if (x) { const sig = opciones(x)[0]; log(`Producción: ${fmt(x.brilloHora || 0)}/h · almacén al ${Math.round((x.lleno || 0) * 100)}%.${sig ? ` Lo que más rinde ahora: ${sig.nombre} (✦ ${fmt(sig.coste)}, +${fmt(sig.d)}/h).` : ''}`); }
  }

  let t = null;
  new MutationObserver(() => { clearTimeout(t); t = setTimeout(montar, 400); }).observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(montar, 2000);
  programarRepeticion();
  setInterval(() => { if (enValle() && document.getElementById('axv-panel') && !enMarcha) { const x = estadoValle(); if (x) { pintarCifras(x); calcularProxima(x); } } }, 60000);
})();
