import React, { useEffect, useState } from 'react';
import API from '../utils/api';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await API.get('/orders');
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading orders...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Orders</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition" onClick={() => {/* Handle Add Order Modal */}}>
          Create Order
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left table-auto">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-4">Customer Name</th>
              <th className="p-4">Pincode</th>
              <th className="p-4">Items Required</th>
              <th className="p-4">Allocated / Unfulfilled</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order._id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-900">{order.customerName}</td>
                <td className="p-4 text-gray-600">{order.shippingAddress?.pincode}</td>
                <td className="p-4 text-gray-600">{order.items.length} product(s)</td>
                <td className="p-4 text-sm">
                  <span className="text-green-600 font-semibold">{order.allocatedItems.length} Allocated</span>
                  {' / '}
                  <span className="text-red-500 font-semibold">{order.unfulfilledItems.length} Missing</span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${order.status === 'Allocated' ? 'bg-green-100 text-green-800' : order.status === 'Unfulfilled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan="5" className="p-4 text-center text-gray-500">No orders found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Orders;
