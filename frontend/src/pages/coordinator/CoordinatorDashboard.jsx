import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';
import DashboardHeader from '../../components/DashboardHeader.jsx';
import TabBar from '../../components/TabBar.jsx';
import StatCard from '../../components/StatCard.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Spinner from '../../components/Spinner.jsx';
import Alert from '../../components/Alert.jsx';

export default function CoordinatorDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [toast, setToast] = useState(null);
  const [club, setClub] = useState(null);

  const [members, setMembers] = useState(null);
  const [pendingRegs, setPendingRegs] = useState(null);
  const [pendingEventRegs, setPendingEventRegs] = useState(null);
  const [notifications, setNotifications] = useState(null);
  const [myEvents, setMyEvents] = useState(null);

  const [eventForm, setEventForm] = useState({
    event_name: '', event_description: '', event_date: '', event_time: '', venue: '', max_participants: '',
  });
  const [creating, setCreating] = useState(false);

  const flash = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  // Load the coordinator's club once on mount
  useEffect(() => {
    api.get(`/coordinator/my-club/${user.id}`).then((res) => {
      if (res.data.success) setClub(res.data.club);
      else flash('error', res.data.message);
    });
  }, [user.id]);

  const loadMembers = useCallback(async () => {
    if (!club) return;
    const res = await api.get(`/coordinator/club-members/${club._id}`);
    if (res.data.success) setMembers(res.data.members);
  }, [club]);

  const loadPendingRegs = useCallback(async () => {
    if (!club) return;
    const res = await api.get(`/coordinator/pending-registrations/${club._id}`);
    if (res.data.success) setPendingRegs(res.data.registrations);
  }, [club]);

  const loadPendingEventRegs = useCallback(async () => {
    if (!club) return;
    const res = await api.get(`/coordinator/pending-event-registrations/${club._id}`);
    if (res.data.success) setPendingEventRegs(res.data.registrations);
  }, [club]);

  const loadNotifications = useCallback(async () => {
    const res = await api.get(`/coordinator/notifications/${user.id}`);
    if (res.data.success) setNotifications(res.data.notifications);
  }, [user.id]);

  const loadMyEvents = useCallback(async () => {
    if (!club) return;
    const res = await api.get(`/coordinator/my-events/${club._id}`);
    if (res.data.success) setMyEvents(res.data.events);
  }, [club]);

  useEffect(() => {
    if (!club) return;
    loadMembers();
    loadPendingRegs();
    loadPendingEventRegs();
    loadNotifications();
    loadMyEvents();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [club, loadMembers, loadPendingRegs, loadPendingEventRegs, loadNotifications, loadMyEvents]);

  async function actOnClubRegistration(registration_id, action) {
    if (!confirm(action === 'approve' ? 'Approve this student for club membership?' : "Reject this student's request?")) return;
    try {
      const res = await api.post('/coordinator/club-registration-action', { registration_id, action });
      if (res.data.success) {
        flash('success', action === 'approve' ? '✅ Student approved!' : '❌ Registration rejected.');
        loadPendingRegs();
        loadMembers();
      } else {
        flash('error', res.data.message);
      }
    } catch (err) {
      flash('error', err.response?.data?.message || 'Action failed');
    }
  }

  async function actOnEventRegistration(registration_id, action) {
    if (!confirm(action === 'approve' ? 'Approve this student for the event?' : "Reject this student's registration?")) return;
    try {
      const res = await api.post('/coordinator/event-registration-action', { registration_id, action });
      if (res.data.success) {
        flash('success', action === 'approve' ? '✅ Student approved for event!' : '❌ Event registration rejected.');
        loadPendingEventRegs();
      } else {
        flash('error', res.data.message);
      }
    } catch (err) {
      flash('error', err.response?.data?.message || 'Action failed');
    }
  }

  async function markRead(id) {
    await api.post('/coordinator/notifications/mark-read', { notification_id: id });
    loadNotifications();
  }

  async function submitEvent(e) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await api.post('/coordinator/create-event', {
        club_id: club._id,
        ...eventForm,
        max_participants: eventForm.max_participants || null,
      });
      if (res.data.success) {
        flash('success', '✅ Event submitted for admin approval!');
        setEventForm({ event_name: '', event_description: '', event_date: '', event_time: '', venue: '', max_participants: '' });
        loadMyEvents();
      } else {
        flash('error', res.data.message);
      }
    } catch (err) {
      flash('error', err.response?.data?.message || 'Failed to create event');
    } finally {
      setCreating(false);
    }
  }

  const unreadCount = (notifications || []).filter((n) => !n.is_read).length;
  const eventRegBadge = (pendingEventRegs || []).length;

  const TABS = [
    { key: 'overview', label: 'Overview', icon: 'chart-line' },
    { key: 'members', label: 'Club Members', icon: 'users' },
    { key: 'registrations', label: 'Club Registrations', icon: 'user-plus' },
    { key: 'eventRegistrations', label: 'Event Registrations', icon: 'ticket-alt', badge: eventRegBadge },
    { key: 'notifications', label: 'Notifications', icon: 'bell', badge: unreadCount },
    { key: 'createEvent', label: 'Create Event', icon: 'plus-circle' },
    { key: 'myEvents', label: 'My Events', icon: 'calendar-alt' },
  ];

  if (!club) {
    return (
      <div className="min-h-screen bg-slate-50">
        <DashboardHeader icon="chalkboard-teacher" title="Coordinator Dashboard" subtitle="Kongu Engineering College" userName={user?.name} gradient="bg-gradient-to-r from-violet-700 to-coord" />
        <Spinner label="Loading your club..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader icon="chalkboard-teacher" title="Coordinator Dashboard" subtitle="Kongu Engineering College" userName={user?.name} gradient="bg-gradient-to-r from-violet-700 to-coord" />

      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <h2 className="text-lg font-bold text-slate-800">
          <i className="fas fa-trophy text-coord"></i> Managing Club:{' '}
          <span className="rounded-full bg-coord px-4 py-1 text-sm text-white">{club.club_name}</span>
        </h2>
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} accent="text-coord border-coord" />

      <main className="mx-auto max-w-6xl px-6 py-8">
        {toast && <Alert type={toast.type}>{toast.text}</Alert>}

        {tab === 'overview' && (
          <>
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
              <StatCard icon="users" label="Total Club Members" value={members?.length ?? '–'} accent="text-coord" />
              <StatCard icon="calendar-check" label="Approved Events" value={(myEvents || []).filter((e) => e.status === 'approved').length} accent="text-emerald-600" />
              <StatCard icon="clock" label="Pending Club Registrations" value={pendingRegs?.length ?? '–'} accent="text-amber-500" />
              <StatCard icon="ticket-alt" label="Pending Event Registrations" value={pendingEventRegs?.length ?? '–'} accent="text-sky-600" />
            </div>
            <div className="card mt-8">
              <h3 className="mb-4 font-bold text-slate-800"><i className="fas fa-bolt"></i> Quick Actions</h3>
              <div className="flex flex-wrap gap-3">
                <button className="btn-primary" onClick={() => setTab('members')}><i className="fas fa-users"></i> View Members</button>
                <button className="btn-primary" onClick={() => setTab('registrations')}><i className="fas fa-user-check"></i> Review Registrations</button>
                <button className="btn-primary" onClick={() => setTab('eventRegistrations')}><i className="fas fa-ticket-alt"></i> Review Event Registrations</button>
                <button className="btn-primary" onClick={() => setTab('createEvent')}><i className="fas fa-plus"></i> Create Event</button>
              </div>
            </div>
          </>
        )}

        {tab === 'members' && (
          members === null ? <Spinner label="Loading club members..." /> :
          members.length === 0 ? <EmptyState icon="users-slash" title="No members found for this club." /> :
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((m) => (
              <div key={m.id} className="card">
                <h3 className="border-b-2 border-slate-100 pb-2 font-bold text-slate-800"><i className="fas fa-user-graduate text-coord"></i> {m.student_name}</h3>
                <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
                  <li><strong>Roll No:</strong> {m.college_id}</li>
                  <li><strong>Email:</strong> {m.email || 'N/A'}</li>
                  <li><strong>Department:</strong> {m.department}</li>
                  <li><strong>Year:</strong> {m.year}</li>
                  <li><strong>Contact:</strong> {m.contact || 'N/A'}</li>
                </ul>
              </div>
            ))}
          </div>
        )}

        {tab === 'registrations' && (
          pendingRegs === null ? <Spinner label="Loading pending registrations..." /> :
          pendingRegs.length === 0 ? <EmptyState icon="check-circle" title="No pending registration requests! All caught up." /> :
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pendingRegs.map((r) => (
              <div key={r.registration_id} className="card">
                <h3 className="border-b-2 border-slate-100 pb-2 font-bold text-slate-800"><i className="fas fa-user-plus text-coord"></i> {r.student_name}</h3>
                <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
                  <li><strong>Roll No:</strong> {r.college_id}</li>
                  <li><strong>Email:</strong> {r.email || 'N/A'}</li>
                  <li><strong>Department:</strong> {r.department}</li>
                  <li><strong>Year:</strong> {r.year}</li>
                  {r.motivation && <li><strong>Motivation:</strong> {r.motivation}</li>}
                  {r.skills && <li><strong>Skills:</strong> {r.skills}</li>}
                </ul>
                <div className="mt-4 flex gap-2">
                  <button className="btn-primary flex-1 text-sm" onClick={() => actOnClubRegistration(r.registration_id, 'approve')}><i className="fas fa-check"></i> Approve</button>
                  <button className="btn-danger flex-1 text-sm" onClick={() => actOnClubRegistration(r.registration_id, 'reject')}><i className="fas fa-times"></i> Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'eventRegistrations' && (
          pendingEventRegs === null ? <Spinner label="Loading event registrations..." /> :
          pendingEventRegs.length === 0 ? <EmptyState icon="check-circle" title="No pending event registration requests!" /> :
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pendingEventRegs.map((r) => (
              <div key={r.registration_id} className="card">
                <h3 className="border-b-2 border-slate-100 pb-2 font-bold text-slate-800"><i className="fas fa-ticket-alt text-coord"></i> {r.student_name}</h3>
                <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
                  <li><strong>Roll No:</strong> {r.college_id}</li>
                  <li><strong>Event:</strong> {r.event_name}</li>
                  <li><strong>Event Date:</strong> {new Date(r.event_date).toLocaleDateString()}</li>
                  <li><strong>Venue:</strong> {r.venue || 'TBA'}</li>
                </ul>
                <div className="mt-4 flex gap-2">
                  <button className="btn-primary flex-1 text-sm" onClick={() => actOnEventRegistration(r.registration_id, 'approve')}><i className="fas fa-check"></i> Approve</button>
                  <button className="btn-danger flex-1 text-sm" onClick={() => actOnEventRegistration(r.registration_id, 'reject')}><i className="fas fa-times"></i> Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'notifications' && (
          notifications === null ? <Spinner label="Loading notifications..." /> :
          notifications.length === 0 ? <EmptyState icon="bell-slash" title="No notifications!" /> :
          <div className="grid gap-4 sm:grid-cols-2">
            {notifications.map((n) => (
              <div key={n._id} className={`card ${!n.is_read ? 'border-l-4 border-l-coord' : 'opacity-70'}`}>
                <h3 className="flex items-center gap-2 font-bold text-slate-800">
                  <i className={`fas fa-${n.type === 'event_registration' ? 'ticket-alt' : 'user-plus'} text-coord`}></i>
                  {n.title}
                  {!n.is_read && <span className="badge bg-red-600 text-white">New</span>}
                </h3>
                <p className="mt-2 text-sm text-slate-600">{n.message}</p>
                <p className="mt-1 text-xs text-slate-400">{new Date(n.created_at).toLocaleString()}</p>
                {!n.is_read && (
                  <button className="btn-outline mt-3 text-sm" onClick={() => markRead(n._id)}><i className="fas fa-check"></i> Mark as Read</button>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'createEvent' && (
          <div className="mx-auto max-w-xl card">
            <div className="mb-4 rounded-lg bg-sky-50 p-3 text-sm text-sky-800">
              <i className="fas fa-info-circle"></i> Creating an event for <strong>{club.club_name}</strong>
            </div>
            <form onSubmit={submitEvent} className="space-y-4">
              <div>
                <label className="label">Event Name *</label>
                <input className="input" required value={eventForm.event_name} onChange={(e) => setEventForm({ ...eventForm, event_name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Event Date *</label>
                  <input type="date" className="input" required value={eventForm.event_date} onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })} />
                </div>
                <div>
                  <label className="label">Event Time</label>
                  <input type="time" className="input" value={eventForm.event_time} onChange={(e) => setEventForm({ ...eventForm, event_time: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Venue</label>
                <input className="input" placeholder="e.g., CSD Seminar Hall" value={eventForm.venue} onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })} />
              </div>
              <div>
                <label className="label">Description *</label>
                <textarea className="input" rows="4" required value={eventForm.event_description} onChange={(e) => setEventForm({ ...eventForm, event_description: e.target.value })} />
              </div>
              <div>
                <label className="label">Max Participants</label>
                <input type="number" className="input" placeholder="Leave empty for unlimited" value={eventForm.max_participants} onChange={(e) => setEventForm({ ...eventForm, max_participants: e.target.value })} />
              </div>
              <button type="submit" disabled={creating} className="btn w-full bg-coord text-white hover:bg-coord-dark">
                {creating ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-paper-plane"></i> Submit for Approval</>}
              </button>
            </form>
          </div>
        )}

        {tab === 'myEvents' && (
          myEvents === null ? <Spinner label="Loading events..." /> :
          myEvents.length === 0 ? <EmptyState icon="calendar-times" title="No events found for your club." /> :
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {myEvents.map((ev) => (
              <div key={ev.id} className="card">
                <div className="mb-3 flex items-center justify-between border-b-2 border-slate-100 pb-2">
                  <h3 className="font-bold text-slate-800">{ev.event_name}</h3>
                  <StatusBadge status={ev.status} />
                </div>
                <ul className="space-y-1.5 text-sm text-slate-600">
                  <li><strong>Date:</strong> {ev.event_date} {ev.event_time && `at ${ev.event_time}`}</li>
                  <li><strong>Venue:</strong> {ev.venue || 'TBA'}</li>
                  <li><strong>Max Participants:</strong> {ev.max_participants || 'Unlimited'}</li>
                  <li><strong>Approved Registrations:</strong> {ev.registrations_count}</li>
                </ul>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
