import React from 'react';

const TestRouting: React.FC = () => {
  const currentPath = window.location.pathname;
  const currentHref = window.location.href;
  
  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-blue-600 mb-6">🔍 Teste de Roteamento</h1>
        
        <div className="space-y-4">
          <div className="p-4 bg-gray-100 rounded-lg">
            <h2 className="font-semibold text-gray-700 mb-2">Informações da Rota:</h2>
            <p><strong>Pathname:</strong> <code className="bg-gray-200 px-2 py-1 rounded">{currentPath}</code></p>
            <p><strong>URL Completa:</strong> <code className="bg-gray-200 px-2 py-1 rounded break-all">{currentHref}</code></p>
          </div>
          
          <div className="p-4 bg-yellow-100 rounded-lg">
            <h2 className="font-semibold text-yellow-800 mb-2">Variáveis de Ambiente:</h2>
            <pre className="text-sm text-yellow-700 bg-yellow-50 p-3 rounded overflow-auto">
{JSON.stringify({
  MODE: import.meta.env.MODE,
  PROD: import.meta.env.PROD,
  DEV: import.meta.env.DEV,
  BASE_URL: import.meta.env.BASE_URL,
  VITE_API_URL: import.meta.env.VITE_API_URL
}, null, 2)}
            </pre>
          </div>
          
          <div className="p-4 bg-green-100 rounded-lg">
            <h2 className="font-semibold text-green-800 mb-2">Rotas Disponíveis:</h2>
            <ul className="list-disc list-inside text-green-700 space-y-1">
              <li>/ - Página inicial</li>
              <li>/login - Página de login</li>
              <li>/register - Página de registro</li>
              <li>/dashboard - Dashboard (protegido)</li>
              <li>/test - Esta página de teste</li>
            </ul>
          </div>
          
          <div className="flex space-x-4 mt-6">
            <a href="/" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
              ← Home
            </a>
            <a href="/register" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
              Testar Registro →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestRouting;