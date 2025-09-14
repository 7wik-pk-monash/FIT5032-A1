import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from '@/views/LandingPage.vue'
import Donation from '@/views/Donation.vue'
import Events from '@/views/Events.vue'
import CreateActivity from '@/views/CreateActivity.vue'
import Login from '@/views/Login.vue'
import Register from '@/views/Register.vue'
import Unauthorized from '@/views/Unauthorized.vue'

const routes = [

  // Standard User routes
  { path: '/', component: LandingPage },
  { path: '/donate', component: Donation, meta: { requiresAuth: true } },
  { path: '/events', component: Events, meta: { requiresAuth: true } },
  { path: '/create-activity', component: CreateActivity, meta: { requiresAuth: true } },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/unauthorized', component: Unauthorized },

  // Admin Routes
  { path: '/admin', component: AdminPanel, meta: { requiresAuth: true, roles: ['admin'] } }

]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

import { useAuth } from '@/composables/useAuth'

import { toast } from 'vue3-toastify'
import AdminPanel from '@/views/AdminPanel.vue'

router.beforeEach((to, from, next) => {
  const { user } = useAuth()

  if (to.meta.requiresAuth && !user.value) {

    toast.error('Please login to access this page.')
    next('/login')

  } else if (to.meta.roles && !to.meta.roles.includes(user.value.role)) {

    // If user attempts accessing an unauthorized page
    toast.error('You attempted to access an unauthorized page')
    setTimeout(() => next('/unauthorized'), 100)

    // return next('/')

  } else {
    next()
  }

})


export default router
