import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageLoader from '../../components/ui/PageLoader';

const CitizenOverview   = lazy(() => import('./CitizenOverview'));
const ReportIncident    = lazy(() => import('./ReportIncident'));
const MyIncidents       = lazy(() => import('./MyIncidents'));
const IncidentDetail    = lazy(() => import('./IncidentDetail'));
const NearbyIncidents   = lazy(() => import('./NearbyIncidents'));
const CitizenAlerts     = lazy(() => import('./CitizenAlerts'));
const CitizenProfile    = lazy(() => import('./CitizenProfile'));
const ReportWrongInfo   = lazy(() => import('./ReportWrongInfo'));

const CitizenDashboard = () => (
  <DashboardLayout role="citizen">
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="dashboard"        element={<CitizenOverview />} />
        <Route path="report"           element={<ReportIncident />} />
        <Route path="incidents"        element={<MyIncidents />} />
        <Route path="incidents/:id"    element={<IncidentDetail />} />
        <Route path="nearby"           element={<NearbyIncidents />} />
        <Route path="alerts"           element={<CitizenAlerts />} />
        <Route path="profile"          element={<CitizenProfile />} />
        <Route path="report-wrong"     element={<ReportWrongInfo />} />
        <Route path="*"                element={<Navigate to="dashboard" replace />} />
      </Routes>
    </Suspense>
  </DashboardLayout>
);

export default CitizenDashboard;
