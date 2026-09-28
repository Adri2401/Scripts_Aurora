# Aurora Dex en Windows: lo lanza el Programador de tareas (despierta el PC, juega una tarea y deja que vuelva a dormirse).
# Uso: powershell -ExecutionPolicy Bypass -File ejecutar.ps1 -Tarea diario [-Nombre diario -Ventana 08:00-12:00]
# Con -Ventana, la tarea programada -Nombre se vuelve a programar para el dia siguiente a una hora al azar de esa franja
# -VentanaDomingo: otra franja si el dia siguiente es domingo; -HoraLunes: hora fija si es lunes.
# (-SoloProgramar: solo eso, sin jugar; lo usa el instalador). Al acabar, programa el Huerto para cuando haya cosecha.
param([string]$Tarea = 'manana', [string]$Nombre = '', [string]$Ventana = '', [string]$VentanaDomingo = '', [string]$HoraLunes = '', [switch]$SoloProgramar)

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
    $dia = $servido.AddDays($d)
    if ($HoraLunes -and $dia.DayOfWeek -eq 'Monday') { $cuando = $dia.Add([TimeSpan]::Parse($HoraLunes)) }
    else {
      $v = if ($VentanaDomingo -and $dia.DayOfWeek -eq 'Sunday') { $VentanaDomingo -split '-' } else { $p }
      $a = [TimeSpan]::Parse($v[0]); $b = [TimeSpan]::Parse($v[1])
      $cuando = $dia.AddMinutes((Get-Random -Minimum ([int]$a.TotalMinutes) -Maximum ([int]$b.TotalMinutes + 1)))
    }
    if ($cuando -gt $ahora.AddMinutes(10)) { break }
  }
  try {
    Set-ScheduledTask -TaskPath '\AuroraDex\' -TaskName $Nombre -Trigger (New-ScheduledTaskTrigger -Once -At $cuando) -ErrorAction Stop | Out-Null
    Log "Proxima '$Nombre': $($cuando.ToString('dd/MM HH:mm'))"
  } catch { Log "No he podido programar '$Nombre': $($_.Exception.Message)" }
}
# El Huerto: se despierta el PC solo cuando hay cosecha, y no si otra tarea lo va a despertar en la hora y media
# siguiente ni de madrugada (02:00-07:30: ya lo hara la manana)
function Programar-Huerto {
  $t = Get-ScheduledTask -TaskPath '\AuroraDex\' -TaskName 'huerto' -ErrorAction SilentlyContinue
  $f = Join-Path $bot 'proximo.json'
  if (-not $t -or -not (Test-Path $f)) { return }
  $apagar = { param($m) Disable-ScheduledTask -TaskPath '\AuroraDex\' -TaskName 'huerto' -ErrorAction SilentlyContinue | Out-Null; Log "Huerto: $m" }
  try { $j = Get-Content $f -Raw | ConvertFrom-Json } catch { return }
  if (-not $j.huerto -or [int64]$j.huerto -le 0) { & $apagar 'no hay nada creciendo, no lo programo.'; return }
  $cuando = [DateTimeOffset]::FromUnixTimeMilliseconds([int64]$j.huerto).LocalDateTime.AddMinutes(2)
  if ($cuando -lt (Get-Date).AddMinutes(5)) { & $apagar 'ha quedado algo por hacer: lo hara la siguiente tarea.'; return }
  foreach ($n in 'manana', 'tarde', 'noche') {
    $i = Get-ScheduledTask -TaskPath '\AuroraDex\' -TaskName $n -ErrorAction SilentlyContinue | Get-ScheduledTaskInfo -ErrorAction SilentlyContinue
    if ($i -and $i.NextRunTime -and $i.NextRunTime -ge $cuando.AddMinutes(-5) -and $i.NextRunTime -le $cuando.AddMinutes(90)) { & $apagar "cosecha a las $($cuando.ToString('HH:mm')): la hara '$n' ($($i.NextRunTime.ToString('HH:mm')))."; return }
  }
  if ($cuando.TimeOfDay -ge [TimeSpan]'02:00' -and $cuando.TimeOfDay -lt [TimeSpan]'07:30') { & $apagar "cosecha de madrugada ($($cuando.ToString('HH:mm'))): la hara la manana."; return }
  try {
    Set-ScheduledTask -TaskPath '\AuroraDex\' -TaskName 'huerto' -Trigger (New-ScheduledTaskTrigger -Once -At $cuando) -ErrorAction Stop | Out-Null
    Enable-ScheduledTask -TaskPath '\AuroraDex\' -TaskName 'huerto' -ErrorAction Stop | Out-Null
    Log "Proxima 'huerto': $($cuando.ToString('dd/MM HH:mm'))"
  } catch { Log "No he podido programar el huerto: $($_.Exception.Message)" }
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
  Programar-Huerto
} finally {
  if ($tengo) { $mutex.ReleaseMutex() }
  [Aurora.Energia]::SetThreadExecutionState([uint32]'0x80000000') | Out-Null   # ya puede volver a dormirse
}
