<template>
  <section class="container py-5">
    <h1 class="mb-4">Register</h1>
    <form @submit.prevent="registerUser" autocomplete="on">
      <div class="row">
        <div class="mb-3 col-md-6">
          <label class="form-label">First Name</label>
          <input type="text" class="form-control" v-model="user.firstName" autocomplete="given-name" required />
        </div>
        <div class="mb-3 col-md-6">
          <label class="form-label">Last Name</label>
          <input type="text" class="form-control" v-model="user.lastName" autocomplete="family-name" />
        </div>
      </div>

      <div class="mb-3">
        <label class="form-label">Email</label>
        <input type="email" class="form-control" v-model="user.email" autocomplete="email" required />
      </div>

      <div class="mb-3">
        <label class="form-label">Password</label>
        <input type="password" class="form-control" v-model="user.password" autocomplete="new-password" required />
      </div>

      <div class="mb-3">
        <label class="form-label">Date of Birth</label>
        <input type="date" class="form-control" v-model="user.dob" />
      </div>

      <div class="mb-3">
        <label class="form-label">City</label>
        <input type="text" class="form-control" v-model="user.city" autocomplete="address-level2" />
      </div>

      <div class="mb-3">
        <label class="form-label">Short Bio</label>
        <textarea class="form-control" v-model="user.bio" rows="3" placeholder="Tell us about your sport interests or experience"></textarea>
      </div>

      <div class="mb-3">
        <label class="form-label">Preferred Playgrounds</label>
        <input type="text" class="form-control" v-model="playgroundInput" @keyup.enter="addPlayground" placeholder="Type and press Enter" />
        <div class="mt-2">
          <span v-for="(pg, index) in user.preferredPlaygrounds" :key="index" class="badge bg-secondary me-1">
            {{ pg }}
            <button type="button" class="btn-close btn-close-white btn-sm ms-1" @click="removePlayground(index)"></button>
          </span>
        </div>
      </div>

      <div class="mb-3">
        <label class="form-label">Sports You're Interested In</label>
        <Multiselect
          v-model="user.sportsInterest"
          :options="sportsOptions"
          :multiple="true"
          :close-on-select="false"
          placeholder="Select sports"
          label="name"
          track-by="name"
          class="form-control"
        />
      </div>

      <button type="submit" class="btn btn-primary">Register</button>
    </form>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue3-toastify'
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.css'

const router = useRouter()
const playgroundInput = ref('')

const user = ref({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  dob: '',
  bio: '',
  city: '',
  preferredPlaygrounds: [],
  sportsInterest: [],
})

const sportsOptions = [
  { name: 'Football' },
  { name: 'Cricket' },
  { name: 'Tennis' },
  { name: 'Walking Group' },
]

function addPlayground() {
  const trimmed = playgroundInput.value.trim()
  if (trimmed && !user.value.preferredPlaygrounds.includes(trimmed)) {
    user.value.preferredPlaygrounds.push(trimmed)
  }
  playgroundInput.value = ''
}

function removePlayground(index) {
  user.value.preferredPlaygrounds.splice(index, 1)
}

function registerUser() {
  const users = JSON.parse(localStorage.getItem('users') || '[]')
  const exists = users.find(u => u.email === user.value.email)

  if (exists) {
    toast.error('Email already registered.')
    return
  }

  users.push(user.value)
  localStorage.setItem('users', JSON.stringify(users))
  toast.success('Registration successful!')
  router.push('/login')
}
</script>
