import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar,
  IonButton, IonIcon, IonAlert
} from '@ionic/react';
import { close, construct, refresh } from 'ionicons/icons';
import { Capacitor } from '@capacitor/core';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const webControls = useRef<IScannerControls | null>(null);

  const log = (...args: any[]) => console.log('[QR]', ...args);

  const stopNative = useCallback(async () => {
    try {
      window.QRScanner?.hide();
      window.QRScanner?.cancelScan();
      await window.QRScanner?.destroy();
    } catch (e) {
      log('stopNative err', e);
    }
    document.body.classList.remove('qr-active');
  }, []);

  const stopWeb = useCallback(async () => {
    try {
      webControls.current?.stop();
      webControls.current = null;
      // Detener tracks si quedaron
      const stream = videoRef.current?.srcObject as MediaStream | null;
      stream?.getTracks().forEach(t => t.stop());
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    } catch (e) {
      log('stopWeb err', e);
    }
  }, []);

  const cleanup = useCallback(async () => {
    await stopNative();
    await stopWeb();
    setIsScanning(false);
  }, [stopNative, stopWeb]);

  const startNative = useCallback(() => {
    if (!window.QRScanner) {
      setErrorMsg('QRScanner no está disponible en nativo. ¿Instalaste el plugin y corriste npx cap sync?');
      return;
    }

    window.QRScanner.prepare((err: any, status: any) => {
      log('prepare()', { err, status });
      if (err) {
        setErrorMsg(err?.message ?? 'Error preparando la cámara (nativo)');
        return;
      }

      if (status.authorized) {
        window.QRScanner.show(() => {
          document.body.classList.add('qr-active'); // hace el fondo transparente
          setIsScanning(true);
          window.QRScanner.scan((scanErr: any, text: string) => {
            log('scan() nativo', { scanErr, text });
            if (scanErr) {
              setErrorMsg(scanErr?.message ?? 'Error al escanear (nativo)');
            } else if (text) {
              onQRDetected(text);
            }
            cleanup();
          });
        });
      } else if (status.denied) {
        setErrorMsg('Permiso de cámara denegado permanentemente. Abre Ajustes y habilítalo.');
        window.QRScanner.openSettings();
      } else {
        setErrorMsg('Permiso de cámara denegado temporalmente.');
      }
    });
  }, [cleanup, onQRDetected]);

  const startWeb = useCallback(async () => {
    // Necesita HTTPS o localhost
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    if (!isSecure) {
      setErrorMsg('La cámara web requiere HTTPS o localhost.');
      return;
    }
    try {
      const codeReader = new BrowserMultiFormatReader();
      // Puedes filtrar cámara trasera buscando label que contenga "back" si quieres
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      const backCam = devices.find(d => /back|trás|rear/i.test(d.label)) ?? devices[0];
      if (!backCam) {
        setErrorMsg('No se encontró cámara disponible en el navegador.');
        return;
      }
      setIsScanning(true);

      webControls.current = await codeReader.decodeFromVideoDevice(
        backCam.deviceId,
        videoRef.current!,
        (result: any, err, controls) => {
          if (result?.getText()) {
            log('web result', result.getText());
            onQRDetected(result.getText());
            controls.stop(); // detener de inmediato
            cleanup();
          }
          // err puede ser NotFoundException en frames sin código: es normal
        }
      );
    } catch (e: any) {
      log('startWeb err', e);
      setErrorMsg(e?.message ?? 'No se pudo iniciar la cámara en web.');
      cleanup();
    }
  }, [cleanup, onQRDetected]);

  const startScan = useCallback(() => {
    const isNative = Capacitor.isNativePlatform();
    log('startScan isNative:', isNative);
    if (isNative) startNative();
    else startWeb();
  }, [startNative, startWeb]);

  const stopScan = useCallback(() => {
    cleanup();
  }, [cleanup]);

  useEffect(() => {
    // Iniciar el escáner automáticamente al montar el componente
    startScan();
    
    return () => {
      cleanup();
    };
  }, [cleanup, startScan]);

  return (
    <IonPage className="qr-scanner-page">
      <IonHeader className="qr-scanner-header">
        <IonToolbar className="qr-scanner-toolbar">
          <IonButton slot="end" fill="clear" onClick={() => { stopScan(); onClose(); }}>
            <IonIcon icon={close} />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent className="qr-content">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: '100%', height: 'auto', display: Capacitor.isNativePlatform() ? 'none' : 'block' }}
        />

        {/* Overlay de escaneo QR */}
        {isScanning && (
          <div className="qr-overlay">
            <div className="qr-frame">
              <div className="corner top-left"></div>
              <div className="corner top-right"></div>
              <div className="corner bottom-left"></div>
              <div className="corner bottom-right"></div>
            </div>
            <div className="qr-instruction">
              <p>Apunta hacia un código QR</p>
            </div>
            
          </div>
        )}


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
