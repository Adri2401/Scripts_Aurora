// ==UserScript==
// @name         Aurora Dex · Isla Espejismo (qué evolucionar)
// @namespace    auroradex-isla
// @version      1.1.0
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
    const f = fibraIsla();
    for (let h = f && f.memoizedState, k = 0; h && k < 80; h = h.next, k++) {
      const v = h.memoizedState;
      if (Array.isArray(v) && typeof v[0] === 'function' && v[0].length === 2 && /refresh\(\)/.test(String(v[0]))) return v[0];
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
   *  A QUIÉN SUBIR: por cada especie que tienes, el ejemplar de más nivel. Si evoluciona por nivel a una especie
   *  que no tienes y ese nivel cabe en algún tope de la semana, es candidato (+10 puntos). Los del equipo que no
   *  llevan a ninguna especie nueva, fuera (salvo que sean de los 3 que pelean).
   * ------------------------------------------------------------------ */
  function analizar(est) {
    const todos = [...est.equipo, ...est.caja];
    const tengo = new Set(todos.map(p => p.speciesId));
    const topes = topesSemana(est), topeMax = Math.max(...Object.values(topes));
    const diaPara = n => { for (let d = est.dia; d <= (est.dias || 7); d++) if (topes[d] >= n) return d; return null; };
    const mejorDe = {};
    for (const p of todos) if (!mejorDe[p.speciesId] || p.nivel + (p.progreso || 0) / 100 > mejorDe[p.speciesId].nivel + (mejorDe[p.speciesId].progreso || 0) / 100) mejorDe[p.speciesId] = p;
    const faltan = todos.map(p => p.speciesId).filter(id => !evos[id]);
    const candidatos = [], porPokemon = {};
    for (const p of todos) {
      const lista = evos[p.speciesId];
      if (!lista) continue;
      const nuevas = lista.filter(e => !tengo.has(e.a));
      const info = { p, nuevas: [], yaTengo: lista.filter(e => tengo.has(e.a)), sinNivel: !lista.length };
      for (const e of nuevas) {
        const dia = diaPara(e.nivel);
        info.nuevas.push({ ...e, dia, falta: Math.max(0, e.nivel - p.nivel), alcanzable: e.nivel <= topeMax });
      }
      porPokemon[p.id] = info;
    }
    // candidatos: el ejemplar de más nivel de cada especie; una evolución nueva solo una vez (el que esté más cerca)
    const vistoDestino = {};
    for (const p of Object.values(mejorDe)) {
      const info = porPokemon[p.id];
      if (!info) continue;
      for (const e of info.nuevas.filter(x => x.alcanzable)) {
        const prev = vistoDestino[e.a];
        if (prev && prev.falta <= e.falta) continue;
        vistoDestino[e.a] = { p, ...e };
      }
    }
    for (const c of Object.values(vistoDestino)) candidatos.push(c);
    candidatos.sort((a, b) => (a.dia || 99) - (b.dia || 99) || a.falta - b.falta);
    return { candidatos, porPokemon, topes, topeMax, faltan, tengo };
  }

  /* ------------------------------------------------------------------ *
   *  EQUIPO PROPUESTO: el 1.º no se toca; del 2.º al 6.º, los que evolucionan a especies nuevas (primero los que lo
   *  consiguen antes: hoy mismo, luego con menos niveles). Entre los elegidos, los de más nivel delante (el 2.º y el
   *  3.º también pelean). Si no hay 5, se completa con los que ya estaban, por nivel.
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
      const cuando = c.falta === 0 ? 'en cuanto suba un nivel' : c.dia === est.dia ? `faltan ${c.falta} niveles (se puede hoy)` : c.dia ? `faltan ${c.falta} niveles (el tope lo permite el día ${c.dia})` : `faltan ${c.falta} niveles`;
      return `<li class="flex items-center gap-2 text-[11px] font-semibold ${dentro ? 'text-hoja-700' : 'text-tinta-600'}"><img src="${esc(c.p.sprite)}" alt="" width="28" height="28" class="pixelado" style="width:28px;height:28px"><span class="min-w-0 flex-1"><b>${esc(c.p.nombre)}</b> Nv.${c.p.nivel} → <b>${esc(c.nombre)}</b> (Nv.${c.nivel}${c.cond ? ', ' + esc(c.cond) : ''}) · ${cuando}</span><span class="shrink-0 text-[10px] font-extrabold">${dentro ? '✔ en el equipo' : '➕ mételo'}</span></li>`;
    };
    // del equipo: quién no aporta especie nueva
    const sobran = est.equipo.map((p, i) => {
      const info = A.porPokemon[p.id];
      if (!info) return null;
      const utiles = info.nuevas.filter(x => x.alcanzable);
      if (utiles.length) return null;
      const porque = info.sinNivel ? 'no evoluciona subiendo de nivel' : info.nuevas.length ? `su evolución (${info.nuevas.map(x => `${x.nombre} Nv.${x.nivel}`).join(', ')}) no llega con el tope de esta semana (${A.topeMax})` : `su evolución ya la tienes (${info.yaTengo.map(x => x.nombre).join(', ')})`;
      return { p, i, porque };
    }).filter(Boolean);
    const pelean = s => s.i < 3;
    const prop = equipoPropuesto(est, A);
    const igual = prop && prop.map(p => p.id).join() === est.equipo.map(p => p.id).join();
    const html = `
      <p class="titulo-seccion !mb-0">🧬 Especies nuevas por evolución</p>
      <p class="text-[11px] font-semibold text-tinta-500">Cada especie distinta que tengas aquí son 10 puntos. La experiencia es para todos los del equipo, así que en los huecos que no pelean mete a los que van a evolucionar a una especie que aún no tienes.</p>
      ${A.faltan.length ? `<p class="text-[10px] font-semibold text-tinta-400">Buscando evoluciones de ${A.faltan.length} especies…</p>` : ''}
      ${A.candidatos.length ? `<ul class="space-y-1">${A.candidatos.map(fila).join('')}</ul>` : '<p class="text-[11px] font-semibold text-tinta-500">Ninguno de los que tienes evoluciona subiendo de nivel a una especie nueva antes de que se hunda la isla.</p>'}
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
      const util = info && info.nuevas.find(x => x.alcanzable);
      const txt = !info ? '' : util ? `🧬 → ${util.nombre} Nv.${util.nivel}` : info.sinNivel ? 'no evoluciona por nivel' : '✖ su evolución ya la tienes';
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
