// ==UserScript==
// @name         Aurora Dex · Cazador de Pokédex
// @namespace    auroradex-pokedex
// @version      1.0.1
// @description  En el mapa (/mapa): «🔎 Qué me falta y dónde» abre la fauna de cada tramo de la región (sin viajar), junta las especies que te faltan con su % de salir y su nivel, y te dice a qué tramos ir (los que más te faltan, primero) con un botón para viajar allí (es gratis). También dice qué especies de la Pokédex no salen en ningún tramo (evolución, huevo o evento). Lo recuerda por región.
// @match        https://auroradex.es/*
// @match        https://www.auroradex.es/*
// @updateURL    https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_pokedex.user.js
// @downloadURL  https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_pokedex.user.js
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  'use strict';
  // No corre en la ventana oculta donde el script de Diarias juega las diarias en segundo plano
  try { if (window.top !== window && window.name === 'axd-fondo') return; } catch { /* nada */ }
  const VERSION = '1.0.1';
  const PANEL_ID = 'axp-panel';
  const LS = 'axp-faltan';
  const NOMBRES_DATOS = 'Bulbasaur|Ivysaur|Venusaur|Charmander|Charmeleon|Charizard|Squirtle|Wartortle|Blastoise|Caterpie|Metapod|Butterfree|Weedle|Kakuna|Beedrill|Pidgey|Pidgeotto|Pidgeot|Rattata|Raticate|Spearow|Fearow|Ekans|Arbok|Pikachu|Raichu|Sandshrew|Sandslash|Nidoran♀|Nidorina|Nidoqueen|Nidoran♂|Nidorino|Nidoking|Clefairy|Clefable|Vulpix|Ninetales|Jigglypuff|Wigglytuff|Zubat|Golbat|Oddish|Gloom|Vileplume|Paras|Parasect|Venonat|Venomoth|Diglett|Dugtrio|Meowth|Persian|Psyduck|Golduck|Mankey|Primeape|Growlithe|Arcanine|Poliwag|Poliwhirl|Poliwrath|Abra|Kadabra|Alakazam|Machop|Machoke|Machamp|Bellsprout|Weepinbell|Victreebel|Tentacool|Tentacruel|Geodude|Graveler|Golem|Ponyta|Rapidash|Slowpoke|Slowbro|Magnemite|Magneton|Farfetch’d|Doduo|Dodrio|Seel|Dewgong|Grimer|Muk|Shellder|Cloyster|Gastly|Haunter|Gengar|Onix|Drowzee|Hypno|Krabby|Kingler|Voltorb|Electrode|Exeggcute|Exeggutor|Cubone|Marowak|Hitmonlee|Hitmonchan|Lickitung|Koffing|Weezing|Rhyhorn|Rhydon|Chansey|Tangela|Kangaskhan|Horsea|Seadra|Goldeen|Seaking|Staryu|Starmie|Mr. Mime|Scyther|Jynx|Electabuzz|Magmar|Pinsir|Tauros|Magikarp|Gyarados|Lapras|Ditto|Eevee|Vaporeon|Jolteon|Flareon|Porygon|Omanyte|Omastar|Kabuto|Kabutops|Aerodactyl|Snorlax|Articuno|Zapdos|Moltres|Dratini|Dragonair|Dragonite|Mewtwo|Mew|Chikorita|Bayleef|Meganium|Cyndaquil|Quilava|Typhlosion|Totodile|Croconaw|Feraligatr|Sentret|Furret|Hoothoot|Noctowl|Ledyba|Ledian|Spinarak|Ariados|Crobat|Chinchou|Lanturn|Pichu|Cleffa|Igglybuff|Togepi|Togetic|Natu|Xatu|Mareep|Flaaffy|Ampharos|Bellossom|Marill|Azumarill|Sudowoodo|Politoed|Hoppip|Skiploom|Jumpluff|Aipom|Sunkern|Sunflora|Yanma|Wooper|Quagsire|Espeon|Umbreon|Murkrow|Slowking|Misdreavus|Unown|Wobbuffet|Girafarig|Pineco|Forretress|Dunsparce|Gligar|Steelix|Snubbull|Granbull|Qwilfish|Scizor|Shuckle|Heracross|Sneasel|Teddiursa|Ursaring|Slugma|Magcargo|Swinub|Piloswine|Corsola|Remoraid|Octillery|Delibird|Mantine|Skarmory|Houndour|Houndoom|Kingdra|Phanpy|Donphan|Porygon2|Stantler|Smeargle|Tyrogue|Hitmontop|Smoochum|Elekid|Magby|Miltank|Blissey|Raikou|Entei|Suicune|Larvitar|Pupitar|Tyranitar|Lugia|Ho-Oh|Celebi|Treecko|Grovyle|Sceptile|Torchic|Combusken|Blaziken|Mudkip|Marshtomp|Swampert|Poochyena|Mightyena|Zigzagoon|Linoone|Wurmple|Silcoon|Beautifly|Cascoon|Dustox|Lotad|Lombre|Ludicolo|Seedot|Nuzleaf|Shiftry|Taillow|Swellow|Wingull|Pelipper|Ralts|Kirlia|Gardevoir|Surskit|Masquerain|Shroomish|Breloom|Slakoth|Vigoroth|Slaking|Nincada|Ninjask|Shedinja|Whismur|Loudred|Exploud|Makuhita|Hariyama|Azurill|Nosepass|Skitty|Delcatty|Sableye|Mawile|Aron|Lairon|Aggron|Meditite|Medicham|Electrike|Manectric|Plusle|Minun|Volbeat|Illumise|Roselia|Gulpin|Swalot|Carvanha|Sharpedo|Wailmer|Wailord|Numel|Camerupt|Torkoal|Spoink|Grumpig|Spinda|Trapinch|Vibrava|Flygon|Cacnea|Cacturne|Swablu|Altaria|Zangoose|Seviper|Lunatone|Solrock|Barboach|Whiscash|Corphish|Crawdaunt|Baltoy|Claydol|Lileep|Cradily|Anorith|Armaldo|Feebas|Milotic|Castform|Kecleon|Shuppet|Banette|Duskull|Dusclops|Tropius|Chimecho|Absol|Wynaut|Snorunt|Glalie|Spheal|Sealeo|Walrein|Clamperl|Huntail|Gorebyss|Relicanth|Luvdisc|Bagon|Shelgon|Salamence|Beldum|Metang|Metagross|Regirock|Regice|Registeel|Latias|Latios|Kyogre|Groudon|Rayquaza|Jirachi|Deoxys|Turtwig|Grotle|Torterra|Chimchar|Monferno|Infernape|Piplup|Prinplup|Empoleon|Starly|Staravia|Staraptor|Bidoof|Bibarel|Kricketot|Kricketune|Shinx|Luxio|Luxray|Budew|Roserade|Cranidos|Rampardos|Shieldon|Bastiodon|Burmy|Wormadam|Mothim|Combee|Vespiquen|Pachirisu|Buizel|Floatzel|Cherubi|Cherrim|Shellos|Gastrodon|Ambipom|Drifloon|Drifblim|Buneary|Lopunny|Mismagius|Honchkrow|Glameow|Purugly|Chingling|Stunky|Skuntank|Bronzor|Bronzong|Bonsly|Mime Jr.|Happiny|Chatot|Spiritomb|Gible|Gabite|Garchomp|Munchlax|Riolu|Lucario|Hippopotas|Hippowdon|Skorupi|Drapion|Croagunk|Toxicroak|Carnivine|Finneon|Lumineon|Mantyke|Snover|Abomasnow|Weavile|Magnezone|Lickilicky|Rhyperior|Tangrowth|Electivire|Magmortar|Togekiss|Yanmega|Leafeon|Glaceon|Gliscor|Mamoswine|Porygon-Z|Gallade|Probopass|Dusknoir|Froslass|Rotom|Uxie|Mesprit|Azelf|Dialga|Palkia|Heatran|Regigigas|Giratina|Cresselia|Phione|Manaphy|Darkrai|Shaymin|Arceus|Victini|Snivy|Servine|Serperior|Tepig|Pignite|Emboar|Oshawott|Dewott|Samurott|Patrat|Watchog|Lillipup|Herdier|Stoutland|Purrloin|Liepard|Pansage|Simisage|Pansear|Simisear|Panpour|Simipour|Munna|Musharna|Pidove|Tranquill|Unfezant|Blitzle|Zebstrika|Roggenrola|Boldore|Gigalith|Woobat|Swoobat|Drilbur|Excadrill|Audino|Timburr|Gurdurr|Conkeldurr|Tympole|Palpitoad|Seismitoad|Throh|Sawk|Sewaddle|Swadloon|Leavanny|Venipede|Whirlipede|Scolipede|Cottonee|Whimsicott|Petilil|Lilligant|Basculin|Sandile|Krokorok|Krookodile|Darumaka|Darmanitan|Maractus|Dwebble|Crustle|Scraggy|Scrafty|Sigilyph|Yamask|Cofagrigus|Tirtouga|Carracosta|Archen|Archeops|Trubbish|Garbodor|Zorua|Zoroark|Minccino|Cinccino|Gothita|Gothorita|Gothitelle|Solosis|Duosion|Reuniclus|Ducklett|Swanna|Vanillite|Vanillish|Vanilluxe|Deerling|Sawsbuck|Emolga|Karrablast|Escavalier|Foongus|Amoonguss|Frillish|Jellicent|Alomomola|Joltik|Galvantula|Ferroseed|Ferrothorn|Klink|Klang|Klinklang|Tynamo|Eelektrik|Eelektross|Elgyem|Beheeyem|Litwick|Lampent|Chandelure|Axew|Fraxure|Haxorus|Cubchoo|Beartic|Cryogonal|Shelmet|Accelgor|Stunfisk|Mienfoo|Mienshao|Druddigon|Golett|Golurk|Pawniard|Bisharp|Bouffalant|Rufflet|Braviary|Vullaby|Mandibuzz|Heatmor|Durant|Deino|Zweilous|Hydreigon|Larvesta|Volcarona|Cobalion|Terrakion|Virizion|Tornadus|Thundurus|Reshiram|Zekrom|Landorus|Kyurem|Keldeo|Meloetta|Genesect|Chespin|Quilladin|Chesnaught|Fennekin|Braixen|Delphox|Froakie|Frogadier|Greninja|Bunnelby|Diggersby|Fletchling|Fletchinder|Talonflame|Scatterbug|Spewpa|Vivillon|Litleo|Pyroar|Flabébé|Floette|Florges|Skiddo|Gogoat|Pancham|Pangoro|Furfrou|Espurr|Meowstic|Honedge|Doublade|Aegislash|Spritzee|Aromatisse|Swirlix|Slurpuff|Inkay|Malamar|Binacle|Barbaracle|Skrelp|Dragalge|Clauncher|Clawitzer|Helioptile|Heliolisk|Tyrunt|Tyrantrum|Amaura|Aurorus|Sylveon|Hawlucha|Dedenne|Carbink|Goomy|Sliggoo|Goodra|Klefki|Phantump|Trevenant|Pumpkaboo|Gourgeist|Bergmite|Avalugg|Noibat|Noivern|Xerneas|Yveltal|Zygarde|Diancie|Hoopa|Volcanion|Rowlet|Dartrix|Decidueye|Litten|Torracat|Incineroar|Popplio|Brionne|Primarina|Pikipek|Trumbeak|Toucannon|Yungoos|Gumshoos|Grubbin|Charjabug|Vikavolt|Crabrawler|Crabominable|Oricorio|Cutiefly|Ribombee|Rockruff|Lycanroc|Wishiwashi|Mareanie|Toxapex|Mudbray|Mudsdale|Dewpider|Araquanid|Fomantis|Lurantis|Morelull|Shiinotic|Salandit|Salazzle|Stufful|Bewear|Bounsweet|Steenee|Tsareena|Comfey|Oranguru|Passimian|Wimpod|Golisopod|Sandygast|Palossand|Pyukumuku|Código Cero/Type: Null|Silvally|Minior|Komala|Turtonator|Togedemaru|Mimikyu|Bruxish|Drampa|Dhelmise|Jangmo-o|Hakamo-o|Kommo-o|Tapu Koko|Tapu Lele|Tapu Bulu|Tapu Fini|Cosmog|Cosmoem|Solgaleo|Lunala|Nihilego|Buzzwole|Pheromosa|Xurkitree|Celesteela|Kartana|Guzzlord|Necrozma|Magearna|Marshadow|Poipole|Naganadel|Stakataka|Blacephalon|Zeraora|Meltan|Melmetal|Grookey|Thwackey|Rillaboom|Scorbunny|Raboot|Cinderace|Sobble|Drizzile|Inteleon|Skwovet|Greedent|Rookidee|Corvisquire|Corviknight|Blipbug|Dottler|Orbeetle|Nickit|Thievul|Gossifleur|Eldegoss|Wooloo|Dubwool|Chewtle|Drednaw|Yamper|Boltund|Rolycoly|Carkol|Coalossal|Applin|Flapple|Appletun|Silicobra|Sandaconda|Cramorant|Arrokuda|Barraskewda|Toxel|Toxtricity|Sizzlipede|Centiskorch|Clobbopus|Grapploct|Sinistea|Polteageist|Hatenna|Hattrem|Hatterene|Impidimp|Morgrem|Grimmsnarl|Obstagoon|Perrserker|Cursola|Sirfetch’d|Mr. Rime|Runerigus|Milcery|Alcremie|Falinks|Pincurchin|Snom|Frosmoth|Stonjourner|Eiscue|Indeedee|Morpeko|Cufant|Copperajah|Dracozolt|Arctozolt|Dracovish|Arctovish|Duraludon|Dreepy|Drakloak|Dragapult|Zacian|Zamazenta|Eternatus|Kubfu|Urshifu|Zarude|Regieleki|Regidrago|Glastrier|Spectrier|Calyrex|Wyrdeer|Kleavor|Ursaluna|Basculegion|Sneasler|Overqwil|Enamorus|Sprigatito|Floragato|Meowscarada|Fuecoco|Crocalor|Skeledirge|Quaxly|Quaxwell|Quaquaval|Lechonk|Oinkologne|Tarountula|Spidops|Nymble|Lokix|Pawmi|Pawmo|Pawmot|Tandemaus|Maushold|Fidough|Dachsbun|Smoliv|Dolliv|Arboliva|Squawkabilly|Nacli|Naclstack|Garganacl|Charcadet|Armarouge|Ceruledge|Tadbulb|Bellibolt|Wattrel|Kilowattrel|Maschiff|Mabosstiff|Shroodle|Grafaiai|Bramblin|Brambleghast|Toedscool|Toedscruel|Klawf|Capsakid|Scovillain|Rellor|Rabsca|Flittle|Espathra|Tinkatink|Tinkatuff|Tinkaton|Wiglett|Wugtrio|Bombirdier|Finizen|Palafin|Varoom|Revavroom|Cyclizar|Orthworm|Glimmet|Glimmora|Greavard|Houndstone|Flamigo|Cetoddle|Cetitan|Veluza|Dondozo|Tatsugiri|Annihilape|Clodsire|Farigiraf|Dudunsparce|Kingambit|Colmilargo/Great Tusk|Colagrito/Scream Tail|Furioseta/Brute Bonnet|Melenaleteo/Flutter Mane|Reptalada/Slither Wing|Pelarena/Sandy Shocks|Ferrodada/Iron Treads|Ferrosaco/Iron Bundle|Ferropalmas/Iron Hands|Ferrocuello/Iron Jugulis|Ferropolilla/Iron Moth|Ferropúas/Iron Thorns|Frigibax|Arctibax|Baxcalibur|Gimmighoul|Gholdengo|Wo-Chien|Chien-Pao|Ting-Lu|Chi-Yu|Bramaluna/Roaring Moon|Ferropaladín/Iron Valiant|Koraidon|Miraidon|Ondulagua/Walking Wake|Ferroverdor/Iron Leaves|Dipplin|Poltchageist|Sinistcha|Okidogi|Munkidori|Fezandipiti|Ogerpon|Archaludon|Hydrapple|Flamariete/Gouging Fire|Electrofuria/Raging Bolt|Ferromole/Iron Boulder|Ferrotesta/Iron Crown|Terapagos|Pecharunt';
  const NOMBRES = {};
  NOMBRES_DATOS.split('|').forEach((s, i) => { NOMBRES[i + 1] = s.split('/')[0]; });
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const texto = el => (el && el.textContent || '').replace(/\s+/g, ' ').trim();
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } };
  const lsPut = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* nada */ } };
  const enMapa = () => /^\/mapa\/?$/.test(location.pathname);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function esperarHidratacion(maxMs = 20000) {
    return new Promise(resolve => {
      const t0 = Date.now();
      let quieto = Date.now();
      const obs = new MutationObserver(() => { quieto = Date.now(); });
      obs.observe(document.documentElement, { childList: true, subtree: true });
      const marcado = el => !el || Object.keys(el).some(k => k.startsWith('__reactFiber$'));
      const tick = () => {
        const listo = document.readyState === 'complete' && marcado(document.querySelector('main')) && Date.now() - quieto >= 800;
        if (listo || Date.now() - t0 > maxMs) { obs.disconnect(); setTimeout(resolve, 300); } else setTimeout(tick, 200);
      };
      tick();
    });
  }

  /* ── Región: la del título «MAPA DE TESELIA» ── */
  const region = () => { const el = $$('main span, main p').find(x => /^mapa de\s+\S+/i.test(texto(x))); return el ? texto(el).replace(/^mapa de\s+/i, '').toLowerCase() : ''; };
  const botonesFauna = () => $$('button[aria-label^="Ver que Pok"]');
  const nombreTramo = b => (b.getAttribute('aria-label') || '').replace(/^Ver que Pok[eé]mon salen en\s*/i, '');
  // la hoja de fauna abierta (la de más arriba)
  const hojaFauna = () => $$('h3').filter(h => /^Fauna de /.test(texto(h))).map(h => h.closest('div.fixed') || h.parentElement).pop();

  async function abrirMapaCompleto() {
    if (botonesFauna().length > 5) return true;
    const b = $$('main button').find(x => /ver mapa completo/i.test(texto(x)));
    if (!b) return false;
    b.click();
    for (let i = 0; i < 30 && botonesFauna().length < 5; i++) await sleep(150);
    return botonesFauna().length > 5;
  }
  async function leerTramo(b) {
    const nombre = nombreTramo(b);
    b.click();
    let hoja = null;
    for (let i = 0; i < 60; i++) { await sleep(150); hoja = hojaFauna(); if (hoja && texto(hoja).includes('Fauna de ' + nombre) && hoja.querySelector('li')) break; }
    if (!hoja) return null;
    await sleep(200);
    const especies = $$('li', hoja).map(li => {
      const img = li.querySelector('img');
      const num = +(((img && img.getAttribute('src')) || '').match(/\/sprites\/(?:[a-z-]+\/)?(\d+)/) || [])[1] || 0;
      const t = texto(li);
      return { num, nombre: (img && img.alt) || '', falta: /te falta/i.test(t), pct: +((t.match(/(\d+)\s*%/) || [])[1] || 0), nivel: (t.match(/Nv\.\s*\d+(?:\s*[–-]\s*\d+)?(?=\s*·)/) || [''])[0], rareza: (t.match(/·\s*(Comun|Común|Poco comun|Poco común|Rara|Muy rara|Legendari[oa]|Singular)/i) || [])[1] || '' };
    }).filter(x => x.num || x.nombre);
    const cerrar = $$('button[aria-label="Cerrar"]', hoja).pop();
    if (cerrar) cerrar.click();
    for (let i = 0; i < 20 && hojaFauna(); i++) await sleep(100);
    return { nombre, especies };
  }
  // Pokédex: los números que aún no tienes (salen como «?????»)
  async function faltanEnPokedex() {
    try {
      const html = await (await fetch('/pokedex', { credentials: 'include' })).text();
      const t = new DOMParser().parseFromString(html, 'text/html').body.textContent.replace(/\s+/g, ' ');
      return [...t.matchAll(/#(\d{1,4})\s*\?{3,}/g)].map(m => +m[1]);
    } catch { return []; }
  }

  let buscando = false, msg = '';
  async function buscar() {
    if (buscando) return;
    buscando = true; msg = 'Abriendo el mapa…'; pintar();
    try {
      if (!(await abrirMapaCompleto())) { msg = 'No encuentro «Ver mapa completo».'; return; }
      const reg = region() || 'región';
      const filas = botonesFauna().map(b => { const fila = b.previousElementSibling; return { b, nombre: nombreTramo(b), t: texto(fila), fila }; });
      // solo los tramos con algo que falta (y los bloqueados, que no dicen cuántos)
      const mirar = filas.filter(f => /faltan\s*\d+/i.test(f.t) || /bloquead/i.test(f.t));
      const res = { region: reg, fecha: Date.now(), tramos: [] };
      let k = 0;
      for (const f of mirar) {
        k++; msg = `Mirando la fauna de ${f.nombre} (${k}/${mirar.length})…`; pintar();
        const b = botonesFauna().find(x => nombreTramo(x) === f.nombre);
        if (!b) continue;
        const r = await leerTramo(b);
        if (!r) continue;
        const faltan = r.especies.filter(e => e.falta);
        res.tramos.push({ nombre: f.nombre, bloqueado: /bloquead/i.test(f.t), visitado: !/sin visitar/i.test(f.t), nivel: (r.especies[0] && r.especies[0].nivel) || '', faltan, todas: r.especies.map(e => e.num) });
        await sleep(250);
      }
      msg = 'Mirando la Pokédex…'; pintar();
      const dex = await faltanEnPokedex();
      const vistas = new Set(res.tramos.flatMap(t => t.todas));
      res.sinTramo = dex.filter(n => !vistas.has(n));
      const todos = lsGet(LS, {}); todos[reg] = res; lsPut(LS, todos);
      msg = '';
    } catch (e) { console.warn('[pokedex]', e); msg = '⚠ ' + (e && e.message); }
    finally { buscando = false; pintar(); }
  }
  async function viajar(nombre) {
    if (!(await abrirMapaCompleto())) return;
    const b = botonesFauna().find(x => nombreTramo(x) === nombre);
    const fila = b && b.previousElementSibling;
    if (fila && !fila.disabled) fila.click();
  }

  function pintar() {
    const p = document.getElementById(PANEL_ID);
    if (!p) return;
    const reg = region(), res = (lsGet(LS, {}) || {})[reg];
    p.querySelector('.axp-buscar').textContent = buscando ? '⏳ Buscando…' : res ? '🔄 Volver a mirar' : '🔎 Qué me falta y dónde';
    p.querySelector('.axp-buscar').disabled = buscando;
    const out = p.querySelector('.axp-out');
    if (msg || !res) { out.innerHTML = `<p style="color:#9fb0c8">${esc(msg || 'Abre la fauna de cada tramo (sin viajar) y te dice a qué tramos ir para completar la Pokédex de esta región.')}</p>`; return; }
    // por tramo: los que más te faltan (y con más % juntos) primero
    const tramos = res.tramos.filter(t => t.faltan.length).sort((a, b) => b.faltan.length - a.faltan.length || b.faltan.reduce((s, e) => s + e.pct, 0) - a.faltan.reduce((s, e) => s + e.pct, 0));
    // mejor sitio para cada especie (el de más %)
    const mejor = {};
    for (const t of res.tramos) for (const e of t.faltan) if (!mejor[e.num] || e.pct > mejor[e.num].pct) mejor[e.num] = { ...e, tramo: t.nombre, bloqueado: t.bloqueado };
    const especies = Object.values(mejor).length;
    let h = `<p style="margin:4px 0;color:#c9d3e3"><b>${especies}</b> especie(s) que te faltan salen en <b>${tramos.length}</b> tramo(s) de ${esc(reg)}.${res.sinTramo && res.sinTramo.length ? ` Y <b>${res.sinTramo.length}</b> no salen en ningún tramo.` : ''} <span style="color:#6b7a93">(mirado ${new Date(res.fecha).toLocaleString('es-ES', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })})</span></p>`;
    h += tramos.map(t => `<div style="border-top:1px solid #2E3B57;padding:6px 0;display:flex;gap:8px;align-items:center">
        <div style="flex:1;min-width:0"><b>${esc(t.nombre)}</b> <span style="color:#6b7a93">${esc(t.nivel)}${t.bloqueado ? ' · 🔒 bloqueado' : !t.visitado ? ' · sin visitar' : ''}</span><br>
        ${t.faltan.sort((a, b) => b.pct - a.pct).map(e => `<span title="${esc(e.rareza)}">${esc(e.nombre || NOMBRES[e.num] || '#' + e.num)} <b>${e.pct}%</b>${mejor[e.num] && mejor[e.num].tramo !== t.nombre ? '<span style="color:#6b7a93">*</span>' : ''}</span>`).join(' · ')}</div>
        ${t.bloqueado ? '' : `<button type="button" class="axp-ir" data-t="${esc(t.nombre)}" style="background:#2E3B57;color:#fff;border-radius:12px;padding:4px 10px;font-weight:800">✈️ Ir</button>`}</div>`).join('');
    if (res.sinTramo && res.sinTramo.length) h += `<p style="border-top:1px solid #2E3B57;padding-top:6px;color:#9fb0c8"><b>No salen en ningún tramo</b> (evolución, huevo, intercambio o evento): ${res.sinTramo.map(n => esc(NOMBRES[n] || '#' + n)).join(', ')}.</p>`;
    if (tramos.some(t => t.faltan.some(e => mejor[e.num].tramo !== t.nombre))) h += '<p style="color:#6b7a93;font-size:10px">* sale más a menudo en otro tramo.</p>';
    out.innerHTML = h;
    $$('.axp-ir', out).forEach(b => b.addEventListener('click', () => viajar(b.dataset.t)));
  }
  function montar() {
    if (document.getElementById(PANEL_ID)) return;
    const ancla = $$('main button').find(x => /ver mapa completo/i.test(texto(x)));
    const sec = ancla && (ancla.closest('section') || ancla.parentElement.parentElement);
    if (!sec) return;
    const p = document.createElement('section');
    p.id = PANEL_ID;
    p.setAttribute('data-ax-ignore', '');
    p.style.cssText = 'background:#131A2B;border:2px solid #2E3B57;color:#C9D3E3;border-radius:22px;padding:12px;font-size:12px;line-height:1.45;margin:0 0 12px';
    p.innerHTML = `<div style="display:flex;align-items:center;gap:8px"><b style="flex:1">📕 Cazador de Pokédex</b>
      <button type="button" class="axp-buscar" style="background:#2E3B57;color:#fff;border-radius:12px;padding:4px 10px;font-weight:800"></button></div>
      <div class="axp-out" style="margin-top:6px;max-height:340px;overflow:auto"></div>
      <p style="margin-top:4px;font-size:10px;color:#6b7a93">Cazador de Pokédex v${VERSION}</p>`;
    p.querySelector('.axp-buscar').addEventListener('click', () => buscar());
    sec.insertAdjacentElement('beforebegin', p);
    pintar();
  }
  esperarHidratacion().then(() => {
    setInterval(() => { if (enMapa()) montar(); }, 1500);
    if (enMapa()) montar();
  });
  window.__axPokedex = { buscar, faltanEnPokedex };
})();
