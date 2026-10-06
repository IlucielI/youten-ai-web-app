import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Design Token Fidelity Audit for youten-ai-web-app
 * Validates that globals.css matches the Penpot design tokens specification:
 * Primary: #2563eb, Accent: #6366f1, Background: #f8fafc, Surface: #ffffff, Border: #e2e8f0
 */
describe('Design Tokens & Penpot Visual Fidelity Audit', () => {
  const globalsCssPath = path.resolve(__dirname, '../app/globals.css');
  const globalsCssContent = fs.readFileSync(globalsCssPath, 'utf-8');

  it('defines Penpot primary brand color tokens', () => {
    expect(globalsCssContent).toContain('--primary: #2563eb;');
    expect(globalsCssContent).toContain('--primary-hover: #1d4ed8;');
    expect(globalsCssContent).toContain('--primary-active: #1e40af;');
    expect(globalsCssContent).toContain('--primary-subtle: #eff6ff;');
    expect(globalsCssContent).toContain('--primary-foreground: #ffffff;');
  });

  it('defines surface, background, and neutral border tokens', () => {
    expect(globalsCssContent).toContain('--background: #f8fafc;');
    expect(globalsCssContent).toContain('--foreground: #0f172a;');
    expect(globalsCssContent).toContain('--surface: #ffffff;');
    expect(globalsCssContent).toContain('--border: #e2e8f0;');
    expect(globalsCssContent).toContain('--muted: #64748b;');
    expect(globalsCssContent).toContain('--muted-foreground: #94a3b8;');
  });

  it('defines 8pt grid compatible radius tokens', () => {
    expect(globalsCssContent).toContain('--radius-sm: 0.375rem;');
    expect(globalsCssContent).toContain('--radius-md: 0.5rem;');
    expect(globalsCssContent).toContain('--radius-lg: 0.75rem;');
    expect(globalsCssContent).toContain('--radius-xl: 1rem;');
    expect(globalsCssContent).toContain('--radius-2xl: 1.25rem;');
  });

  it('defines dark mode palette tokens for high-contrast accessibility', () => {
    expect(globalsCssContent).toContain('--background: #0b0f19;');
    expect(globalsCssContent).toContain('--foreground: #f8fafc;');
    expect(globalsCssContent).toContain('--surface: #131b2e;');
    expect(globalsCssContent).toContain('--border: #232f48;');
  });

  it('defines official theme preset palettes', () => {
    expect(globalsCssContent).toContain('[data-theme="emerald"]');
    expect(globalsCssContent).toContain('[data-theme="violet"]');
    expect(globalsCssContent).toContain('[data-theme="rose"]');
    expect(globalsCssContent).toContain('[data-theme="amber"]');
    expect(globalsCssContent).toContain('[data-theme="slate"]');
  });
});
