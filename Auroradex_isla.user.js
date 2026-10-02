// ==UserScript==
// @name         Aurora Dex · Isla Espejismo (qué evolucionar)
// @namespace    auroradex-isla
// @version      2.7.1
// @description  Solo en /isla. «▶ Jugar la isla sola»: elige compañero, gasta la marea en la zona que más especies nuevas promete, captura a todos (también los repetidos), ordena el equipo para evolucionar y lucha contra el jefe cuando el equipo llega; /isla?auto=1 empieza solo. «🗺️ Qué sale en cada zona»: recuerda cada Pokémon que sale en cada zona (veces, niveles y si ya lo tienes). Cada especie distinta que tengas en la isla da 10 puntos, así que dice a quién meter en el equipo para que evolucione a una especie que aún no tienes (a qué nivel, cuántos le faltan y qué día lo permite el tope), y a quién sacar porque su evolución ya la tienes o no evoluciona subiendo de nivel. Las evoluciones salen de PokéAPI (solo se manda el nº de la especie) y se guardan.
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
        if (visto.has(e.a)) continue;
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
  function equipoPropuesto(est, A) {
    const primero = est.equipo[0];
    if (!primero) return null;
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
  async function ordenarEquipo() {
    if (ordenando) return;
    const est = estadoIsla(), fn = guardarEquipoFn();
    const msg = t => { const p = document.querySelector('#axi-panel .axi-msg'); if (p) p.textContent = t; };
    if (!est || !fn) { msg('⚠️ No encuentro cómo cambiar el equipo en esta página.'); return; }
    const prop = equipoPropuesto(est, analizar(est));
    if (!prop) return;
    const ids = prop.map(p => p.id);
    if (ids.join() === est.equipo.map(p => p.id).join()) { msg('✔ El equipo ya está así.'); return; }
    ordenando = true;
    try { fn(ids, 'Equipo ordenado para evolucionar a especies nuevas.'); msg('✔ Equipo cambiado.'); }
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
    if (x) ssPut(SS_ZONA, x.z.id);
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
  const COMPANERO_PREFERIDO = ['Corphish', 'Surskit', 'Swinub'];   // Corphish: Agua (aguanta a Suicune y su escolta) y Crawdaunt pega fuerte
  const autoOn = () => ssGet(SS_AUTO) === '1';
  let autoPaso = false, autoMsg = '', ultimoOrden = 0, reordenar = true, esperaJefe = 0;
  // el registro sobrevive a las recargas de la pestaña
  const autoLog = (() => { try { return JSON.parse(sessionStorage.getItem((EN_FONDO_AX ? 'axi-auto-log-fondo' : 'axi-auto-log')) || '[]'); } catch { return []; } })();
  const alog = t => { autoLog.push(t); if (autoLog.length > 30) autoLog.shift(); ssPut((EN_FONDO_AX ? 'axi-auto-log-fondo' : 'axi-auto-log'), JSON.stringify(autoLog)); console.log('[axi] ' + t); pintarAuto(); };
  const espera = ms => new Promise(r => setTimeout(r, ms));
  const botonTexto = re => $$('main button, div.fixed button').find(b => !b.closest('#axi-auto, #axi-panel') && !b.disabled && re.test((b.textContent || '').trim()));
  /* Puntos del ranking: 10 por cada especie distinta que llegues a tener, 1 por victoria, los variocolor y 200 por vencer al
   * jefe. Cada exploración cuesta 1 de marea. Así que una zona vale lo que da, de media, una exploración suya:
   *   P(ganar) × (1 + 10 × la probabilidad de que salga una especie que aún no tengo × la de capturarla)
   * con lo visto en esa zona; y como al principio no se sabe qué sale, un extra por lo poco que se ha explorado.
   * Además van primero: la zona del premio «Por explorar X» (fichas de avatar, solo hay que pisarla una vez) y las zonas
   * que aún no se conocen (hasta explorarlas 4 veces no se sabe qué sale, y las viejas siempre les ganaban). */
  function zonaDificilPendiente(est) {
    const m = (((document.querySelector('main') || {}).innerText) || '').match(/Por explorar ([^.\n]+)\./i);
    const z = m && est.zonas.find(x => x.nombre === m[1].trim());
    return z && z.abierta && !(est.zonasVisitadas || []).includes(z.id) ? z.id : null;
  }
  function zonaElegida(est) {
    const fz = fauna(est);
    const ops = botonesZona(est).filter(o => !o.b.disabled);
    if (!ops.length) return null;
    const dificil = zonaDificilPendiente(est);
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
  const golpesMemo = new Map();
  function golpeMemo(a, b) { let m = golpesMemo.get(a); if (!m) golpesMemo.set(a, (m = new Map())); let v = m.get(b); if (v === undefined) m.set(b, (v = golpeDe(a, b))); return v; }
  // veces que gana el trío `mios` al equipo `rivs` (listas de luchadores) en `n` combates con críticos y variación de daño
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
          df.v -= golpeMemo(at.x, df.x) * (0.85 + Math.random() * 0.15) * (Math.random() < 0.09 ? 1.64 : 1);
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
  function mejorTrio(est, riv) {
    const todos = [...est.equipo, ...est.caja];
    const rivs = riv.filter(r => r.n && baseEsp[r.n] && r.tipos).map(r => luchador(baseEsp[r.n], r.nivel, r.tipos));
    if (!rivs.length || rivs.length < riv.length) return null;
    // los candidatos con más posibilidades (por la nota rápida), con sus datos pedidos
    const cand = todos.map(p => ({ p, v: notaContraJefe(p, riv) })).sort((a, b) => b.v - a.v).slice(0, 9).map(x => x.p);
    for (const p of cand) if (!baseEsp[p.speciesId]) pedirTipos(p.speciesId);
    const listos = cand.filter(p => baseEsp[p.speciesId]);
    if (listos.length < Math.min(3, cand.length)) return null;
    const k = listos.map(p => p.id + ':' + p.nivel).join() + '|' + riv.map(r => r.n + ':' + r.nivel).join();
    if (jefeMemo.k === k) return jefeMemo.r;
    const lu = new Map(listos.map(p => [p.id, luchador(baseEsp[p.speciesId], p.nivel, tiposDe(p))]));
    let mejores = [];
    for (const a of listos) for (const b of listos) for (const c of listos) {
      if (a === b || a === c || b === c) continue;
      const r = simulaTrio([lu.get(a.id), lu.get(b.id), lu.get(c.id)], rivs, 40);
      mejores.push({ trio: [a, b, c], ...r });
    }
    mejores.sort((x, y) => y.p - x.p || y.margen - x.margen);
    mejores = mejores.slice(0, 4).map(m => ({ ...m, ...simulaTrio(m.trio.map(p => lu.get(p.id)), rivs, 300) })).sort((x, y) => y.p - x.p || y.margen - x.margen);
    const r = { trio: mejores[0].trio, p: mejores[0].p, margen: mejores[0].margen };
    jefeMemo = { k, r };
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
    const d = (est.efectoHoy && est.efectoHoy.detalle) || '';
    const alta = /lo grande|nivel por encima/i.test(d), baja = /raros?[^.]{0,40}(triple|doble|×\s*3|x\s*3)/i.test(d);
    if (!alta || baja) return false;
    if (est.capturadas >= est.especiesIsla || !est.siguienteMareaEn) return false;
    if (est.marea + est.mareaPorSubida > est.mareaTope) return false;                       // la siguiente subida se perdería
    const sube = Date.parse(est.siguienteMareaEn) - Date.now();
    const fin = est.temporada && est.temporada.finEn ? Date.parse(est.temporada.finEn) - Date.now() : Infinity;
    if (fin < sube + 13 * 3600e3) return false;                                              // no daría tiempo a gastarla
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
        const perdio = /Te han ganado/.test(txtMain);
        if (perdio) apuntarResultado(est, false);
        const evo = (txtMain.match(/✨ ¡[^!]+ ha evolucionado en [^!]+!/g) || []);
        for (const e of evo) alog(e);
        if (evo.length) reordenar = true;
        if (perdio) alog(`💥 Derrota en ${(est.zonas.find(z => z.id === ssGet(SS_ZONA)) || {}).nombre || 'la zona'}.`);
        await espera(700); seguir.click(); await espera(900); return;
      }
      // ¿lo capturo?
      if (est.encuentro) {
        apuntarEncuentro(est);
        // se captura siempre (la captura es gratis): también los repetidos
        const en = est.encuentro, quiero = true;
        const b = botonTexto(quiero ? /^Capturar$/ : /^Dejarlo ir$/);
        if (!b) return;
        await espera(700 + Math.random() * 600);
        b.click();
        alog(`🎯 ${en.nombre}${en.esShiny ? ' ✨' : ''} Nv.${en.nivel}${en.yaLaTienes ? ' (repetido)' : ''}: lo intento (${en.probabilidad}%).`);
        if (quiero) reordenar = true;
        await espera(1500);
        const tras = estadoIsla();
        const cuantos = e2 => [...e2.equipo, ...e2.caja].filter(p => p.nombre === en.nombre).length;
        if (quiero && tras && !tras.encuentro) alog(cuantos(tras) > cuantos(est) ? `✅ ¡${en.nombre} capturado!` : `💨 ${en.nombre} se ha escapado.`);
        return;
      }
      // compañero de la semana
      if (est.necesitaCompanero) {
        const nombre = COMPANERO_PREFERIDO.find(n => est.companeros.some(c => c.nombre === n)) || (est.companeros[0] || {}).nombre;
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
        if (pGana != null ? pGana >= (est.dia >= est.dias ? 0.02 : 0.05) : poder >= -2 || tres.every(p => p.nivel >= est.topeNivel) || est.dia >= est.dias) {
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
      // equipo: para evolucionar a especies nuevas (el 1.º se queda)
      if (reordenar && Date.now() - ultimoOrden > 15000 && est.equipo.length) {
        ultimoOrden = Date.now(); reordenar = false;
        const prop = equipoPropuesto(est, analizar(est));
        if (prop && prop.map(p => p.id).join() !== est.equipo.map(p => p.id).join()) { await ordenarEquipo(); alog('🔀 Equipo ordenado: ' + prop.map(p => p.nombre).join(', ') + '.'); await espera(2000); return; }
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
        alog(`⏳ Marea alta (salen los grandes): espero a la baja, que saca los raros el triple. Guardo la marea (${est.marea}/${est.mareaTope}).`);
        lsPut(LS_AUTO_ULT, { t: Date.now(), log: autoLog.slice(-15) });
        proximaVisita(est, 'volver con la marea baja');
        ssPut(SS_AUTO, null); pintarAuto();
        return;
      }
      const z = zonaElegida(est);
      if (!z) return;
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
          t = sim ? `👑 ${est.jefe.nombre.split(',')[0]}: ahora lo vences ≈ ${Math.round(sim.p * 100)} % (mejor trío: ${sim.trio.map(p => `${p.nombre} Nv.${p.nivel}`).join(', ')}). Vencerlo da 200 puntos.` : riv ? '👑 Calculando el combate contra el jefe…' : '';
        }
      } catch (e) { console.warn('[axi] jefe', e); }
      kSet(pj, t); pj.hidden = !t;
    }
    // fauna por zona
    const fz = fauna(est);
    const html = est.zonas.map(z => {
      const vistos = Object.entries(fz.zonas[z.id] || {}).sort((a, b) => b[1].n - a[1].n), st = fz.stats[z.id];
      const cab = `<p class="text-[11px] font-extrabold text-tinta-600">${esc(z.icono)} ${esc(z.nombre)} <span class="text-tinta-400">${z.abierta ? `· ${vistos.length} especies vistas${st ? ` · ${st.g}✔ ${st.p}✖` : ''}` : `· se abre el día ${z.desdeDia}`}</span></p>`;
      const chips = vistos.map(([n, e]) => `<span title="${esc(n)} · Nv.${e.min}${e.max !== e.min ? '–' + e.max : ''} · salió ${e.n} ${e.n === 1 ? 'vez' : 'veces'} · ${e.prob}%" style="display:inline-flex;align-items:center;gap:2px;padding:1px 6px 1px 1px;margin:1px;border-radius:999px;font-size:10px;font-weight:800;background:${tengoNombre(est, n) ? 'rgb(var(--hoja-50))' : 'rgb(var(--lienzo))'};border:2px solid ${tengoNombre(est, n) ? 'rgb(var(--hoja-200))' : 'rgb(var(--crema-200))'}"><img src="${esc(e.sprite)}" alt="" style="width:22px;height:22px;image-rendering:pixelated">${esc(n)}${e.shiny ? ' ✨' : ''}${tengoNombre(est, n) ? ' ✔' : ''}</span>`).join('');
      return cab + (z.abierta ? `<div>${chips || '<span class="text-[10px] text-tinta-400">Aún no has explorado aquí.</span>'}</div>` : '');
    }).join('');
    // las que ya tienes en la isla y no están apuntadas en ninguna zona (de antes de que el script las viera)
    const apuntadas = new Set(Object.values(fz.zonas).flatMap(z => Object.keys(z)));
    const sinZona = [...new Map([...est.equipo, ...est.caja].map(p => [p.nombre, p])).values()].filter(p => !apuntadas.has(p.nombre));
    const htmlSin = sinZona.length ? `<p class="text-[11px] font-extrabold text-tinta-600">✔ Ya las tienes (sin zona apuntada) · ${sinZona.length}</p><div>${sinZona.map(p => `<span style="display:inline-flex;align-items:center;gap:2px;padding:1px 6px 1px 1px;margin:1px;border-radius:999px;font-size:10px;font-weight:800;background:rgb(var(--hoja-50));border:2px solid rgb(var(--hoja-200))"><img src="${esc(p.sprite)}" alt="" style="width:22px;height:22px;image-rendering:pixelated">${esc(p.nombre)}${p.esShiny ? ' ✨' : ''}</span>`).join('')}</div>` : '';
    const fa = c.querySelector('.axi-fauna');
    if (fa.dataset.h !== html + htmlSin) { fa.dataset.h = html + htmlSin; fa.innerHTML = html + htmlSin; }
  }
  // /isla?auto=1: empieza solo (lo usa el bot)
  function autoDesdeEnlace() {
    const q = new URLSearchParams(location.search);
    if (!enIsla() || !q.has('auto')) return;
    history.replaceState(history.state, '', location.pathname);
    ssPut(SS_AUTO, '1'); reordenar = true;
  }
  setInterval(() => { if (!enIsla()) return; const est = estadoIsla(); if (est && est.encuentro) apuntarEncuentro(est); pintarAuto(); pasoAuto(); }, 1500);
  setTimeout(autoDesdeEnlace, 1000);
  window.__axIsla = { estadoIsla, fauna, zonaElegida, analizar };

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
