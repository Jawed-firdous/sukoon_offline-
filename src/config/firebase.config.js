import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyBjwl-4yLN-sa7txboIDo6kp-c5j_oSmqU",
  authDomain: "sukoon-diabetic.firebaseapp.com",
  projectId: "sukoon-diabetic",
  storageBucket: "sukoon-diabetic.appspot.com",
  messagingSenderId: "901596808539",
  appId: "1:901596808539:web:148ddca315d02e2afcc67e",
  measurementId: "G-7BQCH611K4"
};
// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app)