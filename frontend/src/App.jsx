import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Spin } from 'antd';
import { AuthProvider, useAuth } from './store/AuthContext';

import InternalLayout from './layouts/InternalLayout';
import ClientLayout from './layouts/ClientLayout';

import LoginPage from './pages/Login';
import InternalDashboard from './pages/internal/Dashboard';
import PropertiesPage from './pages/internal/Properties';
import UnitsPage from './pages/internal/Units';
import OwnersPage from './pages/internal/Owners';
import TenantsPage from './pages/internal/Tenants';
import ContractsPage from './pages/internal/Contracts';
import MaintenancePage from './pages/internal/Maintenance';
import InvoicesPage from './pages/internal/Invoices';
import PaymentsPage from './pages/internal/Payments';
import PayoutsPage from './pages/internal/Payouts';

import ClientDashboard from './pages/client/Dashboard';
import ClientProperties from './pages/client/Properties';
import ClientContracts from './pages/client/Contracts';
import ClientInvoices from './pages/client/Invoices';
import ClientPayouts from './pages/client/Payouts';

function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();
  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!user) return <Navigate to="/login" />;
  if (requiredRole === 'staff' && !['admin', 'manager', 'staff'].includes(user.role)) {
    return <Navigate to="/client" />;
  }
  if (requiredRole === 'client' && user.role !== 'client') {
    return <Navigate to="/internal" />;
  }
  return children;
}

function AutoRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'client') return <Navigate to="/client" />;
  return <Navigate to="/internal" />;
}

function LoginGuard() {
  const { user, loading } = useAuth();
  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (user) {
    return user.role === 'client' ? <Navigate to="/client" /> : <Navigate to="/internal" />;
  }
  return <LoginPage />;
}

export default function App() {
  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#1677ff', borderRadius: 6 } }}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginGuard />} />
            <Route path="/" element={<AutoRedirect />} />

            {/* Internal PQT Team Portal */}
            <Route path="/internal" element={<ProtectedRoute requiredRole="staff"><InternalLayout /></ProtectedRoute>}>
              <Route index element={<InternalDashboard />} />
              <Route path="properties" element={<PropertiesPage />} />
              <Route path="units" element={<UnitsPage />} />
              <Route path="owners" element={<OwnersPage />} />
              <Route path="tenants" element={<TenantsPage />} />
              <Route path="contracts" element={<ContractsPage />} />
              <Route path="maintenance" element={<MaintenancePage />} />
              <Route path="invoices" element={<InvoicesPage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="payouts" element={<PayoutsPage />} />
            </Route>

            {/* External Client/Owner Portal */}
            <Route path="/client" element={<ProtectedRoute requiredRole="client"><ClientLayout /></ProtectedRoute>}>
              <Route index element={<ClientDashboard />} />
              <Route path="properties" element={<ClientProperties />} />
              <Route path="contracts" element={<ClientContracts />} />
              <Route path="invoices" element={<ClientInvoices />} />
              <Route path="payouts" element={<ClientPayouts />} />
            </Route>

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ConfigProvider>
  );
}
