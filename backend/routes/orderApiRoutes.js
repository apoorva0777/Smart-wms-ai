import express from 'express';
import {
  processOrder,
  getAllOrders,
  getOrderById,
  getOrdersByLocation,
  getOrderStats,
  updateOrderStatus
} from '../controllers/orderController.js';

const router = express.Router();

/**
 * Order Routes
 */

// Process new order with FEFO allocation
router.post('/', processOrder);

// Get all orders with filters (status, warehouse, pagination)
router.get('/', getAllOrders);

// Get order statistics
router.get('/summary/stats', getOrderStats);

// Get orders by location (pincode/state)
router.get('/search/by-location', getOrdersByLocation);

// Get specific order
router.get('/:orderId', getOrderById);

// Update order status
router.put('/:orderId/status', updateOrderStatus);

export default router;
