const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');

const sequelize = require('./database'); // Connessione al DB

const pcRoutes = require('./routes/pcRoutes');
const workRoutes = require('./routes/workRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const providerRoutes = require('./routes/providerRoutes');
const userRoutes = require('./routes/userRoutes');
const stepRoutes = require('./routes/stepRoutes');
const taskRoutes = require('./routes/taskRoutes');
const stepTempRoutes = require('./routes/stepTempRoutes');
const aggregateRoutes = require('./routes/aggregateRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

require('dotenv').config(); // Assicurati che le variabili di ambiente siano caricate

const app = express();
const PORT = 5000;

// Crea il server HTTP che gestisce Express e WebSocket
const server = http.createServer(app);

// Inizializza WebSocket sullo stesso server di Express
const wss = new WebSocket.Server({ server });

// Mappa per gestire le connessioni con ogni client
const clients = new Map();

// Configura la connessione WebSocket
wss.on('connection', (ws, req) => {
  const clientID = req.socket.remoteAddress;
  console.log(`Connessione stabilita con ${clientID}`);

  // Aggiungi il client alla mappa delle connessioni
  clients.set(clientID, ws);

  // Funzione per inviare un messaggio di test ogni 5 secondi
  const sendTestMessage = () => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'test', message: 'Questo è un messaggio di test dal server!' }));
    }
  };

  // Invia il messaggio di test ogni 5 secondi
  //const interval = setInterval(sendTestMessage, 5000);

  // Gestione della chiusura della connessione
  ws.on('close', () => {
    console.log(`Connessione chiusa con ${clientID}`);
    clients.delete(clientID);
    //clearInterval(interval); // Ferma l'invio dei messaggi quando il client si disconnette
  });

  // Gestione dei messaggi in arrivo dal client (es. conferma lettura)
  ws.on('message', (data) => {
    //console.log(`Messaggio ricevuto da ${clientID}: ${message}`);

    const { to, message } = JSON.parse(data);
    const recipientSocket = clients[to]; // Assuming `clients` is an object mapping IDs to sockets
    if (recipientSocket) {
      recipientSocket.send(JSON.stringify({ message }));
    }
  });

});

app.use(cors());
app.use(express.json());

// Rotte API
app.use('/api/pcs', pcRoutes);
app.use('/api/works', workRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/users', userRoutes);
app.use('/api/steps', stepRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/stepstemp', stepTempRoutes);
app.use('/api/aggregate', aggregateRoutes);
app.use('/api/notifications', notificationRoutes);

// Rotta di test per verificare che il server funzioni
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server funzionante correttamente!' });
});

// Inizializzazione del database e avvio del server HTTP (Express + WebSocket)
sequelize.sync().then(() => {
  server.listen(PORT, () => {  // Avvio del server HTTP
    console.log(`Server avviato su http://localhost:${PORT}`);
  });
}).catch(err => console.error("Errore di connessione al DB:", err));
