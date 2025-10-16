// Importa matchers adicionales de jest-dom, como .toBeInTheDocument()
import '@testing-library/jest-dom';

// Mock IntersectionObserver
const mockIntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: mockIntersectionObserver
});