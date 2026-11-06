import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import useAuthStore from '../store/authStore';
import { getRolePath } from '../utils/helpers';
import PageLoader from '../components/ui/PageLoader';

// Landing Page
const LandingPage = lazy(() => import('../pages/LandingPage'));

// Auth Pages — kept for backward compatibility / direct URL access
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const PasswordResetPage = lazy(() => import('../pages/auth/PasswordResetPage'));

// Citizen Pages
const CitizenDashboard = lazy(() => import('../pages/citizen/CitizenDashboard'));

// Volunteer Pages
const VolunteerDashboard = lazy(() => import('../pages/volunteer/VolunteerDashboard'));

// Admin Pages
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));

// Not Found
const NotFound = lazy(() => import('../pages/NotFound'));

const RootHandler = () => {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated && user) return <Navigate to={getRolePath(user.role)} replace />;
  return <LandingPage />;
};

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Root – Landing page for guests, dashboard redirect for logged-in */}
          <Route path="/" element={<RootHandler />} />

          {/* Auth — redirect to landing page (modals are there now) */}
          <Route path="/login" element={<Navigate to="/?auth=login" replace />} />
          <Route path="/register" element={<Navigate to="/?auth=register" replace />} />
          <Route path="/reset-password" element={<PasswordResetPage />} />

          {/* Citizen */}
          <Route
            path="/citizen/*"
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <CitizenDashboard />
              </ProtectedRoute>
            }
          />

          {/* Volunteer */}
          <Route
            path="/volunteer/*"
            element={
              <ProtectedRoute allowedRoles={['volunteer']}>
                <VolunteerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default AppRouter;
