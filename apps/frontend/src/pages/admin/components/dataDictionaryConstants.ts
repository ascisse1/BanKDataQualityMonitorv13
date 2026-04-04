export type Tab = 'tables' | 'fields' | 'nomenclatures';

export type AddToastFn = (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;

export const DATA_TYPES = ['CHAR', 'VARCHAR', 'INTEGER', 'SMALLINT', 'DECIMAL', 'DATE', 'DATETIME', 'BOOLEAN'] as const;

export const FIELD_GROUPS = [
  'identity', 'document', 'family', 'legal', 'enterprise',
  'classification', 'management', 'regulatory', 'restrictions', 'audit', 'custom',
] as const;

export const FIELD_GROUP_LABELS: Record<string, string> = {
  identity: 'Identite',
  document: 'Documents',
  family: 'Famille',
  legal: 'Juridique',
  enterprise: 'Entreprise',
  classification: 'Classification',
  management: 'Gestion',
  regulatory: 'Reglementaire',
  restrictions: 'Restrictions',
  audit: 'Audit',
  custom: 'Personnalise',
};

export const hasLengthField = (dt: string) => ['CHAR', 'VARCHAR'].includes(dt);
export const hasPrecisionField = (dt: string) => dt === 'DECIMAL';

export const formatDate = (iso: string | null) => {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
};
