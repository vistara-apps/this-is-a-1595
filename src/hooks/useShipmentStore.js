import { useState, useCallback, useEffect } from 'react';
import { addHours, addDays, subHours } from 'date-fns';
import { fetchTrackingData, detectCarrier } from '../services/api.js';
import { canAddShipment } from '../services/subscriptionService.js';
import { shipmentStorage, initializeStorage } from '../services/storageService.js';

// Sample shipment data generator
const generateShipmentId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 5);
};

const generateTrackingData = (baseData) => {
  const statuses = ['pending', 'in_transit', 'out_for_delivery', 'delivered'];
  const currentStatus = statuses[Math.floor(Math.random() * statuses.length)];
  
  // Simulate some shipments being delayed
  const isDelayed = Math.random() < 0.2;
  const finalStatus = isDelayed && currentStatus !== 'delivered' ? 'delayed' : currentStatus;
  
  const now = new Date();
  const estimatedDelivery = addDays(now, Math.floor(Math.random() * 7) + 1);
  const actualDelivery = finalStatus === 'delivered' ? subHours(now, Math.floor(Math.random() * 24)) : null;
  
  // Generate historical statuses
  const historicalStatuses = [];
  let statusIndex = statuses.indexOf(currentStatus === 'delayed' ? 'in_transit' : currentStatus);
  
  for (let i = 0; i <= statusIndex; i++) {
    historicalStatuses.push({
      status: statuses[i],
      timestamp: addHours(now, -(statusIndex - i) * 6),
      location: `Distribution Center ${i + 1}`
    });
  }
  
  if (isDelayed) {
    historicalStatuses.push({
      status: 'delayed',
      timestamp: addHours(now, -2),
      location: 'Weather delay in transit'
    });
  }

  return {
    shipmentId: generateShipmentId(),
    trackingNumber: baseData.trackingNumber,
    carrier: baseData.carrier,
    nickname: baseData.nickname,
    status: finalStatus,
    estimatedDelivery,
    actualDelivery,
    lastUpdated: now,
    historicalStatuses
  };
};

// Initial sample data
const initialShipments = [
  {
    shipmentId: '1',
    trackingNumber: '1Z999AA1234567890',
    carrier: 'ups',
    nickname: 'Amazon Order',
    status: 'in_transit',
    estimatedDelivery: addDays(new Date(), 2),
    actualDelivery: null,
    lastUpdated: subHours(new Date(), 3),
    historicalStatuses: [
      { status: 'pending', timestamp: subHours(new Date(), 48), location: 'Package received' },
      { status: 'in_transit', timestamp: subHours(new Date(), 24), location: 'Memphis, TN' },
    ]
  },
  {
    shipmentId: '2',
    trackingNumber: '7123456789012',
    carrier: 'fedex',
    nickname: 'Birthday Gift',
    status: 'delayed',
    estimatedDelivery: addDays(new Date(), 1),
    actualDelivery: null,
    lastUpdated: subHours(new Date(), 1),
    historicalStatuses: [
      { status: 'pending', timestamp: subHours(new Date(), 72), location: 'Package received' },
      { status: 'in_transit', timestamp: subHours(new Date(), 48), location: 'Atlanta, GA' },
      { status: 'delayed', timestamp: subHours(new Date(), 12), location: 'Weather delay' },
    ]
  }
];

export const useShipmentStore = () => {
  const [shipments, setShipments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize storage and load saved shipments
  useEffect(() => {
    const initialize = async () => {
      try {
        const storageAvailable = initializeStorage();
        if (storageAvailable) {
          const savedShipments = shipmentStorage.load();
          if (savedShipments.length > 0) {
            setShipments(savedShipments);
          } else {
            // Load initial sample data if no saved shipments
            setShipments(initialShipments);
            shipmentStorage.save(initialShipments);
          }
        } else {
          // Fallback to initial data if storage not available
          setShipments(initialShipments);
        }
      } catch (error) {
        console.error('Failed to initialize shipment store:', error);
        setShipments(initialShipments);
      } finally {
        setIsInitialized(true);
      }
    };

    initialize();
  }, []);

  const addShipment = useCallback(async (trackingData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check subscription limits
      if (!canAddShipment(shipments.length)) {
        throw new Error('Shipment limit reached for your current plan');
      }
      
      // Check for duplicate tracking numbers
      const existingShipment = shipments.find(s => s.trackingNumber === trackingData.trackingNumber);
      if (existingShipment) {
        throw new Error('This tracking number is already being tracked');
      }
      
      // Auto-detect carrier if not provided
      const carrier = trackingData.carrier || detectCarrier(trackingData.trackingNumber);
      
      // Fetch real tracking data from API
      let shipmentData;
      try {
        shipmentData = await fetchTrackingData(trackingData.trackingNumber, carrier);
      } catch (apiError) {
        console.warn('API fetch failed, using mock data:', apiError);
        // Fallback to mock data if API fails
        shipmentData = generateTrackingData({ ...trackingData, carrier });
      }
      
      // Create complete shipment object
      const newShipment = {
        ...shipmentData,
        shipmentId: generateShipmentId(),
        nickname: trackingData.nickname || `${carrier.toUpperCase()} Package`,
        addedAt: new Date().toISOString()
      };
      
      // Update state and persist to storage
      const updatedShipments = [newShipment, ...shipments];
      setShipments(updatedShipments);
      shipmentStorage.save(updatedShipments);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [shipments]);

  const updateShipmentStatus = useCallback((shipmentId) => {
    setShipments(prev => {
      const updatedShipments = prev.map(shipment => {
        if (shipment.shipmentId !== shipmentId) return shipment;
        
        const statuses = ['pending', 'in_transit', 'out_for_delivery', 'delivered'];
        const currentIndex = statuses.indexOf(shipment.status);
        
        // Don't update if already delivered or if status progression doesn't make sense
        if (shipment.status === 'delivered' || shipment.status === 'delayed') return shipment;
        
        const nextIndex = Math.min(currentIndex + 1, statuses.length - 1);
        const newStatus = statuses[nextIndex];
        
        const now = new Date();
        const newHistoricalStatus = {
          status: newStatus,
          timestamp: now,
          location: `Updated location ${nextIndex + 1}`,
          description: generateStatusDescription(newStatus)
        };
        
        const updatedShipment = {
          ...shipment,
          status: newStatus,
          lastUpdated: now,
          actualDelivery: newStatus === 'delivered' ? now : shipment.actualDelivery,
          historicalStatuses: [...shipment.historicalStatuses, newHistoricalStatus]
        };
        
        return updatedShipment;
      });
      
      // Persist to storage
      shipmentStorage.save(updatedShipments);
      return updatedShipments;
    });
  }, []);

  const deleteShipment = useCallback((shipmentId) => {
    setShipments(prev => {
      const filteredShipments = prev.filter(shipment => shipment.shipmentId !== shipmentId);
      shipmentStorage.save(filteredShipments);
      return filteredShipments;
    });
  }, []);

  // Refresh shipment data from API
  const refreshShipment = useCallback(async (shipmentId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const shipment = shipments.find(s => s.shipmentId === shipmentId);
      if (!shipment) {
        throw new Error('Shipment not found');
      }
      
      const updatedData = await fetchTrackingData(shipment.trackingNumber, shipment.carrier);
      
      setShipments(prev => {
        const updatedShipments = prev.map(s =>
          s.shipmentId === shipmentId
            ? { ...s, ...updatedData, lastUpdated: new Date().toISOString() }
            : s
        );
        shipmentStorage.save(updatedShipments);
        return updatedShipments;
      });
      
    } catch (err) {
      setError(`Failed to refresh shipment: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [shipments]);

  // Bulk refresh all active shipments
  const refreshAllShipments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const activeShipments = shipments.filter(s => s.status !== 'delivered');
      const refreshPromises = activeShipments.map(async (shipment) => {
        try {
          const updatedData = await fetchTrackingData(shipment.trackingNumber, shipment.carrier);
          return { ...shipment, ...updatedData, lastUpdated: new Date().toISOString() };
        } catch (error) {
          console.warn(`Failed to refresh ${shipment.trackingNumber}:`, error);
          return shipment; // Return original if refresh fails
        }
      });
      
      const refreshedShipments = await Promise.all(refreshPromises);
      const deliveredShipments = shipments.filter(s => s.status === 'delivered');
      
      const allShipments = [...refreshedShipments, ...deliveredShipments];
      setShipments(allShipments);
      shipmentStorage.save(allShipments);
      
    } catch (err) {
      setError(`Failed to refresh shipments: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [shipments]);

  // Add helper function for status descriptions
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

  return {
    shipments,
    addShipment,
    updateShipmentStatus,
    deleteShipment,
    refreshShipment,
    refreshAllShipments,
    isLoading,
    error,
    isInitialized
  };
};
