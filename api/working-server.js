const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:4173', 'https://traesms2lg1s.vercel.app'],
  credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));

// Mock users database
const mockUsers = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    plan: 'premium',
    createdAt: new Date('2024-01-01').toISOString()
  }
];

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Register endpoint
app.post('/api/auth/register', (req, res) => {
  console.log('Register endpoint hit with data:', req.body);
  
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Nome, email e senha são obrigatórios' });
  }
  
  // Check if user already exists
  const existingUser = mockUsers.find(user => user.email === email);
  if (existingUser) {
    return res.status(409).json({ message: 'Email já cadastrado' });
  }
  
  // Create new user
  const newUser = {
    id: String(mockUsers.length + 1),
    name,
    email,
    plan: 'free',
    createdAt: new Date().toISOString()
  };
  
  mockUsers.push(newUser);
  
  // Generate mock tokens
  const tokens = {
    accessToken: `mock-access-token-${Date.now()}`,
    refreshToken: `mock-refresh-token-${Date.now()}`,
    expiresIn: Date.now() + 900000 // 15 minutes
  };
  
  console.log('Registration successful for user:', email);
  
  res.status(201).json({
    user: newUser,
    tokens
  });
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios' });
  }
  
  // Find user
  const user = mockUsers.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ message: 'Credenciais inválidas' });
  }
  
  // In a real app, we'd verify the password hash here
  // For demo, we'll accept any password for existing users
  
  const tokens = {
    accessToken: `mock-access-token-${Date.now()}`,
    refreshToken: `mock-refresh-token-${Date.now()}`,
    expiresIn: Date.now() + 900000 // 15 minutes
  };
  
  res.json({
    user,
    tokens
  });
});

// Error handling
app.use((req, res) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Erro interno do servidor' });
});

module.exports = app;