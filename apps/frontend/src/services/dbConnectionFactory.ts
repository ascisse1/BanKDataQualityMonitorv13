import { DatabaseConfig, getDatabaseConfig } from './databaseConfig';
import { log } from './log';

// Interface pour les connexions de base de données
export interface DatabaseConnection {
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  query<T>(sql: string, params?: any[]): Promise<T[]>;
  execute(sql: string, params?: any[]): Promise<any>;
  isConnected(): boolean;
}

// Classe de base pour les connexions
abstract class BaseConnection implements DatabaseConnection {
  protected connected: boolean = false;
  protected config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  abstract connect(): Promise<boolean>;
  abstract disconnect(): Promise<void>;
  abstract query<T>(sql: string, params?: any[]): Promise<T[]>;
  abstract execute(sql: string, params?: any[]): Promise<any>;

  isConnected(): boolean {
    return this.connected;
  }
}

// Implémentation pour PostgreSQL
class PostgreSQLConnection extends BaseConnection {
  private pool: any;

  constructor(config: DatabaseConfig) {
    super(config);
  }

  async connect(): Promise<boolean> {
    try {
      const pg = await import('pg');

      this.pool = new pg.Pool({
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.username,
        password: this.config.password,
        max: this.config.connectionLimit
      });

      // Test de connexion
      const client = await this.pool.connect();
      client.release();

      this.connected = true;
      log.info('database', 'PostgreSQL connection established', {
        host: this.config.host,
        database: this.config.database
      });

      return true;
    } catch (error) {
      log.error('database', 'PostgreSQL connection failed', { error });
      this.connected = false;
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.connected = false;
      log.info('database', 'PostgreSQL connection closed');
    }
  }

  async query<T>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.connected) {
      await this.connect();
    }

    try {
      const result = await this.pool.query(sql, params);
      return result.rows;
    } catch (error) {
      log.error('database', 'PostgreSQL query failed', { error, sql });
      throw error;
    }
  }

  async execute(sql: string, params: any[] = []): Promise<any> {
    if (!this.connected) {
      await this.connect();
    }

    try {
      const result = await this.pool.query(sql, params);
      return result;
    } catch (error) {
      log.error('database', 'PostgreSQL execute failed', { error, sql });
      throw error;
    }
  }
}

// Factory pour créer la connexion appropriée
export class DatabaseConnectionFactory {
  static async createConnection(): Promise<DatabaseConnection> {
    const config = getDatabaseConfig();

    switch (config.type) {
      case 'postgresql':
        return new PostgreSQLConnection(config);
      default:
        log.warning('database', `Unknown database type: ${config.type}, using PostgreSQL as default`);
        return new PostgreSQLConnection(config);
    }
  }
}

// Singleton pour la connexion à la base de données
export class DatabaseConnectionManager {
  private static instance: DatabaseConnectionManager;
  private connection: DatabaseConnection | null = null;

  private constructor() {}

  public static getInstance(): DatabaseConnectionManager {
    if (!DatabaseConnectionManager.instance) {
      DatabaseConnectionManager.instance = new DatabaseConnectionManager();
    }
    return DatabaseConnectionManager.instance;
  }

  public async getConnection(): Promise<DatabaseConnection> {
    if (!this.connection) {
      this.connection = await DatabaseConnectionFactory.createConnection();
      await this.connection.connect();
    }

    return this.connection;
  }

  public async closeConnection(): Promise<void> {
    if (this.connection) {
      await this.connection.disconnect();
      this.connection = null;
    }
  }
}

// Exporter une instance du gestionnaire de connexion
export const dbConnectionManager = DatabaseConnectionManager.getInstance();
