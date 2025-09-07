import { useState, useCallback } from 'react';
import { addHours, addDays, subHours } from 'date-fns';

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
  const [shipments, setShipments] = useState(initialShipments);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const addShipment = useCallback(async (trackingData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check for duplicate tracking numbers
      const existingShipment = shipments.find(s => s.trackingNumber === trackingData.trackingNumber);
      if (existingShipment) {
        throw new Error('This tracking number is already being tracked');
      }
      
      const newShipment = generateTrackingData(trackingData);
      setShipments(prev => [newShipment, ...prev]);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [shipments]);

  const updateShipmentStatus = useCallback((shipmentId) => {
    setShipments(prev => prev.map(shipment => {
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
        location: `Updated location ${nextIndex + 1}`
      };
      
      return {
        ...shipment,
        status: newStatus,
        lastUpdated: now,
        actualDelivery: newStatus === 'delivered' ? now : shipment.actualDelivery,
        historicalStatuses: [...shipment.historicalStatuses, newHistoricalStatus]
      };
    }));
  }, []);

  const deleteShipment = useCallback((shipmentId) => {
    setShipments(prev => prev.filter(shipment => shipment.shipmentId !== shipmentId));
  }, []);

  return {
    shipments,
    addShipment,
    updateShipmentStatus,
    deleteShipment,
    isLoading,
    error
  };
};