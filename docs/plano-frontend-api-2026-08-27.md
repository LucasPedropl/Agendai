# Plano de Adequação do Frontend — API AgendaAi 27/08/2026

> **Escopo:** análise read-only. Fonte de verdade do contrato: `apps/Agendai/docs/openapi-2026-08-27.json` (78 endpoints, OpenAPI 3.0.4, gerado em 24/08/2026). Código da API conferido em `apps/Agendai/api` (somente leitura).

---

## 1. Resumo executivo

### O que quebra hoje em produção (impacto imediato)

| Severidade | Item | Arquivos |
|---|---|---|
| **P0** | `GET /api/Agenda/Comercio-Historico` migrado de querystring para **4 path params** — frontend ainda chama `?periodo=&status=` | 2 arquivos, 2 linhas |
| **P0** | `DELETE /Desativar-Usuario/...` sem prefixo `/api/ComercioUsuarios/` — rota inexistente | 2 arquivos |
| **P0** | Bug de API no login: Admin com vínculo em `UsuariosComercios` recebe `tipoPermissao: Cliente` no JWT → bloqueio na área admin | Efeito em todo fluxo auth (6+ arquivos dependentes do `userType`) |

### Inventário numérico

| Métrica | Valor |
|---|---|
| Endpoints no Swagger | **78** |
| Chamadas distintas no frontend (`fetchApi` / `fetch`) | **~45** |
| Chamadas **QUEBRADAS** (rota/assinatura) | **4** (2 histórico + 2 desativar usuário) |
| Chamadas **DIVERGENTES** (shape/casing/enum) | **~12** (estimativa conservadora; ver §3 e §6) |
| Endpoints da API **sem consumo** no frontend | **~33** (inclui ChavesPix, Bixs acesso, ControleAcessos Master, AdminTeste, POST Pagamentos, etc.) |
| Arquivos `src/` com chamadas de API | **28** |

### Bloqueado por bug/lacuna de API (frontend não deve gambiarrear)

1. **ChavesPix `GET` e `DELETE`** — `int.Parse` em claim GUID (`ChavesPixController.cs:27`, `:127`) → **500 garantido** em usuários reais.
2. **ChavesPix `GET {id}`** — não tem o bug de parse, mas depende de listagem funcional para UX.
3. **Solicitar acesso Bixs** — `VerificationCode` é repassado à API externa Bixs (`ExternalToken.cs:360`, `POST v1/api/directory/clients`); **não existe endpoint AgendaAi** que gere ou envie esse código ao admin.
4. **Login Admin** — bloco vazio em `LoginController.cs:108-111` impede `tipoPermissao = "Admin"` quando há vínculo `UsuariosComercios`.

### Observação sobre `MetodoPagamento`

O commit da API mencionou remoção de `MetodoPagamento.cs`, mas no snapshot atual o arquivo **existe** e o Swagger referencia `MetodoPagamento` em `POST /api/Pagamentos`. O que mudou de fato é `PagamentoView.cs` (DTOs externos + classe interna `PaymentCaixa`) e o enum `TipoPagamento` (novos valores `PixCaixa=4`, `CartaoDebito=5`, `TransferenciaBancaria=6`). O frontend **não chama** `POST /api/Pagamentos` hoje — impacto é preparação para feature futura.

---

## 2. Quebras (P0) — o app está chamando contrato que não existe mais

| # | Endpoint | Arquivo:linha | Sintoma atual | Correção | Esforço |
|---|---|---|---|---|---|
| 1 | `GET /api/Agenda/Comercio-Historico/{id}/{periodo}/{status}/{profissional}` | `src/hooks/useAdminQueries.ts:33-34` | 404 — rota antiga com `?periodo=&status=` | Montar URL com path params (ver detalhamento) | P |
| 2 | Idem | `src/components/layout/AdminLayout.tsx:94-95` | 404 no prefetch do histórico | Idem | P |
| 3 | `DELETE /api/ComercioUsuarios/Desativar-Usuario/{idEmpresa}/{id}` | `src/app/(admin)/profissionais/page.tsx:46` | 404 — chama `/Desativar-Usuario/...` | Corrigir para `/api/ComercioUsuarios/Desativar-Usuario/${comercioId}/${confirmId}` | P |
| 4 | Idem | `src/app/(admin)/clientes/page.tsx:47` | Idem | Idem | P |

### Detalhamento P0-1/2: Comercio-Historico

**Antes (frontend):**
```
GET /api/Agenda/Comercio-Historico/{comercioId}?periodo=8&status=Concluido
```

**Depois (contrato API):**
```
GET /api/Agenda/Comercio-Historico/{id}/{periodo}/{status}/{profissional}
```

**Comportamento confirmado no controller** (`AgendaController.cs:427-504`):

| Parâmetro | Tipo | Filtro vazio / “todos” | Valores aceitos quando preenchido |
|---|---|---|---|
| `id` | `int` | obrigatório | ID do comércio |
| `periodo` | `int` | **`0` ou qualquer valor fora de 1–12** → sem filtro de mês | `1`–`12` filtra `DataAgendamento.Month` |
| `status` | `string?` | **omitir segmento** ou string vazia → exclui cancelados por padrão | `"Concluido"`, `"Cancelado"`, `"Não compareceu"` |
| `profissional` | `string?` | **omitir segmento** ou string vazia → todos | GUID do profissional (`Profissional.Id`) |

**Sentinelas recomendadas para helper centralizado** (novo em `src/lib/apiHelpers.ts`):

```typescript
// Exemplo conceitual — implementar em buildComercioHistoricoPath()
// Sem filtro de status/profissional:
`/api/Agenda/Comercio-Historico/${id}/${periodo}`
// Com status (aba "Concluídos"):
`/api/Agenda/Comercio-Historico/${id}/${periodo}/Concluido`
// Com status + profissional (futuro):
`/api/Agenda/Comercio-Historico/${id}/${periodo}/${status}/${profissionalId}`
```

**Atenção:** o Swagger marca os 4 path params como `required: true`, mas o controller declara `{status?}/{profissional?}` — segmentos finais são opcionais em runtime. **Confirmar com teste HTTP** se `profissional` pode ser filtrado sem `status` (provável bloqueio de roteamento ASP.NET — nesse caso exigir mudança na API ou sentinela acordada).

**Resposta da API** — array de objetos anônimos PascalCase:
`DataAgendamento`, `ServicoNome`, `UsuarioNome`, `Status`, `HoraAgendamento`  
ou wrapper `{ Agendamentos: [] }` quando vazio. O `normalizeApiList` já trata `Agendamentos`; o mapeamento em `historico/page.tsx:32-36` usa camelCase e precisa aceitar PascalCase (ver P1).

**Arquivos a alterar:** `src/lib/apiHelpers.ts` (helper + atualizar comentário linha 101), `src/hooks/useAdminQueries.ts`, `src/components/layout/AdminLayout.tsx`, opcionalmente `src/lib/queryKeys.ts` se incluir `profissional` no cache key.

### Detalhamento P0-3/4: Desativar usuário

**Antes:** `DELETE /Desativar-Usuario/{comercioId}/{userId}`  
**Depois:** `DELETE /api/ComercioUsuarios/Desativar-Usuario/{idEmpresa}/{id}`

---

## 3. Divergências de contrato (P1)

| # | Endpoint / área | Campo | Frontend espera | API devolve/exige | Arquivo:linha |
|---|---|---|---|---|---|
| 1 | Login `POST /api/Login/Acesso` | permissão | `response.permissao` (camelCase) | `Permissao` no `TokenResponse` + JWT `ClaimTypes.Role` | `login/page.tsx:71-74` |
| 2 | Login (bug API) | role Admin | `Admin` → área estabelecimento | `Cliente` no JWT quando há `UsuariosComercios` Admin | `LoginController.cs:106-116`, `AuthContext.tsx:16-18`, `App.tsx:60-63` |
| 3 | Login Master | role `Master` | não tratado — cai em `cliente` | `tipoPermissao: "Master"` para credencial BixAPI | `apiHelpers.ts:42-45`, `LoginController.cs:59-76` |
| 4 | Comercio-Historico GET | campos do item | `dataAgendamento`, `servicoNome`, … | `DataAgendamento`, `ServicoNome`, … (PascalCase — sem `PropertyNamingPolicy` em `Program.cs:29-32`) | `historico/page.tsx:32-36` |
| 5 | Pagamentos GET | campos | `valor`, `dataCriacao`, `statusPagamento`, `metodoPagamento` | `Valor`, `DataCriacao`, `StatusPagamento`, `MetodoPagamento` | `financeiro/page.tsx:58-68`, `financas/page.tsx:154-179`, `useFinance.ts:4-13` |
| 6 | Pagamentos enum | `metodoPagamento` | comentário: `2=Pix` | `2=Boleto`, `3=Pix`, **`4=PixCaixa`**, `5=CartaoDebito`, `6=TransferenciaBancaria` | `financas/page.tsx:49-53`, `Pagamento.cs:30-38` |
| 7 | Pagamentos enum | `statusPagamento` | `0/1/2` mapeados | `3=Reembolsado` não tratado na UI | `financas/page.tsx:37-46`, `financeiro/page.tsx:63-68` |
| 8 | Pagamentos POST (futuro) | body | não implementado | `MetodoPagamento`: `agendamentoId`, `tipoPagamento`, `valor`, `endereco`/`enderecoPagamento`, `idCartao`/`cartao` | — |
| 9 | Pagamentos POST (futuro) | response PIX/Boleto | — | `{ message, codigoPagamento, transacao }` | `PagamentosController.cs:341` |
| 10 | Serviços POST/PUT | body | `preco: number`, `duracao: string`, campo `servico` duplicado | Swagger `Servico`: `preco: double`, `duracao: date-span` | `servicos/page.tsx:120-127` |
| 11 | Cadastrar funcionário | `permissao` | `0` cliente / `1` profissional (número) | Swagger `ComercioAddUser.permissao` → `TipoPermissao` enum | `clientes/page.tsx:69`, `profissionais/page.tsx:68` |
| 12 | WhatsApp Status | `status`, telefone | `data.status`, `phone_number` | resposta proxy Bixs — casing variável; controller usa DTO com `status` minúsculo | `whatsapp/page.tsx:50-51` |
| 13 | `src/types/index.ts` | `Transacao`, `Agendamento`, etc. | modelos simplificados UI | entidades API com enums numéricos e campos extras (`codigoTransacao`, etc.) | `types/index.ts:72-79` |
| 14 | Config usuário | PUT config | formulário ativo | `IS_CONFIG_USUARIO_PUT_BLOCKED = true` — API retorna 400 | `apiHelpers.ts:3-4`, `useClientProfile.ts:88` |

> ### ⚠️ CORREÇÃO (27/08/2026) — os itens 4 e 5 desta tabela são FALSO POSITIVO
>
> A afirmação de que a API devolve **PascalCase** está **errada**. Verificado por requisição real:
>
> ```
> GET https://agendaai.bixs.com.br/api/Comercios
> [{"id":1,"nome":"Comércio eyrb5p","endereco":"Rua Teste, 123, Centro","totalAvalicoes":0,"mediaAvalicoes":0,"atendimento":null}]
> ```
>
> Motivo: `AddControllers()` no ASP.NET Core usa `JsonSerializerDefaults.Web`, que já aplica `JsonNamingPolicy.CamelCase`. O `AddJsonOptions` do `Program.cs:29-32` só configura `ReferenceHandler`, não o naming policy. Portanto **o frontend lendo camelCase está correto** e não existe divergência de casing a corrigir nos itens 4 e 5.
>
> Único caso real de casing atípico: a propriedade C# `CPF_CNPJ` vira **`cpf_CNPJ`** no JSON (a política camelCase minúscula apenas a primeira sequência maiúscula). Quem ler `cpfCnpj` ou `CPF_CNPJ` está errado.
>
> **Não implemente camada de normalização PascalCase** — seria complexidade para um problema inexistente. Os demais itens da tabela (enums de pagamento, role `Master`, `Config-Usuario` bloqueado etc.) seguem válidos.

---

## 4. Features novas a construir (P2)

### 4.1 Chaves PIX (Admin)

| Item | Detalhe |
|---|---|
| **Endpoints** | `GET/POST /api/ChavesPix`, `GET/PUT/DELETE /api/ChavesPix/{idchavepix}` |
| **Role** | `Admin` |
| **Rota proposta** | `/estabelecimento/chaves-pix` (item no `Sidebar` admin) |
| **Hook** | `src/hooks/useChavesPix.ts` — `useChavesPixQuery`, `useCreateChavePix`, `useUpdateChavePix`, `useDeleteChavePix` |
| **Query keys** | `queryKeys.chavesPix()` em `src/lib/queryKeys.ts` |
| **UI** | Lista + formulário (`chave`, `tipoChave`); estados loading/erro/vazio; toast em mutações |
| **Schemas API** | `ChavePixPost`: `{ chave, tipoChave }`; resposta lista: `{ idChavePix, chave, tipoChave, status }` |
| **Bloqueio** | **GET lista e DELETE** retornam 500 (`int.Parse` em GUID) — feature **bloqueada** até correção API |
| **Esforço** | G (UI + hook) após desbloqueio API |
| **Dependência** | Correção `ChavesPixController.cs:27-28` e `:127-128` — usar `UsuarioId` de `BaseController` (já usado nas queries linha 28) |

### 4.2 Fluxo de solicitação de acesso Bixs (empresa)

| Item | Detalhe |
|---|---|
| **Endpoints** | `GET /api/Comercios/status-acesso`, `POST /api/Comercios/solicitar-acesso` |
| **Roles** | GET: `Admin, Profissional`; POST: `Admin` |
| **Rota proposta** | Banner global no `AdminLayout` + página `/estabelecimento/integracao-bixs` |
| **Hook** | `src/hooks/useBixsAcesso.ts` |
| **GET response** (confirmado `ComerciosController.cs:115-128`) | `IdControle`, `NomeEmpresa`, `CPF_CNPJ`, `estado`, `Payment`, `Whatsapp`, `Solicitado`, `EmailAdmin`, `NomeAdmin`, `CPFAdmin`, `DataSolicitado` — enums `Estado`: `Ativo=0`, `Inativo=1`, `Solicitado=2` |
| **POST body** (`ControleViewPost`) | `{ payment, whatsapp, idEmpresa, password, verificationCode }` — exige **senha do admin** + **código de verificação** |
| **UI estados** | Banner: `estado=Solicitado` (aguardando Master); `estado=Ativo` com `Payment`/`Whatsapp` parciais (`Inativo`); formulário de reabertura quando `estado=Inativo` |
| **VerificationCode** | Enviado à Bixs em `CriarAcesso` — **não há endpoint AgendaAi** que emita o código. **Bloqueio:** API precisa expor fluxo (ex.: `POST /api/Comercios/enviar-codigo-verificacao`) ou documentar origem (e-mail Bixs, painel externo) |
| **Esforço** | G (com endpoint de código); M (só leitura de status) |
| **Dependência** | Endpoint de verificação + correção login Admin |

### 4.3 Pagamento PIX Caixa no fluxo do cliente

| Item | Detalhe |
|---|---|
| **Endpoint** | `POST /api/Pagamentos` com `tipoPagamento: 4` (`PixCaixa`) |
| **Pré-requisito** | Admin com chave PIX ativa (`ChavesPix`) + acesso Bixs ativo |
| **Rota** | Integrar em `agendar/page.tsx` pós-confirmação ou nova etapa de pagamento |
| **Response** | Exibir `codigoPagamento` / QR quando API retornar objeto |
| **Esforço** | G |
| **Dependência** | ChavesPix funcional + UI de pagamento inexistente hoje |

### 4.4 Endpoints existentes sem UI (backlog)

| Endpoint(s) | Nota |
|---|---|
| `GET/PUT/DELETE /api/ControleAcessos/*` | Painel **Master** — fora do escopo deste app |
| `GET /api/AdminTeste/*`, `DELETE ...` | Teste — não consumir no frontend |
| `POST /api/Agenda/Cliente-Confirma-Agenda` | Confirmação cliente — sem tela |
| `DELETE /api/Agenda/Comercio-Cancela/{id}` | Cancelamento pelo admin — verificar se `agenda/page.tsx` deveria usar em vez de fluxo cliente |
| `PUT /api/Avaliacoes/{id}` | Edição de avaliação — só GET implementado |
| `GET /api/Pagamentos/{id}`, `GET .../Confirmar/{id}` | Webhook/callback — não é frontend |
| `POST /api/Login/Logout` | Logout só local hoje (`AuthContext.tsx:53-57`) |
| `DELETE /api/Comercios/{id}`, `GET /api/Comercios` (lista geral) | Não usados — admin usa `/Admin` |

---

## 5. Bloqueios que exigem mudança na API

| # | Bloqueio | Evidência | O que o time da API precisa fazer |
|---|---|---|---|
| B1 | **ChavesPix GET/DELETE → 500** | `ChavesPixController.cs:27`, `:127` — `int.Parse` em GUID | Remover parse; usar `UsuarioId` do `BaseController` (já string GUID) |
| B2 | **Login Admin → role Cliente** | `LoginController.cs:106-116` — `if (tipoUsuario != null)` com corpo vazio | Atribuir `usuarioDto.tipoPermissao = "Admin"` quando vínculo Admin existir |
| B3 | **VerificationCode sem origem** | `ComerciosController.cs:283`, `ExternalToken.cs:349-360` | Expor endpoint para solicitar/enviar código OU documentar integração com painel Bixs |
| B4 | **Comercio-Historico: filtro só profissional** | Rota `{status?}/{profissional?}` | Confirmar contrato para omitir `status` com `profissional` preenchido; se inviável, aceitar sentinela (`_` ou `todos`) |
| B5 | **PUT Config-Usuario → 400** | Flag frontend `IS_CONFIG_USUARIO_PUT_BLOCKED` | Corrigir action em `UsuarioController` (já documentado em auditoria interna) |
| B6 | **POST Cartões** | Cadastro bloqueado no frontend (`pagamentos/page.tsx:74-77`) | Corrigir deserialização do modelo `Cartao` na API |

---

## 6. Inventário completo de chamadas de API do frontend

Legenda: **OK** = rota existe e shape tolerável; **QUEBRADO** = rota/assinatura errada; **DIVERGENTE** = rota OK, contrato parcialmente incompatível; **N/A** = infra (refresh).

| Arquivo:linha | Método | Endpoint | Status |
|---|---|---|---|
| `src/lib/api.ts:82` | POST | `/api/Login/refresh-token` | OK (N/A infra) |
| `src/lib/apiHelpers.ts:134` | GET | `/api/ComercioUsuarios/{Clientes\|Profissionais}/{comercioId}` | OK |
| `src/lib/apiHelpers.ts:149` | GET | `/api/Comercios/Admin` | OK |
| `src/lib/configComercioMappers.ts:313` | PUT | `/api/ConfigComercio/Editar-Atendimento/{comercioId}` | OK |
| `src/hooks/useFinance.ts:22` | GET | `/api/Pagamentos/Pagamentos-Cliente` | DIVERGENTE (PascalCase) |
| `src/hooks/useFinance.ts:35` | GET | `/api/Pagamentos/Pagamentos-Empresa/{id}` | DIVERGENTE |
| `src/hooks/useEstablishmentConfig.ts:90` | GET | `/api/ConfigComercio/{comercioId}` | OK |
| `src/hooks/useEstablishmentConfig.ts:154` | POST | `/api/ConfigComercio` | OK |
| `src/hooks/useEstablishmentConfig.ts:194` | PUT | `/api/Comercios/{id}` | OK |
| `src/hooks/useClienteQueries.ts:10` | GET | `/api/Agenda/Cliente/{userId}` | DIVERGENTE (shape agenda) |
| `src/hooks/useClienteQueries.ts:21` | GET | `/api/Agenda/Cliente-Historico/{userId}` | OK |
| `src/hooks/useClienteQueries.ts:32` | GET | `/api/Avaliacoes/Usuario/{userId}` | OK |
| `src/hooks/useClienteQueries.ts:46` | GET | `/api/Comercios` | OK |
| `src/hooks/useClienteQueries.ts:56` | GET | `/api/Pagamentos/Pagamentos-Cliente` | DIVERGENTE |
| `src/hooks/useClientProfile.ts:16` | GET | `/api/Usuario/{userId}` | OK |
| `src/hooks/useClientProfile.ts:34` | PUT | `/api/Usuario/{userId}` | OK |
| `src/hooks/useClientProfile.ts:61` | GET | `/api/Usuario/Config-Usuario/{userId}` | OK |
| `src/hooks/useClientProfile.ts:88` | PUT | `/api/Usuario/Config-Usuario/{userId}` | DIVERGENTE (API 400 — B5) |
| `src/hooks/useClientDashboard.ts:37` | GET | `/api/Agenda/Cliente/{userId}` | DIVERGENTE |
| `src/hooks/useClientDashboard.ts:71` | GET | `/api/Agenda/Cliente-Historico/{userId}` | OK |
| `src/hooks/useClientDashboard.ts:109` | GET | `/api/Avaliacoes/Usuario/{userId}` | OK |
| `src/hooks/useAdminQueries.ts:14` | GET | `/api/Agenda/Comercio/{comercioId}` | OK |
| `src/hooks/useAdminQueries.ts:33-34` | GET | `/api/Agenda/Comercio-Historico/{id}?...` | **QUEBRADO** |
| `src/hooks/useAdminQueries.ts:58` | GET | `/api/Servicos/Todos/{comercioId}` | OK |
| `src/hooks/useAdminQueries.ts:69` | GET | `/api/Categorias/Todas/{comercioId}` | OK |
| `src/hooks/useAdminQueries.ts:80` | GET | `/api/Pagamentos/Pagamentos-Empresa/{id}` | DIVERGENTE |
| `src/features/agenda/hooks/useAppointmentForm.ts:44-46` | GET | Serviços + ComercioUsuarios | OK |
| `src/features/agenda/hooks/useAppointmentForm.ts:112` | POST | `/api/Agenda/Comercio-Agendar` | OK (bug backend UsuarioId — flag `IS_ADMIN_AGENDA_CLIENT_NAME_UNRELIABLE`) |
| `src/components/layout/ClientLayout.tsx:53` | GET | `/api/Agenda/Cliente/{userId}` | DIVERGENTE |
| `src/components/layout/ClientLayout.tsx:60` | GET | `/api/Agenda/Cliente-Historico/{userId}` | OK |
| `src/components/layout/ClientLayout.tsx:67` | GET | `/api/Pagamentos/Pagamentos-Cliente` | DIVERGENTE |
| `src/components/layout/ClientLayout.tsx:75` | GET | `/api/Comercios` | OK |
| `src/components/layout/AdminLayout.tsx:87` | GET | `/api/Agenda/Comercio/{comercioId}` | OK |
| `src/components/layout/AdminLayout.tsx:94-95` | GET | `/api/Agenda/Comercio-Historico/{id}?...` | **QUEBRADO** |
| `src/components/layout/AdminLayout.tsx:104` | GET | `/api/Servicos/Todos/{comercioId}` | OK |
| `src/app/(public)/login/page.tsx:99-100` | POST | `/api/Login/google-login` \| `facebook-login` | DIVERGENTE (permissão — B2) |
| `src/app/(public)/login/page.tsx:122` | POST | `/api/Login/Acesso` | DIVERGENTE (B2) |
| `src/app/(public)/cadastro/page.tsx:193-194` | POST | Login social | DIVERGENTE |
| `src/app/(public)/cadastro/page.tsx:257` | POST | `/api/Login/Registrar` | OK |
| `src/app/(public)/cadastro-comercio/page.tsx:104` | POST | `/api/Comercios` | OK (multipart) |
| `src/app/(public)/ativar-conta/page.tsx:34` | POST | `/api/Login/Ativar-Login?userId&token` | DIVERGENTE (`permissao` vs `Permissao`) |
| `src/app/(client)/agendamentos/page.tsx:63` | DELETE | `/api/Agenda/Cancelar/{id}` | OK |
| `src/app/(client)/agendamentos/page.tsx:88` | PUT | `/api/Agenda/Reagendar/{id}` | OK |
| `src/app/(client)/agendar/page.tsx:98-99` | GET | Serviços + Profissionais-Agendar | OK |
| `src/app/(client)/agendar/page.tsx:141` | GET | `/api/Agenda/Agenda-Datas/?...` | OK |
| `src/app/(client)/agendar/page.tsx:174` | GET | `/api/Agenda/Agenda-Horarios/?...` | OK |
| `src/app/(client)/agendar/page.tsx:188` | POST | `/api/Agenda` | OK |
| `src/app/(client)/pagamentos/page.tsx:45` | GET | `/api/Cartoes/Todos/{userId}` | OK |
| `src/app/(client)/pagamentos/page.tsx:63` | DELETE | `/api/Cartoes/{id}` | OK |
| `src/app/(client)/pagamentos/page.tsx:85` | POST | `/api/Cartoes` | DIVERGENTE (desabilitado — B6) |
| `src/app/(admin)/whatsapp/page.tsx:46` | GET | `/api/WhatsApp/Status/{id}` | DIVERGENTE (casing parcial) |
| `src/app/(admin)/whatsapp/page.tsx:68` | GET | `/api/WhatsApp/Obter-QrCode/{id}` | OK |
| `src/app/(admin)/whatsapp/page.tsx:97` | DELETE | `/api/WhatsApp/Desconectar/{id}` | OK |
| `src/app/(admin)/servicos/page.tsx:131-138` | PUT/POST | `/api/Servicos[/{id}]` | DIVERGENTE (duracao/preco) |
| `src/app/(admin)/servicos/page.tsx:160` | DELETE | `/api/Servicos/{id}` | OK |
| `src/app/(admin)/servicos/page.tsx:191-202` | PUT/POST | `/api/Categorias[/{id}]` | OK |
| `src/app/(admin)/servicos/page.tsx:229` | DELETE | `/api/Categorias/{id}` | OK |
| `src/app/(admin)/profissionais/page.tsx:46` | DELETE | `/Desativar-Usuario/...` | **QUEBRADO** |
| `src/app/(admin)/profissionais/page.tsx:65` | POST | `/api/ComercioUsuarios/Cadastrar-Funcionario-Cliente` | OK |
| `src/app/(admin)/clientes/page.tsx:47` | DELETE | `/Desativar-Usuario/...` | **QUEBRADO** |
| `src/app/(admin)/clientes/page.tsx:66` | POST | `/api/ComercioUsuarios/Cadastrar-Funcionario-Cliente` | OK |
| `src/app/(admin)/config/page.tsx:61` | GET | `/api/Comercios/Admin` (via helper) | OK |
| `src/app/(admin)/config/page.tsx:116` | PUT | `/api/Comercios/{id}` | OK |

### Endpoints no Swagger (78) — referência rápida

<details>
<summary>Lista completa (clique para expandir)</summary>

| Método | Path |
|---|---|
| GET | `/api/AdminTeste/Usuarios` |
| GET, DELETE | `/api/AdminTeste/Empresas` |
| DELETE | `/api/AdminTeste/Deletar-Dados` |
| GET | `/api/Agenda/Agenda-Datas` |
| GET | `/api/Agenda/Agenda-Horarios` |
| GET | `/api/Agenda/Cliente/{id}` |
| GET | `/api/Agenda/Cliente-Historico/{id}` |
| POST | `/api/Agenda` |
| POST | `/api/Agenda/Cliente-Confirma-Agenda` |
| POST | `/api/Agenda/Comercio-Agendar` |
| DELETE | `/api/Agenda/Comercio-Cancela/{id}` |
| GET | `/api/Agenda/Comercio-Historico/{id}/{periodo}/{status}/{profissional}` |
| GET | `/api/Agenda/Comercio/{id}` |
| DELETE | `/api/Agenda/Cancelar/{id}` |
| PUT | `/api/Agenda/Reagendar/{id}` |
| PUT | `/api/Avaliacoes/{id}` |
| GET | `/api/Avaliacoes/Empresa/{id}` |
| GET | `/api/Avaliacoes/Usuario/{id}` |
| POST | `/api/Cartoes` |
| GET, DELETE | `/api/Cartoes/{id}` |
| GET | `/api/Cartoes/Todos/{id}` |
| POST | `/api/Categorias` |
| GET, PUT, DELETE | `/api/Categorias/{id}` |
| GET | `/api/Categorias/Todas/{id}` |
| GET, POST | `/api/ChavesPix` |
| GET, PUT, DELETE | `/api/ChavesPix/{idchavepix}` |
| GET, POST | `/api/Comercios` |
| GET, PUT, DELETE | `/api/Comercios/{id}` |
| GET | `/api/Comercios/Admin` |
| POST | `/api/Comercios/solicitar-acesso` |
| GET | `/api/Comercios/status-acesso` |
| POST | `/api/ComercioUsuarios/Cadastrar-Funcionario-Cliente` |
| GET | `/api/ComercioUsuarios/Clientes/{id}` |
| DELETE | `/api/ComercioUsuarios/Desativar-Usuario/{idEmpresa}/{id}` |
| GET | `/api/ComercioUsuarios/Profissionais-Agendar/{id}` |
| GET | `/api/ComercioUsuarios/Profissionais/{id}` |
| POST | `/api/ConfigComercio` |
| GET | `/api/ConfigComercio/{id}` |
| PUT | `/api/ConfigComercio/Editar-Atendimento/{id}` |
| GET | `/api/ControleAcessos` |
| GET, PUT, DELETE | `/api/ControleAcessos/{idcontrole}` |
| POST | `/api/Login/Acesso` |
| POST | `/api/Login/Ativar-Login` |
| POST | `/api/Login/facebook-login` |
| POST | `/api/Login/google-login` |
| POST | `/api/Login/Logout` |
| POST | `/api/Login/refresh-token` |
| POST | `/api/Login/Registrar` |
| POST | `/api/Pagamentos` |
| GET | `/api/Pagamentos/{id}` |
| GET | `/api/Pagamentos/Confirmar/{id}` |
| GET | `/api/Pagamentos/Pagamentos-Cliente` |
| GET | `/api/Pagamentos/Pagamentos-Empresa/{id}` |
| POST | `/api/Servicos` |
| GET, PUT, DELETE | `/api/Servicos/{id}` |
| GET | `/api/Servicos/Todos/{id}` |
| GET, PUT, DELETE | `/api/Usuario/{id}` |
| GET, PUT | `/api/Usuario/Config-Usuario/{id}` |
| DELETE | `/api/WhatsApp/Desconectar/{id}` |
| GET | `/api/WhatsApp/Obter-QrCode/{id}` |
| GET | `/api/WhatsApp/Status/{id}` |

</details>

---

## 7. Roadmap sugerido

### Sprint 0 — Parar o sangramento (1–2 dias, só frontend)

**Dependências:** nenhuma correção de API obrigatória, exceto login Admin (B2) que impede testar área admin com conta real.

| Ordem | Tarefa | Arquivos | Esforço |
|---|---|---|---|
| 0.1 | Helper `buildComercioHistoricoPath` + corrigir 2 chamadas | `apiHelpers.ts`, `useAdminQueries.ts`, `AdminLayout.tsx` | P |
| 0.2 | Corrigir URL Desativar-Usuario (2 páginas) | `profissionais/page.tsx`, `clientes/page.tsx` | P |
| 0.3 | `resolveUserTypeFromAuth`: ler `response.Permissao` além de `permissao` | `login/page.tsx`, `cadastro/page.tsx`, `ativar-conta/page.tsx` | P |
| 0.4 | Helper `pickApiField` / dual casing em histórico e pagamentos | `apiHelpers.ts`, `historico/page.tsx`, `financeiro/page.tsx`, `financas/page.tsx` | M |

**Entregável:** histórico admin carrega; desativar usuário funciona; dados financeiros exibem valores corretos.

### Sprint 1 — Auth + contratos (depende B2 API)

| Ordem | Tarefa | Depende de |
|---|---|---|
| 1.1 | API corrige login Admin (B2) | Time API |
| 1.2 | Tratar role `Master` como fora de escopo (redirect ou mensagem) | 1.1 opcional |
| 1.3 | Atualizar `Pagamento` interface + enums (`PixCaixa`, `Reembolsado`) | — |
| 1.4 | Mapear resposta Comercio-Historico com PascalCase nos dashboards | — |

### Sprint 2 — Features novas (depende B1, B3)

| Ordem | Tarefa | Depende de |
|---|---|---|
| 2.1 | UI Chaves PIX + hooks | B1 |
| 2.2 | Banner + página integração Bixs (status-acesso) | B2 |
| 2.3 | Formulário solicitar-acesso | B3 + B2 |
| 2.4 | Fluxo POST Pagamentos (PIX Caixa) no agendamento cliente | 2.1 + 2.3 |

### Diagrama de dependências

```
Sprint 0 (frontend)
  ├── Comercio-Historico path
  ├── Desativar-Usuario URL
  └── Dual casing pagamentos/histórico

B2 Login Admin (API) ──► Sprint 1 auth + testes admin
B1 ChavesPix parse (API) ──► Sprint 2.1 Chaves PIX UI
B3 VerificationCode (API/Bixs) ──► Sprint 2.3 Solicitar acesso
        └──► Sprint 2.4 Pagamento PixCaixa
```

---

## Apêndice A — Login/roles: efeito prático do bug B2

**Fluxo atual** (`login/page.tsx:67-92` + `AuthContext.tsx` + `App.tsx:46-64`):

1. Admin faz login em `/login?type=estabelecimento`.
2. API retorna `Permissao: "Cliente"` (PascalCase ignorado pelo frontend) e JWT com `role: "Cliente"` (`LoginController.cs:108-131`).
3. `resolveUserTypeFromAuth` → `userType = 'cliente'`.
4. `login()` persiste `userType: 'cliente'` no `localStorage`.
5. `ProtectedRoute` em `/estabelecimento/*` chama `canAccessRoute('cliente', 'estabelecimento')` → **false** → redirect para `/app` (`getDashboardPath('cliente')`).
6. Admin cai na **área do cliente**; toast opcional se `type` da URL ≠ tipo resolvido (`login/page.tsx:76-79`).
7. Em reload, `normalizeStoredAuth` relê o JWT (`AuthContext.tsx:16-18`) — permanece `cliente`.

**Mitigação temporária no frontend (não substitui B2):** decodificar JWT e, se usuário acessou `/api/Comercios/Admin` com sucesso, forçar `estabelecimento` — **frágil**; não recomendado como solução definitiva.

---

## Apêndice B — Pagamentos: diff campo a campo (API atual vs frontend)

### `POST /api/Pagamentos` — body `MetodoPagamento`

| Campo API (Swagger camelCase) | Tipo | Frontend hoje | Status |
|---|---|---|---|
| `agendamentoId` | int | não chama POST | Ausente |
| `tipoPagamento` | enum 0–6 | não implementado | Ausente; **+4 PixCaixa** novo |
| `valor` | double | — | Calculado server-side se 0 |
| `descricao` | string? | — | Preenchido server-side |
| `endereco` | int? | — | Obrigatório se sem `enderecoPagamento` |
| `enderecoPagamento` | `EnderecoViewPost` | — | Alternativa a `endereco` |
| `idCartao` | int? | — | Cartão salvo |
| `cartao` | `CartaoPost` | comentado em `pagamentos/page.tsx` | Bloqueado B6 |

### `GET /api/Pagamentos/*` — entidade `Pagamento`

| Campo API | Tipo | `useFinance.ts` / páginas | Gap |
|---|---|---|---|
| `id` | int | `id` | OK se casing resolvido |
| `agendamentoId` | int | `agendamentoId` | DIVERGENTE PascalCase |
| `valor` | double | `valor` | DIVERGENTE |
| `codigoTransacao` | string? | não exibido | Ausente na UI |
| `dataPagamento` | datetime? | parcial | DIVERGENTE |
| `dataCriacao` | datetime | `dataCriacao` | DIVERGENTE |
| `descricao` | string | `descricao` | DIVERGENTE |
| `idCartao` | int? | não usado | — |
| `statusPagamento` | 0–3 | 0–2 mapeados | **Falta Reembolsado=3** |
| `metodoPagamento` | 0–6 | lógica errada em ícones | **Falta 4–6; Pix≠2** |

### Resposta `POST` PIX/Boleto/PixCaixa (quando implementado)

| Campo | Tipo | Frontend |
|---|---|---|
| `message` | string | não tratado |
| `codigoPagamento` | string | não tratado |
| `transacao` | string (GUID) | não tratado |

---

*Relatório gerado em 27/08/2026. Nenhum arquivo de código foi alterado nesta tarefa.*
