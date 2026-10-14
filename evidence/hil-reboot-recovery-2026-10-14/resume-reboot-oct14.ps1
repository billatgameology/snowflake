$Mode='reboot-resume'
$ErrorActionPreference='Stop'
$taskRoot='C:/Users/biao3/.codex/worktrees/hil-two-day-oct12/snowflake'
Set-Location $taskRoot
$env:PSModulePath=Join-Path $env:SystemRoot 'System32/WindowsPowerShell/v1.0/Modules'
$taskEntry=Join-Path $taskRoot 'runner/src/hil-two-day-oct12-main.ts'
$taskCampaign=Join-Path $taskRoot 'out/hil-two-day-oct12'
$taskPrefix=Join-Path $PSScriptRoot ("campaign-$Mode-"+(Get-Date -Format 'yyyyMMddTHHmmssfff'))
$started=[DateTime]::UtcNow.ToString('o')
$taskHelper=Join-Path $PSScriptRoot 'resume-reboot-oct14.mjs'
$taskArguments=@($taskHelper,$taskEntry,$taskCampaign)
$taskRecord=@{mode=$Mode;command=@('node')+$taskArguments;source=(git rev-parse HEAD);startedUtc=$started;wrapperPid=$PID;PSModulePath=$env:PSModulePath;stdout="$taskPrefix.stdout.log";stderr="$taskPrefix.stderr.log"}
$taskRecord | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath "$taskPrefix-invocation.json"
try {
  $taskChild=Start-Process -FilePath (Get-Command node.exe).Source -ArgumentList $taskArguments -WorkingDirectory $taskRoot -WindowStyle Hidden -RedirectStandardOutput "$taskPrefix.stdout.log" -RedirectStandardError "$taskPrefix.stderr.log" -PassThru
  $null=$taskChild.Handle
  $taskRecord.coordinatorPid=$taskChild.Id
  $taskRecord | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath "$taskPrefix-invocation.json"
  $taskChild.WaitForExit()
  $taskCode=$taskChild.ExitCode
  @{mode=$Mode;exitCode=$taskCode;startedUtc=$started;finishedUtc=[DateTime]::UtcNow.ToString('o');stdout="$taskPrefix.stdout.log";stderr="$taskPrefix.stderr.log"} | ConvertTo-Json | Set-Content -LiteralPath "$taskPrefix-exit.json"
  exit $taskCode
} catch {
  @{mode=$Mode;startedUtc=$started;failedUtc=[DateTime]::UtcNow.ToString('o');error=$_.Exception.Message} | ConvertTo-Json | Set-Content -LiteralPath "$taskPrefix-wrapper-error.json"
  throw
}
