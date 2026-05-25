// TODO(expenses-contract): real API contract not yet defined in swagger.json.
// Estas rotas existem para destravar o desenvolvimento. Quando o contrato real
// chegar, atualizar paths, request/response shapes e remover este TODO.

import { Router } from 'express';
import {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  removeExpense,
} from '../data/expensesStore.js';
import { ok, fail, problem } from '../utils/envelopes.js';
import type { ExpenseDto } from '../types/expense.js';

export const expenseRouter = Router();

// GET /api/v1/expense/my
expenseRouter.get('/my', (_req, res) => {
  res.json(getAllExpenses());
});

// GET /api/v1/expense/my/{id}
expenseRouter.get('/my/:id', (req, res) => {
  const entry = getExpenseById(req.params.id);
  if (!entry) {
    res.status(404).json(problem(404, 'Not Found', `Expense ${req.params.id} not found`));
    return;
  }
  res.json(entry);
});

// POST /api/v1/expense/my
expenseRouter.post('/my', (req, res) => {
  const dto = req.body as ExpenseDto;
  if (!dto || typeof dto !== 'object') {
    res.status(400).json(fail('Body must be an ExpenseDto object'));
    return;
  }
  const created = createExpense(dto);
  res.json({ ...ok('Expense created'), id: created.id });
});

// PUT /api/v1/expense/my/{id}
expenseRouter.put('/my/:id', (req, res) => {
  const dto = req.body as ExpenseDto;
  const updated = updateExpense(req.params.id, dto);
  if (!updated) {
    res.status(404).json(problem(404, 'Not Found', `Expense ${req.params.id} not found`));
    return;
  }
  res.json(ok('Expense updated'));
});

// DELETE /api/v1/expense/my/{id}
expenseRouter.delete('/my/:id', (req, res) => {
  if (!removeExpense(req.params.id)) {
    res.status(404).json(problem(404, 'Not Found', `Expense ${req.params.id} not found`));
    return;
  }
  res.json(ok('Expense deleted'));
});
