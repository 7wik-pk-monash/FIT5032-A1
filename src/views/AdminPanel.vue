<template>
  <div class="admin-dashboard">
    <!-- Header Section -->
    <div class="dashboard-header">
      <div class="container">
        <div class="row align-items-center">
          <div class="col">
            <h1 class="dashboard-title">
              <i class="pi pi-shield me-3"></i>
              Admin Dashboard
            </h1>
            <p class="dashboard-subtitle">Manage users and monitor platform activity</p>
          </div>
          <div class="col-auto">
            <div class="stats-summary">
              <div class="stat-item">
                <span class="stat-number" style="color: white;">{{ users.length }}</span>
                <span style="color: white;">Total Users</span>
              </div>
              <div class="stat-item">
                <span class="stat-number" style="color: white;">{{ stats.total }}</span>
                <span style="color: white;">Activities</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="container py-4">
      <!-- User Management Section -->
      <div class="card admin-card">
        <div class="card-header">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h4 class="card-title mb-1">
                <i class="pi pi-users me-2"></i>
                Registered Users
              </h4>
              <p class="card-subtitle text-muted mb-0">Manage user accounts and permissions</p>
            </div>
            <div class="user-count-badge">
              <span class="badge bg-primary">{{ users.length }} users</span>
            </div>
          </div>
        </div>

        <div class="card-body p-0">
          <DataTable
            :value="paginatedUsers"
            :paginator="false"
            :sortField="sortField"
            :sortOrder="sortOrder"
            :globalFilterFields="['firstName', 'lastName', 'email', 'city', 'role']"
            :loading="loading"
            class="admin-datatable"
            stripedRows
            responsiveLayout="scroll"
          >
            <template #header>
              <div class="datatable-header">
                <div class="search-container">
                  <div class="search-input-wrapper">
                    <i class="pi pi-search search-icon"></i>
                    <input
                      v-model="filters['global'].value"
                      placeholder="Search users by name, email, city, or role..."
                      class="search-input"
                    />
                  </div>
                </div>
              </div>
            </template>

            <DataTableColumn field="firstName" header="Name" :sortable="true">
              <template #body="slotProps">
                <div class="user-info">
                  <div class="user-avatar">
                    <i class="pi pi-user"></i>
                  </div>
                  <div class="user-details">
                    <div class="user-name">{{ slotProps.data.firstName }} {{ slotProps.data.lastName }}</div>
                    <div class="user-id">ID: {{ slotProps.data.uid.substring(0, 8) }}...</div>
                  </div>
                </div>
              </template>
            </DataTableColumn>

            <DataTableColumn field="email" header="Email" :sortable="true">
              <template #body="slotProps">
                <a :href="`mailto:${slotProps.data.email}`" class="email-link">
                  <i class="pi pi-envelope me-2"></i>
                  {{ slotProps.data.email }}
                </a>
              </template>
            </DataTableColumn>

            <DataTableColumn field="role" header="Role" :sortable="true">
              <template #body="slotProps">
                <span
                  :class="{
                    'role-badge admin': slotProps.data.role === 'admin',
                    'role-badge user': slotProps.data.role !== 'admin'
                  }"
                >
                  <i :class="slotProps.data.role === 'admin' ? 'pi pi-shield' : 'pi pi-user'" class="me-1"></i>
                  {{ slotProps.data.role || 'user' }}
                </span>
              </template>
            </DataTableColumn>

            <DataTableColumn field="city" header="Location" :sortable="true">
              <template #body="slotProps">
                <div class="location-info">
                  <i class="pi pi-map-marker location-icon"></i>
                  <span class="location-text">{{ slotProps.data.city || 'N/A' }}</span>
                </div>
              </template>
            </DataTableColumn>

            <DataTableColumn header="Actions" :exportable="false" style="min-width:8rem">
              <template #body="slotProps">
                <div class="action-buttons">
                  <PrimeButton
                    icon="pi pi-trash"
                    class="delete-btn"
                    @click="deleteUser(slotProps.data.uid)"
                    v-tooltip.top="'Delete User'"
                    severity="danger"
                    size="small"
                    text
                    rounded
                  />
                </div>
              </template>
            </DataTableColumn>
          </DataTable>

          <!-- Custom Pagination -->
          <div class="custom-pagination">
            <div class="pagination-info">
              <span class="showing-text">
                Showing {{ startRecord }} to {{ endRecord }} of {{ totalUsers }} users
              </span>
            </div>

            <div class="pagination-controls">
              <div class="rows-per-page">
                <label for="rowsSelect" class="rows-label">Users per page:</label>
                <select
                  id="rowsSelect"
                  v-model="rowsPerPage"
                  @change="onRowsPerPageChange"
                  class="rows-select"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </div>

              <div class="page-navigation">
                <button
                  @click="goToFirstPage"
                  :disabled="currentPage === 1"
                  class="page-btn first-btn"
                >
                  <i class="pi pi-angle-double-left"></i>
                </button>
                <button
                  @click="goToPreviousPage"
                  :disabled="currentPage === 1"
                  class="page-btn prev-btn"
                >
                  <i class="pi pi-angle-left"></i>
                </button>

                <div class="page-numbers">
                  <button
                    v-for="page in visiblePages"
                    :key="page"
                    @click="goToPage(page)"
                    :class="['page-btn', 'page-number', { active: page === currentPage }]"
                  >
                    {{ page }}
                  </button>
                </div>

                <button
                  @click="goToNextPage"
                  :disabled="currentPage === totalPages"
                  class="page-btn next-btn"
                >
                  <i class="pi pi-angle-right"></i>
                </button>
                <button
                  @click="goToLastPage"
                  :disabled="currentPage === totalPages"
                  class="page-btn last-btn"
                >
                  <i class="pi pi-angle-double-right"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Activity Statistics Section -->
      <div class="row mt-4">
        <div class="col-12">
          <div class="card admin-card">
            <div class="card-header">
              <h4 class="card-title mb-1">
                <i class="pi pi-chart-bar me-2"></i>
                Activity Statistics
              </h4>
              <p class="card-subtitle text-muted mb-0">Platform usage and engagement metrics</p>
            </div>
            <div class="card-body">
              <div class="row g-4">
                <div class="col-lg-3 col-md-6">
                  <div class="stat-card">
                    <div class="stat-icon calendar">
                      <i class="pi pi-calendar"></i>
                    </div>
                    <div class="stat-content">
                      <h3 class="stat-number">{{ stats.total }}</h3>
                      <p class="stat-label">Total Activities</p>
                    </div>
                  </div>
                </div>
                <div class="col-lg-3 col-md-6">
                  <div class="stat-card">
                    <div class="stat-icon users">
                      <i class="pi pi-users"></i>
                    </div>
                    <div class="stat-content">
                      <h3 class="stat-number">{{ stats.totalRsvps }}</h3>
                      <p class="stat-label">Total RSVPs</p>
                    </div>
                  </div>
                </div>
                <div class="col-lg-3 col-md-6">
                  <div class="stat-card">
                    <div class="stat-icon sport">
                      <i class="pi pi-star"></i>
                    </div>
                    <div class="stat-content">
                      <h3 class="stat-number">{{ stats.topSport || 'N/A' }}</h3>
                      <p class="stat-label">Most Popular Sport</p>
                    </div>
                  </div>
                </div>
                <div class="col-lg-3 col-md-6">
                  <div class="stat-card">
                    <div class="stat-icon location">
                      <i class="pi pi-map-marker"></i>
                    </div>
                    <div class="stat-content">
                      <h3 class="stat-number">{{ stats.topPlayground || 'N/A' }}</h3>
                      <p class="stat-label">Top Playground</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { toast } from 'vue3-toastify'
import { collection, getDocs } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { db } from '../firebase/init.js'
import { useData } from '../composables/useData.js'

const functions = getFunctions()
const deleteUserFunction = httpsCallable(functions, 'deleteUser', { region: 'us-central1' })

const route = useRoute()
const { activities, loadActivities } = useData()

// User management
const users = ref([])
const loading = ref(false)

// Pagination (for custom pagination - keeping PrimeVue paginator as backup)
const currentPage = ref(1)
const rowsPerPage = ref(5)

// DataTable filters and sorting
const filters = ref({
  global: { value: null, matchMode: 'contains' }
})
const sortField = ref('firstName')
const sortOrder = ref(1)

async function deleteUser(userId) {
  console.log('deleteUser called with userId:', userId)
  try {
    await deleteUserFunction({ userId })
    users.value = users.value.filter(u => u.uid !== userId)
    toast.success('User deleted successfully')
  } catch (error) {
    console.error('Error deleting user:', error)
    toast.error('Failed to delete user: ' + error.message)
  }
}

// Activity stats
const stats = ref({
  total: 0,
  totalRsvps: 0,
  topSport: '',
  topPlayground: '',
})

function computeStats() {
  stats.value.total = activities.value.length

  // Calculate total RSVPs by summing up the length of rsvps arrays
  stats.value.totalRsvps = activities.value.reduce((sum, a) => {
    const rsvps = a.rsvps || []
    return sum + (Array.isArray(rsvps) ? rsvps.length : 0)
  }, 0)

  const sportCount = {}
  const playgroundCount = {}

  activities.value.forEach(a => {
    sportCount[a.sport] = (sportCount[a.sport] || 0) + 1

    // Count activities by location (address string)
    if (a.location && typeof a.location === 'string') {
      playgroundCount[a.location] = (playgroundCount[a.location] || 0) + 1
    }
  })

  stats.value.topSport = Object.entries(sportCount).sort((a, b) => b[1] - a[1])[0]?.[0] || ''
  stats.value.topPlayground = Object.entries(playgroundCount).sort((a, b) => b[1] - a[1])[0]?.[0] || ''
}

// Custom pagination computed properties (safe fallbacks)
const totalUsers = computed(() => users.value?.length || 0)
const totalPages = computed(() => Math.ceil(totalUsers.value / Number(rowsPerPage.value)) || 1)
const startRecord = computed(() => Math.min((currentPage.value - 1) * Number(rowsPerPage.value) + 1, totalUsers.value) || 0)
const endRecord = computed(() => Math.min(currentPage.value * Number(rowsPerPage.value), totalUsers.value) || 0)

// Paginated users for the DataTable
const paginatedUsers = computed(() => {
  if (!users.value || users.value.length === 0) return []

  const rowsPerPageNum = Number(rowsPerPage.value)
  const start = (currentPage.value - 1) * rowsPerPageNum
  const end = start + rowsPerPageNum

  return users.value.slice(start, end)
})

const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

// Custom pagination methods (safe implementations)
function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

function goToFirstPage() {
  currentPage.value = 1
}

function goToPreviousPage() {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

function goToNextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

function goToLastPage() {
  currentPage.value = totalPages.value
}

function onRowsPerPageChange() {
  currentPage.value = 1
}

// Watch for changes in total pages and adjust current page if needed
watch(totalPages, (newTotalPages) => {
  if (currentPage.value > newTotalPages && newTotalPages > 0) {
    currentPage.value = newTotalPages
  }
})

// Load data on mount
onMounted(async () => {
  loading.value = true
  try {
    // Load activities from Firestore
    await loadActivities()

    // Fetch users from Firestore (exclude deleted users)
    const usersSnapshot = await getDocs(collection(db, 'users'))
    users.value = usersSnapshot.docs
      .filter(doc => !doc.data().deleted) // Filter out deleted users
      .map(doc => ({
        uid: doc.id,
        ...doc.data()
      }))
  } catch (error) {
    console.error('Error fetching data:', error)
    toast.error('Failed to load data')
  } finally {
    loading.value = false
  }

  computeStats()

  // Check for toast message in query parameters
  if (route.query.toast && route.query.message) {
    const message = route.query.message
    if (route.query.toast === 'success') {
      toast.success(message, { autoClose: 3000 })
    } else if (route.query.toast === 'error') {
      toast.error(message, { autoClose: 3000 })
    }

    // Clean up the URL by removing query parameters
    window.history.replaceState({}, document.title, window.location.pathname)
  }
})
</script>

<style scoped>
/* Admin Dashboard Styles */
.admin-dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

/* Header Section */
.dashboard-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem 0;
  margin-bottom: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.dashboard-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
}

.dashboard-subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
  margin: 0.5rem 0 0 0;
}

.stats-summary {
  display: flex;
  gap: 2rem;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 0.5rem;
  padding-right: 1rem;
  font-weight: 700;
  line-height: 1;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.8;
  margin: 0;
}

/* Card Styles */
.admin-card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.5rem;
  overflow: hidden;
}

.admin-card .card-header {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 1px solid #dee2e6;
  padding: 1.5rem;
}

.card-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
  display: flex;
  align-items: center;
}

.card-subtitle {
  font-size: 0.95rem;
  margin: 0;
}

.user-count-badge .badge {
  font-size: 0.9rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
}

/* DataTable Styles */
.admin-datatable {
  border: none !important;
}

.datatable-header {
  padding: 1.5rem;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.search-container {
  max-width: 400px;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: #6c757d;
  z-index: 2;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 2px solid #e9ecef;
  border-radius: 25px;
  font-size: 0.95rem;
  color: #495057; /* Set the font color here */
  transition: all 0.3s ease;
  background: white;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* Table Cell Styles */
.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.1rem;
}

.user-details {
  flex: 1;
}

.user-name {
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
  font-size: 0.95rem;
}

.user-id {
  font-size: 0.8rem;
  color: #6c757d;
  margin: 0;
  font-family: 'Courier New', monospace;
}

.email-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  display: flex;
  align-items: center;
  transition: color 0.3s ease;
}

.email-link:hover {
  color: #5a6fd8;
  text-decoration: none;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.role-badge.admin {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.role-badge.user {
  background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
  color: white;
}

.location-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.location-icon {
  color: #28a745;
  font-size: 1rem;
}

.location-text {
  color: #495057;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  justify-content: center;
}

.delete-btn {
  transition: all 0.3s ease;
}

.delete-btn:hover {
  transform: scale(1.1);
}

/* Statistics Cards */
.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
  border: 1px solid #e9ecef;
  height: 100%;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
}

.stat-icon.calendar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.users {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
}

.stat-icon.sport {
  background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%);
}

.stat-icon.location {
  background: linear-gradient(135deg, #17a2b8 0%, #6f42c1 100%);
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
  line-height: 1;
}

.stat-label {
  color: #6c757d;
  font-size: 0.9rem;
  margin: 0.5rem 0 0 0;
  font-weight: 500;
}

/* PrimeVue DataTable Customizations */
:deep(.p-datatable) {
  border: none !important;
  border-radius: 0 !important;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
  background: #f8f9fa !important;
  color: #495057 !important;
  font-weight: 600 !important;
  border-color: #dee2e6 !important;
  padding: 1rem 0.75rem !important;
  font-size: 0.9rem !important;
  text-transform: uppercase !important;
  letter-spacing: 0.5px !important;
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
  border-color: #f1f3f4 !important;
  padding: 1rem 0.75rem !important;
  vertical-align: middle !important;
}

:deep(.p-datatable .p-datatable-tbody > tr:nth-child(even)) {
  background-color: #f8f9fa !important;
}

:deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background-color: #e3f2fd !important;
}

:deep(.p-paginator) {
  background: #f8f9fa !important;
  border: 1px solid #dee2e6 !important;
  border-top: none !important;
  padding: 1rem 1.5rem !important;
  border-radius: 0 0 12px 12px !important;
}

:deep(.p-paginator .p-paginator-page) {
  background: white !important;
  border: 1px solid #dee2e6 !important;
  color: #495057 !important;
  border-radius: 6px !important;
  margin: 0 2px !important;
}

:deep(.p-paginator .p-paginator-page:hover) {
  background: #e9ecef !important;
  border-color: #adb5bd !important;
}

:deep(.p-paginator .p-paginator-page.p-highlight) {
  background: #667eea !important;
  border-color: #667eea !important;
  color: white !important;
}

/* Responsive Design */
@media (max-width: 768px) {
  .dashboard-title {
    font-size: 2rem;
  }

  .stats-summary {
    gap: 1rem;
  }

  .stat-number {
    font-size: 1.5rem;
  }

  .user-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .user-avatar {
    width: 32px;
    height: 32px;
    font-size: 0.9rem;
  }

  .stat-card {
    flex-direction: column;
    text-align: center;
    padding: 1rem;
  }

  .stat-icon {
    width: 50px;
    height: 50px;
    font-size: 1.2rem;
  }
}

/* Custom pagination */
.custom-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: #f8f9fa;
  border-top: 1px solid #dee2e6;
  border-radius: 0 0 0.375rem 0.375rem;
}

.pagination-info {
  display: flex;
  align-items: center;
}

.showing-text {
  color: #6c757d;
  font-size: 0.875rem;
  font-weight: 500;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.rows-per-page {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rows-label {
  color: #495057;
  font-size: 0.875rem;
  font-weight: 500;
  margin: 0;
}

.rows-select {
  padding: 0.375rem 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 0.375rem;
  background-color: white;
  color: #495057;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
}

.rows-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
}

.page-navigation {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.page-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 2.5rem;
  height: 2.5rem;
  padding: 0.5rem;
  border: 1px solid #dee2e6;
  background-color: white;
  color: #495057;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  border-radius: 0.375rem;
}

.page-btn:hover:not(:disabled) {
  background-color: #e9ecef;
  border-color: #adb5bd;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-btn.active {
  background-color: #667eea;
  border-color: #667eea;
  color: white;
}

.page-btn.active:hover {
  background-color: #5a6fd8;
  border-color: #5a6fd8;
}

.page-numbers {
  display: flex;
  gap: 0.25rem;
}

.page-number {
  min-width: 2.5rem;
}

.first-btn,
.prev-btn,
.next-btn,
.last-btn {
  min-width: 2.5rem;
}

/* Responsive design */
@media (max-width: 768px) {
  .custom-pagination {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .pagination-controls {
    justify-content: space-between;
  }

  .page-navigation {
    gap: 0.125rem;
  }

  .page-btn {
    min-width: 2rem;
    height: 2rem;
    font-size: 0.75rem;
  }
}
</style>
