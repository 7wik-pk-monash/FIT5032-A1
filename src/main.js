import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap'
import Toastify from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'
import { useData } from './composables/useData.js'

const app = createApp(App)
app.use(router)
app.use(Toastify)

// Seed data on app startup
const { seedData } = useData()
seedData()

app.mount('#app')
