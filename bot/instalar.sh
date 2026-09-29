#!/usr/bin/env bash
# Instalación en un servidor Ubuntu (Oracle Cloud Free: Ubuntu 22.04/24.04, vale ARM o AMD).
# Uso:  bash instalar.sh            (desde la carpeta bot/ del repo ya clonado)
set -euo pipefail
cd "$(dirname "$0")"
if ! command -v node >/dev/null || [ "$(node -v | cut -c2- | cut -d. -f1)" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
npm install
npx playwright install --with-deps chromium
sudo timedatectl set-timezone Europe/Madrid || true
sudo systemctl restart cron 2>/dev/null || true          # para que el cron coja la hora de España
# máquinas pequeñas (la AMD micro de 1 GB): 2 GB de swap para que Chromium no se quede sin memoria
if [ "$(free -m | awk '/^Mem:/{print $2}')" -lt 2000 ] && [ "$(swapon --show | wc -l)" -eq 0 ]; then
  sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
fi
# Horario (hora de España). Cada tarea espera su turno (flock) para no abrir dos navegadores con la misma sesión:
#   mañana 06:00–08:00 → diarias (con Huerto, Valle y Salón), Manadas gratis, Tronos, Torre a ciegas, Subsuelo e Isla
#   tarde 18:00–20:00 → Subsuelo (con Botas), Entrañas (gratis y pases, nunca energía), Isla y Huerto
#   semanal, lunes 00:01 → Galerías hasta la planta 40
#   huerto cada 4 h → cosecha, planta Meloc/Latano y riega
#   (las de franja salen cada día a una hora distinta: esperan al azar dentro de la franja antes de empezar)
BOT="$(pwd)"
# aviso.env (opcional): TELEGRAM_TOKEN=... y TELEGRAM_CHAT=... para que avise al móvil al acabar cada tarea
tarea() { echo "$1 ${3:+sleep \$(shuf -i 0-$3 -n 1); }cd $BOT/.. && git pull -q; cd $BOT && set -a && { [ -f aviso.env ] && . ./aviso.env; set +a; } && flock -w 21600 aurora.lock /usr/bin/env node aurora.js $2 >> aurora.log 2>&1"; }
( crontab -l 2>/dev/null | grep -v -e 'diarias.js' -e 'aurora.js' ;
  tarea "0 6 * * *" manana 7140 ; tarea "0 18 * * *" tarde 7140 ;
  tarea "1 0 * * 1" semanal ; tarea "20 */4 * * *" huerto ) | crontab -
echo
echo "Hecho. Falta meter tu sesión una vez:"
echo "  1) En el navegador de tu PC, con la sesión iniciada en auroradex.es: F12 → Aplicación/Almacenamiento → Cookies"
echo "     → copia el valor de  __Secure-next-auth.session-token"
echo "  2) Aquí:  nano sesion.txt  (pégalo, guarda)  y luego:  node aurora.js --sesion sesion.txt && rm sesion.txt"
echo "Cron puesto (mañana 06-08, tarde 18-20, lunes 00:01 Galerías, huerto cada 4 h). Log en bot/aurora.log. Para cambiar horas: crontab -e"
