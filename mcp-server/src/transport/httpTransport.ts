import { Router, type Request, type Response } from 'express';
import type { ChatOrchestrator } from '../orchestrator/chatOrchestrator.js';
import type { ToolRegistry } from '../tools/registry.js';
import { RPC_ERRORS, rpcError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params: Record<string, unknown>;
}

function isValidRpcRequest(body: unknown): body is JsonRpcRequest {
  if (typeof body !== 'object' || body === null) return false;
  const obj = body as Record<string, unknown>;
  return (
    obj.jsonrpc === '2.0' &&
    (typeof obj.id === 'string' || typeof obj.id === 'number') &&
    typeof obj.method === 'string'
  );
}

function sendResult(res: Response, id: string | number, result: unknown): void {
  res.json({ jsonrpc: '2.0', id, result });
}

function sendError(
  res: Response,
  id: string | number | null,
  code: number,
  message: string,
  data?: unknown,
): void {
  res.json({ jsonrpc: '2.0', id, error: rpcError(code, message, data) });
}

export function createMcpRouter(
  orchestrator: ChatOrchestrator,
  toolRegistry: ToolRegistry,
): Router {
  const router = Router();

  router.post('/', async (req: Request, res: Response) => {
    const body = req.body;

    if (!isValidRpcRequest(body)) {
      sendError(res, null, RPC_ERRORS.INVALID_REQUEST, 'Invalid JSON-RPC 2.0 request');
      return;
    }

    const { id, method, params } = body;

    logger.info(`RPC: ${method} (id=${id})`);

    try {
      switch (method) {
        case 'chat/send': {
          const result = await orchestrator.handleChat(params as any);
          sendResult(res, id, result);
          break;
        }

        case 'chat/bootstrap': {
          const result = await orchestrator.handleBootstrap(params as any);
          sendResult(res, id, result);
          break;
        }

        case 'chat/scan': {
          const result = await orchestrator.handleScan(params as any);
          sendResult(res, id, result);
          break;
        }

        case 'tools/list': {
          const tools = toolRegistry.list();
          sendResult(res, id, { tools });
          break;
        }

        case 'tools/call': {
          const { name, arguments: args } = params as {
            name: string;
            arguments: Record<string, unknown>;
          };
          if (!name || !toolRegistry.has(name)) {
            sendError(res, id, RPC_ERRORS.METHOD_NOT_FOUND, `Tool not found: ${name}`);
            return;
          }
          const result = await toolRegistry.execute(name, args ?? {});
          sendResult(res, id, result);
          break;
        }

        default:
          sendError(res, id, RPC_ERRORS.METHOD_NOT_FOUND, `Unknown method: ${method}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal server error';
      logger.error(`RPC error in ${method}:`, err);
      sendError(res, id, RPC_ERRORS.INTERNAL_ERROR, message);
    }
  });

  return router;
}
