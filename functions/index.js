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
import { defineSecret } from "firebase-functions/params";
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

// nodemailer functions
import nodemailer from 'nodemailer';

// Define secrets
const gmailUser = defineSecret('GMAIL_USER');
const gmailPass = defineSecret('GMAIL_PASS');

// Create transporter function (called at runtime)
function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser.value(),
      pass: gmailPass.value()
    }
  });
}

// Email function
async function sendEmail(mailOptions) {
  try {
    const transporter = createTransporter();

    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

// Cloud Function
export const sendWelcomeEmail = onCall(async (data) => {
  const { userEmail, userData } = data.data;
  const mailOptions = {
    from: gmailUser.value(),
    to: userEmail,
    subject: 'Welcome to TeamUp!',
    html: `
      <h2>Welcome to TeamUp!</h2>
      <p>Hello ${userData.firstName},</p>
      <p>Thank you for registering with TeamUp. We're excited to have you join our community!</p>
      <p>Your account details:</p>
      <ul>
        <li>Name: ${userData.firstName} ${userData.lastName}</li>
        <li>Email: ${userData.email}</li>
        <li>City: ${userData.city}</li>
      </ul>
      <p>Get started by exploring our events and activities!</p>
    `,
  };
  return await sendEmail(mailOptions);
});

// receipt generation - create PDF using jsPDF
import { jsPDF } from 'jspdf';
import { Buffer } from 'buffer';

async function generateReceiptPDF(donationData) {
  const doc = new jsPDF();

  // Set font
  doc.setFont('helvetica');

  // Header
  doc.setFontSize(24);
  doc.setTextColor(13, 110, 253); // Bootstrap primary blue
  doc.text('TeamUp', 105, 20, { align: 'center' });

  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text('DONATION RECEIPT', 105, 30, { align: 'center' });

  // Receipt details
  doc.setFontSize(12);
  doc.text('Receipt Number:', 20, 50);
  doc.text(donationData.receiptNumber, 60, 50);

  doc.text('Date:', 20, 60);
  doc.text(donationData.date, 60, 60);

  doc.text('Donor:', 20, 70);
  doc.text(donationData.donorName, 60, 70);

  doc.text('Email:', 20, 80);
  doc.text(donationData.donorEmail, 60, 80);

  // Items table header
  doc.setFontSize(14);
  doc.text('ITEMS DONATED', 20, 100);

  // Table
  let yPosition = 115;
  doc.setFontSize(10);

  // Table headers
  doc.text('Item', 20, yPosition);
  doc.text('Qty', 120, yPosition);
  doc.text('Unit Price', 140, yPosition);
  doc.text('Total', 170, yPosition);

  yPosition += 5;
  doc.line(20, yPosition, 190, yPosition);
  yPosition += 10;

  // Items
  doc.setFontSize(9);
  donationData.items.forEach(item => {
    doc.text(item.name, 20, yPosition);
    doc.text(item.quantity.toString(), 120, yPosition);
    doc.text(`$${item.unitPrice}`, 140, yPosition);
    doc.text(`$${item.total}`, 170, yPosition);
    yPosition += 8;
  });

  // Total
  yPosition += 10;
  doc.setFontSize(12);
  doc.text(`TOTAL DONATION: $${donationData.totalAmount} AUD`, 20, yPosition);

  // Footer
  yPosition += 30;
  doc.setFontSize(10);
  doc.text('Thank you for your generous donation to TeamUp!', 20, yPosition);
  yPosition += 8;
  doc.text('Your contribution helps us provide sports equipment to', 20, yPosition);
  yPosition += 8;
  doc.text('underrepresented communities.', 20, yPosition);
  yPosition += 12;
  doc.text('This receipt can be used for tax deduction purposes.', 20, yPosition);

  // Generate PDF buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
}

// Cloud Function for donation receipt
export const sendDonationReceipt = onCall(async (data) => {
  const { donationData } = data.data;

  try {
    // Generate PDF
    const pdfBuffer = await generateReceiptPDF(donationData);

    // Create email with PDF attachment
    const transporter = createTransporter();
    const mailOptions = {
      from: gmailUser.value(),
      to: donationData.donorEmail,
      subject: 'Thank you for your donation - Receipt attached',
      html: `
        <h2>Thank you for your donation!</h2>
        <p>Dear ${donationData.donorName},</p>
        <p>Thank you for your generous donation of $${donationData.totalAmount} AUD to TeamUp.</p>
        <p>Your contribution will help us provide sports equipment to underrepresented communities.</p>
        <p>Please find your receipt attached to this email.</p>
        <p>Best regards,<br>TeamUp Team</p>
      `,
      attachments: [{
        filename: `receipt-${donationData.receiptNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    };

    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending donation receipt:', error);
    return { success: false, error: error.message };
  }
});

// Cloud Function for bulk activity cancellation emails
export const sendActivityCancellationEmails = onCall(async (data) => {
  const { activityData, rsvpUserEmails } = data.data;

  try {
    const transporter = createTransporter();
    const results = [];

    // Send email to each RSVP user
    for (const userEmail of rsvpUserEmails) {
      try {
        const mailOptions = {
          from: gmailUser.value(),
          to: userEmail,
          subject: `Activity Cancelled: ${activityData.title}`,
          html: `
            <h2>Activity Cancelled</h2>
            <p>Dear TeamUp Member,</p>
            <p>We regret to inform you that the following activity has been cancelled:</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3>${activityData.title}</h3>
              <p><strong>Sport:</strong> ${activityData.sport}</p>
              <p><strong>Location:</strong> ${activityData.location}</p>
              <p><strong>Date & Time:</strong> ${new Date(activityData.datetime).toLocaleString('en-AU')}</p>
              <p><strong>Capacity:</strong> ${activityData.capacity} participants</p>
            </div>
            <p>We apologize for any inconvenience this may cause. Please check our platform for other exciting activities you can join!</p>
            <p>Thank you for your understanding.</p>
            <p>Best regards,<br>TeamUp Team</p>
          `
        };

        const result = await transporter.sendMail(mailOptions);
        results.push({
          email: userEmail,
          success: true,
          messageId: result.messageId
        });
      } catch (emailError) {
        console.error(`Error sending cancellation email to ${userEmail}:`, emailError);
        results.push({
          email: userEmail,
          success: false,
          error: emailError.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return {
      success: true,
      totalSent: successCount,
      totalFailed: failureCount,
      results: results
    };
  } catch (error) {
    console.error('Error sending bulk cancellation emails:', error);
    return { success: false, error: error.message };
  }
});
