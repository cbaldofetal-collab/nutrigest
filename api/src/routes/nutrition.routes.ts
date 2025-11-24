import { Router, Request, Response, NextFunction } from 'express'
import { body, query, validationResult } from 'express-validator'
import databaseService from '../services/database.service'
import { ENV } from '../config/constants'

const router = Router()

const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() })
    return
  }
  next()
}

router.post(
  '/food',
  [
    body('nome').isString().notEmpty(),
    body('serving_size_g').isFloat({ gt: 0 }),
    body('categoria').optional().isString(),
    body('energia_kcal').optional().isFloat({ gt: 0 }),
    body('proteina_g').optional().isFloat({ gte: 0 }),
    body('gordura_g').optional().isFloat({ gte: 0 }),
    body('carboidrato_g').optional().isFloat({ gte: 0 }),
    body('ferro_mg').optional().isFloat({ gte: 0 }),
    body('folato_ug').optional().isFloat({ gte: 0 }),
    body('calcio_mg').optional().isFloat({ gte: 0 }),
    body('barcode').optional().isString(),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const created = await databaseService.createFoodItem(req.body)
      res.status(201).json({ success: true, data: created })
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Erro ao cadastrar alimento', error: error.message })
    }
  },
)

router.get(
  '/food/search',
  [query('q').isString().notEmpty(), query('limit').optional().isInt({ gt: 0, lt: 101 })],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { q, limit = 20 } = req.query as any
      const items = await databaseService.searchFoodItems(q, parseInt(limit))
      res.json({ success: true, data: items, count: items.length })
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Erro na busca de alimentos', error: error.message })
    }
  },
)

router.post(
  '/meal',
  [
    body('usuario_id').isString().notEmpty(),
    body('entries').isArray({ min: 1 }),
    body('entries.*.food_id').isInt({ gt: 0 }),
    body('entries.*.quantity_servings').isFloat({ gt: 0 }),
    body('data_refeicao').isISO8601(),
    body('hora_refeicao').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('observacoes').optional().isString(),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { usuario_id, entries, data_refeicao, hora_refeicao, observacoes } = req.body
      const created: any[] = []
      for (const e of entries) {
        const log = await databaseService.createMealLog({
          usuario_id,
          food_id: e.food_id,
          quantity_servings: e.quantity_servings,
          data_refeicao,
          hora_refeicao,
          observacoes,
        })
        created.push(log)
      }
      res.status(201).json({ success: true, data: created, count: created.length })
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Erro ao registrar refeição', error: error.message })
    }
  },
)

router.get(
  '/daily-summary/:userId',
  [query('date').isISO8601()],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params
      const { date } = req.query as any
      const summary = await databaseService.getDailyNutritionSummary(userId, date)

      const targets = {
        ferro_mg: 27,
        folato_ug: 600,
        calcio_mg: 1000,
        hidr_ml: 2300,
      }
      const hydration = await databaseService.getHydrationTotalForDate(userId, date)

      const adequacao = {
        ferro: summary?.ferro_mg ? Math.min(100, Math.round((summary.ferro_mg / targets.ferro_mg) * 100)) : 0,
        folato: summary?.folato_ug ? Math.min(100, Math.round((summary.folato_ug / targets.folato_ug) * 100)) : 0,
        calcio: summary?.calcio_mg ? Math.min(100, Math.round((summary.calcio_mg / targets.calcio_mg) * 100)) : 0,
        hidratacao: hydration?.total_ml ? Math.min(100, Math.round((hydration.total_ml / targets.hidr_ml) * 100)) : 0,
      }

      res.json({ success: true, data: { summary, hydration, adequacao, targets } })
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Erro ao obter resumo diário', error: error.message })
    }
  },
)

router.post(
  '/hydration',
  [
    body('usuario_id').isString().notEmpty(),
    body('volume_ml').isInt({ gt: 0 }),
    body('data_registro').isISO8601(),
    body('hora_registro').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const created = await databaseService.createHydrationLog(req.body)
      res.status(201).json({ success: true, data: created })
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Erro ao registrar hidratação', error: error.message })
    }
  },
)

router.get('/hydration/:userId', [query('date').isISO8601()], validate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params
    const { date } = req.query as any
    const total = await databaseService.getHydrationTotalForDate(userId, date)
    res.json({ success: true, data: total })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erro ao obter hidratação', error: error.message })
  }
})

export default router

// Dev-only: seed sample food items
if (ENV.NODE_ENV !== 'production') {
  router.post('/seed', async (req: Request, res: Response): Promise<void> => {
    try {
      const samples = [
        { nome: 'Feijão cozido', categoria: 'Leguminosas', serving_size_g: 100, energia_kcal: 120, proteina_g: 8.5, gordura_g: 1.0, carboidrato_g: 21, ferro_mg: 2.1, folato_ug: 130, calcio_mg: 50 },
        { nome: 'Espinafre cozido', categoria: 'Vegetais', serving_size_g: 100, energia_kcal: 23, proteina_g: 3.0, gordura_g: 0.3, carboidrato_g: 3.8, ferro_mg: 3.6, folato_ug: 146, calcio_mg: 99 },
        { nome: 'Leite integral', categoria: 'Laticínios', serving_size_g: 200, energia_kcal: 124, proteina_g: 6.4, gordura_g: 7.0, carboidrato_g: 9.6, ferro_mg: 0.1, folato_ug: 12, calcio_mg: 240 },
        { nome: 'Carne bovina cozida', categoria: 'Carnes', serving_size_g: 100, energia_kcal: 250, proteina_g: 26, gordura_g: 15, carboidrato_g: 0, ferro_mg: 2.7, folato_ug: 9, calcio_mg: 18 },
        { nome: 'Laranja', categoria: 'Frutas', serving_size_g: 130, energia_kcal: 62, proteina_g: 1.2, gordura_g: 0.2, carboidrato_g: 15.5, ferro_mg: 0.1, folato_ug: 40, calcio_mg: 52 },
      ]
      const created: any[] = []
      for (const s of samples) {
        const exists = await databaseService.searchFoodItems(s.nome, 5)
        if (!exists.find((e: any) => e.nome.toLowerCase() === s.nome.toLowerCase())) {
          const item = await databaseService.createFoodItem(s as any)
          created.push(item)
        }
      }
      res.status(201).json({ success: true, data: created, count: created.length })
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Erro ao popular amostras', error: error.message })
    }
  })
}