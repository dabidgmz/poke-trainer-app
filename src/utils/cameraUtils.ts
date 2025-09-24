import { Camera, PermissionStatus } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export interface CameraPermissionResult {
  granted: boolean;
  error?: string;
  permission?: PermissionStatus;
}

export class CameraUtils {
  /**
   * Solicita permisos de cámara de manera robusta
   */
  static async requestCameraPermissions(): Promise<CameraPermissionResult> {
    try {
      // Verificar si estamos en una plataforma nativa
      if (Capacitor.isNativePlatform()) {
        return await this.requestNativePermissions();
      } else {
        return await this.requestWebPermissions();
      }
    } catch (error: any) {
      console.error('Error solicitando permisos de cámara:', error);
      return {
        granted: false,
        error: error.message || 'Error desconocido al solicitar permisos'
      };
    }
  }

  /**
   * Solicita permisos en plataforma nativa (Android/iOS)
   */
  private static async requestNativePermissions(): Promise<CameraPermissionResult> {
    try {
      // Verificar permisos actuales
      const currentPermissions = await Camera.checkPermissions();
      
      if (currentPermissions.camera === 'granted') {
        return {
          granted: true,
          permission: currentPermissions
        };
      }

      // Solicitar permisos si no están concedidos
      const permissions = await Camera.requestPermissions();
      
      return {
        granted: permissions.camera === 'granted',
        permission: permissions,
        error: permissions.camera === 'denied' ? 'Permisos de cámara denegados' : undefined
      };
    } catch (error: any) {
      return {
        granted: false,
        error: `Error en permisos nativos: ${error.message}`
      };
    }
  }

  /**
   * Solicita permisos en web
   */
  private static async requestWebPermissions(): Promise<CameraPermissionResult> {
    try {
      // Verificar si getUserMedia está disponible
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return {
          granted: false,
          error: 'Tu navegador no soporta acceso a la cámara'
        };
      }

      // Verificar si estamos en HTTPS o localhost
      const isSecure = window.location.protocol === 'https:' || 
                       window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1';
      
      if (!isSecure) {
        return {
          granted: false,
          error: 'La cámara web requiere HTTPS o localhost'
        };
      }

      // Solicitar acceso a la cámara
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });

      // Cerrar el stream inmediatamente ya que solo queríamos los permisos
      stream.getTracks().forEach(track => track.stop());

      return {
        granted: true
      };
    } catch (error: any) {
      let errorMessage = 'Error al acceder a la cámara';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Permisos de cámara denegados';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No se encontró ninguna cámara';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'La cámara está siendo usada por otra aplicación';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        granted: false,
        error: errorMessage
      };
    }
  }

  /**
   * Obtiene un stream de video con configuración optimizada
   */
  static async getVideoStream(): Promise<MediaStream | null> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia no está disponible');
      }

      // Intentar con configuración preferida
      try {
        return await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
      } catch (preferredError) {
        console.warn('Error con configuración preferida, intentando fallback:', preferredError);
        
        // Fallback con configuración básica
        return await navigator.mediaDevices.getUserMedia({
          video: true
        });
      }
    } catch (error: any) {
      console.error('Error obteniendo stream de video:', error);
      throw error;
    }
  }

  /**
   * Limpia un stream de video de manera segura
   */
  static cleanupVideoStream(stream: MediaStream | null): void {
    if (stream) {
      try {
        stream.getTracks().forEach(track => {
          track.stop();
          console.log('Track detenido:', track.kind);
        });
      } catch (error) {
        console.error('Error limpiando stream:', error);
      }
    }
  }

  /**
   * Verifica si la cámara está disponible
   */
  static async isCameraAvailable(): Promise<boolean> {
    try {
      if (Capacitor.isNativePlatform()) {
        const permissions = await Camera.checkPermissions();
        return permissions.camera === 'granted';
      } else {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          return false;
        }
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.some(device => device.kind === 'videoinput');
      }
    } catch (error) {
      console.error('Error verificando disponibilidad de cámara:', error);
      return false;
    }
  }
}
