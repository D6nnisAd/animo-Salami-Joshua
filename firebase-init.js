// IMPORTANT:
// 1. Go to your Firebase project console.
// 2. In the project settings, find your Web App's configuration object.
// 3. Replace the placeholder values below with your actual Firebase config.

  const firebaseConfig = {
    apiKey: "AIzaSyBjTpYLfPXmwEX3gc-73E2n6Mi7UbXX0E0",
    authDomain: "animo-salami.firebaseapp.com",
    projectId: "animo-salami",
    storageBucket: "animo-salami.firebasestorage.app",
    messagingSenderId: "783150446727",
    appId: "1:783150446727:web:c1caa9d7fb6db56eb12022"
  };


// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
// These will be used by other scripts (auth.js, admin.js, app.js)
const auth = firebase.auth();
const db = firebase.firestore();
