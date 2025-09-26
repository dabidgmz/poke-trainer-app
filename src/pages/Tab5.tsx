// src/pages/Tab5.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonList, IonItem, IonLabel, IonText, IonCard, IonCardContent,
  IonFab, IonFabButton, IonIcon, IonAlert, IonSpinner
} from '@ionic/react';
import { alertController } from '@ionic/core';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { fingerPrint, download, phonePortrait, warning } from 'ionicons/icons';

import { NativeBiometric, BiometryType } from '@capgo/capacitor-native-biometric';

type BiometryTypeEntry = { title: string; type: number };

const BIOMETRY_TYPES: BiometryTypeEntry[] = [
  { title: 'None', type: BiometryType.NONE },
  { title: 'Touch ID', type: BiometryType.TOUCH_ID },
  { title: 'Face ID', type: BiometryType.FACE_ID },
  { title: 'Fingerprint', type: BiometryType.FINGERPRINT },
];

const Tab5: React.FC = () => {
  const [biometry, setBiometry] = useState({
    isAvailable: false,
    biometryType: BiometryType.NONE,
    reason: '',
  });

  const [message, setMessage] = useState('');
  const [permissionStatus, setPermissionStatus] = useState('No verificado');
  const [isLoading, setIsLoading] = useState(false);
  const [showPWAAlert, setShowPWAAlert] = useState(false);
  const [passkeyCreated, setPasskeyCreated] = useState(false);
  const [currentPasskey, setCurrentPasskey] = useState<any>(null);

  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();
  const isIOS = platform === 'ios';
  const isAndroid = platform === 'android';

  // Detección mejorada de PWA
  const isPWA = useMemo(() => {
    return !isNative && 
           (window.matchMedia('(display-mode: standalone)').matches || 
            (window.navigator as any).standalone ||
            document.referrer.includes('android-app://'));
  }, [isNative]);

  const biometryName = useMemo(() => {
    if (biometry.biometryType === BiometryType.FACE_ID) return 'Face ID';
    if (biometry.biometryType === BiometryType.TOUCH_ID) return 'Touch ID';
    if (biometry.biometryType === BiometryType.FINGERPRINT) return 'Fingerprint';
    return 'No biometry';
  }, [biometry]);

  const updateBiometryInfo = (info: any) => setBiometry(info);

  const showAlert = async (message: string) => {
    const alert = await alertController.create({
      header: `${biometryName} says:`,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  };

  const showErrorAlert = async (error: any) => {
    await showAlert(`${error.message || error} [${error.code || 'unknown'}].`);
  };

  // Generar challenge aleatorio para WebAuthn
  const generateRandomChallenge = (): ArrayBuffer => {
    const length = 32;
    const randomValues = new Uint8Array(length);
    window.crypto.getRandomValues(randomValues);
    return randomValues.buffer;
  };

  // Verificar disponibilidad de WebAuthn para PWA
  const checkWebAuthnSupport = async (): Promise<boolean> => {
    if (!window.PublicKeyCredential) {
      return false;
    }
    
    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch (error) {
      console.log('WebAuthn no disponible:', error);
      return false;
    }
  };

  // Crear Passkey con WebAuthn
  const createPasskey = async (): Promise<boolean> => {
    try {
      if (!navigator.credentials || !navigator.credentials.create || !navigator.credentials.get) {
        throw new Error('Tu navegador no soporta la API de Autenticación Web');
      }

      // Verificar que estamos en HTTPS o localhost
      if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        throw new Error('WebAuthn requiere HTTPS. Usa la app nativa o accede desde https://pokeapptrainer.web.app/');
      }

      // Verificar disponibilidad de autenticadores
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) {
        throw new Error('No hay autenticadores biométricos disponibles en este dispositivo');
      }

      const credentials = await navigator.credentials.create({
        publicKey: {
          challenge: generateRandomChallenge(),
          rp: { 
            name: "Pokémon Trainer", 
            id: window.location.hostname 
          },
          user: { 
            id: new Uint8Array(16), 
            name: "trainer@pokemon.com", 
            displayName: "Pokémon Trainer"
          },
          pubKeyCredParams: [
            { type: "public-key", alg: -7 },
            { type: "public-key", alg: -257 }
          ],
          timeout: 30000, // Reducido de 60s a 30s
          authenticatorSelection: {
            residentKey: "discouraged", // Cambiado de "preferred" a "discouraged"
            requireResidentKey: false, 
            userVerification: "required" // Cambiado de "preferred" a "required"
          },
          attestation: "none"
        }
      });

      setCurrentPasskey(credentials);
      setPasskeyCreated(true);
      setMessage('Passkey creado exitosamente');
      return true;
    } catch (error: any) {
      console.error('Error creando passkey:', error);
      
      // Mensajes de error más específicos
      let errorMessage = error.message;
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Operación cancelada o no permitida. Asegúrate de usar HTTPS y tener biometría configurada.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'WebAuthn no soportado en este navegador o dispositivo.';
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Error de seguridad. Usa HTTPS o la app nativa.';
      } else if (error.name === 'TimeoutError') {
        errorMessage = 'Tiempo agotado. Intenta nuevamente.';
      }
      
      setMessage(`Error creando passkey: ${errorMessage}`);
      return false;
    }
  };

  // Verificar Passkey con WebAuthn
  const verifyPasskey = async (): Promise<boolean> => {
    try {
      if (!currentPasskey) {
        throw new Error('No hay passkey creado');
      }

      // Verificar que estamos en HTTPS o localhost
      if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        throw new Error('WebAuthn requiere HTTPS. Usa la app nativa o accede desde https://pokeapptrainer.web.app/');
      }

      const credentials = await navigator.credentials.get({
        publicKey: {
          challenge: generateRandomChallenge(),
          allowCredentials: [{ 
            type: "public-key", 
            id: currentPasskey.rawId 
          }],
          timeout: 30000,
          userVerification: "required"
        }
      });

      setMessage('Autenticación biométrica exitosa con WebAuthn!');
      return true;
    } catch (error: any) {
      console.error('Error verificando passkey:', error);
      
      // Mensajes de error más específicos
      let errorMessage = error.message;
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Autenticación cancelada o no permitida.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'WebAuthn no soportado en este navegador.';
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Error de seguridad. Usa HTTPS.';
      } else if (error.name === 'TimeoutError') {
        errorMessage = 'Tiempo agotado. Intenta nuevamente.';
      }
      
      setMessage(`Error en autenticación: ${errorMessage}`);
      return false;
    }
  };

  // Verificar permisos biométricos
  const checkBiometricAvailability = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('[Biometric] Verificando plataforma:', {
        isNative,
        platform,
        isPWA,
        userAgent: navigator.userAgent
      });

      // Si es PWA, mostrar mensaje específico
      if (isPWA) {
        const hasWebAuthn = await checkWebAuthnSupport();
        const isHTTPS = location.protocol === 'https:';
        
        setBiometry({
          isAvailable: false,
          biometryType: BiometryType.NONE,
          reason: `PWA - ${isHTTPS ? 'WebAuthn disponible' : 'Requiere HTTPS'}`
        });
        
        if (!isHTTPS) {
          setMessage('WebAuthn requiere HTTPS. Accede desde https://pokeapptrainer.web.app/');
        } else if (hasWebAuthn) {
          setMessage('WebAuthn disponible. Puedes crear un passkey para autenticación biométrica.');
        } else {
          setMessage('WebAuthn no disponible en este dispositivo. Usa la app nativa.');
        }
        
        setPermissionStatus(`PWA - ${isHTTPS ? 'HTTPS OK' : 'Requiere HTTPS'}`);
        return;
      }

      // Si no es nativo (navegador web normal)
      if (!isNative) {
        const hasWebAuthn = await checkWebAuthnSupport();
        setBiometry({
          isAvailable: false,
          biometryType: BiometryType.NONE,
          reason: 'Navegador web - Solo disponible en app nativa'
        });
        setMessage(hasWebAuthn ? 
          'WebAuthn disponible (configuración requerida)' : 
          'Funcionalidad limitada en navegador'
        );
        setPermissionStatus('Navegador Web');
        return;
      }

      // PLATAFORMA NATIVA - Verificar biometría real
      console.log('[Biometric] Verificando biometría en plataforma nativa...');
      setPermissionStatus('Verificando...');

      try {
        const result = await NativeBiometric.isAvailable();
        console.log('[Biometric] Resultado nativo:', result);
        
        setBiometry({
          isAvailable: result.isAvailable,
          biometryType: result.biometryType,
          reason: ''
        });
        setPermissionStatus(result.isAvailable ? 'Disponible' : 'No disponible');
        
        if (result.isAvailable) {
          setMessage(`${biometryName} configurado y listo`);
        } else {
          setMessage(`Configure ${platform === 'ios' ? 'Face ID/Touch ID' : 'Huella digital'} en ajustes del dispositivo`);
        }
      } catch (error) {
        console.error('[Biometric] Error en plugin nativo:', error);
        setBiometry({
          isAvailable: false,
          biometryType: BiometryType.NONE,
          reason: `Error del plugin: ${error}`
        });
        setPermissionStatus('Error en plugin');
        setMessage('Error al acceder a la biometría nativa');
      }

    } catch (error) {
      console.error('[Biometric] Error general:', error);
      setMessage(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }, [isNative, platform, isPWA, biometryName]);

  // Autenticación biométrica
  const onAuthenticate = async () => {
    // Si es PWA/Web, usar WebAuthn
    if (isPWA || !isNative) {
      if (!passkeyCreated) {
        // Crear passkey primero
        setIsLoading(true);
        const created = await createPasskey();
        setIsLoading(false);
        if (created) {
          await showAlert('Passkey creado. Ahora puedes autenticarte.');
        }
      } else {
        // Verificar passkey
        setIsLoading(true);
        const verified = await verifyPasskey();
        setIsLoading(false);
        if (verified) {
          await showAlert('Autenticación exitosa con WebAuthn!');
        }
      }
      return;
    }

    // Verificar disponibilidad antes de autenticar
    if (!biometry.isAvailable) {
      setMessage('La biometría no está disponible en este dispositivo');
      await showAlert('Configure la biometría en los ajustes de su dispositivo');
      return;
    }

    setIsLoading(true);
    try {
      console.log('[Biometric] Iniciando autenticación...');
      
      await NativeBiometric.verifyIdentity({
        reason: 'Para un inicio de sesión seguro',
        title: 'Autenticación requerida',
        subtitle: 'Verifique su identidad',
        description: 'Use su huella digital, Face ID o Touch ID para continuar',
        maxAttempts: 3,
        useFallback: true,
      });
      
      setMessage('¡Autenticación biométrica exitosa!');
      await showAlert('Autenticación exitosa. Bienvenido.');
      
    } catch (error: any) {
      console.error('[Biometric] Error en autenticación:', error);
      
      // Manejar errores específicos
      if (error.code === 'AUTHENTICATION_FAILED') {
        setMessage('Autenticación fallida. Intente nuevamente.');
      } else if (error.code === 'BIOMETRY_NOT_AVAILABLE') {
        setMessage('Biometría no disponible temporalmente');
      } else if (error.code === 'USER_CANCELED') {
        setMessage('Autenticación cancelada por el usuario');
      } else {
        setMessage(`Error: ${error.message || error}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Efecto inicial
  useEffect(() => {
    const initialize = async () => {
      try {
        await SplashScreen.hide();
      } catch {
        // Ignorar errores de SplashScreen
      }
      await checkBiometricAvailability();
    };

    initialize();
  }, [checkBiometricAvailability]);

  // Información de descarga para nativa
  const getDownloadInfo = () => {
    if (platform === 'ios') {
      return {
        message: 'Descarga desde App Store',
        instructions: 'Busca la app en App Store para obtener todas las funciones biométricas'
      };
    } else if (platform === 'android') {
      return {
        message: 'Descarga desde Play Store', 
        instructions: 'Instala la app desde Play Store para habilitar el sensor de huellas'
      };
    }
    return {
      message: 'Descarga la app nativa',
      instructions: 'Disponible en App Store y Play Store'
    };
  };

  const downloadInfo = getDownloadInfo();

  return (
    <IonPage className="w-full h-full">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Autenticación Biométrica</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onAuthenticate} disabled={isLoading}>
              {isLoading ? <IonSpinner /> : 'Autenticar'}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent scrollY>
        {/* FAB de autenticación */}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={onAuthenticate} disabled={isLoading}>
            {isLoading ? <IonSpinner /> : <IonIcon icon={fingerPrint} />}
          </IonFabButton>
        </IonFab>

        {/* Alerta para PWA */}
        <IonAlert
          isOpen={showPWAAlert}
          onDidDismiss={() => setShowPWAAlert(false)}
          header="Biometría No Disponible en PWA"
          message={`
            <p>La autenticación biométrica completa solo está disponible en la aplicación nativa.</p>
            <p><strong>${downloadInfo.message}</strong></p>
            <p>${downloadInfo.instructions}</p>
          `}
          buttons={[
            {
              text: 'Entendido',
              role: 'cancel'
            }
          ]}
        />

        {/* Tarjeta informativa para PWA/Web */}
        {(isPWA || !isNative) && (
          <IonCard color={passkeyCreated ? "success" : "warning"}>
            <IonCardContent>
              <div className="flex items-start">
                <IonIcon icon={warning} className="text-2xl mr-3 mt-1" />
                <div>
                  <h2 className="font-bold text-lg">
                    {passkeyCreated ? 'WebAuthn Configurado' : 'Versión PWA/Navegador'}
                  </h2>
                  <p className="mt-2">
                    {passkeyCreated 
                      ? 'Passkey creado exitosamente. Puedes autenticarte con biometría web.'
                      : 'Usa WebAuthn como alternativa a la biometría nativa:'
                    }
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>La biometría nativa no está disponible</li>
                    <li>WebAuthn permite autenticación biométrica en navegador</li>
                    <li>Para experiencia completa, descarga la app nativa</li>
                  </ul>
                </div>
              </div>
            </IonCardContent>
          </IonCard>
        )}

        {/* Tarjeta para app nativa */}
        {isNative && biometry.isAvailable && (
          <IonCard color="success">
            <IonCardContent>
              <div className="flex items-start">
                <IonIcon icon={phonePortrait} className="text-2xl mr-3 mt-1" />
                <div>
                  <h2 className="font-bold text-lg">App Nativa Detectada</h2>
                  <p className="mt-2">Todas las funciones biométricas están disponibles</p>
                </div>
              </div>
            </IonCardContent>
          </IonCard>
        )}

        <IonList lines="full" className="mt-4">
          {/* Información de plataforma */}
          <IonItem>
                    <IonLabel>
              <h3>Plataforma</h3>
              <p>{platform} - {isNative ? 'Nativa' : isPWA ? 'PWA' : 'Navegador'}</p>
                    </IonLabel>
                  </IonItem>
                  
          {/* Estado de permisos */}
          <IonItem>
                    <IonLabel>
              <h3>Estado de Permisos</h3>
              <p>{permissionStatus}</p>
                    </IonLabel>
            <IonButton 
              slot="end" 
              fill="outline" 
              onClick={checkBiometricAvailability}
              disabled={isLoading}
            >
              {isLoading ? <IonSpinner /> : 'Actualizar'}
            </IonButton>
                  </IonItem>
                  
          {/* Biometría disponible */}
          <IonItem>
                    <IonLabel>
              <h3>Biometría Disponible</h3>
              <p>
                {isNative 
                  ? (biometry.isAvailable ? biometryName : 'No disponible')
                  : (passkeyCreated ? 'WebAuthn configurado' : 'WebAuthn disponible')
                }
              </p>
                    </IonLabel>
            <IonText slot="end" color={
              isNative 
                ? (biometry.isAvailable ? "success" : "danger")
                : (passkeyCreated ? "success" : "warning")
            }>
              {isNative 
                ? (biometry.isAvailable ? 'Sí' : 'No')
                : (passkeyCreated ? 'Configurado' : 'Disponible')
              }
            </IonText>
                  </IonItem>
                  
          {/* Razón/Detalles */}
          {biometry.reason && (
            <IonItem>
                    <IonLabel>
                <h3>Detalles</h3>
                <p>{biometry.reason}</p>
                    </IonLabel>
                  </IonItem>
          )}
                  
          {/* Mensaje de estado */}
          {message && (
            <IonItem>
                    <IonLabel>
                <h3>Estado Actual</h3>
                <p>{message}</p>
                    </IonLabel>
                  </IonItem>
          )}

          {/* Instrucciones para nativa */}
          {isNative && !biometry.isAvailable && (
            <IonItem color="light">
              <IonLabel className="ion-text-wrap">
                <h3>Configuración Requerida</h3>
                <p>Para habilitar la biometría:</p>
                <ul className="list-disc list-inside mt-1">
                  <li>Ve a Ajustes de tu dispositivo</li>
                  <li>Configura {platform === 'ios' ? 'Face ID/Touch ID' : 'Huella digital'}</li>
                  <li>Reinicia la aplicación</li>
                </ul>
              </IonLabel>
                  </IonItem>
          )}
        </IonList>

        {/* Botón de acción principal */}
        <div className="p-4">
                    <IonButton 
            expand="block" 
            onClick={onAuthenticate}
            disabled={isLoading || (!isNative && !isPWA)}
            size="large"
            className="ion-margin-top"
          >
            {isLoading ? (
              <>
                <IonSpinner slot="start" />
                {isNative ? 'Autenticando...' : (passkeyCreated ? 'Verificando...' : 'Creando...')}
              </>
            ) : (
              <>
                <IonIcon icon={fingerPrint} slot="start" />
                {isNative 
                  ? 'Autenticar con Biometría' 
                  : (passkeyCreated ? 'Autenticar con WebAuthn' : 'Crear Passkey')
                }
              </>
            )}
                    </IonButton>

          {/* Enlace de descarga para no-nativos */}
          {!isNative && (
                    <IonButton 
              expand="block" 
                      fill="outline"
              href={platform === 'ios' ? 
                'https://apps.apple.com' : 
                'https://play.google.com'
              }
              target="_blank"
              className="ion-margin-top"
            >
              <IonIcon icon={download} slot="start" />
              Descargar App Nativa
                    </IonButton>
              )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Tab5;