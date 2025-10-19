import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { firebaseConfig } from './firebase-config.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const functions = getFunctions(firebaseApp);

// Load playgrounds data for coordinate mapping
let playgroundsCache = null;

async function loadPlaygrounds() {
  if (playgroundsCache) return playgroundsCache;

  try {
    const playgroundsSnapshot = await getDocs(collection(db, 'playgrounds'));
    const playgrounds = [];

    playgroundsSnapshot.forEach((doc) => {
      playgrounds.push({
        id: doc.id,
        ...doc.data()
      });
    });

    playgroundsCache = playgrounds;
    return playgrounds;
  } catch (error) {
    console.error('Error loading playgrounds:', error);
    return [];
  }
}

// Get coordinates for a location name
function getCoordinatesForLocation(locationName, playgrounds) {
  const playground = playgrounds.find(p =>
    p.name && p.name.toLowerCase().includes(locationName.toLowerCase())
  );

  if (playground && playground.lat && playground.lng) {
    return {
      lat: playground.lat,
      lng: playground.lng
    };
  }

  return null;
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
}

// Helper function to send JSON response
function sendJsonResponse(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

// API Routes
// Health check
app.get('/api/health', (req, res) => {
  try {
    sendJsonResponse(res, 200, {
      status: 'OK',
      message: 'TeamUp API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Health check error:', error);
    sendJsonResponse(res, 500, {
      error: 'Internal server error',
      message: 'Health check failed'
    });
  }
});

// Get all activities
app.get('/api/activities', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const limitNum = parseInt(limit, 10);

    // Load activities from Firestore
    const activitiesSnapshot = await getDocs(collection(db, 'activities'));
    const activities = [];

    activitiesSnapshot.forEach((doc) => {
      activities.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Apply limit
    const limitedActivities = activities.slice(0, limitNum);

    sendJsonResponse(res, 200, {
      success: true,
      data: limitedActivities,
      total: activities.length,
      returned: limitedActivities.length,
      limit: limitNum
    });

  } catch (error) {
    console.error('Error loading activities:', error);
    sendJsonResponse(res, 500, {
      error: 'Internal server error',
      message: 'Failed to load activities'
    });
  }
});

// Get nearby activities
app.get('/api/activities/nearby', async (req, res) => {
  try {
    const { lat, lng, limit = 5 } = req.query;

    // Validate required parameters
    if (!lat || !lng) {
      return sendJsonResponse(res, 400, {
        error: 'Missing required parameters',
        message: 'lat and lng are required'
      });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const limitNum = parseInt(limit, 10);

    if (isNaN(userLat) || isNaN(userLng)) {
      return sendJsonResponse(res, 400, {
        error: 'Invalid coordinates',
        message: 'lat and lng must be valid numbers'
      });
    }

    // Load playgrounds for coordinate mapping
    const playgrounds = await loadPlaygrounds();

    // Load activities from Firestore
    const activitiesSnapshot = await getDocs(collection(db, 'activities'));
    const activities = [];

    activitiesSnapshot.forEach((doc) => {
      const activityData = doc.data();
      let activityLat = activityData.lat;
      let activityLng = activityData.lng;

      // If activity doesn't have coordinates, try to get them from playgrounds
      if (!activityLat || !activityLng) {
        const coords = getCoordinatesForLocation(activityData.location, playgrounds);
        if (coords) {
          activityLat = coords.lat;
          activityLng = coords.lng;
        }
      }

      // Only include activities with valid coordinates
      if (activityLat && activityLng) {
        const distance = calculateDistance(userLat, userLng, activityLat, activityLng);

        activities.push({
          id: doc.id,
          ...activityData,
          lat: activityLat,
          lng: activityLng,
          distance: Math.round(distance * 100) / 100 // Round to 2 decimal places
        });
      }
    });

    // Sort by distance and apply limit
    activities.sort((a, b) => a.distance - b.distance);
    const nearbyActivities = activities.slice(0, limitNum);

    sendJsonResponse(res, 200, {
      success: true,
      data: nearbyActivities,
      total: activities.length,
      returned: nearbyActivities.length,
      limit: limitNum,
      userLocation: {
        lat: userLat,
        lng: userLng
      },
      distanceUnit: 'kilometers'
    });

  } catch (error) {
    console.error('Error loading nearby activities:', error);
    sendJsonResponse(res, 500, {
      error: 'Internal server error',
      message: 'Failed to load nearby activities'
    });
  }
});

// Process donation
app.post('/api/donations', async (req, res) => {
  try {
    const { donorName, donorEmail, donationAmount } = req.body;

    // Validate required fields
    if (!donorName || !donorEmail || !donationAmount) {
      return sendJsonResponse(res, 400, {
        error: 'Missing required fields',
        message: 'donorName, donorEmail, and donationAmount are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(donorEmail)) {
      return sendJsonResponse(res, 400, {
        error: 'Invalid email format',
        message: 'Please provide a valid email address'
      });
    }

    // Validate donation amount
    const amount = parseFloat(donationAmount);
    if (isNaN(amount) || amount <= 0) {
      return sendJsonResponse(res, 400, {
        error: 'Invalid donation amount',
        message: 'Donation amount must be a positive number'
      });
    }

    // Generate receipt data (mirroring Donation.vue structure)
    const donationData = {
      receiptNumber: `TUP-${Date.now()}`,
      date: new Date().toLocaleDateString('en-AU'),
      donorName: donorName,
      donorEmail: donorEmail,
      totalAmount: amount.toFixed(2),
      items: [{
        name: 'Custom Donation',
        quantity: 1,
        unitPrice: amount,
        total: amount
      }]
    };

    // Call Firebase function to send donation receipt
    const sendDonationReceiptFunction = httpsCallable(functions, 'sendDonationReceipt');
    const result = await sendDonationReceiptFunction({ donationData });

    if (result.data.success) {
      sendJsonResponse(res, 200, {
        success: true,
        message: `Thank you for your donation of $${amount.toFixed(2)} AUD! A receipt has been sent to ${donorEmail}`,
        receiptNumber: donationData.receiptNumber,
        emailSent: true,
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error(result.data.error || 'Failed to send donation receipt');
    }

  } catch (error) {
    console.error('Error in /api/donations:', error);
    sendJsonResponse(res, 500, {
      error: 'Internal server error',
      message: 'Failed to process donation'
    });
  }
});

// 404 handler
app.use((req, res) => {
  sendJsonResponse(res, 404, {
    error: 'Not found',
    message: 'The requested endpoint does not exist'
  });
});

// Start server
console.log('Starting Express server...');
const server = app.listen(PORT, () => {
  console.log(`🚀 Express API server running on port ${PORT}`);
  console.log(`📍 Nearby activities: GET /api/activities/nearby?lat=37.7749&lng=-122.4194&limit=5`);
  console.log(`📋 All activities: GET /api/activities?limit=10`);
  console.log(`💰 Process donation: POST /api/donations`);
  console.log(`❤️  Health check: GET /api/health`);
  console.log(`📝 Note: Using Firestore data (same as Vue app)`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
});

export default app;
