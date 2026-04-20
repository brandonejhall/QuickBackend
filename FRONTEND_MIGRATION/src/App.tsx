import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AssetNotes from './pages/AssetNotes';
import AssetDetail from './pages/AssetDetail';
import AssetWizard from './pages/AssetWizard';
import CostEvents from './pages/CostEvents';
import PortfolioReport from './pages/PortfolioReport';
import ActivityFeed from './pages/ActivityFeed';

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const token = localStorage.getItem('brims_token');
  const role = localStorage.getItem('brims_role');
  if (!token) return <Navigate to="/login" replace />;
  if (adminOnly && role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/dashboard" element={<ProtectedRoute><Layout><UserDashboard /></Layout></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute adminOnly><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
        <Route path="/notes" element={<ProtectedRoute><Layout><AssetNotes /></Layout></ProtectedRoute>} />
        <Route path="/assets/new" element={<ProtectedRoute><Layout><AssetWizard /></Layout></ProtectedRoute>} />
        <Route path="/assets/:id" element={<ProtectedRoute><Layout><AssetDetail /></Layout></ProtectedRoute>} />
        <Route path="/cost-events" element={<ProtectedRoute><Layout><CostEvents /></Layout></ProtectedRoute>} />
        <Route path="/report" element={<ProtectedRoute><Layout><PortfolioReport /></Layout></ProtectedRoute>} />
        <Route path="/activity" element={<ProtectedRoute adminOnly><Layout><ActivityFeed /></Layout></ProtectedRoute>} />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
