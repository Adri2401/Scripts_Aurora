// ==UserScript==
// @name         Aurora Dex · Tiers (S a G) y debilidades
// @namespace    auroradex-tiers
// @version      1.20.0
// @description  En /equipo, la Torre (/torre) y los Tronos (/tronos). Pone un icono de tier (S, A, B… G) a cada Pokémon del equipo y la Caja PC (también los especiales), ordena la Caja por tier, recomienda el orden del equipo y en su ficha añade debilidades, resistencias, a quién pega fuerte y contra qué sufre. El tier sale de simular duelos 1 contra 1 con las fórmulas del propio juego. En la Torre: tier de cada candidato, % de victorias de tu selección y de tu equipo guardado, el mejor equipo de 6 con todo lo que tienes (marcado con ⭐; lo eliges tú), su composición (debilidades repetidas, amenazas sin respuesta, papel de cada uno y qué estadística potenciar), y la probabilidad de ganar a cada rival. En los Tronos, dentro de cada trono («Mi ficha»): cómo va tu equipo, qué movimientos le faltan y el mejor equipo de ese tipo (sin legendarios) para quitarlo y defenderlo, con un botón que lo pone y lo guarda solo. El modelo de combate aprende de los logs de la Torre. Solo recomienda: no toca tu equipo.
// @match        https://auroradex.es/*
// @match        https://www.auroradex.es/*
// @updateURL    https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_tiers.user.js
// @downloadURL  https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_tiers.user.js
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// @connect      pokeapi.co
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

  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
  const lsPut = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin storage */ } };
  const enEquipo = () => /^\/equipo(\/|$)/.test(location.pathname);

  /* ------------------------------------------------------------------ *
   *  TIPOS
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
  const TIPOS = Object.keys(TABLA);
  const DE_INGLES = { normal: 'normal', fire: 'fuego', water: 'agua', grass: 'planta', electric: 'electrico', ice: 'hielo', fighting: 'lucha', poison: 'veneno', ground: 'tierra', flying: 'volador', psychic: 'psiquico', bug: 'bicho', rock: 'roca', ghost: 'fantasma', dragon: 'dragon', dark: 'siniestro', steel: 'acero', fairy: 'hada' };
  const NOMBRE = { electrico: 'Eléctrico', psiquico: 'Psíquico', dragon: 'Dragón' };
  const bonito = t => NOMBRE[t] || (t.charAt(0).toUpperCase() + t.slice(1));
  const COLOR_TIPO = { normal: '#A8A77A', fuego: '#EE8130', agua: '#6390F0', planta: '#7AC74C', electrico: '#F7D02C', hielo: '#96D9D6', lucha: '#C22E28', veneno: '#A33EA1', tierra: '#E2BF65', volador: '#A98FF3', psiquico: '#F95587', bicho: '#A6B91A', roca: '#B6A136', fantasma: '#735797', dragon: '#6F35FC', siniestro: '#705746', acero: '#B7B7CE', hada: '#D685AD' };
  const eficacia = (a, def) => def.reduce((m, d) => m * ((TABLA[a] || {})[d] ?? 1), 1);

  /* ------------------------------------------------------------------ *
   *  DATOS DE CADA ESPECIE (tipos y estadísticas base) desde PokéAPI, por nº de Pokédex.
   *  Se guardan para siempre y se comparten con el script del Metro (misma clave). Como mucho 4 peticiones a la vez.
   * ------------------------------------------------------------------ */
  const LS_POKE = 'axm-poke';
  const datos = lsGet(LS_POKE, {});
  const cola = [], pedidos = new Set();
  let activos = 0;
  function pedirJSON(url) {
    return new Promise((ok, mal) => {
      if (typeof GM_xmlhttpRequest === 'function') {
        GM_xmlhttpRequest({ method: 'GET', url, timeout: 12000, onload: r => { try { ok(JSON.parse(r.responseText)); } catch (e) { mal(e); } }, onerror: mal, ontimeout: mal });
      } else fetch(url).then(r => r.json()).then(ok, mal);
    });
  }
  function pedir(num) {
    if (!num || datos[num] || pedidos.has(num)) return;
    pedidos.add(num); cola.push(num); bombear();
  }
  let guardarT = null;
  function bombear() {
    while (activos < 4 && cola.length) {
      const num = cola.shift();
      activos++;
      pedirJSON('https://pokeapi.co/api/v2/pokemon/' + num).then(d => {
        const t = (d.types || []).sort((a, b) => a.slot - b.slot).map(x => DE_INGLES[x.type.name]).filter(Boolean);
        const s = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'].map(k => ((d.stats || []).find(x => x.stat.name === k) || {}).base_stat || 50);
        if (t.length) {
          datos[num] = { t, s };
          clearTimeout(guardarT);
          guardarT = setTimeout(() => { const g = lsGet(LS_POKE, {}); lsPut(LS_POKE, Object.assign(g, datos)); programar(); }, 400);
        }
      }).catch(() => { pedidos.delete(num); }).finally(() => { activos--; bombear(); });
    }
  }

  /* ------------------------------------------------------------------ *
   *  MODELO DEL JUEGO (ajustado con el log de un combate de la Torre, donde las estadísticas son las exactas del juego)
   *  Estadísticas: PS = 3·base·Nv/100 + Nv + 14 · ATQ/DEF/VEL = 2·base·Nv/100 + 5 · el juego tiene una sola ESP (media
   *  de At. Esp. y Def. Esp.) y la usa tanto para atacar como para defender.
   *  Cada Pokémon pega «cuerpo a cuerpo» (ATQ contra DEF) si su Ataque base es igual o mayor que su At. Esp. base, y «a
   *  distancia» (ESP contra ESP) si no. Ataca con su tipo más eficaz (si empatan, el primero); si todos los suyos son
   *  poco eficaces y un ataque Normal no lo es tanto, usa ataques Normal (cuerpo a cuerpo y sin el ×1,5 de su tipo).
   *  Daño = (0,44·30,5·A/D + 2) · 1,5 si es de su tipo · eficacia. Muy eficaz vale ×1,65 (no ×2) y poco eficaz ×0,6
   *  (no ×0,5), por cada tipo del que recibe. Críticos: ~9% de los golpes, ×1,64 (en el modelo, su media: ×1,06).
   *  Si no le afecta nada, Forcejeo (1/16). Pega primero el más rápido. Lo que se ve en los combates de la Torre afina
   *  estos números (ver «APRENDER DE LOS COMBATES DE LA TORRE»).
   * ------------------------------------------------------------------ */
  function stats(b, L) {
    const st = x => Math.floor(2 * x * L / 100) + 5;
    return { hp: Math.floor(3 * b[0] * L / 100) + L + 14, atk: st(b[1]), def: st(b[2]), esp: st(Math.round((b[3] + b[4]) / 2)), spa: st(b[3]), spd: st(b[4]), spe: st(b[5]), fis: b[1] >= b[3] };
  }
  const MODELO = { potencia: 30.5, se: 1.65, nve: 0.6, critProb: 0.09, critX: 1.64 };
  let CAL = { k: 1, se: MODELO.se, nve: MODELO.nve, critP: MODELO.critProb, critX: MODELO.critX };
  // Tipo con el que ataca `a` a `b`: el suyo más eficaz; ataques Normal si todos los suyos son poco eficaces y Normal no tanto
  // `a.movs` (Tronos): tipos de los movimientos que lleva; sin movimientos de un tipo no puede pegar con él
  function tipoAtaque(a, b) {
    const propios = a.movs ? a.tipos.filter(t => a.movs.includes(t)) : a.tipos, conNormal = !a.movs || a.movs.includes('normal');
    let m = null;
    for (const t of propios) { const e = eficacia(t, b.tipos); if (!m || e > m.e) m = { t, e, propio: true }; }
    if (!m) return conNormal ? { t: 'normal', e: eficacia('normal', b.tipos), propio: a.tipos.includes('normal') } : { t: null, e: 0, propio: false };
    if (m.e < 1 && conNormal) { const en = eficacia('normal', b.tipos); if (en > m.e) return { t: 'normal', e: en, propio: a.tipos.includes('normal') }; }
    return m;
  }
  // Eficacia tal como la aplica el juego: ×1,65 por cada tipo débil y ×0,6 por cada tipo que resiste
  function eficaciaJuego(t, tipos) {
    let m = 1;
    for (const x of tipos) { const v = (TABLA[t] || {})[x] ?? 1; m *= v === 0 ? 0 : v > 1 ? CAL.se : v < 1 ? CAL.nve : 1; }
    return m;
  }
  const esFisico = a => (a.fis !== undefined ? a.fis : a.atk >= (a.spa || a.esp));
  // Daño en PS de un golpe normal (sin crítico)
  function danoPS(a, b) {
    const at = tipoAtaque(a, b);
    if (at.e === 0) return 0;
    const fis = !at.propio || esFisico(a), A = fis ? a.atk : a.esp, D = fis ? b.def : b.esp;
    return ((2 * a.L / 5 + 2) * MODELO.potencia * A / D / 50 + 2) * (at.propio ? 1.5 : 1) * eficaciaJuego(at.t, b.tipos) * CAL.k;
  }
  let memoG = new WeakMap();
  // Parte de la vida del rival que quita cada golpe, de media (con los críticos)
  function golpe(a, b) {
    let m = memoG.get(a);
    if (!m) memoG.set(a, (m = new Map()));
    let v = m.get(b);
    if (v !== undefined) return v;
    const d = danoPS(a, b);
    v = d === 0 ? 1 / 16 : d * (1 + CAL.critP * (CAL.critX - 1)) / b.hp;
    m.set(b, v);
    return v;
  }
  // Única habilidad del juego: Slaking (nº 289) ataca un turno sí y otro no → para dar t golpes necesita 2t − 1 turnos
  const HOLGAZAN = 289;
  const turnos = (x, t) => (x.num === HOLGAZAN ? 2 * t - 1 : t);
  function duelo(a, b) {
    const tA = turnos(a, Math.ceil(1 / golpe(a, b) - 1e-9) + (b.aguanta ? 1 : 0)), tB = turnos(b, Math.ceil(1 / golpe(b, a) - 1e-9) + (a.aguanta ? 1 : 0));
    if (a.spe > b.spe) return tA <= tB ? 1 : 0;
    if (a.spe < b.spe) return tB <= tA ? 0 : 1;
    return tA < tB ? 1 : tA > tB ? 0 : 0.5;
  }
  /* ---- Objetos de combate (del catálogo del juego; el id es el nombre del icono /items/<id>.png) ----
   * hp/atk/def/esp/spe en %; «aguanta»: la primera vez que iba a caer, aguanta con 1 PS */
  const OBJETOS = {
    'hard-stone': { n: 'Roca Firme', hp: 25 }, 'silver-pendant': { n: 'Colgante Plateado', hp: 18 }, 'focus-band': { n: 'Banda Focus', hp: 15 },
    'balsamo-gremio': { n: 'Bálsamo del Gremio', hp: 15 }, 'mascara-funeraria': { n: 'Máscara Funeraria', hp: 8 },
    'corona-guerra': { n: 'Corona de Guerra', atk: 20, spe: 10 }, 'talisman-trono': { n: 'Talismán del Trono', def: 18, hp: 12 },
    'prisma-blanquinegro': { n: 'Prisma Blanquinegro', hp: 12, atk: 12, def: 12, esp: 12, spe: 12 },
    'muscle-band': { n: 'Cinta Fuerza', atk: 12 }, 'wise-glasses': { n: 'Gafas Sabias', esp: 12 }, 'quick-claw': { n: 'Garra Rápida', spe: 15 },
    'expert-belt': { n: 'Cinta Experta', atk: 8, esp: 8 }, 'scope-lens': { n: 'Lupa Certera', atk: 14, spe: 14, hp: -10 },
    'leftovers': { n: 'Restos', def: 10, hp: 10 }, 'life-orb': { n: 'Vidaesfera', esp: 14, spe: 14, hp: -10 },
    'assault-vest': { n: 'Chaleco Asalto', def: 16, spe: 12, atk: -10 }, 'as-manga': { n: 'As en la Manga', aguanta: true },
    'red-sphere': { n: 'Esfera Roja', atk: 10 }, 'blue-sphere': { n: 'Esfera Azul', def: 10 }, 'type-plate': { n: 'Placa Elemental', esp: 15 },
    'patin-escarcha': { n: 'Patín de Escarcha', spe: 12, esp: 8 }, 'bufanda-glaciar': { n: 'Bufanda Glaciar', def: 12, hp: 12 },
    'carambano-afilado': { n: 'Carámbano Afilado', atk: 16, spe: 8 }, 'cristal-polar': { n: 'Cristal Polar', esp: 12, def: 10, hp: 10 },
    'corona-boreal': { n: 'Corona Boreal', atk: 10, def: 10, esp: 10, spe: 10 }, 'brazalete-roto': { n: 'Brazalete Roto', esp: 15 },
    'herradura': { n: 'Herradura', spe: 8 }, 'herradura-2': { n: 'Herradura Veloz', spe: 12 }, 'placa-reforzada': { n: 'Placa Reforzada', def: 12, hp: 6 },
    'placa-reforzada-2': { n: 'Placa Blindada', def: 18, hp: 10 }, 'brazal-firme': { n: 'Brazal Firme (+Ataque)', atk: 10 },
    'estandarte-gremio': { n: 'Estandarte del Gremio', atk: 15, def: 10 }, 'yunque-cinco-tierras': { n: 'Yunque de las Cinco Tierras', spe: 12, esp: 12 },
    'perla-cinco-mareas': { n: 'Perla de las Cinco Mareas', def: 12, spe: 12 }, 'raiz-cinco-regiones': { n: 'Raíz de las Cinco Regiones', hp: 12, esp: 12 },
    'brasa-santuario': { n: 'Brasa del Santuario', atk: 14, esp: 14, spe: 8 },
  };
  const idObjeto = img => { const m = (img && img.getAttribute('src') || '').match(/\/items\/([a-z0-9_-]+)\.(?:png|webp|gif)/i); return m ? m[1] : null; };
  // El «Especial» del juego es una sola estadística: sube el ataque especial y la defensa especial a la vez
  function conObjeto(st, id) {
    const o = OBJETOS[id];
    if (!o) return st;
    const f = x => 1 + (x || 0) / 100;
    return { ...st, hp: Math.floor(st.hp * f(o.hp)), atk: Math.floor(st.atk * f(o.atk)), def: Math.floor(st.def * f(o.def)), esp: Math.floor(st.esp * f(o.esp)), spa: Math.floor(st.spa * f(o.esp)), spd: Math.floor(st.spd * f(o.esp)), spe: Math.floor(st.spe * f(o.spe)), aguanta: !!o.aguanta };
  }

  // Banco de rivales de referencia: 34 tipos (simples y dobles) × 4 perfiles de estadísticas, todos a Nv.50
  const GEN = ['normal', 'fuego', 'agua', 'planta', 'electrico', 'hielo', 'lucha', 'veneno', 'tierra', 'volador', 'psiquico', 'bicho', 'roca', 'fantasma', 'dragon', 'siniestro', 'acero', 'hada',
    'agua/tierra', 'fuego/volador', 'planta/veneno', 'dragon/volador', 'acero/psiquico', 'agua/volador', 'roca/tierra', 'bicho/volador', 'normal/volador', 'siniestro/fantasma', 'electrico/acero', 'hielo/agua', 'lucha/acero', 'dragon/tierra', 'psiquico/hada', 'veneno/siniestro'];
  const PERFILES = [[80, 80, 80, 80, 80, 80], [70, 100, 70, 60, 70, 110], [100, 70, 100, 90, 100, 45], [75, 60, 70, 110, 90, 95]];
  const BANCO = GEN.flatMap(t => PERFILES.map(p => ({ ...stats(p, 50), L: 50, tipos: t.split('/') })));
  const TIERS = [['S', 0.88, '#FFB23E'], ['A', 0.76, '#E0473A'], ['B', 0.62, '#A855F7'], ['C', 0.48, '#3B82F6'], ['D', 0.34, '#10B981'], ['E', 0.20, '#84CC16'], ['F', 0.08, '#94A3B8'], ['G', -1, '#64748B']];
  const cacheTier = {};
  // Medida continua para comparar mejoras (un +10% casi nunca cambia un duelo entero, pero sí el margen):
  // golpes que necesita cada uno (sin redondear), medio turno de ventaja al más rápido → probabilidad de ganar
  function ventaja(a, b) {
    let hA = 1 / golpe(a, b) + (b.aguanta ? 1 : 0), hB = 1 / golpe(b, a) + (a.aguanta ? 1 : 0);
    if (a.num === HOLGAZAN) hA = 2 * hA - 1;
    if (b.num === HOLGAZAN) hB = 2 * hB - 1;
    const vel = a.spe > b.spe ? 0.5 : a.spe < b.spe ? -0.5 : 0;
    // relación entre los golpes que necesita el rival y los que necesita él (con medio golpe al más rápido):
    // proporcional, así un +30% pesa claramente más que un +15% aunque ya gane casi siempre
    const r = Math.max(0.05, hB + vel) / hA;
    return r * r * r / (r * r * r + 1);
  }
  const pctCon = (yo, banco = BANCO) => banco.reduce((x, r) => x + ventaja(yo, r), 0) / banco.length;
  // Rivales de su misma fuerza media: contra rivales más flojos un Pokémon muy bueno ya gana todo y ninguna mejora se nota
  const bancosIguales = {};
  function bancoIgual(d) {
    const media = Math.round(d.s.reduce((x, y) => x + y, 0) / 6);
    return bancosIguales[media] || (bancosIguales[media] = GEN.flatMap(t => PERFILES.map(pf => ({ ...stats(pf.map(v => Math.max(20, v + media - 80)), 50), L: 50, tipos: t.split('/'), num: 0 }))));
  }
  // Cuánto sube su % de duelos ganados con cada objeto y con +10 % en cada estadística
  // Qué estadística le conviene subir: se prueba un +10% en cada una contra rivales de su misma fuerza
  // (un +10% sube entre 3 y 8 puntos el % de duelos ganados según el Pokémon: el tercio de arriba «mucho», el de abajo «poco»)
  const NIVEL_MEJORA = g => (g >= 0.058 ? 'le aprovecha mucho' : g >= 0.045 ? 'le aprovecha bastante' : 'le aprovecha poco');
  function mejoras(num, tipos) {
    const d = datos[num];
    if (!d) return null;
    const base = { ...stats(d.s, 50), L: 50, tipos, num };
    const bi = bancoIgual(d);
    const p0 = pctCon(base, bi);
    const fisico = d.s[1] >= d.s[3];
    const prueba = [['PS', { hp: 10 }], [fisico ? 'Ataque' : 'Especial', fisico ? { atk: 10 } : { esp: 10 }], ['Defensa', { def: 10 }], ['Velocidad', { spe: 10 }]];
    if (fisico) prueba.push(['Especial', { esp: 10 }]);
    const stats10 = prueba.map(([n, o]) => { OBJETOS.__p = { n, ...o }; const g = pctCon(conObjeto(base, '__p'), bi) - p0; delete OBJETOS.__p; return { n, gana: g }; }).sort((a, b) => b.gana - a.gana);
    return { p0, stats10 };
  }
  function analizar(num, tiposVistos) {
    const base = datos[num];
    if (!base) return null;
    const tipos = tiposVistos && tiposVistos.length ? tiposVistos : base.t;
    const clave = num + '|' + tipos.join('/');
    if (cacheTier[clave]) return cacheTier[clave];
    const d = { ...base, t: tipos };
    const yo = { ...stats(d.s, 50), L: 50, tipos: d.t, num };
    let gana = 0;
    const pierdePorTipo = {};
    for (const r of BANCO) {
      const x = duelo(yo, r);
      gana += x;
      if (x < 1) for (const t of r.tipos) pierdePorTipo[t] = (pierdePorTipo[t] || 0) + (1 - x);
    }
    const pct = gana / BANCO.length;
    const [letra, , color] = TIERS.find(([, min]) => pct >= min);
    // defensa y ataque por tipos
    const deb4 = [], deb2 = [], res = [], inm = [];
    for (const t of TIPOS) { const e = eficacia(t, d.t); if (e >= 4) deb4.push(t); else if (e >= 2) deb2.push(t); else if (e === 0) inm.push(t); else if (e < 1) res.push(t); }
    const fuerte = [], nulo = [], flojo = [];
    for (const t of TIPOS) { const e = Math.max(...d.t.map(a => eficacia(a, [t]))); if (e >= 2) fuerte.push(t); else if (e === 0) nulo.push(t); else if (e < 1) flojo.push(t); }
    const peores = Object.entries(pierdePorTipo).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t);
    const esp = Math.round((d.s[3] + d.s[4]) / 2);
    const r = { holgazan: num === HOLGAZAN, letra, color, pct, d, deb4, deb2, res, inm, fuerte, nulo, flojo, peores, esp, ataque: d.s[1] >= d.s[3] ? 'ATQ (cuerpo a cuerpo)' : 'ESP (a distancia)' };
    cacheTier[clave] = r;
    return r;
  }

  /* ------------------------------------------------------------------ *
   *  ICONO DE TIER EN CADA TARJETA
   * ------------------------------------------------------------------ */
  const numSrc = src => { if (/\/sprites\/unown\//i.test(src || '')) return 201; const m = (src || '').match(/\/sprites\/(?:[a-z0-9_-]+\/)*?(?:dorso-)?(\d+)(?:[-_.])/i); return m ? parseInt(m[1], 10) : null; };
  const numDe = img => numSrc(img.getAttribute('src'));
  // Tipos tal como los enseña la web en esa tarjeta («BIC» con title «Bicho», o «AGUA» en el equipo)
  const ABREV = { nor: 'normal', fue: 'fuego', agu: 'agua', pla: 'planta', ele: 'electrico', hie: 'hielo', luc: 'lucha', ven: 'veneno', tie: 'tierra', vol: 'volador', psi: 'psiquico', bic: 'bicho', roc: 'roca', fan: 'fantasma', dra: 'dragon', sin: 'siniestro', ace: 'acero', had: 'hada' };
  const normT = x => (x || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  function tiposEn(raiz) {
    const out = [];
    for (const sp of $$('span', raiz)) {
      if (sp.children.length || sp.closest('.axt-ficha')) continue;
      const t = normT(sp.getAttribute('title')) || normT(sp.textContent);
      const k = TABLA[t] ? t : ABREV[t];
      if (k && (sp.getAttribute('title') || /pastilla|rounded-pill/.test(sp.className)) && !out.includes(k)) out.push(k);
    }
    return out.slice(0, 2);
  }
  function insignia(t, grande) {
    const s = document.createElement('span');
    s.className = 'axt-tier';
    s.setAttribute('data-ax-ignore', '1');
    s.title = `Tier ${t.letra}: gana el ${Math.round(t.pct * 100)}% de los duelos 1 contra 1 a igual nivel`;
    s.textContent = t.letra;
    s.style.cssText = `display:inline-grid;place-items:center;min-width:${grande ? 26 : 17}px;height:${grande ? 26 : 17}px;padding:0 3px;border-radius:999px;` +
      `background:${t.color};color:#fff;font-weight:900;font-size:${grande ? 14 : 10}px;line-height:1;box-shadow:0 0 0 2px rgba(255,255,255,.85),0 1px 3px rgba(0,0,0,.35);pointer-events:none`;
    return s;
  }
  function decorarTarjetas() {
    for (const img of $$('main img[src*="/sprites/"]')) {
      const num = numDe(img);
      if (!num) continue;
      // Caja PC: el botón de la tarjeta · Equipo: el hueco del sprite (con el objeto abajo a la derecha)
      const boton = img.closest('ul.grid li > button');
      const hueco = !boton && img.closest('li[data-id]') ? img.parentElement : null;
      const caja = boton || (hueco && hueco.classList.contains('relative') ? hueco : null);
      if (!caja) continue;
      const tipos = tiposEn(boton || img.closest('li[data-id]'));
      const firma = num + '|' + tipos.join('/');
      if (caja.dataset.axtNum === firma && caja.querySelector(':scope > .axt-tier')) continue;
      const t = analizar(num, tipos);
      if (!t) { pedir(num); continue; }
      const viejo = caja.querySelector(':scope > .axt-tier');
      if (viejo) viejo.remove();
      const s = insignia(t);
      s.style.position = 'absolute';
      if (boton) { s.style.right = '4px'; s.style.top = '4px'; }
      else { s.style.left = '-6px'; s.style.top = '-6px'; }
      caja.appendChild(s);
      caja.dataset.axtNum = firma;
    }
  }

  /* ------------------------------------------------------------------ *
   *  FICHA: debilidades, resistencias, a quién pega fuerte y contra qué sufre
   * ------------------------------------------------------------------ */
  const chip = t => `<span style="display:inline-block;padding:1px 6px;border-radius:999px;background:${COLOR_TIPO[t]};color:#fff;font-size:10px;font-weight:800;text-transform:uppercase;margin:1px">${bonito(t)}</span>`;
  const fila = (titulo, lista, extra = '') => lista.length ? `<div class="flex flex-wrap items-center gap-1"><span class="text-[10px] font-extrabold text-tinta-400" style="min-width:74px">${titulo}</span>${lista.map(chip).join('')}${extra}</div>` : '';
  function decorarFichas() {
    for (const p of $$('p.titulo-seccion')) {
      if (!/^\s*estad[ií]sticas/i.test(p.textContent || '')) continue;
      const bloque = p.parentElement;
      const li = bloque.closest('li');
      const img = li && li.querySelector('img[src*="/sprites/"]');
      const num = img && numDe(img);
      if (!num) continue;
      let caja = bloque.nextElementSibling && bloque.nextElementSibling.classList.contains('axt-ficha') ? bloque.nextElementSibling : null;
      const tipos = tiposEn(li.querySelector('button') || li);
      const firmaF = num + '|' + tipos.join('/');
      if (caja && caja.dataset.num === firmaF) continue;
      const t = analizar(num, tipos);
      if (!t) { pedir(num); continue; }
      if (!caja) { caja = document.createElement('div'); caja.className = 'axt-ficha space-y-1.5'; caja.setAttribute('data-ax-ignore', '1'); bloque.insertAdjacentElement('afterend', caja); }
      caja.dataset.num = firmaF;
      const base = t.d.s, total = base.reduce((x, y) => x + y, 0);
      caja.innerHTML = `
        <p class="titulo-seccion">Análisis</p>
        <div class="flex items-center gap-2"></div>
        <p class="text-[11px] font-semibold text-tinta-500">Gana el <b>${Math.round(t.pct * 100)}%</b> de los duelos 1 contra 1 contra rivales de todos los tipos a su mismo nivel. Ataca con <b>${t.ataque}</b>: el juego usa el mayor de los dos.${t.holgazan ? ' <b>Ausente:</b> solo ataca un turno sí y otro no (ya contado en el tier).' : ''} Base: ${total} (PS ${base[0]} · ATQ ${base[1]} · DEF ${base[2]} · ESP ${t.esp} · VEL ${base[5]}).</p>
        ${fila('Débil ×4', t.deb4)}
        ${fila('Débil ×2', t.deb2)}
        ${fila('Resiste', t.res)}
        ${fila('Inmune a', t.inm)}
        ${fila('Pega ×2 a', t.fuerte)}
        ${fila('No le hace nada', t.nulo, '<span class="text-[10px] font-bold text-tinta-400">(usaría Forcejeo si no tiene otro tipo)</span>')}
        ${fila('Sufre contra', t.peores)}
        ${lineaPotenciar(num, t)}`;
      const cab = caja.children[1];
      cab.appendChild(insignia(t, true));
      const txt = document.createElement('span');
      txt.className = 'text-xs font-extrabold text-tinta-600';
      txt.textContent = `Tier ${t.letra}`;
      cab.appendChild(txt);
    }
  }

  // «Potenciar: Ataque (le aprovecha mucho), luego Velocidad»: lo que más le conviene que suba un objeto o un entrenamiento
  function lineaPotenciar(num, t) {
    const m = mejoras(num, t.d.t);
    if (!m) return '';
    const [a, b] = m.stats10;
    return `<p class="text-[11px] font-semibold text-tinta-500">💪 Potenciar: <b>${a.n}</b> (${NIVEL_MEJORA(a.gana)})${b && b.gana > 0.004 ? `, luego ${b.n}` : ''}.</p>`;
  }

  /* ------------------------------------------------------------------ *
   *  ORDENAR LA CAJA PC POR TIER
   *  Botón «Tier» junto a Pokédex / Nivel / Rareza. Se ordena con la propiedad CSS «order» de cada tarjeta, sin mover
   *  los elementos de la web (así React no se lía). Al pulsar otro orden de la web, se quita.
   * ------------------------------------------------------------------ */
  const LS_ORDEN = 'axt-orden-tier';
  let ordenTier = lsGet(LS_ORDEN, false);
  const CLASES_ON = ['border-rojo-500', 'bg-rojo-500', 'text-white'], CLASES_OFF = ['border-crema-200', 'bg-lienzo', 'text-tinta-500'];
  function botonOrden() {
    const fila = $$('main div.flex').find(d => { const t = $$(':scope > button', d).map(b => b.textContent.trim()); return t.includes('Nivel') && t.includes('Rareza'); });
    if (!fila) return;
    let b = fila.querySelector(':scope > .axt-orden');
    if (!b) {
      b = document.createElement('button');
      b.type = 'button';
      b.className = 'axt-orden pastilla flex-1 justify-center border-2 text-[11px] transition';
      b.setAttribute('data-ax-ignore', '1');
      b.textContent = 'Tier';
      b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); ordenTier = !ordenTier; lsPut(LS_ORDEN, ordenTier); pintarBotonOrden(b); ordenar(); });
      fila.appendChild(b);
      for (const otro of $$(':scope > button:not(.axt-orden)', fila)) otro.addEventListener('click', () => { if (ordenTier) { ordenTier = false; lsPut(LS_ORDEN, false); pintarBotonOrden(b); ordenar(); } });
    }
    pintarBotonOrden(b);
  }
  function pintarBotonOrden(b) {
    b.classList.remove(...(ordenTier ? CLASES_OFF : CLASES_ON));
    b.classList.add(...(ordenTier ? CLASES_ON : CLASES_OFF));
    b.title = ordenTier ? 'Ordenado por tier (de S a G). Toca para quitarlo.' : 'Ordenar por tier (de S a G)';
  }
  function ordenar() {
    for (const li of $$('main ul.grid > li')) {
      const b = li.querySelector(':scope > button');
      const img = b && b.querySelector('img[src*="/sprites/"]');
      if (!img) continue;
      if (!ordenTier) { if (li.dataset.axtOrden) { li.style.order = ''; delete li.dataset.axtOrden; } continue; }
      const num = numDe(img), t = num && analizar(num, tiposEn(b));
      const nivel = parseInt((b.textContent.match(/Nv\.\s*(\d+)/) || [])[1], 10) || 0;
      const o = t ? String(Math.round((1 - t.pct) * 10000) * 1000 + (999 - nivel)) : '99999999';
      if (li.style.order !== o) { li.style.order = o; li.dataset.axtOrden = '1'; }
    }
  }

  /* ------------------------------------------------------------------ *
   *  ORDEN RECOMENDADO DEL EQUIPO («Los 3 primeros combaten»)
   *  Se prueban todas las formas de poner 3 de tus 6 en orden (a su nivel de verdad) contra 300 tríos de rivales de
   *  todos los tipos a tu nivel medio. Combates en orden: el que gana sigue con la vida que le queda.
   * ------------------------------------------------------------------ */
  function dueloF(a, fa, b, fb) {
    const dA = golpe(a, b), dB = golpe(b, a);
    const gA = k => (a.num === HOLGAZAN ? Math.ceil(k / 2) : k), gB = k => (b.num === HOLGAZAN ? Math.ceil(k / 2) : k);
    const tA = turnos(a, Math.ceil(fb / dA - 1e-9) + (b.aguanta ? 1 : 0)), tB = turnos(b, Math.ceil(fa / dB - 1e-9) + (a.aguanta ? 1 : 0));
    const primeroA = a.spe > b.spe || (a.spe === b.spe && fa >= fb);
    if (primeroA) return tA <= tB ? { ganaA: true, fa: fa - gB(tA - 1) * dB, fb: 0 } : { ganaA: false, fa: 0, fb: fb - gA(tB) * dA };
    return tB <= tA ? { ganaA: false, fa: 0, fb: fb - gA(tB - 1) * dA } : { ganaA: true, fa: fa - gB(tA) * dB, fb: 0 };
  }
  function combate(mios, rivales) {
    let i = 0, j = 0, fa = 1, fb = 1;
    mios = [...mios];
    while (i < mios.length && j < rivales.length) {
      const r = dueloF(mios[i], fa, rivales[j], fb);
      if (mios[i].aguanta) mios[i] = { ...mios[i], aguanta: false };
      if (r.ganaA) { fa = r.fa; j++; fb = 1; } else { fb = r.fb; i++; fa = 1; }
    }
    return { gana: j >= rivales.length, vivos: mios.length - i };
  }
  function permutaciones(arr, k) {
    const out = [];
    const rec = (pref, resto) => { if (pref.length === k) { out.push(pref); return; } resto.forEach((x, i) => rec([...pref, x], resto.filter((_, j) => j !== i))); };
    rec([], arr);
    return out;
  }
  let memoEquipo = null;
  function ordenEquipo() {
    const aviso = $$('main p').find(p => /arrastra por el asa/i.test(p.textContent || ''));
    const lista = aviso && $$('main ul').find(u => u.querySelector(':scope > li[data-id]') && aviso.compareDocumentPosition(u) & Node.DOCUMENT_POSITION_FOLLOWING);
    let caja = document.getElementById('axt-equipo');
    if (!lista) { if (caja) caja.remove(); return; }
    const miembros = $$(':scope > li[data-id]', lista).map(li => {
      const img = li.querySelector('img[src*="/sprites/"]');
      const num = img && numDe(img);
      const nombre = ((li.querySelector('span.truncate') || {}).textContent || img && img.alt || '?').trim();
      const nivel = parseInt((li.textContent.match(/Nv\.\s*(\d+)/) || [])[1], 10) || 50;
      const obj = idObjeto($$('img[src*="/items/"]', li)[0]);
      return { num, nombre, nivel, obj, tipos: tiposEn(li.querySelector('button') || li) };
    }).filter(m => m.num);
    if (miembros.length < 2) { if (caja) caja.remove(); return; }
    const entrada = JSON.stringify(miembros);
    if (!caja) {
      caja = document.createElement('section');
      caja.id = 'axt-equipo';
      caja.className = 'tarjeta space-y-1.5 p-3';
      caja.setAttribute('data-ax-ignore', '1');
    }
    if (caja.nextElementSibling !== lista) lista.insertAdjacentElement('beforebegin', caja);
    const pinta = html => {
      if (caja.dataset.html === html) return;
      caja.innerHTML = html; caja.dataset.html = html;
      const b = caja.querySelector('.axt-calc-orden');
      if (b) b.addEventListener('click', e => { e.preventDefault(); calcularOrdenEquipo(); });
    };
    // Solo se calcula al pulsar el botón (y otra vez si cambia el equipo)
    if (!memoEquipo || memoEquipo.entrada !== entrada) {
      const cambio = memoEquipo && !calculandoEquipo;
      pinta(`
        <p class="titulo-seccion !mb-0">⚔️ Orden recomendado</p>
        <p class="text-[11px] font-semibold text-tinta-500">${cambio ? 'Tu equipo ha cambiado desde el último cálculo. ' : ''}Prueba todas las formas de poner a 3 de tus Pokémon en orden contra 300 tríos de rivales de todos los tipos.</p>
        <button type="button" class="axt-calc-orden boton-principal w-full !py-2 text-xs" ${calculandoEquipo ? 'disabled' : ''}>${calculandoEquipo ? `⏳ ${ordenProg || 'Calculando…'}` : cambio ? '🔄 Recalcular el orden' : '🧮 Calcular el orden recomendado'}</button>
        ${ordenFallo && !calculandoEquipo ? `<p class="text-center text-[11px] font-bold text-rojo-600">${ordenFallo}</p>` : ''}`);
      return;
    }
    const { mejor, actual, nivel, sinNiveles } = memoEquipo;
    const yaEsta = mejor.orden.every((x, i) => miembros[i] && miembros[i].num === x.num && miembros[i].nombre === x.nombre);
    const pct = x => Math.round(x * 100) + '%';
    const html = `
      <div class="flex items-center justify-between gap-2">
        <p class="titulo-seccion !mb-0">⚔️ Orden recomendado</p>
        <span class="text-[11px] font-extrabold ${yaEsta ? 'text-hoja-600' : 'text-ambar-600'}">${yaEsta ? '✔ Ya lo tienes así' : `gana ${pct(mejor.n.g)} (ahora ${pct(actual.g)})`}</span>
      </div>
      <p class="text-sm font-extrabold">${mejor.orden.map((x, i) => `${i + 1}. ${x.nombre}`).join(' · ')}</p>
      <p class="text-[11px] font-bold text-tinta-500">Si todos estuvieran al mismo nivel (Nv.${sinNiveles.nivel}): ${sinNiveles.mejor.orden.map((x, i) => `${i + 1}. ${x.nombre}`).join(' · ')} <span class="text-tinta-400">(gana ${pct(sinNiveles.mejor.n.g)})</span></p>
      <p class="text-[10px] font-semibold text-tinta-400">${yaEsta ? 'Tus 3 primeros ya son los que más combates ganan en ese orden.' : 'Arrastra por el asa ⠿ para ponerlos así.'} Arriba, contando el nivel real de cada uno; abajo, lo que rendirían si subieras a todos (sirve para saber a quién merece la pena entrenar). Contra rivales de todos los tipos, tan fuertes de media como tu equipo (Nv.${nivel}), en orden (el que gana sigue con la vida que le queda) y con los objetos que llevan puestos.</p>`;
    pinta(html);
  }
  // Los miembros del equipo tal como están ahora en la página
  function miembrosEquipo() {
    const aviso = $$('main p').find(p => /arrastra por el asa/i.test(p.textContent || ''));
    const lista = aviso && $$('main ul').find(u => u.querySelector(':scope > li[data-id]') && aviso.compareDocumentPosition(u) & Node.DOCUMENT_POSITION_FOLLOWING);
    if (!lista) return [];
    return $$(':scope > li[data-id]', lista).map(li => {
      const img = li.querySelector('img[src*="/sprites/"]');
      const num = img && numDe(img);
      const nombre = ((li.querySelector('span.truncate') || {}).textContent || img && img.alt || '?').trim();
      const nivel = parseInt((li.textContent.match(/Nv\.\s*(\d+)/) || [])[1], 10) || 50;
      const obj = idObjeto($$('img[src*="/items/"]', li)[0]);
      return { num, nombre, nivel, obj, tipos: tiposEn(li.querySelector('button') || li) };
    }).filter(m => m.num);
  }
  // El cálculo, por pasos (cada orden probado es un paso) para no congelar la página
  function* calcularEquipoPasos(miembros) {
    const baseMedia = miembros.reduce((x, m) => x + datos[m.num].s.reduce((p, q) => p + q, 0), 0) / miembros.length / 6;
    let semilla = 11; const azar = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647;
    const orden3 = Array.from({ length: 300 }, () => GEN.length * PERFILES.length).map(n => [0, 0, 0].map(() => Math.floor(azar() * n)));
    // mismo sorteo de rivales para las dos cuentas; `nivelFijo`: todos (tuyos y rivales) a ese nivel
    function* calcular(nivelFijo) {
      const nivel = nivelFijo || Math.round(miembros.reduce((x, m) => x + m.nivel, 0) / miembros.length);
      const banco = GEN.flatMap(t => PERFILES.map(pf => ({ ...stats(pf.map(v => Math.max(30, Math.round(v + baseMedia - 80))), nivel), L: nivel, tipos: t.split('/'), num: 0 })));
      const trios = orden3.map(ix => ix.map(i => banco[i]));
      const luch = miembros.map(m => { const L = nivelFijo || m.nivel; return { ...conObjeto(stats(datos[m.num].s, L), m.obj), L, tipos: m.tipos.length ? m.tipos : datos[m.num].t, num: m.num, nombre: m.nombre }; });
      const nota = orden => { let g = 0, v = 0; for (const tr of trios) { const r = combate(orden, tr); if (r.gana) { g++; v += r.vivos; } } return { g: g / trios.length, v: v / trios.length }; };
      let mejor = null;
      for (const orden of permutaciones(luch, Math.min(3, luch.length))) {
        const n = nota(orden);
        if (!mejor || n.g + n.v / 100 > mejor.n.g + mejor.n.v / 100) mejor = { orden, n };
        yield;
      }
      return { mejor, actual: nota(luch.slice(0, 3)), nivel };
    }
    const conNiveles = yield* calcular(null);
    const sinNiveles = yield* calcular(Math.max(...miembros.map(m => m.nivel)));
    return { entrada: JSON.stringify(miembros), ...conNiveles, sinNiveles };
  }
  let calculandoEquipo = false, ordenProg = '', ordenFallo = '';
  async function calcularOrdenEquipo() {
    if (calculandoEquipo) return;
    const miembros = miembrosEquipo();
    if (miembros.length < 2) return;
    calculandoEquipo = true; ordenFallo = ''; ordenProg = 'Calculando…';
    programar();
    try {
      // estadísticas base de los que falten (se piden y se esperan hasta 12 s)
      for (const m of miembros) if (!datos[m.num]) pedir(m.num);
      for (let i = 0; i < 40 && miembros.some(m => !datos[m.num]); i++) { ordenProg = `Buscando las estadísticas de ${miembros.filter(m => !datos[m.num]).length} Pokémon…`; programar(); await new Promise(r => setTimeout(r, 300)); }
      if (miembros.some(m => !datos[m.num])) { ordenFallo = '⚠️ No he podido traer las estadísticas de algún Pokémon. Prueba otra vez.'; return; }
      ordenProg = 'Probando órdenes…'; programar();
      memoEquipo = await correrPasos(calcularEquipoPasos(miembros));
    } catch (e) { console.warn('[axt equipo]', e); ordenFallo = '⚠️ Error: ' + (e && e.message); }
    finally { calculandoEquipo = false; ordenProg = ''; programar(); }
  }

  /* ------------------------------------------------------------------ *
   *  TORRE DESAFÍO (/torre?liga=…)
   *  La web ya trae en sus datos todo lo que hace falta de cada candidato: tipos y estadísticas reales a Nv.50 con el
   *  objeto puesto. En la Torre el orden de salida se sortea en cada combate, así que lo que cuenta es QUÉ seis llevas
   *  (y con qué objetos), no el orden. Rivales: los equipos que se ven en «Retar» (se van apuntando) más un banco de
   *  todos los tipos tan fuerte como tus mejores Pokémon.
   * ------------------------------------------------------------------ */
  const enTorre = () => /^\/torre(\/|$)/.test(location.pathname);
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
  function estadoTorre() {
    const el = $$('main button').find(b => /^(Retar|Mi equipo)$/.test((b.textContent || '').trim()));
    let f = actual(fibraDe(el));
    for (let i = 0; f && i < 40; i++, f = f.return) {
      const p = f.memoizedProps;
      if (p && p.estado && Array.isArray(p.estado.candidatos)) return { ...p.estado, modo: p.modo || 'clasico' };
    }
    return null;
  }
  const tipoDe = x => { const t = normT(x); return TABLA[t] ? t : ABREV[t.slice(0, 3)] || null; };
  const NOMBRE_OBJ = Object.fromEntries(Object.entries(OBJETOS).map(([id, o]) => [normT(o.n), id]));
  // Estadísticas sin el objeto que llevan (la web las enseña ya con el objeto, redondeadas)
  function sinObjeto(st, id) {
    const o = OBJETOS[id] || {}, f = x => 1 + (x || 0) / 100;
    return { ps: st.ps / f(o.hp), ataque: st.ataque / f(o.atk), defensa: st.defensa / f(o.def), especial: st.especial / f(o.esp), velocidad: st.velocidad / f(o.spe) };
  }
  let cacheLuch = new Map();
  // Luchador a Nv.50 con el objeto `item` (undefined: el que lleva; null: ninguno). Si pega cuerpo a cuerpo o a distancia
  // sale de sus estadísticas base (PokéAPI); sin ellas, de las de la web
  function luchadorT(c, item) {
    const id = item === undefined ? c.itemId || null : item;
    const num = numSrc(c.sprite), base = num && datos[num];
    const clave = (c.id != null ? c.id : c.sprite + '|' + c.stats.total) + '|' + c.itemId + '|' + id + '|' + (base ? 1 : 0);
    if (cacheLuch.has(clave)) return cacheLuch.get(clave);
    const b = sinObjeto(c.stats, c.itemId), o = OBJETOS[id] || {}, r = (v, p) => Math.round(v * (1 + (p || 0) / 100));
    const esp = r(b.especial, o.esp);
    const l = { hp: r(b.ps, o.hp), atk: r(b.ataque, o.atk), def: r(b.defensa, o.def), esp, spa: esp, spd: esp, spe: r(b.velocidad, o.spe), L: 50,
      fis: base ? base.s[1] >= base.s[3] : b.ataque >= b.especial,
      tipos: [c.tipo1, c.tipo2].map(tipoDe).filter(Boolean), num, aguanta: !!o.aguanta, nombre: c.nombre, item: id,
      sprite: c.sprite || null, cid: c.id != null ? c.id : null };
    if (!l.tipos.length) l.tipos = ['normal'];
    cacheLuch.set(clave, l);
    return l;
  }
  const rng = s => () => (s = (s * 16807) % 2147483647) / 2147483647;
  const barajar = (arr, azar) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(azar() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  // Combate en fila: el que gana sigue con la vida que le queda; «As en la Manga» solo sirve una vez
  function combateT(mios, rivs) {
    mios = [...mios]; rivs = [...rivs];
    let i = 0, j = 0, fa = 1, fb = 1;
    while (i < mios.length && j < rivs.length) {
      const r = dueloF(mios[i], fa, rivs[j], fb);
      if (mios[i].aguanta) mios[i] = { ...mios[i], aguanta: false };
      if (rivs[j].aguanta) rivs[j] = { ...rivs[j], aguanta: false };
      if (r.ganaA) { fa = Math.max(r.fa, 0.005); j++; fb = 1; } else { fb = Math.max(r.fb, 0.005); i++; fa = 1; }
    }
    return { gana: j >= rivs.length, caidos: j };
  }
  // Azar «con nombre»: cada número sale de mezclar (semilla, combate, hueco, clave del rival), no de una secuencia.
  // Así el sorteo no depende del orden del banco, y un rival nuevo solo cambia los pocos combates en los que le toca salir
  // (con una secuencia normal, añadir uno cambiaba todos los combates y la recomendación bailaba en cada recarga).
  const fmix = h => { h = Math.imul(h ^ (h >>> 16), 0x85ebca6b); h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35); return (h ^ (h >>> 16)) >>> 0; };
  const hash32 = str => { let h = 2166136261; for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619); return fmix(h); };
  // Combates de prueba: equipos rivales de 6 sin repetir, sacados del banco según su peso, y un orden de salida sorteado para los dos
  function simulaciones(...args) {
    const it = simulacionesPasos(...args);
    let r;
    while (!(r = it.next()).done);
    return r.value;
  }
  function* simulacionesPasos(pool, n, semilla, fijos) {
    fijos = fijos || [];
    const hs = pool.map(p => hash32(p.k)), inv = pool.map(p => 1 / p.w);
    // primero se sortea si el hueco es de un rival visto o del banco genérico (así, cuando cambia lo que pesa cada parte,
    // solo cambian los huecos que estaban en el límite) y luego cuál de esa parte
    const gen = pool.map(p => p.k[0] === 'S');
    const pesoG = pool.reduce((x, p, i) => x + (gen[i] ? p.w : 0), 0), parteG = pesoG / pool.reduce((x, p) => x + p.w, 0);
    const out = [];
    for (let s = 0; s < n; s++) {
      if (s % 25 === 24) yield;
      const rivs = [...fijos], usados = new Set();
      for (let k = rivs.length; k < 6 && usados.size < pool.length; k++) {
        const hk = fmix(Math.imul(semilla, 0x27d4eb2d) ^ Math.imul(s * 8 + k + 1, 0x165667b1));
        const quiereG = fmix(hk ^ 0x5bd1e995) / 4294967296 < parteG;
        // carrera exponencial: gana el de menor −ln(u)/peso (sale con probabilidad proporcional a su peso)
        let mejor = -1;
        for (const deUnaParte of [parteG > 0 && parteG < 1, false]) {
          let min = Infinity;
          for (let i = 0; i < pool.length; i++) {
            if (usados.has(i) || (deUnaParte && gen[i] !== quiereG)) continue;
            const v = -Math.log((fmix(hs[i] ^ hk) + 0.5) / 4294967296) * inv[i];
            if (v < min) { min = v; mejor = i; }
          }
          if (mejor >= 0) break;
        }
        usados.add(mejor);
        rivs.push(pool[mejor].l);
      }
      const azar = rng(1 + (fmix(Math.imul(semilla, 7919) ^ (s + 1)) % 2147483645));
      out.push({ rivs: barajar(rivs, azar), perm: barajar([0, 1, 2, 3, 4, 5], azar) });
    }
    return out;
  }
  // `n`: cuántos salen de cada lado (6 en la Torre; 3 en los Tronos, los primeros del sorteo)
  function notaEquipo(equipo, sims, n = 6) {
    let g = 0, k = 0;
    for (const s of sims) {
      const r = combateT(s.perm.filter(i => i < equipo.length).slice(0, n).map(i => equipo[i]), n < 6 ? s.rivs.slice(0, n) : s.rivs);
      if (r.gana) g++;
      k += r.caidos;
    }
    return { g: g / sims.length, k: k / sims.length / n };
  }
  const valorN = n => n.g + n.k * 0.15;

  // Rivales vistos en «Retar» (tres de seis a la vista, con sus estadísticas y objeto). Se guardan por liga y por
  // jugador (lo último que se le vio): ver al mismo rival muchas veces no hace que cuente más.
  const LS_RIV = 'axt-torre-rivales';
  function registroRivales(est) {
    const g = lsGet(LS_RIV, {});
    const m = g[est.modo] || (g[est.modo] = { rivales: {}, pokes: {} });
    let cambio = false;
    // antes se guardaban por jugador y día: se queda lo más reciente de cada jugador
    for (const [clave, v] of Object.entries(m.rivales)) {
      if (!clave.includes('|')) continue;
      const u = clave.split('|')[0];
      if (!m.rivales[u] || m.rivales[u].t < v.t) m.rivales[u] = v;
      delete m.rivales[clave];
      cambio = true;
    }
    for (const r of est.rivales || []) {
      const claves = [];
      for (const p of r.equipo || []) {
        if (p.oculto || !p.stats || !p.tipo1) continue;
        const k = `${p.sprite}|${p.itemId || ''}|${p.stats.total}`;
        m.pokes[k] = { sprite: p.sprite, nombre: p.nombre, tipo1: p.tipo1, tipo2: p.tipo2 || null, stats: p.stats, itemId: p.itemId || null };
        claves.push(k);
      }
      if (!claves.length) continue;
      claves.sort();
      const antes = m.rivales[String(r.userId)];
      if (antes && antes.claves.join() === claves.join()) continue;
      m.rivales[String(r.userId)] = { t: Date.now(), claves };
      cambio = true;
    }
    if (cambio) {
      const ents = Object.entries(m.rivales).sort((a, b) => b[1].t - a[1].t).slice(0, 200);
      m.rivales = Object.fromEntries(ents);
      const usadas = new Set(ents.flatMap(([, v]) => v.claves));
      for (const k of Object.keys(m.pokes)) if (!usadas.has(k)) delete m.pokes[k];
      lsPut(LS_RIV, g);
    }
    const peso = {};
    for (const r of Object.values(m.rivales)) for (const k of r.claves) peso[k] = (peso[k] || 0) + 1;
    return { equipos: Object.keys(m.rivales).length, lista: Object.entries(peso).filter(([k]) => m.pokes[k]).sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, w]) => ({ k, p: m.pokes[k], w })) };
  }
  // Base media (por estadística) de tus mejores candidatos: así el banco genérico es tan fuerte como la liga
  function baseMediaDe(cands) {
    const top = [...cands].sort((a, b) => b.stats.total - a.stats.total).slice(0, 12);
    if (!top.length) return 80;
    return top.reduce((x, c) => { const s = sinObjeto(c.stats, c.itemId); return x + ((s.ps - 64) / 1.5 + s.ataque - 5 + s.defensa - 5 + 2 * (s.especial - 5) + s.velocidad - 5) / 6; }, 0) / top.length;
  }
  // En la liga clásica todo el mundo lleva lo mejor: solo cuentan los tier S y A (tuyos y de los rivales)
  const soloSA = est => est.modo === 'clasico';
  const esSA = c => { const l = tierTorre(c).letra; return l === 'S' || l === 'A'; };
  function poolTorre(est, cands) {
    const reg = registroRivales(est);
    const clasico = soloSA(est);
    const vistos = reg.lista
      .filter(x => !clasico || esSA(x.p))
      .map(x => ({ k: 'V|' + x.k, l: luchadorT(x.p), w: x.w * (clasico && tierTorre(x.p).letra === 'S' ? 2 : 1) }));
    const pesoVistos = vistos.reduce((x, v) => x + v.w, 0);
    // la fuerza del banco genérico se redondea para que no cambie por cualquier Pokémon nuevo
    const bm = Math.round(baseMediaDe(cands) / 5) * 5;
    const sint = GEN.flatMap(t => PERFILES.map((pf, i) => ({ k: 'S|' + t + '|' + i, l: { ...stats(pf.map(v => Math.max(20, Math.round(v + bm - 80))), 50), L: 50, tipos: t.split('/'), num: 0 }, w: 1 })));
    // cuantos más jugadores distintos se han visto, menos pesa el banco genérico (poco a poco: 100% sin ninguno, 50% con 10, 30% como mínimo)
    const parte = Math.max(clasico ? 0.15 : 0.3, 1 / (1 + reg.equipos / (clasico ? 6 : 10)));
    const pesoSint = pesoVistos ? pesoVistos * parte / (1 - parte) / sint.length : 1;
    for (const s of sint) s.w = pesoSint;
    return { pool: [...vistos, ...sint], vistos: vistos.length, equipos: reg.equipos, bm };
  }

  // Un candidato por especie (el más fuerte) y solo los que valen en esta liga
  function candidatosUnicos(est) {
    const todos = candidatosUnicosTodos(est);
    if (!soloSA(est)) return todos;
    const sa = todos.filter(esSA);
    return sa.length >= 6 ? sa : todos.filter(c => ['S', 'A', 'B'].includes(tierTorre(c).letra));
  }
  function candidatosUnicosTodos(est) {
    const porEspecie = {};
    for (const c of est.candidatos) {
      if (c.vale === false || !c.stats) continue;
      const k = c.especie || c.nombre;
      if (!porEspecie[k] || c.stats.total > porEspecie[k].stats.total) porEspecie[k] = c;
    }
    return Object.values(porEspecie).sort((a, b) => b.stats.total - a.stats.total || (String(a.id) < String(b.id) ? -1 : 1));
  }
  const cacheTierT = new Map();
  function tierTorre(c) {
    const num = numSrc(c.sprite), k = (c.id != null ? c.id : c.sprite) + '|' + c.itemId + '|' + c.stats.total + '|' + (num && datos[num] ? 1 : 0);
    if (cacheTierT.has(k)) return cacheTierT.get(k);
    const yo = luchadorT(c);
    const pct = BANCO.reduce((x, r) => x + duelo(yo, r), 0) / BANCO.length;
    const [letra, , color] = TIERS.find(([, min]) => pct >= min);
    const t = { letra, color, pct };
    cacheTierT.set(k, t);
    return t;
  }

  // Mejor equipo. Candidatos: los 28 mejores sueltos (contra todo el banco, sin sorteo) y, además, los 2 que mejor frenan
  // a cada una de las 12 amenazas más vistas en «Retar» (especialistas que solos no destacan pero tapan un hueco).
  // Se monta uno a uno (cada uno se elige por lo que suma a los que ya están: así cuentan tipos, debilidades compartidas
  // y papeles) y luego se prueban cambios de uno en uno, también desde lo recomendado la última vez. La búsqueda usa
  // 500 combates; la comparación final, los 1000. Lo anterior se sigue recomendando salvo que lo nuevo gane claramente
  // más (así no cambia por diferencias que están dentro del margen de error).
  const MARGEN_REC = 0.015;
  function sueltosTorre(unicos, pool, sinObj) {
    const pesoT = pool.reduce((x, p) => x + p.w, 0);
    return unicos.map(c => {
      const l = luchadorT(c, sinObj ? null : undefined);
      let v = 0;
      for (const p of pool) v += ventaja(l, p.l) * p.w;
      return { c, v: v / pesoT };
    }).sort((a, b) => b.v - a.v || b.c.stats.total - a.c.stats.total);
  }
  // `n`: cuántos salen de cada lado; `tam`: cuántos lleva el equipo. Va por pasos (generador) para poder repartir el
  // cálculo en trocitos y no congelar la página (ver `correrPasos`); `mejorEquipo` lo hace de una vez.
  // `sinObj`: sin objetos (los Tronos no los usan)
  function* mejorEquipoPasos(unicos, sims, pool, previo, n = 6, tam = 6, sinObj = false) {
    const LT = c => luchadorT(c, sinObj ? null : undefined);
    const sueltos = sueltosTorre(unicos, pool, sinObj);
    const pre = sueltos.slice(0, 28).map(x => x.c);
    const amenazas = pool.filter(p => p.k[0] === 'V').sort((a, b) => b.w - a.w || (a.k < b.k ? -1 : 1)).slice(0, 12);
    for (const am of amenazas) {
      const frenan = unicos.map(c => ({ c, v: ventaja(LT(c), am.l) })).sort((a, b) => b.v - a.v || b.c.stats.total - a.c.stats.total);
      for (const f of frenan.slice(0, 2)) if (!pre.includes(f.c)) pre.push(f.c);
    }
    yield;
    const simsB = sims.length > 500 ? sims.slice(0, 500) : sims;
    const notaCon = (eq, ss) => valorN(notaEquipo(eq.map(c => LT(c)), ss, n));
    const nota = eq => notaCon(eq, simsB);
    function* mejorar(eq) {
      let v0 = nota(eq);
      for (let vuelta = 0; vuelta < 4; vuelta++) {
        let mejoro = false;
        for (let i = 0; i < eq.length; i++) {
          let mejor = null;
          for (const c of pre) {
            if (eq.includes(c)) continue;
            const v = nota(eq.map((x, k) => (k === i ? c : x)));
            yield;
            if (v > v0 + 0.002 && (!mejor || v > mejor.v)) mejor = { c, v };
          }
          if (mejor) { eq = eq.map((x, k) => (k === i ? mejor.c : x)); v0 = mejor.v; mejoro = true; }
        }
        if (!mejoro) break;
      }
      return { eq, v: v0 };
    }
    let eq = [];
    while (eq.length < Math.min(tam, pre.length)) {
      let mejor = null;
      for (const c of pre) { if (eq.includes(c)) continue; const v = nota([...eq, c]); yield; if (!mejor || v > mejor.v) mejor = { c, v }; }
      eq.push(mejor.c);
    }
    let r = yield* mejorar(eq);
    const prev = (previo || []).map(id => unicos.find(c => String(c.id) === String(id))).filter(Boolean);
    let seMantiene = false;
    if (prev.length === tam && r.eq.length === tam) {
      for (const c of prev) if (!pre.includes(c)) pre.push(c);
      const r2 = yield* mejorar(prev);
      if (r2.v > r.v) r = r2;
      const vp = notaCon(prev, sims), vr = notaCon(r.eq, sims);
      if (vr < vp + MARGEN_REC) { r = { eq: prev }; seMantiene = true; }
    }
    return { eq: r.eq, sueltos, seMantiene };
  }
  function mejorEquipo(...args) {
    const it = mejorEquipoPasos(...args);
    let r;
    while (!(r = it.next()).done);
    return r.value;
  }
  // Ejecuta un generador en trozos de ~20 ms, devolviendo el control a la página entre trozo y trozo (sin lag)
  function correrPasos(gen) {
    return new Promise((ok, mal) => {
      const trozo = () => {
        const t0 = performance.now();
        try {
          while (performance.now() - t0 < 20) { const r = gen.next(); if (r.done) { ok(r.value); return; } }
        } catch (e) { mal(e); return; }
        setTimeout(trozo, 0);
      };
      setTimeout(trozo, 0);
    });
  }
  const idObjetoT = (id, nombre) => (id && OBJETOS[id] ? id : (nombre && NOMBRE_OBJ[normT(nombre)]) || null);
  // Qué estadística le conviene subir en la Torre (+10% en cada una contra el banco de rivales)
  function potenciarT(l, pool) {
    const pesoT = pool.reduce((x, p) => x + p.w, 0);
    const nota = y => pool.reduce((x, p) => x + ventaja(y, p.l) * p.w, 0) / pesoT;
    const v0 = nota(l), sube = (k, n) => ({ n, gana: nota({ ...l, [k]: Math.round(l[k] * 1.1) }) - v0 });
    const pr = [sube('hp', 'PS'), l.fis ? sube('atk', 'Ataque') : sube('esp', 'Especial'), sube('def', 'Defensa'), sube('spe', 'Velocidad')];
    if (l.fis) pr.push(sube('esp', 'Especial'));
    return pr.sort((a, b) => b.gana - a.gana);
  }

  // Selección actual (los botones marcados con su número 1–6) → ids de candidato
  function seleccionTorre() {
    const ids = [];
    for (const li of $$('main ul.grid > li')) {
      const b = li.querySelector(':scope > button');
      const n = b && b.querySelector(':scope > span.bg-hoja-500');
      const f = n && fibraDe(li);
      if (f && f.key != null) ids[parseInt(n.textContent, 10) - 1] = String(f.key);
    }
    return ids.filter(Boolean);
  }
  // Equipo guardado («Defendiendo ahora») como luchadores, con el objeto que tenía al guardarlo
  function equipoGuardadoC(est) {
    return (est.miEquipo || []).map(m => {
      const c = est.candidatos.find(x => String(x.id) === String(m.ownedId)) || est.candidatos.find(x => x.sprite === m.sprite);
      return c ? { c, item: idObjetoT(m.itemId, m.itemNombre) || undefined } : null;
    }).filter(Boolean);
  }
  const equipoGuardado = est => equipoGuardadoC(est).map(x => luchadorT(x.c, x.item));

  function insigniasTorre(est) {
    const porId = {};
    for (const c of est.candidatos) porId[String(c.id)] = c;
    for (const li of $$('main ul.grid > li')) {
      const b = li.querySelector(':scope > button');
      const f = b && fibraDe(li);
      const c = f && porId[String(f.key)];
      if (!c || !c.stats) continue;
      const t = tierTorre(c);
      const firma = c.id + '|' + c.itemId + '|' + c.stats.total + '|' + t.letra;
      if (b.dataset.axtNum === firma && b.querySelector(':scope > .axt-tier')) continue;
      const viejo = b.querySelector(':scope > .axt-tier');
      if (viejo) viejo.remove();
      const s = insignia(t);
      s.title = `Tier ${t.letra}: gana el ${Math.round(t.pct * 100)}% de los duelos 1 contra 1 a Nv.50${c.itemId && OBJETOS[c.itemId] ? ' (con su objeto)' : ''}`;
      s.style.position = 'absolute'; s.style.left = '-4px'; s.style.bottom = '-4px';
      b.appendChild(s);
      b.dataset.axtNum = firma;
    }
  }

  /* ------------------------------------------------------------------ *
   *  APRENDER DE LOS COMBATES DE LA TORRE
   *  Al ver un combate se lee cada golpe del log: de qué lado es (borde rojo: el rival), quién pega, el tipo, si es
   *  físico o especial, si es crítico y cuánto quita. Con las estadísticas exactas de los dos (las tuyas, de tu equipo
   *  guardado; las del rival, de lo visto en «Retar», solo si no hay dudas) cada golpe da una muestra de daño real contra
   *  el modelo. Con ellas se afinan la fuerza de los golpes, lo que valen «muy eficaz» y «poco eficaz» y los críticos.
   * ------------------------------------------------------------------ */
  const LS_LOGT = 'axt-torre-logs';
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const medianaT = a => { const x = [...a].sort((p, q) => p - q), n = x.length; return n % 2 ? x[(n - 1) / 2] : (x[n / 2 - 1] + x[n / 2]) / 2; };
  let infoCal = { golpes: 0, combates: 0, aciertoTipo: null };
  function calcularCal() {
    const todos = Object.values(lsGet(LS_LOGT, {}));
    const g = todos.flatMap(x => x.g || []), crit = todos.flatMap(x => x.c || []);
    const hits = todos.reduce((x, c) => x + (c.n || 0), 0), nCrit = crit.length;
    // mezcla lo de partida con lo visto: con pocas muestras manda lo de partida
    const mezcla = (prior, arr, n0) => (arr.length ? Math.exp((Math.log(prior) * n0 + Math.log(medianaT(arr)) * arr.length) / (n0 + arr.length)) : prior);
    const k = clamp(mezcla(1, g.filter(x => !x.s && !x.r).map(x => x.d / x.b), 10), 0.7, 1.4);
    const se = clamp(mezcla(MODELO.se, g.filter(x => x.s === 1 && !x.r).map(x => x.d / (x.b * k)), 8), 1.3, 2.1);
    const nve = clamp(mezcla(MODELO.nve, g.filter(x => x.r === 1 && !x.s).map(x => x.d / (x.b * k)), 8), 0.4, 0.8);
    const critP = clamp((nCrit + MODELO.critProb * 40) / (hits + 40), 0.02, 0.25);
    const critX = clamp(mezcla(MODELO.critX, crit, 6), 1.2, 2.2);
    const nuevo = { k, se, nve, critP, critX };
    const ok = todos.reduce((x, c) => x + (c.ok || 0), 0), tot = todos.reduce((x, c) => x + (c.tot || 0), 0);
    infoCal = { golpes: g.length, combates: todos.length, aciertoTipo: tot ? ok / tot : null };
    const cambia = Object.keys(nuevo).some(key => Math.abs((CAL[key] || 0) - nuevo[key]) > 1e-9);
    CAL = nuevo;
    if (cambia) {
      // todo lo calculado con el modelo anterior se tira
      memoG = new WeakMap();
      for (const key of Object.keys(cacheTier)) delete cacheTier[key];
      cacheTierT.clear();
      memoRival.clear();
    }
  }
  const firmaCal = () => [CAL.k, CAL.se, CAL.nve, CAL.critP, CAL.critX].map(x => x.toFixed(3)).join(',');
  function leerLogTorre() {
    const caja = $$('main div.overflow-y-auto').find(d => d.querySelector(':scope > .animate-slide-up') && /sale al paso de/.test(d.textContent || ''));
    if (!caja) return null;
    const ev = [];
    for (const el of caja.children) {
      const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (el.tagName === 'P') { ev.push({ msg: t }); continue; }
      const linea = $$('span.block', el).map(x => x.textContent.trim()).find(x => / · /.test(x));
      const m = t.match(/[−-]\s*(\d+)\s*PS/);
      if (!linea || !m) continue;
      const tm = linea.match(/\(([^)]+)\)\s*$/);
      ev.push({ mio: !/border-rojo/.test(el.className), at: linea.split(' · ')[0].trim(), tipo: tm ? tipoDe(tm[1]) : null, fis: /F[ÍI]S/.test(t), crit: /cr[ií]tico/i.test(t), forcejeo: /forcejeo/i.test(t), d: parseInt(m[1], 10) });
    }
    return ev;
  }
  // Luchador de un nombre del log: los tuyos, de tu equipo guardado; los del rival, de los vistos (si todos coinciden)
  function luchadorLog(est, nombre, mio) {
    if (mio) {
      const m = (est.miEquipo || []).find(x => x.nombre === nombre);
      const c = m && (est.candidatos.find(x => String(x.id) === String(m.ownedId)) || est.candidatos.find(x => x.sprite === m.sprite));
      return c ? luchadorT(c, m.itemId || (m.itemNombre && NOMBRE_OBJ[normT(m.itemNombre)]) || null) : null;
    }
    const g = (lsGet(LS_RIV, {})[est.modo] || {}).pokes || {};
    const vistos = [...(est.rivales || []).flatMap(r => r.equipo || []), ...Object.values(g)].filter(p => p && !p.oculto && p.stats && p.nombre === nombre);
    const distintos = new Set(vistos.map(p => p.stats.total + '|' + (p.itemId || '')));
    return distintos.size === 1 ? luchadorT(vistos[0]) : null;
  }
  function aprenderTorre(est) {
    const ev = leerLogTorre();
    if (!ev || !ev.length) return;
    let mio = null, riv = null;
    const g = [], c = [];
    let n = 0, ok = 0, tot = 0;
    for (const e of ev) {
      if (e.msg) {
        let m;
        if ((m = e.msg.match(/^(.+?) \(Nv\.\d+\) sale al paso de (.+?) \(Nv/))) { mio = m[1]; riv = m[2]; }
        else if ((m = e.msg.match(/^El rival saca a (.+?) \(Nv/))) riv = m[1];
        else if ((m = e.msg.match(/^Relevas con (.+?) \(Nv/))) mio = m[1];
        continue;
      }
      if (!mio || !riv || e.at !== (e.mio ? mio : riv)) continue;
      n++;
      if (e.forcejeo || !e.tipo) continue;
      const A = luchadorLog(est, e.at, e.mio), D = luchadorLog(est, e.mio ? riv : mio, !e.mio);
      if (!A || !D) continue;
      // ¿acierta el modelo el tipo de ataque que usa?
      tot++;
      if (tipoAtaque(A, D).t === e.tipo) ok++;
      let s = 0, r = 0, cero = false;
      for (const x of D.tipos) { const v = (TABLA[e.tipo] || {})[x] ?? 1; if (v === 0) cero = true; else if (v > 1) s++; else if (v < 1) r++; }
      if (cero) continue;
      const propio = A.tipos.includes(e.tipo), At = e.fis ? A.atk : A.esp, De = e.fis ? D.def : D.esp;
      const b = ((2 * A.L / 5 + 2) * MODELO.potencia * At / De / 50 + 2) * (propio ? 1.5 : 1);
      if (e.crit) c.push(e.d / (b * CAL.k * Math.pow(CAL.se, s) * Math.pow(CAL.nve, r)));
      else g.push({ d: e.d, b: +b.toFixed(2), s, r });
    }
    if (!n) return;
    const numeros = ev.filter(x => !x.msg).slice(0, 10).map(x => x.d).join(',');
    const id = hash32((ev.find(x => x.msg) || {}).msg + '|' + numeros);
    const todos = lsGet(LS_LOGT, {});
    const prev = todos[id];
    if (prev && prev.n >= n) return;
    todos[id] = { t: Date.now(), n, g, c, ok, tot };
    for (const key of Object.keys(todos).sort((x, y) => todos[y].t - todos[x].t).slice(40)) delete todos[key];
    lsPut(LS_LOGT, todos);
    calcularCal();
  }

  let memoTorre = null, calculandoTorre = false, esperaDatosT = 0;
  // combates de prueba por equipo (siempre los mismos para todos los equipos que se comparan) y última recomendación
  const N_SIMS = 1000, LS_REC = 'axt-torre-rec';
  const pctT = x => Math.round(x * 100) + '%';
  const nombreObj = id => (OBJETOS[id] ? OBJETOS[id].n : id);
  const num1 = x => x.toFixed(1).replace('.', ',');
  // Composición de un equipo: debilidades que se repiten, tipos a los que nadie pega fuerte, las amenazas más vistas que
  // casi nadie frena y el papel de cada uno (velocidad, golpes que necesita, golpes que aguanta y lo que aporta)
  function composicion(eqL, sims, pool) {
    const pesoT = pool.reduce((x, p) => x + p.w, 0);
    const media = f => pool.reduce((x, p) => x + f(p.l) * p.w, 0) / pesoT;
    // mediana ponderada (la media se la llevan los pocos casos de Forcejeo)
    const mediana = f => { const v = pool.map(p => [f(p.l), p.w]).sort((a, b) => a[0] - b[0]); let acc = 0; for (const [x, w] of v) { acc += w; if (acc >= pesoT / 2) return x; } return v.length ? v[v.length - 1][0] : 0; };
    const debiles = [];
    for (const t of TIPOS) {
      const deb = eqL.filter(l => eficacia(t, l.tipos) > 1), res = eqL.filter(l => eficacia(t, l.tipos) < 1);
      if (deb.length >= 3 && deb.length - res.length >= 2) debiles.push(`${deb.length} débiles a <b>${bonito(t)}</b> (${deb.map(l => l.nombre).join(', ')})${res.length ? ` y solo ${res.length === 1 ? 'uno lo resiste' : res.length + ' lo resisten'}` : ' y nadie lo resiste'}`);
    }
    const sinCobertura = TIPOS.filter(t => !eqL.some(l => { const a = tipoAtaque(l, { tipos: [t] }); return a.propio && a.e > 1; }));
    // amenazas: especies vistas en «Retar» (todas sus variantes juntas), las 12 que más salen
    const porEspecie = {};
    for (const p of pool) if (p.k[0] === 'V') (porEspecie[p.l.nombre] = porEspecie[p.l.nombre] || []).push(p);
    const amenazas = [];
    for (const [nombre, vs] of Object.entries(porEspecie).map(([n, v]) => [n, v, v.reduce((x, p) => x + p.w, 0)]).sort((a, b) => b[2] - a[2] || (a[0] < b[0] ? -1 : 1)).slice(0, 12).map(([n, v]) => [n, v])) {
      const pw = vs.reduce((x, p) => x + p.w, 0);
      const frenan = eqL.filter(l => vs.reduce((x, p) => x + ventaja(l, p.l) * p.w, 0) / pw > 0.5);
      if (frenan.length <= 1) amenazas.push(`<b>${nombre}</b>${frenan.length ? ` (solo lo frena ${frenan[0].nombre})` : ' (no lo frena ninguno)'}`);
    }
    const base = valorN(notaEquipo(eqL, sims));
    const papeles = eqL.map((l, i) => {
      const vel = media(r => (l.spe > r.spe ? 1 : l.spe === r.spe ? 0.5 : 0));
      const tumba = mediana(r => 1 / golpe(l, r)), aguanta = mediana(r => 1 / golpe(r, l));
      const papel = aguanta >= tumba * 1.35 ? 'aguanta' : vel >= 0.6 && tumba <= aguanta ? 'barredor rápido' : vel < 0.4 && tumba <= aguanta ? 'pegador lento' : 'equilibrado';
      const sin = notaEquipo(eqL.filter((_, k) => k !== i), sims);
      return { l, vel, tumba, aguanta, papel, aporta: base - valorN(sin), sinG: sin.g, pot: potenciarT(l, pool) };
    });
    return { debiles, sinCobertura, amenazas, papeles };
  }
  // Lo que necesita el cálculo (y su firma: si cambia algo desde el último cálculo, se ofrece recalcular)
  function datosTorre(est) {
    const unicos = candidatosUnicos(est);
    // estadísticas base (para saber quién pega cuerpo a cuerpo y quién a distancia)
    const nums = [...new Set([...unicos, ...Object.values(((lsGet(LS_RIV, {})[est.modo] || {}).pokes) || {})].map(c => numSrc(c.sprite)).filter(Boolean))];
    const faltan = nums.filter(n => !datos[n]);
    faltan.forEach(pedir);
    const firma = est.modo + '|' + est.candidatos.length + '|' + est.candidatos.reduce((x, c) => x + (c.stats ? c.stats.total : 0) + (c.itemId ? c.itemId.length : 0), 0) + '|' + Object.keys(((lsGet(LS_RIV, {})[est.modo] || {}).rivales) || {}).length + '|' + firmaCal() + '|' + (nums.length - faltan.length);
    return { unicos, nums, faltan, firma };
  }
  let progTorre = '';
  const pausaT = () => new Promise(r => setTimeout(r, 30));
  function avanceTorre(t) { progTorre = t; const p = document.querySelector('#axt-torre .axt-prog'); if (p) p.textContent = t; }
  // Se calcula solo al pulsar el botón, a trocitos de ~20 ms (la página no se congela)
  async function calcularTorre() {
    if (calculandoTorre) return;
    let est = estadoTorre();
    if (!est) return;
    calculandoTorre = true; progTorre = 'Preparando…';
    programar();
    try {
      await pausaT();
      // se espera un poco a las estadísticas base que falten (como mucho 10 s)
      let D = datosTorre(est);
      for (let i = 0; D.faltan.length && i < 20; i++) { avanceTorre(`Buscando las estadísticas de ${D.faltan.length} Pokémon…`); await new Promise(r => setTimeout(r, 500)); est = estadoTorre() || est; D = datosTorre(est); }
      const { unicos, nums, faltan, firma } = D;
      avanceTorre('Preparando los rivales…'); await pausaT();
      const { pool, vistos, equipos, bm } = poolTorre(est, unicos);
      avanceTorre('Sorteando 1000 combates de prueba…'); await pausaT();
      const sims = await correrPasos(simulacionesPasos(pool, N_SIMS, 7));
      const recs = lsGet(LS_REC, {}), prev = recs[est.modo] || {};
      // con los mismos datos que la última vez no se repite la búsqueda (sale lo mismo)
      const datosCalc = hash32(JSON.stringify([unicos.map(c => c.id + '|' + c.stats.total), est.candidatos.map(c => c.itemId || ''), pool.map(p => p.k + ':' + p.w.toFixed(4)), firmaCal(), nums.length - faltan.length]));
      let eq, sueltos, seMantiene = false, items = null;
      if (prev.datos === datosCalc && prev.ids && prev.ids.every(id => unicos.some(c => String(c.id) === id))) {
        eq = prev.ids.map(id => unicos.find(c => String(c.id) === id));
        sueltos = sueltosTorre(unicos, pool);
        seMantiene = !!prev.seMantiene;
      } else {
        avanceTorre('Probando equipos…'); await pausaT();
        ({ eq, sueltos, seMantiene } = await correrPasos(mejorEquipoPasos(unicos, sims, pool, prev.ids)));
      }
      // el equipo guardado también compite: nunca se recomienda algo peor que lo que ya tienes
      let esGuardado = false;
      const gC = equipoGuardadoC(est);
      if (gC.length === 6) {
        const vG = valorN(notaEquipo(gC.map(x => luchadorT(x.c, x.item)), sims));
        const vR = valorN(notaEquipo(eq.map(c => luchadorT(c)), sims));
        if (vG >= vR - 0.005) { eq = gC.map(x => x.c); items = gC.map(x => x.item); esGuardado = true; }
      }
      let eqL = eq.map((c, i) => luchadorT(c, items ? items[i] : undefined));
      // el orden: el que más gana si salieran en fila
      avanceTorre('Buscando el mejor orden de salida…'); await pausaT();
      const orden = await correrPasos(mejorOrdenPasos(eqL, sims.slice(0, 250)));
      eq = orden.map(i => eq[i]); eqL = orden.map(i => eqL[i]); if (items) items = orden.map(i => items[i]);
      const ids = eq.map(c => String(c.id));
      const nota = notaEquipo(eqL, sims);
      recs[est.modo] = { ids, datos: datosCalc, seMantiene: seMantiene || esGuardado };
      lsPut(LS_REC, recs);
      avanceTorre('Mirando la composición…'); await pausaT();
      const comp = composicion(eqL, sims.slice(0, 500), pool);
      memoTorre = { firma, pool, vistos, equipos, bm, sims, eq, sueltos, nota, seMantiene, esGuardado, comp, porSel: {}, t: Date.now() };
      memoRival.clear();
    } catch (e) { console.warn('[axt torre]', e); progTorre = '⚠️ Error: ' + (e && e.message); }
    calculandoTorre = false;
    programar();
  }
  // Tu selección: lo que gana, quién aporta menos y el cambio que más sube (al pulsar «Analizar mi selección»)
  function* analizarSeleccionPasos(M, est, sel) {
    const cs = sel.map(id => est.candidatos.find(c => String(c.id) === id)).filter(Boolean);
    const r = { cs };
    if (!cs.length) return r;
    const sims = M.sims.slice(0, 600);
    // los que están en el equipo guardado juegan con el objeto que tienen allí (si su ficha no enseña otro)
    const itemDe = c => { if (c.itemId) return undefined; const m = (est.miEquipo || []).find(x => String(x.ownedId) === String(c.id)); return (m && idObjetoT(m.itemId, m.itemNombre)) || undefined; };
    const eqL = cs.map(c => luchadorT(c, itemDe(c)));
    r.nota = notaEquipo(eqL, sims);
    yield;
    if (cs.length === 6) {
      // quién aporta menos y el cambio que más sube
      const aporte = [];
      for (let i = 0; i < cs.length; i++) { aporte.push({ c: cs[i], i, baja: valorN(r.nota) - valorN(notaEquipo(eqL.filter((_, k) => k !== i), sims)) }); yield; }
      aporte.sort((a, b) => a.baja - b.baja);
      r.flojo = aporte[0];
      let cambio = null;
      const pre = M.sueltos.slice(0, 20).map(x => x.c).filter(c => !cs.some(y => (y.especie || y.nombre) === (c.especie || c.nombre)));
      for (const c of pre) {
        const n = notaEquipo(eqL.map((x, k) => (k === r.flojo.i ? luchadorT(c) : x)), sims);
        if (!cambio || valorN(n) > valorN(cambio.n)) cambio = { c, n };
        yield;
      }
      if (cambio && cambio.n.g > r.nota.g + 0.01) r.cambio = cambio;
      r.comp = composicion(eqL, sims.slice(0, 400), M.pool);
    }
    return r;
  }
  let analizandoSel = false;
  async function analizarSeleccion() {
    const M = memoTorre, est = estadoTorre();
    if (!M || !M.eq || !est || analizandoSel) return;
    analizandoSel = true; programar();
    const sel = seleccionTorre();
    try { M.porSel[sel.join(',')] = await correrPasos(analizarSeleccionPasos(M, est, sel)); }
    catch (e) { console.warn('[axt torre]', e); }
    analizandoSel = false; programar();
  }
  function panelTorre(est) {
    const rejilla = $$('main ul.grid').find(u => u.querySelector(':scope > li > button'));
    const tarjeta = rejilla && rejilla.closest('.tarjeta');
    let caja = document.getElementById('axt-torre');
    if (!tarjeta) { if (caja) caja.remove(); return; }
    if (!caja) {
      caja = document.createElement('section');
      caja.id = 'axt-torre';
      caja.className = 'tarjeta space-y-2 p-3';
      caja.setAttribute('data-ax-ignore', '1');
    }
    kStyle('axt-kit', '#axt-torre', '#7C3AED');
    if (caja.nextElementSibling !== tarjeta) tarjeta.insertAdjacentElement('beforebegin', caja);
    const M = memoTorre && memoTorre.eq ? memoTorre : null;
    const pintar = (html, badge, eventos) => {
      if (caja.dataset.html === html) return;
      caja.innerHTML = html; caja.dataset.html = html;
      kBadge(caja.querySelector('.k-badge'), badge[0], badge[1]);
      const bc = caja.querySelector('.axt-calcular');
      if (bc) bc.addEventListener('click', e => { e.preventDefault(); calcularTorre(); });
      if (eventos) eventos();
    };
    const botonCalc = (txt) => `<button type="button" class="axt-calcular boton-principal w-full !py-2.5 text-sm" ${calculandoTorre ? 'disabled' : ''}>${calculandoTorre ? '⏳ Calculando…' : txt}</button>${calculandoTorre ? `<p class="axt-prog text-center text-[11px] font-bold text-tinta-500">${progTorre}</p>` : progTorre.startsWith('⚠️') ? `<p class="text-center text-[11px] font-bold text-rojo-600">${progTorre}</p>` : ''}`;
    // sin calcular todavía: solo el botón (no se calcula nada solo, así no hay lag)
    if (!M) {
      pintar(`${kHead('🗼', 'Análisis de la Torre', est.modo === 'clasico' ? 'Liga clásica' : 'Liga ' + est.modo)}
        <p class="text-[11px] font-semibold text-tinta-500">Busca el mejor equipo con todo lo que tienes, contra lo que se ve en «Retar» (entra antes para que vea rivales) y un banco de todos los tipos. Tarda unos segundos.</p>
        ${botonCalc('🧮 Calcular el mejor equipo')}`, calculandoTorre ? ['on', 'CALCULANDO'] : ['off', 'SIN CALCULAR']);
      return;
    }
    const D = { firma: datosTorre(est).firma };
    const viejo = D.firma !== M.firma;
    const sel = seleccionTorre();
    const S = M.porSel[sel.join(',')];
    const guardado = equipoGuardado(est);
    if (M.notaGuardado === undefined || M.claveGuardado !== JSON.stringify((est.miEquipo || []).map(m => m.ownedId + '|' + m.itemId))) {
      M.claveGuardado = JSON.stringify((est.miEquipo || []).map(m => m.ownedId + '|' + m.itemId));
      M.notaGuardado = guardado.length ? notaEquipo(guardado, M.sims.slice(0, 400)) : null;
    }
    const idsMejor = M.eq.map(c => String(c.id));
    const idsG = (est.miEquipo || []).map(m => String(m.ownedId));
    const guardadoEnOrden = idsG.join() === idsMejor.join();
    const esGuardado = idsG.length === idsMejor.length && idsMejor.every(id => idsG.includes(id));
    const yaSel = idsMejor.length === sel.length && idsMejor.every(id => sel.includes(id));
    const chipT = c => { const t = tierTorre(c); return `<span style="display:inline-grid;place-items:center;min-width:15px;height:15px;border-radius:999px;background:${t.color};color:#fff;font-size:9px;font-weight:900;margin-right:2px">${t.letra}</span>`; };
    const avisosComp = C => [
      ...C.debiles.map(x => `⚠️ ${x}.`),
      ...(C.amenazas.length ? [`⚠️ Amenazas de «Retar» que casi nadie frena: ${C.amenazas.join(', ')}.`] : []),
      ...(C.sinCobertura.length ? [`Nadie pega muy eficaz con su tipo a: ${C.sinCobertura.map(bonito).join(', ')}.`] : []),
    ];
    const compHTML = C => {
      const av = avisosComp(C);
      return `${av.length ? `<p class="text-[10px] font-semibold text-tinta-600">${av.join(' ')}</p>` : '<p class="text-[10px] font-semibold text-hoja-600">✔ Sin debilidades repetidas ni amenazas sin respuesta.</p>'}
        <div class="space-y-0.5">${C.papeles.map(p => `<p class="text-[10px] font-semibold text-tinta-500"><b class="text-tinta-700">${p.l.nombre}</b>: ${p.papel} · más rápido que el ${pctT(p.vel)} · tumba en ~${num1(p.tumba)} golpes y aguanta ~${num1(p.aguanta)} · ${p.l.fis ? 'cuerpo a cuerpo' : 'a distancia'} · sin él ${pctT(p.sinG)} · 💪 potenciar <b>${p.pot[0].n}</b> (${NIVEL_MEJORA(p.pot[0].gana).replace('le aprovecha ', '')})</p>`).join('')}</div>`;
    };
    const cal = infoCal.golpes ? `Modelo afinado con ${infoCal.golpes} golpes de ${infoCal.combates} combate${infoCal.combates === 1 ? '' : 's'}${infoCal.aciertoTipo != null ? ` (acierta el tipo de ataque el ${pctT(infoCal.aciertoTipo)} de las veces)` : ''}.` : 'Cuando veas el log de un combate de la Torre, el modelo se afina solo con lo que ve.';
    const botonCopiar = '<button type="button" class="axt-copiar text-[10px] font-bold text-tinta-400 underline">📋 Copiar datos del cálculo (para revisarlo)</button>';
    const lineaSel = !sel.length ? '' : S
      ? `<p class="text-[11px] font-semibold text-tinta-600">Tu selección (${S.cs.length}/6): gana ≈ <b>${pctT(S.nota.g)}</b> de los combates${S.cs.length < 6 ? ' (con menos de 6 pierdes mucho)' : ''}.${S.flojo ? ` El que menos aporta: <b>${S.flojo.c.nombre}</b>.` : ''}${S.cambio ? ` Si lo cambias por <b>${S.cambio.c.nombre}</b>: ≈ ${pctT(S.cambio.n.g)}.` : ''}</p>${S.comp && !yaSel && avisosComp(S.comp).length ? `<p class="text-[10px] font-semibold text-tinta-500">En tu selección: ${avisosComp(S.comp).join(' ')}</p>` : ''}`
      : yaSel ? '' : `<button type="button" class="axt-analizar boton-suave w-full !py-1.5 text-xs" ${analizandoSel ? 'disabled' : ''}>${analizandoSel ? '⏳ Analizando tu selección…' : `📊 Analizar mi selección (${sel.length}/6)`}</button>`;
    const hace = Math.round((Date.now() - M.t) / 60000);
    const html = `
      ${kHead('🗼', 'Análisis de la Torre', `${M.vistos ? `${M.vistos} rivales vistos en «Retar»` : 'Sin rivales vistos en «Retar»'} · calculado ${hace < 1 ? 'ahora' : `hace ${hace} min`}`)}
      ${viejo ? `<p class="rounded-card border-2 border-ambar-200 bg-ambar-50 p-2 text-[11px] font-bold text-ambar-700">🔄 Hay cambios desde el último cálculo (Pokémon, objetos o rivales nuevos).</p>` : ''}
      ${lineaSel}
      ${M.notaGuardado ? `<p class="text-[11px] font-semibold text-tinta-600">Equipo guardado (el que defiende y ataca): ≈ <b>${pctT(M.notaGuardado.g)}</b>.</p>` : ''}
      <div class="rounded-card border-2 border-ambar-300 bg-ambar-50 p-2 space-y-1">
        <p class="text-[11px] font-extrabold text-ambar-700">⭐ El mejor equipo con todo lo que tienes${esGuardado ? ' (es el que ya tienes guardado)' : ''}</p>
        <p class="text-sm font-extrabold">${M.eq.map((c, i) => `${i + 1}. ${chipT(c)}${c.nombre}`).join(' · ')}</p>
        <p class="text-[11px] font-semibold text-tinta-600">Gana ≈ <b>${pctT(M.nota.g)}</b> de los combates.</p>
        ${M.comp ? compHTML(M.comp) : ''}
        <button type="button" class="axt-poner boton-principal w-full !py-2 text-xs" ${guardadoEnOrden ? 'disabled' : ''}>${guardadoEnOrden ? '✔ Ya es tu equipo guardado, en este orden' : esGuardado ? '🤖 Ponerlo en este orden y guardarlo' : '🤖 Poner este equipo en este orden y guardarlo'}</button>
        <p class="axt-poner-msg text-center text-[10px] font-bold ${yaSel ? 'text-hoja-600' : 'text-tinta-400'}">${yaSel ? '✔ Son los que tienes elegidos.' : 'Llevan una ⭐ en la lista de abajo.'}</p>
      </div>
      <p class="text-[11px] font-semibold text-tinta-500">Los mejores sueltos para la Torre: ${M.sueltos.slice(0, 10).map((x, i) => `${i + 1}. ${chipT(x.c)}${x.c.nombre}`).join(' · ')}</p>
      ${botonCalc(viejo ? '🔄 Recalcular con lo nuevo' : '🔄 Volver a calcular')}
      <p class="text-[10px] font-semibold text-tinta-400">${soloSA(est) ? 'Liga clásica: solo se tienen en cuenta los tier S y A, tuyos y de los rivales (los S pesan el doble), porque es contra lo que vas a pelear. ' : ''}El mismo equipo ataca y defiende, así que se busca el mejor en general. El juego dice que el orden de salida se sortea al empezar cada combate; por si acaso, se guarda en el orden que más gana si salieran en fila. Se simulan combates en fila (el que gana sigue con la vida que le queda) contra equipos de 6 sacados de los rivales vistos en «Retar» y de un banco de todos los tipos tan fuerte como tus mejores Pokémon, todos a Nv.50. Un Pokémon por especie. La recomendación solo cambia si otra gana claramente más (no por el azar de la simulación). Cada nuevo miembro se elige por lo que suma a los que ya están (tipos, debilidades, papeles), no por lo bueno que es solo; también se prueban especialistas contra lo que más se ve en «Retar». «Sin él»: lo que ganaría el equipo con cinco. Cada uno juega con el objeto que lleva ahora. «Potenciar»: la estadística que más le conviene subir (con un objeto o como sea). ${cal}</p>
      ${botonCopiar}`;
    pintar(html, calculandoTorre ? ['on', 'CALCULANDO'] : viejo ? ['warn', 'DESACTUALIZADO'] : [M.nota.g >= 0.6 ? 'ok' : M.nota.g >= 0.45 ? 'warn' : 'err', `GANA ≈ ${pctT(M.nota.g)}`], () => {
      const b = caja.querySelector('.axt-copiar');
      if (b) b.addEventListener('click', e => { e.preventDefault(); copiarDatosTorre(est, b); });
      const bp = caja.querySelector('.axt-poner');
      if (bp) bp.addEventListener('click', e => { e.preventDefault(); ponerEquipoTorre(idsMejor); });
      const ba = caja.querySelector('.axt-analizar');
      if (ba) ba.addEventListener('click', e => { e.preventDefault(); analizarSeleccion(); });
    });
    estrellasTorre(idsMejor);
  }
  // Todo lo que usa el cálculo, en JSON, al portapapeles (sin nombres de jugadores ni ids de cuenta)
  function copiarDatosTorre(est, boton) {
    const M = memoTorre || {};
    const lc = l => l && { nombre: l.nombre, tipos: l.tipos, hp: l.hp, atk: l.atk, def: l.def, esp: l.esp, spe: l.spe, fis: l.fis, item: l.item, aguanta: l.aguanta };
    const datosJSON = {
      version: (typeof GM_info !== 'undefined' && GM_info.script && GM_info.script.version) || '?', modo: est.modo, cal: { ...CAL, ...infoCal },
      candidatos: est.candidatos.map(c => ({ id: c.id, nombre: c.nombre, especie: c.especie, tipo1: c.tipo1, tipo2: c.tipo2, stats: c.stats, itemId: c.itemId, itemNombre: c.itemNombre, vale: c.vale, sprite: c.sprite })),
      miEquipo: (est.miEquipo || []).map(m => ({ ownedId: m.ownedId, nombre: m.nombre, itemId: m.itemId, itemNombre: m.itemNombre, sprite: m.sprite })),
      equipables: est.equipables || null, seleccion: seleccionTorre(),
      banco: (M.pool || []).filter(p => p.k[0] === 'V').map(p => ({ w: p.w, l: lc(p.l) })), bm: M.bm, equiposVistos: M.equipos,
      mejor: M.eq ? { ids: M.eq.map(c => c.id), nota: M.nota, esGuardado: M.esGuardado, seMantiene: M.seMantiene } : null,
      guardado: { nota: M.notaGuardado, luchadores: equipoGuardado(est).map(lc) },
    };
    const txt = JSON.stringify(datosJSON);
    const ok = () => { boton.textContent = '✔ Copiado: pégamelo'; };
    try { navigator.clipboard.writeText(txt).then(ok, () => { prompt('Copia esto:', txt); }); } catch { prompt('Copia esto:', txt); }
  }
  // Marca en la lista los 6 del mejor equipo (primero suelta los que sobran) y pulsa guardar
  function botonCandidato(id) {
    for (const li of $$('main ul.grid > li')) { const f = fibraDe(li); if (f && String(f.key) === String(id)) return li.querySelector(':scope > button'); }
    return null;
  }
  // Mejor orden de salida si pelean en fila: se prueban los 720 órdenes contra los mismos combates de prueba
  function* mejorOrdenPasos(eqL, sims) {
    const idx = eqL.map((_, i) => i);
    if (idx.length < 2) return idx;
    let mejor = null;
    for (const perm of permutaciones(idx, idx.length)) {
      let g = 0, k = 0;
      for (const s of sims) { const r = combateT(perm.map(i => eqL[i]), s.rivs); if (r.gana) g++; k += r.caidos; }
      const v = g / sims.length + 0.15 * k / sims.length / 6;
      if (!mejor || v > mejor.v + 1e-9) mejor = { perm, v };
      yield;
    }
    return mejor.perm;
  }
  function mejorOrdenT(eqL, sims) {
    const it = mejorOrdenPasos(eqL, sims);
    let r;
    while (!(r = it.next()).done);
    return r.value;
  }
  let poniendoTorre = false;
  async function ponerEquipoTorre(ids) {
    if (poniendoTorre) return;
    poniendoTorre = true;
    const espera = ms => new Promise(r => setTimeout(r, ms));
    const msg = t => { const p = document.querySelector('#axt-torre .axt-poner-msg'); if (p) p.textContent = t; };
    try {
      // si ya están los 6 pero en otro orden, se sueltan todos para marcarlos en el orden bueno
      const actualSel = seleccionTorre();
      const mismoOrden = ids.every((id, i) => actualSel[i] === id);
      for (const id of [...actualSel].reverse()) if (!ids.includes(id) || !mismoOrden) { const b = botonCandidato(id); if (b) { b.click(); await espera(180); } }
      const faltan = [];
      for (const id of ids) {
        if (seleccionTorre().includes(id)) continue;
        const b = botonCandidato(id);
        if (b) { b.click(); await espera(180); } else faltan.push(id);
      }
      if (faltan.length) { msg('⚠️ Alguno no se ve en la lista (¿hay un filtro puesto?). No he guardado.'); return; }
      await espera(250);
      const g = $$('main button').find(b => /^\s*(Cambiar el equipo|Dejar estos)/i.test(b.textContent || '') && !b.disabled);
      if (!g) { msg('✔ Marcados. No encuentro el botón de guardar: dale tú a «Cambiar el equipo».'); return; }
      g.click();
      msg('✔ Equipo puesto y guardado.');
    } catch (e) { console.warn('[axt torre]', e); msg('⚠️ Error: ' + (e && e.message)); }
    finally { poniendoTorre = false; }
  }
  // Una ⭐ abajo a la derecha en los 6 recomendados (solo se señalan: elegirlos es cosa tuya)
  function estrellasTorre(ids) {
    for (const li of $$('main ul.grid > li')) {
      const b = li.querySelector(':scope > button');
      const f = b && fibraDe(li);
      if (!f) continue;
      const toca = ids.includes(String(f.key));
      let s = b.querySelector(':scope > .axt-rec');
      if (!toca) { if (s) s.remove(); continue; }
      if (s) continue;
      s = document.createElement('span');
      s.className = 'axt-rec';
      s.setAttribute('data-ax-ignore', '1');
      s.textContent = '⭐';
      s.title = 'En el mejor equipo recomendado';
      s.style.cssText = 'position:absolute;right:-5px;bottom:-5px;font-size:13px;line-height:1;pointer-events:none;filter:drop-shadow(0 0 1px #fff)';
      b.appendChild(s);
    }
  }

  // Retar: probabilidad de ganar a cada rival con tu equipo guardado (3 suyos a la vista + 3 tapados del banco)
  const memoRival = new Map();
  let retarPedido = false, calculandoRetar = false;
  // Lo mínimo para predecir en «Retar» (rivales y combates de prueba), si aún no hay cálculo de «Mi equipo»
  async function calcularRetar() {
    if (calculandoRetar) return;
    retarPedido = true;
    const est = estadoTorre();
    if (!est) return;
    if (!memoTorre) {
      calculandoRetar = true; programar();
      try {
        await pausaT();
        const unicos = candidatosUnicos(est);
        const { pool, vistos, equipos, bm } = poolTorre(est, unicos);
        const sims = await correrPasos(simulacionesPasos(pool, 600, 7));
        memoTorre = { firma: 'retar', pool, vistos, equipos, bm, sims, porSel: {}, t: Date.now() };
      } catch (e) { console.warn('[axt torre]', e); }
      calculandoRetar = false;
    }
    programar();
  }
  // Botón en «Retar» (antes de la primera tarjeta de rival o de «Retar a ciegas»)
  function botonRetar(est) {
    const ciegas = $$('main button').find(b => /Retar a ciegas/.test(b.textContent || ''));
    const primera = (est.rivales || []).map(r => $$('main div.tarjeta').find(d => { const f = fibraDe(d); return f && String(f.key) === String(r.userId); })).find(Boolean);
    const ancla = primera || ciegas;
    let caja = document.getElementById('axt-retar');
    if (retarPedido || !ancla || !equipoGuardado(est).length) { if (caja) caja.remove(); return; }
    if (!caja) {
      caja = document.createElement('div');
      caja.id = 'axt-retar';
      caja.className = 'axt-predic';
      caja.setAttribute('data-ax-ignore', '1');
      caja.innerHTML = '<button type="button" class="boton-suave w-full !py-2 text-xs">🔮 Calcular mis probabilidades contra estos rivales</button>';
      caja.querySelector('button').addEventListener('click', e => { e.preventDefault(); e.currentTarget.disabled = true; e.currentTarget.textContent = '⏳ Calculando…'; calcularRetar(); });
    }
    if (caja.nextElementSibling !== ancla) ancla.insertAdjacentElement('beforebegin', caja);
  }
  function prediccionesRivales(est) {
    botonRetar(est);
    if (!memoTorre || !retarPedido || calculandoRetar) return;
    const guardado = equipoGuardado(est);
    if (!guardado.length) return;
    const claveEq = guardado.map(l => l.nombre + l.item + l.hp).join(',');
    for (const r of est.rivales || []) {
      const tarjeta = $$('main div.tarjeta').find(d => { const f = fibraDe(d); return f && String(f.key) === String(r.userId); });
      if (!tarjeta) continue;
      const k = r.userId + '|' + claveEq + '|' + memoTorre.firma;
      if (!memoRival.has(k)) {
        const fijos = (r.equipo || []).filter(p => !p.oculto && p.stats && p.tipo1).map(p => luchadorT(p));
        const sims = simulaciones(memoTorre.pool, 300, 13, fijos);
        memoRival.set(k, notaEquipo(guardado, sims).g);
      }
      const p = memoRival.get(k);
      let linea = tarjeta.querySelector(':scope > .axt-predic');
      const txt = `🔮 Con tu equipo guardado ganas ≈ ${pctT(p)}`;
      if (!linea) {
        linea = document.createElement('p');
        linea.className = 'axt-predic text-[11px] font-extrabold';
        linea.setAttribute('data-ax-ignore', '1');
        const boton = $$(':scope > button', tarjeta).pop();
        tarjeta.insertBefore(linea, boton || null);
      }
      if (linea.textContent !== txt) linea.textContent = txt;
      linea.style.color = p >= 0.6 ? '#2FA84F' : p >= 0.4 ? '#D08A00' : '#E0473A';
    }
    // «Retar a ciegas»: contra un rival cualquiera del banco
    const ciegas = $$('main button').find(b => /Retar a ciegas/.test(b.textContent || ''));
    const claveG = JSON.stringify((est.miEquipo || []).map(m => m.ownedId + '|' + m.itemId));
    if (memoTorre.claveGuardado !== claveG || memoTorre.notaGuardado === undefined) { memoTorre.claveGuardado = claveG; memoTorre.notaGuardado = guardado.length ? notaEquipo(guardado, memoTorre.sims.slice(0, 400)) : null; }
    if (ciegas && memoTorre.notaGuardado) {
      let linea = ciegas.parentElement.querySelector(':scope > p.axt-predic');
      const txt = `🔮 Contra un rival cualquiera ganas ≈ ${pctT(memoTorre.notaGuardado.g)}`;
      if (!linea) { linea = document.createElement('p'); linea.className = 'axt-predic text-[11px] font-extrabold text-tinta-600'; linea.setAttribute('data-ax-ignore', '1'); ciegas.insertAdjacentElement('beforebegin', linea); }
      if (linea.textContent !== txt) linea.textContent = txt;
    }
  }
  function torre() {
    const est = estadoTorre();
    if (!est) return;
    aprenderTorre(est);
    guardarColeccion(est);
    insigniasTorre(est);
    // el cálculo del equipo hace falta también en «Retar» (para el banco de rivales); el panel solo sale en «Mi equipo»
    // nada se calcula solo: el panel de «Mi equipo» y las probabilidades de «Retar» van con su botón
    if ($$('main ul.grid').some(u => u.querySelector(':scope > li > button'))) panelTorre(est);
    else prediccionesRivales(est);
  }

  /* ------------------------------------------------------------------ *
   *  LOS TRONOS (/tronos)
   *  Un trono por tipo y reto en espejo: los dos equipos tienen que ser de ese tipo (como primero o como segundo), sin
   *  legendarios ni especies repetidas. En cada combate salen 3 de los 6 de cada lado, al azar. El mismo equipo ataca
   *  y, si gana, defiende tal cual: se busca el que mejor hace las dos cosas a la vez (mitad y mitad):
   *  · Quitarlo: contra equipos de ese tipo (los vistos en la Torre y un banco de ese tipo combinado con todos los
   *    demás, tan fuerte como los mejores de ese tipo que se conocen).
   *  · Defenderlo: contra los 12 más fuertes de ese tipo que existen de verdad (tuyos y vistos), que es lo que traerá
   *    quien vaya a por él.
   *  Movimientos: hasta 4, de sus tipos y de Normal. Con movimientos de un solo tipo pelea solo con ese tipo, así que lo
   *  mejor es llevar al menos uno de cada tipo suyo y uno de Normal si le sirve (cuando sus tipos no le hacen nada al
   *  rival). Tus Pokémon salen de la Torre (modo clásico, a Nv.50 y con su objeto): hace falta haberla abierto una vez.
   * ------------------------------------------------------------------ */
  const LS_COLE = 'axt-coleccion', LS_TRONOS = 'axt-tronos-rec';
  const enTronos = () => /^\/tronos(\/|$)/.test(location.pathname);
  // Legendarios y singulares (nº de la Pokédex nacional): en los Tronos no se admiten
  const LEGENDARIOS = new Set([144, 145, 146, 150, 151, 243, 244, 245, 249, 250, 251, 377, 378, 379, 380, 381, 382, 383, 384, 385, 386,
    480, 481, 482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492, 493, 494, 638, 639, 640, 641, 642, 643, 644, 645, 646, 647, 648, 649,
    716, 717, 718, 719, 720, 721, 772, 773, 785, 786, 787, 788, 789, 790, 791, 792, 800, 801, 802, 807, 808, 809,
    888, 889, 890, 891, 892, 893, 894, 895, 896, 897, 898, 905, 1001, 1002, 1003, 1004, 1007, 1008, 1014, 1015, 1016, 1017, 1024, 1025]);
  const esLegendario = c => /legend|m[ií]tic|singular/i.test(c.rareza || '') || LEGENDARIOS.has(numSrc(c.sprite));
  let ultimaCole = '';
  function guardarColeccion(est) {
    if (est.modo !== 'clasico') return;
    const rapida = est.candidatos.length + '|' + est.candidatos.reduce((x, c) => x + (c.stats ? c.stats.total : 0) + (c.itemId ? c.itemId.length : 0) + (c.id ? String(c.id).length : 0), 0);
    if (rapida === ultimaCole) return;
    ultimaCole = rapida;
    const lista = est.candidatos.filter(c => c.stats && c.tipo1).map(c => ({ id: c.id, nombre: c.nombre, especie: c.especie, tipo1: c.tipo1, tipo2: c.tipo2 || null, stats: c.stats, itemId: c.itemId || null, sprite: c.sprite, rareza: c.rareza || null }));
    const firma = hash32(JSON.stringify(lista));
    const g = lsGet(LS_COLE, null);
    if (!g || g.firma !== firma) lsPut(LS_COLE, { firma, t: Date.now(), lista });
    else if (Date.now() - (g.t || 0) > 3600e3) lsPut(LS_COLE, { ...g, t: Date.now() });
    coleMem = null;
  }
  // Tus Pokémon se leen solos de la Torre (modo clásico), pidiendo su página en segundo plano: vienen en los datos de
  // Next.js («self.__next_f.push(...)») dentro de "candidatos". Se repite como mucho una vez por minuto y se renueva si
  // lo guardado tiene más de 6 horas.
  function textoFlight(html) {
    let t = '';
    const re = /self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g;
    let m;
    while ((m = re.exec(html))) { try { t += JSON.parse(m[1]); } catch { /* trozo raro */ } }
    return t;
  }
  function listaFlight(t, clave) {
    const mm = new RegExp('"' + clave + '"\\s*:\\s*\\[').exec(t);
    if (!mm) return null;
    const j = mm.index + mm[0].length - 1;
    let d = 0, str = false, esc = false;
    for (let k = j; k < t.length; k++) {
      const ch = t[k];
      if (str) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') str = false; continue; }
      if (ch === '"') str = true;
      else if (ch === '[' || ch === '{') d++;
      else if ((ch === ']' || ch === '}') && --d === 0) { try { return JSON.parse(t.slice(j, k + 1), (_, v) => (v === '$undefined' ? undefined : v)); } catch { return null; } }
    }
    return null;
  }
  let coleIntento = 0, colePidiendo = false, coleFallo = false;
  async function traerColeccion() {
    if (colePidiendo || Date.now() - coleIntento < 60000) return;
    coleIntento = Date.now();
    colePidiendo = true;
    const ctl = typeof AbortController === 'function' ? new AbortController() : null;
    const reloj = setTimeout(() => { if (ctl) ctl.abort(); }, 20000);
    try {
      const r = await fetch('/torre?liga=clasico', { credentials: 'same-origin', cache: 'no-store', signal: ctl ? ctl.signal : undefined });
      const cands = r.ok ? listaFlight(textoFlight(await r.text()), 'candidatos') : null;
      if (Array.isArray(cands) && cands.length) { guardarColeccion({ modo: 'clasico', candidatos: cands }); coleFallo = false; }
      else coleFallo = true;
    } catch (e) { coleFallo = true; console.warn('[axt tronos] no pude leer la Torre', e); }
    finally { clearTimeout(reloj); colePidiendo = false; programar(); }
  }
  // La colección guardada; si no hay o es vieja, se pide (mientras tanto se usa la que haya)
  let coleMem = null;
  function coleccion() {
    if (!coleMem) coleMem = lsGet(LS_COLE, null);
    if (!coleMem || Date.now() - (coleMem.t || 0) > 6 * 3600e3) traerColeccion();
    return coleMem;
  }
  const avisoCole = () => (coleFallo
    ? 'No he podido leer tus Pokémon de la Torre Desafío. Ábrela una vez (modo clásico) y vuelve.'
    : 'Leyendo tus Pokémon de la Torre Desafío…');
  const tiposDeC = c => [c.tipo1, c.tipo2].map(tipoDe).filter(Boolean);
  // Los Pokémon vistos en «Retar» de la Torre (las dos ligas), con cuántos jugadores los llevaban
  let vistosMem = null;
  function vistosTorre() {
    const crudo = (() => { try { return localStorage.getItem(LS_RIV) || ''; } catch { return ''; } })();
    if (vistosMem && vistosMem.largo === crudo.length) return vistosMem.v;
    const v = vistosTorreLeer();
    vistosMem = { largo: crudo.length, v };
    return v;
  }
  function vistosTorreLeer() {
    const g = lsGet(LS_RIV, {}), peso = {}, pokes = {};
    let equipos = 0;
    for (const m of Object.values(g)) {
      equipos += Object.keys(m.rivales || {}).length;
      for (const r of Object.values(m.rivales || {})) for (const k of r.claves) if (m.pokes[k]) { peso[k] = (peso[k] || 0) + 1; pokes[k] = m.pokes[k]; }
    }
    return { equipos, lista: Object.keys(peso).sort().map(k => ({ k, p: pokes[k], w: peso[k] })) };
  }
  function unicosDe(lista) {
    const porEspecie = {};
    for (const c of lista) { const k = c.especie || c.nombre; if (!porEspecie[k] || c.stats.total > porEspecie[k].stats.total) porEspecie[k] = c; }
    return Object.values(porEspecie).sort((a, b) => b.stats.total - a.stats.total || (String(a.id) < String(b.id) ? -1 : 1));
  }
  // Bancos de rivales de un trono y sus combates de prueba (los de quitarlo y los de defenderlo, intercalados: mitad y mitad)
  function* bancosTronoPasos(t, lista, vt) {
    const mios = unicosDe(lista.filter(c => tiposDeC(c).includes(t) && !esLegendario(c)));
    // equipos vistos en los combates de este trono: los que lo defendían (para quitarlo; el titular de ahora, mucho más)
    // y los que vinieron a quitártelo (para defenderlo)
    const vistosTr = equiposTrono(t), titular = titularesTrono()[t];
    const deTr = (rol, peso) => {
      const out = {};
      for (const e of vistosTr.filter(x => x.rol === rol)) for (const n of e.nombres) {
        const l = luchadorNombre(n);
        if (!l) continue;
        const k = 'T|' + rol + '|' + n, w = peso(e);
        out[k] = out[k] ? { ...out[k], w: out[k].w + w } : { k, l, w };
      }
      return Object.values(out);
    };
    const defensores = deTr('reto', e => (titular && e.rival === titular ? 4 : 1));
    const retadores = deTr('defensa', e => (e.gane === false ? 3 : 2));
    const vistosP = vt.lista.filter(x => tiposDeC(x.p).includes(t) && !esLegendario(x.p));
    const vistos = vistosP.map(x => ({ k: 'V|' + x.k, l: luchadorT(x.p, null), w: x.w }));
    const bm = Math.round(baseMediaDe([...mios, ...vistosP.map(x => x.p)]) / 5) * 5;
    const sint = [t, ...TIPOS.filter(x => x !== t).map(x => t + '/' + x)].flatMap(ts => PERFILES.map((pf, i) => ({ k: 'S|' + ts + '|' + i, l: { ...stats(pf.map(v => Math.max(20, Math.round(v + bm - 80))), 50), L: 50, tipos: ts.split('/'), num: 0, nombre: bonito(t) }, w: 1 })));
    const pesoVistos = vistos.reduce((x, v) => x + v.w, 0);
    const parte = Math.max(0.3, 1 / (1 + vistos.length / 6));
    if (pesoVistos) for (const x of sint) x.w = pesoVistos * parte / (1 - parte) / sint.length;
    // los que defendían el trono pesan dos tercios del total: es contra lo que de verdad vas a pelear
    const pesoOtros = [...vistos, ...sint].reduce((x, p) => x + p.w, 0), pesoDef = defensores.reduce((x, p) => x + p.w, 0);
    if (pesoDef) for (const d of defensores) d.w = d.w / pesoDef * pesoOtros * 2;
    const poolA = [...defensores, ...vistos, ...sint];
    const pesoA = poolA.reduce((x, p) => x + p.w, 0);
    const fuerza = l => poolA.reduce((x, p) => x + ventaja(l, p.l) * p.w, 0) / pesoA;
    yield;
    const conFuerza = [];
    for (const p of [...mios.map(c => ({ k: 'M|' + c.id, l: luchadorT(c, null) })), ...vistos, ...retadores]) { conFuerza.push({ ...p, f: fuerza(p.l) }); yield; }
    const porFuerza = arr => arr.sort((a, b) => b.f - a.f || (a.k < b.k ? -1 : 1));
    const reales = porFuerza(conFuerza).slice(0, 12);
    // los que ya vinieron a quitártelo, siempre dentro (y pesando más que los demás)
    const conRetadores = [...reales, ...retadores.filter(r => !reales.some(x => x.k === r.k))];
    const poolD = [...conRetadores, ...(conRetadores.length < 6 ? porFuerza(sint.map(p => ({ ...p, f: fuerza(p.l) }))).slice(0, 6 - conRetadores.length) : [])].map(p => ({ k: p.k, l: p.l, w: p.k.startsWith('T|') ? p.w : 1 }));
    const simsA = simulaciones(poolA, 400, 21);
    yield;
    const simsD = simulaciones(poolD, 400, 22);
    yield;
    const sims = simsA.flatMap((s, i) => [s, simsD[i]]);
    return { t, mios, poolA, poolD, simsA, simsD, sims, vistosTr, titular };
  }
  // Parte de los rivales (por peso) contra los que pegaría con Normal: si es casi nada, Normal no le hace falta
  function usoNormal(l, pool) {
    const pesoT = pool.reduce((x, p) => x + p.w, 0);
    let w = 0;
    for (const p of pool) { const a = tipoAtaque(l, p.l); if (a.t === 'normal' && !a.propio) w += p.w; }
    return w / pesoT;
  }
  const notasTrono = (eqL, B) => ({ gA: notaEquipo(eqL, B.simsA, 3).g, gD: notaEquipo(eqL, B.simsD, 3).g });
  function* calcularTronoPasos(t, lista, vt, prev) {
    const B = yield* bancosTronoPasos(t, lista, vt);
    const { mios } = B;
    if (!mios.length) return { t, n: 0, B };
    const datosT = hash32(JSON.stringify([mios.map(c => c.id + '|' + c.stats.total + '|' + c.itemId), B.poolA.map(p => p.k + ':' + p.w.toFixed(3)), firmaCal()]));
    // Como salen 3 al azar, cada uno pelea 3 de cada N veces sin mirar contra quién: meter uno flojo baja la media.
    // Se busca el mejor equipo de 3, de 4, de 5 y de 6 y se queda el que más gana (media de quitarlo y defenderlo).
    const media = eq => { const q = notasTrono(eq.map(c => luchadorT(c, null)), B); return (q.gA + q.gD) / 2; };
    let eq, porTam;
    if (prev && prev.datos === datosT && prev.eq && prev.porTam && prev.eq.every(id => mios.some(c => String(c.id) === id))) {
      eq = prev.eq.map(id => mios.find(c => String(c.id) === id));
      porTam = prev.porTam;
    } else if (mios.length <= 3) {
      eq = mios; porTam = { [mios.length]: media(mios) };
    } else {
      porTam = {};
      let mejor = null;
      for (let k = 3; k <= Math.min(6, mios.length); k++) {
        const ant = prev && prev.eq && prev.eq.length === k ? prev.eq : null;
        const e = (yield* mejorEquipoPasos(mios, B.sims, B.poolA, ant, 3, k, true)).eq;
        const v = media(e);
        yield;
        porTam[k] = v;
        // a igualdad (medio punto), mejor con más: depende menos de que toque justo la peor combinación
        if (!mejor || v > mejor.v + 0.005 || (v > mejor.v - 0.005 && k > mejor.e.length)) mejor = { e, v };
      }
      eq = mejor.e;
    }
    const eqL = eq.map(c => luchadorT(c, null));
    const normal = eqL.map(l => usoNormal(l, [...B.poolA, ...B.poolD]));
    return { t, n: mios.length, datos: datosT, eq, porTam, normal, ...notasTrono(eqL, B), B };
  }
  function tarjetasTronos() {
    return $$('main section.grid > button.tarjeta').map(b => { const t = tipoDe((b.querySelector('p.font-display') || {}).textContent || ''); return t ? { b, t } : null; }).filter(Boolean);
  }
  let memoTronos = null, tronoActivo = null, automatizando = false;
  const colPct = g => (g >= 0.6 ? '#2FA84F' : g >= 0.4 ? '#D08A00' : '#E0473A');
  /* ---- APRENDER DE LOS COMBATES DE LOS TRONOS ----
   * Al abrir un combate («Combates» › «▶ Ver») se lee: qué trono, si retabas o defendías, contra quién, si ganaste,
   * los dos equipos (por orden de salida) y cada golpe. Los equipos de verdad se usan en el cálculo de ese trono y los
   * golpes afinan el modelo de daño (igual que los de la Torre). En los Tronos todo va a Nv.50 y sin objetos. */
  const LS_TR_VISTOS = 'axt-tronos-vistos', LS_NOMBRES = 'axt-nombres', LS_TITULARES = 'axt-tronos-titulares';
  const nombresNum = lsGet(LS_NOMBRES, {});
  function anotarNombre(nombre, num) {
    if (!nombre || !num || nombresNum[nombre] === num) return;
    nombresNum[nombre] = num; lsPut(LS_NOMBRES, nombresNum);
  }
  const slugPoke = n => n.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/♀/g, '-f').replace(/♂/g, '-m').replace(/[.'’:]/g, '').trim().replace(/\s+/g, '-');
  const pedidosNombre = new Set();
  function pedirNombre(nombre) {
    if (!nombre || nombresNum[nombre] || pedidosNombre.has(nombre)) return;
    const cole = coleccion();
    const conocido = [...((cole && cole.lista) || []), ...vistosTorre().lista.map(x => x.p)].find(c => c.nombre === nombre && numSrc(c.sprite));
    if (conocido) { anotarNombre(nombre, numSrc(conocido.sprite)); pedir(numSrc(conocido.sprite)); return; }
    pedidosNombre.add(nombre);
    pedirJSON('https://pokeapi.co/api/v2/pokemon/' + slugPoke(nombre)).then(d => {
      if (!d || !d.id) return;
      anotarNombre(nombre, d.id);
      if (!datos[d.id]) {
        const tt = (d.types || []).sort((a, b) => a.slot - b.slot).map(x => DE_INGLES[x.type.name]).filter(Boolean);
        const ss = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'].map(k => ((d.stats || []).find(x => x.stat.name === k) || {}).base_stat || 50);
        if (tt.length) { datos[d.id] = { t: tt, s: ss }; const g = lsGet(LS_POKE, {}); g[d.id] = datos[d.id]; lsPut(LS_POKE, g); }
      }
      programar();
    }).catch(() => { /* nombre raro: se queda sin datos */ });
  }
  // Luchador de un nombre a Nv.50 sin objeto (como en los Tronos); null si aún faltan sus datos (se piden)
  const cacheNombre = new Map();
  function luchadorNombre(nombre) {
    const num = nombresNum[nombre];
    if (!num) { pedirNombre(nombre); return null; }
    const d = datos[num];
    if (!d) { pedir(num); return null; }
    const k = nombre + '|' + num;
    if (!cacheNombre.has(k)) cacheNombre.set(k, { ...stats(d.s, 50), L: 50, tipos: d.t, num, nombre });
    return cacheNombre.get(k);
  }
  const equiposTrono = t => Object.values((lsGet(LS_TR_VISTOS, {})[t]) || {}).sort((a, b) => b.t - a.t);
  const titularesTrono = () => lsGet(LS_TITULARES, {});
  const firmaTronosVistos = () => { try { return String((localStorage.getItem(LS_TR_VISTOS) || '').length); } catch { return '0'; } };
  function leerCombateTrono(doc = document) {
    const h3 = $$('h3', doc).find(h => /^\s*Trono de\s+\S/i.test(h.textContent || ''));
    if (!h3) return null;
    const hoja = h3.closest('.overflow-y-auto') || doc.body;
    const tipo = tipoDe(h3.textContent.replace(/^\s*Trono de\s+/i, '').trim());
    const cab = $$('p', hoja).map(q => (q.textContent || '').replace(/\s+/g, ' ').trim()).find(x => /retabas a|te ret[oó]/i.test(x));
    const caja = $$('div', hoja).find(d => d.querySelector(':scope > .animate-slide-up') && /sale al paso de/.test(d.textContent || ''));
    if (!tipo || !cab || !caja) return null;
    let rol = null, rival = null, m;
    if ((m = cab.match(/retabas a\s+(.+?)\s*·/i))) { rol = 'reto'; rival = m[1]; }
    else if ((m = cab.match(/^(.+?)\s+te ret[oó]/i))) { rol = 'defensa'; rival = m[1]; }
    if (!rol) return null;
    const gane = /ganaste/i.test(cab) ? true : /perdiste/i.test(cab) ? false : null;
    for (const img of $$('img[src*="/sprites/"]', hoja)) anotarNombre((img.getAttribute('alt') || '').trim(), numSrc(img.getAttribute('src')));
    const ev = [];
    for (const el of caja.children) {
      const tx = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (el.tagName === 'P') { ev.push({ msg: tx }); continue; }
      const linea = $$('span.block', el).map(x => x.textContent.trim()).find(x => / · /.test(x));
      const d = tx.match(/[−-]\s*(\d+)\s*PS/);
      if (!linea || !d) continue;
      const tm = linea.match(/\(([^)]+)\)\s*$/);
      ev.push({ mio: !/border-rojo/.test(el.className), at: linea.split(' · ')[0].trim(), tipo: tm ? tipoDe(tm[1]) : null, fis: /F[ÍI]S/.test(tx), crit: /cr[ií]tico/i.test(tx), forcejeo: /forcejeo/i.test(tx), d: parseInt(d[1], 10) });
    }
    return { tipo, rol, rival, gane, ev };
  }
  function aprenderTronos(doc = document) {
    const C = leerCombateTrono(doc);
    if (!C || !C.ev.length) return;
    const misN = [], susN = [], g = [], c = [];
    let mio = null, riv = null, n = 0;
    const apunta = (arr, x) => { if (x && !arr.includes(x)) arr.push(x); };
    for (const e of C.ev) {
      if (e.msg) {
        let m;
        if ((m = e.msg.match(/^(.+?) \(Nv\.\d+\) sale al paso de (.+?) \(Nv/))) { mio = m[1]; riv = m[2]; }
        else if ((m = e.msg.match(/^El rival saca a (.+?) \(Nv/))) riv = m[1];
        else if ((m = e.msg.match(/^Relevas con (.+?) \(Nv/))) mio = m[1];
        apunta(misN, mio); apunta(susN, riv);
        continue;
      }
      if (!mio || !riv || e.at !== (e.mio ? mio : riv)) continue;
      n++;
      if (e.forcejeo || !e.tipo) continue;
      const A = luchadorNombre(e.at), D = luchadorNombre(e.mio ? riv : mio);
      if (!A || !D) continue;
      let sE = 0, rE = 0, cero = false;
      for (const x of D.tipos) { const v = (TABLA[e.tipo] || {})[x] ?? 1; if (v === 0) cero = true; else if (v > 1) sE++; else if (v < 1) rE++; }
      if (cero) continue;
      const propio = A.tipos.includes(e.tipo), At = e.fis ? A.atk : A.esp, De = e.fis ? D.def : D.esp;
      const b = ((2 * A.L / 5 + 2) * MODELO.potencia * At / De / 50 + 2) * (propio ? 1.5 : 1);
      if (e.crit) c.push(e.d / (b * CAL.k * Math.pow(CAL.se, sE) * Math.pow(CAL.nve, rE)));
      else g.push({ d: e.d, b: +b.toFixed(2), s: sE, r: rE });
    }
    // el equipo del rival (y el tuyo) en ese combate
    if (susN.length) {
      const todos = lsGet(LS_TR_VISTOS, {}), tt = todos[C.tipo] || (todos[C.tipo] = {});
      const clave = C.rol + '|' + C.rival, prev = tt[clave];
      const nuevo = { t: prev && JSON.stringify(prev.nombres) === JSON.stringify(susN) && prev.gane === C.gane ? prev.t : Date.now(), rol: C.rol, rival: C.rival, nombres: susN, mios: misN, gane: C.gane };
      if (!prev || prev.nombres.length < susN.length || JSON.stringify(prev.nombres) !== JSON.stringify(susN) || prev.gane !== C.gane) {
        tt[clave] = nuevo;
        for (const k of Object.keys(tt).sort((x, y) => tt[y].t - tt[x].t).slice(30)) delete tt[k];
        lsPut(LS_TR_VISTOS, todos);
      }
    }
    // los golpes, para afinar el modelo (junto con los de la Torre)
    if (!n || (!g.length && !c.length)) return;
    const id = 'tr' + hash32(C.tipo + '|' + C.rol + '|' + C.rival + '|' + C.ev.filter(x => !x.msg).slice(0, 10).map(x => x.d).join(','));
    const logs = lsGet(LS_LOGT, {});
    if (logs[id] && logs[id].n >= n) return;
    logs[id] = { t: Date.now(), n, g, c, ok: 0, tot: 0 };
    for (const key of Object.keys(logs).sort((x, y) => logs[y].t - logs[x].t).slice(60)) delete logs[key];
    lsPut(LS_LOGT, logs);
    calcularCal();
  }
  /* ---- El historial de combates, leído solo y sin que se vea ----
   * Se abre /tronos en una ventana invisible, se abre «Combates» y cada combate que aún no se conozca («▶ Ver»), se
   * espera a que termine la repetición (o se salta si hay botón), se lee y se cierra. Tope de 2 minutos. */
  let historialLeyendo = false, historialProg = '', historialCancelar = false;
  // «Retaste a X» / «X te retó» + «Trono de Roca · perdiste · hoy mismo» → ¿ya está aprendido?
  function infoFila(li) {
    const ps = [...li.querySelectorAll('p')].map(q => (q.textContent || '').replace(/\s+/g, ' ').trim());
    const quien = ps[0] || '', det = ps[1] || '';
    let rol = null, rival = null, m;
    if ((m = quien.match(/^Retaste a\s+(.+)$/i))) { rol = 'reto'; rival = m[1]; }
    else if ((m = quien.match(/^(.+?)\s+te ret[oó]/i))) { rol = 'defensa'; rival = m[1]; }
    const tm = det.match(/Trono de\s+([^·]+)/i), tipo = tm && tipoDe(tm[1].trim());
    if (!rol || !tipo) return null;
    const gane = /ganaste/i.test(det) ? true : /perdiste/i.test(det) ? false : null;
    return { rol, rival, tipo, gane };
  }
  function combateConocido(li) {
    const f = infoFila(li);
    if (!f) return false;
    const e = ((lsGet(LS_TR_VISTOS, {})[f.tipo]) || {})[f.rol + '|' + f.rival];
    return !!(e && e.gane === f.gane && e.nombres && e.nombres.length);
  }
  // Dentro de la ventana invisible: temporizadores ×20 y sin animaciones, para que la repetición acabe casi al instante
  const ACELERA = 20;
  function acelerar(w) {
    try {
      if (!w || w.__axtRapido) return;
      w.__axtRapido = true;
      const oT = w.setTimeout.bind(w), oI = w.setInterval.bind(w);
      w.setTimeout = (f, ms, ...a) => oT(f, (+ms || 0) / ACELERA, ...a);
      w.setInterval = (f, ms, ...a) => oI(f, Math.max(8, (+ms || 0) / ACELERA), ...a);
      const st = w.document.createElement('style');
      st.textContent = '*,*::before,*::after{animation-duration:1ms!important;animation-delay:0s!important;transition-duration:1ms!important;transition-delay:0s!important}';
      (w.document.head || w.document.documentElement).appendChild(st);
    } catch (e) { console.warn('[axt historial] no pude acelerar', e); }
  }
  // `filtro` (opcional): { tipo, soloDerrotas } → solo los combates de ese trono (y solo los perdidos)
  async function leerHistorialFondo(aviso = () => {}, filtro = {}) {
    if (historialLeyendo) return null;
    historialLeyendo = true;
    const fr = document.createElement('iframe');
    fr.setAttribute('data-ax-ignore', '1'); fr.setAttribute('aria-hidden', 'true'); fr.tabIndex = -1;
    // dentro de la pantalla pero invisible y detrás de todo: fuera de ella el navegador puede frenar la repetición
    fr.style.cssText = 'position:fixed;left:0;top:0;width:420px;height:900px;border:0;opacity:0.001;pointer-events:none;z-index:-1';
    historialCancelar = false;
    fr.src = '/tronos?axt-fondo=1';
    const t0 = Date.now(), TOPE = 90000, POR_COMBATE = 12000;
    let leidos = 0, total = 0;
    try {
      const cargada = new Promise(ok => { fr.addEventListener('load', ok, { once: true }); setTimeout(ok, 20000); });
      document.body.appendChild(fr);
      await cargada;
      acelerar(fr.contentWindow);
      const d = () => fr.contentDocument;
      const esperar = async (f, ms) => { const t = Date.now(); for (;;) { let v = null; try { v = f(); } catch { /* aún no */ } if (v || Date.now() - t > ms) return v; await espera(250); } };
      const boton = re => [...d().querySelectorAll('button')].find(b => !b.disabled && re.test((b.textContent || '').replace(/\s+/g, ' ').trim()));
      const cabLista = () => [...d().querySelectorAll('h3')].find(h => /tus [uú]ltimos combates/i.test(h.textContent || ''));
      const abrirLista = async () => {
        if (cabLista()) return cabLista();
        const b = await esperar(() => boton(/combates/i), 15000);
        if (!b) return null;
        b.click();
        return esperar(cabLista, 8000);
      };
      const filas = () => { const h = cabLista(), cont = h && (h.closest('.overflow-y-auto') || h.parentElement.parentElement.parentElement); return cont ? [...cont.querySelectorAll('li')].filter(li => li.querySelector('button')) : []; };
      if (!(await abrirLista())) throw new Error('no encuentro «Combates»');
      await esperar(() => filas().length, 4000);
      // qué filas interesan: las de este trono (y solo derrotas si se pide) que aún no se conozcan
      const quiero = li => { const f = infoFila(li); return !!f && (!filtro.tipo || f.tipo === filtro.tipo) && (!filtro.soloDerrotas || f.gane === false) && !combateConocido(li); };
      const pendientes = filas().map((li, i) => (quiero(li) ? i : -1)).filter(i => i >= 0);
      total = pendientes.length;
      const sigue = () => !historialCancelar && Date.now() - t0 < TOPE;
      for (let k = 0; k < total && sigue(); k++) {
        const i = pendientes[k];
        if (!(await abrirLista())) break;
        await esperar(() => filas().length > i, 4000);
        const li = filas()[i];
        if (!li || !quiero(li)) continue;
        const ver = [...li.querySelectorAll('button')].find(b => /ver/i.test(b.textContent || ''));
        if (!ver) continue;
        const t1 = Date.now();
        aviso(`Leyendo tus derrotas (${k + 1}/${total})…`);
        ver.click();
        if (!(await esperar(() => [...d().querySelectorAll('h3')].find(h => /^\s*Trono de\s+\S/i.test(h.textContent || '')), 8000))) { console.warn('[axt historial] no se abrió la repetición', i + 1); continue; }
        // hasta el final de la repetición (o como mucho 25 s: se lee lo que haya salido): se salta si hay botón;
        // si no, se espera a que deje de salir texto
        let ultimo = -1, quieto = Date.now(), fin = 'tope';
        while (sigue() && Date.now() - t1 < POR_COMBATE) {
          const saltar = boton(/saltar|al final|ver (el )?resultado|⏩/i);
          if (saltar) saltar.click();
          if (boton(/repasar/i) || boton(/^seguir$/i)) { fin = 'final'; break; }
          const n = d().querySelectorAll('.animate-slide-up').length;
          if (n !== ultimo) { ultimo = n; quieto = Date.now(); }
          else if (Date.now() - quieto > 2000) { fin = 'quieto'; break; }
          aviso(`Leyendo tus derrotas (${k + 1}/${total} · ${Math.round((Date.now() - t1) / 1000)} s)…`, true);
          await espera(150);
        }
        console.log('[axt historial]', `combate ${k + 1}/${total} (fila ${i + 1}):`, fin, `(${Math.round((Date.now() - t1) / 1000)} s, ${ultimo} líneas)`);
        await espera(150);
        try { aprenderTronos(d()); leidos++; } catch (e) { console.warn('[axt historial]', e); }
        const cerrar = [...d().querySelectorAll('button[aria-label="Cerrar"]')].pop();
        if (cerrar) cerrar.click();
        await espera(300);
      }
    } catch (e) { console.warn('[axt historial]', e); }
    finally { fr.remove(); historialLeyendo = false; }
    return { leidos, total };
  }
  // Solo dentro de cada trono («Mi ficha»): calcular todos los tronos a la vez en la lista daba mucho lag
  function tronos() {
    try { aprenderTronos(); } catch (e) { console.warn('[axt tronos log]', e); }
    const viejo = document.getElementById('axt-tronos');
    if (viejo) viejo.remove();
    for (const sp of $$('.axt-trono')) sp.remove();
    // al tocar un trono se apunta su tipo (por si la ficha no lo dice)
    for (const { b, t } of tarjetasTronos()) if (!b.dataset.axtTrono) { b.dataset.axtTrono = t; b.addEventListener('click', () => { tronoActivo = t; }); }
    const tits = titularesTrono(); let cambio = false;
    for (const { b, t } of tarjetasTronos()) {
      const q = b.querySelector('p.text-tinta-500'), quien = q && q.textContent.trim();
      if (quien && tits[t] !== quien) { tits[t] = quien; cambio = true; }
    }
    if (cambio) lsPut(LS_TITULARES, tits);
    fichaTrono();
  }
  // Un trono se calcula en segundo plano (a trozos) y se guarda mientras no cambien tus Pokémon, lo visto en la Torre
  // ni el modelo. Devuelve el resultado, o null mientras se calcula.
  function resTrono(cole, t, pedir) {
    const vt = vistosTorre();
    const firma = cole.firma + '|' + firmaCal() + '|' + vt.lista.length + '|' + firmaTronosVistos();
    if (!memoTronos || memoTronos.firma !== firma) memoTronos = { firma, res: {}, calc: {} };
    const M = memoTronos;
    if (M.res[t]) return M.res[t];
    if (pedir && !M.calc[t]) {
      M.calc[t] = true;
      const recs = lsGet(LS_TRONOS, {});
      correrPasos(calcularTronoPasos(t, cole.lista, vt, recs[t])).then(r => {
        M.res[t] = r;
        if (r.n) { const g = lsGet(LS_TRONOS, {}); g[t] = { datos: r.datos, eq: r.eq.map(c => String(c.id)), porTam: r.porTam }; lsPut(LS_TRONOS, g); }
        programar();
      }, e => { console.warn('[axt tronos]', e); M.calc[t] = false; });
    }
    return null;
  }
  // «Mi ficha» de un trono: tu equipo puesto ahí (con sus movimientos)
  const avisoFicha = () => $$('p').find(p => /en cada combate solo salen 3 al azar/i.test(p.textContent || ''));
  function huecosTrono() {
    const aviso = avisoFicha();
    return aviso ? $$('.tarjeta-hueco', aviso.parentElement).filter(h => h.querySelector('button[aria-label^="Quitar a"]')) : [];
  }
  const nombreHueco = h => ((h.querySelector('p.truncate') || {}).textContent || '').trim();
  const botonSel = b => !b.disabled && /background/.test(b.getAttribute('style') || '');
  function gruposMovs(h) {
    return $$('div.flex-wrap', h).map(g => ({ t: tipoDe((g.querySelector('span.pastilla') || {}).textContent || ''), btns: $$('button', g) })).filter(g => g.t);
  }
  function leerFichaTrono() {
    const aviso = avisoFicha();
    if (!aviso) return null;
    const miembros = huecosTrono().map(h => {
      const img = h.querySelector('img[src*="/sprites/"]');
      const movs = {};
      for (const g of gruposMovs(h)) movs[g.t] = g.btns.filter(botonSel).length;
      return { nombre: nombreHueco(h), num: img ? numDe(img) : null, movs };
    }).filter(m => m.nombre);
    return { aviso, miembros };
  }
  function tipoTrono(cs) {
    const cab = $$('h1, h2, h3').map(h => ((h.textContent || '').match(/trono de\s+([a-záéíóúñ]+)/i) || [])[1]).find(Boolean);
    let t = (cab && tipoDe(cab)) || tronoActivo;
    if (!t) {
      const comunes = cs.filter(x => x.c).map(x => tiposDeC(x.c)).reduce((a, b) => (a ? a.filter(y => b.includes(y)) : b), null);
      if (comunes && comunes.length === 1) t = comunes[0];
    }
    return t;
  }
  function fichaTrono() {
    if (automatizando) return;
    const F = leerFichaTrono();
    let caja = document.getElementById('axt-trono-ficha');
    if (!F) { if (caja) caja.remove(); return; }
    if (!caja) { caja = document.createElement('div'); caja.id = 'axt-trono-ficha'; caja.className = 'rounded-card border-2 border-ambar-300 bg-ambar-50 p-2.5 space-y-1'; caja.setAttribute('data-ax-ignore', '1'); }
    if (caja.nextElementSibling !== F.aviso) F.aviso.insertAdjacentElement('beforebegin', caja);
    const pinta = html => { if (caja.dataset.html !== html) { caja.innerHTML = html; caja.dataset.html = html; const b = caja.querySelector('.axt-auto'); if (b) b.addEventListener('click', e => { e.preventDefault(); ponerMejorEquipo(); }); } };
    const cole = coleccion();
    if (!cole) { pinta(`<p class="text-[11px] font-semibold text-tinta-600">${avisoCole()}</p>`); return; }
    const deCole = m => cole.lista.find(c => c.nombre === m.nombre) || cole.lista.find(c => numSrc(c.sprite) === m.num);
    const cs = F.miembros.map(m => ({ m, c: deCole(m) }));
    const t = tipoTrono(cs);
    if (!t) { pinta('<p class="text-[11px] font-semibold text-tinta-600">Vuelve a la lista y toca el trono para que sepa de qué tipo es.</p>'); return; }
    const r = resTrono(cole, t);
    if (!r) {
      const calculando = (memoTronos && memoTronos.calc[t]) || historialLeyendo;
      pinta(`<p class="text-[11px] font-extrabold">👑 Trono de ${bonito(t)}</p><p class="text-[11px] font-semibold text-tinta-500">Primero lee las derrotas de este trono que aún no conozca (sin que se vea, en unos segundos) y luego busca el mejor equipo de tipo ${bonito(t)} para quitar y defender el trono.</p><button type="button" class="axt-calc-trono boton-principal w-full !py-2 text-xs" ${calculando ? 'disabled' : ''}>${historialLeyendo ? `⏳ ${historialProg || 'Buscando tus derrotas…'}` : calculando ? `⏳ Calculando el mejor equipo de tipo ${bonito(t)}…` : `🧮 Calcular el mejor equipo de tipo ${bonito(t)}`}</button>${historialLeyendo ? '<button type="button" class="axt-saltar-hist boton-suave w-full !py-1.5 text-[11px]">⏭ No leer más y calcular ya</button>' : ''}`);
      const bs = caja.querySelector('.axt-saltar-hist');
      if (bs) bs.addEventListener('click', e => { e.preventDefault(); historialCancelar = true; historialProg = 'Terminando…'; caja.dataset.html = ''; fichaTrono(); });
      const bc = caja.querySelector('.axt-calc-trono');
      if (bc && !bc.dataset.ok) {
        bc.dataset.ok = '1';
        bc.addEventListener('click', async e => {
          e.preventDefault();
          historialProg = 'Buscando tus derrotas…'; caja.dataset.html = '';
          // `soloTexto`: el contador de segundos cambia solo el texto del botón (sin repintar la tarjeta ni el «No leer más»)
          const lectura = leerHistorialFondo((txt, soloTexto) => {
            if (historialCancelar) return;
            if (soloTexto) { const b = document.querySelector('#axt-trono-ficha .axt-calc-trono'); if (b) b.textContent = '⏳ ' + txt; return; }
            historialProg = txt; caja.dataset.html = ''; fichaTrono();
          }, { tipo: t, soloDerrotas: true });
          fichaTrono();
          try { await lectura; } catch (err) { console.warn('[axt historial]', err); }
          historialProg = '';
          try { resTrono(coleccion() || cole, t, true); } catch (err) { console.warn('[axt tronos]', err); }
          caja.dataset.html = ''; fichaTrono();
        });
      }
      return;
    }
    if (!r.n) { pinta(`<p class="text-[11px] font-semibold text-tinta-600">No tienes ningún Pokémon de tipo ${bonito(t)} que no sea legendario.</p>`); return; }
    const firma = t + '|' + JSON.stringify(F.miembros) + '|' + (r.datos || '');
    if (caja.dataset.firma === firma) return;
    caja.dataset.firma = firma;
    const B = r.B;
    const validos = cs.filter(x => x.c);
    // cada uno pelea solo con los tipos de los movimientos que tiene marcados
    const eqL = validos.map(x => ({ ...luchadorT(x.c, null), movs: Object.keys(x.m.movs).filter(k => x.m.movs[k] > 0) }));
    const lineas = [];
    if (eqL.length) {
      const n = notasTrono(eqL, B);
      lineas.push(`<p class="text-[11px] font-extrabold text-ambar-700">Tu equipo ahora (${eqL.length}): ⚔️ quitarlo <span style="color:${colPct(n.gA)}">≈ ${pctT(n.gA)}</span> · 🛡️ defenderlo <span style="color:${colPct(n.gD)}">≈ ${pctT(n.gD)}</span></p>`);
      const mal = [];
      for (const x of validos) {
        const l = luchadorT(x.c, null), falta = l.tipos.filter(tp => !(x.m.movs[tp] > 0)).map(bonito);
        const uso = usoNormal(l, [...B.poolA, ...B.poolD]);
        if (uso >= 0.05 && !l.tipos.includes('normal') && !(x.m.movs.normal > 0)) falta.push('Normal');
        if (falta.length) mal.push(`${x.m.nombre} (le falta ${falta.join(' y ')})`);
      }
      if (mal.length) lineas.push(`<p class="text-[10px] font-semibold text-tinta-600">🎯 Movimientos: ${mal.join(' · ')}.</p>`);
    } else lineas.push('<p class="text-[11px] font-semibold text-tinta-600">Aún no tienes a nadie puesto en este trono.</p>');
    for (const x of cs.filter(y => !y.c)) lineas.push(`<p class="text-[10px] font-semibold text-tinta-400">No encuentro a ${x.m.nombre} en tu colección.</p>`);
    const ids = new Set(validos.map(x => String(x.c.id)));
    const yaEs = r.eq.length === ids.size && r.eq.every(c => ids.has(String(c.id)));
    lineas.push(`<p class="text-[11px] font-semibold text-tinta-600">⭐ El mejor (${r.eq.length}): <b>${r.eq.map(c => c.nombre).join(' · ')}</b> · ⚔️ ≈ ${pctT(r.gA)} · 🛡️ ≈ ${pctT(r.gD)}</p>`);
    // lo aprendido de los combates de este trono
    const vistosTr = equiposTrono(t), tit = titularesTrono()[t];
    if (vistosTr.length) {
      const deTit = vistosTr.find(e => e.rol === 'reto' && e.rival === tit);
      const perdidas = vistosTr.filter(e => e.gane === false).slice(0, 3);
      lineas.push(`<p class="text-[10px] font-semibold text-tinta-500">🎞️ Aprendido de ${vistosTr.length} combate${vistosTr.length === 1 ? '' : 's'} de este trono${deTit ? ` · el titular (${tit}) lleva <b>${deTit.nombres.join(', ')}</b>` : ''}${perdidas.length ? ` · te ganaron: ${perdidas.map(e => `${e.rival} (${e.nombres.join(', ')})`).join('; ')}` : ''}. Se tienen en cuenta en el cálculo.</p>`);
    } else lineas.push('<p class="text-[10px] font-semibold text-tinta-400">🎞️ Abre tus combates de este trono («Combates» › «▶ Ver») y aprenderá qué equipos lleva la gente de verdad.</p>');
    const tams = Object.entries(r.porTam || {}).map(([k, v]) => `${k}: ${pctT(v)}`).join(' · ');
    if (tams) lineas.push(`<p class="text-[10px] font-semibold text-tinta-400">Según cuántos lleves: ${tams}. Como salen 3 al azar, uno flojo sale igual de a menudo que los buenos: a veces rinde más llevar menos.</p>`);
    lineas.push(`<button type="button" class="axt-auto boton-principal w-full !py-2 text-xs">${yaEs ? '🤖 Revisar movimientos y guardar' : '🤖 Poner el mejor equipo y guardar'}</button><p class="axt-auto-msg text-center text-[10px] font-semibold text-tinta-500"></p>`);
    pinta(`<p class="text-[11px] font-extrabold">👑 Trono de ${bonito(t)}</p>${lineas.join('')}`);
  }

  /* ---- Poner el mejor equipo solo: quita los que sobran, añade los que faltan (con el buscador de «Añadir»),
   *      deja en cada uno al menos un movimiento de cada tipo suyo (y Normal si le sirve) y guarda. ---- */
  const espera = ms => new Promise(ok => setTimeout(ok, ms));
  const propsReact = el => { const k = Object.keys(el).find(x => x.startsWith('__reactProps$')); return k ? el[k] : null; };
  function escribir(input, v) {
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    set.call(input, v);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
  const buscadorTrono = () => $$('input').find(i => /buscar por nombre/i.test(i.getAttribute('placeholder') || ''));
  // La entrada de la lista de «Añadir» con ese nombre: lo que tenga el clic, subiendo desde el texto del nombre
  function entradaLista(input, nombre) {
    let cont = input;
    while (cont && !/Nv\.\s*\d+/.test(cont.textContent || '')) cont = cont.parentElement;
    if (!cont) return null;
    const textos = $$('p, span', cont).filter(e => !e.children.length && (e.textContent || '').trim() === nombre);
    for (const tx of textos) {
      for (let el = tx; el && el !== cont; el = el.parentElement) {
        const pr = propsReact(el);
        if (el.tagName === 'BUTTON' || (pr && typeof pr.onClick === 'function')) return el;
      }
    }
    return null;
  }
  const msgAuto = txt => { const p = document.querySelector('#axt-trono-ficha .axt-auto-msg'); if (p) p.textContent = txt; };
  async function ajustarMovs(nombre, l, quiereNormal) {
    const quiere = [...l.tipos, ...(quiereNormal && !l.tipos.includes('normal') ? ['normal'] : [])];
    for (let paso = 0; paso < 10; paso++) {
      const h = huecosTrono().find(x => nombreHueco(x) === nombre);
      if (!h) return false;
      const gr = gruposMovs(h), cuenta = g => g.btns.filter(botonSel).length;
      const total = gr.reduce((x, g) => x + cuenta(g), 0);
      const libre = g => g.btns.find(b => !botonSel(b) && !b.disabled);
      // quitar Normal si no le sirve
      const normalSobra = gr.find(g => g.t === 'normal' && !quiere.includes('normal') && cuenta(g) > 0);
      if (normalSobra) { normalSobra.btns.find(botonSel).click(); await espera(250); continue; }
      const falta = gr.find(g => quiere.includes(g.t) && cuenta(g) === 0 && g.btns.length);
      if (falta) {
        if (total >= 4) {
          const g = gr.filter(x => cuenta(x) >= 2).sort((a, b) => cuenta(b) - cuenta(a))[0];
          if (!g) return false;
          g.btns.find(botonSel).click(); await espera(250); continue;
        }
        const b = libre(falta);
        if (!b) return false;
        b.click(); await espera(250); continue;
      }
      // hasta 4, con movimientos de sus tipos (cuál dentro de cada tipo da igual)
      if (total < 4) {
        const g = gr.find(x => quiere.includes(x.t) && x.t !== 'normal' && libre(x)) || gr.find(x => quiere.includes(x.t) && libre(x));
        if (g) { libre(g).click(); await espera(250); continue; }
      }
      return true;
    }
    return true;
  }
  async function ponerMejorEquipo() {
    if (automatizando) return;
    const cole = coleccion(), F = leerFichaTrono();
    if (!cole || !F) return;
    const t = tipoTrono(F.miembros.map(m => ({ m, c: cole.lista.find(c => c.nombre === m.nombre) })));
    const r = t && memoTronos && memoTronos.res[t];
    if (!r || !r.n) return;
    automatizando = true;
    const objetivo = r.eq.map(c => c.nombre), fallos = [];
    try {
      // 1) quitar los que sobran
      for (let v = 0; v < 8; v++) {
        const sobra = leerFichaTrono().miembros.find(m => !objetivo.includes(m.nombre));
        if (!sobra) break;
        msgAuto(`Quitando a ${sobra.nombre}…`);
        const x = $$('button').find(b => (b.getAttribute('aria-label') || '') === 'Quitar a ' + sobra.nombre);
        if (!x) { fallos.push(`no pude quitar a ${sobra.nombre}`); break; }
        x.click(); await espera(450);
      }
      // 2) añadir los que faltan
      for (const nombre of objetivo) {
        if (leerFichaTrono().miembros.some(m => m.nombre === nombre)) continue;
        msgAuto(`Añadiendo a ${nombre}…`);
        let input = buscadorTrono();
        if (!input) { const b = $$('button').find(x => /^\s*\+\s*añadir/i.test(x.textContent || '')); if (b) { b.click(); await espera(500); } input = buscadorTrono(); }
        if (!input) { fallos.push(`no encuentro el buscador para añadir a ${nombre}`); continue; }
        escribir(input, nombre); await espera(500);
        const el = entradaLista(input, nombre);
        if (!el) { fallos.push(`${nombre} no sale en la lista`); escribir(input, ''); continue; }
        el.click(); await espera(700);
        if (!leerFichaTrono().miembros.some(m => m.nombre === nombre)) fallos.push(`no se añadió ${nombre}`);
        const inp2 = buscadorTrono();
        if (inp2 && inp2.value) escribir(inp2, '');
      }
      // 3) movimientos
      for (let i = 0; i < r.eq.length; i++) {
        msgAuto(`Movimientos de ${r.eq[i].nombre}…`);
        if (!await ajustarMovs(r.eq[i].nombre, luchadorT(r.eq[i], null), r.normal[i] >= 0.05)) fallos.push(`movimientos de ${r.eq[i].nombre}`);
      }
      // 4) guardar (solo si todo ha salido bien)
      if (!fallos.length) {
        const g = $$('button').find(b => /^\s*guardar equipo\s*$/i.test(b.textContent || '') && !b.disabled);
        if (g) { msgAuto('Guardando…'); g.click(); await espera(900); }
      }
    } catch (e) { console.warn('[axt tronos auto]', e); fallos.push('error: ' + (e && e.message)); }
    finally {
      automatizando = false;
      const caja = document.getElementById('axt-trono-ficha');
      if (caja) { caja.dataset.firma = ''; caja.dataset.html = ''; }
      fichaTrono();
      msgAuto(fallos.length ? `⚠️ No he podido con todo (no he guardado): ${fallos.join(' · ')}.` : '✔ Equipo puesto y guardado.');
    }
  }

  /* ------------------------------------------------------------------ *
   *  ARRANQUE: solo en /equipo, /torre y /tronos; se repasa al cambiar la página (con un pequeño retraso para no cargar)
   * ------------------------------------------------------------------ */
  let prog = null, listo = false;
  function programar() {
    clearTimeout(prog);
    prog = setTimeout(() => {
      if (!listo) return;
      try {
        if (enEquipo()) { decorarTarjetas(); decorarFichas(); botonOrden(); ordenar(); ordenEquipo(); }
        else if (enTorre()) torre();
        else if (enTronos()) tronos();
      } catch (e) { console.warn('[axt]', e); }
    }, 250);
  }
  new MutationObserver(muts => {
    if (!enEquipo() && !enTorre() && !enTronos()) return;
    // se ignoran los cambios que hace este mismo script
    if (muts.every(m => (m.target.nodeType === 1 && m.target.closest('[data-ax-ignore]')) || [...m.addedNodes].every(n => n.nodeType === 1 && (n.classList.contains('axt-tier') || n.classList.contains('axt-ficha') || n.id === 'axt-equipo' || n.id === 'axt-torre' || n.id === 'axt-tronos' || n.id === 'axt-trono-ficha' || n.classList.contains('axt-trono') || n.classList.contains('axt-orden') || n.classList.contains('axt-predic') || n.classList.contains('axt-rec') || n.hasAttribute('data-ax-ignore'))))) return;
    programar();
  }).observe(document.documentElement, { childList: true, subtree: true });
  // se espera a que la web termine de montarse (tocar el DOM antes provoca errores de hidratación de React)
  calcularCal();
  const arrancar = () => setTimeout(() => { listo = true; programar(); }, 1500);
  if (document.readyState === 'complete') arrancar(); else window.addEventListener('load', arrancar);

  window.__axTiers = { analizar, stats, datos, mejoras, calibracion: () => ({ ...CAL, ...infoCal }), estadoTorre, luchadorT, notaEquipo, simulaciones, mejorEquipo, poolTorre, candidatosUnicos, tierTorre, calcularTronoPasos, correrPasos, vistosTorre, leerHistorialFondo };
})();
