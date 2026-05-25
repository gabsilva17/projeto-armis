// DTOs do contrato MCP — espelham os tipos do server
// O client nunca precisa de saber qual provider o server usa.

export interface ChatHistoryEntry {
  role: 'user' | 'assistant';
  content: string;
}

export interface McpSuggestion {
  label: string;
  prompt: string;
}

export interface McpAction {
  type: string;
}

export interface McpChatSendParams {
  messages: ChatHistoryEntry[];
  language: string;
  userName: string;
  imageData?: {
    base64: string;
    mediaType: string;
  };
}

export interface McpToolCall {
  name: string;
  result?: string;
}

export interface McpDropdownOption {
  label: string;
  value: string;
}

export interface McpDropdown {
  label: string;
  options: McpDropdownOption[];
}

export interface McpChatSendResult {
  text: string;
  suggestions: McpSuggestion[];
  actions: McpAction[];
  toolCalls: McpToolCall[];
  dropdown?: McpDropdown;
  toolsAvailable: boolean;
}

export interface McpBootstrapParams {
  language: string;
  userName: string;
}

export interface McpBootstrapResult {
  messageText: string;
  suggestions: McpSuggestion[];
  toolsAvailable: boolean;
}

export interface McpScanParams {
  base64: string;
  mediaType: string;
}

export interface McpScanResult {
  expenseData: {
    date?: string;
    expenseType?: string;
    quantity?: string;
    unitValue?: string;
    currency?: string;
    observations?: string;
  };
  toolsAvailable: boolean;
}

// chat/health — cheap probe of both the AI Gateway and (indirectly) the
// MCP server. Drives the chat banner / boot toast on the mobile side.
export interface McpHealthResult {
  aiGateway: 'ok';
  mcp: 'ok' | 'offline';
}

// ── tools/call ──────────────────────────────────────────────────────

export interface McpToolsCallParams {
  name: string;
  arguments: Record<string, unknown>;
}

export interface McpToolContentItem {
  type: 'text';
  text: string;
}

export interface McpToolsCallResult {
  content: McpToolContentItem[];
}
