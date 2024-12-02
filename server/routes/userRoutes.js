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

// Get a single user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id); // Usa findByPk per trovare un utente per ID
    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }
    res.json(user);
  } catch (error) {
    console.error("Errore dettagliato:", error);
    res.status(500).json({ error: 'Errore nel recupero dell\'utente' });
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
    const user = await User.findOne({
      where: { email },
      // Specifica gli attributi che vuoi recuperare
      attributes: ['id', 'email', 'name', 'password'] // Aggiungi altri campi necessari
    });

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
      { expiresIn: '30d' }
    );

    // Prepara l'oggetto user escludendo dati sensibili
    const userForClient = {
      id: user.id,
      email: user.email,
      name: user.name,
      // Aggiungi qui altri campi che vuoi inviare al client
    };

    // Restituisce sia il token che i dati dell'utente
    res.json({
      accessToken,
      user: userForClient
    });

  } catch (error) {
    console.error('Errore durante il login:', error);
    res.status(500).json({ error: 'Errore nel login' });
  }
});


// Update user
router.put('/:id', async (req, res) => {
  const { name, email, pc_id } = req.body;
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }

    // Aggiorna i campi
    user.name = name || user.name;
    user.email = email || user.email;
    user.pc_id = pc_id || user.pc_id;

    // Salva le modifiche
    await user.save();

    res.json(user);
  } catch (error) {
    console.error("Errore dettagliato:", error);
    res.status(500).json({ error: 'Errore nell\'aggiornamento dell\'utente' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Trova l'utente per ID
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }

    // Elimina l'utente
    await user.destroy();

    res.status(200).json({ message: 'Utente eliminato con successo' });
  } catch (error) {
    console.error("Errore dettagliato:", error);
    res.status(500).json({ error: 'Errore nell\'eliminazione dell\'utente' });
  }
});


module.exports = router;
