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
- AI Companion — chat contextual via MCP server próprio (`mcp-server/`), provider-agnostic (Anthropic/OpenAI)

## Stack
- React Native + TypeScript (strict mode)
- **Expo Router** (file-based routing em `/app`) — não React Navigation
- Expo SDK, New Architecture habilitada, React Compiler habilitado
- Zustand para estado global
- React Native Reanimated + Gesture Handler para animações
- Phosphor Icons (`phosphor-react-native`) com `weight="fill"`
- `@react-native-community/datetimepicker` para seleção nativa de data nos formulários
- **i18next** + `react-i18next` + `expo-localization` para internacionalização (EN/PT)
- API backend: REST .NET Core já existente do Digital Hub
- MCP Server (`mcp-server/`): Node.js + TypeScript + Express, provider-agnostic (Anthropic/OpenAI), JSON-RPC 2.0 — todas as chamadas LLM passam pelo MCP server

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

`useTimesheetsStore` expõe `getMonthData(year, month)` que deriva `MonthSummary` do estado.
`useNavBarStore` gere quais tabs opcionais aparecem na bottom bar e a sua ordem. Home e More são fixos (primeiro e último). Máximo de 5 tabs no total.

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
- **Hierarquia de imports**: UI/stores → services de domínio → adapters/api. UI nunca importa adapters nem api diretamente.
- Services de domínio: `chatService`, `expenseScanService` (via MCP), `timesheetsService` (mock, switch via `FEATURES.BACKEND_CONNECTED`)

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
```ts
// src/constants/app.constants.ts
export const FEATURES = {
  BACKEND_CONNECTED: false,
};
```
- `BACKEND_CONNECTED`: quando `false`, `timesheetsService` devolve dados mock. Ligar quando o backend estiver pronto.

## MCP Server (`mcp-server/`)

Servidor MCP próprio que orquestra chamadas LLM de forma provider-agnostic. Vive como pasta irmã do projeto React Native.

### Arquitetura
```
mcp-server/src/
  config/         ← env validation (zod) + constants
  providers/      ← LLMProvider interface + AnthropicProvider + OpenAIProvider + factory
  orchestrator/   ← chatOrchestrator (handleChat/Bootstrap/Scan) + promptBuilder + responseParser
  tools/          ← ToolRegistry + 6 tools fictícias (mock ARMIS API) + fixtures JSON
  transport/      ← Express router com JSON-RPC 2.0 (POST /mcp)
  utils/          ← logger + error helpers
```

### Métodos JSON-RPC
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

### Tools fictícias (mock ARMIS API)
`getTimesheets`, `createTimesheetEntry`, `getExpenses`, `submitExpense`, `getProjects`, `getEmployeeInfo` — leem de `fixtures/*.json`. Substituir por HTTP calls quando a API real estiver disponível.

### Contexto do ARMINI — via MCP tools, NUNCA via system prompt
O ARMINI obtém contexto **exclusivamente via MCP tools** no loop agentic do server. **Nunca injetar dados de stores/contexto do cliente no system prompt nem como parâmetros extra do `chat/send`.** O client envia apenas `messages`, `language`, `userName` e opcionalmente `imageData`.

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
- Todas as chamadas LLM passam pelo MCP server — o cliente nunca contacta APIs de LLM diretamente
- Não adicionar dependências nativas sem verificar compatibilidade com a versão atual do RN/Expo SDK
- **Instalar pacotes Expo sempre com `npx expo install <pacote>`**, nunca com `npm install` — o `expo install` resolve automaticamente a versão compatível com o SDK do projeto e evita desalinhamentos de versão

## Comandos
- `npm start` — Metro bundler
- `npm run android` / `npm run ios` — build e run
- `npx tsc --noEmit` — verificação de tipos
- `cd ../mcp-server && npm run dev` — MCP server em dev mode
- `cd ../mcp-server && npm run typecheck` — typecheck do server
