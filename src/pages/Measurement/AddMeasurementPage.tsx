import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { ArrowLeft, Plus, Target, Clock, Edit3, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { glucoseService } from '../../services/glucoseService';
import type { MeasurementType } from '../../types/glicogest.types';

const AddMeasurementPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  
  const [value, setValue] = useState('');
  const [type, setType] = useState<MeasurementType>('JEJUM');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isWithinTarget, setIsWithinTarget] = useState<boolean | null>(null);

  const measurementTypes = [
    { value: 'JEJUM', label: 'Jejum', icon: '🌅', description: 'Antes do café da manhã' },
    { value: 'POS_CAFE', label: 'Pós-Café', icon: '☕', description: '1h após o café' },
    { value: 'POS_ALMOCO', label: 'Pós-Almoço', icon: '🍽️', description: '1h após o almoço' },
    { value: 'POS_JANTAR', label: 'Pós-Jantar', icon: '🌙', description: '1h após o jantar' },
  ];

  // Função para converter tipo de medição para API
  const convertToApiType = (frontendType: MeasurementType): 'jejum' | 'pos-prandial' => {
    return frontendType === 'JEJUM' ? 'jejum' : 'pos-prandial';
  };

  useEffect(() => {
    // Auto-detect measurement type based on current time
    const currentHour = new Date().getHours();
    if (currentHour < 8) {
      setType('JEJUM');
    } else if (currentHour < 10) {
      setType('POS_CAFE');
    } else if (currentHour < 14) {
      setType('POS_ALMOCO');
    } else {
      setType('POS_JANTAR');
    }
  }, []);

  useEffect(() => {
    // Removido lógica de validação de meta - sem alertas
    setIsWithinTarget(null);
  }, [value, type, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !profile || !value) {
      toast.error('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const numericValue = parseInt(value);
    if (isNaN(numericValue) || numericValue < 20 || numericValue > 600) {
      toast.error('Valor de glicemia inválido. Deve estar entre 20 e 600 mg/dL.');
      return;
    }

    setIsLoading(true);

    try {
      // Converter tipo de medição para o formato da API
      const tipoJejum = convertToApiType(type);
      
      await glucoseService.createGlucoseRecord({
        usuario_id: user.id,
        valor_glicemia: numericValue,
        tipo_jejum: tipoJejum,
        data_medicao: date,
        hora_medicao: time,
        observacoes: notes.trim() || undefined,
      });

      toast.success('Medição registrada com sucesso!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Erro ao registrar medição:', error);
      toast.error('Erro ao registrar medição. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const getTargetValue = () => {
    if (!profile) return 95;
    return type === 'JEJUM' ? (profile.meta_jejum || 95) : (profile.meta_pos_prandial || 140);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Registrar Medição</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Glucose Value */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Valor da Glicemia</h2>
              <p className="text-gray-600">Digite o valor medido em mg/dL</p>
            </div>
            
            <div className="flex justify-center mb-4">
              <div className="relative">
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className={`text-6xl font-bold text-center w-32 h-20 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    isWithinTarget === true
                      ? 'border-green-300 bg-green-50 text-green-700'
                      : isWithinTarget === false
                      ? 'border-red-300 bg-red-50 text-red-700'
                      : 'border-gray-300'
                  }`}
                  placeholder="0"
                  min="20"
                  max="600"
                  required
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                  mg/dL
                </span>
              </div>
            </div>

            {isWithinTarget !== null && (
              <div className="text-center">
                <div
                  className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${
                    isWithinTarget
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  <Target className="w-4 h-4" />
                  <span className="font-medium">
                    {isWithinTarget ? 'Dentro da meta' : 'Acima da meta'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Meta para {type.toLowerCase().replace('_', ' ')}: até {getTargetValue()} mg/dL
                </p>
              </div>
            )}
          </div>

          {/* Measurement Type */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tipo de Medição</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {measurementTypes.map((measurementType) => (
                <button
                  key={measurementType.value}
                  type="button"
                  onClick={() => setType(measurementType.value as MeasurementType)}
                  className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                    type === measurementType.value
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{measurementType.icon}</span>
                    <div>
                      <p className="font-medium text-gray-900">{measurementType.label}</p>
                      <p className="text-sm text-gray-600">{measurementType.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Data da Medição
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Hora da Medição
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Observações (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              placeholder="Ex: Senti tontura, comi algo diferente, etc."
            />
          </div>

          {/* Submit Button */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !value}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Salvar Medição</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMeasurementPage;