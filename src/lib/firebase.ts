import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyAfqvmcg2Y6GOAQOVjFvXi46hp3NTCT6ZE",
  authDomain: "abby-cdb30.firebaseapp.com",
  projectId: "abby-cdb30",
  databaseURL: "https://abby-cdb30-default-rtdb.firebaseio.com",
  storageBucket: "abby-cdb30.appspot.com",
  messagingSenderId: "738241914654",
  appId: "1:738241914654:android:80351b3fed2f4dc3688b0f",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const functions = getFunctions(app);

export { app, auth, db, functions };
