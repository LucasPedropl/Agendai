# Pendências da API — AgendaAi

> **Atualização 23/06/2026:** O relatório ativo de erros restantes está em [`docs/auditoria-api.md`](./auditoria-api.md) (auditoria MCP + código + Antigravity). Este arquivo permanece como referência histórica das pendências originais.

**Ambiente:** `https://agendaai.bixs.com.br`  
**Última revisão:** 19/06/2026  
**Repositório API:** `AgendaAI-Prototipo` (controllers em `Controllers/`)

Legenda de prioridade: **P0** urgente · **P1** alto · **P2** médio · **P3**
baixo

---

## P0 — Urgente

### 1. Admin agenda grava cliente errado

|                   |                                                                                                                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Endpoint**      | `POST /api/Agenda/Comercio-Agendar`                                                                                                                                                       |
| **Arquivo**       | `Controllers/AgendaController.cs` ~linha 575                                                                                                                                              |
| **Erro**          | `UsuarioId` recebe `IdProssional` em vez do cliente. Listagem admin mostra nome do profissional.                                                                                          |
| **Como corrigir** | Trocar para `UsuarioId = agendamento.IdUsuario` (ou variável `usuario` já calculada nas linhas ~564–568). Validar com `GET /api/Agenda/Comercio/{id}` — `usuarioNome` deve ser o cliente. |

---

### 2. AdminTeste exposto em produção

|                   |                                                                                                                                                                                                                                                                                               |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Endpoints**     | `GET /api/AdminTeste/Usuarios`, `GET /api/AdminTeste/Empresas`, `DELETE /api/AdminTeste/Empresas`, `DELETE /api/AdminTeste/Deletar-Dados`                                                                                                                                                     |
| **Arquivo**       | `Controllers/AdminTesteController.cs` linhas 10–62                                                                                                                                                                                                                                            |
| **Erro**          | Controller sem `[Authorize]`. Qualquer pessoa lista usuários com `passwordHash`, CPF e e-mail. DELETE apaga dados sem autenticação.                                                                                                                                                           |
| **Como corrigir** | **Opção A (produção):** remover rotas do deploy ou condicionar a `#if DEBUG` / variável de ambiente. **Opção B:** `[Authorize(Roles = "Admin")]` + IP whitelist. **Opção C:** nunca retornar `passwordHash`/`securityStamp` no DTO de resposta. Prioridade imediata: bloquear acesso público. |

---

### 3. IDOR — ler agenda de outro usuário

|                   |                                                                                                                |
| ----------------- | -------------------------------------------------------------------------------------------------------------- |
| **Endpoints**     | `GET /api/Agenda/Cliente/{id}`, `GET /api/Agenda/Cliente-Historico/{id}`                                       |
| **Arquivo**       | `Controllers/AgendaController.cs` linhas 312–369                                                               |
| **Erro**          | `{id}` da URL não é comparado com o `UsuarioId` do JWT. Usuário A acessa agendamentos do usuário B.            |
| **Como corrigir** | No início da action: `if (id != UsuarioId) return Forbid();` ou ignorar `{id}` e usar sempre o claim do token. |

---

### 4. Confirmação de agenda sem autenticação

|                   |                                                                                                                                                                              |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Endpoint**      | `POST /api/Agenda/Cliente-Confirma-Agenda`                                                                                                                                   |
| **Arquivo**       | `Controllers/AgendaController.cs` linhas 602–624                                                                                                                             |
| **Erro**          | `[AllowAnonymous]` — qualquer um com o `id` do agendamento confirma ou cancela.                                                                                              |
| **Como corrigir** | Exigir auth e validar titular (`agendamento.UsuarioId == UsuarioId`), **ou** link com token assinado one-time (HMAC com expiração) no e-mail/WhatsApp, validado no endpoint. |

---

## P1 — Alto

### 5. Config-Usuario inexistente após cadastro

|                   |                                                                                                                                                                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Endpoints**     | `GET /api/Usuario/Config-Usuario/{id}`, `PUT /api/Usuario/Config-Usuario/{id}`                                                                                                                                                              |
| **Arquivo**       | `Controllers/UsuarioController.cs`                                                                                                                                                                                                          |
| **Erro**          | Registro em `ConfigUsuarios` não é criado no `Registrar`/`Ativar-Login`. GET/PUT retornam **404** para usuários novos (reproduzido em contas QA e fresh).                                                                                   |
| **Como corrigir** | **Upsert:** no primeiro GET, se não existir, criar `ConfigUsuario` com defaults e retornar 200. No PUT, `FirstOrDefault` → insert se null. Alternativa: criar registro em `LoginController.ConfirmEmail` e no branch `else` do `Registrar`. |

---

### 6. Refresh token inutilizável em SPA

|                   |                                                                                                                                                                                                                                          |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Endpoint**      | `POST /api/Login/refresh-token`                                                                                                                                                                                                          |
| **Arquivo**       | `Controllers/LoginController.cs` linhas 616–674                                                                                                                                                                                          |
| **Erro**          | Exige cookie `refresh_token` **e** JWT válido (`[Authorize]`). Resposta não devolve novo token no body — só `{ message: "Token renovado!" }`. SPA com Bearer isolado recebe **401** ao expirar.                                          |
| **Como corrigir** | 1) `[AllowAnonymous]` no refresh. 2) Ler refresh do cookie **ou** body. 3) Validar refresh token no banco. 4) Retornar `{ token, expiracao }` no JSON. 5) Opcional: aceitar refresh com access token expirado (validação só do refresh). |

---

### 7. Reagendar não funciona

|                   |                                                                                                                                                                                                           |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Endpoint**      | `PUT /api/Agenda/Reagendar/{id}`                                                                                                                                                                          |
| **Arquivo**       | `Controllers/AgendaController.cs` linhas 637–651, 725–760                                                                                                                                                 |
| **Erro**          | Cancela o agendamento, chama `ReangendarAuto(...)` sem `await`, ignora body `novoagendamento`. Link de confirmação usa `Id=0` antes do `SaveChanges`. Resposta de sucesso enganosa.                       |
| **Como corrigir** | Persistir novo agendamento com data/hora do body → `SaveChanges` → depois montar link com ID real. `await` em e-mail/WhatsApp. Remover `.Result` (sync-over-async). Validar ownership antes de reagendar. |

---

### 8. Cancelar/reagendar agendamento alheio (IDOR)

|                   |                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| **Endpoints**     | `DELETE /api/Agenda/Cancelar/{id}`, `PUT /api/Agenda/Reagendar/{id}`                                    |
| **Arquivo**       | `Controllers/AgendaController.cs` linhas 637–651, 701–723                                               |
| **Erro**          | Autenticado, mas sem checagem `agendamento.UsuarioId == UsuarioId`.                                     |
| **Como corrigir** | Antes de alterar: `if (agendamento.UsuarioId != UsuarioId && !User.IsInRole("Admin")) return Forbid();` |

---

### 9. IDOR — pagamentos

|                   |                                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Endpoints**     | `GET /api/Pagamentos/{id}`, `POST /api/Pagamentos`                                                                 |
| **Arquivo**       | `Controllers/PagamentosController.cs` linhas 81–90, 135–172                                                        |
| **Erro**          | Qualquer autenticado lê pagamento alheio. POST aceita qualquer `AgendamentoId` sem validar titular.                |
| **Como corrigir** | GET: filtrar por `UsuarioId` ou role Admin do comércio. POST: `agendamento.UsuarioId == UsuarioId` antes de criar. |

---

### 10. Pagamento com cartão nunca processa

|                   |                                                                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Endpoint**      | `POST /api/Pagamentos`                                                                                                           |
| **Arquivo**       | `Controllers/PagamentosController.cs` linhas 135–172, `Models/MetodoPagamento.cs`                                                |
| **Erro**          | Body deserializa como `MetodoPagamento` base; check `is not MetodoPagamento.Cartao` sempre falha em JSON plano → erro de cartão. |
| **Como corrigir** | DTO flat com campos de cartão, ou `[JsonPolymorphic]`, ou propriedade `tipoPagamento` + switch explícito.                        |

---

### 11. WhatsApp inoperante

|                   |                                                                                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Endpoints**     | `GET /api/WhatsApp/Status/{id}`, `GET /api/WhatsApp/Obter-QrCode/{id}`                                                                                                         |
| **Arquivo**       | `Controllers/WhatsAppController.cs` (construtor usa `new HttpClient()`)                                                                                                        |
| **Erro**          | QR Code retorna **400** (TLS/falha com `api.bixs.com.br`). Status retorna "Sessão não encontrada".                                                                             |
| **Como corrigir** | Injetar `IHttpClientFactory`. Unificar URL base com `EnvioSender` (hoje `dev.bixs.com.br` vs `api.bixs.com.br`). Renovar Bearer externo. Tratar TLS/c certificado no servidor. |

---

### 12. Facebook login quebrado

|                   |                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| **Endpoint**      | `POST /api/Login/facebook-login`                                                                        |
| **Arquivo**       | `Controllers/LoginController.cs` linhas 238–254                                                         |
| **Erro**          | Secret hardcoded `"Facebook:AppSecret"` (literal). Sem `[AllowAnonymous]` → **401** antes de processar. |
| **Como corrigir** | `_configuration["Facebook:AppSecret"]` + `[AllowAnonymous]` na action.                                  |

---

## P2 — Médio

### 13. Confirmar pagamento sem role Admin

|                   |                                                                   |
| ----------------- | ----------------------------------------------------------------- |
| **Endpoint**      | `GET /api/Pagamentos/Confirmar/{id}`                              |
| **Arquivo**       | `Controllers/PagamentosController.cs` linha 104                   |
| **Erro**          | `[Authorize]` genérico — qualquer autenticado confirma pagamento. |
| **Como corrigir** | `[Authorize(Roles = "Admin")]` + validar comércio do pagamento.   |

---

### 14. Soma incorreta no valor do pagamento

|                   |                                                                        |
| ----------------- | ---------------------------------------------------------------------- |
| **Endpoint**      | `POST /api/Pagamentos`                                                 |
| **Arquivo**       | `Controllers/PagamentosController.cs` linhas 146–148                   |
| **Erro**          | Se `Valor != 0` e ≠ preço do serviço, **soma** preço ao valor enviado. |
| **Como corrigir** | Usar `Valor` do body se informado, senão preço do serviço — sem somar. |

---

### 15. Histórico admin — contrato inconsistente

|                   |                                                                                                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Endpoint**      | `GET /api/Agenda/Comercio-Historico/{id}`                                                                                                                                 |
| **Arquivo**       | `Controllers/AgendaController.cs` ~linha 490                                                                                                                              |
| **Erro**          | Lista vazia retorna **string** `"Histórico Vazio"` em vez de `[]`. Query `periodo=mes` (string) retorna **400** — API espera inteiro 1–12.                                |
| **Como corrigir** | Retornar `Ok(new { agendamentos = Array.Empty<...>() })` ou `[]`. Aceitar alias (`mes` → mês atual, `semana` → 7 dias) **ou** documentar contrato int e alinhar frontend. |

---

### 16. Agenda admin sem escopo de comércio (IDOR)

|                   |                                                                                          |
| ----------------- | ---------------------------------------------------------------------------------------- |
| **Endpoints**     | `GET /api/Agenda/Comercio/{id}`, `GET /api/Agenda/Comercio-Historico/{id}`               |
| **Arquivo**       | `Controllers/AgendaController.cs` linhas 382–491                                         |
| **Erro**          | Filtra só por `comercioId`; não valida se o admin/profissional pertence ao comércio.     |
| **Como corrigir** | Checar `UsuariosEmpresas` com `UsuarioId` + `ComercioId` + role antes de retornar dados. |

---

### 17. Vincular usuário a comércio alheio

|                   |                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Endpoint**      | `POST /api/ComercioUsuarios/Cadastrar-Funcionario-Cliente`                                                                                 |
| **Arquivo**       | `Controllers/ComercioUsuariosController.cs` linhas 146–216                                                                                 |
| **Erro**          | Admin autenticado pode usar qualquer `IdComercio` do body. Usuário novo criado sem senha/role (`Status=Pendente`, CPF placeholder).        |
| **Como corrigir** | Validar que caller é admin do `IdComercio`. Fluxo de convite: criar Pendente + link de cadastro; completar no `Registrar` (branch `else`). |

---

### 18. Serviços/Categorias — IDOR horizontal

|                   |                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------- |
| **Endpoints**     | `PUT/DELETE /api/Servicos/{id}`, `PUT/DELETE /api/Categorias/{id}`                 |
| **Arquivo**       | `Controllers/ServicosController.cs`, `Controllers/CategoriasController.cs`         |
| **Erro**          | Altera/deleta por ID do recurso sem verificar `IdComercio` do admin logado.        |
| **Como corrigir** | Join com comércio do recurso vs comércios do usuário; `Forbid()` se não pertencer. |

---

### 19. PUT Serviço retorna OK com validação falha

|                   |                                                                               |
| ----------------- | ----------------------------------------------------------------------------- |
| **Endpoint**      | `PUT /api/Servicos/{id}`                                                      |
| **Arquivo**       | `Controllers/ServicosController.cs` linhas 204–257                            |
| **Erro**          | ModelState inválido → pula updates mas retorna `Ok(servicoExistente)`.        |
| **Como corrigir** | `if (!ModelState.IsValid) return BadRequest(ModelState);` antes de persistir. |

---

### 20. GET Categoria retorna null em vez de 404

|                   |                                                    |
| ----------------- | -------------------------------------------------- |
| **Endpoint**      | `GET /api/Categorias/{id}`                         |
| **Arquivo**       | `Controllers/CategoriasController.cs` linhas 46–49 |
| **Erro**          | `Ok(null)` com status 200.                         |
| **Como corrigir** | `return NotFound()` quando não encontrada.         |

---

### 21. Avaliações — IDOR e sem POST

|                   |                                                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Endpoints**     | `GET /api/Avaliacoes/Usuario/{id}`, `PUT /api/Avaliacoes/{id}`                                                    |
| **Arquivo**       | `Controllers/AvaliacoesController.cs`                                                                             |
| **Erro**          | GET não exige `id == UsuarioId`. Não existe POST para criar avaliação.                                            |
| **Como corrigir** | Validar ownership no GET. Implementar `POST /api/Avaliacoes` com regras de negócio (agendamento concluído, etc.). |

---

### 22. GET Comercios exige login

|                   |                                                                                                             |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| **Endpoint**      | `GET /api/Comercios`                                                                                        |
| **Arquivo**       | `Controllers/ComerciosController.cs` linha 40, `BaseController.cs` linha 7                                  |
| **Erro**          | Herda `[Authorize]` — **401** sem token. Frontend usa como listagem pública na tela de agendar.             |
| **Como corrigir** | `[AllowAnonymous]` na action se produto exige listagem sem login, **ou** manter auth e documentar contrato. |

---

### 23. Logo do comércio não persiste

|                   |                                                                            |
| ----------------- | -------------------------------------------------------------------------- |
| **Endpoint**      | `POST /api/Comercios`                                                      |
| **Arquivo**       | `Controllers/ComerciosController.cs` linhas 147–162                        |
| **Erro**          | Upload de imagem ok, mas `Update`/`SaveChanges` do `LogoUrl` comentados.   |
| **Como corrigir** | Descomentar persistência após upload ou salvar URL retornada pelo storage. |

---

### 24. ConfigComercio — HorarioId antes do save

|                   |                                                                                                    |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| **Endpoint**      | `POST /api/ConfigComercio`                                                                         |
| **Arquivo**       | `Controllers/ConfigComercioController.cs` linhas 180–186                                           |
| **Erro**          | `FuncionarioEmpresa.HorarioId = horaatendimento.Id` antes de `SaveChangesAsync` — FK pode ficar 0. |
| **Como corrigir** | `SaveChanges` do horário primeiro; depois atribuir ID real ao vínculo.                             |

---

### 25. Registrar — crash se role não existir

|                   |                                                                                                           |
| ----------------- | --------------------------------------------------------------------------------------------------------- |
| **Endpoint**      | `POST /api/Login/Registrar`                                                                               |
| **Arquivo**       | `Controllers/LoginController.cs` linhas 441, 445                                                          |
| **Erro**          | `Roles.FirstOrDefault(...).Id` sem null-check → **500** após reset do banco (tabela `AspNetRoles` vazia). |
| **Como corrigir** | Verificar role antes de usar; seed de roles no startup ou migration.                                      |

---

### 26. AdminTeste DELETE Empresas não deleta

|                   |                                                         |
| ----------------- | ------------------------------------------------------- |
| **Endpoint**      | `DELETE /api/AdminTeste/Empresas`                       |
| **Arquivo**       | `Controllers/AdminTesteController.cs` linhas 36–44      |
| **Erro**          | Apenas lista comércios e retorna 200 — nada é removido. |
| **Como corrigir** | Implementar delete real ou remover endpoint enganoso.   |

---

### 27. Deletar-Dados apaga Identity

|                   |                                                                 |
| ----------------- | --------------------------------------------------------------- |
| **Endpoint**      | `DELETE /api/AdminTeste/Deletar-Dados`                          |
| **Arquivo**       | `Models/DbAgendaAi.cs` (script DELETE em todas as tabelas)      |
| **Erro**          | Apaga `AspNetRoles` — `Registrar` falha até restart da app.     |
| **Como corrigir** | Excluir tabelas Identity do script ou re-seed roles após reset. |

---

## P3 — Baixo / infra

| #   | Erro                              | Onde                                                       | Como corrigir                                                     |
| --- | --------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------- |
| 28  | CORS sem origens do frontend/prod | `Program.cs` ~58–62                                        | Adicionar `https://agendaai.bixs.com.br`, `http://localhost:5174` |
| 29  | WhatsApp enviado em duplicata     | `Services/EnvioSender.cs` ~57–67                           | Remover segundo `PostAsync` redundante                            |
| 30  | URLs Bix inconsistentes           | `EnvioSender.cs` vs `WhatsAppController.cs`                | Centralizar base URL em config                                    |
| 31  | DI duplicado                      | `Program.cs`                                               | Remover registros duplicados de `AddControllers`/`IEnvioSender`   |
| 32  | Sync-over-async                   | `CategoriasController.cs` ~143, `AgendaController.cs` ~725 | Trocar `.Result` por `await`                                      |
| 33  | Schema SQL hardcoded              | `WhatsAppController.cs` ~179–184                           | Remover `IDENTITY_INSERT usu2_agenda` — usar EF                   |
| 34  | AES com chave JWT                 | `Services/UserService.cs`                                  | Chave dedicada para CVV, não reutilizar `Jwt:Key`                 |
| 35  | Filtro EF incorreto               | `ConfigComercioController.cs` ~41                          | `UsuariosEmpresas == null` → `!Any()`                             |
| 36  | IIS 404 HTML intermitente         | Ops / deploy                                               | Monitorar; garantir que rotas `/api/*` chegam ao Kestrel          |

---

## Ordem sugerida de correção

1. **Segurança:** #2 AdminTeste → #3–4 IDOR/agenda anônima → #8–9 IDOR
   cancelamento/pagamentos
2. **Produto bloqueado:** #1 Comercio-Agendar → #5 Config-Usuario → #6
   refresh-token
3. **Fluxos quebrados:** #7 reagendar → #10–11 pagamento/WhatsApp
4. **Contrato/qualidade:** #15 histórico → #18–20 CRUD escopo → demais P2/P3
