const multipart = require('lambda-multipart-parser');
const axios = require('axios');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Utility functions
function imageFileToBase64(imagePath) {
  const imageData = fs.readFileSync(imagePath);
  return Buffer.from(imageData).toString('base64');
}

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse multipart form data
    const result = await multipart.parse(event);
    
    const userImageFile = result.files.find(f => f.fieldname === 'userImage');
    const posterName = result.posterName;
    const targetSide = result.targetSide;

    if (!userImageFile || !posterName || !targetSide) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required parameters' }),
      };
    }

    // Create temp directory in /tmp (Netlify functions have access to /tmp)
    const tempDir = '/tmp';
    const uniqueId = uuidv4();
    
    // Save uploaded user image
    const userImagePath = path.join(tempDir, `user-${uniqueId}.jpg`);
    fs.writeFileSync(userImagePath, userImageFile.content);

    // Get poster from URL (since it's served as static file)
    const posterUrl = `https://${event.headers.host}/posters/${posterName}`;
    
    // Download poster image
    const posterResponse = await axios.get(posterUrl, { responseType: 'arraybuffer' });
    const posterBuffer = Buffer.from(posterResponse.data);
    
    // Save poster temporarily
    const posterPath = path.join(tempDir, `poster-${uniqueId}.jpg`);
    fs.writeFileSync(posterPath, posterBuffer);

    // Step 1: Extract the target side from the poster
    const posterImage = sharp(posterPath);
    const metadata = await posterImage.metadata();
    const { width, height } = metadata;
    
    // Extract left or right half based on targetSide
    const halfWidth = Math.floor(width / 2);
    const extractOptions = targetSide === 'left' 
      ? { left: 0, top: 0, width: halfWidth, height }
      : { left: halfWidth, top: 0, width: halfWidth, height };

    const targetImagePath = path.join(tempDir, `target-${uniqueId}.jpg`);
    await posterImage
      .extract(extractOptions)
      .jpeg({ quality: 95 })
      .toFile(targetImagePath);

    // Step 2: Perform face swap using Segmind API
    const SEGMIND_API_KEY = process.env.SEGMIND_API_KEY;
    const SEGMIND_URL = 'https://api.segmind.com/v1/faceswap-v3';

    if (!SEGMIND_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'SEGMIND_API_KEY not configured' }),
      };
    }

    const sourceImageBase64 = imageFileToBase64(userImagePath);
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
    const swappedImagePath = path.join(tempDir, `swapped-${uniqueId}.jpg`);
    const swappedImageBuffer = Buffer.from(faceSwapResponse.data.image, 'base64');
    fs.writeFileSync(swappedImagePath, swappedImageBuffer);

    // Step 4: Composite the swapped image back onto the original poster
    const resizedSwappedPath = path.join(tempDir, `resized-${uniqueId}.jpg`);
    await sharp(swappedImagePath)
      .resize(halfWidth, height)
      .jpeg({ quality: 95 })
      .toFile(resizedSwappedPath);

    // Create the final composite image
    const overlayOptions = targetSide === 'left'
      ? { left: 0, top: 0 }
      : { left: halfWidth, top: 0 };

    const finalImagePath = path.join(tempDir, `final-${uniqueId}.jpg`);
    await sharp(posterPath)
      .composite([{
        input: resizedSwappedPath,
        ...overlayOptions
      }])
      .jpeg({ quality: 95 })
      .toFile(finalImagePath);

    // Read the final image and return as base64
    const finalImageBuffer = fs.readFileSync(finalImagePath);
    const finalImageBase64 = finalImageBuffer.toString('base64');

    // Clean up temp files
    [userImagePath, posterPath, targetImagePath, swappedImagePath, resizedSwappedPath, finalImagePath].forEach(filePath => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        finalImage: `data:image/jpeg;base64,${finalImageBase64}`,
        message: 'Face swap completed successfully!'
      }),
    };

  } catch (error) {
    console.error('Face swap error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Face swap failed', 
        details: error.response?.data || error.message 
      }),
    };
  }
}; 