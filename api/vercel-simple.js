const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: ['https://traesms2lg1s.vercel.app', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Mock glucose data
const mockGlucoseData = [
  {
    id: 1,
    valor: 95,
    tipo: 'jejum',
    data_registro: '2024-11-19',
    hora_registro: '08:00',
    observacoes: 'Primeira medição do dia',
    usuario_id: 'user123'
  },
  {
    id: 2,
    valor: 120,
    tipo: 'pos_prandial',
    data_registro: '2024-11-19',
    hora_registro: '10:30',
    observacoes: 'Após café da manhã',
    usuario_id: 'user123'
  }
];

// Mock user data
const mockUser = {
  id: 'user123',
  name: 'Usuário Demo', // Changed from 'nome' to 'name' to match auth store
  email: 'demo@example.com',
  semana_gestacional: 20,
  tipo_diabetes: 'gestacional',
  configuracoes: {
    notificacoes: true,
    meta_glicemia: 95,
    intervalo_notificacoes: 2
  }
};

// Authentication endpoints
app.post('/api/auth/register', async (req, res) => {
  const { nome, email, senha, password } = req.body;
  const userPassword = senha || password;
  
  if (!nome || !email || !userPassword) {
    return res.status(400).json({
      success: false,
      error: { message: 'Nome, email e senha são obrigatórios' }
    });
  }
  
  res.json({
    success: true,
    data: {
      user: { ...mockUser, name: nome, email }, // Changed from 'nome' to 'name'
      tokens: {
        accessToken: 'mock-jwt-token-for-demo',
        refreshToken: 'mock-refresh-token-for-demo'
      }
    },
    timestamp: new Date().toISOString()
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: { message: 'Email e senha são obrigatórios' }
    });
  }
  
  res.json({
    success: true,
    data: {
      user: mockUser,
      tokens: {
        accessToken: 'mock-jwt-token-for-demo',
        refreshToken: 'mock-refresh-token-for-demo'
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Glucose endpoints
app.get('/api/glucose', (req, res) => {
  const { userId, limit = 50, offset = 0 } = req.query;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      error: { message: 'userId é obrigatório' }
    });
  }
  
  res.json({
    success: true,
    data: {
      records: mockGlucoseData,
      total: mockGlucoseData.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    },
    timestamp: new Date().toISOString()
  });
});

app.post('/api/glucose', (req, res) => {
  const { valor, tipo, data_registro, hora_registro, observacoes, userId } = req.body;
  
  if (!valor || !tipo || !data_registro || !hora_registro || !userId) {
    return res.status(400).json({
      success: false,
      error: { message: 'Todos os campos obrigatórios devem ser preenchidos' }
    });
  }
  
  const newRecord = {
    id: Date.now(),
    valor,
    tipo,
    data_registro,
    hora_registro,
    observacoes,
    usuario_id: userId
  };
  
  mockGlucoseData.push(newRecord);
  
  res.json({
    success: true,
    data: newRecord,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/glucose/:id', (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      error: { message: 'userId é obrigatório' }
    });
  }
  
  const record = mockGlucoseData.find(r => r.id === parseInt(id));
  
  if (!record) {
    return res.status(404).json({
      success: false,
      error: { message: 'Registro não encontrado' }
    });
  }
  
  res.json({
    success: true,
    data: record,
    timestamp: new Date().toISOString()
  });
});

// User profile
app.get('/api/user/profile', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: { message: 'Token de autenticação necessário' }
    });
  }
  
  res.json({
    success: true,
    data: mockUser,
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: { message: 'Erro interno do servidor' }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: { message: 'Rota não encontrada' }
  });
});

module.exports = app;