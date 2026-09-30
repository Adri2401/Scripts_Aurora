// ==UserScript==
// @name         Aurora Dex · Novedades
// @namespace    auroradex-novedades
// @version      1.0.0
// @description  Vigila la web y te avisa de lo nuevo: versión nueva de la web, secciones nuevas en el menú, regiones nuevas, más especies en la Pokédex, dibujos de Pokémon de generaciones nuevas (6.ª, 7.ª…) ya subidos, y lo que asome en el código de la web (nombres de Pokémon de la 6.ª generación en adelante, regiones como Kalos o Alola, rutas de secciones que aún no están en el menú). Mira cada 3 horas por detrás (unas pocas páginas; el código solo cuando cambia) y lo apunta en «🆕 Novedades», arriba del Menú.
// @match        https://auroradex.es/*
// @match        https://www.auroradex.es/*
// @updateURL    https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_novedades.user.js
// @downloadURL  https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_novedades.user.js
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  'use strict';
  // Solo en la pestaña (no en las ventanas ocultas de los robots)
  try { if (window.top !== window) return; } catch { return; }

  const LS_FOTO = 'axn-foto', LS_NOV = 'axn-novedades', LS_T = 'axn-ultima';
  const CADA = 3 * 3600e3;
  const PANEL_ID = 'axn-panel';
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } };
  const lsPut = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* lleno */ } };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // Pokémon de la 6.ª generación en adelante (#650…#1025), con el nombre inglés si cambia
  const GEN_DATOS = 'Chespin|Quilladin|Chesnaught|Fennekin|Braixen|Delphox|Froakie|Frogadier|Greninja|Bunnelby|Diggersby|Fletchling|Fletchinder|Talonflame|Scatterbug|Spewpa|Vivillon|Litleo|Pyroar|Flabébé|Floette|Florges|Skiddo|Gogoat|Pancham|Pangoro|Furfrou|Espurr|Meowstic|Honedge|Doublade|Aegislash|Spritzee|Aromatisse|Swirlix|Slurpuff|Inkay|Malamar|Binacle|Barbaracle|Skrelp|Dragalge|Clauncher|Clawitzer|Helioptile|Heliolisk|Tyrunt|Tyrantrum|Amaura|Aurorus|Sylveon|Hawlucha|Dedenne|Carbink|Goomy|Sliggoo|Goodra|Klefki|Phantump|Trevenant|Pumpkaboo|Gourgeist|Bergmite|Avalugg|Noibat|Noivern|Xerneas|Yveltal|Zygarde|Diancie|Hoopa|Volcanion|Rowlet|Dartrix|Decidueye|Litten|Torracat|Incineroar|Popplio|Brionne|Primarina|Pikipek|Trumbeak|Toucannon|Yungoos|Gumshoos|Grubbin|Charjabug|Vikavolt|Crabrawler|Crabominable|Oricorio|Cutiefly|Ribombee|Rockruff|Lycanroc|Wishiwashi|Mareanie|Toxapex|Mudbray|Mudsdale|Dewpider|Araquanid|Fomantis|Lurantis|Morelull|Shiinotic|Salandit|Salazzle|Stufful|Bewear|Bounsweet|Steenee|Tsareena|Comfey|Oranguru|Passimian|Wimpod|Golisopod|Sandygast|Palossand|Pyukumuku|Código Cero/Type: Null|Silvally|Minior|Komala|Turtonator|Togedemaru|Mimikyu|Bruxish|Drampa|Dhelmise|Jangmo-o|Hakamo-o|Kommo-o|Tapu Koko|Tapu Lele|Tapu Bulu|Tapu Fini|Cosmog|Cosmoem|Solgaleo|Lunala|Nihilego|Buzzwole|Pheromosa|Xurkitree|Celesteela|Kartana|Guzzlord|Necrozma|Magearna|Marshadow|Poipole|Naganadel|Stakataka|Blacephalon|Zeraora|Meltan|Melmetal|Grookey|Thwackey|Rillaboom|Scorbunny|Raboot|Cinderace|Sobble|Drizzile|Inteleon|Skwovet|Greedent|Rookidee|Corvisquire|Corviknight|Blipbug|Dottler|Orbeetle|Nickit|Thievul|Gossifleur|Eldegoss|Wooloo|Dubwool|Chewtle|Drednaw|Yamper|Boltund|Rolycoly|Carkol|Coalossal|Applin|Flapple|Appletun|Silicobra|Sandaconda|Cramorant|Arrokuda|Barraskewda|Toxel|Toxtricity|Sizzlipede|Centiskorch|Clobbopus|Grapploct|Sinistea|Polteageist|Hatenna|Hattrem|Hatterene|Impidimp|Morgrem|Grimmsnarl|Obstagoon|Perrserker|Cursola|Sirfetch’d|Mr. Rime|Runerigus|Milcery|Alcremie|Falinks|Pincurchin|Snom|Frosmoth|Stonjourner|Eiscue|Indeedee|Morpeko|Cufant|Copperajah|Dracozolt|Arctozolt|Dracovish|Arctovish|Duraludon|Dreepy|Drakloak|Dragapult|Zacian|Zamazenta|Eternatus|Kubfu|Urshifu|Zarude|Regieleki|Regidrago|Glastrier|Spectrier|Calyrex|Wyrdeer|Kleavor|Ursaluna|Basculegion|Sneasler|Overqwil|Enamorus|Sprigatito|Floragato|Meowscarada|Fuecoco|Crocalor|Skeledirge|Quaxly|Quaxwell|Quaquaval|Lechonk|Oinkologne|Tarountula|Spidops|Nymble|Lokix|Pawmi|Pawmo|Pawmot|Tandemaus|Maushold|Fidough|Dachsbun|Smoliv|Dolliv|Arboliva|Squawkabilly|Nacli|Naclstack|Garganacl|Charcadet|Armarouge|Ceruledge|Tadbulb|Bellibolt|Wattrel|Kilowattrel|Maschiff|Mabosstiff|Shroodle|Grafaiai|Bramblin|Brambleghast|Toedscool|Toedscruel|Klawf|Capsakid|Scovillain|Rellor|Rabsca|Flittle|Espathra|Tinkatink|Tinkatuff|Tinkaton|Wiglett|Wugtrio|Bombirdier|Finizen|Palafin|Varoom|Revavroom|Cyclizar|Orthworm|Glimmet|Glimmora|Greavard|Houndstone|Flamigo|Cetoddle|Cetitan|Veluza|Dondozo|Tatsugiri|Annihilape|Clodsire|Farigiraf|Dudunsparce|Kingambit|Colmilargo/Great Tusk|Colagrito/Scream Tail|Furioseta/Brute Bonnet|Melenaleteo/Flutter Mane|Reptalada/Slither Wing|Pelarena/Sandy Shocks|Ferrodada/Iron Treads|Ferrosaco/Iron Bundle|Ferropalmas/Iron Hands|Ferrocuello/Iron Jugulis|Ferropolilla/Iron Moth|Ferropúas/Iron Thorns|Frigibax|Arctibax|Baxcalibur|Gimmighoul|Gholdengo|Wo-Chien|Chien-Pao|Ting-Lu|Chi-Yu|Bramaluna/Roaring Moon|Ferropaladín/Iron Valiant|Koraidon|Miraidon|Ondulagua/Walking Wake|Ferroverdor/Iron Leaves|Dipplin|Poltchageist|Sinistcha|Okidogi|Munkidori|Fezandipiti|Ogerpon|Archaludon|Hydrapple|Flamariete/Gouging Fire|Electrofuria/Raging Bolt|Ferromole/Iron Boulder|Ferrotesta/Iron Crown|Terapagos|Pecharunt';
  const NUEVOS = GEN_DATOS.split('|').map((s, i) => ({ n: 650 + i, nombres: s.split('/') }));
  const GEN_DE = n => n <= 721 ? 6 : n <= 809 ? 7 : n <= 905 ? 8 : 9;
  const REGIONES_NUEVAS = ['Kalos', 'Alola', 'Galar', 'Hisui', 'Paldea', 'Kitakami', 'Arándano'];
  // un Pokémon por generación: si su dibujo ya existe en la web, esa generación está subida
  const SPRITES = [[650, 6], [722, 7], [810, 8], [906, 9]];
  const PAGINAS = ['/menu', '/pokedex', '/johto', '/mapa'];

  const texto = h => String(h || '').replace(/\\"/g, '"');
  async function pedir(url) { try { const r = await fetch(url, { credentials: 'include' }); return r.ok ? await r.text() : null; } catch { return null; } }
  async function existe(url) { try { const r = await fetch(url, { method: 'HEAD', cache: 'no-store' }); return r.ok; } catch { return null; } }

  // Lo que hay ahora mismo en la web
  async function foto(anterior) {
    const f = { t: Date.now(), enlaces: [], regiones: [], sprites: {}, chunks: [], pistasCodigo: {}, rutasCodigo: [] };
    const htmls = {};
    for (const p of PAGINAS) { htmls[p] = await pedir(p); await sleep(400); }
    const todo = PAGINAS.map(p => texto(htmls[p])).join('\n');
    f.buildId = (todo.match(/"buildId":"([^"]+)"/) || [])[1] || null;
    // enlaces del menú (las secciones)
    if (htmls['/menu']) {
      const d = new DOMParser().parseFromString(htmls['/menu'], 'text/html');
      f.enlaces = [...new Set([...d.querySelectorAll('main a[href^="/"]')].map(a => a.getAttribute('href').replace(/[?#].*$/, '')).filter(h => h.length > 1))].sort();
    }
    // Pokédex: especies y total
    const dx = texto(htmls['/pokedex']);
    const nums = [...dx.matchAll(/"(?:numero|num|dex|id)":(\d{1,4})\b/g)].map(m => +m[1]);
    f.dexMax = nums.length ? Math.max(...nums) : null;
    const tot = dx.replace(/<!-- -->/g, '').match(/(\d+)\s*de\s*(\d+)\s*en total/);
    f.dexTotal = tot ? +tot[2] : null;
    // regiones: en la página de Regiones y en los filtros de la Pokédex
    const regs = new Set();
    for (const m of texto(htmls['/johto']).matchAll(/(?:Volver a|Viajar a|Cruzar a|Ir a)\s+([A-ZÁÉÍÓÚ][a-záéíóúñ]+)/g)) regs.add(m[1]);
    for (const m of texto(htmls['/johto']).matchAll(/Est[aá]s en(?:<[^>]*>|\s)*([A-ZÁÉÍÓÚ][a-záéíóúñ]+)/g)) regs.add(m[1]);
    for (const m of dx.replace(/<!-- -->/g, '').matchAll(/>\s*([A-ZÁÉÍÓÚ][a-záéíóúñ]+)\s*<[^>]*>\s*\d+\s*\/\s*\d+\s*</g)) if (m[1] !== 'Todas') regs.add(m[1]);
    f.regiones = [...regs].sort();
    // dibujos de generaciones nuevas
    for (const [n, g] of SPRITES) f.sprites[g] = await existe('/sprites/' + n + '.png');
    // código de la web: los ficheros que cargan estas páginas; solo se leen los que no se habían leído
    const urls = [...new Set([...todo.matchAll(/\/_next\/static\/chunks\/[^"'\\ ]+?\.js/g)].map(m => m[0]))];
    f.chunks = urls;
    const leidos = new Set(anterior ? anterior.chunks : []);
    f.pistasCodigo = { ...(anterior ? anterior.pistasCodigo : {}) };
    const rutas = new Set(anterior ? anterior.rutasCodigo : []);
    for (const u of urls) {
      if (leidos.has(u)) continue;
      const js = await pedir(u); await sleep(250);
      if (!js) continue;
      for (const p of NUEVOS) for (const nom of p.nombres) {
        if (nom.length < 4) continue;
        const re = new RegExp('["\'\`]' + nom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '["\'\`]');
        if (re.test(js)) { const k = '#' + p.n + ' ' + p.nombres[0]; if (!f.pistasCodigo[k]) f.pistasCodigo[k] = u.replace(/.*\//, ''); }
      }
      for (const r of REGIONES_NUEVAS) if (new RegExp('\\b' + r + '\\b').test(js)) { const k = 'Región ' + r; if (!f.pistasCodigo[k]) f.pistasCodigo[k] = u.replace(/.*\//, ''); }
      // rutas de secciones que usa el código (href:"/algo", push("/algo"))
      for (const m of js.matchAll(/(?:href:|push\(|replace\(|router\.push\()\s*"(\/[a-z][a-z0-9-]{2,30})"/g)) rutas.add(m[1]);
    }
    f.rutasCodigo = [...rutas].sort();
    return f;
  }

  // Lo que ha cambiado desde la última vez
  function diferencias(a, b) {
    const out = [], nuevo = (x, y) => (y || []).filter(v => !(x || []).includes(v));
    if (a.buildId && b.buildId && a.buildId !== b.buildId) out.push({ tipo: 'web', texto: '🔧 La web se ha actualizado (versión nueva). Miro qué trae…' });
    for (const e of nuevo(a.enlaces, b.enlaces)) out.push({ tipo: 'seccion', texto: `🆕 Sección nueva en el menú: ${e}`, href: e });
    for (const r of nuevo(a.regiones, b.regiones)) out.push({ tipo: 'region', texto: `🗺️ Región nueva: ${r}` });
    if (a.dexMax && b.dexMax && b.dexMax > a.dexMax) out.push({ tipo: 'dex', texto: `📕 La Pokédex llega ahora hasta el #${b.dexMax} (antes #${a.dexMax}): ${b.dexMax - a.dexMax} especies nuevas` });
    else if (a.dexTotal && b.dexTotal && b.dexTotal !== a.dexTotal) out.push({ tipo: 'dex', texto: `📕 La Pokédex tiene ahora ${b.dexTotal} especies (antes ${a.dexTotal})` });
    for (const [g, si] of Object.entries(b.sprites || {})) if (si && !(a.sprites || {})[g]) out.push({ tipo: 'sprites', texto: `🎨 Ya están subidos los dibujos de la ${g}.ª generación (p. ej. /sprites/${SPRITES.find(x => x[1] == g)[0]}.png)` });
    const pistasNuevas = Object.keys(b.pistasCodigo || {}).filter(k => !(k in (a.pistasCodigo || {})));
    const pok = pistasNuevas.filter(k => k.startsWith('#')), reg = pistasNuevas.filter(k => k.startsWith('Región'));
    if (pok.length) {
      const porGen = {};
      for (const k of pok) { const g = GEN_DE(+k.slice(1).split(' ')[0]); (porGen[g] = porGen[g] || []).push(k.replace(/^#\d+\s*/, '')); }
      for (const [g, l] of Object.entries(porGen)) out.push({ tipo: 'codigo', texto: `🧬 El código de la web ya menciona Pokémon de la ${g}.ª generación: ${l.slice(0, 8).join(', ')}${l.length > 8 ? ` y ${l.length - 8} más` : ''}` });
    }
    for (const k of reg) out.push({ tipo: 'codigo', texto: `🧬 El código de la web menciona la ${k.toLowerCase()}` });
    for (const r of nuevo(a.rutasCodigo, b.rutasCodigo)) if (!(b.enlaces || []).includes(r)) out.push({ tipo: 'ruta', texto: `🔗 El código usa una sección que no está en el menú: ${r}`, href: r });
    return out;
  }

  let mirando = false;
  async function mirar(aMano = false) {
    if (mirando) return;
    mirando = true; pintar();
    try {
      const antes = lsGet(LS_FOTO, null);
      const ahora = await foto(antes);
      if (!antes) {
        lsPut(LS_FOTO, ahora);
        apuntar([{ tipo: 'inicio', texto: `📸 Primera foto de la web: ${ahora.enlaces.length} secciones, regiones ${ahora.regiones.join(', ') || '?'}, Pokédex hasta el #${ahora.dexMax || '?'}. A partir de ahora te aviso de lo nuevo.` }], false);
      } else {
        const d = diferencias(antes, ahora);
        lsPut(LS_FOTO, ahora);
        if (d.length) apuntar(d, true);
        else if (aMano) aviso('Sin novedades: todo sigue igual que la última vez.', false);
      }
      lsPut(LS_T, Date.now());
    } finally { mirando = false; pintar(); }
  }
  function apuntar(lista, avisar) {
    const l = lsGet(LS_NOV, []);
    const t = Date.now();
    l.unshift(...lista.map(x => ({ ...x, t, nueva: avisar })));
    lsPut(LS_NOV, l.slice(0, 80));
    if (avisar) aviso(lista.map(x => x.texto).join('\n'), true);
    pintar();
  }

  // Aviso arriba (y en el móvil, si das permiso, una notificación)
  function aviso(txt, importante) {
    let el = document.getElementById('axn-aviso');
    if (!el) { el = document.createElement('div'); el.id = 'axn-aviso'; el.setAttribute('data-ax-ignore', ''); document.body.appendChild(el); }
    el.style.cssText = 'position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:2147483647;max-width:min(92vw,420px);padding:12px 14px;border-radius:16px;font:700 13px/1.4 system-ui,sans-serif;white-space:pre-line;box-shadow:0 14px 30px -12px rgba(0,0,0,.6);cursor:pointer;' + (importante ? 'background:#7C5CFF;color:#fff' : 'background:#262A24;color:#F0F3EA');
    el.textContent = (importante ? '🆕 Novedades en Aurora Dex\n' : '') + txt;
    el.onclick = () => el.remove();
    clearTimeout(el._t); el._t = setTimeout(() => el.remove(), importante ? 20000 : 5000);
    try { if (importante && document.hidden && 'Notification' in window && Notification.permission === 'granted') new Notification('🆕 Novedades en Aurora Dex', { body: txt.slice(0, 200) }); } catch { /* nada */ }
  }

  // Panel arriba del Menú, con las clases del propio juego
  function pintar() {
    const p = document.getElementById(PANEL_ID);
    if (!p) return;
    const l = lsGet(LS_NOV, []), ult = lsGet(LS_T, 0);
    const hora = t => new Date(t).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    const nuevas = l.filter(x => x.nueva).length;
    p.querySelector('.axn-sub').textContent = mirando ? 'Mirando la web…' : ult ? `Mirado ${hora(ult)} · vuelvo a mirar cada 3 h` : 'Aún sin mirar';
    p.querySelector('.axn-n').textContent = nuevas ? String(nuevas) : '';
    p.querySelector('.axn-n').style.display = nuevas ? '' : 'none';
    p.querySelector('.axn-mirar').disabled = mirando;
    const out = p.querySelector('.axn-lista');
    const html = l.length ? l.slice(0, 12).map(x => `<li style="padding:6px 0;border-top:1px dashed rgba(127,127,127,.25);${x.nueva ? 'font-weight:800' : 'opacity:.75'}"><span style="display:block;font-size:10px;opacity:.6">${hora(x.t)}</span>${x.href ? `<a href="${esc(x.href)}" style="text-decoration:underline">${esc(x.texto)}</a>` : esc(x.texto)}</li>`).join('') : '<li style="opacity:.7">Nada todavía.</li>';
    if (out.dataset.h !== html) { out.dataset.h = html; out.innerHTML = html; }
  }
  function montar() {
    if (location.pathname.replace(/\/+$/, '') !== '/menu' || document.getElementById(PANEL_ID)) return;
    const main = document.querySelector('main');
    const ancla = main && (main.querySelector('section') || main.firstElementChild);
    if (!ancla) return;
    const p = document.createElement('section');
    p.id = PANEL_ID; p.className = 'tarjeta space-y-2 p-4'; p.setAttribute('data-ax-ignore', '');
    p.innerHTML = `<div style="display:flex;align-items:center;gap:8px">
        <h2 class="font-display text-lg font-extrabold" style="flex:1;margin:0">🆕 Novedades <span class="axn-n pastilla border-2 border-rojo-500 bg-rojo-500 text-white" style="font-size:11px;padding:0 7px"></span></h2>
        <button type="button" class="axn-mirar pastilla border-2 border-lienzo bg-lienzo text-tinta-500 shadow-suave" style="padding:4px 10px">🔎 Mirar ahora</button></div>
      <p class="axn-sub text-xs font-bold text-tinta-400" style="margin:0"></p>
      <ul class="axn-lista text-sm" style="list-style:none;margin:0;padding:0"></ul>`;
    p.querySelector('.axn-mirar').addEventListener('click', () => mirar(true));
    // al verlas, dejan de contar como nuevas
    p.addEventListener('click', e => { if (e.target.closest('.axn-mirar')) return; const l = lsGet(LS_NOV, []); if (l.some(x => x.nueva)) { l.forEach(x => { x.nueva = false; }); lsPut(LS_NOV, l); pintar(); } });
    ancla.insertAdjacentElement('beforebegin', p);
    pintar();
  }

  function tick() {
    montar();
    if (!mirando && Date.now() - lsGet(LS_T, 0) > CADA) mirar(false);
  }
  setTimeout(() => { tick(); setInterval(tick, 5000); }, 4000);
  window.__axNovedades = { mirar, foto, diferencias };
})();
