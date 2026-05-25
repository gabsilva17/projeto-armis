import { Router } from 'express';
import { getMyVacation } from '../data/vacationStore.js';

export const vacationRouter = Router();

// GET /api/v1/vacation/my
vacationRouter.get('/my', (_req, res) => {
  res.json(getMyVacation());
});
