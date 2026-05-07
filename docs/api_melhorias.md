# Melhorias, Segurança e Performance - API AgendaAi

Este documento lista sugestões técnicas para aumentar a robustez, segurança e escalabilidade do sistema.

---

## 1. Segurança: Confirmação de Agenda Sem Autenticação
**Endpoint:** `POST /api/Agenda/Cliente-Confirma-Agenda`

*   **Problema:** Uso de `[AllowAnonymous]`.
*   **Sugestão:** Exigir autenticação e validar propriedade do agendamento.

---

## 2. Privacidade: Vazamento de Dados em Lista de Comércios
**Endpoint:** `GET /api/Comercios`

*   **Problema:** Retorno de entidades completas do EF Core.
*   **Sugestão:** Utilizar DTOs simplificados.

---

## 3. Performance: Gestão de HttpClient
**Controlador:** `WhatsAppController.cs`

*   **Problema:** Instanciação manual de `HttpClient`.
*   **Sugestão:** Implementar `IHttpClientFactory`.

---

## 4. Segurança: Vulnerabilidade de IDOR Global
**Controladores:** `PagamentosController.cs`, `ComercioUsuariosController.cs`

*   **Problema:** Falta de validação de propriedade em ações sensíveis via ID na URL.
*   **Sugestão:** Validar se o usuário logado possui permissão sobre o recurso específico.

---

## 5. Segurança: Confirmação de Pagamento Insuficiente
**Endpoint:** `GET /api/Pagamentos/Confirmar/{id}`

*   **Problema:** Qualquer usuário logado pode confirmar pagamentos.
*   **Sugestão:** Restringir a `Roles = "Admin"`.

---

## 6. Performance: Chamadas Síncronas Restantes
**Controlador:** `LoginController.cs`

*   **Problema:** Uso de `SaveChanges()` síncrono.
*   **Sugestão:** Substituir por `SaveChangesAsync()`.

---

## 7. Lógica de Negócio: Cálculo de Valor no Pagamento
**Endpoint:** `POST /api/Pagamentos`

*   **Problema:** Valor acumula se enviado pelo front.
*   **Sugestão:** Definir o valor no servidor baseado no preço do serviço.

---

## 8. Finanças: Filtros de Período no Histórico
**Endpoint:** `GET /api/Pagamentos/Pagamentos-Cliente`

*   **Problema:** Retorna lista bruta sem filtros.
*   **Sugestão:** Adicionar parâmetros `mes` e `ano`.
