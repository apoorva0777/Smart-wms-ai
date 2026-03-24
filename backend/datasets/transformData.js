import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Indian pincode mapping to states
const pincodeMap = {
  '110001': 'Delhi',      // Delhi
  '302001': 'Rajasthan',  // Jaipur
  '400001': 'Maharashtra', // Mumbai
  '560001': 'Karnataka'   // Bangalore
};

const pincodes = Object.keys(pincodeMap);

/**
 * Get random pincode from available options
 */
function getRandomPincode() {
  return pincodes[Math.floor(Math.random() * pincodes.length)];
}

/**
 * Transform CSV data into order structure
 * Groups rows by Order ID and transforms into standardized format
 */
export function transformCsvToOrders(csvData) {
  const ordersMap = new Map();

  // Group CSV data by Order ID
  csvData.forEach(row => {
    const orderId = row['Order ID'];
    
    if (!ordersMap.has(orderId)) {
      ordersMap.set(orderId, {
        orderId: orderId,
        customerName: row['Customer Name'],
        city: row['City'],
        state: row['State'],
        pincode: getRandomPincode(), // Assign random Indian pincode
        orderDate: new Date().toISOString(),
        items: []
      });
    }

    const order = ordersMap.get(orderId);
    order.items.push({
      productId: row['SKU'],
      name: row['Product Name'],
      quantity: parseInt(row['Quantity']) || 1
    });
  });

  return Array.from(ordersMap.values());
}

/**
 * Read CSV file and transform to orders
 */
export function readAndTransformCsv(filePath) {
  return new Promise((resolve, reject) => {
    const csvData = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        csvData.push(row);
      })
      .on('end', () => {
        const orders = transformCsvToOrders(csvData);
        resolve(orders);
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

/**
 * Main execution - for testing
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const csvFilePath = path.join(__dirname, 'kaggle_dataset.csv');
  
  readAndTransformCsv(csvFilePath)
    .then((orders) => {
      console.log('✓ Transformed Orders:', JSON.stringify(orders, null, 2));
      console.log(`\n✓ Total Orders: ${orders.length}`);
    })
    .catch((err) => {
      console.error('Error transforming CSV:', err);
    });
}

export default { readAndTransformCsv, transformCsvToOrders };
