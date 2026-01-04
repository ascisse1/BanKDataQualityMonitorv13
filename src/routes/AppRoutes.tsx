import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';
import AuditorRoute from './AuditorRoute';
import AgencyUserRoute from './AgencyUserRoute';
import LoginPage from '../pages/auth/LoginPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import AnomaliesPage from '../pages/anomalies/AnomaliesPage';
import FatcaPage from '../pages/fatca/FatcaPage';
import RulesPage from '../pages/rules/RulesPage';
import ReportsPage from '../pages/reports/ReportsPage';
import AlertsPage from '../pages/alerts/AlertsPage';
import UsersPage from '../pages/users/UsersPage';
import ConfigPage from '../pages/config/ConfigPage';
import CoreBankingConfigPage from '../pages/config/CoreBankingConfigPage';
import NotFoundPage from '../pages/NotFoundPage';
import Layout from '../components/layout/Layout';
import GlobalTrackingPage from '../pages/tracking/GlobalTrackingPage';
import ChangePasswordPage from '../pages/auth/ChangePasswordPage';
import { TicketsPage } from '../pages/tickets/TicketsPage';
import { WorkflowMonitorPage } from '../pages/workflow/WorkflowMonitorPage';
import { KpiDashboardPage } from '../pages/kpis/KpiDashboardPage';
import ValidationPage from '../pages/validation/ValidationPage';
import DuplicatesPage from '../pages/duplicates/DuplicatesPage';
import ReconciliationPage from '../pages/reconciliation/ReconciliationPage';
import ReconciliationDashboard from '../pages/reconciliation/ReconciliationDashboard';

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
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
            <Route path="/workflow" element={<WorkflowMonitorPage />} />
            <Route path="/kpis" element={<KpiDashboardPage />} />
            <Route path="/validation" element={<ValidationPage />} />
            <Route path="/duplicates" element={<DuplicatesPage />} />
            <Route path="/reconciliation" element={<ReconciliationPage />} />
            <Route path="/reconciliation/dashboard" element={<ReconciliationDashboard />} />
          </Route>
          
          {/* Route protégée pour les administrateurs */}
          <Route element={<AdminRoute />}>
            <Route path="/users" element={<UsersPage />} />
            <Route path="/corebanking-config" element={<CoreBankingConfigPage />} />
          </Route>
        </Route>
      </Route>
      
      <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;