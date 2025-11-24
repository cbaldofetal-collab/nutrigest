import { Router } from 'express';
import { supabase } from '../config/database';
import { authenticateToken } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();

// Get analytics for a sheet
router.get('/:id',
  authenticateToken,
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const userId = req.user.userId;

    // Verify sheet ownership
    const { data: sheet, error: sheetError } = await supabase
      .from('sheets')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (sheetError || !sheet) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SHEET_NOT_FOUND',
          message: 'Sheet not found',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Get processed data
    const { data: processedData, error: dataError } = await supabase
      .from('processed_data')
      .select('*')
      .eq('sheet_id', id)
      .single();

    if (dataError || !processedData) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DATA_NOT_FOUND',
          message: 'Processed data not found',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Get analytics
    const { data: analytics, error: analyticsError } = await supabase
      .from('analytics')
      .select('*')
      .eq('sheet_id', id)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();

    if (analyticsError || !analytics) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ANALYTICS_NOT_FOUND',
          message: 'Analytics not found for this sheet',
        },
        timestamp: new Date().toISOString(),
      });
    }

    res.status(200).json({
      success: true,
      data: {
        sheet: {
          id: sheet.id,
          name: sheet.name,
          rowCount: sheet.row_count,
          columnCount: sheet.column_count,
          status: sheet.status,
        },
        summary: analytics.summary,
        insights: analytics.insights,
        charts: analytics.insights?.charts || [],
        generatedAt: analytics.generated_at,
        confidenceScore: analytics.confidence_score,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

// Export analytics
router.post('/:id/export',
  authenticateToken,
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const userId = req.user.userId;
    const { format = 'pdf' } = req.body; // pdf, excel, json

    // Verify sheet ownership
    const { data: sheet, error: sheetError } = await supabase
      .from('sheets')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (sheetError || !sheet) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SHEET_NOT_FOUND',
          message: 'Sheet not found',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Get analytics
    const { data: analytics, error: analyticsError } = await supabase
      .from('analytics')
      .select('*')
      .eq('sheet_id', id)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();

    if (analyticsError || !analytics) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ANALYTICS_NOT_FOUND',
          message: 'Analytics not found for this sheet',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Get processed data
    const { data: processedData, error: dataError } = await supabase
      .from('processed_data')
      .select('*')
      .eq('sheet_id', id)
      .single();

    if (dataError || !processedData) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DATA_NOT_FOUND',
          message: 'Processed data not found',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Generate export based on format
    let exportData: any;
    let filename: string;
    let contentType: string;

    switch (format) {
      case 'json':
        exportData = {
          sheet: {
            name: sheet.name,
            originalName: sheet.original_name,
            uploadedAt: sheet.uploaded_at,
            processedAt: sheet.processed_at,
          },
          data: {
            headers: processedData.headers,
            statistics: processedData.statistics,
          },
          analytics: {
            summary: analytics.summary,
            insights: analytics.insights,
            generatedAt: analytics.generated_at,
            confidenceScore: analytics.confidence_score,
          },
        };
        filename = `analytics-${sheet.name}-${Date.now()}.json`;
        contentType = 'application/json';
        break;

      case 'excel':
        // For Excel export, we would use a library like exceljs
        // This is a simplified version
        exportData = {
          summary: analytics.summary,
          insights: analytics.insights.keyFindings,
          recommendations: analytics.insights.recommendations,
        };
        filename = `analytics-${sheet.name}-${Date.now()}.xlsx`;
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;

      case 'pdf':
      default:
        // For PDF export, we would use a library like puppeteer or pdfkit
        exportData = {
          summary: analytics.summary,
          insights: analytics.insights.keyFindings,
          recommendations: analytics.insights.recommendations,
        };
        filename = `analytics-${sheet.name}-${Date.now()}.pdf`;
        contentType = 'application/pdf';
        break;
    }

    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', contentType);

    // For now, return JSON data for all formats
    // In a real implementation, you would generate the actual file format
    res.status(200).json({
      success: true,
      data: {
        filename,
        contentType,
        data: exportData,
        message: `Analytics exported as ${format.toUpperCase()}`,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

export { router as analyticsRouter };