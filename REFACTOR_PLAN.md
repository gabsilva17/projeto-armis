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

- Renaming `mcp-server/` to `ai-gateway/` and carving out a true MCP server — tracked in user memory `project_architectural_split_deferred.md`.
- Wiring real auth (claim headers) into the backend client beyond a stub — depends on the broader auth work.
- Replacing the mock with the real .NET backend — that's just an env-var swap when the time comes.
