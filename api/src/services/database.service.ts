import path from 'path'

const sqlite3 = require('sqlite3').verbose()

type UserConfig = Record<string, any>

export interface UserRecord {
  id: string
  nome: string
  email: string
  senha_hash?: string
  semana_gestacional?: number
  tipo_diabetes?: string
  configuracoes?: UserConfig
  created_at?: string
  updated_at?: string
}

export interface GlucoseRecord {
  id?: number
  usuario_id: string
  valor_glicemia: number
  tipo_jejum: 'jejum' | 'pos-prandial'
  data_medicao: string
  hora_medicao: string
  observacoes?: string
  created_at?: string
  updated_at?: string
}

export interface FoodItem {
  id?: number
  nome: string
  categoria?: string
  serving_size_g: number
  energia_kcal?: number
  proteina_g?: number
  gordura_g?: number
  carboidrato_g?: number
  ferro_mg?: number
  folato_ug?: number
  calcio_mg?: number
  barcode?: string
  created_at?: string
  updated_at?: string
}

export interface MealLog {
  id?: number
  usuario_id: string
  food_id: number
  quantity_servings: number
  data_refeicao: string
  hora_refeicao: string
  observacoes?: string
  created_at?: string
  updated_at?: string
}

export interface HydrationLog {
  id?: number
  usuario_id: string
  volume_ml: number
  data_registro: string
  hora_registro: string
  created_at?: string
  updated_at?: string
}

class DatabaseService {
  private db: any

  constructor() {
    this.db = null
    this.init()
  }

  private init(): void {
    const dbPath = path.join(__dirname, '../../data/glicogest.db')
    this.db = new sqlite3.Database(dbPath, (err: Error | null) => {
      if (err) {
        console.error('Erro ao conectar ao banco de dados:', err)
      } else {
        console.log('Conectado ao banco de dados SQLite')
        this.createTables()
      }
    })
  }

  private createTables(): void {
    const createRegistrosTable = `
      CREATE TABLE IF NOT EXISTS registros_glicemicos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id TEXT NOT NULL,
        valor_glicemia INTEGER NOT NULL,
        tipo_jejum TEXT NOT NULL,
        data_medicao DATE NOT NULL,
        hora_medicao TIME NOT NULL,
        observacoes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `

    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha_hash TEXT,
        semana_gestacional INTEGER,
        tipo_diabetes TEXT DEFAULT 'DMG',
        configuracoes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `

    const createFoodItemsTable = `
      CREATE TABLE IF NOT EXISTS food_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        categoria TEXT,
        serving_size_g REAL NOT NULL,
        energia_kcal REAL,
        proteina_g REAL,
        gordura_g REAL,
        carboidrato_g REAL,
        ferro_mg REAL,
        folato_ug REAL,
        calcio_mg REAL,
        barcode TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `

    const createMealLogsTable = `
      CREATE TABLE IF NOT EXISTS meal_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id TEXT NOT NULL,
        food_id INTEGER NOT NULL,
        quantity_servings REAL NOT NULL,
        data_refeicao DATE NOT NULL,
        hora_refeicao TIME NOT NULL,
        observacoes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (food_id) REFERENCES food_items(id)
      )
    `

    const createHydrationLogsTable = `
      CREATE TABLE IF NOT EXISTS hydration_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id TEXT NOT NULL,
        volume_ml INTEGER NOT NULL,
        data_registro DATE NOT NULL,
        hora_registro TIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `

    const createAuditLogsTable = `
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT,
        route TEXT,
        ip TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `

    this.db.serialize(() => {
      this.db.run(createUsersTable)
      this.db.run(createRegistrosTable)
      this.db.run(createFoodItemsTable)
      this.db.run(createMealLogsTable)
      this.db.run(createHydrationLogsTable)
      this.db.run(createAuditLogsTable)
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_registros_usuario_data ON registros_glicemicos(usuario_id, data_medicao)`)
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_registros_data ON registros_glicemicos(data_medicao)`)
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_meals_usuario_data ON meal_logs(usuario_id, data_refeicao)`)
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_hydra_usuario_data ON hydration_logs(usuario_id, data_registro)`)
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_food_nome ON food_items(nome)`)
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_audit_user_created ON audit_logs(usuario_id, created_at)`)
    })
  }

  async createUser(userData: UserRecord): Promise<UserRecord> {
    return new Promise((resolve, reject) => {
      const { id, nome, email, senha_hash, semana_gestacional, tipo_diabetes, configuracoes } = userData
      const sql = `
        INSERT INTO users (id, nome, email, senha_hash, semana_gestacional, tipo_diabetes, configuracoes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `
      this.db.run(
        sql,
        [id, nome, email, senha_hash, semana_gestacional, tipo_diabetes, JSON.stringify(configuracoes)],
        function (err: Error | null) {
          if (err) {
            reject(err)
          } else {
            resolve({ id, nome, email, senha_hash, semana_gestacional, tipo_diabetes, configuracoes })
          }
        },
      )
    })
  }

  async getUserById(userId: string): Promise<UserRecord | null> {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM users WHERE id = ?`
      this.db.get(sql, [userId], (err: Error | null, row: any) => {
        if (err) {
          reject(err)
        } else {
          if (row && row.configuracoes) {
            row.configuracoes = JSON.parse(row.configuracoes)
          }
          resolve(row || null)
        }
      })
    })
  }

  async updateUser(userId: string, userData: Partial<UserRecord>): Promise<UserRecord> {
    return new Promise((resolve, reject) => {
      const fields: string[] = []
      const values: any[] = []
      Object.keys(userData).forEach((key) => {
        if (key !== 'id') {
          fields.push(`${key} = ?`)
          // @ts-ignore
          const val = (userData as any)[key]
          values.push(typeof val === 'object' ? JSON.stringify(val) : val)
        }
      })
      values.push(userId)
      const sql = `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      this.db.run(sql, values, function (err: Error | null) {
        if (err) {
          reject(err)
        } else if (this.changes === 0) {
          reject(new Error('User not found'))
        } else {
          resolve({ id: userId, ...(userData as any) })
        }
      })
    })
  }

  async getUserByEmail(email: string): Promise<UserRecord | null> {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM users WHERE email = ?`
      this.db.get(sql, [email], (err: Error | null, row: any) => {
        if (err) {
          reject(err)
        } else {
          if (row && row.configuracoes) {
            try {
              row.configuracoes = JSON.parse(row.configuracoes)
            } catch {
              row.configuracoes = {}
            }
          }
          resolve(row || null)
        }
      })
    })
  }

  async createGlucoseRecord(recordData: GlucoseRecord): Promise<GlucoseRecord> {
    return new Promise((resolve, reject) => {
      const { usuario_id, valor_glicemia, tipo_jejum, data_medicao, hora_medicao, observacoes } = recordData
      const sql = `
        INSERT INTO registros_glicemicos (usuario_id, valor_glicemia, tipo_jejum, data_medicao, hora_medicao, observacoes)
        VALUES (?, ?, ?, ?, ?, ?)
      `
      this.db.run(
        sql,
        [usuario_id, valor_glicemia, tipo_jejum, data_medicao, hora_medicao, observacoes],
        function (err: Error | null) {
          if (err) {
            reject(err)
          } else {
            resolve({ id: this.lastID, ...recordData })
          }
        },
      )
    })
  }

  async getGlucoseRecords(userId: string, limit = 100, offset = 0): Promise<GlucoseRecord[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM registros_glicemicos 
        WHERE usuario_id = ? 
        ORDER BY data_medicao DESC, hora_medicao DESC 
        LIMIT ? OFFSET ?
      `
      this.db.all(sql, [userId, limit, offset], (err: Error | null, rows: GlucoseRecord[]) => {
        if (err) {
          reject(err)
        } else {
          resolve(rows)
        }
      })
    })
  }

  async getGlucoseRecordsByDateRange(userId: string, startDate: string, endDate: string): Promise<GlucoseRecord[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM registros_glicemicos 
        WHERE usuario_id = ? AND data_medicao BETWEEN ? AND ?
        ORDER BY data_medicao DESC, hora_medicao DESC
      `
      this.db.all(sql, [userId, startDate, endDate], (err: Error | null, rows: GlucoseRecord[]) => {
        if (err) {
          reject(err)
        } else {
          resolve(rows)
        }
      })
    })
  }

  async getGlucoseRecordById(recordId: number): Promise<GlucoseRecord | null> {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM registros_glicemicos WHERE id = ?`
      this.db.get(sql, [recordId], (err: Error | null, row: GlucoseRecord) => {
        if (err) {
          reject(err)
        } else {
          resolve(row || null)
        }
      })
    })
  }

  async updateGlucoseRecord(recordId: number, updateData: Partial<GlucoseRecord>): Promise<{ changes: number }> {
    return new Promise((resolve, reject) => {
      const fields = Object.keys(updateData)
      const values = Object.values(updateData)
      const setClause = fields.map((field) => `${field} = ?`).join(', ')
      const sql = `UPDATE registros_glicemicos SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      this.db.run(sql, [...values, recordId], function (err: Error | null) {
        if (err) {
          reject(err)
        } else {
          resolve({ changes: this.changes })
        }
      })
    })
  }

  async deleteGlucoseRecord(recordId: number): Promise<{ changes: number }> {
    return new Promise((resolve, reject) => {
      const sql = `DELETE FROM registros_glicemicos WHERE id = ?`
      this.db.run(sql, [recordId], function (err: Error | null) {
        if (err) {
          reject(err)
        } else {
          resolve({ changes: this.changes })
        }
      })
    })
  }

  async getGlucoseStatistics(userId: string, startDate: string | null = null, endDate: string | null = null): Promise<any> {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT 
          COUNT(*) as total_registros,
          AVG(valor_glicemia) as media_glicemia,
          MIN(valor_glicemia) as min_glicemia,
          MAX(valor_glicemia) as max_glicemia,
          COUNT(CASE WHEN tipo_jejum = 'jejum' THEN 1 END) as total_jejum,
          COUNT(CASE WHEN tipo_jejum = 'pos-prandial' THEN 1 END) as total_pos_prandial,
          AVG(CASE WHEN tipo_jejum = 'jejum' THEN valor_glicemia END) as media_jejum,
          AVG(CASE WHEN tipo_jejum = 'pos-prandial' THEN valor_glicemia END) as media_pos_prandial
        FROM registros_glicemicos 
        WHERE usuario_id = ?
      `
      const params: any[] = [userId]
      if (startDate && endDate) {
        sql += ' AND data_medicao BETWEEN ? AND ?'
        params.push(startDate, endDate)
      }
      this.db.get(sql, params, (err: Error | null, row: any) => {
        if (err) {
          reject(err)
        } else {
          resolve(row)
        }
      })
    })
  }

  async createFoodItem(item: FoodItem): Promise<FoodItem> {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO food_items (nome, categoria, serving_size_g, energia_kcal, proteina_g, gordura_g, carboidrato_g, ferro_mg, folato_ug, calcio_mg, barcode)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      this.db.run(
        sql,
        [
          item.nome,
          item.categoria || null,
          item.serving_size_g,
          item.energia_kcal || null,
          item.proteina_g || null,
          item.gordura_g || null,
          item.carboidrato_g || null,
          item.ferro_mg || null,
          item.folato_ug || null,
          item.calcio_mg || null,
          item.barcode || null,
        ],
        function (err: Error | null) {
          if (err) {
            reject(err)
          } else {
            resolve({ id: this.lastID, ...item })
          }
        },
      )
    })
  }

  async searchFoodItems(query: string, limit = 20): Promise<FoodItem[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM food_items
        WHERE LOWER(nome) LIKE LOWER(?)
        ORDER BY nome ASC LIMIT ?
      `
      this.db.all(sql, [`%${query}%`, limit], (err: Error | null, rows: FoodItem[]) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
  }

  async createMealLog(log: MealLog): Promise<MealLog> {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO meal_logs (usuario_id, food_id, quantity_servings, data_refeicao, hora_refeicao, observacoes)
        VALUES (?, ?, ?, ?, ?, ?)
      `
      this.db.run(
        sql,
        [log.usuario_id, log.food_id, log.quantity_servings, log.data_refeicao, log.hora_refeicao, log.observacoes || null],
        function (err: Error | null) {
          if (err) reject(err)
          else resolve({ id: this.lastID, ...log })
        },
      )
    })
  }

  async getDailyNutritionSummary(userId: string, date: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          SUM((fi.energia_kcal) * ml.quantity_servings) as energia_kcal,
          SUM((fi.proteina_g) * ml.quantity_servings) as proteina_g,
          SUM((fi.gordura_g) * ml.quantity_servings) as gordura_g,
          SUM((fi.carboidrato_g) * ml.quantity_servings) as carboidrato_g,
          SUM((fi.ferro_mg) * ml.quantity_servings) as ferro_mg,
          SUM((fi.folato_ug) * ml.quantity_servings) as folato_ug,
          SUM((fi.calcio_mg) * ml.quantity_servings) as calcio_mg
        FROM meal_logs ml
        JOIN food_items fi ON fi.id = ml.food_id
        WHERE ml.usuario_id = ? AND ml.data_refeicao = ?
      `
      this.db.get(sql, [userId, date], (err: Error | null, row: any) => {
        if (err) reject(err)
        else resolve(row || {})
      })
    })
  }

  async createHydrationLog(entry: HydrationLog): Promise<HydrationLog> {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO hydration_logs (usuario_id, volume_ml, data_registro, hora_registro)
        VALUES (?, ?, ?, ?)
      `
      this.db.run(sql, [entry.usuario_id, entry.volume_ml, entry.data_registro, entry.hora_registro], function (err: Error | null) {
        if (err) reject(err)
        else resolve({ id: this.lastID, ...entry })
      })
    })
  }

  async getHydrationTotalForDate(userId: string, date: string): Promise<{ total_ml: number }> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT COALESCE(SUM(volume_ml), 0) as total_ml
        FROM hydration_logs
        WHERE usuario_id = ? AND data_registro = ?
      `
      this.db.get(sql, [userId, date], (err: Error | null, row: any) => {
        if (err) reject(err)
        else resolve({ total_ml: row?.total_ml ?? 0 })
      })
    })
  }

  async getUserConsents(userId: string): Promise<any> {
    const user = await this.getUserById(userId)
    const cfg = user?.configuracoes || {}
    const consents = cfg.consents || {}
    return {
      privacyAccepted: !!consents.privacyAccepted,
      termsAccepted: !!consents.termsAccepted,
      dataSharing: !!consents.dataSharing,
      version: consents.version || 'v1',
      timestamp: consents.timestamp || null,
    }
  }

  async updateUserConsents(userId: string, consents: { privacyAccepted?: boolean; termsAccepted?: boolean; dataSharing?: boolean; version?: string }): Promise<void> {
    const user = await this.getUserById(userId)
    const cfg = user?.configuracoes || {}
    const updated = {
      ...cfg,
      consents: {
        privacyAccepted: consents.privacyAccepted ?? cfg.consents?.privacyAccepted ?? false,
        termsAccepted: consents.termsAccepted ?? cfg.consents?.termsAccepted ?? false,
        dataSharing: consents.dataSharing ?? cfg.consents?.dataSharing ?? false,
        version: consents.version || cfg.consents?.version || 'v1',
        timestamp: new Date().toISOString(),
      },
    }
    await this.updateUser(userId, { configuracoes: updated })
  }

  async getFullUserData(userId: string): Promise<any> {
    const user = await this.getUserById(userId)
    const glucose = await this.getGlucoseRecords(userId, 10000, 0)
    const meals = await new Promise<any[]>((resolve, reject) => {
      const sql = `SELECT * FROM meal_logs WHERE usuario_id = ? ORDER BY data_refeicao DESC, hora_refeicao DESC`
      this.db.all(sql, [userId], (err: Error | null, rows: any[]) => {
        if (err) reject(err)
        else resolve(rows || [])
      })
    })
    const hydration = await new Promise<any[]>((resolve, reject) => {
      const sql = `SELECT * FROM hydration_logs WHERE usuario_id = ? ORDER BY data_registro DESC, hora_registro DESC`
      this.db.all(sql, [userId], (err: Error | null, rows: any[]) => {
        if (err) reject(err)
        else resolve(rows || [])
      })
    })
    return { user, glucose, meals, hydration }
  }

  async deleteUserCascade(userId: string): Promise<{ deletedUser: number; deletedGlucose: number; deletedMeals: number; deletedHydration: number }> {
    const deleted: any = {}
    await new Promise<void>((resolve, reject) => {
      this.db.run(`DELETE FROM registros_glicemicos WHERE usuario_id = ?`, [userId], function (err: Error | null) {
        if (err) reject(err)
        else {
          deleted.deletedGlucose = (this as any).changes || 0
          resolve()
        }
      })
    })
    await new Promise<void>((resolve, reject) => {
      this.db.run(`DELETE FROM meal_logs WHERE usuario_id = ?`, [userId], function (err: Error | null) {
        if (err) reject(err)
        else {
          deleted.deletedMeals = (this as any).changes || 0
          resolve()
        }
      })
    })
    await new Promise<void>((resolve, reject) => {
      this.db.run(`DELETE FROM hydration_logs WHERE usuario_id = ?`, [userId], function (err: Error | null) {
        if (err) reject(err)
        else {
          deleted.deletedHydration = (this as any).changes || 0
          resolve()
        }
      })
    })
    await new Promise<void>((resolve, reject) => {
      this.db.run(`DELETE FROM users WHERE id = ?`, [userId], function (err: Error | null) {
        if (err) reject(err)
        else {
          deleted.deletedUser = (this as any).changes || 0
          resolve()
        }
      })
    })
    return deleted
  }

  async addAuditLog(userId: string, action: string, details?: any, route?: string, ip?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO audit_logs (usuario_id, action, details, route, ip) VALUES (?, ?, ?, ?, ?)`
      this.db.run(sql, [userId, action, details ? JSON.stringify(details) : null, route || null, ip || null], function (err: Error | null) {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  async getAuditLogs(userId: string, limit = 50, offset = 0, startDate?: string, endDate?: string, action?: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      let sql = `SELECT id, action, details, route, ip, created_at FROM audit_logs WHERE usuario_id = ?`
      const params: any[] = [userId]
      if (startDate && endDate) {
        sql += ` AND date(created_at) BETWEEN ? AND ?`
        params.push(startDate, endDate)
      }
      if (action) {
        sql += ` AND action = ?`
        params.push(action)
      }
      sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`
      params.push(limit, offset)
      this.db.all(sql, params, (err: Error | null, rows: any[]) => {
        if (err) reject(err)
        else {
          const parsed = rows.map((r) => ({ ...r, details: r.details ? JSON.parse(r.details) : null }))
          resolve(parsed)
        }
      })
    })
  }

  close(): void {
    if (this.db) {
      this.db.close((err: Error | null) => {
        if (err) {
          console.error('Erro ao fechar banco de dados:', err)
        } else {
          console.log('Banco de dados fechado')
        }
      })
    }
  }
}

const databaseService = new DatabaseService()
export default databaseService