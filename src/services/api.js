/**
 * API Service Layer for ShipmentTrackr
 * Handles all external API communications including tracking, payments, and notifications
 */

// Mock API endpoints - In production, these would be real API endpoints
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.shipmenttrackr.com';
const TRACKING_API_KEY = import.meta.env.VITE_TRACKING_API_KEY || 'demo_key';

// Carrier detection patterns
const CARRIER_PATTERNS = {
  ups: /^1Z[0-9A-Z]{16}$/,
  fedex: /^[0-9]{12,14}$/,
  usps: /^(94|93|92|94|95)[0-9]{20}$/,
  dhl: /^[0-9]{10,11}$/
};

/**
 * Detect carrier from tracking number pattern
 */
export const detectCarrier = (trackingNumber) => {
  const cleaned = trackingNumber.replace(/\s+/g, '').toUpperCase();
  
  for (const [carrier, pattern] of Object.entries(CARRIER_PATTERNS)) {
    if (pattern.test(cleaned)) {
      return carrier;
    }
  }
  
  return 'unknown';
};

/**
 * Fetch shipment tracking data from carrier APIs
 */
export const fetchTrackingData = async (trackingNumber, carrier) => {
  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Mock API response - In production, this would call real carrier APIs
    const mockResponse = generateMockTrackingData(trackingNumber, carrier);
    
    // Simulate occasional API failures
    if (Math.random() < 0.1) {
      throw new Error('Carrier API temporarily unavailable');
    }
    
    return mockResponse;
  } catch (error) {
    console.error('Tracking API Error:', error);
    throw new Error(`Failed to fetch tracking data: ${error.message}`);
  }
};

/**
 * Generate mock tracking data for development/demo
 */
const generateMockTrackingData = (trackingNumber, carrier) => {
  const statuses = ['pending', 'in_transit', 'out_for_delivery', 'delivered'];
  const currentStatusIndex = Math.floor(Math.random() * statuses.length);
  const currentStatus = statuses[currentStatusIndex];
  
  // Simulate delays
  const isDelayed = Math.random() < 0.15;
  const finalStatus = isDelayed && currentStatus !== 'delivered' ? 'delayed' : currentStatus;
  
  const now = new Date();
  const estimatedDelivery = new Date(now.getTime() + (Math.random() * 7 + 1) * 24 * 60 * 60 * 1000);
  
  // Generate realistic tracking history
  const historicalStatuses = [];
  const statusesToShow = isDelayed ? currentStatusIndex + 1 : currentStatusIndex + 1;
  
  for (let i = 0; i < statusesToShow; i++) {
    const hoursAgo = (statusesToShow - i) * 8 + Math.random() * 4;
    historicalStatuses.push({
      status: statuses[i],
      timestamp: new Date(now.getTime() - hoursAgo * 60 * 60 * 1000),
      location: generateLocation(carrier, statuses[i]),
      description: generateStatusDescription(statuses[i])
    });
  }
  
  if (isDelayed) {
    historicalStatuses.push({
      status: 'delayed',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      location: 'In Transit',
      description: 'Package delayed due to weather conditions'
    });
  }
  
  return {
    trackingNumber,
    carrier,
    status: finalStatus,
    estimatedDelivery,
    actualDelivery: finalStatus === 'delivered' ? 
      new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000) : null,
    lastUpdated: now,
    historicalStatuses,
    carrierDetails: {
      service: getCarrierService(carrier),
      weight: `${(Math.random() * 10 + 0.5).toFixed(1)} lbs`,
      dimensions: `${Math.floor(Math.random() * 20 + 5)}"x${Math.floor(Math.random() * 15 + 5)}"x${Math.floor(Math.random() * 10 + 3)}"`
    }
  };
};

const generateLocation = (carrier, status) => {
  const locations = {
    ups: ['Atlanta, GA', 'Louisville, KY', 'Chicago, IL', 'Los Angeles, CA'],
    fedex: ['Memphis, TN', 'Indianapolis, IN', 'Oakland, CA', 'Newark, NJ'],
    usps: ['Chicago, IL', 'Los Angeles, CA', 'New York, NY', 'Atlanta, GA'],
    dhl: ['Cincinnati, OH', 'Los Angeles, CA', 'New York, NY', 'Miami, FL']
  };
  
  const carrierLocations = locations[carrier] || locations.ups;
  return carrierLocations[Math.floor(Math.random() * carrierLocations.length)];
};

const generateStatusDescription = (status) => {
  const descriptions = {
    pending: 'Package information received',
    in_transit: 'Package is in transit to destination',
    out_for_delivery: 'Package is out for delivery',
    delivered: 'Package has been delivered',
    delayed: 'Package delivery delayed'
  };
  
  return descriptions[status] || 'Status update';
};

const getCarrierService = (carrier) => {
  const services = {
    ups: ['UPS Ground', 'UPS 2nd Day Air', 'UPS Next Day Air'],
    fedex: ['FedEx Ground', 'FedEx Express', 'FedEx 2Day'],
    usps: ['USPS Priority Mail', 'USPS First-Class', 'USPS Express'],
    dhl: ['DHL Express', 'DHL Ground', 'DHL International']
  };
  
  const carrierServices = services[carrier] || services.ups;
  return carrierServices[Math.floor(Math.random() * carrierServices.length)];
};

/**
 * Stripe Payment Integration
 */
export const createPaymentIntent = async (planType, userEmail) => {
  try {
    // Mock Stripe API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const amounts = {
      basic: 500, // $5.00
      premium: 1000 // $10.00
    };
    
    return {
      clientSecret: `pi_mock_${Date.now()}_secret`,
      amount: amounts[planType] || amounts.basic,
      currency: 'usd',
      paymentIntentId: `pi_mock_${Date.now()}`
    };
  } catch (error) {
    throw new Error(`Payment processing failed: ${error.message}`);
  }
};

/**
 * Subscription Management
 */
export const createSubscription = async (paymentMethodId, planType, userEmail) => {
  try {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      subscriptionId: `sub_mock_${Date.now()}`,
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      plan: planType,
      amount: planType === 'premium' ? 1000 : 500
    };
  } catch (error) {
    throw new Error(`Subscription creation failed: ${error.message}`);
  }
};

/**
 * Email Notification Service
 */
export const sendNotificationEmail = async (userEmail, notificationType, shipmentData) => {
  try {
    // Mock email service call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log(`Email sent to ${userEmail}:`, {
      type: notificationType,
      shipment: shipmentData.trackingNumber,
      status: shipmentData.status
    });
    
    return { success: true, messageId: `msg_${Date.now()}` };
  } catch (error) {
    console.error('Email notification failed:', error);
    throw error;
  }
};

/**
 * User preferences and settings
 */
export const updateUserPreferences = async (userId, preferences) => {
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Store in localStorage for demo
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to update preferences: ${error.message}`);
  }
};

export const getUserPreferences = async (userId) => {
  try {
    const stored = localStorage.getItem('userPreferences');
    return stored ? JSON.parse(stored) : {
      emailNotifications: true,
      delayAlerts: true,
      deliveryAlerts: true,
      weeklyDigest: false
    };
  } catch (error) {
    return {
      emailNotifications: true,
      delayAlerts: true,
      deliveryAlerts: true,
      weeklyDigest: false
    };
  }
};
