/**
 * This is a sheets management API route.
 * Handle sheet upload, processing, and management.
 */
import { Router, type Request, type Response } from 'express'
import multer from 'multer'

const router = Router()

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    const allowedExtensions = /\.(xlsx?|csv)$/i;
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de arquivo não permitido. Use Excel (.xlsx, .xls) ou CSV (.csv)'));
    }
  }
});

// Mock sheets database (in production this would be a real database)
let mockSheets: any[] = [
  {
    id: '1',
    filename: 'exemplo_planilha.xlsx',
    originalName: 'Planilha de Exemplo.xlsx',
    fileSize: 1024000, // 1MB
    uploadDate: new Date('2024-01-15T10:30:00Z').toISOString(),
    processed: true,
    rowCount: 150,
    columnCount: 12,
    userId: '1'
  },
  {
    id: '2',
    filename: 'vendas_2024.xlsx',
    originalName: 'Relatório de Vendas 2024.xlsx',
    fileSize: 2048000, // 2MB
    uploadDate: new Date('2024-01-20T14:45:00Z').toISOString(),
    processed: true,
    rowCount: 320,
    columnCount: 8,
    userId: '1'
  }
];

/**
 * Get user's sheets
 * GET /api/sheets?page=1&limit=10
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    console.log('Getting sheets - page:', page, 'limit:', limit);
    
    // In a real app, we'd filter by user ID from auth token
    const userSheets = mockSheets;
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedSheets = userSheets.slice(startIndex, endIndex);
    
    res.json({
      sheets: paginatedSheets,
      pagination: {
        page,
        limit,
        total: userSheets.length,
        pages: Math.ceil(userSheets.length / limit)
      }
    });
  } catch (error) {
    console.error('Error getting sheets:', error);
    res.status(500).json({ message: 'Erro ao carregar planilhas' });
  }
});

/**
 * Upload a new sheet
 * POST /api/sheets/upload
 */
router.post('/upload', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Upload endpoint hit');
    console.log('File:', req.file);
    
    if (!req.file) {
      res.status(400).json({ message: 'Nenhum arquivo enviado' });
      return;
    }

    const { originalname, mimetype, size, buffer } = req.file;
    console.log('File details:', { originalname, mimetype, size });
    
    // Generate unique filename
    const filename = `${Date.now()}-${originalname}`;
    
    // Create new sheet record
    const newSheet = {
      id: String(mockSheets.length + 1),
      filename,
      originalName: originalname,
      fileSize: size,
      uploadDate: new Date().toISOString(),
      processed: false, // Will be processed asynchronously
      rowCount: 0, // Will be calculated during processing
      columnCount: 0, // Will be calculated during processing
      userId: '1' // In real app, would come from auth token
    };
    
    mockSheets.push(newSheet);
    
    // Simulate processing (in real app, this would be done asynchronously)
    setTimeout(() => {
      const sheetIndex = mockSheets.findIndex(s => s.id === newSheet.id);
      if (sheetIndex !== -1) {
        mockSheets[sheetIndex] = {
          ...mockSheets[sheetIndex],
          processed: true,
          rowCount: Math.floor(Math.random() * 500) + 50, // Mock data
          columnCount: Math.floor(Math.random() * 15) + 5 // Mock data
        };
      }
    }, 3000); // Process after 3 seconds
    
    console.log('Upload successful, sheet created:', newSheet);
    
    res.status(201).json({
      sheet: newSheet,
      message: 'Planilha enviada com sucesso! Processando...'
    });
  } catch (error) {
    console.error('Upload error:', error);
    if (error instanceof Error && error.message.includes('Formato de arquivo')) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Erro ao enviar planilha' });
    }
  }
});

/**
 * Get a specific sheet
 * GET /api/sheets/:id
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    console.log('Getting sheet with id:', id);
    
    const sheet = mockSheets.find(s => s.id === id);
    
    if (!sheet) {
      res.status(404).json({ message: 'Planilha não encontrada' });
      return;
    }
    
    res.json({ sheet });
  } catch (error) {
    console.error('Error getting sheet:', error);
    res.status(500).json({ message: 'Erro ao carregar planilha' });
  }
});

/**
 * Delete a sheet
 * DELETE /api/sheets/:id
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    console.log('Deleting sheet with id:', id);
    
    const sheetIndex = mockSheets.findIndex(s => s.id === id);
    
    if (sheetIndex === -1) {
      res.status(404).json({ message: 'Planilha não encontrada' });
      return;
    }
    
    // Remove from mock database
    mockSheets.splice(sheetIndex, 1);
    
    res.json({ message: 'Planilha excluída com sucesso' });
  } catch (error) {
    console.error('Error deleting sheet:', error);
    res.status(500).json({ message: 'Erro ao excluir planilha' });
  }
});

export default router