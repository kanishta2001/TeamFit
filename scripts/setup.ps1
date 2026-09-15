# Run once from the repository root. Re-running preserves an existing JWT secret and .env.local.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Push-Location (Join-Path $root 'backend')
try {
    dotnet restore
    if ($LASTEXITCODE -ne 0) { throw 'Backend restore failed.' }
    dotnet tool restore
    if ($LASTEXITCODE -ne 0) { throw 'EF tool restore failed.' }
    $existingKey = dotnet user-secrets list | Where-Object { $_ -like 'Jwt:Key = *' }
    if (-not $existingKey) {
        $bytes = New-Object byte[] 64
        $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
        $rng.GetBytes($bytes)
        $rng.Dispose()
        @{ 'Jwt:Key' = [Convert]::ToBase64String($bytes) } | ConvertTo-Json | dotnet user-secrets set
        if ($LASTEXITCODE -ne 0) { throw 'Could not store the local JWT secret.' }
    }
    dotnet tool run dotnet-ef database update
    if ($LASTEXITCODE -ne 0) { throw 'Migration failed. Check SQL Server and stop any running backend before retrying.' }
} finally { Pop-Location }
Push-Location (Join-Path $root 'frontend')
try {
    if (-not (Test-Path '.env.local')) { Copy-Item -LiteralPath '.env.example' -Destination '.env.local' }
    npm ci
    if ($LASTEXITCODE -ne 0) { throw 'Frontend dependency installation failed.' }
} finally { Pop-Location }
Write-Host 'Setup complete. Start backend and frontend in two terminals as shown in README.md.'
