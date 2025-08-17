<template>
  <section class="container py-5">
    <h1 class="mb-4">Create New Sport Activity</h1>

    <form @submit.prevent="submitActivity">
      <div class="mb-3">
        <label class="form-label">Activity Name</label>
        <input type="text" class="form-control" v-model="activity.title" required />
      </div>

      <div class="mb-3">
        <label class="form-label">Date & Time</label>
        <input type="datetime-local" class="form-control" v-model="activity.datetime" required />
      </div>

      <div class="mb-3">
        <label class="form-label">Sport Type</label>
        <select class="form-select" v-model="activity.sport" required>
          <option disabled value="">Select sport</option>
          <option value="football">Football</option>
          <option value="cricket">Cricket</option>
          <option value="tennis">Tennis</option>
          <option value="walking">Walking Group</option>
        </select>
      </div>

      <div class="mb-3">
        <label class="form-label">Maximum Attendees</label>
        <input type="number" class="form-control" v-model.number="activity.capacity" min="1" required />
      </div>

      <div class="mb-3">
        <label class="form-label">Location Address</label>
        <input type="text" class="form-control" v-model="addressInput" placeholder="Type address" @blur="geocodeAddress"/>
      </div>

      <div class="mb-3">
        <label class="form-label">Or Set Location on Map</label>
        <div id="map" style="height: 300px;"></div>
        <p class="mt-2 text-muted">Drag the marker to adjust the location.</p>
      </div>

      <button class="btn btn-primary btn-lg mt-3" type="submit">Create Activity</button>
    </form>
  </section>
</template>

<script>
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default {
  name: 'CreateActivity',
  data() {
    return {
      activity: {
        title: '',
        datetime: '',
        sport: '',
        capacity: 10,
        location: { lat: -37.8136, lng: 144.9631 }, // Default Melbourne
        rsvps: 0
      },
      addressInput: '',
      map: null,
      marker: null
    };
  },
  mounted() {
    this.map = L.map('map').setView([this.activity.location.lat, this.activity.location.lng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.marker = L.marker([this.activity.location.lat, this.activity.location.lng], { draggable: true }).addTo(this.map);
    this.marker.on('dragend', (e) => {
      const pos = e.target.getLatLng();
      this.activity.location.lat = pos.lat;
      this.activity.location.lng = pos.lng;
    });
  },
  methods: {
    geocodeAddress() {
      if (!this.addressInput) return;
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(this.addressInput)}`;
      fetch(url)
        .then(res => res.json())
        .then(data => {
          if (data.length > 0) {
            const loc = data[0];
            this.activity.location.lat = parseFloat(loc.lat);
            this.activity.location.lng = parseFloat(loc.lon);
            this.map.setView([loc.lat, loc.lon], 15);
            this.marker.setLatLng([loc.lat, loc.lon]);
          }
        });
    },
    submitActivity() {
      // You can replace this with an API call or state management
      const activities = JSON.parse(localStorage.getItem('activities') || '[]');
      activities.push(this.activity);
      localStorage.setItem('activities', JSON.stringify(activities));
      alert('Activity created successfully!');
      this.$router.push('/events');
    }
  }
};
</script>

<style scoped>
#map { border: 1px solid #ccc; border-radius: 0.5rem; }
</style>
