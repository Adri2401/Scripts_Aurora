// ==UserScript==
// @name         Aurora Dex · Casa Treta Auto-Solver
// @namespace    auroradex-casatreta-autosolver
// @version      1.2.1
// @updateURL    https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_casatreta.user.js
// @downloadURL  https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_casatreta.user.js
// @description  Resuelve «La Casa Treta»: izquierda/derecha por búsqueda binaria y frío/caliente con la estrategia óptima. Panel con el estado de las 8 plantas.
// @match        https://auroradex.es/*
// @match        https://www.auroradex.es/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  /* ── Espera a que Next.js/React termine de hidratar ─────────────────────────
   * Si se mete algo en el DOM antes, React da un error de hidratación (#418/#423),
   * vuelve a pintar la página entera desde cero y el <html> pierde la clase
   * «oscuro» que la web pone al cargar → la página se queda en MODO CLARO.
   * Señal: <main> y <nav> ya marcados por React, carga completa y 800 ms sin cambios. */
  function esperarHidratacion(maxMs = 20000) {
    return new Promise(resolve => {
      const t0 = Date.now();
      let quietSince = Date.now();
      const obs = new MutationObserver(() => { quietSince = Date.now(); });
      obs.observe(document.documentElement, { childList: true, subtree: true });
      const marcado = el => !el || Object.keys(el).some(k => k.startsWith('__reactFiber$'));
      const tick = () => {
        const listo = document.readyState === 'complete' &&
          marcado(document.querySelector('main')) && marcado(document.querySelector('nav')) &&
          Date.now() - quietSince >= 800;
        if (listo || Date.now() - t0 > maxMs) {
          obs.disconnect();
          if ('requestIdleCallback' in window) requestIdleCallback(() => resolve(), { timeout: 1500 });
          else setTimeout(resolve, 300);
        } else setTimeout(tick, 200);
      };
      tick();
    });
  }

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

  const SCRIPT_VERSION = '1.2.0';
  const CFG = {
    panelId: 'ct-embedded-panel',
    titleSelector: 'h1',
    titleText: 'la casa treta',
    anchorFinder: () =>
      Array.from(document.querySelectorAll('p.tarjeta'))
        .find((p) => /hoy quedan/i.test(p.textContent)),
    floorCardSelector: 'section.tarjeta.border-2',
    doorSelector: 'button[aria-label^="Puerta "]',
    stepDelayMs: 700,
    floors: [
      { n: 1, doors: 4,  attempts: 3, type: 'lado' },
      { n: 2, doors: 5,  attempts: 3, type: 'lado' },
      { n: 3, doors: 7,  attempts: 3, type: 'lado' },
      { n: 4, doors: 10, attempts: 4, type: 'lado' },
      { n: 5, doors: 15, attempts: 4, type: 'lado' },
      { n: 6, doors: 8,  attempts: 4, type: 'frio_caliente' },
      { n: 7, doors: 12, attempts: 5, type: 'frio_caliente' },
      { n: 8, doors: 16, attempts: 6, type: 'frio_caliente' },
    ],
  };

  const state = { running: false, floors: {}, current: 0, startedAt: 0, clicks: 0 };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const U = '#' + CFG.panelId;

  /* ============================================================
     PANEL
     ============================================================ */
  function isOnCasaTreta() {
    return Array.from(document.querySelectorAll(CFG.titleSelector))
      .some((h) => h.textContent.trim().toLowerCase() === CFG.titleText);
  }

  // Estado de cada planta: pending | run | ok | fail | skip
  const FLOOR_UI = {
    pending: { ico: '',   cls: 'rounded-card border-2 border-crema-200 bg-crema-50 text-tinta-400' },
    run:     { ico: '🔄', cls: 'rounded-card border-2 border-ambar-200 bg-ambar-50 text-ambar-700' },
    ok:      { ico: '✅', cls: 'rounded-card border-2 border-hoja-300 bg-hoja-50 text-hoja-700' },
    fail:    { ico: '❌', cls: 'rounded-card border-2 border-rojo-100 bg-lienzo text-rojo-600' },
    skip:    { ico: '⏳', cls: 'rounded-card border-2 border-crema-200 bg-crema-100 text-tinta-400' },
  };

  function buildPanel() {
    kStyle('ct-style', U, '#C07A1E');
    const st = document.createElement('style');
    st.id = 'ct-style-extra';
    st.textContent = `
      ${U} .ct-floors{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:4px}
      ${U} .ct-floor{text-align:center;padding:5px 0 4px;line-height:1.1}
      ${U} .ct-floor b{display:block;font-size:13px}
      ${U} .ct-floor small{display:block;font-size:10px;min-height:12px}
      ${U} .ct-floor[data-s="run"]{animation:k-pulso 1.2s ease-in-out infinite}`;
    if (!document.getElementById('ct-style-extra')) document.head.appendChild(st);

    const section = document.createElement('section');
    section.id = CFG.panelId;
    section.className = 'tarjeta space-y-3 p-3';
    section.innerHTML = `
      ${kHead('🗝️', 'Casa Treta · Auto', 'Listo para subir las 8 plantas')}
      <div class="ct-floors">
        ${CFG.floors.map(f => `
          <div class="ct-floor ${FLOOR_UI.pending.cls}" data-f="${f.n}" data-s="pending" title="Planta ${f.n} · ${f.doors} puertas · ${f.type === 'lado' ? 'izquierda/derecha' : 'frío/caliente'}">
            <b>${f.n}</b><small></small>
          </div>`).join('')}
      </div>
      <div>
        <div class="mb-1 flex items-baseline justify-between text-[11px] font-extrabold text-tinta-500">
          <span>🏠 Plantas subidas</span><span class="ct-prog-t tabular-nums">0 / 8</span>
        </div>
        <div class="${K_BAR}"><span class="ct-bar" style="width:0%;background-color:#2FA84F"></span></div>
      </div>
      <div class="k-tiles" style="--k-cols:3">
        <div class="${K_TILE}"><b class="ct-t-ok tabular-nums">0</b><small>Subidas</small></div>
        <div class="${K_TILE}"><b class="ct-t-clk tabular-nums">0</b><small>Puertas</small></div>
        <div class="${K_TILE}"><b class="ct-t-time tabular-nums">00:00</b><small>Tiempo</small></div>
      </div>
      <button type="button" class="ct-btn boton-principal w-full">▶ Resolver las 8 plantas</button>
      <div class="ct-log ${K_LOG}"></div>
    `;
    return section;
  }

  function mountPanel() {
    if (document.getElementById(CFG.panelId)) return;
    const anchor = CFG.anchorFinder();
    const panel = buildPanel();
    if (anchor && anchor.parentElement) {
      anchor.insertAdjacentElement('afterend', panel);
    } else {
      const firstFloor = document.querySelector(CFG.floorCardSelector);
      const main = document.querySelector('main') || document.body;
      if (firstFloor && firstFloor.parentElement) firstFloor.insertAdjacentElement('beforebegin', panel);
      else main.prepend(panel);
    }
    panel.querySelector('.ct-btn').addEventListener('click', () => {
      if (state.running) { state.running = false; log('⏸ Deteniendo tras el intento actual…'); render(); return; }
      start();
    });
    render();
  }

  function unmountPanel() {
    if (state.running) state.running = false;
    const el = document.getElementById(CFG.panelId);
    if (el) el.remove();
  }

  function start() {
    state.running = true;
    state.floors = {};
    state.current = 0;
    state.clicks = 0;
    state.startedAt = Date.now();
    const box = document.querySelector(`${U} .ct-log`);
    if (box) box.innerHTML = '';
    render();
    runAll().catch((e) => {
      if (e && e.message === 'DETENIDO') log('⏹ Detenido.');
      else { log('⚠ Error: ' + e.message); console.error(e); kAviso({ tipo: 'error', app: 'Casa Treta', titulo: 'Se ha parado por un error', texto: e.message }); }
    }).finally(() => {
      state.running = false;
      state.endedAt = Date.now();
      render();
    });
  }

  function setFloor(n, s, note = '') {
    state.floors[n] = { s, note };
    render();
  }

  function render() {
    const p = document.getElementById(CFG.panelId);
    if (!p) return;
    const done = Object.values(state.floors).filter(f => f.s === 'ok').length;
    const fails = Object.values(state.floors).filter(f => f.s === 'fail').length;
    const finished = !state.running && state.startedAt;

    let badge = ['off', 'LISTO'];
    if (state.running) badge = ['on', state.current ? `PLANTA ${state.current}` : 'EN MARCHA'];
    else if (finished) badge = fails ? ['warn', `${done}/8`] : ['ok', 'COMPLETO'];
    if (isHouseLocked()) badge = ['warn', 'CERRADA'];
    kBadge(p.querySelector('.k-badge'), badge[0], badge[1]);

    kSet(p.querySelector('.k-sub'), state.running
      ? `Planta ${state.current || '…'} de 8 · no gasta energía`
      : finished ? `Terminado: ${done}/8 plantas subidas${fails ? ` · ${fails} sin resolver` : ''}` : 'Listo para subir las 8 plantas');

    for (const el of p.querySelectorAll('.ct-floor')) {
      const f = state.floors[el.dataset.f] || { s: 'pending', note: '' };
      if (el.dataset.s !== f.s) { el.dataset.s = f.s; el.className = 'ct-floor ' + FLOOR_UI[f.s].cls; }
      kSet(el.querySelector('small'), FLOOR_UI[f.s].ico);
      if (f.note) el.title = `Planta ${el.dataset.f}: ${f.note}`;
    }
    kSet(p.querySelector('.ct-prog-t'), `${done} / 8`);
    const bar = p.querySelector('.ct-bar');
    if (bar) bar.style.width = (done / 8 * 100) + '%';
    kSet(p.querySelector('.ct-t-ok'), String(done));
    kSet(p.querySelector('.ct-t-clk'), String(state.clicks));
    kSet(p.querySelector('.ct-t-time'), kTime(state.startedAt ? (state.running ? Date.now() : state.endedAt || Date.now()) - state.startedAt : 0));

    const btn = p.querySelector('.ct-btn');
    const cls = state.running ? 'ct-btn boton-secundario w-full' : 'ct-btn boton-principal w-full';
    if (btn.className !== cls) btn.className = cls;
    kSet(btn, state.running ? '■ Detener' : finished ? '↻ Volver a intentar' : '▶ Resolver las 8 plantas');
  }
  setInterval(() => { if (state.running) render(); }, 1000);

  function log(text) {
    console.log('%c[CasaTreta]', 'color:#c07a1e;font-weight:bold', text);
    kLog(document.querySelector(`${U} .ct-log`), text.trim());
  }

  /* ============================================================
     Observador de navegación (SPA)
     ============================================================ */
  let syncScheduled = false;
  function scheduleSync() {
    if (syncScheduled) return;
    syncScheduled = true;
    requestAnimationFrame(() => {
      syncScheduled = false;
      const onPage = isOnCasaTreta();
      if (onPage && !document.getElementById(CFG.panelId)) mountPanel();
      if (!onPage && document.getElementById(CFG.panelId)) unmountPanel();
    });
  }

  /* ============================================================
     Interacción con la planta / puertas
     ============================================================ */
  function findFloorCard(floorNumber) {
    // Se empareja el título exacto de cada tarjeta (vive en su propio <p>): al concatenar
    // textContent, «Planta 1» y «4 puertas…» quedaban pegados como «Planta 14 puertas…».
    const titleP = Array.from(document.querySelectorAll('p.text-sm.font-extrabold'))
      .find((p) => p.textContent.trim() === `Planta ${floorNumber}`);
    if (!titleP) return null;
    const card = titleP.closest(CFG.floorCardSelector);
    if (card && card.id === CFG.panelId) return null;
    return card || null;
  }

  function findButtonByText(card, regex) {
    return Array.from(card.querySelectorAll('button')).find((b) => regex.test(b.textContent.trim()));
  }

  const SIN_INTENTOS_RE = /se te acabaron los intentos|sin intentos (?:para )?hoy|no te quedan intentos/i;
  const HECHA_RE = /subida hoy|ya (?:la )?has subido|superada|completad|conseguid|✅|✓/i;
  // Espera a que se cumpla `cond` (hasta `ms`), mirando cada 150 ms
  async function esperarA(cond, ms) {
    const t0 = Date.now();
    for (;;) {
      if (!state.running) throw new Error('DETENIDO');
      const v = cond();
      if (v || Date.now() - t0 > ms) return v;
      await sleep(150);
    }
  }
  // Cierra cualquier planta que siga abierta (la web solo deja entrar en una a la vez)
  async function cerrarOtras(floorNumber) {
    for (const f of CFG.floors) {
      if (f.n === floorNumber) continue;
      const c = findFloorCard(f.n);
      if (c && getDoors(c).length) { log(`  Cierro la Planta ${f.n}, que seguía abierta.`); await exitFloor(f.n); }
    }
  }
  async function enterFloor(floorNumber) {
    let card = findFloorCard(floorNumber);
    if (!card) { log(`No encuentro la Planta ${floorNumber} en la página.`); return null; }
    await cerrarOtras(floorNumber);
    // la tarjeta se queda un momento a medio pintar al salir de la anterior: se espera a que diga qué pasa con ella
    const estado = await esperarA(() => {
      const c = findFloorCard(floorNumber);
      if (!c) return null;
      if (getDoors(c).length) return 'ABIERTA';
      const b = findButtonByText(c, /^entrar/i);
      if (b && !b.disabled) return 'ENTRAR';
      if (SIN_INTENTOS_RE.test(c.textContent)) return 'SIN_INTENTOS';
      if ((!b || b.disabled) && HECHA_RE.test(c.textContent)) return 'YA_HOY';
      return null;
    }, 6000);
    card = findFloorCard(floorNumber);
    if (estado === 'SIN_INTENTOS') { log(`⏳ Planta ${floorNumber}: sin intentos hoy, la salto.`); return 'SIN_INTENTOS'; }
    if (estado === 'YA_HOY') { log(`✅ Planta ${floorNumber}: ya estaba subida hoy.`); return 'YA_HOY'; }
    if (estado === 'ABIERTA') { log(`Planta ${floorNumber} ya estaba abierta, sigo desde ahí.`); return card; }
    if (estado === 'ENTRAR') {
      findButtonByText(card, /^entrar/i).click();
      // se espera a que salgan las puertas
      const abierta = await esperarA(() => { const c = findFloorCard(floorNumber); return c && getDoors(c).length ? c : null; }, 6000);
      if (abierta) return abierta;
      log(`⚠ Planta ${floorNumber}: pulsé «Entrar» pero no salen las puertas.`);
      console.log('[CasaTreta] tarjeta tras «Entrar»:', card && card.outerHTML);
      return null;
    }
    // 6 s después sigue sin puertas ni «Entrar»: ya está subida hoy (como antes, pero sin prisas)
    const txt = (card && card.textContent || '').replace(/\s+/g, ' ').trim();
    console.log('[CasaTreta] Planta ' + floorNumber + ' sin «Entrar» (la doy por subida):', txt);
    log(`✅ Planta ${floorNumber}: ya estaba subida hoy.`);
    return 'YA_HOY';
  }

  function isHouseLocked() {
    return /la casa treta est[aá] en/i.test(document.body.textContent);
  }

  async function exitFloor(floorNumber) {
    const card = findFloorCard(floorNumber);
    if (!card) return;
    const salirBtn = findButtonByText(card, /^salir$/i);
    if (salirBtn) salirBtn.click();
    await sleep(CFG.stepDelayMs);
    await esperarA(() => { const c = findFloorCard(floorNumber); return !c || !getDoors(c).length; }, 4000);
    await sleep(250);
  }

  function getDoors(card) {
    return Array.from(card.querySelectorAll(CFG.doorSelector));
  }

  // Historial «Puerta N: pista» de hoy: esas puertas no se vuelven a pulsar (el aviso se quedaría
  // congelado con el mensaje antiguo y no llegaría pista nueva).
  function getKnownHints(card) {
    const map = {};
    Array.from(card.querySelectorAll('p, div, span, li'))
      .filter((el) => el.children.length === 0)
      .forEach((el) => {
        const m = (el.textContent || '').trim().match(/^Puerta\s+(\d+)\s*:\s*(.+)$/i);
        if (m) map[parseInt(m[1], 10)] = m[2].trim().toLowerCase();
      });
    return map;
  }

  function getRemainingAttempts(card, fallback) {
    const m = card && card.textContent.match(/Te quedan\s+(\d+)\s+intentos?/i);
    return m ? parseInt(m[1], 10) : fallback;
  }

  // Las pistas son toasts <button class="pointer-events-auto …"><span>texto</span></button>.
  // El sitio reutiliza el mismo elemento y le cambia el texto, así que se compara TEXTO.
  const CFG_TOAST_SELECTOR = 'button.pointer-events-auto';
  function getLatestToastText() {
    const toasts = document.querySelectorAll(CFG_TOAST_SELECTOR);
    if (!toasts.length) return null;
    return (toasts[toasts.length - 1].textContent || '').trim().toLowerCase();
  }

  function waitForToastChange(beforeText, timeoutMs) {
    return new Promise((resolve) => {
      const start = Date.now();
      const tick = () => {
        if (!state.running) { resolve(''); return; }
        const current = getLatestToastText();
        if (current !== null && current !== beforeText) { resolve(current); return; }
        if (Date.now() - start > timeoutMs) { resolve(current || ''); return; }
        requestAnimationFrame(tick);
      };
      tick();
    });
  }

  async function clickDoorAndGetHint(floorNumber, index1based) {
    // La tarjeta se busca viva en cada clic: la web la redibuja tras cada intento
    const card = findFloorCard(floorNumber);
    if (!card) { log(`No encuentro la Planta ${floorNumber} en la página.`); return ''; }
    const btn = getDoors(card)[index1based - 1];
    if (!btn) { log(`No encuentro la puerta ${index1based} en esta planta.`); return ''; }
    const beforeText = getLatestToastText();
    btn.click();
    state.clicks++;
    render();
    const hint = await waitForToastChange(beforeText, 3000);
    if (!state.running) throw new Error('DETENIDO');
    await sleep(150);
    return hint;
  }

  function isSuccessHint(hint) {
    // «+N llaves» es el patrón fiable en todas las plantas
    return /\+\s*\d+\s*llaves/.test(hint) || /acert|subes|correct|¡sub/.test(hint);
  }
  function sideHintDirection(hint) {
    if (/izquierda/.test(hint)) return -1;
    if (/derecha/.test(hint)) return 1;
    return 0;
  }
  // 1 = más caliente (más cerca que la anterior), -1 = más frío, 0 = igual de lejos, null = no reconocida
  function hotColdCompare(hint) {
    if (/igual de lejos|misma distancia/.test(hint)) return 0;
    if (/m[aá]s caliente|caliente/.test(hint)) return 1;
    if (/m[aá]s fr[ií]o|fr[ií]o/.test(hint)) return -1;
    return null;
  }

  /* ---------- Estrategias ---------- */

  // Izquierda/derecha: búsqueda binaria. Aprovecha las pistas de hoy si la planta ya estaba empezada.
  async function solveLado(floorNumber, doors, attempts, known) {
    let lo = 1, hi = doors;
    for (const [d, h] of Object.entries(known)) {
      const dir = sideHintDirection(h), n = +d;
      if (dir === -1) hi = Math.min(hi, n - 1);
      else if (dir === 1) lo = Math.max(lo, n + 1);
    }
    if (lo > hi) { lo = 1; hi = doors; }
    if (Object.keys(known).length) log(`  Pistas de hoy: la puerta está entre ${lo} y ${hi}.`);
    for (let i = 0; i < attempts && lo <= hi; i++) {
      const guess = Math.floor((lo + hi) / 2);
      const hint = await clickDoorAndGetHint(floorNumber, guess);
      log(`  Intento ${i + 1}: puerta ${guess} → ${hint || '(sin pista)'}`);
      if (isSuccessHint(hint)) { log(`✅ Planta ${floorNumber}: puerta ${guess}`); return true; }
      const dir = sideHintDirection(hint);
      if (dir === -1) hi = guess - 1;
      else if (dir === 1) lo = guess + 1;
      else if (hint) log('  ⚠ Pista no reconocida como izquierda/derecha.');
    }
    return false;
  }

  // Frío/caliente: cada pista compara la puerta nueva con la anterior, o sea, dice a qué lado de la
  // mediatriz entre las dos está el premio. En cada paso se elige la puerta que deja el MENOR número
  // de candidatas en el peor caso. Simulado sobre todas las posiciones: resuelve 8/8, 12/12 y 16/16
  // (la estrategia anterior, de pasos que se doblan, se quedaba en 5/8, 7/12 y 9/16).
  async function solveFrioCaliente(floorNumber, doors, attempts, known) {
    const tried = new Set(Object.keys(known).map(Number));
    const verdict = (t, prev, g) => {
      if (g === t) return 'ok';
      const dp = Math.abs(t - prev), dg = Math.abs(t - g);
      return dg < dp ? 'hot' : dg > dp ? 'cold' : 'eq';
    };
    let cands = [];
    for (let d = 1; d <= doors; d++) if (!tried.has(d)) cands.push(d);
    if (!cands.length) { tried.clear(); for (let d = 1; d <= doors; d++) cands.push(d); }

    // Primera puerta: la del centro (su pista no compara con nada)
    const center = Math.ceil(doors / 2);
    let prev = cands.includes(center) ? center : cands.reduce((a, d) => (Math.abs(d - center) < Math.abs(a - center) ? d : a), cands[0]);
    let hint = await clickDoorAndGetHint(floorNumber, prev);
    let used = 1;
    tried.add(prev);
    log(`  Intento 1: puerta ${prev} → ${hint || '(sin pista)'}`);
    if (isSuccessHint(hint)) { log(`✅ Planta ${floorNumber}: puerta ${prev}`); return true; }
    cands = cands.filter(c => c !== prev);

    while (used < attempts && cands.length) {
      let best = null;
      for (let g = 1; g <= doors; g++) {
        if (tried.has(g)) continue;
        const buckets = {};
        for (const c of cands) { const v = verdict(c, prev, g); if (v !== 'ok') buckets[v] = (buckets[v] || 0) + 1; }
        const worst = Math.max(0, ...Object.values(buckets));
        const key = worst * 2 + (cands.includes(g) ? 0 : 1);   // desempate: mejor si puede ser la buena
        if (!best || key < best.key) best = { key, g };
      }
      if (!best) break;
      const g = best.g;
      hint = await clickDoorAndGetHint(floorNumber, g);
      used++;
      tried.add(g);
      log(`  Intento ${used}: puerta ${g} → ${hint || '(sin pista)'}  [${cands.length} posibles]`);
      if (isSuccessHint(hint)) { log(`✅ Planta ${floorNumber}: puerta ${g}`); return true; }
      const cmp = hotColdCompare(hint);
      const want = cmp === 1 ? 'hot' : cmp === -1 ? 'cold' : cmp === 0 ? 'eq' : null;
      const next = want ? cands.filter(c => c !== g && verdict(c, prev, g) === want) : cands.filter(c => c !== g);
      if (!want && hint) log('  ⚠ Pista no reconocida como frío/caliente.');
      cands = next.length ? next : cands.filter(c => c !== g);
      prev = g;
    }
    return false;
  }

  /* ---------- Bucle principal ---------- */

  async function playFloor(floor) {
    state.current = floor.n;
    setFloor(floor.n, 'run');
    log(`— Planta ${floor.n} · ${floor.doors} puertas · ${floor.type === 'lado' ? 'izquierda/derecha' : 'frío/caliente'}`);
    let ok = false, vuelta = 0, motivo = 'sin resolver';
    for (; vuelta < 12 && !ok; vuelta++) {
      if (vuelta) { log(`🔁 Planta ${floor.n}: lo vuelvo a intentar (intento nº ${vuelta + 1}).`); setFloor(floor.n, 'run', `reintento ${vuelta + 1}`); }
      const card = await enterFloor(floor.n);
      if (card === 'YA_HOY') { setFloor(floor.n, 'ok', 'ya subida hoy'); return true; }
      if (card === 'SIN_INTENTOS') { motivo = vuelta ? 'se acabaron los intentos' : 'sin intentos hoy'; break; }
      if (!card) { motivo = 'no pude entrar'; break; }

      const known = getKnownHints(card);
      const attempts = getRemainingAttempts(card, floor.attempts);
      ok = floor.type === 'lado'
        ? await solveLado(floor.n, floor.doors, attempts, known)
        : await solveFrioCaliente(floor.n, floor.doors, attempts, known);
      if (!ok) log(`❌ Planta ${floor.n}: esta vez no ha salido.`);
      await exitFloor(floor.n);
    }
    if (ok) setFloor(floor.n, 'ok', vuelta > 1 ? `subida al ${vuelta}.º intento` : 'subida');
    else { log(`❌ Planta ${floor.n}: ${motivo}.`); setFloor(floor.n, motivo === 'sin intentos hoy' ? 'skip' : 'fail', motivo); }
    return ok;
  }

  async function runAll() {
    if (isHouseLocked()) { log('⚠ La Casa Treta está cerrada ahora mismo.'); return; }
    let subidas = 0;
    for (const floor of CFG.floors) {
      if (!state.running) throw new Error('DETENIDO');
      if (!findFloorCard(floor.n)) { setFloor(floor.n, 'skip', 'aún bloqueada (medallas)'); continue; }
      if (await playFloor(floor)) subidas++;
    }
    state.current = 0;
    log(`🎉 Recorrido completo: ${subidas}/8 plantas subidas.`);
    // En Accesos directos cuenta como hecha hoy si no queda nada que hacer (todas subidas, bloqueadas o sin intentos)
    if (Object.values(state.floors).every(f => f.s === 'ok' || f.s === 'skip' || /intentos/.test(f.note || ''))) {
      try {
        const d = new Date(), dia = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        const h = JSON.parse(localStorage.getItem('adx-accesos-hechos') || 'null');
        const keys = h && h.dia === dia ? h.keys : [];
        if (!keys.includes('/casa')) keys.push('/casa');
        localStorage.setItem('adx-accesos-hechos', JSON.stringify({ dia, keys }));
      } catch { /* sin storage */ }
    }
    const sinHacer = Object.values(state.floors).filter(f => f.s === 'fail').length, bloqueadas = Object.values(state.floors).filter(f => f.s === 'skip').length;
    kAviso({
      tipo: sinHacer ? 'aviso' : 'exito', app: 'Casa Treta', icono: '🗝️',
      titulo: sinHacer ? `${subidas} de 8 plantas subidas` : bloqueadas ? `¡${subidas} plantas subidas!` : '¡Las 8 plantas subidas!',
      lineas: [`🚪 ${state.clicks} puertas abiertas · ⏱ ${kTime(Date.now() - state.startedAt)}`, sinHacer ? `❌ ${sinHacer} sin resolver (se acabaron los intentos)` : null, bloqueadas ? `🔒 ${bloqueadas} aún bloqueada${bloqueadas > 1 ? 's' : ''} (medallas)` : null],
    });
  }

  window.casaTretaAutoSolver = { run: () => start(), playFloor, CFG, state };

  esperarHidratacion().then(() => {
    new MutationObserver(scheduleSync).observe(document.body, { childList: true, subtree: true });
    scheduleSync();
  });

  console.log(`%c🔑 CasaTreta Auto-Solver v${SCRIPT_VERSION} cargado`,
    'background:#2b1a0e;color:#f5c554;font-weight:bold;padding:4px 8px;border-radius:4px;');
})();
