import { apiRequest } from './apiService';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: {
      id: number;
      username: string;
      email: string;
      role: string;
      agencyCode: string | null;
      firstName: string;
      lastName: string;
    };
  };
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  agencyCode: string | null;
  firstName: string;
  lastName: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiRequest<LoginResponse>(
      '/api/auth/login',
      'POST',
      credentials
    );

    if (response.success && response.data) {
      this.setToken(response.data.token);
      this.setUser(response.data.user);
    }

    return response;
  }

  async changePassword(request: ChangePasswordRequest): Promise<{ success: boolean; message: string }> {
    const response = await apiRequest<{ success: boolean; message: string }>(
      '/api/auth/change-password',
      'POST',
      request
    );
    return response;
  }

  async refreshToken(): Promise<boolean> {
    try {
      const response = await apiRequest<LoginResponse>('/api/auth/refresh', 'POST');
      if (response.success && response.data) {
        this.setToken(response.data.token);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch (error) {
      return null;
    }
  }

  setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  hasRole(role: string): boolean {
    const user = this.getUser();
    return user?.role === role;
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.getUser();
    return user ? roles.includes(user.role) : false;
  }

  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  isAuditor(): boolean {
    return this.hasRole('AUDITOR');
  }

  isAgencyUser(): boolean {
    return this.hasRole('AGENCY_USER');
  }
}

export const authService = new AuthService();
