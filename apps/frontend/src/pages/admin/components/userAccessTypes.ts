// ── Shared Types for UserAccess ─────────────────────────────────

export interface Structure {
  id: number;
  code: string;
  name: string;
  type: string;
  parentId: number | null;
  parentName: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppProfile {
  id: number;
  code: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: number;
  dateFrom: string;
  dateTo: string | null;
  status: string;
  userId: number;
  username: string;
  userFullName: string;
  profileId: number | null;
  profileCode: string | null;
  profileName: string | null;
  structureId: number;
  structureCode: string;
  structureName: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserOption {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
}

export type Tab = 'assignments' | 'structures' | 'profiles';
