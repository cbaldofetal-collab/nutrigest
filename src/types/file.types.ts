// Tipos para arquivos e processamento
export interface FileUpload {
  id: string;
  filename: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  metadata: FileMetadata;
  columnSchema: ColumnSchema[];
  rowCount: number;
  processedAt?: Date;
  createdAt: Date;
}

export interface FileMetadata {
  sheets?: string[];
  headers?: string[];
  dataTypes?: Record<string, string>;
  hasFormulas?: boolean;
  hasCharts?: boolean;
}

export interface ColumnSchema {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'currency';
  nullable: boolean;
  unique: boolean;
  min?: number;
  max?: number;
  avg?: number;
  sampleValues: any[];
}

export interface ProcessedData {
  sheets: SheetData[];
  data: any[];
  schema: ColumnSchema[];
  statistics: DataStatistics;
}

export interface SheetData {
  name: string;
  data: any[];
  headers: string[];
}

export interface DataStatistics {
  totalRows: number;
  totalColumns: number;
  nullCount: number;
  duplicateCount: number;
  columnStats: Record<string, ColumnStatistics>;
}

export interface ColumnStatistics {
  type: string;
  count: number;
  nullCount: number;
  uniqueCount: number;
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  mode?: any[];
  standardDeviation?: number;
}