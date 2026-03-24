import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import Orders from './pages/Orders';
import Inventory from './pages/Inventory';
import CreateOrder from './pages/CreateOrder';

const ProtectedRoute = ({ children }) => {
  const token = Cookies.get('token');
  if (!token) return <Navigate to="/login" />;
  return children;
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/create" element={<CreateOrder />} />
          <Route path="inventory" element={<Inventory />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
