// src/services/notificationService.ts
import { LocalNotifications } from '@capacitor/local-notifications';

let notificationsInitialized = false;

export async function initNotifications() {
  if (notificationsInitialized) return;

  // Pedir permisos una vez
  const perms = await LocalNotifications.requestPermissions();
  if (perms.display !== 'granted') {
    console.warn('Permiso de notificaciones NO concedido');
    return;
  }

  // (Opcional) Canal en Android
  try {
    await LocalNotifications.createChannel({
      id: 'captures',
      name: 'Capturas de Pokémon',
      importance: 5, // max
      description: 'Notificaciones cuando capturas un Pokémon',
    });
  } catch (e) {
    // En web / iOS puede no aplicar, no pasa nada
  }

  notificationsInitialized = true;
}

export async function notifyPokemonCaptured(options: {
  name: string;
  rarity?: string;
  placement?: 'team' | 'pc';
  pcBox?: number;
  types?: string[];
}) {
  const { name, rarity, placement, pcBox, types } = options;

  const rarityText = rarity
    ? ` (${rarity.charAt(0).toUpperCase() + rarity.slice(1)})`
    : '';

  const placementText =
    placement === 'team'
      ? 'Se unió a tu equipo.'
      : placement === 'pc' && pcBox
      ? `Se guardó en la caja ${pcBox}.`
      : '';

  const typesText =
    types && types.length
      ? `Tipo: ${types
          .map((t) => (t || '').charAt(0).toUpperCase() + (t || '').slice(1))
          .join(' / ')}`
      : '';

  const bodyParts = [placementText, typesText].filter(Boolean);
  const body = bodyParts.join(' · ');

  await LocalNotifications.schedule({
    notifications: [
      {
        id: Date.now(), // id único rápido
        title: '¡Pokémon capturado!',
        body: body || `Has atrapado a ${name}${rarityText}`,
        channelId: 'captures',
        smallIcon: 'ic_stat_icon', // opcional, ícono en Android si lo configuras
        extra: {
          name,
          rarity,
        },
      },
    ],
  });
}