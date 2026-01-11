import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ValidationRule, ValidationResult, ValidationError, ValidationWarning, ClientRecord } from '../types/ValidationRules';
import { logger } from './logger';

// API configuration
const SPRING_BOOT_URL = import.meta.env.VITE_SPRING_BOOT_URL || 'http://localhost:8080';

// Backend DTO interface (matches Spring Boot ValidationRuleDto)
interface ValidationRuleDto {
  id: number;
  ruleName: string;
  description: string;
  ruleType: string;
  clientType: string;
  fieldName: string;
  validationExpression: string;
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
 * Creates an axios instance with session-based authentication.
 */
const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: SPRING_BOOT_URL,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    withCredentials: true,
  });

  instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const method = config.method?.toUpperCase();
      if (method && method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
        const csrfToken = getCsrfTokenFromCookie();
        if (csrfToken) {
          config.headers['X-XSRF-TOKEN'] = csrfToken;
        }
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        logger.warning('security', 'Session expired');
      }
      if (error.response?.status === 403) {
        logger.warning('security', 'Access denied', { url: error.config?.url });
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

export class ValidationRulesService {
  private static instance: ValidationRulesService;
  private rules: ValidationRule[] = [];
  private axiosInstance: AxiosInstance;
  private isLoading: boolean = false;
  private lastFetchTime: number = 0;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

  private constructor() {
    this.axiosInstance = createAxiosInstance();
  }

  public static getInstance(): ValidationRulesService {
    if (!ValidationRulesService.instance) {
      ValidationRulesService.instance = new ValidationRulesService();
    }
    return ValidationRulesService.instance;
  }

  /**
   * Maps backend DTO to frontend ValidationRule interface
   */
  private mapDtoToRule(dto: ValidationRuleDto): ValidationRule {
    return {
      id: `RULE_${dto.id}`,
      name: dto.ruleName,
      description: dto.description,
      field: dto.fieldName,
      clientType: this.mapClientType(dto.clientType),
      ruleType: dto.ruleType.toLowerCase() as 'required' | 'format' | 'length' | 'date' | 'custom',
      condition: dto.validationExpression,
      errorMessage: dto.errorMessage,
      severity: dto.severity.toLowerCase() as 'low' | 'medium' | 'high' | 'critical',
      isActive: dto.active,
      category: this.inferCategory(dto.fieldName, dto.ruleType)
    };
  }

  /**
   * Maps backend ClientType enum to frontend code
   */
  private mapClientType(backendType: string): '1' | '2' | '3' {
    const typeMap: Record<string, '1' | '2' | '3'> = {
      'INDIVIDUAL': '1',
      'CORPORATE': '2',
      'INSTITUTIONAL': '3',
      '1': '1',
      '2': '2',
      '3': '3'
    };
    return typeMap[backendType] || '1';
  }

  /**
   * Infers category based on field name and rule type
   */
  private inferCategory(fieldName: string, ruleType: string): string {
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
      'tcli': 'Classification'
    };
    return categoryMap[fieldName] || 'Autres';
  }

  /**
   * Fetches validation rules from the backend API
   */
  public async fetchRulesFromBackend(): Promise<ValidationRule[]> {
    if (this.isLoading) {
      // Wait for ongoing fetch to complete
      while (this.isLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.rules;
    }

    this.isLoading = true;
    try {
      logger.info('validation', 'Fetching validation rules from backend');
      const response = await this.axiosInstance.get<ApiResponse<ValidationRuleDto[]>>('/api/validation/rules/active');

      if (response.data.success && response.data.data && response.data.data.length > 0) {
        this.rules = response.data.data.map(dto => this.mapDtoToRule(dto));
        this.lastFetchTime = Date.now();
        logger.info('validation', `Loaded ${this.rules.length} validation rules from backend`);
      } else {
        logger.warning('validation', 'No rules returned from backend, using default rules');
      }
      return this.rules;
    } catch (error) {
      logger.warning('validation', 'Failed to fetch validation rules from backend, using default rules', { error });
      // Return cached/default rules instead of throwing
      return this.rules;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Fetches rules by client type from the backend
   */
  public async fetchRulesByClientType(clientType: '1' | '2' | '3'): Promise<ValidationRule[]> {
    try {
      const clientTypeMap: Record<string, string> = {
        '1': 'INDIVIDUAL',
        '2': 'CORPORATE',
        '3': 'INSTITUTIONAL'
      };
      const response = await this.axiosInstance.get<ApiResponse<ValidationRuleDto[]>>(
        `/api/validation/rules/by-type/${clientTypeMap[clientType]}`
      );

      if (response.data.success && response.data.data) {
        return response.data.data.map(dto => this.mapDtoToRule(dto));
      }
      return [];
    } catch (error) {
      logger.error('validation', 'Failed to fetch rules by client type', { error, clientType });
      // Fallback to cached rules filtered by client type
      return this.rules.filter(rule => rule.clientType === clientType);
    }
  }

  /**
   * Creates a new validation rule via the backend API
   */
  public async createRule(rule: Omit<ValidationRule, 'id'>): Promise<ValidationRule | null> {
    try {
      const dto: Partial<ValidationRuleDto> = {
        ruleName: rule.name,
        description: rule.description,
        fieldName: rule.field,
        clientType: rule.clientType,
        ruleType: rule.ruleType.toUpperCase(),
        validationExpression: rule.condition,
        errorMessage: rule.errorMessage,
        severity: rule.severity.toUpperCase(),
        active: rule.isActive,
        priority: this.getSeverityPriority(rule.severity)
      };

      const response = await this.axiosInstance.post<ApiResponse<ValidationRuleDto>>('/api/validation/rules', dto);

      if (response.data.success && response.data.data) {
        const newRule = this.mapDtoToRule(response.data.data);
        this.rules.push(newRule);
        return newRule;
      }
      return null;
    } catch (error) {
      logger.error('validation', 'Failed to create validation rule', { error });
      throw error;
    }
  }

  /**
   * Updates an existing validation rule via the backend API
   */
  public async updateRuleOnBackend(ruleId: string, updates: Partial<ValidationRule>): Promise<boolean> {
    try {
      const numericId = parseInt(ruleId.replace('RULE_', ''), 10);
      const dto: Partial<ValidationRuleDto> = {};

      if (updates.name) dto.ruleName = updates.name;
      if (updates.description) dto.description = updates.description;
      if (updates.field) dto.fieldName = updates.field;
      if (updates.clientType) dto.clientType = updates.clientType;
      if (updates.ruleType) dto.ruleType = updates.ruleType.toUpperCase();
      if (updates.condition) dto.validationExpression = updates.condition;
      if (updates.errorMessage) dto.errorMessage = updates.errorMessage;
      if (updates.severity) {
        dto.severity = updates.severity.toUpperCase();
        dto.priority = this.getSeverityPriority(updates.severity);
      }
      if (updates.isActive !== undefined) dto.active = updates.isActive;

      await this.axiosInstance.put(`/api/validation/rules/${numericId}`, dto);

      // Update local cache
      const index = this.rules.findIndex(r => r.id === ruleId);
      if (index !== -1) {
        this.rules[index] = { ...this.rules[index], ...updates };
      }
      return true;
    } catch (error) {
      logger.error('validation', 'Failed to update validation rule', { error, ruleId });
      return false;
    }
  }

  /**
   * Deletes a validation rule via the backend API
   */
  public async deleteRuleOnBackend(ruleId: string): Promise<boolean> {
    try {
      const numericId = parseInt(ruleId.replace('RULE_', ''), 10);
      await this.axiosInstance.delete(`/api/validation/rules/${numericId}`);

      // Update local cache
      const index = this.rules.findIndex(r => r.id === ruleId);
      if (index !== -1) {
        this.rules.splice(index, 1);
      }
      return true;
    } catch (error) {
      logger.error('validation', 'Failed to delete validation rule', { error, ruleId });
      return false;
    }
  }

  /**
   * Toggles a rule's active status via the backend API
   */
  public async toggleRuleOnBackend(ruleId: string, active: boolean): Promise<boolean> {
    try {
      const numericId = parseInt(ruleId.replace('RULE_', ''), 10);
      await this.axiosInstance.patch(`/api/validation/rules/${numericId}/toggle?active=${active}`);

      // Update local cache
      const rule = this.rules.find(r => r.id === ruleId);
      if (rule) {
        rule.isActive = active;
      }
      return true;
    } catch (error) {
      logger.error('validation', 'Failed to toggle validation rule', { error, ruleId });
      return false;
    }
  }

  private getSeverityPriority(severity: string): number {
    const priorityMap: Record<string, number> = {
      'critical': 1,
      'high': 5,
      'medium': 20,
      'low': 50
    };
    return priorityMap[severity.toLowerCase()] || 20;
  }

  /**
   * Ensures rules are loaded (from cache if valid, otherwise from backend)
   */
  public async ensureRulesLoaded(): Promise<void> {
    const now = Date.now();
    if (this.rules.length === 0 || (now - this.lastFetchTime) > this.CACHE_TTL_MS) {
      await this.fetchRulesFromBackend();
    }
  }

  /**
   * Forces a refresh of rules from the backend
   */
  public async refreshRules(): Promise<ValidationRule[]> {
    this.lastFetchTime = 0; // Invalidate cache
    return this.fetchRulesFromBackend();
  }

  /**
   * Validates a client record against loaded rules.
   * Note: Call ensureRulesLoaded() before using this method in async contexts.
   */
  public validateRecord(record: ClientRecord): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Filter applicable rules for the client type
    const applicableRules = this.rules.filter(rule =>
      rule.isActive && rule.clientType === record.tcli
    );

    for (const rule of applicableRules) {
      const validationResult = this.validateField(record, rule);

      if (!validationResult.isValid) {
        if (rule.severity === 'critical' || rule.severity === 'high') {
          errors.push({
            ruleId: rule.id,
            field: rule.field,
            message: rule.errorMessage,
            severity: rule.severity,
            value: record[rule.field as keyof ClientRecord]
          });
        } else {
          warnings.push({
            ruleId: rule.id,
            field: rule.field,
            message: rule.errorMessage,
            value: record[rule.field as keyof ClientRecord]
          });
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates a client record asynchronously (ensures rules are loaded first)
   */
  public async validateRecordAsync(record: ClientRecord): Promise<ValidationResult> {
    await this.ensureRulesLoaded();
    return this.validateRecord(record);
  }

  private validateField(record: ClientRecord, rule: ValidationRule): { isValid: boolean } {
    const fieldValue = record[rule.field as keyof ClientRecord];

    switch (rule.ruleType) {
      case 'required':
        return {
          isValid: fieldValue != null && 
                   fieldValue !== undefined && 
                   String(fieldValue).trim() !== ''
        };

      case 'format':
        if (!fieldValue) return { isValid: true }; // Si le champ est vide, on ne valide pas le format
        return this.validateFormat(String(fieldValue), rule, record);

      case 'length':
        if (!fieldValue) return { isValid: true };
        return this.validateLength(String(fieldValue), rule);

      case 'date':
        if (!fieldValue) return { isValid: true };
        return this.validateDate(String(fieldValue), rule);

      case 'custom':
        return this.validateCustom(record, rule);

      default:
        return { isValid: true };
    }
  }

  private validateFormat(value: string, rule: ValidationRule, record: ClientRecord): { isValid: boolean } {
    switch (rule.field) {
      case 'sext':
        return { isValid: ['M', 'F'].includes(value) };
      
      case 'nid':
        // Validation sans caractères spéciaux et sans séquences interdites
        return { 
          isValid: value.length >= 8 && 
                  /^[0-9A-Za-z]+$/.test(value) && 
                  !value.includes('123') && 
                  !value.includes('XXX') &&
                  !value.includes('000')
        };
      
      case 'nrc':
        if (record.tcli === '2') {
          // Pour les entreprises, le numéro doit commencer par MA
          return { 
            isValid: value.startsWith('MA') && 
                    !value.includes('123') && 
                    !value.includes('XXX') &&
                    !value.includes('000')
          };
        } else if (record.tcli === '3') {
          // Pour les institutionnels, vérifier juste les séquences interdites
          return { 
            isValid: !value.includes('123') && 
                    !value.includes('XXX') &&
                    !value.includes('000')
          };
        }
        return { isValid: true };
      
      case 'sig':
        return { 
          isValid: value.length <= 20 && /^[A-Z0-9\-\.\s]+$/.test(value) 
        };
      
      case 'tcli':
        return { isValid: ['1', '2', '3'].includes(value) };
      
      case 'nom':
      case 'pre':
      case 'rso':
        // Vérifier que le champ n'est pas composé uniquement de X et ne contient pas de séquences interdites
        return { 
          isValid: !/^[Xx]+$/.test(value) && 
                  !value.includes('123') && 
                  !value.includes('XXX')
        };
      
      default:
        return { isValid: true };
    }
  }

  private validateLength(_value: string, _rule: ValidationRule): { isValid: boolean } {
    // Implémentation des validations de longueur selon les règles métier
    return { isValid: true };
  }

  private validateDate(value: string, rule: ValidationRule): { isValid: boolean } {
    try {
      const date = new Date(value);
      const now = new Date();
      
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        return { isValid: false };
      }
      
      // Vérifier le format YYYY-MM-DD
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return { isValid: false };
      }
      
      switch (rule.field) {
        case 'dna':
          const minDate = new Date('1915-01-01');
          return { 
            isValid: date >= minDate && date <= now 
          };
        
        case 'vid':
          // Date d'expiration doit être dans le futur ou nulle
          return { 
            isValid: !value || date >= now 
          };
        
        case 'datc':
          const minCreationDate = new Date('1915-01-01');
          return { 
            isValid: date >= minCreationDate && date <= now 
          };
        
        default:
          return { isValid: true };
      }
    } catch (error) {
      return { isValid: false };
    }
  }

  private validateCustom(_record: ClientRecord, _rule: ValidationRule): { isValid: boolean } {
    // Implémentation des validations personnalisées
    return { isValid: true };
  }

  /**
   * Returns cached rules (synchronous, use ensureRulesLoaded() first in async contexts)
   */
  public getRules(): ValidationRule[] {
    return [...this.rules];
  }

  /**
   * Returns rules asynchronously (ensures rules are loaded)
   */
  public async getRulesAsync(): Promise<ValidationRule[]> {
    await this.ensureRulesLoaded();
    return [...this.rules];
  }

  /**
   * Returns cached rules filtered by client type (synchronous)
   */
  public getRulesByClientType(clientType: '1' | '2' | '3'): ValidationRule[] {
    return this.rules.filter(rule => rule.clientType === clientType);
  }

  /**
   * Returns rules by client type asynchronously (fetches from backend)
   */
  public async getRulesByClientTypeAsync(clientType: '1' | '2' | '3'): Promise<ValidationRule[]> {
    return this.fetchRulesByClientType(clientType);
  }

  /**
   * Adds a rule locally (for backward compatibility, use createRule for backend persistence)
   * @deprecated Use createRule() instead for backend persistence
   */
  public addRule(rule: ValidationRule): void {
    this.rules.push(rule);
  }

  /**
   * Updates a rule locally (for backward compatibility, use updateRuleOnBackend for backend persistence)
   * @deprecated Use updateRuleOnBackend() instead for backend persistence
   */
  public updateRule(ruleId: string, updates: Partial<ValidationRule>): boolean {
    const index = this.rules.findIndex(rule => rule.id === ruleId);
    if (index !== -1) {
      this.rules[index] = { ...this.rules[index], ...updates };
      return true;
    }
    return false;
  }

  /**
   * Deletes a rule locally (for backward compatibility, use deleteRuleOnBackend for backend persistence)
   * @deprecated Use deleteRuleOnBackend() instead for backend persistence
   */
  public deleteRule(ruleId: string): boolean {
    const index = this.rules.findIndex(rule => rule.id === ruleId);
    if (index !== -1) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Toggles a rule locally (for backward compatibility, use toggleRuleOnBackend for backend persistence)
   * @deprecated Use toggleRuleOnBackend() instead for backend persistence
   */
  public toggleRule(ruleId: string): boolean {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.isActive = !rule.isActive;
      return true;
    }
    return false;
  }

  /**
   * Checks if rules are loaded
   */
  public isRulesLoaded(): boolean {
    return this.rules.length > 0;
  }

  /**
   * Gets the count of loaded rules
   */
  public getRulesCount(): number {
    return this.rules.length;
  }
}

export const validationRulesService = ValidationRulesService.getInstance();