import mongoose from 'mongoose';

const productSchema = mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  description: { type: String },
  price: { type: Number, required: true }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
export default Product;
