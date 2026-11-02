import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { doc, getDoc } from 'firebase/firestore';
const firebaseConfig = {
  apiKey: "AIzaSyAKvWp2fvwRgoSoLKPHXlS0zpL9z0wjZHE",
  authDomain: "rentals-5085c.firebaseapp.com",
  projectId: "rentals-5085c",
  storageBucket: "rentals-5085c.appspot.com",
  messagingSenderId: "649476082243",
  appId: "1:649476082243:web:6c47a0fb65d72e5ac5a2f6"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);
const analytics = getAnalytics(app);

export const getCurrentUser = async () => {
  const user = auth.currentUser;

  if (user) {
    const userDocRef = doc(firestore, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.data();

    return {
      uid: user.uid,
      email: user.email,
      role: userData?.role || 'customer',
      shopId: userData?.shopId || null
    };
  }

  return null;
};