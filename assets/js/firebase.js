// Auth-only bridge for the existing KHALIYA AI Worker.
// Demo workspace data stays in the browser; this file intentionally does not
// initialize or export Firestore.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: 'AIzaSyC8CPdM1QfZTSSNPhsGL1wS1dwlslJEaNE',
  authDomain: 'khaliya-committee-demo-auth.firebaseapp.com',
  projectId: 'khaliya-committee-demo-auth',
  storageBucket: 'khaliya-committee-demo-auth.firebasestorage.app',
  messagingSenderId: '848815064249',
  appId: '1:848815064249:web:8ca9c290aeeb3b07da8768',
  measurementId: 'G-LQM9HFE38J'
};

const app = initializeApp(firebaseConfig, 'KHALIYA-AI-demo');
const auth = getAuth(app);
export { app, auth };
