// ==UserScript==
// @name         Aurora Dex · Tiers (S a G) y debilidades
// @namespace    auroradex-tiers
// @version      1.5.0
// @description  En /equipo y en la Torre (/torre). Pone un icono de tier (S, A, B… G) a cada Pokémon del equipo y la Caja PC (también los especiales), ordena la Caja por tier, recomienda el orden del equipo y en su ficha añade debilidades, resistencias, a quién pega fuerte y contra qué sufre. El tier sale de simular duelos 1 contra 1 con las fórmulas del propio juego. En la Torre: tier de cada candidato, % de victorias de tu selección y de tu equipo guardado, el mejor equipo de 6 con todo lo que tienes (marcado con ⭐; lo eliges tú) y cómo repartir los objetos, y la probabilidad de ganar a cada rival. Solo recomienda: no toca tu equipo.
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
  const memoG = new WeakMap();
  function golpe(a, b) {
    let m = memoG.get(a);
    if (!m) memoG.set(a, (m = new Map()));
    let v = m.get(b);
    if (v !== undefined) return v;
    const { e } = tipoAtaque(a, b);
    if (e === 0) v = 1 / 16;
    else {
      const fis = a.atk > a.esp, A = fis ? a.atk : a.spa, D = fis ? b.def : b.spd;
      v = ((((2 * a.L / 5 + 2) * 80 * A / D) / 50 + 2) * 1.5 * e) / b.hp * 0.3;
    }
    m.set(b, v);
    return v;
  }
  // Única habilidad del juego: Slaking (nº 289) ataca un turno sí y otro no → para dar t golpes necesita 2t − 1 turnos
  const HOLGAZAN = 289;
  const turnos = (x, t) => (x.num === HOLGAZAN ? 2 * t - 1 : t);
  function duelo(a, b) {
    const tA = turnos(a, Math.ceil(1 / golpe(a, b) - 1e-9) + (b.aguanta ? 1 : 0)), tB = turnos(b, Math.ceil(1 / golpe(b, a) - 1e-9) + (a.aguanta ? 1 : 0));
    if (a.spe > b.spe) return tA <= tB ? 1 : 0;
    if (a.spe < b.spe) return tB <= tA ? 0 : 1;
    return tA < tB ? 1 : tA > tB ? 0 : 0.5;
  }
  /* ---- Objetos de combate (del catálogo del juego; el id es el nombre del icono /items/<id>.png) ----
   * hp/atk/def/esp/spe en %; «aguanta»: la primera vez que iba a caer, aguanta con 1 PS */
  const OBJETOS = {
    'hard-stone': { n: 'Roca Firme', hp: 25 }, 'silver-pendant': { n: 'Colgante Plateado', hp: 18 }, 'focus-band': { n: 'Banda Focus', hp: 15 },
    'balsamo-gremio': { n: 'Bálsamo del Gremio', hp: 15 }, 'mascara-funeraria': { n: 'Máscara Funeraria', hp: 8 },
    'corona-guerra': { n: 'Corona de Guerra', atk: 20, spe: 10 }, 'talisman-trono': { n: 'Talismán del Trono', def: 18, hp: 12 },
    'prisma-blanquinegro': { n: 'Prisma Blanquinegro', hp: 12, atk: 12, def: 12, esp: 12, spe: 12 },
    'muscle-band': { n: 'Cinta Fuerza', atk: 12 }, 'wise-glasses': { n: 'Gafas Sabias', esp: 12 }, 'quick-claw': { n: 'Garra Rápida', spe: 15 },
    'expert-belt': { n: 'Cinta Experta', atk: 8, esp: 8 }, 'scope-lens': { n: 'Lupa Certera', atk: 14, spe: 14, hp: -10 },
    'leftovers': { n: 'Restos', def: 10, hp: 10 }, 'life-orb': { n: 'Vidaesfera', esp: 14, spe: 14, hp: -10 },
    'assault-vest': { n: 'Chaleco Asalto', def: 16, spe: 12, atk: -10 }, 'as-manga': { n: 'As en la Manga', aguanta: true },
    'red-sphere': { n: 'Esfera Roja', atk: 10 }, 'blue-sphere': { n: 'Esfera Azul', def: 10 }, 'type-plate': { n: 'Placa Elemental', esp: 15 },
    'patin-escarcha': { n: 'Patín de Escarcha', spe: 12, esp: 8 }, 'bufanda-glaciar': { n: 'Bufanda Glaciar', def: 12, hp: 12 },
    'carambano-afilado': { n: 'Carámbano Afilado', atk: 16, spe: 8 }, 'cristal-polar': { n: 'Cristal Polar', esp: 12, def: 10, hp: 10 },
    'corona-boreal': { n: 'Corona Boreal', atk: 10, def: 10, esp: 10, spe: 10 }, 'brazalete-roto': { n: 'Brazalete Roto', esp: 15 },
    'herradura': { n: 'Herradura', spe: 8 }, 'herradura-2': { n: 'Herradura Veloz', spe: 12 }, 'placa-reforzada': { n: 'Placa Reforzada', def: 12, hp: 6 },
    'placa-reforzada-2': { n: 'Placa Blindada', def: 18, hp: 10 }, 'brazal-firme': { n: 'Brazal Firme (+Ataque)', atk: 10 },
    'estandarte-gremio': { n: 'Estandarte del Gremio', atk: 15, def: 10 }, 'yunque-cinco-tierras': { n: 'Yunque de las Cinco Tierras', spe: 12, esp: 12 },
    'perla-cinco-mareas': { n: 'Perla de las Cinco Mareas', def: 12, spe: 12 }, 'raiz-cinco-regiones': { n: 'Raíz de las Cinco Regiones', hp: 12, esp: 12 },
    'brasa-santuario': { n: 'Brasa del Santuario', atk: 14, esp: 14, spe: 8 },
  };
  const idObjeto = img => { const m = (img && img.getAttribute('src') || '').match(/\/items\/([a-z0-9_-]+)\.(?:png|webp|gif)/i); return m ? m[1] : null; };
  // El «Especial» del juego es una sola estadística: sube el ataque especial y la defensa especial a la vez
  function conObjeto(st, id) {
    const o = OBJETOS[id];
    if (!o) return st;
    const f = x => 1 + (x || 0) / 100;
    return { ...st, hp: Math.floor(st.hp * f(o.hp)), atk: Math.floor(st.atk * f(o.atk)), def: Math.floor(st.def * f(o.def)), esp: Math.floor(st.esp * f(o.esp)), spa: Math.floor(st.spa * f(o.esp)), spd: Math.floor(st.spd * f(o.esp)), spe: Math.floor(st.spe * f(o.spe)), aguanta: !!o.aguanta };
  }

  // Banco de rivales de referencia: 34 tipos (simples y dobles) × 4 perfiles de estadísticas, todos a Nv.50
  const GEN = ['normal', 'fuego', 'agua', 'planta', 'electrico', 'hielo', 'lucha', 'veneno', 'tierra', 'volador', 'psiquico', 'bicho', 'roca', 'fantasma', 'dragon', 'siniestro', 'acero', 'hada',
    'agua/tierra', 'fuego/volador', 'planta/veneno', 'dragon/volador', 'acero/psiquico', 'agua/volador', 'roca/tierra', 'bicho/volador', 'normal/volador', 'siniestro/fantasma', 'electrico/acero', 'hielo/agua', 'lucha/acero', 'dragon/tierra', 'psiquico/hada', 'veneno/siniestro'];
  const PERFILES = [[80, 80, 80, 80, 80, 80], [70, 100, 70, 60, 70, 110], [100, 70, 100, 90, 100, 45], [75, 60, 70, 110, 90, 95]];
  const BANCO = GEN.flatMap(t => PERFILES.map(p => ({ ...stats(p, 50), L: 50, tipos: t.split('/') })));
  const TIERS = [['S', 0.88, '#FFB23E'], ['A', 0.76, '#E0473A'], ['B', 0.62, '#A855F7'], ['C', 0.48, '#3B82F6'], ['D', 0.34, '#10B981'], ['E', 0.20, '#84CC16'], ['F', 0.08, '#94A3B8'], ['G', -1, '#64748B']];
  const cacheTier = {};
  // Medida continua para comparar mejoras (un +10% casi nunca cambia un duelo entero, pero sí el margen):
  // golpes que necesita cada uno (sin redondear), medio turno de ventaja al más rápido → probabilidad de ganar
  function ventaja(a, b) {
    let hA = 1 / golpe(a, b) + (b.aguanta ? 1 : 0), hB = 1 / golpe(b, a) + (a.aguanta ? 1 : 0);
    if (a.num === HOLGAZAN) hA = 2 * hA - 1;
    if (b.num === HOLGAZAN) hB = 2 * hB - 1;
    const vel = a.spe > b.spe ? 0.5 : a.spe < b.spe ? -0.5 : 0;
    // relación entre los golpes que necesita el rival y los que necesita él (con medio golpe al más rápido):
    // proporcional, así un +30% pesa claramente más que un +15% aunque ya gane casi siempre
    const r = Math.max(0.05, hB + vel) / hA;
    return r * r * r / (r * r * r + 1);
  }
  const pctCon = (yo, banco = BANCO) => banco.reduce((x, r) => x + ventaja(yo, r), 0) / banco.length;
  // Rivales de su misma fuerza media: contra rivales más flojos un Pokémon muy bueno ya gana todo y ninguna mejora se nota
  const bancosIguales = {};
  function bancoIgual(d) {
    const media = Math.round(d.s.reduce((x, y) => x + y, 0) / 6);
    return bancosIguales[media] || (bancosIguales[media] = GEN.flatMap(t => PERFILES.map(pf => ({ ...stats(pf.map(v => Math.max(20, v + media - 80)), 50), L: 50, tipos: t.split('/'), num: 0 }))));
  }
  // Cuánto sube su % de duelos ganados con cada objeto y con +10 % en cada estadística
  function mejoras(num, tipos, ids) {
    const d = datos[num];
    if (!d) return null;
    const base = { ...stats(d.s, 50), L: 50, tipos, num };
    const bi = bancoIgual(d);
    const p0 = pctCon(base, bi);
    const objetos = (ids || Object.keys(OBJETOS)).filter(id => OBJETOS[id]).map(id => ({ id, n: OBJETOS[id].n, gana: pctCon(conObjeto(base, id), bi) - p0 }))
      .sort((a, b) => b.gana - a.gana);
    const esp = Math.round((d.s[3] + d.s[4]) / 2), fisico = d.s[1] > esp;
    const prueba = [['PS', { hp: 10 }], [fisico ? 'Ataque' : 'Especial', fisico ? { atk: 10 } : { esp: 10 }], ['Defensa', { def: 10 }], ['Velocidad', { spe: 10 }]];
    if (fisico) prueba.push(['Especial', { esp: 10 }]);
    const stats10 = prueba.map(([n, o]) => { OBJETOS.__p = { n, ...o }; const g = pctCon(conObjeto(base, '__p'), bi) - p0; delete OBJETOS.__p; return { n, gana: g }; }).sort((a, b) => b.gana - a.gana);
    return { p0, objetos, stats10 };
  }
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
  const numSrc = src => { if (/\/sprites\/unown\//i.test(src || '')) return 201; const m = (src || '').match(/\/sprites\/(?:[a-z0-9_-]+\/)*?(?:dorso-)?(\d+)(?:[-_.])/i); return m ? parseInt(m[1], 10) : null; };
  const numDe = img => numSrc(img.getAttribute('src'));
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
      const firmaF = num + '|' + tipos.join('/') + '|' + JSON.stringify(objetosDeFicha(li));
      if (caja && caja.dataset.num === firmaF) continue;
      const t = analizar(num, tipos);
      if (!t) { pedir(num); continue; }
      if (!caja) { caja = document.createElement('div'); caja.className = 'axt-ficha space-y-1.5'; caja.setAttribute('data-ax-ignore', '1'); bloque.insertAdjacentElement('afterend', caja); }
      caja.dataset.num = firmaF;
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
        ${fila('Sufre contra', t.peores)}
        <div class="axt-objetos space-y-1"></div>`;
      pintarObjetos(caja.querySelector('.axt-objetos'), li, num, t);
      const cab = caja.children[1];
      cab.appendChild(insignia(t, true));
      const txt = document.createElement('span');
      txt.className = 'text-xs font-extrabold text-tinta-600';
      txt.textContent = `Tier ${t.letra}`;
      cab.appendChild(txt);
    }
  }

  // Sección «Objeto» de la ficha: el que lleva (con «Quitar») o la lista de los que tienes para ponerle
  function objetosDeFicha(li) {
    const tit = $$('p.titulo-seccion', li).find(p => /^\s*objeto/i.test(p.textContent || ''));
    const sec = tit && tit.parentElement;
    if (!sec) return { lleva: null, tienes: [] };
    const ids = $$('img[src*="/items/"]', sec).map(idObjeto).filter(Boolean);
    const porNombre = {};
    for (const [id, o] of Object.entries(OBJETOS)) porNombre[normT(o.n)] = id;
    for (const b of $$('button, span', sec)) {
      if (b.children.length > 3) continue;
      const n = normT((b.textContent || '').replace(/\s*[x×]\s*\d+.*$/i, '').replace(/\bi\s*$/, ''));
      if (porNombre[n] && !ids.includes(porNombre[n])) ids.push(porNombre[n]);
    }
    const lleva = $$('button', sec).some(b => /^\s*quitar\s*$/i.test(b.textContent || '')) ? ids[0] : null;
    return { lleva, tienes: lleva ? [] : [...new Set(ids)] };
  }
  const mas = x => (x >= 0 ? '+' : '−') + Math.abs(Math.round(x * 100));
  function pintarObjetos(caja, li, num, t) {
    const { lleva, tienes } = objetosDeFicha(li);
    const m = mejoras(num, t.d.t);
    if (!m) return;
    const conLleva = lleva && OBJETOS[lleva] ? m.objetos.find(o => o.id === lleva) : null;
    const propios = m.objetos.filter(o => tienes.includes(o.id) && o.gana > 0.002).slice(0, 5);
    const mejor = m.objetos[0];
    caja.innerHTML = `
      <p class="titulo-seccion">Objetos</p>
      <p class="text-[11px] font-semibold text-tinta-500">Qué estadística le sirve más (un +10% en cada una): <b>${m.stats10.map(x => `${x.n} ${mas(x.gana)}`).join(' › ')}</b>. Medido en puntos de % de victorias contra rivales de su misma fuerza (contra rivales flojos ya gana casi todo y no se notaría).</p>
      ${lleva ? `<p class="text-[11px] font-semibold text-tinta-500">Lleva <b>${OBJETOS[lleva] ? OBJETOS[lleva].n : lleva}</b>${conLleva ? `: le sube ${mas(conLleva.gana)} puntos de % de victorias${OBJETOS[lleva] && m.objetos[0] && m.objetos[0].id !== lleva && m.objetos[0].gana - conLleva.gana > 0.01 ? '' : ' (buena elección)'}.` : ' (no ayuda en combate: mejor uno de los de abajo si lo usas para pelear).'}</p>` : ''}
      ${propios.length ? `<p class="text-[11px] font-semibold text-tinta-500">De los que tienes, por orden: ${propios.map((o, i) => `<b>${i + 1}. ${o.n}</b> (${mas(o.gana)})`).join(' · ')}</p>` : ''}
      ${mejor && mejor.gana > 0.002 && mejor.gana - (conLleva ? conLleva.gana : 0) > 0.01 ? `<p class="text-[11px] font-semibold text-tinta-500">El mejor del juego para él: <b>${mejor.n}</b> (${mas(mejor.gana)})${m.objetos[1] && m.objetos[1].gana > 0.002 ? `, luego ${m.objetos.slice(1, 4).filter(o => o.gana > 0.002).map(o => `${o.n} (${mas(o.gana)})`).join(', ')}` : ''}.</p>` : ''}`;
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
    const tA = turnos(a, Math.ceil(fb / dA - 1e-9) + (b.aguanta ? 1 : 0)), tB = turnos(b, Math.ceil(fa / dB - 1e-9) + (a.aguanta ? 1 : 0));
    const primeroA = a.spe > b.spe || (a.spe === b.spe && fa >= fb);
    if (primeroA) return tA <= tB ? { ganaA: true, fa: fa - gB(tA - 1) * dB, fb: 0 } : { ganaA: false, fa: 0, fb: fb - gA(tB) * dA };
    return tB <= tA ? { ganaA: false, fa: 0, fb: fb - gA(tB - 1) * dA } : { ganaA: true, fa: fa - gB(tA) * dB, fb: 0 };
  }
  function combate(mios, rivales) {
    let i = 0, j = 0, fa = 1, fb = 1;
    mios = [...mios];
    while (i < mios.length && j < rivales.length) {
      const r = dueloF(mios[i], fa, rivales[j], fb);
      if (mios[i].aguanta) mios[i] = { ...mios[i], aguanta: false };
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
      const obj = idObjeto($$('img[src*="/items/"]', li)[0]);
      return { num, nombre, nivel, obj, tipos: tiposEn(li.querySelector('button') || li) };
    }).filter(m => m.num);
    if (miembros.length < 2) { if (caja) caja.remove(); return; }
    for (const m of miembros) if (!datos[m.num]) pedir(m.num);
    if (miembros.some(m => !datos[m.num])) return;
    const entrada = JSON.stringify(miembros);
    if (!memoEquipo || memoEquipo.entrada !== entrada) {
      const baseMedia = miembros.reduce((x, m) => x + datos[m.num].s.reduce((p, q) => p + q, 0), 0) / miembros.length / 6;
      let semilla = 11; const azar = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647;
      const orden3 = Array.from({ length: 300 }, () => GEN.length * PERFILES.length).map(n => [0, 0, 0].map(() => Math.floor(azar() * n)));
      // mismo sorteo de rivales para las dos cuentas; `nivelFijo`: todos (tuyos y rivales) a ese nivel
      const calcular = nivelFijo => {
        const nivel = nivelFijo || Math.round(miembros.reduce((x, m) => x + m.nivel, 0) / miembros.length);
        const banco = GEN.flatMap(t => PERFILES.map(pf => ({ ...stats(pf.map(v => Math.max(30, Math.round(v + baseMedia - 80))), nivel), L: nivel, tipos: t.split('/'), num: 0 })));
        const trios = orden3.map(ix => ix.map(i => banco[i]));
        const luch = miembros.map(m => { const L = nivelFijo || m.nivel; return { ...conObjeto(stats(datos[m.num].s, L), m.obj), L, tipos: m.tipos.length ? m.tipos : datos[m.num].t, num: m.num, nombre: m.nombre }; });
        const nota = orden => { let g = 0, v = 0; for (const tr of trios) { const r = combate(orden, tr); if (r.gana) { g++; v += r.vivos; } } return { g: g / trios.length, v: v / trios.length }; };
        let mejor = null;
        for (const orden of permutaciones(luch, Math.min(3, luch.length))) {
          const n = nota(orden);
          if (!mejor || n.g + n.v / 100 > mejor.n.g + mejor.n.v / 100) mejor = { orden, n };
        }
        return { mejor, actual: nota(luch.slice(0, 3)), nivel };
      };
      const conNiveles = calcular(null);
      const sinNiveles = calcular(Math.max(...miembros.map(m => m.nivel)));
      memoEquipo = { entrada, ...conNiveles, sinNiveles };
    }
    const { mejor, actual, nivel, sinNiveles } = memoEquipo;
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
      <p class="text-[11px] font-bold text-tinta-500">Si todos estuvieran al mismo nivel (Nv.${sinNiveles.nivel}): ${sinNiveles.mejor.orden.map((x, i) => `${i + 1}. ${x.nombre}`).join(' · ')} <span class="text-tinta-400">(gana ${pct(sinNiveles.mejor.n.g)})</span></p>
      <p class="text-[10px] font-semibold text-tinta-400">${yaEsta ? 'Tus 3 primeros ya son los que más combates ganan en ese orden.' : 'Arrastra por el asa ⠿ para ponerlos así.'} Arriba, contando el nivel real de cada uno; abajo, lo que rendirían si subieras a todos (sirve para saber a quién merece la pena entrenar). Contra rivales de todos los tipos, tan fuertes de media como tu equipo (Nv.${nivel}), en orden (el que gana sigue con la vida que le queda) y con los objetos que llevan puestos.</p>`;
    if (caja.dataset.html !== html) { caja.innerHTML = html; caja.dataset.html = html; }
  }

  /* ------------------------------------------------------------------ *
   *  TORRE DESAFÍO (/torre?liga=…)
   *  La web ya trae en sus datos todo lo que hace falta de cada candidato: tipos y estadísticas reales a Nv.50 con el
   *  objeto puesto. En la Torre el orden de salida se sortea en cada combate, así que lo que cuenta es QUÉ seis llevas
   *  (y con qué objetos), no el orden. Rivales: los equipos que se ven en «Retar» (se van apuntando) más un banco de
   *  todos los tipos tan fuerte como tus mejores Pokémon.
   * ------------------------------------------------------------------ */
  const enTorre = () => /^\/torre(\/|$)/.test(location.pathname);
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
  function estadoTorre() {
    const el = $$('main button').find(b => /^(Retar|Mi equipo)$/.test((b.textContent || '').trim()));
    let f = actual(fibraDe(el));
    for (let i = 0; f && i < 40; i++, f = f.return) {
      const p = f.memoizedProps;
      if (p && p.estado && Array.isArray(p.estado.candidatos)) return { ...p.estado, modo: p.modo || 'clasico' };
    }
    return null;
  }
  const tipoDe = x => { const t = normT(x); return TABLA[t] ? t : ABREV[t.slice(0, 3)] || null; };
  const NOMBRE_OBJ = Object.fromEntries(Object.entries(OBJETOS).map(([id, o]) => [normT(o.n), id]));
  // Estadísticas sin el objeto que llevan (la web las enseña ya con el objeto, redondeadas)
  function sinObjeto(st, id) {
    const o = OBJETOS[id] || {}, f = x => 1 + (x || 0) / 100;
    return { ps: st.ps / f(o.hp), ataque: st.ataque / f(o.atk), defensa: st.defensa / f(o.def), especial: st.especial / f(o.esp), velocidad: st.velocidad / f(o.spe) };
  }
  const cacheLuch = new Map();
  // Luchador a Nv.50 con el objeto `item` (undefined: el que lleva; null: ninguno)
  function luchadorT(c, item) {
    const id = item === undefined ? c.itemId || null : item;
    const clave = (c.id != null ? c.id : c.sprite + '|' + c.stats.total) + '|' + c.itemId + '|' + id;
    if (cacheLuch.has(clave)) return cacheLuch.get(clave);
    const b = sinObjeto(c.stats, c.itemId), o = OBJETOS[id] || {}, r = (v, p) => Math.round(v * (1 + (p || 0) / 100));
    const esp = r(b.especial, o.esp);
    const l = { hp: r(b.ps, o.hp), atk: r(b.ataque, o.atk), def: r(b.defensa, o.def), esp, spa: esp, spd: esp, spe: r(b.velocidad, o.spe), L: 50,
      tipos: [c.tipo1, c.tipo2].map(tipoDe).filter(Boolean), num: numSrc(c.sprite), aguanta: !!o.aguanta, nombre: c.nombre, item: id };
    if (!l.tipos.length) l.tipos = ['normal'];
    cacheLuch.set(clave, l);
    return l;
  }
  const rng = s => () => (s = (s * 16807) % 2147483647) / 2147483647;
  const barajar = (arr, azar) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(azar() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  // Combate en fila: el que gana sigue con la vida que le queda; «As en la Manga» solo sirve una vez
  function combateT(mios, rivs) {
    mios = [...mios]; rivs = [...rivs];
    let i = 0, j = 0, fa = 1, fb = 1;
    while (i < mios.length && j < rivs.length) {
      const r = dueloF(mios[i], fa, rivs[j], fb);
      if (mios[i].aguanta) mios[i] = { ...mios[i], aguanta: false };
      if (rivs[j].aguanta) rivs[j] = { ...rivs[j], aguanta: false };
      if (r.ganaA) { fa = Math.max(r.fa, 0.005); j++; fb = 1; } else { fb = Math.max(r.fb, 0.005); i++; fa = 1; }
    }
    return { gana: j >= rivs.length, caidos: j };
  }
  // Azar «con nombre»: cada número sale de mezclar (semilla, combate, hueco, clave del rival), no de una secuencia.
  // Así el sorteo no depende del orden del banco, y un rival nuevo solo cambia los pocos combates en los que le toca salir
  // (con una secuencia normal, añadir uno cambiaba todos los combates y la recomendación bailaba en cada recarga).
  const fmix = h => { h = Math.imul(h ^ (h >>> 16), 0x85ebca6b); h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35); return (h ^ (h >>> 16)) >>> 0; };
  const hash32 = str => { let h = 2166136261; for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619); return fmix(h); };
  // Combates de prueba: equipos rivales de 6 sin repetir, sacados del banco según su peso, y un orden de salida sorteado para los dos
  function simulaciones(pool, n, semilla, fijos) {
    fijos = fijos || [];
    const hs = pool.map(p => hash32(p.k)), inv = pool.map(p => 1 / p.w);
    // primero se sortea si el hueco es de un rival visto o del banco genérico (así, cuando cambia lo que pesa cada parte,
    // solo cambian los huecos que estaban en el límite) y luego cuál de esa parte
    const gen = pool.map(p => p.k[0] === 'S');
    const pesoG = pool.reduce((x, p, i) => x + (gen[i] ? p.w : 0), 0), parteG = pesoG / pool.reduce((x, p) => x + p.w, 0);
    return Array.from({ length: n }, (_, s) => {
      const rivs = [...fijos], usados = new Set();
      for (let k = rivs.length; k < 6 && usados.size < pool.length; k++) {
        const hk = fmix(Math.imul(semilla, 0x27d4eb2d) ^ Math.imul(s * 8 + k + 1, 0x165667b1));
        const quiereG = fmix(hk ^ 0x5bd1e995) / 4294967296 < parteG;
        // carrera exponencial: gana el de menor −ln(u)/peso (sale con probabilidad proporcional a su peso)
        let mejor = -1;
        for (const deUnaParte of [parteG > 0 && parteG < 1, false]) {
          let min = Infinity;
          for (let i = 0; i < pool.length; i++) {
            if (usados.has(i) || (deUnaParte && gen[i] !== quiereG)) continue;
            const v = -Math.log((fmix(hs[i] ^ hk) + 0.5) / 4294967296) * inv[i];
            if (v < min) { min = v; mejor = i; }
          }
          if (mejor >= 0) break;
        }
        usados.add(mejor);
        rivs.push(pool[mejor].l);
      }
      const azar = rng(1 + (fmix(Math.imul(semilla, 7919) ^ (s + 1)) % 2147483645));
      return { rivs: barajar(rivs, azar), perm: barajar([0, 1, 2, 3, 4, 5], azar) };
    });
  }
  function notaEquipo(equipo, sims) {
    let g = 0, k = 0;
    for (const s of sims) {
      const r = combateT(s.perm.filter(i => i < equipo.length).map(i => equipo[i]), s.rivs);
      if (r.gana) g++;
      k += r.caidos;
    }
    return { g: g / sims.length, k: k / sims.length / 6 };
  }
  const valorN = n => n.g + n.k * 0.15;

  // Rivales vistos en «Retar» (tres de seis a la vista, con sus estadísticas y objeto). Se guardan por liga y por
  // jugador (lo último que se le vio): ver al mismo rival muchas veces no hace que cuente más.
  const LS_RIV = 'axt-torre-rivales';
  function registroRivales(est) {
    const g = lsGet(LS_RIV, {});
    const m = g[est.modo] || (g[est.modo] = { rivales: {}, pokes: {} });
    let cambio = false;
    // antes se guardaban por jugador y día: se queda lo más reciente de cada jugador
    for (const [clave, v] of Object.entries(m.rivales)) {
      if (!clave.includes('|')) continue;
      const u = clave.split('|')[0];
      if (!m.rivales[u] || m.rivales[u].t < v.t) m.rivales[u] = v;
      delete m.rivales[clave];
      cambio = true;
    }
    for (const r of est.rivales || []) {
      const claves = [];
      for (const p of r.equipo || []) {
        if (p.oculto || !p.stats || !p.tipo1) continue;
        const k = `${p.sprite}|${p.itemId || ''}|${p.stats.total}`;
        m.pokes[k] = { sprite: p.sprite, nombre: p.nombre, tipo1: p.tipo1, tipo2: p.tipo2 || null, stats: p.stats, itemId: p.itemId || null };
        claves.push(k);
      }
      if (!claves.length) continue;
      claves.sort();
      const antes = m.rivales[String(r.userId)];
      if (antes && antes.claves.join() === claves.join()) continue;
      m.rivales[String(r.userId)] = { t: Date.now(), claves };
      cambio = true;
    }
    if (cambio) {
      const ents = Object.entries(m.rivales).sort((a, b) => b[1].t - a[1].t).slice(0, 200);
      m.rivales = Object.fromEntries(ents);
      const usadas = new Set(ents.flatMap(([, v]) => v.claves));
      for (const k of Object.keys(m.pokes)) if (!usadas.has(k)) delete m.pokes[k];
      lsPut(LS_RIV, g);
    }
    const peso = {};
    for (const r of Object.values(m.rivales)) for (const k of r.claves) peso[k] = (peso[k] || 0) + 1;
    return { equipos: Object.keys(m.rivales).length, lista: Object.entries(peso).filter(([k]) => m.pokes[k]).sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, w]) => ({ k, p: m.pokes[k], w })) };
  }
  // Base media (por estadística) de tus mejores candidatos: así el banco genérico es tan fuerte como la liga
  function baseMediaDe(cands) {
    const top = [...cands].sort((a, b) => b.stats.total - a.stats.total).slice(0, 12);
    if (!top.length) return 80;
    return top.reduce((x, c) => { const s = sinObjeto(c.stats, c.itemId); return x + ((s.ps - 64) / 1.5 + s.ataque - 5 + s.defensa - 5 + 2 * (s.especial - 5) + s.velocidad - 5) / 6; }, 0) / top.length;
  }
  function poolTorre(est, cands) {
    const reg = registroRivales(est);
    const vistos = reg.lista.map(x => ({ k: 'V|' + x.k, l: luchadorT(x.p), w: x.w }));
    const pesoVistos = vistos.reduce((x, v) => x + v.w, 0);
    // la fuerza del banco genérico se redondea para que no cambie por cualquier Pokémon nuevo
    const bm = Math.round(baseMediaDe(cands) / 5) * 5;
    const sint = GEN.flatMap(t => PERFILES.map((pf, i) => ({ k: 'S|' + t + '|' + i, l: { ...stats(pf.map(v => Math.max(20, Math.round(v + bm - 80))), 50), L: 50, tipos: t.split('/'), num: 0 }, w: 1 })));
    // cuantos más jugadores distintos se han visto, menos pesa el banco genérico (poco a poco: 100% sin ninguno, 50% con 10, 30% como mínimo)
    const parte = Math.max(0.3, 1 / (1 + reg.equipos / 10));
    const pesoSint = pesoVistos ? pesoVistos * parte / (1 - parte) / sint.length : 1;
    for (const s of sint) s.w = pesoSint;
    return { pool: [...vistos, ...sint], vistos: vistos.length, equipos: reg.equipos, bm };
  }

  // Un candidato por especie (el más fuerte) y solo los que valen en esta liga
  function candidatosUnicos(est) {
    const porEspecie = {};
    for (const c of est.candidatos) {
      if (c.vale === false || !c.stats) continue;
      const k = c.especie || c.nombre;
      if (!porEspecie[k] || c.stats.total > porEspecie[k].stats.total) porEspecie[k] = c;
    }
    return Object.values(porEspecie).sort((a, b) => b.stats.total - a.stats.total || (String(a.id) < String(b.id) ? -1 : 1));
  }
  const cacheTierT = new Map();
  function tierTorre(c) {
    const k = c.id + '|' + c.itemId + '|' + c.stats.total;
    if (cacheTierT.has(k)) return cacheTierT.get(k);
    const yo = luchadorT(c);
    const pct = BANCO.reduce((x, r) => x + duelo(yo, r), 0) / BANCO.length;
    const [letra, , color] = TIERS.find(([, min]) => pct >= min);
    const t = { letra, color, pct };
    cacheTierT.set(k, t);
    return t;
  }

  // Mejor equipo: se preseleccionan los 28 mejores sueltos (contra todo el banco, sin sorteo), se monta uno a uno y luego
  // se prueban cambios de uno en uno. `previo`: lo que se recomendó la última vez; se sigue recomendando salvo que lo
  // nuevo gane claramente más (así no cambia por diferencias que están dentro del margen de error).
  const MARGEN_REC = 0.015;
  function sueltosTorre(unicos, pool) {
    const pesoT = pool.reduce((x, p) => x + p.w, 0);
    return unicos.map(c => {
      const l = luchadorT(c, null);
      let v = 0;
      for (const p of pool) v += ventaja(l, p.l) * p.w;
      return { c, v: v / pesoT };
    }).sort((a, b) => b.v - a.v || b.c.stats.total - a.c.stats.total);
  }
  function mejorEquipo(unicos, sims, pool, previo) {
    const sueltos = sueltosTorre(unicos, pool);
    const pre = sueltos.slice(0, 28).map(x => x.c);
    const nota = eq => valorN(notaEquipo(eq.map(c => luchadorT(c, null)), sims));
    const mejorar = eq => {
      let v0 = nota(eq);
      for (let vuelta = 0; vuelta < 4; vuelta++) {
        let mejoro = false;
        for (let i = 0; i < eq.length; i++) {
          let mejor = null;
          for (const c of pre) {
            if (eq.includes(c)) continue;
            const v = nota(eq.map((x, k) => (k === i ? c : x)));
            if (v > v0 + 0.002 && (!mejor || v > mejor.v)) mejor = { c, v };
          }
          if (mejor) { eq = eq.map((x, k) => (k === i ? mejor.c : x)); v0 = mejor.v; mejoro = true; }
        }
        if (!mejoro) break;
      }
      return { eq, v: v0 };
    };
    let eq = [];
    while (eq.length < Math.min(6, pre.length)) {
      let mejor = null;
      for (const c of pre) { if (eq.includes(c)) continue; const v = nota([...eq, c]); if (!mejor || v > mejor.v) mejor = { c, v }; }
      eq.push(mejor.c);
    }
    let r = mejorar(eq);
    const prev = (previo || []).map(id => unicos.find(c => String(c.id) === String(id))).filter(Boolean);
    let seMantiene = false;
    if (prev.length === r.eq.length && prev.length === 6) {
      const vp = nota(prev);
      if (r.v < vp + MARGEN_REC) { r = { eq: prev, v: vp }; seMantiene = true; }
    }
    return { eq: r.eq, sueltos, seMantiene };
  }
  // Reparto de objetos: se van poniendo de uno en uno donde más suben las victorias del equipo
  function repartirObjetos(eq, todos, sims, previo) {
    const quedan = {};
    for (const c of todos) if (c.itemId && OBJETOS[c.itemId]) quedan[c.itemId] = (quedan[c.itemId] || 0) + 1;
    const hay = { ...quedan };
    const asign = eq.map(() => null);
    const nota = a => valorN(notaEquipo(eq.map((c, i) => luchadorT(c, a[i])), sims));
    let base = nota(asign);
    for (let paso = 0; paso < eq.length; paso++) {
      let mejor = null;
      for (let i = 0; i < eq.length; i++) {
        if (asign[i]) continue;
        for (const id of Object.keys(quedan).sort()) {
          if (!quedan[id]) continue;
          const a = asign.map((x, k) => (k === i ? id : x));
          const v = nota(a);
          if (!mejor || v > mejor.v) mejor = { i, id, v };
        }
      }
      if (!mejor || mejor.v <= base + 0.002) break;
      asign[mejor.i] = mejor.id; quedan[mejor.id]--; base = mejor.v;
    }
    // el reparto anterior (si sigue siendo posible) se mantiene salvo que el nuevo sea claramente mejor
    if (previo && previo.length === eq.length) {
      const usa = {};
      for (const id of previo) if (id) usa[id] = (usa[id] || 0) + 1;
      if (Object.entries(usa).every(([id, n]) => (hay[id] || 0) >= n) && base < nota(previo) + MARGEN_REC) return [...previo];
    }
    return asign;
  }

  // Selección actual (los botones marcados con su número 1–6) → ids de candidato
  function seleccionTorre() {
    const ids = [];
    for (const li of $$('main ul.grid > li')) {
      const b = li.querySelector(':scope > button');
      const n = b && b.querySelector(':scope > span.bg-hoja-500');
      const f = n && fibraDe(li);
      if (f && f.key != null) ids[parseInt(n.textContent, 10) - 1] = String(f.key);
    }
    return ids.filter(Boolean);
  }
  // Equipo guardado («Defendiendo ahora») como luchadores, con el objeto que tenía al guardarlo
  function equipoGuardado(est) {
    return (est.miEquipo || []).map(m => {
      const c = est.candidatos.find(x => String(x.id) === String(m.ownedId)) || est.candidatos.find(x => x.sprite === m.sprite);
      if (!c) return null;
      const item = m.itemId || (m.itemNombre && NOMBRE_OBJ[normT(m.itemNombre)]) || null;
      return luchadorT(c, item);
    }).filter(Boolean);
  }

  function insigniasTorre(est) {
    const porId = {};
    for (const c of est.candidatos) porId[String(c.id)] = c;
    for (const li of $$('main ul.grid > li')) {
      const b = li.querySelector(':scope > button');
      const f = b && fibraDe(li);
      const c = f && porId[String(f.key)];
      if (!c || !c.stats) continue;
      const firma = c.id + '|' + c.itemId + '|' + c.stats.total;
      if (b.dataset.axtNum === firma && b.querySelector(':scope > .axt-tier')) continue;
      const viejo = b.querySelector(':scope > .axt-tier');
      if (viejo) viejo.remove();
      const t = tierTorre(c);
      const s = insignia(t);
      s.title = `Tier ${t.letra}: gana el ${Math.round(t.pct * 100)}% de los duelos 1 contra 1 a Nv.50${c.itemId && OBJETOS[c.itemId] ? ' (con su objeto)' : ''}`;
      s.style.position = 'absolute'; s.style.left = '-4px'; s.style.bottom = '-4px';
      b.appendChild(s);
      b.dataset.axtNum = firma;
    }
  }

  let memoTorre = null, calculandoTorre = false;
  // combates de prueba por equipo (siempre los mismos para todos los equipos que se comparan) y última recomendación
  const N_SIMS = 1000, LS_REC = 'axt-torre-rec';
  const pctT = x => Math.round(x * 100) + '%';
  const nombreObj = id => (OBJETOS[id] ? OBJETOS[id].n : id);
  function panelTorre(est) {
    const rejilla = $$('main ul.grid').find(u => u.querySelector(':scope > li > button'));
    const tarjeta = rejilla && rejilla.closest('.tarjeta');
    let caja = document.getElementById('axt-torre');
    if (!tarjeta) { if (caja) caja.remove(); return; }
    if (!caja) {
      caja = document.createElement('section');
      caja.id = 'axt-torre';
      caja.className = 'tarjeta space-y-1.5 p-3';
      caja.setAttribute('data-ax-ignore', '1');
    }
    if (caja.nextElementSibling !== tarjeta) tarjeta.insertAdjacentElement('beforebegin', caja);
    const unicos = candidatosUnicos(est);
    const firma = est.modo + '|' + est.candidatos.length + '|' + est.candidatos.reduce((x, c) => x + (c.stats ? c.stats.total : 0) + (c.itemId ? c.itemId.length : 0), 0) + '|' + (est.rivales || []).map(r => r.userId).join(',');
    if (!memoTorre || memoTorre.firma !== firma) {
      if (!calculandoTorre) {
        calculandoTorre = true;
        const html0 = '<p class="titulo-seccion !mb-0">🗼 Análisis de la Torre</p><p class="text-[11px] font-semibold text-tinta-500">Calculando el mejor equipo con todo lo que tienes…</p>';
        if (caja.dataset.html !== html0) { caja.innerHTML = html0; caja.dataset.html = html0; }
        setTimeout(() => {
          try {
            const { pool, vistos, equipos, bm } = poolTorre(est, unicos);
            const sims = simulaciones(pool, N_SIMS, 7);
            const recs = lsGet(LS_REC, {}), prev = recs[est.modo] || {};
            // con los mismos datos que la última vez no se repite la búsqueda (sale lo mismo)
            const datosCalc = hash32(JSON.stringify([unicos.map(c => c.id + '|' + c.stats.total), est.candidatos.map(c => c.itemId || ''), pool.map(p => p.k + ':' + p.w.toFixed(4))]));
            let eq, sueltos, seMantiene = false, objetos;
            if (prev.datos === datosCalc && prev.ids && prev.ids.every(id => unicos.some(c => String(c.id) === id))) {
              eq = prev.ids.map(id => unicos.find(c => String(c.id) === id));
              sueltos = sueltosTorre(unicos, pool);
              objetos = prev.objetos;
              seMantiene = !!prev.seMantiene;
            } else {
              ({ eq, sueltos, seMantiene } = mejorEquipo(unicos, sims, pool, prev.ids));
              const mismos = prev.ids && prev.ids.join() === eq.map(c => String(c.id)).join();
              objetos = repartirObjetos(eq, est.candidatos, sims, mismos ? prev.objetos : null);
            }
            const ids = eq.map(c => String(c.id));
            const sinObj = notaEquipo(eq.map(c => luchadorT(c, null)), sims);
            const conObj = notaEquipo(eq.map((c, i) => luchadorT(c, objetos[i])), sims);
            recs[est.modo] = { ids, objetos, datos: datosCalc, seMantiene };
            lsPut(LS_REC, recs);
            memoTorre = { firma, pool, vistos, equipos, bm, sims, eq, sueltos, objetos, sinObj, conObj, seMantiene, porSel: {} };
          } catch (e) { console.warn('[axt torre]', e); }
          calculandoTorre = false;
          programar();
        }, 60);
      }
      return;
    }
    const M = memoTorre;
    const sel = seleccionTorre();
    const claveSel = sel.join(',');
    if (!M.porSel[claveSel]) {
      const cs = sel.map(id => est.candidatos.find(c => String(c.id) === id)).filter(Boolean);
      const r = { cs };
      if (cs.length) {
        const eqL = cs.map(c => luchadorT(c));
        r.nota = notaEquipo(eqL, M.sims);
        if (cs.length === 6) {
          // quién aporta menos y el cambio que más sube
          const aporte = cs.map((c, i) => ({ c, i, baja: valorN(r.nota) - valorN(notaEquipo(eqL.filter((_, k) => k !== i), M.sims)) })).sort((a, b) => a.baja - b.baja);
          r.flojo = aporte[0];
          let cambio = null;
          const pre = M.sueltos.slice(0, 20).map(x => x.c).filter(c => !cs.some(y => (y.especie || y.nombre) === (c.especie || c.nombre)));
          for (const c of pre) {
            const prueba = eqL.map((x, k) => (k === r.flojo.i ? luchadorT(c) : x));
            const n = notaEquipo(prueba, M.sims);
            if (!cambio || valorN(n) > valorN(cambio.n)) cambio = { c, n };
          }
          if (cambio && cambio.n.g > r.nota.g + 0.01) r.cambio = cambio;
        }
      }
      M.porSel[claveSel] = r;
    }
    const S = M.porSel[claveSel];
    const guardado = equipoGuardado(est);
    if (M.notaGuardado === undefined || M.claveGuardado !== JSON.stringify((est.miEquipo || []).map(m => m.ownedId + '|' + m.itemId))) {
      M.claveGuardado = JSON.stringify((est.miEquipo || []).map(m => m.ownedId + '|' + m.itemId));
      M.notaGuardado = guardado.length ? notaEquipo(guardado, M.sims) : null;
    }
    const idsMejor = M.eq.map(c => String(c.id));
    const yaSel = idsMejor.length === sel.length && idsMejor.every(id => sel.includes(id));
    const objTxt = M.eq.map((c, i) => {
      const quiero = M.objetos[i], tiene = c.itemId && OBJETOS[c.itemId] ? c.itemId : null;
      if (!quiero) return tiene ? `${c.nombre}: quítale ${nombreObj(tiene)} (se lo das a otro)` : null;
      if (quiero === tiene) return `${c.nombre}: ${nombreObj(quiero)} ✔`;
      const deQuien = est.candidatos.find(x => x.itemId === quiero && x.id !== c.id && M.eq.some(y => y.id === x.id)) || est.candidatos.find(x => x.itemId === quiero && x.id !== c.id);
      return `${c.nombre} → <b>${nombreObj(quiero)}</b>${deQuien ? ` <span class="text-tinta-400">(ahora lo lleva ${deQuien.nombre})</span>` : ''}`;
    }).filter(Boolean);
    const chipT = c => { const t = tierTorre(c); return `<span style="display:inline-grid;place-items:center;min-width:15px;height:15px;border-radius:999px;background:${t.color};color:#fff;font-size:9px;font-weight:900;margin-right:2px">${t.letra}</span>`; };
    const html = `
      <div class="flex items-center justify-between gap-2">
        <p class="titulo-seccion !mb-0">🗼 Análisis de la Torre</p>
        <span class="text-[10px] font-bold text-tinta-400">${M.vistos ? `${M.vistos} rivales vistos` : 'sin rivales vistos aún'}</span>
      </div>
      ${S.cs.length ? `<p class="text-[11px] font-semibold text-tinta-600">Tu selección (${S.cs.length}/6): gana ≈ <b>${pctT(S.nota.g)}</b> de los combates${S.cs.length < 6 ? ' (con menos de 6 pierdes mucho)' : ''}.${S.flojo ? ` El que menos aporta: <b>${S.flojo.c.nombre}</b>.` : ''}${S.cambio ? ` Si lo cambias por <b>${S.cambio.c.nombre}</b>: ≈ ${pctT(S.cambio.n.g)}.` : ''}</p>` : ''}
      ${M.notaGuardado ? `<p class="text-[11px] font-semibold text-tinta-600">Equipo guardado (el que defiende y ataca): ≈ <b>${pctT(M.notaGuardado.g)}</b>.</p>` : ''}
      <div class="rounded-card border-2 border-ambar-300 bg-ambar-50 p-2 space-y-1">
        <p class="text-[11px] font-extrabold text-ambar-700">⭐ El mejor equipo con todo lo que tienes</p>
        <p class="text-sm font-extrabold">${M.eq.map(c => chipT(c) + c.nombre).join(' · ')}</p>
        <p class="text-[11px] font-semibold text-tinta-600">Gana ≈ <b>${pctT(M.conObj.g)}</b> con estos objetos (≈ ${pctT(M.sinObj.g)} sin ninguno).</p>
        ${objTxt.length ? `<p class="text-[11px] font-semibold text-tinta-600">Objetos: ${objTxt.join(' · ')}</p>` : ''}
        <p class="text-[10px] font-bold ${yaSel ? 'text-hoja-600' : 'text-tinta-400'}">${yaSel ? '✔ Son los que tienes elegidos.' : 'Llevan una ⭐ en la lista de abajo; márcalos tú si quieres usarlos.'}</p>
      </div>
      <p class="text-[11px] font-semibold text-tinta-500">Los mejores sueltos para la Torre: ${M.sueltos.slice(0, 10).map((x, i) => `${i + 1}. ${chipT(x.c)}${x.c.nombre}`).join(' · ')}</p>
      <p class="text-[10px] font-semibold text-tinta-400">El orden no importa: el juego sortea quién sale primero en cada combate. Se simulan combates en fila (el que gana sigue con la vida que le queda) contra equipos de 6 sacados de los rivales vistos en «Retar» y de un banco de todos los tipos tan fuerte como tus mejores Pokémon, todos a Nv.50. Un Pokémon por especie. La recomendación solo cambia si otra gana claramente más (no por el azar de la simulación). Los objetos se reparten entre los que ya tienes puestos en tus Pokémon; después de moverlos dale a «Cambiar el equipo».</p>`;
    if (caja.dataset.html !== html) { caja.innerHTML = html; caja.dataset.html = html; }
    estrellasTorre(idsMejor);
  }
  // Una ⭐ abajo a la derecha en los 6 recomendados (solo se señalan: elegirlos es cosa tuya)
  function estrellasTorre(ids) {
    for (const li of $$('main ul.grid > li')) {
      const b = li.querySelector(':scope > button');
      const f = b && fibraDe(li);
      if (!f) continue;
      const toca = ids.includes(String(f.key));
      let s = b.querySelector(':scope > .axt-rec');
      if (!toca) { if (s) s.remove(); continue; }
      if (s) continue;
      s = document.createElement('span');
      s.className = 'axt-rec';
      s.setAttribute('data-ax-ignore', '1');
      s.textContent = '⭐';
      s.title = 'En el mejor equipo recomendado';
      s.style.cssText = 'position:absolute;right:-5px;bottom:-5px;font-size:13px;line-height:1;pointer-events:none;filter:drop-shadow(0 0 1px #fff)';
      b.appendChild(s);
    }
  }

  // Retar: probabilidad de ganar a cada rival con tu equipo guardado (3 suyos a la vista + 3 tapados del banco)
  const memoRival = new Map();
  function prediccionesRivales(est) {
    if (!memoTorre) return;
    const guardado = equipoGuardado(est);
    if (!guardado.length) return;
    const claveEq = guardado.map(l => l.nombre + l.item + l.hp).join(',');
    for (const r of est.rivales || []) {
      const tarjeta = $$('main div.tarjeta').find(d => { const f = fibraDe(d); return f && String(f.key) === String(r.userId); });
      if (!tarjeta) continue;
      const k = r.userId + '|' + claveEq + '|' + memoTorre.firma;
      if (!memoRival.has(k)) {
        const fijos = (r.equipo || []).filter(p => !p.oculto && p.stats && p.tipo1).map(p => luchadorT(p));
        const sims = simulaciones(memoTorre.pool, 300, 13, fijos);
        memoRival.set(k, notaEquipo(guardado, sims).g);
      }
      const p = memoRival.get(k);
      let linea = tarjeta.querySelector(':scope > .axt-predic');
      const txt = `🔮 Con tu equipo guardado ganas ≈ ${pctT(p)}`;
      if (!linea) {
        linea = document.createElement('p');
        linea.className = 'axt-predic text-[11px] font-extrabold';
        linea.setAttribute('data-ax-ignore', '1');
        const boton = $$(':scope > button', tarjeta).pop();
        tarjeta.insertBefore(linea, boton || null);
      }
      if (linea.textContent !== txt) linea.textContent = txt;
      linea.style.color = p >= 0.6 ? '#2FA84F' : p >= 0.4 ? '#D08A00' : '#E0473A';
    }
    // «Retar a ciegas»: contra un rival cualquiera del banco
    const ciegas = $$('main button').find(b => /Retar a ciegas/.test(b.textContent || ''));
    if (ciegas && memoTorre.notaGuardado) {
      let linea = ciegas.parentElement.querySelector(':scope > .axt-predic');
      const txt = `🔮 Contra un rival cualquiera ganas ≈ ${pctT(memoTorre.notaGuardado.g)}`;
      if (!linea) { linea = document.createElement('p'); linea.className = 'axt-predic text-[11px] font-extrabold text-tinta-600'; linea.setAttribute('data-ax-ignore', '1'); ciegas.insertAdjacentElement('beforebegin', linea); }
      if (linea.textContent !== txt) linea.textContent = txt;
    }
  }
  function torre() {
    const est = estadoTorre();
    if (!est) return;
    insigniasTorre(est);
    // el cálculo del equipo hace falta también en «Retar» (para el banco de rivales); el panel solo sale en «Mi equipo»
    if ($$('main ul.grid').some(u => u.querySelector(':scope > li > button'))) panelTorre(est);
    else if (!memoTorre && !calculandoTorre) {
      calculandoTorre = true;
      setTimeout(() => {
        try {
          const unicos = candidatosUnicos(est);
          const { pool, vistos, equipos, bm } = poolTorre(est, unicos);
          const sims = simulaciones(pool, N_SIMS, 7);
          const g = equipoGuardado(est);
          memoTorre = { firma: 'retar', pool, vistos, equipos, bm, sims, porSel: {}, notaGuardado: g.length ? notaEquipo(g, sims) : null, claveGuardado: JSON.stringify((est.miEquipo || []).map(m => m.ownedId + '|' + m.itemId)) };
        } catch (e) { console.warn('[axt torre]', e); }
        calculandoTorre = false;
        programar();
      }, 60);
    }
    prediccionesRivales(est);
  }

  /* ------------------------------------------------------------------ *
   *  ARRANQUE: solo en /equipo y /torre; se repasa al cambiar la página (con un pequeño retraso para no cargar)
   * ------------------------------------------------------------------ */
  let prog = null, listo = false;
  function programar() {
    clearTimeout(prog);
    prog = setTimeout(() => {
      if (!listo) return;
      try {
        if (enEquipo()) { decorarTarjetas(); decorarFichas(); botonOrden(); ordenar(); ordenEquipo(); }
        else if (enTorre()) torre();
      } catch (e) { console.warn('[axt]', e); }
    }, 250);
  }
  new MutationObserver(muts => {
    if (!enEquipo() && !enTorre()) return;
    // se ignoran los cambios que hace este mismo script
    if (muts.every(m => [...m.addedNodes].every(n => n.nodeType === 1 && (n.classList.contains('axt-tier') || n.classList.contains('axt-ficha') || n.id === 'axt-equipo' || n.id === 'axt-torre' || n.classList.contains('axt-orden') || n.classList.contains('axt-predic') || n.classList.contains('axt-rec'))))) return;
    programar();
  }).observe(document.documentElement, { childList: true, subtree: true });
  // se espera a que la web termine de montarse (tocar el DOM antes provoca errores de hidratación de React)
  const arrancar = () => setTimeout(() => { listo = true; programar(); }, 1500);
  if (document.readyState === 'complete') arrancar(); else window.addEventListener('load', arrancar);

  window.__axTiers = { analizar, stats, datos, mejoras, estadoTorre, luchadorT, notaEquipo, simulaciones, mejorEquipo, repartirObjetos, poolTorre, candidatosUnicos, tierTorre };
})();
