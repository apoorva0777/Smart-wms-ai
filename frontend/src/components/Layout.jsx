import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { LayoutDashboard, ShoppingCart, Archive } from 'lucide-react';

const Layout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    Cookies.remove('token');
    Cookies.remove('user');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 text-2xl font-bold border-b border-gray-800">
          Smart WMS
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavLink to="/dashboard" className={({ isActive }) => `flex items-center px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-blue-600' : 'hover:bg-gray-800'}`}>
            <LayoutDashboard className="mr-3 w-5 h-5" /> Dashboard
          </NavLink>
          <NavLink to="/orders" className={({ isActive }) => `flex items-center px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-blue-600' : 'hover:bg-gray-800'}`}>
            <ShoppingCart className="mr-3 w-5 h-5" /> Orders
          </NavLink>
          <NavLink to="/inventory" className={({ isActive }) => `flex items-center px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-blue-600' : 'hover:bg-gray-800'}`}>
            <Archive className="mr-3 w-5 h-5" /> Inventory
          </NavLink>
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button onClick={handleLogout} className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition duration-200">
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
