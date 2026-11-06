import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import VolunteerOverview from './VolunteerOverview';
import PageLoader from '../../components/ui/PageLoader';

const AvailableIncidents = lazy(() => import('./AvailableIncidents'));
const MyAssignments      = lazy(() => import('./MyAssignments'));
const Alerts             = lazy(() => import('./Alerts'));
const IncidentDetails    = lazy(() => import('./IncidentDetails'));
const AvailabilityToggle = lazy(() => import('./AvailabilityToggle'));
const VolunteerProfile   = lazy(() => import('./VolunteerProfile'));
const ReportWrongInfo   = lazy(() => import('./ReportWrongInfo'));
const VolunteerMapView   = lazy(() => import('./VolunteerMapView'));

const VolunteerDashboard = () => (
  <DashboardLayout role="volunteer">
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="dashboard"    element={<VolunteerOverview />} />
        <Route path="available"    element={<AvailableIncidents />} />
        <Route path="assignments"  element={<MyAssignments />} />
        <Route path="assignments/:id" element={<IncidentDetails />} />
        <Route path="incidents/:id" element={<IncidentDetails />} />
        <Route path="alerts"       element={<Alerts />} />
        <Route path="map"          element={<VolunteerMapView />} />
        <Route path="availability" element={<AvailabilityToggle />} />
        <Route path="profile"      element={<VolunteerProfile />} />
        <Route path="report-wrong" element={<ReportWrongInfo />} />
        <Route path="*"            element={<Navigate to="dashboard" replace />} />
      </Routes>
    </Suspense>
  </DashboardLayout>
);

export default VolunteerDashboard;
