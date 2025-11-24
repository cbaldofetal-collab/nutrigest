import databaseService from './database.service'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

class AuthService {
  private jwtSecret: string
  private jwtExpiresIn: string

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key'
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h'
  }

  async register(userData: { email: string; password: string; name: string }) {
    const { email, password, name } = userData
    const passwordHash = await bcrypt.hash(password, 10)
    const userId = (crypto.randomUUID && crypto.randomUUID()) || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    await databaseService.createUser({
      id: userId,
      nome: name,
      email: email,
      senha_hash: passwordHash,
      tipo_diabetes: 'DMG',
      semana_gestacional: 0,
      configuracoes: {
        lembretes_ativados: true,
        backup_automatico: true,
        notificacoes_push: true,
        tema: 'sistema',
      },
    })

    const tokens = this.generateTokens(userId, email)
    return {
      user: {
        id: userId,
        email: email,
        name: name,
        plan: 'free',
        createdAt: new Date().toISOString(),
      },
      tokens,
    }
  }

  async login(email: string, password: string) {
    const user = await databaseService.getUserByEmail(email)
    if (!user) throw new Error('Usuário não encontrado')
    if (!user.senha_hash) throw new Error('Senha não configurada')
    const isPasswordValid = await bcrypt.compare(password, user.senha_hash)
    if (!isPasswordValid) throw new Error('Senha incorreta')

    const tokens = this.generateTokens(user.id, user.email)
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.nome,
        plan: 'free',
        createdAt: user.created_at,
      },
      tokens,
    }
  }

  generateTokens(userId: string, email: string) {
    const payload = {
      userId,
      email,
      plan: 'free',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
    }
    const accessToken = jwt.sign(payload, this.jwtSecret)
    const refreshToken = jwt.sign({ userId, email }, this.jwtSecret)
    return {
      accessToken,
      refreshToken,
      expiresIn: Date.now() + 24 * 60 * 60 * 1000,
    }
  }

  verifyToken(token: string) {
    try {
      return jwt.verify(token, this.jwtSecret)
    } catch {
      return null
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.jwtSecret) as any
      const user = await databaseService.getUserById(decoded.userId)
      
      if (!user) throw new Error('Usuário não encontrado')
      
      // Generate new tokens
      const tokens = this.generateTokens(user.id, user.email)
      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.nome,
          plan: 'free',
          createdAt: user.created_at,
        },
        tokens,
      }
    } catch (error) {
      throw new Error('Refresh token inválido')
    }
  }
}

export default new AuthService()