// src/pages/Tab5.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonList, IonItem, IonLabel, IonText,
  IonFab, IonFabButton, IonIcon
} from '@ionic/react';
import { alertController } from '@ionic/core';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { fingerPrint } from 'ionicons/icons';

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

  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();
  const isIOS = platform === 'ios';
  const isAndroid = platform === 'android';
  

  const isActuallyNative = isNative || 
    (typeof window !== 'undefined' && 
     (window.Capacitor?.isNativePlatform?.() || 
      (/android|ios/i.test(navigator.userAgent) && 
       !window.location.href.includes('localhost') &&
       !window.location.href.includes('127.0.0.1') &&
       !window.location.href.includes('192.168.') &&
       !window.location.href.includes('file://'))));

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

  // ---------- Effects ----------
  useEffect(() => {
    (async () => {
      try {
        console.log('[Biometric] Platform check:', {
          isNative,
          platform,
          userAgent: navigator.userAgent
        });
        
        // Verificar permisos biométricos
        if (isActuallyNative) {
          console.log('[Biometric] Verificando permisos en plataforma nativa...');
        }
        
        // Solo intentar en plataforma nativa real
        if (isActuallyNative) {
          try {
            const result = await NativeBiometric.isAvailable();
            console.log('[Biometric] isAvailable result:', result);
            updateBiometryInfo(result);
          } catch (error) {
            console.error('[Biometric] Error checking biometry:', error);
            updateBiometryInfo({
              isAvailable: false,
              biometryType: BiometryType.NONE,
              reason: `Error: ${error} - Método no implementado en esta plataforma`
            });
          }
        } else {
          console.log('[Biometric] Ejecutándose en web/PWA, biometría no disponible');
          updateBiometryInfo({
            isAvailable: false,
            biometryType: BiometryType.NONE,
            reason: 'Solo disponible en app nativa (Android/iOS)'
          });
        }
      } catch (e) {
        console.error('[Biometric] Error checking biometry:', (e as Error).message);
        setMessage(`Error: ${(e as Error).message}`);
      }
      try {
        await SplashScreen.hide();
      } catch {
        /* no-op */
      }
    })();
  }, [isActuallyNative]);

  // ---------- Handlers ----------
  const checkPermissions = async () => {
    try {
      console.log('[Biometric] Verificando permisos...');
      setPermissionStatus('Verificando...');
      
      if (!isActuallyNative) {
        setPermissionStatus('Solo disponible en app nativa');
        setMessage('La biometría solo funciona en la app nativa (Android/iOS), no en web/PWA');
        updateBiometryInfo({
          isAvailable: false,
          biometryType: BiometryType.NONE,
          reason: 'Solo disponible en app nativa (Android/iOS)'
        });
        return;
      }
      
      // Verificar si el plugin está disponible
      if (!NativeBiometric || typeof NativeBiometric.isAvailable !== 'function') {
        throw new Error('Plugin NativeBiometric no está disponible');
      }
      
      const result = await NativeBiometric.isAvailable();
      console.log('[Biometric] isAvailable result:', result);
      
      if (result.isAvailable) {
        setPermissionStatus('Permisos concedidos');
        updateBiometryInfo(result);
      } else {
        setPermissionStatus('No disponible');
        setMessage('Biometría no disponible en este dispositivo');
      }
    } catch (error) {
      console.error('[Biometric] Error verificando permisos:', error);
      setPermissionStatus(`Error: ${error}`);
      setMessage(`Error verificando permisos: ${error}`);
      
      updateBiometryInfo({
        isAvailable: false,
        biometryType: BiometryType.NONE,
        reason: `Plugin no disponible: ${error}`
      });
    }
  };

  const onAuthenticate = async () => {
    try {
      console.log('[Biometric] onAuthenticate: iniciando...');
      console.log('[Biometric] biometry.isAvailable:', biometry.isAvailable);
      console.log('[Biometric] biometry.biometryType:', biometry.biometryType);
      console.log('[Biometric] Platform info:', { isNative, isActuallyNative, platform });
      
      if (!biometry.isAvailable) {
        console.warn('[Biometric] Biometría no disponible');
        setMessage('Biometría no disponible en este dispositivo');
        return;
      }
      
      console.log('[Biometric] Llamando a NativeBiometric.verifyIdentity...');
      await NativeBiometric.verifyIdentity({
        reason: 'For easy log in',
        title: 'Log in',
        subtitle: 'Authenticate',
        description: 'Please authenticate to proceed',
        maxAttempts: 2,
        useFallback: true,
      });
      console.log('[Biometric] Autenticación exitosa');
      setMessage('¡Autenticación biométrica exitosa!');
    } catch (error) {
      console.error('[Biometric] Error en autenticación:', error);
      setMessage(`Error: ${error}`);
    }
  };


  // ---------- Render ----------
  return (
    <IonPage className="w-full h-full">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Biometry</IonTitle>

          {/* Cubrimos iOS/MD */}
          <IonButtons slot="primary">
            <IonButton onClick={onAuthenticate}>Authenticate</IonButton>
          </IonButtons>
          <IonButtons slot="end">
            <IonButton onClick={onAuthenticate}>Authenticate</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent scrollY>
        {/* FAB de respaldo, siempre visible */}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={onAuthenticate}>
            <IonIcon icon={fingerPrint} />
          </IonFabButton>
        </IonFab>

        <IonList lines="full">
          <IonItem>
            <IonLabel>
              <h3>Plataforma</h3>
              <p>{platform} - {isActuallyNative ? 'Nativa' : 'Web'}</p>
              <p>Detección: {isNative ? 'Capacitor' : 'Manual'}</p>
            </IonLabel>
          </IonItem>
                  
          <IonItem>
                    <IonLabel>
              <h3>Estado de Permisos</h3>
              <p>{permissionStatus}</p>
                    </IonLabel>
            <IonButton slot="end" fill="outline" onClick={checkPermissions}>
              Verificar
            </IonButton>
                  </IonItem>
                  
          <IonItem>
                    <IonLabel>
              <h3>Biometría Disponible</h3>
              <p>{biometry.isAvailable ? biometryName : 'No disponible'}</p>
                    </IonLabel>
            <IonText slot="end">
              {biometry.isAvailable ? 'Sí' : 'No'}
            </IonText>
                  </IonItem>
                  
          <IonItem>
                    <IonLabel>
              <h3>Razón</h3>
              <p>{biometry.reason || 'N/A'}</p>
                    </IonLabel>
                  </IonItem>
                  
          {message && (
            <IonItem>
                    <IonLabel>
                <h3>Estado</h3>
                <p>{message}</p>
                    </IonLabel>
                  </IonItem>
          )}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default Tab5;
