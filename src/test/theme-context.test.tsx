import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, renderHook, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '@/shared/context/ThemeContext';

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = '';
  });

  it('affiche les enfants', () => {
    render(
      <ThemeProvider>
        <div data-testid="child">Contenu</div>
      </ThemeProvider>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('initialise en mode clair par défaut', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
    expect(result.current.theme).toBe('light');
  });

  it('bascule en mode sombre via toggleTheme', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe('dark');
  });

  it('bascule en mode clair après deux toggles', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });

    act(() => { result.current.toggleTheme(); });
    act(() => { result.current.toggleTheme(); });

    expect(result.current.theme).toBe('light');
  });

  it('ajoute la classe dark au document en mode sombre', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });

    act(() => {
      result.current.toggleTheme();
    });

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('sauvegarde le thème dans localStorage', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });

    act(() => {
      result.current.toggleTheme();
    });

    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('restaure le thème depuis localStorage', () => {
    localStorage.setItem('theme', 'dark');

    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
    expect(result.current.theme).toBe('dark');
  });

  it('lève une erreur si useTheme est utilisé hors Provider', () => {
    // Supprimer les erreurs console attendues
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useTheme())).toThrow(
      'useTheme must be used within a ThemeProvider'
    );
  });
});
