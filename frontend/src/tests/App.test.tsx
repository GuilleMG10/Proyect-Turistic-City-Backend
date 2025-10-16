import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ErrorBanner from '../components/ErrorBanner';
import PlaceCard from '../components/PlaceCard';
import type { Place } from '../types';

// Pruebas para el componente ErrorBanner
describe('ErrorBanner', () => {
  it('debería renderizar el mensaje de error correctamente', () => {
    const errorMessage = 'Este es un mensaje de error de prueba';
    render(<ErrorBanner message={errorMessage} />);
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
});

// Pruebas para el componente PlaceCard
describe('PlaceCard', () => {
  const mockPlace: Place = {
    id: 1,
    user_id: 1,
    name: 'Lugar de Prueba',
    description: 'Una descripción de prueba.',
    location: 'Cochabamba, Bolivia',
    latitude: -17.3895,
    longitude: -66.1568,
    category: 'Turismo',
    created_at: '2025-01-01T00:00:00Z',
    link_image: 'https://placehold.co/800x533',
    active: true,
  };

  it('debería renderizar la información del lugar', () => {
    render(<PlaceCard place={mockPlace} />);
    expect(screen.getByText('Lugar de Prueba')).toBeInTheDocument();
    expect(screen.getByText('Una descripción de prueba.')).toBeInTheDocument();
  });
});

