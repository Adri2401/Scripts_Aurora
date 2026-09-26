// ==UserScript==
// @name         Aurora Dex · Valle Aurora (todo en un botón)
// @namespace    auroradex-valle
// @version      1.1.1
// @description  Solo en /valle. Un botón que lo hace todo de la forma más rentable: recoge (con Tónico cuando compensa y con el almacén a la mitad o más, que es lo que cuenta en la Feria), cobra los encargos, coloca a los mejores (y reorganiza cuando cambia el tipo en racha) y gasta el Brillo en lo que más producción da por cada Brillo (edificios, con sus hitos ×2 y huecos nuevos, Monumento y residentes). Opcional: Horas extra y repetirlo solo cada 30 min.
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
  function opciones(x) {
    const ops = [];
    const encNiv = (x.hoy && x.hoy.encargos || []).find(e => /niveles/.test(e.id) && !e.cobrado && e.progreso < e.meta);
    const premioNivel = encNiv ? encNiv.brillo / (encNiv.meta - encNiv.progreso) : 0;
    for (const e of x.edificios) {
      if (!e.abierto || !e.coste || e.candado) continue;
      const n = e.nivel, bh = e.brilloHora || 0;
      if (n < 1) continue;                                          // construir uno nuevo lo decides tú
      let d = bh * ((n + 1) / n * (HITOS.includes(n + 1) ? 2 : 1) - 1);
      if (e.siguienteHueco === n + 1 && e.trabajadores.length) d += bh / e.trabajadores.length;
      d *= factorAprendido(e.id);
      const coste = e.coste.brillo, costeEf = Math.max(1, coste - premioNivel);
      ops.push({ tipo: 'edificio', id: e.id, nombre: `${e.nombre} → Nv ${n + 1}${HITOS.includes(n + 1) ? ' (×2)' : ''}`, coste, dinero: e.coste.dinero || 0, d, roi: d / costeEf, bh });
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
   *  HACER TODO
   * ------------------------------------------------------------------ */
  const LS_OPC = 'axv-opciones', LS_RACHA = 'axv-racha';
  const opc = Object.assign({ tonico: true, mitad: true, reorganizar: true, horasExtra: false, repetir: false }, lsGet(LS_OPC, {}));
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

      // 1) Recoger: con el almacén a la mitad o más (es lo que cuenta para la Feria) y con Tónico si hay
      const lleno = x.lleno || 0;
      const rec = bRecoger();
      if (libre(rec) && (!opc.mitad || lleno >= 0.5)) {
        const t = document.getElementById('valle-tonico');
        const quiero = opc.tonico && x.tonicos > 0;
        if (t && t.checked !== quiero) { t.click(); await espera(200); }
        const antes = x.brillo;
        await pulsar(bRecoger());
        x = estadoValle() || x;
        log(`✦ Recogido ${fmt(Math.max(0, x.brillo - antes))}${quiero ? ' (con Tónico)' : ''}.`);
      } else if (libre(rec)) log(`Almacén al ${Math.round(lleno * 100)}%: espero a la mitad para recoger (cuenta para la Feria).`);

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

      // 5) Gastar el Brillo en lo que más rinde
      let compras = 0;
      for (let paso = 0; paso < 80; paso++) {
        x = estadoValle();
        if (!x) break;
        const op = opciones(x).find(o => o.coste <= x.brillo && o.dinero <= (x.dinero || 0));
        if (!op) break;
        const b = op.tipo === 'edificio' ? bSubir(op.id) : op.tipo === 'monumento' ? bMonumento() : bComer();
        if (!libre(b)) break;
        const antes = op.tipo === 'edificio' ? (x.edificios.find(e => e.id === op.id) || {}).brilloHora : 0;
        await pulsar(b);
        const x2 = estadoValle();
        if (!x2 || x2 === x) { log(`⚠️ No pude: ${op.nombre}.`); break; }
        if (op.tipo === 'edificio') {
          const desp = (x2.edificios.find(e => e.id === op.id) || {}).brilloHora;
          apuntarSubida(op.id, op.d / factorAprendido(op.id), (desp || 0) - (antes || 0));
        }
        compras++;
        log(`⬆️ ${op.nombre} · ✦ ${fmt(op.coste)} → +${fmt(op.d)}/h (se paga en ${Math.max(1, Math.round(op.coste / Math.max(op.d, 1)))} h)`);
      }
      // encargos que se hayan cumplido comprando
      for (let i = 0; i < 5; i++) { const b = bEncargos()[0]; if (!b) break; await pulsar(b); log('📜 Encargo cobrado.'); }
      x = estadoValle() || x;
      const sig = opciones(x)[0];
      log(`✅ Hecho${compras ? ` (${compras} mejora${compras > 1 ? 's' : ''})` : ''}. Producción: ${fmt(x.brilloHora || 0)}/h.${sig ? ` Lo siguiente que más rinde: ${sig.nombre} (✦ ${fmt(sig.coste)}).` : ''}`);
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
      <div class="space-y-2">
        ${casilla('mitad', 'Recoger solo con el almacén a la mitad o más (cuenta para la Feria)')}
        ${casilla('tonico', 'Usar Tónico al recoger si hay')}
        ${casilla('reorganizar', 'Reorganizar trabajadores cuando cambia el tipo en racha')}
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
})();
