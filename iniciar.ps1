# Inicia la aplicacion en local: Docker Desktop, base de datos (Supabase), backend y frontend.
# Uso: .\iniciar.ps1   (o doble clic en iniciar.cmd)
# Al final muestra la URL de acceso y espera Enter; al pulsarlo detiene backend y
# frontend. La base queda corriendo (npm run db:stop para detenerla).

# Los comandos externos se verifican con $LASTEXITCODE; "Stop" haria fallar en
# PowerShell 5 cualquier aviso que escriban por stderr (p. ej. supabase status).
$ErrorActionPreference = "Continue"
Set-Location $PSScriptRoot

function Paso($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Fallo($msg) {
  Write-Host "ERROR: $msg" -ForegroundColor Red
  Read-Host "Presiona Enter para cerrar" | Out-Null
  exit 1
}

# IP de la red local (siempre 192.168.*). Vite escucha en todas las interfaces
# (host: true), asi que un cambio de IP por DHCP no afecta al arranque; la IP
# solo se usa para indicar la URL de acceso desde otros equipos.
$ipLan = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object { $_.IPAddress -like "192.168.*" } |
  Select-Object -First 1 -ExpandProperty IPAddress

Paso "Comprobando requisitos"
foreach ($cmd in "node", "npm", "docker", "supabase") {
  if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) { Fallo "No se encontro '$cmd'. Ver DESARROLLO.md." }
}

Paso "Docker"
docker info *> $null
if ($LASTEXITCODE -eq 0) {
  Write-Host "Docker ya esta corriendo."
} else {
  # docker.exe vive en <instalacion>\resources\bin; Docker Desktop.exe en <instalacion>.
  $base = Split-Path (Split-Path (Split-Path (Get-Command docker).Source))
  $candidatos = @(
    (Join-Path $base "Docker Desktop.exe"),
    "$env:LOCALAPPDATA\Programs\DockerDesktop\Docker Desktop.exe",
    "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe"
  )
  $exe = $candidatos | Where-Object { Test-Path $_ } | Select-Object -First 1
  if (-not $exe) { Fallo "No se encontro Docker Desktop. Abrilo manualmente y volve a intentarlo." }

  Write-Host "Iniciando Docker Desktop..."
  Start-Process $exe
  $limite = (Get-Date).AddMinutes(3)
  do {
    Start-Sleep -Seconds 3
    Write-Host "." -NoNewline
    docker info *> $null
  } while ($LASTEXITCODE -ne 0 -and (Get-Date) -lt $limite)
  Write-Host ""
  if ($LASTEXITCODE -ne 0) { Fallo "Docker no respondio en 3 minutos. Revisa Docker Desktop." }
  Write-Host "Docker listo."
}

if (-not (Test-Path "node_modules")) {
  Paso "Instalando dependencias"
  npm install
  if ($LASTEXITCODE -ne 0) { Fallo "npm install fallo." }
}

if (-not (Test-Path "server\.env")) {
  Paso "Creando server\.env desde server\.env.example"
  Copy-Item "server\.env.example" "server\.env"
}

Paso "Base de datos (Supabase)"
supabase status *> $null
if ($LASTEXITCODE -eq 0) {
  Write-Host "Supabase ya esta corriendo."
} else {
  Write-Host "Iniciando Supabase (la primera vez descarga las imagenes Docker; puede tardar varios minutos)..."
  supabase start
  if ($LASTEXITCODE -ne 0) {
    # Tras arrancar Docker, los contenedores de Supabase se reinician solos y
    # supabase start falla mientras siguen en "starting": esperar a que queden listos.
    Write-Host "Esperando a que los contenedores de Supabase terminen de arrancar..."
    $limite = (Get-Date).AddMinutes(3)
    do {
      Start-Sleep -Seconds 3
      Write-Host "." -NoNewline
      supabase status *> $null
    } while ($LASTEXITCODE -ne 0 -and (Get-Date) -lt $limite)
    Write-Host ""
    if ($LASTEXITCODE -ne 0) { Fallo "Supabase no quedo listo en 3 minutos. Proba 'supabase stop' y volve a ejecutar el script." }
  }
  Write-Host "Supabase listo."
}

Paso "Liberando puertos 3000 y 5173"
foreach ($puerto in 3000, 5173) {
  $conexiones = Get-NetTCPConnection -LocalPort $puerto -State Listen -ErrorAction SilentlyContinue
  foreach ($c in $conexiones) {
    $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$($c.OwningProcess)"
    # Solo se detienen procesos de este proyecto (instancias anteriores de dev).
    if ($proc.CommandLine -like "*$PSScriptRoot*") {
      Write-Host "Deteniendo instancia anterior en el puerto $puerto (PID $($c.OwningProcess))."
      Stop-Process -Id $c.OwningProcess -Force
    } else {
      Fallo "El puerto $puerto esta ocupado por otro programa (PID $($c.OwningProcess)): $($proc.CommandLine)"
    }
  }
}

Paso "Iniciando backend y frontend"
# Se ejecutan en segundo plano con los logs en un archivo, para que el mensaje
# final con la URL no quede tapado por la salida de Vite y del servidor.
New-Item -ItemType Directory -Force "logs" | Out-Null
$log = Join-Path $PSScriptRoot "logs\dev.log"
$dev = Start-Process cmd.exe -ArgumentList "/c npm run dev > `"$log`" 2>&1" -WindowStyle Hidden -PassThru

function Detener-App {
  if ($dev -and -not $dev.HasExited) { taskkill /PID $dev.Id /T /F *> $null }
}

try {
  $listo = $false
  for ($i = 0; $i -lt 60 -and -not $listo; $i++) {
    Start-Sleep -Seconds 1
    if ($dev.HasExited) { break }
    try {
      # Se consulta cada servicio directamente para no provocar errores de proxy en Vite.
      Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 "http://localhost:3000/health" | Out-Null
      Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 "http://localhost:5173/" | Out-Null
      $listo = $true
    } catch { Write-Host "." -NoNewline }
  }
  Write-Host ""
  if (-not $listo) {
    Write-Host "Ultimas lineas de $log`:" -ForegroundColor Yellow
    Get-Content $log -Tail 20 -ErrorAction SilentlyContinue
    Fallo "La aplicacion no respondio en 60 segundos."
  }

  Start-Process "http://localhost:5173"
  Write-Host ""
  Write-Host "============================================================" -ForegroundColor Green
  Write-Host " La aplicacion esta lista." -ForegroundColor Green
  if ($ipLan) {
    Write-Host " Desde otros equipos de la red, accede a:" -ForegroundColor Green
    Write-Host "     http://${ipLan}:5173" -ForegroundColor White
  } else {
    Write-Host " No se encontro una IP 192.168.*; solo hay acceso local." -ForegroundColor Yellow
  }
  Write-Host " Desde este equipo: http://localhost:5173" -ForegroundColor Green
  Write-Host "============================================================" -ForegroundColor Green
  Write-Host "Supabase Studio: http://127.0.0.1:54323 | Logs: $log"
  Write-Host ""
  Read-Host "Presiona Enter para detener la aplicacion y cerrar" | Out-Null
} finally {
  Detener-App
}
Write-Host "Aplicacion detenida. La base de datos sigue corriendo (npm run db:stop para detenerla)."
