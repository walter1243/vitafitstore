import type { PickupPoint } from './shipping-options';

// Distancia e horario dos pontos de recogida (lista e mapa do checkout).
const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export type Origin = { lat: number; lng: number } | null;

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const r = (x: number) => (x * Math.PI) / 180;
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const kmLabel = (km: number) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1).replace('.', ',')} km`);

export function todayHours(p: PickupPoint) {
  const t = p.hours?.[DAYS[new Date().getDay()]];
  return t ? `Hoy ${t}` : 'Hoy cerrado';
}

