import { Router } from 'express';
import {
  getImputationsByMonth,
  getImputationById,
  createImputation,
  updateImputation,
  removeImputation,
} from '../data/imputationsStore.js';
import { ok, fail, problem } from '../utils/envelopes.js';
import type { ImputationDto } from '../types/api.js';

export const imputationRouter = Router();

// As rotas dinâmicas com :id e as rotas com :year/:month coexistem em /my/...
// — Express resolve por ordem de registo, por isso registamos as mais específicas
// (year/month, dois segmentos) antes da single-id.

// GET /api/v1/imputation/my/{year}/{month}
imputationRouter.get('/my/:year/:month', (req, res) => {
  const year = Number(req.params.year);
  const month = Number(req.params.month);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    res.status(400).json(fail('Invalid year/month'));
    return;
  }
  res.json(getImputationsByMonth(year, month));
});

// GET /api/v1/imputation/my/{id}
imputationRouter.get('/my/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json(fail('Imputation id must be an integer'));
    return;
  }
  const entry = getImputationById(id);
  if (!entry) {
    res.status(404).json(problem(404, 'Not Found', `Imputation ${id} not found`));
    return;
  }
  res.json(entry);
});

// POST /api/v1/imputation/my
imputationRouter.post('/my', (req, res) => {
  const dto = req.body as ImputationDto;
  if (!dto || typeof dto !== 'object') {
    res.status(400).json(fail('Body must be an ImputationDto object'));
    return;
  }
  createImputation(dto);
  res.json(ok('Imputation created'));
});

// PUT /api/v1/imputation/my/{id}
imputationRouter.put('/my/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json(fail('Imputation id must be an integer'));
    return;
  }
  const dto = req.body as ImputationDto;
  if (!dto || typeof dto !== 'object') {
    res.status(400).json(fail('Body must be an ImputationDto object'));
    return;
  }
  const updated = updateImputation(id, dto);
  if (!updated) {
    res.status(404).json(problem(404, 'Not Found', `Imputation ${id} not found`));
    return;
  }
  res.json(ok('Imputation updated'));
});

// DELETE /api/v1/imputation/my/{id}
imputationRouter.delete('/my/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json(fail('Imputation id must be an integer'));
    return;
  }
  const removed = removeImputation(id);
  if (!removed) {
    res.status(404).json(problem(404, 'Not Found', `Imputation ${id} not found`));
    return;
  }
  res.json(ok('Imputation deleted'));
});
