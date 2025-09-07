import React from 'react';
import { Search, Package, Crown, Settings, Bell } from 'lucide-react';

const NavHeader = ({ onSearch, searchTerm, onUpgrade, onSettings, alertCount = 0 }) => {
  return (
    <header className="bg-surface border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary rounded-md">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text">ShipmentTrackr</h1>
              <p className="text-sm text-gray-500 hidden sm:block">All shipments, one place</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search shipments..."
                value={searchTerm}
                onChange={(e) => onSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors duration-150"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {/* Alerts Button */}
            <button
              onClick={onSettings}
              className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors duration-150"
            >
              <Bell className="w-5 h-5" />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {alertCount > 9 ? '9+' : alertCount}
                </span>
              )}
            </button>

            {/* Settings Button */}
            <button
              onClick={onSettings}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors duration-150"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Upgrade Button */}
            <button
              onClick={onUpgrade}
              className="flex items-center space-x-2 bg-accent text-white px-4 py-2 rounded-md font-medium hover:opacity-90 transition-opacity duration-150"
            >
              <Crown className="w-4 h-4" />
              <span className="hidden sm:inline">Upgrade</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default NavHeader;
