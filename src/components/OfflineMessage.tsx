import React from 'react';
import { IonCard, IonCardContent, IonIcon, IonButton, IonText } from '@ionic/react';
import { wifiOutline, refresh } from 'ionicons/icons';
import './OfflineMessage.css';

interface OfflineMessageProps {
  onRetry?: () => void;
}

const OfflineMessage: React.FC<OfflineMessageProps> = ({ onRetry }) => {
  return (
    <div className="offline-message-container">
      <IonCard className="offline-card">
        <IonCardContent className="offline-content">
          <IonIcon icon={wifiOutline} className="offline-icon" />
          <IonText className="offline-title">
            <h2>Sin conexión a internet</h2>
          </IonText>
          <IonText className="offline-message">
            <p>No tienes conexión a internet. Por favor, intenta reconectarte a WiFi o datos móviles.</p>
          </IonText>
          {onRetry && (
            <IonButton 
              fill="outline" 
              onClick={onRetry}
              className="offline-retry-button"
            >
              <IonIcon icon={refresh} slot="start" />
              Intentar reconectar
            </IonButton>
          )}
        </IonCardContent>
      </IonCard>
    </div>
  );
};

export default OfflineMessage;

