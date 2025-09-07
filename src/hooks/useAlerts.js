import { useState, useEffect } from 'react';
import { isPast, isToday, isTomorrow } from 'date-fns';

export const useAlerts = (shipments) => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const newAlerts = [];

    shipments.forEach(shipment => {
      // Delay alerts
      if (shipment.status === 'delayed') {
        newAlerts.push({
          id: `delay-${shipment.shipmentId}`,
          type: 'warning',
          message: `⚠️ Shipment "${shipment.nickname}" is experiencing delays. We'll keep monitoring.`,
          shipmentId: shipment.shipmentId
        });
      }

      // Exception alerts
      if (shipment.status === 'exception') {
        newAlerts.push({
          id: `exception-${shipment.shipmentId}`,
          type: 'error',
          message: `🚨 Issue detected with "${shipment.nickname}". Check with carrier for details.`,
          shipmentId: shipment.shipmentId
        });
      }

      // Delivery alerts
      if (shipment.status === 'delivered' && shipment.actualDelivery) {
        const deliveredRecently = (new Date() - shipment.actualDelivery) < 60000; // Last minute
        if (deliveredRecently) {
          newAlerts.push({
            id: `delivered-${shipment.shipmentId}`,
            type: 'success',
            message: `✅ Great news! "${shipment.nickname}" has been delivered.`,
            shipmentId: shipment.shipmentId
          });
        }
      }

      // Late delivery alerts
      if (
        shipment.estimatedDelivery &&
        isPast(shipment.estimatedDelivery) &&
        shipment.status !== 'delivered' &&
        shipment.status !== 'delayed'
      ) {
        newAlerts.push({
          id: `late-${shipment.shipmentId}`,
          type: 'warning',
          message: `📅 "${shipment.nickname}" was expected yesterday but hasn't been delivered yet.`,
          shipmentId: shipment.shipmentId
        });
      }

      // Delivery today alerts
      if (
        shipment.estimatedDelivery &&
        isToday(shipment.estimatedDelivery) &&
        shipment.status === 'out_for_delivery'
      ) {
        newAlerts.push({
          id: `today-${shipment.shipmentId}`,
          type: 'info',
          message: `📦 "${shipment.nickname}" is out for delivery and should arrive today!`,
          shipmentId: shipment.shipmentId
        });
      }

      // Delivery tomorrow alerts
      if (
        shipment.estimatedDelivery &&
        isTomorrow(shipment.estimatedDelivery) &&
        shipment.status === 'in_transit'
      ) {
        newAlerts.push({
          id: `tomorrow-${shipment.shipmentId}`,
          type: 'info',
          message: `🚛 "${shipment.nickname}" should arrive tomorrow. We'll notify you of any changes.`,
          shipmentId: shipment.shipmentId
        });
      }
    });

    setAlerts(newAlerts);
  }, [shipments]);

  const dismissAlert = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  return { alerts, dismissAlert };
};