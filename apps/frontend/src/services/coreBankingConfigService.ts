import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface CoreBankingConfig {
  id?: string;
  configName: string;
  dbType: 'informix' | 'oracle' | 'mysql' | 'postgresql';
  jdbcDriver: string;
  jdbcUrl: string;
  host: string;
  port: number;
  databaseName: string;
  username: string;
  password: string;
  additionalParams?: Record<string, any>;
  isActive: boolean;
  isDefault: boolean;
  connectionPoolSize: number;
  connectionTimeout: number;
  testQuery: string;
  createdAt?: string;
  updatedAt?: string;
  lastTestedAt?: string;
  lastTestStatus?: 'success' | 'failed' | 'pending';
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  responseTime?: number;
  error?: string;
}

export interface ConnectionLog {
  id: string;
  configId: string;
  testDate: string;
  testResult: 'success' | 'failed';
  responseTime?: number;
  errorMessage?: string;
}

class CoreBankingConfigService {
  async getAllConfigs(): Promise<CoreBankingConfig[]> {
    const response = await axios.get(`${API_URL}/api/corebanking/configs`);
    return response.data;
  }

  async getConfigById(id: string): Promise<CoreBankingConfig> {
    const response = await axios.get(`${API_URL}/api/corebanking/configs/${id}`);
    return response.data;
  }

  async getDefaultConfig(): Promise<CoreBankingConfig | null> {
    const response = await axios.get(`${API_URL}/api/corebanking/configs/default`);
    return response.data;
  }

  async createConfig(config: Omit<CoreBankingConfig, 'id'>): Promise<CoreBankingConfig> {
    const response = await axios.post(`${API_URL}/api/corebanking/configs`, config);
    return response.data;
  }

  async updateConfig(id: string, config: Partial<CoreBankingConfig>): Promise<CoreBankingConfig> {
    const response = await axios.put(`${API_URL}/api/corebanking/configs/${id}`, config);
    return response.data;
  }

  async deleteConfig(id: string): Promise<void> {
    await axios.delete(`${API_URL}/api/corebanking/configs/${id}`);
  }

  async testConnection(config: CoreBankingConfig): Promise<ConnectionTestResult> {
    const response = await axios.post(`${API_URL}/api/corebanking/test-connection`, config);
    return response.data;
  }

  async testConnectionById(id: string): Promise<ConnectionTestResult> {
    const response = await axios.post(`${API_URL}/api/corebanking/test-connection/${id}`);
    return response.data;
  }

  async setDefaultConfig(id: string): Promise<void> {
    await axios.post(`${API_URL}/api/corebanking/configs/${id}/set-default`);
  }

  async getConnectionLogs(configId: string, limit: number = 20): Promise<ConnectionLog[]> {
    const response = await axios.get(`${API_URL}/api/corebanking/configs/${configId}/logs`, {
      params: { limit }
    });
    return response.data;
  }

  buildJdbcUrl(config: Partial<CoreBankingConfig>): string {
    const { dbType, host, port, databaseName, additionalParams } = config;

    let baseUrl = '';
    let params = '';

    switch (dbType) {
      case 'informix':
        baseUrl = `jdbc:informix-sqli://${host}:${port}/${databaseName}`;
        params = additionalParams?.INFORMIXSERVER
          ? `INFORMIXSERVER=${additionalParams.INFORMIXSERVER};CLIENT_LOCALE=en_US.utf8;DB_LOCALE=en_US.utf8`
          : 'CLIENT_LOCALE=en_US.utf8;DB_LOCALE=en_US.utf8';
        return `${baseUrl}:${params}`;

      case 'oracle':
        return `jdbc:oracle:thin:@${host}:${port}:${databaseName}`;

      case 'mysql':
        params = 'useSSL=false&serverTimezone=UTC';
        return `jdbc:mysql://${host}:${port}/${databaseName}?${params}`;

      case 'postgresql':
        return `jdbc:postgresql://${host}:${port}/${databaseName}`;

      default:
        return '';
    }
  }

  getDefaultDriver(dbType: string): string {
    const drivers: Record<string, string> = {
      informix: 'com.informix.jdbc.IfxDriver',
      oracle: 'oracle.jdbc.driver.OracleDriver',
      mysql: 'com.mysql.cj.jdbc.Driver',
      postgresql: 'org.postgresql.Driver'
    };
    return drivers[dbType] || '';
  }

  getDefaultTestQuery(dbType: string): string {
    const queries: Record<string, string> = {
      informix: 'SELECT 1 FROM systables WHERE tabid = 1',
      oracle: 'SELECT 1 FROM DUAL',
      mysql: 'SELECT 1',
      postgresql: 'SELECT 1'
    };
    return queries[dbType] || 'SELECT 1';
  }

  getDefaultPort(dbType: string): number {
    const ports: Record<string, number> = {
      informix: 9088,
      oracle: 1521,
      mysql: 3306,
      postgresql: 5432
    };
    return ports[dbType] || 9088;
  }
}

export const coreBankingConfigService = new CoreBankingConfigService();
