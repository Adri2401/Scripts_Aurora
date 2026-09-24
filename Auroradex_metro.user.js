// ==UserScript==
// @name         Aurora Dex · Metro Batalla (pelear en bucle y ventaja de tipos)
// @namespace    auroradex-metro
// @version      1.1.0
// @description  Solo en /metro. Al elegir equipo analiza tus seis (debilidades, estadísticas, flojos) y marca el mejor orden; en cada parada predice el combate. Pulsa «Pelear» en bucle con tope de paradas o de racha.
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
      if (t.length) { tiposGuardados[num] = t; lsPut(LS_TIPOS, tiposGuardados); refrescarTodo(); }
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
  const refrescarTodo = () => { firmaAnalisis = ''; firmaEquipo = ''; memoEquipo = null; pintarAnalisis(); pintarEquipo(); };
  function pintarAnalisis() {
    const panel = document.getElementById(PANEL_ID);
    if (!panel) return;
    const c = leerCombate();
    if (c) for (const p of [...c.mios, ...c.rivales]) if (!pokeGuardados[p.num]) datosDe(p.num);
    if (c && c.rivales.length && c.rivales.every(r => r.num)) apuntarRivales(c);
    const a = analizar(c);
    const pr = prediccion(c);
    const caja = panel.querySelector('.axm-analisis');
    const firma = JSON.stringify(a && [a.nota, pr, a.filas.map(f => [f.r.nombre, f.r.tipos, f.mejor && f.mejor.m.nombre])]);
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
      ${pr ? `<p class="text-[11px] font-extrabold" style="color:${pr.gana ? '#8FD88A' : '#FF6B6B'}">Predicción con este orden: ${pr.gana ? `ganas (te quedan ${pr.vivos} en pie)` : `pierdes (le quedan ${pr.restantes} al rival)`}</p>` : ''}
      ${a.sinTipos ? '<p class="text-[10px] font-semibold" style="color:#8A93A6">Buscando los tipos que faltan…</p>' : ''}
      ${((pr && !pr.gana) || (!pr && a.nota < -0.8)) && cambiosQuedan() > 0 ? '<p class="text-[11px] font-bold" style="color:#FFB23E">💡 Mala pinta: quizá compense «Cambiar vía».</p>' : ''}`;
  }

  /* ------------------------------------------------------------------ *
   *  MODELO DE COMBATE (aproximado: el juego calcula el combate en su servidor)
   *  1 contra 1, sin cambios: el ganador sigue con la vida que le quede contra el siguiente. Cada uno ataca con
   *  el mejor de SUS tipos (ataque de 80 de potencia, ×1,5 por ser de su tipo), usa el mayor de Ataque/At. Esp.
   *  contra la defensa que toque, y pega primero el más rápido. Estadísticas: las base de PokéAPI al nivel que toque.
   * ------------------------------------------------------------------ */
  const LS_POKE = 'axm-poke';
  const pokeGuardados = lsGet(LS_POKE, {});
  const pidiendoPoke = new Set();
  async function datosDe(num) {
    if (!num) return null;
    if (pokeGuardados[num]) return pokeGuardados[num];
    if (pidiendoPoke.has(num)) return null;
    pidiendoPoke.add(num);
    try {
      const d = await pedirJSON('https://pokeapi.co/api/v2/pokemon/' + num);
      const t = (d.types || []).sort((a, b) => a.slot - b.slot).map(x => DE_INGLES[x.type.name]).filter(Boolean);
      const orden = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];
      const s = orden.map(k => ((d.stats || []).find(x => x.stat.name === k) || {}).base_stat || 70);
      if (t.length) {
        pokeGuardados[num] = { t, s };
        lsPut(LS_POKE, pokeGuardados);
        tiposGuardados[num] = t; lsPut(LS_TIPOS, tiposGuardados);
        refrescarTodo();
      }
      return pokeGuardados[num];
    } catch { return null; }
    finally { pidiendoPoke.delete(num); }
  }

  // Luchador listo para el modelo: tipos (los de la web si los enseña), estadísticas al nivel dado
  function luchador(p, nivelForzado, baseDirecta) {
    const d = baseDirecta ? { s: baseDirecta, t: p.tipos } : pokeGuardados[p.num];
    if (!d) return null;
    const L = nivelForzado || p.nivel || 50, b = d.s;
    const st = i => Math.floor(2 * b[i] * L / 100) + 5;
    return { nombre: p.nombre, num: p.num, nivel: L, tipos: (p.tipos && p.tipos.length) ? p.tipos : d.t, hp: Math.floor(2 * b[0] * L / 100) + L + 10, atk: st(1), def: st(2), spa: st(3), spd: st(4), spe: st(5), bst: b.reduce((x, y) => x + y, 0) };
  }
  function dano(a, b) {
    let mejor = 0;
    for (const t of a.tipos) {
      const fis = a.atk >= a.spa, A = fis ? a.atk : a.spa, D = fis ? b.def : b.spd;
      const base = ((2 * a.nivel / 5 + 2) * 80 * A / D) / 50 + 2;
      mejor = Math.max(mejor, base * 1.5 * eficacia(t, b.tipos));
    }
    return mejor;
  }
  // Un duelo: devuelve quién gana y con cuánta vida
  function duelo(a, hpA, b, hpB) {
    const dA = dano(a, b), dB = dano(b, a);
    const tA = dA > 0 ? Math.ceil(hpB / dA) : Infinity, tB = dB > 0 ? Math.ceil(hpA / dB) : Infinity;
    if (tA === Infinity && tB === Infinity) return hpA / a.hp >= hpB / b.hp ? { ganaA: true, hpA, hpB: 0 } : { ganaA: false, hpA: 0, hpB };
    const primeroA = a.spe > b.spe || (a.spe === b.spe && hpA >= hpB);
    if (primeroA) return tA <= tB ? { ganaA: true, hpA: hpA - (tA - 1) * dB, hpB: 0 } : { ganaA: false, hpA: 0, hpB: hpB - tB * dA };
    return tB <= tA ? { ganaA: false, hpA: 0, hpB: hpB - (tB - 1) * dA } : { ganaA: true, hpA: hpA - tA * dB, hpB: 0 };
  }
  // Combate completo en orden; `vidaA` opcional (fracciones 0..1, para la Línea Negra)
  function combate(mios, rivales, vidaA) {
    let i = 0, j = 0, hpA = mios[0] ? mios[0].hp * (vidaA ? vidaA[0] : 1) : 0, hpB = rivales[0] ? rivales[0].hp : 0;
    while (i < mios.length && j < rivales.length) {
      if (hpA <= 0) { i++; if (i < mios.length) hpA = mios[i].hp * (vidaA ? vidaA[i] : 1); continue; }
      const r = duelo(mios[i], hpA, rivales[j], hpB);
      if (r.ganaA) { hpA = r.hpA; j++; if (j < rivales.length) hpB = rivales[j].hp; }
      else { hpB = r.hpB; i++; if (i < mios.length) hpA = mios[i].hp * (vidaA ? vidaA[i] : 1); }
    }
    return { gana: j >= rivales.length, vivos: mios.length - i, restantes: rivales.length - j };
  }

  /* ---- Rivales vistos por línea (para comparar con rivales de verdad) ---- */
  const LS_RIVALES = 'axm-rivales';
  const lineaActual = () => { const h = $$('main h1').find(x => /l[ií]nea/i.test(x.textContent || '')); return h ? norm(h.textContent).replace(/^linea\s+/, '') : 'metro'; };
  function apuntarRivales(c) {
    const todos = lsGet(LS_RIVALES, {}), l = lineaActual(), lista = todos[l] || [];
    const clave = c.rivales.map(r => r.num + '@' + r.nivel).join(',');
    if (lista.some(e => e.clave === clave)) return;
    lista.push({ clave, equipo: c.rivales.map(r => ({ num: r.num, nombre: r.nombre, nivel: r.nivel })) });
    todos[l] = lista.slice(-80);
    lsPut(LS_RIVALES, todos);
  }
  // Rivales de referencia: los vistos en esta línea (si hay bastantes) o un banco genérico de todos los tipos
  const GENERICOS = ['normal', 'fuego', 'agua', 'planta', 'electrico', 'hielo', 'lucha', 'veneno', 'tierra', 'volador', 'psiquico', 'bicho', 'roca', 'fantasma', 'dragon', 'siniestro', 'acero',
    'agua/tierra', 'fuego/volador', 'planta/veneno', 'dragon/volador', 'acero/psiquico', 'agua/volador', 'roca/tierra', 'bicho/volador', 'psiquico/fantasma', 'siniestro/fantasma', 'electrico/acero', 'hielo/agua', 'lucha/acero', 'normal/volador', 'dragon/tierra'];
  function bancoRivales(nivel, base = 85) {
    const vistos = (lsGet(LS_RIVALES, {})[lineaActual()] || []);
    const equipos = [];
    for (const e of vistos) {
      for (const p of e.equipo) if (!pokeGuardados[p.num]) datosDe(p.num);
      const eq = e.equipo.map(p => luchador({ ...p, tipos: null }, lineaActual() === 'verde' ? 50 : p.nivel)).filter(Boolean);
      if (eq.length === e.equipo.length && eq.length) equipos.push(eq);
    }
    if (equipos.length >= 8) return { equipos, origen: `${equipos.length} equipos rivales que ya te han salido en esta línea` };
    // genérico: tríos al azar de un banco de 32 tipos con la misma fuerza media que tu equipo (así se nota quién rinde más)
    let semilla = 7; const azar = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647;
    // cada tipo en 4 variantes (rápido, lento, de ataque, de aguante) con la misma suma de estadísticas
    const PERFILES = [[0, 0, 0, 0, 0, 25], [10, 5, 10, 5, 10, -40], [-5, 20, -10, 20, -10, -15], [20, -10, 15, -10, 15, -30]];
    const banco = [];
    for (const t of GENERICOS) PERFILES.forEach((pf, i) => {
      const b6 = pf.map(d => Math.max(30, base + d + Math.round((azar() - 0.5) * 10)));
      banco.push(luchador({ nombre: t + ' · ' + i, num: 'g', tipos: t.split('/'), nivel }, nivel, b6));
    });
    for (let k = 0; k < 300; k++) { const a = [...banco].sort(() => azar() - 0.5).slice(0, 3); equipos.push(a); }
    return { equipos, origen: vistos.length ? `rivales genéricos (solo llevas ${vistos.length} equipos vistos en esta línea)` : 'rivales genéricos de todos los tipos (aún no has visto rivales en esta línea)' };
  }

  // Debilidades y resistencias de un Pokémon por sus tipos
  function defensa(tipos) {
    const deb = [], res = [], inm = [];
    for (const t of Object.keys(TABLA)) {
      const e = eficacia(t, tipos);
      if (e >= 2) deb.push(e >= 4 ? bonito(t) + ' ×4' : bonito(t));
      else if (e === 0) inm.push(bonito(t));
      else if (e < 1) res.push(bonito(t));
    }
    return { deb, res, inm, x4: deb.some(d => /×4/.test(d)) };
  }

  /* ---- Pantalla «¿Con quién subes?»: análisis de los seis y mejor orden ---- */
  function seccionElegir() {
    return $$('main section').find(s => !ajeno(s) && /con qui[eé]n subes|elige tres/i.test((s.querySelector('p') || {}).textContent || ''));
  }
  function leerBanquillo() {
    const sec = seccionElegir();
    if (!sec) return null;
    const tam = parseInt(((sec.querySelector('span span') || sec.querySelector('span') || {}).textContent || '').split('/')[1], 10) || 3;
    const cands = $$('div.grid button', sec).map(b => {
      const img = b.querySelector('img'), ps = $$('p', b).map(p => p.textContent.trim());
      const num = parseInt(((img && img.getAttribute('src')) || '').match(/\/(\d+)(?:[-_][a-z0-9]+)?\.(?:png|gif|webp)/i)?.[1], 10) || null;
      const marca = b.querySelector('span.absolute');
      return { boton: b, nombre: ps[0] || '?', nivel: parseInt((ps.find(t => /^Nv\./.test(t)) || '').replace(/\D/g, ''), 10) || 50, num, orden: marca ? parseInt(marca.textContent, 10) : 0, tipos: null };
    });
    return { sec, tam, cands };
  }
  function permutaciones(arr, k) {
    const out = [];
    const rec = (pref, resto) => { if (pref.length === k) { out.push(pref); return; } resto.forEach((x, i) => rec([...pref, x], resto.filter((_, j) => j !== i))); };
    rec([], arr);
    return out;
  }
  function analizarEquipo(b) {
    const verde = lineaActual() === 'verde';
    const mios = b.cands.map(c => ({ c, l: luchador(c, verde ? 50 : c.nivel) }));
    const faltan = mios.filter(m => !m.l);
    if (faltan.length) return { faltan: faltan.length };
    const nivelMedio = Math.round(mios.reduce((s, m) => s + m.l.nivel, 0) / mios.length);
    const baseMedia = Math.round(mios.reduce((s, m) => s + m.l.bst, 0) / mios.length / 6);
    const { equipos, origen } = bancoRivales(verde ? 50 : nivelMedio, baseMedia);
    // cada uno por separado: qué parte de los rivales tumba de uno en uno
    const rivalesSueltos = [...new Map(equipos.flat().map(r => [r.nombre + r.nivel, r])).values()];
    const fichas = mios.map(m => {
      const gana = rivalesSueltos.filter(r => duelo(m.l, m.l.hp, r, r.hp).ganaA).length / rivalesSueltos.length;
      const d = defensa(m.l.tipos);
      const ojo = [];
      if (d.x4) ojo.push('una debilidad ×4');
      if (d.deb.length >= 5) ojo.push(`${d.deb.length} debilidades`);
      if (m.l.bst < 420) ojo.push(`estadísticas bajas (${m.l.bst})`);
      return { ...m, gana, d, ojo, flojo: false };
    });
    // «Flojo»: de los que peor rinden del grupo y además con motivos (o muy por debajo de la media)
    const media = fichas.reduce((s, f) => s + f.gana, 0) / fichas.length;
    for (const f of fichas) f.flojo = f.gana < media - 0.15 || (f.gana < media && f.ojo.length > 0);
    // el mejor orden: todos los tríos ordenados contra los mismos equipos rivales
    let mejor = null;
    for (const orden of permutaciones(fichas, Math.min(b.tam, fichas.length))) {
      let ganadas = 0, vivos = 0;
      for (const eq of equipos) { const r = combate(orden.map(f => f.l), eq); if (r.gana) { ganadas++; vivos += r.vivos; } }
      const nota = ganadas / equipos.length + vivos / equipos.length / 100;
      if (!mejor || nota > mejor.nota) mejor = { orden, nota, ganadas: ganadas / equipos.length };
    }
    return { fichas, mejor, origen };
  }

  let firmaEquipo = '', memoEquipo = null;
  function pintarEquipo() {
    let caja = document.getElementById('axm-equipo');
    const b = enMetro() ? leerBanquillo() : null;
    if (!b || !b.cands.length) { if (caja) caja.remove(); firmaEquipo = ''; return; }
    for (const c of b.cands) if (!pokeGuardados[c.num]) datosDe(c.num);
    if (!caja) {
      caja = document.createElement('section');
      caja.id = 'axm-equipo';
      caja.className = 'space-y-2 rounded-card p-3';
      caja.style.cssText = 'background:#171B23;border:2px solid #2F3644';
    }
    if (caja.previousElementSibling !== b.sec) b.sec.insertAdjacentElement('afterend', caja);
    const entrada = JSON.stringify([lineaActual(), b.cands.map(c => [c.num, c.nivel, !!pokeGuardados[c.num]]), (lsGet(LS_RIVALES, {})[lineaActual()] || []).length]);
    if (!memoEquipo || memoEquipo.entrada !== entrada) memoEquipo = { entrada, a: analizarEquipo(b) };
    const a = memoEquipo.a;
    const firma = JSON.stringify(a.faltan ? ['f', a.faltan] : [a.origen, a.mejor.orden.map(f => f.c.nombre), a.fichas.map(f => [f.c.nombre, Math.round(f.gana * 100)])]);
    if (firma === firmaEquipo) return;
    firmaEquipo = firma;
    if (a.faltan) { caja.innerHTML = `<p class="text-[11px] font-semibold" style="color:#8A93A6">Buscando estadísticas de ${a.faltan} Pokémon…</p>`; return; }
    const chip = t => `<span class="rounded-pill px-1 text-[8px] font-extrabold uppercase" style="border:1px solid #8A93A6;color:#C9CFDB">${bonito(t)}</span>`;
    const pct = x => Math.round(x * 100) + '%';
    const color = x => (x >= 0.6 ? '#8FD88A' : x >= 0.4 ? '#E6D36A' : '#FF6B6B');
    caja.innerHTML = `
      <div class="flex items-center justify-between gap-2">
        <p class="text-xs font-extrabold uppercase tracking-wide" style="color:#E8ECF3">Mejor orden</p>
        <span class="font-mono text-xs font-bold" style="color:${color(a.mejor.ganadas)}">gana ~${pct(a.mejor.ganadas)}</span>
      </div>
      <p class="text-sm font-extrabold" style="color:#E8ECF3">${a.mejor.orden.map((f, i) => `${i + 1}. ${f.c.nombre}`).join(' · ')}</p>
      <button type="button" data-a="elegir" class="w-full rounded-card py-2 text-xs font-extrabold transition active:scale-[0.98]" style="background:#E8ECF3;color:#101319">✔ Marcar este orden</button>
      <p class="text-[10px] font-semibold" style="color:#8A93A6">Comparado con ${a.origen}. «Gana» es contra rivales de tu mismo nivel de fuerza. Es una estimación: el juego no enseña su fórmula de combate.</p>
      ${a.fichas.slice().sort((x, y) => y.gana - x.gana).map(f => `
        <div class="rounded-card p-1.5" style="background:#1F2430">
          <div class="flex items-center justify-between gap-2">
            <p class="truncate text-[11px] font-extrabold" style="color:#E8ECF3">${f.flojo ? '⚠️ ' : ''}${f.c.nombre} <span style="color:#8A93A6">· ${f.l.bst} base</span></p>
            <span class="text-[10px] font-extrabold" style="color:${color(f.gana)}">gana ${pct(f.gana)} de 1 en 1</span>
          </div>
          <span class="flex flex-wrap gap-0.5">${f.l.tipos.map(chip).join('')}</span>
          <p class="text-[9px] font-bold" style="color:#8A93A6">Débil a: ${f.d.deb.join(', ') || 'nada'}${f.d.inm.length ? ' · inmune a: ' + f.d.inm.join(', ') : ''}</p>
          ${f.flojo ? `<p class="text-[9px] font-bold" style="color:#FFB23E">Flojo: mejor no llevarlo${f.ojo.length ? ' (' + f.ojo.join(', ') + ')' : ''}.</p>` : f.ojo.length ? `<p class="text-[9px] font-bold" style="color:#8A93A6">Ojo: ${f.ojo.join(', ')}.</p>` : ''}
        </div>`).join('')}`;
    caja.querySelector('[data-a="elegir"]').addEventListener('click', async e => {
      e.preventDefault(); e.stopPropagation();
      // se desmarcan los que haya (del último al primero) y se marcan en el orden recomendado
      let bb = leerBanquillo();
      for (const c of bb.cands.filter(x => x.orden).sort((x, y) => y.orden - x.orden)) { c.boton.click(); await sleep(250); }
      for (const f of a.mejor.orden) {
        bb = leerBanquillo();
        const c = bb.cands.find(x => x.num === f.c.num && x.nombre === f.c.nombre && !x.orden);
        if (c) { c.boton.click(); await sleep(300); }
      }
    });
  }

  // Predicción del combate de la parada con el orden actual (tuyos en el orden en que salen)
  function prediccion(c) {
    if (!c) return null;
    const verde = lineaActual() === 'verde';
    const mios = c.mios.map(p => luchador(p, verde ? 50 : p.nivel)), rivales = c.rivales.map(p => luchador({ ...p, tipos: null }, verde ? 50 : p.nivel));
    if (mios.some(x => !x) || rivales.some(x => !x)) return null;
    const vida = lineaActual() === 'negra' ? c.mios.map(p => (p.vida == null ? 1 : p.vida / 100)) : null;
    return combate(mios, rivales, vida);
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
          const pr = prediccion(leerCombate());
          if (opc.cambiarVia && a && !a.sinTipos && (pr ? !pr.gana : a.nota < -0.8) && cambiosQuedan() > 0) {
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
    if (!enMetro()) { enMarcha = false; if (panel) panel.remove(); pintarEquipo(); return; }
    const pel = botonPelear();
    if (!pel && !seccionParada()) pintarEquipo();
    const ancla = pel || (seccionParada() && seccionParada().parentElement.lastElementChild);
    if (!ancla) { if (panel && !enMarcha) panel.remove(); return; }
    if (!panel) { panel = construir(); firmaAnalisis = ''; }
    pintarEquipo();
    if (pel && panel.previousElementSibling !== pel) pel.insertAdjacentElement('afterend', panel);
    else if (!pel && !panel.isConnected) ancla.insertAdjacentElement('afterend', panel);
    pintarBoton();
    decir(msg);
    pintarAnalisis();
  }

  esperarHidratacion().then(() => { montar(); setInterval(montar, 700); });
})();
