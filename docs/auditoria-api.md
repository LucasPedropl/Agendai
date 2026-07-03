# Auditoria da API — AgendaAi

**Ambiente:** `https://agendaai.bixs.com.br`  
**Repositório:** [AgendaAI-Prototipo](https://github.com/UaiPDV/AgendaAI-Prototipo)  
**Data:**
23/06/2026  
**Endpoints no Swagger:** 67

Este documento lista os problemas **ainda pendentes** identificados em testes de
regressão HTTP e revisão de código. Itens deliberadamente fora de escopo
(decisão de produto) não constam aqui.

---

## Legenda de prioridade

| Nível  | Significado                                                |
| ------ | ---------------------------------------------------------- |
| **P0** | Urgente — segurança ou perda de dados imediata             |
| **P1** | Alto — fluxo crítico quebrado ou vulnerabilidade relevante |
| **P2** | Médio — contrato, validação ou lógica inconsistente        |
| **P3** | Baixo — infraestrutura, qualidade de código                |

---

## P0 — Urgente

### R01 · Credenciais de produção no repositório

|                   |                                                                                                                                                                                                                |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Endpoint**      | — (configuração)                                                                                                                                                                                               |
| **Arquivo**       | `appsettings.json`                                                                                                                                                                                             |
| **Problema**      | Connection string SQL, senhas SMTP, credenciais BixAPI e chave JWT em texto claro versionado no Git.                                                                                                           |
| **Impacto**       | Comprometimento do banco, e-mail, tokens e integrações se o repositório vazar.                                                                                                                                 |
| **Como corrigir** | Mover todos os secrets para variáveis de ambiente ou cofre (Azure Key Vault). Rotacionar credenciais expostas. Remover valores do histórico Git. Nunca commitar `appsettings.Production.json` com dados reais. |

---

### R02 · Auto-promoção a Admin no registro público

|                   |                                                                                                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Endpoint**      | `POST /api/Login/Registrar`                                                                                                                                      |
| **Arquivo**       | `Controllers/LoginController.cs` — linhas 404, 440-447                                                                                                           |
| **Problema**      | Endpoint `[AllowAnonymous]` aceita `TipoPermissao` no body. Se `Admin`, adiciona role Admin em `AspNetUserRoles` antes do `SaveChanges`.                         |
| **Impacto**       | Qualquer pessoa pode criar conta com permissão de administrador.                                                                                                 |
| **Como corrigir** | Ignorar `TipoPermissao` no registro público — sempre criar como Cliente. Role Admin/Profissional apenas via convite interno ou fluxo administrativo autenticado. |

---

### R03 · Vazamento de dados de cartão na resposta

|                   |                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------- |
| **Endpoint**      | `POST /api/Cartoes`                                                                               |
| **Arquivo**       | `Controllers/CartoesController.cs` — linhas 111-124                                               |
| **Problema**      | Retorna `Ok(novoCartao)` com número completo do cartão e CCV (mesmo cifrado) no body da resposta. |
| **Impacto**       | Exposição de dados sensíveis em response, logs e proxies (PCI-DSS).                               |
| **Como corrigir** | Retornar DTO mascarado (ex.: `****1234`, últimos 4 dígitos). Nunca incluir CCV na resposta.       |

---

## P1 — Alto

### R04 · Refresh token inutilizável em SPA

|                   |                                                                                                                                                                                                                      |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Endpoint**      | `POST /api/Login/refresh-token`                                                                                                                                                                                      |
| **Arquivo**       | `Controllers/LoginController.cs` — linhas 617-675 · `Controllers/BaseController.cs` — linha 7                                                                                                                        |
| **Problema**      | Action herda `[Authorize]` do `BaseController`. Exige cookie `refresh_token` **e** JWT válido. Chamada sem cookie retorna **401**.                                                                                   |
| **Impacto**       | SPA que usa apenas Bearer no header não consegue renovar sessão após expiração do token.                                                                                                                             |
| **Como corrigir** | Adicionar `[AllowAnonymous]` na action. Aceitar refresh token no body além do cookie. Validar apenas o refresh token (permitir access token expirado). Retornar `{ token, expiracao }` no JSON de forma padronizada. |

---

### R05 · Cancelar agendamento de outro usuário (IDOR)

|                   |                                                                                                            |
| ----------------- | ---------------------------------------------------------------------------------------------------------- |
| **Endpoint**      | `DELETE /api/Agenda/Cancelar/{id}`                                                                         |
| **Arquivo**       | `Controllers/AgendaController.cs` — linhas 705-727                                                         |
| **Problema**      | Não valida se `agendamento.UsuarioId == UsuarioId` do JWT antes de cancelar.                               |
| **Impacto**       | Usuário autenticado cancela agendamentos de terceiros. Reproduzido em produção.                            |
| **Como corrigir** | No início da action: `if (agendamento.UsuarioId != UsuarioId && !User.IsInRole("Admin")) return Forbid();` |

---

### R06 · Pagamentos não implementados / cartão com deserialização incorreta

|                   |                                                                                                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Endpoint**      | `POST /api/Pagamentos`                                                                                                                                                               |
| **Arquivo**       | `Controllers/PagamentosController.cs` — linhas 135-186                                                                                                                               |
| **Problema**      | Pix, Boleto e Dinheiro caem no `default` → `"Método de pagamento não implementado ainda!"`. Cartão: check `pagamento is not MetodoPagamento.Cartao` falha com JSON plano do cliente. |
| **Impacto**       | Fluxo de pagamento do cliente inoperante.                                                                                                                                            |
| **Como corrigir** | Criar DTO flat com `tipoPagamento` e campos de cartão explícitos (ou `[JsonPolymorphic]`). Implementar os métodos ou removê-los do Swagger até estarem prontos.                      |

---

### R07 · Reagendar ignora body e não aguarda auto-encaixe

|                   |                                                                                                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Endpoint**      | `PUT /api/Agenda/Reagendar/{id}`                                                                                                                                           |
| **Arquivo**       | `Controllers/AgendaController.cs` — linhas 642-655                                                                                                                         |
| **Problema**      | Cancela o agendamento existente, ignora o body `novoagendamento`, chama `ReangendarAuto(...)` sem `await`. Data/hora escolhida pelo cliente não são usadas.                |
| **Impacto**       | Reagendamento não reflete a intenção do usuário; possível race no encaixe automático.                                                                                      |
| **Como corrigir** | Criar novo agendamento com data/hora do body → `SaveChanges` → montar link de confirmação com ID real → `await ReangendarAuto(...)`. Validar ownership antes de reagendar. |

---

### R08 · Autorização invertida ao vincular usuário ao comércio

|                   |                                                                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Endpoint**      | `POST /api/ComercioUsuarios/Cadastrar-Funcionario-Cliente`                                                                          |
| **Arquivo**       | `Controllers/ComercioUsuariosController.cs` — linhas 157-161                                                                        |
| **Problema**      | Checagem usa `usuario.Permissao` (permissão do **novo** usuário no body) em vez de validar se o **caller** é Admin do `IdComercio`. |
| **Impacto**       | Admin não consegue adicionar Cliente (401). Lógica de autorização invertida.                                                        |
| **Como corrigir** | Validar: `UsuariosEmpresas` do `UsuarioId` logado com `TipoPermissao == Admin` e `ComercioId == usuario.IdComercio`.                |

---

### R09 · IDOR em pagamentos (GET e POST)

|                   |                                                                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Endpoint**      | `GET /api/Pagamentos/{id}` · `POST /api/Pagamentos`                                                                                               |
| **Arquivo**       | `Controllers/PagamentosController.cs` — linhas 83-90, 135-145                                                                                     |
| **Problema**      | GET retorna qualquer pagamento por ID sem filtrar titular. POST aceita qualquer `AgendamentoId` sem validar `agendamento.UsuarioId == UsuarioId`. |
| **Impacto**       | Leitura e criação de pagamentos sobre agendamentos alheios.                                                                                       |
| **Como corrigir** | GET: filtrar por `UsuarioId` do JWT ou role Admin do comércio. POST: `if (agendamento.UsuarioId != UsuarioId) return Forbid();` antes de criar.   |

---

### R10 · DELETE de Serviço/Categoria sem validar comércio

|                   |                                                                                                                             |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Endpoint**      | `DELETE /api/Servicos/{id}` · `DELETE /api/Categorias/{id}`                                                                 |
| **Arquivo**       | `Controllers/ServicosController.cs` — linhas 287-296 · `Controllers/CategoriasController.cs` — linhas 150-160               |
| **Problema**      | DELETE por ID sem verificar se o recurso pertence ao comércio do admin logado. PUT já valida escopo; DELETE não.            |
| **Impacto**       | Admin desativa serviço ou categoria de outro estabelecimento.                                                               |
| **Como corrigir** | Replicar a validação do PUT: join com `ComercioId` do recurso vs `UsuariosEmpresas` do caller; `Forbid()` se não pertencer. |

---

### R11 · Double-booking na criação de agenda

|                   |                                                                                                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Endpoint**      | `POST /api/Agenda`                                                                                                                                              |
| **Arquivo**       | `Controllers/AgendaController.cs` — linhas 511-544                                                                                                              |
| **Problema**      | Insert sem verificar conflito de horário/profissional; sem transação ou lock.                                                                                   |
| **Impacto**       | Dois clientes podem ser agendados no mesmo slot.                                                                                                                |
| **Como corrigir** | Verificar overlap na mesma transação antes do insert. Considerar unique constraint ou isolation level adequado. Respeitar `ConfirmaAuto` da config do comércio. |

---

### R12 · Roles atribuídas antes de persistir usuário no Registrar

|                   |                                                                                                                                   |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Endpoint**      | `POST /api/Login/Registrar`                                                                                                       |
| **Arquivo**       | `Controllers/LoginController.cs` — linhas 440-449                                                                                 |
| **Problema**      | `UserRoles.Add` com `novoUsuario.Id` antes de `SaveChanges`; usa `_context.Users.Add` em vez de `UserManager.CreateAsync`.        |
| **Impacto**       | UserRole órfã, registro corrompido, erro 500 intermitente.                                                                        |
| **Como corrigir** | `await _userManager.CreateAsync(novoUsuario, senha)` → `await _userManager.AddToRoleAsync(...)` após o usuário ter ID persistido. |

---

## P2 — Médio

### R13 · Histórico admin — filtro `periodo` como string

|                   |                                                                                                                      |
| ----------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Endpoint**      | `GET /api/Agenda/Comercio-Historico/{id}?periodo=...`                                                                |
| **Arquivo**       | `Controllers/AgendaController.cs` — action Comercio-Historico (~linhas 450-491)                                      |
| **Problema**      | `periodo=mes` retorna **400**. API espera inteiro 1–12. Lista vazia já retorna `{ "agendamentos": [] }` (corrigido). |
| **Impacto**       | Frontend que envia string quebra o filtro de histórico.                                                              |
| **Como corrigir** | Aceitar alias (`mes` → mês atual, `semana` → 7 dias) **ou** documentar contrato int no Swagger e alinhar frontend.   |

---

### R14 · Agenda admin sem validação de vínculo ao comércio

|                   |                                                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Endpoint**      | `GET /api/Agenda/Comercio/{id}` · `GET /api/Agenda/Comercio-Historico/{id}`                                                           |
| **Arquivo**       | `Controllers/AgendaController.cs` — linhas 382-491                                                                                    |
| **Problema**      | Filtra só por `comercioId` da URL. Admin de outro comércio recebe **200** com array vazio em vez de **403**.                          |
| **Impacto**       | Vazamento de informação sobre existência de comércio; sem bloqueio explícito.                                                         |
| **Como corrigir** | Antes de consultar: validar `UsuariosEmpresas` com `UsuarioId` + `ComercioId` + role Admin/Profissional. `Forbid()` se não pertencer. |

---

### R15 · PUT Serviço aceita dados inválidos com 200

|                   |                                                                                                                                                    |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Endpoint**      | `PUT /api/Servicos/{id}`                                                                                                                           |
| **Arquivo**       | `Controllers/ServicosController.cs` — linhas 208-259                                                                                               |
| **Problema**      | Payload com `nome: ""` e `preco: -100` retorna **200 OK**. `ModelState` passa — faltam validações de negócio.                                      |
| **Impacto**       | Dados corrompidos no catálogo de serviços.                                                                                                         |
| **Como corrigir** | Adicionar `[Required]`, `[Range(0, double.MaxValue)]` no modelo/DTO. `if (!ModelState.IsValid) return BadRequest(ModelState);` antes de persistir. |

---

### R16 · IDOR em avaliações de usuário

|                   |                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------- |
| **Endpoint**      | `GET /api/Avaliacoes/Usuario/{id}`                                                        |
| **Arquivo**       | `Controllers/AvaliacoesController.cs` — linhas 67-98                                      |
| **Problema**      | `{id}` da URL não é comparado com `UsuarioId` do JWT.                                     |
| **Impacto**       | Usuário autenticado lê avaliações de terceiros.                                           |
| **Como corrigir** | `if (id != UsuarioId) return Forbid();` ou ignorar `{id}` e usar sempre o claim do token. |

---

### R17 · Logo do comércio não persiste no banco

|                   |                                                                                                                             |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Endpoint**      | `POST /api/Comercios`                                                                                                       |
| **Arquivo**       | `Controllers/ComerciosController.cs` — linhas 161-163                                                                       |
| **Problema**      | Upload de imagem funciona e `LogoUrl` é setado, mas `SaveChanges` está comentado após o `Update`.                           |
| **Impacto**       | Logo some após restart; `logoUrl` null no banco.                                                                            |
| **Como corrigir** | Descomentar `await _context.SaveChangesAsync()` após setar `LogoUrl`, ou incluir a URL no `SaveChanges` principal do fluxo. |

---

### R18 · Roles.FirstOrDefault sem null-check

|                   |                                                                                 |
| ----------------- | ------------------------------------------------------------------------------- |
| **Endpoint**      | `POST /api/Login/Registrar` · `POST /api/Login/refresh-token`                   |
| **Arquivo**       | `Controllers/LoginController.cs` — linhas 442, 446, 649, 659                    |
| **Problema**      | `_context.Roles.FirstOrDefault(r => r.Name == "Admin").Id` sem verificar null.  |
| **Impacto**       | **500** após reset do banco se tabela `AspNetRoles` estiver vazia.              |
| **Como corrigir** | Null-check antes de usar `.Id`. Garantir seed de roles no startup ou migration. |

---

### R19 · Script Deletar-Dados quebra Identity

|                   |                                                                                                           |
| ----------------- | --------------------------------------------------------------------------------------------------------- |
| **Endpoint**      | `DELETE /api/AdminTeste/Deletar-Dados`                                                                    |
| **Arquivo**       | `Models/DbAgendaAi.cs` — método `LimparBancoDeDadosManual`                                                |
| **Problema**      | Script DELETE em massa apaga dados de Identity; `Registrar` falha até restart da aplicação.               |
| **Impacto**       | Ambiente de testes fica inconsistente após reset.                                                         |
| **Como corrigir** | Excluir tabelas Identity (`AspNetRoles`, etc.) do script **ou** re-seed automático de roles após o reset. |

---

### R20 · Cancelar cliente faz hard delete

|                   |                                                                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Endpoint**      | `DELETE /api/Agenda/Cancelar/{id}`                                                                                                 |
| **Arquivo**       | `Controllers/AgendaController.cs` — linha 724                                                                                      |
| **Problema**      | Usa `_context.Agendamentos.Remove(agendamento)` em vez de `Status = Cancelado`. Diverge de `Comercio-Cancela` que faz soft delete. |
| **Impacto**       | Perda de histórico; pagamentos e avaliações podem ficar órfãos.                                                                    |
| **Como corrigir** | Alterar status para `Cancelado` e manter o registro, alinhado ao fluxo admin.                                                      |

---

### R21 · ConfigComercio — criação duplicada e HorarioId prematuro

|                   |                                                                                                                                                |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Endpoint**      | `POST /api/ConfigComercio` · `PUT /api/ConfigComercio/Editar-Atendimento/{id}`                                                                 |
| **Arquivo**       | `Controllers/ConfigComercioController.cs` — linhas 115-153, 323-325                                                                            |
| **Problema**      | POST sempre insere nova config sem verificar existente. PUT `Editar-Atendimento` atribui `HorarioId` antes de `SaveChanges` (FK pode ficar 0). |
| **Impacto**       | Configurações duplicadas; erro ao configurar horário de profissional novo.                                                                     |
| **Como corrigir** | Upsert no POST (rejeitar ou atualizar se já existir). No PUT: `SaveChanges` do horário primeiro → depois atribuir ID real ao vínculo.          |

---

### R22 · Agenda-Datas com profissionalId ausente

|                   |                                                                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Endpoint**      | `GET /api/Agenda/Agenda-Datas`                                                                                                                          |
| **Arquivo**       | `Controllers/AgendaController.cs` — linhas 50-85                                                                                                        |
| **Problema**      | Sem `profissionalId`, pega o primeiro `UsuariosEmpresas` do comércio (pode ser cliente ou admin), mas filtra agendamentos com `profissionalId == null`. |
| **Impacto**       | Dias disponíveis incorretos ou lista vazia.                                                                                                             |
| **Como corrigir** | Exigir `profissionalId` como obrigatório **ou** usar horário padrão do comércio quando ausente.                                                         |

---

### R23 · Convite cria usuário sem senha

|                   |                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| **Endpoint**      | `POST /api/ComercioUsuarios/Cadastrar-Funcionario-Cliente`                                              |
| **Arquivo**       | `Controllers/ComercioUsuariosController.cs` — linhas 186-196                                            |
| **Problema**      | Usuário novo criado via `_context.Users.Add` sem `PasswordHash` nem fluxo de ativação completo.         |
| **Impacto**       | Conta inutilizável até completar cadastro; estado inconsistente (`Status=Pendente`, CPF placeholder).   |
| **Como corrigir** | Criar via `UserManager` com token de convite/reset. Completar cadastro no branch `else` do `Registrar`. |

---

### R24 · GET Categorias exige autenticação

|                   |                                                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Endpoint**      | `GET /api/Categorias/Todas/{id}`                                                                                  |
| **Arquivo**       | `Controllers/CategoriasController.cs` · `Controllers/BaseController.cs` — linha 7                                 |
| **Problema**      | Herda `[Authorize]`; catálogo de categorias retorna **401** sem token.                                            |
| **Impacto**       | Fluxo público de agendamento pode falhar se frontend não autenticar antes.                                        |
| **Como corrigir** | Adicionar `[AllowAnonymous]` na action de listagem se o catálogo for público (alinhado com `GET /api/Comercios`). |

---

### R25 · NullReference em worker de lembrete

|                   |                                                                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Endpoint**      | — (background / `ComerService`)                                                                                                           |
| **Arquivo**       | `Services/ComerService.cs` — linhas 18-19                                                                                                 |
| **Problema**      | Query acessa `a.Usuario.ConfigUsuario.NotificaDiaAgendado` sem garantir que `ConfigUsuario` existe.                                       |
| **Impacto**       | Exceção no serviço de lembrete; e-mails de notificação não enviados.                                                                      |
| **Como corrigir** | Filtro null-safe (`ConfigUsuario != null`) ou left join. Tratar ausência como default (notificar = true/false conforme regra de negócio). |

---

### R26 · Sem endpoint para criar avaliação

|                   |                                                                                                             |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| **Endpoint**      | — (ausente)                                                                                                 |
| **Arquivo**       | `Controllers/AvaliacoesController.cs`                                                                       |
| **Problema**      | Existem apenas GET e PUT. Não há `POST /api/Avaliacoes` para o cliente avaliar após serviço concluído.      |
| **Impacto**       | Funcionalidade de avaliação incompleta no produto.                                                          |
| **Como corrigir** | Implementar `POST /api/Avaliacoes` com validação: agendamento concluído, titular do JWT, nota e comentário. |

---

## P3 — Baixo / Infraestrutura

### R27 · DI triplicado do EnvioSender

|                   |                                                                                               |
| ----------------- | --------------------------------------------------------------------------------------------- |
| **Endpoint**      | —                                                                                             |
| **Arquivo**       | `Program.cs` — linhas 19-25                                                                   |
| **Problema**      | `EnvioSender` registrado 3 vezes: `AddScoped`, `AddHttpClient<IEnvioSender>`, `AddTransient`. |
| **Impacto**       | Resolução ambígua de dependência; possível `HttpClient` incorreto injetado.                   |
| **Como corrigir** | Manter apenas `builder.Services.AddHttpClient<IEnvioSender, EnvioSender>();`                  |

---

### R28 · CORS com origens incompletas

|                   |                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------- |
| **Endpoint**      | —                                                                                           |
| **Arquivo**       | `Program.cs` — linhas 56-60                                                                 |
| **Problema**      | Origens limitadas; faltam `https://agendaai.bixs.com.br` e portas extras do frontend local. |
| **Impacto**       | Preflight bloqueado em deploy alternativo.                                                  |
| **Como corrigir** | Centralizar origens em `appsettings` por ambiente. Incluir produção e dev.                  |

---

### R29 · Mensagem WhatsApp enviada em duplicata

|                   |                                                                         |
| ----------------- | ----------------------------------------------------------------------- |
| **Endpoint**      | — (serviço interno)                                                     |
| **Arquivo**       | `Services/EnvioSender.cs` — linhas 57-67                                |
| **Problema**      | Segundo `PostAsync` redundante após resposta de sucesso no mesmo fluxo. |
| **Impacto**       | Cliente recebe mensagem duplicada quando integração estiver ativa.      |
| **Como corrigir** | Remover o segundo `PostAsync`.                                          |

---

### R30 · Criptografia de CVV reutiliza chave JWT

|                   |                                                                              |
| ----------------- | ---------------------------------------------------------------------------- |
| **Endpoint**      | — (usado por `POST /api/Cartoes`)                                            |
| **Arquivo**       | `Services/UserService.cs` — linhas 47-51                                     |
| **Problema**      | `EncryptCVV` usa `Jwt:Key` diretamente como chave AES (tamanho arbitrário).  |
| **Impacto**       | `CryptographicException` em runtime; criptografia fraca.                     |
| **Como corrigir** | Chave dedicada de 256 bits em config (`CVV:EncryptionKey`), separada do JWT. |

---

### R31 · Horários retornados em formato 12h

|                   |                                                                |
| ----------------- | -------------------------------------------------------------- |
| **Endpoint**      | `GET /api/Agenda/Agenda-Horarios`                              |
| **Arquivo**       | `Controllers/AgendaController.cs` — linha 287                  |
| **Problema**      | `horaAtual.ToString(@"hh\:mm")` usa formato 12h em vez de 24h. |
| **Impacto**       | Ambiguidade em horários noturnos no frontend.                  |
| **Como corrigir** | Trocar para `HH:mm`.                                           |

---

### R32 · Filtro EF incorreto em ConfigComercio GET

|                   |                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------- |
| **Endpoint**      | `GET /api/ConfigComercio/{id}`                                                     |
| **Arquivo**       | `Controllers/ConfigComercioController.cs` — linha 41                               |
| **Problema**      | `.Where(s => s.UsuariosEmpresas == null)` nunca é true em entidade EF rastreada.   |
| **Impacto**       | Horário padrão do comércio não encontrado; resposta incompleta.                    |
| **Como corrigir** | `.Where(s => !s.UsuariosEmpresas.Any())` para horários sem vínculo de funcionário. |

---

### R33 · Índice único impede múltiplos profissionais

|                   |                                                                                                                       |
| ----------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Endpoint**      | — (schema)                                                                                                            |
| **Arquivo**       | `Models/DbAgendaAi.cs` — linhas 90-92                                                                                 |
| **Problema**      | `HasIndex(oh => new { oh.ComercioId, oh.Dias }).IsUnique()` impede dois profissionais com mesmos dias de atendimento. |
| **Impacto**       | **500** ao configurar agenda de segundo profissional.                                                                 |
| **Como corrigir** | Remover unique ou incluir identificador do profissional no índice.                                                    |

---

### R34 · SMTP sem SSL

|                   |                                                              |
| ----------------- | ------------------------------------------------------------ |
| **Endpoint**      | — (serviço de e-mail)                                        |
| **Arquivo**       | `Services/EnvioSender.cs` — linha 30                         |
| **Problema**      | `EnableSsl = false` na configuração SMTP.                    |
| **Impacto**       | Credenciais e conteúdo de e-mail trafegam em cleartext.      |
| **Como corrigir** | `EnableSsl = true` com porta 587 ou 465 conforme o provedor. |

---

### R35 · Swagger habilitado em produção

|                   |                                                                  |
| ----------------- | ---------------------------------------------------------------- |
| **Endpoint**      | —                                                                |
| **Arquivo**       | `Program.cs`                                                     |
| **Problema**      | Swagger UI disponível em todos os ambientes.                     |
| **Impacto**       | Superfície de ataque e exposição de contrato interno.            |
| **Como corrigir** | `if (app.Environment.IsDevelopment()) { app.UseSwagger(); ... }` |

---

### R36 · CPF sem constraint unique

|                   |                                                                     |
| ----------------- | ------------------------------------------------------------------- |
| **Endpoint**      | — (modelo)                                                          |
| **Arquivo**       | `Models/Usuario.cs` / migrations                                    |
| **Problema**      | Campo CPF sem índice único no banco.                                |
| **Impacto**       | CPF duplicado entre usuários.                                       |
| **Como corrigir** | `HasIndex(u => u.CPF).IsUnique()` no `OnModelCreating` + migration. |

---

### R37 · Schema SQL hardcoded

|                   |                                                                            |
| ----------------- | -------------------------------------------------------------------------- |
| **Endpoint**      | `GET /api/WhatsApp/Obter-QrCode/{id}` (e relacionados)                     |
| **Arquivo**       | `Controllers/WhatsAppController.cs` — linhas 179-184                       |
| **Problema**      | SQL com `IDENTITY_INSERT usu2_agenda.WhatsApps` — schema de ambiente fixo. |
| **Impacto**       | Falha em banco com schema ou nome diferente.                               |
| **Como corrigir** | Usar EF Core puro ou parametrizar schema via configuração.                 |

---

### R38 · FirstAsync sem fallback em listagem de serviços

|                   |                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------- |
| **Endpoint**      | `GET /api/Servicos/Todos/{id}`                                                     |
| **Arquivo**       | `Controllers/ServicosController.cs` — linha 127                                    |
| **Problema**      | `.FirstAsync()` quando admin não tem comércio vinculado lança exceção não tratada. |
| **Impacto**       | **500** em vez de 400/404 com mensagem clara.                                      |
| **Como corrigir** | `FirstOrDefaultAsync` + `if (comercio == null) return NotFound(...)`               |

---

## Itens já corrigidos (referência)

| Item                               | Endpoint / área                      | Status                                                              |
| ---------------------------------- | ------------------------------------ | ------------------------------------------------------------------- |
| Vincular usuário a comércio alheio | `POST Cadastrar-Funcionario-Cliente` | **401** para comércio alheio                                        |
| Escopo em PUT Serviços             | `PUT /api/Servicos/{id}`             | **401** para `comercioId` de outro estabelecimento                  |
| GET Categoria inexistente          | `GET /api/Categorias/{id}`           | **404** (não mais `Ok(null)`)                                       |
| Listagem pública de comércios      | `GET /api/Comercios`                 | **200** sem autenticação                                            |
| Registrar após reset               | `POST /api/Login/Registrar`          | Funciona com roles seedadas                                         |
| Histórico vazio                    | `GET Comercio-Historico`             | Retorna `{ "agendamentos": [] }`                                    |
| Refresh token no body              | `POST /api/Login/refresh-token`      | Retorna `access_token` + `refresh_token` (cookie ainda obrigatório) |

---

## Resumo e ordem sugerida de correção

| Prioridade | Qtd | Destaques                                               |
| ---------- | --- | ------------------------------------------------------- |
| **P0**     | 3   | Secrets no Git, Admin via Registrar, vazamento PCI      |
| **P1**     | 9   | IDOR cancelamento/pagamentos, reagendar, auth invertida |
| **P2**     | 14  | Validação, escopo, contratos, soft delete               |
| **P3**     | 12  | DI, CORS, crypto, schema                                |

1. Rotacionar credenciais e remover de `appsettings.json` (R01)
2. Bloquear Admin no Registrar (R02) + mascarar resposta de cartão (R03)
3. IDOR em cancelamento (R05) e pagamentos (R06, R09)
4. Reagendar com body real (R07) + refresh para SPA (R04)
5. Demais P2 e P3 conforme capacidade da sprint
