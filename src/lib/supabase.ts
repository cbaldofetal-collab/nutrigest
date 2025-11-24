// Mock Supabase implementation for demo mode
export const supabase = {
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    signInWithPassword: async () => ({ data: { user: { id: '1', email: 'demo@glicogest.com', user_metadata: { nome: 'Demo User', semana_gestacional: 24 } } }, error: null }),
    signUp: async () => ({ data: { user: { id: '1', email: 'demo@glicogest.com', user_metadata: {} } }, error: null }),
    signOut: async () => ({ error: null }),
  },
  from: (tableName: string) => {
    const createChainable = () => {
      const chainable = {
        _tableName: tableName,
        _single: false,
        select: (columns = '*') => chainable,
        insert: (data: any) => chainable,
        update: (data: any) => chainable,
        delete: () => chainable,
        eq: (column: string, value: any) => chainable,
        single: () => {
          chainable._single = true;
          return chainable;
        },
        order: (column: string, options = { ascending: true }) => chainable,
        limit: (count: number) => chainable,
        gte: (column: string, value: any) => chainable,
        lte: (column: string, value: any) => chainable,
        // Add data property that gets returned
        get data() { 
          if (chainable._tableName === 'profiles') {
            // Return single object for .single() calls, array for regular queries
            const profile = {
              id: '1',
              nome: 'Demo User',
              email: 'demo@glicogest.com',
              semana_gestacional: 24,
              meta_jejum: 95,
              meta_pos_prandial: 140,
              tipo_diabetes: 'DMG',
              biometria_ativada: false,
              configuracoes: {
                lembretes_ativados: true,
                backup_automatico: true,
                notificacoes_push: true,
                tema: 'claro'
              },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            return chainable._single ? profile : [profile];
          } else if (chainable._tableName === 'registros_glicemicos') {
            return [{
              id: '1',
              usuario_id: '1',
              valor_glicemia: 95,
              tipo_medicao: 'JEJUM',
              data_medicao: new Date().toISOString().split('T')[0],
              hora_medicao: '08:00',
              dentro_meta: true,
              notas: 'Exemplo de registro',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }];
          } else if (chainable._tableName === 'configuracoes_lembretes') {
            const settings = {
              id: '1',
              usuario_id: '1',
              lembretes_ativados: true,
              jejum_ativado: true,
              jejum_horario: '07:00',
              pos_cafe_ativado: true,
              pos_cafe_horario: '09:00',
              pos_almoco_ativado: true,
              pos_almoco_horario: '14:00',
              pos_jantar_ativado: true,
              pos_jantar_horario: '20:00',
              intervalo_entre_lembretes: 30,
              som_notificacao: true,
              vibracao: true,
              mensagem_personalizada: 'Hora de medir sua glicemia! 🩸',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            return chainable._single ? settings : [settings];
          }
          return [];
        },
        get error() { return null; }
      };
      return chainable;
    };
    return createChainable();
  }
};

// Authentication functions
export const getCurrentUser = async () => {
  return { 
    data: { 
      user: { 
        id: '1', 
        email: 'demo@glicogest.com',
        user_metadata: { 
          nome: 'Demo User', 
          semana_gestacional: 24,
          data_parto_prevista: '2024-12-31'
        }
      } 
    }, 
    error: null 
  };
};

export const signIn = async (email: string, password: string) => {
  return {
    data: { 
      user: { 
        id: '1', 
        email: 'demo@glicogest.com',
        user_metadata: { 
          nome: 'Demo User', 
          semana_gestacional: 24,
          data_parto_prevista: '2024-12-31'
        }
      } 
    },
    error: null
  };
};

export const signUp = async (email: string, password: string, userData?: any) => {
  return {
    data: { user: { id: '1', email } },
    error: null
  };
};

export const signOut = async () => {
  return { error: null };
};

// Utility functions for glucose monitoring
export const subscribeToGlucoseRecords = (userId: string, callback: (payload: any) => void) => {
  // Mock subscription - in real implementation this would connect to realtime
  setTimeout(() => {
    callback({
      eventType: 'INSERT',
      new: {
        id: '1',
        usuario_id: userId,
        valor_glicemia: 95,
        tipo_medicao: 'JEJUM',
        data_medicao: new Date().toISOString().split('T')[0],
        hora_medicao: '08:00',
        dentro_meta: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    });
  }, 1000);
  
  return { unsubscribe: () => {} };
};