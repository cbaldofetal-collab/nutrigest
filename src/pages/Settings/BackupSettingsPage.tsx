import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Upload, Settings, Clock, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { useBackupStore, BackupData } from '../../stores/backupStore';
import { useAuthStore } from '../../stores/authStore';
import { toast } from 'sonner';

const BackupSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    createBackup, 
    restoreFromBackup, 
    exportToFile, 
    importFromFile,
    isBackingUp, 
    isRestoring 
  } = useBackupStore();
  
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(
    localStorage.getItem('autoBackupEnabled') === 'true'
  );
  const [encryptionEnabled, setEncryptionEnabled] = useState(
    localStorage.getItem('backupEncryptionEnabled') === 'true'
  );
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateBackup = async () => {
    try {
      const backupData = await createBackup();
      setMessage('Backup criado com sucesso!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error creating backup:', error);
    }
  };

  const handleExportBackup = async () => {
    try {
      const backupData = await createBackup();
      exportToFile(backupData);
    } catch (error) {
      console.error('Error exporting backup:', error);
    }
  };

  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const backupData = await importFromFile(file);
      
      // Validate backup belongs to current user
      if (backupData.userId !== user?.id) {
        toast.error('Este backup pertence a outro usuário');
        return;
      }

      // Confirm restore
      const confirmRestore = window.confirm(
        'Tem certeza que deseja restaurar este backup?\n\n' +
        'Isso substituirá todos os seus dados atuais.\n' +
        `Data do backup: ${new Date(backupData.timestamp).toLocaleString('pt-BR')}\n` +
        `Registros de glicemia: ${backupData.glucoseRecords.length}\n` +
        `Lembretes: ${backupData.reminders.length}`
      );

      if (confirmRestore) {
        await restoreFromBackup(backupData);
        setMessage('Backup restaurado com sucesso!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error importing backup:', error);
      toast.error('Erro ao importar backup');
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const toggleAutoBackup = () => {
    const newValue = !autoBackupEnabled;
    setAutoBackupEnabled(newValue);
    localStorage.setItem('autoBackupEnabled', newValue.toString());
    
    if (newValue) {
      toast.success('Backup automático ativado');
    } else {
      toast.info('Backup automático desativado');
    }
  };

  const toggleEncryption = () => {
    const newValue = !encryptionEnabled;
    setEncryptionEnabled(newValue);
    localStorage.setItem('backupEncryptionEnabled', newValue.toString());
    
    if (newValue) {
      toast.success('Criptografia de backup ativada');
    } else {
      toast.info('Criptografia de backup desativada');
    }
  };

  const getLastBackupDate = () => {
    const lastBackup = localStorage.getItem('lastAutoBackup');
    if (!lastBackup) return 'Nunca';
    
    const date = new Date(parseInt(lastBackup));
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Backup e Restauração</h1>
          <div className="w-20"></div>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Status do Backup</h2>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Último backup automático:</span>
              <span className="font-medium text-gray-900">{getLastBackupDate()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Backup automático:</span>
              <span className={`font-medium ${autoBackupEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                {autoBackupEnabled ? 'Ativado' : 'Desativado'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Criptografia:</span>
              <span className={`font-medium ${encryptionEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                {encryptionEnabled ? 'Ativada' : 'Desativada'}
              </span>
            </div>
          </div>
        </div>

        {/* Backup Actions */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <Download className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Criar Backup</h2>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={handleCreateBackup}
              disabled={isBackingUp}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <span>{isBackingUp ? 'Criando...' : 'Criar Backup'}</span>
            </button>
            
            <button
              onClick={handleExportBackup}
              disabled={isBackingUp}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Download className="w-5 h-5" />
              <span>Exportar para Arquivo</span>
            </button>
          </div>
        </div>

        {/* Restore Actions */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <Upload className="w-6 h-6 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Restaurar Backup</h2>
          </div>
          
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isRestoring}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Upload className="w-5 h-5" />
              <span>{isRestoring ? 'Restaurando...' : 'Importar de Arquivo'}</span>
            </button>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <Settings className="w-6 h-6 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Configurações</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-gray-600" />
                <div>
                  <h3 className="font-medium text-gray-900">Backup Automático</h3>
                  <p className="text-sm text-gray-600">Criar backup automático diariamente</p>
                </div>
              </div>
              <button
                onClick={toggleAutoBackup}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoBackupEnabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoBackupEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-gray-600" />
                <div>
                  <h3 className="font-medium text-gray-900">Criptografia</h3>
                  <p className="text-sm text-gray-600">Criptografar dados do backup</p>
                </div>
              </div>
              <button
                onClick={toggleEncryption}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  encryptionEnabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    encryptionEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg flex items-center space-x-2 ${
            message.includes('sucesso') 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.includes('sucesso') ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span>{message}</span>
          </div>
        )}

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Informações Importantes</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Os backups incluem seus registros de glicemia, perfil e configurações</li>
            <li>• Os arquivos de backup são criptografados para sua segurança</li>
            <li>• Você só pode restaurar backups do seu próprio usuário</li>
            <li>• O backup automático é realizado diariamente quando ativado</li>
            <li>• Mantenha seus backups em local seguro</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BackupSettingsPage;