import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { supabase } from '../config/database';
import { logger } from '../utils/logger';

const router = Router();

// Get current user profile
router.get('/profile',
  authenticateToken,
  asyncHandler(async (req: any, res: any) => {
    const userId = req.user.userId;

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      logger.error('Error fetching user profile:', error);
      throw new Error('Failed to fetch user profile');
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

    // Get user's subscription info
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        emailVerified: user.email_verified,
        lastLoginAt: user.last_login_at,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        subscription: subscription || null,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

// Update user profile
router.put('/profile',
  authenticateToken,
  asyncHandler(async (req: any, res: any) => {
    const userId = req.user.userId;
    const { name } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_NAME',
          message: 'Name must be at least 2 characters long',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const { data: user, error } = await supabase
      .from('users')
      .update({ 
        name: name.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('*')
      .single();

    if (error) {
      logger.error('Error updating user profile:', error);
      throw new Error('Failed to update user profile');
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

    logger.info('User profile updated', { userId, newName: name });

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        emailVerified: user.email_verified,
        lastLoginAt: user.last_login_at,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

// Get user profile by ID
router.get('/profile/:id',
  authenticateToken,
  asyncHandler(async (req: any, res: any) => {
    const userId = req.params.id;

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      logger.error('Error fetching user profile:', error);
      throw new Error('Failed to fetch user profile');
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

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        emailVerified: user.email_verified,
        lastLoginAt: user.last_login_at,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

// Create user profile
router.post('/profile',
  authenticateToken,
  asyncHandler(async (req: any, res: any) => {
    const userId = req.user.userId;
    const profileData = req.body;

    // For now, just update the user record with additional data
    const { data: user, error } = await supabase
      .from('users')
      .update({ 
        metadata: {
          ...profileData,
          updated_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('*')
      .single();

    if (error) {
      logger.error('Error creating user profile:', error);
      throw new Error('Failed to create user profile');
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

    logger.info('User profile created', { userId });

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        emailVerified: user.email_verified,
        lastLoginAt: user.last_login_at,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        metadata: user.metadata,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

// Get user usage statistics
router.get('/usage',
  authenticateToken,
  asyncHandler(async (req: any, res: any) => {
    const userId = req.user.userId;

    // Get sheet count
    const { count: totalSheets } = await supabase
      .from('sheets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get processed sheets count
    const { count: processedSheets } = await supabase
      .from('sheets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed');

    // Get total storage used
    const { data: userSheets } = await supabase
      .from('sheets')
      .select('size')
      .eq('user_id', userId);

    const totalStorageBytes = userSheets?.reduce((total, sheet) => total + (sheet.size || 0), 0) || 0;
    const totalStorageMB = Math.round(totalStorageBytes / (1024 * 1024));

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: recentUploads } = await supabase
      .from('sheets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('uploaded_at', thirtyDaysAgo.toISOString());

    // Get plan limits
    const userPlan = req.user.plan;
    const maxSheets = userPlan === 'premium' ? 1000 : 10;
    const maxStorageMB = userPlan === 'premium' ? 10240 : 100; // 10GB vs 100MB

    res.status(200).json({
      success: true,
      data: {
        sheets: {
          total: totalSheets || 0,
          processed: processedSheets || 0,
          remaining: Math.max(0, maxSheets - (totalSheets || 0)),
          usagePercentage: Math.round(((totalSheets || 0) / maxSheets) * 100),
        },
        storage: {
          usedMB: totalStorageMB,
          totalMB: maxStorageMB,
          remainingMB: Math.max(0, maxStorageMB - totalStorageMB),
          usagePercentage: Math.round((totalStorageMB / maxStorageMB) * 100),
        },
        activity: {
          uploadsLast30Days: recentUploads || 0,
          averageUploadsPerDay: Math.round((recentUploads || 0) / 30),
        },
        plan: userPlan,
        limits: {
          maxSheets,
          maxStorageMB,
        },
      },
      timestamp: new Date().toISOString(),
    });
  })
);

export { router as userRouter };