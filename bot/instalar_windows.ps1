# Aurora Dex en tu PC con Windows: juega solo a sus horas despertando el PC de la suspension.
# En PowerShell (no hace falta abrirlo como administrador):
#   irm https://raw.githubusercontent.com/Adri2401/Scripts_Aurora/main/bot/instalar_windows.ps1 | iex
# Se puede volver a ejecutar cuando quieras (actualiza, rehace las tareas y, si quieres, cambia la sesion).
$ErrorActionPreference = 'Stop'
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
if (Test-Path (Join-Path $raiz '.git')) { git -C $raiz pull -q } else { git clone -q https://github.com/Adri2401/Scripts_Aurora.git $raiz }
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
$quien = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Limited
$islaHoras = 0..7 | ForEach-Object { New-ScheduledTaskTrigger -Daily -At ([datetime]::Today.AddHours(3 * $_).AddMinutes(40)) }
# las de franja (v) cambian de hora cada dia: al jugar, se vuelven a programar para el dia siguiente al azar dentro de ella
$provisional = New-ScheduledTaskTrigger -Once -At ([datetime]::Now.AddDays(1))
$tareas = @(
  @{ n = 'diario';         tarea = 'diario';   v = '08:00-12:00'; t = @($provisional) },
  @{ n = 'subsuelo-tarde'; tarea = 'subsuelo'; v = '20:00-23:59'; t = @($provisional) },
  @{ n = 'subsuelo-noche'; tarea = 'subsuelo'; v = '00:00-02:00'; t = @($provisional) },
  @{ n = 'entranas-pases'; tarea = 'entranas-pases'; t = @(New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At '00:00') },
  @{ n = 'isla';           tarea = 'isla';     t = $islaHoras }
)
Unregister-ScheduledTask -TaskPath '\AuroraDex\' -TaskName 'subsuelo' -Confirm:$false -ErrorAction SilentlyContinue   # la de antes (23:00 y 01:00 fijas)
foreach ($x in $tareas) {
  $arg = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$ejecutar`" -Tarea $($x.tarea)"
  if ($x.v) { $arg += " -Nombre $($x.n) -Ventana $($x.v)" }
  $accion = New-ScheduledTaskAction -Execute $ps -Argument $arg -WorkingDirectory $bot
  Register-ScheduledTask -TaskPath '\AuroraDex\' -TaskName $x.n -Action $accion -Trigger $x.t -Settings $ajustes -Principal $quien -Force | Out-Null
  if ($x.v) {
    & $ps -NoProfile -ExecutionPolicy Bypass -File $ejecutar -Nombre $x.n -Ventana $x.v -SoloProgramar
    $sig = (Get-ScheduledTask -TaskPath '\AuroraDex\' -TaskName $x.n | Get-ScheduledTaskInfo).NextRunTime
    Write-Host "  - $($x.n): cada dia entre $($x.v.Replace('-', ' y ')), la proxima $($sig.ToString('dd/MM HH:mm'))"
  } else { Write-Host "  - $($x.n)" }
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
Write-Host 'Tareas (hora de tu PC): diarias entre 08:00 y 12:00, Subsuelo entre 20:00 y 23:59 y otra entre 00:00 y 02:00 (a una hora distinta cada dia), Entranas con pases lunes 00:00, Isla cada 3 h (00:40, 03:40...).'
Write-Host 'Deja el PC en SUSPENSION (no apagado) y con tu usuario iniciado: se despierta, juega y vuelve a dormirse.'
Write-Host "Probar ahora:   cd `"$bot`";  node aurora.js tronos"
Write-Host "Ver que ha hecho:   Get-Content `"$(Join-Path $bot 'aurora.log')`" -Tail 40"
Write-Host 'Las tareas estan en el Programador de tareas > Biblioteca > AuroraDex.'
