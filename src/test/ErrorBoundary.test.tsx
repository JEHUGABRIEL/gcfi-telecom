import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { LanguageProvider } from '@/shared/context/LanguageContext';

// Composant qui explose intentionnellement
function BrokenComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Test crash');
  return <div>Contenu normal</div>;
}

// Éviter que les erreurs React polluent la console des tests
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  localStorage.setItem('gcfi-lang', 'fr');
});

describe('ErrorBoundary', () => {
  it('affiche les enfants normalement si pas d\'erreur', () => {
    render(
      <LanguageProvider>
        <ErrorBoundary>
          <BrokenComponent shouldThrow={false} />
        </ErrorBoundary>
      </LanguageProvider>
    );
    expect(screen.getByText('Contenu normal')).toBeInTheDocument();
  });

  it('affiche le fallback par défaut si un composant plante', () => {
    render(
      <LanguageProvider>
        <ErrorBoundary>
          <BrokenComponent shouldThrow={true} />
        </ErrorBoundary>
      </LanguageProvider>
    );
    expect(screen.getByText('Une erreur est survenue')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /recharger/i })).toBeInTheDocument();
  });

  it('affiche un fallback personnalisé si fourni', () => {
    render(
      <LanguageProvider>
        <ErrorBoundary fallback={<div>Erreur personnalisée</div>}>
          <BrokenComponent shouldThrow={true} />
        </ErrorBoundary>
      </LanguageProvider>
    );
    expect(screen.getByText('Erreur personnalisée')).toBeInTheDocument();
  });

  it('le bouton recharger appelle window.location.reload', () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    });

    render(
      <LanguageProvider>
        <ErrorBoundary>
          <BrokenComponent shouldThrow={true} />
        </ErrorBoundary>
      </LanguageProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /recharger/i }));
    expect(reloadMock).toHaveBeenCalledOnce();
  });
});
