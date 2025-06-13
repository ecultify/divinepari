const fs = require('fs');
const path = require('path');

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

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // In Netlify, we need to use the build directory path
    const postersPath = path.join(process.cwd(), 'posters');
    
    if (!fs.existsSync(postersPath)) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Posters directory not found' }),
      };
    }

    const posterFiles = fs.readdirSync(postersPath)
      .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file))
      .map(file => ({
        name: file,
        path: `/posters/${file}`,
        fullPath: path.join(postersPath, file)
      }));

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(posterFiles),
    };
  } catch (error) {
    console.error('Error reading posters:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to load posters' }),
    };
  }
}; 