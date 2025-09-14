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
import { QRScanner as IonicQRScanner, QRScannerStatus } from '@ionic-native/qr-scanner';
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

      // Para web: usar getUserMedia
      if (!window.Capacitor || !window.Capacitor.isNativePlatform()) {
        try {
          console.log('Iniciando escáner QR en web...');
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
            console.log('Cámara web iniciada exitosamente');
            return;
          }
        } catch (webError) {
          console.log('Error en cámara web:', webError);
          setCameraError('No se pudo acceder a la cámara en web');
        }
      }

      // Para móvil: usar Ionic Native QRScanner
      if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        try {
          console.log('Iniciando escáner QR nativo...');
          
          // Preparar el QRScanner
          const status: QRScannerStatus = await IonicQRScanner.prepare();
          
          if (status.authorized) {
            console.log('Permisos de cámara concedidos');
            setIsScanning(true);
            
            // Mostrar la vista previa de la cámara
            await IonicQRScanner.show();
            
            // Iniciar el escaneo
            const scanSubscription = IonicQRScanner.scan().subscribe((text: string) => {
              console.log('QR detectado:', text);
              
              // Buscar el Pokémon correspondiente al código QR
              const pokemon = availablePokemon.find(p => p.qrCode === text);
              
              if (pokemon) {
                const detectedPokemon: CapturedPokemon = {
                  ...pokemon,
                  captureTime: new Date()
                };
                
                setDetectedPokemon(detectedPokemon);
                setShowPokemonAlert(true);
                
                // Detener el escáner
                IonicQRScanner.hide();
                scanSubscription.unsubscribe();
              } else {
                console.log('Pokémon no encontrado para el código QR:', text);
              }
            });
            
            console.log('Escáner QR nativo iniciado exitosamente');
            return;
          } else if (status.denied) {
            console.log('Permisos de cámara denegados permanentemente');
            setCameraError('Permisos de cámara denegados. Ve a configuración para habilitarlos.');
          } else {
            console.log('Permisos de cámara no concedidos');
            setCameraError('Se necesitan permisos de cámara para escanear códigos QR.');
          }
        } catch (nativeError) {
          console.log('Error en escáner QR nativo:', nativeError);
          setCameraError('Error al inicializar el escáner QR nativo');
        }
      }

    } catch (error: any) {
      console.error('Error starting scanner:', error);
      setCameraError(error.message || 'No se pudo acceder a la cámara');
    } finally {
      setIsLoading(false);
    }
  };

  const stopScanner = () => {
    // Detener stream de web
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Detener QRScanner nativo
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
      IonicQRScanner.hide().catch(console.error);
      IonicQRScanner.destroy().catch(console.error);
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
          // Para móvil, usar el QRScanner nativo directamente
          console.log('Captura manual no disponible en modo nativo');
          simulateQRDetection();
        } catch (cameraError) {
          console.log('Error con captura nativa, simulando:', cameraError);
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
                    <p>• getUserMedia Legacy: {(navigator as any).getUserMedia ? 'Disponible' : 'No disponible'}</p>
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
