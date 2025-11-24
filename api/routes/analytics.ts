/**
 * This is an analytics API route.
 * Handle sheet analytics, insights, and chart recommendations.
 */
import { Router, type Request, type Response } from 'express'

const router = Router()

// Mock analytics data (in production this would be calculated from actual sheet data)
const mockAnalytics = {
  '1': {
    id: '1',
    sheetId: '1',
    totalRows: 150,
    totalColumns: 12,
    dataQuality: {
      completeness: 0.95,
      accuracy: 0.88,
      consistency: 0.92,
      duplicates: 5
    },
    columnAnalysis: [
      { name: 'Nome', type: 'text', nullCount: 0, uniqueCount: 150 },
      { name: 'Email', type: 'email', nullCount: 2, uniqueCount: 148 },
      { name: 'Idade', type: 'number', nullCount: 5, uniqueCount: 45 },
      { name: 'Cidade', type: 'text', nullCount: 8, uniqueCount: 25 }
    ],
    recommendations: [
      'Remover 5 registros duplicados',
      'Preencher 15 valores ausentes na coluna "Telefone"',
      'Validar formato de 2 emails inválidos',
      'Padronizar nomes de cidades (encontradas 25 variações)'
    ],
    createdAt: new Date().toISOString()
  },
  '2': {
    id: '2',
    sheetId: '2',
    totalRows: 320,
    totalColumns: 8,
    dataQuality: {
      completeness: 0.89,
      accuracy: 0.91,
      consistency: 0.87,
      duplicates: 12
    },
    columnAnalysis: [
      { name: 'Produto', type: 'text', nullCount: 0, uniqueCount: 45 },
      { name: 'Valor', type: 'currency', nullCount: 8, uniqueCount: 120 },
      { name: 'Data', type: 'date', nullCount: 3, uniqueCount: 180 },
      { name: 'Cliente', type: 'text', nullCount: 15, uniqueCount: 95 }
    ],
    recommendations: [
      'Remover 12 registros duplicados',
      'Preencher 26 valores ausentes',
      'Validar 3 datas inconsistentes',
      'Padronizar 45 nomes de produtos'
    ],
    createdAt: new Date().toISOString()
  }
}

// Mock insights data
const mockInsights = {
  '1': [
    {
      id: 'insight-1',
      type: 'trend',
      title: 'Crescimento de usuários',
      description: 'Detectado crescimento de 23% no número de usuários novos nos últimos 3 meses',
      confidence: 0.92,
      severity: 'positive',
      createdAt: new Date().toISOString()
    },
    {
      id: 'insight-2',
      type: 'anomaly',
      title: 'Anomalia detectada',
      description: 'Identificado pico incomum de registros no dia 15/01/2024',
      confidence: 0.85,
      severity: 'warning',
      createdAt: new Date().toISOString()
    },
    {
      id: 'insight-3',
      type: 'correlation',
      title: 'Correlação forte',
      description: 'Forte correlação (0.87) entre idade e preferência de produto',
      confidence: 0.87,
      severity: 'info',
      createdAt: new Date().toISOString()
    }
  ],
  '2': [
    {
      id: 'insight-4',
      type: 'trend',
      title: 'Aumento nas vendas',
      description: 'Vendas aumentaram 15% em comparação com o mês anterior',
      confidence: 0.94,
      severity: 'positive',
      createdAt: new Date().toISOString()
    },
    {
      id: 'insight-5',
      type: 'pattern',
      title: 'Padrão sazonal',
      description: 'Detectado padrão de vendas mais altas nas sextas-feiras',
      confidence: 0.89,
      severity: 'info',
      createdAt: new Date().toISOString()
    }
  ]
}

// Mock chart recommendations
const mockChartRecommendations = {
  '1': [
    {
      id: 'chart-1',
      type: 'bar',
      title: 'Distribuição por Cidade',
      description: 'Gráfico de barras mostrando a distribuição de usuários por cidade',
      data: {
        labels: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza'],
        datasets: [{
          label: 'Número de Usuários',
          data: [45, 32, 28, 25, 20],
          backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
        }]
      }
    },
    {
      id: 'chart-2',
      type: 'line',
      title: 'Crescimento ao Longo do Tempo',
      description: 'Gráfico de linha mostrando o crescimento de usuários ao longo do tempo',
      data: {
        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
        datasets: [{
          label: 'Novos Usuários',
          data: [120, 135, 150, 165, 180, 195],
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)'
        }]
      }
    },
    {
      id: 'chart-3',
      type: 'pie',
      title: 'Distribuição por Idade',
      description: 'Gráfico de pizza mostrando a distribuição de usuários por faixa etária',
      data: {
        labels: ['18-25', '26-35', '36-45', '46-55', '55+'],
        datasets: [{
          data: [25, 35, 20, 15, 5],
          backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6']
        }]
      }
    }
  ],
  '2': [
    {
      id: 'chart-4',
      type: 'bar',
      title: 'Vendas por Produto',
      description: 'Gráfico de barras mostrando vendas por produto',
      data: {
        labels: ['Produto A', 'Produto B', 'Produto C', 'Produto D', 'Produto E'],
        datasets: [{
          label: 'Total de Vendas',
          data: [12500, 9800, 8700, 7600, 6500],
          backgroundColor: '#10B981'
        }]
      }
    },
    {
      id: 'chart-5',
      type: 'line',
      title: 'Tendência de Vendas Diárias',
      description: 'Gráfico de linha mostrando a tendência de vendas diárias',
      data: {
        labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
        datasets: [{
          label: 'Vendas Diárias',
          data: [1200, 1350, 1100, 1400, 1800, 1600, 900],
          borderColor: '#F59E0B',
          backgroundColor: 'rgba(245, 158, 11, 0.1)'
        }]
      }
    }
  ]
}

/**
 * Get analytics for a specific sheet
 * GET /api/analytics/:sheetId
 */
router.get('/:sheetId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sheetId } = req.params;
    
    console.log('Getting analytics for sheet:', sheetId);
    
    const analytics = mockAnalytics[sheetId as keyof typeof mockAnalytics];
    
    if (!analytics) {
      res.status(404).json({ message: 'Análise não encontrada' });
      return;
    }
    
    res.json({ analytics });
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({ message: 'Erro ao carregar análise' });
  }
});

/**
 * Generate insights for a specific sheet
 * POST /api/analytics/:sheetId/insights
 */
router.post('/:sheetId/insights', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sheetId } = req.params;
    
    console.log('Generating insights for sheet:', sheetId);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const insights = mockInsights[sheetId as keyof typeof mockInsights] || [];
    
    res.json({ insights });
  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({ message: 'Erro ao gerar insights' });
  }
});

/**
 * Get chart recommendations for a specific sheet
 * POST /api/analytics/:sheetId/charts
 */
router.post('/:sheetId/charts', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sheetId } = req.params;
    
    console.log('Getting chart recommendations for sheet:', sheetId);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const charts = mockChartRecommendations[sheetId as keyof typeof mockChartRecommendations] || [];
    
    res.json({ charts });
  } catch (error) {
    console.error('Error getting chart recommendations:', error);
    res.status(500).json({ message: 'Erro ao gerar recomendações de gráficos' });
  }
});

export default router