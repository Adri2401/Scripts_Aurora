// Juega Aurora Dex solo, en un navegador sin pantalla, con los mismos userscripts de Tampermonkey.
// Pensado para cron en un servidor (Oracle Cloud Free, una Raspberry…). Cada tarea hace una cosa y acaba:
//
//   node aurora.js diario          → diarias (con Huerto, Valle y Salón), Manadas gratis, bajada gratis de las Entrañas, Tronos y Torre
//   node aurora.js manadas         → en cada región busca la manada y hace sus 3 encuentros gratis (sin gastar energía)
//   node aurora.js diarias         → solo la ruta de «Jugar todas las diarias»
//   node aurora.js entranas        → la bajada gratis del día de las Entrañas (nunca gasta energía ni pases)
//   node aurora.js entranas-pases  → baja con los Pases del monte hasta gastarlos (nunca gasta energía; los lunes 00:00)
//   node aurora.js subsuelo        → se pone las Botas de Andar del Huerto y pica todas las vetas del Subsuelo
//   node aurora.js tronos          → defiende el trono que tengas con el mejor equipo o reta al más fácil
//   node aurora.js torre           → retos a ciegas de la Torre (espera entre retos) hasta hacer los del día
//   node aurora.js --sesion FICHERO → la primera vez: mete tu sesión (la cookie __Secure-next-auth.session-token)
//
// La sesión se guarda en ./perfil y el juego la va renovando sola. Si caduca, sale con código 2 y avisa.
// Opcional, aviso por Telegram al acabar: variables TELEGRAM_TOKEN (de @BotFather) y TELEGRAM_CHAT (tu id).
// Nunca entra en el Suelo Helado, Voltorb Flip ni las Ruinas Alfa.
'use strict';
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const PERFIL = process.env.AURORA_PERFIL || path.join(__dirname, 'perfil');
const SCRIPTS = (process.env.AURORA_SCRIPTS || [
  'Auroradex_diarias.user.js', 'Auroradex_safari.user.js', 'Auroradex_casatreta.user.js', 'Auroradex_huerto.user.js',
  'Auroradex_valle.user.js', 'Auroradex_salon.user.js', 'Auroradex_entranas.user.js', 'Auroradex_grutas.user.js', 'Auroradex_tiers.user.js',
  'Auroradex_manadas.user.js', 'Auroradex_capturaryguarderia.user.js',
].join(',')).split(',').map(s => s.trim()).filter(Boolean);
const LIGAS = (process.env.AURORA_LIGAS || 'clasico').split(',').map(s => s.trim()).filter(Boolean);
const ahora = () => new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' });
const log = (...a) => console.log(`[${ahora()}]`, ...a);
const espera = ms => new Promise(r => setTimeout(r, ms));

async function telegram(texto) {
  const { TELEGRAM_TOKEN: t, TELEGRAM_CHAT: c } = process.env;
  if (!t || !c) return;
  try {
    await fetch(`https://api.telegram.org/bot${t}/sendMessage`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: c, text: texto.slice(0, 3900) }) });
  } catch (e) { log('No he podido avisar por Telegram:', e.message); }
}

// Espera a que `leer()` (en la página) devuelva algo que cuadre con `fin`; aguanta recargas y navegaciones
async function esperarFin(p, leer, fin, maxMin, arg) {
  const t = Date.now() + maxMin * 60000;
  let ultimo = '';
  while (Date.now() < t) {
    await espera(5000);
    try {
      const v = String(await p.evaluate(leer, arg) || '');
      if (v && v !== ultimo) { ultimo = v; }
      if (fin.test(v)) return { ok: true, texto: v };
    } catch { /* navegando */ }
  }
  return { ok: false, texto: ultimo };
}
// Pulsa un botón de un script cuando aparezca (si su texto aún no dice que está en marcha)
async function pulsarCuandoSalga(p, sel, noSiTexto, maxS = 60) {
  for (let i = 0; i < maxS; i++) {
    try {
      const h = await p.$(sel);
      if (h) {
        const t = (await h.textContent()) || '';
        if (noSiTexto && noSiTexto.test(t)) return true;
        if (!(await h.isDisabled())) { await h.click(); return true; }
      }
    } catch { /* aún cargando */ }
    await espera(1000);
  }
  return false;
}

/* ── Las tareas: cada una devuelve una línea (o varias) para el resumen ── */
const TAREAS = {
  async diarias(p) {
    await p.goto('https://auroradex.es/menu?diarias=todas', { waitUntil: 'domcontentloaded' });
    await espera(15000);
    const r = await esperarFin(p, () => (location.pathname === '/menu' && !sessionStorage.getItem('axd-ruta') ? (document.querySelector('#axd-menu .axd-log') || {}).textContent : ''),
      /Ruta terminada|ya están hechas|Hoy ya se lanzó/, +(process.env.AURORA_MAX_MIN || 90));
    return '🗓️ Diarias\n' + (r.ok ? r.texto : '⚠ Se ha pasado el tiempo sin terminar.\n' + r.texto);
  },
  async entranas(p, _ctx, pases = false) {
    await p.addInitScript(usar => { try { const k = 'axe-conf2', c = JSON.parse(localStorage.getItem(k) || '{}'); Object.assign(c, { empezarGratis: true, usarPases: usar }); localStorage.setItem(k, JSON.stringify(c)); } catch { /* nada */ } }, !!pases);
    await p.goto('https://auroradex.es/entranas', { waitUntil: 'domcontentloaded' });
    await espera(6000);
    // solo cuenta lo que se apunte desde ahora (el registro guarda lo de otros días)
    const marca = await p.evaluate(() => { try { const l = JSON.parse(localStorage.getItem('axe-log') || '[]'); return l[l.length - 1] || ''; } catch { return ''; } });
    if (!await pulsarCuandoSalga(p, '#axe-panel button.piloto', /parar/i)) return '⛰️ Entrañas: ⚠ no veo el panel del script.';
    const leer = m => { try { const l = JSON.parse(localStorage.getItem('axe-log') || '[]'); const i = m ? l.lastIndexOf(m) : -1; return l.slice(i + 1).join('\n'); } catch { return ''; } };
    const r = await esperarFin(p, leer, pases ? /costaría energía|No tienes pases|sin pases/i : /ya no es gratis|costaría energía|no gasto pases/i, pases ? 300 : 120, marca);
    const bajadas = (r.texto.match(/Bajada terminada[^\n]*/g) || []).join('\n');
    return `⛰️ Entrañas${pases ? ' (pases)' : ''}\n` + (bajadas || r.texto.split('\n').slice(-2).join('\n')) + (r.ok ? '' : '\n⚠ Se ha pasado el tiempo.');
  },
  async manadas(p) {
    await p.goto('https://auroradex.es/manadas?gratis=1', { waitUntil: 'domcontentloaded' });
    await espera(10000);
    const r = await esperarFin(p, () => { try { const u = JSON.parse(localStorage.getItem('mh-gratis-ultimo') || 'null'); return !sessionStorage.getItem('mh-gratis') && u && u.dia === new Date().toLocaleDateString('sv') ? u.log.join('\n') : ''; } catch { return ''; } },
      /Manadas gratis hechas/, 40);
    return '🐾 Manadas gratis\n' + (r.ok ? r.texto.split('\n').filter(l => /✅|⚠/.test(l)).join('\n') : '⚠ Se ha pasado el tiempo.\n' + r.texto);
  },
  async subsuelo(p) {
    await p.goto('https://auroradex.es/huerto?botas=1&volver=' + encodeURIComponent('/subsuelo?explorar=1'), { waitUntil: 'domcontentloaded' });
    await espera(25000);
    // por si la vuelta del Huerto no ha arrancado sola
    if (await p.evaluate(() => location.pathname !== '/subsuelo' || !/🧭|🥾/.test((document.querySelector('#axsub-panel .k-log') || {}).textContent || '')).catch(() => true)) {
      if (!/\/subsuelo/.test(p.url())) await p.goto('https://auroradex.es/subsuelo', { waitUntil: 'domcontentloaded' });
      await pulsarCuandoSalga(p, '#axsub-panel .axsub-exp', null, 40);
    }
    const r = await esperarFin(p, () => (document.querySelector('#axsub-panel .k-log') || {}).textContent,
      /Ya he visto todo|Sin energía|sin energía|Has salido|Parado|ventana abierta/, 90);
    const botas = await p.evaluate(() => { try { const h = +JSON.parse(localStorage.getItem('axh-botas-hasta') || '0'); return h > Date.now() ? `🥾 Botas puestas (${Math.round((h - Date.now()) / 36e5)} h más).` : '🥾 Sin botas.'; } catch { return ''; } }).catch(() => '');
    const ult = (r.texto.match(/(?:\d\d:\d\d:\d\d\s+)[^\d][^\n]*?(?=\d\d:\d\d:\d\d|$)/g) || [r.texto]).slice(-2).join('\n');
    return `⛏️ Subsuelo · ${botas}\n${ult}${r.ok ? '' : '\n⚠ Se ha pasado el tiempo.'}`;
  },
  async tronos(p) {
    await p.addInitScript(() => { try { sessionStorage.setItem('axt-tronos-auto', '1'); } catch { /* nada */ } });
    await p.goto('https://auroradex.es/tronos', { waitUntil: 'domcontentloaded' });
    const r = await esperarFin(p, () => (document.querySelector('#axt-tronos-auto p') || {}).textContent,
      /con el mejor equipo|Hoy ya no se puede|No tengo equipo|No he podido/, 25);
    return '👑 Tronos\n' + (r.texto || '⚠ Sin respuesta del script.');
  },
  async torre(p) {
    const lineas = [];
    for (const liga of LIGAS) {
      await p.addInitScript(l => { try { const o = JSON.parse(sessionStorage.getItem('axt-torre-auto') || '{}'); o[l] = true; sessionStorage.setItem('axt-torre-auto', JSON.stringify(o)); localStorage.setItem('axt-torre-ciegas', '1'); } catch { /* nada */ } }, liga);
      await p.goto('https://auroradex.es/torre?liga=' + liga, { waitUntil: 'domcontentloaded' });
      const r = await esperarFin(p, () => (document.querySelector('#axt-auto p') || {}).textContent + ' | ' + (document.querySelector('#axt-auto button') || {}).textContent,
        /Hechos los retos de hoy|quedan 0 hoy/, 150);
      lineas.push(`🗼 Torre (${liga}): ${r.ok ? 'retos de hoy hechos.' : '⚠ ' + r.texto.slice(0, 200)}`);
    }
    return lineas.join('\n');
  },
};
TAREAS['entranas-pases'] = (p, ctx) => TAREAS.entranas(p, ctx, true);
TAREAS.diario = async (p, ctx) => {
  const out = [];
  for (const t of ['diarias', 'manadas', 'entranas', 'tronos', 'torre']) {
    try { out.push(await nueva(ctx, TAREAS[t])); } catch (e) { out.push(`⚠ ${t}: ${e.message}`); }
    log(out[out.length - 1]);
  }
  return out.join('\n\n');
};
// cada tarea en una pestaña nueva (así el sessionStorage de una no se mezcla con la siguiente)
async function nueva(ctx, fn) {
  const p = await ctx.newPage();
  p.on('console', m => { const t = m.text(); if (/^\[(diarias|axh|axsub)\]/.test(t)) log(t); });
  try { return await fn(p, ctx); } finally { await p.close().catch(() => {}); }
}

(async () => {
  const iS = process.argv.indexOf('--sesion');
  const tarea = process.argv.slice(2).find(a => TAREAS[a]) || (iS > 0 ? null : 'diarias');
  const ctx = await chromium.launchPersistentContext(PERFIL, { headless: true, viewport: { width: 430, height: 932 }, locale: 'es-ES', timezoneId: 'Europe/Madrid' });
  if (iS > 0) {
    const valor = fs.readFileSync(process.argv[iS + 1], 'utf8').trim();
    await ctx.addCookies([{ name: '__Secure-next-auth.session-token', value: valor, domain: 'auroradex.es', path: '/', httpOnly: true, secure: true, sameSite: 'Lax', expires: Math.floor(Date.now() / 1000) + 30 * 86400 }]);
    log('Sesión guardada en el perfil. Ya puedes borrar el fichero con la cookie.');
  }
  // prohibido entrar: Suelo Helado, Voltorb Flip y Ruinas Alfa
  await ctx.route(/auroradex\.es\/(hielo|trigal|ruinas)(\/|\?|#|$)/, r => { log('⛔ Bloqueado:', r.request().url()); r.abort(); });
  // los userscripts, como los mete Tampermonkey: al cargar cada página
  const codigo = SCRIPTS.map(f => fs.readFileSync(path.join(RAIZ, f), 'utf8'));
  await ctx.addInitScript({ content: `(() => { const lanzar = () => { ${codigo.map(s => `try { (function(){ ${s} })(); } catch (e) { console.log('[bot] error en un script: ' + e.message); }`).join('\n')} };
    if (document.readyState === 'complete') setTimeout(lanzar, 50); else addEventListener('load', () => setTimeout(lanzar, 50)); })();` });

  const p0 = ctx.pages()[0] || await ctx.newPage();
  await p0.goto('https://auroradex.es/menu', { waitUntil: 'networkidle', timeout: 60000 });
  const dentro = await p0.evaluate(() => location.pathname === '/menu' && /para hoy/i.test(document.body.innerText));
  if (!dentro) {
    log('⚠ La sesión ha caducado o no está puesta: vuelve a meterla con  node aurora.js --sesion FICHERO');
    await telegram('⚠ Aurora Dex: la sesión ha caducado. Vuelve a meterla en el servidor (node aurora.js --sesion FICHERO).');
    await ctx.close(); process.exit(2);
  }
  if (!tarea) { log('Dentro. Sesión lista.'); await ctx.close(); return; }
  log(`Dentro. Tarea: ${tarea}`);
  let resumen;
  try { resumen = tarea === 'diario' ? await TAREAS.diario(p0, ctx) : await nueva(ctx, TAREAS[tarea]); }
  catch (e) { resumen = `⚠ ${tarea}: ${e.message}`; try { await p0.screenshot({ path: path.join(__dirname, 'ultimo.png') }); } catch { /* nada */ } }
  log('Resumen:\n' + resumen);
  await telegram('🎮 Aurora Dex · ' + tarea + '\n\n' + resumen);
  await ctx.close();
})().catch(async e => { log('Error:', e.message); await telegram('⚠ Aurora Dex: el bot ha fallado: ' + e.message); process.exit(1); });
