const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Mock data
const mockUsers = [
  {
    id: '1',
    name: 'Demo User',
    email: 'demo@example.com',
    password: 'demo123',
    plan: 'free',
    createdAt: '2024-01-01T00:00:00.000Z'
  }
];

const mockSheets = [
  {
    id: '1',
    originalName: 'sample.xlsx',
    fileName: 'sample_1234567890.xlsx',
    fileSize: 1024,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    userId: '1',
    status: 'processed',
    analytics: {
      totalRows: 100,
      totalColumns: 5,
      dataTypes: ['string', 'number', 'date', 'boolean'],
      missingValues: 2,
      uniqueValues: 85
    },
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }
];

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth endpoints
app.post('/api/auth/register', (req, res) => {
  console.log('Register endpoint called');
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  // Check if email already exists
  const existingUser = mockUsers.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ message: 'Email já cadastrado' });
  }
  
  // Create new user
  const newUser = {
    id: String(mockUsers.length + 1),
    name,
    email,
    password: 'hashed-password',
    plan: 'free',
    createdAt: new Date().toISOString()
  };
  
  mockUsers.push(newUser);
  
  const response = {
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      plan: newUser.plan,
      createdAt: newUser.createdAt
    },
    tokens: {
      accessToken: 'mock-access-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now(),
      expiresIn: Math.floor(Date.now() / 1000) + 900
    }
  };
  
  res.status(201).json(response);
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios' });
  }
  
  const user = mockUsers.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ message: 'Credenciais inválidas' });
  }
  
  if (password !== 'demo123') {
    return res.status(401).json({ message: 'Credenciais inválidas' });
  }
  
  const response = {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      plan: user.plan,
      createdAt: user.createdAt
    },
    tokens: {
      accessToken: 'mock-access-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now(),
      expiresIn: Math.floor(Date.now() / 1000) + 900
    }
  };
  
  res.json(response);
});

// Sheets endpoints
app.get('/api/sheets', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  const paginatedSheets = mockSheets.slice(startIndex, endIndex);
  
  res.json({
    sheets: paginatedSheets,
    pagination: {
      page,
      limit,
      total: mockSheets.length,
      pages: Math.ceil(mockSheets.length / limit)
    }
  });
});

app.get('/api/sheets/:id', (req, res) => {
  const sheet = mockSheets.find(s => s.id === req.params.id);
  if (!sheet) {
    return res.status(404).json({ message: 'Planilha não encontrada' });
  }
  res.json({ sheet });
});

app.post('/api/sheets/upload', (req, res) => {
  console.log('Upload endpoint called');
  console.log('Request body:', req.body);
  console.log('Request files:', req.files);
  
  // For demo purposes, we'll simulate a successful upload
  const newSheet = {
    id: String(mockSheets.length + 1),
    originalName: 'uploaded_file.xlsx',
    fileName: 'uploaded_file_' + Date.now() + '.xlsx',
    fileSize: 2048,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    userId: '1',
    status: 'processing',
    analytics: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  mockSheets.push(newSheet);
  
  res.status(201).json({
    sheet: newSheet,
    message: 'Arquivo enviado com sucesso! Processando...'
  });
});

// Analytics endpoints
app.get('/api/sheets/:id/analytics', (req, res) => {
  const sheet = mockSheets.find(s => s.id === req.params.id);
  if (!sheet) {
    return res.status(404).json({ message: 'Planilha não encontrada' });
  }
  
  const mockAnalytics = {
    summary: {
      totalRows: 100,
      totalColumns: 5,
      dataQuality: 95,
      missingValues: 2,
      uniqueValues: 85
    },
    columnAnalysis: [
      {
        column: 'Nome',
        type: 'string',
        uniqueValues: 85,
        missingValues: 0,
        maxLength: 50,
        minLength: 2
      },
      {
        column: 'Idade',
        type: 'number',
        average: 35.2,
        min: 18,
        max: 65,
        missingValues: 1
      }
    ],
    recommendations: [
      {
        type: 'chart',
        chartType: 'bar',
        title: 'Distribuição por Idade',
        description: 'Gráfico de barras mostrando a distribuição de idades',
        xColumn: 'Idade',
        yColumn: 'count'
      }
    ]
  };
  
  res.json({ analytics: mockAnalytics });
});

// Export endpoint
app.get('/api/processed-data/:id/export', (req, res) => {
  const format = req.query.format || 'csv';
  const id = req.params.id;
  
  console.log('Export request for sheet:', id, 'format:', format);
  
  try {
    if (format === 'csv') {
      const csvContent = `Nome,Idade,Email
João Silva,30,joao@example.com
Maria Santos,25,maria@example.com
Pedro Oliveira,35,pedro@example.com`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="dados_exportados_${id}.csv"`);
      res.send(csvContent);
    } else if (format === 'json') {
      const jsonData = [
        { Nome: 'João Silva', Idade: 30, Email: 'joao@example.com' },
        { Nome: 'Maria Santos', Idade: 25, Email: 'maria@example.com' },
        { Nome: 'Pedro Oliveira', Idade: 35, Email: 'pedro@example.com' }
      ];
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="dados_exportados_${id}.json"`);
      res.json(jsonData);
    } else {
      res.status(400).json({ message: 'Formato não suportado' });
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Erro ao exportar dados' });
  }
});

// Catch-all handler for API routes
app.all('/api/*', (req, res) => {
  console.log('Unhandled API route:', req.method, req.path);
  res.status(404).json({ message: 'Rota não encontrada' });
});

// For Vercel serverless functions
if (process.env.VERCEL) {
  module.exports = app;
} else {
  // For local development
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}