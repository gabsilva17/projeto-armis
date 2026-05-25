import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { createProvider } from './providers/index.js';
import { ChatOrchestrator } from './orchestrator/chatOrchestrator.js';
import { McpClient } from './mcpClient/index.js';
import { createMcpRouter } from './transport/httpTransport.js';
import { logger } from './utils/logger.js';

// ── Bootstrap ───────────────────────────────────────────────────────

const provider = createProvider();
const mcpClient = new McpClient();
const orchestrator = new ChatOrchestrator(provider, mcpClient);

// ── Express ─────────────────────────────────────────────────────────

const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' })); // base64 images can be large

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', provider: env.LLM_PROVIDER, mcpUrl: env.MCP_URL });
});

// JSON-RPC endpoint — chat methods only. tools/* live on the MCP server.
app.use('/mcp', createMcpRouter(orchestrator));

// ── Start ───────────────────────────────────────────────────────────

app.listen(env.PORT, () => {
  logger.info(`ARMINI AI Gateway running on http://localhost:${env.PORT}`);
  logger.info(`LLM Provider: ${env.LLM_PROVIDER}`);
  logger.info(`MCP URL: ${env.MCP_URL}`);
});
