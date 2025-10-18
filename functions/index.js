/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onCall } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions";
import * as functions from "firebase-functions";
import admin from "firebase-admin";
// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

admin.initializeApp();

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

export const seedAdmin = onCall(async () => {
  try {
    // Check if admin user already exists in Firestore by email
    const adminQuery = await admin.firestore().collection('users').where('email', '==', 'admin@mailinator.com').limit(1).get();

    if (!adminQuery.empty) {
      return { success: true, message: 'Admin user already exists' };
    }

    // Create admin user in Firebase Auth (let Firebase generate UID)
    const adminUser = await admin.auth().createUser({
      email: 'admin@mailinator.com',
      password: 'Admin123!',
      displayName: 'Admin User'
    });

    // Create admin user document in Firestore using the generated UID
    await admin.firestore().collection('users').doc(adminUser.uid).set({
      uid: adminUser.uid,
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@mailinator.com',
      role: 'admin',
      city: 'Melbourne',
      bio: 'Platform administrator',
      preferredPlaygrounds: [],
      sportsInterest: [],
      createdAt: new Date().toISOString()
    });

    return { success: true, message: 'Admin user created successfully' };
  } catch (error) {
    console.error('Error seeding admin user:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create admin user');
  }
});

export const deleteUser = onCall(async (data) => {
  console.log('deleteUser called with data:', data);

  // The userId is nested in data.data.userId
  const userId = data?.data?.userId;

  if (!userId) {
    console.error('No userId provided, data:', data);
    throw new functions.https.HttpsError('invalid-argument', 'userId is required');
  }

  try {
    // Just delete from Firestore and mark as deleted
    await admin.firestore().collection('users').doc(userId).update({
      deleted: true,
      deletedAt: new Date().toISOString()
    });

    return { success: true, message: 'User deleted successfully' };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new functions.https.HttpsError('internal', 'Failed to delete user');
  }
});

export const seedUsers = onCall(async (data) => {
  try {
    const sampleUsers = data?.data?.users || [];
    const createdUserIds = [];

    for (const userData of sampleUsers) {
      try {
        // Check if user already exists in Firestore by email
        const userQuery = await admin.firestore()
          .collection('users')
          .where('email', '==', userData.email)
          .limit(1)
          .get();

        if (!userQuery.empty) {
          // User already exists, add their ID to the list
          createdUserIds.push(userQuery.docs[0].id);
          console.log(`User ${userData.email} already exists`);
          continue;
        }

        // Check if user exists in Auth
        let authUser;
        try {
          authUser = await admin.auth().getUserByEmail(userData.email);
          console.log(`Auth user ${userData.email} already exists`);
        } catch (error) {
          // User doesn't exist in Auth, create them
          authUser = await admin.auth().createUser({
            email: userData.email,
            password: userData.password,
            displayName: `${userData.firstName} ${userData.lastName}`
          });
          console.log(`Created Auth user ${userData.email}`);
        }

        // Create user document in Firestore
        await admin.firestore().collection('users').doc(authUser.uid).set({
          uid: authUser.uid,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          dob: userData.dob || '',
          bio: userData.bio || '',
          city: userData.city || '',
          preferredPlaygrounds: userData.preferredPlaygrounds || [],
          sportsInterest: userData.sportsInterest || [],
          role: userData.role || 'user',
          createdAt: new Date().toISOString()
        });

        createdUserIds.push(authUser.uid);
        console.log(`Created Firestore document for ${userData.email}`);

      } catch (error) {
        console.error(`Error seeding user ${userData.email}:`, error);
        // Continue with other users even if one fails
      }
    }

    return {
      success: true,
      message: `Seeded ${createdUserIds.length} users`,
      userIds: createdUserIds
    };
  } catch (error) {
    console.error('Error seeding users:', error);
    throw new functions.https.HttpsError('internal', 'Failed to seed users');
  }
});
