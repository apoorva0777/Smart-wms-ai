import express from 'express';
import {
  addInventory,
  getInventory,
  getInventoryByWarehouse,
  getInventoryByProduct,
  updateInventory,
  getLowStockAlerts,
  getExpiryAlerts,
  getAllAlerts,
  resolveAlert,
  triggerAlertGeneration
} from '../controllers/inventoryController.js';

const router = express.Router();

/**
 * Inventory Routes
 */

// Add inventory stock
router.post('/', addInventory);

// Get inventory with filters
router.get('/', getInventory);

// Get inventory by warehouse
router.get('/warehouse/:warehouseId', getInventoryByWarehouse);

// Get inventory by product
router.get('/product/:productId', getInventoryByProduct);

// Update inventory
router.put('/:id', updateInventory);

/**
 * Alert Routes
 */

// Get all alerts
router.get('/alerts/all', getAllAlerts);

// Get low stock alerts
router.get('/alerts/low-stock', getLowStockAlerts);

// Get expiry alerts
router.get('/alerts/expiry', getExpiryAlerts);

// Resolve alert
router.put('/alerts/:id/resolve', resolveAlert);

// Trigger alert generation
router.post('/alerts/generate', triggerAlertGeneration);

export default router;
