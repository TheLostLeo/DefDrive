import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-blue-600 dark:text-blue-400">404</h1>
        </div>

        <div className="mb-8">
          <svg 
            className="w-48 h-48 mx-auto text-gray-400 dark:text-gray-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="1.5" 
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <div className="max-w-md">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Page Not Found
          </h2>
          
          <p className="mb-8 text-lg text-gray-600 dark:text-gray-400">
            The page you're looking for doesn't exist or has been moved.
            The file you're searching for might have been deleted or is no longer shared.
          </p>
          
          <Link 
            to="/" 
            className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-lg px-6 py-3 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 transition-colors duration-200"
          >
            Back to Home
          </Link>
        </div>
        
      </div>
    </div>
  );
};

export default NotFound;