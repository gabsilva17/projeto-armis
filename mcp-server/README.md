# ARMINI AI Gateway

Provider-agnostic LLM orchestrator for the ARMINI mobile app. Owns the agentic chat loop, prompt building, and 10 stateless tools. The tools delegate to the same backend the mobile app uses — `mock-backend/` in dev, the real .NET Digital Hub in prod (swap is one env var).

> **Naming note.** The folder is called `mcp-server/` for historical reasons. Functionally this is an AI Gateway, not a true MCP server in the Anthropic sense (which would expose tools/resources for an external LLM-aware client). A clean carve-out into a separate MCP process is planned — see `../REFACTOR_PLAN.md` § Phases 7-9.

## Run

```bash
npm install
npm run dev          # tsx watch, port 3001
npm run typecheck    # tsc --noEmit
npm run build        # tsc → dist/
npm start            # node dist/index.js
```

Requires `mock-backend/` (or the real backend) running on `BACKEND_URL` — defaults to `http://localhost:3002`.

## Environment (`.env`)

| Var | Default | Required | Notes |
|---|---|---|---|
| `LLM_PROVIDER` | `anthropic` | – | `anthropic` \| `openai` |
| `ANTHROPIC_API_KEY` | – | iff `LLM_PROVIDER=anthropic` | |
| `OPENAI_API_KEY` | – | iff `LLM_PROVIDER=openai` | |
| `PORT` | `3001` | – | JSON-RPC listener |
| `BACKEND_URL` | `http://localhost:3002` | – | Where the backend client points |
| `BACKEND_API_KEY` | `dev-mock-key` | – | Sent as `x-api-key`; mock ignores it |
| `BACKEND_USERNAME` | `gabriel` | – | Used by `getEmployeeInfo` (swagger has no `/me`) |
| `BACKEND_TIMEOUT_MS` | `30000` | – | |

## JSON-RPC surface

Single endpoint: `POST /mcp` (plus `GET /health` for the mobile boot ping — accepts no body, returns `{ status, provider }`).

| Method | Input | Output |
|---|---|---|
| `chat/send` | `{ messages[], language, userName, imageData? }` | `{ text, suggestions[], actions[] }` |
| `chat/bootstrap` | `{ language, userName }` | `{ messageText, suggestions[] }` |
| `chat/scan` | `{ base64, mediaType }` | `{ expenseData }` |
| `tools/list` | `{}` | `{ tools[] }` |
| `tools/call` | `{ name, arguments }` | `{ content[] }` |

Mobile only calls the `chat/*` methods. `tools/*` exist for debugging and the mobile boot ping (`tools/list` is used as a cheap reachability check).

## Tools (stateless)

All tool handlers proxy to `src/backend/*Client` and translate DTOs ↔ internal shape via adapters.

| Tool | Purpose | Backend route |
|---|---|---|
| `getTimesheets` | Read entries for a month | `GET /api/v1/imputation/my/{year}/{month}` |
| `createTimesheetEntry` | Create an entry | `POST /api/v1/imputation/my` |
| `editTimesheetEntry` | Update an entry | `PUT /api/v1/imputation/my/{id}` |
| `deleteTimesheetEntry` | Delete an entry | `DELETE /api/v1/imputation/my/{id}` |
| `getExpenses` | List expenses | `GET /api/v1/expense/my` *(speculative)* |
| `submitExpense` | Create expense | `POST /api/v1/expense/my` *(speculative)* |
| `editExpense` | Update expense | `PUT /api/v1/expense/my/{id}` *(speculative)* |
| `deleteExpense` | Delete expense | `DELETE /api/v1/expense/my/{id}` *(speculative)* |
| `getProjects` | List projects + tasks | `GET /api/v1/project/my` (+ `/task/my/{code}`) |
| `getEmployeeInfo` | Identity stub | derived from `BACKEND_USERNAME` (no `/me` in swagger) |

## Quick curl reference

```bash
# Health
curl http://localhost:3001/health

# List tools
curl -X POST -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' \
  http://localhost:3001/mcp

# Bootstrap greeting
curl -X POST -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"chat/bootstrap","params":{"language":"en","userName":"Gabriel"}}' \
  http://localhost:3001/mcp

# Chat send
curl -X POST -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"chat/send","params":{"language":"en","userName":"Gabriel","messages":[{"role":"user","content":"What did I log this month?"}]}}' \
  http://localhost:3001/mcp
```

## Layout

```
src/
  index.ts             Express boot + tool registration
  config/              env (zod) + constants (model IDs, max tokens…)
  providers/           LLMProvider interface + Anthropic + OpenAI + factory
  orchestrator/        chatOrchestrator (send/bootstrap/scan) + promptBuilder + responseParser
  tools/               ToolRegistry + 10 stateless handlers
  backend/             fetch wrapper + clients (imputations/projects/expenses) + adapters
  transport/           Express router with JSON-RPC 2.0 (POST /mcp)
  utils/               logger + error helpers
```

## Notes

- **No in-memory state.** All persistence lives in `mock-backend/` (or the real backend). This server is safe to restart at any time.
- **Provider swap is one env var.** Switch `LLM_PROVIDER` between `anthropic` and `openai`; the orchestrator and tools don't care.
- **Backend swap is one env var.** Point `BACKEND_URL` at the real .NET Digital Hub when it's reachable — no code change.
- **Context flows in via tools, not the system prompt.** The agentic loop fetches whatever it needs at call time. The mobile app must not stuff store data into `chat/send` params — see `armini/CLAUDE.md` § AI Gateway.
