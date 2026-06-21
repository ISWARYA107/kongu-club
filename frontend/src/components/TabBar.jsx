import React from 'react';

export default function TabBar({ tabs, active, onChange, accent = 'text-navy border-navy' }) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-white px-2 sm:px-6">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`flex items-center gap-2 border-b-[3px] px-4 py-3.5 text-sm font-semibold transition ${
            active === t.key ? accent : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <i className={`fas fa-${t.icon}`}></i>
          {t.label}
          {t.badge > 0 && (
            <span className="ml-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">
              {t.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
