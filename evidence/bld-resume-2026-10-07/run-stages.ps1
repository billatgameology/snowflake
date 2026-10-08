param([ValidateSet('auto','resume')][string]$Mode='auto')
$ErrorActionPreference='Stop'
Set-Location -LiteralPath 'G:/Code Files/snowflake-bld-exploration'
$controlRoot='G:/Code Files/snowflake-bld-exploration/out/batch1-bld-resumable-control'
$nodeExecutable=(Get-Command node.exe).Source
$sourceHead=(git rev-parse HEAD).Trim()
function Invoke-BldStage([string]$label,[string[]]$stageArguments) {
  $start=(Get-Date).ToUniversalTime().ToString('o')
  $exitCode=1
  $failure=$null
  try {
    $taskProcess=Start-Process -FilePath $nodeExecutable -ArgumentList $stageArguments -WorkingDirectory 'G:/Code Files/snowflake-bld-exploration' -WindowStyle Hidden -RedirectStandardOutput (Join-Path $controlRoot ($label+'.stdout.log')) -RedirectStandardError (Join-Path $controlRoot ($label+'.stderr.log')) -PassThru
    [pscustomobject]@{stage=$label; gitHead=$sourceHead; pid=$taskProcess.Id; startedUtc=$start; exactCommand=@($nodeExecutable)+$stageArguments} | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $controlRoot ($label+'.start.json')) -Encoding utf8
    $taskProcess.WaitForExit()
    $exitCode=$taskProcess.ExitCode
  } catch {
    $failure=$_.Exception.Message
  } finally {
    [pscustomobject]@{stage=$label; gitHead=$sourceHead; startedUtc=$start; finishedUtc=(Get-Date).ToUniversalTime().ToString('o'); exactCommand=@($nodeExecutable)+$stageArguments; exitCode=$exitCode; error=$failure} | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $controlRoot ($label+'.exit.json')) -Encoding utf8
  }
  return $exitCode
}
if ($Mode -eq 'auto') {
  $probeExit=Invoke-BldStage 'probe' @('runner/src/hil-bld-batch-main.ts','probe','BLD','out/batch1-bld-resumable-probe')
  if ($probeExit -ne 0) { exit $probeExit }
  $launchExit=Invoke-BldStage 'launch' @('runner/src/hil-bld-batch-main.ts','launch','BLD','out/batch1-bld-resumable','out/batch1-bld-resumable-probe/probe.json')
} else {
  $label='resume-'+(Get-Date -Format 'yyyyMMdd-HHmmss')
  $launchExit=Invoke-BldStage $label @('runner/src/hil-bld-batch-main.ts','resume','out/batch1-bld-resumable')
}
if (Test-Path -LiteralPath 'out/batch1-bld-resumable/campaign.json') {
  $summaryLabel='summary-'+(Get-Date -Format 'yyyyMMdd-HHmmss')
  $null=Invoke-BldStage $summaryLabel @('runner/src/hil-bld-batch-main.ts','summarize','out/batch1-bld-resumable')
}
exit $launchExit
