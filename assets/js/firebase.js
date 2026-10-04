// Auth-only bridge for the existing KHALIYA AI Worker.
// Demo workspace data stays in the browser; this file intentionally does not
// initialize or export Firestore.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: 'AIzaSyAR91u_YiTtphKfzr6gLstr-1msZkZvL9U',
  authDomain: 'khaliyah-engineer-office.firebaseapp.com',
  projectId: 'khaliyah-engineer-office',
  appId: '1:292505250732:web:c22dc8142b3eb668d26809'
};

const app = initializeApp(firebaseConfig, 'KHALIYA-AI-demo');
const auth = getAuth(app);
export { app, auth };
