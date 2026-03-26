const express = require('express');
const auth = require('../middleware/auth');
const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');

const router = express.Router();

// Get inventory by warehouse
router.get('/warehouse/:warehouseId', auth, async (req, res) => {
  try {
    const inventory = await Inventory.find({ warehouse: req.params.warehouseId })
      .populate('product')
      .sort({ 'product.expiryDate': 1 }); // FEFO order
    res.json(inventory);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Add inventory
router.post('/', auth, async (req, res) => {
  const { productId, warehouseId, quantity, batchNumber, expiryDate } = req.body;

  try {
    const inventory = new Inventory({
      product: productId,
      warehouse: warehouseId,
      quantity,
      batchNumber,
      expiryDate,
    });

    await inventory.save();
    await inventory.populate('product');
    res.json(inventory);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// FEFO allocation for order
router.post('/allocate', auth, async (req, res) => {
  const { warehouseId, productId, quantity } = req.body;

  try {
    const inventoryItems = await Inventory.find({
      warehouse: warehouseId,
      product: productId,
      quantity: { $gt: 0 }
    }).sort({ expiryDate: 1 }); // FEFO

    let remainingQuantity = quantity;
    const allocation = [];

    for (const item of inventoryItems) {
      if (remainingQuantity <= 0) break;

      const allocateQty = Math.min(remainingQuantity, item.quantity);
      allocation.push({
        inventoryId: item._id,
        quantity: allocateQty,
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate,
      });

      remainingQuantity -= allocateQty;
    }

    if (remainingQuantity > 0) {
      return res.status(400).json({ msg: 'Insufficient stock' });
    }

    res.json(allocation);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;