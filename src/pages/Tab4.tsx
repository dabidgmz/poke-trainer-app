import React, { useState, useRef, useEffect } from 'react';
import { 
  IonContent, 
  IonHeader, 
  IonPage, 
  IonTitle, 
  IonToolbar, 
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonGrid,
  IonRow,
  IonCol,
  IonAlert,
  IonFab,
  IonFabButton,
  IonChip,
  IonLabel,
  IonModal,
  IonText,
  IonSpinner
} from '@ionic/react';
import { 
  camera, 
  qrCode, 
  flash, 
  flashOff,
  refresh,
  checkmark,
  close,
  add,
  ellipse
} from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource, PermissionStatus } from '@capacitor/camera';
import QRScanner from '../components/QRScanner';
import { CameraUtils } from '../utils/cameraUtils';
import authService from '../services/authService';
import { useHistory } from 'react-router-dom';
import { alertController } from '@ionic/core';
import ProfileButton from '../components/ProfileButton';
import OfflineMessage from '../components/OfflineMessage';
import offlineCache from '../services/offlineCache';
import './Tab4.css';

interface CapturedPokemon {
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
  captureTime: Date;
  qrCode?: string;
}

const Tab4: React.FC = () => {
  const history = useHistory();
  const [isScanning, setIsScanning] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [capturedPokemon, setCapturedPokemon] = useState<CapturedPokemon[]>([]);
  const [showCaptureAlert, setShowCaptureAlert] = useState(false);
  const [newPokemon, setNewPokemon] = useState<CapturedPokemon | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cameraPermission, setCameraPermission] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);
  const [showBoxSelection, setShowBoxSelection] = useState(false);
  const [pendingCapture, setPendingCapture] = useState<{ captureId: number; pokemonId: number; name: string; rarity: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedPokemonInfo, setCapturedPokemonInfo] = useState<{
    id: number;
    name: string;
    spriteUrl: string;
    types: string[];
  } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Función para obtener información del Pokémon desde la PokeAPI
  const fetchPokemonFromPokeAPI = async (pokeapiId: number): Promise<{
    id: number;
    name: string;
    spriteUrl: string;
    types: string[];
  }> => {
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokeapiId}`);
      if (!response.ok) {
        throw new Error('No se pudo obtener la información del Pokémon');
      }
      const data = await response.json();
      
      return {
        id: data.id,
        name: data.name.charAt(0).toUpperCase() + data.name.slice(1),
        spriteUrl: data.sprites.front_default || data.sprites.other?.['official-artwork']?.front_default || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${data.id}.png`,
        types: data.types.map((t: any) => t.type.name)
      };
    } catch (error) {
      console.error('Error obteniendo datos de PokeAPI:', error);
      // Retornar datos por defecto si falla
      return {
        id: pokeapiId,
        name: 'Pokémon',
        spriteUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokeapiId}.png`,
        types: ['normal']
      };
    }
  };

  // Pokémon disponibles para capturar (simulados)
  const availablePokemon = [
    {
      id: 1,
      name: 'Pikachu',
      type: 'electric',
      level: 15,
      hp: 60,
      maxHp: 60,
      attack: 40,
      defense: 30,
      speed: 70,
      img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
      qrCode: 'PIKACHU_001'
    },
    {
      id: 2,
      name: 'Charmander',
      type: 'fire',
      level: 12,
      hp: 50,
      maxHp: 50,
      attack: 35,
      defense: 25,
      speed: 60,
      img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png',
      qrCode: 'CHARMANDER_002'
    },
    {
      id: 3,
      name: 'Squirtle',
      type: 'water',
      level: 10,
      hp: 45,
      maxHp: 45,
      attack: 30,
      defense: 35,
      speed: 40,
      img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png',
      qrCode: 'SQUIRTLE_003'
    },
    {
      id: 4,
      name: 'Bulbasaur',
      type: 'grass',
      level: 8,
      hp: 40,
      maxHp: 40,
      attack: 25,
      defense: 30,
      speed: 35,
      img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png',
      qrCode: 'BULBASAUR_004'
    },
    {
      id: 5,
      name: 'Pidgey',
      type: 'flying',
      level: 5,
      hp: 30,
      maxHp: 30,
      attack: 20,
      defense: 20,
      speed: 50,
      img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/16.png',
      qrCode: 'PIDGEY_005'
    }
  ];

  // Solicitar permisos de cámara automáticamente al cargar el componente
  useEffect(() => {
    const requestCameraPermissions = async () => {
      try {
        console.log('Solicitando permisos de cámara automáticamente al cargar la app...');
        setIsRequestingPermissions(true);
        
        const result = await CameraUtils.requestCameraPermissions();
        
        if (result.granted) {
          setCameraPermission('granted');
          console.log('Permisos de cámara concedidos');
          
          // Abrir QR Scanner automáticamente después de un breve delay
          setTimeout(() => {
            setShowQRScanner(true);
          }, 1000);
        } else {
          setCameraPermission('denied');
          setCameraError(result.error || 'Error al solicitar permisos de cámara');
          console.log('Error solicitando permisos:', result.error);
        }
        
      } catch (error: any) {
        console.log('Error general al solicitar permisos de cámara:', error);
        setCameraPermission('unknown');
        setCameraError('Error inesperado al solicitar permisos de cámara');
      } finally {
        setIsRequestingPermissions(false);
      }
    };

    // Esperar un poco antes de solicitar permisos para asegurar que el componente esté montado
    const timer = setTimeout(requestCameraPermissions, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  // Función para activar la cámara (asume que los permisos ya están concedidos)
  const activateCamera = async () => {
    try {
      setIsLoading(true);
      setCameraError(null);
      
      // Para Android, usar el plugin de Cámara de Capacitor
      if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        // En Android, el plugin de Cámara maneja la captura
        setIsScanning(true);
      } else {
        // En web, usar las utilidades de cámara
        try {
          const stream = await CameraUtils.getVideoStream();
          
          if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
            streamRef.current = stream;
            setIsScanning(true);
          } else {
            throw new Error('No se pudo obtener el stream de video');
          }
        } catch (streamError: any) {
          console.error('Error obteniendo stream de video:', streamError);
          throw streamError;
        }
      }
    } catch (error: any) {
      console.error('Error activating camera:', error);
      
      let errorMessage = 'No se pudo activar la cámara.';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Permisos de cámara denegados. Por favor, permite el acceso a la cámara.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No se encontró ninguna cámara en tu dispositivo.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'La cámara está siendo usada por otra aplicación.';
      } else if (error.message.includes('not found')) {
        errorMessage = 'No se encontró ninguna cámara en tu dispositivo.';
      } else if (error.message.includes('not supported')) {
        errorMessage = 'Tu dispositivo no soporta acceso a la cámara.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setCameraError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setCameraError(null);
      
      // Verificar el estado actual de los permisos
      const currentPermission = await Camera.checkPermissions();
      
      let permission;
      if (currentPermission.camera === 'granted') {
        // Los permisos ya están concedidos
        permission = currentPermission;
        setCameraPermission('granted');
      } else {
        // Solicitar permisos si no están concedidos
        permission = await Camera.requestPermissions();
        setCameraPermission(permission.camera as any);
      }
      
      if (permission.camera === 'denied') {
        throw new Error('Permisos de cámara denegados. Por favor, habilita los permisos en la configuración de la aplicación.');
      }
      
      if (permission.camera === 'granted') {
        // Usar la función activateCamera para activar la cámara
        await activateCamera();
      }
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      
      let errorMessage = 'No se pudo acceder a la cámara.';
      
      if (error.message.includes('denied')) {
        errorMessage = 'Permisos de cámara denegados. Por favor, habilita los permisos en la configuración de la aplicación.';
        setCameraPermission('denied');
      } else if (error.message.includes('not found')) {
        errorMessage = 'No se encontró ninguna cámara en tu dispositivo.';
      } else if (error.message.includes('not supported')) {
        errorMessage = 'Tu dispositivo no soporta acceso a la cámara.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setCameraError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    try {
      // Usar las utilidades para limpiar el stream
      CameraUtils.cleanupVideoStream(streamRef.current);
      streamRef.current = null;
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      setIsScanning(false);
    } catch (error) {
      console.error('Error deteniendo cámara:', error);
      setIsScanning(false);
    }
  };

  const toggleFlash = () => {
    setFlashOn(!flashOn);
    // En una implementación real, aquí controlarías el flash de la cámara
  };

  const capturePhoto = async () => {
    try {
      if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        // En Android, usar el plugin de Cámara de Capacitor
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera
        });
        
        if (image.dataUrl) {
          // Simular detección de QR y captura de Pokémon
          simulatePokemonCapture();
        }
      } else {
        // En web, usar el canvas como antes
        if (videoRef.current && canvasRef.current) {
          const canvas = canvasRef.current;
          const video = videoRef.current;
          const context = canvas.getContext('2d');
          
          if (context) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0);
            
            // Simular detección de QR y captura de Pokémon
            simulatePokemonCapture();
          }
        }
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      setCameraError('Error al capturar la foto. Inténtalo de nuevo.');
    }
  };

  const simulatePokemonCapture = () => {
    setIsLoading(true);
    
    // Simular tiempo de procesamiento
    setTimeout(() => {
      const randomPokemon = availablePokemon[Math.floor(Math.random() * availablePokemon.length)];
      const capturedPokemon: CapturedPokemon = {
        ...randomPokemon,
        captureTime: new Date()
      };
      
      setNewPokemon(capturedPokemon);
      setShowCaptureAlert(true);
      setIsLoading(false);
    }, 2000);
  };

  const confirmCapture = () => {
    if (newPokemon) {
      setCapturedPokemon(prev => [newPokemon, ...prev]);
      setNewPokemon(null);
      setShowCaptureAlert(false);
    }
  };

  const cancelCapture = () => {
    setNewPokemon(null);
    setShowCaptureAlert(false);
  };

  const handleQRDetected = async (qrCode: string) => {
    console.log('QR Code detectado:', qrCode);
    setIsLoading(true);
    setError(null);
    setCapturedPokemonInfo(null);
    
    try {
      // El QR code puede venir como JSON object o como número
      let pokemonId: number;
      
      // Intentar parsear como JSON primero
      try {
        const qrData = JSON.parse(qrCode);
        if (qrData && typeof qrData.id === 'number') {
          pokemonId = qrData.id;
        } else if (qrData && typeof qrData.pokemonId === 'number') {
          pokemonId = qrData.pokemonId;
        } else {
          throw new Error('El QR code no contiene un ID de Pokémon válido.');
        }
      } catch (parseError) {
        // Si no es JSON, intentar extraer el número del QR
        const match = qrCode.match(/\d+/);
        if (match) {
          pokemonId = parseInt(match[0], 10);
        } else {
          // Si no hay número, intentar parsear directamente
          pokemonId = parseInt(qrCode, 10);
        }
      }
      
      if (isNaN(pokemonId) || pokemonId <= 0) {
        throw new Error('Código QR inválido. Debe contener un ID de Pokémon válido.');
      }
      
      // Llamar a la API para escanear el Pokémon
      const result = await authService.scanPokemon(pokemonId);
      
      console.log('Resultado del scan:', result);
      
      // Validar que la respuesta tenga la estructura esperada
      if (!result.pokemon) {
        throw new Error('Respuesta inválida del servidor: falta información del Pokémon');
      }
      
      // Validar propiedades del Pokémon antes de usar
      const pokemonName = result.pokemon?.name || 'Pokémon desconocido';
      const spriteUrl = result.pokemon?.spriteUrl || null;
      const types = result.pokemon?.types || [];
      const rarity = result.pokemon?.rarity || 'common';
      
      // Guardar información del Pokémon capturado
      setCapturedPokemonInfo({
        id: result.pokemon.id,
        name: pokemonName,
        spriteUrl: spriteUrl || '',
        types: types
      });
      
      // Si requiere selección de caja (equipo lleno)
      if (result.requiresBoxSelection) {
        console.log('Equipo lleno, mostrando modal de selección de caja');
        
        if (!result.captureId) {
          throw new Error('Error: La API no devolvió captureId para la selección de caja');
        }
        
        setPendingCapture({
          captureId: result.captureId,
          pokemonId: result.pokemon.pokeapiId,
          name: pokemonName,
          rarity: rarity
        });
        
        // Cerrar el scanner primero
        setShowQRScanner(false);
        // Esperar un momento para que el scanner se cierre
        setTimeout(() => {
          setShowBoxSelection(true);
          setIsLoading(false);
        }, 300);
        return;
      }
      
      // Si se agregó directamente al equipo o PC
      if (result.placement === 'team' || result.placement === 'pc') {
        const typesText = types.length > 0 
          ? types.map(t => (t || '').charAt(0).toUpperCase() + (t || '').slice(1)).join(' / ')
          : '';
        
        const message = result.placement === 'team'
          ? `¡${pokemonName} agregado a tu equipo!${typesText ? `\nTipo: ${typesText}` : ''}`
          : `¡${pokemonName} guardado en Caja ${result.pcBox}!${typesText ? `\nTipo: ${typesText}` : ''}`;
        
        const alert = await alertController.create({
          header: '¡Pokémon Capturado!',
          message: message,
          buttons: ['OK']
        });
        await alert.present();
        
        // Cerrar el scanner
        setShowQRScanner(false);
      }
      
    } catch (err: any) {
      console.error('Error capturando Pokémon:', err);
      setError(err.message || 'Error al capturar el Pokémon');
      
      if (err.message === 'No autenticado') {
        history.push('/login');
      } else {
        const alert = await alertController.create({
          header: 'Error',
          message: err.message || 'Error al capturar el Pokémon',
          buttons: ['OK']
        });
        await alert.present();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBoxSelection = async (boxNumber: number) => {
    if (!pendingCapture) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await authService.confirmCapture(pendingCapture.captureId, boxNumber);
      
      // Validar que la respuesta tenga la estructura esperada
      if (!result.pokemon) {
        throw new Error('Respuesta inválida del servidor: falta información del Pokémon');
      }
      
      // Validar propiedades del Pokémon antes de usar
      const pokemonName = result.pokemon?.name || pendingCapture.name || 'Pokémon';
      const spriteUrl = result.pokemon?.spriteUrl || null;
      const types = result.pokemon?.types || [];
      const rarity = result.pokemon?.rarity || pendingCapture.rarity || 'common';
      
      // Construir mensaje de tipos
      const typesText = types.length > 0
        ? types.map(t => (t || '').charAt(0).toUpperCase() + (t || '').slice(1)).join(' / ')
        : '';
      
      const alert = await alertController.create({
        header: '¡Pokémon Capturado!',
        message: `Has capturado a ${pokemonName} (${rarity.charAt(0).toUpperCase() + rarity.slice(1)})${typesText ? `\nTipo: ${typesText}` : ''}\nSe guardó en la caja ${result.pcBox} del PC.`,
        buttons: ['OK']
      });
      await alert.present();
      
      setShowBoxSelection(false);
      setPendingCapture(null);
      setCapturedPokemonInfo(null);
      setShowQRScanner(false);
      
    } catch (err: any) {
      console.error('Error confirmando captura:', err);
      setError(err.message || 'Error al confirmar la captura');
      
      if (err.message === 'No autenticado') {
        history.push('/login');
      } else {
        const alert = await alertController.create({
          header: 'Error',
          message: err.message || 'Error al confirmar la captura',
          buttons: ['OK']
        });
        await alert.present();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const cancelBoxSelection = () => {
    setShowBoxSelection(false);
    setPendingCapture(null);
    setCapturedPokemonInfo(null);
  };

  const handleCloseQRScanner = () => {
    setShowQRScanner(false);
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

  useEffect(() => {
    return () => {
      stopCamera();
    };
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

  // Si se debe mostrar el QR Scanner, renderizarlo
  if (showQRScanner) {
    return (
      <QRScanner 
        onQRDetected={handleQRDetected}
        onClose={handleCloseQRScanner}
      />
    );
  }

  return (
    <IonPage className="capture-page">
      <IonHeader className="capture-header">
        <IonToolbar className="capture-toolbar">
          <IonTitle className="capture-title">
            <div className="capture-header-content">
              <div className="capture-logo">
                <div className="pokeball-icon">
                  <IonIcon icon={ellipse} />
                </div>
              </div>
              <span className="capture-text">POKÉMON CAPTURE</span>
            </div>
          </IonTitle>
          <ProfileButton />
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="capture-content">
        {!isOnline ? (
          <OfflineMessage onRetry={() => setIsOnline(navigator.onLine)} />
        ) : (
        <div className="capture-body">
          {/* Cámara de captura */}
          <div className="camera-container">
            {!isScanning ? (
              <div className="camera-placeholder">
                <div className="camera-icon">
                  <IonIcon icon={camera} />
                </div>
                {isRequestingPermissions ? (
                  <>
                    <h3>Solicitando permisos de cámara...</h3>
                    <p>Por favor, permite el acceso a la cámara cuando se te solicite</p>
                    <div className="permission-requesting">
                      <IonIcon icon={camera} className="requesting-icon" />
                      <p>Esperando respuesta del usuario...</p>
                    </div>
                  </>
                ) : (
                  <>
                    <h3>Activa la cámara para capturar Pokémon</h3>
                    <p>Escanea códigos QR para encontrar Pokémon salvajes</p>
                  </>
                )}
                
                {/* Estado de permisos */}
                {cameraPermission === 'denied' && (
                  <div className="permission-warning">
                    <IonIcon icon={close} className="warning-icon" />
                    <p>Permisos de cámara denegados. Habilita los permisos en la configuración de tu navegador.</p>
                  </div>
                )}
                
                {cameraPermission === 'granted' && !showQRScanner && (
                  <div className="permission-success">
                    <IonIcon icon={checkmark} className="success-icon" />
                    <p>Permisos de cámara concedidos. ¡Listo para escanear!</p>
                  </div>
                )}
                
                {cameraError && (
                  <div className="camera-error">
                    <IonIcon icon={close} className="error-icon" />
                    <p>{cameraError}</p>
                  </div>
                )}
                
                {!showQRScanner && (
                  <IonButton 
                    className="start-camera-btn" 
                    onClick={() => setShowQRScanner(true)}
                    disabled={isLoading || cameraPermission === 'denied' || isRequestingPermissions}
                  >
                    <IonIcon icon={qrCode} slot="start" />
                    {isLoading ? 'Activando...' : isRequestingPermissions ? 'Solicitando permisos...' : 'Abrir QR Scanner'}
                  </IonButton>
                )}
                
                {cameraPermission === 'denied' && (
                  <div className="permission-help">
                    <p><strong>¿Cómo habilitar los permisos?</strong></p>
                    {window.Capacitor && window.Capacitor.isNativePlatform() ? (
                      <ul>
                        <li>Ve a Configuración de la aplicación</li>
                        <li>Busca "Permisos" o "Aplicaciones"</li>
                        <li>Encuentra "PokeTrainerApp"</li>
                        <li>Habilita el permiso de "Cámara"</li>
                        <li>Vuelve a la aplicación</li>
                      </ul>
                    ) : (
                      <ul>
                        <li>Haz clic en el icono de cámara en la barra de direcciones</li>
                        <li>Selecciona "Permitir" para el acceso a la cámara</li>
                        <li>Recarga la página</li>
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="camera-view">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="camera-video"
                />
                <canvas
                  ref={canvasRef}
                  className="capture-canvas"
                  style={{ display: 'none' }}
                />
                
                {/* Overlay de captura */}
                <div className="capture-overlay">
                  <div className="qr-scanner-frame">
                    <div className="corner top-left"></div>
                    <div className="corner top-right"></div>
                    <div className="corner bottom-left"></div>
                    <div className="corner bottom-right"></div>
                  </div>
                  <div className="scan-line"></div>
                </div>
                
                {/* Controles de cámara */}
                <div className="camera-controls">
                  <IonButton 
                    className="control-btn flash-btn" 
                    onClick={toggleFlash}
                    fill="clear"
                  >
                    <IonIcon icon={flashOn ? flash : flashOff} />
                  </IonButton>
                  
                  <IonButton 
                    className="capture-btn" 
                    onClick={capturePhoto}
                    disabled={isLoading}
                  >
                    <div className="pokeball-capture">
                      <div className="pokeball-top"></div>
                      <div className="pokeball-bottom"></div>
                      <div className="pokeball-center"></div>
                    </div>
                  </IonButton>
                  
                  <IonButton 
                    className="control-btn close-btn" 
                    onClick={stopCamera}
                    fill="clear"
                  >
                    <IonIcon icon={close} />
                  </IonButton>
                </div>
              </div>
            )}
          </div>

          {/* Lista de Pokémon capturados */}
          {capturedPokemon.length > 0 && (
            <div className="captured-pokemon-section">
              <h2 className="section-title">Pokémon Capturados ({capturedPokemon.length})</h2>
              <IonGrid>
                <IonRow>
                  {capturedPokemon.map((pokemon, index) => (
                    <IonCol size="6" sizeMd="4" sizeLg="3" key={index}>
                      <IonCard className="pokemon-capture-card">
                        <div className="pokemon-image-container">
                          <img src={pokemon.img} alt={pokemon.name} />
                          <div className="capture-badge">
                            <IonIcon icon={checkmark} />
                          </div>
                        </div>
                        <IonCardContent>
                          <h3 className="pokemon-name">{pokemon.name}</h3>
                          <IonChip 
                            className="pokemon-type"
                            style={{ '--background': getTypeColor(pokemon.type) }}
                          >
                            {pokemon.type.charAt(0).toUpperCase() + pokemon.type.slice(1)}
                          </IonChip>
                          <p className="pokemon-level">Nivel {pokemon.level}</p>
                          <p className="capture-time">
                            {pokemon.captureTime.toLocaleTimeString()}
                          </p>
                        </IonCardContent>
                      </IonCard>
                    </IonCol>
                  ))}
                </IonRow>
              </IonGrid>
            </div>
          )}

          {/* Instrucciones - Solo mostrar cuando el QR Scanner no está activo */}
          {!showQRScanner && (
            <div className="instructions-section">
              <IonCard className="instructions-card">
                <IonCardHeader>
                  <IonCardTitle>¿Cómo capturar Pokémon?</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div className="instruction-steps">
                    <div className="step">
                      <div className="step-number">1</div>
                      <div className="step-content">
                        <h4>Abre el QR Scanner</h4>
                        <p>Presiona el botón para abrir el escáner de códigos QR</p>
                      </div>
                    </div>
                    <div className="step">
                      <div className="step-number">2</div>
                      <div className="step-content">
                        <h4>Escanea códigos QR</h4>
                        <p>Apunta la cámara hacia códigos QR de Pokémon</p>
                      </div>
                    </div>
                    <div className="step">
                      <div className="step-number">3</div>
                      <div className="step-content">
                        <h4>Captura el Pokémon</h4>
                        <p>Confirma la captura del Pokémon detectado</p>
                      </div>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            </div>
          )}
        </div>
        )}

        {/* Modal de selección de caja (equipo lleno) */}
        <IonModal 
          isOpen={showBoxSelection} 
          onDidDismiss={cancelBoxSelection}
          backdropDismiss={false}
          cssClass="box-selection-modal"
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Equipo Lleno</IonTitle>
              <IonButton slot="end" fill="clear" onClick={cancelBoxSelection}>
                <IonIcon icon={close} />
              </IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {pendingCapture && (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                {capturedPokemonInfo && (
                  <div style={{ marginBottom: '20px' }}>
                    <img 
                      src={capturedPokemonInfo.spriteUrl || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${capturedPokemonInfo.id}.png`} 
                      alt={capturedPokemonInfo.name || 'Pokémon'}
                      style={{ width: '150px', height: '150px', objectFit: 'contain' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${capturedPokemonInfo.id || 0}.png`;
                      }}
                    />
                    <IonText>
                      <h2>¡{capturedPokemonInfo.name || pendingCapture.name || 'Pokémon'} capturado!</h2>
                      <p style={{ marginTop: '10px' }}>
                        <IonChip color="primary" style={{ marginRight: '5px' }}>
                          {(pendingCapture.rarity || 'common').toUpperCase()}
                        </IonChip>
                        {capturedPokemonInfo.types && capturedPokemonInfo.types.length > 0 && capturedPokemonInfo.types.map((type, idx) => (
                          <IonChip key={idx} color="secondary" style={{ marginRight: '5px' }}>
                            {(type || '').charAt(0).toUpperCase() + (type || '').slice(1)}
                          </IonChip>
                        ))}
                      </p>
                    </IonText>
                  </div>
                )}
                {!capturedPokemonInfo && (
                  <div style={{ marginBottom: '20px' }}>
                    <IonText>
                      <h2>¡{pendingCapture.name || 'Pokémon'} capturado!</h2>
                      <p style={{ marginTop: '10px' }}>
                        <IonChip color="primary" style={{ marginRight: '5px' }}>
                          {(pendingCapture.rarity || 'common').toUpperCase()}
                        </IonChip>
                      </p>
                    </IonText>
                  </div>
                )}
                <IonText>
                  <p style={{ marginTop: '20px', fontWeight: 'bold' }}>Tu equipo está lleno (6/6).</p>
                  <p>¿A qué caja del PC quieres mandarlo?</p>
                </IonText>
                
                <IonGrid style={{ marginTop: '30px' }}>
                  <IonRow>
                    <IonCol size="4">
                      <IonButton
                        expand="block"
                        fill="outline"
                        onClick={() => handleBoxSelection(1)}
                        disabled={isLoading}
                        style={{ height: '100px' }}
                      >
                        <div>
                          <IonIcon icon={ellipse} style={{ fontSize: '2rem' }} />
                          <div>Caja 1</div>
                        </div>
                      </IonButton>
                    </IonCol>
                    <IonCol size="4">
                      <IonButton
                        expand="block"
                        fill="outline"
                        onClick={() => handleBoxSelection(2)}
                        disabled={isLoading}
                        style={{ height: '100px' }}
                      >
                        <div>
                          <IonIcon icon={ellipse} style={{ fontSize: '2rem' }} />
                          <div>Caja 2</div>
                        </div>
                      </IonButton>
                    </IonCol>
                    <IonCol size="4">
                      <IonButton
                        expand="block"
                        fill="outline"
                        onClick={() => handleBoxSelection(3)}
                        disabled={isLoading}
                        style={{ height: '100px' }}
                      >
                        <div>
                          <IonIcon icon={ellipse} style={{ fontSize: '2rem' }} />
                          <div>Caja 3</div>
                        </div>
                      </IonButton>
                    </IonCol>
                  </IonRow>
                </IonGrid>
                
                {isLoading && (
                  <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <IonSpinner />
                    <IonText color="medium">
                      <p>Guardando en el PC...</p>
                    </IonText>
                  </div>
                )}
                
                {error && (
                  <IonText color="danger">
                    <p>{error}</p>
                  </IonText>
                )}
              </div>
            )}
          </IonContent>
        </IonModal>

        {/* Alertas */}
        <IonAlert
          isOpen={showCaptureAlert}
          onDidDismiss={() => setShowCaptureAlert(false)}
          header="¡Pokémon Capturado!"
          message={newPokemon ? `Has capturado a ${newPokemon.name} (Nivel ${newPokemon.level})` : ''}
          buttons={[
            {
              text: 'Cancelar',
              role: 'cancel',
              handler: cancelCapture
            },
            {
              text: 'Confirmar',
              handler: confirmCapture
            }
          ]}
        />

        {isLoading && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            flexDirection: 'column',
            gap: '16px'
          }}>
            <IonSpinner name="crescent" style={{ '--color': 'white' }} />
            <IonText color="light">
              <p style={{ color: 'white', margin: 0 }}>Procesando captura...</p>
            </IonText>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Tab4;
