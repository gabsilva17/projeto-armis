import { Router } from 'express';
import { getAllProjects, getProjectsInRange } from '../data/projectsStore.js';

export const projectRouter = Router();

// GET /api/v1/project/my
projectRouter.get('/my', (_req, res) => {
  res.json(getAllProjects());
});

// GET /api/v1/project/my/{startDate}/{endDate}
projectRouter.get('/my/:startDate/:endDate', (req, res) => {
  const { startDate, endDate } = req.params;
  res.json(getProjectsInRange(startDate, endDate));
});
