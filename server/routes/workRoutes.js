const express = require('express');
const Work = require('../models/Work');
const authenticateToken = require('../middleware/authMiddleware'); // Importa il middleware
const router = express.Router();

// Get all works 
router.get('/', async (req, res) => {
  const {name, providerid, categoryid } = req.query;

  let whereClause = {};
  if (name) whereClause.name = name;
  if (providerid) whereClause.providerid = providerid;
  if (categoryid) whereClause.categoryid = categoryid;

  try {
    const records = await Work.findAll({ where: whereClause });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero delle lavorazioni' });
  }
});

router.post('/', async (req, res) => {
  const { name, providerid, categoryid } = req.body;

  try {
    const record = await Work.create({
      name,
      providerid,
      categoryid,
    });
    res.status(201).json(record);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Errore nella creazione del record' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, providerid, categoryid } = req.body;

  try {
    // Trova il fornitore per ID e aggiornalo
    const record = await Work.findByPk(id);
    if (!record) {
      return res.status(404).json({ error: 'Record non trovato' });
    }

    // Aggiorna i campi forniti
    record.name = name || record.name;
    record.providerid = providerid || record.providerid;
    record.categoryid = categoryid || record.categoryid;

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
    const record = await Work.findByPk(id);
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
