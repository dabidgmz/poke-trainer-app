import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonCard, IonCardContent, IonIcon, IonSpinner,
  IonAlert, IonToggle, IonItem, IonLabel, IonText,
  IonGrid, IonRow, IonCol, IonChip, IonBadge
} from '@ionic/react';
import { alertController } from '@ionic/core';
import { Capacitor } from '@capacitor/core';
import { 
  flashlight, 
  flashlightOutline, 
  phonePortrait, 
  warning,
  checkmarkCircle,
  closeCircle,
  settings,
  navigate
} from 'ionicons/icons';
import { Torch } from '@capawesome/capacitor-torch';
import ProfileButton from '../components/ProfileButton';
import OfflineMessage from '../components/OfflineMessage';
import offlineCache from '../services/offlineCache';
import './Tab6.css';

// Hook personalizado para la linterna usando getUserMedia (basado en Vue)
const useFlashlight = () => {
  const [toggled, setToggled] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [track, setTrack] = useState<MediaStreamTrack | null>(null);

  const toggleAsync = async () => {
    if (toggled) {
      await stopAsync();
    } else {
      await startAsync();
    }
  };

  const startAsync = async () => {
    try {
      if (!('mediaDevices' in navigator)) {
        throw new Error('Dispositivo no soportado');
      }

      setDisabled(true);

      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter((device) => device.kind === 'videoinput');
      
      if (cameras.length === 0) {
        throw new Error('Cámara no encontrada');
      }

      // Usar la cámara trasera (última en la lista)
      const camera = cameras[cameras.length - 1];

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: camera.deviceId,
          facingMode: ['user', 'environment'],
        },
      });

      const videoTrack = stream.getVideoTracks()[0];
      setTrack(videoTrack);

      // Aplicar restricciones para activar la linterna
      await videoTrack.applyConstraints({
        advanced: [{ torch: true } as any],
      });

      setDisabled(false);
      setToggled(true);
    } catch (err: any) {
      console.error('Error activando linterna:', err);
      setDisabled(false);
      throw err;
    }
  };

  const stopAsync = async () => {
    if (track) {
      setDisabled(true);
      track.stop();
      setTrack(null);
      setDisabled(false);
      setToggled(false);
    }
  };

  return { toggleAsync, toggled, disabled };
};

const Tab6: React.FC = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [useWebTorch, setUseWebTorch] = useState(false);
  
  // Estados para detección de movimiento
  const [motionData, setMotionData] = useState({ x: 0, y: 0, z: 0 });
  const [isMotionSupported, setIsMotionSupported] = useState(false);
  const [isMotionActive, setIsMotionActive] = useState(false);
  const [motionMagnitude, setMotionMagnitude] = useState(0);
  const [motionCount, setMotionCount] = useState(0);
  const [lastMotionMagnitude, setLastMotionMagnitude] = useState(0);
  const [isAutoLightEnabled, setIsAutoLightEnabled] = useState(false);
  
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();
  
  // Hook para linterna web
  const { toggleAsync: toggleWebTorch, toggled: webTorchToggled, disabled: webTorchDisabled } = useFlashlight();
  
  const isActuallyNative = useMemo(() => {
    // Verificar múltiples indicadores de plataforma nativa
    const userAgent = navigator.userAgent;
    const isAndroid = /Android/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isCapacitor = window.Capacitor && window.Capacitor.isNativePlatform();
    const hasNativePlugins = window.Capacitor && (window.Capacitor as any).Plugins;
    
    console.log('[Torch] Detección de plataforma:', {
      isNative,
      platform,
      isAndroid,
      isIOS,
      isCapacitor,
      hasNativePlugins,
      userAgent
    });
    
    return isCapacitor && (isAndroid || isIOS) && hasNativePlugins;
  }, [isNative, platform]);

  // Verificar disponibilidad de la linterna
  const checkTorchAvailability = async () => {
    console.log('[Torch] Verificando disponibilidad:', { isNative, isActuallyNative, platform });
    
    // Primero intentar con el plugin nativo
    if (isActuallyNative) {
      try {
        const result = await Torch.isAvailable();
        if (result.available) {
          setIsAvailable(true);
          const enabledResult = await Torch.isEnabled();
          setIsEnabled(enabledResult.enabled);
          setUseWebTorch(false);
          return;
        }
      } catch (error) {
        console.error('Error con plugin nativo:', error);
      }
    }
    
    // Si no funciona el plugin nativo, intentar con getUserMedia
    try {
      if ('mediaDevices' in navigator) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((device) => device.kind === 'videoinput');
        
        if (cameras.length > 0) {
          console.log('[Torch] Usando linterna web con getUserMedia');
          setIsAvailable(true);
          setUseWebTorch(true);
          setIsEnabled(webTorchToggled);
          return;
        }
      }
    } catch (error) {
      console.error('Error verificando cámaras:', error);
    }
    
    console.log('[Torch] Linterna no disponible');
    setIsAvailable(false);
  };

  // Habilitar linterna
  const enableTorch = async () => {
    if (!isAvailable) {
      setAlertMessage('La linterna no está disponible en este dispositivo');
      setShowAlert(true);
      return;
    }

    setIsLoading(true);
    try {
      await Torch.enable();
      setIsEnabled(true);
      setAlertMessage('Linterna encendida');
      setShowAlert(true);
    } catch (error: any) {
      console.error('Error encendiendo linterna:', error);
      setAlertMessage(`Error: ${error.message || 'No se pudo encender la linterna'}`);
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Deshabilitar linterna
  const disableTorch = async () => {
    if (!isAvailable) return;

    setIsLoading(true);
    try {
      await Torch.disable();
      setIsEnabled(false);
      setAlertMessage('Linterna apagada');
      setShowAlert(true);
    } catch (error: any) {
      console.error('Error apagando linterna:', error);
      setAlertMessage(`Error: ${error.message || 'No se pudo apagar la linterna'}`);
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Alternar linterna
  const toggleTorch = async () => {
    if (!isAvailable) {
      setAlertMessage('La linterna no está disponible en este dispositivo');
      setShowAlert(true);
      return;
    }

    setIsLoading(true);
    try {
      if (useWebTorch) {
        // Usar linterna web
        await toggleWebTorch();
        setIsEnabled(webTorchToggled);
        setAlertMessage(webTorchToggled ? 'Linterna encendida' : 'Linterna apagada');
      } else {
        // Usar plugin nativo
        await Torch.toggle();
        const result = await Torch.isEnabled();
        setIsEnabled(result.enabled);
        setAlertMessage(result.enabled ? 'Linterna encendida' : 'Linterna apagada');
      }
      setShowAlert(true);
    } catch (error: any) {
      console.error('Error alternando linterna:', error);
      setAlertMessage(`Error: ${error.message || 'No se pudo alternar la linterna'}`);
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para mostrar información sobre detección de movimiento
  const showMotionInfo = () => {
    if (isMotionSupported) {
      setAlertMessage('El sensor de movimiento está activo. Mueve tu dispositivo para ver los cambios en tiempo real.');
    } else {
      setAlertMessage('La detección de movimiento no está disponible en este dispositivo o navegador.');
    }
    setShowAlert(true);
  };

  // Función para activar/desactivar el monitoreo de movimiento
  const toggleMotionMonitoring = () => {
    setIsMotionActive(!isMotionActive);
    if (!isMotionActive) {
      setMotionCount(0); // Resetear contador al activar
    }
  };

  // Función para activar/desactivar encendido automático
  const toggleAutoLight = () => {
    const newValue = !isAutoLightEnabled;
    setIsAutoLightEnabled(newValue);
    if (newValue) {
      setMotionCount(0); // Resetear contador al activar modo automático
      if (!isMotionActive) {
        setIsMotionActive(true); // Activar monitoreo automáticamente
      }
    }
  };

  // Función para resetear el contador
  const resetMotionCount = () => {
    setMotionCount(0);
  };

  // Efecto para detectar movimiento del dispositivo
  useEffect(() => {
    // Verificar si DeviceMotion está disponible
    if (window.DeviceMotionEvent) {
      setIsMotionSupported(true);
    }

    let handleMotion: ((event: DeviceMotionEvent) => void) | null = null;
    const MOTION_THRESHOLD = 15; // Umbral para detectar un movimiento significativo
    const MOTION_COOLDOWN = 500; // Tiempo de espera entre movimientos (ms)
    let lastMotionTime = 0;

    if (isMotionActive && isMotionSupported) {
      handleMotion = (event: DeviceMotionEvent) => {
        if (event.accelerationIncludingGravity) {
          const x = event.accelerationIncludingGravity.x || 0;
          const y = event.accelerationIncludingGravity.y || 0;
          const z = event.accelerationIncludingGravity.z || 0;
          
          setMotionData({ 
            x: parseFloat(x.toFixed(2)), 
            y: parseFloat(y.toFixed(2)), 
            z: parseFloat(z.toFixed(2)) 
          });
          
          // Calcular magnitud del movimiento
          const magnitude = Math.sqrt(x * x + y * y + z * z);
          setMotionMagnitude(parseFloat(magnitude.toFixed(2)));
          
          // Detectar movimiento significativo (pico)
          if (isAutoLightEnabled) {
            const currentTime = Date.now();
            
            // Detectar un pico de movimiento significativo
            if (magnitude > MOTION_THRESHOLD && (currentTime - lastMotionTime) > MOTION_COOLDOWN) {
              lastMotionTime = currentTime;
              
              setMotionCount(prevCount => {
                const newCount = prevCount + 1;
                console.log(`Movimiento detectado! Total: ${newCount}/3`);
                return newCount;
              });
            }
          }
          
          setLastMotionMagnitude(magnitude);
        }
      };

      window.addEventListener('devicemotion', handleMotion);
    }

    return () => {
      if (handleMotion) {
        window.removeEventListener('devicemotion', handleMotion);
      }
    };
  }, [isMotionActive, isMotionSupported, isAutoLightEnabled]);

  // Efecto para encender/apagar la linterna después de 3 movimientos
  useEffect(() => {
    if (isAutoLightEnabled && motionCount >= 3 && isAvailable) {
      console.log('¡3 movimientos detectados! Alternando linterna...');
      
      // Alternar la linterna (encender o apagar)
      const toggleLight = async () => {
        try {
          if (isEnabled) {
            // Apagar la linterna
            if (useWebTorch) {
              if (webTorchToggled) {
                await toggleWebTorch();
              }
            } else {
              await Torch.disable();
            }
            setIsEnabled(false);
            setAlertMessage('¡Linterna apagada automáticamente! 3 movimientos detectados 💤');
            setShowAlert(true);
          } else {
            // Encender la linterna
            if (useWebTorch) {
              if (!webTorchToggled) {
                await toggleWebTorch();
              }
            } else {
              await Torch.enable();
            }
            setIsEnabled(true);
            setAlertMessage('¡Linterna encendida automáticamente! 3 movimientos detectados 🎉');
            setShowAlert(true);
          }
          
          // Resetear contador después de alternar
          setTimeout(() => {
            setMotionCount(0);
          }, 1000);
        } catch (error: any) {
          console.error('Error alternando linterna automáticamente:', error);
          setAlertMessage(`Error: ${error.message || 'No se pudo alternar la linterna'}`);
          setShowAlert(true);
          setMotionCount(0);
        }
      };
      
      toggleLight();
    }
  }, [motionCount, isAutoLightEnabled, isAvailable, useWebTorch, webTorchToggled, isEnabled]);

  // Efecto inicial
  useEffect(() => {
    checkTorchAvailability();
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

  // Mostrar alerta
  const showAlertDialog = async (message: string) => {
    const alert = await alertController.create({
      header: 'Linterna',
      message,
      buttons: ['OK']
    });
    await alert.present();
  };

  return (
    <IonPage className="torch-page">
      <IonHeader style={{ '--background': '#dc2626', '--color': 'white' }}>
        <IonToolbar style={{ '--background': '#dc2626', '--color': 'white' }}>
          <IonTitle style={{ color: 'white', fontWeight: 'bold' }}>⚡ Linterna</IonTitle>
          <ProfileButton />
        </IonToolbar>
      </IonHeader>

      <IonContent scrollY>
        {!isOnline ? (
          <OfflineMessage onRetry={() => setIsOnline(navigator.onLine)} />
        ) : (
          <>
        {/* Alerta */}
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Linterna"
          message={alertMessage}
          buttons={['OK']}
        />

        {/* Tarjeta de estado estilo Pokémon */}
        <IonCard style={{ 
          margin: '20px', 
          background: 'white', 
          borderRadius: '20px',
          border: '3px solid #dc2626',
          boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
        }}>
          <IonCardContent>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px',
              padding: '10px'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: isEnabled ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isEnabled ? '0 0 20px rgba(251, 191, 36, 0.6)' : '0 4px 12px rgba(220, 38, 38, 0.4)',
                border: '3px solid white',
                animation: isEnabled ? 'pulse 2s ease-in-out infinite' : 'none'
              }}>
                <IonIcon 
                  icon={isEnabled ? flashlight : flashlightOutline} 
                  style={{ 
                    fontSize: '40px', 
                    color: 'white',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ 
                  margin: 0, 
                  color: '#dc2626', 
                  fontSize: '20px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  {isEnabled ? '⚡ ¡Encendida!' : '💤 Apagada'}
                </h2>
                <p style={{ 
                  margin: '4px 0 0 0', 
                  color: '#6b7280', 
                  fontSize: '14px' 
                }}>
                  {isAvailable 
                    ? (isEnabled ? '¡Lista para usar!' : 'Presiona para encender')
                    : 'Linterna no disponible'
                  }
                </p>
              </div>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Botón único de control estilo Pokémon */}
        {isAvailable && (
          <IonCard style={{ 
            margin: '0 20px 20px 20px', 
            background: 'white', 
            borderRadius: '20px',
            border: '3px solid #dc2626',
            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
          }}>
            <IonCardContent>
                    <IonButton 
                      expand="block" 
                      onClick={toggleTorch}
                disabled={isLoading || (useWebTorch ? webTorchDisabled : false)}
                style={{
                  '--background': isEnabled ? '#dc2626' : '#dc2626',
                  '--color': 'white',
                  '--border-radius': '15px',
                  '--padding-top': '20px',
                  '--padding-bottom': '20px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  boxShadow: isEnabled 
                    ? '0 4px 12px rgba(220, 38, 38, 0.5)' 
                    : '0 4px 12px rgba(220, 38, 38, 0.3)',
                  border: '3px solid white',
                  height: '60px'
                }}
                size="large"
                    >
                      {isLoading ? (
                  <IonSpinner color="light" />
                      ) : (
                        <>
                    <IonIcon 
                      icon={isEnabled ? flashlightOutline : flashlight} 
                      slot="start" 
                      style={{ fontSize: '24px' }}
                    />
                    {isEnabled ? '💤 Apagar' : '⚡ Encender'}
                        </>
                      )}
                    </IonButton>
            </IonCardContent>
          </IonCard>
        )}

        {/* Control de encendido automático con movimiento */}
        {isAvailable && isMotionSupported && (
          <IonCard style={{ 
            margin: '0 20px 20px 20px', 
            background: 'white', 
            borderRadius: '20px',
            border: '3px solid #dc2626',
            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
          }}>
          <IonCardContent>
              <h3 style={{ 
                color: '#dc2626', 
                fontSize: '18px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                📱 Control con Movimiento
              </h3>
              
                <div style={{ 
                  backgroundColor: isAutoLightEnabled 
                  ? (isEnabled ? '#fee2e2' : '#fef2f2')
                    : '#f8f9fa',
                  padding: '16px', 
                borderRadius: '15px',
                  marginBottom: '16px',
                  border: isAutoLightEnabled 
                  ? (isEnabled ? '3px solid #dc2626' : '3px solid #dc2626')
                  : '2px solid #e5e7eb',
                transition: 'all 0.3s ease',
                background: isAutoLightEnabled 
                  ? (isEnabled ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)')
                  : 'white'
                }}>
                  <IonItem lines="none" style={{ '--background': 'transparent' }}>
                    <IonIcon 
                      icon={flashlight} 
                      slot="start" 
                      style={{ color: '#dc2626', fontSize: '24px' }}
                    />
                    <IonLabel>
                    <h3 style={{ fontWeight: 'bold', color: '#dc2626' }}>Encender/Apagar Sacudiendo</h3>
                      <p style={{ fontSize: '12px' }}>
                        {isAutoLightEnabled 
                          ? (isEnabled 
                            ? 'Sacude 3 veces para apagar la linterna' 
                            : 'Sacude 3 veces para encender la linterna')
                        : 'Activa para controlar la linterna sacudiendo el teléfono'}
                      </p>
                    </IonLabel>
                    <IonToggle 
                      checked={isAutoLightEnabled}
                      onIonChange={toggleAutoLight}
                      color="success"
                    />
                  </IonItem>

                  {/* Contador de movimientos */}
                  {isAutoLightEnabled && (
                    <div style={{ 
                      marginTop: '12px',
                      textAlign: 'center',
                      padding: '16px',
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      border: isEnabled ? '2px solid #dc3545' : '2px solid #28a745'
                    }}>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: 'bold',
                        color: isEnabled ? '#dc3545' : '#28a745', 
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}>
                        <IonIcon 
                          icon={isEnabled ? flashlight : flashlightOutline} 
                          style={{ fontSize: '18px' }}
                        />
                        {isEnabled ? 'Modo: APAGAR' : 'Modo: ENCENDER'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                      Contador de Sacudidas
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        gap: '12px',
                        marginBottom: '8px'
                      }}>
                        {[1, 2, 3].map((num) => {
                          return (
                            <div
                              key={num}
                              style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px',
                                fontWeight: 'bold',
                              backgroundColor: motionCount >= num ? '#dc2626' : '#fee2e2',
                              color: motionCount >= num ? 'white' : '#dc2626',
                                transition: 'all 0.3s ease',
                              border: motionCount >= num ? '3px solid white' : '3px solid #dc2626',
                              boxShadow: motionCount >= num ? '0 4px 12px rgba(220, 38, 38, 0.4)' : 'none'
                              }}
                            >
                              {num}
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ 
                        fontSize: '18px', 
                        fontWeight: 'bold',
                      color: motionCount >= 3 ? '#dc2626' : '#9ca3af'
                      }}>
                      {motionCount}/3 Sacudidas
                      </div>
                      {motionCount > 0 && motionCount < 3 && (
                        <IonButton 
                          size="small" 
                          fill="clear" 
                          onClick={resetMotionCount}
                          style={{ marginTop: '8px' }}
                        >
                          Resetear Contador
                        </IonButton>
                      )}
                    </div>
                  )}
                </div>
          </IonCardContent>
        </IonCard>
        )}
        </>
        )}

      </IonContent>
    </IonPage>
  );
};

export default Tab6;
