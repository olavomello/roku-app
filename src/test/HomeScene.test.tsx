import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HomeScene } from '../components/HomeScene';
import { Video } from '../types';

const mockVideos: Video[] = [
  {
    id: 'vid-1',
    title: 'First Test Video',
    description: 'First test description',
    thumbnail: 'https://example.com/thumb1.jpg',
    url: 'https://example.com/stream1.mp4',
    duration: 120,
    category: 'Action',
    rating: 'PG-13',
  },
  {
    id: 'vid-2',
    title: 'Second Test Video',
    description: 'Second test description',
    thumbnail: 'https://example.com/thumb2.jpg',
    url: 'https://example.com/stream2.mp4',
    duration: 180,
    category: 'Comedy',
    rating: 'G',
  }
];

describe('HomeScene Component Tests', () => {
  it('renders catalog items and spotlight HUD correctly', () => {
    const onSelectCategory = vi.fn();
    const setFocusedIndex = vi.fn();
    const onSelectVideo = vi.fn();

    render(
      <HomeScene
        videos={mockVideos}
        categories={['All', 'Action', 'Comedy']}
        selectedCategory="All"
        onSelectCategory={onSelectCategory}
        focusedIndex={0}
        setFocusedIndex={setFocusedIndex}
        onSelectVideo={onSelectVideo}
        playbackHistory={{}}
      />
    );

    expect(screen.getAllByText('First Test Video')[0]).toBeInTheDocument();
    expect(screen.getByText('Second Test Video')).toBeInTheDocument();
    expect(screen.getByText('Roku Focused Item')).toBeInTheDocument();
    expect(screen.getByText('Play Stream (Press OK / Enter)')).toBeInTheDocument();
  });

  it('triggers onSelectVideo when play stream button is clicked', () => {
    const onSelectVideo = vi.fn();

    render(
      <HomeScene
        videos={mockVideos}
        categories={['All']}
        selectedCategory="All"
        onSelectCategory={vi.fn()}
        focusedIndex={0}
        setFocusedIndex={vi.fn()}
        onSelectVideo={onSelectVideo}
        playbackHistory={{}}
      />
    );

    const playBtn = screen.getByText('Play Stream (Press OK / Enter)');
    fireEvent.click(playBtn);
    expect(onSelectVideo).toHaveBeenCalledWith(mockVideos[0]);
  });

  it('calls onSelectCategory when a category pill is clicked', () => {
    const onSelectCategory = vi.fn();

    render(
      <HomeScene
        videos={mockVideos}
        categories={['All', 'Action', 'Comedy']}
        selectedCategory="All"
        onSelectCategory={onSelectCategory}
        focusedIndex={0}
        setFocusedIndex={vi.fn()}
        onSelectVideo={vi.fn()}
        playbackHistory={{}}
      />
    );

    const categoryBtn = screen.getByRole('button', { name: 'Action' });
    fireEvent.click(categoryBtn);
    expect(onSelectCategory).toHaveBeenCalledWith('Action');
  });
});
