export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          nome: string
          email: string
          semana_gestacional: number | null
          data_diagnostico: string | null
          tipo_diabetes: string | null
          data_parto_prevista: string | null
          meta_jejum: number
          meta_pos_prandial: number
          pin_hash: string | null
          biometria_ativada: boolean
          configuracoes: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          nome: string
          email: string
          semana_gestacional?: number | null
          data_diagnostico?: string | null
          tipo_diabetes?: string | null
          data_parto_prevista?: string | null
          meta_jejum?: number
          meta_pos_prandial?: number
          pin_hash?: string | null
          biometria_ativada?: boolean
          configuracoes?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          email?: string
          semana_gestacional?: number | null
          data_diagnostico?: string | null
          tipo_diabetes?: string | null
          data_parto_prevista?: string | null
          meta_jejum?: number
          meta_pos_prandial?: number
          pin_hash?: string | null
          biometria_ativada?: boolean
          configuracoes?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      registros_glicemicos: {
        Row: {
          id: string
          usuario_id: string
          valor_glicemia: number
          tipo_medicao: string
          data_medicao: string
          hora_medicao: string
          dentro_meta: boolean
          notas: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          valor_glicemia: number
          tipo_medicao: string
          data_medicao?: string
          hora_medicao: string
          dentro_meta: boolean
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          valor_glicemia?: number
          tipo_medicao?: string
          data_medicao?: string
          hora_medicao?: string
          dentro_meta?: boolean
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "registros_glicemicos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      configuracoes_lembretes: {
        Row: {
          id: string
          usuario_id: string
          tipo_medicao: string
          ativo: boolean
          horario: string
          dias_semana: number[] | null
          mensagem_personalizada: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          tipo_medicao: string
          ativo?: boolean
          horario: string
          dias_semana?: number[] | null
          mensagem_personalizada?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          tipo_medicao?: string
          ativo?: boolean
          horario?: string
          dias_semana?: number[] | null
          mensagem_personalizada?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "configuracoes_lembretes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      relatorios: {
        Row: {
          id: string
          usuario_id: string
          nome_arquivo: string
          periodo_inicio: string
          periodo_fim: string
          dados_consolidados: Json
          caminho_arquivo: string | null
          tipo_relatorio: string
          created_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          nome_arquivo: string
          periodo_inicio: string
          periodo_fim: string
          dados_consolidados: Json
          caminho_arquivo?: string | null
          tipo_relatorio?: string
          created_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          nome_arquivo?: string
          periodo_inicio?: string
          periodo_fim?: string
          dados_consolidados?: Json
          caminho_arquivo?: string | null
          tipo_relatorio?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "relatorios_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      backups: {
        Row: {
          id: string
          usuario_id: string
          tipo_backup: string
          status: string
          dados_backup: Json | null
          checksum: string | null
          tamanho_bytes: number | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          usuario_id: string
          tipo_backup?: string
          status?: string
          dados_backup?: Json | null
          checksum?: string | null
          tamanho_bytes?: number | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          usuario_id?: string
          tipo_backup?: string
          status?: string
          dados_backup?: Json | null
          checksum?: string | null
          tamanho_bytes?: number | null
          created_at?: string
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "backups_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      notificacoes: {
        Row: {
          id: string
          usuario_id: string
          tipo: string
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
          tipo: string
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
          tipo?: string
          titulo?: string
          mensagem?: string
          lida?: boolean
          dados_adicionais?: Json | null
          agendada_para?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}