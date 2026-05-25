# ARMINI

Mobile port of the ARMIS Group Digital Hub. Built as a curricular internship project (LEI-ISEP, Feb–Jul 2026). Monorepo of four sibling projects plus the canonical API contract.

## Projects

| Folder | Role | Port | Stack |
|---|---|---|---|
| `armini/` | React Native mobile app (Expo Router) | Metro 8081 | RN + TS strict + Zustand + Reanimated |
| `ai-gateway/` | LLM orchestrator (chat methods) | 3001 | Node + TS + Express + JSON-RPC 2.0 |
| `mcp/` | MCP server — tool catalog + handlers | 3003 | Node + TS + Express + JSON-RPC 2.0 |
| `mock-backend/` | In-memory mirror of the .NET Digital Hub API | 3002 | Node + TS + Express |
| `swagger.json` | Canonical contract for the real .NET API | – | OpenAPI 3.0.1 |

## Architecture

```
┌──────────┐  chat        ┌────────────────────────┐  tools/*       ┌────────────────────┐
│          │ ───────────▶ │   AI Gateway (:3001)   │ ─────────────▶ │   MCP (:3003)      │
│ armini/  │              │   POST /mcp            │  (JSON-RPC)    │   POST /mcp        │
│ Metro    │              │   chat/send,           │                │   tools/list,      │
│          │              │   chat/bootstrap,      │                │   tools/call       │
│          │              │   chat/scan            │                │   (10 tools)       │
│          │              └────────────────────────┘                └─────────┬──────────┘
│          │                                                                  │ HTTP /api/v1
│          │  data (CRUD)                                                     ▼
│          │ ───────────────────────────────────────────▶ ┌──────────────────────────────┐
└──────────┘                                              │   mock-backend (:3002)       │
                                                          │   In-memory Express          │
                                                          │   mirror of swagger.json     │
                                                          └──────────────────────────────┘
```

- Mobile reads/writes data through a typed **backend client** (`armini/src/services/backend/`) that targets the swagger contract.
- Mobile talks only to the **AI Gateway** for chat (`chat/send`, `chat/bootstrap`, `chat/scan`). It never speaks to `mcp/` directly.
- The Gateway is an MCP client over HTTP — when chat runs the agentic loop, it fetches the tool catalog from `mcp/` and dispatches tool calls there.
- The 10 tools in `mcp/` are stateless and call the same `mock-backend/` the mobile app uses.
- Swap mock → real .NET = change `EXPO_PUBLIC_BACKEND_URL` (mobile) and `BACKEND_URL` (`mcp/`). No code change.

## Quickstart

Four terminals, in this order:

```bash
# 1. Mock backend (port 3002)
cd mock-backend
npm install
npm run dev

# 2. MCP server (port 3003)
cd mcp
npm install
npm run dev

# 3. AI Gateway (port 3001)
cd ai-gateway
npm install
# create .env with at minimum:
#   LLM_PROVIDER=anthropic
#   ANTHROPIC_API_KEY=sk-...
npm run dev

# 4. Mobile (Metro on 8081)
cd armini
npm install
npm start
```

A top-level `npm run dev` that orchestrates the three Node services lands in Phase 9.

Each project has its own README/CLAUDE.md with deeper detail.

## Env-var map

| Var | Where | Default | Purpose |
|---|---|---|---|
| `EXPO_PUBLIC_BACKEND_URL` | `armini/` | derived from Metro hostUri | Mobile → backend |
| `EXPO_PUBLIC_BACKEND_API_KEY` | `armini/` | `dev-mock-key` | Sent as `x-api-key` |
| `EXPO_PUBLIC_AI_GATEWAY_URL` | `armini/` | derived from Metro hostUri | Mobile → AI Gateway |
| `LLM_PROVIDER` | `ai-gateway/` | `anthropic` | `anthropic` \| `openai` |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` | `ai-gateway/` | – | Provider key |
| `PORT` | `ai-gateway/` | `3001` | Gateway listener |
| `MCP_URL` | `ai-gateway/` | `http://localhost:3003` | Gateway → MCP |
| `MCP_PORT` | `mcp/` | `3003` | MCP listener |
| `BACKEND_URL` | `mcp/` | `http://localhost:3002` | MCP → backend |
| `BACKEND_USERNAME` | `mcp/` | `gabriel` | Identity stub (no `/me` in swagger) |
| `PORT` | `mock-backend/` | `3002` | Mock listener |

## What owns what

- **Domain logic & UI** → `armini/`
- **LLM calls, prompts, agentic loop** → `ai-gateway/`
- **Tool catalog & handlers** → `mcp/`. Stateless; proxies to the backend.
- **Data persistence (mock)** → `mock-backend/`. Single in-memory source for both the mobile app and the MCP tools.
- **API contract** → `swagger.json` (authoritative). Mock conforms; mobile + MCP clients are typed against it.

## Typecheck everywhere

```bash
(cd armini && npx tsc --noEmit) && \
(cd ai-gateway && npm run typecheck) && \
(cd mcp && npm run typecheck) && \
(cd mock-backend && npm run typecheck)
```

## Refactor history

The four-project layout is the result of the refactor plan in `REFACTOR_PLAN.md`. Phases 1-7 are done. Phase 8 (graceful MCP outage) and Phase 9 (top-level dev story) are next.
