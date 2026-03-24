import mongoose from 'mongoose';

const orderSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customerName: { type: String, required: true },
  shippingAddress: {
    street: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true }
  },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      quantity: { type: Number, required: true }
    }
  ],
  allocatedItems: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
      inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
      batchNumber: { type: String },
      quantityAllocated: { type: Number }
    }
  ],
  unfulfilledItems: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantityMissing: { type: Number }
    }
  ],
  status: { type: String, enum: ['Pending', 'Processing', 'Allocated', 'Unfulfilled', 'Completed'], default: 'Pending' }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);
export default Order;
