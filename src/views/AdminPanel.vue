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
            <button class="btn btn-sm btn-danger" @click="deleteUser(u.uid)">Delete</button>
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
import { useRoute } from 'vue-router'
import { toast } from 'vue3-toastify'
import { collection, getDocs } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { db } from '../firebase/init.js'
import { useData } from '../composables/useData.js'

const functions = getFunctions()
const deleteUserFunction = httpsCallable(functions, 'deleteUser', { region: 'us-central1' })

const route = useRoute()
const { activities, loadActivities } = useData()

// User management
const users = ref([])

async function deleteUser(userId) {
  console.log('deleteUser called with userId:', userId)
  try {
    await deleteUserFunction({ userId })
    users.value = users.value.filter(u => u.uid !== userId)
    toast.success('User deleted successfully')
  } catch (error) {
    console.error('Error deleting user:', error)
    toast.error('Failed to delete user: ' + error.message)
  }
}

// Activity stats
const stats = ref({
  total: 0,
  totalRsvps: 0,
  topSport: '',
  topPlayground: '',
})

function computeStats() {
  stats.value.total = activities.value.length
  stats.value.totalRsvps = activities.value.reduce((sum, a) => sum + (a.rsvps || 0), 0)

  const sportCount = {}
  const playgroundCount = {}

  activities.value.forEach(a => {
    sportCount[a.sport] = (sportCount[a.sport] || 0) + 1

    if (a.location?.name) {
      playgroundCount[a.location.name] = (playgroundCount[a.location.name] || 0) + 1
    }
  })

  stats.value.topSport = Object.entries(sportCount).sort((a, b) => b[1] - a[1])[0]?.[0] || ''
  stats.value.topPlayground = Object.entries(playgroundCount).sort((a, b) => b[1] - a[1])[0]?.[0] || ''
}

// Load data on mount
onMounted(async () => {
  try {
    // Load activities from Firestore
    await loadActivities()

    // Fetch users from Firestore (exclude deleted users)
    const usersSnapshot = await getDocs(collection(db, 'users'))
    users.value = usersSnapshot.docs
      .filter(doc => !doc.data().deleted) // Filter out deleted users
      .map(doc => ({
        uid: doc.id,
        ...doc.data()
      }))
  } catch (error) {
    console.error('Error fetching data:', error)
    toast.error('Failed to load data')
  }

  computeStats()

  // Check for toast message in query parameters
  if (route.query.toast && route.query.message) {
    const message = route.query.message
    if (route.query.toast === 'success') {
      toast.success(message, { autoClose: 3000 })
    } else if (route.query.toast === 'error') {
      toast.error(message, { autoClose: 3000 })
    }

    // Clean up the URL by removing query parameters
    window.history.replaceState({}, document.title, window.location.pathname)
  }
})
</script>
