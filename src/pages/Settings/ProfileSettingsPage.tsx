import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Calendar, Heart, Save, AlertCircle, CheckCircle, Shield, FileDown, Trash2, List } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { toast } from 'sonner';
import { apiService } from '@/services/api';

const ProfileSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, updateProfile } = useAuthStore();
  
  const [formData, setFormData] = useState({
    nome: '',
    semana_gestacional: '',
    data_parto_prevista: '',
    meta_jejum: '95',
    meta_pos_prandial: '140',
    tipo_diabetes: 'DMG' as 'DMG' | 'PRE_EXISTENTE',
    observacoes: '',
  });
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [consents, setConsents] = useState({ privacyAccepted: false, termsAccepted: false, dataSharing: false });
  const [audit, setAudit] = useState<any[]>([]);
  const [auditStart, setAuditStart] = useState<string>('');
  const [auditEnd, setAuditEnd] = useState<string>('');
  const [auditAction, setAuditAction] = useState<string>('ALL');
  const [auditOffset, setAuditOffset] = useState<number>(0);

  useEffect(() => {
    if (profile) {
      setFormData({
        nome: profile.nome || '',
        semana_gestacional: profile.semana_gestacional?.toString() || '',
        data_parto_prevista: profile.data_parto_prevista?.split('T')[0] || '',
        meta_jejum: profile.meta_jejum?.toString() || '95',
        meta_pos_prandial: profile.meta_pos_prandial?.toString() || '140',
        tipo_diabetes: profile.tipo_diabetes || 'DMG',
        observacoes: profile.observacoes || '',
      });
    }
    if (user) {
      apiService.getConsents(user.id).then((r: any) => {
        setConsents({
          privacyAccepted: !!r.data?.privacyAccepted,
          termsAccepted: !!r.data?.termsAccepted,
          dataSharing: !!r.data?.dataSharing,
        });
      }).catch(() => {})
      apiService.getAuditLogs(user.id, 10, undefined, undefined, 0).then((r: any) => {
        setAudit(r.data || [])
        setAuditOffset((r.data || []).length)
      }).catch(() => {})
    }
  }, [profile]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (formData.semana_gestacional && (parseInt(formData.semana_gestacional) < 1 || parseInt(formData.semana_gestacional) > 42)) {
      newErrors.semana_gestacional = 'Semana gestacional deve estar entre 1 e 42';
    }

    if (formData.meta_jejum && (parseInt(formData.meta_jejum) < 70 || parseInt(formData.meta_jejum) > 200)) {
      newErrors.meta_jejum = 'Meta de jejum deve estar entre 70 e 200 mg/dL';
    }

    if (formData.meta_pos_prandial && (parseInt(formData.meta_pos_prandial) < 100 || parseInt(formData.meta_pos_prandial) > 300)) {
      newErrors.meta_pos_prandial = 'Meta pós-prandial deve estar entre 100 e 300 mg/dL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const updates = {
        nome: formData.nome.trim(),
        semana_gestacional: formData.semana_gestacional ? parseInt(formData.semana_gestacional) : null,
        data_parto_prevista: formData.data_parto_prevista || null,
        meta_jejum: parseInt(formData.meta_jejum),
        meta_pos_prandial: parseInt(formData.meta_pos_prandial),
        tipo_diabetes: formData.tipo_diabetes,
        observacoes: formData.observacoes.trim() || null,
      };

      await updateProfile(updates);
      
      setMessage('Perfil atualizado com sucesso!');
      toast.success('Perfil atualizado com sucesso!');
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('Erro ao atualizar perfil. Tente novamente.');
      toast.error('Erro ao atualizar perfil');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const calculateWeeksFromDate = () => {
    if (!formData.data_parto_prevista) return;
    
    const partoDate = new Date(formData.data_parto_prevista);
    const today = new Date();
    const diffTime = partoDate.getTime() - today.getTime();
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
    
    if (diffWeeks > 0 && diffWeeks <= 42) {
      const currentWeek = 40 - diffWeeks; // Assuming 40 weeks pregnancy
      if (currentWeek > 0 && currentWeek <= 42) {
        setFormData(prev => ({ ...prev, semana_gestacional: currentWeek.toString() }));
      }
    }
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Carregando perfil...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Configurações do Perfil</h1>
          <div className="w-20"></div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Informações Pessoais</span>
              </h2>

              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => handleChange('nome', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.nome ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Seu nome completo"
                  required
                  aria-invalid={!!errors.nome}
                  aria-describedby={errors.nome ? 'nome-error' : undefined}
                />
                {errors.nome && (
                  <p id="nome-error" className="mt-1 text-sm text-red-600">{errors.nome}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="semana_gestacional" className="block text-sm font-medium text-gray-700 mb-2">
                    Semana Gestacional
                  </label>
                  <input
                    type="number"
                    id="semana_gestacional"
                    value={formData.semana_gestacional}
                    onChange={(e) => handleChange('semana_gestacional', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.semana_gestacional ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ex: 24"
                    min="1"
                    max="42"
                    aria-invalid={!!errors.semana_gestacional}
                    aria-describedby={errors.semana_gestacional ? 'semana-error' : undefined}
                  />
                  {errors.semana_gestacional && (
                    <p id="semana-error" className="mt-1 text-sm text-red-600">{errors.semana_gestacional}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="data_parto_prevista" className="block text-sm font-medium text-gray-700 mb-2">
                    Data Prevista para o Parto
                  </label>
                  <div className="space-y-2">
                    <input
                      type="date"
                      id="data_parto_prevista"
                      value={formData.data_parto_prevista}
                      onChange={(e) => handleChange('data_parto_prevista', e.target.value)}
                      onBlur={calculateWeeksFromDate}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <button
                      type="button"
                      onClick={calculateWeeksFromDate}
                      className="text-sm text-blue-600 hover:text-blue-700 underline"
                    >
                      Calcular semanas automaticamente
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Diabetes Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Heart className="w-5 h-5" />
                <span>Informações sobre Diabetes</span>
              </h2>

              <div>
                <label htmlFor="tipo_diabetes" className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Diabetes
                </label>
                <select
                  id="tipo_diabetes"
                  value={formData.tipo_diabetes}
                  onChange={(e) => handleChange('tipo_diabetes', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="DMG">Diabetes Mellitus Gestacional (DMG)</option>
                  <option value="DMG1">DMG Tipo 1</option>
                  <option value="DMG2">DMG Tipo 2</option>
                  <option value="OUTRO">Outro</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="meta_jejum" className="block text-sm font-medium text-gray-700 mb-2">
                    Meta de Glicemia em Jejum (mg/dL)
                  </label>
                  <input
                    type="number"
                    id="meta_jejum"
                    value={formData.meta_jejum}
                    onChange={(e) => handleChange('meta_jejum', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.meta_jejum ? 'border-red-500' : 'border-gray-300'
                    }`}
                    min="70"
                    max="200"
                    required
                    aria-invalid={!!errors.meta_jejum}
                    aria-describedby={errors.meta_jejum ? 'jejum-error' : undefined}
                  />
                  {errors.meta_jejum && (
                    <p id="jejum-error" className="mt-1 text-sm text-red-600">{errors.meta_jejum}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="meta_pos_prandial" className="block text-sm font-medium text-gray-700 mb-2">
                    Meta Pós-prandial (mg/dL)
                  </label>
                  <input
                    type="number"
                    id="meta_pos_prandial"
                    value={formData.meta_pos_prandial}
                    onChange={(e) => handleChange('meta_pos_prandial', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.meta_pos_prandial ? 'border-red-500' : 'border-gray-300'
                    }`}
                    min="100"
                    max="300"
                    required
                    aria-invalid={!!errors.meta_pos_prandial}
                    aria-describedby={errors.meta_pos_prandial ? 'pos-error' : undefined}
                  />
                  {errors.meta_pos_prandial && (
                    <p id="pos-error" className="mt-1 text-sm text-red-600">{errors.meta_pos_prandial}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Informações Adicionais</h2>

              <div>
                <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 mb-2">
                  Observações (opicional)
                </label>
                <textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => handleChange('observacoes', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                  placeholder="Alguma observação importante sobre sua saúde ou tratamento..."
                  maxLength={500}
                />
                <p className="mt-1 text-sm text-gray-500">{formData.observacoes.length}/500 caracteres</p>
              </div>
            </div>

            {/* Privacy & LGPD */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Privacidade e LGPD</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={consents.privacyAccepted} onChange={(e) => setConsents({ ...consents, privacyAccepted: e.target.checked })} />
                  <span className="text-sm text-gray-700">Li e aceito a Política de Privacidade</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={consents.termsAccepted} onChange={(e) => setConsents({ ...consents, termsAccepted: e.target.checked })} />
                  <span className="text-sm text-gray-700">Aceito os Termos de Uso</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={consents.dataSharing} onChange={(e) => setConsents({ ...consents, dataSharing: e.target.checked })} />
                  <span className="text-sm text-gray-700">Permitir compartilhamento de dados com profissionais</span>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className="px-3 py-2 bg-gray-800 text-white rounded-lg flex items-center gap-2" onClick={async () => {
                  if (!user) return
                  await apiService.setConsents({ userId: user.id, ...consents, version: 'v1' })
                  toast.success('Consentimentos atualizados')
                }}>
                  <Shield className="w-4 h-4" />
                  Atualizar Consentimentos
                </button>
                <button type="button" className="px-3 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2" onClick={async () => {
                  if (!user) return
                  const file = await apiService.exportPersonalData(user.id)
                  const url = URL.createObjectURL(file.data)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `lgpd-export-${user.id}.json`
                  a.click()
                  URL.revokeObjectURL(url)
                }}>
                  <FileDown className="w-4 h-4" />
                  Exportar Dados
                </button>
                <button type="button" className="px-3 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2" onClick={async () => {
                  if (!user) return
                  if (!confirm('Tem certeza que deseja excluir sua conta e todos os dados associados? Esta ação é irreversível.')) return
                  await apiService.deleteAccount(user.id)
                  toast.success('Conta excluída. Você será desconectado.')
                  window.location.href = '/'
                }}>
                  <Trash2 className="w-4 h-4" />
                  Excluir Conta
                </button>
              </div>
              <p className="text-xs text-gray-500">Você pode revisar, exportar e excluir seus dados a qualquer momento conforme a LGPD.</p>
              <div className="mt-4">
                <h3 className="text-md font-semibold text-gray-900 flex items-center gap-2"><List className="w-4 h-4" />Últimas ações</h3>
                <div className="flex items-center gap-2 mt-2">
                  <input type="date" className="border rounded px-2 py-1" value={auditStart} onChange={(e) => setAuditStart(e.target.value)} />
                  <input type="date" className="border rounded px-2 py-1" value={auditEnd} onChange={(e) => setAuditEnd(e.target.value)} />
                  <select className="border rounded px-2 py-1" value={auditAction} onChange={(e) => setAuditAction(e.target.value)}>
                    <option value="ALL">Todas</option>
                    <option value="CONSENT_VIEW">CONSENT_VIEW</option>
                    <option value="CONSENT_UPDATE">CONSENT_UPDATE</option>
                    <option value="DATA_EXPORT">DATA_EXPORT</option>
                    <option value="ACCOUNT_DELETE">ACCOUNT_DELETE</option>
                  </select>
                  <button className="px-3 py-2 bg-gray-200 text-gray-800 rounded" onClick={async () => {
                    if (!user) return
                    const r: any = await apiService.getAuditLogs(user.id, 50, auditStart || undefined, auditEnd || undefined, 0, auditAction)
                    setAudit(r.data || [])
                    setAuditOffset((r.data || []).length)
                  }}>Filtrar</button>
                  <button className="px-3 py-2 bg-gray-800 text-white rounded" onClick={() => {
                    const rows = [['id','action','route','ip','created_at']].concat(audit.map((l) => [String(l.id), l.action, l.route || '', l.ip || '', l.created_at]))
                    const csv = rows.map((r) => r.map((v) => '"' + String(v).replace(/"/g,'""') + '"').join(',')).join('\n')
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'audit-logs.csv'
                    a.click()
                    URL.revokeObjectURL(url)
                  }}>Exportar CSV</button>
                </div>
                <div className="mt-2 space-y-2">
                  {audit.length === 0 ? (
                    <p className="text-sm text-gray-500">Nenhuma ação registrada</p>
                  ) : (
                    audit.map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-800">{log.action}</span>
                        <span className="text-xs text-gray-500">{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-2">
                  <button className="px-3 py-2 bg-gray-200 text-gray-800 rounded" onClick={async () => {
                    if (!user) return
                    const r: any = await apiService.getAuditLogs(user.id, 50, auditStart || undefined, auditEnd || undefined, auditOffset, auditAction)
                    const more = r.data || []
                    setAudit(audit.concat(more))
                    setAuditOffset(auditOffset + more.length)
                  }}>Ver mais</button>
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
            >
              <Save className="w-5 h-5" />
              <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </form>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Dicas Importantes</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Mantenha suas metas de glicemia atualizadas com orientação médica</li>
            <li>• A semana gestacional pode ser calculada automaticamente pela data do parto</li>
            <li>• As metas padrão são 95 mg/dL para jejum e 140 mg/dL pós-prandial</li>
            <li>• Consulte seu médico antes de alterar suas metas alvo</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;