import express from 'express';
import { getOrders, createOrder } from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getOrders)
  .post(protect, createOrder);

export default router;
