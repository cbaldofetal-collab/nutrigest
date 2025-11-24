import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Filter, Download, Calendar, TrendingUp, Target } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useGlucoseStore } from '../../stores/glucoseStore';
import { GlucoseRecord } from '../../types/glicogest.types';

const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { records, loadRecords } = useGlucoseStore();
  const [filteredRecords, setFilteredRecords] = useState<GlucoseRecord[]>([]);
  const [dateFilter, setDateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'value'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (user?.id) {
      loadRecords(user.id, 90); // Load last 90 days
    }
  }, [user?.id, loadRecords]);

  useEffect(() => {
    let filtered = [...records];

    // Apply date filter
    if (dateFilter) {
      filtered = filtered.filter(record => 
        record.data_medicao.startsWith(dateFilter)
      );
    }

    // Apply type filter
    if (typeFilter) {
      filtered = filtered.filter(record => 
        record.tipo_medicao === typeFilter
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.data_medicao + ' ' + a.hora_medicao);
        const dateB = new Date(b.data_medicao + ' ' + b.hora_medicao);
        return sortOrder === 'desc' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
      } else {
        return sortOrder === 'desc' ? b.valor_glicemia - a.valor_glicemia : a.valor_glicemia - b.valor_glicemia;
      }
    });

    setFilteredRecords(filtered);
  }, [records, dateFilter, typeFilter, sortBy, sortOrder]);

  const clearFilters = () => {
    setDateFilter('');
    setTypeFilter('');
  };

  const exportToCSV = () => {
    const headers = ['Data', 'Hora', 'Tipo', 'Valor (mg/dL)', 'Dentro da Meta', 'Observações'];
    const csvContent = [
      headers.join(','),
      ...filteredRecords.map(record => [
        record.data_medicao,
        record.hora_medicao,
        record.tipo_medicao.replace('_', ' '),
        record.valor_glicemia,
        record.dentro_meta ? 'Sim' : 'Não',
        record.observacoes || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historico-glicemia-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (dentroMeta: boolean) => {
    return dentroMeta 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'JEJUM': 'Jejum',
      'POS_CAFE': 'Pós-café',
      'POS_ALMOCO': 'Pós-almoço',
      'POS_JANTAR': 'Pós-jantar'
    };
    return labels[type] || type;
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Histórico de Glicemia</h1>
          <div className="w-20"></div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">Filtros</span>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-600">Data</label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-600">Tipo</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos</option>
                  <option value="JEJUM">Jejum</option>
                  <option value="POS_CAFE">Pós-café</option>
                  <option value="POS_ALMOCO">Pós-almoço</option>
                  <option value="POS_JANTAR">Pós-jantar</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-600">Ordenar</label>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field as 'date' | 'value');
                    setSortOrder(order as 'asc' | 'desc');
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="date-desc">Data (mais recente)</option>
                  <option value="date-asc">Data (mais antiga)</option>
                  <option value="value-desc">Valor (maior)</option>
                  <option value="value-asc">Valor (menor)</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-600">Ações</label>
                <div className="flex space-x-2">
                  <button
                    onClick={clearFilters}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Limpar
                  </button>
                  <button
                    onClick={exportToCSV}
                    className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
                  >
                    <Download className="w-4 h-4" />
                    <span>CSV</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {filteredRecords.filter(r => r.dentro_meta).length}
                </h3>
                <p className="text-sm text-gray-600">Registros na meta</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {filteredRecords.length > 0 
                    ? Math.round(filteredRecords.reduce((sum, r) => sum + r.valor_glicemia, 0) / filteredRecords.length)
                    : 0
                  }
                </h3>
                <p className="text-sm text-gray-600">Média glicemia</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{filteredRecords.length}</h3>
                <p className="text-sm text-gray-600">Total de registros</p>
              </div>
            </div>
          </div>
        </div>

        {/* Records List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Registros ({filteredRecords.length})
            </h2>
          </div>
          
          {filteredRecords.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-4">Nenhum registro encontrado</p>
              <button
                onClick={clearFilters}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredRecords.map((record) => (
                <div key={record.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          record.dentro_meta
                            ? 'bg-green-100 text-green-600'
                            : 'bg-red-100 text-red-600'
                        }`}
                      >
                        <Target className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-3">
                          <h3 className="text-xl font-bold text-gray-900">
                            {record.valor_glicemia} mg/dL
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(record.dentro_meta)}`}
                          >
                            {record.dentro_meta ? 'Dentro da meta' : 'Acima da meta'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{record.data_medicao}</span>
                          </span>
                          <span>{record.hora_medicao}</span>
                          <span className="font-medium">{getTypeLabel(record.tipo_medicao)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {record.observacoes && (
                      <div className="max-w-xs text-sm text-gray-600">
                        {record.observacoes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;