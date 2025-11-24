import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart3, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

// Componente de registro totalmente funcional e isolado
const RegisterPageFinal: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  
  const navigate = useNavigate();
  const { login } = useAuthStore();

  useEffect(() => {
    console.log('✅ RegisterPageFinal montado com sucesso');
    console.log('📍 URL atual:', window.location.href);
    console.log('🔧 Modo:', import.meta.env.MODE);
    console.log('🔗 API URL:', import.meta.env.VITE_API_URL || 'https://traesms2lg1s.vercel.app');
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      throw new Error('Por favor, preencha todos os campos');
    }

    if (formData.name.length < 2) {
      throw new Error('O nome deve ter pelo menos 2 caracteres');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      throw new Error('Por favor, insira um email válido');
    }

    if (formData.password.length < 6) {
      throw new Error('A senha deve ter pelo menos 6 caracteres');
    }

    if (formData.password !== formData.confirmPassword) {
      throw new Error('As senhas não coincidem');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setDebugInfo('');

    try {
      validateForm();

      // Preparar dados para debug
      const debugData = {
        timestamp: new Date().toISOString(),
        formData: {
          name: formData.name,
          email: formData.email,
          passwordLength: formData.password.length,
          confirmPasswordLength: formData.confirmPassword.length
        },
        apiUrl: `${import.meta.env.VITE_API_URL || 'https://traesms2lg1s.vercel.app'}/api/auth/register`,
        userAgent: navigator.userAgent,
        location: window.location.href,
        pathname: window.location.pathname,
        hostname: window.location.hostname
      };
      
      setDebugInfo(`Preparando para enviar: ${JSON.stringify(debugData, null, 2)}`);

      // Usar URL absoluta para garantir que funcione
      const apiUrl = `${import.meta.env.VITE_API_URL || 'https://traesms2lg1s.vercel.app'}/api/auth/register`;
      
      setDebugInfo(prev => prev + `\n\nEnviando para: ${apiUrl}`);

      console.log('🚀 Iniciando requisição para:', apiUrl);
      console.log('📊 Dados:', { name: formData.name, email: formData.email });

      // Fazer a requisição com timeout e retry
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('✅ Resposta recebida:', response.status);
      setDebugInfo(prev => prev + `\n\nStatus da resposta: ${response.status}`);
      setDebugInfo(prev => prev + `\nHeaders: ${JSON.stringify([...response.headers.entries()], null, 2)}`);

      const responseText = await response.text();
      setDebugInfo(prev => prev + `\n\nCorpo da resposta (texto): ${responseText}`);

      let data;
      try {
        data = JSON.parse(responseText);
        setDebugInfo(prev => prev + `\n\nCorpo da resposta (JSON): ${JSON.stringify(data, null, 2)}`);
      } catch (e) {
        setDebugInfo(prev => prev + `\n\nErro ao parsear JSON: ${e.message}`);
        data = { message: responseText };
      }

      if (!response.ok) {
        throw new Error(data.message || `Erro ${response.status}: ${responseText}`);
      }

      // Auto-login após registro bem-sucedido
      login(data.user, data.tokens);
      
      setSuccess(true);
      setDebugInfo(prev => prev + `\n\n✅ Registro bem-sucedido! Redirecionando...`);
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar conta';
      setError(errorMessage);
      setDebugInfo(prev => prev + `\n\n❌ Erro: ${errorMessage}`);
      console.error('❌ Erro no registro:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="flex items-center justify-center space-x-2 mb-4">
            <BarChart3 className="w-10 h-10 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Leitor de Planilhas</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Crie sua conta</h1>
          <p className="text-gray-600">Comece a transformar seus dados em insights hoje mesmo</p>
        </div>

        {/* Debug Information */}
        {debugInfo && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-sm font-semibold text-yellow-800 mb-2">Informações de Debug:</h3>
            <pre className="text-xs text-yellow-700 whitespace-pre-wrap overflow-auto max-h-40">{debugInfo}</pre>
          </div>
        )}

        {/* Registration Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nome completo
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="João Silva"
                required
              />
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="seu@email.com"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? '👁️‍🗨️' : '👁️'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar senha
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? '👁️‍🗨️' : '👁️'}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-lg">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">Conta criada com sucesso! Redirecionando...</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? 'Criando conta...' : 'Criar conta grátis'}
            </button>
          </form>

          {/* Terms */}
          <p className="mt-6 text-xs text-gray-600 text-center">
            Ao criar uma conta, você concorda com nossos{' '}
            <Link to="/terms" className="text-blue-600 hover:text-blue-700 underline">
              Termos de Serviço
            </Link>{' '}
            e{' '}
            <Link to="/privacy" className="text-blue-600 hover:text-blue-700 underline">
              Política de Privacidade
            </Link>
            .
          </p>

          {/* Links */}
          <div className="mt-6 text-center">
            <div className="text-sm text-gray-600">
              Já tem uma conta?{' '}
              <Link 
                to="/login" 
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Entrar
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <Link to="/" className="hover:text-blue-600 transition-colors">
            ← Voltar para página inicial
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPageFinal;