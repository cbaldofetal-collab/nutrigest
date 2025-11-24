import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BarChart3, ArrowLeft, Download, TrendingUp, Eye, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { apiService } from '@/services/api';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Alert from '@/components/common/Alert';

interface SheetData {
  id: string;
  filename: string;
  originalName: string;
  processed: boolean;
  uploadDate: string;
  rowCount: number;
  columnCount: number;
}

interface AnalyticsData {
  insights: string[];
  charts: Array<{
    id: string;
    type: 'line' | 'bar' | 'pie' | 'scatter';
    title: string;
    description: string;
    data: any;
    options: any;
  }>;
  statistics: {
    totalRows: number;
    totalColumns: number;
    dataTypes: Record<string, number>;
    missingValues: number;
    duplicateRows: number;
  };
}

const SheetAnalyticsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  
  const [sheet, setSheet] = useState<SheetData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    
    loadSheetData();
  }, [user, id]);

  const loadSheetData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load sheet details
      const sheetResponse = await apiService.getSheet(id!);
      setSheet((sheetResponse as any).sheet);
      
      // Load analytics
      const analyticsResponse = await apiService.getAnalytics(id!);
      setAnalytics((analyticsResponse as any).analytics);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const generateNewInsights = async () => {
    try {
      setGenerating(true);
      setError('');
      
      const response = await apiService.generateInsights(id!);
      setAnalytics((response as any).analytics);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar insights');
    } finally {
      setGenerating(false);
    }
  };

  const generateChartRecommendations = async () => {
    try {
      setGenerating(true);
      setError('');
      
      const response = await apiService.getChartRecommendations(id!);
      setAnalytics((response as any).analytics);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar gráficos');
    } finally {
      setGenerating(false);
    }
  };

  const exportData = async (format: 'csv' | 'json' | 'pdf') => {
    try {
      const response = await apiService.exportData(id!, format);
      
      // Create download link
      const blob = new Blob([response.data], { type: response.contentType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sheet?.originalName}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao exportar dados');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Acesso não autorizado</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Alert type="error" message={error} />
          <div className="mt-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!sheet || !analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Alert type="error" message="Dados não encontrados" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Voltar</span>
              </Link>
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">Análises</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={generateNewInsights}
                disabled={generating}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                <span>{generating ? 'Gerando...' : 'Novos Insights'}</span>
              </button>
              
              <div className="relative">
                <select
                  onChange={(e) => e.target.value && exportData(e.target.value as any)}
                  className="appearance-none bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  defaultValue=""
                >
                  <option value="" disabled>Exportar</option>
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                  <option value="pdf">PDF</option>
                </select>
                <Download className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Sheet Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">{sheet.originalName}</h2>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                  Processada
                </span>
                <span className="text-sm text-gray-500">
                  {formatDate(sheet.uploadDate)}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{analytics.statistics.totalRows}</div>
                <div className="text-sm text-gray-600">Linhas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{analytics.statistics.totalColumns}</div>
                <div className="text-sm text-gray-600">Colunas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{analytics.statistics.missingValues}</div>
                <div className="text-sm text-gray-600">Valores Ausentes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{analytics.statistics.duplicateRows}</div>
                <div className="text-sm text-gray-600">Duplicatas</div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-8">
            <Alert type="error" message={error} onClose={() => setError('')} />
          </div>
        )}

        {/* Insights */}
        {analytics.insights.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                Insights da IA
              </h3>
              <div className="space-y-3">
                {analytics.insights.map((insight, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-800">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        {analytics.charts.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Visualizações Recomendadas</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {analytics.charts.map((chart) => (
                  <div key={chart.id} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">{chart.title}</h4>
                    <p className="text-sm text-gray-600 mb-4">{chart.description}</p>
                    <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                      <Eye className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">Gráfico {chart.type} será renderizado aqui</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {analytics.insights.length === 0 && analytics.charts.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-12 text-center">
              <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma análise disponível</h3>
              <p className="text-gray-600 mb-6">Clique em "Novos Insights" para gerar análises com IA.</p>
              <button
                onClick={generateNewInsights}
                disabled={generating}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-5 h-5 ${generating ? 'animate-spin' : ''}`} />
                <span>{generating ? 'Gerando...' : 'Gerar Insights'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SheetAnalyticsPage;