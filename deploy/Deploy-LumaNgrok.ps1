param(
    [Parameter(Mandatory=$true)][string]$BinaryPath,
    [Parameter(Mandatory=$true)][string]$WheelPath,
    [Parameter(Mandatory=$true)][string]$EncryptedTokenPath,
    [Parameter(Mandatory=$true)][string]$Domain,
    [Parameter(Mandatory=$true)][string]$ResultPath,
    [switch]$SkipBackendUpdate
)
$ErrorActionPreference='Stop'
$credential=$null;$session=$null;$driveCreated=$false;$plainToken=$null
function Invoke-LumaTunnelInstaller([switch]$ProbeOnly) {
    $resultFile='LumaTunnel176:\LumaApi\tunnel\install-result.json'
    if(Test-Path -LiteralPath $resultFile){Remove-Item -LiteralPath $resultFile}
    $command='powershell.exe -NoProfile -NonInteractive -File "C:\LumaApi\tunnel\install.ps1" -ExpectedHash '+$binaryHash+' -Domain '+$Domain
    if($ProbeOnly){$command+=' -ProbeOnly'}
    $start=Invoke-CimMethod -CimSession $session -ClassName Win32_Process -MethodName Create -Arguments @{CommandLine=$command}
    if($start.ReturnValue -ne 0){throw 'Could not start the remote Luma tunnel installer.'}
    for($i=0;$i -lt 45;$i++){
        if(Test-Path -LiteralPath $resultFile){return (Get-Content -LiteralPath $resultFile -Raw | ConvertFrom-Json)}
        Start-Sleep -Seconds 2
    }
    throw 'Remote tunnel preparation timed out.'
}
try {
    if($Domain -notmatch '^[a-z0-9-]+\.ngrok-free\.(dev|app)$'){throw 'Invalid personal ngrok domain.'}
    $binaryHash=(Get-FileHash -LiteralPath $BinaryPath -Algorithm SHA256).Hash
    $credential=Get-Credential -UserName '192.168.196.176\administrator' -Message 'Luma: verifica e installazione del tunnel ngrok personale sul server .176.'
    if(-not $credential){throw 'Server authentication cancelled.'}
    $session=New-CimSession -ComputerName '192.168.196.176' -Credential $credential -SessionOption (New-CimSessionOption -Protocol Dcom)
    New-PSDrive -Name LumaTunnel176 -PSProvider FileSystem -Root '\\192.168.196.176\C$' -Credential $credential | Out-Null
    $driveCreated=$true
    $root='LumaTunnel176:\LumaApi\tunnel'
    if(-not(Test-Path -LiteralPath 'LumaTunnel176:\LumaApi\config\config.json')){throw 'Install the isolated Luma API before its tunnel.'}
    New-Item -ItemType Directory -Path (Join-Path $root 'bin') -Force | Out-Null
    Copy-Item -LiteralPath $BinaryPath -Destination (Join-Path $root 'bin\ngrok.exe')
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'Install-LumaNgrok.ps1') -Destination (Join-Path $root 'install.ps1')
    $probe=Invoke-LumaTunnelInstaller -ProbeOnly
    if($probe.status -ne 'COMPATIBLE'){throw $probe.error}
    Write-Host ('Compatibilita server verificata: '+$probe.version)
    if(-not $SkipBackendUpdate){
        & (Join-Path $PSScriptRoot 'Deploy-LumaServer.ps1') -WheelPath $WheelPath -ServerCredential $credential -ResultPath ($ResultPath+'.backend.json')
    }
    $backend=Get-Content -LiteralPath ($ResultPath+'.backend.json') -Raw | ConvertFrom-Json
    if($backend.status -ne 'DEPLOYED_LOOPBACK_ONLY'){throw 'Luma backend update failed; no public tunnel started.'}
    $private=Join-Path $root 'private'
    New-Item -ItemType Directory -Path $private -Force | Out-Null
    $acl=[System.Security.AccessControl.DirectorySecurity]::new()
    $acl.SetAccessRuleProtection($true,$false)
    foreach($sid in @('S-1-5-18','S-1-5-32-544')){
        $acl.AddAccessRule([System.Security.AccessControl.FileSystemAccessRule]::new([System.Security.Principal.SecurityIdentifier]::new($sid),'FullControl','ContainerInherit,ObjectInherit','None','Allow'))
    }
    $acl.AddAccessRule([System.Security.AccessControl.FileSystemAccessRule]::new([System.Security.Principal.SecurityIdentifier]::new('S-1-5-19'),'ReadAndExecute','ContainerInherit,ObjectInherit','None','Allow'))
    Set-Acl -LiteralPath $private -AclObject $acl
    $secureToken=(Get-Content -LiteralPath $EncryptedTokenPath -Raw).Trim() | ConvertTo-SecureString
    $tokenCredential=[PSCredential]::new('ngrok',$secureToken)
    $plainToken=$tokenCredential.GetNetworkCredential().Password
    if($plainToken -notmatch '^[a-zA-Z0-9_]{35,200}$'){throw 'Invalid protected ngrok token.'}
    # This file is server-local and readable only by admins, SYSTEM and the task identity.
    "version: 3`nagent:`n  authtoken: $plainToken`n  web_addr: false`n" | Set-Content -LiteralPath (Join-Path $private 'ngrok.yml') -Encoding UTF8
    $plainToken=$null;$tokenCredential=$null;$secureToken.Dispose()
    $installed=Invoke-LumaTunnelInstaller
    if($installed.status -ne 'TUNNEL_STARTED_UNVERIFIED'){throw $installed.error}
    $publicUrl='https://'+$Domain
    $verified=$false
    for($i=0;$i -lt 18;$i++){
        try {
            $response=Invoke-WebRequest -Uri ($publicUrl+'/api/health') -Headers @{'Origin'='https://polfick-lgtm.github.io';'ngrok-skip-browser-warning'='1'} -TimeoutSec 10
            $health=$response.Content | ConvertFrom-Json
            if($health.application -eq 'luma' -and $health.status -eq 'ok' -and $response.Headers['Access-Control-Allow-Origin'] -eq 'https://polfick-lgtm.github.io'){$verified=$true;break}
        } catch { }
        Start-Sleep -Seconds 3
    }
    if(-not $verified){
        $null=Invoke-CimMethod -CimSession $session -ClassName Win32_Process -MethodName Create -Arguments @{CommandLine='powershell.exe -NoProfile -NonInteractive -Command "Stop-ScheduledTask -TaskName LumaTunnel; Disable-ScheduledTask -TaskName LumaTunnel"'}
        throw 'Public HTTPS/CORS check failed; LumaTunnel stopped and disabled.'
    }
    @{status='PUBLIC_HTTPS_VERIFIED';url=$publicUrl;version=$probe.version;backend_release=$backend.release;at=(Get-Date).ToString('o')} | ConvertTo-Json | Set-Content -LiteralPath $ResultPath -Encoding UTF8
    Write-Host 'Luma: tunnel HTTPS e CORS verificati.'
} catch {
    @{status='FAILED';error=$_.Exception.Message;line=$_.InvocationInfo.ScriptLineNumber;at=(Get-Date).ToString('o')} | ConvertTo-Json | Set-Content -LiteralPath $ResultPath -Encoding UTF8
    Write-Host ('Luma: '+$_.Exception.Message)
} finally {
    if($session){Remove-CimSession $session}
    if($driveCreated){Remove-PSDrive LumaTunnel176}
    $credential=$null;$plainToken=$null
}
