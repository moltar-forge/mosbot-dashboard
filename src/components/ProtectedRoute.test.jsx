import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { useAuthStore } from '../stores/authStore';

// Mock the auth store
vi.mock('../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state when not initialized', () => {
    useAuthStore.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      isInitialized: false,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute />
      </MemoryRouter>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows loading state when loading', () => {
    useAuthStore.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      isInitialized: true,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute />
      </MemoryRouter>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('redirects to login when not authenticated', () => {
    useAuthStore.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      isInitialized: true,
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ProtectedRoute />
      </MemoryRouter>
    );

    // Should redirect to login
    expect(window.location.pathname).toBe('/login');
  });

  it('renders children when authenticated', () => {
    useAuthStore.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      isInitialized: true,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
