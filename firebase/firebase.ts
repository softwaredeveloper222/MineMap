// firebase.js
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getReactNativePersistence,
  initializeAuth,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { getDatabase } from "firebase/database";
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// 🚫 Do NOT import from 'firebase/messaging' in React Native
// import { getMessaging } from "firebase/messaging";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDyxxcinR4Lq67sgUCBvT2Mar6OMor-C7U",
  authDomain: "minemap-63380.firebaseapp.com",
  projectId: "minemap-63380",
  storageBucket: "minemap-63380.firebasestorage.app",
  messagingSenderId: "938108351671",
  appId: "1:938108351671:web:45ce70ac2f694fb4a60932",
  measurementId: "G-YVVRTSNKCW"
};

// ✅ Initialize Firebase only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// ✅ Initialize auth with persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

const firestore = getFirestore(app);
const storage = getStorage(app);
const db = getDatabase(app);
export {
  app,
  auth, createUserWithEmailAndPassword, db, firestore, signInWithEmailAndPassword,
  signOut, storage
};

