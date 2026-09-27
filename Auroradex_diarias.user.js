// ==UserScript==
// @name         Aurora Dex · Diarias (solas)
// @namespace    auroradex-diarias
// @version      1.5.0
// @description  Juega solo las diarias. «¿Quién es ese Pokémon?»: lee el número de la Pokédex de la silueta, pulsa el nombre correcto y tira la ruleta con cada acierto. Cúpula Pokéathlon: reparte tus Pokémon entre las tres pruebas probando los 120 repartos y quedándose con el que más energía da de media (con el ±20% de suerte), y compite. El Muelle: echa el flotador y tira justo cuando pasa por el centro de la zona. Carreras de Rattata: elige rata según la pista (y aprende de tus carreras). Rutas submarinas: bombona y 12 bajadas a la zona que elijas. Tren de Biscuit: rebusca en la chatarra. La Cantera: martillo para buscar y pico para sacar las piezas enteras que salen más baratas. Álbum de Braulio: elige la base más currada, cinco veces. Casa Treta (Hoenn): la sube con su script. Botón «Jugar todas las diarias» en el menú: juega todas las pendientes una tras otra y luego viaja a cada región para hacer su Safari (con Safari Auto), la Casa Treta en Hoenn y el Tren en Teselia, y vuelve a la tuya. Panel con lo que va haciendo y botón para parar.
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
  const VERSION = '1.5.0';
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
    p.querySelector('.axd-todas').addEventListener('click', () => iniciarRuta());
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
  const botonSeguir = () => $$('main button').find(b => !ajeno(b) && !b.disabled && visible(b) && /^(siguiente|continuar|seguir|vale|recoger|cerrar|otra)/i.test(texto(b)));
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
   * Se echa el flotador; un flotador cruza la barra y hay que tirar cuando pasa por la zona verde (mejor, por el centro
   * blanco). Se localiza solo: el elemento pequeño que se MUEVE (las olas decorativas son anchísimas y no cuentan), y a
   * su lado la zona verde y, dentro, la blanca. Se sigue fotograma a fotograma y se tira justo al pasar por el centro,
   * contando con su velocidad (se adelanta medio fotograma). */
  const centro = r => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
  const rgb = el => { const m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g); return m ? { r: +m[0], g: +m[1], b: +m[2], a: m[3] == null ? 1 : +m[3] } : null; };
  const esVerde = el => { const c = rgb(el); return (c && c.a > 0.3 && c.g > c.r + 25 && c.g > c.b - 10) || /(^|\s|-)(hoja|verde|green|emerald|lime|lima)/.test(el.className || ''); };
  const esBlanco = el => { const c = rgb(el); return !!c && c.a > 0.5 && c.r > 215 && c.g > 215 && c.b > 215; };
  const frame = () => new Promise(r => requestAnimationFrame(() => r()));
  function pequenos(raiz) {
    return $$('*', raiz).filter(el => !ajeno(el)).map(el => ({ el, r: el.getBoundingClientRect() })).filter(x => x.r.width > 2 && x.r.width < 70 && x.r.height > 2 && x.r.height < 70);
  }
  // el flotador: lo que se mueve (dos muestras separadas unos fotogramas)
  async function buscarFlotador(raiz) {
    const a = pequenos(raiz); for (let i = 0; i < 4; i++) await frame();
    let mejor = null;
    for (const x of a) {
      if (!document.contains(x.el)) continue;
      const r2 = x.el.getBoundingClientRect(), dx = Math.abs(centro(r2).x - centro(x.r).x), dy = Math.abs(centro(r2).y - centro(x.r).y);
      const d = Math.max(dx, dy);
      if (d > 0.8 && (!mejor || d > mejor.d)) mejor = { el: x.el, d, eje: dx >= dy ? 'x' : 'y' };
    }
    return mejor;
  }
  // la diana: dentro del contenedor del flotador, la zona verde y, si hay, la blanca de dentro
  function buscarDiana(flot) {
    let cont = flot.el.parentElement;
    for (let n = 0; n < 4 && cont; n++, cont = cont.parentElement) {
      const hijos = $$('*', cont).filter(el => el !== flot.el && !el.contains(flot.el) && !flot.el.contains(el));
      const verdes = hijos.filter(esVerde).map(el => ({ el, r: el.getBoundingClientRect() })).filter(x => x.r.width > 3 && x.r.height > 3);
      if (!verdes.length) continue;
      const v = verdes.sort((a, b) => (a.r.width * a.r.height) - (b.r.width * b.r.height))[verdes.length - 1];
      const blancos = hijos.filter(esBlanco).map(el => ({ el, r: el.getBoundingClientRect() }))
        .filter(x => x.r.width < v.r.width && x.r.left >= v.r.left - 1 && x.r.right <= v.r.right + 1 && x.r.width > 1);
      const w = blancos.sort((a, b) => a.r.width - b.r.width)[0];
      return { verde: v.el, blanco: w && w.el };
    }
    return null;
  }
  const MUELLE = {
    id: 'muelle',
    nombre: '🎣 El Muelle',
    detecta: () => $$('main h1').find(h => /el muelle/i.test(texto(h))),
    botonAccion: () => $$('main section button').find(b => !ajeno(b) && !b.disabled && visible(b) && !/^(siguiente|continuar|seguir|vale|recoger|cerrar)$/i.test(texto(b))),
    fallos: 0,
    async paso() {
      const bt = this.botonAccion();
      if (!bt) return pulsarSeguir();
      const raiz = bt.closest('section') || document.querySelector('main');
      const flot = await buscarFlotador(raiz);
      if (!flot) {
        // sin nada moviéndose: toca echar el flotador (o seguir)
        if (/echar|lanzar|flotador|pescar/i.test(texto(bt))) {
          await pausa(700, 1300);
          if (!document.contains(bt) || bt.disabled) return true;
          log(`🎣 ${texto(bt)}`); bt.click(); otraAccion(); this.esperando = Date.now();
          await pausa(400, 700);
          return true;
        }
        if (this.esperando && Date.now() - this.esperando > 6000) { this.esperando = 0; log('⚠ No encuentro el flotador moviéndose. Pulsa «📋 Copiar HTML» con la barra en pantalla y pásamelo.'); }
        return pulsarSeguir();
      }
      const diana = buscarDiana(flot);
      if (!diana) { if (++this.fallos % 20 === 1) log('⚠ Veo el flotador pero no la zona verde. Pulsa «📋 Copiar HTML» y pásamelo.'); return false; }
      this.esperando = 0;
      // seguirlo fotograma a fotograma y tirar al pasar por el centro
      const eje = flot.eje, pos = () => centro(flot.el.getBoundingClientRect())[eje];
      const meta = () => centro((diana.blanco || diana.verde).getBoundingClientRect())[eje];
      let antes = pos(), dAntes = meta() - antes; const t0 = performance.now();
      while (performance.now() - t0 < 6000) {
        await frame();
        if (!document.contains(flot.el)) return true;
        const ahora = pos(), v = ahora - antes, d = meta() - ahora; antes = ahora;
        // tira si el centro cae dentro del próximo medio paso (así se clava en vez de pasarse), o si se lo acaba de saltar
        const cruza = Math.sign(d) !== Math.sign(dAntes) && d !== 0; dAntes = d;
        if (v !== 0 && (Math.abs(d) <= Math.abs(v) * 0.5 || cruza)) {
          const boton = $$('button', raiz).find(b => !ajeno(b) && !b.disabled && visible(b)) || bt;
          boton.click(); otraAccion();
          log(`🎯 ¡Tiro! a ${Math.abs(d).toFixed(1)} px del centro ${diana.blanco ? 'blanco' : 'verde'}`);
          await pausa(1500, 2200);
          return true;
        }
      }
      return false;
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
        return pulsar(b, `🤿 Bajo a ${texto(b).split(/[·(\d]/)[0].trim()}`, [1800, 2600]);
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
    listo() { const c = lsGet('axd-tren', {}); return c.fecha === hoy() && c.n >= 3 && !$$('main button').some(x => !ajeno(x) && !x.disabled && /rebusc|chatarra/i.test(texto(x))); },
    async paso() {
      const b = $$('main button').find(x => !ajeno(x) && !x.disabled && visible(x) && /rebusc|chatarra/i.test(texto(x)));
      const c = lsGet('axd-tren', {});
      if (b && !(c.fecha === hoy() && c.n >= 3)) {
        lsPut('axd-tren', { fecha: hoy(), n: (c.fecha === hoy() ? c.n : 0) + 1 });
        return pulsar(b, `🚂 ${texto(b)}`, [1500, 2500]);
      }
      return pulsarSeguir();
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
    cerrada: () => /visita de hoy|abre otra vez mañana/i.test(textoMain()),
    apuntar() {
      const reg = this.region();
      if (reg) { const s = safarisHoy(); if (!s.hechas.includes(reg)) { s.hechas.push(reg); lsPut('axd-safaris', s); } }
    },
    listo() {
      if (!this.cerrada()) return false;
      this.apuntar();
      return true;
    },
    desde: 0, arrancado: false,
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
      if (this.arrancado) this.apuntar();                    // ha terminado
      const fin = $$('main button').find(b => !ajeno(b) && !b.closest('#ax-safari-auto') && !b.disabled && visible(b) && /se acab/i.test(texto(b)));
      if (fin) return pulsar(fin, `🌾 ${texto(fin)}`);
      const smart = p.querySelector('[data-ax="smart"]');
      if (smart && !smart.disabled && !this.arrancado) {
        this.arrancado = true;
        return pulsar(smart, `🌾 ${this.region() || 'Safari'}: Safari Auto en modo estrategia.`, [2000, 3000]);
      }
      return pulsarSeguir();
    },
  };
  // una región sin reserva (o que no deja entrar) no se vuelve a probar en una semana
  function sinReserva(g) { let sr = lsGet('axd-sin-reserva', {}); if (!sr || Array.isArray(sr)) sr = {}; sr[g] = Date.now(); lsPut('axd-sin-reserva', sr); }
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
      const m = t.match(/(\d+)\s*de\s*(\d+)\s*plantas hoy/i);
      return m ? +m[1] < +m[2] : true;
    } catch { return true; }
  }

  const DIARIAS = [QUIEN, POKEATHLON, MUELLE, CARRERAS, BUCEO, TREN, SAFARI, VIAJE, CANTERA, ALBUM, TRETA];

  /* ══════════ Ruta: jugar todas las diarias seguidas ══════════
   * Desde el menú se apuntan las diarias de «Para hoy» que aún no están hechas y que el script sabe jugar; se va a
   * cada una, se juega hasta que no queda nada que hacer y se pasa a la siguiente. Luego, los Safaris de las demás
   * regiones (se viaja a cada una y se vuelve a la tuya al final). Al acabar vuelve al menú con el resumen. Va en
   * sessionStorage: sobrevive a las recargas de esta pestaña y muere al cerrarla. */
  const SS_RUTA = 'axd-ruta';
  const ssGet = () => { try { return JSON.parse(sessionStorage.getItem(SS_RUTA) || 'null'); } catch { return null; } };
  const ssPut = r => { try { if (r) sessionStorage.setItem(SS_RUTA, JSON.stringify(r)); else sessionStorage.removeItem(SS_RUTA); } catch { /* nada */ } };
  // dirección → diaria que la juega
  const RUTAS = { '/siluetas': QUIEN, '/pokeathlon': POKEATHLON, '/pesca': MUELLE, '/carreras': CARRERAS, '/buceo': BUCEO, '/safari': SAFARI, '/cantera': CANTERA, '/album': ALBUM };
  // las que no salen en el menú (o no con su estado): Tren (Teselia) y Casa Treta (Hoenn)
  const EXTRA = { '/tren': TREN, '/casa': TRETA };
  // las que no sé jugar (se dicen y se saltan); Jessie y James, Solar y MissingNo no hacen falta
  const NO_SE = {};
  const ruta = () => location.pathname.replace(/\/+$/, '') || '/';
  const CERRADA = /🔒|vuelve mañana|por hoy (ya|se)|mañana (hay|pican|más|pican)|se acab[oó] el programa|cierra el puesto|visita de hoy|te espera mañana|se vino abajo/i;
  const POR_DIARIA_MS = 8 * 60 * 1000;          // por si una se atasca (el Safari es lo más largo)
  function leerMenu() {
    // Las diarias son enlaces del menú; las hechas van dentro del desplegable «hechos hoy» (y su pastilla lo dice)
    const out = [];
    for (const a of $$('main a[href]').filter(a => !ajeno(a))) {
      const href = (a.getAttribute('href') || '').replace(/[?#].*$/, '').replace(/\/+$/, '');
      if (!(RUTAS[href] || NO_SE[href]) || out.some(x => x.href === href)) continue;
      const estado = texto(a.querySelector('.pastilla'));
      const hecha = !!a.closest('details') || /hecho|parad|cerrad|mañana|tumbad/i.test(estado);
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
    if (ruta() !== '/menu') { ssPut({ preparar: true }); location.assign('/menu'); return; }
    const menu = leerMenu();
    const cola = menu.filter(d => !d.hecha && d.sabe).map(d => ({ href: d.href }));
    pintarMenu(['Mirando qué queda…']);
    const treta = await tretaPendiente();
    const tren = lsGet('axd-tren', {}), trenHecho = tren.fecha === hoy() && tren.n >= 3;
    // lo que hay que hacer en cada región además de su Safari
    const extras = g => [...(g === 'Teselia' && !trenHecho ? [{ href: '/tren', region: g }] : []), ...(g === 'Hoenn' && treta ? [{ href: '/casa', region: g }] : [])];
    const log0 = menu.filter(d => !d.hecha && !d.sabe).map(d => `⏭ ${d.nombre}: ${NO_SE[d.href]}, te la dejo.`);
    // Safaris de las demás regiones (y el Tren, que está en Teselia): se viaja y al final se vuelve
    const ev = enlaceViaje(), casa = apuntarSafariCasa(menu);
    const s = safarisHoy();
    if (casa) cola.push(...extras(casa));
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
    if (!cola.length) {
      ssPut(null);
      pintarMenu([...log0, '✅ Las que sé jugar ya están hechas hoy.']);
      return;
    }
    const r = { cola, hechas: [], log: log0, actual: null, casa };
    ssPut(r);
    pintarMenu([...log0, `▶ Voy: ${cola.map(nombreDe).join(' → ')}.`]);
    siguiente(r);
  }
  const nombreDe = x => x.viaje ? `🧭 ${x.viaje}` : `${(RUTAS[x.href] || EXTRA[x.href]).nombre}${x.region ? ' ' + x.region : ''}`;
  async function siguiente(r) {
    limpiarCola(r);
    const x = r.cola.shift();
    if (x && x.viaje && !x.vuelta) r.fuera = true;
    r.actual = x ? { ...x, desde: Date.now() } : null;
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
    const listo = d.listo ? d.listo() : false;
    if (hizo && !listo) { quietoDesde = 0; return; }
    if (!quietoDesde) quietoDesde = Date.now();
    const cerrada = listo || CERRADA.test(textoMain());
    const quieto = Date.now() - quietoDesde;
    const agotada = Date.now() - r.actual.desde > POR_DIARIA_MS;
    if ((cerrada && quieto > 2500) || quieto > 20000 || agotada) {
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
    p.querySelector('.axd-todas').textContent = r ? '⏹ Parar' : '▶ Jugar todas las diarias';
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
      if (ssGet()) { const r = ssGet(); ssPut(null); pintarMenu([`⏹ Parado.${r.fuera ? ` Ojo: estás fuera de ${r.casa}.` : ''}`]); } else iniciarRuta();
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
    montarMenu();
    const r = ssGet();
    if (!r || ocupado) return;
    if (r.preparar) { ocupado = true; ssPut(null); iniciarRuta().finally(() => { ocupado = false; }); return; }
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
  }

  // ¿toca jugar aquí? (modo solo, o esta página es la parada actual de la ruta; en el menú manda la ruta)
  function jugando() {
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
    if (!d.sinPanel || enRuta) montarPanel(cab && (cab.closest('.tarjeta') || cab), d.nombre);
    if (!enRuta && (d.soloRuta || !auto)) return;
    ocupado = true;
    try {
      const hizo = await d.paso();
      if (hizo) parado = false;
      else if (!parado && !enRuta) { parado = true; log('🏁 Hecho: nada más que hacer aquí por ahora.'); }
      if (enRuta) rutaEnDiaria(d, hizo);
    } catch (e) { if (e !== PARADO) console.warn('[diarias]', e); }
    finally { ocupado = false; }
  }

  esperarHidratacion().then(() => {
    setInterval(tick, 800);
    try { new MutationObserver(() => tick()).observe(document.body, { childList: true, subtree: true }); } catch { /* nada */ }
    tick();
  });
  window.__axDiarias = { NOMBRES, DIARIAS, tick, pGanar, mejorReparto, leerMenu, iniciarRuta, CANTERA, propReact };
})();
