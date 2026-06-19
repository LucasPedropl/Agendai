# Regras frontend AgendaAi — integração API

## Dev server
- Porta padrão: **5174** (`npm run dev`) — 3000/5173 costumam estar ocupadas
- Usar `fetchApi` em `src/lib/api.ts` — nunca fetch solto
- 401 em rota autenticada → logout automático (evento `agendaai:session-expired`)
- `notFoundAsEmpty: true` em GETs de listas que retornam 404 vazio
- `normalizeApiList` para strings "Agenda Vazia", "Histórico Vazio"

## Agendamento
- Cliente: Agenda-Datas → Agenda-Horarios → POST /api/Agenda
- Admin: POST /api/Agenda/Comercio-Agendar (**sem** comercioId na URL)
- Payload camelCase: idProssional, idUsuario, data, horario, idServico

## Limitações conhecidas (flags em apiHelpers)
- `IS_CONFIG_USUARIO_PUT_BLOCKED` — desabilitar save de notificações
- `IS_ADMIN_AGENDA_CLIENT_NAME_UNRELIABLE` — aviso na agenda admin

## QA
- Senha: Senha@123
- cliente@agendai.dev, novo_estab@agendai.dev, profissional@agendai.dev
- comercioId=1, clienteId=5de913ee-b426-4e0c-bbec-ec7b61a3a90f

## MCP
- Rodar `Fluxo_Agenda_E2E_Completo` após mudanças na agenda
- Se AutoLogin falhar: `atualizar_perfil_autenticacao`