# ARMINI MCP Server

JSON-RPC tool host for the ARMINI assistant. Hosts the 10 stateless tools the LLM can call; the **AI Gateway** (`../ai-gateway/`) is the sole consumer. Tool handlers proxy to `../mock-backend/` (or the real .NET Digital Hub via `BACKEND_URL`).

## Run

```bash
npm install
npm run dev          # tsx watch, port 3003
npm run typecheck    # tsc --noEmit
npm run build        # tsc → dist/
npm start            # node dist/index.js
```

Requires `mock-backend/` (or the real backend) running on `BACKEND_URL` — defaults to `http://localhost:3002`.

## Environment (`.env`)

| Var | Default | Required | Notes |
|---|---|---|---|
| `MCP_PORT` | `3003` | – | JSON-RPC listener |
| `BACKEND_URL` | `http://localhost:3002` | – | Where the backend client points |
| `BACKEND_API_KEY` | `dev-mock-key` | – | Sent as `x-api-key`; mock ignores it |
| `BACKEND_USERNAME` | `gabriel` | – | Used by `getEmployeeInfo` (swagger has no `/me`) |
| `BACKEND_TIMEOUT_MS` | `30000` | – | |

## JSON-RPC surface

Single endpoint: `POST /mcp` (plus `GET /health` — returns `{ status, backendUrl }`).

| Method | Input | Output |
|---|---|---|
| `tools/list` | `{}` | `{ tools[] }` |
| `tools/call` | `{ name, arguments }` | `{ content[], isError? }` |

Accepts but ignores `x-api-key` and `x-corehub-claims-*` headers — same stub posture as `mock-backend/`. Auth is out of scope for now (see `../REFACTOR_PLAN.md` § Out of scope for the split refactor).

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
# List tools
curl -X POST -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' \
  http://localhost:3003/mcp

# Call a tool
curl -X POST -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"getProjects","arguments":{}}}' \
  http://localhost:3003/mcp

# Health
curl http://localhost:3003/health
```

## Layout

```
src/
  index.ts             Express boot + tool registration
  config/              env (zod)
  tools/               ToolRegistry + 10 stateless handlers
  backend/             fetch wrapper + clients (imputations/projects/expenses) + adapters
  transport/           Express router with JSON-RPC 2.0 (POST /mcp, tools/* only)
  utils/               logger + error helpers
```

## Notes

- **No in-memory state.** All persistence lives in `mock-backend/` (or the real backend). This server is safe to restart at any time.
- **Backend swap is one env var.** Point `BACKEND_URL` at the real .NET Digital Hub when it's reachable — no code change.
- **"MCP-shaped", not protocol-compliant.** Today's transport speaks JSON-RPC 2.0 with `tools/list` + `tools/call`, which is enough for the AI Gateway. Strict MCP-protocol features (resources, prompts, formal error codes) are out of scope until a third-party MCP client needs to connect.
