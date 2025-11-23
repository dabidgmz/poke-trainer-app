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
      <IonHeader>
        <IonToolbar>
          <IonTitle>Linterna</IonTitle>
          <ProfileButton />
        </IonToolbar>
      </IonHeader>

      <IonContent scrollY>
        {/* Alerta */}
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Linterna"
          message={alertMessage}
          buttons={['OK']}
        />

        {/* Tarjeta de estado */}
        <IonCard className="torch-status-card">
          <IonCardContent>
            <div className="torch-status-content">
              <div className="torch-icon-container">
                <IonIcon 
                  icon={isEnabled ? flashlight : flashlightOutline} 
                  className={`torch-icon ${isEnabled ? 'enabled' : 'disabled'}`}
                />
              </div>
              <div className="torch-status-info">
                <h2 className="torch-title">
                  {isEnabled ? 'Linterna Encendida' : 'Linterna Apagada'}
                </h2>
                <p className="torch-subtitle">
                  {isAvailable 
                    ? (isEnabled ? 'La linterna está activa' : 'La linterna está inactiva')
                    : 'Linterna no disponible'
                  }
                </p>
              </div>
              <div className="torch-status-indicator">
                <IonIcon 
                  icon={isEnabled ? checkmarkCircle : closeCircle}
                  color={isEnabled ? 'success' : 'medium'}
                />
              </div>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Información de plataforma */}
        {!isActuallyNative && (
          <IonCard color="warning">
            <IonCardContent>
              <div className="flex items-start">
                <IonIcon icon={warning} className="text-2xl mr-3 mt-1" />
                <div>
                  <h2 className="font-bold text-lg">Dispositivo Web</h2>
                  <p className="mt-2">
                    La linterna solo está disponible en aplicaciones nativas. 
                    Descarga la app desde la tienda para usar esta función.
                  </p>
                </div>
              </div>
            </IonCardContent>
          </IonCard>
        )}

        {/* Botón circular estilo Vue */}
        {isAvailable && (
          <div className="center">
            <button
              className={`btn ${isEnabled ? 'active' : ''}`}
              disabled={isLoading || (useWebTorch ? webTorchDisabled : false)}
              onClick={toggleTorch}
            >
              {isLoading ? (
                <IonSpinner />
              ) : (
                <IonIcon 
                  icon={isEnabled ? flashlight : flashlightOutline} 
                  className="btn-icon"
                />
              )}
            </button>
          </div>
        )}

        {/* Controles principales */}
        {isAvailable && (
          <IonCard>
            <IonCardContent>
              <h3 className="section-title">Controles de Linterna</h3>
              
              <IonGrid>
                <IonRow>
                  <IonCol size="6">
                    <IonButton 
                      expand="block" 
                      fill="outline"
                      onClick={enableTorch}
                      disabled={isLoading || isEnabled}
                      className="torch-control-btn"
                    >
                      {isLoading ? (
                        <IonSpinner />
                      ) : (
                        <>
                          <IonIcon icon={flashlight} slot="start" />
                          Encender
                        </>
                      )}
                    </IonButton>
                  </IonCol>
                  <IonCol size="6">
                    <IonButton 
                      expand="block" 
                      fill="outline"
                      onClick={disableTorch}
                      disabled={isLoading || !isEnabled}
                      className="torch-control-btn"
                    >
                      {isLoading ? (
                        <IonSpinner />
                      ) : (
                        <>
                          <IonIcon icon={flashlightOutline} slot="start" />
                          Apagar
                        </>
                      )}
                    </IonButton>
                  </IonCol>
                </IonRow>
                
                <IonRow>
                  <IonCol>
                    <IonButton 
                      expand="block" 
                      onClick={toggleTorch}
                      disabled={isLoading}
                      className="torch-toggle-btn"
                      color={isEnabled ? 'danger' : 'primary'}
                    >
                      {isLoading ? (
                        <IonSpinner />
                      ) : (
                        <>
                          <IonIcon icon={isEnabled ? flashlightOutline : flashlight} slot="start" />
                          {isEnabled ? 'Apagar Linterna' : 'Encender Linterna'}
                        </>
                      )}
                    </IonButton>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonCardContent>
          </IonCard>
        )}

        {/* Controlador de detección de movimiento */}
        <IonCard>
          <IonCardContent>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="section-title" style={{ margin: 0 }}>Sensor de Movimiento</h3>
              <IonChip color={isMotionSupported ? 'success' : 'danger'}>
                <IonIcon icon={isMotionSupported ? checkmarkCircle : closeCircle} />
                <IonLabel>{isMotionSupported ? 'Disponible' : 'No Disponible'}</IonLabel>
              </IonChip>
            </div>
            
            {isMotionSupported ? (
              <>
                {/* Control de encendido automático */}
                <div style={{ 
                  backgroundColor: isAutoLightEnabled 
                    ? (isEnabled ? '#f8d7da' : '#d4edda')
                    : '#f8f9fa',
                  padding: '16px', 
                  borderRadius: '8px',
                  marginBottom: '16px',
                  border: isAutoLightEnabled 
                    ? (isEnabled ? '2px solid #dc3545' : '2px solid #28a745')
                    : '2px solid #dee2e6',
                  transition: 'all 0.3s ease'
                }}>
                  <IonItem lines="none" style={{ '--background': 'transparent' }}>
                    <IonIcon 
                      icon={flashlight} 
                      slot="start" 
                      color={isAutoLightEnabled ? (isEnabled ? 'danger' : 'success') : 'medium'}
                    />
                    <IonLabel>
                      <h3 style={{ fontWeight: 'bold' }}>Control Automático</h3>
                      <p style={{ fontSize: '12px' }}>
                        {isAutoLightEnabled 
                          ? (isEnabled 
                              ? 'Mueve 3 veces para apagar la linterna' 
                              : 'Mueve 3 veces para encender la linterna')
                          : 'Activar para controlar con movimientos'}
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
                        Contador de Movimientos
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        gap: '12px',
                        marginBottom: '8px'
                      }}>
                        {[1, 2, 3].map((num) => {
                          const activeColor = isEnabled ? '#dc3545' : '#28a745';
                          const activeBorderColor = isEnabled ? '#c82333' : '#1e7e34';
                          const pulseAnimation = isEnabled ? 'counterPulseRed' : 'counterPulse';
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
                                backgroundColor: motionCount >= num ? activeColor : '#e9ecef',
                                color: motionCount >= num ? 'white' : '#6c757d',
                                transition: 'all 0.3s ease',
                                border: motionCount >= num ? `3px solid ${activeBorderColor}` : '3px solid #dee2e6',
                                animation: motionCount === num ? `${pulseAnimation} 0.5s ease-out` : 'none'
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
                        color: motionCount >= 3 ? (isEnabled ? '#dc3545' : '#28a745') : '#6c757d'
                      }}>
                        {motionCount}/3 Movimientos
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

                <IonButton 
                  expand="block" 
                  onClick={toggleMotionMonitoring}
                  color={isMotionActive ? 'danger' : 'primary'}
                  style={{ marginBottom: '16px' }}
                >
                  <IonIcon icon={navigate} slot="start" />
                  {isMotionActive ? 'Detener Monitor' : 'Iniciar Monitor'}
                </IonButton>

                {isMotionActive && (
                  <div style={{ 
                    backgroundColor: 'var(--ion-color-light)', 
                    padding: '16px', 
                    borderRadius: '8px',
                    marginBottom: '16px'
                  }}>
                    <h4 style={{ marginTop: 0, marginBottom: '12px', color: 'var(--ion-color-primary)' }}>
                      Datos del Acelerómetro
                    </h4>
                    
                    <IonGrid>
                      <IonRow>
                        <IonCol size="4">
                          <div style={{ 
                            textAlign: 'center', 
                            padding: '12px',
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            border: '2px solid #e74c3c'
                          }}>
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Eje X</div>
                            <div style={{ 
                              fontSize: '24px', 
                              fontWeight: 'bold',
                              color: '#e74c3c'
                            }}>
                              {motionData.x}
                            </div>
                            <div style={{ fontSize: '10px', color: '#999' }}>m/s²</div>
                          </div>
                        </IonCol>
                        
                        <IonCol size="4">
                          <div style={{ 
                            textAlign: 'center', 
                            padding: '12px',
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            border: '2px solid #3498db'
                          }}>
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Eje Y</div>
                            <div style={{ 
                              fontSize: '24px', 
                              fontWeight: 'bold',
                              color: '#3498db'
                            }}>
                              {motionData.y}
                            </div>
                            <div style={{ fontSize: '10px', color: '#999' }}>m/s²</div>
                          </div>
                        </IonCol>
                        
                        <IonCol size="4">
                          <div style={{ 
                            textAlign: 'center', 
                            padding: '12px',
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            border: '2px solid #2ecc71'
                          }}>
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Eje Z</div>
                            <div style={{ 
                              fontSize: '24px', 
                              fontWeight: 'bold',
                              color: '#2ecc71'
                            }}>
                              {motionData.z}
                            </div>
                            <div style={{ fontSize: '10px', color: '#999' }}>m/s²</div>
                          </div>
                        </IonCol>
                      </IonRow>
                    </IonGrid>

                    <div style={{ 
                      marginTop: '16px',
                      padding: '12px',
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      border: '2px solid #9b59b6',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Magnitud Total</div>
                      <div style={{ 
                        fontSize: '28px', 
                        fontWeight: 'bold',
                        color: '#9b59b6'
                      }}>
                        {motionMagnitude}
                      </div>
                      <div style={{ fontSize: '10px', color: '#999' }}>m/s²</div>
                    </div>

                    <div style={{ 
                      marginTop: '12px', 
                      padding: '8px',
                      backgroundColor: '#fff3cd',
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: '#856404'
                    }}>
                      <IonIcon icon={phonePortrait} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                      <strong>Mueve tu teléfono</strong> para ver los valores cambiar en tiempo real
                    </div>

                    {/* Indicador de movimiento significativo */}
                    {isAutoLightEnabled && motionMagnitude > 15 && (
                      <div style={{ 
                        marginTop: '12px', 
                        padding: '12px',
                        backgroundColor: '#28a745',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: 'white',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        animation: 'pulse 0.5s ease-in-out'
                      }}>
                        🎯 ¡Movimiento Detectado!
                      </div>
                    )}
                  </div>
                )}

                <IonItem button onClick={showMotionInfo}>
                  <IonIcon icon={phonePortrait} slot="start" />
                  <IonLabel>
                    <h3>Información del Sensor</h3>
                    <p>Toca para más detalles sobre la detección de movimiento</p>
                  </IonLabel>
                </IonItem>
              </>
            ) : (
              <div style={{ 
                padding: '16px', 
                backgroundColor: '#f8d7da',
                borderRadius: '8px',
                color: '#721c24'
              }}>
                <IonIcon icon={warning} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                El sensor de movimiento no está disponible en este dispositivo o navegador.
              </div>
            )}
          </IonCardContent>
        </IonCard>

        {/* Información del dispositivo */}
        <IonCard>
          <IonCardContent>
            <h3 className="section-title">Información del Dispositivo</h3>
            
            <IonItem>
              <IonLabel>
                <h3>Plataforma</h3>
                <p>{platform} - {isNative ? 'Nativa' : 'Web'}</p>
              </IonLabel>
            </IonItem>

            <IonItem>
              <IonLabel>
                <h3>Linterna Disponible</h3>
                <p>{isAvailable ? (useWebTorch ? 'Sí (Web)' : 'Sí (Nativa)') : 'No'}</p>
              </IonLabel>
              <IonIcon 
                icon={isAvailable ? checkmarkCircle : closeCircle}
                color={isAvailable ? 'success' : 'danger'}
              />
            </IonItem>

            <IonItem>
              <IonLabel>
                <h3>Estado Actual</h3>
                <p>{isEnabled ? 'Encendida' : 'Apagada'}</p>
              </IonLabel>
              <IonIcon 
                icon={isEnabled ? flashlight : flashlightOutline}
                color={isEnabled ? 'warning' : 'medium'}
              />
            </IonItem>

            <IonItem>
              <IonLabel>
                <h3>Detección de Movimiento</h3>
                <p>{isMotionSupported ? (isMotionActive ? 'Activo' : 'Disponible') : 'No disponible'}</p>
              </IonLabel>
              <IonIcon 
                icon={isMotionSupported ? (isMotionActive ? checkmarkCircle : navigate) : warning}
                color={isMotionSupported ? (isMotionActive ? 'success' : 'primary') : 'warning'}
              />
            </IonItem>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Tab6;
