const express = require('express');
const UserController = require('../controllers/userController'); // Importa il controller
const router = express.Router();

// Login dell'utente
router.post('/login', UserController.login);

// Registrazione utente
router.post('/register', UserController.register);

module.exports = router;
