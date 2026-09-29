// ==UserScript==
// @name         Aurora Dex · Diarias (solas)
// @namespace    auroradex-diarias
// @version      1.13.0
// @description  Juega solo las diarias. «🤖 Todas las diarias» (icono de Accesos directos o botón del Menú): las juega todas en segundo plano (también Isla, Misiones, Máquina de Fichas, Solar, los Tronos si no tienes ninguno y las dos ligas de la Torre, esperando sus 15 min entre retos), en una ventana oculta de la misma pestaña, mientras tú sigues jugando; una tarjeta abajo dice por dónde va con el paso entre paréntesis (3/14), lo que ya estaba hecho, lo hecho y lo que queda (se puede minimizar o parar, y si recargas sigue). «¿Quién es ese Pokémon?»: lee el número de la Pokédex de la silueta, pulsa el nombre correcto y tira la ruleta con cada acierto. Cúpula Pokéathlon: reparte tus Pokémon entre las tres pruebas probando los 120 repartos y quedándose con el que más energía da de media (con el ±20% de suerte), y compite. El Muelle: echa el flotador y tira justo cuando pasa por el centro de la zona. Carreras de Rattata: elige rata según la pista (y aprende de tus carreras). Rutas submarinas: bombona y 12 bajadas a la zona que elijas. Tren de Biscuit: rebusca en la chatarra. La Cantera: martillo para buscar y pico para sacar las piezas enteras que salen más baratas. Álbum de Braulio: elige la base más currada, cinco veces. Casa Treta (Hoenn): la sube con su script. Botón «Jugar todas las diarias» en el menú: juega todas las pendientes una tras otra y luego viaja a cada región para hacer su Safari (con Safari Auto), la Casa Treta en Hoenn y el Tren en Teselia, y vuelve a la tuya. En casa además pasa por el Huerto (solo Meloc y Latano), el Valle («Hacerlo todo») y el Salón (los respiros del día) con sus scripts. Abriendo https://auroradex.es/menu?diarias=todas (p. ej. desde un atajo del móvil a una hora) la ruta arranca sola. Panel con lo que va haciendo y botón para parar.
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
  const VERSION = '1.13.0';
  // ¿Esta es la pestaña o la ventana oculta donde se juegan las diarias en segundo plano? (en otras ventanas, nada)
  const FONDO_NOMBRE = 'axd-fondo';
  let EN_FONDO = false;
  try { if (window.top !== window) { if (window.name === FONDO_NOMBRE) EN_FONDO = true; else return; } } catch { return; }
  const PANEL_ID = 'axd-panel';
  const LS_AUTO = 'axd-auto';
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  // Las esperas entre acciones miran al volver si aún toca jugar: si se ha pulsado Parar, se corta ahí mismo
  const PARADO = new Error('parado');
  const pausa = async (a, b) => { await sleep(a + Math.random() * (b - a)); if (!jugando()) throw PARADO; };
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
    detecta: () => $$('main h1').find(h => /qui[eé]n es ese pok[eé]mon/i.test(texto(h))),
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
    detecta: () => $$('main h1').find(h => /pok[eé]athlon/i.test(texto(h))),
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
   * Al echar el flotador sale una barra con tres marcas puestas en porcentaje: la zona verde (left/width), el centro
   * (left/width) y el flotador, que va del 0% al 100% a velocidad fija (su «left» cambia en cada fotograma). Al tirar,
   * cuenta dónde está el flotador en ese momento: se sigue fotograma a fotograma y se tira cuando cae en el centro del
   * centro (adelantándose medio fotograma para no pasarse). */
  const frame = () => new Promise(r => requestAnimationFrame(() => r()));
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
  const MUELLE = {
    id: 'muelle',
    nombre: '🎣 El Muelle',
    detecta: () => $$('main h1').find(h => /el muelle/i.test(texto(h))),
    async paso() {
      // el cartel del resultado (Clavado / Ha picado / Se escapó): tocar para seguir
      const cartel = $$('button').find(b => !ajeno(b) && visible(b) && /toca para seguir$/i.test(texto(b)));
      if (cartel) return pulsar(cartel, `🐟 ${texto(cartel).replace(/toca para seguir$/i, '').trim().slice(0, 90)}`, [800, 1300]);
      const tira = $$('main button').find(b => !ajeno(b) && !b.disabled && visible(b) && /^¡?tira!?$/i.test(texto(b)));
      if (tira) {
        const m = barraMuelle(tira);
        if (!m) { log('⚠ Veo «¡TIRA!» pero no la barra. Pulsa «📋 Copiar HTML» y pásamelo.'); return false; }
        const meta = pct(m.centro, 'left') + pct(m.centro, 'width') / 2;
        let antes = pct(m.flot, 'left'), v = 0;
        const t0 = performance.now();
        while (performance.now() - t0 < 20000) {
          await frame();
          if (!document.contains(m.flot) || tira.disabled) return true;
          const x = pct(m.flot, 'left');
          if (x == null) continue;
          if (x > antes) v = x - antes;
          antes = x;
          if (v > 0 && x + v / 2 >= meta) {
            tira.click(); otraAccion();
            log(`🎯 ¡Tira! en el ${x.toFixed(1)}% (centro en el ${meta.toFixed(1)}%, verde ${pct(m.verde, 'left')}–${(pct(m.verde, 'left') + pct(m.verde, 'width')).toFixed(0)})`);
            await pausa(1500, 2200);
            return true;
          }
        }
        return false;
      }
      const echar = $$('main button').find(b => !ajeno(b) && !b.disabled && visible(b) && /echar el flotador/i.test(texto(b)));
      if (echar) return pulsar(echar, '🎣 Echar el flotador', [150, 300]);
      return pulsarSeguir();
    },
  };


  const principal = () => $$('main button.boton-principal').find(b => !ajeno(b) && !b.disabled && visible(b));
  // innerText (no textContent): separa los bloques, que si no se pegan («Hoy0Hoy se corre en…»)
  const textoMain = () => { const m = document.querySelector('main'); return m ? (m.innerText || m.textContent || '').replace(/\s+/g, ' ').trim() : ''; };
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
    detecta: () => $$('main h1').find(h => /carreras de rattata/i.test(texto(h))),
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
    detecta: () => $$('main h1').find(h => /rutas submarinas/i.test(texto(h))),
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
    detecta: () => $$('main h1').find(h => /tren de biscuit/i.test(texto(h))),
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
    detecta: () => ruta() === '/safari' && $$('main h1')[0],
    region() {
      const h = $$('main h1')[0], antes = h && h.previousElementSibling;
      return regionDe(texto(antes) || texto(h && h.parentElement).slice(0, 40));
    },
    // «Ya has hecho tu visita de hoy…» (ojo: dentro pone «Al salir se acaba la visita de hoy», que no es lo mismo)
    cerrada: () => /has hecho tu visita de hoy|abre otra vez mañana/i.test(textoMain()),
    otraRegion(g) { const r = this.region(); return !!r && r !== g; },
    apuntar() {
      const reg = this.region();
      if (reg) { const s = safarisHoy(); if (!s.hechas.includes(reg)) { s.hechas.push(reg); lsPut('axd-safaris', s); } marcarInterfaz('/safari@' + reg.toLowerCase()); }
    },
    listo() {
      if (!this.cerrada()) return false;
      const r = ssGet(), g = r && r.actual && r.actual.region;
      if (!g || g === this.region()) this.apuntar();
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
      if (confirmar && this.arrancado) { this.apuntar(); return pulsar(confirmar, `🌾 ${texto(confirmar)}`, [2000, 3000]); }
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
    detecta: () => $$('main h1').find(h => /las regiones/i.test(texto(h))),
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
    detecta: () => $$('main h1').find(h => /^la cantera$/i.test(texto(h))),
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
    detecta: () => $$('main h1').find(h => /[aá]lbum de braulio/i.test(texto(h))),
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
    detecta: () => $$('main h1').find(h => /^la casa treta$/i.test(texto(h))),
    otraRegion: () => /casa treta est[aá] en/i.test(textoMain()),
    // cerrada con 🔒 aunque estés en su región: solo se entra estando en su ruta del mapa (moverte por el mapa no lo hago)
    motivoFuera() { const m = textoMain().match(/la casa treta\s*(ruta \d+)/i); return `⏭ 🚪 La Casa Treta: solo se entra estando en la ${m ? m[1].replace(/^r/, 'R') : 'su ruta'}; esa te la dejo.`; },
    plantas() { const m = textoMain().match(/(\d+)\s*de\s*(\d+)\s*plantas hoy/i); return m ? [+m[1], +m[2]] : null; },
    listo() {
      const p = this.plantas(), b = document.querySelector('#ct-embedded-panel .ct-btn');
      return /casa treta est[aá] en/i.test(textoMain()) || (!!p && p[0] >= p[1]) || (!!b && this.arrancado && /volver a intentar/i.test(texto(b)));
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
      return { pendiente: m ? +m[1] < +m[2] : true, cerrada: /🔒\s*la casa treta est[aá] en/i.test(t), ruta: ruta ? ruta.replace(/^r/, 'R') : '' };
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


  /* ══════════ Paradas nuevas: Misiones, Máquina de Fichas, Isla, Solar, Tronos y Torre ══════════ */
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
    desde: 0,
    boton: () => botonMain(/^(cobrar|recoger)$/i),
    listo() { return !!this.desde && Date.now() - this.desde > 3000 && !this.boton(); },
    async paso() {
      if (!this.desde) this.desde = Date.now();
      const b = this.boton();
      if (!b) return false;
      const fila = b.closest('li, div.tarjeta, section') || b.parentElement;
      const que = (texto(fila).match(/^[^\d+·]{3,60}/) || [''])[0].replace(/cobrar|recoger/ig, '').trim();
      return pulsar(b, `🎯 Cobro: ${que || 'una misión'}.`, [1500, 2500]);
    },
  };
  async function misionesPendientes() {
    try { const { doc } = await leerPagina('/misiones'); return [...doc.querySelectorAll('main button')].some(b => /^(cobrar|recoger)$/i.test(texto(b))); } catch { return false; }
  }

  // Máquina de Fichas: gira mientras queden fichas (salen del Subsuelo y del Valle; no valen para otra cosa)
  const GACHA = {
    id: 'gachapon', nombre: '🎰 Máquina de Fichas', soloRuta: true, sinPanel: true,
    detecta: () => ruta() === '/gachapon' && document.querySelector('main'),
    fichas() { const m = textoMain().match(/(\d+)\s*fichas/i); return m ? +m[1] : null; },
    listo() { return this.fichas() === 0 || /no te quedan fichas/i.test(textoMain()); },
    async paso() {
      if (this.listo()) return false;
      const b = botonMain(/girar/i);
      if (b) return pulsar(b, `🎰 Giro la máquina (${this.fichas()} ficha${this.fichas() === 1 ? '' : 's'}).`, [2500, 3500]);
      return pulsarSeguir();
    },
  };
  async function fichasPendientes() {
    try { const { texto: t } = await leerPagina('/gachapon'); const m = t.match(/(\d+)\s*fichas/i); return !!m && +m[1] > 0; } catch { return false; }
  }

  // Isla Espejismo: gastar la marea con el script de la Isla («Jugar la isla sola»)
  const SS_ISLA = EN_FONDO ? 'axi-auto-fondo' : 'axi-auto';
  const ISLA = {
    id: 'isla', nombre: '🏝️ Isla Espejismo', soloRuta: true, sinPanel: true, maxMs: 25 * 60000,
    detecta: () => ruta() === '/isla' && document.querySelector('main'),
    desde: 0, arrancado: 0, dicho: false,
    enMarcha: () => { try { return sessionStorage.getItem(SS_ISLA) === '1'; } catch { return false; } },
    listo() { return (!!this.arrancado && Date.now() - this.arrancado > 4000 && !this.enMarcha()) || /no hay ninguna isla/i.test(textoMain()); },
    async paso() {
      if (/no hay ninguna isla/i.test(textoMain())) return false;
      if (!this.arrancado) {
        if (!document.getElementById('axi-auto')) {
          if (!this.desde) this.desde = Date.now();
          else if (Date.now() - this.desde > 15000) { this.desde = Date.now() + 1e12; log('⚠ 🏝️ No veo el script de la Isla Espejismo: instálalo para que gaste la marea.'); }
          return false;
        }
        try { sessionStorage.setItem(SS_ISLA, '1'); } catch { /* nada */ }
        this.arrancado = Date.now(); log('🏝️ Isla: a gastar la marea (captura a todos).');
        return true;
      }
      if (this.enMarcha()) return true;
      if (!this.dicho) {
        this.dicho = true;
        const u = lsGet('axi-auto-ultimo', null), l = u && u.t >= this.arrancado && (u.log || []).slice(-1)[0];
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

  // Los Tronos: si no tienes ninguno, reta con el mejor equipo al que más fácil se gana y, si pierde, al siguiente,
  // hasta ganar uno o quedarte sin tronos que retar hoy (lo hace el script Tiers); si ya tienes uno, nada
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
      if (m && m !== this.dicho && /^(⚔️|❌|👑|🏁|⚠)/.test(m) && !/Retando al de/.test(m)) { this.dicho = m; log(m.length > 140 ? m.slice(0, 137) + '…' : m); }
      return !this.fin();
    },
  };
  async function sinTrono() { try { const { texto: t } = await leerPagina('/tronos'); return /tronos/i.test(t) && !/TUYO/.test(t); } catch { return false; } }

  // Torre Desafío: las dos ligas, cinco retos al día en cada una (los hace el script Tiers, «Retar solo»). La Torre pide
  // unos 15 min entre retos: mientras una liga espera se reta en la otra, y si esperan las dos se espera aquí.
  const LIGAS_TORRE = { clasico: '🗼 Clásico', comunes: '🌱 Planta Baja' };
  const SS_TORRE_AUTO = EN_FONDO ? 'axt-torre-auto-fondo' : 'axt-torre-auto';
  const TORRE = {
    id: 'torre', nombre: '🗼 Torre Desafío', soloRuta: true, sinPanel: true, maxMs: 3 * 3600000,
    detecta: () => ruta() === '/torre' && document.querySelector('main'),
    desde: 0,
    ligas() { const r = ssGet(); return (r && r.actual && r.actual.ligas) || {}; },
    listo() { const L = this.ligas(); return Object.keys(LIGAS_TORRE).every(l => L[l] && L[l].fin); },
    async paso() {
      const r = ssGet();
      if (!r || !r.actual) return false;
      const L = r.actual.ligas || (r.actual.ligas = {});
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
          else if (Date.now() - this.desde > 25000) { log('⚠ 🗼 No veo el script Tiers: instálalo para que haga los retos de la Torre.'); Object.keys(LIGAS_TORRE).forEach(l => { L[l] = { ...(L[l] || {}), fin: true }; }); ssPut(r); return false; }
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
      ssPut(r);
      const pend = Object.keys(LIGAS_TORRE).filter(l => !(L[l] && L[l].fin));
      if (!pend.length) return false;
      // Tiers reta solo en las que quedan
      try { const o = JSON.parse(sessionStorage.getItem(SS_TORRE_AUTO) || '{}'); let cambio = false; for (const l of Object.keys(LIGAS_TORRE)) { const v = pend.includes(l); if (o[l] !== v) { o[l] = v; cambio = true; } } if (cambio) sessionStorage.setItem(SS_TORRE_AUTO, JSON.stringify(o)); } catch { /* nada */ }
      const listas = pend.filter(l => !(L[l] && L[l].listaEn > Date.now()));
      if (liga && listas.includes(liga)) return true;                       // aquí se puede retar: lo hace Tiers
      const otra = listas.find(l => l !== liga);
      const destino = otra || pend.slice().sort((a, b) => ((L[a] && L[a].listaEn) || 0) - ((L[b] && L[b].listaEn) || 0))[0];
      if (destino !== liga) { await pausa(1200, 2200); location.assign('/torre?liga=' + destino); }
      return true;                                                            // (esperando: Tiers recarga al pasar)
    },
  };
  async function torrePendiente() {
    try { const { texto: t } = await leerPagina('/torre'); return [...t.matchAll(/(\d+)\s*retos hoy/gi)].some(m => +m[1] > 0); } catch { return false; }
  }

  const DIARIAS = [QUIEN, POKEATHLON, MUELLE, CARRERAS, BUCEO, TREN, SAFARI, VIAJE, CANTERA, ALBUM, TRETA, HUERTO, VALLE, SALON, JESSIE, MISIONES, GACHA, ISLA, SOLAR, TRONOS, TORRE];

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
  const EXTRA = { '/tren': TREN, '/casa': TRETA, '/huerto': HUERTO, '/valle': VALLE, '/salon': SALON, '/misiones': MISIONES, '/gachapon': GACHA, '/isla': ISLA, '/solar': SOLAR, '/tronos': TRONOS, '/torre': TORRE };
  // las que se hacen en casa en cada ruta (las juegan sus scripts): Huerto (Meloc/Latano), Valle («Hacerlo todo») y los
  // respiros del Salón (una vez al día; si el cupo ya está, su script para solo)
  const DE_CASA = () => [{ href: '/huerto' }, { href: '/valle' }, ...(lsGet('axd-salon-hecho', '') === hoy() ? [] : [{ href: '/salon' }])];
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
  async function iniciarRuta() {
    if (ruta() !== '/menu') { ssPut({ preparar: true, t: Date.now() }); location.assign('/menu'); return; }
    const menu = leerMenu();
    const cola = menu.filter(d => !d.hecha && d.sabe).map(d => ({ href: d.href }));
    pintarMenu(['Mirando qué queda…']);
    // lo que no sale en «Para hoy» se mira por detrás, todo a la vez
    const [ct, misionesP, fichasP, islaP, tronosP, torreP] = await Promise.all([tretaPendiente(), misionesPendientes(), fichasPendientes(), islaAbierta(), sinTrono(), torrePendiente()]);
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
    if (casa) cola.push(...extras(casa));
    cola.push(...DE_CASA());
    if (islaP) cola.push({ href: '/isla' });
    if (fichasP) cola.push({ href: '/gachapon' });
    if (casa) {
      const sr0 = lsGet('axd-sin-reserva', {}), sinReserva = Object.keys(sr0).filter(g => Date.now() - sr0[g] < 7 * 864e5);
      const destinos = REGIONES.filter(g => norm(texto(ev)).includes(norm(g)));
      const fuera = destinos.filter(g => g !== casa && ((!s.hechas.includes(g) && !sinReserva.includes(g)) || extras(g).length));
      for (const g of fuera) {
        cola.push({ viaje: g });
        if (!s.hechas.includes(g) && !sinReserva.includes(g)) cola.push({ href: '/safari', region: g });
        cola.push(...extras(g));
      }
      if (fuera.length) cola.push({ viaje: casa, vuelta: true });
    } else log0.push('⚠ No encuentro en el menú en qué región estás: solo juego las de aquí.');
    // al final, ya en casa: los Tronos (si no tienes ninguno), la Torre (con sus esperas de 15 min) y cobrar las misiones
    if (tronosP) cola.push({ href: '/tronos' });
    if (torreP) cola.push({ href: '/torre' });
    if (misionesP || torreP || tronosP) cola.push({ href: '/misiones' });
    if (!cola.length) {
      ssPut(null);
      pintarMenu([...log0, '✅ Las que sé jugar ya están hechas hoy.']);
      if (EN_FONDO) ssSet(SS_FIN, { t: Date.now(), t0: Date.now(), pasos: [], yaHechas, avisos: log0 });
      return;
    }
    const r = { cola, hechas: [], log: [...log0], actual: null, casa, pasos: [], yaHechas, avisos: log0, t0: Date.now() };
    ssPut(r);
    pintarMenu([...log0, `▶ Voy: ${cola.map(nombreDe).join(' → ')}.`]);
    siguiente(r);
  }
  const nombreDe = x => x.viaje ? `🧭 ${x.viaje}` : `${(RUTAS[x.href] || EXTRA[x.href]).nombre}${x.region ? ' ' + x.region : ''}`;
  // (el Safari de tu región no lleva región en la ruta: se le pone para la tarjeta)
  const nombrePaso = (x, casa) => x.viaje ? `🧭 ${x.vuelta ? 'Vuelta a' : 'Viaje a'} ${x.viaje}` : x.href === '/safari' && !x.region && casa ? nombreDe({ ...x, region: casa }) : nombreDe(x);
  async function siguiente(r) {
    // el paso que acaba (para la tarjeta: ✅ si fue bien, ⚠ si se saltó o se atascó)
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
    await sleep(1500 + Math.random() * 1300);
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
    if (hizo && !listo) { quietoDesde = 0; return; }
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
    if (!r.actual.viaje && !cerrada && !agotada && quieto > 12000 && !r.actual.recargada) {
      r.actual.recargada = true; ssPut(r); quietoDesde = 0; location.reload(); return;
    }
    if (!r.actual.viaje && ((cerrada && quieto > 1500) || quieto > 12000 || agotada) || (r.actual.viaje && listo && quieto > 800)) {
      const nom = r.actual.viaje ? `🧭 Viaje a ${r.actual.viaje}` : `${d.nombre}${r.actual.region ? ' ' + r.actual.region : ''}`;
      const msg = agotada ? `⚠ ${nom}: se me ha atascado, la dejo.` : cerrada ? `✅ ${nom}${r.actual.viaje ? '' : ': hecha'}.` : `⚠ ${nom}: no veo nada más que hacer (si no está hecha, pásame su HTML).`;
      if (r.actual.viaje && r.actual.vuelta && listo) r.fuera = false;
      if (!r.actual.viaje) r.hechas.push(r.actual.href);
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
    if (r.preparando) { if (Date.now() - (r.t || 0) > 60000) ssPut({ preparar: true, t: Date.now() }); return; }
    if (r.preparar) {
      ocupado = true; ssPut({ preparando: true, t: Date.now() });
      iniciarRuta().catch(e => { console.warn('[diarias]', e); ssPut(null); }).finally(() => { ocupado = false; });
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
    if (EN_FONDO) ssSet(SS_FIN, { t: Date.now(), t0: r.t0, pasos: r.pasos || [], yaHechas: r.yaHechas || [], avisos: r.avisos || [], fuera: r.fuera, casa: r.casa });
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
    if (!r || !r.actual || !r.actual.href || r.actual.href === ruta()) { perdido = 0; return false; }
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
  async function tick() {
    if (EN_FONDO) ssSet(SS_LATIDO, Date.now());
    if (ocupado) return;
    const r = ssGet();
    if (perdida(r)) return;
    if (ruta() === '/menu') { tickMenu(); return; }
    const enRuta = !!(r && r.actual && r.actual.href === ruta());
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
  function fondoActivo() { return !!ssLeer(SS_FONDO); }
  const FONDO_CSS = `
    #axd-fondo-card{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 84px);transform:translateX(-50%);z-index:2147483000;width:min(400px,calc(100vw - 20px));font-family:inherit;color:rgb(var(--tinta-800,33 36 29));animation:axdf-entra .35s cubic-bezier(.2,1.25,.4,1) both}
    #axd-fondo-card .axdf-caja{border-radius:22px;background:rgb(var(--lienzo,255 255 255));border:2px solid color-mix(in srgb,var(--axdf-c) 45%,rgb(var(--crema-200,232 226 210)));box-shadow:0 4px 0 0 rgba(0,0,0,.07),0 18px 36px -16px rgba(0,0,0,.5);overflow:hidden}
    #axd-fondo-card .axdf-cab{display:flex;align-items:center;gap:10px;padding:10px 10px 8px 10px}
    #axd-fondo-card .axdf-ico{width:42px;height:42px;flex-shrink:0;border-radius:14px;display:grid;place-items:center;font-size:22px;background:color-mix(in srgb,var(--axdf-c) 16%,rgb(var(--lienzo,255 255 255)));box-shadow:inset 0 -3px 0 color-mix(in srgb,var(--axdf-c) 28%,transparent)}
    #axd-fondo-card[data-s="on"] .axdf-ico span{display:inline-block;animation:axdf-bota 1.4s ease-in-out infinite}
    #axd-fondo-card .axdf-tit{margin:0;font-family:var(--font-display),system-ui,sans-serif;font-size:15px;font-weight:800;line-height:1.15}
    #axd-fondo-card .axdf-sub{margin:1px 0 0;font-size:11px;font-weight:800;color:rgb(var(--tinta-400,140 143 133));white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    #axd-fondo-card .axdf-num{font-variant-numeric:tabular-nums;color:var(--axdf-c)}
    #axd-fondo-card .axdf-bt{width:30px;height:30px;flex-shrink:0;border:0;border-radius:999px;display:grid;place-items:center;cursor:pointer;font-size:13px;font-weight:900;background:rgb(var(--crema-100,244 239 226));color:rgb(var(--tinta-500,99 102 92));transition:background .15s,transform .1s}
    #axd-fondo-card .axdf-bt:hover{background:rgb(var(--crema-200,232 226 210))}
    #axd-fondo-card .axdf-bt:active{transform:scale(.92)}
    #axd-fondo-card .axdf-bt.axdf-stop{color:rgb(var(--rojo-600,200 60 50))}
    #axd-fondo-card .axdf-barra{margin:0 12px;height:10px;border-radius:999px;background:rgb(var(--crema-200,232 226 210));overflow:hidden;box-shadow:inset 0 1px 2px rgba(0,0,0,.12)}
    #axd-fondo-card .axdf-barra>span{display:block;height:100%;width:0;border-radius:999px;background:var(--axdf-c);transition:width .6s cubic-bezier(.22,1,.36,1);background-image:linear-gradient(100deg,rgba(255,255,255,0) 30%,rgba(255,255,255,.45) 50%,rgba(255,255,255,0) 70%);background-size:200% 100%}
    #axd-fondo-card[data-s="on"] .axdf-barra>span{animation:axdf-brillo 1.6s linear infinite}
    #axd-fondo-card .axdf-ahora{margin:8px 12px 0;padding:7px 10px;border-radius:14px;background:color-mix(in srgb,var(--axdf-c) 9%,rgb(var(--lienzo,255 255 255)));font-size:12px;font-weight:700;line-height:1.35;color:rgb(var(--tinta-600,72 75 66));display:flex;gap:7px;align-items:flex-start}
    #axd-fondo-card .axdf-ahora:empty{display:none}
    #axd-fondo-card .axdf-ahora b{color:rgb(var(--tinta-800,33 36 29))}
    #axd-fondo-card .axdf-ahora small{display:block;font-size:10.5px;font-weight:700;color:rgb(var(--tinta-400,140 143 133))}
    #axd-fondo-card .axdf-pasos{list-style:none;margin:8px 0 0;padding:0 12px 10px;max-height:170px;overflow-y:auto;overflow-x:hidden;display:grid;grid-template-columns:minmax(0,1fr);gap:2px;scrollbar-width:thin}
    #axd-fondo-card .axdf-pasos li{display:flex;align-items:center;gap:7px;padding:3px 6px;border-radius:10px;font-size:12px;font-weight:700;color:rgb(var(--tinta-600,72 75 66))}
    #axd-fondo-card .axdf-pasos li.axdf-ya{animation:axdf-fila .3s ease both}
    #axd-fondo-card .axdf-pasos li .axdf-m{width:18px;text-align:center;flex-shrink:0;font-size:12px}
    #axd-fondo-card .axdf-pasos li .axdf-n{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    #axd-fondo-card .axdf-pasos li .axdf-mot{display:block;white-space:normal;font-size:10.5px;font-weight:700;color:rgb(var(--tinta-400,140 143 133))}
    #axd-fondo-card .axdf-pasos li .axdf-t{font-size:10px;font-weight:800;color:rgb(var(--tinta-400,140 143 133));font-variant-numeric:tabular-nums}
    #axd-fondo-card .axdf-pasos li.axdf-hecho{color:rgb(var(--hoja-700,40 120 60))}
    #axd-fondo-card .axdf-pasos li.axdf-mal{color:rgb(var(--ambar-700,160 100 0))}
    #axd-fondo-card .axdf-pasos li.axdf-ya{background:color-mix(in srgb,var(--axdf-c) 12%,rgb(var(--lienzo,255 255 255)));color:rgb(var(--tinta-800,33 36 29));box-shadow:inset 0 0 0 1.5px color-mix(in srgb,var(--axdf-c) 45%,transparent)}
    #axd-fondo-card .axdf-pasos li.axdf-luego{opacity:.55}
    #axd-fondo-card .axdf-pasos li.axdf-antes{opacity:.6;font-size:11px}
    #axd-fondo-card .axdf-rueda{width:12px;height:12px;border-radius:999px;border:2px solid color-mix(in srgb,var(--axdf-c) 30%,transparent);border-top-color:var(--axdf-c);display:inline-block;animation:axdf-gira .8s linear infinite}
    #axd-fondo-card .axdf-pie{display:flex;gap:8px;padding:0 12px 12px}
    #axd-fondo-card .axdf-pie:empty{display:none}
    #axd-fondo-card .axdf-pie button{flex:1;border:0;border-radius:999px;padding:8px 10px;font-size:12px;font-weight:900;cursor:pointer;background:rgb(var(--crema-100,244 239 226));color:rgb(var(--tinta-600,72 75 66))}
    #axd-fondo-card .axdf-pie button.axdf-prim{background:var(--axdf-c);color:#fff}
    #axd-fondo-card.axdf-mini{width:auto}
    #axd-fondo-card.axdf-mini .axdf-caja{border-radius:999px}
    #axd-fondo-card.axdf-mini .axdf-cab{padding:5px 6px 5px 5px;gap:8px;cursor:pointer}
    #axd-fondo-card.axdf-mini .axdf-ico{width:34px;height:34px;font-size:18px;border-radius:999px}
    #axd-fondo-card.axdf-mini .axdf-tit{font-size:13px}
    #axd-fondo-card.axdf-mini .axdf-sub,#axd-fondo-card.axdf-mini .axdf-barra,#axd-fondo-card.axdf-mini .axdf-ahora,#axd-fondo-card.axdf-mini .axdf-pasos,#axd-fondo-card.axdf-mini .axdf-pie,#axd-fondo-card.axdf-mini .axdf-stop{display:none}
    #axd-fondo-card .axdf-anillo{position:relative}
    #axd-fondo-card.axdf-mini .axdf-ico{background:conic-gradient(var(--axdf-c) calc(var(--axdf-p,0) * 1%),rgb(var(--crema-200,232 226 210)) 0)}
    #axd-fondo-card.axdf-mini .axdf-ico span{width:26px;height:26px;border-radius:999px;display:grid!important;place-items:center;background:rgb(var(--lienzo,255 255 255));font-size:15px;animation:none!important}
    @keyframes axdf-entra{from{opacity:0;transform:translate(-50%,16px) scale(.96)}to{opacity:1}}
    #axd-fondo-card.axdf-mini{animation:none}
    @keyframes axdf-brillo{from{background-position:200% 0}to{background-position:-200% 0}}
    @keyframes axdf-gira{to{transform:rotate(360deg)}}
    @keyframes axdf-bota{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
    @keyframes axdf-fila{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:none}}
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
  const fondo = {
    reinicios: 0, vistaDesde: Date.now(),
    iframe() { return document.querySelector(`iframe[name="${FONDO_NOMBRE}"]`); },
    crearIframe(ruta0 = '/menu') {
      let f = this.iframe();
      if (f) return f;
      f = document.createElement('iframe');
      f.name = FONDO_NOMBRE;
      f.title = 'Diarias en segundo plano';
      f.setAttribute('aria-hidden', 'true'); f.tabIndex = -1;
      // fuera de la vista pero «visible» para la página (con display:none los botones no tienen tamaño y no se pulsan)
      f.style.cssText = 'position:fixed;left:-12000px;top:0;width:430px;height:932px;border:0;opacity:0;pointer-events:none;z-index:-1';
      f.src = ruta0;
      document.body.appendChild(f);
      return f;
    },
    iniciar() {
      if (EN_FONDO) return;
      if (fondoActivo()) { this.ver(); return; }
      if (ssGet()) { alert('Ya hay una ruta de diarias en marcha en esta pestaña.'); return; }
      ssSet(SS_FIN, null); ssSet(SS_AHORA, { t: Date.now(), texto: 'Mirando qué queda por hacer…' }); ssSet(SS_LATIDO, Date.now());
      ssSet(SS_FONDO, { preparar: true, t: Date.now() });
      try { localStorage.setItem(LS_MINI, '0'); } catch { /* nada */ }
      try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); } catch { /* nada */ }
      this.reinicios = 0;
      this.crearIframe('/menu');
      this.pintar();
    },
    parar() {
      const r = ssLeer(SS_FONDO);
      const f = this.iframe(); if (f) f.remove();
      ssSet(SS_FONDO, null); ssSet(SS_LATIDO, null);
      const pasos = (r && r.pasos) || [];
      ssSet(SS_FIN, { t: Date.now(), t0: (r && r.t0) || Date.now(), pasos, yaHechas: (r && r.yaHechas) || [], avisos: (r && r.avisos) || [], parada: true, fuera: r && r.fuera, casa: r && r.casa, quedaban: r && r.cola ? [...(r.actual ? [r.actual] : []), ...r.cola].map(x => nombrePaso(x, r.casa)) : [] });
      this.pintar();
    },
    ver() { try { localStorage.setItem(LS_MINI, '0'); } catch { /* nada */ } this.pintar(); },
    cerrar() { ssSet(SS_FIN, null); const c = document.getElementById('axd-fondo-card'); if (c) c.remove(); },
    // cada poco: que la ventana oculta exista mientras haya ruta, que no esté colgada, y la tarjeta al día
    vigilar() {
      if (EN_FONDO) return;
      const r = ssLeer(SS_FONDO), fin = ssLeer(SS_FIN);
      if (r) {
        const f = this.iframe();
        const latido = +ssLeer(SS_LATIDO) || 0;
        if (!f) { this.crearIframe('/menu'); ssSet(SS_LATIDO, Date.now()); }          // tras recargar la pestaña: sigue
        // (con la pestaña escondida el navegador frena los relojes: solo cuenta si lleva un rato a la vista)
        else if (document.visibilityState === 'visible' && Date.now() - this.vistaDesde > 75000 && Date.now() - latido > 75000) {
          // colgada (la página no carga o el script no responde): se recarga, y a la cuarta se deja
          this.reinicios++;
          if (this.reinicios > 3) { r.log = [...(r.log || []), '⚠ La ventana de las diarias no responde: paro.']; ssSet(SS_FONDO, r); this.parar(); return; }
          f.src = '/menu'; ssSet(SS_LATIDO, Date.now());
        }
      } else if (fin && this.iframe()) {
        this.iframe().remove();
        if (!fin.avisado) {
          fin.avisado = true; ssSet(SS_FIN, fin);
          if (!fin.parada) {
            sonidoFin();
            const ok = (fin.pasos || []).filter(p => p.ok && !p.saltado).length;
            try { if (document.hidden && 'Notification' in window && Notification.permission === 'granted') new Notification('🗓️ Diarias terminadas', { body: `${ok} hechas en ${duracion(fin.t - fin.t0)}.`, icon: new URL('/icono-app.svg', location.origin).href }); } catch { /* nada */ }
          }
        }
      }
      this.pintar();
    },
    pintar() {
      if (EN_FONDO || !document.body) return;
      const r = ssLeer(SS_FONDO), fin = ssLeer(SS_FIN);
      let c = document.getElementById('axd-fondo-card');
      if (!r && !fin) { if (c) c.remove(); return; }
      if (!document.getElementById('axd-fondo-css')) { const st = document.createElement('style'); st.id = 'axd-fondo-css'; st.textContent = FONDO_CSS; (document.head || document.documentElement).appendChild(st); }
      if (!c) {
        c = document.createElement('div');
        c.id = 'axd-fondo-card'; c.setAttribute('data-ax-ignore', ''); c.setAttribute('role', 'status'); c.setAttribute('aria-live', 'polite');
        c.innerHTML = `<div class="axdf-caja">
            <div class="axdf-cab"><div class="axdf-ico"><span>🤖</span></div>
              <div style="flex:1;min-width:0"><p class="axdf-tit"></p><p class="axdf-sub"></p></div>
              <button type="button" class="axdf-bt axdf-min" title="Minimizar">–</button>
              <button type="button" class="axdf-bt axdf-stop" title="Parar">■</button></div>
            <div class="axdf-barra"><span></span></div>
            <div class="axdf-ahora"></div>
            <ul class="axdf-pasos"></ul>
            <div class="axdf-pie"></div></div>`;
        c.querySelector('.axdf-min').addEventListener('click', e => { e.stopPropagation(); const m = !c.classList.contains('axdf-mini'); try { localStorage.setItem(LS_MINI, m ? '1' : '0'); } catch { /* nada */ } this.pintar(); });
        c.querySelector('.axdf-stop').addEventListener('click', e => {
          e.stopPropagation();
          if (ssLeer(SS_FONDO)) { if (confirm('¿Parar las diarias en segundo plano?\n\nLo que ya está hecho, hecho queda.')) this.parar(); }
          else this.cerrar();
        });
        c.querySelector('.axdf-cab').addEventListener('click', () => { if (c.classList.contains('axdf-mini')) this.ver(); });
        c.querySelector('.axdf-pie').addEventListener('click', e => {
          const b = e.target.closest('button'); if (!b) return;
          if (b.dataset.a === 'cerrar') this.cerrar();
          else if (b.dataset.a === 'otra') { this.cerrar(); this.iniciar(); }
        });
        document.body.appendChild(c);
      }
      let mini = false; try { mini = localStorage.getItem(LS_MINI) === '1'; } catch { /* nada */ }
      c.classList.toggle('axdf-mini', mini && !!r);
      const pasos = (r ? r.pasos : fin.pasos) || [];
      const actual = r && r.actual ? nombrePaso(r.actual, r.casa) : null;
      const cola = r && r.cola ? r.cola.map(x => nombrePaso(x, r.casa)) : [];
      const total = pasos.length + (actual ? 1 : 0) + cola.length + (!r && fin.quedaban ? fin.quedaban.length : 0);
      const n = pasos.length + (actual ? 1 : 0);
      const ahora = ssLeer(SS_AHORA);
      const set = (sel, v, html) => { const el = c.querySelector(sel); if (!el) return; if (html) { if (el.dataset.h !== v) { el.dataset.h = v; el.innerHTML = v; } } else if (el.textContent !== v) el.textContent = v; };
      let color = '#7C5CFF', estado = 'on', titulo, sub, pct;
      if (r) {
        if (r.preparar || !total) { titulo = 'Diarias en segundo plano'; sub = 'Preparando la ruta…'; pct = 3; }
        else {
          titulo = `Diarias en segundo plano (${n}/${total})`;
          sub = `${actual || 'Terminando'} · ${duracion(Date.now() - (r.t0 || Date.now()))}`;
          pct = Math.max(4, Math.round(100 * (n - 0.5) / total));
        }
        if (mini) titulo = total ? `${n}/${total}` : '…';
      } else {
        const ok = pasos.filter(p => p.ok && !p.saltado).length, mal = pasos.length - ok;
        estado = fin.parada ? 'off' : mal ? 'warn' : 'ok'; color = fin.parada ? '#8C8F85' : mal ? '#E0A000' : '#2FA84F';
        titulo = fin.parada ? 'Diarias paradas' : pasos.length ? '¡Diarias terminadas!' : 'Nada que hacer';
        sub = pasos.length ? `${ok} bien${mal ? ` · ${mal} con aviso` : ''} · ${duracion((fin.t || Date.now()) - (fin.t0 || Date.now()))}` : 'Las que sé jugar ya estaban hechas hoy';
        pct = 100;
      }
      c.style.setProperty('--axdf-c', color); c.style.setProperty('--axdf-p', String(pct)); c.dataset.s = estado;
      set('.axdf-tit', titulo); set('.axdf-sub', sub);
      set('.axdf-ico span', r ? '🤖' : fin.parada ? '⏹' : '🏁');
      c.querySelector('.axdf-barra>span').style.width = pct + '%';
      c.querySelector('.axdf-stop').title = r ? 'Parar' : 'Cerrar';
      c.querySelector('.axdf-min').style.display = r ? '' : 'none';
      set('.axdf-stop', r ? '■' : '✕');
      // lo que está haciendo ahora mismo
      let ahoraTxt = r && ahora && ahora.texto && Date.now() - ahora.t < 10 * 60000 ? corto(ahora.texto) : '';
      // en la Torre: cómo va cada liga, con la cuenta atrás hasta el siguiente reto
      if (r && r.actual && r.actual.href === '/torre' && r.actual.ligas) {
        const mmss = ms => { const t = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };
        ahoraTxt = Object.entries(LIGAS_TORRE).map(([l, nom]) => {
          const x = r.actual.ligas[l] || {};
          return x.fin ? `${nom} ✅` : x.listaEn > Date.now() ? `${nom} ⏳ ${mmss(x.listaEn - Date.now())}${x.quedan != null ? ` (quedan ${x.quedan})` : ''}` : `${nom} ⚔️ retando${x.quedan != null ? ` (quedan ${x.quedan})` : ''}`;
        }).join(' · ');
      }
      set('.axdf-ahora', r ? `<span class="axdf-rueda" style="margin-top:2px"></span><span><b>${esc(actual || (pasos.length ? 'Terminando…' : 'Preparando la ruta…'))}</b>${ahoraTxt && ahoraTxt !== actual ? `<small>${esc(ahoraTxt)}</small>` : ''}</span>` : '', true);
      // la lista de pasos: hechos, el de ahora y los que quedan
      const filas = [];
      const ya = (r ? r.yaHechas : fin.yaHechas) || [];
      if (ya.length) filas.push(`<li class="axdf-antes"><span class="axdf-m">✔</span><span class="axdf-n">Ya hechas hoy: ${esc(ya.join(', '))}</span></li>`);
      for (const l of (r ? r.avisos : fin.avisos) || []) filas.push(`<li class="axdf-antes"><span class="axdf-m">⏭</span><span class="axdf-n" style="white-space:normal">${esc(corto(l.replace(/^(⚠️?|⏭)\s*/, '')))}</span></li>`);
      pasos.forEach((p, i) => filas.push(`<li class="${p.ok ? 'axdf-hecho' : 'axdf-mal'}"${p.motivo ? ` title="${esc(p.motivo)}"` : ''}><span class="axdf-m">${p.ok ? '✅' : p.saltado ? '⏭' : '⚠️'}</span><span class="axdf-n">(${i + 1}/${total || pasos.length}) ${esc(p.nombre)}${p.motivo ? `<small class="axdf-mot">${esc(p.motivo)}</small>` : ''}</span><span class="axdf-t">${p.saltado ? 'saltada' : seg(p.seg)}</span></li>`));
      if (actual) filas.push(`<li class="axdf-ya"><span class="axdf-m"><span class="axdf-rueda"></span></span><span class="axdf-n">(${n}/${total}) ${esc(actual)}</span><span class="axdf-t">ahora</span></li>`);
      cola.forEach((x, i) => filas.push(`<li class="axdf-luego"><span class="axdf-m">○</span><span class="axdf-n">(${n + i + 1}/${total}) ${esc(x)}</span></li>`));
      if (!r) {
        // lo que quedó por hacer si se paró, y si te ha dejado en otra región
        (fin.quedaban || []).forEach((q, i) => filas.push(`<li class="axdf-luego"><span class="axdf-m">○</span><span class="axdf-n">(${pasos.length + i + 1}/${total}) ${esc(q)}</span><span class="axdf-t">sin hacer</span></li>`));
        if (fin.fuera) filas.push(`<li class="axdf-mal"><span class="axdf-m">🧭</span><span class="axdf-n" style="white-space:normal">Te he dejado fuera de ${esc(fin.casa || 'tu región')}: vuelve desde «Viajar a otra región».</span></li>`);
      }
      const lista = c.querySelector('.axdf-pasos'), html = filas.join('');
      if (lista.dataset.h !== html) {
        lista.dataset.h = html; lista.innerHTML = html;
        const yaLi = lista.querySelector('.axdf-ya'); if (yaLi) lista.scrollTop = Math.max(0, yaLi.offsetTop - lista.offsetTop - 60);
      }
      set('.axdf-pie', r ? '' : `<button type="button" data-a="cerrar" class="axdf-prim">Vale</button>${fin.parada ? '<button type="button" data-a="otra">▶ Seguir</button>' : ''}`, true);
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
    setInterval(tick, 800);
    try { new MutationObserver(() => tick()).observe(document.body, { childList: true, subtree: true }); } catch { /* nada */ }
    tick();
  });
  window.__axDiarias = { NOMBRES, DIARIAS, tick, pGanar, mejorReparto, leerMenu, iniciarRuta, CANTERA, propReact, fondo };
})();
