/**
 * This is a user authentication API route demo.
 * Handle user registration, login, token management, etc.
 */
import { Router, type Request, type Response } from 'express'

const router = Router()

// Mock users database (in production this would be a real database)
let mockUsers = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@example.com',
    plan: 'premium',
    createdAt: new Date('2024-01-01').toISOString()
  }
]

/**
 * User Registration
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Register endpoint hit with data:', req.body);
    
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      res.status(400).json({ message: 'Nome, email e senha são obrigatórios' });
      return;
    }
    
    // Use the persistent mockUsers array
    
    // Check if user already exists
    const existingUser = mockUsers.find(user => user.email === email);
    if (existingUser) {
      res.status(409).json({ message: 'Email já cadastrado' });
      return;
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
      success: true,
      data: {
        user: newUser,
        tokens
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Erro ao processar registro' });
  }
})

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      res.status(400).json({ message: 'Email e senha são obrigatórios' });
      return;
    }
    
    // Use the persistent mockUsers array
    
    // Find user
    const user = mockUsers.find(u => u.email === email);
    if (!user) {
      res.status(401).json({ message: 'Credenciais inválidas' });
      return;
    }
    
    // In a real app, we'd verify the password hash here
    // For demo, we'll accept any password for existing users
    
    const tokens = {
      accessToken: `mock-access-token-${Date.now()}`,
      refreshToken: `mock-refresh-token-${Date.now()}`,
      expiresIn: Date.now() + 900000 // 15 minutes
    };
    
    res.json({
      success: true,
      data: {
        user,
        tokens
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Erro ao processar login' });
  }
})

/**
 * User Logout
 * POST /api/auth/logout
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  // TODO: Implement logout logic
})

export default router
