import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Warehouse, Inventory, Order } from '../models/models.js';
import { readAndTransformCsv } from '../datasets/transformData.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smart-wms';

/**
 * Warehouse seed data
 */
const warehouseSeedData = [
  {
    warehouseId: 'WH_DELHI',
    name: 'Delhi Distribution Center',
    state: 'Delhi',
    city: 'New Delhi',
    pincode: '110001',
    capacity: 50000
  },
  {
    warehouseId: 'WH_MUMBAI',
    name: 'Mumbai Distribution Center',
    state: 'Maharashtra',
    city: 'Mumbai',
    pincode: '400001',
    capacity: 75000
  },
  {
    warehouseId: 'WH_BANGALORE',
    name: 'Bangalore Distribution Center',
    state: 'Karnataka',
    city: 'Bangalore',
    pincode: '560001',
    capacity: 60000
  },
  {
    warehouseId: 'WH_JAIPUR',
    name: 'Jaipur Distribution Center',
    state: 'Rajasthan',
    city: 'Jaipur',
    pincode: '302001',
    capacity: 40000
  }
];

/**
 * Generate sample inventory data
 * Each warehouse will have stock of each product
 */
function generateInventoryData() {
  const products = [
    { productId: 'MS-01', productName: 'Wireless Mouse' },
    { productId: 'KB-02', productName: 'Mechanical Keyboard' },
    { productId: 'MN-03', productName: 'HD Monitor' },
    { productId: 'HUB-04', productName: 'USB-C Hub' },
    { productId: 'HS-05', productName: 'Gaming Headset' }
  ];

  const bins = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2'];
  const inventory = [];
  const today = new Date();

  // Generate inventory for each warehouse and product
  warehouseSeedData.forEach(warehouse => {
    products.forEach((product, idx) => {
      // Generate 2-3 batches per product per warehouse
      const batchCount = 2 + Math.floor(Math.random() * 2);

      for (let i = 0; i < batchCount; i++) {
        const batchId = `BATCH-${warehouse.warehouseId}-${product.productId}-${i + 1}`;
        const bin = bins[Math.floor(Math.random() * bins.length)];
        const quantity = 50 + Math.floor(Math.random() * 100);

        // Random expiry date between 30 to 365 days from now
        const daysToExpiry = 30 + Math.floor(Math.random() * 335);
        const expiryDate = new Date(today.getTime() + daysToExpiry * 24 * 60 * 60 * 1000);

        inventory.push({
          productId: product.productId,
          productName: product.productName,
          warehouseId: warehouse.warehouseId,
          bin,
          batchId,
          quantity,
          expiryDate,
          status: 'active'
        });
      }
    });
  });

  return inventory;
}

/**
 * Connect to MongoDB
 */
async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB');
  } catch (error) {
    console.error('✗ MongoDB connection error:', error);
    process.exit(1);
  }
}

/**
 * Clear existing data
 */
async function clearData() {
  try {
    await Warehouse.deleteMany({});
    await Inventory.deleteMany({});
    await Order.deleteMany({});
    console.log('✓ Cleared existing data');
  } catch (error) {
    console.error('✗ Error clearing data:', error);
    throw error;
  }
}

/**
 * Seed warehouses
 */
async function seedWarehouses() {
  try {
    const warehouses = await Warehouse.insertMany(warehouseSeedData);
    console.log(`✓ Seeded ${warehouses.length} warehouses`);
    return warehouses;
  } catch (error) {
    console.error('✗ Error seeding warehouses:', error);
    throw error;
  }
}

/**
 * Seed inventory
 */
async function seedInventory() {
  try {
    const inventoryData = generateInventoryData();
    const inventory = await Inventory.insertMany(inventoryData);
    console.log(`✓ Seeded ${inventory.length} inventory records`);
    return inventory;
  } catch (error) {
    console.error('✗ Error seeding inventory:', error);
    throw error;
  }
}

/**
 * Seed orders from CSV
 */
async function seedOrdersFromCSV() {
  try {
    const csvFilePath = path.join(__dirname, 'kaggle_dataset.csv');
    
    console.log('📖 Reading CSV file...');
    const transformedOrders = await readAndTransformCsv(csvFilePath);

    if (!transformedOrders || transformedOrders.length === 0) {
      console.warn('⚠ No orders found in CSV');
      return [];
    }

    // Transform to match Order schema
    const orderData = transformedOrders.map(order => ({
      orderId: order.orderId,
      customerName: order.customerName,
      orderDate: new Date(order.orderDate),
      pincode: order.pincode,
      state: order.state,
      city: order.city,
      items: order.items,
      status: 'pending',
      allocations: [],
      unfulfilledItems: []
    }));

    const orders = await Order.insertMany(orderData);
    console.log(`✓ Seeded ${orders.length} orders from CSV`);
    return orders;
  } catch (error) {
    console.error('✗ Error seeding orders from CSV:', error);
    // Don't throw - continue without CSV data
    return [];
  }
}

/**
 * Display summary statistics
 */
async function displaySummary() {
  try {
    const warehouseCount = await Warehouse.countDocuments();
    const inventoryCount = await Inventory.countDocuments();
    const inventoryByWarehouse = await Inventory.aggregate([
      {
        $group: {
          _id: '$warehouseId',
          totalQuantity: { $sum: '$quantity' },
          SKUs: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const orderCount = await Order.countDocuments();

    console.log('\n' + '='.repeat(60));
    console.log('📊 DATABASE SEED SUMMARY');
    console.log('='.repeat(60));
    console.log(`\nWarehouses: ${warehouseCount}`);
    console.log(`Total Inventory Records: ${inventoryCount}`);
    console.log(`Orders: ${orderCount}`);

    console.log('\n📦 Inventory by Warehouse:');
    inventoryByWarehouse.forEach(row => {
      console.log(`  ${row._id}: ${row.SKUs} SKUs, ${row.totalQuantity} total units`);
    });

    console.log('\n' + '='.repeat(60));
  } catch (error) {
    console.error('Error displaying summary:', error);
  }
}

/**
 * Main seed function
 */
async function seed() {
  try {
    console.log('\n🌱 Starting database seed...\n');

    // Connect to database
    await connectDB();

    // Clear existing data
    await clearData();

    // Seed data
    await seedWarehouses();
    await seedInventory();
    await seedOrdersFromCSV();

    // Display summary
    await displaySummary();

    console.log('\n✅ Database seeding completed successfully!\n');

    // Close connection
    await mongoose.connection.close();

  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run seed
seed();
    const w2 = await Warehouse.create({ name: 'LA Hub', city: 'Los Angeles', state: 'CA', pincodes: ['90001', '90002'], isFallback: false });
    const wFallback = await Warehouse.create({ name: 'National Backup', city: 'Denver', state: 'CO', pincodes: [], isFallback: true });

    const warehouses = [w1, w2, wFallback];
    const productsMap = new Map();

    const ordersData = [];

    // 4. Parse Kaggle CSV
    console.log('Reading kaggle_dataset.csv...');
    fs.createReadStream(path.join(__dirname, 'kaggle_dataset.csv'))
      .pipe(csv())
      .on('data', (row) => {
         ordersData.push(row);
      })
      .on('end', async () => {
        console.log(`Parsed ${ordersData.length} rows from CSV.`);
        
        // 5. Build Products from CSV
        for (const row of ordersData) {
          if (!productsMap.has(row['SKU'])) {
            const prod = await Product.create({
              name: row['Product Name'],
              sku: row['SKU'],
              description: `A Kaggle Sample Product: ${row['Product Name']}`,
              price: Math.floor(Math.random() * 100) + 10
            });
            productsMap.set(row['SKU'], prod);
          }
        }

        console.log('Products created.');

        // 6. Generate Dummy Inventory intelligently spread across warehouses
        const allProducts = Array.from(productsMap.values());
        for (const product of allProducts) {
          for (let i = 0; i < 3; i++) {
            // Create batches with different expiries
            const randomWarehouse = warehouses[Math.floor(Math.random() * warehouses.length)];
            const today = new Date();
            const daysToAdd = Math.floor(Math.random() * 90) + 5; // Some expiring soon, some later
            const expiry = new Date(today.setDate(today.getDate() + daysToAdd));
            
            await Inventory.create({
              warehouseId: randomWarehouse._id,
              productId: product._id,
              batchNumber: `BATCH-${Math.floor(Math.random() * 10000)}`,
              binLocation: `BIN-${Math.floor(Math.random() * 10)}`,
              expiryDate: expiry,
              quantity: Math.floor(Math.random() * 50) + 5 // 5 to 55 stock
            });
          }
        }
        console.log('Inventory generated.');

        // 7. Inject Orders without allocating (letting user use the API, or pre-allocating)
        for (const row of ordersData) {
           const productMatch = productsMap.get(row['SKU']);
           await Order.create({
             user: manager._id,
             customerName: row['Customer Name'],
             shippingAddress: {
               street: '123 Fake Street',
               city: row['City'],
               state: row['State'],
               pincode: row['Pincode']
             },
             items: [
               { productId: productMatch._id, quantity: parseInt(row['Quantity']) }
             ],
             allocatedItems: [],
             unfulfilledItems: [],
             status: 'Pending'
           });
        }
        
        console.log('Kaggle unallocated orders seeded successfully.');
        console.log('Run the WMS Optimizer API to process these orders.');
        process.exit();
      });

  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
};

importData();
