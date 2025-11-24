import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { supabase } from '../config/database';
import { authenticateToken } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { uploadConfig } from '../config/database';
import { logger } from '../utils/logger';
import { processExcelFile, processCSVFile } from '../services/file.service';
import { generateAnalytics } from '../services/analytics.service';
import { Sheet, UploadRequest } from '../types/sheet.types';

const router = Router();

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), uploadConfig.uploadDir);
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as any, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = uploadConfig.allowedMimeTypes;
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only Excel and CSV files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: uploadConfig.maxFileSize,
  },
});

// Upload sheet endpoint
router.post('/upload',
  authenticateToken,
  upload.single('file'),
  asyncHandler(async (req: any, res: any) => {
    const { name, description, settings } = req.body;
    const file = req.file;
    const userId = req.user.userId;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FILE_REQUIRED',
          message: 'No file uploaded',
        },
        timestamp: new Date().toISOString(),
      });
    }

    try {
      // Check user's upload limit
      const { count } = await supabase
        .from('sheets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const userPlan = req.user.plan;
      const maxSheets = userPlan === 'premium' ? 1000 : 10;

      if ((count || 0) >= maxSheets) {
        // Clean up uploaded file
        await fs.unlink(file.path).catch(console.error);
        
        return res.status(403).json({
          success: false,
          error: {
            code: 'UPLOAD_LIMIT_EXCEEDED',
            message: `Upload limit exceeded. Maximum ${maxSheets} sheets allowed for ${userPlan} plan.`,
          },
          timestamp: new Date().toISOString(),
        });
      }

      // Parse file to get metadata
      let rowCount = 0;
      let columnCount = 0;
      let headers: string[] = [];

      const ext = path.extname(file.originalname).toLowerCase();
      
      if (ext === '.csv') {
        const result = await processCSVFile(file.path);
        rowCount = result.rowCount;
        columnCount = result.columnCount;
        headers = result.headers;
      } else if (ext === '.xlsx' || ext === '.xls') {
        const result = await processExcelFile(file.path);
        rowCount = result.rowCount;
        columnCount = result.columnCount;
        headers = result.headers;
      } else {
        await fs.unlink(file.path).catch(console.error);
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_FILE_TYPE',
            message: 'Invalid file type. Only Excel and CSV files are supported.',
          },
          timestamp: new Date().toISOString(),
        });
      }

      // Create sheet record
      const { data: sheet, error: sheetError } = await supabase
        .from('sheets')
        .insert([{
          user_id: userId,
          name: name || file.originalname,
          original_name: file.originalname,
          size: file.size,
          row_count: rowCount,
          column_count: columnCount,
          status: 'processing',
          settings: {
            hasHeader: settings?.hasHeader ?? true,
            delimiter: settings?.delimiter || ',',
            encoding: settings?.encoding || 'utf-8',
          },
          file_path: file.path,
          description: description || null,
        }])
        .select()
        .single();

      if (sheetError) {
        await fs.unlink(file.path).catch(console.error);
        throw new Error('Failed to create sheet record');
      }

      // Process data in background
      setImmediate(async () => {
        try {
          await processAndStoreData(sheet.id, file.path, ext, headers);
          
          // Generate analytics
          await generateAnalytics(sheet.id);
          
          logger.info('Sheet processed successfully', { 
            sheetId: sheet.id, 
            userId, 
            rowCount, 
            columnCount 
          });
        } catch (error) {
          logger.error('Error processing sheet', { 
            sheetId: sheet.id, 
            userId, 
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          
          // Update sheet status to error
          await supabase
            .from('sheets')
            .update({ 
              status: 'error',
              error_message: error instanceof Error ? error.message : 'Processing failed'
            })
            .eq('id', sheet.id);
        }
      });

      res.status(201).json({
        success: true,
        data: {
          sheet: {
            id: sheet.id,
            name: sheet.name,
            originalName: sheet.original_name,
            size: sheet.size,
            rowCount: sheet.row_count,
            columnCount: sheet.column_count,
            status: sheet.status,
            uploadedAt: sheet.uploaded_at,
            processedAt: sheet.processed_at,
          },
          preview: {
            headers,
            rows: [], // Will be populated after processing
            dataTypes: [], // Will be populated after processing
          },
        },
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      // Clean up uploaded file on error
      if (file?.path) {
        await fs.unlink(file.path).catch(console.error);
      }
      throw error;
    }
  })
);

// List user sheets
router.get('/',
  authenticateToken,
  asyncHandler(async (req: any, res: any) => {
    const userId = req.user.userId;
    const { page = 1, limit = 10, sortBy = 'uploaded_at', sortOrder = 'desc' } = req.query;

    const offset = (page - 1) * limit;

    const { data: sheets, error, count } = await supabase
      .from('sheets')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error('Failed to fetch sheets');
    }

    const totalPages = Math.ceil((count || 0) / limit);

    res.status(200).json({
      success: true,
      data: sheets.map(sheet => ({
        id: sheet.id,
        name: sheet.name,
        originalName: sheet.original_name,
        size: sheet.size,
        rowCount: sheet.row_count,
        columnCount: sheet.column_count,
        status: sheet.status,
        uploadedAt: sheet.uploaded_at,
        processedAt: sheet.processed_at,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

// Get sheet by ID
router.get('/:id',
  authenticateToken,
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const userId = req.user.userId;

    const { data: sheet, error } = await supabase
      .from('sheets')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !sheet) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SHEET_NOT_FOUND',
          message: 'Sheet not found',
        },
        timestamp: new Date().toISOString(),
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: sheet.id,
        name: sheet.name,
        originalName: sheet.original_name,
        size: sheet.size,
        rowCount: sheet.row_count,
        columnCount: sheet.column_count,
        status: sheet.status,
        settings: sheet.settings,
        description: sheet.description,
        uploadedAt: sheet.uploaded_at,
        processedAt: sheet.processed_at,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

// Delete sheet
router.delete('/:id',
  authenticateToken,
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if sheet exists and belongs to user
    const { data: sheet, error: fetchError } = await supabase
      .from('sheets')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !sheet) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SHEET_NOT_FOUND',
          message: 'Sheet not found',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Delete file from filesystem
    if (sheet.file_path) {
      await fs.unlink(sheet.file_path).catch(console.error);
    }

    // Delete sheet and related data
    await supabase
      .from('processed_data')
      .delete()
      .eq('sheet_id', id);

    await supabase
      .from('analytics')
      .delete()
      .eq('sheet_id', id);

    const { error: deleteError } = await supabase
      .from('sheets')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw new Error('Failed to delete sheet');
    }

    logger.info('Sheet deleted successfully', { sheetId: id, userId });

    res.status(200).json({
      success: true,
      message: 'Sheet deleted successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

// Helper function to process and store data
async function processAndStoreData(sheetId: string, filePath: string, fileExt: string, headers: string[]) {
  let rows: any[][] = [];
  let dataTypes: any[] = [];

  if (fileExt === '.csv') {
    const result = await processCSVFile(filePath);
    rows = result.rows;
    dataTypes = result.dataTypes;
  } else {
    const result = await processExcelFile(filePath);
    rows = result.rows;
    dataTypes = result.dataTypes;
  }

  // Store processed data
  await supabase
    .from('processed_data')
    .insert([{
      sheet_id: sheetId,
      headers,
      rows,
      data_types: dataTypes,
      statistics: calculateStatistics(rows, dataTypes),
    }]);

  // Update sheet status
  await supabase
    .from('sheets')
    .update({ 
      status: 'completed',
      processed_at: new Date().toISOString(),
    })
    .eq('id', sheetId);
}

// Helper function to calculate statistics
function calculateStatistics(rows: any[][], dataTypes: any[]) {
  const totalRows = rows.length;
  const totalColumns = dataTypes.length;
  let missingValues = 0;
  let duplicateRows = 0;

  // Count missing values
  rows.forEach(row => {
    row.forEach(cell => {
      if (cell === null || cell === undefined || cell === '') {
        missingValues++;
      }
    });
  });

  // Calculate data quality score
  const dataQuality = Math.max(0, 100 - (missingValues / (totalRows * totalColumns)) * 100);

  return {
    totalRows,
    totalColumns,
    missingValues,
    duplicateRows,
    dataQuality: Math.round(dataQuality),
  };
}

export { router as sheetsRouter };