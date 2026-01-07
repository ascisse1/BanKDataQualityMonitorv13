<<<<<<< HEAD
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
=======
import { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { logger } from '../services/logger';
import { authService, type User as AuthUser } from '../services/authService';
import { setAuthToken, clearAuthToken } from '../services/apiService';

interface User {
  id: number;
  username: string;
  role: 'ADMIN' | 'AUDITOR' | 'AGENCY_USER' | 'USER' | 'admin' | 'auditor' | 'agency_user' | 'user';
  email: string;
  fullName: string;
  agencyCode?: string | null;
  token: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  authType?: 'backend' | 'demo';
>>>>>>> 745e2a7 (Initial commit after re-initializing repository)
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

<<<<<<< HEAD
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
=======
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true' || true;

const demoUsers = {
  admin: {
    id: 1,
    username: 'admin',
    email: 'admin@banque.ml',
    role: 'ADMIN' as const,
    firstName: 'Administrateur',
    lastName: 'Système',
    fullName: 'Administrateur Système',
    agencyCode: null,
    token: 'demo-token-admin'
  },
  auditor: {
    id: 2,
    username: 'auditor',
    email: 'audit@banque.ml',
    role: 'AUDITOR' as const,
    firstName: 'Auditeur',
    lastName: 'Principal',
    fullName: 'Auditeur Principal',
    agencyCode: null,
    token: 'demo-token-auditor'
  },
  user: {
    id: 3,
    username: 'user',
    email: 'user@banque.ml',
    role: 'USER' as const,
    firstName: 'Utilisateur',
    lastName: 'Standard',
    fullName: 'Utilisateur Standard',
    agencyCode: null,
    token: 'demo-token-user'
  },
  agency_user: {
    id: 4,
    username: 'agency_01001',
    email: 'agence.01001@banque.ml',
    role: 'AGENCY_USER' as const,
    firstName: 'Utilisateur',
    lastName: 'Agence',
    fullName: 'Utilisateur Agence Ouagadougou',
    agencyCode: '01001',
    token: 'demo-token-agency'
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = authService.getUser();
    const savedToken = authService.getToken();

    if (savedUser && savedToken) {
      setAuthToken(savedToken);
      return {
        ...savedUser,
        fullName: `${savedUser.firstName} ${savedUser.lastName}`,
        token: savedToken
      };
    }
    return null;
  });

  const [authType, setAuthType] = useState<'backend' | 'demo'>(
    localStorage.getItem('authType') as 'backend' | 'demo' || 'demo'
  );

  const login = async (username: string, password: string): Promise<boolean> => {
    logger.info('security', 'Login attempt', { username });

    try {
      const response = await authService.login({ username, password });

      if (response.success && response.data) {
        const backendUser: User = {
          ...response.data.user,
          fullName: `${response.data.user.firstName} ${response.data.user.lastName}`,
          token: response.data.token
        };

        setUser(backendUser);
        setAuthToken(response.data.token);
        setAuthType('backend');
        localStorage.setItem('authType', 'backend');
        logger.info('security', 'Login successful (backend)', { username, role: backendUser.role });
        return true;
      }

      logger.warning('security', 'Login failed (backend)', { username });
      return false;
    } catch (error) {
      logger.error('security', 'Backend login error', { username, error });

      if (DEMO_MODE) {
        logger.info('security', 'Falling back to demo mode');

        const demoUserMap: Record<string, typeof demoUsers[keyof typeof demoUsers]> = {
          'admin': demoUsers.admin,
          'auditor': demoUsers.auditor,
          'user': demoUsers.user,
          'agency_01001': demoUsers.agency_user,
          'agency_user': demoUsers.agency_user
        };

        const demoPasswords: Record<string, string> = {
          'admin': 'admin123',
          'auditor': 'audit123',
          'user': 'user123',
          'agency_01001': 'agency123',
          'agency_user': 'agency123'
        };

        if (demoUserMap[username] && demoPasswords[username] === password) {
          const demoUser = demoUserMap[username];
          const userObj: User = {
            id: demoUser.id,
            username: demoUser.username,
            email: demoUser.email,
            role: demoUser.role,
            fullName: demoUser.fullName,
            agencyCode: demoUser.agencyCode,
            token: demoUser.token
          };

          setUser(userObj);
          authService.setUser(demoUser);
          authService.setToken(demoUser.token);
          setAuthToken(demoUser.token);
          setAuthType('demo');
          localStorage.setItem('authType', 'demo');
          logger.info('security', 'Login successful (demo mode)', { username, role: demoUser.role });
          return true;
        }
      }

      return false;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      const response = await authService.changePassword({ currentPassword, newPassword });
      if (response.success) {
        logger.info('security', 'Password changed successfully');
        return true;
      }
      return false;
    } catch (error) {
      logger.error('security', 'Password change failed', { error });
      return false;
    }
  };

  const logout = () => {
    logger.info('security', 'User logged out', { username: user?.username });
    setUser(null);
    authService.logout();
    clearAuthToken();
    setAuthType('demo');
    localStorage.removeItem('authType');
  };

  useEffect(() => {
    if (user?.token) {
      setAuthToken(user.token);
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        changePassword,
        authType
      }}
    >
>>>>>>> 745e2a7 (Initial commit after re-initializing repository)
      {children}
    </AuthContext.Provider>
  );
};

<<<<<<< HEAD
/**
 * Hook to access authentication context.
 * Must be used within an AuthProvider.
 */
=======
>>>>>>> 745e2a7 (Initial commit after re-initializing repository)
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
