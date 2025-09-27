import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonCard, IonCardContent, IonIcon, IonSpinner,
  IonAlert, IonToggle, IonItem, IonLabel, IonText,
  IonGrid, IonRow, IonCol, IonChip
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
  settings
} from 'ionicons/icons';
import { Torch } from '@capawesome/capacitor-torch';
import './Tab6.css';

const Tab6: React.FC = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();
  
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
    
    if (!isActuallyNative) {
      console.log('[Torch] No es plataforma nativa, linterna no disponible');
      setIsAvailable(false);
      return;
    }

    try {
      const result = await Torch.isAvailable();
      setIsAvailable(result.available);
      
      if (result.available) {
        const enabledResult = await Torch.isEnabled();
        setIsEnabled(enabledResult.enabled);
      }
    } catch (error) {
      console.error('Error verificando disponibilidad de linterna:', error);
      setIsAvailable(false);
    }
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
      await Torch.toggle();
      const result = await Torch.isEnabled();
      setIsEnabled(result.enabled);
      setAlertMessage(result.enabled ? 'Linterna encendida' : 'Linterna apagada');
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
    setAlertMessage('La detección de movimiento por acelerómetro no está disponible en esta versión. Usa los botones para controlar la linterna.');
    setShowAlert(true);
  };

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

        {/* Información sobre detección de movimiento */}
        {isAvailable && (
          <IonCard>
            <IonCardContent>
              <h3 className="section-title">Control por Movimiento</h3>
              
              <IonItem button onClick={showMotionInfo}>
                <IonIcon icon={phonePortrait} slot="start" />
                <IonLabel>
                  <h3>Detección de Movimiento</h3>
                  <p>Próximamente: Mueve el dispositivo para alternar la linterna</p>
                </IonLabel>
                <IonIcon icon={warning} slot="end" color="warning" />
              </IonItem>

              <div className="motion-info">
                <IonChip color="warning">
                  <IonIcon icon={warning} />
                  <IonLabel>En Desarrollo</IonLabel>
                </IonChip>
              </div>
            </IonCardContent>
          </IonCard>
        )}

        {/* Información del dispositivo */}
        <IonCard>
          <IonCardContent>
            <h3 className="section-title">Información del Dispositivo</h3>
            
            <IonItem>
              <IonLabel>
                <h3>Plataforma</h3>
                <p>{platform} - {isActuallyNative ? 'Nativa' : 'Web'}</p>
              </IonLabel>
            </IonItem>

            <IonItem>
              <IonLabel>
                <h3>Linterna Disponible</h3>
                <p>{isAvailable ? 'Sí' : 'No'}</p>
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
                <p>En desarrollo</p>
              </IonLabel>
              <IonIcon 
                icon={warning}
                color="warning"
              />
            </IonItem>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Tab6;
