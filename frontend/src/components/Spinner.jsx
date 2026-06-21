import React from 'react';

export default function Spinner({ label = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
      <i className="fas fa-spinner fa-spin text-3xl"></i>
      <p>{label}</p>
    </div>
  );
}
