# Registro de erros — API AgendaAi

## 2026-06-17 — `DELETE /api/AdminTeste/Deletar-Dados` apaga roles do Identity

**Endpoint:** `POST /api/Login/Registrar` com `tipoPermissao` 1 (Profissional) ou 2 (Admin/Estabelecimento)

**Status:** 500 Internal Server Error (body vazio)

**Causa:** `LimparBancoDeDadosManual()` remove todas as tabelas, inclusive `AspNetRoles`. O `Registrar` faz `_context.Roles.FirstOrDefault(r => r.Name == "Admin").Id` sem null-check → NullReferenceException.

**Impacto no frontend/MCP:**
- Cadastro de estabelecimento/profissional quebra após reset do banco
- Ativação via e-mail continua necessária para `tipoPermissao: 0` (workaround: registrar duas vezes o mesmo e-mail pendente ativa a conta)
- JWT sai com `permissao: "Cliente"` até existir vínculo em `UsuariosEmpresas` ou role Identity

**Workaround QA (pós-reset):**
1. Registrar com `tipoPermissao: 0`, repetir o POST para ativar
2. Re-seed manual de roles `Admin`, `Profissional`, `Cliente` no banco antes de cadastros Admin/Profissional

**Contas QA (senha `Senha@123`):**
| Tipo | E-mail | Role no JWT | Observação |
|------|--------|-------------|------------|
| Cliente | cliente@agendai.dev | Cliente | OK |
| Estabelecimento | novo_estab@agendai.dev | **Admin** | Conta válida para área admin |
| Estabelecimento | estabelecimento@agendai.dev | **Cliente** | Quebrada — criada com `tipoPermissao: 0` no pós-reset; não usar |
| Profissional | profissional@agendai.dev | **Cliente** | Quebrada — recadastrar com `tipoPermissao: 1` |

> **Atualização 17/06/2026:** Cadastro com `tipoPermissao: 2` voltou a funcionar. Contas antigas criadas como Cliente no workaround continuam com role errada no JWT.

---

## 2026-06-17 — `GET /api/Comercios/Admin` e `POST /api/Comercios` → 403

**Endpoints:**
- `GET /api/Comercios/Admin` — listar comércios do admin autenticado
- `POST /api/Comercios` — criar estabelecimento

**Status:** 403 Forbidden (body vazio `{}`)

**Causa:** Ambos exigem `[Authorize(Roles = "Admin,Profissional")]`. O JWT gerado no login traz `ClaimTypes.Role` conforme `permissao` no `UsuarioDto` — contas criadas como Cliente recebem role `"Cliente"` e são bloqueadas.

**Sintomas no frontend (antes da correção):**
- Ao logar em `/login?type=estabelecimento` com conta Cliente → entrava na área admin
- `AdminLayout` chamava `GET /api/Comercios` (endpoint errado → 404) e depois `GET /api/Comercios/Admin` → 403
- Modal de cadastro de comércio → `POST /api/Comercios` → 403

**Correção frontend (17/06/2026):**
- Login e `ProtectedRoute` usam `permissao` do JWT/API como fonte de verdade (não o `?type=` da URL)
- Cliente tentando área de estabelecimento → redireciona para `/app`
- `AdminLayout` usa `GET /api/Comercios/Admin` (não `/api/Comercios`)
- 403/404 em verificação de comércio tratados sem erro ruidoso no console

**Correção backend necessária:** Re-seed de `AspNetRoles` + recadastro com `tipoPermissao: 2` (Admin) para liberar criação de comércio.

---

## 2026-06-17 — `GET /api/Comercios` usado no lugar de `/Admin` (frontend)

**Endpoint:** `GET /api/Comercios`

**Status:** 404 Not Found (banco vazio após reset)

**Causa:** Endpoint lista comércios **públicos** (fluxo do cliente agendar). Não serve para verificar se o admin logado tem comércio vinculado.

**Correção frontend:** Usar `GET /api/Comercios/Admin` via helper `fetchAdminComercios()` em `AdminLayout`, `useComercioId`, `config/page.tsx`, `servicos/page.tsx`.

---

## 2026-06-17 — `GET /api/ConfigComercio/{id}` não retorna IDs + `PUT Editar-Atendimento` 404

**Endpoints:**
- `GET /api/ConfigComercio/{id}` — retorna `idConfigComercio: 0` e `idHorarioAtendimento: 0` mesmo com config existente
- `PUT /api/ConfigComercio/Editar-Atendimento/{id}` — 404 quando IDs no body são `0`

**Causa (API):** `ConfigComercioController.GetConfiguracao` monta `ComercioConfigView` sem preencher `IdHorarioAtendimento` / `IdConfigComercio`. O PUT busca por `h.Id == IdHorarioAtendimento` e `s.Id == IdConfigComercio` — com `0`, nunca encontra o registro.

**Impacto:** 1º save (POST) funciona; 2º save falha com 404.

**Correção backend (arquivo local `api/Controllers/ConfigComercioController.cs`):**
- GET: atribuir `IdHorarioAtendimento` e `IdConfigComercio` reais
- PUT: fallback por `comercioId` quando IDs no body forem `0`

**Correção frontend:** `saveConfigWithIdDiscovery()` tenta combinações de IDs e cacheia no `localStorage` até o PUT retornar 200. **Requer deploy da API** para solução definitiva sem probing.
