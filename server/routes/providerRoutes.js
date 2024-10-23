const express = require('express');
const Provider = require('../models/Provider'); // Modello fornitori
const authenticateToken = require('../middleware/authMiddleware'); // Middleware di autenticazione
const router = express.Router();

// GET - Recupera i fornitori con filtri opzionali
router.get('/', async (req, res) => {
  const { name, email, phone } = req.query;

  let whereClause = {};
  if (name) whereClause.name = name;
  if (email) whereClause.email = email;
  if (phone) whereClause.phone = phone;

  try {
    const records = await Provider.findAll({ where: whereClause });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero dei fornitori' });
  }
});

// POST - Crea un nuovo fornitore
router.post('/', async (req, res) => {
  const { name, email, phone } = req.body;

  try {
    const record = await Provider.create({
      name,
      email,
      phone,
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
  const { name, email, phone } = req.body;

  try {
    // Trova il fornitore per ID e aggiornalo
    const record = await Provider.findByPk(id);
    if (!record) {
      return res.status(404).json({ error: 'Fornitore non trovato' });
    }

    // Aggiorna i campi forniti
    record.name = name || record.name;
    record.email = email || record.email;
    record.phone = phone || record.phone;

    await record.save();
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
    const record = await Provider.findByPk(id);
    if (!record) {
      return res.status(404).json({ error: 'Record non trovato' });
    }

    await record.destroy(); // Elimina il record
    res.json({ message: 'Rcord eliminato con successo' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Errore durante l\'eliminazione del record' });
  }
});

module.exports = router;
