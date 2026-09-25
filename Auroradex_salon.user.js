// ==UserScript==
// @name         Aurora Dex · Salón Malvalona Auto
// @namespace    auroradex-salon-auto
// @version      1.5.0
// @description  Juega solo a «Sube o Baja» del Salón de Malvalona con cuenta exacta de cartas. Modo Respiros: juega con las mínimas partidas hasta reunir los vales de TODOS los respiros que quedan (15 × respiros) y entonces los compra seguidos. Modo Vales: maximiza el valor esperado.
// @match        https://auroradex.es/*
// @match        https://www.auroradex.es/*
// @updateURL    https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_salon.user.js
// @downloadURL  https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_salon.user.js
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  /* ── Espera a que Next.js/React termine de hidratar (si no, modo claro y errores #418/#423) ── */
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

  /* ------------------------------------------------------------------ *
   *  CONFIG
   * ------------------------------------------------------------------ */
  const CFG = {
    actionDelay: [140, 260],     // pausa antes de pulsar (ms)
    changeTimeout: 5000,         // espera máxima a que el juego reaccione a un clic
    settle: 220,                 // deja acabar la animación de la carta antes de leer
    potStep: 8,                  // el bote sube de 8 en 8 por acierto
    maxK: 9,                     // aciertos máximos: 10 cartas → 9 aciertos
    defaultPrice: 15,            // precio de «Un respiro» en vales (se lee del Mostrador)
    defaultGames: 0,             // 0 = sin límite
    defaultReserve: 0,           // energía que se deja sin gastar
  };
  const LS_POT = 'ax_salon_pot_v4';
  const LS_OBS = 'ax_salon_obs_v1';
  const LS_GAMES = 'ax_salon_games';
  const LS_RESERVE = 'ax_salon_reserve';
  const LS_MODE = 'ax_salon_mode';
  const LS_ER = 'ax_salon_energy_per_respiro';
  const PANEL_ID = 'ax-salon-auto';

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
   *   tipo: 'exito' · 'fin' · 'info' · 'aviso' · 'error' · 'shiny' · 'legendario'
   *   'info' va sin sonido; 'shiny', 'legendario' y 'error' no se cierran solos.
   *   sistema: notificación del móvil/PC, solo si la pestaña no se está viendo (para no repetir el aviso).
   * El sonido se puede silenciar desde el propio aviso (🔊) y vale para todos los scripts. */
  const K_AVISO = {
    exito: { c: '#2FA84F', f: 'linear-gradient(135deg,#1F8A3E,#3CC065)', i: '✅' },
    fin: { c: '#2FA84F', f: 'linear-gradient(135deg,#1F8A3E,#3CC065)', i: '🏁' },
    info: { c: '#3BA7E0', f: 'linear-gradient(135deg,#1F7FB8,#48B6EC)', i: 'ℹ️' },
    aviso: { c: '#E0A21E', f: 'linear-gradient(135deg,#C07A12,#F0B436)', i: '⚡' },
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
      #k-avisos .k-av{pointer-events:auto;position:relative;overflow:hidden;border-radius:20px;background:rgb(var(--lienzo,255 255 255));color:rgb(var(--tinta-800,33 36 29));border:2px solid color-mix(in srgb,var(--k-c) 55%,rgb(var(--lienzo,255 255 255)));box-shadow:0 4px 0 0 rgba(0,0,0,.08),0 16px 34px -14px rgba(0,0,0,.55),0 0 0 1px rgba(0,0,0,.04);animation:k-av-entra .42s cubic-bezier(.2,1.25,.4,1) both;cursor:default}
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
    if (o.sonido ?? tipo !== 'info') kSonido(tipo);
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
      d.querySelector('[data-k="x"]').addEventListener('click', cerrar);
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
   *  UTILIDADES
   * ------------------------------------------------------------------ */
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const txt = el => (el && el.textContent ? el.textContent.replace(/\s+/g, ' ').trim() : '');
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const num = s => { const m = String(s || '').match(/-?\d+/); return m ? parseInt(m[0], 10) : null; };
  const lsGet = (k, def) => { try { const v = localStorage.getItem(k); return v === null ? def : v; } catch { return def; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* sin storage */ } };
  const popcount = m => { let c = 0; while (m) { c += m & 1; m >>= 1; } return c; };

  // Los botones llevan texto en varios <span>: se unen con espacio («▲ MAYOR 67%»)
  function btnText(b) {
    if (!b) return '';
    let s = '';
    b.childNodes.forEach(n => { s += ' ' + (n.textContent || ''); });
    return s.replace(/\s+/g, ' ').trim();
  }
  const enPanel = el => !!el.closest('#' + PANEL_ID);
  const findBtn = (re, includeDisabled) =>
    $$('button').find(b => !enPanel(b) && (includeDisabled || !b.disabled) && re.test(btnText(b)));

  const enSalon = () => /^\/salon\/?$/.test(location.pathname);

  /* ------------------------------------------------------------------ *
   *  LECTURA DEL DOM
   * ------------------------------------------------------------------ */
  function readEnergy() {
    const box = document.querySelector('header span[title^="Tiempo para el siguiente punto"]');
    if (!box) return null;
    const n = $$('span', box).map(txt).find(t => /^\d+\/\d+$/.test(t));
    return n ? parseInt(n, 10) : null;
  }

  // Texto de la página sin el del panel del script (si no, lee sus propias fichas «74 Vales» como si fueran del juego)
  function mainText() {
    const mains = $$('main');
    const root = mains.length ? mains[0] : document.body;
    const c = root.cloneNode(true);
    for (const p of c.querySelectorAll('#' + PANEL_ID)) p.remove();
    let t = txt(c);
    if (!/Te quedan|vales|con otra/i.test(t) && root !== document.body) {   // por si el contenido no cuelga del primer <main>
      const b = document.body.cloneNode(true);
      for (const p of b.querySelectorAll('#' + PANEL_ID)) p.remove();
      t = txt(b);
    }
    return t;
  }

  function readVales() {
    const m = mainText().match(/(\d+)\s*vales/i);
    return m ? parseInt(m[1], 10) : null;
  }

  // «Te quedan 6 de 20 de energía por comprar hoy»
  function readCupo() {
    const m = mainText().match(/Te quedan\s+(\d+)\s+de\s+(\d+)\s+de energ/i);
    return m ? { left: parseInt(m[1], 10), total: parseInt(m[2], 10) } : null;
  }

  // Botón «Un respiro» del Mostrador y su precio (el último número del botón)
  const respiroBtn = (includeDisabled) => findBtn(/Un respiro/i, includeDisabled);
  function respiroPrice() {
    const b = respiroBtn(true);
    const m = b && btnText(b).match(/(\d+)\s*$/);
    return m ? parseInt(m[1], 10) : CFG.defaultPrice;
  }

  function readGame() {
    const st = { screen: 'desconocida' };
    const may = findBtn(/MAYOR/i, true), men = findBtn(/MENOR/i, true);
    if (may && men) {
      st.screen = 'juego';
      st.mayor = may; st.menor = men;
      st.disabled = may.disabled || men.disabled;
      const pm = btnText(may).match(/(\d+)\s*%/), pn = btnText(men).match(/(\d+)\s*%/);
      st.pUpShown = pm ? parseInt(pm[1], 10) / 100 : null;
      st.pDownShown = pn ? parseInt(pn[1], 10) / 100 : null;

      const card = $$('span').find(x => /text-5xl/.test(x.className || ''));
      st.card = card ? num(txt(card)) : null;

      // «Quedan en la baraja»: <span title="1 de 4"> = (copias que quedan) de (número)
      st.deck = {};
      for (const el of $$('span[title]')) {
        const m = (el.getAttribute('title') || '').match(/^(\d+)\s+de\s+(\d+)$/);
        if (m) st.deck[parseInt(m[2], 10)] = parseInt(m[1], 10);
      }

      const stand = findBtn(/Plantarse/i, true);
      st.stand = stand;
      st.pot = stand ? num(btnText(stand)) : null;
      const otra = mainText().match(/con otra:\s*(\d+)/i);
      st.next = otra ? parseInt(otra[1], 10) : null;
      return st;
    }
    // Pantalla de inicio («JUGAR · ⚡ −1») o de resultado («OTRA · ⚡ −1», «DEJARLO POR HOY»)
    const play = findBtn(/^(JUGAR|OTRA)\b/i, true);
    if (play) { st.screen = 'inicio'; st.play = play; st.canPlay = !play.disabled; return st; }
    return st;
  }

  /* ------------------------------------------------------------------ *
   *  BOTE
   *  El bote NO crece siempre igual (se han visto 8, 16, 28, 44, 60, 76…), así que:
   *   · dentro de una partida se usa lo que enseña la pantalla («bote» y «con otra») y se extrapola
   *     con ese mismo incremento;
   *   · para planificar partidas futuras se usa la media de lo visto en cada racha (8·k mientras no haya datos);
   *   · cada decisión se apunta (obs) para poder estudiar la fórmula real del bote.
   * ------------------------------------------------------------------ */
  let potStats = {};
  try { potStats = JSON.parse(lsGet(LS_POT, '{}')) || {}; } catch { potStats = {}; }
  const savePots = () => lsSet(LS_POT, JSON.stringify(potStats));
  let obs = [];
  try { obs = JSON.parse(lsGet(LS_OBS, '[]')) || []; } catch { obs = []; }

  // Media del bote visto tras k aciertos (por defecto 8·k)
  const potAt = k => {
    const s = potStats[k];
    return s && s.n ? s.s / s.n : (k === 0 ? 0 : CFG.potStep * k);
  };

  function addStat(k, val) {
    if (val == null) return false;
    const before = potAt(k);
    const s = potStats[k] || (potStats[k] = { s: 0, n: 0 });
    if (s.n >= 200) { s.s = s.s / s.n * 100; s.n = 100; }   // memoria acotada
    s.s += val; s.n++;
    return Math.abs(potAt(k) - before) >= 0.5;
  }

  function notePot(g, k, mask) {
    let ch = false;
    if (g.pot != null) ch = addStat(k, g.pot) || ch;
    if (g.next != null) ch = addStat(k + 1, g.next) || ch;
    obs.push({ k, c: g.card, left: Object.keys(g.deck).filter(n => g.deck[n] > 0).map(Number), pot: g.pot, next: g.next, up: g.pUpShown, down: g.pDownShown });
    if (obs.length > 400) obs.shift();
    savePots(); lsSet(LS_OBS, JSON.stringify(obs));
    if (ch) goalCache.clear();
  }

  // Bote esperado para cada racha dentro de la partida actual: exacto en k y k+1, luego con el mismo incremento
  function potLocal(g, k) {
    const pot = g.pot ?? potAt(k);
    const next = g.next ?? pot + CFG.potStep;
    const inc = Math.max(1, next - pot);
    return kk => (kk <= k ? (kk === k ? pot : potAt(kk)) : next + (kk - k - 1) * inc);
  }

  /* ------------------------------------------------------------------ *
   *  ESTRATEGIA
   *
   *  Estado de una partida: cartas que quedan (máscara de 10 bits) y carta actual.
   *  Los aciertos seguidos salen de la máscara: k = 9 − cartas que quedan.
   *  Se elige Mayor o Menor; se saca una de las cartas que quedan (todas igual de
   *  probables); si se acierta se sigue con el bote siguiente; si se falla, se pierde todo.
   *  Plantarse cobra el bote de esa racha.
   * ------------------------------------------------------------------ */
  const FULL = (1 << 10) - 1;
  const POP = Array.from({ length: 1 << 10 }, (_, m) => popcount(m));

  function maskOf(deck) {
    let m = 0;
    for (const n of Object.keys(deck)) if (deck[n] > 0) m |= 1 << (n - 1);
    return m;
  }

  // Recorrido genérico con memoria compartida. leaf(k) = valor/coste de plantarse con racha k; lose = el de fallar;
  // better(a, b) = true si a es mejor que b. V(mask, c) da el valor del estado; ACT[(mask<<4)|c] la acción (0 plantarse, 1 mayor, 2 menor).
  function makeSolver(leaf, lose, better) {
    const memo = new Float64Array(1 << 14).fill(NaN);   // (mask << 4) | c
    const act = new Uint8Array(1 << 14);

    function V(mask, c) {
      const key = (mask << 4) | c;
      const hit = memo[key];
      if (hit === hit) return hit;
      const k = 9 - POP[mask];
      let best = leaf(k), a = 0;
      if (mask) {
        let cnt = 0, up = 0, down = 0, nUp = 0, nDown = 0;
        for (let n = 1; n <= 10; n++) {
          if (!(mask & (1 << (n - 1)))) continue;
          cnt++;
          const nv = V(mask & ~(1 << (n - 1)), n);
          if (n > c) { up += nv; nUp++; } else { down += nv; nDown++; }
        }
        const vUp = (up + nDown * lose) / cnt, vDown = (down + nUp * lose) / cnt;
        const [bv, ba] = better(vUp, vDown) ? [vUp, 1] : [vDown, 2];
        if (better(bv, best) && Math.abs(bv - best) > 1e-9) { best = bv; a = ba; }
      }
      memo[key] = best; act[key] = a;
      return best;
    }
    return { V, act };
  }

  // MODO VALES: maximiza el valor esperado del bote
  function solveEV(deck, card, potFn = potAt) {
    const s = makeSolver(k => potFn(k), 0, (x, y) => x > y);
    const mask = maskOf(deck), val = s.V(mask, card);
    return { a: ['stand', 'mayor', 'menor'][s.act[(mask << 4) | card]], v: val };
  }

  // MODO RESPIROS: minimiza las partidas (= la energía perdida) hasta reunir los vales que faltan.
  // Gr(r) = partidas esperadas cuando aún faltan r vales. Cada partida cuesta 1; al plantarse con racha k faltan r − bote(k).
  // Solo depende de lo que falta, así que se reutiliza entre compras y partidas.
  const goalCache = new Map();
  const potUp = k => Math.max(1, potAt(k));   // siempre avanza (evita bucles si el bote fuera 0)
  function Gr(r) {
    if (r <= 0) return 0;
    if (goalCache.has(r)) return goalCache.get(r);
    const up = [];
    for (let k = 1; k <= CFG.maxK; k++) up[k] = Gr(r - potUp(k));
    // punto fijo: g = 1 + coste medio de una partida jugada óptimamente (fallar o plantarse con 0 = seguir igual = g)
    let g = 6;
    for (let it = 0; it < 80; it++) {
      const s = makeSolver(k => (k === 0 ? g : up[k]), g, (x, y) => x < y);
      let sum = 0;
      for (let c = 1; c <= 10; c++) sum += s.V(FULL & ~(1 << (c - 1)), c);
      const ng = 1 + sum / 10;
      if (Math.abs(ng - g) < 1e-7) { g = ng; break; }
      g = ng;
    }
    goalCache.set(r, g);
    return g;
  }
  const G = (v, T) => Gr(T - v);

  function solveGoal(deck, card, v, T, potFn = potAt) {
    const r = T - v;
    const g = Gr(r);
    const up = [];
    for (let k = 1; k <= CFG.maxK; k++) up[k] = Gr(r - Math.max(1, potFn(k)));
    const s = makeSolver(k => (k === 0 ? g : up[k]), g, (x, y) => x < y);
    const mask = maskOf(deck), val = s.V(mask, card);
    return { a: ['stand', 'mayor', 'menor'][s.act[(mask << 4) | card]], v: val, g };
  }

  /* ------------------------------------------------------------------ *
   *  BUCLE
   * ------------------------------------------------------------------ */
  let running = false, ticking = false, idle = 0;
  let mode = lsGet(LS_MODE, 'respiros');
  let ses = { games: 0, wins: 0, vales0: null, vales: null, energy0: null, respiros: 0 };
  let game = { lastAction: null, stuck: 0 };
  let limitGames = 0, reserve = CFG.defaultReserve;
  let energyPerRespiro = parseInt(lsGet(LS_ER, '1'), 10) || 1;   // un respiro da 1 de energía (se vuelve a medir al comprar)

  const deckSig = g => JSON.stringify([g.card, g.deck]);

  function stop(reason) {
    const iba = running;
    running = false;
    if (reason) log(reason);
    paint();
    // aviso solo si se ha parado sola (no a mano ni al salir de la página)
    if (!iba || !reason || /a mano|Fuera del Sal/i.test(reason)) return;
    const tipo = /^✅/.test(reason) ? 'exito' : /Energía en|sin energía/i.test(reason) ? 'aviso' : 'error';
    const vales = ses.vales != null && ses.vales0 != null ? ses.vales - ses.vales0 : null;
    kAviso({
      tipo, app: 'Salón Malvalona', icono: '🃏',
      titulo: tipo === 'exito' ? (/Cupo/.test(reason) ? '¡Respiros de hoy comprados!' : 'Partidas terminadas') : tipo === 'aviso' ? 'Parado por la energía' : 'El Salón se ha parado',
      texto: tipo === 'exito' ? null : reason,
      lineas: [`🃏 ${ses.games} partidas · 🏆 ${ses.wins} ganadas${vales != null ? ` · 🎟️ ${vales >= 0 ? '+' : ''}${vales} vales` : ''}`, ses.respiros ? `💨 ${ses.respiros} respiros comprados` : null],
    });
  }
  function log(s) { logLine = s; if (logEl) logEl.textContent = s; }

  async function waitChange(prevSig, prevScreen, ms = CFG.changeTimeout) {
    const t0 = Date.now();
    while (running && Date.now() - t0 < ms) {
      const g = readGame();
      if (g.screen !== prevScreen) return g;
      if (g.screen === 'juego' && deckSig(g) !== prevSig) return g;
      await sleep(40);
    }
    return null;
  }

  // Compra un «Un respiro» y aprende cuánta energía da (lo que baja el cupo diario)
  async function comprarRespiro() {
    const b = respiroBtn(false);
    if (!b) return false;
    const antes = { v: readVales(), cupo: readCupo(), en: readEnergy() };
    await sleep(rnd(...CFG.actionDelay));
    if (!running) return false;
    b.click();
    const t0 = Date.now();
    let confirmado = false;
    while (running && Date.now() - t0 < 4000) {
      const v = readVales(), cupo = readCupo();
      if ((v != null && antes.v != null && v < antes.v) || (cupo && antes.cupo && cupo.left < antes.cupo.left)) { confirmado = true; break; }
      // por si el juego pide confirmar la compra
      const ok = findBtn(/^(comprar|confirmar|s[ií]\b|aceptar)/i);
      if (ok) { ok.click(); await sleep(200); }
      await sleep(60);
    }
    if (!confirmado) return false;
    await sleep(CFG.settle);
    const despues = { v: readVales(), cupo: readCupo(), en: readEnergy() };
    if (antes.cupo && despues.cupo && antes.cupo.left > despues.cupo.left) {
      energyPerRespiro = antes.cupo.left - despues.cupo.left;
      lsSet(LS_ER, String(energyPerRespiro));
    }
    ses.respiros++;
    log(`🥤 Respiro comprado (${antes.v} → ${despues.v ?? '?'} vales${energyPerRespiro ? ' · +' + energyPerRespiro + ' energía' : ''})`);
    return true;
  }

  // Vales que faltan para comprar todos los respiros que quedan hoy (T) según el cupo
  function objetivo() {
    const cupo = readCupo();
    const price = respiroPrice();
    if (!cupo) return { cupo: null, price, need: null, T: null };
    if (cupo.left <= 0) return { cupo, price, need: 0, T: 0 };
    const need = Math.ceil(cupo.left / energyPerRespiro);
    return { cupo, price, need, T: need * price };
  }

  async function tick() {
    if (!running || ticking) return;
    ticking = true;
    try {
      const g = readGame();
      ses.vales = readVales() ?? ses.vales;
      if (ses.vales0 == null) ses.vales0 = ses.vales;
      if (ses.energy0 == null) ses.energy0 = readEnergy();

      /* ── Partida en curso ───────────────────────────────────────── */
      if (g.screen === 'juego') {
        idle = 0;
        if (g.disabled || g.card == null) return;           // animación en curso

        const mask = maskOf(g.deck);
        const restantes = POP[mask];
        const k = 9 - restantes;                              // aciertos seguidos, sacado de la baraja
        notePot(g, k);
        const potFn = potLocal(g, k);

        // La cuenta exacta solo vale si los % de la pantalla coinciden con mi cuenta de cartas
        const teo = restantes ? Object.keys(g.deck).filter(n => g.deck[n] > 0 && +n > g.card).length / restantes : null;
        const cuadra = teo != null && g.pUpShown != null && Math.abs(teo - g.pUpShown) <= 0.03;

        let d = null, nota = '';
        if (cuadra) {
          if (mode === 'respiros') {
            const o = objetivo();
            const v = readVales() ?? 0;
            d = o.T ? solveGoal(g.deck, g.card, v, o.T, potFn) : solveEV(g.deck, g.card, potFn);
            nota = o.T ? ` · objetivo ${o.T} vales (~${d.g.toFixed(1)} partidas)` : '';
          } else {
            d = solveEV(g.deck, g.card, potFn);
          }
        } else if (g.pUpShown != null && g.pDownShown != null && g.next != null) {
          // Plan B (un solo paso) con los % que enseña el juego
          const up = g.pUpShown * g.next, down = g.pDownShown * g.next, pot = g.pot ?? 0;
          d = up >= down ? { a: 'mayor', v: up } : { a: 'menor', v: down };
          if (pot >= d.v) d = { a: 'stand', v: pot };
          nota = ' · ⚠ % de pantalla ≠ mi cuenta';
        }
        if (!d) { stop('No puedo leer la baraja ni los %. Parado.'); return; }
        if (d.a === 'stand' && !g.stand) d = { a: (g.pUpShown ?? 0) >= (g.pDownShown ?? 0) ? 'mayor' : 'menor', v: d.v };

        const info = `carta ${g.card} · bote ${g.pot ?? '?'} · racha ${k}${nota}`;
        const prevSig = deckSig(g);
        await sleep(rnd(...CFG.actionDelay));
        if (!running) return;

        if (d.a === 'stand') {
          log(`${info} → Plantarse`);
          game.lastAction = 'stand';
          g.stand.click();
        } else {
          log(`${info} → ${d.a === 'mayor' ? '▲ Mayor' : '▼ Menor'}`);
          game.lastAction = d.a;
          (d.a === 'mayor' ? g.mayor : g.menor).click();
        }
        const after = await waitChange(prevSig, 'juego');
        if (!after) {
          if (++game.stuck >= 3) { stop('El juego no reacciona a los clics. Parado.'); return; }
        } else game.stuck = 0;
        await sleep(CFG.settle);
        return;
      }

      /* ── Inicio o resultado: comprar respiros / empezar otra ────── */
      if (g.screen === 'inicio') {
        idle = 0;
        if (game.lastAction) {   // acaba de terminar una partida
          ses.games++;
          if (game.lastAction === 'stand') ses.wins++;
          game = { lastAction: null, stuck: 0 };
        }

        if (mode === 'respiros') {
          const o = objetivo();
          if (o.cupo && o.cupo.left <= 0) {
            stop(`✅ Cupo completo: ${ses.respiros} respiros con ${ses.games} partidas (energía ${ses.energy0 ?? '?'} → ${readEnergy() ?? '?'}).`);
            return;
          }
          const v = readVales() ?? 0;
          // Se juega hasta reunir los vales de TODOS los respiros que quedan (15 × respiros); entonces se compran seguidos.
          // Excepción: si no se puede jugar más (sin energía), se compra lo que alcance para poder seguir.
          const suficiente = !!o.T && v >= o.T;
          const sinEnergia = !g.canPlay;
          if (respiroBtn(false) && v >= o.price && (suficiente || sinEnergia)) {
            if (suficiente && ses.respiros === 0) log(`🎟️ ${v} vales: compro los ${o.need} respiros que quedan.`);
            if (await comprarRespiro()) return;
          }
          if (!o.cupo && !respiroBtn(true)) { stop('No encuentro el Mostrador ni el cupo de energía. Parado.'); return; }
        }

        if (limitGames > 0 && ses.games >= limitGames) {
          stop(`✅ ${ses.games} partidas hechas. Vales: ${ses.vales != null && ses.vales0 != null ? ses.vales - ses.vales0 : '?'}`);
          return;
        }
        const en = readEnergy();
        if (en != null && en <= reserve) { stop(`Energía en ${en} (reserva ${reserve}). Parado.`); return; }
        if (!g.canPlay) { stop('El botón de jugar está deshabilitado (¿sin energía?). Parado.'); return; }
        await sleep(rnd(...CFG.actionDelay));
        if (!running) return;
        game = { lastAction: null, stuck: 0 };
        g.play.click();
        log('Nueva partida…');
        await waitChange('', 'inicio');
        await sleep(CFG.settle);
        return;
      }

      /* ── Pantalla no reconocida ─────────────────────────────────── */
      idle++;
      const extra = findBtn(/^(continuar|seguir|aceptar|volver|de acuerdo|vale)/i);
      if (extra) { log('Click: ' + btnText(extra)); extra.click(); await sleep(300); idle = 0; return; }
      if (idle > 25) {
        const vistos = $$('button').filter(b => !enPanel(b)).map(btnText).filter(Boolean).slice(0, 4).join(' | ');
        stop('No reconozco la pantalla (botones: ' + (vistos || 'ninguno') + '). Parado.');
      }
    } catch (e) {
      console.error('[SalonAuto]', e);
      stop('Error: ' + e.message);
    } finally {
      ticking = false;
      paint();
    }
  }

  async function loop() {
    while (running) {
      await tick();
      await sleep(60);
    }
  }

  function start() {
    if (!enSalon() || running) return;
    const manual = mode !== 'respiros';   // en modo Respiros manda el objetivo, no estos campos
    limitGames = manual ? Math.max(0, parseInt(panel.querySelector('.ax-games').value, 10) || 0) : 0;
    reserve = manual ? Math.max(0, parseInt(panel.querySelector('.ax-reserve').value, 10) || 0) : 0;
    if (manual) { lsSet(LS_GAMES, String(limitGames)); lsSet(LS_RESERVE, String(reserve)); }
    running = true; idle = 0;
    game = { lastAction: null, stuck: 0 };
    ses = { games: 0, wins: 0, vales0: readVales(), vales: readVales(), energy0: readEnergy(), respiros: 0 };
    kPedirPermiso();
    log(mode === 'respiros' ? 'Objetivo: comprar todos los respiros de hoy…' : 'Jugando para maximizar vales…');
    paint();
    loop();
  }

  /* ------------------------------------------------------------------ *
   *  PANEL
   * ------------------------------------------------------------------ */
  const UP = '#' + PANEL_ID;
  let panel = null, logEl = null;
  let logLine = 'Cuenta cartas y decide con el valor esperado exacto.';

  function buildPanel() {
    kStyle('ax-salon-kit', UP, '#C2416E');
    const sec = document.createElement('section');
    sec.id = PANEL_ID;
    sec.className = 'tarjeta space-y-3 p-3';
    sec.setAttribute('data-ax-ignore', '1');
    sec.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="k-ico rounded-card border-2 border-crema-200 bg-crema-100">🎴</span>
        <div class="min-w-0 flex-1">
          <p class="font-display text-base font-extrabold leading-tight">Sube o Baja · Automático</p>
          <p class="k-sub truncate text-[11px] font-bold text-tinta-400"></p>
        </div>
        <span class="${K_BADGE.off}" data-s="off"><span class="k-dot"></span><span class="k-badge-t">LISTO</span></span>
      </div>
      <div class="ax-modes k-seg">
        <button type="button" data-mode="respiros"><span>🥤</span><span>Respiros</span><span class="text-[10px] font-bold opacity-70">compra todo el cupo diario</span></button>
        <button type="button" data-mode="vales"><span>🎟️</span><span>Vales</span><span class="text-[10px] font-bold opacity-70">máximo valor esperado</span></button>
      </div>
      <div class="ax-limits grid grid-cols-2 gap-2" title="En modo Respiros no se usan: juega hasta reunir los vales justos">
        <label class="block text-[10px] font-extrabold uppercase text-tinta-400">Partidas (0 = sin límite)
          <input type="number" min="0" class="ax-games ${K_FIELD}"></label>
        <label class="block text-[10px] font-extrabold uppercase text-tinta-400">Dejar de energía
          <input type="number" min="0" class="ax-reserve ${K_FIELD}"></label>
      </div>
      <button type="button" class="boton-principal w-full" data-ax="go">▶ Jugar solo</button>
      <button type="button" class="boton-secundario w-full" data-ax="stop" hidden>■ Parar</button>
      <div class="k-tiles">
        <div class="${K_TILE}"><b class="ax-t-games tabular-nums">0</b><small>Partidas</small></div>
        <div class="${K_TILE}"><b class="ax-t-vales tabular-nums">–</b><small>Vales</small></div>
        <div class="${K_TILE}"><b class="ax-t-en tabular-nums">–</b><small>Energía</small></div>
        <div class="${K_TILE}"><b class="ax-t-resp tabular-nums">0</b><small>Respiros</small></div>
      </div>
      <p class="ax-goal text-center text-[11px] font-bold text-tinta-400"></p>
      <p class="rounded-card border-2 border-crema-200 bg-crema-50 p-2 text-center text-[11px] font-bold text-tinta-600" data-ax="log"></p>
      <details class="rounded-card border-2 border-crema-200 bg-crema-50">
        <summary class="cursor-pointer list-none p-2 text-[11px] font-extrabold text-tinta-500">📈 Lo aprendido ▾</summary>
        <div class="space-y-1 px-2 pb-2 text-[11px] font-semibold text-tinta-500">
          <p class="ax-learn"></p>
          <button type="button" class="boton-suave w-full !py-2 text-[11px]" data-ax="copy">📋 Copiar observaciones del bote</button>
          <button type="button" class="boton-suave w-full !py-2 text-[11px]" data-ax="reset">Olvidar lo aprendido</button>
        </div>
      </details>`;
    sec.querySelector('.ax-games').value = lsGet(LS_GAMES, String(CFG.defaultGames));
    sec.querySelector('.ax-reserve').value = lsGet(LS_RESERVE, String(CFG.defaultReserve));
    logEl = sec.querySelector('[data-ax="log"]');
    logEl.textContent = logLine;
    const on = (sel, fn) => sec.querySelector(sel).addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); fn(); });
    on('[data-ax="go"]', start);
    on('[data-ax="stop"]', () => stop('Parado a mano.'));
    on('[data-ax="copy"]', async () => {
      const json = JSON.stringify(obs);
      try { await navigator.clipboard.writeText(json); log('📋 ' + obs.length + ' observaciones copiadas al portapapeles.'); }
      catch { log('No pude copiar; están en la consola: window.__axSalon.obs'); console.log(json); }
    });
    on('[data-ax="reset"]', () => {
      if (!confirm('¿Olvidar los botes, las observaciones y la energía por respiro aprendidos?')) return;
      potStats = {}; obs = []; lsSet(LS_OBS, '[]'); savePots(); goalCache.clear();
      energyPerRespiro = 1; lsSet(LS_ER, '1');
      log('Aprendizaje reiniciado.'); paint();
    });
    for (const b of sec.querySelectorAll('.ax-modes > button')) {
      b.addEventListener('click', e => {
        e.preventDefault(); e.stopPropagation();
        if (running) return;
        mode = b.dataset.mode; lsSet(LS_MODE, mode); paint();
      });
    }
    return sec;
  }

  function paint() {
    if (!panel) return;
    kBadge(panel.querySelector('.k-badge'), running ? 'on' : 'off', running ? 'JUGANDO' : 'LISTO');
    kSet(panel.querySelector('.k-sub'), mode === 'respiros' ? 'Vales justos, con las menos partidas posibles' : 'Maximiza los vales de cada partida');
    panel.querySelector('[data-ax="go"]').hidden = running;
    panel.querySelector('[data-ax="stop"]').hidden = !running;
    for (const i of panel.querySelectorAll('input')) i.disabled = running || mode === 'respiros';
    panel.querySelector('.ax-limits').style.opacity = mode === 'respiros' ? '.45' : '';
    for (const b of panel.querySelectorAll('.ax-modes > button')) {
      const cls = mode === b.dataset.mode ? K_ON : K_OFF;
      if (b.className !== cls) b.className = cls;
      b.disabled = running && mode !== b.dataset.mode;
    }

    const v = readVales();
    const ganado = ses.vales != null && ses.vales0 != null ? ses.vales - ses.vales0 : null;
    kSet(panel.querySelector('.ax-t-games'), String(ses.games));
    kSet(panel.querySelector('.ax-t-vales'), v != null ? String(v) : '–');
    const en = readEnergy();
    kSet(panel.querySelector('.ax-t-en'), en != null ? String(en) : '–');
    kSet(panel.querySelector('.ax-t-resp'), String(ses.respiros));

    const o = objetivo();
    kSet(panel.querySelector('.ax-goal'),
      mode !== 'respiros' ? (ganado != null && ses.games ? `Ganado en esta sesión: ${ganado >= 0 ? '+' : ''}${ganado} vales` : '')
        : !o.cupo ? 'Abre el Mostrador para leer el cupo diario'
          : o.cupo.left <= 0 ? '✅ Cupo de energía de hoy completo'
            : `🎯 Quedan ${o.cupo.left} de ${o.cupo.total} de energía por comprar: ${o.need} respiros · ${o.T} vales (tienes ${v ?? '?'})${goalCache.has(o.T - (v ?? 0)) ? ' · ≈ ' + goalCache.get(o.T - (v ?? 0)).toFixed(1) + ' partidas' : ''}`);

    kSet(panel.querySelector('.ax-learn'),
      `💰 Bote medio tras 0, 1, 2… aciertos: ${Array.from({ length: CFG.maxK + 1 }, (_, k) => Math.round(potAt(k))).join(' → ')} · ${obs.length} observaciones`);
  }
  setInterval(() => { if (running) paint(); }, 1000);

  function ensurePanel() {
    if (!enSalon()) {
      if (panel && panel.parentElement) panel.remove();
      if (running) stop('Fuera del Salón. Parado.');
      return;
    }
    const h1 = $$('h1').find(h => /sal[oó]n malvalona/i.test(txt(h)));
    const cab = h1 && h1.closest('section');
    if (!cab || !cab.parentElement) return;
    if (!panel) { panel = buildPanel(); paint(); }
    if (panel.previousElementSibling !== cab) cab.insertAdjacentElement('afterend', panel);
  }

  // Para poder probar la estrategia sin la web
  window.__axSalon = { solveEV, solveGoal, G, readGame, potAt, potLocal, maskOf, get obs() { return obs; }, mainText, readVales, readCupo };

  esperarHidratacion().then(() => {
    ensurePanel();
    setInterval(ensurePanel, 800);
  });
})();
