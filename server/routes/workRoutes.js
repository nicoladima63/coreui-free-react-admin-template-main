const express = require('express');
const Work = require('../models/Work');
const StepTemp = require('../models/StepTemp');
const authenticateToken = require('../middleware/authMiddleware'); // Importa il middleware
const router = express.Router();

// Get all works 
//router.get('/', async (req, res) => {
//  const {name, providerid, categoryid } = req.query;

//  let whereClause = {};
//  if (name) whereClause.name = name;
//  if (providerid) whereClause.providerid = providerid;
//  if (categoryid) whereClause.categoryid = categoryid;

//  try {
//    const records = await Work.findAll({ where: whereClause });
//    res.json(records);
//  } catch (error) {
//    res.status(500).json({ error: 'Errore nel recupero delle lavorazioni' });
//  }
//});

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'id', order = 'ASC' } = req.query;

    const offset = (page - 1) * limit;
    const { count, rows } = await Work.findAndCountAll({
      limit: parseInt(limit),
      offset,
      order: [[sort, order]]
    });

    res.json({
      works: rows,
      total: count,
      pages: Math.ceil(count / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch works' });
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

// Endpoint per riordinare i passaggi di un Work
//router.patch('/:workId/reorder-steps', async (req, res) => {
//  const { workId } = req.params;
//  const { stepId, newPosition } = req.body; // `stepId` da spostare, `newPosition` è l'indice di destinazione (0-based)

//  try {
//    // Recupera tutti i passaggi ordinati per la sequenza corrente
//    const steps = await Step.findAll({
//      where: { workId },
//      order: [['order', 'ASC']],
//    });

//    // Trova l'indice del passaggio che si vuole spostare
//    const stepIndex = steps.findIndex(step => step.id === stepId);
//    if (stepIndex === -1) {
//      return res.status(404).json({ error: 'Step non trovato nel work specificato' });
//    }

//    // Rimuove il passaggio dalla sua posizione originale
//    const [stepToMove] = steps.splice(stepIndex, 1);

//    // Inserisce il passaggio nella nuova posizione
//    steps.splice(newPosition, 0, stepToMove);

//    // Aggiorna l'ordine di tutti i passaggi
//    await Promise.all(
//      steps.map((step, index) =>
//        Step.update({ order: index + 1 }, { where: { id: step.id } })
//      )
//    );

//    res.json({ success: true, message: 'Steps riordinati con successo' });
//  } catch (error) {
//    console.error(error);
//    res.status(500).json({ error: 'Errore durante il riordino dei passaggi' });
//  }
//});
router.patch('/:workId/reorder-steps', async (req, res) => {
  const { workId } = req.params;
  const { steps } = req.body; // Passiamo l'intero array di passi con i nuovi ordini

  try {
    // Verifica che ogni passo nel body abbia un `order` valido
    const promises = steps.map((step, index) =>
      StepTemp.update({ order: step.order }, { where: { id: step.id, workId } })
    );

    // Attende che tutti gli aggiornamenti siano completati
    await Promise.all(promises);

    res.json({ success: true, message: 'Steps riordinati con successo' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Errore durante il riordino dei passaggi' });
  }
});



module.exports = router;
