import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import type { ToolDefinition, ToolResult } from './types.js';

// JSON-RPC-over-fetch client. The AI Gateway is the sole MCP consumer for
// now; mobile never speaks to /mcp directly. `listTools()` is wrapped with
// a short timeout and swallows failures (returns null) so the orchestrator
// can degrade gracefully when MCP is unreachable — see REFACTOR_PLAN.md
// § Phase 8. `callTool()` still throws so the agentic loop surfaces tool
// errors to the LLM as it always has.

const LIST_TOOLS_TIMEOUT_MS = 2_000;
const HEALTH_TIMEOUT_MS = 2_000;

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

async function rpc<T>(
  method: string,
  params: Record<string, unknown>,
  timeoutMs: number = env.MCP_TIMEOUT_MS,
): Promise<T> {
  const id = ++nextRequestId;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

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
      throw new McpClientError(`MCP request timed out after ${timeoutMs}ms (${method})`);
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
  // Returns null when MCP is unreachable (timeout, network error, RPC error).
  // The orchestrator uses null as the signal to drop into degraded mode —
  // see ChatOrchestrator.handleChat().
  async listTools(): Promise<ToolDefinition[] | null> {
    try {
      const { tools } = await rpc<{ tools: ToolDefinition[] }>(
        'tools/list',
        {},
        LIST_TOOLS_TIMEOUT_MS,
      );
      logger.info(`mcpClient.listTools → ${tools.length} tools`);
      return tools;
    } catch (err) {
      logger.warn(
        `mcpClient.listTools failed (${err instanceof Error ? err.message : 'unknown'}) — degrading without tools`,
      );
      return null;
    }
  }

  // Cheap reachability probe for chat/health. Same timeout as listTools.
  async ping(): Promise<boolean> {
    try {
      await rpc<{ tools: ToolDefinition[] }>('tools/list', {}, HEALTH_TIMEOUT_MS);
      return true;
    } catch {
      return false;
    }
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
    logger.info(`mcpClient.callTool → ${name}`);
    return rpc<ToolResult>('tools/call', { name, arguments: args });
  }
}
