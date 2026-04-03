// Configuration des différentes bases de données

// Types de bases de données supportées
export type DatabaseType = 'postgresql';

// Interface pour la configuration de base de données
export interface DatabaseConfig {
  type: DatabaseType;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  connectionLimit?: number;
}

// Configuration par défaut
const defaultConfig: Record<DatabaseType, DatabaseConfig> = {
  postgresql: {
    type: 'postgresql',
    host: import.meta.env.VITE_DB_HOST || 'localhost',
    port: parseInt(import.meta.env.VITE_DB_PORT || '5432'),
    database: import.meta.env.VITE_DB_NAME || 'bankdb',
    username: import.meta.env.VITE_DB_USER || 'bankapp',
    password: import.meta.env.VITE_DB_PASSWORD || 'password123',
    connectionLimit: 10
  }
};

// Détermine le type de base de données à utiliser
export function getDatabaseType(): DatabaseType {
  // En mode production, on utilise toujours l'API backend (qui gère Informix/PostgreSQL)
  return 'postgresql';
}

// Récupère la configuration de la base de données
export function getDatabaseConfig(): DatabaseConfig {
  const dbType = getDatabaseType();
  return defaultConfig[dbType];
}

// Vérifie si la configuration est valide
export function isConfigValid(config: DatabaseConfig): boolean {
  switch (config.type) {
    case 'postgresql':
      return !!(config.host && config.database && config.username);
    default:
      return false;
  }
}

// Exporte la configuration actuelle
export const currentConfig = getDatabaseConfig();
