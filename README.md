# 🚀 AI-Powered Warehouse & Order Fulfillment Optimizer (Smart WMS/OMS)

## 🧠 Overview
This project is a full-stack MERN application designed to optimize warehouse operations and order fulfillment using intelligent decision-making.

It automates:
- Warehouse selection based on location  
- Inventory allocation using **FEFO (First Expiry First Out)**  
- Real-time alerts for stock and expiry risks  

---

## 🎯 Problem Statement
Traditional warehouse systems rely on static rules and lack predictive intelligence, leading to:
- Stock shortages  
- Product expiry and wastage  
- Delayed deliveries  
- Inefficient inventory planning  

This project addresses these issues through smart allocation logic and data-driven insights.

---

## ⚙️ Features

### 📦 Order Processing
- Create and process orders  
- Automatic warehouse selection  
- FEFO-based inventory allocation  
- Handles out-of-stock scenarios  

### 🏭 Warehouse Management
- Add and manage warehouses  
- Location-based selection using pincode  

### 📦 Inventory Management
- Track stock with:
  - Bin location  
  - Batch number  
  - Expiry date  
  - Quantity  

### 🧠 Smart Allocation System
- Warehouse selection:
  - Same pincode → highest priority  
  - Same state → fallback  
- FEFO allocation:
  - Prioritizes earliest expiry  

### 🚨 Alerts System
- Low stock alerts  
- Near-expiry alerts  

### 🔐 Role-Based Access
- Admin  
- Warehouse Manager  
- Picker  

---

## 🧩 Tech Stack

- **Frontend:** React.js, Tailwind CSS  
- **Backend:** Node.js, Express.js  
- **Database:** MongoDB (Mongoose)  
- **Authentication:** JWT, bcrypt  
- **AI Integration:** OpenAI / Gemini API (optional)  

---
