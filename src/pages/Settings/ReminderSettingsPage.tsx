import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Clock, Volume2, Smartphone, Save, ArrowLeft, Play } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useReminderStore } from '../../stores/reminderStore';

const ReminderSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { settings, loadSettings, updateSettings, isLoading } = useReminderStore();
  
  const [formData, setFormData] = useState({
    lembretes_ativados: true,
    jejum_ativado: true,
    jejum_horario: '07:00',
    pos_cafe_ativado: true,
    pos_cafe_horario: '08:00',
    pos_almoco_ativado: true,
    pos_almoco_horario: '13:00',
    pos_jantar_ativado: true,
    pos_jantar_horario: '19:00',
    som_notificacao: true,
    vibracao: true,
    mensagem_personalizada: 'Hora de medir sua glicemia! 🩸',
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      loadSettings(user.id);
    }
  }, [user, loadSettings]);

  useEffect(() => {
    if (settings) {
      setFormData({
        lembretes_ativados: settings.lembretes_ativados,
        jejum_ativado: settings.jejum_ativado,
        jejum_horario: settings.jejum_horario,
        pos_cafe_ativado: settings.pos_cafe_ativado,
        pos_cafe_horario: settings.pos_cafe_horario,
        pos_almoco_ativado: settings.pos_almoco_ativado,
        pos_almoco_horario: settings.pos_almoco_horario,
        pos_jantar_ativado: settings.pos_jantar_ativado,
        pos_jantar_horario: settings.pos_jantar_horario,
        som_notificacao: settings.som_notificacao,
        vibracao: settings.vibracao,
        mensagem_personalizada: settings.mensagem_personalizada || 'Hora de medir sua glicemia! 🩸',
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage('');

    try {
      await updateSettings(user.id, formData);
      setMessage('Configurações salvas com sucesso!');
      
      // Request notification permission if not already granted
      if (formData.lembretes_ativados) {
        const { requestNotificationPermission } = useReminderStore.getState();
        await requestNotificationPermission();
      }
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Erro ao salvar configurações. Tente novamente.');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const testNotification = async () => {
    try {
      const { requestNotificationPermission, scheduleNotification } = useReminderStore.getState();
      
      // Request permission if not granted
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        setMessage('Por favor, permita notificações para testar');
        setTimeout(() => setMessage(''), 3000);
        return;
      }

      // Test notification
      await scheduleNotification(
        'Teste de Notificação - Pós-almoço',
        formData.mensagem_personalizada || 'Hora de medir sua glicemia! 🩸',
        new Date()
      );

      setMessage('Notificação de teste enviada! Verifique sua barra de notificações.');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Erro ao testar notificação:', error);
      setMessage('Erro ao enviar notificação de teste');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Bell className="w-12 h-12 text-blue-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Configurações de Lembretes</h1>
          <div className="w-20"></div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Main Toggle */}
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center space-x-3">
                <Bell className="w-6 h-6 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Lembretes Ativados</h3>
                  <p className="text-sm text-gray-600">Receba notificações para medir sua glicemia</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.lembretes_ativados}
                  onChange={(e) => handleChange('lembretes_ativados', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {formData.lembretes_ativados && (
              <>
                {/* Notification Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <Volume2 className="w-5 h-5" />
                    <span>Configurações de Notificação</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Volume2 className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium">Som</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.som_notificacao}
                          onChange={(e) => handleChange('som_notificacao', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Smartphone className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium">Vibração</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.vibracao}
                          onChange={(e) => handleChange('vibracao', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Reminder Times */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>Horários dos Lembretes</span>
                  </h3>

                  {/* Jejum */}
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Jejum</h4>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.jejum_ativado}
                          onChange={(e) => handleChange('jejum_ativado', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    {formData.jejum_ativado && (
                      <input
                        type="time"
                        value={formData.jejum_horario}
                        onChange={(e) => handleChange('jejum_horario', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}
                  </div>

                  {/* Pós-café */}
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Pós-café</h4>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.pos_cafe_ativado}
                          onChange={(e) => handleChange('pos_cafe_ativado', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    {formData.pos_cafe_ativado && (
                      <input
                        type="time"
                        value={formData.pos_cafe_horario}
                        onChange={(e) => handleChange('pos_cafe_horario', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}
                  </div>

                  {/* Pós-almoço */}
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Pós-almoço</h4>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.pos_almoco_ativado}
                          onChange={(e) => handleChange('pos_almoco_ativado', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    {formData.pos_almoco_ativado && (
                      <input
                        type="time"
                        value={formData.pos_almoco_horario}
                        onChange={(e) => handleChange('pos_almoco_horario', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}
                  </div>

                  {/* Pós-jantar */}
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Pós-jantar</h4>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.pos_jantar_ativado}
                          onChange={(e) => handleChange('pos_jantar_ativado', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    {formData.pos_jantar_ativado && (
                      <input
                        type="time"
                        value={formData.pos_jantar_horario}
                        onChange={(e) => handleChange('pos_jantar_horario', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}
                  </div>
                </div>

                {/* Custom Message */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Mensagem Personalizada</h4>
                  <textarea
                    value={formData.mensagem_personalizada}
                    onChange={(e) => handleChange('mensagem_personalizada', e.target.value)}
                    placeholder="Digite sua mensagem personalizada..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                    maxLength={100}
                  />
                  <p className="text-sm text-gray-500">{formData.mensagem_personalizada.length}/100 caracteres</p>
                </div>
              </>
            )}

            {/* Message */}
            {message && (
              <div className={`p-3 rounded-lg text-center ${
                message.includes('sucesso') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {message}
              </div>
            )}

            {/* Test Button */}
            <button
              type="button"
              onClick={testNotification}
              className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-green-700 hover:to-teal-700 transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
            >
              <Play className="w-5 h-5" />
              <span>Testar Notificação</span>
            </button>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
            >
              <Save className="w-5 h-5" />
              <span>{saving ? 'Salvando...' : 'Salvar Configurações'}</span>
            </button>
          </form>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Dicas Importantes</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Configure horários que se adequem à sua rotina diária</li>
            <li>• Mantenha os lembretes ativados para melhor controle da glicemia</li>
            <li>• Personalize a mensagem para tornar os lembretes mais motivadores</li>
            <li>• Você pode desativar lembretes específicos mantendo apenas os essenciais</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReminderSettingsPage;