import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layout
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import AuthPages from './pages/AuthPages';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import SharedCV from './components/cv/SharedCV';
import AdminPanel from './components/admin/AdminPanel';

function AppContent() {
  const location = useLocation();
  
  // Do not render main navbar and footer on the shared CV viewer page
  const isSharedCVRoute = location.pathname.startsWith('/cv/share/');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {!isSharedCVRoute && <Navbar />}
      
      <main style={{ flex: 1 }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPages />} />
          <Route path="/register" element={<AuthPages />} />
          <Route path="/admin/login" element={<AuthPages />} />
          <Route path="/cv/share/:token" element={<SharedCV />} />

          {/* Protected User Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } 
          />

          {/* Protected Admin Routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminPanel />
              </ProtectedRoute>
            } 
          />

          {/* Fallback Catch-all Route */}
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </main>

      {!isSharedCVRoute && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <>
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: '#0a0a22',
            color: '#fff',
            border: '1px solid rgba(124, 58, 237, 0.3)',
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '11px',
            boxShadow: '0 0 10px rgba(124, 58, 237, 0.15)'
          }
        }}
      />
      <AppContent />
    </>
  );
}
