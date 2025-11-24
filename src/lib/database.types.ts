export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          nome: string
          email: string
          semana_gestacional: number
          data_diagnostico: string | null
          tipo_diabetes: 'DMG' | 'PRE_EXISTENTE'
          data_parto_prevista: string | null
          meta_jejum: number
          meta_pos_prandial: number
          observacoes: string | null
          configuracoes: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          nome: string
          email: string
          semana_gestacional?: number
          data_diagnostico?: string | null
          tipo_diabetes?: 'DMG' | 'PRE_EXISTENTE'
          data_parto_prevista?: string | null
          meta_jejum?: number
          meta_pos_prandial?: number
          observacoes?: string | null
          configuracoes?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          email?: string
          semana_gestacional?: number
          data_diagnostico?: string | null
          tipo_diabetes?: 'DMG' | 'PRE_EXISTENTE'
          data_parto_prevista?: string | null
          meta_jejum?: number
          meta_pos_prandial?: number
          observacoes?: string | null
          configuracoes?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      registros_glicemicos: {
        Row: {
          id: string
          usuario_id: string
          valor_glicemia: number
          tipo_medicao: 'JEJUM' | 'POS_CAFE' | 'POS_ALMOCO' | 'POS_JANTAR'
          data_hora: string
          observacoes: string | null
          alimentos_consumidos: Json | null
          atividade_fisica: Json | null
          medicamentos: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          valor_glicemia: number
          tipo_medicao: 'JEJUM' | 'POS_CAFE' | 'POS_ALMOCO' | 'POS_JANTAR'
          data_hora: string
          observacoes?: string | null
          alimentos_consumidos?: Json | null
          atividade_fisica?: Json | null
          medicamentos?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          valor_glicemia?: number
          tipo_medicao?: 'JEJUM' | 'POS_CAFE' | 'POS_ALMOCO' | 'POS_JANTAR'
          data_hora?: string
          observacoes?: string | null
          alimentos_consumidos?: Json | null
          atividade_fisica?: Json | null
          medicamentos?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      configuracoes_lembretes: {
        Row: {
          id: string
          usuario_id: string
          lembretes_ativados: boolean
          jejum_ativado: boolean
          jejum_horario: string
          pos_cafe_ativado: boolean
          pos_cafe_horario: string
          pos_almoco_ativado: boolean
          pos_almoco_horario: string
          pos_jantar_ativado: boolean
          pos_jantar_horario: string
          som_notificacao: boolean
          vibracao: boolean
          intervalo_entre_lembretes: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          lembretes_ativados?: boolean
          jejum_ativado?: boolean
          jejum_horario?: string
          pos_cafe_ativado?: boolean
          pos_cafe_horario?: string
          pos_almoco_ativado?: boolean
          pos_almoco_horario?: string
          pos_jantar_ativado?: boolean
          pos_jantar_horario?: string
          som_notificacao?: boolean
          vibracao?: boolean
          intervalo_entre_lembretes?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          lembretes_ativados?: boolean
          jejum_ativado?: boolean
          jejum_horario?: string
          pos_cafe_ativado?: boolean
          pos_cafe_horario?: string
          pos_almoco_ativado?: boolean
          pos_almoco_horario?: string
          pos_jantar_ativado?: boolean
          pos_jantar_horario?: string
          som_notificacao?: boolean
          vibracao?: boolean
          intervalo_entre_lembretes?: number
          created_at?: string
          updated_at?: string
        }
      }
      backups: {
        Row: {
          id: string
          usuario_id: string
          tipo_backup: 'MANUAL' | 'AUTOMATICO'
          status: 'PENDENTE' | 'SUCESSO' | 'ERRO'
          dados_backup: Json | null
          checksum: string | null
          tamanho_bytes: number | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          usuario_id: string
          tipo_backup?: 'MANUAL' | 'AUTOMATICO'
          status?: 'PENDENTE' | 'SUCESSO' | 'ERRO'
          dados_backup?: Json | null
          checksum?: string | null
          tamanho_bytes?: number | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          usuario_id?: string
          tipo_backup?: 'MANUAL' | 'AUTOMATICO'
          status?: 'PENDENTE' | 'SUCESSO' | 'ERRO'
          dados_backup?: Json | null
          checksum?: string | null
          tamanho_bytes?: number | null
          created_at?: string
          completed_at?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          usuario_id: string
          tipo: 'LEMBRETE_MEDICAO' | 'ALERTA_GLICEMIA' | 'RELATORIO_PRONTO' | 'BACKUP_CONCLUIDO'
          titulo: string
          mensagem: string
          lida: boolean
          dados_adicionais: Json | null
          agendada_para: string | null
          created_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          tipo: 'LEMBRETE_MEDICAO' | 'ALERTA_GLICEMIA' | 'RELATORIO_PRONTO' | 'BACKUP_CONCLUIDO'
          titulo: string
          mensagem: string
          lida?: boolean
          dados_adicionais?: Json | null
          agendada_para?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          tipo?: 'LEMBRETE_MEDICAO' | 'ALERTA_GLICEMIA' | 'RELATORIO_PRONTO' | 'BACKUP_CONCLUIDO'
          titulo?: string
          mensagem?: string
          lida?: boolean
          dados_adicionais?: Json | null
          agendada_para?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}