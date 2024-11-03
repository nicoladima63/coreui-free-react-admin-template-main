const express = require('express');
const User = require('../models/User'); // Importa il controller
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Get all Users
router.get('/', async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero degli utenti' });
  }
});

// Register. Crea un nuovo utente
router.post('/register', 
  [
    body('name').notEmpty().withMessage('Il nome è obbligatorio'),
    body('email').isEmail().withMessage('Email non valida'),
    body('password').isLength({ min: 6 }).withMessage('La password deve avere almeno 6 caratteri'),
    body('pc_id').optional().isInt().withMessage('pc_id deve essere un numero intero')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, pc_id } = req.body;

    try {
      // Controlla se l'email è già in uso
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email già in uso' });
      }

      // Hash della password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Creazione utente
      const user = await User.create({
        name,
        email,
        password: hashedPassword, // Salva la password hashata
        pc_id
      });

      res.json(user);
    } catch (error) {
      console.error("Errore dettagliato:", error);
      res.status(500).json({ error: 'Errore nella creazione dell\'utente' });
    }
  }
);

// Login dell'utente
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Trova l'utente in base all'email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Utente non trovato' });
    }

    // Confronta la password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Password errata' });
    }

    // Genera il token JWT
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '1h' }
    );

    // Restituisce il token JWT
    res.json({ accessToken });
  } catch (error) {
    res.status(500).json({ error: 'Errore nel login' });
  }
});

module.exports = router;
