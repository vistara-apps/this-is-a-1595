import React, { useState } from 'react';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Trash2, 
  Eye,
  Calendar
} from 'lucide-react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';

const statusConfig = {
  'pending': { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-100' },
  'in_transit': { icon: Truck, color: 'text-blue-500', bg: 'bg-blue-100' },
  'out_for_delivery': { icon: MapPin, color: 'text-orange-500', bg: 'bg-orange-100' },
  'delivered': { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100' },
  'delayed': { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-100' },
  'exception': { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-100' },
};

const carrierNames = {
  'ups': 'UPS',
  'fedex': 'FedEx',
  'usps': 'USPS',
  'dhl': 'DHL',
  'other': 'Other'
};

const ShipmentCard = ({ shipment, onDelete }) => {
  const [showDetails, setShowDetails] = useState(false);
  const statusInfo = statusConfig[shipment.status] || statusConfig['pending'];
  const StatusIcon = statusInfo.icon;
  
  const formatDeliveryDate = (date) => {
    if (!date) return 'Unknown';
    
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    
    return format(date, 'MMM d, yyyy');
  };

  const getDeliveryStatus = () => {
    if (shipment.status === 'delivered') {
      return {
        text: `Delivered ${format(shipment.actualDelivery, 'MMM d, h:mm a')}`,
        class: 'text-green-600'
      };
    }
    
    if (!shipment.estimatedDelivery) {
      return { text: 'Estimated delivery unknown', class: 'text-gray-500' };
    }
    
    const isLate = isPast(shipment.estimatedDelivery) && shipment.status !== 'delivered';
    
    return {
      text: `Est. delivery: ${formatDeliveryDate(shipment.estimatedDelivery)}`,
      class: isLate ? 'text-red-600' : 'text-gray-600'
    };
  };

  const deliveryInfo = getDeliveryStatus();

  return (
    <div className="card hover:shadow-lg transition-shadow duration-250 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-md ${statusInfo.bg}`}>
            <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
          </div>
          <div>
            <h3 className="font-semibold text-text">{shipment.nickname}</h3>
            <p className="text-sm text-gray-500">{carrierNames[shipment.carrier]}</p>
          </div>
        </div>
        
        <button
          onClick={onDelete}
          className="p-1 text-gray-400 hover:text-red-500 transition-colors duration-150"
          title="Delete shipment"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Status */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm font-medium ${statusInfo.color} capitalize`}>
            {shipment.status.replace('_', ' ')}
          </span>
          <span className="text-xs text-gray-500">
            {format(shipment.lastUpdated, 'MMM d, h:mm a')}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              shipment.status === 'delivered' ? 'bg-green-500' :
              shipment.status === 'delayed' || shipment.status === 'exception' ? 'bg-red-500' :
              shipment.status === 'out_for_delivery' ? 'bg-orange-500' :
              shipment.status === 'in_transit' ? 'bg-blue-500' : 'bg-gray-400'
            }`}
            style={{ 
              width: 
                shipment.status === 'delivered' ? '100%' :
                shipment.status === 'out_for_delivery' ? '80%' :
                shipment.status === 'in_transit' ? '60%' :
                shipment.status === 'pending' ? '20%' : '40%'
            }}
          />
        </div>
      </div>

      {/* Delivery Info */}
      <div className="mb-4">
        <div className="flex items-center space-x-2 text-sm">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className={deliveryInfo.class}>{deliveryInfo.text}</span>
        </div>
      </div>

      {/* Tracking Number */}
      <div className="mb-4 p-3 bg-gray-50 rounded-md">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Tracking Number</span>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center space-x-1 text-primary hover:text-blue-600 transition-colors duration-150"
          >
            <Eye className="w-4 h-4" />
            <span className="text-sm">{showDetails ? 'Hide' : 'Details'}</span>
          </button>
        </div>
        <div className="font-mono text-sm text-text mt-1">
          {showDetails ? shipment.trackingNumber : 
           `${shipment.trackingNumber.slice(0, 4)}...${shipment.trackingNumber.slice(-4)}`}
        </div>
      </div>

      {/* Recent Activity */}
      {shipment.historicalStatuses && shipment.historicalStatuses.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Activity</h4>
          <div className="space-y-2">
            {shipment.historicalStatuses.slice(-2).map((status, index) => (
              <div key={index} className="flex justify-between items-center text-xs text-gray-600">
                <span className="capitalize">{status.status.replace('_', ' ')}</span>
                <span>{format(status.timestamp, 'MMM d, h:mm a')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShipmentCard;