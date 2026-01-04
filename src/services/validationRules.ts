import { ValidationRule, ValidationResult, ValidationError, ValidationWarning, ClientRecord } from '../types/ValidationRules';

export class ValidationRulesService {
  private static instance: ValidationRulesService;
  private rules: ValidationRule[] = [];

  private constructor() {
    this.initializeDefaultRules();
  }

  public static getInstance(): ValidationRulesService {
    if (!ValidationRulesService.instance) {
      ValidationRulesService.instance = new ValidationRulesService();
    }
    return ValidationRulesService.instance;
  }

  private initializeDefaultRules(): void {
    this.rules = [
      // RÈGLES SPÉCIFIQUES DEMANDÉES - PARTICULIERS (tcli = '1')
      {
        id: 'DNA_MIN_YEAR_1915',
        name: 'Date de naissance supérieure à 1915',
        description: 'La date de naissance doit être supérieure à 1915',
        field: 'dna',
        clientType: '1',
        ruleType: 'date',
        condition: 'dna >= "1915-01-01"',
        errorMessage: 'La date de naissance doit être supérieure à 1915',
        severity: 'high',
        isActive: true,
        category: 'Cohérence Temporelle'
      },
      {
        id: 'VID_VALIDITY_CHECK',
        name: 'Date d\'expiration PI en cours de validité',
        description: 'La date d\'expiration de la pièce d\'identité doit être en cours de validité',
        field: 'vid',
        clientType: '1',
        ruleType: 'date',
        condition: 'vid IS NULL OR vid >= CURDATE()',
        errorMessage: 'La date d\'expiration de la pièce d\'identité doit être en cours de validité',
        severity: 'critical',
        isActive: true,
        category: 'Validité Documents'
      },
      {
        id: 'NID_FORMAT_CHECK',
        name: 'Format numéro PI valide',
        description: 'Le numéro de pièce d\'identité doit respecter le format requis',
        field: 'nid',
        clientType: '1',
        ruleType: 'format',
        condition: 'LENGTH(nid) >= 8 AND nid REGEXP "^[0-9A-Z]+$" AND nid NOT LIKE "%123%" AND nid NOT LIKE "%XXX%" AND nid NOT LIKE "%000%"',
        errorMessage: 'Le numéro de pièce d\'identité doit contenir au moins 8 caractères alphanumériques, sans "123", "XXX" ou "000"',
        severity: 'high',
        isActive: true,
        category: 'Format Documents'
      },
      {
        id: 'NAT_REQUIRED_ALL',
        name: 'Nationalité obligatoire',
        description: 'La nationalité doit être renseignée pour tous les clients',
        field: 'nat',
        clientType: '1',
        ruleType: 'required',
        condition: 'nat IS NOT NULL AND TRIM(nat) != ""',
        errorMessage: 'La nationalité doit être renseignée',
        severity: 'medium',
        isActive: true,
        category: 'Identification'
      },
      {
        id: 'PP_NOM_REQUIRED',
        name: 'Nom obligatoire - Particuliers',
        description: 'Le nom est obligatoire pour tous les clients particuliers',
        field: 'nom',
        clientType: '1',
        ruleType: 'required',
        condition: 'NOT NULL AND TRIM(nom) != "" AND nom NOT REGEXP "^[Xx]+$"',
        errorMessage: 'Le nom est obligatoire et ne peut pas être composé uniquement de X',
        severity: 'critical',
        isActive: true,
        category: 'Identification'
      },
      {
        id: 'PP_PRENOM_REQUIRED',
        name: 'Prénom obligatoire - Particuliers',
        description: 'Le prénom est obligatoire pour tous les clients particuliers',
        field: 'pre',
        clientType: '1',
        ruleType: 'required',
        condition: 'NOT NULL AND TRIM(pre) != "" AND pre NOT REGEXP "^[Xx]+$"',
        errorMessage: 'Le prénom est obligatoire et ne peut pas être composé uniquement de X',
        severity: 'critical',
        isActive: true,
        category: 'Identification'
      },
      {
        id: 'PP_SEXE_REQUIRED',
        name: 'Sexe obligatoire - Particuliers',
        description: 'Le sexe doit être renseigné (M/F)',
        field: 'sext',
        clientType: '1',
        ruleType: 'format',
        condition: 'sext IN ("M", "F")',
        errorMessage: 'Le sexe doit être M (Masculin) ou F (Féminin)',
        severity: 'high',
        isActive: true,
        category: 'Identification'
      },
      {
        id: 'PP_DATE_NAISSANCE_REQUIRED',
        name: 'Date de naissance obligatoire - Particuliers',
        description: 'La date de naissance est obligatoire',
        field: 'dna',
        clientType: '1',
        ruleType: 'required',
        condition: 'dna IS NOT NULL AND dna REGEXP "^[0-9]{4}-[0-9]{2}-[0-9]{2}$" AND dna >= "1915-01-01" AND dna <= CURDATE()',
        errorMessage: 'La date de naissance est obligatoire et doit être au format YYYY-MM-DD entre 1915 et aujourd\'hui',
        severity: 'critical',
        isActive: true,
        category: 'Identification'
      },
      {
        id: 'PP_VILLE_NAISSANCE_REQUIRED',
        name: 'Ville de naissance obligatoire - Particuliers',
        description: 'La ville de naissance est obligatoire',
        field: 'viln',
        clientType: '1',
        ruleType: 'required',
        condition: 'viln IS NOT NULL',
        errorMessage: 'La ville de naissance est obligatoire',
        severity: 'medium',
        isActive: true,
        category: 'Identification'
      },
      {
        id: 'PP_PAYS_NAISSANCE_REQUIRED',
        name: 'Pays de naissance obligatoire - Particuliers',
        description: 'Le pays de naissance est obligatoire',
        field: 'payn',
        clientType: '1',
        ruleType: 'required',
        condition: 'payn IS NOT NULL',
        errorMessage: 'Le pays de naissance est obligatoire',
        severity: 'medium',
        isActive: true,
        category: 'Identification'
      },
      {
        id: 'PP_TYPE_PIECE_IDENTITE_REQUIRED',
        name: 'Type de pièce d\'identité obligatoire - Particuliers',
        description: 'Le type de pièce d\'identité est obligatoire',
        field: 'tid',
        clientType: '1',
        ruleType: 'required',
        condition: 'tid IS NOT NULL',
        errorMessage: 'Le type de pièce d\'identité est obligatoire',
        severity: 'high',
        isActive: true,
        category: 'Identification'
      },
      {
        id: 'PP_NOM_MERE_REQUIRED',
        name: 'Nom de la mère obligatoire - Particuliers',
        description: 'Le nom de la mère est obligatoire',
        field: 'nmer',
        clientType: '1',
        ruleType: 'required',
        condition: 'NOT NULL AND TRIM(nmer) != ""',
        errorMessage: 'Le nom de la mère est obligatoire pour les clients particuliers',
        severity: 'critical',
        isActive: true,
        category: 'Identification'
      },

      // RÈGLES POUR ENTREPRISES (tcli = '2')
      {
        id: 'ENT_RAISON_SOCIALE_REQUIRED',
        name: 'Raison sociale obligatoire - Entreprises',
        description: 'La raison sociale est obligatoire pour les entreprises',
        field: 'rso',
        clientType: '2',
        ruleType: 'required',
        condition: 'NOT NULL AND TRIM(rso) != "" AND rso NOT LIKE "%123%" AND rso NOT LIKE "%XXX%"',
        errorMessage: 'La raison sociale est obligatoire et ne peut pas contenir "123" ou "XXX"',
        severity: 'critical',
        isActive: true,
        category: 'Identification'
      },
      {
        id: 'ENT_SIGLE_FORMAT',
        name: 'Format sigle - Entreprises',
        description: 'Le sigle doit respecter un format approprié',
        field: 'sig',
        clientType: '2',
        ruleType: 'format',
        condition: 'sig IS NULL OR (LENGTH(sig) <= 20 AND sig REGEXP "^[A-Z0-9\\-\\.\\s]+$")',
        errorMessage: 'Le sigle doit contenir uniquement des lettres majuscules, chiffres, tirets et points',
        severity: 'medium',
        isActive: true,
        category: 'Format'
      },
      {
        id: 'ENT_NRC_REQUIRED',
        name: 'Numéro registre commerce obligatoire - Entreprises',
        description: 'Le numéro de registre de commerce est obligatoire',
        field: 'nrc',
        clientType: '2',
        ruleType: 'required',
        condition: 'NOT NULL AND TRIM(nrc) != "" AND nrc NOT LIKE "%123%" AND nrc NOT LIKE "%XXX%" AND nrc NOT LIKE "%000%" AND nrc LIKE "MA%"',
        errorMessage: 'Le numéro de registre de commerce est obligatoire, doit commencer par "MA" et ne peut pas contenir "123", "XXX" ou "000"',
        severity: 'critical',
        isActive: true,
        category: 'Identification'
      },
      {
        id: 'ENT_DATE_CREATION_REQUIRED',
        name: 'Date de création obligatoire - Entreprises',
        description: 'La date de création de l\'entreprise est obligatoire',
        field: 'datc',
        clientType: '2',
        ruleType: 'required',
        condition: 'datc IS NOT NULL AND datc >= "1915-01-01" AND datc <= CURDATE() AND datc REGEXP "^[0-9]{4}-[0-9]{2}-[0-9]{2}$"',
        errorMessage: 'La date de création est obligatoire et doit être au format YYYY-MM-DD entre 1915 et aujourd\'hui',
        severity: 'critical',
        isActive: true,
        category: 'Identification'
      },
      {
        id: 'ENT_SECTEUR_ACTIVITE_REQUIRED',
        name: 'Secteur d\'activité obligatoire - Entreprises',
        description: 'Le secteur d\'activité est obligatoire',
        field: 'sec',
        clientType: '2',
        ruleType: 'required',
        condition: 'sec IS NOT NULL',
        errorMessage: 'Le secteur d\'activité est obligatoire',
        severity: 'high',
        isActive: true,
        category: 'Classification'
      },
      {
        id: 'ENT_FORME_JURIDIQUE_REQUIRED',
        name: 'Forme juridique obligatoire - Entreprises',
        description: 'La forme juridique est obligatoire',
        field: 'fju',
        clientType: '2',
        ruleType: 'required',
        condition: 'fju IS NOT NULL',
        errorMessage: 'La forme juridique est obligatoire',
        severity: 'high',
        isActive: true,
        category: 'Classification'
      },
      {
        id: 'ENT_CATEGORIE_BC_REQUIRED',
        name: 'Catégorie Banque Centrale obligatoire - Entreprises',
        description: 'La catégorie de la Banque Centrale est obligatoire',
        field: 'catn',
        clientType: '2',
        ruleType: 'required',
        condition: 'catn IS NOT NULL',
        errorMessage: 'La catégorie de la Banque Centrale est obligatoire',
        severity: 'high',
        isActive: true,
        category: 'Réglementation'
      },
      {
        id: 'ENT_LIEN_BANQUE_REQUIRED',
        name: 'Lien avec la banque obligatoire - Entreprises',
        description: 'Le lien d\'apparenté avec la banque est obligatoire',
        field: 'lienbq',
        clientType: '2',
        ruleType: 'required',
        condition: 'lienbq IS NOT NULL',
        errorMessage: 'Le lien d\'apparenté avec la banque est obligatoire',
        severity: 'medium',
        isActive: true,
        category: 'Réglementation'
      },

      // RÈGLES POUR INSTITUTIONNELS (tcli = '3')
      {
        id: 'INST_RAISON_SOCIALE_REQUIRED',
        name: 'Raison sociale obligatoire - Institutionnels',
        description: 'La raison sociale est obligatoire pour les institutionnels',
        field: 'rso',
        clientType: '3',
        ruleType: 'required',
        condition: 'NOT NULL AND TRIM(rso) != "" AND rso NOT LIKE "%123%" AND rso NOT LIKE "%XXX%"',
        errorMessage: 'La raison sociale est obligatoire et ne peut pas contenir "123" ou "XXX"',
        severity: 'critical',
        isActive: true,
        category: 'Identification'
      },
      {
        id: 'INST_NRC_REQUIRED',
        name: 'Numéro registre obligatoire - Institutionnels',
        description: 'Le numéro de registre est obligatoire pour les institutionnels',
        field: 'nrc',
        clientType: '3',
        ruleType: 'required',
        condition: 'NOT NULL AND TRIM(nrc) != "" AND nrc NOT LIKE "%123%" AND nrc NOT LIKE "%XXX%" AND nrc NOT LIKE "%000%"',
        errorMessage: 'Le numéro de registre est obligatoire et ne peut pas contenir "123", "XXX" ou "000"',
        severity: 'critical',
        isActive: true,
        category: 'Identification'
      },
      {
        id: 'INST_DATE_CREATION_REQUIRED',
        name: 'Date de création obligatoire - Institutionnels',
        description: 'La date de création est obligatoire pour les institutionnels',
        field: 'datc',
        clientType: '3',
        ruleType: 'required',
        condition: 'datc IS NOT NULL AND datc >= "1915-01-01" AND datc <= CURDATE() AND datc REGEXP "^[0-9]{4}-[0-9]{2}-[0-9]{2}$"',
        errorMessage: 'La date de création est obligatoire et doit être au format YYYY-MM-DD entre 1915 et aujourd\'hui',
        severity: 'critical',
        isActive: true,
        category: 'Identification'
      },
      {
        id: 'INST_SECTEUR_ACTIVITE_REQUIRED',
        name: 'Secteur d\'activité obligatoire - Institutionnels',
        description: 'Le secteur d\'activité est obligatoire',
        field: 'sec',
        clientType: '3',
        ruleType: 'required',
        condition: 'sec IS NOT NULL',
        errorMessage: 'Le secteur d\'activité est obligatoire',
        severity: 'high',
        isActive: true,
        category: 'Classification'
      },
      {
        id: 'INST_FORME_JURIDIQUE_REQUIRED',
        name: 'Forme juridique obligatoire - Institutionnels',
        description: 'La forme juridique est obligatoire',
        field: 'fju',
        clientType: '3',
        ruleType: 'required',
        condition: 'fju IS NOT NULL',
        errorMessage: 'La forme juridique est obligatoire',
        severity: 'high',
        isActive: true,
        category: 'Classification'
      },
      {
        id: 'INST_CATEGORIE_BC_REQUIRED',
        name: 'Catégorie Banque Centrale obligatoire - Institutionnels',
        description: 'La catégorie de la Banque Centrale est obligatoire',
        field: 'catn',
        clientType: '3',
        ruleType: 'required',
        condition: 'catn IS NOT NULL',
        errorMessage: 'La catégorie de la Banque Centrale est obligatoire',
        severity: 'high',
        isActive: true,
        category: 'Réglementation'
      },
      {
        id: 'INST_LIEN_BANQUE_REQUIRED',
        name: 'Lien avec la banque obligatoire - Institutionnels',
        description: 'Le lien d\'apparenté avec la banque est obligatoire',
        field: 'lienbq',
        clientType: '3',
        ruleType: 'required',
        condition: 'lienbq IS NOT NULL',
        errorMessage: 'Le lien d\'apparenté avec la banque est obligatoire',
        severity: 'medium',
        isActive: true,
        category: 'Réglementation'
      },

      // RÈGLES COMMUNES À TOUS LES TYPES
      {
        id: 'ALL_CODE_CLIENT_REQUIRED',
        name: 'Code client obligatoire - Tous types',
        description: 'Le code client est obligatoire pour tous les types',
        field: 'cli',
        clientType: '1',
        ruleType: 'required',
        condition: 'NOT NULL AND TRIM(cli) != ""',
        errorMessage: 'Le code client est obligatoire',
        severity: 'critical',
        isActive: true,
        category: 'Identification'
      },
      {
        id: 'ALL_CODE_AGENCE_REQUIRED',
        name: 'Code agence obligatoire - Tous types',
        description: 'Le code agence est obligatoire pour tous les types',
        field: 'age',
        clientType: '1',
        ruleType: 'required',
        condition: 'NOT NULL AND TRIM(age) != ""',
        errorMessage: 'Le code agence est obligatoire',
        severity: 'high',
        isActive: true,
        category: 'Gestion'
      },
      {
        id: 'ALL_TYPE_CLIENT_VALID',
        name: 'Type client valide - Tous types',
        description: 'Le type de client doit être valide (1, 2 ou 3)',
        field: 'tcli',
        clientType: '1',
        ruleType: 'format',
        condition: 'tcli IN ("1", "2", "3")',
        errorMessage: 'Le type de client doit être 1 (Particulier), 2 (Entreprise) ou 3 (Institutionnel)',
        severity: 'critical',
        isActive: true,
        category: 'Classification'
      }
    ];
  }

  public validateRecord(record: ClientRecord): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Filtrer les règles applicables au type de client
    const applicableRules = this.rules.filter(rule => 
      rule.isActive && (rule.clientType === record.tcli || rule.clientType === '1') // '1' pour les règles communes
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

  public getRules(): ValidationRule[] {
    return [...this.rules];
  }

  public getRulesByClientType(clientType: '1' | '2' | '3'): ValidationRule[] {
    return this.rules.filter(rule => 
      rule.clientType === clientType || rule.clientType === '1' // Règles communes
    );
  }

  public addRule(rule: ValidationRule): void {
    this.rules.push(rule);
  }

  public updateRule(ruleId: string, updates: Partial<ValidationRule>): boolean {
    const index = this.rules.findIndex(rule => rule.id === ruleId);
    if (index !== -1) {
      this.rules[index] = { ...this.rules[index], ...updates };
      return true;
    }
    return false;
  }

  public deleteRule(ruleId: string): boolean {
    const index = this.rules.findIndex(rule => rule.id === ruleId);
    if (index !== -1) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }

  public toggleRule(ruleId: string): boolean {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.isActive = !rule.isActive;
      return true;
    }
    return false;
  }
}

export const validationRulesService = ValidationRulesService.getInstance();