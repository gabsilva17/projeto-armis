# ARMINI AI Gateway

Provider-agnostic LLM orchestrator for the ARMINI mobile app. Owns the agentic chat loop, prompt building, and provider abstraction. Tool execution is delegated to the **MCP server** (`../mcp/`) over JSON-RPC — the gateway is an MCP client.

## Run

```bash
npm install
npm run dev          # tsx watch, port 3001
npm run typecheck    # tsc --noEmit
npm run build        # tsc → dist/
npm start            # node dist/index.js
```

Requires `mcp/` running on `MCP_URL` (default `http://localhost:3003`). `mcp/` in turn talks to `mock-backend/` on port 3002.

## Environment (`.env`)

| Var | Default | Required | Notes |
|---|---|---|---|
| `LLM_PROVIDER` | `anthropic` | – | `anthropic` \| `openai` |
| `ANTHROPIC_API_KEY` | – | iff `LLM_PROVIDER=anthropic` | |
| `OPENAI_API_KEY` | – | iff `LLM_PROVIDER=openai` | |
| `PORT` | `3001` | – | JSON-RPC listener |
| `MCP_URL` | `http://localhost:3003` | – | Where the MCP client points |
| `MCP_TIMEOUT_MS` | `30000` | – | |

## JSON-RPC surface

Single endpoint: `POST /mcp` (plus `GET /health` for the mobile boot ping — returns `{ status, provider, mcpUrl }`).

| Method | Input | Output |
|---|---|---|
| `chat/send` | `{ messages[], language, userName, imageData? }` | `{ text, suggestions[], actions[], toolCalls[], dropdown? }` |
| `chat/bootstrap` | `{ language, userName }` | `{ messageText, suggestions[] }` |
| `chat/scan` | `{ base64, mediaType }` | `{ expenseData }` |

`tools/list` and `tools/call` no longer live here — they were carved out into `../mcp/` (port 3003). POSTing either to this server returns `method-not-found`.

## Layout

```
src/
  index.ts             Express boot + DI (provider + McpClient → orchestrator)
  config/              env (zod) + constants (model IDs, max tokens…)
  providers/           LLMProvider interface + Anthropic + OpenAI + factory
  orchestrator/        chatOrchestrator (send/bootstrap/scan) + promptBuilder + responseParser
  mcpClient/           JSON-RPC-over-fetch client for the MCP server (listTools, callTool)
  transport/           Express router with JSON-RPC 2.0 (POST /mcp, chat methods only)
  utils/               logger + error helpers
```

## Quick curl reference

```bash
# Health (cheap reachability ping — used by mobile boot)
curl http://localhost:3001/health

# Bootstrap greeting
curl -X POST -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"chat/bootstrap","params":{"language":"en","userName":"Gabriel"}}' \
  http://localhost:3001/mcp

# Chat send
curl -X POST -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"chat/send","params":{"language":"en","userName":"Gabriel","messages":[{"role":"user","content":"What did I log this month?"}]}}' \
  http://localhost:3001/mcp
```

## Notes

- **No data state.** The gateway holds no domain state. The agentic loop fetches the tool catalog from `mcp/` on every `chat/send`.
- **Provider swap is one env var.** Switch `LLM_PROVIDER` between `anthropic` and `openai`; the orchestrator doesn't care.
- **Phase 7 outage behavior.** If `mcp/` is unreachable, `chat/send` currently fails with a JSON-RPC error. Phase 8 will let chat continue without tools and surface a "limited mode" banner on mobile.
- **Context flows in via tools, not the system prompt.** The mobile app must not stuff store data into `chat/send` params — see `armini/CLAUDE.md` § AI Gateway.
