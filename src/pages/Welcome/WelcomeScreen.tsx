import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { ChevronRight, Baby, Heart, Shield, CheckCircle } from 'lucide-react';

const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: <Baby className="w-16 h-16 text-purple-600" />,
      title: "Bem-vinda ao NutriGest",
      description: "Seu companheiro digital para monitoramento nutricional na gestação. Cuide da sua alimentação com segurança e praticidade."
    },
    {
      icon: <Heart className="w-16 h-16 text-pink-600" />,
      title: "Cuide da sua saúde",
      description: "Registre suas refeições e nutrientes de forma rápida e intuitiva. Receba recomendações personalizadas e acompanhe sua evolução."
    },
    {
      icon: <Shield className="w-16 h-16 text-green-600" />,
      title: "Seus dados protegidos",
      description: "Segurança e privacidade são nossa prioridade. Seus dados de saúde estão protegidos e sob seu controle total."
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate('/register');
    }
  };

  const handleSkip = () => {
    navigate('/register');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Progress indicator */}
          <div className="flex justify-center space-x-2 p-6 bg-gradient-to-r from-purple-50 to-pink-50">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-8 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'bg-purple-600 w-12'
                    : index < currentStep
                    ? 'bg-purple-300'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="p-8 text-center">
            <div className="mb-8 flex justify-center">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                {steps[currentStep].icon}
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {steps[currentStep].title}
            </h1>

            <p className="text-gray-600 text-lg leading-relaxed mb-8">
              {steps[currentStep].description}
            </p>

            {/* Step indicators */}
            <div className="flex justify-center space-x-2 mb-8">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentStep
                      ? 'bg-purple-600'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 pb-8">
            <div className="flex space-x-3">
              <button
                onClick={handleSkip}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Pular
              </button>
              <button
                onClick={handleNext}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <span>{currentStep === steps.length - 1 ? 'Começar' : 'Próximo'}</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* App name */}
        <div className="text-center mt-6">
          <p className="text-teal-600 font-semibold text-lg">NutriGest</p>
          <p className="text-gray-500 text-sm">Monitoramento Nutricional Inteligente para Gestantes</p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;