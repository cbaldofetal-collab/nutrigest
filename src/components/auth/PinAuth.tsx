import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { ShieldCheck, Fingerprint, ArrowLeft } from 'lucide-react';

interface PinAuthProps {
  onSuccess: () => void;
  onBack?: () => void;
}

const PinAuth: React.FC<PinAuthProps> = ({ onSuccess, onBack }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { profile, setPinAuthenticated } = useAuthStore();

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Simple PIN validation - in a real app, this would be hashed and verified server-side
      const isValid = await validatePin(pin);
      
      if (isValid) {
        setPinAuthenticated(true);
        onSuccess();
      } else {
        setError('PIN incorreto. Tente novamente.');
      }
    } catch (err) {
      setError('Erro ao verificar PIN. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const validatePin = async (pin: string): Promise<boolean> => {
    // In a real application, this would verify against the hashed PIN stored in the database
    // For demo purposes, we'll check against a simple hash or the stored hash
    if (profile?.pin_hash) {
      // This would be a proper hash comparison in production
      return pin.length >= 4; // Simple length check for demo
    }
    return pin.length >= 4; // Default validation
  };

  const handleBiometricAuth = async () => {
    setError('');
    setIsLoading(true);

    try {
      // Check if biometric authentication is available and supported
      if ('credentials' in navigator && 'create' in (navigator as any).credentials) {
        const credential = await (navigator as any).credentials.get({
          publicKey: {
            challenge: new Uint8Array(32),
            rpId: window.location.hostname,
            userVerification: 'preferred',
            timeout: 60000,
          },
        });

        if (credential) {
          setPinAuthenticated(true);
          onSuccess();
        } else {
          setError('Autenticação biométrica falhou.');
        }
      } else {
        setError('Biometria não suportada neste dispositivo.');
      }
    } catch (err) {
      setError('Erro na autenticação biométrica.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinChange = (value: string, index: number) => {
    if (value.length <= 1) {
      const newPin = pin.split('');
      newPin[index] = value;
      setPin(newPin.join(''));
      
      // Auto-focus next input
      if (value && index < 3) {
        const nextInput = document.getElementById(`pin-input-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      const prevInput = document.getElementById(`pin-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            {onBack && (
              <button
                onClick={onBack}
                className="absolute top-4 left-4 p-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">NutriGest</h1>
            <p className="text-gray-600">Digite seu PIN para acessar</p>
          </div>

          {/* PIN Input */}
          <form onSubmit={handlePinSubmit} className="space-y-6">
            <div className="flex justify-center space-x-3">
              {[0, 1, 2, 3].map((index) => (
                <input
                  key={index}
                  id={`pin-input-${index}`}
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={pin[index] || ''}
                  onChange={(e) => handlePinChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
                  disabled={isLoading}
                  autoComplete="off"
                />
              ))}
            </div>

            {error && (
              <div className="text-center">
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={pin.length !== 4 || isLoading}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Verificando...' : 'Acessar'}
            </button>
          </form>

          {/* Biometric Authentication */}
          {profile?.biometria_ativada && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-center">
                <p className="text-gray-600 text-sm mb-3">Ou use biometria</p>
                <button
                  onClick={handleBiometricAuth}
                  disabled={isLoading}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  <Fingerprint className="w-5 h-5" />
                  <span>Usar Biometria</span>
                </button>
              </div>
            </div>
          )}

          {/* Forgot PIN */}
          <div className="mt-6 text-center">
            <button className="text-purple-600 hover:text-purple-700 text-sm font-medium transition-colors">
              Esqueceu seu PIN?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PinAuth;