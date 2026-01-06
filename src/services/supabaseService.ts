import { supabase } from './supabaseClient';
import { logger } from './logger';
import { tracer } from './tracer';
import { demoData, getPaginatedData } from './demoData';

// Types
interface ValidationMetric {
  category: string;
  total_records: number;
  valid_records: number;
  quality_score: number;
}

interface ClientStats {
  total: number;
  individual: number;
  corporate: number;
  institutional: number;
  anomalies: number;
  fatca: number;
}

interface FatcaStats {
  total: number;
  individual: number;
  corporate: number;
  toVerify: number;
  confirmed: number;
  excluded: number;
  pending: number;
  currentMonth: number;
}

interface FatcaIndicators {
  nationality: number;
  birthplace: number;
  address: number;
  phone: number;
  proxy: number;
}

interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
}

interface BranchAnomaly {
  code_agence: string;
  lib_agence: string;
  nombre_anomalies: number;
}

class SupabaseService {
  private static instance: SupabaseService;

  private constructor() {
    tracer.info('database', 'Supabase service initialized');
  }

  public static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  public async testConnection() {
    try {
      tracer.info('database', 'Testing Supabase connection');

      // Simuler un échec de connexion pour utiliser le mode démo
      throw new Error('Mode démo activé - Utilisation des données fictives');
    } catch (error) {
      tracer.error('database', 'Supabase connection test failed', { error });
      return {
        success: false,
        message: 'Erreur de connexion à Supabase',
        error
      };
    }
  }

  public async getClientStats(): Promise<ClientStats> {
    try {
      tracer.info('database', 'Getting client statistics from Supabase');
      // Simuler un échec pour utiliser les données de démo
      throw new Error('Mode démo activé - Utilisation des données fictives');
    } catch (error) {
      tracer.error('database', 'Failed to get client statistics from Supabase', { error });
      logger.error('api', 'Failed to get client statistics from Supabase', { error });

      // Return fallback data
      return demoData.clientStats;
    }
  }

  public async getValidationMetrics(): Promise<ValidationMetric[]> {
    try {
      tracer.info('database', 'Getting validation metrics from Supabase');
      // Simuler un échec pour utiliser les données de démo
      throw new Error('Mode démo activé - Utilisation des données fictives');
    } catch (error) {
      tracer.error('database', 'Failed to get validation metrics from Supabase', { error });
      logger.error('api', 'Failed to get validation metrics from Supabase', { error });

      // Return fallback data
      return demoData.validationMetrics;
    }
  }

  public async getIndividualAnomalies(page = 1, limit = 10, forExport = false, params: Record<string, any> = {}): Promise<PaginatedResponse<any>> {
    try {
      tracer.info('database', 'Getting individual anomalies from Supabase', { page, limit, forExport, ...params });
      // Simuler un échec pour utiliser les données de démo
      throw new Error('Mode démo activé - Utilisation des données fictives');
    } catch (error) {
      tracer.error('database', 'Failed to get individual anomalies from Supabase', { error, page, limit, ...params });
      logger.error('api', 'Failed to get individual anomalies from Supabase', { error });

      // Filtrer par agence si nécessaire
      let filteredData = [...demoData.individualAnomalies];
      if (params.agencyCode) {
        filteredData = filteredData.filter(item => item.age === params.agencyCode);
      }

      // Retourner les données paginées
      return getPaginatedData(filteredData, page, forExport ? 5000 : limit);
    }
  }

  public async getCorporateAnomalies(page = 1, limit = 10, forExport = false, params: Record<string, any> = {}): Promise<PaginatedResponse<any>> {
    try {
      tracer.info('database', 'Getting corporate anomalies from Supabase', { page, limit, forExport, ...params });
      // Simuler un échec pour utiliser les données de démo
      throw new Error('Mode démo activé - Utilisation des données fictives');
    } catch (error) {
      tracer.error('database', 'Failed to get corporate anomalies from Supabase', { error, page, limit, ...params });
      logger.error('api', 'Failed to get corporate anomalies from Supabase', { error });

      // Filtrer par agence si nécessaire
      let filteredData = [...demoData.corporateAnomalies];
      if (params.agencyCode) {
        filteredData = filteredData.filter(item => item.age === params.agencyCode);
      }

      // Retourner les données paginées
      return getPaginatedData(filteredData, page, forExport ? 5000 : limit);
    }
  }

  public async getInstitutionalAnomalies(page = 1, limit = 10, forExport = false, params: Record<string, any> = {}): Promise<PaginatedResponse<any>> {
    try {
      tracer.info('database', 'Getting institutional anomalies from Supabase', { page, limit, forExport, ...params });
      // Simuler un échec pour utiliser les données de démo
      throw new Error('Mode démo activé - Utilisation des données fictives');
    } catch (error) {
      tracer.error('database', 'Failed to get institutional anomalies from Supabase', { error, page, limit, ...params });
      logger.error('api', 'Failed to get institutional anomalies from Supabase', { error });

      // Filtrer par agence si nécessaire
      let filteredData = [...demoData.institutionalAnomalies];
      if (params.agencyCode) {
        filteredData = filteredData.filter(item => item.age === params.agencyCode);
      }

      // Retourner les données paginées
      return getPaginatedData(filteredData, page, forExport ? 5000 : limit);
    }
  }

  public async getAnomaliesByBranch(): Promise<BranchAnomaly[]> {
    try {
      tracer.info('database', 'Getting anomalies by branch from Supabase');
      // Simuler un échec pour utiliser les données de démo
      throw new Error('Mode démo activé - Utilisation des données fictives');
    } catch (error) {
      tracer.error('database', 'Failed to get anomalies by branch from Supabase', { error });
      logger.error('api', 'Failed to get anomalies by branch from Supabase', { error });

      // Return fallback data
      return demoData.branchAnomalies;
    }
  }

  public async getFatcaStats(clientType: string = 'all'): Promise<FatcaStats> {
    try {
      tracer.info('database', 'Getting FATCA statistics from Supabase', { clientType });
      // Simuler un échec pour utiliser les données de démo
      throw new Error('Mode démo activé - Utilisation des données fictives');
    } catch (error) {
      tracer.error('database', 'Failed to get FATCA statistics from Supabase', { error, clientType });
      logger.error('api', 'Failed to get FATCA statistics from Supabase', { error });

      // Return fallback data
      return demoData.fatcaStats;
    }
  }

  public async getFatcaIndicators(): Promise<FatcaIndicators> {
    try {
      tracer.info('database', 'Getting FATCA indicators from Supabase');
      // Simuler un échec pour utiliser les données de démo
      throw new Error('Mode démo activé - Utilisation des données fictives');
    } catch (error) {
      tracer.error('database', 'Failed to get FATCA indicators from Supabase', { error });
      logger.error('api', 'Failed to get FATCA indicators from Supabase', { error });

      // Return fallback data
      return demoData.fatcaIndicators;
    }
  }

  public async getFatcaClients(page = 1, limit = 10, forExport = false, status: string | null = null, clientType: string = '1'): Promise<PaginatedResponse<any>> {
    try {
      tracer.info('database', 'Getting FATCA clients from Supabase', { page, limit, forExport, status, clientType });
      // Simuler un échec pour utiliser les données de démo
      throw new Error('Mode démo activé - Utilisation des données fictives');
    } catch (error) {
      tracer.error('database', 'Failed to get FATCA clients from Supabase', { error, page, limit, status, clientType });
      logger.error('api', 'Failed to get FATCA clients from Supabase', { error });

      // Filtrer par statut si nécessaire
      let filteredData = [...demoData.fatcaClients];
      if (status) {
        filteredData = filteredData.filter(item => item.fatca_status === status);
      }

      // Retourner les données paginées
      return getPaginatedData(filteredData, page, forExport ? 5000 : limit);
    }
  }

  public async getCorporateFatcaClients(page = 1, limit = 10, forExport = false, status: string | null = null): Promise<PaginatedResponse<any>> {
    try {
      tracer.info('database', 'Getting corporate FATCA clients from Supabase', { page, limit, forExport, status });
      // Simuler un échec pour utiliser les données de démo
      throw new Error('Mode démo activé - Utilisation des données fictives');
    } catch (error) {
      tracer.error('database', 'Failed to get corporate FATCA clients from Supabase', { error, page, limit, status });
      logger.error('api', 'Failed to get corporate FATCA clients from Supabase', { error });

      // Créer des données d'entreprises FATCA à partir des données de clients FATCA
      const corporateFatcaClients = demoData.fatcaClients
          .filter((_, index) => index % 3 === 0)
          .map(client => ({
            cli: client.cli.replace('CLI', 'ENT'),
            nom: client.nom.replace('CLIENT', 'ENTREPRISE'),
            raisonSociale: `ENTREPRISE FATCA ${client.cli.substring(3)}`,
            dateEntreeRelation: client.date_entree_relation,
            statusClient: client.status_client,
            paysImmatriculation: client.pays_naissance,
            paysResidenceFiscale: client.nationalite,
            adresse: client.adresse,
            paysAdresse: client.pays_adresse,
            telephone: client.telephone,
            agence: client.cli.substring(3, 5),
            fatcaStatus: client.fatca_status,
            fatcaDate: client.fatca_date,
            fatcaUti: client.fatca_uti,
            notes: client.notes
          }));

      // Filtrer par statut si nécessaire
      let filteredData = [...corporateFatcaClients];
      if (status) {
        filteredData = filteredData.filter(item => item.fatcaStatus === status);
      }

      // Retourner les données paginées
      return getPaginatedData(filteredData, page, forExport ? 5000 : limit);
    }
  }

  public async updateFatcaStatus(cli: string, status: string, notes: string | null, username: string): Promise<boolean> {
    try {
      tracer.info('database', 'Updating FATCA status in Supabase', { cli, status, username });

      // Update FATCA status
      const { error: updateError } = await supabase
          .from('fatca_clients')
          .update({
            fatca_status: status,
            fatca_date: new Date().toISOString(),
            fatca_uti: username,
            notes,
            updated_at: new Date().toISOString()
          })
          .eq('cli', cli);

      if (updateError) throw updateError;

      // Add audit log
      const { error: auditError } = await supabase
          .from('fatca_audit_log')
          .insert({
            cli,
            action: 'update_status',
            new_status: status,
            performed_by: username,
            notes
          });

      if (auditError) throw auditError;

      tracer.info('database', 'FATCA status updated successfully', { cli, status });

      return true;
    } catch (error) {
      tracer.error('database', 'Failed to update FATCA status in Supabase', { error, cli, status });
      logger.error('api', 'Failed to update FATCA status in Supabase', { error });

      return false;
    }
  }

  public async recordAnomaly(cli: string, field: string, oldValue: string | null, newValue: string | null, status: string, agencyCode: string | null, userId: number): Promise<boolean> {
    try {
      tracer.info('database', 'Recording anomaly in Supabase', { cli, field, status, agencyCode, userId });

      // Insert anomaly history
      const { error: insertError } = await supabase
          .from('anomaly_history')
          .insert({
            cli,
            field,
            old_value: oldValue,
            new_value: newValue,
            status,
            agency_code: agencyCode,
            user_id: userId
          });

      if (insertError) throw insertError;

      // Update agency correction stats
      if (agencyCode) {
        const { error: statsError } = await supabase.rpc('update_agency_correction_stats', {
          p_agency_code: agencyCode,
          p_status: status
        });

        if (statsError) throw statsError;
      }

      tracer.info('database', 'Anomaly recorded successfully', { cli, field, status });

      return true;
    } catch (error) {
      tracer.error('database', 'Failed to record anomaly in Supabase', { error, cli, field, status });
      logger.error('api', 'Failed to record anomaly in Supabase', { error });

      return false;
    }
  }

  public async getAnomalyHistory(cli?: string, field?: string, agencyCode?: string, page = 1, limit = 20): Promise<PaginatedResponse<any>> {
    try {
      tracer.info('database', 'Getting anomaly history from Supabase', { cli, field, agencyCode, page, limit });

      const _offset = (page - 1) * limit;

      // Simuler un échec pour utiliser les données de démo
      throw new Error('Mode démo activé - Utilisation des données fictives');
    } catch (error) {
      tracer.error('database', 'Failed to get anomaly history from Supabase', { error, cli, field, agencyCode });
      logger.error('api', 'Failed to get anomaly history from Supabase', { error });

      // Return fallback data
      return {
        data: [],
        page,
        limit,
        total: 0
      };
    }
  }

  public async getAgencyCorrectionStats(): Promise<any[]> {
    try {
      tracer.info('database', 'Getting agency correction stats from Supabase');
      // Simuler un échec pour utiliser les données de démo
      throw new Error('Mode démo activé - Utilisation des données fictives');
    } catch (error) {
      tracer.error('database', 'Failed to get agency correction stats from Supabase', { error });
      logger.error('api', 'Failed to get agency correction stats from Supabase', { error });

      // Return fallback data
      return demoData.agencyCorrectionStats;
    }
  }

  public async getWeeklyCorrectionStats(weeks = 12): Promise<any[]> {
    try {
      tracer.info('database', 'Getting weekly correction stats from Supabase', { weeks });
      // Simuler un échec pour utiliser les données de démo
      throw new Error('Mode démo activé - Utilisation des données fictives');
    } catch (error) {
      tracer.error('database', 'Failed to get weekly correction stats from Supabase', { error, weeks });
      logger.error('api', 'Failed to get weekly correction stats from Supabase', { error });

      // Return fallback data
      return demoData.weeklyCorrectionStats;
    }
  }

  public async getDataLoadHistory(): Promise<any[]> {
    try {
      tracer.info('database', 'Getting data load history from Supabase');
      // Simuler un échec pour utiliser les données de démo
      throw new Error('Mode démo activé - Utilisation des données fictives');
    } catch (error) {
      tracer.error('database', 'Failed to get data load history from Supabase', { error });
      logger.error('api', 'Failed to get data load history from Supabase', { error });

      // Return fallback data
      return demoData.dataLoadHistory;
    }
  }

  public async getUsersByAgency(): Promise<any[]> {
    try {
      tracer.info('database', 'Getting users by agency from Supabase');
      // Simuler un échec pour utiliser les données de démo
      throw new Error('Mode démo activé - Utilisation des données fictives');
    } catch (error) {
      tracer.error('database', 'Failed to get users by agency from Supabase', { error });
      logger.error('api', 'Failed to get users by agency from Supabase', { error });

      // Return fallback data
      return demoData.usersByAgency;
    }
  }

  public async getGlobalTrackingData(startDate: string, endDate: string, clientTypes: string[], agencyCode?: string): Promise<any[]> {
    try {
      tracer.info('database', 'Getting global tracking data from Supabase', { startDate, endDate, clientTypes, agencyCode });
      // Simuler un échec pour utiliser les données de démo
      throw new Error('Mode démo activé - Utilisation des données fictives');
    } catch (error) {
      tracer.error('database', 'Failed to get global tracking data from Supabase', { error, startDate, endDate, clientTypes, agencyCode });
      logger.error('api', 'Failed to get global tracking data from Supabase', { error });

      // Filtrer par agence si nécessaire
      let filteredData = [...demoData.globalTrackingData];
      if (agencyCode) {
        filteredData = filteredData.filter(item => item.agencyCode === agencyCode);
      }

      return filteredData;
    }
  }

  public async executeQuery(query: string): Promise<any[]> {
    try {
      tracer.info('database', 'Executing custom query in Supabase', { queryLength: query.length });

      // This is a security risk in a real application
      // In a production environment, we would use RPC functions instead
      const { data, error } = await supabase.rpc('execute_custom_query', { p_query: query });

      if (error) throw error;

      tracer.info('database', 'Query executed successfully', { resultSize: data?.length || 0 });

      return data || [];
    } catch (error) {
      tracer.error('database', 'Query execution failed in Supabase', { error, queryLength: query.length });
      logger.error('api', 'Query execution failed in Supabase', { error });

      throw error;
    }
  }

  public async clearCache(): Promise<void> {
    try {
      tracer.info('database', 'Clearing cache in Supabase');

      // In a real application, we would have a cache table in Supabase
      // For now, we'll just log the action
      logger.info('system', 'Cache cleared successfully');
      tracer.info('database', 'Cache cleared successfully');
    } catch (error) {
      tracer.error('database', 'Failed to clear cache in Supabase', { error });
      logger.error('api', 'Failed to clear cache in Supabase', { error });
    }
  }
}

export const supabaseService = SupabaseService.getInstance();