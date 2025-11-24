import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { supabase, supabaseAdmin } from '../config/supabase';
import { logger } from '../utils/logger';

const router = Router();

// Get all users (admin only)
router.get('/users',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req: any, res: any) => {
    const { page = 1, limit = 10, search = '', plan = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('users')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
    }

    if (plan) {
      query = query.eq('plan', plan);
    }

    const { data: users, error, count } = await query.order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching users:', error);
      throw new Error('Failed to fetch users');
    }

    const totalPages = Math.ceil((count || 0) / limit);

    res.status(200).json({
      success: true,
      data: users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        emailVerified: user.email_verified,
        lastLoginAt: user.last_login_at,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
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

// Get system statistics (admin only)
router.get('/stats',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req: any, res: any) => {
    // Get user statistics
    const { count: totalUsers } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: premiumUsers } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('plan', 'premium');

    const { count: freeUsers } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('plan', 'free');

    // Get sheet statistics
    const { count: totalSheets } = await supabaseAdmin
      .from('sheets')
      .select('*', { count: 'exact', head: true });

    const { count: processedSheets } = await supabaseAdmin
      .from('sheets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    const { count: processingSheets } = await supabaseAdmin
      .from('sheets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'processing');

    const { count: errorSheets } = await supabaseAdmin
      .from('sheets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'error');

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentSheets } = await supabaseAdmin
      .from('sheets')
      .select('uploaded_at')
      .gte('uploaded_at', sevenDaysAgo.toISOString());

    const uploadsByDay = recentSheets?.reduce((acc: any, sheet: any) => {
      const day = sheet.uploaded_at.split('T')[0];
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {}) || {};

    // Calculate storage usage
    const { data: allSheets } = await supabaseAdmin
      .from('sheets')
      .select('size, user_id');

    const totalStorage = allSheets?.reduce((total, sheet) => total + (sheet.size || 0), 0) || 0;
    const averageStoragePerUser = totalUsers ? totalStorage / (totalUsers) : 0;

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers || 0,
          premium: premiumUsers || 0,
          free: freeUsers || 0,
          premiumPercentage: totalUsers ? Math.round(((premiumUsers || 0) / totalUsers) * 100) : 0,
        },
        sheets: {
          total: totalSheets || 0,
          processed: processedSheets || 0,
          processing: processingSheets || 0,
          error: errorSheets || 0,
          processedPercentage: totalSheets ? Math.round(((processedSheets || 0) / totalSheets) * 100) : 0,
        },
        storage: {
          totalBytes: totalStorage,
          totalMB: Math.round(totalStorage / (1024 * 1024)),
          averagePerUserMB: Math.round(averageStoragePerUser / (1024 * 1024)),
        },
        recentActivity: {
          uploadsByDay,
          totalUploadsLast7Days: recentSheets?.length || 0,
        },
      },
      timestamp: new Date().toISOString(),
    });
  })
);

// Update user plan (admin only)
router.put('/users/:id/plan',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const { plan } = req.body;

    if (!['free', 'premium'].includes(plan)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PLAN',
          message: 'Plan must be either "free" or "premium"',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update({ plan })
      .eq('id', id)
      .select('id, email, name, plan, updated_at')
      .single();

    if (error) {
      logger.error('Error updating user plan:', error);
      throw new Error('Failed to update user plan');
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
        timestamp: new Date().toISOString(),
      });
    }

    logger.info('User plan updated', { userId: id, newPlan: plan, adminId: req.user.userId });

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        updatedAt: user.updated_at,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

export { router as adminRouter };