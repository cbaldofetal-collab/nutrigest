import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Calendar, TrendingUp, Target, FileText } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { GlucoseRecord } from '../../types/nutrigest.types';
import { glucoseService } from '../../services/glucoseService';

const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const [records, setRecords] = useState<GlucoseRecord[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [dateRange, setDateRange] = useState<'7' | '30' | '90' | 'custom'>('30');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [filteredRecords, setFilteredRecords] = useState<GlucoseRecord[]>([]);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const loadRecords = async (userId: string) => {
    try {
      const recordsData = await glucoseService.getGlucoseRecords(userId, { limit: 1000 });
      // Convert from API type to frontend type
      const frontendRecords = recordsData.map(record => glucoseService.convertFromApiType(record));
      setRecords(frontendRecords);
      
      const statsData = await glucoseService.getGlucoseStatistics(userId);
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar registros:', error);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadRecords(user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    let filtered = [...records];
    const now = new Date();

    if (dateRange === 'custom' && customStartDate && customEndDate) {
      const startDate = new Date(customStartDate);
      const endDate = new Date(customEndDate);
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.data_medicao);
        return recordDate >= startDate && recordDate <= endDate;
      });
    } else {
      const daysBack = parseInt(dateRange);
      const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.data_medicao);
        return recordDate >= startDate;
      });
    }

    setFilteredRecords(filtered);
  }, [records, dateRange, customStartDate, customEndDate]);

  const generatePDF = async () => {
    if (!user) return;

    setGeneratingPDF(true);

    try {
      let startDate, endDate;
      
      if (dateRange === 'custom' && customStartDate && customEndDate) {
        startDate = customStartDate;
        endDate = customEndDate;
      } else {
        const days = parseInt(dateRange);
        const end = new Date();
        const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
        startDate = start.toISOString().split('T')[0];
        endDate = end.toISOString().split('T')[0];
      }

      const pdfBlob = await glucoseService.generateGlucoseReport(user.id, { startDate, endDate });
      
      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-glicemia-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const getPeriodText = () => {
    if (dateRange === 'custom' && customStartDate && customEndDate) {
      return `${new Date(customStartDate).toLocaleDateString('pt-BR')} até ${new Date(customEndDate).toLocaleDateString('pt-BR')}`;
    }
    
    const days = parseInt(dateRange);
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
    return `${startDate.toLocaleDateString('pt-BR')} até ${endDate.toLocaleDateString('pt-BR')}`;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'jejum': 'Jejum',
      'pos-prandial': 'Pós-prandial'
    };
    return labels[type] || type;
  };

  const getRecordsByType = () => {
    const byType: Record<string, number> = {};
    filteredRecords.forEach(record => {
      byType[record.tipo_medicao] = (byType[record.tipo_medicao] || 0) + 1;
    });
    return byType;
  };

  const getAverageByType = () => {
    const byType: Record<string, { sum: number; count: number }> = {};
    filteredRecords.forEach(record => {
      if (!byType[record.tipo_medicao]) {
        byType[record.tipo_medicao] = { sum: 0, count: 0 };
      }
      byType[record.tipo_medicao].sum += record.valor_glicemia;
      byType[record.tipo_medicao].count += 1;
    });
    
    const result: Record<string, number> = {};
    Object.keys(byType).forEach(type => {
      result[type] = Math.round(byType[type].sum / byType[type].count);
    });
    return result;
  };

  const recordsByType = getRecordsByType();
  const averageByType = getAverageByType();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <div className="w-20"></div>
        </div>

        {/* Period Selection */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">Período do Relatório</span>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as '7' | '30' | '90' | 'custom')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7">Últimos 7 dias</option>
                <option value="30">Últimos 30 dias</option>
                <option value="90">Últimos 90 dias</option>
                <option value="custom">Período personalizado</option>
              </select>
              
              {dateRange === 'custom' && (
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
              
              <button
                onClick={generatePDF}
                disabled={generatingPDF || filteredRecords.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>{generatingPDF ? 'Gerando...' : 'Gerar PDF'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{filteredRecords.length}</h3>
                <p className="text-sm text-gray-600">Total medições</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {stats?.total_registros || 0}
                </h3>
                <p className="text-sm text-gray-600">Total de registros</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {stats?.media_glicemia || 0}
                </h3>
                <p className="text-sm text-gray-600">Média geral (mg/dL)</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {Object.keys(recordsByType).length}
                </h3>
                <p className="text-sm text-gray-600">Tipos medições</p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Statistics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Estatísticas por Tipo de Medição</h2>
          </div>
          
          {Object.keys(recordsByType).length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">Nenhum registro encontrado para o período selecionado</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {Object.entries(recordsByType).map(([type, count]) => {
                const average = averageByType[type] || 0;
                
                return (
                  <div key={type} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Target className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{getTypeLabel(type)}</h3>
                          <p className="text-sm text-gray-600">
                            {count} medições • Média: {average} mg/dL
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;