import React, { useState, useEffect } from 'react';
import { IonButton, IonIcon, IonAvatar, IonSpinner } from '@ionic/react';
import { person } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import authService from '../services/authService';
import './ProfileButton.css';

interface ProfileButtonProps {
  className?: string;
}

const ProfileButton: React.FC<ProfileButtonProps> = ({ className }) => {
  const history = useHistory();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userData = await authService.getProfile();
        setUser(userData);
        // Si el usuario tiene una foto de perfil, se puede obtener aquí
        // Por ahora, usamos null ya que la API no retorna foto de perfil
        setProfileImage(null);
      } catch (error) {
        console.error('Error cargando perfil:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (authService.isAuthenticated()) {
      loadProfile();
    }
  }, []);

  const handleClick = () => {
    history.push('/tab5');
  };

  if (isLoading) {
    return (
      <IonButton
        fill="clear"
        slot="end"
        className={className}
        onClick={handleClick}
      >
        <IonSpinner name="crescent" style={{ width: '24px', height: '24px' }} />
      </IonButton>
    );
  }

  return (
    <IonButton
      fill="clear"
      slot="end"
      className={`profile-button ${className || ''}`}
      onClick={handleClick}
    >
      {profileImage ? (
        <IonAvatar style={{ width: '32px', height: '32px' }}>
          <img src={profileImage} alt={user?.name || 'Perfil'} />
        </IonAvatar>
      ) : (
        <div className="profile-button-content">
          <IonIcon icon={person} style={{ fontSize: '24px' }} />
          <span className="profile-button-text">Perfil</span>
        </div>
      )}
    </IonButton>
  );
};

export default ProfileButton;

