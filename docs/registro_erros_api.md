# Registro de Inconsistências e Melhorias - API AgendaAi

Este documento centraliza as falhas identificadas na API que ainda precisam ser resolvidas.

---

# 🔴 Erros e Inconsistências (Bugs de Bloqueio/Fluxo)
*Problemas que impactam diretamente a experiência do usuário ou funcionalidades do sistema.*

## 1. Configuração do Estabelecimento (Retorno de Erro Inválido)
**Endpoint:** `GET /api/ConfigComercio/{id}`

*   **Problema:** Quando o comércio existe mas não possui configurações, o sistema retorna status `200 OK` com uma **string** ("Horário de atendimento ou configurações não encontrado.") em vez de um objeto JSON estruturado.
*   **Impacto:** Quebra o Frontend que espera um objeto `ComercioConfigView`.
*   **Sugestão:** Retornar um objeto `ComercioConfigView` preenchido com valores padrão.

---

## 2. Listagem de Clientes (Campo ID fora do padrão)
**Endpoint:** `GET /api/ComercioUsuarios/Clientes/{id}`

*   **Problema:** O objeto retornado na lista de clientes utiliza o campo `Id` em vez de `UsuarioId`.
*   **Impacto:** O Frontend pode falhar ao tentar mapear ações específicas se esperar explicitamente por `UsuarioId`.
*   **Sugestão:** Renomear o campo `Id` para `UsuarioId` no ViewModel `ComercioClientes` para manter consistência com outros endpoints.

---

## 4. Serviços: Categoria não é salva na Edição (PUT)
**Endpoint:** `PUT /api/Servicos/{id}`

*   **Problema:** O método `Put` ignora completamente a coleção de `Categorias` enviada no DTO.
*   **Impacto:** Impossível trocar ou remover categorias de um serviço já cadastrado via API.
*   **Sugestão:** Implementar a atualização da lista de categorias no método `Put` do `ServicosController.cs`.

---

## 5. WhatsApp: Falha ao Obter QR Code (Erro 400)
**Endpoint:** `GET /api/WhatsApp/Obter-QrCode/{id}`

*   **Problema:** A API retorna `400 Bad Request` com a mensagem `"Falha ao obter QR Code"`.
*   **Causa Raiz:** O `WhatsAppController` utiliza um token interno (gerenciado via `TokenStorage`) para se comunicar com o provedor externo (`api.bixs.com.br`). Logs em `api/ErroRegistro/ErroRegistro.txt` mostram falhas críticas de SSL/TLS (`The SSL connection could not be established`) durante o `AuthService.RefreshTokenAsync`. Sem o token válido, a chamada para obter o QR Code falha internamente.
*   **Impacto:** Bloqueio total da integração com WhatsApp para os estabelecimentos.
*   **Sugestão:**
    1.  Resolver o problema de handshake TLS/SSL no servidor que hospeda a API (verificar certificados e protocolos suportados).
    2.  Melhorar o tratamento de erro no `WhatsAppController` para fornecer diagnósticos mais claros (ex: diferenciar erro de autenticação interna de erro na geração do QR Code).
    3.  Considerar o uso de `IHttpClientFactory` para gerenciar melhor as conexões SSL.

---

# 🟡 Sugestões de Melhoria, Segurança e Performance
*Melhorias identificadas via análise profunda de código que aumentam a robustez do sistema.*

## S2. Segurança: Confirmação de Agenda Sem Autenticação
**Endpoint:** `POST /api/Agenda/Cliente-Confirma-Agenda`

*   **Problema:** Uso de `[AllowAnonymous]` em uma ação de alteração de estado sensível (confirmar/cancelar agendamento).
*   **Impacto:** Qualquer pessoa com o ID do agendamento pode alterar seu status.
*   **Sugestão:** Exigir autenticação e validar se o usuário logado é o dono do agendamento.

---

## S3. Privacidade: Vazamento de Dados em Lista de Comércios
**Endpoint:** `GET /api/Comercios` (e outros no `ComerciosController`)

*   **Problema:** Retorno de entidades completas do EF Core (`Comercio`) em vários métodos (`GetAdmin`, `Get(id)`, `Post`, `Put`).
*   **Impacto:** Exposição desnecessária de campos internos do banco de dados e sobrecarga de dados.
*   **Sugestão:** Utilizar DTOs simplificados (ex: `ComercioView`) em todos os retornos.

---

## S5. Performance: Gestão de HttpClient
**Controlador:** `WhatsAppController.cs`

*   **Problema:** Instanciação manual de `new HttpClient()` no construtor.
*   **Impacto:** Risco de *Socket Exhaustion* (esgotamento de portas) em alta carga.
*   **Sugestão:** Implementar `IHttpClientFactory` via injeção de dependência.

---

## S6. Segurança: Vulnerabilidade de IDOR Global
**Controladores:** `PagamentosController.cs`, `ComercioUsuariosController.cs`

*   **Problema:** Endpoints que recebem um `id` via URL (como confirmação de pagamento ou desativação de usuário) não validam se o usuário logado tem permissão sobre aquele registro específico.
*   **Impacto:** Um usuário pode agir sobre registros de terceiros apenas alterando o ID na URL.
*   **Sugestão:** Validar a propriedade do registro ou a permissão administrativa em cada ação sensível.

---

## S7. Segurança: Confirmação de Pagamento Insuficiente
**Endpoint:** `GET /api/Pagamentos/Confirmar/{id}`

*   **Problema:** Embora tenha `[Authorize]`, qualquer usuário logado pode confirmar qualquer pagamento.
*   **Impacto:** Falta de restrição de papel (Role). Apenas Admins ou Webhooks autorizados deveriam confirmar pagamentos.
*   **Sugestão:** Restringir o acesso a `Roles = "Admin"` ou validar o vínculo com o comércio.

---

## S8. Performance: Chamadas Síncronas Restantes
**Controlador:** `LoginController.cs`

*   **Problema:** Uso de `_context.SaveChanges()` (síncrono) em vez de `await _context.SaveChangesAsync()` nos métodos `Post` (Registrar) e `ConfirmEmail`.
*   **Impacto:** Bloqueio de threads e menor escalabilidade.
*   **Sugestão:** Substituir por `await SaveChangesAsync()`.

---

## S9. Lógica de Negócio: Cálculo de Valor no Pagamento
**Endpoint:** `POST /api/Pagamentos`

*   **Problema:** A linha `pagamento.Valor += agendamento.Servico.Preco;` acumula o valor se ele vier preenchido do frontend.
*   **Impacto:** Risco de cobrança em duplicidade ou valores inconsistentes se o frontend enviar o valor incorretamente.
*   **Sugestão:** Definir o valor diretamente a partir do preço do serviço no banco de dados (`pagamento.Valor = agendamento.Servico.Preco`).

---

**Data da última atualização:** 29/04/2026
**Equipe Responsável:** Engenharia de Software (Full-Stack)
