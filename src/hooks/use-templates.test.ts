import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTemplates, FALLBACK_TEMPLATES, _resetTemplateCache } from './use-templates';
import * as apiClient from '@/lib/api-client';

describe('useTemplates hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    _resetTemplateCache();
  });

  it('provides default fallback templates immediately', () => {
    vi.spyOn(apiClient, 'apiFetchData').mockImplementation(() => new Promise(() => {}));
    const { result } = renderHook(() => useTemplates());

    expect(result.current.templates).toBeDefined();
    expect(result.current.templates.length).toBeGreaterThanOrEqual(7);
    expect(result.current.getTemplateLabel('MOM')).toBe('Notula Rapat (MOM)');
    expect(result.current.getTemplateLabel('GENERAL')).toBe('Ringkasan Umum (Cornell Notes)');
  });

  it('updates templates with data returned from backend API', async () => {
    vi.spyOn(apiClient, 'apiFetchData').mockResolvedValueOnce({
      items: [
        {
          id: 'test-1',
          category_key: 'CUSTOM_TEST',
          name: 'Custom Research Framework',
          description: 'A custom framework for testing',
          is_active: true,
        },
        {
          id: 'test-2',
          category_key: 'INACTIVE_TEST',
          name: 'Inactive',
          description: 'Should not appear',
          is_active: false,
        },
      ],
    });

    const { result } = renderHook(() => useTemplates());

    await waitFor(() => {
      expect(result.current.templates.some((t) => t.key === 'CUSTOM_TEST')).toBe(true);
    });

    expect(result.current.templates.some((t) => t.key === 'INACTIVE_TEST')).toBe(false);
    expect(result.current.getTemplateLabel('CUSTOM_TEST')).toBe('Custom Research Framework');
  });

  it('falls back gracefully to fallback templates if API request fails', async () => {
    vi.spyOn(apiClient, 'apiFetchData').mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useTemplates());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.templates).toEqual(FALLBACK_TEMPLATES);
  });
});
