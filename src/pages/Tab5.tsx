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
import { fingerPrint, phonePortrait, warning } from 'ionicons/icons';

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
  // The challenge is a crucial part of the authentication process, 
  // and is used to mitigate "replay attacks" and allow server-side authentication
  // in a real app, you'll want to generate the challenge server-side and 
  // maintain a session or temporary record of this challenge in your DB
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
        alert("Your browser does not support the Web Authentication API");
        return false;
      }
      
      const credentials = await navigator.credentials.create({
        publicKey: {
          challenge: generateRandomChallenge(),
          rp: { name: "Pokémon Trainer", id: window.location.hostname },
          // here you'll want to pass the user's info
          user: { id: new Uint8Array(16), name: "trainer@pokemon.com", displayName: "Pokémon Trainer"},
          pubKeyCredParams: [
            { type: "public-key", alg: -7 },
            { type: "public-key", alg: -257 }
          ],
          timeout: 60000,
          authenticatorSelection: {residentKey: "preferred", requireResidentKey: false, userVerification: "preferred"},
          attestation: "none",
          extensions: { credProps: true }
        }
      });
      
      // in a real app, you'll store the credentials against the user's profile in your DB
      // here we'll just save it in a global variable
      setCurrentPasskey(credentials);
      setPasskeyCreated(true);
      setMessage('Passkey creado exitosamente');
      console.log(credentials);
      return true;
    } catch (error: any) {
      console.error('Error creando passkey:', error);
      setMessage(`Error creando passkey: ${error.message}`);
      return false;
    }
  };

  // Verificar Passkey con WebAuthn
  const verifyPasskey = async (): Promise<boolean> => {
    try {
      // to verify a user's credentials, we simply pass the 
      // unique ID of the passkey we saved against the user profile
      // in this demo, we just saved it in a global variable
      const credentials = await navigator.credentials.get({
        publicKey: {
          challenge: generateRandomChallenge(),
          allowCredentials: [{ type: "public-key", id: currentPasskey.rawId }]
        }
      });
      
      console.log(credentials);
      setMessage('Autenticación biométrica exitosa con WebAuthn!');
      return true;
    } catch (error: any) {
      console.error('Error verificando passkey:', error);
      setMessage(`Error en autenticación: ${error.message}`);
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
        setBiometry({
          isAvailable: false,
          biometryType: BiometryType.NONE,
          reason: 'PWA - WebAuthn disponible'
        });
        setMessage('WebAuthn disponible. Puedes crear un passkey para autenticación biométrica.');
        setPermissionStatus('PWA - WebAuthn');
        return;
      }

      // Si no es nativo (navegador web normal)
      if (!isNative) {
        setBiometry({
          isAvailable: false,
          biometryType: BiometryType.NONE,
          reason: 'Navegador web - WebAuthn disponible'
        });
        setMessage('WebAuthn disponible. Puedes crear un passkey para autenticación biométrica.');
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
          message="La autenticación biométrica completa solo está disponible en la aplicación nativa. Usa WebAuthn como alternativa."
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
                    <li>Usa el botón de abajo para crear o verificar tu passkey</li>
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

        </div>
      </IonContent>
    </IonPage>
  );
};

export default Tab5;