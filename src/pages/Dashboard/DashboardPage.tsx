import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Upload, 
  FileSpreadsheet, 
  TrendingUp, 
  Users, 
  Settings, 
  LogOut,
  Plus,
  Download,
  Eye,
  Trash2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { apiService } from '@/services/api';

interface Sheet {
  id: string;
  filename: string;
  originalName: string;
  fileSize: number;
  uploadDate: string;
  processed: boolean;
  rowCount: number;
  columnCount: number;
}

const DashboardPage: React.FC = () => {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragActive, setDragActive] = useState(false);
  
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  console.log('DashboardPage - User:', user);
  console.log('DashboardPage - isAuthenticated:', !!user);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    loadSheets();
  }, [user, navigate]);

  const loadSheets = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await apiService.getSheets();
      setSheets((response as any).sheets || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar planilhas');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    console.log('Starting file upload with file:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Validate file type
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx?|csv)$/i)) {
      setError('Por favor, envie apenas arquivos Excel (.xlsx, .xls) ou CSV (.csv)');
      return;
    }

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setError('O arquivo é muito grande. O tamanho máximo é 50MB.');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setSuccess('');

      console.log('Calling apiService.uploadSheet...');
      const response = await apiService.uploadSheet(file);
      console.log('Upload response:', response);
      
      setSuccess('Planilha enviada com sucesso! Processando...');
      
      // Reload sheets after upload
      setTimeout(() => {
        loadSheets();
        setSuccess('');
      }, 2000);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Erro ao enviar planilha');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input change event triggered');
    console.log('Event target:', e.target);
    console.log('Files:', e.target.files);
    
    if (e.target.files && e.target.files[0]) {
      console.log('File picker selected file:', {
        name: e.target.files[0].name,
        type: e.target.files[0].type,
        size: e.target.files[0].size
      });
      handleFileUpload(e.target.files[0]);
    } else {
      console.log('No file selected or files array is empty');
    }
  };

  const deleteSheet = async (sheetId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta planilha?')) return;

    try {
      setError('');
      await apiService.deleteSheet(sheetId);
      setSuccess('Planilha excluída com sucesso!');
      loadSheets();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir planilha');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2">
                <BarChart3 className="w-8 h-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">Leitor de Planilhas</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>{user.nome}</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  Grátis
                </span>
              </div>
              
              <Link
                to="/settings"
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </Link>
              
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Planilhas</p>
                <p className="text-2xl font-bold text-gray-900">{sheets.length}</p>
              </div>
              <FileSpreadsheet className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Processadas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {sheets.filter(s => s.processed).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Espaço Usado</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatFileSize(sheets.reduce((total, sheet) => total + sheet.fileSize, 0))}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 flex items-center space-x-2 text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="mb-4 flex items-center space-x-2 text-green-600 bg-green-50 p-4 rounded-lg border border-green-200">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Enviar Nova Planilha</h2>
              <label className="cursor-pointer" onClick={() => console.log('File picker label clicked')}>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileInput}
                  className="hidden"
                  disabled={uploading}
                  ref={(input) => console.log('File input ref:', input)}
                />
                <div className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus className="w-4 h-4" />
                  <span>Escolher Arquivo</span>
                </div>
              </label>
              <button 
                onClick={() => {
                  console.log('Test button clicked - attempting to trigger file input');
                  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                  console.log('Found file input:', fileInput);
                  if (fileInput) {
                    fileInput.click();
                    console.log('File input click triggered');
                  }
                }}
                className="ml-2 px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
              >
                Test Input
              </button>
            </div>
            
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className={`w-12 h-12 mx-auto mb-4 ${dragActive ? 'text-blue-600' : 'text-gray-400'}`} />
              <p className={`text-lg font-medium mb-2 ${dragActive ? 'text-blue-600' : 'text-gray-900'}`}>
                {uploading ? 'Enviando...' : 'Arraste e solte sua planilha aqui'}
              </p>
              <p className="text-sm text-gray-600">
                ou clique para escolher um arquivo
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Formatos aceitos: Excel (.xlsx, .xls) e CSV (.csv) • Máximo 50MB
              </p>
            </div>
          </div>
        </div>

        {/* Sheets List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Suas Planilhas</h2>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando planilhas...</p>
              </div>
            ) : sheets.length === 0 ? (
              <div className="text-center py-12">
                <FileSpreadsheet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma planilha ainda</h3>
                <p className="text-gray-600 mb-4">Envie sua primeira planilha para começar a analisar seus dados.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sheets.map((sheet) => (
                  <div key={sheet.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{sheet.originalName}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>{formatFileSize(sheet.fileSize)}</span>
                          <span>•</span>
                          <span>{sheet.rowCount} linhas</span>
                          <span>•</span>
                          <span>{sheet.columnCount} colunas</span>
                          <span>•</span>
                          <span>{formatDate(sheet.uploadDate)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {sheet.processed ? (
                        <Link
                          to={`/sheets/${sheet.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Visualizar análises"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      ) : (
                        <div className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                          Processando...
                        </div>
                      )}
                      
                      <button
                        onClick={() => deleteSheet(sheet.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir planilha"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;