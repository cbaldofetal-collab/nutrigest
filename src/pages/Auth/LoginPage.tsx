import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Eye, EyeOff, AlertCircle, CheckCircle, Fingerprint } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPinAuth, setShowPinAuth] = useState(false);
  const [pin, setPin] = useState('');
  
  const navigate = useNavigate();
  const { login, loginWithPin, hasPin } = useAuthStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate form
      if (!formData.email || !formData.password) {
        throw new Error('Por favor, preencha todos os campos');
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        throw new Error('Por favor, insira um email válido');
      }

      if (formData.password.length < 6) {
        throw new Error('A senha deve ter pelo menos 6 caracteres');
      }

      // Use Supabase authentication
      const result = await login(formData.email, formData.password);
      
      if (result.error) {
        throw new Error(result.error);
      }

      setSuccess(true);
      setTimeout(() => {
        // If user has PIN configured, redirect to PIN auth
        if (hasPin()) {
          setShowPinAuth(true);
        } else {
          navigate('/dashboard');
        }
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handlePinAuth = async (pin: string) => {
    try {
      const result = await loginWithPin(pin);
      if (result.error) {
        throw new Error(result.error);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na autenticação com PIN');
    }
  };

  const handleBiometricAuth = async () => {
    try {
      const result = await loginWithPin('biometric');
      if (result.error) {
        throw new Error(result.error);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na autenticação biométrica');
    }
  };

  const handlePinInput = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      
      if (newPin.length === 4) {
        handlePinAuth(newPin);
      }
    }
  };

  const handlePinDelete = () => {
    setPin(pin.slice(0, -1));
  };

  if (showPinAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="flex items-center justify-center space-x-2 mb-4">
              <Heart className="w-10 h-10 text-pink-600" />
              <span className="text-2xl font-bold text-gray-900">GlicoGest</span>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Autenticação Segura</h1>
            <p className="text-gray-600">Digite seu PIN de 4 dígitos</p>
          </div>

          {/* PIN Authentication */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="mb-6">
              <div className="flex justify-center space-x-2 mb-4">
                {[1, 2, 3, 4].map((digit) => (
                  <div
                    key={digit}
                    className="w-12 h-12 border-2 border-gray-300 rounded-lg flex items-center justify-center text-xl font-bold"
                  >
                    {pin[digit - 1] ? '•' : ''}
                  </div>
                ))}
              </div>
            </div>

            {/* PIN Pad */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handlePinInput(num.toString())}
                  className="w-full h-12 bg-gray-100 hover:bg-gray-200 rounded-lg text-lg font-semibold transition-colors"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={handleBiometricAuth}
                className="w-full h-12 bg-blue-100 hover:bg-blue-200 rounded-lg flex items-center justify-center transition-colors"
              >
                <Fingerprint className="w-6 h-6 text-blue-600" />
              </button>
              <button
                onClick={() => handlePinInput('0')}
                className="w-full h-12 bg-gray-100 hover:bg-gray-200 rounded-lg text-lg font-semibold transition-colors"
              >
                0
              </button>
              <button
                onClick={handlePinDelete}
                className="w-full h-12 bg-red-100 hover:bg-red-200 rounded-lg text-lg font-semibold transition-colors"
              >
                ←
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg mb-4">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Back to Email Login */}
            <button
              onClick={() => setShowPinAuth(false)}
              className="w-full text-blue-600 hover:text-blue-700 text-sm transition-colors"
            >
              Voltar para login com email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="flex items-center justify-center space-x-2 mb-4">
            <Heart className="w-10 h-10 text-pink-600" />
            <span className="text-2xl font-bold text-gray-900">GlicoGest</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bem-vinda de volta</h1>
          <p className="text-gray-600">Acesse sua conta para monitorar sua saúde</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
                <span className="text-sm">Login realizado com sucesso! Redirecionando...</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center space-y-4">
            <Link 
              to="/forgot-password" 
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              Esqueceu sua senha?
            </Link>
            <div className="text-sm text-gray-600">
              Não tem uma conta?{' '}
              <Link 
                to="/register" 
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Cadastre-se gratuitamente
              </Link>
            </div>
          </div>

          {/* Demo Account */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Conta de demonstração:</p>
            <p className="text-xs text-gray-500">Email: gestante@demo.com</p>
            <p className="text-xs text-gray-500">Senha: demo123</p>
            <button
              type="button"
              onClick={() => setFormData({ email: 'gestante@demo.com', password: 'demo123' })}
              className="mt-2 text-xs text-blue-600 hover:text-blue-700 underline"
            >
              Preencher com dados de demonstração
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <Link to="/" className="hover:text-pink-600 transition-colors">
            ← Voltar para página inicial
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;