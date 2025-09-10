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
  IonSelectOption
} from '@ionic/react';
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
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Pokédex</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div style={{ padding: 16 }}>
          <IonSearchbar
            value={search}
            onIonInput={e => setSearch(e.detail.value!)}
            placeholder="Buscar Pokémon"
          />
          <IonItem>
            <IonSelect
              label="Tipo"
              labelPlacement="stacked"
              value={type}
              onIonChange={e => setType(e.detail.value)}
            >
              {pokemonTypes.map((t) => (
                <IonSelectOption key={t.value} value={t.value}>{t.label}</IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
        </div>
        <IonList>
          {filteredItems.map((item, index) => (
            <IonItem key={item.name + index}>
              <IonAvatar slot="start">
                <img src={item.img} alt={item.name} />
              </IonAvatar>
              <IonLabel>
                <h2>{item.name}</h2>
                <p>{item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : 'Desconocido'}</p>
              </IonLabel>
            </IonItem>
          ))}
        </IonList>
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
