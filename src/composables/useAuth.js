import { ref, computed } from 'vue'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { auth, db } from '../firebase/init.js'

const functions = getFunctions()
const seedAdminFunction = httpsCallable(functions, 'seedAdmin', { region: 'us-central1' })

const user = ref(null)

async function login(email, password) {
  try {
    // First ensure admin user exists if trying to login as admin
    if (email === 'admin@mailinator.com') {
      await seedAdmin()
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const firebaseUser = userCredential.user

    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
    if (userDoc.exists()) {
      const userData = userDoc.data()
      // Check if user is deleted
      if (userData.deleted) {
        throw new Error('Account has been deleted')
      }
      user.value = userData
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
          const userData = userDoc.data()
          // Check if user is deleted
          if (userData.deleted) {
            user.value = null
            await signOut(auth) // Sign out deleted user
          } else {
            user.value = userData
          }
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
    // Call Cloud Function to create admin user in both Auth and Firestore
    const result = await seedAdminFunction()
    console.log(result.data.message)
  } catch (error) {
    console.error('Error seeding admin user:', error)
  }
}

// const defaultAdmin = {
//   firstName: 'Admin',
//   lastName: 'User',
//   email: 'admin@mailinator.com',
//   password: 'Admin123!',
//   role: 'admin',
//   city: 'Melbourne',
//   bio: 'Platform administrator',
//   preferredPlaygrounds: [],
//   sportsInterest: [],
// }

const isAdmin = computed(() => user.value?.role === 'admin')

export function useAuth() {
  loadUser()
  return { user, login, logout, loadUser, isAdmin }
}
