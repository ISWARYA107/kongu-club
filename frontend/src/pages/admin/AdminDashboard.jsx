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

const CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Professional', 'Legal', 'General'];

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'tachometer-alt' },
  { key: 'clubs', label: 'View Clubs', icon: 'th-large' },
  { key: 'addClub', label: 'Add Club', icon: 'plus-circle' },
  { key: 'coordinators', label: 'Coordinators', icon: 'chalkboard-teacher' },
  { key: 'addCoordinator', label: 'Add Coordinator', icon: 'user-plus' },
  { key: 'pendingEvents', label: 'Pending Events', icon: 'hourglass-half' },
  { key: 'statistics', label: 'Statistics', icon: 'chart-bar' },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('dashboard');
  const [toast, setToast] = useState(null);

  const [stats, setStats] = useState(null);
  const [recentEvents, setRecentEvents] = useState(null);
  const [clubs, setClubs] = useState(null);
  const [coordinators, setCoordinators] = useState(null);
  const [pendingEvents, setPendingEvents] = useState(null);
  const [memberCounts, setMemberCounts] = useState(null);
  const [clubSearch, setClubSearch] = useState('');

  const [clubForm, setClubForm] = useState({
    club_name: '', category: 'General', faculty_coordinator: '', faculty_contact: '',
    student_secretary: '', student_rollno: '', student_contact: '', description: '',
  });
  const [coordForm, setCoordForm] = useState({ name: '', email: '', contact: '', emp_id: '', club_id: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const flash = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const loadStats = useCallback(async () => {
    const res = await api.get('/admin/stats');
    if (res.data.success) setStats(res.data.stats);
  }, []);

  const loadRecentEvents = useCallback(async () => {
    const res = await api.get('/admin/events');
    if (res.data.success) setRecentEvents(res.data.events);
  }, []);

  const loadClubs = useCallback(async () => {
    const res = await api.get('/admin/clubs');
    if (res.data.success) setClubs(res.data.clubs);
  }, []);

  const loadCoordinators = useCallback(async () => {
    const res = await api.get('/admin/coordinators');
    if (res.data.success) setCoordinators(res.data.coordinators);
  }, []);

  const loadPendingEvents = useCallback(async () => {
    const res = await api.get('/admin/pending-events');
    if (res.data.success) setPendingEvents(res.data.events);
  }, []);

  const loadMemberCounts = useCallback(async () => {
    const res = await api.get('/admin/club-member-counts');
    if (res.data.success) setMemberCounts(res.data.counts);
  }, []);

  useEffect(() => {
    loadStats();
    loadRecentEvents();
    loadClubs(); // also needed for the Add Coordinator club dropdown
  }, [loadStats, loadRecentEvents, loadClubs]);

  useEffect(() => {
    if (tab === 'coordinators' && coordinators === null) loadCoordinators();
    if (tab === 'pendingEvents' && pendingEvents === null) loadPendingEvents();
    if (tab === 'statistics') {
      loadStats();
      loadMemberCounts();
    }
  }, [tab, coordinators, pendingEvents, loadCoordinators, loadPendingEvents, loadStats, loadMemberCounts]);

  async function submitClub(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/admin/add-club', clubForm);
      if (res.data.success) {
        flash('success', '✅ Club added successfully!');
        setClubForm({ club_name: '', category: 'General', faculty_coordinator: '', faculty_contact: '', student_secretary: '', student_rollno: '', student_contact: '', description: '' });
        loadClubs();
        loadStats();
      } else {
        flash('error', res.data.message);
      }
    } catch (err) {
      flash('error', err.response?.data?.message || 'Failed to add club');
    } finally {
      setSubmitting(false);
    }
  }

  async function submitCoordinator(e) {
    e.preventDefault();
    if (!coordForm.club_id) {
      flash('error', '❌ Please select a club');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/admin/add-coordinator', coordForm);
      if (res.data.success) {
        flash('success', '✅ ' + res.data.message);
        setCoordForm({ name: '', email: '', contact: '', emp_id: '', club_id: '', notes: '' });
        loadCoordinators();
        loadStats();
      } else {
        flash('error', res.data.message);
      }
    } catch (err) {
      flash('error', err.response?.data?.message || 'Failed to add coordinator');
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteCoordinator(id, name) {
    if (!confirm(`Remove coordinator "${name}"? This cannot be undone.`)) return;
    try {
      const res = await api.delete(`/admin/delete-coordinator/${id}`);
      if (res.data.success) {
        flash('success', '✅ Coordinator removed.');
        loadCoordinators();
        loadStats();
      } else {
        flash('error', res.data.message);
      }
    } catch (err) {
      flash('error', err.response?.data?.message || 'Failed to delete coordinator');
    }
  }

  async function actOnEvent(event_id, action) {
    if (!confirm(action === 'approve' ? 'Approve this event?' : 'Reject this event?')) return;
    try {
      const res = await api.post('/admin/event-approval', { event_id, action });
      if (res.data.success) {
        flash('success', action === 'approve' ? '✅ Event approved!' : '❌ Event rejected.');
        loadPendingEvents();
        loadStats();
        loadRecentEvents();
      } else {
        flash('error', res.data.message);
      }
    } catch (err) {
      flash('error', err.response?.data?.message || 'Action failed');
    }
  }

  const filteredClubs = (clubs || []).filter((c) =>
    c.club_name.toLowerCase().includes(clubSearch.toLowerCase())
  );

  const memberCountFor = (clubId) => memberCounts?.find((m) => m._id === clubId)?.member_count || 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader
        icon="shield-alt"
        title="Admin Dashboard"
        subtitle="Kongu Engineering College - Club Management"
        userName={user?.name}
        gradient="bg-gradient-to-r from-admin to-slate-700"
      />
      <TabBar tabs={TABS} active={tab} onChange={setTab} accent="text-emerald-700 border-emerald-700" />

      <main className="mx-auto max-w-6xl px-6 py-8">
        {toast && <Alert type={toast.type}>{toast.text}</Alert>}

        {tab === 'dashboard' && (
          <>
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-5">
              <StatCard icon="th-large" label="Total Clubs" value={stats?.total_clubs ?? '–'} accent="text-emerald-600" />
              <StatCard icon="calendar-alt" label="Total Events" value={stats?.total_events ?? '–'} accent="text-emerald-600" />
              <StatCard icon="hourglass-half" label="Pending Events" value={stats?.pending_events ?? '–'} accent="text-amber-500" />
              <StatCard icon="user-graduate" label="Total Students" value={stats?.total_students ?? '–'} accent="text-emerald-600" />
              <StatCard icon="chalkboard-teacher" label="Coordinators" value={stats?.total_coordinators ?? '–'} accent="text-emerald-600" />
            </div>

            <div className="card mt-8">
              <h3 className="mb-4 font-bold text-slate-800"><i className="fas fa-history"></i> Recent Activity</h3>
              {recentEvents === null ? <Spinner label="Loading recent activity..." /> :
                recentEvents.length === 0 ? <p className="text-sm text-slate-500">No events yet.</p> :
                <div className="divide-y divide-slate-100">
                  {recentEvents.map((e) => (
                    <div key={e.id} className="flex items-center justify-between py-3 text-sm">
                      <div>
                        <p className="font-semibold text-slate-700">{e.event_name}</p>
                        <p className="text-slate-400">{e.club_name} · {new Date(e.created_at).toLocaleDateString()}</p>
                      </div>
                      <StatusBadge status={e.status} />
                    </div>
                  ))}
                </div>
              }
            </div>
          </>
        )}

        {tab === 'clubs' && (
          <div>
            <input
              className="input mb-5 max-w-sm"
              placeholder="🔍 Search clubs by name..."
              value={clubSearch}
              onChange={(e) => setClubSearch(e.target.value)}
            />
            {clubs === null ? <Spinner label="Loading clubs..." /> :
              filteredClubs.length === 0 ? <EmptyState icon="th-large" title="No clubs found." /> :
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredClubs.map((c) => (
                  <div key={c._id} className="card">
                    <h3 className="border-b-2 border-emerald-200 pb-2 font-bold text-slate-800">{c.club_name}</h3>
                    <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
                      <li><strong>Category:</strong> {c.category}</li>
                      <li><strong>Coordinator:</strong> {c.faculty_coordinator || 'Not assigned'}</li>
                      <li><strong>Secretary:</strong> {c.student_secretary || 'N/A'}</li>
                      {c.description && <li className="line-clamp-2"><strong>About:</strong> {c.description}</li>}
                    </ul>
                  </div>
                ))}
              </div>
            }
          </div>
        )}

        {tab === 'addClub' && (
          <div className="mx-auto max-w-xl card">
            <form onSubmit={submitClub} className="space-y-4">
              <div>
                <label className="label">Club Name *</label>
                <input className="input" required value={clubForm.club_name} onChange={(e) => setClubForm({ ...clubForm, club_name: e.target.value })} />
              </div>
              <div>
                <label className="label">Category</label>
                <select className="input" value={clubForm.category} onChange={(e) => setClubForm({ ...clubForm, category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Faculty Coordinator</label>
                  <input className="input" value={clubForm.faculty_coordinator} onChange={(e) => setClubForm({ ...clubForm, faculty_coordinator: e.target.value })} />
                </div>
                <div>
                  <label className="label">Faculty Contact</label>
                  <input className="input" value={clubForm.faculty_contact} onChange={(e) => setClubForm({ ...clubForm, faculty_contact: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Student Secretary</label>
                  <input className="input" value={clubForm.student_secretary} onChange={(e) => setClubForm({ ...clubForm, student_secretary: e.target.value })} />
                </div>
                <div>
                  <label className="label">Secretary Roll No</label>
                  <input className="input" value={clubForm.student_rollno} onChange={(e) => setClubForm({ ...clubForm, student_rollno: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Secretary Contact</label>
                <input className="input" value={clubForm.student_contact} onChange={(e) => setClubForm({ ...clubForm, student_contact: e.target.value })} />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input" rows="3" value={clubForm.description} onChange={(e) => setClubForm({ ...clubForm, description: e.target.value })} />
              </div>
              <button type="submit" disabled={submitting} className="btn w-full bg-emerald-600 text-white hover:bg-emerald-700">
                {submitting ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-plus"></i> Add Club</>}
              </button>
            </form>
          </div>
        )}

        {tab === 'coordinators' && (
          coordinators === null ? <Spinner label="Loading coordinators..." /> :
          coordinators.length === 0 ? <EmptyState icon="chalkboard-teacher" title="No coordinators added yet." /> :
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {coordinators.map((c) => (
              <div key={c.id} className="card">
                <h3 className="border-b-2 border-emerald-200 pb-2 font-bold text-slate-800">{c.name}</h3>
                <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
                  <li><strong>Email:</strong> {c.email}</li>
                  <li><strong>Club:</strong> {c.club_name || 'Not assigned'}</li>
                  <li><strong>Emp ID:</strong> {c.emp_id || 'N/A'}</li>
                  <li><strong>Contact:</strong> {c.contact || 'N/A'}</li>
                  <li><strong>Status:</strong> <span className="capitalize">{c.status}</span></li>
                </ul>
                <button className="btn-danger mt-4 w-full text-sm" onClick={() => deleteCoordinator(c.id, c.name)}>
                  <i className="fas fa-trash"></i> Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === 'addCoordinator' && (
          <div className="mx-auto max-w-xl card">
            <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              <i className="fas fa-info-circle"></i> New coordinators are given the default password <strong>kongu123</strong>.
            </div>
            <form onSubmit={submitCoordinator} className="space-y-4">
              <div>
                <label className="label">Name *</label>
                <input className="input" required value={coordForm.name} onChange={(e) => setCoordForm({ ...coordForm, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" className="input" required value={coordForm.email} onChange={(e) => setCoordForm({ ...coordForm, email: e.target.value })} />
              </div>
              <div>
                <label className="label">Assign Club *</label>
                <select className="input" required value={coordForm.club_id} onChange={(e) => setCoordForm({ ...coordForm, club_id: e.target.value })}>
                  <option value="">Select a club</option>
                  {(clubs || []).map((c) => <option key={c._id} value={c._id}>{c.club_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Contact</label>
                  <input className="input" value={coordForm.contact} onChange={(e) => setCoordForm({ ...coordForm, contact: e.target.value })} />
                </div>
                <div>
                  <label className="label">Employee ID</label>
                  <input className="input" value={coordForm.emp_id} onChange={(e) => setCoordForm({ ...coordForm, emp_id: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea className="input" rows="2" value={coordForm.notes} onChange={(e) => setCoordForm({ ...coordForm, notes: e.target.value })} />
              </div>
              <button type="submit" disabled={submitting} className="btn w-full bg-emerald-600 text-white hover:bg-emerald-700">
                {submitting ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-user-plus"></i> Add Coordinator</>}
              </button>
            </form>
          </div>
        )}

        {tab === 'pendingEvents' && (
          pendingEvents === null ? <Spinner label="Loading pending events..." /> :
          pendingEvents.length === 0 ? <EmptyState icon="check-circle" title="No pending events! All caught up." /> :
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pendingEvents.map((e) => (
              <div key={e.id} className="card">
                <h3 className="border-b-2 border-amber-200 pb-2 font-bold text-slate-800">{e.event_name}</h3>
                <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
                  <li><strong>Club:</strong> {e.club_name}</li>
                  <li><strong>Date:</strong> {e.event_date} {e.event_time && `at ${e.event_time}`}</li>
                  <li><strong>Venue:</strong> {e.venue || 'TBA'}</li>
                  {e.max_participants && <li><strong>Max Participants:</strong> {e.max_participants}</li>}
                  {e.event_description && <li><strong>Description:</strong> {e.event_description}</li>}
                </ul>
                <div className="mt-4 flex gap-2">
                  <button className="btn w-full flex-1 bg-emerald-600 text-sm text-white hover:bg-emerald-700" onClick={() => actOnEvent(e.id, 'approve')}><i className="fas fa-check"></i> Approve</button>
                  <button className="btn-danger flex-1 text-sm" onClick={() => actOnEvent(e.id, 'reject')}><i className="fas fa-times"></i> Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'statistics' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-5">
              <StatCard icon="th-large" label="Total Clubs" value={stats?.total_clubs ?? '–'} accent="text-emerald-600" />
              <StatCard icon="calendar-alt" label="Total Events" value={stats?.total_events ?? '–'} accent="text-emerald-600" />
              <StatCard icon="hourglass-half" label="Pending Events" value={stats?.pending_events ?? '–'} accent="text-amber-500" />
              <StatCard icon="user-graduate" label="Total Students" value={stats?.total_students ?? '–'} accent="text-emerald-600" />
              <StatCard icon="chalkboard-teacher" label="Coordinators" value={stats?.total_coordinators ?? '–'} accent="text-emerald-600" />
            </div>

            <div className="card">
              <h3 className="mb-4 font-bold text-slate-800"><i className="fas fa-users"></i> Members per Club</h3>
              {clubs === null || memberCounts === null ? <Spinner label="Loading statistics..." /> :
                clubs.length === 0 ? <p className="text-sm text-slate-500">No clubs yet.</p> :
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2">Club</th>
                      <th className="py-2">Category</th>
                      <th className="py-2 text-right">Members</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clubs.map((c) => (
                      <tr key={c._id} className="border-b border-slate-50">
                        <td className="py-2.5 font-medium text-slate-700">{c.club_name}</td>
                        <td className="py-2.5 text-slate-500">{c.category}</td>
                        <td className="py-2.5 text-right font-semibold text-emerald-700">{memberCountFor(c._id)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              }
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
