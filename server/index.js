const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const sharp = require('sharp');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/posters', express.static('posters'));

// Create directories if they don't exist
const dirs = ['uploads', 'posters', 'temp'];
dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });

// Segmind API configuration
const SEGMIND_API_KEY = process.env.SEGMIND_API_KEY || 'SG_55ab857ecea4de8d';
const SEGMIND_URL = 'https://api.segmind.com/v1/faceswap-v3';

// Utility functions
function imageFileToBase64(imagePath) {
    const imageData = fs.readFileSync(path.resolve(imagePath));
    return Buffer.from(imageData).toString('base64');
}

async function imageUrlToBase64(imageUrl) {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    return Buffer.from(response.data, 'binary').toString('base64');
}

// Routes
app.get('/api/posters', (req, res) => {
    try {
        const posterFiles = fs.readdirSync('./posters')
            .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file))
            .map(file => ({
                name: file,
                path: `/posters/${file}`,
                fullPath: path.join(__dirname, '../posters', file)
            }));
        res.json(posterFiles);
    } catch (error) {
        console.error('Error reading posters:', error);
        res.status(500).json({ error: 'Failed to load posters' });
    }
});

app.post('/api/upload', upload.single('userImage'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        res.json({
            success: true,
            filePath: req.file.path,
            fileName: req.file.filename,
            url: `/uploads/${req.file.filename}`
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
});

app.post('/api/process-faceswap', async (req, res) => {
    try {
        const { userImagePath, posterName, targetSide } = req.body;
        
        if (!userImagePath || !posterName || !targetSide) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        const posterPath = path.join(__dirname, '../posters', posterName);
        const userImageFullPath = path.join(__dirname, '..', userImagePath);

        if (!fs.existsSync(posterPath) || !fs.existsSync(userImageFullPath)) {
            return res.status(404).json({ error: 'Image files not found' });
        }

        // Step 1: Extract the target side from the poster
        const posterImage = sharp(posterPath);
        const metadata = await posterImage.metadata();
        const { width, height } = metadata;
        
        // Extract left or right half based on targetSide
        const halfWidth = Math.floor(width / 2);
        const extractOptions = targetSide === 'left' 
            ? { left: 0, top: 0, width: halfWidth, height }
            : { left: halfWidth, top: 0, width: halfWidth, height };

        const targetImagePath = path.join(__dirname, '../temp', `target-${Date.now()}.jpg`);
        await posterImage
            .extract(extractOptions)
            .jpeg({ quality: 95 })
            .toFile(targetImagePath);

        // Step 2: Perform face swap using Segmind API
        const sourceImageBase64 = imageFileToBase64(userImageFullPath);
        const targetImageBase64 = imageFileToBase64(targetImagePath);

        const faceSwapData = {
            source_img: sourceImageBase64,
            target_img: targetImageBase64,
            input_faces_index: 0,
            source_faces_index: 0,
            face_restore: "codeformer-v0.1.0.pth",
            interpolation: "Bilinear",
            detection_face_order: "large-small",
            facedetection: "retinaface_resnet50",
            detect_gender_input: "no",
            detect_gender_source: "no",
            face_restore_weight: 0.75,
            image_format: "jpeg",
            image_quality: 95,
            base64: true
        };

        console.log('Calling Segmind API for face swap...');
        const faceSwapResponse = await axios.post(SEGMIND_URL, faceSwapData, {
            headers: { 'x-api-key': SEGMIND_API_KEY },
            timeout: 30000
        });

        // Step 3: Save the face-swapped result
        const swappedImagePath = path.join(__dirname, '../temp', `swapped-${Date.now()}.jpg`);
        const swappedImageBuffer = Buffer.from(faceSwapResponse.data.image, 'base64');
        fs.writeFileSync(swappedImagePath, swappedImageBuffer);

        // Step 4: Composite the swapped image back onto the original poster
        const finalImagePath = path.join(__dirname, '../uploads', `final-${Date.now()}.jpg`);
        
        // Resize swapped image to match the extracted dimensions
        const resizedSwappedPath = path.join(__dirname, '../temp', `resized-${Date.now()}.jpg`);
        await sharp(swappedImagePath)
            .resize(halfWidth, height)
            .jpeg({ quality: 95 })
            .toFile(resizedSwappedPath);

        // Create the final composite image
        const overlayOptions = targetSide === 'left'
            ? { left: 0, top: 0 }
            : { left: halfWidth, top: 0 };

        await sharp(posterPath)
            .composite([{
                input: resizedSwappedPath,
                ...overlayOptions
            }])
            .jpeg({ quality: 95 })
            .toFile(finalImagePath);

        // Clean up temp files
        [targetImagePath, swappedImagePath, resizedSwappedPath].forEach(filePath => {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        });

        const finalImageUrl = `/uploads/${path.basename(finalImagePath)}`;
        
        res.json({
            success: true,
            finalImageUrl,
            message: 'Face swap completed successfully!'
        });

    } catch (error) {
        console.error('Face swap error:', error);
        res.status(500).json({ 
            error: 'Face swap failed', 
            details: error.response?.data || error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Poster directory: ${path.join(__dirname, '../posters')}`);
    console.log(`Upload directory: ${path.join(__dirname, '../uploads')}`);
}); 