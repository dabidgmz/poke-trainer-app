// Servicio de caché offline para guardar datos del equipo y perfil
class OfflineCache {
  private teamKey = 'pokemon_team_cache';
  private profileKey = 'pokemon_profile_cache';
  private cacheTimestampKey = 'pokemon_cache_timestamp';
  private cacheExpiry = 24 * 60 * 60 * 1000; // 24 horas en milisegundos

  // Guardar equipo en caché
  saveTeam(teamData: any): void {
    try {
      const cacheData = {
        data: teamData,
        timestamp: Date.now()
      };
      localStorage.setItem(this.teamKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error guardando equipo en caché:', error);
    }
  }

  // Obtener equipo del caché
  getTeam(): any | null {
    try {
      const cached = localStorage.getItem(this.teamKey);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      const now = Date.now();
      
      // Verificar si el caché ha expirado
      if (now - cacheData.timestamp > this.cacheExpiry) {
        localStorage.removeItem(this.teamKey);
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.error('Error obteniendo equipo del caché:', error);
      return null;
    }
  }

  // Guardar perfil en caché
  saveProfile(profileData: any): void {
    try {
      const cacheData = {
        data: profileData,
        timestamp: Date.now()
      };
      localStorage.setItem(this.profileKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error guardando perfil en caché:', error);
    }
  }

  // Obtener perfil del caché
  getProfile(): any | null {
    try {
      const cached = localStorage.getItem(this.profileKey);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      const now = Date.now();
      
      // Verificar si el caché ha expirado
      if (now - cacheData.timestamp > this.cacheExpiry) {
        localStorage.removeItem(this.profileKey);
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.error('Error obteniendo perfil del caché:', error);
      return null;
    }
  }

  // Limpiar todo el caché
  clearCache(): void {
    localStorage.removeItem(this.teamKey);
    localStorage.removeItem(this.profileKey);
    localStorage.removeItem(this.cacheTimestampKey);
  }

  // Verificar si hay conexión a internet
  isOnline(): boolean {
    return navigator.onLine;
  }
}

export default new OfflineCache();

