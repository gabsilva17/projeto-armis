export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export type ToolHandler = (args: Record<string, unknown>) => Promise<ToolResult>;
