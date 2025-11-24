import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';
import { useGlucoseStore } from './glucoseStore';
import { useReminderStore } from './reminderStore';
import { toast } from 'sonner';

export interface BackupData {
  version: string;
  timestamp: string;
  userId: string;
  profile: any;
  glucoseRecords: any[];
  reminders: any[];
  settings: any;
}

interface BackupState {
  isBackingUp: boolean;
  isRestoring: boolean;
  lastBackup: Date | null;
  
  // Actions
  createBackup: () => Promise<BackupData>;
  restoreFromBackup: (backupData: BackupData) => Promise<void>;
  exportToFile: (backupData: BackupData) => void;
  importFromFile: (file: File) => Promise<BackupData>;
  scheduleAutoBackup: () => void;
  encryptBackup: (data: BackupData) => string;
  decryptBackup: (encryptedData: string) => BackupData;
}

export const useBackupStore = create<BackupState>()(
  (set, get) => ({
    isBackingUp: false,
    isRestoring: false,
    lastBackup: null,

    createBackup: async () => {
      const { user, profile } = useAuthStore.getState();
      const { records: glucoseRecords } = useGlucoseStore.getState();
      const { reminders } = useReminderStore.getState();

      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      set({ isBackingUp: true });

      try {
        const backupData: BackupData = {
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          userId: user.id,
          profile: profile,
          glucoseRecords: glucoseRecords,
          reminders: reminders,
          settings: {
            language: localStorage.getItem('language') || 'pt-BR',
            theme: localStorage.getItem('theme') || 'light',
            accessibility: JSON.parse(localStorage.getItem('accessibility') || '{}'),
          }
        };

        // Store backup metadata in database
        const { error } = await (supabase as any)
          .from('backups')
          .insert({
            user_id: user.id,
            backup_data: backupData,
            created_at: backupData.timestamp,
            file_size: JSON.stringify(backupData).length,
          });

        if (error) throw error;

        set({ lastBackup: new Date() });
        toast.success('Backup criado com sucesso!');
        
        return backupData;
      } catch (error) {
        console.error('Error creating backup:', error);
        toast.error('Erro ao criar backup');
        throw error;
      } finally {
        set({ isBackingUp: false });
      }
    },

    restoreFromBackup: async (backupData: BackupData) => {
      const { user } = useAuthStore.getState();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      if (backupData.userId !== user.id) {
        throw new Error('Backup pertence a outro usuário');
      }

      set({ isRestoring: true });

      try {
        // Validate backup version
        if (backupData.version !== '1.0.0') {
          throw new Error('Versão do backup não suportada');
        }

        // Restore profile
        if (backupData.profile) {
          await useAuthStore.getState().updateProfile(backupData.profile);
        }

        // Restore glucose records
        if (backupData.glucoseRecords && backupData.glucoseRecords.length > 0) {
          // Clear existing records first
          await supabase
            .from('glucose_records')
            .delete()
            .eq('user_id', user.id);

          // Insert backup records
          const { error: glucoseError } = await (supabase as any)
            .from('glucose_records')
            .insert(backupData.glucoseRecords.map(record => ({
              ...record,
              id: undefined, // Let database generate new IDs
              created_at: record.created_at,
              updated_at: new Date().toISOString(),
            })));

          if (glucoseError) throw glucoseError;
        }

        // Restore reminders
        if (backupData.reminders && backupData.reminders.length > 0) {
          // Clear existing reminders first
          await supabase
            .from('reminders')
            .delete()
            .eq('user_id', user.id);

          // Insert backup reminders
          const { error: reminderError } = await (supabase as any)
            .from('reminders')
            .insert(backupData.reminders.map(reminder => ({
              ...reminder,
              id: undefined, // Let database generate new IDs
              created_at: reminder.created_at,
              updated_at: new Date().toISOString(),
            })));

          if (reminderError) throw reminderError;
        }

        // Restore settings
        if (backupData.settings) {
          if (backupData.settings.language) {
            localStorage.setItem('language', backupData.settings.language);
          }
          if (backupData.settings.theme) {
            localStorage.setItem('theme', backupData.settings.theme);
          }
          if (backupData.settings.accessibility) {
            localStorage.setItem('accessibility', JSON.stringify(backupData.settings.accessibility));
          }
        }

        // Reload stores
        await useAuthStore.getState().checkAuth();
        await useGlucoseStore.getState().loadRecords(user.id);
        // Reminders are loaded automatically when auth is checked

        toast.success('Dados restaurados com sucesso!');
      } catch (error) {
        console.error('Error restoring backup:', error);
        toast.error('Erro ao restaurar backup');
        throw error;
      } finally {
        set({ isRestoring: false });
      }
    },

    exportToFile: (backupData: BackupData) => {
      try {
        const encryptedData = get().encryptBackup(backupData);
        const blob = new Blob([encryptedData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const date = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
        const filename = `glicogest-backup-${date}.json`;
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success('Backup exportado com sucesso!');
      } catch (error) {
        console.error('Error exporting backup:', error);
        toast.error('Erro ao exportar backup');
        throw error;
      }
    },

    importFromFile: async (file: File): Promise<BackupData> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            const backupData = get().decryptBackup(content);
            
            // Validate backup structure
            if (!backupData.version || !backupData.timestamp || !backupData.userId) {
              throw new Error('Arquivo de backup inválido');
            }
            
            resolve(backupData);
          } catch (error) {
            reject(new Error('Erro ao ler arquivo de backup'));
          }
        };
        
        reader.onerror = () => {
          reject(new Error('Erro ao ler arquivo'));
        };
        
        reader.readAsText(file);
      });
    },

    scheduleAutoBackup: () => {
      // Check if auto-backup is enabled
      const autoBackupEnabled = localStorage.getItem('autoBackupEnabled') === 'true';
      if (!autoBackupEnabled) return;

      const lastBackup = localStorage.getItem('lastAutoBackup');
      const now = new Date().getTime();
      const dayInMs = 24 * 60 * 60 * 1000;
      
      // Create backup if more than 24 hours have passed
      if (!lastBackup || (now - parseInt(lastBackup)) > dayInMs) {
        get().createBackup().then(() => {
          localStorage.setItem('lastAutoBackup', now.toString());
        }).catch(error => {
          console.error('Auto-backup failed:', error);
        });
      }
    },

    encryptBackup: (data: BackupData): string => {
      // Simple encryption for now - in production, use proper encryption
      const jsonString = JSON.stringify(data);
      return btoa(jsonString); // Base64 encoding
    },

    decryptBackup: (encryptedData: string): BackupData => {
      try {
        // Simple decryption - in production, use proper decryption
        const jsonString = atob(encryptedData); // Base64 decoding
        return JSON.parse(jsonString);
      } catch (error) {
        throw new Error('Falha ao descriptografar backup');
      }
    },
  })
);