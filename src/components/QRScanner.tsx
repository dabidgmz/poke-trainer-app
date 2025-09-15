import React, { useState, useEffect } from 'react';
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
  refresh
} from 'ionicons/icons';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
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
  const [isLoading, setIsLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showPokemonAlert, setShowPokemonAlert] = useState(false);
  const [detectedPokemon, setDetectedPokemon] = useState<CapturedPokemon | null>(null);


  // Inicializar el escáner al montar el componente
  useEffect(() => {
    startScan();
    
    return () => {
      stopScan();
    };
  }, []);

  const checkPermission = async () => {
    try {
      const status = await BarcodeScanner.checkPermission({ force: true });
      
      if (status.granted) {
        return true;
      }

      if (status.denied) {
        // El usuario denegó el permiso permanentemente
        const c = confirm('Si quieres conceder permiso para usar tu cámara, habilítalo en la configuración de la app.');
        if (c) {
          BarcodeScanner.openAppSettings();
        }
        return false;
      }

      return false;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  };

  const startScan = async () => {
    try {
      setIsLoading(true);
      setCameraError(null);

      console.log('Iniciando escáner QR...');

      // Verificar permisos
      const hasPermission = await checkPermission();
      if (!hasPermission) {
        setCameraError('Permisos de cámara denegados. Por favor, habilita los permisos en la configuración.');
        return;
      }

      // Hacer el fondo del WebView transparente
      BarcodeScanner.hideBackground();

      // Agregar clase CSS para Ionic
      document.querySelector('body')?.classList.add('scanner-active');

      setIsScanning(true);

      // Iniciar el escáner
      const result = await BarcodeScanner.startScan();

      console.log('Resultado del escáner:', result);

      // Si el resultado tiene contenido
      if (result.hasContent) {
        console.log('QR detectado:', result.content);
        
        // Crear un Pokémon genérico con el código QR detectado
        if (result.content && result.content.length > 0) {
          const genericPokemon: CapturedPokemon = {
            id: 999,
            name: 'Pokémon Desconocido',
            type: 'unknown',
            level: 1,
            hp: 30,
            maxHp: 30,
            attack: 20,
            defense: 20,
            speed: 30,
            img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png',
            captureTime: new Date(),
            qrCode: result.content
          };
          
          setDetectedPokemon(genericPokemon);
          setShowPokemonAlert(true);
        }
      }

    } catch (error: any) {
      console.error('Error starting scanner:', error);
      setCameraError(error.message || 'No se pudo acceder al escáner QR');
    } finally {
      setIsLoading(false);
      setIsScanning(false);
    }
  };

  const stopScan = () => {
    try {
      // Mostrar el fondo del WebView
      BarcodeScanner.showBackground();
      
      // Remover clase CSS de Ionic
      document.querySelector('body')?.classList.remove('scanner-active');
      
      // Detener el escáner
      BarcodeScanner.stopScan();
      
      setIsScanning(false);
    } catch (error) {
      console.error('Error stopping scanner:', error);
    }
  };

  const handleRetry = () => {
    startScan();
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
    // Reiniciar el escáner después de cancelar
    startScan();
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
          {!isScanning && !isLoading ? (
            <div className="scanner-placeholder">
              <IonIcon icon={refresh} className="scanner-icon" />
              <h3>Escáner QR Listo</h3>
              {cameraError && (
                <div className="scanner-error">
                  <p>{cameraError}</p>
                  <div className="error-actions">
                    <IonButton onClick={handleRetry} fill="outline" className="retry-btn">
                      <IonIcon icon={refresh} slot="start" />
                      Reintentar
                    </IonButton>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="scanner-view">
              {/* La vista del escáner se maneja automáticamente por el plugin */}
              <div className="scanner-overlay">
                <div className="qr-frame">
                  <div className="corner top-left"></div>
                  <div className="corner top-right"></div>
                  <div className="corner bottom-left"></div>
                  <div className="corner bottom-right"></div>
                </div>
                <div className="scan-line"></div>
                <div className="qr-instruction">
                  <p>Apunta hacia un código QR</p>
                </div>
              </div>

              {/* Controles del escáner */}
              <div className="scanner-controls">
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
            <p>1. Apunta la cámara hacia un código QR</p>
            <p>2. El escáner detectará automáticamente el código</p>
            <p>3. Confirma la captura del código detectado</p>
          </div>
        </div>

        {/* Alertas */}
        <IonAlert
          isOpen={showPokemonAlert}
          onDidDismiss={() => setShowPokemonAlert(false)}
          header="¡Código QR Detectado!"
          message={detectedPokemon ? `Código detectado: ${detectedPokemon.qrCode}` : ''}
          buttons={[
            {
              text: 'Cancelar',
              role: 'cancel',
              handler: cancelCapture
            },
            {
              text: 'Aceptar',
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