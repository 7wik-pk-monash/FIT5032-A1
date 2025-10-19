import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createSSRApp } from 'vue';
import { useData } from './src/composables/useData.js';

dotenv.config();


const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Vue app and composables are already imported above

// Create Vue app instance for server-side data access
let vueApp;
let activitiesData = [];

// Initialize Vue app and get reactive data
async function initializeVueApp() {
  try {
    // Create a minimal Vue app instance
    const App = {
      setup() {
        const { activities, loadActivities } = useData();

        // Load activities when app starts
        loadActivities();

        return {
          activities
        };
      }
    };

    vueApp = createSSRApp(App);

    // Wait for activities to load
    await new Promise((resolve) => {
      const checkActivities = () => {
        if (vueApp._instance && vueApp._instance.ctx.activities && vueApp._instance.ctx.activities.value.length > 0) {
          activitiesData = vueApp._instance.ctx.activities.value;
          resolve();
        } else {
          setTimeout(checkActivities, 100);
        }
      };
      checkActivities();
    });

    console.log(`Loaded ${activitiesData.length} activities for API`);
  } catch (error) {
    console.error('Error initializing Vue app:', error);
  }
}

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
}

// API Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    activitiesLoaded: activitiesData.length
  });
});

// Get nearby activities by coordinates
app.get('/api/activities/nearby', (req, res) => {
  try {
    const { lat, lng, limit = 5 } = req.query;

    // Validate required parameters
    if (!lat || !lng) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'Both lat and lng query parameters are required'
      });
    }

    // Validate coordinate values
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const limitNum = parseInt(limit);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        error: 'Invalid coordinates',
        message: 'lat and lng must be valid numbers'
      });
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
      return res.status(400).json({
        error: 'Invalid limit',
        message: 'limit must be a number between 1 and 50'
      });
    }

    // Calculate distances and sort activities
    const activitiesWithDistance = activitiesData
      .filter(activity =>
        activity.location &&
        activity.location.lat &&
        activity.location.lng &&
        !activity.deleted // Exclude deleted activities
      )
      .map(activity => {
        const distance = calculateDistance(
          latitude,
          longitude,
          activity.location.lat,
          activity.location.lng
        );

        return {
          ...activity,
          distance: Math.round(distance * 100) / 100 // Round to 2 decimal places
        };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limitNum);

    res.json({
      success: true,
      data: activitiesWithDistance,
      count: activitiesWithDistance.length,
      requestedLimit: limitNum,
      coordinates: {
        lat: latitude,
        lng: longitude
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in /api/activities/nearby:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch nearby activities'
    });
  }
});

// Get all activities (for testing)
app.get('/api/activities', (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const limitNum = parseInt(limit);

    const filteredActivities = activitiesData
      .filter(activity => !activity.deleted)
      .slice(0, limitNum);

    res.json({
      success: true,
      data: filteredActivities,
      count: filteredActivities.length,
      totalAvailable: activitiesData.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in /api/activities:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch activities'
    });
  }
});

// Error handling middleware
app.use((err, req, res) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested endpoint does not exist'
  });
});

// Start server
async function startServer() {
  try {
    await initializeVueApp();

    app.listen(PORT, () => {
      console.log(`🚀 Express API server running on port ${PORT}`);
      console.log(`📍 Nearby activities: GET /api/activities/nearby?lat=37.7749&lng=-122.4194&limit=5`);
      console.log(`📋 All activities: GET /api/activities?limit=10`);
      console.log(`❤️  Health check: GET /api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
