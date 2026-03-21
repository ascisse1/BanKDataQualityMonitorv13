import { createContext, useContext, ReactNode, useMemo } from 'react';
import { logger } from '../services/logger';
import { useSessionAuth } from './SessionAuthProvider';

/**
 * User interface representing the authenticated user.
 */
interface User {
  id: string;
  username: string;
  role: 'ADMIN' | 'AUDITOR' | 'AGENCY_USER' | 'USER';
  email: string;
  fullName: string;
  agencyCode?: string | null;
}

/**
 * Authentication context type definition.
 */
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;

}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Maps role string to application role type.
 */
const mapRole = (role: string): User['role'] => {
  const upperRole = role.toUpperCase();
  if (upperRole === 'ADMIN') return 'ADMIN';
  if (upperRole === 'AUDITOR') return 'AUDITOR';
  if (upperRole === 'AGENCY_USER') return 'AGENCY_USER';
  return 'USER';
};

/**
 * Authentication Provider that integrates with session-based BFF authentication.
 * Provides user authentication state and role-based access control.
 *
 * Security: Uses HttpOnly session cookies, no tokens exposed to JavaScript.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { authenticated, user: sessionUser, logout: sessionLogout, login: sessionLogin } = useSessionAuth();

  // Map session user to application User interface
  const user: User | null = useMemo(() => {
    if (!authenticated || !sessionUser) {
      return null;
    }

    return {
      id: sessionUser.id,
      username: sessionUser.username,
      email: sessionUser.email,
      fullName: sessionUser.fullName,
      role: mapRole(sessionUser.role),
      agencyCode: sessionUser.agencyCode,
    };
  }, [authenticated, sessionUser]);

  /**
   * Initiates the OAuth2 login flow via BFF.
   */
  const login = () => {
    logger.info('security', 'Initiating OAuth2 login via BFF');
    sessionLogin();
  };

  /**
   * Logs out the current user via BFF.
   */
  const logout = () => {
    logger.info('security', 'User logging out', { username: user?.username });
    sessionLogout();
  };

  /**
   * Checks if the current user has a specific role.
   */
  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.role.toUpperCase() === role.toUpperCase();
  };

  /**
   * Checks if the current user has any of the specified roles.
   */
  const hasAnyRole = (roles: string[]): boolean => {
    if (!user) return false;
    return roles.some(role => user.role.toUpperCase() === role.toUpperCase());
  };

  const value = useMemo(() => ({
    user,
    isAuthenticated: authenticated && !!user,
    login,
    logout,
    hasRole,
    hasAnyRole,
  }), [user, authenticated]);

  return (
    <AuthContext.Provider value={value}>

      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
