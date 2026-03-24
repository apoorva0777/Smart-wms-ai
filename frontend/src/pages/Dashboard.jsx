import React, { useEffect, useState } from 'react';
import API from '../utils/api';
import { AlertCircle, PackageOpen } from 'lucide-react';

const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const { data } = await API.get('/dashboard');
        setMetrics(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMetrics();
  }, []);

  if (!metrics) return <div className="p-8">Loading dashboard...</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500 flex items-center">
          <AlertCircle className="text-red-500 w-12 h-12 mr-4" />
          <div>
            <h2 className="text-xl font-semibold text-gray-700">Low Stock Alerts</h2>
            <p className="text-3xl font-bold">{metrics.lowStockCount}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500 flex items-center">
          <PackageOpen className="text-yellow-500 w-12 h-12 mr-4" />
          <div>
            <h2 className="text-xl font-semibold text-gray-700">Near Expiry Batches</h2>
            <p className="text-3xl font-bold">{metrics.nearExpiryCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">AI Suggestions</h2>
        <ul className="space-y-2">
          {metrics.suggestions.length > 0 ? (
            metrics.suggestions.map((s, idx) => (
              <li key={idx} className="bg-blue-50 text-blue-800 px-4 py-3 rounded border border-blue-200">
                {s}
              </li>
            ))
          ) : (
            <li className="text-gray-500">Everything looks optimal.</li>
          )}
        </ul>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Recent Orders</h2>
        <table className="w-full text-left table-auto">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="p-3">Order ID</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {metrics.recentOrders.map(order => (
              <tr key={order._id} className="border-b hover:bg-gray-50">
                <td className="p-3 text-sm">{order._id}</td>
                <td className="p-3">{order.customerName}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${order.status === 'Allocated' ? 'bg-green-100 text-green-800' : order.status === 'Unfulfilled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {order.status}
                  </span>
                </td>
                <td className="p-3 text-sm">{new Date(order.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
