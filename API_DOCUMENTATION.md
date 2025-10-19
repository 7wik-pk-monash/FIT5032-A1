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

### 4. Process Donation
**POST** `/api/donations`

Processes a donation and sends a receipt email to the donor.

**Request Body:**
```json
{
  "donorName": "John Doe",
  "donorEmail": "john@example.com",
  "donationAmount": 100.50
}
```

**Required Fields:**
- `donorName` (string): Full name of the donor
- `donorEmail` (string): Valid email address of the donor
- `donationAmount` (number): Positive donation amount

**Response:**
```json
{
  "success": true,
  "message": "Thank you for your donation of $100.50 AUD! A receipt has been sent to john@example.com",
  "receiptNumber": "TUP-1697685123456",
  "emailSent": true,
  "timestamp": "2025-10-19T05:37:04.824Z"
}
```

**Error Responses:**
- `400`: Bad Request (missing fields, invalid email, or invalid amount)
- `500`: Internal Server Error (email sending failed)

**Example Request:**
```bash
curl -X POST http://localhost:3001/api/donations \
  -H "Content-Type: application/json" \
  -d '{"donorName":"Jane Smith","donorEmail":"jane@example.com","donationAmount":75.00}'
```

## Running the API

### Development
```bash
# Start API server only
node api-server-simple.js

# Start both Vue app and API server
npm run dev:full
```

### Production
```bash
# Build and start both Vue app and API server
npm run build:full

# Start both servers (after build)
npm run start:full
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
# Health check
curl "http://localhost:3001/api/health"

# Get all activities
curl "http://localhost:3001/api/activities"

# Get activities with limit
curl "http://localhost:3001/api/activities?limit=5"

# Get nearby activities (WT Peterson Oval)
curl "http://localhost:3001/api/activities/nearby?lat=-37.78901304581446&lng=144.98125371269705&limit=5"

# Get nearby activities (Carlton Gardens)
curl "http://localhost:3001/api/activities/nearby?lat=-37.805442618848176&lng=144.97137684649525&limit=3"

# Process donation (valid)
curl -X POST http://localhost:3001/api/donations \
  -H "Content-Type: application/json" \
  -d '{"donorName":"John Doe","donorEmail":"ferntreegully036@gmail.com","donationAmount":50.00}'

# Test donation validation (invalid email)
curl -X POST http://localhost:3001/api/donations \
  -H "Content-Type: application/json" \
  -d '{"donorName":"Jane Smith","donorEmail":"invalid-email","donationAmount":25.00}'

# Test donation validation (negative amount)
curl -X POST http://localhost:3001/api/donations \
  -H "Content-Type: application/json" \
  -d '{"donorName":"Bob Wilson","donorEmail":"bob@example.com","donationAmount":-10}'

# Test donation validation (missing fields)
curl -X POST http://localhost:3001/api/donations \
  -H "Content-Type: application/json" \
  -d '{"donorName":"Alice Brown"}'

# Test invalid endpoint (404)
curl "http://localhost:3001/api/invalid"
```
