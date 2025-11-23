import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  IonContent, 
  IonHeader, 
  IonPage, 
  IonTitle, 
  IonToolbar, 
  IonItem, 
  IonList, 
  IonReorder, 
  IonReorderGroup, 
  IonChip,
  IonIcon,
  IonButton,
  IonGrid,
  IonRow,
  IonCol,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSpinner,
  IonAlert,
  IonText
} from '@ionic/react';
import { 
  ReorderEndCustomEvent 
} from '@ionic/react';
import { 
  flash, 
  shield, 
  speedometer,
  heart,
  swapHorizontal,
  add,
  folder,
  fingerPrint,
  lockClosed,
  lockOpen,
  keyOutline,
  scan,
  checkmarkCircle
} from 'ionicons/icons';
import { alertController } from '@ionic/core';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { NativeBiometric, BiometryType } from '@capgo/capacitor-native-biometric';
import { useHistory } from 'react-router-dom';
import authService from '../services/authService';
import ProfileButton from '../components/ProfileButton';
import OfflineMessage from '../components/OfflineMessage';
import offlineCache from '../services/offlineCache';
import './Tab3.css';

interface Pokemon {
  id: number;
  name: string;
  type: string;
  level: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  img: string;
  location: 'team' | 'pc';
  boxId?: number;
  instanceId?: number; // ID de la instancia del Pokémon en la API
}

interface Box {
  id: number;
  name: string;
  pokemon: Pokemon[];
}

interface TeamMember {
  id: number;
  pokemon: {
    id: number;
    pokeapiId: number;
    name: string;
    spriteUrl: string;
    types: string[];
    height: number;
    weight: number;
  };
  nickname: string | null;
  level: number;
  location: string;
  createdAt: string;
}

interface PCMember extends TeamMember {
  pcBox: number;
}

const Tab3: React.FC = () => {
  const history = useHistory();
  const [currentView, setCurrentView] = useState<'team' | 'pc'>('team');
  const [selectedBox, setSelectedBox] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [biometryAvailable, setBiometryAvailable] = useState(false);
  const [showBiometricAlert, setShowBiometricAlert] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamInfo, setTeamInfo] = useState<{ teamCount: number; maxTeamSize: number } | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [pokemonTeam, setPokemonTeam] = useState<Pokemon[]>([]);
  const [pcBoxes, setPcBoxes] = useState<Box[]>([
    { id: 0, name: 'Box 1', pokemon: [] },
    { id: 1, name: 'Box 2', pokemon: [] },
    { id: 2, name: 'Box 3', pokemon: [] }
  ]);

  // Función para calcular stats basados en el nivel
  const calculateStats = (level: number, baseStat: number = 50) => {
    return Math.floor(baseStat * (1 + (level - 1) * 0.1));
  };

  // Mapear datos de la API al formato del componente
  const mapTeamMemberToPokemon = (member: TeamMember): Pokemon => {
    const primaryType = member.pokemon.types[0] || 'normal';
    const level = member.level;
    const baseHp = 50 + (level * 5);
    const baseAttack = 40 + (level * 3);
    const baseDefense = 40 + (level * 3);
    const baseSpeed = 40 + (level * 3);

    return {
      id: member.id,
      instanceId: member.id,
      name: member.nickname || member.pokemon.name.charAt(0).toUpperCase() + member.pokemon.name.slice(1),
      type: primaryType,
      level: level,
      hp: baseHp,
      maxHp: baseHp,
      attack: baseAttack,
      defense: baseDefense,
      speed: baseSpeed,
      img: member.pokemon.spriteUrl,
      location: 'team'
    };
  };

  const mapPCMemberToPokemon = (member: PCMember, boxIndex: number): Pokemon => {
    const primaryType = member.pokemon.types[0] || 'normal';
    const level = member.level;
    const baseHp = 50 + (level * 5);
    const baseAttack = 40 + (level * 3);
    const baseDefense = 40 + (level * 3);
    const baseSpeed = 40 + (level * 3);

    return {
      id: member.id,
      instanceId: member.id,
      name: member.nickname || member.pokemon.name.charAt(0).toUpperCase() + member.pokemon.name.slice(1),
      type: primaryType,
      level: level,
      hp: baseHp,
      maxHp: baseHp,
      attack: baseAttack,
      defense: baseDefense,
      speed: baseSpeed,
      img: member.pokemon.spriteUrl,
      location: 'pc',
      boxId: boxIndex
    };
  };

  // Cargar datos del equipo y PC
  const loadData = async () => {
    setIsLoadingData(true);
    setError(null);
    
    try {
      // Cargar equipo
      const teamResponse = await authService.getTeam();
      const mappedTeam = teamResponse.team.map(mapTeamMemberToPokemon);
      setPokemonTeam(mappedTeam);
      setTeamInfo({
        teamCount: teamResponse.teamCount,
        maxTeamSize: teamResponse.maxTeamSize
      });

      // Cargar PC
      const pcResponse = await authService.getPC();
      const boxes: Box[] = [
    {
      id: 0,
      name: 'Box 1',
          pokemon: pcResponse.box1.map(m => mapPCMemberToPokemon(m as PCMember, 0))
    },
    {
      id: 1,
      name: 'Box 2',
          pokemon: pcResponse.box2.map(m => mapPCMemberToPokemon(m as PCMember, 1))
    },
    {
      id: 2,
      name: 'Box 3',
          pokemon: pcResponse.box3.map(m => mapPCMemberToPokemon(m as PCMember, 2))
    }
      ];
      setPcBoxes(boxes);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos');
      if (err.message === 'No autenticado') {
        history.push('/login');
      }
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleTeamReorder = (event: ReorderEndCustomEvent) => {
    const reorderedTeam = [...pokemonTeam];
    const [movedPokemon] = reorderedTeam.splice(event.detail.from, 1);
    reorderedTeam.splice(event.detail.to, 0, movedPokemon);
    setPokemonTeam(reorderedTeam);
    event.detail.complete();
  };

  const handlePcReorder = (event: ReorderEndCustomEvent) => {
    const currentBox = pcBoxes[selectedBox];
    const reorderedPokemon = [...currentBox.pokemon];
    const [movedPokemon] = reorderedPokemon.splice(event.detail.from, 1);
    reorderedPokemon.splice(event.detail.to, 0, movedPokemon);
    
    const updatedBoxes = [...pcBoxes];
    updatedBoxes[selectedBox].pokemon = reorderedPokemon;
    setPcBoxes(updatedBoxes);
    event.detail.complete();
  };

  const movePokemonToPc = async (pokemonId: number) => {
    const pokemon = pokemonTeam.find(p => p.instanceId === pokemonId);
    if (!pokemon) return;
    
    if (pokemonTeam.length <= 1) {
      const alert = await alertController.create({
        header: 'Error',
        message: 'Debes tener al menos 1 Pokémon en tu equipo',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    setIsLoading(true);
    try {
      const boxNumber = selectedBox + 1; // API usa 1, 2, 3
      await authService.movePokemon(pokemon.instanceId!, 'pc', boxNumber);
      await loadData(); // Recargar datos después del movimiento
    } catch (err: any) {
      const alert = await alertController.create({
        header: 'Error',
        message: err.message || 'Error al mover el Pokémon',
        buttons: ['OK']
      });
      await alert.present();
    } finally {
      setIsLoading(false);
    }
  };

  const movePokemonToTeam = async (pokemonId: number) => {
    if (pokemonTeam.length >= 6) {
      const alert = await alertController.create({
        header: 'Equipo Lleno',
        message: 'El equipo está lleno (máximo 6 Pokémon). Mueve un Pokémon al PC primero.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    const box = pcBoxes[selectedBox];
    const pokemon = box.pokemon.find(p => p.instanceId === pokemonId);
    if (!pokemon) return;

    setIsLoading(true);
    try {
      await authService.movePokemon(pokemon.instanceId!, 'team');
      await loadData(); // Recargar datos después del movimiento
    } catch (err: any) {
      const alert = await alertController.create({
        header: 'Error',
        message: err.message || 'Error al mover el Pokémon',
        buttons: ['OK']
      });
      await alert.present();
    } finally {
      setIsLoading(false);
    }
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

  const getHpPercentage = (hp: number, maxHp: number) => {
    return (hp / maxHp) * 100;
  };

  const getHpColor = (percentage: number) => {
    if (percentage > 60) return '#10b981';
    if (percentage > 30) return '#f59e0b';
    return '#ef4444';
  };

  // Detección de plataforma
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();

  // Estados adicionales para la lógica completa de Tab5
  const [passkeyCreated, setPasskeyCreated] = useState(false);
  const [currentPasskey, setCurrentPasskey] = useState<any>(null);
  const [biometry, setBiometry] = useState({
    isAvailable: false,
    biometryType: BiometryType.NONE,
    reason: '',
  });
  const [message, setMessage] = useState('');
  const [permissionStatus, setPermissionStatus] = useState('No verificado');

  // Detección mejorada de PWA
  const isPWA = useMemo(() => {
    return !isNative && 
           (window.matchMedia('(display-mode: standalone)').matches || 
            (window.navigator as any).standalone ||
            document.referrer.includes('android-app://'));
  }, [isNative]);

  const biometryName = useMemo(() => {
    if (biometry.biometryType === BiometryType.FACE_ID) return 'Face ID';
    if (biometry.biometryType === BiometryType.TOUCH_ID) return 'Touch ID';
    if (biometry.biometryType === BiometryType.FINGERPRINT) return 'Fingerprint';
    return 'No biometry';
  }, [biometry]);

  const showAlert = async (message: string) => {
    const alert = await alertController.create({
      header: `${biometryName} says:`,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  };

  const showErrorAlert = async (error: any) => {
    await showAlert(`${error.message || error} [${error.code || 'unknown'}].`);
  };

  // Generar challenge aleatorio para WebAuthn
  const generateRandomChallenge = (): ArrayBuffer => {
    const length = 32;
    const randomValues = new Uint8Array(length);
    window.crypto.getRandomValues(randomValues);
    return randomValues.buffer;
  };

  // Crear Passkey con WebAuthn
  const createPasskey = async (): Promise<boolean> => {
    try {
      if (!navigator.credentials || !navigator.credentials.create || !navigator.credentials.get) {
        alert("Tu navegador no soporta WebAuthn");
        return false;
      }
      
      const credentials = await navigator.credentials.create({
        publicKey: {
          challenge: generateRandomChallenge(),
          rp: { name: "Pokémon Trainer", id: window.location.hostname },
          user: { id: new Uint8Array(16), name: "trainer@pokemon.com", displayName: "Pokémon Trainer"},
          pubKeyCredParams: [
            { type: "public-key", alg: -7 },
            { type: "public-key", alg: -257 }
          ],
          timeout: 60000,
          authenticatorSelection: {residentKey: "preferred", requireResidentKey: false, userVerification: "preferred"},
          attestation: "none",
          extensions: { credProps: true }
        }
      });
      
      setCurrentPasskey(credentials);
      setPasskeyCreated(true);
      console.log(credentials);
      return true;
    } catch (error: any) {
      console.error('Error creando passkey:', error);
      return false;
    }
  };

  // Verificar Passkey con WebAuthn
  const verifyPasskey = async (): Promise<boolean> => {
    try {
      const credentials = await navigator.credentials.get({
        publicKey: {
          challenge: generateRandomChallenge(),
          allowCredentials: [{ type: "public-key", id: currentPasskey.rawId }]
        }
      });
      
      console.log(credentials);
      return true;
    } catch (error: any) {
      console.error('Error verificando passkey:', error);
      return false;
    }
  };

  // Verificar disponibilidad de biometría (lógica completa de Tab5)
  const checkBiometricAvailability = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentIsNative = Capacitor.isNativePlatform();
      const currentPlatform = Capacitor.getPlatform();
      const currentIsPWA = !currentIsNative && 
        (window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone ||
         document.referrer.includes('android-app://'));

      console.log('[Biometric] Verificando plataforma:', {
        isNative: currentIsNative,
        platform: currentPlatform,
        isPWA: currentIsPWA,
        userAgent: navigator.userAgent
      });

      // Si es PWA, mostrar mensaje específico
      if (currentIsPWA) {
        setBiometry({
          isAvailable: false,
          biometryType: BiometryType.NONE,
          reason: 'PWA - WebAuthn disponible'
        });
        setMessage('WebAuthn disponible. Puedes crear un passkey para autenticación biométrica.');
        setPermissionStatus('PWA - WebAuthn');
        setBiometryAvailable(false);
        setIsLoading(false);
        return;
      }

      // Si no es nativo (navegador web normal)
      if (!currentIsNative) {
        setBiometry({
          isAvailable: false,
          biometryType: BiometryType.NONE,
          reason: 'Navegador web - WebAuthn disponible'
        });
        setMessage('WebAuthn disponible. Puedes crear un passkey para autenticación biométrica.');
        setPermissionStatus('Navegador Web');
        setBiometryAvailable(false);
        setIsLoading(false);
        return;
      }

      // PLATAFORMA NATIVA - Verificar biometría real
      console.log('[Biometric] Verificando biometría en plataforma nativa...');
      setPermissionStatus('Verificando...');

      try {
        const result = await NativeBiometric.isAvailable();
        console.log('[Biometric] Resultado nativo:', result);
        
        const biometryTypeName = result.biometryType === BiometryType.FACE_ID ? 'Face ID' :
                                 result.biometryType === BiometryType.TOUCH_ID ? 'Touch ID' :
                                 result.biometryType === BiometryType.FINGERPRINT ? 'Fingerprint' : 'Biometría';
        
        setBiometry({
          isAvailable: result.isAvailable,
          biometryType: result.biometryType,
          reason: ''
        });
        setPermissionStatus(result.isAvailable ? 'Disponible' : 'No disponible');
        setBiometryAvailable(result.isAvailable);
        
        if (result.isAvailable) {
          setMessage(`${biometryTypeName} configurado y listo`);
        } else {
          setMessage(`Configure ${currentPlatform === 'ios' ? 'Face ID/Touch ID' : 'Huella digital'} en ajustes del dispositivo`);
        }
      } catch (error: any) {
        console.error('[Biometric] Error en plugin nativo:', error);
        setBiometry({
          isAvailable: false,
          biometryType: BiometryType.NONE,
          reason: `Error del plugin: ${error?.message || error}`
        });
        setPermissionStatus('Error en plugin');
        setMessage('Error al acceder a la biometría nativa');
        setBiometryAvailable(false);
      }

    } catch (error: any) {
      console.error('[Biometric] Error general:', error);
      setMessage(`Error: ${error?.message || error}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Autenticación biométrica completa (lógica de Tab5)
  const authenticateBiometric = async () => {
    // Si es PWA/Web, usar WebAuthn
    if (isPWA || !isNative) {
      if (!passkeyCreated) {
        // Crear passkey primero
        setIsLoading(true);
        const created = await createPasskey();
        setIsLoading(false);
        if (created) {
          await showAlert('Passkey creado. Ahora puedes acceder al POKÉMON PC.');
          setIsAuthenticated(true);
        }
      } else {
        // Verificar passkey
        setIsLoading(true);
        const verified = await verifyPasskey();
        setIsLoading(false);
        if (verified) {
          await showAlert('¡Autenticación exitosa con WebAuthn! Bienvenido al POKÉMON PC.');
          setIsAuthenticated(true);
        }
      }
      return;
    }

    // Verificar disponibilidad antes de autenticar (nativo)
    if (!biometry.isAvailable) {
      setMessage('La biometría no está disponible en este dispositivo');
      await showAlert('Configure la biometría en los ajustes de su dispositivo');
      return;
    }

    setIsLoading(true);
    try {
      console.log('[Biometric] Iniciando autenticación...');
      
      await NativeBiometric.verifyIdentity({
        reason: 'Acceso al POKÉMON PC',
        title: 'Autenticación Requerida',
        subtitle: 'Verifique su identidad',
        description: 'Use su huella digital, Face ID o Touch ID para acceder al PC',
        maxAttempts: 3,
        useFallback: true,
      });
      
      setMessage('¡Autenticación biométrica exitosa!');
      await showAlert('Autenticación exitosa. Bienvenido al POKÉMON PC.');
      setIsAuthenticated(true);
      
    } catch (error: any) {
      console.error('[Biometric] Error en autenticación:', error);
      
      // Manejar errores específicos
      if (error.code === 'AUTHENTICATION_FAILED') {
        setMessage('Autenticación fallida. Intente nuevamente.');
      } else if (error.code === 'BIOMETRY_NOT_AVAILABLE') {
        setMessage('Biometría no disponible temporalmente');
      } else if (error.code === 'USER_CANCELED') {
        setMessage('Autenticación cancelada por el usuario');
      } else {
        setMessage(`Error: ${error.message || error}`);
      }
      
      await showErrorAlert(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Efecto inicial (lógica completa de Tab5)
  useEffect(() => {
    const initialize = async () => {
      try {
        await SplashScreen.hide();
      } catch {
        // Ignorar errores de SplashScreen
      }
      // Solo verificar biometría si no está autenticado (para no interferir con pruebas)
      if (!isAuthenticated) {
        try {
      await checkBiometricAvailability();
        } catch (error) {
          console.error('Error verificando biometría:', error);
        }
      }
    };

    initialize();
  }, [checkBiometricAvailability, isAuthenticated]);

  // Cargar datos cuando se autentica
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const currentBox = pcBoxes[selectedBox];
  const currentPokemon = currentView === 'team' ? pokemonTeam : currentBox.pokemon;

  return (
    <IonPage className="pc-page">
      <IonHeader className="pc-header">
        <IonToolbar className="pc-toolbar">
          <IonTitle className="pc-title">
            <div className="pc-header-content">
              <div className="pc-logo">
                <div className="computer-icon"></div>
              </div>
              <span className="pc-text">POKÉMON PC</span>
            </div>
          </IonTitle>
          <ProfileButton />
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="pc-content">
        {!isOnline ? (
          <OfflineMessage onRetry={() => setIsOnline(navigator.onLine)} />
        ) : (
          <>
        {/* Pantalla de acceso biométrico mejorada */}
        {!isAuthenticated && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 'calc(100vh - 120px)',
            padding: '20px'
          }}>
            {/* Candado animado */}
            <div style={{
              position: 'relative',
              marginBottom: '30px'
            }}>
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                boxShadow: '0 10px 40px rgba(220, 53, 69, 0.4)',
                animation: 'pulse 2s ease-in-out infinite'
              }}>
                <IonIcon 
                  icon={lockClosed} 
                  style={{ 
                    fontSize: '60px', 
                    color: 'white'
                  }} 
                />
              </div>
              <div style={{
                position: 'absolute',
                top: '-10px',
                right: '-10px',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
              }}>
                <IonIcon 
                  icon={scan} 
                  style={{ fontSize: '24px', color: 'white' }} 
                />
              </div>
            </div>

            {/* Tarjeta de acceso */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '24px',
              padding: '32px 24px',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
              textAlign: 'center'
            }}>
              <h2 style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: '#1e293b',
                marginBottom: '12px',
                letterSpacing: '0.5px'
              }}>
                ACCESO SEGURO
              </h2>
              
              <p style={{
                fontSize: '15px',
                color: '#64748b',
                marginBottom: '24px',
                lineHeight: '1.6'
              }}>
                {isNative 
                  ? 'Usa tu huella digital, Face ID o reconocimiento facial para acceder al POKÉMON PC de forma segura'
                  : 'Usa autenticación biométrica de tu navegador para acceder al POKÉMON PC de forma segura'
                }
              </p>

              {/* Características de seguridad */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '24px',
                backgroundColor: '#f8fafc',
                padding: '16px',
                borderRadius: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <IonIcon icon={lockClosed} style={{ fontSize: '24px', color: '#10b981' }} />
                  <span style={{ fontSize: '14px', color: '#475569', textAlign: 'left' }}>
                    Acceso encriptado y seguro
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <IonIcon icon={fingerPrint} style={{ fontSize: '24px', color: '#10b981' }} />
                  <span style={{ fontSize: '14px', color: '#475569', textAlign: 'left' }}>
                    {isNative ? 'Biometría nativa del dispositivo' : 'Autenticación del navegador'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <IonIcon icon={checkmarkCircle} style={{ fontSize: '24px', color: '#10b981' }} />
                  <span style={{ fontSize: '14px', color: '#475569', textAlign: 'left' }}>
                    Protege tus Pokémon almacenados
                  </span>
                </div>
              </div>

              {/* Botón de acceso */}
              <IonButton 
                onClick={authenticateBiometric}
                disabled={isLoading}
                expand="block"
                size="large"
                style={{
                  '--background': 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  '--background-hover': '#dc2626',
                  '--background-activated': '#b91c1c',
                  '--border-radius': '16px',
                  '--padding-top': '16px',
                  '--padding-bottom': '16px',
                  '--box-shadow': '0 8px 24px rgba(220, 53, 69, 0.4)',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
              >
                {isLoading ? (
                  <>
                    <IonSpinner slot="start" style={{ color: 'white' }} />
                    <span>Verificando...</span>
                  </>
                ) : (
                  <>
                    <IonIcon icon={scan} slot="start" style={{ fontSize: '24px' }} />
                    <span>Usar Acceso Biométrico</span>
                  </>
                )}
              </IonButton>

              {/* Nota informativa */}
              <div style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#fef3c7',
                borderRadius: '8px',
                border: '1px solid #fde68a'
              }}>
                <p style={{
                  fontSize: '12px',
                  color: '#92400e',
                  margin: 0,
                  lineHeight: '1.5'
                }}>
                  <IonIcon icon={keyOutline} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  {isNative 
                    ? 'Configura la biometría en los ajustes de tu dispositivo si aún no lo has hecho'
                    : passkeyCreated 
                      ? 'Autenticación configurada. Toca el botón para verificar.'
                      : 'Primera vez: Se creará tu acceso seguro automáticamente'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Vista del PC (solo si está autenticado) */}
        {isAuthenticated && (
          <div className="pc-body">
          {/* Estados de carga y error */}
          {isLoadingData && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              padding: '40px',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <IonSpinner name="crescent" />
              <IonText color="medium">Cargando datos...</IonText>
            </div>
          )}

          {error && !isLoadingData && (
            <div style={{ 
              padding: '20px', 
              textAlign: 'center' 
            }}>
              <IonText color="danger">
                <p>{error}</p>
              </IonText>
              <IonButton onClick={loadData} style={{ marginTop: '16px' }}>
                Reintentar
              </IonButton>
            </div>
          )}

          {!isLoadingData && !error && (
            <>
          {/* Selector de vista */}
          <div className="view-selector">
            <IonSegment 
              value={currentView} 
              onIonChange={e => setCurrentView(e.detail.value as 'team' | 'pc')}
              className="pc-segment"
            >
              <IonSegmentButton value="team">
                <IonLabel>Mi Equipo ({teamInfo?.teamCount || pokemonTeam.length}/{teamInfo?.maxTeamSize || 6})</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="pc">
                <IonLabel>PC Storage</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </div>

          {/* Selector de cajas (solo en vista PC) */}
          {currentView === 'pc' && (
            <div className="box-selector">
              <div className="box-tabs">
                {pcBoxes.map((box, index) => (
                  <button
                    key={box.id}
                    className={`box-tab ${selectedBox === index ? 'active' : ''}`}
                    onClick={() => setSelectedBox(index)}
                  >
                    <IonIcon icon={folder} />
                    <span>{box.name}</span>
                    <span className="box-count">({box.pokemon.length})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Lista de Pokémon */}
          <div className="pokemon-list-container">
            <IonList className="pokemon-list">
              <IonReorderGroup disabled={false} onIonReorderEnd={currentView === 'team' ? handleTeamReorder : handlePcReorder}>
                {currentPokemon.map((pokemon, index) => (
                  <IonItem key={pokemon.id} className="pokemon-pc-item">
                    <div className="pokemon-pc-card">
                      <div className="pokemon-position">
                        #{index + 1}
                      </div>
                      
                      <div className="pokemon-image-container">
                        <img src={pokemon.img} alt={pokemon.name} className="pokemon-image" />
                        <div className="pokemon-level-badge">
                          Lv.{pokemon.level}
                        </div>
                      </div>
                      
                      <div className="pokemon-info">
                        <div className="pokemon-name">{pokemon.name}</div>
                        <IonChip 
                          className="pokemon-type-chip"
                          style={{ '--background': getTypeColor(pokemon.type) }}
                        >
                          {pokemon.type.charAt(0).toUpperCase() + pokemon.type.slice(1)}
                        </IonChip>
                      </div>
                      
                      <div className="pokemon-stats">
                        <div className="hp-bar-container">
                          <div className="hp-label">HP</div>
                          <div className="hp-bar">
                            <div 
                              className="hp-fill"
                              style={{ 
                                width: `${getHpPercentage(pokemon.hp, pokemon.maxHp)}%`,
                                backgroundColor: getHpColor(getHpPercentage(pokemon.hp, pokemon.maxHp))
                              }}
                            ></div>
                          </div>
                          <div className="hp-text">{pokemon.hp}/{pokemon.maxHp}</div>
                        </div>
                        
                        <div className="pokemon-stats-grid">
                          <div className="stat-mini">
                            <IonIcon icon={flash} />
                            <span>{pokemon.attack}</span>
                          </div>
                          <div className="stat-mini">
                            <IonIcon icon={shield} />
                            <span>{pokemon.defense}</span>
                          </div>
                          <div className="stat-mini">
                            <IonIcon icon={speedometer} />
                            <span>{pokemon.speed}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pokemon-actions">
                        {currentView === 'team' ? (
                          <IonButton 
                            className="move-btn" 
                            fill="outline" 
                            size="small"
                            onClick={() => movePokemonToPc(pokemon.instanceId || pokemon.id)}
                            disabled={pokemonTeam.length <= 1 || isLoading}
                          >
                            <IonIcon icon={swapHorizontal} slot="start" />
                            To PC
                          </IonButton>
                        ) : (
                          <IonButton 
                            className="move-btn" 
                            fill="outline" 
                            size="small"
                            onClick={() => movePokemonToTeam(pokemon.instanceId || pokemon.id)}
                            disabled={pokemonTeam.length >= 6 || isLoading}
                          >
                            <IonIcon icon={swapHorizontal} slot="start" />
                            To Team
                          </IonButton>
                        )}
                      </div>
                      
                      <IonReorder slot="end" className="reorder-handle">
                        <div className="reorder-icon">⋮⋮</div>
                      </IonReorder>
                    </div>
                  </IonItem>
                ))}
              </IonReorderGroup>
            </IonList>
          </div>

          {/* Información de la caja actual */}
          {currentView === 'pc' && (
            <div className="box-info">
              <div className="box-details">
                <h3>{currentBox.name}</h3>
                <p>{currentBox.pokemon.length} Pokémon almacenados</p>
              </div>
            </div>
          )}
            </>
          )}
          </div>
        )}

        {/* Alerta para dispositivos no nativos */}
        <IonAlert
          isOpen={showBiometricAlert}
          onDidDismiss={() => setShowBiometricAlert(false)}
          header="Acceso Biométrico No Disponible"
          message="La autenticación biométrica solo está disponible en la aplicación nativa. Descarga la app desde la tienda para acceder a esta función."
          buttons={[
            {
              text: 'Entendido',
              role: 'cancel'
            }
          ]}
        />
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Tab3;
