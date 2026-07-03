$base = "https://agendaai.bixs.com.br"
$pass = "Senha@123"

$accounts = @{
  qa_cliente    = @{ email = "cliente@agendai.dev"; id = "5de913ee-b426-4e0c-bbec-ec7b61a3a90f" }
  qa_estab      = @{ email = "novo_estab@agendai.dev"; id = "1b962c1c-bac1-458c-aa80-b50b7341ea23" }
  qa_prof       = @{ email = "profissional@agendai.dev"; id = "d158e51e-5075-4b7b-83da-d5134669f009" }
  fresh_cliente = @{ email = "fresh_cliente_20260619@mcp-fresh.com"; id = "20a9c047-37ea-4270-8fe8-84cf54f6f73b" }
  fresh_estab   = @{ email = "fresh_estab_20260619@mcp-fresh.com"; id = "64a0a2f1-40d2-4f70-a0dc-7184eee3fe60" }
  fresh_prof    = @{ email = "fresh_prof_20260619@mcp-fresh.com"; id = "1c1ae211-3e8e-47b8-8bf6-a7cd51fb98cf" }
}

function Get-Token($email) {
  $body = @{ email = $email; password = $pass } | ConvertTo-Json
  $r = Invoke-RestMethod -Uri "$base/api/Login/Acesso" -Method POST -Body $body -ContentType "application/json"
  return $r
}

function Invoke-Api($method, $path, $token, $body = $null) {
  $headers = @{ Authorization = "Bearer $token" }
  try {
    $params = @{ Uri = "$base$path"; Method = $method; Headers = $headers; ErrorAction = "Stop" }
    if ($body) { $params.Body = ($body | ConvertTo-Json -Depth 6); $params.ContentType = "application/json" }
    $data = Invoke-RestMethod @params
    return @{ ok = $true; status = 200; data = $data }
  } catch {
    $status = $_.Exception.Response.StatusCode.value__
    $msg = $_.ErrorDetails.Message
    if (-not $msg) { $msg = $_.Exception.Message }
    return @{ ok = $false; status = $status; error = $msg }
  }
}

$results = @()

foreach ($label in @("qa_cliente","fresh_cliente")) {
  $acc = $accounts[$label]
  $login = Get-Token $acc.email
  $token = $login.token
  $tests = @(
    @{ name = "Login"; fn = { @{ ok = $true; status = 200; data = $login } } },
    @{ name = "GET Usuario"; path = "/api/Usuario/$($acc.id)" },
    @{ name = "GET Config-Usuario"; path = "/api/Usuario/Config-Usuario/$($acc.id)" },
    @{ name = "GET Agenda Cliente"; path = "/api/Agenda/Cliente/$($acc.id)" },
    @{ name = "GET Cartoes"; path = "/api/Cartoes/Todos/$($acc.id)" },
    @{ name = "GET Pagamentos-Cliente"; path = "/api/Pagamentos/Pagamentos-Cliente" }
  )
  foreach ($t in $tests) {
    if ($t.fn) { $r = & $t.fn } else { $r = Invoke-Api GET $t.path $token }
    $results += [pscustomobject]@{ conta = $label; permissao = $login.permissao; teste = $t.name; ok = $r.ok; status = $r.status; detalhe = if ($r.ok) { ($r.data | ConvertTo-Json -Compress -Depth 3).Substring(0, [Math]::Min(120, (($r.data | ConvertTo-Json -Compress -Depth 3).Length))) } else { $r.error.Substring(0, [Math]::Min(120, $r.error.Length)) } }
  }
}

foreach ($label in @("qa_estab","fresh_estab")) {
  $acc = $accounts[$label]
  $login = Get-Token $acc.email
  $token = $login.token
  $comercioId = if ($label -eq "qa_estab") { 1 } else { 2 }
  $tests = @(
    @{ name = "Login"; fn = { @{ ok = $true; status = 200; data = $login } } },
    @{ name = "GET Comercios/Admin"; path = "/api/Comercios/Admin" },
    @{ name = "GET ConfigComercio"; path = "/api/ConfigComercio/$comercioId" },
    @{ name = "GET Profissionais"; path = "/api/ComercioUsuarios/Profissionais/$comercioId" },
    @{ name = "GET Clientes"; path = "/api/ComercioUsuarios/Clientes/$comercioId" },
    @{ name = "GET Comercio Agenda"; path = "/api/Agenda/Comercio/$comercioId" },
    @{ name = "GET Comercio Historico"; path = "/api/Agenda/Comercio-Historico/$comercioId?periodo=6" }
  )
  foreach ($t in $tests) {
    if ($t.fn) { $r = & $t.fn } else { $r = Invoke-Api GET $t.path $token }
    $results += [pscustomobject]@{ conta = $label; permissao = $login.permissao; teste = $t.name; ok = $r.ok; status = $r.status; detalhe = if ($r.ok) { ($r.data | ConvertTo-Json -Compress -Depth 3).Substring(0, [Math]::Min(120, (($r.data | ConvertTo-Json -Compress -Depth 3).Length))) } else { $r.error.Substring(0, [Math]::Min(120, $r.error.Length)) } }
  }
}

foreach ($label in @("qa_prof","fresh_prof")) {
  $acc = $accounts[$label]
  $login = Get-Token $acc.email
  $token = $login.token
  $tests = @(
    @{ name = "Login"; fn = { @{ ok = $true; status = 200; data = $login } } },
    @{ name = "GET Usuario"; path = "/api/Usuario/$($acc.id)" },
    @{ name = "GET Config-Usuario"; path = "/api/Usuario/Config-Usuario/$($acc.id)" }
  )
  foreach ($t in $tests) {
    if ($t.fn) { $r = & $t.fn } else { $r = Invoke-Api GET $t.path $token }
    $results += [pscustomobject]@{ conta = $label; permissao = $login.permissao; teste = $t.name; ok = $r.ok; status = $r.status; detalhe = if ($r.ok) { ($r.data | ConvertTo-Json -Compress -Depth 3).Substring(0, [Math]::Min(120, (($r.data | ConvertTo-Json -Compress -Depth 3).Length))) } else { $r.error.Substring(0, [Math]::Min(120, $r.error.Length)) } }
  }
}

$results | Format-Table -AutoSize
$results | ConvertTo-Json -Depth 4 | Out-File "c:\codigo\uaipdv\Agendai\trash\test-fresh-vs-qa-results.json" -Encoding utf8
Write-Host "`nSaved: trash/test-fresh-vs-qa-results.json"
