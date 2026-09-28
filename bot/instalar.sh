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
# cada día a las 10:05 (hora de España): actualiza los scripts del repo y juega las diarias
LINEA="5 10 * * * cd $(pwd)/.. && git pull -q; cd $(pwd) && /usr/bin/env node diarias.js >> diarias.log 2>&1"
( crontab -l 2>/dev/null | grep -v 'diarias.js' ; echo "$LINEA" ) | crontab -
echo
echo "Hecho. Falta meter tu sesión una vez:"
echo "  1) En el navegador de tu PC, con la sesión iniciada en auroradex.es: F12 → Aplicación/Almacenamiento → Cookies"
echo "     → copia el valor de  __Secure-next-auth.session-token"
echo "  2) Aquí:  nano sesion.txt  (pégalo, guarda)  y luego:  node diarias.js --sesion sesion.txt && rm sesion.txt"
echo "Cron puesto a las 10:05 cada día. Log en bot/diarias.log. Para cambiar la hora: crontab -e"
