// Tab5.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonList, IonItem, IonLabel, IonText, IonListHeader,
  IonSelect, IonSelectOption, IonCheckbox, IonInput
} from '@ionic/react';
import { alertController } from '@ionic/core';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';

import {
  AndroidBiometryStrength,
  type AuthenticateOptions,
  BiometricAuth,
  type BiometryError,
  BiometryErrorType,
  BiometryType,
  type CheckBiometryResult,
  getBiometryName,
} from '@aparajita/capacitor-biometric-auth';
import { type PluginListenerHandle } from '@capacitor/core';
type BiometryTypeEntry = { title: string; type: number };

const BIOMETRY_TYPES: BiometryTypeEntry[] = [
  { title: 'None', type: BiometryType.none },

  { title: 'Touch ID', type: BiometryType.touchId },
  { title: 'Face ID', type: BiometryType.faceId },
  { title: 'Fingerprint', type: BiometryType.fingerprintAuthentication },
  {
    title: 'Fingerprint + face',
    type: BiometryType.fingerprintAuthentication * 10 + BiometryType.faceAuthentication,
  },
  {
    title: 'Fingerprint + iris',
    type: BiometryType.fingerprintAuthentication * 10 + BiometryType.irisAuthentication,
  },
];

const Tab5: React.FC = () => {
  // ---------- State ----------
  const [biometry, setBiometry] = useState<CheckBiometryResult>({
    isAvailable: false,
    strongBiometryIsAvailable: false,
    biometryType: BiometryType.none,
    biometryTypes: [],
    deviceIsSecure: false,
    reason: '',
    code: BiometryErrorType.none,
    strongReason: '',
    strongCode: BiometryErrorType.none,
  });

  const [options, setOptions] = useState<AuthenticateOptions>({
    reason: '',
    cancelTitle: '',
    iosFallbackTitle: '',
    androidTitle: '',
    androidSubtitle: '',
    allowDeviceCredential: false,
    androidConfirmationRequired: false,
    androidBiometryStrength: AndroidBiometryStrength.weak,
  });

  const [biometryType, setBiometryType] = useState<number>(BiometryType.none);
  const [onlyUseStrongBiometry, setOnlyUseStrongBiometry] = useState<boolean>(false);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
  const [deviceIsSecure, setDeviceIsSecure] = useState<boolean>(false);

  const appListener = useRef<PluginListenerHandle | null>(null);

  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();
  const isIOS = platform === 'ios';
  const isAndroid = platform === 'android';

  // ---------- Computed ----------
  const biometryName = useMemo(() => {
    if (biometry.biometryTypes.length === 0) return 'No biometry';
    if (biometry.biometryTypes.length === 1) return getBiometryName(biometry.biometryType);
    return 'Biometry';
  }, [biometry]);

  const biometryNames = useMemo(() => {
    if (biometry.biometryTypes.length === 0) return 'None';
    return biometry.biometryTypes.map((t) => getBiometryName(t)).join('<br>');
  }, [biometry]);

  const availableBiometry = useMemo(() => {
    if (biometry.isAvailable) {
      return biometry.biometryTypes.length > 1 ? 'One or more' : 'Yes';
    }
    return 'None';
  }, [biometry]);

  // ---------- Helpers ----------
  const updateBiometryInfo = (info: CheckBiometryResult) => setBiometry(info);

  const showAlert = async (message: string) => {
    const alert = await alertController.create({
      header: `${biometryName} says:`,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  };

  const showErrorAlert = async (error: BiometryError) => {
    await showAlert(`${error.message} [${error.code}].`);
  };

  // ---------- Effects ----------
  useEffect(() => {
    (async () => {
      try {
        updateBiometryInfo(await BiometricAuth.checkBiometry());
        appListener.current = await BiometricAuth.addResumeListener((info) => {
          updateBiometryInfo(info);
        });
      } catch (e) {
        console.error((e as Error).message);
      }
      try {
        await SplashScreen.hide();
      } catch {
        /* no-op on web */
      }
    })();

    return () => {
      appListener.current?.remove?.();
    };
  }, []);

  // ---------- Handlers ----------
  const onAuthenticate = async () => {
    try {
      await BiometricAuth.authenticate({ ...options }); // en React no hay proxies reactivas
      await showAlert('Authorization successful!');
    } catch (error) {
      await showErrorAlert(error as BiometryError);
    }
  };

  const onSelectBiometry = async (value: string | number) => {
    const typeNum = Number(value);
    setBiometryType(typeNum);

    if (typeNum > 10) {
      const primary = Math.floor(typeNum / 10) as BiometryType;
      const secondary = (typeNum % 10) as BiometryType;
      await BiometricAuth.setBiometryType([primary, secondary]);
    } else {
      await BiometricAuth.setBiometryType(typeNum === 0 ? BiometryType.none : (typeNum as BiometryType));
    }
    updateBiometryInfo(await BiometricAuth.checkBiometry());
  };

  const onSetAndroidBiometryStrength = () => {
    setOnlyUseStrongBiometry((prev) => {
      const next = !prev;
      setOptions((o) => ({
        ...o,
        androidBiometryStrength: next ? AndroidBiometryStrength.strong : AndroidBiometryStrength.weak,
      }));
      return next;
    });
  };

  const onSetIsEnrolled = async (checked: boolean) => {
    setIsEnrolled(checked);
    await BiometricAuth.setBiometryIsEnrolled(checked);
    updateBiometryInfo(await BiometricAuth.checkBiometry());
  };

  const onSetDeviceIsSecure = async (checked: boolean) => {
    setDeviceIsSecure(checked);
    await BiometricAuth.setDeviceIsSecure(checked);
    updateBiometryInfo(await BiometricAuth.checkBiometry());
  };

  // ---------- Render ----------
  return (
    <IonPage className="w-full h-full">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Biometry</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onAuthenticate}>Authenticate</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent scrollY>
        <IonList lines="full">
          <IonItem>
            <IonLabel>
              <h3 className="!text-sm">Supported biometry</h3>
              {/* mostrar HTML con <br> entre tipos */}
              <div dangerouslySetInnerHTML={{ __html: biometryNames }} />
            </IonLabel>
          </IonItem>

          <IonItem>
            <IonLabel>
              <IonText className="block">Biometry available</IonText>
              <IonText className="block !text-sm text-neutral-400">{biometry.reason}</IonText>
            </IonLabel>
            <IonText slot="end">{availableBiometry}</IonText>
          </IonItem>

          <IonItem>
            <IonLabel>
              <IonText className="block">Strong biometry available</IonText>
              <IonText className="block !text-sm text-neutral-400">{biometry.strongReason}</IonText>
            </IonLabel>
            <IonText slot="end">{biometry.strongBiometryIsAvailable ? 'Yes' : 'No'}</IonText>
          </IonItem>

          <IonItem>
            <IonLabel>Device is secure</IonLabel>
            <IonText slot="end">{biometry.deviceIsSecure ? 'Yes' : 'No'}</IonText>
          </IonItem>
        </IonList>

        <IonList className="mt-6" lines="full">
          <IonListHeader>Options</IonListHeader>

          {!isNative && (
            <>
              <IonItem>
                <IonSelect
                  label="Biometry"
                  interface="action-sheet"
                  interfaceOptions={{ header: 'Select biometry type' }}
                  className="[--padding-start:0px] max-w-full"
                  value={biometryType}
                  onIonChange={(e) => onSelectBiometry(e.detail.value!)}
                >
                  {BIOMETRY_TYPES.map((entry) => (
                    <IonSelectOption key={entry.type} value={entry.type}>
                      {entry.title}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>

              <IonItem>
                <IonCheckbox
                  checked={isEnrolled}
                  disabled={biometry.biometryType === BiometryType.none}
                  onIonChange={(e) => onSetIsEnrolled(e.detail.checked)}
                >
                  Enrolled
                </IonCheckbox>
              </IonItem>

              <IonItem>
                <IonCheckbox
                  checked={deviceIsSecure}
                  onIonChange={(e) => onSetDeviceIsSecure(e.detail.checked)}
                >
                  Device is secure
                </IonCheckbox>
              </IonItem>
            </>
          )}

          {isAndroid && (
            <IonItem>
              <IonCheckbox
                checked={onlyUseStrongBiometry}
                onIonChange={onSetAndroidBiometryStrength}
              >
                Only use strong biometry
              </IonCheckbox>
            </IonItem>
          )}

          <IonItem>
            <IonCheckbox
              checked={!!options.allowDeviceCredential}
              onIonChange={(e) =>
                setOptions((o) => ({ ...o, allowDeviceCredential: e.detail.checked }))
              }
            >
              Allow device credential
            </IonCheckbox>
          </IonItem>

          {isAndroid && (
            <IonItem>
              <IonCheckbox
                checked={!!options.androidConfirmationRequired}
                onIonChange={(e) =>
                  setOptions((o) => ({ ...o, androidConfirmationRequired: e.detail.checked }))
                }
              >
                Require confirmation
              </IonCheckbox>
            </IonItem>
          )}

          {isAndroid && (
            <>
              <IonItem>
                <IonInput
                  label="Title:"
                  type="text"
                  value={options.androidTitle}
                  onIonChange={(e) =>
                    setOptions((o) => ({ ...o, androidTitle: e.detail.value ?? '' }))
                  }
                />
              </IonItem>

              <IonItem>
                <IonInput
                  label="Subtitle:"
                  type="text"
                  value={options.androidSubtitle}
                  onIonChange={(e) =>
                    setOptions((o) => ({ ...o, androidSubtitle: e.detail.value ?? '' }))
                  }
                />
              </IonItem>
            </>
          )}

          <IonItem>
            <IonInput
              label="Reason:"
              type="text"
              value={options.reason}
              onIonChange={(e) => setOptions((o) => ({ ...o, reason: e.detail.value ?? '' }))}
            />
          </IonItem>

          {isNative && (
            <IonItem>
              <IonInput
                label="Cancel title:"
                type="text"
                value={options.cancelTitle}
                onIonChange={(e) =>
                  setOptions((o) => ({ ...o, cancelTitle: e.detail.value ?? '' }))
                }
              />
            </IonItem>
          )}

          {isIOS && (
            <IonItem>
              <IonInput
                label="Fallback title:"
                type="text"
                value={options.iosFallbackTitle}
                onIonChange={(e) =>
                  setOptions((o) => ({ ...o, iosFallbackTitle: e.detail.value ?? '' }))
                }
              />
            </IonItem>
          )}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default Tab5;
