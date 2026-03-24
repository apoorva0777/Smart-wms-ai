import mongoose from 'mongoose';

const inventorySchema = mongoose.Schema({
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  batchNumber: { type: String, required: true },
  binLocation: { type: String, required: true },
  expiryDate: { type: Date, required: true },
  quantity: { type: Number, required: true, min: 0 }
}, { timestamps: true });

const Inventory = mongoose.model('Inventory', inventorySchema);
export default Inventory;
