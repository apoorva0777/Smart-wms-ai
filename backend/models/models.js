import mongoose from 'mongoose';

/**
 * Warehouse Model - Represents distribution centers
 */
const warehouseSchema = new mongoose.Schema({
  warehouseId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  pincode: {
    type: String,
    required: true
  },
  capacity: {
    type: Number,
    default: 10000 // Storage capacity
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

/**
 * Inventory Model - Tracks stock by warehouse, bin, and batch
 * Implements FEFO logic via expiryDate sorting
 */
const inventorySchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
    index: true
  },
  productName: {
    type: String,
    required: true
  },
  warehouseId: {
    type: String,
    required: true,
    ref: 'Warehouse',
    index: true
  },
  bin: {
    type: String,
    required: true
    // Format: A1, A2, B1, B2, etc.
  },
  batchId: {
    type: String,
    required: true,
    index: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  expiryDate: {
    type: Date,
    required: true,
    index: true // Important for FEFO sorting
  },
  status: {
    type: String,
    enum: ['active', 'blocked', 'expired'],
    default: 'active',
    index: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

/**
 * Order Model - Represents customer orders
 */
const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  customerName: String,
  orderDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  pincode: {
    type: String,
    required: true,
    index: true
  },
  state: String,
  city: String,
  items: [{
    productId: String,
    name: String,
    quantity: Number
  }],
  status: {
    type: String,
    enum: ['pending', 'allocated', 'partially_allocated', 'fulfilled', 'cancelled'],
    default: 'pending',
    index: true
  },
  assignedWarehouse: {
    type: String,
    ref: 'Warehouse'
  },
  allocations: [{
    productId: String,
    productName: String,
    quantity: Number,
    allocatedQuantity: Number,
    warehouseId: String,
    bin: String,
    batchId: String,
    expiryDate: Date
  }],
  unfulfilledItems: [{
    productId: String,
    productName: String,
    requestedQuantity: Number,
    allocatedQuantity: Number,
    reason: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

/**
 * Alert Model - Tracks stock and expiry alerts
 */
const alertSchema = new mongoose.Schema({
  alertType: {
    type: String,
    enum: ['low_stock', 'expiry_warning', 'expiry_critical'],
    required: true,
    index: true
  },
  productId: {
    type: String,
    required: true,
    index: true
  },
  productName: String,
  warehouseId: {
    type: String,
    required: true,
    ref: 'Warehouse',
    index: true
  },
  batchId: String,
  currentQuantity: Number,
  threshold: Number, // For low stock alerts
  expiryDate: Date, // For expiry alerts
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'acknowledged'],
    default: 'active',
    index: true
  },
  message: String,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  resolvedAt: Date
});

// Compound index for FEFO optimization
inventorySchema.index({ warehouseId: 1, productId: 1, expiryDate: 1 });

// Compound index for order allocation
orderSchema.index({ status: 1, createdAt: -1 });

export const Warehouse = mongoose.model('Warehouse', warehouseSchema);
export const Inventory = mongoose.model('Inventory', inventorySchema);
export const Order = mongoose.model('Order', orderSchema);
export const Alert = mongoose.model('Alert', alertSchema);

export default { Warehouse, Inventory, Order, Alert };
