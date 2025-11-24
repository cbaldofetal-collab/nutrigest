import { API_BASE_URL } from '../config/api';

export interface GlucoseRecord {
  id?: number;
  usuario_id: string;
  valor_glicemia: number;
  tipo_jejum: 'jejum' | 'pos-prandial';
  data_medicao: string;
  hora_medicao: string;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GlucoseStatistics {
  total_registros: number;
  media_glicemia: number;
  min_glicemia: number;
  max_glicemia: number;
  total_jejum: number;
  total_pos_prandial: number;
  media_jejum: number;
  media_pos_prandial: number;
}

class GlucoseService {
  private baseUrl = `${API_BASE_URL}/glucose`;

  // Converter tipo do frontend para API
  private convertToApiType(record: any): Omit<GlucoseRecord, 'id' | 'created_at' | 'updated_at'> {
    return {
      usuario_id: record.usuario_id,
      valor_glicemia: record.valor_glicemia,
      tipo_jejum: record.tipo_jejum || record.tipo_medicao || 'jejum',
      data_medicao: record.data_medicao,
      hora_medicao: record.hora_medicao,
      observacoes: record.observacoes
    };
  }

  // Converter tipo da API para frontend
  public convertFromApiType(record: GlucoseRecord): any {
    return {
      id: record.id,
      usuario_id: record.usuario_id,
      valor_glicemia: record.valor_glicemia,
      tipo_medicao: record.tipo_jejum,
      data_medicao: record.data_medicao,
      hora_medicao: record.hora_medicao,
      observacoes: record.observacoes,
      created_at: record.created_at,
      updated_at: record.updated_at
    };
  }

  // Criar registro de glicemia
  async createGlucoseRecord(record: Omit<GlucoseRecord, 'id' | 'created_at' | 'updated_at'>): Promise<any> {
    const apiRecord = this.convertToApiType(record);
    
    const response = await fetch(`${this.baseUrl}/glucose-records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiRecord),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao criar registro de glicemia');
    }

    const data = await response.json();
    return this.convertFromApiType(data.data);
  }

  // Obter registros de glicemia
  async getGlucoseRecords(userId: string, options?: { limit?: number; offset?: number; startDate?: string; endDate?: string }): Promise<GlucoseRecord[]> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);

    const response = await fetch(`${this.baseUrl}/glucose-records/${userId}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao buscar registros de glicemia');
    }

    const data = await response.json();
    return data.data;
  }

  // Obter registro específico
  async getGlucoseRecordById(recordId: number): Promise<GlucoseRecord> {
    const response = await fetch(`${this.baseUrl}/glucose-records/record/${recordId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao buscar registro de glicemia');
    }

    const data = await response.json();
    return data.data;
  }

  // Atualizar registro
  async updateGlucoseRecord(recordId: number, updates: Partial<GlucoseRecord>): Promise<void> {
    const response = await fetch(`${this.baseUrl}/glucose-records/${recordId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao atualizar registro de glicemia');
    }
  }

  // Deletar registro
  async deleteGlucoseRecord(recordId: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/glucose-records/${recordId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao deletar registro de glicemia');
    }
  }

  // Obter estatísticas
  async getGlucoseStatistics(userId: string, options?: { startDate?: string; endDate?: string }): Promise<GlucoseStatistics> {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);

    const response = await fetch(`${this.baseUrl}/glucose-statistics/${userId}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao buscar estatísticas de glicemia');
    }

    const data = await response.json();
    return data.data;
  }

  // Gerar relatório PDF
  async generateGlucoseReport(userId: string, options?: { startDate?: string; endDate?: string }): Promise<Blob> {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);

    const response = await fetch(`${this.baseUrl}/glucose-report/${userId}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao gerar relatório PDF');
    }

    return response.blob();
  }

  // Criar ou atualizar usuário
  async createUser(userData: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao criar usuário');
    }

    const data = await response.json();
    return data.data;
  }

  // Obter usuário
  async getUser(userId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/users/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao buscar usuário');
    }

    const data = await response.json();
    return data.data;
  }
}

export const glucoseService = new GlucoseService();