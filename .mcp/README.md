# MCP AgendaAi (local)

O servidor MCP do AgendaAi fica referenciado em `.mcp/ServidorMCP/`.

## Setup (Windows)

Se a pasta `ServidorMCP` ainda não existir, crie um junction apontando para o clone local do ServidorMCP:

```powershell
cmd /c mklink /J ".mcp\ServidorMCP" "C:\caminho\para\ServidorMCP"
```

A configuração do Cursor está em `.cursor/mcp.json` (somente neste repositório).
