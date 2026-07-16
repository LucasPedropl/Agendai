# Agendai - Diretrizes de Desenvolvimento e Arquitetura

Bem-vindo ao **Agendai**! Este documento serve como guia de onboarding técnico para desenvolvedores e agentes de IA, descrevendo a stack tecnológica, a estrutura e a arquitetura básica da aplicação de agendamentos.

---

## 1. Visão Geral do Projeto
O Agendai é o sistema de agendamento online integrado do ecossistema UaiPDV, permitindo que clientes agendem horários e serviços diretamente com os estabelecimentos comerciais integrados.

---

## 2. Stack Tecnológica
* **Interface (Core)**: React (Vite) & TypeScript.
* **Estilização**: Tailwind CSS.
* **Roteamento**: `react-router-dom` ou equivalente.
* **Backend Local**: A pasta `/api` na raiz de `apps/Agendai` contém as rotinas e endpoints do serviço de agendamento.

---

## 3. Estrutura de Diretórios
```
apps/Agendai/
├── src/                  # Código-fonte principal do Frontend (Componentes, Páginas, Hooks, Services)
├── api/                  # Endpoints de API e Integrações locais do Agendamento
├── docs/                 # Documentação e especificações de comportamento
├── public/               # Assets estáticos globais (favicon, etc.)
├── package.json          # Dependências do projeto e scripts de execução
├── vite.config.ts        # Configuração do Vite e roteamento de proxies
└── tsconfig.json         # Configurações do compilador TypeScript
```

---

## 4. Diretrizes de Atuação
* **Estilo e UI**: Respeite os padrões de layout responsivos e estilizações sob o Tailwind CSS já existentes no projeto.
* **Consistência de Tipos**: Use TypeScript em modo estrito, mapeando interfaces e tipos correspondentes no diretório apropriado dentro de `src/`.
* **API e Integrações**: Ao lidar com rotas da API em `apps/Agendai/api`, garanta que as modificações mantenham a conformidade com o contrato de consumo do frontend, testando endpoints de forma segura antes de commitá-los.
