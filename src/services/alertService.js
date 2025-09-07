/**
 * Advanced Alert Service
 * Handles proactive delay detection, smart notifications, and alert management
 */

import { sendNotificationEmail, getUserPreferences } from './api.js';
import { hasPremiumFeatures } from './subscriptionService.js';

// Alert types and their configurations
export const ALERT_TYPES = {
  DELAY_DETECTED: {
    type: 'warning',
    priority: 'high',
    title: 'Shipment Delayed',
    icon: '⚠️'
  },
  DELIVERY_SOON: {
    type: 'info',
    priority: 'medium',
    title: 'Delivery Today',
    icon: '📦'
  },
  DELIVERED: {
    type: 'success',
    priority: 'medium',
    title: 'Package Delivered',
    icon: '✅'
  },
  EXCEPTION: {
    type: 'error',
    priority: 'high',
    title: 'Delivery Exception',
    icon: '❌'
  },
  WEATHER_DELAY: {
    type: 'warning',
    priority: 'medium',
    title: 'Weather Delay',
    icon: '🌧️'
  },
  CUSTOMS_DELAY: {
    type: 'warning',
    priority: 'medium',
    title: 'Customs Processing',
    icon: '🛃'
  },
  ADDRESS_ISSUE: {
    type: 'error',
    priority: 'high',
    title: 'Address Problem',
    icon: '🏠'
  }
};

/**
 * Analyze shipment for potential issues and generate alerts
 */
export const analyzeShipmentForAlerts = (shipment, previousStatus = null) => {
  const alerts = [];
  const now = new Date();
  
  // Check for delivery delays
  if (shipment.estimatedDelivery && now > new Date(shipment.estimatedDelivery)) {
    if (shipment.status !== 'delivered' && shipment.status !== 'delayed') {
      alerts.push(createAlert(
        ALERT_TYPES.DELAY_DETECTED,
        `${shipment.nickname} is ${getDaysOverdue(shipment.estimatedDelivery)} day(s) overdue`,
        shipment
      ));
    }
  }
  
  // Check for explicit delay status
  if (shipment.status === 'delayed') {
    const delayReason = getDelayReason(shipment);
    const alertType = getDelayAlertType(delayReason);
    
    alerts.push(createAlert(
      alertType,
      `${shipment.nickname}: ${delayReason}`,
      shipment
    ));
  }
  
  // Check for delivery today
  if (shipment.status === 'out_for_delivery') {
    alerts.push(createAlert(
      ALERT_TYPES.DELIVERY_SOON,
      `${shipment.nickname} is out for delivery and should arrive today`,
      shipment
    ));
  }
  
  // Check for successful delivery
  if (shipment.status === 'delivered' && previousStatus !== 'delivered') {
    alerts.push(createAlert(
      ALERT_TYPES.DELIVERED,
      `${shipment.nickname} has been successfully delivered`,
      shipment
    ));
  }
  
  // Check for stuck shipments (no updates for extended period)
  if (isShipmentStuck(shipment)) {
    alerts.push(createAlert(
      ALERT_TYPES.EXCEPTION,
      `${shipment.nickname} hasn't been updated in ${getHoursSinceUpdate(shipment)} hours`,
      shipment
    ));
  }
  
  // Premium feature: Advanced pattern detection
  if (hasPremiumFeatures()) {
    const advancedAlerts = detectAdvancedPatterns(shipment);
    alerts.push(...advancedAlerts);
  }
  
  return alerts;
};

/**
 * Create a standardized alert object
 */
const createAlert = (alertType, message, shipment, metadata = {}) => {
  return {
    id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    type: alertType.type,
    priority: alertType.priority,
    title: alertType.title,
    message,
    icon: alertType.icon,
    timestamp: new Date(),
    shipmentId: shipment.shipmentId,
    trackingNumber: shipment.trackingNumber,
    dismissed: false,
    metadata: {
      carrier: shipment.carrier,
      status: shipment.status,
      ...metadata
    }
  };
};

/**
 * Get delay reason from shipment history
 */
const getDelayReason = (shipment) => {
  const latestStatus = shipment.historicalStatuses?.[shipment.historicalStatuses.length - 1];
  
  if (latestStatus?.location?.toLowerCase().includes('weather')) {
    return 'Weather conditions causing delays';
  }
  
  if (latestStatus?.location?.toLowerCase().includes('customs')) {
    return 'Customs processing delay';
  }
  
  if (latestStatus?.location?.toLowerCase().includes('address')) {
    return 'Address verification required';
  }
  
  return 'Unexpected delay in transit';
};

/**
 * Get appropriate alert type based on delay reason
 */
const getDelayAlertType = (reason) => {
  if (reason.toLowerCase().includes('weather')) {
    return ALERT_TYPES.WEATHER_DELAY;
  }
  
  if (reason.toLowerCase().includes('customs')) {
    return ALERT_TYPES.CUSTOMS_DELAY;
  }
  
  if (reason.toLowerCase().includes('address')) {
    return ALERT_TYPES.ADDRESS_ISSUE;
  }
  
  return ALERT_TYPES.DELAY_DETECTED;
};

/**
 * Calculate days overdue
 */
const getDaysOverdue = (estimatedDelivery) => {
  const now = new Date();
  const estimated = new Date(estimatedDelivery);
  const diffTime = now - estimated;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Check if shipment appears to be stuck
 */
const isShipmentStuck = (shipment) => {
  if (shipment.status === 'delivered') return false;
  
  const hoursSinceUpdate = getHoursSinceUpdate(shipment);
  
  // Consider stuck if no updates for more than 48 hours for active shipments
  return hoursSinceUpdate > 48 && ['in_transit', 'pending'].includes(shipment.status);
};

/**
 * Get hours since last update
 */
const getHoursSinceUpdate = (shipment) => {
  const now = new Date();
  const lastUpdate = new Date(shipment.lastUpdated);
  return Math.floor((now - lastUpdate) / (1000 * 60 * 60));
};

/**
 * Advanced pattern detection for premium users
 */
const detectAdvancedPatterns = (shipment) => {
  const alerts = [];
  
  // Detect unusual routing patterns
  if (hasUnusualRouting(shipment)) {
    alerts.push(createAlert(
      ALERT_TYPES.EXCEPTION,
      `${shipment.nickname} is taking an unusual route - may indicate processing issues`,
      shipment,
      { pattern: 'unusual_routing' }
    ));
  }
  
  // Detect carrier-specific issues
  const carrierIssues = detectCarrierIssues(shipment);
  if (carrierIssues) {
    alerts.push(createAlert(
      ALERT_TYPES.DELAY_DETECTED,
      `${shipment.nickname}: ${carrierIssues}`,
      shipment,
      { pattern: 'carrier_issue' }
    ));
  }
  
  return alerts;
};

/**
 * Detect unusual routing patterns
 */
const hasUnusualRouting = (shipment) => {
  if (!shipment.historicalStatuses || shipment.historicalStatuses.length < 3) {
    return false;
  }
  
  // Simple heuristic: if package has been to the same location multiple times
  const locations = shipment.historicalStatuses.map(status => status.location);
  const uniqueLocations = new Set(locations);
  
  return locations.length > uniqueLocations.size + 1;
};

/**
 * Detect carrier-specific issues
 */
const detectCarrierIssues = (shipment) => {
  // Mock carrier-specific issue detection
  // In a real app, this would analyze carrier-specific patterns
  
  if (shipment.carrier === 'usps' && getHoursSinceUpdate(shipment) > 72) {
    return 'USPS packages often experience delays during peak seasons';
  }
  
  if (shipment.carrier === 'fedex' && shipment.status === 'in_transit') {
    const transitDays = Math.floor((new Date() - new Date(shipment.historicalStatuses[0]?.timestamp)) / (1000 * 60 * 60 * 24));
    if (transitDays > 5) {
      return 'FedEx shipment has been in transit longer than typical';
    }
  }
  
  return null;
};

/**
 * Process and send email notifications for alerts
 */
export const processAlertNotifications = async (alerts, userEmail) => {
  if (!alerts.length) return;
  
  try {
    const preferences = await getUserPreferences();
    
    if (!preferences.emailNotifications) return;
    
    // Filter alerts based on user preferences
    const filteredAlerts = alerts.filter(alert => {
      if (alert.type === 'warning' && !preferences.delayAlerts) return false;
      if (alert.type === 'success' && !preferences.deliveryAlerts) return false;
      return true;
    });
    
    // Send notifications for high-priority alerts immediately
    const highPriorityAlerts = filteredAlerts.filter(alert => alert.priority === 'high');
    
    for (const alert of highPriorityAlerts) {
      await sendNotificationEmail(userEmail, 'alert', {
        trackingNumber: alert.trackingNumber,
        status: alert.metadata.status,
        message: alert.message,
        title: alert.title
      });
    }
    
    // Batch medium/low priority alerts for digest
    const otherAlerts = filteredAlerts.filter(alert => alert.priority !== 'high');
    if (otherAlerts.length > 0) {
      await sendNotificationEmail(userEmail, 'digest', {
        alerts: otherAlerts,
        count: otherAlerts.length
      });
    }
    
  } catch (error) {
    console.error('Failed to send alert notifications:', error);
  }
};

/**
 * Get alert summary for dashboard
 */
export const getAlertSummary = (alerts) => {
  const summary = {
    total: alerts.length,
    high: alerts.filter(a => a.priority === 'high').length,
    medium: alerts.filter(a => a.priority === 'medium').length,
    low: alerts.filter(a => a.priority === 'low').length,
    types: {}
  };
  
  // Count by type
  alerts.forEach(alert => {
    summary.types[alert.type] = (summary.types[alert.type] || 0) + 1;
  });
  
  return summary;
};

/**
 * Smart alert deduplication
 */
export const deduplicateAlerts = (newAlerts, existingAlerts) => {
  return newAlerts.filter(newAlert => {
    return !existingAlerts.some(existing => 
      existing.shipmentId === newAlert.shipmentId &&
      existing.type === newAlert.type &&
      existing.title === newAlert.title &&
      !existing.dismissed
    );
  });
};

/**
 * Auto-dismiss outdated alerts
 */
export const cleanupOutdatedAlerts = (alerts, shipments) => {
  return alerts.filter(alert => {
    const shipment = shipments.find(s => s.shipmentId === alert.shipmentId);
    
    // Remove alerts for deleted shipments
    if (!shipment) return false;
    
    // Remove delivery alerts for packages that are no longer out for delivery
    if (alert.title === 'Delivery Today' && shipment.status !== 'out_for_delivery') {
      return false;
    }
    
    // Remove delay alerts for delivered packages
    if (alert.type === 'warning' && shipment.status === 'delivered') {
      return false;
    }
    
    // Remove alerts older than 7 days
    const alertAge = (new Date() - new Date(alert.timestamp)) / (1000 * 60 * 60 * 24);
    if (alertAge > 7) return false;
    
    return true;
  });
};
