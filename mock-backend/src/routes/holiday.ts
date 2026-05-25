import { Router } from 'express';
import { getHolidaysByYear } from '../data/holidaysStore.js';
import { fail } from '../utils/envelopes.js';

export const holidayRouter = Router();

// GET /api/v1/holiday?year=...
holidayRouter.get('/', (req, res) => {
  const year = Number(req.query.year);
  if (!Number.isInteger(year)) {
    res.status(400).json(fail('Query param "year" is required (integer)'));
    return;
  }
  res.json(getHolidaysByYear(year));
});
