import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Type, Volume2, Palette, Keyboard } from 'lucide-react';
import { useAccessibility } from '../../components/common/AccessibilityProvider';

const AccessibilitySettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    highContrast, 
    fontSize, 
    screenReaderMode,
    toggleHighContrast, 
    setFontSize, 
    toggleScreenReaderMode 
  } = useAccessibility();

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
          <h1 className="text-2xl font-bold text-gray-900">Acessibilidade</h1>
          <div className="w-20"></div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="space-y-8">
            {/* High Contrast */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-3">
                <Palette className="w-6 h-6 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Alto Contraste</h3>
                  <p className="text-sm text-gray-600">Melhora a legibilidade com cores de alto contraste</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={highContrast}
                  onChange={toggleHighContrast}
                  className="sr-only peer"
                  aria-label="Ativar alto contraste"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Font Size */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Type className="w-6 h-6 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Tamanho da Fonte</h3>
                  <p className="text-sm text-gray-600">Ajuste o tamanho do texto para melhor leitura</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setFontSize('normal')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    fontSize === 'normal'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  aria-pressed={fontSize === 'normal'}
                >
                  <div className="text-base font-medium mb-2">Normal</div>
                  <div className="text-sm text-gray-600">Tamanho padrão</div>
                </button>
                
                <button
                  onClick={() => setFontSize('large')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    fontSize === 'large'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  aria-pressed={fontSize === 'large'}
                >
                  <div className="text-lg font-medium mb-2">Grande</div>
                  <div className="text-sm text-gray-600">25% maior</div>
                </button>
                
                <button
                  onClick={() => setFontSize('extra-large')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    fontSize === 'extra-large'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  aria-pressed={fontSize === 'extra-large'}
                >
                  <div className="text-xl font-medium mb-2">Extra Grande</div>
                  <div className="text-sm text-gray-600">50% maior</div>
                </button>
              </div>
            </div>

            {/* Screen Reader Support */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-3">
                <Volume2 className="w-6 h-6 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Suporte para Leitores de Tela</h3>
                  <p className="text-sm text-gray-600">Melhora a navegação com leitores de tela</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={screenReaderMode}
                  onChange={toggleScreenReaderMode}
                  className="sr-only peer"
                  aria-label="Ativar suporte para leitores de tela"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Keyboard Navigation */}
            <div className="p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center space-x-3 mb-4">
                <Keyboard className="w-6 h-6 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Navegação por Teclado</h3>
                  <p className="text-sm text-gray-600">Use as teclas de seta para navegar entre elementos</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">↑</kbd>
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">↓</kbd>
                  <span className="text-gray-600">Navegar entre elementos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">←</kbd>
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">→</kbd>
                  <span className="text-gray-600">Navegar entre elementos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">Esc</kbd>
                  <span className="text-gray-600">Fechar modais/menus</span>
                </div>
                <div className="flex items-center space-x-2">
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">Tab</kbd>
                  <span className="text-gray-600">Próximo elemento focável</span>
                </div>
              </div>
            </div>

            {/* Visual Indicators */}
            <div className="p-4 bg-green-50 rounded-xl">
              <h3 className="font-semibold text-gray-900 mb-3">Indicadores Visuais</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Valores dentro da meta</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Valores acima da meta</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Informações neutras</span>
                </div>
              </div>
            </div>

            {/* Color Blind Support */}
            <div className="p-4 bg-yellow-50 rounded-xl">
              <h3 className="font-semibold text-gray-900 mb-3">Suporte para Daltonismo</h3>
              <p className="text-sm text-gray-700 mb-3">
                Além das cores, usamos ícones e padrões para indicar status:
              </p>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-green-700"></div>
                  <span className="text-sm text-gray-700">✓ Dentro da meta (check verde)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-red-700"></div>
                  <span className="text-sm text-gray-700">⚠ Acima da meta (alerta vermelho)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Dicas de Acessibilidade</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use as teclas de seta para navegar entre elementos interativos</li>
            <li>• Pressione Tab para mover para o próximo elemento focável</li>
            <li>• Pressione Shift+Tab para voltar ao elemento anterior</li>
            <li>• Use Enter ou Espaço para ativar botões e links</li>
            <li>• Pressione Esc para fechar modais e menus suspensos</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AccessibilitySettingsPage;