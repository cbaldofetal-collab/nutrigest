import React, { useEffect, useState } from 'react';

const SimpleMountTest: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    try {
      setMounted(true);
      
      // Collect debug information
      const info = {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        location: window.location.href,
        pathname: window.location.pathname,
        hostname: window.location.hostname,
        origin: window.location.origin,
        reactVersion: React.version,
        environment: {
          NODE_ENV: import.meta.env.MODE,
          PROD: import.meta.env.PROD,
          DEV: import.meta.env.DEV,
          BASE_URL: import.meta.env.BASE_URL,
          VITE_API_URL: import.meta.env.VITE_API_URL,
        },
        windowInfo: {
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
          outerWidth: window.outerWidth,
          outerHeight: window.outerHeight,
        },
        documentInfo: {
          title: document.title,
          readyState: document.readyState,
          cookieEnabled: navigator.cookieEnabled,
          onLine: navigator.onLine,
        }
      };
      
      setDebugInfo(info);
      console.log('SimpleMountTest mounted successfully:', info);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('SimpleMountTest error:', err);
    }
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-red-100 flex items-center justify-center">
        <div className="text-red-800 text-xl">Component not mounted</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-red-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl">
          <h1 className="text-2xl font-bold text-red-800 mb-4">❌ Erro ao montar componente</h1>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="bg-red-50 p-4 rounded">
            <h3 className="font-semibold text-red-800 mb-2">Debug Info:</h3>
            <pre className="text-xs text-red-700 whitespace-pre-wrap overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-green-800 mb-6">✅ React App Montado com Sucesso!</h1>
        
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h2 className="text-lg font-semibold text-green-800 mb-2">Informações do Sistema:</h2>
          <p className="text-green-700"><strong>Horário:</strong> {debugInfo.timestamp}</p>
          <p className="text-green-700"><strong>URL:</strong> {debugInfo.location}</p>
          <p className="text-green-700"><strong>React Version:</strong> {debugInfo.reactVersion}</p>
          <p className="text-green-700"><strong>Modo:</strong> {debugInfo.environment?.NODE_ENV}</p>
        </div>

        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">Variáveis de Ambiente:</h2>
          <pre className="text-xs text-blue-700 whitespace-pre-wrap overflow-auto max-h-40">
            {JSON.stringify(debugInfo.environment, null, 2)}
          </pre>
        </div>

        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h2 className="text-lg font-semibold text-purple-800 mb-2">Informações do Navegador:</h2>
          <p className="text-purple-700 text-sm mb-2"><strong>User Agent:</strong></p>
          <p className="text-purple-600 text-xs">{debugInfo.userAgent}</p>
        </div>

        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">Informações da Janela:</h2>
          <p className="text-yellow-700"><strong>Dimensões:</strong> {debugInfo.windowInfo?.innerWidth} x {debugInfo.windowInfo?.innerHeight}</p>
          <p className="text-yellow-700"><strong>Document Ready State:</strong> {debugInfo.documentInfo?.readyState}</p>
          <p className="text-yellow-700"><strong>Online:</strong> {debugInfo.documentInfo?.onLine ? 'Sim' : 'Não'}</p>
        </div>

        <div className="text-center">
          <a 
            href="/register" 
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors mr-4"
          >
            Testar Página de Registro
          </a>
          <a 
            href="/" 
            className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
          >
            Voltar para Home
          </a>
        </div>
      </div>
    </div>
  );
};

export default SimpleMountTest;