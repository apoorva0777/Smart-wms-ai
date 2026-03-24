import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import Cookies from 'js-cookie';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post('/auth/login', { email, password });
      Cookies.set('token', data.token);
      Cookies.set('user', JSON.stringify(data));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white border border-gray-200 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center text-blue-600 mb-6">Smart WMS</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
            <input 
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
            <input 
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md transition duration-200">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
