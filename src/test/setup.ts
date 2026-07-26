import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock scrollIntoView for JSDOM
Element.prototype.scrollIntoView = vi.fn();

// Mock HTMLMediaElement methods for JSDOM video player testing
Object.defineProperty(window.HTMLMediaElement.prototype, 'play', {
  configurable: true,
  value: vi.fn().mockImplementation(() => Promise.resolve()),
});

Object.defineProperty(window.HTMLMediaElement.prototype, 'pause', {
  configurable: true,
  value: vi.fn(),
});

Object.defineProperty(window.HTMLMediaElement.prototype, 'load', {
  configurable: true,
  value: vi.fn(),
});

