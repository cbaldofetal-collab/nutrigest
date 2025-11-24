import { create } from 'zustand';
import { supabase, subscribeToGlucoseRecords } from '../lib/supabase';
import { glucoseService } from '../services/glucoseService';
import { useAuthStore } from './authStore';
import type { GlucoseRecord, MeasurementType, GlucoseStats } from '../types/glicogest.types';

interface GlucoseStore {
  records: GlucoseRecord[];
  stats: GlucoseStats | null;
  isLoading: boolean;
  error: string | null;
  subscription: any | null;

  // Actions
  loadRecords: (userId: string, limit?: number) => Promise<void>;
  loadRecordsByDateRange: (userId: string, startDate: string, endDate: string) => Promise<void>;
  addRecord: (record: Omit<GlucoseRecord, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateRecord: (id: string, updates: Partial<GlucoseRecord>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  calculateStats: (userId: string, days?: number) => Promise<void>;
  subscribeToUpdates: (userId: string) => void;
  unsubscribe: () => void;
  clearError: () => void;
}

export const useGlucoseStore = create<GlucoseStore>()((set, get) => ({
  records: [],
  stats: null,
  isLoading: false,
  error: null,
  subscription: null,

  loadRecords: async (userId: string, limit = 100) => {
    set({ isLoading: true, error: null });
    try {
      const records = await glucoseService.getGlucoseRecords(userId, { limit });
      // Convert from API type to frontend type
      const frontendRecords = records.map(record => glucoseService.convertFromApiType(record));
      set({ records: frontendRecords, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  loadRecordsByDateRange: async (userId: string, startDate: string, endDate: string) => {
    set({ isLoading: true, error: null });
    try {
      const records = await glucoseService.getGlucoseRecords(userId, { startDate, endDate });
      // Convert from API type to frontend type
      const frontendRecords = records.map(record => glucoseService.convertFromApiType(record));
      set({ records: frontendRecords, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addRecord: async (record: Omit<GlucoseRecord, 'id' | 'created_at' | 'updated_at'>) => {
    set({ isLoading: true, error: null });
    try {
      // Convert frontend measurement type to backend type
      const tipoJejum: 'jejum' | 'pos-prandial' = record.tipo_medicao === 'JEJUM' ? 'jejum' : 'pos-prandial';
      
      // Add tipo_jejum field if missing
      const apiRecord = {
        ...record,
        tipo_jejum: tipoJejum
      };
      const newRecord = await glucoseService.createGlucoseRecord(apiRecord);
      // Convert from API type to frontend type
      const frontendRecord = glucoseService.convertFromApiType(newRecord);
      
      set(state => ({ 
        records: [frontendRecord, ...state.records],
        isLoading: false 
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateRecord: async (id: string, updates: Partial<GlucoseRecord>) => {
    set({ isLoading: true, error: null });
    try {
      // Convert frontend type to API type
      const apiUpdates = glucoseService.convertToApiType(updates);
      
      // Use real API instead of Supabase mock
      await glucoseService.updateGlucoseRecord(id, apiUpdates);
      
      // Reload records to ensure consistency
      const { user } = useAuthStore.getState();
      if (user?.id) {
        await get().loadRecords(user.id, 100);
      }
      
      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deleteRecord: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      // Use real API instead of Supabase mock
      await glucoseService.deleteGlucoseRecord(id);
      
      // Remove from local state
      set(state => ({
        records: state.records.filter(record => record.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  calculateStats: async (userId: string, days = 30) => {
    set({ isLoading: true, error: null });
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split('T')[0];
      
      const statistics = await glucoseService.getGlucoseStatistics(userId, { startDate: startDateStr });
      
      // Converter para o formato esperado pelo frontend
      const stats: GlucoseStats = {
        total_registros: statistics.total_registros,
        percentual_na_meta: 0, // Será calculado abaixo
        media_geral: statistics.media_glicemia,
        registros_ultima_semana: 0, // Poderia ser calculado com dados mais recentes
        tendencia: 'estavel',
        registros_por_tipo: {
          JEJUM: { 
            total: statistics.total_jejum, 
            dentro_meta: 0, 
            percentual: 0 
          },
          POS_CAFE: { 
            total: 0, 
            dentro_meta: 0, 
            percentual: 0 
          },
          POS_ALMOCO: { 
            total: 0, 
            dentro_meta: 0, 
            percentual: 0 
          },
          POS_JANTAR: { 
            total: 0, 
            dentro_meta: 0, 
            percentual: 0 
          },
        },
      };
      
      // Distribuir registros pós-prandial entre os tipos
      const totalPosPrandial = statistics.total_pos_prandial;
      stats.registros_por_tipo.POS_CAFE.total = Math.floor(totalPosPrandial / 3);
      stats.registros_por_tipo.POS_ALMOCO.total = Math.floor(totalPosPrandial / 3);
      stats.registros_por_tipo.POS_JANTAR.total = totalPosPrandial - stats.registros_por_tipo.POS_CAFE.total - stats.registros_por_tipo.POS_ALMOCO.total;
      
      set({ stats, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  subscribeToUpdates: (userId: string) => {
    const { subscription } = get();
    if (subscription) {
      subscription.unsubscribe();
    }

    const newSubscription = subscribeToGlucoseRecords(userId, (payload) => {
      const { records } = get();
      
      switch (payload.eventType) {
        case 'INSERT':
          set({ records: [payload.new, ...records] });
          break;
        case 'UPDATE':
          set({
            records: records.map(record =>
              record.id === payload.new.id ? payload.new : record
            ),
          });
          break;
        case 'DELETE':
          set({
            records: records.filter(record => record.id !== payload.old.id),
          });
          break;
      }
    });

    set({ subscription: newSubscription });
  },

  unsubscribe: () => {
    const { subscription } = get();
    if (subscription) {
      subscription.unsubscribe();
      set({ subscription: null });
    }
  },

  clearError: () => {
    set({ error: null });
  },
  generatePDFReport: async (userId: string, options?: { startDate?: string; endDate?: string }) => {
    set({ isLoading: true, error: null });
    try {
      const pdfBlob = await glucoseService.generateGlucoseReport(userId, options);
      
      // Criar URL do blob e fazer download
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-glicemia-${userId}-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },
}));

// Helper function to calculate glucose statistics
function calculateGlucoseStats(records: GlucoseRecord[]): GlucoseStats {
  if (records.length === 0) {
    return {
      total_registros: 0,
      percentual_na_meta: 0,
      media_geral: 0,
      registros_ultima_semana: 0,
      tendencia: 'estavel',
      registros_por_tipo: {
        JEJUM: { total: 0, dentro_meta: 0, percentual: 0 },
        POS_CAFE: { total: 0, dentro_meta: 0, percentual: 0 },
        POS_ALMOCO: { total: 0, dentro_meta: 0, percentual: 0 },
        POS_JANTAR: { total: 0, dentro_meta: 0, percentual: 0 },
      },
    };
  }

  const totalRecords = records.length;
  const recordsInMeta = records.filter(r => r.dentro_meta).length;
  const averageGlucose = records.reduce((sum, r) => sum + r.valor_glicemia, 0) / totalRecords;

  // Calculate records by type
  const recordsByType = {
    JEJUM: { total: 0, dentro_meta: 0, percentual: 0 },
    POS_CAFE: { total: 0, dentro_meta: 0, percentual: 0 },
    POS_ALMOCO: { total: 0, dentro_meta: 0, percentual: 0 },
    POS_JANTAR: { total: 0, dentro_meta: 0, percentual: 0 },
  };

  records.forEach(record => {
    const type = record.tipo_medicao as MeasurementType;
    recordsByType[type].total++;
    if (record.dentro_meta) {
      recordsByType[type].dentro_meta++;
    }
  });

  // Calculate percentages
  Object.keys(recordsByType).forEach(type => {
    const typedType = type as MeasurementType;
    if (recordsByType[typedType].total > 0) {
      recordsByType[typedType].percentual = 
        (recordsByType[typedType].dentro_meta / recordsByType[typedType].total) * 100;
    }
  });

  // Calculate last week records
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  const lastWeekRecords = records.filter(r => new Date(r.data_medicao) >= lastWeek).length;

  // Simple trend calculation (compare first and second half)
  const sortedRecords = [...records].sort((a, b) => 
    new Date(a.data_medicao).getTime() - new Date(b.data_medicao).getTime()
  );
  const halfPoint = Math.floor(sortedRecords.length / 2);
  const firstHalfAvg = sortedRecords.slice(0, halfPoint).reduce((sum, r) => sum + r.valor_glicemia, 0) / halfPoint;
  const secondHalfAvg = sortedRecords.slice(halfPoint).reduce((sum, r) => sum + r.valor_glicemia, 0) / (sortedRecords.length - halfPoint);

  let tendencia: 'subindo' | 'descendo' | 'estavel' = 'estavel';
  const diff = Math.abs(secondHalfAvg - firstHalfAvg);
  if (diff > 10) {
    tendencia = secondHalfAvg > firstHalfAvg ? 'subindo' : 'descendo';
  }

  return {
    total_registros: totalRecords,
    percentual_na_meta: (recordsInMeta / totalRecords) * 100,
    media_geral: Math.round(averageGlucose * 10) / 10,
    registros_ultima_semana: lastWeekRecords,
    tendencia,
    registros_por_tipo: recordsByType,
  };
}