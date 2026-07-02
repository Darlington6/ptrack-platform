import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UpdateBanner } from '../../components/UpdateBanner';

// Mock the virtual PWA module — it doesn't exist in the test environment
const mockUpdateServiceWorker = vi.fn();

const noop = vi.fn();

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: vi.fn(() => ({
    needRefresh: [false, noop] as [boolean, typeof noop],
    updateServiceWorker: mockUpdateServiceWorker,
    offlineReady: [false, noop] as [boolean, typeof noop],
  })),
}));

import { useRegisterSW } from 'virtual:pwa-register/react';

describe('UpdateBanner', () => {
  it('renders nothing when needRefresh is false', () => {
    vi.mocked(useRegisterSW).mockReturnValue({
      needRefresh: [false, noop],
      updateServiceWorker: mockUpdateServiceWorker,
      offlineReady: [false, noop],
    });
    const { container } = render(<UpdateBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('shows the update banner when needRefresh is true', () => {
    vi.mocked(useRegisterSW).mockReturnValue({
      needRefresh: [true, noop],
      updateServiceWorker: mockUpdateServiceWorker,
      offlineReady: [false, noop],
    });
    render(<UpdateBanner />);
    expect(screen.getByText(/A new version/i)).toBeInTheDocument();
  });

  it('shows Update and Later buttons when needRefresh is true', () => {
    vi.mocked(useRegisterSW).mockReturnValue({
      needRefresh: [true, noop],
      updateServiceWorker: mockUpdateServiceWorker,
      offlineReady: [false, noop],
    });
    render(<UpdateBanner />);
    expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /later/i })).toBeInTheDocument();
  });

  it('hides the banner after clicking Later', () => {
    vi.mocked(useRegisterSW).mockReturnValue({
      needRefresh: [true, noop],
      updateServiceWorker: mockUpdateServiceWorker,
      offlineReady: [false, noop],
    });
    render(<UpdateBanner />);
    fireEvent.click(screen.getByRole('button', { name: /later/i }));
    expect(screen.queryByText(/A new version/i)).not.toBeInTheDocument();
  });

  it('calls updateServiceWorker when Update is clicked', () => {
    vi.mocked(useRegisterSW).mockReturnValue({
      needRefresh: [true, noop],
      updateServiceWorker: mockUpdateServiceWorker,
      offlineReady: [false, noop],
    });
    render(<UpdateBanner />);
    fireEvent.click(screen.getByRole('button', { name: /update/i }));
    expect(mockUpdateServiceWorker).toHaveBeenCalledWith(true);
  });
});
