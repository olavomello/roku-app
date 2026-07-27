import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerScene } from '../components/PlayerScene';
import { Video } from '../types';

const testVideo: Video = {
  id: 'v1',
  title: 'Test Stream Video',
  description: 'Test Stream Description',
  thumbnail: 'https://example.com/thumb.jpg',
  url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  duration: 600,
  category: 'Shorts',
};

describe('PlayerScene Component Tests', () => {
  it('renders video player, title, and controls', () => {
    const onBack = vi.fn();
    const onPlaybackUpdate = vi.fn();

    render(
      <PlayerScene
        video={testVideo}
        onBack={onBack}
        onUpdatePlayback={onPlaybackUpdate}
        initialTime={0}
      />
    );

    expect(screen.getByText('Test Stream Video')).toBeInTheDocument();
    expect(screen.getByText('Back to Home (Esc)')).toBeInTheDocument();
  });

  it('triggers onBack when Back button is clicked', () => {
    const onBack = vi.fn();

    render(
      <PlayerScene
        video={testVideo}
        onBack={onBack}
        onUpdatePlayback={vi.fn()}
        initialTime={0}
      />
    );

    const backBtn = screen.getByText('Back to Home (Esc)');
    fireEvent.click(backBtn);
    expect(onBack).toHaveBeenCalled();
  });
});
