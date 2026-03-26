const express = require('express');
const auth = require('../middleware/auth');
const Warehouse = require('../models/Warehouse');

const router = express.Router();

// Get all warehouses
router.get('/', auth, async (req, res) => {
  try {
    const warehouses = await Warehouse.find();
    res.json(warehouses);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Add warehouse
router.post('/', auth, async (req, res) => {
  const { name, location, capacity } = req.body;

  try {
    const warehouse = new Warehouse({
      name,
      location,
      capacity,
    });

    await warehouse.save();
    res.json(warehouse);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;