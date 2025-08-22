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
      
      <div className="relative bg-black rounded-lg shadow-xl max-w-md mx-4 p-6 z-10 border-2 border-yellow-400">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-yellow-400 bg-opacity-20 rounded-full border-2 border-yellow-400">
          {isExpired ? (
            <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        <div className="text-center">
          <h3 className="text-lg font-semibold text-yellow-400 mb-2 font-parimatch uppercase tracking-wide">
            {isExpired ? 'Session Expired' : 'Session Timeout Warning'}
          </h3>
          
          {isExpired ? (
            <div>
              <p className="text-yellow-400 mb-4 font-medium">
                Your session has expired for security reasons. Please start over to continue using the application.
              </p>
              <p className="text-sm text-yellow-300 mb-6">
                You will be redirected to the homepage in a few seconds...
              </p>
            </div>
          ) : (
            <div>
              <p className="text-yellow-400 mb-2 font-medium">
                Your session will expire soon due to inactivity.
              </p>
              <div className="bg-yellow-400 bg-opacity-20 border border-yellow-400 border-opacity-50 rounded-lg p-3 mb-4">
                <p className="text-yellow-400 font-bold">
                  Time remaining: {formatTimeRemaining()}
                </p>
              </div>
              <p className="text-sm text-yellow-300 mb-6">
                Would you like to extend your session or start over?
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {!isExpired && (
              <button
                onClick={handleExtendSession}
                className="relative px-6 py-3 font-normal text-black text-lg uppercase tracking-wide transform -skew-x-12 transition-all duration-200 hover:scale-105 flex items-center justify-center font-parimatch"
                style={{
                  background: '#F8FF13',
                  border: '3px solid transparent',
                  backgroundImage: 'linear-gradient(#F8FF13, #F8FF13), linear-gradient(45deg, #8F9093, #C0C4C8, #BDBDBD, #959FA7, #666666)',
                  backgroundOrigin: 'border-box',
                  backgroundClip: 'padding-box, border-box',
                  borderRadius: '3.29px'
                }}
              >
                <span className="transform skew-x-12">Continue Session</span>
              </button>
            )}
            
            <button
              onClick={handleStartOver}
              className="relative px-6 py-3 font-normal text-black text-lg uppercase tracking-wide transform -skew-x-12 transition-all duration-200 hover:scale-105 flex items-center justify-center font-parimatch"
              style={{
                background: '#F8FF13',
                border: '3px solid transparent',
                backgroundImage: 'linear-gradient(#F8FF13, #F8FF13), linear-gradient(45deg, #8F9093, #C0C4C8, #BDBDBD, #959FA7, #666666)',
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box',
                borderRadius: '3.29px'
              }}
            >
              <span className="transform skew-x-12">Start Over</span>
            </button>
          </div>

          <p className="text-xs text-yellow-300 mt-4 font-parimatch">
            Sessions expire after 5 minutes of inactivity for security.
          </p>
        </div>
      </div>
    </div>
  );
};