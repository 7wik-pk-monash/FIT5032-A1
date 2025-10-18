import { ref } from 'vue'
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, setDoc, getDoc, query, where } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { db } from '../firebase/init.js'
import exEventsData from '../assets/data/ex_events.json'
import playgroundsData from '../assets/data/playgrounds.json'
import sampleReviewsData from '../assets/data/sample_reviews.json'
import sampleUsersData from '../assets/data/sample_users.json'

// Reactive data
const activities = ref([])
const playgrounds = ref([])

// Seed data to Firestore if collections are empty
async function seedData() {
  try {
    const functions = getFunctions()
    const seedUsersFunction = httpsCallable(functions, 'seedUsers', { region: 'us-central1' })

    // First, seed users and get their IDs
    let userIds = []
    const usersSnapshot = await getDocs(collection(db, 'users'))

    // Only seed users if we have less than 3 non-admin users (excluding admin)
    const nonAdminUsers = usersSnapshot.docs.filter(doc => {
      const userData = doc.data()
      return userData.role !== 'admin' && !userData.deleted
    })

    if (nonAdminUsers.length < 3) {
      console.log('Seeding sample users...')
      try {
        const result = await seedUsersFunction({ users: sampleUsersData })
        userIds = result.data.userIds || []
        console.log(`Sample users seeded successfully. User IDs:`, userIds)
      } catch (error) {
        console.error('Error seeding users:', error)
        // Continue with activities even if user seeding fails
      }
    } else {
      // Get existing user IDs to use for activities
      userIds = nonAdminUsers.map(doc => doc.id)
      console.log('Using existing user IDs for activities:', userIds)
    }

    // Check and seed activities
    const activitiesSnapshot = await getDocs(collection(db, 'activities'))
    if (activitiesSnapshot.empty) {
      console.log('Seeding activities data...')
      for (let i = 0; i < exEventsData.length; i++) {
        const activity = exEventsData[i]
        // eslint-disable-next-line no-unused-vars
        const { id, ...activityData } = activity // Remove the original id

        // Assign random users to rsvps (between 0 and min(capacity, userIds.length))
        const numRsvps = userIds.length > 0
          ? Math.floor(Math.random() * Math.min(activityData.capacity || 10, userIds.length + 1))
          : 0

        // Shuffle and take the first numRsvps users
        const shuffledUserIds = [...userIds].sort(() => Math.random() - 0.5)
        const activityRsvps = shuffledUserIds.slice(0, numRsvps)

        // Assign the first user as the creator for the first activity
        const createdBy = userIds.length > 0 && i === 0 ? userIds[0] : (userIds[i % userIds.length] || 'system')

        await addDoc(collection(db, 'activities'), {
          ...activityData,
          rsvps: activityRsvps,
          createdBy: createdBy,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      }
      console.log('Activities seeded successfully')
    }

    // Check and seed playgrounds
    const playgroundsSnapshot = await getDocs(collection(db, 'playgrounds'))
    if (playgroundsSnapshot.empty) {
      console.log('Seeding playgrounds data...')
      for (const playground of playgroundsData) {
        // eslint-disable-next-line no-unused-vars
        const { id, ...playgroundData } = playground // Remove the original id
        await addDoc(collection(db, 'playgrounds'), {
          ...playgroundData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      }
      console.log('Playgrounds seeded successfully')
    }

    // Check and seed sample reviews
    const reviewsSnapshot = await getDocs(collection(db, 'playground_reviews'))
    if (reviewsSnapshot.empty) {
      console.log('Seeding sample reviews data...')
      for (const review of sampleReviewsData) {
        await addDoc(collection(db, 'playground_reviews'), {
          ...review,
          createdAt: review.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      }
      console.log('Sample reviews seeded successfully')
    }
  } catch (error) {
    console.error('Error seeding data:', error)
  }
}

// Load activities from Firestore
async function loadActivities() {
  try {
    const activitiesSnapshot = await getDocs(collection(db, 'activities'))
    activities.value = activitiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Error loading activities:', error)
    activities.value = []
  }
}

// Load playgrounds from Firestore
async function loadPlaygrounds() {
  try {
    // Load playgrounds
    const playgroundsSnapshot = await getDocs(collection(db, 'playgrounds'))
    const playgroundsData = playgroundsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Load reviews
    const reviewsSnapshot = await getDocs(collection(db, 'playground_reviews'))
    const reviewsData = reviewsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Calculate average ratings for each playground
    playgrounds.value = playgroundsData.map(playground => {
      const playgroundReviews = reviewsData.filter(review => review.playgroundId === playground.id)
      const averageRating = playgroundReviews.length > 0
        ? (playgroundReviews.reduce((sum, review) => sum + review.score, 0) / playgroundReviews.length).toFixed(1)
        : null

      return {
        ...playground,
        reviews: playgroundReviews,
        averageRating: averageRating,
        reviewCount: playgroundReviews.length
      }
    })
  } catch (error) {
    console.error('Error loading playgrounds:', error)
    playgrounds.value = []
  }
}

// Ensure playground exists (create if it doesn't)
async function ensurePlaygroundExists(playgroundName, coordinates = null) {
  try {
    // Check if playground already exists
    const existingPlayground = playgrounds.value.find(p =>
      p.name.trim().toLowerCase() === playgroundName.trim().toLowerCase()
    )

    if (!existingPlayground) {
      console.log(`Creating new playground: ${playgroundName}`)

      // Create a new playground document in Firestore
      const newPlaygroundRef = await addDoc(collection(db, 'playgrounds'), {
        name: playgroundName.trim(),
        lat: coordinates?.lat || null,
        lng: coordinates?.lng || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      // Add to local playgrounds array
      const newPlayground = {
        id: newPlaygroundRef.id,
        name: playgroundName.trim(),
        lat: coordinates?.lat || null,
        lng: coordinates?.lng || null,
        reviews: [],
        averageRating: null,
        reviewCount: 0
      }

      playgrounds.value.push(newPlayground)
      return newPlayground
    }

    return existingPlayground
  } catch (error) {
    console.error('Error ensuring playground exists:', error)
    throw error
  }
}

// Add new activity
async function addActivity(activityData) {
  try {
    // Ensure playground exists for the activity location
    await ensurePlaygroundExists(activityData.location, {
      lat: activityData.lat,
      lng: activityData.lng
    })

    const docRef = await addDoc(collection(db, 'activities'), {
      ...activityData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    await loadActivities() // Reload activities
    return docRef.id
  } catch (error) {
    console.error('Error adding activity:', error)
    throw error
  }
}

// Update activity
async function updateActivity(activityId, updateData) {
  try {
    await updateDoc(doc(db, 'activities', activityId), {
      ...updateData,
      updatedAt: new Date().toISOString()
    })
    await loadActivities() // Reload activities
  } catch (error) {
    console.error('Error updating activity:', error)
    throw error
  }
}

// Delete activity
async function deleteActivity(activityId) {
  try {
    await deleteDoc(doc(db, 'activities', activityId))
    await loadActivities() // Reload activities
  } catch (error) {
    console.error('Error deleting activity:', error)
    throw error
  }
}

// Get activity by ID
async function getActivityById(activityId) {
  try {
    const activityDoc = await getDoc(doc(db, 'activities', activityId))
    if (activityDoc.exists()) {
      return {
        id: activityDoc.id,
        ...activityDoc.data()
      }
    }
    return null
  } catch (error) {
    console.error('Error getting activity:', error)
    throw error
  }
}

// Add playground review
async function addPlaygroundReview(playgroundName, reviewData) {
  try {
    // Find playground by name (case-insensitive)
    const playground = playgrounds.value.find(p =>
      p.name.trim().toLowerCase() === playgroundName.trim().toLowerCase()
    )

    if (playground) {
      // Create composite document ID: playgroundId_userId
      const docId = `${playground.id}_${reviewData.userId}`

      // Prepare review document data
      const reviewDocData = {
        playgroundId: playground.id,
        playgroundName: playground.name,
        userId: reviewData.userId,
        userEmail: reviewData.userEmail,
        score: reviewData.score,
        comment: reviewData.comment,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Use setDoc to create or update the review (composite ID ensures uniqueness)
      await setDoc(doc(db, 'playground_reviews', docId), reviewDocData)

      // Reload playgrounds to get updated ratings
      await loadPlaygrounds()
    } else {
      throw new Error('Playground not found')
    }
  } catch (error) {
    console.error('Error adding playground review:', error)
    throw error
  }
}

// Get activities by sport
async function getActivitiesBySport(sport) {
  try {
    const q = query(collection(db, 'activities'), where('sport', '==', sport))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Error getting activities by sport:', error)
    return []
  }
}

// Get activities by location
async function getActivitiesByLocation(location) {
  try {
    const q = query(collection(db, 'activities'), where('location', '==', location))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Error getting activities by location:', error)
    return []
  }
}

// Join an activity
async function joinActivity(activityId, userId) {
  try {
    const activityDoc = await getDoc(doc(db, 'activities', activityId))
    if (!activityDoc.exists()) {
      throw new Error('Activity not found')
    }

    const activityData = activityDoc.data()
    const rsvps = activityData.rsvps || []

    // Check if user already joined
    if (rsvps.includes(userId)) {
      throw new Error('You have already joined this activity')
    }

    // Check if activity is full
    if (rsvps.length >= activityData.capacity) {
      throw new Error('Activity is full')
    }

    // Add user to rsvps array
    await updateDoc(doc(db, 'activities', activityId), {
      rsvps: [...rsvps, userId],
      updatedAt: new Date().toISOString()
    })

    await loadActivities() // Reload activities
  } catch (error) {
    console.error('Error joining activity:', error)
    throw error
  }
}

// Leave an activity
async function leaveActivity(activityId, userId) {
  try {
    const activityDoc = await getDoc(doc(db, 'activities', activityId))
    if (!activityDoc.exists()) {
      throw new Error('Activity not found')
    }

    const activityData = activityDoc.data()
    const rsvps = activityData.rsvps || []

    // Check if user has joined
    if (!rsvps.includes(userId)) {
      throw new Error('You have not joined this activity')
    }

    // Remove user from rsvps array
    const updatedRsvps = rsvps.filter(id => id !== userId)
    await updateDoc(doc(db, 'activities', activityId), {
      rsvps: updatedRsvps,
      updatedAt: new Date().toISOString()
    })

    await loadActivities() // Reload activities
  } catch (error) {
    console.error('Error leaving activity:', error)
    throw error
  }
}

export function useData() {
  return {
    activities,
    playgrounds,
    seedData,
    loadActivities,
    loadPlaygrounds,
    addActivity,
    updateActivity,
    deleteActivity,
    getActivityById,
    addPlaygroundReview,
    ensurePlaygroundExists,
    getActivitiesBySport,
    getActivitiesByLocation,
    joinActivity,
    leaveActivity
  }
}
