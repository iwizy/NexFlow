param([Parameter(Mandatory=$true)][string]$Configuration)
$ErrorActionPreference = 'Stop'
Add-Type -Path (Join-Path $PSScriptRoot 'windows-session.cs')
$settings = Get-Content -Raw -LiteralPath $Configuration | ConvertFrom-Json
$name = 'NexFlow.Evaluation.' + [Guid]::NewGuid().ToString('N')
$session = [EvaluationContainer]::new($name)
try {
  foreach ($root in $settings.readable) {
    $full = [IO.Path]::GetFullPath($root)
    $scope = [IO.Path]::GetFullPath($settings.scope).TrimEnd('\') + '\'
    if (-not $full.StartsWith($scope,[StringComparison]::OrdinalIgnoreCase)) {throw 'Only task-owned temporary ACL roots are allowed'}
    & "$env:SystemRoot\System32\icacls.exe" $full /grant "*$($session.Sid):(OI)(CI)(RX)" /T /Q | Out-Null
    if ($LASTEXITCODE -ne 0) {throw 'Scoped ACL grant failed'}
  }
  [Console]::Out.WriteLine('{"ready":true,"networkCapabilities":0}')
  while ($null -ne ($line = [Console]::In.ReadLine())) {
    $request = $line | ConvertFrom-Json
    if ($request.close) {break}
    $environment = [Collections.Generic.Dictionary[string,string]]::new()
    foreach ($p in $request.env.PSObject.Properties) {$environment[$p.Name]=[string]$p.Value}
    try {$result=$session.Run([string]$request.command,[string[]]$request.args,[string]$request.cwd,$environment,[string]$request.output,[int]$request.timeout,[bool]$request.restrictChildren)
      [Console]::Out.WriteLine(($result | ConvertTo-Json -Compress -Depth 8))
    } catch {[Console]::Out.WriteLine((@{launcherError=$_.Exception.Message}|ConvertTo-Json -Compress))}
  }
} finally {$session.Dispose()}
