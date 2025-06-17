'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function ResultPageContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const gender = searchParams.get('gender');
  const selectedPoster = searchParams.get('poster');

  useEffect(() => {
    // Get user image from localStorage
    const storedUserImage = localStorage.getItem('userImage');
    const storedPoster = localStorage.getItem('selectedPoster');
    const storedGender = localStorage.getItem('selectedGender');

    if (!storedUserImage || !storedPoster || !storedGender) {
      router.push('/generate/gender');
      return;
    }

    setUserImage(storedUserImage);
    processFaceSwap(storedUserImage, storedPoster, storedGender);
  }, [router]);

  const processFaceSwap = async (userImage: string, posterName: string, gender: string) => {
    try {
      setLoading(true);
      setError(null);
      setProgress(10);

      console.log('Starting face swap process:', { posterName, gender });

      // Convert base64 to blob
      const response = await fetch(userImage);
      const blob = await response.blob();
      
      console.log('User image blob size:', blob.size);
      setProgress(30);

      // Create FormData
      const formData = new FormData();
      formData.append('userImage', blob, 'user-photo.jpg');
      formData.append('posterName', posterName);
      formData.append('gender', gender);

      setProgress(50);

      console.log('Calling face swap API...');

      // Call our faceswap API
      const faceSwapResponse = await fetch('/api/process-faceswap', {
        method: 'POST',
        body: formData,
      });

      setProgress(70);

      console.log('Face swap API response status:', faceSwapResponse.status);

      if (!faceSwapResponse.ok) {
        const errorData = await faceSwapResponse.json();
        console.error('Face swap API error:', errorData);
        throw new Error(errorData.error || `HTTP ${faceSwapResponse.status}: Face swap processing failed`);
      }

      const result = await faceSwapResponse.json();
      
      console.log('Face swap result:', { success: result.success, hasImage: !!result.imageUrl });
      setProgress(90);

      if (result.success && result.imageUrl) {
        setProcessedImage(result.imageUrl);
        setProgress(100);
        console.log('Face swap completed successfully');
      } else {
        throw new Error(result.error || 'Processing failed - no image returned');
      }
    } catch (error) {
      console.error('Face swap error:', error);
      let errorMessage = 'An error occurred during processing';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Provide more specific error messages
      if (errorMessage.includes('API configuration error')) {
        errorMessage = 'Service temporarily unavailable. Please try again later.';
      } else if (errorMessage.includes('timed out')) {
        errorMessage = 'Processing is taking longer than expected. Please try again.';
      } else if (errorMessage.includes('Face swap service unavailable')) {
        errorMessage = 'AI service is currently unavailable. Please try again in a few minutes.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (processedImage) {
      const link = document.createElement('a');
      link.href = processedImage;
      link.download = `faceswap-result-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleTryAgain = () => {
    // Clear localStorage and start over
    localStorage.removeItem('userImage');
    localStorage.removeItem('selectedPoster');
    localStorage.removeItem('selectedGender');
    router.push('/generate/gender');
  };

  if (loading) {
    return (
      <div className="w-full">
        <section 
          className="relative w-full bg-no-repeat bg-center min-h-screen"
          style={{
            backgroundImage: `url('/images/secondpage/Desktop.png')`,
            backgroundSize: 'cover',
          }}
        >
          {/* Mobile Background Override */}
          <div 
            className="absolute inset-0 block md:hidden bg-no-repeat bg-center"
            style={{
              backgroundImage: `url('/images/mobile/mobile.png')`,
              backgroundSize: 'cover',
            }}
          />
          
          <div className="relative z-10 w-full h-full flex flex-col px-4 md:px-6 py-6">
            {/* Logo - Left on desktop, centered on mobile */}
            <div className="flex justify-start md:justify-start justify-center mb-8" style={{ marginLeft: '0px md:50px' }}>
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
            
            {/* Step Progress Indicator - Larger and closer to content */}
            <div className="flex justify-center mb-4">
              <div className="flex items-center">
                {[1, 2, 3, 4].map((step, index) => (
                  <div key={step} className="flex items-center">
                    <div 
                      className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 flex items-center justify-center font-bold font-poppins text-sm md:text-base"
                      style={{
                        borderColor: '#F8FF13',
                        backgroundColor: '#F8FF13',
                        color: 'black',
                      }}
                    >
                      {step}
                    </div>
                    {index < 3 && (
                      <>
                        <div className="w-2 md:w-4"></div>
                        <div className="w-8 md:w-16 h-0.5 bg-white"></div>
                        <div className="w-2 md:w-4"></div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Loading Modal */}
            <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
              <div 
                className="relative px-8 py-12 md:px-16 md:py-8 rounded-lg"
                style={{
                  border: '2px solid #F8FF13',
                  backgroundColor: 'rgba(17, 17, 18, 0.95)',
                  minWidth: '320px',
                  maxWidth: '500px',
                  minHeight: '200px',
                }}
              >
                {/* Close button */}
                <button
                  className="absolute top-2 right-3 text-white hover:text-gray-300 text-xl font-bold"
                  style={{ fontSize: '24px', lineHeight: '1' }}
                >
                  ×
                </button>

                {/* Loading content */}
                <div className="text-center">
                  <p className="text-white text-lg font-poppins mb-6">
                    Crafting your debut with your favorite artist...
                  </p>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-600 rounded-full h-3">
                    <div 
                      className="h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: '#F8FF13',
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <section 
          className="relative w-full bg-no-repeat bg-center min-h-screen"
          style={{
            backgroundImage: `url('/images/secondpage/Desktop.png')`,
            backgroundSize: 'cover',
          }}
        >
          {/* Mobile Background Override */}
          <div 
            className="absolute inset-0 block md:hidden bg-no-repeat bg-center"
            style={{
              backgroundImage: `url('/images/mobile/mobile.png')`,
              backgroundSize: 'cover',
            }}
          />
          
          <div className="relative z-10 w-full h-full flex flex-col px-4 md:px-6 py-6">
            {/* Logo - Left on desktop, centered on mobile */}
            <div className="flex justify-start md:justify-start justify-center mb-8" style={{ marginLeft: '0px md:50px' }}>
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
            
            {/* Step Progress Indicator - Larger and closer to content */}
            <div className="flex justify-center mb-4">
              <div className="flex items-center">
                {[1, 2, 3, 4].map((step, index) => (
                  <div key={step} className="flex items-center">
                    <div 
                      className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 flex items-center justify-center font-bold font-poppins text-sm md:text-base"
                      style={{
                        borderColor: '#F8FF13',
                        backgroundColor: '#F8FF13',
                        color: 'black',
                      }}
                    >
                      {step}
                    </div>
                    {index < 3 && (
                      <>
                        <div className="w-2 md:w-4"></div>
                        <div className="w-8 md:w-16 h-0.5 bg-white"></div>
                        <div className="w-2 md:w-4"></div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center items-center flex-1">
              <div 
                className="w-full max-w-2xl px-12 py-8 rounded-lg relative"
                style={{
                  border: '2px solid transparent',
                  backgroundImage: 'linear-gradient(#111112, #111112), linear-gradient(45deg, #8F9093, #C0C4C8, #BDBDBD, #959FA7, #666666)',
                  backgroundOrigin: 'border-box',
                  backgroundClip: 'padding-box, border-box',
                }}
              >
                <div className="text-center">
                  <h2 className="text-white text-2xl font-medium mb-8 font-poppins">
                    Processing Failed
                  </h2>
                  
                  <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 mb-8">
                    <p className="text-red-300 font-poppins">{error}</p>
                  </div>
                  
                  <button
                    onClick={handleTryAgain}
                    className="px-16 py-3 font-bold text-lg uppercase tracking-wide transform -skew-x-12 transition-all duration-200"
                    style={{
                      background: '#F8FF13',
                      color: 'black',
                      border: '0.5px solid transparent',
                      backgroundImage: 'linear-gradient(#F8FF13, #F8FF13), linear-gradient(45deg, #8F9093, #C0C4C8, #BDBDBD, #959FA7, #666666)',
                      backgroundOrigin: 'border-box',
                      backgroundClip: 'padding-box, border-box',
                    }}
                  >
                    <span className="block transform skew-x-12">TRY AGAIN</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full">
      <section 
        className="relative w-full bg-no-repeat bg-center min-h-screen"
        style={{
          backgroundImage: `url('/images/secondpage/Desktop.png')`,
          backgroundSize: 'cover',
        }}
      >
        {/* Mobile Background Override */}
        <div 
          className="absolute inset-0 block md:hidden bg-no-repeat bg-center"
          style={{
            backgroundImage: `url('/images/mobile/mobile.png')`,
            backgroundSize: 'cover',
          }}
        />
        
        <div className="relative z-10 w-full h-full flex flex-col px-4 md:px-6 py-6">
          {/* Logo - Centered on mobile, moved right on desktop */}
          <div className="flex justify-center md:justify-start mb-8">
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
          
          {/* Step Progress Indicator - Larger with more gap on desktop */}
          <div className="flex justify-center mb-4 md:mb-12">
            <div className="flex items-center">
              {[1, 2, 3, 4].map((step, index) => (
                <div key={step} className="flex items-center">
                  <div 
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 flex items-center justify-center font-bold font-poppins text-sm md:text-base"
                    style={{
                      borderColor: '#F8FF13',
                      backgroundColor: '#F8FF13',
                      color: 'black',
                    }}
                  >
                    {step}
                  </div>
                  {index < 3 && (
                    <>
                      <div className="w-2 md:w-4"></div>
                      <div className="w-8 md:w-16 h-0.5 bg-white"></div>
                      <div className="w-2 md:w-4"></div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Layout - Vertical on mobile, 2-column on desktop */}
          <div className="flex-1 flex flex-col lg:grid lg:grid-cols-2 gap-6 items-center max-w-sm md:max-w-none mx-auto lg:mx-0 lg:pl-8 lg:pr-8">
            {/* Generated Poster */}
            <div className="flex justify-center lg:justify-end lg:transform lg:translate-x-[-100px]">
              <div 
                className="relative rounded-lg overflow-hidden"
                style={{
                  border: '1px solid #F8FF13',
                  maxWidth: '300px',
                  width: '100%',
                }}
              >
                {processedImage && (
                  <img 
                    src={processedImage} 
                    alt="Generated Poster" 
                    className="w-full h-auto object-cover"
                  />
                )}
              </div>
            </div>

            {/* Content - Centered on mobile */}
            <div className="flex flex-col justify-center text-center lg:text-center lg:pl-4 lg:transform lg:translate-x-[-80px]">
              {/* Main Title */}
              <h1 className="text-white text-base md:text-xl lg:text-2xl font-bold mb-3 md:mb-4 font-poppins">
                HERE'S YOUR PERSONALIZED<br />
                POSTER <span style={{ color: '#F8FF13' }}>WITH DIVINE HIMSELF!</span>
              </h1>

              {/* Description Text */}
              <div className="text-white text-xs md:text-sm lg:text-sm mb-4 md:mb-6 font-poppins leading-tight">
                <p className="mb-0">
                  Download & participate in <span style={{ color: '#F8FF13' }}>#DIVINExParimatch</span>
                </p>
                <p className="mb-0" style={{ color: '#F8FF13' }}>
                  to win exciting prizes!
                </p>
                <p>
                  Check out our Instagram page for contest details!
                </p>
              </div>

              {/* Download Button */}
              <div className="mb-4 md:mb-6">
                <button
                  onClick={handleDownload}
                  className="px-6 py-2 md:px-8 md:py-3 font-bold text-base md:text-base uppercase tracking-wider transition-all duration-200 hover:scale-105"
                  style={{
                    background: '#F8FF13',
                    color: 'black',
                    border: 'none',
                    borderRadius: '5px',
                  }}
                >
                  DOWNLOAD
                </button>
              </div>

              {/* Try Again Section */}
              <div className="text-white font-poppins">
                <p className="text-xs md:text-sm lg:text-sm mb-0">Not vibing with this one?</p>
                <p className="text-xs md:text-sm lg:text-sm mb-3">Hit refresh and let's create another legend!</p>
                
                <button
                  onClick={handleTryAgain}
                  className="px-6 py-2 md:px-10 md:py-3 font-bold text-base md:text-lg uppercase tracking-wider transition-all duration-200 hover:scale-105"
                  style={{
                    background: '#F8FF13',
                    color: 'black',
                    border: 'none',
                    borderRadius: '5px',
                  }}
                >
                  TRY AGAIN
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResultPageContent />
    </Suspense>
  );
} 