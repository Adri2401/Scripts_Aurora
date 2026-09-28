# Aurora Dex en Windows: lo lanza el Programador de tareas (despierta el PC, juega una tarea y deja que vuelva a dormirse).
# Uso: powershell -ExecutionPolicy Bypass -File ejecutar.ps1 -Tarea diario
param([string]$Tarea = 'diario')

$bot = Split-Path -Parent $MyInvocation.MyCommand.Path
$raiz = Split-Path -Parent $bot
$logf = Join-Path $bot 'aurora.log'
function Log([string]$t) { Add-Content -Path $logf -Value ('[{0}] {1}' -f (Get-Date -Format 'dd/MM/yyyy HH:mm:ss'), $t) -Encoding UTF8 }

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
