$ErrorActionPreference='Stop'
$taskRoot='C:/Users/biao3/.codex/worktrees/hil-warm-refinement/snowflake'
$taskEntry=Join-Path $taskRoot 'runner/src/hil-warm-refinement-main.ts'
$taskCampaign=Join-Path $taskRoot 'out/warm-refinement-hil'
$env:PSModulePath=Join-Path $env:SystemRoot 'System32/WindowsPowerShell/v1.0/Modules'
$taskProbe=Join-Path $taskRoot 'out/warm-refinement-probe-v2'
function Normalize-PathText([string]$value) { $value.Replace([char]92,[char]47) }
$taskProcesses=@(Get-CimInstance Win32_Process)
$taskWrapper=@($taskProcesses | Where-Object { $_.Name -in @('powershell.exe','pwsh.exe') -and $_.ProcessId -ne $PID -and $_.CommandLine -and ((Normalize-PathText $_.CommandLine).Contains((Normalize-PathText (Join-Path $PSScriptRoot 'start-hil.ps1'))) -or (Normalize-PathText $_.CommandLine).Contains((Normalize-PathText (Join-Path $PSScriptRoot 'dispatch-after-probe.ps1'))) -or $_.CommandLine.Contains('out/warm-refinement-control/probe-v2.ps1')) })
$taskOwned=@($taskProcesses | Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -and ((@($taskWrapper.ProcessId) -contains $_.ParentProcessId) -or ((Normalize-PathText $_.CommandLine).Contains((Normalize-PathText $taskEntry)) -and ((Normalize-PathText $_.CommandLine).Contains((Normalize-PathText $taskCampaign)) -or (Normalize-PathText $_.CommandLine).Contains((Normalize-PathText $taskProbe))))) })
$taskStamp=Get-Date -Format 'yyyyMMddTHHmmssfff'
$receipt=Join-Path $PSScriptRoot "manual-stop-$taskStamp.json"
@{startedUtc=[DateTime]::UtcNow.ToString('o');workers=@($taskOwned | Select-Object ProcessId,ParentProcessId,CommandLine);wrappers=@($taskWrapper | Select-Object ProcessId,ParentProcessId,CommandLine);purpose='Pause this exact warm HIL campaign, retaining all checkpoint and observation bytes.'} | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $receipt
foreach($owned in $taskWrapper) { Stop-Process -Id $owned.ProcessId -ErrorAction SilentlyContinue }
foreach($owned in $taskOwned) { Stop-Process -Id $owned.ProcessId -ErrorAction SilentlyContinue }
$remaining=@(Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -and ((@($taskWrapper.ProcessId) -contains $_.ParentProcessId) -or ((Normalize-PathText $_.CommandLine).Contains((Normalize-PathText $taskEntry)) -and ((Normalize-PathText $_.CommandLine).Contains((Normalize-PathText $taskCampaign)) -or (Normalize-PathText $_.CommandLine).Contains((Normalize-PathText $taskProbe))))) })
@{finishedUtc=[DateTime]::UtcNow.ToString('o');remaining=@($remaining | Select-Object ProcessId,CommandLine);stopReceipt=$receipt} | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $PSScriptRoot "manual-stop-$taskStamp-result.json")
if($remaining.Count -ne 0) { throw 'An exact warm campaign process remains; inspect the stop receipt.' }
