// capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'PokeTrainerApp',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Camera: {
      permissions: ['camera']
    },
    
    NativeBiometric: {
      android: {
        useAndroidXBiometricPrompt: true, 
        disableBackup: false, 
        maxAttempts: 5, 
        requireConfirmation: false 
      },
      
      ios: {
        allowBiometricFallback: true, 
        requirePasscode: true, 
        localizedReason: "Autentícate para acceder a PokeTrainerApp",
        localizedFallbackTitle: "Usar Passcode",
        localizedCancelTitle: "Cancelar"
      }
    },
    
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#ffffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#999999",
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: "launch_screen",
      useDialog: true
    }
  },
  
  android: {
    permissions: [
      'android.permission.CAMERA',
      'android.permission.RECORD_AUDIO',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.INTERNET',
      'android.permission.ACCESS_NETWORK_STATE',
      'android.permission.USE_BIOMETRIC', // Para Android 10+
      'android.permission.USE_FINGERPRINT', // Para versiones anteriores
      'android.permission.BIND_BIOMETRIC_SERVICE', // Servicio biométrico
      'com.samsung.android.providers.context.permission.WRITE_USE_APP_FEATURE_SURVEY' // Para Samsung
    ],
    allowMixedContent: true,
    buildOptions: {
      keystorePath: 'release.keystore',
      keystoreAlias: 'key0',
      signingType: 'apk'
    }
  },
  

  ios: {
    permissions: {
      FaceID: {
        usageDescription: "Usamos Face ID para autenticarte de forma segura en PokeTrainerApp"
      },
      TouchID: {
        usageDescription: "Usamos Touch ID para autenticarte de forma segura en PokeTrainerApp"
      },
      Biometrics: {
        usageDescription: "Usamos biometría para proteger tu cuenta de PokeTrainerApp"
      }
    },
    scheme: 'PokeTrainerApp',
    // Configuración de entitlements para biometría
    entitlements: {
      'keychain-access-groups': ['$(AppIdentifierPrefix)io.ionic.starter']
    },
    // Configuración de info.plist
    info: {
      NSFaceIDUsageDescription: "Esta app usa Face ID para verificar tu identidad de forma segura",
      NSBiometricUsageDescription: "Esta app usa datos biométricos para autenticación segura"
    }
  }
};

export default config;