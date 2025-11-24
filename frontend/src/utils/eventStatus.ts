import type { EventStatus } from '../types';

export function getEventStatusColor(status: EventStatus): {
  bg: string;
  text: string;
  label: string;
} {
  switch (status) {
    case 'upcoming':
      return {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-800 dark:text-blue-300',
        label: 'Próximo'
      };
    case 'happening':
      return {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-800 dark:text-green-300',
        label: 'En vivo'
      };
    case 'finished':
      return {
        bg: 'bg-gray-100 dark:bg-gray-700/50',
        text: 'text-gray-600 dark:text-gray-400',
        label: 'Terminado'
      };
    default:
      return {
        bg: 'bg-gray-100 dark:bg-gray-700/50',
        text: 'text-gray-600 dark:text-gray-400',
        label: 'Sin estado'
      };
  }
}