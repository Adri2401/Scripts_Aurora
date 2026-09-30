// ==UserScript==
// @name         Aurora Dex · Cazador de Pokédex
// @namespace    auroradex-pokedex
// @version      1.4.1
// @description  «🎯 Ir a por…» en la Pokédex: toca un Pokémon que te falta, o añade cualquiera a tu lista (p. ej. Rayquaza), y te lleva a su región y al tramo donde más sale (con el «Donde aparece» de la Pokédex del juego).
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
  const NOMBRES_DATOS = 'Bulbasaur|Ivysaur|Venusaur|Charmander|Charmeleon|Charizard|Squirtle|Wartortle|Blastoise|Caterpie|Metapod|Butterfree|Weedle|Kakuna|Beedrill|Pidgey|Pidgeotto|Pidgeot|Rattata|Raticate|Spearow|Fearow|Ekans|Arbok|Pikachu|Raichu|Sandshrew|Sandslash|Nidoran♀|Nidorina|Nidoqueen|Nidoran♂|Nidorino|Nidoking|Clefairy|Clefable|Vulpix|Ninetales|Jigglypuff|Wigglytuff|Zubat|Golbat|Oddish|Gloom|Vileplume|Paras|Parasect|Venonat|Venomoth|Diglett|Dugtrio|Meowth|Persian|Psyduck|Golduck|Mankey|Primeape|Growlithe|Arcanine|Poliwag|Poliwhirl|Poliwrath|Abra|Kadabra|Alakazam|Machop|Machoke|Machamp|Bellsprout|Weepinbell|Victreebel|Tentacool|Tentacruel|Geodude|Graveler|Golem|Ponyta|Rapidash|Slowpoke|Slowbro|Magnemite|Magneton|Farfetch’d|Doduo|Dodrio|Seel|Dewgong|Grimer|Muk|Shellder|Cloyster|Gastly|Haunter|Gengar|Onix|Drowzee|Hypno|Krabby|Kingler|Voltorb|Electrode|Exeggcute|Exeggutor|Cubone|Marowak|Hitmonlee|Hitmonchan|Lickitung|Koffing|Weezing|Rhyhorn|Rhydon|Chansey|Tangela|Kangaskhan|Horsea|Seadra|Goldeen|Seaking|Staryu|Starmie|Mr. Mime|Scyther|Jynx|Electabuzz|Magmar|Pinsir|Tauros|Magikarp|Gyarados|Lapras|Ditto|Eevee|Vaporeon|Jolteon|Flareon|Porygon|Omanyte|Omastar|Kabuto|Kabutops|Aerodactyl|Snorlax|Articuno|Zapdos|Moltres|Dratini|Dragonair|Dragonite|Mewtwo|Mew|Chikorita|Bayleef|Meganium|Cyndaquil|Quilava|Typhlosion|Totodile|Croconaw|Feraligatr|Sentret|Furret|Hoothoot|Noctowl|Ledyba|Ledian|Spinarak|Ariados|Crobat|Chinchou|Lanturn|Pichu|Cleffa|Igglybuff|Togepi|Togetic|Natu|Xatu|Mareep|Flaaffy|Ampharos|Bellossom|Marill|Azumarill|Sudowoodo|Politoed|Hoppip|Skiploom|Jumpluff|Aipom|Sunkern|Sunflora|Yanma|Wooper|Quagsire|Espeon|Umbreon|Murkrow|Slowking|Misdreavus|Unown|Wobbuffet|Girafarig|Pineco|Forretress|Dunsparce|Gligar|Steelix|Snubbull|Granbull|Qwilfish|Scizor|Shuckle|Heracross|Sneasel|Teddiursa|Ursaring|Slugma|Magcargo|Swinub|Piloswine|Corsola|Remoraid|Octillery|Delibird|Mantine|Skarmory|Houndour|Houndoom|Kingdra|Phanpy|Donphan|Porygon2|Stantler|Smeargle|Tyrogue|Hitmontop|Smoochum|Elekid|Magby|Miltank|Blissey|Raikou|Entei|Suicune|Larvitar|Pupitar|Tyranitar|Lugia|Ho-Oh|Celebi|Treecko|Grovyle|Sceptile|Torchic|Combusken|Blaziken|Mudkip|Marshtomp|Swampert|Poochyena|Mightyena|Zigzagoon|Linoone|Wurmple|Silcoon|Beautifly|Cascoon|Dustox|Lotad|Lombre|Ludicolo|Seedot|Nuzleaf|Shiftry|Taillow|Swellow|Wingull|Pelipper|Ralts|Kirlia|Gardevoir|Surskit|Masquerain|Shroomish|Breloom|Slakoth|Vigoroth|Slaking|Nincada|Ninjask|Shedinja|Whismur|Loudred|Exploud|Makuhita|Hariyama|Azurill|Nosepass|Skitty|Delcatty|Sableye|Mawile|Aron|Lairon|Aggron|Meditite|Medicham|Electrike|Manectric|Plusle|Minun|Volbeat|Illumise|Roselia|Gulpin|Swalot|Carvanha|Sharpedo|Wailmer|Wailord|Numel|Camerupt|Torkoal|Spoink|Grumpig|Spinda|Trapinch|Vibrava|Flygon|Cacnea|Cacturne|Swablu|Altaria|Zangoose|Seviper|Lunatone|Solrock|Barboach|Whiscash|Corphish|Crawdaunt|Baltoy|Claydol|Lileep|Cradily|Anorith|Armaldo|Feebas|Milotic|Castform|Kecleon|Shuppet|Banette|Duskull|Dusclops|Tropius|Chimecho|Absol|Wynaut|Snorunt|Glalie|Spheal|Sealeo|Walrein|Clamperl|Huntail|Gorebyss|Relicanth|Luvdisc|Bagon|Shelgon|Salamence|Beldum|Metang|Metagross|Regirock|Regice|Registeel|Latias|Latios|Kyogre|Groudon|Rayquaza|Jirachi|Deoxys|Turtwig|Grotle|Torterra|Chimchar|Monferno|Infernape|Piplup|Prinplup|Empoleon|Starly|Staravia|Staraptor|Bidoof|Bibarel|Kricketot|Kricketune|Shinx|Luxio|Luxray|Budew|Roserade|Cranidos|Rampardos|Shieldon|Bastiodon|Burmy|Wormadam|Mothim|Combee|Vespiquen|Pachirisu|Buizel|Floatzel|Cherubi|Cherrim|Shellos|Gastrodon|Ambipom|Drifloon|Drifblim|Buneary|Lopunny|Mismagius|Honchkrow|Glameow|Purugly|Chingling|Stunky|Skuntank|Bronzor|Bronzong|Bonsly|Mime Jr.|Happiny|Chatot|Spiritomb|Gible|Gabite|Garchomp|Munchlax|Riolu|Lucario|Hippopotas|Hippowdon|Skorupi|Drapion|Croagunk|Toxicroak|Carnivine|Finneon|Lumineon|Mantyke|Snover|Abomasnow|Weavile|Magnezone|Lickilicky|Rhyperior|Tangrowth|Electivire|Magmortar|Togekiss|Yanmega|Leafeon|Glaceon|Gliscor|Mamoswine|Porygon-Z|Gallade|Probopass|Dusknoir|Froslass|Rotom|Uxie|Mesprit|Azelf|Dialga|Palkia|Heatran|Regigigas|Giratina|Cresselia|Phione|Manaphy|Darkrai|Shaymin|Arceus|Victini|Snivy|Servine|Serperior|Tepig|Pignite|Emboar|Oshawott|Dewott|Samurott|Patrat|Watchog|Lillipup|Herdier|Stoutland|Purrloin|Liepard|Pansage|Simisage|Pansear|Simisear|Panpour|Simipour|Munna|Musharna|Pidove|Tranquill|Unfezant|Blitzle|Zebstrika|Roggenrola|Boldore|Gigalith|Woobat|Swoobat|Drilbur|Excadrill|Audino|Timburr|Gurdurr|Conkeldurr|Tympole|Palpitoad|Seismitoad|Throh|Sawk|Sewaddle|Swadloon|Leavanny|Venipede|Whirlipede|Scolipede|Cottonee|Whimsicott|Petilil|Lilligant|Basculin|Sandile|Krokorok|Krookodile|Darumaka|Darmanitan|Maractus|Dwebble|Crustle|Scraggy|Scrafty|Sigilyph|Yamask|Cofagrigus|Tirtouga|Carracosta|Archen|Archeops|Trubbish|Garbodor|Zorua|Zoroark|Minccino|Cinccino|Gothita|Gothorita|Gothitelle|Solosis|Duosion|Reuniclus|Ducklett|Swanna|Vanillite|Vanillish|Vanilluxe|Deerling|Sawsbuck|Emolga|Karrablast|Escavalier|Foongus|Amoonguss|Frillish|Jellicent|Alomomola|Joltik|Galvantula|Ferroseed|Ferrothorn|Klink|Klang|Klinklang|Tynamo|Eelektrik|Eelektross|Elgyem|Beheeyem|Litwick|Lampent|Chandelure|Axew|Fraxure|Haxorus|Cubchoo|Beartic|Cryogonal|Shelmet|Accelgor|Stunfisk|Mienfoo|Mienshao|Druddigon|Golett|Golurk|Pawniard|Bisharp|Bouffalant|Rufflet|Braviary|Vullaby|Mandibuzz|Heatmor|Durant|Deino|Zweilous|Hydreigon|Larvesta|Volcarona|Cobalion|Terrakion|Virizion|Tornadus|Thundurus|Reshiram|Zekrom|Landorus|Kyurem|Keldeo|Meloetta|Genesect|Chespin|Quilladin|Chesnaught|Fennekin|Braixen|Delphox|Froakie|Frogadier|Greninja|Bunnelby|Diggersby|Fletchling|Fletchinder|Talonflame|Scatterbug|Spewpa|Vivillon|Litleo|Pyroar|Flabébé|Floette|Florges|Skiddo|Gogoat|Pancham|Pangoro|Furfrou|Espurr|Meowstic|Honedge|Doublade|Aegislash|Spritzee|Aromatisse|Swirlix|Slurpuff|Inkay|Malamar|Binacle|Barbaracle|Skrelp|Dragalge|Clauncher|Clawitzer|Helioptile|Heliolisk|Tyrunt|Tyrantrum|Amaura|Aurorus|Sylveon|Hawlucha|Dedenne|Carbink|Goomy|Sliggoo|Goodra|Klefki|Phantump|Trevenant|Pumpkaboo|Gourgeist|Bergmite|Avalugg|Noibat|Noivern|Xerneas|Yveltal|Zygarde|Diancie|Hoopa|Volcanion|Rowlet|Dartrix|Decidueye|Litten|Torracat|Incineroar|Popplio|Brionne|Primarina|Pikipek|Trumbeak|Toucannon|Yungoos|Gumshoos|Grubbin|Charjabug|Vikavolt|Crabrawler|Crabominable|Oricorio|Cutiefly|Ribombee|Rockruff|Lycanroc|Wishiwashi|Mareanie|Toxapex|Mudbray|Mudsdale|Dewpider|Araquanid|Fomantis|Lurantis|Morelull|Shiinotic|Salandit|Salazzle|Stufful|Bewear|Bounsweet|Steenee|Tsareena|Comfey|Oranguru|Passimian|Wimpod|Golisopod|Sandygast|Palossand|Pyukumuku|Código Cero/Type: Null|Silvally|Minior|Komala|Turtonator|Togedemaru|Mimikyu|Bruxish|Drampa|Dhelmise|Jangmo-o|Hakamo-o|Kommo-o|Tapu Koko|Tapu Lele|Tapu Bulu|Tapu Fini|Cosmog|Cosmoem|Solgaleo|Lunala|Nihilego|Buzzwole|Pheromosa|Xurkitree|Celesteela|Kartana|Guzzlord|Necrozma|Magearna|Marshadow|Poipole|Naganadel|Stakataka|Blacephalon|Zeraora|Meltan|Melmetal|Grookey|Thwackey|Rillaboom|Scorbunny|Raboot|Cinderace|Sobble|Drizzile|Inteleon|Skwovet|Greedent|Rookidee|Corvisquire|Corviknight|Blipbug|Dottler|Orbeetle|Nickit|Thievul|Gossifleur|Eldegoss|Wooloo|Dubwool|Chewtle|Drednaw|Yamper|Boltund|Rolycoly|Carkol|Coalossal|Applin|Flapple|Appletun|Silicobra|Sandaconda|Cramorant|Arrokuda|Barraskewda|Toxel|Toxtricity|Sizzlipede|Centiskorch|Clobbopus|Grapploct|Sinistea|Polteageist|Hatenna|Hattrem|Hatterene|Impidimp|Morgrem|Grimmsnarl|Obstagoon|Perrserker|Cursola|Sirfetch’d|Mr. Rime|Runerigus|Milcery|Alcremie|Falinks|Pincurchin|Snom|Frosmoth|Stonjourner|Eiscue|Indeedee|Morpeko|Cufant|Copperajah|Dracozolt|Arctozolt|Dracovish|Arctovish|Duraludon|Dreepy|Drakloak|Dragapult|Zacian|Zamazenta|Eternatus|Kubfu|Urshifu|Zarude|Regieleki|Regidrago|Glastrier|Spectrier|Calyrex|Wyrdeer|Kleavor|Ursaluna|Basculegion|Sneasler|Overqwil|Enamorus|Sprigatito|Floragato|Meowscarada|Fuecoco|Crocalor|Skeledirge|Quaxly|Quaxwell|Quaquaval|Lechonk|Oinkologne|Tarountula|Spidops|Nymble|Lokix|Pawmi|Pawmo|Pawmot|Tandemaus|Maushold|Fidough|Dachsbun|Smoliv|Dolliv|Arboliva|Squawkabilly|Nacli|Naclstack|Garganacl|Charcadet|Armarouge|Ceruledge|Tadbulb|Bellibolt|Wattrel|Kilowattrel|Maschiff|Mabosstiff|Shroodle|Grafaiai|Bramblin|Brambleghast|Toedscool|Toedscruel|Klawf|Capsakid|Scovillain|Rellor|Rabsca|Flittle|Espathra|Tinkatink|Tinkatuff|Tinkaton|Wiglett|Wugtrio|Bombirdier|Finizen|Palafin|Varoom|Revavroom|Cyclizar|Orthworm|Glimmet|Glimmora|Greavard|Houndstone|Flamigo|Cetoddle|Cetitan|Veluza|Dondozo|Tatsugiri|Annihilape|Clodsire|Farigiraf|Dudunsparce|Kingambit|Colmilargo/Great Tusk|Colagrito/Scream Tail|Furioseta/Brute Bonnet|Melenaleteo/Flutter Mane|Reptalada/Slither Wing|Pelarena/Sandy Shocks|Ferrodada/Iron Treads|Ferrosaco/Iron Bundle|Ferropalmas/Iron Hands|Ferrocuello/Iron Jugulis|Ferropolilla/Iron Moth|Ferropúas/Iron Thorns|Frigibax|Arctibax|Baxcalibur|Gimmighoul|Gholdengo|Wo-Chien|Chien-Pao|Ting-Lu|Chi-Yu|Bramaluna/Roaring Moon|Ferropaladín/Iron Valiant|Koraidon|Miraidon|Ondulagua/Walking Wake|Ferroverdor/Iron Leaves|Dipplin|Poltchageist|Sinistcha|Okidogi|Munkidori|Fezandipiti|Ogerpon|Archaludon|Hydrapple|Flamariete/Gouging Fire|Electrofuria/Raging Bolt|Ferromole/Iron Boulder|Ferrotesta/Iron Crown|Terapagos|Pecharunt';
  const NOMBRES = {};
  NOMBRES_DATOS.split('|').forEach((s, i) => { NOMBRES[i + 1] = s.split('/')[0]; });
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const texto = el => (el && el.textContent || '').replace(/\s+/g, ' ').trim();
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } };
  const lsPut = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* nada */ } };
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
    if (irPidiendo) return;
    aviso(`🧭 Voy a por ${nombre} (${reg})…`);
    // primero mira dónde estás: si ya estás en su región no se toca el viaje
    irPidiendo = true;
    let cur; try { cur = await regionActual(); } finally { irPidiendo = false; }
    const aqui = cur === reg;
    ssW(SS_IR, { num, nombre, region: reg, fase: aqui ? 'dex' : 'region', t: Date.now() });
    if (aqui) { if (location.pathname.replace(/\/+$/, '') === '/pokedex') pasoIr(); else location.assign('/pokedex'); }
    else location.assign('/johto');
  }
  let irPidiendo = false;
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
          const chip = $$('main button').find(x => !x.closest('#axp-ir-panel') && texto(x).startsWith(ir.region));
          if (chip && !ir.chip) { ir.chip = 1; ssW(SS_IR, ir); chip.click(); await sleep(1200); }
          const re = new RegExp('#0*' + ir.num + '(?!\\d)');
          const card = $$('main button').find(x => !x.closest('#axp-ir-panel') && re.test(texto(x)));
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
          // no sale salvaje pero evoluciona de otro: se va a por la preevolución (hasta 2 saltos)
          const de = (texto(hoja).match(/Evoluciona de\s+(.+?)(?=\s*(?:›|Evoluciona|DONDE|Donde|$))/) || [])[1];
          const nDe = de ? numDeNombre(de) : 0;
          if (nDe && nDe !== ir.num && regionDe(nDe) && (ir.saltos || 0) < 2) {
            const cond = (texto(hoja).match(/Solo se consigue evolucionando a\s+[^.]+?(al llegar al Nv\.\s*\d+)/i) || [])[1];
            aviso(`🥚 ${ir.nombre} no sale salvaje: evoluciona de ${NOMBRES[nDe]}${cond ? ' ' + cond : ''}. Voy a por ${NOMBRES[nDe]}.`);
            const cerrar = $$('button', hoja).find(x => /^cerrar$/i.test(texto(x)));
            if (cerrar) cerrar.click();
            ssW(SS_IR, { num: nDe, nombre: NOMBRES[nDe], region: regionDe(nDe), fase: regionDe(nDe) === ir.region ? 'dex' : 'region', t: Date.now(), saltos: (ir.saltos || 0) + 1, chip: regionDe(nDe) === ir.region ? 1 : 0, para: ir.para || ir.nombre });
            await sleep(900);
            return;
          }
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
        if (path === '/mapa') { ssW(SS_IR, null); aviso(`✅ En ${ir.zona}: ${ir.nombre} sale en ~${ir.pct}% de los encuentros.${ir.para ? ` Evoluciónalo para tener a ${ir.para}.` : ''} ¡A explorar!`, 'ok'); }
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
  // Usa las clases de la propia Pokédex (tarjeta, buscador, pastillas) para que encaje con el tema de la página
  const IR_CSS = `
    #axp-ir-panel{margin:12px 0 0!important}
    #axp-ir-panel .t{display:flex;align-items:center;gap:8px}
    #axp-ir-panel .t h2{flex:1;margin:0}
    #axp-ir-panel .bus{display:flex;gap:8px}
    #axp-ir-panel .bus input{outline:none}
    #axp-ir-panel .sec{margin:12px 0 6px;text-transform:uppercase;letter-spacing:.06em}
    #axp-ir-panel .chips{display:flex;flex-wrap:wrap;gap:8px}
    #axp-ir-panel .ch{display:inline-flex;align-items:center;gap:4px;padding:2px 10px 2px 3px;cursor:pointer}
    #axp-ir-panel .ch img{width:28px;height:28px;image-rendering:pixelated}
    #axp-ir-panel .ch small{opacity:.65;font-weight:700}
    #axp-ir-panel .ch .x{margin-left:2px;width:18px;height:18px;border-radius:999px;display:grid;place-items:center;font-size:10px;background:rgba(127,127,127,.25)}
    #axp-ir-panel .yendo{color:#7BC96F;font-weight:800;margin:10px 0 0}`;
  const CL = { pill: 'pastilla border-2 transition border-lienzo bg-lienzo text-tinta-500 shadow-suave', rojo: 'pastilla border-2 transition border-rojo-500 bg-rojo-500 text-white', sub: 'text-xs font-bold text-tinta-400' };
  const chipHTML = (n, quitar) => `<span class="ch ${CL.pill}" data-ir="${n}" title="Llévame a donde más sale ${esc(NOMBRES[n] || '#' + n)} (${regionDe(n)})"><img src="/sprites/${n}.png" alt="" loading="lazy">${esc(NOMBRES[n] || '#' + n)} <small>${regionDe(n)}</small>${quitar ? `<span class="x" data-quitar="${n}" title="Quitar de tu lista">✕</span>` : ''}</span>`;
  function pintarIr() {
    const p = document.getElementById('axp-ir-panel'); if (!p) return;
    const ir = ssJ(SS_IR), faltan = faltanTodas(), seguir = lsGet(LS_SEGUIR, []);
    const html = `${ir ? `<p class="yendo">🧭 Yendo a por ${esc(ir.nombre)}${ir.zona ? ' → ' + esc(ir.zona) : ''}…</p>` : ''}
      <p class="sec ${CL.sub}">Te faltan${faltan.length ? ` (${faltan.length})` : ''}</p>
      <div class="chips">${faltan.length ? faltan.map(n => chipHTML(n)).join('') : `<span class="nada ${CL.sub}">${lsGet(LS_DEX, null) ? '¡Nada! Las tienes todas.' : 'Abre la Pokédex una vez y lo apunto.'}</span>`}</div>
      <p class="sec ${CL.sub}">Tu lista</p>
      <div class="chips">${seguir.length ? seguir.map(n => chipHTML(n, true)).join('') : `<span class="nada ${CL.sub}">Añade cualquier Pokémon con el buscador (p. ej. Rayquaza) y tócalo para ir.</span>`}</div>`;
    const out = p.querySelector('.out');
    if (out.dataset.h !== html) { out.dataset.h = html; out.innerHTML = html; }
  }
  function montarIr() {
    if (location.pathname.replace(/\/+$/, '') !== '/pokedex' || document.getElementById('axp-ir-panel')) return;
    const main = document.querySelector('main'), buscador = main && main.querySelector('input[placeholder*="Buscar"]');
    // justo debajo de la cabecera «Pokédex de …»
    let cab = buscador;
    while (cab && cab.parentElement && cab.parentElement !== main && !/Pokédex de/.test(cab.textContent)) cab = cab.parentElement;
    if (!cab || !/Pokédex de/.test(cab.textContent)) return;
    // copia las clases reales de la página por si cambian de nombre o de tema
    const h1 = cab.querySelector('h1'), btns = $$('button', cab);
    const pill = btns.find(x => !/rojo/.test(x.className)), rojo = btns.find(x => /rojo/.test(x.className)), sub = cab.querySelector('p');
    if (pill) CL.pill = pill.className.replace(/\bflex-1\b/, '');
    if (rojo) CL.rojo = rojo.className.replace(/\bflex-1\b/, '');
    if (sub) CL.sub = sub.className;
    if (!document.getElementById('axp-ir-css')) { const st = document.createElement('style'); st.id = 'axp-ir-css'; st.textContent = IR_CSS; document.head.appendChild(st); }
    const p = document.createElement('section');
    p.id = 'axp-ir-panel'; p.setAttribute('data-ax-ignore', '');
    p.className = cab.className;
    const lista = Object.entries(NOMBRES).filter(([k]) => +k <= 649).map(([k, v]) => `<option value="${esc(v)}">#${k}</option>`).join('');
    p.innerHTML = `<div class="t"><h2 class="${h1 ? esc(h1.className.replace(/text-xl/, 'text-lg')) : ''}">🎯 Ir a por…</h2><button type="button" class="${CL.pill} axp-mirar" title="Mira qué te falta en cada región">🔄 Mirar</button></div>
      <div class="bus"><input class="axp-q ${buscador ? esc(buscador.className) : ''}" list="axp-nombres" placeholder="Nombre o nº (Rayquaza, 384)" autocomplete="off"><button type="button" class="${CL.rojo} axp-ir">Ir</button><button type="button" class="${CL.pill} axp-add" title="Añadir a tu lista">➕</button></div>
      <datalist id="axp-nombres">${lista}</datalist>
      <div class="out"></div>`;
    const q = p.querySelector('.axp-q');
    const elegido = () => { const n = numDeNombre(q.value); if (!n) aviso(`No conozco «${q.value}».`, 'mal'); return n; };
    p.querySelector('.axp-ir').addEventListener('click', () => { const n = elegido(); if (n) irA(n); });
    p.querySelector('.axp-add').addEventListener('click', () => { const n = elegido(); if (!n) return; const s = lsGet(LS_SEGUIR, []); if (!s.includes(n)) s.push(n); lsPut(LS_SEGUIR, s); q.value = ''; pintarIr(); });
    q.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); const n = elegido(); if (n) irA(n); } });
    p.querySelector('.axp-mirar').addEventListener('click', () => mirarDex());
    p.querySelector('.out').addEventListener('click', e => {
      const x = e.target.closest('[data-quitar]');
      if (x) { e.stopPropagation(); lsPut(LS_SEGUIR, lsGet(LS_SEGUIR, []).filter(n => n !== +x.dataset.quitar)); pintarIr(); return; }
      const c = e.target.closest('[data-ir]'); if (c) irA(+c.dataset.ir);
    });
    cab.insertAdjacentElement('afterend', p);
    pintarIr();
    if (!(lsGet(LS_DEX, {}).t > Date.now() - 6 * 3600000)) setTimeout(mirarDex, 1500);
  }

  esperarHidratacion().then(() => {
    setInterval(() => { montarIr(); pintarIr(); pasoIr(); }, 900);
    montarIr(); pasoIr();
  });
  try { localStorage.removeItem('axp-faltan'); } catch { /* nada */ }     // lo que guardaba el antiguo panel del mapa
  window.__axPokedex = { irA, mirarDex };
})();
