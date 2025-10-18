<template>
  <div class="admin-dashboard">
    <!-- Header Section -->
    <div class="dashboard-header">
      <div class="container">
        <div class="row align-items-center">
          <div class="col">
            <h1 class="dashboard-title">
              <i class="pi pi-chart-bar me-3"></i>
              Analytics Dashboard
            </h1>
            <p class="dashboard-subtitle">Platform insights and activity analytics</p>
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
      <!-- Activities by Sport Chart -->
      <div class="card admin-card">
        <div class="card-header">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h4 class="card-title mb-1">
                <i class="pi pi-chart-bar me-2"></i>
                {{ groupBy === 'sport' ? 'Activities by Sport' : 'Accessibility & Inclusion' }}
              </h4>
              <p class="card-subtitle text-muted mb-0">
                {{ groupBy === 'sport' ? 'Distribution of activities across different sports' : 'Activities categorized by accessibility and inclusion features' }}
              </p>
            </div>
            <div class="chart-filters">
              <div class="filter-group">
                <label class="filter-label">Time Range:</label>
                <div class="btn-group" role="group">
                  <input
                    type="radio"
                    class="btn-check"
                    name="timeFilter"
                    id="allTime"
                    value="all"
                    v-model="timeFilter"
                    @change="updateChart"
                  >
                  <label class="btn btn-outline-primary" for="allTime">All Time</label>

                  <input
                    type="radio"
                    class="btn-check"
                    name="timeFilter"
                    id="futureOnly"
                    value="future"
                    v-model="timeFilter"
                    @change="updateChart"
                  >
                  <label class="btn btn-outline-primary" for="futureOnly">Future Only</label>
                </div>
              </div>

              <div class="filter-group">
                <label class="filter-label">Group By:</label>
                <div class="btn-group" role="group">
                  <input
                    type="radio"
                    class="btn-check"
                    name="groupBy"
                    id="bySport"
                    value="sport"
                    v-model="groupBy"
                    @change="updateChart"
                  >
                  <label class="btn btn-outline-secondary" for="bySport">Sport</label>

                  <input
                    type="radio"
                    class="btn-check"
                    name="groupBy"
                    id="byAccessibility"
                    value="accessibility"
                    v-model="groupBy"
                    @change="updateChart"
                  >
                  <label class="btn btn-outline-secondary" for="byAccessibility">Accessibility</label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card-body">
          <div class="chart-container">
            <canvas ref="chartCanvas" width="400" height="200"></canvas>
          </div>
        </div>
      </div>

        <!-- Additional Analytics Cards -->
        <div class="row mt-4">
          <div class="col-lg-4">
            <div class="card admin-card h-100">
              <div class="card-header">
                <h4 class="card-title mb-1">
                  <i class="pi pi-users me-2"></i>
                  Avg RSVPs/Activity
                </h4>
                <p class="card-subtitle text-muted mb-0">Average participation rate</p>
              </div>
              <div class="card-body d-flex flex-column">
                <div class="stat-item-small flex-grow-1">
                  <div class="stat-number-small">{{ stats.averageRsvpsPerActivity }}</div>
                  <div class="stat-label-small">participants per activity</div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-lg-8">
            <div class="card admin-card h-100">
              <div class="card-header">
                <h4 class="card-title mb-1">
                  <i class="pi pi-calendar me-2"></i>
                  Activity Timeline
                </h4>
                <p class="card-subtitle text-muted mb-0">Recent activity trends</p>
              </div>
              <div class="card-body d-flex flex-column">
                <div class="row g-3 flex-grow-1">
                  <div class="col-6 d-flex">
                    <div class="stat-item-small flex-grow-1">
                      <div class="stat-number-small">{{ stats.activitiesThisWeek }}</div>
                      <div class="stat-label-small">This Week</div>
                    </div>
                  </div>
                  <div class="col-6 d-flex">
                    <div class="stat-item-small flex-grow-1">
                      <div class="stat-number-small">{{ stats.activitiesThisMonth }}</div>
                      <div class="stat-label-small">This Month</div>
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
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { toast } from 'vue3-toastify'
import { useData } from '../composables/useData.js'
import Chart from 'chart.js/auto'

const route = useRoute()
const { activities, loadActivities } = useData()

// Chart reference
const chartCanvas = ref(null)
let chartInstance = null

// Loading state
const loading = ref(false)

// Time filter for chart
const timeFilter = ref('all')

// Group by filter for chart
const groupBy = ref('sport')

// Analytics stats
const stats = ref({
  total: 0,
  totalRsvps: 0,
  averageRsvpsPerActivity: 0,
  mostPopularActivity: 'N/A',
  activitiesThisWeek: 0,
  activitiesThisMonth: 0,
  sportDistribution: {}
})

// Helper function to filter only future events (copied from Events.vue)
const filterFutureEvents = (events) => {
  const now = new Date()
  return events.filter(event => {
    if (!event.datetime) return false

    try {
      const eventDate = new Date(event.datetime)
      return eventDate > now
    } catch (error) {
      console.error('Error parsing datetime:', error)
      return false
    }
  })
}

// Get filtered activities based on time filter
const getFilteredActivities = () => {
  if (timeFilter.value === 'future') {
    return filterFutureEvents(activities.value)
  }
  return activities.value
}

// Map accessibility values to user-friendly labels
const getAccessibilityLabel = (accessibility) => {
  const labelMap = {
    'wheelchair': 'Wheelchair Accessible',
    'inclusive': 'LGBTQ+ Inclusive',
    'open': 'Open to All',
    'Unknown': 'Not Specified'
  }
  return labelMap[accessibility] || `${accessibility}`
}

// Compute analytics
function computeAnalytics() {
  stats.value.total = activities.value.length

  // Calculate total RSVPs
  stats.value.totalRsvps = activities.value.reduce((sum, activity) => {
    const rsvps = activity.rsvps || []
    return sum + (Array.isArray(rsvps) ? rsvps.length : 0)
  }, 0)

  // Calculate average RSVPs per activity
  stats.value.averageRsvpsPerActivity = stats.value.total > 0
    ? Math.round(stats.value.totalRsvps / stats.value.total)
    : 0

  // Find most popular activity (by RSVPs)
  const mostPopular = activities.value.reduce((max, activity) => {
    const rsvps = activity.rsvps || []
    const currentRsvps = Array.isArray(rsvps) ? rsvps.length : 0
    const maxRsvps = Array.isArray(max.rsvps) ? max.rsvps.length : 0
    return currentRsvps > maxRsvps ? activity : max
  }, { rsvps: [] })

  stats.value.mostPopularActivity = mostPopular.title || 'N/A'

  // Calculate activities by sport or accessibility using filtered activities
  const filteredActivities = getFilteredActivities()
  const groupCount = {}
  filteredActivities.forEach(activity => {
    let groupValue
    if (groupBy.value === 'sport') {
      groupValue = activity.sport || 'Unknown'
    } else {
      // Map accessibility values to user-friendly labels
      const accessibility = activity.accessibility || 'Unknown'
      groupValue = getAccessibilityLabel(accessibility)
    }
    groupCount[groupValue] = (groupCount[groupValue] || 0) + 1
  })
  stats.value.sportDistribution = groupCount

  // Calculate activities this week and month
  const now = new Date()
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  stats.value.activitiesThisWeek = activities.value.filter(activity => {
    if (!activity.createdAt) return false
    const createdDate = new Date(activity.createdAt)
    return createdDate >= oneWeekAgo
  }).length

  stats.value.activitiesThisMonth = activities.value.filter(activity => {
    if (!activity.createdAt) return false
    const createdDate = new Date(activity.createdAt)
    return createdDate >= oneMonthAgo
  }).length
}

// Update chart when filter changes
function updateChart() {
  computeAnalytics()
  createChart()
}

// Create bar chart
function createChart() {
  if (!chartCanvas.value) return

  const ctx = chartCanvas.value.getContext('2d')

  // Destroy existing chart if it exists
  if (chartInstance) {
    chartInstance.destroy()
  }

  const sportData = stats.value.sportDistribution
  const labels = Object.keys(sportData)
  const data = Object.values(sportData)

  // Color palette for different sports
  const colors = [
    '#667eea', '#764ba2', '#f093fb', '#f5576c',
    '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
    '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3'
  ]

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Number of Activities',
        data: data,
        backgroundColor: colors.slice(0, labels.length),
        borderColor: colors.slice(0, labels.length).map(color => color + '80'),
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'white',
          bodyColor: 'white',
          borderColor: '#667eea',
          borderWidth: 1,
          cornerRadius: 8,
          callbacks: {
            title: function(context) {
              const label = context[0].label
              // For accessibility labels, show a cleaner version in tooltip
              if (groupBy.value === 'accessibility') {
                return label.replace(/^[^\s]+\s/, '') // Remove emoji and space
              }
              return label
            },
            label: function(context) {
              const count = context.parsed.y
              const label = context.label
              if (groupBy.value === 'accessibility') {
                const cleanLabel = label.replace(/^[^\s]+\s/, '') // Remove emoji and space
                return `${count} ${count === 1 ? 'activity' : 'activities'} - ${cleanLabel}`
              }
              return `${count} ${count === 1 ? 'activity' : 'activities'}`
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            color: '#6c757d',
            font: {
              size: 12
            }
          },
          grid: {
            color: '#e9ecef',
            drawBorder: false
          }
        },
        x: {
          ticks: {
            color: '#495057',
            font: {
              size: 12,
              weight: '500'
            }
          },
          grid: {
            display: false
          }
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuart'
      }
    }
  })
}

// Load data on mount
onMounted(async () => {
  loading.value = true
  try {
    await loadActivities()
    computeAnalytics()

    // Create chart after a short delay to ensure DOM is ready
    setTimeout(() => {
      createChart()
    }, 100)
  } catch (error) {
    console.error('Error loading analytics data:', error)
    toast.error('Failed to load analytics data')
  } finally {
    loading.value = false
  }

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
  font-size: 1.4rem;
  font-weight: 700;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.8rem;
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

/* Chart Container */
.chart-container {
  position: relative;
  height: 400px;
  width: 100%;
  padding: 1rem;
}

/* Chart Filters */
.chart-filters {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.filter-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #495057;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.chart-filters .btn-group {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.chart-filters .btn-check:checked + .btn {
  background-color: #667eea;
  border-color: #667eea;
  color: white;
}

.chart-filters .btn-check[name="groupBy"]:checked + .btn {
  background-color: #6c757d;
  border-color: #6c757d;
  color: white;
}

.chart-filters .btn {
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  transition: all 0.3s ease;
}

.chart-filters .btn:hover {
  background-color: #e9ecef;
  border-color: #adb5bd;
}

/* Small Stats */
.stat-item-small {
  text-align: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100px;
}

.stat-number-small {
  font-size: 1.8rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
  line-height: 1.2;
}

.stat-label-small {
  color: #6c757d;
  font-size: 0.8rem;
  margin: 0.5rem 0 0 0;
  font-weight: 500;
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

  .chart-container {
    height: 300px;
  }

  .chart-filters {
    margin-top: 1rem;
    align-items: stretch;
  }

  .filter-group {
    align-items: stretch;
  }

  .filter-label {
    font-size: 0.75rem;
  }

  .chart-filters .btn {
    font-size: 0.8rem;
    padding: 0.4rem 0.8rem;
  }

  .stat-number-small {
    font-size: 1.5rem;
  }

  .stat-label-small {
    font-size: 0.75rem;
  }
}
</style>
