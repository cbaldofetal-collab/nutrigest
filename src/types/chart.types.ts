// Tipos para gráficos e visualizações
export type ChartType = 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap' | 'treemap' | 'area' | 'donut';

export interface ChartConfig {
  type: ChartType;
  data: ChartData;
  options: ChartOptions;
  responsive: boolean;
  animation: boolean;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
}

export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins: {
    legend: {
      display: boolean;
      position: 'top' | 'bottom' | 'left' | 'right';
    };
    title: {
      display: boolean;
      text: string;
    };
    tooltip: {
      enabled: boolean;
    };
  };
  scales?: {
    x?: {
      display: boolean;
      title?: {
        display: boolean;
        text: string;
      };
    };
    y?: {
      display: boolean;
      title?: {
        display: boolean;
        text: string;
      };
    };
  };
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  config: DashboardConfig;
  widgets: Widget[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardConfig {
  layout: 'grid' | 'free';
  columns: number;
  theme: 'light' | 'dark';
  autoRefresh: boolean;
  refreshInterval: number;
}

export interface Widget {
  id: string;
  type: ChartType | 'kpi' | 'table' | 'text';
  title: string;
  config: WidgetConfig;
  position: WidgetPosition;
  size: WidgetSize;
}

export interface WidgetConfig {
  dataSource: string;
  chartType?: ChartType;
  filters?: FilterConfig[];
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  groupBy?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface WidgetPosition {
  x: number;
  y: number;
}

export interface WidgetSize {
  width: number;
  height: number;
}

export interface FilterConfig {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
  value: any;
}