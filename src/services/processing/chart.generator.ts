import { ChartType, ChartConfig, ChartData, ChartDataset, ChartOptions } from '../../types/chart.types';

export class ChartGenerator {
  /**
   * Gera configuração de gráfico baseada nos dados e tipo
   */
  generateChart(
    type: ChartType, 
    data: any[], 
    xColumn: string, 
    yColumn: string,
    options: Partial<ChartOptions> = {}
  ): ChartConfig {
    const chartData = this.prepareChartData(data, xColumn, yColumn, type);
    const chartOptions = this.buildChartOptions(type, options);

    return {
      type,
      data: chartData,
      options: chartOptions,
      responsive: true,
      animation: true
    };
  }

  /**
   * Prepara dados para o gráfico
   */
  private prepareChartData(data: any[], xColumn: string, yColumn: string, type: ChartType): ChartData {
    const labels = this.extractLabels(data, xColumn, type);
    const datasets = this.createDatasets(data, xColumn, yColumn, type);

    return {
      labels,
      datasets
    };
  }

  /**
   * Extrai rótulos dos dados
   */
  private extractLabels(data: any[], xColumn: string, type: ChartType): string[] {
    if (type === 'pie' || type === 'donut') {
      // Para gráficos de pizza, agrupa por valores únicos
      const uniqueValues = [...new Set(data.map(row => row[xColumn]))];
      return uniqueValues.map(val => String(val));
    }

    // Para outros tipos, usa valores diretamente
    return data.map(row => String(row[xColumn]));
  }

  /**
   * Cria datasets para o gráfico
   */
  private createDatasets(data: any[], xColumn: string, yColumn: string, type: ChartType): ChartDataset[] {
    const colors = this.generateColors();

    if (type === 'pie' || type === 'donut') {
      // Agrupa dados para gráficos de pizza
      const groupedData = this.groupDataForPie(data, xColumn, yColumn);
      
      return [{
        label: yColumn,
        data: Object.values(groupedData),
        backgroundColor: colors.slice(0, Object.keys(groupedData).length),
        borderColor: '#fff',
        borderWidth: 2
      }];
    }

    // Para gráficos lineares/barras
    const values = data.map(row => Number(row[yColumn]) || 0);
    
    return [{
      label: yColumn,
      data: values,
      backgroundColor: type === 'line' ? 'transparent' : colors[0] + '80',
      borderColor: colors[0],
      borderWidth: type === 'line' ? 3 : 1,
      fill: type === 'area',
      tension: type === 'line' ? 0.4 : 0
    }];
  }

  /**
   * Agrupa dados para gráficos de pizza
   */
  private groupDataForPie(data: any[], xColumn: string, yColumn: string): Record<string, number> {
    const grouped: Record<string, number> = {};
    
    data.forEach(row => {
      const key = String(row[xColumn]);
      const value = Number(row[yColumn]) || 0;
      grouped[key] = (grouped[key] || 0) + value;
    });
    
    return grouped;
  }

  /**
   * Gera cores para o gráfico
   */
  private generateColors(): string[] {
    return [
      '#3B82F6', // blue
      '#10B981', // emerald
      '#F59E0B', // amber
      '#EF4444', // red
      '#8B5CF6', // violet
      '#06B6D4', // cyan
      '#84CC16', // lime
      '#F97316', // orange
      '#EC4899', // pink
      '#6B7280'  // gray
    ];
  }

  /**
   * Constrói opções do gráfico
   */
  private buildChartOptions(type: ChartType, customOptions: Partial<ChartOptions>): ChartOptions {
    const baseOptions: ChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: type === 'pie' || type === 'donut',
          position: 'bottom'
        },
        title: {
          display: false,
          text: ''
        },
        tooltip: {
          enabled: true
        }
      }
    };

    // Adiciona configurações específicas por tipo
    if (type === 'line' || type === 'bar' || type === 'area') {
      baseOptions.scales = {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Eixo X'
          }
        },
        y: {
          display: true,
          title: {
            display: true,
            text: 'Eixo Y'
          }
        }
      };
    }

    return { ...baseOptions, ...customOptions };
  }

  /**
   * Sugere configurações de gráfico baseadas nos dados
   */
  suggestChartConfiguration(
    data: any[], 
    columns: string[], 
    columnTypes: Record<string, string>
  ): Array<{ type: ChartType; xColumn: string; yColumn: string; reason: string }> {
    const suggestions: Array<{ type: ChartType; xColumn: string; yColumn: string; reason: string }> = [];
    
    const numericColumns = columns.filter(col => columnTypes[col] === 'number');
    const categoricalColumns = columns.filter(col => columnTypes[col] === 'string');
    const dateColumns = columns.filter(col => columnTypes[col] === 'date');

    // Gráfico de linhas para dados temporais
    if (dateColumns.length > 0 && numericColumns.length > 0) {
      suggestions.push({
        type: 'line',
        xColumn: dateColumns[0],
        yColumn: numericColumns[0],
        reason: 'Ideal para mostrar tendências ao longo do tempo'
      });
    }

    // Gráfico de barras para comparações
    if (categoricalColumns.length > 0 && numericColumns.length > 0) {
      suggestions.push({
        type: 'bar',
        xColumn: categoricalColumns[0],
        yColumn: numericColumns[0],
        reason: 'Perfeito para comparar valores entre categorias'
      });
    }

    // Gráfico de pizza para proporções
    if (categoricalColumns.length > 0 && numericColumns.length > 0) {
      suggestions.push({
        type: 'pie',
        xColumn: categoricalColumns[0],
        yColumn: numericColumns[0],
        reason: 'Excelente para mostrar proporções e percentuais'
      });
    }

    // Gráfico de dispersão para correlações
    if (numericColumns.length >= 2) {
      suggestions.push({
        type: 'scatter',
        xColumn: numericColumns[0],
        yColumn: numericColumns[1],
        reason: 'Mostra relações e correlações entre variáveis numéricas'
      });
    }

    return suggestions;
  }

  /**
   * Cria múltiplos gráficos para análise exploratória
   */
  createDashboardCharts(data: any[], columns: string[], columnTypes: Record<string, string>): ChartConfig[] {
    const suggestions = this.suggestChartConfiguration(data, columns, columnTypes);
    
    return suggestions.map(suggestion => 
      this.generateChart(
        suggestion.type,
        data,
        suggestion.xColumn,
        suggestion.yColumn,
        {
          plugins: {
            legend: { display: true, position: 'top' as const },
            title: {
              display: true,
              text: suggestion.reason
            },
            tooltip: { enabled: true }
          }
        }
      )
    );
  }
}