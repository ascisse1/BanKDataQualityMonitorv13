export interface User {
  id: string | number;
  username: string;
  email: string;
  role: 'ADMIN' | 'AUDITOR' | 'USER' | 'AGENCY_USER';
  lastLogin: string;
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  createdAt: string;
  fullName: string;
  department?: string;
  structureCodes?: string[];
}

export interface UserStats {
  total: number;
  active: number;
  admins: number;
  agency_users: number;
  recent_logins: number;
  agencies_with_users: number;
}

export interface Agency {
  code_agence: string;
  lib_agence: string;
}
