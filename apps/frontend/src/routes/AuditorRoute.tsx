import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route protégée pour les administrateurs et auditeurs
 * Redirige vers la page des anomalies si l'utilisateur n'a pas les permissions nécessaires
 */
const AuditorRoute = () => {
  const { user } = useAuth();

  const userRole = user?.role?.toUpperCase();
  if (userRole !== 'ADMIN' && userRole !== 'AUDITOR') {
    return <Navigate to="/anomalies" replace />;
  }

  return <Outlet />;
};

export default AuditorRoute;