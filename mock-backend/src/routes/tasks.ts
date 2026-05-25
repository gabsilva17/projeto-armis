import { Router } from 'express';
import { getTasksByProjectCode } from '../data/projectsStore.js';

export const taskRouter = Router();

// GET /api/v1/task/my/{projectCode}
taskRouter.get('/my/:projectCode', (req, res) => {
  res.json(getTasksByProjectCode(req.params.projectCode));
});
