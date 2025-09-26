# Guía de Implementación de Autenticación Biométrica

Esta guía explica cómo implementar autenticación biométrica tanto en **Angular** como en **React** usando diferentes enfoques: plugins nativos y WebAuthn.

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Implementación en React](#implementación-en-react)
3. [Implementación en Angular](#implementación-en-angular)
4. [WebAuthn (Passkeys)](#webauthn-passkeys)
5. [Configuración de Permisos](#configuración-de-permisos)
6. [Troubleshooting](#troubleshooting)
7. [Mejores Prácticas](#mejores-prácticas)

## 🔧 Requisitos Previos

### Para Apps Nativas (Ionic + Capacitor)
- Node.js 16+
- Ionic CLI
- Capacitor
- Dispositivo físico con biometría configurada

### Para WebAuthn
- Navegador moderno (Chrome 67+, Firefox 60+, Safari 14+)
- HTTPS (requerido para producción)
- Dispositivo con biometría configurada

## ⚛️ Implementación en React

### 1. Instalación de Dependencias

```bash
# Para React + Ionic
npm install @ionic/react @capacitor/core @capacitor/splash-screen
npm install @capgo/capacitor-native-biometric

# Para Capacitor
npx cap add android
npx cap add ios
```

### 2. Configuración de Capacitor

**capacitor.config.ts**
```typescript
import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'My App',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    permissions: [
      'android.permission.USE_BIOMETRIC',
      'android.permission.USE_FINGERPRINT'
    ]
  }
};

export default config;
```

### 3. Componente React Completo

**BiometricAuth.tsx**
```tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonCard, IonCardContent, IonIcon, IonSpinner,
  IonAlert, IonList, IonItem, IonLabel, IonText
} from '@ionic/react';
import { alertController } from '@ionic/core';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { fingerPrint } from 'ionicons/icons';
import { NativeBiometric, BiometryType } from '@capgo/capacitor-native-biometric';

interface BiometryState {
  isAvailable: boolean;
  biometryType: BiometryType;
  reason: string;
}

const BiometricAuth: React.FC = () => {
  const [biometry, setBiometry] = useState<BiometryState>({
    isAvailable: false,
    biometryType: BiometryType.NONE,
    reason: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [passkeyCreated, setPasskeyCreated] = useState(false);
  const [currentPasskey, setCurrentPasskey] = useState<any>(null);

  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();

  // Generar challenge aleatorio para WebAuthn
  const generateRandomChallenge = (): ArrayBuffer => {
    const length = 32;
    const randomValues = new Uint8Array(length);
    window.crypto.getRandomValues(randomValues);
    return randomValues.buffer;
  };

  // Crear Passkey con WebAuthn
  const createPasskey = async (): Promise<boolean> => {
    try {
      if (!navigator.credentials?.create) {
        alert("Tu navegador no soporta WebAuthn");
        return false;
      }
      
      const credentials = await navigator.credentials.create({
        publicKey: {
          challenge: generateRandomChallenge(),
          rp: { name: "Mi App", id: window.location.hostname },
          user: { 
            id: new Uint8Array(16), 
            name: "usuario@example.com", 
            displayName: "Usuario"
          },
          pubKeyCredParams: [
            { type: "public-key", alg: -7 },
            { type: "public-key", alg: -257 }
          ],
          timeout: 60000,
          authenticatorSelection: {
            residentKey: "preferred", 
            requireResidentKey: false, 
            userVerification: "preferred"
          },
          attestation: "none",
          extensions: { credProps: true }
        }
      });
      
      setCurrentPasskey(credentials);
      setPasskeyCreated(true);
      setMessage('Passkey creado exitosamente');
      return true;
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
      return false;
    }
  };

  // Verificar Passkey
  const verifyPasskey = async (): Promise<boolean> => {
    try {
      const credentials = await navigator.credentials.get({
        publicKey: {
          challenge: generateRandomChallenge(),
          allowCredentials: [{ 
            type: "public-key", 
            id: currentPasskey.rawId 
          }]
        }
      });
      
      setMessage('Autenticación exitosa con WebAuthn!');
      return true;
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
      return false;
    }
  };

  // Verificar biometría nativa
  const checkNativeBiometry = useCallback(async () => {
    if (!isNative) return;
    
    try {
      const result = await NativeBiometric.isAvailable();
      setBiometry({
        isAvailable: result.isAvailable,
        biometryType: result.biometryType,
        reason: ''
      });
    } catch (error) {
      console.error('Error checking biometry:', error);
    }
  }, [isNative]);

  // Autenticación nativa
  const authenticateNative = async () => {
    if (!biometry.isAvailable) {
      setMessage('Biometría no disponible');
      return;
    }

    setIsLoading(true);
    try {
      await NativeBiometric.verifyIdentity({
        reason: 'Autenticación requerida',
        title: 'Verificar identidad',
        subtitle: 'Use su biometría',
        description: 'Use su huella digital, Face ID o Touch ID',
        maxAttempts: 3,
        useFallback: true,
      });
      
      setMessage('¡Autenticación exitosa!');
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Autenticación web
  const authenticateWeb = async () => {
    setIsLoading(true);
    try {
      if (!passkeyCreated) {
        await createPasskey();
      } else {
        await verifyPasskey();
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkNativeBiometry();
  }, [checkNativeBiometry]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Autenticación Biométrica</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        <IonCard>
          <IonCardContent>
            <h2>Estado de Biometría</h2>
            <p>Plataforma: {platform} - {isNative ? 'Nativa' : 'Web'}</p>
            <p>Disponible: {biometry.isAvailable ? 'Sí' : 'No'}</p>
            {message && <p>Mensaje: {message}</p>}
          </IonCardContent>
        </IonCard>

        <IonButton 
          expand="block" 
          onClick={isNative ? authenticateNative : authenticateWeb}
          disabled={isLoading}
        >
          {isLoading ? (
            <IonSpinner />
          ) : (
            <>
              <IonIcon icon={fingerPrint} slot="start" />
              {isNative 
                ? 'Autenticar con Biometría' 
                : (passkeyCreated ? 'Verificar Passkey' : 'Crear Passkey')
              }
            </>
          )}
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default BiometricAuth;
```

## 🅰️ Implementación en Angular

### 1. Instalación de Dependencias

```bash
# Para Angular + Ionic
npm install @ionic/angular @capacitor/core @capacitor/splash-screen
npm install @capgo/capacitor-native-biometric

# Para Capacitor
npx cap add android
npx cap add ios
```

### 2. Servicio de Biometría

**biometric.service.ts**
```typescript
import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { NativeBiometric, BiometryType } from '@capgo/capacitor-native-biometric';

export interface BiometryState {
  isAvailable: boolean;
  biometryType: BiometryType;
  reason: string;
}

@Injectable({
  providedIn: 'root'
})
export class BiometricService {
  private isNative = Capacitor.isNativePlatform();
  private platform = Capacitor.getPlatform();

  // Generar challenge para WebAuthn
  generateRandomChallenge(): ArrayBuffer {
    const length = 32;
    const randomValues = new Uint8Array(length);
    window.crypto.getRandomValues(randomValues);
    return randomValues.buffer;
  }

  // Verificar disponibilidad de biometría nativa
  async checkNativeBiometry(): Promise<BiometryState> {
    if (!this.isNative) {
      return {
        isAvailable: false,
        biometryType: BiometryType.NONE,
        reason: 'No es plataforma nativa'
      };
    }

    try {
      const result = await NativeBiometric.isAvailable();
      return {
        isAvailable: result.isAvailable,
        biometryType: result.biometryType,
        reason: ''
      };
    } catch (error) {
      return {
        isAvailable: false,
        biometryType: BiometryType.NONE,
        reason: `Error: ${error}`
      };
    }
  }

  // Autenticación nativa
  async authenticateNative(): Promise<boolean> {
    try {
      await NativeBiometric.verifyIdentity({
        reason: 'Autenticación requerida',
        title: 'Verificar identidad',
        subtitle: 'Use su biometría',
        description: 'Use su huella digital, Face ID o Touch ID',
        maxAttempts: 3,
        useFallback: true,
      });
      return true;
    } catch (error) {
      console.error('Error en autenticación:', error);
      return false;
    }
  }

  // Crear Passkey con WebAuthn
  async createPasskey(): Promise<any> {
    if (!navigator.credentials?.create) {
      throw new Error('Tu navegador no soporta WebAuthn');
    }
    
    const credentials = await navigator.credentials.create({
      publicKey: {
        challenge: this.generateRandomChallenge(),
        rp: { name: "Mi App", id: window.location.hostname },
        user: { 
          id: new Uint8Array(16), 
          name: "usuario@example.com", 
          displayName: "Usuario"
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -257 }
        ],
        timeout: 60000,
        authenticatorSelection: {
          residentKey: "preferred", 
          requireResidentKey: false, 
          userVerification: "preferred"
        },
        attestation: "none",
        extensions: { credProps: true }
      }
    });
    
    return credentials;
  }

  // Verificar Passkey
  async verifyPasskey(passkey: any): Promise<boolean> {
    try {
      const credentials = await navigator.credentials.get({
        publicKey: {
          challenge: this.generateRandomChallenge(),
          allowCredentials: [{ 
            type: "public-key", 
            id: passkey.rawId 
          }]
        }
      });
      return true;
    } catch (error) {
      console.error('Error verificando passkey:', error);
      return false;
    }
  }

  // Método principal de autenticación
  async authenticate(): Promise<boolean> {
    if (this.isNative) {
      return await this.authenticateNative();
    } else {
      // Implementar lógica para WebAuthn
      const passkey = localStorage.getItem('passkey');
      if (passkey) {
        return await this.verifyPasskey(JSON.parse(passkey));
      } else {
        const newPasskey = await this.createPasskey();
        localStorage.setItem('passkey', JSON.stringify(newPasskey));
        return true;
      }
    }
  }
}
```

### 3. Componente Angular

**biometric.component.ts**
```typescript
import { Component, OnInit } from '@angular/core';
import { AlertController, LoadingController } from '@ionic/angular';
import { BiometricService, BiometryState } from './biometric.service';

@Component({
  selector: 'app-biometric',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Autenticación Biométrica</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-card>
        <ion-card-content>
          <h2>Estado de Biometría</h2>
          <p>Plataforma: {{ platform }} - {{ isNative ? 'Nativa' : 'Web' }}</p>
          <p>Disponible: {{ biometry.isAvailable ? 'Sí' : 'No' }}</p>
          <p *ngIf="message">Mensaje: {{ message }}</p>
        </ion-card-content>
      </ion-card>

      <ion-button 
        expand="block" 
        (click)="authenticate()"
        [disabled]="isLoading"
      >
        <ion-spinner *ngIf="isLoading"></ion-spinner>
        <ion-icon name="finger-print" slot="start" *ngIf="!isLoading"></ion-icon>
        {{ isNative ? 'Autenticar con Biometría' : 'Autenticar con WebAuthn' }}
      </ion-button>
    </ion-content>
  `
})
export class BiometricComponent implements OnInit {
  biometry: BiometryState = {
    isAvailable: false,
    biometryType: 0,
    reason: ''
  };
  
  isLoading = false;
  message = '';
  isNative = Capacitor.isNativePlatform();
  platform = Capacitor.getPlatform();

  constructor(
    private biometricService: BiometricService,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {}

  async ngOnInit() {
    this.biometry = await this.biometricService.checkNativeBiometry();
  }

  async authenticate() {
    this.isLoading = true;
    
    try {
      const success = await this.biometricService.authenticate();
      
      if (success) {
        this.message = '¡Autenticación exitosa!';
        const alert = await this.alertController.create({
          header: 'Éxito',
          message: 'Autenticación biométrica completada',
          buttons: ['OK']
        });
        await alert.present();
      } else {
        this.message = 'Autenticación fallida';
      }
    } catch (error: any) {
      this.message = `Error: ${error.message}`;
    } finally {
      this.isLoading = false;
    }
  }
}
```

## 🌐 WebAuthn (Passkeys)

### Implementación Básica

```typescript
// Verificar soporte de WebAuthn
const isWebAuthnSupported = (): boolean => {
  return !!(window.PublicKeyCredential && 
           navigator.credentials && 
           navigator.credentials.create);
};

// Crear Passkey
const createPasskey = async (): Promise<PublicKeyCredential> => {
  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  const credential = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: "Mi App", id: window.location.hostname },
      user: { 
        id: new Uint8Array(16), 
        name: "usuario@example.com", 
        displayName: "Usuario"
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },  // ES256
        { type: "public-key", alg: -257 } // RS256
      ],
      timeout: 60000,
      authenticatorSelection: {
        residentKey: "preferred",
        requireResidentKey: false,
        userVerification: "preferred"
      },
      attestation: "none"
    }
  });

  return credential as PublicKeyCredential;
};

// Verificar Passkey
const verifyPasskey = async (credentialId: ArrayBuffer): Promise<boolean> => {
  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  try {
    const credential = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [{ 
          type: "public-key", 
          id: credentialId 
        }]
      }
    });
    return !!credential;
  } catch (error) {
    console.error('Error verificando passkey:', error);
    return false;
  }
};
```

## 🔐 Configuración de Permisos

### Android (AndroidManifest.xml)

```xml
<uses-permission android:name="android.permission.USE_BIOMETRIC" />
<uses-permission android:name="android.permission.USE_FINGERPRINT" />

<uses-feature 
  android:name="android.hardware.fingerprint" 
  android:required="false" />
<uses-feature 
  android:name="android.hardware.biometrics" 
  android:required="false" />
```

### iOS (Info.plist)

```xml
<key>NSFaceIDUsageDescription</key>
<string>Esta app usa Face ID para autenticación segura</string>
```

## 🐛 Troubleshooting

### Errores Comunes

1. **"Method not implemented"**
   - Solo funciona en apps nativas, no en web/PWA
   - Usa WebAuthn para navegadores

2. **"Device couldn't connect"**
   - WebAuthn requiere HTTPS
   - Verifica que el dispositivo tenga biometría configurada

3. **"Biometry not available"**
   - Configura Face ID/Touch ID en el dispositivo
   - Verifica permisos en la app

4. **"NotAllowedError"**
   - Usuario canceló la autenticación
   - Verifica configuración de biometría

### Debugging

```typescript
// Verificar disponibilidad
const checkBiometrySupport = async () => {
  console.log('Platform:', Capacitor.getPlatform());
  console.log('Is Native:', Capacitor.isNativePlatform());
  
  if (Capacitor.isNativePlatform()) {
    try {
      const result = await NativeBiometric.isAvailable();
      console.log('Native Biometry:', result);
    } catch (error) {
      console.error('Native Biometry Error:', error);
    }
  } else {
    console.log('WebAuthn Support:', isWebAuthnSupported());
  }
};
```

## ✅ Mejores Prácticas

### Seguridad

1. **Challenge aleatorio**: Siempre genera challenges únicos
2. **HTTPS obligatorio**: WebAuthn requiere conexión segura
3. **Validación server-side**: Verifica credenciales en el servidor
4. **Timeout apropiado**: 30-60 segundos máximo

### UX

1. **Fallback options**: Proporciona alternativas (PIN, contraseña)
2. **Mensajes claros**: Explica por qué se necesita biometría
3. **Estados de carga**: Muestra feedback visual durante autenticación
4. **Error handling**: Maneja errores graciosamente

### Implementación

1. **Detección de plataforma**: Diferencia entre nativo y web
2. **Limpieza de recursos**: Libera listeners y recursos
3. **Testing**: Prueba en dispositivos reales
4. **Progressive enhancement**: Funciona sin biometría

## 📚 Recursos Adicionales

- [WebAuthn Specification](https://www.w3.org/TR/webauthn-2/)
- [Capacitor Native Biometric](https://github.com/Cap-go/capacitor-native-biometric)
- [Ionic Framework](https://ionicframework.com/)
- [Angular](https://angular.io/)
- [React](https://reactjs.org/)

## 🔗 Enlaces Útiles

- [Pokémon Trainer App](https://pokeapptrainer.web.app/) - Ejemplo en producción
- [WebAuthn Demo](https://webauthn.io/) - Demo interactivo
- [Biometric Auth Guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API) - MDN Documentation
