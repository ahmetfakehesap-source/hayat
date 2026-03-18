import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBncV0Dff3V5jqNeRNk0RvKfWWrVH2gmB8",
    authDomain: "lery-265b8.firebaseapp.com",
    projectId: "lery-265b8",
    storageBucket: "lery-265b8.firebasestorage.app",
    messagingSenderId: "274544842185",
    appId: "1:274544842185:web:ad288150b8ee4ad4530418",
    measurementId: "G-24GSGNLD0L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
