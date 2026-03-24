# Smart WMS/OMS - Backend API Documentation

AI-Powered Warehouse & Order Fulfillment Optimizer using Node.js, Express, and MongoDB.

## 📋 Table of Contents

- [Features](#features)
- [System Architecture](#system-architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Seeding](#database-seeding)
- [Running the Server](#running-the-server)
- [API Documentation](#api-documentation)
- [Core Logic Implementation](#core-logic-implementation)
- [Troubleshooting](#troubleshooting)

## ✨ Features

### 1. **FEFO (First Expiry First Out) Allocation**
   - Automatically sorts inventory by expiry date (ascending)
   - Allocates stock from earliest expiry first
   - Reduces inventory quantity after allocation
   - Marks batches as inactive when depleted

### 2. **Intelligent Warehouse Selection**
   - **Exact Match**: Matches order pincode to warehouse pincode
   - **State Match**: Falls back to state-level matching
   - **Fallback**: Uses first available warehouse if no match

### 3. **Alert System**
   - **Low Stock Alerts**: Triggered when inventory < 10 units
   - **Expiry Alerts**: Triggered when expiry within 5 days
   - **Critical Alerts**: Auto-marked when product expires
   - Severity levels: low, medium, high

### 4. **Order Processing**
   - Full order validation
   - Automatic warehouse assignment
   - Inventory allocation with FEFO logic
   - Tracking of unfulfilled items
   - Order status tracking

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Express Server                         │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │           API Routes                             │   │
│  │  • /api/orders                                   │   │
│  │  • /api/inventory                                │   │
│  └──────────────────────────────────────────────────┘   │
│                        │                                  │
│  ┌──────────────────────────────────────────────────┐   │
│  │        Controllers                               │   │
│  │  • orderController.js                            │   │
│  │  • inventoryController.js                        │   │
│  └──────────────────────────────────────────────────┘   │
│                        │                                  │
│  ┌──────────────────────────────────────────────────┐   │
│  │      Core Fulfillment Logic                      │   │
│  │  • selectWarehouse()                             │   │
│  │  • allocateInventoryWithFEFO()                   │   │
│  │  • generateInventoryAlerts()                     │   │
│  └──────────────────────────────────────────────────┘   │
│                        │                                  │
│  ┌──────────────────────────────────────────────────┐   │
│  │         MongoDB Models                           │   │
│  │  • Order                                         │   │
│  │  • Inventory                                     │   │
│  │  • Warehouse                                     │   │
│  │  • Alert                                         │   │
│  └──────────────────────────────────────────────────┘   │
│                        │                                  │
└────────────────────────┼──────────────────────────────────┘
                         │
                    ┌────────────┐
                    │  MongoDB   │
                    └────────────┘
```

## 🚀 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Setup Steps

1. **Install dependencies**
```bash
cd backend
npm install
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your MongoDB URI and other settings
```

3. **Seed the database**
```bash
npm run seed
```

## ⚙️ Configuration

Create a `.env` file in the `backend` directory:

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/smart-wms

# Server
PORT=5000
NODE_ENV=development

# API
API_BASE_URL=http://localhost:5000
```

## 📦 Database Seeding

The seed script creates:
- **4 Warehouses** (Delhi, Mumbai, Bangalore, Jaipur)
- **60 Inventory Records** (5 products × 4 warehouses × 3 batches each)
- **Orders from CSV** (transformed from kaggle_dataset.csv)

### Run Seed Script

```bash
npm run seed
```

Expected output:
```
✓ Connected to MongoDB
✓ Cleared existing data
✓ Seeded 4 warehouses
✓ Seeded 60 inventory records
✓ Seeded 6 orders from CSV

📊 DATABASE SEED SUMMARY
================================
Warehouses: 4
Total Inventory Records: 60
Orders: 6

📦 Inventory by Warehouse:
  WH_DELHI: 5 SKUs, 1050 total units
  WH_MUMBAI: 5 SKUs, 1125 total units
  WH_BANGALORE: 5 SKUs, 1080 total units
  WH_JAIPUR: 5 SKUs, 975 total units

✅ Database seeding completed successfully!
```

## 🎯 Running the Server

### Development Mode (with auto-restart)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

Server starts on `http://localhost:5000`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

---

## 🛒 Orders API

### 1. Process New Order
**POST** `/orders`

Process a new order with automatic warehouse selection and FEFO allocation.

**Request Body:**
```json
{
  "orderId": "1",
  "customerName": "Alice Smith",
  "pincode": "110001",
  "state": "Delhi",
  "city": "New Delhi",
  "items": [
    {
      "productId": "MS-01",
      "name": "Wireless Mouse",
      "quantity": 2
    },
    {
      "productId": "KB-02",
      "name": "Mechanical Keyboard",
      "quantity": 1
    }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "orderId": "1",
  "assignedWarehouse": "WH_DELHI",
  "status": "allocated",
  "allocations": [
    {
      "productId": "MS-01",
      "productName": "Wireless Mouse",
      "quantity": 2,
      "allocatedQuantity": 2,
      "warehouseId": "WH_DELHI",
      "bin": "A1",
      "batchId": "BATCH-WH_DELHI-MS-01-1",
      "expiryDate": "2026-06-15T10:30:00.000Z"
    }
  ],
  "unfulfilledItems": [],
  "message": "Order successfully fulfilled"
}
```

---

### 2. Get All Orders
**GET** `/orders`

Retrieve orders with optional filters and pagination.

**Query Parameters:**
- `status` - Filter by status (pending, allocated, partially_allocated, fulfilled, cancelled)
- `warehouse` - Filter by warehouse ID
- `skip` - Number of records to skip (default: 0)
- `limit` - Number of records to return (default: 10)

**Example:**
```
GET /orders?status=allocated&warehouse=WH_DELHI&limit=5
```

**Response (200):**
```json
{
  "success": true,
  "total": 5,
  "count": 5,
  "orders": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "orderId": "1",
      "customerName": "Alice Smith",
      "pincode": "110001",
      "state": "Delhi",
      "assignedWarehouse": "WH_DELHI",
      "status": "allocated",
      "allocations": [...],
      "unfulfilledItems": [],
      "createdAt": "2026-03-23T10:00:00.000Z"
    }
  ]
}
```

---

### 3. Get Order by ID
**GET** `/orders/:orderId`

Retrieve a specific order by order ID.

**Example:**
```
GET /orders/536365
```

**Response (200):**
```json
{
  "success": true,
  "order": { /* full order object */ }
}
```

---

### 4. Get Orders by Location
**GET** `/orders/search/by-location`

Search orders by pincode or state.

**Query Parameters:**
- `pincode` - Customer pincode
- `state` - Customer state

**Example:**
```
GET /orders/search/by-location?pincode=110001
```

**Response (200):**
```json
{
  "success": true,
  "count": 3,
  "orders": [...]
}
```

---

### 5. Get Order Statistics
**GET** `/orders/summary/stats`

Get order fulfillment statistics by status.

**Response (200):**
```json
{
  "success": true,
  "totalOrders": 50,
  "statsByStatus": [
    { "_id": "allocated", "count": 30 },
    { "_id": "pending", "count": 15 },
    { "_id": "fulfilled", "count": 5 }
  ]
}
```

---

### 6. Update Order Status
**PUT** `/orders/:orderId/status`

Update order status.

**Request Body:**
```json
{
  "status": "fulfilled"
}
```

**Valid Statuses:** pending, allocated, partially_allocated, fulfilled, cancelled

**Response (200):**
```json
{
  "success": true,
  "message": "Order status updated",
  "order": { /* updated order */ }
}
```

---

## 📦 Inventory API

### 1. Add Inventory
**POST** `/inventory`

Add or update inventory stock.

**Request Body:**
```json
{
  "productId": "MS-01",
  "productName": "Wireless Mouse",
  "warehouseId": "WH_DELHI",
  "bin": "A1",
  "batchId": "BATCH-001",
  "quantity": 100,
  "expiryDate": "2026-06-15"
}
```

**Response (201 or 200):**
```json
{
  "success": true,
  "message": "Inventory added successfully",
  "inventory": { /* inventory object */ }
}
```

---

### 2. Get Inventory
**GET** `/inventory`

Retrieve inventory with filters and pagination.

**Query Parameters:**
- `warehouseId` - Filter by warehouse
- `productId` - Filter by product
- `status` - Filter by status (active, blocked, expired)
- `skip` - Pagination
- `limit` - Records per page

**Example:**
```
GET /inventory?warehouseId=WH_DELHI&status=active&limit=10
```

**Response (200):**
```json
{
  "success": true,
  "total": 50,
  "count": 10,
  "inventory": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "productId": "MS-01",
      "productName": "Wireless Mouse",
      "warehouseId": "WH_DELHI",
      "bin": "A1",
      "batchId": "BATCH-001",
      "quantity": 95,
      "expiryDate": "2026-06-15T00:00:00.000Z",
      "status": "active"
    }
  ]
}
```

---

### 3. Get Inventory by Warehouse
**GET** `/inventory/warehouse/:warehouseId`

Get complete inventory summary for a warehouse.

**Example:**
```
GET /inventory/warehouse/WH_DELHI
```

**Response (200):**
```json
{
  "success": true,
  "warehouseId": "WH_DELHI",
  "totalSKUs": 5,
  "summary": [
    {
      "productId": "MS-01",
      "productName": "Wireless Mouse",
      "totalQuantity": 245,
      "batches": [
        {
          "batchId": "BATCH-001",
          "bin": "A1",
          "quantity": 95,
          "expiryDate": "2026-06-15T00:00:00.000Z"
        }
      ]
    }
  ],
  "rawInventory": [...]
}
```

---

### 4. Get Inventory by Product
**GET** `/inventory/product/:productId`

Get stock levels across all warehouses for a specific product.

**Example:**
```
GET /inventory/product/MS-01
```

**Response (200):**
```json
{
  "success": true,
  "productId": "MS-01",
  "productName": "Wireless Mouse",
  "totalQuantity": 1050,
  "warehouseBreakdown": [
    {
      "warehouseId": "WH_DELHI",
      "totalQuantity": 245,
      "batches": [...]
    }
  ]
}
```

---

### 5. Update Inventory
**PUT** `/inventory/:id`

Update inventory quantity or status.

**Request Body:**
```json
{
  "quantity": 50,
  "status": "active"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Inventory updated",
  "inventory": { /* updated inventory */ }
}
```

---

## 🚨 Alert System API

### 1. Get All Alerts
**GET** `/inventory/alerts`

Retrieve all alerts with filtering.

**Query Parameters:**
- `status` - Filter by status (active, resolved, acknowledged)
- `skip` - Pagination
- `limit` - Records per page

**Response (200):**
```json
{
  "success": true,
  "total": 25,
  "count": 10,
  "alerts": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "alertType": "low_stock",
      "productId": "MS-01",
      "productName": "Wireless Mouse",
      "warehouseId": "WH_DELHI",
      "currentQuantity": 5,
      "threshold": 10,
      "severity": "high",
      "status": "active",
      "message": "Low stock for Wireless Mouse: 5 units remaining",
      "createdAt": "2026-03-23T10:00:00.000Z"
    }
  ]
}
```

---

### 2. Get Low Stock Alerts
**GET** `/inventory/alerts/low-stock`

Retrieve only low stock alerts.

**Response (200):**
```json
{
  "success": true,
  "count": 8,
  "alerts": [...]
}
```

---

### 3. Get Expiry Alerts
**GET** `/inventory/alerts/expiry`

Retrieve only expiry-related alerts.

**Response (200):**
```json
{
  "success": true,
  "count": 12,
  "alerts": [...]
}
```

---

### 4. Resolve Alert
**PUT** `/inventory/alerts/:id/resolve`

Mark alert as resolved or acknowledged.

**Request Body:**
```json
{
  "newStatus": "resolved"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Alert resolved",
  "alert": { /* updated alert */ }
}
```

---

### 5. Trigger Alert Generation
**POST** `/inventory/alerts/generate`

Manually trigger alert generation.

**Request Body:**
```json
{
  "warehouseId": "WH_DELHI"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Generated 5 new alerts",
  "alerts": [...]
}
```

---

## 🔧 Core Logic Implementation

### 1. Warehouse Selection Logic
**File:** `backend/utils/fulfillmentLogic.js`

```javascript
selectWarehouse(orderPincode, state)
```

**Priority Order:**
1. Exact pincode match
2. State match
3. Fallback to first available warehouse

### 2. FEFO Allocation Logic
**File:** `backend/utils/fulfillmentLogic.js`

```javascript
allocateInventoryWithFEFO(order, warehouse)
```

**Algorithm:**
1. Query inventory sorted by `expiryDate ASC` (earliest first)
2. Allocate stock sequentially from earliest expiry
3. Update inventory quantities
4. Track unfulfilled items if insufficient stock
5. Return allocations and unfulfilled items

### 3. Alert Generation
**File:** `backend/utils/fulfillmentLogic.js`

```javascript
generateInventoryAlerts(warehouseId)
```

**Alert Triggers:**
- **Low Stock**: quantity < 10 units
- **Expiry Warning**: expiry within 5 days
- **Severity Levels**: Based on urgency

---

## 📊 Data Models

### Order Schema
```javascript
{
  orderId: String (unique),
  customerName: String,
  orderDate: Date,
  pincode: String,
  state: String,
  city: String,
  items: [{
    productId: String,
    name: String,
    quantity: Number
  }],
  status: String, // pending, allocated, partially_allocated, fulfilled, cancelled
  assignedWarehouse: String,
  allocations: [{
    productId: String,
    quantity: Number,
    allocatedQuantity: Number,
    warehouseId: String,
    bin: String,
    batchId: String,
    expiryDate: Date
  }],
  unfulfilledItems: [{
    productId: String,
    requestedQuantity: Number,
    allocatedQuantity: Number,
    reason: String
  }]
}
```

### Inventory Schema
```javascript
{
  productId: String,
  productName: String,
  warehouseId: String,
  bin: String,
  batchId: String,
  quantity: Number,
  expiryDate: Date,
  status: String, // active, blocked, expired
  lastUpdated: Date
}
```

---

## 🧪 Testing with cURL

### 1. Test Health Check
```bash
curl http://localhost:5000/health
```

### 2. Create Order
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "TEST-001",
    "customerName": "John Doe",
    "pincode": "110001",
    "state": "Delhi",
    "city": "New Delhi",
    "items": [
      {
        "productId": "MS-01",
        "name": "Wireless Mouse",
        "quantity": 2
      }
    ]
  }'
```

### 3. Get All Orders
```bash
curl "http://localhost:5000/api/orders?status=allocated&limit=5"
```

### 4. Get Inventory by Warehouse
```bash
curl http://localhost:5000/api/inventory/warehouse/WH_DELHI
```

### 5. Get Alerts
```bash
curl "http://localhost:5000/api/inventory/alerts/low-stock"
```

---

## 🐛 Troubleshooting

### MongoDB Connection Error
**Problem:** `MongooseError: Cannot connect to MongoDB`

**Solution:**
1. Ensure MongoDB is running: `mongod` (local) or check cloud instance
2. Verify `MONGO_URI` in `.env`
3. Check connection string format

### Port Already in Use
**Problem:** `EADDRINUSE: address already in use :::5000`

**Solution:**
1. Kill process on port: `lsof -ti:5000 | xargs kill -9` (Linux/Mac)
2. For Windows: `netstat -ano | findstr :5000` then `taskkill /PID <PID> /F`
3. Or change PORT in `.env`

### CSV File Not Found
**Problem:** `Error: ENOENT: no such file... kaggle_dataset.csv`

**Solution:**
1. Ensure `kaggle_dataset.csv` exists in `backend/datasets/`
2. Check file permissions
3. Run seed script from backend directory

### Inventory Not Allocated
**Problem:** Order created but `allocations` array is empty

**Solution:**
1. Check if products exist in inventory
2. Verify warehouse availability
3. Check product expiry dates

---

## 📈 Performance Optimization

### Database Indexes
The system uses indexes for:
- `warehouseId` + `productId` + `expiryDate` (FEFO lookup)
- `status` + `createdAt` (order filtering)
- `expiryDate` (expiry alerts)

### Bulk Operations
For large:
- Use `insertMany()` for batch inventory seeding
- Use aggregation for statistics

---

## 🔐 Security Considerations

- Input validation on all endpoints
- MongoDB injection prevention
- CORS configuration
- Error handling without exposing stack traces

---

## 📝 Scripts

In `backend/package.json`:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "seed": "node datasets/seed.js",
    "transform": "node datasets/transformData.js"
  }
}
```

---

## 🤝 Contributing

1. Follow code structure in `backend/`
2. Add comments for logic
3. Test all new endpoints
4. Update this documentation

---

## 📄 License

ISC

---

**Happy Warehousing! 🚀**
