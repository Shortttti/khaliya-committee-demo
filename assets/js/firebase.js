import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyAR91u_YiTtphKfzr6gLstr-1msZkZvL9U',
  authDomain: 'khaliyah-engineer-office.firebaseapp.com',
  projectId: 'khaliyah-engineer-office',
  storageBucket: 'khaliyah-engineer-office.firebasestorage.app',
  messagingSenderId: '292505250732',
  appId: '1:292505250732:web:c22dc8142b3eb668d26809',
  measurementId: 'G-ST10L0Y6X9'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
