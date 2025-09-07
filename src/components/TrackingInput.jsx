import React, { useState } from 'react';
import { Plus, Truck } from 'lucide-react';

const carriers = [
  { id: 'ups', name: 'UPS', pattern: /^1Z[0-9A-Z]{16}$/ },
  { id: 'fedex', name: 'FedEx', pattern: /^[0-9]{12,14}$/ },
  { id: 'usps', name: 'USPS', pattern: /^(94|93|92|94|95)[0-9]{18,20}$/ },
  { id: 'dhl', name: 'DHL', pattern: /^[0-9]{10,11}$/ },
];

const TrackingInput = ({ onAddShipment, isLoading }) => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [nickname, setNickname] = useState('');
  const [selectedCarrier, setSelectedCarrier] = useState('');

  const detectCarrier = (number) => {
    for (const carrier of carriers) {
      if (carrier.pattern.test(number)) {
        return carrier.id;
      }
    }
    return 'other';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;

    const carrier = selectedCarrier || detectCarrier(trackingNumber);
    
    onAddShipment({
      trackingNumber: trackingNumber.trim(),
      nickname: nickname.trim() || `Package ${trackingNumber.slice(-4)}`,
      carrier,
    });

    // Reset form
    setTrackingNumber('');
    setNickname('');
    setSelectedCarrier('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="tracking" className="block text-sm font-medium text-text mb-2">
            Tracking Number *
          </label>
          <input
            id="tracking"
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Enter tracking number"
            className="input"
            required
          />
        </div>
        
        <div>
          <label htmlFor="nickname" className="block text-sm font-medium text-text mb-2">
            Nickname (Optional)
          </label>
          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="e.g., Amazon Order, Birthday Gift"
            className="input"
          />
        </div>
      </div>

      <div>
        <label htmlFor="carrier" className="block text-sm font-medium text-text mb-2">
          Carrier (Auto-detected)
        </label>
        <select
          id="carrier"
          value={selectedCarrier}
          onChange={(e) => setSelectedCarrier(e.target.value)}
          className="input"
        >
          <option value="">Auto-detect</option>
          {carriers.map(carrier => (
            <option key={carrier.id} value={carrier.id}>
              {carrier.name}
            </option>
          ))}
          <option value="other">Other</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading || !trackingNumber.trim()}
        className="btn-primary w-full sm:w-auto flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Truck className="w-4 h-4 animate-pulse" />
            <span>Adding...</span>
          </>
        ) : (
          <>
            <Plus className="w-4 h-4" />
            <span>Add Shipment</span>
          </>
        )}
      </button>
    </form>
  );
};

export default TrackingInput;