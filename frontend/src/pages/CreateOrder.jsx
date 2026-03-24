import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';

const CreateOrder = () => {
  const [products, setProducts] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');
  const [cart, setCart] = useState([{ productId: '', quantity: 1 }]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await API.get('/products');
      setProducts(data);
    };
    fetchProducts();
  }, []);

  const handleAddToCart = () => {
    setCart([...cart, { productId: '', quantity: 1 }]);
  };

  const handleCartChange = (index, field, value) => {
    const newCart = [...cart];
    newCart[index][field] = value;
    setCart(newCart);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/orders', {
        customerName,
        shippingAddress: { street, city, state: stateName, pincode },
        items: cart.filter(item => item.productId !== '')
      });
      navigate('/orders');
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating order');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Create New Order</h1>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 font-bold mb-2">Customer Name</label>
            <input className="w-full px-3 py-2 border rounded" required value={customerName} onChange={e => setCustomerName(e.target.value)} />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2">Pincode</label>
            <input className="w-full px-3 py-2 border rounded" required value={pincode} onChange={e => setPincode(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <label className="block text-gray-700 font-bold mb-2">City</label>
            <input className="w-full px-3 py-2 border rounded" required value={city} onChange={e => setCity(e.target.value)} />
          </div>
          <div className="md:col-span-1">
            <label className="block text-gray-700 font-bold mb-2">State</label>
            <input className="w-full px-3 py-2 border rounded" required value={stateName} onChange={e => setStateName(e.target.value)} />
          </div>
          <div className="md:col-span-1">
            <label className="block text-gray-700 font-bold mb-2">Street</label>
            <input className="w-full px-3 py-2 border rounded" required value={street} onChange={e => setStreet(e.target.value)} />
          </div>
        </div>

        <hr className="my-6 border-gray-200" />
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Order Items</h2>
        
        {cart.map((item, index) => (
          <div key={index} className="flex gap-4 items-end mb-4">
            <div className="flex-1">
              <label className="block text-gray-700 text-sm font-bold mb-2">Product</label>
              <select 
                className="w-full px-3 py-2 border rounded" 
                required 
                value={item.productId} 
                onChange={e => handleCartChange(index, 'productId', e.target.value)}
              >
                <option value="">Select a product...</option>
                {products.map(p => (
                  <option key={p._id} value={p._id}>{p.name} - {p.sku}</option>
                ))}
              </select>
            </div>
            <div className="w-32">
              <label className="block text-gray-700 text-sm font-bold mb-2">Quantity</label>
              <input 
                type="number" 
                min="1" 
                className="w-full px-3 py-2 border rounded" 
                required 
                value={item.quantity} 
                onChange={e => handleCartChange(index, 'quantity', parseInt(e.target.value))} 
              />
            </div>
            {index === cart.length - 1 && (
              <button 
                type="button" 
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-bold h-[42px]"
                onClick={handleAddToCart}
              >
                + Add
              </button>
            )}
          </div>
        ))}
        
        <div className="pt-6">
          <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition duration-200 text-lg">
            Place Order & Auto Optimize Route
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateOrder;
