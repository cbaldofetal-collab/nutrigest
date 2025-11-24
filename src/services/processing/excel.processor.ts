import * as XLSX from 'xlsx';
import { ProcessedData, SheetData, ColumnSchema, DataStatistics } from '@/types/file.types';

export class ExcelProcessor {
  /**
   * Processa um arquivo Excel e retorna os dados estruturados
   */
  async processFile(file: File): Promise<ProcessedData> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      
      const sheets = this.extractSheets(workbook);
      const data = this.mergeSheetData(sheets);
      const schema = this.inferSchema(data);
      const statistics = this.calculateStatistics(data, schema);

      return {
        sheets,
        data,
        schema,
        statistics
      };
    } catch (error) {
      throw new Error(`Erro ao processar arquivo Excel: ${error}`);
    }
  }

  /**
   * Extrai dados de todas as planilhas do workbook
   */
  private extractSheets(workbook: XLSX.WorkBook): SheetData[] {
    return workbook.SheetNames.map(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { defval: null });
      const headers = this.extractHeaders(worksheet);
      
      return {
        name: sheetName,
        data: Array.isArray(data) ? data : [data],
        headers
      };
    });
  }

  /**
   * Extrai cabeçalhos da planilha
   */
  private extractHeaders(worksheet: XLSX.WorkSheet): string[] {
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    const headers: string[] = [];
    
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: col });
      const cell = worksheet[cellAddress];
      const header = cell ? cell.v : `Coluna ${col + 1}`;
      headers.push(String(header));
    }
    
    return headers;
  }

  /**
   * Mescla dados de múltiplas planilhas
   */
  private mergeSheetData(sheets: SheetData[]): any[] {
    if (sheets.length === 0) return [];
    if (sheets.length === 1) return sheets[0].data;
    
    // Para múltiplas planilhas, adiciona o nome da planilha aos dados
    return sheets.flatMap(sheet => 
      sheet.data.map(row => ({
        ...row,
        __sheetName: sheet.name
      }))
    );
  }

  /**
   * Inferência de schema dos dados
   */
  private inferSchema(data: any[]): ColumnSchema[] {
    if (data.length === 0) return [];

    const columns = Object.keys(data[0]);
    
    return columns.map(column => {
      const values = data.map(row => row[column]).filter(v => v !== null && v !== undefined);
      const type = this.inferColumnType(values);
      
      return {
        name: column,
        type,
        nullable: values.length < data.length,
        unique: new Set(values).size === values.length,
        min: type === 'number' ? Math.min(...values) : undefined,
        max: type === 'number' ? Math.max(...values) : undefined,
        avg: type === 'number' ? values.reduce((a, b) => a + b, 0) / values.length : undefined,
        sampleValues: values.slice(0, 5)
      };
    });
  }

  /**
   * Inferência de tipo de coluna
   */
  private inferColumnType(values: any[]): ColumnSchema['type'] {
    if (values.length === 0) return 'string';

    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
    if (nonNullValues.length === 0) return 'string';

    // Verifica se é data
    if (nonNullValues.every(v => this.isDate(v))) {
      return 'date';
    }

    // Verifica se é número
    if (nonNullValues.every(v => this.isNumber(v))) {
      return 'number';
    }

    // Verifica se é booleano
    if (nonNullValues.every(v => typeof v === 'boolean' || v === 'true' || v === 'false')) {
      return 'boolean';
    }

    // Verifica se é moeda
    if (nonNullValues.every(v => this.isCurrency(v))) {
      return 'currency';
    }

    return 'string';
  }

  /**
   * Verifica se é uma data válida
   */
  private isDate(value: any): boolean {
    if (value instanceof Date) return true;
    if (typeof value === 'number') {
      // Excel date serial number
      return value > 0 && value < 100000;
    }
    if (typeof value === 'string') {
      return !isNaN(Date.parse(value));
    }
    return false;
  }

  /**
   * Verifica se é um número válido
   */
  private isNumber(value: any): boolean {
    if (typeof value === 'number') return true;
    if (typeof value === 'string') {
      return !isNaN(parseFloat(value)) && isFinite(parseFloat(value));
    }
    return false;
  }

  /**
   * Verifica se é um valor de moeda
   */
  private isCurrency(value: any): boolean {
    if (typeof value === 'string') {
      // Remove símbolos de moeda e verifica se é número
      const cleaned = value.replace(/[$R$\s,]/g, '');
      return this.isNumber(cleaned);
    }
    return this.isNumber(value);
  }

  /**
   * Calcula estatísticas dos dados
   */
  private calculateStatistics(data: any[], schema: ColumnSchema[]): DataStatistics {
    const totalRows = data.length;
    const totalColumns = schema.length;
    
    let nullCount = 0;
    const columnStats: Record<string, any> = {};

    schema.forEach(column => {
      const values = data.map(row => row[column.name]).filter(v => v !== null && v !== undefined);
      const nulls = data.length - values.length;
      nullCount += nulls;

      columnStats[column.name] = {
        type: column.type,
        count: values.length,
        nullCount: nulls,
        uniqueCount: new Set(values).size,
        ...(column.type === 'number' && {
          min: column.min,
          max: column.max,
          avg: column.avg,
          median: this.calculateMedian(values),
          standardDeviation: this.calculateStandardDeviation(values)
        })
      };
    });

    return {
      totalRows,
      totalColumns,
      nullCount,
      duplicateCount: totalRows - new Set(data.map(row => JSON.stringify(row))).size,
      columnStats
    };
  }

  /**
   * Calcula mediana
   */
  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }

  /**
   * Calcula desvio padrão
   */
  private calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    
    return Math.sqrt(avgSquaredDiff);
  }

  /**
   * Detecta outliers usando o método IQR
   */
  detectOutliers(columnName: string, data: any[]): any[] {
    const values = data.map(row => row[columnName]).filter(v => this.isNumber(v));
    if (values.length === 0) return [];

    const sorted = [...values].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;
    
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    return data.filter(row => {
      const value = row[columnName];
      return this.isNumber(value) && (value < lowerBound || value > upperBound);
    });
  }

  /**
   * Sugere tipos de gráficos baseados nos dados
   */
  suggestChartTypes(schema: ColumnSchema[]): string[] {
    const suggestions: string[] = [];
    
    const numericColumns = schema.filter(col => col.type === 'number');
    const categoricalColumns = schema.filter(col => col.type === 'string' && col.unique && col.unique);
    const dateColumns = schema.filter(col => col.type === 'date');

    if (numericColumns.length >= 2) {
      suggestions.push('scatter');
    }

    if (categoricalColumns.length > 0 && numericColumns.length > 0) {
      suggestions.push('bar', 'pie');
    }

    if (dateColumns.length > 0 && numericColumns.length > 0) {
      suggestions.push('line', 'area');
    }

    if (numericColumns.length > 0) {
      suggestions.push('histogram', 'boxplot');
    }

    return [...new Set(suggestions)];
  }
}