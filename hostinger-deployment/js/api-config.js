// API Configuration for Hostinger deployment
const API_CONFIG = {
    baseUrl: '', // Will use relative URLs since we're on the same domain
    endpoints: {
        faceSwap: '/api/process-faceswap.php'
    }
};

// Global fetch interceptor to redirect API calls
(function() {
    const originalFetch = window.fetch;
    
    window.fetch = function(...args) {
        let [url, options] = args;
        
        // Redirect Next.js API routes to PHP equivalents
        if (typeof url === 'string') {
            if (url.includes('/api/process-faceswap') && !url.includes('.php')) {
                console.log('Redirecting API call from', url, 'to', API_CONFIG.endpoints.faceSwap);
                url = API_CONFIG.endpoints.faceSwap;
                args[0] = url;
            }
        }
        
        return originalFetch.apply(this, args);
    };
})();

// Face swap API function for Hostinger
async function callFaceSwapAPI(userImage, posterName, sessionId) {
    const formData = new FormData();
    formData.append('userImage', userImage);
    formData.append('posterName', posterName);  
    formData.append('sessionId', sessionId);

    try {
        console.log('Calling PHP face swap API...');
        
        const response = await fetch(API_CONFIG.endpoints.faceSwap, {
            method: 'POST',
            body: formData
        });

        console.log('PHP API response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('PHP API error response:', errorText);
            throw new Error(`HTTP ${response.status}: Face swap processing failed`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Face swap processing failed');
        }

        return result;
        
    } catch (error) {
        console.error('Face swap API error:', error);
        throw error;
    }
}

// Replace the original API call in your pages
// This function should be used instead of the original fetch to /api/process-faceswap
window.faceSwapAPI = callFaceSwapAPI;

console.log('Hostinger API configuration loaded - all API calls will be redirected to PHP endpoints'); 