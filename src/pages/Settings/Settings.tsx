import React from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useDashboardStore } from '../../store/dashboard.store';
import { Settings as SettingsIcon, User, Bell, Palette, Shield, Database } from 'lucide-react';

const Settings: React.FC = () => {
  const { user } = useAuthStore();
  const { dashboards } = useDashboardStore();

  const settingsSections = [
    {
      id: 'profile',
      title: 'Perfil',
      icon: <User className="h-5 w-5" />,
      description: 'Gerencie suas informações pessoais'
    },
    {
      id: 'notifications',
      title: 'Notificações',
      icon: <Bell className="h-5 w-5" />,
      description: 'Configure suas preferências de notificação'
    },
    {
      id: 'appearance',
      title: 'Aparência',
      icon: <Palette className="h-5 w-5" />,
      description: 'Personalize o tema e layout'
    },
    {
      id: 'security',
      title: 'Segurança',
      icon: <Shield className="h-5 w-5" />,
      description: 'Gerencie segurança e privacidade'
    },
    {
      id: 'data',
      title: 'Dados',
      icon: <Database className="h-5 w-5" />,
      description: 'Gerencie seus dados e exportações'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Configurações
          </h1>
          <p className="text-gray-600">
            Gerencie suas preferências e configurações da conta
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-6">
                <div className="bg-blue-100 p-3 rounded-full">
                  <SettingsIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {user?.nome}
                  </h2>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                </div>
              </div>

              <nav className="space-y-2">
                {settingsSections.map((section) => (
                  <button
                    key={section.id}
                    className="w-full flex items-center px-3 py-2 text-left text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100"
                  >
                    <div className="mr-3 text-gray-400">
                      {section.icon}
                    </div>
                    {section.title}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Section */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Informações Pessoais
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Atualize suas informações de perfil
                </p>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      defaultValue={user?.nome}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      defaultValue={user?.email}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </div>

            {/* Preferences Section */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Preferências
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Configure suas preferências de uso
                </p>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      Tema Escuro
                    </h4>
                    <p className="text-sm text-gray-600">
                      Ative o modo escuro para uma experiência mais confortável
                    </p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      Notificações por Email
                    </h4>
                    <p className="text-sm text-gray-600">
                      Receba atualizações por email
                    </p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 transition-colors">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      Auto-refresh de Dashboards
                    </h4>
                    <p className="text-sm text-gray-600">
                      Atualize dashboards automaticamente
                    </p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
                  </button>
                </div>
              </div>
            </div>

            {/* Data Statistics */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Estatísticas de Uso
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Resumo do seu uso da plataforma
                </p>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {dashboards.length}
                    </div>
                    <div className="text-sm text-gray-600">
                      Dashboards
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      24
                    </div>
                    <div className="text-sm text-gray-600">
                      Planilhas
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      156
                    </div>
                    <div className="text-sm text-gray-600">
                      Visualizações
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      12
                    </div>
                    <div className="text-sm text-gray-600">
                      Compartilhamentos
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;