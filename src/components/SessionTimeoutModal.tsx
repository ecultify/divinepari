import React from 'react';

interface SessionTimeoutModalProps {
  isOpen: boolean;
  isExpired: boolean;
  timeRemaining: number;
  onExtendSession: () => Promise<void>;
  onStartOver: () => Promise<void>;
  formatTimeRemaining: () => string;
}

export const SessionTimeoutModal: React.FC<SessionTimeoutModalProps> = ({
  isOpen,
  isExpired,
  timeRemaining,
  onExtendSession,
  onStartOver,
  formatTimeRemaining
}) => {
  if (!isOpen) return null;

  const handleExtendSession = async () => {
    await onExtendSession();
  };

  const handleStartOver = async () => {
    await onStartOver();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"></div>
      
      <div className="relative bg-white rounded-lg shadow-xl max-w-md mx-4 p-6 z-10">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full">
          {isExpired ? (
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {isExpired ? 'Session Expired' : 'Session Timeout Warning'}
          </h3>
          
          {isExpired ? (
            <div>
              <p className="text-gray-600 mb-4">
                Your session has expired for security reasons. Please start over to continue using the application.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                You will be redirected to the homepage in a few seconds...
              </p>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-2">
                Your session will expire soon due to inactivity.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-yellow-800 font-medium">
                  Time remaining: {formatTimeRemaining()}
                </p>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Would you like to extend your session or start over?
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {!isExpired && (
              <button
                onClick={handleExtendSession}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Extend Session
              </button>
            )}
            
            <button
              onClick={handleStartOver}
              className={`px-6 py-2 rounded-lg transition-colors font-medium ${
                isExpired 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Start Over
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-4">
            Sessions expire after 5 minutes of inactivity for security.
          </p>
        </div>
      </div>
    </div>
  );
};