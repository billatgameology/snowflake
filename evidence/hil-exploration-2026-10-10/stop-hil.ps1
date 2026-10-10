$ErrorActionPreference='Stop'
$taskRoot='C:/Users/biao3/.codex/worktrees/hil-exploration-oct10/snowflake'
$taskEntry=Join-Path $taskRoot 'runner/src/hil-exploration-oct10-main.ts'
$taskCampaign=Join-Path $taskRoot 'out/hil-exploration-oct10'
$env:PSModulePath=Join-Path $env:SystemRoot 'System32/WindowsPowerShell/v1.0/Modules'
function Normalize-PathText([string]$value) { $value.Replace([char]92,[char]47) }
function Get-ExplorationProcesses {
  @(Get-CimInstance Win32_Process | Where-Object {
    $_.Name -eq 'node.exe' -and $_.CommandLine -and
    (Normalize-PathText $_.CommandLine).Contains((Normalize-PathText $taskEntry)) -and
    (Normalize-PathText $_.CommandLine).Contains((Normalize-PathText $taskCampaign))
  })
}
$taskOwned=Get-ExplorationProcesses
$taskStamp=Get-Date -Format 'yyyyMMddTHHmmssfff'
$taskReceipt=Join-Path $PSScriptRoot "manual-stop-$taskStamp.json"
@{startedUtc=[DateTime]::UtcNow.ToString('o');processes=@($taskOwned | Select-Object ProcessId,ParentProcessId,CommandLine);purpose='Pause only the HIL exploration; retain all checkpoints and logs.'} | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $taskReceipt
$taskCoordinators=@($taskOwned | Where-Object { $_.CommandLine -match '\s(launch|resume)\s+HIL\s' })
foreach($taskProcess in $taskCoordinators) { Stop-Process -Id $taskProcess.ProcessId -ErrorAction SilentlyContinue }
foreach($taskProcess in (Get-ExplorationProcesses)) { Stop-Process -Id $taskProcess.ProcessId -ErrorAction SilentlyContinue }
$taskRemaining=Get-ExplorationProcesses
@{finishedUtc=[DateTime]::UtcNow.ToString('o');remaining=@($taskRemaining | Select-Object ProcessId,CommandLine);stopReceipt=$taskReceipt} | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $PSScriptRoot "manual-stop-$taskStamp-result.json")
if($taskRemaining.Count -ne 0) { throw 'An exact exploration process remains; inspect the stop receipt.' }
