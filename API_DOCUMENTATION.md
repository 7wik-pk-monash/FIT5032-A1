# TeamUp Public API Documentation

This document outlines the public API endpoints available for the TeamUp application.

## Base URL
`http://localhost:3001` (or your deployed server URL)

## Endpoints

### 1. Health Check
**GET** `/api/health`

Returns the API status and basic information.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-10-19T05:21:24.691Z",
  "activitiesLoaded": 8,
  "note": "Using Firestore data (same as Vue app)"
}
```

### 2. Get Nearby Activities
**GET** `/api/activities/nearby`

Finds activities closest to the provided coordinates.

**Query Parameters:**
- `lat` (required): Latitude of the reference point.
- `lng` (required): Longitude of the reference point.
- `limit` (optional): Maximum number of activities to return. Default is `5`. Max is `50`.

**Example Request:**
```bash
GET /api/activities/nearby?lat=37.7749&lng=-122.4194&limit=3
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "activityId1",
      "title": "Basketball at Central Park",
      "sport": "Basketball",
      "location": "Central Park",
      "lat": 37.7849,
      "lng": -122.4094,
      "datetime": "2025-10-25T16:00:00.000Z",
      "capacity": 10,
      "rsvps": [],
      "distance": 1.42
    }
  ],
  "count": 1,
  "requestedLimit": 5,
  "coordinates": {
    "lat": 37.7749,
    "lng": -122.4194
  },
  "timestamp": "2025-10-19T05:21:24.691Z"
}
```

**Error Responses:**
- `400`: Bad Request (invalid parameters)
- `404`: Not Found (endpoint doesn't exist)
- `500`: Internal Server Error (unexpected server issues)

### 3. Get All Activities
**GET** `/api/activities`

Returns a list of all available activities.

**Query Parameters:**
- `limit` (optional): Maximum number of activities to return. Default is `10`.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "activityId1",
      "title": "Community Football Game #1",
      "location": "Carlton Gardens, Carlton St, Carlton",
      "datetime": "2025-10-25T16:00:00.000Z",
      "capacity": 20,
      "rsvps": [],
      "sport": "football",
      "age": "youth",
      "accessibility": "open"
    }
  ],
  "count": 1,
  "totalAvailable": 8,
  "timestamp": "2025-10-19T05:21:24.691Z"
}
```

**Example Request:**
```bash
GET /api/activities?limit=5
```


## Running the API

### Development
```bash
# Start API server only
node api-server-simple.js

# Start both Vue app and API server
npm run dev:full
```

## Features

- **Distance Calculation**: Uses Haversine formula for accurate distance calculations
- **Real-time Data**: Always fetches fresh data from Firestore (no caching)
- **Error Handling**: Comprehensive error handling with descriptive messages
- **CORS**: Cross-origin requests enabled
- **Input Validation**: Validates coordinates and limits
- **Live Updates**: Every request gets the most current data from the database

## Technical Details

- **Framework**: Express.js
- **Database**: Firebase Firestore
- **Distance Formula**: Haversine formula (kilometers)
- **Caching**: None - always fetches fresh data
- **Port**: 3001 (configurable via PORT environment variable)

## Error Codes

- `400`: Bad Request (invalid parameters)
- `404`: Not Found (endpoint doesn't exist)
- `500`: Internal Server Error (unexpected server issues)

## Example Usage

### JavaScript/Fetch
```javascript
// Get nearby activities
const response = await fetch('http://localhost:3001/api/activities/nearby?lat=37.7749&lng=-122.4194&limit=5');
const data = await response.json();
console.log(data.data); // Array of nearby activities
```

### cURL
```bash
# Test the API
curl "http://localhost:3001/api/activities/nearby?lat=37.7749&lng=-122.4194&limit=3"

# Health check
curl "http://localhost:3001/api/health"
```
