'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { trackUserStep, updateGenerationResult, uploadBase64Image, trackDownload } from '../../../lib/supabase';

function ResultPageContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [sessionId, setSessionId] = useState<string>('');
  const [hairSwappedImage, setHairSwappedImage] = useState<string | null>(null);
  const [originalFaceSwapImage, setOriginalFaceSwapImage] = useState<string | null>(null);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const gender = searchParams.get('gender');
  const selectedPoster = searchParams.get('poster');

  useEffect(() => {
    // Get user image from localStorage
    const storedUserImage = localStorage.getItem('userImage');
    const storedPoster = localStorage.getItem('selectedPoster');
    const storedGender = localStorage.getItem('selectedGender');
    const currentSessionId = localStorage.getItem('sessionId') || '';

    if (!storedUserImage || !storedPoster || !storedGender) {
      router.push('/generate/gender');
      return;
    }

    setSessionId(currentSessionId);
    setUserImage(storedUserImage);
    
    // Track result page visit
    if (currentSessionId) {
      trackUserStep(currentSessionId, 'result_generated', {
        page: 'result_page',
        gender: storedGender,
        selected_poster: storedPoster,
        timestamp: new Date().toISOString()
      });
    }

    processFaceSwap(storedUserImage, storedPoster, storedGender, currentSessionId);
  }, [router]);

  const processFaceSwap = async (userImage: string, posterName: string, gender: string, sessionId: string) => {
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
        setOriginalFaceSwapImage(result.imageUrl); // Store face swap result
        setProgress(75); // Face swap done, now starting hair swap
        console.log('Face swap completed successfully, starting hair swap...');
        
        // Upload face-swapped result to Supabase storage
        let faceSwapUploadResult = null;
        if (sessionId) {
          faceSwapUploadResult = await uploadBase64Image(
            result.imageUrl,
            sessionId,
            'generated_poster',
            `face_swapped_poster_${Date.now()}.jpg`
          );
        }
        
        // Track face swap completion
        if (sessionId) {
          await updateGenerationResult(sessionId, {
            processing_status: 'completed',
            result_image_generated: true,
            generated_image_url: faceSwapUploadResult?.url,
            generated_image_path: faceSwapUploadResult?.path,
            hair_swap_requested: true // Mark that hair swap will start
          });
          
          await trackUserStep(sessionId, 'result_generated', {
            action: 'face_swap_completed',
            success: true,
            generated_image_stored: !!faceSwapUploadResult,
            storage_url: faceSwapUploadResult?.url,
            storage_path: faceSwapUploadResult?.path,
            timestamp: new Date().toISOString()
          });
        }
        
        // TODO: Complete async hair swap setup - database migration required
        // For now, show face-swapped result immediately
        setProcessedImage(result.imageUrl);
        setProgress(100);
        console.log('Face swap completed - async hair swap disabled until database migration is complete');
        
        // Start async hair swap process (disabled until DB migration)
        // await startAsyncHairSwap(result.imageUrl, userImage, sessionId);
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
      
      // Track error
      if (sessionId) {
        await updateGenerationResult(sessionId, {
          processing_status: 'failed',
          error_message: errorMessage
        });
        
        await trackUserStep(sessionId, 'error', {
          error_type: 'face_swap_error',
          error_message: errorMessage,
          timestamp: new Date().toISOString()
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (processedImage && sessionId) {
      // Track download action with dedicated tracking
      await trackDownload(sessionId, 'generated_poster', 'direct_download');
      
      // Also track in user journey
      await trackUserStep(sessionId, 'result_generated', {
        action: 'image_downloaded',
        image_type: hairSwappedImage ? 'hair_swapped' : 'face_swapped',
        download_timestamp: new Date().toISOString()
      });

      const link = document.createElement('a');
      link.href = processedImage;
      link.download = `divine-parimatch-poster-${hairSwappedImage ? 'hair-swapped' : 'face-swapped'}-${Date.now()}.jpg`;
      link.setAttribute('target', '_blank');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('Image download initiated:', hairSwappedImage ? 'hair-swapped version' : 'face-swapped version');
    }
  };

  const startAsyncHairSwap = async (faceSwappedImageUrl: string, userOriginalImageUrl: string, sessionId: string) => {
    try {
      console.log('Starting async hair swap process...');
      setProgress(80);
      
      // Convert images to public URLs if needed
      let faceSwappedUrl = faceSwappedImageUrl;
      let userOriginalUrl = userOriginalImageUrl;

      // If we have base64 data URLs, we need to upload them to get public URLs
      if (faceSwappedImageUrl.startsWith('data:')) {
        console.log('Uploading face-swapped image to get public URL...');
        const uploadResult = await uploadBase64Image(
          faceSwappedImageUrl,
          sessionId,
          'generated_poster',
          `temp_faceswap_${Date.now()}.jpg`
        );
        if (uploadResult?.url) {
          faceSwappedUrl = uploadResult.url;
        }
      }

      if (userOriginalImageUrl.startsWith('data:')) {
        console.log('Uploading user original image to get public URL...');
        const uploadResult = await uploadBase64Image(
          userOriginalImageUrl,
          sessionId,
          'user_photo',
          `temp_user_${Date.now()}.jpg`
        );
        if (uploadResult?.url) {
          userOriginalUrl = uploadResult.url;
        }
      }

      // Start hair swap job
      console.log('Starting hair swap job...');
      const startResponse = await fetch('/api/start-hairswap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          faceSwappedImageUrl: faceSwappedUrl,
          userOriginalImageUrl: userOriginalUrl,
          sessionId: sessionId
        }),
      });

      if (!startResponse.ok) {
        throw new Error('Failed to start hair swap job');
      }

      const startResult = await startResponse.json();
      
      if (!startResult.success) {
        throw new Error(startResult.error || 'Failed to start hair swap');
      }

      console.log(`Hair swap job started: ${startResult.jobId}`);
      
      // Track hair swap processing start
      if (sessionId) {
        await trackUserStep(sessionId, 'hair_swap_processing', {
          action: 'hair_swap_job_started',
          job_id: startResult.jobId,
          timestamp: new Date().toISOString()
        });
      }

      // Start polling for completion
      await pollHairSwapCompletion(startResult.jobId, sessionId, faceSwappedImageUrl);

    } catch (error) {
      console.error('Error starting async hair swap:', error);
      console.log('Hair swap failed, showing face-swapped result only');
      
      // If hair swap fails, show the face-swapped result
      setProcessedImage(faceSwappedImageUrl);
      setProgress(100);
      
      // Track error but don't show it to user since we have face swap
      if (sessionId) {
        await trackUserStep(sessionId, 'error', {
          error_type: 'hair_swap_start_error',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          fallback_to_face_swap: true,
          timestamp: new Date().toISOString()
        });
      }
    }
  };

  const pollHairSwapCompletion = async (jobId: string, sessionId: string, fallbackImage: string) => {
    const maxAttempts = 30; // 5 minutes max (10s intervals)
    let attempts = 0;

    const poll = async () => {
      try {
        attempts++;
        console.log(`Polling hair swap status (${attempts}/${maxAttempts})...`);
        
        const checkResponse = await fetch('/api/check-hairswap', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jobId: jobId,
            sessionId: sessionId
          }),
        });

        if (!checkResponse.ok) {
          throw new Error('Failed to check job status');
        }

        const result = await checkResponse.json();
        
        if (result.success && result.status === 'COMPLETED' && result.imageUrl) {
          // Hair swap completed!
          setHairSwappedImage(result.imageUrl);
          setProcessedImage(result.imageUrl);
          setProgress(100);
          console.log('Hair swap completed successfully!');
          
          // Upload final result and track completion
          if (sessionId) {
            const uploadResult = await uploadBase64Image(
              result.imageUrl,
              sessionId,
              'generated_poster',
              `final_poster_${Date.now()}.jpg`
            );
            
            await updateGenerationResult(sessionId, {
              hair_swap_completed: true,
              hair_swap_image_url: uploadResult?.url,
              hair_swap_image_path: uploadResult?.path
            });
            
            await trackUserStep(sessionId, 'hair_swap_completed', {
              action: 'final_poster_completed',
              success: true,
              job_id: jobId,
              final_image_stored: !!uploadResult,
              storage_url: uploadResult?.url,
              storage_path: uploadResult?.path,
              timestamp: new Date().toISOString()
            });
          }
          
          return; // Stop polling
        } else if (result.status === 'FAILED') {
          throw new Error('Hair swap job failed');
        } else {
          // Still processing, continue polling
          console.log(`Hair swap status: ${result.status}`);
          setProgress(Math.min(95, 80 + (attempts * 0.5))); // Gradual progress
          
          if (attempts < maxAttempts) {
            setTimeout(poll, 10000); // Poll every 10 seconds
          } else {
            throw new Error('Hair swap timed out');
          }
        }
      } catch (error) {
        console.error('Error polling hair swap status:', error);
        
        // Fallback to face-swapped result
        setProcessedImage(fallbackImage);
        setProgress(100);
        
        if (sessionId) {
          await trackUserStep(sessionId, 'error', {
            error_type: 'hair_swap_polling_error',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            fallback_to_face_swap: true,
            attempts: attempts,
            timestamp: new Date().toISOString()
          });
        }
      }
    };

    // Start polling
    setTimeout(poll, 5000); // Start first poll after 5 seconds
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
                    {progress < 75 ? 'Crafting your debut with your favorite artist...' : 
                     progress < 100 ? 'Adding your unique hairstyle to the poster...' : 
                     'Creating your personalized poster...'}
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
                    className="px-16 py-3 font-normal text-lg uppercase tracking-wide transform -skew-x-12 transition-all duration-200 font-poppins"
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
          
          {/* Step Progress Indicator - Original size on desktop */}
          <div className="flex justify-center mb-4 md:mb-6">
            <div className="flex items-center">
              {[1, 2, 3, 4].map((step, index) => (
                <div key={step} className="flex items-center">
                  <div 
                    className="w-8 h-8 md:w-8 md:h-8 rounded-full border-2 flex items-center justify-center font-bold font-poppins text-sm md:text-sm"
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
                      <div className="w-2 md:w-2"></div>
                      <div className="w-8 md:w-8 h-0.5 bg-white"></div>
                      <div className="w-2 md:w-2"></div>
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
                HERE&apos;S YOUR PERSONALIZED<br />
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
                  disabled={loading}
                  className="px-6 py-2 md:px-10 md:py-3 font-normal text-base md:text-lg uppercase tracking-wider transition-all duration-200 hover:scale-105 font-poppins disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: loading ? '#666' : '#F8FF13',
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
                <p className="text-xs md:text-sm lg:text-sm mb-3">Hit refresh and let&apos;s create another legend!</p>
                
                <button
                  onClick={handleTryAgain}
                  className="px-6 py-2 md:px-10 md:py-3 font-normal text-base md:text-lg uppercase tracking-wider transition-all duration-200 hover:scale-105 font-poppins"
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