$ErrorActionPreference = 'Stop'
$root = 'C:\Users\biao3\Documents\GitHub\snowflake\.tmp-discovery-resume'
Set-Location -LiteralPath $root
$dir = $PSScriptRoot
$started = (Get-Date).ToUniversalTime()
$head = (git rev-parse HEAD).Trim()
if ((git status --porcelain)) { throw 'Full-check source must be clean.' }
@{ command='npm.cmd test'; gitHead=$head; node=(& node --version); startedAt=$started.ToString('o'); stdout='full-check.stdout.log'; stderr='full-check.stderr.log' } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $dir 'full-check-invocation.json') -Encoding utf8
$check = Start-Process -FilePath npm.cmd -ArgumentList @('test') -WorkingDirectory $root -WindowStyle Hidden -RedirectStandardOutput (Join-Path $dir 'full-check.stdout.log') -RedirectStandardError (Join-Path $dir 'full-check.stderr.log') -Wait -PassThru
@{ command='npm.cmd test'; gitHead=$head; exitCode=$check.ExitCode; startedAt=$started.ToString('o'); finishedAt=(Get-Date).ToUniversalTime().ToString('o'); stdout='full-check.stdout.log'; stderr='full-check.stderr.log' } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $dir 'full-check-result.json') -Encoding utf8
exit $check.ExitCode
