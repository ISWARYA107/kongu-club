import React from 'react';

const ICONS = { pending: 'clock', approved: 'check', rejected: 'times' };

export default function StatusBadge({ status }) {
  const s = status || 'pending';
  return (
    <span className={s === 'approved' ? 'badge-approved' : s === 'rejected' ? 'badge-rejected' : 'badge-pending'}>
      <i className={`fas fa-${ICONS[s] || 'question'}`}></i>
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  );
}
