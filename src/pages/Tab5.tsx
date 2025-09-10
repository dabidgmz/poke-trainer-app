import React, { useState } from 'react';
import { 
  IonContent, 
  IonHeader, 
  IonPage, 
  IonTitle, 
  IonToolbar, 
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonAvatar,
  IonIcon,
  IonButton,
  IonInput
} from '@ionic/react';
import { 
  person, 
  mail, 
  calendar, 
  location, 
  create,
  close,
  checkmarkCircle,
  flame,
  water,
  leaf,
  flash
} from 'ionicons/icons';
import './Tab5.css';

interface TrainerProfile {
  name: string;
  email: string;
  birthDate: string;
  location: string;
  level: number;
  experience: number;
  badges: number;
  pokemonCaught: number;
  favoriteType: string;
  joinDate: string;
  avatar: string;
}

const Tab5: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<TrainerProfile>({
    name: 'Ash Ketchum',
    email: 'ash.ketchum@pokemon.com',
    birthDate: '1996-05-22',
    location: 'Pallet Town, Kanto',
    level: 25,
    experience: 12500,
    badges: 8,
    pokemonCaught: 127,
    favoriteType: 'electric',
    joinDate: '2020-01-15',
    avatar: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png'
  });

  const [editProfile, setEditProfile] = useState<TrainerProfile>(profile);

  const handleEdit = () => {
    setEditProfile(profile);
    setIsEditing(true);
  };

  const handleSave = () => {
    setProfile(editProfile);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditProfile(profile);
    setIsEditing(false);
  };

  const handleInputChange = (field: keyof TrainerProfile, value: string) => {
    setEditProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      electric: '#f59e0b',
      fire: '#ef4444',
      water: '#3b82f6',
      grass: '#10b981',
      dragon: '#7c3aed',
      psychic: '#f472b6',
      normal: '#6b7280',
      fighting: '#dc2626',
      flying: '#8b5cf6',
      poison: '#a855f7',
      ground: '#d97706',
      rock: '#78716c',
      bug: '#84cc16',
      ghost: '#6366f1',
      steel: '#64748b',
      ice: '#06b6d4',
      fairy: '#ec4899',
      dark: '#374151'
    };
    return colors[type] || '#6b7280';
  };

  const getTypeIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      electric: flash,
      fire: flame,
      water: water,
      grass: leaf,
      default: flash
    };
    return icons[type] || icons.default;
  };


  return (
    <IonPage className="profile-page">
      <IonHeader className="profile-header">
        <IonToolbar className="profile-toolbar">
          <IonTitle className="profile-title">
            <div className="profile-header-content">
              <div className="profile-logo">
                <div className="trainer-icon"></div>
              </div>
              <span className="profile-text">MI PERFIL</span>
            </div>
          </IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="profile-content">
        <div className="profile-body">
          {/* Información principal del entrenador */}
          <IonCard className="main-profile-card">
            <IonCardContent>
              <div className="profile-main-info">
                <div className="avatar-section">
                  <IonAvatar className="trainer-avatar">
                    <img src={profile.avatar} alt="Avatar del entrenador" />
                  </IonAvatar>
                  <div className="level-badge">
                    <span className="level-number">{profile.level}</span>
                  </div>
                </div>
                
                <div className="trainer-details">
                  <h1 className="trainer-name">{profile.name}</h1>
                  <p className="trainer-location">
                    <IonIcon icon={location} />
                    {profile.location}
                  </p>
                  
                </div>
              </div>
            </IonCardContent>
          </IonCard>


          {/* Información personal */}
          <IonCard className="info-card">
            <IonCardHeader>
              <IonCardTitle>Información Personal</IonCardTitle>
              <IonButton 
                className="edit-btn" 
                fill="clear" 
                onClick={handleEdit}
                disabled={isEditing}
              >
                <IonIcon icon={create} slot="start" />
                Editar
              </IonButton>
            </IonCardHeader>
            <IonCardContent>
              {!isEditing ? (
                <div className="info-display">
                  <IonItem className="info-item">
                    <IonIcon icon={person} slot="start" />
                    <IonLabel>
                      <h3>Nombre</h3>
                      <p>{profile.name}</p>
                    </IonLabel>
                  </IonItem>
                  
                  <IonItem className="info-item">
                    <IonIcon icon={mail} slot="start" />
                    <IonLabel>
                      <h3>Email</h3>
                      <p>{profile.email}</p>
                    </IonLabel>
                  </IonItem>
                  
                  <IonItem className="info-item">
                    <IonIcon icon={calendar} slot="start" />
                    <IonLabel>
                      <h3>Fecha de Nacimiento</h3>
                      <p>{new Date(profile.birthDate).toLocaleDateString('es-ES')}</p>
                    </IonLabel>
                  </IonItem>
                  
                  <IonItem className="info-item">
                    <IonIcon icon={location} slot="start" />
                    <IonLabel>
                      <h3>Ubicación</h3>
                      <p>{profile.location}</p>
                    </IonLabel>
                  </IonItem>
                  
                  <IonItem className="info-item">
                    <IonIcon icon={calendar} slot="start" />
                    <IonLabel>
                      <h3>Miembro desde</h3>
                      <p>{new Date(profile.joinDate).toLocaleDateString('es-ES')}</p>
                    </IonLabel>
                  </IonItem>
                  
                </div>
              ) : (
                <div className="info-edit">
                  <IonItem>
                    <IonLabel position="stacked">Nombre</IonLabel>
                    <IonInput
                      value={editProfile.name}
                      onIonInput={(e) => handleInputChange('name', e.detail.value!)}
                      placeholder="Ingresa tu nombre"
                    />
                  </IonItem>
                  
                  <IonItem>
                    <IonLabel position="stacked">Email</IonLabel>
                    <IonInput
                      type="email"
                      value={editProfile.email}
                      onIonInput={(e) => handleInputChange('email', e.detail.value!)}
                      placeholder="Ingresa tu email"
                    />
                  </IonItem>
                  
                  <IonItem>
                    <IonLabel position="stacked">Fecha de Nacimiento</IonLabel>
                    <IonInput
                      type="date"
                      value={editProfile.birthDate}
                      onIonInput={(e) => handleInputChange('birthDate', e.detail.value!)}
                    />
                  </IonItem>
                  
                  <IonItem>
                    <IonLabel position="stacked">Ubicación</IonLabel>
                    <IonInput
                      value={editProfile.location}
                      onIonInput={(e) => handleInputChange('location', e.detail.value!)}
                      placeholder="Ingresa tu ubicación"
                    />
                  </IonItem>
                  
                  <IonItem>
                    <IonLabel position="stacked">Tipo Favorito</IonLabel>
                    <IonInput
                      value={editProfile.favoriteType}
                      onIonInput={(e) => handleInputChange('favoriteType', e.detail.value!)}
                      placeholder="electric, fire, water, etc."
                    />
                  </IonItem>
                  
                  
                  <div className="edit-actions">
                    <IonButton 
                      className="save-btn" 
                      onClick={handleSave}
                      color="success"
                    >
                      <IonIcon icon={checkmarkCircle} slot="start" />
                      Guardar
                    </IonButton>
                    <IonButton 
                      className="cancel-btn" 
                      onClick={handleCancel}
                      fill="outline"
                    >
                      <IonIcon icon={close} slot="start" />
                      Cancelar
                    </IonButton>
                  </div>
                </div>
              )}
            </IonCardContent>
          </IonCard>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default Tab5;
