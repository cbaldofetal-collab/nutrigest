import { Router } from 'express';
import Stripe from 'stripe';
import express from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { ENV } from '../config/constants';
import { logger } from '../utils/logger';
import { supabaseAdmin } from '../config/supabase';

const router = Router();

const stripe = ENV.STRIPE_SECRET_KEY ? new Stripe(ENV.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
}) : null;

// Stripe webhook endpoint
router.post('/stripe',
  express.raw({ type: 'application/json' }),
  asyncHandler(async (req: any, res: any) => {
    if (!stripe || !ENV.STRIPE_WEBHOOK_SECRET) {
      return res.status(501).json({
        success: false,
        error: {
          code: 'STRIPE_NOT_CONFIGURED',
          message: 'Stripe is not configured',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const sig = req.headers['stripe-signature'];
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig!, ENV.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      logger.error('Webhook signature verification failed:', err);
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SIGNATURE',
          message: 'Invalid webhook signature',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancellation(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSuccess(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailure(invoice);
        break;
      }

      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const status = subscription.status;
  const planId = subscription.items.data[0]?.price.id;

  try {
    // Find user by Stripe customer ID
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (!user) {
      logger.error('User not found for Stripe customer:', customerId);
      return;
    }

    // Update or create subscription
    const subscriptionData = {
      user_id: user.id,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      plan_id: planId,
      status: status,
      current_period_start: new Date().toISOString(), // Use current date as fallback
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Default to 30 days from now
      metadata: {
        cancel_at_period_end: subscription.cancel_at_period_end,
      },
    };

    const { error } = await supabaseAdmin
      .from('subscriptions')
      .upsert([subscriptionData], {
        onConflict: 'stripe_subscription_id',
      });

    if (error) {
      logger.error('Error updating subscription:', error);
    } else {
      logger.info('Subscription updated successfully:', subscription.id);
    }

    // Update user plan based on subscription status
    if (status === 'active') {
      await supabaseAdmin
        .from('users')
        .update({ plan: 'premium' })
        .eq('id', user.id);
    } else if (status === 'canceled' || status === 'unpaid') {
      await supabaseAdmin
        .from('users')
        .update({ plan: 'free' })
        .eq('id', user.id);
    }
  } catch (error) {
    logger.error('Error handling subscription update:', error);
  }
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  try {
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .update({ 
        status: 'canceled',
        canceled_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      logger.error('Error updating canceled subscription:', error);
    } else {
      logger.info('Subscription canceled:', subscription.id);
    }
  } catch (error) {
    logger.error('Error handling subscription cancellation:', error);
  }
}

async function handlePaymentSuccess(invoice: Stripe.Invoice) {
  if (invoice.billing_reason === 'subscription_create' || invoice.billing_reason === 'subscription_cycle') {
    logger.info('Payment succeeded for invoice:', invoice.id);
    
    // Here you could send confirmation emails, update usage metrics, etc.
    // For now, we'll just log it
  }
}

async function handlePaymentFailure(invoice: Stripe.Invoice) {
  logger.error('Payment failed for invoice:', invoice.id);
  
  // Here you could send failure notifications, update subscription status, etc.
  // For now, we'll just log it
}

export { router as webhookRouter };