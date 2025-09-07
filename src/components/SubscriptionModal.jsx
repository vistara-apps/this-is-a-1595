import React from 'react';
import { X, Check, Crown, Package, Bell, Archive } from 'lucide-react';

const SubscriptionModal = ({ onClose, currentShipments }) => {
  const plans = [
    {
      name: 'Basic',
      price: '$5',
      period: '/month',
      description: 'Perfect for personal use',
      features: [
        'Track up to 10 shipments',
        'Basic tracking updates',
        'Email notifications',
        'Shipment history'
      ],
      current: currentShipments <= 3,
      popular: false
    },
    {
      name: 'Premium',
      price: '$10',
      period: '/month',
      description: 'Best for small businesses',
      features: [
        'Unlimited shipments',
        'Real-time tracking updates',
        'Proactive delay alerts',
        'Advanced filtering & search',
        'Export shipment data',
        'Priority support'
      ],
      current: false,
      popular: true
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-surface rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Crown className="w-6 h-6 text-accent" />
              <div>
                <h2 className="text-2xl font-bold text-text">Upgrade Your Plan</h2>
                <p className="text-gray-600">
                  You've reached the limit of {currentShipments} shipments on the free plan
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors duration-150"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative border-2 rounded-lg p-6 ${
                  plan.popular
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-text mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center">
                    <span className="text-3xl font-bold text-text">{plan.price}</span>
                    <span className="text-gray-500 ml-1">{plan.period}</span>
                  </div>
                  <p className="text-gray-600 mt-2">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-3">
                      <Check className="w-4 h-4 text-accent flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 px-4 rounded-md font-medium transition-colors duration-150 ${
                    plan.current
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : plan.popular
                      ? 'bg-primary text-white hover:opacity-90'
                      : 'bg-surface border border-gray-200 text-text hover:bg-gray-50'
                  }`}
                  disabled={plan.current}
                >
                  {plan.current ? 'Current Plan' : `Choose ${plan.name}`}
                </button>
              </div>
            ))}
          </div>

          {/* Features Comparison */}
          <div className="mt-8 border-t pt-8">
            <h3 className="text-lg font-semibold text-text mb-4">What you get with Premium:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start space-x-3">
                <Package className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h4 className="font-medium text-text">Unlimited Tracking</h4>
                  <p className="text-sm text-gray-600">Track as many shipments as you need</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Bell className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h4 className="font-medium text-text">Smart Alerts</h4>
                  <p className="text-sm text-gray-600">Get notified before problems occur</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Archive className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h4 className="font-medium text-text">Advanced Features</h4>
                  <p className="text-sm text-gray-600">Export data, filters, and priority support</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Cancel anytime • 30-day money-back guarantee</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;