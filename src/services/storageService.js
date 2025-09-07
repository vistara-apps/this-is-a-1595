/**
 * Data Persistence Service
 * Handles local storage, data synchronization, and offline capabilities
 */

// Storage keys
const STORAGE_KEYS = {
  SHIPMENTS: 'shipmenttrackr_shipments',
  ALERTS: 'shipmenttrackr_alerts',
  USER_PREFERENCES: 'shipmenttrackr_preferences',
  SUBSCRIPTION: 'shipmenttrackr_subscription',
  APP_STATE: 'shipmenttrackr_app_state',
  CACHE: 'shipmenttrackr_cache'
};

// Cache expiration times (in milliseconds)
const CACHE_EXPIRATION = {
  TRACKING_DATA: 5 * 60 * 1000, // 5 minutes
  USER_PREFERENCES: 30 * 60 * 1000, // 30 minutes
  SUBSCRIPTION_STATUS: 60 * 60 * 1000 // 1 hour
};

/**
 * Generic storage operations
 */
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading from storage (${key}):`, error);
      return defaultValue;
    }
  },

  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to storage (${key}):`, error);
      return false;
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from storage (${key}):`, error);
      return false;
    }
  },

  clear: () => {
    try {
      // Only clear our app's data
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }
};

/**
 * Shipment data persistence
 */
export const shipmentStorage = {
  save: (shipments) => {
    const data = {
      shipments,
      lastUpdated: new Date().toISOString(),
      version: '1.0'
    };
    return storage.set(STORAGE_KEYS.SHIPMENTS, data);
  },

  load: () => {
    const data = storage.get(STORAGE_KEYS.SHIPMENTS, { shipments: [], lastUpdated: null });
    return data.shipments || [];
  },

  addShipment: (shipment) => {
    const shipments = shipmentStorage.load();
    const updatedShipments = [shipment, ...shipments];
    return shipmentStorage.save(updatedShipments);
  },

  updateShipment: (shipmentId, updates) => {
    const shipments = shipmentStorage.load();
    const updatedShipments = shipments.map(shipment =>
      shipment.shipmentId === shipmentId
        ? { ...shipment, ...updates, lastUpdated: new Date().toISOString() }
        : shipment
    );
    return shipmentStorage.save(updatedShipments);
  },

  removeShipment: (shipmentId) => {
    const shipments = shipmentStorage.load();
    const filteredShipments = shipments.filter(s => s.shipmentId !== shipmentId);
    return shipmentStorage.save(filteredShipments);
  },

  getShipment: (shipmentId) => {
    const shipments = shipmentStorage.load();
    return shipments.find(s => s.shipmentId === shipmentId);
  }
};

/**
 * Alert data persistence
 */
export const alertStorage = {
  save: (alerts) => {
    const data = {
      alerts,
      lastUpdated: new Date().toISOString()
    };
    return storage.set(STORAGE_KEYS.ALERTS, data);
  },

  load: () => {
    const data = storage.get(STORAGE_KEYS.ALERTS, { alerts: [] });
    return data.alerts || [];
  },

  addAlert: (alert) => {
    const alerts = alertStorage.load();
    const updatedAlerts = [alert, ...alerts];
    return alertStorage.save(updatedAlerts);
  },

  dismissAlert: (alertId) => {
    const alerts = alertStorage.load();
    const updatedAlerts = alerts.map(alert =>
      alert.id === alertId
        ? { ...alert, dismissed: true, dismissedAt: new Date().toISOString() }
        : alert
    );
    return alertStorage.save(updatedAlerts);
  },

  removeAlert: (alertId) => {
    const alerts = alertStorage.load();
    const filteredAlerts = alerts.filter(a => a.id !== alertId);
    return alertStorage.save(filteredAlerts);
  },

  cleanup: () => {
    const alerts = alertStorage.load();
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    
    const cleanedAlerts = alerts.filter(alert => {
      const alertDate = new Date(alert.timestamp);
      return alertDate > cutoffDate;
    });
    
    return alertStorage.save(cleanedAlerts);
  }
};

/**
 * App state persistence
 */
export const appStateStorage = {
  save: (state) => {
    const data = {
      ...state,
      lastUpdated: new Date().toISOString()
    };
    return storage.set(STORAGE_KEYS.APP_STATE, data);
  },

  load: () => {
    return storage.get(STORAGE_KEYS.APP_STATE, {
      filter: 'all',
      searchTerm: '',
      sortBy: 'lastUpdated',
      sortOrder: 'desc',
      viewMode: 'grid'
    });
  },

  updateFilter: (filter) => {
    const state = appStateStorage.load();
    return appStateStorage.save({ ...state, filter });
  },

  updateSearch: (searchTerm) => {
    const state = appStateStorage.load();
    return appStateStorage.save({ ...state, searchTerm });
  },

  updateSort: (sortBy, sortOrder = 'desc') => {
    const state = appStateStorage.load();
    return appStateStorage.save({ ...state, sortBy, sortOrder });
  }
};

/**
 * Cache management
 */
export const cacheStorage = {
  set: (key, data, expiration = CACHE_EXPIRATION.TRACKING_DATA) => {
    const cacheItem = {
      data,
      timestamp: Date.now(),
      expiration
    };
    
    const cache = storage.get(STORAGE_KEYS.CACHE, {});
    cache[key] = cacheItem;
    return storage.set(STORAGE_KEYS.CACHE, cache);
  },

  get: (key) => {
    const cache = storage.get(STORAGE_KEYS.CACHE, {});
    const item = cache[key];
    
    if (!item) return null;
    
    // Check if expired
    if (Date.now() - item.timestamp > item.expiration) {
      cacheStorage.remove(key);
      return null;
    }
    
    return item.data;
  },

  remove: (key) => {
    const cache = storage.get(STORAGE_KEYS.CACHE, {});
    delete cache[key];
    return storage.set(STORAGE_KEYS.CACHE, cache);
  },

  clear: () => {
    return storage.set(STORAGE_KEYS.CACHE, {});
  },

  cleanup: () => {
    const cache = storage.get(STORAGE_KEYS.CACHE, {});
    const now = Date.now();
    
    const cleanedCache = {};
    Object.entries(cache).forEach(([key, item]) => {
      if (now - item.timestamp <= item.expiration) {
        cleanedCache[key] = item;
      }
    });
    
    return storage.set(STORAGE_KEYS.CACHE, cleanedCache);
  }
};

/**
 * Data export functionality
 */
export const dataExport = {
  exportShipments: (format = 'json') => {
    const shipments = shipmentStorage.load();
    const exportData = {
      shipments,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    if (format === 'json') {
      return JSON.stringify(exportData, null, 2);
    }

    if (format === 'csv') {
      return convertToCSV(shipments);
    }

    throw new Error(`Unsupported export format: ${format}`);
  },

  exportAlerts: () => {
    const alerts = alertStorage.load();
    return JSON.stringify({
      alerts,
      exportDate: new Date().toISOString()
    }, null, 2);
  },

  exportAll: () => {
    return JSON.stringify({
      shipments: shipmentStorage.load(),
      alerts: alertStorage.load(),
      preferences: storage.get(STORAGE_KEYS.USER_PREFERENCES),
      appState: appStateStorage.load(),
      exportDate: new Date().toISOString(),
      version: '1.0'
    }, null, 2);
  }
};

/**
 * Data import functionality
 */
export const dataImport = {
  importShipments: (jsonData) => {
    try {
      const data = JSON.parse(jsonData);
      if (data.shipments && Array.isArray(data.shipments)) {
        return shipmentStorage.save(data.shipments);
      }
      throw new Error('Invalid shipment data format');
    } catch (error) {
      console.error('Import failed:', error);
      return false;
    }
  },

  importAll: (jsonData) => {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.shipments) shipmentStorage.save(data.shipments);
      if (data.alerts) alertStorage.save(data.alerts);
      if (data.preferences) storage.set(STORAGE_KEYS.USER_PREFERENCES, data.preferences);
      if (data.appState) appStateStorage.save(data.appState);
      
      return true;
    } catch (error) {
      console.error('Import failed:', error);
      return false;
    }
  }
};

/**
 * Convert shipments to CSV format
 */
const convertToCSV = (shipments) => {
  if (!shipments.length) return '';

  const headers = [
    'Tracking Number',
    'Carrier',
    'Nickname',
    'Status',
    'Estimated Delivery',
    'Actual Delivery',
    'Last Updated'
  ];

  const rows = shipments.map(shipment => [
    shipment.trackingNumber,
    shipment.carrier,
    shipment.nickname,
    shipment.status,
    shipment.estimatedDelivery ? new Date(shipment.estimatedDelivery).toLocaleDateString() : '',
    shipment.actualDelivery ? new Date(shipment.actualDelivery).toLocaleDateString() : '',
    new Date(shipment.lastUpdated).toLocaleDateString()
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  return csvContent;
};

/**
 * Storage quota management
 */
export const storageQuota = {
  getUsage: () => {
    if (!navigator.storage || !navigator.storage.estimate) {
      return { used: 0, available: 0, percentage: 0 };
    }

    return navigator.storage.estimate().then(estimate => ({
      used: estimate.usage || 0,
      available: estimate.quota || 0,
      percentage: estimate.quota ? Math.round((estimate.usage / estimate.quota) * 100) : 0
    }));
  },

  isNearLimit: async () => {
    const usage = await storageQuota.getUsage();
    return usage.percentage > 80;
  },

  cleanup: () => {
    // Clean up old cache entries
    cacheStorage.cleanup();
    
    // Clean up old alerts
    alertStorage.cleanup();
    
    // Remove any orphaned data
    const shipments = shipmentStorage.load();
    const alerts = alertStorage.load();
    
    // Remove alerts for non-existent shipments
    const validAlerts = alerts.filter(alert =>
      shipments.some(shipment => shipment.shipmentId === alert.shipmentId)
    );
    
    if (validAlerts.length !== alerts.length) {
      alertStorage.save(validAlerts);
    }
  }
};

/**
 * Initialize storage on app start
 */
export const initializeStorage = () => {
  try {
    // Run cleanup on initialization
    storageQuota.cleanup();
    
    // Check storage availability
    if (typeof Storage === 'undefined') {
      console.warn('Local storage not available');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Storage initialization failed:', error);
    return false;
  }
};
