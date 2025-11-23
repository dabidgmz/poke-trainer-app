// Servicio de autenticación para la API de entrenadores
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  gender?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  gender?: string;
  role: 'entrenador' | 'profesor';
  isVerified: boolean;
  isBanned: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginResponse {
  type: string;
  token: string;
  user: User;
}

export interface LoginResponse2FA {
  message: string;
  requiresCode: boolean;
  user: User;
}

export interface VerifyCodeData {
  email: string;
  code: string;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
  phone?: string;
  gender?: string;
}

class AuthService {
  private tokenKey = 'pokemon_jwt_token';

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  removeToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private getAuthHeaders(): HeadersInit {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async register(data: RegisterData): Promise<{ message: string; userId: number }> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error en el registro');
    }

    return response.json();
  }

  async login(data: LoginData): Promise<LoginResponse | LoginResponse2FA> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error en el login');
    }

    const result = await response.json();
    
    if (result.token) {
      this.setToken(result.token);
    }

    return result;
  }

  async getProfile(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.removeToken();
        throw new Error('No autenticado');
      }
      const error = await response.json();
      throw new Error(error.message || 'Error al obtener el perfil');
    }

    return response.json();
  }

  async getTeam(): Promise<{ team: any[]; teamCount: number; maxTeamSize: number }> {
    const response = await fetch(`${API_BASE_URL}/entrenadores/me/team`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.removeToken();
        throw new Error('No autenticado');
      }
      if (response.status === 403) {
        throw new Error('Este endpoint es solo para entrenadores');
      }
      const error = await response.json();
      throw new Error(error.message || 'Error al obtener el equipo');
    }

    return response.json();
  }

  async updateProfile(id: number, data: UpdateProfileData): Promise<{ message: string; entrenador: User }> {
    const response = await fetch(`${API_BASE_URL}/entrenadores/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.removeToken();
        throw new Error('No autenticado');
      }
      const error = await response.json();
      throw new Error(error.message || 'Error al actualizar el perfil');
    }

    return response.json();
  }

  async logout(): Promise<{ message: string }> {
    const token = this.getToken();
    
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
        });
      } catch (error) {
        console.error('Error al cerrar sesión en el servidor:', error);
      }
    }

    this.removeToken();
    return { message: 'Sesión cerrada exitosamente' };
  }

  async verifyCode(data: VerifyCodeData): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al verificar el código');
    }

    const result = await response.json();
    
    if (result.token) {
      this.setToken(result.token);
    }

    return result;
  }

  async resendCode(email: string): Promise<{ message: string; expiresIn: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/resend-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al reenviar el código');
    }

    return response.json();
  }

  async verifyEmail(data: VerifyCodeData): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al verificar el email');
    }

    return response.json();
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al reenviar el email de verificación');
    }

    return response.json();
  }
}

export default new AuthService();
