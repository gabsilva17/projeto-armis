# ARMINI

Mobile port of the ARMIS Group Digital Hub. Built as a curricular internship project (LEI-ISEP, Feb–Jul 2026). Monorepo of three sibling projects plus the canonical API contract.

## Projects

| Folder | Role | Port | Stack |
|---|---|---|---|
| `armini/` | React Native mobile app (Expo Router) | Metro 8081 | RN + TS strict + Zustand + Reanimated |
| `mcp-server/` | **AI Gateway** — LLM orchestrator + 10 stateless tools | 3001 | Node + TS + Express + JSON-RPC 2.0 |
| `mock-backend/` | In-memory mirror of the .NET Digital Hub API | 3002 | Node + TS + Express |
| `swagger.json` | Canonical contract for the real .NET API | – | OpenAPI 3.0.1 |

> The folder named `mcp-server/` is functionally an AI Gateway, not a true MCP server. The carve-out into a separate MCP process is planned — see `REFACTOR_PLAN.md` § Phases 7-9.

## Architecture

```
┌──────────────┐   chat (LLM)        ┌──────────────────────────┐
│              │ ───────────────────▶│   AI Gateway             │
│  armini/     │                     │   (mcp-server/, :3001)   │
│  React       │                     │   POST /mcp              │
│  Native      │                     │   provider-agnostic LLM  │
│  (Metro)     │                     │   + 10 stateless tools   │
│              │                     └────────────┬─────────────┘
│              │                                  │ HTTP /api/v1
│              │   data (CRUD)                    ▼
│              │ ───────────────────▶┌──────────────────────────┐
└──────────────┘                     │   mock-backend (:3002)   │
                                     │   In-memory Express      │
                                     │   mirror of swagger.json │
                                     └──────────────────────────┘
```

- Mobile reads/writes data through a typed **backend client** (`armini/src/services/backend/`) that targets the swagger contract.
- Mobile talks to the AI Gateway only for chat (`chat/send`, `chat/bootstrap`, `chat/scan`).
- The Gateway's 10 tools are stateless — they call the same backend the mobile app uses.
- Swap mock → real .NET = change `EXPO_PUBLIC_BACKEND_URL` (mobile) and `BACKEND_URL` (Gateway). No code change.

## Quickstart

Three terminals, in this order:

```bash
# 1. Mock backend (port 3002)
cd mock-backend
npm install
npm run dev

# 2. AI Gateway (port 3001)
cd mcp-server
npm install
# create .env with at minimum:
#   LLM_PROVIDER=anthropic
#   ANTHROPIC_API_KEY=sk-...
npm run dev

# 3. Mobile (Metro on 8081)
cd armini
npm install
npm start
```

Each project has its own README/CLAUDE.md with deeper detail.

## Env-var map

| Var | Where | Default | Purpose |
|---|---|---|---|
| `EXPO_PUBLIC_BACKEND_URL` | `armini/` | derived from Metro hostUri | Mobile → backend |
| `EXPO_PUBLIC_BACKEND_API_KEY` | `armini/` | `dev-mock-key` | Sent as `x-api-key` |
| `EXPO_PUBLIC_MCP_URL` | `armini/` | derived from Metro hostUri | Mobile → AI Gateway |
| `LLM_PROVIDER` | `mcp-server/` | `anthropic` | `anthropic` \| `openai` |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` | `mcp-server/` | – | Provider key |
| `PORT` | `mcp-server/` | `3001` | Gateway listener |
| `BACKEND_URL` | `mcp-server/` | `http://localhost:3002` | Gateway → backend |
| `BACKEND_USERNAME` | `mcp-server/` | `gabriel` | Identity stub (no `/me` in swagger) |
| `PORT` | `mock-backend/` | `3002` | Mock listener |

## What owns what

- **Domain logic & UI** → `armini/`
- **LLM calls, prompts, agentic loop, tool catalog** → `mcp-server/` (AI Gateway)
- **Data persistence (mock)** → `mock-backend/`. Single in-memory source for both the mobile app and the Gateway's tools.
- **API contract** → `swagger.json` (authoritative). Mock conforms; mobile + Gateway clients are typed against it.

## Typecheck everywhere

```bash
(cd armini && npx tsc --noEmit) && \
(cd mcp-server && npm run typecheck) && \
(cd mock-backend && npm run typecheck)
```

## Refactor history

The three-project layout is the result of the refactor plan in `REFACTOR_PLAN.md`. Phases 1-6 are done; Phases 7-9 (carve out a true MCP server and rename `mcp-server/` → `ai-gateway/`) are scoped but deferred.
