import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Alert from '../../components/Alert.jsx';

export default function StudentLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type, text }

  const [loginForm, setLoginForm] = useState({ college_id: '', password: '' });
  const [regForm, setRegForm] = useState({
    college_id: '',
    name: '',
    department: '',
    year: '',
    contact: '',
    email: '',
    password: '',
  });

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.post('/student/login', loginForm);
      if (res.data.success) {
        login(res.data.token, res.data.user, 'student');
        setMessage({ type: 'success', text: '✅ Login successful! Redirecting...' });
        setTimeout(() => navigate('/student/dashboard'), 600);
      } else {
        setMessage({ type: 'error', text: res.data.message });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please check if the server is running.' });
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.post('/student/register', regForm);
      if (res.data.success) {
        setMessage({ type: 'success', text: '✅ Registration successful! Please login.' });
        setLoginForm({ college_id: regForm.college_id, password: regForm.password });
        setTab('login');
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-navy to-navy-light p-5">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex border-b-2 border-slate-100">
          {['login', 'register'].map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setMessage(null); }}
              className={`flex-1 border-b-[3px] py-3 text-sm font-semibold capitalize transition ${
                tab === t ? 'border-navy text-navy' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mb-6 text-center">
          <i className="fas fa-user-graduate mb-3 text-4xl text-navy"></i>
          <h1 className="text-lg font-bold text-navy">Student Portal</h1>
          <p className="text-sm text-slate-500">Kongu Engineering College</p>
        </div>

        <Alert type={message?.type}>{message?.text}</Alert>

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">College ID</label>
              <input
                className="input"
                required
                placeholder="e.g., 21cse001@kongu.edu"
                value={loginForm.college_id}
                onChange={(e) => setLoginForm({ ...loginForm, college_id: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                required
                placeholder="Enter your password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Login'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="label">College ID</label>
              <input
                className="input"
                required
                placeholder="e.g., 21cse001@kongu.edu"
                value={regForm.college_id}
                onChange={(e) => setRegForm({ ...regForm, college_id: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Full Name</label>
              <input
                className="input"
                required
                value={regForm.name}
                onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Department</label>
                <input
                  className="input"
                  placeholder="CSE"
                  value={regForm.department}
                  onChange={(e) => setRegForm({ ...regForm, department: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Year</label>
                <select
                  className="input"
                  value={regForm.year}
                  onChange={(e) => setRegForm({ ...regForm, year: e.target.value })}
                >
                  <option value="">Select</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Contact</label>
                <input
                  className="input"
                  value={regForm.contact}
                  onChange={(e) => setRegForm({ ...regForm, contact: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  className="input"
                  type="email"
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                required
                placeholder="Create a password"
                value={regForm.password}
                onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Register'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm font-medium text-navy hover:underline">
            ← Back to Main Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
