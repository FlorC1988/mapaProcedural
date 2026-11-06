# Detiene backend y frontend del proyecto (lanzados por iniciar.cmd / npm run dev).
# Solo mata procesos cuyo CommandLine apunta a ESTE directorio del proyecto.
$ErrorActionPreference = "Continue"
$detenido = $false

# 1) Procesos escuchando en los puertos de la app (backend :3000, frontend :5173)
foreach ($puerto in 3000, 5173) {
  $conexiones = Get-NetTCPConnection -LocalPort $puerto -State Listen -ErrorAction SilentlyContinue
  foreach ($c in $conexiones) {
    $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$($c.OwningProcess)"
    if ($proc -and $proc.CommandLine -like "*$PSScriptRoot*") {
      Write-Host "Deteniendo PID $($c.OwningProcess) (puerto $puerto): $($proc.Name)"
      taskkill /PID $c.OwningProcess /T /F *> $null
      $detenido = $true
    }
  }
}

# 2) El lanzador scripts/dev.mjs y sus envoltorios npm (no escuchan puertos)
Get-CimInstance Win32_Process -Filter "Name='node.exe' or Name='cmd.exe'" -ErrorAction SilentlyContinue |
  Where-Object { $_.CommandLine -like "*$PSScriptRoot*" -and $_.CommandLine -like "*dev.mjs*" } |
  ForEach-Object {
    Write-Host "Deteniendo lanzador dev.mjs (PID $($_.ProcessId))"
    taskkill /PID $_.ProcessId /T /F *> $null
    $detenido = $true
  }

if ($detenido) { Write-Host "Aplicacion detenida." } else { Write-Host "No habia procesos de la app corriendo." }
