import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyAlWzv-d9MTTKFEzD0sKa67B9-EPUSkIag",
  authDomain: "sukoon-diabetic-centre.firebaseapp.com",
  projectId: "sukoon-diabetic-centre",
  storageBucket: "sukoon-diabetic-centre.appspot.com",
  messagingSenderId: "1001096130904",
  appId: "1:1001096130904:web:816a4700ce5b731be4752d",
  measurementId: "G-EHVZ43WNXG"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app)
