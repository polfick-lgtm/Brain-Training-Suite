param([Parameter(Mandatory=$true)][string]$WheelPath,[string]$ResultPath,[string]$AdminEmail='admin@luma.local')
$ErrorActionPreference='Stop'
$project=Split-Path -Parent $PSScriptRoot
$release=Get-Date -Format 'yyyyMMdd-HHmmss'
$credential=$null;$session=$null;$driveCreated=$false
try {
    if((Split-Path -Leaf $WheelPath) -notlike 'waitress-3.0.2-*.whl' -or -not (Test-Path -LiteralPath $WheelPath)){throw 'Provide the pinned Waitress 3.0.2 wheel.'}
    $credential=Get-Credential -UserName '192.168.196.176\administrator' -Message 'Luma: installazione isolata sul server .176. Nessuna modifica a Bybit.'
    if(-not $credential){throw 'Server authentication cancelled.'}
    $session=New-CimSession -ComputerName '192.168.196.176' -Credential $credential -SessionOption (New-CimSessionOption -Protocol Dcom)
    New-PSDrive -Name LumaDeploy176 -PSProvider FileSystem -Root '\\192.168.196.176\C$' -Credential $credential | Out-Null
    $driveCreated=$true
    $root='LumaDeploy176:\LumaApi'
    if(-not (Test-Path -LiteralPath $root)){
        New-Item -ItemType Directory -Path $root | Out-Null
        $acl=New-Object System.Security.AccessControl.DirectorySecurity
        $acl.SetAccessRuleProtection($true,$false)
        foreach($sid in @('S-1-5-18','S-1-5-32-544')){
            $rule=New-Object System.Security.AccessControl.FileSystemAccessRule((New-Object System.Security.Principal.SecurityIdentifier($sid)),'FullControl','ContainerInherit,ObjectInherit','None','Allow')
            $acl.AddAccessRule($rule)
        }
        $acl.AddAccessRule((New-Object System.Security.AccessControl.FileSystemAccessRule((New-Object System.Security.Principal.SecurityIdentifier('S-1-5-19')),'ReadAndExecute','ContainerInherit,ObjectInherit','None','Allow')))
        Set-Acl -LiteralPath $root -AclObject $acl
    }
    foreach($dir in @('data','config','backups',('releases\'+$release+'\app'),('releases\'+$release+'\wheels'))){New-Item -ItemType Directory -Path (Join-Path $root $dir) -Force | Out-Null}
    $data=Join-Path $root 'data'
    $dataAcl=Get-Acl -LiteralPath $data
    $dataAcl.AddAccessRule((New-Object System.Security.AccessControl.FileSystemAccessRule((New-Object System.Security.Principal.SecurityIdentifier('S-1-5-19')),'Modify','ContainerInherit,ObjectInherit','None','Allow')))
    Set-Acl -LiteralPath $data -AclObject $dataAcl
    $remoteConfig=Join-Path $root 'config\config.json'
    if(-not (Test-Path -LiteralPath $remoteConfig)){Copy-Item -LiteralPath (Join-Path $project 'server\config.example.json') -Destination $remoteConfig}
    if(-not (Test-Path -LiteralPath (Join-Path $data 'luma.sqlite3')) -or (Test-Path -LiteralPath (Join-Path $data 'bootstrap-admin.json'))){
        $appCredential=Get-Credential -UserName $AdminEmail -Message 'Luma: scegli la password del tuo NUOVO account amministratore (almeno 12 caratteri). Questa non è la password Windows.'
        if(-not $appCredential){throw 'Administrator setup cancelled.'}
        $password=$appCredential.GetNetworkCredential().Password
        if($password.Length -lt 12 -or $password.Length -gt 128){throw 'Administrator password must contain 12-128 characters.'}
        $salt=New-Object byte[] 16
        $rng=[Security.Cryptography.RandomNumberGenerator]::Create();$rng.GetBytes($salt);$rng.Dispose()
        $derive=[Security.Cryptography.Rfc2898DeriveBytes]::new($password,$salt,600000,[Security.Cryptography.HashAlgorithmName]::SHA256)
        $hash=$derive.GetBytes(32);$derive.Dispose()
        $saltHex=([BitConverter]::ToString($salt)).Replace('-','').ToLowerInvariant()
        $hashHex=([BitConverter]::ToString($hash)).Replace('-','').ToLowerInvariant()
        @{email=$appCredential.UserName;password_hash=('pbkdf2_sha256$600000${0}${1}' -f $saltHex,$hashHex)} | ConvertTo-Json -Compress | Set-Content -LiteralPath (Join-Path $data 'bootstrap-admin.json') -Encoding UTF8
        $password=$null;$appCredential=$null;$hash=$null;$hashHex=$null
    }
    $remoteRelease=Join-Path $root ('releases\'+$release)
    $manifest=@()
    foreach($name in @('luma_api.py','run.py','requirements.txt')){
        $local=Join-Path $project ('server\'+$name)
        $manifest+=@{path=('app\'+$name);sha256=(Get-FileHash -LiteralPath $local -Algorithm SHA256).Hash}
        Copy-Item -LiteralPath $local -Destination (Join-Path $remoteRelease ('app\'+$name))
    }
    $manifest+=@{path=('wheels\'+(Split-Path -Leaf $WheelPath));sha256=(Get-FileHash -LiteralPath $WheelPath -Algorithm SHA256).Hash}
    $manifest+=@{path='install.ps1';sha256=(Get-FileHash -LiteralPath (Join-Path $PSScriptRoot 'Install-LumaServer.ps1') -Algorithm SHA256).Hash}
    Copy-Item -LiteralPath $WheelPath -Destination (Join-Path $remoteRelease 'wheels')
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'Install-LumaServer.ps1') -Destination (Join-Path $remoteRelease 'install.ps1')
    $manifest | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $remoteRelease 'manifest.json') -Encoding UTF8
    $command='powershell.exe -NoProfile -NonInteractive -File "C:\LumaApi\releases\'+$release+'\install.ps1" -Release '+$release
    $start=Invoke-CimMethod -CimSession $session -ClassName Win32_Process -MethodName Create -Arguments @{CommandLine=$command}
    if($start.ReturnValue -ne 0){throw 'Could not start the isolated remote installer.'}
    $result=Join-Path $remoteRelease 'install-result.json'
    for($i=0;$i -lt 60;$i++){if(Test-Path -LiteralPath $result){break};Start-Sleep -Seconds 2}
    if(-not (Test-Path -LiteralPath $result)){throw 'Remote installer did not finish; inspect C:\LumaApi before retrying.'}
    Get-Content -LiteralPath $result -Raw
    if($ResultPath){Get-Content -LiteralPath $result -Raw | Set-Content -LiteralPath $ResultPath -Encoding UTF8}
} catch {
    if($ResultPath){@{status='LOCAL_DEPLOY_FAILED';error=$_.Exception.Message;at=(Get-Date).ToString('o')} | ConvertTo-Json | Set-Content -LiteralPath $ResultPath -Encoding UTF8}
    throw
} finally {
    if($session){Remove-CimSession $session}
    if($driveCreated){Remove-PSDrive LumaDeploy176}
    $credential=$null
}
