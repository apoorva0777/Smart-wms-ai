import mongoose from 'mongoose';

const warehouseSchema = mongoose.Schema({
  name: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincodes: [{ type: String }],
  isFallback: { type: Boolean, default: false }
}, { timestamps: true });

const Warehouse = mongoose.model('Warehouse', warehouseSchema);
export default Warehouse;
