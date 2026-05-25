# CLAUDE.md

## Manutenção deste ficheiro

**Este ficheiro é vivo.** Sempre que numa sessão ocorrer qualquer uma das situações abaixo, atualiza este CLAUDE.md no mesmo commit/momento — sem esperar que o utilizador peça:

- Nova dependência nativa ou biblioteca significativa adicionada
- Novo padrão de componente, hook ou store estabelecido
- Decisão arquitetural tomada (estrutura de pastas, naming, abordagem de estado, etc.)
- Regra de código acordada ou corrigida
- Feature flag adicionada ou removida
- Restrição ou gotcha descoberto (bugs conhecidos, limitações de plataforma, etc.)
- Estrutura de pastas alterada

A secção relevante deve ser editada inline. Se não existir secção adequada, cria uma nova.

---

## React Native Reanimated — Animation Rules

- **Never write to `.value` during component render.** This causes frame gaps (content jumps) and Reanimated strict-mode warnings.
- **Never use `useEffect`/`useLayoutEffect` to snap-then-animate shared values.** Even with `withSequence` or `useLayoutEffect`, there is always at least 1 frame where the UI thread hasn't processed the JS-side update, causing a visible jump.
- **Use Reanimated `entering`/`exiting` layout animations for page transitions.** These run entirely on the UI thread from the very first frame — no gap, no jump. Use a `key` prop to trigger remount and the `entering` callback to define `initialValues` and `animations`.
- Gesture handlers and `useAnimatedScrollHandler` callbacks are fine for `.value` writes — they run on the UI thread as worklets.

## Padrão de animações — valores canónicos

Todos os valores canónicos (durations, easing, springs, press feedback) estão em `src/constants/animation.constants.ts` — single source of truth. **Nunca usar `.springify()` sem parâmetros** — os defaults do Reanimated são demasiado elásticos.

Princípios:
- Entradas: **180–200 ms**, `EASE_OUT` / Saídas: **140–160 ms**, `EASE_IN` (mais snappy)
- Springs quase criticamente amortecidos (sem bounce visível)
- Press feedback com `withTiming`, nunca `withSpring`

---

# Digital Hub Mobile App

## Projeto
Port mobile do Digital Hub da ARMIS Group em React Native.
Estágio curricular LEI-ISEP, fevereiro a julho 2026.

Use cases principais:
- Gestão de timesheets (registo, edição, consulta de horas)
- Submissão de faturas de despesas (incluindo via fotografia com extração automática de dados)
- AI Companion — chat contextual via AI Gateway próprio (`mcp-server/`, ver § AI Gateway), provider-agnostic (Anthropic/OpenAI)

## Arquitetura — três processos locais

```
┌──────────────┐   chat (LLM)        ┌──────────────────────────┐
│              │ ───────────────────▶│   AI Gateway             │
│  armini/     │                     │   (mcp-server/, :3001)   │
│  React       │                     │   JSON-RPC /mcp          │
│  Native      │                     │   provider-agnostic LLM  │
│  (Metro)     │                     │   + 10 stateless tools   │
│              │                     └────────────┬─────────────┘
│              │                                  │ HTTP /api/v1
│              │   data (CRUD)                    ▼
│              │ ───────────────────▶┌──────────────────────────┐
└──────────────┘                     │   mock-backend (:3002)   │
                                     │   In-memory Express      │
                                     │   mirror de swagger.json │
                                     └──────────────────────────┘
```

- Mobile lê/escreve dados via **backend client** (`src/services/backend/`) que aponta para `mock-backend/`. Swap mock → .NET real = mudar `EXPO_PUBLIC_BACKEND_URL`.
- Mobile fala com o **AI Gateway** apenas para chat/scan/bootstrap. O Gateway tem 10 tools stateless que, internamente, chamam o mesmo mock-backend.
- O folder `mcp-server/` chama-se assim por razões históricas — funcionalmente é um AI Gateway. O carve-out de um MCP server verdadeiro está deferido (ver memória [[architectural-split-deferred]] e `REFACTOR_PLAN.md` § Phase 7).

## Stack
- React Native + TypeScript (strict mode)
- **Expo Router** (file-based routing em `/app`) — não React Navigation
- Expo SDK, New Architecture habilitada, React Compiler habilitado
- Zustand para estado global
- React Native Reanimated + Gesture Handler para animações
- Phosphor Icons (`phosphor-react-native`) com `weight="fill"`
- `@react-native-community/datetimepicker` para seleção nativa de data nos formulários
- **i18next** + `react-i18next` + `expo-localization` para internacionalização (EN/PT)
- API backend (dados): REST .NET Core do Digital Hub (em dev, `mock-backend/` espelha o contrato de `swagger.json`)
- AI Gateway (`mcp-server/`): Node.js + TypeScript + Express, provider-agnostic (Anthropic/OpenAI), JSON-RPC 2.0 — todas as chamadas LLM passam pelo Gateway

## Estrutura do projeto
```
app/                    ← Expo Router routes (file-based)
  index.tsx             ← Redireciona para /(main)/home
  _layout.tsx           ← Root layout (fonts, error boundary)
  (main)/               ← Layout principal (TopBar + BottomNavBar + Slot)
    home/ finances/ timesheets/

src/
  components/
    chat/               ← Bubble, input, mensagens do chat
    finances/           ← ManualInvoiceEntry (modal full-screen)
    home/               ← QuickActions
    navigation/         ← TopBar, BottomNavBar, ProfileSidebar
    settings/           ← NavBarEditor
    timesheets/         ← CalendarGrid, DayCell, EntryFormModal, WeekStrip
    ui/                 ← Componentes reutilizáveis (Button, Card, TextField, SelectField, DateField, ActionListRow, etc.)
  contexts/             ← RefreshContext (remount via refreshKey)
  hooks/                ← Animações, keyboard, responsive, domínio (timesheets, chat)
  services/
    adapters/           ← Adaptadores API->domínio por feature
    api/mcp.ts          ← MCP client (mcpCall + wrappers tipados)
    chat/ timesheets/ finances/
  i18n/                 ← i18next setup + locales/{en,pt}/
  stores/               ← Zustand stores (ver tabela abaixo)
  theme/                ← colors, typography, spacing, shadows
  types/                ← DTOs e tipos por domínio
  constants/            ← Single source of truth para config transversal (animações, nav, LLM, UI, etc.)
```

## Estado global (Zustand)
Cada store é um ficheiro em `src/stores/`, hook-based, sem Redux/Context pesado.

| Store | Estado | Persistência |
|-------|--------|-------------|
| `useChatStore` | `messages[]`, `isLoading`, `error` | AsyncStorage (só mensagens) |
| `useFinancesStore` | `photoUri`, `photoBase64`, `status`, `invoiceData` | Não |
| `useTimesheetsStore` | `allEntries[]`, `isLoading`, `hasLoaded` | Não |
| `useSidebarStore` | `isOpen` | Não |
| `useQuickActionsStore` | `actions[]` (QuickAction) | AsyncStorage |
| `useLanguageStore` | `language` ('en' \| 'pt') | AsyncStorage |
| `useNavBarStore` | `middleTabs[]` (NavTabId) | AsyncStorage |
| `useToastStore` | `queue[]` (ToastItem) | Não |
| `useAiAvailabilityStore` | `isOnline`, `lastCheckedAt`, `isChecking` | Não |

`useTimesheetsStore` expõe `getMonthData(year, month)` que deriva `MonthSummary` do estado.
`useNavBarStore` gere quais tabs opcionais aparecem na bottom bar e a sua ordem. Home e More são fixos (primeiro e último). Máximo de 5 tabs no total.
`useToastStore` enfileira notificações não-bloqueantes. UI consome via `<Toast />` (em `src/components/ui/Toast.tsx`) montado uma vez em `app/_layout.tsx`; auto-dismiss a ~4s e a queue mostra uma mensagem de cada vez. Slide-in via Reanimated `entering`/`exiting` (`FadeInUp`/`FadeOutDown`), posicionado no fundo do ecrã para não interferir com a TopBar nem com o chat modal.
`useAiAvailabilityStore` faz ping ao AI Gateway (`tools/list`, timeout 3s) no boot e a cada 15s. `_layout.tsx` subscreve transições para `false` e dispara o toast offline. `ChatBubbleContainer` exibe um banner sticky enquanto `isOnline === false`, e refaz `check()` ao abrir o chat para mostrar o estado fresco.

## Internacionalização (i18n)

Toda a UI suporta EN e PT via `i18next` + `react-i18next`. Traduções em `src/i18n/locales/{en,pt}/`. `useLanguageStore` persiste a preferência (default = idioma do dispositivo).

- Componentes: `useTranslation('namespace')` → `t('key')`, cross-namespace com `t('common:save')`
- Fora de componentes: `import i18n from '@/src/i18n'` → `i18n.t('ns:key')`
- **Nunca hardcodar texto de UI** — todas as strings visíveis ao utilizador nos JSON de locale
- Prompts de LLM **NÃO são traduzidos** — ficam em inglês
- Datas usam `Intl.DateTimeFormat` com `i18n.language` como locale
- Novo idioma: criar pasta `src/i18n/locales/{code}/`, traduzir JSONs, registar em `index.ts` + `useLanguageStore`

## Camada de serviços
Todas as chamadas à API ficam em `src/services/`, nunca na UI nem nos stores.

- **Adapters** (`services/adapters/`): convertem payloads externos em modelos internos. Contratos externos tipados e normalizados no adapter. Quando o backend mudar, ajustar primeiro o adapter.
- **Hierarquia de imports**: UI/stores → services de domínio → backend client/adapters. UI nunca importa o backend client nem os adapters diretamente.
- **Backend client** (`services/backend/`): cliente tipado para a API .NET (mockada em dev pelo `mock-backend/`). Stores chamam services de domínio, que orquestram o client + adapters. Trocar mock → real backend = mudar `EXPO_PUBLIC_BACKEND_URL`.
- Services de domínio:
  - `chatService` / `expenseScanService` — via MCP (LLM)
  - `timesheetsService` — via `imputationsClient` + `projectsClient` (backend)
  - `expensesService` — via `expensesClient` (backend, contrato especulativo — ver `TODO(expenses-contract)`)
  - `projectsService` — via `projectsClient`, expõe `fetchProjects()` e `fetchTasksForProject(code)` para formulários que precisam de dropdowns de projetos/tarefas
- Stores `useTimesheetsStore` e `useFinancesStore` fazem optimistic update + rollback. Em falha, escrevem em `error` (não throw) para o caller subscrever.

## Sistema de tema
Tokens centralizados em `src/theme/` (`Colors`, `Spacing`, `Typography`, `Shadows`). Temas definidos em `colors.ts` (`themes` + `THEME_CATALOG`); para adicionar novo tema, atualizar `colors.ts`.

## Padrões de componentes
- Props: `ComponentNameProps` interface, handle: `ComponentNameHandle`
- Variantes com union types, estilos com `StyleSheet.create()` + arrays condicionais
- Icons: `phosphor-react-native` (preferencial), acessibilidade obrigatória em interativos
- **Componentes UI reutilizáveis** (em `src/components/ui/`): `SelectField`, `TextField`, `DateField` para formulários; `ActionListRow` para listas lineares; `Button`, `Card`, etc.
- Modais slide-up: usar hook `useSlideUpModalAnimation` (não duplicar setup de animação)

## Finances — padrão atual
- A página de finances usa fluxo de **submissão manual via modal full-screen** (slide-up), alinhado visualmente com o `EntryFormModal` de timesheets.
- O modal inclui campos de despesa (date, projects, expense type, quantity, unit value, currency, observations, representation).
- O campo de data deve usar seletor **nativo** (`@react-native-community/datetimepicker`) em vez de input textual livre.
- Para novos desenvolvimentos em finances, manter este padrão modal e evitar introduzir formulários longos inline na página principal.

## Navegação
- Rotas definidas como constantes em `src/constants/app.constants.ts` (`ROUTES.HOME`, etc.)
- Bottom nav com spring animation — pill highlight segue rota ativa
- Transições de página: Reanimated `entering` animations (UI thread, sem saltos)
- Back button Android gerido em `app/(main)/_layout.tsx`

## Feature flags
Não há flags hoje. O swap mock → real backend é feito via env var `EXPO_PUBLIC_BACKEND_URL` (ver `src/constants/backend.constants.ts`), sem alterar código.

## AI Gateway (`mcp-server/`)

Orquestrador LLM provider-agnostic com 10 tools stateless que delegam no `mock-backend/`. O folder ainda se chama `mcp-server/` por inércia — funcionalmente é um AI Gateway. A separação para um MCP server isolado está prevista (ver memória [[architectural-split-deferred]] e `REFACTOR_PLAN.md` § Phases 7-9).

### Arquitetura
```
mcp-server/src/
  config/         ← env validation (zod) + constants
  providers/      ← LLMProvider interface + AnthropicProvider + OpenAIProvider + factory
  orchestrator/   ← chatOrchestrator (handleChat/Bootstrap/Scan) + promptBuilder + responseParser
  tools/          ← ToolRegistry + 10 tool handlers (stateless, delegam ao backend client)
  backend/        ← fetch wrapper + clients (imputations/projects/expenses) + adapters DTO↔domínio
  transport/      ← Express router com JSON-RPC 2.0 (POST /mcp)
  utils/          ← logger + error helpers
```

### Métodos JSON-RPC (POST `/mcp`, porta 3001)
| Método | Input | Output |
|--------|-------|--------|
| `chat/send` | `{ messages[], language, userName, imageData? }` | `{ text, suggestions[], actions[] }` |
| `chat/bootstrap` | `{ language, userName }` | `{ messageText, suggestions[] }` |
| `chat/scan` | `{ base64, mediaType }` | `{ expenseData }` |
| `tools/list` | `{}` | `{ tools[] }` |
| `tools/call` | `{ name, arguments }` | `{ content[] }` |

### Provider & server swap
- `LLM_PROVIDER=anthropic|openai` no `.env` do server — client é agnostic
- O contrato são os 3 métodos `chat/*` via JSON-RPC 2.0 em `/mcp`. Trocar server = mudar `EXPO_PUBLIC_MCP_URL`

### Tools (stateless, delegam ao backend)
Timesheets: `getTimesheets`, `createTimesheetEntry`, `editTimesheetEntry`, `deleteTimesheetEntry`.
Expenses: `getExpenses`, `submitExpense`, `editExpense`, `deleteExpense`.
Outros: `getProjects`, `getEmployeeInfo`.

Os handlers não têm estado próprio — chamam `mcp-server/src/backend/*Client` (mesmo contrato `/api/v1/...` que o mobile usa) e traduzem DTOs↔shape interno via adapters. `BACKEND_URL` (default `http://localhost:3002`) controla qual backend é alvo — swap mock → real backend é só env-var. `getEmployeeInfo` é derivado de `BACKEND_USERNAME` porque o swagger não expõe `/me` (identidade vem de claim headers).

### Contexto do ARMINI — via tools, NUNCA via system prompt
O ARMINI obtém contexto **exclusivamente via tools** no loop agentic do server. **Nunca injetar dados de stores/contexto do cliente no system prompt nem como parâmetros extra do `chat/send`.** O client envia apenas `messages`, `language`, `userName` e opcionalmente `imageData`.

### Comandos do server
- `cd mcp-server && npm run dev` — dev mode com hot reload
- `cd mcp-server && npm run typecheck` — verificação de tipos
- `cd mcp-server && npm run build` — compilar para dist/

## Regras de código
- **Nunca fazer assumptions.** Se houver dúvida, perguntar ao utilizador antes de avançar
- Componentes funcionais com hooks, sem classes. ES modules, sem CommonJS
- Nomes de ficheiros e variáveis em inglês, comentários em português
- Typecheck obrigatório antes de terminar qualquer sessão (`npx tsc --noEmit`)
- **Nunca hardcodar** cores, espaçamentos, tipografia, textos de UI, nem config transversal — usar `src/theme/`, `src/i18n/`, `src/constants/`
- DRY: verificar `src/components/ui/` antes de criar componente novo; extrair se usado em >1 sítio
- Sem duplicação de lógica; remover código morto sem referências

## Checklist rápido por PR
- Se houver integração com API/LLM: mapping/parsing ficou no adapter do domínio (e não inline no service/UI).
- Se houver formulário novo/alterado: reutilizar `SelectField`, `TextField` e `DateField` quando aplicável.
- Se houver modal full-screen: usar `useSlideUpModalAnimation` em vez de duplicar setup de animação.
- Se houver fluxo async de chat: manter `Promise<boolean>`, preservar draft em erro e mostrar erro dismissível.
- No fim da alteração: correr `npx tsc --noEmit`.

## Chat — padrão async/debug
- Fluxos de envio no chat devem devolver sucesso/falha (`Promise<boolean>`) para a UI decidir quando limpar draft/input.
- O input de chat só deve limpar texto/imagem após sucesso da chamada; em erro deve preservar draft para retry manual.
- Erros de chat devem ser visíveis no container com ação explícita de dismiss (evitar falhas silenciosas).

## Gotchas conhecidos
<!-- Registar aqui bugs conhecidos, limitações de plataforma, quirks de dependências, e armadilhas encontradas durante desenvolvimento. Formato: bullet com contexto suficiente para evitar que alguém caia no mesmo problema. -->


## ⚠️ Restrições importantes
- Todas as chamadas LLM passam pelo AI Gateway — o cliente nunca contacta APIs de LLM diretamente
- Não adicionar dependências nativas sem verificar compatibilidade com a versão atual do RN/Expo SDK
- **Instalar pacotes Expo sempre com `npx expo install <pacote>`**, nunca com `npm install` — o `expo install` resolve automaticamente a versão compatível com o SDK do projeto e evita desalinhamentos de versão

## Comandos
- `npm start` — Metro bundler
- `npm run android` / `npm run ios` — build e run
- `npx tsc --noEmit` — verificação de tipos
- `cd ../mock-backend && npm run dev` — mock backend (porta 3002)
- `cd ../mcp-server && npm run dev` — AI Gateway (porta 3001)
- `cd ../mcp-server && npm run typecheck` — typecheck do Gateway
