param([int]$Port = 8000)
$tcp = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, $Port)
$tcp.Start()
$types = @{'.html'='text/html; charset=utf-8';'.css'='text/css; charset=utf-8';'.js'='application/javascript; charset=utf-8';'.json'='application/json; charset=utf-8'}
while ($true) {
  $client = $tcp.AcceptTcpClient()
  try {
    $stream = $client.GetStream(); $stream.ReadTimeout = 3000; $reader = [IO.StreamReader]::new($stream)
    $request = $reader.ReadLine()
    while ($true) { $line = $reader.ReadLine(); if ($null -eq $line -or $line -eq '') { break } }
    $url = ($request -split ' ')[1].Split('?')[0].TrimStart('/')
    if (!$url) { $url = 'index.html' }
    $target = Join-Path $PSScriptRoot $url
    if ((Test-Path -LiteralPath $target -PathType Leaf) -and ((Resolve-Path -LiteralPath $target).Path.StartsWith($PSScriptRoot))) {
      $body = [IO.File]::ReadAllBytes($target); $ext = [IO.Path]::GetExtension($target).ToLower()
      $contentType = if ($types.ContainsKey($ext)) {$types[$ext]} else {'application/octet-stream'}
      $head = "HTTP/1.1 200 OK`r`nContent-Type: $contentType`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
    } else { $body = [Text.Encoding]::UTF8.GetBytes('Not found'); $head = "HTTP/1.1 404 Not Found`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n" }
    $headerBytes = [Text.Encoding]::ASCII.GetBytes($head); $stream.Write($headerBytes,0,$headerBytes.Length); $stream.Write($body,0,$body.Length)
  } catch { } finally { if ($client) { $client.Close() } }
}
