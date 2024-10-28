// routes/aggregate.js
const express = require('express');
const { getWorksWithDetails, getStepsWithDetails, getTasksWithDetails, getTasksForDashboard } = require('../models/Aggregate');
const router = express.Router();

router.get('/works', async (req, res) => {
  try {
    const works = await getWorksWithDetails();
    res.json(works);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero delle lavorazioni' });
  }
});

router.get('/steps', async (req, res) => {
  try {
    const steps = await getStepsWithDetails();
    res.json(steps);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero delle fasi' });
  }
});

router.get('/tasks', async (req, res) => {
  try {
    const tasks = await getTasksWithDetails();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero dei task' });
  }
});

router.get('/dashboard', async (req, res) => {
  try {
    const tasks = await getTasksForDashboard();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero dei task' });
  }
});

module.exports = router;
