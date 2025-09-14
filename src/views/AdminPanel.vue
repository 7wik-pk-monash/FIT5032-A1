<template>
  <section class="container py-5">
    <h1 class="mb-4">Admin Dashboard</h1>

    <!-- User Management -->
    <h4 class="mt-4">Registered Users</h4>
    <table class="table table-bordered table-hover">
      <thead class="table-light">
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>City</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(u, index) in users" :key="index">
          <td>{{ u.firstName }} {{ u.lastName }}</td>
          <td>{{ u.email }}</td>
          <td>{{ u.role || 'user' }}</td>
          <td>{{ u.city }}</td>
          <td>
            <button class="btn btn-sm btn-danger" @click="deleteUser(u.email)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Activity Stats -->
    <h4 class="mt-5">Activity Stats</h4>
    <ul class="list-group">
      <li class="list-group-item">Total Activities: {{ stats.total }}</li>
      <li class="list-group-item">Total RSVPs: {{ stats.totalRsvps }}</li>
      <li class="list-group-item">Most Popular Sport: {{ stats.topSport || 'N/A' }}</li>
      <li class="list-group-item">Most Mentioned Playground: {{ stats.topPlayground || 'N/A' }}</li>
    </ul>

  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { toast } from 'vue3-toastify'

// User management
const users = ref([])

function deleteUser(email) {
  users.value = users.value.filter(u => u.email !== email)
  localStorage.setItem('users', JSON.stringify(users.value))
  toast.success(`Deleted user ${email}`)
}

// Activity stats
const stats = ref({
  total: 0,
  totalRsvps: 0,
  topSport: '',
  topPlayground: '',
})

function computeStats() {
  const activities = JSON.parse(localStorage.getItem('activities') || '[]')
  stats.value.total = activities.length
  stats.value.totalRsvps = activities.reduce((sum, a) => sum + (a.rsvps || 0), 0)

  const sportCount = {}
  const playgroundCount = {}

  activities.forEach(a => {
    sportCount[a.sport] = (sportCount[a.sport] || 0) + 1

    if (a.location?.name) {
      playgroundCount[a.location.name] = (playgroundCount[a.location.name] || 0) + 1
    }
  })

  stats.value.topSport = Object.entries(sportCount).sort((a, b) => b[1] - a[1])[0]?.[0] || ''
  stats.value.topPlayground = Object.entries(playgroundCount).sort((a, b) => b[1] - a[1])[0]?.[0] || ''
}

// Load data on mount
onMounted(() => {
  users.value = JSON.parse(localStorage.getItem('users') || '[]')
  computeStats()
})
</script>
