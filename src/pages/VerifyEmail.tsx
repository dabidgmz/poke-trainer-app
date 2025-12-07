// pages/VerifyEmail.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonText,
  IonSpinner,
  IonAlert,
  IonInput,
} from '@ionic/react';
import { mail, refresh, arrowBack, checkmarkCircle } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import authService from '../services/authService';
import './VerifyEmail.css';

// 🔹 NUEVOS IMPORTS
import HCaptchaComponent from '../components/HCaptcha';
import { HCAPTCHA_SITE_KEY } from '../config/hcaptcha';
import { VerifyCodeData, ResendCodeData } from '../interfaces/Auth';

interface LocationState {
  email: string;
}

const VerifyEmail: React.FC = () => {
  const history = useHistory();
  const location = useLocation<LocationState>();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLIonInputElement | null)[]>([]);

  // 🔹 Estado para hCaptcha
  const [hCaptchaToken, setHCaptchaToken] = useState<string | null>(null);
  const [hCaptchaError, setHCaptchaError] = useState<string | null>(null);

  const email = location.state?.email || '';

  useEffect(() => {
    if (!email) {
      history.replace('/login');
    }
  }, [email, history]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleCodeChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError(null);
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

    if (!hCaptchaToken) {
      setHCaptchaError('Por favor completa el captcha antes de verificar el email.');
      setShowErrorAlert(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload: VerifyCodeData = {
        email,
        code: codeString,
        hCaptchaToken, // 👈 se envía al backend
      };

      await authService.verifyEmail(payload);

      // Limpiar estado antes de redirigir
      setCode(['', '', '', '', '', '']);

      history.replace('/login', { verified: true });
    } catch (err: any) {
      setError(err.message || 'Código inválido. Por favor intenta nuevamente.');
      setShowErrorAlert(true);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.setFocus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!hCaptchaToken) {
      setHCaptchaError('Por favor completa el captcha antes de reenviar el código.');
      setShowErrorAlert(true);
      return;
    }

    setIsResending(true);
    setError(null);
    try {
      const payload: ResendCodeData = {
        email,
        hCaptchaToken, // 👈 también se usa aquí
      };

      await authService.resendVerification(payload);
      setCountdown(60);
    } catch (err: any) {
      setError(err.message || 'Error al reenviar el código');
      setShowErrorAlert(true);
    } finally {
      setIsResending(false);
    }
  };

  const isCodeComplete = code.every((digit) => digit !== '');

  return (
    <IonPage className="verify-email-page">
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
          <IonTitle className="auth-title">Verificar Email</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="auth-content">
        <div className="auth-container">
          <div className="auth-header">
            <div className="verify-icon"><IonIcon icon={mail} /></div>
            <h1 className="auth-main-title">Verifica tu Email</h1>
            <p className="auth-subtitle">
              Hemos enviado un código de 6 dígitos a<br />
              <strong>{email}</strong>
            </p>
          </div>
          <IonCard className="auth-card">
            <IonCardContent>
              <div className="code-input-container" onPaste={handlePaste}>
                {code.map((digit, index) => (
                  <IonInput
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxlength={1}
                    value={digit}
                    onIonInput={(e) => handleCodeChange(index, e.detail.value || '')}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="code-input"
                  />
                ))}
              </div>

              {/* hCaptcha */}
              <HCaptchaComponent
                siteKey={HCAPTCHA_SITE_KEY}
                onTokenChange={(token) => {
                  setHCaptchaToken(token || null);
                  if (token) setHCaptchaError(null);
                }}
                onErrorChange={(msg) => setHCaptchaError(msg)}
              />

              {(error || hCaptchaError) && (
                <IonText color="danger" className="error-text">
                  <p>{error || hCaptchaError}</p>
                </IonText>
              )}

              <IonButton
                expand="block"
                className="auth-submit-button"
                disabled={!isCodeComplete || isLoading || !hCaptchaToken}
                onClick={handleVerify}
              >
                {isLoading ? <IonSpinner name="crescent" /> : (
                  <>
                    <IonIcon icon={checkmarkCircle} slot="start" />
                    Verificar Email
                  </>
                )}
              </IonButton>

              <div className="resend-container">
                <IonText className="resend-text">¿No recibiste el código?</IonText>
                <IonButton
                  fill="clear"
                  size="small"
                  onClick={handleResendCode}
                  disabled={isResending || countdown > 0 || !hCaptchaToken}
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
        </div>
      </IonContent>
      <IonAlert
        isOpen={showErrorAlert}
        onDidDismiss={() => setShowErrorAlert(false)}
        header="Error"
        message={error || hCaptchaError || 'Ocurrió un error'}
        buttons={['OK']}
      />
    </IonPage>
  );
};

export default VerifyEmail;