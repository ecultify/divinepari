'use client';
import { useState } from 'react';

export default function GenderSelectionPage() {
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | null>(null);

  const handleGenderSelect = (gender: 'male' | 'female') => {
    setSelectedGender(gender);
  };

  const handleContinue = () => {
    if (selectedGender) {
      console.log('Selected gender:', selectedGender);
      // Navigate to poster selection page with gender parameter
      window.location.href = `/generate/poster?gender=${selectedGender}`;
    }
  };

  return (
    <div className="w-full">
      {/* Gender Selection Page */}
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
        
        {/* Content Container */}
        <div className="relative z-10 w-full h-full flex flex-col px-4 md:px-6 py-6">
          {/* Logo - Moved 50px right on desktop, centered on mobile */}
          <div className="flex justify-center md:justify-start mb-8" style={{ marginLeft: '50px' }}>
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
          
          {/* Step Progress Indicator - Larger with more gap on desktop */}
          <div className="flex justify-center mb-4 md:mb-12">
            <div className="flex items-center">
              {[1, 2, 3, 4].map((step, index) => (
                <div key={step} className="flex items-center">
                  <div 
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 flex items-center justify-center font-bold font-poppins text-sm md:text-base"
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
                      <div className="w-2 md:w-4"></div>
                      <div className="w-8 md:w-16 h-0.5 bg-white"></div>
                      <div className="w-2 md:w-4"></div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Form Container */}
          <div className="flex justify-center items-center flex-1">
            <div 
              className="w-full max-w-4xl px-8 md:px-16 py-12 rounded-lg relative"
              style={{
                border: '2px solid transparent',
                backgroundImage: 'linear-gradient(#111112, #111112), linear-gradient(45deg, #8F9093, #C0C4C8, #BDBDBD, #959FA7, #666666)',
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box',
              }}
            >
              {/* Back Button */}
              <button
                onClick={() => window.history.back()}
                className="absolute top-4 left-4 transition-all duration-200 hover:opacity-75"
              >
                <img src="/images/icons/backbutton.png" alt="Back" className="w-8 h-8" />
              </button>

              <h2 className="text-white text-lg md:text-xl font-medium text-center mb-8 font-poppins mt-16">
                Select your gender
              </h2>
              
              {/* Gender Selection Buttons */}
              <div className="flex flex-col items-center space-y-8 mt-16">
                {/* Male Button */}
                <button
                  onClick={() => handleGenderSelect('male')}
                  className="w-64 md:w-80 h-20 flex items-center justify-center space-x-4 font-bold text-2xl uppercase tracking-wide transition-all duration-200 hover:scale-105 font-poppins"
                  style={{
                    background: selectedGender === 'male' ? 'rgba(248, 255, 19, 0.14)' : '#4A4A4A',
                    border: selectedGender === 'male' ? '2px solid #F8FF13' : '2px solid transparent',
                    color: selectedGender === 'male' ? '#F8FF13' : 'black',
                    borderRadius: '5px',
                  }}
                >
                  <span className="flex items-center space-x-3">
                    <span className="text-3xl">♂</span>
                    <span>MALE</span>
                  </span>
                </button>

                {/* Female Button */}
                <button
                  onClick={() => handleGenderSelect('female')}
                  className="w-64 md:w-80 h-20 flex items-center justify-center space-x-4 font-bold text-2xl uppercase tracking-wide transition-all duration-200 hover:scale-105 font-poppins"
                  style={{
                    background: selectedGender === 'female' ? 'rgba(248, 255, 19, 0.14)' : '#4A4A4A',
                    border: selectedGender === 'female' ? '2px solid #F8FF13' : '2px solid transparent',
                    color: selectedGender === 'female' ? '#F8FF13' : 'black',
                    borderRadius: '5px',
                  }}
                >
                  <span className="flex items-center space-x-3">
                    <span className="text-3xl">♀</span>
                    <span>FEMALE</span>
                  </span>
                </button>
              </div>

              {/* Submit Button */}
              <div className="mt-16 flex justify-center">
                <button 
                  onClick={handleContinue}
                  disabled={!selectedGender}
                  className="px-16 py-3 font-bold text-lg uppercase tracking-wide transform -skew-x-12 transition-all duration-200"
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
                  }}
                >
                  <span className="block transform skew-x-12">SUBMIT</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 