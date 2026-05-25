export interface ParsedSuggestion {
  label: string;
  prompt: string;
}

export interface ParsedAction {
  type: string;
}

export interface ParsedDropdownOption {
  label: string;
  value: string;
}

export interface ParsedDropdown {
  label: string;
  options: ParsedDropdownOption[];
}

export interface ParsedChatResponse {
  text: string;
  suggestions: ParsedSuggestion[];
  actions: ParsedAction[];
  dropdown?: ParsedDropdown;
}

const EXPENSE_OPTIONS_MARKER = '[EXPENSE_OPTIONS]';
const SUGGESTIONS_BLOCK_RE = /(?:\[SUGGESTIONS\]|<\/?suggestions>)/i;
const DROPDOWN_BLOCK_RE = /(?:\[DROPDOWN\]|<\/?dropdown>)/i;

export function parseChatResponse(rawText: string): ParsedChatResponse {
  const actions: ParsedAction[] = [];
  let workingText = rawText;

  // Detect and strip [EXPENSE_OPTIONS] marker
  if (workingText.includes(EXPENSE_OPTIONS_MARKER)) {
    workingText = workingText.replace(EXPENSE_OPTIONS_MARKER, '').trimEnd();
    actions.push({ type: 'expense_options' });
  }

  // Extract [SUGGESTIONS] block FIRST — it is always the last block in the response.
  // Parsing it first prevents [DROPDOWN] from swallowing it.
  const markerMatch = workingText.match(SUGGESTIONS_BLOCK_RE);
  let suggestions: ParsedSuggestion[] = [];

  if (markerMatch?.index != null) {
    const rawBlock = workingText.slice(markerMatch.index);
    workingText = workingText.slice(0, markerMatch.index).trimEnd();

    // Strip all marker tags so only the JSON array remains
    const jsonCandidate = rawBlock
      .replace(new RegExp(SUGGESTIONS_BLOCK_RE, 'gi'), '')
      .trim();

    try {
      const start = jsonCandidate.indexOf('[');
      const end = jsonCandidate.lastIndexOf(']');
      if (start !== -1 && end > start) {
        const parsed = JSON.parse(jsonCandidate.slice(start, end + 1)) as Array<
          Partial<ParsedSuggestion>
        >;
        suggestions = parsed
          .filter(
            (item) =>
              typeof item.label === 'string' && typeof item.prompt === 'string',
          )
          .slice(0, 4)
          .map((item) => ({
            label: item.label!.trim(),
            prompt: item.prompt!.trim(),
          }))
          .filter((item) => item.label.length > 0 && item.prompt.length > 0);
      }
    } catch {
      // Parsing failed — suggestions stay empty, message still delivered
    }
  }

  // Extract [DROPDOWN] block (suggestions already stripped, so JSON is clean)
  let dropdown: ParsedDropdown | undefined;
  const dropdownMatch = workingText.match(DROPDOWN_BLOCK_RE);
  if (dropdownMatch?.index != null) {
    const rawBlock = workingText.slice(dropdownMatch.index);
    workingText = workingText.slice(0, dropdownMatch.index).trimEnd();

    const jsonCandidate = rawBlock
      .replace(new RegExp(DROPDOWN_BLOCK_RE, 'gi'), '')
      .trim();

    try {
      const start = jsonCandidate.indexOf('{');
      const end = jsonCandidate.lastIndexOf('}');
      if (start !== -1 && end > start) {
        const parsed = JSON.parse(jsonCandidate.slice(start, end + 1)) as {
          label?: string;
          options?: Array<Partial<ParsedDropdownOption>>;
        };
        if (
          typeof parsed.label === 'string' &&
          Array.isArray(parsed.options) &&
          parsed.options.length > 0
        ) {
          const validOptions = parsed.options
            .filter(
              (o): o is ParsedDropdownOption =>
                typeof o.label === 'string' && typeof o.value === 'string',
            )
            .filter((o) => o.label.length > 0 && o.value.length > 0);

          if (validOptions.length > 0) {
            dropdown = { label: parsed.label.trim(), options: validOptions };
          }
        }
      }
    } catch {
      // Parsing failed — dropdown stays undefined
    }
  }

  // When expense action buttons are shown, suggestions are redundant
  if (actions.length > 0) {
    suggestions = [];
  }

  return { text: workingText, suggestions, actions, dropdown };
}

export function parseStartupSuggestions(rawText: string): ParsedSuggestion[] {
  try {
    const start = rawText.indexOf('[');
    const end = rawText.lastIndexOf(']');
    if (start === -1 || end <= start) return [];

    const parsed = JSON.parse(rawText.slice(start, end + 1)) as Array<
      Partial<ParsedSuggestion>
    >;

    return parsed
      .filter(
        (item) =>
          typeof item.label === 'string' && typeof item.prompt === 'string',
      )
      .slice(0, 4)
      .map((item) => ({
        label: item.label!.trim(),
        prompt: item.prompt!.trim(),
      }))
      .filter((item) => item.label.length > 0 && item.prompt.length > 0);
  } catch {
    return [];
  }
}
