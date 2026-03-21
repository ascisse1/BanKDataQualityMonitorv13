import { ReactNode, useEffect, useState, createContext, useContext, useCallback } from 'react';
import keycloak from '../config/keycloak';
import { logger } from '../services/logger';

/**
 * Keycloak context type definition.
 */
interface KeycloakContextType {
  initialized: boolean;
  authenticated: boolean;
  token: string | undefined;
  refreshToken: () => Promise<boolean>;
  logout: () => void;
  login: () => void;
  keycloak: typeof keycloak;
}

const KeycloakContext = createContext<KeycloakContextType | undefined>(undefined);

interface KeycloakProviderProps {
  children: ReactNode;
}

/**
 * Keycloak Provider component that initializes and manages Keycloak authentication.
 * Handles token refresh, login/logout, and provides authentication state to the app.
 */
export const KeycloakProvider = ({ children }: KeycloakProviderProps) => {
  const [initialized, setInitialized] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [, setTokenRefreshInterval] = useState<number | null>(null);

  useEffect(() => {
    const initKeycloak = async () => {
      try {
        logger.info('security', 'Initializing Keycloak authentication');

        const auth = await keycloak.init({
          onLoad: 'check-sso',
          silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
          pkceMethod: 'S256',
          checkLoginIframe: false,
        });

        setAuthenticated(auth);
        setInitialized(true);

        if (auth) {
          logger.info('security', 'Keycloak authentication successful', {
            username: keycloak.tokenParsed?.preferred_username,
            roles: keycloak.tokenParsed?.realm_access?.roles,
          });

          // Setup automatic token refresh
          setupTokenRefresh();
        } else {
          logger.info('security', 'User not authenticated');
        }

        // Handle token expiry
        keycloak.onTokenExpired = () => {
          logger.info('security', 'Token expired, attempting refresh');
          keycloak.updateToken(30).catch(() => {
            logger.warning('security', 'Token refresh failed, redirecting to login');
            keycloak.login();
          });
        };

        // Handle authentication events
        keycloak.onAuthSuccess = () => {
          logger.info('security', 'Authentication successful');
          setAuthenticated(true);
        };

        keycloak.onAuthError = (error) => {
          logger.error('security', 'Authentication error', { error });
          setAuthenticated(false);
        };

        keycloak.onAuthLogout = () => {
          logger.info('security', 'User logged out');
          setAuthenticated(false);
        };

      } catch (error) {
        logger.error('security', 'Keycloak initialization failed', { error });
        setInitialized(true);
        setAuthenticated(false);
      }
    };

    initKeycloak();

    // Cleanup on unmount
    return () => {
      setTokenRefreshInterval((prevInterval) => {
        if (prevInterval) {
          clearInterval(prevInterval);
        }
        return null;
      });
    };
  }, []);

  /**
   * Sets up automatic token refresh before expiration.
   */
  const setupTokenRefresh = () => {
    // Refresh token every 4 minutes (tokens typically expire in 5 minutes)
    const interval = window.setInterval(() => {
      if (keycloak.authenticated) {
        keycloak.updateToken(60).catch(() => {
          logger.warning('security', 'Scheduled token refresh failed');
        });
      }
    }, 4 * 60 * 1000);

    setTokenRefreshInterval(interval);
  };

  /**
   * Manually refresh the token.
   */
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const refreshed = await keycloak.updateToken(30);
      if (refreshed) {
        logger.debug('security', 'Token refreshed successfully');
      }
      return refreshed;
    } catch (error) {
      logger.error('security', 'Token refresh failed', { error });
      return false;
    }
  }, []);

  /**
   * Logout the current user.
   */
  const logout = useCallback(() => {
    logger.info('security', 'User logging out', {
      username: keycloak.tokenParsed?.preferred_username,
    });
    keycloak.logout({ redirectUri: window.location.origin + '/login' });
  }, []);

  /**
   * Initiate login flow.
   */
  const login = useCallback(() => {
    logger.info('security', 'Initiating Keycloak login');
    keycloak.login({ redirectUri: window.location.origin + '/dashboard' });
  }, []);

  const value: KeycloakContextType = {
    initialized,
    authenticated,
    token: keycloak.token,
    refreshToken,
    logout,
    login,
    keycloak,
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
    <KeycloakContext.Provider value={value}>
      {children}
    </KeycloakContext.Provider>
  );
};

/**
 * Hook to access Keycloak context.
 * Must be used within a KeycloakProvider.
 */
export const useKeycloak = (): KeycloakContextType => {
  const context = useContext(KeycloakContext);
  if (context === undefined) {
    throw new Error('useKeycloak must be used within a KeycloakProvider');
  }
  return context;
};
