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
  IonButton,
  IonIcon,
  IonText,
  IonSpinner,
  IonAlert,
  IonItem,
  IonLabel,
  IonInput,
} from '@ionic/react';
import { lockClosed, refresh, arrowBack, checkmarkCircle } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import authService, { User } from '../services/authService';
import './VerifyCode.css';

interface LocationState {
  email: string;
  user: User;
}

const VerifyCode: React.FC = () => {
  const history = useHistory();
  const location = useLocation<LocationState>();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLIonInputElement | null)[]>([]);

  const email = location.state?.email || '';
  const user = location.state?.user;

  useEffect(() => {
    // Si no hay email, redirigir a login
    if (!email) {
      history.push('/login');
    }
  }, [email, history]);

  useEffect(() => {
    // Countdown para reenvío
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleCodeChange = (index: number, value: string) => {
    // Solo permitir números
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError(null);

    // Auto-focus al siguiente input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.setFocus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.setFocus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const newCode = pastedData.split('');
      setCode(newCode);
      inputRefs.current[5]?.setFocus();
    }
  };

  const handleVerify = async () => {
    const codeString = code.join('');
    if (codeString.length !== 6) {
      setError('Por favor ingresa el código completo de 6 dígitos');
      setShowErrorAlert(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.verifyCode({
        email,
        code: codeString,
      });

      if (response.token) {
        history.push('/tab1');
      }
    } catch (err: any) {
      setError(err.message || 'Código inválido. Por favor intenta nuevamente.');
      setShowErrorAlert(true);
      // Limpiar código en caso de error
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.setFocus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setError(null);

    try {
      await authService.resendCode(email);
      setCountdown(60); // 60 segundos de espera
    } catch (err: any) {
      setError(err.message || 'Error al reenviar el código');
      setShowErrorAlert(true);
    } finally {
      setIsResending(false);
    }
  };

  const isCodeComplete = code.every((digit) => digit !== '');

  return (
    <IonPage className="verify-code-page">
      <IonHeader>
        <IonToolbar className="auth-toolbar">
          <IonButton
            fill="clear"
            slot="start"
            onClick={() => history.push('/login')}
            className="back-button"
          >
            <IonIcon icon={arrowBack} />
          </IonButton>
          <IonTitle className="auth-title">Verificación 2FA</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="auth-content">
        <div className="auth-container">
          {/* Header */}
          <div className="auth-header">
            <div className="verify-icon">
              <IonIcon icon={lockClosed} />
            </div>
            <h1 className="auth-main-title">Código de Verificación</h1>
            <p className="auth-subtitle">
              Hemos enviado un código de 6 dígitos a
              <br />
              <strong>{email}</strong>
            </p>
          </div>

          {/* Code Input */}
          <IonCard className="auth-card">
            <IonCardContent>
              <div className="code-input-container" onPaste={handlePaste}>
                {code.map((digit, index) => (
                  <IonInput
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxlength={1}
                    value={digit}
                    onIonInput={(e) => handleCodeChange(index, e.detail.value!)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="code-input"
                  />
                ))}
              </div>

              {/* Error message */}
              {error && (
                <IonText color="danger" className="error-text">
                  <p>{error}</p>
                </IonText>
              )}

              {/* Verify button */}
              <IonButton
                expand="block"
                className="auth-submit-button"
                disabled={!isCodeComplete || isLoading}
                onClick={handleVerify}
              >
                {isLoading ? (
                  <IonSpinner name="crescent" />
                ) : (
                  <>
                    <IonIcon icon={checkmarkCircle} slot="start" />
                    Verificar Código
                  </>
                )}
              </IonButton>

              {/* Resend code */}
              <div className="resend-container">
                <IonText className="resend-text">
                  ¿No recibiste el código?
                </IonText>
                <IonButton
                  fill="clear"
                  size="small"
                  onClick={handleResendCode}
                  disabled={isResending || countdown > 0}
                  className="resend-button"
                >
                  {isResending ? (
                    <IonSpinner name="crescent" />
                  ) : countdown > 0 ? (
                    `Reenviar en ${countdown}s`
                  ) : (
                    <>
                      <IonIcon icon={refresh} slot="start" />
                      Reenviar Código
                    </>
                  )}
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>

          {/* User info */}
          {user && (
            <div className="user-info">
              <IonText className="user-info-text">
                Verificando como: <strong>{user.name}</strong> ({user.role})
              </IonText>
            </div>
          )}
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

export default VerifyCode;

