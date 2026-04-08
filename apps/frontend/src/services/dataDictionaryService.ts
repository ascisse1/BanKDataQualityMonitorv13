import { apiRequest } from './apiService';

const DD_BASE = '/admin/data-dictionary';
const NOM_BASE = '/admin/nomenclatures';

// ===== Types =====

export interface CbsTableFilter {
  column: string;
  operator: 'EQUALS' | 'NOT_EQUALS' | 'IN' | 'NOT_IN' | 'IS_NULL' | 'IS_NOT_NULL' | 'GREATER_THAN' | 'LESS_THAN';
  value?: string;
  values?: string[];
}

export interface CbsTable {
  id: number;
  tableName: string;
  displayName: string;
  description: string;
  schemaName: string;
  cbsVersion: string;
  primaryKeyColumns: string;
  syncEnabled: boolean;
  syncOrder: number;
  dataFilters: string | null;
  active: boolean;
  fieldCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CbsField {
  id: number;
  cbsTableId: number;
  tableName: string;
  columnName: string;
  displayLabel: string;
  description: string;
  queryAlias: string;
  dataType: string;
  maxLength: number | null;
  precisionValue: number | null;
  scaleValue: number | null;
  isPrimaryKey: boolean;
  isRequired: boolean;
  isUpdatable: boolean;
  nomenclatureCtab: string | null;
  nomenclatureDescription: string | null;
  enumValues: string | null;
  applicableClientTypes: string | null;
  displayOrder: number;
  fieldGroup: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NomenclatureType {
  id: number;
  ctab: string;
  name: string;
  displayName: string;
  description: string;
  syncEnabled: boolean;
  active: boolean;
  entryCount: number | null;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NomenclatureEntry {
  id: number;
  ctab: string;
  cacc: string;
  age: string;
  lib1: string;
  lib2: string;
  lib3: string;
  lib4: string;
  lib5: string;
  mnt1: number | null;
  active: boolean;
  lastSyncedAt: string | null;
}

export interface NomenclatureSyncResult {
  ctab: string;
  nomenclatureName: string;
  inserted: number;
  updated: number;
  deleted: number;
  errors: number;
  syncedAt: string;
  durationMs: number;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// ===== Data Dictionary Service =====

export const dataDictionaryService = {
  // Tables
  getTables: () => apiRequest<ApiResponse<CbsTable[]>>(`${DD_BASE}/tables`),
  getTable: (id: number) => apiRequest<ApiResponse<CbsTable>>(`${DD_BASE}/tables/${id}`),
  createTable: (data: Partial<CbsTable>) => apiRequest<ApiResponse<CbsTable>>(`${DD_BASE}/tables`, 'POST', data),
  updateTable: (id: number, data: Partial<CbsTable>) => apiRequest<ApiResponse<CbsTable>>(`${DD_BASE}/tables/${id}`, 'PUT', data),
  deleteTable: (id: number) => apiRequest<ApiResponse<void>>(`${DD_BASE}/tables/${id}`, 'DELETE'),

  // Fields
  getFields: (tableId: number) => apiRequest<ApiResponse<CbsField[]>>(`${DD_BASE}/tables/${tableId}/fields`),
  getFieldsByName: (tableName: string) => apiRequest<ApiResponse<CbsField[]>>(`${DD_BASE}/tables/by-name/${tableName}/fields`),
  createField: (tableId: number, data: Partial<CbsField>) => apiRequest<ApiResponse<CbsField>>(`${DD_BASE}/tables/${tableId}/fields`, 'POST', data),
  updateField: (id: number, data: Partial<CbsField>) => apiRequest<ApiResponse<CbsField>>(`${DD_BASE}/fields/${id}`, 'PUT', data),
  deleteField: (id: number) => apiRequest<ApiResponse<void>>(`${DD_BASE}/fields/${id}`, 'DELETE'),

  // Nomenclature types
  getNomenclatureTypes: () => apiRequest<ApiResponse<NomenclatureType[]>>(`${NOM_BASE}/types`),
  createNomenclatureType: (data: Partial<NomenclatureType>) => apiRequest<ApiResponse<NomenclatureType>>(`${NOM_BASE}/types`, 'POST', data),
  updateNomenclatureType: (id: number, data: Partial<NomenclatureType>) => apiRequest<ApiResponse<NomenclatureType>>(`${NOM_BASE}/types/${id}`, 'PUT', data),
  deleteNomenclatureType: (id: number) => apiRequest<ApiResponse<void>>(`${NOM_BASE}/types/${id}`, 'DELETE'),

  // Nomenclature entries
  getEntries: (ctab: string) => apiRequest<ApiResponse<NomenclatureEntry[]>>(`${NOM_BASE}/types/${ctab}/entries`),
  searchEntries: (ctab: string, query: string) => apiRequest<ApiResponse<NomenclatureEntry[]>>(`${NOM_BASE}/types/${ctab}/entries/search?q=${encodeURIComponent(query)}`),

  // Sync
  syncAllNomenclatures: () => apiRequest<ApiResponse<NomenclatureSyncResult[]>>(`${NOM_BASE}/sync`, 'POST'),
  syncNomenclature: (ctab: string) => apiRequest<ApiResponse<NomenclatureSyncResult>>(`${NOM_BASE}/sync/${ctab}`, 'POST'),
};

// ===== Nomenclature Lookup Service (read-only, for all authenticated users) =====

export const nomenclatureLookupService = {
  getValues: (ctab: string) => apiRequest<ApiResponse<NomenclatureEntry[]>>(`/nomenclatures/${ctab}/values`),
  lookup: (ctab: string, cacc: string) => apiRequest<ApiResponse<{ cacc: string; label: string }>>(`/nomenclatures/${ctab}/lookup/${cacc}`),
};
