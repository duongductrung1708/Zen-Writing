const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Unsplash API Configuration
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const UNSPLASH_API_URL = 'https://api.unsplash.com/search/photos';

// GET /api/images endpoint
app.get('/api/images', async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword || keyword.trim().length === 0) {
      return res.status(400).json({ error: 'Keyword is required' });
    }

    if (!UNSPLASH_ACCESS_KEY) {
      return res.status(500).json({ error: 'Unsplash API key not configured' });
    }

    // Fetch images from Unsplash
    const response = await axios.get(UNSPLASH_API_URL, {
      params: {
        query: keyword,
        per_page: 6,
        orientation: 'portrait',
        content_filter: 'high',
      },
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        'Accept-Version': 'v1',
      },
    });

    // Sanitize and format data
    const sanitizedImages = response.data.results.map((photo) => {
      const imageData = {
        id: photo.id,
        url: photo.urls.regular, // Using hotlinked URL from API
        alt_description: photo.alt_description || photo.description || 'Unsplash image',
        photographer_name: photo.user?.name || 'Unknown',
        photographer_username: photo.user?.username || null,
        photographer_profile: photo.user?.links?.html || null,
        download_location: photo.links?.download_location || null, // Required for download tracking
      };
      
      // Use username to construct profile URL if missing
      if (!imageData.photographer_profile && imageData.photographer_username) {
        imageData.photographer_profile = `https://unsplash.com/@${imageData.photographer_username}?utm_source=zen-writing&utm_medium=referral`;
      }
      
      // Ensure UTM params are added to photographer_profile if they don't exist
      if (imageData.photographer_profile && !imageData.photographer_profile.includes('utm_source=zen-writing')) {
        const separator = imageData.photographer_profile.includes('?') ? '&' : '?';
        imageData.photographer_profile = `${imageData.photographer_profile}${separator}utm_source=zen-writing&utm_medium=referral`;
      }
      
      return imageData;
    });

    res.json({ images: sanitizedImages });
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;
      
      // Provide more specific error messages
      let errorMessage = 'Failed to fetch images from Unsplash';
      if (status === 403) {
        errorMessage = 'Access denied. Please check your Unsplash API key and permissions.';
      } else if (status === 401) {
        errorMessage = 'Unauthorized. Invalid Unsplash API key.';
      } else if (status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      }
      
      return res.status(status).json({
        error: errorMessage,
        details: errorData,
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// POST /api/track-download endpoint - Track image downloads per Unsplash API requirements
app.post('/api/track-download', async (req, res) => {
  try {
    const { download_location } = req.body;

    if (!download_location) {
      return res.status(400).json({ error: 'download_location is required' });
    }

    if (!UNSPLASH_ACCESS_KEY) {
      return res.status(500).json({ error: 'Unsplash API key not configured' });
    }

    // Call Unsplash download endpoint to track the download
    const response = await axios.get(download_location, {
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        'Accept-Version': 'v1',
      },
    });

    res.json({ success: true, data: response.data });
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json({
        error: 'Failed to track download',
        details: error.response.data,
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`🚀 AuraScribe backend server running on port ${PORT}`);
});

