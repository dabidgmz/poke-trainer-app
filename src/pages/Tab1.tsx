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
  IonIcon
} from '@ionic/react';
import { search, filter, refresh } from 'ionicons/icons';
import './Tab1.css';

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
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');

  // Simulación de datos de Pokémon
  const generateItems = () => {
    const newItems = [];
    for (let i = 0; i < 30; i++) {
      const id = items.length + i + 1;
      newItems.push({
        name: `Pokémon ${id}`,
        type: pokemonTypes[(id % (pokemonTypes.length - 1)) + 1].value,
        img: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
      });
    }
    setItems([...items, ...newItems]);
  };

  useEffect(() => {
    generateItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtro por búsqueda y tipo
  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) &&
      (type === '' || item.type === type)
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
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="pokedex-content">
        <div className="pokedex-body">
          {/* Panel de control superior */}
          <div className="control-panel">
            <div className="search-section">
              <IonSearchbar
                className="pokedex-search"
                value={search}
                onIonInput={e => setSearch(e.detail.value!)}
                placeholder="Buscar Pokémon..."
                showClearButton="focus"
                debounce={300}
              />
            </div>
            <div className="filter-section">
              <IonSelect
                className="pokedex-select"
                value={type}
                onIonChange={e => setType(e.detail.value)}
                placeholder="Filtrar por tipo"
                interface="popover"
              >
                {pokemonTypes.map((t) => (
                  <IonSelectOption key={t.value} value={t.value}>{t.label}</IonSelectOption>
                ))}
              </IonSelect>
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
                      </div>
                      <div className="pokemon-database">
                        <IonList className="pokedex-list">
                          {filteredItems.map((item, index) => (
                            <IonItem key={item.name + index} className="pokedex-item">
                              <div className="pokemon-entry">
                                <div className="entry-image">
                                  <div className="image-frame">
                                    <img src={item.img} alt={item.name} />
                                  </div>
                                  <div className="scan-overlay"></div>
                                </div>
                                <div className="entry-data">
                                  <div className="pokemon-id">#{String(index + 1).padStart(3, '0')}</div>
                                  <div className="pokemon-name">{item.name}</div>
                                  <div className="pokemon-classification">
                                    <span className={`type-badge ${item.type}`}>
                                      {item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : 'Unknown'}
                                    </span>
                                  </div>
                                </div>
                                <div className="entry-status">
                                  <div className="status-dot active"></div>
                                </div>
                              </div>
                            </IonItem>
                          ))}
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
          onIonInfinite={event => {
            generateItems();
            setTimeout(() => event.target.complete(), 500);
          }}
        >
          <IonInfiniteScrollContent />
        </IonInfiniteScroll>
      </IonContent>
    </IonPage>
  );
};

export default Pokedex;
