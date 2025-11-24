/**
 * This is a user management API route.
 * Handle user profile and settings.
 */
import { Router, type Request, type Response } from 'express'

// Add authentication middleware simulation
const authenticateToken = (req: Request, res: Response, next: any): void => {
  // For demo purposes, we'll accept any request with Authorization header
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    res.status(401).json({ message: 'Token não fornecido' });
    return;
  }
  
  // Mock user ID extraction from token
  (req as any).user = { userId: '1' };
  next();
};

const router = Router()

// Mock user data (in production this would be from database)
let mockUserProfile: any = {
  id: '1',
  name: 'João Silva',
  email: 'joao@teste.com',
  plan: 'free',
  createdAt: new Date('2024-01-01').toISOString(),
  lastLogin: new Date().toISOString(),
  preferences: {
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    notifications: {
      email: true,
      push: false
    }
  },
  usage: {
    totalSheets: 5,
    totalStorage: 10485760, // 10MB
    maxStorage: 104857600, // 100MB for free plan
    planLimit: 10 // max sheets for free plan
  }
}

/**
 * Get user profile
 * GET /api/users/profile
 */
router.get('/profile', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Getting user profile');
    
    // In a real app, we'd get the user ID from the auth token
    res.json({ user: mockUserProfile });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ message: 'Erro ao carregar perfil do usuário' });
  }
})

/**
 * Create user profile (for new registrations)
 * POST /api/user/profile
 */
router.post('/profile', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const profileData = req.body;
    
    console.log('Creating user profile for user:', userId, 'with data:', profileData);
    
    // Update mock user data with profile information
    if (profileData.nome) mockUserProfile.name = profileData.nome;
    if (profileData.semana_gestacional !== undefined) {
      mockUserProfile.semana_gestacional = profileData.semana_gestacional;
    }
    if (profileData.tipo_diabetes) {
      mockUserProfile.tipo_diabetes = profileData.tipo_diabetes;
    }
    
    res.json({ 
      success: true,
      message: 'Perfil criado com sucesso',
      user: mockUserProfile 
    });
  } catch (error) {
    console.error('Error creating user profile:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao criar perfil do usuário' 
    });
  }
})

/**
 * Update user profile
 * PUT /api/users/profile
 */
router.put('/profile', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email } = req.body;
    
    console.log('Updating user profile:', { name, email });
    
    if (!name && !email) {
      res.status(400).json({ message: 'Nome ou email devem ser fornecidos' });
      return;
    }
    
    // Update mock user data
    if (name) mockUserProfile.name = name;
    if (email) mockUserProfile.email = email;
    
    res.json({ 
      message: 'Perfil atualizado com sucesso',
      user: mockUserProfile 
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Erro ao atualizar perfil' });
  }
})

/**
 * Change user password
 * PUT /api/users/change-password
 */
router.put('/change-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    console.log('Changing user password');
    
    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: 'Senha atual e nova senha são obrigatórias' });
      return;
    }
    
    if (newPassword.length < 6) {
      res.status(400).json({ message: 'Nova senha deve ter pelo menos 6 caracteres' });
      return;
    }
    
    // In a real app, we'd verify the current password hash
    // For demo, we'll accept any current password
    
    res.json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Erro ao alterar senha' });
  }
})

export default router