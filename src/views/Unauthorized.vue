<template>
  <section class="container py-5 text-center">
    <h1 class="display-5 text-danger mb-3">Access Denied</h1>
    <p class="lead mb-4">
      You don't have permission to view this page. If you believe this is a mistake, please contact support or try logging in with an authorized account.
    </p>
    <router-link to="/" class="btn btn-primary me-2">Go to Home</router-link>
    <router-link to="/login" class="btn btn-outline-secondary">Login as Admin</router-link>
  </section>
</template>

<script setup>
// import { useAuth } from '@/composables/useAuth'
// const { user } = useAuth()
</script>

<style scoped>
h1 {
  font-weight: 700;
}
.btn {
  font-weight: 500;
  padding: 0.5rem 1.2rem;
}
</style>
