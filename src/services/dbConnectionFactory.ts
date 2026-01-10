import { DatabaseConfig, getDatabaseConfig } from './databaseConfig';
import { logger } from './logger';
import { tracer } from './tracer';

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

// Implémentation pour MySQL
class MySQLConnection extends BaseConnection {
  private pool: any;

  constructor(config: DatabaseConfig) {
    super(config);
  }

  async connect(): Promise<boolean> {
    try {
      // Importation dynamique pour éviter les problèmes avec Vite
      // Note: This import is only for backend/server usage, not for browser
      const mysql2 = await import('mysql2/promise');

      this.pool = mysql2.createPool({
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.username,
        password: this.config.password,
        connectionLimit: this.config.connectionLimit
      });

      // Test de connexion
      const connection = await this.pool.getConnection();
      connection.release();

      this.connected = true;
      tracer.info('database', 'MySQL connection established', {
        host: this.config.host,
        database: this.config.database
      });

      return true;
    } catch (error) {
      tracer.error('database', 'MySQL connection failed', { error });
      logger.error('database', 'MySQL connection failed', { error });
      this.connected = false;
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.connected = false;
      tracer.info('database', 'MySQL connection closed');
    }
  }

  async query<T>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.connected) {
      await this.connect();
    }

    try {
      const connection = await this.pool.getConnection();
      const [rows] = await connection.query(sql, params);
      connection.release();
      return rows;
    } catch (error) {
      tracer.error('database', 'MySQL query failed', { error, sql });
      logger.error('database', 'MySQL query failed', { error, sql });
      throw error;
    }
  }

  async execute(sql: string, params: any[] = []): Promise<any> {
    if (!this.connected) {
      await this.connect();
    }

    try {
      const connection = await this.pool.getConnection();
      const [result] = await connection.execute(sql, params);
      connection.release();
      return result;
    } catch (error) {
      tracer.error('database', 'MySQL execute failed', { error, sql });
      logger.error('database', 'MySQL execute failed', { error, sql });
      throw error;
    }
  }
}

// Factory pour créer la connexion appropriée
export class DatabaseConnectionFactory {
  static async createConnection(): Promise<DatabaseConnection> {
    const config = getDatabaseConfig();

    switch (config.type) {
      case 'mysql':
        return new MySQLConnection(config);
      default:
        tracer.warning('database', `Unknown database type: ${config.type}, using MySQL as default`);
        return new MySQLConnection(config);
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
