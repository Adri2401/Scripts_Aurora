// ==UserScript==
// @name         Aurora Dex · Metro Batalla (pelear en bucle y ventaja de tipos)
// @namespace    auroradex-metro
// @version      1.0.0
// @description  Solo en /metro. Pulsa «Pelear» en bucle (con tope de paradas o de racha) y analiza tu equipo contra el del rival: quién gana a quién por tipos y nivel, con aviso si conviene «Cambiar vía».
// @match        https://auroradex.es/*
// @match        https://www.auroradex.es/*
// @updateURL    https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_metro.user.js
// @downloadURL  https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_metro.user.js
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// @connect      pokeapi.co
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
      const tick = () => {
        const listo = document.readyState === 'complete' && document.querySelector('main') && Date.now() - quietSince >= 800;
        if (listo || Date.now() - t0 > maxMs) { obs.disconnect(); setTimeout(resolve, 300); }
        else setTimeout(tick, 200);
      };
      tick();
    });
  }

  const PANEL_ID = 'axm-panel';
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const pausa = (a, b) => sleep(a + Math.random() * (b - a));
  const norm = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  const visible = el => !!(el && (el.offsetParent || el.getClientRects().length));
  const ajeno = el => !!el.closest('#' + PANEL_ID);
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
  const lsPut = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin storage */ } };
  const enMetro = () => /^\/metro(\/|$)/.test(location.pathname);

  /* ------------------------------------------------------------------ *
   *  TABLA DE TIPOS (ataque → defensa). Lo que no aparece es ×1.
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
  const DE_INGLES = { normal: 'normal', fire: 'fuego', water: 'agua', grass: 'planta', electric: 'electrico', ice: 'hielo', fighting: 'lucha', poison: 'veneno', ground: 'tierra', flying: 'volador', psychic: 'psiquico', bug: 'bicho', rock: 'roca', ghost: 'fantasma', dragon: 'dragon', dark: 'siniestro', steel: 'acero', fairy: 'hada' };
  const NOMBRE_TIPO = { electrico: 'Eléctrico', psiquico: 'Psíquico', dragon: 'Dragón' };
  const bonito = t => NOMBRE_TIPO[t] || (t.charAt(0).toUpperCase() + t.slice(1));
  const eficacia = (ataque, defensa) => defensa.reduce((m, d) => m * ((TABLA[ataque] || {})[d] ?? 1), 1);
  // Lo mejor que le hace A a B con sus propios tipos (se supone que cada uno ataca con los suyos)
  const mejorGolpe = (a, b) => a.tipos.length ? Math.max(...a.tipos.map(t => eficacia(t, b.tipos))) : 1;

  /* ------------------------------------------------------------------ *
   *  TIPOS DE LOS RIVALES: la web solo enseña nombre y sprite; el tipo se busca por nº de Pokédex en PokéAPI
   *  (solo se manda el número) y se guarda para no volver a pedirlo.
   * ------------------------------------------------------------------ */
  const LS_TIPOS = 'axm-tipos';
  const tiposGuardados = lsGet(LS_TIPOS, {});
  const pidiendo = new Set();
  function pedirJSON(url) {
    return new Promise((ok, mal) => {
      if (typeof GM_xmlhttpRequest === 'function') {
        GM_xmlhttpRequest({ method: 'GET', url, timeout: 10000, onload: r => { try { ok(JSON.parse(r.responseText)); } catch (e) { mal(e); } }, onerror: mal, ontimeout: mal });
      } else fetch(url).then(r => r.json()).then(ok, mal);
    });
  }
  async function tiposDe(num) {
    if (!num) return null;
    if (tiposGuardados[num]) return tiposGuardados[num];
    if (pidiendo.has(num)) return null;
    pidiendo.add(num);
    try {
      const d = await pedirJSON('https://pokeapi.co/api/v2/pokemon/' + num);
      const t = (d.types || []).sort((a, b) => a.slot - b.slot).map(x => DE_INGLES[x.type.name]).filter(Boolean);
      if (t.length) { tiposGuardados[num] = t; lsPut(LS_TIPOS, tiposGuardados); pintarAnalisis(); }
      return t;
    } catch { return null; }
    finally { pidiendo.delete(num); }
  }

  /* ------------------------------------------------------------------ *
   *  LECTURA DE LA PANTALLA
   * ------------------------------------------------------------------ */
  function seccionParada() {
    return $$('main section').find(s => !ajeno(s) && /^\s*parada\s+\d+/i.test((s.querySelector('p') || {}).textContent || ''));
  }
  function leerTarjeta(card) {
    const img = card.querySelector('img');
    if (!img) return null;
    const src = img.getAttribute('src') || '';
    const num = parseInt((src.match(/\/(\d+)(?:[-_][a-z0-9]+)?\.(?:png|gif|webp)/i) || [])[1], 10) || null;
    const ps = $$('p', card).map(p => p.textContent.trim());
    const nivel = parseInt((ps.find(t => /^Nv\.\s*\d+/i.test(t)) || '').replace(/\D/g, ''), 10) || null;
    const tiposPills = $$('span.rounded-pill', card).map(s => norm(s.textContent)).filter(t => TABLA[t]);
    const barra = card.querySelector('span.block.h-full');
    const vida = barra ? parseFloat(barra.style.width) : null;
    const nombre = img.getAttribute('alt') || ps[0] || '?';
    return { card, nombre, num, nivel, tipos: tiposPills.length ? tiposPills : (tiposGuardados[num] || []), conPills: tiposPills.length > 0, vida, debil: parseFloat(card.style.opacity || '1') < 0.9 };
  }
  function leerCombate() {
    const sec = seccionParada();
    if (!sec) return null;
    const grid = sec.querySelector('div.grid');
    if (!grid || grid.children.length < 3) return null;
    const mios = $$(':scope > div', grid.children[0]).map(leerTarjeta).filter(Boolean);
    const rivales = $$(':scope > div', grid.children[2]).map(leerTarjeta).filter(Boolean);
    const parada = parseInt(((sec.querySelector('p') || {}).textContent || '').replace(/\D/g, ''), 10) || null;
    return { sec, mios, rivales, parada };
  }
  const racha = () => {
    const p = $$('main p').find(x => !ajeno(x) && /^racha$/i.test(x.textContent.trim()));
    const v = p && p.previousElementSibling;
    return v ? parseInt(v.textContent, 10) : null;
  };
  const botonPelear = () => $$('main button').find(b => !ajeno(b) && visible(b) && /pelear/i.test(b.textContent || ''));
  const botonCambiarVia = () => $$('main button').find(b => !ajeno(b) && visible(b) && /cambiar v[ií]a/i.test(b.textContent || ''));
  const cambiosQuedan = () => { const b = botonCambiarVia(); const m = b && b.textContent.match(/quedan?\s+(\d+)/i); return m ? parseInt(m[1], 10) : 0; };
  const energia = () => {
    const el = $$('header span, header p, header div').find(e => !e.children.length && /^\s*\d+\s*\/\s*\d+\s*$/.test(e.textContent || ''));
    return el ? parseInt(el.textContent, 10) : null;
  };

  /* ------------------------------------------------------------------ *
   *  ANÁLISIS: cada uno de los tuyos contra cada rival (tipos + nivel)
   *  Puntos por cruce: log2(lo que le haces) − log2(lo que te hace) + ajuste por nivel (±1 cada ~15 niveles)
   * ------------------------------------------------------------------ */
  function cruce(a, b) {
    const ataque = mejorGolpe(a, b), defensa = mejorGolpe(b, a);
    const lg = x => (x === 0 ? -3 : Math.log2(x));
    const nivel = a.nivel && b.nivel ? (a.nivel - b.nivel) / 15 : 0;
    return { ataque, defensa, puntos: lg(ataque) - lg(defensa) + nivel };
  }
  function analizar(c) {
    if (!c || !c.mios.length || !c.rivales.length) return null;
    const sinTipos = [...c.mios, ...c.rivales].some(p => !p.tipos.length);
    const filas = c.rivales.map(r => {
      const opciones = c.mios.filter(m => !m.debil).map(m => ({ m, ...cruce(m, r) })).sort((x, y) => y.puntos - x.puntos);
      return { r, mejor: opciones[0] || null, peor: opciones[opciones.length - 1] || null };
    });
    const suma = filas.reduce((s, f) => s + (f.mejor ? f.mejor.puntos : -2), 0) / filas.length;
    // En orden (1.º contra 1.º…), por si el combate va así
    const enOrden = c.rivales.map((r, i) => c.mios[i] ? cruce(c.mios[i], r).puntos : -2).reduce((s, x) => s + x, 0) / c.rivales.length;
    const nota = (suma + enOrden) / 2;
    const veredicto = nota >= 0.8 ? { txt: 'Ventaja clara', color: '#8FD88A' } : nota >= 0 ? { txt: 'Igualado, algo a favor', color: '#E6D36A' } : nota >= -0.8 ? { txt: 'Igualado, algo en contra', color: '#FFB23E' } : { txt: 'Desventaja', color: '#FF6B6B' };
    return { filas, nota, veredicto, sinTipos };
  }

  const mult = x => (x === 0 ? '×0' : x === 0.25 ? '×¼' : x === 0.5 ? '×½' : '×' + x);
  let firmaAnalisis = '';
  function pintarAnalisis() {
    const panel = document.getElementById(PANEL_ID);
    if (!panel) return;
    const c = leerCombate();
    if (c) for (const p of [...c.mios, ...c.rivales]) if (!p.tipos.length) tiposDe(p.num);
    const a = analizar(c);
    const caja = panel.querySelector('.axm-analisis');
    const firma = JSON.stringify(a && [a.nota, a.filas.map(f => [f.r.nombre, f.r.tipos, f.mejor && f.mejor.m.nombre])]);
    if (firma === firmaAnalisis) return;
    firmaAnalisis = firma;
    if (!a) { caja.innerHTML = ''; return; }
    const chip = t => `<span class="rounded-pill px-1 text-[8px] font-extrabold uppercase" style="border:1px solid #8A93A6;color:#C9CFDB">${bonito(t)}</span>`;
    caja.innerHTML = `
      <div class="flex items-center justify-between gap-2">
        <p class="text-xs font-extrabold uppercase tracking-wide" style="color:#E8ECF3">Análisis de tipos</p>
        <span class="font-mono text-xs font-bold" style="color:${a.veredicto.color}">${a.veredicto.txt}</span>
      </div>
      ${a.filas.map(f => `
        <div class="flex items-center gap-2 rounded-card p-1.5" style="background:#1F2430">
          <div class="min-w-0 flex-1">
            <p class="truncate text-[11px] font-extrabold" style="color:#E8ECF3">${f.r.nombre} <span style="color:#8A93A6">Nv.${f.r.nivel || '?'}</span></p>
            <span class="flex flex-wrap gap-0.5">${f.r.tipos.map(chip).join('') || '<span class="text-[9px]" style="color:#8A93A6">tipos…</span>'}</span>
          </div>
          ${f.mejor ? `<div class="text-right">
            <p class="text-[10px] font-extrabold" style="color:${f.mejor.puntos >= 0.5 ? '#8FD88A' : f.mejor.puntos >= -0.5 ? '#E6D36A' : '#FF6B6B'}">${f.mejor.puntos >= 0.5 ? '✔' : f.mejor.puntos >= -0.5 ? '≈' : '✖'} ${f.mejor.m.nombre}</p>
            <p class="text-[9px] font-bold" style="color:#8A93A6">le hace ${mult(f.mejor.ataque)} · recibe ${mult(f.mejor.defensa)}</p>
          </div>` : ''}
        </div>`).join('')}
      ${a.sinTipos ? '<p class="text-[10px] font-semibold" style="color:#8A93A6">Buscando los tipos que faltan…</p>' : ''}
      ${a.nota < -0.8 && cambiosQuedan() > 0 ? '<p class="text-[11px] font-bold" style="color:#FFB23E">💡 Mala pinta: quizá compense «Cambiar vía».</p>' : ''}`;
  }

  /* ------------------------------------------------------------------ *
   *  PELEAR EN BUCLE
   * ------------------------------------------------------------------ */
  const LS_OPC = 'axm-opciones';
  const opc = Object.assign({ maxParadas: '', pararRacha: '', cambiarVia: false }, lsGet(LS_OPC, {}));
  let enMarcha = false, msg = '', hechas = 0;
  function decir(t) { msg = t; const el = document.querySelector('#' + PANEL_ID + ' .axm-msg'); if (el) el.textContent = t; }
  function vibrar() { try { if (navigator.vibrate) navigator.vibrate(220); } catch { /* sin vibración */ } }

  // Botones de las pantallas de combate/resultado que llevan a la siguiente parada
  const RE_SEGUIR = /^\s*(seguir|continuar|siguiente( parada)?|aceptar|vale|ok|cobrar|recoger|volver a la l[ií]nea|a la siguiente)\b/i;
  const RE_NO_TOCAR = /panel de salidas|cambiar v[ií]a|rendir|abandonar|retirar|salir/i;

  async function bucle() {
    if (enMarcha) { enMarcha = false; decir('Parado.'); pintarBoton(); return; }
    enMarcha = true; hechas = 0; pintarBoton();
    const max = parseInt(opc.maxParadas, 10) || Infinity, objetivo = parseInt(opc.pararRacha, 10) || Infinity;
    let sinNada = 0;
    try {
      while (enMarcha) {
        const r0 = racha();
        if (r0 != null && r0 >= objetivo) { decir(`🎯 Racha ${r0}: objetivo cumplido. Parado.`); vibrar(); break; }
        if (hechas >= max) { decir(`Hechas ${hechas} paradas. Parado.`); break; }
        const e = energia();
        if (e != null && e < 2) { decir('Sin energía (hace falta 2). Parado.'); break; }

        const pel = botonPelear();
        if (pel && !pel.disabled) {
          // ¿Rival malo y quedan cambios de vía? (opcional)
          const a = analizar(leerCombate());
          if (opc.cambiarVia && a && !a.sinTipos && a.nota < -0.8 && cambiosQuedan() > 0) {
            decir(`Rival en desventaja para ti (${a.veredicto.txt}): cambio de vía.`);
            botonCambiarVia().click();
            await pausa(1200, 1800);
            continue;
          }
          decir(`🚇 Parada ${(leerCombate() || {}).parada || '?'} · peleo (racha ${r0 ?? '?'}).`);
          await pausa(500, 900);
          pel.click();
          hechas++;
          const t0 = Date.now();
          // Espera al resultado: se pulsa lo que haga falta hasta que vuelva el botón de pelear
          let vuelto = false;
          await sleep(1200);
          while (enMarcha && Date.now() - t0 < 60000) {
            const b = $$('button').find(x => !ajeno(x) && visible(x) && !x.disabled && RE_SEGUIR.test(x.textContent || '') && !RE_NO_TOCAR.test(x.textContent || ''));
            if (b) { await pausa(400, 800); b.click(); await sleep(700); continue; }
            const p2 = botonPelear();
            if (p2 && !p2.disabled && Date.now() - t0 > 1500) { vuelto = true; break; }
            if (p2 && p2.disabled && energia() != null && energia() < 2) break;
            await sleep(300);
          }
          const r1 = racha();
          if (r0 != null && r1 != null && r1 < r0) { decir(`💥 Perdida la racha de ${r0}. Parado.`); vibrar(); break; }
          if (!vuelto) {
            if (++sinNada >= 2) { decir('No reconozco la pantalla tras el combate. Parado (pásame su HTML).'); break; }
          } else sinNada = 0;
          await pausa(300, 600);
          continue;
        }
        // Sin botón de pelear: quizá una pantalla de resultado
        const b = $$('button').find(x => !ajeno(x) && visible(x) && !x.disabled && RE_SEGUIR.test(x.textContent || '') && !RE_NO_TOCAR.test(x.textContent || ''));
        if (b) { b.click(); await pausa(700, 1100); continue; }
        if (pel && pel.disabled) { decir('El botón de pelear está desactivado (¿sin energía?). Parado.'); break; }
        if (++sinNada > 30) { decir('No veo el botón «Pelear». Parado.'); break; }
        await sleep(300);
      }
    } catch (e) {
      console.error('[axm]', e);
      decir('Error: ' + (e && e.message || e));
    } finally {
      if (enMarcha && !/parado/i.test(msg)) decir(`Hecho: ${hechas} parada(s).`);
      enMarcha = false; pintarBoton();
    }
  }

  /* ------------------------------------------------------------------ *
   *  PANEL (tras el botón de pelear, con el estilo oscuro de la línea)
   * ------------------------------------------------------------------ */
  function pintarBoton() {
    const b = document.querySelector('#' + PANEL_ID + ' [data-a="bucle"]');
    if (b) b.textContent = enMarcha ? '■ Parar' : '🔁 Pelear en bucle';
  }
  function construir() {
    const p = document.createElement('section');
    p.id = PANEL_ID;
    p.className = 'space-y-2 rounded-card p-3';
    p.style.cssText = 'background:#171B23;border:2px solid #2F3644';
    const campo = 'w-16 rounded-card px-2 py-1 text-xs font-bold outline-none';
    const estilo = 'background:#0A0B0E;border:1.5px solid #2F3644;color:#E8ECF3';
    p.innerHTML = `
      <div class="axm-analisis space-y-1.5"></div>
      <div class="grid grid-cols-2 gap-2 text-[10px] font-extrabold uppercase tracking-wide" style="color:#8A93A6">
        <label class="flex items-center justify-between gap-1">Máx. paradas <input type="number" min="1" data-o="maxParadas" class="${campo}" style="${estilo}" placeholder="∞"></label>
        <label class="flex items-center justify-between gap-1">Parar en racha <input type="number" min="1" data-o="pararRacha" class="${campo}" style="${estilo}" placeholder="—"></label>
      </div>
      <label class="flex items-center gap-2 text-[11px] font-bold" style="color:#C9CFDB"><input type="checkbox" data-o="cambiarVia"> Usar «Cambiar vía» solo si hay desventaja clara</label>
      <button type="button" data-a="bucle" class="w-full rounded-card py-2.5 text-sm font-extrabold transition active:scale-[0.98]" style="background:#E8ECF3;color:#101319"></button>
      <p class="axm-msg text-center text-[11px] font-semibold" style="color:#8A93A6"></p>`;
    for (const i of $$('input[data-o]', p)) {
      const k = i.dataset.o;
      if (i.type === 'checkbox') i.checked = !!opc[k]; else i.value = opc[k] || '';
      i.addEventListener('input', () => { opc[k] = i.type === 'checkbox' ? i.checked : i.value.trim(); lsPut(LS_OPC, opc); });
      i.addEventListener('change', () => { opc[k] = i.type === 'checkbox' ? i.checked : i.value.trim(); lsPut(LS_OPC, opc); });
    }
    p.querySelector('[data-a="bucle"]').addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); bucle(); });
    return p;
  }
  function montar() {
    let panel = document.getElementById(PANEL_ID);
    if (!enMetro()) { enMarcha = false; if (panel) panel.remove(); return; }
    const pel = botonPelear();
    const ancla = pel || (seccionParada() && seccionParada().parentElement.lastElementChild);
    if (!ancla) { if (panel && !enMarcha) panel.remove(); return; }
    if (!panel) { panel = construir(); firmaAnalisis = ''; }
    if (pel && panel.previousElementSibling !== pel) pel.insertAdjacentElement('afterend', panel);
    else if (!pel && !panel.isConnected) ancla.insertAdjacentElement('afterend', panel);
    pintarBoton();
    decir(msg);
    pintarAnalisis();
  }

  esperarHidratacion().then(() => { montar(); setInterval(montar, 700); });
})();
