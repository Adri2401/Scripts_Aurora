# Diarias solas en un servidor (Oracle Cloud Free)

Juega cada día «Jugar todas las diarias» con los mismos scripts de Tampermonkey, en un navegador sin pantalla.

1. Crea una VM «Always Free» en Oracle Cloud (Ubuntu 22.04 o 24.04; vale la ARM Ampere o la AMD micro) y entra por SSH.
2. `sudo apt-get install -y git && git clone https://github.com/Adri2401/Scripts_Aurora.git && cd Scripts_Aurora/bot && bash instalar.sh`
3. Mete tu sesión una vez (la cookie `__Secure-next-auth.session-token` de auroradex.es, desde tu PC: F12 → Aplicación → Cookies):
   `nano sesion.txt` (pegar y guardar) → `node diarias.js --sesion sesion.txt && rm sesion.txt`
4. Prueba: `node diarias.js`. Queda programado cada día a las 10:05 (`crontab -e` para cambiarlo). Log: `bot/diarias.log`.

Opcional, aviso al móvil por Telegram al acabar: crea un bot con @BotFather y añade al principio de la línea del cron
`TELEGRAM_TOKEN=xxx TELEGRAM_CHAT=tu_id `.

La sesión vive en `bot/perfil` (no se sube a ningún sitio) y el juego la renueva mientras se use. Si caduca, el bot avisa
y sale: repite el paso 3. Scripts que carga (variable `AURORA_SCRIPTS`): Diarias, Safari Auto, Casa Treta.
