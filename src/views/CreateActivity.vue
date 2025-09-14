<template>
  <section class="container py-5">
    <h1 class="mb-4">Create New Sport Activity</h1>

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

      <button class="btn btn-primary btn-lg mt-3" type="submit">Create Activity</button>
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
import { Toast } from 'bootstrap'

// Reactive activity object
const activity = ref({
  title: '',
  datetime: '',
  sport: '',
  capacity: 10,
  location: { lat: -37.8136, lng: 144.9631 },
  rsvps: 0,
})

const addressInput = ref('')

// Leaflet map + marker references
let map
let marker

// Initialize map
onMounted(() => {
  map = L.map('map').setView([activity.value.location.lat, activity.value.location.lng], 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map)

  marker = L.marker([activity.value.location.lat, activity.value.location.lng]).addTo(map)

  // Place marker on map click
  map.on('click', (e) => {
    const { lat, lng } = e.latlng
    activity.value.location = { lat, lng }
    marker.setLatLng([lat, lng])
  })
})

// Geocoding function
function geocodeAddress() {
  if (!addressInput.value) return

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressInput.value)}`
  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      if (data.length > 0) {
        const loc = data[0]
        activity.value.location = { lat: +loc.lat, lng: +loc.lon }
        map.setView([+loc.lat, +loc.lon], 15)
        marker.setLatLng([+loc.lat, +loc.lon])
      }
    })
}

// form validation
const errors = ref({
  datetime: null,
  sport: null,
  capacity: null,
  location: null,
});

const conflicts = ref([])

function checkForConflicts(newActivity) {
  const existingActivities = JSON.parse(localStorage.getItem('activities') || '[]')
  const conflicts = []

  for (const existing of existingActivities) {
    const timeDiff = Math.abs(new Date(existing.datetime) - new Date(newActivity.datetime))
    const minutesDiff = timeDiff / (1000 * 60)

    const distance = haversineDistance(
      newActivity.location.lat,
      newActivity.location.lng,
      existing.location.lat,
      existing.location.lng
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

  if (!activity.value.location || !activity.value.location.lat || !activity.value.location.lng) {
    errors.value.location = 'Please choose a location (map or address).'
  }

  return Object.keys(errors.value).length === 0
};

function generateId() {
  const existing = JSON.parse(localStorage.getItem('activities') || '[]')
  const maxId = existing.reduce((max, a) => Math.max(max, a.id || 0), 0)
  return maxId + 1
}

// Save activity to localStorage
function submitActivity() {

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

  // upon successful validation, save to localStorage
  const activities = JSON.parse(localStorage.getItem('activities') || '[]')
  activity.value.id = generateId()
  activities.push(activity.value)
  localStorage.clear();
  localStorage.setItem('activities', JSON.stringify(activities))
  // alert('Activity created!')
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
</script>

<style scoped>
#map {
  border: 1px solid #ccc;
  border-radius: 0.5rem;
}
</style>
