import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { API_BASE_URL } from '../config/api';
import type { UserProfile, AuthUser } from '../types/glicogest.types';

interface AuthState {
  user: AuthUser | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  pinAuthenticated: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (email: string, password: string, profileData: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setPinAuthenticated: (authenticated: boolean) => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  clearAuth: () => void;
  loginWithPin: (pin: string) => Promise<{ error?: string }>;
  hasPin: () => boolean;
  setPin: (pin: string) => Promise<void>;
  getAuthHeaders: () => { Authorization?: string };
  isTokenExpired: () => boolean;
  tokens?: { accessToken: string; refreshToken: string };
  updateTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  loadUserProfile: (userId: string) => Promise<void>;
  createUserProfile: (userId: string, profileData: any) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      isAuthenticated: false,
      isLoading: true,
      pinAuthenticated: false,

      login: async (email: string, password: string): Promise<{ error?: string }> => {
        set({ isLoading: true });
        try {
          const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          const result = await response.json();
          
          if (!response.ok) {
            set({ isLoading: false });
            return { error: result.error?.message || 'Erro ao fazer login' };
          }
          
          if (result.success && result.data) {
            const { user, tokens } = result.data;
            const authUser: AuthUser = {
              id: user.id,
              email: user.email,
              nome: user.name,
              semana_gestacional: 0,
              data_parto_prevista: undefined,
            };

            set({ 
              user: authUser, 
              isAuthenticated: true,
              isLoading: false,
              tokens
            });

            // Load user profile
            await get().loadUserProfile(user.id);
            return {};
          }
          
          return { error: 'Erro ao fazer login' };
        } catch (error) {
          set({ isLoading: false });
          return { error: error instanceof Error ? error.message : 'Erro ao fazer login' };
        }
      },

      register: async (email: string, password: string, profileData: any) => {
        set({ isLoading: true });
        try {
          const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email,
              password,
              name: profileData.nome,
            }),
          });

          const result = await response.json();
          
          if (!response.ok) {
            set({ isLoading: false });
            throw new Error(result.error?.message || 'Erro ao criar conta');
          }
          
          if (result.success && result.data) {
            const { user, tokens } = result.data;
            const authUser: AuthUser = {
              id: user.id,
              email: user.email,
              nome: user.name,
              semana_gestacional: profileData.semana_gestacional || 0,
              data_parto_prevista: profileData.data_parto_prevista,
            };

            set({ 
              user: authUser, 
              isAuthenticated: true,
              isLoading: false,
              tokens
            });

            // Create profile in database (without data_diagnostico and data_parto_prevista)
            const { data_diagnostico, data_parto_prevista, ...cleanProfileData } = profileData;
            await get().createUserProfile(user.id, cleanProfileData);
            await get().loadUserProfile(user.id);
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          const { tokens } = get();
          if (tokens?.accessToken) {
            await fetch(`${API_BASE_URL}/auth/logout`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokens.accessToken}`,
              },
            });
          }
          
          set({ 
            user: null, 
            profile: null, 
            isAuthenticated: false,
            pinAuthenticated: false,
            isLoading: false,
            tokens: undefined
          });
        } catch (error) {
          set({ isLoading: false });
          // Even if logout fails, clear local state
          set({ 
            user: null, 
            profile: null, 
            isAuthenticated: false,
            pinAuthenticated: false,
            isLoading: false,
            tokens: undefined
          });
        }
      },

      checkAuth: async () => {
        set({ isLoading: true });
        try {
          const { tokens } = get();
          if (!tokens?.accessToken) {
            set({ 
              user: null, 
              profile: null, 
              isAuthenticated: false,
              pinAuthenticated: false,
              isLoading: false 
            });
            return;
          }

          // Check if token is expired
          if (get().isTokenExpired()) {
            // Try to refresh token
            const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ refreshToken: tokens.refreshToken }),
            });

            if (refreshResponse.ok) {
              const refreshResult = await refreshResponse.json();
              if (refreshResult.success) {
                set({ tokens: refreshResult.data.tokens });
              }
            }
          }

          // For now, assume token is valid if we have it
          // In a real app, you'd validate with the server
          set({ isLoading: false });
        } catch (error) {
          set({ 
            user: null, 
            profile: null, 
            isAuthenticated: false,
            pinAuthenticated: false,
            isLoading: false,
            tokens: undefined
          });
        }
      },

      loadUserProfile: async (userId: string) => {
        try {
          const { tokens } = get();
          if (!tokens?.accessToken) return;

          const response = await fetch(`${API_BASE_URL}/user/profile/${userId}`, {
            headers: {
              'Authorization': `Bearer ${tokens.accessToken}`,
            },
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              set({ profile: result.data as UserProfile });
            }
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
      },

      createUserProfile: async (userId: string, profileData: any) => {
        try {
          const { tokens } = get();
          if (!tokens?.accessToken) return;

          const response = await fetch(`${API_BASE_URL}/user/profile`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${tokens.accessToken}`,
            },
            body: JSON.stringify({
              id: userId,
              nome: profileData.nome,
              email: profileData.email,
              semana_gestacional: profileData.semana_gestacional || 0,
              data_diagnostico: profileData.data_diagnostico,
              tipo_diabetes: profileData.tipo_diabetes || 'DMG',
              data_parto_prevista: profileData.data_parto_prevista,
              meta_jejum: 95,
              meta_pos_prandial: 140,
              configuracoes: {
                lembretes_ativados: true,
                backup_automatico: true,
                notificacoes_push: true,
                tema: 'sistema',
              },
            }),
          });

          if (!response.ok) {
            console.error('Error creating user profile:', await response.text());
          }
        } catch (error) {
          console.error('Error creating user profile:', error);
        }
      },

      setPinAuthenticated: (authenticated: boolean) => {
        set({ pinAuthenticated: authenticated });
      },

      updateProfile: async (updates: Partial<UserProfile>) => {
        const { user, tokens } = get();
        if (!user || !tokens?.accessToken) throw new Error('No authenticated user');

        try {
          const response = await fetch(`${API_BASE_URL}/user/profile/${user.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${tokens.accessToken}`,
            },
            body: JSON.stringify(updates),
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              set({ profile: result.data as UserProfile });
            }
          } else {
            throw new Error('Failed to update profile');
          }
        } catch (error) {
          console.error('Error updating profile:', error);
          throw error;
        }
      },

      clearAuth: () => {
        set({ 
          user: null, 
          profile: null, 
          isAuthenticated: false,
          pinAuthenticated: false,
          isLoading: false 
        });
      },

      loginWithPin: async (pin: string) => {
        const { user, profile } = get();
        if (!user || !profile) {
          return { error: 'Usuário não autenticado' };
        }

        try {
          // For biometric authentication, simulate success
          if (pin === 'biometric') {
            set({ pinAuthenticated: true });
            return {};
          }

          // Check if PIN is stored in profile settings
          if (profile.configuracoes?.pin_hash) {
            // Simple PIN comparison (in production, use proper hashing)
            if (profile.configuracoes.pin_hash === pin) {
              set({ pinAuthenticated: true });
              return {};
            } else {
              return { error: 'PIN incorreto' };
            }
          } else {
            // No PIN configured, allow access
            set({ pinAuthenticated: true });
            return {};
          }
        } catch (error) {
          return { error: 'Erro na autenticação com PIN' };
        }
      },

      hasPin: () => {
        const { profile } = get();
        return profile?.configuracoes?.pin_hash ? true : false;
      },

      setPin: async (pin: string) => {
        const { user } = get();
        if (!user) throw new Error('Usuário não autenticado');

        try {
          // In production, hash the PIN before storing
          const updates = {
            configuracoes: {
              ...get().profile?.configuracoes,
              pin_hash: pin,
            }
          };

          await get().updateProfile(updates);
        } catch (error) {
          console.error('Error setting PIN:', error);
          throw error;
        }
      },

      getAuthHeaders: () => {
        const { tokens } = get();
        if (tokens?.accessToken) {
          return { Authorization: `Bearer ${tokens.accessToken}` };
        }
        return {};
      },

      isTokenExpired: () => {
        const { tokens } = get();
        if (!tokens?.accessToken) return true;
        
        try {
          const payload = JSON.parse(atob(tokens.accessToken.split('.')[1]));
          return payload.exp * 1000 < Date.now();
        } catch {
          return true;
        }
      },

      updateTokens: (tokens: { accessToken: string; refreshToken: string }) => {
        set({ tokens });
      },
    }),
    {
      name: 'glicogest-auth',
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        isAuthenticated: state.isAuthenticated,
        pinAuthenticated: state.pinAuthenticated,
      }),
    }
  )
);