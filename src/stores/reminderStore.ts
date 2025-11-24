import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import type { ReminderSettings } from '../types/nutrigest.types';

interface ReminderState {
  settings: ReminderSettings | null;
  reminders: any[];
  isLoading: boolean;
  
  // Actions
  loadSettings: (userId: string) => Promise<void>;
  updateSettings: (userId: string, settings: Partial<ReminderSettings>) => Promise<void>;
  scheduleNotification: (title: string, body: string, trigger: Date) => Promise<void>;
  requestNotificationPermission: () => Promise<boolean>;
  checkNotificationPermission: () => Promise<boolean>;
  scheduleGlucoseReminders: (settings: ReminderSettings) => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
}

export const useReminderStore = create<ReminderState>()(
  persist(
    (set, get) => ({
      settings: null,
      reminders: [],
      isLoading: false,

      loadSettings: async (userId: string) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase
            .from('configuracoes_lembretes')
            .select('*')
            .eq('usuario_id', userId)
            .single();

          if (error && error.code !== 'PGRST116') {
            throw error;
          }

          if (data) {
            set({ settings: data as ReminderSettings });
          } else {
            // Create default settings if none exist
            const defaultSettings: ReminderSettings = {
              id: crypto.randomUUID(),
              usuario_id: userId,
              lembretes_ativados: true,
              jejum_ativado: true,
              jejum_horario: '07:00',
              pos_cafe_ativado: true,
              pos_cafe_horario: '08:00',
              pos_almoco_ativado: true,
              pos_almoco_horario: '13:00',
              pos_jantar_ativado: true,
              pos_jantar_horario: '19:00',
              intervalo_entre_lembretes: 30,
              som_notificacao: true,
              vibracao: true,
              mensagem_personalizada: 'Hora de medir sua glicemia! 🩸',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            const { error: insertError } = await (supabase as any)
              .from('configuracoes_lembretes')
              .insert(defaultSettings);

            if (insertError) throw insertError;
            set({ settings: defaultSettings });
          }
        } catch (error) {
          console.error('Error loading reminder settings:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      updateSettings: async (userId: string, settings: Partial<ReminderSettings>) => {
        const currentSettings = get().settings;
        if (!currentSettings) return;

        const updatedSettings = { ...currentSettings, ...settings, atualizado_em: new Date().toISOString() };
        
        try {
          const { error } = await (supabase as any)
            .from('configuracoes_lembretes')
            .update(updatedSettings)
            .eq('id', currentSettings.id);

          if (error) throw error;
          
          set({ settings: updatedSettings });
          
          // Reschedule reminders if settings changed
          if (settings.lembretes_ativados !== undefined || 
              settings.jejum_horario !== undefined ||
              settings.pos_cafe_horario !== undefined ||
              settings.pos_almoco_horario !== undefined ||
              settings.pos_jantar_horario !== undefined) {
            await get().scheduleGlucoseReminders(updatedSettings);
          }
        } catch (error) {
          console.error('Error updating reminder settings:', error);
          throw error;
        }
      },

      requestNotificationPermission: async () => {
        if (!('Notification' in window)) {
          console.warn('This browser does not support desktop notifications');
          return false;
        }

        try {
          const permission = await Notification.requestPermission();
          return permission === 'granted';
        } catch (error) {
          console.error('Error requesting notification permission:', error);
          return false;
        }
      },

      checkNotificationPermission: async () => {
        if (!('Notification' in window)) {
          return false;
        }
        return Notification.permission === 'granted';
      },

      scheduleNotification: async (title: string, body: string, trigger: Date) => {
        const hasPermission = await get().checkNotificationPermission();
        if (!hasPermission) {
          const granted = await get().requestNotificationPermission();
          if (!granted) return;
        }

        try {
          // Use the Web Notifications API
          const notification = new Notification(title, {
            body,
            icon: '/icon-192x192.png',
            badge: '/icon-72x72.png',
            // vibrate is not standard for Notification constructor
            tag: 'glucose-reminder',
            requireInteraction: true
            // actions is not supported in all browsers
          });

          // Vibrate using navigator.vibrate if available
          if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
          }

          notification.onclick = () => {
            window.focus();
            notification.close();
            // Navigate to measurement page
            window.location.href = '/add-measurement';
          };

          // Note: onaction is not supported in all browsers, using onclick instead
          // notification.onaction = (event) => {
          //   if (event.action === 'measure') {
          //     window.location.href = '/add-measurement';
          //   }
          //   notification.close();
          // };
        } catch (error) {
          console.error('Error scheduling notification:', error);
        }
      },

      scheduleGlucoseReminders: async (settings: ReminderSettings) => {
        if (!settings.lembretes_ativados) {
          return;
        }

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const reminderTimes = [
          { enabled: settings.jejum_ativado, time: settings.jejum_horario, type: 'Jejum' },
          { enabled: settings.pos_cafe_ativado, time: settings.pos_cafe_horario, type: 'Pós-café' },
          { enabled: settings.pos_almoco_ativado, time: settings.pos_almoco_horario, type: 'Pós-almoço' },
          { enabled: settings.pos_jantar_ativado, time: settings.pos_jantar_horario, type: 'Pós-jantar' },
        ];

        for (const reminder of reminderTimes) {
          if (!reminder.enabled) continue;

          const [hours, minutes] = reminder.time.split(':').map(Number);
          const reminderTime = new Date(today.getTime());
          reminderTime.setHours(hours, minutes, 0, 0);

          // If time has passed today, schedule for tomorrow
          if (reminderTime <= now) {
            reminderTime.setDate(reminderTime.getDate() + 1);
          }

          const message = settings.mensagem_personalizada || `Hora de medir sua glicemia! 🩸`;
          const title = `Lembrete de Glicemia - ${reminder.type}`;
          
          // Schedule the reminder
          const timeUntilReminder = reminderTime.getTime() - now.getTime();
          
          setTimeout(() => {
            get().scheduleNotification(title, message, reminderTime);
          }, timeUntilReminder);

          console.log(`Scheduled ${reminder.type} reminder for ${reminderTime.toLocaleString()}`);
        }
      },

      cancelAllNotifications: async () => {
        // In a real implementation, you would cancel scheduled notifications
        // For now, we'll just log that notifications were cancelled
        console.log('All glucose reminders cancelled');
      },
    }),
    {
      name: 'glicogest-reminders',
      partialize: (state) => ({
        settings: state.settings,
      }),
    }
  )
);