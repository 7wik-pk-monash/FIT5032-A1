<template>
  <section class="container py-5">
    <h1 class="mb-4">{{ isEditMode ? 'Edit Sport Activity' : 'Create New Sport Activity' }}</h1>

    <form @submit.prevent="submitActivity">

      <div class="row">

        <div class="mb-3 col-md-6">
          <label class="form-label">Activity Name</label>
          <input type="text" class="form-control" v-model="activity.title" required />
        </div>

        <div class="mb-3 col-md-6">
          <label class="form-label">Date & Time</label>
          <input type="datetime-local" class="form-control" v-model="activity.datetime" required/>
        </div>

      </div>

      <div class="row">
        <div class="mb-3 col-md-6">
          <label class="form-label">Sport Type</label>

          <select class="form-select" v-model="activity.sport">
            <option disabled value="">Select sport</option>
            <option value="football">Football</option>
            <option value="cricket">Cricket</option>
            <option value="tennis">Tennis</option>
            <option value="walking">Walking Group</option>
          </select>
          <small v-if="errors.sport" class="text-danger">{{ errors.sport }}</small>
        </div>

        <div class="mb-3 col-md-6">
          <label class="form-label">Maximum Attendees</label>
          <input
            type="number"
            class="form-control"
            v-model.number="activity.capacity"
            min="1"
          />
          <small v-if="errors.capacity" class="text-danger">{{ errors.capacity }}</small>
        </div>
      </div>

      <div class="row">

        <div class="mb-3 col-md-6">
          <label class="form-label">Age Group</label>
          <select class="form-select" v-model="activity.age">
            <option disabled value="">Select age group</option>
            <option value="kids">Kids</option>
            <option value="youth">Youth</option>
            <option value="adults">Adults</option>
            <option value="seniors">Seniors</option>
          </select>
          <small v-if="errors.age" class="text-danger">{{ errors.age }}</small>
        </div>

        <div class="mb-3 col-md-6">
          <label class="form-label">Accessibility</label>
          <select class="form-select" v-model="activity.accessibility">
            <option disabled value="">Select accessibility</option>
            <option value="wheelchair">Wheelchair Accessible</option>
            <option value="inclusive">Inclusive (LGBTQ+, Women Only, etc.)</option>
            <option value="open">Open to All</option>
          </select>
          <small v-if="errors.accessibility" class="text-danger">{{ errors.accessibility }}</small>
        </div>

      </div>


      <div class="mb-3">
        <label class="form-label">Location Address</label>
        <input
          type="text"
          class="form-control"
          v-model="addressInput"
          placeholder="Type address"
          @blur="geocodeAddress"
        />

        <!-- Playground Validation Status -->
        <div v-if="playgroundValidation.loading" class="mt-2">
          <div class="d-flex align-items-center">
            <div class="spinner-border spinner-border-sm text-primary me-2" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <small class="text-muted">Checking if location is a playground...</small>
          </div>
        </div>

        <div v-else-if="playgroundValidation.isValid === true" class="mt-2">
          <div class="alert alert-success py-2">
            <i class="fas fa-check-circle me-2"></i>
            <strong>Great choice!</strong> This location is a {{ playgroundValidation.type }}:
            <em>{{ playgroundValidation.name }}</em>
          </div>
        </div>

        <div v-else-if="playgroundValidation.isValid === false" class="mt-2">
          <div class="alert alert-warning py-2">
            <i class="fas fa-exclamation-triangle me-2"></i>
            <strong>Note:</strong> This location doesn't appear to be a registered playground or park area.
            You can still create an activity here, but please ensure it's appropriate for public use.
          </div>
        </div>

        <div v-else-if="playgroundValidation.error" class="mt-2">
          <div class="alert alert-info py-2">
            <i class="fas fa-info-circle me-2"></i>
            <small>Could not verify playground status. You can still create an activity here.</small>
          </div>
        </div>
      </div>

      <div class="mb-3">
        <label class="form-label">Or Set Location on Map</label>
        <div id="map" style="height: 300px; position: relative;"></div>

        <!-- Loading overlay for finding nearest playground -->
        <div v-if="findingNearestPlayground" class="map-loading-overlay">
          <div class="loading-content">
            <div class="spinner-border text-primary mb-3" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mb-0 text-primary fw-medium">Finding nearest playground...</p>
          </div>
        </div>

        <p class="mt-2 text-muted">Click anywhere on the map to set the location.</p>
        <small v-if="errors.location" class="text-danger">{{ errors.location }}</small>
      </div>

      <div class="mb-3">
        <div class="form-check">
          <input
            class="form-check-input"
            type="checkbox"
            id="attendingCheckbox"
            v-model="userAttending"
          />
          <label class="form-check-label" for="attendingCheckbox">
            I am attending this activity
          </label>
        </div>
      </div>

      <button class="btn btn-primary btn-lg mt-3" type="submit">{{ isEditMode ? 'Update Activity' : 'Create Activity' }}</button>
    </form>

    <div v-if="conflicts.length" class="alert alert-warning mt-4">
      <h5>Conflict with existing activities:</h5>
      <ul class="mb-0">
        <li v-for="(c, index) in conflicts" :key="index">
          <strong>{{ c.title }}</strong> ({{ c.sport }}) - {{ c.distance }}m away, {{ c.timeDiff }}min apart<br />
          <small class="text-muted">Scheduled for {{ new Date(c.datetime).toLocaleString() }}</small>
        </li>
      </ul>
      <p class="mt-2">You cannot create activities within 100m or within 30 minutes of existing activities. Please choose a different time or location.</p>
    </div>


  </section>
</template>

<style scoped>
.map-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  border-radius: 8px;
}

.loading-content {
  text-align: center;
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.spinner-border {
  width: 2rem;
  height: 2rem;
}
</style>

<script setup>
import { ref, onMounted } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { toast } from 'vue3-toastify'
import { useData } from '../composables/useData.js'
import { useAuth } from '../composables/useAuth.js'
import { useRouter, useRoute } from 'vue-router'

const { activities, playgrounds, addActivity, updateActivity, getActivityById } = useData()
const { user } = useAuth()
const router = useRouter()
const route = useRoute()

// Function to get tomorrow's date at 7 AM
function getTomorrow7AM() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(7, 0, 0, 0)

  // Format for datetime-local input (YYYY-MM-DDTHH:MM)
  const year = tomorrow.getFullYear()
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0')
  const day = String(tomorrow.getDate()).padStart(2, '0')
  const hours = String(tomorrow.getHours()).padStart(2, '0')
  const minutes = String(tomorrow.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

// Function to get user's location via geolocation
async function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords

        try {
          // Reverse geocode to get address
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          )
          const data = await response.json()

          resolve({
            lat: latitude,
            lng: longitude,
            address: data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          })
        } catch {
          // Fallback to coordinates if geocoding fails
          resolve({
            lat: latitude,
            lng: longitude,
            address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          })
        }
      },
      (error) => {
        reject(error)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  })
}

// Reactive activity object with defaults
const activity = ref({
  title: '',
  datetime: getTomorrow7AM(),
  sport: '',
  capacity: 10,
  location: {
    address: "Melbourne, Australia",
    lat: -37.8136,
    lng: 144.9631
  },
  rsvps: 0,
  age: '',
  accessibility: 'open'
})

const addressInput = ref('')
const userAttending = ref(true) // Checked by default
const isEditMode = ref(false)
const editingActivityId = ref(null)

// Leaflet map + marker references
let map
let marker

// Load activity for editing
async function loadActivityForEdit(activityId) {
  try {
    const activityData = await getActivityById(activityId)
    if (activityData) {
      editingActivityId.value = activityId
      isEditMode.value = true

      // Pre-fill form with existing data
      activity.value.title = activityData.title
      activity.value.datetime = `${activityData.date}T${activityData.time}`
      activity.value.sport = activityData.sport
      activity.value.capacity = activityData.capacity
      activity.value.location = {
        address: activityData.location,
        lat: activityData.lat || -37.8136,
        lng: activityData.lng || 144.9631
      }
      activity.value.age = activityData.age
      activity.value.accessibility = activityData.accessibility || 'open' // Default to 'open' if not set
      userAttending.value = activityData.rsvps > 0

      // Set address input
      addressInput.value = activityData.location
    }
  } catch (error) {
    console.error('Error loading activity for edit:', error)
    toast.error('Failed to load activity data', { autoClose: 3000 })
  }
}

// Initialize map
onMounted(async () => {
    // Try to get user's location and find nearest playground (only for new activities, not edits)
    if (!route.query.edit) {
      try {
        const userLocation = await getUserLocation()

        // Try to find the nearest playground/sports facility to user's location
        findingNearestPlayground.value = true
        const nearestPlayground = await findNearestPlayground(userLocation.lat, userLocation.lng)
        findingNearestPlayground.value = false

        if (nearestPlayground.found) {
          // Use the nearest playground as the default location
          activity.value.location = {
            address: nearestPlayground.name,
            lat: nearestPlayground.lat,
            lng: nearestPlayground.lng
          }
          addressInput.value = nearestPlayground.name

          // Mark as valid playground since we found it via OSM
          playgroundValidation.value = {
            isValid: true,
            name: nearestPlayground.name,
            type: nearestPlayground.type,
            loading: false
          }

          const distanceText = nearestPlayground.distance < 1
            ? `${Math.round(nearestPlayground.distance * 1000)}m away`
            : `${nearestPlayground.distance.toFixed(1)}km away`

          toast.success(`Found nearest ${nearestPlayground.type}: ${nearestPlayground.name} (${distanceText})`, { autoClose: 4000 })
        } else {
          // Fall back to user's location if no playground found
          activity.value.location = userLocation
          addressInput.value = userLocation.address

          // Validate if user's location is a playground
          playgroundValidation.value.loading = true
          const validation = await validateLocationIsPlayground(userLocation.lat, userLocation.lng)
          playgroundValidation.value = { ...validation, loading: false }

          toast.info('No nearby playgrounds found, using your current location', { autoClose: 3000 })
        }
      } catch (error) {
        console.log('Could not get user location or find playground:', error)
        // Keep default Melbourne location
        toast.info('Using default Melbourne location', { autoClose: 2000 })
      }
    }

  map = L.map('map').setView([activity.value.location.lat, activity.value.location.lng], 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map)

  marker = L.marker([activity.value.location.lat, activity.value.location.lng]).addTo(map)

    // Place marker on map click
    map.on('click', async (e) => {
      const { lat, lng } = e.latlng
      activity.value.location = {
        address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, // Temporary coordinates
        lat: lat,
        lng: lng
      }
      marker.setLatLng([lat, lng])

      // Validate if location is a playground
      playgroundValidation.value.loading = true
      const validation = await validateLocationIsPlayground(lat, lng)
      playgroundValidation.value = { ...validation, loading: false }

      // Reverse geocode to get proper address
      reverseGeocode(lat, lng)
    })

  // Check if we're in edit mode
  if (route.query.edit) {
    await loadActivityForEdit(route.query.edit)
    // Update map view to show the activity location
    map.setView([activity.value.location.lat, activity.value.location.lng], 15)
    marker.setLatLng([activity.value.location.lat, activity.value.location.lng])
  } else {
    // For new activities, set address input to current location
    addressInput.value = activity.value.location.address
  }
})

// Reverse geocoding function (coordinates to address)
function reverseGeocode(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      if (data && data.display_name) {
        activity.value.location.address = data.display_name.split(',').slice(0, 3).join(', ')
        addressInput.value = data.display_name // Update the address input field too
      }
    })
    .catch((error) => {
      console.error('Reverse geocoding error:', error)
      // Keep the coordinates as fallback address
    })
}

// Forward geocoding function (address to coordinates)
async function geocodeAddress() {
  if (!addressInput.value) return

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressInput.value)}`
    const response = await fetch(url)
    const data = await response.json()

    if (data.length > 0) {
      // data[0] is the first result
      const loc = data[0]
      const lat = +loc.lat
      const lng = +loc.lon

      activity.value.location = {
        address: loc.display_name,
        lat: lat,
        lng: lng
      }
      map.setView([lat, lng], 15)
      marker.setLatLng([lat, lng])

      // Validate if location is a playground
      playgroundValidation.value.loading = true
      const validation = await validateLocationIsPlayground(lat, lng)
      playgroundValidation.value = { ...validation, loading: false }
    } else {
      toast.error('Address not found. Please try a different address.')
    }
  } catch (error) {
    console.error('Geocoding error:', error)
    toast.error('Failed to find address. Please try again.')
  }
}

// form validation
const errors = ref({
  datetime: null,
  sport: null,
  capacity: null,
  location: null,
  age: null,
  accessibility: null,
});

const conflicts = ref([])
const playgroundValidation = ref({
  isValid: null, // null = not checked, true = valid, false = invalid
  name: null,
  type: null,
  loading: false
})

const findingNearestPlayground = ref(false)

// Helper function to find coordinates for an activity location
function findCoordinatesForActivity(locationData) {
  // If locationData is an object with lat/lng, use those coordinates directly
  if (locationData && typeof locationData === 'object' && locationData.lat && locationData.lng) {
    return {
      lat: locationData.lat,
      lng: locationData.lng
    }
  }

  // If locationData is a string, try to match with playground names
  if (typeof locationData === 'string' && playgrounds.value.length > 0) {
    const matchingPlayground = playgrounds.value.find(playground => {
      // Check if location contains the playground name (case-insensitive)
      return locationData.toLowerCase().includes(playground.name.toLowerCase())
    })

    if (matchingPlayground) {
      return {
        lat: matchingPlayground.lat,
        lng: matchingPlayground.lng
      }
    }
  }

  return null
}

// Function to find the nearest playground/sports facility to user's location
async function findNearestPlayground(userLat, userLng) {
  try {
    // Start with a small radius and increase if no results
    const radii = [500, 1000, 2000, 5000] // 500m, 1km, 2km, 5km

    for (const radius of radii) {
      const query = `
        [out:json][timeout:25];
        (
          way["leisure"="playground"](around:${radius},${userLat},${userLng});
          way["leisure"="park"](around:${radius},${userLat},${userLng});
          way["leisure"="recreation_ground"](around:${radius},${userLat},${userLng});
          way["leisure"="sports_centre"](around:${radius},${userLat},${userLng});
          way["leisure"="stadium"](around:${radius},${userLat},${userLng});
          way["leisure"="pitch"](around:${radius},${userLat},${userLng});
          way["amenity"="playground"](around:${radius},${userLat},${userLng});
          way["amenity"="sports_centre"](around:${radius},${userLat},${userLng});
          way["amenity"="stadium"](around:${radius},${userLat},${userLng});
          node["leisure"="playground"](around:${radius},${userLat},${userLng});
          node["leisure"="park"](around:${radius},${userLat},${userLng});
          node["leisure"="sports_centre"](around:${radius},${userLat},${userLng});
          node["leisure"="stadium"](around:${radius},${userLat},${userLng});
          node["amenity"="playground"](around:${radius},${userLat},${userLng});
          node["amenity"="sports_centre"](around:${radius},${userLat},${userLng});
          node["amenity"="stadium"](around:${radius},${userLat},${userLng});
        );
        out center;
      `

      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(query)}`
      })

      if (!response.ok) continue

      const data = await response.json()

      if (data.elements && data.elements.length > 0) {
        // Find the closest one to user's location
        let closest = null
        let closestDistance = Infinity

        for (const element of data.elements) {
          const center = element.center || element.lat ? { lat: element.lat, lon: element.lon } : null
          if (!center) continue

          const distance = haversineDistance(userLat, userLng, center.lat, center.lon)
          if (distance < closestDistance) {
            closestDistance = distance
            closest = element
          }
        }

        if (closest) {
          const center = closest.center || { lat: closest.lat, lon: closest.lon }
          const name = closest.tags?.name || 'Nearby Recreation Area'

          // Determine type
          let type = 'recreation area'
          const tags = closest.tags || {}
          if (tags.leisure === 'playground') type = 'playground'
          else if (tags.leisure === 'park') type = 'park'
          else if (tags.leisure === 'stadium' || tags.amenity === 'stadium') type = 'stadium'
          else if (tags.leisure === 'sports_centre' || tags.amenity === 'sports_centre') type = 'sports centre'
          else if (tags.leisure === 'pitch') type = 'sports pitch'

          return {
            found: true,
            lat: center.lat,
            lng: center.lon,
            name: name,
            type: type,
            distance: closestDistance
          }
        }
      }
    }

    return { found: false }

  } catch (error) {
    console.error('Error finding nearest playground:', error)
    return { found: false, error: error.message }
  }
}

// Function to validate if a location is a playground or public play area using OpenStreetMap
async function validateLocationIsPlayground(lat, lng) {
  try {
    // Define the radius to search around the point (in meters)
    const radius = 100

    // Overpass API query to find playgrounds, parks, recreational areas, and sports facilities
    const query = `
      [out:json][timeout:25];
      (
        way["leisure"="playground"](around:${radius},${lat},${lng});
        way["leisure"="park"](around:${radius},${lat},${lng});
        way["leisure"="recreation_ground"](around:${radius},${lat},${lng});
        way["leisure"="sports_centre"](around:${radius},${lat},${lng});
        way["leisure"="stadium"](around:${radius},${lat},${lng});
        way["leisure"="pitch"](around:${radius},${lat},${lng});
        way["leisure"="track"](around:${radius},${lat},${lng});
        way["leisure"="golf_course"](around:${radius},${lat},${lng});
        way["amenity"="playground"](around:${radius},${lat},${lng});
        way["amenity"="sports_centre"](around:${radius},${lat},${lng});
        way["amenity"="stadium"](around:${radius},${lat},${lng});
        way["landuse"="recreation_ground"](around:${radius},${lat},${lng});
        way["sport"](around:${radius},${lat},${lng});
        way["name"~"oval"](around:${radius},${lat},${lng});
        way["name"~"stadium"](around:${radius},${lat},${lng});
        way["name"~"sports"](around:${radius},${lat},${lng});
        way["name"~"ground"](around:${radius},${lat},${lng});
        node["leisure"="playground"](around:${radius},${lat},${lng});
        node["leisure"="park"](around:${radius},${lat},${lng});
        node["leisure"="sports_centre"](around:${radius},${lat},${lng});
        node["leisure"="stadium"](around:${radius},${lat},${lng});
        node["amenity"="playground"](around:${radius},${lat},${lng});
        node["amenity"="sports_centre"](around:${radius},${lat},${lng});
        node["amenity"="stadium"](around:${radius},${lat},${lng});
      );
      out geom;
    `

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(query)}`
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    // Check if we found any playground/recreation areas
    const hasPlayground = data.elements && data.elements.length > 0

    if (hasPlayground) {
      // Get the name of the first found playground/park/sports facility
      const firstElement = data.elements[0]
      const name = firstElement.tags?.name ||
                   firstElement.tags?.['name:en'] ||
                   'Recreation Area'

      // Determine a user-friendly type based on OSM tags
      let type = 'recreation area'
      const tags = firstElement.tags || {}

      if (tags.leisure === 'playground') {
        type = 'playground'
      } else if (tags.leisure === 'park') {
        type = 'park'
      } else if (tags.leisure === 'stadium' || tags.amenity === 'stadium') {
        type = 'stadium'
      } else if (tags.leisure === 'sports_centre' || tags.amenity === 'sports_centre') {
        type = 'sports centre'
      } else if (tags.leisure === 'pitch') {
        type = 'sports pitch'
      } else if (tags.leisure === 'track') {
        type = 'sports track'
      } else if (tags.leisure === 'golf_course') {
        type = 'golf course'
      } else if (tags.sport) {
        type = `${tags.sport} facility`
      } else if (tags.name?.toLowerCase().includes('oval')) {
        type = 'sports oval'
      } else if (tags.name?.toLowerCase().includes('stadium')) {
        type = 'stadium'
      } else if (tags.name?.toLowerCase().includes('ground')) {
        type = 'sports ground'
      }

      return {
        isValid: true,
        name: name,
        type: type
      }
    }

    return {
      isValid: false,
      name: null,
      type: null
    }

  } catch (error) {
    console.error('Error validating playground location:', error)
    // Return a neutral result if the API call fails
    return {
      isValid: null, // null means we couldn't determine
      name: null,
      type: null,
      error: error.message
    }
  }
}

// TODO: move to cloud function
function checkForConflicts(newActivity) {
  const conflicts = []
  const newCoordinates = findCoordinatesForActivity(newActivity.location)

  for (const existing of activities.value) {
    // Skip activities that don't have date/time fields
    if (!existing.date || !existing.time) {
      continue
    }

    // Convert existing activity's separate date/time to datetime string
    const existingDateTime = `${existing.date}T${existing.time}`
    const existingDate = new Date(existingDateTime)
    const newDate = new Date(newActivity.datetime)

    // Skip if either date is invalid
    if (isNaN(existingDate.getTime()) || isNaN(newDate.getTime())) {
      continue
    }

    const timeDiff = Math.abs(newDate - existingDate)
    const minutesDiff = timeDiff / (1000 * 60)

    // Only check distance if we have coordinates for both activities
    if (newCoordinates) {
      const existingCoordinates = findCoordinatesForActivity(existing.location)

      if (existingCoordinates) {
        const distance = haversineDistance(
          newCoordinates.lat,
          newCoordinates.lng,
          existingCoordinates.lat,
          existingCoordinates.lng
        )

        if (minutesDiff <= 30 && distance <= 0.1) {
          conflicts.push({
            title: existing.title,
            datetime: existingDateTime,
            sport: existing.sport,
            distance: Math.round(distance * 1000), // meters
            timeDiff: Math.round(minutesDiff),
          })
        }
      } else if (minutesDiff <= 30) {
        // If we can't get coordinates for existing activity, just check time
        conflicts.push({
          title: existing.title,
          datetime: existingDateTime,
          sport: existing.sport,
          distance: 'N/A',
          timeDiff: Math.round(minutesDiff),
        })
      }
    } else if (minutesDiff <= 30) {
      // If we can't get coordinates for new activity, just check time
      conflicts.push({
        title: existing.title,
        datetime: existingDateTime,
        sport: existing.sport,
        distance: 'N/A',
        timeDiff: Math.round(minutesDiff),
      })
    }
  }

  return conflicts
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // in km
};

function validateActivity() {
  errors.value = {}

  if (!activity.value.datetime) {
    errors.value.datetime = 'Please select a date & time.'
  } else if (new Date(activity.value.datetime) < new Date()) {
    errors.value.datetime = 'Date & time must be in the future.'
  }

  if (!activity.value.sport) {
    errors.value.sport = 'Please select a sport type.'
  }

  if (!activity.value.capacity || activity.value.capacity < 1) {
    errors.value.capacity = 'Capacity must be at least 1.'
  }

  if (!activity.value.location || !activity.value.location.address) {
    errors.value.location = 'Please choose a location (map or address).'
  }

  if (!activity.value.age) {
    errors.value.age = 'Please select an age group.'
  }

  if (!activity.value.accessibility) {
    errors.value.accessibility = 'Please select an accessibility.'
  }

  return Object.keys(errors.value).length === 0
};

// Save activity to Firestore
async function submitActivity() {
  if (!validateActivity()) {
    toast.error('Please fix the errors in the form.', {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
    return
  }

  const detected = checkForConflicts(activity.value)
  if (detected.length > 0) {
    conflicts.value = detected
    return
  } else {
    conflicts.value = []
  }

  try {

    const activityData = {
      title: activity.value.title,
      date: activity.value.datetime.split('T')[0],
      time: activity.value.datetime.split('T')[1],
      sport: activity.value.sport,
      capacity: activity.value.capacity,
      location: activity.value.location.address,
      lat: activity.value.location.lat,
      lng: activity.value.location.lng,
      rsvps: userAttending.value ? 1 : 0, // Increment by 1 if user is attending
      age: activity.value.age,
      accessibility: activity.value.accessibility,
      createdBy: user.value.uid // Track who created this activity
    }

    // Save to Firestore
    if (isEditMode.value) {
      await updateActivity(editingActivityId.value, activityData)
      toast.success('Activity updated successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } else {
      await addActivity(activityData)
      toast.success('Activity created successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }

    // Redirect to events page
    router.push('/events')
  } catch (error) {
    console.error('Error creating activity:', error)
    toast.error('Failed to create activity. Please try again.', {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  }
}
</script>

<style scoped>
#map {
  border: 1px solid #ccc;
  border-radius: 0.5rem;
}
</style>
