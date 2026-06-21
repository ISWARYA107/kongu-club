import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios.js';

const PORTALS = [
  {
    role: 'student',
    title: 'Student Portal',
    description: 'Browse clubs, join activities, and register for events',
    icon: 'user-graduate',
    accent: 'bg-sky-500',
    button: 'border-sky-500 text-sky-600 hover:bg-sky-500',
  },
  {
    role: 'coordinator',
    title: 'Club Coordinator',
    description: 'Manage club activities, approve members, and create events',
    icon: 'users',
    accent: 'bg-violet-500',
    button: 'border-violet-500 text-violet-600 hover:bg-violet-500',
  },
  {
    role: 'admin',
    title: 'Admin Login',
    description: 'Manage coordinators and approve events',
    icon: 'shield-alt',
    accent: 'bg-emerald-500',
    button: 'border-emerald-500 text-emerald-600 hover:bg-emerald-500',
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState([]);

  useEffect(() => {
    api
      .get('/clubs')
      .then((res) => {
        if (res.data.success) setClubs(res.data.clubs.slice(0, 3));
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-navy/95 text-white backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <i className="fas fa-graduation-cap text-2xl text-gold"></i>
            <span className="text-lg font-semibold">Kongu Engineering College</span>
          </div>
          <nav className="hidden gap-6 text-sm font-medium sm:flex">
            <a href="#about" className="hover:text-gold">About</a>
            <a href="#clubs" className="hover:text-gold">Clubs</a>
            <a href="#portals" className="hover:text-gold">Portals</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-navy to-navy-light px-6 py-24 text-center text-white">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-2 border-white/30 bg-white/10 backdrop-blur">
          <i className="fas fa-graduation-cap text-4xl text-gold"></i>
        </div>
        <h1 className="mt-6 text-4xl font-extrabold sm:text-5xl">Kongu Engineering College</h1>
        <p className="mt-2 text-xl font-medium text-gold">Perundurai</p>
        <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">Student Club Registration Portal</h2>
        <p className="mx-auto mt-4 max-w-xl text-white/85">
          Join exciting clubs, participate in activities, and make the most of your college experience.
        </p>
        <a href="#portals" className="btn-gold mt-8 inline-flex">
          Explore Portals <i className="fas fa-arrow-down"></i>
        </a>
      </section>

      {/* Portals */}
      <section id="portals" className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-8 sm:grid-cols-3">
          {PORTALS.map((p) => (
            <div key={p.role} className="card flex flex-col items-center text-center">
              <div className={`mb-5 flex h-16 w-16 items-center justify-center rounded-full ${p.accent} text-2xl text-white`}>
                <i className={`fas fa-${p.icon}`}></i>
              </div>
              <h3 className="text-lg font-bold text-slate-800">{p.title}</h3>
              <p className="mt-2 text-sm text-slate-500">{p.description}</p>
              <button
                onClick={() => navigate(`/${p.role}/login`)}
                className={`btn-outline mt-6 w-full border-2 hover:text-white ${p.button}`}
              >
                {p.role === 'student' ? 'Enter Portal' : 'Login'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section id="about" className="bg-navy px-6 py-20 text-center text-white">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold">About Our Portal</h2>
          <div className="mx-auto mt-3 mb-6 h-1 w-24 bg-gold"></div>
          <p className="text-white/85">
            The Student Club Registration Portal at Kongu Engineering College provides a centralized
            platform for students to explore, join, and participate in various clubs and extracurricular
            activities.
          </p>
          <p className="mt-4 text-white/85">
            Our mission is to enhance the college experience by fostering creativity, leadership, and
            collaboration through diverse student-led initiatives.
          </p>
        </div>
      </section>

      {/* Clubs preview */}
      <section id="clubs" className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h2 className="text-3xl font-bold text-slate-800">Featured Clubs</h2>
        <div className="mx-auto mt-3 mb-10 h-1 w-24 bg-navy"></div>

        {clubs.length === 0 ? (
          <p className="text-slate-500">Clubs will appear here once an admin adds them.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-3">
            {clubs.map((club) => (
              <div key={club._id} className="card text-left">
                <h3 className="border-b-2 border-gold pb-2 text-lg font-bold text-slate-800">
                  {club.club_name}
                </h3>
                <p className="mt-3 text-sm text-slate-500">
                  {club.description || 'No description provided yet.'}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="bg-slate-800 px-6 py-8 text-center text-sm text-slate-300">
        <p>© {new Date().getFullYear()} Kongu Engineering College - Perundurai. All rights reserved.</p>
        <p className="mt-1">Contact: info@kongu.edu | Phone: +91 1234 567890</p>
      </footer>
    </div>
  );
}
