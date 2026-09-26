// ==UserScript==
// @name         Aurora Dex · Cazador de Manadas
// @namespace    aurora-dex-manadas
// @version      1.3.1
// @description  Lee las pistas del Canal Manadas, cambia de región solo, recorre el mapa buscando el tramo que cuadra y para en cuanto encuentra la manada.
// @match        https://auroradex.es/*
// @match        https://www.auroradex.es/*
// @updateURL    https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_manadas.user.js
// @downloadURL  https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_manadas.user.js
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
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


  /* ─────────────────────────── 0 · ¿estamos en la app? ─────────────────────── */

  const esApp = () =>
    !!document.querySelector('meta[name="application-name"][content="Aurora Dex"]') ||
    !!document.querySelector('nav a[href="/mapa"]');

  /* ─────────────────────────── 1 · utilidades ──────────────────────────────── */

  const SLEEP  = ms => new Promise(r => setTimeout(r, ms));
  const all    = sel => Array.from(document.querySelectorAll(sel));
  const txt    = el => (el?.textContent || '').replace(/\s+/g, ' ').trim();
  const norm   = s => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                      .toLowerCase().replace(/[«»"'`´¡!¿?]/g, '').replace(/\s+/g, ' ').trim();
  const esc    = s => (s || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const porTexto = (sel, re) => all(sel).find(el => re.test(txt(el)));

  class Cancelado extends Error {}

  function debounce(fn, ms) {
    let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  }

  // Espera activa: se corta sola si el usuario pulsa PARAR.
  async function esperar(fn, { timeout = 20000, paso = 60, label = 'algo' } = {}) {
    const t0 = Date.now();
    for (;;) {
      if (!E().running) throw new Cancelado();
      let v = null;
      try { v = fn(); } catch { v = null; }
      if (v) return v;
      if (Date.now() - t0 > timeout) throw new Error('Se acabó el tiempo esperando ' + label + '.');
      await SLEEP(paso);
    }
  }

  // Como esperar(), pero si se acaba el tiempo devuelve null en vez de lanzar error (una parada manual sí corta)
  async function intentar(fn, opts) {
    try { return await esperar(fn, opts); } catch (e) { if (e instanceof Cancelado) throw e; return null; }
  }

  // Texto visible de la página sin contar el panel del script.
  function textoPagina() {
    const t = document.body.innerText || '';
    const p = document.getElementById('mh-panel');
    return p ? t.replace(p.innerText || '', '') : t;
  }

  /* ─────────────────────────── 2 · estado (sobrevive a recargas) ───────────── */

  const KEY  = 'adx:cazador-manadas';
  const E    = () => { try { return JSON.parse(sessionStorage.getItem(KEY) || '{}') || {}; } catch { return {}; } };
  const setE = p => { const s = { ...E(), ...p }; sessionStorage.setItem(KEY, JSON.stringify(s)); pintar(); return s; };
  const borrarE = () => { sessionStorage.removeItem(KEY); pintar(); };
  const decir = (msg, sub = '') => setE({ msg, sub });

  /* ─────────────────────────── 3 · panel flotante (con el estilo del juego) ── */

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

  const U = '#mh-panel';
  const CSS = `
  #mh-panel{position:fixed;left:50%;transform:translate(-50%,0);
    bottom:calc(var(--nav-alto, 4rem) + 5.25rem + env(safe-area-inset-bottom, 0px));
    z-index:2147483000;width:min(380px,calc(100vw - 2rem));box-sizing:border-box;
    opacity:1;transition:opacity .25s ease, transform .25s ease}
  #mh-panel[data-on="0"]{opacity:0;transform:translate(-50%,8px);pointer-events:none}
  #mh-panel .mh-tried{display:flex;flex-wrap:wrap;gap:4px}
  #mh-panel .mh-tried span{font-size:10px;padding:1px 8px}
  `;

  function crearPanel() {
    if (document.getElementById('mh-panel')) return;
    kStyle('mh-kit', U, '#2FA84F');
    if (!document.getElementById('mh-css')) {
      const s = document.createElement('style');
      s.id = 'mh-css'; s.textContent = CSS;
      document.head.appendChild(s);
    }
    const p = document.createElement('div');
    p.id = 'mh-panel';
    p.dataset.on = '0';
    document.body.appendChild(p);
  }

  let firmaAnterior = '';
  let relojMh = null;
  function pintar() {
    crearPanel();
    const p = document.getElementById('mh-panel');
    if (!p) return;
    const e = E();
    const vivo = !!(e.msg || e.running);
    const probados = e.probados || [];
    const firma = JSON.stringify([vivo, !!e.running, !!e.ok, !!e.err, e.msg, e.sub, probados.length, e.region]);
    if (firma === firmaAnterior) { kSet(p.querySelector('.mh-time'), e.inicio ? kTime(Date.now() - e.inicio) : ''); return; }
    firmaAnterior = firma;
    p.dataset.on = vivo ? '1' : '0';
    clearInterval(relojMh);
    if (!vivo) { p.innerHTML = ''; return; }

    const estado = e.running ? ['on', 'BUSCANDO'] : e.ok ? ['ok', 'ENCONTRADA'] : e.err ? ['err', 'SIN SUERTE'] : ['off', 'PARADO'];
    const ico = e.running ? '📺' : e.ok ? '🎯' : e.err ? '⚠️' : '⏹';
    const titulo = e.directo ? (e.pokemon || e.region || 'Manada') : (e.region || 'Manada');
    const detalle = e.directo ? (e.lugar ? `Destino: ${e.lugar}` : '') :
      (e.min != null ? `Nv.${e.min}–${e.max}${e.tipoElemental ? ' · ' + e.tipoElemental : ''}` : '');

    p.innerHTML = `
      <div class="tarjeta space-y-2 p-3 shadow-float">
        <div class="flex items-center gap-3">
          <span class="k-ico rounded-card border-2 border-crema-200 bg-crema-100">${ico}</span>
          <div class="min-w-0 flex-1">
            <p class="truncate font-display text-base font-extrabold leading-tight">${kEsc(titulo)}</p>
            <p class="truncate text-[11px] font-bold text-tinta-400">${kEsc(detalle)}${e.inicio ? ' · <span class="mh-time tabular-nums"></span>' : ''}</p>
          </div>
          ${kBadgeHTML()}
          ${e.running ? '' : '<button type="button" class="mh-x k-x boton-suave" aria-label="Cerrar">✕</button>'}
        </div>
        <div class="rounded-card border-2 p-2 ${e.ok ? 'border-hoja-300 bg-hoja-50 text-hoja-700' : e.err ? 'border-rojo-100 bg-lienzo text-rojo-600' : 'border-crema-200 bg-crema-50 text-tinta-600'}">
          <p class="text-sm font-extrabold leading-snug">${kEsc(e.msg || '')}</p>
          ${e.sub ? `<p class="mt-0.5 text-[11px] font-semibold leading-snug opacity-80">${kEsc(e.sub)}</p>` : ''}
        </div>
        ${!e.directo && probados.length ? `
          <div>
            <p class="mb-1 text-[11px] font-extrabold text-tinta-500">🧭 Tramos mirados · ${probados.length}</p>
            <div class="mh-tried">${probados.slice(-8).map((n, i, arr) =>
              `<span class="pastilla border-2 ${i === arr.length - 1 && e.running ? 'border-ambar-200 bg-ambar-50 text-ambar-700' : 'border-crema-200 bg-crema-50 text-tinta-500'}">${kEsc(n)}</span>`).join('')}</div>
          </div>` : ''}
        ${e.running ? '<button type="button" id="mh-stop" class="boton-secundario w-full !py-2 text-xs">■ PARAR</button>' : ''}
      </div>`;
    kBadge(p.querySelector('.k-badge'), estado[0], estado[1]);
    const tEl = p.querySelector('.mh-time');
    if (tEl) { kSet(tEl, kTime(Date.now() - e.inicio)); if (e.running) relojMh = setInterval(() => kSet(tEl, kTime(Date.now() - e.inicio)), 1000); }
    const stop = p.querySelector('#mh-stop');
    if (stop) stop.onclick = () => finalizarAviso({ running: false, msg: 'Búsqueda detenida.', sub: '' }, 1800);
    const x = p.querySelector('.mh-x');
    if (x) x.onclick = () => { clearTimeout(temporizadorCierre); borrarE(); };
  }

  /* ─────────────────────────── 4 · leer las secciones del Canal ────────────── */

  const REGIONES = ['kanto', 'johto', 'hoenn', 'sinnoh', 'teselia'];

  function leerSecciones() {
    return all('section').map(sec => {
      const h2 = sec.querySelector('h2');
      if (!h2) return null;
      const nombre = txt(h2);
      if (!REGIONES.includes(norm(nombre))) return null;

      // Formato ya revelado: tarjeta verde con el sprite, el nombre del Pokémon
      // y «en <lugar>» — ya no hace falta adivinar, solo ir hasta allí.
      const sprite = sec.querySelector('img[src*="/sprites/"]');
      if (sprite) {
        const caja = sprite.closest('div');
        const spans = caja ? Array.from(caja.querySelectorAll('span.block')) : [];
        const pokemon = txt(spans[0]);
        const lugar = txt(spans[1]).replace(/^en\s+/i, '').trim();
        if (pokemon && lugar) return { sec, nombre, tipo: 'revelada', pokemon, lugar };
        return null;
      }

      // Formato acertijo: dos citas «…» (la de tipo y, dentro de la segunda,
      // la pista del sitio) más un rango «Nv.X-Y» en algún punto del texto.
      // Se detecta por estructura, no por una frase fija, para no depender
      // de cómo redacte el juego el texto de turno.
      const t = txt(sec);
      const citas = Array.from(t.matchAll(/«([^«»]{4,})»/g)).map(c => c[1].trim());
      if (citas.length < 2) return null;
      // «Nv.39–41» o, como ahora, «zona de Nv.39 a Nv.41»
      const mNivel = t.match(/Nv\.?\s*(\d+)\s*(?:[-–—]|\ba\b|\bal\b|\bhasta\b)\s*(?:Nv\.?\s*)?(\d+)/i);
      if (!mNivel) return null;
      const tipoElemental = (t.match(/tipo ([A-ZÁÉÍÓÚÑ][\wáéíóúñ]*(?:\s+y\s+[A-ZÁÉÍÓÚÑ][\wáéíóúñ]*)?(?:\s+pur[oa])?)/) || [])[1] || '';
      const pista = citas[citas.length - 1]; // la cita más interna es la del sitio

      return { sec, nombre, tipo: 'acertijo', pista, min: +mNivel[1], max: +mNivel[2], tipoElemental: tipoElemental.trim() };
    }).filter(Boolean);
  }

  /* ─────────────────────────── 5 · botones dentro de la app ────────────────── */

  function inyectar() {
    for (const s of leerSecciones()) {
      if (s.sec.querySelector('[data-mh-btn]')) continue;
      const caja = document.createElement('div');
      caja.dataset.mhBtn = '1';
      caja.className = 'pt-1';

      if (s.tipo === 'revelada') {
        caja.innerHTML =
          '<button type="button" class="boton-principal w-full flex-col !gap-0 py-2.5">' +
          `<span class="text-base">🎯 IR A ${esc(s.lugar).toUpperCase()}</span>` +
          `<span class="text-[11px] font-bold normal-case opacity-90">${esc(s.nombre)} · ${esc(s.pokemon)}</span></button>`;
        caja.querySelector('button').addEventListener('click', ev => {
          ev.preventDefault(); ev.stopPropagation(); arrancarViajeDirecto(s);
        });
      } else {
        caja.innerHTML =
          '<button type="button" class="boton-principal w-full flex-col !gap-0 py-2.5">' +
          '<span class="text-base">🔎 BUSCAR ESTA MANADA</span>' +
          `<span class="text-[11px] font-bold normal-case opacity-90">${esc(s.nombre)} · Nv.${s.min}–${s.max}` +
          `${s.tipoElemental ? ' · ' + esc(s.tipoElemental) : ''}</span></button>`;
        caja.querySelector('button').addEventListener('click', ev => {
          ev.preventDefault(); ev.stopPropagation(); arrancarBusqueda(s);
        });
      }
      s.sec.appendChild(caja);
    }
  }


  // Si ya hay una búsqueda en marcha, la corta y espera a que su bucle termine antes de empezar la nueva
  async function pararLaAnterior() {
    if (!E().running) return true;
    if (!confirm('Ya hay una búsqueda en marcha. ¿La reinicio?')) return false;
    setE({ running: false });
    for (let i = 0; i < 80 && enMarcha; i++) await SLEEP(50);
    return true;
  }

  async function arrancarBusqueda(s) {
    if (!await pararLaAnterior()) return;
    setE({
      running: true, ok: false, err: false, directo: false,
      region: s.nombre, min: s.min, max: s.max, pista: s.pista, tipoElemental: s.tipoElemental,
      probados: [], sueltos: 0, ultimo: '', inicio: Date.now(),
      msg: 'Empezando…', sub: `Nv.${s.min}–${s.max}${s.tipoElemental ? ' · ' + s.tipoElemental : ''}`
    });
    cazar();
  }

  async function arrancarViajeDirecto(s) {
    if (!await pararLaAnterior()) return;
    setE({
      running: true, ok: false, err: false, directo: true,
      region: s.nombre, lugar: s.lugar, pokemon: s.pokemon, inicio: Date.now(),
      msg: 'Empezando…', sub: `${s.nombre} · ${s.lugar}`
    });
    irDirecto();
  }

  /* ─────────────────────────── 6 · piezas de la interfaz del juego ─────────── */

  // Botón de medallas de la cabecera (abre «Cambiar de región»).
  const botonMedallas = () =>
    document.querySelector('button[title*="cambiar de"]') ||
    document.querySelector('button[title*="Medallas"]') ||
    all('header button').find(b => /\d+\s*\/\s*\d+/.test(txt(b)) && b.querySelector('svg'));

  // Raíz del panel «Cambiar de región».
  function panelRegiones() {
    const b = all('li button').find(x => /toca para viajar/i.test(txt(x)));
    return b ? (b.closest('ul')?.parentElement || null) : null;
  }

  function regionDelPanel(raiz) {
    const etiqueta = Array.from(raiz.querySelectorAll('span'))
      .find(s => !s.children.length && /estas aqui/.test(norm(s.textContent)));
    if (!etiqueta) return null;
    return txt(etiqueta.parentElement).replace(txt(etiqueta), '').trim();
  }

  // Chapa «MAPA DE KANTO» de la ficha de tramo.
  function regionDeLaChapa() {
    const el = all('span,div,button,p').find(e => /^mapa de [a-z]+$/.test(norm(txt(e))));
    return el ? norm(txt(el)).replace(/^mapa de /, '') : null;
  }

  // Cierra un modal buscando su botón de cerrar o su fondo oscuro.
  function cerrarModal() {
    const x = document.querySelector('button[aria-label*="errar" i], button[aria-label*="lose" i]') ||
              all('button').find(b => /^[✕✖×]$/.test(txt(b)));
    if (x) { x.click(); return; }
    const fondo = all('[class*="fixed"][class*="inset-0"]').find(el => !el.closest('#mh-panel'));
    if (fondo) fondo.click();
  }

  // Lista de tramos («Ver mapa completo»).
  function listaViaje() {
    return all('ol').find(o => o.querySelector('li button') && /Nv\./.test(o.textContent)) || null;
  }

  function leerLista() {
    const ol = listaViaje();
    if (!ol) return [];
    return Array.from(ol.querySelectorAll('li button'))
      .filter(b => !/^ver que/i.test(b.getAttribute('aria-label') || ''))
      .map(b => {
        const nombre = txt(b.querySelector('span.truncate')) || txt(b).slice(0, 36);
        const estado = txt(b.querySelector('span.uppercase'));
        const m = txt(b).match(/Nv\.\s*(\d+)\s*[–—-]\s*(\d+)/);
        return {
          btn: b, nombre, estado,
          min: m ? +m[1] : null,
          max: m ? +m[2] : null,
          aqui: /estas aqui/.test(norm(estado)),
          cerrado: (b.disabled && !/estas aqui/.test(norm(estado))) || /bloquead/.test(norm(estado))
        };
      })
      .filter(r => r.nombre);
  }

  /* ─────────────────────────── 7 · movimientos ─────────────────────────────── */

  async function irAlMapa() {
    if (/^\/mapa/.test(location.pathname)) return;
    decir('Yendo al mapa…');
    const enlace = document.querySelector('nav a[href="/mapa"]') || document.querySelector('a[href="/mapa"]');
    if (enlace) enlace.click(); else location.href = '/mapa';
    await esperar(() => /^\/mapa/.test(location.pathname), { label: 'el mapa' });
    await intentar(() => regionDeLaChapa() || porTexto("a,button", /mapa completo/i), { timeout: 6000, label: "el mapa" });
    await SLEEP(120);
  }

  async function confirmarRegion(destino) {
    try {
      await esperar(() => {
        const r = regionDeLaChapa();
        return r && r === norm(destino);
      }, { timeout: 9000, label: 'el cambio de región' });
      return true;
    } catch (e) { if (e instanceof Cancelado) throw e; }

    const medallas = botonMedallas();
    if (!medallas) return false;
    medallas.click();
    const raiz = await esperar(panelRegiones, { label: 'el panel de regiones' });
    const actual = regionDelPanel(raiz);
    cerrarModal();
    await SLEEP(150);
    return !!actual && norm(actual) === norm(destino);
  }

  async function asegurarRegion(destino) {
    decir('Mirando en qué región estás…');

    const chapa = regionDeLaChapa();
    if (chapa && chapa === norm(destino)) { decir(`Ya estás en ${destino}.`); return; }

    const medallas = botonMedallas();
    if (!medallas) throw new Error('No encuentro el botón de medallas de la cabecera.');
    medallas.click();

    const raiz = await esperar(panelRegiones, { label: 'el panel «Cambiar de región»' });
    const actual = regionDelPanel(raiz);
    if (actual && norm(actual) === norm(destino)) {
      cerrarModal(); await SLEEP(150);
      decir(`Ya estás en ${destino}.`);
      return;
    }

    const btn = Array.from(raiz.querySelectorAll('li button'))
      .find(b => norm(txt(b.querySelector('span.font-extrabold') || b)).startsWith(norm(destino)));
    if (!btn) throw new Error(`No veo ${destino} en la lista de regiones.`);
    if (btn.disabled) throw new Error(`${destino} está bloqueada.`);

    decir(`Cambiando a ${destino}…`, actual ? `Vienes de ${actual}` : '');
    btn.click();

    try { await esperar(() => !panelRegiones(), { timeout: 15000, label: 'que se cierre el panel' }); }
    catch (e) { if (e instanceof Cancelado) throw e; }

    await irAlMapa();
    if (!await confirmarRegion(destino)) throw new Error(`No he podido confirmar que estemos en ${destino}.`);
    decir(`Ya en ${destino}.`);
  }

  async function abrirLista() {
    if (listaViaje()) return listaViaje();
    await irAlMapa();
    const abridor =
      porTexto('a,button', /ver mapa completo/i) ||
      porTexto('a,button', /mapa completo/i) ||
      porTexto('a,button', /^viajar/i);
    if (!abridor) throw new Error('No encuentro el enlace «Ver mapa completo» en el mapa.');
    abridor.click();
    return esperar(listaViaje, { label: 'la lista de tramos' });
  }

  /* ─────────────────────────── 8 · ¿la manada está aquí? ───────────────────── */

  function manadaAqui(e) {
    if (!/^\/mapa/.test(location.pathname)) return false;
    const cuerpo = norm(textoPagina());
    const pista  = norm(e.pista || '').replace(/[.;,]+$/, '');
    if (pista.length >= 12 && cuerpo.includes(pista)) return 'pista';
    const btn = all('button').find(b => /manada/i.test(txt(b)) && !b.closest('#mh-panel'));
    if (btn) return 'boton';
    return false;
  }

  const fichaLista = () => /fauna de nv|terreno de/.test(norm(textoPagina()));

  // Nombre del tramo donde estás (el título de la ficha), sin recurrir a lo guardado
  const tramoActual = () => {
    if (!/^\/mapa/.test(location.pathname)) return '';
    const h1 = txt(document.querySelector('h1'));
    return h1 && !/canal manadas/i.test(h1) ? h1 : '';
  };

  function nombreDelTramo() {
    const h1 = txt(document.querySelector('h1'));
    return h1 && !/canal manadas/i.test(h1) ? h1 : (E().ultimo || E().lugar || '');
  }

  /* ─────────────────────────── 9 · elegir el siguiente tramo ───────────────── */

  async function siguienteCandidato(e) {
    await abrirLista();
    const probados = new Set((E().probados || []).map(norm));
    const filas = leerLista().filter(r =>
      !r.cerrado && !r.aqui && r.min != null && !probados.has(norm(r.nombre)));
    if (!filas.length) return null;

    const exactos = filas.filter(r => r.min === e.min && r.max === e.max);
    if (exactos.length) return exactos[0];

    // Ningún tramo cuadra al dedillo: probamos los más cercanos, pero pocos.
    if ((E().sueltos || 0) >= 3) return null;
    setE({ sueltos: (E().sueltos || 0) + 1 });
    filas.sort((a, b) =>
      (Math.abs(a.min - e.min) + Math.abs(a.max - e.max)) -
      (Math.abs(b.min - e.min) + Math.abs(b.max - e.max)));
    return filas[0];
  }

  /* ─────────────────────────── 10 · los dos bucles ──────────────────────────── */

  let enMarcha = false;

  // A) Búsqueda por pista: prueba tramos hasta que uno cuadra.
  async function cazar() {
    if (enMarcha) return;
    enMarcha = true;
    try {
      const e = E();
      if (!e.running) return;

      await asegurarRegion(e.region);
      await irAlMapa();

      for (let i = 0; i < 40; i++) {
        if (!E().running) throw new Cancelado();

        const yaEsta = manadaAqui(E());
        if (yaEsta) return encontrada(yaEsta);

        decir('Buscando el tramo que cuadra…', `Nv.${e.min}–${e.max} en ${e.region}`);
        const c = await siguienteCandidato(E());
        if (!c) {
          const aqui = leerLista().find(r => r.aqui && r.min === e.min && r.max === e.max);
          cerrarModal();
          return aqui
            ? terminar(true, `Tu tramo actual (${aqui.nombre}) tiene el nivel de la pista: la manada debe de estar aquí.`)
            : terminar(false, 'No queda ningún tramo que cuadre con la pista.');
        }

        setE({ probados: [...(E().probados || []), c.nombre], ultimo: c.nombre });
        decir(`Mirando ${c.nombre}…`, `Nv.${c.min}–${c.max} · intento ${i + 1}`);
        c.btn.click();

        try { await esperar(() => !listaViaje(), { timeout: 10000, label: 'que se cierre la lista' }); }
        catch (err) { if (err instanceof Cancelado) throw err; cerrarModal(); }
        await SLEEP(120);
        try { await esperar(fichaLista, { timeout: 12000, label: 'la ficha del tramo' }); }
        catch (err) { if (err instanceof Cancelado) throw err; }

        const hay = manadaAqui(E());
        if (hay) return encontrada(hay);
      }
      terminar(false, 'Demasiados intentos, lo dejo aquí.');
    } catch (err) {
      if (err instanceof Cancelado) finalizarAviso({ running: false, msg: 'Búsqueda detenida.', sub: '' }, 1800);
      else terminar(false, err?.message || String(err));
    } finally {
      enMarcha = false;
    }
  }

  // B) Viaje directo: ya sabemos el tramo exacto (formato revelado), solo hay que llegar.
  async function irDirecto() {
    if (enMarcha) return;
    enMarcha = true;
    try {
      const e = E();
      if (!e.running) return;

      await asegurarRegion(e.region);
      await irAlMapa();

      // ¿Ya estás en el tramo? Sin abrir la lista siquiera.
      if (tramoActual() && norm(tramoActual()) === norm(e.lugar)) return encontrada('directo');

      decir(`Yendo a ${e.lugar}…`, e.pokemon || '');

      await abrirLista();
      const fila = leerLista().find(r => norm(r.nombre) === norm(e.lugar));
      if (!fila) throw new Error(`No encuentro «${e.lugar}» en la lista de tramos.`);
      if (fila.aqui) { cerrarModal(); await SLEEP(150); return encontrada('directo'); }   // la lista dice «Estás aquí»
      if (fila.cerrado) throw new Error(`«${e.lugar}» está bloqueado todavía.`);

      fila.btn.click();
      try { await esperar(() => !listaViaje(), { timeout: 10000, label: 'que se cierre la lista' }); }
      catch (err) { if (err instanceof Cancelado) throw err; cerrarModal(); }
      await SLEEP(120);
      try { await esperar(fichaLista, { timeout: 12000, label: 'la ficha del tramo' }); }
      catch (err) { if (err instanceof Cancelado) throw err; }

      encontrada('directo');
    } catch (err) {
      if (err instanceof Cancelado) finalizarAviso({ running: false, msg: 'Búsqueda detenida.', sub: '' }, 1800);
      else terminar(false, err?.message || String(err));
    } finally {
      enMarcha = false;
    }
  }

  /* ─────────────────────────── 11 · avisos finales ──────────────────────────── */

  const DURACION_ERROR = 4200;

  // Mensaje breve con el aviso del kit (con su sonido de información)
  function toastDiscreto(msg) {
    clearTimeout(temporizadorCierre);
    borrarE();
    kAviso({ tipo: 'info', app: 'Cazador de Manadas', icono: '🐾', titulo: msg, duracion: 3500, sistema: false });
  }

  function encontrada() {
    const e = E();
    const donde = e.directo ? (e.lugar || nombreDelTramo()) : nombreDelTramo();
    toastDiscreto(e.directo
      ? `Ya estás en ${donde}${e.pokemon ? ' · ' + e.pokemon : ''}`
      : `Manada de ${e.region} en ${donde || 'este tramo'}`);
  }

  function terminar(ok, msg) {
    if (ok) toastDiscreto(msg);
    else {
      finalizarAviso({ running: false, ok, err: true, msg, sub: '' }, DURACION_ERROR);
      kAviso({ tipo: 'error', app: 'Cazador de Manadas', titulo: 'La búsqueda se ha parado', texto: msg });
    }
  }

  let temporizadorCierre = null;

  function finalizarAviso(patch, duracion) {
    setE({ ...patch, avisadoEn: Date.now(), duracionAviso: duracion });
    programarCierre(duracion);
  }

  function programarCierre(duracion) {
    clearTimeout(temporizadorCierre);
    const marca = E().avisadoEn;
    temporizadorCierre = setTimeout(() => {
      if (E().avisadoEn === marca && !E().running) borrarE();
    }, duracion);
  }

  /* ─────────────────────────── 12 · arranque ────────────────────────────────── */

  function arrancar() {
    if (!esApp()) return;
    crearPanel();
    pintar();
    inyectar();

    const obs = new MutationObserver(debounce(() => { inyectar(); pintar(); }, 250));
    obs.observe(document.body, { childList: true, subtree: true });

    const e = E();
    if (e.running) setTimeout(e.directo ? irDirecto : cazar, 800);
    else if (e.avisadoEn) {
      const restante = (e.duracionAviso || 3000) - (Date.now() - e.avisadoEn);
      if (restante <= 0) borrarE(); else programarCierre(restante);
    }
  }

  // Antes arrancaba en DOMContentLoaded y metía su <style> y su panel en <body> en TODAS las páginas
  // antes de que React hidratase: principal sospechoso del modo claro.
  esperarHidratacion().then(arrancar);
})();