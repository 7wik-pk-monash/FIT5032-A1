import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from '@/views/LandingPage.vue'
import Donation from '@/views/Donation.vue'
import Events from '@/views/Events.vue'
import CreateActivity from '@/views/CreateActivity.vue'

const routes = [
  { path: '/', component: LandingPage },
  { path: '/donate', component: Donation },
  { path: '/events', component: Events },
  { path: '/create-activity', component: CreateActivity },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
