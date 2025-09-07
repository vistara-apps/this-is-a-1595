import React, { useState, useEffect } from 'react';
import NavHeader from './components/NavHeader';
import TrackingInput from './components/TrackingInput';
import ShipmentCard from './components/ShipmentCard';
import AlertNotification from './components/AlertNotification';
import SubscriptionModal from './components/SubscriptionModal';
import { useShipmentStore } from './hooks/useShipmentStore';
import { useAlerts } from './hooks/useAlerts';

function App() {
  const {
    shipments,
    addShipment,
    updateShipmentStatus,
    deleteShipment,
    isLoading,
    error
  } = useShipmentStore();
  
  const { alerts, dismissAlert } = useAlerts(shipments);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      shipments.forEach(shipment => {
        if (shipment.status !== 'delivered' && Math.random() < 0.1) {
          updateShipmentStatus(shipment.shipmentId);
        }
      });
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [shipments, updateShipmentStatus]);

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = shipment.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shipment.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'active') return matchesSearch && shipment.status !== 'delivered';
    if (filter === 'delivered') return matchesSearch && shipment.status === 'delivered';
    if (filter === 'delayed') return matchesSearch && shipment.status === 'delayed';
    
    return matchesSearch;
  });

  const handleAddShipment = (trackingData) => {
    if (shipments.length >= 3 && !showSubscriptionModal) {
      setShowSubscriptionModal(true);
      return;
    }
    addShipment(trackingData);
  };

  return (
    <div className="min-h-screen bg-bg">
      <NavHeader 
        onSearch={setSearchTerm}
        searchTerm={searchTerm}
        onUpgrade={() => setShowSubscriptionModal(true)}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div className="mb-8 space-y-4">
            {alerts.map(alert => (
              <AlertNotification
                key={alert.id}
                variant={alert.type}
                message={alert.message}
                onDismiss={() => dismissAlert(alert.id)}
              />
            ))}
          </div>
        )}

        {/* Add Tracking Section */}
        <div className="mb-8">
          <div className="card">
            <h2 className="text-2xl font-bold text-text mb-6">Add New Shipment</h2>
            <TrackingInput onAddShipment={handleAddShipment} isLoading={isLoading} />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All Shipments' },
              { key: 'active', label: 'Active' },
              { key: 'delivered', label: 'Delivered' },
              { key: 'delayed', label: 'Delayed' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-md font-medium transition-colors duration-150 ${
                  filter === key
                    ? 'bg-primary text-white'
                    : 'bg-surface text-text hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Shipments Grid */}
        {filteredShipments.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-gray-400 text-lg mb-4">
              {shipments.length === 0 ? 'No shipments tracked yet' : 'No shipments match your filter'}
            </div>
            {shipments.length === 0 && (
              <p className="text-gray-500">
                Add your first tracking number above to get started!
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredShipments.map(shipment => (
              <ShipmentCard
                key={shipment.shipmentId}
                shipment={shipment}
                onDelete={() => deleteShipment(shipment.shipmentId)}
              />
            ))}
          </div>
        )}

        {error && (
          <div className="mt-6">
            <AlertNotification
              variant="error"
              message={error}
              onDismiss={() => {}}
            />
          </div>
        )}
      </main>

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <SubscriptionModal
          onClose={() => setShowSubscriptionModal(false)}
          currentShipments={shipments.length}
        />
      )}
    </div>
  );
}

export default App;