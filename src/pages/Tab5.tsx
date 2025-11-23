// src/pages/Tab5.tsx
import React, { useState, useEffect } from 'react';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonAvatar, IonButton, IonIcon, IonItem, IonLabel,
  IonInput, IonSelect, IonSelectOption, IonModal,
  IonList, IonAlert, IonChip, IonBadge, IonSpinner, IonText
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
  saveOutline,
  shieldCheckmark,
  ban,
  calendar,
  time
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import authService, { User } from '../services/authService';
import offlineCache from '../services/offlineCache';
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
  const history = useHistory();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    phone: '',
    gender: 'male',
    trainerImage: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png',
    trainerId: 1
  });

  const [editProfile, setEditProfile] = useState<UserProfile>(profile);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

  // Cargar perfil al montar
  useEffect(() => {
    loadProfile();
  }, []);

  // Detectar cambios en la conexión
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    setError(null);
    
    // Si no hay internet, intentar cargar del caché
    if (!offlineCache.isOnline()) {
      const cachedProfile = offlineCache.getProfile();
      if (cachedProfile) {
        setUser(cachedProfile);
        const profileData: UserProfile = {
          name: cachedProfile.name,
          email: cachedProfile.email,
          phone: cachedProfile.phone || '',
          gender: (cachedProfile.gender?.toLowerCase() as 'male' | 'female' | 'other') || 'male',
          trainerImage: trainerImages[cachedProfile.id % trainerImages.length],
          trainerId: cachedProfile.id
        };
        setProfile(profileData);
        setEditProfile(profileData);
        setIsLoading(false);
        return;
      } else {
        setError('Sin conexión a internet y no hay datos en caché');
        setIsLoading(false);
        return;
      }
    }
    
    try {
      const userData = await authService.getProfile();
      setUser(userData);
      
      // Convertir datos del API al formato del componente
      const profileData: UserProfile = {
        name: userData.name,
        email: userData.email,
        phone: userData.phone || '',
        gender: (userData.gender?.toLowerCase() as 'male' | 'female' | 'other') || 'male',
        trainerImage: trainerImages[userData.id % trainerImages.length],
        trainerId: userData.id
      };
      
      setProfile(profileData);
      setEditProfile(profileData);
    } catch (err: any) {
      // Si falla la conexión, intentar usar el caché
      if (err.message?.includes('No se pudo conectar') || err.message === 'Failed to fetch') {
        const cachedProfile = offlineCache.getProfile();
        if (cachedProfile) {
          setUser(cachedProfile);
          const profileData: UserProfile = {
            name: cachedProfile.name,
            email: cachedProfile.email,
            phone: cachedProfile.phone || '',
            gender: (cachedProfile.gender?.toLowerCase() as 'male' | 'female' | 'other') || 'male',
            trainerImage: trainerImages[cachedProfile.id % trainerImages.length],
            trainerId: cachedProfile.id
          };
          setProfile(profileData);
          setEditProfile(profileData);
          setError('Modo offline: mostrando datos guardados');
          return;
        }
      }
      setError(err.message || 'Error al cargar el perfil');
      // Si no está autenticado, redirigir a login
      if (err.message === 'No autenticado') {
        history.push('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const changeTrainerImage = () => {
    const randomIndex = Math.floor(Math.random() * trainerImages.length);
    setEditProfile({
      ...editProfile,
      trainerImage: trainerImages[randomIndex],
      trainerId: randomIndex
    });
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      const updateData: any = {};
      if (editProfile.name !== profile.name) updateData.name = editProfile.name;
      if (editProfile.email !== profile.email) updateData.email = editProfile.email;
      if (editProfile.phone !== profile.phone) updateData.phone = editProfile.phone;
      if (editProfile.gender !== profile.gender) {
        updateData.gender = editProfile.gender === 'male' ? 'Masculino' : 
                           editProfile.gender === 'female' ? 'Femenino' : 'Otro';
      }

      const response = await authService.updateProfile(user.id, updateData);
      
      // Actualizar perfil local
      setProfile(editProfile);
      if (response.entrenador) {
        setUser(response.entrenador);
      }
      
      setShowEditModal(false);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditProfile(profile);
    setShowEditModal(false);
  };

  const handleLogout = () => {
    setShowLogoutAlert(true);
  };

  const confirmLogout = async () => {
    try {
      await authService.logout();
      history.push('/login');
    } catch (err: any) {
      console.error('Error al cerrar sesión:', err);
      // Aún así redirigir a login
      history.push('/login');
    }
  };

  return (
    <IonPage className="profile-page">
      <IonHeader>
        <IonToolbar style={{ '--background': '#dc2626' }}>
          <IonTitle style={{ color: 'white', fontWeight: 'bold' }}>Mi Perfil</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ '--background': '#f1f5f9' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <IonSpinner name="crescent" />
          </div>
        ) : error ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <IonText color="danger">
              <p>{error}</p>
            </IonText>
            <IonButton onClick={loadProfile} style={{ marginTop: '16px' }}>
              Reintentar
            </IonButton>
          </div>
        ) : (
          <>
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
                {user?.isVerified && (
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
                )}
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
                <IonLabel>{user?.role === 'profesor' ? 'Profesor Pokémon' : 'Entrenador Pokémon'}</IonLabel>
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
                    <p style={{ fontSize: '16px', color: '#1e293b', fontWeight: '600', margin: 0 }}>
                      {profile.phone || 'No especificado'}
                    </p>
                  </IonLabel>
                </IonItem>

                {profile.gender && (
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
                )}

                {/* Estado de verificación */}
                <IonItem style={{ '--padding-start': '20px', '--padding-end': '20px', '--min-height': '70px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: user?.isVerified ? '#d1fae5' : '#fee2e2',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: '16px'
                  }}>
                    <IonIcon icon={user?.isVerified ? checkmarkCircle : close} style={{ fontSize: '24px', color: user?.isVerified ? '#10b981' : '#ef4444' }} />
                  </div>
                  <IonLabel>
                    <h3 style={{ fontWeight: '700', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Estado de Verificación</h3>
                    <p style={{ fontSize: '16px', color: '#1e293b', fontWeight: '600', margin: 0 }}>
                      {user?.isVerified ? 'Cuenta Verificada' : 'Cuenta No Verificada'}
                    </p>
                  </IonLabel>
                </IonItem>

                {/* Estado de ban */}
                {user?.isBanned && (
                  <IonItem style={{ '--padding-start': '20px', '--padding-end': '20px', '--min-height': '70px', '--background': '#fee2e2' }}>
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
                      <IonIcon icon={ban} style={{ fontSize: '24px', color: '#ef4444' }} />
                    </div>
                    <IonLabel>
                      <h3 style={{ fontWeight: '700', color: '#991b1b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Estado de Cuenta</h3>
                      <p style={{ fontSize: '16px', color: '#991b1b', fontWeight: '600', margin: 0 }}>
                        Cuenta Baneada
                      </p>
                    </IonLabel>
                  </IonItem>
                )}

                {/* Fecha de creación */}
                {user?.createdAt && (
                  <IonItem style={{ '--padding-start': '20px', '--padding-end': '20px', '--min-height': '70px' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      backgroundColor: '#f3e8ff',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: '16px'
                    }}>
                      <IonIcon icon={calendar} style={{ fontSize: '24px', color: '#9333ea' }} />
                    </div>
                    <IonLabel>
                      <h3 style={{ fontWeight: '700', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Fecha de Registro</h3>
                      <p style={{ fontSize: '16px', color: '#1e293b', fontWeight: '600', margin: 0 }}>
                        {new Date(user.createdAt).toLocaleDateString('es-ES', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </IonLabel>
                  </IonItem>
                )}

                {/* Fecha de actualización */}
                {user?.updatedAt && (
                  <IonItem style={{ '--padding-start': '20px', '--padding-end': '20px', '--min-height': '70px', '--border-color': 'transparent' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      backgroundColor: '#fef3c7',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: '16px'
                    }}>
                      <IonIcon icon={time} style={{ fontSize: '24px', color: '#f59e0b' }} />
                    </div>
                    <IonLabel>
                      <h3 style={{ fontWeight: '700', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Última Actualización</h3>
                      <p style={{ fontSize: '16px', color: '#1e293b', fontWeight: '600', margin: 0 }}>
                        {new Date(user.updatedAt).toLocaleDateString('es-ES', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </IonLabel>
                  </IonItem>
                )}
              </IonList>
            </IonCardContent>
          </IonCard>

          {/* Botones de acción - Solo visibles cuando hay conexión */}
          {isOnline && (
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
          )}
            </div>
          </>
        )}

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

              {/* Error message */}
              {error && (
                <IonText color="danger" style={{ display: 'block', marginTop: '16px', textAlign: 'center' }}>
                  <p>{error}</p>
                </IonText>
              )}

              {/* Botones del modal */}
              <div style={{ padding: '20px 0', display: 'flex', gap: '12px' }}>
                <IonButton
                  expand="block"
                  fill="outline"
                  onClick={handleCancelEdit}
                  style={{ flex: 1 }}
                  disabled={isSaving}
                >
                  <IonIcon icon={close} slot="start" />
                  Cancelar
                </IonButton>
                <IonButton 
                  expand="block" 
                  onClick={handleSaveProfile}
                  style={{ flex: 1 }}
                  color="success"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <IonSpinner name="crescent" />
                  ) : (
                    <>
                      <IonIcon icon={saveOutline} slot="start" />
                      Guardar
                    </>
                  )}
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
