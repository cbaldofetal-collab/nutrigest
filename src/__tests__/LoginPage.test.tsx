import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/pages/Auth/LoginPage';

// Mock do react-router-dom
vi.mock('react-router-dom', () => ({
  Link: ({ children, to }) => <a href={to}>{children}</a>,
  useNavigate: () => vi.fn()
}));

// Mock do authStore
vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    login: vi.fn()
  })
}));

describe('LoginPage', () => {
  it('deve renderizar o formulário de login corretamente', () => {
    render(<LoginPage />);
    
    expect(screen.getByPlaceholderText('seu@email.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('deve mostrar o título e descrição corretos', () => {
    render(<LoginPage />);
    
    expect(screen.getByText('Bem-vindo de volta')).toBeInTheDocument();
    expect(screen.getByText('Entre na sua conta para acessar seus dashboards')).toBeInTheDocument();
  });

  it('deve ter link para cadastro', () => {
    render(<LoginPage />);
    
    expect(screen.getByText('Cadastre-se gratuitamente')).toBeInTheDocument();
  });
});