import { Order, Inventory } from '../models/models.js';
import { selectWarehouse, allocateInventoryWithFEFO, generateInventoryAlerts } from '../utils/fulfillmentLogic.js';

/**
 * Process a new order with FEFO allocation
 * POST /api/orders
 */
export async function processOrder(req, res) {
  try {
    const { orderId, customerName, pincode, state, city, items } = req.body;

    // Validation
    if (!orderId || !items || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields: orderId, items' });
    }

    // Check if order already exists
    const existingOrder = await Order.findOne({ orderId });
    if (existingOrder) {
      return res.status(409).json({ error: 'Order already exists' });
    }

    // Step 1: Select appropriate warehouse
    const warehouse = await selectWarehouse(pincode, state);

    // Step 2: Allocate inventory using FEFO
    const { allocations, unfulfilledItems } = await allocateInventoryWithFEFO(
      { items },
      warehouse
    );

    // Determine order status
    let status = 'fulfilled';
    if (allocations.length === 0) {
      status = 'pending';
    } else if (unfulfilledItems.length > 0) {
      status = 'partially_allocated';
    } else {
      status = 'allocated';
    }

    // Step 3: Create order record
    const order = new Order({
      orderId,
      customerName,
      pincode,
      state,
      city,
      items,
      assignedWarehouse: warehouse.warehouseId,
      allocations,
      unfulfilledItems,
      status
    });

    await order.save();

    // Step 4: Generate alerts for low stock
    await generateInventoryAlerts(warehouse.warehouseId);

    res.status(201).json({
      success: true,
      orderId: order.orderId,
      assignedWarehouse: warehouse.warehouseId,
      status: order.status,
      allocations: order.allocations,
      unfulfilledItems: order.unfulfilledItems,
      message: unfulfilledItems.length > 0 
        ? `Order partially fulfilled. ${unfulfilledItems.length} items out of stock`
        : 'Order successfully fulfilled'
    });

  } catch (error) {
    console.error('Error processing order:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get all orders with filters
 * GET /api/orders?status=allocated&skip=0&limit=10
 */
export async function getAllOrders(req, res) {
  try {
    const { status, warehouse, skip = 0, limit = 10 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (warehouse) query.assignedWarehouse = warehouse;

    const orders = await Order
      .find(query)
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .exec();

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      total,
      count: orders.length,
      orders
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get specific order by ID
 * GET /api/orders/:orderId
 */
export async function getOrderById(req, res) {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ success: true, order });

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get orders by pincode/state
 * GET /api/orders/search/by-location?pincode=110001
 */
export async function getOrdersByLocation(req, res) {
  try {
    const { pincode, state } = req.query;
    const query = {};

    if (pincode) query.pincode = pincode;
    if (state) query.state = state;

    if (!pincode && !state) {
      return res.status(400).json({ error: 'Provide pincode or state' });
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      orders
    });

  } catch (error) {
    console.error('Error searching orders:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get order fulfillment summary
 * GET /api/orders/summary/stats
 */
export async function getOrderStats(req, res) {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalOrders = await Order.countDocuments();

    res.json({
      success: true,
      totalOrders,
      statsByStatus: stats
    });

  } catch (error) {
    console.error('Error getting order stats:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Update order status
 * PUT /api/orders/:orderId/status
 */
export async function updateOrderStatus(req, res) {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'allocated', 'partially_allocated', 'fulfilled', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await Order.findOneAndUpdate(
      { orderId },
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      success: true,
      message: 'Order status updated',
      order
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: error.message });
  }
}

// Legacy exports for backward compatibility
export const getOrders = getAllOrders;
export const createOrder = processOrder;

export default {
  processOrder,
  getAllOrders,
  getOrderById,
  getOrdersByLocation,
  getOrderStats,
  updateOrderStatus
        warehouseId: selectedWarehouse._id,
        productId: productId,
        quantity: { $gt: 0 }
      }).sort({ expiryDate: 1 });

      for (const inv of inventories) {
        if (remainingQuantityToAllocate === 0) break;

        const allocatedFromThisBatch = Math.min(inv.quantity, remainingQuantityToAllocate);
        
        allocatedItems.push({
          productId: productId,
          warehouseId: selectedWarehouse._id,
          inventoryId: inv._id,
          batchNumber: inv.batchNumber,
          quantityAllocated: allocatedFromThisBatch
        });

        // Update inventory quantity
        inv.quantity -= allocatedFromThisBatch;
        await inv.save();

        remainingQuantityToAllocate -= allocatedFromThisBatch;
      }

      if (remainingQuantityToAllocate > 0) {
        allFulfilled = false;
        unfulfilledItems.push({
          productId: productId,
          quantityMissing: remainingQuantityToAllocate
        });
      }
    }

    let status = 'Allocated';
    if (!allFulfilled && allocatedItems.length > 0) {
      status = 'Processing'; // Partially allocated
    } else if (!allFulfilled && allocatedItems.length === 0) {
      status = 'Unfulfilled';
    }

    const newOrder = new Order({
      user: req.user ? req.user._id : null,
      customerName,
      shippingAddress,
      items,
      allocatedItems,
      unfulfilledItems,
      status
    });

    const createdOrder = await newOrder.save();
    res.status(201).json(createdOrder);

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
