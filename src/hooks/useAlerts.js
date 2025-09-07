import { useState, useEffect, useCallback } from 'react';
import { 
  analyzeShipmentForAlerts, 
  processAlertNotifications,
  deduplicateAlerts,
  cleanupOutdatedAlerts
} from '../services/alertService.js';
import { alertStorage } from '../services/storageService.js';

export const useAlerts = (shipments) => {
  const [alerts, setAlerts] = useState([]);
  const [previousShipments, setPreviousShipments] = useState([]);

  // Load saved alerts on initialization
  useEffect(() => {
    const savedAlerts = alertStorage.load();
    const cleanedAlerts = cleanupOutdatedAlerts(savedAlerts, shipments);
    setAlerts(cleanedAlerts);
    if (cleanedAlerts.length !== savedAlerts.length) {
      alertStorage.save(cleanedAlerts);
    }
  }, []);

  // Generate alerts based on shipment changes
  useEffect(() => {
    if (shipments.length === 0) return;

    const newAlerts = [];

    shipments.forEach(shipment => {
      // Find previous version of this shipment
      const previousShipment = previousShipments.find(
        prev => prev.shipmentId === shipment.shipmentId
      );
      
      const previousStatus = previousShipment?.status;
      
      // Analyze shipment for potential alerts
      const shipmentAlerts = analyzeShipmentForAlerts(shipment, previousStatus);
      newAlerts.push(...shipmentAlerts);
    });

    if (newAlerts.length > 0) {
      setAlerts(prevAlerts => {
        // Deduplicate alerts to avoid spam
        const uniqueNewAlerts = deduplicateAlerts(newAlerts, prevAlerts);
        
        if (uniqueNewAlerts.length === 0) return prevAlerts;
        
        const updatedAlerts = [...uniqueNewAlerts, ...prevAlerts];
        
        // Clean up outdated alerts
        const cleanedAlerts = cleanupOutdatedAlerts(updatedAlerts, shipments);
        
        // Persist to storage
        alertStorage.save(cleanedAlerts);
        
        // Send email notifications for new alerts (async, non-blocking)
        if (uniqueNewAlerts.length > 0) {
          processAlertNotifications(uniqueNewAlerts, 'user@example.com')
            .catch(error => console.error('Failed to send alert notifications:', error));
        }
        
        return cleanedAlerts;
      });
    }

    // Update previous shipments for next comparison
    setPreviousShipments(shipments);
  }, [shipments, previousShipments]);

  const dismissAlert = useCallback((alertId) => {
    setAlerts(prevAlerts => {
      const updatedAlerts = prevAlerts.map(alert =>
        alert.id === alertId
          ? { ...alert, dismissed: true, dismissedAt: new Date().toISOString() }
          : alert
      );
      
      alertStorage.save(updatedAlerts);
      return updatedAlerts.filter(alert => !alert.dismissed);
    });
  }, []);

  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
    alertStorage.save([]);
  }, []);

  const markAlertAsRead = useCallback((alertId) => {
    setAlerts(prevAlerts => {
      const updatedAlerts = prevAlerts.map(alert =>
        alert.id === alertId
          ? { ...alert, read: true, readAt: new Date().toISOString() }
          : alert
      );
      
      alertStorage.save(updatedAlerts);
      return updatedAlerts;
    });
  }, []);

  // Get alert counts by type/priority
  const getAlertCounts = useCallback(() => {
    return {
      total: alerts.length,
      unread: alerts.filter(alert => !alert.read).length,
      high: alerts.filter(alert => alert.priority === 'high').length,
      medium: alerts.filter(alert => alert.priority === 'medium').length,
      low: alerts.filter(alert => alert.priority === 'low').length,
      byType: {
        warning: alerts.filter(alert => alert.type === 'warning').length,
        error: alerts.filter(alert => alert.type === 'error').length,
        info: alerts.filter(alert => alert.type === 'info').length,
        success: alerts.filter(alert => alert.type === 'success').length
      }
    };
  }, [alerts]);

  return {
    alerts: alerts.filter(alert => !alert.dismissed),
    dismissAlert,
    clearAllAlerts,
    markAlertAsRead,
    getAlertCounts
  };
};
