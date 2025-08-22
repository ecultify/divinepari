'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { trackUserStep } from '../../../lib/supabase';
import { SessionManager } from '../../../lib/sessionManager';
import { useSessionTimeout } from '../../../hooks/useSessionTimeout';
import { SessionTimeoutModal } from '../../../components/SessionTimeoutModal';

function PosterSelectionPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const gender = searchParams.get('gender');
  const [selectedPoster, setSelectedPoster] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [imagesLoaded, setImagesLoaded] = useState<boolean>(false);

  // Session timeout management
  const {
    isExpired,
    extendSession,
    clearSession,
    updateActivity,
    formatTimeRemaining
  } = useSessionTimeout(sessionId);

  useEffect(() => {
    // If no gender specified, redirect back to gender selection
    if (!gender) {
      router.push('/generate/gender');
      return;
    }

    // Initialize session tracking
    const initSession = async () => {
      const currentSessionId = localStorage.getItem('sessionId') || '';
      
      if (currentSessionId) {
        // Validate session before proceeding
        const validation = await SessionManager.validateSession(currentSessionId);
        if (!validation.isValid) {
          // Session expired, redirect to start
          window.location.href = '/generate/';
          return;
        }
        
        setSessionId(currentSessionId);
        
        // Update session activity
        await SessionManager.updateActivity(currentSessionId);
        
        // Track that user reached poster selection
        await trackUserStep(currentSessionId, 'poster_selection', {
          page: 'poster_selection',
          gender: gender,
          timestamp: new Date().toISOString()
        });
      } else {
        // No session, redirect to start
        window.location.href = '/generate/';
      }
    };
    
    initSession();
  }, [gender, router]);

  const posters = gender === 'male' 
    ? ['Option1M.avif', 'Option2M.avif', 'Option3M.webp']
    : ['Option1F.avif', 'Option2F.avif', 'Option3F.avif'];

  // Add cache-busting parameter to handle incognito mode issues
  const getCacheBustingUrl = (poster: string) => {
    const timestamp = Date.now();
    return `/images/posters/${poster}?v=${timestamp}`;
  };

  // Preload images to ensure they're available in incognito mode
  useEffect(() => {
    if (gender && posters.length > 0) {
      const preloadImages = async () => {
        const imagePromises = posters.map((poster) => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = reject;
            img.src = `/images/posters/${poster}`;
          });
        });

        try {
          await Promise.all(imagePromises);
          setImagesLoaded(true);
        } catch (error) {
          console.error('Error preloading images:', error);
          setImagesLoaded(true); // Still show the interface even if preloading fails
        }
      };

      preloadImages();
    }
  }, [gender, posters]);

  const handlePosterSelect = async (poster: string) => {
    setSelectedPoster(poster);
    
    // Track poster selection
    if (sessionId) {
      await trackUserStep(sessionId, 'poster_selection', {
        selected_poster: poster,
        gender: gender,
        action: 'poster_selected',
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleContinue = async () => {
    if (selectedPoster && gender && sessionId) {
      // Track final poster submission
      await trackUserStep(sessionId, 'poster_selection', {
        selected_poster: selectedPoster,
        gender: gender,
        action: 'submit_poster',
        next_page: 'photo_upload',
        timestamp: new Date().toISOString()
      });
      
      // Store in localStorage for next page
      localStorage.setItem('selectedPoster', selectedPoster);
      
      // Navigate to upload page with both gender and poster data
      router.push(`/generate/upload?gender=${gender}&poster=${encodeURIComponent(selectedPoster)}`);
    }
  };

  return (
    <div className="w-full">
      {/* Session Timeout Modal */}
      <SessionTimeoutModal
        isOpen={isExpired}
        isExpired={isExpired}
        timeRemaining={0}
        onExtendSession={extendSession}
        onStartOver={clearSession}
        formatTimeRemaining={formatTimeRemaining}
      />

      {/* Poster Selection Page */}
      <section 
        className="relative w-full bg-no-repeat bg-top min-h-screen"
        style={{
          backgroundImage: `url('/images/secondpage/Desktop.avif')`,
          backgroundSize: '100% 100%',
        }}
      >
        {/* Mobile Background Override */}
        <div 
          className="absolute inset-0 block md:hidden bg-no-repeat bg-top"
          style={{
            backgroundImage: `url('/images/mobile/mobile.avif')`,
            backgroundSize: '100% 100%',
          }}
        />
        
        {/* Content Container */}
        <div className="relative z-10 w-full h-full flex flex-col px-4 md:px-6 py-6">
          {/* Logo - Centered on mobile, original position on desktop */}
          <div className="flex justify-center md:justify-start mb-8 w-full">
            <div className="md:ml-12">
              <button
                onClick={() => window.location.href = '/'}
                className="transition-all duration-200 hover:opacity-80"
              >
                <img 
                  src="/images/landing/normalimages/parimatch.svg" 
                  alt="Parimatch Logo" 
                  className="h-16 md:h-16"
                />
              </button>
            </div>
          </div>
          
          {/* Step Progress Indicator - Original size on desktop */}
          <div className="flex justify-center mb-4 md:mb-6">
            <div className="flex items-center">
              {[1, 2, 3, 4].map((step, index) => (
                <div key={step} className="flex items-center">
                  <div 
                    className="w-8 h-8 md:w-8 md:h-8 rounded-full border-2 flex items-center justify-center font-bold font-parimatch text-base md:text-lg"
                    style={{
                      borderColor: (step === 1 || step === 2) ? '#F8FF13' : 'white',
                      backgroundColor: (step === 1 || step === 2) ? '#F8FF13' : 'transparent',
                      color: (step === 1 || step === 2) ? 'black' : 'white',
                    }}
                  >
                    {step}
                  </div>
                  {index < 3 && (
                    <>
                      <div className="w-2 md:w-2"></div>
                      <div className="w-8 md:w-8 h-0.5 bg-white"></div>
                      <div className="w-2 md:w-2"></div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Form Container */}
          <div className="flex justify-center items-center flex-1 px-4 md:px-0">
            <div 
              className="w-full max-w-2xl px-6 md:px-12 py-8 rounded-lg relative mx-auto"
              style={{
                border: '2px solid transparent',
                backgroundImage: 'linear-gradient(#111112, #111112), linear-gradient(45deg, #8F9093, #C0C4C8, #BDBDBD, #959FA7, #666666)',
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box',
              }}
            >
              {/* Back Button */}
              <button
                onClick={() => window.location.href = '/generate/gender'}
                className="absolute top-4 left-4 transition-all duration-200 hover:opacity-75"
              >
                <img src="/images/icons/backbutton.png" alt="Back" className="w-8 h-8" />
              </button>

              <h2 className="text-white text-lg md:text-xl font-medium text-center mb-6 font-poppins">
                Select your scene
              </h2>
              
              {/* Poster Selection - Vertical on mobile, horizontal on desktop */}
              <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-6 mb-8">
                {posters.map((poster, index) => (
                  <button
                    key={poster}
                    onClick={() => handlePosterSelect(poster)}
                    className="relative transition-all duration-200 hover:scale-105"
                    style={{
                      border: selectedPoster === poster ? '3px solid #F8FF13' : '3px solid transparent',
                      borderRadius: '8px',
                      padding: '4px',
                    }}
                  >
                    <img
                      src={`/images/posters/${poster}`}
                      alt={`Poster ${index + 1}`}
                      className="w-32 h-48 md:w-40 md:h-60 object-cover rounded"
                      loading="eager"
                      decoding="sync"
                      onError={(e) => {
                        // Fallback handling for different image formats
                        const target = e.target as HTMLImageElement;
                        if (!target.src.includes('?retry=1')) {
                          target.src = `/images/posters/${poster}?retry=1`;
                        }
                      }}
                      style={{
                        imageRendering: 'auto',
                        objectFit: 'cover',
                      }}
                    />
                  </button>
                ))}
              </div>

              {/* Submit Button */}
              <div className="flex justify-center">
                {/* Desktop Button */}
                <button 
                  onClick={handleContinue}
                  disabled={!selectedPoster}
                  className="hidden md:flex items-center justify-center font-bold text-3xl uppercase tracking-wide transform -skew-x-12 transition-all duration-200 hover:scale-105 font-parimatch"
                  style={{
                    background: selectedPoster ? '#F8FF13' : '#585858',
                    color: 'black',
                    border: '3px solid transparent',
                    backgroundImage: selectedPoster 
                      ? 'linear-gradient(#F8FF13, #F8FF13), linear-gradient(45deg, #8F9093, #C0C4C8, #BDBDBD, #959FA7, #666666)'
                      : 'none',
                    backgroundOrigin: selectedPoster ? 'border-box' : 'initial',
                    backgroundClip: selectedPoster ? 'padding-box, border-box' : 'initial',
                    borderRadius: '3.29px',
                    width: '263px',
                    height: '63px',
                    cursor: selectedPoster ? 'pointer' : 'not-allowed',
                    opacity: selectedPoster ? 1 : 0.7,
                  }}
                >
                  <span className="block transform skew-x-12">CONTINUE</span>
                </button>
                
                {/* Mobile Button */}
                <button 
                  onClick={handleContinue}
                  disabled={!selectedPoster}
                  className="flex md:hidden items-center justify-center font-bold text-3xl uppercase tracking-wide transform -skew-x-12 transition-all duration-200 hover:scale-105 font-parimatch"
                  style={{
                    background: selectedPoster ? '#F8FF13' : '#585858',
                    color: 'black',
                    border: '3px solid transparent',
                    backgroundImage: selectedPoster 
                      ? 'linear-gradient(#F8FF13, #F8FF13), linear-gradient(45deg, #8F9093, #C0C4C8, #BDBDBD, #959FA7, #666666)'
                      : 'none',
                    backgroundOrigin: selectedPoster ? 'border-box' : 'initial',
                    backgroundClip: selectedPoster ? 'padding-box, border-box' : 'initial',
                    borderRadius: '3.29px',
                    padding: '16px 48px',
                    cursor: selectedPoster ? 'pointer' : 'not-allowed',
                    opacity: selectedPoster ? 1 : 0.7,
                  }}
                >
                  <span className="block transform skew-x-12">CONTINUE</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function PosterSelectionPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PosterSelectionPageContent />
    </Suspense>
  );
} 