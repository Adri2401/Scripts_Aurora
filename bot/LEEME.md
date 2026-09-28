# Aurora Dex solo, en un servidor (Oracle Cloud Free)

Juega con los mismos scripts de Tampermonkey en un navegador sin pantalla, a sus horas:

| Cuándo (hora de España) | Tarea | Qué hace |
|---|---|---|
| Cada día entre 08:00 y 12:00 | `diario` | Todas las diarias (y los Safaris, Tren y Casa Treta de las otras regiones), el Huerto (solo Meloc y Latano), el Valle («Hacerlo todo»), los respiros del Salón, los 3 encuentros gratis de la manada de cada región, la marea de la Isla, los 3 encuentros gratis de la manada de cada región, la bajada gratis de las Entrañas (desde el piso 1), los Tronos (defiende el tuyo con el mejor equipo o reta al más fácil) y los retos a ciegas de la Torre |
| Entre 20:00 y 23:59, y otra vez entre 00:00 y 02:00 | `subsuelo` | Se pone las Botas de Andar del Huerto y pica todas las vetas del Subsuelo |
| Lunes 00:00 | `entranas-pases` | Baja las Entrañas con los Pases del monte hasta gastarlos, sin gastar energía |
| Cada 3 horas | `isla` | Isla Espejismo: elige compañero, gasta la marea en la zona que más especies nuevas promete, captura las que no tienes (y los variocolor), ordena el equipo para evolucionar y lucha contra el jefe cuando llega |

Las de franja salen cada día a una hora distinta dentro de ella. Nunca entra en el Suelo Helado, Voltorb Flip ni las Ruinas Alfa.

1. Crea una VM «Always Free» en Oracle Cloud (Ubuntu 22.04 o 24.04; vale la ARM Ampere o la AMD micro) y entra por SSH.
2. `sudo apt-get install -y git && git clone https://github.com/Adri2401/Scripts_Aurora.git && cd Scripts_Aurora/bot && bash instalar.sh`
3. Mete tu sesión una vez (la cookie `__Secure-next-auth.session-token` de auroradex.es, desde tu PC: F12 → Aplicación → Cookies):
   `nano sesion.txt` (pegar y guardar) → `node aurora.js --sesion sesion.txt && rm sesion.txt`
4. Prueba una tarea a mano: `node aurora.js tronos`. El horario queda en el cron (`crontab -e` para cambiarlo). Log: `bot/aurora.log`.

Cada tarea espera a que acabe la anterior (`flock`), porque dos navegadores no pueden usar la misma sesión a la vez.
Antes de cada tarea hace `git pull`, así que siempre usa la última versión de los scripts.

Opcional, aviso al móvil por Telegram al acabar cada tarea: crea un bot con @BotFather y pon en `bot/aviso.env`
dos líneas: `TELEGRAM_TOKEN=xxx` y `TELEGRAM_CHAT=tu_id` (no se sube a ningún sitio).

La sesión vive en `bot/perfil` (no se sube a ningún sitio) y el juego la renueva mientras se use. Si caduca, el bot avisa
y sale: repite el paso 3. Otras variables: `AURORA_LIGAS` (ligas de la Torre, por defecto `clasico`), `AURORA_SCRIPTS`.

Ojo: las normas del juego dicen que automatizar te deja fuera de los premios.

## En tu PC con Windows (sin servidor)

Si el PC admite «Modo de espera (S3)» (`powercfg /a`), Windows lo despierta a su hora, juega y lo deja volver a dormirse.

1. Abre **PowerShell** (no hace falta como administrador) y pega:
   `irm https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/bot/instalar_windows.ps1 | iex`
2. Instala Git y Node si faltan, descarga los scripts en `%USERPROFILE%\Scripts_Aurora`, programa las tareas (Programador
   de tareas > AuroraDex) y te pide la cookie una vez (no se ve al pegarla).
3. Deja el PC **en suspensión, no apagado**, y con tu usuario iniciado. Mientras juega no deja que se duerma; al acabar, sí.

Mismo horario que en el servidor (hora del PC). Log: `bot\aurora.log`. Aviso por Telegram: `bot\aviso.env`.
