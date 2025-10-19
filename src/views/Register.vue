<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="page-header">
    <div class="container">
      <h1 class="page-title text-center mb-0">Register</h1>
    </div>
  </div>

  <section class="container py-5">
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
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { auth, db } from '../firebase/init.js'

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

async function registerUser() {
  try {
    // Create user with Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, user.value.email, user.value.password)
    const firebaseUser = userCredential.user

    // Prepare user data for Firestore (exclude password)
    const userData = {
      uid: firebaseUser.uid,
      firstName: user.value.firstName,
      lastName: user.value.lastName,
      email: user.value.email,
      dob: user.value.dob,
      bio: user.value.bio,
      city: user.value.city,
      preferredPlaygrounds: user.value.preferredPlaygrounds,
      sportsInterest: user.value.sportsInterest,
      role: 'user', // Default role for regular users
      createdAt: new Date().toISOString()
    }

    // Save user data to Firestore
    await setDoc(doc(db, 'users', firebaseUser.uid), userData)

    toast.success('Registration successful!')

    // After successful registration
    const functions = getFunctions();
    const sendWelcomeEmailFunction = httpsCallable(functions, 'sendWelcomeEmail');

    try {
      await sendWelcomeEmailFunction({
        userEmail: user.value.email,
        userData: {
          firstName: user.value.firstName,
          lastName: user.value.lastName,
          email: user.value.email,
          city: user.value.city
        }
      });
    } catch (error) {
      console.log('Email sending failed:', error);
    }

    router.push('/login')
  } catch (error) {
    console.error('Registration error:', error)

    if (error.code === 'auth/email-already-in-use') {
      toast.error('Email already registered.')
    } else if (error.code === 'auth/weak-password') {
      toast.error('Password should be at least 6 characters.')
    } else if (error.code === 'auth/invalid-email') {
      toast.error('Invalid email address.')
    } else {
      toast.error('Registration failed. Please try again.')
    }
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
