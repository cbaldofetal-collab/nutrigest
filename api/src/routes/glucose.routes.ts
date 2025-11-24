import { Router, Request, Response, NextFunction } from 'express'
import { body, validationResult } from 'express-validator'
import databaseService from '../services/database.service'
import pdfService from '../services/pdf.service'

const router = Router()

const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() })
    return
  }
  next()
}

router.post(
  '/glucose-records',
  [
    body('usuario_id').isString().notEmpty(),
    body('valor_glicemia').isInt({ min: 30, max: 600 }),
    body('tipo_jejum').isIn(['jejum', 'pos-prandial']),
    body('data_medicao').isISO8601(),
    body('hora_medicao').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('observacoes').optional().isString(),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const record = await databaseService.createGlucoseRecord(req.body)
      res.status(201).json({ success: true, data: record, message: 'Registro de glicemia criado com sucesso' })
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Erro ao criar registro de glicemia', error: error.message })
    }
  },
)

router.get('/glucose-records/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params
    const { limit = 100, offset = 0, startDate, endDate } = req.query as any

    let records
    if (startDate && endDate) {
      records = await databaseService.getGlucoseRecordsByDateRange(userId, startDate, endDate)
    } else {
      records = await databaseService.getGlucoseRecords(userId, parseInt(limit), parseInt(offset))
    }

    res.json({ success: true, data: records, count: records.length })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erro ao buscar registros de glicemia', error: error.message })
  }
})

router.get('/glucose-records/record/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const record = await databaseService.getGlucoseRecordById(parseInt(id))
    if (!record) {
      res.status(404).json({ success: false, message: 'Registro não encontrado' })
      return
    }
    res.json({ success: true, data: record })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erro ao buscar registro', error: error.message })
  }
})

router.put(
  '/glucose-records/:id',
  [
    body('valor_glicemia').optional().isInt({ min: 30, max: 600 }),
    body('tipo_jejum').optional().isIn(['jejum', 'pos-prandial']),
    body('data_medicao').optional().isISO8601(),
    body('hora_medicao').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('observacoes').optional().isString(),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const result = await databaseService.updateGlucoseRecord(parseInt(id), req.body)
      if (result.changes === 0) {
        res.status(404).json({ success: false, message: 'Registro não encontrado' })
        return
      }
      res.json({ success: true, message: 'Registro atualizado com sucesso' })
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Erro ao atualizar registro', error: error.message })
    }
  },
)

router.delete('/glucose-records/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const result = await databaseService.deleteGlucoseRecord(parseInt(id))
    if (result.changes === 0) {
      res.status(404).json({ success: false, message: 'Registro não encontrado' })
      return
    }
    res.json({ success: true, message: 'Registro deletado com sucesso' })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erro ao deletar registro', error: error.message })
  }
})

router.get('/glucose-statistics/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params
    const { startDate, endDate } = req.query as any
    const statistics = await databaseService.getGlucoseStatistics(userId, startDate, endDate)
    res.json({ success: true, data: statistics })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erro ao buscar estatísticas', error: error.message })
  }
})

router.get('/glucose-report/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params
    const { startDate, endDate } = req.query as any
    const userData = await databaseService.getUserById(userId)
    if (!userData) {
      res.status(404).json({ success: false, message: 'Usuário não encontrado' })
      return
    }
    let records
    if (startDate && endDate) {
      records = await databaseService.getGlucoseRecordsByDateRange(userId, startDate, endDate)
    } else {
      records = await databaseService.getGlucoseRecords(userId, 1000, 0)
    }
    const statistics = await databaseService.getGlucoseStatistics(userId, startDate, endDate)
    const pdf = pdfService.generateGlucoseReport(userData, records, statistics)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="relatorio-glicemia-${userId}-${Date.now()}.pdf"`)
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))
    res.send(pdfBuffer)
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erro ao gerar relatório PDF', error: error.message })
  }
})

export default router