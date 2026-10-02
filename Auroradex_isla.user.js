// ==UserScript==
// @name         Aurora Dex · Isla Espejismo (qué evolucionar)
// @namespace    auroradex-isla
// @version      2.8.0
// @description  Solo en /isla. «▶ Jugar la isla sola»: elige compañero y, con las tablas exactas de la isla de la semana (qué sale en cada zona y con qué probabilidad) y lo que cambia cada día (marea, enjambre, sequía), gasta la marea en la zona que más puntos promete (especie nueva × captura × victoria + experiencia), pone delante a los 3 mejores contra esa zona (también de la caja) y detrás a los que van a evolucionar, captura a todos (también los repetidos) y lucha contra el jefe cuando compensa (simula el combate). /isla?auto=1 empieza solo. «🗺️ Qué sale en cada zona»: lo que ha salido y lo que aún te falta, con su probabilidad. También dice a quién meter en el equipo para evolucionar a una especie que aún no tienes (a qué nivel y qué día lo permite el tope). Los datos de las islas y las evoluciones ya vienen en el script (y se leen de la web si cambian); solo se consulta PokéAPI si sale una especie que no conoce.
// @match        https://auroradex.es/*
// @match        https://www.auroradex.es/*
// @updateURL    https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_isla.user.js
// @downloadURL  https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_isla.user.js
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// @connect      pokeapi.co
// ==/UserScript==

(function () {
  'use strict';
  // En la ventana oculta de las diarias en segundo plano (script Diarias) juega con sus propias claves: la pestaña y esa
  // ventana comparten el sessionStorage, y así lo que se pone solo allí no se pone solo aquí (ni al revés)
  const EN_FONDO_AX = (() => { try { return window.top !== window && window.name === 'axd-fondo'; } catch { return false; } })();
  try { if (window.top !== window && !EN_FONDO_AX && /^ax[a-z]-fondo$/.test(window.name)) return; } catch { /* nada */ }

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
  const ISLA_CSS = `
    #axi-panel .axi-lista{display:grid;gap:6px;margin:0;padding:0;list-style:none}
    #axi-panel .axi-fila{display:flex;align-items:center;gap:10px;padding:7px 10px 7px 7px;border-radius:16px;background:rgb(var(--crema-50));border:2px solid rgb(var(--crema-200));animation:k-entra .25s ease both}
    #axi-panel .axi-fila.axi-dentro{background:rgb(var(--hoja-50));border-color:rgb(var(--hoja-100))}
    #axi-panel .axi-spr{position:relative;width:40px;height:40px;flex-shrink:0;border-radius:12px;display:grid;place-items:center;background:rgb(var(--lienzo));box-shadow:inset 0 -2px 0 rgb(var(--crema-200))}
    #axi-panel .axi-spr img{width:38px;height:38px;image-rendering:pixelated;object-fit:contain}
    #axi-panel .axi-txt{font-size:11.5px;font-weight:600;line-height:1.35;color:rgb(var(--tinta-600))}
    #axi-panel .axi-fila b{font-weight:800;color:rgb(var(--tinta-800))}
    #axi-panel .axi-flecha{color:#14B8A6;font-weight:900}
    #axi-panel .axi-cuando{display:block;margin-top:1px;font-size:10px;font-weight:700;color:rgb(var(--tinta-400))}
    #axi-panel .axi-tag{flex-shrink:0;padding:3px 9px;border-radius:999px;font-size:10px;font-weight:900;white-space:nowrap}
    #axi-panel .axi-tag.axi-si{background:rgb(var(--hoja-100));color:rgb(var(--hoja-700))}
    #axi-panel .axi-tag.axi-no{background:color-mix(in srgb,#14B8A6 16%,rgb(var(--lienzo)));color:#0F8A7D;box-shadow:inset 0 0 0 1.5px color-mix(in srgb,#14B8A6 40%,transparent)}
    #axi-panel .axi-sobran{padding:8px 10px;border-radius:14px;background:rgb(var(--ambar-50));border:2px solid rgb(var(--ambar-100))}
    #axi-panel .axi-quedaria{display:flex;flex-wrap:wrap;gap:5px}
    #axi-panel .axi-quedaria span{display:inline-flex;align-items:center;gap:4px;padding:2px 9px 2px 3px;border-radius:999px;background:rgb(var(--crema-50));border:2px solid rgb(var(--crema-200));font-size:11px;font-weight:800}
    #axi-panel .axi-quedaria i{font-style:normal;width:18px;height:18px;border-radius:999px;display:grid;place-items:center;font-size:10px;font-weight:900;color:#fff;background:#14B8A6}
    #axi-panel .axi-msg:empty{display:none}`;

  const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
  const lsPut = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin storage */ } };
  const enIsla = () => /^\/isla(\/|$)/.test(location.pathname);
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ------------------------------------------------------------------ *
   *  DATOS DEL JUEGO. Las 5 islas que se turnan cada semana (zonas, qué sale en cada una y con qué peso, jefe y
   *  compañeros) y las especies que pueden salir o evolucionar (tipos, estadísticas base, ritmo de captura y evoluciones
   *  por nivel, de PokéAPI). Son los mismos datos que usa la propia página: si se pueden leer de ella (leerTablasWeb)
   *  valen los de la web, que son los buenos si algún día cambian; si no, valen estos.
   * ------------------------------------------------------------------ */
  const TOPES_DIA = [12, 16, 20, 24, 30, 34, 38], DEX_MAX = 649;
  const VALOR_JEFE = 250;       // vencer al jefe: 200 puntos + sus premios (marco, burbuja y ficha de avatar), que también se quieren
  // r: regla de la semana · c: compañeros · d: zona difícil · j: jefe (nombre, día, coste de marea, [especie, nivel]…)
  // z: zonas [id, nombre, abre el día, nivel mín., nivel máx., [[especie, peso]…]]
  const ISLAS_RESPALDO = {
      selva: { n: "Isla Espejismo · Selva", r: "enjambre", c: [285,290,453], d: "corazon",
        j: { n: "Celebi, el guardián de la Selva", d: 6, c: 3, e: [[45,34],[49,34],[251,37]] },
        z: [
          ["linde","Linde de la Selva",1,3,9,[[10,12],[13,12],[265,12],[401,10],[273,10],[43,10],[69,10],[46,8],[187,8],[165,8],[167,8],[191,6],[285,2],[290,2],[453,2]]],
          ["espesura","La Espesura",3,12,20,[[48,10],[23,9],[41,9],[331,8],[406,8],[204,7],[316,7],[29,6],[32,6],[283,6],[434,6],[415,5],[315,4],[193,3],[114,2]]],
          ["corazon","Corazón de la Selva",5,24,32,[[88,8],[109,8],[451,7],[336,6],[102,6],[455,6],[420,6],[357,5],[313,5],[314,5],[213,4],[214,2],[127,2],[123,2]]],
          ["copa","Copa del Gran Árbol",6,30,38,[[44,6],[70,6],[274,6],[49,6],[47,6],[24,6],[168,6],[357,6],[15,5],[317,5],[435,5],[193,5],[214,4],[127,4],[123,4],[407,3]]] ] },
      brasa: { n: "Isla Espejismo · Brasa", r: "sequia", c: [240,438,449], d: "caldera",
        j: { n: "Entei, el guardián de la Brasa", d: 6, c: 3, e: [[229,39],[59,39],[244,42]] },
        z: [
          ["cenizal","El Cenizal",1,3,9,[[27,12],[50,12],[74,12],[218,10],[322,10],[231,10],[104,8],[328,8],[37,8],[58,6],[343,6],[240,2],[438,2],[449,2]]],
          ["coladas","Las Coladas",3,12,20,[[111,9],[304,8],[299,8],[77,8],[228,7],[75,7],[219,7],[323,7],[105,6],[51,6],[246,6],[408,6],[410,6],[345,4],[347,4]]],
          ["caldera","La Caldera",5,24,32,[[324,8],[95,7],[126,6],[78,6],[185,6],[232,6],[305,6],[112,5],[229,5],[450,5],[344,5],[337,5],[338,5],[138,3],[140,3],[443,3]]],
          ["boca","Boca del Volcán",6,30,38,[[59,6],[38,6],[76,6],[324,5],[323,5],[409,5],[411,5],[330,4],[348,4],[346,4],[208,4],[306,4],[142,3],[467,3],[464,3],[248,2]]] ] },
      coral: { n: "Isla Espejismo · Coral", r: "mareas", c: [283,341,220], d: "fosa",
        j: { n: "Suicune, el guardián del Arrecife", d: 6, c: 3, e: [[91,34],[87,34],[245,37]] },
        z: [
          ["bajio","El Bajío",1,3,9,[[129,12],[278,12],[194,10],[183,10],[270,10],[90,10],[118,10],[120,8],[98,8],[60,8],[72,8],[422,8],[349,5],[283,2],[341,2],[220,2]]],
          ["arrecife","El Arrecife",3,12,20,[[116,8],[223,8],[456,8],[418,8],[54,8],[170,7],[318,7],[366,7],[86,7],[222,6],[370,6],[271,5],[138,4],[140,4],[458,3]]],
          ["fosa","La Fosa",5,24,32,[[320,7],[79,7],[61,6],[117,6],[211,6],[195,6],[361,6],[224,5],[87,5],[364,5],[226,4],[368,4],[367,4],[238,4],[369,3]]],
          ["simas","Simas Heladas",6,30,38,[[55,6],[73,5],[91,5],[121,5],[319,5],[342,5],[419,5],[423,5],[362,5],[87,5],[365,4],[130,4],[131,4],[478,3],[350,3],[230,3]]] ] },
      tormenta: { n: "Isla Espejismo · Tormenta", r: "rayos", c: [179,396,81], d: "ojo",
        j: { n: "Zapdos, el guardián de la Tormenta", d: 6, c: 3, e: [[181,32],[227,32],[145,35]] },
        z: [
          ["duna","Duna del Viento",1,3,9,[[16,12],[21,12],[403,12],[163,10],[276,10],[309,10],[172,8],[100,8],[278,8],[333,8],[177,8],[84,8],[179,2],[396,2],[81,2]]],
          ["acantilado","El Acantilado",3,12,20,[[17,7],[397,7],[180,7],[404,7],[25,6],[311,6],[312,6],[417,6],[170,6],[164,5],[178,5],[207,5],[198,5],[239,5],[441,4],[225,3]]],
          ["ojo","Ojo de la Tormenta",5,24,32,[[82,6],[101,6],[22,6],[42,6],[125,5],[26,5],[310,5],[171,5],[85,5],[193,5],[279,5],[227,4],[291,4],[334,4],[479,3]]],
          ["columnas","Las Columnas",6,30,38,[[18,5],[398,5],[181,5],[405,5],[430,4],[426,4],[469,4],[169,4],[123,4],[227,4],[135,3],[462,3],[466,3],[130,3],[142,3],[468,2]]] ] },
      sombra: { n: "Isla Espejismo · Sombra", r: "niebla", c: [261,325,355], d: "pozo",
        j: { n: "Darkrai, el guardián de la Sombra", d: 6, c: 3, e: [[94,36],[477,36],[491,39]] },
        z: [
          ["bruma","La Bruma",1,3,9,[[92,12],[353,10],[425,10],[96,10],[63,8],[433,8],[360,8],[280,8],[434,8],[228,8],[439,6],[201,6],[261,2],[325,2],[355,2]]],
          ["cementerio","El Cementerio",3,12,20,[[93,7],[262,7],[436,7],[200,6],[302,6],[64,6],[203,6],[274,6],[343,6],[97,5],[326,5],[202,5],[215,5],[337,4],[338,4]]],
          ["pozo","El Pozo",5,24,32,[[356,6],[354,6],[359,5],[435,5],[332,5],[319,5],[65,5],[358,5],[437,5],[344,5],[178,5],[429,4],[442,4],[375,4],[292,3]]],
          ["otro-lado","El Otro Lado",6,30,38,[[275,5],[426,5],[430,5],[342,5],[121,5],[429,5],[94,4],[477,4],[478,4],[461,4],[452,4],[282,4],[197,3],[196,3],[475,3],[376,2]]] ] },
  };
  // [nombre, ritmo de captura, PS, ataque, defensa, ataque esp., defensa esp., velocidad, tipo 1, tipo 2]
  const ESP = {
      10:["caterpie",255,45,30,35,20,20,45,"bicho",null],11:["metapod",120,50,20,55,25,25,30,"bicho",null],12:["butterfree",45,60,45,50,90,80,70,"bicho","volador"],
      13:["weedle",255,40,35,30,20,20,50,"bicho","veneno"],14:["kakuna",120,45,25,50,25,25,35,"bicho","veneno"],15:["beedrill",45,65,90,40,45,80,75,"bicho","veneno"],
      16:["pidgey",255,40,45,40,35,35,56,"normal","volador"],17:["pidgeotto",120,63,60,55,50,50,71,"normal","volador"],18:["pidgeot",45,83,80,75,70,70,101,"normal","volador"],
      21:["spearow",255,40,60,30,31,31,70,"normal","volador"],22:["fearow",90,65,90,65,61,61,100,"normal","volador"],23:["ekans",255,35,60,44,40,54,55,"veneno",null],
      24:["arbok",90,60,95,69,65,79,80,"veneno",null],25:["pikachu",190,35,55,40,50,50,90,"electrico",null],26:["raichu",75,60,90,55,90,80,110,"electrico",null],
      27:["sandshrew",255,50,75,85,20,30,40,"tierra",null],28:["sandslash",90,75,100,110,45,55,65,"tierra",null],29:["nidoran-f",235,55,47,52,40,40,41,"veneno",null],
      30:["nidorina",120,70,62,67,55,55,56,"veneno",null],31:["nidoqueen",45,90,92,87,75,85,76,"veneno","tierra"],32:["nidoran-m",235,46,57,40,40,40,50,"veneno",null],
      33:["nidorino",120,61,72,57,55,55,65,"veneno",null],34:["nidoking",45,81,102,77,85,75,85,"veneno","tierra"],37:["vulpix",190,38,41,40,50,65,65,"fuego",null],
      38:["ninetales",75,73,76,75,81,100,100,"fuego",null],41:["zubat",255,40,45,35,30,40,55,"veneno","volador"],42:["golbat",90,75,80,70,65,75,90,"veneno","volador"],
      43:["oddish",255,45,50,55,75,65,30,"planta","veneno"],44:["gloom",120,60,65,70,85,75,40,"planta","veneno"],45:["vileplume",45,75,80,85,110,90,50,"planta","veneno"],
      46:["paras",190,35,70,55,45,55,25,"bicho","planta"],47:["parasect",75,60,95,80,60,80,30,"bicho","planta"],48:["venonat",190,60,55,50,40,55,45,"bicho","veneno"],
      49:["venomoth",75,70,65,60,90,75,90,"bicho","veneno"],50:["diglett",255,10,55,25,35,45,95,"tierra",null],51:["dugtrio",50,35,100,50,50,70,120,"tierra",null],
      54:["psyduck",190,50,52,48,65,50,55,"agua",null],55:["golduck",75,80,82,78,95,80,85,"agua",null],58:["growlithe",190,55,70,45,70,50,60,"fuego",null],
      59:["arcanine",75,90,110,80,100,80,95,"fuego",null],60:["poliwag",255,40,50,40,40,40,90,"agua",null],61:["poliwhirl",120,65,65,65,50,50,90,"agua",null],
      62:["poliwrath",45,90,95,95,70,90,70,"agua","lucha"],63:["abra",200,25,20,15,105,55,90,"psiquico",null],64:["kadabra",100,40,35,30,120,70,105,"psiquico",null],
      65:["alakazam",50,55,50,45,135,95,120,"psiquico",null],69:["bellsprout",255,50,75,35,70,30,40,"planta","veneno"],70:["weepinbell",120,65,90,50,85,45,55,"planta","veneno"],
      71:["victreebel",45,80,105,65,100,70,70,"planta","veneno"],72:["tentacool",190,40,40,35,50,100,70,"agua","veneno"],73:["tentacruel",60,80,70,65,80,120,100,"agua","veneno"],
      74:["geodude",255,40,80,100,30,30,20,"roca","tierra"],75:["graveler",120,55,95,115,45,45,35,"roca","tierra"],76:["golem",45,80,120,130,55,65,45,"roca","tierra"],
      77:["ponyta",190,50,85,55,65,65,90,"fuego",null],78:["rapidash",60,65,100,70,80,80,105,"fuego",null],79:["slowpoke",190,90,65,65,40,40,15,"agua","psiquico"],
      80:["slowbro",75,95,75,110,100,80,30,"agua","psiquico"],81:["magnemite",190,25,35,70,95,55,45,"electrico","acero"],82:["magneton",60,50,60,95,120,70,70,"electrico","acero"],
      84:["doduo",190,35,85,45,35,35,75,"normal","volador"],85:["dodrio",45,60,110,70,60,60,110,"normal","volador"],86:["seel",190,65,45,55,45,70,45,"agua",null],
      87:["dewgong",75,90,70,80,70,95,70,"agua","hielo"],88:["grimer",190,80,80,50,40,50,25,"veneno",null],89:["muk",75,105,105,75,65,100,50,"veneno",null],
      90:["shellder",190,30,65,100,45,25,40,"agua",null],91:["cloyster",60,50,95,180,85,45,70,"agua","hielo"],92:["gastly",190,30,35,30,100,35,80,"fantasma","veneno"],
      93:["haunter",90,45,50,45,115,55,95,"fantasma","veneno"],94:["gengar",45,60,65,60,130,75,110,"fantasma","veneno"],95:["onix",45,35,45,160,30,45,70,"roca","tierra"],
      96:["drowzee",190,60,48,45,43,90,42,"psiquico",null],97:["hypno",75,85,73,70,73,115,67,"psiquico",null],98:["krabby",225,30,105,90,25,25,50,"agua",null],
      99:["kingler",60,55,130,115,50,50,75,"agua",null],100:["voltorb",190,40,30,50,55,55,100,"electrico",null],101:["electrode",60,60,50,70,80,80,150,"electrico",null],
      102:["exeggcute",90,60,40,80,60,45,40,"planta","psiquico"],103:["exeggutor",45,95,95,85,125,75,55,"planta","psiquico"],104:["cubone",190,50,50,95,40,50,35,"tierra",null],
      105:["marowak",75,60,80,110,50,80,45,"tierra",null],109:["koffing",190,40,65,95,60,45,35,"veneno",null],110:["weezing",60,65,90,120,85,70,60,"veneno",null],
      111:["rhyhorn",120,80,85,95,30,30,25,"tierra","roca"],112:["rhydon",60,105,130,120,45,45,40,"tierra","roca"],114:["tangela",45,65,55,115,100,40,60,"planta",null],
      116:["horsea",225,30,40,70,70,25,60,"agua",null],117:["seadra",75,55,65,95,95,45,85,"agua",null],118:["goldeen",225,45,67,60,35,50,63,"agua",null],
      119:["seaking",60,80,92,65,65,80,68,"agua",null],120:["staryu",225,30,45,55,70,55,85,"agua",null],121:["starmie",60,60,75,85,100,85,115,"agua","psiquico"],
      122:["mr-mime",45,40,45,65,100,120,90,"psiquico","hada"],123:["scyther",45,70,110,80,55,80,105,"bicho","volador"],124:["jynx",45,65,50,35,115,95,95,"hielo","psiquico"],
      125:["electabuzz",45,65,83,57,95,85,105,"electrico",null],126:["magmar",45,65,95,57,100,85,93,"fuego",null],127:["pinsir",45,65,125,100,55,70,85,"bicho",null],
      129:["magikarp",255,20,10,55,15,20,80,"agua",null],130:["gyarados",45,95,125,79,60,100,81,"agua","volador"],131:["lapras",45,130,85,80,85,95,60,"agua","hielo"],
      133:["eevee",45,55,55,50,45,65,55,"normal",null],134:["vaporeon",45,130,65,60,110,95,65,"agua",null],135:["jolteon",45,65,65,60,110,95,130,"electrico",null],
      136:["flareon",45,65,130,60,95,110,65,"fuego",null],138:["omanyte",45,35,40,100,90,55,35,"roca","agua"],139:["omastar",45,70,60,125,115,70,55,"roca","agua"],
      140:["kabuto",45,30,80,90,55,45,55,"roca","agua"],141:["kabutops",45,60,115,105,65,70,80,"roca","agua"],142:["aerodactyl",45,80,105,65,60,75,130,"roca","volador"],
      145:["zapdos",3,90,90,85,125,90,100,"electrico","volador"],163:["hoothoot",255,60,30,30,36,56,50,"normal","volador"],164:["noctowl",90,100,50,50,86,96,70,"normal","volador"],
      165:["ledyba",255,40,20,30,40,80,55,"bicho","volador"],166:["ledian",90,55,35,50,55,110,85,"bicho","volador"],167:["spinarak",255,40,60,40,40,40,30,"bicho","veneno"],
      168:["ariados",90,70,90,70,60,70,40,"bicho","veneno"],169:["crobat",90,85,90,80,70,80,130,"veneno","volador"],170:["chinchou",190,75,38,38,56,56,67,"agua","electrico"],
      171:["lanturn",75,125,58,58,76,76,67,"agua","electrico"],172:["pichu",190,20,40,15,35,35,60,"electrico",null],175:["togepi",190,35,20,65,40,65,20,"hada",null],
      176:["togetic",75,55,40,85,80,105,40,"hada","volador"],177:["natu",190,40,50,45,70,45,70,"psiquico","volador"],178:["xatu",75,65,75,70,95,70,95,"psiquico","volador"],
      179:["mareep",235,55,40,40,65,45,35,"electrico",null],180:["flaaffy",120,70,55,55,80,60,45,"electrico",null],181:["ampharos",45,90,75,85,115,90,55,"electrico",null],
      182:["bellossom",45,75,80,95,90,100,50,"planta",null],183:["marill",190,70,20,50,20,50,40,"agua","hada"],184:["azumarill",75,100,50,80,60,80,50,"agua","hada"],
      185:["sudowoodo",65,70,100,115,30,65,30,"roca",null],186:["politoed",45,90,75,75,90,100,70,"agua",null],187:["hoppip",255,35,35,40,35,55,50,"planta","volador"],
      188:["skiploom",120,55,45,50,45,65,80,"planta","volador"],189:["jumpluff",45,75,55,70,55,95,110,"planta","volador"],191:["sunkern",235,30,30,30,30,30,30,"planta",null],
      192:["sunflora",120,75,75,55,105,85,30,"planta",null],193:["yanma",75,65,65,45,75,45,95,"bicho","volador"],194:["wooper",255,55,45,45,25,25,15,"agua","tierra"],
      195:["quagsire",90,95,85,85,65,65,35,"agua","tierra"],196:["espeon",45,65,65,60,130,95,110,"psiquico",null],197:["umbreon",45,95,65,110,60,130,65,"siniestro",null],
      198:["murkrow",30,60,85,42,85,42,91,"siniestro","volador"],199:["slowking",70,95,75,80,100,110,30,"agua","psiquico"],200:["misdreavus",45,60,60,60,85,85,85,"fantasma",null],
      201:["unown",225,48,72,48,72,48,48,"psiquico",null],202:["wobbuffet",45,190,33,58,33,58,33,"psiquico",null],203:["girafarig",60,70,80,65,90,65,85,"normal","psiquico"],
      204:["pineco",190,50,65,90,35,35,15,"bicho",null],205:["forretress",75,75,90,140,60,60,40,"bicho","acero"],207:["gligar",60,65,75,105,35,65,85,"tierra","volador"],
      208:["steelix",25,75,85,200,55,65,30,"acero","tierra"],211:["qwilfish",45,65,95,85,55,55,85,"agua","veneno"],212:["scizor",25,70,130,100,55,80,65,"bicho","acero"],
      213:["shuckle",190,20,10,230,10,230,5,"bicho","roca"],214:["heracross",45,80,125,75,40,95,85,"bicho","lucha"],215:["sneasel",60,55,95,55,35,75,115,"siniestro","hielo"],
      218:["slugma",190,40,40,40,70,40,20,"fuego",null],219:["magcargo",75,60,50,120,90,80,30,"fuego","roca"],220:["swinub",225,50,50,40,30,30,50,"hielo","tierra"],
      221:["piloswine",75,100,100,80,60,60,50,"hielo","tierra"],222:["corsola",60,65,55,95,65,95,35,"agua","roca"],223:["remoraid",190,35,65,35,65,35,65,"agua",null],
      224:["octillery",75,75,105,75,105,75,45,"agua",null],225:["delibird",45,45,55,45,65,45,75,"hielo","volador"],226:["mantine",25,85,40,70,80,140,70,"agua","volador"],
      227:["skarmory",25,65,80,140,40,70,70,"acero","volador"],228:["houndour",120,45,60,30,80,50,65,"siniestro","fuego"],229:["houndoom",45,75,90,50,110,80,95,"siniestro","fuego"],
      230:["kingdra",45,75,95,95,95,95,85,"agua","dragon"],231:["phanpy",120,90,60,60,40,40,40,"tierra",null],232:["donphan",60,90,120,120,60,60,50,"tierra",null],
      238:["smoochum",45,45,30,15,85,65,65,"hielo","psiquico"],239:["elekid",45,45,63,37,65,55,95,"electrico",null],240:["magby",45,45,75,37,70,55,83,"fuego",null],
      244:["entei",3,115,115,85,90,75,100,"fuego",null],245:["suicune",3,100,75,115,90,115,85,"agua",null],246:["larvitar",45,50,64,50,45,50,41,"roca","tierra"],
      247:["pupitar",45,70,84,70,65,70,51,"roca","tierra"],248:["tyranitar",45,100,134,110,95,100,61,"roca","siniestro"],251:["celebi",45,100,100,100,100,100,100,"psiquico","planta"],
      261:["poochyena",255,35,55,35,30,30,35,"siniestro",null],262:["mightyena",127,70,90,70,60,60,70,"siniestro",null],265:["wurmple",255,45,45,35,20,30,20,"bicho",null],
      266:["silcoon",120,50,35,55,25,25,15,"bicho",null],267:["beautifly",45,60,70,50,100,50,65,"bicho","volador"],268:["cascoon",120,50,35,55,25,25,15,"bicho",null],
      269:["dustox",45,60,50,70,50,90,65,"bicho","veneno"],270:["lotad",255,40,30,30,40,50,30,"agua","planta"],271:["lombre",120,60,50,50,60,70,50,"agua","planta"],
      272:["ludicolo",45,80,70,70,90,100,70,"agua","planta"],273:["seedot",255,40,40,50,30,30,30,"planta",null],274:["nuzleaf",120,70,70,40,60,40,60,"planta","siniestro"],
      275:["shiftry",45,90,100,60,90,60,80,"planta","siniestro"],276:["taillow",200,40,55,30,30,30,85,"normal","volador"],277:["swellow",45,60,85,60,75,50,125,"normal","volador"],
      278:["wingull",190,40,30,30,55,30,85,"agua","volador"],279:["pelipper",45,60,50,100,95,70,65,"agua","volador"],280:["ralts",235,28,25,25,45,35,40,"psiquico","hada"],
      281:["kirlia",120,38,35,35,65,55,50,"psiquico","hada"],282:["gardevoir",45,68,65,65,125,115,80,"psiquico","hada"],283:["surskit",200,40,30,32,50,52,65,"bicho","agua"],
      284:["masquerain",75,70,60,62,100,82,80,"bicho","volador"],285:["shroomish",255,60,40,60,40,60,35,"planta",null],286:["breloom",90,60,130,80,60,60,70,"planta","lucha"],
      290:["nincada",255,31,45,90,30,30,40,"bicho","tierra"],291:["ninjask",120,61,90,45,50,50,160,"bicho","volador"],292:["shedinja",45,1,90,45,30,30,40,"bicho","fantasma"],
      298:["azurill",150,50,20,40,20,40,20,"normal","hada"],299:["nosepass",255,30,45,135,45,90,30,"roca",null],302:["sableye",45,50,75,75,65,65,50,"siniestro","fantasma"],
      304:["aron",180,50,70,100,40,40,30,"acero","roca"],305:["lairon",90,60,90,140,50,50,40,"acero","roca"],306:["aggron",45,70,110,180,60,60,50,"acero","roca"],
      309:["electrike",120,40,45,40,65,40,65,"electrico",null],310:["manectric",45,70,75,60,105,60,105,"electrico",null],311:["plusle",200,60,50,40,85,75,95,"electrico",null],
      312:["minun",200,60,40,50,75,85,95,"electrico",null],313:["volbeat",150,65,73,75,47,85,85,"bicho",null],314:["illumise",150,65,47,75,73,85,85,"bicho",null],
      315:["roselia",150,50,60,45,100,80,65,"planta","veneno"],316:["gulpin",225,70,43,53,43,53,40,"veneno",null],317:["swalot",75,100,73,83,73,83,55,"veneno",null],
      318:["carvanha",225,45,90,20,65,20,65,"agua","siniestro"],319:["sharpedo",60,70,120,40,95,40,95,"agua","siniestro"],320:["wailmer",125,130,70,35,70,35,60,"agua",null],
      321:["wailord",60,170,90,45,90,45,60,"agua",null],322:["numel",255,60,60,40,65,45,35,"fuego","tierra"],323:["camerupt",150,70,100,70,105,75,40,"fuego","tierra"],
      324:["torkoal",90,70,85,140,85,70,20,"fuego",null],325:["spoink",255,60,25,35,70,80,60,"psiquico",null],326:["grumpig",60,80,45,65,90,110,80,"psiquico",null],
      328:["trapinch",255,45,100,45,45,45,10,"tierra",null],329:["vibrava",120,50,70,50,50,50,70,"tierra","dragon"],330:["flygon",45,80,100,80,80,80,100,"tierra","dragon"],
      331:["cacnea",190,50,85,40,85,40,35,"planta",null],332:["cacturne",60,70,115,60,115,60,55,"planta","siniestro"],333:["swablu",255,45,40,60,40,75,50,"normal","volador"],
      334:["altaria",45,75,70,90,70,105,80,"dragon","volador"],336:["seviper",90,73,100,60,100,60,65,"veneno",null],337:["lunatone",45,90,55,65,95,85,70,"roca","psiquico"],
      338:["solrock",45,90,95,85,55,65,70,"roca","psiquico"],341:["corphish",205,43,80,65,50,35,35,"agua",null],342:["crawdaunt",155,63,120,85,90,55,55,"agua","siniestro"],
      343:["baltoy",255,40,40,55,40,70,55,"tierra","psiquico"],344:["claydol",90,60,70,105,70,120,75,"tierra","psiquico"],345:["lileep",45,66,41,77,61,87,23,"roca","planta"],
      346:["cradily",45,86,81,97,81,107,43,"roca","planta"],347:["anorith",45,45,95,50,40,50,75,"roca","bicho"],348:["armaldo",45,75,125,100,70,80,45,"roca","bicho"],
      349:["feebas",255,20,15,20,10,55,80,"agua",null],350:["milotic",60,95,60,79,100,125,81,"agua",null],353:["shuppet",225,44,75,35,63,33,45,"fantasma",null],
      354:["banette",45,64,115,65,83,63,65,"fantasma",null],355:["duskull",190,20,40,90,30,90,25,"fantasma",null],356:["dusclops",90,40,70,130,60,130,25,"fantasma",null],
      357:["tropius",200,99,68,83,72,87,51,"planta","volador"],358:["chimecho",45,75,50,80,95,90,65,"psiquico",null],359:["absol",30,65,130,60,75,60,75,"siniestro",null],
      360:["wynaut",125,95,23,48,23,48,23,"psiquico",null],361:["snorunt",190,50,50,50,50,50,50,"hielo",null],362:["glalie",75,80,80,80,80,80,80,"hielo",null],
      363:["spheal",255,70,40,50,55,50,25,"hielo","agua"],364:["sealeo",120,90,60,70,75,70,45,"hielo","agua"],365:["walrein",45,110,80,90,95,90,65,"hielo","agua"],
      366:["clamperl",255,35,64,85,74,55,32,"agua",null],367:["huntail",60,55,104,105,94,75,52,"agua",null],368:["gorebyss",60,55,84,105,114,75,52,"agua",null],
      369:["relicanth",25,100,90,130,45,65,55,"agua","roca"],370:["luvdisc",225,43,30,55,40,65,97,"agua",null],374:["beldum",3,40,55,80,35,60,30,"acero","psiquico"],
      375:["metang",3,60,75,100,55,80,50,"acero","psiquico"],376:["metagross",3,80,135,130,95,90,70,"acero","psiquico"],396:["starly",255,40,55,30,30,30,60,"normal","volador"],
      397:["staravia",120,55,75,50,40,40,80,"normal","volador"],398:["staraptor",45,85,120,70,50,60,100,"normal","volador"],401:["kricketot",255,37,25,41,25,41,25,"bicho",null],
      402:["kricketune",45,77,85,51,55,51,65,"bicho",null],403:["shinx",235,45,65,34,40,34,45,"electrico",null],404:["luxio",120,60,85,49,60,49,60,"electrico",null],
      405:["luxray",45,80,120,79,95,79,70,"electrico",null],406:["budew",255,40,30,35,50,70,55,"planta","veneno"],407:["roserade",75,60,70,65,125,105,90,"planta","veneno"],
      408:["cranidos",45,67,125,40,30,30,58,"roca",null],409:["rampardos",45,97,165,60,65,50,58,"roca",null],410:["shieldon",45,30,42,118,42,88,30,"roca","acero"],
      411:["bastiodon",45,60,52,168,47,138,30,"roca","acero"],415:["combee",120,30,30,42,30,42,70,"bicho","volador"],416:["vespiquen",45,70,80,102,80,102,40,"bicho","volador"],
      417:["pachirisu",200,60,45,70,45,90,95,"electrico",null],418:["buizel",190,55,65,35,60,30,85,"agua",null],419:["floatzel",75,85,105,55,85,50,115,"agua",null],
      420:["cherubi",190,45,35,45,62,53,35,"planta",null],421:["cherrim",75,70,60,70,87,78,85,"planta",null],422:["shellos",190,76,48,48,57,62,34,"agua",null],
      423:["gastrodon",75,111,83,68,92,82,39,"agua","tierra"],425:["drifloon",125,90,50,34,60,44,70,"fantasma","volador"],426:["drifblim",60,150,80,44,90,54,80,"fantasma","volador"],
      429:["mismagius",45,60,60,60,105,105,105,"fantasma",null],430:["honchkrow",30,100,125,52,105,52,71,"siniestro","volador"],433:["chingling",120,45,30,50,65,50,45,"psiquico",null],
      434:["stunky",225,63,63,47,41,41,74,"veneno","siniestro"],435:["skuntank",60,103,93,67,71,61,84,"veneno","siniestro"],436:["bronzor",255,57,24,86,24,86,23,"acero","psiquico"],
      437:["bronzong",90,67,89,116,79,116,33,"acero","psiquico"],438:["bonsly",255,50,80,95,10,45,10,"roca",null],439:["mime-jr",145,20,25,45,70,90,60,"psiquico","hada"],
      441:["chatot",30,76,65,45,92,42,91,"normal","volador"],442:["spiritomb",100,50,92,108,92,108,35,"fantasma","siniestro"],443:["gible",45,58,70,45,40,45,42,"dragon","tierra"],
      444:["gabite",45,68,90,65,50,55,82,"dragon","tierra"],445:["garchomp",45,108,130,95,80,85,102,"dragon","tierra"],449:["hippopotas",140,68,72,78,38,42,32,"tierra",null],
      450:["hippowdon",60,108,112,118,68,72,47,"tierra",null],451:["skorupi",120,40,50,90,30,55,65,"veneno","bicho"],452:["drapion",45,70,90,110,60,75,95,"veneno","siniestro"],
      453:["croagunk",140,48,61,40,61,40,50,"veneno","lucha"],454:["toxicroak",75,83,106,65,86,65,85,"veneno","lucha"],455:["carnivine",200,74,100,72,90,72,46,"planta",null],
      456:["finneon",190,49,49,56,49,61,66,"agua",null],457:["lumineon",75,69,69,76,69,86,91,"agua",null],458:["mantyke",25,45,20,50,60,120,50,"agua","volador"],
      461:["weavile",45,70,120,65,45,85,125,"siniestro","hielo"],462:["magnezone",30,70,70,115,130,90,60,"electrico","acero"],464:["rhyperior",30,115,140,130,55,55,40,"tierra","roca"],
      465:["tangrowth",30,100,100,125,110,50,50,"planta",null],466:["electivire",30,75,123,67,95,85,95,"electrico",null],467:["magmortar",30,75,95,67,125,95,83,"fuego",null],
      468:["togekiss",30,85,50,95,120,115,80,"hada","volador"],469:["yanmega",30,86,76,86,116,56,95,"bicho","volador"],470:["leafeon",45,65,110,130,60,65,95,"planta",null],
      471:["glaceon",45,65,60,110,130,95,65,"hielo",null],472:["gliscor",30,75,95,125,45,75,95,"tierra","volador"],473:["mamoswine",50,110,130,80,70,60,80,"hielo","tierra"],
      475:["gallade",45,68,125,65,65,115,80,"psiquico","lucha"],476:["probopass",60,60,55,145,75,150,40,"roca","acero"],477:["dusknoir",45,45,100,135,65,135,45,"fantasma",null],
      478:["froslass",75,70,80,70,80,70,110,"hielo","fantasma"],479:["rotom",45,50,50,77,95,77,91,"electrico","fantasma"],491:["darkrai",3,70,90,90,135,90,125,"siniestro",null],
  };
  // evoluciones por nivel: especie → [[a qué especie, nivel, condición]]
  const EVO_RESPALDO = {
      10:[[11,7,""]],11:[[12,10,""]],13:[[14,7,""]],14:[[15,10,""]],
      16:[[17,18,""]],17:[[18,36,""]],21:[[22,20,""]],23:[[24,22,""]],
      27:[[28,22,""]],29:[[30,16,""]],32:[[33,16,""]],41:[[42,22,""]],
      43:[[44,21,""]],46:[[47,24,""]],48:[[49,31,""]],50:[[51,26,""]],
      54:[[55,33,""]],60:[[61,25,""]],63:[[64,16,""]],69:[[70,21,""]],
      72:[[73,30,""]],74:[[75,25,""]],77:[[78,40,""]],79:[[80,37,""]],
      81:[[82,30,""]],84:[[85,31,""]],86:[[87,34,""]],88:[[89,38,""]],
      92:[[93,25,""]],96:[[97,26,""]],98:[[99,28,""]],100:[[101,30,""]],
      104:[[105,28,""]],109:[[110,35,""]],111:[[112,42,""]],116:[[117,32,""]],
      118:[[119,33,""]],129:[[130,20,""]],138:[[139,40,""]],140:[[141,40,""]],
      163:[[164,20,""]],165:[[166,18,""]],167:[[168,22,""]],170:[[171,27,""]],
      177:[[178,25,""]],179:[[180,15,""]],180:[[181,30,""]],183:[[184,18,""]],
      187:[[188,18,""]],188:[[189,27,""]],194:[[195,20,""]],204:[[205,31,""]],
      218:[[219,38,""]],220:[[221,33,""]],223:[[224,25,""]],228:[[229,24,""]],
      231:[[232,25,""]],238:[[124,30,""]],239:[[125,30,""]],240:[[126,30,""]],
      246:[[247,30,""]],247:[[248,55,""]],261:[[262,18,""]],265:[[266,7,""],[268,7,""]],
      266:[[267,10,""]],268:[[269,10,""]],270:[[271,14,""]],273:[[274,14,""]],
      276:[[277,22,""]],278:[[279,25,""]],280:[[281,20,""]],281:[[282,30,""]],
      283:[[284,22,""]],285:[[286,23,""]],290:[[291,20,""]],304:[[305,32,""]],
      305:[[306,42,""]],309:[[310,26,""]],316:[[317,26,""]],318:[[319,30,""]],
      320:[[321,40,""]],322:[[323,33,""]],325:[[326,32,""]],328:[[329,35,""]],
      329:[[330,45,""]],331:[[332,32,""]],333:[[334,35,""]],341:[[342,30,""]],
      343:[[344,36,""]],345:[[346,40,""]],347:[[348,40,""]],353:[[354,37,""]],
      355:[[356,37,""]],360:[[202,15,""]],361:[[362,42,""]],363:[[364,32,""]],
      364:[[365,44,""]],374:[[375,20,""]],375:[[376,45,""]],396:[[397,14,""]],
      397:[[398,34,""]],401:[[402,10,""]],403:[[404,15,""]],404:[[405,30,""]],
      408:[[409,30,""]],410:[[411,30,""]],415:[[416,21,"hembra"]],418:[[419,26,""]],
      420:[[421,25,""]],422:[[423,30,""]],425:[[426,28,""]],434:[[435,34,""]],
      436:[[437,33,""]],443:[[444,24,""]],444:[[445,48,""]],449:[[450,34,""]],
      451:[[452,40,""]],453:[[454,37,""]],456:[[457,31,""]],
  };
  const nombreEsp = n => (ESP[n] && ESP[n][0]) || '';
  // «los raros salen el triple» (marea baja): por el ritmo de captura, que es como el juego reparte la rareza
  // (común ≥ 190, poco común ≥ 60, rara por debajo; p. ej. Gyarados y Omanyte, con 45, son raros y Corsola, con 60, no)
  const esRara = n => !!ESP[n] && ESP[n][1] < 55;
  const normN = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  let idsPorNombre = null;
  const idDeNombre = nombre => {
    if (!idsPorNombre) { idsPorNombre = {}; for (const n of Object.keys(ESP)) idsPorNombre[normN(ESP[n][0])] = +n; }
    return idsPorNombre[normN(nombre)] || null;
  };
  // Las islas con otro formato, ya normalizadas: { id, regla, companeros, dificil, jefe, zonas: { id: { sp, total… } }, orden }
  function normalizarIsla(id, t) {
    const zonas = {}, orden = [];
    for (const z of t.z) { zonas[z[0]] = { id: z[0], nombre: z[1], desde: z[2], lo: z[3], hi: z[4], sp: z[5], total: z[5].reduce((a, s) => a + s[1], 0) }; orden.push(z[0]); }
    return { id, nombre: t.n, regla: t.r, companeros: t.c, dificil: t.d, jefe: t.j && { nombre: t.j.n, desde: t.j.d, coste: t.j.c, equipo: t.j.e }, zonas, orden };
  }
  // Las tablas de la propia página (el módulo con las islas, entre los trozos de webpack). Se ejecuta ese módulo con un «require»
  // de mentira: solo declara constantes. Si algo no cuadra se ignora y valen las de arriba.
  let tablasWeb = null, tablasWebProbado = false;
  function leerTablasWeb() {
    if (tablasWebProbado) return;
    tablasWebProbado = true;
    try {
      const W = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
      const trozos = W.webpackChunk_N_E;
      if (!trozos || typeof trozos.length !== 'number') return;
      const defs = (o, d) => { for (const k in d) Object.defineProperty(o, k, { get: d[k], enumerable: true }); };
      const falso = Object.assign(() => { throw new Error('require'); }, { d: defs, r() {}, n: x => x, o: (o, k) => Object.prototype.hasOwnProperty.call(o, k) });
      for (let i = 0; i < trozos.length; i++) {
        const mods = trozos[i] && trozos[i][1];
        if (!mods || typeof mods !== 'object') continue;
        for (const id of Object.keys(mods)) {
          const f = mods[id];
          if (typeof f !== 'function') continue;
          const src = Function.prototype.toString.call(f);
          if (src.length < 2000 || src.length > 120000 || !src.includes('zonaDificil') || !src.includes('premiosJefe') || /[^\w$.]\w{1,2}\(\d{3,6}\)/.test(src)) continue;
          const m = { exports: {} };
          try { f(m, m.exports, falso); } catch { continue; }
          const Ef = Object.values(m.exports).find(v => v && typeof v === 'object' && !Array.isArray(v) && Object.values(v).some(x => x && Array.isArray(x.zonas) && x.jefe));
          if (!Ef) continue;
          const out = {};
          for (const [k, v] of Object.entries(Ef)) {
            try {
              if (!v || !Array.isArray(v.zonas) || !v.zonas.length || !v.jefe || !Array.isArray(v.jefe.equipo)) continue;
              const t = {
                n: v.nombre, r: v.regla && v.regla.id, c: v.companeros, d: v.zonaDificil,
                j: { n: v.jefe.nombre, d: v.jefe.desdeDia, c: v.jefe.costeMarea, e: v.jefe.equipo.map(x => [x.id, x.nivel]) },
                z: v.zonas.map(z => [z.id, z.nombre, z.desdeDia, z.nivel[0], z.nivel[1], z.especies.map(e => [e.id, e.peso])]),
              };
              const bien = t.z.every(z => typeof z[0] === 'string' && z[5].length && z[5].every(s => Number.isFinite(s[0]) && s[1] > 0)) && Array.isArray(t.c);
              if (bien) out[k] = t;
            } catch { /* esa isla no */ }
          }
          if (Object.keys(out).length) { tablasWeb = out; return; }
        }
      }
    } catch (e) { console.warn('[axi] tablas de la web', e); }
  }
  const tablaMemo = {};
  function tablaIsla(est) {
    const id = est && est.isla && est.isla.id;
    if (!id) return null;
    leerTablasWeb();
    const fuente = (tablasWeb && tablasWeb[id]) || ISLAS_RESPALDO[id];
    if (!fuente) return null;
    if (!tablaMemo[id] || tablaMemo[id].f !== fuente) tablaMemo[id] = { f: fuente, t: normalizarIsla(id, fuente) };
    return tablaMemo[id].t;
  }
  // Lo que cambia hoy en la isla según la regla de la semana (la página lo cuenta en «Ahora mismo»):
  //   mareas vivas → marea alta (+1 nivel) o baja (los raros ×3) · enjambre → una especie ×5 · sequía → una zona arde (+3 niveles
  //   y +50 % de experiencia) · rayos y niebla → al azar durante la exploración (nada que planear)
  const REGLAS = { enjambre: 'enjambre', sequia: 'sequia', mareas: 'mareas', mareasvivas: 'mareas', rayos: 'rayos', niebla: 'niebla' };
  function efectoDeHoy(est, T = tablaIsla(est)) {
    const e = est.efectoHoy || {};
    const d = `${e.titulo || ''} ${e.detalle || ''}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/×/g, 'x');
    const regla = (T && T.regla) || REGLAS[normN(est.isla && est.isla.regla && est.isla.regla.titulo)] || '';
    const out = { regla, alta: false, baja: false, enjambre: null, arde: null, texto: String(e.detalle || '').trim() };
    if (regla === 'mareas') {
      const lit = d.match(/marea (alta|baja)/);
      out.baja = lit ? lit[1] === 'baja' : /charca|raros?[^.]{0,40}(triple|doble|x\s*3)/.test(d);
      out.alta = lit ? lit[1] === 'alta' : !out.baja && /lo grande|nivel por encima/.test(d);
    } else if (regla === 'enjambre') {
      const m = String(e.sprite || '').match(/(\d+)\.(?:png|webp|gif)/i);
      let n = m ? +m[1] : null;
      if (!n && d.trim() && T) {                                         // si no hay sprite, por el nombre entre las especies de las zonas abiertas
        const dd = ' ' + d.replace(/[^a-z0-9]+/g, ' ') + ' ';
        for (const z of est.zonas || []) {
          if (!z.abierta || !T.zonas[z.id]) continue;
          const hit = T.zonas[z.id].sp.find(([id]) => { const nm = nombreEsp(id).replace(/-/g, ' '); return nm.length > 2 && dd.includes(' ' + nm + ' '); });
          if (hit) { n = hit[0]; break; }
        }
      }
      out.enjambre = n;
    } else if (regla === 'sequia') {
      const llano = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/^(el|la|los|las)\s+/, '');
      const z = (est.zonas || []).find(x => d.includes(llano(x.nombre))) || (est.zonas || []).find(x => new RegExp('(^|[^a-z])' + x.id + '([^a-z]|$)').test(d));
      out.arde = z ? z.id : null;
    }
    return out;
  }
  // «Marea alta (+1 nivel)», «Enjambre: Beedrill ×5»… para el panel
  function textoEfecto(est, ef) {
    if (ef.regla === 'mareas') return ef.alta ? '🌊 Marea alta (rivales +1 nivel)' : ef.baja ? '🏖️ Marea baja (los raros salen ×3)' : '';
    if (ef.regla === 'enjambre') return ef.enjambre ? `🐝 Enjambre: ${nombreEsp(ef.enjambre) ? nombreEsp(ef.enjambre).replace(/(^|-)(\w)/g, (_, a, b) => a + b.toUpperCase()) : '#' + ef.enjambre} sale ×5` : '';
    if (ef.regla === 'sequia') { const z = (est.zonas || []).find(x => x.id === ef.arde); return z ? `☀️ Sequía en ${z.nombre} (+3 niveles, +50 % de experiencia)` : ''; }
    if (ef.regla === 'rayos') return '⚡ De vez en cuando cae un rayo (rival +3 niveles, el doble de experiencia)';
    if (ef.regla === 'niebla') return '🌫️ En la niebla a veces sale algo de una zona aún cerrada';
    return '';
  }

  /* ------------------------------------------------------------------ *
   *  DATOS DE LA ISLA: los mismos que usa la página (equipo, caja, día, tope de nivel)
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
  // El componente de la página (el que recibe `estado`)
  function fibraIsla() {
    const el = $$('main section').find(s => /isla-espejismo/.test(s.className)) || $$('main section')[0];
    let f = actual(fibraDe(el));
    for (let i = 0; f && i < 60; i++, f = f.return) {
      const p = f.memoizedProps;
      if (p && p.estado && Array.isArray(p.estado.caja) && Array.isArray(p.estado.equipo)) return f;
    }
    return null;
  }
  function estadoIsla() { const f = fibraIsla(); return f ? f.memoizedProps.estado : null; }
  // La función de la página que guarda el equipo entero en un orden (la misma que usan «Al equipo», «Sacar» y arrastrar):
  // recibe la lista de ids en orden y un mensaje
  function guardarEquipoFn() {
    const el = $$('main section').find(s => /isla-espejismo/.test(s.className)) || $$('main li[data-id]')[0] || $$('main section')[0];
    const esGuardar = v => Array.isArray(v) && typeof v[0] === 'function' && v[0].length === 2 && /refresh\(\)/.test(String(v[0]));
    // se sube por todos los componentes (y sus versiones alternas) hasta la raíz mirando sus hooks
    for (const inicio of [fibraDe(el), actual(fibraDe(el))]) {
      for (let f = inicio, i = 0; f && i < 200; f = f.return, i++) {
        for (const c of [f, f.alternate]) {
          for (let h = c && c.memoizedState, k = 0; h && typeof h === 'object' && k < 120; h = h.next, k++) {
            if (esGuardar(h.memoizedState)) return h.memoizedState[0];
            if (h.queue && esGuardar(h.baseState)) return h.baseState[0];
          }
        }
      }
    }
    return null;
  }
  // Topes de nivel de cada día, del calendario de «La semana» (si no está, +4 por día)
  function topesSemana(est) {
    const lis = $$('main ol.grid-cols-7 > li');
    const topes = lis.map(li => parseInt(((li.querySelectorAll('span')[1] || {}).textContent || '').trim(), 10));
    const out = {};
    for (let d = 1; d <= (est.dias || 7); d++) {
      const t = topes[d - 1];
      out[d] = Number.isFinite(t) ? t : est.topeNivel + (d - est.dia) * 4;
    }
    out[est.dia] = est.topeNivel;
    return out;
  }

  /* ------------------------------------------------------------------ *
   *  EVOLUCIONES (PokéAPI): por cada especie, a qué especies evoluciona SUBIENDO DE NIVEL y a qué nivel.
   *  Las que van por piedra, intercambio, amistad, etc. no cuentan (en la isla no se pueden hacer).
   * ------------------------------------------------------------------ */
  const LS_EVOS = 'axi-evos';
  const evos = lsGet(LS_EVOS, {});          // { especie: [{ a, nombre, nivel, cond }] } · [] = no evoluciona por nivel
  const pidiendo = new Set();
  function pedirJSON(url) {
    return new Promise((ok, mal) => {
      if (typeof GM_xmlhttpRequest === 'function') {
        GM_xmlhttpRequest({ method: 'GET', url, timeout: 15000, onload: r => { try { ok(JSON.parse(r.responseText)); } catch (e) { mal(e); } }, onerror: mal, ontimeout: mal });
      } else fetch(url).then(r => r.json()).then(ok, mal);
    });
  }
  const idDeUrl = u => parseInt((String(u).match(/\/(\d+)\/?$/) || [])[1], 10);
  const bonitoEn = n => n.split('-').map(x => x.charAt(0).toUpperCase() + x.slice(1)).join('-');
  // las evoluciones por nivel ya vienen con el script (y las de PokéAPI, si hacen falta otras, se piden y se guardan)
  for (const n of Object.keys(ESP)) {
    if (!evos[n]) evos[n] = (EVO_RESPALDO[n] || []).map(([a2, nivel, cond]) => ({ a: a2, nombre: bonitoEn(nombreEsp(a2) || String(a2)), nivel, cond }));
  }
  let guardarT = null;
  async function pedirEvos(id) {
    if (evos[id] || pidiendo.has(id)) return;
    pidiendo.add(id);
    try {
      const sp = await pedirJSON('https://pokeapi.co/api/v2/pokemon-species/' + id + '/');
      const cad = await pedirJSON(sp.evolution_chain.url);
      // se apuntan todas las especies de la cadena de una vez
      const recorre = nodo => {
        const de = idDeUrl(nodo.species.url);
        const lista = [];
        for (const h of nodo.evolves_to || []) {
          for (const d of h.evolution_details || []) {
            if (d.trigger && d.trigger.name === 'level-up' && d.min_level) {
              const cond = [d.time_of_day && (d.time_of_day === 'day' ? 'de día' : 'de noche'), d.gender && (d.gender === 1 ? 'hembra' : 'macho'), d.held_item && 'con objeto', d.known_move && 'sabiendo un movimiento', d.location && 'en un sitio concreto'].filter(Boolean).join(', ');
              lista.push({ a: idDeUrl(h.species.url), nombre: bonitoEn(h.species.name), nivel: d.min_level, cond });
              break;
            }
          }
          recorre(h);
        }
        evos[de] = lista;
      };
      recorre(cad.chain);
      clearTimeout(guardarT);
      guardarT = setTimeout(() => { lsPut(LS_EVOS, Object.assign(lsGet(LS_EVOS, {}), evos)); programar(); }, 300);
    } catch (e) { console.warn('[axi] evoluciones de', id, e); }
    finally { pidiendo.delete(id); }
  }

  /* ------------------------------------------------------------------ *
   *  A QUIÉN SUBIR: por cada Pokémon, las especies que aún no tienes a las que llega SUBIENDO DE NIVEL por su línea
   *  (también la segunda evolución: si ya tienes Pupitar pero no Tyranitar, interesa subir a tu Pupitar). Cada especie
   *  nueva se apunta al ejemplar que la consigue antes. Prioridad para el equipo:
   *   1. los que llegan a una especie nueva esta semana (primero los que lo consiguen antes),
   *   2. los que tienen una especie nueva en su línea aunque esta semana no les dé el tope,
   *   3. el resto (su evolución ya la tienes o no evolucionan por nivel).
   *  Living dex: si solo tienes un ejemplar de esa especie, al evolucionar te quedas sin ella; se avisa y, a igualdad,
   *  se prefiere subir a un repetido.
   * ------------------------------------------------------------------ */
  function analizar(est) {
    const todos = [...est.equipo, ...est.caja];
    const tengo = new Set(todos.map(p => p.speciesId));
    const cuantos = {};
    for (const p of todos) cuantos[p.speciesId] = (cuantos[p.speciesId] || 0) + 1;
    const topes = topesSemana(est), topeMax = Math.max(...Object.values(topes));
    const diaPara = n => { for (let d = est.dia; d <= (est.dias || 7); d++) if (topes[d] >= n) return d; return null; };
    const faltan = [...tengo].filter(id => !evos[id]);
    // especies nuevas a las que lleva su línea subiendo de nivel, con el nivel que hace falta (el mayor del camino)
    const destinos = (id, base = 0, paso = 1, visto = new Set([id])) => {
      const out = [];
      for (const e of evos[id] || []) {
        if (visto.has(e.a) || e.a > DEX_MAX) continue;           // (lo que no está en la dex del juego no se puede conseguir)
        visto.add(e.a);
        const nivel = Math.max(base, e.nivel);
        if (!tengo.has(e.a)) out.push({ ...e, nivel, paso });
        out.push(...destinos(e.a, nivel, paso + 1, visto));
      }
      return out;
    };
    const porPokemon = {};
    for (const p of todos) {
      const lista = evos[p.speciesId];
      if (!lista) continue;
      const nuevas = destinos(p.speciesId).map(e => ({ ...e, falta: Math.max(0, e.nivel - p.nivel), dia: diaPara(e.nivel), alcanzable: e.nivel <= topeMax }));
      porPokemon[p.id] = { p, nuevas, yaTengo: lista.filter(e => tengo.has(e.a)), sinNivel: !lista.length, unico: cuantos[p.speciesId] === 1 };
    }
    // cada especie nueva, para el ejemplar que la consigue antes (a igualdad, uno repetido y luego el de más nivel)
    const vistoDestino = {};
    for (const info of Object.values(porPokemon)) {
      for (const e of info.nuevas) {
        const prev = vistoDestino[e.a];
        const mejor = !prev || e.falta < prev.falta || (e.falta === prev.falta && (prev.unico && !info.unico || (prev.unico === info.unico && info.p.nivel > prev.p.nivel)));
        if (mejor) vistoDestino[e.a] = { p: info.p, unico: info.unico, ...e };
      }
    }
    const orden = (a, b) => (b.alcanzable - a.alcanzable) || ((a.dia || 99) - (b.dia || 99)) || (a.falta - b.falta) || (a.unico - b.unico);
    const candidatos = Object.values(vistoDestino).sort(orden);
    return { candidatos, porPokemon, topes, topeMax, faltan, tengo };
  }

  /* ------------------------------------------------------------------ *
   *  EQUIPO PROPUESTO: el 1.º no se toca; del 2.º al 6.º, por la prioridad de arriba (primero los que llegan esta
   *  semana, luego los que tienen algo nuevo en su línea aunque no lleguen, y solo si faltan, los demás). Entre los
   *  elegidos, los de más nivel delante (el 2.º y el 3.º también pelean).
   * ------------------------------------------------------------------ */
  function equipoPropuesto(est, A, luchan) {
    const primero = est.equipo[0];
    if (!primero) return null;
    if (luchan && luchan.length) {
      // los que pelean ya están elegidos (los 3 mejores contra la zona); detrás, los que van a evolucionar por su prioridad y, si
      // faltan, los de más nivel (en esos huecos no se pelea, solo se gana experiencia)
      const huecos = Math.max(0, 6 - luchan.length), dentro = new Set(luchan.map(p => p.id)), otros = [];
      for (const c of A.candidatos) {
        if (otros.length >= huecos) break;
        if (!dentro.has(c.p.id) && !otros.some(p => p.id === c.p.id)) otros.push(c.p);
      }
      const resto = est.equipo.filter(p => !dentro.has(p.id) && !otros.some(q => q.id === p.id)).sort((a, b) => b.nivel - a.nivel);
      while (otros.length < huecos && resto.length) otros.push(resto.shift());
      return [...luchan, ...otros].slice(0, 6);
    }
    const elegidos = [];
    for (const c of A.candidatos) {
      if (elegidos.length >= 5) break;
      if (c.p.id === primero.id || elegidos.some(p => p.id === c.p.id)) continue;
      elegidos.push(c.p);
    }
    const resto = est.equipo.slice(1).filter(p => !elegidos.some(e => e.id === p.id)).sort((a, b) => b.nivel - a.nivel);
    while (elegidos.length < 5 && resto.length) elegidos.push(resto.shift());
    elegidos.sort((a, b) => b.nivel - a.nivel || (b.progreso || 0) - (a.progreso || 0));
    return [primero, ...elegidos];
  }
  let ordenando = false;
  async function ordenarEquipo(propuesto, mensaje) {
    if (ordenando) return;
    const est = estadoIsla(), fn = guardarEquipoFn();
    const msg = t => { const p = document.querySelector('#axi-panel .axi-msg'); if (p) p.textContent = t; };
    if (!est || !fn) { msg('⚠️ No encuentro cómo cambiar el equipo en esta página.'); return; }
    const prop = propuesto || equipoPropuesto(est, analizar(est));
    if (!prop) return;
    const ids = prop.map(p => p.id);
    if (ids.join() === est.equipo.map(p => p.id).join()) { msg('✔ El equipo ya está así.'); return; }
    ordenando = true;
    try { fn(ids, mensaje || 'Equipo ordenado para evolucionar a especies nuevas.'); msg('✔ Equipo cambiado.'); }
    catch (e) { console.warn('[axi]', e); msg('⚠️ No se pudo: ' + (e && e.message)); }
    finally { setTimeout(() => { ordenando = false; programar(); }, 1500); }
  }

  /* ------------------------------------------------------------------ *
   *  PANEL (antes de «Tu equipo de la isla») y marcas en el equipo
   * ------------------------------------------------------------------ */
  function pintar() {
    if (!enIsla()) { const p = document.getElementById('axi-panel'); if (p) p.remove(); return; }
    const est = estadoIsla();
    if (!est) return;
    const todos = [...est.equipo, ...est.caja];
    for (const id of new Set(todos.map(p => p.speciesId))) if (!evos[id]) pedirEvos(id);
    const cab = $$('main p.titulo-seccion').find(p => /tu equipo de la isla/i.test(p.textContent || ''));
    const zona = cab && cab.closest('section');
    if (!zona) return;
    let caja = document.getElementById('axi-panel');
    kStyle('axi-kit', '#axi-panel', '#14B8A6');
    if (!document.getElementById('axi-css')) { const st = document.createElement('style'); st.id = 'axi-css'; st.textContent = ISLA_CSS; document.head.appendChild(st); }
    if (!caja) { caja = document.createElement('section'); caja.id = 'axi-panel'; caja.className = 'tarjeta space-y-3 p-3'; caja.setAttribute('data-ax-ignore', '1'); }
    if (caja.nextElementSibling !== zona) zona.insertAdjacentElement('beforebegin', caja);
    const A = analizar(est);
    const enEquipo = new Set(est.equipo.map(p => p.id));
    const fila = c => {
      const dentro = enEquipo.has(c.p.id);
      const cuando = !c.alcanzable ? `faltan ${c.falta} niveles (esta semana el tope no llega)` : c.falta === 0 ? 'en cuanto suba un nivel' : c.dia === est.dia ? `faltan ${c.falta} niveles (se puede hoy)` : c.dia ? `faltan ${c.falta} niveles (el tope lo permite el día ${c.dia})` : `faltan ${c.falta} niveles`;
      return `<li class="axi-fila${dentro ? ' axi-dentro' : ''}"><span class="axi-spr"><img src="${esc(c.p.sprite)}" alt="" class="pixelado"></span><span class="axi-txt min-w-0 flex-1"><b>${esc(c.p.nombre)}</b> <span class="text-tinta-400">Nv.${c.p.nivel}</span> <span class="axi-flecha">→</span> <b>${esc(c.nombre)}</b> <span class="text-tinta-400">Nv.${c.nivel}${c.paso > 1 ? ' · 2.ª evolución' : ''}${c.cond ? ' · ' + esc(c.cond) : ''}</span><span class="axi-cuando">${cuando}${c.unico ? ' · <span class="text-ambar-600">es tu único ' + esc(c.p.nombre) + '</span>' : ''}</span></span><span class="axi-tag ${dentro ? 'axi-si' : 'axi-no'}">${dentro ? '✔ en el equipo' : '➕ mételo'}</span></li>`;
    };
    // del equipo: quién no aporta especie nueva
    const sobran = est.equipo.map((p, i) => {
      const info = A.porPokemon[p.id];
      if (!info) return null;
      if (info.nuevas.length) return null;
      const porque = info.sinNivel ? 'no evoluciona subiendo de nivel' : `su evolución ya la tienes (${info.yaTengo.map(x => x.nombre).join(', ')})`;
      return { p, i, porque };
    }).filter(Boolean);
    const pelean = s => s.i < 3;
    const prop = equipoPropuesto(est, A);
    const igual = prop && prop.map(p => p.id).join() === est.equipo.map(p => p.id).join();
    const html = `
      ${kHead('🧬', 'Isla Espejismo · Especies nuevas', `Tope de hoy: Nv.${est.topeNivel} · ${A.candidatos.filter(c => c.alcanzable).length} pueden evolucionar esta semana`)}
      <p class="text-[11px] font-semibold text-tinta-500">Cada especie distinta que tengas aquí son 10 puntos. La experiencia es para todos los del equipo, así que en los huecos que no pelean mete a los que van a evolucionar a una especie que aún no tienes.</p>
      ${A.faltan.length ? `<p class="text-[10px] font-semibold text-tinta-400">Buscando evoluciones de ${A.faltan.length} especies…</p>` : ''}
      ${A.candidatos.some(c => c.alcanzable) ? `<ul class="axi-lista">${A.candidatos.filter(c => c.alcanzable).map(fila).join('')}</ul>` : '<p class="text-[11px] font-semibold text-tinta-500">Ninguno de los que tienes llega esta semana a una especie nueva subiendo de nivel.</p>'}
      ${A.candidatos.some(c => !c.alcanzable) ? `<p class="text-[10px] font-extrabold text-tinta-500">Tienen algo nuevo en su línea aunque esta semana no les dé el tope (mejor ellos que uno que ya no suma):</p><ul class="axi-lista">${A.candidatos.filter(c => !c.alcanzable).map(fila).join('')}</ul>` : ''}
      ${sobran.length ? `<p class="axi-sobran text-[11px] font-semibold text-tinta-600">🔁 En tu equipo no suman especie nueva: ${sobran.map(s => `<b>${esc(s.p.nombre)}</b> (${esc(s.porque)}${pelean(s) ? '; está entre los 3 que pelean, déjalo si te hace falta para ganar' : ''})`).join(' · ')}.</p>` : ''}
      ${prop ? `<p class="titulo-seccion !mb-0">${igual ? '✔ Tu equipo ya está así' : '🔀 Quedaría así'}</p><div class="axi-quedaria">${prop.map((p, i) => `<span><i>${i + 1}</i>${esc(p.nombre)} <small class="text-tinta-400">Nv.${p.nivel}</small></span>`).join('')}</div>
        <button type="button" class="axi-ordenar boton-principal w-full !py-2 text-xs" ${igual ? 'disabled' : ''}>🔀 Ordenar el equipo así (el 1.º se queda)</button>
        <p class="axi-msg text-center text-[10px] font-semibold text-tinta-500"></p>` : ''}
      <p class="text-[10px] font-semibold text-tinta-400">Solo cuentan las evoluciones por nivel: los que evolucionan con piedra, intercambio o amistad no se tienen en cuenta. Tope de hoy: Nv.${est.topeNivel}; el último día, Nv.${A.topeMax}.</p>`;
    if (caja.dataset.html !== html) {
      caja.innerHTML = html; caja.dataset.html = html;
      const b = caja.querySelector('.axi-ordenar');
      if (b) b.addEventListener('click', e => { e.preventDefault(); ordenarEquipo(); });
      kBadge(caja.querySelector('.k-badge'), !prop ? 'off' : igual ? 'ok' : 'warn', !prop ? 'LISTO' : igual ? 'EQUIPO OK' : 'MEJORABLE');
    }
    // marca en cada miembro del equipo
    for (const li of $$('main li[data-id]')) {
      const info = A.porPokemon[li.dataset.id];
      let m = li.querySelector('.axi-marca');
      const util = info && (info.nuevas.find(x => x.alcanzable) || info.nuevas[0]);
      const txt = !info ? '' : util ? `🧬 → ${util.nombre} Nv.${util.nivel}${util.alcanzable ? '' : ' (no llega esta semana)'}` : info.sinNivel ? 'no evoluciona por nivel' : '✖ su evolución ya la tienes';
      if (!txt) { if (m) m.remove(); continue; }
      if (!m) {
        m = document.createElement('span');
        m.className = 'axi-marca pastilla border-2 text-[10px] font-extrabold';
        m.setAttribute('data-ax-ignore', '1');
        const nombre = li.querySelector('span.truncate');
        (nombre ? nombre.parentElement : li).appendChild(m);
      }
      if (m.textContent !== txt) m.textContent = txt;
      m.className = 'axi-marca pastilla border-2 text-[10px] font-extrabold ' + (util ? 'border-hoja-300 bg-hoja-50 text-hoja-700' : 'border-crema-200 bg-crema-50 text-tinta-400');
    }
  }


  /* ------------------------------------------------------------------ *
   *  🗺️ FAUNA POR ZONA: se apunta cada Pokémon que sale en cada zona (de la exploración que lo trajo), cuántas veces,
   *  a qué nivel y si ya lo tienes. Se guarda por isla y semana, y se enseña debajo de las zonas.
   * ------------------------------------------------------------------ */
  const LS_FAUNA = 'axi-fauna', SS_ZONA = 'axi-ultima-zona', SS_AUTO = EN_FONDO_AX ? 'axi-auto-fondo' : 'axi-auto', LS_AUTO_ULT = 'axi-auto-ultimo';
  const claveSemana = est => `${est.isla && est.isla.id}|${est.temporada && est.temporada.id}`;
  function fauna(est) { const t = lsGet(LS_FAUNA, {}); return t[claveSemana(est)] || { zonas: {}, stats: {} }; }
  function guardarFauna(est, fz) {
    const t = lsGet(LS_FAUNA, {});
    t[claveSemana(est)] = fz;
    for (const k of Object.keys(t)) if (k !== claveSemana(est) && Object.keys(t).length > 4) delete t[k];   // solo las últimas semanas
    lsPut(LS_FAUNA, t);
  }
  const ssGet = k => { try { return sessionStorage.getItem(k); } catch { return null; } };
  const ssPut = (k, v) => { try { if (v == null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch { /* nada */ } };
  const tengoNombre = (est, nombre) => [...est.equipo, ...est.caja].some(p => p.nombre === nombre);
  // botones «Explorar · 1 🌊» de cada zona abierta
  function botonesZona(est) {
    const out = [];
    for (const b of $$('main button').filter(x => /^\s*Explorar\s*·/.test(x.textContent || ''))) {
      let caja = b.parentElement;
      for (let i = 0; i < 4 && caja && !est.zonas.some(z => (caja.textContent || '').includes(z.nombre)); i++) caja = caja.parentElement;
      const z = caja && est.zonas.find(z => (caja.textContent || '').includes(z.nombre));
      if (z) out.push({ z, b });
    }
    return out;
  }
  // al explorar (tú o el modo automático) se apunta la zona, para saber de dónde sale lo que salga
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('button');
    if (!b || !enIsla() || !/^\s*Explorar\s*·/.test(b.textContent || '')) return;
    const est = estadoIsla(); if (!est) return;
    const x = botonesZona(est).find(o => o.b === b);
    if (x) { ssPut(SS_ZONA, x.z.id); tomarFoto(est, x.z.id); }
  }, true);
  // la zona de donde viene: la última que se exploró en esta pestaña; si no se sabe y solo hay una abierta, esa
  function zonaDelEncuentro(est) {
    const z = ssGet(SS_ZONA);
    if (z && est.zonas.some(x => x.id === z)) return z;
    const abiertas = est.zonas.filter(x => x.abierta);
    return abiertas.length === 1 ? abiertas[0].id : (z || '?');
  }
  // al pulsar «Capturar» o «Dejarlo ir» (tú o el modo automático) se apunta antes de que desaparezca
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('button');
    if (!b || !enIsla() || !/^\s*(Capturar|Dejarlo ir)\s*$/.test(b.textContent || '')) return;
    const est = estadoIsla(); if (est && est.encuentro) apuntarEncuentro(est);
  }, true);
  let ultimoEnc = '';
  function apuntarEncuentro(est) {
    const en = est.encuentro;
    if (!en) return;
    const firma = [en.nombre, en.nivel, en.esShiny, est.exploraciones].join('|');
    if (firma === ultimoEnc) return;
    ultimoEnc = firma;
    const fz = fauna(est);
    const zona = zonaDelEncuentro(est);
    const zz = fz.zonas[zona] || (fz.zonas[zona] = {});
    const e = zz[en.nombre] || (zz[en.nombre] = { sprite: en.sprite, n: 0, min: en.nivel, max: en.nivel, tipos: [en.tipo1, en.tipo2].filter(Boolean), prob: en.probabilidad });
    e.n++; e.min = Math.min(e.min, en.nivel); e.max = Math.max(e.max, en.nivel); e.prob = en.probabilidad; e.sprite = e.sprite || en.sprite;
    if (en.esShiny) e.shiny = (e.shiny || 0) + 1;
    // solo sale para capturar si le has ganado: cuenta como victoria en esa zona
    const st = fz.stats[zona] || (fz.stats[zona] = { g: 0, p: 0 });
    st.g++;
    guardarFauna(est, fz);
  }
  function apuntarResultado(est, gano) {
    const zona = zonaDelEncuentro(est);
    const fz = fauna(est);
    const st = fz.stats[zona] || (fz.stats[zona] = { g: 0, p: 0 });
    if (gano) st.g++; else st.p++;
    guardarFauna(est, fz);
  }

  /* ------------------------------------------------------------------ *
   *  🤖 ISLA SOLA: elige compañero si hace falta, explora la zona que más especies nuevas promete, captura lo que no
   *  tienes, los variocolor y los repetidos (a todos), ordena el equipo para evolucionar a especies nuevas, lucha
   *  contra el jefe cuando el equipo llega y para cuando se acaba la marea.
   * ------------------------------------------------------------------ */
  const autoOn = () => ssGet(SS_AUTO) === '1';
  let autoPaso = false, autoMsg = '', ultimoOrden = 0, reordenar = true, esperaJefe = 0, fallosOrden = 0, explFondo = -99, trioAnterior = { k: '', t: 0 }, intentosCaptura = { firma: '', n: 0 };
  // el registro sobrevive a las recargas de la pestaña
  const autoLog = (() => { try { return JSON.parse(sessionStorage.getItem((EN_FONDO_AX ? 'axi-auto-log-fondo' : 'axi-auto-log')) || '[]'); } catch { return []; } })();
  const alog = t => { autoLog.push(t); if (autoLog.length > 30) autoLog.shift(); ssPut((EN_FONDO_AX ? 'axi-auto-log-fondo' : 'axi-auto-log'), JSON.stringify(autoLog)); console.log('[axi] ' + t); pintarAuto(); };
  const espera = ms => new Promise(r => setTimeout(r, ms));
  const botonTexto = re => $$('main button, div.fixed button').find(b => !b.closest('#axi-auto, #axi-panel') && !b.disabled && re.test((b.textContent || '').trim()));
  /* ------------------------------------------------------------------ *
   *  🧠 CEREBRO. Puntos del ranking: 10 por cada especie distinta que llegues a tener (capturada o por evolución), 1 por
   *  victoria, 15 por variocolor y 200 por vencer al jefe. Cada exploración cuesta 1 de marea (se acumulan hasta 45 y suben
   *  15 dos veces al día), así que una zona vale lo que da, de media, una exploración suya. Con las tablas exactas del juego
   *  (qué sale en cada zona y con qué peso) y lo que cambia hoy (efectoDeHoy):
   *    P(ganar) × ( 1 por la victoria
   *                 + Σ P(sale la especie) × P(capturarla) × lo que vale tenerla (10 si no la tienes, algo más si de ella
   *                   evoluciona otra que tampoco tienes)
   *                 + niveles que da la victoria × lo que vale un nivel para todo el equipo (evoluciones pendientes y jefe) )
   *  P(ganar) sale de simular el combate del juego (tu trío contra lo que sale ahí) mezclado con lo visto en la zona; P(capturar)
   *  es la que enseña el juego al salir y, antes de verla, una estimada por el ritmo de captura de la especie.
   *  Además va primero la zona del premio «Por explorar X» (fichas de avatar, basta pisarla una vez).
   * ------------------------------------------------------------------ */
  function zonaDificilPendiente(est) {
    const T = tablaIsla(est);
    let z = T && T.dificil ? est.zonas.find(x => x.id === T.dificil) : null;
    if (!z) {
      const m = (((document.querySelector('main') || {}).innerText) || '').match(/Por explorar ([^.\n]+)\./i);
      z = m && est.zonas.find(x => x.nombre === m[1].trim());
    }
    return z && z.abierta && !(est.zonasVisitadas || []).includes(z.id) ? z.id : null;
  }
  // los pesos de las especies de una zona con lo de hoy: el enjambre sale ×5 y con marea baja los raros ×3
  const pesosZona = (zt, ef) => zt.sp.map(([n, w]) => [n, w * (ef.enjambre === n ? 5 : 1) * (ef.baja && esRara(n) ? 3 : 1)]);
  // cuántas especies que no tienes alcanza n subiendo de nivel esta semana (por su línea)
  function evoNuevas(n, tengo, topeMax, visto = new Set([n])) {
    let c = 0;
    for (const e of evos[n] || []) {
      if (visto.has(e.a) || e.a > DEX_MAX || e.nivel > topeMax) continue;
      visto.add(e.a);
      if (!tengo.has(e.a)) c++;
      c += evoNuevas(e.a, tengo, topeMax, visto);
    }
    return c;
  }
  // lo que vale que te salga y captures la especie n
  function valorEspecie(n, tengo, cuantos, topeMax) {
    const nu = Math.min(2, evoNuevas(n, tengo, topeMax));
    if (!tengo.has(n)) return 10 + 3 * nu;                      // la especie, y lo que puede llegar a ser
    return cuantos[n] === 1 ? 2 * nu : 0;                       // un repetido solo sirve para evolucionar sin quedarte sin la especie
  }
  const capturaBase = n => 0.4 + 0.55 * (ESP[n] ? ESP[n][1] : 100) / 255;     // antes de ver la que enseña el juego (ajustada con capturas reales: 46 % con ritmo 25, 49 % con 45, 49-55 % con 75)
  // el juego enseña la probabilidad al salir cada bicho: si se ve que va por encima o por debajo de la estimada, se corrige
  function escalaCaptura(fz) {
    let s = 0, c = 0;
    for (const zs of Object.values(fz.zonas || {})) {
      for (const [nombre, e] of Object.entries(zs)) {
        const n = idDeNombre(nombre);
        if (n && ESP[n] && e.prob) { s += e.prob / 100 / capturaBase(n); c++; }
      }
    }
    return c >= 6 ? Math.min(1.6, Math.max(0.4, s / c)) : 1;
  }
  const probCaptura = (n, visto, escala) => visto && visto.prob ? Math.min(0.99, visto.prob / 100) : Math.min(0.95, Math.max(0.1, capturaBase(n) * escala));
  // niveles de lo que sale en la zona hoy (con la marea alta +1 y con el sol de la sequía +3)
  const nivelesZona = (z, ef) => { const m = (ef.alta ? 1 : 0) + (ef.arde === z.id ? 3 : 0); return [...new Set([z.nivel[0] + m, z.nivel[1] + m])]; };
  // ¿se puede cambiar el equipo desde aquí? (se mira una vez cada 10 s: buscar la función de la página cuesta algo)
  let ordenable = { t: 0, v: false };
  const sePuedeOrdenar = () => { if (Date.now() - ordenable.t > 10000) ordenable = { t: Date.now(), v: !!guardarEquipoFn() }; return ordenable.v; };
  /* Los 3 que pelean: de todo lo que tienes (equipo y caja) los mejores contra lo que sale en la zona, simulando el combate (ver SIMULADOR
   * DEL JEFE). Pelean los tres primeros y la experiencia es para los seis del equipo, así que los otros tres huecos son para los que van a
   * evolucionar. Devuelve el mejor trío con su probabilidad de ganar y la del trío que pelea ahora. */
  const memoTrio = new Map();
  function trioDeZona(est, zt, niv, ef) {
    const actual = est.equipo.slice(0, 3);
    if (!actual.length || actual.some(p => !baseEsp[p.speciesId])) return null;
    const pool = [...est.equipo, ...est.caja].filter(p => baseEsp[p.speciesId]);
    const k = `${pool.map(p => p.id + ':' + p.nivel).sort().join()}|${actual.map(p => p.id).join()}|${zt.id}|${niv.join('-')}|${ef.enjambre || ''}${ef.baja ? 'b' : ''}`;
    if (memoTrio.has(k)) return memoTrio.get(k);
    // lo que sale (hasta el 85 % de los pesos) y a qué niveles
    for (const [n] of zt.sp) if (!baseEsp[n]) pedirTipos(n);          // (una especie que no venga con el script se pide a PokéAPI)
    const pes = pesosZona(zt, ef).filter(([n]) => baseEsp[n]).sort((a, b) => b[1] - a[1]);
    if (!pes.length) return null;
    const tot = pes.reduce((a, x) => a + x[1], 0), sel = [];
    let cum = 0;
    for (const x of pes) { sel.push(x); cum += x[1]; if (cum >= 0.85 * tot) break; }
    const rivs = sel.flatMap(([n, w]) => niv.map(L => ({ w: w / niv.length, L, r: luchador(baseEsp[n], L, tiposEsp[n] || []) })));
    const lu = new Map(pool.map(p => [p.id, luchador(baseEsp[p.speciesId], p.nivel, tiposDe(p))]));
    const prueba = (ps, n) => {
      const t = ps.map(p => lu.get(p.id));
      let a = 0, b = 0;
      for (const x of rivs) { a += x.w * simulaTrio(t, [x.r], n).p; b += x.w; }
      return b ? a / b : 0;
    };
    const fuerteDelante = ps => [...ps].sort((a, b) => b.nivel - a.nivel);
    // a primera vista: los más prometedores contra lo más frecuente, y siempre los que ya pelean
    const rapidos = rivs.slice(0, 6).map(x => ({ nivel: x.L, tipos: x.r.tipos }));
    const cand = [...new Map([...pool.map(p => ({ p, v: notaContraJefe(p, rapidos) })).sort((a, b) => b.v - a.v).slice(0, 6).map(x => [x.p.id, x.p]), ...actual.map(p => [p.id, p])]).values()];
    const m = Math.min(3, cand.length), combos = [];
    for (let i = 0; i < cand.length; i++) {
      if (m === 1) { combos.push([cand[i]]); continue; }
      for (let j = i + 1; j < cand.length; j++) {
        if (m === 2) { combos.push([cand[i], cand[j]]); continue; }
        for (let l = j + 1; l < cand.length; l++) combos.push([cand[i], cand[j], cand[l]]);
      }
    }
    const probados = combos.map(c => { const t = fuerteDelante(c); return { trio: t, p: prueba(t, 3) }; }).sort((a, b) => b.p - a.p).slice(0, 3).map(x => ({ trio: x.trio, p: prueba(x.trio, 14) })).sort((a, b) => b.p - a.p);
    const r = { trio: probados[0].trio, p: probados[0].p, pActual: prueba(actual, 14) };
    if (memoTrio.size > 60) memoTrio.clear();
    memoTrio.set(k, r);
    return r;
  }
  // El equipo para explorar esa zona: los 3 mejores delante (si mejoran de verdad al trío de ahora; si no, los de ahora) y detrás
  // los que van a evolucionar. null si no se sabe.
  function equipoParaZona(est, zonaId) {
    const T = tablaIsla(est), zt = T && T.zonas[zonaId], z = est.zonas.find(x => x.id === zonaId), A = analizar(est);
    if (!zt || !z) return equipoPropuesto(est, A);
    const ef = efectoDeHoy(est, T), tz = sePuedeOrdenar() ? trioDeZona(est, zt, nivelesZona(z, ef), ef) : null;
    const luchan = tz && tz.p >= tz.pActual + 0.05 ? tz.trio : est.equipo.slice(0, 3);
    return equipoPropuesto(est, A, luchan);
  }
  // Lo que se ha visto de verdad esta semana: resultado de cada combate y niveles que subió el equipo con cada victoria
  const LS_HIST = 'axi-hist', MODELO_V = 2;      // MODELO_V: versión del simulador de combate con el que se hicieron las previsiones apuntadas
  let histVer = 0;          // sube con cada combate apuntado (para no recalcular lo aprendido de más)
  function histGet(est) { const t = lsGet(LS_HIST, {}); return t[claveSemana(est)] || []; }
  function histPut(est, lista) {
    histVer++;
    const t = lsGet(LS_HIST, {}), k = claveSemana(est);
    t[k] = lista.slice(-300);
    for (const o of Object.keys(t)) if (o !== k && Object.keys(t).length > 3) delete t[o];
    lsPut(LS_HIST, t);
  }
  /* La simulación puede ser demasiado optimista o pesimista (el juego manda): se compara lo que decía antes de cada combate con cómo salió
   * (de todas las semanas guardadas) y se corrige con un desplazamiento en «probabilidad logística» igual para todas las zonas, con la
   * cautela de pocos datos (con 6 combates vale la mitad). Así lo aprendido en las zonas ya pisadas vale también para las que no. */
  const logit = x => Math.log(Math.min(0.98, Math.max(0.02, x)) / (1 - Math.min(0.98, Math.max(0.02, x))));
  const sigm = x => 1 / (1 + Math.exp(-x));
  let calibMemo = { k: -1, v: 0 };
  function desvioGana() {
    if (calibMemo.k === histVer) return calibMemo.v;
    const t = lsGet(LS_HIST, {}), todos = Object.values(t).flat().filter(x => typeof x.pr === 'number' && x.mv === MODELO_V && (x.r === 'g' || x.r === 'p' || x.r === 'e'));
    let d = 0;
    if (todos.length >= 3) {
      // regresión logística con un solo parámetro (el desplazamiento) y una cautela que lo ata a 0 mientras haya pocos datos:
      // las victorias que ya se esperaban (previsión del 98 %) casi no mueven nada; las sorpresas, sí
      const obs = todos.filter(x => x.r === 'g').length, L = todos.map(x => logit(x.pr));
      for (let i = 0; i < 40; i++) {
        const ps = L.map(l => sigm(l + d)), f = ps.reduce((a, q) => a + q, 0) - obs + d / 2.25, df = ps.reduce((a, q) => a + q * (1 - q), 0) + 1 / 2.25;
        if (Math.abs(f) < 1e-4) break;
        d = Math.max(-3, Math.min(4, d - f / df));
      }
    }
    calibMemo = { k: histVer, v: d };
    return d;
  }
  function dlMedio(est, zonaId) {
    const h = histGet(est).filter(x => (!zonaId || x.z === zonaId) && x.r === 'g' && typeof x.dl === 'number').slice(-8);
    return h.length >= 3 ? h.reduce((a, x) => a + x.dl, 0) / h.length : null;
  }
  // Cuánto sube el equipo con cada victoria: se mira el nivel (con su barra de progreso) de cada uno antes de explorar y después del combate
  let foto = null;
  const nivelesDe = est => { const o = {}; for (const p of est.equipo) o[p.id] = { v: p.nivel + (p.progreso || 0) / 100, t: !!p.topado }; return o; };
  function tomarFoto(est, zona) {
    let pr = null;
    try { const x = (puntuarZonas(est) || []).find(q => q.id === zona); pr = x && x.prior != null ? +x.prior.toFixed(3) : null; } catch { /* nada */ }
    foto = { zona, dia: est.dia, niv: nivelesDe(est), t: Date.now(), pr };
  }
  // En cuanto sale el resultado del combate (sea el modo automático o tú) se apunta cómo salió y cuánta experiencia dio (en las
  // victorias no hay botón «Seguir»: sale el encuentro debajo del resultado, así que se mira el texto)
  function vigilarResultado() {
    if (!foto) return;
    const txt = (document.querySelector('main') || {}).innerText || '';
    const res = /Te han ganado/.test(txt) ? 'p' : /Empate: nadie cae/.test(txt) ? 'e' : /¡Ganaste!/.test(txt) ? 'g' : null;
    if (!res) return;
    const m = txt.match(/\+\s*([\d.,]+)\s*de experiencia/i);
    cerrarFoto(res, m ? parseInt(m[1].replace(/[.,]/g, ''), 10) : null);
  }
  function cerrarFoto(res, exp) {
    const f = foto;
    foto = null;
    if (!f || Date.now() - f.t > 180000) return;
    setTimeout(() => {                                  // (el estado de la página tarda un momento en ponerse al día)
      try {
        const est = estadoIsla();
        if (!est) return;
        const ahora = nivelesDe(est);
        let suma = 0, cuantos = 0;
        for (const [id, a] of Object.entries(f.niv)) { const b = ahora[id]; if (b && !a.t) { suma += b.v - a.v; cuantos++; } }
        const h = histGet(est);
        h.push({ z: f.zona, d: f.dia, r: res, x: exp, dl: res === 'g' && cuantos ? +(suma / cuantos).toFixed(3) : null, pr: f.pr, mv: MODELO_V, t: Date.now() });
        histPut(est, h);
      } catch { /* nada */ }
    }, 1500);
  }
  // Lo que vale que TODO el equipo suba un nivel: lo que adelanta las evoluciones pendientes (10 por cada una, repartidos entre los
  // niveles que le faltan) y, según se acerca el jefe sin vencer, lo que sube la probabilidad de vencerlo (200 puntos) al llegar al
  // tope de la semana, repartido entre los niveles que faltan
  let sensMemo = { k: '', v: 0 };
  function valorJefePorNivel(est) {
    try {
      const J = est.jefe;
      if (!J || J.vencido || est.dia < 3) return 0;
      const riv = rivalesJefe(J), sim = riv && mejorTrio(est, riv);
      if (!sim) return 0;
      const topeMax = Math.max(...Object.values(topesSemana(est)));
      const k = sim.trio.map(p => p.id + ':' + p.nivel).join() + '|' + riv.map(r => r.n + ':' + r.nivel).join() + '|' + topeMax;
      if (sensMemo.k !== k) {
        const rivs = riv.map(r => luchador(baseEsp[r.n], r.nivel, r.tipos));
        const arriba = sim.trio.map(p => luchador(baseEsp[p.speciesId], Math.max(p.nivel, topeMax), tiposDe(p)));
        const media = sim.trio.reduce((a, p) => a + p.nivel, 0) / sim.trio.length;
        const pFin = simulaTrio(arriba, rivs, 300).p;
        sensMemo = { k, v: Math.max(0, pFin - sim.p) / Math.max(2, topeMax - media) };
      }
      const sube = sim.trio.filter(p => est.equipo.some(q => q.id === p.id) && !p.topado).length / sim.trio.length;     // los de la caja y los topados no ganan nivel hoy
      return VALOR_JEFE * sensMemo.v * sube * Math.min(1, (est.dia - 2) / 4);
    } catch { return 0; }
  }
  function valorNivel(est, A) {
    let v = 0;
    for (const p of est.equipo) {
      if (p.topado) continue;
      const info = A.porPokemon[p.id], c = info && info.nuevas.find(x => x.alcanzable);
      if (c) v += 10 / Math.max(1, c.nivel - p.nivel);
    }
    return v + valorJefePorNivel(est);
  }
  /* Lo que sube la probabilidad de vencer al jefe (200 puntos y sus premios) por cada exploración en una zona: lo que se captura allí
   * entra en la caja y puede ser lo que lo venza. Es lo que más pesa en los últimos días: lo que sale en la última zona (nivel 30-38)
   * es mucho más fuerte que un equipo que sube despacio, y con unos pocos de los de tipo bueno el jefe pasa de imposible a probable.
   * Se prueba con 8 tandas inventadas de 8 exploraciones (gana con la probabilidad de la zona, captura con la de cada especie, a su
   * nivel) mirando cuánto mejora el mejor trío contra el jefe. Las tandas salen siempre igual para el mismo caso (no hay ruido). */
  const memoChase = new Map();
  const hashStr = t => { let h = 0; for (let i = 0; i < t.length; i++) h = (Math.imul(h, 31) + t.charCodeAt(i)) | 0; return h; };
  function subeJefePorExploracion(est, z, zt, niv, ef, pGana, capt) {
    try {
      const J = est.jefe;
      if (!J || J.vencido || est.dia < 5 || niv[niv.length - 1] < 20) return 0;
      const riv = rivalesJefe(J), base = riv && mejorTrio(est, riv);
      if (!base || base.p >= 0.97) return 0;
      // solo cuentan los 12 mejores contra el jefe: capturar uno flojo no cambia nada y así no se recalcula en cada captura
      const mejores = [...est.equipo, ...est.caja].map(p => ({ p, v: notaContraJefe(p, riv) })).sort((a, b) => b.v - a.v).slice(0, 12).map(x => x.p.id + ':' + x.p.nivel).sort().join();
      const k = `${hashStr(mejores)}|${base.p.toFixed(2)}|${z.id}|${niv.join('-')}|${ef.enjambre || ''}${ef.baja ? 'b' : ''}|${Math.round(pGana * 20)}|${J.nombre}`;
      if (memoChase.has(k)) return memoChase.get(k);
      let semilla = hashStr(k);
      const rnd = () => { semilla = (semilla + 0x6D2B79F5) | 0; let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
      const pes = pesosZona(zt, ef), tot = pes.reduce((a, x) => a + x[1], 0), M = 8, K = 8;
      let suma = 0;
      for (let r = 0; r < K; r++) {
        const nuevos = [];
        for (let i = 0; i < M; i++) {
          if (rnd() > pGana) continue;
          let x = rnd() * tot, sp = pes[0][0];
          for (const [n, w] of pes) { x -= w; if (x <= 0) { sp = n; break; } }
          if (!ESP[sp] || rnd() > (capt[sp] ?? 0.4)) continue;
          const nivel = niv[0] + Math.floor(rnd() * (niv[niv.length - 1] - niv[0] + 1));
          nuevos.push({ id: 'v' + r + '_' + i, speciesId: sp, nombre: nombreEsp(sp), nivel: Math.min(nivel, est.topeNivel), tipo1: ESP[sp][8], tipo2: ESP[sp][9], topado: false });
        }
        if (!nuevos.length) { suma += base.p; continue; }
        const sim = mejorTrio({ ...est, caja: [...est.caja, ...nuevos] }, riv, true);
        suma += sim ? Math.max(sim.p, base.p) : base.p;
      }
      const v = Math.max(0, suma / K - base.p) / M;
      if (memoChase.size > 40) memoChase.clear();
      memoChase.set(k, v);
      return v;
    } catch (e) { console.warn('[axi] jefe por exploración', e); return 0; }
  }
  const memoZonas = new Map();
  /* Puntos esperados por exploración de cada zona abierta. `op.efecto` prueba otro estado (p. ej. la marea baja) y `op.sinBonus` quita
   * el premio de la zona difícil. Devuelve null si no se conoce la isla (entonces vale zonaElegidaPorVisto). */
  function puntuarZonas(est, op = {}) {
    const T = tablaIsla(est);
    if (!T || !Array.isArray(est.zonas) || !Array.isArray(est.equipo) || !Array.isArray(est.caja)) return null;
    const ef = op.efecto || efectoDeHoy(est, T);
    const k = [claveSemana(est), est.dia, est.exploraciones, est.capturadas, est.puntos, est.jefe && est.jefe.vencido, est.equipo.map(p => `${p.id}:${p.nivel}:${p.topado ? 1 : 0}`).join(), est.zonas.map(z => +!!z.abierta).join(''), (est.zonasVisitadas || []).length, ef.texto, ef.alta, ef.baja, ef.enjambre, ef.arde, op.sinBonus ? 1 : 0, est.caja.length, histGet(est).length, desvioGana().toFixed(2)].join('|');
    if (memoZonas.has(k)) return memoZonas.get(k);
    const A = analizar(est), fz = fauna(est), tengo = A.tengo, cuantos = {};
    for (const p of [...est.equipo, ...est.caja]) cuantos[p.speciesId] = (cuantos[p.speciesId] || 0) + 1;
    const puedeOrdenar = sePuedeOrdenar(), desvio = desvioGana(), escala = escalaCaptura(fz), nivelValor = valorNivel(est, A), dificil = op.sinBonus ? null : zonaDificilPendiente(est), lm = Math.max(5, fuerzaEquipo(est));
    const out = [];
    for (const z of est.zonas) {
      const zt = T.zonas[z.id];
      if (!z.abierta || !zt) continue;
      const arde = ef.arde === z.id, niv = nivelesZona(z, ef);
      const pes = pesosZona(zt, ef), tot = pes.reduce((a, x) => a + x[1], 0);
      const vistos = {};
      for (const [nm, e] of Object.entries(fz.zonas[z.id] || {})) vistos[normN(nm)] = e;
      let captura = 0, pNueva = 0;
      const nuevas = [], capt = {};
      for (const [n, w] of pes) {
        const pr = w / tot, pc = probCaptura(n, vistos[normN(nombreEsp(n))], escala);
        capt[n] = pc;
        captura += pr * pc * valorEspecie(n, tengo, cuantos, A.topeMax);
        if (!tengo.has(n)) { pNueva += pr * pc; nuevas.push({ n, p: pr, pc }); }
      }
      nuevas.sort((a, b) => b.p * b.pc - a.p * a.pc);
      const st = fz.stats[z.id] || { g: 0, p: 0 }, tz = trioDeZona(est, zt, niv, ef), prior = tz ? sigm(logit(puedeOrdenar ? tz.p : tz.pActual) + desvio) : null;
      const pGana = prior == null ? (st.g + 1) / (st.g + st.p + 2) : (st.g + 3 * prior) / (st.g + st.p + 3);     // el cálculo pesa como 3 combates vistos
      const lr = (niv[0] + niv[niv.length - 1]) / 2;
      const dl = dlMedio(est, z.id) ?? (Math.min(0.5, 3 * lr / (lm * lm)) * (arde ? 1.5 : 1));     // niveles que sube el equipo con cada victoria aquí
      const jefe = VALOR_JEFE * subeJefePorExploracion(est, z, zt, niv, ef, pGana, capt);          // (si ya no quedan opciones de vencerlo, 0)
      let evBase = pGana * (1 + captura) + dl * nivelValor * (pGana + 0.35 * (1 - pGana)) + jefe;     // (perdiendo también se gana experiencia: ≈ 1/3 de lo que da ganar)
      if (!Number.isFinite(evBase)) evBase = 0;                                          // (por si algún dato viniera mal: esa zona no gana)
      out.push({ id: z.id, nombre: z.nombre, icono: z.icono, niv, pGana, pNueva, captura, dl, xp: dl * nivelValor, jefe, nuevas, evBase, ev: evBase + (z.id === dificil ? 80 : 0), arde, prior, premio: z.id === dificil, trio: tz && (puedeOrdenar && tz.p >= tz.pActual + 0.05 ? tz.trio : est.equipo.slice(0, 3)).map(p => `${p.nombre} Nv.${p.nivel}`) });
    }
    if (memoZonas.size > 24) memoZonas.clear();
    memoZonas.set(k, out);
    return out;
  }
  // el viejo criterio, solo con lo visto en cada zona (si no se conocen las tablas de esta isla)
  function zonaElegidaPorVisto(est, ops) {
    const fz = fauna(est), dificil = zonaDificilPendiente(est);
    const nota = ({ z }) => {
      const vistos = fz.zonas[z.id] || {}, st = fz.stats[z.id] || { g: 0, p: 0 };
      const visitas = Object.values(vistos).reduce((a, e) => a + e.n, 0);
      const pGana = (st.g + 1) / (st.g + st.p + 2);
      let nuevo = 0;
      for (const [n, e] of Object.entries(vistos)) if (!tengoNombre(est, n)) nuevo += (e.n / Math.max(1, visitas)) * ((e.prob || 50) / 100);
      const ev = pGana * (1 + 10 * Math.min(1, nuevo));
      const desconocido = 6 / (1 + visitas / 3);                       // lo que aún puede salir y no se ha visto
      const sinConocer = Math.max(0, 4 - visitas) * 12;
      return ev + desconocido + sinConocer + (z.id === dificil ? 80 : 0);
    };
    return ops.sort((a, b) => nota(b) - nota(a))[0];
  }
  function zonaElegida(est) {
    const ops = botonesZona(est).filter(o => !o.b.disabled);
    if (!ops.length) return null;
    let P = null;
    try { P = puntuarZonas(est); } catch (e) { console.warn('[axi] puntuar zonas', e); }
    if (P && P.length) {
      const mejor = P.filter(x => ops.some(o => o.z.id === x.id)).sort((a, b) => b.ev - a.ev)[0];
      if (mejor) return ops.find(o => o.z.id === mejor.id);
    }
    return zonaElegidaPorVisto(est, ops);
  }
  /* Compañero de la semana (empieza en nivel 5 y es el primero del equipo): vale 10 por él y 10 por cada evolución por nivel que le dé
   * tiempo a hacer con los topes de cada día (algo menos cuanto más tarde), y un poco por lo fuertes que son sus estadísticas. Las
   * elecciones de siempre para cada isla ganan los empates. */
  const COMPANERO_POR_ISLA = { selva: 290, brasa: 240, coral: 341, tormenta: 179, sombra: 261 };
  function valorCompanero(est, c) {
    const diaPara = n => { for (let d = 1; d <= (est.dias || 7); d++) if ((TOPES_DIA[d - 1] || 99) >= n) return d; return null; };
    let v = 10;
    const sube = (id, visto = new Set([id])) => {
      for (const e of evos[id] || []) {
        if (visto.has(e.a) || e.a > DEX_MAX) continue;
        visto.add(e.a);
        const d = diaPara(e.nivel);
        if (d) v += 10 * (1 - 0.1 * (d - 1));
        sube(e.a, visto);
      }
    };
    sube(c.id);
    const bst = ESP[c.id] ? ESP[c.id].slice(2, 8).reduce((a, b) => a + b, 0) : 300;
    return v + (bst - 300) / 40 + (c.id === COMPANERO_POR_ISLA[est.isla && est.isla.id] ? 6 : 0);
  }
  function elegirCompanero(est) {
    const op = (est.companeros || []).filter(c => c && c.nombre);
    return op.length ? op.map(c => ({ c, v: valorCompanero(est, c) })).sort((a, b) => b.v - a.v)[0].c : null;
  }
  function fuerzaEquipo(est) { const tres = est.equipo.slice(0, 3); return tres.length ? tres.reduce((a, p) => a + p.nivel, 0) / tres.length : 0; }
  /* ------------------------------------------------------------------ *
   *  JEFE: pelean los 3 primeros, así que antes de luchar se ponen delante los 3 mejores contra él (nivel y tipos:
   *  lo que le pega fuerte y lo que aguanta sus golpes). Los tipos del jefe y su escolta salen de PokéAPI (por el nº
   *  del sprite) y se guardan. Después el equipo vuelve al orden de evolucionar.
   * ------------------------------------------------------------------ */
  const sinTilde = t => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const TABLA = (() => {
    const t = {}, pon = (a, x, ds) => { for (const d of ds.split(' ')) (t[a] || (t[a] = {}))[d] = x; };
    const fila = (a, dos, medio, cero) => { if (dos) pon(a, 2, dos); if (medio) pon(a, 0.5, medio); if (cero) pon(a, 0, cero); };
    fila('normal', '', 'roca acero', 'fantasma');
    fila('fuego', 'planta hielo bicho acero', 'fuego agua roca dragon');
    fila('agua', 'fuego tierra roca', 'agua planta dragon');
    fila('planta', 'agua tierra roca', 'fuego planta veneno volador bicho dragon acero');
    fila('electrico', 'agua volador', 'electrico planta dragon', 'tierra');
    fila('hielo', 'planta tierra volador dragon', 'fuego agua hielo acero');
    fila('lucha', 'normal hielo roca siniestro acero', 'veneno volador psiquico bicho hada', 'fantasma');
    fila('veneno', 'planta hada', 'veneno tierra roca fantasma', 'acero');
    fila('tierra', 'fuego electrico veneno roca acero', 'planta bicho', 'volador');
    fila('volador', 'planta lucha bicho', 'electrico roca acero');
    fila('psiquico', 'lucha veneno', 'psiquico acero', 'siniestro');
    fila('bicho', 'planta psiquico siniestro', 'fuego lucha veneno volador fantasma acero hada');
    fila('roca', 'fuego hielo volador bicho', 'lucha tierra acero');
    fila('fantasma', 'psiquico fantasma', 'siniestro', 'normal');
    fila('dragon', 'dragon', 'acero', 'hada');
    fila('siniestro', 'psiquico fantasma', 'lucha siniestro hada');
    fila('acero', 'hielo roca hada', 'fuego agua electrico acero');
    fila('hada', 'lucha dragon siniestro', 'fuego veneno acero');
    return t;
  })();
  const EN_ES = { normal: 'normal', fire: 'fuego', water: 'agua', grass: 'planta', electric: 'electrico', ice: 'hielo', fighting: 'lucha', poison: 'veneno', ground: 'tierra', flying: 'volador', psychic: 'psiquico', bug: 'bicho', rock: 'roca', ghost: 'fantasma', dragon: 'dragon', dark: 'siniestro', steel: 'acero', fairy: 'hada' };
  const eficacia = (atk, defs) => defs.reduce((m, d) => m * ((TABLA[atk] || {})[d] ?? 1), 1);
  const tiposDe = p => [p.tipo1, p.tipo2].filter(Boolean).map(sinTilde);
  const LS_TIPOS = 'axi-tipos';
  const tiposEsp = lsGet(LS_TIPOS, {});     // { nº: ['agua', 'hielo'] } · [] = no se pudo saber
  const pidiendoTipos = new Set();
  const LS_BASE = 'axi-base';
  const baseEsp = lsGet(LS_BASE, {});       // { nº: [ps, ataque, defensa, ataque esp., defensa esp., velocidad] } · de PokéAPI
  const fallosBase = {};                    // nº → cuándo falló la última vez (no se vuelve a pedir en 5 min)
  // los tipos y estadísticas de las especies de la isla ya vienen con el script: no hace falta esperar a PokéAPI para el jefe
  for (const n of Object.keys(ESP)) {
    if (!tiposEsp[n] || !tiposEsp[n].length) tiposEsp[n] = [ESP[n][8], ESP[n][9]].filter(Boolean);
    if (!baseEsp[n]) baseEsp[n] = ESP[n].slice(2, 8);
  }
  async function pedirTipos(n) {
    if ((tiposEsp[n] && baseEsp[n]) || pidiendoTipos.has(n) || Date.now() - (fallosBase[n] || 0) < 300000) return;
    pidiendoTipos.add(n);
    try {
      const d = await pedirJSON('https://pokeapi.co/api/v2/pokemon/' + n + '/');
      tiposEsp[n] = d.types.map(t => EN_ES[t.type.name]).filter(Boolean);
      const g = k => ((d.stats || []).find(x => x.stat.name === k) || {}).base_stat || 50;
      baseEsp[n] = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'].map(g);
    }
    catch (e) { console.warn('[axi] tipos de', n, e); fallosBase[n] = Date.now(); if (!tiposEsp[n]) tiposEsp[n] = []; }
    finally { pidiendoTipos.delete(n); }
    lsPut(LS_TIPOS, Object.assign(lsGet(LS_TIPOS, {}), tiposEsp));
    lsPut(LS_BASE, Object.assign(lsGet(LS_BASE, {}), baseEsp));
  }
  // null mientras falten los tipos de alguno (se piden y se espera al siguiente repaso)
  function rivalesJefe(J) {
    const out = (J.equipo || []).map(x => { const n = +((String(x.sprite || '').match(/(\d+)\.png/) || [])[1]); return { ...x, n, tipos: n ? tiposEsp[n] : [] }; });
    out.forEach(x => { if (x.n && !baseEsp[x.n]) pedirTipos(x.n); });       // (las estadísticas son para el simulador; si no llegan, se sigue sin él)
    const faltan = out.filter(x => x.n && !x.tipos);
    faltan.forEach(x => pedirTipos(x.n));
    return faltan.length ? null : out;
  }
  // Cuánto aguanta y pega un Pokémon contra el equipo del jefe, en «veces que le gana» (log2 de la razón de poder). Las
  // estadísticas crecen con el nivel, así que lo que pega por turno va como el nivel y lo que aguanta también: la razón de
  // poder es (nivel mío / nivel suyo)² × (lo que le pegan mis tipos) / (lo que me pegan los suyos). Un tipo que pega al
  // doble vale como unos 20 niveles a estas alturas, no 3. 0 = igualados; +1 = el doble de poder; −2 = la cuarta parte.
  function notaContraJefe(p, riv) {
    const mios = tiposDe(p), L = Math.max(1, p.nivel);
    const rs = (riv || []).filter(r => r.nivel);
    if (!rs.length || !mios.length) return Math.log2(L) - 5;
    let suma = 0, peso = 0;
    rs.forEach((r, i) => {
      const w = i === rs.length - 1 ? 2 : 1;                          // el último (el jefe de verdad) pesa doble
      const out = r.tipos.length ? Math.max(...mios.map(t => eficacia(t, r.tipos))) : 1;
      const inn = r.tipos.length ? Math.max(...r.tipos.map(t => eficacia(t, mios))) : 1;
      suma += w * (2 * Math.log2(L / r.nivel) + Math.log2(Math.max(0.25, out)) - Math.log2(Math.max(0.25, inn)));
      peso += w;
    });
    return suma / peso;
  }
  /* ------------------------------------------------------------------ *
   *  SIMULADOR DEL JEFE. El combate del juego (el mismo que en la Torre): estadísticas por nivel y especie, daño
   *  ((2·N/5+2)·30,5·A/D/50+2) × 1,5 si es de su tipo × (1,65 por cada tipo débil, 0,6 por cada tipo que resiste), críticos,
   *  pega primero el más rápido, y cuando uno cae entra el siguiente (pelean los tres primeros de cada lado). Con eso se
   *  prueban todos los tríos y órdenes posibles de tu equipo y caja contra el equipo del jefe y se elige el que más veces gana.
   * ------------------------------------------------------------------ */
  const efJ = (t, tipos) => { let m = 1; for (const x of tipos) { const v = (TABLA[t] || {})[x] ?? 1; m *= v === 0 ? 0 : v > 1 ? 1.65 : v < 1 ? 0.6 : 1; } return m; };
  function luchador(base, nivel, tipos) {
    const L = nivel, st = x => Math.floor(2 * x * L / 100) + 5;
    return { L, tipos, hp: Math.floor(3 * base[0] * L / 100) + L + 14, atk: st(base[1]), def: st(base[2]), esp: st(Math.round((base[3] + base[4]) / 2)), spe: st(base[5]), fis: base[1] >= base[3] };
  }
  function ataqueDe(a, b) {
    let m = null;
    for (const t of a.tipos) { const e = efJ(t, b.tipos); if (!m || e > m.e) m = { t, e, propio: true }; }
    if (!m) return { t: 'normal', e: efJ('normal', b.tipos), propio: false };
    if (m.e < 1) { const en = efJ('normal', b.tipos); if (en > m.e) return { t: 'normal', e: en, propio: a.tipos.includes('normal') }; }
    return m;
  }
  function golpeDe(a, b) {
    const at = ataqueDe(a, b);
    if (at.e === 0) return b.hp / 16;                                   // si no le afecta nada, Forcejeo
    const fis = !at.propio || a.fis, A = fis ? a.atk : a.esp, D = fis ? b.def : b.esp;
    return ((2 * a.L / 5 + 2) * 30.5 * A / D / 50 + 2) * (at.propio ? 1.5 : 1) * at.e;
  }
  const golpesMemo = new WeakMap();
  function golpeMemo(a, b) { let m = golpesMemo.get(a); if (!m) golpesMemo.set(a, (m = new WeakMap())); let v = m.get(b); if (v === undefined) m.set(b, (v = golpeDe(a, b))); return v; }
  // veces que gana el trío `mios` al equipo `rivs` (listas de luchadores) en `n` combates con críticos y variación de daño
  // Lo que pegan de verdad frente al modelo (117 golpes de 8 combates reales de la isla, sin contar críticos): de media los tuyos
  // el 85 % y los suyos el 115 % del daño que da la fórmula (los suyos usan movimientos de más potencia), y cada golpe varía ±35 %
  // (un 20 % de desviación) según el movimiento que toque. Eso hace los combates menos seguros de lo que decía el modelo viejo.
  const ESC_GOLPE = { mio: 0.85, suyo: 1.15 };
  function simulaTrio(mios, rivs, n = 60) {
    let gana = 0, margen = 0;
    for (let k = 0; k < n; k++) {
      const A = mios.map(x => ({ x, v: x.hp })), B = rivs.map(x => ({ x, v: x.hp }));
      let i = 0, j = 0;
      for (let t = 0; t < 500 && i < A.length && j < B.length; t++) {
        const a = A[i], b = B[j];
        const aPrimero = a.x.spe > b.x.spe || (a.x.spe === b.x.spe && Math.random() < 0.5);
        for (const [at, df] of aPrimero ? [[a, b], [b, a]] : [[b, a], [a, b]]) {
          if (at.v <= 0 || df.v <= 0) continue;
          df.v -= golpeMemo(at.x, df.x) * (at === a ? ESC_GOLPE.mio : ESC_GOLPE.suyo) * (0.65 + Math.random() * 0.7) * (Math.random() < 0.09 ? 1.64 : 1);
        }
        if (a.v <= 0) i++;
        if (b.v <= 0) j++;
      }
      if (j >= B.length) gana++;
      margen += A.reduce((s2, q) => s2 + Math.max(0, q.v) / q.x.hp, 0) / A.length - B.reduce((s2, q) => s2 + Math.max(0, q.v) / q.x.hp, 0) / B.length;
    }
    return { p: gana / n, margen: margen / n };
  }
  // El mejor trío (y su orden) de todo lo que tienes. null si aún faltan datos de PokéAPI de alguno (se piden)
  let jefeMemo = { k: '', r: null };
  function mejorTrio(est, riv, sinMemoria) {
    const todos = [...est.equipo, ...est.caja];
    const rivs = riv.filter(r => r.n && baseEsp[r.n] && r.tipos).map(r => luchador(baseEsp[r.n], r.nivel, r.tipos));
    if (!rivs.length || rivs.length < riv.length) return null;
    // los candidatos con más posibilidades (por la nota rápida), con sus datos pedidos
    const cand = todos.map(p => ({ p, v: notaContraJefe(p, riv) })).sort((a, b) => b.v - a.v).slice(0, 9).map(x => x.p);
    for (const p of cand) if (!baseEsp[p.speciesId]) pedirTipos(p.speciesId);
    const listos = cand.filter(p => baseEsp[p.speciesId]);
    if (listos.length < Math.min(3, cand.length)) return null;
    const k = listos.map(p => p.id + ':' + p.nivel).join() + '|' + riv.map(r => r.n + ':' + r.nivel).join();
    if (!sinMemoria && jefeMemo.k === k) return jefeMemo.r;
    const lu = new Map(listos.map(p => [p.id, luchador(baseEsp[p.speciesId], p.nivel, tiposDe(p))]));
    let mejores = [];
    // todos los órdenes posibles de 3 (o de los que haya, si tienes menos de 3)
    const m = Math.min(3, listos.length), selecciones = [];
    for (const a of listos) {
      if (m === 1) { selecciones.push([a]); continue; }
      for (const b of listos) {
        if (a === b) continue;
        if (m === 2) { selecciones.push([a, b]); continue; }
        for (const c of listos) if (a !== c && b !== c) selecciones.push([a, b, c]);
      }
    }
    for (const sel of selecciones) mejores.push({ trio: sel, ...simulaTrio(sel.map(x => lu.get(x.id)), rivs, 40) });
    if (!mejores.length) return null;
    mejores.sort((x, y) => y.p - x.p || y.margen - x.margen);
    mejores = mejores.slice(0, 4).map(m => ({ ...m, ...simulaTrio(m.trio.map(p => lu.get(p.id)), rivs, 300) })).sort((x, y) => y.p - x.p || y.margen - x.margen);
    const r = { trio: mejores[0].trio, p: mejores[0].p, margen: mejores[0].margen };
    if (!sinMemoria) jefeMemo = { k, r };
    return r;
  }
  // los 3 que pelean contra el jefe (por simulación; si aún no hay datos, por la nota rápida), y detrás el resto del equipo
  // de evolucionar (6 como mucho)
  function equipoJefe(est, riv, sim = mejorTrio(est, riv)) {
    const todos = [...est.equipo, ...est.caja];
    const tres = sim ? sim.trio : todos.map(p => ({ p, v: notaContraJefe(p, riv) })).sort((a, b) => b.v - a.v || b.p.nivel - a.p.nivel).slice(0, 3).map(x => x.p);
    const resto = (equipoPropuesto(est, analizar(est)) || est.equipo).filter(p => !tres.some(t => t.id === p.id));
    return [...tres, ...resto].slice(0, Math.max(3, Math.min(6, est.equipo.length)));
  }
  // Un intento contra el jefe cuesta su coste de marea (3) y vale (200 puntos y sus premios) × la probabilidad de vencerlo; esa marea en exploraciones
  // valdría 3 × los puntos de una exploración (la mejor zona, sin contar el premio de la zona difícil, que se cobra una vez).
  // Se ataca cuando lo primero supera a lo segundo; con un suelo (1-3 %) por si la simulación se queda corta.
  function umbralJefe(est) {
    let ev = 4;
    try { const P = puntuarZonas(est, { sinBonus: true }); if (P && P.length) ev = Math.max(...P.map(x => x.evBase)); } catch { /* nada */ }
    const coste = (est.jefe && est.jefe.costeMarea) || 3;
    return Math.min(0.25, Math.max(est.dia >= est.dias ? 0.01 : 0.03, coste * ev / VALOR_JEFE));
  }
  /* ------------------------------------------------------------------ *
   *  CUÁNDO GASTAR LA MAREA. Con cada subida cambia el mar: con marea alta salen los grandes (un nivel por encima) y con
   *  marea baja «los raros salen el triple». Las especies que faltan son casi todas raras, así que lo mejor es gastar la
   *  marea con la baja y dejar pasar la alta, siempre que quepa la siguiente subida (el tope es de 45: pasado el tope se
   *  pierde) y que la isla no se hunda antes de poder gastarla. Se dice cuándo volver (lo lee el robot de Diarias).
   * ------------------------------------------------------------------ */
  const LS_PROXIMA = 'axi-proxima';
  function proximaVisita(est, que) {
    const t = est.siguienteMareaEn ? Date.parse(est.siguienteMareaEn) + 60e3 : null;
    lsPut(LS_PROXIMA, t ? { t, que, info: `${que} a las ${new Date(t).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`, hecho: Date.now() } : { t: 0, sinMas: true, que: 'no hay más subidas', info: 'no hay más subidas de marea', hecho: Date.now() });
  }
  function esperarMareaBaja(est) {
    const ef = efectoDeHoy(est);
    if (ef.regla !== 'mareas' || !ef.alta || ef.baja) return false;
    if (est.capturadas >= est.especiesIsla || !est.siguienteMareaEn) return false;
    if (est.marea + est.mareaPorSubida > est.mareaTope) return false;                       // la siguiente subida se perdería
    const sube = Date.parse(est.siguienteMareaEn) - Date.now();
    const fin = est.temporada && est.temporada.finEn ? Date.parse(est.temporada.finEn) - Date.now() : Infinity;
    if (fin < sube + 13 * 3600e3) return false;                                              // no daría tiempo a gastarla
    // ¿compensa de verdad? puntos esperados por exploración con la marea alta de ahora y con la baja de después
    try {
      const alta = puntuarZonas(est, { efecto: { ...ef, alta: true, baja: false }, sinBonus: true });
      const baja = puntuarZonas(est, { efecto: { ...ef, alta: false, baja: true }, sinBonus: true });
      if (alta && baja && alta.length && baja.length) return Math.max(...baja.map(x => x.evBase)) >= 1.1 * Math.max(...alta.map(x => x.evBase));
    } catch (e) { console.warn('[axi] marea', e); }
    return true;
  }
  async function pasoAuto() {
    if (autoPaso || !autoOn() || !enIsla()) return;
    const est = estadoIsla();
    if (!est) return;
    autoPaso = true;
    try {
      // combate en pantalla: al resultado
      const saltar = $$('button').find(b => /saltar al resultado/i.test(b.textContent || '') && !b.disabled);
      if (saltar) { saltar.click(); await espera(900); return; }
      const txtMain = (document.querySelector('main') || {}).innerText || '';
      // resultado del combate
      const seguir = botonTexto(/^Seguir$/);
      if (seguir) {
        const perdio = /Te han ganado|Empate: nadie cae/.test(txtMain);
        if (perdio) apuntarResultado(est, false);
        const evo = (txtMain.match(/✨ ¡[^!]+ ha evolucionado en [^!]+!/g) || []);
        for (const e of evo) alog(e);
        if (evo.length) reordenar = true;
        const premio = (txtMain.match(/Te llevas a tu cuenta: ([^.\n]+)/) || [])[1];
        if (premio) alog(`🎁 Te llevas a tu cuenta: ${premio.trim()}. Póntelos desde tu ficha.`);
        if (perdio) alog(`${/Empate/.test(txtMain) ? '🤝 Empate' : '💥 Derrota'} en ${(est.zonas.find(z => z.id === ssGet(SS_ZONA)) || {}).nombre || 'la zona'}.`);
        await espera(700); seguir.click(); await espera(900); return;
      }
      // ¿lo capturo?
      if (est.encuentro) {
        apuntarEncuentro(est);
        // se captura siempre (la captura es gratis): también los repetidos
        const en = est.encuentro;
        // si el juego no deja capturar (p. ej. la caja llena) y sigue el mismo bicho tras 3 clics, se deja ir para no insistir.
        // Solo cuentan los clics de verdad: si la página tarda (botones desactivados mientras procesa), se espera sin más
        const firma = `${en.nombre}|${en.nivel}|${est.exploraciones}`;
        if (firma !== intentosCaptura.firma) intentosCaptura = { firma, n: 0, avisado: false };
        const quiero = intentosCaptura.n < 3;
        const b = botonTexto(quiero ? /^Capturar$/ : /^Dejarlo ir$/);
        if (!b) return;
        if (!quiero && !intentosCaptura.avisado) { intentosCaptura.avisado = true; alog(`⚠️ No consigo capturar a ${en.nombre}: lo dejo ir.`); }
        await espera(700 + Math.random() * 600);
        b.click(); intentosCaptura.n++;
        if (quiero) alog(`🎯 ${en.nombre}${en.esShiny ? ' ✨' : ''} Nv.${en.nivel}${en.yaLaTienes ? ' (repetido)' : ''}: lo intento (${en.probabilidad}%).`);
        if (quiero) reordenar = true;
        await espera(1500);
        const tras = estadoIsla();
        const cuantos = e2 => [...e2.equipo, ...e2.caja].filter(p => p.nombre === en.nombre).length;
        if (quiero && tras && !tras.encuentro) alog(cuantos(tras) > cuantos(est) ? `✅ ¡${en.nombre} capturado!` : `💨 ${en.nombre} se ha escapado.`);
        return;
      }
      // compañero de la semana
      if (est.necesitaCompanero) {
        const nombre = (elegirCompanero(est) || est.companeros[0] || {}).nombre;
        const b = nombre && $$('main button').find(x => (x.textContent || '').trim().startsWith(nombre));
        if (b) { alog(`🤝 Elijo a ${nombre} de compañero.`); b.click(); await espera(2500); }
        return;
      }
      // jefe: cuando está, queda marea y el equipo llega (media de los 3 mejores contra él a 3 niveles o menos del
      // jefe; 2 intentos al día). Primero se ponen delante esos 3 y luego se lucha.
      const J = est.jefe;
      const intentosHoy = lsGet('axi-jefe-hoy', {}), hoyK = new Date().toLocaleDateString('sv');
      // vencerlo da 200 puntos (más que 20 especies nuevas) y cada intento solo cuesta marea (3): no hay tope de intentos al día
      // salvo uno de cordura (6, y 12 el último día) por si el equipo no da la talla; cada intento que se pierde da experiencia
      if (J && J.vencido && lsGet('axi-jefe-ok', '') !== claveSemana(est)) {
        lsPut('axi-jefe-ok', claveSemana(est));
        alog(`🏆 ¡${J.nombre.split(',')[0]} vencido! +200 puntos.`);
        kAviso({ tipo: 'legendario', app: 'Isla Espejismo', icono: '👑', titulo: '¡Jefe vencido!', lineas: [J.nombre, 'ya cuentan sus 200 puntos en el ranking'] });
      }
      if (J && J.abierto && !J.vencido && est.marea >= (J.costeMarea || 3) && (intentosHoy[hoyK] || 0) < (est.dia >= est.dias ? 12 : 6) && est.equipo.length) {
        const riv = rivalesJefe(J);
        if (!riv) return;       // esperando a saber sus tipos
        const sim = mejorTrio(est, riv);
        if (!sim) {
          // faltan datos de PokéAPI (estadísticas): se piden y se espera un poco; si no llegan, se sigue con la nota rápida
          if (!esperaJefe) esperaJefe = Date.now();
          if (Date.now() - esperaJefe < 25000) return;
        } else esperaJefe = 0;
        const prop = equipoJefe(est, riv, sim), tres = prop.slice(0, 3);
        // probabilidad de vencerlo con el mejor trío (simulando el combate del juego, ver MEJOR TRÍO): se ataca si hay
        // posibilidades (≥ 5 %: vencerlo vale 200 puntos y un intento solo cuesta 3 de marea); si no, se sube de nivel
        // explorando (cada exploración da experiencia a todo el equipo). Con los tres al tope del día (no pueden subir más
        // hoy) o el último día, se intenta igual.
        const poder = tres.reduce((a, p) => a + notaContraJefe(p, riv), 0) / tres.length;
        const pGana = sim ? sim.p : null;
        if (pGana != null ? pGana >= umbralJefe(est) : poder >= -2 || tres.every(p => p.nivel >= est.topeNivel) || est.dia >= est.dias) {
          if (prop.map(p => p.id).join() !== est.equipo.map(p => p.id).join()) {
            const fn = guardarEquipoFn();
            if (fn && Date.now() - ultimoOrden > 5000) {
              ultimoOrden = Date.now();
              fn(prop.map(p => p.id), 'Equipo listo para el jefe.');
              alog(`🔀 Contra el jefe pelean: ${tres.map(p => `${p.nombre} Nv.${p.nivel}`).join(', ')} (${pGana != null ? `probabilidad de ganar ≈ ${Math.round(pGana * 100)} %` : `poder ${poder >= 0 ? '+' : ''}${poder.toFixed(1)}`}).`);
              await espera(2500); return;
            }
            if (fn) return;
          }
          const b = botonTexto(/^Luchar\s*·/);
          if (b) {
            intentosHoy[hoyK] = (intentosHoy[hoyK] || 0) + 1; lsPut('axi-jefe-hoy', { [hoyK]: intentosHoy[hoyK] }); ssPut(SS_ZONA, 'jefe');
            alog(`👑 Contra el jefe (${J.nombre.split(',')[0]}, intento ${intentosHoy[hoyK]} de hoy).`);
            reordenar = true; ultimoOrden = 0;      // luego, al orden de evolucionar
            b.click(); await espera(2500); return;
          }
        }
      }
      // explorar
      if (est.marea < est.costeExplorar) {
        const sig = est.siguienteMareaEn ? Math.max(0, Math.round((Date.parse(est.siguienteMareaEn) - Date.now()) / 60000)) : null;
        alog(`🌊 Marea gastada (${est.marea}/${est.mareaTope}). Sube +${est.mareaPorSubida}${sig != null ? ` en ${sig} min` : ''}. Especies: ${est.capturadas}/${est.especiesIsla} · ${est.puntos} pts.`);
        lsPut(LS_AUTO_ULT, { t: Date.now(), log: autoLog.slice(-15) });
        proximaVisita(est, 'nueva marea');
        ssPut(SS_AUTO, null); pintarAuto();
        kAviso({ tipo: 'fin', app: 'Isla Espejismo', icono: '🏝️', titulo: 'Marea gastada', lineas: [`${est.capturadas}/${est.especiesIsla} especies · ${est.puntos} pts`] });
        return;
      }
      if (ssGet(SS_AUTO + '-robot') === '1' && esperarMareaBaja(est)) {      // (solo con el robot de Diarias: si pulsas tú «Jugar», juega)
        alog(`⏳ Marea alta: con la baja (los raros salen el triple y los rivales un nivel menos) se saca más. Guardo la marea (${est.marea}/${est.mareaTope}).`);
        lsPut(LS_AUTO_ULT, { t: Date.now(), log: autoLog.slice(-15) });
        proximaVisita(est, 'volver con la marea baja');
        ssPut(SS_AUTO, null); pintarAuto();
        return;
      }
      const z = zonaElegida(est);
      if (!z) return;
      // el equipo para esa zona: delante los 3 mejores contra ella (de todo lo que tienes, equipo y caja) y detrás los que van a
      // evolucionar a especies nuevas (los 6 se llevan la experiencia). Se cambia al capturar o evolucionar alguien, tras el jefe y
      // cuando otro trío mejora de verdad al de ahora.
      if (est.equipo.length && Date.now() - ultimoOrden > 12000 && fallosOrden < 3) {
        let prop = null;
        try { prop = equipoParaZona(est, z.z.id); } catch (e) { console.warn('[axi] equipo para la zona', e); }       // (si falla, se explora con el equipo que hay)
        const ahora = est.equipo.map(p => p.id), conjunto = ids => [...ids].sort().join(), pelean = ids => conjunto(ids.slice(0, 3));
        // solo se cambia si cambia QUIÉN pelea o QUIÉN está en el equipo (el orden entre los de atrás o entre los que pelean da igual);
        // y si sale el mismo trío del que se acaba de cambiar, es ruido de la simulación: no se vuelve a cambiar
        const ids = prop ? prop.map(p => p.id) : [];
        const vuelta = prop && pelean(ids) === trioAnterior.k && Date.now() - trioAnterior.t < 600000;
        // los cambios solo de los de atrás (otro candidato a evolucionar) no merecen un cambio de equipo cada captura: como mucho uno cada 6 exploraciones
        const soloFondo = prop && pelean(ids) === pelean(ahora) && conjunto(ids) !== conjunto(ahora);
        if (prop && !vuelta && (pelean(ids) !== pelean(ahora) || (soloFondo && est.exploraciones - explFondo >= 6))) {
          if (pelean(ids) !== pelean(ahora)) trioAnterior = { k: pelean(ahora), t: Date.now() };
          ultimoOrden = Date.now(); reordenar = false; explFondo = est.exploraciones;
          await ordenarEquipo(prop, 'Equipo listo para explorar.');
          alog(`🔀 Equipo para ${z.z.nombre}: pelean ${prop.slice(0, 3).map(p => `${p.nombre} Nv.${p.nivel}`).join(', ')}; detrás ${prop.slice(3).map(p => p.nombre).join(', ') || '—'}.`);
          await espera(2500);
          const tras = estadoIsla();
          if (tras && tras.equipo.map(p => p.id).join() !== prop.map(p => p.id).join() && ++fallosOrden >= 3) alog('⚠️ No consigo cambiar el equipo: sigo con el que hay.');
          return;
        }
        reordenar = false;
      }
      ssPut(SS_ZONA, z.z.id);
      await espera(600 + Math.random() * 700);
      if (!autoOn()) return;
      z.b.click();
      autoMsg = `🧭 Exploro ${z.z.nombre} (marea ${est.marea - est.costeExplorar}/${est.mareaTope}).`;
      pintarAuto();
      await espera(1500);
    } catch (e) { console.warn('[axi auto]', e); alog('⚠️ ' + (e && e.message)); }
    finally { autoPaso = false; }
  }
  function pintarAuto() {
    const est = enIsla() && estadoIsla();
    if (!est || !est.abierta) { const c = document.getElementById('axi-auto'); if (c) c.remove(); return; }
    const ancla = $$('main section').find(sc => $$('button', sc).some(b => /^\s*Explorar\s*·/.test(b.textContent || '')) || /Elige tu compa/i.test(sc.textContent || ''));
    if (!ancla) return;
    let c = document.getElementById('axi-auto');
    kStyle('axi-kit-auto', '#axi-auto', '#14B8A6');
    if (!c) {
      c = document.createElement('section'); c.id = 'axi-auto'; c.className = 'tarjeta space-y-2 p-3'; c.setAttribute('data-ax-ignore', '1');
      c.innerHTML = `${kHead('🏝️', 'Isla sola', '')}
        <button type="button" class="axi-go boton-principal w-full !py-2.5 text-sm"></button>
        <div class="axi-log ${K_LOG}"></div>
        <p class="axi-jefe text-[11px] font-bold leading-snug text-tinta-600" hidden></p>
        <p class="axi-plan text-[11px] font-bold leading-snug text-tinta-600" hidden></p>
        <details class="rounded-card border-2 border-crema-200 bg-crema-50 p-2"><summary class="cursor-pointer text-[11px] font-extrabold text-tinta-600">🗺️ Qué sale en cada zona</summary><div class="axi-fauna space-y-2 pt-2"></div></details>`;
      c.querySelector('.axi-go').addEventListener('click', e => { e.preventDefault(); if (autoOn()) { ssPut(SS_AUTO, null); alog('⏹ Parado.'); } else { ssPut(SS_AUTO, '1'); ssPut(SS_AUTO + '-robot', null); reordenar = true; kPedirPermiso(); alog('▶ En marcha.'); } pintarAuto(); });
    }
    if (c.nextElementSibling !== ancla) ancla.insertAdjacentElement('beforebegin', c);
    const b = c.querySelector('.axi-go'), t = autoOn() ? '■ Parar' : `▶ Jugar la isla sola (marea ${est.marea}/${est.mareaTope})`;
    if (b.textContent !== t) b.textContent = t;
    kSet(c.querySelector('.k-sub'), `Día ${est.dia}/${est.dias} · tope Nv.${est.topeNivel} · ${est.capturadas}/${est.especiesIsla} especies · ${est.puntos} pts`);
    kBadge(c.querySelector('.k-badge'), autoOn() ? 'on' : 'off', autoOn() ? 'JUGANDO' : 'LISTO');
    const lg = c.querySelector('.axi-log'), lineas = [...autoLog.slice(-8), ...(autoMsg && autoOn() ? [autoMsg] : [])];
    const firmaLog = lineas.join('\n');
    if (lg.dataset.f !== firmaLog) { lg.dataset.f = firmaLog; lg.innerHTML = lineas.map(l => `<p>${esc(l)}</p>`).join(''); lg.scrollTop = lg.scrollHeight; }
    // el jefe: qué probabilidad hay de vencerlo con tu mejor trío ahora (se simula el combate)
    const pj = c.querySelector('.axi-jefe');
    if (pj) {
      let t = '';
      try {
        if (est.jefe && !est.jefe.vencido) {
          const riv = rivalesJefe(est.jefe), sim = riv && mejorTrio(est, riv);
          t = sim ? `👑 ${est.jefe.nombre.split(',')[0]}: ahora lo vences ≈ ${Math.round(sim.p * 100)} % (mejor trío: ${sim.trio.map(p => `${p.nombre} Nv.${p.nivel}`).join(', ')}). Vencerlo da 200 puntos y premios.${est.jefe.abierto ? ` Lo intentará cuando pase del ${Math.round(umbralJefe(est) * 100)} %.` : ` Se abre el día ${est.jefe.desdeDia}.`}` : riv ? '👑 Calculando el combate contra el jefe…' : '';
        }
      } catch (e) { console.warn('[axi] jefe', e); }
      kSet(pj, t); pj.hidden = !t;
    }
    // el plan de hoy: lo que cambia (el efecto de la regla de la semana) y la mejor zona con sus probabilidades
    let P = [];
    try { P = puntuarZonas(est) || []; } catch (e) { console.warn('[axi] plan', e); }
    const pp = c.querySelector('.axi-plan');
    if (pp) {
      let t = '';
      if (P.length) {
        const hoy = textoEfecto(est, efectoDeHoy(est)), mejor = [...P].sort((a, b) => b.ev - a.ev)[0];
        t = `${hoy ? hoy + '. ' : ''}📊 Mejor zona ahora: ${mejor.icono} ${mejor.nombre}${mejor.premio ? ' (la primera vez da premio)' : ''}: sale una especie nueva y la captures el ${Math.round(mejor.pNueva * 100)} % de las veces y ganas ≈ ${Math.round(mejor.pGana * 100)} %.${mejor.trio ? ` Pelean: ${mejor.trio.join(', ')}.` : ''}`;
      }
      kSet(pp, t); pp.hidden = !t;
    }
    // fauna por zona
    const fz = fauna(est);
    const html = est.zonas.map(z => {
      const vistos = Object.entries(fz.zonas[z.id] || {}).sort((a, b) => b[1].n - a[1].n), st = fz.stats[z.id];
      const pz = P.find(x => x.id === z.id);
      const cab = `<p class="text-[11px] font-extrabold text-tinta-600">${esc(z.icono)} ${esc(z.nombre)} <span class="text-tinta-400">${z.abierta ? `· ${vistos.length} especies vistas${st ? ` · ${st.g}✔ ${st.p}✖` : ''}${pz ? ` · nuevas ${Math.round(pz.pNueva * 100)} %` : ''}` : `· se abre el día ${z.desdeDia}`}</span></p>`;
      const pct = x => { const v = x * 100; return (v < 10 ? v.toFixed(1).replace('.', ',') : Math.round(v)) + ' %'; };
      const faltan = pz && pz.nuevas.length ? `<p class="pt-1 text-[10px] font-extrabold text-tinta-500">Te faltan ${pz.nuevas.length} de las que salen aquí (qué tan a menudo salen):</p><div>${pz.nuevas.slice(0, 14).map(x => `<span title="${esc(bonitoEn(nombreEsp(x.n) || '#' + x.n))} · sale el ${pct(x.p)} de las veces · capturarla ≈ ${Math.round(x.pc * 100)} %" style="display:inline-flex;align-items:center;gap:2px;padding:1px 6px 1px 1px;margin:1px;border-radius:999px;font-size:10px;font-weight:800;opacity:.85;background:rgb(var(--lienzo));border:2px dashed rgb(var(--crema-200))"><img src="/sprites/${x.n}.png" alt="" style="width:22px;height:22px;image-rendering:pixelated">${esc(bonitoEn(nombreEsp(x.n) || '#' + x.n))} ${pct(x.p)}</span>`).join('')}</div>` : '';
      const chips = vistos.map(([n, e]) => `<span title="${esc(n)} · Nv.${e.min}${e.max !== e.min ? '–' + e.max : ''} · salió ${e.n} ${e.n === 1 ? 'vez' : 'veces'} · ${e.prob}%" style="display:inline-flex;align-items:center;gap:2px;padding:1px 6px 1px 1px;margin:1px;border-radius:999px;font-size:10px;font-weight:800;background:${tengoNombre(est, n) ? 'rgb(var(--hoja-50))' : 'rgb(var(--lienzo))'};border:2px solid ${tengoNombre(est, n) ? 'rgb(var(--hoja-200))' : 'rgb(var(--crema-200))'}"><img src="${esc(e.sprite)}" alt="" style="width:22px;height:22px;image-rendering:pixelated">${esc(n)}${e.shiny ? ' ✨' : ''}${tengoNombre(est, n) ? ' ✔' : ''}</span>`).join('');
      return cab + (z.abierta ? `<div>${chips || '<span class="text-[10px] text-tinta-400">Aún no has explorado aquí.</span>'}</div>${faltan}` : '');
    }).join('');
    // las que ya tienes en la isla y no están apuntadas en ninguna zona (de antes de que el script las viera)
    const apuntadas = new Set(Object.values(fz.zonas).flatMap(z => Object.keys(z)));
    const sinZona = [...new Map([...est.equipo, ...est.caja].map(p => [p.nombre, p])).values()].filter(p => !apuntadas.has(p.nombre));
    const htmlSin = sinZona.length ? `<p class="text-[11px] font-extrabold text-tinta-600">✔ Ya las tienes (sin zona apuntada) · ${sinZona.length}</p><div>${sinZona.map(p => `<span style="display:inline-flex;align-items:center;gap:2px;padding:1px 6px 1px 1px;margin:1px;border-radius:999px;font-size:10px;font-weight:800;background:rgb(var(--hoja-50));border:2px solid rgb(var(--hoja-200))"><img src="${esc(p.sprite)}" alt="" style="width:22px;height:22px;image-rendering:pixelated">${esc(p.nombre)}${p.esShiny ? ' ✨' : ''}</span>`).join('')}</div>` : '';
    // lo medido de verdad esta semana (con eso el cerebro corrige sus cálculos)
    const hh = histGet(est), dlm = dlMedio(est, null);
    const htmlMedido = hh.length ? `<p class="text-[10px] font-extrabold text-tinta-500">📈 Medido esta semana: ${hh.filter(x => x.r === 'g').length}✔ ${hh.filter(x => x.r !== 'g').length}✖${dlm != null ? ` · el equipo sube ≈ ${dlm.toFixed(2).replace('.', ',')} niveles por victoria` : ''}</p>` : '';
    const fa = c.querySelector('.axi-fauna');
    if (fa.dataset.h !== htmlMedido + html + htmlSin) { fa.dataset.h = htmlMedido + html + htmlSin; fa.innerHTML = htmlMedido + html + htmlSin; }
  }
  // /isla?auto=1: empieza solo (lo usa el bot)
  function autoDesdeEnlace() {
    const q = new URLSearchParams(location.search);
    if (!enIsla() || !q.has('auto')) return;
    history.replaceState(history.state, '', location.pathname);
    ssPut(SS_AUTO, '1'); reordenar = true;
  }
  setInterval(() => { if (!enIsla()) return; const est = estadoIsla(); if (est && est.encuentro) apuntarEncuentro(est); vigilarResultado(); pintarAuto(); pasoAuto(); }, 1500);
  setTimeout(autoDesdeEnlace, 1000);
  window.__axIsla = { ESC_GOLPE, desvioGana, estadoIsla, fauna, zonaElegida, analizar, puntuarZonas, efectoDeHoy, tablaIsla, leerTablasWeb, elegirCompanero, valorCompanero, umbralJefe, esperarMareaBaja, trioDeZona, equipoParaZona, nivelesZona, luchador, simulaTrio, baseEsp, tiposEsp, tiposDe, textoEfecto, histGet, dlMedio, rivalesJefe, mejorTrio, valorNivel, valorJefePorNivel, equipoPropuesto, ISLAS_RESPALDO, ESP, EVO_RESPALDO, tablasWeb: () => tablasWeb };

  let prog = null;
  function programar() {
    // lo que sale se apunta en cuanto aparece (sin esperar al repaso de cada 1,5 s: si capturabas rápido, se perdía)
    try { const est = enIsla() && estadoIsla(); if (est && est.encuentro) apuntarEncuentro(est); } catch { /* nada */ }
    clearTimeout(prog); prog = setTimeout(() => { try { pintar(); } catch (e) { console.warn('[axi]', e); } }, 300);
  }
  new MutationObserver(muts => {
    if (!enIsla() && !document.getElementById('axi-panel')) return;
    if (muts.every(m => (m.target.nodeType === 1 && m.target.closest && m.target.closest('#axi-auto')) || [...m.addedNodes].every(n => n.nodeType === 1 && (n.id === 'axi-panel' || n.id === 'axi-auto' || (n.classList && n.classList.contains('axi-marca')))))) return;
    programar();
  }).observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(programar, 1800);
})();
