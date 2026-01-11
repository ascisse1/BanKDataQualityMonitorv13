// ===== NATURAL LANGUAGE RULE TYPES =====

/**
 * Available rule condition types for natural language validation
 */
export type NaturalRuleType =
  // Presence
  | 'required'
  | 'optional'
  // Length
  | 'minLength'
  | 'maxLength'
  | 'exactLength'
  // Patterns
  | 'alphanumeric'
  | 'alphaOnly'
  | 'numericOnly'
  | 'uppercase'
  | 'email'
  | 'phone'
  // Forbidden
  | 'forbiddenPatterns'
  | 'forbiddenValues'
  | 'notPlaceholder'
  // Date
  | 'dateNotFuture'
  | 'dateAfter'
  | 'dateBefore'
  | 'dateRange'
  | 'dateNotExpired'
  // Prefix/Suffix
  | 'startsWith'
  | 'endsWith'
  | 'contains'
  // List
  | 'inList'
  | 'notInList'
  // Numeric
  | 'minValue'
  | 'maxValue'
  | 'valueRange'
  // Custom
  | 'customRegex';

/**
 * Human-readable labels for rule types (French)
 */
export const RULE_TYPE_LABELS: Record<NaturalRuleType, string> = {
  required: 'Champ obligatoire',
  optional: 'Champ optionnel',
  minLength: 'Longueur minimale',
  maxLength: 'Longueur maximale',
  exactLength: 'Longueur exacte',
  alphanumeric: 'Alphanumerique',
  alphaOnly: 'Lettres uniquement',
  numericOnly: 'Chiffres uniquement',
  uppercase: 'Majuscules uniquement',
  email: 'Format email',
  phone: 'Format telephone',
  forbiddenPatterns: 'Motifs interdits',
  forbiddenValues: 'Valeurs interdites',
  notPlaceholder: 'Pas de donnees fictives',
  dateNotFuture: 'Date non future',
  dateAfter: 'Date apres',
  dateBefore: 'Date avant',
  dateRange: 'Plage de dates',
  dateNotExpired: 'Date non expiree',
  startsWith: 'Commence par',
  endsWith: 'Se termine par',
  contains: 'Contient',
  inList: 'Dans la liste',
  notInList: 'Hors de la liste',
  minValue: 'Valeur minimale',
  maxValue: 'Valeur maximale',
  valueRange: 'Plage de valeurs',
  customRegex: 'Expression reguliere'
};

/**
 * A single rule condition in natural language format
 */
export interface RuleCondition {
  type: NaturalRuleType;
  value?: string | number;
  values?: string[];
  min?: string | number;
  max?: string | number;
  message?: string;
  optional?: boolean;
}

// ===== VALIDATION RULE =====

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  field: string;
  fieldLabel?: string;
  clientType: '1' | '2' | '3' | null; // 1=Particulier, 2=Entreprise, 3=Institutionnel, null=All
  ruleType: 'required' | 'format' | 'date' | 'custom';
  /** Natural language rule conditions (JSON) */
  ruleDefinition: RuleCondition[];
  errorMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isActive: boolean;
  category: string;
  priority?: number;
}

// ===== VALIDATION RESULT =====

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  ruleId: string;
  field: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  value?: unknown;
}

export interface ValidationWarning {
  ruleId: string;
  field: string;
  message: string;
  value?: unknown;
}

// ===== CLIENT RECORD =====

export interface ClientRecord {
  cli: string;
  nom: string;
  tcli: string;
  pre?: string;
  sext?: string;
  dna?: string;
  nid?: string;
  nmer?: string;
  nrc?: string;
  datc?: string;
  rso?: string;
  sig?: string;
  age?: string;
  nat?: string;
  res?: string;
  vid?: string;
  viln?: string;
  depn?: string;
  payn?: string;
  locn?: string;
  tid?: string;
  did?: string;
  lid?: string;
  oid?: string;
  sit?: string;
  reg?: string;
  capj?: string;
  dcapj?: string;
  sitj?: string;
  dsitj?: string;
  tconj?: string;
  conj?: string;
  nbenf?: number;
  clifam?: string;
  fju?: string;
  vrc?: string;
  nchc?: string;
  npa?: string;
  vpa?: string;
  nidn?: string;
  nis?: string;
  nidf?: string;
  grp?: string;
  sgrp?: string;
  met?: string;
  smet?: string;
  cmc1?: string;
  cmc2?: string;
  ges?: string;
  qua?: string;
  tax?: string;
  catl?: string;
  seg?: string;
  nst?: string;
  clipar?: string;
  chl1?: string;
  chl2?: string;
  chl3?: string;
  lter?: string;
  lterc?: string;
  resd?: string;
  catn?: string;
  sec?: string;
  lienbq?: string;
  aclas?: string;
  maclas?: number;
  emtit?: string;
  nicr?: string;
  ced?: string;
  clcr?: string;
  lang?: string;
  ichq?: string;
  dichq?: string;
  icb?: string;
  dicb?: string;
  epu?: string;
  utic?: string;
  uti?: string;
  dou?: string;
  dmo?: string;
  ord?: number;
  catr?: string;
  midname?: string;
  nomrest?: string;
  drc?: string;
  lrc?: string;
  rso2?: string;
  regn?: string;
  rrc?: string;
  dvrrc?: string;
  uti_vrrc?: string;
  idext?: string;
  sitimmo?: string;
  opetr?: string;
  fatca_status?: string;
  fatca_date?: string;
  fatca_uti?: string;
  crs_status?: string;
  crs_date?: string;
  crs_uti?: string;
  pre3?: string;
}

// ===== FIELD METADATA =====

export const FIELD_LABELS: Record<string, string> = {
  nom: 'Nom',
  pre: 'Prenom',
  nid: "Numero d'identite",
  dna: 'Date de naissance',
  nat: 'Nationalite',
  sext: 'Sexe',
  viln: 'Ville de naissance',
  payn: 'Pays de naissance',
  tid: "Type de piece d'identite",
  vid: 'Date validite piece',
  nrc: 'Numero Registre Commerce',
  rso: 'Raison sociale',
  fju: 'Forme juridique',
  datc: 'Date de creation',
  age: 'Code agence',
  nmer: 'Nom de la mere',
  sig: 'Sigle',
  cli: 'Code client',
  tcli: 'Type client',
  sec: "Secteur d'activite",
  catn: 'Categorie Banque Centrale',
  lienbq: 'Lien avec la banque'
};

export const CLIENT_TYPE_LABELS: Record<string, string> = {
  '1': 'Particulier',
  '2': 'Entreprise',
  '3': 'Institutionnel'
};

export const SEVERITY_LABELS: Record<string, string> = {
  critical: 'Critique',
  high: 'Haute',
  medium: 'Moyenne',
  low: 'Basse'
};
