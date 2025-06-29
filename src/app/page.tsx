'use client';

export default function HomePage() {
  return (
    <div className="w-full bg-black">
      {/* Section 1 */}
      <section 
        className="relative w-full bg-no-repeat bg-center"
        style={{
          backgroundImage: `url('/images/landing/backgrounds/section1.jpg')`,
          backgroundSize: '100% 100%',
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
                className="h-12 md:h-16 lg:h-20 xl:h-24 2xl:h-28"
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
                  className="max-w-full h-auto max-h-80 md:max-h-96 lg:max-h-[28rem] xl:max-h-[32rem] 2xl:max-h-[36rem] object-contain"
                />
              </div>
              
              {/* Copy Text - Center aligned within column */}
              <div className="font-poppins text-white text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl leading-relaxed text-center flex justify-center items-center relative z-0" style={{ marginTop: '-50px' }}>
                <div>
                                  Get a <span className="italic font-bold" style={{ color: '#F8FF13' }}>unique poster</span> featuring <br />
                YOU & the king of India&apos;s rap DIVINE & <br />
                <span className="italic font-bold" style={{ color: '#F8FF13' }}>win limited-edition prizes</span>
                </div>
              </div>
              
              {/* Generate Button */}
              <div className="mt-4 md:mt-6 flex justify-center" style={{ marginTop: '35px' }}>
                <button 
                  onClick={() => window.location.href = '/generate'}
                  className="relative px-8 md:px-12 xl:px-16 2xl:px-20 py-3 md:py-4 xl:py-5 2xl:py-6 font-bold text-black text-2xl md:text-3xl xl:text-4xl 2xl:text-5xl uppercase tracking-wide transform -skew-x-12 transition-all duration-200 hover:scale-105 flex items-center justify-center"
                  style={{
                    background: '#F8FF13',
                    border: '3px solid transparent',
                    backgroundImage: 'linear-gradient(#F8FF13, #F8FF13), linear-gradient(45deg, #8F9093, #C0C4C8, #BDBDBD, #959FA7, #666666)',
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'padding-box, border-box',
                    borderRadius: '6.87px',
                  }}
                >
                  <span className="block transform skew-x-12 font-parimatch font-bold italic">GENERATE NOW</span>
                </button>
              </div>
            </div>
            
            {/* Right Column - DIVINE's Image */}
            <div className="flex justify-end items-start h-full -m-2 md:-m-4 overflow-visible" style={{ marginTop: '-120px md:-200px lg:-250px xl:-300px' }}>
              <img 
                src="/images/landing/normalimages/divine.png" 
                alt="DIVINE" 
                className="w-full h-auto max-h-[1100px] md:max-h-[1600px] lg:max-h-[1900px] xl:max-h-[2100px] 2xl:max-h-[2400px] object-contain"
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
          backgroundSize: '100% 100%',
          height: '240vh',
          aspectRatio: 'auto',
          zIndex: 2,
          marginBottom: '-200px',
        }}
      >
        {/* Mobile Background Override */}
        <div 
          className="absolute inset-0 block md:hidden bg-no-repeat bg-top"
          style={{
            backgroundImage: `url('/images/landing/backgrounds/mobile2.jpg')`,
            backgroundSize: '100% 100%',
          }}
        />
        
        {/* Content Container */}
        <div className="relative z-10 w-full h-full flex flex-col items-center px-4 md:px-6 py-6 md:py-8 overflow-visible" style={{ position: 'relative' }}>
          
          {/* Main Headline */}
          <div className="text-center mb-1 md:mb-2 mt-16 md:mt-20 xl:mt-24 2xl:mt-28">
            <h2 className="font-parimatch text-white text-3xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl uppercase mb-2">
              Get Your Iconic Poster
            </h2>
            <h2 className="font-parimatch text-3xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl uppercase" style={{ color: '#F8FF13' }}>
              in 3 Simple Steps
            </h2>
          </div>
          
          {/* Section 2 Start Image - Hidden on mobile, shown on desktop */}
          <div className="mb-6 md:mb-8 xl:mb-10 2xl:mb-12 hidden md:block relative" style={{ zIndex: 1, marginTop: '-10px' }}>
            <img 
              src="/images/landing/normalimages/section2startimage.png" 
              alt="Steps" 
              className="max-w-full h-auto max-h-64 md:max-h-80 lg:max-h-96 xl:max-h-[28rem] 2xl:max-h-[32rem] object-contain"
            />
          </div>
          
          {/* Mobile Steps Section - Hidden on desktop */}
          <div className="block md:hidden w-full mx-auto mb-12 px-4">
            {/* Step 1 */}
            <div className="flex flex-col items-center mb-8">
              <div className="mb-4 w-full flex justify-center">
                <img 
                  src="/images/mobile/Mask group.png" 
                  alt="Pick your Scene" 
                  className="object-contain mx-auto"
                  style={{ width: '320px', height: '320px' }}
                />
              </div>
              <div className="text-center">
                <p className="font-parimatch text-3xl font-normal mb-2" style={{ color: '#F8FF13' }}>
                  Pick your Scene
                </p>
                <p className="font-poppins text-white text-lg xl:text-xl 2xl:text-2xl">
                  from the given options
                </p>
              </div>
            </div>
            
            {/* Step 2 */}
            <div className="flex flex-col items-center mb-8">
              <div className="mb-4 w-full flex justify-center">
                <img 
                  src="/images/mobile/Mask group (1).png" 
                  alt="Click a Selfie" 
                  className="object-contain mx-auto"
                  style={{ width: '320px', height: '320px' }}
                />
              </div>
              <div className="text-center">
                <p className="font-parimatch text-3xl font-normal mb-2" style={{ color: '#F8FF13' }}>
                  Click a Selfie
                </p>
                <p className="font-poppins text-white text-lg xl:text-xl 2xl:text-2xl">
                  or upload your favorite pic
                </p>
              </div>
            </div>
            
            {/* Step 3 */}
            <div className="flex flex-col items-center mb-8">
              <div className="mb-4 w-full flex justify-center">
                <img 
                  src="/images/mobile/Mask group (2).png" 
                  alt="Download & Share" 
                  className="object-contain mx-auto"
                  style={{ width: '320px', height: '320px' }}
                />
              </div>
              <div className="text-center">
                <p className="font-parimatch text-3xl font-normal mb-2" style={{ color: '#F8FF13' }}>
                  Download & Share
                </p>
                <p className="font-poppins text-white text-lg xl:text-xl 2xl:text-2xl">
                  your poster for a chance to win <span className="italic font-bold" style={{ color: '#F8FF13' }}>exclusive prizes!</span>
                </p>
              </div>
            </div>
          </div>
          
          {/* Generate Now Button */}
          <div className="mb-8 md:mb-10 xl:mb-12 2xl:mb-16" style={{ marginTop: '8px' }}>
            <button 
              onClick={() => window.location.href = '/generate'}
              className="relative px-8 md:px-12 xl:px-16 2xl:px-20 py-3 md:py-4 xl:py-5 2xl:py-6 font-normal text-black text-2xl md:text-3xl xl:text-4xl 2xl:text-5xl uppercase tracking-wide transform -skew-x-12 transition-all duration-200 hover:scale-105 flex items-center justify-center"
              style={{
                background: '#F8FF13',
                border: '3px solid transparent',
                backgroundImage: 'linear-gradient(#F8FF13, #F8FF13), linear-gradient(45deg, #8F9093, #C0C4C8, #BDBDBD, #959FA7, #666666)',
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box',
                borderRadius: '6.87px',
              }}
            >
              <span className="block transform skew-x-12 font-parimatch font-bold italic">GENERATE NOW</span>
            </button>
          </div>
          
          {/* Share Your Poster Headline - Positioned with increased spacing below GENERATE NOW button */}
          <div className="w-full text-center" style={{ marginTop: '60px', zIndex: 9998 }}>
            <h3 className="font-parimatch text-white text-2xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl uppercase leading-tight">
              Share Your Poster & Win<br />
              <span style={{ color: '#F8FF13' }}>Limited-Edition Merch from DIVINE x Parimatch!</span>
            </h3>
          </div>
          

        </div>
      </section>

      {/* New Shirts Section - Black Background */}
      <section 
        className="relative w-full bg-black overflow-visible" 
        style={{ 
          zIndex: 4, 
          height: '40vh',
          minHeight: '300px'
        }}
      >
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-4 md:px-6 overflow-visible">
          
          {/* Mobile Layout - Shirts and How It Works */}
          <div className="block md:hidden w-full max-w-sm mx-auto">
            {/* Shirts Image */}
            <div className="flex justify-center mb-6">
              <img 
                src="/images/landing/normalimages/shirts.png" 
                alt="Limited Edition Merch" 
                className="max-w-full h-auto object-contain scale-115"
              />
            </div>
            
            {/* How It Works - Center aligned title, left aligned content */}
            <div className="text-white font-poppins mb-6">
              <h4 className="text-3xl xl:text-3xl 2xl:text-4xl mb-4 text-center font-parimatch" style={{ color: '#F8FF13' }}>
                HOW IT WORKS:
              </h4>
              
              <div className="space-y-3 text-base xl:text-lg 2xl:text-xl text-left">
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-lg xl:text-xl 2xl:text-2xl" style={{ color: '#F8FF13' }}>1.</span>
                  <span>Upload poster to your Instagram feed</span>
                </div>
                
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-lg xl:text-xl 2xl:text-2xl" style={{ color: '#F8FF13' }}>2.</span>
                  <span>Use the hashtag <span className="font-bold">#DIVINExparimatch</span></span>
                </div>
                
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-lg xl:text-xl 2xl:text-2xl" style={{ color: '#F8FF13' }}>3.</span>
                  <span>Tag <span className="font-bold" style={{ color: '#F8FF13' }}>@playwithparimatch</span> in your post</span>
                </div>
              </div>
              
              <div className="mt-4 text-base xl:text-lg 2xl:text-xl text-left">
                <p className="mb-2">
                  <span className="font-bold">Parimatch will select 3 lucky winners each week!</span>
                </p>
                <p>
                  Your name could be on that list—drop your poster and let fate decide!
                </p>
              </div>
            </div>
            
          </div>
          
          {/* Desktop Layout - Two Column Grid - Shirts and How It Works */}
          <div className="hidden md:grid w-full max-w-5xl lg:max-w-6xl mx-auto grid-cols-1 lg:grid-cols-5 gap-8 md:gap-10 items-center">
            
            {/* Left Column - Shirts Image (3/5 width) */}
            <div className="lg:col-span-3 flex justify-center relative">
              <img 
                src="/images/landing/normalimages/shirts.png" 
                alt="Limited Edition Merch" 
                className="max-w-full h-auto object-contain w-full scale-115"
              />
            </div>
            
            {/* Right Column - How It Works (2/5 width) - Vertically centered with shirts */}
            <div className="lg:col-span-2 text-white font-poppins flex flex-col justify-center">
              <h4 className="text-xl md:text-2xl lg:text-2xl xl:text-3xl 2xl:text-4xl mb-3 md:mb-4 xl:mb-5 2xl:mb-6 font-parimatch" style={{ color: '#F8FF13' }}>
                HOW IT WORKS:
              </h4>
              
              <div className="space-y-2 md:space-y-3 xl:space-y-4 2xl:space-y-5 text-sm md:text-base lg:text-base xl:text-lg 2xl:text-xl">
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-base md:text-lg xl:text-xl 2xl:text-2xl" style={{ color: '#F8FF13' }}>1.</span>
                  <span>Upload poster to your Instagram feed</span>
                </div>
                
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-base md:text-lg xl:text-xl 2xl:text-2xl" style={{ color: '#F8FF13' }}>2.</span>
                  <span>Use the hashtag <span className="font-bold">#DIVINExparimatch</span></span>
                </div>
                
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-base md:text-lg xl:text-xl 2xl:text-2xl" style={{ color: '#F8FF13' }}>3.</span>
                  <span>Tag <span className="font-bold italic" style={{ color: '#F8FF13', fontSize: '1.25em' }}>@playwithparimatch</span> in your post</span>
                </div>
              </div>
              
              <div className="mt-4 md:mt-6 xl:mt-8 2xl:mt-10 text-sm md:text-base lg:text-base xl:text-lg 2xl:text-xl">
                <p className="mb-2">
                  <span className="font-bold">Parimatch will select <span className="font-bold italic" style={{ color: '#F8FF13', fontSize: '1.25em' }}>3 lucky winners</span> each week!</span>
                </p>
                <p>
                  Your name could be on that list—drop your poster and let fate decide!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 - Gallery Section with section3.jpg Background */}
      <section 
        className="relative w-full bg-no-repeat bg-top"
        style={{
          backgroundImage: `url('/images/landing/backgrounds/section3.jpg')`,
          backgroundSize: '100% 100%',
          minHeight: '140vh',
          aspectRatio: 'auto',
          zIndex: 3,
        }}
      >
        {/* Mobile Background Override */}
        <div 
          className="absolute inset-0 block md:hidden bg-no-repeat bg-top"
          style={{
            backgroundImage: `url('/images/landing/backgrounds/mobile3.jpg')`,
            backgroundSize: '100% 100%',
            zIndex: 1,
          }}
        />
        
        {/* Gallery Content */}
        <div className="relative z-10 w-full h-full flex flex-col items-center px-4 md:px-6 py-12 md:py-16">
          
          {/* Gallery Title - with spacing adjusted for overlapping content */}
          <div className="text-center mb-8 md:mb-10 xl:mb-12 2xl:mb-16 gallery-title-container mt-60 md:mt-42 lg:mt-48 xl:mt-52">
            <h2 className="font-parimatch text-white text-3xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl">
              GALLERY
            </h2>
          </div>
          
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
                <h3 className="font-parimatch text-white text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl uppercase tracking-wide">
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
                <h3 className="font-parimatch text-white text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl uppercase tracking-wide">
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
                <h3 className="font-parimatch text-white text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl uppercase tracking-wide">
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
                        <h3 className="font-parimatch text-white text-lg xl:text-lg 2xl:text-xl uppercase tracking-wide">
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
                        <h3 className="font-parimatch text-white text-lg xl:text-lg 2xl:text-xl uppercase tracking-wide">
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
                        <h3 className="font-parimatch text-white text-lg xl:text-lg 2xl:text-xl uppercase tracking-wide">
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
