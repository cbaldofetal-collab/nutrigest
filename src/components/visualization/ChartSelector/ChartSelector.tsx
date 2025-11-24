import React, { useState } from 'react';
import { ChartType } from '@/types/chart.types';
import { BarChart3, LineChart, PieChart, ScatterChart, Activity, Circle } from 'lucide-react';

interface ChartSelectorProps {
  selectedChart: ChartType | null;
  onChartSelect: (chartType: ChartType) => void;
  availableCharts?: ChartType[];
}

const ChartSelector: React.FC<ChartSelectorProps> = ({ 
  selectedChart, 
  onChartSelect, 
  availableCharts = ['line', 'bar', 'pie', 'scatter', 'area']
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const chartTypes = [
    {
      type: 'line' as ChartType,
      name: 'Linha',
      description: 'Ideal para tendências ao longo do tempo',
      icon: <LineChart className="h-5 w-5" />,
      color: 'text-blue-600'
    },
    {
      type: 'bar' as ChartType,
      name: 'Barras',
      description: 'Perfeito para comparações entre categorias',
      icon: <BarChart3 className="h-5 w-5" />,
      color: 'text-green-600'
    },
    {
      type: 'pie' as ChartType,
      name: 'Pizza',
      description: 'Excelente para mostrar proporções',
      icon: <PieChart className="h-5 w-5" />,
      color: 'text-purple-600'
    },
    {
      type: 'scatter' as ChartType,
      name: 'Dispersão',
      description: 'Mostra relações entre variáveis',
      icon: <ScatterChart className="h-5 w-5" />,
      color: 'text-orange-600'
    },
    {
      type: 'area' as ChartType,
      name: 'Área',
      description: 'Similar ao gráfico de linha com preenchimento',
      icon: <Activity className="h-5 w-5" />,
      color: 'text-cyan-600'
    },
    {
      type: 'donut' as ChartType,
      name: 'Donut',
      description: 'Variação do gráfico de pizza',
      icon: <Circle className="h-5 w-5" />,
      color: 'text-pink-600'
    }
  ];

  const filteredChartTypes = chartTypes.filter(chart => 
    availableCharts.includes(chart.type)
  );

  const selectedChartInfo = chartTypes.find(chart => chart.type === selectedChart);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-left hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {selectedChartInfo ? (
              <>
                <div className={selectedChartInfo.color}>
                  {selectedChartInfo.icon}
                </div>
                <span className="ml-3 font-medium">{selectedChartInfo.name}</span>
              </>
            ) : (
              <span className="text-gray-500">Selecione um tipo de gráfico</span>
            )}
          </div>
          <svg
            className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="py-1">
            {filteredChartTypes.map((chart) => (
              <button
                key={chart.type}
                onClick={() => {
                  onChartSelect(chart.type);
                  setIsOpen(false);
                }}
                className={`
                  w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none
                  ${selectedChart === chart.type ? 'bg-blue-50 border-l-4 border-blue-500' : ''}
                `}
              >
                <div className="flex items-center">
                  <div className={chart.color}>
                    {chart.icon}
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">{chart.name}</p>
                    <p className="text-sm text-gray-600">{chart.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartSelector;