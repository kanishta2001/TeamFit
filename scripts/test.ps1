# Create an isolated database, run the real API tests, and always clean up our own fixtures.
param([int]$Port = 5274, [int]$FrontendPort = 3002, [switch]$Browser, [switch]$WorkflowOnly, [switch]$KeepRunning)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $root 'backend'
$database = 'TeamFitTest_' + [Guid]::NewGuid().ToString('N')
$logDirectory = Join-Path ([IO.Path]::GetTempPath()) $database
$testBinaryDirectory = Join-Path $logDirectory 'api'
New-Item -ItemType Directory -Path $logDirectory | Out-Null
$process = $null
$frontendProcess = $null
$names = @('ASPNETCORE_ENVIRONMENT','ASPNETCORE_URLS','ConnectionStrings__DefaultConnection','Jwt__Key','Frontend__Origin','NEXT_PUBLIC_API_URL','TEAMFIT_UI_URL','TEAMFIT_TEST_API','TEAMFIT_ISOLATED_TEST')
$previous = @{}
foreach ($name in $names) { $previous[$name] = [Environment]::GetEnvironmentVariable($name, 'Process') }
try {
    if (Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue) { throw "Port $Port is in use. Choose a different -Port." }
    $env:ASPNETCORE_ENVIRONMENT = 'Development'
    $env:ASPNETCORE_URLS = "http://localhost:$Port"
    $env:Frontend__Origin = "http://localhost:$FrontendPort"
    $env:NEXT_PUBLIC_API_URL = "http://localhost:$Port"
    $env:TEAMFIT_UI_URL = "http://localhost:$FrontendPort"
    $env:ConnectionStrings__DefaultConnection = "Server=localhost;Database=$database;Trusted_Connection=True;TrustServerCertificate=True"
    $bytes = New-Object byte[] 64
    $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    $rng.Dispose()
    $env:Jwt__Key = [Convert]::ToBase64String($bytes)
    $env:TEAMFIT_TEST_API = "http://localhost:$Port"
    $env:TEAMFIT_ISOLATED_TEST = 'true'
    Push-Location $backend
    try {
        dotnet tool restore
        if ($LASTEXITCODE -ne 0) { throw 'Tool restore failed.' }
        dotnet build --configuration Release --output $testBinaryDirectory
        if ($LASTEXITCODE -ne 0) { throw 'Backend build failed.' }
        # Build the EF model in Release too, so migrations always match the API binary under test.
        $migrationOutput = dotnet tool run dotnet-ef database update --configuration Release 2>&1
        if ($LASTEXITCODE -ne 0) { $migrationOutput; throw 'Test database migration failed.' }
        Write-Host 'Test database migrated.'
    } finally { Pop-Location }
    $process = Start-Process dotnet -ArgumentList (Join-Path $testBinaryDirectory 'TeamFit.Api.dll') -WorkingDirectory $backend -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logDirectory 'api.log') -RedirectStandardError (Join-Path $logDirectory 'error.log')
    $ready = $false
    for ($attempt = 0; $attempt -lt 60; $attempt++) {
        if ($process.HasExited) { throw "API exited. See $logDirectory" }
        try { Invoke-RestMethod "$env:TEAMFIT_TEST_API/api/options" | Out-Null; $ready = $true; break } catch { Start-Sleep -Seconds 1 }
    }
    if (-not $ready) { throw "API did not start. See $logDirectory" }
    node --test (Join-Path $root 'tests/api.test.mjs')
    if ($LASTEXITCODE -ne 0) { throw "API tests failed. Logs: $logDirectory" }
    if ($Browser) {
        if (Get-NetTCPConnection -State Listen -LocalPort $FrontendPort -ErrorAction SilentlyContinue) { throw "Frontend port $FrontendPort is in use. Choose a different -FrontendPort." }
        $frontend = Join-Path $root 'frontend'
        Push-Location $frontend
        try {
            npm run build
            if ($LASTEXITCODE -ne 0) { throw 'Frontend build failed.' }
            $frontendProcess = Start-Process node -ArgumentList "node_modules/next/dist/bin/next start --port $FrontendPort" -WorkingDirectory $frontend -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logDirectory 'frontend.log') -RedirectStandardError (Join-Path $logDirectory 'frontend-error.log')
            $frontendReady = $false
            for ($attempt = 0; $attempt -lt 60; $attempt++) {
                if ($frontendProcess.HasExited) { throw "Frontend exited. See $logDirectory" }
                try { Invoke-WebRequest "http://localhost:$FrontendPort/workspace" -UseBasicParsing | Out-Null; $frontendReady = $true; break } catch { Start-Sleep -Seconds 1 }
            }
            if (-not $frontendReady) { throw 'Frontend did not start.' }
            if ($WorkflowOnly) { npx playwright test tests/workflow.spec.ts }
            else { npx playwright test }
            if ($LASTEXITCODE -ne 0) { throw "Browser tests failed. Logs: $logDirectory" }
        } finally { Pop-Location }
    }
    if ($KeepRunning) {
        Write-Host "Isolated API stays available at $env:TEAMFIT_TEST_API for browser testing. Database: $database"
        Write-Host 'Press Enter after browser checks to stop it and remove the test database.'
        Read-Host | Out-Null
    }
} finally {
    if ($frontendProcess -and -not $frontendProcess.HasExited) { Stop-Process -Id $frontendProcess.Id -Force }
    if ($process -and -not $process.HasExited) { Stop-Process -Id $process.Id -Force }
    # Only this exact randomly named test database may be dropped, never TeamFitDb.
    if ($database -match '^TeamFitTest_[a-f0-9]{32}$') {
        sqlcmd -S localhost -E -C -b -Q "IF DB_ID(N'$database') IS NOT NULL BEGIN ALTER DATABASE [$database] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [$database]; END"
        if ($LASTEXITCODE -ne 0) { Write-Warning "Could not remove test database $database." }
    }
    foreach ($name in $names) { [Environment]::SetEnvironmentVariable($name, $previous[$name], 'Process') }
}
