import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route protégée pour les utilisateurs d'agence
 * Filtre les données en fonction de l'agence de l'utilisateur
 */
const AgencyUserRoute = () => {
  const { user } = useAuth();

  const userRole = user?.role?.toUpperCase();
  if (userRole !== 'AGENCY_USER' || !user?.agencyCode) {
    return <Navigate to="/anomalies" replace />;
  }

  return <Outlet />;
};

export default AgencyUserRoute;