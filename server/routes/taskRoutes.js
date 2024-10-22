const express = require('express');
const Task = require('../models/Task');
const TaskStep = require('../models/TaskStep');
const authenticateToken = require('../middleware/authMiddleware'); // Importa il middleware
const router = express.Router();

// Get all tasks (filtrati per PC e utente)
router.get('/', async (req, res) => {
  const { pc_id, user_id, status } = req.query;

  let whereClause = {};
  if (pc_id) whereClause.pc_id = pc_id;
  if (user_id) whereClause.assigned_user_id = user_id;
  if (status) whereClause.status = status;

  const tasks = await Task.findAll({ where: whereClause });
  res.json(tasks);
});



// Get all tasks (filtrati per PC e utente) con auth
//router.get('/', authenticateToken, async (req, res) => {
//  const { pc_id, user_id, status } = req.query;

//  let whereClause = {};
//  if (pc_id) whereClause.pc_id = pc_id;
//  if (user_id) whereClause.assigned_user_id = user_id;
//  if (status) whereClause.status = status;

//  const tasks = await Task.findAll({ where: whereClause });
//  res.json(tasks);
//});

// Crea un nuovo task -- Protetto da JWT
//router.post('/', authenticateToken, async (req, res) => {
//  const { description, pc_id, assigned_user_id } = req.body;
//  const task = await Task.create({ description, pc_id, assigned_user_id });
//  res.json(task);
//});

// Crea un nuovo task
router.post('/', async (req, res) => {
  const { description, pc_id, assigned_user_id } = req.body;
  const task = await Task.create({ description, pc_id, assigned_user_id });
  res.json(task);
});

// Aggiorna lo stato di un task
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const task = await Task.findByPk(id);
  if (task) {
    task.status = status;
    await task.save();
    res.json(task);
  } else {
    res.status(404).json({ error: 'Task non trovato' });
  }
});

// Aggiunge una nuova fase a un task
router.post('/:id/steps', async (req, res) => {
  const { id } = req.params;
  const { step_description, assigned_user_id } = req.body;

  const taskStep = await TaskStep.create({
    task_id: id,
    step_description,
    assigned_user_id,
  });

  res.json(taskStep);
});

module.exports = router;
