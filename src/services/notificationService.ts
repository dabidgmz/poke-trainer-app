// src/services/notificationService.ts
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { requestNotificationPermission, showCaptureNotification } from '../utils/notifications';

let notificationsInitialized = false;

export async function initNotifications() {
  if (notificationsInitialized) return;

  // Nativo (Android / iOS con Capacitor)
  if (Capacitor.isNativePlatform()) {
    const perms = await LocalNotifications.requestPermissions();
    if (perms.display !== 'granted') {
      console.warn('Permiso de notificaciones NO concedido (nativo)');
      return;
    }

    try {
      await LocalNotifications.createChannel({
        id: 'captures',
        name: 'Capturas de Pokémon',
        importance: 5, // max
        description: 'Notificaciones cuando capturas un Pokémon',
      });
    } catch (e) {
      // En iOS / web puede no aplicar, ignoramos
      console.warn('No se pudo crear canal de notificaciones (puede ser normal en esta plataforma)', e);
    }
  } else {
    // Web / PWA
    const granted = await requestNotificationPermission();
    if (!granted) {
      console.warn('Permiso de notificaciones del navegador NO concedido');
      return;
    }
  }

  notificationsInitialized = true;
}

export async function notifyPokemonCaptured(options: {
  name: string;
  rarity?: string;
  placement?: 'team' | 'pc';
  pcBox?: number;
  types?: string[];
  spriteUrl?: string | null;
}) {
  const { name, rarity, placement, pcBox, types, spriteUrl } = options;

  // Asegurar que se pidieron permisos (nativo o web)
  await initNotifications();

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
  const body = bodyParts.join(' · ') || `Has atrapado a ${name}${rarityText}`;

  // Nativo → LocalNotifications
  if (Capacitor.isNativePlatform()) {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: Date.now(), // id único rápido
          title: '¡Pokémon capturado!',
          body,
          channelId: 'captures',
          smallIcon: 'ic_stat_icon', // opcional si lo configuras
          extra: {
            name,
            rarity,
          },
        },
      ],
    });
    return;
  }

  // Web / PWA → Notification API
  showCaptureNotification({
    name,
    spriteUrl: spriteUrl || undefined,
    rarity,
    placement,
    pcBox,
  });
}