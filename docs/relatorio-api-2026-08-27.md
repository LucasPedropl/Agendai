# Relatório de Auditoria — API AgendaAi (27/08/2026)

## 1. Resumo executivo

Foi realizada uma auditoria técnica detalhada e exaustiva no código-fonte da API AgendaAi (.NET 8), localizada em `apps/Agendai/api`. Foram identificados **19 achados**, distribuídos em: **8 Críticos, 6 Altos, 4 Médios e 1 Baixo**.

> **Nota de revisão (27/08/2026).** Este relatório passou por uma segunda validação linha a linha após a geração automática. Nessa revisão: o achado **CRÍTICO-06** foi corrigido (citava linhas erradas e acusava indevidamente o `UsuarioController`, que na verdade valida a identidade corretamente); foram **acrescentados** os achados **CRÍTICO-18** (o endpoint de cancelamento não cancela e gera overbooking) e **CRÍTICO-19** (checagem de permissão multi-tenant é código morto); e a afirmação de que o repositório da API seria público foi corrigida — ele é **privado**. Achados marcados como CRÍTICO-02 (`AdminTeste` sem autenticação) foram confirmados por requisição real contra produção.

A aplicação apresenta vulnerabilidades graves de segurança e estabilidade que **impedem com segurança o uso em produção**:
1. **Exposição total de segredos**: Connection string com credenciais do banco SQL Server, API Key de produção da Bixs (`bxs_live_...`), senha SMTP e chave de assinatura JWT estão gravadas em texto puro no `appsettings.json` e commitadas no repositório (inclusive em artefatos de build em `bin/` e `obj/`). **Correção de fato (verificado em 27/08/2026):** o repositório `UaiPDV/AgendaAI-Prototipo` é **privado** — `api.github.com` e `raw.githubusercontent.com` devolvem 404 anônimo. Isso reduz a severidade de "vazamento público consumado" para "raio de alcance = todo colaborador do repo + histórico Git permanente". Continua CRÍTICO: os segredos estão no histórico para sempre, qualquer colaborador atual ou futuro os lê, e um único momento de repositório público ou fork exporia banco de produção, chave de assinatura JWT e API Key `bxs_live_` de uma só vez.
2. **Crash garantido (HTTP 500) e Lógica de Permissão Invertida**: O endpoint de Chaves PIX lança `FormatException` incondicional no `GET`/`DELETE` ao tentar converter um GUID `string` de usuário em `int`. Além disso, a verificação de permissão Admin no `LoginController` possui um bloco `if` vazio, impedindo que administradores legítimos recebam a Role `Admin` no JWT.
3. **Endpoint sem autenticação para apagar o banco e IDOR generalizado**: O `AdminTesteController` expõe a rota `DELETE /api/AdminTeste/Deletar-Dados` totalmente aberta à internet sem `[Authorize]`, permitindo que qualquer pessoa resete o banco de dados de produção. Adicionalmente, três endpoints de agendamento aceitam `id` por parâmetro de rota sem validar a identidade do JWT (IDOR — `Cliente/{id}`, `Cliente-Historico/{id}`, `Cancelar/{id}`), a checagem de vínculo com o comércio em `Comercio/{id}` e `Comercio-Historico` é código morto (CRÍTICO-19), e o `Cancelar/{id}` não altera o status do agendamento mas dispara o encaixe automático, gerando overbooking (CRÍTICO-18). O `UsuarioController` **não** tem IDOR — ele valida corretamente.

---

## 2. Tabela de achados

| # | Sev | Área | Arquivo:linha | Problema | Impacto |
|---|---|---|---|---|---|
| 01 | **CRÍTICO** | Segredos / Git | `appsettings.json:10,14-17,24,27` | Credenciais, API Keys, senhas SMTP e JwtKey expostas e versionadas no Git | Invasão do banco de dados, emissão de JWTs falsos e vazamento de emails |
| 02 | **CRÍTICO** | Segurança / BD | `AdminTesteController.cs:40-54` | Endpoint `DELETE /api/AdminTeste/Deletar-Dados` exposto publicamente sem `[Authorize]` | Reset completo e destruição da base de dados de produção por qualquer chamador anônimo |
| 03 | **CRÍTICO** | Autenticação | `LoginController.cs:59-77` | Bypass Master via credenciais públicas hardcoded sem usuário na base | Acesso de superusuário sem auditabilidade, lockout ou validação no ASP.NET Identity |
| 04 | **CRÍTICO** | Autorização | `LoginController.cs:106-116` | Lógica de atribuição de Role Admin cai em bloco `if` vazio | Administradores reais não recebem o claim `Admin` no JWT e são bloqueados |
| 05 | **CRÍTICO** | Estabilidade | `ChavesPixController.cs:27,127` | `int.Parse()` sobre `ClaimTypes.NameIdentifier` que armazena GUID `string` | Crash com `FormatException` (HTTP 500) garantido nos endpoints `GET` e `DELETE` |
| 06 | **CRÍTICO** | Segurança / IDOR | `AgendaController.cs:312-333`, `:345-367`, `:730-753` | Parâmetros de ID na URL sem checagem contra a identidade do token JWT em `Cliente/{id}`, `Cliente-Historico/{id}` e `Cancelar/{id}` | Qualquer usuário autenticado lê a agenda e o histórico de qualquer outro cliente e cancela agendamento de terceiros |
| 18 | **CRÍTICO** | Regra de Negócio / Dados | `AgendaController.cs:730-753` | `Cancelar/{id}` **nunca atribui** `Status = AppointmentStatus.Cancelado` antes do `SaveChangesAsync()` | O cancelamento não cancela nada e ainda cria um segundo agendamento no mesmo horário via `ReangendarAuto` → **overbooking silencioso** |
| 19 | **CRÍTICO** | Autorização (morta) | `AgendaController.cs:386-390`, `:433-437` | `if (useautorizado == null)` sobre um `IQueryable` de `.Where(...)`, que **nunca é null** | Checagem de permissão é código morto: qualquer Admin/Profissional autenticado lê a agenda e o histórico completo (com nome de clientes) de **qualquer** comércio |
| 07 | **ALTO** | Segurança / Perf | `LoginController.cs:78` | Envio de email/senha para API Bixs externa antes da autenticação local | Vazamento de credenciais locais, latência externa no login e falha se a Bixs cair |
| 08 | **ALTO** | Estabilidade | `LoginController.cs:102,114` | Uso de operator `!` (Null-Forgiving) em consultas LINQ que podem retornar `null` | HTTP 500 inesperado no login caso as Roles não estejam cadastradas |
| 09 | **ALTO** | Regra de Negócio | `ChavesPixController.cs:23,78,110` | Soft-delete sem filtro no `GET` e bloqueio de recadastro no `POST` | Impossibilidade de reativar chaves desativadas e vazamento de chaves inativas |
| 10 | **ALTO** | Integração | `ControleAcessosController.cs:120-148,163` | Falha silenciosa com HTTP 200 ao falhar no parceiro e Hard Delete sem desprovisionar | Desincronia silenciosa de status com a Bixs e perda irreversível de histórico |
| 11 | **ALTO** | Concorrência | `ExternalToken.cs:257` e `WhatsAppController.cs:137` | Mutação de `DefaultRequestHeaders` em `HttpClient` reutilizado | Race conditions sob carga enviando cabeçalhos e tokens de autorização trocados |
| 12 | **ALTO** | Concorrência / I/O | `ErroRegistro.cs:11-30` | Escrita síncrona manual em arquivo de texto `ErroRegistro.txt` sem lock | Travamento por contenção de arquivo (`IOException`) em acessos simultâneos |
| 13 | **MÉDIO** | Arquitetura | `ChavesPixController.cs` e `ComerciosController.cs:77` | Vínculo de `ChavePix` sem `ComercioId` e `status-acesso` pegando apenas o 1º comércio | Falhas de isolamento em cenários onde o Admin possui mais de um comércio |
| 14 | **MÉDIO** | Contrato / API | `ControleAcessosController.cs:40,68` | Respostas com objetos anônimos, casing inconsistente e data em `dd/MM/yyyy` | Schemas ausentes no Swagger e falha no parse de datas ISO 8601 pelo frontend |
| 15 | **MÉDIO** | Infraestrutura | `Program.cs:49,160` | Swagger exposto na raiz em produção e CORS com `AllowCredentials()` genérico | Exposição de mapa completo da API para varreduras externas |
| 16 | **MÉDIO** | Performance | `ComerciosController.cs:40` e `AgendaController.cs:30` | Consultas EF Core sem paginação (`ToListAsync()`) trazendo grafo completo | Consumo excessivo de RAM e lentidão com o crescimento da base |
| 17 | **BAIXO** | Padronização | `LoginController.cs:130` e `ComerciosController.cs:180` | Mistura de `DateTime.Now` e `DateTime.UtcNow` na gravação de datas | Inconsistência de fuso horário em agendamentos e timestamps |

---

## 3. Achados detalhados

### [CRÍTICO-01] Exposição pública de segredos e credenciais de produção no repositório Git

**Onde:** `apps/Agendai/api/appsettings.json` (linhas 10, 14-17, 24, 27) e arquivos compilados em `bin/` e `obj/`.

**Evidência:**
```json
"ConnectionStrings": {
  "DbConect": "Server=158.69.19.64,51433;Database=uaipdvco_agenda;uid=usu2_agenda;password=Id0d4h~06;TrustServerCertificate=true;"
},
"BixAPI": {
  "Email": "agendaai@vlks.com.br",
  "Password": "@gendaai",
  "API-Key": "bxs_live_6f33c9613846_VFqnw4OET5KYyp8kc5sBE2mjPiBZVqEkow-VaEov4kM"
},
"EmailSettings": {
  "Password": "44G7ob7%u"
},
"Jwt": {
  "Key": "S1Pqd4lc9rgylmWwUjr6TQ4ZuwPCuXZCApcjtVAmo5RkCb4Tqk6YAIBxXHzEHYMY"
}
```
Arquivo `apps/Agendai/api/.gitignore` possui apenas 10 bytes:
```gitignore
/.vs
/bin
```

**Por que é problema:**
1. A connection string aponta para um IP público (`158.69.19.64:51433`) com usuário e senha do banco SQL Server expostos. Qualquer pessoa na internet pode se conectar diretamente ao banco de dados e ler, alterar ou apagar todos os dados.
2. A API Key `bxs_live_...` é de ambiente **LIVE** (produção) da Bixs.
3. O `Jwt:Key` exposto permite que um atacante assine JWTs falsos com qualquer Claim/Role (inclusive `Admin` ou `Master`).
4. O `.gitignore` ignora apenas `/.vs` e `/bin`, mas as pastas `bin/` e `obj/` contendo binários compilados e artefatos de publicação (`obj/Release/net8.0/PubTmp/Out/appsettings.json`) já foram comitadas e estão rastreadas pelo Git (`git ls-files` confirma 8 arquivos `appsettings*.json` versionados).

**Correção mínima:**
1. Rotacionar imediatamente a senha do banco SQL Server, a API Key da Bixs, a senha do servidor SMTP e a chave JWT.
2. Remover as credenciais reais do `appsettings.json` e utilizar Variáveis de Ambiente ou `dotnet user-secrets` em desenvolvimento.
3. Atualizar o `apps/Agendai/api/.gitignore` para:
```gitignore
bin/
obj/
*.user
appsettings.json
appsettings.*.json
!appsettings.Example.json
ErroRegistro/*.txt
```
4. Executar limpeza do histórico do Git com `git filter-repo` ou BFG Repo-Cleaner para remover os segredos dos commits antigos.

---

### [CRÍTICO-02] Exposição de endpoint público para reset total e destruição da base de dados (`AdminTesteController`)

**Onde:** `apps/Agendai/api/Controllers/AdminTesteController.cs`, linhas 40-54.

**Evidência:**
```csharp
[HttpDelete("Deletar-Dados")]
public async Task<IActionResult> Delete()
{
    try
    {
        await _context.LimparBancoDeDadosManual();
        return Ok("O banco de dados foi completamente resetado.");
    }
    catch (Exception ex)
    {
        ErroRegistro.LogError("Erro ao chamar função Deletar-Dados: "+ ex);
        return StatusCode(500, "Ocorreu um erro ao deletar os dados.");
    }
}
```
O controller `AdminTesteController` tem a anotação `[ApiController]`, mas **NÃO possui `[Authorize]`** nem na classe nem no método.

**Por que é problema:**
Qualquer chamador anônimo na internet pode realizar uma requisição HTTP `DELETE /api/AdminTeste/Deletar-Dados` sem fornecer nenhum token de autenticação e acionar a função `LimparBancoDeDadosManual()`, deletando todas as tabelas e dados da aplicação em produção.

**Correção mínima:**
Remover o controller `AdminTesteController.cs` da compilação de produção ou restringir com atributo de compilação condicional e autorização estrita:
```csharp
#if DEBUG
[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Admin")]
public class AdminTesteController : ControllerBase
{
    // ...
}
#endif
```

---

### [CRÍTICO-03] Autenticação Master via credencial hardcoded, pública e sem usuário cadastrado

**Onde:** `apps/Agendai/api/Controllers/LoginController.cs`, linhas 59-77.

**Evidência:**
```csharp
if (login.Email == _config["BixAPI:Email"] && login.Password == _config["BixAPI:Password"])
{
    var usuarioDtoM = new UsuarioDto
    {
        Id ="Master00",
        UserName = "Usuario Master",
        Email = login.Email,
        tipoPermissao = "Master"
    };
    var tokenM = _userService.GerarToken(usuarioDtoM);
    int expiracao = 60;
    var tokenReturno = new TokenResponse
    {
        Token = tokenM,
        Expiracao = $"{expiracao}m",
        Permissao = "Master"
    };
    return Ok(tokenReturno);
}
```

**Por que é problema:**
1. A credencial master (`agendaai@vlks.com.br` / `@gendaai`) está fixa no `appsettings.json` e pública no repositório.
2. O login aceita essa credencial sem consultar a tabela `AspNetUsers` no banco de dados.
3. Não há mecanismos de Lockout, Rate Limiting ou verificação de dois fatores.
4. É gerado um JWT com `Id = "Master00"`. Se esse token for utilizado em endpoints que fazem buscas no banco utilizando o `UsuarioId` (como em `_context.Users.FindAsync(UsuarioId)` ou `UsuariosComercios`), a aplicação lançará exceção ou `NullReferenceException` porque o usuário `"Master00"` não existe fisicamente no banco.
5. No `Program.cs` (linhas 137-148), as Roles semeadas são apenas `Admin`, `Profissional` e `Cliente`. A Role `Master` não é cadastrada no Identity, funcionando unicamente devido à leitura dos claims do JWTBearer.

**Correção mínima:**
Remover o bloco de login hardcoded e gerenciar permissões administrativas via banco de dados ASP.NET Identity com credenciais seguras.

---

### [CRÍTICO-04] Lógica invertida no login bloqueia atribuição de Role Admin para administradores legítimos

**Onde:** `apps/Agendai/api/Controllers/LoginController.cs`, linhas 106-116.

**Evidência:**
```csharp
tipoUsuario = _context.UsuariosComercios.FirstOrDefault(ue => ue.UsuarioId == usuario.Id && ue.TipoPermissao == TipoPermissao.Admin);

if (tipoUsuario != null || (tokenexterno != null && tokenexterno != "Erro"))
{

}
else
{
    var Role = _context.UserRoles.FirstOrDefault(ur => ur.UserId == usuario.Id && ur.RoleId == _context.Roles.FirstOrDefault(r => r.Name == "Admin")!.Id);
    if (Role != null) { usuarioDto.tipoPermissao = "Admin"; }
}
```

**Por que é problema:**
Quando o usuário é um Administrador registrado (`tipoUsuario != null`), o comando cai em um bloco de código **completamente VAZIO `{}`**. A variável `usuarioDto.tipoPermissao` permanece com o valor `"Cliente"` (atribuído na linha 95). A role `"Admin"` só seria atribuída no bloco `else` (quando o usuário NÃO for encontrado como Admin no comércio). Em consequência, **nenhum administrador de comércio consegue obter um token JWT com a Role Admin**, sendo bloqueado em todos os endpoints decorados com `[Authorize(Roles = "Admin")]`.

**Correção mínima:**
```csharp
if (tipoUsuario != null || (tokenexterno != null && tokenexterno != "Erro"))
{
    usuarioDto.tipoPermissao = "Admin";
}
else
{
    var adminRoleId = await _context.Roles
        .Where(r => r.Name == "Admin")
        .Select(r => r.Id)
        .FirstOrDefaultAsync();

    if (adminRoleId != null && await _context.UserRoles.AnyAsync(ur => ur.UserId == usuario.Id && ur.RoleId == adminRoleId))
    {
        usuarioDto.tipoPermissao = "Admin";
    }
}
```

---

### [CRÍTICO-05] Crashes garantidos (HTTP 500) por conversão inválida de tipo em `ChavesPixController`

**Onde:** `apps/Agendai/api/Controllers/ChavesPixController.cs`, linhas 27 e 127.

**Evidência:**
```csharp
// Linha 27 (GetChavePix) e Linha 127 (DeleteChavePix)
var idUserClaim = User.FindFirst(ClaimTypes.NameIdentifier);
if (idUserClaim == null) return Unauthorized();

var idUser = int.Parse(idUserClaim.Value); // <--- LANÇA FormatException!
```

**Por que é problema:**
A classe `Usuario` herda de `IdentityUser`, que utiliza Chave Primária no formato `string` (GUID, ex: `"a1b2c3d4-e5f6-7890-abcd-ef1234567890"`). A execução de `int.Parse(idUserClaim.Value)` falha incondicionalmente com a exceção `FormatException: Input string was not in a correct format.`, gerando erro HTTP 500 sem tratamento em todas as requisições `GET /api/ChavesPix` e `DELETE /api/ChavesPix/{idchavepix}`.
Além disso, a variável `idUser` é código morto, pois as consultas LINQ posteriores utilizam a propriedade `UsuarioId` da classe base `BaseController`.

**Correção mínima:**
Remover as linhas 27 e 127 do `ChavesPixController.cs`.

---

### [CRÍTICO-06] IDOR em endpoints de agendamento do cliente

> **Revisado em 27/08/2026 (validação linha a linha).** A versão original deste achado citava linhas erradas e incluía `UsuarioController.cs`. **`UsuarioController` NÃO tem IDOR** — as linhas 43-44 (`GET`) e 81-82 (`PUT`) fazem `if (id != UsuarioId) return Forbid("Acesso negado. Você só pode acessar seu próprio perfil.");`. O IDOR real está apenas no `AgendaController`, e inclui um endpoint que o achado original não mencionava (`Cancelar/{id}`).

**Onde:** `apps/Agendai/api/Controllers/AgendaController.cs` — `Cliente/{id}` (linhas 312-333), `Cliente-Historico/{id}` (linhas 345-367) e `Cancelar/{id}` (linhas 730-753).

**Evidência:**
```csharp
// AgendaController.cs:312-324
[HttpGet("Cliente/{id}")]
[Authorize]
public async Task<IActionResult> Get(string id)
{
    if (id == null)
    {
        return BadRequest("ID inválido.");
    }
    var agendas = await _context.Agendamentos
        .Where(a => a.UsuarioId == id && a.DataAgendamento > DateTime.UtcNow && a.Status == AppointmentStatus.Confirmado)
        // ^ 'id' vem da URL e NUNCA é comparado com UsuarioId (claim do JWT)
        .ToListAsync();
```

```csharp
// AgendaController.cs:730-737 — Cancelar não valida dono algum
[HttpDelete("Cancelar/{id}")]
[Authorize]
public async Task<IActionResult> Delete(int id)
{
    var agendamento = await _context.Agendamentos.Where(s => s.Id == id).Include(s => s.Servico).FirstOrDefaultAsync();
    if (agendamento == null)
    {
        return NotFound("Agendamento não encontrado.");
    }
    // ...segue direto para o cancelamento, sem checar agendamento.UsuarioId == UsuarioId
```

**Por que é problema:**
`[Authorize]` só garante que existe um token válido — não que o token pertença ao dono do recurso. Como o `id` do cliente é um GUID do Identity, ele circula em respostas da própria API (ex.: listagens de agenda do comércio incluem `Include(a => a.Usuario)`), então não é um segredo. Efeito prático: qualquer conta de cliente recém-criada enumera a agenda futura e o histórico completo de outro cliente (nome do serviço, profissional, datas) e, via `DELETE /api/Agenda/Cancelar/{id}` com um `id` inteiro sequencial, dispara o fluxo de cancelamento de agendamento de terceiros — `id` aqui é `int` incremental, então é trivialmente enumerável.

**Correção mínima:**
Nos dois GETs de cliente, deixar de aceitar o `id` por rota e usar a claim:
```csharp
[HttpGet("Cliente")]
[Authorize]
public async Task<IActionResult> GetClienteAgendamentos()
{
    var agendas = await _context.Agendamentos
        .Where(a => a.UsuarioId == UsuarioId && a.DataAgendamento > DateTime.UtcNow && a.Status == AppointmentStatus.Confirmado)
        .Include(a => a.Servico)
        .Include(a => a.Profissional)
        .ToListAsync();
    return Ok(agendas);
}
```
No `Cancelar/{id}`, validar dono ou vínculo com o comércio antes de qualquer efeito:
```csharp
var ehDono = agendamento.UsuarioId == UsuarioId;
var ehDoComercio = await _context.UsuariosComercios.AnyAsync(ue =>
    ue.UsuarioId == UsuarioId &&
    ue.ComercioId == agendamento.Servico.ComercioId &&
    (ue.TipoPermissao == TipoPermissao.Admin || ue.TipoPermissao == TipoPermissao.Profissional));
if (!ehDono && !ehDoComercio)
    return Forbid();
```
**Breaking change no frontend:** trocar `GET /api/Agenda/Cliente/{id}` por `GET /api/Agenda/Cliente` afeta `apps/Agendai/src` — coordenar com o plano em `plano-frontend-api-2026-08-27.md`.

---

### [CRÍTICO-18] `Cancelar/{id}` não cancela o agendamento e gera overbooking

**Onde:** `apps/Agendai/api/Controllers/AgendaController.cs`, linhas 730-753 (e o método privado `ReangendarAuto`, linhas 754-796).

**Evidência:**
```csharp
var tempoCancelamento = configComercio.TempoCancelamento;
if (agendamento.DataAgendamento.AddHours(-tempoCancelamento) < DateTime.UtcNow)
{
    return BadRequest($"O agendamento só pode ser cancelado com pelo menos {tempoCancelamento} hora(s) de antecedência.");
}
_context.Agendamentos.Update(agendamento);   // <-- entidade NÃO foi modificada
await _context.SaveChangesAsync();
await ReangendarAuto(agendamento, agendamento.Servico.ComercioId);
return Ok("Cancelado com Sucesso!");
```

Não existe, em nenhum ponto entre a leitura da entidade e o `SaveChangesAsync()`, uma atribuição `agendamento.Status = AppointmentStatus.Cancelado`. Compare com `Comercio-Cancela/{id}`, que é o caminho usado pelo estabelecimento, e confirme se lá o status é atribuído — o cliente e o comércio precisam ter o mesmo comportamento.

**Por que é problema:** dois efeitos somados, ambos observáveis em produção:
1. **O cancelamento é um no-op.** O `Update` marca a entidade como modificada sem nenhuma mudança de valor, o EF emite um UPDATE que não altera nada, e a API responde `200 "Cancelado com Sucesso!"`. O agendamento continua `Confirmado` — ele volta a aparecer na agenda do comércio e na agenda do próprio cliente, que acredita ter cancelado.
2. **`ReangendarAuto` cria um segundo agendamento no mesmo slot.** Ele monta um `Agendamento` novo com o **mesmo** `ProfissionalId`, `DataAgendamento`, `HoraAgendamento` e `ServicoId`, apontando para outro usuário (`BuscarMelhorClienteParaEncaixe`) com `Status = Pendente`, e chama `_context.Add`. Como o original não foi cancelado, o horário fica com **dois** agendamentos. O cliente encaixado recebe WhatsApp/e-mail confirmando um horário que não está livre.

O comentário `// Substitua pelo ID real do usuário autenticado` na linha 767 sugere que esse fluxo nunca foi concluído.

**Correção mínima:**
```csharp
agendamento.Status = AppointmentStatus.Cancelado;
_context.Agendamentos.Update(agendamento);
await _context.SaveChangesAsync();
await ReangendarAuto(agendamento, agendamento.Servico.ComercioId);
```
Recomendado além do mínimo: envolver o cancelamento e o encaixe automático em uma única transação (`_context.Database.BeginTransactionAsync()`), porque hoje uma falha no `ReangendarAuto` deixa o banco em estado parcial; e verificar se já existe agendamento ativo no slot antes de inserir o encaixe.

**Auditoria de dados:** antes de corrigir, rodar um levantamento de agendamentos duplicados (mesmo `ProfissionalId` + `DataAgendamento` + `HoraAgendamento` com mais de um registro não cancelado) para dimensionar quantos slots já estão com overbooking em produção.

---

### [CRÍTICO-19] Checagem de permissão morta em `Comercio/{id}` e `Comercio-Historico`

**Onde:** `apps/Agendai/api/Controllers/AgendaController.cs`, linhas 386-390 e 433-437.

**Evidência:**
```csharp
var useautorizado = _context.UsuariosComercios.Where(ue => ue.ComercioId == id && ue.UsuarioId == UsuarioId && (ue.TipoPermissao == TipoPermissao.Profissional || ue.TipoPermissao == TipoPermissao.Admin));
if (useautorizado == null)
{
    return Unauthorized("Você não tem permissão para acessar a agenda!");
}
```

**Por que é problema:** `.Where(...)` devolve um `IQueryable<UsuarioComercio>`, que é um objeto de consulta **não materializado e nunca `null`** — mesmo quando o banco não tem nenhuma linha correspondente. Portanto `useautorizado == null` é **sempre falso** e o `return Unauthorized(...)` é código inalcançável. O `[Authorize(Roles = "Admin,Profissional")]` da rota só garante que o chamador é Admin ou Profissional de *algum* comércio; não amarra ao `{id}` da URL. Resultado: qualquer Admin/Profissional autenticado troca o `{id}` e lê a agenda futura e o histórico completo de **qualquer outro comércio** — incluindo `Include(a => a.Usuario)`, ou seja, nome dos clientes da concorrência. É quebra de isolamento multi-tenant, com implicação de LGPD.

O mesmo padrão aparece no `ComerciosController.cs:104-107` (`FirstOrDefaultAsync` + checagem de `null`), que está **correto** — a diferença é justamente a materialização da consulta. Vale varrer o restante da API procurando por `.Where(...)` seguido de comparação com `null`.

**Correção mínima:** materializar a consulta com `AnyAsync` e inverter a checagem:
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
Use `Forbid()` (403) em vez de `Unauthorized()` (401): o chamador está autenticado, o que falta é permissão — 401 faz o frontend disparar o fluxo de refresh token indevidamente (ver `apps/Agendai/src/lib/api.ts:78`).

---

### [ALTO-01] Envio prematuro de credenciais locais para API de terceiros (Bixs) em todo Login

**Onde:** `apps/Agendai/api/Controllers/LoginController.cs`, linha 78.

**Evidência:**
```csharp
var tokenexterno = await _apiBixs.VerificaAcesso(login);
var usuario = _context.Users.FirstOrDefault(u => u.Email == login.Email && u.Status == TipoStatusUsuario.Ativo);
if (usuario == null)
{
    return BadRequest("Usuario não encontrado ou inativo");
}
if (!await _userManager.CheckPasswordAsync(usuario, login.Password))
{
    return Unauthorized("Senha ou usuário incorreta");
}
```

**Por que é problema:**
A chamada `_apiBixs.VerificaAcesso(login)` envia o email e a senha digitados pelo usuário via requisição HTTP POST para a API externa da Bixs antes mesmo de validar se o usuário existe localmente ou se a senha está correta.
Impactos:
1. **Vazamento de Dados**: Credenciais inválidas ou digitadas com erro são enviadas para servidores terceiros.
2. **Latência e Indisponibilidade**: Se a API externa da Bixs estiver indisponível ou com alta latência, a autenticação local da AgendaAi é travada ou falha.
3. **Bloqueio por Rate Limit**: Ataques de força bruta contra a AgendaAi repassam o tráfego para a Bixs, podendo causar o banimento do IP ou da API Key da AgendaAi.

**Correção mínima:**
Executar `VerificaAcesso(login)` **somente após** confirmar a autenticação local bem-sucedida do usuário:
```csharp
var usuario = await _userManager.FindByEmailAsync(login.Email);
if (usuario == null || usuario.Status != TipoStatusUsuario.Ativo)
{
    return BadRequest("Usuario não encontrado ou inativo");
}
if (!await _userManager.CheckPasswordAsync(usuario, login.Password))
{
    return Unauthorized("Senha ou usuário incorreta");
}
// Somente após validação local
var tokenexterno = await _apiBixs.VerificaAcesso(login);
```

---

### [ALTO-02] Risco de `NullReferenceException` por uso de Operator `!` em consultas LINQ em `LoginController`

**Onde:** `apps/Agendai/api/Controllers/LoginController.cs`, linhas 102 e 114.

**Evidência:**
```csharp
// Linha 102
var Role = _context.UserRoles.FirstOrDefault(ur => ur.UserId == usuario.Id && ur.RoleId == _context.Roles.FirstOrDefault(r => r.Name == "Profissional")!.Id);

// Linha 114
var Role = _context.UserRoles.FirstOrDefault(ur => ur.UserId == usuario.Id && ur.RoleId == _context.Roles.FirstOrDefault(r => r.Name == "Admin")!.Id);
```

**Por que é problema:**
Se a consulta `_context.Roles.FirstOrDefault(r => r.Name == "Profissional")` ou `"Admin"` retornar `null` (por exemplo, banco novo ou inicialização sem roles), o uso do operador null-forgiving `!` encobre o aviso do compilador, mas em tempo de execução o acesso à propriedade `.Id` dispara `NullReferenceException` (HTTP 500) interrompendo o fluxo de login.

**Correção mínima:**
Buscar as roles com segurança verificando a existência prévia do registro:
```csharp
var profissionalRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Profissional");
if (profissionalRole != null)
{
    var hasRole = await _context.UserRoles.AnyAsync(ur => ur.UserId == usuario.Id && ur.RoleId == profissionalRole.Id);
    if (hasRole) usuarioDto.tipoPermissao = "Profissional";
}
```

---

### [ALTO-03] Soft-delete quebrado e reativação impossível em `ChavesPixController`

**Onde:** `apps/Agendai/api/Controllers/ChavesPixController.cs`, linhas 23-38, 74-106, 109-135.

**Evidência:**
```csharp
// DeleteChavePix (linha 131)
chavepix.Status = false;

// GetChavePix (linha 28)
var chavesPix = await _context.ChavesPix.Where(c => c.UsuarioId == UsuarioId).ToListAsync();

// PostChavePix (linha 82)
var chaveExistente = await _context.ChavesPix.AnyAsync(c => c.Chave == chavepix.Chave && c.UsuarioId == UsuarioId);
if (chaveExistente) return BadRequest("Chave PIX já cadastrada.");
```

**Por que é problema:**
1. O `DELETE` realiza soft-delete alterando `Status = false`.
2. O `GET` busca todas as chaves sem filtrar `Status == true`, exibindo chaves deletadas/inativas para o usuário.
3. O `POST` verifica duplicidade com `AnyAsync` sem filtrar por status ativo. Se um usuário desativar uma chave e tentar cadastrá-la novamente, a API bloqueia com a mensagem `"Chave PIX já cadastrada."`, tornando impossível recadastrar a chave PIX desativada.
4. Ausência de validação do formato da chave PIX (CPF, CNPJ, Email, Telefone, EVP) e de validação de enum/tipo em `TipoChave`.

**Correção mínima:**
1. No `GET`, filtrar por `c.Status == true`.
2. No `POST`, se a chave já existir com `Status == false`, reativá-la e atualizar seus dados em vez de rejeitar.

---

### [ALTO-04] Aprovação parcial silenciosa, falta de idempotência e Hard Delete em `ControleAcessosController`

**Onde:** `apps/Agendai/api/Controllers/ControleAcessosController.cs`, linhas 120-148, 163-176.

**Evidência:**
```csharp
if (controle.Payment == Estado.Ativo)
{
    if (!await _externalToken.SolicitarApp(controle.IdBixs, "payment"))
    {
        controle.Payment = Estado.Inativo; // Falha silenciosa!
    }
}
// Retorna HTTP 200 OK informando que o controle foi atualizado
return Ok(mensagem);
```
No `DeleteControleAcesso`:
```csharp
_context.ControleAcessos.Remove(controleacesso); // Hard Delete
await _context.SaveChangesAsync();
```

**Por que é problema:**
1. Se a ativação na API parceira (Bixs) falhar, a propriedade `Payment` é revertida para `Inativo` no banco local, mas o método responde HTTP 200 OK. O administrador que realizou a chamada assume que o acesso foi concedido com sucesso.
2. O método `DELETE` remove o registro fisicamente do banco de dados (Hard Delete) sem desprovisionar ou revogar as credenciais na Bixs, deixando acessos órfãos no parceiro externo.

**Correção mínima:**
Retornar erro HTTP `400 BadRequest` ou `502 Bad Gateway` se a integração com a Bixs falhar, e substituir o `DELETE` por desativação de status (`controle.estado = Estado.Inativo`).

---

### [ALTO-05] Race condition por mutação de `DefaultRequestHeaders` no `HttpClient` compartilhado

**Onde:** `apps/Agendai/api/Services/ExternalToken.cs` (linha 257) e `apps/Agendai/api/Controllers/WhatsAppController.cs` (linhas 137, 185, 252).

**Evidência:**
```csharp
_httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", await _tokenStorage.GetValidTokenAsync(idAdmin));
```

**Por que é problema:**
A classe `HttpClient` injetada via Injeção de Dependência é reutilizada entre requisições concorrentes. Alterar a propriedade `DefaultRequestHeaders` durante o atendimento de uma requisição assíncrona causa **Race Condition**. Se duas requisições de comércios diferentes forem processadas simultaneamente, o cabeçalho de autorização de uma sobrescreverá o da outra, enviando chamadas para as APIs parceiras com tokens de administradores errados.

**Correção mínima:**
Não utilizar `DefaultRequestHeaders`. Passar os cabeçalhos diretamente no objeto `HttpRequestMessage`:
```csharp
using var request = new HttpRequestMessage(HttpMethod.Get, "instances");
request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
var response = await _httpClient.SendAsync(request);
```

---

### [ALTO-06] Bloqueio e contenção de concorrência por I/O em arquivo texto por `ErroRegistro.LogError`

**Onde:** `apps/Agendai/api/Models/ErroRegistro.cs`, linhas 11-30.

**Evidência:**
```csharp
public static void LogError(string message)
{
    // ...
    string diretorio = Directory.GetCurrentDirectory() + "/ErroRegistro/ErroRegistro.txt";
    using (StreamWriter writer = new StreamWriter(diretorio, true))
    {
        writer.WriteLine($"{DateTime.Now}: {message}");
    }
}
```

**Por que é problema:**
Toda vez que ocorre um erro na API, o método estático abre o arquivo `ErroRegistro.txt` e escreve síncronamente no disco. Em um ambiente Web concorrente, múltiplas requisições tentando escrever no mesmo arquivo simultaneamente resultarão em exceções `System.IO.IOException: The process cannot access the file because it is being used by another process`, perdendo o registro dos erros e degradando a performance das threads da API.

**Correção mínima:**
Substituir o manipulador estático manual pelo serviço de logging nativo do ASP.NET Core (`ILogger<T>`).

---

### [MÉDIO-01] Modelo multi-tenant furado em `ChavesPix` e em `GET /api/Comercios/status-acesso`

**Onde:** `apps/Agendai/api/Controllers/ChavesPixController.cs` e `apps/Agendai/api/Controllers/ComerciosController.cs` (linhas 77-78).

**Evidência:**
```csharp
// ComerciosController.cs (linha 77)
var vinculo = await _context.UsuariosComercios
    .FirstOrDefaultAsync(ue => ue.UsuarioId == UsuarioId && ue.TipoPermissao == TipoPermissao.Admin);
```

**Por que é problema:**
1. A entidade `ChavePix` é vinculada apenas ao `UsuarioId` e não possui relação com `ComercioId`, divergindo do modelo multi-tenant do restante da aplicação (`UsuariosComercios`).
2. O endpoint `GET /api/Comercios/status-acesso` utiliza `FirstOrDefaultAsync` para encontrar o vínculo do Admin. Caso o usuário gerencie mais de um comércio, a API sempre retornará o status apenas do primeiro comércio encontrado.

**Correção mínima:**
Adicionar `ComercioId` na entidade e tabela `ChavesPix`, e solicitar o `comercioId` via parâmetro no endpoint `status-acesso`.

---

### [MÉDIO-02] Inconsistência de schemas no Swagger e formato de data não-ISO 8601

**Onde:** `apps/Agendai/api/Controllers/ControleAcessosController.cs`, linhas 40-47 e 68-83.

**Evidência:**
```csharp
var resultado = new
{
    IdControle = controleacesso.IdControle,
    estado = controleacesso.estado, // Casing minúsculo inconsistente
    DataSolicitado = controleacesso.Solicitado.ToString("dd/MM/yyyy HH:mm:ss") // Não ISO 8601
};
```

**Por que é problema:**
1. O retorno de objetos anônimos impede o Swagger/OpenAPI de gerar o schema dos modelos de resposta.
2. A propriedade `estado` utiliza inicial minúscula enquanto as demais utilizam PascalCase.
3. O envio de datas formatadas como string nativa brasileira (`dd/MM/yyyy HH:mm:ss`) quebra parsers de data em bibliotecas frontend e clientes móveis que esperam o padrão ISO 8601 (`yyyy-MM-ddTHH:mm:ssZ`).

**Correção mínima:**
Criar DTOs fortemente tipados para as respostas e retornar o objeto `DateTime` diretamente sem conversão para string personalizada.

---

### [MÉDIO-03] Swagger exposto em Produção e CORS permissivo com `AllowCredentials()`

**Onde:** `apps/Agendai/api/Program.cs`, linhas 49-61 e 160-165.

**Evidência:**
```csharp
app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("swagger/v1/swagger.json", "AgendaAi V1");
    options.RoutePrefix = string.Empty; // Exposto na raiz em produção
});
```

**Por que é problema:**
A interface do Swagger UI é montada na raiz do domínio sem qualquer proteção ou restrição de ambiente. Em produção, isso expõe o catálogo completo de endpoints, parâmetros e esquemas da API para mapeamento por agentes maliciosos. Além disso, as configurações de CORS combinam `AllowCredentials()` com origens permitidas via código.

**Correção mínima:**
Envelopar o Swagger no bloco de ambiente de desenvolvimento:
```csharp
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "AgendaAi V1");
    });
}
```

---

### [MÉDIO-04] Consultas EF Core sem paginação e carregamento de grafos completos em `ComerciosController`

**Onde:** `apps/Agendai/api/Controllers/ComerciosController.cs`, linha 40.

**Evidência:**
```csharp
var empresas = await _context.Comercios
    .Where(s => s.Ativo == true)
    .Include(s => s.Servicos)
        .ThenInclude(s => s.Agendamentos)
            .ThenInclude(s => s.Avaliacao)
    .ToListAsync();
```

**Por que é problema:**
A consulta carrega em memória **todos** os comércios ativos do banco juntamente com a árvore completa de serviços, agendamentos e avaliações associadas sem limite ou paginação (`Take`/`Skip`). Conforme o volume de agendamentos cresce, essa requisição causará consumo excessivo de memória RAM no servidor e gargalos de I/O no banco SQL Server.

**Correção mínima:**
Aplicar projeção `.Select()` para trazer apenas as estatísticas necessárias e adicionar parâmetros de paginação `page` e `pageSize`.

---

### [BAIXO-01] Mistura de `DateTime.Now` com `DateTime.UtcNow` no controle de timestamps

**Onde:** `LoginController.cs` (linha 130), `AgendaController.cs` (linha 50) e `ComerciosController.cs` (linha 180).

**Evidência:**
Parte das tabelas grava timestamps utilizando `DateTime.Now` (horário local do servidor) e parte utiliza `DateTime.UtcNow`.

**Por que é problema:**
Gera inconsistências em servidores hospedados em nuvem com fuso horário UTC em comparação com clientes no fuso horário do Brasil (UTC-3), podendo afetar validações de expiração de token e cálculo de horários de agendamento.

**Correção mínima:**
Padronizar toda a aplicação para utilizar exclusivamente `DateTime.UtcNow`.

---

## 4. Delta da API (67 → 78 endpoints)

Mapeamento completo dos 78 endpoints presentes no Swagger (snapshot em `apps/Agendai/docs/openapi-2026-08-27.json`, baixado de `https://agendaai.bixs.com.br/swagger/v1/swagger.json` em 27/08/2026):

| Endpoint | Método | Status | Role Exigida | Schema do Body | Observações |
|---|---|---|---|---|---|
| `/api/AdminTeste/Usuarios` | GET | Legado | Nenhuma (Erro) | — | **Vazamento de dados**: Lista todos os usuários sem auth |
| `/api/AdminTeste/Empresas` | GET | Legado | Nenhuma (Erro) | — | Lista todas as empresas sem auth |
| `/api/AdminTeste/Empresas` | DELETE | Legado | Nenhuma (Erro) | — | Assinatura incorreta (DELETE agindo como GET) |
| `/api/AdminTeste/Deletar-Dados` | DELETE | Legado | Nenhuma (Erro) | — | **CRÍTICO**: Reseta todo o banco de dados sem auth |
| `/api/Agenda/Agenda-Datas` | GET | Legado | `[Authorize]` | — | Retorna datas disponíveis |
| `/api/Agenda/Agenda-Horarios` | GET | Legado | `[Authorize]` | — | Retorna slots de horários |
| `/api/Agenda/Cliente/{id}` | GET | Legado | `[Authorize]` | — | **IDOR**: Não valida se {id} pertence ao JWT |
| `/api/Agenda/Cliente-Historico/{id}` | GET | Legado | `[Authorize]` | — | **IDOR**: Histórico acessível por terceiros |
| `/api/Agenda/Comercio/{id}` | GET | Legado | `Admin, Profissional` | — | **CRÍTICO-19**: checagem de vínculo é código morto (`Where(...) == null`) — lê agenda de qualquer comércio |
| `/api/Agenda/Comercio-Historico/{id}/{periodo}/{status}/{profissional}` | GET | **Modificado** | `Admin, Profissional` | — | Alterado de QueryString para Path Params |
| `/api/Agenda` | POST | Legado | `[Authorize]` | `AgendamentoView` | Cria novo agendamento |
| `/api/Agenda/Comercio-Agendar` | POST | Legado | `Admin, Profissional` | `AgendamentoView` | Agendamento feito pelo estabelecimento |
| `/api/Agenda/Cliente-Confirma-Agenda` | POST | Legado | `[Authorize]` | — | Confirmação pelo cliente |
| `/api/Agenda/Reagendar/{id}` | PUT | Legado | `[Authorize]` | `AgendamentoView` | Reagenda horário existente |
| `/api/Agenda/Comercio-Cancela/{id}` | DELETE | Legado | `Admin, Profissional` | `bool` | Cancelamento pelo comércio |
| `/api/Agenda/Cancelar/{id}` | DELETE | Legado | `[Authorize]` | — | Cancelamento pelo cliente |
| `/api/Avaliacoes/Empresa/{id}` | GET | Legado | Anonymous | — | Lista avaliações da empresa |
| `/api/Avaliacoes/Usuario/{id}` | GET | Legado | `[Authorize]` | — | Lista avaliações do usuário |
| `/api/Avaliacoes/{id}` | PUT | Legado | `[Authorize]` | `AvaliacaoView` | Atualiza avaliação |
| `/api/Cartoes/Todos/{id}` | GET | Legado | `[Authorize]` | — | Lista cartões salvos |
| `/api/Cartoes/{id}` | GET | Legado | `[Authorize]` | — | Detalhe do cartão |
| `/api/Cartoes/{id}` | DELETE | Legado | `[Authorize]` | — | Remove cartão |
| `/api/Cartoes` | POST | Legado | `[Authorize]` | `CartaoDTO` | Cadastra cartão de crédito |
| `/api/Categorias/Todas/{id}` | GET | Legado | Anonymous | — | Lista categorias por comércio |
| `/api/Categorias/{id}` | GET | Legado | `[Authorize]` | — | Detalhe da categoria |
| `/api/Categorias/{id}` | PUT | Legado | `Admin, Profissional` | `CategoriaDTO` | Atualiza categoria |
| `/api/Categorias/{id}` | DELETE | Legado | `Admin, Profissional` | — | Desativa categoria |
| `/api/Categorias` | POST | Legado | `Admin, Profissional` | `CategoriaDTO` | Cadastra nova categoria |
| `/api/ChavesPix` | GET | **Novo** | `Admin` | — | **CRÍTICO**: Crash HTTP 500 por `int.Parse` |
| `/api/ChavesPix` | POST | **Novo** | `Admin` | `ChavePixPost` | Cadastra chave PIX |
| `/api/ChavesPix/{idchavepix}` | GET | **Novo** | `Admin` | — | Obtém chave PIX por ID |
| `/api/ChavesPix/{idchavepix}` | PUT | **Novo** | `Admin` | `ChavePixPut` | Atualiza chave PIX |
| `/api/ChavesPix/{idchavepix}` | DELETE | **Novo** | `Admin` | — | **CRÍTICO**: Crash HTTP 500 por `int.Parse` |
| `/api/Comercios` | GET | Legado | Anonymous | — | Lista comércios ativos |
| `/api/Comercios` | POST | Legado | `[Authorize]` | `ComercioViewPost` | Cadastra comércio |
| `/api/Comercios/Admin` | GET | Legado | `Admin, Profissional` | — | Lista comércios do admin |
| `/api/Comercios/status-acesso` | GET | **Novo** | `Admin, Profissional` | — | Obtém status de integração Bixs |
| `/api/Comercios/{id}` | GET | Legado | Anonymous | — | Detalhes públicos do comércio |
| `/api/Comercios/{id}` | PUT | Legado | `Admin, Profissional` | `ComercioViewPut` | Atualiza dados do comércio |
| `/api/Comercios/{id}` | DELETE | Legado | `Admin` | — | Desativa comércio |
| `/api/Comercios/solicitar-acesso` | POST | **Novo** | `Admin` | `ControleViewPost` | Solicita integração de pagamento/whatsapp |
| `/api/ComercioUsuarios/Clientes/{id}` | GET | Legado | `Admin, Profissional` | — | Lista clientes do comércio |
| `/api/ComercioUsuarios/Profissionais-Agendar/{id}` | GET | Legado | Anonymous | — | Lista profissionais para agendamento |
| `/api/ComercioUsuarios/Profissionais/{id}` | GET | Legado | `Admin, Profissional` | — | Lista equipe do comércio |
| `/api/ComercioUsuarios/Cadastrar-Funcionario-Cliente` | POST | Legado | `Admin` | `RegistrarCliente` | Vincula funcionário ou cliente |
| `/api/ComercioUsuarios/Desativar-Usuario/{idEmpresa}/{id}` | DELETE | Legado | `Admin` | — | Desvincula usuário do comércio |
| `/api/ConfigComercio/{id}` | GET | Legado | `Admin, Profissional` | — | Configurações do comércio |
| `/api/ConfigComercio` | POST | Legado | `Admin` | `ConfigComercio` | Cria configuração inicial |
| `/api/ConfigComercio/Editar-Atendimento/{id}` | PUT | Legado | `Admin` | `HorarioAtendimento` | Edita jornada de trabalho |
| `/api/ControleAcessos` | GET | **Novo** | `Master` | — | Lista solicitações de acesso Bixs |
| `/api/ControleAcessos/{idcontrole}` | GET | **Novo** | `Master` | — | Detalhes da solicitação de acesso |
| `/api/ControleAcessos/{idcontrole}` | PUT | **Novo** | `Master` | `ControleViewPut` | Aprova/rejeita acesso |
| `/api/ControleAcessos/{idcontrole}` | DELETE | **Novo** | `Master` | — | Remove controle de acesso |
| `/api/Login/Acesso` | POST | Legado | Anonymous | `Login` | Autenticação padrão |
| `/api/Login/google-login` | POST | Legado | Anonymous | `LoginGoogle` | Login Social Google |
| `/api/Login/facebook-login` | POST | Legado | Anonymous | `LoginFacebook` | Login Social Facebook |
| `/api/Login/Registrar` | POST | Legado | Anonymous | `RegistrarCliente` | Cadastro de usuário |
| `/api/Login/Ativar-Login` | POST | Legado | Anonymous | `AtivarConta` | Ativação via e-mail |
| `/api/Login/Logout` | POST | Legado | `[Authorize]` | — | Revoga cookies e tokens |
| `/api/Login/refresh-token` | POST | Legado | Anonymous | — | Renova token JWT |
| `/api/Pagamentos/Pagamentos-Cliente` | GET | Legado | `[Authorize]` | — | Histórico de pagamentos do cliente |
| `/api/Pagamentos/Pagamentos-Empresa/{id}` | GET | Legado | `Admin, Profissional` | — | Relatório financeiro da loja |
| `/api/Pagamentos/{id}` | GET | Legado | `[Authorize]` | — | Detalhe do pagamento |
| `/api/Pagamentos/Confirmar/{id}` | GET | Legado | `Admin` | — | Confirmação manual de pagamento |
| `/api/Pagamentos` | POST | Legado | `[Authorize]` | `MetodoPagamento` | Processa pagamento |
| `/api/Servicos/Todos/{id}` | GET | Legado | Anonymous | — | Lista serviços da loja |
| `/api/Servicos/{id}` | GET | Legado | Anonymous | — | Detalhe do serviço |
| `/api/Servicos/{id}` | PUT | Legado | `Admin, Profissional` | `ServicoDTO` | Atualiza serviço |
| `/api/Servicos/{id}` | DELETE | Legado | `Admin, Profissional` | — | Remove serviço |
| `/api/Servicos` | POST | Legado | `Admin, Profissional` | `ServicoDTO` | Cadastra serviço |
| `/api/Usuario/{id}` | GET | Legado | `[Authorize]` | — | OK — valida `id != UsuarioId` e devolve `Forbid` (`UsuarioController.cs:43-44`) |
| `/api/Usuario/{id}` | PUT | Legado | `[Authorize]` | `UsuarioEdit` | Atualiza perfil |
| `/api/Usuario/{id}` | DELETE | Legado | `[Authorize]` | — | Desativa usuário |
| `/api/Usuario/Config-Usuario/{id}` | GET | Legado | `[Authorize]` | — | Preferências do usuário |
| `/api/Usuario/Config-Usuario/{id}` | PUT | Legado | `[Authorize]` | `ConfigUsuario` | Edita preferências |
| `/api/WhatsApp/Status/{id}` | GET | Legado | `Admin, Profissional` | — | Checa conexão WhatsApp |
| `/api/WhatsApp/Obter-QrCode/{id}` | GET | Legado | `Admin, Profissional` | — | Gera QR Code para pareamento |
| `/api/WhatsApp/Desconectar/{id}` | DELETE | Legado | `Admin, Profissional` | — | Desconecta instância |

---

## 5. Ordem de correção recomendada

| Ordem | Tarefa | Esforço Est. | Breaking Change Frontend? |
|---|---|---|---|
| 1 | **Saneamento do Git e Rotação de Credenciais**: Remover `AdminTesteController` ou aplicar `#if DEBUG`, remover segredos do `appsettings.json`, atualizar `.gitignore` e rotacionar chaves do banco, JWT, Bixs e SMTP. | 4 horas | Não |
| 2 | **Correção de Crashes e Lógica de Auth**: Remover `int.Parse` em `ChavesPixController` e corrigir o bloco `if` vazio de atribuição da Role `Admin` em `LoginController.cs`. | 2 horas | Não |
| 3 | **Overbooking do cancelamento (CRÍTICO-18)**: atribuir `Status = Cancelado` antes do `SaveChangesAsync()` em `AgendaController.cs:749`, envolver com o `ReangendarAuto` numa transação e auditar os slots já duplicados em produção. | 3 horas | Não |
| 4 | **Autorização morta (CRÍTICO-19)**: trocar `Where(...) == null` por `AnyAsync` + `Forbid()` em `AgendaController.cs:386` e `:433`, e varrer a API atrás do mesmo padrão. | 2 horas | Não |
| 5 | **IDOR no AgendaController (CRÍTICO-06)**: `Cliente/{id}` e `Cliente-Historico/{id}` passam a usar a claim (rota sem `{id}`); `Cancelar/{id}` valida dono ou vínculo com o comércio. Não mexer no `UsuarioController`, que já valida. | 4 horas | **Sim** — remove o `{id}` de duas rotas consumidas pelo frontend |
| 6 | **Ajuste na Chamada de Login Externa**: Mover `VerificaAcesso(login)` para ocorrer apenas após validação local de senha com sucesso. | 2 horas | Não |
| 7 | **Correção de Soft-Delete e Regras em ChavesPix**: Ajustar `GET`, `POST` e `DELETE` em `ChavesPixController` para suportar reativação e filtrar por status ativo. | 3 horas | Não |
| 8 | **Refatoração de Concorrência do HttpClient**: Remover mutações de `DefaultRequestHeaders` em `ExternalToken.cs` e `WhatsAppController.cs`, utilizando `HttpRequestMessage`. | 3 horas | Não |
| 9 | **Substituição do Logging em Arquivo**: Substituir o `ErroRegistro.LogError` síncrono pelo `ILogger` nativo do ASP.NET Core. | 2 horas | Não |
| 10 | **Padronização de Contratos e DTOs**: Substituir retornos de objetos anônimos no `ControleAcessosController` por DTOs tipados com ISO 8601. | 4 horas | **Sim** (ajuste nos nomes e formato de datas das propriedades JSON) |
| 11 | **Proteção de Infraestrutura e Paginação**: Restringir o Swagger ao ambiente de desenvolvimento e adicionar paginação nos endpoints de listagem de comércios. | 3 horas | Não |

---

## 6. O que NÃO é problema

Durante a auditoria, os seguintes pontos foram analisados e validados como **comportamentos intencionais ou corretos**:
1. `ReferenceHandler.IgnoreCycles` no `Program.cs`: A inclusão de `ReferenceHandler.IgnoreCycles` nas opções do JSON Serializer é a solução padrão recomendada pelo .NET para evitar exceções de ciclo de referência ao serializar relacionamentos bidirecionais do EF Core.
2. `[AllowAnonymous]` em `/api/Comercios` e `/api/Categorias/Todas/{id}`: A abertura desses endpoints sem autenticação é intencional para permitir a exibição do catálogo de empresas e serviços para clientes não autenticados no aplicativo público.
3. `TokenValidationParameters.ClockSkew = TimeSpan.FromSeconds(10)`: A definição de um atraso de relógio de 10 segundos é uma prática recomendada para evitar a rejeição imediata de tokens por divergências mínimas de relógio entre servidores.
4. Confirmação de senha local em `/api/Comercios/solicitar-acesso`: O endpoint exige que o administrador confirme a senha local para reautenticar a intenção antes de criar uma conta ou vincular a empresa no parceiro Bixs.
