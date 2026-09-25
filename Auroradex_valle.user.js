// ==UserScript==
// @name         Aurora Dex · Valle Aurora (todo en un botón)
// @namespace    auroradex-valle
// @version      1.0.0
// @description  Solo en /valle. Un botón que lo hace todo de la forma más rentable: recoge (con Tónico cuando compensa y con el almacén a la mitad o más, que es lo que cuenta en la Feria), cobra los encargos, coloca a los mejores (y reorganiza cuando cambia el tipo en racha) y gasta el Brillo en lo que más producción da por cada Brillo (edificios, con sus hitos ×2 y huecos nuevos, Monumento y residentes). Opcional: Horas extra y repetirlo solo cada 30 min.
// @match        https://auroradex.es/*
// @match        https://www.auroradex.es/*
// @updateURL    https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_valle.user.js
// @downloadURL  https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_valle.user.js
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
  const lsPut = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin storage */ } };
  const espera = ms => new Promise(ok => setTimeout(ok, ms));
  const enValle = () => /^\/valle(\/|$)/.test(location.pathname);
  const hoy = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  const fmt = n => (n >= 1e6 ? (n / 1e6).toFixed(1).replace('.', ',') + ' M' : n >= 1e3 ? (n / 1e3).toFixed(1).replace('.', ',') + ' mil' : String(Math.round(n)));
  const texto = el => (el && el.textContent || '').replace(/\s+/g, ' ').trim();

  /* ------------------------------------------------------------------ *
   *  ESTADO DEL VALLE: el mismo objeto que usa la página (estado de React de «PantallaValle»), siempre al día
   *  después de cada acción: brillo, edificios (nivel, coste, Brillo/h, hitos, huecos, trabajadores), Monumento,
   *  Tónicos, encargos, residentes…
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
  function estadoValle() {
    const el = document.getElementById('valle-pestanas') || $$('main section')[0];
    let f = actual(fibraDe(el));
    for (let i = 0; f && i < 80; i++, f = f.return) {
      let h = f.memoizedState;
      for (let k = 0; h && typeof h === 'object' && k < 80; k++, h = h.next) {
        const v = h.memoizedState;
        if (v && typeof v === 'object' && Array.isArray(v.edificios) && typeof v.brillo === 'number') return v;
      }
    }
    return null;
  }

  /* ------------------------------------------------------------------ *
   *  EN QUÉ GASTAR: cada compra se puntúa por la producción que añade (Brillo/h) dividida entre lo que cuesta, y
   *  se compra la mejor mientras llegue el Brillo (se vuelve a mirar después de cada compra).
   *  · Edificio: su producción crece con el nivel y se duplica en los niveles 10, 25, 50, 100 y 150. Subir de n a n+1
   *    añade su Brillo/h × ((n+1)/n) − 1, o ×2 si llega a un hito; si con ese nivel abre un hueco, además lo que
   *    rinde un trabajador medio de ahí. Si un encargo pide subir niveles, su premio abarata cada subida.
   *  · Monumento: +2% a todo el valle por piso.
   *  · Residente (comida del día): su bonus repartido entre las comidas que le faltan, sobre sus edificios.
   *  Lo aprendido de verdad (cuánto subió de verdad un edificio al subirlo) corrige la estimación con el tiempo.
   * ------------------------------------------------------------------ */
  const HITOS = [10, 25, 50, 100, 150];
  const LS_APRENDE = 'axv-subidas';
  function factorAprendido(id) {
    const g = lsGet(LS_APRENDE, {})[id];
    return g && g.n >= 2 ? Math.min(3, Math.max(0.3, g.r)) : 1;
  }
  function apuntarSubida(id, estimado, real) {
    if (!(estimado > 0) || !(real > 0)) return;
    const g = lsGet(LS_APRENDE, {}), a = g[id] || { r: 1, n: 0 };
    const r = real / estimado;
    a.r = (a.r * a.n + r) / (a.n + 1); a.n = Math.min(a.n + 1, 20);
    g[id] = a; lsPut(LS_APRENDE, g);
  }
  function opciones(x) {
    const ops = [];
    const encNiv = (x.hoy && x.hoy.encargos || []).find(e => /niveles/.test(e.id) && !e.cobrado && e.progreso < e.meta);
    const premioNivel = encNiv ? encNiv.brillo / (encNiv.meta - encNiv.progreso) : 0;
    for (const e of x.edificios) {
      if (!e.abierto || !e.coste || e.candado) continue;
      const n = e.nivel, bh = e.brilloHora || 0;
      if (n < 1) continue;                                          // construir uno nuevo lo decides tú
      let d = bh * ((n + 1) / n * (HITOS.includes(n + 1) ? 2 : 1) - 1);
      if (e.siguienteHueco === n + 1 && e.trabajadores.length) d += bh / e.trabajadores.length;
      d *= factorAprendido(e.id);
      const coste = e.coste.brillo, costeEf = Math.max(1, coste - premioNivel);
      ops.push({ tipo: 'edificio', id: e.id, nombre: `${e.nombre} → Nv ${n + 1}${HITOS.includes(n + 1) ? ' (×2)' : ''}`, coste, dinero: e.coste.dinero || 0, d, roi: d / costeEf, bh });
    }
    if (x.monumento && x.monumento.coste) {
      const d = (x.brilloHora || 0) * 0.02 / (1 + (x.monumento.bonus || 0));
      ops.push({ tipo: 'monumento', nombre: `Monumento → piso ${x.monumento.nivel + 1}`, coste: x.monumento.coste, dinero: 0, d, roi: d / x.monumento.coste });
    }
    const mud = x.mudanza || {};
    for (const r of x.residentes || []) {
      if (r.comidoHoy || !r.coste) continue;
      const sobre = x.edificios.filter(e => (r.edificios || []).includes(e.nombre)).reduce((s, e) => s + (e.brilloHora || 0), 0);
      const d = (mud.bonus || 0) * sobre / Math.max(1, (mud.comidas || 3) - (r.comidas || 0));
      ops.push({ tipo: 'residente', id: r.speciesId, nombre: `Dar de comer a ${r.nombre}`, coste: r.coste, dinero: 0, d, roi: d / r.coste });
    }
    return ops.sort((a, b) => b.roi - a.roi);
  }

  /* ------------------------------------------------------------------ *
   *  BOTONES DE LA PÁGINA (se pulsan los mismos que pulsarías tú)
   * ------------------------------------------------------------------ */
  const botones = () => $$('main button').filter(b => !b.closest('#axv-panel'));
  const libre = b => b && !b.disabled && b.isConnected;
  const bRecoger = () => botones().find(b => /^Recoger/.test(texto(b)));
  const bColocar = () => botones().find(b => /Colocar/.test(texto(b)) && !/Reorganizar/.test(texto(b)));
  const bReorganizar = () => botones().find(b => /Reorganizar/.test(texto(b)));
  const bMonumento = () => botones().find(b => /^Subir un piso/.test(texto(b)));
  const bHorasExtra = () => botones().find(b => /Horas extra/.test(texto(b)));
  const bSubir = id => { const s = document.getElementById('ed-' + id); return s && $$('button.boton-principal', s).find(b => /^(Subir|Construir)/.test(texto(b))); };
  const bEncargos = () => botones().filter(b => /\+.*✦/.test(texto(b)) && b.closest('li') && !b.disabled);
  const bComer = () => botones().find(b => /^🧺/.test(texto(b)));
  const bVamos = () => $$('button').find(b => /^¡?Vamos!?$/.test(texto(b)));
  const huecosLibres = () => $$('main button[aria-label="Poner a alguien a trabajar"]').length;

  // Pulsa y espera a que la página termine (el estado cambia y los botones dejan de estar ocupados)
  async function pulsar(b, ms = 5000) {
    if (!libre(b)) return false;
    const antes = estadoValle();
    b.click();
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      await espera(150);
      if (estadoValle() !== antes) break;
    }
    await espera(350);
    const v = bVamos(); if (v) { v.click(); await espera(300); }
    return true;
  }

  /* ------------------------------------------------------------------ *
   *  HACER TODO
   * ------------------------------------------------------------------ */
  const LS_OPC = 'axv-opciones', LS_RACHA = 'axv-racha';
  const opc = Object.assign({ tonico: true, mitad: true, reorganizar: true, horasExtra: false, repetir: false }, lsGet(LS_OPC, {}));
  let enMarcha = false, repetirT = null;
  const log = t => {
    const box = document.querySelector('#axv-panel .axv-log');
    if (!box) return;
    const p = document.createElement('p');
    const h = new Date();
    p.textContent = `${String(h.getHours()).padStart(2, '0')}:${String(h.getMinutes()).padStart(2, '0')}  ${t}`;
    box.appendChild(p);
    while (box.children.length > 60) box.firstChild.remove();
    box.scrollTop = box.scrollHeight;
  };
  async function hacerTodo() {
    if (enMarcha) return;
    enMarcha = true; pintarBoton();
    try {
      const v0 = bVamos(); if (v0) { v0.click(); await espera(400); }
      let x = estadoValle();
      if (!x) { log('No encuentro el estado del valle (¿estás en la pestaña «Valle»?).'); return; }

      // 1) Recoger: con el almacén a la mitad o más (es lo que cuenta para la Feria) y con Tónico si hay
      const lleno = x.lleno || 0;
      const rec = bRecoger();
      if (libre(rec) && (!opc.mitad || lleno >= 0.5)) {
        const t = document.getElementById('valle-tonico');
        const quiero = opc.tonico && x.tonicos > 0;
        if (t && t.checked !== quiero) { t.click(); await espera(200); }
        const antes = x.brillo;
        await pulsar(bRecoger());
        x = estadoValle() || x;
        log(`✦ Recogido ${fmt(Math.max(0, x.brillo - antes))}${quiero ? ' (con Tónico)' : ''}.`);
      } else if (libre(rec)) log(`Almacén al ${Math.round(lleno * 100)}%: espero a la mitad para recoger (cuenta para la Feria).`);

      // 2) Trabajadores: reorganizar cuando cambia el tipo en racha; si no, llenar huecos
      const racha = x.hoy && x.hoy.tipoRacha ? x.hoy.tipoRacha.tipo : null;
      const ultima = lsGet(LS_RACHA, null);
      if (opc.reorganizar && racha && (!ultima || ultima.dia !== hoy() || ultima.tipo !== racha) && libre(bReorganizar())) {
        await pulsar(bReorganizar());
        lsPut(LS_RACHA, { dia: hoy(), tipo: racha });
        log(`♻️ Reorganizado para el tipo en racha de hoy (${racha} ×${x.hoy.tipoRacha.mult}).`);
      } else if (huecosLibres() && libre(bColocar())) {
        await pulsar(bColocar());
        log('✨ Huecos libres rellenados con los mejores de la caja.');
      }

      // 3) Horas extra (opcional: gasta energía; una al día, que además cumple el encargo)
      x = estadoValle() || x;
      if (opc.horasExtra && x.turno && x.turno.hechos < 1 && x.turno.energia >= x.turno.coste && libre(bHorasExtra())) {
        await pulsar(bHorasExtra());
        log(`⚡ Horas extra: +${fmt(x.turno.brillo)} por ${x.turno.coste} de energía.`);
      }

      // 4) Encargos listos
      for (let i = 0; i < 5; i++) { const b = bEncargos()[0]; if (!b) break; await pulsar(b); log('📜 Encargo cobrado.'); }

      // 5) Gastar el Brillo en lo que más rinde
      let compras = 0;
      for (let paso = 0; paso < 80; paso++) {
        x = estadoValle();
        if (!x) break;
        const op = opciones(x).find(o => o.coste <= x.brillo && o.dinero <= (x.dinero || 0));
        if (!op) break;
        const b = op.tipo === 'edificio' ? bSubir(op.id) : op.tipo === 'monumento' ? bMonumento() : bComer();
        if (!libre(b)) break;
        const antes = op.tipo === 'edificio' ? (x.edificios.find(e => e.id === op.id) || {}).brilloHora : 0;
        await pulsar(b);
        const x2 = estadoValle();
        if (!x2 || x2 === x) { log(`⚠️ No pude: ${op.nombre}.`); break; }
        if (op.tipo === 'edificio') {
          const desp = (x2.edificios.find(e => e.id === op.id) || {}).brilloHora;
          apuntarSubida(op.id, op.d / factorAprendido(op.id), (desp || 0) - (antes || 0));
        }
        compras++;
        log(`⬆️ ${op.nombre} · ✦ ${fmt(op.coste)} → +${fmt(op.d)}/h (se paga en ${Math.max(1, Math.round(op.coste / Math.max(op.d, 1)))} h)`);
      }
      // encargos que se hayan cumplido comprando
      for (let i = 0; i < 5; i++) { const b = bEncargos()[0]; if (!b) break; await pulsar(b); log('📜 Encargo cobrado.'); }
      x = estadoValle() || x;
      const sig = opciones(x)[0];
      log(`✔ Hecho${compras ? ` (${compras} mejora${compras > 1 ? 's' : ''})` : ''}. Producción: ${fmt(x.brilloHora || 0)}/h.${sig ? ` Lo siguiente que más rinde: ${sig.nombre} (✦ ${fmt(sig.coste)}).` : ''}`);
    } catch (e) {
      console.warn('[axv]', e);
      log('⚠️ Error: ' + (e && e.message || e));
    } finally {
      enMarcha = false; pintarBoton();
    }
  }

  /* ------------------------------------------------------------------ *
   *  PANEL (debajo del valle)
   * ------------------------------------------------------------------ */
  function pintarBoton() {
    const b = document.querySelector('#axv-panel .axv-todo');
    if (b) { b.disabled = enMarcha; b.textContent = enMarcha ? '⏳ Haciéndolo…' : '🤖 Hacerlo todo'; }
  }
  function programarRepeticion() {
    clearInterval(repetirT);
    if (opc.repetir) repetirT = setInterval(() => { if (enValle() && document.getElementById('axv-panel')) hacerTodo(); }, 30 * 60 * 1000);
  }
  function montar() {
    if (!enValle()) { const p = document.getElementById('axv-panel'); if (p) p.remove(); return; }
    if (document.getElementById('axv-panel')) return;
    const ancla = $$('main section').find(s => /grid-cols-3/.test(s.className) && /Colocar/.test(texto(s)));
    if (!ancla) return;
    const p = document.createElement('section');
    p.id = 'axv-panel';
    p.className = 'tarjeta space-y-2 p-3';
    p.setAttribute('data-ax-ignore', '1');
    const casilla = (k, t) => `<label class="flex items-center gap-2 text-[11px] font-bold text-tinta-600"><input type="checkbox" data-k="${k}" ${opc[k] ? 'checked' : ''}> ${t}</label>`;
    p.innerHTML = `
      <button type="button" class="axv-todo boton-principal w-full !py-2.5 text-sm">🤖 Hacerlo todo</button>
      <div class="space-y-1">
        ${casilla('mitad', 'Recoger solo con el almacén a la mitad o más (cuenta para la Feria)')}
        ${casilla('tonico', 'Usar Tónico al recoger si hay')}
        ${casilla('reorganizar', 'Reorganizar trabajadores cuando cambia el tipo en racha')}
        ${casilla('horasExtra', 'Una tanda de Horas extra al día (gasta energía)')}
        ${casilla('repetir', 'Repetirlo solo cada 30 min mientras tengas el valle abierto')}
      </div>
      <p class="text-[10px] font-semibold text-tinta-400">Gasta el Brillo en lo que más producción da por cada Brillo: edificios (con sus hitos ×2 y huecos nuevos), pisos del Monumento y la comida de los residentes. No construye edificios nuevos, no migra ni compra en la tienda.</p>
      <div class="axv-log max-h-40 overflow-y-auto rounded-card border-2 border-crema-200 bg-crema-50 p-2 text-[11px] font-semibold text-tinta-600"></div>`;
    ancla.insertAdjacentElement('afterend', p);
    p.querySelector('.axv-todo').addEventListener('click', e => { e.preventDefault(); hacerTodo(); });
    for (const c of $$('input[data-k]', p)) c.addEventListener('change', () => { opc[c.dataset.k] = c.checked; lsPut(LS_OPC, opc); programarRepeticion(); });
    pintarBoton();
    // qué haría ahora
    const x = estadoValle();
    if (x) { const sig = opciones(x)[0]; log(`Producción: ${fmt(x.brilloHora || 0)}/h · almacén al ${Math.round((x.lleno || 0) * 100)}%.${sig ? ` Lo que más rinde ahora: ${sig.nombre} (✦ ${fmt(sig.coste)}, +${fmt(sig.d)}/h).` : ''}`); }
  }

  let t = null;
  new MutationObserver(() => { clearTimeout(t); t = setTimeout(montar, 400); }).observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(montar, 2000);
  programarRepeticion();
})();
