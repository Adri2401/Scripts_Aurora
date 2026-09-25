// ==UserScript==
// @name         Aurora Dex · Isla Espejismo (qué evolucionar)
// @namespace    auroradex-isla
// @version      1.2.0
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
    if (!caja) { caja = document.createElement('section'); caja.id = 'axi-panel'; caja.className = 'tarjeta space-y-1.5 p-3'; caja.setAttribute('data-ax-ignore', '1'); }
    if (caja.nextElementSibling !== zona) zona.insertAdjacentElement('beforebegin', caja);
    const A = analizar(est);
    const enEquipo = new Set(est.equipo.map(p => p.id));
    const fila = c => {
      const dentro = enEquipo.has(c.p.id);
      const cuando = !c.alcanzable ? `faltan ${c.falta} niveles (esta semana el tope no llega)` : c.falta === 0 ? 'en cuanto suba un nivel' : c.dia === est.dia ? `faltan ${c.falta} niveles (se puede hoy)` : c.dia ? `faltan ${c.falta} niveles (el tope lo permite el día ${c.dia})` : `faltan ${c.falta} niveles`;
      return `<li class="flex items-center gap-2 text-[11px] font-semibold ${dentro ? 'text-hoja-700' : 'text-tinta-600'}"><img src="${esc(c.p.sprite)}" alt="" width="28" height="28" class="pixelado" style="width:28px;height:28px"><span class="min-w-0 flex-1"><b>${esc(c.p.nombre)}</b> Nv.${c.p.nivel} → <b>${esc(c.nombre)}</b> (Nv.${c.nivel}${c.paso > 1 ? ', 2.ª evolución' : ''}${c.cond ? ', ' + esc(c.cond) : ''}) · ${cuando}${c.unico ? ' · <span class="text-ambar-600">es tu único ' + esc(c.p.nombre) + '</span>' : ''}</span><span class="shrink-0 text-[10px] font-extrabold">${dentro ? '✔ en el equipo' : '➕ mételo'}</span></li>`;
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
      <p class="titulo-seccion !mb-0">🧬 Especies nuevas por evolución</p>
      <p class="text-[11px] font-semibold text-tinta-500">Cada especie distinta que tengas aquí son 10 puntos. La experiencia es para todos los del equipo, así que en los huecos que no pelean mete a los que van a evolucionar a una especie que aún no tienes.</p>
      ${A.faltan.length ? `<p class="text-[10px] font-semibold text-tinta-400">Buscando evoluciones de ${A.faltan.length} especies…</p>` : ''}
      ${A.candidatos.some(c => c.alcanzable) ? `<ul class="space-y-1">${A.candidatos.filter(c => c.alcanzable).map(fila).join('')}</ul>` : '<p class="text-[11px] font-semibold text-tinta-500">Ninguno de los que tienes llega esta semana a una especie nueva subiendo de nivel.</p>'}
      ${A.candidatos.some(c => !c.alcanzable) ? `<p class="text-[10px] font-extrabold text-tinta-500">Tienen algo nuevo en su línea aunque esta semana no les dé el tope (mejor ellos que uno que ya no suma):</p><ul class="space-y-1">${A.candidatos.filter(c => !c.alcanzable).map(fila).join('')}</ul>` : ''}
      ${sobran.length ? `<p class="text-[11px] font-semibold text-tinta-600">🔁 En tu equipo no suman especie nueva: ${sobran.map(s => `<b>${esc(s.p.nombre)}</b> (${esc(s.porque)}${pelean(s) ? '; está entre los 3 que pelean, déjalo si te hace falta para ganar' : ''})`).join(' · ')}.</p>` : ''}
      ${prop ? `<p class="text-[11px] font-semibold text-tinta-600">${igual ? '✔ Tu equipo ya está así' : 'Quedaría'}: ${prop.map((p, i) => `${i + 1}. ${esc(p.nombre)} (Nv.${p.nivel})`).join(' · ')}</p>
        <button type="button" class="axi-ordenar boton-principal w-full !py-2 text-xs" ${igual ? 'disabled' : ''}>🔀 Ordenar el equipo así (el 1.º se queda)</button>
        <p class="axi-msg text-center text-[10px] font-semibold text-tinta-500"></p>` : ''}
      <p class="text-[10px] font-semibold text-tinta-400">Solo cuentan las evoluciones por nivel: los que evolucionan con piedra, intercambio o amistad no se tienen en cuenta. Tope de hoy: Nv.${est.topeNivel}; el último día, Nv.${A.topeMax}.</p>`;
    if (caja.dataset.html !== html) {
      caja.innerHTML = html; caja.dataset.html = html;
      const b = caja.querySelector('.axi-ordenar');
      if (b) b.addEventListener('click', e => { e.preventDefault(); ordenarEquipo(); });
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
