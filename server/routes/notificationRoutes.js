const express = require('express');
const router = express.Router();
const PC = require('../models/PC');
const { clients } = require('../app'); // Importiamo la mappa delle connessioni WebSocket

// Invia una notifica a un singolo PC
router.post('/send', async (req, res) => {
  const { pcId, message } = req.body;

  try {
    const pc = await PC.findByPk(pcId);
    if (!pc) {
      return res.status(404).json({ error: 'PC non trovato' });
    }

    const clientSocket = clients.get(pc.ipAddress); // Identifica il WebSocket usando l'indirizzo IP del PC
    if (clientSocket) {
      clientSocket.send(JSON.stringify({ message })); // Invia il messaggio al PC con WebSocket
      res.status(200).json({ success: true, message: 'Notifica inviata con successo' });
    } else {
      res.status(400).json({ error: 'Il PC è offline o non è connesso' });
    }
  } catch (error) {
    console.error('Errore nell\'invio della notifica:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Recupera le notifiche per un PC specifico (esempio per gestire le notifiche in sospeso)
router.get('/:pcId/notifications', async (req, res) => {
  const { pcId } = req.params;

  // Qui potremmo aggiungere logica per recuperare le notifiche non lette o recenti dal database
  res.status(200).json({ notifications: [] }); // Placeholder per ora
});

module.exports = router;
