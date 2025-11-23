import React, { useState, useEffect, useRef } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonText,
  IonSpinner,
  IonAlert,
} from '@ionic/react';
import { mail, lockClosed, logIn, arrowBack, eye, eyeOff, checkmarkCircle, download } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import authService, { LoginData } from '../services/authService';
import './Login.css';

interface LocationState {
  verified?: boolean;
}

const Login: React.FC = () => {
  const history = useHistory();
  const location = useLocation<LocationState>();
  const [formData, setFormData] = useState<LoginData>({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(location.state?.verified || false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  // Detectar si la app ya está instalada
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone || isIOSStandalone);
  }, []);

  // Capturar el evento beforeinstallprompt para PWA
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevenir el prompt automático
      e.preventDefault();
      // Guardar el evento para usarlo más tarde
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detectar cuando la app se instala
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInputChange = (field: keyof LoginData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
    // Ocultar mensaje de éxito cuando el usuario empiece a escribir
    if (showSuccessMessage) {
      setShowSuccessMessage(false);
    }
  };

  const handleDownloadApp = async () => {
    // Si la app ya está instalada, no hacer nada
    if (isInstalled) {
      return;
    }

    // Si tenemos el evento beforeinstallprompt (Android/Chrome)
    if (deferredPrompt) {
      try {
        // Mostrar el prompt de instalación
        await deferredPrompt.prompt();
        // Esperar a que el usuario responda
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`Usuario ${outcome === 'accepted' ? 'aceptó' : 'rechazó'} la instalación`);
        // Limpiar el prompt
        setDeferredPrompt(null);
        setIsInstallable(false);
      } catch (error) {
        console.error('Error al mostrar el prompt de instalación:', error);
      }
      return;
    }

    // Para iOS, mostrar instrucciones
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;

    if (isIOS) {
      // Mostrar instrucciones para iOS
      alert(
        'Para instalar la app en iOS:\n\n' +
        '1. Toca el botón de compartir (cuadrado con flecha)\n' +
        '2. Selecciona "Añadir a pantalla de inicio"\n' +
        '3. Toca "Añadir" en la esquina superior derecha'
      );
      return;
    }

    // Si no es instalable, mostrar mensaje
    alert('La instalación de la app no está disponible en este momento. Asegúrate de estar usando un navegador compatible (Chrome, Edge, Safari) y que la app cumpla con los requisitos de instalación.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.login(formData);

      // Si requiere código 2FA (profesores)
      // Después del logout, el backend debe enviar requiresCode para todos los usuarios
      if ('requiresCode' in response && response.requiresCode) {
        // Redirigir a verificación 2FA con código de 6 dígitos
        history.push('/verify-code', { email: formData.email, user: response.user });
        return;
      }

      // Si el backend devuelve token directamente (entrenadores sin 2FA requerido)
      // Esto solo debería pasar si el backend no requiere 2FA después del logout
      if ('token' in response) {
        // Si el backend no requiere 2FA, ir directamente a tab1
        // Pero según el requerimiento, todos deben pasar por 2FA después del logout
        // El backend debe enviar requiresCode para forzar 2FA
        history.push('/tab1');
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
      setShowErrorAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonPage className="login-page">
      <IonHeader>
        <IonToolbar className="auth-toolbar">
          <IonButton
            fill="clear"
            slot="start"
            onClick={() => history.push('/register')}
            className="back-button"
          >
            <IonIcon icon={arrowBack} />
          </IonButton>
          <IonTitle className="auth-title">Iniciar Sesión</IonTitle>
          {!isInstalled && (
            <IonButton
              fill="clear"
              slot="end"
              onClick={handleDownloadApp}
              disabled={!isInstallable && !isInstalled}
              style={{
                '--color': 'white',
                fontSize: '12px',
                fontWeight: '400',
                textTransform: 'none',
                '--padding-start': '8px',
                '--padding-end': '8px',
                opacity: isInstallable ? 1 : 0.6
              }}
            >
              <IonIcon icon={download} style={{ fontSize: '16px', marginRight: '4px' }} />
              <span style={{ fontSize: '11px' }}>Instalar App</span>
            </IonButton>
          )}
        </IonToolbar>
      </IonHeader>

      <IonContent className="auth-content">
        <div className="auth-container">
          {/* Logo/Header */}
          <div className="auth-header">
            <div className="pokeball-icon">⚡</div>
            <h1 className="auth-main-title">Bienvenido de vuelta</h1>
            <p className="auth-subtitle">Inicia sesión para continuar tu aventura</p>
          </div>

          {/* Mensaje de éxito si viene de verificación */}
          {showSuccessMessage && (
            <IonCard style={{ 
              marginBottom: '20px', 
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white'
            }}>
              <IonCardContent style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                padding: '16px'
              }}>
                <IonIcon icon={checkmarkCircle} style={{ fontSize: '24px' }} />
                <div>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>
                    ¡Email verificado exitosamente!
                  </strong>
                  <span style={{ fontSize: '14px', opacity: 0.9 }}>
                    Ahora puedes iniciar sesión con tus credenciales.
                  </span>
                </div>
              </IonCardContent>
            </IonCard>
          )}

          {/* Formulario */}
          <IonCard className="auth-card">
            <IonCardContent>
              <form onSubmit={handleSubmit}>
                {/* Email */}
                <IonItem className="auth-input-item" lines="none">
                  <IonLabel position="stacked" className="auth-label">
                    <IonIcon icon={mail} className="label-icon" />
                    Email
                  </IonLabel>
                  <IonInput
                    type="email"
                    value={formData.email}
                    onIonInput={(e) => handleInputChange('email', e.detail.value!)}
                    placeholder="tu@email.com"
                    required
                    className="auth-input"
                  />
                </IonItem>

                {/* Password */}
                <IonItem className="auth-input-item" lines="none">
                  <IonLabel position="stacked" className="auth-label">
                    <IonIcon icon={lockClosed} className="label-icon" />
                    Contraseña
                  </IonLabel>
                  <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
                    <IonInput
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onIonInput={(e) => handleInputChange('password', e.detail.value!)}
                      placeholder="••••••••"
                      required
                      className="auth-input"
                      style={{ flex: '1', paddingRight: '45px' }}
                    />
                    <IonButton
                      fill="clear"
                      size="small"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowPassword(!showPassword);
                      }}
                      type="button"
                      style={{
                        position: 'absolute',
                        right: '4px',
                        '--padding-start': '8px',
                        '--padding-end': '8px',
                        height: '36px',
                        width: '36px',
                        margin: '0',
                        '--color': '#dc2626',
                        zIndex: 10
                      }}
                    >
                      <IonIcon icon={showPassword ? eyeOff : eye} />
                    </IonButton>
                  </div>
                </IonItem>

                {/* Error message */}
                {error && (
                  <IonText color="danger" className="error-text">
                    <p>{error}</p>
                  </IonText>
                )}

                {/* Submit button */}
                <IonButton
                  type="submit"
                  expand="block"
                  className="auth-submit-button"
                  disabled={isLoading || !formData.email || !formData.password}
                >
                  {isLoading ? (
                    <IonSpinner name="crescent" />
                  ) : (
                    <>
                      <IonIcon icon={logIn} slot="start" />
                      Iniciar Sesión
                    </>
                  )}
                </IonButton>
              </form>
            </IonCardContent>
          </IonCard>

          {/* Link to register */}
          <div className="auth-footer">
            <IonText className="auth-footer-text">
              ¿No tienes cuenta?{' '}
              <IonButton
                fill="clear"
                size="small"
                onClick={() => history.push('/register')}
                className="auth-link-button"
              >
                Regístrate aquí
              </IonButton>
            </IonText>
          </div>
        </div>
      </IonContent>

      {/* Error Alert */}
      <IonAlert
        isOpen={showErrorAlert}
        onDidDismiss={() => setShowErrorAlert(false)}
        header="Error"
        message={error || 'Ocurrió un error'}
        buttons={['OK']}
      />
    </IonPage>
  );
};

export default Login;

