# 🚀 Quick Start Guide - Smart WMS/OMS Backend

Get the Smart WMS backend running in 5 minutes!

## ⚡ Prerequisites

- Node.js v14+ ([Download](https://nodejs.org/))
- MongoDB ([Local](https://docs.mongodb.com/manual/installation/) or [Atlas Cloud](https://www.mongodb.com/cloud/atlas))
- Git
- Postman or cURL (for testing)

## 📦 Step 1: Install Dependencies

```bash
# Navigate to backend directory
cd backend

# Install all packages
npm install
```

## ⚙️ Step 2: Configure Environment

```bash
# Copy example config
cp .env.example .env

# Edit .env file with your MongoDB URI
# On Windows: notepad .env
# On Mac/Linux: nano .env
```

**Update `.env`:**
```env
MONGO_URI=mongodb://localhost:27017/smart-wms
PORT=5000
NODE_ENV=development
```

### MongoDB Setup Options

**Option A: Local MongoDB**
```bash
# Install: https://docs.mongodb.com/manual/installation/
# Start MongoDB:
mongod
# Connection string: mongodb://localhost:27017/smart-wms
```

**Option B: MongoDB Atlas (Cloud)**
1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create cluster
3. Get connection string
4. Update `.env`:
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/smart-wms
```

## 🌱 Step 3: Seed Database

```bash
npm run seed
```

**Expected Output:**
```
✓ Connected to MongoDB
✓ Cleared existing data
✓ Seeded 4 warehouses
✓ Seeded 60 inventory records
✓ Seeded 6 orders from CSV

📊 DATABASE SEED SUMMARY
Warehouses: 4
Total Inventory Records: 60
Orders: 6

✅ Database seeding completed successfully!
```

## 🎯 Step 4: Start Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

**Expected Output:**
```
============================================================
🚀 Smart WMS/OMS Server running on port 5000
============================================================

📚 API Documentation:
  Orders API: http://localhost:5000/api/orders
  Inventory API: http://localhost:5000/api/inventory
  Health Check: http://localhost:5000/health

============================================================
```

## ✅ Step 5: Verify Installation

### Check Health
```bash
curl http://localhost:5000/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-03-23T12:00:00.000Z",
  "database": "connected"
}
```

### Get All Orders
```bash
curl http://localhost:5000/api/orders
```

### Get Warehouses Inventory
```bash
curl http://localhost:5000/api/inventory?limit=5
```

## 🧪 Quick Test Workflow

### 1. View Seeded Data

**Get all warehouses:**
```bash
curl http://localhost:5000/api/inventory/warehouse/WH_DELHI | json_pp
```

**Get inventory summary:**
```bash
curl "http://localhost:5000/api/inventory?limit=5" | json_pp
```

### 2. Create an Order

```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORD-2026-0001",
    "customerName": "John Doe",
    "pincode": "110001",
    "state": "Delhi",
    "city": "New Delhi",
    "items": [
      {
        "productId": "MS-01",
        "name": "Wireless Mouse",
        "quantity": 5
      },
      {
        "productId": "KB-02",
        "name": "Mechanical Keyboard",
        "quantity": 2
      }
    ]
  }'
```

### 3. Check Order Status

```bash
curl http://localhost:5000/api/orders/ORD-2026-0001
```

### 4. View Alerts

```bash
curl http://localhost:5000/api/inventory/alerts/low-stock
```

## 📱 Using Postman

**Import API Collection:**

1. Open Postman
2. Click **Import**
3. Select **Paste Raw Text**
4. Paste this curl collection format
5. Test endpoints

**Or use raw requests:**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/orders` | Create order |
| GET | `/api/orders` | List orders |
| GET | `/api/orders/:id` | Get order details |
| GET | `/api/inventory` | List inventory |
| GET | `/api/inventory/warehouse/:warehouseId` | Warehouse stock |
| POST | `/api/inventory` | Add stock |
| GET | `/api/inventory/alerts` | View all alerts |

## 🔍 Common Issues

### MongoDB Connection Failed
```
✗ MongoDB connection error: MongoError: connect ECONNREFUSED
```
**Fix:** Start MongoDB service or update `MONGO_URI`

### Port 5000 Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Fix:**
```bash
# Find process on port 5000
lsof -i :5000

# Kill process (get PID from above)
kill -9 <PID>

# Or use different port in .env
PORT=5001
```

### Seed Script Fails
```
Error: Cannot read property 'readStream' of null
```
**Fix:** 
- Verify `kaggle_dataset.csv` exists
- Check MongoDB connection first
- Run from `backend` directory

### CORS Error in Frontend
Update `server.js`:
```javascript
app.use(cors({
  origin: 'http://localhost:3000', // Your frontend URL
  credentials: true
}));
```

## 📊 Database Schema Overview

### Collections Created:
- `warehouses` - DC locations
- `inventory` - Stock records
- `orders` - Customer orders
- `alerts` - System alerts

### Key Indexes:
- Warehouse pincode lookup
- FEFO inventory sorting (by expiry date)
- Order status filtering
- Alert status tracking

## 🎓 Understanding the Implementation

### 1. Warehouse Selection
```
Order comes in with pincode "110001"
  ↓
Check if WH_DELHI pincode matches
  ✓ YES → Allocate to WH_DELHI
  NO ↓
Check if state "Delhi" matches
  ✓ YES → Allocate to WH_DELHI
  NO ↓
Use fallback warehouse (first available)
```

### 2. FEFO Allocation
```
Order: 5x Wireless Mouse
  ↓
Query inventory sorted by expiryDate ASC
  ✓ BATCH-001 (expires 2026-04-15): 3 units
  ✓ BATCH-002 (expires 2026-05-20): 2 units
  ✓ BATCH-003 (expires 2026-06-10): 10 units
  ↓
Allocate from earliest:
  • Take 3 from BATCH-001
  • Take 2 from BATCH-002
  ↓
Order fulfilled! Inventory updated.
```

### 3. Alert Generation
```
Inventory Check Loop:
  ├─ If quantity < 10 → Low Stock Alert
  ├─ If expiry < 5 days → Expiry Alert
  ├─ If expiry < TODAY → Mark as Expired
  └─ Severity: HIGH/MEDIUM/LOW
```

## 📚 Full Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference.

## 🚀 Next Steps

1. **Test all endpoints** using provided curl commands
2. **Review core logic** in `utils/fulfillmentLogic.js`
3. **Create custom orders** to test FEFO allocation
4. **Monitor alerts** for low stock and expiry warnings
5. **Integrate with frontend** (Vue.js/React)

## 💡 Tips

- Use `npm run dev` for development (auto-reload on changes)
- Check MongoDB collections using MongoDB Compass GUI
- Add logging for debugging: `console.log()` in controllers
- Test with Postman to validate API responses
- Review seed data structure to understand models

## 📞 Support

- Check error logs in console
- Review API_DOCUMENTATION.md for endpoint details
- Verify MongoDB connection
- Ensure .env variables are set correctly

---

**You're ready! 🎉 Start pushing orders!**

