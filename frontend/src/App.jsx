import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FlightSearch from './pages/FlightSearch';
import HotelSearch from './pages/HotelSearch';
import MyBookings from './pages/MyBookings';
import Approvals from './pages/Approvals';
import AdminDashboard from './pages/AdminDashboard';
import Delegations from './pages/Delegations';
import Profile from './pages/Profile';
import UserManagement from './pages/UserManagement';
import PolicyManagement from './pages/PolicyManagement';

// Components
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';

function AppContent() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
          
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          
          <Route path="/flights" element={
            <PrivateRoute>
              <FlightSearch />
            </PrivateRoute>
          } />
          
          <Route path="/hotels" element={
            <PrivateRoute>
              <HotelSearch />
            </PrivateRoute>
          } />
          
          <Route path="/my-bookings" element={
            <PrivateRoute>
              <MyBookings />
            </PrivateRoute>
          } />
          
          <Route path="/approvals" element={
            <PrivateRoute roles={['approver', 'admin']}>
              <Approvals />
            </PrivateRoute>
          } />
          
          <Route path="/delegations" element={
            <PrivateRoute roles={['approver', 'admin']}>
              <Delegations />
            </PrivateRoute>
          } />
          
          <Route path="/profile" element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          } />

          <Route path="/admin" element={
            <PrivateRoute roles={['admin']}>
              <AdminDashboard />
            </PrivateRoute>
          } />

          <Route path="/admin/users" element={
            <PrivateRoute roles={['admin']}>
              <UserManagement />
            </PrivateRoute>
          } />

          <Route path="/admin/policies" element={
            <PrivateRoute roles={['admin']}>
              <PolicyManagement />
            </PrivateRoute>
          } />
          
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </main>
      <Toaster position="top-right" />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
