// Simple test script for the API server
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

async function testAPI() {
  console.log('Testing API endpoints...\n');

  try {
    // Test health check
    console.log('1. Testing health check...');
    const healthResponse = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log('Health check result:', healthData);
    console.log('Status:', healthResponse.status);
    console.log('');

    // Test activities endpoint
    console.log('2. Testing activities endpoint...');
    const activitiesResponse = await fetch(`${BASE_URL}/api/activities?limit=3`);
    const activitiesData = await activitiesResponse.json();
    console.log('Activities result:', activitiesData);
    console.log('Status:', activitiesResponse.status);
    console.log('');

    // Test nearby activities endpoint
    console.log('3. Testing nearby activities endpoint...');
    const nearbyResponse = await fetch(`${BASE_URL}/api/activities/nearby?lat=-37.8136&lng=144.9631&limit=3`);
    const nearbyData = await nearbyResponse.json();
    console.log('Nearby activities result:', nearbyData);
    console.log('Status:', nearbyResponse.status);
    console.log('');

    // Test donation endpoint
    console.log('4. Testing donation endpoint...');
    const donationResponse = await fetch(`${BASE_URL}/api/donations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        donorName: 'Test User',
        donorEmail: 'test@example.com',
        donationAmount: 25.00
      })
    });
    const donationData = await donationResponse.json();
    console.log('Donation result:', donationData);
    console.log('Status:', donationResponse.status);

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAPI();
