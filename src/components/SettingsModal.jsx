import React, { useState, useEffect } from 'react';
import { X, Bell, Mail, Download, Upload, Trash2, Settings } from 'lucide-react';
import { getUserPreferences, updateUserPreferences } from '../services/api.js';
import { getSubscriptionStatus, cancelSubscription } from '../services/subscriptionService.js';
import { dataExport, dataImport } from '../services/storageService.js';

const SettingsModal = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('notifications');
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    delayAlerts: true,
    deliveryAlerts: true,
    weeklyDigest: false
  });
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const userPrefs = await getUserPreferences();
      setPreferences(userPrefs);
      
      const subStatus = getSubscriptionStatus();
      setSubscription(subStatus);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handlePreferenceChange = async (key, value) => {
    const updatedPrefs = { ...preferences, [key]: value };
    setPreferences(updatedPrefs);
    
    try {
      await updateUserPreferences('user', updatedPrefs);
      setMessage({ type: 'success', text: 'Preferences updated successfully' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update preferences' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleExportData = (format) => {
    try {
      const data = dataExport.exportAll();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shipmenttrackr-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setMessage({ type: 'success', text: 'Data exported successfully' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to export data' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleImportData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const success = dataImport.importAll(e.target.result);
        if (success) {
          setMessage({ type: 'success', text: 'Data imported successfully. Please refresh the page.' });
        } else {
          setMessage({ type: 'error', text: 'Failed to import data. Please check the file format.' });
        }
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      } catch (error) {
        setMessage({ type: 'error', text: 'Invalid file format' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    };
    reader.readAsText(file);
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features.')) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await cancelSubscription();
      if (result.success) {
        setSubscription(getSubscriptionStatus());
        setMessage({ type: 'success', text: 'Subscription canceled successfully' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to cancel subscription' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to cancel subscription' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const tabs = [
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'account', label: 'Account', icon: Settings },
    { id: 'data', label: 'Data', icon: Download }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-surface rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-text">Settings</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors duration-150"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mx-6 mt-4 p-3 rounded-md ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-150 ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-text mb-4">Notification Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-text">Email Notifications</label>
                      <p className="text-sm text-gray-500">Receive email updates about your shipments</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.emailNotifications}
                      onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-text">Delay Alerts</label>
                      <p className="text-sm text-gray-500">Get notified when shipments are delayed</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.delayAlerts}
                      onChange={(e) => handlePreferenceChange('delayAlerts', e.target.checked)}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-text">Delivery Alerts</label>
                      <p className="text-sm text-gray-500">Get notified when packages are delivered</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.deliveryAlerts}
                      onChange={(e) => handlePreferenceChange('deliveryAlerts', e.target.checked)}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-text">Weekly Digest</label>
                      <p className="text-sm text-gray-500">Receive a weekly summary of your shipments</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.weeklyDigest}
                      onChange={(e) => handlePreferenceChange('weeklyDigest', e.target.checked)}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-text mb-4">Subscription</h3>
                {subscription && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-text">{subscription.plan}</span>
                      <span className={`text-sm ${subscription.color}`}>{subscription.text}</span>
                    </div>
                    {subscription.price > 0 && (
                      <div className="text-sm text-gray-600 mb-4">
                        ${subscription.price}/month
                        {subscription.nextBilling && (
                          <span className="ml-2">
                            • Next billing: {new Date(subscription.nextBilling).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}
                    {subscription.price > 0 && (
                      <button
                        onClick={handleCancelSubscription}
                        disabled={isLoading}
                        className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                      >
                        {isLoading ? 'Canceling...' : 'Cancel Subscription'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-text mb-4">Data Management</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-text">Export Data</h4>
                      <p className="text-sm text-gray-500">Download all your shipment data and settings</p>
                    </div>
                    <button
                      onClick={() => handleExportData('json')}
                      className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-md hover:opacity-90 transition-opacity duration-150"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export</span>
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-text">Import Data</h4>
                      <p className="text-sm text-gray-500">Restore data from a previous export</p>
                    </div>
                    <label className="flex items-center space-x-2 px-4 py-2 bg-surface border border-gray-300 text-text rounded-md hover:bg-gray-50 transition-colors duration-150 cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <span>Import</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportData}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
