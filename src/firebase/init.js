// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDHliSu8Wed4qshBmKnNlibAIwk_YhSZNA",
  authDomain: "fit5032-f8fd0.firebaseapp.com",
  projectId: "fit5032-f8fd0",
  storageBucket: "fit5032-f8fd0.firebasestorage.app",
  messagingSenderId: "294294097041",
  appId: "1:294294097041:web:c7abcc34d181a7f569c330"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
export { db, auth };
