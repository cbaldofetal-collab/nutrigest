import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartType as ChartJSType
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { ChartConfig } from '../../../types/chart.types';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartRendererProps {
  config: ChartConfig;
  height?: number;
  width?: number;
}

const ChartRenderer: React.FC<ChartRendererProps> = ({ 
  config, 
  height = 400, 
  width 
}) => {
  const renderChart = () => {
    const chartProps = {
      data: config.data,
      options: {
        ...config.options,
        responsive: config.responsive,
        maintainAspectRatio: false,
        animation: config.animation ? undefined : false as any
      },
      height,
      width
    };

    switch (config.type as string) {
      case 'line':
        return <Chart type="line" {...chartProps} />;
      case 'bar':
        return <Chart type="bar" {...chartProps} />;
      case 'pie':
        return <Chart type="pie" {...chartProps} />;
      case 'doughnut':
      case 'donut':
        return <Chart {...chartProps} type="doughnut" key="doughnut" />;
      case 'scatter':
        return <Chart type="scatter" {...chartProps} />;
      case 'area':
        return (
          <Chart 
            type="line" 
            {...chartProps}
            data={{
              ...config.data,
              datasets: config.data.datasets.map(dataset => ({
                ...dataset,
                fill: true
              }))
            }}
          />
        );
      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="font-medium">Tipo de gráfico não suportado</p>
              <p className="text-sm">Tipo: {config.type}</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="chart-container" style={{ height: `${height}px` }}>
        {renderChart()}
      </div>
    </div>
  );
};

export default ChartRenderer;