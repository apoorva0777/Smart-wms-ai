const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');

const router = express.Router();

const ORDER_STATUSES = ['allocated', 'partial', 'pending', 'shipped'];

const buildOrderNumber = async () => {
  const count = await Order.countDocuments();
  return `SO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
};

router.get('/', auth, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('items.product', 'name sku')
      .populate('items.warehouse', 'name location')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.post(
  '/',
  auth,
  [
    body('customerName').trim().notEmpty().withMessage('Customer name is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.product').notEmpty().withMessage('Product is required'),
    body('items.*.warehouse').notEmpty().withMessage('Warehouse is required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Unit price cannot be negative'),
    body('status').optional().isIn(ORDER_STATUSES).withMessage('Invalid status'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      customerName,
      location = {},
      items,
      status = 'pending',
      expectedDeliveryDate,
    } = req.body;

    try {
      const productIds = items.map((item) => item.product);
      const warehouseIds = items.map((item) => item.warehouse);

      const [products, warehouses] = await Promise.all([
        Product.find({ _id: { $in: productIds } }, '_id'),
        Warehouse.find({ _id: { $in: warehouseIds } }, '_id'),
      ]);

      if (products.length !== new Set(productIds).size) {
        return res.status(400).json({ msg: 'One or more selected products are invalid' });
      }

      if (warehouses.length !== new Set(warehouseIds).size) {
        return res.status(400).json({ msg: 'One or more selected warehouses are invalid' });
      }

      const totalValue = items.reduce(
        (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
        0
      );

      const order = new Order({
        orderNumber: await buildOrderNumber(),
        customerName,
        location: {
          city: location.city || '',
          state: location.state || '',
          zipCode: location.zipCode || '',
        },
        items,
        totalValue,
        status,
        expectedDeliveryDate: expectedDeliveryDate || null,
        createdBy: req.user?.id,
      });

      await order.save();
      await order.populate('items.product', 'name sku');
      await order.populate('items.warehouse', 'name location');

      res.json(order);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;
