# Aurora Dex en Windows: lo lanza el Programador de tareas (despierta el PC, juega una tarea y deja que vuelva a dormirse).
# Uso: powershell -ExecutionPolicy Bypass -File ejecutar.ps1 -Tarea diario [-Nombre diario -Ventana 08:00-12:00]
# Con -Ventana, la tarea programada -Nombre se vuelve a programar para el dia siguiente a una hora al azar de esa franja
# (-SoloProgramar: solo eso, sin jugar; lo usa el instalador).
param([string]$Tarea = 'diario', [string]$Nombre = '', [string]$Ventana = '', [switch]$SoloProgramar)

$bot = Split-Path -Parent $MyInvocation.MyCommand.Path
$raiz = Split-Path -Parent $bot
$logf = Join-Path $bot 'aurora.log'
function Log([string]$t) { Add-Content -Path $logf -Value ('[{0}] {1}' -f (Get-Date -Format 'dd/MM/yyyy HH:mm:ss'), $t) -Encoding UTF8 }

# La siguiente vez: el dia despues de la franja que toca (o que se acaba de pasar), a una hora al azar dentro de ella
function Programar-Siguiente {
  if (-not $Ventana -or -not $Nombre) { return }
  $p = $Ventana -split '-'
  $ini = [TimeSpan]::Parse($p[0]); $fin = [TimeSpan]::Parse($p[1])
  $ahora = Get-Date
  $servido = if ($ahora.TimeOfDay -ge $ini) { $ahora.Date } else { $ahora.Date.AddDays(-1) }
  $cuando = $null
  for ($d = 1; $d -le 3; $d++) {
    $cuando = $servido.AddDays($d).AddMinutes((Get-Random -Minimum ([int]$ini.TotalMinutes) -Maximum ([int]$fin.TotalMinutes + 1)))
    if ($cuando -gt $ahora.AddMinutes(10)) { break }
  }
  try {
    Set-ScheduledTask -TaskPath '\AuroraDex\' -TaskName $Nombre -Trigger (New-ScheduledTaskTrigger -Once -At $cuando) -ErrorAction Stop | Out-Null
    Log "Proxima '$Nombre': $($cuando.ToString('dd/MM HH:mm'))"
  } catch { Log "No he podido programar '$Nombre': $($_.Exception.Message)" }
}
if ($SoloProgramar) { Programar-Siguiente; exit 0 }
Programar-Siguiente

# 1) Que Windows no vuelva a dormir el PC mientras juega (sin esto lo suspende a los ~2 minutos de despertarlo)
Add-Type -Namespace Aurora -Name Energia -MemberDefinition '[DllImport("kernel32.dll")] public static extern uint SetThreadExecutionState(uint f);'
[Aurora.Energia]::SetThreadExecutionState([uint32]'0x80000001') | Out-Null   # ES_CONTINUOUS | ES_SYSTEM_REQUIRED

# 2) Una tarea cada vez: dos navegadores no pueden usar la misma sesion a la vez
$mutex = New-Object System.Threading.Mutex($false, 'Local\AuroraDexBot')
$tengo = $false
try { $tengo = $mutex.WaitOne([TimeSpan]::FromHours(6)) } catch [System.Threading.AbandonedMutexException] { $tengo = $true }
if (-not $tengo) { Log "No he podido empezar '$Tarea': otra tarea lleva 6 h en marcha."; exit 1 }

try {
  Log "Empiezo: $Tarea"
  # 3) Al despertar, el WiFi tarda un poco: se espera a tener internet (hasta 3 minutos)
  $red = $false
  for ($i = 0; $i -lt 36 -and -not $red; $i++) {
    try { Invoke-WebRequest -Uri 'https://auroradex.es' -Method Head -UseBasicParsing -TimeoutSec 10 | Out-Null; $red = $true } catch { Start-Sleep -Seconds 5 }
  }
  if (-not $red) { Log 'Sin internet: no juego esta vez.'; exit 1 }

  # 4) La ultima version de los scripts
  if (Get-Command git -ErrorAction SilentlyContinue) { git -C $raiz pull -q 2>&1 | Out-Null }

  # 5) Aviso por Telegram (opcional): bot\aviso.env con TELEGRAM_TOKEN=... y TELEGRAM_CHAT=...
  $env_f = Join-Path $bot 'aviso.env'
  if (Test-Path $env_f) {
    foreach ($l in Get-Content $env_f) { if ($l -match '^\s*([A-Z_]+)\s*=\s*(.*?)\s*$') { Set-Item -Path ("env:" + $Matches[1]) -Value $Matches[2] } }
  }

  # 6) A jugar (cmd guarda la salida tal cual, con sus tildes y emojis)
  Set-Location $bot
  cmd /c "node aurora.js $Tarea >> aurora.log 2>&1"
  Log "Fin: $Tarea (codigo $LASTEXITCODE)"
} finally {
  if ($tengo) { $mutex.ReleaseMutex() }
  [Aurora.Energia]::SetThreadExecutionState([uint32]'0x80000000') | Out-Null   # ya puede volver a dormirse
}
