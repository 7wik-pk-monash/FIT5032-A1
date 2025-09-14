import { ref, computed } from 'vue'

const user = ref(null)

function login(userData) {
  localStorage.setItem('loggedInUser', JSON.stringify(userData))
  user.value = userData
}

function logout() {
  localStorage.removeItem('loggedInUser')
  user.value = null
}

function loadUser() {
  const stored = localStorage.getItem('loggedInUser')
  user.value = stored ? JSON.parse(stored) : null
}

function seedAdmin() {
  const users = JSON.parse(localStorage.getItem('users') || '[]')
  const exists = users.find(u => u.email === defaultAdmin.email)

  // // debug: remove previously seeded admin account to seed changes
  // if (exists)
  // {
  //   localStorage.setItem('users', JSON.stringify(users.filter(u => u.email !== defaultAdmin.email)))
  //   users.push(defaultAdmin)
  //   localStorage.setItem('users', JSON.stringify(users))
  // }

  if (!exists) {
    users.push(defaultAdmin)
    localStorage.setItem('users', JSON.stringify(users))
  }
}

const defaultAdmin = {
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@mailinator.com',
  password: 'Admin123!',
  role: 'admin',
  city: 'Melbourne',
  bio: 'Platform administrator',
  preferredPlaygrounds: [],
  sportsInterest: [],
}

const isAdmin = computed(() => user.value?.role === 'admin')

export function useAuth() {
  seedAdmin()
  loadUser()
  return { user, login, logout, loadUser, isAdmin }
}
