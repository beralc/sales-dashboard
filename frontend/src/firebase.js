import axios from 'axios'
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

// Firebase configuration - Replace with your own config from Firebase Console
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

// The API verifies this token on every request, so attach it to all calls
// rather than to each component's fetch. getIdToken() refreshes it when it has
// expired, so a long-lived tab keeps working.
axios.interceptors.request.use(async (config) => {
  const user = auth.currentUser
  if (user) {
    try {
      config.headers.Authorization = `Bearer ${await user.getIdToken()}`
    } catch (err) {
      console.error('Could not attach auth token:', err)
    }
  }
  return config
})

// An ID token lasts an hour. getIdToken() normally refreshes it, but a tab left
// open through a clock change or a suspended laptop can still present a stale
// one; retry such a request once with a forced refresh before giving up.
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const user = auth.currentUser

    if (error.response?.status === 401 && user && original && !original._retried) {
      original._retried = true
      try {
        original.headers.Authorization = `Bearer ${await user.getIdToken(true)}`
        return axios(original)
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError)
      }
    }

    return Promise.reject(error)
  }
)
