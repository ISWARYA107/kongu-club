import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Home from './pages/Home.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import StudentLogin from './pages/student/StudentLogin.jsx';
import StudentDashboard from './pages/student/StudentDashboard.jsx';

import CoordinatorLogin from './pages/coordinator/CoordinatorLogin.jsx';
import CoordinatorDashboard from './pages/coordinator/CoordinatorDashboard.jsx';

import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route path="/student/login" element={<StudentLogin />} />
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute role="student" redirectTo="/student/login">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="/coordinator/login" element={<CoordinatorLogin />} />
      <Route
        path="/coordinator/dashboard"
        element={
          <ProtectedRoute role="coordinator" redirectTo="/coordinator/login">
            <CoordinatorDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute role="admin" redirectTo="/admin/login">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Home />} />
    </Routes>
  );
}
