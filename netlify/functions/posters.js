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
    // In Netlify, posters are served as static files from the client/public/posters directory
    // We'll return a hardcoded list since they're static files
    const posterFiles = [
      { name: 'Option 1F.jpg', path: '/posters/Option 1F.jpg' },
      { name: 'Option 1M.jpg', path: '/posters/Option 1M.jpg' },
      { name: 'Option 2F.jpg', path: '/posters/Option 2F.jpg' },
      { name: 'Option 2M.jpg', path: '/posters/Option 2M.jpg' },
      { name: 'Option 3F.jpg', path: '/posters/Option 3F.jpg' },
      { name: 'Option 3MF.jpg', path: '/posters/Option 3MF.jpg' }
    ];

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