<template>

  <section class="container-fluid events-container py-5" id="events-page">
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

      <div class="col-12 col-lg-4 d-flex flex-column gap-4">
        <div
          v-for="(program, index) in filteredPrograms"
          :key="program.id"
          :class="[
            'card',
            'shadow-sm',
            'hover-card',
            selectedIndex === index ? 'card-selected' : '',
          ]"
          @click="selectCard(index)"
        >
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">{{ program.title }}</h5>
            <p class="card-text text-muted">Location: {{ program.location }}</p>
            <p class="card-text small text-muted">
              Date: {{ program.date }}, time: {{ program.time }}, Attendees: {{ program.rsvps }}/{{
                program.capacity
              }}
              attendees
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import eventsData from '../assets/data/ex_events.json'

export default {
  name: 'Events',
  data() {
    return {
      filters: { sport: '', age: '', accessibility: '', distance: 10 },
      filtersList: [
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
      ],
      programs: [],
      filteredPrograms: [],
      map: null,
      markers: [],
      selectedIndex: null,
      userLocation: { lat: -37.8136, lng: 144.9631 }, // Default Melbourne
    }
  },

  mounted() {

    const localActivities = JSON.parse(localStorage.getItem('activities') || '[]')

    // Normalize local activities if needed
    const normalized = localActivities.map((a, i) => ({
      id: a.id || 1000 + i, // fallback ID
      title: a.title,
      location: 'Custom Location',
      lat: a.location?.lat,
      lng: a.location?.lng,
      date: new Date(a.datetime).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }),
      time: new Date(a.datetime).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }),
      capacity: a.capacity,
      rsvps: a.rsvps || 0,
      sport: a.sport,
      age: 'adults', // default if not captured
      accessibility: 'open', // default if not captured
    }))

    this.programs = [...eventsData, ...normalized]
    this.filteredPrograms = this.programs
    this.initMap()
    this.addMarkers(this.filteredPrograms)
  },

  methods: {
    initMap() {
      this.map = L.map('events-map').setView([this.userLocation.lat, this.userLocation.lng], 13)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(this.map)
    },
    addMarkers(events) {
      // Remove old markers
      this.markers.forEach((marker) => this.map.removeLayer(marker))
      this.markers = []

      events.forEach((event, index) => {
        const marker = L.marker([event.lat, event.lng]).addTo(this.map)
        marker.bindPopup(
          `<b>${event.title}</b><br>${event.location}<br>${event.date} • ${event.time}<br>${event.rsvps}/${event.capacity} attendees`,
        )
        marker.on('click', () => this.selectCard(index, true))
        this.markers.push(marker)
      })
    },
    selectCard(index, fromMarker = false) {
      this.selectedIndex = index
      if (!fromMarker) {
        const event = this.filteredPrograms[index]
        this.map.setView([event.lat, event.lng], 15)
        this.markers[index].openPopup()
      } else {
        const cardList = this.$el.querySelectorAll('.card')
        cardList[index].scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    },
    searchEvents() {
      const R = this.filters
      this.filteredPrograms = this.programs.filter((event) => {
        const sportMatch = R.sport ? event.sport === R.sport : true
        const ageMatch = R.age ? event.age === R.age : true
        const accessibilityMatch = R.accessibility ? event.accessibility === R.accessibility : true

        // Distance calculation (approx.)
        const distanceMatch =
          this.getDistance(this.userLocation.lat, this.userLocation.lng, event.lat, event.lng) <=
          R.distance

        return sportMatch && ageMatch && accessibilityMatch && distanceMatch
      })
      this.selectedIndex = null
      this.addMarkers(this.filteredPrograms)
    },
    getDistance(lat1, lon1, lat2, lon2) {
      const R = 6371 // km
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
    },
  },
}
</script>

<style scoped>
.page-title {
  font-size: 2.5rem;
  font-weight: 700;
}
.distance-text {
  font-size: 0.8rem;
  color: #555;
  margin-top: 0.25rem;
}
.card-title {
  font-weight: 600;
  font-size: 1.1rem;
}
.card-text {
  color: #555;
}
.btn-primary {
  background-color: #0d6efd;
  border: none;
  transition:
    background-color 0.3s,
    transform 0.2s;
}
.btn-primary:hover {
  background-color: #0b5ed7;
  transform: translateY(-2px);
}
.hover-card {
  border-radius: 0.75rem;
  transition:
    transform 0.2s,
    box-shadow 0.3s;
  cursor: pointer;
}
.hover-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
}
.card-selected {
  border: 2px solid #0d6efd;
  background-color: #e7f1ff;
}

#events-page {
  /* margin: 1rem 2rem; */
  padding: 4rem;
  max-height: fit-content;
}
</style>
