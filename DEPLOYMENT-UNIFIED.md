# Single Application Deployment Guide

This is now a **unified application** that can be deployed to **one single platform** (Netlify) with both frontend and backend functionality.

## 🚀 Quick Deploy to Netlify

### Step 1: Push to GitHub
Your code is already on GitHub at: `https://github.com/ecultify/divinepari`

### Step 2: Deploy to Netlify
1. Go to [Netlify.com](https://netlify.com)
2. Sign up/Login with GitHub
3. Click **"New site from Git"**
4. Choose **GitHub** and select `ecultify/divinepari`
5. **Build Settings** (Netlify will auto-detect from `netlify.toml`):
   - ✅ Base directory: `client`
   - ✅ Build command: `npm run build`
   - ✅ Publish directory: `client/build`
6. **Environment Variables**:
   - Go to **Site Settings** → **Environment Variables**
   - Add: `SEGMIND_API_KEY` = `SG_55ab857ecea4de8d`
7. Click **"Deploy site"**

### Step 3: Copy Poster Images
After deployment, you need to copy your poster images to the Netlify site:

1. In your Netlify dashboard, go to **Site Settings** → **Asset optimization**
2. Or manually upload posters to the `/public/posters/` directory in your repository

## 📁 File Structure (Unified)

```
Your App (Single Deployment)
├── client/                 # React frontend
│   ├── src/
│   ├── public/
│   │   └── posters/       # Put your poster images here
│   └── build/             # Built frontend (auto-generated)
├── netlify/
│   └── functions/         # Serverless backend functions
│       ├── posters.js     # API: Get poster list
│       └── process-faceswap.js  # API: Face swap processing
├── netlify.toml           # Netlify configuration
└── package.json           # Dependencies for functions
```

## 🔧 How It Works

1. **Frontend**: React app served from Netlify CDN
2. **Backend**: Serverless functions handle API calls
3. **API Routes**: 
   - `/api/posters` → Lists available posters
   - `/api/process-faceswap` → Handles face swapping
4. **File Storage**: Images processed in serverless function memory
5. **Result**: Base64 image returned directly (no file storage needed)

## 💰 Cost

- **Netlify**: FREE tier includes:
  - 100GB bandwidth/month
  - 125,000 serverless function calls/month
  - Custom domain support
- **Segmind API**: Pay per API call (~$0.01-0.05 per face swap)
- **Total**: Essentially FREE for moderate usage

## 🎯 Benefits of Unified Deployment

✅ **Single URL**: One domain for everything  
✅ **No CORS Issues**: Frontend and backend on same domain  
✅ **Automatic HTTPS**: Netlify provides SSL certificates  
✅ **Global CDN**: Fast loading worldwide  
✅ **Auto-scaling**: Serverless functions scale automatically  
✅ **Easy Updates**: Just push to GitHub to redeploy  

## 🔄 Development vs Production

### Local Development:
```bash
npm run dev  # Runs both client and old server (for testing)
```

### Production:
- Frontend: Served by Netlify CDN
- Backend: Netlify Functions (serverless)
- Database: Not needed (stateless)
- File Storage: Temporary (in-memory processing)

## 🚨 Important Notes

1. **Poster Images**: Make sure to upload your poster images to `client/public/posters/`
2. **Environment Variables**: Set `SEGMIND_API_KEY` in Netlify dashboard
3. **Function Timeout**: Netlify functions have 10-second timeout (should be enough for face swap)
4. **File Size Limits**: Max 6MB for function payloads (should be fine for images)

## 🎉 That's It!

Your app will be live at: `https://your-site-name.netlify.app`

No need for separate backend hosting, database setup, or complex configurations! 