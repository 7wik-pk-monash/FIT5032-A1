<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="page-header">
    <div class="container">
      <h1 class="page-title text-center mb-3">Access Denied</h1>
      <p class="page-subtitle text-center mb-0">
        You don't have permission to view this page. If you believe this is a mistake, please contact support or try logging in with an authorized account.
      </p>
    </div>
  </div>

  <section class="container py-5 text-center">
    <router-link to="/" class="btn btn-primary me-2">Go to Home</router-link>
    <router-link to="/login" class="btn btn-outline-secondary">Login as Admin</router-link>
  </section>
</template>

<script setup>
// import { useAuth } from '@/composables/useAuth'
// const { user } = useAuth()
</script>

<style scoped>
/* Page Header */
.page-header {
  background: linear-gradient(135deg, #1e3a8a 0%, #000000 100%);
  color: white;
  padding: 3rem 0;
  margin-bottom: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
}

.page-subtitle {
  color: white;
  font-size: 1.1rem;
  opacity: 0.9;
}

h1 {
  font-weight: 700;
}
.btn {
  font-weight: 500;
  padding: 0.5rem 1.2rem;
}
</style>
