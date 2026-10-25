param([Parameter(Mandatory=$true)][string]$Configuration)
$ErrorActionPreference='Stop'
[Console]::InputEncoding=[Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding=[Text.UTF8Encoding]::new($false)
$OutputEncoding=[Text.UTF8Encoding]::new($false)
$settings=Get-Content -Raw -LiteralPath $Configuration | ConvertFrom-Json
$source=Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot 'windows-session.cs')
if(-not $source.Contains('new UIntPtr(1024UL*1024*1024)')){throw 'Unexpected pinned job limit source'}
# Compiler authority is separate from validation: allow trusted compiler children and 4GiB.
Add-Type -TypeDefinition $source.Replace('new UIntPtr(1024UL*1024*1024)','new UIntPtr(4096UL*1024*1024)')
$session=[EvaluationContainer]::new('NexFlow.BuildEvaluation.'+[Guid]::NewGuid().ToString('N'))
$granted=[Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
$parents=[Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
try {
  $scope=[IO.Path]::GetFullPath($settings.scope).TrimEnd('\')+'\'
  foreach($item in $settings.roots){
    $full=[IO.Path]::GetFullPath($item.path)
    if($item.write -and -not $full.StartsWith($scope,[StringComparison]::OrdinalIgnoreCase)){throw 'Writes only under owned build scope'}
    if(-not $full.StartsWith($scope,[StringComparison]::OrdinalIgnoreCase)){throw 'Compiler inputs must be copied under the owned task scope'}
    [void]$granted.Add($full)
    $rights=if($item.write){'(OI)(CI)(M)'}else{'(OI)(CI)(RX)'}
    & "$env:SystemRoot\System32\icacls.exe" $full /grant "*$($session.Sid):$rights" /T /Q | Out-Null
    if($LASTEXITCODE -ne 0){throw 'Build scope ACL grant failed'}
    if($item.write){& "$env:SystemRoot\System32\icacls.exe" $full /setintegritylevel '(OI)(CI)L' /T /Q | Out-Null;if($LASTEXITCODE -ne 0){throw 'Owned build integrity label failed'}}
    $parent=[IO.Path]::GetDirectoryName($full)
    while($parent){[void]$parents.Add($parent);& "$env:SystemRoot\System32\icacls.exe" $parent /grant "*$($session.Sid):(RA,REA,X,RC,S)" /Q | Out-Null;if($LASTEXITCODE -ne 0){throw 'Compiler parent metadata grant failed'};$parent=[IO.Path]::GetDirectoryName($parent)}
  }
  $drive=[IO.Path]::GetPathRoot($scope).TrimEnd('\')
  $mapping=@{drive=$drive;device=[EvaluationContainer]::DeviceForDrive($drive)}|ConvertTo-Json -Compress
  [Console]::Out.WriteLine('{"ready":true,"unicodeProbe":"юникод","purpose":"trusted-offline-build"}')
  while($null -ne ($line=[Console]::In.ReadLine())){$request=$line|ConvertFrom-Json;if($request.close){break};$envBlock=[Collections.Generic.Dictionary[string,string]]::new();foreach($p in $request.env.PSObject.Properties){$envBlock[$p.Name]=[string]$p.Value};$envBlock['NF_EVALUATION_DOS_MAP']=$mapping
    try{$result=$session.Run([string]$request.command,[string[]]$request.args,[string]$request.cwd,$envBlock,[string]$request.output,[int]$request.timeout,$false);[Console]::Out.WriteLine(($result|ConvertTo-Json -Compress -Depth 8))}catch{[Console]::Out.WriteLine((@{launcherError=$_.Exception.Message}|ConvertTo-Json -Compress))}
  }
} finally {try{foreach($full in $granted){& "$env:SystemRoot\System32\icacls.exe" $full /remove:g "*$($session.Sid)" /T /Q | Out-Null};foreach($parent in $parents){& "$env:SystemRoot\System32\icacls.exe" $parent /remove:g "*$($session.Sid)" /Q | Out-Null}}finally{$session.Dispose()}}
