'use client';
import { useState } from 'react';

export default function GeneratePage() {
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Navigate to gender selection page
    window.location.href = '/generate/gender';
  };

  return (
    <div className="w-full">
      {/* Generate Page */}
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
                      borderColor: step === 1 ? '#F8FF13' : 'white',
                      backgroundColor: step === 1 ? '#F8FF13' : 'transparent',
                      color: step === 1 ? 'black' : 'white',
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
          <div className="flex justify-center items-center flex-1 px-4 md:px-0">
            <div 
              className="w-full max-w-none md:max-w-2xl px-6 md:px-12 py-6 rounded-lg relative"
              style={{
                border: '2px solid transparent',
                backgroundImage: 'linear-gradient(#111112, #111112), linear-gradient(45deg, #8F9093, #C0C4C8, #BDBDBD, #959FA7, #666666)',
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box',
              }}
            >
              {/* Back Button - Hidden on mobile */}
              <button
                onClick={() => window.location.href = '/'}
                className="absolute top-4 left-4 transition-all duration-200 hover:opacity-75 hidden md:block"
              >
                <img src="/images/icons/backbutton.png" alt="Back" className="w-8 h-8" />
              </button>

              <h2 className="text-white text-lg md:text-lg lg:text-xl font-medium text-center mb-8 font-poppins">
                Enter your details to create your star-studded photo
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6 flex flex-col items-center">
                {/* Name Input */}
                <div className="w-full md:w-3/4 px-2 md:px-0">
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
                <div className="w-full md:w-3/4 px-2 md:px-0">
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
                <p className="text-gray-400 text-base md:text-xs text-center font-poppins px-2 md:px-0">
                  *Upon generation, your poster will be sent to the email address you provide. Please enter a valid email.
                </p>
                
                {/* Submit Button */}
                <div className="pt-4 w-full md:w-3/4 px-2 md:px-0">
                  <button 
                    type="submit"
                    className="w-full py-3 font-bold text-black text-lg uppercase tracking-wide transform -skew-x-12 transition-all duration-200 hover:scale-105"
                    style={{
                      background: '#F8FF13',
                      border: '0.5px solid transparent',
                      backgroundImage: 'linear-gradient(#F8FF13, #F8FF13), linear-gradient(45deg, #8F9093, #C0C4C8, #BDBDBD, #959FA7, #666666)',
                      backgroundOrigin: 'border-box',
                      backgroundClip: 'padding-box, border-box',
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
    </div>
  );
} 