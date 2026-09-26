// ==UserScript==
// @name         Aurora Dex · Ruinas Alfa Solver
// @namespace    http://tampermonkey.net/
// @version      1.2.1
// @description  Solver de Ruinas Alfa que se adapta solo a la dificultad (casillas, intentos y letras leídos de la pantalla)
// @match        https://auroradex.es/*
// @match        https://www.auroradex.es/*
// @updateURL    https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_ruinasalfa_extremo.user.js
// @downloadURL  https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_ruinasalfa_extremo.user.js
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

    let running = false;
    let solving = false;
    // Estado para el panel
    const R = { N: 0, L: 0, letters: '', max: 0, used: 0, remaining: null, phase: 0, guess: [], mode: '', result: '', t0: 0, t1: 0, history: [] };

    // ===================== NÚCLEO (lógica pura, sin DOM) =====================
    // CORE-START
    const sleep = (ms) => new Promise(res => setTimeout(res, ms));

    // Si letras^casillas <= este límite se usa filtrado de candidatos directo.
    // Por encima (p. ej. extremo: 26^5 ≈ 11,8 M) se usa la exploración por grupos.
    const FULL_LIMIT = 300000;

    // Feedback estilo Mastermind con letras como índices numéricos.
    // Devuelve verdes*100 + amarillos.
    function makeFeedback(L) {
        const cs = new Int8Array(L);
        return function (g, s, n) {
            let green = 0, yellow = 0;
            for (let i = 0; i < n; i++) {
                if (g[i] === s[i]) green++; else cs[s[i]]++;
            }
            for (let i = 0; i < n; i++) {
                if (g[i] !== s[i] && cs[g[i]] > 0) { cs[g[i]]--; yellow++; }
            }
            for (let i = 0; i < n; i++) {
                if (g[i] !== s[i]) cs[s[i]] = 0;
            }
            return green * 100 + yellow;
        };
    }

    function createStrategy(letters, N) {
        const L = letters.length;
        const idx = new Map(letters.map((l, i) => [l, i]));
        const fb = makeFeedback(L);
        const fullMode = Math.pow(L, N) <= FULL_LIMIT;
        const groupCount = Math.floor(L / N);
        const groups = [];
        for (let i = 0; i < groupCount; i++) groups.push(letters.slice(i * N, (i + 1) * N));
        const leftover = letters.slice(groupCount * N);

        let noRepeat = false;
        let candidates = null;
        let applied = 0;

        const toRow = (h) => ({ g: h.guess.map(l => idx.get(l)), code: h.green * 100 + h.yellow });

        function consistent(cand, rows) {
            for (let r = 0; r < rows.length; r++) {
                if (fb(rows[r].g, cand, N) !== rows[r].code) return false;
            }
            return true;
        }

        async function build(pool, rows, isRunning) {
            const P = pool.length;
            const res = [];
            if (P === 0) return res;
            const total = Math.pow(P, N);
            const it = new Array(N).fill(0);
            const cand = new Array(N);
            for (let c = 0; c < total; c++) {
                for (let i = 0; i < N; i++) cand[i] = pool[it[i]];
                if ((!noRepeat || new Set(cand).size === N) && consistent(cand, rows)) {
                    res.push(cand.slice());
                }
                let p = N - 1;
                while (p >= 0) {
                    if (++it[p] < P) break;
                    it[p] = 0;
                    p--;
                }
                if ((c & 0xFFFFF) === 0xFFFFF) {
                    await sleep(0);
                    if (!isRunning()) return null;
                }
            }
            return res;
        }

        // Elige, entre los candidatos, el que deja el menor espacio restante esperado
        // (suma de cuadrados de los tamaños de cada posible respuesta).
        const GUESS_CAP = 400;
        const TARGET_CAP = 3000;
        function evenSample(arr, cap) {
            if (arr.length <= cap) return arr;
            const out = [];
            const step = arr.length / cap;
            for (let i = 0; i < cap; i++) out.push(arr[Math.floor(i * step)]);
            return out;
        }
        function pickGuess(cands) {
            if (cands.length <= 2) return cands[0];
            const guesses = evenSample(cands, GUESS_CAP);
            const targets = evenSample(cands, TARGET_CAP);
            const size = N * 100 + N + 1;
            let best = null, bestScore = Infinity;
            const buckets = new Int32Array(size);
            for (let gi = 0; gi < guesses.length; gi++) {
                const g = guesses[gi];
                buckets.fill(0);
                for (let ti = 0; ti < targets.length; ti++) buckets[fb(g, targets[ti], N)]++;
                let score = 0;
                for (let b = 0; b < size; b++) score += buckets[b] * buckets[b];
                if (score < bestScore) { bestScore = score; best = g; }
            }
            return best;
        }

        // history: [{ guess: ['A','B',...], green, yellow }, ...]
        async function next(history, isRunning) {
            const rows = history.map(toRow);
            const explHistory = history.slice(0, groupCount);
            const totalHits = explHistory.reduce((s, h) => s + h.green + h.yellow, 0);
            const exploring = !fullMode && history.length < groupCount && totalHits < N;

            if (exploring) {
                return { guess: groups[history.length], phase: 1 };
            }

            if (candidates === null) {
                let pool;
                if (fullMode) {
                    pool = letters.map((_, i) => i);
                } else {
                    const set = new Set();
                    explHistory.forEach(h => {
                        if (h.green + h.yellow > 0) h.guess.forEach(l => set.add(idx.get(l)));
                    });
                    if (totalHits < N) leftover.forEach(l => set.add(idx.get(l)));
                    pool = Array.from(set);
                }
                const built = await build(pool, rows, isRunning);
                if (built === null) return { aborted: true };
                candidates = built;
                applied = rows.length;
                if (fullMode) {
                    // Prioriza códigos sin letras repetidas (por si alguna dificultad no las admite)
                    const dist = (c) => new Set(c).size;
                    candidates = candidates
                        .map(c => ({ c, d: dist(c) }))
                        .sort((a, b) => b.d - a.d)
                        .map(o => o.c);
                }
                pool = null;
            } else if (applied < rows.length) {
                const fresh = rows.slice(applied);
                candidates = candidates.filter(c => consistent(c, fresh));
                applied = rows.length;
            }

            if (candidates.length === 0) return { error: 'sin candidatos', remaining: 0 };
            const chosen = rows.length === 0 ? candidates[0] : pickGuess(candidates);
            return { guess: chosen.map(i => letters[i]), phase: 2, remaining: candidates.length };
        }

        function forbidRepeats() {
            noRepeat = true;
            if (candidates) candidates = candidates.filter(c => new Set(c).size === N);
        }

        return { next, forbidRepeats, fullMode, groupCount, groups, leftover, isNoRepeat: () => noRepeat };
    }
    // CORE-END

    // ===================== DOM =====================
    function log(msg) {
        console.log(`%c[Ruinas Alfa Solver]%c ${msg}`, 'color: #EF4444; font-weight: bold;', 'color: inherit;');
        kLog(document.querySelector('#ruinas-solver-panel-v2 .ru-log'), msg);
    }

    function isVisible(elem) {
        return !!(elem && (elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length));
    }

    // ¿Está en pantalla el minijuego? (botones de Unown + página de Ruinas Alfa)
    function gameScreenInfo() {
        const unownButtons = document.querySelectorAll('button img[src*="/sprites/unown/"]').length;
        const hasTitle = document.body.innerText.toLowerCase().includes('ruinas alfa');
        const hasProbar = !!findButtonByText('probar código');
        return { unownButtons, hasTitle, hasProbar, ok: unownButtons > 0 && (hasTitle || hasProbar) };
    }

    function isGameScreen() {
        return gameScreenInfo().ok;
    }

    function cleanClick(elem) {
        if (!elem) return;
        elem.click();
    }

    function findButtonByText(text) {
        const buttons = Array.from(document.querySelectorAll('button'));
        const targetText = text.toLowerCase().trim();
        return buttons.find(b => {
            const bText = (b.innerText || b.textContent || '').toLowerCase().replace(/\s+/g, ' ');
            return bText.includes(targetText) && isVisible(b);
        });
    }

    function letterOf(img) {
        return (img.alt || img.src.split('/').pop().replace('.png', '')).toUpperCase();
    }

    function getUnownMap() {
        const buttons = Array.from(document.querySelectorAll('button')).filter(b => b.querySelector('img[src*="/sprites/unown/"]'));
        const map = new Map();
        buttons.forEach(btn => {
            const img = btn.querySelector('img');
            if (img) map.set(letterOf(img), btn);
        });
        return map;
    }

    // Lee "Intento X de Y" y cuenta las casillas del código (el bloque que lo sigue).
    function getAttemptInfo() {
        const el = Array.from(document.querySelectorAll('div')).find(d =>
            d.children.length === 0 && /^Intento\s+\d+\s+de\s+\d+$/i.test((d.textContent || '').trim())
        );
        if (!el) return null;
        const m = el.textContent.trim().match(/(\d+)\s+de\s+(\d+)/i);
        let slots = 0;
        let sib = el.nextElementSibling;
        for (let k = 0; k < 3 && sib; k++, sib = sib.nextElementSibling) {
            if (sib.children.length > 0 && Array.from(sib.children).every(c => c.tagName === 'SPAN')) {
                slots = sib.children.length;
                break;
            }
        }
        return { current: parseInt(m[1], 10), max: parseInt(m[2], 10), slots };
    }

    function getHistoryRows() {
        const historyContainer = document.querySelector('section .space-y-2');
        if (!historyContainer) return [];
        return Array.from(historyContainer.children).filter(el => !el.textContent.includes('Todavía no'));
    }

    // Los círculos pueden venir como rgb(...) (renderizados en cliente) o como #hex (renderizados en servidor).
    const GREEN_RE = /76\s*,\s*194\s*,\s*106|#4cc26a/i;
    const YELLOW_RE = /242\s*,\s*194\s*,\s*48|#f2c230/i;
    function countColored(row, re) {
        return Array.from(row.querySelectorAll('[style]')).filter(el => {
            const st = el.getAttribute('style') || '';
            return re.test(st);
        }).length;
    }

    function parseRow(row) {
        const greens = countColored(row, GREEN_RE);
        const yellows = countColored(row, YELLOW_RE);
        const imgs = Array.from(row.querySelectorAll('img[src*="/sprites/unown/"]'));
        const guess = imgs.map(letterOf);
        return { guess, green: greens, yellow: yellows };
    }

    async function clearInput() {
        let safety = 0;
        while (safety < 15) {
            const btnBorrar = findButtonByText('borrar');
            if (btnBorrar && !btnBorrar.disabled) {
                cleanClick(btnBorrar);
                await sleep(100);
            } else {
                break;
            }
            safety++;
        }
    }

    // Devuelve 'ok' | 'stopped' | 'rejected'
    async function submitGuess(letters) {
        await clearInput();
        const map = getUnownMap();
        for (const letter of letters) {
            if (!running) return 'stopped';
            const btn = map.get(letter);
            if (!btn || btn.disabled) return 'rejected';
            cleanClick(btn);
            await sleep(120);
        }
        await sleep(150);
        if (!running) return 'stopped';
        const btnProbar = findButtonByText('probar código');
        if (!btnProbar || btnProbar.disabled) return 'rejected';
        cleanClick(btnProbar);
        return 'ok';
    }

    // Devuelve 'ok' | 'screen' | 'timeout' | 'stopped'
    async function waitForNewRow(prevCount) {
        let ticks = 0;
        while (getHistoryRows().length === prevCount && ticks < 30) {
            if (!running) return 'stopped';
            if (!isGameScreen()) return 'screen';
            await sleep(200);
            ticks++;
        }
        if (getHistoryRows().length === prevCount) return isGameScreen() ? 'timeout' : 'screen';
        return 'ok';
    }

    async function solveInner() {
        log('Iniciando resolución...');
        const unownMap = getUnownMap();
        if (unownMap.size === 0) {
            log('Error: no se han detectado botones de Unown.');
            return;
        }

        await clearInput();

        const info = getAttemptInfo();
        let N = info && info.slots ? info.slots : 0;
        let maxAttempts = info && info.max ? info.max : 0;
        if (!N) {
            N = 5;
            log('⚠️ No pude leer el nº de casillas; uso 5 (valor del script extremo).');
        }
        if (!maxAttempts) {
            maxAttempts = 12;
            log('⚠️ No pude leer el máximo de intentos; uso 12 (valor del script extremo).');
        }

        const letters = Array.from(unownMap.keys()).sort();
        const strat = createStrategy(letters, N);
        Object.assign(R, { N, L: letters.length, letters: letters.join(''), max: maxAttempts, mode: strat.fullMode ? 'filtrado directo' : 'exploración por grupos', result: '', remaining: null, phase: 0, guess: [] });
        updateUI();
        log(`Detectado: ${N} casillas, ${letters.length} letras (${letters.join('')}), ${maxAttempts} intentos → modo ${strat.fullMode ? 'filtrado directo' : 'exploración por grupos'}.`);

        while (running) {
            const history = getHistoryRows().map(parseRow);
            const attemptsMade = history.length;
            R.used = attemptsMade;
            R.history = history;
            updateUI();

            const bad = history.find(h => h.guess.length !== N || h.guess.some(l => !letters.includes(l)));
            if (bad) {
                log(`Error: no pude leer bien una fila del historial (letras leídas: ${bad.guess.join('') || 'ninguna'}, esperaba ${N}).`);
                break;
            }

            if (attemptsMade > 0 && history[attemptsMade - 1].green === N) {
                log('🎉 ¡CÓDIGO RESUELTO!');
                R.result = 'ok';
                kAviso({ tipo: 'exito', app: 'Ruinas Alfa', icono: '👁️', titulo: '¡Código resuelto!', lineas: [`Código: ${history[attemptsMade - 1].guess.join('')}`, `En ${attemptsMade} de ${maxAttempts} intentos${R.t0 ? ' · ⏱ ' + kTime(Date.now() - R.t0) : ''}`] });
                break;
            }

            if (attemptsMade >= maxAttempts) {
                log('❌ Fin de los intentos.');
                R.result = 'fail';
                kAviso({ tipo: 'aviso', app: 'Ruinas Alfa', icono: '👁️', titulo: 'Se acabaron los intentos', texto: `No ha salido el código en ${maxAttempts} intentos.` });
                break;
            }

            const step = await strat.next(history, () => running);
            if (step.aborted) break;
            if (step.error) {
                log('Error: no se encontró ninguna combinación compatible. Si hiciste intentos a mano antes, prueba con una partida nueva.');
                break;
            }

            if (step.phase === 1) {
                log(`[Fase 1 - Intento ${attemptsMade + 1}/${maxAttempts}] Grupo: ${step.guess.join('-')}`);
            } else {
                log(`[Fase 2 - Intento ${attemptsMade + 1}/${maxAttempts}] Candidatos: ${step.remaining} → Probando: ${step.guess.join('-')}`);
            }

            R.phase = step.phase; R.remaining = step.remaining ?? null; R.guess = step.guess;
            updateUI();
            const hasRepeats = new Set(step.guess).size < step.guess.length;
            const sent = await submitGuess(step.guess);
            if (sent === 'stopped') break;

            let ok = sent === 'ok';
            if (ok) {
                const waited = await waitForNewRow(attemptsMade);
                if (waited === 'stopped') break;
                if (waited === 'screen') {
                    log('La pantalla ha cambiado (posible fin de partida).');
                    break;
                }
                ok = waited === 'ok';
            }

            if (!ok) {
                if (hasRepeats && !strat.isNoRepeat()) {
                    log('El juego no aceptó un código con letras repetidas → pruebo solo códigos sin repetidas.');
                    strat.forbidRepeats();
                    continue;
                }
                log('No se pudo introducir o enviar el código (botón no disponible o sin respuesta de la app).');
                break;
            }
        }
    }

    async function solve() {
        if (solving) return;
        solving = true;
        try {
            await solveInner();
        } catch (e) {
            log('Error inesperado: ' + (e && e.message ? e.message : e));
            kAviso({ tipo: 'error', app: 'Ruinas Alfa', titulo: 'Se ha parado por un error', texto: String(e && e.message ? e.message : e) });
        } finally {
            running = false;
            solving = false;
            updateUI();
        }
    }

    // ===================== UI =====================
    const PANEL = 'ruinas-solver-panel-v2';
    const UP = '#' + PANEL;
    const enRuinas = () => /^\/ruinas/i.test(location.pathname);

    function createUI() {
        if (document.getElementById(PANEL)) return;
        kStyle('ruinas-kit', UP, '#B08D57');
        if (!document.getElementById('ruinas-css')) {
            const st = document.createElement('style');
            st.id = 'ruinas-css';
            st.textContent = `
              ${UP}.ru-float{position:fixed;right:12px;bottom:calc(var(--nav-alto,4rem) + 1rem + env(safe-area-inset-bottom,0px));z-index:2147483000;width:min(360px,calc(100vw - 1.5rem))}
              ${UP} .ru-code{display:flex;gap:4px;justify-content:center;min-height:36px}
              ${UP} .ru-code img{width:32px;height:32px;image-rendering:pixelated}
              ${UP} .ru-code span{width:32px;height:32px;display:grid;place-items:center;font-weight:800}`;
            document.head.appendChild(st);
        }
        const panel = document.createElement('section');
        panel.id = PANEL;
        panel.className = 'tarjeta space-y-3 p-3';
        panel.innerHTML = `
          ${kHead('👁️', 'Ruinas Alfa · Solver', 'Abre una partida para empezar')}
          <div class="ru-info k-tiles" style="--k-cols:3">
            <div class="${K_TILE}"><b class="ru-t-n tabular-nums">–</b><small>Casillas</small></div>
            <div class="${K_TILE}"><b class="ru-t-l tabular-nums">–</b><small>Letras</small></div>
            <div class="${K_TILE}"><b class="ru-t-c tabular-nums">–</b><small>Posibles</small></div>
          </div>
          <div>
            <div class="mb-1 flex items-baseline justify-between text-[11px] font-extrabold text-tinta-500">
              <span>🔢 Intentos</span><span class="ru-int-t tabular-nums">0 / –</span>
            </div>
            <div class="${K_BAR}"><span class="ru-bar" style="width:0%;background-color:#F2B632"></span></div>
          </div>
          <div class="ru-next rounded-card border-2 border-crema-200 bg-crema-50 p-2" hidden>
            <p class="mb-1 text-center text-[11px] font-extrabold text-tinta-500 ru-next-t">Siguiente código</p>
            <div class="ru-code"></div>
          </div>
          <button type="button" class="ru-btn boton-principal w-full">🔥 Resolver</button>
          <div class="ru-log ${K_LOG}"></div>`;
        panel.querySelector('.ru-btn').addEventListener('click', () => {
            running = !running;
            if (running) {
                R.t0 = Date.now(); R.t1 = 0;
                const box = panel.querySelector('.ru-log'); if (box) box.innerHTML = '';
                kPedirPermiso();
            }
            updateUI();
            if (running) solve();
        });
        placePanel(panel);
    }

    // Debajo de la tarjeta del juego (la que tiene «Probar código»); si no, flotante
    function placePanel(panel) {
        const probar = findButtonByText('probar código');
        const sec = probar && probar.closest('section');
        if (sec && sec.parentElement) {
            panel.classList.remove('ru-float');
            if (sec.nextElementSibling !== panel) sec.insertAdjacentElement('afterend', panel);
        } else {
            const main = document.querySelector('main');
            if (main) {
                panel.classList.remove('ru-float');
                if (panel.parentElement !== main || main.lastElementChild !== panel) main.appendChild(panel);
            } else if (!panel.isConnected || !panel.classList.contains('ru-float')) {
                panel.classList.add('ru-float');
                document.body.appendChild(panel);
            }
        }
    }

    function unownImg(letter) {
        const b = getUnownMap().get(letter);
        const img = b && b.querySelector('img');
        return img ? img.getAttribute('src') : null;
    }

    function updateUI() {
        const panel = document.getElementById(PANEL);
        if (!panel) return;
        const info = gameScreenInfo();

        let badge = ['off', 'LISTO'];
        if (running) badge = ['on', R.phase === 1 ? 'EXPLORANDO' : 'RESOLVIENDO'];
        else if (R.result === 'ok') badge = ['ok', 'RESUELTO'];
        else if (R.result === 'fail') badge = ['err', 'SIN INTENTOS'];
        else if (!info.ok) badge = ['off', 'SIN PARTIDA'];
        kBadge(panel.querySelector('.k-badge'), badge[0], badge[1]);

        kSet(panel.querySelector('.k-sub'),
            R.N ? `${R.mode}${R.t0 ? ' · ' + kTime((running ? Date.now() : R.t1 || Date.now()) - R.t0) : ''}`
                : info.ok ? 'Partida detectada · pulsa Resolver' : 'Abre una partida para empezar');
        const at0 = R.N ? null : getAttemptInfo();
        kSet(panel.querySelector('.ru-t-n'), R.N ? String(R.N) : at0 && at0.slots ? String(at0.slots) : '–');
        kSet(panel.querySelector('.ru-t-l'), R.L ? String(R.L) : info.unownButtons ? String(info.unownButtons) : '–');
        kSet(panel.querySelector('.ru-t-c'), R.remaining != null ? R.remaining.toLocaleString('es-ES') : R.phase === 1 ? '…' : '–');

        const at = getAttemptInfo();
        const max = R.max || (at && at.max) || 0;
        const used = running || R.result ? R.used : at ? Math.max(0, at.current - 1) : 0;
        kSet(panel.querySelector('.ru-int-t'), `${used} / ${max || '–'}`);
        const bar = panel.querySelector('.ru-bar');
        if (bar) {
            bar.style.width = (max ? Math.min(100, used / max * 100) : 0) + '%';
            bar.style.backgroundColor = R.result === 'ok' ? '#2FA84F' : used / (max || 1) > 0.75 ? '#E0473A' : '#F2B632';
        }

        const next = panel.querySelector('.ru-next');
        next.hidden = !(running && R.guess && R.guess.length);
        if (!next.hidden) {
            kSet(panel.querySelector('.ru-next-t'), R.phase === 1 ? 'Probando grupo de letras' : 'Probando código');
            const code = panel.querySelector('.ru-code');
            const key = R.guess.join('');
            if (code.dataset.k !== key) {
                code.dataset.k = key;
                code.innerHTML = R.guess.map(l => {
                    const src = unownImg(l);
                    return src ? `<img src="${kEsc(src)}" alt="${kEsc(l)}" title="${kEsc(l)}">` : `<span class="rounded-card border-2 border-crema-200">${kEsc(l)}</span>`;
                }).join('');
            }
        }

        const btn = panel.querySelector('.ru-btn');
        const cls = running ? 'ru-btn boton-secundario w-full' : 'ru-btn boton-principal w-full';
        if (btn.className !== cls) btn.className = cls;
        btn.disabled = !running && !info.ok;
        kSet(btn, running ? '■ Detener' : R.result ? '🔥 Resolver otra' : '🔥 Resolver');
    }

    log('Script cargado. Esperando la pantalla del minijuego…');
    let lastState = null;

    esperarHidratacion().then(() => setInterval(() => {
        // Ahora corre en toda la web (la navegación es de SPA): solo pinta en /ruinas
        if (!enRuinas()) {
            const p = document.getElementById(PANEL);
            if (p) p.remove();
            if (running) running = false;
            return;
        }
        createUI();
        const panel = document.getElementById(PANEL);
        if (!panel) return;
        placePanel(panel);

        const info = gameScreenInfo();
        if (!info.ok && running) running = false;
        if (!running && R.t0 && !R.t1) R.t1 = Date.now();
        updateUI();

        const st = `${info.ok}|${info.unownButtons}|${info.hasTitle}|${info.hasProbar}`;
        if (st !== lastState) {
            lastState = st;
            console.log('[Ruinas Alfa Solver] pantalla:', st);
        }
    }, 500));
})();
