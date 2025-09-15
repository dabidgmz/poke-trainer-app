import React from 'react';
import {
  IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonButton, IonImg, IonChip, IonIcon
} from '@ionic/react';
import { star, starOutline, trophy, flash } from 'ionicons/icons';

interface PokemonData {
  id: number;
  name: string;
  rarity: string;
  timestamp: string;
}

interface PokedexProps {
  pokemon: PokemonData;
  onCapture: () => void;
  onCancel: () => void;
}

const Pokedex: React.FC<PokedexProps> = ({ pokemon, onCapture, onCancel }) => {
  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'common': return 'medium';
      case 'uncommon': return 'success';
      case 'rare': return 'primary';
      case 'epic': return 'warning';
      case 'legendary': return 'danger';
      default: return 'medium';
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'legendary': return trophy;
      case 'epic': return star;
      case 'rare': return starOutline;
      default: return flash;
    }
  };

  const getCaptureChance = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'common': return 95;
      case 'uncommon': return 80;
      case 'rare': return 60;
      case 'epic': return 30;
      case 'legendary': return 10;
      default: return 50;
    }
  };

  const captureChance = getCaptureChance(pokemon.rarity);
  const isHighChance = captureChance >= 70;
  const isMediumChance = captureChance >= 40 && captureChance < 70;
  const isLowChance = captureChance < 40;

  return (
    <div className="pokedex-container">
      <IonCard className="pokedex-card">
        <IonCardHeader>
        </IonCardHeader>
        
        <IonCardContent>
          {/* Imagen del Pokémon */}
          <div className="pokemon-image-container">
            <IonImg 
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`}
              alt={pokemon.name}
              className="pokemon-image"
              onError={(e) => {
                // Fallback a imagen genérica si no se encuentra
                (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png';
              }}
            />
          </div>

          {/* Información del Pokémon */}
          <div className="pokemon-info">
            <div className="info-row">
              <span className="label">ID:</span>
              <span className="value">#{pokemon.id.toString().padStart(3, '0')}</span>
            </div>
            
            <div className="info-row">
              <span className="label">Rarity:</span>
              <IonChip color={getRarityColor(pokemon.rarity)}>
                <IonIcon icon={getRarityIcon(pokemon.rarity)} />
                <span>{pokemon.rarity.toUpperCase()}</span>
              </IonChip>
            </div>

            <div className="info-row">
              <span className="label">Capture Chance:</span>
              <span className={`capture-chance ${isHighChance ? 'high' : isMediumChance ? 'medium' : 'low'}`}>
                {captureChance}%
              </span>
            </div>

          </div>

          {/* Botones de acción */}
          <div className="action-buttons">
            <IonButton 
              fill="outline" 
              onClick={onCancel}
              className="cancel-btn"
            >
              Cancelar
            </IonButton>
            
            <IonButton 
              color={isHighChance ? 'success' : isMediumChance ? 'warning' : 'danger'}
              onClick={onCapture}
              className="capture-btn"
            >
              {isHighChance ? '¡Capturar!' : 
               isMediumChance ? '¡Intentar!' : 
               '¡Desafío!'}
            </IonButton>
          </div>
        </IonCardContent>
      </IonCard>
    </div>
  );
};

export default Pokedex;
