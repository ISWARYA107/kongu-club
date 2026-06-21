import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';
import DashboardHeader from '../../components/DashboardHeader.jsx';
import TabBar from '../../components/TabBar.jsx';
import StatCard from '../../components/StatCard.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Spinner from '../../components/Spinner.jsx';
import Modal from '../../components/Modal.jsx';
import Alert from '../../components/Alert.jsx';

const TABS = [
  { key: 'overview', label: 'Overview', icon: 'chart-pie' },
  { key: 'allClubs', label: 'All Clubs', icon: 'th-large' },
  { key: 'myClubs', label: 'My Clubs', icon: 'users' },
  { key: 'events', label: 'Events', icon: 'calendar-alt' },
  { key: 'myEvents', label: 'My Events', icon: 'ticket-alt' },
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [toast, setToast] = useState(null);

  const [allClubs, setAllClubs] = useState(null);
  const [myClubs, setMyClubs] = useState(null);
  const [events, setEvents] = useState(null);
  const [myEvents, setMyEvents] = useState(null);

  const [detailClub, setDetailClub] = useState(null);
  const [detailEvents, setDetailEvents] = useState([]);
  const [regClub, setRegClub] = useState(null);
  const [regForm, setRegForm] = useState({ department: '', year: '', section: '', skills: '', experience: '', motivation: '' });
  const [submitting, setSubmitting] = useState(false);

  const flash = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const loadMyClubs = useCallback(async () => {
    const res = await api.get(`/student/my-clubs/${user.id}`);
    if (res.data.success) setMyClubs(res.data.clubs);
    return res.data.success ? res.data.clubs : [];
  }, [user.id]);

  const loadMyEvents = useCallback(async () => {
    const res = await api.get(`/student/my-events/${user.id}`);
    if (res.data.success) setMyEvents(res.data.events);
    return res.data.success ? res.data.events : [];
  }, [user.id]);

  const loadAllClubs = useCallback(async () => {
    const res = await api.get('/clubs');
    if (res.data.success) setAllClubs(res.data.clubs);
  }, []);

  const loadEvents = useCallback(async () => {
    const res = await api.get('/events/approved');
    if (res.data.success) setEvents(res.data.events);
  }, []);

  useEffect(() => {
    loadMyClubs();
    loadMyEvents();
  }, [loadMyClubs, loadMyEvents]);

  useEffect(() => {
    if (tab === 'allClubs' && allClubs === null) loadAllClubs();
    if (tab === 'events' && events === null) loadEvents();
  }, [tab, allClubs, events, loadAllClubs, loadEvents]);

  async function viewClubDetails(club) {
    setDetailClub(club);
    setDetailEvents([]);
    try {
      const res = await api.get(`/events/club/${club._id}`);
      if (res.data.success) setDetailEvents(res.data.events);
    } catch {
      /* ignore */
    }
  }

  function openRegistration(club) {
    setRegClub(club);
    setRegForm({ department: '', year: '', section: '', skills: '', experience: '', motivation: '' });
  }

  async function submitRegistration() {
    if (!regForm.department || !regForm.year || !regForm.section || !regForm.motivation) {
      flash('error', '❌ Please fill all required fields (Department, Year, Section, Motivation)');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/student/register-club', {
        student_id: user.id,
        club_id: regClub._id,
        department: regForm.department,
        academic_year: regForm.year,
        section: regForm.section,
        skills: regForm.skills,
        previous_experience: regForm.experience,
        motivation: regForm.motivation,
      });
      if (res.data.success) {
        flash('success', '✅ Registered! Waiting for coordinator approval.');
        setRegClub(null);
        loadAllClubs();
        loadMyClubs();
      } else {
        flash('error', '❌ ' + res.data.message);
      }
    } catch (err) {
      flash('error', '❌ ' + (err.response?.data?.message || 'Registration failed'));
    } finally {
      setSubmitting(false);
    }
  }

  async function registerForEvent(eventId) {
    try {
      const res = await api.post('/student/register-event', { student_id: user.id, event_id: eventId });
      if (res.data.success) {
        flash('success', '✅ Event registration submitted!');
        loadEvents();
        loadMyEvents();
      } else {
        flash('error', res.data.message);
      }
    } catch (err) {
      flash('error', err.response?.data?.message || 'Registration failed');
    }
  }

  const myClubIds = new Set((myClubs || []).map((c) => c._id));
  const myEventIds = new Map((myEvents || []).map((e) => [e.id, e.status]));

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader
        icon="user-graduate"
        title="Student Dashboard"
        subtitle="Kongu Engineering College"
        userName={user?.name}
        gradient="bg-gradient-to-r from-navy to-navy-light"
      />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <main className="mx-auto max-w-6xl px-6 py-8">
        {toast && <Alert type={toast.type}>{toast.text}</Alert>}

        {tab === 'overview' && (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            <StatCard icon="th-large" label="Total Clubs Available" value={allClubs?.length ?? '–'} />
            <StatCard icon="users" label="My Registered Clubs" value={myClubs?.length ?? 0} />
            <StatCard icon="calendar-alt" label="Upcoming Events" value={events?.length ?? '–'} />
            <StatCard icon="ticket-alt" label="My Event Registrations" value={myEvents?.length ?? 0} />
          </div>
        )}

        {tab === 'allClubs' && (
          allClubs === null ? <Spinner label="Loading all clubs..." /> :
          allClubs.length === 0 ? <EmptyState icon="th-large" title="No Clubs Available" message="There are no clubs in the system yet. Check back later!" /> :
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {allClubs.map((club) => {
              const status = myClubs?.find((c) => c._id === club._id)?.status;
              return (
                <div key={club._id} className="card cursor-pointer" onClick={() => viewClubDetails(club)}>
                  <div className="mb-3 flex items-start justify-between gap-2 border-b-2 border-gold pb-2">
                    <h3 className="font-bold text-slate-800">{club.club_name}</h3>
                    {status && <StatusBadge status={status} />}
                  </div>
                  <ul className="space-y-1 text-sm text-slate-600">
                    <li><strong>Coordinator:</strong> {club.faculty_coordinator || 'Not specified'}</li>
                    <li><strong>Category:</strong> {club.category || 'General'}</li>
                    {club.description && (
                      <li className="line-clamp-2"><strong>About:</strong> {club.description}</li>
                    )}
                  </ul>
                  <div className="mt-4 flex flex-col gap-2">
                    <button className="btn-outline w-full text-sm" onClick={(e) => { e.stopPropagation(); viewClubDetails(club); }}>
                      <i className="fas fa-eye"></i> View Details &amp; Events
                    </button>
                    {!status && (
                      <button
                        className="btn-primary w-full text-sm"
                        onClick={(e) => { e.stopPropagation(); openRegistration(club); }}
                      >
                        <i className="fas fa-user-plus"></i> Register for Club
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'myClubs' && (
          myClubs === null ? <Spinner label="Loading your clubs..." /> :
          myClubs.length === 0 ? (
            <EmptyState icon="users" title="No Club Registrations" message="You haven't registered for any clubs yet. Browse clubs to get started!" />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {myClubs.map((club) => (
                <div key={club._id} className="card cursor-pointer" onClick={() => viewClubDetails(club)}>
                  <div className="mb-3 flex items-start justify-between gap-2 border-b-2 border-gold pb-2">
                    <h3 className="font-bold text-slate-800">{club.club_name}</h3>
                    <StatusBadge status={club.status} />
                  </div>
                  <ul className="space-y-1 text-sm text-slate-600">
                    <li><strong>Coordinator:</strong> {club.faculty_coordinator || 'Not specified'}</li>
                    <li><strong>Category:</strong> {club.category || 'General'}</li>
                    <li><strong>Registered on:</strong> {new Date(club.registered_at).toLocaleDateString()}</li>
                  </ul>
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'events' && (
          <div>
            <div className="mb-5 text-center">
              <button className="btn-primary" onClick={loadEvents}>
                <i className="fas fa-sync-alt"></i> Refresh Events
              </button>
            </div>
            {events === null ? <Spinner label="Loading events..." /> :
              events.length === 0 ? <EmptyState icon="calendar-times" title="No Events Available" message="There are no upcoming events at the moment." /> :
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {events.map((ev) => {
                  const myStatus = myEventIds.get(ev.id);
                  const isPast = new Date(ev.event_date) < new Date();
                  return (
                    <div key={ev.id} className="card">
                      <div className="mb-3 flex items-center justify-between border-b-2 border-gold pb-2">
                        <h3 className="font-bold text-slate-800">{ev.event_name}</h3>
                        {myStatus ? <StatusBadge status={myStatus} /> : isPast ? <span className="badge bg-slate-100 text-slate-500">Past</span> : <span className="badge bg-sky-100 text-sky-700">Upcoming</span>}
                      </div>
                      <ul className="space-y-1 text-sm text-slate-600">
                        <li><strong>Club:</strong> {ev.club_name}</li>
                        <li><strong>Date:</strong> {new Date(ev.event_date).toLocaleDateString()}</li>
                        <li><strong>Time:</strong> {ev.event_time || 'TBA'}</li>
                        <li><strong>Venue:</strong> {ev.venue || 'TBA'}</li>
                        {ev.max_participants && <li><strong>Max Participants:</strong> {ev.max_participants}</li>}
                      </ul>
                      <div className="mt-4">
                        {myStatus ? (
                          <button disabled className={`btn w-full text-sm ${myStatus === 'approved' ? 'bg-emerald-600 text-white' : myStatus === 'pending' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'}`}>
                            <i className={`fas fa-${myStatus === 'approved' ? 'check' : myStatus === 'pending' ? 'clock' : 'times'}`}></i>
                            {myStatus === 'approved' ? 'Approved' : myStatus === 'pending' ? 'Pending Approval' : 'Rejected'}
                          </button>
                        ) : isPast ? (
                          <button disabled className="btn-outline w-full text-sm">Event Ended</button>
                        ) : (
                          <button className="btn-primary w-full text-sm" onClick={() => registerForEvent(ev.id)}>
                            <i className="fas fa-ticket-alt"></i> Register for Event
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            }
          </div>
        )}

        {tab === 'myEvents' && (
          myEvents === null ? <Spinner label="Loading your events..." /> :
          myEvents.length === 0 ? (
            <EmptyState icon="ticket-alt" title="No Event Registrations" message="You haven't registered for any events yet." />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {myEvents.map((ev) => (
                <div key={ev.id} className="card">
                  <div className="mb-3 flex items-center justify-between border-b-2 border-gold pb-2">
                    <h3 className="font-bold text-slate-800">{ev.event_name}</h3>
                    <StatusBadge status={ev.status} />
                  </div>
                  <ul className="space-y-1 text-sm text-slate-600">
                    <li><strong>Club:</strong> {ev.club_name}</li>
                    <li><strong>Date:</strong> {new Date(ev.event_date).toLocaleDateString()}</li>
                    <li><strong>Time:</strong> {ev.event_time || 'TBA'}</li>
                    <li><strong>Venue:</strong> {ev.venue || 'TBA'}</li>
                    <li><strong>Registered on:</strong> {new Date(ev.registered_at).toLocaleDateString()}</li>
                  </ul>
                </div>
              ))}
            </div>
          )
        )}
      </main>

      {/* Club details modal */}
      <Modal open={!!detailClub} onClose={() => setDetailClub(null)} title={detailClub?.club_name} wide>
        {detailClub && (
          <div className="space-y-6">
            <ul className="space-y-1.5 text-sm text-slate-600">
              <li><strong>Coordinator:</strong> {detailClub.faculty_coordinator || 'Not specified'}</li>
              <li><strong>Contact:</strong> {detailClub.faculty_contact || 'Not specified'}</li>
              <li><strong>Secretary:</strong> {detailClub.student_secretary || 'Not specified'}</li>
              <li><strong>Category:</strong> {detailClub.category || 'General'}</li>
              {detailClub.description && <li><strong>About:</strong> {detailClub.description}</li>}
            </ul>
            <div>
              <h3 className="mb-3 font-bold text-slate-800"><i className="fas fa-calendar-alt"></i> Club Events</h3>
              {detailEvents.length === 0 ? (
                <p className="text-sm text-slate-500">This club doesn't have any approved events yet.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {detailEvents.map((ev) => (
                    <div key={ev.id} className="rounded-lg border border-slate-200 p-4 text-sm">
                      <p className="font-semibold text-slate-800">{ev.event_name}</p>
                      <p className="mt-1 text-slate-500">{new Date(ev.event_date).toLocaleDateString()} {ev.event_time && `· ${ev.event_time}`}</p>
                      <p className="text-slate-500">{ev.venue || 'Venue TBA'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Registration modal */}
      <Modal open={!!regClub} onClose={() => setRegClub(null)} title={`Register for ${regClub?.club_name || ''}`}>
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            <i className="fas fa-info-circle"></i> Please fill in your details to apply.
          </p>
          <div>
            <label className="label">Department *</label>
            <input className="input" placeholder="e.g., CSE" value={regForm.department} onChange={(e) => setRegForm({ ...regForm, department: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Academic Year *</label>
              <select className="input" value={regForm.year} onChange={(e) => setRegForm({ ...regForm, year: e.target.value })}>
                <option value="">Select Year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>
            <div>
              <label className="label">Section *</label>
              <input className="input" placeholder="A" value={regForm.section} onChange={(e) => setRegForm({ ...regForm, section: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Skills / Interests</label>
            <textarea className="input" rows="2" value={regForm.skills} onChange={(e) => setRegForm({ ...regForm, skills: e.target.value })} />
          </div>
          <div>
            <label className="label">Previous Experience</label>
            <textarea className="input" rows="2" value={regForm.experience} onChange={(e) => setRegForm({ ...regForm, experience: e.target.value })} />
          </div>
          <div>
            <label className="label">Why do you want to join? *</label>
            <textarea className="input" rows="3" value={regForm.motivation} onChange={(e) => setRegForm({ ...regForm, motivation: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-2">
            <button className="btn-outline flex-1" onClick={() => setRegClub(null)}>Cancel</button>
            <button className="btn-primary flex-1" disabled={submitting} onClick={submitRegistration}>
              {submitting ? <i className="fas fa-spinner fa-spin"></i> : 'Submit Registration'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
