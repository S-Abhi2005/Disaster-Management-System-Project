import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import AdminOverview from './AdminOverview';
import PageLoader from '../../components/ui/PageLoader';

const IncidentManagement  = lazy(() => import('./IncidentManagement'));
const IncidentDetails     = lazy(() => import('./IncidentDetails'));
const VolunteerManagement = lazy(() => import('./VolunteerManagement'));
const ResourceManagement  = lazy(() => import('./ResourceManagement'));
const ResourceDetails     = lazy(() => import('./ResourceDetails'));
const Analytics           = lazy(() => import('./Analytics'));
const AlertsManagement    = lazy(() => import('./AlertsManagement'));
const AssignmentHistory   = lazy(() => import('./AssignmentHistory'));
const AdminMapView        = lazy(() => import('./AdminMapView'));
const ReportWrongInfo     = lazy(() => import('./ReportWrongInfo'));

const AdminDashboard = () => (
  <DashboardLayout role="admin">
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="dashboard"   element={<AdminOverview />} />
        <Route path="incidents"   element={<IncidentManagement />} />
        <Route path="incidents/:id" element={<IncidentDetails />} />
        <Route path="volunteers"  element={<VolunteerManagement />} />
        <Route path="resources"   element={<ResourceManagement />} />
        <Route path="resources/:id" element={<ResourceDetails />} />
        <Route path="analytics"   element={<Analytics />} />
        <Route path="alerts"      element={<AlertsManagement />} />
        <Route path="assignments" element={<AssignmentHistory />} />
        <Route path="map"         element={<AdminMapView />} />
        <Route path="report-wrong" element={<ReportWrongInfo />} />
        <Route path="*"           element={<Navigate to="dashboard" replace />} />
      </Routes>
    </Suspense>
  </DashboardLayout>
);

export default AdminDashboard;
