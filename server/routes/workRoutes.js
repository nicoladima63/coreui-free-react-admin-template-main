const express = require('express');
const Work = require('../models/Work');
const authenticateToken = require('../middleware/authMiddleware'); // Importa il middleware
const router = express.Router();

// Get all works 
router.get('/', async (req, res) => {
  const {name, provider_id } = req.query;

  let whereClause = {};
  if (name) whereClause.name = name;
  if (provider_id) whereClause.provider_id = provider_id;

  const works = await Work.findAll({ where: whereClause });
  res.json(works);
});


module.exports = router;
