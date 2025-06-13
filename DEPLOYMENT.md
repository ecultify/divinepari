# Deployment Guide

This guide will help you deploy the FaceSwap Poster Generator to production.

## Architecture Overview

This is a full-stack application with:
- **Frontend**: React app (deploy to Netlify)
- **Backend**: Express.js server (deploy to Railway/Render/Heroku)

## Step 1: Deploy Backend Server

### Option A: Railway (Recommended)
1. Go to [Railway.app](https://railway.app)
2. Sign up/Login with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your `ecultify/divinepari` repository
5. Railway will auto-detect it's a Node.js app
6. **Set Environment Variables**:
   - `SEGMIND_API_KEY` = `SG_55ab857ecea4de8d`
   - `PORT` = `5000` (Railway will override this automatically)
7. Deploy and note your backend URL (e.g., `https://your-app.railway.app`)

### Option B: Render
1. Go to [Render.com](https://render.com)
2. Sign up/Login with GitHub
3. Click "New" → "Web Service"
4. Connect your GitHub repo `ecultify/divinepari`
5. Configure:
   - **Root Directory**: Leave empty (or set to `/`)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. **Set Environment Variables**:
   - `SEGMIND_API_KEY` = `SG_55ab857ecea4de8d`
7. Deploy and note your backend URL

### Option C: Heroku
1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create your-app-name`
4. Set environment variables:
   ```bash
   heroku config:set SEGMIND_API_KEY=SG_55ab857ecea4de8d
   ```
5. Deploy: `git push heroku main`

## Step 2: Deploy Frontend to Netlify

### Method 1: Netlify Dashboard (Recommended)
1. Go to [Netlify.com](https://netlify.com)
2. Sign up/Login with GitHub
3. Click "New site from Git"
4. Choose GitHub and select `ecultify/divinepari`
5. **Configure Build Settings**:
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `client/build`
6. **Set Environment Variables** (in Netlify dashboard):
   - Go to Site Settings → Environment Variables
   - Add: `REACT_APP_API_URL` = `https://your-backend-url.com/api`
   - Replace `your-backend-url.com` with your actual backend URL from Step 1
7. Click "Deploy site"

### Method 2: Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Build the client
cd client
npm run build

# Deploy
netlify deploy --prod --dir=build
```

## Step 3: Configure Environment Variables

### Backend Environment Variables
Set these on your backend hosting platform:

| Variable | Value | Description |
|----------|-------|-------------|
| `SEGMIND_API_KEY` | `SG_55ab857ecea4de8d` | Your Segmind API key |
| `PORT` | `5000` | Server port (usually auto-set by hosting) |

### Frontend Environment Variables
Set these in Netlify:

| Variable | Value | Description |
|----------|-------|-------------|
| `REACT_APP_API_URL` | `https://your-backend-url.com/api` | Your backend API URL |

## Step 4: Test Your Deployment

1. Visit your Netlify URL
2. Try uploading a photo
3. Select gender and poster
4. Test the face swap functionality
5. Test the download feature

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Make sure your backend allows requests from your Netlify domain
2. **API Key Issues**: Verify the `SEGMIND_API_KEY` is set correctly
3. **Build Failures**: Check that all dependencies are in `package.json`
4. **File Upload Issues**: Ensure your backend has proper file handling

### Backend CORS Configuration
If you get CORS errors, update your backend's CORS settings:

```javascript
// In server/index.js
app.use(cors({
    origin: ['http://localhost:3000', 'https://your-netlify-domain.netlify.app'],
    credentials: true
}));
```

## Security Notes

- ✅ API keys are stored as environment variables (not in code)
- ✅ `.env` files are in `.gitignore`
- ✅ No sensitive data is committed to GitHub
- ⚠️ Consider rotating API keys periodically
- ⚠️ Monitor API usage to prevent abuse

## File Structure After Deployment

```
Production URLs:
├── Frontend (Netlify): https://your-app.netlify.app
├── Backend (Railway): https://your-app.railway.app
└── API Endpoints: https://your-app.railway.app/api/*
```

## Cost Estimates

- **Netlify**: Free tier (100GB bandwidth/month)
- **Railway**: ~$5/month for basic usage
- **Segmind API**: Pay per API call
- **Total**: ~$5-10/month depending on usage 