// Configuration des différentes bases de données

// Types de bases de données supportées
export type DatabaseType = 'mysql' | 'supabase' | 'demo';

// Interface pour la configuration de base de données
export interface DatabaseConfig {
  type: DatabaseType;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  url?: string;
  apiKey?: string;
  serviceRoleKey?: string;
  connectionLimit?: number;
}

// Configuration par défaut
const defaultConfig: Record<DatabaseType, DatabaseConfig> = {
  mysql: {
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    database: 'bankdb',
    username: 'bankapp',
    password: 'password123',
    connectionLimit: 10
  },
  supabase: {
    type: 'supabase',
    url: import.meta.env.VITE_SUPABASE_URL,
    apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    serviceRoleKey: import.meta.env.SUPABASE_SERVICE_ROLE_KEY
  },
  demo: {
    type: 'demo'
  }
};

// Détermine le type de base de données à utiliser
export function getDatabaseType(): DatabaseType {
  // Si le mode démo est activé explicitement, utiliser les données de démo
  if (import.meta.env.VITE_DEMO_MODE === 'true') {
    return 'demo';
  }

  // En mode production, on utilise toujours l'API backend (qui gère Informix/MySQL)
  // On ne retourne jamais 'supabase' ou 'demo' sauf si explicitement demandé
  return 'mysql';
}

// Récupère la configuration de la base de données
export function getDatabaseConfig(): DatabaseConfig {
  const dbType = getDatabaseType();
  return defaultConfig[dbType];
}

// Vérifie si la configuration est valide
export function isConfigValid(config: DatabaseConfig): boolean {
  switch (config.type) {
    case 'mysql':
      return !!(config.host && config.database && config.username);
    case 'supabase':
      return !!(config.url && config.apiKey);
    case 'demo':
      return true;
    default:
      return false;
  }
}

// Exporte la configuration actuelle
export const currentConfig = getDatabaseConfig();
export const isDemoMode = getDatabaseType() === 'demo'; // Mode démo si Supabase n'est pas configuré ou explicitement activé