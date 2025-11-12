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
  IonLoading,
  IonFab,
  IonFabButton,
  IonChip,
  IonLabel
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
  ellipse,
  flashlight,
  flashlightOutline
} from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource, PermissionStatus } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Torch } from '@capawesome/capacitor-torch';
import QRScanner from '../components/QRScanner';
import { CameraUtils } from '../utils/cameraUtils';
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
  const [isScanning, setIsScanning] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [capturedPokemon, setCapturedPokemon] = useState<CapturedPokemon[]>([]);
  const [showCaptureAlert, setShowCaptureAlert] = useState(false);
  const [newPokemon, setNewPokemon] = useState<CapturedPokemon | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Estados para detección de movimiento y linterna
  const [motionCount, setMotionCount] = useState(0);
  const [motionMagnitude, setMotionMagnitude] = useState(0);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isTorchAvailable, setIsTorchAvailable] = useState(false);

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

  // Verificar disponibilidad de linterna
  useEffect(() => {
    const checkTorch = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          console.log('[Torch] Verificando disponibilidad de linterna...');
          const result = await Torch.isAvailable();
          console.log('[Torch] Disponible:', result.available);
          setIsTorchAvailable(result.available);
        } else {
          console.log('[Torch] No es plataforma nativa, linterna no disponible');
        }
      } catch (error) {
        console.error('[Torch] Error verificando linterna:', error);
      }
    };
    checkTorch();
  }, []);

  // Función para apagar la linterna
  const turnOffTorch = async () => {
    try {
      console.log('[Torch] Apagando linterna...');
      if (Capacitor.isNativePlatform()) {
        await Torch.disable();
        console.log('[Torch] Linterna apagada correctamente');
      }
      setIsTorchOn(false);
      setMotionCount(0);
    } catch (error) {
      console.error('[Torch] Error apagando linterna:', error);
    }
  };

  // Efecto para detectar movimiento del dispositivo
  useEffect(() => {
    console.log('[Motion] Iniciando detector de movimiento...');
    
    let handleMotion: ((event: DeviceMotionEvent) => void) | null = null;
    const MOTION_THRESHOLD = 15; // Umbral para detectar un movimiento significativo
    const MOTION_COOLDOWN = 500; // Tiempo de espera entre movimientos (ms)
    let lastMotionTime = 0;

    if (window.DeviceMotionEvent) {
      console.log('[Motion] DeviceMotionEvent disponible');
      
      handleMotion = (event: DeviceMotionEvent) => {
        if (event.accelerationIncludingGravity) {
          const x = event.accelerationIncludingGravity.x || 0;
          const y = event.accelerationIncludingGravity.y || 0;
          const z = event.accelerationIncludingGravity.z || 0;
          
          // Calcular magnitud del movimiento
          const magnitude = Math.sqrt(x * x + y * y + z * z);
          setMotionMagnitude(parseFloat(magnitude.toFixed(2)));
          
          // Detectar movimiento significativo (pico) solo si la linterna está apagada
          if (!isTorchOn) {
            const currentTime = Date.now();
            
            // Detectar un pico de movimiento significativo
            if (magnitude > MOTION_THRESHOLD && (currentTime - lastMotionTime) > MOTION_COOLDOWN) {
              lastMotionTime = currentTime;
              console.log(`[Motion] Movimiento detectado! Magnitud: ${magnitude.toFixed(2)}`);
              
              setMotionCount(prevCount => {
                const newCount = prevCount + 1;
                console.log(`[Motion] Contador: ${newCount}/3`);
                return newCount;
              });
            }
          }
        }
      };

      window.addEventListener('devicemotion', handleMotion);
      console.log('[Motion] Listener agregado');
    } else {
      console.log('[Motion] DeviceMotionEvent NO disponible');
    }

    return () => {
      if (handleMotion) {
        window.removeEventListener('devicemotion', handleMotion);
        console.log('[Motion] Listener removido');
      }
    };
  }, [isTorchOn]);

  // Efecto para encender la linterna después de 3 movimientos
  useEffect(() => {
    console.log(`[Torch] Verificando condiciones: count=${motionCount}, torchOn=${isTorchOn}, available=${isTorchAvailable}`);
    
    if (motionCount >= 3 && !isTorchOn && isTorchAvailable) {
      console.log('[Torch] ¡3 movimientos detectados! Encendiendo linterna...');
      
      const turnOnTorch = async () => {
        try {
          if (Capacitor.isNativePlatform()) {
            console.log('[Torch] Ejecutando Torch.enable()...');
            await Torch.enable();
            console.log('[Torch] Linterna encendida correctamente');
            setIsTorchOn(true);
            setMotionCount(0);
          } else {
            console.log('[Torch] No es plataforma nativa');
          }
        } catch (error: any) {
          console.error('[Torch] Error encendiendo linterna automáticamente:', error);
          setMotionCount(0);
        }
      };
      
      turnOnTorch();
    }
  }, [motionCount, isTorchOn, isTorchAvailable]);

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

  const handleQRDetected = (qrCode: string) => {
    console.log('QR Code detectado:', qrCode);
    
    // Buscar el Pokémon correspondiente al código QR
    const pokemon = availablePokemon.find(p => p.qrCode === qrCode);
    
    if (pokemon) {
      const capturedPokemon: CapturedPokemon = {
        ...pokemon,
        captureTime: new Date()
      };
      
      setNewPokemon(capturedPokemon);
      setShowCaptureAlert(true);
    } else {
      // Pokémon no encontrado
      console.log('Pokémon no encontrado para el código QR:', qrCode);
    }
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
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="capture-content">
        {/* Controlador de linterna con switch */}
        {isTorchAvailable && (
          <div style={{
            position: 'fixed',
            top: '70px',
            right: '16px',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            alignItems: 'flex-end'
          }}>
            {/* Switch de control de linterna */}
            <div style={{
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              padding: '16px',
              borderRadius: '16px',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4)',
              minWidth: '180px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                marginBottom: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IonIcon 
                    icon={flashlight} 
                    style={{ fontSize: '24px', color: isTorchOn ? '#ffc107' : '#fff' }}
                  />
                  <div>
                    <div style={{
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      marginBottom: '2px'
                    }}>
                      Linterna
                    </div>
                    <div style={{
                      color: isTorchOn ? '#4caf50' : '#999',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}>
                      {isTorchOn ? 'ON' : 'OFF'}
                    </div>
                  </div>
                </div>
                
                {/* Switch Toggle */}
                <label style={{
                  position: 'relative',
                  display: 'inline-block',
                  width: '52px',
                  height: '28px',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={isTorchOn}
                    onChange={async () => {
                      try {
                        if (isTorchOn) {
                          await turnOffTorch();
                        } else {
                          console.log('[Torch] Encendiendo linterna con switch...');
                          if (Capacitor.isNativePlatform()) {
                            await Torch.enable();
                            console.log('[Torch] Linterna encendida');
                            setIsTorchOn(true);
                            setMotionCount(0);
                          }
                        }
                      } catch (error) {
                        console.error('[Torch] Error alternando linterna:', error);
                      }
                    }}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: isTorchOn ? '#4caf50' : '#ccc',
                    transition: '0.3s',
                    borderRadius: '28px',
                    boxShadow: isTorchOn ? '0 0 10px rgba(76, 175, 80, 0.5)' : 'none'
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '""',
                      height: '20px',
                      width: '20px',
                      left: isTorchOn ? '28px' : '4px',
                      bottom: '4px',
                      backgroundColor: 'white',
                      transition: '0.3s',
                      borderRadius: '50%',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                    }} />
                  </span>
                </label>
              </div>

              {/* Texto del estado ON/OFF */}
              <div style={{
                textAlign: 'center',
                padding: '8px',
                backgroundColor: isTorchOn ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                border: isTorchOn ? '1px solid rgba(76, 175, 80, 0.4)' : '1px solid rgba(255, 255, 255, 0.2)',
                marginBottom: '8px'
              }}>
                <div style={{
                  color: isTorchOn ? '#4caf50' : '#999',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  letterSpacing: '2px'
                }}>
                  {isTorchOn ? 'ON' : 'OFF'}
                </div>
              </div>
              
              {/* Contador de movimientos - solo cuando está apagada */}
              {!isTorchOn && (
                <div>
                  <div style={{
                    color: '#aaa',
                    fontSize: '11px',
                    textAlign: 'center',
                    marginBottom: '8px'
                  }}>
                    O mueve 3 veces
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '6px'
                  }}>
                    {[1, 2, 3].map((num) => (
                      <div
                        key={num}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          backgroundColor: motionCount >= num ? '#4caf50' : 'rgba(255, 255, 255, 0.2)',
                          color: motionCount >= num ? 'white' : '#666',
                          border: motionCount >= num ? '2px solid #2e7d32' : '2px solid rgba(255, 255, 255, 0.3)',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {num}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Recomendación de uso */}
            {!isTorchOn && !showQRScanner && (
              <div style={{
                backgroundColor: 'rgba(255, 193, 7, 0.95)',
                padding: '12px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                maxWidth: '200px',
                animation: 'pulse 2s ease-in-out infinite'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '6px'
                }}>
                  <IonIcon 
                    icon={flashlight} 
                    style={{ fontSize: '18px', color: '#000' }}
                  />
                  <div style={{
                    color: '#000',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    Recomendación
                  </div>
                </div>
                <div style={{
                  color: '#000',
                  fontSize: '11px',
                  lineHeight: '1.4'
                }}>
                  Enciende la linterna para escanear mejor en lugares oscuros
                </div>
              </div>
            )}
          </div>
        )}

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
                    {isTorchAvailable && (
                      <div className="step">
                        <div className="step-number">
                          <IonIcon icon={flashlight} style={{ fontSize: '20px' }} />
                        </div>
                        <div className="step-content">
                          <h4>Linterna Automática</h4>
                          <p>Mueve tu teléfono 3 veces para encender la linterna automáticamente. Úsala en lugares oscuros para escanear mejor.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </IonCardContent>
              </IonCard>
            </div>
          )}
        </div>

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

        <IonLoading
          isOpen={isLoading}
          message="Procesando captura..."
        />
      </IonContent>
    </IonPage>
  );
};

export default Tab4;
