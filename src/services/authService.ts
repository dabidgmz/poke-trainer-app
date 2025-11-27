// Servicio de autenticación para la API de entrenadores
import offlineCache from './offlineCache';

// ============================================
// CONFIGURACIÓN DE ENTORNO
// ============================================
// Para cambiar entre desarrollo y producción, comenta/descomenta las líneas:

// DESARROLLO (localhost)
// const API_BASE_URL_DEV = 'http://127.0.0.1:3333';

// PRODUCCIÓN
// const API_BASE_URL_PROD = 'https://jrctesthub.live';

// Selecciona el entorno activo (comenta/descomenta según necesites):
// const API_BASE_URL_MANUAL = API_BASE_URL_DEV;  // ← DESARROLLO (descomentado)
const API_BASE_URL_MANUAL = API_BASE_URL_PROD;  // ← PRODUCCIÓN (comentado)

// ============================================
// Alternativamente, puedes usar variables de entorno:
// Si existe VITE_API_URL, se usará esa URL
// ============================================
const getBaseUrl = () => {
  // Si hay una variable de entorno, usarla
  if (import.meta.env.VITE_API_URL) {
    const url = import.meta.env.VITE_API_URL;
    return url.endsWith('/') ? url.slice(0, -1) : url;
  }
  // Si no, usar la configuración manual de arriba
  return API_BASE_URL_MANUAL;
};

const API_BASE_URL = getBaseUrl();

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
    try {
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

      const profileData = await response.json();
      // Guardar en caché cuando se obtiene exitosamente (backup en localStorage)
      offlineCache.saveProfile(profileData);
      return profileData;
    } catch (error: any) {
      // Si falla la conexión, intentar obtener del caché del service worker
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        if ('caches' in window) {
          try {
            const cache = await caches.open('pokemon-profile-cache');
            const cachedResponse = await cache.match(`${API_BASE_URL}/auth/me`);
            if (cachedResponse) {
              const profileData = await cachedResponse.json();
              return profileData;
            }
          } catch (cacheError) {
            console.error('Error obteniendo del caché del service worker:', cacheError);
          }
        }
        // Fallback a localStorage
        const cachedProfile = offlineCache.getProfile();
        if (cachedProfile) {
          return cachedProfile;
        }
      }
      throw error;
    }
  }

  async getTeam(): Promise<{ team: any[]; teamCount: number; maxTeamSize: number }> {
    try {
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
        const error = await response.json().catch(() => ({ message: 'Error al obtener el equipo' }));
        throw new Error(error.message || 'Error al obtener el equipo');
      }

      const teamData = await response.json();
      // Guardar en caché cuando se obtiene exitosamente (backup en localStorage)
      offlineCache.saveTeam(teamData);
      return teamData;
    } catch (error: any) {
      // Si falla la conexión, intentar obtener del caché del service worker
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        if ('caches' in window) {
          try {
            const cache = await caches.open('pokemon-team-cache');
            const cachedResponse = await cache.match(`${API_BASE_URL}/entrenadores/me/team`);
            if (cachedResponse) {
              const teamData = await cachedResponse.json();
              return teamData;
            }
          } catch (cacheError) {
            console.error('Error obteniendo del caché del service worker:', cacheError);
          }
        }
        // Fallback a localStorage
        const cachedTeam = offlineCache.getTeam();
        if (cachedTeam) {
          return cachedTeam;
        }
        throw new Error(`No se pudo conectar con la API. Verifica que el servidor esté corriendo en ${API_BASE_URL}`);
      }
      throw error;
    }
  }

  async getPC(): Promise<{ box1: any[]; box2: any[]; box3: any[]; counts: { box1: number; box2: number; box3: number; total: number } }> {
    try {
      const response = await fetch(`${API_BASE_URL}/entrenadores/me/pc`, {
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
        const error = await response.json().catch(() => ({ message: 'Error al obtener el PC' }));
        throw new Error(error.message || 'Error al obtener el PC');
      }

      return response.json();
    } catch (error: any) {
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        throw new Error(`No se pudo conectar con la API. Verifica que el servidor esté corriendo en ${API_BASE_URL}`);
      }
      throw error;
    }
  }

  async movePokemon(pokemonId: number, location: 'team' | 'pc', pcBox?: number): Promise<{ message: string; pokemon: any }> {
    try {
      const body: any = { location };
      if (location === 'pc' && pcBox) {
        body.pcBox = pcBox;
      }

      const response = await fetch(`${API_BASE_URL}/entrenadores/me/pokemon/${pokemonId}/move`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.removeToken();
          throw new Error('No autenticado');
        }
        if (response.status === 403) {
          throw new Error('Este endpoint es solo para entrenadores');
        }
        const error = await response.json().catch(() => ({ message: 'Error al mover el Pokémon' }));
        throw new Error(error.message || 'Error al mover el Pokémon');
      }

      return response.json();
    } catch (error: any) {
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        throw new Error(`No se pudo conectar con la API. Verifica que el servidor esté corriendo en ${API_BASE_URL}`);
      }
      throw error;
    }
  }

  async scanPokemon(pokemonId: number, pcBox?: number): Promise<{
    captureId: number;
    placement?: 'team' | 'pc';
    pcBox?: number;
    pokemonInstanceId?: number;
    requiresBoxSelection?: boolean;
    pokemon: {
      id: number;
      pokeapiId: number;
      name: string;
      spriteUrl: string | null;
      types: string[];
      rarity: 'common' | 'rare' | 'legendary';
    };
  }> {
    try {
      const body: any = { pokemonId };
      if (pcBox !== undefined) {
        body.pcBox = pcBox;
      }

      const response = await fetch(`${API_BASE_URL}/captures/scan`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.removeToken();
          throw new Error('No autenticado');
        }
        if (response.status === 403) {
          throw new Error('Este endpoint es solo para entrenadores');
        }
        const error = await response.json().catch(() => ({ message: 'Error al escanear el Pokémon' }));
        throw new Error(error.message || 'Error al escanear el Pokémon');
      }

      return response.json();
    } catch (error: any) {
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        throw new Error(`No se pudo conectar con la API. Verifica que el servidor esté corriendo en ${API_BASE_URL}`);
      }
      throw error;
    }
  }

  async confirmCapture(captureId: number, pcBox: number): Promise<{
    pokemonInstanceId: number;
    placement: 'pc';
    pcBox: number;
    pokemon: {
      id: number;
      pokeapiId: number;
      name: string;
      spriteUrl: string | null;
      types: string[];
      rarity: 'common' | 'rare' | 'legendary';
    };
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/captures/confirm`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ captureId, pcBox }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.removeToken();
          throw new Error('No autenticado');
        }
        if (response.status === 403) {
          throw new Error('Este endpoint es solo para entrenadores');
        }
        const error = await response.json().catch(() => ({ message: 'Error al confirmar la captura' }));
        throw new Error(error.message || 'Error al confirmar la captura');
      }

      return response.json();
    } catch (error: any) {
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        throw new Error(`No se pudo conectar con la API. Verifica que el servidor esté corriendo en ${API_BASE_URL}`);
      }
      throw error;
    }
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
