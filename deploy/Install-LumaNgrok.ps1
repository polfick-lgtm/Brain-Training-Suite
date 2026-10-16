param([Parameter(Mandatory=$true)][string]$ExpectedHash,[Parameter(Mandatory=$true)][string]$Domain,[switch]$ProbeOnly)
$ErrorActionPreference='Stop'
$root='C:\LumaApi\tunnel'
$resultPath=Join-Path $root 'install-result.json'
try {
    if($Domain -notmatch '^[a-z0-9-]+\.ngrok-free\.(dev|app)$'){throw 'Invalid personal ngrok domain.'}
    $binary=Join-Path $root 'bin\ngrok.exe'
    if((Get-FileHash -LiteralPath $binary -Algorithm SHA256).Hash -ne $ExpectedHash){throw 'ngrok binary hash mismatch.'}
    $versionText=(& $binary version 2>&1 | Out-String).Trim()
    if($LASTEXITCODE -ne 0 -or $versionText -notmatch '^ngrok version [0-9]+\.[0-9]+\.[0-9]+'){throw 'ngrok cannot run on this server.'}
    $result=@{status='COMPATIBLE';version=$versionText;at=(Get-Date).ToString('o')}
    if(-not $ProbeOnly){
        $config=Join-Path $root 'private\ngrok.yml'
        $null=& $binary config check --config $config 2>&1
        if($LASTEXITCODE -ne 0){throw 'ngrok configuration validation failed; token not logged.'}
        $health=Invoke-RestMethod -Uri 'http://127.0.0.1:8796/api/health' -TimeoutSec 10
        if($health.application -ne 'luma' -or $health.status -ne 'ok'){throw 'Luma API health check failed.'}
        $arguments='http http://127.0.0.1:8796 --url https://'+$Domain+' --inspect=false --log=false --config "'+$config+'"'
        $action=New-ScheduledTaskAction -Execute $binary -Argument $arguments -WorkingDirectory $root
        $trigger=New-ScheduledTaskTrigger -AtStartup
        $principal=New-ScheduledTaskPrincipal -UserId 'S-1-5-19' -LogonType ServiceAccount -RunLevel Limited
        $settings=New-ScheduledTaskSettingsSet -StartWhenAvailable -RestartCount 99 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew
        if(Get-ScheduledTask -TaskName 'LumaTunnel' -ErrorAction SilentlyContinue){throw 'LumaTunnel already exists; inspect before replacing it.'}
        Register-ScheduledTask -TaskName 'LumaTunnel' -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description 'Personal Luma API HTTPS tunnel; loopback upstream; no request-body inspection.' | Out-Null
        Start-ScheduledTask -TaskName 'LumaTunnel'
        $result.status='TUNNEL_STARTED_UNVERIFIED'
        $result.url='https://'+$Domain
    }
    $result | ConvertTo-Json | Set-Content -LiteralPath $resultPath -Encoding UTF8
} catch {
    @{status='FAILED';error=$_.Exception.Message;at=(Get-Date).ToString('o')} | ConvertTo-Json | Set-Content -LiteralPath $resultPath -Encoding UTF8
    exit 1
}
