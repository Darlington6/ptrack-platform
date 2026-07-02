import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── Mock heavy / environment-specific deps ──────────────────────────────────

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('@react-oauth/google', () => ({
  useGoogleLogin: () => vi.fn(),
}));

vi.mock('@sentry/react', () => ({
  setUser: vi.fn(),
}));

const mockLogin = vi.fn();
const mockGoogleLogin = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    googleLogin: mockGoogleLogin,
    user: null,
    isLoading: false,
    logout: vi.fn(),
    register: vi.fn(),
    refreshUser: vi.fn(),
    setUser: vi.fn(),
  }),
}));

// ── Import component AFTER mocks ────────────────────────────────────────────
import Login from '../../pages/Login';
import { toast } from 'sonner';

// ── Helpers ─────────────────────────────────────────────────────────────────

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
}

const baseUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  full_name: 'Test User',
  sector: 'Kimironko',
  points: 0,
  role: 'citizen' as const,
  created_at: '2024-01-01T00:00:00Z',
  email_verified: true,
  phone_verified: false,
  has_completed_onboarding: true,
};

// ── Tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Login page', () => {
  it('renders identifier and password fields', () => {
    renderLogin();
    expect(screen.getByPlaceholderText(/youremail@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('renders the submit button', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('shows validation errors when submitted with empty fields', async () => {
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => {
      expect(screen.getByText('Email or phone is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('does not call login when fields are empty', async () => {
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => {
      expect(mockLogin).not.toHaveBeenCalled();
    });
  });

  it('navigates to /dashboard on successful login for an onboarded citizen', async () => {
    mockLogin.mockResolvedValueOnce({
      ...baseUser,
      role: 'citizen',
      has_completed_onboarding: true,
    });
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText(/youremail@example.com/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('navigates to /admin on successful login for an admin user', async () => {
    mockLogin.mockResolvedValueOnce({ ...baseUser, role: 'admin' });
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText(/youremail@example.com/i), {
      target: { value: 'admin@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'adminpass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });
  });

  it('shows an error toast on 401 response', async () => {
    const err = { response: { status: 401 } };
    mockLogin.mockRejectedValueOnce(err);
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText(/youremail@example.com/i), {
      target: { value: 'wrong@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'badpass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Incorrect email/phone or password.');
    });
  });

  it('shows a generic error toast on unexpected error', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Network error'));
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText(/youremail@example.com/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'somepass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Login failed. Please try again.');
    });
  });
});
