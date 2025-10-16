<template>
  <section class="container py-5">
    <h1 class="mb-4">Login</h1>
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
      toast.success(`Welcome back, ${user.value?.firstName || 'User'}!`)

      if (user.value?.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/')
      }
    } else {
      toast.error(result.error || 'Invalid credentials.')
    }
  } catch (error) {
    console.error('Login error:', error)
    toast.error('Login failed. Please try again.')
  }
}
</script>
