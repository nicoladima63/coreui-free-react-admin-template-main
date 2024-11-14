// routes/aggregate.js
const express = require('express');
const {
  getWorksWithDetails,
  getStepsWithDetails,
  getStepsForWork,
  getTasksWithDetails,
  getTasksForDashboard
} = require('../models/Aggregate');
const router = express.Router();

router.get('/works', async (req, res) => {
  try {
    const { page, limit, search, sort, order, categoryid, providerid } = req.query;

    const works = await getWorksWithDetails({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      search: search || '',
      sort: sort || 'id',
      order: order || 'ASC',
      categoryid: categoryid ? parseInt(categoryid) : null,
      providerid: providerid ? parseInt(providerid) : null
    });

    res.json(works);
  } catch (error) {
    console.error('Errore aggregazione works:', error);
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

router.get('/stepstemp', async (req, res) => {
  const { workid } = req.query; // Recupera il parametro workId dalla query

  try {
    const steps = await getStepsForWork(workid); // Passa workId alla funzione di recupero
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
