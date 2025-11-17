import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import InternshipsPage from './pages/InternshipsPage';
import InternshipDetailsPage from './pages/InternshipDetailsPage';
import InternshipFormPage from './pages/InternshipFormPage';
import ApplicationsPage from './pages/ApplicationsPage';
import ProfilePage from './pages/ProfilePage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { company, loading } = useAuth();

  if (loading) {
    return <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      color: 'white',
      fontSize: '1.2rem'
    }}>Loading...</div>;
  }

  return company ? <>{children}</> : <Navigate to="/login" />;
};

const RootRedirect: React.FC = () => {
  const { company, loading } = useAuth();

  if (loading) {
    return <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      color: 'white',
      fontSize: '1.2rem'
    }}>Loading...</div>;
  }

  return company ? <Navigate to="/dashboard" /> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/internships"
            element={
              <ProtectedRoute>
                <InternshipsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/internships/:id"
            element={
              <ProtectedRoute>
                <InternshipDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/internships/create"
            element={
              <ProtectedRoute>
                <InternshipFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/internships/edit/:id"
            element={
              <ProtectedRoute>
                <InternshipFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/applications"
            element={
              <ProtectedRoute>
                <ApplicationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
