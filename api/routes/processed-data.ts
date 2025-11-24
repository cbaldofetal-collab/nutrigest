/**
 * This is a processed data API route.
 * Handle processed sheet data and exports.
 */
import { Router, type Request, type Response } from 'express'

const router = Router()

// Mock processed data (in production this would be calculated from actual sheet data)
const mockProcessedData = {
  '1': {
    id: '1',
    sheetId: '1',
    data: [
      { Nome: 'João Silva', Email: 'joao@email.com', Idade: 28, Cidade: 'São Paulo' },
      { Nome: 'Maria Santos', Email: 'maria@email.com', Idade: 32, Cidade: 'Rio de Janeiro' },
      { Nome: 'Pedro Oliveira', Email: 'pedro@email.com', Idade: 25, Cidade: 'Brasília' },
      { Nome: 'Ana Costa', Email: 'ana@email.com', Idade: 29, Cidade: 'Salvador' },
      { Nome: 'Carlos Mendes', Email: 'carlos@email.com', Idade: 35, Cidade: 'Fortaleza' }
    ],
    summary: {
      totalRows: 150,
      processedRows: 145,
      errorRows: 5,
      processingTime: 2.3,
      qualityScore: 0.92
    },
    createdAt: new Date().toISOString()
  },
  '2': {
    id: '2',
    sheetId: '2',
    data: [
      { Produto: 'Notebook Dell', Valor: 3500, Data: '2024-01-15', Cliente: 'Empresa ABC' },
      { Produto: 'Mouse Logitech', Valor: 150, Data: '2024-01-16', Cliente: 'João Silva' },
      { Produto: 'Teclado Mecânico', Valor: 450, Data: '2024-01-17', Cliente: 'Maria Santos' },
      { Produto: 'Monitor LG', Valor: 1200, Data: '2024-01-18', Cliente: 'Pedro Oliveira' },
      { Produto: 'Webcam HD', Valor: 280, Data: '2024-01-19', Cliente: 'Ana Costa' }
    ],
    summary: {
      totalRows: 320,
      processedRows: 308,
      errorRows: 12,
      processingTime: 3.1,
      qualityScore: 0.89
    },
    createdAt: new Date().toISOString()
  }
}

/**
 * Get processed data for a specific sheet
 * GET /api/processed-data/:sheetId
 */
router.get('/:sheetId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sheetId } = req.params;
    
    console.log('Getting processed data for sheet:', sheetId);
    
    const processedData = mockProcessedData[sheetId as keyof typeof mockProcessedData];
    
    if (!processedData) {
      res.status(404).json({ message: 'Dados processados não encontrados' });
      return;
    }
    
    res.json({ processedData });
  } catch (error) {
    console.error('Error getting processed data:', error);
    res.status(500).json({ message: 'Erro ao carregar dados processados' });
  }
})

/**
 * Export processed data in different formats
 * GET /api/processed-data/:sheetId/export?format=csv|json|pdf
 */
router.get('/:sheetId/export', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sheetId } = req.params;
    const { format = 'json' } = req.query;
    
    console.log('Exporting processed data for sheet:', sheetId, 'format:', format);
    
    const processedData = mockProcessedData[sheetId as keyof typeof mockProcessedData];
    
    if (!processedData) {
      res.status(404).json({ message: 'Dados processados não encontrados' });
      return;
    }
    
    const filename = `dados_processados_${sheetId}_${Date.now()}`;
    
    switch (format) {
      case 'csv':
        // Convert data to CSV format
        const csvData = convertToCSV(processedData.data);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
        res.send(csvData);
        break;
        
      case 'json':
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
        res.json(processedData);
        break;
        
      case 'pdf':
        // For demo purposes, return JSON with PDF generation message
        res.json({ 
          message: 'Exportação PDF em desenvolvimento',
          data: processedData,
          downloadUrl: `/api/processed-data/${sheetId}/export?format=json`
        });
        break;
        
      default:
        res.status(400).json({ message: 'Formato de exportação não suportado' });
    }
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ message: 'Erro ao exportar dados' });
  }
})

/**
 * Helper function to convert data to CSV format
 */
function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) return '';
  
  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV header
  const csvHeader = headers.join(',');
  
  // Create CSV rows
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      // Escape values that contain commas or quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });
  
  return [csvHeader, ...csvRows].join('\n');
}

export default router