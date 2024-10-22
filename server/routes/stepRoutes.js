const express = require('express');
const TaskStep = require('../models/TaskStep');
const router = express.Router();

//get steps for a task
router.get('/', async (req, res) => {
  const { task_id, step_description, completed, assigned_user_id } = req.query;

  let whereClause = {};
  if (task_id) whereClause.task_id = task_id;
  if (step_description) whereClause.step_description = step_description;
  if (completed) whereClause.completed = completed;
  if (assigned_user_id) whereClause.assigned_user_id = assigned_user_id;

  const steps = await TaskStep.findAll({ where: whereClause });
  res.json(steps);
});


// Crea un nuovo PC
router.post('/', async (req, res) => {
  const { task_id, step_description, completed, assigned_user_id } = req.body
  const step = await PC.create({ task_id, step_description, completed, assigned_user_id });
  res.json(step);
});

module.exports = router;
