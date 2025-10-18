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
                Activities by Sport
              </h4>
              <p class="card-subtitle text-muted mb-0">Distribution of activities across different sports</p>
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

  // Calculate activities by sport
  const sportCount = {}
  activities.value.forEach(activity => {
    const sport = activity.sport || 'Unknown'
    sportCount[sport] = (sportCount[sport] || 0) + 1
  })
  stats.value.sportDistribution = sportCount

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
              return context[0].label
            },
            label: function(context) {
              return `${context.parsed.y} activities`
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

  .stat-number-small {
    font-size: 1.5rem;
  }

  .stat-label-small {
    font-size: 0.75rem;
  }
}
</style>
