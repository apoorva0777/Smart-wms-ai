# Smart WMS/OMS (AI-Powered Warehouse & Order Fulfillment Optimizer)

This project is a complete MERN stack application designed to optimize order fulfillment across multiple warehouses using FEFO (First Expiry First Out) and intelligent pincode routing. 

## Features
* **Role-based Auth:** Admin, Manager, and Picker roles.
* **Warehouse Selection:** Auto-assigns orders based on Exact Pincode Match -> State Match -> Fallback.
* **Intelligent Inventory (FEFO):** Automatically deducts quantities from batches that expire the soonest.
* **AI Alerts Layer:** A rule-based dashboard that identifies low-stock items and near-expiry batches across the network.
* **Kaggle-ready Data Seeding:** Comes with a seeding script that parses Kaggle CSV supply chain files into intelligent Mongoose schema documents.

## Running the Project Locally

### 1. Requirements
* Node.js (v16+)
* MongoDB (Running locally on `mongodb://localhost:27017` or via MongoDB Atlas)

### 2. Backend Setup
1. `cd backend`
2. Configure `.env` if using a custom MongoDB URI:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/smartwms
   JWT_SECRET=supersecretwmskey123
   ```
3. Run `npm install`
4. **Seed the database (Highly Recommended):**
   ```bash
   node datasets/seed.js
   ```
   *Note: This parses `datasets/kaggle_dataset.csv` and auto-populates Warehouses, realistic Products, FEFO-tracked Inventory, and Orders.*
5. Start the backend:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. `cd frontend`
2. Run `npm install` (Using `--legacy-peer-deps` may be required for certain React 19 packages)
3. Start the Vite React app:
   ```bash
   npm run dev
   ```
4. Access the app at `http://localhost:5173/`
5. **Login:** Use `manager@wms.com` and `123456` if you ran the seed script.

### 4. Testing End-to-End
1. Go to the **Dashboard** to view AI-generated alerts regarding the seeded inventory.
2. Go to **Inventory** to see the products logically divided into batches with Expiry Dates.
3. Go to **Orders** to view the initial set of unfulfilled dummy orders.
4. Click **Create Order**, select a product, provide a pincode matching one of the warehouses (e.g. `10001` for NY Main Fulfillment), and watch the system automatically allocate it and update the order status.
