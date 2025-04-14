import React, { useState } from 'react';
import { FiToggleLeft, FiToggleRight } from 'react-icons/fi';

// Define types for Access data
export interface Access {
  id: string;
  name: string;
  subnets: string[];
  ips: string[];
  expires: string;
  public: boolean;
  oneTimeUse: boolean;
  ttl: number;
  enableTTL: boolean;
  link: string;
  isActive: boolean;
}

interface AccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (access: Access) => void;
  initialData?: Access;
  isEdit: boolean;
}

// Helper function to validate IP address
const isValidIP = (ip: string): boolean => {
  const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  if (!ipv4Pattern.test(ip)) return false;
  
  const parts = ip.split('.').map(part => parseInt(part, 10));
  return parts.every(part => part >= 0 && part <= 255);
};

// Helper function to validate CIDR notation
const isValidCIDR = (cidr: string): boolean => {
  const parts = cidr.split('/');
  if (parts.length !== 2) return false;
  
  const ip = parts[0];
  const mask = parseInt(parts[1], 10);
  
  if (!isValidIP(ip)) return false;
  if (isNaN(mask) || mask < 0 || mask > 32) return false;
  
  return true;
};

const AccessModal: React.FC<AccessModalProps> = ({ isOpen, onClose, onSave, initialData, isEdit }) => {
  const [accessData, setAccessData] = useState<Access>({
    id: initialData?.id || `access-${Date.now()}`,
    name: initialData?.name || '',
    subnets: initialData?.subnets || [],
    ips: initialData?.ips || [],
    expires: initialData?.expires || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    public: initialData?.public || false,
    oneTimeUse: initialData?.oneTimeUse || false,
    ttl: initialData?.ttl || 5,
    enableTTL: initialData?.enableTTL || false,
    link: initialData?.link || `https://defdrive.com/share/${Date.now().toString(36)}`,
    isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
  });

  const [newSubnet, setNewSubnet] = useState('');
  const [newIP, setNewIP] = useState('');
  const [subnetError, setSubnetError] = useState('');
  const [ipError, setIPError] = useState('');
  const [nameError, setNameError] = useState('');
  
  // Format date for datetime-local input
  const formatDateForInput = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
    } catch (e) {
      return new Date().toISOString().slice(0, 16);
    }
  };

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    let isValid = true;
    
    if (!accessData.name.trim()) {
      setNameError('Access name is required');
      isValid = false;
    } else {
      setNameError('');
    }
    
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    onSave(accessData);
  };

  const addSubnet = () => {
    if (!newSubnet) {
      setSubnetError('');
      return;
    }
    
    if (!isValidCIDR(newSubnet)) {
      setSubnetError('Invalid subnet format. Use CIDR notation (e.g., 192.168.1.0/24)');
      return;
    }
    
    if (accessData.subnets.includes(newSubnet)) {
      setSubnetError('This subnet is already added');
      return;
    }
    
    setAccessData({
      ...accessData,
      subnets: [...accessData.subnets, newSubnet]
    });
    setNewSubnet('');
    setSubnetError('');
  };

  const removeSubnet = (subnet: string) => {
    setAccessData({
      ...accessData,
      subnets: accessData.subnets.filter(s => s !== subnet)
    });
  };

  const addIP = () => {
    if (!newIP) {
      setIPError('');
      return;
    }
    
    if (!isValidIP(newIP)) {
      setIPError('Invalid IP address format');
      return;
    }
    
    if (accessData.ips.includes(newIP)) {
      setIPError('This IP is already added');
      return;
    }
    
    setAccessData({
      ...accessData,
      ips: [...accessData.ips, newIP]
    });
    setNewIP('');
    setIPError('');
  };

  const removeIP = (ip: string) => {
    setAccessData({
      ...accessData,
      ips: accessData.ips.filter(i => i !== ip)
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isEdit ? 'Edit Access' : 'Create New Access'}
            </h2>
            <button 
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              &times;
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Name field */}
              <div>
                <label htmlFor="access-name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Access Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="access-name"
                  value={accessData.name}
                  onChange={(e) => setAccessData({...accessData, name: e.target.value})}
                  className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                  placeholder="E.g., Team Access, Client View"
                  required
                />
                {nameError && <p className="mt-1 text-sm text-red-600">{nameError}</p>}
              </div>

              {/* Subnets */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Allowed Subnets
                </label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={newSubnet}
                    onChange={(e) => setNewSubnet(e.target.value)}
                    placeholder="E.g., 192.168.1.0/24"
                    className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={addSubnet}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300"
                  >
                    Add
                  </button>
                </div>
                {subnetError && <p className="mt-1 text-sm text-red-600">{subnetError}</p>}
                <div className="flex flex-wrap gap-2 mt-2">
                  {accessData.subnets.map((subnet, index) => (
                    <div key={index} className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1">
                      <span className="text-sm text-gray-800 dark:text-gray-200">{subnet}</span>
                      <button
                        type="button"
                        onClick={() => removeSubnet(subnet)}
                        className="ml-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                  {accessData.subnets.length === 0 && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">No subnets added. Empty means all subnets allowed.</span>
                  )}
                </div>
              </div>

              {/* IPs */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Allowed IP Addresses
                </label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={newIP}
                    onChange={(e) => setNewIP(e.target.value)}
                    placeholder="E.g., 192.168.1.1"
                    className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={addIP}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300"
                  >
                    Add
                  </button>
                </div>
                {ipError && <p className="mt-1 text-sm text-red-600">{ipError}</p>}
                <div className="flex flex-wrap gap-2 mt-2">
                  {accessData.ips.map((ip, index) => (
                    <div key={index} className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1">
                      <span className="text-sm text-gray-800 dark:text-gray-200">{ip}</span>
                      <button
                        type="button"
                        onClick={() => removeIP(ip)}
                        className="ml-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                  {accessData.ips.length === 0 && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">No IPs added. Empty means all IPs allowed.</span>
                  )}
                </div>
              </div>

              {/* Expiration date */}
              <div>
                <label htmlFor="expires" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Expiration Date
                </label>
                <input
                  type="datetime-local"
                  id="expires"
                  value={formatDateForInput(accessData.expires)}
                  onChange={(e) => setAccessData({...accessData, expires: new Date(e.target.value).toISOString()})}
                  className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                />
              </div>

              {/* Public toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900 dark:text-white">Public Access</span>
                <button
                  type="button"
                  onClick={() => setAccessData({...accessData, public: !accessData.public})}
                  className={`p-2 rounded-lg transition-colors ${
                    accessData.public 
                      ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' 
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  {accessData.public ? <FiToggleRight size={24} /> : <FiToggleLeft size={24} />}
                </button>
              </div>

              {/* One Time Use toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900 dark:text-white">One-Time Use</span>
                <button
                  type="button"
                  onClick={() => setAccessData({...accessData, oneTimeUse: !accessData.oneTimeUse})}
                  className={`p-2 rounded-lg transition-colors ${
                    accessData.oneTimeUse 
                      ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' 
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  {accessData.oneTimeUse ? <FiToggleRight size={24} /> : <FiToggleLeft size={24} />}
                </button>
              </div>

              {/* TTL settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Enable Time-To-Live</span>
                  <button
                    type="button"
                    onClick={() => setAccessData({...accessData, enableTTL: !accessData.enableTTL})}
                    className={`p-2 rounded-lg transition-colors ${
                      accessData.enableTTL 
                        ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' 
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {accessData.enableTTL ? <FiToggleRight size={24} /> : <FiToggleLeft size={24} />}
                  </button>
                </div>

                {accessData.enableTTL && (
                  <div>
                    <label htmlFor="ttl" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      TTL (minutes)
                    </label>
                    <input
                      type="number"
                      id="ttl"
                      min="1"
                      value={accessData.ttl}
                      onChange={(e) => setAccessData({...accessData, ttl: parseInt(e.target.value) || 1})}
                      className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300"
                >
                  {isEdit ? 'Update Access' : 'Create Access'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AccessModal;