import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from '@/components/LandingPage.vue'
import Donation from '@/components/Donation.vue'
import Events from '@/components/Events.vue'
import CreateActivity from '@/components/CreateActivity.vue'

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
