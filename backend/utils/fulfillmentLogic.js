import { Warehouse, Inventory, Alert } from '../models/models.js';

/**
 * WAREHOUSE SELECTION LOGIC
 * 1. Match order pincode to warehouse pincode (exact match)
 * 2. If not found, match by state
 * 3. Fallback to nearest warehouse
 */
export async function selectWarehouse(orderPincode, state) {
  try {
    // Step 1: Exact pincode match
    let warehouse = await Warehouse.findOne({ pincode: orderPincode });
    
    if (warehouse) {
      console.log(`✓ Warehouse selected by pincode: ${warehouse.warehouseId}`);
      return warehouse;
    }

    // Step 2: State match
    warehouse = await Warehouse.findOne({ state: state });
    
    if (warehouse) {
      console.log(`✓ Warehouse selected by state: ${warehouse.warehouseId}`);
      return warehouse;
    }

    // Step 3: Fallback - first available warehouse
    warehouse = await Warehouse.findOne();
    
    if (warehouse) {
      console.log(`✓ Fallback warehouse selected: ${warehouse.warehouseId}`);
      return warehouse;
    }

    throw new Error('No warehouses available');
  } catch (error) {
    throw new Error(`Warehouse selection failed: ${error.message}`);
  }
}

/**
 * FEFO (First Expiry First Out) ALLOCATION LOGIC
 * 1. Sort inventory by expiryDate (ascending)
 * 2. Allocate from earliest expiry first
 * 3. Update inventory quantity
 * 4. Create allocation record
 */
export async function allocateInventoryWithFEFO(order, warehouse) {
  const allocations = [];
  const unfulfilledItems = [];

  for (const item of order.items) {
    let remainingQuantity = item.quantity;
    let allocatedQuantity = 0;

    // Get all inventory for this product in warehouse, sorted by expiry date (FEFO)
    const inventory = await Inventory.find({
      productId: item.productId,
      warehouseId: warehouse.warehouseId,
      status: 'active',
      expiryDate: { $gt: new Date() } // Only non-expired
    })
      .sort({ expiryDate: 1 }) // Sort by expiry date ascending (earliest first)
      .exec();

    // Allocate from available stock
    for (const stock of inventory) {
      if (remainingQuantity <= 0) break;

      const allocateQty = Math.min(remainingQuantity, stock.quantity);
      
      allocations.push({
        productId: item.productId,
        productName: item.name,
        quantity: item.quantity,
        allocatedQuantity: allocateQty,
        warehouseId: warehouse.warehouseId,
        bin: stock.bin,
        batchId: stock.batchId,
        expiryDate: stock.expiryDate
      });

      // Reduce inventory
      stock.quantity -= allocateQty;
      stock.lastUpdated = new Date();
      
      if (stock.quantity === 0) {
        stock.status = 'inactive';
      }
      
      await stock.save();

      allocatedQuantity += allocateQty;
      remainingQuantity -= allocateQty;
    }

    // If not fully allocated, add to unfulfilled items
    if (remainingQuantity > 0) {
      unfulfilledItems.push({
        productId: item.productId,
        productName: item.name,
        requestedQuantity: item.quantity,
        allocatedQuantity: allocatedQuantity,
        reason: `Out of stock - Only ${allocatedQuantity} available`
      });
    }
  }

  return { allocations, unfulfilledItems };
}

/**
 * INVENTORY ALERT GENERATION
 * 1. Generate low stock alerts (qty below threshold)
 * 2. Generate expiry alerts (expiry within 5 days)
 */
export async function generateInventoryAlerts(warehouseId = null) {
  const query = { status: 'active' };
  if (warehouseId) {
    query.warehouseId = warehouseId;
  }

  const inventory = await Inventory.find(query);
  const alerts = [];

  const today = new Date();
  const fiveDaysLater = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);

  for (const stock of inventory) {
    // Low Stock Alert (threshold: 10 units)
    if (stock.quantity < 10 && stock.quantity > 0) {
      const existingAlert = await Alert.findOne({
        alertType: 'low_stock',
        productId: stock.productId,
        warehouseId: stock.warehouseId,
        status: 'active'
      });

      if (!existingAlert) {
        const alert = new Alert({
          alertType: 'low_stock',
          productId: stock.productId,
          productName: stock.productName,
          warehouseId: stock.warehouseId,
          batchId: stock.batchId,
          currentQuantity: stock.quantity,
          threshold: 10,
          severity: stock.quantity < 5 ? 'high' : 'medium',
          message: `Low stock for ${stock.productName}: ${stock.quantity} units remaining`
        });
        await alert.save();
        alerts.push(alert);
      }
    }

    // Expiry Alert (expiry within 5 days)
    if (stock.expiryDate <= fiveDaysLater && stock.expiryDate > today) {
      const severity = stock.expiryDate <= new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000) ? 'high' : 'medium';
      
      const existingAlert = await Alert.findOne({
        alertType: 'expiry_warning',
        productId: stock.productId,
        batchId: stock.batchId,
        warehouseId: stock.warehouseId,
        status: 'active'
      });

      if (!existingAlert) {
        const alert = new Alert({
          alertType: 'expiry_warning',
          productId: stock.productId,
          productName: stock.productName,
          warehouseId: stock.warehouseId,
          batchId: stock.batchId,
          expiryDate: stock.expiryDate,
          currentQuantity: stock.quantity,
          severity: severity,
          message: `Expiry warning for ${stock.productName} (Batch: ${stock.batchId}): Expires on ${stock.expiryDate.toDateString()}`
        });
        await alert.save();
        alerts.push(alert);
      }
    }

    // Mark expired inventory
    if (stock.expiryDate <= today) {
      stock.status = 'expired';
      await stock.save();
    }
  }

  return alerts;
}

/**
 * Mark expired inventory and mark critical expiry alerts
 */
export async function cleanupExpiredInventory() {
  const today = new Date();
  
  // Mark expired stock
  const expired = await Inventory.updateMany(
    { expiryDate: { $lt: today }, status: 'active' },
    { status: 'expired', lastUpdated: today }
  );

  console.log(`✓ Marked ${expired.modifiedCount} inventory items as expired`);

  // Mark critical expiry alerts
  await Alert.updateMany(
    { expiryDate: { $lt: today }, alertType: 'expiry_warning', status: 'active' },
    { alertType: 'expiry_critical', severity: 'high', status: 'resolved' }
  );

  return expired.modifiedCount;
}

export default {
  selectWarehouse,
  allocateInventoryWithFEFO,
  generateInventoryAlerts,
  cleanupExpiredInventory
};
