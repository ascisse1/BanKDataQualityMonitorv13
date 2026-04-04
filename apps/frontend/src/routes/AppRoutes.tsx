import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';
import AuditorRoute from './AuditorRoute';
import AgencyUserRoute from './AgencyUserRoute';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// Lazy-loaded page components
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));
const AnomaliesPage = lazy(() => import('../pages/anomalies/AnomaliesPage'));
const FatcaPage = lazy(() => import('../pages/fatca/FatcaPage'));
const RulesPage = lazy(() => import('../pages/rules/RulesPage'));
const ReportsPage = lazy(() => import('../pages/reports/ReportsPage'));
const AlertsPage = lazy(() => import('../pages/alerts/AlertsPage'));
const UsersPage = lazy(() => import('../pages/users/UsersPage'));
const ConfigPage = lazy(() => import('../pages/config/ConfigPage'));
const CoreBankingConfigPage = lazy(() => import('../pages/config/CoreBankingConfigPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));
const GlobalTrackingPage = lazy(() => import('../pages/tracking/GlobalTrackingPage'));
const ChangePasswordPage = lazy(() => import('../pages/auth/ChangePasswordPage'));
const TicketsPage = lazy(() => import('../pages/tickets/TicketsPage').then(m => ({ default: m.TicketsPage })));
const KpiDashboardPage = lazy(() => import('../pages/kpis/KpiDashboardPage').then(m => ({ default: m.KpiDashboardPage })));
const ValidationPage = lazy(() => import('../pages/validation/ValidationPage'));
const DuplicatesPage = lazy(() => import('../pages/duplicates/DuplicatesPage'));
const ReconciliationPage = lazy(() => import('../pages/reconciliation/ReconciliationPage'));
const UserAccessPage = lazy(() => import('../pages/admin/UserAccessPage'));
const DataDictionaryPage = lazy(() => import('../pages/admin/DataDictionaryPage'));

const AppRoutes = () => {
  const { isAuthenticated, user } = useAuth();

  const userRole = user?.role?.toUpperCase();
  const defaultRoute = (userRole === 'ADMIN' || userRole === 'AUDITOR') ? '/dashboard' : '/anomalies';

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><LoadingSpinner /></div>}>
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to={defaultRoute} replace /> : <LoginPage />
        } />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            {/* Routes accessibles à tous les utilisateurs authentifiés */}
            <Route path="/anomalies" element={<AnomaliesPage />} />
            <Route path="/change-password" element={<ChangePasswordPage />} />
            <Route path="/tickets" element={<TicketsPage />} />

            {/* Routes accessibles uniquement aux administrateurs et auditeurs */}
            <Route element={<AuditorRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/fatca" element={<FatcaPage />} />
              <Route path="/tracking" element={<GlobalTrackingPage />} />
              <Route path="/rules" element={<RulesPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/config" element={<ConfigPage />} />
              <Route path="/kpis" element={<KpiDashboardPage />} />
              <Route path="/validation" element={<ValidationPage />} />
              <Route path="/duplicates" element={<DuplicatesPage />} />
              <Route path="/reconciliation" element={<ReconciliationPage />} />
            </Route>

            {/* Route protégée pour les administrateurs */}
            <Route element={<AdminRoute />}>
              <Route path="/users" element={<UsersPage />} />
              <Route path="/user-access" element={<UserAccessPage />} />
              <Route path="/corebanking-config" element={<CoreBankingConfigPage />} />
              <Route path="/data-dictionary" element={<DataDictionaryPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="/" element={<Navigate to={isAuthenticated ? defaultRoute : "/login"} replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
