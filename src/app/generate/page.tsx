'use client';
import { useState, useEffect } from 'react';

export default function GeneratePage() {
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);

  // Check if user was redirected due to session timeout
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('timeout') === 'true') {
      setShowTimeoutModal(true);
      window.history.replaceState({}, '', '/generate/');
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!consentChecked) {
      alert('Please agree to the terms and conditions to continue.');
      return;
    }
    
    console.log('Form submitted:', formData);
    
    try {
      // Check if returning user with previous posters
      const response = await fetch(`/api/check-returning-user.php?email=${encodeURIComponent(formData.email)}`);
      const userData = await response.json();
      
      if (userData.success && userData.hasPosters) {
        // Returning user - redirect to result page with existing poster
        localStorage.setItem('userName', formData.name);
        localStorage.setItem('userEmail', formData.email);
        localStorage.setItem('existingPosterUrl', userData.latestPoster.posterUrl);
        localStorage.setItem('sessionId', userData.latestPoster.sessionId);
        localStorage.setItem('selectedGender', userData.latestPoster.gender);
        localStorage.setItem('selectedPoster', userData.latestPoster.posterType);
        
        // Redirect to result page with existing poster
        window.location.href = '/generate/result?mode=existing';
      } else {
        // New user - continue normal flow
        localStorage.setItem('userName', formData.name);
        localStorage.setItem('userEmail', formData.email);
        
        // Generate session ID if not exists
        if (!localStorage.getItem('sessionId')) {
          const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          localStorage.setItem('sessionId', sessionId);
        }
        
        // Navigate to gender selection page
        window.location.href = '/generate/gender';
      }
    } catch (error) {
      console.error('Error checking returning user:', error);
      
      // On error, continue with normal flow
      localStorage.setItem('userName', formData.name);
      localStorage.setItem('userEmail', formData.email);
      
      if (!localStorage.getItem('sessionId')) {
        const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('sessionId', sessionId);
      }
      
      window.location.href = '/generate/gender';
    }
  };

  return (
    <div className="w-full">
      {/* Session Timeout Modal */}
      {showTimeoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"></div>
          <div className="relative bg-white rounded-lg shadow-xl max-w-md mx-4 p-6 z-10">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Session Timed Out</h3>
              <p className="text-gray-600 mb-6">
                Your session expired after 5 minutes of inactivity for security reasons. Please start over.
              </p>
              <button
                onClick={() => setShowTimeoutModal(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Continue
              </button>
              <p className="text-xs text-gray-400 mt-4">
                Sessions expire automatically for your security.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Generate Page */}
      <section 
        className="relative w-full bg-no-repeat bg-top min-h-screen"
        style={{
          backgroundImage: `url('/images/secondpage/Desktop.avif')`,
          backgroundSize: '100% 100%',
        }}
      >
        {/* Mobile Background Override */}
        <div 
          className="absolute inset-0 block md:hidden bg-no-repeat bg-center"
          style={{
            backgroundImage: `url('/images/mobile/mobile.avif')`,
            backgroundSize: 'cover',
          }}
        />
        
        {/* Content Container */}
        <div className="relative z-10 w-full h-full flex flex-col px-4 md:px-6 py-6">
          {/* Logo - Centered on mobile, original position on desktop */}
          <div className="flex justify-center md:justify-start mb-8">
            <div className="md:ml-10">
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
                      borderColor: step === 1 ? '#F8FF13' : 'white',
                      backgroundColor: step === 1 ? '#F8FF13' : 'transparent',
                      color: step === 1 ? 'black' : 'white',
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
              className="w-full px-6 md:px-8 py-6 rounded-lg relative"
              style={{
                border: '2px solid transparent',
                backgroundImage: 'linear-gradient(#111112, #111112), linear-gradient(45deg, #8F9093, #C0C4C8, #BDBDBD, #959FA7, #666666)',
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box',
                maxWidth: '768px',
              }}
            >


              <h2 className="text-white text-lg md:text-xl font-medium text-center mb-2 md:mb-8 font-poppins">
                Enter your details to create your <br />star-studded photo
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6 flex flex-col items-center">
                {/* Name Input */}
                <div className="w-full md:w-2/3 px-2 md:px-0">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 rounded-md outline-none text-white placeholder-gray-400 font-poppins text-lg md:text-sm"
                    style={{
                      background: 'linear-gradient(180deg, rgba(40,40,40,0.9) 0%, rgba(20,20,20,0.9) 100%)',
                      backdropFilter: 'blur(10px)',
                      border: '0.5px solid white',
                    }}
                    required
                  />
                </div>
                
                {/* Email Input */}
                <div className="w-full md:w-2/3 px-2 md:px-0">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your Email*"
                    className="w-full px-4 py-3 rounded-md outline-none text-white placeholder-gray-400 font-poppins text-lg md:text-sm"
                    style={{
                      background: 'linear-gradient(180deg, rgba(40,40,40,0.9) 0%, rgba(20,20,20,0.9) 100%)',
                      backdropFilter: 'blur(10px)',
                      border: '0.5px solid white',
                    }}
                    required
                  />
                </div>
                
                {/* Disclaimer Text */}
                <div className="w-full md:w-2/3 px-2 md:px-0">
                  <p className="text-gray-400 text-base md:text-xs text-center font-poppins">
                    *Upon generation, your poster will be sent to the email address you provide. Please enter a valid email.
                  </p>
                </div>

                {/* Consent Checkbox */}
                <div className="w-full md:w-2/3 px-2 md:px-0 flex items-center justify-center space-x-3">
                  <input
                    type="checkbox"
                    id="consent"
                    checked={consentChecked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setShowConsentModal(true);
                      } else {
                        setConsentChecked(false);
                      }
                    }}
                    className="w-5 h-5 rounded border-2 bg-transparent appearance-none relative cursor-pointer"
                    style={{
                      borderColor: '#F8FF13',
                      backgroundColor: consentChecked ? '#F8FF13' : 'transparent',
                      backgroundImage: consentChecked ? `url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='black' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='m13.854 3.646-7.5 7.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6 10.293l7.146-7.147a.5.5 0 0 1 .708.708z'/%3e%3c/svg%3e")` : 'none'
                    }}
                  />
                  <label 
                    htmlFor="consent" 
                    className="text-white font-poppins text-sm cursor-pointer"
                    style={{ color: 'white' }}
                    onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#F8FF13'}
                    onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'white'}
                    onClick={() => setShowConsentModal(true)}
                  >
                    I agree to terms and conditions
                  </label>
                </div>
                
                {/* Submit Button */}
                <div className="pt-4 w-full flex justify-center px-2 md:px-0">
                  <button 
                    type="submit"
                    className="font-normal text-black text-lg md:text-xl xl:text-2xl 2xl:text-3xl uppercase tracking-wide transform -skew-x-12 transition-all duration-200 hover:scale-105 font-poppins"
                    style={{
                      background: '#F8FF13',
                      border: '0.5px solid transparent',
                      backgroundImage: 'linear-gradient(#F8FF13, #F8FF13), linear-gradient(45deg, #8F9093, #C0C4C8, #BDBDBD, #959FA7, #666666)',
                      backgroundOrigin: 'border-box',
                      backgroundClip: 'padding-box, border-box',
                      width: '263px',
                      height: '63px',
                    }}
                  >
                    <span className="block transform skew-x-12">SUBMIT</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Consent Modal */}
      {showConsentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div 
            className="relative rounded-lg p-8 w-96 md:w-auto max-w-2xl max-h-[90vh] overflow-y-auto"
            style={{ 
              backgroundColor: '#111112',
              border: '2px solid #F8FF13'
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setShowConsentModal(false)}
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
                Terms and Conditions
              </h3>

              {/* Consent Text */}
              <div className="text-white font-poppins text-sm leading-relaxed max-w-lg">
                <p className="mb-4">
                  By checking this box, you acknowledge and agree to the following:
                </p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li>You grant Parimatch the right to use, process, and store the uploaded image(s) for the purpose of generating personalized content.</li>
                  <li>You confirm that you have the right to use and share the uploaded image(s).</li>
                  <li>You understand that the uploaded image(s) may be used in promotional materials, marketing campaigns, and other commercial purposes by Parimatch.</li>
                  <li>You agree that Parimatch may retain the uploaded image(s) for a reasonable period as required for business operations.</li>
                  <li>You waive any claims against Parimatch regarding the use of your image(s) as described above.</li>
                </ul>
                <p className="text-xs text-gray-400">
                  By proceeding, you acknowledge that you have read, understood, and agree to these terms and conditions.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
                {/* Accept Button (Mobile - Top) */}
                <button
                  onClick={() => {
                    setConsentChecked(true);
                    setShowConsentModal(false);
                  }}
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
                  <span className="block transform skew-x-12 font-parimatch font-bold text-black text-3xl">ACCEPT</span>
                </button>

                {/* Decline Button (Mobile - Bottom) */}
                <button
                  onClick={() => {
                    setConsentChecked(false);
                    setShowConsentModal(false);
                  }}
                  className="relative transform -skew-x-12 transition-all duration-200 hover:scale-105 flex items-center justify-center lg:hidden"
                  style={{
                    background: '#585858',
                    border: '3px solid transparent',
                    backgroundImage: 'linear-gradient(#585858, #585858), linear-gradient(45deg, #8F9093, #C0C4C8, #BDBDBD, #959FA7, #666666)',
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'padding-box, border-box',
                    borderRadius: '3.29px',
                    padding: '16px 48px',
                  }}
                >
                  <span className="block transform skew-x-12 font-parimatch font-bold text-white text-3xl">DECLINE</span>
                </button>
                
                {/* Desktop Decline Button */}
                <button
                  onClick={() => {
                    setConsentChecked(false);
                    setShowConsentModal(false);
                  }}
                  className="hidden lg:flex relative transform -skew-x-12 transition-all duration-200 hover:scale-105 items-center justify-center"
                  style={{
                    background: '#585858',
                    border: '3px solid transparent',
                    backgroundImage: 'linear-gradient(#585858, #585858), linear-gradient(45deg, #8F9093, #C0C4C8, #BDBDBD, #959FA7, #666666)',
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'padding-box, border-box',
                    borderRadius: '3.29px',
                    width: '263px',
                    height: '63px',
                  }}
                >
                  <span className="block transform skew-x-12 font-parimatch font-bold text-white w-32 h-22 flex items-center justify-center text-3xl">
                    DECLINE
                  </span>
                </button>
                
                {/* Desktop Accept Button */}
                <button
                  onClick={() => {
                    setConsentChecked(true);
                    setShowConsentModal(false);
                  }}
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
                    ACCEPT
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