import React, { useCallback, useEffect, useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonAlert
} from '@ionic/react';
import { close, construct, refresh } from 'ionicons/icons';
import './QRScanner.css';

declare global {
  interface Window {
    QRScanner: any;
  }
}

interface QRScannerProps {
  onQRDetected: (qrCode: string) => void;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onQRDetected, onClose }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const cleanup = useCallback(async () => {
    try {
      document.body.classList.remove('qr-active');
      await window.QRScanner?.show();
      await window.QRScanner?.destroy();
    } catch {}
    setIsScanning(false);
  }, []);

  const startScan = useCallback(() => {
    if (!window.QRScanner) {
      setErrorMsg('QRScanner no está disponible. ¿Estás en dispositivo real o emulador con cámara?');
      return;
    }

    window.QRScanner.prepare((err: any, status: any) => {
      if (err) {
        setErrorMsg(err?.message ?? 'Error preparando la cámara');
        return;
      }

        if (status.authorized) {
          // Cámara autorizada
        window.QRScanner.show(() => {
          document.body.classList.add('qr-active');
          setIsScanning(true);
          window.QRScanner.scan((scanErr: any, text: string) => {
            if (scanErr) {
              setErrorMsg(scanErr?.message ?? 'Error al escanear');
              cleanup();
              return;
            }
            if (text) onQRDetected(text);
            cleanup();
          });
        });
      } else if (status.denied) {
        setErrorMsg('Permiso de cámara denegado permanentemente. Abre Ajustes y habilita la cámara.');
        window.QRScanner.openSettings();
      } else {
        setErrorMsg('Permiso de cámara denegado temporalmente.');
      }
    });
  }, [cleanup, onQRDetected]);

  const stopScan = useCallback(() => {
    try {
      window.QRScanner?.hide();
      window.QRScanner?.cancelScan();
    } catch {}
    cleanup();
  }, [cleanup]);

  useEffect(() => {
    return () => {
      // Limpieza si el componente se desmonta
      stopScan();
    };
  }, [stopScan]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Escanear QR</IonTitle>
          <IonButton slot="end" fill="clear" onClick={() => { stopScan(); onClose(); }}>
            <IonIcon icon={close} />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent className="qr-content">
        <div className="qr-actions">
          {!isScanning ? (
            <IonButton onClick={startScan}>
              <IonIcon slot="start" icon={construct} />
              Iniciar escaneo
            </IonButton>
          ) : (
            <IonButton color="medium" onClick={stopScan}>
              <IonIcon slot="start" icon={refresh} />
              Detener
            </IonButton>
          )}
        </div>

        <IonAlert
          isOpen={!!errorMsg}
          onDidDismiss={() => setErrorMsg(null)}
          header="Atención"
          message={errorMsg ?? ''}
          buttons={['OK']}
        />
      </IonContent>
    </IonPage>
  );
};

export default QRScanner;
