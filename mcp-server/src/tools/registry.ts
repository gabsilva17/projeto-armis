import type { ToolDefinition, ToolHandler, ToolResult } from './types.js';
import { logger } from '../utils/logger.js';

interface RegisteredTool {
  definition: ToolDefinition;
  handler: ToolHandler;
}

export class ToolRegistry {
  private tools = new Map<string, RegisteredTool>();

  register(definition: ToolDefinition, handler: ToolHandler): void {
    this.tools.set(definition.name, { definition, handler });
    logger.info(`Tool registered: ${definition.name}`);
  }

  list(): ToolDefinition[] {
    return Array.from(this.tools.values()).map((t) => t.definition);
  }

  async execute(name: string, args: Record<string, unknown>): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        content: [{ type: 'text', text: `Tool not found: ${name}` }],
        isError: true,
      };
    }

    logger.info(`Executing tool: ${name}`);
    return tool.handler(args);
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }
}
