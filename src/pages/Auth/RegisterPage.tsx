import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useForm } from 'react-hook-form';
import { User, Mail, Lock, Baby, Key } from 'lucide-react';
import { toast } from 'sonner';

interface RegisterFormData {
  nome: string;
  email: string;
  password: string;
  confirmPassword: string;
  semana_gestacional: number;
  tipo_diabetes: 'DMG' | 'PRE_EXISTENTE';
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser, isLoading } = useAuthStore();
  const [step, setStep] = useState(1);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    trigger,
  } = useForm<RegisterFormData>();

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data.email, data.password, {
        nome: data.nome,
        semana_gestacional: data.semana_gestacional,
        tipo_diabetes: data.tipo_diabetes,
      });
      
      toast.success('Conta criada com sucesso!');
      navigate('/setup-pin');
    } catch (error) {
      toast.error('Erro ao criar conta. Tente novamente.');
    }
  };

  const nextStep = async () => {
    const isValid = await trigger(['nome', 'email', 'password', 'confirmPassword']);
    if (isValid) {
      setStep(2);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-green-50 to-teal-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-green-600 p-6 text-white">
            <div className="text-center">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Baby className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Criar Conta</h1>
              <p className="text-teal-100">Preencha seus dados para começar</p>
            </div>
          </div>

          {/* Progress */}
          <div className="px-6 pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Etapa {step} de 2</span>
              <span className="text-sm text-gray-500">{step === 1 ? 'Dados Pessoais' : 'Informações da Gestação'}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-teal-600 to-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: step === 1 ? '50%' : '100%' }}
              />
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            {step === 1 && (
              <>
                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      {...register('nome', { required: 'Nome é obrigatório' })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Seu nome completo"
                    />
                  </div>
                  {errors.nome && (
                    <p className="text-red-500 text-sm mt-1">{errors.nome.message}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      {...register('email', { 
                        required: 'Email é obrigatório',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Email inválido'
                        }
                      })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="seu@email.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="password"
                      {...register('password', { 
                        required: 'Senha é obrigatória',
                        minLength: {
                          value: 6,
                          message: 'Senha deve ter pelo menos 6 caracteres'
                        }
                      })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="password"
                      {...register('confirmPassword', { 
                        required: 'Confirme sua senha',
                        validate: value => value === password || 'As senhas não coincidem'
                      })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Repita sua senha"
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                {/* Semana Gestacional */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Semana Gestacional Atual
                  </label>
                  <div className="relative">
                    <Baby className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="number"
                      {...register('semana_gestacional', { 
                        required: 'Semana gestacional é obrigatória',
                        min: {
                          value: 1,
                          message: 'Deve ser entre 1 e 40 semanas'
                        },
                        max: {
                          value: 40,
                          message: 'Deve ser entre 1 e 40 semanas'
                        }
                      })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Ex: 24"
                    />
                  </div>
                  {errors.semana_gestacional && (
                    <p className="text-red-500 text-sm mt-1">{errors.semana_gestacional.message}</p>
                  )}
                </div>

                {/* Tipo Diabetes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Diabetes
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        {...register('tipo_diabetes')}
                        value="DMG"
                        defaultChecked
                        className="text-teal-600 focus:ring-teal-500"
                      />
                      <span className="ml-2 text-gray-700">Diabetes Gestacional (DMG)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        {...register('tipo_diabetes')}
                        value="PRE_EXISTENTE"
                        className="text-teal-600 focus:ring-teal-500"
                      />
                      <span className="ml-2 text-gray-700">Diabetes Pré-existente</span>
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* Navigation Buttons */}
            <div className="flex space-x-3 pt-4">
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Voltar
                </button>
              )}
              {step === 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 bg-gradient-to-r from-teal-600 to-green-600 text-white py-3 px-4 rounded-lg font-medium hover:from-teal-700 hover:to-green-700 transition-all duration-300"
                >
                  Próximo
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-teal-600 to-green-600 text-white py-3 px-4 rounded-lg font-medium hover:from-teal-700 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all duration-300"
                >
                  {isLoading ? 'Criando conta...' : 'Criar Conta'}
                </button>
              )}
            </div>
          </form>

          {/* Login Link */}
          <div className="text-center pb-6 space-y-3">
            <div>
              <button
                onClick={() => navigate('/forgot-password')}
                className="inline-flex items-center text-teal-600 hover:text-teal-700 font-medium transition-colors"
              >
                <Key className="w-4 h-4 mr-2" />
                Esqueceu sua senha?
              </button>
            </div>
            <p className="text-gray-600">
              Já tem uma conta?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-teal-600 hover:text-teal-700 font-medium transition-colors"
              >
                Entrar
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;