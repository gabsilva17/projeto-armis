import express from 'express';
import cors from 'cors';
import { claimsHeaders } from './utils/claimsHeaders.js';
import { logger } from './utils/logger.js';
import { imputationRouter } from './routes/imputation.js';
import { projectRouter } from './routes/projects.js';
import { taskRouter } from './routes/tasks.js';
import { holidayRouter } from './routes/holiday.js';
import { vacationRouter } from './routes/vacation.js';
import { expenseRouter } from './routes/expenses.js';

const PORT = Number(process.env.PORT) || 3002;

const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(claimsHeaders);

// Health check (não está no contrato real — apenas para dev/probes locais)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'mock-backend' });
});

app.use('/api/v1/imputation', imputationRouter);
app.use('/api/v1/project', projectRouter);
app.use('/api/v1/task', taskRouter);
app.use('/api/v1/holiday', holidayRouter);
app.use('/api/v1/vacation', vacationRouter);
app.use('/api/v1/expense', expenseRouter); // TODO(expenses-contract)

app.use((req, res) => {
  res.status(404).json({
    type: 'about:blank',
    title: 'Not Found',
    status: 404,
    detail: `No route registered for ${req.method} ${req.path}`,
  });
});

app.listen(PORT, () => {
  logger.info(`ARMINI Mock Backend running on http://localhost:${PORT}`);
});
