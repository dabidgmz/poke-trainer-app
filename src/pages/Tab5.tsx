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

import { NativeBiometric, BiometryType } from 'capacitor-native-biometric';

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

  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();
  const isIOS = platform === 'ios';
  const isAndroid = platform === 'android';

  // ---------- Computed ----------
  const biometryName = useMemo(() => {
    if (biometry.biometryType === BiometryType.FACE_ID) return 'Face ID';
    if (biometry.biometryType === BiometryType.TOUCH_ID) return 'Touch ID';
    if (biometry.biometryType === BiometryType.FINGERPRINT) return 'Fingerprint';
    return 'No biometry';
  }, [biometry]);

  // ---------- Helpers ----------
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
        if (!isNative) {
          console.warn('[Biometric] Plataforma web/PWA, plugin no disponible');
          return;
        }
        const result = await NativeBiometric.isAvailable();
        console.log('[Biometric] isAvailable result:', result);
        updateBiometryInfo(result);
      } catch (e) {
        console.error((e as Error).message);
      }
      try {
        await SplashScreen.hide();
      } catch {
        /* no-op */
      }
    })();
  }, [isNative]);

  // ---------- Handlers ----------
  const onAuthenticate = async () => {
    try {
      console.log('[Biometric] onAuthenticate: iniciando...');
      console.log('[Biometric] biometry.isAvailable:', biometry.isAvailable);
      console.log('[Biometric] biometry.biometryType:', biometry.biometryType);
      
      if (!isNative) {
        console.warn('[Biometric] Solo disponible en app nativa');
        setMessage('Solo disponible en app nativa');
        return;
      }
      
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
