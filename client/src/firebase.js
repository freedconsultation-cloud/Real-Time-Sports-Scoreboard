import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'

// Firebase API keys are public by design — security is enforced by Firebase Security Rules.
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || 'AIzaSyAWqHBF3YGmu5VgX13bpaHSOc9NHdhNjoE',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || 'sports-scoreboard-710f1.firebaseapp.com',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || 'sports-scoreboard-710f1',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || 'sports-scoreboard-710f1.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '816723127463',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || '1:816723127463:web:9f9f89435f06b965503f82',
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

export { auth, db }

export async function signInWithGoogle() {
  return signInWithPopup(auth, new GoogleAuthProvider())
}

export async function signInWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
}

export async function registerWithEmail(email, password) {
  return createUserWithEmailAndPassword(auth, email, password)
}

export async function logout() {
  return signOut(auth)
}

export async function getFavorites(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? (snap.data().favorites || []) : []
}

export async function addFavorite(uid, teamId) {
  await setDoc(doc(db, 'users', uid), { favorites: arrayUnion(teamId) }, { merge: true })
}

export async function removeFavorite(uid, teamId) {
  await updateDoc(doc(db, 'users', uid), { favorites: arrayRemove(teamId) })
}
