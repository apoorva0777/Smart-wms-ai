# 📡 Smart WMS API - Example Requests & Responses

Complete set of example API requests with real-world scenarios.

---

## 🎯 Example Scenarios & Requests

### Scenario 1: Creating an Order (Happy Path)

**Situation:** Customer orders 2 Wireless Mice and 1 Keyboard from Delhi

#### Request
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORD-2026-001",
    "customerName": "Raj Kumar",
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
  }'
```

#### Response (201 Created)
```json
{
  "success": true,
  "orderId": "ORD-2026-001",
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
      "expiryDate": "2026-06-15T00:00:00.000Z"
    },
    {
      "productId": "KB-02",
      "productName": "Mechanical Keyboard",
      "quantity": 1,
      "allocatedQuantity": 1,
      "warehouseId": "WH_DELHI",
      "bin": "B2",
      "batchId": "BATCH-WH_DELHI-KB-02-1",
      "expiryDate": "2026-07-20T00:00:00.000Z"
    }
  ],
  "unfulfilledItems": [],
  "message": "Order successfully fulfilled"
}
```

**Flow Analysis:**
1. ✓ System found warehouse matching pincode 110001 (WH_DELHI)
2. ✓ For Mouse: Allocated 2 units from BATCH-WH_DELHI-MS-01-1 (earliest expiry)
3. ✓ For Keyboard: Allocated 1 unit from BATCH-WH_DELHI-KB-02-1
4. ✓ Order status: allocated (all items allocated)
5. ✓ Inventory updated in MongoDB

---

### Scenario 2: Partial Order Fulfillment

**Situation:** Customer orders 100 units of a product but only 50 available

#### Request
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORD-2026-002",
    "customerName": "Priya Singh",
    "pincode": "400001",
    "state": "Maharashtra",
    "city": "Mumbai",
    "items": [
      {
        "productId": "HS-05",
        "name": "Gaming Headset",
        "quantity": 100
      }
    ]
  }'
```

#### Response (201)
```json
{
  "success": true,
  "orderId": "ORD-2026-002",
  "assignedWarehouse": "WH_MUMBAI",
  "status": "partially_allocated",
  "allocations": [
    {
      "productId": "HS-05",
      "productName": "Gaming Headset",
      "quantity": 100,
      "allocatedQuantity": 75,
      "warehouseId": "WH_MUMBAI",
      "bin": "C1",
      "batchId": "BATCH-WH_MUMBAI-HS-05-1",
      "expiryDate": "2026-08-10T00:00:00.000Z"
    }
  ],
  "unfulfilledItems": [
    {
      "productId": "HS-05",
      "productName": "Gaming Headset",
      "requestedQuantity": 100,
      "allocatedQuantity": 75,
      "reason": "Out of stock - Only 75 available"
    }
  ],
  "message": "Order partially fulfilled. 1 items out of stock"
}
```

**Key Points:**
- Only 75 units available → 75 allocated
- 25 units marked as unfulfilled
- Status: partially_allocated (not fully satisfied)
- Warehouse contacted for restocking alert

---

### Scenario 3: Warehouse Selection - State Fallback

**Situation:** Order from pincode without specific warehouse, but state matches

#### Request
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORD-2026-003",
    "customerName": "Amit Raj",
    "pincode": "302005",
    "state": "Rajasthan",
    "city": "Jaipur",
    "items": [
      {
        "productId": "MN-03",
        "name": "HD Monitor",
        "quantity": 1
      }
    ]
  }'
```

#### Response (201)
```json
{
  "success": true,
  "orderId": "ORD-2026-003",
  "assignedWarehouse": "WH_JAIPUR",
  "status": "allocated",
  "allocations": [
    {
      "productId": "MN-03",
      "productName": "HD Monitor",
      "quantity": 1,
      "allocatedQuantity": 1,
      "warehouseId": "WH_JAIPUR",
      "bin": "B3",
      "batchId": "BATCH-WH_JAIPUR-MN-03-2",
      "expiryDate": "2026-05-30T00:00:00.000Z"
    }
  ],
  "unfulfilledItems": [],
  "message": "Order successfully fulfilled"
}
```

**Selection Logic:**
1. ✗ Pincode 302005 not exact match (WH_JAIPUR has 302001)
2. ✓ State Rajasthan matches WH_JAIPUR → Selected
3. ✓ FEFO allocation from available inventory

---

## 📦 Order Query Examples

### Get All Orders with Filters

```bash
# Get all allocated orders
curl "http://localhost:5000/api/orders?status=allocated&limit=10"
```

**Response:**
```json
{
  "success": true,
  "total": 12,
  "count": 10,
  "orders": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "orderId": "ORD-2026-001",
      "customerName": "Raj Kumar",
      "pincode": "110001",
      "state": "Delhi",
      "city": "New Delhi",
      "assignedWarehouse": "WH_DELHI",
      "status": "allocated",
      "allocations": [...],
      "unfulfilledItems": [],
      "createdAt": "2026-03-23T10:00:00.000Z"
    }
    // ... more orders
  ]
}
```

---

### Get Specific Order

```bash
curl "http://localhost:5000/api/orders/ORD-2026-001"
```

**Response:**
```json
{
  "success": true,
  "order": {
    "_id": "507f1f77bcf86cd799439011",
    "orderId": "ORD-2026-001",
    "customerName": "Raj Kumar",
    "orderDate": "2026-03-23T10:00:00.000Z",
    "pincode": "110001",
    "state": "Delhi",
    "city": "New Delhi",
    "items": [
      {
        "productId": "MS-01",
        "name": "Wireless Mouse",
        "quantity": 2
      }
    ],
    "status": "allocated",
    "assignedWarehouse": "WH_DELHI",
    "allocations": [...],
    "unfulfilledItems": [],
    "createdAt": "2026-03-23T10:00:00.000Z",
    "updatedAt": "2026-03-23T10:05:00.000Z"
  }
}
```

---

### Search Orders by Location

```bash
# Get all orders from Delhi pincode
curl "http://localhost:5000/api/orders/search/by-location?pincode=110001"
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "orders": [
    {
      "orderId": "ORD-2026-001",
      "customerName": "Raj Kumar",
      "pincode": "110001",
      "state": "Delhi",
      "status": "allocated",
      ...
    }
    // ... more Delhi orders
  ]
}
```

---

### Get Order Statistics

```bash
curl "http://localhost:5000/api/orders/summary/stats"
```

**Response:**
```json
{
  "success": true,
  "totalOrders": 50,
  "statsByStatus": [
    {
      "_id": "allocated",
      "count": 30
    },
    {
      "_id": "pending",
      "count": 15
    },
    {
      "_id": "partially_allocated",
      "count": 5
    }
  ]
}
```

---

## 📊 Inventory Examples

### Add New Inventory

```bash
curl -X POST http://localhost:5000/api/inventory \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "MS-01",
    "productName": "Wireless Mouse",
    "warehouseId": "WH_DELHI",
    "bin": "A1",
    "batchId": "BATCH-NEW-001",
    "quantity": 200,
    "expiryDate": "2026-12-31"
  }'
```

**Response (201 or 200 if batch exists):**
```json
{
  "success": true,
  "message": "Inventory added successfully",
  "inventory": {
    "_id": "507f1f77bcf86cd799439012",
    "productId": "MS-01",
    "productName": "Wireless Mouse",
    "warehouseId": "WH_DELHI",
    "bin": "A1",
    "batchId": "BATCH-NEW-001",
    "quantity": 200,
    "expiryDate": "2026-12-31T00:00:00.000Z",
    "status": "active",
    "createdAt": "2026-03-23T12:00:00.000Z"
  }
}
```

---

### Get Inventory by Warehouse

```bash
curl "http://localhost:5000/api/inventory/warehouse/WH_DELHI"
```

**Response:**
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
          "batchId": "BATCH-WH_DELHI-MS-01-1",
          "bin": "A1",
          "quantity": 95,
          "expiryDate": "2026-06-15T00:00:00.000Z"
        },
        {
          "batchId": "BATCH-WH_DELHI-MS-01-2",
          "bin": "A2",
          "quantity": 150,
          "expiryDate": "2026-07-10T00:00:00.000Z"
        }
      ]
    },
    {
      "productId": "KB-02",
      "productName": "Mechanical Keyboard",
      "totalQuantity": 180,
      "batches": [...]
    }
    // ... more products
  ]
}
```

---

### Get Product Inventory Across All Warehouses

```bash
curl "http://localhost:5000/api/inventory/product/MS-01"
```

**Response:**
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
    },
    {
      "warehouseId": "WH_MUMBAI",
      "totalQuantity": 280,
      "batches": [...]
    },
    {
      "warehouseId": "WH_BANGALORE",
      "totalQuantity": 260,
      "batches": [...]
    },
    {
      "warehouseId": "WH_JAIPUR",
      "totalQuantity": 265,
      "batches": [...]
    }
  ]
}
```

---

## 🚨 Alert Examples

### Get All Active Alerts

```bash
curl "http://localhost:5000/api/inventory/alerts?status=active&limit=10"
```

**Response:**
```json
{
  "success": true,
  "total": 25,
  "count": 10,
  "alerts": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "alertType": "low_stock",
      "productId": "MS-01",
      "productName": "Wireless Mouse",
      "warehouseId": "WH_BANGALORE",
      "currentQuantity": 8,
      "threshold": 10,
      "severity": "high",
      "status": "active",
      "message": "Low stock for Wireless Mouse: 8 units remaining",
      "createdAt": "2026-03-23T11:00:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439014",
      "alertType": "expiry_warning",
      "productId": "KB-02",
      "productName": "Mechanical Keyboard",
      "warehouseId": "WH_JAIPUR",
      "batchId": "BATCH-WH_JAIPUR-KB-02-1",
      "expiryDate": "2026-03-26T00:00:00.000Z",
      "currentQuantity": 50,
      "severity": "high",
      "status": "active",
      "message": "Expiry warning for Mechanical Keyboard (Batch: BATCH-WH_JAIPUR-KB-02-1): Expires on Mar 26 2026",
      "createdAt": "2026-03-23T10:30:00.000Z"
    }
  ]
}
```

---

### Get Low Stock Alerts

```bash
curl "http://localhost:5000/api/inventory/alerts/low-stock"
```

**Response:**
```json
{
  "success": true,
  "count": 8,
  "alerts": [
    {
      "alertType": "low_stock",
      "productId": "HUB-04",
      "productName": "USB-C Hub",
      "warehouseId": "WH_MUMBAI",
      "currentQuantity": 3,
      "threshold": 10,
      "severity": "high",
      "status": "active",
      "message": "Low stock for USB-C Hub: 3 units remaining"
    }
    // ... more low stock alerts
  ]
}
```

---

### Get Expiry Alerts

```bash
curl "http://localhost:5000/api/inventory/alerts/expiry"
```

**Response:**
```json
{
  "success": true,
  "count": 12,
  "alerts": [
    {
      "alertType": "expiry_warning",
      "productId": "KB-02",
      "productName": "Mechanical Keyboard",
      "warehouseId": "WH_JAIPUR",
      "batchId": "BATCH-WH_JAIPUR-KB-02-1",
      "expiryDate": "2026-03-26T00:00:00.000Z",
      "severity": "high",
      "status": "active",
      "message": "Expiry warning for Mechanical Keyboard..."
    },
    {
      "alertType": "expiry_warning",
      "productId": "MN-03",
      "productName": "HD Monitor",
      "warehouseId": "WH_BANGALORE",
      "batchId": "BATCH-WH_BANGALORE-MN-03-2",
      "expiryDate": "2026-03-29T00:00:00.000Z",
      "severity": "medium",
      "status": "active",
      "message": "Expiry warning for HD Monitor..."
    }
  ]
}
```

---

### Resolve Alert

```bash
curl -X PUT http://localhost:5000/api/inventory/alerts/507f1f77bcf86cd799439013/resolve \
  -H "Content-Type: application/json" \
  -d '{
    "newStatus": "resolved"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Alert resolved",
  "alert": {
    "_id": "507f1f77bcf86cd799439013",
    "alertType": "low_stock",
    "productId": "MS-01",
    "productName": "Wireless Mouse",
    "warehouseId": "WH_BANGALORE",
    "currentQuantity": 8,
    "severity": "high",
    "status": "resolved",
    "resolvedAt": "2026-03-23T12:30:00.000Z",
    "message": "Low stock for Wireless Mouse: 8 units remaining"
  }
}
```

---

## 🔄 Complete Order Lifecycle Example

### Step 1: Create Order
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"orderId": "FULL-ORDER-001", "customerName": "Complete Test", "pincode": "110001", "state": "Delhi", "city": "New Delhi", "items": [{"productId": "MS-01", "name": "Wireless Mouse", "quantity": 5}]}'
```

**Status:** `allocated`

---

### Step 2: Check Order Status
```bash
curl "http://localhost:5000/api/orders/FULL-ORDER-001"
```

**Status:** Still `allocated`

---

### Step 3: Update to Fulfilled
```bash
curl -X PUT http://localhost:5000/api/orders/FULL-ORDER-001/status \
  -H "Content-Type: application/json" \
  -d '{"status": "fulfilled"}'
```

**Status:** `fulfilled`

---

### Step 4: Check Inventory After Allocation
```bash
curl "http://localhost:5000/api/inventory/warehouse/WH_DELHI"
```

**Observation:** Mouse quantity reduced from original by 5 units

---

### Step 5: Check for New Alerts
```bash
curl "http://localhost:5000/api/inventory/alerts/low-stock"
```

**Observation:** New low stock alert if inventory fell below 10

---

## ❌ Error Scenarios

### Duplicate Order

```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"orderId": "ORD-2026-001", "customerName": "Duplicate", "pincode": "110001", "state": "Delhi", "city": "New Delhi", "items": [{"productId": "MS-01", "name": "Wireless Mouse", "quantity": 1}]}'
```

**Response (409 Conflict):**
```json
{
  "error": "Order already exists"
}
```

---

### Missing Required Fields

```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"orderId": "TEST-ERROR", "items": []}'
```

**Response (400 Bad Request):**
```json
{
  "error": "Missing required fields: orderId, items"
}
```

---

### Order Not Found

```bash
curl "http://localhost:5000/api/orders/NONEXISTENT-ORDER"
```

**Response (404 Not Found):**
```json
{
  "error": "Order not found"
}
```

---

### Invalid Status

```bash
curl -X PUT http://localhost:5000/api/orders/ORD-2026-001/status \
  -H "Content-Type: application/json" \
  -d '{"status": "invalid_status"}'
```

**Response (400):**
```json
{
  "error": "Invalid status"
}
```

---

## 🧪 Testing Checklist

Use this as a testing guide:

- [ ] Health check: `GET /health`
- [ ] Create simple order
- [ ] Create order with multiple items
- [ ] Partial fulfillment scenario
- [ ] Get all orders with filters
- [ ] Get specific order
- [ ] Search by location
- [ ] Get order stats
- [ ] Add inventory
- [ ] Get warehouse inventory
- [ ] Get product inventory across warehouses
- [ ] View alerts
- [ ] Resolve alert
- [ ] Trigger alert generation
- [ ] Error: Duplicate order
- [ ] Error: Invalid request
- [ ] Error: Not found

---

## 💡 Tips for Testing

1. **Use Postman:** Import these curl requests as a collection
2. **Keep IDs unique:** Add timestamp to orderId for multiple tests
3. **Monitor alerts:** After each order, check if new alerts were triggered
4. **Verify inventory:** Check warehouse inventory decreased after order
5. **Check MongoDB:** Use MongoDB Compass to see actual database changes

---

**Happy Testing! 🚀**
