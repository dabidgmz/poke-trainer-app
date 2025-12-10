// utils/notifications.ts
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('Notifications no soportadas en este navegador');
    return false;
  }

  // Ya está concedido
  if (Notification.permission === 'granted') return true;

  // Denegado
  if (Notification.permission === 'denied') return false;

  // Pedir permiso
  const result = await Notification.requestPermission();
  return result === 'granted';
}

interface CaptureNotificationOptions {
  name: string;
  spriteUrl?: string | null;
  rarity?: string;
  placement?: 'team' | 'pc';
  pcBox?: number;
}

export function showCaptureNotification(opts: CaptureNotificationOptions) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const { name, spriteUrl, rarity, placement, pcBox } = opts;

  let body = `Has capturado a ${name}`;
  if (rarity) body += ` (${rarity.toUpperCase()})`;
  if (placement === 'team') body += ' y se agregó a tu equipo';
  if (placement === 'pc' && pcBox) body += ` y se guardó en la caja ${pcBox}`;

  new Notification('¡Pokémon capturado!', {
    body,
    icon: spriteUrl || undefined,
  });
}