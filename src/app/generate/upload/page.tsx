'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { compressForFaceSwap, needsCompression, isValidImageFile, getFileSizeKB } from '@/utils/imageCompression';
import { trackUserStep, trackGenerationResult, uploadBase64Image, queueBackgroundJob, trackUserSession } from '../../../lib/supabase';
import { SessionManager } from '../../../lib/sessionManager';
import { useSessionTimeout } from '../../../hooks/useSessionTimeout';
import { SessionTimeoutModal } from '../../../components/SessionTimeoutModal';

function UploadPhotoPageContent() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(true);

  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const searchParams = useSearchParams();
  const router = useRouter();

  // Session timeout management
  const {
    isExpired,
    extendSession,
    clearSession,
    updateActivity,
    formatTimeRemaining
  } = useSessionTimeout(sessionId);
  
  // Get data from previous steps
  const gender = searchParams.get('gender');
  const selectedPoster = searchParams.get('poster');

  useEffect(() => {
    // If missing required data, redirect back to start
    if (!gender || !selectedPoster) {
      router.push('/generate/gender');
      return;
    }

    // Initialize session tracking
    const initSession = async () => {
      const currentSessionId = localStorage.getItem('sessionId') || '';
      setSessionId(currentSessionId);
      
      if (currentSessionId) {
        // Ensure session exists in database (create if missing)
        console.log('Ensuring session exists in database for:', currentSessionId);
        await trackUserSession(currentSessionId);
        
        // Track that user reached photo upload
        await trackUserStep(currentSessionId, 'photo_upload', {
          page: 'photo_upload',
          gender: gender,
          selected_poster: selectedPoster,
          timestamp: new Date().toISOString()
        });
      }
    };
    
    initSession();
  }, [gender, selectedPoster, router]);

  const handleFileUpload = async (file: File) => {
    console.log('=== FILE UPLOAD DEBUG ===');
    console.log('File uploaded:', file.name, file.type);
    console.log('Original file size:', getFileSizeKB(file).toFixed(2), 'KB');
    console.log('Current gender:', gender);
    console.log('Current selectedPoster:', selectedPoster);
    console.log('Current sessionId:', sessionId);
    
    if (file && isValidImageFile(file)) {
      // Check if compression is needed
      const needsComp = await needsCompression(file);
      console.log('Image needs compression:', needsComp);
      
      let processedFile = file;
      
      if (needsComp) {
        console.log('Compressing image for face swap optimization...');
        try {
          processedFile = await compressForFaceSwap(file);
          console.log('Compressed file size:', getFileSizeKB(processedFile).toFixed(2), 'KB');
        } catch (error) {
          console.error('Compression failed, using original file:', error);
          processedFile = file;
        }
      }
      const reader = new FileReader();
      reader.onload = async (e) => {
        console.log('File read successfully, starting upload to Supabase...');
        setUploadedImage(e.target?.result as string);
        setShowPreviewModal(true);
        
        // Upload image to Supabase storage and track
        if (sessionId) {
          // Upload to Supabase storage
          const uploadResult = await uploadBase64Image(
            e.target?.result as string,
            sessionId,
            'user_photo',
            processedFile.name
          );

          // Queue background job as backup for users who might leave
          const userName = localStorage.getItem('userName') || '';
          const userEmail = localStorage.getItem('userEmail') || '';
          
          console.log('Background job conditions check:', {
            hasUploadResult: !!uploadResult,
            uploadResultUrl: uploadResult?.url,
            userEmail: userEmail,
            gender: gender,
            selectedPoster: selectedPoster,
            sessionId: sessionId
          });
          
          if (uploadResult && userEmail && gender && selectedPoster) {
            console.log('All conditions met, queuing background job...');
            try {
              await queueBackgroundJob(sessionId, {
                gender: gender,
                posterName: selectedPoster,
                userImageUrl: uploadResult.url,
                userName: userName,
                userEmail: userEmail
              });
              console.log('Background job queued successfully for session:', sessionId);
            } catch (error) {
              console.error('Failed to queue background job:', error);
            }
          } else {
            console.log('Background job NOT queued - missing conditions');
          }

          await trackUserStep(sessionId, 'photo_upload', {
            action: 'photo_uploaded',
            file_type: file.type,
            file_size: file.size,
            gender: gender,
            selected_poster: selectedPoster,
            image_uploaded_to_storage: !!uploadResult,
            storage_url: uploadResult?.url,
            storage_path: uploadResult?.path,
            background_job_queued: !!(uploadResult && userEmail),
            timestamp: new Date().toISOString()
          });
        }
      };
      reader.readAsDataURL(processedFile);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const handleSubmit = async () => {
    if (uploadedImage && selectedPoster && gender && sessionId) {
      setLoading(true);
      
      try {
        // Get the uploaded image info from storage
        const uploadResult = await uploadBase64Image(
          uploadedImage,
          sessionId,
          'user_photo',
          'user-photo.jpg'
        );

        // Track generation start
        await trackGenerationResult(sessionId, {
          gender: gender,
          poster_selected: selectedPoster,
          user_image_uploaded: true,
          user_image_url: uploadResult?.url,
          user_image_path: uploadResult?.path,
          processing_status: 'started',
          result_image_generated: false
        });

        await trackUserStep(sessionId, 'processing', {
          action: 'generation_started',
          gender: gender,
          selected_poster: selectedPoster,
          timestamp: new Date().toISOString()
        });
        
        // Store the user image in localStorage for the next page
        localStorage.setItem('userImage', uploadedImage);
        localStorage.setItem('selectedPoster', selectedPoster);
        localStorage.setItem('selectedGender', gender);
        
        // Navigate to result page
        router.push(`/generate/result?gender=${gender}&poster=${encodeURIComponent(selectedPoster)}`);
      } catch (error) {
        console.error('Error processing:', error);
        
        // Track error
        if (sessionId) {
          await trackUserStep(sessionId, 'error', {
            error_type: 'submit_error',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          });
        }
        
        setLoading(false);
      }
    }
  };

  const handleCameraClick = async () => {
    try {
      // Inject CSS for capture button font
      const style = document.createElement('style');
      style.textContent = `
        .capture-photo-btn {
          font-family: 'Pari-Match Regular', 'Arial Black', 'Arial Bold', sans-serif !important;
          font-weight: bold !important;
        }
      `;
      document.head.appendChild(style);
      
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } // Use front camera by default
      });
      
      // Create video element to show camera feed
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;
      
      // Create canvas to capture the photo
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      // Create a simple camera interface
      const cameraModal = document.createElement('div');
      cameraModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      `;
      
      video.style.cssText = `
        max-width: 90%;
        max-height: 70%;
        border: 2px solid #F8FF13;
      `;
      
      const captureBtn = document.createElement('button');
      captureBtn.style.cssText = `
        position: relative;
        transform: skewX(-12deg);
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #F8FF13;
        border: 3px solid transparent;
        background-image: linear-gradient(#F8FF13, #F8FF13), linear-gradient(45deg, #8F9093, #C0C4C8, #BDBDBD, #959FA7, #666666);
        background-origin: border-box;
        background-clip: padding-box, border-box;
        border-radius: 3.29px;
        min-width: 300px;
        height: 63px;
        cursor: pointer;
        margin-top: 20px;
        white-space: nowrap;
        overflow: hidden;
      `;
      
      // Create span for text with reverse skew
      const captureSpan = document.createElement('span');
      captureSpan.textContent = 'CAPTURE PHOTO';
      captureSpan.className = 'capture-photo-btn';
      captureSpan.style.cssText = `
        display: block;
        transform: skewX(12deg);
        font-size: 20px;
        color: black;
        white-space: nowrap;
        text-transform: uppercase;
        line-height: 1.1;
      `;
      captureBtn.innerHTML = '';
      captureBtn.appendChild(captureSpan);
      
      const closeBtn = document.createElement('button');
      closeBtn.textContent = '×';
      closeBtn.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        background: none;
        border: none;
        color: white;
        font-size: 30px;
        cursor: pointer;
      `;
      
      cameraModal.appendChild(video);
      cameraModal.appendChild(captureBtn);
      cameraModal.appendChild(closeBtn);
      document.body.appendChild(cameraModal);
      
      // Capture photo function
      captureBtn.onclick = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context?.drawImage(video, 0, 0);
        
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
            // Apply compression to camera photos as well for consistency
            handleFileUpload(file);
          }
        }, 'image/jpeg', 0.85);
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
        document.body.removeChild(cameraModal);
        document.head.removeChild(style);
        setShowModal(false);
      };
      
      // Close camera function
      closeBtn.onclick = () => {
        stream.getTracks().forEach(track => track.stop());
        document.body.removeChild(cameraModal);
        // Clean up injected styles
        document.head.removeChild(style);
      };
      
    } catch (error) {
      console.error('Camera access denied or not available:', error);
      // Fallback to file input with camera preference
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'camera';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          handleFileUpload(file);
          setShowModal(false);
        }
      };
      input.click();
    }
  };

  const handleUploadClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleFileUpload(file);
        setShowModal(false);
      }
    };
    input.click();
  };

  return (
    <div className="w-full">
      {/* Upload Photo Page */}
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
                      borderColor: (step === 1 || step === 2 || step === 3) ? '#F8FF13' : 'white',
                      backgroundColor: (step === 1 || step === 2 || step === 3) ? '#F8FF13' : 'transparent',
                      color: (step === 1 || step === 2 || step === 3) ? 'black' : 'white',
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
          <div className="flex justify-center items-center flex-1">
            <div 
              className="w-full max-w-4xl px-12 py-8 rounded-lg relative"
              style={{
                border: '2px solid transparent',
                backgroundImage: 'linear-gradient(#111112, #111112), linear-gradient(45deg, #8F9093, #C0C4C8, #BDBDBD, #959FA7, #666666)',
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box',
              }}
            >
              {/* Back Button */}
              <button
                onClick={() => window.location.href = `/generate/poster?gender=${gender}`}
                className="absolute top-4 left-4 transition-all duration-200 hover:opacity-75"
              >
                <img src="/images/icons/backbutton.png" alt="Back" className="w-8 h-8" />
              </button>

              <h2 className="text-white text-xl md:text-2xl font-medium text-center mb-8 font-poppins">
                Upload Your Photo
              </h2>
              
              {/* Upload Area - Vertical on mobile, horizontal on desktop */}
              <div className="flex flex-col md:flex-row items-center justify-center space-y-8 md:space-y-0 md:space-x-12 mb-12">
                
                {/* Desktop Left Side - Instructions and Wrong/Right Images */}
                <div className="hidden md:flex items-center space-x-8">
                  {/* Instructions Image */}
                  <div className="flex items-center">
                    <img 
                      src="/images/uploadpage/instructions.avif" 
                      alt="Instructions" 
                      className="h-36 w-auto object-contain"
                    />
                  </div>
                  
                  {/* Wrong and Right Images Vertically Stacked */}
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center justify-center">
                      <img 
                        src="/images/uploadpage/wrong.avif" 
                        alt="Wrong example" 
                        className="h-32 w-auto object-contain"
                      />
                    </div>
                    <div className="flex items-center justify-center">
                      <img 
                        src="/images/uploadpage/right.avif" 
                        alt="Right example" 
                        className="h-32 w-auto object-contain"
                      />
                    </div>
                  </div>
                </div>

                {/* Upload Section */}
                <div className="flex justify-center items-center">
                  {/* Upload Zone */}
                  <div>
                    <div
                      className="w-64 h-64 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all duration-200"
                      style={{
                        borderColor: dragActive ? '#F8FF13' : '#666666',
                        backgroundColor: dragActive ? 'rgba(248, 255, 19, 0.1)' : 'transparent',
                      }}
                      onDrop={handleDrop}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragActive(true);
                      }}
                      onDragLeave={() => setDragActive(false)}
                      onClick={() => setShowModal(true)}
                    >
                      <div className="flex flex-col items-center space-y-4">
                        <img src="/images/icons/upload.png" alt="Upload" className="w-12 h-12" />
                        <div className="text-white text-base font-poppins text-center">
                          Upload your image<br />
                          <span className="text-sm text-gray-400">Click or drag & drop</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div 
            className="relative rounded-lg p-6 w-80 md:w-auto"
            style={{ 
              backgroundColor: '#111112',
              border: '0.5px solid #F8FF13'
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-white hover:text-gray-300 text-xl font-bold"
              style={{ 
                fontStyle: 'normal', 
                fontFamily: 'Arial, sans-serif',
                fontWeight: 'normal',
                transform: 'none'
              }}
            >
              ×
            </button>

            {/* Modal content - Vertical on mobile, horizontal on desktop */}
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 py-4">
              {/* Use Camera button */}
              <button
                onClick={handleCameraClick}
                className="w-full md:w-auto flex items-center justify-center space-x-2 px-6 py-3 rounded-lg transition-colors"
                style={{
                  border: '0.5px solid #F8FF13',
                  backgroundImage: 'linear-gradient(to right, #161616 0%, #565656 100%)',
                }}
              >
                <span className="text-white font-poppins">Use Camera</span>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0118.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {/* OR text */}
              <div className="text-white font-poppins">or</div>

              {/* Upload button */}
              <button
                onClick={handleUploadClick}
                className="w-full md:w-auto flex items-center justify-center space-x-2 px-6 py-3 rounded-lg transition-colors"
                style={{
                  border: '0.5px solid #F8FF13',
                  backgroundImage: 'linear-gradient(to right, #161616 0%, #565656 100%)',
                }}
              >
                <span className="text-white font-poppins">Upload</span>
                <img src="/images/icons/upload.png" alt="Upload" className="w-5 h-5" />
              </button>

              {/* Supported formats text - Below on mobile, right on desktop */}
              <div className="text-gray-400 text-xs md:text-sm font-poppins text-center md:text-left">
                ( supported file formats jpg, png, pdf )
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Instructions Modal - Shows on first visit */}
      {showInstructionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 md:hidden">
          <div 
            className="relative rounded-lg p-6 w-80 max-w-sm mx-4"
            style={{ 
              backgroundColor: '#111112',
              border: '0.5px solid #F8FF13'
            }}
          >
            {/* Modal content */}
            <div className="flex flex-col items-center space-y-6 py-4">
              {/* Title */}
              <h3 className="text-white text-lg font-medium font-poppins text-center">
                Photo Guidelines
              </h3>

              {/* Wrong and Right Images Vertically Stacked */}
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-center">
                  <img 
                    src="/images/uploadpage/wrong.avif" 
                    alt="Wrong example" 
                    className="h-24 w-auto object-contain"
                  />
                </div>
                <div className="flex items-center justify-center">
                  <img 
                    src="/images/uploadpage/right.avif" 
                    alt="Right example" 
                    className="h-24 w-auto object-contain"
                  />
                </div>
              </div>

              {/* Instructions Image Below */}
              <div className="flex items-center justify-center">
                <img 
                  src="/images/uploadpage/instructions.avif" 
                  alt="Instructions" 
                  className="h-32 w-auto object-contain"
                />
              </div>

              {/* Understood Button */}
              <button
                onClick={() => setShowInstructionsModal(false)}
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
                <span className="block transform skew-x-12 font-parimatch font-bold text-black text-3xl">UNDERSTOOD</span>
              </button>
              
              {/* Desktop Understood Button with Custom Dimensions */}
              <button
                onClick={() => setShowInstructionsModal(false)}
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
                  UNDERSTOOD
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && uploadedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div 
            className="relative rounded-lg p-8 w-96 md:w-auto max-w-2xl"
            style={{ 
              backgroundColor: '#111112',
              border: '0.5px solid #F8FF13'
            }}
          >
            {/* Close button */}
            <button
              onClick={() => {
                setShowPreviewModal(false);
                setUploadedImage(null);
              }}
              className="absolute top-3 right-3 text-white hover:text-gray-300 text-xl font-bold"
              style={{ 
                fontStyle: 'normal', 
                fontFamily: 'Arial, sans-serif',
                fontWeight: 'normal',
                transform: 'none'
              }}
            >
              ×
            </button>

            {/* Modal content */}
            <div className="flex flex-col items-center space-y-6 py-4">
              {/* Title */}
              <h3 className="text-white text-xl font-medium font-poppins text-center">
                Preview Your Photo
              </h3>

              {/* Preview Image */}
              <div className="w-80 h-80 bg-gray-300 rounded-lg overflow-hidden">
                <img 
                  src={uploadedImage} 
                  alt="Photo preview" 
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
                {/* Retake Button */}
                <button
                  onClick={() => {
                    setShowPreviewModal(false);
                    setUploadedImage(null);
                  }}
                  className="relative transform -skew-x-12 transition-all duration-200 hover:scale-105 flex items-center justify-center lg:hidden"
                  style={{
                    background: '#F8FF13',
                    border: '3px solid transparent',
                    backgroundImage: 'linear-gradient(#F8FF13, #F8FF13), linear-gradient(45deg, #8F9093, #C0C4C8, #BDBDBD, #959FA7, #666666)',
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'padding-box, border-box',
                    borderRadius: '3.29px',
                    padding: '16px 70px',
                    minWidth: '240px',
                  }}
                >
                  <span className="block transform skew-x-12 font-parimatch font-bold text-black text-3xl whitespace-nowrap">RETAKE PHOTO</span>
                </button>
                
                {/* Desktop Retake Button with Custom Dimensions */}
                <button
                  onClick={() => {
                    setShowPreviewModal(false);
                    setUploadedImage(null);
                  }}
                  className="hidden lg:flex relative transform -skew-x-12 transition-all duration-200 hover:scale-105 items-center justify-center"
                  style={{
                    background: '#F8FF13',
                    border: '3px solid transparent',
                    backgroundImage: 'linear-gradient(#F8FF13, #F8FF13), linear-gradient(45deg, #8F9093, #C0C4C8, #BDBDBD, #959FA7, #666666)',
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'padding-box, border-box',
                    borderRadius: '3.29px',
                    width: '320px',
                    height: '63px',
                  }}
                >
                  <span className="block transform skew-x-12 font-parimatch font-bold text-black flex items-center justify-center text-3xl whitespace-nowrap">
                    RETAKE PHOTO
                  </span>
                </button>

                {/* Submit Button */}
                <button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="relative transform -skew-x-12 transition-all duration-200 hover:scale-105 flex items-center justify-center lg:hidden"
                  style={{
                    background: loading ? '#585858' : '#F8FF13',
                    border: '3px solid transparent',
                    backgroundImage: loading 
                      ? 'none'
                      : 'linear-gradient(#F8FF13, #F8FF13), linear-gradient(45deg, #8F9093, #C0C4C8, #BDBDBD, #959FA7, #666666)',
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'padding-box, border-box',
                    borderRadius: '3.29px',
                    padding: '16px 48px',
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  <span className="block transform skew-x-12 font-parimatch font-bold text-black text-3xl">
                    {loading ? 'PROCESSING...' : 'SUBMIT'}
                  </span>
                </button>
                
                {/* Desktop Submit Button with Custom Dimensions */}
                <button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="hidden lg:flex relative transform -skew-x-12 transition-all duration-200 hover:scale-105 items-center justify-center"
                  style={{
                    background: loading ? '#585858' : '#F8FF13',
                    border: '3px solid transparent',
                    backgroundImage: loading 
                      ? 'none'
                      : 'linear-gradient(#F8FF13, #F8FF13), linear-gradient(45deg, #8F9093, #C0C4C8, #BDBDBD, #959FA7, #666666)',
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'padding-box, border-box',
                    borderRadius: '3.29px',
                    width: '263px',
                    height: '63px',
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  <span className="block transform skew-x-12 font-parimatch font-bold text-black w-32 h-22 flex items-center justify-center text-3xl">
                    {loading ? 'PROCESSING...' : 'SUBMIT'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UploadPhotoPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UploadPhotoPageContent />
    </Suspense>
  );
} 