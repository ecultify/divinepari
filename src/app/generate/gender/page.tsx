'use client';
import { useState, useEffect } from 'react';
import { generateSessionId, trackUserSession, trackUserStep } from '../../../lib/supabase';

export default function GenderSelectionPage() {
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | null>(null);
  const [sessionId, setSessionId] = useState<string>('');

  // Initialize session when component mounts
  useEffect(() => {
    const initSession = async () => {
      let currentSessionId = localStorage.getItem('sessionId');
      
      if (!currentSessionId) {
        currentSessionId = generateSessionId();
        localStorage.setItem('sessionId', currentSessionId);
        await trackUserSession(currentSessionId);
      }
      
      setSessionId(currentSessionId);
      
      // Track that user reached gender selection
      await trackUserStep(currentSessionId, 'gender_selection', {
        page: 'gender_selection',
        timestamp: new Date().toISOString()
      });
    };
    
    initSession();
  }, []);

  const handleGenderSelect = async (gender: 'male' | 'female') => {
    setSelectedGender(gender);
    
    // Track gender selection
    if (sessionId) {
      await trackUserStep(sessionId, 'gender_selection', {
        selected_gender: gender,
        action: 'gender_selected',
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleContinue = async () => {
    if (selectedGender && sessionId) {
      console.log('Selected gender:', selectedGender);
      
      // Track final gender submission
      await trackUserStep(sessionId, 'gender_selection', {
        selected_gender: selectedGender,
        action: 'submit_gender',
        next_page: 'poster_selection',
        timestamp: new Date().toISOString()
      });
      
      // Store in localStorage for next page
      localStorage.setItem('selectedGender', selectedGender);
      
      // Navigate to poster selection page with gender parameter
      window.location.href = `/generate/poster?gender=${selectedGender}`;
    }
  };

  return (
    <div className="w-full">
      {/* Gender Selection Page */}
      <section 
        className="relative w-full bg-no-repeat bg-top min-h-screen"
        style={{
          backgroundImage: `url('/images/secondpage/Desktop.png')`,
          backgroundSize: '100% 100%',
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
          <div className="flex justify-center items-center flex-1">
            <div 
              className="w-full max-w-4xl md:max-w-2xl px-8 md:px-12 py-12 md:py-8 rounded-lg relative"
              style={{
                border: '2px solid transparent',
                backgroundImage: 'linear-gradient(#111112, #111112), linear-gradient(45deg, #8F9093, #C0C4C8, #BDBDBD, #959FA7, #666666)',
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box',
              }}
            >
              {/* Back Button */}
              <button
                onClick={() => window.location.href = '/generate'}
                className="absolute top-4 left-4 transition-all duration-200 hover:opacity-75"
              >
                <img src="/images/icons/backbutton.png" alt="Back" className="w-8 h-8" />
              </button>

              <h2 className="text-white text-lg md:text-xl font-medium text-center mb-8 md:mb-6 font-poppins mt-16 md:mt-0">
                Select your gender
              </h2>
              
              {/* Gender Selection Buttons */}
              <div className="flex flex-col items-center space-y-8 md:space-y-6 mt-16 md:mt-12">
                {/* Male Button */}
                <button
                  onClick={() => handleGenderSelect('male')}
                  className="w-64 md:w-80 h-20 flex items-center justify-center space-x-4 font-normal text-3xl md:text-4xl uppercase tracking-wide transition-all duration-200 hover:scale-105 font-poppins"
                  style={{
                    background: selectedGender === 'male' ? 'rgba(248, 255, 19, 0.14)' : '#4A4A4A',
                    border: selectedGender === 'male' ? '2px solid #F8FF13' : '2px solid transparent',
                    color: selectedGender === 'male' ? '#F8FF13' : 'black',
                    borderRadius: '5px',
                  }}
                >
                  <span className="flex items-center space-x-3">
                    <span className="text-4xl md:text-5xl">♂</span>
                    <span>MALE</span>
                  </span>
                </button>

                {/* Female Button */}
                <button
                  onClick={() => handleGenderSelect('female')}
                  className="w-64 md:w-80 h-20 flex items-center justify-center space-x-4 font-normal text-3xl md:text-4xl uppercase tracking-wide transition-all duration-200 hover:scale-105 font-poppins"
                  style={{
                    background: selectedGender === 'female' ? 'rgba(248, 255, 19, 0.14)' : '#4A4A4A',
                    border: selectedGender === 'female' ? '2px solid #F8FF13' : '2px solid transparent',
                    color: selectedGender === 'female' ? '#F8FF13' : 'black',
                    borderRadius: '5px',
                  }}
                >
                  <span className="flex items-center space-x-3">
                    <span className="text-4xl md:text-5xl">♀</span>
                    <span>FEMALE</span>
                  </span>
                </button>
              </div>

              {/* Submit Button */}
              <div className="mt-16 md:mt-12 flex justify-center">
                <button 
                  onClick={handleContinue}
                  disabled={!selectedGender}
                  className="font-normal text-lg md:text-xl xl:text-2xl 2xl:text-3xl uppercase tracking-wide transform -skew-x-12 transition-all duration-200 font-poppins"
                  style={{
                    background: selectedGender ? '#F8FF13' : '#585858',
                    color: selectedGender ? 'black' : 'black',
                    border: selectedGender ? '0.5px solid transparent' : 'none',
                    backgroundImage: selectedGender 
                      ? 'linear-gradient(#F8FF13, #F8FF13), linear-gradient(45deg, #8F9093, #C0C4C8, #BDBDBD, #959FA7, #666666)'
                      : 'none',
                    backgroundOrigin: selectedGender ? 'border-box' : 'initial',
                    backgroundClip: selectedGender ? 'padding-box, border-box' : 'initial',
                    cursor: selectedGender ? 'pointer' : 'not-allowed',
                    opacity: selectedGender ? 1 : 0.7,
                    width: '263px',
                    height: '63px',
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