import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock para react-router-dom
vi.mock('react-router-dom', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => vi.fn(() => null)(),
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/' }),
}));

// Mock para as stores
vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    user: null,
    isAuthenticated: false,
    login: vi.fn(),
    logout: vi.fn(),
  })
}));