import React from 'react';
import {
  IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCardSubtitle,
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
    <div className="pokedex-container-modern">
      <IonCard className="pokedex-card-modern">
        <IonImg 
          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`}
          alt={pokemon.name}
          className="pokemon-image-modern"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png';
          }}
        />
        
        <IonCardHeader>
          <IonCardTitle>#{pokemon.id.toString().padStart(3, '0')}</IonCardTitle>
          <IonCardSubtitle>
            <IonChip color={getRarityColor(pokemon.rarity)} className="rarity-chip">
              <IonIcon icon={getRarityIcon(pokemon.rarity)} />
              <span>{pokemon.rarity.toUpperCase()}</span>
            </IonChip>
          </IonCardSubtitle>
        </IonCardHeader>

        <IonCardContent>
          <div className="action-buttons-modern">
            <IonButton fill="clear" onClick={onCancel}>
              Cancelar
            </IonButton>
            
            <IonButton 
              fill="clear"
              color={isHighChance ? 'success' : isMediumChance ? 'warning' : 'danger'}
              onClick={onCapture}
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
