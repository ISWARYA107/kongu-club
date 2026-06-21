import React from 'react';

export default function StatCard({ icon, label, value, accent = 'text-navy' }) {
  return (
    <div className="card flex flex-col items-center text-center">
      <i className={`fas fa-${icon} mb-3 text-3xl ${accent}`}></i>
      <div className="text-3xl font-extrabold text-slate-800">{value}</div>
      <p className="mt-1 text-sm font-medium text-slate-500">{label}</p>
    </div>
  );
}
