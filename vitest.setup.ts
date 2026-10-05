import { vi } from 'vitest';

// Polyfill ResizeObserver for Radix UI primitives in JSDOM
if (typeof window !== 'undefined') {
  class ResizeObserverMock {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }

  window.ResizeObserver = window.ResizeObserver || ResizeObserverMock;

  // Polyfill scrollIntoView
  if (!window.HTMLElement.prototype.scrollIntoView) {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  }

  // Polyfill HTMLMediaElement methods
  if (window.HTMLMediaElement) {
    window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    window.HTMLMediaElement.prototype.pause = vi.fn();
    window.HTMLMediaElement.prototype.load = vi.fn();
  }
}
