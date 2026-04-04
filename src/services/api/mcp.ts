import type { MCPRequest, MCPResponse } from '../../types/api.types';
import { ApiError } from '../../types/api.types';
import { MCP_CONFIG, MCP_METHODS } from '../../constants/llm.constants';
import type {
  McpChatSendParams,
  McpChatSendResult,
  McpBootstrapParams,
  McpBootstrapResult,
  McpScanParams,
  McpScanResult,
  McpToolsCallParams,
  McpToolsCallResult,
} from '../../types/mcp.types';

const BASE_URL = `${MCP_CONFIG.baseUrl}${MCP_CONFIG.endpoint}`;

let _requestId = 0;

export async function mcpCall<T>(
  method: string,
  params: object,
): Promise<T> {
  const request: MCPRequest = {
    jsonrpc: '2.0',
    id: ++_requestId,
    method,
    params,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MCP_CONFIG.timeoutMs);

  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new ApiError(
        response.status,
        `MCP server error: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as MCPResponse<T>;

    if (data.error) {
      throw new ApiError(data.error.code, data.error.message);
    }

    return data.result as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError(408, 'MCP request timed out');
    }
    throw new ApiError(500, err instanceof Error ? err.message : 'MCP call failed');
  } finally {
    clearTimeout(timeout);
  }
}

// ── Typed wrappers ──────────────────────────────────────────────────

export function mcpChatSend(params: McpChatSendParams): Promise<McpChatSendResult> {
  return mcpCall<McpChatSendResult>(MCP_METHODS.CHAT_SEND, params);
}

export function mcpBootstrap(params: McpBootstrapParams): Promise<McpBootstrapResult> {
  return mcpCall<McpBootstrapResult>(MCP_METHODS.CHAT_BOOTSTRAP, params);
}

export function mcpScan(params: McpScanParams): Promise<McpScanResult> {
  return mcpCall<McpScanResult>(MCP_METHODS.CHAT_SCAN, params);
}

export function mcpToolsCall(params: McpToolsCallParams): Promise<McpToolsCallResult> {
  return mcpCall<McpToolsCallResult>(MCP_METHODS.TOOLS_CALL, params);
}
