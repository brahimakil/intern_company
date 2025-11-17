// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCN7ySeUsVXChjGwL8uteMqSTe3ai395sI",
  authDomain: "internshipsystem-43e2c.firebaseapp.com",
  projectId: "internshipsystem-43e2c",
  storageBucket: "internshipsystem-43e2c.firebasestorage.app",
  messagingSenderId: "33734669598",
  appId: "1:33734669598:web:334184b82ceab5eba1850f",
  measurementId: "G-XZN75N2SZZ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
