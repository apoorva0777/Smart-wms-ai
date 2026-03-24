import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import orderApiRoutes from './routes/orderApiRoutes.js';
import inventoryApiRoutes from './routes/inventoryApiRoutes.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smart-wms';

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ MongoDB connected successfully');
  } catch (error) {
    console.error('✗ MongoDB connection error:', error.message);
    // Don't exit - allow API to start for testing
    console.warn('⚠ Starting without database connection...');
  }
}

connectDB();

// Health check endpoint
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbStatus
  });
});

// Default endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Smart WMS/OMS API',
    version: '1.0.0',
    endpoints: {
      orders: '/api/orders',
      inventory: '/api/inventory',
      health: '/health'
    }
  });
});

/**
 * API Routes
 */
app.use('/api/orders', orderApiRoutes);
app.use('/api/inventory', inventoryApiRoutes);

// Include legacy routes for backward compatibility
import authRoutes from './routes/authRoutes.js';
import warehouseRoutes from './routes/warehouseRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import dashRoutes from './routes/dashRoutes.js';

app.use('/api/auth', authRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/products', productRoutes);
app.use('/api/dash', orderRoutes);
app.use('/api/dashboard', dashRoutes);

/**
 * Error Handling Middleware
 */
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

/**
 * 404 Handler
 */
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log(`🚀 Smart WMS/OMS Server running on port ${PORT}`);
  console.log('='.repeat(60));
  console.log('\n📚 API Documentation:');
  console.log('  Orders API: http://localhost:' + PORT + '/api/orders');
  console.log('  Inventory API: http://localhost:' + PORT + '/api/inventory');
  console.log('  Health Check: http://localhost:' + PORT + '/health');
  console.log('\n' + '='.repeat(60) + '\n');
});
