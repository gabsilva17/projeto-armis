// Shapes returned by the MCP server's JSON-RPC surface. Kept structurally
// identical to what the old in-process ToolRegistry exposed so the
// orchestrator code is unchanged from its perspective.

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}
