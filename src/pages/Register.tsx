import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonText,
  IonSpinner,
  IonAlert,
  IonSelect,
  IonSelectOption,
} from '@ionic/react';
import { person, mail, lockClosed, call, personOutline, logIn, eye, eyeOff } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import authService from '../services/authService';
import './Register.css';
import { RegisterData } from '../interfaces/Auth';

// 🔹 IMPORTS NUEVOS
import HCaptchaComponent from '../components/HCaptcha';
import { HCAPTCHA_SITE_KEY } from '../config/hcaptcha';

const Register: React.FC = () => {
  const history = useHistory();
  const [formData, setFormData] = useState<RegisterData>({
    name: '',
    email: '',
    password: '',
    phone: '',
    gender: '',
    hCaptchaToken: '', // 👈 ya está en la interfaz
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Estados para validaciones en tiempo real
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<{
    hasUpperCase: boolean;
    hasLowerCase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  }>({
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  // 🔹 Error específico para el captcha
  const [hCaptchaError, setHCaptchaError] = useState<string | null>(null);

  // Validar nombre en tiempo real
  const validateName = (name: string) => {
    if (name.length > 0 && name.length < 3) {
      setNameError('El nombre debe tener al menos 3 caracteres');
      return false;
    }
    setNameError(null);
    return true;
  };

  // Validar email en tiempo real (debe ser Gmail)
  const validateEmail = (email: string) => {
    if (email.length === 0) {
      setEmailError(null);
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Por favor ingresa un email válido');
      return false;
    }
    if (!email.toLowerCase().endsWith('@gmail.com')) {
      setEmailError('El email debe ser de Gmail (@gmail.com)');
      return false;
    }
    setEmailError(null);
    return true;
  };

  // Validar teléfono en tiempo real (10 dígitos)
  const validatePhone = (phone: string) => {
    if (phone.length === 0) {
      setPhoneError(null);
      return true; // Es opcional
    }
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length !== 10) {
      setPhoneError('El teléfono debe tener exactamente 10 dígitos');
      return false;
    }
    setPhoneError(null);
    return true;
  };

  // Validar contraseña en tiempo real
  const validatePasswordRealTime = (password: string) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    setPasswordErrors({
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      hasSpecialChar,
    });
  };

  // Validar confirmación de contraseña en tiempo real
  const validateConfirmPassword = (confirm: string, password: string) => {
    if (confirm.length === 0) {
      setConfirmPasswordError(null);
      return false;
    }
    if (confirm !== password) {
      setConfirmPasswordError('Las contraseñas no coinciden');
      return false;
    }
    setConfirmPasswordError(null);
    return true;
  };

  const handleInputChange = (field: keyof RegisterData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);

    if (field === 'name') {
      validateName(value);
    } else if (field === 'email') {
      validateEmail(value);
    } else if (field === 'phone') {
      validatePhone(value);
    } else if (field === 'password') {
      validatePasswordRealTime(value);
      if (confirmPassword.length > 0) {
        validateConfirmPassword(confirmPassword, value);
      }
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    validateConfirmPassword(value, formData.password);
  };

  const validateForm = (): boolean => {
    if (!validateName(formData.name) || formData.name.length < 3) {
      setError('El nombre debe tener al menos 3 caracteres');
      return false;
    }
    if (formData.name.length > 255) {
      setError('El nombre no puede exceder 255 caracteres');
      return false;
    }

    if (!validateEmail(formData.email)) {
      setError(emailError || 'El email debe ser de Gmail (@gmail.com)');
      return false;
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      setError(phoneError || 'El teléfono debe tener exactamente 10 dígitos');
      return false;
    }

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      setError('La contraseña debe tener mayúscula, minúscula, número y caracteres especiales');
      return false;
    }

    if (!validateConfirmPassword(confirmPassword, formData.password)) {
      setError(confirmPasswordError || 'Las contraseñas no coinciden');
      return false;
    }

    return true;
  };

  const validatePassword = (password: string) => {
    const hasNumber = /\d/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const minLength = password.length >= 6;
    const maxLength = password.length <= 180;

    return {
      hasNumber,
      hasUpperCase,
      hasLowerCase,
      hasSpecialChar,
      minLength,
      maxLength,
      isValid: minLength && maxLength && hasNumber && hasUpperCase && hasLowerCase && hasSpecialChar
    };
  };

  const passwordValidation = validatePassword(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      setShowErrorAlert(true);
      return;
    }

    // 🔹 Validar que haya token de hCaptcha
    if (!formData.hCaptchaToken) {
      setHCaptchaError('Por favor completa el captcha antes de continuar.');
      setShowErrorAlert(true);
      return;
    }

    setIsLoading(true);

    try {
      const registerData: RegisterData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        hCaptchaToken: formData.hCaptchaToken, // 👈 se envía al backend
        ...(formData.phone && { phone: formData.phone }),
        ...(formData.gender && { gender: formData.gender }),
      };

      await authService.register(registerData);
      authService.removeToken();
      const registeredEmail = formData.email;

      // Limpiar el formulario
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        gender: '',
        hCaptchaToken: '', // 👈 limpiamos el token también
      });
      setConfirmPassword('');
      setShowSuccessAlert(true);

      setTimeout(() => {
        history.push('/verify-email', { email: registeredEmail });
      }, 100);
    } catch (err: any) {
      setError(err.message || 'Error al registrarse');
      setShowErrorAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessAlert(false);
  };

  return (
    <IonPage className="register-page">
      <IonHeader>
        <IonToolbar className="auth-toolbar">
          <IonButton fill="clear" slot="start" onClick={() => history.push('/login')} className="back-button">
            <IonIcon icon={logIn} />
          </IonButton>
          <IonTitle className="auth-title">Registro</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="auth-content">
        <div className="auth-container">
          <div className="auth-header">
            <div className="pokeball-icon">⚡</div>
            <h1 className="auth-main-title">Únete a la aventura</h1>
            <p className="auth-subtitle">Crea tu cuenta y comienza a capturar Pokémon</p>
          </div>

          <IonCard className="auth-card">
            <IonCardContent>
              <form onSubmit={handleSubmit}>
                {/* Nombre */}
                <IonItem className="auth-input-item" lines="none">
                  <IonLabel position="stacked" className="auth-label">
                    <IonIcon icon={person} className="label-icon" />
                    Nombre
                  </IonLabel>
                  <IonInput
                    type="text"
                    value={formData.name}
                    onIonInput={(e) => handleInputChange('name', e.detail.value || '')}
                    placeholder="Tu nombre completo"
                    required
                    className={`auth-input ${nameError ? 'input-error' : ''}`}
                    maxlength={255}
                  />
                  {nameError && (
                    <IonText color="danger" style={{ fontSize: '12px', marginTop: '4px', display: 'block', paddingLeft: '16px' }}>
                      {nameError}
                    </IonText>
                  )}
                </IonItem>

                {/* Email */}
                <IonItem className="auth-input-item" lines="none">
                  <IonLabel position="stacked" className="auth-label">
                    <IonIcon icon={mail} className="label-icon" />
                    Email
                  </IonLabel>
                  <IonInput
                    type="email"
                    value={formData.email}
                    onIonInput={(e) => handleInputChange('email', e.detail.value || '')}
                    placeholder="tu@gmail.com"
                    required
                    className={`auth-input ${emailError ? 'input-error' : ''}`}
                  />
                  {emailError && (
                    <IonText color="danger" style={{ fontSize: '12px', marginTop: '4px', display: 'block', paddingLeft: '16px' }}>
                      {emailError}
                    </IonText>
                  )}
                  {!emailError && formData.email.length > 0 && formData.email.toLowerCase().endsWith('@gmail.com') && (
                    <IonText color="success" style={{ fontSize: '12px', marginTop: '4px', display: 'block', paddingLeft: '16px' }}>
                      ✓ Email válido
                    </IonText>
                  )}
                </IonItem>

                {/* Teléfono */}
                <IonItem className="auth-input-item" lines="none">
                  <IonLabel position="stacked" className="auth-label">
                    <IonIcon icon={call} className="label-icon" />
                    Teléfono (Opcional)
                  </IonLabel>
                  <IonInput
                    type="tel"
                    value={formData.phone}
                    onIonInput={(e) => handleInputChange('phone', e.detail.value || '')}
                    placeholder="1234567890"
                    className={`auth-input ${phoneError ? 'input-error' : ''}`}
                    maxlength={20}
                  />
                  {phoneError && (
                    <IonText color="danger" style={{ fontSize: '12px', marginTop: '4px', display: 'block', paddingLeft: '16px' }}>
                      {phoneError}
                    </IonText>
                  )}
                  {!phoneError && formData.phone && formData.phone.length > 0 && formData.phone.replace(/\D/g, '').length === 10 && (
                    <IonText color="success" style={{ fontSize: '12px', marginTop: '4px', display: 'block', paddingLeft: '16px' }}>
                      ✓ Teléfono válido (10 dígitos)
                    </IonText>
                  )}
                </IonItem>

                {/* Género */}
                <IonItem className="auth-input-item" lines="none">
                  <IonLabel position="stacked" className="auth-label">
                    <IonIcon icon={personOutline} className="label-icon" />
                    Género (Opcional)
                  </IonLabel>
                  <IonSelect
                    value={formData.gender}
                    onIonChange={(e) => handleInputChange('gender', e.detail.value)}
                    placeholder="Selecciona tu género"
                    interface="action-sheet"
                    className="auth-select"
                  >
                    <IonSelectOption value="Masculino">Masculino</IonSelectOption>
                    <IonSelectOption value="Femenino">Femenino</IonSelectOption>
                    <IonSelectOption value="Otro">Otro</IonSelectOption>
                  </IonSelect>
                </IonItem>

                {/* Contraseña */}
                <IonItem className="auth-input-item" lines="none">
                  <IonLabel position="stacked" className="auth-label">
                    <IonIcon icon={lockClosed} className="label-icon" />
                    Contraseña
                  </IonLabel>
                  <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
                    <IonInput
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onIonInput={(e) => handleInputChange('password', e.detail.value || '')}
                      placeholder="Contraseña"
                      required
                      className="auth-input"
                      style={{ flex: '1', paddingRight: '45px' }}
                      maxlength={180}
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
                  {formData.password.length > 0 && (
                    <div style={{ paddingLeft: '16px', marginTop: '8px', fontSize: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', color: passwordErrors.hasUpperCase ? '#10b981' : '#ef4444' }}>
                        {passwordErrors.hasUpperCase ? '✓' : '✗'} Mayúscula
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', color: passwordErrors.hasLowerCase ? '#10b981' : '#ef4444' }}>
                        {passwordErrors.hasLowerCase ? '✓' : '✗'} Minúscula
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', color: passwordErrors.hasNumber ? '#10b981' : '#ef4444' }}>
                        {passwordErrors.hasNumber ? '✓' : '✗'} Número
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', color: passwordErrors.hasSpecialChar ? '#10b981' : '#ef4444' }}>
                        {passwordErrors.hasSpecialChar ? '✓' : '✗'} Carácter especial
                      </div>
                    </div>
                  )}
                </IonItem>

                {/* Confirmar contraseña */}
                <IonItem className="auth-input-item" lines="none">
                  <IonLabel position="stacked" className="auth-label">
                    <IonIcon icon={lockClosed} className="label-icon" />
                    Confirmar Contraseña
                  </IonLabel>
                  <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
                    <IonInput
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onIonInput={(e) => handleConfirmPasswordChange(e.detail.value || '')}
                      placeholder="Repite tu contraseña"
                      required
                      className={`auth-input ${confirmPasswordError ? 'input-error' : ''}`}
                      style={{ flex: '1', paddingRight: '45px' }}
                    />
                    <IonButton
                      fill="clear"
                      size="small"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowConfirmPassword(!showConfirmPassword);
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
                      <IonIcon icon={showConfirmPassword ? eyeOff : eye} />
                    </IonButton>
                  </div>
                  {confirmPasswordError && (
                    <IonText color="danger" style={{ fontSize: '12px', marginTop: '4px', display: 'block', paddingLeft: '16px' }}>
                      {confirmPasswordError}
                    </IonText>
                  )}
                  {!confirmPasswordError && confirmPassword.length > 0 && confirmPassword === formData.password && (
                    <IonText color="success" style={{ fontSize: '12px', marginTop: '4px', display: 'block', paddingLeft: '16px' }}>
                      ✓ Las contraseñas coinciden
                    </IonText>
                  )}
                </IonItem>

                {/* 🔹 hCaptcha */}
                <HCaptchaComponent
                  siteKey={HCAPTCHA_SITE_KEY}
                  onTokenChange={(token) => {
                    setFormData((prev) => ({
                      ...prev,
                      hCaptchaToken: token || '',
                    }));
                    if (token) setHCaptchaError(null);
                  }}
                  onErrorChange={(msg) => setHCaptchaError(msg)}
                />

                {hCaptchaError && (
                  <IonText color="danger" className="error-text">
                    <p>{hCaptchaError}</p>
                  </IonText>
                )}

                {/* Error general */}
                {error && (
                  <IonText color="danger" className="error-text">
                    <p>{error}</p>
                  </IonText>
                )}

                {/* Botón de enviar */}
                <IonButton
                  type="submit"
                  expand="block"
                  className="auth-submit-button"
                  disabled={
                    isLoading ||
                    !formData.name ||
                    !formData.email ||
                    !formData.password ||
                    !confirmPassword ||
                    !formData.hCaptchaToken // 👈 no deja registrar sin captcha
                  }
                >
                  {isLoading ? <IonSpinner name="crescent" /> : (
                    <>
                      <IonIcon icon={person} slot="start" />
                      Crear Cuenta
                    </>
                  )}
                </IonButton>
              </form>
            </IonCardContent>
          </IonCard>

          <div className="auth-footer">
            <IonText className="auth-footer-text">
              ¿Ya tienes cuenta?{' '}
              <IonButton fill="clear" size="small" onClick={() => history.push('/login')} className="auth-link-button">
                Inicia sesión aquí
              </IonButton>
            </IonText>
          </div>
        </div>
      </IonContent>

      <IonAlert
        isOpen={showErrorAlert}
        onDidDismiss={() => setShowErrorAlert(false)}
        header="Error"
        message={error || 'Ocurrió un error'}
        buttons={['OK']}
      />

      <IonAlert
        isOpen={showSuccessAlert}
        onDidDismiss={handleSuccessClose}
        header="¡Registro Exitoso!"
        message="Tu cuenta ha sido creada. Hemos enviado un código de verificación de 6 dígitos a tu email. Serás redirigido a la página de verificación..."
        buttons={['OK']}
      />
    </IonPage>
  );
};

export default Register;