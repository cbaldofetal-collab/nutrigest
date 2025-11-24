import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useFileStore } from '../../store/file.store';
import { useDashboardStore } from '../../store/dashboard.store';
import { useNavigate } from 'react-router-dom';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, BarChart3, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { ExcelProcessor } from '../../services/processing/excel.processor';
import { ChartGenerator } from '../../services/processing/chart.generator';

const FileUpload: React.FC = () => {
  const { uploadFile, processFile, isLoading, error, setProcessedData } = useFileStore();
  const { createDashboard } = useDashboardStore();
  const navigate = useNavigate();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisResults, setAnalysisResults] = useState<any>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validações
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. Máximo 100MB permitido.');
      return;
    }

    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não suportado. Use Excel (.xlsx, .xls) ou CSV.');
      return;
    }

    try {
      // Simula progresso de upload
      setUploadProgress(0);
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Processar arquivo com IA
      const excelProcessor = new ExcelProcessor();
      const processedData = await excelProcessor.processFile(file);
      
      // Gerar sugestões de gráficos
      const chartGenerator = new ChartGenerator();
      const columnTypes = processedData.schema.reduce((acc, col) => {
        acc[col.name] = col.type;
        return acc;
      }, {} as Record<string, string>);
      
      const chartSuggestions = chartGenerator.suggestChartConfiguration(
        processedData.data,
        processedData.schema.map(col => col.name),
        columnTypes
      );

      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Armazenar dados processados
      setProcessedData(processedData);
      
      setAnalysisResults({
        chartSuggestions,
        statistics: processedData.statistics,
        schema: processedData.schema
      });
      
      toast.success('Arquivo processado com sucesso! Análise de IA concluída.');
      
      // Criar dashboard automaticamente
      const dashboardName = file.name.replace(/\.[^/.]+$/, ""); // Remove extensão
      createDashboard(dashboardName, `Dashboard gerado a partir de ${file.name}`);
      
    } catch (err) {
      toast.error('Erro ao processar arquivo');
      setUploadProgress(0);
    }
  }, [uploadFile, processFile, navigate, setProcessedData, createDashboard]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    disabled: isLoading
  });

  const features = [
    {
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      title: 'Formatos Suportados',
      description: 'Excel (.xlsx, .xls) e CSV'
    },
    {
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      title: 'Tamanho Máximo',
      description: 'Até 100MB por arquivo'
    },
    {
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      title: 'Processamento Rápido',
      description: 'Análise automática em segundos'
    },
    {
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      title: 'Segurança',
      description: 'Seus dados são processados localmente'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Carregar Planilha
          </h1>
          <p className="text-gray-600">
            Transforme seus dados em dashboards interativos com IA
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Área de Upload */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Selecione ou arraste seu arquivo
            </h2>
            
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                transition-all duration-200
                ${isDragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
                }
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <input {...getInputProps()} />
              
              <div className="flex flex-col items-center">
                <div className="bg-blue-100 p-4 rounded-full mb-4">
                  <Upload className="h-8 w-8 text-blue-600" />
                </div>
                
                {isDragActive ? (
                  <p className="text-blue-600 font-medium">Solte o arquivo aqui...</p>
                ) : (
                  <>
                    <p className="text-gray-700 font-medium mb-2">
                      Arraste e solte seu arquivo aqui
                    </p>
                    <p className="text-gray-500 text-sm">
                      ou clique para selecionar
                    </p>
                  </>
                )}
              </div>
            </div>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Carregando...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            {/* Resultados da Análise de IA */}
            {analysisResults && (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                  <h4 className="font-medium text-green-900">
                    Análise de IA Concluída
                  </h4>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-green-800 mb-1">
                      Visualizações Recomendadas:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {analysisResults.chartSuggestions.map((suggestion: any, index: number) => (
                        <span
                          key={index}
                          className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs"
                        >
                          {suggestion.type}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-sm text-green-700">
                    <p>
                      <strong>Dados processados:</strong> {analysisResults.statistics.totalRows} linhas, 
                      {analysisResults.statistics.totalColumns} colunas
                    </p>
                  </div>
                </div>
              </div>
            )}

            {analysisResults && (
              <div className="mt-4">
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Ver Dashboard Criado
                </button>
              </div>
            )}
          </div>

          {/* Informações e Recursos */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Como funciona?
              </h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Carregue sua planilha</p>
                    <p className="text-sm text-gray-600">Excel ou CSV com seus dados</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">IA analisa os dados</p>
                    <p className="text-sm text-gray-600">Identifica padrões e sugere visualizações</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Dashboard gerado</p>
                    <p className="text-sm text-gray-600">Visualizações interativas prontas</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Recursos
              </h3>
              <div className="space-y-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start">
                    {feature.icon}
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">{feature.title}</p>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <FileSpreadsheet className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-900">
                    Dica de segurança
                  </h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Seus dados são processados localmente no navegador e não são armazenados em nossos servidores sem sua permissão.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;