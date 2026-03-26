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

Todas as animações devem seguir estes valores para garantir consistência visual. **Nunca usar `.springify()` sem parâmetros** — os defaults do Reanimated são demasiado elásticos.

### Easing (importar de `react-native-reanimated`)
```ts
const EASE_OUT = Easing.out(Easing.cubic); // entradas — começa rápido, desacelera
const EASE_IN  = Easing.in(Easing.cubic);  // saídas — começa devagar, acelera
```

### Entering / Exiting (elementos que aparecem/desaparecem)
```ts
// Elemento surge (ex: menu, preview, modal)
entering={FadeInUp.duration(200).easing(EASE_OUT)}

// Elemento desaparece
exiting={FadeOutDown.duration(160).easing(EASE_IN)}
```
- Entradas: **180–200 ms**, `EASE_OUT`
- Saídas: **140–160 ms**, `EASE_IN` (saída ligeiramente mais rápida — mais snappy)

### Springs (gesture-driven ou feedback de press)
```ts
// Expansão de ecrã (chat, profile panel)
{ damping: 26, stiffness: 230, mass: 0.85 }

// Colapso de calendário / transições de layout
{ damping: 20, stiffness: 200, mass: 0.8 }
```
Estes valores produzem um spring quase criticamente amortecido (sem bounce visível).

### Press feedback em botões
```ts
// Pressionar
withTiming(0.82, { duration: 80,  easing: EASE_OUT })
// Soltar
withTiming(1,    { duration: 200, easing: EASE_OUT })
```
Usar `withTiming`, não `withSpring`, para press feedback — evita bounce indesejado.

### Timings de show/hide (opacidade ou translate simples)
```ts
// Abrir
withTiming(1, { duration: 180, easing: EASE_OUT })
// Fechar
withTiming(0, { duration: 160, easing: EASE_IN  })
```

### Transições de página (slide horizontal)
```ts
withTiming(±screenWidth, { duration: 220 }) // sair
withTiming(0,            { duration: 220 }) // entrar
```

---

# Digital Hub Mobile App

## Projeto
Port mobile do Digital Hub da ARMIS Group em React Native.
Estágio curricular LEI-ISEP, fevereiro a julho 2026.

Use cases principais:
- Gestão de timesheets (registo, edição, consulta de horas)
- Submissão de faturas de despesas (incluindo via fotografia com extração automática de dados)
- AI Companion — chat contextual via MCP, integrado com servidor desenvolvido por colega da FEUP

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
- LLM: Claude Haiku (`claude-haiku-4-5-20251001`) via chamada HTTP direta à Anthropic API (POC)

## Estrutura real do projeto
```
app/                          ← Expo Router routes (file-based)
  index.tsx                   ← Redireciona para /(main)/home
  _layout.tsx                 ← Root layout (fonts, error boundary)
  (main)/
    _layout.tsx               ← Layout principal (TopBar + BottomNavBar + Slot)
    home/index.tsx
    finances/index.tsx
    timesheets/index.tsx

src/
  components/
    chat/                     ← ChatBubbleContainer, ChatInput, ChatMessage, etc.
    finances/                 ← ManualInvoiceEntry (modal) para submissão manual
    home/                     ← QuickActionsSection, QuickActionFormModal
    navigation/               ← TopBar, BottomNavBar, ProfileSidebar
    timesheets/               ← CalendarGrid, DayCell, EntryFormModal, WeekStrip, etc.
    ui/                       ← ActionListRow, Button, Card, DateField, Divider, EmptyState, SelectField, TextField, etc.
  contexts/
    RefreshContext.tsx         ← Refresh via remount: expõe `refreshing` + `refreshKey`; ao incrementar `refreshKey` o layout desmonta/remonta a página ativa (re-executa todos os hooks e API calls automaticamente)
  hooks/
    useChatAnimation.ts
    useCalendarAnimation.ts
    useGreeting.ts
    useKeyboard.ts
    useSlideUpModalAnimation.ts
    useProfileAnimation.ts
    useResponsive.ts
    useTimesheets.ts
  services/
    adapters/                 ← Adaptadores API->domínio por feature (chat, timesheets)
    api/
      anthropic.ts            ← Claude HTTP client (fetch direto)
      mcp.ts                  ← Placeholder MCP (não implementado)
    chat/chatService.ts
    timesheets/timesheetsService.ts
  i18n/
    index.ts                  ← Inicialização i18next (importado em _layout.tsx)
    types.ts                  ← Module augmentation para i18next
    locales/
      en/                     ← Traduções EN (common, home, finances, timesheets, chat, settings, more)
      pt/                     ← Traduções PT (mesmos ficheiros)
  stores/                     ← Zustand stores
    useChatStore.ts           ← Mensagens + persistência AsyncStorage
    useFinancesStore.ts
    useLanguageStore.ts       ← Idioma do utilizador (EN/PT) + persistência AsyncStorage
    useSidebarStore.ts
    useTimesheetsStore.ts
  theme/
    colors.ts                 ← Paleta semântica + escala cinzento (100–900)
    typography.ts             ← Inter font, tamanhos e pesos
    spacing.ts                ← Escala base 4px (Spacing.1=4, Spacing.2=8, …)
    shadows.ts                ← Platform.select iOS/Android
    index.ts
  types/
    api.types.ts, chat.types.ts, finances.types.ts,
    navigation.types.ts, timesheets.ts, index.ts
  constants/
    app.constants.ts          ← APP_NAME, USER_NAME, FEATURES, ROUTES, SIDEBAR_WIDTH
    animation.constants.ts    ← Durations, easing e spring configs canónicos
    formOptions.constants.ts  ← Opções reutilizáveis de formulários (finances)
    ui.constants.ts           ← HIT_SLOP e valores de interação reutilizáveis
    image.constants.ts        ← Config partilhada de image picker/upload
    llm.constants.ts          ← Endpoint/model/version/token limits do cliente LLM
    chat.constants.ts         ← Textos/strings reutilizáveis do domínio de chat
    quickActions.constants.ts ← Opções e limites de quick actions
    suggestions.ts            ← Chat suggestions por defeito
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

`useTimesheetsStore` expõe `getMonthData(year, month)` que deriva `MonthSummary` do estado.

## Internacionalização (i18n)

Toda a UI suporta EN e PT via `i18next` + `react-i18next`.

### Setup
- `src/i18n/index.ts` inicializa o i18next — importado no topo de `app/_layout.tsx`
- Traduções em JSON: `src/i18n/locales/{en,pt}/{common,home,finances,timesheets,chat,settings,more}.json`
- `useLanguageStore` persiste a preferência; default = idioma do dispositivo (`expo-localization`)

### Padrões de uso
```ts
// Em componentes funcionais — hook com namespace
const { t } = useTranslation('timesheets');
t('form.project')                         // chave do namespace atual
t('common:save')                          // cross-namespace com prefixo
t('dayDetail.hoursLogged', { totalHours }) // interpolação {{variable}}
t('quickActions.count', { count: 3 })     // pluralização (_one / _other)

// Em funções fora de componentes (validação, services)
import i18n from '@/src/i18n';
i18n.t('timesheets:validation.projectRequired')

// Em class components (ErrorBoundary)
import i18n from '@/src/i18n';
i18n.t('error.somethingWentWrong')
```

### Regras
- **Nunca hardcodar texto de UI.** Todas as strings visíveis ao utilizador devem estar nos JSON de locale.
- Prompts de LLM (system messages para a API) **NÃO são traduzidos** — ficam em inglês.
- Quick actions criadas pelo utilizador guardam `title`/`description` como texto livre; só as default actions usam `t()`.
- Datas usam `Intl.DateTimeFormat` com `i18n.language` como locale.
- Para adicionar um novo idioma: criar pasta `src/i18n/locales/{code}/`, copiar os JSONs, traduzir, registar em `src/i18n/index.ts` e adicionar opção em `useLanguageStore`.

## Camada de serviços
Todas as chamadas à API ficam em `src/services/`, nunca na UI nem nos stores diretamente.

- Adaptadores por domínio devem viver em `src/services/adapters/` para converter payloads externos (API/LLM/mock) em modelos internos tipados da app.
- Services não devem fazer parsing/mapeamento complexo inline; devem delegar para adapters para facilitar debug, testes e evolução de contratos.
- UI e stores não devem importar `src/services/api/*` nem `src/services/adapters/*` diretamente; devem consumir apenas services de domínio.
- Contratos externos devem ser tipados no adapter (ex: `*Api`, `*ApiResponse`) e normalizados no mesmo ficheiro.
- Quando o backend mudar o payload, ajustar primeiro o adapter do domínio; evitar mexer em componentes/stores sem necessidade.

- `anthropic.ts` — cliente HTTP para `https://api.anthropic.com/v1/messages`, chave via `process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY`
- `chatService.ts` — `sendMessage(content, history)`, saudações baseadas na hora
- `timesheetsService.ts` — dados mock; switch via `FEATURES.BACKEND_CONNECTED`

## Sistema de tema
Tokens centralizados em `src/theme/`. **Nunca hardcodar cores, espaçamentos ou tipografia.**

Complemento obrigatório de DRY: durações de animação, spring configs, hitSlop, opções de formulário e config de integrações devem viver em `src/constants/` (não hardcoded em componentes/serviços).

- A definição de temas vive em `src/theme/colors.ts`:
  - `themes` (paleta de cada tema)
  - `THEME_CATALOG` (label/descrição para UI)
  - `DEFAULT_THEME_ID` (tema inicial persistido)
- A página de Settings gera as opções a partir de `themes` + `THEME_CATALOG`; para adicionar novo tema, atualizar `colors.ts`.

```ts
Colors.background, Colors.textPrimary, Colors.bubbleUser, ...
Spacing[1]=4, Spacing[2]=8, Spacing[3]=12, Spacing[4]=16, ...
Typography.fontFamily.regular, Typography.size.base=15, ...
Shadows.sm  // Platform.select iOS/Android
```

## Padrões de componentes
- Props: interface `ComponentNameProps`, handle: `ComponentNameHandle`
- Variantes com union types: `type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost'`
- Estilos: `StyleSheet.create()` + arrays condicionais `[styles.base, isActive && styles.active]`
- Animated styles: `useAnimatedStyle()` → `<Animated.View style={animStyle}>`
- Icons: `phosphor-react-native` (preferencial) ou `@expo/vector-icons`
- Acessibilidade: `accessibilityRole`, `accessibilityLabel`, `accessibilityState` em todos os elementos interativos
- Hit slop para botões pequenos: `hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}`
- Dropdowns/selects de formulários devem usar `src/components/ui/SelectField` (evitar implementações inline duplicadas por domínio)
- Inputs de texto de formulários devem usar `src/components/ui/TextField` (label/required/helper + estilo base partilhado)
- Inputs de data de formulários devem usar `src/components/ui/DateField` (picker nativo iOS/Android + estilo base partilhado)
- Linhas de ação/listas lineares (título + subtítulo opcional + meta + seta) devem usar `src/components/ui/ActionListRow` para manter consistência entre Home/Chat/Finances

## Padrão de modais full-screen
- Modais slide-up devem usar o hook partilhado `useSlideUpModalAnimation` para controlar `mounted`, `slideY`, `backdropOpacity` e `animateClose`.
- Evitar duplicar setup de `Animated.Value`, timings e spring configs em cada modal.
- A lógica de estado do formulário continua no componente de domínio; a lógica de lifecycle/animação fica no hook.

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
export const FEATURES = { BACKEND_CONNECTED: false };
```
Quando `false`, `timesheetsService` devolve dados mock. Ligar quando o backend estiver pronto.

## Regras de código
- **Nunca fazer assumptions.** Se houver qualquer dúvida sobre requisitos, design, comportamento esperado ou abordagem, perguntar ao utilizador antes de avançar. Preferir clarificar do que assumir.
- Componentes funcionais com hooks, sem classes
- ES modules (import/export), sem CommonJS
- Nomes de ficheiros e variáveis em inglês, comentários em português
- Typecheck obrigatório antes de terminar qualquer sessão (`npx tsc --noEmit`)
- DRY: antes de criar um novo componente, verificar se já existe algo reutilizável em `src/components/ui/`
- Extrair para `src/components/` qualquer componente usado em mais do que um sítio
- Sem duplicação de lógica: funções utilitárias e chamadas à API partilhadas, nunca copiadas
- Textos de UI/configuração que alimentam ecrãs (ex: opções de tema em Settings) devem viver em `src/constants/` e não hardcoded dentro dos componentes
- Configurações transversais (animações, hitSlop, opções de formulário, LLM/image picker) devem ser single source of truth em `src/constants/`
- Componentes legados sem referências no projeto devem ser removidos (não manter código morto)

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

## Código intencionalmente inativo

O projeto contém código preservado a pedido explícito que não está a ser usado na UI atual. **Não remover** sem confirmar com o utilizador.

| Ficheiro | O que está inativo | Motivo |
|----------|--------------------|--------|
| `src/components/chat/ChatInput.tsx` | Botão de attach de foto (PaperclipIcon + menu Camera/Gallery), lógica de `pendingImage`, `takePhoto`, `pickFromLibrary`, `handleClipPress`, `clipScale` | Feature ocultada temporariamente via `{false && (...)}` — a lógica pode ser reativada quando necessário |
| `ChatBubbleContainer.tsx` | Prop `onSendImage` passada ao `ChatInput` | Dependente da feature acima |

---

## ⚠️ Restrições importantes
- A API key do LLM está no bundle por ser POC — NUNCA para produção
- Em produção, chamadas ao LLM têm de passar pelo servidor MCP, nunca pelo cliente
- Não adicionar dependências nativas sem verificar compatibilidade com a versão atual do RN/Expo SDK

## Comandos
- `npm start` — Metro bundler
- `npm run android` / `npm run ios` — build e run
- `npx tsc --noEmit` — verificação de tipos
