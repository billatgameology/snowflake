param(
  [ValidateSet('launch','resume')][string]$Mode='launch',
  [ValidateRange(1,32)][int]$Workers=32
)
$ErrorActionPreference='Stop'
$taskRoot=Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $taskRoot
$env:PSModulePath=Join-Path $env:SystemRoot 'System32/WindowsPowerShell/v1.0/Modules'
$taskNode=(Get-Command node.exe).Source
$taskRequired='v'+(Get-Content -LiteralPath (Join-Path $taskRoot '.nvmrc') -Raw).Trim()
if ((& $taskNode --version) -ne $taskRequired) { throw "Use the registered Node runtime $taskRequired" }
$taskEntry=Join-Path $taskRoot 'runner/src/bld-growth-dynamics-oct21-main.ts'
$taskCampaign=Join-Path $taskRoot 'out/bld-growth-dynamics-oct21'
$taskLogs=Join-Path $taskRoot 'out/bld-growth-dynamics-oct21-controls'
$null=New-Item -ItemType Directory -Path $taskLogs -Force
$taskPrefix=Join-Path $taskLogs ("campaign-$Mode-"+(Get-Date -Format 'yyyyMMddTHHmmssfff'))
$taskStarted=[DateTime]::UtcNow.ToString('o')
$taskArguments=@($taskEntry,$Mode,'BLD',$taskCampaign,'--workers',[string]$Workers)
$taskRecord=@{mode=$Mode;command=@($taskNode)+$taskArguments;source=(git rev-parse HEAD);startedUtc=$taskStarted;wrapperPid=$PID;PSModulePath=$env:PSModulePath;stdout="$taskPrefix.stdout.log";stderr="$taskPrefix.stderr.log"}
$taskRecord | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath "$taskPrefix-invocation.json"
try {
  $taskQuotedArguments=$taskArguments | ForEach-Object { '"'+$_+'"' }
  $taskChild=Start-Process -FilePath $taskNode -ArgumentList $taskQuotedArguments -WorkingDirectory $taskRoot -WindowStyle Hidden -RedirectStandardOutput "$taskPrefix.stdout.log" -RedirectStandardError "$taskPrefix.stderr.log" -PassThru
  $null=$taskChild.Handle
  $taskRecord.coordinatorPid=$taskChild.Id
  $taskRecord | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath "$taskPrefix-invocation.json"
  $taskChild.WaitForExit()
  $taskCode=$taskChild.ExitCode
  @{mode=$Mode;exitCode=$taskCode;startedUtc=$taskStarted;finishedUtc=[DateTime]::UtcNow.ToString('o');stdout="$taskPrefix.stdout.log";stderr="$taskPrefix.stderr.log"} | ConvertTo-Json | Set-Content -LiteralPath "$taskPrefix-exit.json"
  exit $taskCode
} catch {
  @{mode=$Mode;startedUtc=$taskStarted;failedUtc=[DateTime]::UtcNow.ToString('o');error=$_.Exception.Message} | ConvertTo-Json | Set-Content -LiteralPath "$taskPrefix-wrapper-error.json"
  throw
}
