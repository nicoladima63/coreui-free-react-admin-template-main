const express = require('express');
const cors = require('cors');
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

require('dotenv').config(); // Assicurati che le variabili di ambiente siano caricate

const app = express();
const PORT = 5000;

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

// Rotta di test per verificare che il server funzioni
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server funzionante correttamente!' });
});

//app.get('/setup', (req, res) => {
//  res.render('setup'); // O come gestisci il rendering delle tue pagine
//});

// Inizializzazione del database e avvio del server
sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Server avviato su http://localhost:${PORT}`);
  });
}).catch(err => console.error("Errore di connessione al DB:", err));
