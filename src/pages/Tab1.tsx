import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonAvatar,
  IonLabel,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonIcon,
  IonModal,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonChip,
  IonBadge,
  IonProgressBar,
  IonSpinner,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/react';
import { search, filter, refresh, searchCircle, close, flame, shield, heart, speedometer, star } from 'ionicons/icons';
import ProfileButton from '../components/ProfileButton';
import './Tab1.css';

interface PokemonDetails {
  id: number;
  name: string;
  types: string[];
  height: number;
  weight: number;
  stats: {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  };
  abilities: string[];
  sprites: {
    front_default: string;
    other: {
      'official-artwork': {
        front_default: string;
      };
    };
  };
}

const pokemonTypes = [
  { label: 'Todos', value: '' },
  { label: 'Agua', value: 'water' },
  { label: 'Fuego', value: 'fire' },
  { label: 'Planta', value: 'grass' },
  { label: 'Eléctrico', value: 'electric' },
  { label: 'Normal', value: 'normal' },
  { label: 'Volador', value: 'flying' },
  { label: 'Bicho', value: 'bug' },
  { label: 'Veneno', value: 'poison' },
  { label: 'Tierra', value: 'ground' },
  { label: 'Roca', value: 'rock' },
  { label: 'Hada', value: 'fairy' },
  { label: 'Lucha', value: 'fighting' },
  { label: 'Psíquico', value: 'psychic' },
  { label: 'Fantasma', value: 'ghost' },
  { label: 'Hielo', value: 'ice' },
  { label: 'Dragón', value: 'dragon' },
  { label: 'Acero', value: 'steel' },
  { label: 'Siniestro', value: 'dark' },
];

const Pokedex: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [type, setType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonDetails | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Función para obtener el color del tipo
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

  // Obtener Pokémon desde la PokeAPI
  const fetchPokemon = async (startId: number, count: number) => {
    const newItems = [];
    
    for (let i = 0; i < count; i++) {
      const id = startId + i;
      if (id > 898) break; // Límite de Pokémon de la API
      
      try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        const data = await response.json();
        
        newItems.push({
          id: data.id,
          name: data.name.charAt(0).toUpperCase() + data.name.slice(1),
          type: data.types[0].type.name,
          types: data.types.map((t: any) => t.type.name),
          img: data.sprites.front_default,
        });
      } catch (error) {
        console.error(`Error cargando Pokémon ${id}:`, error);
      }
    }
    
    return newItems;
  };

  const generateItems = async () => {
    setIsLoading(true);
    const startId = items.length + 1;
    const newItems = await fetchPokemon(startId, 20);
    setItems([...items, ...newItems]);
    setIsLoading(false);
  };

  // Obtener detalles completos de un Pokémon
  const fetchPokemonDetails = async (pokemonId: number) => {
    setLoadingDetails(true);
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
      const data = await response.json();
      
      const details: PokemonDetails = {
        id: data.id,
        name: data.name.charAt(0).toUpperCase() + data.name.slice(1),
        types: data.types.map((t: any) => t.type.name),
        height: data.height / 10, // Convertir a metros
        weight: data.weight / 10, // Convertir a kg
        stats: {
          hp: data.stats[0].base_stat,
          attack: data.stats[1].base_stat,
          defense: data.stats[2].base_stat,
          specialAttack: data.stats[3].base_stat,
          specialDefense: data.stats[4].base_stat,
          speed: data.stats[5].base_stat,
        },
        abilities: data.abilities.map((a: any) => a.ability.name),
        sprites: data.sprites,
      };
      
      setSelectedPokemon(details);
      setShowModal(true);
    } catch (error) {
      console.error('Error cargando detalles del Pokémon:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    generateItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtro por búsqueda y tipo
  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchText.toLowerCase()) &&
      (type === '' || item.type === type || item.types?.includes(type))
  );

  return (
    <IonPage className="pokedex-page">
      <IonHeader className="pokedex-header">
        <IonToolbar className="pokedex-toolbar">
          <IonTitle className="pokedex-title">
            <div className="pokedex-device">
              <div className="device-body-header">
                <div className="device-top-section">
                  <div className="antenna-container">
                    <div className="antenna"></div>
                    <div className="antenna-tip"></div>
                  </div>
                  <div className="device-brand">
                    <div className="brand-logo"></div>
                    <div className="brand-text">POKÉDEX</div>
                  </div>
                  <div className="status-panel">
                    <div className="power-indicator"></div>
                    <div className="signal-indicator"></div>
                  </div>
                </div>
                <div className="device-screen-small">
                  <div className="screen-frame-small">
                    <div className="screen-glass-small">
                      <div className="screen-content-small">
                        <div className="scan-line"></div>
                        <div className="data-grid-small">
                          <div className="grid-line-small"></div>
                          <div className="grid-line-small"></div>
                          <div className="grid-line-small"></div>
                        </div>
                        <div className="data-points">
                          <div className="point"></div>
                          <div className="point"></div>
                          <div className="point"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </IonTitle>
          <ProfileButton />
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="pokedex-content">
        <div className="pokedex-body">
          {/* Panel de control superior */}
          <div className="control-panel">
            <div className="search-section">
              <IonSearchbar
                className="pokedex-search"
                value={searchText}
                onIonInput={e => setSearchText(e.detail.value!)}
                placeholder="Buscar Pokémon..."
                showClearButton="focus"
                debounce={300}
                searchIcon={searchCircle}
              />
            </div>
            <div className="filter-section">
              <div style={{ 
                backgroundColor: 'white',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '2px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                maxWidth: '300px',
                margin: '0 auto'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px'
                }}>
                  <IonIcon icon={filter} style={{ color: '#64748b', fontSize: '18px' }} />
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                    Filtrar por tipo:
                  </span>
                </div>
                <IonSelect
                  value={type}
                  onIonChange={e => {
                    console.log('Tipo seleccionado:', e.detail.value);
                    setType(e.detail.value);
                  }}
                  placeholder="Selecciona un tipo"
                  interface="action-sheet"
                  aria-label="Tipo de Pokémon"
                  className="type-filter-select"
                  style={{
                    '--background': 'transparent',
                    '--color': '#1e293b',
                    '--placeholder-color': '#94a3b8',
                    '--padding-start': '0',
                    '--padding-end': '0',
                    width: '100%',
                    fontSize: '16px',
                    fontWeight: '700',
                    color: type ? '#10b981' : '#1e293b'
                  }}
                >
                  {pokemonTypes.map((t) => (
                    <IonSelectOption key={t.value} value={t.value}>{t.label}</IonSelectOption>
                  ))}
                </IonSelect>
                {type && (
                  <div style={{ marginTop: '8px' }}>
                    <IonChip 
                      style={{
                        backgroundColor: getTypeColor(type),
                        color: 'white',
                        fontWeight: 'bold',
                        margin: 0
                      }}
                      onClick={() => setType('')}
                    >
                      <IonLabel>
                        {pokemonTypes.find(t => t.value === type)?.label || 'Filtro'}
                      </IonLabel>
                      <IonIcon icon={close} />
                    </IonChip>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pantalla principal de la Pokédex */}
          <div className="pokedex-screen-main">
            <div className="device-body">
              <div className="main-screen">
                <div className="screen-frame">
                  <div className="screen-glass">
                    <div className="screen-header">
                      <div className="device-logo">
                        <div className="logo-circle"></div>
                        <div className="logo-dots">
                          <div className="dot"></div>
                          <div className="dot"></div>
                          <div className="dot"></div>
                        </div>
                      </div>
                      <div className="status-indicators">
                        <div className="indicator power"></div>
                        <div className="indicator signal"></div>
                        <div className="indicator data"></div>
                      </div>
                    </div>
                    <div className="screen-display">
                      <div className="display-header">
                        <div className="scan-bar"></div>
                        <div className="data-grid">
                          <div className="grid-line"></div>
                          <div className="grid-line"></div>
                          <div className="grid-line"></div>
                        </div>
                        {/* Contador de resultados */}
                        {(searchText || type) && (
                          <div style={{
                            textAlign: 'center',
                            padding: '8px',
                            margin: '8px',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            borderRadius: '8px',
                            border: '1px solid rgba(16, 185, 129, 0.3)'
                          }}>
                            <span style={{ color: '#10b981', fontSize: '12px', fontWeight: 'bold' }}>
                              {filteredItems.length} Pokémon encontrados
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="pokemon-database">
                        <IonList className="pokedex-list">
                          {filteredItems.map((item) => (
                            <IonItem 
                              key={item.id} 
                              className="pokedex-item"
                              button
                              onClick={() => fetchPokemonDetails(item.id)}
                              style={{ cursor: 'pointer' }}
                            >
                              <div className="pokemon-entry">
                                <div className="entry-image">
                                  <div className="image-frame">
                                    <img src={item.img} alt={item.name} />
                                  </div>
                                  <div className="scan-overlay"></div>
                                </div>
                                <div className="entry-data">
                                  <div className="pokemon-id">#{String(item.id).padStart(3, '0')}</div>
                                  <div className="pokemon-name">{item.name}</div>
                                  <div className="pokemon-classification">
                                    {item.types?.map((t: string) => (
                                      <span key={t} className={`type-badge ${t}`}>
                                        {t.charAt(0).toUpperCase() + t.slice(1)}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <div className="entry-status">
                                  <div className="status-dot active"></div>
                                </div>
                              </div>
                            </IonItem>
                          ))}
                          {isLoading && (
                            <div style={{ textAlign: 'center', padding: '20px' }}>
                              <IonSpinner color="primary" />
                              <p style={{ color: '#999', marginTop: '10px' }}>Cargando Pokémon...</p>
                            </div>
                          )}
                        </IonList>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <IonInfiniteScroll
          onIonInfinite={async (event) => {
            await generateItems();
            event.target.complete();
          }}
        >
          <IonInfiniteScrollContent />
        </IonInfiniteScroll>

        {/* Modal de detalles del Pokémon */}
        <IonModal 
          isOpen={showModal} 
          onDidDismiss={() => setShowModal(false)}
          className="pokemon-details-modal"
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>
                {selectedPokemon ? selectedPokemon.name : 'Cargando...'}
              </IonTitle>
              <IonButton slot="end" fill="clear" onClick={() => setShowModal(false)}>
                <IonIcon icon={close} />
              </IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {loadingDetails ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <IonSpinner color="primary" />
              </div>
            ) : selectedPokemon ? (
              <div style={{ padding: '20px' }}>
                {/* Imagen principal */}
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <img 
                    src={selectedPokemon.sprites.other['official-artwork'].front_default} 
                    alt={selectedPokemon.name}
                    style={{ width: '200px', height: '200px' }}
                  />
                </div>

                {/* Información básica */}
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle>
                      #{String(selectedPokemon.id).padStart(3, '0')} {selectedPokemon.name}
                    </IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <div style={{ marginBottom: '16px' }}>
                      <strong>Tipo:</strong>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                        {selectedPokemon.types.map((t) => (
                          <IonChip 
                            key={t}
                            style={{ 
                              padding: '8px 16px',
                              fontWeight: 'bold',
                              backgroundColor: getTypeColor(t),
                              color: 'white'
                            }}
                          >
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                          </IonChip>
                        ))}
                      </div>
                    </div>

                    <IonGrid>
                      <IonRow>
                        <IonCol size="6">
                          <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Altura</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>
                              {selectedPokemon.height} m
                            </div>
                          </div>
                        </IonCol>
                        <IonCol size="6">
                          <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Peso</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>
                              {selectedPokemon.weight} kg
                            </div>
                          </div>
                        </IonCol>
                      </IonRow>
                    </IonGrid>
                  </IonCardContent>
                </IonCard>

                {/* Estadísticas */}
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle>Estadísticas Base</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    {[
                      { name: 'HP', value: selectedPokemon.stats.hp, color: '#ef4444', icon: heart },
                      { name: 'Ataque', value: selectedPokemon.stats.attack, color: '#f59e0b', icon: flame },
                      { name: 'Defensa', value: selectedPokemon.stats.defense, color: '#3b82f6', icon: shield },
                      { name: 'Atq. Especial', value: selectedPokemon.stats.specialAttack, color: '#8b5cf6', icon: star },
                      { name: 'Def. Especial', value: selectedPokemon.stats.specialDefense, color: '#06b6d4', icon: shield },
                      { name: 'Velocidad', value: selectedPokemon.stats.speed, color: '#10b981', icon: speedometer },
                    ].map((stat) => (
                      <div key={stat.name} style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <IonIcon icon={stat.icon} style={{ color: stat.color }} />
                            <span style={{ fontWeight: '600', fontSize: '14px' }}>{stat.name}</span>
                          </div>
                          <span style={{ fontWeight: 'bold', color: stat.color }}>{stat.value}</span>
                        </div>
                        <IonProgressBar 
                          value={stat.value / 255} 
                          style={{ 
                            '--background': '#e5e7eb',
                            '--progress-background': stat.color,
                            height: '8px',
                            borderRadius: '4px'
                          }}
                        />
                      </div>
                    ))}
                  </IonCardContent>
                </IonCard>

                {/* Habilidades */}
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle>Habilidades</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {selectedPokemon.abilities.map((ability) => (
                        <IonBadge 
                          key={ability}
                          color="secondary"
                          style={{ 
                            padding: '8px 16px',
                            fontSize: '13px',
                            fontWeight: '500'
                          }}
                        >
                          {ability.split('-').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')}
                        </IonBadge>
                      ))}
                    </div>
                  </IonCardContent>
                </IonCard>
              </div>
            ) : null}
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Pokedex;
