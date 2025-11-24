export enum DataType {
  STRING = 'string',
  NUMBER = 'number',
  DATE = 'date',
  BOOLEAN = 'boolean',
  EMAIL = 'email',
  PHONE = 'phone',
  URL = 'url',
  CURRENCY = 'currency',
  PERCENTAGE = 'percentage',
}

export interface ProcessedFile {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  headers: string[];
  rows: any[][];
  dataTypes: DataType[];
  rowCount: number;
  columnCount: number;
  processedAt: Date;
}

import type { Express } from 'express';

export class FileService {
  async processFile(file: Express.Multer.File): Promise<ProcessedFile> {
    // Mock file processing for now
    return {
      id: 'mock-file-id',
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      headers: ['Coluna1', 'Coluna2', 'Coluna3'],
      rows: [
        ['Dado1', 'Dado2', 'Dado3'],
        ['Dado4', 'Dado5', 'Dado6']
      ],
      dataTypes: [DataType.STRING, DataType.STRING, DataType.STRING],
      rowCount: 2,
      columnCount: 3,
      processedAt: new Date()
    };
  }

  detectDataType(value: string): DataType {
    if (!value || value.trim() === '') return DataType.STRING;
    
    const trimmed = value.trim();
    
    // Number detection
    if (/^-?\d+\.?\d*$/.test(trimmed)) {
      return DataType.NUMBER;
    }
    
    // Date detection
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed) || /^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      return DataType.DATE;
    }
    
    // Boolean detection
    if (/^(true|false|sim|não|yes|no)$/i.test(trimmed)) {
      return DataType.BOOLEAN;
    }
    
    // Email detection
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return DataType.EMAIL;
    }
    
    // Phone detection
    if (/^\+?\d{10,15}$/.test(trimmed.replace(/[\s\-\(\)]/g, ''))) {
      return DataType.PHONE;
    }
    
    // URL detection
    if (/^https?:\/\/.+/.test(trimmed)) {
      return DataType.URL;
    }
    
    // Currency detection
    if (/^[R$\$€£]\s?\d+/.test(trimmed)) {
      return DataType.CURRENCY;
    }
    
    // Percentage detection
    if (/\d+%$/.test(trimmed)) {
      return DataType.PERCENTAGE;
    }
    
    return DataType.STRING;
  }
}

export const processExcelFile = async (filePath: string): Promise<ProcessedFile> => {
  const fileService = new FileService();
  // Mock implementation - in real app would read file from path
  return fileService.processFile({} as Express.Multer.File);
};

export const processCSVFile = async (filePath: string): Promise<ProcessedFile> => {
  const fileService = new FileService();
  // Mock implementation - in real app would read file from path
  return fileService.processFile({} as Express.Multer.File);
};

export const fileService = new FileService();