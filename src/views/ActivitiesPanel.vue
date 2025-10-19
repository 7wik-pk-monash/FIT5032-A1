<template>
  <div class="admin-dashboard">
    <!-- Header Section -->
    <div class="dashboard-header">
      <div class="container">
        <div class="row align-items-center">
          <div class="col">
            <h1 class="dashboard-title">
              <i class="pi pi-calendar me-3"></i>
              Activities Management
            </h1>
            <p class="dashboard-subtitle">Manage and monitor platform activities</p>
          </div>
          <div class="col-auto">
            <div class="stats-summary">
              <div class="stat-item">
                <span class="stat-number" style="color: white;">{{ activities.length }}</span>
                <span style="color: white;">Total Activities</span>
              </div>
              <div class="stat-item">
                <span class="stat-number" style="color: white;">{{ stats.totalRsvps }}</span>
                <span style="color: white;">Total RSVPs</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="container py-4">
      <!-- Activities Management Section -->
      <div class="card admin-card">
        <div class="card-header">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h4 class="card-title mb-1">
                <i class="pi pi-calendar me-2"></i>
                All Activities
              </h4>
              <p class="card-subtitle text-muted mb-0">View and manage all platform activities</p>
            </div>
            <div class="user-count-badge">
              <span class="badge bg-primary">{{ activities.length }} activities</span>
            </div>
          </div>
        </div>

        <div class="card-body p-0">
          <DataTable
            :value="paginatedActivities"
            :paginator="false"
            :sortField="sortField"
            :sortOrder="sortOrder"
            :loading="loading"
            class="admin-datatable"
            stripedRows
            responsiveLayout="scroll"
          >
            <template #header>
              <div class="datatable-header">
                <div class="search-container">
                  <div class="search-controls">
                    <div class="search-column">
                      <label for="searchColumn" class="search-label">Search in:</label>
                      <select
                        id="searchColumn"
                        v-model="searchColumn"
                        class="search-select"
                      >
                        <option value="all">All Fields</option>
                        <option value="title">Title</option>
                        <option value="sport">Sport</option>
                        <option value="location">Location</option>
                      </select>
                    </div>

                    <div class="search-input-wrapper">
                      <i class="pi pi-search search-icon"></i>
                      <input
                        v-model="searchQuery"
                        @keyup.enter="performSearch"
                        placeholder="Enter search term..."
                        class="search-input"
                      />
                    </div>

                    <button
                      @click="performSearch"
                      class="search-button"
                      type="button"
                    >
                      <i class="pi pi-search"></i>
                      Search
                    </button>

                    <button
                      @click="clearSearch"
                      class="clear-button"
                      type="button"
                      v-if="searchQuery"
                    >
                      <i class="pi pi-times"></i>
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            </template>

            <DataTableColumn field="title" header="Activity" :sortable="true">
              <template #body="slotProps">
                <div class="activity-info">
                  <div class="activity-icon">
                    <i class="pi pi-calendar"></i>
                  </div>
                  <div class="activity-details">
                    <div class="activity-title">{{ slotProps.data.title }}</div>
                    <div class="activity-sport">{{ slotProps.data.sport }}</div>
                  </div>
                </div>
              </template>
            </DataTableColumn>

            <DataTableColumn field="datetime" header="Date & Time" :sortable="true">
              <template #body="slotProps">
                <div class="datetime-info">
                  <div class="date-text">{{ formatDate(slotProps.data.datetime) }}</div>
                  <div class="time-text">{{ formatTime(slotProps.data.datetime) }}</div>
                </div>
              </template>
            </DataTableColumn>

            <DataTableColumn field="location" header="Location" :sortable="true">
              <template #body="slotProps">
                <div class="location-info">
                  <i class="pi pi-map-marker location-icon"></i>
                  <span class="location-text">{{ slotProps.data.location || 'N/A' }}</span>
                </div>
              </template>
            </DataTableColumn>

            <DataTableColumn field="rsvps" header="RSVPs" :sortable="true">
              <template #body="slotProps">
                <div class="rsvp-info">
                  <div class="rsvp-count">
                    <i class="pi pi-users me-2"></i>
                    {{ getRsvpCount(slotProps.data) }}
                  </div>
                  <div class="rsvp-capacity">
                    Max: {{ slotProps.data.capacity || 'Unlimited' }}
                  </div>
                </div>
              </template>
            </DataTableColumn>

            <DataTableColumn header="Actions" :exportable="false" style="min-width:8rem">
              <template #body="slotProps">
                <div class="action-buttons">
                  <PrimeButton
                    @click="confirmDeleteActivity(slotProps.data)"
                    icon="pi pi-trash"
                    severity="danger"
                    size="small"
                    outlined
                    v-tooltip.top="'Delete Activity'"
                  />
                </div>
              </template>
            </DataTableColumn>
          </DataTable>

          <!-- Custom Pagination -->
          <div class="custom-pagination">
            <div class="pagination-info">
              <span class="showing-text">
                Showing {{ startRecord }} to {{ endRecord }} of {{ totalActivities }} activities
              </span>
            </div>

            <div class="pagination-controls">
              <div class="rows-per-page">
                <label for="rowsSelect" class="rows-label">Activities per page:</label>
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
              <p class="card-subtitle text-muted mb-0">Platform activity and engagement metrics</p>
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

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header border-0">
            <h5 class="modal-title text-danger">
              <i class="pi pi-exclamation-triangle me-2"></i>
              Delete Activity
            </h5>
            <button type="button" class="btn-close" @click="cancelDelete"></button>
          </div>
          <div class="modal-body">
            <p class="mb-3">Are you sure you want to delete this activity?</p>
            <div v-if="activityToDelete" class="alert alert-warning" role="alert">
              <i class="pi pi-exclamation-circle me-2"></i>
              <strong>Activity:</strong> {{ activityToDelete.title }}
            </div>
            <div class="alert alert-danger" role="alert">
              <i class="pi pi-exclamation-circle me-2"></i>
              <strong>Warning:</strong> This action cannot be undone. All data associated with this activity will be permanently removed.
            </div>
          </div>
          <div class="modal-footer border-0">
            <button type="button" class="btn btn-secondary" @click="cancelDelete">
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-danger"
              @click="confirmDelete"
              :disabled="loading"
              aria-label="Delete selected activity"
            >
              <i class="pi pi-trash me-1" aria-hidden="true"></i>
              {{ loading ? 'Deleting...' : 'Delete Activity' }}
            </button>
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
import { useData } from '../composables/useData.js'

const route = useRoute()
const { activities, loadActivities, deleteActivity } = useData()

// Loading state
const loading = ref(false)

// Pagination
const currentPage = ref(1)
const rowsPerPage = ref(10)

// Search functionality
const searchQuery = ref('')
const searchColumn = ref('all')
const filteredActivities = ref([])

// DataTable sorting
const sortField = ref('title')
const sortOrder = ref(1)

// Activity stats
const stats = ref({
  total: 0,
  totalRsvps: 0,
  topSport: '',
  topPlayground: '',
})

// Delete confirmation modal
const showDeleteModal = ref(false)
const activityToDelete = ref(null)

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

// Custom pagination computed properties
const totalActivities = computed(() => filteredActivities.value?.length || 0)
const totalPages = computed(() => Math.ceil(totalActivities.value / Number(rowsPerPage.value)) || 1)
const startRecord = computed(() => Math.min((currentPage.value - 1) * Number(rowsPerPage.value) + 1, totalActivities.value) || 0)
const endRecord = computed(() => Math.min(currentPage.value * Number(rowsPerPage.value), totalActivities.value) || 0)

// Paginated activities for the DataTable
const paginatedActivities = computed(() => {
  if (!filteredActivities.value || filteredActivities.value.length === 0) return []

  const rowsPerPageNum = Number(rowsPerPage.value)
  const start = (currentPage.value - 1) * rowsPerPageNum
  const end = start + rowsPerPageNum

  return filteredActivities.value.slice(start, end)
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

// Pagination methods
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

// Search functions
function performSearch() {
  if (!searchQuery.value.trim()) {
    filteredActivities.value = [...activities.value]
    currentPage.value = 1
    return
  }

  const query = searchQuery.value.toLowerCase().trim()
  const column = searchColumn.value

  filteredActivities.value = activities.value.filter(activity => {
    if (column === 'all') {
      return (
        activity.title?.toLowerCase().includes(query) ||
        activity.sport?.toLowerCase().includes(query) ||
        activity.location?.toLowerCase().includes(query)
      )
    } else if (column === 'title') {
      return activity.title?.toLowerCase().includes(query)
    } else if (column === 'sport') {
      return activity.sport?.toLowerCase().includes(query)
    } else if (column === 'location') {
      return activity.location?.toLowerCase().includes(query)
    }
    return false
  })

  currentPage.value = 1 // Reset to first page when searching
}

function clearSearch() {
  searchQuery.value = ''
  searchColumn.value = 'all'
  filteredActivities.value = [...activities.value]
  currentPage.value = 1
}

// Activity utility functions
function formatDate(datetime) {
  if (!datetime) return 'N/A'

  try {
    const date = new Date(datetime)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'N/A'
  }
}

function formatTime(datetime) {
  if (!datetime) return 'N/A'

  try {
    const date = new Date(datetime)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  } catch (error) {
    console.error('Error formatting time:', error)
    return 'N/A'
  }
}

function getRsvpCount(activity) {
  const rsvps = activity.rsvps || []
  return Array.isArray(rsvps) ? rsvps.length : 0
}

// Delete activity function - show confirmation modal
function confirmDeleteActivity(activity) {
  activityToDelete.value = activity
  showDeleteModal.value = true
}

// Cancel delete
function cancelDelete() {
  showDeleteModal.value = false
  activityToDelete.value = null
}

// Confirm delete
async function confirmDelete() {
  if (!activityToDelete.value) return

  try {
    loading.value = true
    await deleteActivity(activityToDelete.value.id)
    toast.success('Activity deleted successfully')

    // Update filtered activities if needed
    if (filteredActivities.value.length > 0) {
      filteredActivities.value = filteredActivities.value.filter(a => a.id !== activityToDelete.value.id)
    }

    // Adjust current page if needed
    if (currentPage.value > totalPages.value && totalPages.value > 0) {
      currentPage.value = totalPages.value
    }
  } catch (error) {
    console.error('Error deleting activity:', error)
    toast.error('Failed to delete activity')
  } finally {
    loading.value = false
    showDeleteModal.value = false
    activityToDelete.value = null
  }
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

    // Initialize filtered activities with all activities
    filteredActivities.value = [...activities.value]
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
  background: linear-gradient(135deg, #1e3a8a 0%, #000000 100%);
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
  width: 100%;
  display: flex;
  justify-content: flex-start;
}

.search-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  max-width: 800px;
}

.search-column {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #495057;
  margin: 0;
  white-space: nowrap;
}

.search-select {
  padding: 0.5rem 0.75rem;
  border: 2px solid #e9ecef;
  border-radius: 0.375rem;
  background: white;
  color: #495057;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
}

.search-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 200px;
  max-width: 300px;
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
  color: #495057;
  transition: all 0.3s ease;
  background: white;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.search-button:hover {
  background: #5a6fd8;
  transform: translateY(-1px);
}

.search-button:active {
  transform: translateY(0);
}

.clear-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.clear-button:hover {
  background: #5a6268;
  transform: translateY(-1px);
}

.clear-button:active {
  transform: translateY(0);
}

/* Table Cell Styles */
.activity-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.activity-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.1rem;
}

.activity-details {
  flex: 1;
}

.activity-title {
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
  font-size: 0.95rem;
}

.activity-sport {
  font-size: 0.8rem;
  color: #6c757d;
  margin: 0;
  text-transform: capitalize;
}

.datetime-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.date-text {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
}

.time-text {
  font-size: 0.8rem;
  color: #6c757d;
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


.rsvp-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  text-align: center;
}

.rsvp-count {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rsvp-capacity {
  font-size: 0.75rem;
  color: #6c757d;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.delete-btn {
  background: #dc3545 !important;
  border-color: #dc3545 !important;
  color: white !important;
}

.delete-btn:hover {
  background: #c82333 !important;
  border-color: #bd2130 !important;
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
  font-size: 1.4rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
  line-height: 1.2;
}

.stat-label {
  color: #6c757d;
  font-size: 0.8rem;
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

/* Responsive Design */
@media (max-width: 768px) {
  .dashboard-title {
    font-size: 2rem;
  }

  .stats-summary {
    gap: 1rem;
  }

  .stat-number {
    font-size: 1.2rem;
  }

  .stat-label {
    font-size: 0.75rem;
  }

  .search-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .search-column {
    justify-content: center;
  }

  .search-input-wrapper {
    min-width: 100%;
    max-width: 100%;
  }

  .search-button,
  .clear-button {
    width: 100%;
    justify-content: center;
  }

  .activity-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .activity-icon {
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
