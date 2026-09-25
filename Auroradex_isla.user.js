// ==UserScript==
// @name         Aurora Dex · Isla Espejismo (qué evolucionar)
// @namespace    auroradex-isla
// @version      1.3.0
// @description  Solo en /isla. Cada especie distinta que tengas en la isla da 10 puntos, así que dice a quién meter en el equipo para que evolucione a una especie que aún no tienes (a qué nivel, cuántos le faltan y qué día lo permite el tope), y a quién sacar porque su evolución ya la tienes o no evoluciona subiendo de nivel. Las evoluciones salen de PokéAPI (solo se manda el nº de la especie) y se guardan.
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

  let prog = null;
  function programar() { clearTimeout(prog); prog = setTimeout(() => { try { pintar(); } catch (e) { console.warn('[axi]', e); } }, 300); }
  new MutationObserver(muts => {
    if (!enIsla() && !document.getElementById('axi-panel')) return;
    if (muts.every(m => [...m.addedNodes].every(n => n.nodeType === 1 && (n.id === 'axi-panel' || (n.classList && n.classList.contains('axi-marca')))))) return;
    programar();
  }).observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(programar, 1800);
})();
