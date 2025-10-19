<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="page-header">
    <div class="container">
      <h1 class="page-title text-center mb-0">Login</h1>
    </div>
  </div>

  <section class="container py-5">
    <form @submit.prevent="loginUser">
      <div class="mb-3">
        <label class="form-label">Email</label>
        <input
          type="email"
          class="form-control"
          v-model="email"
          autocomplete="email"
          required
        />
      </div>
      <div class="mb-3">
        <label class="form-label">Password</label>
        <input
          type="password"
          class="form-control"
          v-model="password"
          autocomplete="current-password"
          required
        />
      </div>
      <button type="submit" class="btn btn-success">Login</button>
    </form>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue3-toastify'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const email = ref('')
const password = ref('')
const { login, user } = useAuth()

async function loginUser() {
  try {
    const result = await login(email.value, password.value)

    if (result.success) {
      // Navigate immediately and show toast on the next page
      if (user.value?.role === 'admin') {
        router.push({
          path: '/admin',
          query: { toast: 'success', message: `Welcome back, ${user.value?.firstName || 'User'}!` }
        })
      } else {
        router.push({
          path: '/',
          query: { toast: 'success', message: `Welcome back, ${user.value?.firstName || 'User'}!` }
        })
      }
    } else {
      toast.error(result.error || 'Invalid credentials.', { autoClose: 3000 })
    }
  } catch (error) {
    console.error('Login error:', error)
    toast.error('Login failed. Please try again.', { autoClose: 3000 })
  }
}
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
</style>
