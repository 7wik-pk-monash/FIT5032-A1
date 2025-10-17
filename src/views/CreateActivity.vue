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
      </div>

      <div class="mb-3">
        <label class="form-label">Or Set Location on Map</label>
        <div id="map" style="height: 300px"></div>
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
  // Try to get user's location first (only for new activities, not edits)
  if (!route.query.edit) {
    try {
      const userLocation = await getUserLocation()
      activity.value.location = userLocation
      addressInput.value = userLocation.address

      // Show a subtle notification that we got their location
      toast.info('Using your current location', { autoClose: 2000 })
    } catch (error) {
      console.log('Could not get user location:', error)
      // Keep default Melbourne location
    }
  }

  map = L.map('map').setView([activity.value.location.lat, activity.value.location.lng], 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map)

  marker = L.marker([activity.value.location.lat, activity.value.location.lng]).addTo(map)

  // Place marker on map click
  map.on('click', (e) => {
    const { lat, lng } = e.latlng
    activity.value.location = {
      address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, // Temporary coordinates
      lat: lat,
      lng: lng
    }
    marker.setLatLng([lat, lng])

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
function geocodeAddress() {
  if (!addressInput.value) return

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressInput.value)}`
  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      if (data.length > 0) {
        // data[0] is the first result
        const loc = data[0]
        activity.value.location = {
          address: loc.display_name,
          lat: +loc.lat,
          lng: +loc.lon
        }
        map.setView([activity.value.location.lat, activity.value.location.lng], 15)
        marker.setLatLng([activity.value.location.lat, activity.value.location.lng])
      } else {
        toast.error('Address not found. Please try a different address.')
      }
    })
    .catch((error) => {
      console.error('Geocoding error:', error)
      toast.error('Failed to find address. Please try again.')
    })
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

// Helper function to find coordinates for an activity location
function findCoordinatesForActivity(locationString) {
  if (!locationString || !playgrounds.value.length) return null

  // Try to match location with playground names
  const matchingPlayground = playgrounds.value.find(playground => {
    // Check if location contains the playground name (case-insensitive)
    return locationString.toLowerCase().includes(playground.name.toLowerCase())
  })

  if (matchingPlayground) {
    return {
      lat: matchingPlayground.lat,
      lng: matchingPlayground.lng
    }
  }

  return null
}

// TODO: move to cloud function
function checkForConflicts(newActivity) {
  const conflicts = []
  const newCoordinates = findCoordinatesForActivity(newActivity.location.address)

  for (const existing of activities.value) {
    const timeDiff = Math.abs(new Date(existing.datetime) - new Date(newActivity.datetime))
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
            datetime: existing.datetime,
            sport: existing.sport,
            distance: Math.round(distance * 1000), // meters
            timeDiff: Math.round(minutesDiff),
          })
        }
      } else if (minutesDiff <= 30) {
        // If we can't get coordinates for existing activity, just check time
        conflicts.push({
          title: existing.title,
          datetime: existing.datetime,
          sport: existing.sport,
          distance: 'N/A',
          timeDiff: Math.round(minutesDiff),
        })
      }
    } else if (minutesDiff <= 30) {
      // If we can't get coordinates for new activity, just check time
      conflicts.push({
        title: existing.title,
        datetime: existing.datetime,
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
