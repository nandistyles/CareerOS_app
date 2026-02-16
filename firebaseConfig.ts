
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// CareerOS Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBbIu_r0tmM6-Eh53OdZEHz7uAudFvj2KU",
  authDomain: "careeros-8c95e.firebaseapp.com",
  projectId: "careeros-8c95e",
  storageBucket: "careeros-8c95e.firebasestorage.app",
  messagingSenderId: "56535456526",
  appId: "1:56535456526:web:b02a98c38e91221743d55f",
  measurementId: "G-GNYR6CELLT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services for use in the app
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
