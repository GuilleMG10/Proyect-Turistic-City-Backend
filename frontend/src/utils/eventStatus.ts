import type { EventStatus } from '../types';

export function getEventStatusColor(status: EventStatus): {
  bg: string;
  text: string;
  label: string;
} {
  switch (status) {
    case 'upcoming':
      return {
        bg: 'bg-blue-500 dark:bg-blue-600',
        text: 'text-white',
        label: 'Próximo'
      };
    case 'happening':
      return {
        bg: 'bg-green-500 dark:bg-green-600',
        text: 'text-white',
        label: 'En vivo'
      };
    case 'finished':
      return {
        bg: 'bg-gray-400 dark:bg-gray-600',
        text: 'text-white dark:text-gray-200',
        label: 'Terminado'
      };
    default:
      return {
        bg: 'bg-gray-400 dark:bg-gray-600',
        text: 'text-white dark:text-gray-200',
        label: 'Sin estado'
      };
  }
}