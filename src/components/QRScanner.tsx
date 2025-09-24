import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  IonContent, IonHeader, IonPage, IonToolbar,
  IonButton, IonIcon, IonAlert
} from '@ionic/react';
import { close } from 'ionicons/icons';
import { Capacitor } from '@capacitor/core';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import Pokedex from './Pokedex';
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

interface PokemonData {
  id: number;
  name: string;
  rarity: string;
  timestamp: string;
}

const QRScanner: React.FC<QRScannerProps> = ({ onQRDetected, onClose }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [qrContent, setQrContent] = useState<string | null>(null);
  const [pokemonData, setPokemonData] = useState<PokemonData | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showPokedex, setShowPokedex] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const webControls = useRef<IScannerControls | null>(null);

  const log = (...args: any[]) => console.log('[QR]', ...args);

  const handleQRDetected = (content: string) => {
    setQrContent(content);
    
    // Intentar parsear como JSON de Pokémon
    try {
      const pokemon = JSON.parse(content);
      if (pokemon.id && pokemon.name && pokemon.rarity) {
        setPokemonData(pokemon);
        setShowPokedex(true);
      } else {
        setPokemonData(null);
        setShowResult(true);
      }
    } catch {
      setPokemonData(null);
      setShowResult(true);
    }
    
    cleanup();
  };

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
      // Detener el scanner de ZXing
      if (webControls.current) {
        webControls.current.stop();
        webControls.current = null;
      }
      
      // Detener y limpiar el stream de video
      if (videoRef.current) {
        const stream = videoRef.current.srcObject as MediaStream | null;
        if (stream) {
          stream.getTracks().forEach(track => {
            track.stop();
            log('Track detenido:', track.kind);
          });
        }
        videoRef.current.srcObject = null;
        videoRef.current.style.display = 'none';
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

  // -------- Nativo (cordova-plugin-qrscanner) ----------
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
        // Fuerza cámara trasera; el flash solo existe ahí
        window.QRScanner.useBackCamera?.();

        window.QRScanner.show(() => {
          document.body.classList.add('qr-active'); // hace el fondo transparente
          setIsScanning(true);

          window.QRScanner.scan((scanErr: any, text: string) => {
            log('scan() nativo', { scanErr, text });
            if (scanErr) {
              setErrorMsg(scanErr?.message ?? 'Error al escanear (nativo)');
             } else if (text) {
               handleQRDetected(text);
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

  // -------- Web (ZXing) ----------
  const startWeb = useCallback(async () => {
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    if (!isSecure) {
      setErrorMsg('La cámara web requiere HTTPS o localhost.');
      return;
    }

    try {
      // Verificar si getUserMedia está disponible
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMsg('Tu navegador no soporta acceso a la cámara.');
        return;
      }

      // Pide permiso primero para que los device labels no vengan vacíos
      let tmpStream: MediaStream;
      try {
        tmpStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }, 
          audio: false 
        });
        tmpStream.getTracks().forEach(t => t.stop());
      } catch (permError: any) {
        log('Error de permisos:', permError);
        if (permError.name === 'NotAllowedError') {
          setErrorMsg('Permisos de cámara denegados. Por favor, permite el acceso a la cámara.');
        } else if (permError.name === 'NotFoundError') {
          setErrorMsg('No se encontró ninguna cámara en tu dispositivo.');
        } else if (permError.name === 'NotReadableError') {
          setErrorMsg('La cámara está siendo usada por otra aplicación.');
        } else {
          setErrorMsg('Error al acceder a la cámara: ' + permError.message);
        }
        return;
      }

      const codeReader = new BrowserMultiFormatReader();
      let devices;
      
      try {
        devices = await BrowserMultiFormatReader.listVideoInputDevices();
      } catch (deviceError) {
        log('Error listando dispositivos:', deviceError);
        setErrorMsg('Error al acceder a los dispositivos de cámara.');
        return;
      }

      if (!devices || devices.length === 0) {
        setErrorMsg('No se encontró ninguna cámara disponible.');
        return;
      }

      // Buscar cámara trasera, si no existe usar la primera disponible
      let backCam = devices.find(d => /back|rear|environment/i.test(d.label));
      if (!backCam) {
        backCam = devices[0];
        log('Usando cámara frontal como fallback:', backCam.label);
      }

      if (!backCam) {
        setErrorMsg('No se encontró cámara disponible en el navegador.');
        return;
      }

      log('Usando cámara:', backCam.label, 'ID:', backCam.deviceId);
      setIsScanning(true);

      // Configurar el video element
      if (videoRef.current) {
        videoRef.current.style.display = 'block';
      }

      webControls.current = await codeReader.decodeFromVideoDevice(
        backCam.deviceId,
        videoRef.current!,
         (result: any, err, controls) => {
          if (result?.getText()) {
            log('web result', result.getText());
            handleQRDetected(result.getText());
            controls.stop();
            cleanup();
          }
          // err NotFoundException por frames sin código es normal
        }
      );
    } catch (e: any) {
      log('startWeb err', e);
      let errorMessage = 'No se pudo iniciar la cámara.';
      
      if (e.name === 'NotAllowedError') {
        errorMessage = 'Permisos de cámara denegados. Por favor, permite el acceso a la cámara.';
      } else if (e.name === 'NotFoundError') {
        errorMessage = 'No se encontró ninguna cámara en tu dispositivo.';
      } else if (e.name === 'NotReadableError') {
        errorMessage = 'La cámara está siendo usada por otra aplicación.';
      } else if (e.message) {
        errorMessage = e.message;
      }
      
      setErrorMsg(errorMessage);
      cleanup();
    }
  }, [cleanup, onQRDetected]);

  const startScan = useCallback(() => {
    const isNative = Capacitor.isNativePlatform();
    log('startScan isNative:', isNative);
    if (isNative) startNative();
    else startWeb();
  }, [startNative, startWeb]);

  const confirmResult = () => {
    if (qrContent) {
      onQRDetected(qrContent);
      onClose();
    }
  };

  const cancelResult = () => {
    setShowResult(false);
    setQrContent(null);
    setPokemonData(null);
    startScan();
  };

  const handleCapturePokemon = () => {
    if (!pokemonData) return;
    
    // Calcular probabilidad de captura basada en rareza
    const captureChances = {
      'common': 95,
      'uncommon': 80,
      'rare': 60,
      'epic': 30,
      'legendary': 10
    };
    
    const chance = captureChances[pokemonData.rarity.toLowerCase() as keyof typeof captureChances] || 50;
    const success = Math.random() * 100 < chance;
    
    if (success) {
      // ¡Captura exitosa!
      onQRDetected(JSON.stringify(pokemonData));
      onClose();
    } else {
      // Captura fallida - mostrar mensaje y permitir reintentar
      setErrorMsg(`¡${pokemonData.name} escapó! ¡Inténtalo de nuevo!`);
      setShowPokedex(false);
      setPokemonData(null);
      setQrContent(null);
      startScan();
    }
  };

  const handleCancelPokemon = () => {
    setShowPokedex(false);
    setPokemonData(null);
    setQrContent(null);
    startScan();
  };

  const stopScan = useCallback(() => {
    cleanup();
  }, [cleanup]);

  useEffect(() => {
    // Auto-inicio al montar
    startScan();
    return () => { cleanup(); };
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
        {/* Solo visible en web */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: '100%', height: 'auto', display: Capacitor.isNativePlatform() ? 'none' : 'block' }}
        />

        {/* Overlay visual */}
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

        <IonAlert
          isOpen={showResult}
          onDidDismiss={() => setShowResult(false)}
          header="¡Código QR Detectado!"
          message={`Contenido: ${qrContent}`}
          buttons={[
            {
              text: 'Cancelar',
              role: 'cancel',
              handler: cancelResult
            },
            {
              text: 'Aceptar',
              handler: confirmResult
            }
          ]}
        />

        {/* Pokédex para Pokémon */}
        {showPokedex && pokemonData && (
          <Pokedex
            pokemon={pokemonData}
            onCapture={handleCapturePokemon}
            onCancel={handleCancelPokemon}
          />
        )}
      </IonContent>
    </IonPage>
  );
};

export default QRScanner;
