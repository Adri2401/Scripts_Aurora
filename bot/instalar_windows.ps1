# Aurora Dex en tu PC con Windows: juega solo a sus horas despertando el PC de la suspension.
# En PowerShell (si no lo abres como administrador, pide permiso y sigue en otra ventana):
#   irm https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/bot/instalar_windows.ps1 | iex
# Se puede volver a ejecutar cuando quieras (actualiza, rehace las tareas y, si quieres, cambia la sesion).
$ErrorActionPreference = 'Stop'
# Hace falta administrador: las tareas corren con privilegios altos para poder volver a programarse solas cada dia
# (sin ellos Windows responde 'Acceso denegado' y la tarea se queda sin proxima hora)
$yo = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $yo.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  Write-Host 'Hace falta permiso de administrador: acepta el aviso de Windows y sigue en la ventana nueva.' -ForegroundColor Yellow
  Start-Process -FilePath (Join-Path $env:WINDIR 'System32\WindowsPowerShell\v1.0\powershell.exe') -Verb RunAs -ArgumentList '-NoProfile -ExecutionPolicy Bypass -NoExit -Command "irm https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/bot/instalar_windows.ps1 | iex"'
  return
}
function Paso([string]$t) { Write-Host ''; Write-Host "== $t" -ForegroundColor Cyan }
function Refrescar-Path { $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User') }

# 1) Git y Node.js (con winget, el instalador de programas de Windows)
Paso 'Git y Node.js'
foreach ($p in @(@{ cmd = 'git'; id = 'Git.Git' }, @{ cmd = 'node'; id = 'OpenJS.NodeJS.LTS' })) {
  if (-not (Get-Command $p.cmd -ErrorAction SilentlyContinue)) {
    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) { throw "Falta $($p.cmd) y no tengo winget para instalarlo. Instala $($p.id) a mano y vuelve a ejecutar esto." }
    Write-Host "Instalando $($p.id)..."
    winget install -e --id $p.id --silent --accept-source-agreements --accept-package-agreements | Out-Host
    Refrescar-Path
  }
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js no aparece: cierra PowerShell, abrelo otra vez y vuelve a ejecutar el instalador.' }
Write-Host ("Node " + (node -v))

# 2) Los scripts (en tu carpeta de usuario)
Paso 'Descargando los scripts'
$raiz = Join-Path $env:USERPROFILE 'Scripts_Aurora'
if (Test-Path (Join-Path $raiz '.git')) { git -c 'safe.directory=*' -C $raiz pull -q } else { git clone -q https://github.com/Adri2401/Scripts_Aurora.git $raiz }
$bot = Join-Path $raiz 'bot'
Set-Location $bot

# 3) Playwright y su Chromium (npm.cmd/npx.cmd para no chocar con la politica de scripts de PowerShell)
Paso 'Instalando el navegador del bot (tarda unos minutos)'
npm.cmd install --silent | Out-Host
npx.cmd playwright install chromium | Out-Host

# 4) Permitir que las tareas despierten el PC (temporizadores de reactivacion)
Paso 'Permitiendo que el PC se despierte solo'
powercfg /setacvalueindex SCHEME_CURRENT SUB_SLEEP RTCWAKE 1
$ok = $LASTEXITCODE -eq 0
powercfg /setdcvalueindex SCHEME_CURRENT SUB_SLEEP RTCWAKE 1
powercfg /setactive SCHEME_CURRENT
if ($ok -and $LASTEXITCODE -eq 0) { Write-Host 'Temporizadores de reactivacion: habilitados.' }
else { Write-Host 'No he podido cambiarlo: Opciones de energia > Cambiar la configuracion del plan > avanzada > Suspender > Permitir temporizadores de reactivacion > Habilitar.' -ForegroundColor Yellow }

# 5) Las tareas programadas (hora de tu PC)
Paso 'Programando las tareas'
$ps = Join-Path $env:WINDIR 'System32\WindowsPowerShell\v1.0\powershell.exe'
$ejecutar = Join-Path $bot 'ejecutar.ps1'
$ajustes = New-ScheduledTaskSettingsSet -WakeToRun -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Hours 6) -MultipleInstances IgnoreNew
$quien = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Highest
# Pocas veces al dia, cada una con varias cosas seguidas (para despertar el PC lo menos posible). Las de franja (v)
# cambian de hora cada dia: al jugar, se vuelven a programar para el dia siguiente al azar dentro de ella.
#   manana 08:00-12:00: diarias (Huerto, Valle, Salon), Manadas, Isla, Tronos y Torre
#   tarde  22:30-23:30 (domingo 21:30-22:15, para acabar antes de las Galerias): Subsuelo, Entranas, Isla y Huerto
#   noche  00:00-02:00 (lunes a las 00:01: primero Galerias hasta la planta 40): Subsuelo y Huerto
#   huerto: solo cuando hay cosecha lista y ninguna de las otras va a despertar el PC en la hora y media siguiente
$provisional = New-ScheduledTaskTrigger -Once -At ([datetime]::Now.AddDays(1))
$tareas = @(
  @{ n = 'manana'; v = '08:00-12:00' },
  @{ n = 'tarde';  v = '22:30-23:30'; dom = '21:30-22:15' },
  @{ n = 'noche';  v = '00:00-02:00'; lun = '00:01' },
  @{ n = 'huerto' }
)
# las de antes (otra organizacion de horarios)
foreach ($viejo in 'diario', 'subsuelo', 'subsuelo-tarde', 'subsuelo-noche', 'isla', 'entranas-pases') { Unregister-ScheduledTask -TaskPath '\AuroraDex\' -TaskName $viejo -Confirm:$false -ErrorAction SilentlyContinue }
foreach ($x in $tareas) {
  $arg = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$ejecutar`" -Tarea $($x.n)"
  if ($x.v) { $arg += " -Nombre $($x.n) -Ventana $($x.v)" }
  if ($x.dom) { $arg += " -VentanaDomingo $($x.dom)" }
  if ($x.lun) { $arg += " -HoraLunes $($x.lun)" }
  $accion = New-ScheduledTaskAction -Execute $ps -Argument $arg -WorkingDirectory $bot
  Register-ScheduledTask -TaskPath '\AuroraDex\' -TaskName $x.n -Action $accion -Trigger $provisional -Settings $ajustes -Principal $quien -Force | Out-Null
  if ($x.v) {
    $extra = @(); if ($x.dom) { $extra += @('-VentanaDomingo', $x.dom) }; if ($x.lun) { $extra += @('-HoraLunes', $x.lun) }
    & $ps -NoProfile -ExecutionPolicy Bypass -File $ejecutar -Nombre $x.n -Ventana $x.v @extra -SoloProgramar
    $sig = (Get-ScheduledTask -TaskPath '\AuroraDex\' -TaskName $x.n | Get-ScheduledTaskInfo).NextRunTime
    Write-Host "  - $($x.n): la proxima $($sig.ToString('ddd dd/MM HH:mm'))"
  } else {
    Disable-ScheduledTask -TaskPath '\AuroraDex\' -TaskName $x.n | Out-Null
    Write-Host "  - $($x.n): se programa sola cuando haya cosecha"
  }
}

# 6) Tu sesion (la cookie de auroradex.es)
Paso 'Tu sesion'
$perfil = Join-Path $bot 'perfil'
$pedir = -not (Test-Path $perfil)
if (-not $pedir) { $pedir = (Read-Host 'Ya hay una sesion guardada. Cambiarla? (s/N)') -match '^[sS]' }
if ($pedir) {
  Write-Host 'En tu navegador, con la sesion abierta en auroradex.es: F12 > Aplicacion > Cookies > https://auroradex.es'
  Write-Host 'Copia el VALOR de __Secure-next-auth.session-token y pegalo aqui (no se vera ni se guardara en ningun otro sitio).'
  $seg = Read-Host 'Cookie' -AsSecureString
  $valor = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($seg)).Trim()
  $tmp = Join-Path $env:TEMP ('aurora_' + [guid]::NewGuid().ToString('N') + '.txt')
  try {
    [IO.File]::WriteAllText($tmp, $valor)
    node aurora.js --sesion $tmp
    if ($LASTEXITCODE -eq 2) { Write-Host 'La cookie no vale (o ha caducado): vuelve a ejecutar el instalador con una nueva.' -ForegroundColor Yellow }
  } finally { Remove-Item $tmp -Force -ErrorAction SilentlyContinue }
}

Paso 'Hecho'
Write-Host 'Se despierta 3 veces al dia (manana 08-12, tarde 22:30-23:30, noche 00-02; lunes 00:01 con las Galerias) y alguna mas solo si el Huerto tiene cosecha.'
Write-Host 'Deja el PC en SUSPENSION (no apagado) y con tu usuario iniciado: se despierta, juega y vuelve a dormirse.'
Write-Host "Probar ahora:   cd `"$bot`";  node aurora.js tronos"
Write-Host "Ver que ha hecho:   Get-Content `"$(Join-Path $bot 'aurora.log')`" -Tail 40"
Write-Host 'Las tareas estan en el Programador de tareas > Biblioteca > AuroraDex.'
