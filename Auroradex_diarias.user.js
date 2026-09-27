// ==UserScript==
// @name         Aurora Dex · Diarias (solas)
// @namespace    auroradex-diarias
// @version      1.2.0
// @description  Juega solo las diarias. «¿Quién es ese Pokémon?»: lee el número de la Pokédex de la silueta, pulsa el nombre correcto y tira la ruleta con cada acierto. Cúpula Pokéathlon: reparte tus Pokémon entre las tres pruebas probando los 120 repartos y quedándose con el que más energía da de media (con el ±20% de suerte), y compite. El Muelle: echa el flotador y tira justo cuando pasa por el centro de la zona. Panel con lo que va haciendo y botón para parar.
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
  const VERSION = '1.2.0';
  const PANEL_ID = 'axd-panel';
  const LS_AUTO = 'axd-auto';
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const pausa = (a, b) => sleep(a + Math.random() * (b - a));
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
    p.querySelector('.axd-estado').textContent = auto ? '🤖 Jugando solo' : '⏸ En pausa';
    p.querySelector('.axd-boton').textContent = auto ? '⏸ Parar' : '▶ Jugar solo';
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
      <button type="button" class="axd-copiar" title="Copia el HTML de esta pantalla para pasármelo" style="background:#2E3B57;color:#fff;border-radius:12px;padding:4px 8px;font-weight:800">📋 Copiar HTML</button></div>
      <pre class="axd-log" style="white-space:pre-wrap;margin:6px 0 0;font:11px/1.4 ui-monospace,monospace;color:#9fb0c8;max-height:140px;overflow:auto"></pre>
      <p style="margin-top:4px;font-size:10px;color:#6b7a93">Diarias v${VERSION}</p>`;
    p.querySelector('.axd-boton').addEventListener('click', () => { auto = !auto; lsPut(LS_AUTO, auto); log(auto ? '▶ Juego solo.' : '⏸ En pausa.'); });
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
  const hoy = () => new Date().toISOString().slice(0, 10);
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

  const DIARIAS = [QUIEN, POKEATHLON, MUELLE];

  /* ── Bucle ── */
  let ocupado = false, parado = false;
  async function tick() {
    if (ocupado) return;
    const d = DIARIAS.find(x => x.detecta());
    if (!d) return;
    const cab = d.detecta();
    montarPanel(cab && (cab.closest('.tarjeta') || cab), d.nombre);
    if (!auto) return;
    ocupado = true;
    try {
      const hizo = await d.paso();
      if (hizo) parado = false;
      else if (!parado) { parado = true; log('🏁 Hecho: nada más que hacer aquí por ahora.'); }
    } catch (e) { console.warn('[diarias]', e); }
    finally { ocupado = false; }
  }

  esperarHidratacion().then(() => {
    setInterval(tick, 800);
    try { new MutationObserver(() => tick()).observe(document.body, { childList: true, subtree: true }); } catch { /* nada */ }
    tick();
  });
  window.__axDiarias = { NOMBRES, DIARIAS, tick, pGanar, mejorReparto };
})();
