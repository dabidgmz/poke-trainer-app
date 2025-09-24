import React, { useEffect, useState } from 'react';
import { 
  IonPage,
  IonHeader, 
  IonToolbar,
  IonTitle, 
  IonContent,
  IonButton,
  IonCard,
  IonCardContent,
  IonText
} from '@ionic/react';
import { NativeBiometric, BiometryType } from "capacitor-native-biometric";

const Tab5: React.FC = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometry, setBiometry] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const checkBiometry = async () => {
      try {
        const result = await NativeBiometric.isAvailable();
        setIsAvailable(result.isAvailable);
        if (result.biometryType === BiometryType.FACE_ID) setBiometry('Face ID');
        else if (result.biometryType === BiometryType.FINGERPRINT) setBiometry('Fingerprint');
        else setBiometry('');
      } catch (err) {
        setIsAvailable(false);
        setBiometry('');
      }
    };
    checkBiometry();
  }, []);

  const performBiometricVerification = async () => {
    try {
      setMessage('');
      
      const result = await NativeBiometric.isAvailable();
      if (!result.isAvailable) {
        setMessage('Autenticación biométrica no disponible');
        return;
      }

      const isFaceID = result.biometryType === BiometryType.FACE_ID;

      const verified = await NativeBiometric.verifyIdentity({
        reason: "Para acceder a Pokémon Trainer App",
        title: "Autenticación",
        subtitle: "Pokémon Trainer App",
        description: "Usa tu huella dactilar o Face ID para acceder",
      })
        .then(() => true)
        .catch(() => false);

      if (!verified) {
        setMessage('Autenticación fallida');
        return;
      }

      setMessage('¡Autenticación exitosa!');
    } catch (err: any) {
      setMessage(`Fallo de autenticación${err?.message ? `: ${err.message}` : ''}`);
    }
  };

  const saveCredentials = async () => {
    try {
      setMessage('');
      await NativeBiometric.setCredentials({
        username: "username",
        password: "password",
        server: "pokeapptrainer.web.app",
      });
      setMessage('Credenciales guardadas exitosamente');
    } catch (err: any) {
      setMessage(`Error guardando credenciales${err?.message ? `: ${err.message}` : ''}`);
    }
  };


  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Seguridad</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonCard>
            <IonCardContent>
            <IonText>
              <p>Disponibilidad biométrica: {isAvailable ? 'Disponible' : 'No disponible'}</p>
              {biometry && <p>Tipo: {biometry}</p>}
            </IonText>
            <IonButton expand="block" onClick={performBiometricVerification} disabled={!isAvailable}>
              {biometry ? biometry : 'Autenticación biométrica'}
            </IonButton>
            
            <IonButton expand="block" fill="outline" onClick={saveCredentials} style={{ marginTop: 10 }}>
              Guardar Credenciales
            </IonButton>
            
            {message && (
              <IonText color={message.includes('exitosa') ? 'success' : 'danger'}>
                <p style={{ marginTop: 12 }}>{message}</p>
              </IonText>
            )}
            </IonCardContent>
          </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Tab5;