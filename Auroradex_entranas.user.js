// ==UserScript==
// @name         Aurora Dex · Entrañas del Monte Plateado (IA)
// @namespace    auroradex-entranas
// @version      1.2.0
// @updateURL    https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_entranas.user.js
// @downloadURL  https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_entranas.user.js
// @description  Solo en /entranas. Asistente con aprendizaje: graba todo lo que ve (cada Pokémon, movimiento, golpe, bendición, puerta, suceso, objeto y mejora; también los nuevos, que entiende por su texto), aprende de ello (nivel de los rivales por piso, qué sale en cada bioma, cuánto pega cada uno de verdad, qué hay detrás de cada puerta) y en cada decisión juega cada opción muchas veces hacia delante (Monte Carlo) antes de elegir: prestado, bendición o volver a tirar, puerta, reclutar y a quién dejar, y el orden del equipo (lo pone arrastrando). Piensa a largo plazo (el «techo»: hasta qué piso aguanta tu equipo con sus bendiciones, bioma a bioma): Élite pronto para llegar antes al 100, bendiciones que duran toda la partida, Botín al principio, solo reclutas que sirvan. Dice qué mejora del campamento rinde más por esquirla y cuál sube más el techo. Con ▶ baja solo; se para ante lo que no conoce y nunca pulsa «Retirarse». Exporta e importa todo.
// @match        https://auroradex.es/*
// @match        https://www.auroradex.es/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  'use strict';
  const VERSION = '1.2.0';
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

  // Lo aprendido de tus bajadas hasta ahora (se usa la primera vez; luego manda lo que aprende)
  const SEMILLA = {"v":4,"creada":0,"especies":{"1":{"num":1,"nombre":"Bulbasaur","tipos":["planta","veneno"],"biomas":{"bosque":1},"vistos":1,"movs":{"Drenadoras":1,"Rayo Solar":1}},"4":{"num":4,"nombre":"Charmander","tipos":["fuego"],"biomas":{"magma":1},"vistos":1,"movs":{}},"7":{"num":7,"nombre":"Squirtle","tipos":["agua"],"biomas":{"lago":1},"vistos":1,"movs":{"Pistola Agua":1},"nueva":false,"nivel":[25,25]},"8":{"num":8,"nombre":"Wartortle","tipos":["agua"],"biomas":{},"vistos":0,"movs":{},"nueva":false,"tiposJuego":true},"11":{"num":11,"nombre":"Metapod","tipos":["bicho"],"biomas":{"bosque":2},"vistos":2,"movs":{"Disparo Demora":1,"Zumbido":1,"Golpe Cabeza":1,"Aranazo":1},"nueva":false,"nivel":[38,100],"tiposJuego":true,"psObs":[[100,528,0]]},"12":{"num":12,"nombre":"Butterfree","tipos":["bicho","volador"],"biomas":{"bosque":1},"vistos":1,"movs":{"Zumbido":1},"nueva":false,"nivel":[34,34],"tiposJuego":true},"13":{"num":13,"nombre":"Weedle","tipos":["bicho","veneno"],"biomas":{"bosque":1,"cripta":1},"vistos":2,"movs":{"Picadura":1,"Tijera X":1},"nueva":false,"nivel":[39,100],"tiposJuego":true,"psObs":[[100,543,0]]},"14":{"num":14,"nombre":"Kakuna","tipos":["bicho","veneno"],"biomas":{"bosque":1,"cripta":1},"vistos":2,"movs":{"Golpe Cabeza":1,"Tijera X":1,"Picadura":1},"tiposJuego":true,"psObs":[[99,266,0]],"nivel":[99,99]},"15":{"num":15,"nombre":"Beedrill","tipos":["bicho","veneno"],"biomas":{"cripta":1},"vistos":1,"movs":{"Aranazo":1,"Ataque Rápido":1}},"24":{"num":24,"nombre":"Arbok","tipos":["veneno"],"biomas":{"cripta":2},"vistos":2,"movs":{"Picotazo Veneno":1},"nueva":false,"nivel":[47,50],"tiposJuego":true,"psObs":[[50,154,0]]},"27":{"num":27,"nombre":"Sandshrew","tipos":["tierra"],"biomas":{"roca":4},"vistos":4,"movs":{"Terremoto":1,"Excavar":1},"tiposJuego":true,"psObs":[[73,196,0]],"nivel":[19,79]},"28":{"num":28,"nombre":"Sandslash","tipos":["tierra"],"biomas":{"roca":1},"vistos":1,"movs":{"Hueso Palo":1},"nueva":false,"nivel":[77,77]},"29":{"num":29,"nombre":"Nidoran♀","tipos":["veneno"],"biomas":{"cripta":1},"vistos":1,"movs":{"Golpe Cabeza":1}},"30":{"num":30,"nombre":"Nidorina","tipos":["veneno"],"biomas":{"cripta":1},"vistos":1,"movs":{"Picotazo Veneno":1},"nueva":false,"tiposJuego":true,"psObs":[[100,363,0]],"nivel":[100,100],"reclutado":1},"31":{"num":31,"nombre":"Nidoqueen","tipos":["veneno","tierra"],"biomas":{"cripta":1},"vistos":1,"movs":{"Picotazo Veneno":1},"nueva":false,"nivel":[46,46]},"32":{"num":32,"nombre":"Nidoran♂","tipos":["veneno"],"biomas":{"cripta":1},"vistos":1,"movs":{"Picotazo Veneno":1},"nueva":false,"tiposJuego":true,"psObs":[[99,548,0]],"nivel":[99,99],"reclutado":1},"33":{"num":33,"nombre":"Nidorino","tipos":["veneno"],"biomas":{"cripta":1},"vistos":1,"movs":{"Picotazo Veneno":1},"nueva":false,"tiposJuego":true,"psObs":[[43,135,0]],"nivel":[43,43]},"34":{"num":34,"nombre":"Nidoking","tipos":["veneno","tierra"],"biomas":{"roca":1,"cripta":1},"vistos":2,"movs":{"Picotazo Veneno":1},"nueva":false,"tiposJuego":true,"psObs":[[79,284,0]],"nivel":[43,79]},"38":{"num":38,"nombre":"Ninetales","tipos":["fuego"],"biomas":{"magma":2},"vistos":2,"movs":{"Golpe Cabeza":1,"Lanzallamas":1},"nueva":false,"nivel":[59,100],"tiposJuego":true,"psObs":[[59,202,0]],"reclutado":1},"42":{"num":42,"nombre":"Golbat","tipos":["veneno","volador"],"biomas":{"cripta":1},"vistos":1,"movs":{"Ataque Ala":1,"Picotazo":1,"Picotazo Veneno":1,"Pájaro Osado":1}},"43":{"num":43,"nombre":"Oddish","tipos":["planta","veneno"],"biomas":{"bosque":1},"vistos":1,"movs":{},"nueva":false,"nivel":[29,29],"tiposJuego":true},"44":{"num":44,"nombre":"Gloom","tipos":["planta","veneno"],"biomas":{"bosque":2,"cripta":1},"vistos":3,"movs":{"Drenadoras":1,"Rayo Solar":1},"tiposJuego":true,"psObs":[[45,140,0]],"nivel":[45,95]},"45":{"num":45,"nombre":"Vileplume","tipos":["planta","veneno"],"biomas":{"cripta":1,"bosque":1},"vistos":2,"movs":{"Drenadoras":1,"Rayo Solar":1},"nueva":false,"nivel":[98,98],"tiposJuego":true},"46":{"num":46,"nombre":"Paras","tipos":["bicho","planta"],"biomas":{"bosque":1},"vistos":1,"movs":{},"nueva":false,"tiposJuego":true,"psObs":[[30,75,0]],"nivel":[30,30]},"49":{"num":49,"nombre":"Venomoth","tipos":["bicho","veneno"],"biomas":{"bosque":1,"cripta":1},"vistos":2,"movs":{"Disparo Demora":1,"Zumbido":1},"nueva":false,"nivel":[36,100],"tiposJuego":true,"psObs":[[100,376,0]]},"50":{"num":50,"nombre":"Diglett","tipos":["tierra"],"biomas":{"roca":3},"vistos":3,"movs":{"Excavar":1,"Terremoto":1,"Hueso Palo":1},"nueva":false,"nivel":[12,100],"tiposJuego":true,"psObs":[[12,29,0],[100,242,0]]},"54":{"num":54,"nombre":"Psyduck","tipos":["agua"],"biomas":{"lago":1},"vistos":1,"movs":{"Hidropulso":1},"nueva":false,"nivel":[87,87]},"56":{"num":56,"nombre":"Mankey","tipos":["lucha"],"biomas":{"roca":1},"vistos":1,"movs":{"Sumision":1},"nueva":false,"tiposJuego":true,"psObs":[[21,60,0]],"nivel":[19,19]},"57":{"num":57,"nombre":"Primeape","tipos":["lucha"],"biomas":{"roca":2},"vistos":2,"movs":{"Placaje":1}},"59":{"num":59,"nombre":"Arcanine","tipos":["fuego"],"biomas":{"magma":1},"vistos":1,"movs":{},"nueva":false,"tiposJuego":true,"psObs":[[64,250,0]],"nivel":[64,64]},"60":{"num":60,"nombre":"Poliwag","tipos":["agua"],"biomas":{"lago":3},"vistos":3,"movs":{"Cascada":1},"nueva":false,"tiposJuego":true,"psObs":[[24,66,0],[28,75,0],[84,198,0]],"nivel":[24,84]},"62":{"num":62,"nombre":"Poliwrath","tipos":["agua","lucha"],"biomas":{"lago":1},"vistos":1,"movs":{"Puño Dinámico":1,"Patada Baja":1},"nueva":false,"nivel":[89,89]},"64":{"num":64,"nombre":"Kadabra","tipos":["psiquico"],"biomas":{"cripta":1},"vistos":1,"movs":{"Psiquico":1,"Psicorrayo":1},"nueva":false,"nivel":[100,100]},"65":{"num":65,"nombre":"Alakazam","tipos":["psiquico"],"biomas":{"cripta":1},"vistos":1,"movs":{"Psicorrayo":1,"Confusion":1},"nueva":false,"tiposJuego":true,"psObs":[[100,290,0]],"nivel":[100,100],"reclutado":1},"70":{"num":70,"nombre":"Weepinbell","tipos":["planta","veneno"],"biomas":{"cripta":2},"vistos":2,"movs":{"Hoja Afilada":1,"Látigo Cepa":1},"tiposJuego":true,"psObs":[[41,134,0]],"nivel":[41,41]},"71":{"num":71,"nombre":"Victreebel","tipos":["planta","veneno"],"biomas":{"bosque":2},"vistos":2,"movs":{"Hoja Afilada":1,"Látigo Cepa":1},"nivel":[98,98]},"72":{"num":72,"nombre":"Tentacool","tipos":["agua","veneno"],"biomas":{"lago":1},"vistos":1,"movs":{},"nueva":false,"nivel":[87,87]},"73":{"num":73,"nombre":"Tentacruel","tipos":["agua","veneno"],"biomas":{"lago":2},"vistos":2,"movs":{"Bomba Lodo":1,"Residuos":1,"Acido":1,"Pistola Agua":1,"Hidropulso":1,"Burbuja":1},"nueva":false,"tiposJuego":true,"psObs":[[85,303,0],[100,637,0]],"nivel":[85,100],"reclutado":1},"74":{"num":74,"nombre":"Geodude","tipos":["roca","tierra"],"biomas":{"roca":1},"vistos":1,"movs":{},"nueva":false,"tiposJuego":true,"psObs":[[12,40,0]],"nivel":[12,12],"reclutado":1},"75":{"num":75,"nombre":"Graveler","tipos":["roca","tierra"],"biomas":{"roca":1},"vistos":1,"movs":{"Avalancha":1},"nueva":false,"tiposJuego":true,"psObs":[[18,61,0]],"nivel":[18,18]},"76":{"num":76,"nombre":"Golem","tipos":["roca","tierra"],"biomas":{"roca":2},"vistos":2,"movs":{"Avalancha":1,"Roca Afilada":1,"Pedrada":1},"nueva":false,"tiposJuego":true,"psObs":[[100,623,0]],"nivel":[78,100]},"77":{"num":77,"nombre":"Ponyta","tipos":["fuego"],"biomas":{"magma":2},"vistos":2,"movs":{"Puño Fuego":1,"Golpe Cabeza":1,"Aranazo":1,"Ataque Rápido":1},"nueva":false,"tiposJuego":true,"psObs":[[62,169,0],[99,376,0]],"nivel":[62,99],"reclutado":1},"78":{"num":78,"nombre":"Rapidash","tipos":["fuego"],"biomas":{"magma":3},"vistos":3,"movs":{"Rueda Fuego":1,"Puño Fuego":1,"Ataque Rápido":1,"Golpe Cabeza":1,"Placaje":1,"Aranazo":1},"nueva":false,"tiposJuego":true,"psObs":[[100,445,0]],"nivel":[98,100],"reclutado":1},"80":{"num":80,"nombre":"Slowbro","tipos":["agua","psiquico"],"biomas":{"lago":1,"cripta":1},"vistos":2,"movs":{"Psiquico":1,"Psicorrayo":1},"nueva":false,"tiposJuego":true,"psObs":[[28,121,0]],"nivel":[28,47]},"81":{"num":81,"nombre":"Magnemite","tipos":["electrico","acero"],"biomas":{"glaciar":3},"vistos":3,"movs":{"Rayo":1,"Impactrueno":1,"Foco Resplandor":1},"nivel":[55,100],"tiposJuego":true,"psObs":[[100,234,0]],"reclutado":1},"82":{"num":82,"nombre":"Magneton","tipos":["electrico","acero"],"biomas":{"glaciar":4},"vistos":4,"movs":{"Impactrueno":1,"Rayo":1,"Foco Resplandor":1},"nivel":[59,100],"tiposJuego":true,"psObs":[[59,161,0]]},"86":{"num":86,"nombre":"Seel","tipos":["agua"],"biomas":{"lago":1},"vistos":1,"movs":{"Aranazo":1},"nueva":false,"nivel":[24,24]},"87":{"num":87,"nombre":"Dewgong","tipos":["agua","hielo"],"biomas":{"glaciar":3,"lago":1},"vistos":4,"movs":{"Burbuja":1,"Hidropulso":1,"Pistola Agua":1,"Ventisca":1,"Rayo Hielo":1,"Golpe Cabeza":1,"Ataque Rápido":1},"tiposJuego":true,"psObs":[[61,239,0]],"nivel":[61,99]},"90":{"num":90,"nombre":"Shellder","tipos":["agua"],"biomas":{"lago":2},"vistos":2,"movs":{"Cascada":1,"Ataque Rápido":1,"Golpe Cabeza":1,"Aranazo":1,"Placaje":1},"tiposJuego":true,"psObs":[[100,392,0]],"nivel":[100,100],"reclutado":1},"91":{"num":91,"nombre":"Cloyster","tipos":["agua","hielo"],"biomas":{"glaciar":4},"vistos":4,"movs":{"Aranazo":1,"Ataque Rápido":1,"Cascada":1,"Golpe Cabeza":1,"Puño Hielo":1},"tiposJuego":true,"psObs":[[55,151,0]],"nivel":[55,100]},"93":{"num":93,"nombre":"Haunter","tipos":["fantasma","veneno"],"biomas":{"cripta":1},"vistos":1,"movs":{"Acido":1,"Bomba Lodo":1,"Residuos":1},"nueva":false,"tiposJuego":true,"psObs":[[49,129,0]],"nivel":[49,49]},"94":{"num":94,"nombre":"Gengar","tipos":["fantasma","veneno"],"biomas":{"cripta":3},"vistos":3,"movs":{"Bola Sombra":1,"Mal de Ojo":1,"Residuos":1,"Bomba Lodo":1,"Acido":1},"tiposJuego":true,"psObs":[[100,682,0]],"nivel":[98,100]},"97":{"num":97,"nombre":"Hypno","tipos":["psiquico"],"biomas":{"cripta":1},"vistos":1,"movs":{"Confusion":1,"Premonicion":1},"nueva":false,"nivel":[48,48],"tiposJuego":true,"reclutado":1},"98":{"num":98,"nombre":"Krabby","tipos":["agua"],"biomas":{"lago":3},"vistos":3,"movs":{"Placaje":1,"Cascada":1},"nueva":false,"tiposJuego":true,"psObs":[[27,65,0],[80,166,0]],"nivel":[27,88],"reclutado":1},"99":{"num":99,"nombre":"Kingler","tipos":["agua"],"biomas":{"lago":1},"vistos":1,"movs":{"Golpe Cabeza":1,"Ataque Rápido":1,"Placaje":1,"Aranazo":1},"nueva":false,"tiposJuego":true,"psObs":[[98,535,0]],"nivel":[98,98]},"103":{"num":103,"nombre":"Exeggutor","tipos":["planta","psiquico"],"biomas":{"cripta":1,"bosque":1},"vistos":2,"movs":{"Confusion":1,"Psicorrayo":1,"Psiquico":1,"Drenadoras":1},"tiposJuego":true,"psObs":[[91,364,0]],"nivel":[91,91]},"104":{"num":104,"nombre":"Cubone","tipos":["tierra"],"biomas":{"roca":1},"vistos":1,"movs":{"Terremoto":1,"Hueso Palo":1},"nueva":false,"nivel":[100,100]},"106":{"num":106,"nombre":"Hitmonlee","tipos":["lucha"],"biomas":{},"vistos":0,"movs":{},"nueva":false,"tiposJuego":true,"reclutado":1},"109":{"num":109,"nombre":"Koffing","tipos":["veneno"],"biomas":{"cripta":2},"vistos":2,"movs":{"Picotazo Veneno":1},"nueva":false,"nivel":[48,100]},"110":{"num":110,"nombre":"Weezing","tipos":["veneno"],"biomas":{},"vistos":0,"movs":{"Picotazo Veneno":1,"Ataque Rápido":1},"nueva":false,"tiposJuego":true,"reclutado":1},"111":{"num":111,"nombre":"Rhyhorn","tipos":["tierra","roca"],"biomas":{"roca":2},"vistos":2,"movs":{"Hueso Palo":1,"Lanzarrocas":1,"Pedrada":1,"Roca Afilada":1,"Terremoto":1,"Excavar":1},"tiposJuego":true,"psObs":[[98,569,0]],"nivel":[98,98],"reclutado":1},"112":{"num":112,"nombre":"Rhydon","tipos":["tierra","roca"],"biomas":{"roca":1},"vistos":1,"movs":{"Hueso Palo":1,"Excavar":1,"Terremoto":1,"Pedrada":1,"Avalancha":1},"nueva":false,"tiposJuego":true,"psObs":[[100,755,0]],"nivel":[100,100]},"114":{"num":114,"nombre":"Tangela","tipos":["planta"],"biomas":{"bosque":1},"vistos":1,"movs":{"Rayo Solar":1,"Drenadoras":1},"nueva":false,"tiposJuego":true,"psObs":[[91,282,0]],"nivel":[91,91]},"117":{"num":117,"nombre":"Seadra","tipos":["agua"],"biomas":{"lago":1},"vistos":1,"movs":{"Pistola Agua":1,"Hidropulso":1,"Burbuja":1},"nueva":false,"nivel":[100,100]},"118":{"num":118,"nombre":"Goldeen","tipos":["agua"],"biomas":{"lago":2},"vistos":2,"movs":{"Cascada":1},"tiposJuego":true,"psObs":[[25,72,0]],"nivel":[25,25]},"119":{"num":119,"nombre":"Seaking","tipos":["agua"],"biomas":{"lago":2},"vistos":2,"movs":{"Cascada":1,"Placaje":1,"Aranazo":1,"Golpe Cabeza":1,"Ataque Rápido":1},"tiposJuego":true,"psObs":[[100,694,0]],"nivel":[100,100]},"120":{"num":120,"nombre":"Staryu","tipos":["agua"],"biomas":{"lago":2},"vistos":2,"movs":{"Pistola Agua":1},"nueva":false,"tiposJuego":true,"psObs":[[19,50,0]],"nivel":[19,28],"reclutado":1},"122":{"num":122,"nombre":"Mr. Mime","tipos":["psiquico","hada"],"biomas":{},"vistos":0,"movs":{},"nueva":false,"tiposJuego":true},"124":{"num":124,"nombre":"Jynx","tipos":["hielo","psiquico"],"biomas":{"glaciar":3},"vistos":3,"movs":{"Rayo Hielo":1,"Ventisca":1,"Canto Helado":1},"tiposJuego":true,"psObs":[[100,371,0]],"nivel":[100,100],"reclutado":1},"126":{"num":126,"nombre":"Magmar","tipos":["fuego"],"biomas":{"magma":1},"vistos":1,"movs":{"Puño Fuego":1}},"131":{"num":131,"nombre":"Lapras","tipos":["agua","hielo"],"biomas":{"glaciar":6},"vistos":6,"movs":{"Aranazo":1,"Ataque Rápido":1,"Burbuja":1,"Golpe Cabeza":1,"Hidropulso":1,"Placaje":1,"Rayo Hielo":1,"Ventisca":1,"Canto Helado":1,"Pistola Agua":1},"tiposJuego":true,"psObs":[[54,278,0],[100,665,0],[98,613,0]],"nivel":[54,100],"reclutado":2},"134":{"num":134,"nombre":"Vaporeon","tipos":["agua"],"biomas":{"lago":1},"vistos":1,"movs":{"Placaje":1,"Golpe Cabeza":1,"Aranazo":1,"Ataque Rápido":1},"nueva":false,"tiposJuego":true,"psObs":[[99,958,0]],"nivel":[99,99],"reclutado":1},"136":{"num":136,"nombre":"Flareon","tipos":["fuego"],"biomas":{"magma":2},"vistos":2,"movs":{"Ataque Rápido":1,"Aranazo":1},"nueva":false,"nivel":[66,100],"tiposJuego":true,"psObs":[[100,482,0]]},"138":{"num":138,"nombre":"Omanyte","tipos":["roca","agua"],"biomas":{"lago":1},"vistos":1,"movs":{},"nueva":false,"nivel":[27,27]},"139":{"num":139,"nombre":"Omastar","tipos":["roca","agua"],"biomas":{"roca":1},"vistos":1,"movs":{"Avalancha":1,"Lanzarrocas":1,"Pedrada":1,"Roca Afilada":1},"nueva":false,"nivel":[100,100]},"140":{"num":140,"nombre":"Kabuto","tipos":["roca","agua"],"biomas":{"roca":2,"lago":1},"vistos":3,"movs":{"Pedrada":1,"Lanzarrocas":1},"nueva":false,"nivel":[18,76],"tiposJuego":true,"psObs":[[25,61,0]]},"141":{"num":141,"nombre":"Kabutops","tipos":["roca","agua"],"biomas":{"lago":1},"vistos":1,"movs":{"Pedrada":1,"Roca Afilada":1,"Lanzarrocas":1,"Avalancha":1},"nueva":false,"nivel":[100,100]},"142":{"num":142,"nombre":"Aerodactyl","tipos":["roca","volador"],"biomas":{"roca":1},"vistos":1,"movs":{"Roca Afilada":1,"Lanzarrocas":1,"Pedrada":1,"Avalancha":1},"nueva":false,"nivel":[99,99]},"143":{"num":143,"nombre":"Snorlax","tipos":["normal"],"biomas":{},"vistos":0,"movs":{"Golpe Cabeza":1,"Aranazo":1,"Placaje":1,"Ataque Rápido":1,"Forcejeo":1},"nueva":false,"tiposJuego":true,"reclutado":1},"147":{"num":147,"nombre":"Dratini","tipos":["dragon"],"biomas":{"magma":2},"vistos":2,"movs":{"Garra Dragón":1,"Enfado":1},"nueva":false,"tiposJuego":true,"psObs":[[100,332,0],[100,370,0]],"nivel":[100,100]},"148":{"num":148,"nombre":"Dragonair","tipos":["dragon"],"biomas":{"magma":3},"vistos":3,"movs":{"Enfado":1,"Garra Dragón":1},"tiposJuego":true,"psObs":[[58,178,0]],"nivel":[58,58],"reclutado":1},"152":{"num":152,"nombre":"Chikorita","tipos":["planta"],"biomas":{"bosque":3},"vistos":3,"movs":{"Rayo Solar":1,"Drenadoras":1},"nivel":[37,99]},"153":{"num":153,"nombre":"Bayleef","tipos":["planta"],"biomas":{"bosque":2},"vistos":2,"movs":{"Drenadoras":1,"Rayo Solar":1},"nueva":false,"tiposJuego":true,"psObs":[[94,277,0]],"nivel":[94,99]},"154":{"num":154,"nombre":"Meganium","tipos":["planta"],"biomas":{"bosque":3},"vistos":3,"movs":{"Drenadoras":1,"Rayo Solar":1},"nueva":false,"nivel":[92,100],"tiposJuego":true,"reclutado":1,"psObs":[[99,350,0],[100,354,0]]},"156":{"num":156,"nombre":"Quilava","tipos":["fuego"],"biomas":{"magma":3},"vistos":3,"movs":{"Golpe Cabeza":1,"Placaje":1,"Ataque Rápido":1},"tiposJuego":true,"psObs":[[70,205,0],[100,415,0]],"nivel":[70,100],"reclutado":1},"158":{"num":158,"nombre":"Totodile","tipos":["agua"],"biomas":{"lago":1},"vistos":1,"movs":{"Ataque Rápido":1},"nueva":false,"nivel":[26,26]},"166":{"num":166,"nombre":"Ledian","tipos":["bicho","volador"],"biomas":{"bosque":2},"vistos":2,"movs":{"Zumbido":1},"nueva":false,"nivel":[32,39],"tiposJuego":true},"167":{"num":167,"nombre":"Spinarak","tipos":["bicho","veneno"],"biomas":{"cripta":1,"bosque":1},"vistos":2,"movs":{"Tijera X":1},"nueva":false,"nivel":[38,100],"tiposJuego":true,"psObs":[[38,97,0]]},"170":{"num":170,"nombre":"Chinchou","tipos":["agua","electrico"],"biomas":{"lago":1},"vistos":1,"movs":{"Rayo":1,"Impactrueno":1},"nueva":false,"tiposJuego":true,"psObs":[[100,610,0]],"nivel":[100,100]},"171":{"num":171,"nombre":"Lanturn","tipos":["agua","electrico"],"biomas":{"lago":2},"vistos":2,"movs":{"Hidropulso":1,"Pistola Agua":1,"Burbuja":1,"Impactrueno":1,"Rayo":1},"nueva":false,"nivel":[26,82],"tiposJuego":true,"psObs":[[82,403,0]],"reclutado":1},"177":{"num":177,"nombre":"Natu","tipos":["psiquico","volador"],"biomas":{"cripta":1},"vistos":1,"movs":{"Confusion":1},"nueva":false,"tiposJuego":true,"psObs":[[50,124,0]],"nivel":[50,50]},"178":{"num":178,"nombre":"Xatu","tipos":["psiquico","volador"],"biomas":{},"vistos":0,"movs":{},"nueva":false,"tiposJuego":true},"184":{"num":184,"nombre":"Azumarill","tipos":["agua","hada"],"biomas":{"lago":1},"vistos":1,"movs":{"Hidropulso":1,"Pistola Agua":1,"Burbuja":1},"nueva":false,"nivel":[83,83]},"187":{"num":187,"nombre":"Hoppip","tipos":["planta","volador"],"biomas":{"bosque":2},"vistos":2,"movs":{"Rayo Solar":1,"Drenadoras":1},"nueva":false,"nivel":[95,95],"tiposJuego":true,"reclutado":1,"psObs":[[95,208,0]]},"188":{"num":188,"nombre":"Skiploom","tipos":["planta","volador"],"biomas":{"bosque":3},"vistos":3,"movs":{"Drenadoras":1,"Rayo Solar":1},"nueva":false,"nivel":[33,92],"tiposJuego":true,"reclutado":1,"psObs":[[37,112,0],[92,257,0]]},"189":{"num":189,"nombre":"Jumpluff","tipos":["planta","volador"],"biomas":{"bosque":2},"vistos":2,"movs":{"Rayo Solar":1,"Drenadoras":1},"nueva":false,"nivel":[38,99]},"191":{"num":191,"nombre":"Sunkern","tipos":["planta"],"biomas":{},"vistos":0,"movs":{},"nueva":false,"tiposJuego":true},"192":{"num":192,"nombre":"Sunflora","tipos":["planta"],"biomas":{"bosque":2},"vistos":2,"movs":{"Drenadoras":1,"Rayo Solar":1},"nueva":false,"tiposJuego":true,"psObs":[[39,140,0],[100,732,0]],"nivel":[39,100]},"193":{"num":193,"nombre":"Yanma","tipos":["bicho","volador"],"biomas":{"bosque":3},"vistos":3,"movs":{"Picadura":1,"Tijera X":1,"Ataque Ala":1,"Pájaro Osado":1,"Picotazo":1},"nueva":false,"tiposJuego":true,"psObs":[[35,117,0]],"nivel":[35,100]},"194":{"num":194,"nombre":"Wooper","tipos":["agua","tierra"],"biomas":{"roca":2},"vistos":2,"movs":{"Terremoto":1},"nueva":false,"nivel":[12,18],"tiposJuego":true,"psObs":[[12,45,0]],"reclutado":2},"196":{"num":196,"nombre":"Espeon","tipos":["psiquico"],"biomas":{"cripta":1},"vistos":1,"movs":{"Confusion":1,"Premonicion":1},"nueva":false,"tiposJuego":true,"reclutado":1,"psObs":[[100,358,0]],"nivel":[100,100]},"198":{"num":198,"nombre":"Murkrow","tipos":["siniestro","volador"],"biomas":{"magma":1},"vistos":1,"movs":{},"nueva":false,"nivel":[66,66]},"199":{"num":199,"nombre":"Slowking","tipos":["agua","psiquico"],"biomas":{},"vistos":0,"movs":{"Psicorrayo":1,"Psiquico":1,"Pistola Agua":1,"Burbuja":1,"Hidropulso":1,"Confusion":1,"Premonicion":1},"nueva":false,"tiposJuego":true,"reclutado":1},"200":{"num":200,"nombre":"Misdreavus","tipos":["fantasma"],"biomas":{},"vistos":0,"movs":{},"nueva":false,"tiposJuego":true,"reclutado":1},"203":{"num":203,"nombre":"Girafarig","tipos":["normal","psiquico"],"biomas":{"cripta":1},"vistos":1,"movs":{"Golpe Cabeza":1,"Ataque Rápido":1},"nueva":false,"nivel":[100,100]},"204":{"num":204,"nombre":"Pineco","tipos":["bicho"],"biomas":{"bosque":1},"vistos":1,"movs":{"Picadura":1},"nueva":false,"tiposJuego":true,"psObs":[[29,86,0]],"nivel":[29,29]},"205":{"num":205,"nombre":"Forretress","tipos":["bicho","acero"],"biomas":{"glaciar":5,"bosque":1},"vistos":6,"movs":{"Cola Férrea":1,"Picadura":1,"Tijera X":1,"Placaje":1,"Aranazo":1,"Garra Metal":1},"tiposJuego":true,"psObs":[[38,137,0],[99,429,0],[51,179,0],[100,868,0]],"nivel":[38,100],"reclutado":1},"208":{"num":208,"nombre":"Steelix","tipos":["acero","tierra"],"biomas":{"glaciar":2},"vistos":2,"movs":{"Terremoto":1,"Hueso Palo":1,"Excavar":1},"nivel":[98,98],"tiposJuego":true},"212":{"num":212,"nombre":"Scizor","tipos":["bicho","acero"],"biomas":{"glaciar":4,"bosque":1},"vistos":5,"movs":{"Cabeza de Hierro":1,"Cola Férrea":1,"Garra Metal":1,"Tijera X":1,"Picadura":1},"nivel":[52,58]},"213":{"num":213,"nombre":"Shuckle","tipos":["bicho","roca"],"biomas":{"roca":3,"bosque":2},"vistos":5,"movs":{"Ataque Rápido":1,"Placaje":1,"Disparo Demora":1,"Zumbido":1},"tiposJuego":true,"psObs":[[78,138,0],[35,70,0],[80,142,0]],"nivel":[35,91],"reclutado":1},"214":{"num":214,"nombre":"Heracross","tipos":["bicho","lucha"],"biomas":{"roca":1,"bosque":1},"vistos":2,"movs":{"Ataque Rápido":1,"Golpe Cabeza":1,"Placaje":1}},"215":{"num":215,"nombre":"Sneasel","tipos":["siniestro","hielo"],"biomas":{"glaciar":2,"magma":1},"vistos":3,"movs":{"Mordisco":1,"Triturar":1,"Finta":1},"tiposJuego":true,"psObs":[[63,180,0]],"nivel":[63,100]},"218":{"num":218,"nombre":"Slugma","tipos":["fuego"],"biomas":{"magma":3},"vistos":3,"movs":{"Ascuas":1,"Lanzallamas":1},"nivel":[68,100]},"219":{"num":219,"nombre":"Magcargo","tipos":["fuego","roca"],"biomas":{"roca":1,"magma":2},"vistos":3,"movs":{"Pedrada":1,"Lanzarrocas":1,"Ascuas":1,"Lanzallamas":1},"nivel":[66,100]},"220":{"num":220,"nombre":"Swinub","tipos":["hielo","tierra"],"biomas":{"glaciar":5,"roca":1},"vistos":6,"movs":{"Terremoto":1,"Puño Hielo":1},"tiposJuego":true,"psObs":[[10,39,0],[57,156,0],[53,146,0],[52,144,0]],"nivel":[10,100],"reclutado":1},"221":{"num":221,"nombre":"Piloswine","tipos":["hielo","tierra"],"biomas":{"glaciar":3},"vistos":3,"movs":{"Excavar":1,"Hueso Palo":1,"Terremoto":1,"Puño Hielo":1},"nivel":[57,99],"tiposJuego":true,"psObs":[[99,1017,0]],"reclutado":1},"222":{"num":222,"nombre":"Corsola","tipos":["agua","roca"],"biomas":{"lago":3},"vistos":3,"movs":{"Burbuja":1,"Pedrada":1,"Pistola Agua":1},"nivel":[26,87]},"224":{"num":224,"nombre":"Octillery","tipos":["agua"],"biomas":{"lago":2},"vistos":2,"movs":{"Cascada":1,"Aranazo":1,"Placaje":1},"tiposJuego":true,"psObs":[[89,303,0]],"nivel":[89,89]},"225":{"num":225,"nombre":"Delibird","tipos":["hielo","volador"],"biomas":{"glaciar":2},"vistos":2,"movs":{"Puño Hielo":1,"Ataque Rápido":1,"Golpe Cabeza":1,"Aranazo":1,"Placaje":1},"tiposJuego":true,"psObs":[[100,339,0]],"nivel":[100,100]},"229":{"num":229,"nombre":"Houndoom","tipos":["siniestro","fuego"],"biomas":{"magma":1},"vistos":1,"movs":{"Pulso Umbrío":1},"nueva":false,"tiposJuego":true,"psObs":[[99,496,0]],"nivel":[99,99],"reclutado":1},"230":{"num":230,"nombre":"Kingdra","tipos":["agua","dragon"],"biomas":{},"vistos":0,"movs":{"Cascada":1,"Enfado":1,"Garra Dragón":1},"nueva":false,"tiposJuego":true,"reclutado":2},"231":{"num":231,"nombre":"Phanpy","tipos":["tierra"],"biomas":{"roca":1},"vistos":1,"movs":{"Excavar":1},"nueva":false,"nivel":[79,79]},"232":{"num":232,"nombre":"Donphan","tipos":["tierra"],"biomas":{"roca":1},"vistos":1,"movs":{"Excavar":1},"nueva":false,"nivel":[72,72]},"233":{"num":233,"nombre":"Porygon2","tipos":["normal"],"biomas":{},"vistos":0,"movs":{},"nueva":false,"tiposJuego":true},"236":{"num":236,"nombre":"Tyrogue","tipos":["lucha"],"biomas":{"roca":1},"vistos":1,"movs":{},"nueva":false,"tiposJuego":true,"psObs":[[17,48,0]],"nivel":[17,17]},"238":{"num":238,"nombre":"Smoochum","tipos":["hielo","psiquico"],"biomas":{"glaciar":3,"cripta":2},"vistos":5,"movs":{"Golpe Cabeza":1,"Placaje":1,"Ataque Rápido":1,"Ventisca":1,"Confusion":1,"Premonicion":1,"Psiquico":1},"tiposJuego":true,"psObs":[[99,266,0],[100,339,0],[100,588,0]],"nivel":[56,100],"reclutado":1},"240":{"num":240,"nombre":"Magby","tipos":["fuego"],"biomas":{"magma":1},"vistos":1,"movs":{"Rueda Fuego":1},"nueva":false,"tiposJuego":true,"psObs":[[69,176,0]],"nivel":[69,69]},"246":{"num":246,"nombre":"Larvitar","tipos":["roca","tierra"],"biomas":{"roca":2},"vistos":2,"movs":{"Avalancha":1,"Pedrada":1,"Lanzarrocas":1,"Roca Afilada":1},"nueva":false,"tiposJuego":true,"psObs":[[9,36,0]],"nivel":[9,100]},"248":{"num":248,"nombre":"Tyranitar","tipos":["roca","siniestro"],"biomas":{"roca":1,"magma":1},"vistos":2,"movs":{"Lanzarrocas":1,"Avalancha":1,"Roca Afilada":1},"nueva":false,"tiposJuego":true,"psObs":[[77,322,0]],"nivel":[66,77]}},"movs":{"Picotazo Veneno":{"tipo":"veneno","cat":"F","n":106},"Ventisca":{"tipo":"hielo","cat":"E","n":14},"Hueso Palo":{"tipo":"tierra","cat":"F","n":26},"Terremoto":{"tipo":"tierra","cat":"F","n":36},"Hidropulso":{"tipo":"agua","cat":"E","n":66},"Burbuja":{"tipo":"agua","cat":"E","n":55},"Excavar":{"tipo":"tierra","cat":"F","n":31},"Cola Férrea":{"tipo":"acero","cat":"F","n":7},"Cascada":{"tipo":"agua","cat":"F","n":171},"Enfado":{"tipo":"dragon","cat":"F","n":37},"Garra Dragón":{"tipo":"dragon","cat":"F","n":55},"Puño Fuego":{"tipo":"fuego","cat":"F","n":13},"Placaje":{"tipo":"normal","cat":"F","n":117},"Ataque Rápido":{"tipo":"normal","cat":"F","n":123},"Golpe Cabeza":{"tipo":"normal","cat":"F","n":124},"Rayo Solar":{"tipo":"planta","cat":"E","n":35},"Drenadoras":{"tipo":"planta","cat":"E","n":45},"Cabeza de Hierro":{"tipo":"acero","cat":"F","n":1},"Garra Metal":{"tipo":"acero","cat":"F","n":4},"Látigo Cepa":{"tipo":"planta","cat":"F","n":12},"Hoja Afilada":{"tipo":"planta","cat":"F","n":7},"Bola Sombra":{"tipo":"fantasma","cat":"E","n":8},"Mal de Ojo":{"tipo":"fantasma","cat":"E","n":11},"Aranazo":{"tipo":"normal","cat":"F","n":129},"Psiquico":{"tipo":"psiquico","cat":"E","n":17},"Confusion":{"tipo":"psiquico","cat":"E","n":19},"Psicorrayo":{"tipo":"psiquico","cat":"E","n":10},"Picotazo":{"tipo":"volador","cat":"F","n":5},"Ataque Ala":{"tipo":"volador","cat":"F","n":5},"Pájaro Osado":{"tipo":"volador","cat":"F","n":3},"Canto Helado":{"tipo":"hielo","cat":"E","n":9},"Pistola Agua":{"tipo":"agua","cat":"E","n":71},"Picadura":{"tipo":"bicho","cat":"F","n":30},"Tijera X":{"tipo":"bicho","cat":"F","n":28},"Impactrueno":{"tipo":"electrico","cat":"E","n":33},"Rayo":{"tipo":"electrico","cat":"E","n":26},"Pedrada":{"tipo":"roca","cat":"F","n":22},"Lanzarrocas":{"tipo":"roca","cat":"F","n":17},"Mordisco":{"tipo":"siniestro","cat":"F","n":2},"Rayo Hielo":{"tipo":"hielo","cat":"E","n":17},"Roca Afilada":{"tipo":"roca","cat":"F","n":15},"Sumision":{"tipo":"lucha","cat":"F","n":1},"Disparo Demora":{"tipo":"bicho","cat":"E","n":10},"Puño Hielo":{"tipo":"hielo","cat":"F","n":22},"Bomba Lodo":{"tipo":"veneno","cat":"E","n":23},"Puño Dinámico":{"tipo":"lucha","cat":"F","n":2},"Patada Baja":{"tipo":"lucha","cat":"F","n":1},"Premonicion":{"tipo":"psiquico","cat":"E","n":14},"Triturar":{"tipo":"siniestro","cat":"F","n":2},"Finta":{"tipo":"siniestro","cat":"F","n":1},"Foco Resplandor":{"tipo":"acero","cat":"E","n":7},"Rueda Fuego":{"tipo":"fuego","cat":"F","n":8},"Pulso Umbrío":{"tipo":"siniestro","cat":"E","n":3},"Avalancha":{"tipo":"roca","cat":"F","n":23},"Zumbido":{"tipo":"bicho","cat":"E","n":10},"Acido":{"tipo":"veneno","cat":"E","n":21},"Forcejeo":{"tipo":null,"cat":"E","n":29},"Residuos":{"tipo":"veneno","cat":"E","n":22},"Lanzallamas":{"tipo":"fuego","cat":"E","n":6},"Ascuas":{"tipo":"fuego","cat":"E","n":4}},"usa":{},"bendiciones":{"Vitalidad":{"ico":"❤️","desc":"+15% de PS máximos a todo el equipo.","ofrecida":22,"elegida":8,"visto":1790444574399},"Veterano":{"ico":"⭐","desc":"Todo el equipo sube 3 niveles ahora mismo.","ofrecida":25,"elegida":4,"visto":1790444574399},"Viento a Favor":{"ico":"💨","desc":"+15% de Velocidad a todo el equipo.","ofrecida":17,"elegida":0,"visto":1790444574399},"Afinidad: Tierra":{"ico":"🎯","desc":"+25% de Ataque y Especial a los de tipo Tierra.","ofrecida":5,"elegida":1,"visto":1790444574399},"Sanguijuela":{"ico":"🩸","desc":"Tras cada combate ganado, el equipo recupera un 15% de PS.","ofrecida":17,"elegida":7,"visto":1790444574399},"Furia":{"ico":"💥","desc":"+12% de Ataque y de Especial a todo el equipo.","ofrecida":22,"elegida":8,"visto":1790444574399},"Piel Dura":{"ico":"🛡️","desc":"+15% de Defensa a todo el equipo.","ofrecida":13,"elegida":4,"visto":1790444574399},"Aguante":{"ico":"🪢","desc":"En cada combate, el primero que fuera a caer aguanta con 1 PS.","ofrecida":9,"elegida":2,"visto":1790444574399},"Afinidad: Bicho":{"ico":"🎯","desc":"+25% de Ataque y Especial a los de tipo Bicho.","ofrecida":1,"elegida":0,"visto":1790444574399},"Reclutador":{"ico":"🤝","desc":"Los que reclutes llegan con los PS llenos y 2 niveles más.","ofrecida":8,"elegida":1,"visto":1790444574399},"Botín":{"ico":"💎","desc":"+50% de esquirlas el resto de la partida.","ofrecida":15,"elegida":1,"visto":1790444574399},"Brasas Vivas":{"ico":"🪵","desc":"Los descansos curan el doble.","ofrecida":11,"elegida":2,"visto":1790444574399},"Afinidad: Volador":{"ico":"🎯","desc":"+25% de Ataque y Especial a los de tipo Volador.","ofrecida":1,"elegida":0},"Afinidad: Dragon":{"ico":"🎯","desc":"+25% de Ataque y Especial a los de tipo Dragon.","ofrecida":1,"elegida":1},"Afinidad: Agua":{"ico":"🎯","desc":"+25% de Ataque y Especial a los de tipo Agua.","ofrecida":4,"elegida":4},"Afinidad: Normal":{"ico":"🎯","desc":"+25% de Ataque y Especial a los de tipo Normal.","ofrecida":3,"elegida":2},"Afinidad: Electrico":{"ico":"🎯","desc":"+25% de Ataque y Especial a los de tipo Electrico.","ofrecida":1,"elegida":1},"Afinidad: Veneno":{"ico":"🎯","desc":"+25% de Ataque y Especial a los de tipo Veneno.","ofrecida":1,"elegida":0}},"puertas":{"combate":{"nombre":"Combate","ico":"⚔️","vista":106,"elegida":51,"esq":{"n":52,"s":260},"sale":{},"desc":"Un salvaje. Si le ganas, puedes reclutarlo."},"elite":{"nombre":"Élite","ico":"💀","vista":54,"elegida":16,"esq":{"n":18,"s":158.75},"sale":{},"desc":"Dos rivales más fuertes. Pagan mejor."},"guardian":{"nombre":"Guardián","ico":"👑","vista":33,"elegida":33,"esq":{"n":32,"s":441.25},"sale":{},"desc":"El guardián del bioma. Tres rivales; al vencerle, eliges una bendición."},"descanso":{"nombre":"Descanso","ico":"🔥","vista":61,"elegida":21,"esq":{"n":23,"s":44.16666666666667},"sale":{},"desc":"Una hoguera: los que siguen en pie recuperan un 40% de sus PS máximos; los caídos se levantan con un 25%."},"misterio":{"nombre":"Misterio","ico":"❓","vista":57,"elegida":13,"esq":{"n":15,"s":28.75},"sale":{"herido":1,"manantial":1,"nada":12},"desc":"Puede ser cualquier cosa."},"tesoro":{"nombre":"Tesoro","ico":"🎁","vista":42,"elegida":9,"esq":{"n":11,"s":101.25},"sale":{"cofre":3,"cofre+":1,"nada":8},"desc":"Esquirlas, y a veces una bendición."},"oculta":{"nombre":"¿?","ico":"🌫️","vista":64,"elegida":22,"esq":{"n":20,"s":98.75},"sale":{"cofre":1,"combate":13,"hoguera":1,"nada":10},"desc":"La niebla no deja ver qué hay detrás."}},"eventos":{"prestado":{"ico":"🤝","titulo":"Kingdra baja contigo","n":2,"ejemplos":["Nv.21. Te lo prestan para esta partida: cuídalo."]},"bendicion":{"ico":"⭐","titulo":"Veterano","n":39,"ejemplos":["Todo el equipo sube 3 niveles ahora mismo.","En cada combate, el primero que fuera a caer aguanta con 1 PS.","Tras cada combate ganado, el equipo recupera un 15% de PS.","+15% de PS máximos a todo el equipo."]},"recluta":{"ico":"🤝","titulo":"Geodude se une","n":39,"ejemplos":["Nv.13. Baja contigo el resto de la partida.","Nv.34. Baja contigo el resto de la partida.","Nv.43. Baja contigo el resto de la partida.","Nv.46. Baja contigo el resto de la partida."]},"objeto":{"ico":"⛏️","titulo":"El guardián deja algo","n":29,"ejemplos":["Hierro en Bruto, a tu mochila.","Caparazón, a tu mochila.","Hierba Medicinal, a tu mochila.","Carbón, a tu mochila."]},"cofre":{"ico":"🎁","titulo":"Un cofre","n":7,"ejemplos":["Esquirlas de plata."]},"herido":{"ico":"🩹","titulo":"Un Misdreavus herido","n":9,"ejemplos":["Está solo y no huye. Parece que quiere venir contigo."]},"deja":{"ico":"👋","titulo":"Skiploom se queda atrás","n":33,"ejemplos":["Vuelve por donde vinisteis."]},"cofre+":{"ico":"🎁","titulo":"Un cofre","n":3,"ejemplos":["Esquirlas, y algo más que brilla."]},"hoguera":{"ico":"🔥","titulo":"Una hoguera","n":20,"ejemplos":["Los que siguen en pie recuperan un 40% de sus PS máximos, con bendiciones incluidas. Los caídos se levantan con un 25%.","Los que siguen en pie recuperan un 80% de sus PS máximos, con bendiciones incluidas. Los caídos se levantan con un 50%."]},"manantial":{"ico":"⛲","titulo":"Un manantial","n":4,"ejemplos":["Agua clara bajo la roca: un 30% de PS para todos, y los caídos se levantan."]},"pluma":{"ico":"🪶","titulo":"La Pluma de Fénix","n":2,"ejemplos":["Arde en tu mochila: el equipo se levanta al 60%. Solo una vez."]},"fin":{"ico":"🪦","titulo":"Caes en el piso 70","n":2,"ejemplos":["Lo reclutado se queda abajo. Te llevas 800 esquirlas para mejorar la próxima.","Lo reclutado se queda abajo. Te llevas 818 esquirlas para mejorar la próxima."]},"bioma":{"ico":"💧","titulo":"Bajas a Lago Subterráneo","n":42,"ejemplos":["Corriente: tus Pokémon de tipo Agua van un 20% más fuertes en todo.","Espesura: los salvajes salen de dos en dos.","Niebla: no se ve qué hay detrás de cada puerta hasta abrirla.","Frío: al acabar cada piso, los que no son de tipo Hielo pierden un 8% de PS."]},"altar":{"ico":"🗿","titulo":"Un altar","n":5,"ejemplos":["Pide algo a cambio: el equipo pierde un 25% de PS. Y te da a elegir."]},"derrota":{"ico":"💢","titulo":"No has podido pasar","n":1,"ejemplos":["Te retiras con los que quedan. La puerta sigue ahí."]}},"objetos":{"Hierro en Bruto":5,"Caparazón":6,"Hierba Medicinal":3,"Carbón":10,"Escama":3,"Corteza":2},"mejoras":{"Buen ojo":{"ico":"👀","desc":"Eliges tu prestado entre 3","nivel":2,"max":2,"coste":null,"visto":1790446483275},"Entrenamiento previo":{"ico":"📈","desc":"9 niveles más","nivel":3,"max":3,"coste":null,"visto":1790446483275},"Amuleto de salida":{"ico":"🧿","desc":"Eliges una bendición antes del primer piso","nivel":1,"max":1,"coste":null,"visto":1790446483275},"Segunda oportunidad":{"ico":"🎲","desc":"Puedes volver a tirar las bendiciones una vez por bioma","nivel":1,"max":1,"coste":null,"visto":1790446483275},"Pluma de Fénix":{"ico":"🪶","desc":"Una vez por partida, si caes, el equipo se levanta al 60%","nivel":1,"max":1,"coste":null,"visto":1790446483275},"Mochila grande":{"ico":"🎒","desc":"Una cuarta plaza en el equipo (de reserva)","nivel":1,"max":1,"coste":null,"visto":1790446483275},"Cuerda de bajada":{"ico":"🪜","desc":"Puedes empezar en el piso 11","nivel":0,"max":4,"coste":80,"visto":1790446483275},"Temple de Plata":{"ico":"⚒️","desc":"+20% a todas las estadísticas","nivel":4,"max":5,"coste":1100,"visto":1790446483275},"Zurrón del curandero":{"ico":"🌿","desc":"Un 15% de PS tras cada combate ganado","nivel":2,"max":3,"coste":660,"visto":1790446483275},"Pico de minero":{"ico":"⛏️","desc":"+60% de esquirlas","nivel":4,"max":4,"coste":null,"visto":1790446483275},"Maestro de reclutas":{"ico":"🎖️","desc":"Con 4 niveles más","nivel":1,"max":3,"coste":275,"visto":1790446483275},"Sangre de la veta":{"ico":"🩸","desc":"Un 1,4% por piso","nivel":1,"max":5,"coste":2600,"visto":1790446483275},"Mochila doble":{"ico":"🎒","desc":"Un hueco más en el equipo: cinco en vez de cuatro","nivel":0,"max":1,"coste":2200,"visto":1790446483275},"Fuelle del herrero":{"ico":"🔥","desc":"Las hogueras curan un 10% más","nivel":0,"max":3,"coste":900,"visto":1790446483275}},"biomas":{"roca":{"nombre":"Galerías de Roca","ico":"🪨","efecto":"Sin sorpresas: la roca de siempre. Aprende a bajar.","orden":0},"lago":{"nombre":"Lago Subterráneo","ico":"💧","efecto":"Corriente: tus Pokémon de tipo Agua van un 20% más fuertes en todo.","orden":1},"bosque":{"nombre":"Bosque de Raíces","ico":"🌿","efecto":"Espesura: los salvajes salen de dos en dos.","orden":2},"cripta":{"nombre":"Cripta de Niebla","ico":"🌫️","efecto":"Niebla: no se ve qué hay detrás de cada puerta hasta abrirla.","orden":3},"glaciar":{"nombre":"Glaciar de Acero","ico":"❄️","efecto":"Frío: al acabar cada piso, los que no son de tipo Hielo pierden un 8% de PS.","orden":4},"magma":{"nombre":"Cámara de Magma","ico":"🌋","efecto":"Calor: los rivales pegan un 15% más fuerte. Tus Pokémon de tipo Fuego, también.","orden":5}},"niveles":[[21,53,"elite"],[21,54,"elite"],[22,55,"elite"],[22,55,"elite"],[23,52,"combate"],[24,54,"combate"],[25,57,"guardian"],[25,56,"guardian"],[25,60,"guardian"],[26,59,"combate"],[28,66,"elite"],[29,65,"combate"],[30,69,"guardian"],[30,69,"guardian"],[30,70,"guardian"],[31,68,"combate"],[32,72,"combate"],[33,72,"combate"],[34,76,"combate"],[35,77,"guardian"],[35,78,"guardian"],[35,79,"guardian"],[36,82,"elite"],[36,83,"elite"],[40,89,"guardian"],[40,88,"guardian"],[40,90,"guardian"],[41,91,"elite"],[41,91,"elite"],[42,96,"elite"],[42,93,"elite"],[45,99,"guardian"],[45,99,"guardian"],[45,100,"guardian"],[47,100,"oculta"],[47,100,"oculta"],[48,99,"oculta"],[50,99,"guardian"],[50,98,"guardian"],[50,100,"guardian"],[51,100,"combate"],[53,100,"elite"],[53,100,"elite"],[55,100,"guardian"],[55,99,"guardian"],[55,99,"guardian"],[55,100,"guardian"],[55,98,"guardian"],[55,100,"guardian"],[2,16,"combate"],[3,14,"elite"],[1,9,"combate"],[2,10,"combate"],[3,12,"combate"],[4,17,"combate"],[5,19,"guardian"],[5,18,"guardian"],[7,24,"elite"],[7,24,"elite"],[8,26,"elite"],[8,27,"elite"],[10,27,"guardian"],[10,26,"guardian"],[10,28,"guardian"],[12,33,"combate"],[12,30,"combate"],[13,37,"elite"],[13,35,"elite"],[14,39,"elite"],[14,38,"elite"],[15,36,"guardian"],[15,39,"guardian"],[15,39,"guardian"],[16,41,"oculta"],[19,47,"oculta"],[19,50,"oculta"],[20,48,"guardian"],[20,47,"guardian"],[20,50,"guardian"],[21,52,"elite"],[21,54,"elite"],[22,55,"elite"],[22,55,"elite"],[23,58,"elite"],[23,57,"elite"],[25,57,"guardian"],[25,61,"guardian"],[26,58,"combate"],[27,66,"elite"],[27,64,"elite"],[28,63,"combate"],[30,68,"guardian"],[30,66,"guardian"],[30,70,"guardian"],[31,72,"elite"],[31,73,"elite"],[33,76,"elite"],[33,78,"elite"],[34,77,"elite"],[34,77,"elite"],[35,79,"guardian"],[35,76,"guardian"],[35,79,"guardian"],[38,85,"combate"],[40,89,"guardian"],[40,87,"guardian"],[40,89,"guardian"],[41,91,"combate"],[41,91,"combate"],[42,92,"combate"],[42,91,"combate"],[44,95,"combate"],[44,94,"combate"],[45,99,"guardian"],[45,96,"guardian"],[47,100,"oculta"],[48,99,"oculta"],[50,100,"guardian"],[50,100,"guardian"],[50,100,"guardian"],[52,100,"combate"],[53,99,"combate"],[54,100,"elite"],[54,100,"elite"],[55,98,"guardian"],[55,100,"guardian"],[55,100,"guardian"],[56,100,"elite"],[56,100,"elite"],[57,100,"combate"],[57,100,"combate"],[58,99,"combate"],[60,100,"guardian"],[60,100,"guardian"],[60,100,"guardian"],[62,98,"combate"],[65,99,"guardian"],[65,100,"guardian"],[65,100,"guardian"],[66,100,"combate"],[69,99,"combate"],[70,100,"guardian"],[70,98,"guardian"],[2,12,"combate"],[3,12,"combate"],[5,18,"guardian"],[5,19,"guardian"],[5,18,"guardian"],[6,19,"combate"],[8,25,"elite"],[8,25,"elite"],[9,25,"combate"],[10,28,"guardian"],[10,26,"guardian"],[10,28,"guardian"],[11,29,"combate"],[11,29,"combate"],[13,32,"combate"],[13,35,"combate"],[14,34,"combate"],[14,37,"combate"],[15,38,"guardian"],[15,38,"guardian"],[15,38,"guardian"],[17,43,"oculta"],[17,43,"oculta"],[18,45,"oculta"],[20,48,"guardian"],[20,46,"guardian"],[20,49,"guardian"],[21,51,"combate"],[22,53,"combate"],[23,52,"combate"],[25,57,"guardian"],[25,56,"guardian"],[25,59,"guardian"],[26,59,"combate"],[27,62,"combate"],[30,66,"guardian"],[30,66,"guardian"],[30,69,"guardian"],[35,78,"guardian"],[35,79,"guardian"],[35,80,"guardian"],[36,80,"combate"],[37,83,"elite"],[37,84,"elite"],[38,82,"combate"],[40,87,"guardian"],[40,87,"guardian"],[40,88,"guardian"],[43,95,"combate"],[43,92,"combate"],[44,97,"combate"],[44,95,"combate"],[45,99,"guardian"],[45,99,"guardian"],[45,100,"guardian"],[48,99,"oculta"],[49,100,"oculta"],[50,100,"guardian"],[50,98,"guardian"],[50,100,"guardian"],[51,100,"combate"],[52,98,"combate"],[54,99,"combate"],[55,100,"guardian"],[55,100,"guardian"],[55,100,"guardian"],[57,99,"combate"],[60,100,"guardian"],[60,98,"guardian"],[60,100,"guardian"],[63,100,"combate"],[65,100,"guardian"],[65,100,"guardian"],[65,100,"guardian"],[66,100,"combate"],[69,100,"combate"],[70,100,"guardian"],[70,99,"guardian"],[70,100,"guardian"],[71,98,"combate"],[71,100,"combate"],[75,98,"guardian"],[75,100,"guardian"],[75,100,"guardian"],[76,99,"oculta"],[79,100,"oculta"],[79,100,"oculta"],[80,100,"guardian"],[80,98,"guardian"],[80,100,"guardian"],[83,99,"combate"],[85,100,"guardian"],[85,100,"guardian"],[85,99,"guardian"]],"k":{"mio-E":{"n":30,"s":-0.3925571864596644},"mio-F":{"n":30,"s":2.530234453012529},"riv-E":{"n":30,"s":-1.5072364931024036},"riv-F":{"n":30,"s":-2.7305819516150565}},"subida":{"n":200,"s":494.77448432503945},"bajadas":[{"piso":55,"esq":908,"prestado":"Nidoqueen","t":0,"semilla":true},{"t":1790444576468,"piso":70,"esq":800,"prestado":"Kingdra","bend":["Veterano ×2","Aguante","Sanguijuela","Vitalidad ×3","Afinidad: Dragon","Furia ×4","Afinidad: Agua ×4","Piel Dura ×2","Brasas Vivas"],"equipo":["Kingdra","Slowking","Vaporeon"],"fin":1790444935121,"causa":"Lago Subterráneo","semilla":true},{"t":1790446058199,"piso":85,"esq":818,"prestado":"Snorlax","bend":["Veterano ×2","Afinidad: Normal ×2","Sanguijuela ×2","Brasas Vivas","Piel Dura","Vitalidad ×5","Furia ×3","Reclutador","Aguante","Afinidad: Electrico","Botín"],"equipo":["Snorlax","Lapras","Piloswine","Nidoran♂"],"fin":1790446482442,"causa":"Glaciar de Acero","semilla":true}],"pantallasNuevas":{},"esqMult":2.4000000000000004,"vistas":0,"hinchazon":[[45,1],[47,1.041],[48,1.078],[50,1.159],[51,1.201],[53,1.28],[55,1.36],[55,1.359],[55,1.359],[40,1],[42,1],[36,1],[1,1],[2,1],[3,1],[4,1],[5,1],[7,1],[8,1],[10,1],[12,1],[13,1],[14,1],[15,1],[16,1],[19,1],[20,1],[21,1],[22,1],[23,1],[25,1],[26,1],[27,1],[28,1],[30,1],[31,1],[33,1],[34,1],[35,1],[38,1],[40,1],[41,1],[42,1],[44,1],[45,1],[47,1.039],[48,1.081],[50,1.159],[52,1.238],[53,1.281],[54,1.319],[55,1.361],[56,1.401],[57,1.44],[57,1.441],[58,1.481],[60,1.56],[62,1.64],[65,1.76],[66,1.799],[69,1.92],[70,1.96],[2,1],[3,1],[5,1],[6,1],[8,1],[9,1],[10,1],[11,1],[13,1],[14,1],[15,1],[17,1],[18,1],[20,1],[21,1],[22,1],[23,1],[25,1],[26,1],[27,1],[30,1],[35,1],[36,1],[37,1],[38,1],[43,1],[44,1],[45,1],[48,1.081],[49,1.12],[50,1.16],[51,1.201],[52,1.241],[55,1.361],[57,1.441],[60,1.561],[63,1.681],[65,1.76],[66,1.799],[69,1.922],[70,1.96],[71,2],[75,2.159],[76,2.201],[79,2.32],[79,2.321],[80,2.361],[83,2.48],[85,2.56]],"migrado":0,"prestados":[{"nombre":"Xatu","num":178,"L":21,"tipos":["psiquico","volador"]},{"nombre":"Porygon2","num":233,"L":21,"tipos":["normal"]},{"nombre":"Kingdra","num":230,"L":21,"tipos":["agua","dragon"]},{"nombre":"Snorlax","num":143,"L":21,"tipos":["normal"]},{"nombre":"Hitmonlee","num":106,"L":21,"tipos":["lucha"]},{"nombre":"Steelix","num":208,"L":21,"tipos":["acero","tierra"]}],"templeObs":[[12,0.158,4,1],[20,0.158,4,1],[30,0.16,4,1],[40,0.16,4,1],[45,0.158,4,1],[53,0.209,4,1],[63,0.279,4,1],[70,0.33,4,1],[80,0.399,4,1]],"subidaPuerta":{"elite":{"n":20,"s":60},"combate":{"n":20,"s":40},"guardian":{"n":10,"s":33}}};

  const DEX_DATOS = '45.49.49.65.65.45:planta/veneno:Bulbasaur,60.62.63.80.80.60:planta/veneno:Ivysaur,80.82.83.100.100.80:planta/veneno:Venusaur,39.52.43.60.50.65:fuego:Charmander,58.64.58.80.65.80:fuego:Charmeleon,78.84.78.109.85.100:fuego/volador:Charizard,44.48.65.50.64.43:agua:Squirtle,59.63.80.65.80.58:agua:Wartortle,79.83.100.85.105.78:agua:Blastoise,45.30.35.20.20.45:bicho:Caterpie,50.20.55.25.25.30:bicho:Metapod,60.45.50.90.80.70:bicho/volador:Butterfree,40.35.30.20.20.50:bicho/veneno:Weedle,45.25.50.25.25.35:bicho/veneno:Kakuna,65.90.40.45.80.75:bicho/veneno:Beedrill,40.45.40.35.35.56:normal/volador:Pidgey,63.60.55.50.50.71:normal/volador:Pidgeotto,83.80.75.70.70.101:normal/volador:Pidgeot,30.56.35.25.35.72:normal:Rattata,55.81.60.50.70.97:normal:Raticate,40.60.30.31.31.70:normal/volador:Spearow,65.90.65.61.61.100:normal/volador:Fearow,35.60.44.40.54.55:veneno:Ekans,60.95.69.65.79.80:veneno:Arbok,35.55.40.50.50.90:electrico:Pikachu,60.90.55.90.80.110:electrico:Raichu,50.75.85.20.30.40:tierra:Sandshrew,75.100.110.45.55.65:tierra:Sandslash,55.47.52.40.40.41:veneno:Nidoran♀,70.62.67.55.55.56:veneno:Nidorina,90.92.87.75.85.76:veneno/tierra:Nidoqueen,46.57.40.40.40.50:veneno:Nidoran♂,61.72.57.55.55.65:veneno:Nidorino,81.102.77.85.75.85:veneno/tierra:Nidoking,70.45.48.60.65.35:hada:Clefairy,95.70.73.95.90.60:hada:Clefable,38.41.40.50.65.65:fuego:Vulpix,73.76.75.81.100.100:fuego:Ninetales,115.45.20.45.25.20:normal/hada:Jigglypuff,140.70.45.85.50.45:normal/hada:Wigglytuff,40.45.35.30.40.55:veneno/volador:Zubat,75.80.70.65.75.90:veneno/volador:Golbat,45.50.55.75.65.30:planta/veneno:Oddish,60.65.70.85.75.40:planta/veneno:Gloom,75.80.85.110.90.50:planta/veneno:Vileplume,35.70.55.45.55.25:bicho/planta:Paras,60.95.80.60.80.30:bicho/planta:Parasect,60.55.50.40.55.45:bicho/veneno:Venonat,70.65.60.90.75.90:bicho/veneno:Venomoth,10.55.25.35.45.95:tierra:Diglett,35.100.50.50.70.120:tierra:Dugtrio,40.45.35.40.40.90:normal:Meowth,65.70.60.65.65.115:normal:Persian,50.52.48.65.50.55:agua:Psyduck,80.82.78.95.80.85:agua:Golduck,40.80.35.35.45.70:lucha:Mankey,65.105.60.60.70.95:lucha:Primeape,55.70.45.70.50.60:fuego:Growlithe,90.110.80.100.80.95:fuego:Arcanine,40.50.40.40.40.90:agua:Poliwag,65.65.65.50.50.90:agua:Poliwhirl,90.95.95.70.90.70:agua/lucha:Poliwrath,25.20.15.105.55.90:psiquico:Abra,40.35.30.120.70.105:psiquico:Kadabra,55.50.45.135.95.120:psiquico:Alakazam,70.80.50.35.35.35:lucha:Machop,80.100.70.50.60.45:lucha:Machoke,90.130.80.65.85.55:lucha:Machamp,50.75.35.70.30.40:planta/veneno:Bellsprout,65.90.50.85.45.55:planta/veneno:Weepinbell,80.105.65.100.70.70:planta/veneno:Victreebel,40.40.35.50.100.70:agua/veneno:Tentacool,80.70.65.80.120.100:agua/veneno:Tentacruel,40.80.100.30.30.20:roca/tierra:Geodude,55.95.115.45.45.35:roca/tierra:Graveler,80.120.130.55.65.45:roca/tierra:Golem,50.85.55.65.65.90:fuego:Ponyta,65.100.70.80.80.105:fuego:Rapidash,90.65.65.40.40.15:agua/psiquico:Slowpoke,95.75.110.100.80.30:agua/psiquico:Slowbro,25.35.70.95.55.45:electrico/acero:Magnemite,50.60.95.120.70.70:electrico/acero:Magneton,52.90.55.58.62.60:normal/volador:Farfetch’d,35.85.45.35.35.75:normal/volador:Doduo,60.110.70.60.60.110:normal/volador:Dodrio,65.45.55.45.70.45:agua:Seel,90.70.80.70.95.70:agua/hielo:Dewgong,80.80.50.40.50.25:veneno:Grimer,105.105.75.65.100.50:veneno:Muk,30.65.100.45.25.40:agua:Shellder,50.95.180.85.45.70:agua/hielo:Cloyster,30.35.30.100.35.80:fantasma/veneno:Gastly,45.50.45.115.55.95:fantasma/veneno:Haunter,60.65.60.130.75.110:fantasma/veneno:Gengar,35.45.160.30.45.70:roca/tierra:Onix,60.48.45.43.90.42:psiquico:Drowzee,85.73.70.73.115.67:psiquico:Hypno,30.105.90.25.25.50:agua:Krabby,55.130.115.50.50.75:agua:Kingler,40.30.50.55.55.100:electrico:Voltorb,60.50.70.80.80.150:electrico:Electrode,60.40.80.60.45.40:planta/psiquico:Exeggcute,95.95.85.125.75.55:planta/psiquico:Exeggutor,50.50.95.40.50.35:tierra:Cubone,60.80.110.50.80.45:tierra:Marowak,50.120.53.35.110.87:lucha:Hitmonlee,50.105.79.35.110.76:lucha:Hitmonchan,90.55.75.60.75.30:normal:Lickitung,40.65.95.60.45.35:veneno:Koffing,65.90.120.85.70.60:veneno:Weezing,80.85.95.30.30.25:tierra/roca:Rhyhorn,105.130.120.45.45.40:tierra/roca:Rhydon,250.5.5.35.105.50:normal:Chansey,65.55.115.100.40.60:planta:Tangela,105.95.80.40.80.90:normal:Kangaskhan,30.40.70.70.25.60:agua:Horsea,55.65.95.95.45.85:agua:Seadra,45.67.60.35.50.63:agua:Goldeen,80.92.65.65.80.68:agua:Seaking,30.45.55.70.55.85:agua:Staryu,60.75.85.100.85.115:agua/psiquico:Starmie,40.45.65.100.120.90:psiquico/hada:Mr. Mime,70.110.80.55.80.105:bicho/volador:Scyther,65.50.35.115.95.95:hielo/psiquico:Jynx,65.83.57.95.85.105:electrico:Electabuzz,65.95.57.100.85.93:fuego:Magmar,65.125.100.55.70.85:bicho:Pinsir,75.100.95.40.70.110:normal:Tauros,20.10.55.15.20.80:agua:Magikarp,95.125.79.60.100.81:agua/volador:Gyarados,130.85.80.85.95.60:agua/hielo:Lapras,48.48.48.48.48.48:normal:Ditto,55.55.50.45.65.55:normal:Eevee,130.65.60.110.95.65:agua:Vaporeon,65.65.60.110.95.130:electrico:Jolteon,65.130.60.95.110.65:fuego:Flareon,65.60.70.85.75.40:normal:Porygon,35.40.100.90.55.35:roca/agua:Omanyte,70.60.125.115.70.55:roca/agua:Omastar,30.80.90.55.45.55:roca/agua:Kabuto,60.115.105.65.70.80:roca/agua:Kabutops,80.105.65.60.75.130:roca/volador:Aerodactyl,160.110.65.65.110.30:normal:Snorlax,90.85.100.95.125.85:hielo/volador:Articuno*,90.90.85.125.90.100:electrico/volador:Zapdos*,90.100.90.125.85.90:fuego/volador:Moltres*,41.64.45.50.50.50:dragon:Dratini,61.84.65.70.70.70:dragon:Dragonair,91.134.95.100.100.80:dragon/volador:Dragonite,106.110.90.154.90.130:psiquico:Mewtwo*,100.100.100.100.100.100:psiquico:Mew*,45.49.65.49.65.45:planta:Chikorita,60.62.80.63.80.60:planta:Bayleef,80.82.100.83.100.80:planta:Meganium,39.52.43.60.50.65:fuego:Cyndaquil,58.64.58.80.65.80:fuego:Quilava,78.84.78.109.85.100:fuego:Typhlosion,50.65.64.44.48.43:agua:Totodile,65.80.80.59.63.58:agua:Croconaw,85.105.100.79.83.78:agua:Feraligatr,35.46.34.35.45.20:normal:Sentret,85.76.64.45.55.90:normal:Furret,60.30.30.36.56.50:normal/volador:Hoothoot,100.50.50.86.96.70:normal/volador:Noctowl,40.20.30.40.80.55:bicho/volador:Ledyba,55.35.50.55.110.85:bicho/volador:Ledian,40.60.40.40.40.30:bicho/veneno:Spinarak,70.90.70.60.70.40:bicho/veneno:Ariados,85.90.80.70.80.130:veneno/volador:Crobat,75.38.38.56.56.67:agua/electrico:Chinchou,125.58.58.76.76.67:agua/electrico:Lanturn,20.40.15.35.35.60:electrico:Pichu,50.25.28.45.55.15:hada:Cleffa,90.30.15.40.20.15:normal/hada:Igglybuff,35.20.65.40.65.20:hada:Togepi,55.40.85.80.105.40:hada/volador:Togetic,40.50.45.70.45.70:psiquico/volador:Natu,65.75.70.95.70.95:psiquico/volador:Xatu,55.40.40.65.45.35:electrico:Mareep,70.55.55.80.60.45:electrico:Flaaffy,90.75.85.115.90.55:electrico:Ampharos,75.80.95.90.100.50:planta:Bellossom,70.20.50.20.50.40:agua/hada:Marill,100.50.80.60.80.50:agua/hada:Azumarill,70.100.115.30.65.30:roca:Sudowoodo,90.75.75.90.100.70:agua:Politoed,35.35.40.35.55.50:planta/volador:Hoppip,55.45.50.45.65.80:planta/volador:Skiploom,75.55.70.55.95.110:planta/volador:Jumpluff,55.70.55.40.55.85:normal:Aipom,30.30.30.30.30.30:planta:Sunkern,75.75.55.105.85.30:planta:Sunflora,65.65.45.75.45.95:bicho/volador:Yanma,55.45.45.25.25.15:agua/tierra:Wooper,95.85.85.65.65.35:agua/tierra:Quagsire,65.65.60.130.95.110:psiquico:Espeon,95.65.110.60.130.65:siniestro:Umbreon,60.85.42.85.42.91:siniestro/volador:Murkrow,95.75.80.100.110.30:agua/psiquico:Slowking,60.60.60.85.85.85:fantasma:Misdreavus,48.72.48.72.48.48:psiquico:Unown,190.33.58.33.58.33:psiquico:Wobbuffet,70.80.65.90.65.85:normal/psiquico:Girafarig,50.65.90.35.35.15:bicho:Pineco,75.90.140.60.60.40:bicho/acero:Forretress,100.70.70.65.65.45:normal:Dunsparce,65.75.105.35.65.85:tierra/volador:Gligar,75.85.200.55.65.30:acero/tierra:Steelix,60.80.50.40.40.30:hada:Snubbull,90.120.75.60.60.45:hada:Granbull,65.95.85.55.55.85:agua/veneno:Qwilfish,70.130.100.55.80.65:bicho/acero:Scizor,20.10.230.10.230.5:bicho/roca:Shuckle,80.125.75.40.95.85:bicho/lucha:Heracross,55.95.55.35.75.115:siniestro/hielo:Sneasel,60.80.50.50.50.40:normal:Teddiursa,90.130.75.75.75.55:normal:Ursaring,40.40.40.70.40.20:fuego:Slugma,60.50.120.90.80.30:fuego/roca:Magcargo,50.50.40.30.30.50:hielo/tierra:Swinub,100.100.80.60.60.50:hielo/tierra:Piloswine,65.55.95.65.95.35:agua/roca:Corsola,35.65.35.65.35.65:agua:Remoraid,75.105.75.105.75.45:agua:Octillery,45.55.45.65.45.75:hielo/volador:Delibird,85.40.70.80.140.70:agua/volador:Mantine,65.80.140.40.70.70:acero/volador:Skarmory,45.60.30.80.50.65:siniestro/fuego:Houndour,75.90.50.110.80.95:siniestro/fuego:Houndoom,75.95.95.95.95.85:agua/dragon:Kingdra,90.60.60.40.40.40:tierra:Phanpy,90.120.120.60.60.50:tierra:Donphan,85.80.90.105.95.60:normal:Porygon2,73.95.62.85.65.85:normal:Stantler,55.20.35.20.45.75:normal:Smeargle,35.35.35.35.35.35:lucha:Tyrogue,50.95.95.35.110.70:lucha:Hitmontop,45.30.15.85.65.65:hielo/psiquico:Smoochum,45.63.37.65.55.95:electrico:Elekid,45.75.37.70.55.83:fuego:Magby,95.80.105.40.70.100:normal:Miltank,255.10.10.75.135.55:normal:Blissey,90.85.75.115.100.115:electrico:Raikou*,115.115.85.90.75.100:fuego:Entei*,100.75.115.90.115.85:agua:Suicune*,50.64.50.45.50.41:roca/tierra:Larvitar,70.84.70.65.70.51:roca/tierra:Pupitar,100.134.110.95.100.61:roca/siniestro:Tyranitar,106.90.130.90.154.110:psiquico/volador:Lugia*,106.130.90.110.154.90:fuego/volador:Ho-Oh*,100.100.100.100.100.100:psiquico/planta:Celebi*,40.45.35.65.55.70:planta:Treecko,50.65.45.85.65.95:planta:Grovyle,70.85.65.105.85.120:planta:Sceptile,45.60.40.70.50.45:fuego:Torchic,60.85.60.85.60.55:fuego/lucha:Combusken,80.120.70.110.70.80:fuego/lucha:Blaziken,50.70.50.50.50.40:agua:Mudkip,70.85.70.60.70.50:agua/tierra:Marshtomp,100.110.90.85.90.60:agua/tierra:Swampert,35.55.35.30.30.35:siniestro:Poochyena,70.90.70.60.60.70:siniestro:Mightyena,38.30.41.30.41.60:normal:Zigzagoon,78.70.61.50.61.100:normal:Linoone,45.45.35.20.30.20:bicho:Wurmple,50.35.55.25.25.15:bicho:Silcoon,60.70.50.100.50.65:bicho/volador:Beautifly,50.35.55.25.25.15:bicho:Cascoon,60.50.70.50.90.65:bicho/veneno:Dustox,40.30.30.40.50.30:agua/planta:Lotad,60.50.50.60.70.50:agua/planta:Lombre,80.70.70.90.100.70:agua/planta:Ludicolo,40.40.50.30.30.30:planta:Seedot,70.70.40.60.40.60:planta/siniestro:Nuzleaf,90.100.60.90.60.80:planta/siniestro:Shiftry,40.55.30.30.30.85:normal/volador:Taillow,60.85.60.75.50.125:normal/volador:Swellow,40.30.30.55.30.85:agua/volador:Wingull,60.50.100.95.70.65:agua/volador:Pelipper,28.25.25.45.35.40:psiquico/hada:Ralts,38.35.35.65.55.50:psiquico/hada:Kirlia,68.65.65.125.115.80:psiquico/hada:Gardevoir,40.30.32.50.52.65:bicho/agua:Surskit,70.60.62.100.82.80:bicho/volador:Masquerain,60.40.60.40.60.35:planta:Shroomish,60.130.80.60.60.70:planta/lucha:Breloom,60.60.60.35.35.30:normal:Slakoth,80.80.80.55.55.90:normal:Vigoroth,150.160.100.95.65.100:normal:Slaking,31.45.90.30.30.40:bicho/tierra:Nincada,61.90.45.50.50.160:bicho/volador:Ninjask,1.90.45.30.30.40:bicho/fantasma:Shedinja,64.51.23.51.23.28:normal:Whismur,84.71.43.71.43.48:normal:Loudred,104.91.63.91.73.68:normal:Exploud,72.60.30.20.30.25:lucha:Makuhita,144.120.60.40.60.50:lucha:Hariyama,50.20.40.20.40.20:normal/hada:Azurill,30.45.135.45.90.30:roca:Nosepass,50.45.45.35.35.50:normal:Skitty,70.65.65.55.55.90:normal:Delcatty,50.75.75.65.65.50:siniestro/fantasma:Sableye,50.85.85.55.55.50:acero/hada:Mawile,50.70.100.40.40.30:acero/roca:Aron,60.90.140.50.50.40:acero/roca:Lairon,70.110.180.60.60.50:acero/roca:Aggron,30.40.55.40.55.60:lucha/psiquico:Meditite,60.60.75.60.75.80:lucha/psiquico:Medicham,40.45.40.65.40.65:electrico:Electrike,70.75.60.105.60.105:electrico:Manectric,60.50.40.85.75.95:electrico:Plusle,60.40.50.75.85.95:electrico:Minun,65.73.75.47.85.85:bicho:Volbeat,65.47.75.73.85.85:bicho:Illumise,50.60.45.100.80.65:planta/veneno:Roselia,70.43.53.43.53.40:veneno:Gulpin,100.73.83.73.83.55:veneno:Swalot,45.90.20.65.20.65:agua/siniestro:Carvanha,70.120.40.95.40.95:agua/siniestro:Sharpedo,130.70.35.70.35.60:agua:Wailmer,170.90.45.90.45.60:agua:Wailord,60.60.40.65.45.35:fuego/tierra:Numel,70.100.70.105.75.40:fuego/tierra:Camerupt,70.85.140.85.70.20:fuego:Torkoal,60.25.35.70.80.60:psiquico:Spoink,80.45.65.90.110.80:psiquico:Grumpig,60.60.60.60.60.60:normal:Spinda,45.100.45.45.45.10:tierra:Trapinch,50.70.50.50.50.70:tierra/dragon:Vibrava,80.100.80.80.80.100:tierra/dragon:Flygon,50.85.40.85.40.35:planta:Cacnea,70.115.60.115.60.55:planta/siniestro:Cacturne,45.40.60.40.75.50:normal/volador:Swablu,75.70.90.70.105.80:dragon/volador:Altaria,73.115.60.60.60.90:normal:Zangoose,73.100.60.100.60.65:veneno:Seviper,90.55.65.95.85.70:roca/psiquico:Lunatone,90.95.85.55.65.70:roca/psiquico:Solrock,50.48.43.46.41.60:agua/tierra:Barboach,110.78.73.76.71.60:agua/tierra:Whiscash,43.80.65.50.35.35:agua:Corphish,63.120.85.90.55.55:agua/siniestro:Crawdaunt,40.40.55.40.70.55:tierra/psiquico:Baltoy,60.70.105.70.120.75:tierra/psiquico:Claydol,66.41.77.61.87.23:roca/planta:Lileep,86.81.97.81.107.43:roca/planta:Cradily,45.95.50.40.50.75:roca/bicho:Anorith,75.125.100.70.80.45:roca/bicho:Armaldo,20.15.20.10.55.80:agua:Feebas,95.60.79.100.125.81:agua:Milotic,70.70.70.70.70.70:normal:Castform,60.90.70.60.120.40:normal:Kecleon,44.75.35.63.33.45:fantasma:Shuppet,64.115.65.83.63.65:fantasma:Banette,20.40.90.30.90.25:fantasma:Duskull,40.70.130.60.130.25:fantasma:Dusclops,99.68.83.72.87.51:planta/volador:Tropius,75.50.80.95.90.65:psiquico:Chimecho,65.130.60.75.60.75:siniestro:Absol,95.23.48.23.48.23:psiquico:Wynaut,50.50.50.50.50.50:hielo:Snorunt,80.80.80.80.80.80:hielo:Glalie,70.40.50.55.50.25:hielo/agua:Spheal,90.60.70.75.70.45:hielo/agua:Sealeo,110.80.90.95.90.65:hielo/agua:Walrein,35.64.85.74.55.32:agua:Clamperl,55.104.105.94.75.52:agua:Huntail,55.84.105.114.75.52:agua:Gorebyss,100.90.130.45.65.55:agua/roca:Relicanth,43.30.55.40.65.97:agua:Luvdisc,45.75.60.40.30.50:dragon:Bagon,65.95.100.60.50.50:dragon:Shelgon,95.135.80.110.80.100:dragon/volador:Salamence,40.55.80.35.60.30:acero/psiquico:Beldum,60.75.100.55.80.50:acero/psiquico:Metang,80.135.130.95.90.70:acero/psiquico:Metagross,80.100.200.50.100.50:roca:Regirock*,80.50.100.100.200.50:hielo:Regice*,80.75.150.75.150.50:acero:Registeel*,80.80.90.110.130.110:dragon/psiquico:Latias*,80.90.80.130.110.110:dragon/psiquico:Latios*,100.100.90.150.140.90:agua:Kyogre*,100.150.140.100.90.90:tierra:Groudon*,105.150.90.150.90.95:dragon/volador:Rayquaza*,100.100.100.100.100.100:acero/psiquico:Jirachi*,50.150.50.150.50.150:psiquico:Deoxys*,55.68.64.45.55.31:planta:Turtwig,75.89.85.55.65.36:planta:Grotle,95.109.105.75.85.56:planta/tierra:Torterra,44.58.44.58.44.61:fuego:Chimchar,64.78.52.78.52.81:fuego/lucha:Monferno,76.104.71.104.71.108:fuego/lucha:Infernape,53.51.53.61.56.40:agua:Piplup,64.66.68.81.76.50:agua:Prinplup,84.86.88.111.101.60:agua/acero:Empoleon,40.55.30.30.30.60:normal/volador:Starly,55.75.50.40.40.80:normal/volador:Staravia,85.120.70.50.60.100:normal/volador:Staraptor,59.45.40.35.40.31:normal:Bidoof,79.85.60.55.60.71:normal/agua:Bibarel,37.25.41.25.41.25:bicho:Kricketot,77.85.51.55.51.65:bicho:Kricketune,45.65.34.40.34.45:electrico:Shinx,60.85.49.60.49.60:electrico:Luxio,80.120.79.95.79.70:electrico:Luxray,40.30.35.50.70.55:planta/veneno:Budew,60.70.65.125.105.90:planta/veneno:Roserade,67.125.40.30.30.58:roca:Cranidos,97.165.60.65.50.58:roca:Rampardos,30.42.118.42.88.30:roca/acero:Shieldon,60.52.168.47.138.30:roca/acero:Bastiodon,40.29.45.29.45.36:bicho:Burmy,60.59.85.79.105.36:bicho/planta:Wormadam,70.94.50.94.50.66:bicho/volador:Mothim,30.30.42.30.42.70:bicho/volador:Combee,70.80.102.80.102.40:bicho/volador:Vespiquen,60.45.70.45.90.95:electrico:Pachirisu,55.65.35.60.30.85:agua:Buizel,85.105.55.85.50.115:agua:Floatzel,45.35.45.62.53.35:planta:Cherubi,70.60.70.87.78.85:planta:Cherrim,76.48.48.57.62.34:agua:Shellos,111.83.68.92.82.39:agua/tierra:Gastrodon,75.100.66.60.66.115:normal:Ambipom,90.50.34.60.44.70:fantasma/volador:Drifloon,150.80.44.90.54.80:fantasma/volador:Drifblim,55.66.44.44.56.85:normal:Buneary,65.76.84.54.96.105:normal:Lopunny,60.60.60.105.105.105:fantasma:Mismagius,100.125.52.105.52.71:siniestro/volador:Honchkrow,49.55.42.42.37.85:normal:Glameow,71.82.64.64.59.112:normal:Purugly,45.30.50.65.50.45:psiquico:Chingling,63.63.47.41.41.74:veneno/siniestro:Stunky,103.93.67.71.61.84:veneno/siniestro:Skuntank,57.24.86.24.86.23:acero/psiquico:Bronzor,67.89.116.79.116.33:acero/psiquico:Bronzong,50.80.95.10.45.10:roca:Bonsly,20.25.45.70.90.60:psiquico/hada:Mime Jr.,100.5.5.15.65.30:normal:Happiny,76.65.45.92.42.91:normal/volador:Chatot,50.92.108.92.108.35:fantasma/siniestro:Spiritomb,58.70.45.40.45.42:dragon/tierra:Gible,68.90.65.50.55.82:dragon/tierra:Gabite,108.130.95.80.85.102:dragon/tierra:Garchomp,135.85.40.40.85.5:normal:Munchlax,40.70.40.35.40.60:lucha:Riolu,70.110.70.115.70.90:lucha/acero:Lucario,68.72.78.38.42.32:tierra:Hippopotas,108.112.118.68.72.47:tierra:Hippowdon,40.50.90.30.55.65:veneno/bicho:Skorupi,70.90.110.60.75.95:veneno/siniestro:Drapion,48.61.40.61.40.50:veneno/lucha:Croagunk,83.106.65.86.65.85:veneno/lucha:Toxicroak,74.100.72.90.72.46:planta:Carnivine,49.49.56.49.61.66:agua:Finneon,69.69.76.69.86.91:agua:Lumineon,45.20.50.60.120.50:agua/volador:Mantyke,60.62.50.62.60.40:planta/hielo:Snover,90.92.75.92.85.60:planta/hielo:Abomasnow,70.120.65.45.85.125:siniestro/hielo:Weavile,70.70.115.130.90.60:electrico/acero:Magnezone,110.85.95.80.95.50:normal:Lickilicky,115.140.130.55.55.40:tierra/roca:Rhyperior,100.100.125.110.50.50:planta:Tangrowth,75.123.67.95.85.95:electrico:Electivire,75.95.67.125.95.83:fuego:Magmortar,85.50.95.120.115.80:hada/volador:Togekiss,86.76.86.116.56.95:bicho/volador:Yanmega,65.110.130.60.65.95:planta:Leafeon,65.60.110.130.95.65:hielo:Glaceon,75.95.125.45.75.95:tierra/volador:Gliscor,110.130.80.70.60.80:hielo/tierra:Mamoswine,85.80.70.135.75.90:normal:Porygon-Z,68.125.65.65.115.80:psiquico/lucha:Gallade,60.55.145.75.150.40:roca/acero:Probopass,45.100.135.65.135.45:fantasma:Dusknoir,70.80.70.80.70.110:hielo/fantasma:Froslass,50.50.77.95.77.91:electrico/fantasma:Rotom,75.75.130.75.130.95:psiquico:Uxie*,80.105.105.105.105.80:psiquico:Mesprit*,75.125.70.125.70.115:psiquico:Azelf*,100.120.120.150.100.90:acero/dragon:Dialga*,90.120.100.150.120.100:agua/dragon:Palkia*,91.90.106.130.106.77:fuego/acero:Heatran*,110.160.110.80.110.100:normal:Regigigas*,150.100.120.100.120.90:fantasma/dragon:Giratina*,120.70.110.75.120.85:psiquico:Cresselia*,80.80.80.80.80.80:agua:Phione*,100.100.100.100.100.100:agua:Manaphy*,70.90.90.135.90.125:siniestro:Darkrai*,100.100.100.100.100.100:planta:Shaymin*,120.120.120.120.120.120:normal:Arceus*,100.100.100.100.100.100:psiquico/fuego:Victini*,45.45.55.45.55.63:planta:Snivy,60.60.75.60.75.83:planta:Servine,75.75.95.75.95.113:planta:Serperior,65.63.45.45.45.45:fuego:Tepig,90.93.55.70.55.55:fuego/lucha:Pignite,110.123.65.100.65.65:fuego/lucha:Emboar,55.55.45.63.45.45:agua:Oshawott,75.75.60.83.60.60:agua:Dewott,95.100.85.108.70.70:agua:Samurott,45.55.39.35.39.42:normal:Patrat,60.85.69.60.69.77:normal:Watchog,45.60.45.25.45.55:normal:Lillipup,65.80.65.35.65.60:normal:Herdier,85.110.90.45.90.80:normal:Stoutland,41.50.37.50.37.66:siniestro:Purrloin,64.88.50.88.50.106:siniestro:Liepard,50.53.48.53.48.64:planta:Pansage,75.98.63.98.63.101:planta:Simisage,50.53.48.53.48.64:fuego:Pansear,75.98.63.98.63.101:fuego:Simisear,50.53.48.53.48.64:agua:Panpour,75.98.63.98.63.101:agua:Simipour,76.25.45.67.55.24:psiquico:Munna,116.55.85.107.95.29:psiquico:Musharna,50.55.50.36.30.43:normal/volador:Pidove,62.77.62.50.42.65:normal/volador:Tranquill,80.115.80.65.55.93:normal/volador:Unfezant,45.60.32.50.32.76:electrico:Blitzle,75.100.63.80.63.116:electrico:Zebstrika,55.75.85.25.25.15:roca:Roggenrola,70.105.105.50.40.20:roca:Boldore,85.135.130.60.80.25:roca:Gigalith,65.45.43.55.43.72:psiquico/volador:Woobat,67.57.55.77.55.114:psiquico/volador:Swoobat,60.85.40.30.45.68:tierra:Drilbur,110.135.60.50.65.88:tierra/acero:Excadrill,103.60.86.60.86.50:normal:Audino,75.80.55.25.35.35:lucha:Timburr,85.105.85.40.50.40:lucha:Gurdurr,105.140.95.55.65.45:lucha:Conkeldurr,50.50.40.50.40.64:agua:Tympole,75.65.55.65.55.69:agua/tierra:Palpitoad,105.95.75.85.75.74:agua/tierra:Seismitoad,120.100.85.30.85.45:lucha:Throh,75.125.75.30.75.85:lucha:Sawk,45.53.70.40.60.42:bicho/planta:Sewaddle,55.63.90.50.80.42:bicho/planta:Swadloon,75.103.80.70.80.92:bicho/planta:Leavanny,30.45.59.30.39.57:bicho/veneno:Venipede,40.55.99.40.79.47:bicho/veneno:Whirlipede,60.100.89.55.69.112:bicho/veneno:Scolipede,40.27.60.37.50.66:planta/hada:Cottonee,60.67.85.77.75.116:planta/hada:Whimsicott,45.35.50.70.50.30:planta:Petilil,70.60.75.110.75.90:planta:Lilligant,70.92.65.80.55.98:agua:Basculin,50.72.35.35.35.65:tierra/siniestro:Sandile,60.82.45.45.45.74:tierra/siniestro:Krokorok,95.117.80.65.70.92:tierra/siniestro:Krookodile,70.90.45.15.45.50:fuego:Darumaka,105.140.55.30.55.95:fuego:Darmanitan,75.86.67.106.67.60:planta:Maractus,50.65.85.35.35.55:bicho/roca:Dwebble,70.105.125.65.75.45:bicho/roca:Crustle,50.75.70.35.70.48:siniestro/lucha:Scraggy,65.90.115.45.115.58:siniestro/lucha:Scrafty,72.58.80.103.80.97:psiquico/volador:Sigilyph,38.30.85.55.65.30:fantasma:Yamask,58.50.145.95.105.30:fantasma:Cofagrigus,54.78.103.53.45.22:agua/roca:Tirtouga,74.108.133.83.65.32:agua/roca:Carracosta,55.112.45.74.45.70:roca/volador:Archen,75.140.65.112.65.110:roca/volador:Archeops,50.50.62.40.62.65:veneno:Trubbish,80.95.82.60.82.75:veneno:Garbodor,40.65.40.80.40.65:siniestro:Zorua,60.105.60.120.60.105:siniestro:Zoroark,55.50.40.40.40.75:normal:Minccino,75.95.60.65.60.115:normal:Cinccino,45.30.50.55.65.45:psiquico:Gothita,60.45.70.75.85.55:psiquico:Gothorita,70.55.95.95.110.65:psiquico:Gothitelle,45.30.40.105.50.20:psiquico:Solosis,65.40.50.125.60.30:psiquico:Duosion,110.65.75.125.85.30:psiquico:Reuniclus,62.44.50.44.50.55:agua/volador:Ducklett,75.87.63.87.63.98:agua/volador:Swanna,36.50.50.65.60.44:hielo:Vanillite,51.65.65.80.75.59:hielo:Vanillish,71.95.85.110.95.79:hielo:Vanilluxe,60.60.50.40.50.75:normal/planta:Deerling,80.100.70.60.70.95:normal/planta:Sawsbuck,55.75.60.75.60.103:electrico/volador:Emolga,50.75.45.40.45.60:bicho:Karrablast,70.135.105.60.105.20:bicho/acero:Escavalier,69.55.45.55.55.15:planta/veneno:Foongus,114.85.70.85.80.30:planta/veneno:Amoonguss,55.40.50.65.85.40:agua/fantasma:Frillish,100.60.70.85.105.60:agua/fantasma:Jellicent,165.75.80.40.45.65:agua:Alomomola,50.47.50.57.50.65:bicho/electrico:Joltik,70.77.60.97.60.108:bicho/electrico:Galvantula,44.50.91.24.86.10:planta/acero:Ferroseed,74.94.131.54.116.20:planta/acero:Ferrothorn,40.55.70.45.60.30:acero:Klink,60.80.95.70.85.50:acero:Klang,60.100.115.70.85.90:acero:Klinklang,35.55.40.45.40.60:electrico:Tynamo,65.85.70.75.70.40:electrico:Eelektrik,85.115.80.105.80.50:electrico:Eelektross,55.55.55.85.55.30:psiquico:Elgyem,75.75.75.125.95.40:psiquico:Beheeyem,50.30.55.65.55.20:fantasma/fuego:Litwick,60.40.60.95.60.55:fantasma/fuego:Lampent,60.55.90.145.90.80:fantasma/fuego:Chandelure,46.87.60.30.40.57:dragon:Axew,66.117.70.40.50.67:dragon:Fraxure,76.147.90.60.70.97:dragon:Haxorus,55.70.40.60.40.40:hielo:Cubchoo,95.130.80.70.80.50:hielo:Beartic,80.50.50.95.135.105:hielo:Cryogonal,50.40.85.40.65.25:bicho:Shelmet,80.70.40.100.60.145:bicho:Accelgor,109.66.84.81.99.32:tierra/electrico:Stunfisk,45.85.50.55.50.65:lucha:Mienfoo,65.125.60.95.60.105:lucha:Mienshao,77.120.90.60.90.48:dragon:Druddigon,59.74.50.35.50.35:tierra/fantasma:Golett,89.124.80.55.80.55:tierra/fantasma:Golurk,45.85.70.40.40.60:siniestro/acero:Pawniard,65.125.100.60.70.70:siniestro/acero:Bisharp,95.110.95.40.95.55:normal:Bouffalant,70.83.50.37.50.60:normal/volador:Rufflet,100.123.75.57.75.80:normal/volador:Braviary,70.55.75.45.65.60:siniestro/volador:Vullaby,110.65.105.55.95.80:siniestro/volador:Mandibuzz,85.97.66.105.66.65:fuego:Heatmor,58.109.112.48.48.109:bicho/acero:Durant,52.65.50.45.50.38:siniestro/dragon:Deino,72.85.70.65.70.58:siniestro/dragon:Zweilous,92.105.90.125.90.98:siniestro/dragon:Hydreigon,55.85.55.50.55.60:bicho/fuego:Larvesta,85.60.65.135.105.100:bicho/fuego:Volcarona,91.90.129.90.72.108:acero/lucha:Cobalion*,91.129.90.72.90.108:roca/lucha:Terrakion*,91.90.72.90.129.108:planta/lucha:Virizion*,79.115.70.125.80.111:volador:Tornadus*,79.115.70.125.80.111:electrico/volador:Thundurus*,100.120.100.150.120.90:dragon/fuego:Reshiram*,100.150.120.120.100.90:dragon/electrico:Zekrom*,89.125.90.115.80.101:tierra/volador:Landorus*,125.130.90.130.90.95:dragon/hielo:Kyurem*,91.72.90.129.90.108:agua/lucha:Keldeo*,100.77.77.128.128.90:normal/psiquico:Meloetta*,71.120.95.120.95.99:bicho/acero:Genesect*';

  /* ══════════════════════════════════════════════════════════════════════════════════════════════════════════════
   *  ENTRAÑAS DEL MONTE PLATEADO · asistente con aprendizaje (/entranas)
   *
   *  Cómo está hecho (de abajo arriba):
   *   1. LECTOR       lee cada pantalla del juego y la convierte en datos (tipo de pantalla, opciones, equipo, piso…).
   *   2. SABER        base de conocimiento que crece sola: cada especie, movimiento, bendición, puerta, evento, objeto,
   *                   mejora y bioma que aparece se apunta con sus números. Arranca con lo aprendido de tus bajadas
   *                   (SEMILLA) y se guarda en el navegador. Lo nuevo (Pokémon, bendiciones, mejoras, biomas…) entra
   *                   solo: sus efectos se leen del propio texto del juego.
   *   3. APRENDER     de cada combate: nivel de los rivales por piso, especies de cada bioma, qué movimientos usa cada
   *                   uno y cuánto pegan de verdad (ajuste por lado y tipo de ataque); de cada puerta: qué sale y
   *                   cuántas esquirlas da.
   *   4. MODELO       combate por turnos con las fórmulas del juego + lo aprendido + reglas del bioma + bendiciones.
   *   5. SIMULADOR    juega pisos (y bajadas enteras) con dados, para mirar hacia delante.
   *   6. IA           en cada decisión mira cada opción a corto plazo (la juega muchas veces unos pisos hacia delante,
   *                   Monte Carlo: ¿sobrevives a lo que viene?) y a largo (su TECHO: hasta qué piso aguanta ese equipo
   *                   con esas bendiciones, bioma a bioma, con todos al 100 y los rivales hinchándose). Nota = piso final
   *                   esperado + esquirlas según la prioridad (en «equilibrio», Botín pesa al principio).
   *   7. MEJORAS      simula bajadas enteras con y sin cada mejora del campamento: cuánto rinde cada esquirla.
   *   8. PILOTO       juega solo con las decisiones de la IA; se para ante lo que no conoce. Nunca «Retirarse».
   *   9. PANEL        pestañas: Ahora · Saber · Mejoras · Historial · Datos.
   *  El diario completo (cada pantalla, cada pulsación, cada golpe) se guarda aparte (IndexedDB) y se exporta.
   * ══════════════════════════════════════════════════════════════════════════════════════════════════════════════ */
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const pausa = (a, b) => sleep(a + Math.random() * (b - a));
  const texto = el => (el && el.textContent || '').replace(/\s+/g, ' ').trim();
  const norm = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  const enEntranas = () => /^\/entranas(\/|$)/.test(location.pathname);
  const PANEL_ID = 'axe-panel';
  const ajeno = el => !!(el.closest('#' + PANEL_ID) || el.closest('#k-avisos') || el.closest('[data-ax-ignore]'));
  const visible = el => !!el && el.getClientRects().length > 0;
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } };
  const lsPut = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };
  const numSprite = img => { const m = img && (img.getAttribute('src') || '').match(/\/sprites\/(?:[a-z-]+\/)*(\d+)\.(?:png|gif|webp)/); return m ? +m[1] : null; };
  const pct = x => Math.round(x * 100) + '%';
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const media = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
  const quitaIco = t => String(t || '').replace(/^[^\p{L}\p{N}¿¡]+/u, '').trim();

  /* ─── Tipos (el juego: muy eficaz ×1,65 y poco eficaz ×0,6 por cada tipo). Un tipo nuevo cuenta como neutro. ─── */
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
  const eficacia = (t, tipos) => tipos.reduce((m, x) => { const v = (TABLA[t] || {})[x] ?? 1; return m * (v === 0 ? 0 : v > 1 ? 1.65 : v < 1 ? 0.6 : 1); }, 1);
  // Nombre de tipo tal como sale en el juego → clave («Psíquico» → psiquico). Un tipo que no esté en la tabla se acepta igual.
  const tipoDe = t => { const n = norm(t).replace(/[^a-z]/g, ''); return n && n.length <= 10 && (TABLA[n] || TIPOS_VISTOS.has(n)) ? n : null; };
  const TIPOS_VISTOS = new Set(Object.keys(TABLA));

  /* ─── Pokédex 1-649 (PokéAPI): base PS.ATQ.DEF.ATE.DFE.VEL : tipos : nombre (* legendario/singular) ─── */
  const DEX = {}, DEX_NOMBRE = {};
  DEX_DATOS.split(',').forEach((x, i) => {
    const [s, t, n] = x.split(':');
    const leg = n.endsWith('*'), nombre = leg ? n.slice(0, -1) : n;
    DEX[i + 1] = { num: i + 1, s: s.split('.').map(Number), t: t.split('/'), nombre, leg };
    DEX_NOMBRE[norm(nombre)] = i + 1;
  });

  /* ══════════ 2 · SABER (base de conocimiento) ══════════ */
  const LS_KB = 'axe-kb2', LS_CONF = 'axe-conf2', SS_AUTO = 'axe-auto';
  const ESQUEMA = 4;
  const kbNueva = () => ({ ...JSON.parse(JSON.stringify(SEMILLA)), v: ESQUEMA, creada: Date.now() });
  let kb = lsGet(LS_KB, null);
  // De bases anteriores (esquemas 2 y 3) se queda todo lo aprendido. Lo que se medía mal se rehace con la semilla: el
  // ajuste de daño, y lo que te suben tus mejoras (antes un número fijo; ahora Temple + lo que Sangre de la veta suma
  // en cada piso desde el 46, que es lo que lo inflaba). Se añade lo que venía en la semilla y no tenías.
  if (kb && (kb.v === 2 || kb.v === 3)) {
    const s = SEMILLA;
    kb.k = JSON.parse(JSON.stringify(s.k));
    kb.templeObs = JSON.parse(JSON.stringify(s.templeObs));
    kb.subidaPuerta = JSON.parse(JSON.stringify(s.subidaPuerta));
    delete kb.multMio; delete kb.temple;
    for (const clave of ['bendiciones', 'puertas', 'eventos', 'especies', 'movs', 'mejoras', 'objetos']) for (const [n, x] of Object.entries(s[clave] || {})) if (!kb[clave][n]) kb[clave][n] = JSON.parse(JSON.stringify(x));
    for (const [c, e] of Object.entries(kb.eventos)) { if (/^e-bajas-a-/.test(c)) { kb.eventos.bioma = kb.eventos.bioma || { ...e, n: 0 }; kb.eventos.bioma.n += e.n; delete kb.eventos[c]; } if (c === 'e-un-altar') { kb.eventos.altar = e; delete kb.eventos[c]; } }
    kb.v = ESQUEMA;
  }
  if (!kb || kb.v !== ESQUEMA) kb = kbNueva();
  kb.templeObs = kb.templeObs || []; kb.subidaPuerta = kb.subidaPuerta || {};
  let tGuardar = null;
  const guardaKb = () => { clearTimeout(tGuardar); tGuardar = setTimeout(() => { if (!lsPut(LS_KB, kb)) { kb.niveles = kb.niveles.slice(-300); lsPut(LS_KB, kb); } }, 400); };
  const conf = Object.assign({ prioridad: 'equilibrio', empezarGratis: true, usarPases: false, reordenar: true, velocidad: 'normal', esfuerzo: 'normal', comprar: false }, lsGet(LS_CONF, {}));
  // 1.2: la prioridad por defecto pasa a «equilibrio» (bajar mucho y que rinda en esquirlas: Botín pronto)
  if (!conf.v12) { if (conf.prioridad === 'pisos') conf.prioridad = 'equilibrio'; conf.v12 = true; lsPut(LS_CONF, conf); }
  // Cuánto vale una esquirla frente a un piso, según la prioridad (en «pisos» de la bajada). En «equilibrio» pesa al
  // principio (Botín pronto rinde toda la partida) y cada vez menos al bajar (ahí lo que cuenta es aguantar).
  const pesoEsq = (piso = 1) => conf.prioridad === 'esquirlas' ? 1 : conf.prioridad === 'pisos' ? 0.05 : 0.4 - 0.35 * clamp((piso - 15) / 30, 0, 1);
  const guardaConf = () => lsPut(LS_CONF, conf);
  const media2 = x => x && x.n ? Math.exp(x.s / x.n) : 1;

  /* ─── Diario (IndexedDB; si no hay, localStorage con tope) ─── */
  const DIARIO = (() => {
    let db = null, cola = [];
    const abrir = () => new Promise(ok => {
      try {
        const r = indexedDB.open('axe-entranas', 1);
        r.onupgradeneeded = () => { const d = r.result; d.createObjectStore('diario', { autoIncrement: true }); d.createObjectStore('html', { keyPath: 'clave' }); };
        r.onsuccess = () => { db = r.result; ok(db); };
        r.onerror = () => ok(null);
      } catch { ok(null); }
    });
    const listo = abrir().then(d => { if (d && cola.length) { const c = cola; cola = []; c.forEach(x => poner(x)); } return d; });
    function poner(x) {
      if (!db) { cola.push(x); if (!('indexedDB' in window)) { const l = lsGet('axe-diario', []); l.push(x); lsPut('axe-diario', l.slice(-1500)); } return; }
      try { db.transaction('diario', 'readwrite').objectStore('diario').add(x); } catch { /* lleno */ }
    }
    function html(clave, h) { listo.then(d => { if (!d) return; try { d.transaction('html', 'readwrite').objectStore('html').put({ clave, t: Date.now(), html: h }); } catch { /* nada */ } }); }
    function todo(store) {
      return listo.then(d => new Promise(ok => {
        if (!d) return ok(store === 'diario' ? lsGet('axe-diario', []) : []);
        const out = [], req = d.transaction(store).objectStore(store).openCursor();
        req.onsuccess = () => { const c = req.result; if (c) { out.push(c.value); c.continue(); } else ok(out); };
        req.onerror = () => ok(out);
      }));
    }
    function borrar() { return listo.then(d => { if (d) { d.transaction('diario', 'readwrite').objectStore('diario').clear(); d.transaction('html', 'readwrite').objectStore('html').clear(); } localStorage.removeItem('axe-diario'); }); }
    function contar() { return listo.then(d => new Promise(ok => { if (!d) return ok(lsGet('axe-diario', []).length); const r = d.transaction('diario').objectStore('diario').count(); r.onsuccess = () => ok(r.result); r.onerror = () => ok(0); })); }
    return { poner, html, todo, borrar, contar };
  })();
  let bajadaId = lsGet('axe-bajada', null);
  const apunta = x => DIARIO.poner({ t: Date.now(), bajada: bajadaId, ...x });

  /* ─── Biomas: los seis conocidos; uno nuevo se apunta con su nombre y su efecto (leído de la cabecera) ─── */
  const BIOMAS_BASE = [
    { nombre: 'Galerías de Roca', ico: '🪨', efecto: 'Sin sorpresas: la roca de siempre.' },
    { nombre: 'Lago Subterráneo', ico: '💧', efecto: 'Corriente: tus Pokémon de tipo Agua van un 20% más fuertes en todo.' },
    { nombre: 'Bosque de Raíces', ico: '🌿', efecto: 'Espesura: los salvajes salen de dos en dos.' },
    { nombre: 'Cripta de Niebla', ico: '🌫️', efecto: 'Niebla: no se ve qué hay detrás de cada puerta hasta abrirla.' },
    { nombre: 'Glaciar de Acero', ico: '❄️', efecto: 'Frío: al acabar cada piso, los que no son de tipo Hielo pierden un 8% de PS.' },
    { nombre: 'Cámara de Magma', ico: '🌋', efecto: 'Calor: los rivales pegan un 15% más fuerte. Tus Pokémon de tipo Fuego, también.' },
  ];
  const ID_BIOMA = { 'galerias de roca': 'roca', 'lago subterraneo': 'lago', 'bosque de raices': 'bosque', 'cripta de niebla': 'cripta', 'glaciar de acero': 'glaciar', 'camara de magma': 'magma' };
  const idBioma = nombre => ID_BIOMA[norm(nombre)] || norm(nombre).replace(/[^a-z]+/g, '-');
  BIOMAS_BASE.forEach((b, i) => { const id = idBioma(b.nombre); if (!kb.biomas[id]) kb.biomas[id] = { ...b, orden: i }; });
  const listaBiomas = () => Object.entries(kb.biomas).sort((a, b) => a[1].orden - b[1].orden).map(([id, b]) => ({ id, ...b, reglas: reglasBioma(b.efecto) }));
  const biomaDePiso = p => { const L = listaBiomas(); return L[Math.floor((Math.max(1, p) - 1) / 5) % L.length]; };
  const vueltaDePiso = p => Math.floor((Math.max(1, p) - 1) / (5 * listaBiomas().length)) + 1;
  // Reglas del bioma leídas de su texto (así un bioma nuevo con un efecto parecido se entiende solo)
  function reglasBioma(t) {
    const n = norm(t), r = {};
    let m;
    if ((m = n.match(/tus pokemon de tipo ([a-z]+) van un (\d+)% mas fuertes/))) r.tipoMio = { t: m[1], x: 1 + m[2] / 100 };
    if ((m = n.match(/rivales pegan un (\d+)% mas/))) r.rivalDano = 1 + m[1] / 100;
    if ((m = n.match(/tus pokemon de tipo ([a-z]+), tambien/))) r.danoMio = { t: m[1], x: r.rivalDano || 1.15 };
    if ((m = n.match(/los que no son de tipo ([a-z]+) pierden un (\d+)% de ps/))) r.desgaste = { salvo: m[1], p: m[2] / 100 };
    if (/de dos en dos/.test(n)) r.dobles = true;
    if (/no se ve/.test(n)) r.niebla = true;
    return r;
  }

  /* ─── Efectos de bendiciones y mejoras, leídos de su texto ─── */
  const ESTAD = [['ps maximos', 'hp'], ['ps', 'hp'], ['ataque', 'atk'], ['especial', 'esp'], ['defensa', 'def'], ['velocidad', 'spe']];
  function efectoDe(desc) {
    const n = norm(desc), e = {};
    let m;
    if ((m = n.match(/\+(\d+(?:[.,]\d+)?)% (?:de )?([a-z ,]+?) a (todo el equipo|los de tipo ([a-z]+))/))) {
      const x = 1 + parseFloat(m[1].replace(',', '.')) / 100;
      e.stats = {}; for (const [k, c] of ESTAD) if (new RegExp('\\b' + k + '\\b').test(m[2]) && !e.stats[c]) e.stats[c] = x;
      if (m[4]) e.tipo = m[4];
    }
    if ((m = n.match(/\+(\d+)% a todas las estadisticas/))) e.todas = 1 + m[1] / 100;
    if ((m = n.match(/sube (\d+) niveles/))) e.niveles = +m[1];
    if ((m = n.match(/recupera un (\d+)% de ps/)) || (m = n.match(/un (\d+)% de ps tras cada combate ganado/))) e.curaVictoria = m[1] / 100;
    if (/aguanta con 1 ps/.test(n)) e.aguante = true;
    if (/descansos curan el doble/.test(n)) e.descansoX = 2;
    if ((m = n.match(/hogueras curan un (\d+)% mas/))) e.descansoMas = m[1] / 100;
    if ((m = n.match(/\+(\d+)% de esquirlas/))) e.esquirlas = m[1] / 100;
    if ((m = n.match(/reclutes llegan con los ps llenos y (\d+) niveles mas/))) { e.reclutaNiv = +m[1]; e.reclutaLlenos = true; }
    else if ((m = n.match(/^con (\d+) niveles mas/))) e.reclutaNiv = +m[1];
    else if ((m = n.match(/^(\d+) niveles mas/))) e.prestadoNiv = +m[1];
    if ((m = n.match(/empezar en el piso (\d+)/))) e.inicio = +m[1];
    if (/cuarta plaza|un hueco mas en el equipo/.test(n)) e.plazas = 1;
    if ((m = n.match(/del piso (\d+) hacia abajo, tu equipo se hincha un (\d+(?:[.,]\d+)?)% por piso/))) e.hincha = { desde: +m[1], p: parseFloat(m[2].replace(',', '.')) / 100 };
    else if ((m = n.match(/^un (\d+(?:[.,]\d+)?)% por piso/))) e.hincha = { desde: 46, p: parseFloat(m[1].replace(',', '.')) / 100 };   // Sangre de la veta (texto corto del campamento)
    if ((m = n.match(/se levanta al (\d+)%/))) e.pluma = m[1] / 100;
    if (/volver a tirar/.test(n)) e.reroll = true;
    if (/prestado entre (\d+)/.test(n)) e.prestadoOpciones = true;
    if (/bendicion antes del primer piso/.test(n)) e.bendicionInicial = true;
    return Object.keys(e).length ? e : null;
  }
  // Bendiciones activas (con sus ×N) → efectos sumados
  function efectosActivos(lista) {
    const ef = { stats: {}, porTipo: {}, curaVictoria: 0, aguante: false, descansoX: 1, esquirlas: 0, reclutaNiv: 0, reclutaLlenos: false };
    for (const b of lista) {
      const e = efectoDe(b.desc || (kb.bendiciones[b.nombre] || {}).desc || '');
      if (!e) continue;
      for (let i = 0; i < (b.veces || 1); i++) {
        if (e.stats) { const dest = e.tipo ? (ef.porTipo[e.tipo] = ef.porTipo[e.tipo] || {}) : ef.stats; for (const [c, x] of Object.entries(e.stats)) dest[c] = (dest[c] || 1) + (x - 1); }
        if (e.curaVictoria) ef.curaVictoria += e.curaVictoria;
        if (e.aguante) ef.aguante = true;
        if (e.descansoX) ef.descansoX *= e.descansoX;
        if (e.esquirlas) ef.esquirlas += e.esquirlas;
        if (e.reclutaNiv) ef.reclutaNiv += e.reclutaNiv;
        if (e.reclutaLlenos) ef.reclutaLlenos = true;
      }
    }
    return ef;
  }
  // Mejoras del campamento (la descripción dice el efecto al máximo: el actual es nivel/máximo de eso)
  function efectosMejoras(extra = null) {
    const ef = { curaVictoria: 0, esquirlas: 0, reclutaNiv: 0, prestadoNiv: 0, descansoMas: 0, plazas: 0, inicio: 1, hincha: null, pluma: 0, nTemple: null, nSangre: 0, sangreDesde: 46 };
    for (const [n, m] of Object.entries(kb.mejoras)) {
      const nivel = m.nivel + (extra === n ? 1 : 0);
      if (!nivel) continue;
      const e = efectoDe(m.desc); if (!e) continue;
      const f = nivel / (m.max || 1);
      if (e.curaVictoria) ef.curaVictoria += e.curaVictoria * f;
      if (e.esquirlas) ef.esquirlas += e.esquirlas * f;
      if (e.reclutaNiv) ef.reclutaNiv += e.reclutaNiv * f;
      if (e.prestadoNiv) ef.prestadoNiv += e.prestadoNiv * f;
      if (e.descansoMas) ef.descansoMas += e.descansoMas * f;
      if (e.plazas) ef.plazas += Math.round(nivel);
      if (e.inicio) ef.inicio = Math.max(ef.inicio, 1 + Math.round((e.inicio - 1) * f));
      if (e.hincha) { ef.hincha = { desde: e.hincha.desde, p: e.hincha.p * f }; ef.nSangre = nivel; ef.sangreDesde = e.hincha.desde; }
      if (e.pluma) ef.pluma = e.pluma;
      if (e.todas) { ef.todas = 1 + (e.todas - 1) * f; ef.nTemple = nivel; }
    }
    return ef;
  }
  // Las mejoras de ahora (se recalcula solo si cambia algún nivel)
  let memoMej = { k: null, v: null };
  const mejAhora = () => { const k = Object.entries(kb.mejoras).map(([n, m]) => n + ':' + m.nivel).join('|'); if (memoMej.k !== k) memoMej = { k, v: efectosMejoras() }; return memoMej.v; };

  /* ══════════ 1 · LECTOR (cada pantalla → datos) ══════════ */
  const raiz = () => document.querySelector('main main') || document.querySelector('main');
  const seccionCon = re => $$('main section').find(s => !ajeno(s) && re.test(texto(s.querySelector('p') || s)));
  const tiposEn = el => $$('span', el).filter(s => !s.children.length && /rounded-pill|pastilla/.test(s.className)).map(s => tipoDe(texto(s))).filter(Boolean);
  const numDe = (img, nombre) => numSprite(img) || DEX_NOMBRE[norm(nombre)] || null;
  let ultimaCab = null;
  function cabecera() {
    const p = $$('main p').find(x => !ajeno(x) && /^piso \d+$/i.test(texto(x)));
    if (!p) return null;
    const sec = p.closest('section'), ps = $$('p', sec);
    const piso = +texto(p).match(/\d+/)[0];
    const t0 = texto(ps[0]), vuelta = +((t0.match(/vuelta (\d+)/i) || [])[1] || 1);
    const nombre = quitaIco(t0.replace(/·\s*vuelta \d+/i, '')).trim();
    const efecto = texto(ps.find(x => x !== ps[0] && x !== p && !/💎|🪶/.test(texto(x))) || null);
    const id = idBioma(nombre);
    if (nombre && !kb.biomas[id]) { kb.biomas[id] = { nombre, ico: (t0.match(/^\S+/) || ['❔'])[0], efecto, orden: Object.keys(kb.biomas).length, nuevo: true }; guardaKb(); log(`🆕 Bioma nuevo: ${nombre} (${efecto}).`); }
    else if (nombre && efecto && kb.biomas[id].efecto !== efecto) { kb.biomas[id].efecto = efecto; guardaKb(); }
    const st = texto(sec), esq = st.match(/💎\s*(\d+) en esta bajada/);
    ultimaCab = { piso, vuelta, bioma: { id, ...kb.biomas[id], reglas: reglasBioma(kb.biomas[id].efecto) }, esquirlas: esq ? +esq[1] : null, pluma: /pluma lista/i.test(st) };
    return ultimaCab;
  }
  // Una tarjeta de Pokémon (equipo, candidato, prestado…): nombre, especie, nivel, tipos, PS
  function leerPoke(el) {
    const img = el.querySelector('img'), t = texto(el);
    const nombre = img ? img.alt : quitaIco(t).split(' Nv')[0];
    const L = +((t.match(/Nv\.\s*(\d+)/) || [])[1] || 0);
    const ps = t.match(/(\d+)\s*\/\s*(\d+)(?:\s*PS)?\s*$/) || t.match(/(\d+)\s*\/\s*(\d+)\s*PS/) || t.match(/(\d+)\s*\/\s*(\d+)/);
    const psSolo = !ps && t.match(/(\d+)\s*PS/);
    return { nombre, num: numDe(img, nombre), L, tipos: tiposEn(el), hp: ps ? +ps[1] : psSolo ? +psSolo[1] : null, hpMax: ps ? +ps[2] : psSolo ? +psSolo[1] : null };
  }
  function equipoLeido() {
    const sec = seccionCon(/^tu equipo/i);
    if (!sec) return null;
    const cap = texto(sec.querySelector('p')).match(/(\d+)\s*\/\s*(\d+)/);
    const miembros = $$('li[data-id]', sec).map(li => ({ ...leerPoke(li), id: li.dataset.id, li, asa: li.querySelector('[role="button"][aria-label^="Mover"]') }));
    return { miembros, plazas: cap ? +cap[2] : 4, arrastre: /arrastra/i.test(texto(sec)) };
  }
  function bendicionesActivas() {
    const s = seccionCon(/^bendiciones$/i);
    if (!s) return [];
    return $$('span[title]', s).map(x => { const t = quitaIco(texto(x)), m = t.match(/^(.*?)\s*×(\d+)$/); return { nombre: m ? m[1] : t, veces: m ? +m[2] : 1, desc: x.title }; });
  }
  function pantalla() {
    if (!enEntranas()) return null;
    const modal = $$('div.fixed.inset-0').find(d => !ajeno(d) && visible(d));
    if (modal) {
      const b = $$('button', modal).find(x => /^(seguir|continuar|vale|aceptar|entendido)$/i.test(texto(x)));
      const ico = texto(modal.querySelector('span.text-5xl, span[aria-hidden]'));
      const titulo = texto(modal.querySelector('p.font-display') || modal.querySelector('p'));
      const cuerpo = $$('p', modal).filter(p => texto(p) !== titulo).map(texto).join(' ');
      return { tipo: 'aviso', ico, titulo, cuerpo, boton: b || null, clase: claseAviso(titulo, cuerpo), cab: cabecera() || ultimaCab };
    }
    const cab = cabecera();
    const saltar = $$('main button').find(b => !ajeno(b) && visible(b) && /saltar al resultado/i.test(texto(b)));
    if (saltar) return { tipo: 'animacion', boton: saltar, cab: cab || ultimaCab };
    const secP = seccionCon(/elige tu prestado/i);
    if (secP) return { tipo: 'prestado', cab, opciones: $$('button', secP).map(b => ({ b, ...leerPoke(b) })) };
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
        const sp = $$('span.block', b).filter(x => !x.hasAttribute('aria-hidden'));
        const nombre = texto(sp[0]) || texto(b), ico = texto(b.querySelector('span[aria-hidden]'));
        return { b, nombre, desc: texto(sp[1]), ico, clase: clasePuerta(nombre, ico) };
      }) };
    }
    const secR = seccionCon(/te lo llevas/i);
    if (secR) {
      const cand = leerPoke(secR.querySelector('div') || secR);
      const quien = $$('p', secR).find(p => /a quien dejas atras/i.test(norm(texto(p))));
      if (quien) {
        const caja = quien.parentElement;
        return { tipo: 'sustituir', cab, cand, miembros: $$('button', caja).filter(b => b.querySelector('img')).map(b => ({ b, ...leerPoke(b) })),
          cancelar: $$('button', secR).find(b => /^cancelar$/i.test(texto(b))) || null };
      }
      return { tipo: 'reclutar', cab, cand, si: $$('button', secR).find(b => /^reclut/i.test(texto(b))) || null, no: $$('button', secR).find(b => /^dejar/i.test(texto(b))) || null };
    }
    const seguir = $$('main button').find(b => !ajeno(b) && visible(b) && /^seguir$/i.test(texto(b)));
    if (seguir && $$('main button').some(b => /repasar/i.test(texto(b)))) return { tipo: 'combate', boton: seguir, cab: cab || ultimaCab };
    const bajar = $$('main button').find(b => !ajeno(b) && visible(b) && /bajar/i.test(texto(b)) && /⛰/.test(texto(b)));
    if (bajar) return { tipo: 'lobby', boton: bajar, gratis: /gratis/i.test(texto(bajar)), pases: +((texto(bajar).match(/\((\d+)\)/) || [])[1] || 0), mejoras: leerMejoras() };
    return { tipo: 'desconocida', cab };
  }
  function clasePuerta(nombre, ico) {
    const n = norm(nombre);
    if (/guardian/.test(n)) return 'guardian';
    if (/elite/.test(n)) return 'elite';
    if (/descanso/.test(n)) return 'descanso';
    if (/combate/.test(n)) return 'combate';
    if (/misterio/.test(n)) return 'misterio';
    if (/tesoro/.test(n)) return 'tesoro';
    if (/^¿\?$|niebla/.test(n) || ico === '🌫️') return 'oculta';
    return 'p-' + n.replace(/[^a-z]+/g, '-');      // una puerta nueva: se aprende sola
  }
  // Qué es cada aviso (para aprender qué sale detrás de cada puerta)
  function claseAviso(titulo, cuerpo) {
    const t = norm(titulo + ' ' + cuerpo);
    if (/baja contigo solo|te lo prestan/.test(t)) return 'prestado';
    if (/ se une/.test(t)) return 'recluta';
    if (/se queda atras/.test(t)) return 'deja';
    if (/el guardian deja algo/.test(t)) return 'objeto';
    if (/una hoguera/.test(t)) return 'hoguera';
    if (/un cofre/.test(t)) return /algo mas que brilla/.test(t) ? 'cofre+' : 'cofre';
    if (/manantial/.test(t)) return 'manantial';
    if (/herido/.test(t)) return 'herido';
    if (/no has podido pasar/.test(t)) return 'derrota';
    if (/^bajas a /.test(norm(titulo))) return 'bioma';
    if (/un altar/.test(t)) return 'altar';
    if (/pluma de fenix/.test(t)) return 'pluma';
    if (/caes en el piso/.test(t)) return 'fin';
    if (Object.keys(kb.bendiciones).some(b => norm(titulo) === norm(b))) return 'bendicion';
    return 'e-' + norm(quitaIco(titulo)).replace(/[^a-z]+/g, '-').slice(0, 30);
  }
  // Pestaña «Mejoras» del campamento (si está abierta)
  function leerMejoras() {
    const t = $$('main p').find(p => !ajeno(p) && /^el campamento$/i.test(texto(p)));
    if (!t) return null;
    const caja = t.closest('div.space-y-2') || t.parentElement.parentElement;
    return $$('li', caja).map(li => {
      const ps = $$('p', li), cab = texto(ps[0]), m = cab.match(/^(.*?)\s*(\d+)\s*\/\s*(\d+)$/);
      const b = li.querySelector('button'), coste = b ? +((texto(b).match(/(\d+)/) || [])[1] || 0) : null;
      return { nombre: m ? m[1].trim() : cab, nivel: m ? +m[2] : 0, max: m ? +m[3] : 1, desc: texto(ps[1]), ico: texto(li.querySelector('[aria-hidden]')), coste, boton: b && !b.disabled ? b : null, alMax: /al maximo/i.test(norm(texto(li))) };
    }).filter(x => x.nombre);
  }
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
        else if ((m = t.match(/^(?:relevas con |sacas a |sale |entra )(.+?) \(Nv\.(\d+)\)/i))) mio = { nombre: m[1], L: +m[2] };
        else if ((m = t.match(/^(.+?) \(Nv\.(\d+)\) (?:sale|entra)/))) mio = { nombre: m[1], L: +m[2] };
        lineas.push({ t });
        continue;
      }
      const movEl = el.querySelector('span.truncate span.truncate') || el.querySelector('span.truncate');
      const quienEl = el.querySelector('span.block.truncate');
      const dmg = +((t.match(/[−-]\s*(\d+)\s*PS/) || [])[1] || 0);
      const q = texto(quienEl);
      const deMio = /border-hoja/.test(el.className);
      lineas.push({ mov: texto(movEl), quien: q.split('·')[0].trim(), tipo: tipoDe(((q.match(/\(([^)]+)\)\s*$/) || [])[1]) || ''), fis: /FÍS/.test(t), dmg, crit: /crítico/i.test(t),
        efic: /no es muy eficaz|poco eficaz/i.test(t) ? 'poco' : /muy eficaz/i.test(t) ? 'muy' : /no afecta|no le afecta/i.test(t) ? 'nada' : '', lado: deMio ? 'mio' : 'rival', a: deMio ? mio : rival, d: deMio ? rival : mio });
    }
    // tarjetas: nombre, nivel (solo el número de «Nv.54»), tipos y PS máximos
    const tarjetas = $$('main h3').filter(h => !ajeno(h)).map(h => {
      const c = h.closest('div.rounded-card') || h.parentElement.parentElement;
      const nv = $$('span', c).map(texto).find(x => /^Nv\.\d+$/.test(x));
      const ps = texto(c).match(/(\d+)\/(\d+) PS/);
      return { nombre: texto(h), L: nv ? +nv.slice(3) : 0, tipos: tiposEn(c), hpMax: ps ? +ps[2] : null, hp: ps ? +ps[1] : null };
    });
    const titulo = texto($$('main p').find(p => !ajeno(p) && p.closest('main main') && /rival|salvaje|guardi|paso|!/.test(texto(p)) && !p.closest('.tarjeta')) || null);
    return { lineas, tarjetas, titulo };
  }

  /* ══════════ 3 · APRENDER ══════════ */
  // Especie: se crea sola la primera vez (también si no está en la Pokédex: tipos del juego y estadísticas estimadas)
  function especie(nombre, num, tipos) {
    num = num || DEX_NOMBRE[norm(nombre)] || null;
    const clave = num || 'n:' + norm(nombre);
    let e = kb.especies[clave];
    if (!e) {
      const d = DEX[num];
      e = kb.especies[clave] = { num: num || null, nombre, tipos: tipos && tipos.length ? tipos : d ? d.t : ['normal'], biomas: {}, vistos: 0, movs: {}, nueva: !d };
      if (!d) log(`🆕 Pokémon nuevo en la base: ${nombre} (${e.tipos.join('/')}).`);
    }
    if (tipos && tipos.length && !e.tiposJuego) { e.tipos = tipos; e.tiposJuego = true; tipos.forEach(t => TIPOS_VISTOS.add(t)); }
    return e;
  }
  // Base de una especie: Pokédex; si es nueva, la que se deduce de sus PS vistos (PS = 3·b·Nv/100 + Nv + 14) y el resto de media
  function baseDe(e) {
    if (e.num && DEX[e.num]) return DEX[e.num].s;
    const obs = (e.psObs || []).filter(x => !x[2]);
    const bHp = obs.length ? media(obs.map(([L, hp]) => (hp - L - 14) * 100 / (3 * L))) : 75;
    return [clamp(Math.round(bHp), 20, 255), 85, 80, 80, 80, 75];
  }
  function aprenderCombate(c, cab, puerta) {
    if (!c || !cab) return;
    const b = cab.bioma.id;
    const vistos = new Set();
    for (const t of c.tarjetas) {
      const num = DEX_NOMBRE[norm(t.nombre)] || null, e = especie(t.nombre, num, t.tipos);
      if (t.hpMax && t.L && !esMio(t.nombre)) {
        e.psObs = (e.psObs || []).slice(-8); e.psObs.push([t.L, t.hpMax, 0]);
        // cuánto se «hinchan» los rivales en este piso (PS de verdad ÷ los de su fórmula)
        if (num && DEX[num]) { const f = Math.floor(3 * DEX[num].s[0] * t.L / 100) + t.L + 14; const r = t.hpMax / f; if (r > 0.95 && r < 5) { kb.hinchazon = (kb.hinchazon || []).slice(-200); kb.hinchazon.push([cab.piso, Math.round(r * 1000) / 1000]); } }
      }
    }
    for (const l of c.lineas) {
      let m;
      if (l.t && ((m = l.t.match(/sale al paso de (.+?) \(Nv\.(\d+)\)/)) || (m = l.t.match(/el rival saca a (.+?) \(Nv\.(\d+)\)/i)))) {
        if (vistos.has(m[1])) continue;
        vistos.add(m[1]);
        kb.niveles.push([cab.piso, +m[2], puerta || 'combate']);
        const num = DEX_NOMBRE[norm(m[1])] || null, e = especie(m[1], num);
        e.biomas[b] = (e.biomas[b] || 0) + 1; e.vistos++;
        e.nivel = [Math.min(e.nivel ? e.nivel[0] : 999, +m[2]), Math.max(e.nivel ? e.nivel[1] : 0, +m[2])];
      }
      if (l.mov) {
        const mv = kb.movs[l.mov] = kb.movs[l.mov] || { tipo: l.tipo, cat: l.fis ? 'F' : 'E', n: 0 };
        mv.n++;
        if (l.a) { const num = DEX_NOMBRE[norm(l.a.nombre)] || null; especie(l.a.nombre, num).movs[l.mov] = 1; }
      }
    }
    // ajuste del daño: golpes sin crítico, contando tus mejoras (lo que ya se ve en tus PS) y tus bendiciones activas
    const ef = efectosActivos(bendicionesActivas().length ? bendicionesActivas() : ultimasBendiciones);
    for (const l of c.lineas) {
      if (!l.mov || !l.dmg || l.crit || !l.a || !l.d || !l.tipo) continue;
      const A = luchadorDeNombre(l.a.nombre, l.a.L, l.lado === 'mio', ef, cab.piso), D = luchadorDeNombre(l.d.nombre, l.d.L, l.lado !== 'mio', ef, cab.piso);
      if (!A || !D) continue;
      const prev = danoBase(A, D, l.tipo, l.fis, cab.bioma.reglas);
      if (prev < 4 || l.dmg < 4) continue;
      const r = Math.log(l.dmg / prev);
      if (Math.abs(r) > 1.2) continue;
      const clave = (l.lado === 'mio' ? 'mio-' : 'riv-') + (l.fis ? 'F' : 'E');
      const k = kb.k[clave] = kb.k[clave] || { n: 0, s: 0 };
      k.n++; k.s += r;
      if (k.n > 400) { k.s *= 400 / k.n; k.n = 400; }        // olvida despacio (si cambian tus mejoras, se nota)
    }
    if (kb.niveles.length > 600) kb.niveles = kb.niveles.slice(-600);
    guardaKb();
  }
  let equipoNombres = new Set(), ultimasBendiciones = [];
  const esMio = nombre => equipoNombres.has(nombre);
  // Lo que se ve de tu equipo: PS máximos reales → cuánto te suben tus mejoras. En el juego todas las bonificaciones SE
  // SUMAN en un solo multiplicador (visto en tus PS: 1,16 con Temple 4/5; +0,15 por cada Vitalidad; +0,20 en el Lago a
  // los de tipo Agua), así que lo tuyo = PS ÷ fórmula − 1 − lo que suman bendiciones y bioma.
  function aprenderEquipo(eq) {
    if (!eq) return;
    equipoNombres = new Set(eq.miembros.map(m => m.nombre));
    const ef = efectosActivos(bendicionesActivas()), r0 = ultimaCab && ultimaCab.bioma.reglas;
    for (const m of eq.miembros) {
      const e = especie(m.nombre, m.num, m.tipos);
      if (!m.hpMax || !m.L || !e.num || !DEX[e.num]) continue;
      const b = baseDe(e), f = Math.floor(3 * b[0] * m.L / 100) + m.L + 14;
      let suma = (ef.stats.hp || 1) - 1;
      for (const t of e.tipos) if (ef.porTipo[t] && ef.porTipo[t].hp) suma += ef.porTipo[t].hp - 1;
      if (r0 && r0.tipoMio && e.tipos.includes(r0.tipoMio.t)) suma += r0.tipoMio.x - 1;
      const t = m.hpMax / f - 1 - suma;
      // se apunta con el piso y los niveles de Temple y Sangre: así se separa lo fijo de lo que crece en cada piso
      if (t > -0.2 && t < 4 && ultimaCab) { const mj = mejAhora(); kb.templeObs.push([ultimaCab.piso, Math.round(t * 1000) / 1000, mj.nTemple, mj.nSangre]); if (kb.templeObs.length > 300) kb.templeObs = kb.templeObs.slice(-300); }
    }
  }
  // Qué sale detrás de cada puerta y cuántas esquirlas da (se reparte entre el aviso que sigue y el cambio de esquirlas)
  let puertaPendiente = null, ultimaCerrada = null;
  function aprenderPuerta(clase, P) {
    const p = kb.puertas[clase] = kb.puertas[clase] || { nombre: P ? P.nombre : clase, ico: P ? P.ico : '🚪', vista: 0, elegida: 0, esq: { n: 0, s: 0 }, sale: {} };
    p.elegida++;
    puertaPendiente = { clase, piso: ultimaCab && ultimaCab.piso, esq: ultimaCab && ultimaCab.esquirlas, t: Date.now(), resultado: null };
  }
  function cerrarPuerta(cab, resultado) {
    const pp = puertaPendiente;
    if (!pp) return;
    const p = kb.puertas[pp.clase];
    if (resultado && !pp.resultado) { pp.resultado = resultado; p.sale[resultado] = (p.sale[resultado] || 0) + 1; }
    if (cab && cab.piso > pp.piso) ultimaCerrada = { clase: pp.resultado && ['combate', 'elite', 'guardian'].includes(pp.resultado) ? pp.resultado : pp.clase, piso: pp.piso };
    if (cab && cab.piso > pp.piso && cab.esquirlas != null && pp.esq != null) {
      const mult = multEsquirlas(efectosActivos(ultimasBendiciones), efectosMejoras());
      const d = (cab.esquirlas - pp.esq) / mult;
      if (d >= 0 && d < 200) { p.esq.n++; p.esq.s += d; kb.esqMult = mult; }
      if (!pp.resultado && ['misterio', 'tesoro', 'oculta'].includes(pp.clase)) p.sale.nada = (p.sale.nada || 0) + 1;
      puertaPendiente = null;
    }
    guardaKb();
  }

  /* ══════════ 4 · MODELO DE COMBATE (fórmulas del juego + lo aprendido) ══════════
   * Estadísticas: PS = 3·base·Nv/100 + Nv + 14 · resto = 2·base·Nv/100 + 5 · una sola «Especial» (media de At. Esp. y
   * Def. Esp.). Los tuyos: × lo que te dan tus mejoras (medido en tus PS) × bendiciones. Daño = ((2·Nv/5+2)·30,5·A/D/50
   * + 2) · 1,5 si es de su tipo · eficacia (×1,65 / ×0,6 por tipo) · ajuste aprendido (tuyos/rivales × físico/especial)
   * · potencia aprendida de cada movimiento · reglas del bioma. Críticos ~9% ×1,64. Tirada de daño ±15%.
   * ═══════════════════════════════════════════════════════════════════════════════════════════════════════════ */
  const multEsquirlas = (ef, mej) => (1 + (ef ? ef.esquirlas : 0)) * (1 + (mej ? mej.esquirlas : 0));
  const kLado = c => kb.k[c] && kb.k[c].n >= 3 ? media2(kb.k[c]) : 1;
  // Lo que te suben tus mejoras a todo, aprendido de tus PS: una parte fija por nivel de Temple de Plata (~4%) y otra que
  // crece en cada piso desde el 46 por nivel de Sangre de la veta (~0,7% por piso). t = a·Temple + b·Sangre·(piso − 46)
  let memoModelo = { k: null, r: null };
  function modeloMio() {
    const obs = kb.templeObs || [], D = 46;
    const k = obs.length + ':' + (obs.length ? obs[obs.length - 1].join() : '');
    if (memoModelo.k === k) return memoModelo.r;
    const nt = o => o[2] == null ? 1 : o[2];               // sin Temple leído, lo fijo va entero en «a»
    const fijos = obs.filter(o => o[0] <= D && nt(o) > 0);
    const a = fijos.length >= 3 ? fijos.reduce((s, o) => s + o[1] * nt(o), 0) / fijos.reduce((s, o) => s + nt(o) ** 2, 0) : 0.0395;
    const sube = obs.filter(o => o[0] > D && o[3] > 0), x = o => o[3] * (o[0] - D);
    const b = sube.length >= 3 ? clamp(sube.reduce((s, o) => s + (o[1] - a * nt(o)) * x(o), 0) / sube.reduce((s, o) => s + x(o) ** 2, 0), 0, 0.05) : 0.007;
    memoModelo = { k, r: { a, b, D } };
    return memoModelo.r;
  }
  const multMio = (piso = 1, mej = mejAhora()) => { const M = modeloMio(); return 1 + M.a * (mej.nTemple ?? 1) + M.b * mej.nSangre * Math.max(0, piso - (mej.sangreDesde || M.D)); };
  const pendMio = (mej = mejAhora()) => modeloMio().b * mej.nSangre;
  const CS = ['hp', 'atk', 'def', 'esp', 'spe'];
  const recalc = x => { for (const c of CS) x[c] = x.raw[c] * x.m[c]; return x; };
  function stats(b, L) {
    const st = x => Math.floor(2 * x * L / 100) + 5;
    // físico si su Ataque base supera a su «Especial» (media de At. Esp. y Def. Esp.); si no, especial (comprobado en 218 de 218 golpes)
    return { hp: Math.floor(3 * b[0] * L / 100) + L + 14, atk: st(b[1]), def: st(b[2]), esp: st(Math.round((b[3] + b[4]) / 2)), spe: st(b[5]), fis: b[1] > Math.round((b[3] + b[4]) / 2) };
  }
  // Movimientos vistos de una especie (solo para enseñarlos: el nombre no cambia el daño, lo que cuenta es el tipo)
  const movsDe = e => Object.keys(e.movs || {});
  // Un luchador. Los tuyos: cada estadística × (1 + tus mejoras + lo que sumen tus bendiciones), todo sumado como en el
  // juego. El «Especial» es uno solo: lo que lo sube (Furia, Afinidad…) sube también tu defensa especial.
  // o: { hpMax (el de verdad), vida, piso (para lo que suma Sangre de la veta), mej (mejoras; por defecto las de ahora) }
  function luchadorDe(e, L, mio, ef, o = {}) {
    const b = baseDe(e), st = stats(b, L);
    const x = { num: e.num, nombre: e.nombre, L, tipos: e.tipos, mio, fis: st.fis, b, movs: movsDe(e), raw: { hp: st.hp, atk: st.atk, def: st.def, esp: st.esp, spe: st.spe }, m: { hp: 1, atk: 1, def: 1, esp: 1, spe: 1 } };
    if (mio) {
      const t = multMio(o.piso || 1, o.mej || mejAhora()) - 1 + (o.extraTemple || 0);
      for (const c of CS) x.m[c] += t;
      if (ef) {
        for (const [c, v] of Object.entries(ef.stats)) if (x.m[c] != null) x.m[c] += v - 1;
        for (const tp of x.tipos) if (ef.porTipo[tp]) for (const [c, v] of Object.entries(ef.porTipo[tp])) if (x.m[c] != null) x.m[c] += v - 1;
      }
    }
    recalc(x);
    if (o.hpMax) x.hp = o.hpMax;
    x.vida = o.vida ?? 1;
    return x;
  }
  function luchadorDeNombre(nombre, L, mio, ef, piso) {
    const num = DEX_NOMBRE[norm(nombre)] || null;
    const e = kb.especies[num || 'n:' + norm(nombre)] || (num ? { num, nombre, tipos: DEX[num].t, movs: {} } : null);
    if (!e) return null;
    const x = luchadorDe(e, L, mio, ef, { piso: piso || 1 });
    return mio ? x : hinchar(x, hinchaRival(piso || 1));
  }
  // Desde cierto piso los rivales, ya en Nv.100, se «hinchan» (más PS, ataque y defensas) un poco más en cada piso.
  // Se aprende de los PS de verdad de cada rival visto; al principio: +4% por piso desde el 46.
  let memoHincha = { n: -1, a: 0, b: 0, ok: false };
  function hinchaRival(piso) {
    const pts = kb.hinchazon || [];
    if (memoHincha.n !== pts.length) {
      const h = pts.filter(p => p[1] > 1.005);
      memoHincha = { n: pts.length, ok: false };
      if (h.length >= 3) {
        const n = h.length, sx = h.reduce((s, p) => s + p[0], 0), sy = h.reduce((s, p) => s + p[1], 0), sxx = h.reduce((s, p) => s + p[0] * p[0], 0), sxy = h.reduce((s, p) => s + p[0] * p[1], 0);
        if (n * sxx - sx * sx > 0) { const b = (n * sxy - sx * sy) / (n * sxx - sx * sx); memoHincha = { n: pts.length, a: (sy - b * sx) / n, b, ok: b > 0 }; }
      }
    }
    if (memoHincha.ok) return Math.max(1, memoHincha.a + memoHincha.b * piso);
    return 1 + 0.04 * Math.max(0, piso - 46);
  }
  const hinchar = (x, h) => h === 1 ? x : { ...x, hp: x.hp * h, atk: x.atk * h, def: x.def * h, esp: x.esp * h };
  // Daño de un ataque de tipo `tipo` antes de ajustes aprendidos
  function danoBase(A, D, tipo, fis, reglas) {
    const Aa = fis ? A.atk : A.esp, Dd = fis ? D.def : D.esp;
    let d = ((2 * A.L / 5 + 2) * 30.5 * Aa / Math.max(1, Dd) / 50 + 2) * (A.tipos.includes(tipo) ? 1.5 : 1) * eficacia(tipo, D.tipos);
    if (reglas) {
      // «tus Pokémon de tipo X van un N% más fuertes en todo»: se suma a su multiplicador (pegan más y aguantan más)
      if (reglas.tipoMio) {
        const t = reglas.tipoMio, b = t.x - 1, cA = fis ? 'atk' : 'esp', cD = fis ? 'def' : 'esp';
        if (A.mio && A.m && A.tipos.includes(t.t)) d *= (A.m[cA] + b) / A.m[cA];
        if (D.mio && D.m && D.tipos.includes(t.t)) d /= (D.m[cD] + b) / D.m[cD];
      }
      if (!A.mio && reglas.rivalDano) d *= reglas.rivalDano;
      if (A.mio && reglas.danoMio && A.tipos.includes(reglas.danoMio.t)) d *= reglas.danoMio.x;
    }
    return d;
  }
  // Cómo ataca el juego (visto en tus combates: el nombre del movimiento es decorado): con el más eficaz de sus tipos
  // (si empatan, el primero), físico o especial según sus estadísticas; si todos los suyos son poco eficaces y un
  // ataque Normal no lo es tanto, ataca con Normal (físico y sin el ×1,5 de su tipo).
  function mejorAtaque(A, D, reglas) {
    let m = null;
    for (const t of A.tipos) { const e = eficacia(t, D.tipos); if (!m || e > m.e) m = { t, e }; }
    let fis = A.fis;
    if (m.e < 1) { const en = eficacia('normal', D.tipos); if (en > m.e) { m = { t: 'normal', e: en }; fis = true; } }
    if (m.e === 0) return D.hp / 16;
    return danoBase(A, D, m.t, fis, reglas) * kLado((A.mio ? 'mio-' : 'riv-') + (fis ? 'F' : 'E'));
  }
  const HOLGAZAN = 289;
  // Un combate: pelean los tres primeros que sigan en pie; el que gana sigue con lo que le queda. rng: dados (o null →
  // cuenta media). Devuelve si ganas; cambia la vida de los tuyos en `mios`.
  // out (opcional): out.prog = parte de los rivales que se ha tumbado (0..1), para medir lo cerca que se queda
  function combate(mios, rivales, reglas, rng, ef, out) {
    const A = mios.filter(x => x.vida > 0).slice(0, 3), B = rivales.map(x => ({ l: x, v: 1 }));
    const memo = new Map();
    const dano = (x, y) => { const k = x.nombre + x.L + '>' + y.nombre + y.L; let d = memo.get(k); if (d === undefined) memo.set(k, (d = mejorAtaque(x, y, reglas) / y.hp)); return d; };
    const tirada = () => rng ? (0.8 + 0.4 * rng()) * (rng() < 0.09 ? 1.64 : 1) : 1.058;   // tirada de daño ±20% (lo visto) y críticos
    let i = 0, j = 0, turno = 0, aguante = !!(ef && ef.aguante);
    const golpeA = () => { B[j].v -= dano(A[i], B[j].l) * tirada() * (A[i].num === HOLGAZAN && turno % 2 ? 0 : 1); if (B[j].v <= 0) { j++; turno = 0; } };
    const golpeB = () => {
      A[i].vida -= dano(B[j].l, A[i]) * tirada() * (B[j].l.num === HOLGAZAN && turno % 2 ? 0 : 1);
      if (A[i].vida <= 0) { if (aguante) { A[i].vida = 1 / A[i].hp; aguante = false; } else { A[i].vida = 0; i++; turno = 0; } }
    };
    for (let n = 0; i < A.length && j < B.length && n < 300; n++, turno++) {
      const a = A[i], b = B[j].l;
      const primero = a.spe > b.spe || (a.spe === b.spe && (rng ? rng() < 0.5 : true));
      if (primero) { golpeA(); if (j < B.length && B[j].l === b) golpeB(); }
      else { golpeB(); if (i < A.length && A[i] === a) golpeA(); }
    }
    if (out) out.prog = j >= B.length ? 1 : (j + clamp(1 - B[j].v, 0, 1)) / B.length;
    return j >= B.length;
  }

  /* ─── Lo que hay abajo (aprendido): nivel de los rivales por piso y especies de cada bioma ─── */
  let memoNivel = { n: -1, f: null };
  function curvaNivel() {
    if (memoNivel.n === kb.niveles.length) return memoNivel.f;
    // solo los de antes del tope: los de Nv.96-99 (ya casi en 100) tuercen la recta y salían rivales de Nv.23 en el piso 1
    const pts = kb.niveles.filter(x => x[1] < 95);
    let a = 8, b = 2;
    if (pts.length >= 6) {
      const n = pts.length, sx = pts.reduce((s, p) => s + p[0], 0), sy = pts.reduce((s, p) => s + p[1], 0);
      const sxx = pts.reduce((s, p) => s + p[0] * p[0], 0), sxy = pts.reduce((s, p) => s + p[0] * p[1], 0);
      if (n * sxx - sx * sx > 0) { b = (n * sxy - sx * sy) / (n * sxx - sx * sx); a = (sy - b * sx) / n; }
    }
    const off = {};
    for (const c of ['combate', 'elite', 'guardian']) { const r = pts.filter(p => p[2] === c).map(p => p[1] - (a + b * p[0])); off[c] = r.length >= 2 ? media(r) : { combate: 0, elite: 1.5, guardian: 3 }[c]; }
    const f = (piso, puerta = 'combate') => clamp(Math.round(a + b * piso + (off[puerta] ?? 0)), 2, 100);
    memoNivel = { n: kb.niveles.length, f, a, b, off };
    return f;
  }
  const nivelRival = (piso, puerta) => curvaNivel()(piso, puerta);
  function poolBioma(id) {
    const vistas = Object.values(kb.especies).filter(e => e.biomas && e.biomas[id]);
    if (vistas.length >= 3) return vistas.map(e => ({ e, w: e.biomas[id] }));
    const todas = Object.values(kb.especies).filter(e => e.vistos);
    return todas.length ? todas.map(e => ({ e, w: 1 })) : Object.values(DEX).filter(d => !d.leg).slice(0, 150).map(d => ({ e: { num: d.num, nombre: d.nombre, tipos: d.t, movs: {} }, w: 1 }));
  }
  const elige = (lista, rng) => { const tot = lista.reduce((s, x) => s + x.w, 0); let r = rng() * tot; for (const x of lista) { r -= x.w; if (r <= 0) return x; } return lista[lista.length - 1]; };
  function rivalesDe(piso, puerta, rng) {
    const bioma = biomaDePiso(piso), pool = poolBioma(bioma.id), L = nivelRival(piso, puerta);
    const n = puerta === 'guardian' ? 3 : puerta === 'elite' ? 2 : bioma.reglas.dobles ? 2 : 1;
    const h = hinchaRival(piso);
    return Array.from({ length: n }, () => hinchar(luchadorDe(elige(pool, rng).e, L, false, null), h));
  }

  /* ══════════ 5 · SIMULADOR (un piso, con dados) ══════════ */
  // Estado de una bajada: { piso, eq:[luchadores], ef (bendiciones), bend:[nombres], mej (mejoras), pluma, esq, vivo, plazas }
  const clonar = S => ({ ...S, eq: S.eq.map(x => ({ ...x, raw: x.raw && { ...x.raw }, m: x.m && { ...x.m } })), ef: JSON.parse(JSON.stringify(S.ef)), bend: S.bend.slice() });
  function rngDe(seed) { let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
  const vidaMedia = S => S.eq.length ? media(S.eq.map(x => x.vida)) : 0;
  const potencia = x => (x.hp * (x.def + x.esp) / 2) * Math.max(x.atk, x.esp) * (1 + x.spe / 300) * (x.vida > 0 ? 0.5 + x.vida / 2 : 0.3);
  // Niveles que da cada puerta al ganarla (aprendido; al principio Élite 3, Combate 2, Guardián 3,3)
  const SUBE0 = { elite: 3, combate: 2, guardian: 3.3 };
  const subePuerta = c => { const q = kb.subidaPuerta && kb.subidaPuerta[c]; return q && q.n >= 5 ? q.s / q.n : SUBE0[c] ?? (kb.subida.n ? kb.subida.s / kb.subida.n : 2.5); };
  function subirNivel(S, x, puerta = 'combate') {
    const nuevo = Math.min(100, x.L + subePuerta(puerta));
    if (nuevo === x.L) return;
    ponNivel(x, nuevo);
  }
  // Cambiar de nivel: con su base se recalcula exacto; si no, las estadísticas crudas crecen casi en proporción
  function ponNivel(x, L) {
    if (x.b && x.raw) { const st = stats(x.b, Math.round(L)); for (const c of CS) x.raw[c] = st[c]; x.L = L; recalc(x); return; }
    subeCrudo(x, (L - x.L) / Math.max(1, x.L)); x.L = L;
  }
  function subeCrudo(x, f) { if (x.raw) { for (const c of CS) x.raw[c] *= 1 + f * 0.95; recalc(x); } else for (const c of CS) x[c] *= 1 + f * 0.95; }
  // Al bajar un piso, Sangre de la veta suma lo suyo a todo (se suma como el resto de bonificaciones)
  function sangrePiso(S) {
    const pd = pendMio(S.mej);
    if (!pd || S.piso <= (S.mej.sangreDesde || 46)) return;
    for (const x of S.eq) if (x.m) { for (const c of CS) x.m[c] += pd; recalc(x); }
  }
  function curar(S, vivos, caidos) { for (const x of S.eq) x.vida = x.vida > 0 ? Math.min(1, x.vida + vivos) : caidos; }
  // Recluta: si hay hueco entra; si no, sustituye al más flojo si el nuevo es claramente mejor
  function reclutarSim(S, e, L) {
    const nivel = Math.min(100, L + (S.ef.reclutaNiv || 0) + (S.mej.reclutaNiv || 0));
    const x = luchadorDe(e, nivel, true, S.ef, { piso: S.piso, mej: S.mej }); x.vida = S.ef.reclutaLlenos ? 1 : 0.6;
    if (S.eq.length < S.plazas) { S.eq.push(x); return; }
    let peor = 0; S.eq.forEach((y, k) => { if (potencia(y) < potencia(S.eq[peor])) peor = k; });
    if (potencia(x) > potencia(S.eq[peor]) * 1.08) S.eq[peor] = x;
  }
  // Valor rápido de una bendición (el que usan las partidas simuladas), pensado a largo plazo:
  // · Todo se SUMA en un solo multiplicador, así que un +15% rinde más en lo que menos tienes (15 ÷ lo que ya llevas):
  //   así se reparte solo entre PS, ataque y defensas (aguantar ∝ PS × defensa; ganar ∝ ataque).
  // · Curar al ganar (Sanguijuela) vale mucho hasta que entre todo cura ~100% por victoria; luego ya no suma.
  // · Subir niveles vale poco (al 100 se llega igual y ahí no hace nada). Botín vale más cuanto más queda por bajar.
  function valorRapidoBend(S, e) {
    if (!e) return 0.01;
    const eq = S.eq, n = Math.max(1, eq.length);
    let v = 0;
    if (e.stats) for (const x of eq) {
      if (!x.m || (e.tipo && !x.tipos.includes(e.tipo))) continue;
      const g = c => ((e.stats[c] || 1) - 1) / x.m[c];
      v += (g('hp') + (x.fis ? g('atk') : g('esp')) + 0.5 * g('def') + 0.5 * g('esp') + 0.2 * g('spe')) / n;
    }
    if (e.curaVictoria) v += e.curaVictoria * 1.3 * Math.max(0, 1.1 - S.ef.curaVictoria - S.mej.curaVictoria);
    if (e.niveles) v += eq.reduce((s, x) => s + (Math.min(100, x.L + e.niveles) - x.L) / Math.max(1, x.L), 0) / n * 0.5;
    if (e.aguante) v += S.ef.aguante ? 0 : 0.05;
    if (e.descansoX) v += 0.03;
    if (e.esquirlas) v += pesoEsq(S.piso) * 0.5 * e.esquirlas / (1 + S.ef.esquirlas) * clamp(((S.techo || S.piso + 60) - S.piso) / 80, 0, 1.5);
    if (e.reclutaNiv) v += S.eq.length < S.plazas ? 0.04 : 0.015;
    return v;
  }
  function darBendicion(S, rng) {
    const cat = Object.entries(kb.bendiciones);
    if (!cat.length) return;
    const tres = Array.from({ length: 3 }, () => cat[Math.floor(rng() * cat.length)]);
    let mejor = null;
    for (const [n, b] of tres) { const e = efectoDe(b.desc); const v = valorRapidoBend(S, e); if (!mejor || v > mejor.v) mejor = { n, b, e, v }; }
    aplicarBendicion(S, mejor.n, mejor.b.desc);
  }
  function aplicarBendicion(S, nombre, desc) {
    const e = efectoDe(desc); if (!e) return;
    S.bend.push(nombre);
    if (e.niveles) S.eq.forEach(x => { if (x.L < 100) ponNivel(x, Math.min(100, x.L + e.niveles)); });
    const ef1 = efectosActivos([{ nombre, desc, veces: 1 }]);
    for (const x of S.eq) {
      if (!x.m) continue;
      for (const [c, v] of Object.entries(ef1.stats)) if (x.m[c] != null) x.m[c] += v - 1;
      for (const t of x.tipos) if (ef1.porTipo[t]) for (const [c, v] of Object.entries(ef1.porTipo[t])) if (x.m[c] != null) x.m[c] += v - 1;
      recalc(x);
    }
    const d = S.ef;
    for (const [c, v] of Object.entries(ef1.stats)) d.stats[c] = (d.stats[c] || 1) + (v - 1);
    for (const [t, s] of Object.entries(ef1.porTipo)) { d.porTipo[t] = d.porTipo[t] || {}; for (const [c, v] of Object.entries(s)) d.porTipo[t][c] = (d.porTipo[t][c] || 1) + (v - 1); }
    d.curaVictoria += ef1.curaVictoria; d.aguante = d.aguante || ef1.aguante; d.descansoX *= ef1.descansoX; d.esquirlas += ef1.esquirlas; d.reclutaNiv += ef1.reclutaNiv; d.reclutaLlenos = d.reclutaLlenos || ef1.reclutaLlenos;
  }
  const esqPuerta = c => { const p = kb.puertas[c]; return p && p.esq && p.esq.n ? p.esq.s / p.esq.n : { combate: 5, elite: 9, guardian: 14, tesoro: 10, descanso: 2, misterio: 2, oculta: 5 }[c] || 3; };
  function saleDe(clase, rng) {
    const p = kb.puertas[clase]; const s = p && p.sale ? Object.entries(p.sale) : [];
    if (!s.length) return clase === 'tesoro' ? 'cofre' : clase === 'misterio' || clase === 'oculta' ? 'cofre' : null;
    return elige(s.map(([k, w]) => ({ k, w })), rng).k;
  }
  // Juega una puerta del piso actual. Cambia S. Devuelve 'gana' | 'pierde' | 'nada'
  function jugarPuerta(S, clase, rng) {
    const r = biomaDePiso(S.piso).reglas;
    let res = 'nada';
    const pelea = puerta => {
      const riv = rivalesDe(S.piso, puerta, rng);
      const gana = combate(S.eq, riv, r, rng, S.ef);
      if (gana) {
        S.eq.forEach(x => { if (x.vida > 0) subirNivel(S, x, puerta); });
        const cura = S.ef.curaVictoria + S.mej.curaVictoria;
        if (cura) curar(S, cura, 0);
        if (puerta === 'combate' && riv.length && rng() < 0.9) reclutarSim(S, { num: riv[0].num, nombre: riv[0].nombre, tipos: riv[0].tipos, movs: {} }, riv[0].L);
        if (puerta === 'guardian') darBendicion(S, rng);
      }
      return gana ? 'gana' : 'pierde';
    };
    const sale = ['misterio', 'tesoro', 'oculta'].includes(clase) || /^p-/.test(clase) ? saleDe(clase, rng) : null;
    const efecto = sale || clase;
    if (efecto === 'combate' || efecto === 'elite' || efecto === 'guardian') res = pelea(efecto);
    else if (efecto === 'descanso' || efecto === 'hoguera') { const x = 0.4 * S.ef.descansoX * (1 + S.mej.descansoMas); curar(S, x, 0.25 * S.ef.descansoX * (1 + S.mej.descansoMas)); }
    else if (efecto === 'manantial') curar(S, 0.3, 0.3);
    else if (efecto === 'herido') { const p = poolBioma(biomaDePiso(S.piso).id); const c = elige(p, rng).e; reclutarSim(S, c, nivelRival(S.piso, 'combate')); }
    else if (efecto === 'cofre+') darBendicion(S, rng);
    else if (efecto === 'altar') { S.eq.forEach(x => { if (x.vida > 0) x.vida = Math.max(0.01, x.vida - 0.25); }); darBendicion(S, rng); }
    if (res === 'pierde') {
      if (!S.eq.some(x => x.vida > 0)) {
        if (S.pluma) { S.pluma = false; S.eq.forEach(x => { x.vida = S.mej.pluma || 0.6; }); }
        else { S.vivo = false; return res; }
      }
      return res;                                   // la puerta sigue ahí: se vuelve a elegir en el mismo piso
    }
    S.esq += esqPuerta(clase) * multEsquirlas(S.ef, S.mej);
    if (r.desgaste) S.eq.forEach(x => { if (x.vida > 0 && !x.tipos.includes(r.desgaste.salvo)) x.vida = Math.max(0.01, x.vida - r.desgaste.p); });
    S.piso++;
    sangrePiso(S);
    return res;
  }
  // Puertas que salen en un piso (lo visto: frecuencia de cada clase); cada 5º piso, el guardián
  function puertasDe(piso, rng) {
    if (piso % 5 === 0) return ['guardian'];
    if (biomaDePiso(piso).reglas.niebla) return ['oculta', 'oculta', 'oculta'];
    const cat = Object.entries(kb.puertas).filter(([c]) => !['guardian', 'oculta'].includes(c)).map(([k, p]) => ({ k, w: Math.max(1, p.vista || 1) }));
    const out = [];
    for (let i = 0; i < 12 && out.length < 3; i++) { const c = elige(cat, rng).k; if (!out.includes(c)) out.push(c); }
    return out;
  }
  // Política rápida (la que se usa dentro de las simulaciones)
  function politicaRapida(S, ops, rng) {
    if (ops.length === 1) return ops[0];
    const v = vidaMedia(S), hueco = S.eq.length < S.plazas;
    const fuerte = S.eq.filter(x => x.vida > 0).length >= Math.min(3, S.eq.length) && v > 0.7;
    const orden = [];
    if (v < 0.5 && ops.includes('descanso')) orden.push('descanso');
    if (hueco && ops.includes('combate') && v > 0.45) orden.push('combate');
    // Élite siempre que el equipo esté entero y con vida: +3 niveles (al 100 antes) y casi el doble de esquirlas
    if (fuerte && ops.includes('elite')) orden.push('elite');
    if (conf.prioridad !== 'pisos' && ops.includes('tesoro')) orden.push('tesoro');
    orden.push('tesoro', 'combate', 'misterio', 'descanso', 'elite', 'oculta');
    return orden.find(c => ops.includes(c)) || ops[Math.floor(rng() * ops.length)];
  }
  // Juega hasta `pisos` pisos con la política rápida; devuelve lo avanzado
  function rodar(S, pisos, rng) {
    const p0 = S.piso;
    for (let n = 0; n < pisos * 3 && S.vivo && S.piso < p0 + pisos; n++) jugarPuerta(S, politicaRapida(S, puertasDe(S.piso, rng), rng), rng);
    return S;
  }
  // Esquirlas que se sacan de media por piso con estas bendiciones y mejoras
  const esqPorPiso = S => (0.45 * esqPuerta('elite') + 0.3 * esqPuerta('combate') + 0.25 * esqPuerta('tesoro')) * multEsquirlas(S.ef, S.mej);
  const nivelMedio = S => S.eq.length ? media(S.eq.map(x => x.L)) : 0;
  // Nota de una partida simulada = piso final esperado (si sigue viva al acabar, lo que marque el techo de la opción)
  // + las esquirlas (las ganadas y las que quedan hasta ese piso) en «pisos» según la prioridad + un poco por niveles
  function puntuar(S0, S, techoOp) {
    const fin = S.vivo ? Math.max(S.piso, techoOp || S.piso) : S.piso;
    const esq = (S.esq - S0.esq) + (S.vivo ? Math.max(0, fin - S.piso) * esqPorPiso(S) : 0);
    return fin + pesoEsq(S0.piso) * esq / Math.max(1, esqPorPiso(S0)) + 0.12 * (nivelMedio(S) - nivelMedio(S0)) + (S.vivo ? 0.5 * vidaMedia(S) : 0);
  }

  /* ══════════ 5b · TECHO: hasta qué piso aguanta este equipo a la larga ══════════
   * Se juega cada bloque de 5 pisos (un bioma) por delante — combate, élite, combate, descanso y guardián — con el equipo
   * entero al empezar el bloque, en el nivel al que habrá llegado (unos 2 por piso hasta el 100), con lo que Sangre de la
   * veta le habrá sumado y con los rivales de ese piso (más nivel y más «hinchados» cada piso). Techo = piso de salida +
   * 5 × Σ probabilidad de haber pasado todos los bloques hasta ahí. Así cuenta lo que dura TODA la partida: las
   * bendiciones que suman para siempre, curar al ganar, y que el equipo sirva en todos los biomas.
   * ═══════════════════════════════════════════════════════════════════════════════════════════════════════════ */
  const ritmoNivel = () => 0.5 * subePuerta('elite') + 0.3 * subePuerta('combate') + 0.2 * 0.6;
  function proyectar(S0, p) {
    const dp = Math.max(0, p - S0.piso), ritmo = ritmoNivel(), D = S0.mej.sangreDesde || 46;
    const dm = pendMio(S0.mej) * (Math.max(0, p - D) - Math.max(0, S0.piso - D));
    return S0.eq.map(x => {
      const y = { ...x, raw: x.raw && { ...x.raw }, m: x.m && { ...x.m }, vida: 1 };
      if (y.m && dm) { for (const c of CS) y.m[c] += dm; recalc(y); }
      const L = Math.min(100, Math.round(x.L + ritmo * dp));
      if (L > x.L) ponNivel(y, L);
      return y;
    });
  }
  const PLAN_BLOQUE = ['combate', 'elite', 'combate', 'descanso', 'guardian'];
  // Un bloque con daño medio (sin dados en los golpes; los dados solo eligen qué rivales salen). Devuelve hasta dónde
  // llega: 5 si lo pasa entero; si no, el piso del bloque en que cae + lo que tumbó de ese combate.
  function bloque(S0, p0, rng) {
    const eq = proyectar(S0, p0), T = { eq }, out = {};
    const cura = S0.ef.curaVictoria + S0.mej.curaVictoria, dx = S0.ef.descansoX * (1 + S0.mej.descansoMas);
    for (let f = 0; f < 5; f++) {
      const piso = p0 + f, r = biomaDePiso(piso).reglas, c = PLAN_BLOQUE[f];
      if (c === 'descanso') curar(T, 0.4 * dx, 0.25 * dx);
      else {
        if (!combate(eq, rivalesDe(piso, c, rng), r, null, S0.ef, out)) return f + out.prog;
        if (cura) curar(T, cura, 0);
      }
      if (r.desgaste) eq.forEach(x => { if (x.vida > 0 && !x.tipos.includes(r.desgaste.salvo)) x.vida = Math.max(0.01, x.vida - r.desgaste.p); });
    }
    return 5;
  }
  // R «vidas»: cada una baja bloque a bloque (rivales sorteados con dados fijos, los mismos para todas las opciones: la
  // comparación es justa y sin ruido) hasta el primero que no pasa. Techo = media de dónde cae cada una.
  function techo(S0, { R = 12, tope = 600 } = {}) {
    if (!S0.eq.length) return { piso: S0.piso, exacto: S0.piso, curva: [] };
    const k0 = Math.floor((S0.piso - 1) / 5) + 1;
    const llega = [], pasa = [];
    let suma = 0;
    for (let r = 0; r < R; r++) {
      let fin = tope;
      for (let k = k0; 5 * k + 1 < tope; k++) {
        const p = 5 * k + 1, i = k - k0, a = bloque(S0, p, rngDe(7777 + k * 131 + r * 7919));
        llega[i] = (llega[i] || 0) + 1;
        if (a >= 5) { pasa[i] = (pasa[i] || 0) + 1; continue; }
        fin = p + a; break;
      }
      suma += fin;
    }
    const exacto = suma / R;
    return { piso: Math.round(exacto), exacto, curva: llega.map((n, i) => [5 * (k0 + i) + 1, (pasa[i] || 0) / n]) };
  }


  /* ══════════ 6 · IA: valorar cada opción a corto y a largo plazo ══════════
   * Para cada opción: se aplica al estado de verdad (tu equipo con su vida, tus bendiciones, el piso) y
   *  · a corto: se juegan R partidas de H pisos con dados (¿sobrevives a lo que viene con la vida que tienes?);
   *  · a largo: su TECHO (hasta qué piso aguanta ese equipo con esas bendiciones, bioma a bioma, cuando todos estén al
   *    100 y los rivales sigan hinchándose).
   * Nota = piso final esperado (si la partida sigue viva, el techo) + esquirlas en «pisos» según la prioridad.
   * Todas las opciones usan los MISMOS dados (así la comparación es justa aunque R sea pequeño).
   * ═══════════════════════════════════════════════════════════════════════════════════════════════════════════ */
  // R partidas por opción, cada una hasta caer o H pisos; T dados por bloque en el techo
  const ESFUERZO = { rapido: { R: 24, H: 20, T: 6 }, normal: { R: 48, H: 30, T: 10 }, alto: { R: 100, H: 45, T: 16 } };
  // El estado de verdad, leído de la pantalla
  function estadoActual(P) {
    const cab = (P && P.cab) || ultimaCab;
    const eqL = equipoLeido();
    const bend = bendicionesActivas().length ? bendicionesActivas() : ultimasBendiciones;
    const ef = efectosActivos(bend), mej = efectosMejoras();
    const eq = (eqL ? eqL.miembros : []).map(m => {
      const e = especie(m.nombre, m.num, m.tipos);
      const x = luchadorDe(e, m.L || 50, true, ef, { hpMax: m.hpMax, piso: cab ? cab.piso : 1, mej });
      x.vida = m.hpMax ? m.hp / m.hpMax : 1; x.id = m.id;
      return x;
    });
    return { piso: cab ? cab.piso : 1, eq, ef, bend: bend.map(b => b.nombre), mej, pluma: cab ? cab.pluma : true, esq: cab && cab.esquirlas || 0, vivo: true, plazas: eqL ? eqL.plazas : 4 + mej.plazas };
  }
  // o.azar: la opción depende de dados (volver a tirar): su techo es la media de varias tiradas
  async function valorar(S0, opciones, aplicar, { R, H, T } = ESFUERZO[conf.esfuerzo] || ESFUERZO.normal, { conTecho = true } = {}) {
    const res = opciones.map(o => ({ o, suma: 0, vivos: 0, n: 0, techo: null }));
    const t0 = techo(S0, { R: T });
    for (const x of res) {
      if (!conTecho) { x.techo = t0.exacto; continue; }
      const tiradas = x.o.azar ? 5 : 1; let s = 0;
      for (let i = 0; i < tiradas; i++) { const S = clonar(S0); aplicar(S, x.o, rngDe(99 + i * 17)); s += techo(S, { R: T }).exacto; }
      x.techo = s / tiradas;
      await sleep(0);
    }
    const semilla = 1000 + S0.piso * 7919;
    for (let r = 0; r < R; r++) {
      for (const x of res) {
        const rng = rngDe(semilla + r * 104729);
        const S = clonar(S0);
        S.techo = x.techo;
        aplicar(S, x.o, rng);
        if (S.vivo) rodar(S, H, rng);
        x.suma += puntuar(S0, S, x.techo); x.vivos += S.vivo ? 1 : 0; x.n++;
      }
      if (r % 8 === 7) await sleep(0);
    }
    return res.map(x => ({ o: x.o, v: x.suma / x.n, vivo: x.vivos / x.n, techo: x.techo, dTecho: x.techo - t0.exacto })).sort((a, b) => b.v - a.v);
  }
  const explica = (lista, nombre) => lista.map(x => `${nombre(x.o)}: ${x.v.toFixed(1)} (techo piso ${Math.round(x.techo)}${Math.abs(x.dTecho) >= 0.5 ? ` ${x.dTecho > 0 ? '+' : ''}${Math.round(x.dTecho)}` : ''} · vivo en ${ESFUERZO[conf.esfuerzo] ? ESFUERZO[conf.esfuerzo].H : 30} pisos ${pct(x.vivo)})`).join(' · ');

  async function decidirPrestado(P) {
    const S0 = estadoActual(P);
    const ops = P.opciones.map(o => ({ ...o, e: especie(o.nombre, o.num, o.tipos) }));
    const lista = await valorar(S0, ops, (S, o) => { const x = luchadorDe(o.e, o.L, true, S.ef, { hpMax: o.hpMax, piso: S.piso, mej: S.mej }); S.eq = [x]; });
    return { mejor: lista[0].o, lista, texto: explica(lista, o => o.nombre), porque: `con él se baja más: ${lista[0].v.toFixed(1)} pisos de media frente a ${lista.slice(1).map(x => x.v.toFixed(1)).join(' y ')}` };
  }
  // Volver a tirar: una vez por piso como mucho (el juego lo permite una vez por bioma y quita el botón; por si acaso)
  let rerollEn = null;
  async function decidirBendicion(P) {
    const S0 = estadoActual(P);
    const ops = P.opciones.map(o => ({ ...o }));
    if (P.reroll && rerollEn !== (P.cab && P.cab.piso)) ops.push({ nombre: '🎲 Volver a tirar', reroll: true, azar: true });
    const lista = await valorar(S0, ops, (S, o, rng) => { if (o.reroll) darBendicion(S, rng); else aplicarBendicion(S, o.nombre, o.desc); });
    for (const o of ops) if (!o.reroll) { const b = kb.bendiciones[o.nombre]; if (b && !efectoDe(o.desc)) b.noEntendida = true; }
    // volver a tirar solo si rinde claramente más (se pierde lo que hay y solo se puede una vez por bioma)
    if (lista[0].o.reroll && lista.length > 1 && lista[0].v - lista[1].v < 0.3) [lista[0], lista[1]] = [lista[1], lista[0]];
    const mejor = lista[0].o;
    const dif = lista.length > 1 ? Math.abs(lista[0].v - lista[1].v) : 0;
    const l0 = lista[0];
    return { mejor, tirar: !!mejor.reroll, lista, texto: explica(lista, o => o.nombre), porque: mejor.reroll ? `las tres que hay rinden menos que tirar otra vez (+${dif.toFixed(1)})` : `es la que más rinde para toda la partida (techo piso ${Math.round(l0.techo)}${l0.dTecho >= 0.5 ? `, +${Math.round(l0.dTecho)} pisos` : ''}; +${dif.toFixed(1)} sobre la siguiente)` };
  }
  async function decidirPuerta(P) {
    const S0 = estadoActual(P);
    const ops = P.opciones.map(o => ({ ...o }));
    if (ops.length === 1) return { mejor: ops[0], lista: [{ o: ops[0], v: 0, vivo: 1 }], texto: ops[0].nombre, porque: 'es la única' };
    // una puerta no cambia el techo (lo que cambia es el riesgo de ahora, las esquirlas y los niveles): se calcula una vez
    const lista = await valorar(S0, ops, (S, o, rng) => jugarPuerta(S, o.clase, rng), undefined, { conTecho: false });
    return { mejor: lista[0].o, lista, texto: explica(lista, o => o.nombre), porque: `con ella se baja más (${lista[0].v.toFixed(1)} pisos de media; la siguiente, ${lista[1].v.toFixed(1)})` };
  }
  // Reclutar: quedárselo (y a quién dejar si no cabe) o dejarlo
  async function decidirRecluta(P) {
    const S0 = estadoActual(P);
    const e = especie(P.cand.nombre, P.cand.num, P.cand.tipos);
    const nuevo = S => { const x = luchadorDe(e, P.cand.L, true, S.ef, { hpMax: P.cand.hpMax, piso: S.piso, mej: S.mej }); x.vida = P.cand.hpMax ? P.cand.hp / P.cand.hpMax : 0.6; return x; };
    const ops = [{ nombre: 'Dejarlo', dejar: true }];
    if (S0.eq.length < S0.plazas) ops.push({ nombre: 'Reclutarlo', meter: true });
    else S0.eq.forEach((m, k) => ops.push({ nombre: `Reclutarlo y dejar a ${m.nombre}`, cambia: k, quien: m.nombre }));
    const lista = await valorar(S0, ops, (S, o) => { if (o.meter) S.eq.push(nuevo(S)); else if (o.cambia != null) S.eq[o.cambia] = nuevo(S); });
    // Solo buenos Pokémon: cambiar a uno del equipo tiene que rendir claramente más (no por azar) y sin bajar el techo
    // (que sirva en los biomas que vienen), salvo que a corto plazo salve la partida
    const dej = lista.find(x => x.o.dejar);
    const vale = x => x.o.dejar || (x.v - dej.v >= (x.o.cambia != null ? 0.4 : 0.2) && (x.dTecho >= -0.5 || x.v - dej.v >= 1.5));
    const i0 = lista.findIndex(vale);
    if (i0 > 0) lista.unshift(lista.splice(i0, 1)[0]);
    const mejor = lista[0].o;
    const sin = dej.v;
    const l0 = lista[0];
    return { mejor, lista, texto: explica(lista, o => o.nombre), porque: mejor.dejar ? 'no mejora a tu equipo a la larga (con él no se llega más hondo en los biomas que vienen)' : `con él se llega más hondo (techo piso ${Math.round(l0.techo)}${l0.dTecho >= 0.5 ? `, +${Math.round(l0.dTecho)}` : ''}; nota ${l0.v.toFixed(1)} frente a ${sin != null ? sin.toFixed(1) : '?'} sin él)` };
  }
  // Orden del equipo (los tres primeros que sigan en pie pelean): el que más gana contra lo de los próximos pisos
  let memoOrden = { clave: '', r: null };
  function ordenRecomendado(P) {
    const S0 = estadoActual(P);
    const clave = S0.piso + '|' + S0.eq.map(x => x.id + ':' + x.L + ':' + x.vida.toFixed(2)).join(',') + '|' + S0.bend.join(',') + '|' + kb.niveles.length;
    if (memoOrden.clave === clave) return memoOrden.r;
    memoOrden = { clave, r: ordenRecomendado0(S0) };
    return memoOrden.r;
  }
  function ordenRecomendado0(S0) {
    const vivos = S0.eq;
    if (vivos.length < 2) return null;
    const perms = [];
    const rec = (pref, resto) => { if (!resto.length) { perms.push(pref); return; } resto.forEach((x, i) => rec([...pref, x], resto.filter((_, j) => j !== i))); };
    rec([], vivos.map((_, i) => i));
    const grupos = [];
    for (let g = 0; g < 24; g++) { const rng = rngDe(77 + g * 31 + S0.piso); const p = S0.piso + (g % 3); grupos.push({ riv: rivalesDe(p, g % 4 === 3 ? 'elite' : 'combate', rng), r: biomaDePiso(p).reglas, rng: rngDe(5 + g) }); }
    const guard = Math.ceil(S0.piso / 5) * 5; for (let g = 0; g < 8; g++) { const rng = rngDe(991 + g * 13); grupos.push({ riv: rivalesDe(guard, 'guardian', rng), r: biomaDePiso(guard).reglas, rng: rngDe(9 + g) }); }
    let mejor = null, actual = null;
    for (const p of perms) {
      let v = 0;
      for (const g of grupos) { const eq = p.map(i => ({ ...vivos[i] })); const gana = combate(eq, g.riv, g.r, null, S0.ef); v += (gana ? 1 : 0) + media(eq.map(x => Math.max(0, x.vida))) * 0.3; }
      v /= grupos.length;
      const r = { orden: p.map(i => vivos[i]), v };
      if (p.every((i, k) => i === k)) actual = r;
      if (!mejor || v > mejor.v + 1e-9) mejor = r;
    }
    return { orden: mejor.orden, v: mejor.v, actual: actual.v, cambia: mejor.v > actual.v + 0.02 };
  }
  // Hasta dónde llega este equipo (el techo, con más dados) y qué biomas le cuestan
  async function prediccion(P) {
    const S0 = estadoActual(P);
    if (!S0.eq.length) return null;
    await sleep(0);
    const t = techo(S0, { R: 16 });
    const flojos = t.curva.filter(([, p]) => p < 0.75).slice(0, 3).map(([p, x]) => ({ piso: p, bioma: biomaDePiso(p), p: x }));
    return { media: t.piso, curva: t.curva, flojos };
  }
  async function decidir(P) {
    try {
      if (P.tipo === 'prestado') return await decidirPrestado(P);
      if (P.tipo === 'bendicion') return await decidirBendicion(P);
      if (P.tipo === 'puerta') return await decidirPuerta(P);
      if (P.tipo === 'reclutar' || P.tipo === 'sustituir') return await decidirRecluta(P);
    } catch (e) { console.warn('[axe] decidir', e); }
    return null;
  }

  /* ══════════ 7 · MEJORAS DEL CAMPAMENTO: cuánto rinde cada esquirla ══════════
   * Se simulan bajadas enteras (desde el piso de salida, con un prestado de los vistos) con las mejoras de ahora y con
   * un nivel más de cada una. Lo que sube la media de esquirlas por bajada ÷ lo que cuesta = rendimiento. */
  function bajadaEntera(mejExtra, rng) {
    const mej = efectosMejoras(mejExtra);             // con un nivel más de Temple o de Sangre, luchadorDe ya lo cuenta
    const prestados = (kb.prestados && kb.prestados.length ? kb.prestados : [{ nombre: 'Nidoqueen', num: 31, L: 21 }, { nombre: 'Arcanine', num: 59, L: 21 }, { nombre: 'Chansey', num: 113, L: 21 }]);
    // «Buen ojo»: se ofrecen 3 prestados y se coge el mejor (como hace la IA)
    const ef = efectosActivos([]);
    const ofrecidos = Array.from({ length: 3 }, () => prestados[Math.floor(rng() * prestados.length)]);
    const x = ofrecidos.map(pr => luchadorDe(especie(pr.nombre, pr.num, pr.tipos), pr.L + (mej.prestadoNiv - efectosMejoras().prestadoNiv), true, ef, { mej })).sort((a, b) => potencia(b) - potencia(a))[0];
    const S = { piso: 1, eq: [x], ef, bend: [], mej, pluma: !!mej.pluma, esq: 0, vivo: true, plazas: 3 + mej.plazas };
    if (Object.values(kb.mejoras).some(m => m.nivel && /bendicion antes del primer piso/.test(norm(m.desc)))) darBendicion(S, rng);
    for (let n = 0; n < 1200 && S.vivo && S.piso < 400; n++) {
      jugarPuerta(S, politicaRapida(S, puertasDe(S.piso, rng), rng), rng);
      if (!S.foto && S.piso >= 41 && S.vivo) S.foto = clonar(S);           // cómo va el equipo al llegar a la zona honda
    }
    return S;
  }
  let informeMejoras = null;
  // Bajadas emparejadas (mismos dados con y sin la mejora) y su error: si la diferencia no supera 2 errores, «no se nota»
  async function calcularMejoras() {
    const N = 160;
    const fotos = [];
    const correr = async extra => { const out = []; for (let r = 0; r < N; r++) { const S = bajadaEntera(extra, rngDe(313 + r * 101)); out.push([S.esq, S.piso]); if (!extra && S.foto && fotos.length < 16) fotos.push(S.foto); if (r % 16 === 15) await sleep(0); } return out; };
    const b0 = await correr(null);
    // Techo: con los equipos que llegan al piso 41, cuánto más hondo aguantan con un nivel más de la mejora
    const M = modeloMio(), techoBase = fotos.map(F => techo(F, { R: 8 }).exacto);
    const dTechoDe = (n, e) => {
      if (!fotos.length || !e || !(e.todas || e.hincha || e.curaVictoria || e.descansoMas)) return null;
      const mej = efectosMejoras(n);
      return media(fotos.map((F, i) => { const S = clonar(F); S.mej = mej; if (e.todas) for (const x of S.eq) if (x.m) { for (const c of CS) x.m[c] += M.a; recalc(x); } return techo(S, { R: 8 }).exacto - techoBase[i]; }));
    };
    const base = { esq: media(b0.map(x => x[0])), piso: media(b0.map(x => x[1])) };
    const filas = [];
    for (const [n, m] of Object.entries(kb.mejoras)) {
      if (!m.coste || m.nivel >= m.max) continue;
      const e = efectoDe(m.desc);
      if (e && e.inicio) { filas.push({ n, m, opcional: true, rinde: -1 }); continue; }   // «puedes empezar en…»: se elige al bajar
      const con = await correr(n);
      const dE = con.map((x, i) => x[0] - b0[i][0]), dP = con.map((x, i) => x[1] - b0[i][1]);
      const dEsq = media(dE), dPiso = media(dP);
      const se = Math.sqrt(media(dE.map(x => (x - dEsq) ** 2)) / N);
      const claro = dEsq > 2.5 * se;        // una mejora no puede hacerte daño: si sale negativa, es azar
      filas.push({ n, m, dEsq, dPiso, se, claro, rinde: claro ? dEsq / m.coste : 0, paga: claro && dEsq > 0.5 ? m.coste / dEsq : null, entendida: !!e, dTecho: dTechoDe(n, e) });
      await sleep(0);
    }
    filas.sort((a, b) => b.rinde - a.rinde);
    const hondo = filas.filter(f => f.dTecho > 0.5).sort((a, b) => b.dTecho / b.m.coste - a.dTecho / a.m.coste)[0];
    informeMejoras = { base, filas, hondo: hondo && hondo.n, techo: techoBase.length ? media(techoBase) : null, t: Date.now() };
    pintar();
    return informeMejoras;
  }

  /* ══════════ GRABAR (cada pantalla: al diario y a la base) ══════════ */
  let firmaAnt = '', combateGrabado = '', enBajada = !!bajadaId, pendienteSustituir = null, ultimoEquipoL = {};
  function firmaDe(P) {
    if (!P) return '';
    const o = P.opciones ? P.opciones.map(x => x.nombre + (x.desc || '') + (x.L || '')).join(',') : '';
    return [P.tipo, P.cab && P.cab.piso, o, P.titulo || '', P.cand ? P.cand.nombre + P.cand.L : ''].join('|');
  }
  function empiezaBajada(P) {
    bajadaId = Date.now(); lsPut('axe-bajada', bajadaId); enBajada = true;
    kb.bajadas.push({ t: bajadaId, piso: null, esq: null, prestado: null, bend: [], equipo: [] });
    log('⛰️ Empieza una bajada nueva.');
  }
  const bajadaActual = () => kb.bajadas.find(b => b.t === bajadaId) || null;
  function terminaBajada(piso, esq, causa) {
    const b = bajadaActual();
    if (b) { b.piso = piso; b.esq = esq; b.fin = Date.now(); b.causa = causa; b.bend = ultimasBendiciones.map(x => x.nombre + (x.veces > 1 ? ' ×' + x.veces : '')); b.equipo = [...equipoNombres]; }
    log(`🏁 Bajada terminada en el piso ${piso} con ${esq} 💎${causa ? ' (' + causa + ')' : ''}.`);
    kAviso({ tipo: 'fin', app: 'Entrañas', icono: '⛰️', titulo: `Piso ${piso} · ${esq} 💎`, texto: 'Bajada terminada.' });
    bajadaId = null; lsPut('axe-bajada', null); enBajada = false;
    guardaKb();
  }
  function grabar(P) {
    if (!P) return;
    const cab = P.cab;
    if (cab) cerrarPuerta(cab, null);
    const b = bendicionesActivas(); if (b.length) ultimasBendiciones = b;
    const eqL = equipoLeido();
    if (eqL) {
      equipoNombres = new Set(eqL.miembros.map(m => m.nombre));
      // niveles que se suben por piso
      if (cab) for (const m of eqL.miembros) {
        const u = ultimoEquipoL[m.id];
        if (u && cab.piso === u.piso + 1 && m.L >= u.L && m.L - u.L <= 6 && u.L < 97) {
          if (m.L > u.L) { kb.subida.n++; kb.subida.s += m.L - u.L; if (kb.subida.n > 200) { kb.subida.s *= 200 / kb.subida.n; kb.subida.n = 200; } }
          // y según la puerta que se cruzó (Élite 3, Combate 2, Guardián 3,3… aprendido)
          const c = ultimaCerrada && ultimaCerrada.piso === u.piso ? ultimaCerrada.clase : null;
          if (c && (m.L > u.L || !['combate', 'elite', 'guardian'].includes(c))) { const q = kb.subidaPuerta[c] = kb.subidaPuerta[c] || { n: 0, s: 0 }; q.n++; q.s += m.L - u.L; if (q.n > 150) { q.s *= 150 / q.n; q.n = 150; } }
        }
        ultimoEquipoL[m.id] = { L: m.L, piso: cab.piso };
      }
    }
    if (P.tipo === 'combate') {
      const c = leerCombate();
      const f = c ? c.lineas.map(l => l.t || l.mov + l.dmg).join('|') : '';
      if (c && f !== combateGrabado) {
        combateGrabado = f;
        apunta({ tipo: 'combate', piso: cab && cab.piso, bioma: cab && cab.bioma.id, puerta: puertaPendiente && puertaPendiente.clase, combate: { titulo: c.titulo, tarjetas: c.tarjetas, lineas: c.lineas.map(l => { const { a, d, ...r } = l; return { ...r, a: a && `${a.nombre} Nv.${a.L}`, d: d && `${d.nombre} Nv.${d.L}` }; }) } });
        aprenderCombate(c, cab, puertaPendiente && puertaPendiente.clase);
        if (puertaPendiente && !puertaPendiente.resultado && ['misterio', 'tesoro', 'oculta'].includes(puertaPendiente.clase)) cerrarPuerta(null, 'combate');
      }
    }
    const firma = firmaDe(P);
    if (firma === firmaAnt) return;
    firmaAnt = firma;
    kb.vistas++;
    if (eqL) aprenderEquipo(eqL);
    // catálogo de todo lo que aparece
    if (P.tipo === 'prestado') {
      if (!enBajada) empiezaBajada(P);
      kb.prestados = kb.prestados || [];
      for (const o of P.opciones) { especie(o.nombre, o.num, o.tipos); if (!kb.prestados.some(x => x.nombre === o.nombre)) kb.prestados.push({ nombre: o.nombre, num: o.num, L: o.L, tipos: o.tipos }); }
    }
    if (P.tipo === 'bendicion') for (const o of P.opciones) {
      const x = kb.bendiciones[o.nombre] = kb.bendiciones[o.nombre] || { ico: o.ico, desc: o.desc, ofrecida: 0, elegida: 0, nueva: true };
      if (x.nueva === true) { x.nueva = Date.now(); log(`🆕 Bendición nueva: ${o.nombre} — ${o.desc}${efectoDe(o.desc) ? '' : ' (aún no sé medirla)'}.`); }
      x.ofrecida++; x.desc = o.desc || x.desc; x.ico = o.ico || x.ico;
    }
    if (P.tipo === 'puerta') for (const o of P.opciones) {
      const x = kb.puertas[o.clase] = kb.puertas[o.clase] || { nombre: o.nombre, ico: o.ico, desc: o.desc, vista: 0, elegida: 0, esq: { n: 0, s: 0 }, sale: {} };
      if (!x.desc && o.desc) x.desc = o.desc;
      if (/^p-/.test(o.clase) && !x.avisada) { x.avisada = true; log(`🆕 Puerta nueva: ${o.nombre} — ${o.desc}.`); }
      x.vista++;
    }
    if (P.tipo === 'reclutar' || P.tipo === 'sustituir') especie(P.cand.nombre, P.cand.num, P.cand.tipos);
    if (P.tipo === 'aviso') {
      const ev = kb.eventos[P.clase] = kb.eventos[P.clase] || { ico: P.ico, titulo: P.titulo, n: 0, ejemplos: [] };
      ev.n++; if (!ev.ejemplos.includes(P.cuerpo) && ev.ejemplos.length < 4) ev.ejemplos.push(P.cuerpo);
      if (/^e-/.test(P.clase) && ev.n === 1) log(`🆕 Suceso nuevo: ${P.titulo} — ${P.cuerpo}`);
      // lo que sale detrás de una puerta: cualquier suceso (también los nuevos) salvo los que no dependen de ella
      if (!['bioma', 'bendicion', 'objeto', 'recluta', 'deja', 'prestado', 'fin', 'pluma', 'derrota'].includes(P.clase)) cerrarPuerta(null, P.clase);
      if (P.clase === 'bioma') { const n = quitaIco(P.titulo).replace(/^bajas a /i, ''); const id = idBioma(n); if (kb.biomas[id] && P.cuerpo) kb.biomas[id].efecto = P.cuerpo; }
      if (P.clase === 'objeto') { const m = P.cuerpo.match(/^(.+?), a tu mochila/i); if (m) kb.objetos[m[1]] = (kb.objetos[m[1]] || 0) + 1; }
      if (P.clase === 'prestado' || P.clase === 'recluta') { const e = kb.especies[DEX_NOMBRE[norm(P.titulo.split(' ')[0])]]; if (e) e.reclutado = (e.reclutado || 0) + 1; }
      if (P.clase === 'fin') { const m = norm(P.titulo + ' ' + P.cuerpo).match(/piso (\d+).*?(\d+) esquirlas/); terminaBajada(m ? +m[1] : (ultimaCab && ultimaCab.piso), m ? +m[2] : (ultimaCab && ultimaCab.esquirlas), ultimaCab ? ultimaCab.bioma.nombre : ''); }
      if (P.clase === 'pluma') log('🪶 La Pluma de Fénix os levanta.');
      if (P.clase === 'prestado') { const b = bajadaActual(); if (b && !b.prestado) b.prestado = P.titulo.split(' ')[0]; }
    }
    if (P.tipo === 'lobby') {
      if (P.mejoras) for (const m of P.mejoras) {
        const x = kb.mejoras[m.nombre];
        if (!x) log(`🆕 Mejora nueva en el campamento: ${m.nombre} — ${m.desc}${efectoDe(m.desc) ? '' : ' (aún no sé medirla)'}.`);
        kb.mejoras[m.nombre] = { ...(x || {}), ico: m.ico, desc: m.desc, nivel: m.nivel, max: m.max, coste: m.alMax ? null : m.coste, visto: Date.now() };
      }
      if (enBajada) { const m = norm(texto(raiz())).match(/caiste en el piso (\d+) y subiste con (\d+) esquirlas/); if (m) terminaBajada(+m[1], +m[2], ''); }
    }
    if (P.tipo === 'desconocida' && raiz()) {
      const clave = 'd-' + norm(texto(raiz())).slice(0, 60);
      if (!kb.pantallasNuevas[clave]) { kb.pantallasNuevas[clave] = Date.now(); guardaHtml('desconocida'); }
    }
    apunta({ tipo: P.tipo, piso: cab && cab.piso, bioma: cab && cab.bioma.id, esq: cab && cab.esquirlas, opciones: P.opciones ? P.opciones.map(o => o.nombre + (o.desc ? ': ' + o.desc : '') + (o.L ? ` Nv.${o.L}` : '')) : undefined,
      aviso: P.tipo === 'aviso' ? { clase: P.clase, titulo: P.titulo, cuerpo: P.cuerpo } : undefined, cand: P.cand, equipo: eqL ? eqL.miembros.map(m => ({ nombre: m.nombre, L: m.L, hp: m.hp, hpMax: m.hpMax, tipos: m.tipos })) : undefined, bend: b.map(x => x.nombre + (x.veces > 1 ? '×' + x.veces : '')) });
    guardaHtml(P.tipo);
    guardaKb();
  }
  const htmlGuardado = {};
  function guardaHtml(tipo) {
    htmlGuardado[tipo] = (htmlGuardado[tipo] || 0) + 1;
    if (htmlGuardado[tipo] > 2) return;
    const m = raiz(); if (!m) return;
    const c = m.cloneNode(true); const yo = c.querySelector('#' + PANEL_ID); if (yo) yo.remove();
    DIARIO.html(tipo + '-' + htmlGuardado[tipo], c.outerHTML.slice(0, 80000) + $$('div.fixed.inset-0').filter(d => !ajeno(d)).map(d => d.outerHTML).join('').slice(0, 20000));
  }
  // Lo que se pulsa (tú o el piloto)
  let pilotoPulsa = false;
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('main button');
    if (!b || ajeno(b) || !enEntranas()) return;
    const P = pantalla();
    if (!P) return;
    const t = texto(b).slice(0, 90);
    if (P.tipo === 'puerta') { const o = P.opciones.find(x => x.b === b); if (o) aprenderPuerta(o.clase, o); }
    if (P.tipo === 'bendicion') { const o = P.opciones.find(x => x.b === b); if (o && kb.bendiciones[o.nombre]) kb.bendiciones[o.nombre].elegida++; }
    if (P.tipo === 'lobby' && b === P.boton && !enBajada) empiezaBajada(P);
    apunta({ tipo: 'pulsa', en: P.tipo, boton: t, piso: P.cab && P.cab.piso, auto: pilotoPulsa });
  }, true);

  /* ══════════ 8 · PILOTO ══════════ */
  let piloto = sessionStorage.getItem(SS_AUTO) === '1', pilotoEnMarcha = false, msg = '', arrastreFallos = 0;
  const VEL = { rapida: [250, 500], normal: [500, 900], tranquila: [1000, 1800] };
  const setPiloto = v => { piloto = v; try { sessionStorage.setItem(SS_AUTO, v ? '1' : '0'); } catch { /* nada */ } pintar(); if (v) bucle(); };
  const parar = (porque, tipo = 'aviso') => { setPiloto(false); msg = ''; if (porque) { log(porque); kAviso({ tipo, app: 'Entrañas', icono: '⛰️', titulo: 'Piloto parado', texto: porque }); } };
  async function pulsar(b, que) {
    if (!b || !b.isConnected || b.disabled || /retirarse/i.test(texto(b))) return false;
    await pausa(...(VEL[conf.velocidad] || VEL.normal));
    if (!piloto || !b.isConnected) return false;
    msg = que; pintar();
    pilotoPulsa = true; try { b.click(); } finally { pilotoPulsa = false; }
    const antes = firmaAnt;
    for (let i = 0; i < 40; i++) { await sleep(150); const P = pantalla(); grabar(P); if (firmaAnt !== antes || !b.isConnected) break; }
    return true;
  }
  // Mover a un Pokémon del equipo arrastrando desde su «⠿» (como con el dedo o el ratón). Se comprueba después.
  async function arrastrar(asa, destino) {
    const r0 = asa.getBoundingClientRect(), r1 = destino.getBoundingClientRect();
    const x = r0.left + r0.width / 2, y0 = r0.top + r0.height / 2, y1 = r1.top + r1.height / 2 + (r1.top > r0.top ? 6 : -6);
    const ev = (tipo, y, el = asa) => {
      const o = { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: tipo === 'pointerup' ? 0 : 1 };
      el.dispatchEvent(new PointerEvent(tipo, o));
      const mt = { pointerdown: 'mousedown', pointermove: 'mousemove', pointerup: 'mouseup' }[tipo];
      el.dispatchEvent(new MouseEvent(mt, o));
    };
    ev('pointerdown', y0);
    for (let k = 1; k <= 10; k++) { await sleep(25); const y = y0 + (y1 - y0) * k / 10; ev('pointermove', y, document); ev('pointermove', y, asa); }
    await sleep(40); ev('pointerup', y1, document); ev('pointerup', y1, asa);
    await sleep(500);
  }
  async function ponerOrden(orden) {
    for (let k = 0; k < orden.length; k++) {
      const eq = equipoLeido(); if (!eq || !eq.arrastre) return false;
      const ids = eq.miembros.map(m => m.id);
      const i = ids.indexOf(orden[k].id);
      if (i === k || i < 0) continue;
      const m = eq.miembros[i];
      if (!m.asa) return false;
      await arrastrar(m.asa, eq.miembros[k].li);
      const tras = equipoLeido();
      if (!tras || tras.miembros.map(x => x.id).indexOf(orden[k].id) !== k) return false;
    }
    return true;
  }
  let decision = { firma: '', R: null, calculando: false };
  async function decisionPara(P) {
    const f = firmaDe(P) + '|' + conf.prioridad + '|' + conf.esfuerzo;
    if (decision.firma === f && (decision.R || decision.calculando)) { while (decision.calculando) await sleep(100); return decision.R; }
    decision = { firma: f, R: null, calculando: true };
    pintar();
    try { decision.R = await decidir(P); } finally { decision.calculando = false; }
    if (decision.firma === f) pintar();
    return decision.R;
  }
  async function bucle() {
    if (pilotoEnMarcha) return;
    pilotoEnMarcha = true;
    let quieto = Date.now();
    try {
      while (piloto && enEntranas()) {
        const P = pantalla();
        grabar(P);
        let hecho = false;
        if (P.tipo === 'aviso' && P.boton) hecho = await pulsar(P.boton, `«${P.titulo}»: sigo`);
        else if (P.tipo === 'animacion') hecho = await pulsar(P.boton, 'Salto al resultado');
        else if (P.tipo === 'combate') hecho = await pulsar(P.boton, 'Combate: sigo');
        else if (P.tipo === 'lobby') {
          if (enBajada) { parar('🏁 Bajada terminada.', 'fin'); break; }
          if ((conf.empezarGratis && P.gratis) || (conf.usarPases && P.pases > 0)) { log(`⛰️ Empiezo (${P.gratis ? 'gratis' : 'con un pase'}).`); hecho = await pulsar(P.boton, 'Bajo'); }
          else { parar(P.gratis ? 'Para empezar, dale tú a «Bajar» (o activa «empezar solo»).' : 'Hoy bajar ya no es gratis: no gasto pases si no me lo dices.'); break; }
        } else if (['prestado', 'bendicion', 'puerta', 'reclutar', 'sustituir'].includes(P.tipo)) {
          if (P.tipo === 'sustituir' && pendienteSustituir) {
            const m = P.miembros.find(x => x.nombre === pendienteSustituir);
            pendienteSustituir = null;
            if (m) { log(`🔁 Dejo a ${m.nombre} por ${P.cand.nombre}.`); hecho = await pulsar(m.b, `Dejo a ${m.nombre}`); }
          }
          if (!hecho && P.tipo === 'puerta' && conf.reordenar && arrastreFallos < 2) {
            const o = ordenRecomendado(P);
            if (o && o.cambia) {
              msg = 'Ordenando el equipo…'; pintar();
              const ok = await ponerOrden(o.orden);
              apunta({ tipo: 'orden', ok, pedido: o.orden.map(x => x.nombre), piso: P.cab && P.cab.piso });
              if (ok) log(`🔀 Orden: ${o.orden.map(x => x.nombre).join(' → ')} (${pct(o.actual)} → ${pct(o.v)} contra lo que viene).`);
              else { arrastreFallos++; log('⚠ No he podido mover al equipo arrastrando: ponlo tú (te lo marco).'); }
              await sleep(300);
              continue;
            }
          }
          if (!hecho) {
            const P2 = pantalla(); if (firmaDe(P2) !== firmaDe(P)) continue;
            msg = 'Pensando…'; pintar();
            const R = await decisionPara(P);
            if (!piloto) break;
            const P3 = pantalla(); if (firmaDe(P3) !== firmaDe(P)) continue;
            if (!R) { parar('No he sabido decidir aquí: hazlo tú.'); break; }
            if (P.tipo === 'prestado') { log(`🤲 Prestado: ${R.mejor.nombre} — ${R.porque}.`); hecho = await pulsar(P3.opciones.find(o => o.nombre === R.mejor.nombre).b, `Elijo a ${R.mejor.nombre}`); }
            else if (P.tipo === 'bendicion') {
              if (R.tirar) { rerollEn = P.cab && P.cab.piso; decision.firma = ''; log(`🎲 Vuelvo a tirar — ${R.porque}.`); hecho = await pulsar(P3.reroll, 'Vuelvo a tirar'); }
              else { log(`✨ ${R.mejor.nombre} — ${R.porque}.`); hecho = await pulsar(P3.opciones.find(o => o.nombre === R.mejor.nombre).b, `Elijo ${R.mejor.nombre}`); }
            } else if (P.tipo === 'puerta') {
              const o = P3.opciones.find(x => x.nombre === R.mejor.nombre && x.clase === R.mejor.clase) || P3.opciones[P.opciones.indexOf(R.mejor)];
              log(`🚪 Piso ${P.cab ? P.cab.piso : '?'}: ${R.mejor.nombre} — ${R.porque}.`); hecho = await pulsar(o && o.b, `Puerta: ${R.mejor.nombre}`);
            } else {
              const m = R.mejor;
              if (m.dejar) { log(`🙅 Dejo a ${P.cand.nombre} — ${R.porque}.`); hecho = await pulsar(P.tipo === 'sustituir' ? P3.cancelar : P3.no, 'Lo dejo'); }
              else if (P.tipo === 'reclutar') { if (m.quien) pendienteSustituir = m.quien; log(`🤝 Recluto a ${P.cand.nombre}${m.quien ? ' (dejo a ' + m.quien + ')' : ''} — ${R.porque}.`); hecho = await pulsar(P3.si, 'Recluto'); }
              else { const x = P3.miembros.find(y => y.nombre === m.quien); log(`🔁 Dejo a ${m.quien} por ${P.cand.nombre} — ${R.porque}.`); hecho = await pulsar(x && x.b, `Dejo a ${m.quien}`); }
            }
          }
        }
        if (hecho) { quieto = Date.now(); continue; }
        if (Date.now() - quieto > 10000) { guardaHtml('desconocida'); parar('⏸ Pantalla que no conozco: hazla tú. La he guardado para aprenderla (Datos → Exportar).'); break; }
        await sleep(350);
      }
    } catch (e) { console.warn('[axe] piloto', e); parar('⚠ ' + (e && e.message)); }
    finally { pilotoEnMarcha = false; msg = ''; pintar(); }
  }

  /* ══════════ DATOS: exportar, importar, reaprender ══════════ */
  async function exportar() {
    const [diario, html] = await Promise.all([DIARIO.todo('diario'), DIARIO.todo('html')]);
    const datos = { script: 'Aurora Dex · Entrañas', version: VERSION, esquema: ESQUEMA, exportado: new Date().toISOString(), kb, conf, diario, html };
    const json = JSON.stringify(datos);
    try {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      a.download = `entranas-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      log(`📤 Exportado (${Math.round(json.length / 1024)} KB, ${diario.length} pasos del diario).`);
    } catch { navigator.clipboard.writeText(json).then(() => log('📋 Copiado al portapapeles.'), () => log('⚠ No he podido exportar.')); }
  }
  // Vuelve a aprender de un registro (el de la versión 0.1 o el diario de esta)
  function reaprender(pasos) {
    let n = 0;
    for (const x of pasos) {
      const bioma = x.bioma && kb.biomas[x.bioma] ? { id: x.bioma, ...kb.biomas[x.bioma], reglas: reglasBioma(kb.biomas[x.bioma].efecto) } : null;
      if (x.tipo === 'combate' && x.combate && bioma) {
        const conv = s => { if (!s || typeof s !== 'string') return s; const i = s.lastIndexOf(' Nv.'); return i > 0 ? { nombre: s.slice(0, i), L: +s.slice(i + 4) } : null; };
        const c = { ...x.combate, tarjetas: (x.combate.tarjetas || []).map(t => ({ ...t, L: t.L > 100 ? +String(t.L).slice(0, -1) : t.L, hpMax: t.hpMax || (t.ps ? +String(t.ps).split('/')[1] : null) })), lineas: x.combate.lineas.map(l => ({ ...l, a: conv(l.a), d: conv(l.d) })) };
        aprenderCombate(c, { piso: x.piso, bioma }, x.puerta); n++;
      }
      if (x.tipo === 'bendicion' && x.opciones) for (const o of x.opciones) { const i = o.indexOf(': '); const nom = o.startsWith('Afinidad') ? o.slice(0, o.indexOf(': ', 10)) : o.slice(0, i); const desc = o.slice(nom.length + 2); const b = kb.bendiciones[nom] = kb.bendiciones[nom] || { ico: '✨', desc, ofrecida: 0, elegida: 0 }; b.ofrecida++; }
    }
    guardaKb();
    return n;
  }
  function importar(archivo) {
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const d = JSON.parse(fr.result);
        if (d.kb && d.esquema === ESQUEMA) {
          if (!confirm(`¿Cambiar tu base por la del fichero? (${Object.keys(d.kb.especies).length} especies, ${d.kb.bajadas.length} bajadas)`)) return;
          kb = d.kb; guardaKb(); (d.diario || []).forEach(x => DIARIO.poner(x)); log(`📥 Base importada (${(d.diario || []).length} pasos al diario).`);
        } else if (d.registro) {
          const n = reaprender(d.registro); d.registro.forEach(x => DIARIO.poner({ ...x, importado: true }));
          log(`📥 Registro de la versión ${d.version || '0.1'} importado: ${n} combates aprendidos.`);
        } else log('⚠ Ese fichero no es de este script.');
        memoNivel.n = -1; decision.firma = ''; pintar();
      } catch (e) { log('⚠ No he podido leer el fichero: ' + e.message); }
    };
    fr.readAsText(archivo);
  }
  // De la versión 0.1: su registro pasa al diario (lo aprendido ya viene en la semilla)
  if (!kb.migrado) {
    const viejo = lsGet('axe-registro', null);
    if (viejo && viejo.length) { viejo.forEach(x => DIARIO.poner({ ...x, v01: true })); }
    kb.migrado = Date.now(); guardaKb();
  }

  /* ══════════ 9 · PANEL ══════════ */
  const CSS = `
    #${PANEL_ID}{background:#131A2B;border:2px solid #2E3B57;color:#C9D3E3;border-radius:22px;padding:12px;font-size:12px;line-height:1.4}
    #${PANEL_ID} b{color:#EEF3FA}
    #${PANEL_ID} .t{font-family:var(--font-display),system-ui,sans-serif;font-weight:800;font-size:15px;color:#EEF3FA}
    #${PANEL_ID} .s{font-size:10.5px;font-weight:700;color:#8391AB}
    #${PANEL_ID} .caja{background:#1B2438;border:1.5px solid #2E3B57;border-radius:16px;padding:8px 10px;margin-top:8px}
    #${PANEL_ID} .caja.oro{border-color:#E8C35A;box-shadow:0 0 12px rgba(232,195,90,.22)}
    #${PANEL_ID} .oro-t{color:#E8C35A;font-weight:800}
    #${PANEL_ID} .tabs{display:grid;grid-template-columns:repeat(5,1fr);gap:3px;margin-top:8px}
    #${PANEL_ID} .tabs button{padding:6px 2px;font-size:10.5px;border-radius:12px}
    #${PANEL_ID} .tabs button[aria-pressed="true"]{background:#24314B;color:#EEF3FA;box-shadow:inset 0 -3px 0 #7FD6E8}
    #${PANEL_ID} button{border-radius:14px;padding:8px 6px;font-weight:800;font-size:12px;border:1.5px solid #2E3B57;background:#1B2438;color:#C9D3E3;cursor:pointer}
    #${PANEL_ID} button.pri{background:linear-gradient(180deg,#F4F8FF 0%,#C9D3E3 55%,#8D9BB5 100%);color:#0C1120;border-bottom:4px solid #5A6884}
    #${PANEL_ID} button.on{background:#E8C35A;color:#0C1120;border-bottom:4px solid #9A7A2A}
    #${PANEL_ID} .fila{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
    #${PANEL_ID} .chips{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}
    #${PANEL_ID} .chip{display:inline-flex;align-items:center;gap:3px;border-radius:999px;padding:1px 7px 1px 2px;background:#24314B;font-size:10px;font-weight:800;color:#EEF3FA}
    #${PANEL_ID} .chip img{width:26px;height:26px;image-rendering:pixelated}
    #${PANEL_ID} .chip small{color:#8391AB;font-weight:700}
    #${PANEL_ID} table{width:100%;border-collapse:collapse;font-size:10.5px}
    #${PANEL_ID} td,#${PANEL_ID} th{padding:3px 4px;border-bottom:1px solid #24314B;text-align:left;vertical-align:top}
    #${PANEL_ID} th{color:#8391AB;font-weight:800}
    #${PANEL_ID} .num{text-align:right;font-variant-numeric:tabular-nums}
    #${PANEL_ID} .log{max-height:140px;overflow-y:auto;font-size:10.5px;font-weight:600;line-height:1.45}
    #${PANEL_ID} .log p{margin:0;padding:1px 0}
    #${PANEL_ID} .log:empty{display:none}
    #${PANEL_ID} label{display:flex;gap:6px;align-items:center;font-size:11px;font-weight:700;margin-top:4px}
    #${PANEL_ID} select{background:#24314B;color:#EEF3FA;border:1px solid #2E3B57;border-radius:8px;padding:2px 4px}
    #${PANEL_ID} .barra{height:6px;border-radius:99px;background:#24314B;overflow:hidden}
    #${PANEL_ID} .barra>span{display:block;height:100%;background:#7FD6E8}
    [data-axe-reco]{outline:3px solid #E8C35A!important;outline-offset:2px;position:relative}
    [data-axe-reco]::after{content:"⭐";position:absolute;right:-6px;top:-8px;font-size:15px;filter:drop-shadow(0 0 2px #000);pointer-events:none}
    [data-axe-orden]::before{content:attr(data-axe-orden);position:absolute;left:-6px;top:-6px;background:#E8C35A;color:#0C1120;border-radius:99px;font-size:10px;font-weight:900;padding:0 5px;z-index:2}
    li[data-axe-orden]{position:relative}`;
  const registroLog = lsGet('axe-log', []);
  function log(t) {
    const d = new Date(), h = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    registroLog.push(`${h}  ${t}`); while (registroLog.length > 80) registroLog.shift();
    lsPut('axe-log', registroLog);
    const box = document.querySelector(`#${PANEL_ID} .log`);
    if (box) { const p = document.createElement('p'); p.textContent = `${h}  ${t}`; box.appendChild(p); box.scrollTop = box.scrollHeight; }
  }
  const chip = (e, extra = '') => `<span class="chip" title="${kEsc((e.tipos || []).join(' / '))}">${e.num ? `<img src="/sprites/${e.num}.png" alt="">` : '❔'}${kEsc(e.nombre)}${extra ? ` <small>${extra}</small>` : ''}</span>`;
  let pestana = lsGet('axe-pestana', 'ahora'), ultimoP = null, pred = { clave: '', r: null, calc: false };
  function marcar(P, R) {
    for (const x of $$('[data-axe-reco]')) x.removeAttribute('data-axe-reco');
    for (const x of $$('[data-axe-orden]')) x.removeAttribute('data-axe-orden');
    if (!P) return;
    let b = null;
    if (R && R.mejor) {
      if (P.tipo === 'bendicion') b = R.tirar ? P.reroll : (P.opciones.find(o => o.nombre === R.mejor.nombre) || {}).b;
      else if (P.tipo === 'prestado') b = (P.opciones.find(o => o.nombre === R.mejor.nombre) || {}).b;
      else if (P.tipo === 'puerta') b = (P.opciones.find(o => o.nombre === R.mejor.nombre && o.clase === R.mejor.clase) || {}).b;
      else if (P.tipo === 'reclutar') b = R.mejor.dejar ? P.no : P.si;
      else if (P.tipo === 'sustituir') b = R.mejor.dejar ? P.cancelar : (P.miembros.find(m => m.nombre === R.mejor.quien) || {}).b;
    }
    if (P.tipo === 'lobby' && informeMejoras && informeMejoras.filas[0] && informeMejoras.filas[0].claro && informeMejoras.filas[0].dEsq > 0 && P.mejoras) { const m = P.mejoras.find(x => x.nombre === informeMejoras.filas[0].n); if (m && m.boton) b = m.boton; }
    if (b) b.setAttribute('data-axe-reco', '1');
    if (P.tipo === 'puerta' && conf.reordenar !== 'no') { const o = ordenRecomendado(P); if (o && o.cambia) o.orden.forEach((x, k) => { const eq = equipoLeido(); const m = eq && eq.miembros.find(y => y.id === x.id); if (m) m.li.setAttribute('data-axe-orden', String(k + 1)); }); }
  }
  function htmlAhora(P) {
    const cab = (P && P.cab) || ultimaCab;
    let h = '';
    if (cab && P && P.tipo !== 'lobby') {
      const L = listaBiomas(), i = Math.floor((cab.piso - 1) / 5);
      const sig = [1, 2].map(k => ({ b: L[(i + k) % L.length], p: (i + k) * 5 + 1 }));
      h += `<div class="caja"><p><b>${kEsc(cab.bioma.ico)} ${kEsc(cab.bioma.nombre)} · piso ${cab.piso}</b> <span class="s">vuelta ${cab.vuelta}${cab.esquirlas != null ? ` · 💎 ${cab.esquirlas}` : ''}${cab.pluma ? ' · 🪶' : ''}</span></p><p class="s">${kEsc(cab.bioma.efecto)}</p>
        <p class="s" style="margin-top:4px">Luego: ${sig.map(x => `${kEsc(x.b.ico)} ${kEsc(x.b.nombre)} (piso ${x.p})`).join(' · ')} · rivales ~Nv.${nivelRival(cab.piso + 1)} en el siguiente piso</p>
        ${pred.r ? `<p class="s" style="margin-top:4px">🏔️ Techo de este equipo: <b>piso ${Math.round(pred.r.media)}</b> (con todos al 100 y los rivales hinchándose)${pred.r.flojos.length ? ` · le cuesta: ${pred.r.flojos.map(f => `${kEsc(f.bioma.ico)} piso ${f.piso} (pasa ${pct(f.p)})`).join(', ')}` : ''}.</p>` : ''}</div>`;
    }
    const R = decision.R;
    if (decision.calculando) h += `<div class="caja oro"><p class="oro-t">🤔 Pensando… (jugando cada opción ${(ESFUERZO[conf.esfuerzo] || ESFUERZO.normal).R} veces hacia delante)</p></div>`;
    else if (R && P && ['prestado', 'bendicion', 'puerta', 'reclutar', 'sustituir'].includes(P.tipo)) {
      const nombre = R.mejor.nombre;
      h += `<div class="caja oro"><p class="oro-t">⭐ ${kEsc(R.tirar ? '🎲 Volver a tirar' : nombre)}</p><p class="s">Porque ${kEsc(R.porque)}.</p>
        <table style="margin-top:4px"><tr><th>Opción</th><th class="num">nota</th><th class="num">techo</th><th class="num">vivo</th></tr>${R.lista.map(x => `<tr><td>${kEsc(x.o.nombre)}</td><td class="num">${x.v.toFixed(1)}</td><td class="num">${x.techo != null ? Math.round(x.techo) + (Math.abs(x.dTecho) >= 0.5 ? ` <span class="s">(${x.dTecho > 0 ? '+' : ''}${Math.round(x.dTecho)})</span>` : '') : '—'}</td><td class="num">${pct(x.vivo)}</td></tr>`).join('')}</table>
        <p class="s" style="margin-top:3px">Nota = piso final esperado: se juega cada opción ${(ESFUERZO[conf.esfuerzo] || ESFUERZO.normal).R} veces ${(ESFUERZO[conf.esfuerzo] || ESFUERZO.normal).H} pisos (¿sobrevives a lo de ahora?) y, si sigues vivo, cuenta su techo (hasta dónde aguanta ese equipo con esas bendiciones, bioma a bioma)${conf.prioridad !== 'pisos' ? ' + las esquirlas que dan hasta ahí' : ''}. «Vivo» = sigues en pie tras esos pisos.</p></div>`;
    }
    if (P && P.tipo === 'puerta') { const o = ordenRecomendado(P); if (o && o.cambia) h += `<div class="caja"><p class="oro-t">🔀 Mejor orden: ${o.orden.map((x, k) => `${k + 1}. ${kEsc(x.nombre)}`).join(' · ')}</p><p class="s">Gana ${pct(o.v)} de los combates que vienen (ahora ${pct(o.actual)}). ${conf.reordenar && arrastreFallos < 2 ? 'El piloto lo pone solo.' : 'Arrástralos tú desde ⠿ (van numerados).'}</p></div>`; }
    if (P && P.tipo === 'lobby') {
      const b = kb.bajadas.filter(x => x.piso), mejor = b.length ? Math.max(...b.map(x => x.piso)) : null;
      h += `<div class="caja"><p><b>⛰️ ${P.gratis ? 'Hoy bajar es gratis' : P.pases ? `Tienes ${P.pases} pases` : 'Bajar no es gratis hoy'}</b></p><p class="s">${b.length} bajadas apuntadas${mejor ? ` · la mejor, piso ${mejor}` : ''}. Abre «💎 Mejoras» del juego y mira la pestaña Mejoras de este panel.</p></div>`;
    }
    if (P && P.tipo === 'desconocida') h += '<div class="caja"><p class="s">Esta pantalla aún no la conozco: la he guardado para aprenderla.</p></div>';
    return h + `<div class="fila" style="margin-top:8px"><button type="button" class="piloto ${piloto ? 'on' : 'pri'}" style="flex:2">${piloto ? '■ Parar' : '▶ Bajar solo'}</button><button type="button" class="pensar" style="flex:1">🧠 Recalcular</button></div>${msg ? `<p class="s" style="text-align:center;margin-top:4px">${kEsc(msg)}</p>` : ''}`;
  }
  function htmlSaber() {
    const esp = Object.values(kb.especies);
    let h = `<div class="caja"><p class="s">Llevo vistas <b>${esp.length}</b> especies, <b>${Object.keys(kb.movs).length}</b> movimientos, <b>${Object.keys(kb.bendiciones).length}</b> bendiciones, <b>${Object.keys(kb.puertas).length}</b> puertas, <b>${Object.keys(kb.eventos).length}</b> sucesos y <b>${Object.keys(kb.mejoras).length}</b> mejoras, en ${kb.vistas} pantallas.</p>
      <p class="s">Modelo: rivales ≈ Nv.${(memoNivel.a || 8).toFixed(1)} + ${(memoNivel.b || 2).toFixed(2)}·piso (tope 100) y desde ahí se hinchan (piso 50: ×${hinchaRival(50).toFixed(2)}, piso 60: ×${hinchaRival(60).toFixed(2)}, piso 75: ×${hinchaRival(75).toFixed(2)}) · tus mejoras +${Math.round((multMio(1) - 1) * 100)}% a todo${pendMio() ? ` y +${(pendMio() * 100).toFixed(1)}% más por piso desde el 46 (piso 100: +${Math.round((multMio(100) - 1) * 100)}%)` : ''} (se suma con bendiciones y bioma) · daño aprendido: tuyos ${kLado('mio-F').toFixed(2)}/${kLado('mio-E').toFixed(2)}, rivales ${kLado('riv-F').toFixed(2)}/${kLado('riv-E').toFixed(2)} (físico/especial) · subís ${subePuerta('elite').toFixed(1)} niveles por Élite, ${subePuerta('combate').toFixed(1)} por Combate y ${subePuerta('guardian').toFixed(1)} por Guardián.</p></div>`;
    h += '<div class="caja"><p><b>🗺️ Qué sale en cada bioma</b> <span class="s">(los mejores para reclutar, primero)</span></p>';
    for (const b of listaBiomas()) {
      const pool = esp.filter(e => e.biomas && e.biomas[b.id]).map(e => ({ e, v: potencia(luchadorDe(e, 60, true, null)) })).sort((x, y) => y.v - x.v);
      h += `<p style="margin-top:6px"><b>${kEsc(b.ico)} ${kEsc(b.nombre)}</b> <span class="s">${kEsc(b.efecto)}</span></p><div class="chips">${pool.length ? pool.map(x => chip(x.e, '×' + x.e.biomas[b.id])).join('') : '<span class="s">nada aún</span>'}</div>`;
    }
    h += '</div>';
    h += `<div class="caja"><p><b>✨ Bendiciones</b></p><table><tr><th></th><th>Qué hace</th><th class="num">sale</th><th class="num">cogida</th></tr>${Object.entries(kb.bendiciones).sort((a, b) => b[1].ofrecida - a[1].ofrecida).map(([n, b]) => `<tr><td>${kEsc(b.ico)} <b>${kEsc(n)}</b></td><td>${kEsc(b.desc)}${efectoDe(b.desc) ? '' : ' <span class="s">❓ no sé medirla</span>'}</td><td class="num">${b.ofrecida}</td><td class="num">${b.elegida}</td></tr>`).join('')}</table></div>`;
    h += `<div class="caja"><p><b>🚪 Puertas</b></p><table><tr><th></th><th class="num">vista</th><th class="num">💎 base</th><th>qué sale</th></tr>${Object.entries(kb.puertas).map(([c, p]) => `<tr><td>${kEsc(p.ico)} <b>${kEsc(p.nombre)}</b></td><td class="num">${p.vista}</td><td class="num">${esqPuerta(c).toFixed(1)}</td><td>${Object.entries(p.sale || {}).map(([k, n]) => `${kEsc(k)} ×${n}`).join(', ') || '<span class="s">—</span>'}</td></tr>`).join('')}</table><p class="s">💎 base: sin tus multiplicadores (ahora ×${multEsquirlas(efectosActivos(ultimasBendiciones), efectosMejoras()).toFixed(2)}).</p></div>`;
    h += `<div class="caja"><p><b>📜 Sucesos</b></p>${Object.entries(kb.eventos).map(([c, e]) => `<p class="s">${kEsc(e.ico)} <b>${kEsc(e.titulo)}</b> ×${e.n}: ${kEsc(e.ejemplos[0] || '')}</p>`).join('') || '<p class="s">nada aún</p>'}
      ${Object.keys(kb.objetos).length ? `<p class="s" style="margin-top:4px">🎒 Objetos que dejan los guardianes: ${Object.entries(kb.objetos).map(([n, c]) => `${kEsc(n)} ×${c}`).join(', ')}</p>` : ''}</div>`;
    const mv = Object.entries(kb.movs).sort((a, b) => b[1].n - a[1].n).slice(0, 40);
    h += `<details class="caja"><summary><b>⚔️ Movimientos vistos (${Object.keys(kb.movs).length})</b> <span class="s">el nombre es decorado: lo que cuenta es el tipo y si es físico o especial</span></summary><table><tr><th>Mov.</th><th>tipo</th><th class="num">usos</th></tr>${mv.map(([n, m]) => `<tr><td>${kEsc(n)}</td><td>${kEsc(m.tipo)} ${m.cat === 'F' ? '👊' : '✨'}</td><td class="num">${m.n}</td></tr>`).join('')}</table></details>`;
    return h;
  }
  function htmlMejoras() {
    const lista = Object.entries(kb.mejoras);
    let h = `<div class="caja"><p class="s">Para cada mejora que se puede comprar se simulan 160 bajadas enteras con ella y sin ella (con los mismos dados): cuántas esquirlas más te da por bajada y en cuántas bajadas se paga.</p>
      <div class="fila" style="margin-top:6px"><button type="button" class="calc-mej pri" style="flex:1">${informeMejoras ? '🔄 Volver a calcular' : '🧮 Calcular'}</button></div></div>`;
    if (informeMejoras) {
      const I = informeMejoras;
      h += `<div class="caja"><p class="s">Ahora, de media: <b>piso ${I.base.piso.toFixed(0)}</b> y <b>${I.base.esq.toFixed(0)} 💎</b> por bajada (simulado).</p><table><tr><th>Mejora</th><th class="num">coste</th><th class="num">+💎/bajada</th><th class="num">+pisos</th><th class="num">+techo</th><th class="num">se paga en</th></tr>
        ${I.filas.map((f, i) => f.opcional ? `<tr><td>${kEsc(f.m.ico)} ${kEsc(f.n)} <span class="s">${f.m.nivel}/${f.m.max}</span></td><td class="num">${f.m.coste}</td><td colspan="4" class="s">se elige al bajar: no la simulo</td></tr>`
          : `<tr${i === 0 && f.claro && f.dEsq > 0 ? ' style="color:#E8C35A"' : ''}><td>${i === 0 && f.claro && f.dEsq > 0 ? '⭐ ' : ''}${kEsc(f.m.ico)} ${kEsc(f.n)} <span class="s">${f.m.nivel}/${f.m.max}${f.entendida ? '' : ' ❓'}</span></td><td class="num">${f.m.coste}</td><td class="num">${f.claro ? (f.dEsq >= 0 ? '+' : '') + f.dEsq.toFixed(0) : '<span class="s">no se nota</span>'}</td><td class="num">${f.claro ? (f.dPiso >= 0 ? '+' : '') + f.dPiso.toFixed(1) : ''}</td><td class="num">${f.dTecho != null && f.dTecho >= 0.5 ? `${I.hondo === f.n ? '🏔️ ' : ''}+${f.dTecho.toFixed(0)}` : ''}</td><td class="num">${f.paga ? f.paga.toFixed(1) + ' b.' : '—'}</td></tr>`).join('')}</table>
        <p class="s">«No se nota» = en 160 bajadas simuladas la diferencia es menor que el azar. ❓ = no entiendo del todo su texto. «+techo» = cuántos pisos más aguanta a la larga un equipo que llega al 41${I.techo ? ` (ahora, de media, hasta el ${I.techo.toFixed(0)})` : ''}: para bajar MUY hondo es lo que manda. ${I.hondo ? `🏔️ La que más techo da por esquirla: <b>${kEsc(I.hondo)}</b>.` : ''} Sangre de la veta suma en cada piso desde el 46 (los rivales se hinchan un +4% por piso: con Sangre al máximo casi les sigues el ritmo).</p></div>`;
    }
    h += `<div class="caja"><p><b>🏕️ El campamento</b> <span class="s">(lo último que vi)</span></p><table>${lista.map(([n, m]) => `<tr><td>${kEsc(m.ico)} ${kEsc(n)}</td><td class="num">${m.nivel}/${m.max}</td><td>${kEsc(m.desc)}</td><td class="num">${m.coste ? '💎 ' + m.coste : '✓'}</td></tr>`).join('')}</table></div>`;
    return h;
  }
  function htmlHistorial() {
    const b = kb.bajadas.filter(x => x.piso).slice().reverse();
    if (!b.length) return '<div class="caja"><p class="s">Aún no hay bajadas terminadas.</p></div>';
    const pisos = b.map(x => x.piso), esq = b.map(x => x.esq || 0);
    return `<div class="caja"><p class="s">${b.length} bajadas · mejor piso <b>${Math.max(...pisos)}</b> · media <b>${media(pisos).toFixed(1)}</b> · <b>${media(esq).toFixed(0)} 💎</b> por bajada</p>
      <table style="margin-top:4px"><tr><th>Cuándo</th><th>Prestado</th><th class="num">piso</th><th class="num">💎</th><th>Dónde cayó</th></tr>${b.slice(0, 25).map(x => `<tr><td>${x.t ? new Date(x.t).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : '—'}</td><td>${kEsc(x.prestado || '')}</td><td class="num">${x.piso}</td><td class="num">${x.esq ?? '—'}</td><td>${kEsc(x.causa || '')}</td></tr>`).join('')}</table></div>`;
  }
  function htmlDatos() {
    const op = (k, v, t) => `<option value="${v}"${conf[k] === v ? ' selected' : ''}>${t}</option>`;
    return `<div class="caja"><p><b>⚙️ Cómo juega</b></p>
      <label>Prioridad <select data-c="prioridad">${op('prioridad', 'equilibrio', 'equilibrio (bajar mucho y Botín pronto)')}${op('prioridad', 'pisos', 'solo bajar')}${op('prioridad', 'esquirlas', 'más 💎')}</select></label>
      <label>Cuánto piensa <select data-c="esfuerzo">${op('esfuerzo', 'rapido', 'rápido')}${op('esfuerzo', 'normal', 'normal')}${op('esfuerzo', 'alto', 'a fondo')}</select></label>
      <label>Velocidad del piloto <select data-c="velocidad">${op('velocidad', 'rapida', 'rápida')}${op('velocidad', 'normal', 'normal')}${op('velocidad', 'tranquila', 'tranquila')}</select></label>
      <label><input type="checkbox" data-c="empezarGratis"${conf.empezarGratis ? ' checked' : ''}> empezar solo si bajar es gratis</label>
      <label><input type="checkbox" data-c="usarPases"${conf.usarPases ? ' checked' : ''}> gastar pases para empezar</label>
      <label><input type="checkbox" data-c="reordenar"${conf.reordenar ? ' checked' : ''}> ordenar el equipo solo (arrastrando)</label></div>
      <div class="caja"><p><b>💾 Datos</b></p><p class="s">Diario: <span class="n-diario">…</span> pasos. Todo se queda en este navegador; exporta para pasármelo o para llevarlo a otro.</p>
      <div class="fila" style="margin-top:6px"><button type="button" class="exp" style="flex:1">📤 Exportar</button><button type="button" class="imp" style="flex:1">📥 Importar</button><button type="button" class="cop" style="flex:1">📋 HTML</button></div>
      <div class="fila" style="margin-top:6px"><button type="button" class="reset" style="flex:1">🗑️ Borrar lo aprendido</button></div>
      <input type="file" class="archivo" accept=".json,application/json" hidden></div>
      <p class="s" style="margin-top:6px">Versión ${VERSION} · base v${ESQUEMA}</p>`;
  }
  const RENDER = { ahora: htmlAhora, saber: htmlSaber, mejoras: htmlMejoras, historial: htmlHistorial, datos: htmlDatos };
  function pintar(P = ultimoP) {
    ultimoP = P;
    const p = document.getElementById(PANEL_ID);
    if (!p) return;
    for (const b of $$('.tabs button', p)) b.setAttribute('aria-pressed', b.dataset.t === pestana ? 'true' : 'false');
    const cont = p.querySelector('.cont');
    const html = RENDER[pestana](P);
    if (cont.dataset.h !== html) { cont.innerHTML = html; cont.dataset.h = html; }
    const nd = p.querySelector('.n-diario'); if (nd) DIARIO.contar().then(n => { nd.textContent = n; });
    marcar(P, decision.R && decision.firma.startsWith(firmaDe(P)) ? decision.R : null);
  }
  function montar() {
    let p = document.getElementById(PANEL_ID);
    if (!enEntranas()) { if (p) p.remove(); marcar(null); return; }
    const m = raiz();
    if (!m) return;
    if (!p) {
      if (!document.getElementById('axe-css')) { const st = document.createElement('style'); st.id = 'axe-css'; st.textContent = CSS; document.head.appendChild(st); }
      p = document.createElement('section');
      p.id = PANEL_ID;
      p.setAttribute('data-ax-ignore', '1');
      p.innerHTML = `<div class="fila"><span style="font-size:22px">⛏️</span><div style="flex:1"><p class="t">Entrañas · IA</p><p class="s">Graba todo, aprende y juega cada opción hacia delante antes de decidir.</p></div></div>
        <div class="tabs">${[['ahora', '⭐ Ahora'], ['saber', '📚 Saber'], ['mejoras', '💎 Mejoras'], ['historial', '📜 Bajadas'], ['datos', '⚙️ Datos']].map(([k, t]) => `<button type="button" data-t="${k}">${t}</button>`).join('')}</div>
        <div class="cont"></div><details class="caja" open><summary class="s">Bitácora</summary><div class="log"></div></details>`;
      p.querySelector('.log').innerHTML = registroLog.map(t => `<p>${kEsc(t)}</p>`).join('');
      p.addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        e.preventDefault();
        if (b.dataset.t) { pestana = b.dataset.t; lsPut('axe-pestana', pestana); pintar(); return; }
        if (b.classList.contains('piloto')) { kPedirPermiso(); setPiloto(!piloto); }
        if (b.classList.contains('pensar')) { decision.firma = ''; pred.clave = ''; actualizar(); }
        if (b.classList.contains('calc-mej')) { b.textContent = '⏳ Simulando…'; calcularMejoras(); }
        if (b.classList.contains('exp')) exportar();
        if (b.classList.contains('imp')) p.querySelector('.archivo').click();
        if (b.classList.contains('cop')) { const c = raiz().cloneNode(true); const yo = c.querySelector('#' + PANEL_ID); if (yo) yo.remove(); navigator.clipboard.writeText(c.outerHTML + $$('div.fixed.inset-0').filter(d => !ajeno(d)).map(d => d.outerHTML).join('\n')).then(() => log('📋 HTML copiado.'), () => log('No pude copiar.')); }
        if (b.classList.contains('reset') && confirm('¿Borrar todo lo aprendido y el diario? (vuelve a lo que sabía al instalarlo)')) { kb = kbNueva(); guardaKb(); DIARIO.borrar(); informeMejoras = null; log('🗑️ Base reiniciada.'); pintar(); }
      });
      p.addEventListener('change', e => {
        const el = e.target;
        if (el.classList.contains('archivo') && el.files[0]) { importar(el.files[0]); el.value = ''; return; }
        if (el.dataset.c) { conf[el.dataset.c] = el.type === 'checkbox' ? el.checked : el.value; guardaConf(); decision.firma = ''; actualizar(); }
      });
      const box = p.querySelector('.log'); box.scrollTop = box.scrollHeight;
    }
    if (m.firstElementChild !== p) m.insertBefore(p, m.firstElementChild);
    actualizar();
  }
  // Lee la pantalla, la graba, y (si hay que decidir) piensa en segundo plano
  function actualizar() {
    const P = pantalla();
    grabar(P);
    pintar(P);
    if (P && ['prestado', 'bendicion', 'puerta', 'reclutar', 'sustituir'].includes(P.tipo) && !piloto) decisionPara(P).then(() => pintar());
    if (P && P.tipo === 'puerta') {
      const clave = P.cab.piso + '|' + equipoLeido().miembros.map(m => m.nombre + m.L).join(',') + '|' + bendicionesActivas().map(b => b.nombre + (b.veces || 1)).join(',');
      if (pred.clave !== clave && !pred.calc) { pred.clave = clave; pred.calc = true; prediccion(P).then(r => { pred.r = r; pred.calc = false; pintar(); }); }
    }
    if (P && P.tipo === 'lobby' && P.mejoras && (!informeMejoras || Date.now() - informeMejoras.t > 6 * 3600e3)) calcularMejoras();
    if (piloto) bucle();
  }
  let tMontar = null;
  new MutationObserver(ms => {
    if (ms.every(m => m.target.nodeType === 1 && m.target.closest && m.target.closest('[data-ax-ignore]'))) return;
    clearTimeout(tMontar); tMontar = setTimeout(montar, 250);
  }).observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(montar, 900);
  window.__axEntranas = { ponerOrden, equipoLeido, combate, luchadorDe, especie, hinchar, hinchaRival, efectosActivos, rivalesDe, nivelRival, kLado, multMio, pantalla, decidir, estadoActual, valorar, kb: () => kb, calcularMejoras, prediccion, ordenRecomendado, exportar, reaprender, efectoDe, reglasBioma, bajadaEntera, rodar, clonar, rngDe, techo, modeloMio, pendMio, proyectar, puntuar, valorRapidoBend, aplicarBendicion, mejAhora, jugarPuerta, puertasDe, politicaRapida, darBendicion };
})();
