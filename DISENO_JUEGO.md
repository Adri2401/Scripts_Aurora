# Diseño del juego: MMO Pokémon de navegador con mapa y energía

> Documento vivo de ideas. Todo lo que aparece aquí es una propuesta: los números son un punto de partida para ajustarlos probando, no reglas cerradas.
> Nombre provisional: **Proyecto Región**.

---

## 0. Nota sobre la parte legal

- **Criterio:** gratis, sin compras y en beta cerrada.
- **Por qué PokeMMO no tiene problemas:** no aloja ni reparte nada de Nintendo. Cada jugador pone su propia ROM y el cliente la lee. Que no cobre no es lo que lo salva: de hecho vende cosméticos.
- **Riesgos:** Uranium y Prism también eran gratis y los tumbaron igual. El riesgo sube con la visibilidad: vídeos virales, streamers o el nombre "Pokémon" en el dominio o en el título.
- **Cómo reducirlo:**
  - Registro con invitación.
  - Nada de "Pokémon" en el dominio ni en el título.
  - No hacer publicidad.
  - Tener los sprites detrás de la sesión iniciada, sin que se puedan enlazar desde fuera.
  - Dejar la puerta abierta a cambiar el arte en el futuro.

---

## 1. Pilares

1. **El mapa es el juego.** La región entera en 2D, compartida con todo el servidor. Moverse cuesta energía, que se recarga con el tiempo real. Dónde estás importa.
2. **Clásico de corazón.** Combates por turnos con las mecánicas de los juegos principales: tipos, PS, estadísticas, IVs, EVs, naturalezas, habilidades, objetos y clima.
3. **Mundo vivo y social.** Economía entre jugadores, trabajos, gimnasios que conquistan los jugadores, incursiones y jefes legendarios de todo el servidor.
4. **Amigable pero largo.** Sin grindeo absurdo ni castigos por desconectar. Aun así, cada región da para meses gracias a mucho post-game.
5. **Lo raro es raro de verdad.** Legendarios únicos (solo existe uno en todo el servidor) y shinies difíciles. Tener uno cuenta una historia.
6. **Tu colega.** Un Pokémon elegido que te acompaña, crece contigo y te ayuda.

---

## 2. Bucle principal

```
Entras → recoges lo del Pokéwalker, los trabajos y el mercado
      → gastas energía moviéndote por el mapa
      → encuentros, capturas, combates, objetos, descubrir casillas
      → te quedas sin energía
      → sigues sin energía: equipo, crianza, PvP, mercado, trabajos, gimnasio
      → mandas a alguien de paseo con el Pokéwalker y pones trabajos en marcha
      → sales, y vuelves cuando la energía esté llena (te avisamos)
```

Las sesiones pueden ser cortas (5 minutos para recoger y relanzar) o largas (una hora de PvP, crianza y mercado). Las dos cosas tienen que ser útiles.

---

## 3. Mapa, movimiento y energía

### 3.1 Energía

| Parámetro | Propuesta |
|---|---|
| Energía máxima | 100 (sube a 150 con el progreso) |
| Recarga | 1 punto cada 3 minutos, así que se llena en unas 5 horas |
| Aviso | Notificación del navegador cuando está llena |
| Primer día | Energía ×3 durante las primeras 24 horas para que la primera sesión enganche |
| Cálculo | Siempre en el servidor, con `energía + (ahora − última_actualización) / intervalo` hasta el máximo |

Coste por tipo de casilla:

| Casilla | Coste | Notas |
|---|---|---|
| Ciudad o pueblo | **0** | Moverse por las ciudades es gratis, porque es donde está lo social |
| Camino | 1 | |
| Hierba alta | 1 | Posibilidad de encuentro en cada paso |
| Agua (Surf) | 2 | |
| Cueva | 2 | Encuentros y objetos |
| Montaña o nieve | 3 | Zonas raras |
| Vuelo (MO) | 10 + distancia/5 | Solo a ciudades ya visitadas. Es el viaje rápido que compensa gastar |

- **Combatir no cuesta energía.** Solo cuesta moverse.
- **Repelente:** no hay encuentros, pero la energía se gasta igual.
- **Bicicleta:** mejora de la región que baja un 25 % el coste en caminos.
- **Objetos que recargan energía** (Refresco, Limonada, Agua Fresca):
  - Se consiguen jugando, no comprando.
  - Se pueden acumular con un tope (por ejemplo, 3 al día como máximo).
  - Así no rompen el ritmo.

### 3.2 El mapa

- Región completa hecha en Tiled, con movimiento por casillas como en los juegos clásicos.
- **Niebla de guerra:** el mapa se descubre casilla a casilla, hay un % de exploración por ruta y dan premios por completar zonas.
- **Ciclo día/noche real** (mañana, día, tarde, noche) y **días de la semana** como en Oro/Plata. Algunos Pokémon y NPC solo salen en ciertos momentos.
- **Estaciones del año** como en Blanco/Negro: rotan cada mes real y cambian el aspecto de las rutas, lo que aparece y algunos caminos (el hielo en invierno abre pasos).
- **Clima por zona** decidido por el servidor (lluvia, niebla, tormenta de arena, nieve, sol). Afecta a los encuentros, como en GO, y a los combates.
- **Objetos ocultos y secretos** en casillas concretas, como las Grutas Ocultas de BW o el zahorí.
- **Otros jugadores visibles** en el mapa, con el icono de su cara (ver 4.1).
- Los **eventos aparecen en un sitio concreto**, así que dónde estás y cuánta energía guardas se convierte en estrategia.

### 3.3 Encuentros

- Tabla de encuentros por ruta, franja horaria, estación y clima.
- **Brotes masivos** (Escarlata/Púrpura): durante unas horas, una especie sale muchísimo en una ruta.
- **Pokémon alfa** (Leyendas: Arceus): más grandes, más fuertes y con un movimiento huevo.
- **Rastro DexNav** (Rubí Omega/Zafiro Alfa): con el colega o un objeto se puede buscar una especie concreta de la ruta, con mejores IVs o su movimiento huevo.

---

## 4. Jugador, skin y colega

### 4.1 Avatar = la cara de tu skin

- Cada jugador tiene una **skin** de cuerpo entero para su perfil, los combates y la carta de entrenador.
- En el mapa, en el chat, en las clasificaciones y en los gimnasios se ve **el icono de la cara de esa skin**, estilo cabeza de Minecraft. Se lee bien en pequeño y se reconoce al instante.
- Las skins se desbloquean con logros, medallas, temporadas, títulos de líder de gimnasio, participación en legendarios y rangos de PvP.
- Todo son cosméticos, ninguna skin da ventaja.
- Más adelante: un editor de píxeles con limitaciones para hacerte tu propia cara.

### 4.2 Tu colega

Eliges **un Pokémon de tu equipo como colega**. Mezcla el compañero de GO, el Pokémon que te sigue de HeartGold/SoulSilver y Poké Recreo.

- **Te sigue por el mapa**, y los demás jugadores lo ven detrás de tu icono.
- **Nivel de amistad por Pokémon:** se guarda aunque lo cambies y sube caminando juntos, combatiendo, dándole bayas y jugando con él.

  | Nivel | Qué desbloquea |
  |---|---|
  | Amigo | Encuentra objetos del suelo a tu paso |
  | Buen amigo | Avisa de hierba que se mueve (encuentro especial cerca) |
  | Gran amigo | Aguanta con 1 PS un golpe mortal (a veces, como en Poké Recreo) y +EXP |
  | Mejor amigo | Cada X casillas, una sale gratis. Mejora el rastro DexNav. Cinta y título "Mejor Colega". Aspecto especial en el mapa |

- **Reacciones:** comenta cosas del mapa ("Parece que huele algo aquí…"), se pone contento en su tipo de terreno y se asusta en la oscuridad de las cuevas (salvo los de tipo Fantasma o Siniestro, que están encantados).
- **El inicial** es tu primer colega por defecto, pero puedes cambiar cuando quieras.

---

## 5. Pokéwalker falso ("Paseador")

Es la actividad cuando no tienes energía o estás desconectado. Inspirado en el Pokéwalker de HeartGold/SoulSilver.

- Mandas **1 Pokémon de la caja** a una **ruta de paseo**. Las rutas de paseo se desbloquean al avanzar y tienen su propia lista de Pokémon y objetos.
- Mientras está fuera, genera **pasos con el tiempo real** (por ejemplo, 1 paso cada 10 s). Hay un tope de 24 h para que no haga falta entrar a cada rato.
- Los pasos se convierten en **vatios**, la moneda del paseador, que se gastan en dos minijuegos:
  - **Poké Radar:** encuentras un Pokémon de esa ruta y tienes 3 intentos de captura sin combate.
  - **Zahorí:** buscas un objeto entre casillas escondidas.
- Al volver, el Pokémon trae **EXP pequeña, amistad** y a veces **un objeto que ha encontrado**.
- Hay **Pokémon exclusivos del paseador**, igual que en el original. Algunos tienen movimientos especiales.
- **Huevos:** un huevo que va de paseo avanza también con esos pasos.
- **Agitar el paseador:** si entras mientras está de paseo, puedes "agitarlo" una vez cada X horas para ganar un extra de pasos. Es un pequeño motivo para entrar sin obligarte.
- Empiezas con 1 hueco y se desbloquean más (hasta 3) con el progreso.
- **Opcional, más adelante:** importar pasos reales del móvil (Google Fit o Apple Salud) con un tope diario. Los pasos reales darían un plus, pero no son necesarios.

---

## 6. Combate

### 6.1 Sistema clásico

- Por turnos, con la fórmula de daño de los juegos principales, usando como referencia las mecánicas de la 5.ª a la 9.ª generación.
- 6 Pokémon por equipo, 4 movimientos, PP, prioridad, velocidad, críticos, cambios de estadística, estados, clima, campos, trampas de entrada y objetos equipados.
- IVs (0-31), EVs, naturalezas, habilidades (incluidas las ocultas), movimientos huevo, tutores y MT.
- Todo el combate se calcula en el servidor. El cliente solo envía la acción elegida.

### 6.2 Formatos

| Formato | Dónde |
|---|---|
| Individual 1 contra 1 | Historia, entrenadores, gimnasios, PvP |
| Dobles | PvP de dobles, algunos gimnasios, incursiones |
| Horda (1 contra 5) | Encuentros especiales en hierba (XY) |
| Llamada SOS | Algunos salvajes llaman aliados, lo que sirve para cadenas (Sol/Luna) |
| Jefe (1 contra jefe) | Incursiones y jefes legendarios |

### 6.3 Comodidad

- Animaciones rápidas y velocidad de combate ×1, ×2 o ×4.
- Botón de "huir" siempre útil contra salvajes.
- EXP compartida que se puede activar y desactivar.
- **Nivel 50 en competitivo:** en PvP y en el trono de gimnasio todos se ajustan a nivel 50, así que no hace falta subir a 100 para competir.

---

## 7. Captura, crianza y Pokédex

- **Captura** clásica con fórmula de ratio: PS bajos y estados ayudan.
- **Poké Balls especiales** (Ocaso, Veloz, Acopio, Buceo…) que se fabrican con el trabajo de **Artesano** (ver 10) usando bonguris.
- **Guardería y crianza:**
  - Huevos que se abren con las **casillas recorridas** o con los pasos del paseador.
  - Herencia de IVs, de naturaleza (con Piedra Eterna) y de movimientos huevo.
  - **Método Masuda:** mejora la probabilidad de shiny si los padres vienen de jugadores de distintos idiomas o países. En la beta se puede sustituir por "padres de distinto dueño original".
- **Pokédex con investigación** al estilo Leyendas: Arceus:
  - Cada especie tiene tareas ("captúralo de noche", "véncelo con un movimiento de tipo Agua", "velo usar X").
  - Completarlas sube el nivel de investigación de esa especie, que da premios y algo más de probabilidad de shiny en ella.
- **Investigaciones de campo y especiales** al estilo GO:
  - Misiones diarias y semanales.
  - Cadenas de misiones de historia que dan Pokémon o skins especiales.

---

## 8. Shinies: difíciles, pero con métodos que recompensan el esfuerzo

La probabilidad base es alta a propósito. La forma de mejorarla es echarle horas a métodos concretos, no tener suerte a secas.

| Método | Probabilidad |
|---|---|
| Base | 1/8192 |
| Amuleto Iris (se gana en el post-game completando la Pokédex regional) | 1/4096 |
| Cadena de Poké Radar o DexNav de más de 40 | ~1/1024 |
| Método Masuda + Amuleto Iris | ~1/1365 |
| Brote masivo con más de 60 derrotados + amuleto | ~1/1024 |
| Investigación nivel máximo de la especie | Una tirada extra por encuentro |
| **Tope absoluto al combinar métodos** | **1/512** (nunca menos) |

- Los shinies **no se pueden comprar** en tiendas NPC.
- En el mercado entre jugadores sí se pueden vender. Llevan una marca permanente de su entrenador original y se muestra si son "capturados" o "criados".
- **Efecto especial y aviso en el chat del servidor** cuando alguien consigue uno ("Adri ha encontrado un Gible shiny en la Ruta 14"). Genera envidia sana y ganas de ir a esa ruta.
- **Legendarios:** siempre bloqueados como no shiny. La excepción es el sorteo (ver 12): el legendario sorteado tiene un 1 % de salir shiny. Sería una leyenda del servidor.

---

## 9. Economía

No hay dinero real, así que no hay moneda premium y la economía puede ser limpia.

### 9.1 Monedas

| Moneda | Cómo se gana | Para qué | ¿Intercambiable? |
|---|---|---|---|
| **Pokéyenes (₽)** | Combates, ventas a NPC, trabajos, gimnasios | Todo lo básico, mercado entre jugadores | Sí |
| **Vatios** | Pokéwalker | Minijuegos del paseador y una tienda propia | No |
| **Puntos de Batalla (PB)** | Frente de Batalla, PvP | Objetos competitivos (mentas, cápsulas de habilidad, chapas) | No |
| **Fichas de Incursión** | Incursiones | Objetos de crianza y entrenamiento | No |
| **Reliquias** | Jefes legendarios | Cosméticos únicos y títulos | No |

### 9.2 Entrada y salida de dinero (contra la inflación)

Entradas:
- Premios de combate.
- Venta de objetos a NPC.
- Encargos de trabajos.
- Sueldo de líder de gimnasio.

Salidas:
- **Comisión del 5 % en el mercado** entre jugadores.
- Cuotas para retar gimnasios de jugadores.
- Vuelo.
- Cosméticos de tienda.
- Mejoras de casa o base secreta.
- Guardería.
- Reparación y mejora de herramientas de trabajo.
- Entradas a la Zona Safari o al Frente de Batalla.

Se revisan las cifras cada semana: cuánto dinero entra, cuánto sale y el precio medio de las cosas clave.

### 9.3 Mercado

- **Casa de subastas o GTS:** pones un Pokémon u objeto con precio fijo o en subasta durante 24 o 48 h.
- **Intercambio directo** entre jugadores, que tienen que estar en la misma ciudad (esto hace que la gente quede en el mapa).
- **Tiendas de jugadores:** puestos en la plaza de una ciudad que vas llenando y que venden aunque no estés.
- **Anti multicuenta:**
  - Las cuentas nuevas no pueden comerciar hasta cumplir X días o tener Y medallas.
  - Hay registro de todos los movimientos.
  - Límite diario de ₽ enviados.
- **Objetos ligados a la cuenta:** las reliquias, el Amuleto Iris y los premios de temporada no se pueden vender.

---

## 10. Trabajos (profesiones)

Cada jugador puede tener **2 trabajos activos** y cambiarlos pagando un pequeño coste. Cada trabajo tiene un **nivel de 1 a 50** y un árbol de especialización. Los trabajos dependen unos de otros para que la economía tenga sentido: el Artesano necesita al Granjero y al Minero, y el Cocinero necesita al Granjero y al Pescador.

| Trabajo | Qué hace | Produce | Inspiración |
|---|---|---|---|
| **Granjero de bayas** | Planta, riega y cosecha en parcelas | Bayas (curación, crianza, EVs, cocina) | Oro/Plata, DPPt |
| **Minero** | Pica en el Subsuelo o en las minas | Fósiles, piedras evolutivas, esferas, gemas | Subsuelo de DPPt |
| **Pescador** | Minijuego de pesca con cañas mejorables | Pokémon acuáticos raros, objetos del agua | Clásico |
| **Artesano** | Fabrica objetos | Poké Balls de bonguri, objetos equipables | Kurt (Oro/Plata), Leyendas: Arceus |
| **Cocinero** | Hace sándwiches y curris | Comida que da bonus temporales (más un tipo, más shiny en brotes, más EXP) | Escarlata/Púrpura, Espada/Escudo |
| **Criador** | Mejora la guardería propia | Huevos más rápidos, mejor herencia, vende huevos | |
| **Explorador o Ranger** | Encargos de exploración y rescate | Mapas del tesoro, rutas de paseo nuevas, Pokémon atrapados | Ranger, Mundo Misterioso |
| **Estilista o Coordinador** | Concursos y aspecto | Cintas, peinados de Furfrou, accesorios | Concursos, XY |
| **Mercader** | Menos comisión y más puestos en el mercado | Beneficios del comercio | |

**Tus Pokémon trabajan contigo** (Isla Poké de Sol/Luna, Palworld):
- Cada trabajo tiene **huecos para Pokémon ayudantes**.
- El tipo y la habilidad importan: un Pokémon Planta riega mejor, uno Tierra pica mejor, uno con Recogida encuentra más.
- Las tareas llevan **tiempo real** (2 h, 8 h, 24 h) y no gastan energía. Es otra cosa que "poner en marcha y volver".
- **Encargos de NPC y del tablón de jugadores:** los jugadores pueden publicar encargos ("necesito 20 Bayas Zidra, pago 5.000 ₽") y otro jugador los cumple.

---

## 11. Gimnasios reclamables

Hay **dos capas**, para que la historia nunca se bloquee y a la vez exista la competición.

### 11.1 Capa de historia (NPC)
- El líder original, un NPC, siempre está disponible para conseguir la medalla. Esto no cambia nunca.

### 11.2 Trono del gimnasio (jugadores)
- Tras ganar la medalla, puedes **retar al líder jugador actual**. Si nadie tiene el trono, te enfrentas a una versión mejorada del NPC.
- **Si ganas, el gimnasio es tuyo:**
  - Tu icono aparece en la puerta.
  - Tu nombre sale en el cartel.
  - Te llevas la skin y el título de "Líder de Ciudad X".
- **Reglas del trono:**
  - **Monotipo:** el equipo defensor tiene que ser del tipo del gimnasio. Los retadores pueden llevar lo que quieran.
  - Todos a nivel 50.
  - El líder elige un **equipo defensor de 6** y una **estrategia de IA** (agresiva, defensiva o de apoyo). Cuando no está conectado, lo controla la IA.
  - Si el líder está conectado, puede **aceptar el combate en directo**. Ganar un combate en directo cuenta el doble para su racha.
- **Lo que gana el líder:**
  - Un sueldo diario.
  - Un % de la cuota que pagan los retadores.
  - Puntos de racha.
  - Cosméticos por defensas acumuladas (10, 50, 100…).
- **Límites:**
  - Solo 1 trono por cuenta a la vez.
  - Si el líder no entra en 7 días, el trono queda vacante.
  - El mismo retador solo puede intentarlo 3 veces al día contra el mismo líder.
  - Al perder el trono, el antiguo líder tiene 24 h de "revancha preferente".
- **Salón de líderes:** registro histórico de quién tuvo cada gimnasio y cuánto tiempo.
- **Alto Mando y Campeón de jugadores:** en el post-game, los 4 primeros y el primero de la temporada de PvP ocupan los asientos del Alto Mando y del Campeón de esa región hasta la siguiente temporada. Igual que en los gimnasios, se les puede retar.

---

## 12. Legendarios: únicos y jefes de todo el servidor

**Regla de oro:** cada legendario existe **una sola vez en todo el servidor** y **cada cuenta puede tener como máximo 1 legendario**.

### 12.1 El evento

1. **Presagios** (1 o 2 días antes): cambia el clima de una zona, llegan rumores de NPC y aparecen Pokémon raros huyendo. Los jugadores empiezan a moverse hacia allí, y la energía guardada vale oro.
2. **Aparición:** el legendario aparece en una casilla concreta del mapa. Para participar **tienes que llegar hasta allí**.
3. **Combate de jefe global:**
   - **PS compartidos por todo el servidor** (por ejemplo, 50 millones).
   - Cada jugador tiene X intentos al día. Cada intento es un combate por turnos de 10 turnos, 1 contra jefe, con tu equipo.
   - El daño que hagas se suma al total.
   - **Fases:** al 75 %, 50 % y 25 % de PS cambia de mecánica (escudos al estilo Dinamax o Tera, cambios de clima, invoca esbirros). Los esbirros son **incursiones** que otros jugadores tienen que limpiar para quitarle el escudo.
   - **Ventana de tiempo:** 72 h. Si el servidor no lo derrota, **huye** y vuelve la temporada siguiente. Hay riesgo de perderlo.
4. **Sorteo:**
   - **Participan:** cuentas sin legendario que hayan hecho un mínimo de daño o de participación, como limpiar esbirros o curar a otros. No hace falta estar arriba del todo.
   - **Papeletas:** crecen con la **raíz cuadrada** de la contribución. Los que más hacen tienen más papeletas, pero un jugador normal sigue teniendo opciones reales.
   - **El ganador** recibe el legendario con IVs aleatorios y un 1 % de ser shiny, más la skin y el título "Portador de X".
   - **Los demás** reciben reliquias según su contribución, una medalla del evento y aparecen en el mural del legendario.
   - El sorteo se hace **en directo** con una animación y el anuncio en todo el servidor.

### 12.2 Reglas del legendario único

- **Solo se puede intercambiar a una cuenta sin legendario.** Tiene un tiempo de espera de 30 días entre intercambios y queda registrado públicamente.
- **Si lo liberas, vuelve a la naturaleza** y se lanza un nuevo evento para conseguirlo.
- **Prohibido en el PvP ranked normal** (como los restringidos del VGC). Tiene su propio formato ("Copa Leyenda") y se puede usar en el Frente de Batalla y en las incursiones.
- **Inactividad (a decidir):** si el dueño pasa 6 meses sin entrar, el legendario "se inquieta" y se vuelve a sortear. Así no se pierden legendarios en cuentas muertas.

### 12.3 Sublegendarios (a decidir)

Propuesta: los **sublegendarios** (tríos de pájaros, perros, golems…) **no son únicos**, pero solo salen en **incursiones de 6★** muy difíciles, con muy baja probabilidad de captura y un límite de 1 de cada especie por cuenta. Así hay un escalón intermedio entre lo normal y lo único.

---

## 13. Incursiones

- **Guaridas en el mapa** (Espada/Escudo, Escarlata/Púrpura): puntos fijos que cambian de jefe cada día.
- **Niveles de 1★ a 6★.** Las de 5★ y 6★ necesitan grupo.
- **4 jugadores** contra el jefe, por turnos. Los turnos se resuelven a la vez con un límite de 30 s para elegir.
- **Mecánicas del jefe:** escudos, anular cambios de estadística, turnos dobles…
- **Pase de incursión:** se consigue 1 al día gratis y se pueden guardar hasta 3. No se compran.
- **Buscar grupo:** puedes publicar una incursión y se unen jugadores que estén a X casillas. Así la cercanía importa.
- **Recompensas:** captura del jefe (con IVs mínimos garantizados según las estrellas), fichas de incursión, objetos de crianza, caramelos de EXP y piezas de skin.

---

## 14. PvP

- **Ranked por temporadas** de 2 meses, con Elo o Glicko y ligas (Poké Ball → Súper → Ultra → Master).
- **Formatos:**
  - Individual: eliges 3 de 6 a ciegas.
  - Dobles: eliges 4 de 6, estilo VGC.
  - Copa temática que rota cada mes (solo NFE, solo un tipo, solo Pokémon de la región…).
- Todos a **nivel 50**, con **reloj por turno**, tiempo total por jugador y reconexión.
- **Casual:** sin ranking, contra amigos o al azar.
- **PvP asíncrono ("fantasmas"):** combates contra el equipo guardado de otro jugador controlado por la IA, para cuando no hay nadie conectado.
- **Torneos semanales automáticos** con cuadro eliminatorio y premios en PB y cosméticos.
- **Recompensas de temporada:** skins, títulos, marcos para el icono y los asientos de Alto Mando y Campeón (ver 11.2).
- **Espectadores:** poder ver los combates de los primeros de la clasificación en directo.

---

## 15. Progresión por región y post-game

**Objetivo:** la historia de una región dura unas 2-4 semanas jugando normal, y el post-game de esa región da **meses**.

### 15.1 Historia
- 8 gimnasios, equipo villano con su trama, Liga y Campeón.
- Topes de nivel suaves por medalla: el Pokémon no obedece por encima del tope, como en los clásicos, lo que evita pasarse de nivel sin necesidad de bloquear.

### 15.2 Post-game (por región)

| Contenido | Descripción | Inspiración |
|---|---|---|
| **Episodio post-Liga** | Una segunda historia en una zona nueva de la región | Islas Sete, Episodio Delta |
| **Revanchas** | Los líderes de gimnasio y la Liga con equipos de nivel alto, cada semana | Pokégear, Rubí Omega/Zafiro Alfa |
| **Frente de Batalla** | Varias instalaciones con reglas propias (Torre, Fábrica de alquiler, Pirámide…) | Esmeralda, Platino |
| **Torneo Mundial** | Luchar contra los líderes de todas las regiones desbloqueadas | Blanco 2/Negro 2 |
| **Pokédex regional completa** | Da el Amuleto Iris, el diploma y una skin | Clásico |
| **Investigación al máximo** | Completar todas las tareas de todas las especies | Leyendas: Arceus |
| **Zona Safari** | Zonas que se pueden configurar y Pokémon de otras regiones | HeartGold/SoulSilver |
| **Safari Amistoso** | Cada jugador tiene un safari con 3 especies de 1 tipo. Los amigos pueden entrar | XY |
| **Mazmorra misteriosa** | Mazmorras aleatorias con coste de energía propio | Mundo Misterioso |
| **Subsuelo** | Minería, bases secretas y captura de banderas entre jugadores | Diamante/Perla |
| **Concursos y Pokéathlon** | Otra progresión distinta al combate | RSE, DPPt, HeartGold/SoulSilver |
| **Tronos de gimnasio y Alto Mando** | Ver sección 11 | |
| **Jefes legendarios** | Ver sección 12 | |
| **Caza de shinies** | Ver sección 8 | |
| **Logros y medallas de entrenador** | Cientos de logros con recompensa cosmética | |

### 15.3 Varias regiones
- Al ser Campeón de una región se desbloquea el barco o el vuelo a la siguiente. Tus Pokémon viajan contigo.
- Cada región tiene **sus legendarios, sus gimnasios reclamables y su post-game**, así que las regiones antiguas siguen vivas.
- **Orden de salida propuesto:** Kanto → Johto → Hoenn… La primera región sale sola en la beta.

---

## 16. Eventos y temporadas

- **Días de la Comunidad** (GO): una tarde al mes, una especie sale muchísimo, con más probabilidad de shiny y un movimiento exclusivo.
- **Horas de brote:** un día por semana a una hora fija, con más encuentros o más caramelos.
- **Eventos de temporada** (Halloween, Navidad…): cosméticos y Pokémon con disfraz.
- **Temporadas de 2 meses:** reinicio de la clasificación de PvP, copas nuevas y el pase de temporada gratis con cosméticos por jugar.

---

## 17. Sistemas sacados de cada juego (resumen)

| Juego | Sistema | Cómo se usa aquí |
|---|---|---|
| Rojo/Azul, clásicos | Combate por turnos, MO, casillas | Base de todo |
| Oro/Plata | Día/noche y días de la semana, bonguris, revanchas | Mapa, Artesano, post-game |
| HeartGold/SoulSilver | Pokéwalker, Pokémon que te sigue, Pokéathlon, Safari | Paseador, colega, post-game |
| Rubí/Zafiro/Esmeralda | Frente de Batalla, bases secretas, concursos | Post-game |
| Diamante/Perla/Platino | Subsuelo, Poké Radar | Minero, shinies |
| Blanco/Negro | Estaciones, Grutas Ocultas, Torneo Mundial | Mapa, post-game |
| XY | Poké Recreo, hordas, Safari Amistoso | Colega, combate, post-game |
| Rubí Omega/Zafiro Alfa | DexNav | Encuentros, shinies |
| Sol/Luna | Llamadas SOS, Isla Poké | Combate, trabajos con Pokémon |
| Espada/Escudo | Guaridas de incursión, curris | Incursiones, Cocinero |
| Leyendas: Arceus | Investigación de Pokédex, alfas, fabricar objetos | Pokédex, encuentros, Artesano |
| Escarlata/Púrpura | Brotes masivos, sándwiches, Teraincursiones | Encuentros, Cocinero, incursiones |
| Pokémon GO | Compañero, investigaciones, Días de la Comunidad, clima, incursiones, huevos por distancia | Colega, misiones, eventos |
| Mundo Misterioso | Mazmorras aleatorias, rescates | Post-game, Explorador |
| PokeMMO | Mercado entre jugadores, economía de servidor | Economía |

---

## 18. Amigable para el jugador

- **Nada de "o entras o pierdes":**
  - Las rachas diarias perdonan (puedes fallar 1 día a la semana sin perderla).
  - La energía nunca se tira: al llenarse, el aviso te llama, pero no hay castigo.
- **Comodidad:**
  - Acceso al PC desde cualquier Centro Pokémon.
  - Cambiar naturaleza con mentas y habilidad con cápsulas, que se ganan jugando.
  - Entrenamiento extremo en el post-game.
  - Olvidar y recordar movimientos gratis.
  - Tabla de tipos visible en combate (opcional).
- **Todo se consigue jugando.** No se vende nada, ni energía, ni pases, ni suerte.
- **Sesiones cortas útiles:** en 5 minutos puedes recoger el paseador, relanzar trabajos, gastar la energía y cobrar el mercado.
- **Ayuda a los nuevos:**
  - Tutor de dudas entre jugadores, con premio para el veterano que ayuda.
  - Zona inicial sin PvP.
  - Energía extra el primer día.

---

## 19. Parte técnica (resumen)

- **Cliente:**
  - Phaser 3 (o PixiJS) para el mapa y los combates.
  - Mapas de Tiled en JSON.
  - Interfaz en HTML y CSS por encima.
- **Servidor:** Node.js con TypeScript y WebSockets para la posición de otros jugadores, las incursiones y el PvP en directo.
- **Datos:** PostgreSQL para jugadores, Pokémon y el mercado. Redis para la presencia en el mapa, las colas y los temporizadores.
- **Datos de Pokémon:** estadísticas, movimientos y tipos desde PokeAPI o Showdown, importados a la base de datos propia. **El motor de combate de Pokémon Showdown** (MIT) se puede usar o adaptar para no reescribir todas las mecánicas.
- **El servidor manda:**
  - La energía, el movimiento, los encuentros, las capturas, los combates y el sorteo se calculan en el servidor.
  - El sorteo tiene semilla pública para que se pueda comprobar que es justo.
- **Anti bots:**
  - Límite de acciones por segundo.
  - Detección de patrones de movimiento perfectos.
  - Registro de cuentas por invitación en la beta.

---

## 20. Hoja de ruta

| Fase | Contenido | Objetivo |
|---|---|---|
| **0: Prototipo** | Una zona (pueblo, 2 rutas, cueva), movimiento por casillas, energía en el servidor, encuentros, combate salvaje básico, captura | ¿Engancha moverse con energía? |
| **1: MVP** | Región 1 (primeros 3 gimnasios), colega, paseador, jugadores visibles, intercambio directo, PvP casual | Beta cerrada con amigos |
| **2: Región completa** | 8 gimnasios, Liga, trabajos (Granjero, Minero, Pescador, Artesano), mercado, tronos de gimnasio | Beta ampliada |
| **3: Mundo vivo** | Incursiones, PvP ranked, primer jefe legendario con sorteo, eventos | Retención a largo plazo |
| **4: Post-game** | Frente de Batalla, Safari, Subsuelo, concursos, episodio post-Liga | Meses de contenido |
| **5: Región 2** | … | |

---

## 21. Preguntas abiertas

- [ ] ¿Pokémon oficiales con sprites oficiales en la beta, o sprites hechos por fans desde el principio?
- [ ] ¿Cuántos legendarios por región entran en el sistema "único"? ¿Solo los de portada o también los singulares (Mew, Celebi…)?
- [ ] ¿Qué hacer con el legendario de un jugador inactivo? ¿Se vuelve a sortear a los 6 meses?
- [ ] ¿Los sublegendarios son únicos o salen en incursiones de 6★?
- [ ] ¿Energía máxima y recarga? Probar 100 cada 5 h frente a 60 cada 3 h.
- [ ] ¿Se puede perder el trono de un gimnasio contra la IA del líder, o solo en directo?
- [ ] ¿Megaevolución, Dinamax o Tera? ¿Una por región, como mecánica propia?
- [ ] ¿Chat global, por zona o solo por ciudad?
- [ ] ¿Facciones o equipos al estilo GO (Valor, Sabiduría, Instinto) que compitan por controlar gimnasios?
