'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { trackUserStep, updateGenerationResult, uploadBase64Image, trackDownload, checkIfEmailAlreadySent } from '../../../lib/supabase';

function ResultPageContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [sessionId, setSessionId] = useState<string>('');
  const [hairSwappedImage, setHairSwappedImage] = useState<string | null>(null);
  const [originalFaceSwapImage, setOriginalFaceSwapImage] = useState<string | null>(null);
  const [showLeaveEarlyMessage, setShowLeaveEarlyMessage] = useState(false);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const gender = searchParams.get('gender');
  const selectedPoster = searchParams.get('poster');

  // Email notification function
  const sendEmailNotification = async (sessionId: string, posterUrl: string) => {
    try {
      const userEmail = localStorage.getItem('userEmail');
      const userName = localStorage.getItem('userName');
      
      if (!userEmail) {
        console.log('No email found in localStorage, skipping email notification');
        return;
      }

      // Check if email was already sent to avoid duplicates
      const emailAlreadySent = await checkIfEmailAlreadySent(sessionId);
      if (emailAlreadySent) {
        console.log('Email already sent for this session, skipping duplicate');
        return;
      }

      console.log('Sending email notification to:', userEmail);
      
      // Use Hostinger SMTP endpoint for reliable email delivery
      // This uses your domain email (support@posewithdivine.com) via SMTP
      const response = await fetch('https://posewithdivine.com/api/send-email.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: userEmail,
          userName: userName || 'there',
          posterUrl: posterUrl,
          sessionId: sessionId
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('Email sent successfully');
        // Update generation result to mark email as sent
        await updateGenerationResult(sessionId, {
          user_email: userEmail,
          user_name: userName || undefined,
          email_sent: true
        });
      } else {
        console.error('Email sending failed:', result.error);
      }
    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  };

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
    if (storedUserImage) {
    setUserImage(storedUserImage);
    }
    
    // Track result page visit
    if (currentSessionId) {
      trackUserStep(currentSessionId, 'result_generated', {
        page: 'result_page',
        gender: storedGender,
        selected_poster: storedPoster,
        timestamp: new Date().toISOString()
      });
    }

    if (storedUserImage && storedPoster && storedGender) {
    processFaceSwap(storedUserImage, storedPoster, storedGender, currentSessionId);
    
    // Show "leave early" message after 30 seconds
    const leaveEarlyTimer = setTimeout(() => {
      setShowLeaveEarlyMessage(true);
    }, 30000); // 30 seconds

    // Cleanup timer on component unmount or when loading finishes
    return () => clearTimeout(leaveEarlyTimer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const processFaceSwap = async (userImage: string, posterName: string, gender: string, sessionId: string) => {
    try {
      setLoading(true);
      setError(null);
      setProgress(10);

      console.log('=== FACE SWAP DEBUG START ===');
      console.log('Starting face swap process with params:', { 
        posterName, 
        gender,
        sessionId,
        userImageType: userImage.substring(0, 30) + '...' // Just log the start of the data URL
      });

      // Convert base64 to blob
      const response = await fetch(userImage);
      const blob = await response.blob();
      
      console.log('User image blob details:', {
        size: blob.size,
        type: blob.type,
        // Remove lastModified as it doesn't exist on Blob type
      });
      setProgress(20);

      // Create FormData
      const formData = new FormData();
      formData.append('userImage', blob, 'user-photo.jpg');
      formData.append('posterName', posterName);
      formData.append('sessionId', sessionId);

      console.log('FormData created with fields:', {
        posterName: formData.get('posterName'),
        sessionId: formData.get('sessionId'),
        hasUserImage: formData.has('userImage')
      });
      setProgress(30);

      console.log('Calling PHP face swap API endpoint: /api/process-faceswap.php');

      // Start progressive loading animation while API is processing
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev < 85) {
            return prev + Math.random() * 2; // Slowly increment by 0-2% each time
          }
          return prev; // Stop at 85% until API completes
        });
      }, 500); // Update every 500ms

      // Call PHP API endpoint directly
      let faceSwapResponse;
      let responseText = '';
      
      try {
        faceSwapResponse = await fetch('/api/process-faceswap.php', {
          method: 'POST',
          body: formData,
        });
        
        // Store the response text for debugging
        responseText = await faceSwapResponse.clone().text().catch(e => `Error reading response: ${e.message}`);
        console.log(`PHP API response status: ${faceSwapResponse.status}`, 
          faceSwapResponse.status !== 200 ? `Response text: ${responseText}` : '(Success)');
      } catch (fetchError: any) {
        console.error('Fetch error:', fetchError);
        clearInterval(progressInterval);
        throw new Error(`API request failed: ${fetchError.message}`);
      }

      // Clear the progressive loading interval
      clearInterval(progressInterval);

      console.log(`Face swap API final response status:`, faceSwapResponse.status);

      if (!faceSwapResponse.ok) {
        let errorMessage = 'Face swap processing failed. Please try again.';
        
        try {
          // Try to parse the response as JSON
          const errorData = await faceSwapResponse.json().catch(e => {
            console.error('Error parsing JSON response:', e);
            return { error: `Failed to parse response: ${responseText}` };
          });
          
          console.error('Face swap API error data:', errorData);
          
          // Use a user-friendly message instead of raw API error
          errorMessage = errorData.error && typeof errorData.error === 'string' 
            ? 'Processing failed. Please try again with a different photo.' 
            : 'Face swap service is temporarily unavailable. Please try again.';
        } catch (parseError) {
          console.error('Error parsing API response:', parseError);
          console.log('Raw response text:', responseText);
          errorMessage = 'Service temporarily unavailable. Please try again later.';
        }
        
        throw new Error(errorMessage);
      }

      // Try to parse the response as JSON
      let result;
      try {
        result = await faceSwapResponse.json();
        console.log('Face swap result structure:', Object.keys(result));
        console.log('Face swap success:', result.success);
        console.log('Has image URL:', !!result.imageUrl);
        console.log('Has Supabase URL:', !!result.supabaseUrl);
      } catch (jsonError) {
        console.error('Error parsing successful response as JSON:', jsonError);
        console.log('Raw successful response text:', responseText);
        throw new Error('Error processing the response from the face swap service');
      }
      
      console.log('Face swap result:', { success: result.success, hasImage: !!result.imageUrl });

      if (result.success && result.imageUrl) {
        // Quickly complete progress to 100%
        setProgress(100);
        
        setOriginalFaceSwapImage(result.imageUrl); // Store face swap result
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
            hair_swap_completed: true // FaceSwap v4 completed both face and hair
          });
          
          await trackUserStep(sessionId, 'result_generated', {
            action: 'face_and_hair_swap_completed',
            success: true,
            generated_image_stored: !!faceSwapUploadResult,
            storage_url: faceSwapUploadResult?.url,
            storage_path: faceSwapUploadResult?.path,
            timestamp: new Date().toISOString()
          });
        }
        
        // FaceSwap v4 handles both face and hair swapping in one call
        setProcessedImage(result.imageUrl);
        
        // Send email notification
        await sendEmailNotification(sessionId, faceSwapUploadResult?.url || result.imageUrl);
        
        // Brief delay to show 100% completion, then proceed
        setTimeout(() => {
          setLoading(false);
          setShowLeaveEarlyMessage(false); // Hide message when processing completes
        }, 800);
        
        console.log('Face and hair swap completed successfully with FaceSwap v4!');
      } else {
        clearInterval(progressInterval);
        throw new Error(result.error || 'Processing failed - no image returned');
      }
    } catch (error) {
      console.error('Face swap error:', error);
      let errorMessage = 'Processing failed. Please try again.';
      
      if (error instanceof Error) {
        // Filter out technical error messages and provide user-friendly ones
        const originalMessage = error.message.toLowerCase();
        
        if (originalMessage.includes('api configuration') || originalMessage.includes('api key')) {
          errorMessage = 'Service temporarily unavailable. Please try again later.';
        } else if (originalMessage.includes('timeout') || originalMessage.includes('timed out')) {
          errorMessage = 'Processing is taking longer than expected. Please try again.';
        } else if (originalMessage.includes('network') || originalMessage.includes('connection')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (originalMessage.includes('invalid') || originalMessage.includes('failed to')) {
          errorMessage = 'Processing failed. Please try again with a different photo.';
        } else {
          // For any other error, use a generic message
          errorMessage = 'Something went wrong. Please try again.';
        }
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

  const performAutomaticHairSwap = async (faceSwappedImageUrl: string, userOriginalImageUrl: string, sessionId: string) => {
    try {
      console.log('=== HAIR SWAP DEBUG START ===');
      console.log('Starting automatic hair swap process with params:', {
        faceSwappedImageUrlType: faceSwappedImageUrl.substring(0, 30) + '...',
        userOriginalImageUrlType: userOriginalImageUrl.substring(0, 30) + '...',
        sessionId
      });
      setProgress(80);
      
      // Track hair swap processing start
      if (sessionId) {
        await trackUserStep(sessionId, 'hair_swap_processing', {
          action: 'hair_swap_started',
          timestamp: new Date().toISOString()
        });
      }

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
          console.log('Face-swapped image uploaded successfully:', {
            url: uploadResult.url.substring(0, 50) + '...',
            path: uploadResult.path
          });
        } else {
          console.error('Failed to upload face-swapped image');
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
          console.log('User original image uploaded successfully:', {
            url: uploadResult.url.substring(0, 50) + '...',
            path: uploadResult.path
          });
        } else {
          console.error('Failed to upload user original image');
        }
      }

      console.log('Calling hair swap API with URLs:', {
        faceSwappedUrl: faceSwappedUrl.substring(0, 30) + '...',
        userOriginalUrl: userOriginalUrl.substring(0, 30) + '...'
      });
      setProgress(85);

      // Call PHP hair swap API directly
      let hairSwapResponse;
      let responseText = '';
      
      try {
        console.log('Calling PHP hair swap API endpoint: /api/process-hairswap.php');
        hairSwapResponse = await fetch('/api/process-hairswap.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            faceSwappedImageUrl: faceSwappedUrl,
            userOriginalImageUrl: userOriginalUrl
          }),
        });
        
        // Store the response text for debugging
        responseText = await hairSwapResponse.clone().text().catch(e => `Error reading response: ${e.message}`);
        console.log(`PHP hair swap API response status: ${hairSwapResponse.status}`, 
          hairSwapResponse.status !== 200 ? `Response text: ${responseText}` : '(Success)');
      } catch (fetchError: any) {
        console.error('Hair swap fetch error:', fetchError);
        throw new Error(`Hair swap API request failed: ${fetchError.message}`);
      }

      console.log(`Hair swap API final response status:`, hairSwapResponse.status);

      if (!hairSwapResponse.ok) {
        const errorData = await hairSwapResponse.json().catch(e => {
          console.error('Error parsing hair swap JSON error response:', e);
          return { error: `Failed to parse error response: ${responseText}` };
        });
        console.error('Hair swap API error data:', errorData);
        throw new Error(errorData.error || `HTTP ${hairSwapResponse.status}: Hair swap processing failed`);
      }

      const result = await hairSwapResponse.json().catch(e => {
        console.error('Error parsing hair swap JSON success response:', e);
        throw new Error(`Failed to parse success response: ${responseText}`);
      });
      setProgress(95);
      
      console.log('Hair swap result structure:', Object.keys(result));
      console.log('Hair swap success:', result.success);
      console.log('Hair swap has image URL:', !!result.imageUrl);

      if (result.success && result.imageUrl) {
        setHairSwappedImage(result.imageUrl);
        setProcessedImage(result.imageUrl); // Update the displayed image
        setProgress(100);
        console.log('Hair swap completed successfully - final result ready!');
        
        // Upload final hair-swapped result to Supabase storage
        if (sessionId) {
          const uploadResult = await uploadBase64Image(
            result.imageUrl,
            sessionId,
            'generated_poster',
            `final_poster_${Date.now()}.jpg`
          );
          
          // Update generation result with hair swap completion
          await updateGenerationResult(sessionId, {
            hair_swap_completed: true,
            hair_swap_image_url: uploadResult?.url,
            hair_swap_image_path: uploadResult?.path
          });
          
          // Track final completion
          await trackUserStep(sessionId, 'hair_swap_completed', {
            action: 'final_poster_completed',
            success: true,
            final_image_stored: !!uploadResult,
            storage_url: uploadResult?.url,
            storage_path: uploadResult?.path,
            timestamp: new Date().toISOString()
          });

          // Send email notification
          await sendEmailNotification(sessionId, uploadResult?.url || result.imageUrl);
        }
      } else {
        throw new Error(result.error || 'Hair swap failed - no image returned');
      }
    } catch (error) {
      console.error('Automatic hair swap error:', error);
      console.log('Hair swap failed, showing face-swapped result only');
      
      // If hair swap fails, show the face-swapped result
      setProcessedImage(faceSwappedImageUrl);
      setProgress(100);
      
      let errorMessage = 'Hair swap failed, showing face-swapped result';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Track error but don't show it to user since we have face swap
      if (sessionId) {
        await trackUserStep(sessionId, 'error', {
          error_type: 'hair_swap_error',
          error_message: errorMessage,
          fallback_to_face_swap: true,
          timestamp: new Date().toISOString()
        });
      }

      // Send email notification with face-swapped result
      await sendEmailNotification(sessionId, faceSwappedImageUrl);
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
          
          <div className="relative z-10 w-full h-full flex flex-col px-4 md:px-6 py-6">
            {/* Logo - Left on desktop, centered on mobile */}
            <div className="flex justify-start md:justify-start justify-center mb-8">
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
            
            {/* Step Progress Indicator - Larger and closer to content */}
            <div className="flex justify-center mb-4">
              <div className="flex items-center">
                {[1, 2, 3, 4].map((step, index) => (
                  <div key={step} className="flex items-center">
                    <div 
                      className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 flex items-center justify-center font-bold font-parimatch text-sm md:text-base"
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
                className="relative px-8 py-8 md:px-16 md:py-12 rounded-lg w-96 lg:w-[800px] xl:w-[900px] flex flex-col"
                style={{
                  border: '2px solid #F8FF13',
                  backgroundColor: 'rgba(17, 17, 18, 0.95)',
                  minHeight: '200px',
                }}
              >
                {/* Close button */}
                <button
                  className="absolute top-2 right-3 text-white hover:text-gray-300 text-xl font-bold"
                  style={{ 
                    fontSize: '24px', 
                    lineHeight: '1',
                    fontFamily: 'Arial, sans-serif',
                    fontStyle: 'normal',
                    fontWeight: 'normal',
                    transform: 'none'
                  }}
                >
                  ×
                </button>

                {/* Loading content - Properly centered */}
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  {/* Mobile text with line break */}
                  <p className="text-white text-lg font-poppins mb-6 block lg:hidden text-center">
                    {progress < 75 ? (
                      <>
                        Crafting your debut with your<br />
                        favorite artist...
                      </>
                    ) : progress < 100 ? (
                      <>
                        Adding your unique hairstyle<br />
                        to the poster...
                      </>
                    ) : (
                      <>
                        Creating your personalized<br />
                        poster...
                      </>
                    )}
                  </p>
                  
                  {/* Desktop text in single line */}
                  <p className="text-white text-lg font-poppins mb-6 hidden lg:block text-center">
                    {progress < 75 ? 'Crafting your debut with your favorite artist...' : 
                     progress < 100 ? 'Adding your unique hairstyle to the poster...' : 
                     'Creating your personalized poster...'}
                  </p>
                  
                  {/* Progress Bar */}
                  <div className="w-full max-w-md lg:max-w-lg bg-gray-600 rounded-full h-3 mx-auto mb-4">
                    <div 
                      className="h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: '#F8FF13',
                      }}
                    ></div>
                  </div>
                  
                  {/* Leave Early Message - Shows after 30 seconds */}
                  {showLeaveEarlyMessage && (
                    <div className="text-center mt-4 p-4 border border-yellow-400 rounded-lg bg-black bg-opacity-60">
                      <p className="text-white text-sm font-poppins mb-2">
                        <span style={{ color: '#F8FF13' }}>✨ In a hurry?</span>
                      </p>
                      <p className="text-white text-sm font-poppins leading-relaxed">
                        Feel free to leave the website if you&apos;re in a hurry—your poster is on its way to your email inbox.
                      </p>
                    </div>
                  )}
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
          
          <div className="relative z-10 w-full h-full flex flex-col px-4 md:px-6 py-6">
            {/* Logo - Left on desktop, centered on mobile */}
            <div className="flex justify-start md:justify-start justify-center mb-8">
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
            
            {/* Step Progress Indicator - Larger and closer to content */}
            <div className="flex justify-center mb-4">
              <div className="flex items-center">
                {[1, 2, 3, 4].map((step, index) => (
                  <div key={step} className="flex items-center">
                    <div 
                      className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 flex items-center justify-center font-bold font-parimatch text-sm md:text-base"
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
                    className="w-8 h-8 md:w-8 md:h-8 rounded-full border-2 flex items-center justify-center font-bold font-parimatch text-base md:text-lg"
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
          <div className="flex-1 flex flex-col lg:grid lg:grid-cols-2 gap-6 items-center max-w-sm md:max-w-none mx-auto lg:max-w-6xl lg:mx-auto lg:px-8">
            {/* Generated Poster - Moderately sized on desktop */}
            <div className="mb-8 mt-8 flex justify-center lg:justify-end lg:pr-4 lg:mt-0">
              <div className="relative" style={{ border: '2px solid #F8FF13', borderRadius: '8px', padding: '4px' }}>
                {processedImage && (
                  <img 
                    src={processedImage} 
                    alt="Generated Poster" 
                    className="w-72 md:max-w-md lg:w-80 xl:w-96 object-contain rounded-lg shadow-lg"
                    style={{ height: 'auto' }}
                  />
                )}
              </div>
            </div>

            {/* Right Side Content - Buttons and Text */}
            <div className="flex flex-col justify-center text-center lg:text-center lg:pl-4">
              {/* Main Title */}
              <h1 className="text-white text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 md:mb-6 font-parimatch">
                HERE&apos;S YOUR PERSONALIZED<br />
                POSTER <span style={{ color: '#F8FF13' }}>WITH DIVINE HIMSELF!</span>
              </h1>

              {/* Description Text */}
              <div className="text-white text-sm md:text-base lg:text-base mb-6 md:mb-8 font-poppins lg:leading-tight">
                <p className="mb-0 lg:mb-0">
                  Download & participate in <span style={{ color: '#FFFFFF' }}>#DIVINExParimatch</span>
                </p>
                <p className="mb-0 lg:mb-0 italic" style={{ color: '#F8FF13' }}>
                  to win exciting prizes!
                </p>
                <p className="lg:mb-0">
                  Check out our Instagram page for contest details!
                </p>
              </div>

              {/* Download Button - Custom Desktop Size */}
              <div className="mb-6 flex justify-center lg:justify-center">
                <button 
                  onClick={handleDownload}
                  className="relative transform -skew-x-12 transition-all duration-200 hover:scale-105 flex items-center justify-center lg:hidden"
                  style={{
                    background: '#F8FF13',
                    border: '3px solid transparent',
                    backgroundImage: 'linear-gradient(#F8FF13, #F8FF13), linear-gradient(45deg, #8F9093, #C0C4C8, #BDBDBD, #959FA7, #666666)',
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'padding-box, border-box',
                    borderRadius: '3.29px',
                    padding: '16px 48px',
                  }}
                >
                  <span className="block transform skew-x-12 font-parimatch font-bold text-black text-3xl">DOWNLOAD</span>
                </button>
                
                {/* Desktop Download Button with Custom Dimensions */}
                <button 
                  onClick={handleDownload}
                  className="hidden lg:flex relative transform -skew-x-12 transition-all duration-200 hover:scale-105 items-center justify-center"
                  style={{
                    background: '#F8FF13',
                    border: '3px solid transparent',
                    backgroundImage: 'linear-gradient(#F8FF13, #F8FF13), linear-gradient(45deg, #8F9093, #C0C4C8, #BDBDBD, #959FA7, #666666)',
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'padding-box, border-box',
                    borderRadius: '3.29px',
                    width: '263px',
                    height: '63px',
                  }}
                >
                  <span className="block transform skew-x-12 font-parimatch font-bold text-black w-32 h-22 flex items-center justify-center text-3xl">
                    DOWNLOAD
                  </span>
                </button>
              </div>

              {/* Try Again Section */}
              <div className="text-white font-poppins text-center lg:text-center">
                <p className="text-sm md:text-base lg:text-base mb-0 lg:mb-1 lg:leading-snug">Not vibing with this one?</p>
                <p className="text-sm md:text-base lg:text-base mb-4 lg:mb-4 lg:leading-snug">Hit refresh and let&apos;s create another legend!</p>
                
                {/* Try Again Button */}
                <div className="flex justify-center lg:justify-center">
                  <button 
                    onClick={handleTryAgain}
                    className="relative transform -skew-x-12 transition-all duration-200 hover:scale-105 flex items-center justify-center lg:hidden"
                    style={{
                      background: '#F8FF13',
                      border: '3px solid transparent',
                      backgroundImage: 'linear-gradient(#F8FF13, #F8FF13), linear-gradient(45deg, #8F9093, #C0C4C8, #BDBDBD, #959FA7, #666666)',
                      backgroundOrigin: 'border-box',
                      backgroundClip: 'padding-box, border-box',
                      borderRadius: '3.29px',
                      padding: '16px 48px',
                    }}
                  >
                    <span className="block transform skew-x-12 font-parimatch font-bold text-black text-3xl">TRY AGAIN</span>
                  </button>
                  
                  {/* Desktop Try Again Button with Custom Dimensions */}
                  <button 
                    onClick={handleTryAgain}
                    className="hidden lg:flex relative transform -skew-x-12 transition-all duration-200 hover:scale-105 items-center justify-center"
                    style={{
                      background: '#F8FF13',
                      border: '3px solid transparent',
                      backgroundImage: 'linear-gradient(#F8FF13, #F8FF13), linear-gradient(45deg, #8F9093, #C0C4C8, #BDBDBD, #959FA7, #666666)',
                      backgroundOrigin: 'border-box',
                      backgroundClip: 'padding-box, border-box',
                      borderRadius: '3.29px',
                      width: '263px',
                      height: '63px',
                    }}
                  >
                    <span className="block transform skew-x-12 font-parimatch font-bold text-black w-32 h-22 flex items-center justify-center text-3xl">
                      TRY AGAIN
                    </span>
                  </button>
                </div>
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