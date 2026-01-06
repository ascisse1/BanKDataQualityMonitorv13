export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  field: string;
  clientType: '1' | '2' | '3'; // 1=Particulier, 2=Entreprise, 3=Institutionnel
  ruleType: 'required' | 'format' | 'length' | 'date' | 'custom';
  condition: string;
  errorMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isActive: boolean;
  category: string;
}

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
  value?: any;
}

export interface ValidationWarning {
  ruleId: string;
  field: string;
  message: string;
  value?: any;
}

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
  vid?: string; // Date d'expiration de la pièce d'identité
  // Autres champs selon le dictionnaire de données
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