import { ReactNode, useEffect, useState, createContext, useContext, useCallback } from 'react';
import { logger } from '../services/logger';

/**
 * User info returned from /api/me endpoint.
 */
interface UserInfo {
  id: string;
  username: string;
  email: string;
  fullName: string;
  givenName?: string;
  familyName?: string;
  agencyCode?: string | null;
  role: string;
  roles: string[];
}

/**
 * Session authentication context type.
 */
interface SessionAuthContextType {
  initialized: boolean;
  authenticated: boolean;
  user: UserInfo | null;
  login: () => void;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

const SessionAuthContext = createContext<SessionAuthContextType | undefined>(undefined);

interface SessionAuthProviderProps {
  children: ReactNode;
}

// API base URL - uses same origin for BFF pattern
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Session-based Authentication Provider using BFF pattern.
 *
 * Security benefits:
 * - Tokens stored server-side in HttpOnly session
 * - Frontend uses session cookies only (XSS-safe)
 * - CSRF protection via Spring Security
 * - No tokens exposed to JavaScript
 */
export const SessionAuthProvider = ({ children }: SessionAuthProviderProps) => {
  const [initialized, setInitialized] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);

  /**
   * Checks authentication status by calling /api/me.
   * Returns true if user is authenticated.
   */
  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/me`, {
        method: 'GET',
        credentials: 'include', // Include session cookies
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          setUser({
            id: data.id,
            username: data.username,
            email: data.email,
            fullName: data.fullName || `${data.givenName || ''} ${data.familyName || ''}`.trim(),
            givenName: data.givenName,
            familyName: data.familyName,
            agencyCode: data.agencyCode,
            role: data.role,
            roles: data.roles || [],
          });
          setAuthenticated(true);
          return true;
        }
      }

      setUser(null);
      setAuthenticated(false);
      return false;
    } catch (error) {
      logger.error('security', 'Failed to check authentication status', { error });
      setUser(null);
      setAuthenticated(false);
      return false;
    }
  }, []);

  /**
   * Initialize authentication on mount.
   */
  useEffect(() => {
    const initAuth = async () => {
      logger.info('security', 'Initializing session-based authentication');

      const isAuthenticated = await checkAuth();

      if (isAuthenticated) {
        logger.info('security', 'User is authenticated via session');
      } else {
        logger.info('security', 'User is not authenticated');
      }

      setInitialized(true);
    };

    initAuth();
  }, [checkAuth]);

  /**
   * Initiates login by redirecting to Spring Security OAuth2 authorization endpoint.
   * Spring Security handles the full OAuth2 flow with Keycloak.
   */
  const login = useCallback(() => {
    logger.info('security', 'Initiating OAuth2 login via BFF');
    // Redirect to Spring Security's OAuth2 authorization endpoint
    // This will redirect to Keycloak, handle the callback, and establish a session
    window.location.href = '/oauth2/authorization/keycloak';
  }, []);

  /**
   * Logs out by calling Spring Security logout endpoint.
   * This invalidates the session and redirects to Keycloak end_session_endpoint.
   */
  const logout = useCallback(async () => {
    logger.info('security', 'Logging out via BFF', { username: user?.username });

    try {
      // Get CSRF token from cookie if available
      const csrfToken = getCsrfTokenFromCookie();

      // Call Spring Security logout endpoint
      const response = await fetch('/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          ...(csrfToken ? { 'X-XSRF-TOKEN': csrfToken } : {}),
        },
      });

      if (response.redirected) {
        // Follow the redirect to Keycloak logout
        window.location.href = response.url;
      } else if (response.ok) {
        // Logout successful, redirect to login page
        setUser(null);
        setAuthenticated(false);
        window.location.href = '/login';
      }
    } catch (error) {
      logger.error('security', 'Logout failed', { error });
      // Force redirect to login on error
      setUser(null);
      setAuthenticated(false);
      window.location.href = '/login';
    }
  }, [user?.username]);

  const value: SessionAuthContextType = {
    initialized,
    authenticated,
    user,
    login,
    logout,
    checkAuth,
  };

  // Show loading state during initialization
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Initialisation de l'authentification...</p>
        </div>
      </div>
    );
  }

  return (
    <SessionAuthContext.Provider value={value}>
      {children}
    </SessionAuthContext.Provider>
  );
};

/**
 * Extracts CSRF token from cookie (set by Spring Security).
 */
function getCsrfTokenFromCookie(): string | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'XSRF-TOKEN') {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * Hook to access session authentication context.
 * Must be used within a SessionAuthProvider.
 */
export const useSessionAuth = (): SessionAuthContextType => {
  const context = useContext(SessionAuthContext);
  if (context === undefined) {
    throw new Error('useSessionAuth must be used within a SessionAuthProvider');
  }
  return context;
};
