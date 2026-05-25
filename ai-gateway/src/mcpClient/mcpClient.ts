import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import type { ToolDefinition, ToolResult } from './types.js';

// JSON-RPC-over-fetch client. The AI Gateway is the sole MCP consumer for
// now; mobile never speaks to /mcp directly. Phase 8 adds graceful fallback
// for the listTools()/callTool() failure paths — in Phase 7 we let errors
// surface as JSON-RPC errors back to the caller.

interface JsonRpcSuccess<T> {
  jsonrpc: '2.0';
  id: number;
  result: T;
}

interface JsonRpcFailure {
  jsonrpc: '2.0';
  id: number | null;
  error: { code: number; message: string; data?: unknown };
}

type JsonRpcResponse<T> = JsonRpcSuccess<T> | JsonRpcFailure;

export class McpClientError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'McpClientError';
  }
}

const ENDPOINT = `${env.MCP_URL}/mcp`;
let nextRequestId = 0;

async function rpc<T>(method: string, params: Record<string, unknown>): Promise<T> {
  const id = ++nextRequestId;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), env.MCP_TIMEOUT_MS);

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new McpClientError(`MCP server returned ${response.status} ${response.statusText}`);
    }

    const body = (await response.json()) as JsonRpcResponse<T>;
    if ('error' in body) {
      throw new McpClientError(`MCP error (${body.error.code}): ${body.error.message}`);
    }
    return body.result;
  } catch (err) {
    if (err instanceof McpClientError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new McpClientError(`MCP request timed out after ${env.MCP_TIMEOUT_MS}ms (${method})`);
    }
    throw new McpClientError(
      err instanceof Error ? err.message : 'MCP call failed',
      err,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export class McpClient {
  async listTools(): Promise<ToolDefinition[]> {
    const { tools } = await rpc<{ tools: ToolDefinition[] }>('tools/list', {});
    logger.info(`mcpClient.listTools → ${tools.length} tools`);
    return tools;
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
    logger.info(`mcpClient.callTool → ${name}`);
    return rpc<ToolResult>('tools/call', { name, arguments: args });
  }
}
