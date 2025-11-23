import React, { useState, useEffect } from 'react';
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
  IonSpinner,
  IonText
} from '@ionic/react';
import { 
  ReorderEndCustomEvent 
} from '@ionic/react';
import { 
  flash, 
  shield, 
  speedometer
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import authService from '../services/authService';
import ProfileButton from '../components/ProfileButton';
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

interface TeamMember {
  id: number;
  pokemon: {
    id: number;
    pokeapiId: number;
    name: string;
    spriteUrl: string;
    types: string[];
    height: number;
    weight: number;
  };
  nickname: string | null;
  level: number;
  location: string;
  createdAt: string;
}

interface TeamResponse {
  team: TeamMember[];
  teamCount: number;
  maxTeamSize: number;
}

const Tab2: React.FC = () => {
  const history = useHistory();
  const [pokemonTeam, setPokemonTeam] = useState<Pokemon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teamInfo, setTeamInfo] = useState<{ teamCount: number; maxTeamSize: number } | null>(null);

  // Función para calcular stats basados en el nivel (valores aproximados)
  const calculateStats = (level: number, baseStat: number = 50) => {
    return Math.floor(baseStat * (1 + (level - 1) * 0.1));
  };

  // Mapear datos de la API al formato del componente
  const mapTeamMemberToPokemon = (member: TeamMember): Pokemon => {
    const primaryType = member.pokemon.types[0] || 'normal';
    const level = member.level;
    
    // Calcular stats basados en el nivel (valores aproximados)
    const baseHp = 50 + (level * 5);
    const baseAttack = 40 + (level * 3);
    const baseDefense = 40 + (level * 3);
    const baseSpeed = 40 + (level * 3);

    return {
      id: member.id,
      name: member.nickname || member.pokemon.name.charAt(0).toUpperCase() + member.pokemon.name.slice(1),
      type: primaryType,
      level: level,
      hp: baseHp,
      maxHp: baseHp,
      attack: baseAttack,
      defense: baseDefense,
      speed: baseSpeed,
      img: member.pokemon.spriteUrl
    };
  };

  // Cargar el equipo del entrenador
  useEffect(() => {
    const loadTeam = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response: TeamResponse = await authService.getTeam();
        const mappedTeam = response.team.map(mapTeamMemberToPokemon);
        setPokemonTeam(mappedTeam);
        setTeamInfo({
          teamCount: response.teamCount,
          maxTeamSize: response.maxTeamSize
        });
      } catch (err: any) {
        setError(err.message || 'Error al cargar el equipo');
        if (err.message === 'No autenticado') {
          history.push('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadTeam();
  }, [history]);

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
          <ProfileButton />
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="team-content">
        <div className="team-body">
          {isLoading ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '50vh',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <IonSpinner name="crescent" />
              <IonText color="medium">Cargando tu equipo...</IonText>
            </div>
          ) : error ? (
            <div style={{ 
              padding: '20px', 
              textAlign: 'center' 
            }}>
              <IonText color="danger">
                <p>{error}</p>
              </IonText>
            </div>
          ) : (
            <>
              {/* Información del equipo */}
              {teamInfo && (
                <div style={{
                  padding: '16px',
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                  color: 'white',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontSize: '14px', opacity: 0.9 }}>
                    Equipo: {teamInfo.teamCount} / {teamInfo.maxTeamSize} Pokémon
                  </div>
                </div>
              )}

              {/* Lista de Pokémon del equipo */}
              <div className="team-list-container">
                {pokemonTeam.length === 0 ? (
                  <div style={{ 
                    padding: '40px', 
                    textAlign: 'center' 
                  }}>
                    <IonText color="medium">
                      <p>No tienes Pokémon en tu equipo aún.</p>
                    </IonText>
                  </div>
                ) : (
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
                )}
              </div>
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Tab2;
