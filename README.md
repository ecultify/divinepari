# 🎭 FaceSwap Poster Generator

A React application that allows users to upload their photo and generate custom posters by swapping their face onto poster templates using AI face-swapping technology.

## 🚀 Features

- **Easy Photo Upload**: Simple drag-and-drop interface for uploading user photos
- **Poster Templates**: Choose from various poster templates
- **AI Face Swapping**: Powered by Segmind's advanced face-swap API
- **Side Selection**: Choose which side of the poster to replace (left or right)
- **Real-time Processing**: Live preview and processing status
- **Download Results**: Download your custom poster in high quality

## 🔧 How It Works

### Workflow Process:
1. **User uploads their face image** → This becomes the "source image"
2. **Select a poster template** → From the poster folder
3. **Choose target side** → Left or right side of the poster
4. **Extract target area** → Take the selected side containing the face to be replaced
5. **Face swap** → Use Segmind API to swap user's face onto the extracted area
6. **Composite back** → Place the face-swapped result back onto the original poster
7. **Final result** → Complete poster with user's face integrated

### Technical Implementation:
- **Frontend**: React with TypeScript for type safety
- **Backend**: Express.js server with image processing
- **Image Processing**: Sharp.js for image manipulation
- **Face Swapping**: Segmind API integration
- **File Handling**: Multer for file uploads

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Segmind API key

## 🛠️ Installation

1. **Clone and Install Dependencies**:
   ```bash
   # Install main dependencies
   npm install
   
   # Install client dependencies
   cd client && npm install && cd ..
   ```

2. **Set up Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   SEGMIND_API_KEY=SG_55ab857ecea4de8d
   PORT=5000
   ```

3. **Add Poster Templates**:
   - Place your poster template images in the `posters/` folder
   - Supported formats: JPG, JPEG, PNG, GIF
   - Templates should have faces on either left or right side

## 🚀 Running the Application

### Development Mode:
```bash
# Start both server and client
npm run dev
```

### Individual Services:
```bash
# Start server only
npm run server

# Start client only (in separate terminal)
npm run client
```

## 📁 Directory Structure

```
faceswap-poster-app/
├── client/                 # React frontend
│   ├── src/
│   │   ├── App.tsx        # Main React component
│   │   ├── App.css        # Styling
│   │   └── ...
│   └── package.json
├── server/
│   └── index.js           # Express server
├── posters/               # Poster template images
├── uploads/               # User uploaded images
├── temp/                  # Temporary processing files
├── package.json           # Server dependencies
└── README.md
```

## 🎨 Usage

1. **Upload Your Photo**: Click to upload or drag-and-drop your face image
2. **Select Template**: Choose from available poster templates
3. **Pick Side**: Select whether to replace the left or right side
4. **Process**: Click "Create My Poster!" to start the AI processing
5. **Download**: Save your custom poster when processing is complete

## 🔧 API Endpoints

### Server Endpoints:
- `GET /api/posters` - Fetch available poster templates
- `POST /api/upload` - Upload user image
- `POST /api/process-faceswap` - Process face swap with parameters:
  - `userImagePath`: Path to user's uploaded image
  - `posterName`: Selected poster template name  
  - `targetSide`: Which side to replace ('left' or 'right')

## 🎯 Customization

### Adding New Poster Templates:
1. Add image files to the `posters/` directory
2. Ensure templates have clear faces on left or right side
3. Restart the server to load new templates

### Modifying Face Swap Parameters:
Edit the `faceSwapData` object in `server/index.js` to adjust:
- Face detection settings
- Image quality
- Restoration weights
- Gender detection options

## 🔐 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SEGMIND_API_KEY` | Your Segmind API key | Required |
| `PORT` | Server port | 5000 |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🐛 Troubleshooting

### Common Issues:

1. **"No posters found"**: Ensure poster images are in the `posters/` folder
2. **Face swap fails**: Check your Segmind API key and internet connection
3. **Upload errors**: Verify file permissions on `uploads/` directory
4. **Processing timeouts**: Large images may take longer to process

### Performance Tips:

- Optimize poster template sizes (recommended: max 2000px width)
- Use JPG format for faster processing
- Ensure good lighting in user photos for better face detection

## 🌟 Features in Development

- [ ] Multiple face detection and swapping
- [ ] Batch processing
- [ ] Custom poster creation tools
- [ ] Social media sharing integration
- [ ] Advanced face alignment options

---

Enjoy creating amazing posters with AI-powered face swapping! 🎉 