import React from 'react';

export default function EmptyState({ icon = 'inbox', title, message }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500">
      <i className={`fas fa-${icon} mb-2 text-4xl text-slate-300`}></i>
      <h3 className="font-semibold text-slate-700">{title}</h3>
      {message && <p className="max-w-sm text-sm">{message}</p>}
    </div>
  );
}
