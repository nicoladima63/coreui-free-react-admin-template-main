const express = require('express');
const Category = require('../models/Category'); // Modello fornitori
const authenticateToken = require('../middleware/authMiddleware'); // Middleware di autenticazione
const router = express.Router();

// GET - Recupera i fornitori con filtri opzionali
router.get('/', async (req, res) => {
  const { name, color } = req.query;

  let whereClause = {};
  if (name) whereClause.name = name;
  if (color) whereClause.email = color;

  try {
    const records = await Category.findAll({ where: whereClause });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero dei fornitori' });
  }
});

// POST - Crea un nuovo fornitore
router.post('/', async (req, res) => {
  const { name, color } = req.body;

  try {
    const record = await Category.create({
      name,
      color,
    });
    res.status(201).json(record);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Errore nella creazione del record' });
  }
});

// PUT - Modifica un fornitore esistente
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name,color } = req.body;

  try {
    // Trova il fornitore per ID e aggiornalo
    const record = await Category.findByPk(id);
    if (!record) {
      return res.status(404).json({ error: 'Fornitore non trovato' });
    }

    // Aggiorna i campi forniti
    record.name = name || record.name;
    record.email = color || record.color;

    await provider.save();
    res.json(record); // Restituisci il fornitore aggiornato
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Errore durante l\'aggiornamento del record' });
  }
});

// DELETE - Elimina un fornitore
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const record = await Category.findByPk(id);
    if (!record) {
      return res.status(404).json({ error: 'Fornitore non trovato' });
    }

    await record.destroy(); // Elimina il record
    res.json({ message: 'Fornitore eliminato con successo' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Errore durante l\'eliminazione del record' });
  }
});

module.exports = router;
