# Architecture Refactor Plan — Mock Backend Extraction

Cross-project refactor to separate three concerns currently entangled in `mcp-server/`:

1. **AI Gateway** — LLM provider abstraction, agentic loop, prompt building (stays where it is)
2. **MCP server (true)** — tool/resource exposure for an LLM-aware client (deferred — see below)
3. **Mock backend** — in-memory `timesheetStore`/`expenseStore` + fixtures (extracted in this plan)

The mobile app and the AI Gateway both consume the mock backend through a **typed backend client** ("proxy") that targets the real .NET Digital Hub API contract. When the real backend ships, we swap the env var pointing at the mock to point at the real host — no code change.

## One session per phase

Each phase below is committable independently and self-contained. Resume in a fresh session by reading this file + the relevant CLAUDE.md.

---

## Decisions locked in (session of 2026-05-20)

- **Real API contract source:** `swagger.json` at repo root (OpenAPI 3.0.1, base `/api/v1/...`, no `servers` block). API key in `x-api-key` header + identity in `x-corehub-claims-*` headers.
- **Timesheets are "imputations" on the wire.** Internal domain language stays `TimesheetEntry`/`useTimesheetsStore`. Backend client + adapter rename at the boundary.
- **Expenses are not in the swagger.** Mock exposes a speculative `/expense/my` family, every file tagged `// TODO(expenses-contract)`. Easy to grep and replace when the real contract lands.
- **No `/me` endpoint.** Mock mirrors the real contract — identity comes from claim headers, not a lookup. Mobile keeps current `USER_NAME` constant until auth is wired.
- **AI-Gateway↔true-MCP split is deferred.** See user memory `project_architectural_split_deferred.md` — folder will stay named `mcp-server/` until that work happens.

## Real-API quirks the mock must mirror

- `ImputationDto.id` is **int32** (mobile currently uses string `Date.now()`).
- All dates are ISO 8601 `date-time` (mobile mixes `YYYY-MM-DD` and `MM/DD/YYYY`).
- Write responses use `BooleanFriendlyResponseT` envelope: `{ tracking?, message?, content: boolean }`.
- Paged reads use `ImputationDtoPagedResponseT`: `{ currentPage, pageSize, totalPages, totalCount, hasPrevious, hasNext, entries, tokenPageNavigation? }`.
- Standard error responses: 401 `UnAuthorizedResponse`, 403 `ForbiddenResponse`, 404 `ProblemDetails`, 400 `BooleanFriendlyResponseT`, 500 `ExceptionResponse`.

---

## Phase 1 — Stand up `mock-backend/`

**Goal:** new sibling project that exposes the real .NET API contract as a local Express server. Nothing in `armini/` or `mcp-server/` changes yet.

**Endpoints to expose:**

- `GET /api/v1/imputation/my/{year}/{month}` → `ImputationDto[]`
- `GET /api/v1/imputation/my/{id}` → `ImputationDto`
- `POST /api/v1/imputation/my` (body `ImputationDto`) → `BooleanFriendlyResponseT`
- `PUT /api/v1/imputation/my/{id}` (body `ImputationDto`) → `BooleanFriendlyResponseT`
- `DELETE /api/v1/imputation/my/{id}` → `BooleanFriendlyResponseT`
- `GET /api/v1/project/my` → `ProjectDto[]`
- `GET /api/v1/project/my/{startDate}/{endDate}` → `ProjectDto[]`
- `GET /api/v1/task/my/{projectCode}` → `TaskDto[]`
- `GET /api/v1/holiday?year=...` → `HolidayDto[]`
- `GET /api/v1/vacation/my` → `VacationInfoDto[]`
- Speculative `*/expense/my` family — tagged `// TODO(expenses-contract)`

**Setup:**
- New folder `mock-backend/` (sibling of `mcp-server/` and `armini/`).
- Stack: Node.js + TypeScript + Express (mirror `mcp-server/`'s stack).
- Default port `3002`, override via `PORT` env var.
- Seed from a copy of `mcp-server/src/tools/fixtures/*.json` (don't reference across folders; this server owns its data).
- In-memory mutations per process (no persistence needed for dev).
- Accept but ignore `x-api-key` and `x-corehub-claims-*` headers (no enforcement).
- `npm run dev` (tsx watch), `npm run typecheck`, `npm run build`.
- README with curl examples for each endpoint.

**Acceptance:**
- `cd mock-backend && npm run dev` starts the server.
- `curl http://localhost:3002/api/v1/imputation/my/2026/05` returns a populated `ImputationDto[]`.
- `npm run typecheck` clean.
- `mcp-server/` and `armini/` still work exactly as before.

---

## Phase 2 — Build the backend client on the mobile side

**Goal:** typed proxy at `armini/src/services/backend/` that targets the real API contract. Points at the mock today via env var.

**Files:**
- `armini/src/services/backend/httpClient.ts` — fetch wrapper, base URL, header injection (`x-api-key` + `x-corehub-claims-*`), timeout, error mapping to the existing `ApiError`.
- `armini/src/services/backend/imputationsClient.ts` — `getMonth(year, month)`, `getById(id)`, `create(dto)`, `update(id, dto)`, `remove(id)`.
- `armini/src/services/backend/projectsClient.ts` — `listMine()`, `listMineInRange(start, end)`, `listTasks(projectCode)`.
- `armini/src/services/backend/expensesClient.ts` — speculative, tagged.
- `armini/src/constants/backend.constants.ts` — `BACKEND_CONFIG = { baseUrl: resolveBackendBaseUrl(), timeoutMs: 30_000 }`. Same `EXPO_PUBLIC_*` pattern as `MCP_CONFIG`.
- Adapters move/expand at `armini/src/services/adapters/`: ID int↔string, date format, envelope unwrapping.

**Acceptance:**
- `npx tsc --noEmit` clean.
- Clients are importable but nothing in the app calls them yet — Phase 3 wires them in.
- Unit-test-able shape (pure functions over fetch).

---

## Phase 3 — Switch the mobile app off MCP for data

**Goal:** mobile app reads/writes timesheets and expenses via the backend client. MCP is no longer in the data path.

**Files:**
- `armini/src/services/timesheets/timesheetsService.ts` — replace `mcpToolsCall('getTimesheets')` with backend client call. Drop the `FEATURES.BACKEND_CONNECTED` branch (it becomes meaningless).
- `armini/src/services/finances/expensesService.ts` — same treatment.
- `armini/src/stores/useTimesheetsStore.ts` — `addEntry/editEntry/deleteEntry` call the backend client instead of fire-and-forget `mcpToolsCall`. Surface failures.
- `armini/src/stores/useFinancesStore.ts` — same.
- `armini/src/constants/app.constants.ts` — delete `FEATURES.BACKEND_CONNECTED`.
- Update `armini/CLAUDE.md` § Camada de serviços and § Feature flags.

**Acceptance:**
- Kill `mcp-server/` and the app's timesheets + finances pages still work end-to-end.
- Creating/editing/deleting a timesheet entry in the UI persists in the mock-backend (verify with a `curl GET` after).
- `npx tsc --noEmit` clean.

---

## Phase 4 — Make the MCP server stateless

**Goal:** `mcp-server/` keeps its AI Gateway role but stops owning data. Tool handlers delegate to the same mock backend the mobile app uses.

**Files:**
- Delete `mcp-server/src/tools/timesheetStore.ts`, `expenseStore.ts`, `fixtures/` (the canonical copy now lives in `mock-backend/`).
- New `mcp-server/src/backend/` — server-side equivalent of the mobile backend client (small, focused: `fetch` + adapters).
- `mcp-server/src/tools/getTimesheets.ts` etc. — handlers call the new backend client.
- `mcp-server/.env` — add `BACKEND_URL` (default `http://localhost:3002`).
- Update `mcp-server/`'s own docs if any.

**Acceptance:**
- The AI Companion can still call `getTimesheets` / `createTimesheetEntry` / etc. and produces the same observable behavior.
- `mcp-server/` has zero in-memory state.
- `cd mcp-server && npm run typecheck` clean.

---

## Phase 5 — Boot-time AI offline toast

**Goal:** when the AI Gateway is unreachable on app boot, surface a non-blocking toast. Timesheets/expenses already work (Phase 3 made them independent).

**Files:**
- `armini/src/components/ui/Toast.tsx` — themed slide-in component, auto-dismiss ~4s, queue-aware.
- `armini/src/stores/useToastStore.ts` — Zustand store with `show(message, variant)`, `dismiss(id)`.
- `armini/app/_layout.tsx` — mount `<Toast />` once alongside `<AlertProvider>`. After fonts load, fire `mcpCall('tools/list')` with 3s timeout; on failure, push toast.
- `armini/src/i18n/locales/{en,pt}/common.json` — keys `toast.aiOffline.title`, `toast.aiOffline.body`.

**Acceptance:**
- With `mcp-server/` stopped, the app boots normally and shows a toast: *"AI Companion offline. Timesheets and expenses still work."*
- With `mcp-server/` running, no toast appears.
- Toast respects theme (light/dark) and Reanimated rules (no `.value` writes in render).

---

## Phase 6 — Cleanup & docs

**Goal:** final tidy. Architecture matches docs.

**Files:**
- `armini/CLAUDE.md` — new diagram, updated § MCP Server (rename mentally to AI Gateway, link to deferred-work memory), removed `BACKEND_CONNECTED` references.
- `mock-backend/README.md` — full endpoint table + dev commands.
- Top-level `README.md` (if/when added) — three-project overview.
- Run `npx tsc --noEmit` in all three projects.

**Acceptance:**
- A new contributor can read the three CLAUDE.md/README files and understand the boundaries.

---

## Out of scope for this plan

- Wiring real auth (claim headers) into the backend client beyond a stub — depends on the broader auth work.
- Replacing the mock with the real .NET backend — that's just an env-var swap when the time comes.

---

# Architecture Refactor Plan — AI Gateway ↔ MCP Split

Picks up where Phase 6 ended. The remaining structural debt: `mcp-server/` is doing two distinct jobs (LLM orchestration + MCP tool host) in one process. Result: any outage takes both down, the boot ping conflates "AI is down" with "tools are down", and the folder is misnamed.

Tracked in user memory `project_architectural_split_deferred.md` until Phase 7 lands, at which point that memory should be deleted.

## Decisions locked in (session of 2026-05-25)

- **Final shape:** three local processes — `armini/`, `ai-gateway/`, `mcp/` — plus `mock-backend/`. AI Gateway is the only consumer of MCP. Mobile speaks only to AI Gateway (chat) and mock-backend (data).
- **Naming:** `mcp-server/` → `ai-gateway/`. New sibling `mcp/` for the true MCP server. Renamed in the same phase as the carve-out to avoid an awkward intermediate state where `mcp-server/` no longer exposes MCP methods.
- **Mobile-facing JSON-RPC surface does not change.** Mobile keeps calling `chat/send`, `chat/bootstrap`, `chat/scan`. It never speaks to `mcp/` directly.
- **Tool-availability signal:** `ChatSendResult` / `BootstrapResult` / `ScanResult` gain `toolsAvailable: boolean`. Mobile drives the in-chat banner from that flag (plus a cheap `chat/health` probe for cold-state) — not from a separate MCP ping.
- **Degradation policy:** when MCP is unreachable, AI Gateway still calls the LLM but omits the tool catalog and prepends a soft system instruction telling the model to answer from general knowledge only and refuse data actions.

## Real-architecture quirks to preserve

- All LLM calls stay server-side. The mobile app never holds an LLM API key (`armini/CLAUDE.md` § Restrições importantes).
- `BACKEND_USERNAME` (used by `getEmployeeInfo` because swagger has no `/me`) follows the tools, so it moves to `mcp/`.
- Adapters (`imputationsAdapter`, `expensesAdapter`) belong with the tools — they translate DTOs↔domain at the MCP boundary. They move to `mcp/`.
- Provider-agnostic LLM swap (`LLM_PROVIDER=anthropic|openai`) stays exactly as is — just lives in `ai-gateway/`.

---

## Phase 7 — Carve out `mcp/` + rename `mcp-server/` → `ai-gateway/` ✅ Done (session of 2026-05-25)

**Goal:** clean folder names and a true MCP server in its own process. AI Gateway becomes an MCP client over HTTP. No user-visible behavior change for the happy path.

**Filesystem moves:**
- `mcp-server/` → `ai-gateway/` (rename whole folder). Update `package.json` "name", `tsconfig`, scripts in monorepo docs.
- New sibling `mcp/` — Node + TypeScript + Express + JSON-RPC, same stack.
- Move from `ai-gateway/src/` → `mcp/src/`:
  - `tools/*` (10 handlers + `registry.ts` + `types.ts`)
  - `backend/*` (httpClient, clients, adapters, `projectTaskResolver`, types)
  - whatever utils those imports drag along
- Keep in `ai-gateway/src/`:
  - `orchestrator/*`, `providers/*`, `transport/*`, `config/*`, `utils/*`

**New module — `ai-gateway/src/mcpClient/`:**
- Thin JSON-RPC-over-fetch client. Exposes `listTools()` and `callTool(name, args)`. Replaces the in-process `ToolRegistry` reference inside `ChatOrchestrator`.
- Same shape as `mock-backend`'s clients on the mobile side — small, focused, easy to swap.

**Endpoints after Phase 7:**
- `mcp/` — POST `/mcp` on port 3003 (env `MCP_PORT`). Methods: `tools/list`, `tools/call`. Accepts but ignores `x-api-key` + `x-corehub-claims-*`.
- `ai-gateway/` — POST `/mcp` on port 3001 (kept). Methods: `chat/send`, `chat/bootstrap`, `chat/scan`. **Removes** `tools/list` and `tools/call` — those live on `mcp/` now.

**Env vars:**
- `ai-gateway/.env`: keep `LLM_PROVIDER` + provider keys. Add `MCP_URL=http://localhost:3003`. Drop `BACKEND_URL` (it moves to `mcp/`).
- `mcp/.env`: `BACKEND_URL=http://localhost:3002`, `BACKEND_USERNAME`, `MCP_PORT=3003`.
- `armini/`: `EXPO_PUBLIC_MCP_URL` → `EXPO_PUBLIC_AI_GATEWAY_URL`. Rename `MCP_CONFIG`/`resolveMcpBaseUrl` in `src/constants/llm.constants.ts` to `AI_GATEWAY_CONFIG`/`resolveAiGatewayBaseUrl`. Update `src/services/api/mcp.ts` accordingly (file itself can stay named `mcp.ts` since the JSON-RPC envelope is still MCP-shaped, but rename to `aiGateway.ts` is preferable for clarity).

**Wiring:**
- `ChatOrchestrator` constructor takes an `McpClient` (not a `ToolRegistry`). Tool catalog is fetched on each `chat/send` for now (no caching — optimize later if needed).
- The agentic loop calls `mcpClient.callTool(name, args)` instead of `toolRegistry.call(name, args)`. Same return shape.
- If `mcpClient.listTools()` throws in this phase, `chat/send` fails with a normal JSON-RPC error. Graceful fallback is **Phase 8**.

**Docs:**
- New `mcp/README.md` — endpoint table, dev commands, `BACKEND_URL` note.
- `ai-gateway/README.md` (renamed from `mcp-server/`) — chat methods only, `MCP_URL` note.
- `armini/CLAUDE.md` § MCP Server → § AI Gateway. Diagram updated. References to `mcp-server/` swapped throughout.
- Update top-level `README.md` (added in Phase 6) — four-process diagram.

**Acceptance:**
- `cd mcp && npm run dev` starts on 3003. `curl -X POST http://localhost:3003/mcp -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'` returns the 10-tool catalog.
- `cd ai-gateway && npm run dev` starts on 3001. Mobile chat works end-to-end (mobile → AI Gateway → MCP → mock-backend).
- POSTing `tools/list` to AI Gateway returns method-not-found (only `chat/*` lives there).
- `npx tsc --noEmit` clean in `ai-gateway/`, `mcp/`, `mock-backend/`, and `armini/`.
- Delete user memory `project_architectural_split_deferred.md` — it's done.

---

## Phase 8 — Graceful MCP outage in AI Gateway

**Goal:** when MCP is unreachable from AI Gateway, chat still answers without tools. Mobile UI explains what's degraded.

**AI Gateway:**
- `mcpClient.listTools()` wraps a 2 s timeout and returns `null` on failure (don't throw).
- `ChatOrchestrator.handleChat()`:
  - Fetches the tool catalog. If `null`, run the agentic loop with `tools: undefined` and prepend a soft system instruction:
    > *"The tool layer is currently unavailable. Answer from general knowledge only. Do not promise to read, modify, or persist any data. If the user asks for an action, tell them you can't do it right now and ask them to try again later."*
  - All result shapes gain a new field: `toolsAvailable: boolean`. False when the catalog couldn't be fetched.
- `chat/bootstrap` and `chat/scan` get the same flag for consistency.
- New method `chat/health` — returns `{ aiGateway: 'ok', mcp: 'ok' | 'offline' }`. Cheap (no LLM call). Pings MCP with a short timeout.

**Mobile:**
- `useAiAvailabilityStore` is rebuilt around `chat/health`:
  - Fields: `aiGateway: 'unknown' | 'online' | 'offline'`, `mcp: 'unknown' | 'online' | 'offline'`.
  - `check()` calls `chat/health`. If the AI Gateway itself is unreachable → `aiGateway: 'offline'`, `mcp: 'unknown'`. Else map the response.
  - Poll cadence unchanged (boot + 15 s).
- Chat banner copy splits into two states (driven by store fields):
  - `aiGateway === 'offline'` → *"AI Companion offline — chat is unavailable. Timesheets and expenses still work."* (same as today's offline message — rename the i18n key but keep the wording).
  - `aiGateway === 'online' && mcp === 'offline'` → *"Limited mode — chat works but can't read or modify your data."*
- Boot toast follows the same logic — only one toast per transition into a degraded state.

**i18n:**
- Rename `chat.offline.*` → `chat.aiGatewayOffline.*` (or keep the existing key and add `chat.mcpOffline.*`). Add `toast.mcpOffline.*` similarly.

**Acceptance:**
- Kill `mcp/`, leave `ai-gateway/` and `mock-backend/` running. Open the chat → "Limited mode" banner. Send a message → LLM responds in plain text, no tool calls, refuses any action-y request.
- Restart `mcp/`. Within one health-poll tick (≤15 s), banner clears. Subsequent messages can run tools again.
- Kill `ai-gateway/`. Open the chat → "AI Companion offline" banner. Sending a message produces the existing error path.
- `npx tsc --noEmit` clean in all four projects.

---

## Phase 9 — Cleanup, docs, dev story

**Goal:** a new contributor can clone the repo and get all four processes running without spelunking through commits.

- Top-level `package.json` with a `concurrently`-based `dev` script that starts `mock-backend`, `mcp`, and `ai-gateway` in parallel. Document the mobile (`armini/`) start separately because Metro wants its own terminal. (If `concurrently` on Windows turns out flaky, document the four-terminal flow instead — don't fight the platform.)
- Top-level `README.md` — final four-box diagram, port table (3001 AI Gateway, 3002 mock-backend, 3003 MCP, Metro 8081), env-var map, "what owns what" summary.
- `mcp/README.md` and `ai-gateway/README.md` finalized with full endpoint tables and example curls.
- `armini/CLAUDE.md` — full architecture redraw + updated diagram + drop the old "MCP Server" section in favor of "AI Gateway" + "MCP tool host" sections.
- Run `npx tsc --noEmit` in all four projects.

**Acceptance:**
- One command at the repo root brings up the three Node services; one command in `armini/` starts Metro. Chat works, data works, killing any single process degrades exactly as Phase 8 advertises.
- Diagram in `README.md` matches the running process layout.

---

## Out of scope for the split refactor

- True MCP-protocol compliance (resources, prompts, JSON-RPC error code conventions beyond what the current transport does). Today's `mcp/` is "MCP-shaped" — fine for the in-house client, formalize later if a third-party MCP client ever connects.
- Caching the tool catalog in AI Gateway. Phase 7/8 fetches it on every chat call. Profile before optimizing.
- Splitting `chat/scan` (image scan) into its own surface. It stays on AI Gateway because it's still an LLM call.
- Auth on `mcp/`. Still accepts but ignores `x-api-key` / `x-corehub-claims-*` headers — same stub posture as `mock-backend`.
