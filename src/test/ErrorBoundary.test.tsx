import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';

// Composant qui explose intentionnellement
function BrokenComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Test crash');
  return <div>Contenu normal</div>;
}

// Éviter que les erreurs React polluent la console des tests
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('ErrorBoundary', () => {
  it('affiche les enfants normalement si pas d\'erreur', () => {
    render(
      <ErrorBoundary>
        <BrokenComponent shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Contenu normal')).toBeInTheDocument();
  });

  it('affiche le fallback par défaut si un composant plante', () => {
    render(
      <ErrorBoundary>
        <BrokenComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Une erreur est survenue')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /recharger/i })).toBeInTheDocument();
  });

  it('affiche un fallback personnalisé si fourni', () => {
    render(
      <ErrorBoundary fallback={<div>Erreur personnalisée</div>}>
        <BrokenComponent shouldThrow={true} />
      </ErrorBoundary>
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
      <ErrorBoundary>
        <BrokenComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByRole('button', { name: /recharger/i }));
    expect(reloadMock).toHaveBeenCalledOnce();
  });
});
