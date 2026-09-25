// ==UserScript==
// @name         Aurora Dex · Voltorb Flip Solver
// @namespace    http://tampermonkey.net/
// @version      1.2.0
// @description  Voltorb Flip automático con panel integrado, salto de mesas 1-3 arriesgadas, y ciclo automático: al agotar el presupuesto compra todos los Cable Unión (respetando el CD), los vende en el mercado y vuelve al minijuego.
// @match        *://*.auroradex.es/*
// @match        *://auroradex.es/*
// @updateURL    https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_voltorbflip.user.js
// @downloadURL  https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_voltorbflip.user.js
// @grant        none
// @run-at       document-idle
// ==/UserScript==

/*
 * PANEL: se inserta dentro de la pantalla de Voltorb Flip, justo debajo de la tarjeta de Monedas.
 *   - "$ a gastar": presupuesto de la sesión (cada mesa = 500 $). Vacío o 0 = sin límite.
 *   - ACTIVAR reinicia los contadores y juega mesas seguidas hasta agotar el presupuesto.
 *   - En las mesas de nivel 1, 2 y 3, si no hay ninguna casilla 100% segura, se planta y salta a la siguiente.
 *     En niveles 4 y 5 juega siempre (adivinando la de menor riesgo).
 *   - Al agotar el presupuesto: va solo a la tienda, compra todos los Cable Unión que pueda
 *     (si el juego bloquea la compra por el CD anti-spam, reintenta cada 5 s hasta 10 veces;
 *     si sigue bloqueado, se rinde y para), los vende en el mercado y vuelve automáticamente
 *     al minijuego.
 *
 * CABLE UNIÓN: botón dentro de su propia tarjeta (tienda y mercado). Pulsándolo otra vez se detiene.
 *
 * Desactiva "Marcar Voltorb sospechosos" antes de activar.
 * Consola: VoltorbBot.probar()
 */

(function (raiz) {
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


  /* ===================== RESOLUTOR (independiente del DOM) ===================== */

  const TUPLAS = [];
  for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) for (let c = 0; c < 4; c++)
    for (let d = 0; d < 4; d++) for (let e = 0; e < 4; e++) {
      const t = [a, b, c, d, e];
      TUPLAS.push({
        t,
        suma: a + b + c + d + e,
        volt: t.filter(v => v === 0).length,
        mult: t.filter(v => v >= 2).length,
      });
    }

  function resolver(est, valorMax = 3) {
    const { filaSuma, filaVolt, colSuma, colVolt, conocidas } = est;
    let M = null;
    if (est.multRestantes != null) {
      M = est.multRestantes + conocidas.filter(v => v !== null && v >= 2).length;
    }
    const cand = [];
    for (let r = 0; r < 5; r++) {
      cand.push(TUPLAS.filter(o =>
        o.volt === filaVolt[r] && o.suma === filaSuma[r] &&
        o.t.every(v => v <= valorMax) &&
        o.t.every((v, c) => conocidas[r * 5 + c] === null || conocidas[r * 5 + c] === v)));
    }
    const cnt = new Float64Array(25 * 4);
    let total = 0;
    const elegidas = new Array(5);
    const cs = [0, 0, 0, 0, 0], cv = [0, 0, 0, 0, 0];

    function dfs(r, m) {
      if (r === 5) {
        for (let c = 0; c < 5; c++) if (cs[c] !== colSuma[c] || cv[c] !== colVolt[c]) return;
        if (M !== null && m !== M) return;
        total++;
        for (let i = 0; i < 5; i++) for (let c = 0; c < 5; c++) cnt[(i * 5 + c) * 4 + elegidas[i].t[c]]++;
        return;
      }
      for (const o of cand[r]) {
        const m2 = m + o.mult;
        if (M !== null && m2 > M) continue;
        for (let c = 0; c < 5; c++) { cs[c] += o.t[c]; cv[c] += o.t[c] === 0 ? 1 : 0; }
        elegidas[r] = o;
        const rem = 4 - r;
        let ok = true;
        for (let c = 0; c < 5 && ok; c++) {
          const rv = colVolt[c] - cv[c], rs = colSuma[c] - cs[c];
          const nv = rem - rv;
          if (rv < 0 || rv > rem || rs < nv || rs > valorMax * nv) ok = false;
        }
        if (ok) dfs(r + 1, m2);
        for (let c = 0; c < 5; c++) { cs[c] -= o.t[c]; cv[c] -= o.t[c] === 0 ? 1 : 0; }
      }
    }
    dfs(0, 0);
    return { total, cnt };
  }

  const EPS = 1e-12;

  /** Devuelve {idx, pV, pM, motivo, total} o null si ya no queda nada útil. */
  function decidir(est, valorMax = 3) {
    const { total, cnt } = resolver(est, valorMax);
    if (!total) throw new Error('Ningún tablero encaja con las pistas leídas');
    const info = [];
    for (let i = 0; i < 25; i++) {
      if (est.conocidas[i] !== null) continue;
      const pV = cnt[i * 4] / total;
      const pM = (cnt[i * 4 + 2] + cnt[i * 4 + 3]) / total;
      info.push({ idx: i, pV, pM });
    }
    const seguraMult = info.filter(x => x.pV < EPS && x.pM > 1 - EPS);
    if (seguraMult.length) return { ...seguraMult[0], motivo: 'multiplicadora segura', total };
    const segura = info.filter(x => x.pV < EPS && x.pM > EPS).sort((a, b) => b.pM - a.pM);
    if (segura.length) return { ...segura[0], motivo: 'segura (0% Voltorb)', total };
    const util = info.filter(x => x.pM > EPS).sort((a, b) => a.pV - b.pV || b.pM - a.pM);
    if (util.length) return { ...util[0], motivo: 'adivinar: menor riesgo', total };
    return null;
  }

  const API = { resolver, decidir };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof document === 'undefined') return;

  /* ============================ PARTE DEL NAVEGADOR ============================ */

  const COSTE_MESA = 500;
  const PRECIO_CABLE_DEF = 320;
  const VENTA_CABLE_DEF = 350;
  const CD_INTERVALO = 5000;            // ms entre cada reintento cuando el juego mete el CD anti-spam
  const CD_MAX_INTENTOS = 10;           // reintentos antes de rendirse y parar la compra
  const NIVEL_SEGURO_MAX = 3;           // niveles afectados por el salto de mesa
  const RIESGO_SALTO = 0.30;            // en esos niveles: si el riesgo de la mejor casilla supera esto, se salta la mesa
  const RUTA_TIENDA = 'tienda';
  const RUTA_MERCADO = 'mercado';
  const RUTA_MENU = 'menu';
  const RUTA_VOLTORB = 'trigal';   // pantalla del Voltorb Flip

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

  const almacen = {
    leer(k, def) { try { const v = localStorage.getItem('vfbot_' + k); return v === null ? def : JSON.parse(v); } catch (e) { return def; } },
    guardar(k, v) { try { localStorage.setItem('vfbot_' + k, JSON.stringify(v)); } catch (e) { /* nada */ } },
    borrar(k) { try { localStorage.removeItem('vfbot_' + k); } catch (e) { /* nada */ } },
  };

  const S0 = { gastado: 0, fichas: 0, mesas: 0, ganadas: 0, perdidas: 0, saltadas: 0, t0: 0, t1: 0 };
  let ses = Object.assign({}, S0);

  const dormir = ms => new Promise(r => setTimeout(r, ms));
  /** Espera con variación aleatoria alrededor de un centro (ms), para que el ritmo no sea idéntico cada vez. */
  const jitter = (centro, variacion) => Math.max(30, Math.round(centro + (Math.random() * 2 - 1) * variacion));
  const esperaJitter = (centro, variacion) => dormir(jitter(centro, variacion));
  const fmt = n => Number(n).toLocaleString('es-ES');
  const signo = n => (n > 0 ? '+' : '') + fmt(n);
  const num = s => { const d = String(s).replace(/\D/g, ''); return d ? parseInt(d, 10) : null; };
  const norm = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  let estadoEl = null;
  const log = (...a) => {
    console.log('%c[Voltorb]', 'color:#e11d48;font-weight:bold', ...a);
    if (estadoEl) estadoEl.textContent = a.filter(x => typeof x === 'string').join(' ').split('\n')[0].slice(0, 120);
  };
  const cableMsg = t => console.log('%c[Cable]', 'color:#d97706;font-weight:bold', t);

  function textoPagina() {
    const m = document.querySelector('main');
    return (m || document.body).innerText;
  }
  function boton(re) {
    return [...document.querySelectorAll('button')].find(b => !b.closest('#vf-panel') && !b.closest('[data-vf]') && re.test(b.textContent));
  }
  function leerMonedas() {
    const p = [...document.querySelectorAll('p')].find(x => /^monedas$/i.test(x.textContent.trim()));
    let n = p && p.nextElementSibling ? num(p.nextElementSibling.textContent) : null;
    if (n === null) {
      const m = document.body.innerText.match(/Monedas[^\d\n]{0,20}([\d.]+)/i);
      if (m) n = num(m[1]);
    }
    return n;
  }
  function leerNivel() {
    const m = textoPagina().match(/Nivel\s+(\d+)\s*\/\s*(\d+)/i);
    return m ? { actual: +m[1], total: +m[2] } : null;
  }

  function leerEstado(valorMax) {
    const grid = document.querySelector('.grid.grid-cols-6');
    if (!grid || grid.children.length !== 36) return null;
    const h = [...grid.children];
    const nums = el => (el.textContent.match(/\d+/g) || []).map(Number);
    const filaSuma = [], filaVolt = [], colSuma = [], colVolt = [];
    for (let i = 0; i < 5; i++) {
      const f = nums(h[i * 6 + 5]), c = nums(h[30 + i]);
      if (f.length !== 2 || c.length !== 2) return null;
      [filaSuma[i], filaVolt[i]] = f;
      [colSuma[i], colVolt[i]] = c;
    }
    const conocidas = [], elementos = [], pendientes = [];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
      const el = h[r * 6 + c];
      elementos.push(el);
      const m = el.textContent.trim().match(/^[^\d]*(\d)[^\d]*$/);
      if (m) {
        const v = +m[1];
        if (v > valorMax) throw new Error(`Casilla con valor ${v} > valorMax (${valorMax})`);
        conocidas.push(v);
      } else {
        conocidas.push(null);
        if (!(el.tagName === 'BUTTON' && !el.disabled)) pendientes.push(r * 5 + c);
      }
    }
    const q = textoPagina().match(/Qued(?:a|an)\s+(\d+)\s+casillas?\s+que\s+multiplic/i);
    return {
      filaSuma, filaVolt, colSuma, colVolt, conocidas, elementos, pendientes,
      multRestantes: q ? +q[1] : null,
      clicable: i => elementos[i].tagName === 'BUTTON' && !elementos[i].disabled,
    };
  }

  function pintar(est) {
    const filas = [];
    for (let r = 0; r < 5; r++) {
      filas.push(est.conocidas.slice(r * 5, r * 5 + 5).map(v => (v === null ? '·' : v)).join(' ') +
        `   | suma ${est.filaSuma[r]}, volt ${est.filaVolt[r]}`);
    }
    filas.push('cols suma : ' + est.colSuma.join(' '));
    filas.push('cols volt : ' + est.colVolt.join(' '));
    filas.push('multiplican restantes: ' + est.multRestantes);
    return filas.join('\n');
  }

  function probar(valorMax = 3) {
    const est = leerEstado(valorMax);
    if (!est) { log('No veo una mesa activa.'); return; }
    log('Lectura del tablero:\n' + pintar(est));
    const d = decidir(est, valorMax);
    if (!d) { log('No queda ninguna casilla útil.'); return; }
    const r = Math.floor(d.idx / 5) + 1, c = (d.idx % 5) + 1;
    log(`Levantaría fila ${r}, columna ${c} · ${d.motivo} · P(Voltorb)=${(d.pV * 100).toFixed(1)}%`);
    est.elementos[d.idx].style.outline = '3px solid #e11d48';
  }

  /* ------------------------------ bucle de juego ------------------------------ */

  let corriendo = false;
  let parando = false;
  let presEl = null;
  let onCambio = () => {};

  const leerPresupuesto = () => (presEl ? Math.max(0, parseInt(presEl.value, 10) || 0) : 0);
  const RE_PLANTAR = /plantar(se|te)|llevarme/i;     // el botón real pone "Plantarse y llevarme 30"
  const botonPlantar = () => { const b = boton(RE_PLANTAR); return b && !b.disabled ? b : null; };

  async function esperarRevelado(idx, valorMax) {
    const t0 = Date.now();
    while (Date.now() - t0 < 4000 && !parando) {
      await dormir(120);
      if (boton(/mesa nueva/i)) return;
      const e = leerEstado(valorMax);
      if (!e || e.conocidas[idx] !== null) return;
    }
  }

  async function jugar(opc = {}) {
    const o = { retardo: 400, valorMax: 3, ...opc };
    if (corriendo) return;
    corriendo = true; parando = false;
    ses = Object.assign({}, S0, { t0: Date.now() });
    onCambio();
    let enMesa = false, monedasIni = null, nivelMesa = null, atascos = 0, sinMesa = 0, esperas = 0;
    let presupuestoAgotado = false, fallo = null;
    const paro = m => { log(m); fallo = m; };

    const contabilizar = () => {
      if (!enMesa) return;
      const ahora = leerMonedas();
      const gano = monedasIni !== null && ahora !== null && ahora > monedasIni;
      ses.mesas++;
      if (gano) { ses.ganadas++; ses.fichas += ahora - monedasIni; } else ses.perdidas++;
      log(`Mesa nº${ses.mesas} (nivel ${nivelMesa}): ${gano ? 'GANADA' : 'perdida'}`);
      enMesa = false; onCambio();
    };

    try {
      while (!parando) {
        const nueva = boton(/mesa nueva/i);
        if (nueva) {
          contabilizar();
          if (nueva.disabled) { log('No puedo empezar otra mesa (¿sin dinero?).'); presupuestoAgotado = true; return; }
          const pres = leerPresupuesto();
          if (pres > 0 && ses.gastado + COSTE_MESA > pres) {
            log(`Presupuesto alcanzado (${fmt(ses.gastado)} / ${fmt(pres)} $).`);
            presupuestoAgotado = true;
            return;
          }
          log('Empezando mesa nueva…');
          nueva.click();
          const t0 = Date.now();
          while (Date.now() - t0 < 6000 && !parando && boton(/mesa nueva/i)) await dormir(120);
          if (boton(/mesa nueva/i) && !parando) { log('No arranca la mesa (¿sin dinero?).'); presupuestoAgotado = true; return; }
          if (!boton(/mesa nueva/i)) { ses.gastado += COSTE_MESA; onCambio(); }
          await dormir(o.retardo);
          continue;
        }

        const est = leerEstado(o.valorMax);
        if (!est) {
          if (++sinMesa > 6) { paro('No consigo leer el tablero. Paro.'); return; }
          await dormir(o.retardo);
          continue;
        }
        sinMesa = 0;
        if (est.pendientes.length) {
          if (++esperas * 150 > 6000) { paro('Una casilla no termina de revelarse. Paro.'); return; }
          await dormir(150);
          continue;
        }
        esperas = 0;
        if (!enMesa) {
          enMesa = true; monedasIni = leerMonedas();
          const n = leerNivel(); nivelMesa = n ? n.actual : 0;
          log(`Mesa en juego · nivel ${nivelMesa}`);
        }

        const d = decidir(est, o.valorMax);
        if (!d) {
          const plantar = botonPlantar();
          if (plantar) { plantar.click(); await dormir(o.retardo * 2); continue; }
          paro('No quedan casillas útiles y no hay botón de plantarse. Paro.');
          return;
        }

        // ---- mesas 1-3: si hay riesgo, plantarse y saltar a la siguiente ----
        if (nivelMesa && nivelMesa <= NIVEL_SEGURO_MAX && d.pV > RIESGO_SALTO) {
          const plantar = botonPlantar();
          if (plantar) {
            ses.saltadas++;
            log(`Nivel ${nivelMesa}: riesgo ${(d.pV * 100).toFixed(0)}% → salto de mesa`);
            plantar.click();
            await dormir(o.retardo * 2);
            continue;
          }
          log(`Nivel ${nivelMesa}: aún no puedo plantarme; sigo jugando.`);
        }

        if (!est.clicable(d.idx)) { paro(`Casilla ${d.idx + 1} no clicable (¿modo marcar?). Paro.`); return; }

        log(`Casilla ${d.idx + 1} · ${d.motivo} · riesgo ${(d.pV * 100).toFixed(0)}%`);
        const firma = est.conocidas.join(',');
        est.elementos[d.idx].click();
        await esperarRevelado(d.idx, o.valorMax);
        await dormir(o.retardo);

        const est2 = leerEstado(o.valorMax);
        if (est2 && est2.conocidas.join(',') === firma && !boton(/mesa nueva/i)) {
          if (++atascos >= 3) { paro('El clic no cambia el tablero. Paro.'); return; }
        } else atascos = 0;

        if (est2 && est2.multRestantes === 0) {
          const plantar = botonPlantar();
          if (plantar) plantar.click();
          await dormir(o.retardo);
        }
      }
      log('Desactivado.');
    } catch (e) {
      log('Error: ' + e.message);
      fallo = 'Error: ' + e.message;
    } finally {
      try { if (enMesa && boton(/mesa nueva/i)) contabilizar(); } catch (e) { /* nada */ }
      corriendo = false;
      ses.t1 = Date.now();
      const manual = parando;
      parando = false;
      onCambio();
      // presupuesto agotado (y no lo has parado tú) -> ciclo automático de Cable Unión
      if (fallo && !manual) kAviso({ tipo: 'error', app: 'Voltorb Flip', icono: '💣', titulo: 'La partida automática se ha parado', texto: fallo, lineas: [`🎲 ${ses.mesas} mesas · 🏆 ${ses.ganadas} ganadas · 🪙 +${fmt(ses.fichas)} fichas`] });
      if (presupuestoAgotado && !manual) {
        log('Voy a la tienda a comprar Cable Unión…');
        almacen.guardar('flujo', { fase: 'comprar', ts: Date.now(), origen: location.href });
      }
    }
  }

  /* =========================== CABLE UNIÓN (tienda + mercado) =========================== */

  let cableTarea = null;   // null | 'comprar' | 'vender'
  let cableParar = false;

  const enruta = r => new RegExp('/' + r + '/?$').test(location.pathname);
  const enMercado = () => enruta(RUTA_MERCADO);
  const botonPor = (li, re) => [...li.querySelectorAll('button')].find(b => !b.closest('[data-vf]') && re.test(b.textContent));
  const botonConfirmar = li => [...li.querySelectorAll('button')]
    .find(b => !b.closest('[data-vf]') && !b.disabled && /de verdad|confirmar/i.test(b.textContent));

  function liCable(tipo) {
    return [...document.querySelectorAll('li')].find(li => {
      if (!norm(li.textContent).includes('cable union')) return false;
      if (li.querySelector('li')) return false;                       // es un contenedor, no la tarjeta
      if (tipo === 'canjear') {
        return [...li.querySelectorAll('p')].some(p => p.textContent.includes('🪙')) && !!botonTienda(li);
      }
      return !!botonPor(li, /vender/i);
    });
  }
  const botonTienda = li => [...li.querySelectorAll('button')].find(b => !b.closest('[data-vf]'));

  function precioCable(li) {
    const t = [...li.querySelectorAll('p')].map(p => p.textContent).find(x => x.includes('🪙'));
    const n = t ? num(t) : null;
    if (n) { almacen.guardar('precioCable', n); return n; }
    return almacen.leer('precioCable', PRECIO_CABLE_DEF);
  }
  function ventaUnidad(li) {
    const t = [...li.querySelectorAll('p')].map(p => p.textContent).find(x => /\$/.test(x));
    const n = t ? num(t) : null;
    if (n) { almacen.guardar('ventaCable', n); return n; }
    return almacen.leer('ventaCable', VENTA_CABLE_DEF);
  }
  function cantidad(li) {
    const sp = li.querySelector('p span');
    const n = sp ? num(sp.textContent) : null;
    return n === null ? 1 : n;
  }

  const inputCantidad = li => li.querySelector('input[type="number"], input[inputmode="numeric"]');
  /** Botón "Otra cantidad…" que abre el selector con − / input / +. */
  const botonOtraCantidad = li => [...li.querySelectorAll('button')]
    .find(b => !b.closest('[data-vf]') && /otra cantidad/i.test(b.textContent));
  /** Stock máximo real: el atributo max del input (una vez abierto) es más fiable que el "xN" del texto. */
  function maxCantidad(li) {
    const inp = inputCantidad(li);
    const m = inp && inp.max ? parseInt(inp.max, 10) : null;
    return Number.isFinite(m) && m > 0 ? m : cantidad(li);
  }
  /** Escribe una cantidad en el input del panel y comprueba que React la ha aceptado. */
  async function fijarCantidad(li, n) {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    for (let i = 0; i < 4; i++) {
      const inp = inputCantidad(li);
      if (!inp) return false;
      try { inp.focus({ preventScroll: true }); inp.select(); } catch (e) { /* nada */ }
      setter.call(inp, String(n));
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      inp.dispatchEvent(new Event('change', { bubbles: true }));
      await dormir(90);
      const ahora = inputCantidad(li);
      if (ahora && num(ahora.value) === n) return true;
    }
    return false;
  }

  /** Botón de venta del panel de cantidad (el último "Vender N"; el primero vende 1 suelto). */
  const botonVender = li => [...li.querySelectorAll('button')]
    .filter(b => !b.closest('[data-vf]') && /^vender/i.test(b.textContent.trim())).pop();

  /** Compra Cable Unión hasta quedarte sin fichas. Si el juego mete el CD, espera y continúa. */
  async function comprarTodo() {
    if (cableTarea) return;
    cableTarea = 'comprar'; cableParar = false;
    refrescarCable();
    let comprados = 0, encadenar = false;
    try {
      await dormir(400);
      if (!liCable('canjear')) { cableMsg('No encuentro el Cable Unión en la tienda.'); finFlujo(); return; }

      let sinBoton = 0, sinLectura = 0;
      while (!cableParar) {
        const li = liCable('canjear');
        if (!li) { cableMsg('Ya no veo el Cable Unión en la tienda.'); encadenar = comprados > 0; break; }

        const precio = precioCable(li);
        const antes = leerMonedas();
        if (antes === null) {
          if (++sinLectura > 20) { cableMsg('No puedo leer las monedas. Paro.'); return; }
          await dormir(200); continue;
        }
        sinLectura = 0;
        if (antes < precio) { cableMsg(`Sin fichas suficientes (${fmt(antes)}). Comprados: ${comprados}.`); encadenar = comprados > 0; break; }

        const conf0 = botonConfirmar(li);
        if (conf0) { conf0.click(); await esperaJitter(220, 80); continue; }

        const btn = botonTienda(li);
        if (!btn || btn.disabled) {
          if (++sinBoton > 6) {
            sinBoton = 0;
            cableMsg(`CD detectado (botón bloqueado). Reintento cada ${CD_INTERVALO / 1000} s (máx. ${CD_MAX_INTENTOS})…`);
            const liberado = await esperaCD();
            if (!liberado) { cableMsg(`El CD no se libera tras ${CD_MAX_INTENTOS} intentos. Paro la compra (comprados: ${comprados}).`); finFlujo(); return; }
          } else await esperaJitter(220, 90);
          continue;
        }
        sinBoton = 0;

        btn.click();
        await esperaJitter(130, 45);
        const li2 = liCable('canjear');
        const conf = li2 && botonConfirmar(li2);
        if (conf) conf.click();

        let ok = false;
        const t0 = Date.now();
        while (Date.now() - t0 < 2500 && !cableParar) {
          await esperaJitter(90, 25);
          const m = leerMonedas();
          if (m !== null && m < antes) { ok = true; break; }
        }
        if (ok) {
          comprados++;
          if (comprados % 10 === 0) cableMsg(`Comprados ${comprados}…`);
          await esperaJitter(90, 55);
        } else if (!cableParar) {
          cableMsg(`CD detectado. Reintento cada ${CD_INTERVALO / 1000} s (máx. ${CD_MAX_INTENTOS})…`);
          const liberado = await esperaCD();
          if (!liberado) { cableMsg(`El CD no se libera tras ${CD_MAX_INTENTOS} intentos. Paro la compra (comprados: ${comprados}).`); finFlujo(); return; }
        }
      }

      if (cableParar) { cableMsg(`Compra detenida (${comprados}).`); finFlujo(); return; }
      if (encadenar) {
        cableMsg(`Comprados ${comprados} Cable Unión. Voy al mercado.`);
        const f = almacen.leer('flujo', null) || {};
        almacen.guardar('flujo', { fase: 'vender', ts: Date.now(), origen: f.origen || null });
      } else {
        cableMsg('No hay fichas ni para un Cable Unión. Detengo el ciclo automático (no voy al mercado sin nada que vender).');
        finFlujo();
      }
    } catch (e) {
      cableFallo('Error: ' + e.message);
    } finally {
      cableTarea = null; refrescarCable();
    }
  }

  /** Reintenta cada CD_INTERVALO ms hasta CD_MAX_INTENTOS veces. true si el botón se desbloquea, false si se agotan los intentos. */
  async function esperaCD() {
    for (let intento = 1; intento <= CD_MAX_INTENTOS && !cableParar; intento++) {
      await dormir(CD_INTERVALO);
      const f = almacen.leer('flujo', null);
      if (f) almacen.guardar('flujo', { ...f, ts: Date.now() });   // que no caduque el flujo esperando
      if (cableParar) return false;
      const li = liCable('canjear');
      if (!li) return true;                    // ya no hay tarjeta que comprar; que decida el llamador
      const btn = botonTienda(li);
      if (btn && !btn.disabled) return true;    // el CD se ha liberado
      cableMsg(`Sigo esperando el CD… intento ${intento}/${CD_MAX_INTENTOS}`);
    }
    return false;
  }

  /** Vende todos los Cable Unión del mercado, lo más rápido posible. */
  async function venderTodo() {
    if (cableTarea) return;
    cableTarea = 'vender'; cableParar = false;
    refrescarCable();
    let vendidos = 0, ingresos = 0;
    try {
      let li = null;
      const tIni = Date.now();
      while (Date.now() - tIni < 8000 && !cableParar) { li = liCable('vender'); if (li) break; await dormir(200); }
      if (!li) { cableMsg('No hay Cable Unión que vender.'); return; }

      let atascos = 0, sinBoton = 0;

      while (!cableParar) {
        li = liCable('vender');
        if (!li) { await dormir(300); li = liCable('vender'); }
        if (!li) break;                                   // ya no queda ninguno
        const unit = ventaUnidad(li);
        const q = cantidad(li);

        const conf0 = botonConfirmar(li);
        if (conf0) { conf0.click(); await dormir(120); li = liCable('vender'); if (!li) break; }

        // abrir el panel de "otra cantidad" (−/input/+) si aún no está abierto
        if (!inputCantidad(li)) {
          const abrir = botonOtraCantidad(li);
          if (abrir && !abrir.disabled) {
            abrir.click();
            await dormir(300);
            li = liCable('vender');
            if (!li) break;
          }
          // si no existe "Otra cantidad…" (p. ej. solo queda 1 unidad), se sigue con la venta rápida de 1
        }

        const n = Math.max(1, Math.min(99, inputCantidad(li) ? maxCantidad(li) : q));
        const puesto = inputCantidad(li) ? await fijarCantidad(li, n) : false;
        li = liCable('vender');
        if (!li) break;

        const btn = botonVender(li);
        if (!btn || btn.disabled) {
          if (++sinBoton > 10) { cableMsg('El botón Vender no responde. Paro.'); break; }
          await dormir(150); continue;
        }
        sinBoton = 0;
        btn.click();
        await dormir(100);

        // confirmar ("Vender N de verdad") y esperar a que baje la cantidad
        const t1 = Date.now();
        let cambio = false;
        while (Date.now() - t1 < 2500 && !cableParar) {
          const l2 = liCable('vender');
          if (!l2) { cambio = true; break; }
          const c = botonConfirmar(l2);
          if (c) { c.click(); await dormir(100); continue; }
          if (cantidad(l2) !== q) { cambio = true; break; }
          await dormir(60);
        }

        if (cambio) {
          const l3 = liCable('vender');
          const restan = l3 ? cantidad(l3) : 0;
          const d = Math.max(0, q - restan);
          vendidos += d; ingresos += d * unit; atascos = 0;
          cableMsg(`Vendidos ${vendidos} (+${fmt(ingresos)} $)` + (puesto ? '' : ' [de 1 en 1: el panel no acepta la cantidad]'));
          const f = almacen.leer('flujo', null);
          if (f) almacen.guardar('flujo', { ...f, ts: Date.now() });
          if (!l3) break;
          await dormir(80);
        } else if (++atascos >= 3) {
          cableFallo('Vender no surte efecto. Paro.'); break;
        }
      }
      cableMsg(cableParar
        ? `Venta detenida: ${vendidos} vendidos (+${fmt(ingresos)} $).`
        : `Listo: ${vendidos} Cable Unión vendidos (+${fmt(ingresos)} $).`);
    } catch (e) {
      cableFallo('Error: ' + e.message);
    } finally {
      const f = almacen.leer('flujo', null);
      cableTarea = null; refrescarCable();
      if (cableParar) finFlujo();
      else if (f) almacen.guardar('flujo', { fase: 'volver', ts: Date.now(), origen: f.origen || null });
      else finFlujo();
    }
  }

  /* --------------------- navegación automática entre pantallas --------------------- */

  let navOcupado = false, ultimoPaso = 0, intentos = {};

  const enlaceA = r => [...document.querySelectorAll('a[href]')]
    .find(a => new RegExp('/' + r + '/?$').test(a.getAttribute('href')));
  const pestanaVender = () => [...document.querySelectorAll('button')].find(b =>
    !b.closest('[data-vf]') && !b.closest('#vf-panel') &&
    /^[^\p{L}]*vender[^\p{L}\d]*$/iu.test(b.textContent.trim()));

  function finFlujo() { almacen.borrar('flujo'); intentos = {}; }
  const cableFallo = t => { cableMsg(t); kAviso({ tipo: 'error', app: 'Voltorb Flip · Cable Unión', icono: '🔌', titulo: 'El ciclo se ha parado', texto: t }); };

  function irA(ruta, clave) {
    if (enruta(ruta)) return;                       // ya estamos, solo falta que pinte
    const n = intentos[clave] = (intentos[clave] || 0) + 1;
    const a = enlaceA(ruta);
    if (a && n <= 2) { a.click(); return; }
    const menu = enlaceA(RUTA_MENU);
    if (menu && n <= 3 && !enruta(RUTA_MENU)) { menu.click(); return; }
    location.assign(location.origin + '/' + ruta);
  }

  function pasoFlujo(f) {
    if (navOcupado || cableTarea || Date.now() - ultimoPaso < 1500) return;
    navOcupado = true;
    try {
      if (f.fase === 'comprar') {
        if (liCable('canjear')) { intentos = {}; comprarTodo(); return; }
        irA(RUTA_TIENDA, 'tienda');
      } else if (f.fase === 'vender') {
        if (liCable('vender')) { intentos = {}; venderTodo(); return; }
        if (enMercado()) {
          const t = pestanaVender();
          const n = intentos.pestana = (intentos.pestana || 0) + 1;
          if (t) t.click();
          if (n > 10) { finFlujo(); cableFallo('No encuentro el Cable Unión en el mercado.'); }
          return;
        }
        irA(RUTA_MERCADO, 'mercado');
      } else if (f.fase === 'volver') {
        if (enruta(RUTA_VOLTORB) || hayVoltorb()) {
          finFlujo();
          if (bucleActivo() && !corriendo) {
            log('Bucle activado: empezando otra sesión con el mismo presupuesto…');
            jugar();
          } else {
            cableMsg('Ciclo completado: de vuelta en el Voltorb Flip.');
            kAviso({ tipo: 'fin', app: 'Voltorb Flip', icono: '💣', titulo: 'Ciclo completado', texto: 'Fichas jugadas, Cable Unión comprado y vendido. De vuelta en el Voltorb Flip.' });
          }
          return;
        }
        irA(RUTA_VOLTORB, 'voltorb');
      }
    } catch (e) {
      console.log('[Cable] error navegando:', e);
    } finally {
      ultimoPaso = Date.now(); navOcupado = false;
    }
  }

  function tickFlujo() {
    const f = almacen.leer('flujo', null);
    if (!f || cableTarea) return;
    if (Date.now() - f.ts > 300000) { finFlujo(); cableFallo('Flujo automático cancelado (tiempo agotado).'); return; }
    pasoFlujo(f);
  }

  function cableClick() {
    if (cableTarea || almacen.leer('flujo', null)) { cableParar = true; finFlujo(); refrescarCable(); return; }
    if (liCable('canjear')) comprarTodo();
    else if (liCable('vender')) venderTodo();
  }

  /** Mini panel dentro de la tarjeta del Cable Unión (tienda y mercado). */
  function refrescarCable() {
    const liC = liCable('canjear');
    const li = liC || liCable('vender');
    document.querySelectorAll('[data-vf="cable"]').forEach(w => { if (!li || !li.contains(w)) w.remove(); });
    if (!li) return;
    let w = li.querySelector('[data-vf="cable"]');
    if (!w) {
      w = document.createElement('div');
      w.dataset.vf = 'cable';
      w.className = 'space-y-2';
      w.style.marginTop = '8px';
      w.innerHTML = `
        <div data-vf-info="1" class="flex flex-wrap gap-1.5"></div>
        <button type="button" class="!py-2 !text-[11px] w-full"></button>`;
      w.querySelector('button').addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); cableClick(); });
      (li.querySelector('div.min-w-0') || li).appendChild(w);
    }
    const info = w.querySelector('[data-vf-info]');
    const b = w.querySelector('button');
    const activo = cableTarea || almacen.leer('flujo', null);

    let html = '';
    if (liC) {
      const precio = precioCable(li), m = leerMonedas();
      const n = m === null ? null : Math.floor(m / precio);
      html = `<span class="pastilla border-2 border-ambar-200 bg-ambar-50 text-ambar-700">🪙 ${m === null ? '—' : fmt(m)} fichas</span>
              <span class="pastilla border-2 border-hoja-300 bg-hoja-50 text-hoja-700">📦 ${n === null ? '—' : fmt(n)} por comprar</span>
              <span class="pastilla border-2 border-crema-200 bg-crema-50 text-tinta-500">≈ ${n === null ? '—' : fmt(n * ventaCable())} $ al vender</span>`;
    }
    if (activo) html += `<span class="pastilla border-2 border-ambar-200 bg-ambar-50 text-ambar-700">🔁 ${cableTarea === 'vender' ? 'vendiendo' : cableTarea === 'comprar' ? 'comprando' : 'ciclo en curso'}…</span>`;
    if (info.innerHTML !== html) info.innerHTML = html;

    let texto, cls;
    if (activo) { texto = '■ Parar'; cls = 'boton-secundario'; }
    else if (liC) {
      const precio = precioCable(li), m = leerMonedas();
      const n = m === null ? null : Math.floor(m / precio);
      texto = `⚡ Comprar todos (${n === null ? '?' : fmt(n)}) y vender`; cls = 'boton-principal';
    } else { texto = `💰 Vender todos (${cantidad(li)})`; cls = 'boton-principal'; }
    const full = cls + ' !py-2 !text-[11px] w-full';
    if (b.className !== full) b.className = full;
    kSet(b, texto);
  }

  /* --------------------- botón flotante de parada de emergencia --------------------- */

  let botonParoEl = null;
  const hayProcesoActivo = () => corriendo || !!cableTarea || !!almacen.leer('flujo', null);

  function pararTodo() {
    if (corriendo) parando = true;
    if (cableTarea) cableParar = true;
    finFlujo();
    onCambio();
    refrescarCable();
    actualizarBotonParo();
  }

  function crearBotonParo() {
    if (botonParoEl && botonParoEl.isConnected) return;
    botonParoEl = document.createElement('button');
    botonParoEl.type = 'button';
    botonParoEl.id = 'vf-paro';
    botonParoEl.title = 'Parar todo (juego, compra, venta y ciclo automático)';
    botonParoEl.className = 'pastilla border-2 border-rojo-100 bg-lienzo text-rojo-600 shadow-suave px-3 py-1.5 font-extrabold';
    botonParoEl.textContent = '■ Parar Voltorb';
    botonParoEl.style.cssText = 'position:fixed;right:12px;bottom:calc(var(--nav-alto, 4rem) + 3.5rem + env(safe-area-inset-bottom, 0px));z-index:2147483000;cursor:pointer';
    botonParoEl.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); pararTodo(); });
    document.body.appendChild(botonParoEl);
  }

  function actualizarBotonParo() {
    if (hayProcesoActivo()) {
      crearBotonParo();
    } else if (botonParoEl && botonParoEl.isConnected) {
      botonParoEl.remove();
    }
  }

  /* --------------------- panel integrado en la pantalla del juego --------------------- */

  let btnEl = null, bucleEl = null, sesEl = null, fichasEl = null, balEl = null, mesasEl = null, panelEl = null;
  const bucleActivo = () => almacen.leer('bucle', false);

  const precioFichas = () => almacen.leer('precioCable', PRECIO_CABLE_DEF);
  const ventaCable = () => almacen.leer('ventaCable', VENTA_CABLE_DEF);
  const valorFichas = f => f * ventaCable() / precioFichas();

  const hayVoltorb = () => [...document.querySelectorAll('h1, h2')].some(h => /voltorb flip/i.test(h.textContent));
  /** Sección del tablero: el panel se coloca justo encima de ella. */
  function anclaTablero() {
    const grid = document.querySelector('.grid.grid-cols-6');
    const s = grid && grid.closest('section');
    if (s && s.parentElement) return s;
    const p = [...document.querySelectorAll('p')].find(x => /^monedas$/i.test(x.textContent.trim()));
    const t = p && p.closest('.tarjeta');
    return t && t.nextElementSibling && t.parentElement ? t.nextElementSibling : null;
  }

  const PRES_CHIPS = [1000, 5000, 10000, 0];

  function crearPanel() {
    const ancla = anclaTablero();
    if (!ancla || !ancla.parentElement) return;
    let d = document.getElementById('vf-panel');
    if (d && d.isConnected) {
      if (d.nextElementSibling !== ancla) ancla.parentElement.insertBefore(d, ancla);   // recolocar
      return;
    }
    kStyle('vf-kit', '#vf-panel', '#E0473A');

    d = document.createElement('div');
    d.id = 'vf-panel';
    d.className = 'tarjeta space-y-3 p-3';
    d.style.margin = '1rem 0';
    d.innerHTML = `
      ${kHead('🎰', 'Voltorb Flip · Automático', 'Cada mesa cuesta 500 $')}
      <div class="vf-cfg space-y-2">
        <div class="flex items-baseline justify-between gap-2">
          <label class="titulo-seccion" for="vf-pres">💵 Presupuesto</label>
          <span class="vf-mesas-pres text-[11px] font-bold text-tinta-400 tabular-nums"></span>
        </div>
        <input id="vf-pres" type="number" min="0" step="500" inputmode="numeric" placeholder="∞  sin límite"
          class="${K_FIELD} text-center font-display !text-base font-extrabold tabular-nums" />
        <div class="k-chips">
          ${PRES_CHIPS.map(v => `<button type="button" class="boton-suave" data-p="${v}">${v ? fmt(v) : '∞'}</button>`).join('')}
        </div>
        <label class="k-switch rounded-card border-2 border-crema-200 bg-crema-50 p-2 text-[11px] font-bold text-tinta-500">
          <input id="vf-bucle" type="checkbox" />
          <span>🔁 Repetir el ciclo solo: jugar → Cable Unión → volver a jugar</span>
        </label>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <button id="vf-btn" type="button" class="boton-principal w-full">▶ Activar</button>
        <button id="vf-ver" type="button" class="boton-suave w-full" title="Marca en el tablero la casilla que levantaría">💡 Ver jugada</button>
      </div>
      <div class="vf-presbar">
        <div class="mb-1 flex items-baseline justify-between text-[11px] font-extrabold text-tinta-500">
          <span>💸 Gastado</span><span id="vf-ses" class="tabular-nums">0 $</span>
        </div>
        <div class="${K_BAR}"><span class="vf-bar" style="width:0%;background-color:#F2B632"></span></div>
      </div>
      <div class="k-tiles">
        <div class="${K_TILE}"><b id="vf-fichas" class="tabular-nums text-ambar-600">+0</b><small>Fichas</small></div>
        <div class="${K_TILE}"><b id="vf-bal" class="tabular-nums">0 $</b><small>Balance</small></div>
        <div class="${K_TILE}"><b id="vf-mesas" class="tabular-nums">0</b><small>Ganadas</small></div>
        <div class="${K_TILE}"><b class="vf-time tabular-nums">00:00</b><small>Tiempo</small></div>
      </div>
      <p class="vf-extra text-center text-[11px] font-bold text-tinta-400 tabular-nums"></p>
      <p id="vf-estado" class="truncate rounded-card border-2 border-crema-200 bg-crema-50 p-2 text-center text-[11px] font-bold text-tinta-600">Listo.</p>`;
    ancla.parentElement.insertBefore(d, ancla);
    panelEl = d;

    presEl = d.querySelector('#vf-pres');
    btnEl = d.querySelector('#vf-btn');
    bucleEl = d.querySelector('#vf-bucle');
    estadoEl = d.querySelector('#vf-estado');
    sesEl = d.querySelector('#vf-ses');
    fichasEl = d.querySelector('#vf-fichas');
    balEl = d.querySelector('#vf-bal');
    mesasEl = d.querySelector('#vf-mesas');

    presEl.value = almacen.leer('presupuesto', '');
    presEl.addEventListener('input', () => { almacen.guardar('presupuesto', presEl.value); pintarPanel(); });
    presEl.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); btnEl.click(); } });
    presEl.addEventListener('keyup', e => e.stopPropagation());
    for (const b of d.querySelectorAll('[data-p]')) b.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      presEl.value = +b.dataset.p ? b.dataset.p : '';
      almacen.guardar('presupuesto', presEl.value); pintarPanel();
    });
    bucleEl.checked = almacen.leer('bucle', false);
    bucleEl.addEventListener('change', () => almacen.guardar('bucle', bucleEl.checked));
    btnEl.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      if (corriendo) { parando = true; pintarPanel(); } else jugar();
    });
    d.querySelector('#vf-ver').addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      document.querySelectorAll('.grid.grid-cols-6 > *').forEach(x => { x.style.outline = ''; });
      probar();
    });
    pintarPanel();
  }

  function pintarPanel() {
    if (!btnEl || !btnEl.isConnected) return;
    const d = panelEl;
    const pres = leerPresupuesto();
    const flujo = almacen.leer('flujo', null);

    let badge = ['off', 'LISTO'];
    if (corriendo && parando) badge = ['warn', 'PARANDO'];
    else if (corriendo) badge = ['on', 'JUGANDO'];
    else if (flujo || cableTarea) badge = ['warn', 'CABLE UNIÓN'];
    kBadge(d.querySelector('.k-badge'), badge[0], badge[1]);
    const niv = corriendo ? leerNivel() : null;
    kSet(d.querySelector('.k-sub'), corriendo ? `Mesa ${ses.mesas + 1}${niv ? ' · nivel ' + niv.actual : ''} · 500 $ por mesa` : 'Cada mesa cuesta 500 $');

    const txt = corriendo && parando ? 'Parando…' : corriendo ? '■ Desactivar' : '▶ Activar';
    kSet(btnEl, txt);
    const cls = (corriendo ? 'boton-secundario' : 'boton-principal') + ' w-full';
    if (btnEl.className !== cls) btnEl.className = cls;
    d.querySelector('.vf-cfg').hidden = corriendo;
    d.querySelector('#vf-ver').disabled = corriendo;
    for (const b of d.querySelectorAll('[data-p]')) b.setAttribute('aria-pressed', String((+b.dataset.p || 0) === pres));
    kSet(d.querySelector('.vf-mesas-pres'), pres ? `${Math.floor(pres / COSTE_MESA)} mesas` : 'sin límite');

    const bal = Math.round(valorFichas(ses.fichas) - ses.gastado);
    kSet(sesEl, pres > 0 ? `${fmt(ses.gastado)} / ${fmt(pres)} $` : `${fmt(ses.gastado)} $`);
    const bar = d.querySelector('.vf-bar');
    if (bar) bar.style.width = (pres ? Math.min(100, ses.gastado / pres * 100) : 0) + '%';
    kSet(fichasEl, `+${fmt(ses.fichas)}`);
    kSet(balEl, `${signo(bal)} $`);
    const balCls = 'tabular-nums ' + (bal < 0 ? 'text-rojo-600' : 'text-hoja-600');
    if (balEl.className !== balCls) balEl.className = balCls;
    kSet(mesasEl, `${ses.ganadas}/${ses.mesas}`);
    kSet(d.querySelector('.vf-time'), kTime(ses.t0 ? (corriendo ? Date.now() : ses.t1 || Date.now()) - ses.t0 : 0));
    const winRate = ses.mesas ? Math.round(ses.ganadas / ses.mesas * 100) : null;
    kSet(d.querySelector('.vf-extra'), ses.mesas
      ? `Acierto ${winRate}% · ✗ ${ses.perdidas} perdidas · ⤼ ${ses.saltadas} saltadas · 1 ficha ≈ ${(ventaCable() / precioFichas()).toFixed(2)} $`
      : '');
  }
  onCambio = pintarPanel;

  /* ------------------------------ bucle de vigilancia ------------------------------ */

  let ultimoTick = 0;
  function tick() {
    if (Date.now() - ultimoTick < 250) return;
    ultimoTick = Date.now();
    try {
      if (hayVoltorb()) crearPanel(); else { const p = document.getElementById('vf-panel'); if (p) p.remove(); }
      pintarPanel();
      refrescarCable();
      actualizarBotonParo();
      tickFlujo();
    } catch (e) { /* el DOM puede estar a medias durante una navegación */ }
  }
  esperarHidratacion().then(() => {
    setInterval(tick, 700);
    // la web es una SPA: reaccionar también a los repintados (evita tener que recargar la página)
    try { new MutationObserver(() => tick()).observe(document.body, { childList: true, subtree: true }); } catch (e) { /* nada */ }
    tick();
  });

  raiz.VoltorbBot = {
    probar, jugar, parar: () => { parando = true; onCambio(); },
    comprarCables: comprarTodo, venderCables: venderTodo,
    cancelarFlujo: finFlujo,
    leerEstado, decidir, resolver, ses: () => ses,
  };
  console.log('%cVoltorbBot 4.3 cargado', 'color:#16a34a;font-weight:bold');
})(typeof window !== 'undefined' ? window : globalThis);