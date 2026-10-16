param(
    [Parameter(Mandatory=$true)][ValidatePattern('^\d{8}-\d{6}$')][string]$Release
)
$ErrorActionPreference='Stop'
$root='C:\LumaApi'
$releaseRoot=Join-Path $root ('releases\'+$Release)
$resultPath=Join-Path $releaseRoot 'install-result.json'
$taskName='LumaApi'
$oldTaskXml=$null
$registered=$false
$taskStopped=$false
try {
    if (-not (Test-Path -LiteralPath (Join-Path $releaseRoot 'manifest.json'))) { throw 'Missing release manifest.' }
    $manifest=Get-Content -LiteralPath (Join-Path $releaseRoot 'manifest.json') -Raw | ConvertFrom-Json
    foreach($entry in $manifest){
        $file=[IO.Path]::GetFullPath((Join-Path $releaseRoot $entry.path))
        if(-not $file.StartsWith($releaseRoot+'\',[StringComparison]::OrdinalIgnoreCase)){throw 'Invalid manifest path.'}
        if((Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash -ne $entry.sha256){throw 'Release hash mismatch.'}
    }
    $memory=(Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory
    $disk=(Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'").FreeSpace
    if($memory -lt 524288 -or $disk -lt 1073741824){throw 'Insufficient free memory or disk for an isolated installation.'}
    $existing=Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    if($existing){
        if(@($existing.Actions | Where-Object {$_.Execute -ne (Join-Path $root 'runtime\python.exe')}).Count){throw 'An unrelated task already uses the LumaApi name.'}
        $oldTaskXml=Export-ScheduledTask -TaskName $taskName
        $oldTaskXml | Set-Content -LiteralPath (Join-Path $releaseRoot 'previous-task.xml') -Encoding Unicode
    }
    $port=Get-NetTCPConnection -LocalPort 8796 -State Listen -ErrorAction SilentlyContinue
    foreach($listener in $port){
        $owner=Get-CimInstance Win32_Process -Filter ('ProcessId='+$listener.OwningProcess)
        if($owner.ExecutablePath -ne (Join-Path $root 'runtime\python.exe')){throw 'Port 8796 belongs to another application.'}
    }
    $runtime=Join-Path $root 'runtime'
    if(-not (Test-Path -LiteralPath (Join-Path $runtime 'python.exe'))){
        $source='C:\BybitPaper\runtime'
        New-Item -ItemType Directory -Path $runtime -Force | Out-Null
        # Interpreter and standard library only; do not copy Bybit application files or packages.
        foreach($name in @('python.exe','python3.dll','python312.dll','vcruntime140.dll','vcruntime140_1.dll','LICENSE.txt')){
            Copy-Item -LiteralPath (Join-Path $source $name) -Destination (Join-Path $runtime $name)
            if((Get-FileHash (Join-Path $source $name)).Hash -ne (Get-FileHash (Join-Path $runtime $name)).Hash){throw 'Runtime copy verification failed.'}
        }
        & robocopy.exe (Join-Path $source 'Lib') (Join-Path $runtime 'Lib') /E /XD site-packages __pycache__ /XF sitecustomize.py usercustomize.py /NFL /NDL /NJH /NJS /NP | Out-Null
        if($LASTEXITCODE -gt 7){throw 'Standard library copy failed.'}
        & robocopy.exe (Join-Path $source 'DLLs') (Join-Path $runtime 'DLLs') /E /NFL /NDL /NJH /NJS /NP | Out-Null
        if($LASTEXITCODE -gt 7){throw 'Runtime DLL copy failed.'}
    }
    $python=Join-Path $runtime 'python.exe'
    $lib=Join-Path $releaseRoot 'lib'
    New-Item -ItemType Directory -Path $lib -Force | Out-Null
    $wheel=Get-ChildItem -LiteralPath (Join-Path $releaseRoot 'wheels') -Filter 'waitress-3.0.2-*.whl' -File
    if(@($wheel).Count -ne 1){throw 'Expected exactly one pinned Waitress wheel.'}
    & $python -c "import sys,zipfile; zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])" $wheel.FullName $lib
    if($LASTEXITCODE -ne 0){throw 'Library extraction failed.'}
    & $python -c "import sqlite3,hashlib; hashlib.pbkdf2_hmac('sha256',b'test',b'test',600000); print('RUNTIME_OK')"
    if($LASTEXITCODE -ne 0){throw 'Isolated runtime preflight failed.'}
    $database=Join-Path $root 'data\luma.sqlite3'
    if(Test-Path -LiteralPath $database){
        $backup=Join-Path $root ('backups\luma-'+$Release+'.sqlite3')
        & $python -c "import sqlite3,sys; a=sqlite3.connect(sys.argv[1]); b=sqlite3.connect(sys.argv[2]); a.backup(b); b.close(); a.close()" $database $backup
        if($LASTEXITCODE -ne 0){throw 'Database backup failed.'}
    }
    if($existing){Stop-ScheduledTask -TaskName $taskName;$taskStopped=$true}
    Get-CimInstance Win32_Process | Where-Object {$_.ExecutablePath -eq $python -and $_.CommandLine -like '*\LumaApi\releases\*\app\run.py*'} | ForEach-Object {Stop-Process -Id $_.ProcessId -Force}
    $action=New-ScheduledTaskAction -Execute $python -Argument ('-I "'+(Join-Path $releaseRoot 'app\run.py')+'" --config "'+(Join-Path $root 'config\config.json')+'"') -WorkingDirectory (Join-Path $releaseRoot 'app')
    $principal=New-ScheduledTaskPrincipal -UserId 'S-1-5-19' -LogonType ServiceAccount -RunLevel Limited
    $settings=New-ScheduledTaskSettingsSet -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger (New-ScheduledTaskTrigger -AtStartup) -Principal $principal -Settings $settings -Force | Out-Null
    $registered=$true
    Start-ScheduledTask -TaskName $taskName
    $healthy=$false
    for($i=0;$i -lt 20;$i++){
        Start-Sleep -Seconds 2
        try {$health=Invoke-RestMethod 'http://127.0.0.1:8796/api/health' -TimeoutSec 2; if($health.status -eq 'ok' -and $health.application -eq 'luma'){$healthy=$true;break}} catch {}
    }
    if(-not $healthy){throw 'Luma health check failed.'}
    $dbCheck=& $python -c "import sqlite3,sys; c=sqlite3.connect(sys.argv[1]); print(c.execute('PRAGMA integrity_check').fetchone()[0]); print(c.execute('SELECT count(*) FROM accounts WHERE role=?',('admin',)).fetchone()[0]); c.close()" $database
    if($LASTEXITCODE -ne 0 -or $dbCheck[0] -ne 'ok' -or [int]$dbCheck[1] -lt 1){throw 'Database or initial administrator validation failed.'}
    @{status='DEPLOYED_LOOPBACK_ONLY';release=$Release;task=$taskName;health=$health;database_integrity='ok';administrator_created=$true;at=(Get-Date).ToString('o')} | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $resultPath -Encoding UTF8
} catch {
    $failure=$_.Exception.Message
    $rollback='not_required'
    if($registered -or $taskStopped){
        try {
            Stop-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
            $runtimePython=Join-Path $root 'runtime\python.exe'
            Get-CimInstance Win32_Process | Where-Object {$_.ExecutablePath -eq $runtimePython -and $_.CommandLine -like '*\LumaApi\releases\*\app\run.py*'} | ForEach-Object {Stop-Process -Id $_.ProcessId -Force}
            if($oldTaskXml){Register-ScheduledTask -TaskName $taskName -Xml $oldTaskXml -Force | Out-Null; Start-ScheduledTask -TaskName $taskName; $rollback='previous_task_restored'}else{$rollback='new_task_stopped'}
        } catch {$rollback='rollback_failed'}
    }
    @{status='FAILED';error=$failure;rollback=$rollback;at=(Get-Date).ToString('o')} | ConvertTo-Json | Set-Content -LiteralPath $resultPath -Encoding UTF8
}
