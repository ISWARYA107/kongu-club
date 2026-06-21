import React from 'react';

export default function Alert({ type = 'info', children }) {
  if (!children) return null;

  const styles = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-sky-50 text-sky-800 border-sky-200',
  };

  const icons = { success: 'check-circle', error: 'exclamation-circle', info: 'info-circle' };

  return (
    <div className={`mb-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium ${styles[type]}`}>
      <i className={`fas fa-${icons[type]}`}></i>
      <span>{children}</span>
    </div>
  );
}
