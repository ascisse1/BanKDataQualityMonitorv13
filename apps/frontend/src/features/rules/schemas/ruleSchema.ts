import { z } from 'zod';

// Rule condition types
export const ruleConditionTypeSchema = z.enum([
  'required',
  'optional',
  'minLength',
  'maxLength',
  'exactLength',
  'alphanumeric',
  'alphaOnly',
  'numericOnly',
  'uppercase',
  'email',
  'phone',
  'forbiddenPatterns',
  'forbiddenValues',
  'notPlaceholder',
  'dateNotFuture',
  'dateAfter',
  'dateBefore',
  'dateRange',
  'dateNotExpired',
  'startsWith',
  'endsWith',
  'contains',
  'inList',
  'notInList',
  'minValue',
  'maxValue',
  'valueRange',
  'customRegex',
]);

export type RuleConditionType = z.infer<typeof ruleConditionTypeSchema>;

// Rule condition schema
export const ruleConditionSchema = z.object({
  type: ruleConditionTypeSchema,
  value: z.union([z.string(), z.number()]).optional(),
  values: z.array(z.string()).optional(),
  min: z.union([z.string(), z.number()]).optional(),
  max: z.union([z.string(), z.number()]).optional(),
  message: z.string().optional(),
  optional: z.boolean().optional(),
});

export type RuleCondition = z.infer<typeof ruleConditionSchema>;

// Severity schema
export const severitySchema = z.enum(['low', 'medium', 'high', 'critical']);
export type Severity = z.infer<typeof severitySchema>;

// Client type schema
export const clientTypeSchema = z.enum(['1', '2', '3']).nullable();
export type ClientType = z.infer<typeof clientTypeSchema>;

// Rule type schema
export const ruleTypeSchema = z.enum(['required', 'format', 'length', 'date', 'custom']);
export type RuleType = z.infer<typeof ruleTypeSchema>;

// Main validation rule schema
export const validationRuleSchema = z.object({
  id: z.string(),
  name: z.string()
    .min(3, 'Le nom doit contenir au moins 3 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  description: z.string()
    .max(500, 'La description ne peut pas dépasser 500 caractères')
    .optional()
    .default(''),
  field: z.string()
    .min(1, 'Le champ est obligatoire'),
  fieldLabel: z.string().optional(),
  clientType: clientTypeSchema,
  ruleType: ruleTypeSchema,
  ruleDefinition: z.array(ruleConditionSchema).default([]),
  errorMessage: z.string()
    .min(10, 'Le message d\'erreur doit contenir au moins 10 caractères')
    .max(300, 'Le message d\'erreur ne peut pas dépasser 300 caractères'),
  severity: severitySchema,
  isActive: z.boolean().default(true),
  category: z.string().optional().default('Autres'),
  priority: z.number().optional(),
});

export type ValidationRule = z.infer<typeof validationRuleSchema>;

// Create rule schema (without id)
export const createRuleSchema = validationRuleSchema.omit({ id: true });
export type CreateRuleInput = z.infer<typeof createRuleSchema>;

// Update rule schema (all fields optional except id)
export const updateRuleSchema = validationRuleSchema.partial().required({ id: true });
export type UpdateRuleInput = z.infer<typeof updateRuleSchema>;

// Form schema for the rule editor
export const ruleFormSchema = z.object({
  name: z.string()
    .min(3, 'Le nom doit contenir au moins 3 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  description: z.string()
    .max(500, 'La description ne peut pas dépasser 500 caractères')
    .optional()
    .default(''),
  field: z.string()
    .min(1, 'Le champ est obligatoire'),
  fieldLabel: z.string().optional(),
  clientType: z.enum(['1', '2', '3', '']).transform(val => val === '' ? null : val as '1' | '2' | '3'),
  ruleType: ruleTypeSchema,
  ruleDefinition: z.array(ruleConditionSchema).default([]),
  errorMessage: z.string()
    .min(10, 'Le message d\'erreur doit contenir au moins 10 caractères')
    .max(300, 'Le message d\'erreur ne peut pas dépasser 300 caractères'),
  severity: severitySchema,
  isActive: z.boolean().default(true),
  category: z.string().optional().default('Autres'),
  priority: z.preprocess(
    (val) => (val === '' || val === undefined || val === null || Number.isNaN(val) ? undefined : Number(val)),
    z.number().optional()
  ),
  condition: z.string().optional(), // SQL condition for backward compatibility
});

export type RuleFormData = z.infer<typeof ruleFormSchema>;

// Field options for autocomplete
export const FIELD_OPTIONS = [
  { code: 'cli', label: 'Code client', type: 'string' },
  { code: 'nom', label: 'Nom', type: 'string' },
  { code: 'pre', label: 'Prénom', type: 'string' },
  { code: 'sext', label: 'Sexe', type: 'string' },
  { code: 'dna', label: 'Date de naissance', type: 'date' },
  { code: 'nid', label: 'Numéro d\'identité', type: 'string' },
  { code: 'tid', label: 'Type de pièce d\'identité', type: 'string' },
  { code: 'vid', label: 'Date expiration pièce', type: 'date' },
  { code: 'nmer', label: 'Nom de la mère', type: 'string' },
  { code: 'nat', label: 'Nationalité', type: 'string' },
  { code: 'viln', label: 'Ville de naissance', type: 'string' },
  { code: 'payn', label: 'Pays de naissance', type: 'string' },
  { code: 'nrc', label: 'Numéro de registre', type: 'string' },
  { code: 'datc', label: 'Date de création', type: 'date' },
  { code: 'rso', label: 'Raison sociale', type: 'string' },
  { code: 'sig', label: 'Sigle', type: 'string' },
  { code: 'sec', label: 'Secteur d\'activité', type: 'string' },
  { code: 'fju', label: 'Forme juridique', type: 'string' },
  { code: 'catn', label: 'Catégorie BC', type: 'string' },
  { code: 'lienbq', label: 'Lien avec la banque', type: 'string' },
  { code: 'age', label: 'Code agence', type: 'string' },
  { code: 'tcli', label: 'Type de client', type: 'string' },
] as const;

export type FieldOption = typeof FIELD_OPTIONS[number];

// Category options
export const CATEGORY_OPTIONS = [
  'Identification',
  'Format Documents',
  'Validité Documents',
  'Cohérence Temporelle',
  'Classification',
  'Réglementation',
  'Gestion',
  'Format',
  'Autres',
] as const;

// Severity labels in French
export const SEVERITY_LABELS: Record<Severity, string> = {
  low: 'Faible',
  medium: 'Moyenne',
  high: 'Haute',
  critical: 'Critique',
};

// Client type labels
export const CLIENT_TYPE_LABELS: Record<string, string> = {
  '1': 'Particuliers',
  '2': 'Entreprises',
  '3': 'Institutionnels',
  'all': 'Tous',
};

// Rule type labels
export const RULE_TYPE_LABELS: Record<RuleType, string> = {
  required: 'Obligatoire',
  format: 'Format',
  length: 'Longueur',
  date: 'Date',
  custom: 'Personnalisé',
};

// Condition type labels for the visual rule builder
export const CONDITION_TYPE_LABELS: Record<RuleConditionType, string> = {
  required: 'Est obligatoire',
  optional: 'Est optionnel',
  minLength: 'Longueur minimale',
  maxLength: 'Longueur maximale',
  exactLength: 'Longueur exacte',
  alphanumeric: 'Alphanumérique uniquement',
  alphaOnly: 'Lettres uniquement',
  numericOnly: 'Chiffres uniquement',
  uppercase: 'Majuscules uniquement',
  email: 'Format email',
  phone: 'Format téléphone',
  forbiddenPatterns: 'Motifs interdits',
  forbiddenValues: 'Valeurs interdites',
  notPlaceholder: 'Pas de données fictives',
  dateNotFuture: 'Date non future',
  dateAfter: 'Date après',
  dateBefore: 'Date avant',
  dateRange: 'Plage de dates',
  dateNotExpired: 'Date non expirée',
  startsWith: 'Commence par',
  endsWith: 'Se termine par',
  contains: 'Contient',
  inList: 'Dans la liste',
  notInList: 'Pas dans la liste',
  minValue: 'Valeur minimale',
  maxValue: 'Valeur maximale',
  valueRange: 'Plage de valeurs',
  customRegex: 'Expression régulière',
};

// Condition types grouped by category
export const CONDITION_TYPES_BY_CATEGORY = {
  'Présence': ['required', 'optional'],
  'Longueur': ['minLength', 'maxLength', 'exactLength'],
  'Format': ['alphanumeric', 'alphaOnly', 'numericOnly', 'uppercase', 'email', 'phone', 'customRegex'],
  'Interdictions': ['forbiddenPatterns', 'forbiddenValues', 'notPlaceholder'],
  'Dates': ['dateNotFuture', 'dateAfter', 'dateBefore', 'dateRange', 'dateNotExpired'],
  'Texte': ['startsWith', 'endsWith', 'contains'],
  'Liste': ['inList', 'notInList'],
  'Numérique': ['minValue', 'maxValue', 'valueRange'],
} as const;
