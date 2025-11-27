import React, { useState, useEffect, useCallback } from 'react';
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
  IonCol,
  useIonViewWillLeave,
  useIonViewDidEnter
} from '@ionic/react';
import { search, filter, refresh, searchCircle, close, flame, shield, heart, speedometer, star, swapVertical, layers, trophy } from 'ionicons/icons';
import ProfileButton from '../components/ProfileButton';
import OfflineMessage from '../components/OfflineMessage';
import offlineCache from '../services/offlineCache';
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
  const [generation, setGeneration] = useState('');
  const [sortBy, setSortBy] = useState('id-asc');
  const [rarity, setRarity] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonDetails | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

  // Función para limpiar recursos
  const cleanupAll = useCallback(() => {
    // Cerrar modal si está abierto
    if (showModal) {
      setShowModal(false);
      setSelectedPokemon(null);
    }
    // Limpiar estados de carga
    setIsLoading(false);
    setLoadingDetails(false);
  }, [showModal]);

  // Limpiar cuando se sale de la vista (navegación entre tabs)
  useIonViewWillLeave(() => {
    cleanupAll();
  });

  // Reinicializar cuando se entra a la vista
  useIonViewDidEnter(() => {
    // Asegurar que el modal esté cerrado
    if (showModal) {
      setShowModal(false);
      setSelectedPokemon(null);
    }
  });

  // Limpiar cuando la página se oculta
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        cleanupAll();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [cleanupAll]);

  // Limpiar al desmontar el componente
  useEffect(() => {
    return () => {
      cleanupAll();
    };
  }, [cleanupAll]);

  useEffect(() => {
    generateItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Detectar cambios en la conexión
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Función para obtener la generación de un Pokémon
  const getGeneration = (id: number): number => {
    if (id <= 151) return 1;
    if (id <= 251) return 2;
    if (id <= 386) return 3;
    if (id <= 493) return 4;
    if (id <= 649) return 5;
    if (id <= 721) return 6;
    if (id <= 809) return 7;
    return 8;
  };

  // Función para determinar rareza basada en tipos
  const getRarity = (types: string[]): string => {
    const legendaryTypes = ['dragon', 'psychic', 'ghost'];
    const rareTypes = ['electric', 'ice', 'steel', 'fairy', 'dark'];
    
    const hasLegendary = types.some(t => legendaryTypes.includes(t));
    const hasRare = types.some(t => rareTypes.includes(t));
    
    if (hasLegendary) return 'legendary';
    if (hasRare) return 'rare';
    return 'common';
  };

  // Filtro por búsqueda, tipo, generación y rareza
  const filteredItems = items
    .filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchText.toLowerCase());
      const matchesType = type === '' || item.type === type || item.types?.includes(type);
      const matchesGeneration = generation === '' || getGeneration(item.id).toString() === generation;
      const matchesRarity = rarity === '' || getRarity(item.types || []) === rarity;
      
      return matchesSearch && matchesType && matchesGeneration && matchesRarity;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'id-desc':
          return b.id - a.id;
        case 'id-asc':
        default:
          return a.id - b.id;
      }
    });

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
        {!isOnline ? (
          <OfflineMessage onRetry={() => setIsOnline(navigator.onLine)} />
        ) : (
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
            <div className="filter-section" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              marginTop: '16px',
              padding: '0 8px'
            }}>
              {/* Filtro por Tipo */}
              <div style={{ 
                backgroundColor: 'white',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '2px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <IonIcon icon={flame} style={{ color: '#ef4444', fontSize: '18px' }} />
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                    Tipo:
                  </span>
                </div>
                <IonSelect
                  value={type}
                  onIonChange={e => setType(e.detail.value)}
                  placeholder="Todos"
                  interface="action-sheet"
                  style={{
                    '--background': 'transparent',
                    '--color': type ? '#10b981' : '#1e293b',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  {pokemonTypes.map((t) => (
                    <IonSelectOption key={t.value} value={t.value}>{t.label}</IonSelectOption>
                  ))}
                </IonSelect>
              </div>

              {/* Filtro por Generación */}
              <div style={{ 
                backgroundColor: 'white',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '2px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <IonIcon icon={layers} style={{ color: '#3b82f6', fontSize: '18px' }} />
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                    Generación:
                  </span>
                </div>
                <IonSelect
                  value={generation}
                  onIonChange={e => setGeneration(e.detail.value)}
                  placeholder="Todas"
                  interface="action-sheet"
                  style={{
                    '--background': 'transparent',
                    '--color': generation ? '#3b82f6' : '#1e293b',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  <IonSelectOption value="">Todas</IonSelectOption>
                  <IonSelectOption value="1">Gen 1 (Kanto)</IonSelectOption>
                  <IonSelectOption value="2">Gen 2 (Johto)</IonSelectOption>
                  <IonSelectOption value="3">Gen 3 (Hoenn)</IonSelectOption>
                  <IonSelectOption value="4">Gen 4 (Sinnoh)</IonSelectOption>
                  <IonSelectOption value="5">Gen 5 (Unova)</IonSelectOption>
                  <IonSelectOption value="6">Gen 6 (Kalos)</IonSelectOption>
                  <IonSelectOption value="7">Gen 7 (Alola)</IonSelectOption>
                  <IonSelectOption value="8">Gen 8 (Galar)</IonSelectOption>
                </IonSelect>
              </div>

              {/* Filtro por Rareza */}
              <div style={{ 
                backgroundColor: 'white',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '2px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <IonIcon icon={trophy} style={{ color: '#f59e0b', fontSize: '18px' }} />
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                    Rareza:
                  </span>
                </div>
                <IonSelect
                  value={rarity}
                  onIonChange={e => setRarity(e.detail.value)}
                  placeholder="Todas"
                  interface="action-sheet"
                  style={{
                    '--background': 'transparent',
                    '--color': rarity ? '#f59e0b' : '#1e293b',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  <IonSelectOption value="">Todas</IonSelectOption>
                  <IonSelectOption value="common">Común</IonSelectOption>
                  <IonSelectOption value="rare">Raro</IonSelectOption>
                  <IonSelectOption value="legendary">Legendario</IonSelectOption>
                </IonSelect>
              </div>

              {/* Ordenar */}
              <div style={{ 
                backgroundColor: 'white',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '2px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <IonIcon icon={swapVertical} style={{ color: '#8b5cf6', fontSize: '18px' }} />
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                    Ordenar:
                  </span>
                </div>
                <IonSelect
                  value={sortBy}
                  onIonChange={e => setSortBy(e.detail.value)}
                  interface="action-sheet"
                  style={{
                    '--background': 'transparent',
                    '--color': '#8b5cf6',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  <IonSelectOption value="id-asc">ID ↑</IonSelectOption>
                  <IonSelectOption value="id-desc">ID ↓</IonSelectOption>
                  <IonSelectOption value="name-asc">A-Z</IonSelectOption>
                  <IonSelectOption value="name-desc">Z-A</IonSelectOption>
                </IonSelect>
              </div>
            </div>

            {/* Chips de filtros activos */}
            {(type || generation || rarity) && (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginTop: '12px',
                padding: '0 8px',
                justifyContent: 'center'
              }}>
                {type && (
                  <IonChip 
                    style={{
                      backgroundColor: getTypeColor(type),
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                    onClick={() => setType('')}
                  >
                    <IonLabel>
                      Tipo: {pokemonTypes.find(t => t.value === type)?.label}
                    </IonLabel>
                    <IonIcon icon={close} />
                  </IonChip>
                )}
                {generation && (
                  <IonChip 
                    style={{
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                    onClick={() => setGeneration('')}
                  >
                    <IonLabel>
                      Gen {generation}
                    </IonLabel>
                    <IonIcon icon={close} />
                  </IonChip>
                )}
                {rarity && (
                  <IonChip 
                    style={{
                      backgroundColor: rarity === 'legendary' ? '#f59e0b' : rarity === 'rare' ? '#8b5cf6' : '#10b981',
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                    onClick={() => setRarity('')}
                  >
                    <IonLabel>
                      {rarity === 'legendary' ? 'Legendario' : rarity === 'rare' ? 'Raro' : 'Común'}
                    </IonLabel>
                    <IonIcon icon={close} />
                  </IonChip>
                )}
                <IonButton
                  size="small"
                  fill="clear"
                  onClick={() => {
                    setType('');
                    setGeneration('');
                    setRarity('');
                    setSortBy('id-asc');
                  }}
                  style={{ '--color': '#64748b', fontSize: '12px' }}
                >
                  <IonIcon icon={refresh} slot="start" />
                  Limpiar filtros
                </IonButton>
              </div>
            )}
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
                        {(searchText || type || generation || rarity) && (
                          <div style={{
                            textAlign: 'center',
                            padding: '8px',
                            margin: '8px',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            borderRadius: '8px',
                            border: '1px solid rgba(16, 185, 129, 0.3)'
                          }}>
                            <span style={{ color: '#10b981', fontSize: '12px', fontWeight: 'bold' }}>
                              {filteredItems.length} Pokémon encontrado{filteredItems.length !== 1 ? 's' : ''}
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
        )}

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
          onDidDismiss={() => {
            setShowModal(false);
            setSelectedPokemon(null);
            setLoadingDetails(false);
          }}
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
