import React, { useState } from 'react';
import { 
  IonContent, 
  IonHeader, 
  IonPage, 
  IonTitle, 
  IonToolbar, 
  IonItem, 
  IonList, 
  IonReorder, 
  IonReorderGroup, 
  IonChip,
  IonIcon
} from '@ionic/react';
import { 
  ReorderEndCustomEvent 
} from '@ionic/react';
import { 
  flash, 
  shield, 
  speedometer
} from 'ionicons/icons';
import './Tab2.css';

interface Pokemon {
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
}

const Tab2: React.FC = () => {
  const [pokemonTeam, setPokemonTeam] = useState<Pokemon[]>([
    {
      id: 1,
      name: 'Pikachu',
      type: 'electric',
      level: 25,
      hp: 85,
      maxHp: 85,
      attack: 55,
      defense: 40,
      speed: 90,
      img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png'
    },
    {
      id: 2,
      name: 'Charizard',
      type: 'fire',
      level: 36,
      hp: 120,
      maxHp: 120,
      attack: 84,
      defense: 78,
      speed: 100,
      img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png'
    },
    {
      id: 3,
      name: 'Blastoise',
      type: 'water',
      level: 36,
      hp: 130,
      maxHp: 130,
      attack: 83,
      defense: 100,
      speed: 78,
      img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/9.png'
    },
    {
      id: 4,
      name: 'Venusaur',
      type: 'grass',
      level: 36,
      hp: 125,
      maxHp: 125,
      attack: 82,
      defense: 83,
      speed: 80,
      img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/3.png'
    },
    {
      id: 5,
      name: 'Dragonite',
      type: 'dragon',
      level: 55,
      hp: 150,
      maxHp: 150,
      attack: 134,
      defense: 95,
      speed: 80,
      img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/149.png'
    },
    {
      id: 6,
      name: 'Mewtwo',
      type: 'psychic',
      level: 70,
      hp: 180,
      maxHp: 180,
      attack: 110,
      defense: 90,
      speed: 130,
      img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/150.png'
    }
  ]);

  function handleReorderEnd(event: ReorderEndCustomEvent) {
    console.log('Pokémon movido de posición', event.detail.from, 'a', event.detail.to);
    
    const reorderedTeam = [...pokemonTeam];
    const [movedPokemon] = reorderedTeam.splice(event.detail.from, 1);
    reorderedTeam.splice(event.detail.to, 0, movedPokemon);
    
    setPokemonTeam(reorderedTeam);
    event.detail.complete();
  }

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      electric: '#f59e0b',
      fire: '#ef4444',
      water: '#3b82f6',
      grass: '#10b981',
      dragon: '#7c3aed',
      psychic: '#f472b6',
      normal: '#6b7280',
      fighting: '#dc2626',
      flying: '#8b5cf6',
      poison: '#a855f7',
      ground: '#d97706',
      rock: '#78716c',
      bug: '#84cc16',
      ghost: '#6366f1',
      steel: '#64748b',
      ice: '#06b6d4',
      fairy: '#ec4899',
      dark: '#374151'
    };
    return colors[type] || '#6b7280';
  };

  const getHpPercentage = (hp: number, maxHp: number) => {
    return (hp / maxHp) * 100;
  };

  const getHpColor = (percentage: number) => {
    if (percentage > 60) return '#10b981';
    if (percentage > 30) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <IonPage className="team-page">
      <IonHeader className="team-header">
        <IonToolbar className="team-toolbar">
          <IonTitle className="team-title">
            <div className="team-header-content">
              <div className="team-logo">
                <div className="pokeball-icon"></div>
              </div>
              <span className="team-text">MY TEAM</span>
            </div>
          </IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="team-content">
        <div className="team-body">

          {/* Lista de Pokémon del equipo */}
          <div className="team-list-container">
            <IonList className="team-list">
              <IonReorderGroup disabled={false} onIonReorderEnd={handleReorderEnd}>
                {pokemonTeam.map((pokemon, index) => (
                  <IonItem key={pokemon.id} className="pokemon-team-item">
                    <div className="pokemon-team-card">
                      <div className="pokemon-position">
                        #{index + 1}
                      </div>
                      
                      <div className="pokemon-image-container">
                        <img src={pokemon.img} alt={pokemon.name} className="pokemon-image" />
                        <div className="pokemon-level-badge">
                          Lv.{pokemon.level}
                        </div>
                      </div>
                      
                      <div className="pokemon-info">
                        <div className="pokemon-name">{pokemon.name}</div>
                        <IonChip 
                          className="pokemon-type-chip"
                          style={{ '--background': getTypeColor(pokemon.type) }}
                        >
                          {pokemon.type.charAt(0).toUpperCase() + pokemon.type.slice(1)}
                        </IonChip>
                      </div>
                      
                      <div className="pokemon-stats">
                        <div className="hp-bar-container">
                          <div className="hp-label">HP</div>
                          <div className="hp-bar">
                            <div 
                              className="hp-fill"
                              style={{ 
                                width: `${getHpPercentage(pokemon.hp, pokemon.maxHp)}%`,
                                backgroundColor: getHpColor(getHpPercentage(pokemon.hp, pokemon.maxHp))
                              }}
                            ></div>
                          </div>
                          <div className="hp-text">{pokemon.hp}/{pokemon.maxHp}</div>
                        </div>
                        
                        <div className="pokemon-stats-grid">
                          <div className="stat-mini">
                            <IonIcon icon={flash} />
                            <span>{pokemon.attack}</span>
                          </div>
                          <div className="stat-mini">
                            <IonIcon icon={shield} />
                            <span>{pokemon.defense}</span>
                          </div>
                          <div className="stat-mini">
                            <IonIcon icon={speedometer} />
                            <span>{pokemon.speed}</span>
                          </div>
                        </div>
                      </div>
                      
                      <IonReorder slot="end" className="reorder-handle">
                        <div className="reorder-icon">⋮⋮</div>
                      </IonReorder>
                    </div>
                  </IonItem>
                ))}
              </IonReorderGroup>
            </IonList>
          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default Tab2;
