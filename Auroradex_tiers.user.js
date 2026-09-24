// ==UserScript==
// @name         Aurora Dex · Tiers (S a G) y debilidades
// @namespace    auroradex-tiers
// @version      1.2.0
// @description  Solo en /equipo. Pone un icono de tier (S, A, B… G) a cada Pokémon del equipo y la Caja PC (también los especiales), ordena la Caja por tier, recomienda el orden del equipo y en su ficha añade debilidades, resistencias, a quién pega fuerte y contra qué sufre. El tier sale de simular duelos 1 contra 1 con las fórmulas del propio juego.
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
   *  MODELO DEL JUEGO
   *  Estadísticas: PS = 3·base·Nv/100 + Nv + 14 · ATQ/DEF/VEL = 2·base·Nv/100 + 5 · la web enseña una sola ESP
   *  (media de At. Esp. y Def. Esp.). En combate cada uno ataca con su tipo más eficaz y con el mayor de ATQ y ESP
   *  (el daño especial encaja mejor con At. Esp. contra Def. Esp. por separado, según los logs del Metro); si no le
   *  afecta ninguno de sus tipos, Forcejeo (1/16). Pega primero el más rápido.
   * ------------------------------------------------------------------ */
  function stats(b, L) {
    const st = x => Math.floor(2 * x * L / 100) + 5;
    return { hp: Math.floor(3 * b[0] * L / 100) + L + 14, atk: st(b[1]), def: st(b[2]), esp: st(Math.round((b[3] + b[4]) / 2)), spa: st(b[3]), spd: st(b[4]), spe: st(b[5]) };
  }
  function tipoAtaque(a, b) { let m = null; for (const t of a.tipos) { const e = eficacia(t, b.tipos); if (!m || e > m.e) m = { t, e }; } return m || { t: null, e: 1 }; }
  function golpe(a, b) {
    const { e } = tipoAtaque(a, b);
    if (e === 0) return 1 / 16;
    const fis = a.atk > a.esp, A = fis ? a.atk : a.spa, D = fis ? b.def : b.spd;
    return ((((2 * a.L / 5 + 2) * 80 * A / D) / 50 + 2) * 1.5 * e) / b.hp * 0.3;
  }
  // Única habilidad del juego: Slaking (nº 289) ataca un turno sí y otro no → para dar t golpes necesita 2t − 1 turnos
  const HOLGAZAN = 289;
  const turnos = (x, t) => (x.num === HOLGAZAN ? 2 * t - 1 : t);
  function duelo(a, b) {
    const tA = turnos(a, Math.ceil(1 / golpe(a, b) - 1e-9)), tB = turnos(b, Math.ceil(1 / golpe(b, a) - 1e-9));
    if (a.spe > b.spe) return tA <= tB ? 1 : 0;
    if (a.spe < b.spe) return tB <= tA ? 0 : 1;
    return tA < tB ? 1 : tA > tB ? 0 : 0.5;
  }
  // Banco de rivales de referencia: 34 tipos (simples y dobles) × 4 perfiles de estadísticas, todos a Nv.50
  const GEN = ['normal', 'fuego', 'agua', 'planta', 'electrico', 'hielo', 'lucha', 'veneno', 'tierra', 'volador', 'psiquico', 'bicho', 'roca', 'fantasma', 'dragon', 'siniestro', 'acero', 'hada',
    'agua/tierra', 'fuego/volador', 'planta/veneno', 'dragon/volador', 'acero/psiquico', 'agua/volador', 'roca/tierra', 'bicho/volador', 'normal/volador', 'siniestro/fantasma', 'electrico/acero', 'hielo/agua', 'lucha/acero', 'dragon/tierra', 'psiquico/hada', 'veneno/siniestro'];
  const PERFILES = [[80, 80, 80, 80, 80, 80], [70, 100, 70, 60, 70, 110], [100, 70, 100, 90, 100, 45], [75, 60, 70, 110, 90, 95]];
  const BANCO = GEN.flatMap(t => PERFILES.map(p => ({ ...stats(p, 50), L: 50, tipos: t.split('/') })));
  const TIERS = [['S', 0.88, '#FFB23E'], ['A', 0.76, '#E0473A'], ['B', 0.62, '#A855F7'], ['C', 0.48, '#3B82F6'], ['D', 0.34, '#10B981'], ['E', 0.20, '#84CC16'], ['F', 0.08, '#94A3B8'], ['G', -1, '#64748B']];
  const cacheTier = {};
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
    const r = { holgazan: num === HOLGAZAN, letra, color, pct, d, deb4, deb2, res, inm, fuerte, nulo, flojo, peores, esp, ataque: d.s[1] > esp ? 'ATQ (físico)' : 'ESP (especial)' };
    cacheTier[clave] = r;
    return r;
  }

  /* ------------------------------------------------------------------ *
   *  ICONO DE TIER EN CADA TARJETA
   * ------------------------------------------------------------------ */
  const numDe = img => { const m = (img.getAttribute('src') || '').match(/\/sprites\/(?:[a-z0-9_-]+\/)*?(?:dorso-)?(\d+)(?:[-_.])/i); return m ? parseInt(m[1], 10) : null; };
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
      if (caja && caja.dataset.num === num + '|' + tipos.join('/')) continue;
      const t = analizar(num, tipos);
      if (!t) { pedir(num); continue; }
      if (!caja) { caja = document.createElement('div'); caja.className = 'axt-ficha space-y-1.5'; caja.setAttribute('data-ax-ignore', '1'); bloque.insertAdjacentElement('afterend', caja); }
      caja.dataset.num = num + '|' + tipos.join('/');
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
        ${fila('Sufre contra', t.peores)}`;
      const cab = caja.children[1];
      cab.appendChild(insignia(t, true));
      const txt = document.createElement('span');
      txt.className = 'text-xs font-extrabold text-tinta-600';
      txt.textContent = `Tier ${t.letra}`;
      cab.appendChild(txt);
    }
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
    const tA = turnos(a, Math.ceil(fb / dA - 1e-9)), tB = turnos(b, Math.ceil(fa / dB - 1e-9));
    const primeroA = a.spe > b.spe || (a.spe === b.spe && fa >= fb);
    if (primeroA) return tA <= tB ? { ganaA: true, fa: fa - gB(tA - 1) * dB, fb: 0 } : { ganaA: false, fa: 0, fb: fb - gA(tB) * dA };
    return tB <= tA ? { ganaA: false, fa: 0, fb: fb - gA(tB - 1) * dA } : { ganaA: true, fa: fa - gB(tA) * dB, fb: 0 };
  }
  function combate(mios, rivales) {
    let i = 0, j = 0, fa = 1, fb = 1;
    while (i < mios.length && j < rivales.length) {
      const r = dueloF(mios[i], fa, rivales[j], fb);
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
      return { num, nombre, nivel, tipos: tiposEn(li.querySelector('button') || li) };
    }).filter(m => m.num);
    if (miembros.length < 2) { if (caja) caja.remove(); return; }
    for (const m of miembros) if (!datos[m.num]) pedir(m.num);
    if (miembros.some(m => !datos[m.num])) return;
    const entrada = JSON.stringify(miembros);
    if (!memoEquipo || memoEquipo.entrada !== entrada) {
      const luch = miembros.map(m => ({ ...stats(datos[m.num].s, m.nivel), L: m.nivel, tipos: m.tipos.length ? m.tipos : datos[m.num].t, num: m.num, nombre: m.nombre }));
      const nivel = Math.round(miembros.reduce((x, m) => x + m.nivel, 0) / miembros.length);
      // rivales con la misma fuerza media que tu equipo (si no, con legendarios todo sale al 100% y no se distingue el orden)
      const baseMedia = miembros.reduce((x, m) => x + datos[m.num].s.reduce((p, q) => p + q, 0), 0) / miembros.length / 6;
      const banco = GEN.flatMap(t => PERFILES.map(pf => ({ ...stats(pf.map(v => Math.max(30, Math.round(v + baseMedia - 80))), nivel), L: nivel, tipos: t.split('/'), num: 0 })));
      let semilla = 11; const azar = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647;
      const trios = [];
      for (let k = 0; k < 300; k++) trios.push([...banco].sort(() => azar() - 0.5).slice(0, 3));
      const nota = orden => { let g = 0, v = 0; for (const tr of trios) { const r = combate(orden, tr); if (r.gana) { g++; v += r.vivos; } } return { g: g / trios.length, v: v / trios.length }; };
      let mejor = null;
      for (const orden of permutaciones(luch, Math.min(3, luch.length))) {
        const n = nota(orden);
        if (!mejor || n.g + n.v / 100 > mejor.n.g + mejor.n.v / 100) mejor = { orden, n };
      }
      const actual = nota(luch.slice(0, 3));
      memoEquipo = { entrada, mejor, actual, nivel };
    }
    const { mejor, actual, nivel } = memoEquipo;
    const yaEsta = mejor.orden.every((x, i) => miembros[i] && miembros[i].num === x.num && miembros[i].nombre === x.nombre);
    if (!caja) {
      caja = document.createElement('section');
      caja.id = 'axt-equipo';
      caja.className = 'tarjeta space-y-1.5 p-3';
      caja.setAttribute('data-ax-ignore', '1');
    }
    if (caja.nextElementSibling !== lista) lista.insertAdjacentElement('beforebegin', caja);
    const pct = x => Math.round(x * 100) + '%';
    const html = `
      <div class="flex items-center justify-between gap-2">
        <p class="titulo-seccion !mb-0">⚔️ Orden recomendado</p>
        <span class="text-[11px] font-extrabold ${yaEsta ? 'text-hoja-600' : 'text-ambar-600'}">${yaEsta ? '✔ Ya lo tienes así' : `gana ${pct(mejor.n.g)} (ahora ${pct(actual.g)})`}</span>
      </div>
      <p class="text-sm font-extrabold">${mejor.orden.map((x, i) => `${i + 1}. ${x.nombre}`).join(' · ')}</p>
      <p class="text-[10px] font-semibold text-tinta-400">${yaEsta ? 'Tus 3 primeros ya son los que más combates ganan en ese orden.' : 'Arrastra por el asa ⠿ para ponerlos así.'} Contra rivales de todos los tipos, tan fuertes de media como tu equipo, a Nv.${nivel}; los tuyos a su nivel real y en orden (el que gana sigue con la vida que le queda). Los objetos no se cuentan.</p>`;
    if (caja.dataset.html !== html) { caja.innerHTML = html; caja.dataset.html = html; }
  }

  /* ------------------------------------------------------------------ *
   *  ARRANQUE: solo en /equipo; se repasa al cambiar la página (con un pequeño retraso para no cargar)
   * ------------------------------------------------------------------ */
  let prog = null, listo = false;
  function programar() {
    clearTimeout(prog);
    prog = setTimeout(() => {
      if (!listo || !enEquipo()) return;
      try { decorarTarjetas(); decorarFichas(); botonOrden(); ordenar(); ordenEquipo(); } catch (e) { console.warn('[axt]', e); }
    }, 250);
  }
  new MutationObserver(muts => {
    if (!enEquipo()) return;
    // se ignoran los cambios que hace este mismo script
    if (muts.every(m => [...m.addedNodes].every(n => n.nodeType === 1 && (n.classList.contains('axt-tier') || n.classList.contains('axt-ficha') || n.id === 'axt-equipo' || n.classList.contains('axt-orden'))))) return;
    programar();
  }).observe(document.documentElement, { childList: true, subtree: true });
  // se espera a que la web termine de montarse (tocar el DOM antes provoca errores de hidratación de React)
  const arrancar = () => setTimeout(() => { listo = true; programar(); }, 1500);
  if (document.readyState === 'complete') arrancar(); else window.addEventListener('load', arrancar);

  window.__axTiers = { analizar, stats, datos };
})();
