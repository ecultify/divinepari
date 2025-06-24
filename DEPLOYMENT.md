# Deployment Guide

## 🚀 Netlify Deployment Setup

### **Required Environment Variables**

Add these to your Netlify Environment Variables (Site Settings → Environment Variables):

```bash
# Segmind API Configuration
SEGMIND_API_KEY=your_segmind_api_key_here

# Supabase Configuration  
NEXT_PUBLIC_SUPABASE_URL=https://nuoizrqsnxoldzcvwszu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51b2l6cnFzbnhvbGR6Y3Z3c3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTAwOTAsImV4cCI6MjA2NTgyNjA5MH0.QBqYuv2uxdNiakLzrW_CosJnN0vTvTwlGT2UvAZFYlY
```

### **Deployment Steps**

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for Netlify deployment"
   git push origin main
   ```

2. **Connect to Netlify**:
   - Go to [Netlify](https://netlify.com)
   - Import from Git
   - Select your GitHub repository

3. **Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: `18`

4. **Environment Variables**:
   - Add the environment variables listed above
   - Make sure `SEGMIND_API_KEY` has your actual API key

5. **Deploy**:
   - Click "Deploy Site"
   - Wait for build to complete

### **Features**

- ✅ Face swap with hair transfer using Segmind FaceSwap v4
- ✅ Smart poster side detection (left/right)
- ✅ Image compositing and processing
- ✅ Supabase integration for tracking
- ✅ Responsive design for all devices

### **API Endpoints**

- `POST /api/process-faceswap` - Main face and hair swap processing

### **Troubleshooting**

If deployment fails:

1. **Check build logs** for any missing dependencies
2. **Verify environment variables** are set correctly
3. **Ensure Supabase storage buckets** are created if using storage
4. **Check API key** is valid and has sufficient credits

### **Performance**

- Processing time: ~45-90 seconds per image
- Supports images up to 2048x2048px
- Optimized for mobile and desktop 