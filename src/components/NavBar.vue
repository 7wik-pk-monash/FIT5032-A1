<template>
  <nav class="navbar navbar-expand-lg navbar-light bg-light shadow-sm sticky-top">
    <div class="container-fluid">
      <!-- Brand -->
      <router-link to="/" class="navbar-brand fw-bold text-primary">TeamUp</router-link>

      <!-- Hamburger toggle for mobile -->
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
        aria-controls="navbarNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <!-- Links -->
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">

          <template v-if="isAdmin">
            <li class="nav-item">
              <router-link to="/admin" class="nav-link">Admin Dashboard</router-link>
            </li>
            <li class="nav-item">
              <router-link to="/admin/activities" class="nav-link">Activities</router-link>
            </li>
          </template>

          <template v-else>
            <li class="nav-item">
              <router-link to="/" class="nav-link">Home</router-link>
            </li>
            <li class="nav-item">
              <router-link to="/events" class="nav-link">Events</router-link>
            </li>
            <li class="nav-item">
              <router-link to="/donate" class="nav-link">Donate</router-link>
            </li>
          </template>
        </ul>

        <!-- Auth Buttons -->
        <div class="d-flex align-items-center gap-2">
          <template v-if="user">
            <span class="text-muted me-2">Welcome, {{ user.firstName }}</span>

            <template v-if="user && !isAdmin">
              <router-link to="/create-activity" class="btn btn-success">Create Activity</router-link>
            </template>

            <button class="btn btn-outline-danger" @click="handleLogout">Logout</button>
          </template>

          <template v-else>
            <router-link to="/login" class="btn btn-outline-primary">Login</router-link>
            <router-link to="/register" class="btn btn-primary">Register</router-link>
          </template>
        </div>
      </div>


    </div>
  </nav>
</template>

<script setup>
// import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const { user, logout, isAdmin } = useAuth()

const router = useRouter()

function handleLogout() {
  logout()
  router.push('/login')
}

// onMounted(() => {
//   const stored = localStorage.getItem('loggedInUser')
//   if (stored) {
//     user.value = JSON.parse(stored)
//   }
// })
</script>

<style scoped>
.navbar {
  padding: 1rem 2rem;
}
.nav-link {
  font-weight: 500;
}
.nav-link:hover {
  color: #0d6efd;
}
.btn {
  font-weight: 500;
  padding: 0.4rem 1rem;
}
.btn-success {
  background-color: #28a745;
  border: none;
}
.btn-success:hover {
  background-color: #218838;
}
.btn-outline-danger {
  border-color: #dc3545;
  color: #dc3545;
}
.btn-outline-danger:hover {
  background-color: #dc3545;
  color: #fff;
}
</style>
