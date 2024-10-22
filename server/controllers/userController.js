const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models/User');

class UserController {
  // Login dell'utente
  static async login(req, res) {
    const { email, password } = req.body;

    try {
      const user = await User.findOne({ where: { email } });
      if (!user) return res.status(400).json({ error: 'Utente non trovato' });

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) return res.status(400).json({ error: 'Password errata' });

      // Genera token JWT
      const accessToken = jwt.sign({ userId: user.id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.json({ accessToken });
    } catch (error) {
      console.error('Errore nel login:', error);
      res.status(500).json({ error: 'Errore interno del server' });
    }
  }

  // Registrazione utente
  static async register(req, res) {
    const { name, email, password } = req.body;

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({ name, email, password: hashedPassword });

      res.status(201).json(user);
    } catch (error) {
      console.error('Errore nella registrazione:', error);
      res.status(500).json({ error: 'Errore interno del server' });
    }
  }
}

module.exports = UserController;
