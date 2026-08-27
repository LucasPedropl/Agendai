# Relatório de problemas — API AgendaAi

**Data:** 27/08/2026 **Base analisada:** commits `20374e6` e `c552df8`
(24/08/2026) — repo `UaiPDV/AgendaAI-Prototipo` **Ambiente conferido:**
`https://agendaai.bixs.com.br` (78 endpoints no Swagger) **Para:** Alex

---

## Como ler este documento

Cada item tem **onde está**, **o que acontece na prática** e **a correção
sugerida**. Estão ordenados por urgência real, não por elegância: os 5 primeiros
afetam dados ou bloqueiam usuários hoje.

Fora de escopo por decisão do time: `AdminTesteController` (`/api/AdminTeste/*`)
são utilitários de desenvolvimento e serão descartados — não foram incluídos
aqui.

Todo achado foi conferido linha a linha no código. Onde houve verificação por
requisição real contra o ambiente, está indicado.

**Resumo:** 5 críticos, 8 altos, 7 médios, 1 baixo, 1 lacuna de funcionalidade.

A coluna `#` é apenas identificador para referência — as linhas estão ordenadas
por severidade, não por número.

| #   | Sev     | Onde                                   | Problema em uma linha                                                                                 |
| --- | ------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 1   | Crítico | `AgendaController.cs:730-753`          | Cancelar agendamento não cancela e cria um segundo agendamento no mesmo horário                       |
| 2   | Crítico | `LoginController.cs:106-116`           | `if` vazio impede Admin de empresa de receber a role `Admin` no JWT                                   |
| 3   | Crítico | `ChavesPixController.cs:27,127`        | `int.Parse` num claim que é GUID → HTTP 500 garantido                                                 |
| 4   | Crítico | `AgendaController.cs:386,433`          | `Where(...) == null` nunca é verdadeiro → checagem de permissão é código morto                        |
| 5   | Crítico | `AgendaController.cs:312,345,730`      | Três rotas aceitam `{id}` de outro usuário sem validar o dono                                         |
| 6   | Alto    | `appsettings.json` + `bin/` + `obj/`   | Senha do banco, API Key Bixs, senha SMTP e chave JWT versionadas                                      |
| 7   | Alto    | `LoginController.cs:78`                | Senha do usuário é enviada à Bixs em todo login, antes de validar localmente                          |
| 8   | Alto    | 5 arquivos, 14 pontos                  | `DefaultRequestHeaders` mutado em `HttpClient` compartilhado → tokens trocados entre requisições      |
| 9   | Alto    | `ControleAcessosController.cs:120-148` | Falha de provisionamento na Bixs responde 200 como se tivesse dado certo                              |
| 10  | Alto    | `ControleAcessosController.cs:173-186` | `DELETE` apaga o registro fisicamente e não revoga nada na Bixs                                       |
| 11  | Alto    | `ChavesPixController.cs:28,95,134`     | Soft-delete sem filtro no `GET` torna impossível recadastrar chave desativada                         |
| 12  | Alto    | `LoginController.cs:102,114`           | `!` sobre consulta que pode retornar null → 500 no login                                              |
| 20  | Alto    | `ComerciosController.cs:262-271`       | Re-solicitação de acesso não valida senha nem código de verificação                                   |
| 13  | Médio   | `ErroRegistro.cs:9-30`                 | Log em arquivo sem lock; sob concorrência os erros são perdidos silenciosamente                       |
| 21  | Médio   | `ControleAcesso.cs:17-22`              | `Estado.Ativo = 0` é o valor default: omitir o campo pede o estado mais permissivo                    |
| 22  | Médio   | `ComerciosController.cs:100-107`       | `status-acesso` autoriza `Profissional` mas só busca vínculo `Admin` → Profissional sempre recebe 404 |
| 14  | Médio   | `ComerciosController.cs:104`           | `status-acesso` só devolve o primeiro comércio do Admin                                               |
| 15  | Médio   | `ControleAcessosController.cs:34,64`   | Objetos anônimos sem schema no Swagger e data fora do ISO 8601                                        |
| 16  | Médio   | `Program.cs:166-171`                   | Swagger UI publicado na raiz em produção, sem proteção                                                |
| 17  | Médio   | `ComerciosController.cs:40`            | `GET /api/Comercios` carrega o grafo inteiro sem paginação                                            |
| 18  | Baixo   | vários                                 | `DateTime.Now` e `DateTime.UtcNow` misturados                                                         |
| 19  | Lacuna  | —                                      | Não existe endpoint que gere/envie o `VerificationCode` exigido por `solicitar-acesso`                |

---

# CRÍTICOS

## 1. `DELETE /api/Agenda/Cancelar/{id}` não cancela o agendamento e gera overbooking

**Onde:** `Controllers/AgendaController.cs`, linhas 730-753 (e o método privado
`ReangendarAuto`, 754-796).

```csharp
var tempoCancelamento = configComercio.TempoCancelamento;
if (agendamento.DataAgendamento.AddHours(-tempoCancelamento) < DateTime.UtcNow)
{
    return BadRequest($"O agendamento só pode ser cancelado com pelo menos {tempoCancelamento} hora(s) de antecedência.");
}
_context.Agendamentos.Update(agendamento);   // a entidade não foi modificada em nenhum momento
await _context.SaveChangesAsync();
await ReangendarAuto(agendamento, agendamento.Servico.ComercioId);
return Ok("Cancelado com Sucesso!");
```

**O que acontece na prática — dois efeitos somados:**

1. **O cancelamento é um no-op.** Em nenhum ponto entre a leitura da entidade e
   o `SaveChangesAsync()` existe
   `agendamento.Status = AppointmentStatus.Cancelado`. O `Update` marca a
   entidade como modificada sem nenhuma mudança de valor, o EF emite um UPDATE
   que não altera nada, e a API responde `200 "Cancelado com Sucesso!"`. O
   agendamento continua `Confirmado` e volta a aparecer na agenda do comércio e
   do cliente, que acredita ter cancelado.

2. **`ReangendarAuto` cria um segundo agendamento no mesmo slot.** Ele monta um
   `Agendamento` novo com o **mesmo** `ProfissionalId`, `DataAgendamento`,
   `HoraAgendamento` e `ServicoId`, apontando para outro usuário
   (`BuscarMelhorClienteParaEncaixe`) com `Status = Pendente`. Como o original
   não foi cancelado, o horário fica com **dois** agendamentos ativos, e o
   cliente encaixado recebe WhatsApp/e-mail confirmando um horário que não está
   livre.

O comentário `// Substitua pelo ID real do usuário autenticado` na linha 767
sugere que esse fluxo nunca foi concluído.

**Correção mínima:**

```csharp
agendamento.Status = AppointmentStatus.Cancelado;
_context.Agendamentos.Update(agendamento);
await _context.SaveChangesAsync();
await ReangendarAuto(agendamento, agendamento.Servico.ComercioId);
```

**Além do mínimo, recomendado:**

- Envolver o cancelamento e o encaixe automático numa única transação
  (`BeginTransactionAsync`) — hoje uma falha no `ReangendarAuto` deixa o banco
  em estado parcial.
- Antes de inserir o encaixe, verificar se já existe agendamento ativo no slot.
- Comparar com `Comercio-Cancela/{id}` (o caminho usado pelo estabelecimento) e
  garantir que os dois fluxos tenham o mesmo comportamento.

**Antes de corrigir:** vale rodar um levantamento de agendamentos duplicados em
produção (mesmo `ProfissionalId` + `DataAgendamento` + `HoraAgendamento` com
mais de um registro não cancelado) para dimensionar quantos slots já estão com
overbooking e decidir se precisa de saneamento de dados.

---

## 2. Admin de empresa não recebe a role `Admin` no login (bloco `if` vazio)

**Onde:** `Controllers/LoginController.cs`, linhas 106-116.

```csharp
tipoUsuario = _context.UsuariosComercios.FirstOrDefault(ue => ue.UsuarioId == usuario.Id && ue.TipoPermissao == TipoPermissao.Admin);

if (tipoUsuario != null || (tokenexterno != null && tokenexterno != "Erro"))
{

}                                    // <-- bloco vazio: o caso de sucesso não faz nada
else
{
    var Role = _context.UserRoles.FirstOrDefault(ur => ur.UserId == usuario.Id && ur.RoleId == _context.Roles.FirstOrDefault(r => r.Name == "Admin")!.Id);
    if (Role != null) { usuarioDto.tipoPermissao = "Admin"; }
}
```

**O que acontece na prática:** a lógica está invertida. Quando o usuário **é**
Admin de um comércio (`tipoUsuario != null`), a execução entra no bloco vazio e
o `usuarioDto.tipoPermissao` permanece `"Cliente"` (valor inicializado na linha
93). A role `Admin` só é atribuída no `else`, ou seja, exatamente quando o
usuário **não** tem vínculo de Admin.

Consequência: o JWT sai com `role: Cliente`, o campo `Permissao` da resposta
também, e **todo endpoint com `[Authorize(Roles = "Admin")]` passa a responder
403 para o dono da empresa**. Isso derruba o app inteiro do lado do
estabelecimento: `Comercios/Admin`, `ConfigComercio`, `ChavesPix`,
`solicitar-acesso`, gestão de serviços, profissionais e clientes.

Não há contorno possível no frontend — o token vem errado da API.

**Correção mínima:**

```csharp
var vinculoAdmin = _context.UsuariosComercios.FirstOrDefault(ue => ue.UsuarioId == usuario.Id && ue.TipoPermissao == TipoPermissao.Admin);
if (vinculoAdmin != null)
{
    usuarioDto.tipoPermissao = "Admin";
}
else
{
    var adminRole = _context.Roles.FirstOrDefault(r => r.Name == "Admin");
    if (adminRole != null && _context.UserRoles.Any(ur => ur.UserId == usuario.Id && ur.RoleId == adminRole.Id))
    {
        usuarioDto.tipoPermissao = "Admin";
    }
}
```

Vale revisar também se `tokenexterno != "Erro"` deveria mesmo conceder role
`Admin` — hoje isso está misturado na mesma condição e o significado fica
ambíguo (ver item 7).

---

## 3. `GET` e `DELETE` de `/api/ChavesPix` retornam HTTP 500 garantido

**Onde:** `Controllers/ChavesPixController.cs`, linhas 24-28 e 124-129.

```csharp
var idUserClaim = User.FindFirst(ClaimTypes.NameIdentifier);
if (idUserClaim == null) return Unauthorized();

var idUser = int.Parse(idUserClaim.Value);      // <-- FormatException
var chavesPix = await _context.ChavesPix.Where(c => c.UsuarioId == UsuarioId).ToListAsync();
```

**O que acontece na prática:** `Usuario : IdentityUser` usa a chave padrão do
Identity, que é **`string`** (GUID). O claim `NameIdentifier` carrega esse GUID,
então `int.Parse` lança `FormatException`. Não há `try/catch` nesses dois
métodos, logo a exceção sobe e a API responde **500 em 100% das chamadas** de
`GET /api/ChavesPix` e `DELETE /api/ChavesPix/{idchavepix}`.

Detalhe que mostra que é código morto: a variável `idUser` **não é usada em
nenhum lugar** — o filtro real logo abaixo usa `UsuarioId` (a propriedade
`string` herdada de `BaseController`, que já está correta).

O `PUT` e o `POST` não têm o problema, então a feature está pela metade: dá para
cadastrar e editar uma chave PIX, mas não dá para listar nem desativar.

**Correção mínima:** apagar as linhas 27 e 127 (a declaração de `idUser`). O
restante já funciona.

---

## 4. Checagem de permissão em `Comercio/{id}` e `Comercio-Historico` é código morto

**Onde:** `Controllers/AgendaController.cs`, linhas 386-390 e 433-437.

```csharp
var useautorizado = _context.UsuariosComercios.Where(ue => ue.ComercioId == id && ue.UsuarioId == UsuarioId && (ue.TipoPermissao == TipoPermissao.Profissional || ue.TipoPermissao == TipoPermissao.Admin));
if (useautorizado == null)
{
    return Unauthorized("Você não tem permissão para acessar a agenda!");
}
```

**O que acontece na prática:** `.Where(...)` devolve um
`IQueryable<UsuarioComercio>` — um objeto de consulta não materializado, que
**nunca é `null`**, mesmo quando o banco não tem nenhuma linha correspondente.
Portanto `useautorizado == null` é sempre falso e o `return Unauthorized(...)` é
inalcançável.

O `[Authorize(Roles = "Admin,Profissional")]` da rota só garante que o chamador
é Admin ou Profissional de **algum** comércio; não amarra ao `{id}` da URL.
Resultado: qualquer Admin ou Profissional autenticado troca o `{id}` e lê a
agenda futura e o histórico completo de **qualquer outro comércio** — e como as
consultas fazem `Include(a => a.Usuario)`, isso inclui nome dos clientes de
concorrentes. É quebra de isolamento entre empresas, com implicação de LGPD.

O mesmo padrão de intenção aparece em `ComerciosController.cs:104-107`, mas lá
está **correto** — a diferença é que usa `FirstOrDefaultAsync`, que materializa
a consulta. Vale varrer o resto da base procurando `.Where(...)` seguido de
comparação com `null`.

**Correção mínima:**

```csharp
var autorizado = await _context.UsuariosComercios.AnyAsync(ue =>
    ue.ComercioId == id &&
    ue.UsuarioId == UsuarioId &&
    (ue.TipoPermissao == TipoPermissao.Profissional || ue.TipoPermissao == TipoPermissao.Admin));
if (!autorizado)
{
    return Forbid();
}
```

Use `Forbid()` (403) em vez de `Unauthorized()` (401): o chamador está
autenticado, o que falta é permissão. Devolver 401 faz o frontend disparar o
fluxo de refresh token indevidamente e derrubar a sessão do usuário.

---

## 5. IDOR em três rotas de agendamento do cliente

**Onde:** `Controllers/AgendaController.cs` — `Cliente/{id}` (312-333),
`Cliente-Historico/{id}` (345-367) e `Cancelar/{id}` (730-753).

```csharp
// linha 312
[HttpGet("Cliente/{id}")]
[Authorize]
public async Task<IActionResult> Get(string id)
{
    if (id == null) { return BadRequest("ID inválido."); }
    var agendas = await _context.Agendamentos
        .Where(a => a.UsuarioId == id && ...)   // 'id' vem da URL e nunca é comparado com o claim
```

```csharp
// linha 730 — Cancelar não valida dono nem vínculo
var agendamento = await _context.Agendamentos.Where(s => s.Id == id).Include(s => s.Servico).FirstOrDefaultAsync();
if (agendamento == null) { return NotFound("Agendamento não encontrado."); }
// segue direto para o cancelamento
```

**O que acontece na prática:** `[Authorize]` garante que existe um token válido,
não que o token pertença ao dono do recurso. O `id` do cliente é um GUID que
circula em respostas da própria API (as listagens de agenda do comércio fazem
`Include(a => a.Usuario)`), então não é segredo. E no `Cancelar` o `id` é um
**`int` incremental**, trivialmente enumerável.

Efeito: qualquer conta de cliente recém-criada lê a agenda futura e o histórico
de outro cliente (serviço, profissional, datas), e dispara o fluxo de
cancelamento de agendamento de terceiros.

Para contraste: o `UsuarioController` faz isso **corretamente** nas linhas 43-44
e 81-82 (`if (id != UsuarioId) return Forbid(...)`) — vale usá-lo como
referência do padrão desejado.

**Correção mínima** — nos dois GETs, deixar de aceitar o `id` por rota:

```csharp
[HttpGet("Cliente")]
[Authorize]
public async Task<IActionResult> GetClienteAgendamentos()
{
    var agendas = await _context.Agendamentos
        .Where(a => a.UsuarioId == UsuarioId && a.DataAgendamento > DateTime.UtcNow && a.Status == AppointmentStatus.Confirmado)
        .Include(a => a.Servico).Include(a => a.Profissional)
        .ToListAsync();
    return Ok(agendas);
}
```

No `Cancelar/{id}`, validar dono ou vínculo com o comércio antes de qualquer
efeito:

```csharp
var ehDono = agendamento.UsuarioId == UsuarioId;
var ehDoComercio = await _context.UsuariosComercios.AnyAsync(ue =>
    ue.UsuarioId == UsuarioId &&
    ue.ComercioId == agendamento.Servico.ComercioId &&
    (ue.TipoPermissao == TipoPermissao.Admin || ue.TipoPermissao == TipoPermissao.Profissional));
if (!ehDono && !ehDoComercio) { return Forbid(); }
```

**Atenção — este é o único item do relatório que quebra o frontend:** remover o
`{id}` de `Cliente/{id}` e `Cliente-Historico/{id}` muda a assinatura de duas
rotas em uso. Precisa ser combinado com o time de frontend para sair junto. Se
preferir não quebrar agora, a alternativa sem breaking change é manter a rota e
apenas validar `if (id != UsuarioId) return Forbid();` — resolve a
vulnerabilidade e pode ser deployado isoladamente.

---

# ALTOS

## 6. Segredos de produção versionados no repositório

**Onde:** `appsettings.json` (linhas 10, 14-16, 24, 27) e as cópias em
`bin/Debug/net8.0/appsettings.json`, `bin/Release/net8.0/appsettings.json` e
`obj/Release/net8.0/PubTmp/Out/appsettings.json`.

Estão em texto puro e no histórico do Git:

- Connection string do SQL Server de produção, com IP público, usuário e senha
- `BixAPI:API-Key` de produção (`bxs_live_...`)
- Senha da conta SMTP `uai@uaipdv.com.br`
- `Jwt:Key` — a chave de assinatura dos tokens

**Calibragem honesta:** o repositório é **privado** (verificado em 27/08/2026:
`api.github.com` e `raw.githubusercontent.com` devolvem 404 anônimo). Não é um
vazamento consumido. Mas o raio de alcance é "todo colaborador atual e futuro do
repo", e os segredos ficam no histórico permanentemente — remover do arquivo
agora não os remove do histórico. Um único momento de repo público, fork ou
clone que saia da empresa expõe banco de produção, chave de assinatura JWT e API
Key Bixs de uma vez.

Agravante específico: com o `Jwt:Key` em mãos, qualquer pessoa forja um token
com a role que quiser, inclusive `Master`. Isso torna toda a autorização da API
decorativa.

**Correção sugerida, em ordem:**

1. Mover a configuração para variáveis de ambiente / User Secrets em dev e para
   as variáveis do host em produção (`ConnectionStrings__DbConect`, `Jwt__Key`,
   `BixAPI__API-Key`, `EmailSettings__Password`). O binding do .NET já entende
   esse formato sem mudança de código.
2. Corrigir o `.gitignore` da API (hoje tem 10 bytes) para ignorar `bin/`,
   `obj/`, `.vs/` e `appsettings.*.json` locais. Rodar
   `git rm -r --cached bin obj .vs` para parar de versioná-los.
3. **Rotacionar as quatro credenciais.** Enquanto não rotacionar, elas seguem
   válidas para quem já clonou.

Observação: `bin/`, `obj/` e `.vs/` versionados também são a razão pela qual
cada commit da API carrega dezenas de arquivos binários alterados, o que torna
qualquer code review inviável.

---

## 7. Senha do usuário é enviada à Bixs em todo login, antes da validação local

**Onde:** `Controllers/LoginController.cs`, linha 78.

```csharp
var tokenexterno = await _apiBixs.VerificaAcesso(login);   // 'login' contém email + senha em claro
var usuario = _context.Users.FirstOrDefault(u => u.Email == login.Email && u.Status == TipoStatusUsuario.Ativo);
if (usuario == null) { return BadRequest("Usuario não encontrado ou inativo"); }
if (!await _userManager.CheckPasswordAsync(usuario, login.Password)) { return Unauthorized("Senha ou usuário incorreta"); }
```

**O que acontece na prática:**

1. **A credencial do usuário sai do domínio da aplicação antes de ser
   validada.** O objeto `login` completo (e-mail e senha em claro) vai para a
   API Bixs a cada tentativa de login — inclusive tentativas com senha errada e
   inclusive de usuários que nem existem no AgendaAi. Isso transforma o endpoint
   num canal de encaminhamento de credenciais para um terceiro.
2. **Ataque de enumeração amplificado.** Um atacante fazendo força bruta contra
   `/api/Login/Acesso` gera uma chamada externa por tentativa, com o
   custo/rate-limit da Bixs no meio.
3. **Acoplamento de disponibilidade.** Se a Bixs estiver lenta ou fora, todo
   login do AgendaAi fica lento ou falha — mesmo login de cliente comum, que não
   tem nada a ver com a integração.

**Correção mínima:** mover a chamada para **depois** do `CheckPasswordAsync`, e
só executá-la quando ela for de fato necessária (usuário com vínculo de
empresa). Adicionar timeout curto e tratar falha da Bixs como "não conseguiu
verificar" em vez de deixar a exceção derrubar o login.

Aproveitando: o endpoint não tem rate limiting nem lockout do Identity. Vale
habilitar `lockoutOnFailure: true` no
`CheckPasswordAsync`/`PasswordSignInAsync`.

---

## 8. `DefaultRequestHeaders` mutado em `HttpClient` compartilhado — 14 pontos

**Onde:** 5 arquivos.

| Arquivo                             | Linhas                                     |
| ----------------------------------- | ------------------------------------------ |
| `Controllers/WhatsAppController.cs` | 65, 133, 134, 135, 161, 214, 218, 219, 299 |
| `Services/ExternalToken.cs`         | 236, 237, 238, 430, 431                    |
| `Services/PagamentoService.cs`      | 28, 45                                     |
| `Services/EnvioSender.cs`           | 54, 55, 56                                 |

```csharp
_httpClient.DefaultRequestHeaders.Authorization =
    new AuthenticationHeaderValue("Bearer", await _tokenStorage.GetValidTokenAsync(idAdmin));
```

**O que acontece na prática:** o `HttpClient` vem de `AddHttpClient<...>` e o
`HttpMessageHandler` por baixo é compartilhado entre requisições concorrentes.
`DefaultRequestHeaders` é estado **do cliente**, não da requisição. Quando dois
comércios são atendidos ao mesmo tempo, o `Authorization` de um sobrescreve o do
outro entre o `await` da obtenção do token e o `await` do envio — e a chamada
sai para a Bixs com o token do **outro** comércio.

Sintoma típico: falhas intermitentes de WhatsApp/pagamento que "não reproduzem"
em teste, e ações executadas na instância errada. Como é race condition, a
frequência cresce com o número de usuários simultâneos.

Este é o mesmo bug que já foi diagnosticado e corrigido na API do PagWeb.

**A boa notícia:** o padrão correto **já existe nesta base**. `ExternalToken.cs`
nas linhas 320, 371 e 468 tem exatamente isso, inclusive com o comentário
`// 3. Adicionamos os cabeçalhos EXCLUSIVOS desta requisição (Sem usar o DefaultRequestHeaders)`.
Ou seja, alguém já resolveu em parte — falta propagar para os 14 pontos
restantes.

**Correção:** trocar por `HttpRequestMessage` por chamada.

```csharp
using var request = new HttpRequestMessage(HttpMethod.Get, "instances");
request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
var response = await _httpClient.SendAsync(request);
```

---

## 9. Falha de provisionamento na Bixs responde HTTP 200 como sucesso

**Onde:** `Controllers/ControleAcessosController.cs`, linhas 120-153.

```csharp
if (controle.Payment == Estado.Ativo)
{
    if (!await _externalToken.SolicitarApp(controle.IdBixs, "payment"))
    {
        controle.Payment = Estado.Inativo;      // grava o oposto do que foi pedido
    }
}
// ... idem para Whatsapp ...
String mensagem = $"Controle de acesso atualizado: Payment - {controle.Payment}, Whatsapp - {controle.Whatsapp}";
_context.Update(controle);
await _context.SaveChangesAsync();
return Ok(mensagem);                             // 200 mesmo tendo falhado
```

**O que acontece na prática:** o operador aprova um acesso pedindo Payment e
WhatsApp ativos. Se o provisionamento na Bixs falhar, a API grava `Inativo`
localmente e responde **200** com uma string em prosa. O status HTTP diz "deu
certo"; o que realmente aconteceu está escondido dentro do texto. Qualquer
cliente que trate 200 como sucesso vai reportar sucesso ao operador, que só
descobre depois — pelo cliente reclamando.

O painel administrativo do AgendaAi já foi construído com um parser dessa string
justamente para contornar isso, mas **o contorno não deveria ser necessário**: o
formato pode mudar e o parse quebra em silêncio.

**Correção sugerida:** devolver um DTO estruturado com o resultado por módulo e
um status adequado — `200` quando tudo o que foi pedido foi concedido,
`207`/`409` (ou `502` se a falha foi da Bixs) quando houve divergência:

```csharp
return Ok(new
{
    idControle = controle.IdControle,
    estado = controle.estado,
    payment = controle.Payment,
    whatsapp = controle.Whatsapp,
    modulosNaoProvisionados = new[] { /* "payment", "message" */ }
});
```

Mesmo mantendo 200, retornar objeto em vez de string já resolve o essencial.
Além disso, o método não é idempotente e não tem transação: se o
`SaveChangesAsync` falhar depois de a Bixs ter provisionado, os dois lados ficam
divergentes sem registro.

---

## 10. `DELETE /api/ControleAcessos/{id}` faz hard delete e não revoga na Bixs

**Onde:** `Controllers/ControleAcessosController.cs`, linhas 173-186.

```csharp
_context.ControleAcessos.Remove(controleacesso);
await _context.SaveChangesAsync();
return Ok("Controle de acesso deletado com sucesso.");
```

**O que acontece na prática:** o registro é apagado fisicamente. Some o
histórico de quem pediu acesso, quando e o que foi concedido — não há trilha de
auditoria de uma operação que concede acesso a sistema de pagamento. E,
principalmente, **o acesso na Bixs continua ativo**: nada é desprovisionado. O
resultado é acesso órfão no parceiro, sem nenhum registro local apontando para
ele.

Também não há checagem de estado: dá para apagar um controle `Ativo` direto, sem
desativar antes.

**Correção sugerida:** substituir por desativação
(`controle.estado = Estado.Inativo` + revogação na Bixs), ou, se a remoção do
registro for realmente necessária, exigir que o estado já seja `Inativo` e
revogar na Bixs antes de remover.

---

## 11. Soft-delete de chave PIX impede recadastro da mesma chave

**Onde:** `Controllers/ChavesPixController.cs`, linhas 28, 95 e 134.

```csharp
// DELETE (linha 134) — soft-delete
chavepix.Status = false;

// GET (linha 28) — não filtra Status
var chavesPix = await _context.ChavesPix.Where(c => c.UsuarioId == UsuarioId).ToListAsync();

// POST (linha 95) — checa duplicidade sem olhar Status
var chaveExistente = await _context.ChavesPix.AnyAsync(c => c.Chave == chavepix.Chave && c.UsuarioId == UsuarioId);
if (chaveExistente) { return BadRequest("Chave PIX já cadastrada."); }
```

**O que acontece na prática:** o usuário desativa uma chave; ela **continua
aparecendo na listagem** (o GET não filtra `Status == true`); e se ele tentar
cadastrar a mesma chave de novo, recebe `"Chave PIX já cadastrada."` — ficando
permanentemente impedido de reativá-la, sem nenhum caminho pela API.

Faltam também: validação de formato da chave (CPF, CNPJ, e-mail, telefone, EVP)
e validação de `TipoChave`, que hoje é `string` livre — dá para gravar
`TipoChave = "banana"`.

**Correção mínima:**

1. No `GET`, filtrar `c.Status == true`.
2. No `POST`, se a chave já existir com `Status == false`, reativar e atualizar
   em vez de rejeitar.
3. Trocar `TipoChave` por enum e validar o formato conforme o tipo.

---

## 12. Null-forgiving (`!`) sobre consulta que pode retornar null derruba o login

**Onde:** `Controllers/LoginController.cs`, linhas 102 e 114.

```csharp
var Role = _context.UserRoles.FirstOrDefault(ur => ur.UserId == usuario.Id && ur.RoleId == _context.Roles.FirstOrDefault(r => r.Name == "Profissional")!.Id);
```

**O que acontece na prática:** se a role `"Profissional"` ou `"Admin"` não
existir na tabela `AspNetRoles`, o `FirstOrDefault` devolve `null`, o `!`
silencia o compilador, e o acesso a `.Id` lança `NullReferenceException` → **500
no login**, para todos os usuários.

Hoje o seed do `Program.cs` (linhas 139-164) cria essas roles na subida, mas
dentro de um `try/catch` que apenas loga e segue. Se o banco estiver
indisponível nesse instante, a aplicação sobe **sem as roles** e todo login
passa a dar 500 — uma falha transitória na inicialização vira indisponibilidade
permanente até o próximo restart.

**Correção mínima:**

```csharp
var profissionalRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Profissional");
if (profissionalRole != null && await _context.UserRoles.AnyAsync(ur => ur.UserId == usuario.Id && ur.RoleId == profissionalRole.Id))
{
    usuarioDto.tipoPermissao = "Profissional";
}
```

---

## 20. Re-solicitação de acesso não valida senha nem código de verificação

**Onde:** `Controllers/ComerciosController.cs`, linhas 262-271, dentro de
`POST /api/Comercios/solicitar-acesso`.

```csharp
var existingControle = await _context.ControleAcessos.FirstOrDefaultAsync(c => c.IdComercio == empresa.ComercioId);
if (existingControle != null && existingControle.estado == Estado.Inativo)
{
    existingControle.estado = Estado.Solicitado;
    existingControle.Payment = controleacesso.Payment;
    existingControle.Whatsapp = controleacesso.Whatsapp;
    _context.ControleAcessos.Update(existingControle);
    await _context.SaveChangesAsync();
    return Ok(new { message = "Controle de acesso atualizado com sucesso.", idcontrole = existingControle.IdControle });
}
// só DEPOIS deste return vêm a verificação de senha e a chamada à Bixs:
if (_hasher.VerifyHashedPassword(usuario, usuario.PasswordHash!, controleacesso.Password) == PasswordVerificationResult.Failed) { ... }
var solicitacao = await _externalToken.CriarAcesso(usuario, controleacesso.Password, controleacesso.VerificationCode);
```

**O que acontece na prática:** o endpoint tem dois caminhos. No caminho de
**primeira solicitação**, a senha do Admin é verificada e o `VerificationCode` é
usado na chamada à Bixs. No caminho de **re-solicitação** (controle existente em
`Inativo`), a função retorna antes disso: `Password` e `VerificationCode` são
exigidos pelo modelo (`required`), recebidos no corpo e **nunca validados**.
Qualquer string serve.

Ou seja, a reautenticação de intenção — que é uma boa prática e claramente foi a
intenção do desenho — é contornável exatamente no caminho de reativar um acesso
que alguém já havia desativado. O impacto é contido pelo
`[Authorize(Roles = "Admin")]`: quem explora é um Admin agindo sobre a própria
empresa. Mas o efeito prático é que um token de Admin roubado reativa acesso a
sistema de pagamento sem precisar da senha.

Somado ao item 21, fica pior: como `Estado.Ativo = 0` é o default do enum, uma
re-solicitação com o corpo
`{"idEmpresa":0,"password":"x","verificationCode":"x"}` (sem
`payment`/`whatsapp`) grava os dois módulos como `Ativo`.

**Correção mínima:** mover a verificação de senha para **antes** da bifurcação,
de forma que os dois caminhos passem por ela. Se a re-solicitação também deve
provisionar na Bixs, validar o `VerificationCode` nela também — e se não deve,
então remover `VerificationCode` de `required` e documentar que ele só se aplica
à primeira solicitação.

---

# MÉDIOS

## 21. `Estado.Ativo = 0` é o valor default do enum — omitir o campo concede o estado mais permissivo

**Onde:** `Models/ControleAcesso.cs`, linhas 17-22.

```csharp
public enum Estado
{
    Ativo,        // = 0  ← valor default de um int não inicializado
    Inativo,      // = 1
    Solicitado,   // = 2
}
```

**O que acontece na prática:** em C#, um `enum` não inicializado vale `0`. Como
`Ativo` é o primeiro membro, **o estado default é o mais permissivo**. Toda vez
que um campo `Estado` não for explicitamente atribuído — em desserialização de
corpo JSON com o campo ausente, em `new ControleAcesso()`, em migração que
adicione a coluna com default — o valor resultante é `Ativo`.

Efeito concreto hoje: `POST /api/Comercios/solicitar-acesso` recebe `Payment` e
`Whatsapp` do corpo. Um cliente que omita esses campos não recebe erro de
validação — recebe `Ativo` nos dois. O mesmo vale para
`PUT /api/ControleAcessos/{id}`.

Isso é o oposto do padrão desejado em controle de acesso: o default deve falhar
fechado.

**Correção sugerida:** atribuir valores explícitos com um default seguro, o que
também protege contra reordenação acidental dos membros (que hoje mudaria o
significado dos números já gravados no banco):

```csharp
public enum Estado
{
    Inativo = 0,
    Ativo = 1,
    Solicitado = 2,
}
```

**Atenção:** isso exige migração de dados, porque os valores atuais já estão
persistidos com a numeração antiga. Se a migração não for desejável, a
alternativa é manter a numeração e tornar os campos obrigatórios na validação de
entrada (`[Required]` em tipo anulável `Estado?`, rejeitando ausência com 400).

Vale também registrar `JsonStringEnumConverter` no `Program.cs`: hoje os enums
saem como número no JSON (`estado: 2`), o que obriga todo cliente a manter uma
tabela de tradução e quebra em silêncio se a ordem mudar.

---

## 13. Log de erro em arquivo sem lock — sob concorrência os erros são perdidos

**Onde:** `Models/ErroRegistro.cs`, linhas 9-30.

```csharp
using (StreamWriter writer = new StreamWriter(diretorio, true))
{
    writer.WriteLine($"{DateTime.Now}: {message}");
}
```

envolvido por:

```csharp
catch (Exception ex)
{
    Console.WriteLine($"Erro ao registrar no arquivo de log: {ex.Message}");
}
```

**O que acontece na prática:** todo erro da API abre
`ErroRegistro/ErroRegistro.txt` e escreve de forma síncrona e bloqueante. Sob
requisições concorrentes, a segunda escrita simultânea falha com
`IOException: The process cannot access the file because it is being used by another process`.
O `try/catch` engole a exceção e manda para o `Console` — então **o registro do
erro original é perdido silenciosamente**, exatamente no momento de maior carga,
que é quando você mais precisa dele.

Some a isso: o caminho é `Directory.GetCurrentDirectory()`, que depende de como
o processo foi iniciado; o arquivo cresce sem rotação; e não há nível de
severidade nem correlação de requisição.

**Correção sugerida:** usar o `ILogger<T>` nativo do ASP.NET Core, que já é
thread-safe, tem níveis, escopo por requisição e provedores plugáveis. Como
`LogError` é estático e chamado de muitos lugares, um caminho de migração de
baixo atrito é manter a assinatura e redirecionar internamente para um
`ILoggerFactory` guardado na inicialização.

---

## 14. `GET /api/Comercios/status-acesso` só considera o primeiro comércio do Admin

**Onde:** `Controllers/ComerciosController.cs`, linhas 104-105. Relacionado:
modelagem de `ChavePix`.

```csharp
var vinculo = await _context.UsuariosComercios
    .FirstOrDefaultAsync(ue => ue.UsuarioId == UsuarioId && ue.TipoPermissao == TipoPermissao.Admin);
```

**O que acontece na prática:** o endpoint não recebe `comercioId` — ele descobre
o comércio pegando o **primeiro** vínculo de Admin do usuário. Quem administra
mais de um comércio sempre vê o status de acesso de um só, sem forma de
escolher, e sem ordenação definida (o "primeiro" pode até mudar entre chamadas).
O mesmo vale para `POST /api/Comercios/solicitar-acesso` (linhas 256-262).

No mesmo tema: a entidade `ChavePix` se vincula a `UsuarioId` e **não tem
`ComercioId`**, divergindo do modelo multi-tenant do resto da aplicação
(`UsuarioComercio`). Uma chave PIX é um dado de recebimento do estabelecimento,
não da pessoa física — se o Admin sair da empresa, a chave vai com ele.

**Correção sugerida:** aceitar `comercioId` como parâmetro nos dois endpoints
(validando o vínculo do usuário com aquele comércio) e adicionar `ComercioId` em
`ChavesPix`.

---

## 15. Respostas de `ControleAcessos` sem schema no Swagger e com data fora do ISO 8601

**Onde:** `Controllers/ControleAcessosController.cs`, linhas 34-42 e 64-78.

```csharp
var resultado = new
{
    IdControle = controleacesso.IdControle,
    estado = controleacesso.estado,
    DataSolicitado = controleacesso.Solicitado.ToString("dd/MM/yyyy HH:mm:ss")
};
```

**O que acontece na prática:**

1. Retornar objeto anônimo impede o Swagger de gerar schema de resposta. No
   `openapi.json` esses endpoints aparecem sem shape, então nenhum cliente pode
   ser gerado nem validado automaticamente — o consumidor precisa ler o
   código-fonte da API para saber os campos.
2. `DataSolicitado` sai como `"27/08/2026 14:30:00"`, que **não é ISO 8601** e
   não é parseável por `new Date()` em JS nem pelas bibliotecas de data usuais.
   Cada cliente é obrigado a escrever um parser manual de `dd/MM/yyyy HH:mm:ss`.
   O objeto `DateTime` também está disponível no campo `Solicitado`, então hoje
   a mesma informação vai duas vezes em formatos diferentes.
3. Os dois endpoints (lista e detalhe) devolvem shapes diferentes para a mesma
   entidade, o que obriga o cliente a fazer N+1 chamadas (uma por item) só para
   preencher a tabela.

**Nota:** o casing **não** é problema, ao contrário do que se poderia supor
lendo o código. O `AddControllers()` do ASP.NET Core usa
`JsonSerializerDefaults.Web`, que aplica `JsonNamingPolicy.CamelCase`, então
`IdControle` sai como `idControle` no wire independentemente de como está
escrito no C#. Verificado por requisição real. O único caso curioso é
`CPF_CNPJ`, que vira `cpf_CNPJ`.

**Correção sugerida:** criar DTOs tipados (`ControleAcessoListItemDto`,
`ControleAcessoDetailDto`), anotar com `[ProducesResponseType]`, devolver
`DateTime` puro e incluir `payment`/`whatsapp` já na listagem para eliminar o
N+1.

---

## 22. `status-acesso` autoriza `Profissional`, mas o código só atende `Admin`

**Onde:** `Controllers/ComerciosController.cs`, linhas 100-107.

```csharp
[HttpGet("status-acesso/")]
[Authorize(Roles = "Admin, Profissional")]      // Profissional é autorizado a entrar...
public async Task<ActionResult> GetControleAcesso()
{
    var vinculo = await _context.UsuariosComercios
        .FirstOrDefaultAsync(ue => ue.UsuarioId == UsuarioId && ue.TipoPermissao == TipoPermissao.Admin);

    if (vinculo == null) return NotFound("Nenhum comercio vinculado como administrador");   // ...mas nunca encontra vínculo
```

**O que acontece na prática:** o atributo libera `Profissional`, mas a busca
filtra `TipoPermissao.Admin`. Um Profissional passa pela autorização e sempre
cai no `NotFound("Nenhum comercio vinculado como administrador")`, mesmo estando
corretamente vinculado ao comércio. É um endpoint que aceita uma role que não
consegue atender.

Detalhe que agrava para o cliente: o `404` é usado para **dois significados
diferentes** neste mesmo método — `"Controle de acesso não encontrado."` (a
empresa nunca solicitou, situação normal) e
`"Nenhum comercio vinculado como administrador"` (problema de conta). O frontend
é obrigado a fazer regex no texto da mensagem para distinguir, o que quebra
silenciosamente se o texto for corrigido.

**Correção sugerida:** decidir a intenção e alinhar os dois lados.

- Se Profissional deve ver o status: remover o filtro `== TipoPermissao.Admin` e
  aceitar qualquer vínculo.
- Se não deve: remover `Profissional` do `[Authorize]` e devolver `403` em vez
  de `404`.

Em qualquer dos casos, separar os status: `404` para "controle não existe" e
`403`/`409` para "conta sem vínculo adequado" — assim o cliente decide pelo
status, não pelo texto.

---

## 16. Swagger UI publicado na raiz do domínio em produção

**Onde:** `Program.cs`, linhas 166-171.

```csharp
app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("swagger/v1/swagger.json", "AgendaAi V1");
    options.RoutePrefix = string.Empty;      // Swagger na raiz
});
```

**O que acontece na prática:** `https://agendaai.bixs.com.br/` serve o Swagger
UI e `/swagger/v1/swagger.json` entrega o catálogo completo dos 78 endpoints,
com parâmetros e schemas, sem autenticação. Isso entrega o mapa da API pronto
para varredura automatizada — inclusive as rotas administrativas.

**Correção sugerida:** condicionar ao ambiente de desenvolvimento.

```csharp
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options => options.SwaggerEndpoint("/swagger/v1/swagger.json", "AgendaAi V1"));
}
```

Se precisar do Swagger em produção para integração, coloque atrás de
autenticação em vez de deixar aberto na raiz.

Ainda no `Program.cs`: `AllowedHosts: "*"` no `appsettings.json` e a lista de
origens de CORS hardcoded no código (linhas 57-62) — a lista de origens deveria
vir de configuração, para não exigir recompilar a API quando entrar um domínio
novo.

---

## 17. `GET /api/Comercios` carrega o grafo inteiro sem paginação

**Onde:** `Controllers/ComerciosController.cs`, linha 40. Padrão semelhante em
outros endpoints de listagem.

```csharp
var empresas = await _context.Comercios
    .Where(s => s.Ativo == true)
    .Include(s => s.Servicos)
        .ThenInclude(s => s.Agendamentos)
            .ThenInclude(s => s.Avaliacao)
    .ToListAsync();
```

**O que acontece na prática:** esse é o endpoint público do catálogo
(`[AllowAnonymous]`), ou seja, o mais chamado da aplicação. Ele traz **todos**
os comércios ativos com a árvore completa de serviços → agendamentos →
avaliações, só para calcular `totalAvalicoes` e `mediaAvalicoes` (dois números).
Hoje a base é pequena e passa despercebido; o custo cresce com o total histórico
de agendamentos, não com o número de comércios. Sem paginação, não existe
válvula de escape.

**Correção sugerida:** projetar com `.Select()` só o necessário (deixando a
agregação no banco) e adicionar `page`/`pageSize`.

```csharp
var empresas = await _context.Comercios
    .Where(s => s.Ativo)
    .OrderBy(s => s.Nome)
    .Skip((page - 1) * pageSize).Take(pageSize)
    .Select(s => new {
        s.Id, s.Nome, s.Endereco,
        TotalAvalicoes = s.Servicos.SelectMany(x => x.Agendamentos).Count(a => a.Avaliacao != null),
        MediaAvalicoes = s.Servicos.SelectMany(x => x.Agendamentos).Where(a => a.Avaliacao != null).Average(a => (double?)a.Avaliacao.Nota) ?? 0
    })
    .ToListAsync();
```

---

# BAIXO

## 18. `DateTime.Now` e `DateTime.UtcNow` misturados

**Onde:** `LoginController.cs` (~130), `AgendaController.cs` (~50),
`ComerciosController.cs` (~180), `ErroRegistro.cs` (23), entre outros.

Parte dos timestamps é gravada em horário local do servidor e parte em UTC, na
mesma base. Se o servidor roda em UTC e os usuários estão em UTC-3, comparações
entre campos gravados por caminhos diferentes ficam 3 horas defasadas — o que
importa em validação de antecedência de cancelamento e em expiração de token. As
consultas de agenda já usam `DateTime.UtcNow` para filtrar, então qualquer campo
gravado com `DateTime.Now` compara errado.

**Correção:** padronizar em `DateTime.UtcNow` para persistência e converter para
o fuso do usuário só na apresentação.

---

# LACUNA DE FUNCIONALIDADE

## 19. Não existe endpoint que gere ou envie o `VerificationCode`

**Onde:** `ViewModels/ControleView.cs` (`ControleViewPost`) e
`ComerciosController.cs:251-297`.

```csharp
public class ControleViewPost
{
    public Estado Payment { get; set; }
    public Estado Whatsapp { get; set; }
    public int IdEmpresa { get; set; }
    public required string Password { get; set; }
    public required string VerificationCode { get; set; }   // required, mas nada na API o produz
}
```

`POST /api/Comercios/solicitar-acesso` exige `VerificationCode` (campo
`required`) e o repassa para `_externalToken.CriarAcesso(...)`. Só que **nenhum
dos 78 endpoints da API gera, envia ou valida esse código**. Varremos o Swagger
e o código: não há equivalente a um `enviar-codigo-acesso`.

**O que isso significa:** o frontend não tem como disparar o envio do código.
Ele pode oferecer um campo para o usuário digitar um código que tenha recebido
por outro canal, mas não existe botão "enviar código" possível.

**O paralelo do PagWeb resolve a dúvida.** A API do PagWeb tem exatamente esse
endpoint faltante, e o frontend do PagWeb já o consome em produção:

```
POST /api/v1/User/enviar-codigo-acesso
```

Ele dispara um OTP de **6 dígitos por e-mail** (proxy da Bixs na API PagWeb), e
o `solicitar-acesso` do PagWeb recebe `password` + `verificationCode`,
exatamente como o do AgendaAi. Ou seja: **o fluxo pretendido é o mesmo, e o
AgendaAi só não tem o endpoint de envio.**

**O pedido concreto:** portar para a API do AgendaAi o equivalente de
`POST /api/v1/User/enviar-codigo-acesso` — um endpoint autenticado (role
`Admin`), sem corpo, que dispare o OTP de 6 dígitos para o e-mail do Admin
autenticado e devolva algo como
`{ "sentTo": "a***@dominio.com", "expiresInSeconds": 900 }`. A implementação do
PagWeb serve de referência direta.

**Enquanto isso:** o frontend do AgendaAi vai ser construído com o mesmo
tratamento do PagWeb — botão "enviar código" que degrada com mensagem explícita
quando o endpoint responde 404/405, e campo manual para o usuário digitar.
Assim, no dia em que o endpoint subir, a feature passa a funcionar sozinha, sem
mudança no frontend.

---

# O que analisamos e NÃO é problema

Registrado para evitar retrabalho e correção desnecessária:

1. **Casing das respostas JSON.** `AddControllers()` aplica
   `JsonNamingPolicy.CamelCase` por padrão (`JsonSerializerDefaults.Web`), então
   as respostas saem em camelCase mesmo com propriedades PascalCase no C#.
   Verificado: `GET /api/Comercios` →
   `[{"id":1,"nome":"...","totalAvalicoes":0}]`. Não há nada a corrigir aqui.
2. **`ReferenceHandler.IgnoreCycles` no `Program.cs`.** É a solução recomendada
   do .NET para ciclos de referência do EF Core.
3. **`ClockSkew = TimeSpan.FromSeconds(10)`.** Tolerância de relógio adequada; o
   padrão do framework (5 min) é mais frouxo.
4. **`[AllowAnonymous]` em `/api/Comercios` e `/api/Categorias/Todas/{id}`.**
   Intencional: o catálogo precisa ser visível para quem não está logado.
5. **Confirmação de senha em `solicitar-acesso`.** Pedir a senha do próprio
   Admin antes de criar acesso no parceiro é reautenticação de intenção — é uma
   boa prática, não um problema. Só note que ela é contornável no caminho de
   re-solicitação (item 20).
6. **`UsuarioController` valida identidade corretamente** (linhas 43-44 e
   81-82). Serve de referência para o padrão a aplicar no `AgendaController`
   (item 5).
7. **`/api/AdminTeste/*`** — utilitários de desenvolvimento, descartáveis, fora
   de escopo por decisão do time.

---

# Ordem sugerida de correção

| Ordem | Itens                                               | Por quê primeiro                                                                        | Esforço                 | Quebra o frontend?                                                     |
| ----- | --------------------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------- |
| 1     | 1 (overbooking)                                     | Corrompe dados a cada uso; quanto mais tempo, mais slots duplicados para sanear         | 3h + auditoria de dados | Não                                                                    |
| 2     | 2 (role Admin), 3 (ChavesPix 500)                   | Duas linhas de código cada; destravam a área do estabelecimento inteira                 | 1h                      | Não                                                                    |
| 3     | 4 (autorização morta), 5 (IDOR)                     | Vazamento entre empresas e entre clientes                                               | 4h                      | Só o item 5, se optar por remover o `{id}` — há alternativa sem quebra |
| 4     | 6 (segredos)                                        | Não é urgente por si (repo privado), mas é pré-requisito para qualquer auditoria futura | 4h + rotação            | Não                                                                    |
| 5     | 7 (senha p/ Bixs), 12 (null-forgiving)              | Mesmo arquivo do item 2; aproveitar o contexto                                          | 3h                      | Não                                                                    |
| 6     | 8 (`HttpClient`)                                    | Race condition que já morde em produção de forma intermitente                           | 3h                      | Não                                                                    |
| 7     | 20 (senha na re-solicitação), 21 (`Estado` default) | Mesmo fluxo; item 21 exige migração, então decidir junto                                | 3h + migração           | Não                                                                    |
| 8     | 9, 10 (ControleAcessos)                             | Melhora a operação do painel administrativo                                             | 4h                      | Sim (item 9 muda o formato da resposta — combinar)                     |
| 9     | 11 (ChavesPix), 19 (VerificationCode)               | Destrava as features novas                                                              | 3h + definição          | Não                                                                    |
| 10    | 13, 14, 15, 16, 17, 18, 22                          | Manutenção, contrato e performance                                                      | 14h                     | Itens 15 e 22 sim                                                      |

Os itens marcados como "quebra o frontend" precisam ser combinados antes do
deploy — o frontend do AgendaAi e o novo painel administrativo estão sendo
ajustados em paralelo.

---

**Contato:** dúvidas sobre qualquer item, o detalhamento completo (incluindo os
endpoints mapeados um a um e o snapshot do OpenAPI) está em
`apps/Agendai/docs/relatorio-api-2026-08-27.md` e
`apps/Agendai/docs/openapi-2026-08-27.json`.
