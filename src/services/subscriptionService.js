/**
 * Subscription Management Service
 * Handles user subscription state, limits, and billing
 */

import { createPaymentIntent, createSubscription } from './api.js';

// Subscription plans configuration
export const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    shipmentLimit: 3,
    features: [
      'Track up to 3 shipments',
      'Basic tracking updates',
      'Email notifications'
    ]
  },
  basic: {
    name: 'Basic',
    price: 5,
    shipmentLimit: 10,
    features: [
      'Track up to 10 shipments',
      'Basic tracking updates',
      'Email notifications',
      'Shipment history'
    ]
  },
  premium: {
    name: 'Premium',
    price: 10,
    shipmentLimit: Infinity,
    features: [
      'Unlimited shipments',
      'Real-time tracking updates',
      'Proactive delay alerts',
      'Advanced filtering & search',
      'Export shipment data',
      'Priority support'
    ]
  }
};

/**
 * Get current user subscription from localStorage
 */
export const getCurrentSubscription = () => {
  try {
    const stored = localStorage.getItem('userSubscription');
    if (stored) {
      const subscription = JSON.parse(stored);
      // Check if subscription is still valid
      if (subscription.currentPeriodEnd && new Date(subscription.currentPeriodEnd) > new Date()) {
        return subscription;
      }
    }
  } catch (error) {
    console.error('Error loading subscription:', error);
  }
  
  // Return free plan as default
  return {
    plan: 'free',
    status: 'active',
    currentPeriodEnd: null,
    subscriptionId: null
  };
};

/**
 * Update user subscription in localStorage
 */
export const updateSubscription = (subscriptionData) => {
  try {
    localStorage.setItem('userSubscription', JSON.stringify(subscriptionData));
    return true;
  } catch (error) {
    console.error('Error saving subscription:', error);
    return false;
  }
};

/**
 * Check if user can add more shipments based on their plan
 */
export const canAddShipment = (currentShipmentCount) => {
  const subscription = getCurrentSubscription();
  const plan = SUBSCRIPTION_PLANS[subscription.plan] || SUBSCRIPTION_PLANS.free;
  
  return currentShipmentCount < plan.shipmentLimit;
};

/**
 * Get remaining shipments for current plan
 */
export const getRemainingShipments = (currentShipmentCount) => {
  const subscription = getCurrentSubscription();
  const plan = SUBSCRIPTION_PLANS[subscription.plan] || SUBSCRIPTION_PLANS.free;
  
  if (plan.shipmentLimit === Infinity) {
    return Infinity;
  }
  
  return Math.max(0, plan.shipmentLimit - currentShipmentCount);
};

/**
 * Check if user has access to premium features
 */
export const hasPremiumFeatures = () => {
  const subscription = getCurrentSubscription();
  return subscription.plan === 'premium' && subscription.status === 'active';
};

/**
 * Check if user has access to basic features
 */
export const hasBasicFeatures = () => {
  const subscription = getCurrentSubscription();
  return ['basic', 'premium'].includes(subscription.plan) && subscription.status === 'active';
};

/**
 * Process subscription upgrade
 */
export const processSubscriptionUpgrade = async (planType, paymentMethodId, userEmail) => {
  try {
    // Create payment intent
    const paymentIntent = await createPaymentIntent(planType, userEmail);
    
    // In a real app, you would process the payment with Stripe here
    // For demo purposes, we'll simulate successful payment
    
    // Create subscription
    const subscriptionData = await createSubscription(paymentMethodId, planType, userEmail);
    
    // Update local subscription state
    const updatedSubscription = {
      plan: planType,
      status: subscriptionData.status,
      currentPeriodEnd: subscriptionData.currentPeriodEnd,
      subscriptionId: subscriptionData.subscriptionId,
      amount: subscriptionData.amount,
      paymentIntentId: paymentIntent.paymentIntentId
    };
    
    updateSubscription(updatedSubscription);
    
    return {
      success: true,
      subscription: updatedSubscription
    };
  } catch (error) {
    console.error('Subscription upgrade failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async () => {
  try {
    const currentSubscription = getCurrentSubscription();
    
    if (currentSubscription.subscriptionId) {
      // In a real app, you would call Stripe to cancel the subscription
      // For demo purposes, we'll just update the local state
      
      const canceledSubscription = {
        ...currentSubscription,
        status: 'canceled',
        canceledAt: new Date().toISOString()
      };
      
      updateSubscription(canceledSubscription);
      
      return {
        success: true,
        subscription: canceledSubscription
      };
    }
    
    return {
      success: false,
      error: 'No active subscription to cancel'
    };
  } catch (error) {
    console.error('Subscription cancellation failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get subscription status for display
 */
export const getSubscriptionStatus = () => {
  const subscription = getCurrentSubscription();
  const plan = SUBSCRIPTION_PLANS[subscription.plan] || SUBSCRIPTION_PLANS.free;
  
  let statusText = '';
  let statusColor = 'text-gray-600';
  
  switch (subscription.status) {
    case 'active':
      if (subscription.plan === 'free') {
        statusText = 'Free Plan';
        statusColor = 'text-gray-600';
      } else {
        statusText = `${plan.name} Plan - Active`;
        statusColor = 'text-green-600';
      }
      break;
    case 'canceled':
      statusText = `${plan.name} Plan - Canceled`;
      statusColor = 'text-red-600';
      break;
    case 'past_due':
      statusText = `${plan.name} Plan - Payment Due`;
      statusColor = 'text-yellow-600';
      break;
    default:
      statusText = 'Unknown Status';
      statusColor = 'text-gray-600';
  }
  
  return {
    text: statusText,
    color: statusColor,
    plan: plan.name,
    price: plan.price,
    nextBilling: subscription.currentPeriodEnd
  };
};

/**
 * Check if subscription needs renewal warning
 */
export const needsRenewalWarning = () => {
  const subscription = getCurrentSubscription();
  
  if (!subscription.currentPeriodEnd || subscription.plan === 'free') {
    return false;
  }
  
  const endDate = new Date(subscription.currentPeriodEnd);
  const warningDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days before
  
  return new Date() >= warningDate;
};

/**
 * Get usage statistics for current billing period
 */
export const getUsageStats = (shipmentCount) => {
  const subscription = getCurrentSubscription();
  const plan = SUBSCRIPTION_PLANS[subscription.plan] || SUBSCRIPTION_PLANS.free;
  
  return {
    shipmentsUsed: shipmentCount,
    shipmentsLimit: plan.shipmentLimit,
    usagePercentage: plan.shipmentLimit === Infinity ? 0 : 
      Math.round((shipmentCount / plan.shipmentLimit) * 100),
    isNearLimit: plan.shipmentLimit !== Infinity && 
      (shipmentCount / plan.shipmentLimit) >= 0.8
  };
};
