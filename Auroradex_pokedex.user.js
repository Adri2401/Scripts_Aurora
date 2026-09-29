// ==UserScript==
// @name         Aurora Dex · Cazador de Pokédex
// @namespace    auroradex-pokedex
// @version      1.1.0
// @description  «🎯 Ir a por…» (en el mapa y en la Pokédex): toca un Pokémon que te falta, o añade cualquiera a tu lista (p. ej. Rayquaza), y te lleva a su región y al tramo donde más sale (con el «Donde aparece» de la Pokédex del juego). En el mapa (/mapa): «🔎 Qué me falta y dónde» abre la fauna de cada tramo de la región (sin viajar), junta las especies que te faltan con su % de salir y su nivel, y te dice a qué tramos ir (los que más te faltan, primero) con un botón para viajar allí (es gratis). También dice qué especies de la Pokédex no salen en ningún tramo (evolución, huevo o evento). Lo recuerda por región.
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
  const VERSION = '1.1.0';
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

  /* ══════════ Ir a por un Pokémon: a su región y al tramo donde más sale ══════════
   * Cada especie es de una región (por su número). Se viaja a esa región si hace falta, se abre su ficha en la Pokédex
   * del juego («Donde aparece»: los tramos con su %) y se pulsa «Ir» en el tramo desbloqueado donde más sale. Va paso a
   * paso aunque la página cambie (en el sessionStorage de la pestaña). */
  const REGIONES = [['Kanto', 1, 151], ['Johto', 152, 251], ['Hoenn', 252, 386], ['Sinnoh', 387, 493], ['Teselia', 494, 649]];
  const regionDe = n => (REGIONES.find(([, a, b]) => n >= a && n <= b) || [])[0] || null;
  const SS_IR = 'axp-ir', LS_SEGUIR = 'axp-seguir', LS_DEX = 'axp-dex-faltan';
  const ssJ = k => { try { return JSON.parse(sessionStorage.getItem(k) || 'null'); } catch { return null; } };
  const ssW = (k, v) => { try { if (v == null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, JSON.stringify(v)); } catch { /* nada */ } };
  const norm = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9♀♂]+/g, '');
  const numDeNombre = t => {
    const q = norm(t); if (!q) return 0;
    const n = +String(t).trim().replace(/^#/, ''); if (n >= 1 && n <= 649) return n;
    for (const [k, v] of Object.entries(NOMBRES)) if (+k <= 649 && norm(v) === q) return +k;
    for (const [k, v] of Object.entries(NOMBRES)) if (+k <= 649 && norm(v).startsWith(q)) return +k;
    return 0;
  };
  function aviso(t, tipo = 'info') {
    try {
      let box = document.getElementById('axp-toast');
      if (!box) { box = document.createElement('div'); box.id = 'axp-toast'; box.setAttribute('data-ax-ignore', ''); document.body.appendChild(box); }
      box.style.cssText = `position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 12px);transform:translateX(-50%);z-index:2147483600;max-width:min(380px,calc(100vw - 20px));padding:9px 14px;border-radius:14px;font:800 12.5px/1.35 system-ui,sans-serif;color:#fff;background:${tipo === 'mal' ? '#C0392B' : tipo === 'ok' ? '#2FA84F' : '#34405C'};box-shadow:0 10px 24px -10px rgba(0,0,0,.6)`;
      box.textContent = t;
      clearTimeout(box._t); box._t = setTimeout(() => box.remove(), tipo === 'info' ? 4500 : 8000);
    } catch { /* nada */ }
  }
  async function regionActual() {
    try {
      const h = await (await fetch('/menu', { credentials: 'include' })).text();
      const m = h.replace(/<!--.*?-->/g, '').match(/Est[aá]s en\s*(Kanto|Johto|Hoenn|Sinnoh|Teselia)/i);
      return m ? m[1][0].toUpperCase() + m[1].slice(1).toLowerCase() : null;
    } catch { return null; }
  }
  async function irA(num) {
    num = +num;
    const reg = regionDe(num);
    if (!reg) { aviso(`#${num}: esa especie no está en ninguna región del juego.`, 'mal'); return; }
    const nombre = NOMBRES[num] || '#' + num;
    ssW(SS_IR, { num, nombre, region: reg, fase: 'region', t: Date.now() });
    aviso(`🧭 Voy a por ${nombre} (${reg})…`);
    const cur = await regionActual();
    const ir = ssJ(SS_IR); if (!ir || ir.num !== num) return;
    if (cur === reg) { ir.fase = 'dex'; ssW(SS_IR, ir); location.assign('/pokedex'); }
    else location.assign('/johto');
  }
  let irOcupado = false;
  async function pasoIr() {
    const ir = ssJ(SS_IR);
    if (!ir || irOcupado) return;
    if (Date.now() - ir.t > 4 * 60000) { ssW(SS_IR, null); aviso(`⚠ No he podido llegar a ${ir.nombre}: se ha pasado el tiempo.`, 'mal'); return; }
    irOcupado = true;
    try {
      const path = location.pathname.replace(/\/+$/, '');
      if (ir.fase === 'region') {
        if (path !== '/johto') { location.assign('/johto'); return; }
        const txt = texto(document.querySelector('main'));
        const esta = (txt.match(/est[aá]s en\s*(Kanto|Johto|Hoenn|Sinnoh|Teselia)/i) || [])[1];
        if (esta && norm(esta) === norm(ir.region)) { ir.fase = 'dex'; ssW(SS_IR, ir); await sleep(600); location.assign('/pokedex'); return; }
        if (!ir.pulsado) {
          const b = $$('main button').find(x => !x.disabled && new RegExp(`(volver|viajar|ir|cruzar)\\s+a\\s+${ir.region}`, 'i').test(texto(x)));
          if (b) { ir.pulsado = Date.now(); ssW(SS_IR, ir); aviso(`🧭 Viajo a ${ir.region}…`); b.click(); }
        } else if (Date.now() - ir.pulsado > 20000) { ssW(SS_IR, null); aviso(`⚠ No he podido viajar a ${ir.region}.`, 'mal'); }
        return;
      }
      if (ir.fase === 'dex') {
        if (path !== '/pokedex') { location.assign('/pokedex'); return; }
        const hoja = [...document.querySelectorAll('div.fixed')].find(d => /donde aparece/i.test(texto(d)));
        if (!hoja) {
          // la región en los filtros de arriba y, en la lista, la tarjeta de la especie
          const chip = $$('main button').find(x => texto(x).startsWith(ir.region));
          if (chip && !ir.chip) { ir.chip = 1; ssW(SS_IR, ir); chip.click(); await sleep(1200); }
          const re = new RegExp('#0*' + ir.num + '(?!\\d)');
          const card = $$('main button').find(x => re.test(texto(x)));
          if (!card) { ir.buscando = (ir.buscando || 0) + 1; ssW(SS_IR, ir); if (ir.buscando > 12) { ssW(SS_IR, null); aviso(`⚠ No encuentro a ${ir.nombre} en la Pokédex.`, 'mal'); } return; }
          card.scrollIntoView({ block: 'center' }); card.click(); await sleep(1500); return;
        }
        // «Donde aparece»: el tramo desbloqueado donde más sale
        if (!$$('li', hoja).length && !/no aparece en estado salvaje/i.test(texto(hoja))) return;     // aún cargando
        const zonas = $$('li', hoja).map(li => {
          const t = texto(li), b = $$('button', li).find(x => /^ir$/i.test(texto(x)));
          const nom = li.querySelector('span span');
          return { nombre: (nom ? texto(nom) : t.split('Nv.')[0]).replace(/desvio$/i, '').trim(), pct: +((t.match(/(\d+)\s*%/) || [])[1] || 0), b };
        }).filter(z => z.pct || z.b);
        const libres = zonas.filter(z => z.b && !z.b.disabled).sort((a, b) => b.pct - a.pct);
        if (!libres.length) {
          ssW(SS_IR, null);
          if (/no aparece en estado salvaje/i.test(texto(hoja))) aviso(`${ir.nombre} no sale en estado salvaje (evoluciona, sale de un huevo o de un evento).`, 'mal');
          else aviso(`${ir.nombre} solo sale en tramos que aún tienes bloqueados: ${zonas.map(z => z.nombre).join(', ')}.`, 'mal');
          return;
        }
        const z = libres[0];
        ir.fase = 'llegando'; ir.zona = z.nombre; ir.pct = z.pct; ir.tz = Date.now(); ssW(SS_IR, ir);
        aviso(`📍 ${ir.nombre}: a ${z.nombre} (~${z.pct}% de los encuentros${libres.length > 1 ? `; también en ${libres.slice(1, 3).map(x => `${x.nombre} ${x.pct}%`).join(', ')}` : ''}).`);
        z.b.click();
        return;
      }
      if (ir.fase === 'llegando') {
        if (path === '/mapa') { ssW(SS_IR, null); aviso(`✅ En ${ir.zona}: ${ir.nombre} sale en ~${ir.pct}% de los encuentros. ¡A explorar!`, 'ok'); }
        else if (Date.now() - (ir.tz || ir.t) > 15000) { ssW(SS_IR, null); aviso(`⚠ No he podido llegar a ${ir.zona}.`, 'mal'); }
      }
    } catch (e) { console.warn('[pokedex ir]', e); }
    finally { irOcupado = false; }
  }
  // Pokédex: lo que te falta de cada región (al abrir la Pokédex se miran los filtros de las regiones con huecos)
  const leerFaltanAqui = () => $$('main button').map(b => (texto(b).match(/^#0*(\d{1,4})\s*\?{3,}/) || [])[1]).filter(Boolean).map(Number);
  let dexMirando = false;
  async function mirarDex() {
    if (dexMirando || location.pathname.replace(/\/+$/, '') !== '/pokedex' || ssJ(SS_IR)) return;
    dexMirando = true;
    try {
      const chips = () => $$('main button').map(b => ({ b, t: texto(b) })).filter(x => REGIONES.some(([g]) => x.t.startsWith(g)) && /\d+\s*\/\s*\d+/.test(x.t));
      if (!chips().length) return;
      const dex = lsGet(LS_DEX, {});
      for (const [g] of REGIONES) {
        const c = chips().find(x => x.t.startsWith(g)); if (!c) continue;
        const m = c.t.match(/(\d+)\s*\/\s*(\d+)/);
        if (!(m && +m[1] < +m[2])) { dex[g] = []; continue; }
        c.b.click(); await sleep(1100);
        dex[g] = leerFaltanAqui().filter(n => regionDe(n) === g);
      }
      dex.t = Date.now(); lsPut(LS_DEX, dex);
      pintarIr();
    } finally { dexMirando = false; }
  }
  const faltanTodas = () => { const d = lsGet(LS_DEX, {}); return REGIONES.flatMap(([g]) => d[g] || []); };

  // Panel «🎯 Ir a por…» (en el mapa y en la Pokédex): lo que te falta y tu lista, y un buscador para añadir cualquiera
  const IR_CSS = `
    #axp-ir-panel{background:#131A2B;border:2px solid #2E3B57;color:#C9D3E3;border-radius:20px;padding:10px 12px;font-size:12px;line-height:1.4;margin:0 0 12px}
    #axp-ir-panel .t{display:flex;align-items:center;gap:8px;margin-bottom:6px}
    #axp-ir-panel .t b{flex:1;font-size:13px}
    #axp-ir-panel .bus{display:flex;gap:6px}
    #axp-ir-panel input{flex:1;min-width:0;background:#0C1120;border:1.5px solid #2E3B57;border-radius:12px;color:#fff;padding:6px 10px;font:700 12px system-ui,sans-serif;outline:none}
    #axp-ir-panel input:focus{border-color:#5B8DEF}
    #axp-ir-panel button.p{background:#2E3B57;color:#fff;border:0;border-radius:12px;padding:5px 10px;font-weight:800;cursor:pointer}
    #axp-ir-panel .sec{margin:8px 0 0;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.05em;color:#6b7a93}
    #axp-ir-panel .chips{display:flex;flex-wrap:wrap;gap:5px;margin-top:4px}
    #axp-ir-panel .ch{display:inline-flex;align-items:center;gap:4px;padding:2px 6px 2px 2px;border-radius:999px;background:#1E2840;border:1.5px solid #2E3B57;color:#E6ECF7;font-weight:800;font-size:11px;cursor:pointer}
    #axp-ir-panel .ch:hover{border-color:#5B8DEF}
    #axp-ir-panel .ch img{width:26px;height:26px;image-rendering:pixelated}
    #axp-ir-panel .ch small{color:#8FA3C2;font-weight:700}
    #axp-ir-panel .ch .x{margin-left:2px;width:16px;height:16px;border-radius:999px;display:grid;place-items:center;font-size:9px;background:#2E3B57;color:#C9D3E3}
    #axp-ir-panel .nada{color:#6b7a93}`;
  const chipHTML = (n, quitar) => `<span class="ch" data-ir="${n}" title="Llévame a donde más sale ${esc(NOMBRES[n] || '#' + n)} (${regionDe(n)})"><img src="/sprites/${n}.png" alt="" loading="lazy">${esc(NOMBRES[n] || '#' + n)} <small>${regionDe(n)}</small>${quitar ? `<span class="x" data-quitar="${n}" title="Quitar de tu lista">✕</span>` : ''}</span>`;
  function pintarIr() {
    const p = document.getElementById('axp-ir-panel'); if (!p) return;
    const ir = ssJ(SS_IR), faltan = faltanTodas(), seguir = lsGet(LS_SEGUIR, []);
    const html = `${ir ? `<p style="color:#8FD08F;font-weight:800;margin:4px 0 0">🧭 Yendo a por ${esc(ir.nombre)}${ir.zona ? ' → ' + esc(ir.zona) : ''}…</p>` : ''}
      <p class="sec">Te faltan${faltan.length ? ` (${faltan.length})` : ''}</p>
      <div class="chips">${faltan.length ? faltan.map(n => chipHTML(n)).join('') : `<span class="nada">${lsGet(LS_DEX, null) ? '¡Nada! Las tienes todas.' : 'Abre la Pokédex una vez y lo apunto.'}</span>`}</div>
      <p class="sec">Tu lista</p>
      <div class="chips">${seguir.length ? seguir.map(n => chipHTML(n, true)).join('') : '<span class="nada">Añade cualquier Pokémon con el buscador (p. ej. Rayquaza) y tócalo para ir.</span>'}</div>`;
    const out = p.querySelector('.out');
    if (out.dataset.h !== html) { out.dataset.h = html; out.innerHTML = html; }
  }
  function montarIr() {
    const path = location.pathname.replace(/\/+$/, '');
    if (!['/mapa', '/pokedex'].includes(path) || document.getElementById('axp-ir-panel')) return;
    const main = document.querySelector('main');
    let ancla = path === '/mapa' ? document.getElementById(PANEL_ID) : null;
    if (path === '/pokedex') {                                       // justo debajo de la cabecera «Pokédex de …»
      let e = document.querySelector('main input[placeholder*="Buscar"]');
      while (e && e.parentElement && e.parentElement !== main && !/Pokédex de/.test(e.textContent)) e = e.parentElement;
      ancla = e && /Pokédex de/.test(e.textContent) ? e : main && main.firstElementChild;
    }
    if (!ancla) return;
    if (!document.getElementById('axp-ir-css')) { const st = document.createElement('style'); st.id = 'axp-ir-css'; st.textContent = IR_CSS; document.head.appendChild(st); }
    const p = document.createElement('section');
    p.id = 'axp-ir-panel'; p.setAttribute('data-ax-ignore', '');
    const lista = Object.entries(NOMBRES).filter(([k]) => +k <= 649).map(([k, v]) => `<option value="${esc(v)}">#${k}</option>`).join('');
    p.innerHTML = `<div class="t"><b>🎯 Ir a por…</b>${path === '/pokedex' ? '<button type="button" class="p axp-mirar" title="Mira qué te falta en cada región">🔄</button>' : ''}</div>
      <div class="bus"><input class="axp-q" list="axp-nombres" placeholder="Un Pokémon (Rayquaza, #384…)" autocomplete="off"><button type="button" class="p axp-ir">Ir</button><button type="button" class="p axp-add" title="Añadir a tu lista">➕</button></div>
      <datalist id="axp-nombres">${lista}</datalist>
      <div class="out"></div>`;
    const q = p.querySelector('.axp-q');
    const elegido = () => { const n = numDeNombre(q.value); if (!n) aviso(`No conozco «${q.value}».`, 'mal'); return n; };
    p.querySelector('.axp-ir').addEventListener('click', () => { const n = elegido(); if (n) irA(n); });
    p.querySelector('.axp-add').addEventListener('click', () => { const n = elegido(); if (!n) return; const s = lsGet(LS_SEGUIR, []); if (!s.includes(n)) s.push(n); lsPut(LS_SEGUIR, s); q.value = ''; pintarIr(); });
    q.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); const n = elegido(); if (n) irA(n); } });
    const mir = p.querySelector('.axp-mirar'); if (mir) mir.addEventListener('click', () => mirarDex());
    p.querySelector('.out').addEventListener('click', e => {
      const x = e.target.closest('[data-quitar]');
      if (x) { e.stopPropagation(); lsPut(LS_SEGUIR, lsGet(LS_SEGUIR, []).filter(n => n !== +x.dataset.quitar)); pintarIr(); return; }
      const c = e.target.closest('[data-ir]'); if (c) irA(+c.dataset.ir);
    });
    if (path === '/mapa') ancla.insertAdjacentElement('beforebegin', p); else ancla.insertAdjacentElement('afterend', p);
    pintarIr();
    if (path === '/pokedex' && !(lsGet(LS_DEX, {}).t > Date.now() - 6 * 3600000)) setTimeout(mirarDex, 1500);
  }

  esperarHidratacion().then(() => {
    setInterval(() => { if (enMapa()) montar(); montarIr(); pintarIr(); pasoIr(); }, 900);
    if (enMapa()) montar();
    montarIr(); pasoIr();
  });
  window.__axPokedex = { buscar, faltanEnPokedex, irA, mirarDex };
})();
