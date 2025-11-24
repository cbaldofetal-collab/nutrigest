import { Router, Request, Response } from 'express'
import { body, param } from 'express-validator'
import { authenticateToken } from '../middleware/auth.middleware'
import { validateRequest } from '../middleware/validation.middleware'
import databaseService from '../services/database.service'

const router = Router()

router.get('/consent/:userId', authenticateToken, [param('userId').isString().notEmpty()], validateRequest, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params
    const consents = await databaseService.getUserConsents(userId)
    await databaseService.addAuditLog(userId, 'CONSENT_VIEW', null, req.originalUrl, req.ip)
    res.json({ success: true, data: consents })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erro ao obter consentimentos', error: error.message })
  }
})

router.post(
  '/consent',
  authenticateToken,
  [
    body('userId').isString().notEmpty(),
    body('privacyAccepted').optional().isBoolean(),
    body('termsAccepted').optional().isBoolean(),
    body('dataSharing').optional().isBoolean(),
    body('version').optional().isString(),
  ],
  validateRequest,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, privacyAccepted, termsAccepted, dataSharing, version } = req.body
      await databaseService.updateUserConsents(userId, { privacyAccepted, termsAccepted, dataSharing, version })
      const consents = await databaseService.getUserConsents(userId)
      await databaseService.addAuditLog(userId, 'CONSENT_UPDATE', { privacyAccepted, termsAccepted, dataSharing, version }, req.originalUrl, req.ip)
      res.status(200).json({ success: true, data: consents })
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Erro ao atualizar consentimentos', error: error.message })
    }
  },
)

router.get('/export/:userId', authenticateToken, [param('userId').isString().notEmpty()], validateRequest, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params
    const payload = await databaseService.getFullUserData(userId)
    const json = JSON.stringify({ exportedAt: new Date().toISOString(), ...payload }, null, 2)
    await databaseService.addAuditLog(userId, 'DATA_EXPORT', { bytes: Buffer.byteLength(json) }, req.originalUrl, req.ip)
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="lgpd-export-${userId}-${Date.now()}.json"`)
    res.send(json)
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erro ao exportar dados pessoais', error: error.message })
  }
})

router.delete('/account/:userId', authenticateToken, [param('userId').isString().notEmpty()], validateRequest, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params
    const result = await databaseService.deleteUserCascade(userId)
    await databaseService.addAuditLog(userId, 'ACCOUNT_DELETE', result, req.originalUrl, req.ip)
    res.status(200).json({ success: true, data: result, message: 'Conta e dados associados removidos' })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erro ao excluir conta', error: error.message })
  }
})

router.get('/audit/:userId', authenticateToken, [param('userId').isString().notEmpty()], validateRequest, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params
    const { limit = '50', offset = '0', startDate, endDate, action } = req.query as any
    const logs = await databaseService.getAuditLogs(userId, parseInt(limit), parseInt(offset), startDate, endDate, action)
    res.json({ success: true, data: logs, count: logs.length })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erro ao obter auditoria', error: error.message })
  }
})

export default router