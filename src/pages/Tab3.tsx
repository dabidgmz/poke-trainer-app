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
  IonIcon,
  IonButton,
  IonGrid,
  IonRow,
  IonCol,
  IonSegment,
  IonSegmentButton,
  IonLabel
} from '@ionic/react';
import { 
  ReorderEndCustomEvent 
} from '@ionic/react';
import { 
  flash, 
  shield, 
  speedometer,
  heart,
  swapHorizontal,
  add,
  folder
} from 'ionicons/icons';
import './Tab3.css';

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
  location: 'team' | 'pc';
  boxId?: number;
}

interface Box {
  id: number;
  name: string;
  pokemon: Pokemon[];
}

const Tab3: React.FC = () => {
  const [currentView, setCurrentView] = useState<'team' | 'pc'>('team');
  const [selectedBox, setSelectedBox] = useState(0);
  
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
      img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
      location: 'team'
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
      img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png',
      location: 'team'
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
      img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/9.png',
      location: 'team'
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
      img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/3.png',
      location: 'team'
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
      img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/149.png',
      location: 'team'
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
      img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/150.png',
      location: 'team'
    }
  ]);

  const [pcBoxes, setPcBoxes] = useState<Box[]>([
    {
      id: 0,
      name: 'Box 1',
      pokemon: [
        {
          id: 7,
          name: 'Bulbasaur',
          type: 'grass',
          level: 5,
          hp: 45,
          maxHp: 45,
          attack: 49,
          defense: 49,
          speed: 45,
          img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png',
          location: 'pc',
          boxId: 0
        },
        {
          id: 8,
          name: 'Squirtle',
          type: 'water',
          level: 5,
          hp: 44,
          maxHp: 44,
          attack: 48,
          defense: 65,
          speed: 43,
          img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png',
          location: 'pc',
          boxId: 0
        },
        {
          id: 9,
          name: 'Charmander',
          type: 'fire',
          level: 5,
          hp: 39,
          maxHp: 39,
          attack: 52,
          defense: 43,
          speed: 65,
          img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png',
          location: 'pc',
          boxId: 0
        }
      ]
    },
    {
      id: 1,
      name: 'Box 2',
      pokemon: [
        {
          id: 10,
          name: 'Pidgey',
          type: 'flying',
          level: 3,
          hp: 40,
          maxHp: 40,
          attack: 45,
          defense: 40,
          speed: 56,
          img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/16.png',
          location: 'pc',
          boxId: 1
        },
        {
          id: 11,
          name: 'Rattata',
          type: 'normal',
          level: 2,
          hp: 30,
          maxHp: 30,
          attack: 56,
          defense: 35,
          speed: 72,
          img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/19.png',
          location: 'pc',
          boxId: 1
        }
      ]
    },
    {
      id: 2,
      name: 'Box 3',
      pokemon: []
    }
  ]);

  const handleTeamReorder = (event: ReorderEndCustomEvent) => {
    const reorderedTeam = [...pokemonTeam];
    const [movedPokemon] = reorderedTeam.splice(event.detail.from, 1);
    reorderedTeam.splice(event.detail.to, 0, movedPokemon);
    setPokemonTeam(reorderedTeam);
    event.detail.complete();
  };

  const handlePcReorder = (event: ReorderEndCustomEvent) => {
    const currentBox = pcBoxes[selectedBox];
    const reorderedPokemon = [...currentBox.pokemon];
    const [movedPokemon] = reorderedPokemon.splice(event.detail.from, 1);
    reorderedPokemon.splice(event.detail.to, 0, movedPokemon);
    
    const updatedBoxes = [...pcBoxes];
    updatedBoxes[selectedBox].pokemon = reorderedPokemon;
    setPcBoxes(updatedBoxes);
    event.detail.complete();
  };

  const movePokemonToPc = (pokemonId: number) => {
    const pokemon = pokemonTeam.find(p => p.id === pokemonId);
    if (!pokemon || pokemonTeam.length <= 1) return; // Mínimo 1 Pokémon en el equipo

    const updatedTeam = pokemonTeam.filter(p => p.id !== pokemonId);
    const updatedPokemon = { ...pokemon, location: 'pc' as const, boxId: selectedBox };
    
    const updatedBoxes = [...pcBoxes];
    updatedBoxes[selectedBox].pokemon.push(updatedPokemon);
    
    setPokemonTeam(updatedTeam);
    setPcBoxes(updatedBoxes);
  };

  const movePokemonToTeam = (pokemonId: number) => {
    if (pokemonTeam.length >= 6) return; // Máximo 6 Pokémon en el equipo

    const box = pcBoxes[selectedBox];
    const pokemon = box.pokemon.find(p => p.id === pokemonId);
    if (!pokemon) return;

    const updatedBoxes = [...pcBoxes];
    updatedBoxes[selectedBox].pokemon = updatedBoxes[selectedBox].pokemon.filter(p => p.id !== pokemonId);
    
    const updatedPokemon = { ...pokemon, location: 'team' as const, boxId: undefined };
    
    setPokemonTeam([...pokemonTeam, updatedPokemon]);
    setPcBoxes(updatedBoxes);
  };

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

  const currentBox = pcBoxes[selectedBox];
  const currentPokemon = currentView === 'team' ? pokemonTeam : currentBox.pokemon;

  return (
    <IonPage className="pc-page">
      <IonHeader className="pc-header">
        <IonToolbar className="pc-toolbar">
          <IonTitle className="pc-title">
            <div className="pc-header-content">
              <div className="pc-logo">
                <div className="computer-icon"></div>
              </div>
              <span className="pc-text">POKÉMON PC</span>
            </div>
          </IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="pc-content">
        <div className="pc-body">
          {/* Selector de vista */}
          <div className="view-selector">
            <IonSegment 
              value={currentView} 
              onIonChange={e => setCurrentView(e.detail.value as 'team' | 'pc')}
              className="pc-segment"
            >
              <IonSegmentButton value="team">
                <IonLabel>Mi Equipo ({pokemonTeam.length}/6)</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="pc">
                <IonLabel>PC Storage</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </div>

          {/* Selector de cajas (solo en vista PC) */}
          {currentView === 'pc' && (
            <div className="box-selector">
              <div className="box-tabs">
                {pcBoxes.map((box, index) => (
                  <button
                    key={box.id}
                    className={`box-tab ${selectedBox === index ? 'active' : ''}`}
                    onClick={() => setSelectedBox(index)}
                  >
                    <IonIcon icon={folder} />
                    <span>{box.name}</span>
                    <span className="box-count">({box.pokemon.length})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Lista de Pokémon */}
          <div className="pokemon-list-container">
            <IonList className="pokemon-list">
              <IonReorderGroup disabled={false} onIonReorderEnd={currentView === 'team' ? handleTeamReorder : handlePcReorder}>
                {currentPokemon.map((pokemon, index) => (
                  <IonItem key={pokemon.id} className="pokemon-pc-item">
                    <div className="pokemon-pc-card">
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
                      
                      <div className="pokemon-actions">
                        {currentView === 'team' ? (
                          <IonButton 
                            className="move-btn" 
                            fill="outline" 
                            size="small"
                            onClick={() => movePokemonToPc(pokemon.id)}
                            disabled={pokemonTeam.length <= 1}
                          >
                            <IonIcon icon={swapHorizontal} slot="start" />
                            To PC
                          </IonButton>
                        ) : (
                          <IonButton 
                            className="move-btn" 
                            fill="outline" 
                            size="small"
                            onClick={() => movePokemonToTeam(pokemon.id)}
                            disabled={pokemonTeam.length >= 6}
                          >
                            <IonIcon icon={swapHorizontal} slot="start" />
                            To Team
                          </IonButton>
                        )}
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

          {/* Información de la caja actual */}
          {currentView === 'pc' && (
            <div className="box-info">
              <div className="box-details">
                <h3>{currentBox.name}</h3>
                <p>{currentBox.pokemon.length} Pokémon almacenados</p>
              </div>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Tab3;
