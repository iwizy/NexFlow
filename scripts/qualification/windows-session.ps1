param([Parameter(Mandatory=$true)][string]$Configuration)
$ErrorActionPreference = 'Stop'
[Console]::InputEncoding = [Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)
$OutputEncoding = [Text.UTF8Encoding]::new($false)
Add-Type -Path (Join-Path $PSScriptRoot 'windows-session.cs')
$settings = Get-Content -Raw -LiteralPath $Configuration | ConvertFrom-Json
$name = 'NexFlow.Evaluation.' + [Guid]::NewGuid().ToString('N')
$session = [EvaluationContainer]::new($name)
$metadataParents = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
try {
  $scopeRoot = [IO.Path]::GetFullPath($settings.scope).TrimEnd('\')
  $drive = [IO.Path]::GetPathRoot($scopeRoot).TrimEnd('\')
  $volumeMapping = @{drive=$drive;device=[EvaluationContainer]::DeviceForDrive($drive)} | ConvertTo-Json -Compress
  # Read attributes/traverse of literal ancestors, never directory listing or file contents.
  $metadataParent = [IO.Path]::GetDirectoryName($scopeRoot)
  while ($metadataParent) {
    [void]$metadataParents.Add($metadataParent)
    & "$env:SystemRoot\System32\icacls.exe" $metadataParent /grant "*$($session.Sid):(RA,REA,X,RC,S)" /Q | Out-Null
    if ($LASTEXITCODE -ne 0) {throw 'Literal ancestor metadata grant failed'}
    $nextParent = [IO.Path]::GetDirectoryName($metadataParent)
    if ($nextParent -eq $metadataParent) {break}
    $metadataParent = $nextParent
  }
  $parents = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
  foreach ($root in $settings.readable) {
    $full = [IO.Path]::GetFullPath($root)
    $scope = [IO.Path]::GetFullPath($settings.scope).TrimEnd('\') + '\'
    if (-not $full.StartsWith($scope,[StringComparison]::OrdinalIgnoreCase)) {throw 'Only task-owned temporary ACL roots are allowed'}
    $ancestor = [IO.Path]::GetDirectoryName($full)
    while ($ancestor -and ($ancestor -eq $scopeRoot -or $ancestor.StartsWith($scope,[StringComparison]::OrdinalIgnoreCase))) {
      [void]$parents.Add($ancestor)
      if ($ancestor -eq $scopeRoot) {break}
      $ancestor = [IO.Path]::GetDirectoryName($ancestor)
    }
    & "$env:SystemRoot\System32\icacls.exe" $full /grant "*$($session.Sid):(OI)(CI)(RX)" /T /Q | Out-Null
    if ($LASTEXITCODE -ne 0) {throw 'Scoped ACL grant failed'}
  }
  # Literal task-owned ancestor metadata/traversal only: no inheritance and no file read grant.
  foreach ($ancestor in $parents) {
    & "$env:SystemRoot\System32\icacls.exe" $ancestor /grant "*$($session.Sid):(RX)" /Q | Out-Null
    if ($LASTEXITCODE -ne 0) {throw 'Scoped ancestor traversal grant failed'}
  }
  [Console]::Out.WriteLine('{"ready":true,"networkCapabilities":0,"unicodeProbe":"юникод"}')
  while ($null -ne ($line = [Console]::In.ReadLine())) {
    $request = $line | ConvertFrom-Json
    if ($request.close) {break}
    $environment = [Collections.Generic.Dictionary[string,string]]::new()
    foreach ($p in $request.env.PSObject.Properties) {$environment[$p.Name]=[string]$p.Value}
    $environment['NF_EVALUATION_DOS_MAP'] = $volumeMapping
    try {$result=$session.Run([string]$request.command,[string[]]$request.args,[string]$request.cwd,$environment,[string]$request.output,[int]$request.timeout,[bool]$request.restrictChildren)
      [Console]::Out.WriteLine(($result | ConvertTo-Json -Compress -Depth 8))
    } catch {[Console]::Out.WriteLine((@{launcherError=$_.Exception.Message}|ConvertTo-Json -Compress))}
  }
} finally {
  try {
    foreach ($ancestor in $metadataParents) {
      & "$env:SystemRoot\System32\icacls.exe" $ancestor /remove:g "*$($session.Sid)" /Q | Out-Null
      if ($LASTEXITCODE -ne 0) {throw 'Literal ancestor metadata cleanup failed'}
    }
  } finally {$session.Dispose()}
}
