'use client';

export default function HomePage() {
  return (
    <div className="w-full">
      {/* Section 1 */}
      <section 
        className="relative w-full bg-no-repeat bg-center"
        style={{
          backgroundImage: `url('/images/landing/backgrounds/section1.jpg')`,
          backgroundSize: 'cover',
          minHeight: '50vh',
          aspectRatio: 'auto',
        }}
      >
        {/* Mobile Background Override */}
        <div 
          className="absolute inset-0 block md:hidden bg-no-repeat bg-center"
          style={{
            backgroundImage: `url('/images/landing/backgrounds/mobile1.jpg')`,
            backgroundSize: '100% 100%',
          }}
        />
        
        {/* Content Container */}
        <div className="relative z-10 w-full h-full flex flex-col px-4 md:px-6 py-3 md:py-4">
          {/* Logo centered on mobile, left on desktop */}
          <div className="flex justify-center md:justify-start mb-2 relative z-20" style={{ marginLeft: '0px' }}>
            <button
              onClick={() => window.location.href = '/'}
              className="transition-all duration-200 hover:opacity-80"
            >
              <img 
                src="/images/landing/normalimages/parimatch.svg" 
                alt="Parimatch Logo" 
                className="h-12 md:h-16 lg:h-20"
              />
            </button>
          </div>
          
          {/* Two Column Layout */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-8 items-start max-w-6xl lg:max-w-7xl mx-auto w-full" style={{ marginTop: '-90px md:-100px' }}>
            {/* Left Column */}
            <div className="flex flex-col space-y-1 items-center justify-start h-full" style={{ marginTop: '-30px' }}>
              {/* Time to Shine Image - Responsive Size */}
              <div className="flex justify-center relative z-10" style={{ marginTop: '-20px' }}>
                <img 
                  src="/images/landing/normalimages/timetoshine.png" 
                  alt="Time to Shine" 
                  className="max-w-full h-auto max-h-80 md:max-h-96 lg:max-h-[28rem] object-contain"
                />
              </div>
              
              {/* Copy Text - Center aligned within column */}
              <div className="font-poppins text-white text-base md:text-lg lg:text-xl xl:text-2xl leading-relaxed text-center flex justify-center items-center relative z-0" style={{ marginTop: '-50px' }}>
                <div>
                  Get a <span className="italic font-bold" style={{ color: '#F8FF13' }}>unique poster</span> featuring <br />
                  YOU & the king of India's rap DIVINE & <br />
                  <span className="italic font-bold" style={{ color: '#F8FF13' }}>win limited-edition prizes</span>
                </div>
              </div>
              
              {/* Generate Button */}
              <div className="mt-4 md:mt-6 flex justify-center" style={{ marginTop: '35px' }}>
                <button 
                  onClick={() => window.location.href = '/generate'}
                  className="relative px-8 md:px-12 py-3 md:py-4 font-bold text-black text-lg md:text-xl uppercase tracking-wide transform -skew-x-12 transition-all duration-200 hover:scale-105"
                  style={{
                    background: '#F8FF13',
                    border: '0.5px solid transparent',
                    backgroundImage: 'linear-gradient(#F8FF13, #F8FF13), linear-gradient(45deg, #8F9093, #C0C4C8, #BDBDBD, #959FA7, #666666)',
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'padding-box, border-box',
                  }}
                >
                  <span className="block transform skew-x-12 font-inter italic">GENERATE</span>
                </button>
              </div>
            </div>
            
            {/* Right Column - DIVINE's Image */}
            <div className="flex justify-end items-start h-full -m-2 md:-m-4 overflow-visible" style={{ marginTop: '-120px md:-200px lg:-250px xl:-300px' }}>
              <img 
                src="/images/landing/normalimages/divine.png" 
                alt="DIVINE" 
                className="w-full h-auto max-h-[1100px] md:max-h-[1600px] lg:max-h-[1900px] xl:max-h-[2100px] object-contain"
              />
            </div>
          </div>
        </div>
        
        {/* Bottom Tint with Scroll Indicator */}
        <div 
          className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-center py-4 md:py-6 z-30"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, #000000 100%)',
            height: '120px',
          }}
        >
          <div className="text-white text-sm md:text-base font-medium mb-2 font-poppins">
            scroll down to see more
          </div>
          <div className="mb-2">
            <img 
              src="/images/icons/downward.png" 
              alt="Scroll down" 
              className="w-6 h-6 md:w-8 md:h-8"
            />
          </div>
        </div>
      </section>

      {/* Section 2 - Combined Section with section2.jpg Background */}
      <section 
        className="relative w-full bg-no-repeat bg-center"
        style={{
          backgroundImage: `url('/images/landing/backgrounds/section2.jpg')`,
          backgroundSize: 'cover',
          height: '210vh',
          aspectRatio: 'auto',
          zIndex: 2,
        }}
      >
        {/* Mobile Background Override */}
        <div 
          className="absolute inset-0 block md:hidden bg-no-repeat bg-center"
          style={{
            backgroundImage: `url('/images/landing/backgrounds/mobile2.jpg')`,
            backgroundSize: '100% 100%',
          }}
        />
        
        {/* Content Container */}
        <div className="relative z-10 w-full h-full flex flex-col items-center px-4 md:px-6 py-6 md:py-8 overflow-visible" style={{ position: 'relative' }}>
          
          {/* Main Headline */}
          <div className="text-center mb-3 md:mb-4 mt-16 md:mt-20">
            <h2 className="font-poppins text-white text-2xl md:text-3xl lg:text-3xl xl:text-4xl font-bold mb-2">
              Get Your Iconic Poster
            </h2>
            <h2 className="font-poppins text-2xl md:text-3xl lg:text-3xl xl:text-4xl font-bold" style={{ color: '#F8FF13' }}>
              in 3 Simple Steps
            </h2>
          </div>
          
          {/* Section 2 Start Image - Hidden on mobile, shown on desktop */}
          <div className="mb-6 md:mb-8 hidden md:block">
            <img 
              src="/images/landing/normalimages/section2startimage.png" 
              alt="Steps" 
              className="max-w-full h-auto max-h-64 md:max-h-80 lg:max-h-96 object-contain"
            />
          </div>
          
          {/* Mobile Steps Section - Hidden on desktop */}
          <div className="block md:hidden w-full mx-auto mb-12 px-4">
            {/* Step 1 */}
            <div className="flex flex-col items-center mb-12">
              <div className="mb-8 w-full flex justify-center">
                <img 
                  src="/images/mobile/Mask group.png" 
                  alt="Pick your Scene" 
                  className="object-contain mx-auto"
                  style={{ width: '320px', height: '320px' }}
                />
              </div>
              <div className="text-center">
                <p className="font-poppins text-2xl font-bold mb-2" style={{ color: '#F8FF13' }}>
                  Pick your Scene
                </p>
                <p className="font-poppins text-white text-lg">
                  from the given options
                </p>
              </div>
            </div>
            
            {/* Step 2 */}
            <div className="flex flex-col items-center mb-12">
              <div className="mb-8 w-full flex justify-center">
                <img 
                  src="/images/mobile/Mask group (1).png" 
                  alt="Click a Selfie" 
                  className="object-contain mx-auto"
                  style={{ width: '320px', height: '320px' }}
                />
              </div>
              <div className="text-center">
                <p className="font-poppins text-2xl font-bold mb-2" style={{ color: '#F8FF13' }}>
                  Click a Selfie
                </p>
                <p className="font-poppins text-white text-lg">
                  or upload your favorite pic
                </p>
              </div>
            </div>
            
            {/* Step 3 */}
            <div className="flex flex-col items-center mb-16">
              <div className="mb-8 w-full flex justify-center">
                <img 
                  src="/images/mobile/Mask group (2).png" 
                  alt="Download & Share" 
                  className="object-contain mx-auto"
                  style={{ width: '320px', height: '320px' }}
                />
              </div>
              <div className="text-center">
                <p className="font-poppins text-2xl font-bold mb-2" style={{ color: '#F8FF13' }}>
                  Download & Share
                </p>
                <p className="font-poppins text-white text-lg">
                  your poster for a chance to win <span className="italic font-bold" style={{ color: '#F8FF13' }}>exclusive prizes!</span>
                </p>
              </div>
            </div>
          </div>
          
          {/* Generate Now Button */}
          <div className="mb-8 md:mb-10" style={{ marginTop: '62px' }}>
            <button 
              onClick={() => window.location.href = '/generate'}
              className="relative px-8 md:px-12 py-3 md:py-4 font-normal text-black text-lg md:text-xl uppercase tracking-wide transform -skew-x-12 transition-all duration-200 hover:scale-105"
              style={{
                background: '#F8FF13',
                border: '0.5px solid transparent',
                backgroundImage: 'linear-gradient(#F8FF13, #F8FF13), linear-gradient(45deg, #8F9093, #C0C4C8, #BDBDBD, #959FA7, #666666)',
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box',
              }}
            >
              <span className="block transform skew-x-12 font-poppins italic">GENERATE NOW</span>
            </button>
          </div>
          
          {/* Share Your Poster Headline - Positioned 25px below GENERATE NOW button */}
          <div className="w-full text-center" style={{ marginTop: '25px', zIndex: 9998 }}>
            <h3 className="font-poppins text-white text-xl md:text-2xl lg:text-2xl xl:text-3xl font-bold leading-tight">
              Share Your Poster & Win<br />
              <span style={{ color: '#F8FF13' }}>Limited-Edition Merch from DIVINE x Parimatch!</span>
            </h3>
          </div>
          
          {/* Mobile Layout - Shirts and How It Works */}
          <div className="block md:hidden w-full max-w-sm mx-auto mb-8">
            {/* Shirts Image */}
            <div className="flex justify-center mb-6">
              <img 
                src="/images/landing/normalimages/shirts.png" 
                alt="Limited Edition Merch" 
                className="max-w-full h-auto object-contain"
              />
            </div>
            
            {/* How It Works - Center aligned title, left aligned content */}
            <div className="text-white font-poppins mb-6">
              <h4 className="text-xl font-bold mb-4 text-center" style={{ color: '#F8FF13' }}>
                HOW IT WORKS:
              </h4>
              
              <div className="space-y-3 text-sm text-left">
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-base" style={{ color: '#F8FF13' }}>1.</span>
                  <span>Upload poster to your Instagram feed</span>
                </div>
                
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-base" style={{ color: '#F8FF13' }}>2.</span>
                  <span>Use the hashtag <span className="font-bold">#DIVINExparimatch</span></span>
                </div>
                
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-base" style={{ color: '#F8FF13' }}>3.</span>
                  <span>Tag <span className="font-bold" style={{ color: '#F8FF13' }}>@playwithparimatch</span> in your post</span>
                </div>
              </div>
              
              <div className="mt-4 text-sm text-left">
                <p className="mb-2">
                  <span className="font-bold">Parimatch will select 3 lucky winners each week!</span>
                </p>
                <p>
                  Your name could be on that list—drop your poster and let fate decide!
                </p>
              </div>
            </div>
            
            {/* Campaign Date */}
            <div className="text-center mb-6">
              <p className="font-poppins text-white text-sm">
                Campaign runs until date: <span className="font-bold">2025</span>
              </p>
            </div>
          </div>
          
          {/* Desktop Layout - Two Column Grid - Shirts and How It Works - Absolute positioned to overlap section 3 */}
          <div className="absolute hidden md:grid w-full max-w-4xl lg:max-w-5xl mx-auto grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8 items-center" style={{ top: 'calc(65% + 55px)', left: '50%', transform: 'translateX(-50%)', zIndex: 10000 }}>
            
            {/* Left Column - Shirts Image (3/5 width) */}
            <div className="lg:col-span-3 flex justify-center relative" style={{ zIndex: 10001 }}>
              <img 
                src="/images/landing/normalimages/shirts.png" 
                alt="Limited Edition Merch" 
                className="max-w-full h-auto object-contain w-full"
                style={{ zIndex: 10002 }}
              />
            </div>
            
            {/* Right Column - How It Works (2/5 width) - Vertically centered with shirts */}
            <div className="lg:col-span-2 text-white font-poppins flex flex-col justify-center" style={{ zIndex: 10001 }}>
              <h4 className="text-xl md:text-2xl lg:text-2xl font-bold mb-3 md:mb-4" style={{ color: '#F8FF13' }}>
                HOW IT WORKS:
              </h4>
              
              <div className="space-y-2 md:space-y-3 text-sm md:text-base lg:text-base">
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-base md:text-lg" style={{ color: '#F8FF13' }}>1.</span>
                  <span>Upload poster to your Instagram feed</span>
                </div>
                
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-base md:text-lg" style={{ color: '#F8FF13' }}>2.</span>
                  <span>Use the hashtag <span className="font-bold">#DIVINExparimatch</span></span>
                </div>
                
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-base md:text-lg" style={{ color: '#F8FF13' }}>3.</span>
                  <span>Tag <span className="font-bold" style={{ color: '#F8FF13' }}>@playwithparimatch</span> in your post</span>
                </div>
              </div>
              
              <div className="mt-4 md:mt-6 text-sm md:text-base lg:text-base">
                <p className="mb-2">
                  <span className="font-bold">Parimatch will select 3 lucky winners each week!</span>
                </p>
                <p>
                  Your name could be on that list—drop your poster and let fate decide!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 - Gallery Section with section3.png Background */}
      <section 
        className="relative w-full bg-no-repeat bg-center"
        style={{
          backgroundImage: `url('/images/landing/backgrounds/section3.png')`,
          backgroundSize: '100% 100%',
          minHeight: '140vh',
          aspectRatio: 'auto',
          zIndex: 1,
        }}
      >
        {/* Mobile Background Override */}
        <div 
          className="absolute inset-0 block md:hidden bg-no-repeat bg-center"
          style={{
            backgroundImage: `url('/images/landing/backgrounds/mobile3.jpg')`,
            backgroundSize: '100% 100%',
            zIndex: 1,
          }}
        />
        
        {/* Gallery Content */}
        <div className="relative z-10 w-full h-full flex flex-col items-center px-4 md:px-6 py-12 md:py-16">
          
          {/* Gallery Title - with extra spacing from overflowing content */}
          <div className="text-center mb-8 md:mb-10 gallery-title-container" style={{ marginTop: '456px' }}>
            <h2 className="font-poppins text-white text-2xl md:text-3xl lg:text-4xl font-bold">
              GALLERY
            </h2>
          </div>
          
          <style jsx>{`
            @media (min-width: 768px) {
              .gallery-title-container {
                margin-top: 160px !important;
              }
            }
          `}</style>
          
          {/* 3-Column Poster Grid - Desktop Row, Mobile Carousel */}
          <div className="w-full max-w-5xl">
            {/* Desktop Layout */}
            <div className="hidden md:flex justify-center items-start">
              
              {/* Poster 1 - Millionaire In Da House */}
              <div className="text-center flex-1">
                <div className="mb-6">
                  <img 
                    src="/images/landing/normalimages/poster1.png" 
                    alt="Millionaire In Da House Poster" 
                    className="w-full h-auto max-h-72 md:max-h-80 lg:max-h-96 object-contain rounded-lg"
                  />
                </div>
                <h3 className="font-poppins text-white text-sm md:text-base lg:text-lg font-bold uppercase tracking-wide">
                  Millionaire In Da House
                </h3>
              </div>
              
              {/* Poster 2 - Bollywood Boss */}
              <div className="text-center flex-1">
                <div className="mb-6">
                  <img 
                    src="/images/landing/normalimages/poster2.png" 
                    alt="Bollywood Boss Poster" 
                    className="w-full h-auto max-h-72 md:max-h-80 lg:max-h-96 object-contain rounded-lg"
                  />
                </div>
                <h3 className="font-poppins text-white text-sm md:text-base lg:text-lg font-bold uppercase tracking-wide">
                  Bollywood Boss
                </h3>
              </div>
              
              {/* Poster 3 - Hip Hop Star */}
              <div className="text-center flex-1">
                <div className="mb-6">
                  <img 
                    src="/images/landing/normalimages/poster3.png" 
                    alt="Hip Hop Star Poster" 
                    className="w-full h-auto max-h-72 md:max-h-80 lg:max-h-96 object-contain rounded-lg"
                  />
                </div>
                <h3 className="font-poppins text-white text-sm md:text-base lg:text-lg font-bold uppercase tracking-wide">
                  Hip Hop Star
                </h3>
              </div>
              
            </div>
            
            {/* Mobile Carousel */}
            <div className="block md:hidden">
              <div className="relative">
                {/* Carousel Container */}
                <div className="overflow-hidden">
                  <div className="flex transition-transform duration-500 ease-in-out" id="mobile-carousel-track">
                    
                    {/* Poster 1 - Millionaire In Da House */}
                    <div className="min-w-full flex justify-center">
                      <div className="text-center">
                        <div className="mb-8">
                          <img 
                            src="/images/landing/normalimages/poster1.png" 
                            alt="Millionaire In Da House Poster" 
                            className="w-full h-auto object-contain rounded-lg"
                            style={{ maxHeight: '500px' }}
                          />
                        </div>
                        <h3 className="font-poppins text-white text-base font-bold uppercase tracking-wide">
                          Millionaire In Da House
                        </h3>
                      </div>
                    </div>
                    
                    {/* Poster 2 - Bollywood Boss */}
                    <div className="min-w-full flex justify-center">
                      <div className="text-center">
                        <div className="mb-8">
                          <img 
                            src="/images/landing/normalimages/poster2.png" 
                            alt="Bollywood Boss Poster" 
                            className="w-full h-auto object-contain rounded-lg"
                            style={{ maxHeight: '500px' }}
                          />
                        </div>
                        <h3 className="font-poppins text-white text-base font-bold uppercase tracking-wide">
                          Bollywood Boss
                        </h3>
                      </div>
                    </div>
                    
                    {/* Poster 3 - Hip Hop Star */}
                    <div className="min-w-full flex justify-center">
                      <div className="text-center">
                        <div className="mb-8">
                          <img 
                            src="/images/landing/normalimages/poster3.png" 
                            alt="Hip Hop Star Poster" 
                            className="w-full h-auto object-contain rounded-lg"
                            style={{ maxHeight: '500px' }}
                          />
                        </div>
                        <h3 className="font-poppins text-white text-base font-bold uppercase tracking-wide">
                          Hip Hop Star
                        </h3>
                      </div>
                    </div>
                    
                  </div>
                </div>
                
                {/* Mobile Carousel Navigation Dots */}
                <div className="flex justify-center mt-6 space-x-3">
                  <button 
                    className="mobile-carousel-dot w-3 h-3 rounded-full transition-colors duration-200" 
                    style={{ backgroundColor: '#F8FF13' }}
                    onClick={() => {
                      const track = document.getElementById('mobile-carousel-track') as HTMLElement;
                      const dots = document.querySelectorAll('.mobile-carousel-dot') as NodeListOf<HTMLElement>;
                      track.style.transform = 'translateX(0%)';
                      dots.forEach((dot, index) => {
                        dot.style.backgroundColor = index === 0 ? '#F8FF13' : '#5E5E5E';
                      });
                    }}
                  ></button>
                  <button 
                    className="mobile-carousel-dot w-3 h-3 rounded-full transition-colors duration-200" 
                    style={{ backgroundColor: '#5E5E5E' }}
                    onClick={() => {
                      const track = document.getElementById('mobile-carousel-track') as HTMLElement;
                      const dots = document.querySelectorAll('.mobile-carousel-dot') as NodeListOf<HTMLElement>;
                      track.style.transform = 'translateX(-100%)';
                      dots.forEach((dot, index) => {
                        dot.style.backgroundColor = index === 1 ? '#F8FF13' : '#5E5E5E';
                      });
                    }}
                  ></button>
                  <button 
                    className="mobile-carousel-dot w-3 h-3 rounded-full transition-colors duration-200" 
                    style={{ backgroundColor: '#5E5E5E' }}
                    onClick={() => {
                      const track = document.getElementById('mobile-carousel-track') as HTMLElement;
                      const dots = document.querySelectorAll('.mobile-carousel-dot') as NodeListOf<HTMLElement>;
                      track.style.transform = 'translateX(-200%)';
                      dots.forEach((dot, index) => {
                        dot.style.backgroundColor = index === 2 ? '#F8FF13' : '#5E5E5E';
                      });
                    }}
                  ></button>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </section>
    </div>
  );
}
