import Keycloak from 'keycloak-js';

/**
 * Keycloak configuration for the Bank Data Quality Monitor frontend.
 * Uses environment variables for configuration with sensible defaults.
 */
const keycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8180',
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'bsic-bank',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'bdqm-frontend',
};

/**
 * Keycloak instance singleton.
 * Initialized once and reused throughout the application.
 */
const keycloak = new Keycloak(keycloakConfig);

export default keycloak;
export { keycloakConfig };
