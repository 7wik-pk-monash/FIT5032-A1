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
const { login } = useAuth()

function loginUser() {
  const users = JSON.parse(localStorage.getItem('users') || '[]')
  const user = users.find(u => u.email === email.value && u.password === password.value)

  if (!user) {
    toast.error('Invalid credentials.')
    return
  }

  login(user)

  toast.success(`Welcome back, ${user.firstName || 'User'}!`)

  if (user.role === 'admin') {
    router.push('/admin')
  } else {
    router.push('/')
  }
}
</script>
