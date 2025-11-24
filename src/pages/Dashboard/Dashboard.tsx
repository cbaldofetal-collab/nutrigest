import React, { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useGlucoseStore } from '../../stores/glucoseStore';
import { Link } from 'react-router-dom';
import { Plus, TrendingUp, Target, Calendar, Bell, Settings, FileText, Heart, Accessibility, User, Shield, Utensils, Droplets, Leaf } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { toast } from 'sonner';
import { apiService } from '@/services/api';
import { formatGestationalAgeForDashboard } from '@/utils/gestationalAgeFormatter';

const Dashboard: React.FC = () => {
  const { user, profile } = useAuthStore();
  const { records, stats, loadRecords, calculateStats } = useGlucoseStore();

  useEffect(() => {
    if (user?.id) {
      loadRecords(user.id, 30);
      calculateStats(user.id, 30);
    }
  }, [user?.id, loadRecords, calculateStats]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const getNextMeasurement = () => {
    const now = new Date();
    const currentHour = now.getHours();
    
    if (currentHour < 8) return 'Jejum';
    if (currentHour < 10) return 'Pós-Café';
    if (currentHour < 14) return 'Pós-Almoço';
    if (currentHour < 20) return 'Pós-Jantar';
    return 'Jejum';
  };

  // Real data from records for charts
  const chartData = useMemo(() => {
    if (!records || records.length === 0) {
      return [
        { date: 'Seg', value: 95, meta: true },
        { date: 'Ter', value: 105, meta: true },
        { date: 'Qua', value: 120, meta: false },
        { date: 'Qui', value: 98, meta: true },
        { date: 'Sex', value: 110, meta: true },
        { date: 'Sáb', value: 125, meta: false },
        { date: 'Dom', value: 102, meta: true },
      ];
    }

    // Group records by date and get average values
    const recordsByDate = records.reduce((acc, record) => {
      const date = new Date(record.data_registro).toLocaleDateString('pt-BR', { weekday: 'short' });
      if (!acc[date]) {
        acc[date] = { values: [], meta: true };
      }
      acc[date].values.push(record.valor);
      return acc;
    }, {} as Record<string, { values: number[]; meta: boolean }>);

    // Calculate averages and check if within target
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return days.map(day => {
      const dayData = recordsByDate[day];
      if (dayData && dayData.values.length > 0) {
        const avgValue = dayData.values.reduce((a, b) => a + b, 0) / dayData.values.length;
        // For now, use a simple check - in real app this would check user's target values
        const meta = avgValue <= 140; // General target for post-meal
        return { date: day, value: Math.round(avgValue), meta };
      }
      return { date: day, value: 100, meta: true }; // Default value
    });
  }, [records]);

  const pieData = [
    { name: 'Dentro da Meta', value: stats?.percentual_na_meta || 75, color: '#10B981' },
    { name: 'Acima da Meta', value: 100 - (stats?.percentual_na_meta || 75), color: '#EF4444' },
  ];

  const [reportEnd, setReportEnd] = useState<string>(new Date().toISOString().slice(0, 10))
  const [reportStart, setReportStart] = useState<string>(new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().slice(0, 10))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">
                {getGreeting()}, {profile?.nome.split(' ')[0]}! 👋
              </h1>
              <p className="text-teal-100">
                {formatGestationalAgeForDashboard(profile?.semana_gestacional || 0)}
              </p>
            </div>
            <div className="flex space-x-3">
              <Link
                to="/profile"
                className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </Link>
              <Link
                to="/notifications"
                className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full"></span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Quick Action */}
        <div className="mb-8">
          <Link
            to="/add-measurement"
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Registrar {getNextMeasurement()}</span>
          </Link>
          <div className="inline-flex items-center space-x-2 ml-3">
            <input type="date" className="border rounded px-2 py-2" value={reportStart} onChange={(e) => setReportStart(e.target.value)} />
            <input type="date" className="border rounded px-2 py-2" value={reportEnd} onChange={(e) => setReportEnd(e.target.value)} />
          </div>
          <button
            onClick={async () => {
              if (!user?.id) return
              const start = reportStart
              const end = reportEnd
              if (!start || !end || start > end) { toast.error('Período inválido'); return }
              try {
                const file = await apiService.getDoctorReport(user.id, start, end)
                const url = URL.createObjectURL(file.data)
                const a = document.createElement('a')
                a.href = url
                a.download = `relatorio-medico-${user.id}.pdf`
                a.click()
                URL.revokeObjectURL(url)
                toast.success('Relatório médico baixado')
              } catch (e) {
                toast.error('Erro ao gerar relatório')
              }
            }}
            className="ml-3 inline-flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-all duration-300 shadow-lg"
          >
            <FileText className="w-5 h-5" />
            <span>Exportar PDF Médico</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm text-gray-500">Últimos 30 dias</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-gray-900">
                {stats?.percentual_na_meta.toFixed(0) || 0}%
              </h3>
              <p className="text-sm text-gray-600">Dentro da meta</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">Média geral</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-gray-900">
                {stats?.media_geral || 0} mg/dL
              </h3>
              <p className="text-sm text-gray-600">Glicemia média</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-teal-600" />
              </div>
              <span className="text-sm text-gray-500">Esta semana</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-gray-900">
                {stats?.registros_ultima_semana || 0}
              </h3>
              <p className="text-sm text-gray-600">Registros</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-pink-600" />
              </div>
              <span className="text-sm text-gray-500">Tendência</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-gray-900 capitalize">
                {stats?.tendencia || 'Estável'}
              </h3>
              <p className="text-sm text-gray-600">Últimos 7 dias</p>
            </div>
          </div>
        </div>

        <NutritionSummary />

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Glucose Trend Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Evolução da Glicemia</h2>
              <span className="text-sm text-gray-500">Últimos 7 dias</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Goal Achievement Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Meta de Glicemia</h2>
              <span className="text-sm text-gray-500">Últimos 30 dias</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center space-x-6 mt-4">
              {pieData.map((entry, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-600">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link
            to="/add-measurement"
            className="bg-gradient-to-r from-teal-600 to-green-600 text-white p-4 rounded-xl hover:from-teal-700 hover:to-green-700 transition-all duration-300 flex items-center justify-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Nova Medição</span>
          </Link>
          <Link
            to="/nutrition"
            className="bg-gradient-to-r from-teal-600 to-green-600 text-white p-4 rounded-xl hover:from-teal-700 hover:to-green-700 transition-all duration-300 flex items-center justify-center space-x-2"
          >
            <Utensils className="w-5 h-5" />
            <span>Nutrição</span>
          </Link>
          <Link
            to="/reminder-settings"
            className="bg-blue-600 text-white p-4 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Bell className="w-5 h-5" />
            <span>Lembretes</span>
          </Link>
          <Link
            to="/reports"
            className="bg-green-600 text-white p-4 rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
          >
            <FileText className="w-5 h-5" />
            <span>Relatórios</span>
          </Link>
          <Link
            to="/accessibility"
            className="bg-orange-600 text-white p-4 rounded-xl hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Accessibility className="w-5 h-5" />
            <span>Acessibilidade</span>
          </Link>
        </div>

        {/* Settings Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Link
            to="/profile"
            className="bg-indigo-600 text-white p-4 rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2"
          >
            <User className="w-5 h-5" />
            <span>Perfil</span>
          </Link>
          <Link
            to="/backup"
            className="bg-teal-600 text-white p-4 rounded-xl hover:bg-teal-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Shield className="w-5 h-5" />
            <span>Backup</span>
          </Link>
          <Link
            to="/history"
            className="bg-gray-600 text-white p-4 rounded-xl hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Settings className="w-5 h-5" />
            <span>Histórico</span>
          </Link>
        </div>

        {/* Recent Records */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Registros Recentes</h2>
            <Link
              to="/history"
              className="text-purple-600 hover:text-purple-700 text-sm font-medium"
            >
              Ver todos
            </Link>
          </div>
          
          {records.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-4">Nenhum registro ainda</p>
              <Link
                to="/add-measurement"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-teal-600 to-green-600 text-white px-4 py-2 rounded-lg hover:from-teal-700 hover:to-green-700 transition-all duration-300"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar primeira medição</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {records.slice(0, 5).map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        record.dentro_meta
                          ? 'bg-green-100 text-green-600'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {record.valor_glicemia} mg/dL
                      </p>
                      <p className="text-sm text-gray-500">
                        {record.tipo_medicao.replace('_', ' ')} • {record.data_medicao}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      record.dentro_meta
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {record.dentro_meta ? 'Dentro' : 'Acima'}
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

export default Dashboard;

const NutritionSummary: React.FC = () => {
  const { user } = useAuthStore();
  const [summary, setSummary] = useState<any | null>(null);
  const [hydration, setHydration] = useState<any | null>(null);
  const [adequacao, setAdequacao] = useState<any | null>(null);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [weekly, setWeekly] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      try {
        const res: any = await apiService.getDailySummary(user.id, date);
        setSummary(res.data?.summary || null);
        setHydration(res.data?.hydration || null);
        setAdequacao(res.data?.adequacao || null);
      } catch {}
    };
    load();
  }, [user?.id, date]);

  useEffect(() => {
    const loadWeekly = async () => {
      if (!user?.id) return;
      const items: any[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(date);
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().slice(0, 10);
        try {
          const r: any = await apiService.getDailySummary(user.id, ds);
          const a = r.data?.adequacao || {};
          items.push({
            label: ds.slice(5),
            ferro: a.ferro ?? 0,
            folato: a.folato ?? 0,
            calcio: a.calcio ?? 0,
            hidratacao: a.hidratacao ?? 0,
          });
        } catch {
          items.push({ label: ds.slice(5), ferro: 0, folato: 0, calcio: 0, hidratacao: 0 });
        }
      }
      setWeekly(items);
    };
    loadWeekly();
  }, [user?.id, date]);

  const Card: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>{icon}</div>
        <span className="text-sm text-gray-500">Hoje</span>
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-gray-900">{Math.min(100, Math.round(value || 0))}%</h3>
        <div className="h-2 bg-gray-200 rounded">
          <div className="h-2 bg-green-600 rounded" style={{ width: `${Math.min(100, Math.round(value || 0))}%` }} />
        </div>
        <p className="text-sm text-gray-600">Adequação</p>
      </div>
    </div>
  );

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Resumo Nutricional</h2>
        <div className="flex items-center gap-3">
          <input type="date" className="border rounded px-2 py-1" value={date} onChange={(e) => setDate(e.target.value)} />
          <Link to="/nutrition" className="text-rose-600 hover:text-rose-700 text-sm font-medium">Ver detalhes</Link>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card title="Ferro" value={adequacao?.ferro ?? 0} icon={<Utensils className="w-6 h-6 text-rose-600" />} color="bg-rose-100" />
        <Card title="Folato" value={adequacao?.folato ?? 0} icon={<Leaf className="w-6 h-6 text-green-600" />} color="bg-green-100" />
        <Card title="Cálcio" value={adequacao?.calcio ?? 0} icon={<Heart className="w-6 h-6 text-pink-600" />} color="bg-pink-100" />
        <Card title="Hidratação" value={adequacao?.hidratacao ?? 0} icon={<Droplets className="w-6 h-6 text-teal-600" />} color="bg-teal-100" />
      </div>
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-md font-semibold text-gray-900">Evolução semanal de adequação</h3>
          <span className="text-sm text-gray-500">Últimos 7 dias</span>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weekly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="ferro" stroke="#f43f5e" strokeWidth={2} dot={false} name="Ferro" />
              <Line type="monotone" dataKey="folato" stroke="#10b981" strokeWidth={2} dot={false} name="Folato" />
              <Line type="monotone" dataKey="calcio" stroke="#ec4899" strokeWidth={2} dot={false} name="Cálcio" />
              <Line type="monotone" dataKey="hidratacao" stroke="#14b8a6" strokeWidth={2} dot={false} name="Hidratação" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}