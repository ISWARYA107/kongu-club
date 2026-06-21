import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Alert from '../../components/Alert.jsx';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.post('/admin/login', form);
      if (res.data.success) {
        login(res.data.token, res.data.user, 'admin');
        setMessage({ type: 'success', text: '✅ Login successful! Redirecting...' });
        setTimeout(() => navigate('/admin/dashboard'), 600);
      } else {
        setMessage({ type: 'error', text: res.data.message });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please check if the server is running.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-admin to-slate-700 p-5">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600">
            <i className="fas fa-shield-alt"></i>
          </div>
          <h1 className="text-lg font-bold text-slate-800">Admin Login</h1>
          <p className="text-sm text-slate-500">Kongu Engineering College - Club Management</p>
        </div>

        <Alert type={message?.type}>{message?.text}</Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Username</label>
            <input
              className="input"
              required
              autoFocus
              placeholder="admin"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              required
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <button type="submit" disabled={loading} className="btn w-full bg-emerald-600 text-white hover:bg-emerald-700">
            {loading ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-sign-in-alt"></i> Login</>}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm font-medium text-emerald-700 hover:underline">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
