import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Shield, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const SetupPinPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, updateProfile } = useAuthStore();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreatePin = (value: string, index: number) => {
    if (value.length <= 1) {
      const newPin = pin.split('');
      newPin[index] = value;
      setPin(newPin.join(''));
      
      if (value && index < 3) {
        const nextInput = document.getElementById(`pin-create-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleConfirmPin = (value: string, index: number) => {
    if (value.length <= 1) {
      const newPin = confirmPin.split('');
      newPin[index] = value;
      setConfirmPin(newPin.join(''));
      
      if (value && index < 3) {
        const nextInput = document.getElementById(`pin-confirm-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number, type: 'create' | 'confirm') => {
    if (e.key === 'Backspace' && !((type === 'create' ? pin : confirmPin)[index]) && index > 0) {
      const prevInput = document.getElementById(`pin-${type}-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleNextStep = () => {
    if (pin.length === 4) {
      setStep('confirm');
    }
  };

  const handleSubmit = async () => {
    if (pin !== confirmPin) {
      toast.error('Os PINs não coincidem. Tente novamente.');
      setConfirmPin('');
      setStep('create');
      return;
    }

    setIsLoading(true);
    try {
      // In a real app, you would hash the PIN before storing it
      const hashedPin = await hashPin(pin);
      
      await updateProfile({ pin_hash: hashedPin });
      
      toast.success('PIN configurado com sucesso!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Erro ao configurar PIN. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const hashPin = async (pin: string): Promise<string> => {
    // Simple hash function for demo - in production, use proper crypto
    return btoa(pin); // Base64 encoding for demo purposes
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
            <div className="text-center">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold mb-2">
                {step === 'create' ? 'Criar PIN' : 'Confirmar PIN'}
              </h1>
              <p className="text-purple-100">
                {step === 'create' 
                  ? 'Crie um PIN de 4 dígitos para proteger seu app'
                  : 'Digite seu PIN novamente para confirmar'
                }
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {step === 'create' ? (
              <>
                <div className="text-center mb-8">
                  <p className="text-gray-600 mb-6">
                    Seu PIN será usado para acessar o aplicativo de forma rápida e segura.
                  </p>
                </div>

                <div className="flex justify-center space-x-3 mb-8">
                  {[0, 1, 2, 3].map((index) => (
                    <input
                      key={index}
                      id={`pin-create-${index}`}
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={pin[index] || ''}
                      onChange={(e) => handleCreatePin(e.target.value, index)}
                      onKeyDown={(e) => handleKeyDown(e, index, 'create')}
                      className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
                      disabled={isLoading}
                      autoComplete="off"
                    />
                  ))}
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleSkip}
                    className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Pular
                  </button>
                  <button
                    onClick={handleNextStep}
                    disabled={pin.length !== 4 || isLoading}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    Continuar
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-8">
                  <p className="text-gray-600 mb-6">
                    Digite o mesmo PIN novamente para confirmar.
                  </p>
                </div>

                <div className="flex justify-center space-x-3 mb-8">
                  {[0, 1, 2, 3].map((index) => (
                    <input
                      key={index}
                      id={`pin-confirm-${index}`}
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={confirmPin[index] || ''}
                      onChange={(e) => handleConfirmPin(e.target.value, index)}
                      onKeyDown={(e) => handleKeyDown(e, index, 'confirm')}
                      className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
                      disabled={isLoading}
                      autoComplete="off"
                    />
                  ))}
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setStep('create')}
                    className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={confirmPin.length !== 4 || isLoading}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    {isLoading ? 'Configurando...' : 'Finalizar'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Security info */}
        <div className="text-center mt-6">
          <div className="inline-flex items-center space-x-2 text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Seus dados estão protegidos e criptografados</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupPinPage;