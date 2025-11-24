import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../server'

const today = new Date()
const dateStr = today.toISOString().slice(0, 10)
const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
const timeStr = `${pad(today.getHours())}:${pad(today.getMinutes())}`

describe('Nutrição - fluxo básico', () => {
  it('deve permitir cadastrar alimento, registrar refeição e obter resumo diário', async () => {
    const email = `nutri_${Date.now()}@example.com`
    const password = '123456'
    const name = 'Gestante Teste'

    const registerRes = await request(app).post('/api/auth/register').send({ email, password, name })
    expect(registerRes.status).toBe(201)
    const userId = registerRes.body.data.user.id

    const foodRes = await request(app).post('/api/nutrition/food').send({
      nome: 'Feijão cozido',
      categoria: 'Leguminosas',
      serving_size_g: 100,
      energia_kcal: 120,
      proteina_g: 8.5,
      gordura_g: 1.0,
      carboidrato_g: 21,
      ferro_mg: 2.1,
      folato_ug: 130,
      calcio_mg: 50,
    })
    expect(foodRes.status).toBe(201)
    const foodId = foodRes.body.data.id

    const mealRes = await request(app).post('/api/nutrition/meal').send({
      usuario_id: userId,
      entries: [{ food_id: foodId, quantity_servings: 1 }],
      data_refeicao: dateStr,
      hora_refeicao: timeStr,
      observacoes: 'Almoço',
    })
    expect(mealRes.status).toBe(201)
    expect(mealRes.body.count).toBe(1)

    const hydrationRes = await request(app).post('/api/nutrition/hydration').send({
      usuario_id: userId,
      volume_ml: 500,
      data_registro: dateStr,
      hora_registro: timeStr,
    })
    expect(hydrationRes.status).toBe(201)

    const summaryRes = await request(app).get(`/api/nutrition/daily-summary/${userId}`).query({ date: dateStr })
    expect(summaryRes.status).toBe(200)
    expect(summaryRes.body.success).toBe(true)
    const { summary, hydration, adequacao } = summaryRes.body.data
    expect(summary.ferro_mg).toBeGreaterThan(0)
    expect(summary.folato_ug).toBeGreaterThan(0)
    expect(summary.calcio_mg).toBeGreaterThan(0)
    expect(hydration.total_ml).toBeGreaterThanOrEqual(500)
    expect(adequacao.hidratacao).toBeGreaterThan(0)
  })
})