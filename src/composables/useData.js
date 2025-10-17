import { ref } from 'vue'
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, setDoc, getDoc, query, where } from 'firebase/firestore'
import { db } from '../firebase/init.js'
import exEventsData from '../assets/data/ex_events.json'
import playgroundsData from '../assets/data/playgrounds.json'
import sampleReviewsData from '../assets/data/sample_reviews.json'

// Reactive data
const activities = ref([])
const playgrounds = ref([])

// Seed data to Firestore if collections are empty
async function seedData() {
  try {
    // Check and seed activities
    const activitiesSnapshot = await getDocs(collection(db, 'activities'))
    if (activitiesSnapshot.empty) {
      console.log('Seeding activities data...')
      for (const activity of exEventsData) {
        // eslint-disable-next-line no-unused-vars
        const { id, ...activityData } = activity // Remove the original id
        await addDoc(collection(db, 'activities'), {
          ...activityData,
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
    getActivitiesByLocation
  }
}
