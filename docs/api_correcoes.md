# Correções Necessárias (Bugs) - API AgendaAi

Este documento lista falhas críticas e inconsistências que precisam de correção imediata para o funcionamento correto do fluxo.

---

## 1. Configuração do Estabelecimento (Retorno de Erro Inválido)
**Endpoint:** `GET /api/ConfigComercio/{id}`

*   **Problema:** Quando o comércio existe mas não possui configurações, o sistema retorna status `200 OK` com uma **string** ("Horário de atendimento ou configurações não encontrado.") em vez de um objeto JSON estruturado.
*   **Impacto:** Quebra o Frontend que espera um objeto `ComercioConfigView`.
*   **Sugestão:** Retornar um objeto `ComercioConfigView` preenchido com valores padrão.

---

## 2. Serviços: Categoria não é salva na Edição (PUT)
**Endpoint:** `PUT /api/Servicos/{id}`

*   **Problema:** O método `Put` ignora completamente a coleção de `Categorias` enviada no DTO.
*   **Impacto:** Impossível trocar ou remover categorias de um serviço já cadastrado via API.
*   **Sugestão:** Implementar a atualização da lista de categorias no método `Put` do `ServicosController.cs`.

---

## 3. WhatsApp: Falha ao Obter QR Code (Erro 400)
**Endpoint:** `GET /api/WhatsApp/Obter-QrCode/{id}`

*   **Problema:** A API retorna `400 Bad Request` com a mensagem `"Falha ao obter QR Code"`.
*   **Causa Raiz:** Problemas de handshake TLS/SSL no servidor ao tentar renovar o token com o provedor externo.
*   **Sugestão:** Resolver o handshake TLS/SSL e gerenciar HttpClient via factory.

---

## 4. Agenda: Bloqueio de Agendamento por Terceiros (Admin)
**Endpoint:** `POST /api/Agenda`

*   **Problema:** A API impede que o ID do usuário que agenda seja diferente do ID do usuário autenticado.
*   **Impacto:** Admins não conseguem agendar para clientes.
*   **Sugestão:** Remover restrição para perfis administrativos.

---

## 5. Restrição indevida no endpoint de Profissionais
**Endpoint:** `GET /api/ComercioUsuarios/Profissionais/{id}`

*   **Problema:** Exige roles `Admin` ou `Profissional`.
*   **Impacto:** Clientes não conseguem ver profissionais para agendar.
*   **Sugestão:** Permitir acesso para qualquer usuário autenticado.
