import { ref, computed } from 'vue'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/init.js'

const user = ref(null)

async function login(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const firebaseUser = userCredential.user
    
    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
    if (userDoc.exists()) {
      user.value = userDoc.data()
    } else {
      throw new Error('User data not found')
    }
    
    return { success: true }
  } catch (error) {
    console.error('Login error:', error)
    return { 
      success: false, 
      error: error.message || 'Login failed' 
    }
  }
}

async function logout() {
  try {
    await signOut(auth)
    user.value = null
  } catch (error) {
    console.error('Logout error:', error)
  }
}

function loadUser() {
  // Set up auth state listener
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        // Get user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
        if (userDoc.exists()) {
          user.value = userDoc.data()
        }
      } catch (error) {
        console.error('Error loading user data:', error)
        user.value = null
      }
    } else {
      user.value = null
    }
  })
}

async function seedAdmin() {
  try {
    // Check if admin user already exists in Firestore
    const adminQuery = await getDoc(doc(db, 'users', 'admin'))
    
    if (!adminQuery.exists()) {
      // Create admin user document in Firestore
      await setDoc(doc(db, 'users', 'admin'), {
        ...defaultAdmin,
        uid: 'admin',
        createdAt: new Date().toISOString()
      })
      console.log('Admin user seeded in Firestore')
    }
  } catch (error) {
    console.error('Error seeding admin user:', error)
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
