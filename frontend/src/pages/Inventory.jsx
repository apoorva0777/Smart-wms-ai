import React, { useEffect, useState } from 'react';
import API from '../utils/api';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const { data } = await API.get('/inventory');
      setInventory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading inventory...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Inventory Management</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left table-auto">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-4">Product Name</th>
              <th className="p-4">SKU</th>
              <th className="p-4">Warehouse</th>
              <th className="p-4">Batch No.</th>
              <th className="p-4">Bin Location</th>
              <th className="p-4">Quantity</th>
              <th className="p-4">Expiry Date</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map(inv => (
              <tr key={inv._id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-900">{inv.productId?.name}</td>
                <td className="p-4 text-gray-600">{inv.productId?.sku}</td>
                <td className="p-4 text-gray-600">{inv.warehouseId?.name}</td>
                <td className="p-4 font-mono text-sm text-gray-500">{inv.batchNumber}</td>
                <td className="p-4 text-gray-600">{inv.binLocation}</td>
                <td className="p-4 font-semibold text-gray-800">{inv.quantity}</td>
                <td className="p-4 text-gray-600">{new Date(inv.expiryDate).toLocaleDateString()}</td>
              </tr>
            ))}
            {inventory.length === 0 && (
              <tr>
                <td colSpan="7" className="p-4 text-center text-gray-500">No inventory found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Inventory;
