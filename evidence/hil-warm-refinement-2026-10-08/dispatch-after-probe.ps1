$ErrorActionPreference='Stop'
$taskRoot='C:/Users/biao3/.codex/worktrees/hil-warm-refinement/snowflake'
Set-Location $taskRoot
$env:PSModulePath=Join-Path $env:SystemRoot 'System32/WindowsPowerShell/v1.0/Modules'
$taskControl=Join-Path $taskRoot 'out/warm-refinement-control'
$expectedSource='838c294757c65c0d3b96d017cb7fec3541e4db42'
function Read-Json($path) { Get-Content -LiteralPath $path -Raw | ConvertFrom-Json }
try {
  $head=(git rev-parse HEAD).Trim()
  if($head -ne $expectedSource) { throw 'Producer changed before launch.' }
  $test=Read-Json (Join-Path $taskControl 'full-test-result.json')
  $witness=Read-Json (Join-Path $taskControl 'n126-witness/receipt.json')
  $review=Read-Json (Join-Path $taskControl 'review.json')
  if($test.exitCode -ne 0 -or $test.source -ne $expectedSource -or -not $witness.passed -or $witness.source -ne $expectedSource -or $review.checkedCommit -ne $expectedSource -or @($review.findings).Count -ne 0) { throw 'Required completed checks are not satisfied.' }
  @{source=$head;state='waiting-for-resource-probe';startedUtc=[DateTime]::UtcNow.ToString('o');pid=$PID;probeExit='probe-v2-exit.json'} | ConvertTo-Json | Set-Content (Join-Path $taskControl 'dispatch-state.json')
  $probeExit=Join-Path $taskControl 'probe-v2-exit.json'
  while(-not (Test-Path -LiteralPath $probeExit)) {
    if(-not (Get-Process -Id 4676 -ErrorAction SilentlyContinue)) { throw 'Probe wrapper ended without its completion receipt.' }
    Start-Sleep -Seconds 10
  }
  $completion=Read-Json $probeExit
  if($completion.exitCode -ne 0 -or $completion.source -ne $expectedSource) { throw 'Resource qualification did not complete successfully; inspect its retained receipt.' }
  @{source=$head;state='launching';atUtc=[DateTime]::UtcNow.ToString('o');pid=$PID} | ConvertTo-Json | Set-Content (Join-Path $taskControl 'dispatch-state.json')
  & (Join-Path $taskControl 'start-hil.ps1') -Mode launch
  $code=$LASTEXITCODE
  @{source=$head;state='campaign-exited';atUtc=[DateTime]::UtcNow.ToString('o');exitCode=$code;pid=$PID} | ConvertTo-Json | Set-Content (Join-Path $taskControl 'dispatch-state.json')
  exit $code
} catch {
  @{source=$expectedSource;state='stopped-before-launch-or-wrapper-error';atUtc=[DateTime]::UtcNow.ToString('o');error=$_.Exception.Message;pid=$PID} | ConvertTo-Json | Set-Content (Join-Path $taskControl 'dispatch-state.json')
  throw
}
