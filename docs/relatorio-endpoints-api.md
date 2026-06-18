# Relatório de Endpoints — API AgendaAi

**Data:** 17/06/2026  
**Ambiente testado:** `https://agendaai.bixs.com.br` (via MCP `agendaai`)  
**Código analisado:** `api/` (somente leitura — nenhuma alteração feita)  
**Total de endpoints no Swagger/MCP:** 67

---

## Resumo executivo

Dos 67 endpoints catalogados, a maioria responde corretamente em cenários de leitura (GET). Os problemas reais dividem-se em três categorias:

| Categoria | Quantidade | Gravidade |
|-----------|------------|-----------|
| Bugs de código (tipagem, lógica, contrato) | 9 | Alta — quebram integração frontend/MCP |
| Falhas de integração externa (WhatsApp/TLS) | 2 | Alta — módulo WhatsApp inoperante |
| Comportamento questionável (HTTP status, formato) | 5 | Média — dificultam consumo da API |
| Instabilidade de deploy IIS (intermitente) | 1 | Crítica quando ocorre — bloqueia módulos inteiros |

**Cobertura de testes MCP:** 25,4% por casos salvos; ~40 endpoints exercitados manualmente nesta auditoria.

---

## Resultado dos testes por módulo

### Funcionando (200 OK nos testes)

| Endpoint | Observação |
|----------|------------|
| `GET /api/Comercios` | Exige Bearer na prática (401 sem token) |
| `GET /api/Comercios/{id}` | OK |
| `GET /api/Comercios/Admin` | OK com perfil estabelecimento |
| `POST /api/Login/Acesso` | OK — retorna JWT |
| `GET /api/Usuario/{id}` | OK — GUID como parâmetro |
| `GET /api/AdminTeste/*` | OK (dev/QA) |
| `GET /api/Categorias/Todas/{id}` | OK |
| `GET /api/Categorias/{id}` | OK |
| `GET /api/Servicos/Todos/{id}` | OK |
| `GET /api/ConfigComercio/{id}` | OK quando configurado |
| `GET /api/ComercioUsuarios/Clientes/{id}` | OK |
| `GET /api/ComercioUsuarios/Profissionais/{id}` | OK |
| `GET /api/ComercioUsuarios/Profissionais-Agendar/{id}` | OK |
| `GET /api/Agenda/Agenda-Datas` | OK (pode retornar `[]`) |
| `GET /api/Agenda/Agenda-Horarios` | OK parcial — ver bug #8 |
| `GET /api/Agenda/Cliente/{id}` | OK |
| `GET /api/Agenda/Cliente-Historico/{id}` | OK |
| `GET /api/Agenda/Comercio/{id}` | OK — retorna string `"Agenda Vazia"` se vazio |
| `GET /api/Agenda/Comercio-Historico/{id}` | OK — retorna string `"Histórico Vazio"` |
| `GET /api/Cartoes/Todos/{id}` | OK |
| `POST /api/Login/Registrar` | OK com payload completo (`confirmPassword`, etc.) |

### Comportamento esperado sem dados (404 de negócio)

| Endpoint | Resposta |
|----------|----------|
| `GET /api/Pagamentos/Pagamentos-Cliente` | 404 — "Nenhum pagamento encontrado para este cliente." |
| `GET /api/Pagamentos/Pagamentos-Empresa/{id}` | 404 — sem pagamentos cadastrados |
| `GET /api/Avaliacoes/Usuario/{id}` | 404 — sem avaliações |
| `GET /api/Avaliacoes/Empresa/{id}` | 404 — sem avaliações (com auth Admin) |

### Com falha real (bug ou integração)

| Endpoint | Status | Problema |
|----------|--------|----------|
| `GET /api/Usuario/Config-Usuario/{id}` | 400 | Parâmetro `int` — GUID inválido |
| `PUT /api/Usuario/Config-Usuario/{id}` | — | Mesmo bug de tipagem |
| `GET /api/Servicos/{id}` | 404 | Busca por `ComercioId` em vez de `Id` |
| `POST /api/Login/refresh-token` | 401 | Exige cookie `refresh_token`, não funciona só com Bearer |
| `GET /api/WhatsApp/Status/{id}` | 200* | Retorna `"Erro ao verificar sessão"` no body |
| `GET /api/WhatsApp/Obter-QrCode/{id}` | 400 | Falha ao obter QR Code (API externa) |
| `DELETE /Desativar-Usuario/{idComercio}/{id}` | — | Rota fora de `/api/` + binding incorreto |

---

## Bugs detalhados (código)

### 1. `Config-Usuario` — tipo de parâmetro incorreto

**Severidade:** Alta  
**Endpoints:** `GET/PUT /api/Usuario/Config-Usuario/{id}`  
**Arquivo:** `api/Controllers/UsuarioController.cs` (linhas 109–155)

**Problema:** O parâmetro de rota é `int id`, mas o restante da API usa GUID (`string`) para identificar usuários. Ao passar um GUID válido (ex.: `8fc484d2-1af0-4999-8799-c13ff37bbb94`), o model binder retorna 400:

```json
{"errors":{"id":["The value '8fc484d2-...' is not valid."]}}
```

Além disso, `FindAsync(id)` busca pela PK da tabela `ConfigUsuario`, não pelo `UsuarioId`.

**Como resolver:**
- Alterar assinatura para `string id` (GUID do usuário).
- Buscar com `_context.ConfigUsuarios.FirstOrDefaultAsync(c => c.UsuarioId == id)`.
- Criar registro padrão se não existir (opcional, para melhor UX).

---

### 2. `GET /api/Servicos/{id}` — filtro errado no banco

**Severidade:** Alta  
**Arquivo:** `api/Controllers/ServicosController.cs` (linha 75)

**Problema:** O método `GetServico` filtra `s.ComercioId == id` quando deveria filtrar `s.Id == id`:

```csharp
var servicos = await _context.Servicos
    .Where(s => s.ComercioId == id && s.Ativo)  // BUG: deveria ser s.Id == id
    ...
```

**Evidência:** `GET /api/Servicos/2` retorna 404, embora o serviço id=2 exista (comercioId=1). `GET /api/Servicos/1` funciona por coincidência (id == comercioId).

**Como resolver:** Trocar para `.Where(s => s.Id == id && s.Ativo)`.

---

### 3. `POST /api/Login/refresh-token` — dependência de cookie

**Severidade:** Alta (para SPAs e clientes MCP/mobile)  
**Arquivo:** `api/Controllers/LoginController.cs` (linhas 616–676)

**Problema:** O endpoint exige `[Authorize]` e lê o refresh token **apenas** do cookie `refresh_token`:

```csharp
var refreshToken = Request.Cookies["refresh_token"];
if (string.IsNullOrEmpty(refreshToken)) return Unauthorized();
```

Clientes que usam apenas `Authorization: Bearer` (como o MCP e o frontend Next.js) não conseguem renovar o token.

**Como resolver:**
- Aceitar refresh token no body (`{ "refreshToken": "..." }`) ou header dedicado.
- Manter cookies como opção para browsers.
- Retornar o novo JWT no body (hoje só retorna `{ message: "Token renovado!" }`).

---

### 4. Typo na role `Profissional` no refresh

**Severidade:** Média  
**Arquivo:** `api/Controllers/LoginController.cs` (linha 649)

**Problema:** Durante o refresh, a busca de role usa `"Proffisional"` (typo):

```csharp
_context.Roles.FirstOrDefault(r => r.Name == "Proffisional")
```

Usuários profissionais vinculados apenas via `AspNetUserRoles` podem receber permissão `"Cliente"` após refresh.

**Como resolver:** Corrigir para `"Profissional"`.

---

### 5. WhatsApp — integração externa falha

**Severidade:** Alta  
**Arquivo:** `api/Controllers/WhatsAppController.cs`  
**Log:** `api/ErroRegistro/ErroRegistro.txt`

**Problema:**
- `HttpClient` instanciado diretamente no construtor (anti-pattern — risco de socket exhaustion e token desatualizado).
- Chamadas para `https://api.bixs.com.br/v1/api/message/` falham por TLS (`AuthenticationException`, certificado/handshake).
- `Status` retorna HTTP 200 com `status: "Erro ao verificar sessão"` em vez de erro explícito.
- `Obter-QrCode` retorna 400 `{ message: "Falha ao obter QR Code" }`.

**Como resolver:**
- Usar `IHttpClientFactory` com handler nomeado.
- Renovar certificado SSL de `api.bixs.com.br` ou configurar política TLS adequada.
- Injetar `TokenStorage` de forma reativa (atualizar Bearer antes de cada chamada).
- Retornar status HTTP coerente (502/503 para falha de integração).

---

### 6. `GET /api/Pagamentos/Confirmar/{id}` — autorização fraca

**Severidade:** Média (segurança)  
**Arquivo:** `api/Controllers/PagamentosController.cs` (linhas 103–116)

**Problema:** Qualquer usuário autenticado pode confirmar qualquer pagamento. Não há verificação de role Admin nem de vínculo com o comércio.

**Como resolver:** Adicionar `[Authorize(Roles = "Admin")]` e validar que o pagamento pertence ao comércio do usuário logado.

---

### 7. `GET /api/ConfigComercio/{id}` — resposta não-JSON

**Severidade:** Média  
**Arquivo:** `api/Controllers/ConfigComercioController.cs` (linhas 42–45)

**Problema:** Quando não há horário ou configuração, retorna string plain text:

```csharp
return Ok("Horário de atendimento ou configurações não encontrado.");
```

O frontend espera objeto JSON — causa erro de parse.

**Como resolver:** Retornar `NotFound(...)` ou objeto estruturado `{ "message": "...", "configurado": false }`.

---

### 8. Agenda — `DiasFechados` usa ID errado

**Severidade:** Média  
**Arquivo:** `api/Controllers/AgendaController.cs` (linhas 73–77, 191–192)

**Problema:** Consultas de dias fechados comparam `ConfigComercioId` com `comercioId`:

```csharp
.Where(df => df.ConfigComercioId == agendamentoData.comercioId ...)
```

`ConfigComercioId` é FK da tabela de configuração, não o ID do comércio. Feriados/bloqueios nunca são aplicados corretamente.

**Como resolver:** Resolver o `ConfigComercio.Id` a partir do `comercioId` antes da query, ou filtrar via join com `ConfiguracoesComercio`.

---

### 9. `Agenda-Horarios` — resposta inconsistente quando loja fechada

**Severidade:** Baixa  
**Arquivo:** `api/Controllers/AgendaController.cs` (linhas 184–193)

**Problema:** Em dia fechado, retorna `{ Data: "..." }` sem `HorariosDisponiveis`. Em dia aberto, retorna `{ Data, HorariosDisponiveis }`. Contrato inconsistente para o frontend.

**Como resolver:** Sempre incluir `HorariosDisponiveis: []` na resposta.

---

### 10. `DELETE /Desativar-Usuario/{idComercio}/{id}` — rota e binding

**Severidade:** Média  
**Arquivo:** `api/Controllers/ComercioUsuariosController.cs` (linhas 239–241)

**Problemas:**
1. Rota absoluta `/Desativar-Usuario/...` fica **fora** do prefixo `/api/`.
2. Parâmetro da rota é `{idComercio}` mas o método declara `int idEmpresa` — binding pode falhar.

```csharp
[HttpDelete("/Desativar-Usuario/{idComercio}/{id}")]
public async Task<IActionResult> Delete(int idEmpresa, string id)
```

**Como resolver:**
- Usar `[HttpDelete("Desativar-Usuario/{idComercio}/{id}")]` (rota relativa ao controller).
- Renomear parâmetro para `int idComercio`.

---

### 11. Agenda — respostas string em vez de array

**Severidade:** Baixa  
**Arquivo:** `api/Controllers/AgendaController.cs` (linhas 383, histórico similar)

**Problema:** `GetComercio` retorna `Ok("Agenda Vazia")` em vez de `Ok([])`.

**Como resolver:** Padronizar retorno como array vazio ou objeto `{ items: [], message: "..." }`.

---

## Problema de infraestrutura (intermitente)

### IIS 404.0 — Handler `StaticFile`

**Sintoma observado em testes anteriores:** diversos endpoints (`/api/Agenda/*`, `/api/WhatsApp/*`, etc.) retornavam HTML do IIS:

- **Handler:** `StaticFile`
- **Physical Path:** `E:\vhosts\...\agendaai.bixs.com.br\api\Agenda\...`

Isso indica que o IIS tratou a URL como arquivo estático em vez de repassar ao ASP.NET Core Module.

**Causa provável:**
- Pasta física `api/` no vhost interceptando requisições.
- ASP.NET Core Module mal configurado ou app pool parado.
- Deploy desatualizado (DLL antiga sem os controllers).

**Como resolver (ops, sem alterar código):**
1. Verificar `web.config` com handler `aspNetCore` para todas as rotas.
2. Remover/renomear pasta física `api` no vhost se existir.
3. Republicar a API e reiniciar o app pool.
4. Confirmar que `GET /api/Agenda/Agenda-Datas` retorna JSON (não HTML IIS).

> **Nota:** Na sessão de testes de 17/06/2026 (tarde), os endpoints de Agenda voltaram a responder 200, sugerindo correção temporária ou republicação.

---

## Observações adicionais

### `PUT /api/Servicos/{id}` — categorias

O código atual **já implementa** atualização N:N de categorias (linhas 213–248 de `ServicosController.cs`). O bug antigo de "ignorar categorias no PUT" aparenta ter sido corrigido no código local. Validar no ambiente deployado.

### `Program.cs` — pipeline

- Swagger na raiz (`RoutePrefix = string.Empty`) — em produção, considerar restringir acesso.
- `AddControllers()` registrado duas vezes (linhas 28 e 51) — redundante, sem impacto funcional.
- CORS não inclui domínio `agendaai.bixs.com.br` — pode afetar chamadas browser diretas.

### Pagamentos — cálculo de valor

Em `POST /api/Pagamentos`, se `Valor != 0` e diferente do preço, o código **soma** o preço ao valor enviado (linha 148) — comportamento suspeito para integração de gateway.

---

## Prioridade de correção sugerida

1. **P0:** Deploy IIS estável + `Config-Usuario` tipagem + `Servicos/{id}` GET
2. **P1:** `refresh-token` para clientes Bearer + WhatsApp/TLS
3. **P2:** DiasFechados, Desativar-Usuario rota, Pagamentos/Confirmar auth
4. **P3:** Contratos JSON consistentes (strings vs arrays, ConfigComercio)

---

## Arquivos de referência

| Arquivo | Conteúdo relevante |
|---------|-------------------|
| `api/Controllers/UsuarioController.cs` | Bug Config-Usuario |
| `api/Controllers/ServicosController.cs` | Bug GET por id |
| `api/Controllers/LoginController.cs` | Refresh token, typo role |
| `api/Controllers/WhatsAppController.cs` | Integração Bixs |
| `api/Controllers/AgendaController.cs` | DiasFechados, contratos |
| `api/Controllers/ConfigComercioController.cs` | Retorno string |
| `api/Controllers/PagamentosController.cs` | Confirmar sem auth |
| `api/Controllers/ComercioUsuariosController.cs` | Desativar-Usuario |
| `api/Program.cs` | Pipeline, CORS, Swagger |
| `api/ErroRegistro/ErroRegistro.txt` | Logs TLS/WhatsApp |

---

*Relatório gerado por auditoria automatizada via MCP `agendaai`. Nenhum arquivo em `api/` foi modificado.*
