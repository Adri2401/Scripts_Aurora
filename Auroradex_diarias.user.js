// ==UserScript==
// @name         Aurora Dex · Diarias (solas)
// @namespace    auroradex-diarias
// @version      1.25.0
// @description  Juega solo las diarias. «🤖 Robot de diarias» (icono de Accesos directos o botón del Menú): se queda encendido en segundo plano; cada día empieza de cero con las diarias y además hace el Huerto al acabar su cosecha, la Torre al acabar cada espera, los Tronos cuando te quedas sin ninguno, las Entrañas (una bajada tras otra hasta gastar los pases) el Subsuelo cuando vuelven a llenarse las vetas, el Valle (recoge con el almacén lleno para la hora punta ×2, gasta el Brillo y los puntos de investigación) y MissingNo. cuando está (y su ruleta cuando cae). Las diarias incluyen el Canal Manadas (encuentros gratis). Las diarias las juega todas (también Isla, Misiones, Solar, los Tronos si no tienes ninguno y las dos ligas de la Torre, esperando sus 15 min entre retos), en una ventana oculta de la misma pestaña, mientras tú sigues jugando; una tarjeta abajo dice por dónde va con el paso entre paréntesis (3/14), lo que ya estaba hecho, lo hecho y lo que queda (se puede minimizar o parar, y si recargas sigue). «¿Quién es ese Pokémon?»: lee el número de la Pokédex de la silueta, pulsa el nombre correcto y tira la ruleta con cada acierto. Cúpula Pokéathlon: reparte tus Pokémon entre las tres pruebas probando los 120 repartos y quedándose con el que más energía da de media (con el ±20% de suerte), y compite. El Muelle: echa el flotador y tira justo cuando pasa por el centro de la zona. Carreras de Rattata: elige rata según la pista (y aprende de tus carreras). Rutas submarinas: bombona y 12 bajadas a la zona que elijas. Tren de Biscuit: rebusca en la chatarra. La Cantera: martillo para buscar y pico para sacar las piezas enteras que salen más baratas. Álbum de Braulio: elige la base más currada, cinco veces. Casa Treta (Hoenn): la sube con su script. Botón «Jugar todas las diarias» en el menú: juega todas las pendientes una tras otra y luego viaja a cada región para hacer su Safari (con Safari Auto), la Casa Treta en Hoenn y el Tren en Teselia, y vuelve a la tuya. En casa además pasa por el Huerto (solo Meloc y Latano), el Valle («Hacerlo todo») y el Salón (los respiros del día) con sus scripts. Abriendo https://auroradex.es/menu?diarias=todas (p. ej. desde un atajo del móvil a una hora) la ruta arranca sola. Panel con lo que va haciendo y botón para parar.
// @match        https://auroradex.es/*
// @match        https://www.auroradex.es/*
// @updateURL    https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_diarias.user.js
// @downloadURL  https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/Auroradex_diarias.user.js
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  'use strict';
  // Pokédex nacional (1-1025): nombre en español y, si cambia, el inglés detrás de «/»
  const NOMBRES_DATOS = 'Bulbasaur|Ivysaur|Venusaur|Charmander|Charmeleon|Charizard|Squirtle|Wartortle|Blastoise|Caterpie|Metapod|Butterfree|Weedle|Kakuna|Beedrill|Pidgey|Pidgeotto|Pidgeot|Rattata|Raticate|Spearow|Fearow|Ekans|Arbok|Pikachu|Raichu|Sandshrew|Sandslash|Nidoran♀|Nidorina|Nidoqueen|Nidoran♂|Nidorino|Nidoking|Clefairy|Clefable|Vulpix|Ninetales|Jigglypuff|Wigglytuff|Zubat|Golbat|Oddish|Gloom|Vileplume|Paras|Parasect|Venonat|Venomoth|Diglett|Dugtrio|Meowth|Persian|Psyduck|Golduck|Mankey|Primeape|Growlithe|Arcanine|Poliwag|Poliwhirl|Poliwrath|Abra|Kadabra|Alakazam|Machop|Machoke|Machamp|Bellsprout|Weepinbell|Victreebel|Tentacool|Tentacruel|Geodude|Graveler|Golem|Ponyta|Rapidash|Slowpoke|Slowbro|Magnemite|Magneton|Farfetch’d|Doduo|Dodrio|Seel|Dewgong|Grimer|Muk|Shellder|Cloyster|Gastly|Haunter|Gengar|Onix|Drowzee|Hypno|Krabby|Kingler|Voltorb|Electrode|Exeggcute|Exeggutor|Cubone|Marowak|Hitmonlee|Hitmonchan|Lickitung|Koffing|Weezing|Rhyhorn|Rhydon|Chansey|Tangela|Kangaskhan|Horsea|Seadra|Goldeen|Seaking|Staryu|Starmie|Mr. Mime|Scyther|Jynx|Electabuzz|Magmar|Pinsir|Tauros|Magikarp|Gyarados|Lapras|Ditto|Eevee|Vaporeon|Jolteon|Flareon|Porygon|Omanyte|Omastar|Kabuto|Kabutops|Aerodactyl|Snorlax|Articuno|Zapdos|Moltres|Dratini|Dragonair|Dragonite|Mewtwo|Mew|Chikorita|Bayleef|Meganium|Cyndaquil|Quilava|Typhlosion|Totodile|Croconaw|Feraligatr|Sentret|Furret|Hoothoot|Noctowl|Ledyba|Ledian|Spinarak|Ariados|Crobat|Chinchou|Lanturn|Pichu|Cleffa|Igglybuff|Togepi|Togetic|Natu|Xatu|Mareep|Flaaffy|Ampharos|Bellossom|Marill|Azumarill|Sudowoodo|Politoed|Hoppip|Skiploom|Jumpluff|Aipom|Sunkern|Sunflora|Yanma|Wooper|Quagsire|Espeon|Umbreon|Murkrow|Slowking|Misdreavus|Unown|Wobbuffet|Girafarig|Pineco|Forretress|Dunsparce|Gligar|Steelix|Snubbull|Granbull|Qwilfish|Scizor|Shuckle|Heracross|Sneasel|Teddiursa|Ursaring|Slugma|Magcargo|Swinub|Piloswine|Corsola|Remoraid|Octillery|Delibird|Mantine|Skarmory|Houndour|Houndoom|Kingdra|Phanpy|Donphan|Porygon2|Stantler|Smeargle|Tyrogue|Hitmontop|Smoochum|Elekid|Magby|Miltank|Blissey|Raikou|Entei|Suicune|Larvitar|Pupitar|Tyranitar|Lugia|Ho-Oh|Celebi|Treecko|Grovyle|Sceptile|Torchic|Combusken|Blaziken|Mudkip|Marshtomp|Swampert|Poochyena|Mightyena|Zigzagoon|Linoone|Wurmple|Silcoon|Beautifly|Cascoon|Dustox|Lotad|Lombre|Ludicolo|Seedot|Nuzleaf|Shiftry|Taillow|Swellow|Wingull|Pelipper|Ralts|Kirlia|Gardevoir|Surskit|Masquerain|Shroomish|Breloom|Slakoth|Vigoroth|Slaking|Nincada|Ninjask|Shedinja|Whismur|Loudred|Exploud|Makuhita|Hariyama|Azurill|Nosepass|Skitty|Delcatty|Sableye|Mawile|Aron|Lairon|Aggron|Meditite|Medicham|Electrike|Manectric|Plusle|Minun|Volbeat|Illumise|Roselia|Gulpin|Swalot|Carvanha|Sharpedo|Wailmer|Wailord|Numel|Camerupt|Torkoal|Spoink|Grumpig|Spinda|Trapinch|Vibrava|Flygon|Cacnea|Cacturne|Swablu|Altaria|Zangoose|Seviper|Lunatone|Solrock|Barboach|Whiscash|Corphish|Crawdaunt|Baltoy|Claydol|Lileep|Cradily|Anorith|Armaldo|Feebas|Milotic|Castform|Kecleon|Shuppet|Banette|Duskull|Dusclops|Tropius|Chimecho|Absol|Wynaut|Snorunt|Glalie|Spheal|Sealeo|Walrein|Clamperl|Huntail|Gorebyss|Relicanth|Luvdisc|Bagon|Shelgon|Salamence|Beldum|Metang|Metagross|Regirock|Regice|Registeel|Latias|Latios|Kyogre|Groudon|Rayquaza|Jirachi|Deoxys|Turtwig|Grotle|Torterra|Chimchar|Monferno|Infernape|Piplup|Prinplup|Empoleon|Starly|Staravia|Staraptor|Bidoof|Bibarel|Kricketot|Kricketune|Shinx|Luxio|Luxray|Budew|Roserade|Cranidos|Rampardos|Shieldon|Bastiodon|Burmy|Wormadam|Mothim|Combee|Vespiquen|Pachirisu|Buizel|Floatzel|Cherubi|Cherrim|Shellos|Gastrodon|Ambipom|Drifloon|Drifblim|Buneary|Lopunny|Mismagius|Honchkrow|Glameow|Purugly|Chingling|Stunky|Skuntank|Bronzor|Bronzong|Bonsly|Mime Jr.|Happiny|Chatot|Spiritomb|Gible|Gabite|Garchomp|Munchlax|Riolu|Lucario|Hippopotas|Hippowdon|Skorupi|Drapion|Croagunk|Toxicroak|Carnivine|Finneon|Lumineon|Mantyke|Snover|Abomasnow|Weavile|Magnezone|Lickilicky|Rhyperior|Tangrowth|Electivire|Magmortar|Togekiss|Yanmega|Leafeon|Glaceon|Gliscor|Mamoswine|Porygon-Z|Gallade|Probopass|Dusknoir|Froslass|Rotom|Uxie|Mesprit|Azelf|Dialga|Palkia|Heatran|Regigigas|Giratina|Cresselia|Phione|Manaphy|Darkrai|Shaymin|Arceus|Victini|Snivy|Servine|Serperior|Tepig|Pignite|Emboar|Oshawott|Dewott|Samurott|Patrat|Watchog|Lillipup|Herdier|Stoutland|Purrloin|Liepard|Pansage|Simisage|Pansear|Simisear|Panpour|Simipour|Munna|Musharna|Pidove|Tranquill|Unfezant|Blitzle|Zebstrika|Roggenrola|Boldore|Gigalith|Woobat|Swoobat|Drilbur|Excadrill|Audino|Timburr|Gurdurr|Conkeldurr|Tympole|Palpitoad|Seismitoad|Throh|Sawk|Sewaddle|Swadloon|Leavanny|Venipede|Whirlipede|Scolipede|Cottonee|Whimsicott|Petilil|Lilligant|Basculin|Sandile|Krokorok|Krookodile|Darumaka|Darmanitan|Maractus|Dwebble|Crustle|Scraggy|Scrafty|Sigilyph|Yamask|Cofagrigus|Tirtouga|Carracosta|Archen|Archeops|Trubbish|Garbodor|Zorua|Zoroark|Minccino|Cinccino|Gothita|Gothorita|Gothitelle|Solosis|Duosion|Reuniclus|Ducklett|Swanna|Vanillite|Vanillish|Vanilluxe|Deerling|Sawsbuck|Emolga|Karrablast|Escavalier|Foongus|Amoonguss|Frillish|Jellicent|Alomomola|Joltik|Galvantula|Ferroseed|Ferrothorn|Klink|Klang|Klinklang|Tynamo|Eelektrik|Eelektross|Elgyem|Beheeyem|Litwick|Lampent|Chandelure|Axew|Fraxure|Haxorus|Cubchoo|Beartic|Cryogonal|Shelmet|Accelgor|Stunfisk|Mienfoo|Mienshao|Druddigon|Golett|Golurk|Pawniard|Bisharp|Bouffalant|Rufflet|Braviary|Vullaby|Mandibuzz|Heatmor|Durant|Deino|Zweilous|Hydreigon|Larvesta|Volcarona|Cobalion|Terrakion|Virizion|Tornadus|Thundurus|Reshiram|Zekrom|Landorus|Kyurem|Keldeo|Meloetta|Genesect|Chespin|Quilladin|Chesnaught|Fennekin|Braixen|Delphox|Froakie|Frogadier|Greninja|Bunnelby|Diggersby|Fletchling|Fletchinder|Talonflame|Scatterbug|Spewpa|Vivillon|Litleo|Pyroar|Flabébé|Floette|Florges|Skiddo|Gogoat|Pancham|Pangoro|Furfrou|Espurr|Meowstic|Honedge|Doublade|Aegislash|Spritzee|Aromatisse|Swirlix|Slurpuff|Inkay|Malamar|Binacle|Barbaracle|Skrelp|Dragalge|Clauncher|Clawitzer|Helioptile|Heliolisk|Tyrunt|Tyrantrum|Amaura|Aurorus|Sylveon|Hawlucha|Dedenne|Carbink|Goomy|Sliggoo|Goodra|Klefki|Phantump|Trevenant|Pumpkaboo|Gourgeist|Bergmite|Avalugg|Noibat|Noivern|Xerneas|Yveltal|Zygarde|Diancie|Hoopa|Volcanion|Rowlet|Dartrix|Decidueye|Litten|Torracat|Incineroar|Popplio|Brionne|Primarina|Pikipek|Trumbeak|Toucannon|Yungoos|Gumshoos|Grubbin|Charjabug|Vikavolt|Crabrawler|Crabominable|Oricorio|Cutiefly|Ribombee|Rockruff|Lycanroc|Wishiwashi|Mareanie|Toxapex|Mudbray|Mudsdale|Dewpider|Araquanid|Fomantis|Lurantis|Morelull|Shiinotic|Salandit|Salazzle|Stufful|Bewear|Bounsweet|Steenee|Tsareena|Comfey|Oranguru|Passimian|Wimpod|Golisopod|Sandygast|Palossand|Pyukumuku|Código Cero/Type: Null|Silvally|Minior|Komala|Turtonator|Togedemaru|Mimikyu|Bruxish|Drampa|Dhelmise|Jangmo-o|Hakamo-o|Kommo-o|Tapu Koko|Tapu Lele|Tapu Bulu|Tapu Fini|Cosmog|Cosmoem|Solgaleo|Lunala|Nihilego|Buzzwole|Pheromosa|Xurkitree|Celesteela|Kartana|Guzzlord|Necrozma|Magearna|Marshadow|Poipole|Naganadel|Stakataka|Blacephalon|Zeraora|Meltan|Melmetal|Grookey|Thwackey|Rillaboom|Scorbunny|Raboot|Cinderace|Sobble|Drizzile|Inteleon|Skwovet|Greedent|Rookidee|Corvisquire|Corviknight|Blipbug|Dottler|Orbeetle|Nickit|Thievul|Gossifleur|Eldegoss|Wooloo|Dubwool|Chewtle|Drednaw|Yamper|Boltund|Rolycoly|Carkol|Coalossal|Applin|Flapple|Appletun|Silicobra|Sandaconda|Cramorant|Arrokuda|Barraskewda|Toxel|Toxtricity|Sizzlipede|Centiskorch|Clobbopus|Grapploct|Sinistea|Polteageist|Hatenna|Hattrem|Hatterene|Impidimp|Morgrem|Grimmsnarl|Obstagoon|Perrserker|Cursola|Sirfetch’d|Mr. Rime|Runerigus|Milcery|Alcremie|Falinks|Pincurchin|Snom|Frosmoth|Stonjourner|Eiscue|Indeedee|Morpeko|Cufant|Copperajah|Dracozolt|Arctozolt|Dracovish|Arctovish|Duraludon|Dreepy|Drakloak|Dragapult|Zacian|Zamazenta|Eternatus|Kubfu|Urshifu|Zarude|Regieleki|Regidrago|Glastrier|Spectrier|Calyrex|Wyrdeer|Kleavor|Ursaluna|Basculegion|Sneasler|Overqwil|Enamorus|Sprigatito|Floragato|Meowscarada|Fuecoco|Crocalor|Skeledirge|Quaxly|Quaxwell|Quaquaval|Lechonk|Oinkologne|Tarountula|Spidops|Nymble|Lokix|Pawmi|Pawmo|Pawmot|Tandemaus|Maushold|Fidough|Dachsbun|Smoliv|Dolliv|Arboliva|Squawkabilly|Nacli|Naclstack|Garganacl|Charcadet|Armarouge|Ceruledge|Tadbulb|Bellibolt|Wattrel|Kilowattrel|Maschiff|Mabosstiff|Shroodle|Grafaiai|Bramblin|Brambleghast|Toedscool|Toedscruel|Klawf|Capsakid|Scovillain|Rellor|Rabsca|Flittle|Espathra|Tinkatink|Tinkatuff|Tinkaton|Wiglett|Wugtrio|Bombirdier|Finizen|Palafin|Varoom|Revavroom|Cyclizar|Orthworm|Glimmet|Glimmora|Greavard|Houndstone|Flamigo|Cetoddle|Cetitan|Veluza|Dondozo|Tatsugiri|Annihilape|Clodsire|Farigiraf|Dudunsparce|Kingambit|Colmilargo/Great Tusk|Colagrito/Scream Tail|Furioseta/Brute Bonnet|Melenaleteo/Flutter Mane|Reptalada/Slither Wing|Pelarena/Sandy Shocks|Ferrodada/Iron Treads|Ferrosaco/Iron Bundle|Ferropalmas/Iron Hands|Ferrocuello/Iron Jugulis|Ferropolilla/Iron Moth|Ferropúas/Iron Thorns|Frigibax|Arctibax|Baxcalibur|Gimmighoul|Gholdengo|Wo-Chien|Chien-Pao|Ting-Lu|Chi-Yu|Bramaluna/Roaring Moon|Ferropaladín/Iron Valiant|Koraidon|Miraidon|Ondulagua/Walking Wake|Ferroverdor/Iron Leaves|Dipplin|Poltchageist|Sinistcha|Okidogi|Munkidori|Fezandipiti|Ogerpon|Archaludon|Hydrapple|Flamariete/Gouging Fire|Electrofuria/Raging Bolt|Ferromole/Iron Boulder|Ferrotesta/Iron Crown|Terapagos|Pecharunt';
  const VERSION = '1.16.0';
  // ¿Esta es la pestaña o la ventana oculta donde se juegan las diarias en segundo plano? (en otras ventanas, nada)
  const FONDO_NOMBRE = 'axd-fondo';
  let EN_FONDO = false;
  try { if (window.top !== window) { if (window.name === FONDO_NOMBRE) EN_FONDO = true; else return; } } catch { return; }
  const PANEL_ID = 'axd-panel';
  const LS_AUTO = 'axd-auto';
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  // Las esperas entre acciones miran al volver si aún toca jugar: si se ha pulsado Parar, se corta ahí mismo
  const PARADO = new Error('parado');
  // en la ventana oculta del robot no hace falta ir a ritmo de persona: las pausas entre clics, a menos de la mitad
  const VEL = () => (EN_FONDO ? 0.45 : 1);
  const pausa = async (a, b) => { await sleep((a + Math.random() * (b - a)) * VEL()); if (!jugando()) throw PARADO; };
  const texto = el => (el && el.textContent || '').replace(/\s+/g, ' ').trim();
  const norm = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9♀♂]+/g, '');
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const ajeno = el => !!el.closest('#' + PANEL_ID);
  const visible = el => !!el && el.getClientRects().length > 0;
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } };
  const lsPut = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* nada */ } };

  /* ── Espera a que Next.js/React termine de hidratar (si se toca el DOM antes, React repinta la página entera) ── */
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

  /* ── Pokédex: número → nombre (en español y, si es distinto, en inglés) ── */
  const NOMBRES = {};
  NOMBRES_DATOS.split('|').forEach((s, i) => { NOMBRES[i + 1] = s.split('/'); });

  /* ── Panel ── */
  let auto = lsGet(LS_AUTO, true);
  const bitacora = [];
  function log(t) {
    const h = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    bitacora.unshift(`${h}  ${t}`); bitacora.length = Math.min(bitacora.length, 12);
    console.log('[diarias]', t); pintar();
    // en segundo plano, lo último que se hace lo enseña la tarjeta de la pestaña
    if (EN_FONDO && !/^➡/.test(t)) ssSet(SS_AHORA, { t: Date.now(), texto: t });
  }
  function pintar(diaria) {
    const p = document.getElementById(PANEL_ID);
    if (!p) return;
    const r = ssGet();
    p.querySelector('.axd-estado').textContent = r ? `🗓️ Ruta de diarias (quedan ${r.cola.length})` : auto ? '🤖 Jugando solo' : '⏸ En pausa';
    p.querySelector('.axd-boton').textContent = r ? '⏹ Parar ruta' : auto ? '⏸ Parar' : '▶ Jugar solo';
    p.querySelector('.axd-todas').style.display = r ? 'none' : '';
    if (diaria) p.querySelector('.axd-titulo').textContent = `🗓️ Diarias · ${diaria}`;
    p.querySelector('.axd-log').textContent = bitacora.join('\n') || 'Nada aún.';
  }
  function montarPanel(despuesDe, diaria) {
    if (document.getElementById(PANEL_ID) || !despuesDe) return;
    const p = document.createElement('section');
    p.id = PANEL_ID;
    p.setAttribute('data-ax-ignore', '');
    p.style.cssText = 'background:#131A2B;border:2px solid #2E3B57;color:#C9D3E3;border-radius:22px;padding:12px;font-size:12px;line-height:1.4;margin:0 0 12px';
    p.innerHTML = `<div style="display:flex;align-items:center;gap:8px"><b class="axd-titulo" style="flex:1">🗓️ Diarias</b><span class="axd-estado"></span>
      <button type="button" class="axd-boton" style="background:#2E3B57;color:#fff;border-radius:12px;padding:4px 10px;font-weight:800"></button>
      <button type="button" class="axd-todas" title="Juega una tras otra todas las diarias pendientes que sé jugar" style="background:#2E3B57;color:#fff;border-radius:12px;padding:4px 8px;font-weight:800">🗓️ Todas</button>
      <button type="button" class="axd-copiar" title="Copia el HTML de esta pantalla para pasármelo" style="background:#2E3B57;color:#fff;border-radius:12px;padding:4px 8px;font-weight:800">📋 Copiar HTML</button></div>
      <pre class="axd-log" style="white-space:pre-wrap;margin:6px 0 0;font:11px/1.4 ui-monospace,monospace;color:#9fb0c8;max-height:140px;overflow:auto"></pre>
      <p style="margin-top:4px;font-size:10px;color:#6b7a93">Diarias v${VERSION}</p>`;
    p.querySelector('.axd-boton').addEventListener('click', () => {
      if (ssGet()) { pararRuta('Ruta de diarias parada.'); return; }
      auto = !auto; lsPut(LS_AUTO, auto); log(auto ? '▶ Juego solo.' : '⏸ En pausa.');
    });
    p.querySelector('.axd-todas').addEventListener('click', () => fondo.iniciar());
    p.querySelector('.axd-copiar').addEventListener('click', async () => {
      const m = document.querySelector('main').cloneNode(true); const q = m.querySelector('#' + PANEL_ID); if (q) q.remove();
      try { await navigator.clipboard.writeText(m.outerHTML); log('📋 HTML copiado: pégamelo.'); } catch { console.log(m.outerHTML); log('📋 No me deja copiar: está en la consola (F12).'); }
    });
    despuesDe.insertAdjacentElement('afterend', p);
    pintar(diaria);
  }

  // Botones para seguir tras un premio o un resultado (Siguiente, Vale…): como mucho 3 veces seguidas el mismo, para no
  // quedarse en bucle si la página no cambia
  let seguirUltimo = '', seguirVeces = 0;
  const botonSeguir = () => $$('main button').find(b => !ajeno(b) && !b.disabled && visible(b) && /^(siguiente|continuar|seguir(?!\s*aqu)|vale|recoger|cerrar|otra)/i.test(texto(b)));
  async function pulsarSeguir() {
    const b = botonSeguir();
    if (!b) return false;
    const t = texto(b);
    seguirVeces = t === seguirUltimo ? seguirVeces + 1 : 1; seguirUltimo = t;
    if (seguirVeces > 3) return false;
    await pausa(600, 1100);
    if (document.contains(b) && !b.disabled) { log(`➡ ${t}`); b.click(); await pausa(800, 1300); }
    return true;
  }
  const otraAccion = () => { seguirVeces = 0; seguirUltimo = ''; };

  /* ══════════ DIARIA 1 · «¿Quién es ese Pokémon?» ══════════
   * La silueta es el sprite de verdad pintado de negro: su dirección lleva el número de la Pokédex (/sprites/420.png =
   * Cherubi). Con eso se sabe el nombre y se pulsa el botón que lo lleve. Luego, con cada acierto, se tira la ruleta. */
  const QUIEN = {
    id: 'quien',
    nombre: '📺 ¿Quién es ese Pokémon?',
    detecta: () => h1Main().find(h => /qui[eé]n es ese pok[eé]mon/i.test(texto(h))),
    silueta: () => $$('main img').find(i => !ajeno(i) && /\/sprites\//.test(i.getAttribute('src') || '') && (/silueta/i.test(i.alt || '') || /brightness\(0\)/.test(i.className || ''))),
    opciones(img) {
      const sec = img.closest('section') || document;
      return $$('button', sec).filter(b => !ajeno(b) && !b.disabled && visible(b) && texto(b).length > 0 && texto(b).length < 30);
    },
    botonTirar: () => $$('main button.boton-principal').find(b => !ajeno(b) && !b.disabled && visible(b) && !/sin tiradas/i.test(texto(b))),
    hecho: new Set(),
    async paso() {
      const img = this.silueta();
      if (img) {
        const src = img.getAttribute('src') || '', m = src.match(/\/sprites\/(?:[a-z-]+\/)?(\d+)/i);
        const prog = $$('main span').find(x => !ajeno(x) && /aciertos/i.test(texto(x)));
        const clave = src + '|' + texto(prog);              // la misma especie puede salir dos veces en el día
        const ops = this.opciones(img);
        if (m && ops.length >= 2 && !this.hecho.has(clave)) {
          const num = +m[1], nombres = (NOMBRES[num] || []).map(norm);
          const boton = ops.find(b => nombres.includes(norm(texto(b))));
          if (!boton) {
            this.hecho.add(clave);
            log(`⚠ Silueta nº ${num} (${(NOMBRES[num] || ['?'])[0]}): no está entre ${ops.map(texto).join(', ')}. Te la dejo a ti.`);
            return false;
          }
          await pausa(700, 1400);
          if (!document.contains(boton) || boton.disabled) return true;
          this.hecho.add(clave);
          log(`✅ Es ${texto(boton)} (nº ${num}).`);
          boton.click(); otraAccion();
          await pausa(900, 1500);
          return true;
        }
      }
      const tirar = this.botonTirar();
      if (tirar) {
        await pausa(600, 1200);
        if (!document.contains(tirar) || tirar.disabled) return true;
        log(`🎰 ${texto(tirar)}…`);
        tirar.click(); otraAccion();
        await pausa(3500, 4500);                     // que termine de girar la ruleta
        return true;
      }
      return pulsarSeguir();
    },
  };

  /* ══════════ DIARIA 2 · Cúpula Pokéathlon ══════════
   * Tres pruebas, cada una con su estadística y su rival; tus seis Pokémon traen su cifra en cada una. Uno por prueba y
   * sin repetir. Cada lado se mueve hasta un ±20% de suerte, y el premio crece mucho con las victorias (5/10/20/40 ⚡):
   * se prueban los 120 repartos posibles y se elige el que más energía da DE MEDIA. */
  const PREMIO = [5, 10, 20, 40];
  // Probabilidad de ganar: tu cifra × U(0,8; 1,2) contra la suya × U(0,8; 1,2) (rejilla fina: exacta a efectos prácticos)
  function pGanar(a, b) {
    if (!(a > 0)) return 0; if (!(b > 0)) return 1;
    const N = 120; let g = 0;
    for (let i = 0; i < N; i++) {
      const x = a * (0.8 + 0.4 * (i + 0.5) / N);
      // P(b·U < x) con U uniforme en [0,8; 1,2]
      g += Math.min(1, Math.max(0, (x / b - 0.8) / 0.4));
    }
    return g / N;
  }
  function mejorReparto(pruebas) {
    const nombres = [...new Set(pruebas.flatMap(p => p.mios.map(m => m.nombre)))];
    let mejor = null;
    const rec = (k, usados, elegidos) => {
      if (k === pruebas.length) {
        const ps = elegidos.map((n, i) => pGanar(pruebas[i].mios.find(m => m.nombre === n).v, pruebas[i].rival));
        // reparto de probabilidades del nº de victorias
        let dist = [1];
        for (const p of ps) { const nd = new Array(dist.length + 1).fill(0); dist.forEach((q, w) => { nd[w] += q * (1 - p); nd[w + 1] += q * p; }); dist = nd; }
        const e = dist.reduce((s, q, w) => s + q * PREMIO[Math.min(w, 3)], 0);
        if (!mejor || e > mejor.e) mejor = { e, elegidos: elegidos.slice(), ps };
        return;
      }
      for (const n of nombres) if (!usados.has(n) && pruebas[k].mios.some(m => m.nombre === n)) { usados.add(n); elegidos.push(n); rec(k + 1, usados, elegidos); elegidos.pop(); usados.delete(n); }
    };
    rec(0, new Set(), []);
    return mejor;
  }
  // el día del juego es el de aquí (a medianoche de España cambian las diarias), no el UTC
  const hoy = () => new Date().toLocaleDateString('sv');
  const POKEATHLON = {
    id: 'pokeathlon',
    nombre: '🏟️ Cúpula Pokéathlon',
    detecta: () => h1Main().find(h => /pok[eé]athlon/i.test(texto(h))),
    listo: () => lsGet('axd-pokeathlon', '') === hoy() && !$$('main button').some(b => !ajeno(b) && !b.disabled && /competir/i.test(texto(b))),
    // Cada prueba: su nombre, la cifra del rival y los botones de tus Pokémon con su cifra
    leer() {
      return $$('main section').filter(s => !ajeno(s) && s.querySelector('h2') && s.querySelector('ul button')).map(s => {
        const b = $$('p b', s).find(x => /^\d+$/.test(texto(x)));
        const mios = $$('ul button', s).map(bt => {
          const nombre = (bt.querySelector('img') && bt.querySelector('img').alt) || texto(bt.querySelector('span'));
          const nums = $$('span', bt).map(texto).filter(t => /^\d+$/.test(t));
          return { nombre, v: nums.length ? +nums[nums.length - 1] : 0, boton: bt };
        });
        return { seccion: s, nombre: texto(s.querySelector('h2')), rival: b ? +texto(b) : 0, mios };
      }).filter(p => p.rival > 0 && p.mios.length);
    },
    // El elegido en una prueba es el botón con un aspecto distinto del resto (el juego lo marca)
    marcado(p) {
      // el juego lo pinta de verde (border-hoja / bg-hoja); los usados en otra prueba salen apagados (opacity-40)
      const verde = p.mios.find(m => /(border|bg)-hoja-/.test(m.boton.className));
      if (verde) return verde.nombre;
      if (p.mios.some(m => /opacity-/.test(m.boton.className))) return null;
      const cl = p.mios.map(m => m.boton.className), cuenta = {};
      cl.forEach(c => { cuenta[c] = (cuenta[c] || 0) + 1; });
      const raros = p.mios.filter(m => cuenta[m.boton.className] === 1 && p.mios.length > 2);
      return raros.length === 1 ? raros[0].nombre : null;
    },
    plan: null, planClave: '',
    async paso() {
      const pruebas = this.leer();
      if (pruebas.length >= 2) {
        const clave = pruebas.map(p => p.nombre + p.rival + p.mios.map(m => m.nombre + m.v).join()).join('|');
        if (this.planClave !== clave) {
          this.planClave = clave;
          this.plan = mejorReparto(pruebas);
          if (this.plan) log(`🧮 Reparto: ${pruebas.map((p, i) => `${p.nombre} → ${this.plan.elegidos[i]} (${pruebas[i].mios.find(m => m.nombre === this.plan.elegidos[i]).v} vs ${p.rival}, gana ${Math.round(this.plan.ps[i] * 100)}%)`).join(' · ')} · ${this.plan.e.toFixed(1)} ⚡ de media`);
        }
        if (!this.plan) return false;
        for (let i = 0; i < pruebas.length; i++) {
          const p = pruebas[i], quiero = this.plan.elegidos[i];
          if (this.marcado(p) === quiero) continue;
          const m = p.mios.find(x => x.nombre === quiero);
          if (!m || m.boton.disabled) continue;
          // no pulsar dos veces seguidas el mismo: un segundo clic lo quita
          const k = p.nombre + '|' + quiero;
          if (this.ultimo && this.ultimo.k === k && Date.now() - this.ultimo.t < 4000) return true;
          this.ultimo = { k, t: Date.now() };
          await pausa(500, 1000);
          m.boton.click(); otraAccion();
          await pausa(500, 900);
          return true;
        }
        // Los tres puestos: a competir (una vez al día)
        const bt = $$('main button.boton-principal').find(b => !ajeno(b) && !b.disabled && visible(b));
        if (bt && lsGet('axd-pokeathlon', '') !== hoy()) {
          await pausa(700, 1200);
          if (!document.contains(bt) || bt.disabled) return true;
          lsPut('axd-pokeathlon', hoy());
          log(`🏁 ${texto(bt)}`);
          bt.click(); otraAccion();
          await pausa(1500, 2500);
          return true;
        }
        return false;
      }
      return pulsarSeguir();
    },
  };

  /* ══════════ DIARIA 3 · El Muelle (pesca) ══════════
   * El juego, por dentro: al echar el flotador el servidor manda la zona verde (16 % de ancho) y, en su mitad, el centro
   * (4 %). El flotador va del 0 al 100 % en unos dos segundos (su «left» se recalcula en cada fotograma) y, al tirar, el
   * juego manda al servidor la posición del ÚLTIMO fotograma (no la del momento del clic): «Clavado» si cae a ±2 % del
   * centro del centro, «Ha picado» si cae en el verde y «Se escapó» si no. Por eso:
   *  · lo que se lee del flotador en un fotograma es justo lo que se enviaría si se tira en ese mismo fotograma;
   *  · hay que estar mirando desde el primer fotograma: el servidor contesta y el flotador echa a andar a la vez, y si el
   *    centro está cerca del principio (a un 30 %, a los 0,6 s) un robot que tarda en mirar llega tarde (esa era la causa
   *    de «falla a veces»: se volvía a mirar en el siguiente turno, hasta 0,8 s después);
   *  · se tira en el primer fotograma que cae DENTRO del centro (esperar a uno más centrado no da nada y arriesga). */
  const frame = () => new Promise(r => { let ok = false; const fin = () => { if (!ok) { ok = true; r(performance.now()); } }; requestAnimationFrame(t => { ok = true; r(t); }); setTimeout(fin, 80); });
  const pct = (el, prop) => { const v = el && el.style[prop]; return v && /%$/.test(v) ? parseFloat(v) : null; };
  function barraMuelle(tira) {
    // las tres marcas: spans con «left» en % dentro de la barra que va justo antes del botón ¡TIRA!
    let raiz = tira.parentElement;
    for (let n = 0; n < 3 && raiz; n++, raiz = raiz.parentElement) {
      const marcas = $$('span', raiz).filter(x => pct(x, 'left') != null);
      const zonas = marcas.filter(x => pct(x, 'width') != null).sort((a, b) => pct(b, 'width') - pct(a, 'width'));
      const flot = marcas.find(x => pct(x, 'width') == null);
      if (zonas.length && flot) return { verde: zonas[0], centro: zonas[1] || zonas[0], flot };
    }
    return null;
  }
  const botonTira = () => $$('main button').find(b => !ajeno(b) && !b.disabled && visible(b) && /^¡?tira!?$/i.test(texto(b)));
  // Decide si tirar en este fotograma. `x`: dónde está el flotador (y dónde se enviará); `c0`/`c1`: el centro; `v1`: el
  // final del verde. Devuelve 'centro', 'verde', 'fuera' o null (esperar). «Clavado» vale lo mismo en cualquier punto del
  // centro, así que se tira en el PRIMER fotograma que cae dentro: esperar a uno más cercano a la mitad no da nada y, si
  // el navegador se atasca justo después, se pierde el centro.
  function decideTiro(x, c0, c1, v1) {
    const m = 0.05;                                            // (el servidor redondea a dos decimales)
    if (x >= c0 + m && x <= c1 - m) return 'centro';
    if (x > c1 - m) return x <= v1 ? 'verde' : 'fuera';        // ya se pasó del centro: lo que quede
    return null;
  }
  const mediana = a => { const b = a.slice().sort((p, q) => p - q); return b[b.length >> 1]; };
  // Sigue el flotador fotograma a fotograma y tira donde toca
  async function jugarBarra(tira) {
    const m = barraMuelle(tira);
    if (!m) { log('⚠ Veo «¡TIRA!» pero no la barra. Pulsa «📋 Copiar HTML» y pásamelo.'); return false; }
    const v0 = pct(m.verde, 'left'), v1 = v0 + pct(m.verde, 'width');
    const c0 = pct(m.centro, 'left'), c1 = c0 + pct(m.centro, 'width');
    const T = [], X = [];
    const t0 = performance.now();
    while (performance.now() - t0 < 20000) {
      const t = await frame();
      if (!jugando()) throw PARADO;
      if (!document.contains(m.flot) || tira.disabled) return true;     // ya se tiró (o acabó solo)
      const x = pct(m.flot, 'left');
      if (x == null) continue;
      if (X.length && (t <= T[T.length - 1] || x === X[X.length - 1])) continue;   // el mismo fotograma otra vez (el juego aún no ha movido el flotador)
      T.push(t); X.push(x);
      if (T.length > 8) { T.shift(); X.shift(); }
      const dt = T.length > 1 ? mediana(T.slice(1).map((q, i) => q - T[i])) : 16.7;
      const que = decideTiro(x, c0, c1, v1);
      if (que) {
        tira.click(); otraAccion();
        const fps = Math.round(1000 / dt);
        log(`🎯 ¡Tira! en el ${x.toFixed(1)}% (centro ${c0.toFixed(1)}–${c1.toFixed(1)}, verde ${v0.toFixed(0)}–${v1.toFixed(0)} · ${fps} fotogramas/s${que === 'centro' ? '' : que === 'verde' ? ' · centro no alcanzado, voy al verde' : ' · llegué tarde'})`);
        await pausa(1500, 2200);
        return true;
      }
    }
    return false;
  }
  const LS_MUELLE = 'axd-muelle';
  function contarMuelle(txt) {
    const r = /clavado/i.test(txt) ? 'centro' : /ha picado/i.test(txt) ? 'verde' : /se escap/i.test(txt) ? 'fuera' : null;
    if (!r) return '';
    const g = lsGet(LS_MUELLE, { centro: 0, verde: 0, fuera: 0 });
    g[r] = (g[r] || 0) + 1; lsPut(LS_MUELLE, g);
    const n = g.centro + g.verde + g.fuera;
    return ` (en total: ${g.centro} clavados de ${n})`;
  }
  const MUELLE = {
    id: 'muelle',
    nombre: '🎣 El Muelle',
    detecta: () => h1Main().find(h => /el muelle/i.test(texto(h))),
    async paso() {
      // el cartel del resultado (Clavado / Ha picado / Se escapó): tocar para seguir
      const cartel = $$('button').find(b => !ajeno(b) && visible(b) && /toca para seguir$/i.test(texto(b)));
      if (cartel) { const tx = texto(cartel).replace(/toca para seguir$/i, '').trim(); return pulsar(cartel, `🐟 ${tx.slice(0, 90)}${contarMuelle(tx)}`, [800, 1300]); }
      const tira = botonTira();
      if (tira) return jugarBarra(tira);
      const echar = $$('main button').find(b => !ajeno(b) && !b.disabled && visible(b) && /echar el flotador/i.test(texto(b)));
      if (echar) {
        await pausa(600, 1200);
        if (!document.contains(echar) || echar.disabled) return true;
        log('🎣 Echar el flotador');
        echar.click(); otraAccion();
        // la barra sale cuando contesta el servidor y el flotador echa a andar en ese mismo momento: no se suelta el turno,
        // se espera aquí a que salga ¡TIRA! y se empieza a seguirlo desde el primer fotograma
        for (let i = 0; i < 200; i++) {
          const t = botonTira();
          if (t) return jugarBarra(t);
          await frame();
          if (!jugando()) throw PARADO;
        }
        return true;
      }
      return pulsarSeguir();
    },
  };


  const principal = () => $$('main button.boton-principal').find(b => !ajeno(b) && !b.disabled && visible(b));
  // innerText (no textContent): separa los bloques, que si no se pegan («Hoy0Hoy se corre en…»)
  // (se guarda mientras la página no cambie: en una página enorme —la Caja con miles de tarjetas— cada lectura fuerza el diseño
  // entero, y tick() la pide muchas veces seguidas; con cualquier cambio de la página, o pasado medio segundo, se vuelve a leer)
  let domV = 0, memoTxt = { v: -1, t: 0, m: null, s: '' };
  try { new MutationObserver(() => { domV++; }).observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true }); } catch { /* nada */ }
  // Los títulos de la página (todas las diarias se detectan por el suyo): una consulta por cambio de página, no una por diaria y tick
  let memoH1 = { v: -1, t: 0, l: [] };
  const h1Main = () => { if (memoH1.v !== domV || Date.now() - memoH1.t > 500) memoH1 = { v: domV, t: Date.now(), l: $$('main h1') }; return memoH1.l; };
  const h1h2Main = () => $$('main h1, main h2');
  const textoMain = () => {
    const m = document.querySelector('main');
    if (!m) return '';
    if (memoTxt.m === m && memoTxt.v === domV && Date.now() - memoTxt.t < 500) return memoTxt.s;
    const s = (m.innerText || m.textContent || '').replace(/\s+/g, ' ').trim();
    memoTxt = { v: domV, t: Date.now(), m, s };
    return s;
  };
  // el valor que va debajo de una etiqueta («Hoy se corre en» → «Con obstáculos»)
  const etiqueta = re => $$('main p, main span').find(x => !ajeno(x) && re.test(texto(x)) && x.nextElementSibling);
  // el elegido entre varios botones iguales: el único con un aspecto distinto (el juego lo marca)
  function marcadoEntre(bs) {
    if (bs.length < 3) return null;
    const cuenta = {};
    bs.forEach(b => { cuenta[b.className] = (cuenta[b.className] || 0) + 1; });
    const raros = bs.filter(b => cuenta[b.className] === 1);
    return raros.length === 1 ? raros[0] : null;
  }
  async function pulsar(b, msg, tras = [900, 1500]) {
    await pausa(600, 1200);
    if (!document.contains(b) || b.disabled) return true;
    if (msg) log(msg);
    b.click(); otraAccion();
    await pausa(tras[0], tras[1]);
    return true;
  }

  /* ══════════ DIARIA 4 · Carreras de Rattata ══════════
   * Cuatro ratas y una pista del día: cada rata tiene su estilo y la pista dice cuál le va. Se elige por la pista (con lo
   * que se va aprendiendo de tus carreras: energía media por pista y rata) y se apuesta. Dos carreras al día. */
  const ESTILO = {
    chispa: /cort|sprint|veloc|explos|salida|llan|volando/gi,
    rosca: /larg|fondo|resist|aguant|marat|cuesta|subida|vueltas|recorrido|final/gi,
    tuerca: /obst[aá]cul|despist|charco|caja|cubo|regular|curva|trampa|pieg|barro/gi,
    pinza: /azar|sorpres|caos|loc[ao]\b|niebla|oscur|suerte|lotería/gi,
  };
  const CARRERAS = {
    id: 'carreras',
    nombre: '🐀 Carreras de Rattata',
    detecta: () => h1Main().find(h => /carreras de rattata/i.test(texto(h))),
    // la pista: su nombre y su descripción
    pista() {
      const e = etiqueta(/^hoy se corre en$/i);
      if (!e) return { nombre: '', desc: '' };
      const n = e.nextElementSibling, d = n.nextElementSibling;
      return { nombre: texto(n), desc: texto(n) + ' ' + texto(d) };
    },
    // apuestas de hoy (dos al día): así no se apuesta dos veces en la misma aunque la página se recargue
    hoyN() { const c = lsGet('axd-carreras-dia', {}); return c.fecha === hoy() ? c.n : 0; },
    ratas: () => $$('main ul button').filter(b => !ajeno(b) && visible(b) && b.querySelector('img[alt]')),
    elegir(pista) {
      const L = lsGet('axd-carreras', {})[pista.nombre.toLowerCase()] || {};
      let mejor = null;
      for (const rata of Object.keys(ESTILO)) {
        // cuantas más pistas de su estilo trae la descripción, mejor; sin pistas, la fiable (Tuerca)
        const prior = 6 + 3 * (pista.desc.match(ESTILO[rata]) || []).length + (rata === 'tuerca' ? 1.5 : 0);
        const d = L[rata] || [0, 0];
        const v = (prior * 2 + d[0]) / (2 + d[1]);
        if (!mejor || v > mejor.v) mejor = { rata, v };
      }
      return mejor.rata;
    },
    apuesta: null,
    apuntar() {
      // al acabar la carrera: la energía que ha dado, para aprender qué rata va mejor en cada pista
      const a = this.apuesta;
      if (!a || Date.now() - a.t < 2500) return;
      const t = textoMain();
      let premio = null;
      const m = t.match(/\+\s*(15|10|5)\s*(?:de\s*)?(?:energ|⚡)/i);
      if (m) premio = +m[1];
      else if (/(últim|cuart)[ao]\b|sin premio|no te llevas nada|te quedas sin/i.test(t)) premio = 0;
      if (premio == null && Date.now() - a.t < 30000) return;
      this.apuesta = null;
      if (premio == null) return;
      const L = lsGet('axd-carreras', {}), k = a.pista.nombre.toLowerCase();
      L[k] = L[k] || {}; const d = L[k][a.rata] || [0, 0]; L[k][a.rata] = [d[0] + premio, d[1] + 1];
      lsPut('axd-carreras', L);
      log(`📒 ${a.rata} en «${k}»: ${premio} ⚡`);
    },
    hecho: new Set(),
    async paso() {
      this.apuntar();
      const ratas = this.ratas().filter(b => !b.disabled);
      if (ratas.length >= 2) {
        const pista = this.pista(), quiero = this.elegir(pista), clave = this.hoyN() + '|' + quiero;
        const boton = ratas.find(b => norm(b.querySelector('img').alt) === quiero);
        const marcada = marcadoEntre(ratas);
        if (boton && marcada !== boton && !this.hecho.has('r' + clave)) {
          this.hecho.add('r' + clave);
          return pulsar(boton, `🐀 Pista «${pista.nombre || '?'}»: voy con ${boton.querySelector('img').alt}.`);
        }
        const bt = principal();
        if (bt && !this.hecho.has('a' + clave) && this.hoyN() < 2 && !/cierra|vuelve|mañana/i.test(texto(bt))) {
          this.hecho.add('a' + clave);
          lsPut('axd-carreras-dia', { fecha: hoy(), n: this.hoyN() + 1 });
          this.apuesta = { pista, rata: quiero, t: Date.now() };
          return pulsar(bt, `💰 ${texto(bt)}`, [3000, 4000]);
        }
      }
      return pulsarSeguir();
    },
  };

  /* ══════════ DIARIA 5 · Rutas submarinas (buceo) ══════════
   * Se paga la bombona y se baja 12 veces; en cada bajada se elige zona (algas, arena o grieta). Va a la zona elegida en
   * el panel del menú: por defecto la grieta (lo más raro y lo que solo sale ahí). */
  const ZONAS = { algas: /alga/i, arena: /arena/i, grieta: /grieta/i };
  const BUCEO = {
    id: 'buceo',
    nombre: '🤿 Rutas submarinas',
    detecta: () => h1Main().find(h => /rutas submarinas/i.test(texto(h))),
    async paso() {
      const zonas = $$('main button').filter(b => !ajeno(b) && !b.disabled && visible(b) && Object.values(ZONAS).some(re => re.test(texto(b))));
      if (zonas.length >= 2) {
        const pref = lsGet('axd-buceo-zona', 'grieta');
        const b = zonas.find(x => ZONAS[pref].test(texto(x))) || zonas[0];
        return pulsar(b, `🤿 Bajo a ${(texto(b).match(/(el bosque de algas|la arena del fondo|la grieta|algas|arena|grieta)/i) || [texto(b).slice(0, 20)])[0]}`, [1800, 2600]);
      }
      const bt = principal();
      if (bt && /baj|bucea|sumerg|inmers|bombona|empez|entrar|800/i.test(texto(bt)) && lsGet('axd-buceo', '') !== hoy()) {
        lsPut('axd-buceo', hoy());
        return pulsar(bt, `🤿 ${texto(bt)}`);
      }
      return pulsarSeguir();
    },
  };

  /* ══════════ DIARIA 6 · El Tren de Biscuit (solo en Teselia) ══════════
   * Rebusca en el vagón de chatarra (600 $, 3 al día). Las mercancías no se compran solas. */
  const TREN = {
    id: 'tren',
    nombre: '🚂 El Tren de Biscuit',
    detecta: () => h1Main().find(h => /tren de biscuit/i.test(texto(h))),
    otraRegion: () => /no lo ves llegar/i.test(textoMain()),
    // «Vagón de chatarra · N de 3 hoy»: las que quedan
    quedan() { const m = textoMain().match(/vag[oó]n de chatarra\s*(\d+)\s*de\s*(\d+)\s*hoy/i); return m ? +m[1] : null; },
    listo() { const ya = this.quedan() === 0 || /vag[oó]n est[aá] vac[ií]o/i.test(textoMain()); if (ya) { lsPut('axd-tren-hecho', hoy()); marcarInterfaz('/tren'); } return ya; },
    async paso() {
      const cerrar = $$('main button[aria-label="Cerrar"]').find(b => !ajeno(b) && visible(b));
      const b = $$('main button').find(x => !ajeno(x) && !x.disabled && visible(x) && /^meter el brazo/i.test(texto(x)));
      if (b && this.quedan() !== 0) {
        if (cerrar) cerrar.click();
        return pulsar(b, `🚂 ${texto(b)} (quedan ${this.quedan() ?? '?'})`, [2000, 3000]);
      }
      return false;
    },
  };

  /* ══════════ Safari (una visita al día en cada reserva) ══════════
   * Lo juega el script Safari Auto: aquí solo se le da a su «🧠 Estrategia» y se espera a que termine. Solo en la ruta. */
  const REGIONES = ['Kanto', 'Johto', 'Hoenn', 'Sinnoh', 'Teselia'];
  // la región que sale ANTES en el texto («Estás en sinnoh · Kanto · Johto…» → Sinnoh)
  const regionDe = t => { const n = norm(t); let mejor = '', pos = Infinity; for (const r of REGIONES) { const i = n.indexOf(norm(r)); if (i >= 0 && i < pos) { pos = i; mejor = r; } } return mejor; };
  const SAFARI = {
    id: 'safari',
    nombre: '🌾 Safari',
    soloRuta: true, sinPanel: true,
    detecta: () => ruta() === '/safari' && h1Main()[0],
    region() {
      const h = $$('main h1')[0], antes = h && h.previousElementSibling;
      return regionDe(texto(antes) || texto(h && h.parentElement).slice(0, 40));
    },
    // «Ya has hecho tu visita de hoy…» (ojo: dentro pone «Al salir se acaba la visita de hoy», que no es lo mismo)
    cerrada: () => /has hecho tu visita de hoy|abre otra vez mañana/i.test(textoMain()),
    otraRegion(g) { if (this.arrancado) return false; const r = this.region(); return !!r && r !== g; },
    apuntar(reg = this.region()) {
      if (reg) { const s = safarisHoy(); if (!s.hechas.includes(reg)) { s.hechas.push(reg); lsPut('axd-safaris', s); } marcarInterfaz('/safari@' + reg.toLowerCase()); }
    },
    listo() {
      if (!this.cerrada()) return false;
      const r = ssGet(), g = r && r.actual && r.actual.region;
      if (g && this.arrancado) this.apuntar(g); else if (!g || g === this.region()) this.apuntar();
      return true;
    },
    desde: 0, arrancado: false, arranques: 0, salidas: 0,
    async paso() {
      if (this.cerrada()) return false;
      const p = document.getElementById('ax-safari-auto');
      if (!p) {
        if (!this.desde) this.desde = Date.now();
        if (Date.now() - this.desde > 10000) {
          const r = ssGet();
          if (r && !r.sinSafari) { r.sinSafari = true; ssPut(r); log('⚠ No veo el script Safari Auto: instálalo para que juegue los Safaris.'); }
        }
        return false;
      }
      const parar = p.querySelector('[data-ax="stop"]');
      if (parar && !parar.hidden) return true;               // Safari Auto está jugando
      const juego = re => $$('main button').find(b => !ajeno(b) && !b.closest('#ax-safari-auto') && !b.disabled && visible(b) && re.test(texto(b)));
      const fin = juego(/se acab/i);
      if (fin) return pulsar(fin, `🌾 ${texto(fin)}`);
      // «¿Seguro? Se acaba la visita de hoy…»: «Sí, salir» (no «Seguir aquí», que la deja abierta y vuelve a empezar)
      const confirmar = juego(/^s[ií],?\s*salir/i);
      if (confirmar && this.arrancado) { const r0 = ssGet(); this.apuntar((r0 && r0.actual && r0.actual.region) || undefined); return pulsar(confirmar, `🌾 ${texto(confirmar)}`, [2000, 3000]); }
      const andar = juego(/^andar/i), salir = juego(/^salir de/i);
      const smart = p.querySelector('[data-ax="smart"]');
      // arrancar Safari Auto (y volver a arrancarlo si se para con pasos por andar, hasta 3 veces)
      if (smart && !smart.disabled && (!this.arrancado || (andar && this.arranques < 3))) {
        this.arrancado = true; this.arranques = (this.arranques || 0) + 1;
        return pulsar(smart, `🌾 ${this.region() || 'Safari'}: Safari Auto en modo estrategia${this.arranques > 1 ? ' (otra vez)' : ''}.`, [2000, 3000]);
      }
      // sin pasos (o Safari Auto no sigue): salir, que es lo que cierra la visita de hoy
      if (salir && this.arrancado && (!andar || this.arranques >= 3)) {
        // por si la salida no se deja confirmar: a las 4 veces se deja para otro día (antes daba vueltas sin fin)
        this.salidas = (this.salidas || 0) + 1;
        if (this.salidas > 4) { log(`⚠ 🌾 No consigo salir del Safari de ${this.region() || 'aquí'}: lo dejo.`); return false; }
        return pulsar(salir, `🌾 ${texto(salir)}`, [2000, 3000]);
      }
      return pulsarSeguir();
    },
  };
  // una región sin reserva (o que no deja entrar) no se vuelve a probar en una semana
  function sinReserva(g) { let sr = lsGet('axd-sin-reserva', {}); if (!sr || Array.isArray(sr)) sr = {}; sr[g] = Date.now(); lsPut('axd-sin-reserva', sr); }
  // «Hecho hoy» en los Accesos directos del script Interfaz (si no, el Safari de otra región sale como «te toca»)
  const diaInterfaz = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  function marcarInterfaz(clave) {
    const h = lsGet('adx-accesos-hechos', null), keys = h && h.dia === diaInterfaz() ? h.keys : [];
    if (!keys.includes(clave)) { keys.push(clave); lsPut('adx-accesos-hechos', { dia: diaInterfaz(), keys }); }
  }
  const hechoInterfaz = clave => { const h = lsGet('adx-accesos-hechos', null); return !!h && h.dia === diaInterfaz() && h.keys.includes(clave); };
  function safarisHoy() {
    const s = lsGet('axd-safaris', null);
    return s && s.fecha === hoy() ? s : { fecha: hoy(), hechas: [] };
  }

  /* ══════════ Viaje entre regiones (para los Safaris de las demás) ══════════ */
  const VIAJE = {
    id: 'viaje',
    nombre: '🧭 Viaje',
    soloRuta: true, sinPanel: true,
    detecta: () => h1Main().find(h => /las regiones/i.test(texto(h))),
    estoy() {
      const e = etiqueta(/^est[aá]s en$/i);
      if (e) return regionDe(texto(e.nextElementSibling));
      const m = textoMain().match(/est[aá]s en\s*([A-Za-zÁÉÍÓÚáéíóú]+)/i); return m ? regionDe(m[1]) : '';
    },
    destino() { const r = ssGet(); return r && r.actual && r.actual.viaje; },
    listo() { const d = this.destino(); return !!d && this.estoy() === d; },
    hecho: '',
    async paso() {
      const d = this.destino();
      if (!d || this.estoy() === d) return false;
      const b = $$('main button').find(x => !ajeno(x) && !x.disabled && visible(x) && new RegExp(`(volver|viajar|ir|cruzar)\\s+a\\s+${d}`, 'i').test(texto(x)));
      if (!b || this.hecho === d) return false;
      this.hecho = d;
      return pulsar(b, `🧭 ${texto(b)}`, [2500, 3500]);
    },
  };

  /* ── Leer el estado que React le pasa a un componente (props), probando las dos copias de la fibra y quedándose
   *    con la que cuadra con lo que se ve (la otra puede ser de antes del último cambio) ── */
  function propReact(el, clave, cuadra) {
    const k = el && Object.keys(el).find(x => x.startsWith('__reactFiber$'));
    if (!k) return null;
    const cands = [];
    for (const f0 of [el[k], el[k].alternate]) {
      for (let f = f0, n = 0; f && n < 60; f = f.return, n++) {
        const p = f.memoizedProps;
        if (p && p[clave] && typeof p[clave] === 'object') { cands.push(p[clave]); break; }
      }
    }
    return cands.find(c => { try { return !cuadra || cuadra(c); } catch { return false; } }) || null;
  }

  /* ══════════ DIARIA 7 · La Cantera ══════════
   * Una pared (rejilla) con 4 piezas enterradas; cada golpe agrieta y a las N grietas se derrumba. El martillo rasca
   * un poco las 9 celdas de alrededor (3 grietas): sirve para buscar. El pico hunde una celda del todo (1 grieta):
   * sirve para sacar. Solo te llevas las piezas destapadas enteras. Estrategia:
   *   1. Si alguna pieza asoma y se puede terminar con las grietas que quedan, a por ella con el pico: primero sus
   *      celdas aún tapadas y luego las vecinas de lo que se ve (las piezas son de una pieza: salen unidas).
   *      Primero la más barata de terminar; a igualdad, la que más da.
   *   2. Si no, a buscar: martillo donde más roca virgen haya alrededor (lejos de lo ya cavado y vacío); cuando ya no
   *      quedan grietas para un martillo, pico en la celda con más vecinas por destapar. */
  const CANTERA = {
    id: 'cantera',
    nombre: '⛏️ La Cantera',
    detecta: () => h1Main().find(h => /^la cantera$/i.test(texto(h))),
    celdas: () => $$('main button[aria-label^="Celda "]').filter(b => !ajeno(b)),
    estado() {
      const bs = this.celdas();
      if (!bs.length) return null;
      const aguanta = (textoMain().match(/(\d+)\s*golpes de pico/i) || [])[1];
      const asoman = bs.filter(b => /hay algo/i.test(b.getAttribute('aria-label'))).length;
      const e = propReact(bs[0], 'estado', c => Array.isArray(c.celdas) && c.celdas.length === bs.length &&
        c.celdas.filter(x => x.asoma).length === asoman && (aguanta == null || c.grietasMax - c.grietas === +aguanta));
      if (e) return e;
      // sin React: lo que dicen las celdas (sin saber qué celda es de qué pieza)
      const cols = +((($$('main [style*="grid-template-columns"]').map(x => x.getAttribute('style')).find(s => /repeat\(\d+/.test(s)) || '').match(/repeat\((\d+)/) || [])[1]) || Math.round(Math.sqrt(bs.length));
      return {
        dentro: true, ancho: cols, grietas: 0, grietasMax: aguanta == null ? 99 : +aguanta,
        celdas: bs.map(b => { const l = b.getAttribute('aria-label'); return { profundidad: /hay algo/i.test(l) ? 0 : +((l.match(/roca:\s*(\d+)/) || [])[1] || 0), asoma: /hay algo/i.test(l) ? 'x' : null, pieza: null }; }),
        piezasVistas: [],
      };
    },
    herramienta: n => $$('main button[aria-pressed]').find(b => !ajeno(b) && new RegExp(n, 'i').test(texto(b))),
    // qué hacer: { i, con: 'pico'|'martillo', por }
    decidir(e) {
      const W = e.ancho, C = e.celdas, H = Math.ceil(C.length / W), quedan = e.grietasMax - e.grietas;
      const xy = i => [i % W, Math.floor(i / W)];
      const vec4 = i => { const [x, y] = xy(i); return [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].filter(([a, b]) => a >= 0 && b >= 0 && a < W && b < H).map(([a, b]) => b * W + a); };
      const vec8 = i => { const [x, y] = xy(i), o = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const a = x + dx, b = y + dy; if (a >= 0 && b >= 0 && a < W && b < H) o.push(b * W + a); } return o; };
      const tapada = i => C[i].profundidad > 0;
      // piezas a medias: por su índice (lo da el juego) o, si no, juntando celdas que asoman y se tocan
      const grupos = new Map();
      C.forEach((c, i) => {
        if (c.pieza == null && !c.asoma) return;
        const k = c.pieza != null ? 'p' + c.pieza : 'a' + i;
        if (!grupos.has(k)) grupos.set(k, []);
        grupos.get(k).push(i);
      });
      const info = new Map((e.piezasVistas || []).map(p => [p.indice, p]));
      const planes = [];
      for (const [k, celdas] of grupos) {
        const p = k[0] === 'p' ? info.get(+k.slice(1)) : null;
        if (p && p.completa) continue;
        const tapadas = celdas.filter(tapada);                 // de la pieza, conocidas y aún tapadas
        const faltan = p ? Math.max(0, p.total - p.vistas) : 1;
        if (!tapadas.length && !faltan) continue;
        const coste = tapadas.length + faltan;
        if (coste > quedan) continue;
        let i = tapadas[0];
        if (i == null) {
          // la vecina tapada que más celdas de la pieza toca (y que no sea de otra pieza)
          const mias = new Set(celdas), cand = new Map();
          for (const c of celdas) for (const v of vec4(c)) if (!mias.has(v) && tapada(v) && C[v].pieza == null && !C[v].asoma) cand.set(v, (cand.get(v) || 0) + 1);
          if (!cand.size) continue;
          i = [...cand].sort((a, b) => b[1] - a[1] || C[a[0]].profundidad - C[b[0]].profundidad)[0][0];
        }
        planes.push({ i, con: 'pico', coste, valor: p ? (p.energia || 0) + 3 : 3, por: p ? `${p.nombre} (${p.vistas} de ${p.total})` : 'algo que asoma' });
      }
      if (planes.length) return planes.sort((a, b) => a.coste - b.coste || b.valor - a.valor)[0];
      if (quedan <= 0) return null;
      // buscar: roca virgen = tapada, sin nada que asome, y lejos de lo cavado sin premio
      const vacia = i => !tapada(i) && !C[i].asoma;
      const virgen = i => tapada(i) && !C[i].asoma && C[i].pieza == null;
      if (quedan >= 3) {
        let mejor = null;
        for (let i = 0; i < C.length; i++) {
          const zona = vec8(i);
          // lo que destapa de verdad: las celdas a 1 de profundidad (y algo las de 2, que quedan a tiro)
          const v = zona.reduce((s, j) => s + (virgen(j) ? [0, 1, 0.35, 0.15][Math.min(C[j].profundidad, 3)] : 0), 0) - zona.filter(vacia).length * 0.1;
          const [x, y] = xy(i), borde = (x === 0 || y === 0 || x === W - 1 || y === H - 1) ? 1.5 : 0;
          if (!mejor || v - borde > mejor.v) mejor = { i, v: v - borde };
        }
        if (mejor && mejor.v >= 2.5) return { i: mejor.i, con: 'martillo', por: 'buscar' };
      }
      let mejor = null;
      for (let i = 0; i < C.length; i++) {
        if (!virgen(i)) continue;
        const v = vec8(i).filter(virgen).length - C[i].profundidad * 0.3;
        if (!mejor || v > mejor.v) mejor = { i, v };
      }
      return mejor ? { i: mejor.i, con: 'pico', por: 'buscar' } : null;
    },
    async paso() {
      // el cartel de «Sale entero»: tocar para seguir
      const cartel = $$('main button, body > div button').find(b => !ajeno(b) && visible(b) && /toca para seguir|sale entero/i.test(texto(b)));
      if (cartel) return pulsar(cartel, `💎 ${texto(cartel).replace(/toca para seguir picando/i, '').trim()}`);
      const bajar = $$('main button').find(b => !ajeno(b) && !b.disabled && visible(b) && /^bajar\b/i.test(texto(b)));
      if (bajar) {
        if (lsGet('axd-cantera', '') === hoy()) return false;
        lsPut('axd-cantera', hoy());
        return pulsar(bajar, `⛏️ ${texto(bajar)}`, [1500, 2500]);
      }
      const e = this.estado();
      if (!e || !e.dentro) return pulsarSeguir();
      const d = this.decidir(e);
      if (!d) return false;
      const h = this.herramienta(d.con === 'pico' ? 'pico' : 'martillo');
      if (h && h.getAttribute('aria-pressed') !== 'true') return pulsar(h, null, [300, 600]);
      const b = this.celdas()[d.i];
      if (!b || b.disabled) return true;
      return pulsar(b, `${d.con === 'pico' ? '⛏️ Pico' : '🔨 Martillo'} en la celda ${d.i + 1} · ${d.por} · quedan ${e.grietasMax - e.grietas} grietas`, [1200, 1800]);
    },
  };

  /* ══════════ DIARIA 8 · El Álbum de Braulio ══════════
   * Dos fotos de bases: eliges cuál va al álbum y os llevais energía tú y su dueño. No hay respuesta mala: se elige la
   * base más currada (más piezas), y «Otra pareja» hasta las cinco. */
  const ALBUM = {
    id: 'album',
    nombre: '📷 El Álbum de Braulio',
    detecta: () => h1Main().find(h => /[aá]lbum de braulio/i.test(texto(h))),
    hecho: '',
    async paso() {
      const estas = $$('main button').filter(b => !ajeno(b) && !b.disabled && visible(b) && /^esta$/i.test(texto(b)));
      if (estas.length >= 2) {
        const e = propReact(estas[0], 'estado', c => Array.isArray(c.pareja) && c.pareja.length === estas.length);
        const piezas = i => { const p = e && e.pareja[i]; return p && Array.isArray(p.piezas) ? p.piezas.length : 0; };
        const i = piezas(1) > piezas(0) ? 1 : 0;
        const clave = e ? e.pareja.map(p => p.baseId).join('|') : estas.map(texto).join() + textoMain().slice(0, 80);
        if (this.hecho === clave) return false;
        this.hecho = clave;
        const nombre = e && e.pareja[i] ? e.pareja[i].nombre : `Foto ${i ? 'B' : 'A'}`;
        return pulsar(estas[i], `📷 Al álbum: «${nombre}»${e ? ` (${piezas(i)} piezas contra ${piezas(1 - i)})` : ''}`, [1500, 2200]);
      }
      return pulsarSeguir();
    },
  };

  /* ══════════ La Casa Treta (solo en Hoenn) ══════════
   * La resuelve el script Casa Treta Auto-Solver: aquí se le da a «▶ Resolver las 8 plantas» y se espera. Solo en la ruta. */
  const TRETA = {
    id: 'casa',
    nombre: '🚪 La Casa Treta',
    soloRuta: true, sinPanel: true,
    detecta: () => h1Main().find(h => /^la casa treta$/i.test(texto(h))),
    otraRegion: () => /casa treta est[aá] en/i.test(textoMain()),
    // cerrada con 🔒 aunque estés en su región: solo se entra estando en su ruta del mapa (moverte por el mapa no lo hago)
    motivoFuera() { const m = textoMain().match(/la casa treta\s*(ruta \d+)/i); return `⏭ 🚪 La Casa Treta: solo se entra estando en la ${m ? m[1].replace(/^r/, 'R') : 'su ruta'}; esa te la dejo.`; },
    plantas() { const m = textoMain().match(/(\d+)\s*de\s*(\d+)\s*plantas hoy/i); return m ? [+m[1], +m[2]] : null; },
    listo() {
      const p = this.plantas(), b = document.querySelector('#ct-embedded-panel .ct-btn');
      return /casa treta est[aá] en|se te acabaron los intentos de hoy/i.test(textoMain()) || (!!p && p[0] >= p[1]) || (!!b && this.arrancado && /volver a intentar/i.test(texto(b)));
    },
    desde: 0, arrancado: false,
    async paso() {
      if (/casa treta est[aá] en/i.test(textoMain())) return false;
      const b = document.querySelector('#ct-embedded-panel .ct-btn');
      if (!b) {
        if (!this.desde) this.desde = Date.now();
        if (Date.now() - this.desde > 10000 && this.desde > 0) {
          this.desde = -1; log('⚠ No veo el script Casa Treta Auto-Solver: instálalo para que suba las plantas.');
          const r = ssGet(); if (r) { r.sinTreta = true; ssPut(r); }
        }
        return false;
      }
      if (/detener/i.test(texto(b))) return true;               // subiendo plantas
      if (!this.arrancado && /resolver/i.test(texto(b))) { this.arrancado = true; return pulsar(b, '🚪 Casa Treta: a subir las plantas.', [2000, 3000]); }
      return false;
    },
  };
  // ¿quedan plantas por subir hoy? (la página se puede leer desde cualquier región)
  async function tretaPendiente() {
    try {
      const html = await (await fetch('/casa', { credentials: 'include' })).text();
      const t = new DOMParser().parseFromString(html, 'text/html').body.textContent.replace(/\s+/g, ' ');
      const m = t.match(/(\d+)\s*de\s*(\d+)\s*plantas hoy/i), ruta = (t.match(/la casa treta\s*(ruta \d+)/i) || [])[1];
      // 🔒: no estás donde está (se sabe si es por la región o por el sitio del mapa comparando con tu región)
      // «Se te acabaron los intentos de hoy» en una planta: por hoy ya está, aunque no las hayas subido todas
      const sinIntentos = /se te acabaron los intentos de hoy/i.test(t);
      return { pendiente: m ? +m[1] < +m[2] && !sinIntentos : !sinIntentos, cerrada: /🔒\s*la casa treta est[aá] en/i.test(t), ruta: ruta ? ruta.replace(/^r/, 'R') : '' };
    } catch { return { pendiente: true }; }
  }

  /* ══════════ Paradas que juega otro script (Huerto, Valle, Salón) ══════════
   * Aquí solo se pulsa el botón de su panel y se espera a que termine. Solo en la ruta; si el script no está
   * instalado se dice y se salta. */
  function parada({ id, nombre, dir, boton, enMarcha, antes, alAcabar, maxMs }) {
    return {
      id, nombre, soloRuta: true, sinPanel: true, maxMs,
      detecta: () => ruta() === dir && document.querySelector('main'),
      desde: 0, pulsado: 0, falta: false,
      listo() {
        const fin = this.pulsado > 0 && Date.now() - this.pulsado > 2500 && !enMarcha();
        if (fin && alAcabar && !this.acabado) { this.acabado = true; alAcabar(); }
        return fin || this.falta;
      },
      async paso() {
        if (this.pulsado) return enMarcha();
        const b = boton();
        if (!b) {
          if (!this.desde) this.desde = Date.now();
          else if (Date.now() - this.desde > 12000 && !this.falta) { this.falta = true; log(`⚠ ${nombre}: no veo su script, instálalo para que lo haga solo.`); }
          return false;
        }
        if (b.disabled) return true;                          // ocupado (o aún cargando)
        if (antes) antes();
        this.pulsado = Date.now();
        await pulsar(b, `${nombre}: ¡a ello!`, [2500, 3500]);
        return true;
      },
    };
  }
  const HUERTO = parada({
    id: 'huerto', nombre: '🌱 Huerto', dir: '/huerto',
    boton: () => document.querySelector('#axh-panel .axh-todo'),
    enMarcha: () => { const b = document.querySelector('#axh-panel .axh-todo'); return !!b && (b.disabled || /⏳/.test(texto(b))); },
    // solo Meloc y Latano (para las Botas de Andar), salvo que hayas elegido una de las dos a mano
    antes: () => { if (!['baya-meloc', 'baya-latano', 'botas'].includes(lsGet('axh-baya', null))) lsPut('axh-baya', 'botas'); },
  });
  const VALLE = parada({
    id: 'valle', nombre: '🌄 Valle Aurora', dir: '/valle',
    boton: () => document.querySelector('#axv-panel .axv-todo'),
    enMarcha: () => { const b = document.querySelector('#axv-panel .axv-todo'); return !!b && b.disabled; },
  });
  const SALON = parada({
    id: 'salon', nombre: '🎴 Salón Malvalona (respiros)', dir: '/salon', maxMs: 15 * 60 * 1000,
    boton: () => document.querySelector('#ax-salon-auto [data-ax="go"]'),
    enMarcha: () => { const b = document.querySelector('#ax-salon-auto [data-ax="stop"]'); return !!b && !b.hidden; },
    alAcabar: () => { if (/cupo de energ[ií]a de hoy completo/i.test(texto(document.querySelector('#ax-salon-auto .ax-goal')))) lsPut('axd-salon-hecho', hoy()); },
    antes: () => { try { localStorage.setItem('ax_salon_mode', 'respiros'); } catch { /* nada */ } const m = document.querySelector('#ax-salon-auto [data-mode="respiros"]'); if (m) m.click(); },
  });

  /* ══════════ Jessie y James (un plan por semana, 3 capítulos; sin gastar energía) ══════════
   * Solo cuando hay capítulo: va a la zona que dice la pista (viajar por el mapa es gratis) y les para los pies. Si
   * ese día no toca, o ya está el plan parado, no hace nada. */
  const JESSIE = {
    id: 'jessie', nombre: '🎈 Jessie y James',
    detecta: () => ruta() === '/jessie-y-james' && document.querySelector('main'),
    boton() { return $$('main button, div.fixed button').find(b => !ajeno(b) && !b.disabled && visible(b) && /pararles los pies|^ir a |saltar al resultado|^seguir$/i.test(texto(b))); },
    listo() { return !this.boton() && !/pararles los pies/i.test(textoMain()); },
    async paso() {
      const b = this.boton();
      if (!b) return false;
      return pulsar(b, /pararles/i.test(texto(b)) ? '🎈 ¡A pararles los pies!' : /^ir a /i.test(texto(b)) ? `🎈 ${texto(b)} (donde dice la pista)` : '', [2000, 3000]);
    },
  };


  /* ══════════ Paradas nuevas: Misiones, Isla, Solar, Tronos y Torre ══════════ */
  // una página del juego leída por detrás (sin ir a ella), para saber si hay algo que hacer
  async function leerPagina(dir) {
    const html = await (await fetch(dir, { credentials: 'include' })).text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return { doc, texto: (doc.body.textContent || '').replace(/\s+/g, ' ') };
  }
  const botonMain = re => $$('main button').find(b => !ajeno(b) && !b.disabled && visible(b) && re.test(texto(b)));

  // Misiones: cobrar las que ya están cumplidas (energía y dinero)
  const MISIONES = {
    id: 'misiones', nombre: '🎯 Misiones', soloRuta: true, sinPanel: true,
    detecta: () => ruta() === '/misiones' && $$('main h1, main h2')[0],
    desde: 0, intentos: 0, rendido: false,
    boton: () => botonMain(/^(cobrar|recoger)$/i),
    listo() { return this.rendido || (!!this.desde && Date.now() - this.desde > 3000 && !this.boton()); },
    async paso() {
      if (!this.desde) this.desde = Date.now();
      const r0 = ssGet();
      if (r0 && r0.actual && r0.actual.rendido) this.rendido = true;
      const b = this.boton();
      if (!b || this.rendido) return false;
      // si el juego no deja cobrar (p. ej. «Las misiones ya son las de hoy: recarga la pantalla»), se recarga una o dos
      // veces y, si sigue igual, se deja (antes pulsaba sin fin)
      const aviso = $$('.fixed').map(x => texto(x)).find(t => /recarga la pantalla|no se puede|ya la cobraste|error/i.test(t));
      if (aviso || this.intentos >= 3) {
        const r = ssGet();
        const rec = (r && r.actual && r.actual.recargas) || 0;
        if (rec < 2 && r && r.actual) { r.actual.recargas = rec + 1; ssPut(r); await pausa(800, 1500); location.reload(); return true; }
        const msg = `⚠ 🎯 Misiones: no me deja cobrar${aviso ? ` («${aviso.slice(0, 80)}»)` : ''}; lo dejo.`;
        this.rendido = true; if (r && r.actual) { r.actual.rendido = true; r.log.push(msg); ssPut(r); } log(msg);
        return false;
      }
      this.intentos++;
      const fila = b.closest('li, div.tarjeta, section') || b.parentElement;
      const que = (texto(fila).match(/^[^\d+·]{3,60}/) || [''])[0].replace(/cobrar|recoger/ig, '').trim();
      return pulsar(b, `🎯 Cobro: ${que || 'una misión'}.`, [1500, 2500]);
    },
  };
  async function misionesPendientes() {
    try { const { doc } = await leerPagina('/misiones'); return [...doc.querySelectorAll('main button')].some(b => /^(cobrar|recoger)$/i.test(texto(b))); } catch { return false; }
  }

  // Isla Espejismo: gastar la marea con el script de la Isla («Jugar la isla sola»)
  const SS_ISLA = EN_FONDO ? 'axi-auto-fondo' : 'axi-auto';
  const ISLA = {
    id: 'isla', nombre: '🏝️ Isla Espejismo', soloRuta: true, sinPanel: true, maxMs: 25 * 60000,
    detecta: () => ruta() === '/isla' && document.querySelector('main'),
    desde: 0, arrancado: 0, dicho: false,
    enMarcha: () => { try { return sessionStorage.getItem(SS_ISLA) === '1'; } catch { return false; } },
    listo() { return (!!this.arrancado && Date.now() - this.arrancado > 4000 && !this.enMarcha()) || /no hay ninguna isla/i.test(textoMain()); },
    reintentos: 0,
    // arranca la Isla en esta ventana (el script de la Isla juega cuando ve las banderas; no necesita su tarjeta)
    arrancar() {
      try { sessionStorage.setItem(SS_ISLA, '1'); sessionStorage.setItem(SS_ISLA + '-robot', '1'); } catch { /* nada */ }     // («-robot»: el script de la Isla espera a la marea baja)
      this.arrancado = Date.now();
    },
    async paso() {
      if (/no hay ninguna isla/i.test(textoMain())) return false;
      if (!this.arrancado) {
        // (se espera un momento a que el script de la Isla monte su tarjeta; si no sale, se arranca igual: antes se quedaba esperando 25 min)
        if (!document.getElementById('axi-auto')) {
          if (!this.desde) this.desde = Date.now();
          else if (Date.now() - this.desde > 15000) { log('⚠ 🏝️ No veo la tarjeta de la Isla Espejismo (¿está instalado el script?): lo intento igualmente.'); this.arrancar(); this.desde = 0; return true; }
          return false;
        }
        this.arrancar(); log('🏝️ Isla: a gastar la marea (captura a todos).');
        return true;
      }
      if (this.enMarcha()) return true;
      // ¿terminó de verdad? El script de la Isla apunta cómo acabó (marea gastada, o esperando la marea baja). Si la bandera
      // se apagó sin eso y aún queda marea, se paró a medias (recarga, ventana reiniciada…): se retoma, hasta 3 veces
      const u = lsGet('axi-auto-ultimo', null), terminó = !!(u && u.t >= this.arrancado);
      if (!terminó && this.reintentos < 3) {
        let est = null; try { est = window.__axIsla && window.__axIsla.estadoIsla(); } catch { /* nada */ }
        if (!est || est.marea >= (est.costeExplorar || 1)) {
          this.reintentos++;
          log(`🏝️ Isla: se paró a medias${est ? ` (quedaba marea: ${est.marea})` : ''}: la retomo (${this.reintentos}/3).`);
          this.arrancar();
          return true;
        }
      }
      if (!this.dicho) {
        this.dicho = true;
        const l = terminó && (u.log || []).slice(-1)[0];
        if (l) log('🏝️ ' + l.replace(/\s*Sube \+.*$/, ''));
      }
      return false;
    },
  };
  async function islaAbierta() { try { const { texto: t } = await leerPagina('/isla'); return !/no hay ninguna isla/i.test(t); } catch { return false; } }

  // Solar de los Sueños (Teselia): despertar al que duerme y dejar a otro (el de menos nivel que no esté en el equipo)
  const LS_SOLAR = 'axd-solar-listo';
  const SOLAR = {
    id: 'solar', nombre: '🌙 Solar de los Sueños', soloRuta: true, sinPanel: true,
    detecta: () => ruta() === '/solar' && document.querySelector('main'),
    otraRegion: () => /desde aqu[ií] no llegas/i.test(textoMain()),
    espera() {
      const b = $$('main button').find(x => !ajeno(x) && /^vuelve en/i.test(texto(x)));
      const t = b ? texto(b) : (textoMain().match(/le quedan[^.]{0,30}/i) || [''])[0];
      if (!t) return null;
      const h = +((t.match(/(\d+)\s*h/i) || [])[1] || 0), m = +((t.match(/(\d+)\s*min/i) || [])[1] || 0);
      return h || m ? (h * 60 + m) * 60000 : 3600000;
    },
    dicho: false,
    listo() {
      const e = this.espera();
      if (e && !botonMain(/^despertarlo$/i)) {
        lsPut(LS_SOLAR, Date.now() + e);
        if (!this.dicho) { this.dicho = true; const m = Math.round(e / 60000); log(`🌙 Solar: el que duerme vuelve en ${m >= 60 ? Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + (m % 60) + ' min' : '') : m + ' min'}.`); }
        return true;
      }
      return false;
    },
    async paso() {
      const vale = $$('main button').find(b => !ajeno(b) && !b.disabled && /^vale$/i.test(texto(b)) && /ha vuelto/i.test(texto(b.closest('div'))));
      if (vale) return pulsar(vale, '');
      const desp = botonMain(/^despertarlo$/i);
      if (desp) return pulsar(desp, '🌙 Solar: lo despierto y vuelve con su regalo.', [2000, 3000]);
      if (/a qui[eé]n dejas/i.test(textoMain())) {
        const cands = $$('main li > button').filter(b => !ajeno(b) && !b.disabled).map(b => {
          const t = texto(b), nv = +((t.match(/Nv\.\s*(\d+)/i) || [])[1] || 0);
          return { b, nv, equipo: /ahora en el equipo/i.test(t), nombre: texto(b.querySelector('span span')) || t.replace(/Nv\..*$/, '').trim() };
        }).filter(c => !c.equipo).sort((a, b) => a.nv - b.nv);
        if (!cands.length) { log('⏭ 🌙 Solar: solo podría dejar a uno de tu equipo; eso lo decides tú.'); lsPut(LS_SOLAR, Date.now() + 12 * 3600000); return false; }
        return pulsar(cands[0].b, `🌙 Solar: dejo a ${cands[0].nombre} (Nv.${cands[0].nv}) durmiendo; vuelve con experiencia y un objeto.`, [2000, 3000]);
      }
      const dejar = botonMain(/^dejar a uno durmiendo$/i);
      if (dejar) return pulsar(dejar, '');
      return false;
    },
  };

  // Los Tronos: si no tienes ninguno, elige UNO al azar de los que se pueden retar hoy, calcula su mejor equipo, lo pone y
  // combate (un solo intento; lo hace el script Tiers); si ya tienes uno, solo revisa que lleve el mejor equipo
  const SS_TRONOS_AUTO = EN_FONDO ? 'axt-tronos-auto-fondo' : 'axt-tronos-auto';
  const TRONOS = {
    id: 'tronos', nombre: '👑 Los Tronos', soloRuta: true, sinPanel: true, maxMs: 45 * 60000,
    detecta: () => ruta() === '/tronos' && document.querySelector('main'),
    desde: 0, dicho: '',
    msg: () => texto(document.querySelector('#axt-tronos-auto p')),
    fin() { return /🏁|con (el|su) mejor equipo|No he podido calcular|No tengo equipo/i.test(this.msg()); },
    listo() {
      if (!this.fin()) return false;
      try { sessionStorage.setItem(SS_TRONOS_AUTO, '0'); } catch { /* nada */ }
      return true;
    },
    async paso() {
      if (!document.getElementById('axt-tronos-auto')) {
        if (!this.desde) this.desde = Date.now();
        else if (Date.now() - this.desde > 20000 && this.desde > 0) { this.desde = -1; log('⚠ 👑 No veo el script Tiers: instálalo para que haga los Tronos.'); }
        return false;
      }
      try { if (sessionStorage.getItem(SS_TRONOS_AUTO) !== '1') sessionStorage.setItem(SS_TRONOS_AUTO, '1'); } catch { /* nada */ }
      // lo que va pasando, sin repetir (los cálculos no se cuentan)
      const m = this.msg();
      if (m && m !== this.dicho && /^(🎲|⚔️|❌|👑|🏁|⚠)/.test(m) && !/Retando al de/.test(m)) { this.dicho = m; log(m.length > 140 ? m.slice(0, 137) + '…' : m); }
      return !this.fin();
    },
  };
  async function sinTrono() { try { const { texto: t } = await leerPagina('/tronos'); return /tronos/i.test(t) && !/TUYO/.test(t); } catch { return false; } }

  // Torre Desafío: las dos ligas, cinco retos al día en cada una (los hace el script Tiers, «Retar solo»). La Torre pide
  // unos 15 min entre retos: mientras una liga espera se reta en la otra, y si esperan las dos se espera aquí.
  const LIGAS_TORRE = { clasico: '🗼 Clásico', comunes: '🌱 Planta Baja' };
  // cómo va cada liga hoy (quedan, en espera hasta…, hecha): se guarda para todo el día
  const ligasTorre = () => { const t = ssLeer('axd-robot-t-torre') || {}; return t.dia === hoy() && t.ligas ? t.ligas : {}; };
  const guardarLigas = L => { const t = ssLeer('axd-robot-t-torre') || {}; ssSet('axd-robot-t-torre', { ...t, dia: hoy(), ligas: L }); };
  const SS_TORRE_AUTO = EN_FONDO ? 'axt-torre-auto-fondo' : 'axt-torre-auto';
  const TORRE = {
    id: 'torre', nombre: '🗼 Torre Desafío', soloRuta: true, sinPanel: true, maxMs: 3 * 3600000,
    detecta: () => ruta() === '/torre' && document.querySelector('main'),
    desde: 0,
    // con el robot, la parada acaba cuando las ligas que quedan están esperando (vuelve al acabar la espera)
    listo() {
      const L = ligasTorre(), pend = Object.keys(LIGAS_TORRE).filter(l => !(L[l] && L[l].fin));
      return !pend.length || (robotOn() && pend.every(l => L[l] && L[l].listaEn > Date.now()));
    },
    async paso() {
      const r = ssGet();
      if (!r || !r.actual) return false;
      const L = ligasTorre();
      const liga = new URLSearchParams(location.search).get('liga');
      const txt = textoMain();
      if (!liga) {
        // la portada dice cuántos retos quedan en cada liga
        const ms = [...txt.matchAll(/(\d+)\s*retos hoy/gi)].map(m => +m[1]);
        Object.keys(LIGAS_TORRE).forEach((l, i) => { if (ms[i] == null) return; L[l] = L[l] || {}; L[l].quedan = ms[i]; if (ms[i] === 0) L[l].fin = true; });
      } else if (LIGAS_TORRE[liga]) {
        const x = L[liga] || (L[liga] = {}), m = txt.match(/retos hoy\s*(\d+)/i);
        if (m) {
          const q = +m[1];
          if (x.quedan != null && q < x.quedan) log(`${LIGAS_TORRE[liga]}: reto hecho, quedan ${q}.`);
          x.quedan = q;
          if (q === 0 && !x.fin) { x.fin = true; log(`✅ ${LIGAS_TORRE[liga]}: los retos de hoy, hechos.`); }
        }
        if (!document.getElementById('axt-auto') && !x.fin) {
          if (!this.desde) this.desde = Date.now();
          else if (Date.now() - this.desde > 25000) { log('⚠ 🗼 No veo el script Tiers: instálalo para que haga los retos de la Torre.'); Object.keys(LIGAS_TORRE).forEach(l => { L[l] = { ...(L[l] || {}), fin: true }; }); guardarLigas(L); return false; }
        }
        // «Espera N min» no cambia hasta recargar: se lee una vez por carga de la página
        const esp = txt.match(/espera\s*(\d+)\s*min/i);
        if (esp && !x.fin) {
          if (this.esperaLeida !== liga) {
            this.esperaLeida = liga;
            const en = Date.now() + +esp[1] * 60000;
            if (!x.listaEn || Math.abs(x.listaEn - en) > 120000) log(`⏳ ${LIGAS_TORRE[liga]}: el siguiente reto, en ${esp[1]} min.`);
            x.listaEn = en;
          }
        } else if (x.listaEn && x.listaEn <= Date.now()) x.listaEn = 0;
      }
      guardarLigas(L);
      const pend = Object.keys(LIGAS_TORRE).filter(l => !(L[l] && L[l].fin));
      if (!pend.length) return false;
      // Tiers reta solo en las que quedan
      try { const o = JSON.parse(sessionStorage.getItem(SS_TORRE_AUTO) || '{}'); let cambio = false; for (const l of Object.keys(LIGAS_TORRE)) { const v = pend.includes(l); if (o[l] !== v) { o[l] = v; cambio = true; } } if (cambio) sessionStorage.setItem(SS_TORRE_AUTO, JSON.stringify(o)); } catch { /* nada */ }
      const listas = pend.filter(l => !(L[l] && L[l].listaEn > Date.now()));
      if (liga && listas.includes(liga)) return true;                       // aquí se puede retar: lo hace Tiers
      if (!listas.length && robotOn()) return false;                         // esperando las dos: el robot vuelve luego
      const otra = listas.find(l => l !== liga);
      const destino = otra || pend.slice().sort((a, b) => ((L[a] && L[a].listaEn) || 0) - ((L[b] && L[b].listaEn) || 0))[0];
      if (destino !== liga) { await pausa(1200, 2200); location.assign('/torre?liga=' + destino); }
      return true;                                                            // (esperando: Tiers recarga al pasar)
    },
  };
  async function torrePendiente() {
    try { const { texto: t } = await leerPagina('/torre'); return [...t.matchAll(/(\d+)\s*retos hoy/gi)].some(m => +m[1] > 0); } catch { return false; }
  }


  /* ══════════ El robot: lo que va por horas (Huerto, Torre, Tronos, Entrañas, Subsuelo) ══════════
   * El robot de Diarias se queda abierto: hace las diarias al empezar el día y, además, cada una de estas cuando le
   * toca (al acabarse su espera). Cada tarea apunta aquí cuándo le vuelve a tocar y cómo va (en el sessionStorage de la
   * pestaña, que la ventana oculta comparte). */
  const SS_ROBOT = 'axd-robot', SS_RT = id => 'axd-robot-t-' + id;
  const robotOn = () => { const R = ssLeer(SS_ROBOT); return !!(R && R.on); };
  const rtGet = id => ssLeer(SS_RT(id)) || {};
  const rtSet = (id, o) => ssSet(SS_RT(id), { ...rtGet(id), ...o, t: Date.now() });
  // mañana a primera hora (el juego cambia de día a medianoche): entre las 00:03 y las 00:10
  const manana = () => { const d = new Date(); d.setHours(24, 3 + Math.floor(Math.random() * 7), 0, 0); return d.getTime(); };
  const hhmm = t => new Date(t).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const ROBOT = {
    diarias: { nombre: '🗓️ Diarias' },
    huerto: { nombre: '🌱 Huerto', href: '/huerto' },
    torre: { nombre: '🗼 Torre', href: '/torre' },
    tronos: { nombre: '👑 Tronos', href: '/tronos', chequeo: async () => {
      const { texto: txt } = await leerPagina('/tronos');
      const tipo = (txt.match(/tienes el de (Normal|Fuego|Agua|Planta|El[eé]ctrico|Hielo|Lucha|Veneno|Tierra|Volador|Ps[ií]quico|Bicho|Roca|Fantasma|Drag[oó]n|Siniestro|Acero|Hada)/i) || [])[1];
      if (/TUYO/.test(txt) || tipo) return { listo: false, prox: Date.now() + 20 * 60000, info: `👑 tienes el de ${tipo || '?'} (miro cada 20 min si te lo quitan)` };
      if (/tronos/i.test(txt)) return { listo: true, info: 'sin trono: a por uno' };
      return { listo: false, prox: Date.now() + 10 * 60000 };
    } },
    entranas: { nombre: '⛰️ Entrañas', href: '/entranas' },
    subsuelo: { nombre: '⛏️ Subsuelo', href: '/subsuelo', otras: ['/huerto'] },
    valle: { nombre: '🌄 Valle', href: '/valle' },
    isla: { nombre: '🏝️ Isla', href: '/isla' },
    missingno: { nombre: '👾 MissingNo.', href: '/jefe', chequeo: () => missingnoPendiente() },
  };
  const ROBOT_DE = { '/huerto': 'huerto', '/torre': 'torre', '/tronos': 'tronos', '/entranas': 'entranas', '/subsuelo': 'subsuelo', '/valle': 'valle', '/isla': 'isla', '/jefe': 'missingno' };
  const SS_EF = { on: 'axe-dfondo-on', fin: 'axe-dfondo-fin', una: 'axe-dfondo-una', estado: 'axe-dfondo-estado', bajadas: 'axe-dfondo-bajadas' };
  // al acabar una parada: cuándo toca la siguiente vez y cómo ha ido (se mira aquí, aún en su página)
  const ROBOT_FIN = {
    huerto() {
      const p = +lsGet('axh-proxima', 0);
      return p > Date.now() + 60000 ? { prox: p + 60000, info: `cosecha a las ${hhmm(p)}` } : { prox: Date.now() + 20 * 60000, info: 'nada creciendo' };
    },
    torre() {
      const L = ligasTorre(), pend = Object.keys(LIGAS_TORRE).filter(l => !(L[l] && L[l].fin));
      if (!pend.length) return { prox: manana(), info: 'los retos de hoy, hechos' };
      const esp = pend.map(l => (L[l] && L[l].listaEn) || 0).filter(x => x > Date.now());
      return { prox: esp.length ? Math.min(...esp) + 15000 : Date.now() + 60000, info: pend.map(l => `${LIGAS_TORRE[l]}: quedan ${L[l] && L[l].quedan != null ? L[l].quedan : '?'}`).join(' · ') };
    },
    tronos() {
      const m = texto(document.querySelector('#axt-tronos-auto p'));
      const tipo = (m.match(/tienes el de (Normal|Fuego|Agua|Planta|El[eé]ctrico|Hielo|Lucha|Veneno|Tierra|Volador|Ps[ií]quico|Bicho|Roca|Fantasma|Drag[oó]n|Siniestro|Acero|Hada)/i) || [])[1];
      if (tipo) return { prox: Date.now() + 20 * 60000, info: `👑 tienes el de ${tipo}`, listo: false };
      if (/hoy ya no queda|no tengo equipo|intento hecho hoy/i.test(m)) return { prox: manana(), info: 'hoy ya no queda ninguno que retar', listo: false };
      return { prox: Date.now() + 20 * 60000, info: m ? corto(m).slice(0, 80) : '', listo: false };
    },
    entranas() {
      const f = ssLeer(SS_EF.fin), hoyK = hoy(), prev = rtGet('entranas');
      const bajadas = prev.dia === hoyK ? prev.bajadas || [] : [];
      // todas las bajadas de la tanda (el script de las Entrañas las va apuntando)
      for (const x of [...(ssLeer(SS_EF.bajadas) || []), ...(f && f.bajadas ? f.bajadas : [])]) if (x && x.t && !bajadas.some(y => y.t === x.t)) bajadas.push(x);
      const res = bajadas.length ? `${bajadas.length} bajada${bajadas.length === 1 ? '' : 's'} hoy (la más honda, piso ${Math.max(...bajadas.map(x => x.piso || 0))})` : '';
      if (f && f.motivo === 'una') return { prox: Date.now(), dia: hoyK, bajadas, info: res || 'bajando' };
      if (f && /energ|pases|gratis/i.test(f.motivo || '')) return { prox: manana(), dia: hoyK, bajadas, info: `${res ? res + ' · ' : ''}sin pases hasta mañana` };
      return { prox: Date.now() + 30 * 60000, dia: hoyK, bajadas, info: `${res ? res + ' · ' : ''}${corto((f && f.motivo) || 'se ha parado')}`.slice(0, 90) };
    },
    missingno() {
      const t = textoMain(), mejor = (t.match(/([\d.]+)\s*tu mejor/i) || [])[1];
      return { prox: Date.now() + 2 * 3600000, listo: false, info: /ya tiraste|ya cobraste/i.test(t) ? 'cobrado' : mejor ? `tu mejor golpe: ${mejor}` : '' };
    },
    // el Valle apunta solo cuándo tiene sentido volver (recoger con el almacén lleno para la hora punta ×2, los puntos de
    // investigación, el día nuevo): se lee lo que dejó en «axv-proxima»
    // la Isla: cada subida de marea (cada 12 h) se vuelve a gastar, con la marea baja si toca; el script de la Isla apunta cuándo
    isla() {
      const p = lsGet('axi-proxima', null), ahora = Date.now();
      if (/no hay ninguna isla/i.test(textoMain())) return { prox: manana(), info: 'sin isla' };
      if (p && p.sinMas && p.hecho > ahora - 10 * 60000) return { prox: manana(), info: p.info || '' };
      if (p && p.t > ahora - 60000 && p.hecho > ahora - 10 * 60000) return { prox: Math.max(p.t, ahora + 2 * 60000), info: p.info || '' };
      // sin apunte de la Isla: si aún queda marea (se paró a medias), se vuelve enseguida; si no, a ratos
      try { const est = window.__axIsla && window.__axIsla.estadoIsla(); if (est && est.abierta && est.marea >= (est.costeExplorar || 1)) return { prox: ahora + 5 * 60000, info: `quedan ${est.marea} de marea: lo reintento` }; } catch { /* nada */ }
      return { prox: ahora + 3 * 3600000, info: 'a ratos' };
    },
    valle() {
      const p = lsGet('axv-proxima', null), ahora = Date.now();
      if (p && p.t > ahora - 60000 && p.hecho > ahora - 10 * 60000) return { prox: Math.max(p.t, ahora + 2 * 60000), info: p.info || '' };
      return { prox: ahora + 30 * 60000, info: 'a ratos' };
    },
    subsuelo() {
      const f = lsGet('axsub-fin', null), s = lsGet('axsub-resumen', null);
      const vetas = s && s.total ? `${s.picadas}/${s.total} vetas picadas` : '';
      if (f && /energ/i.test(f.motivo || '')) return { prox: Date.now() + 2 * 3600000, info: `${vetas ? vetas + ' · ' : ''}sin energía` };
      const p = s && s.proxima > Date.now() ? Math.max(s.proxima + 60000, Date.now() + 30 * 60000) : Date.now() + 6 * 3600000;
      return { prox: p, info: vetas || 'hecho' };
    },
  };
  // las diarias de hoy, una a una: ya hechas, hechas ahora, con aviso, la de ahora y las que quedan (sin los viajes)
  function listaDiarias(r) {
    const out = [...(r.yaHechas || []).map(n => ({ n, e: 'ya' }))];
    for (const p of r.pasos || []) if (!/^🧭/.test(p.nombre)) out.push({ n: p.nombre, e: p.ok ? 'ok' : p.saltado ? 'salto' : 'mal', m: p.motivo });
    if (r.actual && !r.actual.viaje) out.push({ n: nombrePaso(r.actual, r.casa), e: 'ahora' });
    for (const x of r.cola || []) if (!x.viaje) out.push({ n: nombrePaso(x, r.casa), e: 'luego' });
    return out;
  }
  function robotCierre(a) {
    const id = a.robot || ROBOT_DE[a.href];
    if (!id || !ROBOT_FIN[id] || !robotOn()) return;
    try { rtSet(id, ROBOT_FIN[id]()); } catch (e) { console.warn('[diarias robot]', e); }
  }

  // Entrañas: una bajada entera desde el piso 1 con el script de las Entrañas (la gratis y luego con pases, nunca
  // energía); entre bajada y bajada el robot hace lo demás que toque, y vuelve hasta gastar los pases
  const ENTRANAS = {
    id: 'entranas', nombre: '⛰️ Entrañas', soloRuta: true, sinPanel: true, maxMs: 8 * 3600000,
    detecta: () => ruta() === '/entranas' && document.querySelector('main'),
    desde: 0, dicho: false,
    inicio() { const r = ssGet(); return (r && r.actual && r.actual.arrancado) || 0; },
    fin() { const a = this.inicio(), f = ssLeer(SS_EF.fin); return a && f && f.t >= a ? f : null; },
    listo() { return !!this.fin(); },
    async paso() {
      const f = this.fin();
      if (f) {
        if (!this.dicho) {
          this.dicho = true;
          const b = f.bajadas && f.bajadas[f.bajadas.length - 1];
          log(f.motivo === 'una' && b ? `⛰️ Entrañas: bajada terminada en el piso ${b.piso} con ${b.esq} 💎.` : `⛰️ Entrañas: ${corto(f.motivo || 'parada')}`);
        }
        return false;
      }
      const r = ssGet();
      if (!r || !r.actual) return false;
      if (!r.actual.arrancado) {
        if (!document.getElementById('axe-panel')) {
          if (!this.desde) this.desde = Date.now();
          else if (Date.now() - this.desde > 20000) { log('⚠ ⛰️ No veo el script de las Entrañas: instálalo para que baje solo.'); r.actual.arrancado = Date.now(); ssPut(r); ssSet(SS_EF.fin, { t: Date.now(), motivo: 'sin el script de las Entrañas' }); }
          return false;
        }
        r.actual.arrancado = Date.now(); ssPut(r);
        // bajada tras bajada hasta gastar todos los pases (la gratis del día y luego los tickets; nunca energía)
        ssSet(SS_EF.fin, null); ssSet(SS_EF.una, null); ssSet(SS_EF.bajadas, null); ssSet(SS_EF.on, 1);
        log('⛰️ Entrañas: bajadas desde el piso 1 hasta gastar todos los pases (nunca energía).');
      }
      return true;
    },
  };

  // Subsuelo: «Explorar y picar» del script de las Grutas (antes se pone las Botas del Huerto); las vetas vuelven a
  // llenarse doce horas después de picarlas, y entonces toca otra vez
  const SUBSUELO = {
    id: 'subsuelo', nombre: '⛏️ Subsuelo', soloRuta: true, sinPanel: true, maxMs: 70 * 60000,
    detecta: () => ruta() === '/subsuelo' && document.querySelector('main'),
    desde: 0, dicho: false,
    inicio() { const r = ssGet(); return (r && r.actual && r.actual.arrancado) || 0; },
    fin() { const a = this.inicio(), f = lsGet('axsub-fin', null); return a && f && f.t >= a ? f : null; },
    listo() { return !!this.fin(); },
    enMarcha: () => { const b = document.querySelector('#axsub-panel .k-badge'); return !!b && b.dataset.s === 'on'; },
    async paso() {
      const f = this.fin();
      if (f) {
        if (!this.dicho) { this.dicho = true; const s = lsGet('axsub-resumen', null); log(`⛏️ Subsuelo: ${corto(f.motivo || 'hecho').slice(0, 100)}${s && s.total ? ` (${s.picadas}/${s.total} vetas)` : ''}`); }
        return false;
      }
      const r = ssGet();
      if (!r || !r.actual) return false;
      if (this.enMarcha()) { if (!r.actual.arrancado) { r.actual.arrancado = Date.now(); ssPut(r); } return true; }
      if (!r.actual.arrancado) {
        const b = document.querySelector('#axsub-panel .axsub-exp');
        if (!b) {
          if (!this.desde) this.desde = Date.now();
          else if (Date.now() - this.desde > 25000) { log('⚠ ⛏️ No veo el script de las Grutas: instálalo para que pique las vetas.'); r.actual.arrancado = Date.now(); ssPut(r); lsPut('axsub-fin', { t: Date.now(), motivo: 'sin el script de las Grutas' }); }
          return false;
        }
        r.actual.arrancado = Date.now(); ssPut(r);
        return pulsar(b, '⛏️ Subsuelo: a explorar y picar las vetas (con las Botas del Huerto).', [2000, 3000]);
      }
      return true;                                        // arrancando (o de camino al Huerto a por las botas)
    },
  };


  // Canal Manadas: los 3 encuentros gratis de cada región con el script del Cazador de Manadas («Manadas gratis», que
  // usa la macro de Capturar y Guardería). Va de región en región y por el mapa, y al final vuelve a la tuya.
  const MANADAS = {
    id: 'manadas', nombre: '📺 Canal Manadas', soloRuta: true, sinPanel: true, maxMs: 50 * 60000,
    detecta: () => ruta() === '/manadas' && document.querySelector('main'),
    desde: 0, dicho: false,
    inicio() { const r = ssGet(); return (r && r.actual && r.actual.arrancado) || 0; },
    fin() { const a = this.inicio(), u = lsGet('mh-gratis-ultimo', null); return a && u && (u.t || 0) >= a ? u : null; },
    listo() { return !!this.fin(); },
    async paso() {
      const f = this.fin();
      if (f) {
        if (!this.dicho) { this.dicho = true; for (const l of (f.log || []).filter(l => /^(✅|⚠)/.test(l)).slice(-5)) log(`📺 ${l}`); }
        return false;
      }
      const r = ssGet();
      if (!r || !r.actual) return false;
      if (r.actual.arrancado) {
        // lo que va haciendo el Cazador de Manadas (región a región), a la tarjeta
        const g = ssLeer('mh-gratis-fondo') || ssLeer('mh-gratis'), u = g && g.log && g.log[g.log.length - 1];
        if (u && u !== this.ultimo && !/^🐾 Empiezo/.test(u)) { this.ultimo = u; log(`📺 ${u}`); }
        return true;
      }
      const b = document.querySelector('#mh-gratis button');
      if (!b) {
        if (!this.desde) this.desde = Date.now();
        else if (Date.now() - this.desde > 20000) { log('⚠ 📺 No veo el Cazador de Manadas: instálalo (y la macro de Capturar y Guardería) para las manadas gratis.'); r.actual.arrancado = Date.now(); ssPut(r); lsPut('mh-gratis-ultimo', { dia: hoy(), t: Date.now(), log: [] }); }
        return false;
      }
      r.actual.arrancado = Date.now(); ssPut(r);
      return pulsar(b, '📺 Manadas: toda la manada (los 10 encuentros) de cada región (te muevo por el mapa y vuelvo a tu región).', [2000, 3000]);
    },
  };
  const manadasPendientes = () => { const u = lsGet('mh-gratis-ultimo', null); return !(u && u.dia === hoy()); };

  // MissingNo. (/jefe, un día de cada tres): se le pega gratis (no gasta energía ni daña al equipo; solo cuenta tu mejor
  // golpe) y, cuando cae, se tira de la ruleta para cobrar
  const LS_MN = 'axd-missingno', MN_GOLPES = 12;
  const MISSINGNO = {
    id: 'missingno', nombre: '👾 MissingNo.', soloRuta: true, sinPanel: true, maxMs: 15 * 60000,
    detecta: () => ruta() === '/jefe' && document.querySelector('main'),
    golpes() { const g = lsGet(LS_MN, {}); return g.dia === hoy() ? g.n || 0 : 0; },
    saltar: () => $$('button').find(b => !ajeno(b) && !b.disabled && /saltar al resultado/i.test(texto(b))),
    listo() { return !this.saltar() && !botonMain(/tirar de la ruleta/i) && (!botonMain(/^atacar$/i) || this.golpes() >= MN_GOLPES); },
    async paso() {
      const s = this.saltar();
      if (s) return pulsar(s, '');
      const rul = botonMain(/tirar de la ruleta/i);
      if (rul) return pulsar(rul, '👾 MissingNo.: tiro de la ruleta para cobrar.', [5000, 6500]);
      const at = botonMain(/^atacar$/i), n = this.golpes();
      if (at && n < MN_GOLPES) { lsPut(LS_MN, { dia: hoy(), n: n + 1 }); return pulsar(at, `👾 MissingNo.: golpe ${n + 1} de ${MN_GOLPES} (solo cuenta el mejor).`, [2500, 3500]); }
      return pulsarSeguir();
    },
  };
  // ¿hay algo que hacer en MissingNo.? (se mira por detrás)
  async function missingnoPendiente() {
    const { doc, texto: t } = await leerPagina('/jefe');
    const bot = re => [...doc.querySelectorAll('main button')].find(b => re.test(texto(b)) && !b.disabled);
    const mejor = (t.match(/([\d.]+)\s*tu mejor/i) || [])[1];
    if (bot(/tirar de la ruleta/i)) return { listo: true, info: 'ha caído: a tirar de la ruleta' };
    if (bot(/^atacar$/i) && lsGet(LS_MN, {}).dia !== hoy()) return { listo: true, info: 'está: a por él' };
    if (bot(/^atacar$/i) && (lsGet(LS_MN, {}).n || 0) < MN_GOLPES) return { listo: true, info: 'está: a por él' };
    const info = /no est[aá]/i.test(t) ? (/ya cobraste/i.test(t) ? 'no está (ya cobraste el último)' : 'no está hoy') : `golpeado${mejor ? `, tu mejor ${mejor}` : ''}; la ruleta, cuando caiga`;
    return { listo: false, prox: Date.now() + 2 * 3600000, info };
  }

  /* ══════════ Tienda de Cartas (/cartas) ══════════
   * Cada ficha (la gratis del día, la del Valle cada 12 h…) es un sobre: se abren todos los que haya. Nunca se compran
   * fichas ni se gasta dinero. Se abre en la serie a la que le queda menos para su siguiente premio del álbum (25
   * distintas, la mitad, completa); las series completas se saltan. También los sobres sellados de la mochila, si hay. */
  const LS_CARTAS = 'axd-cartas-listo';
  const cartasP = () => !(+lsGet(LS_CARTAS, 0) > Date.now());
  const CARTAS = {
    id: 'cartas', nombre: '🃏 Sobres de Cartas', soloRuta: true, sinPanel: true, maxMs: 6 * 60000,
    detecta: () => ruta() === '/cartas' && document.querySelector('main'),
    abiertos: 0, nuevas: 0, dicho: false,
    fichas() { const m = textoMain().match(/★\s*(\d+)\s*fichas?/i); return m ? +m[1] : null; },
    // las series con lo que llevas: [{ nombre, tengo, total, boton }]
    series() {
      return $$('main button').filter(b => !ajeno(b)).map(b => { const m = texto(b).match(/^([^\d\s]+)\s*(\d+)\s*\/\s*(\d+)$/); return m && { nombre: m[1], tengo: +m[2], total: +m[3], boton: b }; }).filter(Boolean);
    },
    // a cuántas le queda para el siguiente premio (25, la mitad, completa)
    faltan(x) { const hitos = [25, Math.ceil(x.total / 2), x.total].filter(h => h > x.tengo); return hitos.length ? Math.min(...hitos) - x.tengo : Infinity; },
    elegida() { const m = textoMain().match(/Sobre de (\S+) ·/); return m ? m[1] : ''; },
    mejor() { const l = this.series().filter(x => x.tengo < x.total).sort((a, b) => this.faltan(a) - this.faltan(b)); return l[0] || null; },
    overlaySeguir() { return $$('button').find(b => !ajeno(b) && !b.disabled && visible(b) && /^seguir$/i.test(texto(b)) && b.closest('div.fixed')); },
    sellado() { return $$('main button').find(b => !ajeno(b) && !b.disabled && visible(b) && /^abrir\b(?!\s*ahora)/i.test(texto(b)) && /sellad/i.test(texto(b))); },
    listo() {
      if (this.overlaySeguir()) return false;
      const f = this.fichas();
      if (f == null || !this.series().length) return false;
      const sinSerie = !this.mejor();
      if ((f > 0 && !sinSerie) || this.sellado()) return false;
      lsPut(LS_CARTAS, Date.now() + (sinSerie ? 12 : 4) * 3600000);
      if (!this.dicho) { this.dicho = true; log(this.abiertos ? `🃏 Cartas: ${this.abiertos} sobre${this.abiertos > 1 ? 's' : ''} abierto${this.abiertos > 1 ? 's' : ''}${this.nuevas ? `, ${this.nuevas} carta${this.nuevas > 1 ? 's' : ''} nueva${this.nuevas > 1 ? 's' : ''}` : ''}.` : sinSerie ? '🃏 Cartas: todas las series completas.' : '🃏 Cartas: no hay fichas ni sobres por abrir.'); }
      return true;
    },
    async paso() {
      const seg = this.overlaySeguir();
      if (seg) {
        const ov = seg.closest('div.fixed'), n = (texto(ov).match(/¡Nueva!/g) || []).length;
        this.nuevas += n;
        return pulsar(seg, `🃏 Sobre de ${((ov.innerText || '').match(/Sobre de ([^\s✕]+)/) || [])[1] || 'cartas'}: ${n ? n + ' carta' + (n > 1 ? 's' : '') + ' nueva' + (n > 1 ? 's' : '') : 'sin cartas nuevas'}.`, [800, 1300]);
      }
      const sel = this.sellado();
      if (sel) { this.abiertos++; return pulsar(sel, '🃏 Abro un sobre sellado de la mochila.', [1200, 1800]); }
      const f = this.fichas();
      if (!f) return false;
      const m = this.mejor();
      if (!m) return false;
      if (this.elegida() !== m.nombre) return pulsar(m.boton, `🃏 Serie ${m.nombre} (${m.tengo}/${m.total}): la que más cerca tiene su premio.`, [700, 1200]);
      const ab = botonMain(/^abrir ahora$/i);
      if (!ab) return true;                                               // (abriéndose: la página lo bloquea un momento)
      this.abiertos++;
      return pulsar(ab, '', [1000, 1600]);
    },
  };

  const DIARIAS = [QUIEN, POKEATHLON, MUELLE, CARRERAS, BUCEO, TREN, SAFARI, VIAJE, CANTERA, ALBUM, TRETA, HUERTO, VALLE, SALON, JESSIE, MISIONES, ISLA, SOLAR, TRONOS, TORRE, ENTRANAS, SUBSUELO, MANADAS, MISSINGNO, CARTAS];

  /* ══════════ Ruta: jugar todas las diarias seguidas ══════════
   * Desde el menú se apuntan las diarias de «Para hoy» que aún no están hechas y que el script sabe jugar; se va a
   * cada una, se juega hasta que no queda nada que hacer y se pasa a la siguiente. Luego, los Safaris de las demás
   * regiones (se viaja a cada una y se vuelve a la tuya al final). Al acabar vuelve al menú con el resumen. Va en
   * sessionStorage: sobrevive a las recargas de esta pestaña y muere al cerrarla. */
  // la ruta en segundo plano va con su propia clave: la pestaña y la ventana oculta comparten el sessionStorage
  const SS_RUTA = EN_FONDO ? 'axd-ruta-fondo' : 'axd-ruta';
  const SS_FONDO = 'axd-ruta-fondo', SS_AHORA = 'axd-fondo-ahora', SS_LATIDO = 'axd-fondo-latido', SS_FIN = 'axd-fondo-fin';
  const ssGet = () => { try { return JSON.parse(sessionStorage.getItem(SS_RUTA) || 'null'); } catch { return null; } };
  const ssPut = r => { try { if (r) sessionStorage.setItem(SS_RUTA, JSON.stringify(r)); else sessionStorage.removeItem(SS_RUTA); } catch { /* nada */ } };
  function ssLeer(k) { try { return JSON.parse(sessionStorage.getItem(k) || 'null'); } catch { return null; } }
  function ssSet(k, v) { try { if (v == null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, JSON.stringify(v)); } catch { /* nada */ } }
  // dirección → diaria que la juega
  const RUTAS = { '/jessie-y-james': JESSIE, '/siluetas': QUIEN, '/pokeathlon': POKEATHLON, '/pesca': MUELLE, '/carreras': CARRERAS, '/buceo': BUCEO, '/safari': SAFARI, '/cantera': CANTERA, '/album': ALBUM };
  // las que no salen en el menú (o no con su estado): Tren (Teselia) y Casa Treta (Hoenn)
  const EXTRA = { '/tren': TREN, '/casa': TRETA, '/huerto': HUERTO, '/valle': VALLE, '/salon': SALON, '/misiones': MISIONES, '/isla': ISLA, '/solar': SOLAR, '/tronos': TRONOS, '/torre': TORRE, '/entranas': ENTRANAS, '/subsuelo': SUBSUELO, '/manadas': MANADAS, '/jefe': MISSINGNO, '/cartas': CARTAS };
  // las que se hacen en casa en cada ruta (las juegan sus scripts): Huerto (Meloc/Latano), Valle («Hacerlo todo») y los
  // respiros del Salón (una vez al día; si el cupo ya está, su script para solo)
  // lo que ya se ha hecho hoy (cada diaria en su región): la ruta lo salta sin ir a mirarlo. Lo que va por tiempos
  // (Huerto, Isla, Torre, Tronos, Misiones, Entrañas, Subsuelo, MissingNo, Manadas) se sigue mirando cada vez
  const LS_HECHAS = 'axd-hechas-hoy';
  const REPITEN = ['/huerto', '/isla', '/misiones', '/torre', '/tronos', '/entranas', '/subsuelo', '/valle', '/jefe', '/manadas', '/cartas'];
  const claveHecha = (x, casa) => x.href + '@' + (x.region || (x.href === '/safari' || x.href === '/casa' ? casa || '' : ''));
  const hechasHoy = () => { const h = lsGet(LS_HECHAS, null); return h && h.dia === hoy() && Array.isArray(h.k) ? h.k : []; };
  const yaHoy = (x, casa) => !!x && !x.viaje && !REPITEN.includes(x.href) && hechasHoy().includes(claveHecha(x, casa));
  function apuntarHecha(x, casa) {
    if (!x || x.viaje || REPITEN.includes(x.href)) return;
    const k = hechasHoy(), c = claveHecha(x, casa);
    if (!k.includes(c)) { k.push(c); lsPut(LS_HECHAS, { dia: hoy(), k }); }
  }
  const DE_CASA = () => [{ href: '/huerto' }, { href: '/valle' }, ...(lsGet('axd-salon-hecho', '') === hoy() ? [] : [{ href: '/salon' }]), ...(cartasP() ? [{ href: '/cartas' }] : [])];
  // las que no sé jugar (se dicen y se saltan); Jessie y James, Solar y MissingNo no hacen falta
  const NO_SE = {};
  const ruta = () => location.pathname.replace(/\/+$/, '') || '/';
  const CERRADA = /🔒|vag[oó]n est[aá] vac[ií]o|vuelve mañana|por hoy (ya|se)|mañana (hay|pican|más|pican)|se acab[oó] el programa|cierra el puesto|has hecho tu visita de hoy|te espera mañana|se vino abajo/i;
  const POR_DIARIA_MS = 8 * 60 * 1000;          // por si una se atasca (el Safari es lo más largo)
  function leerMenu() {
    // Las diarias son enlaces del menú; las hechas van dentro del desplegable «hechos hoy» (y su pastilla lo dice)
    const out = [];
    for (const a of $$('main a[href]').filter(a => !ajeno(a))) {
      const href = (a.getAttribute('href') || '').replace(/[?#].*$/, '').replace(/\/+$/, '');
      if (!(RUTAS[href] || NO_SE[href]) || out.some(x => x.href === href)) continue;
      const estado = texto(a.querySelector('.pastilla'));
      const jj = href === '/jessie-y-james' && estado.match(/(\d+)\s*de\s*(\d+)/);   // «3 de 3 esta semana»: plan parado
      const hecha = !!a.closest('details') || /hecho|parad|cerrad|mañana|tumbad/i.test(estado) || !!(jj && +jj[1] >= +jj[2]);
      const nombre = texto(a.querySelector('.font-extrabold')) || texto(a).replace(estado, '');
      out.push({ href, nombre, estado, hecha, sabe: !!RUTAS[href] });
    }
    return out;
  }
  // la región en la que estás (la dice el enlace de viajar) y, si el Safari de aquí ya está hecho, se apunta
  function apuntarSafariCasa(menu) {
    const ev = enlaceViaje(), casa = ev ? regionDe(texto(ev).replace(/viajar a otra regi[oó]n.*/i, '')) : '';
    const s = safarisHoy();
    if (casa && menu.some(d => d.href === '/safari' && d.hecha) && !s.hechas.includes(casa)) { s.hechas.push(casa); lsPut('axd-safaris', s); }
    return casa;
  }
  const enlaceViaje = () => $$('main a[href]').find(a => !ajeno(a) && /viajar a otra regi/i.test(texto(a)));
  async function iniciarRuta(opc = {}) {
    if (ruta() !== '/menu') { ssPut({ preparar: true, t: Date.now(), robot: opc.robot }); location.assign('/menu'); return; }
    const menu = leerMenu();
    // primero lo que cambia de región (las Manadas y los viajes con sus Safaris), luego lo de casa y al final lo demás
    const deCasa = menu.filter(d => !d.hecha && d.sabe).map(d => ({ href: d.href })), viajes = [], alFinal = [];
    pintarMenu(['Mirando qué queda…']);
    etapaYendo('Mirando qué queda por hacer hoy', 'Leo el menú y miro por detrás Casa Treta, Misiones, Isla, Tronos y Torre');
    // lo que no sale en «Para hoy» se mira por detrás, todo a la vez
    const [ct, misionesP, islaP, tronosP, torreP] = await Promise.all([tretaPendiente(), misionesPendientes(), islaAbierta(), sinTrono(), torrePendiente()]);
    const solarP = !(+lsGet(LS_SOLAR, 0) > Date.now());
    const trenHecho = lsGet('axd-tren-hecho', '') === hoy();
    // lo que hay que hacer en cada región además de su Safari
    const extras = g => [...(g === 'Teselia' && !trenHecho ? [{ href: '/tren', region: g }] : []), ...(g === 'Teselia' && solarP ? [{ href: '/solar', region: g }] : []), ...(g === 'Hoenn' && treta ? [{ href: '/casa', region: g }] : [])];
    const log0 = menu.filter(d => !d.hecha && !d.sabe).map(d => `⏭ ${d.nombre}: ${NO_SE[d.href]}, te la dejo.`);
    const yaHechas = menu.filter(d => d.hecha && d.sabe).map(d => d.nombre);
    // Safaris de las demás regiones (y el Tren, que está en Teselia): se viaja y al final se vuelve
    const ev = enlaceViaje(), casa = apuntarSafariCasa(menu);
    // en Hoenn pero cerrada: hay que estar en su ruta del mapa (eso no lo hago: moverías tu sitio en el mapa)
    let treta = ct.pendiente;
    if (treta && ct.cerrada && casa === 'Hoenn') { treta = false; log0.push(`⏭ 🚪 La Casa Treta: solo se entra estando en la ${ct.ruta || 'su ruta'}; esa te la dejo.`); }
    const s = safarisHoy();
    if (casa) deCasa.push(...extras(casa));
    deCasa.push(...DE_CASA());
    if (islaP) deCasa.push({ href: '/isla' });
    if (casa) {
      const sr0 = lsGet('axd-sin-reserva', {}), sinReserva = Object.keys(sr0).filter(g => Date.now() - sr0[g] < 7 * 864e5);
      const destinos = REGIONES.filter(g => norm(texto(ev)).includes(norm(g)));
      // solo se viaja a donde queda algo por hacer hoy
      const deFuera = g => [...(!s.hechas.includes(g) && !sinReserva.includes(g) ? [{ href: '/safari', region: g }] : []), ...extras(g)].filter(x => !yaHoy(x, casa));
      const fuera = destinos.filter(g => g !== casa && deFuera(g).length);
      for (const g of fuera) viajes.push({ viaje: g }, ...deFuera(g));
      if (fuera.length) viajes.push({ viaje: casa, vuelta: true });
    } else log0.push('⚠ No encuentro en el menú en qué región estás: solo juego las de aquí.');
    // al final, ya en casa: los Tronos (si no tienes ninguno), la Torre (con sus esperas de 15 min) y cobrar las misiones
    // (con el robot, los Tronos y la Torre van aparte, cuando les toca)
    if (tronosP && !opc.robot) alFinal.push({ href: '/tronos' });
    if (torreP && !opc.robot) alFinal.push({ href: '/torre' });
    if (misionesP || torreP || tronosP) alFinal.push({ href: '/misiones' });
    // lo que ya hice hoy ni se visita: sale como «ya estaba»
    const deCasaHoy = deCasa.filter(x => { if (!yaHoy(x, casa)) return true; const n = nombrePaso(x, casa); if (!yaHechas.includes(n)) yaHechas.push(n); return false; });
    const cola = [...(manadasPendientes() ? [{ href: '/manadas', otras: '*' }] : []), ...viajes, ...deCasaHoy, ...alFinal];
    if (!cola.length) {
      ssPut(null);
      pintarMenu([...log0, '✅ Las que sé jugar ya están hechas hoy.']);
      if (EN_FONDO) ssSet(SS_FIN, { t: Date.now(), t0: Date.now(), pasos: [], yaHechas, avisos: log0, robot: opc.robot });
      if (opc.robot === 'diarias') rtSet('diarias', { prox: manana(), info: 'las que sé jugar, hechas', casa, dia: hoy(), lista: listaDiarias({ yaHechas, pasos: [], cola: [] }) });
      return;
    }
    const r = { cola, hechas: [], log: [...log0], actual: null, casa, pasos: [], yaHechas, avisos: log0, t0: Date.now(), robot: opc.robot };
    ssPut(r);
    pintarMenu([...log0, `▶ Voy: ${cola.map(nombreDe).join(' → ')}.`]);
    siguiente(r);
  }
  const nombreDe = x => x.viaje ? `🧭 ${x.viaje}` : `${(RUTAS[x.href] || EXTRA[x.href]).nombre}${x.region ? ' ' + x.region : ''}`;
  // (el Safari de tu región no lleva región en la ruta: se le pone para la tarjeta)
  const nombrePaso = (x, casa) => x.viaje ? `🧭 ${x.vuelta ? 'Vuelta a' : 'Viaje a'} ${x.viaje}` : x.href === '/safari' && !x.region && casa ? nombreDe({ ...x, region: casa }) : nombreDe(x);
  async function siguiente(r) {
    // el paso que acaba (para la tarjeta: ✅ si fue bien, ⚠ si se saltó o se atascó)
    if (r.actual && !r.actual.viaje && EN_FONDO) robotCierre(r.actual);
    if (r.actual && r.pasos) {
      const nuevos = r.log.slice(r.actual.logDesde || 0);
      const malo = nuevos.filter(l => /^(⚠|⏭)/.test(l)).pop();
      r.pasos.push({ nombre: nombrePaso(r.actual, r.casa), ok: !malo, saltado: (malo && /^⏭/.test(malo)) || undefined, motivo: malo ? corto(malo.replace(/^(⚠️?|⏭)\s*/, '')) : undefined, seg: Math.round((Date.now() - (r.actual.desde || Date.now())) / 1000) });
    }
    const antes = r.cola.map(x => nombrePaso(x, r.casa));
    limpiarCola(r);
    // lo que limpiarCola quita (un viaje que se queda sin nada que hacer, un Safari sin su script…) cuenta como saltado
    if (r.pasos) { const quedan = r.cola.map(x => nombrePaso(x, r.casa)); for (const n of antes) { const i = quedan.indexOf(n); if (i >= 0) quedan.splice(i, 1); else r.pasos.push({ nombre: n, ok: false, saltado: true }); } }
    const x = r.cola.shift();
    if (x && x.viaje && !x.vuelta) r.fuera = true;
    r.actual = x ? { ...x, desde: Date.now(), logDesde: r.log.length } : null;
    ssPut(r);
    etapaYendo(x ? (x.viaje ? `Abriendo el mapa de regiones para ir a ${x.viaje}` : `Entrando en ${nombrePaso(x, r.casa).replace(/^[^\p{L}¿]+/u, '')}`) : 'Cerrando la ruta', x ? '' : 'Apuntando lo hecho');
    await sleep((1500 + Math.random() * 1300) * VEL());
    if (!ssGet()) return;                                    // lo han parado mientras
    // los viajes se empiezan desde el menú (el enlace a «Viajar a otra región» cambia según dónde estés)
    location.assign(!x || x.viaje ? '/menu' : x.href);
  }
  // sin Safari Auto (o sin Casa Treta) fuera lo suyo; y un viaje que se ha quedado sin nada que hacer allí, fuera también
  function limpiarCola(r) {
    if (r.sinSafari) r.cola = r.cola.filter(x => x.href !== '/safari');
    if (r.sinTreta) r.cola = r.cola.filter(x => x.href !== '/casa');
    r.cola = r.cola.filter((x, i, c) => !(x.viaje && !x.vuelta && (!c[i + 1] || c[i + 1].viaje)));
    if (!r.fuera && !r.cola.some(x => x.viaje && !x.vuelta)) r.cola = r.cola.filter(x => !x.vuelta);
  }
  function pararRuta(motivo) {
    const r = ssGet();
    if (!r) return;
    ssPut(null);
    log(`⏹ ${motivo || 'Ruta parada.'}${r.fuera ? ` Ojo: te he dejado fuera de ${r.casa}.` : ''}`);
  }
  // en una diaria de la ruta: ¿se ha acabado?
  let quietoDesde = 0;
  function rutaEnDiaria(d, hizo) {
    const r = ssGet();
    if (!r || !r.actual || r.actual.href !== ruta()) return;
    // en la página de otra región (el viaje no salió): no se toca ni se apunta nada
    if (r.actual.region && d.otraRegion && d.otraRegion(r.actual.region)) {
      const msg = d.motivoFuera ? d.motivoFuera() : `⚠ ${d.nombre}: no estoy en ${r.actual.region}, lo salto.`;
      r.log.push(msg); log(msg); quietoDesde = 0; ssPut(r); siguiente(r); return;
    }
    const listo = d.listo ? d.listo() : false;
    // (el tiempo máximo cuenta aunque la parada siga «haciendo algo»: antes una que pulsaba sin fin no acababa nunca)
    if (hizo && !listo && Date.now() - r.actual.desde <= (d.maxMs || POR_DIARIA_MS)) { quietoDesde = 0; return; }
    if (!quietoDesde) quietoDesde = Date.now();
    const quieto = Date.now() - quietoDesde;
    // un viaje que no llega: fuera también lo que había que hacer allí
    if (r.actual.viaje && !listo && quieto > 10000) {
      const msg = `⚠ 🧭 No he podido viajar a ${r.actual.viaje}${r.actual.vuelta ? '. Vuelve tú a ' + r.actual.viaje : ''}.`;
      while (r.cola.length && !r.cola[0].viaje) r.cola.shift();
      r.log.push(msg); log(msg); quietoDesde = 0; ssPut(r); siguiente(r); return;
    }
    const cerrada = listo || CERRADA.test(textoMain());
    const agotada = Date.now() - r.actual.desde > (d.maxMs || POR_DIARIA_MS);
    // antes de darla por perdida, se recarga una vez: a veces la página no se entera de que ya está hecha (p. ej. el
    // Safari tras salir) y al volver a cargarla lo dice
    const esperaFin = EN_FONDO ? 7000 : 12000;               // sin nada que hacer tanto rato: se da por acabada
    if (!r.actual.viaje && !cerrada && !agotada && quieto > esperaFin && !r.actual.recargada) {
      r.actual.recargada = true; ssPut(r); quietoDesde = 0; location.reload(); return;
    }
    if (!r.actual.viaje && ((cerrada && quieto > (EN_FONDO ? 700 : 1500)) || quieto > esperaFin || agotada) || (r.actual.viaje && listo && quieto > (EN_FONDO ? 400 : 800))) {
      const nom = r.actual.viaje ? `🧭 Viaje a ${r.actual.viaje}` : `${d.nombre}${r.actual.region ? ' ' + r.actual.region : ''}`;
      const msg = agotada ? `⚠ ${nom}: se me ha atascado, la dejo.` : cerrada ? `✅ ${nom}${r.actual.viaje ? '' : ': hecha'}.` : `⚠ ${nom}: no veo nada más que hacer (si no está hecha, pásame su HTML).`;
      if (r.actual.viaje && r.actual.vuelta && listo) r.fuera = false;
      if (!r.actual.viaje) r.hechas.push(r.actual.href);
      if (!r.actual.viaje && cerrada && !agotada) apuntarHecha(r.actual, r.casa);
      r.log.push(msg); log(msg);
      quietoDesde = 0;
      ssPut(r);
      siguiente(r);
    }
  }

  /* ── Panel del menú ── */
  const MENU_ID = 'axd-menu';
  function pintarMenu(lineas) {
    const p = document.getElementById(MENU_ID);
    if (!p) return;
    const r = ssGet();
    p.querySelector('.axd-todas').textContent = r || fondoActivo() ? '⏹ Parar' : '▶ Jugar todas las diarias (en segundo plano)';
    if (lineas) p.querySelector('.axd-log').textContent = lineas.join('\n');
  }
  function montarMenu() {
    if (document.getElementById(MENU_ID)) return;
    const cab = $$('main h2, main h3').find(h => /para hoy/i.test(texto(h)));
    if (!cab) return;
    const p = document.createElement('section');
    p.id = MENU_ID;
    p.setAttribute('data-ax-ignore', '');
    p.style.cssText = 'background:#131A2B;border:2px solid #2E3B57;color:#C9D3E3;border-radius:22px;padding:10px 12px;font-size:12px;line-height:1.4;margin:6px 0 10px';
    const zona = lsGet('axd-buceo-zona', 'grieta');
    p.innerHTML = `<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><b style="flex:1">🗓️ Diarias</b>
      <label style="font-size:11px">🤿 <select class="axd-zona" style="background:#2E3B57;color:#fff;border-radius:8px;padding:2px 4px">
        ${['grieta', 'arena', 'algas'].map(z => `<option value="${z}"${z === zona ? ' selected' : ''}>${z}</option>`).join('')}</select></label>
      <button type="button" class="axd-todas" style="background:#2E3B57;color:#fff;border-radius:12px;padding:4px 10px;font-weight:800"></button></div>
      <pre class="axd-log" style="white-space:pre-wrap;margin:6px 0 0;font:11px/1.4 ui-monospace,monospace;color:#9fb0c8;max-height:200px;overflow:auto"></pre>`;
    p.querySelector('.axd-zona').addEventListener('change', e => lsPut('axd-buceo-zona', e.target.value));
    p.querySelector('.axd-todas').addEventListener('click', () => {
      if (ssGet()) { const r = ssGet(); ssPut(null); pintarMenu([`⏹ Parado.${r.fuera ? ` Ojo: estás fuera de ${r.casa}.` : ''}`]); }
      else if (fondoActivo()) fondo.parar();
      else fondo.iniciar();
    });
    cab.insertAdjacentElement('afterend', p);
    const r = ssGet();
    if (r && r.log && r.log.length) { pintarMenu(r.log); return; }
    const menu = leerMenu(); apuntarSafariCasa(menu);
    const pend = menu.filter(d => !d.hecha && d.sabe);
    pintarMenu([pend.length ? `Pendientes que sé jugar: ${pend.map(d => d.nombre).join(', ')}.` : 'Las de aquí que sé jugar ya están hechas hoy.',
      `Safaris hechos hoy: ${safarisHoy().hechas.join(', ') || 'ninguno'}.`]);
  }
  function tickMenu() {
    if (!EN_FONDO) montarMenu();
    const r = ssGet();
    if (!r || ocupado) return;
    // (mientras se prepara, la ruta sigue apuntada: si no, la tarjeta y el icono parpadean y una recarga la perdería)
    if (r.preparando) { if (Date.now() - (r.t || 0) > 60000) ssPut({ preparar: true, t: Date.now(), robot: r.robot }); return; }
    if (r.preparar) {
      ocupado = true; ssPut({ preparando: true, t: Date.now(), robot: r.robot });
      iniciarRuta({ robot: r.robot }).catch(e => { console.warn('[diarias]', e); ssPut(null); }).finally(() => { ocupado = false; });
      return;
    }
    if (r.actual && r.actual.viaje && !r.actual.href) {
      // a la página de viajes
      const ev = enlaceViaje();
      if (!ev) { r.log.push('⚠ No encuentro «Viajar a otra región» en el menú.'); r.actual = null; r.cola = r.cola.filter(x => !x.viaje && !x.region); ssPut(r); return; }
      r.actual.href = (ev.getAttribute('href') || '').replace(/[?#].*$/, '').replace(/\/+$/, '');
      ssPut(r);
      if (regionDe(texto(ev).replace(/viajar a otra regi[oó]n.*/i, '')) === r.actual.viaje) {
        // ya estoy ahí
        r.log.push(`🧭 En ${r.actual.viaje}.`); if (r.actual.vuelta) r.fuera = false; ssPut(r);
        ocupado = true; siguiente(r).finally(() => { ocupado = false; }); return;
      }
      ocupado = true;
      sleep(800 + Math.random() * 800).then(() => { if (ssGet()) location.assign(r.actual.href); }).finally(() => { ocupado = false; });
      return;
    }
    if (r.actual) return;                                    // de camino a una diaria
    if (r.cola.length) { ocupado = true; siguiente(r).finally(() => { ocupado = false; }); return; }
    // se acabó la ruta
    ssPut(null);
    pintarMenu([...r.log, `🏁 Ruta terminada: ${r.hechas.length} jugada${r.hechas.length === 1 ? '' : 's'}.`]);
    if (EN_FONDO) ssSet(SS_FIN, { t: Date.now(), t0: r.t0, pasos: r.pasos || [], yaHechas: r.yaHechas || [], avisos: r.avisos || [], fuera: r.fuera, casa: r.casa, robot: r.robot });
    if (r.robot === 'diarias') { const ok = (r.pasos || []).filter(p => p.ok).length; rtSet('diarias', { prox: manana(), info: `${ok} hecha${ok === 1 ? '' : 's'}${(r.yaHechas || []).length ? ` (+${r.yaHechas.length} que ya estaban)` : ''}`, casa: r.casa, dia: hoy(), lista: listaDiarias(r) }); }
  }

  // ¿toca jugar aquí? (modo solo, o esta página es la parada actual de la ruta; en el menú manda la ruta)
  function jugando() {
    if (!EN_FONDO && fondoActivo()) return false;
    const r = ssGet();
    if (ruta() === '/menu') return !!r;
    return auto || !!(r && r.actual && r.actual.href === ruta());
  }

  /* ── Bucle ── */
  let ocupado = false, parado = false, buscando = 0, perdido = 0;
  // en la ruta pero en otra página (una redirección, el viaje que te lleva al mapa…): se vuelve, y a la tercera se salta
  function perdida(r) {
    if (!r || !r.actual || !r.actual.href || r.actual.href === ruta() || r.actual.otras === '*' || (r.actual.otras || []).includes(ruta())) { perdido = 0; return false; }
    if (!perdido) { perdido = Date.now(); return true; }
    if (Date.now() - perdido < 8000) return true;
    perdido = 0;
    const a = r.actual;
    a.perdido = (a.perdido || 0) + 1;
    if (a.perdido > 2) {
      if (a.href === '/safari' && a.region) sinReserva(a.region);
      r.log.push(`⚠ ${a.viaje ? '🧭 Viaje a ' + a.viaje : a.href + (a.region ? ' en ' + a.region : '')}: no consigo llegar, lo salto.`);
      ssPut(r); siguiente(r); return true;
    }
    if (a.viaje) { delete a.href; ssPut(r); location.assign('/menu'); } else { ssPut(r); location.assign(a.href); }
    return true;
  }
  /* ══════════ Dónde está cada diaria por dentro (para la tarjeta de la pestaña) ══════════
   * La ventana oculta publica, mientras juega, la actividad, la etapa concreta y su avance; la tarjeta lo enseña tal
   * cual. Sale de la propia página del juego y de los paneles de los scripts que la juegan (todos llevan su línea de
   * estado «.k-sub» y su registro «.k-log»). */
  const SS_ETAPA = 'axd-fondo-etapa';
  const PANEL_DE = { safari: '#ax-safari-auto', casa: '#ct-embedded-panel', valle: '#axv-panel', salon: '#ax-salon-auto', huerto: '#axh-panel', isla: '#axi-panel', entranas: '#axe-panel', subsuelo: '#axsub-panel' };
  const sinHora = t => String(t || '').replace(/^\d\d:\d\d(:\d\d)?\s+/, '').replace(/\s+/g, ' ').trim();
  function panelDice(sel) {
    const p = sel && document.querySelector(sel);
    if (!p) return {};
    const ls = p.querySelectorAll('.k-log > p, [data-ax="log"]');
    return { sub: texto(p.querySelector('.k-sub')), ult: ls.length ? sinHora(texto(ls[ls.length - 1])) : '' };
  }
  // contadores que el juego enseña en casi todas: «6 / 6 aciertos», «Te quedan 2 de 5», «Planta 3 de 8»…
  function progresoPagina() {
    const t = textoMain();
    let m = t.match(/(\d+)\s*\/\s*(\d+)\s*aciertos/i);
    if (m) return { det: `${m[1]} de ${m[2]} aciertos`, pct: +m[1] / +m[2] };
    m = t.match(/te quedan?\s*(\d+)\s*de\s*(\d+)/i);
    if (m) return { det: `quedan ${m[1]} de ${m[2]}`, pct: 1 - +m[1] / +m[2] };
    m = t.match(/\b(silueta|carrera|tirada|bajada|prueba|foto|ronda|pregunta|reto|combate)\s*(\d+)\s*(?:de|\/)\s*(\d+)/i);
    if (m) return { det: `${m[1][0].toUpperCase() + m[1].slice(1).toLowerCase()} ${m[2]} de ${m[3]}`, pct: (+m[2] - 1) / +m[3] };
    m = t.match(/(\d+)\s*grietas?/i);
    if (m && ruta() === '/cantera') return { det: `${m[1]} de 14 grietas`, pct: null };
    return {};
  }
  VIAJE.etapa = function () { const d = this.destino(), e = this.estoy(); return { fase: d ? `Viajando${e && e !== d ? ` de ${e}` : ''} a ${d}` : 'En la página de Regiones', det: e === d ? `Ya en ${d}` : 'Pulso «Viajar a…» y espero a llegar' }; };
  SAFARI.etapa = function () {
    if (this.cerrada()) return { fase: 'Visita de hoy terminada', pct: 1 };
    // los contadores del juego: etiqueta («Pasos») y debajo su número (igual que los lee Safari Auto)
    const stat = l => { const p = $$('main p').find(x => !x.closest('#ax-safari-auto') && texto(x).toLowerCase() === l); const m = p && p.nextElementSibling && texto(p.nextElementSibling).match(/-?\d+/); return m ? +m[0] : null; };
    const pasos = stat('pasos'), balls = stat('balls'), atr = stat('atrapados');
    const pd = panelDice('#ax-safari-auto');
    if (pasos == null) return { fase: pd.ult || 'Entrando en la reserva…' };
    this.pasosMax = Math.max(this.pasosMax || 0, pasos);
    return { fase: pd.ult || 'Andando por la reserva', det: `👣 ${pasos} pasos · ⚾ ${balls ?? '?'} Balls · 🎒 ${atr ?? 0} atrapado${atr === 1 ? '' : 's'}`, pct: this.pasosMax ? 1 - pasos / this.pasosMax : null };
  };
  TRETA.etapa = function () {
    const p = this.plantas(), pd = panelDice('#ct-embedded-panel');
    if (/se te acabaron los intentos de hoy/i.test(textoMain())) return { fase: 'Sin intentos por hoy', det: p ? `${p[0]} de ${p[1]} plantas subidas` : '', pct: 1 };
    return { fase: pd.ult || (p ? `Subiendo la planta ${Math.min(p[0] + 1, p[1])}` : 'Entrando'), det: p ? `🏠 ${p[0]} de ${p[1]} plantas subidas hoy` : pd.sub, pct: p ? p[0] / p[1] : null };
  };
  TREN.etapa = function () { const q = this.quedan(); return { fase: 'Rebuscando en el vagón de chatarra', det: q != null ? `🚃 quedan ${q} de 3 rebuscas` : '', pct: q != null ? 1 - q / 3 : null }; };
  MANADAS.etapa = function () {
    const g = ssLeer('mh-gratis-fondo') || ssLeer('mh-gratis');
    if (!g) return { fase: 'Abriendo el Canal Manadas…' };
    const n = (g.cola || []).length, h = (g.hechas || []).length, i = Math.min(n, h + (g.fase === 'canal' ? 0 : 1));
    const QUE = { canal: 'en el Canal, eligiendo la siguiente región', buscar: 'buscando su manada por el mapa', macro: 'encuentros gratis con la macro de captura' };
    const macro = texto(document.querySelector('#adx-macro-ui .adx-msg'));
    const ult = sinHora((g.log || []).slice(-1)[0] || '');
    return { fase: `${g.actual ? g.actual + ' · ' : ''}región ${i || 1} de ${n || '?'} · ${QUE[g.fase] || g.fase}`, det: (g.fase === 'macro' && macro) || ult, pct: n ? h / n : null };
  };
  ENTRANAS.etapa = function () {
    const e = ssLeer(SS_EF.estado) || {}, pd = panelDice('#axe-panel'), n = (ssLeer(SS_EF.bajadas) || []).length;
    const pases = e.pases === 'gratis' ? 'la gratis del día' : e.pases != null ? `🎟️ quedan ${e.pases} pase${e.pases === 1 ? '' : 's'}` : '';
    return { fase: `Bajada ${n + 1}${e.piso ? ` · piso ${e.piso}` : ' · en la entrada'}${pases ? ' · ' + pases : ''}`, det: e.msg || pd.ult || pd.sub || '' };
  };
  SUBSUELO.etapa = function () { const s = lsGet('axsub-resumen', null), pd = panelDice('#axsub-panel'); return { fase: pd.ult || 'Picando vetas', det: s && s.total ? `⛏️ ${s.picadas} de ${s.total} vetas picadas` : pd.sub, pct: s && s.total ? s.picadas / s.total : null }; };
  TORRE.etapa = function () { return { det: fondo.detalle('torre') }; };
  let etapaUlt = null;
  function publicarEtapa(r) {
    if (!EN_FONDO || !r || !r.actual) return;
    const a = r.actual, d = a.viaje ? VIAJE : EXTRA[a.href] || RUTAS[a.href];
    const e = { fase: '', det: '', pct: null };
    try { if (d && d.etapa && (a.viaje || d.detecta() || a.otras)) Object.assign(e, d.etapa() || {}); } catch { /* nada */ }
    const pd = panelDice(d && PANEL_DE[d.id]);
    if (!e.fase) e.fase = pd.ult || '';
    if (!e.det && pd.sub && pd.sub !== e.fase) e.det = pd.sub;
    if (!e.det || e.pct == null) { const pg = progresoPagina(); if (!e.det && pg.det) e.det = pg.det; if (e.pct == null && pg.pct != null) e.pct = pg.pct; }
    if (!e.fase) { const u = ssLeer(SS_AHORA); if (u && u.t >= (a.desde || 0)) e.fase = corto(u.texto).replace(/^[^\p{L}\d¿]+/u, ''); }
    if (!e.fase && a.href && ruta() !== a.href) e.fase = `Abriendo ${a.href}…`;
    const clave = JSON.stringify([e.fase, e.det, e.pct == null ? null : Math.round(e.pct * 100)]);
    const ahora = Date.now();
    if (etapaUlt && etapaUlt.clave === clave && ahora - etapaUlt.t < 5000) return;
    const cambio = etapaUlt && etapaUlt.clave === clave ? etapaUlt.cambio : ahora;
    etapaUlt = { clave, t: ahora, cambio };
    ssSet(SS_ETAPA, { t: ahora, cambio, desde: a.desde || ahora, fase: e.fase, det: e.det, pct: e.pct == null ? null : Math.max(0, Math.min(1, e.pct)) });
  }
  const etapaYendo = (fase, det = '') => { if (EN_FONDO) { const t = Date.now(); etapaUlt = null; ssSet(SS_ETAPA, { t, cambio: t, desde: t, fase, det, pct: null }); } };

  let saltoT = 0;
  async function tick() {
    if (EN_FONDO) ssSet(SS_LATIDO, Date.now());
    // en la ventana del robot, cualquier combate (Torre, Tronos, MissingNo…) va directo al resultado
    if (EN_FONDO && Date.now() - saltoT > 1500) {
      const sr = $$('main button, div.fixed button').find(b => !ajeno(b) && !b.disabled && visible(b) && /saltar al resultado/i.test(texto(b)));
      if (sr) { saltoT = Date.now(); sr.click(); }
    }
    if (EN_FONDO) { try { publicarEtapa(ssGet()); } catch { /* nada */ } }
    if (ocupado) return;
    const r = ssGet();
    if (perdida(r)) return;
    if (ruta() === '/menu') { tickMenu(); return; }
    const enRuta = !!(r && r.actual && r.actual.href === ruta());
    if (r && r.actual && r.actual.otras && !enRuta && !r.actual.viaje) {
      const d0 = EXTRA[r.actual.href] || RUTAS[r.actual.href];
      if (d0 && ((d0.listo && d0.listo()) || Date.now() - r.actual.desde > (d0.maxMs || POR_DIARIA_MS)) && !r.actual.volviendo) { r.actual.volviendo = true; ssPut(r); location.assign(r.actual.href); return; }
    }
    const d = DIARIAS.find(x => x.detecta());
    if (!d) {
      // en la ruta, en una diaria que no carga o que no reconozco: se espera un poco y se salta
      if (enRuta) {
        if (!buscando) buscando = Date.now();
        else if (Date.now() - buscando > 20000) {
          buscando = 0;
          if (r.actual.href === '/safari' && r.actual.region) sinReserva(r.actual.region);
          r.log.push(`⚠ ${r.actual.href}${r.actual.region ? ' en ' + r.actual.region : ''}: no reconozco la página, la salto.`); ssPut(r); siguiente(r);
        }
      }
      return;
    }
    buscando = 0;
    const cab = d.detecta();
    if (!EN_FONDO && (!d.sinPanel || enRuta)) montarPanel(cab && (cab.closest('.tarjeta') || cab), d.nombre);
    if (!enRuta && (d.soloRuta || !auto || (!EN_FONDO && fondoActivo()))) return;
    if (enRuta && r.actual.region && d.otraRegion && d.otraRegion(r.actual.region)) { rutaEnDiaria(d, false); return; }
    ocupado = true;
    try {
      const hizo = await d.paso();
      if (hizo) parado = false;
      else if (!parado && !enRuta) { parado = true; log('🏁 Hecho: nada más que hacer aquí por ahora.'); }
      if (enRuta) rutaEnDiaria(d, hizo);
    } catch (e) { if (e !== PARADO) console.warn('[diarias]', e); }
    finally { ocupado = false; }
  }

  // Enlace para arrancar la ruta sola (p. ej. desde un atajo del móvil a una hora): https://auroradex.es/menu?diarias=todas
  // Solo una vez al día, por si el atajo se abre dos veces (&forzar=1 se salta eso: lo usa el bot, que puede tener que
  // volver a lanzarla si se quedó algo a medias)
  function arranqueDesdeEnlace() {
    const q = new URLSearchParams(location.search);
    if (q.get('diarias') !== 'todas') return;
    try { history.replaceState(null, '', location.pathname); } catch { /* nada */ }
    if (ssGet()) return;
    if (!q.has('forzar') && lsGet('axd-enlace', '') === hoy()) { log('ℹ️ Hoy ya se lanzó la ruta desde el enlace.'); return; }
    lsPut('axd-enlace', hoy());
    ssPut({ preparar: true, t: Date.now() });
    if (ruta() !== '/menu') location.assign('/menu');
  }

  /* ══════════ En segundo plano ══════════
   * «Todas las diarias» (el icono de Accesos directos o el botón del Menú) las juega en una ventana oculta dentro de esta
   * misma pestaña: tú sigues jugando a lo tuyo y una tarjeta abajo cuenta por dónde va, con el paso en el que está entre
   * paréntesis (3/14). La ventana oculta es el propio juego con este script dentro (la misma ruta de siempre); se hablan
   * por el sessionStorage de la pestaña, que comparten. Si recargas la página, sigue donde iba. */
  function fondoActivo() { return !!ssLeer(SS_FONDO) || robotOn(); }
  const FONDO_CSS = `
    #axd-fondo-card{--axdf-bg:rgb(var(--lienzo,255 255 255));--axdf-suave:rgb(var(--crema-100,244 239 226));--axdf-borde:rgb(var(--crema-200,232 226 210));--axdf-tx:rgb(var(--tinta-800,33 36 29));--axdf-tx2:rgb(var(--tinta-400,140 143 133));position:fixed;z-index:2147483000;width:min(304px,calc(100vw - 16px));font-family:inherit;color:var(--axdf-tx);touch-action:none;animation:axdf-entra .3s cubic-bezier(.2,1.25,.4,1) both}
    #axd-fondo-card *{box-sizing:border-box}
    #axd-fondo-card p{margin:0}
    #axd-fondo-card .axdf-caja{border-radius:20px;background:var(--axdf-bg);border:2px solid color-mix(in srgb,var(--axdf-c) 55%,var(--axdf-borde));box-shadow:0 4px 0 0 rgba(0,0,0,.08),0 18px 36px -16px rgba(0,0,0,.6);overflow:hidden}
    #axd-fondo-card .axdf-cab{display:flex;align-items:center;gap:8px;padding:8px 8px 8px 9px;cursor:grab;user-select:none}
    #axd-fondo-card.axdf-arrastra .axdf-cab{cursor:grabbing}
    #axd-fondo-card .axdf-ico{position:relative;width:32px;height:32px;flex-shrink:0;border-radius:11px;display:grid;place-items:center;font-size:17px;background:color-mix(in srgb,var(--axdf-c) 18%,var(--axdf-bg))}
    #axd-fondo-card[data-s="on"] .axdf-ico::after{content:"";position:absolute;inset:-3px;border-radius:13px;border:2px solid transparent;border-top-color:var(--axdf-c);animation:axdf-gira 1.1s linear infinite}
    #axd-fondo-card .axdf-tx{flex:1;min-width:0}
    #axd-fondo-card .axdf-tit{font-family:var(--font-display),system-ui,sans-serif;font-size:14px;font-weight:800;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    #axd-fondo-card .axdf-sub{margin-top:1px;font-size:10.5px;font-weight:700;color:var(--axdf-tx2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    #axd-fondo-card .axdf-bts{display:flex;gap:4px;flex-shrink:0}
    #axd-fondo-card .axdf-bt{width:26px;height:26px;border:0;border-radius:999px;display:grid;place-items:center;cursor:pointer;font-size:12px;font-weight:900;background:var(--axdf-suave);color:var(--axdf-tx2)}
    #axd-fondo-card .axdf-bt:hover,#axd-fondo-card .axdf-bt.on{background:color-mix(in srgb,var(--axdf-c) 22%,var(--axdf-suave));color:var(--axdf-tx)}
    #axd-fondo-card .axdf-stop{color:rgb(var(--rojo-600,200 60 50))}
    #axd-fondo-card .axdf-barra{height:4px;background:var(--axdf-borde)}
    #axd-fondo-card .axdf-barra>span{display:block;height:100%;width:0;background:var(--axdf-c);transition:width .6s cubic-bezier(.22,1,.36,1)}
    #axd-fondo-card .axdf-cuerpo{padding:8px;display:flex;flex-direction:column;gap:7px}
    #axd-fondo-card .axdf-ahora{border-radius:14px;padding:8px 10px 9px;background:color-mix(in srgb,var(--axdf-c) 10%,var(--axdf-bg));box-shadow:inset 0 0 0 1.5px color-mix(in srgb,var(--axdf-c) 30%,transparent)}
        #axd-fondo-card .axdf-a1{display:flex;align-items:center;gap:6px;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.05em;color:color-mix(in srgb,var(--axdf-c) 75%,var(--axdf-tx))}
    #axd-fondo-card .axdf-a1 .n{margin-left:auto;font-variant-numeric:tabular-nums;opacity:.8}
    #axd-fondo-card .axdf-act{margin-top:3px;font-family:var(--font-display),system-ui,sans-serif;font-size:15px;font-weight:800;line-height:1.2}
    #axd-fondo-card .axdf-fase{margin-top:3px;font-size:12px;font-weight:800;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    #axd-fondo-card .axdf-det{margin-top:2px;font-size:11px;font-weight:700;line-height:1.3;color:var(--axdf-tx2);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    #axd-fondo-card .axdf-det:empty,#axd-fondo-card .axdf-fase:empty{display:none}
    #axd-fondo-card .axdf-pb{margin-top:6px;height:6px;border-radius:999px;background:color-mix(in srgb,var(--axdf-c) 14%,var(--axdf-borde));overflow:hidden}
    #axd-fondo-card .axdf-pb>span{display:block;height:100%;border-radius:999px;background:var(--axdf-c);transition:width .6s cubic-bezier(.22,1,.36,1)}
    #axd-fondo-card .axdf-pb.ind>span{width:35%!important;animation:axdf-ind 1.4s ease-in-out infinite}
    #axd-fondo-card .axdf-a3{display:flex;gap:8px;margin-top:6px;font-size:10px;font-weight:800;color:var(--axdf-tx2);font-variant-numeric:tabular-nums}
    #axd-fondo-card .axdf-a3 .lu{margin-left:auto;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    #axd-fondo-card .axdf-a3 .quieto{color:#E08A00}
    #axd-fondo-card .axdf-tiles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px}
    #axd-fondo-card .axdf-tile{display:flex;align-items:center;gap:6px;min-width:0;padding:5px 7px;border-radius:11px;background:var(--axdf-suave);font:inherit;color:inherit}
    #axd-fondo-card .axdf-tile .i{font-size:15px;line-height:1;flex-shrink:0}
    #axd-fondo-card .axdf-tile .tx{min-width:0;display:flex;flex-direction:column}
    #axd-fondo-card .axdf-tile .v{font-size:11.5px;font-weight:900;font-variant-numeric:tabular-nums;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    #axd-fondo-card .axdf-tile .l{font-size:9px;font-weight:800;color:var(--axdf-tx2);line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    #axd-fondo-card .axdf-tile.ya{background:color-mix(in srgb,var(--axdf-c) 18%,var(--axdf-bg));box-shadow:inset 0 0 0 1.5px var(--axdf-c)}
    #axd-fondo-card .axdf-tile.ok .v{color:rgb(var(--hoja-700,40 120 60))}
    #axd-fondo-card .axdf-tile.pronto .v{color:#E08A00}
    #axd-fondo-card .axdf-mas:empty{display:none}
    #axd-fondo-card .axdf-chips{display:flex;flex-wrap:wrap;gap:4px;max-height:120px;overflow-y:auto}
    #axd-fondo-card .axdf-chip{display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:999px;font-size:10.5px;font-weight:800;white-space:nowrap;background:var(--axdf-suave);color:var(--axdf-tx)}
    #axd-fondo-card .axdf-c-ok,#axd-fondo-card .axdf-c-ya{background:color-mix(in srgb,#2FA84F 16%,var(--axdf-bg));color:rgb(var(--hoja-700,40 120 60))}
    #axd-fondo-card .axdf-c-ya{opacity:.7}
    #axd-fondo-card .axdf-c-mal,#axd-fondo-card .axdf-c-salto{background:color-mix(in srgb,#E0A000 18%,var(--axdf-bg));color:rgb(var(--ambar-700,160 100 0))}
    #axd-fondo-card .axdf-c-ahora{background:color-mix(in srgb,var(--axdf-c) 20%,var(--axdf-bg));box-shadow:inset 0 0 0 1.5px var(--axdf-c)}
    #axd-fondo-card .axdf-c-luego{opacity:.55}
    #axd-fondo-card .axdf-log{margin:0;padding:0;list-style:none;max-height:130px;overflow-y:auto;font-size:11px;font-weight:700;line-height:1.4;color:var(--axdf-tx2)}
    #axd-fondo-card .axdf-log li{padding:2px 0}
    #axd-fondo-card .axdf-log li+li{border-top:1px dashed var(--axdf-borde)}
    #axd-fondo-card .axdf-movil{display:flex;gap:5px}
    #axd-fondo-card .axdf-movil button{flex:1;border:0;border-radius:999px;padding:5px 8px;font-size:10.5px;font-weight:800;cursor:pointer;background:var(--axdf-suave);color:var(--axdf-tx2)}
    #axd-fondo-card .axdf-movil button.on{background:color-mix(in srgb,var(--axdf-c) 20%,var(--axdf-suave));color:var(--axdf-tx)}
    #axd-fondo-card .axdf-pie{display:flex;gap:6px}
    #axd-fondo-card .axdf-pie:empty{display:none}
    #axd-fondo-card .axdf-pie button{flex:1;border:0;border-radius:999px;padding:7px 8px;font-size:12px;font-weight:900;cursor:pointer;background:var(--axdf-suave);color:var(--axdf-tx)}
    #axd-fondo-card .axdf-pie button.axdf-prim{background:var(--axdf-c);color:#fff}
    #axd-fondo-card.axdf-mini{width:auto;max-width:calc(100vw - 16px)}
    #axd-fondo-card.axdf-mini .axdf-caja{border-radius:999px}
    #axd-fondo-card.axdf-mini .axdf-cab{padding:4px 6px 4px 4px;gap:7px}
    #axd-fondo-card.axdf-mini .axdf-ico{width:28px;height:28px;border-radius:999px;font-size:15px}
    #axd-fondo-card.axdf-mini[data-s="on"] .axdf-ico::after{border-radius:999px}
    #axd-fondo-card.axdf-mini .axdf-tit{font-size:12px}
    #axd-fondo-card.axdf-mini .axdf-sub{font-size:10px;max-width:180px}
    #axd-fondo-card.axdf-mini .axdf-barra,#axd-fondo-card.axdf-mini .axdf-cuerpo,#axd-fondo-card.axdf-mini .axdf-stop,#axd-fondo-card.axdf-mini .axdf-log-bt,#axd-fondo-card.axdf-mini .axdf-lista-bt{display:none}
    #axd-fondo-card .axdf-rueda{width:10px;height:10px;flex-shrink:0;border-radius:999px;border:2px solid color-mix(in srgb,var(--axdf-c) 30%,transparent);border-top-color:var(--axdf-c);display:inline-block;animation:axdf-gira .8s linear infinite}
    @keyframes axdf-entra{from{opacity:0;transform:translateY(10px) scale(.96)}to{opacity:1;transform:none}}
    @keyframes axdf-gira{to{transform:rotate(360deg)}}
    @keyframes axdf-ind{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}
    @media (prefers-reduced-motion:reduce){#axd-fondo-card,#axd-fondo-card *{animation:none!important}}`;
  const LS_MINI = 'axd-fondo-mini';
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const duracion = ms => { const m = Math.max(0, Math.round(ms / 60000)); return m < 1 ? 'menos de 1 min' : m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`; };
  const seg = n => n == null ? '' : n < 60 ? `${n} s` : `${Math.round(n / 60)} min`;
  // mensajes de la ruta, en corto para la tarjeta
  const corto = t => String(t || '').replace(/^\d\d:\d\d\s+/, '').replace(/\s*\(si no está hecha, pásame su HTML\)/, '').replace(/\s+/g, ' ').trim();
  function sonidoFin() {
    try {
      if (localStorage.getItem('aurora-kit-silencio') === '1') return;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const t0 = ctx.currentTime + 0.02, vol = ctx.createGain(); vol.gain.value = 0.06; vol.connect(ctx.destination);
      [[523, 0, .12], [659, .12, .12], [784, .24, .12], [1047, .36, .3]].forEach(([f, i, d]) => {
        const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'square'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0 + i); g.gain.exponentialRampToValueAtTime(0.5, t0 + i + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + i + d);
        o.connect(g); g.connect(vol); o.start(t0 + i); o.stop(t0 + i + d + 0.02);
      });
    } catch { /* sin audio */ }
  }
  // La pestaña manda: el robot (qué toca y cuándo), la ventana oculta mientras hay algo que hacer y la tarjeta
  const mmss = ms => { const t = Math.max(0, Math.round(ms / 1000)), h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60); return h ? `${h}:${String(m).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}` : `${m}:${String(t % 60).padStart(2, '0')}`; };
  // En el móvil, con la pantalla apagada el navegador congela la pestaña (y el robot con ella). Lo que sí se puede:
  // que no se apague sola mientras el robot trabaja (Wake Lock) y un «modo noche» en negro (en OLED casi no gasta)
  const LS_DESPIERTO = 'axd-despierto';
  const despiertoOn = () => lsGet(LS_DESPIERTO, true) !== false;
  let wakeLock = null, wakePidiendo = false;
  async function mantenerDespierto(si) {
    if (!('wakeLock' in navigator)) return;
    try {
      if (si && !wakeLock && !wakePidiendo && document.visibilityState === 'visible') {
        wakePidiendo = true;
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => { wakeLock = null; });
      } else if (!si && wakeLock) { const w = wakeLock; wakeLock = null; await w.release(); }
    } catch { wakeLock = null; } finally { wakePidiendo = false; }
  }
  // Las barras del móvil: la de arriba toma el color que pide la web («theme-color») y la de abajo, el fondo de la
  // página; en modo noche las dos a negro, y al salir se deja todo como estaba
  let nocheAntes = null;
  function barrasNegras(si) {
    const html = document.documentElement;
    if (si && !nocheAntes) {
      const metas = [...document.querySelectorAll('meta[name="theme-color"]')];
      nocheAntes = { metas: metas.map(m => [m, m.getAttribute('content')]), html: html.style.background, body: document.body.style.background };
      if (!metas.length) { const m = document.createElement('meta'); m.name = 'theme-color'; m.dataset.axdNoche = '1'; document.head.appendChild(m); metas.push(m); }
      metas.forEach(m => m.setAttribute('content', '#000000'));
      // (sin «color-scheme: dark»: con él, Chrome en Android pone sus barras grises por defecto en vez del negro)
      html.style.background = '#000'; document.body.style.background = '#000';
    } else if (!si && nocheAntes) {
      nocheAntes.metas.forEach(([m, c]) => { if (c == null) m.removeAttribute('content'); else m.setAttribute('content', c); });
      document.querySelectorAll('meta[data-axd-noche]').forEach(m => m.remove());
      html.style.background = nocheAntes.html; document.body.style.background = nocheAntes.body;
      nocheAntes = null;
    }
  }
  function modoNoche(si) {
    let o = document.getElementById('axd-noche');
    barrasNegras(si);
    if (!si) { if (o) o.remove(); return; }
    if (o) return;
    o = document.createElement('div');
    o.id = 'axd-noche'; o.setAttribute('data-ax-ignore', '');
    o.style.cssText = 'position:fixed;inset:0;z-index:2147483646;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;font:700 12px system-ui,sans-serif;color:#3a3a3a;text-align:center;padding:24px;cursor:pointer;touch-action:manipulation';
    o.innerHTML = '<p class="t" style="margin:0"></p><p class="f" style="margin:0;font-weight:600"></p><p style="margin:14px 0 0;font-size:10px;color:#262626">Toca para volver · no bloquees el móvil: la pantalla tiene que seguir encendida</p>';
    o.addEventListener('click', () => modoNoche(false));
    document.body.appendChild(o);
  }
  const fondo = {
    reinicios: 0, vistaDesde: Date.now(), chequeando: false,
    iframe() { if (this._f && this._f.isConnected) return this._f; this._f = document.querySelector(`iframe[name="${FONDO_NOMBRE}"]`); return this._f; },   // (guardado: se pide cada segundo y en páginas grandes la búsqueda cuesta)
    crearIframe(ruta0 = '/menu') {
      let f = this.iframe();
      if (f) return f;
      f = document.createElement('iframe');
      f.name = FONDO_NOMBRE;
      f.title = 'Robot de diarias';
      f.setAttribute('aria-hidden', 'true'); f.tabIndex = -1;
      // fuera de la vista pero «visible» para la página (con display:none los botones no tienen tamaño y no se pulsan)
      f.style.cssText = 'position:fixed;left:-12000px;top:0;width:430px;height:932px;border:0;opacity:0;pointer-events:none;z-index:-1';
      f.src = ruta0;
      document.body.appendChild(f);
      return f;
    },
    // Encender el robot: todo toca ya (las diarias primero); luego cada cosa cuando se acaba su espera
    iniciar() {
      if (EN_FONDO) return;
      if (robotOn()) { this.ver(); return; }
      if (ssGet()) { alert('Ya hay una ruta de diarias en marcha en esta pestaña.'); return; }
      const ahora = Date.now();
      ssSet(SS_ROBOT, { on: true, dia: hoy(), t0: ahora, log: [] });
      Object.keys(ROBOT).forEach((id, i) => rtSet(id, { prox: ahora + i, listo: false }));
      ssSet(SS_FIN, null); ssSet(SS_FONDO, null);
      try { localStorage.setItem(LS_MINI, '0'); } catch { /* nada */ }
      try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); } catch { /* nada */ }
      this.reinicios = 0;
      this.vigilar();
    },
    seguir() { const R = ssLeer(SS_ROBOT) || { dia: hoy(), log: [] }; ssSet(SS_ROBOT, { ...R, on: true, t0: R.t0 || Date.now() }); ssSet(SS_FIN, null); this.vigilar(); },
    parar() {
      const r = ssLeer(SS_FONDO);
      const f = this.iframe(); if (f) f.remove();
      if (r && r.actual && !r.actual.viaje) { const id = r.actual.robot || ROBOT_DE[r.actual.href]; if (id) rtSet(id, { prox: Date.now(), listo: false }); }
      ssSet(SS_FONDO, null); ssSet(SS_LATIDO, null); ssSet(SS_EF.on, null);
      const R = ssLeer(SS_ROBOT) || {};
      ssSet(SS_ROBOT, { ...R, on: false, parado: Date.now(), fuera: r && r.fuera ? r.casa : null });
      this.pintar();
    },
    ver() { try { localStorage.setItem(LS_MINI, '0'); } catch { /* nada */ } this.pintar(); },
    cerrar() { ssSet(SS_ROBOT, null); ssSet(SS_FIN, null); const c = document.getElementById('axd-fondo-card'); if (c) c.remove(); },
    apuntar(t) { const R = ssLeer(SS_ROBOT); if (!R) return; R.log = [...(R.log || []), `${hhmm(Date.now())}  ${t}`].slice(-40); ssSet(SS_ROBOT, R); },
    // qué toca ya (por orden: lo que antes tocaba); los Tronos solo si no tienes ninguno (se mira por detrás)
    pendientes() {
      const ahora = Date.now();
      return Object.keys(ROBOT).filter(id => {
        const t = rtGet(id);
        if ((t.prox || 0) > ahora) return false;
        if (ROBOT[id].chequeo && !t.listo) return false;
        if (id === 'entranas' && ssLeer('axe-fondo-on')) return false;        // ya las estás jugando en segundo plano
        return true;
      }).sort((a, b) => (a === 'diarias' ? -1 : b === 'diarias' ? 1 : a === 'entranas' ? 1 : b === 'entranas' ? -1 : (rtGet(a).prox || 0) - (rtGet(b).prox || 0)));
    },
    // lo que se mira por detrás antes de abrir la ventana (los Tronos: si sigues teniendo uno; MissingNo.: si está)
    async chequeos() {
      if (this.chequeando) return;
      const id = Object.keys(ROBOT).find(k => ROBOT[k].chequeo && (rtGet(k).prox || 0) <= Date.now() && !rtGet(k).listo);
      if (!id) return;
      this.chequeando = true;
      try { const r = await ROBOT[id].chequeo(); rtSet(id, r.listo ? { listo: true, info: r.info || rtGet(id).info } : { prox: r.prox || Date.now() + 20 * 60000, info: r.info, listo: false }); }
      catch { rtSet(id, { prox: Date.now() + 10 * 60000 }); }
      finally { this.chequeando = false; }
    },
    lanzar(ids) {
      const R = ssLeer(SS_ROBOT) || {};
      if (ids.includes('diarias')) {
        rtSet('diarias', { prox: Date.now() + 30 * 60000 });                   // (si se cuelga, se reintenta en media hora)
        ssSet(SS_FONDO, { preparar: true, t: Date.now(), robot: 'diarias' });
        this.apuntar('🗓️ Empiezo las diarias de hoy.');
      } else {
        const casa = rtGet('diarias').casa || '';
        const cola = ids.map(id => ({ href: ROBOT[id].href, robot: id, otras: ROBOT[id].otras }));
        ids.forEach(id => rtSet(id, { prox: Date.now() + (id === 'entranas' ? 8 * 60 : 30) * 60000, listo: false }));
        ssSet(SS_FONDO, { cola, hechas: [], log: [], actual: null, casa, pasos: [], yaHechas: [], avisos: [], t0: Date.now(), robot: 'agenda' });
        this.apuntar(`▶ ${ids.map(id => ROBOT[id].nombre).join(', ')}.`);
      }
      ssSet(SS_FIN, null); ssSet(SS_LATIDO, Date.now());
      this.reinicios = 0;
      const f = this.iframe(); if (f) f.src = '/menu'; else this.crearIframe('/menu');
      ssSet(SS_ROBOT, { ...(ssLeer(SS_ROBOT) || R) });
    },
    // cada segundo: el día nuevo, la ventana oculta, lo que toca y la tarjeta
    vigilar() {
      if (EN_FONDO) return;
      const R = ssLeer(SS_ROBOT);
      const r = ssLeer(SS_FONDO);
      if (R && R.on) {
        // día nuevo: se empieza de cero (las diarias, la Torre, los Tronos y las Entrañas se reinician a medianoche)
        if (R.dia !== hoy() && !r) {
          ssSet(SS_ROBOT, { ...R, dia: hoy(), log: [] });
          for (const id of ['diarias', 'torre', 'tronos', 'entranas', 'valle']) rtSet(id, { prox: Date.now(), listo: false, info: '' });
          this.apuntar('🌅 Día nuevo: empiezo de cero.');
        }
      }
      if (r) {
        const f = this.iframe();
        const latido = +ssLeer(SS_LATIDO) || 0;
        if (!f) { this.crearIframe('/menu'); ssSet(SS_LATIDO, Date.now()); }          // tras recargar la pestaña: sigue
        // (con la pestaña escondida el navegador frena los relojes: solo cuenta si lleva un rato a la vista)
        else if (document.visibilityState === 'visible' && Date.now() - this.vistaDesde > 75000 && Date.now() - latido > 75000) {
          this.reinicios++;
          if (this.reinicios > 3) { this.apuntar('⚠ La ventana del robot no responde: la reinicio.'); f.remove(); ssSet(SS_FONDO, null); this.reinicios = 0; }
          else { f.src = '/menu'; ssSet(SS_LATIDO, Date.now()); }
        }
      } else {
        const fin = ssLeer(SS_FIN);
        if (fin && !fin.visto) {
          fin.visto = true; ssSet(SS_FIN, fin);
          const ok = (fin.pasos || []).filter(p => p.ok).length, mal = (fin.pasos || []).length - ok;
          if (fin.robot === 'diarias') {
            this.apuntar(`🏁 Diarias: ${ok} hecha${ok === 1 ? '' : 's'}${mal ? `, ${mal} con aviso` : ''}.`);
            sonidoFin();
            try { if (document.hidden && 'Notification' in window && Notification.permission === 'granted') new Notification('🗓️ Diarias hechas', { body: `${ok} hechas. El robot sigue con lo que va por horas.`, icon: new URL('/icono-app.svg', location.origin).href }); } catch { /* nada */ }
          } else for (const p of fin.pasos || []) this.apuntar(`${p.ok ? '✅' : '⚠'} ${p.nombre}${p.motivo ? ': ' + p.motivo : ''}`);
          if (fin.fuera) this.apuntar(`🧭 Te he dejado fuera de ${fin.casa || 'tu región'}.`);
        }
        const f = this.iframe(); if (f) f.remove();
        if (R && R.on) {
          this.chequeos();
          const ids = this.pendientes();
          // de una en una, la que antes tocaba: así lo que tiene hora (la Torre, el Huerto) no espera a lo largo (una bajada)
          if (ids.length) this.lanzar([ids[0]]);
        }
      }
      mantenerDespierto(!!(R && R.on) && despiertoOn());
      if (!(R && R.on)) modoNoche(false);
      this.pintar();
    },
    // la línea de «ahora» de cada tarea mientras se hace
    detalle(id) {
      if (id === 'torre') {
        const L = ligasTorre();
        return Object.entries(LIGAS_TORRE).map(([l, nom]) => { const x = L[l] || {}; return x.fin ? `${nom} ✅` : x.listaEn > Date.now() ? `${nom} ⏳ ${mmss(x.listaEn - Date.now())}${x.quedan != null ? ` (quedan ${x.quedan})` : ''}` : `${nom} ⚔️${x.quedan != null ? ` quedan ${x.quedan}` : ''}`; }).join(' · ');
      }
      if (id === 'entranas') {
        const e = ssLeer(SS_EF.estado) || {};
        const pases = e.pases === 'gratis' ? 'la gratis del día' : e.pases != null ? `🎟️ quedan ${e.pases} pase${e.pases === 1 ? '' : 's'}` : '';
        return [e.piso ? `piso ${e.piso}` : 'en la entrada', pases, e.msg || ''].filter(Boolean).join(' · ');
      }
      if (id === 'subsuelo') { const s = lsGet('axsub-resumen', null); return s && s.total ? `⛏️ ${s.picadas}/${s.total} vetas picadas` : ''; }
      return '';
    },
    // dónde está la tarjeta (se arrastra por la cabecera y se recuerda)
    colocar(c) {
      const pos = lsGet('axd-robot-pos', null), w = c.offsetWidth || 292, h = c.offsetHeight || 60;
      const vw = window.innerWidth, vh = window.innerHeight;
      if (pos && Number.isFinite(pos.x) && Number.isFinite(pos.y)) {
        c.style.left = Math.max(4, Math.min(vw - w - 4, pos.x)) + 'px'; c.style.top = Math.max(4, Math.min(vh - h - 4, pos.y)) + 'px';
        c.style.right = 'auto'; c.style.bottom = 'auto';
      } else { c.style.left = 'auto'; c.style.top = 'auto'; c.style.right = '8px'; c.style.bottom = 'calc(env(safe-area-inset-bottom,0px) + 84px)'; }
    },
    arrastre(c) {
      const cab = c.querySelector('.axdf-cab');
      let ini = null;
      cab.addEventListener('pointerdown', e => {
        if (e.button !== 0 || e.target.closest('button')) return;
        const r = c.getBoundingClientRect();
        ini = { x: e.clientX, y: e.clientY, l: r.left, t: r.top, movido: false, id: e.pointerId };
        try { cab.setPointerCapture(e.pointerId); } catch { /* nada */ }
      });
      cab.addEventListener('pointermove', e => {
        if (!ini) return;
        const dx = e.clientX - ini.x, dy = e.clientY - ini.y;
        if (!ini.movido && Math.hypot(dx, dy) < 5) return;
        ini.movido = true; c.classList.add('axdf-arrastra');
        const w = c.offsetWidth, h = c.offsetHeight;
        c.style.right = 'auto'; c.style.bottom = 'auto';
        c.style.left = Math.max(4, Math.min(window.innerWidth - w - 4, ini.l + dx)) + 'px';
        c.style.top = Math.max(4, Math.min(window.innerHeight - h - 4, ini.t + dy)) + 'px';
      });
      const soltar = () => {
        if (!ini) return;
        if (ini.movido) { const r = c.getBoundingClientRect(); lsPut('axd-robot-pos', { x: Math.round(r.left), y: Math.round(r.top) }); c.dataset.recienMovido = String(Date.now()); }
        ini = null; c.classList.remove('axdf-arrastra');
      };
      cab.addEventListener('pointerup', soltar); cab.addEventListener('pointercancel', soltar);
      // doble toque en la cabecera: vuelve a su sitio de siempre
      cab.addEventListener('dblclick', e => { if (e.target.closest('button')) return; lsPut('axd-robot-pos', null); this.colocar(c); });
      addEventListener('resize', () => this.colocar(c));
    },
    pintar() {
      if (EN_FONDO || !document.body) return;
      const R = ssLeer(SS_ROBOT), r = ssLeer(SS_FONDO);
      let c = document.getElementById('axd-fondo-card');
      if (!R) { if (c) c.remove(); return; }
      if (!document.getElementById('axd-fondo-css')) { const st = document.createElement('style'); st.id = 'axd-fondo-css'; st.textContent = FONDO_CSS; (document.head || document.documentElement).appendChild(st); }
      if (!c) {
        c = document.createElement('div');
        c.id = 'axd-fondo-card'; c.setAttribute('data-ax-ignore', ''); c.setAttribute('role', 'status'); c.setAttribute('aria-live', 'polite');
        c.innerHTML = `<div class="axdf-caja">
            <div class="axdf-cab" title="Arrastra para moverlo · doble toque: a su sitio"><div class="axdf-ico"><span>🤖</span></div>
              <div class="axdf-tx"><p class="axdf-tit"></p><p class="axdf-sub"></p></div>
              <div class="axdf-bts"><button type="button" class="axdf-bt axdf-lista-bt" title="Las diarias de hoy, una a una">📋</button>
              <button type="button" class="axdf-bt axdf-log-bt" title="Lo que ha hecho">📜</button>
              <button type="button" class="axdf-bt axdf-min" title="Minimizar">–</button>
              <button type="button" class="axdf-bt axdf-stop" title="Parar">■</button></div></div>
            <div class="axdf-barra"><span></span></div>
            <div class="axdf-cuerpo"><div class="axdf-ahora"><div class="axdf-a1"><span class="axdf-rueda"></span><span class="k"></span><span class="n"></span></div><p class="axdf-act"></p><p class="axdf-fase"></p><p class="axdf-det"></p><div class="axdf-pb"><span></span></div><div class="axdf-a3"><span class="t"></span><span class="q"></span><span class="lu"></span></div></div><div class="axdf-tiles"></div><div class="axdf-mas"></div><div class="axdf-movil"><button type="button" data-m="despierto"></button><button type="button" data-m="noche">🌙 Modo noche</button></div><div class="axdf-pie"></div></div></div>`;
        const abrir = que => { const a = lsGet('axd-fondo-abierto', ''); lsPut('axd-fondo-abierto', a === que ? '' : que); this.pintar(); };
        c.querySelector('.axdf-min').addEventListener('click', e => { e.stopPropagation(); const m = !c.classList.contains('axdf-mini'); try { localStorage.setItem(LS_MINI, m ? '1' : '0'); } catch { /* nada */ } this.pintar(); setTimeout(() => this.colocar(c), 0); });
        c.querySelector('.axdf-log-bt').addEventListener('click', e => { e.stopPropagation(); abrir('log'); });
        c.querySelector('.axdf-lista-bt').addEventListener('click', e => { e.stopPropagation(); abrir('diarias'); });
        c.querySelector('.axdf-stop').addEventListener('click', e => {
          e.stopPropagation();
          if (robotOn()) { if (confirm('¿Parar el robot de diarias?\n\nLo que ya está hecho, hecho queda. Puedes seguir luego donde lo dejó.')) this.parar(); }
          else this.cerrar();
        });
        c.querySelector('.axdf-cab').addEventListener('click', e => {
          if (e.target.closest('button') || Date.now() - (+c.dataset.recienMovido || 0) < 400) return;
          if (c.classList.contains('axdf-mini')) { this.ver(); setTimeout(() => this.colocar(c), 0); }
        });
        c.querySelector('.axdf-movil').addEventListener('click', e => {
          const b = e.target.closest('button'); if (!b) return;
          if (b.dataset.m === 'despierto') { lsPut(LS_DESPIERTO, !despiertoOn()); mantenerDespierto(robotOn() && despiertoOn()); this.pintar(); }
          else if (b.dataset.m === 'noche') modoNoche(true);
        });
        c.querySelector('.axdf-pie').addEventListener('click', e => {
          const b = e.target.closest('button'); if (!b) return;
          if (b.dataset.a === 'cerrar') this.cerrar();
          else if (b.dataset.a === 'seguir') this.seguir();
        });
        document.body.appendChild(c);
        this.arrastre(c);
        this.colocar(c);
      }
      const on = !!R.on;
      let mini = false; try { mini = localStorage.getItem(LS_MINI) === '1'; } catch { /* nada */ }
      c.classList.toggle('axdf-mini', mini && on);
      const set = (sel, v, html) => { const el = c.querySelector(sel); if (!el) return; if (html) { if (el.dataset.h !== v) { el.dataset.h = v; el.innerHTML = v; } } else if (el.textContent !== v) el.textContent = v; };
      const ahora = Date.now();
      const actual = r && r.actual ? nombrePaso(r.actual, r.casa) : null;
      const idAhora = r && r.actual && !r.actual.viaje ? r.actual.robot || ROBOT_DE[r.actual.href] : null;
      const enDiarias = !!(r && (r.robot === 'diarias' || r.preparar || r.preparando));
      // las diarias de hoy (en directo mientras se juegan; si no, las de la última vuelta de hoy)
      const td = rtGet('diarias');
      const ld = enDiarias ? listaDiarias(r) : td.dia === hoy() ? td.lista || [] : [];
      const hechasN = ld.filter(x => ['ya', 'ok'].includes(x.e)).length;
      // lo próximo que toca
      const sig = Object.keys(ROBOT).map(id => ({ id, t: rtGet(id) })).filter(x => x.t.prox > ahora && !(r && (enDiarias ? x.id === 'diarias' : idAhora === x.id))).sort((a, b) => a.t.prox - b.t.prox)[0];
      const cuenta = t => t - ahora > 6 * 3600000 ? hhmm(t) : mmss(t - ahora);
      let color = '#7C5CFF', estado = 'on', titulo, sub;
      const et = r ? ssLeer(SS_ETAPA) : null;
      const quedanN = enDiarias ? ld.filter(x => x.e === 'luego').length : 0;
      if (!on) { color = '#8C8F85'; estado = 'off'; titulo = 'Robot parado'; sub = R.parado ? `desde las ${hhmm(R.parado)} · lo hecho, hecho queda` : ''; }
      else if (r) {
        titulo = enDiarias ? `Diarias · ${hechasN} de ${ld.length || '…'}` : (actual || 'Terminando…').replace(/^[^\p{L}¿]+/u, '');
        sub = enDiarias ? (ld.length ? `${quedanN ? `quedan ${quedanN}` : 'la última'}${r.t0 ? ` · desde ${hhmm(r.t0)}` : ''}` : 'Mirando qué queda…') : 'Tarea con hora del robot';
      } else {
        estado = 'espera'; color = '#5B8DEF';
        titulo = 'En espera';
        sub = sig ? `${ROBOT[sig.id].nombre.replace(/^[^\p{L}¿]+/u, '')} en ${cuenta(sig.t.prox)}` : 'nada pendiente hoy';
      }
      if (mini && on) {
        titulo = r ? (enDiarias ? `Diarias ${hechasN}/${ld.length || '…'}` : (actual || '▶').replace(/^[^\p{L}¿]+/u, '')) : sig ? `${ROBOT[sig.id].nombre.split(' ')[0]} ${cuenta(sig.t.prox)}` : '💤';
        sub = r ? (et && et.fase) || (actual || '') : '';
      }
      c.style.setProperty('--axdf-c', color); c.dataset.s = estado;
      set('.axdf-tit', titulo); set('.axdf-sub', sub || '');
      set('.axdf-ico span', !on ? '⏹' : r ? '🤖' : '💤');
      const barra = c.querySelector('.axdf-barra');
      barra.style.display = enDiarias && ld.length ? '' : 'none';
      barra.firstElementChild.style.width = (ld.length ? Math.round(100 * hechasN / ld.length) : 0) + '%';
      c.querySelector('.axdf-stop').title = on ? 'Parar el robot' : 'Cerrar';
      c.querySelector('.axdf-min').style.display = on ? '' : 'none';
      set('.axdf-stop', on ? '■' : '✕');
      const abierto = lsGet('axd-fondo-abierto', '');
      c.querySelector('.axdf-lista-bt').style.display = ld.length ? '' : 'none';
      c.querySelector('.axdf-lista-bt').classList.toggle('on', abierto === 'diarias');
      c.querySelector('.axdf-log-bt').classList.toggle('on', abierto === 'log');
      // «Ahora»: qué actividad, en qué etapa está dentro de ella, el detalle y cuánto le queda (cada línea por su lado:
      // así el reloj no reinicia las animaciones)
      const A = { k: '', n: '', act: '', fase: '', det: '', pct: null, ind: false, t: '', q: '', qCls: '', lu: '', rueda: false, ver: false };
      if (on && r) {
        const nAhora = enDiarias && r.actual && !r.actual.viaje ? ld.findIndex(x => x.e === 'ahora') + 1 : 0;
        const e = et && (!r.actual || !r.actual.desde || (et.desde || 0) >= r.actual.desde - 3000) ? et : null;
        const pct = e && e.pct != null ? Math.round(e.pct * 100) : null;
        const quieto = e && e.cambio ? Math.round((ahora - e.cambio) / 1000) : 0;
        const sigP = (r.cola || []).find(x => !x.viaje) || (r.cola || [])[0];
        Object.assign(A, {
          ver: true, rueda: true, k: 'Ahora', n: nAhora ? `${nAhora} de ${ld.length}` : '',
          act: r.actual ? nombrePaso(r.actual, r.casa) : r.preparar || r.preparando ? '🗓️ Preparando la ruta' : '🏁 Terminando',
          fase: e ? e.fase : r.actual ? 'Entrando…' : 'Mirando qué queda…', det: e ? e.det || '' : '',
          pct, ind: pct == null, t: r.actual && r.actual.desde ? `⏱ ${mmss(ahora - r.actual.desde)}` : '',
          q: quieto >= 45 ? `sin cambios ${mmss(quieto * 1000)}` : pct != null ? `${pct}%` : '', qCls: quieto >= 45 ? 'quieto' : '',
          lu: sigP ? `luego: ${nombrePaso(sigP, r.casa).replace(/^[^\p{L}¿]+/u, '')}` : '',
        });
      } else if (on && sig) {
        Object.assign(A, { ver: true, k: '💤 En espera', act: ROBOT[sig.id].nombre, fase: `Le toca a las ${hhmm(sig.t.prox)} (en ${cuenta(sig.t.prox)})`, det: sig.t.info || '', pct: null, ind: false });
      }
      const caja = c.querySelector('.axdf-ahora');
      caja.style.display = A.ver ? '' : 'none';
      caja.querySelector('.axdf-a1 .axdf-rueda').style.display = A.rueda ? '' : 'none';
      set('.axdf-a1 .k', A.k); set('.axdf-a1 .n', A.n); set('.axdf-act', A.act); set('.axdf-fase', A.fase); set('.axdf-det', A.det);
      const pb = caja.querySelector('.axdf-pb');
      pb.style.display = A.rueda ? '' : 'none'; pb.classList.toggle('ind', A.ind);
      pb.firstElementChild.style.width = (A.pct == null ? 0 : A.pct) + '%';
      set('.axdf-a3 .t', A.t); set('.axdf-a3 .q', A.q); set('.axdf-a3 .lu', A.lu);
      caja.querySelector('.axdf-a3 .q').className = 'q ' + A.qCls;
      caja.querySelector('.axdf-a3').style.display = A.t || A.q || A.lu ? '' : 'none';
      // lo que va por horas, en casillas: cada cosa con su cuenta atrás (o ✅ si ya está hasta mañana)
      const CORTO = { huerto: 'Huerto', torre: 'Torre', tronos: 'Tronos', entranas: 'Entrañas', subsuelo: 'Subsuelo', valle: 'Valle', isla: 'Isla', missingno: 'MissingNo' };
      const manana0 = (() => { const d = new Date(); d.setHours(24, 0, 0, 0); return d.getTime(); })();
      const tiles = Object.keys(ROBOT).filter(id => id !== 'diarias').map(id => {
        const t = rtGet(id), ya = on && r && !enDiarias && idAhora === id;
        let v = '—', cls = '', l = CORTO[id] || id;
        if (ya) { v = id === 'entranas' ? `piso ${(ssLeer(SS_EF.estado) || {}).piso || 1}` : 'ahora'; cls = 'ya'; }
        else if (on && t.prox) {
          if (t.prox >= manana0) { v = '✅ hoy'; cls = 'ok'; }
          else if (t.prox <= ahora) v = ROBOT[id].chequeo && !t.listo ? 'mirando' : r ? 'en cola' : 'toca ya';
          else { v = cuenta(t.prox); if (t.prox - ahora < 5 * 60000) cls = 'pronto'; }
        }
        if (id === 'subsuelo') { const s = lsGet('axsub-resumen', null); if (s && s.total) l = `${s.picadas}/${s.total} vetas`; }
        if (id === 'tronos') { const tipo = (String(t.info || '').match(/tienes el de (\S+)/) || [])[1]; if (tipo) l = `Trono ${tipo}`; }
        const tt = `${ROBOT[id].nombre}${t.info ? ' · ' + t.info : ''}${t.prox && !ya ? ` · ${t.prox <= ahora ? 'toca ya' : 'a las ' + hhmm(t.prox)}` : ''}`;
        return `<div class="axdf-tile ${cls}" title="${esc(tt)}"><span class="i">${ya ? '<span class="axdf-rueda"></span>' : ROBOT[id].nombre.split(' ')[0]}</span><span class="tx"><span class="v">${esc(v)}</span><span class="l">${esc(l)}</span></span></div>`;
      }).join('');
      set('.axdf-tiles', tiles, true);
      // desplegable: las diarias una a una, o lo que ha hecho
      let mas = '';
      if (abierto === 'diarias' && ld.length) {
        const ICO = { ya: '✔', ok: '✅', mal: '⚠️', salto: '⏭', ahora: '<span class="axdf-rueda"></span>', luego: '○' };
        mas = `<div class="axdf-chips">${ld.map(x => `<span class="axdf-chip axdf-c-${x.e}"${x.m ? ` title="${esc(x.m)}"` : ''}>${ICO[x.e] || ''} ${esc(String(x.n).replace(/^[^\p{L}¿]+/u, ''))}</span>`).join('')}</div>`;
      } else if (abierto === 'log') {
        const l = [...(R.log || [])].slice(-15).reverse();
        mas = `<ul class="axdf-log">${R.fuera ? `<li>🧭 Te he dejado fuera de ${esc(R.fuera)}.</li>` : ''}${l.map(x => `<li>${esc(x)}</li>`).join('') || '<li>Aún nada.</li>'}</ul>`;
      }
      set('.axdf-mas', mas, true);
      c.querySelector('.axdf-movil').style.display = on ? '' : 'none';
      set('.axdf-movil [data-m="despierto"]', 'wakeLock' in navigator ? `🔆 Pantalla encendida: ${despiertoOn() ? 'sí' : 'no'}` : '🔆 Este navegador no deja');
      c.querySelector('.axdf-movil [data-m="despierto"]').classList.toggle('on', despiertoOn() && 'wakeLock' in navigator);
      const noche = document.getElementById('axd-noche');
      if (noche) document.querySelectorAll('meta[name="theme-color"]').forEach(m => { if (m.getAttribute('content') !== '#000000') m.setAttribute('content', '#000000'); });
      if (noche) { const tn = noche.querySelector('.t'), fn = noche.querySelector('.f'), a = c.querySelector('.axdf-act'), fz = c.querySelector('.axdf-fase'); const v1 = `🤖 ${titulo}`, v2 = `${a && a.textContent ? a.textContent + ' · ' : ''}${(fz && fz.textContent) || sub || ''}`; if (tn.textContent !== v1) tn.textContent = v1; if (fn.textContent !== v2) fn.textContent = v2; }
      set('.axdf-pie', on ? '' : `<button type="button" data-a="cerrar">Cerrar</button><button type="button" data-a="seguir" class="axdf-prim">▶ Seguir</button>`, true);
    },
  };
  if (!EN_FONDO) {
    // el icono «Todas las diarias» de Accesos directos (script Interfaz) avisa con un evento
    document.addEventListener('axd-fondo', e => { const a = e && e.detail; if (a === 'iniciar') fondo.iniciar(); else if (a === 'parar') fondo.parar(); else if (a === 'ver') fondo.ver(); });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { fondo.vistaDesde = Date.now(); fondo.vigilar(); } });
    const arrancarVigia = () => { fondo.vigilar(); setInterval(() => fondo.vigilar(), 1000); };
    if (document.body) arrancarVigia(); else addEventListener('DOMContentLoaded', arrancarVigia);
  }

  esperarHidratacion().then(() => {
    arranqueDesdeEnlace();
    setInterval(tick, EN_FONDO ? 350 : 800);
    // (los cambios de la página se agrupan: antes cada uno lanzaba un tick completo, y al cargar una página grande son cientos)
    let tMo = 0;
    try { new MutationObserver(() => { if (!tMo) tMo = setTimeout(() => { tMo = 0; tick(); }, EN_FONDO ? 40 : 120); }).observe(document.body, { childList: true, subtree: true }); } catch { /* nada */ }
    tick();
  });
  window.__axDiarias = { NOMBRES, DIARIAS, tick, pGanar, mejorReparto, leerMenu, iniciarRuta, CANTERA, propReact, fondo };
})();
