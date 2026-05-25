# ARMINI Mock Backend

Mock of the Digital Hub .NET API. Mirrors the contract in `../swagger.json` so the mobile app and MCP server can hit a faithful stand-in until the real backend is wired up. The swap mock → real is a single env-var change on the consumer side (`EXPO_PUBLIC_BACKEND_URL` for the mobile app, `BACKEND_URL` for the MCP server — wired in later phases of `../REFACTOR_PLAN.md`).

## Run

```bash
npm install
npm run dev          # tsx watch, port 3002
npm run typecheck    # tsc --noEmit
npm run build        # tsc → dist/
npm start            # node dist/index.js
```

Override the port with `PORT=3099 npm run dev`.

## Endpoint surface

All routes are prefixed `/api/v1/...`, matching the real swagger. The mock accepts (and ignores) `x-api-key` and `x-corehub-claims-*` headers.

| Method | Path | Returns | Source |
|---|---|---|---|
| GET | `/health` | `{status, service}` | dev only — not in real contract |
| GET | `/api/v1/imputation/my/{year}/{month}` | `ImputationDto[]` | real |
| GET | `/api/v1/imputation/my/{id}` | `ImputationDto` | real |
| POST | `/api/v1/imputation/my` | `BooleanFriendlyResponseT` | real |
| PUT | `/api/v1/imputation/my/{id}` | `BooleanFriendlyResponseT` | real |
| DELETE | `/api/v1/imputation/my/{id}` | `BooleanFriendlyResponseT` | real |
| GET | `/api/v1/project/my` | `ProjectDto[]` | real |
| GET | `/api/v1/project/my/{startDate}/{endDate}` | `ProjectDto[]` | real |
| GET | `/api/v1/task/my/{projectCode}` | `TaskDto[]` | real |
| GET | `/api/v1/holiday?year={int}` | `HolidayDto[]` | real |
| GET | `/api/v1/vacation/my` | `VacationInfoDto[]` | real |
| GET | `/api/v1/expense/my` | `ExpenseDto[]` | **speculative** |
| GET | `/api/v1/expense/my/{id}` | `ExpenseDto` | **speculative** |
| POST | `/api/v1/expense/my` | `BooleanFriendlyResponseT & {id}` | **speculative** |
| PUT | `/api/v1/expense/my/{id}` | `BooleanFriendlyResponseT` | **speculative** |
| DELETE | `/api/v1/expense/my/{id}` | `BooleanFriendlyResponseT` | **speculative** |

Speculative routes are tagged `// TODO(expenses-contract)` in source — grep that string when the real expense API lands.

## Quick curl reference

```bash
# List my imputations for May 2026
curl http://localhost:3002/api/v1/imputation/my/2026/5

# Fetch one
curl http://localhost:3002/api/v1/imputation/my/13

# Create
curl -X POST -H 'Content-Type: application/json' \
  -d '{"id":0,"username":"gabriel","year":2026,"month":5,"nHours":8,"impStatus":0,"project":{"id":"AP"},"task":{"id":1}}' \
  http://localhost:3002/api/v1/imputation/my

# Delete
curl -X DELETE http://localhost:3002/api/v1/imputation/my/1

# Projects + tasks
curl http://localhost:3002/api/v1/project/my
curl http://localhost:3002/api/v1/task/my/AP

# Auxiliary
curl 'http://localhost:3002/api/v1/holiday?year=2026'
curl http://localhost:3002/api/v1/vacation/my
```

## Layout

```
src/
  index.ts              Express boot
  types/
    api.ts              All DTOs and envelopes from swagger
    expense.ts          Speculative expense shape
  data/
    fixtures/           Seed JSON (imputations, projects, tasks, holidays, vacation, expenses)
    imputationsStore.ts In-memory CRUD; joins project/task on read
    projectsStore.ts    Projects + tasks
    holidaysStore.ts
    vacationStore.ts
    expensesStore.ts    Speculative
  routes/               One file per resource — mounted in index.ts
  utils/
    claimsHeaders.ts    Reads x-api-key + x-corehub-claims-* into req
    envelopes.ts        ok() / fail() / problem() helpers
    logger.ts
```

## Notes

- **No persistence.** Mutations live in-process. Restart wipes back to the seed.
- **`impStatus` is an inferred enum.** Swagger declares the field as `int32` but no enum — see `IMP_STATUS` in `src/types/api.ts`. Confirm with backend team when reachable.
- **No auth enforcement.** Headers are read but not validated. The real backend requires `x-api-key`.
- **One process, one user.** No multi-tenant logic. `username` defaults to `gabriel` everywhere in the seed.
