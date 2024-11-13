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

router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;

  try {
    // Trova lo step con le relazioni necessarie
    const step = await Step.findByPk(id, {
      include: [
        {
          model: Task,
          as: 'task'
        },
        {
          model: User,
          as: 'user'
        }
      ]
    });

    if (!step) {
      return res.status(404).json({ error: 'Step non trovato' });
    }

    // Aggiorna lo stato completed
    await step.update({ completed });

    // Se lo step è stato completato, gestisci le notifiche
    if (completed) {
      try {
        await WebSocketManager.handleStepCompletion(step, step.taskid);
      } catch (notificationError) {
        console.error('Errore nell\'invio della notifica:', notificationError);
        // Continuiamo anche se la notifica fallisce
      }
    }

    res.json(step);
  } catch (error) {
    console.error('Errore durante l\'aggiornamento dello step:', error);
    res.status(500).json({ error: 'Errore durante l\'aggiornamento dello step' });
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
