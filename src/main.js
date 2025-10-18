import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap'
import Toastify from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'
import { useData } from './composables/useData.js'

// PrimeVue
import PrimeVue from 'primevue/config'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tooltip from 'primevue/tooltip'
import 'primeicons/primeicons.css'
import './assets/primevue-custom.css'

const app = createApp(App)
app.use(router)
app.use(Toastify)
app.use(PrimeVue, {
  theme: {
    preset: 'aura',
    options: {
      prefix: 'p',
      darkModeSelector: 'system',
      cssLayer: false
    }
  }
})

// Register PrimeVue components globally
app.component('DataTable', DataTable)
app.component('DataTableColumn', Column)
app.component('PrimeButton', Button)

// Register PrimeVue directives
app.directive('tooltip', Tooltip)

// Seed data on app startup
const { seedData } = useData()
seedData()

app.mount('#app')
