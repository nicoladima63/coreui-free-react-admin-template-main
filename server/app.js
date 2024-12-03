// app.js (versione aggiornata)
const express = require('express');
const cors = require('cors');
const http = require('http');
const sequelize = require('./database');
const WebSocketManager = require('./websocket/WebSocketManager');
require('dotenv').config();

// Import routes
const pcRoutes = require('./routes/pcRoutes');
const workRoutes = require('./routes/workRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const providerRoutes = require('./routes/providerRoutes');
const userRoutes = require('./routes/userRoutes');
const stepRoutes = require('./routes/stepRoutes');
const taskRoutes = require('./routes/taskRoutes');
const stepTempRoutes = require('./routes/stepTempRoutes');
const aggregateRoutes = require('./routes/aggregateRoutes');
const todoMessageRoutes = require('./routes/todoMessageRoutes');
const pushNotificationRoutes = require('./routes/pushNotification');


const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Initialize WebSocket
WebSocketManager.initialize(server);
console.log('Main: WebSocket initialization completed');


app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/pcs', pcRoutes);
app.use('/api/works', workRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/users', userRoutes);
app.use('/api/steps', stepRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/stepstemp', stepTempRoutes);
app.use('/api/aggregate', aggregateRoutes);
app.use('/api/todos', todoMessageRoutes);
app.use('/api/push', pushNotificationRoutes);

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server funzionante correttamente!' });
});

// Start server
const PORT = process.env.PORT || 5000;

sequelize.sync().then(() => {
  server.listen(PORT, () => {
    console.log(`Server HTTP avviato su http://localhost:${PORT}`);
    console.log('Server WebSocket in ascolto sulla stessa porta');
  });
}).catch(err => console.error("Errore di connessione al DB:", err));
