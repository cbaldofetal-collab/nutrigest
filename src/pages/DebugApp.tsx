import React from 'react';
import { useLocation } from 'react-router-dom';

const DebugApp: React.FC = () => {
  const location = useLocation();
  
  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl w-full">
        <h1 className="text-3xl font-bold text-red-600 mb-6">🚨 DEBUG - React App Carregado</h1>
        
        <div className="space-y-4">
          <div className="p-4 bg-red-100 rounded-lg border border-red-200">
            <h2 className="font-semibold text-red-800 mb-2">Informações de Roteamento:</h2>
            <p><strong>Pathname:</strong> <code className="bg-red-200 px-2 py-1 rounded">{location.pathname}</code></p>
            <p><strong>Search:</strong> <code className="bg-red-200 px-2 py-1 rounded">{location.search}</code></p>
            <p><strong>Hash:</strong> <code className="bg-red-200 px-2 py-1 rounded">{location.hash}</code></p>
            <p><strong>State:</strong> <code className="bg-red-200 px-2 py-1 rounded">{JSON.stringify(location.state)}</code></p>
          </div>
          
          <div className="p-4 bg-yellow-100 rounded-lg border border-yellow-200">
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
          
          <div className="p-4 bg-blue-100 rounded-lg border border-blue-200">
            <h2 className="font-semibold text-blue-800 mb-2">Informações do Navegador:</h2>
            <p><strong>User Agent:</strong> <code className="bg-blue-200 px-2 py-1 rounded text-xs">{navigator.userAgent}</code></p>
            <p><strong>URL Completa:</strong> <code className="bg-blue-200 px-2 py-1 rounded text-xs break-all">{window.location.href}</code></p>
            <p><strong>Hostname:</strong> <code className="bg-blue-200 px-2 py-1 rounded">{window.location.hostname}</code></p>
            <p><strong>Porta:</strong> <code className="bg-blue-200 px-2 py-1 rounded">{window.location.port}</code></p>
            <p><strong>Protocolo:</strong> <code className="bg-blue-200 px-2 py-1 rounded">{window.location.protocol}</code></p>
          </div>
          
          <div className="p-4 bg-green-100 rounded-lg border border-green-200">
            <h2 className="font-semibold text-green-800 mb-2">Possíveis Rotas:</h2>
            <ul className="list-disc list-inside text-green-700 space-y-1">
              <li>/ - Página inicial</li>
              <li>/login - Página de login</li>
              <li>/register - Página de registro</li>
              <li>/dashboard - Dashboard (protegido)</li>
              <li>/sheets/:id - Analytics (protegido)</li>
            </ul>
          </div>
          
          <div className="flex space-x-4 mt-6">
            <a href="/" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
              ← Ir para Home
            </a>
            <a href="/register" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
              Testar Registro →
            </a>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors">
              🔄 Recarregar Página
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugApp;