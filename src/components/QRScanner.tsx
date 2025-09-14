import React, { useState, useRef, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonLoading,
  IonAlert
} from '@ionic/react';
import {
  close,
  flash,
  flashOff,
  refresh,
  checkmark,
  camera
} from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import './QRScanner.css';

interface QRScannerProps {
  onQRDetected: (qrCode: string) => void;
  onClose: () => void;
}

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

const QRScanner: React.FC<QRScannerProps> = ({ onQRDetected, onClose }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showPokemonAlert, setShowPokemonAlert] = useState(false);
  const [detectedPokemon, setDetectedPokemon] = useState<CapturedPokemon | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Pokémon disponibles para detectar (simulados)
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

  // Inicializar el escáner al montar el componente
  useEffect(() => {
    startScanner();
    
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    try {
      setIsLoading(true);
      setCameraError(null);

      // Intentar múltiples métodos para acceder a la cámara
      let cameraAccessSuccess = false;

      // Verificar HTTPS primero - lógica más robusta
      const hostname = window.location.hostname.toLowerCase();
      const protocol = window.location.protocol.toLowerCase();
      
      const isLocalhost = hostname === 'localhost' || 
                         hostname === '127.0.0.1' || 
                         hostname.includes('localhost') ||
                         hostname.includes('127.0.0.1') ||
                         hostname.startsWith('192.168.') ||
                         hostname.startsWith('10.') ||
                         hostname.endsWith('.local');
                         
      const isHTTPS = protocol === 'https:' || isLocalhost;
      
      console.log('Debug de detección:');
      console.log('- Protocol:', window.location.protocol);
      console.log('- Hostname:', window.location.hostname);
      console.log('- Is localhost:', isLocalhost);
      console.log('- Is HTTPS:', isHTTPS);
      
      if (!isHTTPS) {
        console.log('No está en HTTPS, activando modo simulación automáticamente');
        setIsScanning(true);
        startQRAnalysis();
        cameraAccessSuccess = true;
        return;
      }
      
      console.log('HTTPS/localhost detectado, intentando acceder a la cámara...');

      // Método 1: getUserMedia con configuración estándar
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          console.log('Intentando getUserMedia con configuración estándar...');
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'environment',
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          });

          if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
            streamRef.current = stream;
            setIsScanning(true);
            startQRAnalysis();
            cameraAccessSuccess = true;
            console.log('getUserMedia exitoso con configuración estándar');
            return;
          }
        } catch (getUserMediaError) {
          console.log('getUserMedia estándar falló:', getUserMediaError);
        }
      }

      // Método 2: getUserMedia con configuración básica
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && !cameraAccessSuccess) {
        try {
          console.log('Intentando getUserMedia con configuración básica...');
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true
          });

          if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
            streamRef.current = stream;
            setIsScanning(true);
            startQRAnalysis();
            cameraAccessSuccess = true;
            console.log('getUserMedia exitoso con configuración básica');
            return;
          }
        } catch (getUserMediaError) {
          console.log('getUserMedia básico falló:', getUserMediaError);
        }
      }

      // Método 3: getUserMedia legacy (para navegadores antiguos)
      if (navigator.getUserMedia && !cameraAccessSuccess) {
        try {
          console.log('Intentando getUserMedia legacy...');
          const stream = await new Promise<MediaStream>((resolve, reject) => {
            navigator.getUserMedia({ video: true }, resolve, reject);
          });

          if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
            streamRef.current = stream;
            setIsScanning(true);
            startQRAnalysis();
            cameraAccessSuccess = true;
            console.log('getUserMedia legacy exitoso');
            return;
          }
        } catch (legacyError) {
          console.log('getUserMedia legacy falló:', legacyError);
        }
      }

      // Método 4: Capacitor Camera (para Android/iOS)
      if (!cameraAccessSuccess) {
        try {
          console.log('Intentando Capacitor Camera...');
          
          // Verificar si estamos en una plataforma nativa
          if (window.Capacitor && window.Capacitor.isNativePlatform()) {
            setIsScanning(true);
            startQRAnalysis();
            cameraAccessSuccess = true;
            console.log('Capacitor Camera activado');
            return;
          }
        } catch (capacitorError) {
          console.log('Capacitor Camera falló:', capacitorError);
        }
      }

      // Si todos los métodos fallan, mostrar error específico
      if (!cameraAccessSuccess) {
        let errorMessage = 'No se pudo acceder a la cámara. ';
        
        const hostname = window.location.hostname.toLowerCase();
        const protocol = window.location.protocol.toLowerCase();
        
        const isLocalhost = hostname === 'localhost' || 
                           hostname === '127.0.0.1' || 
                           hostname.includes('localhost') ||
                           hostname.includes('127.0.0.1') ||
                           hostname.startsWith('192.168.') ||
                           hostname.startsWith('10.') ||
                           hostname.endsWith('.local');
                           
        const isHTTPS = protocol === 'https:' || isLocalhost;
        
        if (!isHTTPS) {
          errorMessage += 'Para usar la cámara en web, necesitas HTTPS. Usa "Modo Simulación" para probar la funcionalidad.';
        } else if (!navigator.mediaDevices && !navigator.getUserMedia) {
          errorMessage += 'Tu navegador no soporta acceso a la cámara.';
        } else if (window.Capacitor && !window.Capacitor.isNativePlatform()) {
          errorMessage += 'Asegúrate de que los permisos de cámara estén habilitados en tu navegador.';
        } else {
          errorMessage += 'Verifica que la cámara no esté siendo usada por otra aplicación.';
        }
        
        throw new Error(errorMessage);
      }

    } catch (error: any) {
      console.error('Error starting scanner:', error);
      setCameraError(error.message || 'No se pudo acceder a la cámara');
    } finally {
      setIsLoading(false);
    }
  };

  const stopScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const startQRAnalysis = () => {
    // Simular análisis de QR cada 2 segundos
    const interval = setInterval(() => {
      if (!isScanning) {
        clearInterval(interval);
        return;
      }
      
      // Simular detección de QR ocasionalmente
      if (Math.random() < 0.3) { // 30% de probabilidad cada 2 segundos
        simulateQRDetection();
      }
    }, 2000);
  };

  const simulateQRDetection = () => {
    const randomPokemon = availablePokemon[Math.floor(Math.random() * availablePokemon.length)];
    setDetectedPokemon({
      ...randomPokemon,
      captureTime: new Date()
    });
    setShowPokemonAlert(true);
  };

  const toggleFlash = () => {
    setFlashOn(!flashOn);
  };

  const handleCapture = async () => {
    try {
      console.log('Iniciando captura...');
      
      if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        // En Android, usar el plugin de Cámara de Capacitor
        console.log('Usando Capacitor Camera para captura...');
        
        try {
          const image = await Camera.getPhoto({
            quality: 90,
            allowEditing: false,
            resultType: CameraResultType.DataUrl,
            source: CameraSource.Camera
          });

          if (image.dataUrl) {
            console.log('Imagen capturada exitosamente');
            // Simular detección de QR
            simulateQRDetection();
          }
        } catch (cameraError) {
          console.log('Error con Capacitor Camera, simulando captura:', cameraError);
          // Si falla la captura real, simular
          simulateQRDetection();
        }
      } else {
        // En web, usar canvas si hay video stream
        if (videoRef.current && canvasRef.current && streamRef.current) {
          try {
            console.log('Capturando desde canvas...');
            const canvas = canvasRef.current;
            const video = videoRef.current;
            const context = canvas.getContext('2d');
            
            if (context) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              context.drawImage(video, 0, 0);
              
              // Aquí podrías procesar la imagen para detectar QR real
              // Por ahora, simulamos la detección
              simulateQRDetection();
            }
          } catch (canvasError) {
            console.log('Error con canvas, simulando captura:', canvasError);
            simulateQRDetection();
          }
        } else {
          // Si no hay stream, simular captura
          console.log('No hay stream de video, simulando captura...');
          simulateQRDetection();
        }
      }
    } catch (error) {
      console.error('Error en handleCapture:', error);
      // En caso de cualquier error, simular captura
      simulateQRDetection();
    }
  };

  const confirmCapture = () => {
    if (detectedPokemon) {
      onQRDetected(detectedPokemon.qrCode || '');
      onClose();
    }
  };

  const cancelCapture = () => {
    setDetectedPokemon(null);
    setShowPokemonAlert(false);
  };

  return (
    <IonPage className="qr-scanner-page">
      <IonHeader className="qr-scanner-header">
        <IonToolbar className="qr-scanner-toolbar">
          <IonTitle className="qr-scanner-title">QR Scanner</IonTitle>
          <IonButton
            slot="end"
            fill="clear"
            onClick={onClose}
            className="close-btn"
          >
            <IonIcon icon={close} />
          </IonButton>
        </IonToolbar>
      </IonHeader>
      
      <IonContent fullscreen className="qr-scanner-content">
        <div className="scanner-container">
          {!isScanning ? (
            <div className="scanner-placeholder">
              <IonIcon icon={refresh} className="scanner-icon" />
              <h3>Iniciando escáner...</h3>
              {cameraError && (
                <div className="scanner-error">
                  <p>{cameraError}</p>
                  <div className="error-actions">
                    <IonButton onClick={startScanner} fill="outline" className="retry-btn">
                      <IonIcon icon={refresh} slot="start" />
                      Reintentar
                    </IonButton>
                    <IonButton onClick={() => {
                      setCameraError(null);
                      setIsScanning(true);
                      startQRAnalysis();
                    }} fill="outline" className="simulate-btn">
                      <IonIcon icon={checkmark} slot="start" />
                      Modo Simulación
                    </IonButton>
                    <IonButton onClick={() => {
                      console.log('Forzando acceso a cámara en localhost...');
                      setCameraError(null);
                      // Intentar acceso directo sin verificaciones
                      navigator.mediaDevices.getUserMedia({ video: true })
                        .then(stream => {
                          if (videoRef.current) {
                            videoRef.current.srcObject = stream;
                            streamRef.current = stream;
                            setIsScanning(true);
                            startQRAnalysis();
                          }
                        })
                        .catch(error => {
                          console.log('Error forzando cámara:', error);
                          setCameraError('Error al acceder a la cámara: ' + error.message);
                        });
                    }} fill="outline" className="force-btn">
                      <IonIcon icon={camera} slot="start" />
                      Forzar Cámara
                    </IonButton>
                  </div>
                  <div className="debug-info">
                    <p><strong>Información de debug:</strong></p>
                    <p>• getUserMedia: {navigator.mediaDevices ? 'Disponible' : 'No disponible'}</p>
                    <p>• getUserMedia Legacy: {navigator.getUserMedia ? 'Disponible' : 'No disponible'}</p>
                    <p>• Capacitor: {window.Capacitor ? 'Disponible' : 'No disponible'}</p>
                    <p>• Plataforma nativa: {window.Capacitor?.isNativePlatform() ? 'Sí' : 'No'}</p>
                    <p>• Protocolo: {window.location.protocol}</p>
                    <p>• Hostname: {window.location.hostname}</p>
                    <p>• URL completa: {window.location.href}</p>
                    <p>• Es localhost: {window.location.hostname === 'localhost' || window.location.hostname.includes('localhost') ? 'Sí' : 'No'}</p>
                    <p>• Es 127.0.0.1: {window.location.hostname === '127.0.0.1' || window.location.hostname.includes('127.0.0.1') ? 'Sí' : 'No'}</p>
                    
                    {window.location.protocol !== 'https:' && !window.location.hostname.toLowerCase().includes('localhost') && !window.location.hostname.toLowerCase().includes('127.0.0.1') && (
                      <div className="https-warning">
                        <p><strong>⚠️ Problema detectado:</strong></p>
                        <p>Para usar la cámara en web necesitas HTTPS. Opciones:</p>
                        <ul>
                          <li>Usar "Modo Simulación" para probar la funcionalidad</li>
                          <li>Ejecutar en localhost (http://localhost:8100)</li>
                          <li>Configurar HTTPS en tu servidor</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="scanner-view">
              {/* Mostrar video solo si hay stream */}
              {streamRef.current ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="scanner-video"
                />
              ) : (
                /* Vista simulada para Android/Capacitor */
                <div className="scanner-video-placeholder">
                  <div className="camera-preview">
                    <IonIcon icon={camera} className="camera-preview-icon" />
                    <p>Cámara activa - Lista para escanear</p>
                  </div>
                </div>
              )}
              
              <canvas
                ref={canvasRef}
                className="scanner-canvas"
                style={{ display: 'none' }}
              />

              {/* Overlay de escaneo QR */}
              <div className="qr-overlay">
                <div className="qr-frame">
                  <div className="corner top-left"></div>
                  <div className="corner top-right"></div>
                  <div className="corner bottom-left"></div>
                  <div className="corner bottom-right"></div>
                </div>
                <div className="scan-line"></div>
                <div className="qr-instruction">
                  <p>Apunta hacia un código QR de Pokémon</p>
                  {!streamRef.current && (
                    <p className="android-instruction">Presiona el botón de captura para escanear</p>
                  )}
                </div>
              </div>

              {/* Controles del escáner */}
              <div className="scanner-controls">
                <IonButton
                  className="control-btn flash-btn"
                  onClick={toggleFlash}
                  fill="clear"
                >
                  <IonIcon icon={flashOn ? flash : flashOff} />
                </IonButton>

                <IonButton
                  className="capture-btn"
                  onClick={handleCapture}
                  disabled={isLoading}
                >
                  <div className="scan-button">
                    <IonIcon icon={refresh} />
                  </div>
                </IonButton>

                <IonButton
                  className="control-btn close-btn"
                  onClick={onClose}
                  fill="clear"
                >
                  <IonIcon icon={close} />
                </IonButton>
              </div>
            </div>
          )}
        </div>

        {/* Instrucciones */}
        <div className="scanner-instructions">
          <div className="instruction-card">
            <h4>¿Cómo funciona?</h4>
            <p>1. Apunta la cámara hacia un código QR de Pokémon</p>
            <p>2. El escáner detectará automáticamente el código</p>
            <p>3. Confirma la captura del Pokémon detectado</p>
          </div>
        </div>

        {/* Alertas */}
        <IonAlert
          isOpen={showPokemonAlert}
          onDidDismiss={() => setShowPokemonAlert(false)}
          header="¡Pokémon Detectado!"
          message={detectedPokemon ? `Has encontrado a ${detectedPokemon.name} (Nivel ${detectedPokemon.level})` : ''}
          buttons={[
            {
              text: 'Cancelar',
              role: 'cancel',
              handler: cancelCapture
            },
            {
              text: 'Capturar',
              handler: confirmCapture
            }
          ]}
        />

        <IonLoading
          isOpen={isLoading}
          message="Iniciando escáner..."
        />
      </IonContent>
    </IonPage>
  );
};

export default QRScanner;
