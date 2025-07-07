'use client';

export default function TermsPage() {
  return (
    <div className="w-full min-h-screen bg-black text-white">
      {/* Header with Logo */}
      <div className="w-full px-4 md:px-6 py-4">
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

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Main Title */}
        <h1 className="font-parimatch text-3xl md:text-4xl lg:text-5xl mb-8 md:mb-12" style={{ color: '#F8FF13' }}>
          Terms & Conditions
        </h1>

        {/* Intro Paragraph */}
        <p className="font-poppins text-base md:text-lg mb-8 leading-relaxed">
          I, the Participant, hereby agree to the following terms and conditions to participate in the &ldquo;Pose with Divine&rdquo; AI Poster Campaign, promoted, organized, and managed through the platform www.posewithdivine.com (&ldquo;the Platform&rdquo;).
        </p>

        {/* Terms Sections */}
        <div className="space-y-8">
          {/* Section 1 */}
          <div>
            <h2 className="font-parimatch text-xl md:text-2xl mb-4" style={{ color: '#F8FF13' }}>
              1. Eligibility
            </h2>
            <p className="font-poppins text-base md:text-lg leading-relaxed">
              This campaign is open to all individuals aged 18 years and above residing in India. Each participant must upload a valid selfie to generate their personalized AI poster. By participating, users confirm they are the rightful owner of the uploaded image or have permission from the person featured.
            </p>
          </div>

          {/* Section 2 */}
          <div>
            <h2 className="font-parimatch text-xl md:text-2xl mb-4" style={{ color: '#F8FF13' }}>
              2. Campaign Description
            </h2>
            <p className="font-poppins text-base md:text-lg leading-relaxed">
              Participants can generate an AI-powered, personalized digital poster featuring a pre-designed template with the artist Divine. The platform uses AI tools to integrate the user&rsquo;s selfie into a stylized poster. Users are encouraged to share the output on social media as part of the campaign&rsquo;s user-generated content (UGC) push.
            </p>
          </div>

          {/* Section 3 */}
          <div>
            <h2 className="font-parimatch text-xl md:text-2xl mb-4" style={{ color: '#F8FF13' }}>
              3. Consent and Permissions
            </h2>
            <div className="font-poppins text-base md:text-lg leading-relaxed space-y-4">
              <p>
                By participating, you grant www.posewithdivine.com the non-exclusive, worldwide, royalty-free, irrevocable license to use your uploaded image and generated poster for marketing, publicity, and promotional purposes, without the requirement of further consent or compensation.
              </p>
              <p>
                You also consent to the use of your data (including your image and device/browser information) strictly for the purpose of this campaign, in accordance with applicable data protection laws.
              </p>
              <p>
                In addition, you expressly authorize the use of your data and generated content for the purposes of training and improving AI systems, including large-scale machine learning models. This includes the storage and use of input materials (such as uploaded images or text), output data (such as generated posters), and associated metadata for the duration of copyright protection, as defined under the Indian Copyright Act.
              </p>
              <p className="font-semibold">
                This consent is irrevocable and shall remain in effect permanently.
              </p>
            </div>
          </div>

          {/* Section 4 */}
          <div>
            <h2 className="font-parimatch text-xl md:text-2xl mb-4" style={{ color: '#F8FF13' }}>
              4. Ownership and Intellectual Property Rights
            </h2>
            <div className="font-poppins text-base md:text-lg leading-relaxed space-y-4">
              <p>
                All AI-generated posters and template designs remain the intellectual property of www.posewithdivine.com. Participants are permitted to download and share their posters for personal use and social media sharing related to the campaign.
              </p>
              <p>
                Commercial use or reproduction outside of the campaign context is prohibited without express written permission from the platform.
              </p>
              <p>
                Furthermore, any alteration, transformation, or creation of derivative works based on the generated poster is forbidden without the Platform&rsquo;s explicit prior consent.
              </p>
            </div>
          </div>

          {/* Section 5 */}
          <div>
            <h2 className="font-parimatch text-xl md:text-2xl mb-4" style={{ color: '#F8FF13' }}>
              5. Poster Visibility and Sharing
            </h2>
            <p className="font-poppins text-base md:text-lg leading-relaxed">
              Select user-generated posters may be featured on the campaign&rsquo;s microsite, associated social media handles, or promotional materials at the sole discretion of the campaign organizers. Inclusion in such promotions is not guaranteed and may be subject to design or quality adjustments. Posts may be accompanied by text or not, and may also be used in audiovisual content or other related media formats.
            </p>
          </div>

          {/* Section 6 */}
          <div>
            <h2 className="font-parimatch text-xl md:text-2xl mb-4" style={{ color: '#F8FF13' }}>
              6. Restrictions
            </h2>
            <div className="font-poppins text-base md:text-lg leading-relaxed">
              <p className="mb-4">Participants must not upload:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Inappropriate, offensive, or misleading content.</li>
                <li>Third-party trademarks or copyrighted materials.</li>
                <li>Selfies of celebrities, public figures, or other individuals without consent.</li>
                <li>Selfies of minors and persons with limited legal capacity.</li>
              </ul>
              <p className="mt-4">
                Any violation will result in immediate disqualification from the campaign and removal of any generated content.
              </p>
            </div>
          </div>

          {/* Section 7 */}
          <div>
            <h2 className="font-parimatch text-xl md:text-2xl mb-4" style={{ color: '#F8FF13' }}>
              7. Limitation of Liability
            </h2>
            <div className="font-poppins text-base md:text-lg leading-relaxed space-y-4">
              <p>
                www.posewithdivine.com provides the campaign &ldquo;as is&rdquo; and does not guarantee uninterrupted access or flawless output.
              </p>
              <p>The platform is not liable for:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Technical issues, delays, or data loss.</li>
                <li>Any misuse or unauthorized use of the generated images.</li>
                <li>Any indirect, incidental, or consequential damages arising out of participation.</li>
                <li>The quality of the generated image, including any inaccuracies, technical artifacts, visual imperfections, distortions, or deviations from expected results.</li>
              </ul>
            </div>
          </div>

          {/* Section 8 */}
          <div>
            <h2 className="font-parimatch text-xl md:text-2xl mb-4" style={{ color: '#F8FF13' }}>
              8. Changes and Termination
            </h2>
            <p className="font-poppins text-base md:text-lg leading-relaxed">
              The platform reserves the right to modify, suspend, or terminate the campaign or these Terms & Conditions at any time without prior notice.
            </p>
          </div>

          {/* Section 9 */}
          <div>
            <h2 className="font-parimatch text-xl md:text-2xl mb-4" style={{ color: '#F8FF13' }}>
              9. Dispute Resolution
            </h2>
            <p className="font-poppins text-base md:text-lg leading-relaxed">
              Any disputes arising out of or relating to this campaign shall be subject to the exclusive jurisdiction of the courts of Mumbai, India. This campaign and any related matters shall be governed by and construed in accordance with the substantive laws of India.
            </p>
          </div>

          {/* Section 10 */}
          <div>
            <h2 className="font-parimatch text-xl md:text-2xl mb-4" style={{ color: '#F8FF13' }}>
              10. Contact
            </h2>
            <div className="font-poppins text-base md:text-lg leading-relaxed">
              <p>For any queries related to the campaign, please reach out to us at:</p>
              <p className="mt-2">
                <a href="mailto:support@posewithdivine.com" className="text-yellow-400 hover:text-yellow-300 transition-colors">
                  support@posewithdivine.com
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-12 md:mt-16">
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 text-black font-parimatch font-bold text-lg rounded hover:opacity-90 transition-all duration-200"
            style={{ backgroundColor: '#F8FF13' }}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
} 