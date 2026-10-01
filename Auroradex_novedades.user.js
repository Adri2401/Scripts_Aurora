// ==UserScript==
// @name         Aurora Dex · Novedades
// @namespace    auroradex-novedades
// @version      2.1.2
// @description  Lee la web entera (todas sus secciones, todo su código y los datos que manda el servidor) y te enseña lo nuevo y lo oculto: textos nuevos en cada sección, secciones que no están en el menú, lo que está «en pruebas» (solo lo ven las cuentas de prueba), cosas nuevas en tiendas y catálogos, imágenes nuevas (se ven), regiones, especies y dibujos de generaciones nuevas, y un buscador por todo el código. Mira cada 30 min si la web ha cambiado y la repasa entera al cambiar (y cada 12 h). Todo en «🆕 Novedades», arriba del Menú. Nunca abre Voltorb Flip, Ruinas Alfa ni el Suelo Helado.
// @match        https://auroradex.es/*
// @match        https://www.auroradex.es/*
// @updateURL    https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_novedades.user.js
// @downloadURL  https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_novedades.user.js
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  'use strict';
  const pl = (n, uno, varios) => (n === 1 ? uno : varios);   // singular / plural
  // Solo en la pestaña (no en las ventanas ocultas de los robots)
  try { if (window.top !== window) return; } catch { return; }

  const VERSION = '2.1.2';
  const PANEL_ID = 'axn-panel', VISOR_ID = 'axn-visor';
  const LS_NOV = 'axn2-cambios', LS_T = 'axn2-mirado', LS_REPASO = 'axn2-repaso', LS_BUILD = 'axn2-build', LS_MENU = 'axn2-menu';
  const CADA_RAPIDO = 30 * 60e3, CADA_REPASO = 12 * 3600e3;
  // Nunca se abren (norma de estos scripts)
  const PROHIBIDAS = /^\/(trigal|ruinas|hielo)(\/|$)/;
  const BASE = ['/menu', '/mapa', '/pokedex', '/johto', '/equipo'];
  // una sección del juego: una sola parte (/algo) y nada de páginas de jugadores ni de salir/entrar
  const esSeccion = r => /^\/[a-z0-9-]+$/.test(r) && !PROHIBIDAS.test(r) && !/^\/(jugador|perfil|signout|signin|salir|logout|entrar|error)$/.test(r);
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } };
  const lsPut = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* lleno */ } };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const hora = t => new Date(t).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  /* ── Almacén (IndexedDB: cabe todo el inventario de la web) ── */
  let dbP = null;
  function db() {
    if (!dbP) dbP = new Promise((ok, mal) => {
      const r = indexedDB.open('axn-novedades', 1);
      r.onupgradeneeded = () => { const d = r.result; d.createObjectStore('chunks'); d.createObjectStore('kv'); };
      r.onsuccess = () => ok(r.result); r.onerror = () => mal(r.error);
    });
    return dbP;
  }
  async function dbGet(store, k) { const d = await db(); return new Promise((ok, mal) => { const q = d.transaction(store).objectStore(store).get(k); q.onsuccess = () => ok(q.result); q.onerror = () => mal(q.error); }); }
  async function dbPut(store, k, v) { const d = await db(); return new Promise((ok, mal) => { const t = d.transaction(store, 'readwrite'); t.objectStore(store).put(v, k); t.oncomplete = () => ok(); t.onerror = () => mal(t.error); }); }

  /* ── Pokémon de la 6.ª generación en adelante (#650…#1025) ── */
  const GEN_DATOS = 'Chespin|Quilladin|Chesnaught|Fennekin|Braixen|Delphox|Froakie|Frogadier|Greninja|Bunnelby|Diggersby|Fletchling|Fletchinder|Talonflame|Scatterbug|Spewpa|Vivillon|Litleo|Pyroar|Flabébé|Floette|Florges|Skiddo|Gogoat|Pancham|Pangoro|Furfrou|Espurr|Meowstic|Honedge|Doublade|Aegislash|Spritzee|Aromatisse|Swirlix|Slurpuff|Inkay|Malamar|Binacle|Barbaracle|Skrelp|Dragalge|Clauncher|Clawitzer|Helioptile|Heliolisk|Tyrunt|Tyrantrum|Amaura|Aurorus|Sylveon|Hawlucha|Dedenne|Carbink|Goomy|Sliggoo|Goodra|Klefki|Phantump|Trevenant|Pumpkaboo|Gourgeist|Bergmite|Avalugg|Noibat|Noivern|Xerneas|Yveltal|Zygarde|Diancie|Hoopa|Volcanion|Rowlet|Dartrix|Decidueye|Litten|Torracat|Incineroar|Popplio|Brionne|Primarina|Pikipek|Trumbeak|Toucannon|Yungoos|Gumshoos|Grubbin|Charjabug|Vikavolt|Crabrawler|Crabominable|Oricorio|Cutiefly|Ribombee|Rockruff|Lycanroc|Wishiwashi|Mareanie|Toxapex|Mudbray|Mudsdale|Dewpider|Araquanid|Fomantis|Lurantis|Morelull|Shiinotic|Salandit|Salazzle|Stufful|Bewear|Bounsweet|Steenee|Tsareena|Comfey|Oranguru|Passimian|Wimpod|Golisopod|Sandygast|Palossand|Pyukumuku|Código Cero/Type: Null|Silvally|Minior|Komala|Turtonator|Togedemaru|Mimikyu|Bruxish|Drampa|Dhelmise|Jangmo-o|Hakamo-o|Kommo-o|Tapu Koko|Tapu Lele|Tapu Bulu|Tapu Fini|Cosmog|Cosmoem|Solgaleo|Lunala|Nihilego|Buzzwole|Pheromosa|Xurkitree|Celesteela|Kartana|Guzzlord|Necrozma|Magearna|Marshadow|Poipole|Naganadel|Stakataka|Blacephalon|Zeraora|Meltan|Melmetal|Grookey|Thwackey|Rillaboom|Scorbunny|Raboot|Cinderace|Sobble|Drizzile|Inteleon|Skwovet|Greedent|Rookidee|Corvisquire|Corviknight|Blipbug|Dottler|Orbeetle|Nickit|Thievul|Gossifleur|Eldegoss|Wooloo|Dubwool|Chewtle|Drednaw|Yamper|Boltund|Rolycoly|Carkol|Coalossal|Applin|Flapple|Appletun|Silicobra|Sandaconda|Cramorant|Arrokuda|Barraskewda|Toxel|Toxtricity|Sizzlipede|Centiskorch|Clobbopus|Grapploct|Sinistea|Polteageist|Hatenna|Hattrem|Hatterene|Impidimp|Morgrem|Grimmsnarl|Obstagoon|Perrserker|Cursola|Sirfetch’d|Mr. Rime|Runerigus|Milcery|Alcremie|Falinks|Pincurchin|Snom|Frosmoth|Stonjourner|Eiscue|Indeedee|Morpeko|Cufant|Copperajah|Dracozolt|Arctozolt|Dracovish|Arctovish|Duraludon|Dreepy|Drakloak|Dragapult|Zacian|Zamazenta|Eternatus|Kubfu|Urshifu|Zarude|Regieleki|Regidrago|Glastrier|Spectrier|Calyrex|Wyrdeer|Kleavor|Ursaluna|Basculegion|Sneasler|Overqwil|Enamorus|Sprigatito|Floragato|Meowscarada|Fuecoco|Crocalor|Skeledirge|Quaxly|Quaxwell|Quaquaval|Lechonk|Oinkologne|Tarountula|Spidops|Nymble|Lokix|Pawmi|Pawmo|Pawmot|Tandemaus|Maushold|Fidough|Dachsbun|Smoliv|Dolliv|Arboliva|Squawkabilly|Nacli|Naclstack|Garganacl|Charcadet|Armarouge|Ceruledge|Tadbulb|Bellibolt|Wattrel|Kilowattrel|Maschiff|Mabosstiff|Shroodle|Grafaiai|Bramblin|Brambleghast|Toedscool|Toedscruel|Klawf|Capsakid|Scovillain|Rellor|Rabsca|Flittle|Espathra|Tinkatink|Tinkatuff|Tinkaton|Wiglett|Wugtrio|Bombirdier|Finizen|Palafin|Varoom|Revavroom|Cyclizar|Orthworm|Glimmet|Glimmora|Greavard|Houndstone|Flamigo|Cetoddle|Cetitan|Veluza|Dondozo|Tatsugiri|Annihilape|Clodsire|Farigiraf|Dudunsparce|Kingambit|Colmilargo/Great Tusk|Colagrito/Scream Tail|Furioseta/Brute Bonnet|Melenaleteo/Flutter Mane|Reptalada/Slither Wing|Pelarena/Sandy Shocks|Ferrodada/Iron Treads|Ferrosaco/Iron Bundle|Ferropalmas/Iron Hands|Ferrocuello/Iron Jugulis|Ferropolilla/Iron Moth|Ferropúas/Iron Thorns|Frigibax|Arctibax|Baxcalibur|Gimmighoul|Gholdengo|Wo-Chien|Chien-Pao|Ting-Lu|Chi-Yu|Bramaluna/Roaring Moon|Ferropaladín/Iron Valiant|Koraidon|Miraidon|Ondulagua/Walking Wake|Ferroverdor/Iron Leaves|Dipplin|Poltchageist|Sinistcha|Okidogi|Munkidori|Fezandipiti|Ogerpon|Archaludon|Hydrapple|Flamariete/Gouging Fire|Electrofuria/Raging Bolt|Ferromole/Iron Boulder|Ferrotesta/Iron Crown|Terapagos|Pecharunt';
  const NUEVOS = GEN_DATOS.split('|').map((s, i) => ({ n: 650 + i, nombres: s.split('/') }));
  const GEN_DE = n => n <= 721 ? 6 : n <= 809 ? 7 : n <= 905 ? 8 : 9;
  const REGIONES_NUEVAS = ['Kalos', 'Alola', 'Galar', 'Hisui', 'Paldea', 'Kitakami'];
  const SPRITES = [[650, 6], [722, 7], [810, 8], [906, 9]];

  /* ── Leer el código: textos, rutas, imágenes ── */
  const desescapar = s => s.replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/\\u([dD][89abAB][0-9a-fA-F]{2})\\u([dD][c-fC-F][0-9a-fA-F]{2})/g, (_, a, b) => String.fromCharCode(parseInt(a, 16), parseInt(b, 16)))
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\x([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\n/g, ' ').replace(/\\(["'\\])/g, '$1');
  const esClases = s => { const t = s.split(/\s+/); return t.every(x => /^[a-zA-Z0-9!:\-[\]/.#%_()&>~*+=,]+$/.test(x)) && t.some(x => /[-:]/.test(x)); };
  const esCodigo = s => /=>|&&|\|\||==|[;{}]|\(\)|\.concat\(|\b(function|return|void 0|let|var|const|case|break|continue|typeof|use strict)\b|^\s*[.#]?[a-z]+\([^)]*\)$/.test(s);
  // Todas las cadenas del código, leídas carácter a carácter (sin descuadrarse con comillas dentro de expresiones
  // regulares, comentarios o plantillas `…${x}…`)
  function cadenas(js) {
    const out = [], n = js.length;
    let i = 0, prev = '';
    while (i < n) {
      const ch = js[i];
      if (ch === '"' || ch === "'" || ch === '`') {
        let j = i + 1, buf = '';
        while (j < n && js[j] !== ch) {
          if (js[j] === '\\') { buf += js[j] + (js[j + 1] || ''); j += 2; continue; }
          if (ch === '`' && js[j] === '$' && js[j + 1] === '{') {
            let hondo = 1; j += 2;
            while (j < n && hondo) { if (js[j] === '{') hondo++; else if (js[j] === '}') hondo--; j++; }
            buf += '\u0000'; continue;
          }
          if (ch !== '`' && js[j] === '\n') break;
          buf += js[j]; j++;
        }
        out.push(buf); i = j + 1; prev = 'a'; continue;
      }
      if (ch === '/') {
        const nx = js[i + 1];
        if (nx === '/') { const e = js.indexOf('\n', i); i = e < 0 ? n : e; continue; }
        if (nx === '*') { const e = js.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; continue; }
        if (!prev || /[(,=:[!&|?{};+\-*%<>~^]/.test(prev) || /(?:^|[^\w$])(return|typeof|case|in|of|void|delete)\s*$/.test(js.slice(Math.max(0, i - 8), i))) {
          let j = i + 1, clase = false;
          while (j < n) { const c = js[j]; if (c === '\\') { j += 2; continue; } if (c === '[') clase = true; else if (c === ']') clase = false; else if ((c === '/' && !clase) || c === '\n') break; j++; }
          i = j + 1; while (i < n && /[a-z]/.test(js[i])) i++; prev = 'a'; continue;
        }
      }
      if (ch > ' ') prev = ch;
      i++;
    }
    return out;
  }
  function textosDe(js) {
    const out = new Set();
    for (const c of cadenas(js)) for (const trozo of c.split('\u0000')) {
      if (trozo.length < 3 || trozo.length > 700) continue;
      const s = desescapar(trozo).trim();
      if (s.length < 4 || !/\p{L}{3}/u.test(s)) continue;
      if (!/\s/.test(s) && !/^[\p{Lu}\p{Extended_Pictographic}¡¿«]/u.test(s)) continue;   // una palabra suelta en minúscula: suele ser código
      if (esClases(s) || esCodigo(s) || /^(https?:|\/|data:|#[0-9a-f]{3,8}$)/i.test(s)) continue;
      if (/="|rgba?\(|\d(px|rem|ms)\b|^Error |^[\d\s.,%()#-]+$/.test(s)) continue;            // CSS, SVG y mensajes internos
      out.add(s);
    }
    return [...out];
  }
  function rutasDe(js) {
    const out = new Set();
    for (const m of js.matchAll(/["'`](\/[a-z][a-z0-9-]*(?:\/[a-z0-9-]+)*)(?:[?#][^"'`]*)?["'`]/g)) {
      const s = m[1];
      if (/^\/(api|_next|sprites|items|mapa\/|personajes|icons?|iconos|fonts|img|imagenes|avatares|marcos|burbujas|sonidos|musica|a\/)/.test(s) || /\.[a-z0-9]{2,4}$/.test(s)) continue;
      out.add(s);
    }
    return [...out];
  }
  function imagenesDe(js) {
    const out = new Set();
    for (const m of js.matchAll(/["'`](\/[a-z0-9_\-/.]+\.(?:png|jpe?g|webp|svg|gif))["'`]/gi)) out.add(m[1]);
    for (const m of js.matchAll(/["'`](\/(?:items|personajes|mapa|marcos|burbujas|avatares|iconos|img)\/[a-z0-9_\-/]*)["'`]/gi)) out.add(m[1] + '…');
    return [...out];
  }
  const EN_PRUEBAS = /en pruebas|solo lo ves t[uú]|solo la ves t[uú]|banco de pruebas|no est[aá] publicad|antes de que le toque a nadie|todav[ií]a no est[aá] abiert|a[uú]n no est[aá] abiert|los jugadores no tienen acceso|pr[oó]ximamente|muy pronto|en construcci[oó]n|\(beta\)|\bbeta\b|modo prueba|solo admin|cuenta de pruebas|se salta las medallas/i;
  const paginaDeChunk = u => { const m = u.match(/app\/(.*)\/(?:page|layout)-/); return m ? '/' + m[1].replace(/\([^)]*\)\/?/g, '').replace(/\/$/, '') || '(común)' : '(compartido)'; };
  async function analizarChunk(u) {
    const c = await dbGet('chunks', u).catch(() => null);
    if (c) return c;
    let js = null;
    try { const r = await fetch(u); if (r.ok) js = await r.text(); } catch { /* sin red */ }
    if (js == null) return null;
    const pistas = {};
    for (const p of NUEVOS) for (const nom of p.nombres) {
      if (nom.length < 4) continue;
      if (new RegExp('["\'`]' + nom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '["\'`]').test(js)) pistas['#' + p.n + ' ' + p.nombres[0]] = 1;
    }
    for (const r of REGIONES_NUEVAS) if (new RegExp('\\b' + r + '\\b').test(js)) pistas['Región ' + r] = 1;
    const res = { u, pagina: paginaDeChunk(u), textos: textosDe(js), rutas: rutasDe(js), imagenes: imagenesDe(js), pistas: Object.keys(pistas), bytes: js.length, t: Date.now() };
    await dbPut('chunks', u, res).catch(() => {});
    return res;
  }

  /* ── Qué datos del servidor son del JUEGO y cuáles del JUGADOR ──
   * En /base, /album, /mapa o /equipo vienen TUS cosas (tus Pokémon, tus objetos, tus muñecos): cambian cuando juegas,
   * no cuando el admin añade algo. Tampoco cuentan los ids de Pokémon concretos («pkm:cmu…») ni las subastas, que rotan. */
  const PAGINAS_TUYAS = /^\/(base|album|mapa|equipo|perfil|jugador|subasta|trueques|chat|mercadillo|amigos|ranking|clasificacion|liga|tren|carreras|jefe)(\/|$)/;   // (tren, carreras y jefe: lo de cada día)
  const idTuyo = id => /^(pkm|mon|poke|item|inv)[:_]/i.test(id) || /[a-z0-9]{20,}/i.test(id);   // (un cuid son 25 letras y números seguidos)
  const catDelJuego = (k) => { const [p, id] = k.split('|'); return !PAGINAS_TUYAS.test(p) && !idTuyo(id); };

  /* ── Leer los datos del servidor de cada página (lo que viene en la propia página) ── */
  const volcado = h => { const partes = []; for (const m of String(h || '').matchAll(/self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g)) partes.push(m[1]); return desescapar(partes.join('')).replace(/\\"/g, '"'); };
  // objetos de catálogo (con un id legible y nombre o título), marcas de «en pruebas» y cosas con fecha de salida futura
  function datosDe(txt, pagina) {
    const cat = {}, flags = [], futuras = [];
    const ahora = Date.now();
    for (const m of txt.matchAll(/\{"id":"([a-z0-9][a-z0-9_:-]{2,60})"([^{}]{0,1500})\}/g)) {
      const id = m[1], cuerpo = m[2];
      if (/^c[a-z0-9]{20,}$/.test(id)) continue;                          // ids de jugadores, ofertas…
      const nom = (cuerpo.match(/"(?:nombre|titulo|name)":"([^"]{1,120})"/) || [])[1];
      if (nom) cat[pagina + '|' + id] = nom;
      if (/"(enPruebas|oculto|oculta|beta|borrador|soloAdmin|soloPruebas)":true|"(visible|publicad[ao])":false/.test(cuerpo)) flags.push({ pagina, id, nombre: nom || id, marca: (cuerpo.match(/"(enPruebas|oculto|oculta|beta|borrador|soloAdmin|soloPruebas)":true|"(visible|publicad[ao])":false/) || [''])[0] });
      for (const f of cuerpo.matchAll(/"(inicio|empieza|abre|desde|lanzamiento|publica(?:do|cion)?(?:En)?|disponibleDesde|fechaInicio|salida)":"(\d{4}-\d\d-\d\dT[^"]+)"/g)) { const t = Date.parse(f[2]); if (t > ahora + 60e3) futuras.push({ pagina, id, nombre: nom || id, campo: f[1], t }); }
    }
    for (const m of txt.matchAll(/"(enPruebas|soloPruebas|soloAdmin)":true/g)) if (!flags.some(f => f.pagina === pagina)) flags.push({ pagina, id: '', nombre: '(la página)', marca: m[0] });
    return { cat, flags, futuras };
  }

  /* ── El repaso entero ── */
  let estado = { mirando: false, paso: '', hechas: 0, total: 0 };
  async function repaso(motivo) {
    if (estado.mirando) return;
    estado = { mirando: true, paso: 'Leyendo el menú…', hechas: 0, total: 0 };
    pintar();
    try {
      const rutas = new Map();                      // ruta → { estado, redirige }
      const cola = [...BASE];
      const vistas = new Set();
      const chunks = new Set();
      const cat = {}, flags = [], futuras = [];
      let menu = [], buildId = null;
      while (cola.length) {
        const r = cola.shift();
        if (vistas.has(r) || PROHIBIDAS.test(r) || vistas.size > 140) continue;
        vistas.add(r);
        estado.paso = `Leyendo ${r}…`; estado.hechas = vistas.size; estado.total = vistas.size + cola.length; pintar();
        let res, h = '';
        try { res = await fetch(r, { credentials: 'include' }); h = await res.text(); } catch { continue; }
        const final = new URL(res.url).pathname;
        rutas.set(r, { st: res.status, redirige: final !== r ? final : '' });
        const t = h.replace(/\\"/g, '"');
        if (!buildId) buildId = (t.match(/"buildId":"([^"]+)"/) || [])[1] || null;
        for (const m of t.matchAll(/\/?_next\/static\/chunks\/[^"'\\ ]+?\.js/g)) chunks.add('/' + m[0].replace(/^\//, ''));
        // las secciones a las que enlaza cada página
        const d = new DOMParser().parseFromString(h, 'text/html');
        const enl = [...new Set([...d.querySelectorAll('a[href^="/"]')].map(a => a.getAttribute('href').replace(/[?#].*$/, '')).filter(x => x.length > 1))];
        if (r === '/menu') menu = enl.slice().sort();
        for (const e of enl) if (esSeccion(e) && !vistas.has(e) && !cola.includes(e)) cola.push(e);
        // datos del servidor (nunca de las páginas de otros jugadores: chat, trueques, subastas…)
        if (!/^\/(chat|trueques|subastas|mercadillo|ranking|clasificacion|liga|perfil|jugador|amigos)/.test(r) && res.ok) {
          const dd = datosDe(volcado(h), r);
          Object.assign(cat, dd.cat); flags.push(...dd.flags); futuras.push(...dd.futuras);
        }
        await sleep(250);
      }
      // el código de todas las páginas (solo se descarga lo que no se tenía)
      const porChunk = [];
      let n = 0;
      for (const u of chunks) {
        estado.paso = `Leyendo el código (${++n}/${chunks.size})…`; pintar();
        const c = await analizarChunk(u);
        if (c) porChunk.push(c);
      }
      // las rutas que usa el código y aún no se han visto: se miran también (solo si responden como página)
      const extra = [...new Set(porChunk.flatMap(c => c.rutas))].filter(r => esSeccion(r) && !vistas.has(r)).slice(0, 40);
      for (const r of extra) {
        estado.paso = `Probando ${r}…`; pintar();
        try { const res = await fetch(r, { credentials: 'include' }); rutas.set(r, { st: res.status, redirige: new URL(res.url).pathname !== r ? new URL(res.url).pathname : '', soloCodigo: true }); } catch { /* nada */ }
        await sleep(250);
      }
      // Pokédex, regiones y dibujos
      estado.paso = 'Mirando la Pokédex y los dibujos…'; pintar();
      const dx = volcado(await (await fetch('/pokedex')).text().catch(() => ''));
      const nums = [...dx.matchAll(/"(?:numero|num|dex|id)":(\d{1,4})\b/g)].map(m => +m[1]);
      const sprites = {};
      for (const [num, g] of SPRITES) { try { sprites[g] = (await fetch('/sprites/' + num + '.png', { method: 'HEAD', cache: 'no-store' })).ok; } catch { sprites[g] = null; } }
      const jh = await (await fetch('/johto')).text().catch(() => '');
      const regiones = [...new Set([...jh.matchAll(/(?:Volver a|Viajar a|Cruzar a|Ir a)\s+([A-ZÁÉÍÓÚ][a-záéíóúñ]+)/g)].map(m => m[1]).concat([...jh.replace(/<[^>]*>/g, ' ').matchAll(/Est[aá]s en\s+([A-ZÁÉÍÓÚ][a-záéíóúñ]+)/g)].map(m => m[1])))].sort();

      // inventario
      const textos = {};                                     // texto → páginas
      for (const c of porChunk) for (const s of c.textos) (textos[s] = textos[s] || new Set()).add(c.pagina);
      const inv = {
        t: Date.now(), buildId, menu,
        rutas: Object.fromEntries(rutas),
        textos: Object.fromEntries(Object.entries(textos).map(([k, v]) => [k, [...v]])),
        imagenes: [...new Set(porChunk.flatMap(c => c.imagenes))].sort(),
        pistas: [...new Set(porChunk.flatMap(c => c.pistas))].sort(),
        cat, flags, futuras,
        dexMax: nums.length ? Math.max(...nums) : null, sprites, regiones,
        chunks: [...chunks], bytes: porChunk.reduce((a, c) => a + c.bytes, 0),
      };
      inv.paginasDatos = paginasConDatos(cat);
      const antes = await dbGet('kv', 'inventario').catch(() => null);
      // todo lo visto alguna vez (si aún no hay memoria, se parte de la lectura anterior)
      const visto = (await dbGet('kv', 'visto').catch(() => null)) || (antes ? vistoDe(antes) : null);
      await dbPut('kv', 'inventario', inv);
      lsPut(LS_BUILD, buildId); lsPut(LS_MENU, menu); lsPut(LS_REPASO, Date.now()); lsPut(LS_T, Date.now());
      if (!antes) apuntar({ primera: true, t: Date.now(), motivo, resumen: resumenInicial(inv) }, false);
      else {
        const d = comparar(antes, inv, visto);
        if (d.total) apuntar({ t: Date.now(), motivo, ...d }, true);
      }
      await dbPut('kv', 'visto', vistoDe(inv, visto));
    } finally { estado = { mirando: false }; pintar(); }
  }
  function resumenInicial(inv) {
    const fuera = Object.entries(inv.rutas).filter(([r, x]) => !inv.menu.includes(r) && x.st === 200 && !x.redirige);
    const pruebas = Object.entries(inv.textos).filter(([s]) => EN_PRUEBAS.test(s));
    return `📸 Primera lectura completa: ${Object.keys(inv.rutas).length} secciones, ${inv.chunks.length} ficheros de código (${Math.round(inv.bytes / 1024)} KB), ${Object.keys(inv.textos).length} textos, ${Object.keys(inv.cat).length} cosas de catálogo. Ya hay ${pruebas.length} textos «en pruebas» y ${fuera.length} secciones que abren y no están en el menú: míralo en «🔎 Ver todo».`;
  }
  /* ── Memoria de todo lo visto alguna vez ──
   * Comparar solo con la última lectura daba falsas novedades: una página que ayer no se leyó y hoy sí (todo su texto,
   * todo su catálogo) parecía «nueva», aunque llevara meses en el juego. Ahora se guarda la unión de todas las lecturas
   * y solo es novedad lo que no se había visto NUNCA. Además:
   *  · el código solo cambia cuando la web se actualiza (cambia el buildId): con la misma versión, nada del código
   *    (textos, páginas, imágenes, pistas) puede ser nuevo; lo que sale es que antes no se había leído ese trozo;
   *  · el catálogo de una página que nunca se había leído se apunta en silencio (es ampliar lo que se mira);
   *  · lo del jugador (sus Pokémon, sus objetos) no cuenta. */
  const REGIONES_CONOCIDAS = ['Kanto', 'Johto', 'Hoenn', 'Sinnoh', 'Teselia'];
  const paginasConDatos = cat => [...new Set(Object.keys(cat || {}).map(k => k.split('|')[0]))];
  function vistoDe(inv, base) {
    const v = base || { textos: {}, rutas: {}, imagenes: {}, pistas: {}, cat: {}, flags: {}, futuras: {}, menu: {}, regiones: Object.fromEntries(REGIONES_CONOCIDAS.map(r => [r, 1])), sprites: {}, dexMax: 0, paginas: {} };
    for (const t of Object.keys(inv.textos || {})) v.textos[t] = 1;
    for (const r of Object.keys(inv.rutas || {})) v.rutas[r] = 1;
    for (const x of inv.imagenes || []) v.imagenes[x] = 1;
    for (const x of inv.pistas || []) v.pistas[x] = 1;
    for (const k of Object.keys(inv.cat || {})) v.cat[k] = inv.cat[k];
    for (const f of inv.flags || []) v.flags[f.pagina + '|' + f.id + '|' + f.marca] = 1;
    for (const f of inv.futuras || []) v.futuras[f.pagina + '|' + f.id + '|' + f.t] = 1;
    for (const m of inv.menu || []) v.menu[m] = 1;
    for (const r of inv.regiones || []) v.regiones[r] = 1;
    for (const [g, ok] of Object.entries(inv.sprites || {})) if (ok) v.sprites[g] = 1;
    if (inv.dexMax && inv.dexMax > v.dexMax) v.dexMax = inv.dexMax;
    for (const p of inv.paginasDatos || paginasConDatos(inv.cat)) v.paginas[p] = 1;
    return v;
  }
  // a: lectura anterior · b: la de ahora · v: todo lo visto alguna vez (sin esta lectura)
  function comparar(a, b, v) {
    v = v || vistoDe(a);
    const mismaWeb = !!(a.buildId && b.buildId && a.buildId === b.buildId);
    const d = { web: !!(a.buildId && b.buildId && a.buildId !== b.buildId) };
    const nuevos = (x, y) => Object.keys(y || {}).filter(k => !(k in (x || {})));
    d.secciones = (b.menu || []).filter(e => !v.menu[e]);
    d.rutas = mismaWeb ? [] : Object.keys(b.rutas || {}).filter(r => !v.rutas[r] && b.rutas[r].st === 200);
    d.textos = mismaWeb ? [] : Object.keys(b.textos || {}).filter(t => !v.textos[t]).map(s => ({ s, p: b.textos[s] }));
    d.quitados = mismaWeb ? 0 : nuevos(b.textos, a.textos).length;
    d.imagenes = mismaWeb ? [] : (b.imagenes || []).filter(x => !v.imagenes[x]);
    d.pistas = mismaWeb ? [] : (b.pistas || []).filter(x => !v.pistas[x]);
    const delJuego = k => catDelJuego(k) && v.paginas[k.split('|')[0]];
    d.catalogo = Object.keys(b.cat || {}).filter(k => delJuego(k) && !(k in v.cat)).map(k => ({ k, nombre: b.cat[k] }));
    if (mismaWeb && d.catalogo.length > 30) d.catalogo = [];      // decenas de golpe con la misma web: es que se ha leído más, no que haya algo nuevo
    d.cambiados = Object.keys(b.cat || {}).filter(k => delJuego(k) && k in v.cat && v.cat[k] !== b.cat[k]).map(k => ({ k, antes: v.cat[k], ahora: b.cat[k] }));
    d.flags = (b.flags || []).filter(f => !v.flags[f.pagina + '|' + f.id + '|' + f.marca]);
    d.futuras = (b.futuras || []).filter(f => !v.futuras[f.pagina + '|' + f.id + '|' + f.t]);
    d.regiones = (b.regiones || []).filter(x => !v.regiones[x]);
    d.dex = v.dexMax && b.dexMax && b.dexMax > v.dexMax ? { antes: v.dexMax, ahora: b.dexMax } : null;
    d.sprites = Object.keys(b.sprites || {}).filter(g => b.sprites[g] && !v.sprites[g]);
    d.total = (d.web ? 1 : 0) + d.secciones.length + d.rutas.length + d.textos.length + d.imagenes.length + d.catalogo.length + d.cambiados.length + d.flags.length + d.futuras.length + d.pistas.length + d.regiones.length + (d.dex ? 1 : 0) + d.sprites.length;
    return d;
  }
  function titularDe(c) {
    if (c.primera) return c.resumen;
    const p = [];
    if (c.web) p.push('🔧 web actualizada');
    if (c.secciones.length) p.push(`🆕 ${c.secciones.length} ${pl(c.secciones.length, 'sección nueva', 'secciones nuevas')} en el menú`);
    if (c.rutas.length) p.push(`🗺️ ${c.rutas.length} ${pl(c.rutas.length, 'página nueva', 'páginas nuevas')}`);
    if (c.flags.length) p.push(`🔧 ${c.flags.length} ${pl(c.flags.length, 'cosa', 'cosas')} en pruebas`);
    if (c.futuras.length) p.push(`⏰ ${c.futuras.length} ${pl(c.futuras.length, 'programada', 'programadas')}`);
    if (c.catalogo.length) p.push(`🛍️ ${c.catalogo.length} ${pl(c.catalogo.length, 'novedad', 'novedades')} en catálogos`);
    if (c.textos.length) p.push(`📝 ${c.textos.length} ${pl(c.textos.length, 'texto nuevo', 'textos nuevos')}`);
    if (c.imagenes.length) p.push(`🖼️ ${c.imagenes.length} ${pl(c.imagenes.length, 'imagen', 'imágenes')}`);
    if (c.pistas.length) p.push(`🧬 ${c.pistas.length} ${pl(c.pistas.length, 'pista', 'pistas')} de generaciones/regiones nuevas`);
    if (c.regiones.length) p.push(`🗺️ región: ${c.regiones.join(', ')}`);
    if (c.dex) p.push(`📕 Pokédex hasta el #${c.dex.ahora}`);
    if (c.sprites.length) p.push(`🎨 dibujos de la ${c.sprites.join(', ')}.ª gen.`);
    return p.join(' · ');
  }
  function apuntar(c, avisar) {
    const l = lsGet(LS_NOV, []);
    c.nueva = !!avisar;
    l.unshift(c);
    // (se guardan los últimos; los textos largos se recortan para que quepa)
    lsPut(LS_NOV, l.slice(0, 40).map(x => ({ ...x, textos: (x.textos || []).slice(0, 300) })));
    if (avisar) aviso(titularDe(c));
    pintar();
  }

  // Comprobación rápida (una página): ¿ha cambiado la web o el menú? Entonces, repaso entero
  async function rapido() {
    if (estado.mirando) return;
    lsPut(LS_T, Date.now());
    try {
      const h = await (await fetch('/menu', { credentials: 'include' })).text();
      const b = (h.replace(/\\"/g, '"').match(/"buildId":"([^"]+)"/) || [])[1];
      const d = new DOMParser().parseFromString(h, 'text/html');
      const menu = [...new Set([...d.querySelectorAll('a[href^="/"]')].map(a => a.getAttribute('href').replace(/[?#].*$/, '')).filter(x => x.length > 1))].sort();
      const inv = await dbGet('kv', 'inventario').catch(() => null);
      if (!inv) return repaso('primera vez');
      if (b && b !== inv.buildId) return repaso('la web se ha actualizado');
      if (menu.join() !== (inv.menu || []).join()) return repaso('el menú ha cambiado');
      if (Date.now() - lsGet(LS_REPASO, 0) > CADA_REPASO) return repaso('repaso de cada 12 h');
      pintar();
    } catch { /* sin red */ }
  }

  /* ── Aviso ── */
  function aviso(txt) {
    let el = document.getElementById('axn-aviso');
    if (!el) { el = document.createElement('div'); el.id = 'axn-aviso'; el.setAttribute('data-ax-ignore', ''); document.body.appendChild(el); }
    el.style.cssText = 'position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:2147483647;max-width:min(92vw,440px);padding:12px 14px;border-radius:16px;font:700 13px/1.4 system-ui,sans-serif;background:#7C5CFF;color:#fff;box-shadow:0 14px 30px -12px rgba(0,0,0,.6);cursor:pointer';
    el.textContent = '🆕 Novedades en Aurora Dex: ' + txt + ' — toca para verlo';
    el.onclick = () => { el.remove(); abrirVisor('cambios'); };
    clearTimeout(el._t); el._t = setTimeout(() => el.remove(), 25000);
    try { if (document.hidden && 'Notification' in window && Notification.permission === 'granted') new Notification('🆕 Novedades en Aurora Dex', { body: txt.slice(0, 200) }); } catch { /* nada */ }
  }

  /* ── Panel en el Menú ── */
  function pintar() {
    const p = document.getElementById(PANEL_ID);
    if (p) {
      const l = lsGet(LS_NOV, []), nuevas = l.filter(x => x.nueva).length;
      const sub = estado.mirando ? `⏳ ${estado.paso || 'Mirando…'}` : lsGet(LS_REPASO, 0) ? `Repasada entera ${hora(lsGet(LS_REPASO, 0))} · miro cada 30 min si cambia` : 'Aún sin leer: toca «Leer ahora»';
      p.querySelector('.axn-sub').textContent = sub;
      const nn = p.querySelector('.axn-n'); nn.textContent = nuevas ? String(nuevas) : ''; nn.style.display = nuevas ? '' : 'none';
      p.querySelector('.axn-leer').disabled = !!estado.mirando;
      const html = l.length ? l.slice(0, 4).map(x => `<li style="padding:6px 0;border-top:1px dashed rgba(127,127,127,.25);${x.nueva ? 'font-weight:800' : 'opacity:.8'}"><span style="display:block;font-size:10px;opacity:.6">${hora(x.t)}${x.motivo ? ' · ' + esc(x.motivo) : ''}</span>${esc(titularDe(x))}</li>`).join('') : '<li style="opacity:.7;padding-top:4px">Nada todavía.</li>';
      const out = p.querySelector('.axn-lista'); if (out.dataset.h !== html) { out.dataset.h = html; out.innerHTML = html; }
    }
    const v = document.getElementById(VISOR_ID); if (v && v.dataset.tab === 'cambios') pintarVisor();
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
        <button type="button" class="axn-leer pastilla border-2 border-lienzo bg-lienzo text-tinta-500 shadow-suave" style="padding:4px 10px">🔄 Leer ahora</button></div>
      <p class="axn-sub text-xs font-bold text-tinta-400" style="margin:0"></p>
      <ul class="axn-lista text-sm" style="list-style:none;margin:0;padding:0"></ul>
      <button type="button" class="axn-ver pastilla border-2 border-rojo-500 bg-rojo-500 text-white" style="width:100%;padding:8px">🔎 Ver todo (cambios, en pruebas, secciones, buscar)</button>`;
    p.querySelector('.axn-leer').addEventListener('click', () => repaso('a mano'));
    p.querySelector('.axn-ver').addEventListener('click', () => abrirVisor('cambios'));
    ancla.insertAdjacentElement('beforebegin', p);
    pintar();
  }

  /* ── El visor: todo, de verdad ── */
  const VCSS = `#${VISOR_ID}{position:fixed;inset:0;z-index:2147483600;background:rgb(var(--lienzo,20 22 18));color:rgb(var(--tinta-800,240 243 234));display:flex;flex-direction:column;font-family:inherit}
    #${VISOR_ID} .cab{display:flex;align-items:center;gap:8px;padding:12px 14px 8px}
    #${VISOR_ID} .cab h2{flex:1;margin:0;font-family:var(--font-display),system-ui,sans-serif;font-size:18px;font-weight:800}
    #${VISOR_ID} .x{width:34px;height:34px;border-radius:999px;border:0;background:rgb(var(--crema-100,40 44 38));color:inherit;font-size:16px;cursor:pointer}
    #${VISOR_ID} .tabs{display:flex;gap:6px;padding:0 14px 8px;overflow-x:auto}
    #${VISOR_ID} .tabs button{flex-shrink:0;border:0;border-radius:999px;padding:6px 12px;font-weight:800;font-size:12px;cursor:pointer;background:rgb(var(--crema-100,40 44 38));color:inherit}
    #${VISOR_ID} .tabs button.on{background:#E0473A;color:#fff}
    #${VISOR_ID} .cuerpo{flex:1;overflow-y:auto;padding:4px 14px 40px;font-size:13px;line-height:1.45}
    #${VISOR_ID} h3{margin:14px 0 6px;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.05em;opacity:.7}
    #${VISOR_ID} .item{padding:8px 10px;margin:0 0 6px;border-radius:12px;background:rgb(var(--crema-50,32 35 30));box-shadow:inset 0 0 0 1px rgba(127,127,127,.18)}
    #${VISOR_ID} .item small{display:block;opacity:.6;font-size:10.5px;font-weight:700}
    #${VISOR_ID} .item a,#${VISOR_ID} .lnk{color:#6FA8FF;font-weight:800;text-decoration:underline;cursor:pointer;background:none;border:0;padding:0;font-size:12px}
    #${VISOR_ID} .imgs{display:grid;grid-template-columns:repeat(auto-fill,minmax(84px,1fr));gap:8px}
    #${VISOR_ID} .imgs figure{margin:0;padding:6px;border-radius:12px;background:rgb(var(--crema-50,32 35 30));text-align:center;font-size:9.5px;word-break:break-all}
    #${VISOR_ID} .imgs img{width:64px;height:64px;object-fit:contain;image-rendering:pixelated}
    #${VISOR_ID} pre{white-space:pre-wrap;word-break:break-word;font-size:11px;background:#0d0f0c;color:#cfe3c8;padding:10px;border-radius:10px;max-height:320px;overflow:auto}
    #${VISOR_ID} input{width:100%;padding:10px 12px;border-radius:12px;border:2px solid rgba(127,127,127,.3);background:transparent;color:inherit;font:inherit;outline:none}
    #${VISOR_ID} .vacio{opacity:.6;padding:10px 0}`;
  function abrirVisor(tab) {
    let v = document.getElementById(VISOR_ID);
    if (!document.getElementById('axn-css')) { const st = document.createElement('style'); st.id = 'axn-css'; st.textContent = VCSS; document.head.appendChild(st); }
    if (!v) {
      v = document.createElement('div'); v.id = VISOR_ID; v.setAttribute('data-ax-ignore', '');
      v.innerHTML = `<div class="cab"><h2>🔎 Todo lo de Aurora Dex</h2><button type="button" class="x" aria-label="Cerrar">✕</button></div>
        <div class="tabs"><button data-t="cambios">🆕 Cambios</button><button data-t="pruebas">🔧 En pruebas</button><button data-t="secciones">🗺️ Secciones</button><button data-t="catalogo">🛍️ Catálogo</button><button data-t="buscar">🔎 Buscar</button></div>
        <div class="cuerpo"></div>`;
      v.querySelector('.x').addEventListener('click', () => v.remove());
      v.querySelector('.tabs').addEventListener('click', e => { const b = e.target.closest('[data-t]'); if (b) { v.dataset.tab = b.dataset.t; pintarVisor(); } });
      v.querySelector('.cuerpo').addEventListener('click', async e => {
        const cod = e.target.closest('[data-codigo]');
        if (cod) { e.preventDefault(); await verCodigo(cod.dataset.codigo, cod); }
        const a = e.target.closest('a[href^="/"]');
        if (a) v.remove();
      });
      document.body.appendChild(v);
      // al abrirlo, lo nuevo ya se ha visto
      const l = lsGet(LS_NOV, []); if (l.some(x => x.nueva)) { l.forEach(x => { x.nueva = false; }); lsPut(LS_NOV, l); pintar(); }
    }
    v.dataset.tab = tab || v.dataset.tab || 'cambios';
    pintarVisor();
  }
  const enlace = r => PROHIBIDAS.test(r) ? esc(r) : `<a href="${esc(r)}">${esc(r)}</a>`;
  const paginasDe = ps => (ps || []).map(p => p.startsWith('/') ? enlace(p) : esc(p)).join(', ');
  // un texto con el botón de «ver en el código»
  const textoItem = (s, ps) => `<div class="item">${esc(s)}<small>en ${paginasDe(ps)} · <button type="button" class="lnk" data-codigo="${esc(s)}">ver en el código</button></small></div>`;
  async function pintarVisor() {
    const v = document.getElementById(VISOR_ID); if (!v) return;
    const tab = v.dataset.tab;
    for (const b of v.querySelectorAll('.tabs button')) b.classList.toggle('on', b.dataset.t === tab);
    const c = v.querySelector('.cuerpo');
    const inv = await dbGet('kv', 'inventario').catch(() => null);
    if (!inv) { c.innerHTML = `<p class="vacio">${estado.mirando ? '⏳ ' + esc(estado.paso) : 'Aún no he leído la web. Pulsa «🔄 Leer ahora» en el Menú (tarda menos de un minuto).'}</p>`; return; }
    let h = '';
    if (tab === 'cambios') {
      const l = lsGet(LS_NOV, []);
      if (estado.mirando) h += `<p class="vacio">⏳ ${esc(estado.paso)}</p>`;
      if (!l.length) h += '<p class="vacio">Sin cambios todavía.</p>';
      for (const x of l) {
        h += `<h3>${hora(x.t)}${x.motivo ? ' · ' + esc(x.motivo) : ''}</h3>`;
        if (x.primera) { h += `<div class="item">${esc(x.resumen)}</div>`; continue; }
        if (x.web) h += '<div class="item">🔧 La web se ha actualizado (versión nueva).</div>';
        for (const s of x.secciones || []) h += `<div class="item">🆕 Sección nueva en el menú: ${enlace(s)}</div>`;
        for (const r of x.rutas || []) h += `<div class="item">🗺️ Página nueva: ${enlace(r)}</div>`;
        for (const f of x.flags || []) h += `<div class="item">🔧 En pruebas: <b>${esc(f.nombre)}</b> <small>${esc(f.marca)} · en ${enlace(f.pagina)}</small></div>`;
        for (const f of x.futuras || []) h += `<div class="item">⏰ Programado: <b>${esc(f.nombre)}</b> — ${esc(f.campo)} ${hora(f.t)} <small>en ${enlace(f.pagina)}</small></div>`;
        for (const k of x.catalogo || []) h += `<div class="item">🛍️ Nuevo: <b>${esc(k.nombre)}</b><small>${esc(k.k.split('|')[1])} · en ${enlace(k.k.split('|')[0])}</small></div>`;
        for (const k of x.cambiados || []) h += `<div class="item">✏️ Cambiado: «${esc(k.antes)}» → «${esc(k.ahora)}»<small>${esc(k.k)}</small></div>`;
        for (const p of x.pistas || []) h += `<div class="item">🧬 El código menciona: <b>${esc(p)}</b>${p.startsWith('#') ? ` (${GEN_DE(+p.slice(1).split(' ')[0])}.ª generación)` : ''}</div>`;
        for (const r of x.regiones || []) h += `<div class="item">🗺️ Región nueva: <b>${esc(r)}</b></div>`;
        if (x.dex) h += `<div class="item">📕 La Pokédex llega ahora hasta el #${x.dex.ahora} (antes #${x.dex.antes})</div>`;
        for (const g of x.sprites || []) h += `<div class="item">🎨 Ya están los dibujos de la ${g}.ª generación <img src="/sprites/${SPRITES.find(s => s[1] == g)[0]}.png" style="width:48px;height:48px;image-rendering:pixelated;vertical-align:middle"></div>`;
        if ((x.imagenes || []).length) h += `<div class="imgs">${x.imagenes.map(i => `<figure>${/…$/.test(i) ? '' : `<img src="${esc(i)}" loading="lazy" alt="">`}<figcaption>${esc(i)}</figcaption></figure>`).join('')}</div>`;
        if ((x.textos || []).length) { h += `<h3>📝 Textos nuevos (${x.textos.length})</h3>`; for (const t of x.textos.slice(0, 300)) h += textoItem(t.s, t.p); }
        if (x.quitados) h += `<div class="item" style="opacity:.7">🗑️ ${x.quitados} ${pl(x.quitados, 'texto ha desaparecido', 'textos han desaparecido')} del código.</div>`;
      }
    } else if (tab === 'pruebas') {
      const tx = Object.entries(inv.textos).filter(([s]) => EN_PRUEBAS.test(s));
      h += `<p class="vacio">Lo que el propio código dice que está en pruebas, próximamente o solo para cuentas de prueba (${tx.length} textos${inv.flags.length ? ` y ${inv.flags.length} marcas en los datos` : ''}). Pulsa «ver en el código» para ver todo lo que hay alrededor.</p>`;
      for (const f of inv.flags) h += `<div class="item">🔧 <b>${esc(f.nombre)}</b> <small>${esc(f.marca)} · en ${enlace(f.pagina)}</small></div>`;
      for (const f of inv.futuras) h += `<div class="item">⏰ <b>${esc(f.nombre)}</b> — ${esc(f.campo)} ${hora(f.t)} <small>en ${enlace(f.pagina)}</small></div>`;
      for (const [s, ps] of tx) h += textoItem(s, ps);
      if (inv.pistas.length) { h += '<h3>🧬 Generaciones y regiones nuevas en el código</h3>'; for (const p of inv.pistas) h += `<div class="item">${esc(p)}</div>`; }
      h += `<h3>🎨 Dibujos de generaciones nuevas</h3><div class="item">${SPRITES.map(([n, g]) => `${g}.ª gen. (#${n}): ${inv.sprites[g] ? '✅ subidos' : '— aún no'}`).join(' · ')}</div>`;
    } else if (tab === 'secciones') {
      const rs = Object.entries(inv.rutas).sort((a, b) => a[0].localeCompare(b[0]));
      const fuera = rs.filter(([r, x]) => !inv.menu.includes(r));
      h += `<p class="vacio">${rs.length} secciones leídas · ${inv.menu.length} en el menú · ${fuera.length} fuera del menú. Toca una para abrirla.</p><h3>Fuera del menú</h3>`;
      for (const [r, x] of fuera) h += `<div class="item">${enlace(r)} <small>${x.st}${x.redirige ? ' · te manda a ' + esc(x.redirige) : ''}${x.soloCodigo ? ' · solo aparece en el código' : ''}</small></div>`;
      h += '<h3>En el menú</h3>';
      for (const [r, x] of rs.filter(([r]) => inv.menu.includes(r))) h += `<div class="item">${enlace(r)} <small>${x.st}${x.redirige ? ' · te manda a ' + esc(x.redirige) : ''}</small></div>`;
      h += `<h3>Imágenes que usa el código (${inv.imagenes.length})</h3><div class="imgs">${inv.imagenes.map(i => `<figure>${/…$/.test(i) ? '' : `<img src="${esc(i)}" loading="lazy" alt="">`}<figcaption>${esc(i)}</figcaption></figure>`).join('')}</div>`;
    } else if (tab === 'catalogo') {
      const ks = Object.entries(inv.cat).sort((a, b) => a[0].localeCompare(b[0]));
      h += `<p class="vacio">${ks.length} cosas con nombre en los datos que manda el servidor (tiendas, misiones, objetos, eventos…), por sección.</p>`;
      let pag = '';
      for (const [k, n] of ks) { const [p, id] = k.split('|'); if (p !== pag) { pag = p; h += `<h3>${enlace(p)}</h3>`; } h += `<div class="item">${esc(n)}<small>${esc(id)}</small></div>`; }
    } else if (tab === 'buscar') {
      h += `<input class="axn-q" placeholder="Busca en todo el código y los datos (p. ej. Kalos, pruebas, evento…)" value="${esc(v.dataset.q || '')}"><div class="res"></div>`;
    }
    c.innerHTML = h;
    if (tab === 'buscar') {
      const q = c.querySelector('.axn-q'), res = c.querySelector('.res');
      const buscar = () => {
        v.dataset.q = q.value;
        const t = q.value.trim().toLowerCase();
        if (t.length < 2) { res.innerHTML = '<p class="vacio">Escribe al menos 2 letras.</p>'; return; }
        const tx = Object.entries(inv.textos).filter(([s]) => s.toLowerCase().includes(t)).slice(0, 200);
        const ca = Object.entries(inv.cat).filter(([k, n]) => (k + ' ' + n).toLowerCase().includes(t)).slice(0, 100);
        const ru = Object.keys(inv.rutas).filter(r => r.includes(t));
        res.innerHTML = `<h3>Textos del código (${tx.length})</h3>${tx.map(([s, ps]) => textoItem(s, ps)).join('') || '<p class="vacio">Nada.</p>'}<h3>Datos del servidor (${ca.length})</h3>${ca.map(([k, n]) => `<div class="item">${esc(n)}<small>${esc(k)}</small></div>`).join('') || '<p class="vacio">Nada.</p>'}${ru.length ? `<h3>Secciones</h3>${ru.map(r => `<div class="item">${enlace(r)}</div>`).join('')}` : ''}`;
      };
      q.addEventListener('input', buscar); buscar(); q.focus();
    }
  }
  // el trozo de código donde sale un texto (se descarga ese fichero y se enseña lo de alrededor, ordenado)
  async function verCodigo(s, boton) {
    const inv = await dbGet('kv', 'inventario').catch(() => null); if (!inv) return;
    const pre = document.createElement('pre'); pre.textContent = 'Buscando…';
    boton.closest('.item').appendChild(pre); boton.remove();
    for (const u of inv.chunks) {
      const c = await dbGet('chunks', u).catch(() => null);
      if (!c || !c.textos.includes(s)) continue;
      try {
        const js = desescapar(await (await fetch(u)).text());
        const i = js.indexOf(s);
        let trozo = js.slice(Math.max(0, i - 1500), i + s.length + 1500);
        // legible: un salto de línea por cada elemento, y fuera clases y código de relleno
        trozo = trozo.replace(/className:"[^"]*",?/g, '').replace(/\(0,[a-z]\.jsxs?\)\(/g, '\n<').replace(/children:/g, '').replace(/,null,/g, ',');
        pre.textContent = `${u.replace(/.*\//, '')} (${paginaDeChunk(u)})\n…${trozo}…`;
      } catch { pre.textContent = 'No he podido descargar el código.'; }
      return;
    }
    pre.textContent = 'No lo encuentro en el código de esta versión.';
  }

  // Con el robot de Diarias en plena ruta no se lee el código de la web: es mucho trabajo seguido para el navegador y hace
  // que se atasquen los minijuegos que van al milisegundo (el Muelle). Se hace cuando el robot descansa.
  const robotJugando = () => { try { return JSON.parse(sessionStorage.getItem('axd-ruta-fondo') || 'null') != null; } catch { return false; } };
  function tick() {
    montar();
    if (!estado.mirando && !robotJugando() && Date.now() - lsGet(LS_T, 0) > CADA_RAPIDO) rapido();
  }
  // Una sola vez al pasar a la 2.1: el historial guardado por las versiones anteriores traía falsas novedades (tus Pokémon y
  // objetos como «catálogo», páginas leídas por primera vez, textos con la web sin cambiar). Se quitan; lo que valga se queda.
  function limpiarHistorial() {
    if (lsGet('axn2-limpio', '') === '2.1') return;
    const l = lsGet(LS_NOV, []);
    const limpio = [];
    for (const x of l) {
      if (x.primera) { limpio.push(x); continue; }
      if (!x.web) { x.textos = []; x.imagenes = []; x.pistas = []; x.rutas = []; x.quitados = 0; }       // con la misma web, el código no pudo cambiar
      x.catalogo = (x.catalogo || []).filter(k => catDelJuego(k.k));
      x.cambiados = (x.cambiados || []).filter(k => catDelJuego(k.k));
      if (!x.web) x.catalogo = [];                                                                        // sin cambio de web, lo de catálogo era casi siempre «páginas leídas por primera vez»
      x.total = (x.web ? 1 : 0) + (x.secciones || []).length + (x.rutas || []).length + (x.textos || []).length + (x.imagenes || []).length + x.catalogo.length + x.cambiados.length + (x.flags || []).length + (x.futuras || []).length + (x.pistas || []).length + (x.regiones || []).length + (x.dex ? 1 : 0) + (x.sprites || []).length;
      if (x.total) limpio.push(x);
    }
    lsPut(LS_NOV, limpio);
    lsPut('axn2-limpio', '2.1');
  }
  limpiarHistorial();
  try { ['axn-foto', 'axn-novedades', 'axn-ultima'].forEach(k => localStorage.removeItem(k)); } catch { /* lo de la versión 1 */ }
  setTimeout(() => { tick(); setInterval(tick, 5000); }, 4000);
  window.__axNovedades = { repaso, rapido, comparar, vistoDe, abrirVisor, VERSION };
})();
