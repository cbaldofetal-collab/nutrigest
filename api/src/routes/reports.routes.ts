import { Router, Request, Response } from 'express'
import { query, param } from 'express-validator'
import { authenticateToken } from '../middleware/auth.middleware'
import { validateRequest } from '../middleware/validation.middleware'
import databaseService from '../services/database.service'
import pdfService from '../services/pdf.service'
import { ENV } from '../config/constants'

const router = Router()

router.get(
  '/doctor/:userId',
  authenticateToken,
  [param('userId').isString().notEmpty(), query('startDate').isISO8601(), query('endDate').isISO8601()],
  validateRequest,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params
      const { startDate, endDate } = req.query as any
      const user = await databaseService.getUserById(userId)
      if (!user) {
        res.status(404).json({ success: false, message: 'Usuário não encontrado' })
        return
      }

      const glucoseStats = await databaseService.getGlucoseStatistics(userId, startDate, endDate)
      const glucoseRecords = await databaseService.getGlucoseRecordsByDateRange(userId, startDate, endDate)

      const days: Array<{ date: string; summary: any; hydration: any; adequacao: any }> = []
      const targets = { ferro_mg: 27, folato_ug: 600, calcio_mg: 1000, hidr_ml: 2300 }
      const start = new Date(startDate)
      const end = new Date(endDate)
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const ds = d.toISOString().slice(0, 10)
        const summary = await databaseService.getDailyNutritionSummary(userId, ds)
        const hydration = await databaseService.getHydrationTotalForDate(userId, ds)
        const adequacao = {
          ferro: summary?.ferro_mg ? Math.min(100, Math.round((summary.ferro_mg / targets.ferro_mg) * 100)) : 0,
          folato: summary?.folato_ug ? Math.min(100, Math.round((summary.folato_ug / targets.folato_ug) * 100)) : 0,
          calcio: summary?.calcio_mg ? Math.min(100, Math.round((summary.calcio_mg / targets.calcio_mg) * 100)) : 0,
          hidratacao: hydration?.total_ml ? Math.min(100, Math.round((hydration.total_ml / targets.hidr_ml) * 100)) : 0,
        }
        days.push({ date: ds, summary, hydration, adequacao })
      }

      const doc = pdfService.generateDoctorReport(user, { startDate, endDate }, { records: glucoseRecords, statistics: glucoseStats }, days)
      const accessUrl = `${ENV.FRONTEND_URL}/dashboard?user=${encodeURIComponent(userId)}&start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const QRCode = require('qrcode')
        const dataUrl = await QRCode.toDataURL(accessUrl)
        doc.setFontSize(10)
        doc.setTextColor(52, 73, 94)
        doc.text('Acesso rápido (QR):', 20, 285)
        doc.addImage(dataUrl, 'PNG', 20, 288, 24, 24)
        doc.text(accessUrl, 50, 295)
      } catch (err) {
        doc.setFontSize(10)
        doc.setTextColor(52, 73, 94)
        doc.text('Acesse:', 20, 290)
        doc.text(accessUrl, 40, 290)
      }
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="relatorio-medico-${userId}-${Date.now()}.pdf"`)
      const buffer = Buffer.from(doc.output('arraybuffer'))
      res.send(buffer)
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Erro ao gerar relatório médico', error: error.message })
    }
  },
)

export default router