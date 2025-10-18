<!-- eslint-disable vue/multi-word-component-names -->
<template>

  <section class="container py-5" id="events-page">
    <h1 class="page-title text-center mb-4">Find Activities & Programs</h1>

    <!-- Filters Row -->
    <div class="row mb-3">

        <div class="col-6 col-md-6 col-lg-3 mb-3" v-for="filter in filtersList" :key="filter.key">

          <div v-if="filter.type === 'select'">
            <select v-model="filters[filter.key]" class="form-select">
              <option disabled value="">{{ filter.label }}</option>
              <option v-for="option in filter.options" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>

          <div v-else-if="filter.type === 'range'">
            <label class="form-label">{{ filter.label }}</label>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              v-model="filters.distance"
              class="form-range"
            />
            <p class="distance-text">Within {{ filters.distance }} km</p>
          </div>

        </div>
      </div>

    <!-- Buttons Row -->
    <div class="row mb-4">

      <div class="col-12 d-flex gap-2 justify-content-center">
        <button class="btn btn-outline-primary" @click="searchEvents">Search</button>
        <router-link to="/create-activity" class="btn btn-success">Create Activity</router-link>
      </div>

    </div>

    <!-- Split layout: Map + Event Cards -->
    <div class="row">

      <div class="col-12 col-lg-8 mb-4 mb-lg-0">
        <div id="events-map" style="height: 600px; border-radius: 0.5rem"></div>
      </div>

      <div class="col-12 col-lg-4">
        <div class="events-list" style="max-height: 600px; overflow-y: auto">
          <div
            v-for="(program, index) in filteredPrograms"
            :key="program.id"
            class="card mb-3"
            :class="{ 'border-primary': selectedIndex === index }"
            @click="selectCard(index)"
            style="cursor: pointer"
          >
            <div class="card-body">
              <h5 class="card-title">{{ program.title }}</h5>
              <p class="card-text">
                <strong>Location:</strong> {{ program.location }}<br />
                <strong>Date:</strong> {{ program.date }} at {{ program.time }}<br />
                <strong>Sport:</strong> {{ program.sport }}<br />
                <strong>Participants:</strong> {{ (program.rsvps || []).length }}/{{ program.capacity }}<br />
                <strong>Age Group:</strong> {{ program.age }}<br />
                <strong>Accessibility:</strong> {{ program.accessibility }}
              </p>

              <div v-if="program.averageRating" class="mb-2">
                <span class="badge text-white bg-primary">
                  ⭐ {{ program.averageRating }}/5 ({{ program.reviewCount }} review{{ program.reviewCount !== 1 ? 's' : '' }})
                </span>
                <button
                  class="btn btn-sm btn-outline-secondary ms-2"
                  @click.stop="openRatingModal(program.location)"
                >
                  {{ hasUserRated(program.location) ? 'Change your rating/review' : 'Rate Playground' }}
                </button>
              </div>

              <div v-else class="mb-2">
                <button
                  class="btn btn-sm btn-outline-secondary"
                  @click.stop="openRatingModal(program.location)"
                >
                  Rate Playground
                </button>
              </div>

              <!-- Join/Leave buttons -->
              <div v-if="user" class="mb-2">
                <button
                  v-if="!isUserJoined(program)"
                  class="btn btn-sm btn-success"
                  @click.stop="handleJoinActivity(program.id)"
                  :disabled="isActivityFull(program)"
                >
                  {{ isActivityFull(program) ? 'Activity Full' : 'Join Activity' }}
                </button>
                <button
                  v-else
                  class="btn btn-sm btn-warning"
                  @click.stop="handleLeaveActivity(program.id)"
                >
                  Leave Activity
                </button>
              </div>

              <!-- Edit/Delete buttons for activity creator -->
              <div v-if="user && program.createdBy === user.uid" class="mt-2">
                <button
                  class="btn btn-sm btn-outline-primary me-2"
                  @click.stop="editActivity(program)"
                >
                  Edit Activity
                </button>
                <button
                  class="btn btn-sm btn-outline-danger"
                  @click.stop="deleteActivity(program.id)"
                >
                  Delete Activity
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Rating Modal -->
    <div v-if="showModal" class="modal show d-block" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ hasUserRated(modalPlayground) ? 'Change your rating for' : 'Rate' }} Playground: {{ modalPlayground }}</h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Rating (1-5 stars)</label>
              <div class="rating">
                <span
                  v-for="star in 5"
                  :key="star"
                  @click="selectedRating = star"
                  :class="{ 'text-warning': star <= selectedRating, 'text-muted': star > selectedRating }"
                  style="font-size: 1.5rem; cursor: pointer"
                >
                  ★
                </span>
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label">Comment (optional)</label>
              <textarea
                v-model="ratingComment"
                class="form-control"
                rows="3"
                placeholder="Share your experience..."
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">Cancel</button>
            <button type="button" class="btn btn-primary" @click="submitRating">
              {{ hasUserRated(modalPlayground) ? 'Update Rating' : 'Submit Rating' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Backdrop -->
    <div v-if="showModal" class="modal-backdrop show">    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header border-0">
            <h5 class="modal-title text-danger">
              <i class="bi bi-exclamation-triangle-fill me-2"></i>
              Delete Activity
            </h5>
            <button type="button" class="btn-close" @click="cancelDelete"></button>
          </div>
          <div class="modal-body">
            <p class="mb-3">Are you sure you want to delete this activity?</p>
            <div class="alert alert-warning" role="alert">
              <i class="bi bi-exclamation-circle me-2"></i>
              <strong>Warning:</strong> This action cannot be undone. All data associated with this activity will be permanently removed.
            </div>
          </div>
          <div class="modal-footer border-0">
            <button type="button" class="btn btn-secondary" @click="cancelDelete">
              Cancel
            </button>
            <button type="button" class="btn btn-danger" @click="confirmDelete">
              <i class="bi bi-trash me-1"></i>
              Delete Activity
            </button>
          </div>
        </div>
      </div>
    </div>

  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { toast } from 'vue3-toastify'
import { useData } from '../composables/useData.js'
import { useAuth } from '../composables/useAuth.js'

const { activities, playgrounds, loadActivities, loadPlaygrounds, addPlaygroundReview, deleteActivity: deleteActivityFromDB, joinActivity, leaveActivity } = useData()
const { user } = useAuth()
const router = useRouter()

// Reactive data
const filters = ref({ sport: '', age: '', accessibility: '', distance: 10 })
const filtersList = ref([
  {
    key: 'sport',
    type: 'select',
    label: 'Select Sport',
    options: [
      { value: 'football', label: 'Football' },
      { value: 'cricket', label: 'Cricket' },
      { value: 'tennis', label: 'Tennis' },
      { value: 'walking', label: 'Walking Group' },
    ],
  },
  {
    key: 'age',
    type: 'select',
    label: 'Age Group',
    options: [
      { value: 'kids', label: 'Kids' },
      { value: 'youth', label: 'Youth' },
      { value: 'adults', label: 'Adults' },
      { value: 'seniors', label: 'Seniors' },
    ],
  },
  {
    key: 'accessibility',
    type: 'select',
    label: 'Accessibility',
    options: [
      { value: 'wheelchair', label: 'Wheelchair Accessible' },
      { value: 'inclusive', label: 'Inclusive (LGBTQ+, Women Only, etc.)' },
      { value: 'open', label: 'Open to All' },
    ],
  },
  { key: 'distance', type: 'range', label: 'Distance from me (km)' },
])
const programs = ref([])
const filteredPrograms = ref([])
const map = ref(null)
const markers = ref([])
const selectedIndex = ref(null)
const userLocation = ref({ lat: -37.8136, lng: 144.9631 }) // Default Melbourne

const showModal = ref(false)
const modalPlayground = ref('')
const selectedRating = ref(0)
const ratingComment = ref('')

// Delete confirmation modal
const showDeleteModal = ref(false)
const activityToDelete = ref(null)

// Helper function to find coordinates for an event location
const findCoordinatesForEvent = (eventLocation) => {
  if (!eventLocation || !playgrounds.value.length) return null

  // Try to match event location with playground names
  const matchingPlayground = playgrounds.value.find(playground => {
    // Check if event location contains the playground name (case-insensitive)
    return eventLocation.toLowerCase().includes(playground.name.toLowerCase())
  })

  if (matchingPlayground) {
    return {
      lat: matchingPlayground.lat,
      lng: matchingPlayground.lng
    }
  }

  return null
}

// Methods
const initMap = () => {
  map.value = L.map('events-map').setView([userLocation.value.lat, userLocation.value.lng], 13)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map.value)
}

const addMarkers = (events) => {
  // Remove old markers
  markers.value.forEach((marker) => map.value.removeLayer(marker))
  markers.value = []

  events.forEach((event, index) => {
    // Try to find coordinates by matching event location with playground names
    const coordinates = findCoordinatesForEvent(event.location)

    if (coordinates) {
      const marker = L.marker([coordinates.lat, coordinates.lng])
        .bindPopup(`
          <div>
            <h6>${event.title}</h6>
            <p>${event.location}</p>
            <p>${event.date} at ${event.time}</p>
            <p>${(event.rsvps || []).length}/${event.capacity} participants</p>
          </div>
        `)
        .on('click', () => {
          selectedIndex.value = index
          map.value.setView([coordinates.lat, coordinates.lng], 15)
          // Open popup after map animation completes
          setTimeout(() => {
            marker.openPopup()
          }, 300) // Wait for zoom animation to complete
        })
        .addTo(map.value)

      markers.value.push(marker)
    }
  })
}

const selectCard = (index, fromMarker = false) => {
  selectedIndex.value = index
  if (!fromMarker) {
    const event = filteredPrograms.value[index]
    const coordinates = findCoordinatesForEvent(event.location)

    if (coordinates) {
      map.value.setView([coordinates.lat, coordinates.lng], 15)
      // Find and open the corresponding marker popup after map animation
      setTimeout(() => {
        const correspondingMarker = markers.value.find(marker => {
          const markerLatLng = marker.getLatLng()
          return Math.abs(markerLatLng.lat - coordinates.lat) < 0.001 &&
                 Math.abs(markerLatLng.lng - coordinates.lng) < 0.001
        })
        if (correspondingMarker) {
          correspondingMarker.openPopup()
        }
      }, 300) // Wait for zoom animation to complete
    }
  } else {
    const cardList = document.querySelectorAll('.card')
    cardList[index].scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

const searchEvents = () => {
  let filtered = [...programs.value]

  if (filters.value.sport) {
    filtered = filtered.filter(p => p.sport === filters.value.sport)
  }

  if (filters.value.age) {
    filtered = filtered.filter(p => p.age === filters.value.age)
  }

  if (filters.value.accessibility) {
    filtered = filtered.filter(p => p.accessibility === filters.value.accessibility)
  }

  // Distance filter based on actual coordinates
  if (filters.value.distance < 50) {
    filtered = filtered.filter(p => {
      const coordinates = findCoordinatesForEvent(p.location)
      if (!coordinates) return false // Exclude if no coordinates found

      const distance = getDistance(
        userLocation.value.lat,
        userLocation.value.lng,
        coordinates.lat,
        coordinates.lng
      )

      return distance <= filters.value.distance
    })
  }

  filteredPrograms.value = filtered
  addMarkers(filteredPrograms.value)
}

// Distance calculation using Haversine formula
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371 // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const hasUserRated = (playgroundName) => {
  if (!user.value) return false
  const playground = playgrounds.value.find(p =>
    p.name.trim().toLowerCase() === playgroundName.trim().toLowerCase()
  )
  if (!playground) return false
  return playground.reviews.some(review => review.userId === user.value.uid)
}

const getUserRating = (playgroundName) => {
  if (!user.value) return null
  const playground = playgrounds.value.find(p =>
    p.name.trim().toLowerCase() === playgroundName.trim().toLowerCase()
  )
  if (!playground) return null
  return playground.reviews.find(review => review.userId === user.value.uid)
}

const openRatingModal = (name) => {
  modalPlayground.value = name
  const existingRating = getUserRating(name)

  if (existingRating) {
    // Prefill with existing rating
    selectedRating.value = existingRating.score
    ratingComment.value = existingRating.comment || ''
  } else {
    // Reset for new rating
    selectedRating.value = 0
    ratingComment.value = ''
  }

  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const submitRating = async () => {
  if (!user.value) {
    toast.error('You must be logged in to rate.', { autoClose: 3000 })
    return
  }

  const pg = playgrounds.value.find(p =>
    p.name.trim().toLowerCase() === modalPlayground.value.trim().toLowerCase()
  )

  if (!pg) {
    toast.error('Playground not found.', { autoClose: 3000 })
    return
  }

  try {
    await addPlaygroundReview(modalPlayground.value, {
      userId: user.value.uid,
      userEmail: user.value.email,
      score: selectedRating.value,
      comment: ratingComment.value,
    })

    closeModal()
    const isUpdate = hasUserRated(modalPlayground.value)
    toast.success(isUpdate ? 'Rating updated successfully!' : 'Rating submitted successfully!', { autoClose: 3000 })

    // Reload playgrounds to get updated data
    await loadPlaygrounds()

    // Recompute ratings
    programs.value = programs.value.map(program => {
      const updatedPg = playgrounds.value.find(p =>
        p.name.trim().toLowerCase() === program.location.trim().toLowerCase()
      )
      return {
        ...program,
        averageRating: updatedPg?.averageRating || null,
        reviewCount: updatedPg?.reviewCount || 0
      }
    })
  } catch (error) {
    console.error('Error submitting rating:', error)
    toast.error('Failed to submit rating', { autoClose: 3000 })
  }

  filteredPrograms.value = programs.value
}

// Delete activity - show confirmation modal
const deleteActivity = (activityId) => {
  activityToDelete.value = activityId
  showDeleteModal.value = true
}

// Cancel delete
const cancelDelete = () => {
  showDeleteModal.value = false
  activityToDelete.value = null
}

// Confirm delete
const confirmDelete = async () => {
  if (!activityToDelete.value) return

  try {
    await deleteActivityFromDB(activityToDelete.value)
    toast.success('Activity deleted successfully!', { autoClose: 3000 })

    // Reload data to reflect changes
    await loadActivities()

    // Update programs with fresh data
    const enriched = activities.value.map(program => {
      const pg = playgrounds.value.find(p =>
        p.name.trim().toLowerCase() === program.location.trim().toLowerCase()
      )
      return {
        ...program,
        averageRating: pg?.averageRating || null,
        reviewCount: pg?.reviewCount || 0
      }
    })

    programs.value = enriched
    filteredPrograms.value = enriched
    addMarkers(filteredPrograms.value)

    // Close modal
    showDeleteModal.value = false
    activityToDelete.value = null

  } catch (error) {
    console.error('Error deleting activity:', error)
    toast.error('Failed to delete activity', { autoClose: 3000 })
  }
}

// Edit activity
const editActivity = (activity) => {
  // Navigate to edit page with activity data
  router.push({
    path: '/create-activity',
    query: { edit: activity.id }
  })
}

// Check if user has joined an activity
const isUserJoined = (activity) => {
  if (!user.value) return false
  const rsvps = activity.rsvps || []
  return Array.isArray(rsvps) && rsvps.includes(user.value.uid)
}

// Check if activity is full
const isActivityFull = (activity) => {
  const rsvps = activity.rsvps || []
  return Array.isArray(rsvps) && rsvps.length >= activity.capacity
}

// Handle joining an activity
const handleJoinActivity = async (activityId) => {
  if (!user.value) {
    toast.error('You must be logged in to join activities', { autoClose: 3000 })
    return
  }

  try {
    await joinActivity(activityId, user.value.uid)
    toast.success('Successfully joined the activity!', { autoClose: 3000 })

    // Reload and update the display
    await loadActivities()
    const enriched = activities.value.map(program => {
      const pg = playgrounds.value.find(p =>
        p.name.trim().toLowerCase() === program.location.trim().toLowerCase()
      )
      return {
        ...program,
        averageRating: pg?.averageRating || null,
        reviewCount: pg?.reviewCount || 0
      }
    })
    programs.value = enriched
    filteredPrograms.value = enriched
  } catch (error) {
    console.error('Error joining activity:', error)
    toast.error(error.message || 'Failed to join activity', { autoClose: 3000 })
  }
}

// Handle leaving an activity
const handleLeaveActivity = async (activityId) => {
  if (!user.value) {
    toast.error('You must be logged in to leave activities', { autoClose: 3000 })
    return
  }

  try {
    await leaveActivity(activityId, user.value.uid)
    toast.success('Successfully left the activity', { autoClose: 3000 })

    // Reload and update the display
    await loadActivities()
    const enriched = activities.value.map(program => {
      const pg = playgrounds.value.find(p =>
        p.name.trim().toLowerCase() === program.location.trim().toLowerCase()
      )
      return {
        ...program,
        averageRating: pg?.averageRating || null,
        reviewCount: pg?.reviewCount || 0
      }
    })
    programs.value = enriched
    filteredPrograms.value = enriched
  } catch (error) {
    console.error('Error leaving activity:', error)
    toast.error(error.message || 'Failed to leave activity', { autoClose: 3000 })
  }
}

// Lifecycle
onMounted(async () => {
  // Load data from Firestore
  await loadActivities()
  await loadPlaygrounds()

  // Process activities data
  const enriched = activities.value.map(program => {
    const pg = playgrounds.value.find(p =>
      p.name.trim().toLowerCase() === program.location.trim().toLowerCase()
    )

    return {
      ...program,
      averageRating: pg?.averageRating || null,
      reviewCount: pg?.reviewCount || 0
    }
  })

  programs.value = enriched
  filteredPrograms.value = enriched
  initMap()
  addMarkers(filteredPrograms.value)
})
</script>

<style scoped>
.page-title {
  font-size: 2.5rem;
  font-weight: 700;
}

.card {
  transition: transform 0.2s;
  border-radius: 0.75rem;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.card.border-primary {
  border-color: #0d6efd !important;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

.distance-text {
  font-size: 0.9rem;
  color: #666;
  margin-top: 0.5rem;
}

.rating span {
  transition: color 0.2s ease;
}

.rating span:hover {
  color: #ffc107 !important;
}

.btn-primary {
  background-color: #0d6efd;
  border: none;
  transition: background-color 0.3s, transform 0.2s;
}

.btn-primary:hover {
  background-color: #0b5ed7;
  transform: translateY(-2px);
}
</style>
