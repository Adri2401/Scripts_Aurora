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
#   08:00–12:00     → diarias (con Huerto, Valle y Salón), Manadas gratis, bajada gratis de las Entrañas, Tronos y Torre a ciegas
#   20:00–23:59 y 00:00–02:00 → Subsuelo: Botas de Andar del Huerto y todas las vetas
#   (las de franja salen cada día a una hora distinta dentro de ella: espera al azar antes de empezar)
#   lunes 00:00     → Entrañas con los Pases del monte (nunca gasta energía)
#   cada 3 h (:40)  → Isla Espejismo: gasta la marea (sube +15 cada 2 h, tope 45) capturando especies nuevas
BOT="$(pwd)"
# aviso.env (opcional): TELEGRAM_TOKEN=... y TELEGRAM_CHAT=... para que avise al móvil al acabar cada tarea
tarea() { echo "$1 ${3:+sleep \$(shuf -i 0-$3 -n 1); }cd $BOT/.. && git pull -q; cd $BOT && set -a && { [ -f aviso.env ] && . ./aviso.env; set +a; } && flock -w 21600 aurora.lock /usr/bin/env node aurora.js $2 >> aurora.log 2>&1"; }
( crontab -l 2>/dev/null | grep -v -e 'diarias.js' -e 'aurora.js' ;
  tarea "0 8 * * *" diario 14340 ; tarea "0 20 * * *" subsuelo 14340 ; tarea "0 0 * * *" subsuelo 7140 ; tarea "0 0 * * 1" entranas-pases ; tarea "40 */3 * * *" isla ) | crontab -
echo
echo "Hecho. Falta meter tu sesión una vez:"
echo "  1) En el navegador de tu PC, con la sesión iniciada en auroradex.es: F12 → Aplicación/Almacenamiento → Cookies"
echo "     → copia el valor de  __Secure-next-auth.session-token"
echo "  2) Aquí:  nano sesion.txt  (pégalo, guarda)  y luego:  node aurora.js --sesion sesion.txt && rm sesion.txt"
echo "Cron puesto (diario entre 08:00 y 12:00, Subsuelo entre 20:00 y 23:59 y entre 00:00 y 02:00, lunes 00:00 pases, Isla cada 3 h). Log en bot/aurora.log. Para cambiar horas: crontab -e"
