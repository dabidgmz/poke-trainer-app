// src/pages/Tab5.tsx
import React, { useState, useEffect } from 'react';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonAvatar, IonButton, IonIcon, IonItem, IonLabel,
  IonInput, IonSelect, IonSelectOption, IonModal,
  IonList, IonAlert, IonChip, IonBadge
} from '@ionic/react';
import { 
  person, 
  mail, 
  call, 
  male, 
  female, 
  create, 
  logOut,
  camera,
  checkmarkCircle,
  close,
  saveOutline
} from 'ionicons/icons';
import './Tab5.css';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  gender: 'male' | 'female' | 'other';
  trainerImage: string;
  trainerId: number;
}

const Tab5: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Ash Ketchum',
    email: 'ash@pokemon.com',
    phone: '+52 123 456 7890',
    gender: 'male',
    trainerImage: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png',
    trainerId: 1
  });

  const [editProfile, setEditProfile] = useState<UserProfile>(profile);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);

  // Imágenes de entrenadores
  const trainerImages = [
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png', // Pikachu
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png', // Charmander
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/7.png', // Squirtle
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png', // Bulbasaur
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png', // Charizard
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/9.png', // Blastoise
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png', // Mewtwo
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/151.png', // Mew
  ];

  const changeTrainerImage = () => {
    const randomIndex = Math.floor(Math.random() * trainerImages.length);
    setEditProfile({
      ...editProfile,
      trainerImage: trainerImages[randomIndex],
      trainerId: randomIndex
    });
  };

  const handleSaveProfile = () => {
    setProfile(editProfile);
    setShowEditModal(false);
  };

  const handleCancelEdit = () => {
    setEditProfile(profile);
    setShowEditModal(false);
  };

  const handleLogout = () => {
    setShowLogoutAlert(true);
  };

  const confirmLogout = () => {
    // Aquí irían las acciones de cierre de sesión
    console.log('Sesión cerrada');
    // Podrías redirigir o limpiar datos
  };

  return (
    <IonPage className="profile-page">
      <IonHeader>
        <IonToolbar style={{ '--background': '#dc2626' }}>
          <IonTitle style={{ color: 'white', fontWeight: 'bold' }}>Mi Perfil</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ '--background': '#f1f5f9' }}>
        {/* Header con foto de perfil */}
        <div style={{
          background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
          padding: '40px 20px 80px',
          textAlign: 'center',
          position: 'relative',
          marginBottom: '0'
        }}>
          <div style={{
            position: 'relative',
            display: 'inline-block',
            marginBottom: '16px'
          }}>
            <IonAvatar style={{
              width: '120px',
              height: '120px',
              margin: '0 auto',
              border: '4px solid white',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
            }}>
              <img src={profile.trainerImage} alt="Trainer" />
            </IonAvatar>
            <div style={{
              position: 'absolute',
              bottom: '0',
              right: '0',
              backgroundColor: '#10b981',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              border: '3px solid white',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
            }}>
              <IonIcon icon={checkmarkCircle} style={{ fontSize: '20px', color: 'white' }} />
            </div>
          </div>

          <h2 style={{
            color: 'white',
            fontSize: '28px',
            fontWeight: 'bold',
            marginBottom: '4px',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
          }}>
            {profile.name}
          </h2>
          
          <IonChip style={{
            '--background': 'rgba(255, 255, 255, 0.2)',
            '--color': 'white',
            fontWeight: '600',
            backdropFilter: 'blur(10px)'
          }}>
            <IonIcon icon={person} />
            <IonLabel>Entrenador Pokémon</IonLabel>
          </IonChip>
        </div>

        {/* Información del perfil */}
        <div style={{ padding: '0 16px', marginTop: '-50px', paddingBottom: '100px' }}>
          <IonCard style={{
            borderRadius: '20px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
            backgroundColor: 'white',
            overflow: 'hidden'
          }}>
            <IonCardHeader style={{ 
              background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
              padding: '20px'
            }}>
              <IonCardTitle style={{ fontSize: '22px', color: 'white', fontWeight: 'bold' }}>
                Información Personal
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent style={{ padding: '0' }}>
              <IonList style={{ background: 'white' }}>
                <IonItem style={{ '--padding-start': '20px', '--padding-end': '20px', '--min-height': '70px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: '#dbeafe',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: '16px'
                  }}>
                    <IonIcon icon={person} style={{ fontSize: '24px', color: '#3b82f6' }} />
                  </div>
                  <IonLabel>
                    <h3 style={{ fontWeight: '700', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Nombre</h3>
                    <p style={{ fontSize: '18px', color: '#1e293b', fontWeight: '600', margin: 0 }}>{profile.name}</p>
                  </IonLabel>
                </IonItem>

                <IonItem style={{ '--padding-start': '20px', '--padding-end': '20px', '--min-height': '70px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: '#fee2e2',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: '16px'
                  }}>
                    <IonIcon icon={mail} style={{ fontSize: '24px', color: '#ef4444' }} />
                  </div>
                  <IonLabel>
                    <h3 style={{ fontWeight: '700', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Email</h3>
                    <p style={{ fontSize: '16px', color: '#1e293b', fontWeight: '600', margin: 0 }}>{profile.email}</p>
                  </IonLabel>
                </IonItem>

                <IonItem style={{ '--padding-start': '20px', '--padding-end': '20px', '--min-height': '70px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: '#d1fae5',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: '16px'
                  }}>
                    <IonIcon icon={call} style={{ fontSize: '24px', color: '#10b981' }} />
                </div>
                  <IonLabel>
                    <h3 style={{ fontWeight: '700', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Teléfono</h3>
                    <p style={{ fontSize: '16px', color: '#1e293b', fontWeight: '600', margin: 0 }}>{profile.phone}</p>
                  </IonLabel>
                </IonItem>

                <IonItem style={{ '--padding-start': '20px', '--padding-end': '20px', '--min-height': '70px', '--border-color': 'transparent' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: profile.gender === 'male' ? '#dbeafe' : '#fce7f3',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: '16px'
                  }}>
                    <IonIcon 
                      icon={profile.gender === 'male' ? male : female} 
                      style={{ fontSize: '24px', color: profile.gender === 'male' ? '#3b82f6' : '#ec4899' }} 
                    />
              </div>
                  <IonLabel>
                    <h3 style={{ fontWeight: '700', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Género</h3>
                    <p style={{ fontSize: '18px', color: '#1e293b', fontWeight: '600', margin: 0 }}>
                      {profile.gender === 'male' ? 'Masculino' : profile.gender === 'female' ? 'Femenino' : 'Otro'}
                    </p>
                  </IonLabel>
                </IonItem>
              </IonList>
            </IonCardContent>
          </IonCard>

          {/* Botones de acción */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px', marginBottom: '20px' }}>
            <IonButton
              expand="block"
              onClick={() => {
                setEditProfile(profile);
                setShowEditModal(true);
              }}
              style={{
                '--background': 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                '--border-radius': '16px',
                '--padding-top': '16px',
                '--padding-bottom': '16px',
                '--box-shadow': '0 6px 20px rgba(59, 130, 246, 0.4)',
                fontSize: '17px',
                fontWeight: 'bold',
                height: '56px'
              }}
            >
              <IonIcon icon={create} slot="start" style={{ fontSize: '22px' }} />
              Editar Perfil
            </IonButton>

            <IonButton
              expand="block"
              onClick={handleLogout}
              style={{
                '--background': 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                '--border-radius': '16px',
                '--padding-top': '16px',
                '--padding-bottom': '16px',
                '--box-shadow': '0 6px 20px rgba(239, 68, 68, 0.4)',
                fontSize: '17px',
                fontWeight: 'bold',
                height: '56px'
              }}
            >
              <IonIcon icon={logOut} slot="start" style={{ fontSize: '22px' }} />
              Cerrar Sesión
            </IonButton>
          </div>

        </div>

        {/* Modal de edición */}
        <IonModal isOpen={showEditModal} onDidDismiss={() => setShowEditModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Editar Perfil</IonTitle>
              <IonButton slot="end" fill="clear" onClick={handleCancelEdit}>
                <IonIcon icon={close} />
              </IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '20px' }}>
              {/* Cambiar foto */}
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <IonAvatar style={{
                  width: '100px',
                  height: '100px',
                  margin: '0 auto 16px',
                  border: '3px solid #dc2626'
                }}>
                  <img src={editProfile.trainerImage} alt="Trainer" />
                </IonAvatar>
                <IonButton size="small" fill="outline" onClick={changeTrainerImage}>
                  <IonIcon icon={camera} slot="start" />
                  Cambiar Imagen
                </IonButton>
              </div>

              {/* Formulario */}
              <IonList>
          <IonItem>
                  <IonLabel position="stacked">
                    <IonIcon icon={person} style={{ marginRight: '8px' }} />
                    Nombre
                    </IonLabel>
                  <IonInput
                    value={editProfile.name}
                    onIonInput={(e) => setEditProfile({ ...editProfile, name: e.detail.value! })}
                    placeholder="Tu nombre"
                  />
                  </IonItem>
                  
          <IonItem>
                  <IonLabel position="stacked">
                    <IonIcon icon={mail} style={{ marginRight: '8px' }} />
                    Email
                    </IonLabel>
                  <IonInput
                    type="email"
                    value={editProfile.email}
                    onIonInput={(e) => setEditProfile({ ...editProfile, email: e.detail.value! })}
                    placeholder="tu@email.com"
                  />
                  </IonItem>
                  
          <IonItem>
                  <IonLabel position="stacked">
                    <IonIcon icon={call} style={{ marginRight: '8px' }} />
                    Teléfono
                    </IonLabel>
                  <IonInput
                    type="tel"
                    value={editProfile.phone}
                    onIonInput={(e) => setEditProfile({ ...editProfile, phone: e.detail.value! })}
                    placeholder="+52 123 456 7890"
                  />
                  </IonItem>
                  
            <IonItem>
                    <IonLabel>
                    <IonIcon icon={editProfile.gender === 'male' ? male : female} style={{ marginRight: '8px' }} />
                    Género
                    </IonLabel>
                  <IonSelect
                    value={editProfile.gender}
                    onIonChange={(e) => setEditProfile({ ...editProfile, gender: e.detail.value })}
                    interface="action-sheet"
                  >
                    <IonSelectOption value="male">Masculino</IonSelectOption>
                    <IonSelectOption value="female">Femenino</IonSelectOption>
                    <IonSelectOption value="other">Otro</IonSelectOption>
                  </IonSelect>
                  </IonItem>
        </IonList>

              {/* Botones del modal */}
              <div style={{ padding: '20px 0', display: 'flex', gap: '12px' }}>
                <IonButton
                  expand="block"
                  fill="outline"
                  onClick={handleCancelEdit}
                  style={{ flex: 1 }}
                >
                  <IonIcon icon={close} slot="start" />
                  Cancelar
                </IonButton>
                    <IonButton 
            expand="block" 
                  onClick={handleSaveProfile}
                  style={{ flex: 1 }}
                  color="success"
                >
                  <IonIcon icon={saveOutline} slot="start" />
                  Guardar
                    </IonButton>
              </div>
        </div>
          </IonContent>
        </IonModal>

        {/* Alerta de cierre de sesión */}
        <IonAlert
          isOpen={showLogoutAlert}
          onDidDismiss={() => setShowLogoutAlert(false)}
          header="Cerrar Sesión"
          message="¿Estás seguro que deseas cerrar sesión?"
          buttons={[
            {
              text: 'Cancelar',
              role: 'cancel'
            },
            {
              text: 'Cerrar Sesión',
              role: 'destructive',
              handler: confirmLogout
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Tab5;
