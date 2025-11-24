/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import dotenv from 'dotenv'
import apiRoutes from './src/routes/index'


// load env
dotenv.config()

const app: express.Application = express()

/**
 * API Routes
 */
app.use('/api', apiRoutes)

/**
 * 404 handler (fora do /api)
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
