import type { EventStatus } from '../types';

export function getEventStatusColor(status: EventStatus): {
  bg: string;
  text: string;
  label: string;
} {
  switch (status) {
    case 'upcoming':
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        label: 'Próximo'
      };
    case 'happening':
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        label: 'En vivo'
      };
    case 'finished':
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-600',
        label: 'Terminado'
      };
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-600',
        label: 'Sin estado'
      };
  }
}