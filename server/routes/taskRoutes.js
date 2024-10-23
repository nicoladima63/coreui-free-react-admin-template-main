const express = require('express');
const Task = require('../models/Task');
const TaskStep = require('../models/TaskStep');
const authenticateToken = require('../middleware/authMiddleware'); // Importa il middleware
const router = express.Router();

// Get all tasks (filtrati per PC e utente)
router.get('/', async (req, res) => {
  const { patient, workid, deliveryDate, completed } = req.query;

  let whereClause = {};
  if (patient) whereClause.patient = patient;
  if (workid) whereClause.workid = workid;
  if (completed) whereClause.completed = completed;

  const records = await Task.findAll({ where: whereClause });
  res.json(records);
});

router.post('/', async (req, res) => {
  const { patient, workid, deliveryDate, completed } = req.body;

  try {
    const record = await Task.create({
      patient,
      workid,
      deliveryDate,
      completed,
    });
    res.status(201).json(record);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Errore nella creazione del record' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { patient, workid, deliveryDate, completed } = req.body;

  try {
    // Trova il fornitore per ID e aggiornalo
    const record = await Task.findByPk(id);
    if (!record) {
      return res.status(404).json({ error: 'Record non trovato' });
    }

    // Aggiorna i campi forniti
    record.patient = patient || record.patient;
    record.workid = workid || record.workid;
    record.deliveryDate = deliveryDate || record.deliveryDate;
    record.completed = completed || record.completed;

    await record.save();
    res.json(record); // Restituisci il fornitore aggiornato
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Errore durante l\'aggiornamento del record' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const record = await Task.findByPk(id);
    if (!record) {
      return res.status(404).json({ error: 'Record non trovato' });
    }

    await record.destroy(); // Elimina il record
    res.json({ message: 'Record eliminato con successo' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Errore durante l\'eliminazione del record' });
  }
});

module.exports = router;
