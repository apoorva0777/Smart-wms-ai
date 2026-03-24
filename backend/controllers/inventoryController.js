import { Inventory, Alert } from '../models/models.js';
import { generateInventoryAlerts, cleanupExpiredInventory } from '../utils/fulfillmentLogic.js';

/**
 * Add inventory stock
 * POST /api/inventory
 */
export async function addInventory(req, res) {
  try {
    const { productId, productName, warehouseId, bin, batchId, quantity, expiryDate } = req.body;

    // Validation
    if (!productId || !warehouseId || !bin || !batchId || !quantity || !expiryDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if same batch already exists
    const existingBatch = await Inventory.findOne({
      productId,
      warehouseId,
      batchId
    });

    if (existingBatch) {
      // Update quantity
      existingBatch.quantity += parseInt(quantity);
      existingBatch.lastUpdated = new Date();
      await existingBatch.save();

      return res.status(200).json({
        success: true,
        message: 'Inventory updated for existing batch',
        inventory: existingBatch
      });
    }

    // Create new inventory record
    const inventory = new Inventory({
      productId,
      productName,
      warehouseId,
      bin,
      batchId,
      quantity: parseInt(quantity),
      expiryDate: new Date(expiryDate),
      status: 'active'
    });

    await inventory.save();

    res.status(201).json({
      success: true,
      message: 'Inventory added successfully',
      inventory
    });

  } catch (error) {
    console.error('Error adding inventory:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get inventory with filters
 * GET /api/inventory?warehouseId=WH_DELHI&status=active
 */
export async function getInventory(req, res) {
  try {
    const { warehouseId, productId, status = 'active', skip = 0, limit = 10 } = req.query;
    const query = { status };

    if (warehouseId) query.warehouseId = warehouseId;
    if (productId) query.productId = productId;

    const inventory = await Inventory
      .find(query)
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .sort({ expiryDate: 1 })
      .exec();

    const total = await Inventory.countDocuments(query);

    res.json({
      success: true,
      total,
      count: inventory.length,
      inventory
    });

  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get inventory by warehouse
 * GET /api/inventory/warehouse/:warehouseId
 */
export async function getInventoryByWarehouse(req, res) {
  try {
    const { warehouseId } = req.params;
    const inventory = await Inventory
      .find({ warehouseId, status: 'active' })
      .sort({ expiryDate: 1 });

    // Aggregate by product
    const summary = {};
    inventory.forEach(item => {
      if (!summary[item.productId]) {
        summary[item.productId] = {
          productId: item.productId,
          productName: item.productName,
          totalQuantity: 0,
          batches: []
        };
      }
      summary[item.productId].totalQuantity += item.quantity;
      summary[item.productId].batches.push({
        batchId: item.batchId,
        bin: item.bin,
        quantity: item.quantity,
        expiryDate: item.expiryDate
      });
    });

    res.json({
      success: true,
      warehouseId,
      totalSKUs: Object.keys(summary).length,
      summary: Object.values(summary),
      rawInventory: inventory
    });

  } catch (error) {
    console.error('Error fetching warehouse inventory:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get inventory by product
 * GET /api/inventory/product/:productId
 */
export async function getInventoryByProduct(req, res) {
  try {
    const { productId } = req.params;
    const inventory = await Inventory
      .find({ productId, status: 'active' })
      .sort({ warehouseId: 1, expiryDate: 1 });

    if (inventory.length === 0) {
      return res.status(404).json({ error: 'Product not found in inventory' });
    }

    // Aggregate by warehouse
    const summary = {};
    inventory.forEach(item => {
      if (!summary[item.warehouseId]) {
        summary[item.warehouseId] = {
          warehouseId: item.warehouseId,
          totalQuantity: 0,
          batches: []
        };
      }
      summary[item.warehouseId].totalQuantity += item.quantity;
      summary[item.warehouseId].batches.push({
        batchId: item.batchId,
        bin: item.bin,
        quantity: item.quantity,
        expiryDate: item.expiryDate
      });
    });

    const totalQuantity = inventory.reduce((sum, item) => sum + item.quantity, 0);

    res.json({
      success: true,
      productId: inventory[0].productId,
      productName: inventory[0].productName,
      totalQuantity,
      warehouseBreakdown: Object.values(summary),
      rawInventory: inventory
    });

  } catch (error) {
    console.error('Error fetching product inventory:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Update inventory quantity
 * PUT /api/inventory/:id
 */
export async function updateInventory(req, res) {
  try {
    const { id } = req.params;
    const { quantity, status } = req.body;

    const inventory = await Inventory.findByIdAndUpdate(
      id,
      {
        ...(quantity !== undefined && { quantity: parseInt(quantity) }),
        ...(status && { status }),
        lastUpdated: new Date()
      },
      { new: true }
    );

    if (!inventory) {
      return res.status(404).json({ error: 'Inventory record not found' });
    }

    res.json({
      success: true,
      message: 'Inventory updated',
      inventory
    });

  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get low stock alerts
 * GET /api/inventory/alerts/low-stock
 */
export async function getLowStockAlerts(req, res) {
  try {
    const alerts = await Alert
      .find({ alertType: 'low_stock', status: 'active' })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: alerts.length,
      alerts
    });

  } catch (error) {
    console.error('Error fetching low stock alerts:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get expiry alerts
 * GET /api/inventory/alerts/expiry
 */
export async function getExpiryAlerts(req, res) {
  try {
    const alerts = await Alert
      .find({ 
        alertType: { $in: ['expiry_warning', 'expiry_critical'] },
        status: 'active'
      })
      .sort({ expiryDate: 1 });

    res.json({
      success: true,
      count: alerts.length,
      alerts
    });

  } catch (error) {
    console.error('Error fetching expiry alerts:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get all alerts
 * GET /api/inventory/alerts
 */
export async function getAllAlerts(req, res) {
  try {
    const { status = 'active', skip = 0, limit = 10 } = req.query;
    const query = { status };

    const alerts = await Alert
      .find(query)
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Alert.countDocuments(query);

    res.json({
      success: true,
      total,
      count: alerts.length,
      alerts
    });

  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Resolve/acknowledge alert
 * PUT /api/inventory/alerts/:id/resolve
 */
export async function resolveAlert(req, res) {
  try {
    const { id } = req.params;
    const { newStatus = 'resolved' } = req.body;

    const alert = await Alert.findByIdAndUpdate(
      id,
      { status: newStatus, resolvedAt: new Date() },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({
      success: true,
      message: 'Alert resolved',
      alert
    });

  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Trigger inventory alerts manually
 * POST /api/inventory/alerts/generate
 */
export async function triggerAlertGeneration(req, res) {
  try {
    const { warehouseId } = req.body;

    // Cleanup expired inventory first
    await cleanupExpiredInventory();

    // Generate new alerts
    const alerts = await generateInventoryAlerts(warehouseId);

    res.json({
      success: true,
      message: `Generated ${alerts.length} new alerts`,
      alerts
    });

  } catch (error) {
    console.error('Error generating alerts:', error);
    res.status(500).json({ error: error.message });
  }
}

// Legacy exports for backward compatibility
export const getInventoryController = getInventory;
export const createInventoryController = addInventory;

export default {
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
