const express = require('express');
const StepTemp = require('../models/StepTemp');
const authenticateToken = require('../middleware/authMiddleware'); // Importa il middleware
const router = express.Router();

//get steps for a task
router.get('/', async (req, res) => {
  const { workid, name, userid, completed,order } = req.query;

  let whereClause = {};
  if (workid) whereClause.workid = workid;
  if (name) whereClause.name = name;
  if (userid) whereClause.userid = userid;
  if (completed) whereClause.completed = completed;
  if (order) whereClause.order = order;

  const records = await StepTemp.findAll({ where: whereClause });
  res.json(records);
});

router.post('/', async (req, res) => {
  const { workid, name, userid, completed, order } = req.body;

  try {
    const record = await StepTemp.create({
      workid,
      name,
      userid,
      completed,
      order
    });
    res.status(201).json(record);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Errore nella creazione del record' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { workid, name, userid, completed,order } = req.body;

  try {
    // Trova il fornitore per ID e aggiornalo
    const record = await StepTemp.findByPk(id);
    if (!record) {
      return res.status(404).json({ error: 'Record non trovato' });
    }

    // Aggiorna i campi forniti
    record.workid = workid || record.workid;
    record.name = name || record.name;
    record.userid = userid || record.userid;
    record.completed = completed || record.completed;
    record.order = order || record.order;

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
    const record = await StepTemp.findByPk(id);
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
