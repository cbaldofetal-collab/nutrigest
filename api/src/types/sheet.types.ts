export interface Sheet {
  id: string;
  userId: string;
  name: string;
  originalName: string;
  size: number;
  rowCount: number;
  columnCount: number;
  status: 'processing' | 'completed' | 'error';
  settings: SheetSettings;
  filePath: string;
  errorMessage?: string;
  uploadedAt: Date;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SheetSettings {
  hasHeader: boolean;
  delimiter?: string;
  encoding?: string;
}

export interface ProcessedData {
  id: string;
  sheetId: string;
  headers: string[];
  rows: any[][];
  dataTypes: DataType[];
  statistics: DataStatistics;
  createdAt: Date;
}

export interface DataType {
  column: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  sampleValues: any[];
  nullCount: number;
  uniqueCount: number;
}

export interface DataStatistics {
  totalRows: number;
  totalColumns: number;
  missingValues: number;
  duplicateRows: number;
  dataQuality: number; // Score 0-100
  columnStats: ColumnStatistics[];
}

export interface ColumnStatistics {
  column: string;
  type: string;
  min?: number | Date;
  max?: number | Date;
  mean?: number;
  median?: number;
  mode?: any;
  stdDev?: number;
  nullCount: number;
  uniqueCount: number;
}

import type { Express } from 'express';

export interface UploadRequest {
  file: Express.Multer.File;
  name?: string;
  description?: string;
  settings?: Partial<SheetSettings>;
}

export interface UploadResponse {
  sheet: Sheet;
  preview: {
    headers: string[];
    rows: any[][];
    dataTypes: DataType[];
  };
}