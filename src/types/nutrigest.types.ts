// Tipos principais do NutriGest

export interface UserProfile {
  id: string;
  nome: string;
  email: string;
  semana_gestacional: number;
  data_diagnostico?: string;
  tipo_diabetes: 'DMG' | 'PRE_EXISTENTE';
  data_parto_prevista?: string;
  meta_jejum: number;
  meta_pos_prandial: number;
  observacoes?: string;
  pin_hash?: string;
  biometria_ativada: boolean;
  configuracoes: UserSettings;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  lembretes_ativados: boolean;
  backup_automatico: boolean;
  notificacoes_push: boolean;
  tema: 'claro' | 'escuro' | 'sistema';
  pin_hash?: string;
}

export interface GlucoseRecord {
  id: string;
  usuario_id: string;
  valor_glicemia: number;
  tipo_medicao: MeasurementType;
  data_medicao: string;
  hora_medicao: string;
  dentro_meta: boolean;
  notas?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export type MeasurementType = 'JEJUM' | 'POS_CAFE' | 'POS_ALMOCO' | 'POS_JANTAR';

export interface ReminderSettings {
  id: string;
  usuario_id: string;
  tipo_medicao?: MeasurementType;
  ativo?: boolean;
  horario?: string;
  dias_semana?: number[];
  mensagem_personalizada?: string;
  created_at: string;
  updated_at: string;
  // Additional fields used in the app
  lembretes_ativados?: boolean;
  jejum_ativado?: boolean;
  jejum_horario?: string;
  pos_cafe_ativado?: boolean;
  pos_cafe_horario?: string;
  pos_almoco_ativado?: boolean;
  pos_almoco_horario?: string;
  pos_jantar_ativado?: boolean;
  pos_jantar_horario?: string;
  som_notificacao?: boolean;
  vibracao?: boolean;
  intervalo_entre_lembretes?: number;
}

export interface Report {
  id: string;
  usuario_id: string;
  nome_arquivo: string;
  periodo_inicio: string;
  periodo_fim: string;
  dados_consolidados: ReportData;
  caminho_arquivo?: string;
  tipo_relatorio: 'COMPLETO' | 'SEMANAL' | 'MENSAL' | 'CUSTOMIZADO';
  created_at: string;
}

export interface ReportData {
  total_registros: number;
  percentual_na_meta: number;
  media_glicemia: number;
  valores_minimos: Record<MeasurementType, number>;
  valores_maximos: Record<MeasurementType, number>;
  valores_medios: Record<MeasurementType, number>;
  registros_por_tipo: Record<MeasurementType, number>;
  registros_dentro_meta: Record<MeasurementType, number>;
  tendencia_semanal: Array<{
    data: string;
    media: number;
    dentro_meta: number;
  }>;
}

export interface Backup {
  id: string;
  usuario_id: string;
  tipo_backup: 'MANUAL' | 'AUTOMATICO';
  status: 'PENDENTE' | 'SUCESSO' | 'ERRO';
  dados_backup?: any;
  checksum?: string;
  tamanho_bytes?: number;
  created_at: string;
  completed_at?: string;
}

export interface Notification {
  id: string;
  usuario_id: string;
  tipo: NotificationType;
  titulo: string;
  mensagem: string;
  lida: boolean;
  dados_adicionais?: any;
  agendada_para?: string;
  created_at: string;
}

export type NotificationType = 'LEMBRETE_MEDICAO' | 'ALERTA_GLICEMIA' | 'RELATORIO_PRONTO' | 'BACKUP_CONCLUIDO';

export interface GlucoseStats {
  total_registros: number;
  percentual_na_meta: number;
  media_geral: number;
  registros_ultima_semana: number;
  tendencia: 'subindo' | 'descendo' | 'estavel';
  registros_por_tipo: Record<MeasurementType, {
    total: number;
    dentro_meta: number;
    percentual: number;
  }>;
}

export interface MeasurementInput {
  valor_glicemia: number;
  tipo_medicao: MeasurementType;
  data_medicao?: string;
  hora_medicao?: string;
  notas?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  nome: string;
  semana_gestacional: number;
  data_parto_prevista?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface PinCredentials {
  pin: string;
}

export interface RegisterData {
  nome: string;
  email: string;
  password: string;
  semana_gestacional: number;
  data_diagnostico?: string;
  data_parto_prevista?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}