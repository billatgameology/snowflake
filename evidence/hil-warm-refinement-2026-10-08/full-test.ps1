$ErrorActionPreference='Stop'
Set-Location 'C:/Users/biao3/.codex/worktrees/hil-warm-refinement/snowflake'
$taskControl='out/warm-refinement-control'
$source=(git rev-parse HEAD).Trim()
$started=[DateTime]::UtcNow.ToString('o')
@{command='npm.cmd test';source=$source;startedUtc=$started;node=(& node --version);pid=$PID} | ConvertTo-Json | Set-Content "$taskControl/full-test-invocation.json"
& npm.cmd test 1> "$taskControl/full-test.stdout.log" 2> "$taskControl/full-test.stderr.log"
$code=$LASTEXITCODE
@{command='npm.cmd test';source=$source;startedUtc=$started;finishedUtc=[DateTime]::UtcNow.ToString('o');exitCode=$code} | ConvertTo-Json | Set-Content "$taskControl/full-test-result.json"
exit $code
