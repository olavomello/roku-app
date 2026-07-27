import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

describe('Roku TV App E2E Flow Tests', () => {
  it('navigates from HomeScene to PlayerScene and returns on Back action', async () => {
    render(<App />);

    // Verify MainScene loads channel catalog
    await waitFor(() => {
      expect(screen.getByText('Catalogo')).toBeInTheDocument();
    });

    // Check that sample videos are rendered
    expect(screen.getByText('Em destaque')).toBeInTheDocument();

    // Click on Play Stream button
    const playBtn = screen.getByText('Assistir (Enter)');
    fireEvent.click(playBtn);

    // Should switch to PlayerScene view
    await waitFor(() => {
      expect(screen.getByText('Voltar (Esc)')).toBeInTheDocument();
    });

    // Click Back to return to HomeScene
    const backBtn = screen.getByText('Voltar (Esc)');
    fireEvent.click(backBtn);

    // Verify returning to HomeScene
    await waitFor(() => {
      expect(screen.getByText('Catalogo')).toBeInTheDocument();
    });
  });
});
