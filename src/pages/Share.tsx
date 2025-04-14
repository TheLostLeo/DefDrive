import React, { useState, useEffect, useRef } from 'react';
import { FiUpload, FiTrash2, FiCopy, FiChevronDown, FiChevronUp, FiPlus, FiToggleLeft, FiToggleRight, FiEdit, FiClock, FiGlobe, FiShield, FiCalendar, FiSearch, FiAlertCircle, FiInfo, FiCheck } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import AccessModal, { Access } from '../Components/AccessModal';
import Navbar from '../Components/Navbar';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// Define API URL - replace with your actual backend URL
const API_URL = 'https://defdb.wlan0.in/api';
const LINK_PREFIX = 'https://defdb.wlan0.in/link/';

// Define types for our data structure based on the API response
interface ApiFile {
  ID: number;
  Name: string;
  Location: string;
  Size: number;
  Public: boolean;
  UserID: number;
}

interface ApiAccess {
  ID: number;
  Name: string;
  Link: string;
  Subnets: string[];
  IPs: string[];
  Expires: string;
  Public: boolean;
  FileID: number;
  OneTimeUse?: boolean;
  TTL?: number;
  EnableTTL?: boolean;
  IsActive?: boolean;
}

interface ApiAccessResponse {
  accesses: ApiAccess[];
}

interface ApiResponse {
  files: ApiFile[];
}

// Our internal file type with additional properties we need for UI
interface File {
  id: string;
  name: string;
  location: string;
  size: number;
  isPublic: boolean;
  userId: number;
  uploadDate: string; // For display purposes
  accesses: Access[];
  contentType?: string;
}

// Toast notification types
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const SharePage: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<File[]>([]);
  const [expandedFileId, setExpandedFileId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFetchingAccess, setIsFetchingAccess] = useState<boolean>(false);
  
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAccessModal, setShowAccessModal] = useState<boolean>(false);
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);
  const [editingAccess, setEditingAccess] = useState<Access | undefined>(undefined);
  
  // Check authentication and redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      addToast('Please login to access the Share Files page', 'info');
      navigate('/');
    }
  }, [isLoggedIn, navigate]);
  
  // Get auth token from session storage
  const getAuthToken = (): string | null => {
    return sessionStorage.getItem('authToken') || localStorage.getItem('authToken');
  };
  
  // Convert API access to our internal format
  const convertApiAccess = (apiAccess: ApiAccess): Access => {
    return {
      id: apiAccess.ID.toString(),
      name: apiAccess.Name,
      subnets: apiAccess.Subnets || [],
      ips: apiAccess.IPs || [],
      expires: apiAccess.Expires,
      public: apiAccess.Public,
      oneTimeUse: apiAccess.OneTimeUse || false,
      ttl: apiAccess.TTL || 5,
      enableTTL: apiAccess.EnableTTL || false,
      link: `${LINK_PREFIX}${apiAccess.Link}`, // Add the prefix to the link
      isActive: apiAccess.IsActive ?? true // Default to true if not provided
    };
  };
  
  // Convert API file format to our internal format
  const convertApiFile = (apiFile: ApiFile): File => {
    return {
      id: apiFile.ID.toString(),
      name: apiFile.Name,
      location: apiFile.Location,
      size: apiFile.Size,
      isPublic: apiFile.Public,
      userId: apiFile.UserID,
      uploadDate: new Date().toISOString(), // Set a default upload date
      accesses: [] // Initialize with empty accesses
    };
  };
  
  // Fetch files from API
  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const token = getAuthToken();
      
      // Make an API request with the token
      const response = await axios.get<ApiResponse>(`${API_URL}/files`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        }
      });
      
      // Convert API files to our internal format
      const convertedFiles = response.data.files.map(convertApiFile);
      setFiles(convertedFiles);
      setFilteredFiles(convertedFiles);
      
      
      addToast('Files loaded successfully', 'success');
    } catch (error) {
      console.error('Error fetching files:', error);
      addToast('Failed to load files. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initial load of files
  useEffect(() => {
    if (isLoggedIn) {
      fetchFiles();
    }
  }, [isLoggedIn]);
  
  // Fetch accesses for a specific file
  const fetchAccessesForFile = async (fileId: string) => {
    try {
      // Get auth token
      const token = getAuthToken();
      
      // Make API request to get accesses for this file
      const response = await axios.get<ApiAccessResponse>(
        `${API_URL}/files/${fileId}/accesses`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : ''
          }
        }
      );
      
      // Convert API accesses to our internal format
      const convertedAccesses = response.data.accesses.map(convertApiAccess);
      
      // Update the file with its accesses
      setFiles(prevFiles => 
        prevFiles.map(file => 
          file.id === fileId
            ? { ...file, accesses: convertedAccesses }
            : file
        )
      );
    } catch (error) {
      console.error(`Error fetching accesses for file ${fileId}:`, error);
      addToast('Failed to load access controls. Please try again.', 'error');
    }
  };
  
  // Fetch access details by access ID
  const fetchAccessDetails = async (accessId: string): Promise<Access | null> => {
    setIsFetchingAccess(true);
    try {
      // Get auth token
      const token = getAuthToken();
      
      // Make API request to get access details
      const response = await axios.get<ApiAccess>(
        `${API_URL}/accesses/${accessId}`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : ''
          }
        }
      );
      
      // Convert API access to our internal format
      const convertedAccess = convertApiAccess(response.data);
      return convertedAccess;
    } catch (error) {
      console.error(`Error fetching access details for ${accessId}:`, error);
      return null;
    } finally {
      setIsFetchingAccess(false);
    }
  };
  
  // When a file row is expanded, fetch its accesses
  useEffect(() => {
    if (expandedFileId) {
      fetchAccessesForFile(expandedFileId);
    }
  }, [expandedFileId]);
  
  // Filter files based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFiles(files);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = files.filter(file => 
        file.name.toLowerCase().includes(query)
      );
      setFilteredFiles(filtered);
    }
  }, [searchQuery, files]);

  // Add toast message
  const addToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setIsUploading(true);
      setUploadProgress(0);
      setUploadError(null);
      
      try {
        // Create FormData to send file
        const formData = new FormData();
        formData.append('file', file);
        
        // Get auth token
        const token = getAuthToken();
        
        // Make API call to upload the file with token
        await axios.post(`${API_URL}/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          onUploadProgress: (progressEvent) => {
            // Calculate and update progress
            const progress = progressEvent.total
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0;
            setUploadProgress(progress);
          }
        });
        
        
        // Add success toast message
        addToast(`File "${file.name}" uploaded successfully`, 'success');
        
      } catch (error) {
        console.error('Error uploading file:', error);
        
      } finally {
        // Always refresh the file list after upload attempt
        fetchFiles();
        
        setIsUploading(false);
        setUploadProgress(0);
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };
  
  // Toggle file access using PUT /api/files/:fileID/access as specified
  const toggleFileAccess = async (fileId: string) => {
    try {
      const fileToUpdate = files.find(file => file.id === fileId);
      if (!fileToUpdate) return;
      
      const newStatus = !fileToUpdate.isPublic;
      
      // Get auth token
      const token = getAuthToken();
      
      // Make API request using PUT method and the specified endpoint format
      await axios.put(`${API_URL}/files/${fileId}/access`, 
        { public: newStatus }, 
        { 
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          }
        }
      );
      
      // Update local state
      setFiles(prevFiles => 
        prevFiles.map(file => 
          file.id === fileId 
            ? { ...file, isPublic: newStatus } 
            : file
        )
      );
      
      addToast(
        `File is now ${newStatus ? 'public' : 'private'}`, 
        'success'
      );
    } catch (error) {
      console.error('Error updating file access:', error);
      addToast('Failed to update file access. Please try again.', 'error');
    }
  };
  
  const deleteFile = async (fileId: string) => {
    try {
      // Get auth token
      const token = getAuthToken();
      
      // Make an API request
      await axios.delete(`${API_URL}/files/${fileId}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      // Update local state
      setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
      
      if (expandedFileId === fileId) {
        setExpandedFileId(null);
      }
      
      addToast('File deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting file:', error);
      addToast('Failed to delete file. Please try again.', 'error');
    }
  };
  
  const toggleAccessRow = (fileId: string) => {
    setExpandedFileId(expandedFileId === fileId ? null : fileId);
  };
  
  const openAddAccessModal = (fileId: string) => {
    setCurrentFileId(fileId);
    setEditingAccess(undefined);
    setShowAccessModal(true);
  };
  
  // Open edit modal with the latest access information
  const openEditAccessModal = async (fileId: string, access: Access) => {
    setCurrentFileId(fileId);
    
    try {
      // Fetch the latest access details directly from the API
      const latestAccessDetails = await fetchAccessDetails(access.id);
      
      if (latestAccessDetails) {
        setEditingAccess(latestAccessDetails);
      } else {
        // If fetch fails, use the local data
        setEditingAccess(access);
      }
    } catch (error) {
      // Fall back to using local data
      setEditingAccess(access);
    }
    
    setShowAccessModal(true);
  };
  
  // Updated to use the correct endpoint and request format for updating access
  const handleSaveAccess = async (accessData: Access) => {
    try {
      // Get auth token
      const token = getAuthToken();
      
      if (editingAccess) {
        // Update existing access using the new /api/accesses/:accessID/access endpoint
        // Extract link without prefix for API call
        // Removed unused variable 'linkWithoutPrefix'
          
        // Make an API request using PUT to the correct endpoint
        await axios.put(
          `${API_URL}/accesses/${accessData.id}/access`,
          {
            name: accessData.name,
            subnets: accessData.subnets,
            ips: accessData.ips,
            expires: accessData.expires,
            public: accessData.public,
            oneTimeUse: accessData.oneTimeUse,
            ttl: accessData.ttl,
            enableTTL: accessData.enableTTL
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token ? `Bearer ${token}` : ''
            }
          }
        );
        
        // If we have a current file ID, refresh its accesses
        if (currentFileId) {
          await fetchAccessesForFile(currentFileId);
        }
        
        addToast('Access updated successfully', 'success');
      } else {
        // Add new access - using the exact format and endpoint specified
        if (!currentFileId) {
          addToast('Error: File ID not found', 'error');
          return;
        }
        
        await axios.post(
          `${API_URL}/files/${currentFileId}/accesses`,
          {
            name: accessData.name,
            subnets: accessData.subnets,
            ips: accessData.ips,
            expires: accessData.expires,
            public: accessData.public,
            oneTimeUse: accessData.oneTimeUse,
            ttl: accessData.ttl,
            enableTTL: accessData.enableTTL
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token ? `Bearer ${token}` : ''
            }
          }
        );
        
        // Refresh accesses for this file
        await fetchAccessesForFile(currentFileId);
        
        addToast('Access added successfully', 'success');
      }
    } catch (error) {
      console.error('Error saving access:', error);
      addToast('Failed to save access. Please try again.', 'error');
    } finally {
      setShowAccessModal(false);
      setEditingAccess(undefined);
      setCurrentFileId(null);
    }
  };
  
  const toggleAccessActive = async (fileId: string, accessId: string) => {
    try {
      const file = files.find(f => f.id === fileId);
      if (!file) return;
      
      const access = file.accesses.find(a => a.id === accessId);
      if (!access) return;
      
      const newPublicState = !access.public;
      
      // Get auth token
      const token = getAuthToken();
      
      // Make an API request with complete access object format
      await axios.put(
        `${API_URL}/accesses/${accessId}/access`,
        {
          name: access.name,
          subnets: access.subnets || [],
          ips: access.ips || [],
          expires: access.expires || "2026-12-31T23:59:59Z",
          public: newPublicState,
          oneTimeUse: access.oneTimeUse || false,
          ttl: access.ttl || 10,
          enableTTL: access.enableTTL || false
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          }
        }
      );
      
      // Update local state
      setFiles(prevFiles => 
        prevFiles.map(file => 
          file.id === fileId
            ? {
                ...file,
                accesses: file.accesses.map(access => 
                  access.id === accessId
                    ? { ...access, public: newPublicState }
                    : access
                )
              }
            : file
        )
      );
      
      addToast(`Access is now ${newPublicState ? 'public' : 'private'}`, 'success');
    } catch (error) {
      console.error('Error toggling access status:', error);
      addToast('Failed to update access status. Please try again.', 'error');
    }
  };
  
  const deleteAccess = async (fileId: string, accessId: string) => {
    try {
      // Get auth token
      const token = getAuthToken();
      
      // Make an API request
      await axios.delete(
        `${API_URL}/accesses/${accessId}`,
        {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        }
      );
      
      // Update local state
      setFiles(prevFiles => 
        prevFiles.map(file => 
          file.id === fileId
            ? {
                ...file,
                accesses: file.accesses.filter(access => access.id !== accessId)
              }
            : file
        )
      );
      
      addToast('Access deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting access:', error);
      addToast('Failed to delete access. Please try again.', 'error');
    }
  };
  
  const copyAccessLink = (link: string) => {
    navigator.clipboard.writeText(link).then(() => {
      addToast('Link copied to clipboard!', 'success');
    });
  };
  
  // Format file size for display
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format expiration date
  const formatExpirationDate = (isoDate: string) => {
    try {
      const date = new Date(isoDate);
      return date.toLocaleString();
    } catch (e) {
      return isoDate;
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Include the navbar at the top of the page */}
      <Navbar />
      
      <div className="flex-grow p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Shared Files
          </h1>
          
          <div className="mb-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 items-start">
            {/* Upload button and progress */}
            <div className="w-full sm:w-auto">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              
              <button
                onClick={handleFileUpload}
                disabled={isUploading}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 w-full sm:w-auto"
              >
                <FiUpload className="mr-2" />
                {isUploading ? 'Uploading...' : 'Upload File'}
              </button>
              
              {/* Upload progress bar */}
              {isUploading && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {uploadProgress}% complete
                  </p>
                </div>
              )}
              
              {/* Upload error message */}
              {uploadError && (
                <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {uploadError}
                </div>
              )}
            </div>
            
            {/* Search bar */}
            <div className="flex-1 w-full">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <FiSearch className="text-gray-500 dark:text-gray-400" />
                </div>
                <input 
                  type="search" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search files..." 
                  className="block w-full p-3 pl-10 text-sm bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                  >
                    <span className="text-gray-500 dark:text-gray-400">&times;</span>
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Toast notifications */}
          <div className="fixed bottom-4 right-4 z-50 space-y-2">
            {toasts.map(toast => (
              <div 
                key={toast.id} 
                className={`px-4 py-2 rounded-lg shadow-lg flex items-center ${
                  toast.type === 'success' ? 'bg-green-500 text-white' : 
                  toast.type === 'error' ? 'bg-red-500 text-white' : 
                  'bg-blue-500 text-white'
                }`}
              >
                {toast.type === 'success' && <FiCheck className="mr-2" />}
                {toast.type === 'error' && <FiAlertCircle className="mr-2" />}
                {toast.type === 'info' && <FiInfo className="mr-2" />}
                <span>{toast.message}</span>
                <button 
                  onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                  className="ml-4 text-white hover:text-gray-200"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
          
          {/* Files table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            {/* Table header */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 grid grid-cols-12 gap-2 sm:gap-4 font-medium text-gray-600 dark:text-gray-300">
              <div className="col-span-7 md:col-span-6 pl-1">File Name</div>
              <div className="hidden sm:block col-span-3">Size</div>
              <div className="col-span-5 sm:col-span-3 text-right sm:text-left">Actions</div>
            </div>
            
            {/* Loading state */}
            {isLoading ? (
              <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                <div className="flex justify-center items-center">
                  <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                  Loading files...
                </div>
              </div>
            ) : (
              /* Table body */
              filteredFiles.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  {searchQuery ? 'No files match your search.' : 'No files uploaded yet. Click the Upload button to add files.'}
                </div>
              ) : (
                filteredFiles.map(file => (
                  <div key={file.id} className="border-b border-gray-200 dark:border-gray-700 last:border-0">
                    {/* Main file row */}
                    <div className="px-4 sm:px-6 py-3 sm:py-4 grid grid-cols-12 gap-2 sm:gap-4 items-center">
                      <div className="col-span-7 md:col-span-6 font-medium text-gray-800 dark:text-gray-200 truncate pl-1">
                        {file.name}
                      </div>
                      <div className="hidden sm:block col-span-3 text-gray-600 dark:text-gray-400">
                        {formatFileSize(file.size)}
                      </div>
                      <div className="col-span-5 sm:col-span-3 flex items-center justify-end sm:justify-start space-x-1 sm:space-x-2">
                        {/* Toggle access button */}
                        <button
                          type="button"
                          onClick={() => toggleFileAccess(file.id)}
                          className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                            file.isPublic 
                              ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' 
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                          }`}
                          aria-label={file.isPublic ? 'Make private' : 'Make public'}
                          title={file.isPublic ? 'Public - Click to make private' : 'Private - Click to make public'}
                        >
                          {file.isPublic ? <FiToggleRight size={18} className="sm:w-5 sm:h-5" /> : <FiToggleLeft size={18} className="sm:w-5 sm:h-5" />}
                        </button>
                        
                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => deleteFile(file.id)}
                          className="p-1.5 sm:p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900 dark:text-red-400 dark:hover:bg-red-800 transition-colors"
                          aria-label="Delete file"
                          title="Delete file"
                        >
                          <FiTrash2 size={18} className="sm:w-5 sm:h-5" />
                        </button>
                        
                        {/* Expand/collapse button */}
                        <button
                          type="button"
                          onClick={() => toggleAccessRow(file.id)}
                          className="p-1.5 sm:p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-400 dark:hover:bg-blue-800 transition-colors"
                          aria-label={expandedFileId === file.id ? 'Hide access options' : 'Show access options'}
                          title="Access options"
                        >
                          {expandedFileId === file.id ? <FiChevronUp size={18} className="sm:w-5 sm:h-5" /> : <FiChevronDown size={18} className="sm:w-5 sm:h-5" />}
                        </button>
                      </div>
                    </div>
                    
                    {/* Access sub-table */}
                    {expandedFileId === file.id && (
                      <div className="bg-gray-50 dark:bg-gray-800 px-3 sm:px-6 py-3 sm:py-4 mx-2 sm:ml-8 sm:mr-4 mb-3 sm:mb-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 space-y-2 sm:space-y-0">
                          <h3 className="text-base sm:text-lg font-medium text-gray-800 dark:text-gray-200">
                            Access Controls
                          </h3>
                          <button
                            type="button"
                            onClick={() => openAddAccessModal(file.id)}
                            className="flex items-center px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm w-full sm:w-auto justify-center sm:justify-start"
                          >
                            <FiPlus className="mr-1" /> Add Access
                          </button>
                        </div>
                        
                        {file.accesses.length === 0 ? (
                          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                            No access links created yet. Click "Add Access" to create one.
                          </div>
                        ) : (
                          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                            {/* Access table header - visible only on tablet and larger */}
                            <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300">
                              <div className="col-span-4">Name</div>
                              <div className="col-span-5">Configuration</div>
                              <div className="col-span-3">Actions</div>
                            </div>
                            
                            {/* Access table rows */}
                            {file.accesses.map(access => (
                              <div 
                                key={access.id} 
                                className="sm:grid grid-cols-12 gap-4 px-3 sm:px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-sm flex flex-col sm:items-center"
                              >
                                <div className="col-span-4 font-medium text-gray-800 dark:text-gray-200 mb-2 sm:mb-0">
                                  {access.name}
                                </div>
                                <div className="col-span-5 text-gray-600 dark:text-gray-400 mb-3 sm:mb-0">
                                  <div className="space-y-1">
                                    <div className="flex items-center">
                                      <FiGlobe className="mr-1 flex-shrink-0" />
                                      <span>{access.public ? 'Public' : 'Private'}</span>
                                    </div>
                                    {access.oneTimeUse && (
                                      <div className="flex items-center">
                                        <FiShield className="mr-1 flex-shrink-0" />
                                        <span>One-Time Use</span>
                                      </div>
                                    )}
                                    {access.enableTTL && (
                                      <div className="flex items-center">
                                        <FiClock className="mr-1 flex-shrink-0" />
                                        <span>TTL: {access.ttl} min</span>
                                      </div>
                                    )}
                                    <div className="flex items-center">
                                      <FiCalendar className="mr-1 flex-shrink-0" />
                                      <span className="truncate" title={formatExpirationDate(access.expires)}>
                                        Expires: {formatExpirationDate(access.expires)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="col-span-3 flex items-center space-x-2 justify-start sm:justify-start">
                                  {/* Toggle access button */}
                                  <button
                                    type="button"
                                    onClick={() => toggleAccessActive(file.id, access.id)}
                                    className={`p-1.5 rounded transition-colors ${
                                      access.public 
                                        ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' 
                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                    }`}
                                    aria-label={access.public ? 'Make private' : 'Make public'}
                                    title={access.public ? 'Public - Click to make private' : 'Private - Click to make public'}
                                  >
                                    {access.public ? <FiToggleRight size={18} /> : <FiToggleLeft size={18} />}
                                  </button>
                                  
                                  {/* Copy link button */}
                                  <button
                                    type="button"
                                    onClick={() => copyAccessLink(access.link)}
                                    className="p-1.5 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-400 dark:hover:bg-blue-800 transition-colors"
                                    aria-label="Copy link"
                                    title="Copy link"
                                  >
                                    <FiCopy size={18} />
                                  </button>
                                  
                                  {/* Edit access button */}
                                  <button
                                    type="button"
                                    onClick={() => openEditAccessModal(file.id, access)}
                                    disabled={isFetchingAccess}
                                    className="p-1.5 rounded bg-yellow-100 text-yellow-600 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-400 dark:hover:bg-yellow-800 transition-colors disabled:opacity-50"
                                    aria-label="Edit access"
                                    title="Edit access"
                                  >
                                    {isFetchingAccess ? (
                                      <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                      <FiEdit size={18} />
                                    )}
                                  </button>
                                  
                                  {/* Delete access button */}
                                  <button
                                    type="button"
                                    onClick={() => deleteAccess(file.id, access.id)}
                                    className="p-1.5 rounded bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900 dark:text-red-400 dark:hover:bg-red-800 transition-colors"
                                    aria-label="Delete access"
                                    title="Delete access"
                                  >
                                    <FiTrash2 size={18} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )
            )}
          </div>
          
          {/* Refresh button */}
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={fetchFiles}
              className="px-4 py-2 flex items-center text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Files
            </button>
          </div>
        </div>
      </div>
      
      {/* Access modal */}
      {showAccessModal && (
        <AccessModal
          isOpen={showAccessModal}
          onClose={() => {
            setShowAccessModal(false);
            setEditingAccess(undefined);
            setCurrentFileId(null);
          }}
          onSave={handleSaveAccess}
          initialData={editingAccess}
          isEdit={!!editingAccess}
        />
      )}
    </div>
  );
};

export default SharePage;