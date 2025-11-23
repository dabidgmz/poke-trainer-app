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
import authService, { RegisterData } from '../services/authService';
import './Register.css';

const Register: React.FC = () => {
  const history = useHistory();
  const [formData, setFormData] = useState<RegisterData>({
    name: '',
    email: '',
    password: '',
    phone: '',
    gender: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (field: keyof RegisterData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateForm = (): boolean => {
    // Validación de nombre: mínimo 2 caracteres, máximo 255 caracteres
    if (formData.name.length < 2) {
      setError('El nombre debe tener al menos 2 caracteres');
      return false;
    }
    if (formData.name.length > 255) {
      setError('El nombre no puede exceder 255 caracteres');
      return false;
    }

    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Por favor ingresa un email válido');
      return false;
    }

    // Validación de contraseña: mínimo 6 caracteres, máximo 180 caracteres
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    if (formData.password.length > 180) {
      setError('La contraseña no puede exceder 180 caracteres');
      return false;
    }

    // Validación de teléfono: máximo 20 caracteres (si se proporciona)
    if (formData.phone && formData.phone.length > 20) {
      setError('El teléfono no puede exceder 20 caracteres');
      return false;
    }

    // Validación de género: máximo 20 caracteres (si se proporciona)
    if (formData.gender && formData.gender.length > 20) {
      setError('El género no puede exceder 20 caracteres');
      return false;
    }

    // Validación de confirmación de contraseña
    if (formData.password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
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

    setIsLoading(true);

    try {
      const registerData: RegisterData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        ...(formData.phone && { phone: formData.phone }),
        ...(formData.gender && { gender: formData.gender }),
      };

      await authService.register(registerData);
      // Asegurar que no haya token guardado después del registro
      authService.removeToken();
      // Guardar el email antes de limpiar el formulario
      const registeredEmail = formData.email;
      // Limpiar el formulario después del registro exitoso
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        gender: '',
      });
      setConfirmPassword('');
      setShowSuccessAlert(true);
      // Guardar el email en el estado para usarlo después
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
    // El email ya se pasó en handleSubmit, solo cerrar el alert
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
                <IonItem className="auth-input-item" lines="none">
                  <IonLabel position="stacked" className="auth-label">
                    <IonIcon icon={person} className="label-icon" />
                    Nombre
                  </IonLabel>
                  <IonInput
                    type="text"
                    value={formData.name}
                    onIonInput={(e) => handleInputChange('name', e.detail.value!)}
                    placeholder="Tu nombre completo"
                    required
                    className="auth-input"
                    maxlength={255}
                  />
                </IonItem>

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

                <IonItem className="auth-input-item" lines="none">
                  <IonLabel position="stacked" className="auth-label">
                    <IonIcon icon={call} className="label-icon" />
                    Teléfono (Opcional)
                  </IonLabel>
                  <IonInput
                    type="tel"
                    value={formData.phone}
                    onIonInput={(e) => handleInputChange('phone', e.detail.value!)}
                    placeholder="+52 123 456 7890"
                    className="auth-input"
                    maxlength={20}
                  />
                </IonItem>

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
                </IonItem>


                <IonItem className="auth-input-item" lines="none">
                  <IonLabel position="stacked" className="auth-label">
                    <IonIcon icon={lockClosed} className="label-icon" />
                    Confirmar Contraseña
                  </IonLabel>
                  <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
                    <IonInput
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onIonInput={(e) => setConfirmPassword(e.detail.value!)}
                      placeholder="Repite tu contraseña"
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
                </IonItem>


                {error && (
                  <IonText color="danger" className="error-text">
                    <p>{error}</p>
                  </IonText>
                )}

                <IonButton
                  type="submit"
                  expand="block"
                  className="auth-submit-button"
                  disabled={isLoading || !formData.name || !formData.email || !formData.password || !confirmPassword}
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

      <IonAlert isOpen={showErrorAlert} onDidDismiss={() => setShowErrorAlert(false)} header="Error" message={error || 'Ocurrió un error'} buttons={['OK']} />

      <IonAlert
        isOpen={showSuccessAlert}
        onDidDismiss={() => setShowSuccessAlert(false)}
        header="¡Registro Exitoso!"
        message="Tu cuenta ha sido creada. Hemos enviado un código de verificación de 6 dígitos a tu email. Serás redirigido a la página de verificación..."
        buttons={['OK']}
      />
    </IonPage>
  );
};

export default Register;
