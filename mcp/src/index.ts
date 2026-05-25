import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { ToolRegistry } from './tools/registry.js';
import { createMcpRouter } from './transport/httpTransport.js';
import { logger } from './utils/logger.js';

// Tool imports
import { getTimesheetsDefinition, getTimesheetsHandler } from './tools/getTimesheets.js';
import { createTimesheetEntryDefinition, createTimesheetEntryHandler } from './tools/createTimesheetEntry.js';
import { getExpensesDefinition, getExpensesHandler } from './tools/getExpenses.js';
import { submitExpenseDefinition, submitExpenseHandler } from './tools/submitExpense.js';
import { getProjectsDefinition, getProjectsHandler } from './tools/getProjects.js';
import { getEmployeeInfoDefinition, getEmployeeInfoHandler } from './tools/getEmployeeInfo.js';
import { editTimesheetEntryDefinition, editTimesheetEntryHandler } from './tools/editTimesheetEntry.js';
import { deleteTimesheetEntryDefinition, deleteTimesheetEntryHandler } from './tools/deleteTimesheetEntry.js';
import { editExpenseDefinition, editExpenseHandler } from './tools/editExpense.js';
import { deleteExpenseDefinition, deleteExpenseHandler } from './tools/deleteExpense.js';

// ── Bootstrap ───────────────────────────────────────────────────────

const toolRegistry = new ToolRegistry();

toolRegistry.register(getTimesheetsDefinition, getTimesheetsHandler);
toolRegistry.register(createTimesheetEntryDefinition, createTimesheetEntryHandler);
toolRegistry.register(editTimesheetEntryDefinition, editTimesheetEntryHandler);
toolRegistry.register(deleteTimesheetEntryDefinition, deleteTimesheetEntryHandler);
toolRegistry.register(getExpensesDefinition, getExpensesHandler);
toolRegistry.register(submitExpenseDefinition, submitExpenseHandler);
toolRegistry.register(editExpenseDefinition, editExpenseHandler);
toolRegistry.register(deleteExpenseDefinition, deleteExpenseHandler);
toolRegistry.register(getProjectsDefinition, getProjectsHandler);
toolRegistry.register(getEmployeeInfoDefinition, getEmployeeInfoHandler);

// ── Express ─────────────────────────────────────────────────────────

const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', backendUrl: env.BACKEND_URL });
});

app.use('/mcp', createMcpRouter(toolRegistry));

app.listen(env.MCP_PORT, () => {
  logger.info(`ARMINI MCP server running on http://localhost:${env.MCP_PORT}`);
  logger.info(`Backend URL: ${env.BACKEND_URL}`);
  logger.info(`Registered tools: ${toolRegistry.list().length}`);
});
