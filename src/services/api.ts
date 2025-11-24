import { useAuthStore } from '@/stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Add auth headers if available, but don't override Content-Type for FormData
    const headers = { ...useAuthStore.getState().getAuthHeaders() };
    
    // Only add custom headers if not FormData (which needs browser to set Content-Type with boundary)
    if (!(options.body instanceof FormData)) {
      Object.assign(headers, options.headers);
    } else {
      // For FormData, only add Authorization header, let browser handle Content-Type
      if (options.headers && typeof options.headers === 'object') {
        const customHeaders = options.headers as Record<string, string>;
        if (customHeaders['Authorization']) {
          headers['Authorization'] = customHeaders['Authorization'];
        }
      }
    }

    try {
      console.log('Making request to:', url);
      console.log('Request options:', {
        method: options.method || 'GET',
        headers: headers,
        body: options.body instanceof FormData ? 'FormData' : options.body
      });
      
      const response = await fetch(url, {
        ...options,
        headers,
      });
      
      console.log('Response status:', response.status);

      // Handle token expiry
      if (response.status === 401) {
        const { logout } = useAuthStore.getState();
        logout();
        window.location.href = '/login';
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
        throw new Error(errorData.message || `Erro ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro de conexão com o servidor');
    }
  }

  private async requestBlob(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: Blob; contentType: string }> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Add auth headers if available
    const headers = {
      ...useAuthStore.getState().getAuthHeaders(),
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle token expiry
      if (response.status === 401) {
        const { logout } = useAuthStore.getState();
        logout();
        window.location.href = '/login';
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
        throw new Error(errorData.message || `Erro ${response.status}`);
      }

      const blob = await response.blob();
      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      
      return { data: blob, contentType };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro de conexão com o servidor');
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(name: string, email: string, password: string) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  async refreshToken(refreshToken: string) {
    return this.request('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  async logout() {
    const { tokens } = useAuthStore.getState();
    if (tokens?.refreshToken) {
      return this.request('/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });
    }
  }

  async forgotPassword(email: string) {
    return this.request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string) {
    return this.request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  // User endpoints
  async getProfile() {
    return this.request('/api/users/profile');
  }

  async updateProfile(userData: Partial<{ name: string; email: string }>) {
    return this.request('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request('/api/users/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Sheets endpoints
  async uploadSheet(file: File) {
    console.log('apiService.uploadSheet called with file:', {
      name: file.name,
      type: file.type,
      size: file.size
    });
    
    const formData = new FormData();
    formData.append('file', file);
    
    console.log('FormData created, calling request...');

    const authHeaders = useAuthStore.getState().getAuthHeaders();
    console.log('Auth headers:', authHeaders);
    
    return this.request('/api/sheets/upload', {
      method: 'POST',
      body: formData,
      // Don't set Content-Type for FormData - browser will set it with boundary
      headers: {
        'Authorization': authHeaders.Authorization,
      },
    });
  }

  async getSheets(page = 1, limit = 10) {
    return this.request(`/api/sheets?page=${page}&limit=${limit}`);
  }

  async getSheet(id: string) {
    return this.request(`/api/sheets/${id}`);
  }

  async deleteSheet(id: string) {
    return this.request(`/api/sheets/${id}`, {
      method: 'DELETE',
    });
  }

  // Analytics endpoints
  async getAnalytics(sheetId: string) {
    return this.request(`/api/analytics/${sheetId}`);
  }

  async generateInsights(sheetId: string) {
    return this.request(`/api/analytics/${sheetId}/insights`, {
      method: 'POST',
    });
  }

  async getChartRecommendations(sheetId: string) {
    return this.request(`/api/analytics/${sheetId}/charts`, {
      method: 'POST',
    });
  }

  // Processed data endpoints
  async getProcessedData(sheetId: string) {
    return this.request(`/api/processed-data/${sheetId}`);
  }

  async exportData(sheetId: string, format: 'csv' | 'json' | 'pdf') {
    return this.requestBlob(`/api/processed-data/${sheetId}/export?format=${format}`);
  }

  // Subscription endpoints
  async getSubscription() {
    return this.request('/api/subscriptions');
  }

  async createCheckoutSession(plan: 'premium') {
    return this.request('/api/subscriptions/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    });
  }

  async cancelSubscription() {
    return this.request('/api/subscriptions/cancel', {
      method: 'POST',
    });
  }

  async createFoodItem(payload: {
    nome: string;
    serving_size_g: number;
    categoria?: string;
    energia_kcal?: number;
    proteina_g?: number;
    gordura_g?: number;
    carboidrato_g?: number;
    ferro_mg?: number;
    folato_ug?: number;
    calcio_mg?: number;
    barcode?: string;
  }) {
    return this.request('/api/nutrition/food', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async searchFoodItems(q: string, limit = 20) {
    return this.request(`/api/nutrition/food/search?q=${encodeURIComponent(q)}&limit=${limit}`);
  }

  async createMeal(payload: {
    usuario_id: string;
    entries: { food_id: number; quantity_servings: number }[];
    data_refeicao: string;
    hora_refeicao: string;
    observacoes?: string;
  }) {
    return this.request('/api/nutrition/meal', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getDailySummary(userId: string, date: string) {
    return this.request(`/api/nutrition/daily-summary/${userId}?date=${encodeURIComponent(date)}`);
  }

  async createHydration(payload: { usuario_id: string; volume_ml: number; data_registro: string; hora_registro: string }) {
    return this.request('/api/nutrition/hydration', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getHydration(userId: string, date: string) {
    return this.request(`/api/nutrition/hydration/${userId}?date=${encodeURIComponent(date)}`);
  }

  async seedFoodItems() {
    return this.request('/api/nutrition/seed', {
      method: 'POST',
    });
  }

  async getConsents(userId: string) {
    return this.request(`/api/privacy/consent/${userId}`);
  }

  async setConsents(payload: { userId: string; privacyAccepted?: boolean; termsAccepted?: boolean; dataSharing?: boolean; version?: string }) {
    return this.request('/api/privacy/consent', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async exportPersonalData(userId: string) {
    return this.requestBlob(`/api/privacy/export/${userId}`);
  }

  async deleteAccount(userId: string) {
    return this.request(`/api/privacy/account/${userId}`, { method: 'DELETE' });
  }

  async getAuditLogs(userId: string, limit = 10, startDate?: string, endDate?: string, offset = 0, action?: string) {
    const params = new URLSearchParams()
    params.set('limit', String(limit))
    params.set('offset', String(offset))
    if (startDate && endDate) {
      params.set('startDate', startDate)
      params.set('endDate', endDate)
    }
    if (action && action !== 'ALL') {
      params.set('action', action)
    }
    return this.request(`/api/privacy/audit/${userId}?${params.toString()}`);
  }

  async getDoctorReport(userId: string, startDate: string, endDate: string) {
    return this.requestBlob(`/api/reports/doctor/${userId}?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`)
  }
}

export const apiService = new ApiService();

// Auto refresh token setup
export const setupTokenRefresh = () => {
  const refreshTokenIfNeeded = async () => {
    const { tokens, logout } = useAuthStore.getState();
    
    if (!tokens?.refreshToken) return;
    
    if (useAuthStore.getState().isTokenExpired()) {
      try {
        const response = await apiService.refreshToken(tokens.refreshToken);
        useAuthStore.getState().updateTokens((response as any).tokens);
      } catch (error) {
        logout();
        window.location.href = '/login';
      }
    }
  };

  // Check every 5 minutes
  setInterval(refreshTokenIfNeeded, 300000);
  
  // Check immediately
  refreshTokenIfNeeded();
};

export default apiService;