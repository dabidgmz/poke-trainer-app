import React, { useState, useEffect } from 'react';
import { 
  IonContent, 
  IonHeader, 
  IonPage, 
  IonTitle, 
  IonToolbar, 
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonAlert,
  IonSpinner,
  IonGrid,
  IonRow,
  IonCol,
  IonChip,
  IonLabel
} from '@ionic/react';
import { 
  eye, 
  checkmarkCircle, 
  closeCircle, 
  shieldCheckmark,
  lockClosed,
  person, 
  key
} from 'ionicons/icons';
import './Tab5.css';

// Import del plugin BiometricAuth
import { BiometricAuth, BiometryType } from '@aparajita/capacitor-biometric-auth';

interface BiometricResult {
  isAvailable: boolean;
  hasCredentials: boolean;
  isVerified: boolean;
  isFaceID: boolean;
}

const Tab5: React.FC = () => {
  const [biometricStatus, setBiometricStatus] = useState<BiometricResult>({
    isAvailable: false,
    hasCredentials: false,
    isVerified: false,
    isFaceID: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Verificar disponibilidad biométrica al cargar
  useEffect(() => {
    const checkBiometricAvailability = async () => {
      try {
        console.log('Verificando disponibilidad biométrica...');
        const result = await BiometricAuth.checkBiometry();
        
        console.log('Resultado completo:', result);
        console.log('isAvailable:', result.isAvailable);
        console.log('biometryType:', result.biometryType);
        
        const isFaceID = result.biometryType === BiometryType.faceId;
        const isFingerprint = result.biometryType === BiometryType.touchId;
        
        setBiometricStatus(prev => ({
          ...prev,
          isAvailable: result.isAvailable,
          isFaceID: isFaceID
        }));
        
        console.log('Face ID disponible:', isFaceID);
        console.log('Fingerprint disponible:', isFingerprint);
        
      } catch (error) {
        console.error('Error verificando disponibilidad:', error);
        console.error('Detalles del error:', error);
        setBiometricStatus(prev => ({
          ...prev,
          isAvailable: false,
          isFaceID: false
        }));
      }
    };
    
    checkBiometricAvailability();
  }, []);

  const performBiometricVerification = async () => {
    try {
      setIsAuthenticating(true);
      
      const result = await BiometricAuth.authenticate({
        reason: 'Para acceder a tu cuenta de Pokémon Trainer',
      });
      
      console.log('Autenticación exitosa!');
      
      setBiometricStatus(prev => ({
        ...prev,
        isVerified: true
      }));
      setShowSuccess(true);
      
    } catch (error: any) {
      console.error('Autenticación fallida:', error.message);
      setErrorMessage('Face ID falló. Inténtalo de nuevo.');
      setShowError(true);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const setupCredentials = async () => {
    try {
      setIsLoading(true);
      
      // Simular guardado de credenciales
      setBiometricStatus(prev => ({
        ...prev,
        hasCredentials: true
      }));
      
      console.log('Credenciales guardadas exitosamente');
    } catch (error) {
      console.error('Error guardando credenciales:', error);
      setErrorMessage('Error al guardar credenciales');
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCredentials = async () => {
    try {
      setIsLoading(true);
      
      // Simular eliminación de credenciales
      setBiometricStatus(prev => ({
        ...prev,
        hasCredentials: false,
        isVerified: false
      }));
      
      console.log('Credenciales eliminadas');
    } catch (error) {
      console.error('Error eliminando credenciales:', error);
      setErrorMessage('Error al eliminar credenciales');
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const resetAuthentication = () => {
    setBiometricStatus(prev => ({
      ...prev,
      isVerified: false
    }));
    setShowSuccess(false);
  };

  return (
    <IonPage className="biometric-page">
      <IonHeader className="biometric-header">
        <IonToolbar className="biometric-toolbar">
          <IonTitle className="biometric-title">
            <div className="biometric-header-content">
              <div className="biometric-logo">
                <IonIcon icon={shieldCheckmark} />
              </div>
              <span className="biometric-text">FACE ID</span>
            </div>
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="biometric-content">
        <div className="biometric-body">
          
          {/* Estado simplificado */}
          <div className="biometric-status-section">
            <IonCard className="status-card">
              <IonCardContent>
                <div className="status-item">
                  <IonIcon 
                    icon={biometricStatus.isAvailable ? checkmarkCircle : closeCircle} 
                    className={`status-icon ${biometricStatus.isAvailable ? 'success' : 'error'}`}
                  />
                  <IonLabel>
                    <h3>Face ID</h3>
                    <p>{biometricStatus.isAvailable ? 'Disponible' : 'No disponible'}</p>
                  </IonLabel>
                </div>
              </IonCardContent>
            </IonCard>
          </div>

          {/* Pantalla de éxito */}
          {showSuccess && (
            <div className="success-screen">
              <IonCard className="success-card">
                <IonCardContent className="success-content">
                  <div className="success-icon">
                    <IonIcon icon={checkmarkCircle} />
                  </div>
                  <h2>¡Face ID Exitoso!</h2>
                  <p>Has accedido exitosamente usando Face ID</p>
                  <IonButton 
                    expand="block" 
                    onClick={resetAuthentication}
                    className="success-btn"
                  >
                    <IonIcon icon={eye} slot="start" />
                    Face ID
                  </IonButton>
                </IonCardContent>
              </IonCard>
                </div>
          )}

          {/* Controles simplificados */}
          {!showSuccess && (
            <div className="biometric-controls">
              <IonCard className="controls-card">
                <IonCardContent>
                  <div className="control-buttons">
                    
                    {/* Botón principal de Face ID */}
                    <IonButton 
                      expand="block" 
                      onClick={performBiometricVerification}
                      disabled={isAuthenticating || !biometricStatus.isAvailable}
                      className="auth-btn"
                    >
                      <IonIcon icon={eye} slot="start" />
                      {isAuthenticating ? (
                        <>
                          <IonSpinner name="crescent" />
                          Escaneando...
                        </>
                      ) : (
                        'Face ID'
                      )}
                    </IonButton>

                    {/* Guardar credenciales */}
                    <IonButton 
                      expand="block" 
                      fill="outline" 
                      onClick={setupCredentials}
                      disabled={isLoading}
                      className="setup-btn"
                    >
                      <IonIcon icon={key} slot="start" />
                      {isLoading ? 'Guardando...' : 'Guardar Credenciales'}
                    </IonButton>

                  </div>
                </IonCardContent>
              </IonCard>
            </div>
          )}

          {/* Información simplificada */}
          <div className="biometric-info">
            <IonCard className="info-card">
              <IonCardContent>
                <div className="info-content">
                  <p>
                    Face ID utiliza reconocimiento facial para verificar tu identidad 
                    de forma rápida y segura.
                  </p>
                </div>
            </IonCardContent>
          </IonCard>
          </div>

        </div>

        {/* Alertas */}
        <IonAlert
          isOpen={showError}
          onDidDismiss={() => setShowError(false)}
          header="Error"
          message={errorMessage}
          buttons={['OK']}
        />

      </IonContent>
    </IonPage>
  );
};

export default Tab5;