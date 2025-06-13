import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

interface Poster {
  name: string;
  path: string;
  fullPath: string;
}

function App() {
  const [userImage, setUserImage] = useState<File | null>(null);
  const [userImagePreview, setUserImagePreview] = useState<string>('');
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | ''>('');
  const [allPosters, setAllPosters] = useState<Poster[]>([]);
  const [filteredPosters, setFilteredPosters] = useState<Poster[]>([]);
  const [selectedPoster, setSelectedPoster] = useState<Poster | null>(null);
  const [processing, setProcessing] = useState(false);
  const [finalImage, setFinalImage] = useState<string>('');
  const [uploadedImagePath, setUploadedImagePath] = useState<string>('');
  
  // Camera states
  const [cameraMode, setCameraMode] = useState<'camera' | 'upload'>('camera');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const API_BASE = 'http://localhost:5000/api';

  useEffect(() => {
    loadPosters();
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    filterPostersByGender();
  }, [selectedGender, allPosters]);

  // Cleanup camera stream when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const loadPosters = async () => {
    try {
      const response = await axios.get(`${API_BASE}/posters`);
      setAllPosters(response.data);
    } catch (error) {
      console.error('Error loading posters:', error);
    }
  };

  const filterPostersByGender = () => {
    if (!selectedGender) {
      setFilteredPosters([]);
      return;
    }

    const filtered = allPosters.filter(poster => {
      const upperName = poster.name.toUpperCase();
      
      if (selectedGender === 'male') {
        // Include posters with 'M' or specifically '3MF' (which is male)
        return upperName.includes('M') || upperName.includes('3MF');
      } else {
        // For female, include 'F' but exclude '3MF' (since it's male)
        return upperName.includes('F') && !upperName.includes('3MF');
      }
    });
    
    setFilteredPosters(filtered);
    setSelectedPoster(null); // Reset selection when gender changes
  };

  const getTargetSide = (posterName: string): 'left' | 'right' => {
    // Based on your specification:
    // 1F, 1M, 2F, 2M = left side
    // 3F, 3M, 3MF = right side
    const upperName = posterName.toUpperCase();
    if (upperName.includes('3F') || upperName.includes('3M') || upperName.includes('3MF')) {
      return 'right';
    }
    return 'left';
  };

  // Camera functions - FIXED VERSION
  const startCamera = async () => {
    try {
      console.log('🎥 Starting camera...');
      
      // Stop existing stream first
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          facingMode: 'user'
        },
        audio: false
      });
      
      console.log('✅ Camera access granted');
      console.log('📊 Stream info:', {
        active: mediaStream.active,
        tracks: mediaStream.getVideoTracks().length
      });
      
      setStream(mediaStream);
      setIsCameraActive(true);
      
      // Wait for video element to be ready
      setTimeout(() => {
        if (videoRef.current) {
          console.log('🔗 Connecting stream to video element');
          videoRef.current.srcObject = mediaStream;
          
          // Ensure video plays
          videoRef.current.onloadedmetadata = () => {
            console.log('📹 Video metadata loaded');
            if (videoRef.current) {
              videoRef.current.play()
                .then(() => console.log('▶️ Video playing'))
                .catch(err => console.error('❌ Play error:', err));
            }
          };
          
          // Auto-play fallback
          setTimeout(() => {
            if (videoRef.current && videoRef.current.paused) {
              console.log('🔄 Force playing video');
              videoRef.current.play().catch(console.error);
            }
          }, 500);
        }
      }, 100);
      
    } catch (error: any) {
      console.error('❌ Camera error:', error);
      setIsCameraActive(false);
      alert(`Camera failed: ${error.message}. Try refreshing or use file upload.`);
    }
  };

  const stopCamera = () => {
    console.log('🛑 Stopping camera');
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('❌ Video or canvas ref not available');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      console.error('❌ Canvas context not available');
      return;
    }

    // Check if video has loaded
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      alert('Please wait for camera to load completely');
      return;
    }

    console.log('📸 Capturing photo...', video.videoWidth, 'x', video.videoHeight);

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob and create file
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
        setUserImage(file);
        
        // Create preview URL
        const previewUrl = canvas.toDataURL('image/jpeg', 0.9);
        setUserImagePreview(previewUrl);
        
        console.log('✅ Photo captured successfully');
        
        // Stop camera after capture
        stopCamera();
      }
    }, 'image/jpeg', 0.9);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUserImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setUserImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const switchToUpload = () => {
    setCameraMode('upload');
    stopCamera();
  };

  const switchToCamera = () => {
    setCameraMode('camera');
    setUserImage(null);
    setUserImagePreview('');
  };

  const uploadUserImage = async () => {
    if (!userImage) return false;

    const formData = new FormData();
    formData.append('userImage', userImage);

    try {
      const response = await axios.post(`${API_BASE}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadedImagePath(response.data.filePath);
      return true;
    } catch (error) {
      console.error('Upload error:', error);
      return false;
    }
  };

  const processFaceSwap = async () => {
    if (!selectedPoster || !uploadedImagePath) {
      alert('Please select a poster and upload your image first!');
      return;
    }

    setProcessing(true);
    setFinalImage('');

    try {
      const targetSide = getTargetSide(selectedPoster.name);
      
      const response = await axios.post(`${API_BASE}/process-faceswap`, {
        userImagePath: uploadedImagePath,
        posterName: selectedPoster.name,
        targetSide: targetSide
      });

      if (response.data.success) {
        setFinalImage(`http://localhost:5000${response.data.finalImageUrl}`);
      } else {
        alert('Face swap failed!');
      }
    } catch (error: any) {
      console.error('Face swap error:', error);
      alert(`Error: ${error.response?.data?.error || 'Face swap failed'}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleStartProcess = async () => {
    if (!userImage) {
      alert('Please capture or upload your image first!');
      return;
    }
    
    if (!selectedGender) {
      alert('Please select your gender first!');
      return;
    }

    if (!selectedPoster) {
      alert('Please select a poster first!');
      return;
    }

    const uploaded = await uploadUserImage();
    if (uploaded) {
      await processFaceSwap();
    }
  };

  const resetProcess = () => {
    setUserImage(null);
    setUserImagePreview('');
    setSelectedGender('');
    setSelectedPoster(null);
    setFinalImage('');
    setUploadedImagePath('');
    stopCamera();
  };

  const downloadPoster = async () => {
    if (!finalImage) return;
    
    try {
      // Fetch the image as blob
      const response = await fetch(finalImage);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `my-poster-${Date.now()}.jpg`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback to simple download
      const link = document.createElement('a');
      link.href = finalImage;
      link.download = `my-poster-${Date.now()}.jpg`;
      link.click();
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>FaceSwap Poster Generator</h1>
        <p>Capture your photo with camera or upload, choose your gender, and create amazing posters!</p>
      </header>

      <div className="container">
        {/* Step 1: Capture or Upload Photo */}
        <div className="step">
          <h2>Step 1: Get Your Photo</h2>
          
          {/* Mode Selection */}
          <div className="photo-mode-selection">
            <button
              className={`mode-button ${cameraMode === 'camera' ? 'selected' : ''}`}
              onClick={switchToCamera}
            >
              📷 Use Camera
            </button>
            <button
              className={`mode-button ${cameraMode === 'upload' ? 'selected' : ''}`}
              onClick={switchToUpload}
            >
              📁 Upload File
            </button>
          </div>

          {/* Camera Mode */}
          {cameraMode === 'camera' && (
            <div className="camera-section">
              {!isCameraActive && !userImagePreview && (
                <div className="camera-start">
                  <button onClick={startCamera} className="camera-button">
                    📷 Start Camera
                  </button>
                  <p>Click to access your camera and take a photo</p>
                </div>
              )}
              
              {isCameraActive && (
                <div className="camera-active">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="camera-video"
                    style={{
                      width: '100%',
                      maxWidth: '400px',
                      height: 'auto',
                      backgroundColor: '#000',
                      borderRadius: '5px'
                    }}
                  />
                  <div className="camera-controls">
                    <button onClick={capturePhoto} className="capture-button">
                      📸 Capture Photo
                    </button>
                    <button onClick={stopCamera} className="stop-button">
                      ❌ Stop Camera
                    </button>
                  </div>
                </div>
              )}
              
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
          )}

          {/* Upload Mode */}
          {cameraMode === 'upload' && (
            <div className="upload-section">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="file-input"
              />
            </div>
          )}

          {/* Photo Preview */}
          {userImagePreview && (
            <div className="image-preview">
              <img src={userImagePreview} alt="Your captured or uploaded photo" />
              <p>Your Photo</p>
              <button onClick={resetProcess} className="retake-button">
                🔄 Take Another Photo
              </button>
            </div>
          )}
        </div>

        {/* Step 2: Select Gender */}
        {userImage && (
          <div className="step">
            <h2>Step 2: Select Your Gender</h2>
            <div className="gender-selection">
              <button
                className={`gender-button ${selectedGender === 'male' ? 'selected' : ''}`}
                onClick={() => setSelectedGender('male')}
              >
                👨 Male
              </button>
              <button
                className={`gender-button ${selectedGender === 'female' ? 'selected' : ''}`}
                onClick={() => setSelectedGender('female')}
              >
                👩 Female
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Select Poster Template */}
        {selectedGender && (
          <div className="step">
            <h2>Step 3: Choose Your Poster</h2>
            <p className="poster-count">
              {filteredPosters.length} {selectedGender} poster{filteredPosters.length !== 1 ? 's' : ''} available
            </p>
            <div className="poster-grid">
              {filteredPosters.map((poster, index) => (
                <div
                  key={index}
                  className={`poster-item ${selectedPoster?.name === poster.name ? 'selected' : ''}`}
                  onClick={() => setSelectedPoster(poster)}
                >
                  <img src={`http://localhost:5000${poster.path}`} alt={poster.name} />
                  <p>{poster.name}</p>
                  <div className="poster-info">
                    Target: {getTargetSide(poster.name)} side
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Process */}
        {selectedPoster && (
          <div className="step">
            <div className="process-summary">
              <h3>Ready to Create Your Poster!</h3>
              <div className="summary-grid">
                <div className="summary-item">
                  <strong>Photo:</strong> ✅ {cameraMode === 'camera' ? 'Captured' : 'Uploaded'}
                </div>
                <div className="summary-item">
                  <strong>Gender:</strong> {selectedGender === 'male' ? '👨 Male' : '👩 Female'}
                </div>
                <div className="summary-item">
                  <strong>Poster:</strong> {selectedPoster.name}
                </div>
                <div className="summary-item">
                  <strong>Face Position:</strong> {getTargetSide(selectedPoster.name)} side
                </div>
              </div>
            </div>
            <button
              className="process-button"
              onClick={handleStartProcess}
              disabled={processing}
            >
              {processing ? '🔄 Creating Your Poster...' : '✨ Create My Poster!'}
            </button>
          </div>
        )}

        {/* Step 5: Result */}
        {finalImage && (
          <div className="step result">
            <h2>🎉 Your Amazing Poster!</h2>
            <div className="final-image">
              <img src={finalImage} alt="Final poster with face swap" />
              <div className="result-actions">
                <button onClick={downloadPoster} className="download-button">
                  💾 Download Poster
                </button>
                <button onClick={resetProcess} className="reset-button">
                  🔄 Create Another
                </button>
              </div>
            </div>
          </div>
        )}

        {processing && (
          <div className="processing-overlay">
            <div className="processing-message">
              <div className="spinner"></div>
              <h3>Creating your poster...</h3>
              <p>AI is swapping your face onto the {getTargetSide(selectedPoster?.name || '')} side</p>
              <p>This may take a few moments</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
