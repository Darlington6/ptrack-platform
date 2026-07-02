import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ScrollToTop } from '../../components/ScrollToTop';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('ScrollToTop', () => {
  it('calls window.scrollTo(0, 0) on mount', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ScrollToTop />
      </MemoryRouter>
    );
    expect(scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('renders nothing (returns null)', () => {
    const { container } = render(
      <MemoryRouter>
        <ScrollToTop />
      </MemoryRouter>
    );
    expect(container.firstChild).toBeNull();
  });

  it('calls scrollTo on each distinct mount (simulates route change)', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);

    // First route mount
    const { unmount } = render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ScrollToTop />
      </MemoryRouter>
    );
    expect(scrollTo).toHaveBeenCalledTimes(1);
    unmount();

    // Second route mount
    render(
      <MemoryRouter initialEntries={['/leaderboard']}>
        <ScrollToTop />
      </MemoryRouter>
    );
    expect(scrollTo).toHaveBeenCalledTimes(2);
  });
});
