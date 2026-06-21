import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Alert from '../../components/Alert.jsx';

export default function CoordinatorLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.post('/coordinator/login', form);
      if (res.data.success) {
        login(res.data.token, res.data.user, 'coordinator');
        setMessage({ type: 'success', text: '✅ Login successful! Redirecting...' });
        setTimeout(() => navigate('/coordinator/dashboard'), 600);
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-700 to-coord p-5">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-2xl text-violet-600">
            <i className="fas fa-chalkboard-teacher"></i>
          </div>
          <h1 className="text-lg font-bold text-slate-800">Coordinator Login</h1>
          <p className="text-sm text-slate-500">Kongu Engineering College - Club Management</p>
        </div>

        <Alert type={message?.type}>{message?.text}</Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email Address</label>
            <input
              type="email"
              className="input"
              required
              placeholder="your.email@kongu.edu"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
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
          <button type="submit" disabled={loading} className="btn w-full bg-coord text-white hover:bg-coord-dark">
            {loading ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-sign-in-alt"></i> Login</>}
          </button>
        </form>

        <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
          <i className="fas fa-info-circle"></i> New coordinators log in with the email and the default
          password <strong>kongu123</strong> given by the admin.
        </p>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm font-medium text-coord hover:underline">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
