import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function DashboardHeader({ icon, title, subtitle, userName, gradient }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/');
    }
  }

  return (
    <header className={`px-6 py-5 text-white ${gradient}`}>
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold">
            <i className={`fas fa-${icon}`}></i> {title}
          </h1>
          <p className="text-sm text-white/80">{subtitle}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm">
            Welcome, <strong>{userName}</strong>
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur transition hover:bg-white/20"
          >
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </div>
    </header>
  );
}
