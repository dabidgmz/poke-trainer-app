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
  pokeball
} from 'ionicons/icons';
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
  const [flashOn, setFlashOn] = useState(false);
  const [capturedPokemon, setCapturedPokemon] = useState<CapturedPokemon[]>([]);
  const [showCaptureAlert, setShowCaptureAlert] = useState(false);
  const [newPokemon, setNewPokemon] = useState<CapturedPokemon | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  const startCamera = async () => {
    try {
      setIsLoading(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('No se pudo acceder a la cámara. Asegúrate de dar permisos.');
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const toggleFlash = () => {
    setFlashOn(!flashOn);
    // En una implementación real, aquí controlarías el flash de la cámara
  };

  const capturePhoto = () => {
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

  return (
    <IonPage className="capture-page">
      <IonHeader className="capture-header">
        <IonToolbar className="capture-toolbar">
          <IonTitle className="capture-title">
            <div className="capture-header-content">
              <div className="capture-logo">
                <div className="pokeball-icon"></div>
              </div>
              <span className="capture-text">POKÉMON CAPTURE</span>
            </div>
          </IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="capture-content">
        <div className="capture-body">
          {/* Cámara de captura */}
          <div className="camera-container">
            {!isScanning ? (
              <div className="camera-placeholder">
                <div className="camera-icon">
                  <IonIcon icon={camera} />
                </div>
                <h3>Activa la cámara para capturar Pokémon</h3>
                <p>Escanea códigos QR para encontrar Pokémon salvajes</p>
                <IonButton 
                  className="start-camera-btn" 
                  onClick={startCamera}
                  disabled={isLoading}
                >
                  <IonIcon icon={camera} slot="start" />
                  Activar Cámara
                </IonButton>
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

          {/* Instrucciones */}
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
                      <h4>Activa la cámara</h4>
                      <p>Presiona el botón para activar la cámara de tu dispositivo</p>
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
                      <p>Presiona el botón de captura para atrapar al Pokémon</p>
                    </div>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          </div>
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
