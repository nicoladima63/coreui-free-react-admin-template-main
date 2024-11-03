const express = require('express');
const Step = require('../models/Step');
const authenticateToken = require('../middleware/authMiddleware'); // Importa il middleware
const router = express.Router();

//get steps for a task
router.get('/', async (req, res) => {
  const { taskid, name, userid, completed } = req.query;

  let whereClause = {};
  if (taskid) whereClause.taskid = taskid;
  if (name) whereClause.name = name;
  if (userid) whereClause.userid = assigned_user_id;
  if (completed) whereClause.completed = userid;

  const records = await Step.findAll({ where: whereClause });
  res.json(records);
});

router.post('/', async (req, res) => {
  const { taskid, name, userid, completed } = req.body;

  try {
    const record = await Step.create({
      taskid,
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
  const { taskid, name, userid, completed, order } = req.body;

  try {
    // Trova il fornitore per ID e aggiornalo
    const record = await Step.findByPk(id);
    if (!record) {
      return res.status(404).json({ error: 'Record non trovato' });
    }

    // Aggiorna i campi forniti
    record.taskid = taskid || record.taskid;
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
    const record = await Step.findByPk(id);
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
