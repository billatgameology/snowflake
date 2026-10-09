param([ValidateSet('launch','resume')][string]$Mode='launch')
$ErrorActionPreference='Stop'
$taskRoot='C:/Users/biao3/.codex/worktrees/hil-warm-refinement/snowflake'
Set-Location $taskRoot
$env:PSModulePath=Join-Path $env:SystemRoot 'System32/WindowsPowerShell/v1.0/Modules'
$taskEntry=Join-Path $taskRoot 'runner/src/hil-warm-refinement-main.ts'
$taskCampaign=Join-Path $taskRoot 'out/warm-refinement-hil'
$taskProbe=Join-Path $taskRoot 'out/warm-refinement-probe-v2/probe.json'
$taskStamp=Get-Date -Format 'yyyyMMddTHHmmssfff'
$taskPrefix=Join-Path $PSScriptRoot ("campaign-$Mode-$taskStamp")
$started=[DateTime]::UtcNow.ToString('o')
@{mode=$Mode;command=@('node',$taskEntry,$Mode,'HIL',$taskCampaign,$taskProbe);source=(git rev-parse HEAD);startedUtc=$started;pid=$PID;PSModulePath=$env:PSModulePath} | ConvertTo-Json -Depth 4 | Set-Content "$taskPrefix-invocation.json"
& node $taskEntry $Mode HIL $taskCampaign $taskProbe 1> "$taskPrefix.stdout.log" 2> "$taskPrefix.stderr.log"
$code=$LASTEXITCODE
@{mode=$Mode;exitCode=$code;startedUtc=$started;finishedUtc=[DateTime]::UtcNow.ToString('o');stdout="$taskPrefix.stdout.log";stderr="$taskPrefix.stderr.log"} | ConvertTo-Json | Set-Content "$taskPrefix-exit.json"
exit $code
