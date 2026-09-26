// ==UserScript==
// @name         Aurora Dex · Frente Batalla (automático)
// @namespace    auroradex-frente
// @version      0.5.0
// @updateURL    https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_frente.user.js
// @downloadURL  https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_frente.user.js
// @description  En cada edificio del Frente Batalla (/frontera/…): marca solos a los mejores para esa regla de los Pokémon que haya (en cuanto abres la pantalla de elegir) (todo a Nv.50, contra rivales de todos los tipos), empieza la tanda y va pulsando «Seguir» hasta el final. Si sale una pantalla que aún no conoce, se para, avisa y deja copiar su HTML. En la Cúpula, antes de cada combate, pone a los tuyos en el mejor orden contra los tres que te esperan. Si ganas una tanda empieza sola la siguiente; se para si pierdes o al llevar 3 ganadas. Y recomienda lo mejor de toda la Pokédex (1ª a 5ª generación, sin legendarios) para cada edificio: 3 Pokémon en la Arena (1 contra 1) y 3 equipos de 3 en los demás.
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
      // marcado: la tarjeta sale con el borde verde (o aria-pressed)
      const marcado = b.getAttribute('aria-pressed') === 'true' || /\b(border-hoja-[3-6]00|bg-hoja-50)\b/.test(b.className);
      return { b, nombre: img ? img.alt : texto(b), num: m ? +m[1] : null, vale: !b.disabled, marcado };
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
    // Ausente (Slaking): solo pega un turno sí y otro no (el 1º y el 3º)
    const pega = (x, t) => x.num !== HOLGAZAN || t % 2 === 0;
    for (let t = 0; t < 3; t++) {
      const dA = pega(a, t) ? gA : 0, dB = pega(b, t) ? gB : 0;
      if (primero) { vB -= dA; if (vB <= 0) return 1; vA -= dB; if (vA <= 0) return 0; }
      else { vA -= dB; if (vA <= 0) return 0; vB -= dA; if (vB <= 0) return 1; }
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
   *  LO MEJOR DE LA POKÉDEX para cada edificio (1ª a 5ª generación, sin legendarios ni singulares, que el Frente no deja)
   *  Tipos y estadísticas base de PokéAPI, todo a Nv.50 y con el modelo de ese edificio. Uno contra uno (Arena): los 3
   *  que más ganan. Tres contra tres: de los 50 mejores sueltos, todas las combinaciones de 3; se enseñan los 3 mejores
   *  equipos que no repitan más de uno entre sí (para tener alternativas de verdad). En la Fábrica no aplica (alquiler).
   * ------------------------------------------------------------------ */
  const POKEDEX = '1:Bulbasaur:planta/veneno:45.49.49.65.65.45,2:Ivysaur:planta/veneno:60.62.63.80.80.60,3:Venusaur:planta/veneno:80.82.83.100.100.80,4:Charmander:fuego:39.52.43.60.50.65,5:Charmeleon:fuego:58.64.58.80.65.80,6:Charizard:fuego/volador:78.84.78.109.85.100,7:Squirtle:agua:44.48.65.50.64.43,8:Wartortle:agua:59.63.80.65.80.58,9:Blastoise:agua:79.83.100.85.105.78,10:Caterpie:bicho:45.30.35.20.20.45,11:Metapod:bicho:50.20.55.25.25.30,12:Butterfree:bicho/volador:60.45.50.90.80.70,13:Weedle:bicho/veneno:40.35.30.20.20.50,14:Kakuna:bicho/veneno:45.25.50.25.25.35,15:Beedrill:bicho/veneno:65.90.40.45.80.75,16:Pidgey:normal/volador:40.45.40.35.35.56,17:Pidgeotto:normal/volador:63.60.55.50.50.71,18:Pidgeot:normal/volador:83.80.75.70.70.101,19:Rattata:normal:30.56.35.25.35.72,20:Raticate:normal:55.81.60.50.70.97,21:Spearow:normal/volador:40.60.30.31.31.70,22:Fearow:normal/volador:65.90.65.61.61.100,23:Ekans:veneno:35.60.44.40.54.55,24:Arbok:veneno:60.95.69.65.79.80,25:Pikachu:electrico:35.55.40.50.50.90,26:Raichu:electrico:60.90.55.90.80.110,27:Sandshrew:tierra:50.75.85.20.30.40,28:Sandslash:tierra:75.100.110.45.55.65,29:Nidoran♀:veneno:55.47.52.40.40.41,30:Nidorina:veneno:70.62.67.55.55.56,31:Nidoqueen:veneno/tierra:90.92.87.75.85.76,32:Nidoran♂:veneno:46.57.40.40.40.50,33:Nidorino:veneno:61.72.57.55.55.65,34:Nidoking:veneno/tierra:81.102.77.85.75.85,35:Clefairy:hada:70.45.48.60.65.35,36:Clefable:hada:95.70.73.95.90.60,37:Vulpix:fuego:38.41.40.50.65.65,38:Ninetales:fuego:73.76.75.81.100.100,39:Jigglypuff:normal/hada:115.45.20.45.25.20,40:Wigglytuff:normal/hada:140.70.45.85.50.45,41:Zubat:veneno/volador:40.45.35.30.40.55,42:Golbat:veneno/volador:75.80.70.65.75.90,43:Oddish:planta/veneno:45.50.55.75.65.30,44:Gloom:planta/veneno:60.65.70.85.75.40,45:Vileplume:planta/veneno:75.80.85.110.90.50,46:Paras:bicho/planta:35.70.55.45.55.25,47:Parasect:bicho/planta:60.95.80.60.80.30,48:Venonat:bicho/veneno:60.55.50.40.55.45,49:Venomoth:bicho/veneno:70.65.60.90.75.90,50:Diglett:tierra:10.55.25.35.45.95,51:Dugtrio:tierra:35.100.50.50.70.120,52:Meowth:normal:40.45.35.40.40.90,53:Persian:normal:65.70.60.65.65.115,54:Psyduck:agua:50.52.48.65.50.55,55:Golduck:agua:80.82.78.95.80.85,56:Mankey:lucha:40.80.35.35.45.70,57:Primeape:lucha:65.105.60.60.70.95,58:Growlithe:fuego:55.70.45.70.50.60,59:Arcanine:fuego:90.110.80.100.80.95,60:Poliwag:agua:40.50.40.40.40.90,61:Poliwhirl:agua:65.65.65.50.50.90,62:Poliwrath:agua/lucha:90.95.95.70.90.70,63:Abra:psiquico:25.20.15.105.55.90,64:Kadabra:psiquico:40.35.30.120.70.105,65:Alakazam:psiquico:55.50.45.135.95.120,66:Machop:lucha:70.80.50.35.35.35,67:Machoke:lucha:80.100.70.50.60.45,68:Machamp:lucha:90.130.80.65.85.55,69:Bellsprout:planta/veneno:50.75.35.70.30.40,70:Weepinbell:planta/veneno:65.90.50.85.45.55,71:Victreebel:planta/veneno:80.105.65.100.70.70,72:Tentacool:agua/veneno:40.40.35.50.100.70,73:Tentacruel:agua/veneno:80.70.65.80.120.100,74:Geodude:roca/tierra:40.80.100.30.30.20,75:Graveler:roca/tierra:55.95.115.45.45.35,76:Golem:roca/tierra:80.120.130.55.65.45,77:Ponyta:fuego:50.85.55.65.65.90,78:Rapidash:fuego:65.100.70.80.80.105,79:Slowpoke:agua/psiquico:90.65.65.40.40.15,80:Slowbro:agua/psiquico:95.75.110.100.80.30,81:Magnemite:electrico/acero:25.35.70.95.55.45,82:Magneton:electrico/acero:50.60.95.120.70.70,83:Farfetch’d:normal/volador:52.90.55.58.62.60,84:Doduo:normal/volador:35.85.45.35.35.75,85:Dodrio:normal/volador:60.110.70.60.60.110,86:Seel:agua:65.45.55.45.70.45,87:Dewgong:agua/hielo:90.70.80.70.95.70,88:Grimer:veneno:80.80.50.40.50.25,89:Muk:veneno:105.105.75.65.100.50,90:Shellder:agua:30.65.100.45.25.40,91:Cloyster:agua/hielo:50.95.180.85.45.70,92:Gastly:fantasma/veneno:30.35.30.100.35.80,93:Haunter:fantasma/veneno:45.50.45.115.55.95,94:Gengar:fantasma/veneno:60.65.60.130.75.110,95:Onix:roca/tierra:35.45.160.30.45.70,96:Drowzee:psiquico:60.48.45.43.90.42,97:Hypno:psiquico:85.73.70.73.115.67,98:Krabby:agua:30.105.90.25.25.50,99:Kingler:agua:55.130.115.50.50.75,100:Voltorb:electrico:40.30.50.55.55.100,101:Electrode:electrico:60.50.70.80.80.150,102:Exeggcute:planta/psiquico:60.40.80.60.45.40,103:Exeggutor:planta/psiquico:95.95.85.125.75.55,104:Cubone:tierra:50.50.95.40.50.35,105:Marowak:tierra:60.80.110.50.80.45,106:Hitmonlee:lucha:50.120.53.35.110.87,107:Hitmonchan:lucha:50.105.79.35.110.76,108:Lickitung:normal:90.55.75.60.75.30,109:Koffing:veneno:40.65.95.60.45.35,110:Weezing:veneno:65.90.120.85.70.60,111:Rhyhorn:tierra/roca:80.85.95.30.30.25,112:Rhydon:tierra/roca:105.130.120.45.45.40,113:Chansey:normal:250.5.5.35.105.50,114:Tangela:planta:65.55.115.100.40.60,115:Kangaskhan:normal:105.95.80.40.80.90,116:Horsea:agua:30.40.70.70.25.60,117:Seadra:agua:55.65.95.95.45.85,118:Goldeen:agua:45.67.60.35.50.63,119:Seaking:agua:80.92.65.65.80.68,120:Staryu:agua:30.45.55.70.55.85,121:Starmie:agua/psiquico:60.75.85.100.85.115,122:Mr. Mime:psiquico/hada:40.45.65.100.120.90,123:Scyther:bicho/volador:70.110.80.55.80.105,124:Jynx:hielo/psiquico:65.50.35.115.95.95,125:Electabuzz:electrico:65.83.57.95.85.105,126:Magmar:fuego:65.95.57.100.85.93,127:Pinsir:bicho:65.125.100.55.70.85,128:Tauros:normal:75.100.95.40.70.110,129:Magikarp:agua:20.10.55.15.20.80,130:Gyarados:agua/volador:95.125.79.60.100.81,131:Lapras:agua/hielo:130.85.80.85.95.60,132:Ditto:normal:48.48.48.48.48.48,133:Eevee:normal:55.55.50.45.65.55,134:Vaporeon:agua:130.65.60.110.95.65,135:Jolteon:electrico:65.65.60.110.95.130,136:Flareon:fuego:65.130.60.95.110.65,137:Porygon:normal:65.60.70.85.75.40,138:Omanyte:roca/agua:35.40.100.90.55.35,139:Omastar:roca/agua:70.60.125.115.70.55,140:Kabuto:roca/agua:30.80.90.55.45.55,141:Kabutops:roca/agua:60.115.105.65.70.80,142:Aerodactyl:roca/volador:80.105.65.60.75.130,143:Snorlax:normal:160.110.65.65.110.30,147:Dratini:dragon:41.64.45.50.50.50,148:Dragonair:dragon:61.84.65.70.70.70,149:Dragonite:dragon/volador:91.134.95.100.100.80,152:Chikorita:planta:45.49.65.49.65.45,153:Bayleef:planta:60.62.80.63.80.60,154:Meganium:planta:80.82.100.83.100.80,155:Cyndaquil:fuego:39.52.43.60.50.65,156:Quilava:fuego:58.64.58.80.65.80,157:Typhlosion:fuego:78.84.78.109.85.100,158:Totodile:agua:50.65.64.44.48.43,159:Croconaw:agua:65.80.80.59.63.58,160:Feraligatr:agua:85.105.100.79.83.78,161:Sentret:normal:35.46.34.35.45.20,162:Furret:normal:85.76.64.45.55.90,163:Hoothoot:normal/volador:60.30.30.36.56.50,164:Noctowl:normal/volador:100.50.50.86.96.70,165:Ledyba:bicho/volador:40.20.30.40.80.55,166:Ledian:bicho/volador:55.35.50.55.110.85,167:Spinarak:bicho/veneno:40.60.40.40.40.30,168:Ariados:bicho/veneno:70.90.70.60.70.40,169:Crobat:veneno/volador:85.90.80.70.80.130,170:Chinchou:agua/electrico:75.38.38.56.56.67,171:Lanturn:agua/electrico:125.58.58.76.76.67,172:Pichu:electrico:20.40.15.35.35.60,173:Cleffa:hada:50.25.28.45.55.15,174:Igglybuff:normal/hada:90.30.15.40.20.15,175:Togepi:hada:35.20.65.40.65.20,176:Togetic:hada/volador:55.40.85.80.105.40,177:Natu:psiquico/volador:40.50.45.70.45.70,178:Xatu:psiquico/volador:65.75.70.95.70.95,179:Mareep:electrico:55.40.40.65.45.35,180:Flaaffy:electrico:70.55.55.80.60.45,181:Ampharos:electrico:90.75.85.115.90.55,182:Bellossom:planta:75.80.95.90.100.50,183:Marill:agua/hada:70.20.50.20.50.40,184:Azumarill:agua/hada:100.50.80.60.80.50,185:Sudowoodo:roca:70.100.115.30.65.30,186:Politoed:agua:90.75.75.90.100.70,187:Hoppip:planta/volador:35.35.40.35.55.50,188:Skiploom:planta/volador:55.45.50.45.65.80,189:Jumpluff:planta/volador:75.55.70.55.95.110,190:Aipom:normal:55.70.55.40.55.85,191:Sunkern:planta:30.30.30.30.30.30,192:Sunflora:planta:75.75.55.105.85.30,193:Yanma:bicho/volador:65.65.45.75.45.95,194:Wooper:agua/tierra:55.45.45.25.25.15,195:Quagsire:agua/tierra:95.85.85.65.65.35,196:Espeon:psiquico:65.65.60.130.95.110,197:Umbreon:siniestro:95.65.110.60.130.65,198:Murkrow:siniestro/volador:60.85.42.85.42.91,199:Slowking:agua/psiquico:95.75.80.100.110.30,200:Misdreavus:fantasma:60.60.60.85.85.85,201:Unown:psiquico:48.72.48.72.48.48,202:Wobbuffet:psiquico:190.33.58.33.58.33,203:Girafarig:normal/psiquico:70.80.65.90.65.85,204:Pineco:bicho:50.65.90.35.35.15,205:Forretress:bicho/acero:75.90.140.60.60.40,206:Dunsparce:normal:100.70.70.65.65.45,207:Gligar:tierra/volador:65.75.105.35.65.85,208:Steelix:acero/tierra:75.85.200.55.65.30,209:Snubbull:hada:60.80.50.40.40.30,210:Granbull:hada:90.120.75.60.60.45,211:Qwilfish:agua/veneno:65.95.85.55.55.85,212:Scizor:bicho/acero:70.130.100.55.80.65,213:Shuckle:bicho/roca:20.10.230.10.230.5,214:Heracross:bicho/lucha:80.125.75.40.95.85,215:Sneasel:siniestro/hielo:55.95.55.35.75.115,216:Teddiursa:normal:60.80.50.50.50.40,217:Ursaring:normal:90.130.75.75.75.55,218:Slugma:fuego:40.40.40.70.40.20,219:Magcargo:fuego/roca:60.50.120.90.80.30,220:Swinub:hielo/tierra:50.50.40.30.30.50,221:Piloswine:hielo/tierra:100.100.80.60.60.50,222:Corsola:agua/roca:65.55.95.65.95.35,223:Remoraid:agua:35.65.35.65.35.65,224:Octillery:agua:75.105.75.105.75.45,225:Delibird:hielo/volador:45.55.45.65.45.75,226:Mantine:agua/volador:85.40.70.80.140.70,227:Skarmory:acero/volador:65.80.140.40.70.70,228:Houndour:siniestro/fuego:45.60.30.80.50.65,229:Houndoom:siniestro/fuego:75.90.50.110.80.95,230:Kingdra:agua/dragon:75.95.95.95.95.85,231:Phanpy:tierra:90.60.60.40.40.40,232:Donphan:tierra:90.120.120.60.60.50,233:Porygon2:normal:85.80.90.105.95.60,234:Stantler:normal:73.95.62.85.65.85,235:Smeargle:normal:55.20.35.20.45.75,236:Tyrogue:lucha:35.35.35.35.35.35,237:Hitmontop:lucha:50.95.95.35.110.70,238:Smoochum:hielo/psiquico:45.30.15.85.65.65,239:Elekid:electrico:45.63.37.65.55.95,240:Magby:fuego:45.75.37.70.55.83,241:Miltank:normal:95.80.105.40.70.100,242:Blissey:normal:255.10.10.75.135.55,246:Larvitar:roca/tierra:50.64.50.45.50.41,247:Pupitar:roca/tierra:70.84.70.65.70.51,248:Tyranitar:roca/siniestro:100.134.110.95.100.61,252:Treecko:planta:40.45.35.65.55.70,253:Grovyle:planta:50.65.45.85.65.95,254:Sceptile:planta:70.85.65.105.85.120,255:Torchic:fuego:45.60.40.70.50.45,256:Combusken:fuego/lucha:60.85.60.85.60.55,257:Blaziken:fuego/lucha:80.120.70.110.70.80,258:Mudkip:agua:50.70.50.50.50.40,259:Marshtomp:agua/tierra:70.85.70.60.70.50,260:Swampert:agua/tierra:100.110.90.85.90.60,261:Poochyena:siniestro:35.55.35.30.30.35,262:Mightyena:siniestro:70.90.70.60.60.70,263:Zigzagoon:normal:38.30.41.30.41.60,264:Linoone:normal:78.70.61.50.61.100,265:Wurmple:bicho:45.45.35.20.30.20,266:Silcoon:bicho:50.35.55.25.25.15,267:Beautifly:bicho/volador:60.70.50.100.50.65,268:Cascoon:bicho:50.35.55.25.25.15,269:Dustox:bicho/veneno:60.50.70.50.90.65,270:Lotad:agua/planta:40.30.30.40.50.30,271:Lombre:agua/planta:60.50.50.60.70.50,272:Ludicolo:agua/planta:80.70.70.90.100.70,273:Seedot:planta:40.40.50.30.30.30,274:Nuzleaf:planta/siniestro:70.70.40.60.40.60,275:Shiftry:planta/siniestro:90.100.60.90.60.80,276:Taillow:normal/volador:40.55.30.30.30.85,277:Swellow:normal/volador:60.85.60.75.50.125,278:Wingull:agua/volador:40.30.30.55.30.85,279:Pelipper:agua/volador:60.50.100.95.70.65,280:Ralts:psiquico/hada:28.25.25.45.35.40,281:Kirlia:psiquico/hada:38.35.35.65.55.50,282:Gardevoir:psiquico/hada:68.65.65.125.115.80,283:Surskit:bicho/agua:40.30.32.50.52.65,284:Masquerain:bicho/volador:70.60.62.100.82.80,285:Shroomish:planta:60.40.60.40.60.35,286:Breloom:planta/lucha:60.130.80.60.60.70,287:Slakoth:normal:60.60.60.35.35.30,288:Vigoroth:normal:80.80.80.55.55.90,289:Slaking:normal:150.160.100.95.65.100,290:Nincada:bicho/tierra:31.45.90.30.30.40,291:Ninjask:bicho/volador:61.90.45.50.50.160,292:Shedinja:bicho/fantasma:1.90.45.30.30.40,293:Whismur:normal:64.51.23.51.23.28,294:Loudred:normal:84.71.43.71.43.48,295:Exploud:normal:104.91.63.91.73.68,296:Makuhita:lucha:72.60.30.20.30.25,297:Hariyama:lucha:144.120.60.40.60.50,298:Azurill:normal/hada:50.20.40.20.40.20,299:Nosepass:roca:30.45.135.45.90.30,300:Skitty:normal:50.45.45.35.35.50,301:Delcatty:normal:70.65.65.55.55.90,302:Sableye:siniestro/fantasma:50.75.75.65.65.50,303:Mawile:acero/hada:50.85.85.55.55.50,304:Aron:acero/roca:50.70.100.40.40.30,305:Lairon:acero/roca:60.90.140.50.50.40,306:Aggron:acero/roca:70.110.180.60.60.50,307:Meditite:lucha/psiquico:30.40.55.40.55.60,308:Medicham:lucha/psiquico:60.60.75.60.75.80,309:Electrike:electrico:40.45.40.65.40.65,310:Manectric:electrico:70.75.60.105.60.105,311:Plusle:electrico:60.50.40.85.75.95,312:Minun:electrico:60.40.50.75.85.95,313:Volbeat:bicho:65.73.75.47.85.85,314:Illumise:bicho:65.47.75.73.85.85,315:Roselia:planta/veneno:50.60.45.100.80.65,316:Gulpin:veneno:70.43.53.43.53.40,317:Swalot:veneno:100.73.83.73.83.55,318:Carvanha:agua/siniestro:45.90.20.65.20.65,319:Sharpedo:agua/siniestro:70.120.40.95.40.95,320:Wailmer:agua:130.70.35.70.35.60,321:Wailord:agua:170.90.45.90.45.60,322:Numel:fuego/tierra:60.60.40.65.45.35,323:Camerupt:fuego/tierra:70.100.70.105.75.40,324:Torkoal:fuego:70.85.140.85.70.20,325:Spoink:psiquico:60.25.35.70.80.60,326:Grumpig:psiquico:80.45.65.90.110.80,327:Spinda:normal:60.60.60.60.60.60,328:Trapinch:tierra:45.100.45.45.45.10,329:Vibrava:tierra/dragon:50.70.50.50.50.70,330:Flygon:tierra/dragon:80.100.80.80.80.100,331:Cacnea:planta:50.85.40.85.40.35,332:Cacturne:planta/siniestro:70.115.60.115.60.55,333:Swablu:normal/volador:45.40.60.40.75.50,334:Altaria:dragon/volador:75.70.90.70.105.80,335:Zangoose:normal:73.115.60.60.60.90,336:Seviper:veneno:73.100.60.100.60.65,337:Lunatone:roca/psiquico:90.55.65.95.85.70,338:Solrock:roca/psiquico:90.95.85.55.65.70,339:Barboach:agua/tierra:50.48.43.46.41.60,340:Whiscash:agua/tierra:110.78.73.76.71.60,341:Corphish:agua:43.80.65.50.35.35,342:Crawdaunt:agua/siniestro:63.120.85.90.55.55,343:Baltoy:tierra/psiquico:40.40.55.40.70.55,344:Claydol:tierra/psiquico:60.70.105.70.120.75,345:Lileep:roca/planta:66.41.77.61.87.23,346:Cradily:roca/planta:86.81.97.81.107.43,347:Anorith:roca/bicho:45.95.50.40.50.75,348:Armaldo:roca/bicho:75.125.100.70.80.45,349:Feebas:agua:20.15.20.10.55.80,350:Milotic:agua:95.60.79.100.125.81,351:Castform:normal:70.70.70.70.70.70,352:Kecleon:normal:60.90.70.60.120.40,353:Shuppet:fantasma:44.75.35.63.33.45,354:Banette:fantasma:64.115.65.83.63.65,355:Duskull:fantasma:20.40.90.30.90.25,356:Dusclops:fantasma:40.70.130.60.130.25,357:Tropius:planta/volador:99.68.83.72.87.51,358:Chimecho:psiquico:75.50.80.95.90.65,359:Absol:siniestro:65.130.60.75.60.75,360:Wynaut:psiquico:95.23.48.23.48.23,361:Snorunt:hielo:50.50.50.50.50.50,362:Glalie:hielo:80.80.80.80.80.80,363:Spheal:hielo/agua:70.40.50.55.50.25,364:Sealeo:hielo/agua:90.60.70.75.70.45,365:Walrein:hielo/agua:110.80.90.95.90.65,366:Clamperl:agua:35.64.85.74.55.32,367:Huntail:agua:55.104.105.94.75.52,368:Gorebyss:agua:55.84.105.114.75.52,369:Relicanth:agua/roca:100.90.130.45.65.55,370:Luvdisc:agua:43.30.55.40.65.97,371:Bagon:dragon:45.75.60.40.30.50,372:Shelgon:dragon:65.95.100.60.50.50,373:Salamence:dragon/volador:95.135.80.110.80.100,374:Beldum:acero/psiquico:40.55.80.35.60.30,375:Metang:acero/psiquico:60.75.100.55.80.50,376:Metagross:acero/psiquico:80.135.130.95.90.70,387:Turtwig:planta:55.68.64.45.55.31,388:Grotle:planta:75.89.85.55.65.36,389:Torterra:planta/tierra:95.109.105.75.85.56,390:Chimchar:fuego:44.58.44.58.44.61,391:Monferno:fuego/lucha:64.78.52.78.52.81,392:Infernape:fuego/lucha:76.104.71.104.71.108,393:Piplup:agua:53.51.53.61.56.40,394:Prinplup:agua:64.66.68.81.76.50,395:Empoleon:agua/acero:84.86.88.111.101.60,396:Starly:normal/volador:40.55.30.30.30.60,397:Staravia:normal/volador:55.75.50.40.40.80,398:Staraptor:normal/volador:85.120.70.50.60.100,399:Bidoof:normal:59.45.40.35.40.31,400:Bibarel:normal/agua:79.85.60.55.60.71,401:Kricketot:bicho:37.25.41.25.41.25,402:Kricketune:bicho:77.85.51.55.51.65,403:Shinx:electrico:45.65.34.40.34.45,404:Luxio:electrico:60.85.49.60.49.60,405:Luxray:electrico:80.120.79.95.79.70,406:Budew:planta/veneno:40.30.35.50.70.55,407:Roserade:planta/veneno:60.70.65.125.105.90,408:Cranidos:roca:67.125.40.30.30.58,409:Rampardos:roca:97.165.60.65.50.58,410:Shieldon:roca/acero:30.42.118.42.88.30,411:Bastiodon:roca/acero:60.52.168.47.138.30,412:Burmy:bicho:40.29.45.29.45.36,413:Wormadam:bicho/planta:60.59.85.79.105.36,414:Mothim:bicho/volador:70.94.50.94.50.66,415:Combee:bicho/volador:30.30.42.30.42.70,416:Vespiquen:bicho/volador:70.80.102.80.102.40,417:Pachirisu:electrico:60.45.70.45.90.95,418:Buizel:agua:55.65.35.60.30.85,419:Floatzel:agua:85.105.55.85.50.115,420:Cherubi:planta:45.35.45.62.53.35,421:Cherrim:planta:70.60.70.87.78.85,422:Shellos:agua:76.48.48.57.62.34,423:Gastrodon:agua/tierra:111.83.68.92.82.39,424:Ambipom:normal:75.100.66.60.66.115,425:Drifloon:fantasma/volador:90.50.34.60.44.70,426:Drifblim:fantasma/volador:150.80.44.90.54.80,427:Buneary:normal:55.66.44.44.56.85,428:Lopunny:normal:65.76.84.54.96.105,429:Mismagius:fantasma:60.60.60.105.105.105,430:Honchkrow:siniestro/volador:100.125.52.105.52.71,431:Glameow:normal:49.55.42.42.37.85,432:Purugly:normal:71.82.64.64.59.112,433:Chingling:psiquico:45.30.50.65.50.45,434:Stunky:veneno/siniestro:63.63.47.41.41.74,435:Skuntank:veneno/siniestro:103.93.67.71.61.84,436:Bronzor:acero/psiquico:57.24.86.24.86.23,437:Bronzong:acero/psiquico:67.89.116.79.116.33,438:Bonsly:roca:50.80.95.10.45.10,439:Mime Jr.:psiquico/hada:20.25.45.70.90.60,440:Happiny:normal:100.5.5.15.65.30,441:Chatot:normal/volador:76.65.45.92.42.91,442:Spiritomb:fantasma/siniestro:50.92.108.92.108.35,443:Gible:dragon/tierra:58.70.45.40.45.42,444:Gabite:dragon/tierra:68.90.65.50.55.82,445:Garchomp:dragon/tierra:108.130.95.80.85.102,446:Munchlax:normal:135.85.40.40.85.5,447:Riolu:lucha:40.70.40.35.40.60,448:Lucario:lucha/acero:70.110.70.115.70.90,449:Hippopotas:tierra:68.72.78.38.42.32,450:Hippowdon:tierra:108.112.118.68.72.47,451:Skorupi:veneno/bicho:40.50.90.30.55.65,452:Drapion:veneno/siniestro:70.90.110.60.75.95,453:Croagunk:veneno/lucha:48.61.40.61.40.50,454:Toxicroak:veneno/lucha:83.106.65.86.65.85,455:Carnivine:planta:74.100.72.90.72.46,456:Finneon:agua:49.49.56.49.61.66,457:Lumineon:agua:69.69.76.69.86.91,458:Mantyke:agua/volador:45.20.50.60.120.50,459:Snover:planta/hielo:60.62.50.62.60.40,460:Abomasnow:planta/hielo:90.92.75.92.85.60,461:Weavile:siniestro/hielo:70.120.65.45.85.125,462:Magnezone:electrico/acero:70.70.115.130.90.60,463:Lickilicky:normal:110.85.95.80.95.50,464:Rhyperior:tierra/roca:115.140.130.55.55.40,465:Tangrowth:planta:100.100.125.110.50.50,466:Electivire:electrico:75.123.67.95.85.95,467:Magmortar:fuego:75.95.67.125.95.83,468:Togekiss:hada/volador:85.50.95.120.115.80,469:Yanmega:bicho/volador:86.76.86.116.56.95,470:Leafeon:planta:65.110.130.60.65.95,471:Glaceon:hielo:65.60.110.130.95.65,472:Gliscor:tierra/volador:75.95.125.45.75.95,473:Mamoswine:hielo/tierra:110.130.80.70.60.80,474:Porygon-Z:normal:85.80.70.135.75.90,475:Gallade:psiquico/lucha:68.125.65.65.115.80,476:Probopass:roca/acero:60.55.145.75.150.40,477:Dusknoir:fantasma:45.100.135.65.135.45,478:Froslass:hielo/fantasma:70.80.70.80.70.110,479:Rotom:electrico/fantasma:50.50.77.95.77.91,495:Snivy:planta:45.45.55.45.55.63,496:Servine:planta:60.60.75.60.75.83,497:Serperior:planta:75.75.95.75.95.113,498:Tepig:fuego:65.63.45.45.45.45,499:Pignite:fuego/lucha:90.93.55.70.55.55,500:Emboar:fuego/lucha:110.123.65.100.65.65,501:Oshawott:agua:55.55.45.63.45.45,502:Dewott:agua:75.75.60.83.60.60,503:Samurott:agua:95.100.85.108.70.70,504:Patrat:normal:45.55.39.35.39.42,505:Watchog:normal:60.85.69.60.69.77,506:Lillipup:normal:45.60.45.25.45.55,507:Herdier:normal:65.80.65.35.65.60,508:Stoutland:normal:85.110.90.45.90.80,509:Purrloin:siniestro:41.50.37.50.37.66,510:Liepard:siniestro:64.88.50.88.50.106,511:Pansage:planta:50.53.48.53.48.64,512:Simisage:planta:75.98.63.98.63.101,513:Pansear:fuego:50.53.48.53.48.64,514:Simisear:fuego:75.98.63.98.63.101,515:Panpour:agua:50.53.48.53.48.64,516:Simipour:agua:75.98.63.98.63.101,517:Munna:psiquico:76.25.45.67.55.24,518:Musharna:psiquico:116.55.85.107.95.29,519:Pidove:normal/volador:50.55.50.36.30.43,520:Tranquill:normal/volador:62.77.62.50.42.65,521:Unfezant:normal/volador:80.115.80.65.55.93,522:Blitzle:electrico:45.60.32.50.32.76,523:Zebstrika:electrico:75.100.63.80.63.116,524:Roggenrola:roca:55.75.85.25.25.15,525:Boldore:roca:70.105.105.50.40.20,526:Gigalith:roca:85.135.130.60.80.25,527:Woobat:psiquico/volador:65.45.43.55.43.72,528:Swoobat:psiquico/volador:67.57.55.77.55.114,529:Drilbur:tierra:60.85.40.30.45.68,530:Excadrill:tierra/acero:110.135.60.50.65.88,531:Audino:normal:103.60.86.60.86.50,532:Timburr:lucha:75.80.55.25.35.35,533:Gurdurr:lucha:85.105.85.40.50.40,534:Conkeldurr:lucha:105.140.95.55.65.45,535:Tympole:agua:50.50.40.50.40.64,536:Palpitoad:agua/tierra:75.65.55.65.55.69,537:Seismitoad:agua/tierra:105.95.75.85.75.74,538:Throh:lucha:120.100.85.30.85.45,539:Sawk:lucha:75.125.75.30.75.85,540:Sewaddle:bicho/planta:45.53.70.40.60.42,541:Swadloon:bicho/planta:55.63.90.50.80.42,542:Leavanny:bicho/planta:75.103.80.70.80.92,543:Venipede:bicho/veneno:30.45.59.30.39.57,544:Whirlipede:bicho/veneno:40.55.99.40.79.47,545:Scolipede:bicho/veneno:60.100.89.55.69.112,546:Cottonee:planta/hada:40.27.60.37.50.66,547:Whimsicott:planta/hada:60.67.85.77.75.116,548:Petilil:planta:45.35.50.70.50.30,549:Lilligant:planta:70.60.75.110.75.90,550:Basculin:agua:70.92.65.80.55.98,551:Sandile:tierra/siniestro:50.72.35.35.35.65,552:Krokorok:tierra/siniestro:60.82.45.45.45.74,553:Krookodile:tierra/siniestro:95.117.80.65.70.92,554:Darumaka:fuego:70.90.45.15.45.50,555:Darmanitan:fuego:105.140.55.30.55.95,556:Maractus:planta:75.86.67.106.67.60,557:Dwebble:bicho/roca:50.65.85.35.35.55,558:Crustle:bicho/roca:70.105.125.65.75.45,559:Scraggy:siniestro/lucha:50.75.70.35.70.48,560:Scrafty:siniestro/lucha:65.90.115.45.115.58,561:Sigilyph:psiquico/volador:72.58.80.103.80.97,562:Yamask:fantasma:38.30.85.55.65.30,563:Cofagrigus:fantasma:58.50.145.95.105.30,564:Tirtouga:agua/roca:54.78.103.53.45.22,565:Carracosta:agua/roca:74.108.133.83.65.32,566:Archen:roca/volador:55.112.45.74.45.70,567:Archeops:roca/volador:75.140.65.112.65.110,568:Trubbish:veneno:50.50.62.40.62.65,569:Garbodor:veneno:80.95.82.60.82.75,570:Zorua:siniestro:40.65.40.80.40.65,571:Zoroark:siniestro:60.105.60.120.60.105,572:Minccino:normal:55.50.40.40.40.75,573:Cinccino:normal:75.95.60.65.60.115,574:Gothita:psiquico:45.30.50.55.65.45,575:Gothorita:psiquico:60.45.70.75.85.55,576:Gothitelle:psiquico:70.55.95.95.110.65,577:Solosis:psiquico:45.30.40.105.50.20,578:Duosion:psiquico:65.40.50.125.60.30,579:Reuniclus:psiquico:110.65.75.125.85.30,580:Ducklett:agua/volador:62.44.50.44.50.55,581:Swanna:agua/volador:75.87.63.87.63.98,582:Vanillite:hielo:36.50.50.65.60.44,583:Vanillish:hielo:51.65.65.80.75.59,584:Vanilluxe:hielo:71.95.85.110.95.79,585:Deerling:normal/planta:60.60.50.40.50.75,586:Sawsbuck:normal/planta:80.100.70.60.70.95,587:Emolga:electrico/volador:55.75.60.75.60.103,588:Karrablast:bicho:50.75.45.40.45.60,589:Escavalier:bicho/acero:70.135.105.60.105.20,590:Foongus:planta/veneno:69.55.45.55.55.15,591:Amoonguss:planta/veneno:114.85.70.85.80.30,592:Frillish:agua/fantasma:55.40.50.65.85.40,593:Jellicent:agua/fantasma:100.60.70.85.105.60,594:Alomomola:agua:165.75.80.40.45.65,595:Joltik:bicho/electrico:50.47.50.57.50.65,596:Galvantula:bicho/electrico:70.77.60.97.60.108,597:Ferroseed:planta/acero:44.50.91.24.86.10,598:Ferrothorn:planta/acero:74.94.131.54.116.20,599:Klink:acero:40.55.70.45.60.30,600:Klang:acero:60.80.95.70.85.50,601:Klinklang:acero:60.100.115.70.85.90,602:Tynamo:electrico:35.55.40.45.40.60,603:Eelektrik:electrico:65.85.70.75.70.40,604:Eelektross:electrico:85.115.80.105.80.50,605:Elgyem:psiquico:55.55.55.85.55.30,606:Beheeyem:psiquico:75.75.75.125.95.40,607:Litwick:fantasma/fuego:50.30.55.65.55.20,608:Lampent:fantasma/fuego:60.40.60.95.60.55,609:Chandelure:fantasma/fuego:60.55.90.145.90.80,610:Axew:dragon:46.87.60.30.40.57,611:Fraxure:dragon:66.117.70.40.50.67,612:Haxorus:dragon:76.147.90.60.70.97,613:Cubchoo:hielo:55.70.40.60.40.40,614:Beartic:hielo:95.130.80.70.80.50,615:Cryogonal:hielo:80.50.50.95.135.105,616:Shelmet:bicho:50.40.85.40.65.25,617:Accelgor:bicho:80.70.40.100.60.145,618:Stunfisk:tierra/electrico:109.66.84.81.99.32,619:Mienfoo:lucha:45.85.50.55.50.65,620:Mienshao:lucha:65.125.60.95.60.105,621:Druddigon:dragon:77.120.90.60.90.48,622:Golett:tierra/fantasma:59.74.50.35.50.35,623:Golurk:tierra/fantasma:89.124.80.55.80.55,624:Pawniard:siniestro/acero:45.85.70.40.40.60,625:Bisharp:siniestro/acero:65.125.100.60.70.70,626:Bouffalant:normal:95.110.95.40.95.55,627:Rufflet:normal/volador:70.83.50.37.50.60,628:Braviary:normal/volador:100.123.75.57.75.80,629:Vullaby:siniestro/volador:70.55.75.45.65.60,630:Mandibuzz:siniestro/volador:110.65.105.55.95.80,631:Heatmor:fuego:85.97.66.105.66.65,632:Durant:bicho/acero:58.109.112.48.48.109,633:Deino:siniestro/dragon:52.65.50.45.50.38,634:Zweilous:siniestro/dragon:72.85.70.65.70.58,635:Hydreigon:siniestro/dragon:92.105.90.125.90.98,636:Larvesta:bicho/fuego:55.85.55.50.55.60,637:Volcarona:bicho/fuego:85.60.65.135.105.100'.split(',').map(x => { const [n, nombre, t, st] = x.split(':'); return { num: +n, nombre, t: t.split('/'), s: st.split('.').map(Number) }; });
  const memoDex = {};
  const cuantosDe = id => { const E = eleccion(); return E && E.necesarios ? E.necesarios : id === 'arena' ? 1 : 3; };
  async function mejoresPokedex() {
    const id = edificio();
    if (!id || id === 'fabrica') return null;
    const k = cuantosDe(id), clave = id + '|' + k;
    if (memoDex[clave]) return memoDex[clave];
    const todos = POKEDEX.map(p => ({ p, l: { ...stats(p.s), L: 50, tipos: p.t, num: p.num, nombre: p.nombre } }));
    const filas = [];
    for (let i = 0; i < todos.length; i++) {
      const x = todos[i];
      x.fila = BANCO.map(r => v1(x.l, r));
      x.n1 = x.fila.reduce((a, b) => a + b, 0) / BANCO.length;
      filas.push(x);
      if (i % 60 === 59) await sleep(0);
    }
    filas.sort((a, b) => b.n1 - a.n1);
    let res;
    if (k === 1) res = { k, lista: filas.slice(0, 3).map(x => ({ eq: [x], nota: x.n1 })) };
    else {
      const top = filas.slice(0, 50), R = BANCO.length, pir = id === 'piramide';
      const combos = [];
      for (let a = 0; a < top.length; a++) {
        for (let b = a + 1; b < top.length; b++) for (let c = b + 1; c < top.length; c++) {
          const A = top[a].fila, B = top[b].fila, C = top[c].fila;
          let t = 0;
          for (let r = 0; r < R; r++) t += pir ? (A[r] + B[r] + C[r]) / 3 : 1 - (1 - A[r]) * (1 - B[r]) * (1 - C[r]);
          combos.push([t / R, a, b, c]);
        }
        await sleep(0);
      }
      combos.sort((x, y) => y[0] - x[0]);
      const elegidos = [];
      for (const [n, a, b, c] of combos) {
        const ids = [a, b, c];
        if (elegidos.some(e => e.ids.filter(i => ids.includes(i)).length > 1)) continue;
        elegidos.push({ ids, nota: n });
        if (elegidos.length === 3) break;
      }
      res = { k, lista: elegidos.map(e => ({ eq: e.ids.map(i => top[i]).sort((x, y) => y.n1 - x.n1), nota: e.nota })) };
    }
    memoDex[clave] = res;
    return res;
  }
  let dex = null, dexClave = '';
  async function actualizarDex() {
    const id = edificio(), clave = id + '|' + cuantosDe(id);
    if (clave === dexClave) return;
    dexClave = clave; dex = null; pintar();
    const r = await mejoresPokedex();
    if (dexClave === clave) { dex = r; pintar(); }
  }
  function htmlDex() {
    const id = edificio();
    if (id === 'fabrica') return '<p class="text-[11px] font-semibold text-tinta-400">Aquí se pelea con Pokémon de alquiler: tu Pokédex no cuenta.</p>';
    if (!dex) return '<p class="text-[11px] font-semibold text-tinta-400">Buscando en toda la Pokédex…</p>';
    const tengo = new Set(((eleccion() || {}).pokes || []).map(p => p.num));
    const poke = x => `<span class="axf-poke${tengo.has(x.p.num) ? ' axf-tengo' : ''}" title="${kEsc(x.p.t.join(' / '))}${tengo.has(x.p.num) ? ' · lo tienes' : ''}"><img src="/sprites/${x.p.num}.png" alt=""><b>${kEsc(x.p.nombre)}${tengo.has(x.p.num) ? ' ✔' : ''}</b><small>${pct(x.n1)}</small></span>`;
    return dex.k === 1
      ? `<div class="flex flex-wrap justify-center gap-2">${dex.lista.map(e => poke(e.eq[0])).join('')}</div>`
      : dex.lista.map((e, i) => `<div class="space-y-1"><p class="text-[10px] font-extrabold text-tinta-500">Equipo ${i + 1} · gana a ≈ ${pct(e.nota)}</p><div class="flex flex-wrap justify-center gap-2">${e.eq.map(poke).join('')}</div></div>`).join('');
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

  // Deja marcados justo a los recomendados, en su orden. Si la página enseña quién está marcado (borde verde), se mira
  // eso: se quitan los que sobran y se ponen los que faltan, y se comprueba (vale igual si al tocar a otro se cambia
  // solo, como en «Elige uno»). Si no lo enseña, se tira del contador: se toca cada uno y, si el contador no se mueve
  // como toca, se vuelve a tocar.
  const marcados = () => eleccion().pokes.filter(p => p.marcado).map(p => p.nombre);
  const seVeMarcado = () => { const E = eleccion(); return E.elegidos === E.pokes.filter(p => p.marcado).length; };
  async function marcar(R) {
    const quiero = R.eq.map(x => x.p.nombre);
    const buscar = n => { const p = eleccion().pokes.find(y => y.nombre === n && y.vale); if (!p) throw new Error(`No encuentro a ${n}.`); return p; };
    if (seVeMarcado()) {
      for (let vuelta = 0; vuelta < 3; vuelta++) {
        for (const p of eleccion().pokes.filter(y => y.marcado && !quiero.includes(y.nombre))) { p.b.click(); await pausa(250, 400); }
        for (const n of quiero) { const p = buscar(n); if (!p.marcado) { p.b.click(); await pausa(300, 500); } }
        if ([...marcados()].sort().join() === [...quiero].sort().join()) return;
      }
      return;
    }
    if (eleccion().elegidos > 0) {
      for (const p of eleccion().pokes.filter(y => y.vale && !quiero.includes(y.nombre))) {
        const antes = eleccion().elegidos;
        if (!antes) break;
        p.b.click(); await pausa(250, 400);
        if (eleccion().elegidos > antes) { p.b.click(); await pausa(250, 400); }
      }
    }
    for (const n of quiero) {
      const p = buscar(n);
      const antes = eleccion().elegidos;
      p.b.click(); await pausa(300, 500);
      if (eleccion().elegidos <= antes) { p.b.click(); await pausa(300, 500); }   // ya estaba marcado: se desmarcó
    }
  }
  // En cuanto se abre la pantalla de elegir sin nadie marcado, se marcan solos los mejores de los que haya (no gasta
  // nada: la tanda se empieza con el botón). Una vez cada vez que se abre; si luego cambias algo a mano, no se toca.
  let autoFirma = '', marcando = false;
  async function marcarSolo() {
    const E = eleccion();
    if (!E) { autoFirma = ''; return; }            // fuera de la pantalla de elegir (en plena tanda): al volver se marca otra vez
    if (corriendo || marcando || E.elegidos > 0 || !reco || !reco.eq || reco.firma !== recoFirma) return;
    const firma = recoFirma;
    if (!firma || firma === autoFirma) return;
    autoFirma = firma;
    marcando = true;
    try {
      await marcar(reco);
      const F = eleccion();
      if (F && F.elegidos === F.necesarios) log(`☑️ Marcados solos: ${reco.eq.map(x => x.p.nombre).join(', ')}. Dale a «Empezar» o a 🤖.`);
    } catch (e) { console.warn('[axf] marcar', e); }
    finally { marcando = false; }
  }

  /* ─── ¿Ganada o perdida? ───
   * 1) La racha del edificio en los datos de la página (React): si sube, ganada; si estaba en 0 y sigue en 0, perdida.
   * 2) Si no se ve, los mensajes que han salido durante la tanda. Si no está claro, se da por no ganada (y se para). */
  const fibraDe = el => { if (!el) return null; const k = Object.keys(el).find(x => x.startsWith('__reactFiber$')); return k ? el[k] : null; };
  function rachaDatos() {
    const id = edificio();
    const buscar = (v, prof, vistos) => {
      if (!v || typeof v !== 'object' || prof > 4 || vistos.has(v) || v.$$typeof) return null;
      vistos.add(v);
      if (!Array.isArray(v) && typeof v.racha === 'number' && (v.id === id || v.zonaId === 'frontera-' + id || prof === 0)) return v.racha;
      for (const k of Array.isArray(v) ? v.keys() : Object.keys(v)) {
        if (k === 'children') continue;
        const r = buscar(v[k], prof + 1, vistos);
        if (r != null) return r;
      }
      return null;
    };
    for (const el of $$('main section').filter(x => !ajeno(x)).slice(0, 4)) {
      for (let f = fibraDe(el), i = 0; f && i < 60; f = f.return, i++) {
        const r = buscar(f.memoizedProps, 0, new Set());
        if (r != null) return r;
      }
    }
    return null;
  }
  const rachaAhora = () => { const d = rachaDatos(); if (d != null) return d; const m = rachaTexto().join(' ').match(/llevas (\d+) tanda/i); return m ? +m[1] : null; };
  const RE_PERDIDA = /(has perdido|derrota|te (ha|han) ganado|te ha tumbado|ca[ií]do|\bcaes\b|pierdes|fin de la racha|racha (rota|perdida|a cero)|tanda (perdida|gastada)|eliminad)/i;
  const RE_GANADA = /(tanda (completa|superada|ganada)|has ganado (la tanda|los 7|los siete)|\b7\s*\/\s*7\b|siete de siete|s[ií]mbolo[^.]*(es tuyo|conseguido|ganado)|enhorabuena|victoria)/i;
  async function veredicto(antes, textos) {
    let despues = rachaAhora();
    for (let i = 0; i < 20 && antes != null && despues === antes && !(antes === 0 && i >= 10); i++) { await sleep(250); despues = rachaAhora(); }   // lo que tarde en refrescarse
    if (antes != null && despues != null) {
      if (despues > antes) return 'ganada';
      if (despues < antes || antes === 0) return 'perdida';
    }
    const t = textos.join(' · ');
    if (RE_PERDIDA.test(t)) return 'perdida';
    if (RE_GANADA.test(t)) return 'ganada';
    return null;
  }

  // Una tanda: elegir, empezar y avanzar hasta volver a la pantalla de elegir. Devuelve 'ganada', 'perdida', null (no
  // se sabe), 'parado' o 'desconocida' (pantalla que no conoce)
  async function unaTanda() {
    let antes;
    const textos = [], vistos = new Set();
    const apunta = () => { if (eleccion()) return; for (const t of textosJuego()) if (!vistos.has(t)) { vistos.add(t); textos.push(t); } };
    // a mitad de tanda (p. ej. en la Cúpula antes de un combate): se sigue desde ahí
    if (!eleccion() && (pantallaCupula() || botonAvance())) { antes = rachaAhora(); log('▶ Sigo la tanda donde está.'); }
    else {
      const R = await recomendacion();
      if (!R || !R.eq) throw new Error(R ? `Solo ${R.validos.length} Pokémon valen aquí y hacen falta ${R.E.necesarios}.` : 'No veo dónde elegir.');
      await marcar(R);
      // se deja al juego un momento para que apunte la elección antes de empezar
      await pausa(1200, 1800);
      const E = eleccion();
      if (E.elegidos !== E.necesarios) throw new Error(`Hay ${E.elegidos} de ${E.necesarios} elegidos; revísalo.`);
      log(`✅ Elegidos: ${R.eq.map(x => x.p.nombre).join(', ')}.`);
      if (!E.empezar || E.empezar.disabled) throw new Error('El botón de empezar está apagado (¿sin energía?).');
      if (parar) return 'parado';
      antes = rachaAhora();
      const arranque = await empezarTanda(E.empezar);
      if (arranque.estado === 'hecha') {
        log(`🏁 La tanda se ha jugado de golpe (⚡ ${arranque.antes} → ${arranque.despues}).${arranque.textos.length ? ' ' + arranque.textos.join(' · ') : ''}`);
        return veredicto(antes, arranque.textos);
      }
      if (arranque.estado === 'no') throw new Error(arranque.textos.length
        ? `El juego no ha empezado la tanda: «${arranque.textos.join(' · ')}».`
        : 'El juego no ha empezado la tanda: al pulsar «Empezar» no ha cambiado nada ni ha gastado ⚡. Pulsa tú «Empezar la tanda» y, si sale algún mensaje, pásamelo.');
      textos.push(...arranque.textos);
      log('▶ Tanda empezada.');
      await pausa(600, 900);
    }
    // avanzar con los botones del juego hasta volver a la pantalla de elegir
    let ultimo = Date.now(), ultimoBoton = Date.now(), cambiosAntes = cambios, pulsados = 0;
    while (!parar) {
      if (!edificio()) throw new Error('Has salido del edificio.');
      apunta();
      const E2 = eleccion();
      if (E2 && E2.empezar && pulsados > 0) return veredicto(antes, textos);
      // Cúpula: antes de cada combate, los tuyos en el mejor orden contra los que te esperan
      if (pantallaCupula()) { await ordenarCupula(); if (parar) break; }
      const b = botonAvance();
      if (b) {
        await pausa(500, 900);
        if (!b.isConnected || b.disabled) continue;
        apunta();
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
        return 'desconocida';
      }
      const seg = Math.round((Date.now() - ultimoBoton) / 1000);
      if (seg >= 3) { const t = `Esperando al juego… ${seg} s`; if (msg !== t) { msg = t; pintar(); } }
      await sleep(400);
    }
    return 'parado';
  }

  // Tandas seguidas: si ganas una, va solo a por la siguiente; si pierdes (o no está claro), se para; con 3 ganadas, también
  const MAX_GANADAS = 3;
  let ganadas = 0;
  async function hacerTanda() {
    if (corriendo) { parar = true; return; }
    while (marcando) await sleep(200);
    corriendo = true; parar = false; desconocida = false; ganadas = 0;
    kPedirPermiso();
    const aviso = (tipo, titulo, lineas = []) => kAviso({ tipo, app: 'Frente Batalla', icono: EDIFICIOS[edificio()] ? EDIFICIOS[edificio()].icono : '🏝️', titulo, lineas: [EDIFICIOS[edificio()] ? EDIFICIOS[edificio()].nombre : '', ...lineas, ...rachaTexto()].filter(Boolean) });
    try {
      for (;;) {
        const r = await unaTanda();
        if (r === 'parado') { log('■ Parado.'); break; }
        if (r === 'desconocida') break;
        if (r === 'perdida') { log(`❌ Tanda perdida${ganadas ? ` (llevabas ${ganadas} ganada${ganadas > 1 ? 's' : ''})` : ''}: paro.`); aviso('error', 'Tanda perdida', ganadas ? [`Ganadas antes: ${ganadas}`] : []); break; }
        if (r !== 'ganada') { log('⏹ Tanda terminada, pero no sé si la has ganado: paro por si acaso.'); aviso('aviso', 'Tanda terminada', ['No sé si se ha ganado: paro']); break; }
        ganadas++;
        if (ganadas >= MAX_GANADAS) { log(`🏆 ${ganadas} tandas ganadas seguidas: paro.`); aviso('fin', `${ganadas} tandas ganadas`, ['Paro aquí']); break; }
        log(`✔ Tanda ganada (${ganadas}/${MAX_GANADAS}). Voy a por la siguiente.`);
        msg = `Ganadas ${ganadas}/${MAX_GANADAS}: a por la siguiente…`; pintar();
        await pausa(1500, 2500);
        if (!await (async () => { for (let i = 0; i < 40; i++) { if (parar || eleccion()) return true; await sleep(250); } return false; })()) throw new Error('No vuelve la pantalla de elegir para la siguiente tanda.');
        if (parar) { log('■ Parado.'); break; }
      }
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
    const r = await recomendacion();
    if (r) r.firma = firma;
    reco = r;
    pintar();
    marcarSolo();
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
    const dl = p.querySelector('.axf-dex-lista'), hd = htmlDex();
    if (dl.dataset.h !== hd) { dl.innerHTML = hd; dl.dataset.h = hd; }
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
    #axf-panel .axf-msg:empty{display:none}
    #axf-panel .axf-tengo{border-color:rgb(var(--hoja-400))}
    #axf-panel .axf-dex summary{list-style:none}
    #axf-panel .axf-dex summary::-webkit-details-marker{display:none}
    #axf-panel .axf-dex summary::after{content:" ▼";font-size:9px;color:rgb(var(--tinta-400))}
    #axf-panel .axf-dex[open] summary::after{content:" ▲"}`;
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
        <details class="axf-dex rounded-card border-2 border-crema-200 bg-crema-50 p-2">
          <summary class="cursor-pointer text-[11px] font-extrabold text-tinta-600">📖 Lo mejor de toda la Pokédex para aquí</summary>
          <p class="mt-1 text-[10px] font-semibold text-tinta-400">1ª a 5ª generación, sin legendarios (aquí no valen), a Nv.50 y con la regla de este edificio. ✔ = lo tienes.</p>
          <div class="axf-dex-lista mt-2 space-y-2"></div>
        </details>
        <button type="button" class="axf-tanda boton-principal w-full !py-2.5 text-sm"></button>
        <p class="text-[10px] font-semibold leading-snug text-tinta-400">Elige a los mejores (todas las combinaciones de los que valen aquí, contra rivales de todos los tipos), empieza la tanda (se pagan los ⚡ del botón del juego) y va pulsando «Seguir» / «Continuar» hasta el final. Si la ganas, empieza sola la siguiente; se para si pierdes o al llevar 3 ganadas. En la Cúpula, antes de cada combate ordena a los tuyos contra los que te esperan. Si sale algo que aún no sé hacer (las puertas de la Senda, rebuscar en la Pirámide…), se para y te avisa.</p>
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
    actualizarDex();
    marcarSolo();
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
