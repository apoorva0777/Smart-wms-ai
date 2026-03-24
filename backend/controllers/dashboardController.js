import Inventory from '../models/Inventory.js';
import Order from '../models/Order.js';

export const getDashboardMetrics = async (req, res) => {
  try {
    // Basic rules for AI Layer
    const LOW_STOCK_THRESHOLD = 50; 
    const NEAR_EXPIRY_DAYS = 30;
    
    const now = new Date();
    const nearExpiryDate = new Date();
    nearExpiryDate.setDate(now.getDate() + NEAR_EXPIRY_DAYS);

    // Find Low Stock (Aggregation to sum quantity by product and warehouse)
    const lowStockItemsCursor = await Inventory.aggregate([
      { $group: { _id: { productId: "$productId", warehouseId: "$warehouseId" }, totalQty: { $sum: "$quantity" } } },
      { $match: { totalQty: { $lt: LOW_STOCK_THRESHOLD } } }
    ]);
    
    // Find Near Expiry Batches
    const nearExpiryItems = await Inventory.find({
      quantity: { $gt: 0 },
      expiryDate: { $lte: nearExpiryDate, $gte: now }
    }).populate('productId', 'name sku');

    // Recent orders
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(10);

    const suggestions = [];
    if (lowStockItemsCursor.length > 0) {
      suggestions.push(`Urgent: Restock needed for ${lowStockItemsCursor.length} product/warehouse combinations.`);
    }
    if (nearExpiryItems.length > 0) {
      suggestions.push(`Warning: ${nearExpiryItems.length} batches are nearing expiry! Run promotions to clear them.`);
    }
    
    res.json({
      lowStockCount: lowStockItemsCursor.length,
      nearExpiryCount: nearExpiryItems.length,
      nearExpiryItems,
      recentOrders,
      suggestions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
