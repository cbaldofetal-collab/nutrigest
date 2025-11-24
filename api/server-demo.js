const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const glucoseRoutes = require('./dist/src/routes/glucose.routes').default;
const databaseService = require('./dist/src/services/database.service').default;
const authService = require('./dist/src/services/auth.service').default;

// JWT secret from environment or default (must match auth service)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const app = express();
const PORT = process.env.PORT || 3001;

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: { message: 'Access token required' } 
    });
  }
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ 
        success: false, 
        error: { message: 'Invalid or expired token' } 
      });
    }
    req.user = decoded;
    next();
  });
};

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept Excel and CSV files - more permissive for demo
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
      'application/csv', // .csv alternative
      'text/plain', // .csv as plain text
      'application/octet-stream', // Generic binary
    ];
    
    // Also check file extension
    const allowedExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      console.log(`Arquivo rejeitado: ${file.originalname} (MIME: ${file.mimetype})`);
      cb(new Error(`Tipo de arquivo não permitido. Use Excel (.xlsx, .xls) ou CSV (.csv). MIME recebido: ${file.mimetype}`));
    }
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:4173', 'https://traesms2lg1s.vercel.app'],
  credentials: true
}));
app.use(compression());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Apply JSON parser only to non-multipart routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mock data para demonstração
const mockUsers = [
  {
    id: '1',
    name: 'Demo User',
    email: 'demo@example.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: demo123
    plan: 'free',
    createdAt: '2024-01-01T00:00:00Z'
  }
];

const mockSheets = [
  {
    id: '1',
    filename: 'vendas_q4.xlsx',
    originalName: 'Vendas Q4 2024.xlsx',
    fileSize: 1024000,
    uploadDate: '2024-01-15T10:30:00Z',
    processed: true,
    rowCount: 150,
    columnCount: 8,
    userId: '1'
  },
  {
    id: '2',
    filename: 'clientes.csv',
    originalName: 'Base de Clientes.csv',
    fileSize: 512000,
    uploadDate: '2024-01-14T14:20:00Z',
    processed: true,
    rowCount: 89,
    columnCount: 12,
    userId: '1'
  }
];

// Real authentication endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: { message: 'Email e senha são obrigatórios' }
      });
    }
    
    const result = await authService.login(email, password);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ 
      success: false,
      error: { message: error.message || 'Credenciais inválidas' }
    });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        error: { message: 'Nome, email e senha são obrigatórios' }
      });
    }
    
    const result = await authService.register({ name, email, password });
    
    res.status(201).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.message.includes('already exists')) {
      return res.status(400).json({ 
        success: false,
        error: { message: 'Email já cadastrado' }
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: { message: 'Erro ao criar conta' }
    });
  }
});

// Mock sheets endpoints
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

app.post('/api/sheets/upload', upload.single('file'), (req, res) => {
  console.log('Upload endpoint hit');
  console.log('Request headers:', req.headers);
  console.log('Request body keys:', Object.keys(req.body || {}));
  console.log('Request file:', req.file);
  
  try {
    if (!req.file) {
      console.log('No file received in request');
      return res.status(400).json({ message: 'Nenhum arquivo enviado' });
    }

    // Simular upload de arquivo com informações do arquivo real
    const file = req.file;
    const originalName = file.originalname;
    const fileSize = file.size;
    const filename = `${Date.now()}_${originalName}`;

    // Simular análise do arquivo (em produção, isso seria feito realmente)
    const estimatedRows = Math.floor(fileSize / 100); // Estimativa simples
    const estimatedColumns = Math.floor(Math.random() * 10) + 3; // Entre 3-12 colunas

    const newSheet = {
      id: String(mockSheets.length + 1),
      filename: filename,
      originalName: originalName,
      fileSize: fileSize,
      uploadDate: new Date().toISOString(),
      processed: true,
      rowCount: Math.min(estimatedRows, 1000), // Limitar a 1000 linhas para demo
      columnCount: estimatedColumns,
      userId: '1'
    };
    
    mockSheets.push(newSheet);
    
    res.status(201).json({
      message: 'Arquivo enviado e processado com sucesso',
      sheet: newSheet
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ message: 'Erro ao processar arquivo' });
  }
});

// Mock analytics endpoints
app.get('/api/analytics/:id', (req, res) => {
  const mockAnalytics = {
    insights: [
      'As vendas aumentaram 23% no último trimestre',
      'O produto A representa 45% do faturamento total',
      'Há uma tendência de crescimento consistente nas vendas online'
    ],
    charts: [
      {
        id: '1',
        type: 'line',
        title: 'Evolução de Vendas',
        description: 'Demonstra o crescimento das vendas ao longo do tempo',
        data: {},
        options: {}
      },
      {
        id: '2',
        type: 'bar',
        title: 'Vendas por Categoria',
        description: 'Comparação entre diferentes categorias de produtos',
        data: {},
        options: {}
      }
    ],
    statistics: {
      totalRows: 150,
      totalColumns: 8,
      dataTypes: { 'string': 3, 'number': 4, 'date': 1 },
      missingValues: 12,
      duplicateRows: 5
    }
  };
  
  res.json({ analytics: mockAnalytics });
});

app.post('/api/analytics/:id/insights', (req, res) => {
  const newInsights = {
    insights: [
      'Nova análise: Pico de vendas em dezembro',
      'Clientes fiéis representam 60% das vendas',
      'Campanhas de marketing têm ROI de 340%'
    ],
    charts: [],
    statistics: {
      totalRows: 150,
      totalColumns: 8,
      dataTypes: { 'string': 3, 'number': 4, 'date': 1 },
      missingValues: 12,
      duplicateRows: 5
    }
  };
  
  res.json({ analytics: newInsights });
});

// Refresh token endpoint
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ 
        success: false,
        error: { message: 'Refresh token é obrigatório' }
      });
    }
    
    // In a real app, you would validate the refresh token and issue a new access token
    // For demo purposes, we'll accept any refresh token and issue a new access token
    const newAccessToken = jwt.sign(
      { userId: 'demo-user-id' }, 
      JWT_SECRET, 
      { expiresIn: '15m' }
    );
    
    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: refreshToken, // Return the same refresh token for demo
        expiresIn: 900000 // 15 minutes in milliseconds
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ 
      success: false,
      error: { message: 'Refresh token inválido' }
    });
  }
});

// User profile routes
app.post('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const profileData = req.body;
    
    // Prepare update data with only provided fields (removed data_diagnostico and data_parto_prevista)
    const updateData = {
      updated_at: new Date().toISOString()
    };
    
    if (profileData.nome) updateData.nome = profileData.nome;
    if (profileData.semana_gestacional !== undefined) updateData.semana_gestacional = profileData.semana_gestacional;
    if (profileData.tipo_diabetes) updateData.tipo_diabetes = profileData.tipo_diabetes;
    if (profileData.configuracoes) updateData.configuracoes = JSON.stringify(profileData.configuracoes);
    
    // Update user with profile data
    const updatedUser = await databaseService.updateUser(userId, updateData);
    
    res.json({
      success: true,
      data: updatedUser,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error creating user profile:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Erro ao criar perfil do usuário' },
      timestamp: new Date().toISOString(),
    });
  }
});

app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await databaseService.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'Usuário não encontrado' },
        timestamp: new Date().toISOString(),
      });
    }
    
    res.json({
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Erro ao buscar perfil do usuário' },
      timestamp: new Date().toISOString(),
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Glucose management routes (real database)
app.use('/api/glucose', glucoseRoutes);

// Export data endpoint
app.get('/api/processed-data/:id/export', (req, res) => {
  const { id } = req.params;
  const { format } = req.query;
  
  if (!format || !['csv', 'json', 'pdf'].includes(format)) {
    return res.status(400).json({ message: 'Formato de exportação inválido' });
  }
  
  // Mock data for export
  const mockData = {
    csv: 'coluna1,coluna2,coluna3\nvalor1,valor2,valor3\nvalor4,valor5,valor6',
    json: JSON.stringify([
      { coluna1: 'valor1', coluna2: 'valor2', coluna3: 'valor3' },
      { coluna1: 'valor4', coluna2: 'valor5', coluna3: 'valor6' }
    ], null, 2),
    pdf: '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF'
  };
  
  const contentTypes = {
    csv: 'text/csv',
    json: 'application/json',
    pdf: 'application/pdf'
  };
  
  res.setHeader('Content-Type', contentTypes[format]);
  res.setHeader('Content-Disposition', `attachment; filename="export_${id}.${format}"`);
  res.send(mockData[format]);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Erro interno do servidor' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

// Only start server if not in Vercel environment
if (process.env.VERCEL !== "1") {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor de demonstração rodando na porta ${PORT}`);
    console.log(`📡 API disponível em http://localhost:${PORT}/api`);
    console.log(`🔧 Modo: Desenvolvimento (sem Supabase)`);
    console.log(`✅ Endpoints mock ativos para testes`);
  });
}

// Export for Vercel
module.exports = app;