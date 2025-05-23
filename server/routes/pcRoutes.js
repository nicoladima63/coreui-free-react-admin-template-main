const express = require('express');
const PC = require('../models/PC');
const router = express.Router();

// Get all PCs
router.get('/', async (req, res) => {
  const pcs = await PC.findAll();
  res.json(pcs);
});

// Crea un nuovo PC
router.post('/', async (req, res) => {
  const { name, location,ipAddress,status,lastOnline,userid } = req.body;
  const pc = await PC.create({ name, location,ipAddress,status,lastOnline,userid });
  res.json(pc);
});

module.exports = router;
