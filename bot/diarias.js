// Juega todas las diarias de Aurora Dex en un navegador sin pantalla, con los mismos userscripts de Tampermonkey.
// Pensado para ejecutarse una vez al día con cron en un servidor (Oracle Cloud Free, una Raspberry…).
//
//   node diarias.js                  → juega la ruta de «Jugar todas las diarias» y escribe el resumen
//   node diarias.js --sesion FICHERO → la primera vez: mete tu sesión (la cookie __Secure-next-auth.session-token)
//
// La sesión se guarda en ./perfil (el perfil del navegador) y el juego la va renovando sola mientras se use. Si caduca,
// sale con código 2 y avisa: vuelve a meterla con --sesion.
// Opcional, aviso por Telegram al acabar: variables TELEGRAM_TOKEN (de @BotFather) y TELEGRAM_CHAT (tu id).
'use strict';
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const PERFIL = path.join(__dirname, 'perfil');
const SCRIPTS = (process.env.AURORA_SCRIPTS || 'Auroradex_diarias.user.js,Auroradex_safari.user.js,Auroradex_casatreta.user.js,Auroradex_hielo.user.js')
  .split(',').map(s => s.trim()).filter(Boolean);
const MAX_MIN = +(process.env.AURORA_MAX_MIN || 75);          // tope de tiempo de la ruta
const ahora = () => new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' });
const log = (...a) => console.log(`[${ahora()}]`, ...a);

async function telegram(texto) {
  const { TELEGRAM_TOKEN: t, TELEGRAM_CHAT: c } = process.env;
  if (!t || !c) return;
  try {
    await fetch(`https://api.telegram.org/bot${t}/sendMessage`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: c, text: texto.slice(0, 3900) }) });
  } catch (e) { log('No he podido avisar por Telegram:', e.message); }
}

(async () => {
  const i = process.argv.indexOf('--sesion');
  const ctx = await chromium.launchPersistentContext(PERFIL, { headless: true, viewport: { width: 430, height: 932 }, locale: 'es-ES', timezoneId: 'Europe/Madrid' });
  if (i > 0) {
    const valor = fs.readFileSync(process.argv[i + 1], 'utf8').trim();
    await ctx.addCookies([{ name: '__Secure-next-auth.session-token', value: valor, domain: 'auroradex.es', path: '/', httpOnly: true, secure: true, sameSite: 'Lax', expires: Math.floor(Date.now() / 1000) + 30 * 86400 }]);
    log('Sesión guardada en el perfil. Ya puedes borrar el fichero con la cookie.');
  }
  // los userscripts, como los mete Tampermonkey: al cargar cada página
  const codigo = SCRIPTS.map(f => fs.readFileSync(path.join(RAIZ, f), 'utf8'));
  await ctx.addInitScript({ content: `(() => { const lanzar = () => { ${codigo.map(s => `try { (function(){ ${s} })(); } catch (e) { console.log('[bot] error en un script: ' + e.message); }`).join('\n')} };
    if (document.readyState === 'complete') setTimeout(lanzar, 50); else addEventListener('load', () => setTimeout(lanzar, 50)); })();` });
  const p = ctx.pages()[0] || await ctx.newPage();
  const lineas = [];
  p.on('console', m => { const t = m.text(); if (/^\[(diarias|hielo)\]/.test(t)) { lineas.push(t.replace(/^\[\w+\]\s*/, '')); log(t); } });

  await p.goto('https://auroradex.es/menu', { waitUntil: 'networkidle', timeout: 60000 });
  const dentro = await p.evaluate(() => location.pathname === '/menu' && /para hoy/i.test(document.body.innerText));
  if (!dentro) {
    log('⚠ La sesión ha caducado o no está puesta: vuelve a meterla con  node diarias.js --sesion FICHERO');
    await telegram('⚠ Aurora Dex: la sesión ha caducado. Vuelve a meterla en el servidor (node diarias.js --sesion FICHERO).');
    await ctx.close(); process.exit(2);
  }
  log('Dentro. Lanzo la ruta de todas las diarias…');
  await p.goto('https://auroradex.es/menu?diarias=todas', { waitUntil: 'domcontentloaded' });

  // se espera a que la ruta termine (vuelve al menú con «Ruta terminada» o «ya están hechas»)
  const fin = Date.now() + MAX_MIN * 60000;
  let resumen = '';
  await p.waitForTimeout(15000);
  while (Date.now() < fin) {
    await p.waitForTimeout(5000);
    try {
      const e = await p.evaluate(() => ({ url: location.pathname, ruta: sessionStorage.getItem('axd-ruta'), menu: (document.querySelector('#axd-menu .axd-log') || {}).textContent || '' }));
      if (e.url === '/menu' && !e.ruta && /Ruta terminada|ya están hechas|Hoy ya se lanzó/.test(e.menu)) { resumen = e.menu; break; }
    } catch { /* navegando */ }
  }
  if (!resumen) { resumen = '⚠ Se ha pasado el tiempo sin terminar. Últimas líneas:\n' + lineas.slice(-15).join('\n'); try { await p.screenshot({ path: path.join(__dirname, 'ultimo.png') }); } catch { /* nada */ } }
  log('Resumen:\n' + resumen);
  await telegram('🗓️ Aurora Dex · diarias\n' + resumen);
  await ctx.close();
})().catch(async e => { log('Error:', e.message); await telegram('⚠ Aurora Dex: el bot de diarias ha fallado: ' + e.message); process.exit(1); });
