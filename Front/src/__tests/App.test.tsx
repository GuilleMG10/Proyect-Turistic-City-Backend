// Front/src/__tests__/App.test.tsx

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ErrorBanner from '../components/ErrorBanner';
import PlaceCard from '../components/PlaceCard';
import Home from '../routes/Home';
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
    id: '1',
    name: 'Lugar de Prueba',
    description: 'Una descripción de prueba.',
    image_url: 'https://placehold.co/800x533',
    category: 'Turismo',
    min_age: null,
    max_age: null,
    price_min: 10,
    price_max: 20,
    rating: 4.5,
    city: 'Cochabamba',
    is_active: true,
  };

  it('debería renderizar la información del lugar', () => {
    render(<PlaceCard place={mockPlace} />);
    expect(screen.getByText('Lugar de Prueba')).toBeInTheDocument();
    expect(screen.getByText('Una descripción de prueba.')).toBeInTheDocument();
    expect(screen.getByText('Bs 10 – 20')).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
  });
});

