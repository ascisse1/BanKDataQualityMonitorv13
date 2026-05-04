import { ValidationRule, CreateRuleInput, UpdateRuleInput } from '../schemas/ruleSchema';
import { log } from '@/services/log';
import apiClient from '@/lib/apiClient';

// Backend DTO interface
interface ValidationRuleDto {
  id: number;
  tableName?: string;
  ruleName: string;
  description: string;
  ruleType: string;
  clientType: string | null;
  fieldName: string;
  fieldLabel?: string;
  ruleDefinition: string | null;
  errorMessage: string;
  severity: string;
  active: boolean;
  priority: number;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// API Response wrapper
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp?: string;
}

// Mapping functions
const mapClientType = (backendType: string | null): '1' | '2' | '3' | null => {
  if (!backendType) return null;
  const typeMap: Record<string, '1' | '2' | '3'> = {
    'INDIVIDUAL': '1',
    'CORPORATE': '2',
    'INSTITUTIONAL': '3',
    '1': '1',
    '2': '2',
    '3': '3',
  };
  return typeMap[backendType] || null;
};

const mapClientTypeToBackend = (clientType: '1' | '2' | '3' | null): string | null => {
  if (!clientType) return null;
  const typeMap: Record<string, string> = {
    '1': 'INDIVIDUAL',
    '2': 'CORPORATE',
    '3': 'INSTITUTIONAL',
  };
  return typeMap[clientType] || null;
};

const inferCategory = (fieldName: string): string => {
  const categoryMap: Record<string, string> = {
    'cli': 'Identification',
    'nom': 'Identification',
    'pre': 'Identification',
    'rso': 'Identification',
    'nid': 'Format Documents',
    'tid': 'Identification',
    'vid': 'Validité Documents',
    'dna': 'Cohérence Temporelle',
    'datc': 'Cohérence Temporelle',
    'nat': 'Identification',
    'sext': 'Identification',
    'nmer': 'Identification',
    'viln': 'Identification',
    'payn': 'Identification',
    'nrc': 'Identification',
    'sig': 'Format',
    'sec': 'Classification',
    'fju': 'Classification',
    'catn': 'Réglementation',
    'lienbq': 'Réglementation',
    'age': 'Gestion',
    'tcli': 'Classification',
  };
  return categoryMap[fieldName] || 'Autres';
};

const getSeverityPriority = (severity: string): number => {
  const priorityMap: Record<string, number> = {
    'critical': 1,
    'high': 5,
    'medium': 20,
    'low': 50,
  };
  return priorityMap[severity.toLowerCase()] || 20;
};

const mapDtoToRule = (dto: ValidationRuleDto): ValidationRule => {
  let ruleDefinition = [];
  if (dto.ruleDefinition) {
    try {
      ruleDefinition = JSON.parse(dto.ruleDefinition);
    } catch {
      ruleDefinition = [];
    }
  }

  return {
    id: `RULE_${dto.id}`,
    name: dto.ruleName,
    description: dto.description || '',
    tableName: dto.tableName || 'bkcli',
    field: dto.fieldName,
    fieldLabel: dto.fieldLabel,
    clientType: mapClientType(dto.clientType),
    ruleType: dto.ruleType.toLowerCase() as 'required' | 'format' | 'length' | 'date' | 'custom',
    ruleDefinition,
    errorMessage: dto.errorMessage,
    severity: dto.severity.toLowerCase() as 'low' | 'medium' | 'high' | 'critical',
    isActive: dto.active,
    category: inferCategory(dto.fieldName),
    priority: dto.priority,
  };
};

const mapRuleToDto = (rule: CreateRuleInput | UpdateRuleInput): Partial<ValidationRuleDto> => {
  return {
    tableName: rule.tableName || 'bkcli',
    ruleName: rule.name,
    description: rule.description || '',
    fieldName: rule.field,
    fieldLabel: rule.fieldLabel,
    clientType: mapClientTypeToBackend(rule.clientType ?? null),
    ruleType: rule.ruleType?.toUpperCase(),
    ruleDefinition: rule.ruleDefinition ? JSON.stringify(rule.ruleDefinition) : null,
    errorMessage: rule.errorMessage,
    severity: rule.severity?.toUpperCase(),
    active: rule.isActive,
    priority: rule.priority ?? getSeverityPriority(rule.severity || 'medium'),
  };
};

// API functions
export const rulesApi = {
  /**
   * Fetch all active validation rules
   */
  fetchRules: async (): Promise<ValidationRule[]> => {
    try {
      const response = await apiClient.get<ApiResponse<ValidationRuleDto[]>>('/api/validation/rules/active');
      if (response.data.success && response.data.data) {
        return response.data.data.map(mapDtoToRule);
      }
      return [];
    } catch (error) {
      log.error('api', 'Failed to fetch validation rules', { error });
      throw error;
    }
  },

  /**
   * Fetch all validation rules (including inactive)
   */
  fetchAllRules: async (): Promise<ValidationRule[]> => {
    try {
      const response = await apiClient.get<ApiResponse<ValidationRuleDto[]>>('/api/validation/rules');
      if (response.data.success && response.data.data) {
        return response.data.data.map(mapDtoToRule);
      }
      return [];
    } catch (error) {
      log.error('api', 'Failed to fetch all validation rules', { error });
      throw error;
    }
  },

  /**
   * Fetch validation rules by client type
   */
  fetchRulesByClientType: async (clientType: '1' | '2' | '3'): Promise<ValidationRule[]> => {
    try {
      const backendType = mapClientTypeToBackend(clientType);
      const response = await apiClient.get<ApiResponse<ValidationRuleDto[]>>(
        `/api/validation/rules/by-type/${backendType}`
      );
      if (response.data.success && response.data.data) {
        return response.data.data.map(mapDtoToRule);
      }
      return [];
    } catch (error) {
      log.error('api', 'Failed to fetch rules by client type', { error, clientType });
      throw error;
    }
  },

  /**
   * Fetch a single validation rule by ID
   */
  fetchRuleById: async (id: string): Promise<ValidationRule | null> => {
    try {
      const numericId = parseInt(id.replace('RULE_', ''), 10);
      const response = await apiClient.get<ApiResponse<ValidationRuleDto>>(
        `/api/validation/rules/${numericId}`
      );
      if (response.data.success && response.data.data) {
        return mapDtoToRule(response.data.data);
      }
      return null;
    } catch (error) {
      log.error('api', 'Failed to fetch rule by ID', { error, id });
      throw error;
    }
  },

  /**
   * Create a new validation rule
   */
  createRule: async (rule: CreateRuleInput): Promise<ValidationRule> => {
    try {
      const dto = mapRuleToDto(rule);
      const response = await apiClient.post<ApiResponse<ValidationRuleDto>>(
        '/api/validation/rules',
        dto
      );
      if (response.data.success && response.data.data) {
        return mapDtoToRule(response.data.data);
      }
      throw new Error('Failed to create rule');
    } catch (error) {
      log.error('api', 'Failed to create validation rule', { error });
      throw error;
    }
  },

  /**
   * Update an existing validation rule
   */
  updateRule: async ({ id, ...updates }: UpdateRuleInput): Promise<ValidationRule> => {
    try {
      const numericId = parseInt(id.replace('RULE_', ''), 10);
      const dto = mapRuleToDto(updates as CreateRuleInput);
      const response = await apiClient.put<ApiResponse<ValidationRuleDto>>(
        `/api/validation/rules/${numericId}`,
        dto
      );
      if (response.data.success && response.data.data) {
        return mapDtoToRule(response.data.data);
      }
      throw new Error('Failed to update rule');
    } catch (error) {
      log.error('api', 'Failed to update validation rule', { error, id });
      throw error;
    }
  },

  /**
   * Delete a validation rule
   */
  deleteRule: async (id: string): Promise<void> => {
    try {
      const numericId = parseInt(id.replace('RULE_', ''), 10);
      await apiClient.delete(`/api/validation/rules/${numericId}`);
    } catch (error) {
      log.error('api', 'Failed to delete validation rule', { error, id });
      throw error;
    }
  },

  /**
   * Toggle a rule's active status
   */
  toggleRule: async (id: string, active: boolean): Promise<void> => {
    try {
      const numericId = parseInt(id.replace('RULE_', ''), 10);
      await apiClient.patch(`/api/validation/rules/${numericId}/toggle?active=${active}`);
    } catch (error) {
      log.error('api', 'Failed to toggle validation rule', { error, id });
      throw error;
    }
  },

  /**
   * Bulk toggle rules (uses dedicated bulk endpoint)
   */
  bulkToggle: async (ids: string[], active: boolean): Promise<void> => {
    try {
      const numericIds = ids.map(id => parseInt(id.replace('RULE_', ''), 10));
      await apiClient.post('/api/validation/rules/bulk-toggle', { ids: numericIds, active });
    } catch (error) {
      log.error('api', 'Failed to bulk toggle rules', { error, ids });
      throw error;
    }
  },

  /**
   * Bulk delete rules (uses dedicated bulk endpoint)
   */
  bulkDelete: async (ids: string[]): Promise<void> => {
    try {
      const numericIds = ids.map(id => parseInt(id.replace('RULE_', ''), 10));
      await apiClient.post('/api/validation/rules/bulk-delete', { ids: numericIds });
    } catch (error) {
      log.error('api', 'Failed to bulk delete rules', { error, ids });
      throw error;
    }
  },

  /**
   * Update rule priorities (uses dedicated endpoint for drag & drop reordering)
   */
  updatePriorities: async (priorities: { id: string; priority: number }[]): Promise<void> => {
    try {
      const mappedPriorities = priorities.map(({ id, priority }) => ({
        id: parseInt(id.replace('RULE_', ''), 10),
        priority,
      }));
      await apiClient.put('/api/validation/rules/priorities', mappedPriorities);
    } catch (error) {
      log.error('api', 'Failed to update rule priorities', { error });
      throw error;
    }
  },
};

export default rulesApi;
