import { AxiosInstance } from 'axios';
import { ValidationRule, ValidationResult, ValidationError, ValidationWarning, ClientRecord, RuleCondition } from '../types/ValidationRules';
import { log } from './log';
import apiClient from '../lib/apiClient';

// Backend DTO interface (matches Spring Boot ValidationRuleDto)
interface ValidationRuleDto {
  id: number;
  ruleName: string;
    description: string;
  ruleType: string;
  clientType: string | null;
  fieldName: string;
  fieldLabel?: string;
  /** Natural language rule definition in JSON format */
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


export class ValidationRulesService {
  private static instance: ValidationRulesService;
  private rules: ValidationRule[] = [];
  private axiosInstance: AxiosInstance;
  private isLoading: boolean = false;
  private lastFetchTime: number = 0;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

  private constructor() {
    this.axiosInstance = apiClient;
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
      fieldLabel: dto.fieldLabel,
      clientType: this.mapClientType(dto.clientType),
      ruleType: dto.ruleType.toLowerCase() as 'required' | 'format' | 'date' | 'custom',
      ruleDefinition: this.parseRuleDefinition(dto.ruleDefinition),
      errorMessage: dto.errorMessage,
      severity: dto.severity.toLowerCase() as 'low' | 'medium' | 'high' | 'critical',
      isActive: dto.active,
      category: this.inferCategory(dto.fieldName, dto.ruleType),
      priority: dto.priority
    };
  }

  /**
   * Parses the JSON rule definition string into RuleCondition array
   */
  private parseRuleDefinition(ruleDefinition: string | null): RuleCondition[] {
    if (!ruleDefinition) {
      return [];
    }
    try {
      return JSON.parse(ruleDefinition) as RuleCondition[];
    } catch (error) {
      log.warning('validation', 'Failed to parse rule definition', { error, ruleDefinition });
      return [];
    }
  }

  /**
   * Serializes RuleCondition array to JSON string
   */
  private serializeRuleDefinition(conditions: RuleCondition[]): string | null {
    if (!conditions || conditions.length === 0) {
      return null;
    }
    return JSON.stringify(conditions);
  }

  /**
   * Maps backend ClientType enum to frontend code
   */
  private mapClientType(backendType: string | null): '1' | '2' | '3' | null {
    if (!backendType) {
      return null; // Applies to all client types
    }
    const typeMap: Record<string, '1' | '2' | '3'> = {
      'INDIVIDUAL': '1',
      'CORPORATE': '2',
      'INSTITUTIONAL': '3',
      '1': '1',
      '2': '2',
      '3': '3'
    };
    return typeMap[backendType] || null;
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
      log.info('validation', 'Fetching validation rules from backend');
      const response = await this.axiosInstance.get<ApiResponse<ValidationRuleDto[]>>('/api/validation/rules/active');

      if (response.data.success && response.data.data && response.data.data.length > 0) {
        this.rules = response.data.data.map(dto => this.mapDtoToRule(dto));
        this.lastFetchTime = Date.now();
        log.info('validation', `Loaded ${this.rules.length} validation rules from backend`);
      } else {
        log.warning('validation', 'No rules returned from backend, using default rules');
      }
      return this.rules;
    } catch (error) {
      log.warning('validation', 'Failed to fetch validation rules from backend, using default rules', { error });
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
      log.error('validation', 'Failed to fetch rules by client type', { error, clientType });
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
        fieldLabel: rule.fieldLabel,
        clientType: this.mapClientTypeToBackend(rule.clientType),
        ruleType: rule.ruleType.toUpperCase(),
        ruleDefinition: this.serializeRuleDefinition(rule.ruleDefinition),
        errorMessage: rule.errorMessage,
        severity: rule.severity.toUpperCase(),
        active: rule.isActive,
        priority: rule.priority ?? this.getSeverityPriority(rule.severity)
      };

      const response = await this.axiosInstance.post<ApiResponse<ValidationRuleDto>>('/api/validation/rules', dto);

      if (response.data.success && response.data.data) {
        const newRule = this.mapDtoToRule(response.data.data);
        this.rules.push(newRule);
        return newRule;
      }
      return null;
    } catch (error) {
      log.error('validation', 'Failed to create validation rule', { error });
      throw error;
    }
  }

  /**
   * Maps frontend client type code to backend enum
   */
  private mapClientTypeToBackend(clientType: '1' | '2' | '3' | null): string | null {
    if (!clientType) {
      return null;
    }
    const typeMap: Record<string, string> = {
      '1': 'INDIVIDUAL',
      '2': 'CORPORATE',
      '3': 'INSTITUTIONAL'
    };
    return typeMap[clientType] || null;
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
      if (updates.fieldLabel) dto.fieldLabel = updates.fieldLabel;
      if (updates.clientType !== undefined) dto.clientType = this.mapClientTypeToBackend(updates.clientType);
      if (updates.ruleType) dto.ruleType = updates.ruleType.toUpperCase();
      if (updates.ruleDefinition) dto.ruleDefinition = this.serializeRuleDefinition(updates.ruleDefinition);
      if (updates.errorMessage) dto.errorMessage = updates.errorMessage;
      if (updates.severity) {
        dto.severity = updates.severity.toUpperCase();
        dto.priority = updates.priority ?? this.getSeverityPriority(updates.severity);
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
      log.error('validation', 'Failed to update validation rule', { error, ruleId });
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
      log.error('validation', 'Failed to delete validation rule', { error, ruleId });
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
      log.error('validation', 'Failed to toggle validation rule', { error, ruleId });
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

    // Filter applicable rules for the client type (null clientType applies to all)
    const applicableRules = this.rules.filter(rule =>
      rule.isActive && (rule.clientType === null || rule.clientType === record.tcli)
    );

    for (const rule of applicableRules) {
      const validationResult = this.validateFieldAgainstConditions(record, rule);

      if (!validationResult.isValid) {
        if (rule.severity === 'critical' || rule.severity === 'high') {
          errors.push({
            ruleId: rule.id,
            field: rule.field,
            message: validationResult.message || rule.errorMessage,
            severity: rule.severity,
            value: record[rule.field as keyof ClientRecord]
          });
        } else {
          warnings.push({
            ruleId: rule.id,
            field: rule.field,
            message: validationResult.message || rule.errorMessage,
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

  /**
   * Validates a field value against rule conditions from ruleDefinition.
   */
  private validateFieldAgainstConditions(record: ClientRecord, rule: ValidationRule): { isValid: boolean; message?: string } {
    const fieldValue = record[rule.field as keyof ClientRecord];
    const strValue = fieldValue != null ? String(fieldValue).trim() : '';
    const conditions = rule.ruleDefinition;

    // If no conditions, pass validation
    if (!conditions || conditions.length === 0) {
      return { isValid: true };
    }

    // Validate against each condition
    for (const condition of conditions) {
      const result = this.validateCondition(strValue, fieldValue, condition);
      if (!result.isValid) {
        return { isValid: false, message: condition.message || result.message };
      }
    }

    return { isValid: true };
  }

  /**
   * Validates a single condition against a value.
   */
  private validateCondition(strValue: string, rawValue: unknown, condition: RuleCondition): { isValid: boolean; message?: string } {
    const isEmpty = strValue === '' || rawValue == null;

    switch (condition.type) {
      // ===== PRESENCE =====
      case 'required':
        return {
          isValid: !isEmpty,
          message: 'Ce champ est obligatoire'
        };

      case 'optional':
        // Optional fields always pass if empty
        if (isEmpty) return { isValid: true };
        break;

      // ===== LENGTH =====
      case 'minLength': {
        if (isEmpty && condition.optional) return { isValid: true };
        const minLen = Number(condition.value) || 0;
        return {
          isValid: isEmpty || strValue.length >= minLen,
          message: `Longueur minimale: ${minLen} caracteres`
        };
      }

      case 'maxLength': {
        if (isEmpty) return { isValid: true };
        const maxLen = Number(condition.value) || Infinity;
        return {
          isValid: strValue.length <= maxLen,
          message: `Longueur maximale: ${maxLen} caracteres`
        };
      }

      case 'exactLength': {
        if (isEmpty && condition.optional) return { isValid: true };
        const exactLen = Number(condition.value) || 0;
        return {
          isValid: isEmpty || strValue.length === exactLen,
          message: `Longueur exacte requise: ${exactLen} caracteres`
        };
      }

      // ===== PATTERNS =====
      case 'alphanumeric':
        if (isEmpty) return { isValid: true };
        return {
          isValid: /^[A-Za-z0-9]+$/.test(strValue),
          message: 'Seuls les caracteres alphanumeriques sont autorises'
        };

      case 'alphaOnly':
        if (isEmpty) return { isValid: true };
        return {
          isValid: /^[A-Za-zÀ-ÿ\s\-']+$/.test(strValue),
          message: 'Seuls les lettres sont autorisees'
        };

      case 'numericOnly':
        if (isEmpty) return { isValid: true };
        return {
          isValid: /^[0-9]+$/.test(strValue),
          message: 'Seuls les chiffres sont autorises'
        };

      case 'uppercase':
        if (isEmpty) return { isValid: true };
        return {
          isValid: strValue === strValue.toUpperCase(),
          message: 'Doit etre en majuscules'
        };

      case 'email':
        if (isEmpty) return { isValid: true };
        return {
          isValid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strValue),
          message: 'Format email invalide'
        };

      case 'phone':
        if (isEmpty) return { isValid: true };
        return {
          isValid: /^[\d\s\-\+\(\)]{8,20}$/.test(strValue),
          message: 'Format telephone invalide'
        };

      // ===== FORBIDDEN =====
      case 'forbiddenPatterns': {
        if (isEmpty) return { isValid: true };
        const patterns = condition.values || [];
        for (const pattern of patterns) {
          if (strValue.includes(pattern)) {
            return { isValid: false, message: `Motif interdit: ${pattern}` };
          }
        }
        return { isValid: true };
      }

      case 'forbiddenValues': {
        if (isEmpty) return { isValid: true };
        const forbidden = condition.values || [];
        const normalizedValue = strValue.toUpperCase();
        for (const val of forbidden) {
          if (normalizedValue === val.toUpperCase()) {
            return { isValid: false, message: `Valeur interdite: ${val}` };
          }
        }
        return { isValid: true };
      }

      case 'notPlaceholder': {
        if (isEmpty) return { isValid: true };
        const placeholders = ['XXX', 'XXXX', 'XXXXX', '000', '0000', '123', '1234', 'TEST', 'TEMP', 'NA', 'N/A'];
        const upperValue = strValue.toUpperCase();
        for (const placeholder of placeholders) {
          if (upperValue === placeholder || upperValue.includes(placeholder)) {
            return { isValid: false, message: 'Donnees fictives detectees' };
          }
        }
        return { isValid: true };
      }

      // ===== DATE =====
      case 'dateNotFuture': {
        if (isEmpty) return { isValid: true };
        const date = this.parseDate(strValue);
        if (!date) return { isValid: false, message: 'Format de date invalide' };
        return {
          isValid: date <= new Date(),
          message: 'La date ne peut pas etre dans le futur'
        };
      }

      case 'dateNotExpired': {
        if (isEmpty) return { isValid: true };
        const date = this.parseDate(strValue);
        if (!date) return { isValid: false, message: 'Format de date invalide' };
        return {
          isValid: date >= new Date(),
          message: 'La date est expiree'
        };
      }

      case 'dateAfter': {
        if (isEmpty) return { isValid: true };
        const date = this.parseDate(strValue);
        const minDate = this.parseDate(String(condition.value));
        if (!date || !minDate) return { isValid: false, message: 'Format de date invalide' };
        return {
          isValid: date >= minDate,
          message: `La date doit etre apres ${condition.value}`
        };
      }

      case 'dateBefore': {
        if (isEmpty) return { isValid: true };
        const date = this.parseDate(strValue);
        const maxDate = this.parseDate(String(condition.value));
        if (!date || !maxDate) return { isValid: false, message: 'Format de date invalide' };
        return {
          isValid: date <= maxDate,
          message: `La date doit etre avant ${condition.value}`
        };
      }

      case 'dateRange': {
        if (isEmpty) return { isValid: true };
        const date = this.parseDate(strValue);
        const minDate = condition.min ? this.parseDate(String(condition.min)) : null;
        const maxDate = condition.max ? this.parseDate(String(condition.max)) : null;
        if (!date) return { isValid: false, message: 'Format de date invalide' };
        if (minDate && date < minDate) return { isValid: false, message: `La date doit etre apres ${condition.min}` };
        if (maxDate && date > maxDate) return { isValid: false, message: `La date doit etre avant ${condition.max}` };
        return { isValid: true };
      }

      // ===== PREFIX/SUFFIX =====
      case 'startsWith': {
        if (isEmpty) return { isValid: true };
        const prefix = String(condition.value || '');
        return {
          isValid: strValue.startsWith(prefix),
          message: `Doit commencer par: ${prefix}`
        };
      }

      case 'endsWith': {
        if (isEmpty) return { isValid: true };
        const suffix = String(condition.value || '');
        return {
          isValid: strValue.endsWith(suffix),
          message: `Doit se terminer par: ${suffix}`
        };
      }

      case 'contains': {
        if (isEmpty) return { isValid: true };
        const substr = String(condition.value || '');
        return {
          isValid: strValue.includes(substr),
          message: `Doit contenir: ${substr}`
        };
      }

      // ===== LIST =====
      case 'inList': {
        if (isEmpty && condition.optional) return { isValid: true };
        const allowed = condition.values || [];
        const normalizedValue = strValue.toUpperCase();
        return {
          isValid: allowed.some(v => v.toUpperCase() === normalizedValue),
          message: `Valeur doit etre parmi: ${allowed.join(', ')}`
        };
      }

      case 'notInList': {
        if (isEmpty) return { isValid: true };
        const forbidden = condition.values || [];
        const normalizedValue = strValue.toUpperCase();
        return {
          isValid: !forbidden.some(v => v.toUpperCase() === normalizedValue),
          message: `Valeur interdite: ${strValue}`
        };
      }

      // ===== NUMERIC =====
      case 'minValue': {
        if (isEmpty) return { isValid: true };
        const numVal = parseFloat(strValue);
        const minVal = Number(condition.value) || 0;
        if (isNaN(numVal)) return { isValid: false, message: 'Valeur numerique attendue' };
        return {
          isValid: numVal >= minVal,
          message: `Valeur minimale: ${minVal}`
        };
      }

      case 'maxValue': {
        if (isEmpty) return { isValid: true };
        const numVal = parseFloat(strValue);
        const maxVal = Number(condition.value) || Infinity;
        if (isNaN(numVal)) return { isValid: false, message: 'Valeur numerique attendue' };
        return {
          isValid: numVal <= maxVal,
          message: `Valeur maximale: ${maxVal}`
        };
      }

      case 'valueRange': {
        if (isEmpty) return { isValid: true };
        const numVal = parseFloat(strValue);
        const minVal = Number(condition.min) || -Infinity;
        const maxVal = Number(condition.max) || Infinity;
        if (isNaN(numVal)) return { isValid: false, message: 'Valeur numerique attendue' };
        return {
          isValid: numVal >= minVal && numVal <= maxVal,
          message: `Valeur doit etre entre ${minVal} et ${maxVal}`
        };
      }

      // ===== CUSTOM =====
      case 'customRegex': {
        if (isEmpty) return { isValid: true };
        try {
          const regex = new RegExp(String(condition.value));
          return {
            isValid: regex.test(strValue),
            message: 'Format invalide'
          };
        } catch {
          return { isValid: false, message: 'Expression reguliere invalide' };
        }
      }

      default:
        // Unknown condition type - pass validation
        return { isValid: true };
    }

    return { isValid: true };
  }

  /**
   * Parses a date string into a Date object.
   */
  private parseDate(value: string): Date | null {
    if (!value) return null;

    // Try ISO format first (YYYY-MM-DD)
    const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (isoMatch) {
      const date = new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
      return isNaN(date.getTime()) ? null : date;
    }

    // Try standard Date parsing
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
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
