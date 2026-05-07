# Novas Funcionalidades Sugeridas - API AgendaAi

Este documento lista novas rotas e lógicas de negócio necessárias para expandir as capacidades do sistema.

---

## 1. Gestão de Clientes: Cadastro Direto sem Aprovação
**Endpoint:** `POST /api/ComercioUsuarios/Cadastrar-Funcionario-Cliente`

*   **Problema:** Exige aprovação de email para clientes cadastrados presencialmente.
*   **Sugestão:** Adicionar flag para ativar usuário automaticamente no momento do cadastro pelo estabelecimento.

---

## 2. Agenda: Agendamento para Cliente Inexistente (Walk-in)
**Endpoint:** `POST /api/Agenda`

*   **Problema:** Exige GUID de usuário pré-existente.
*   **Sugestão:** Permitir agendamento enviando apenas Nome/Telefone, criando um registro simplificado.

---

## 3. Finanças: Gestão de Métodos de Pagamento (Carteira Digital)
*   **Problema:** Impossibilidade de salvar cartões para pagamentos recorrentes.
*   **Sugestão:** Criar endpoints para gerenciar cartões salvos (`POST/GET/DELETE /api/Pagamentos/Metodos`).
