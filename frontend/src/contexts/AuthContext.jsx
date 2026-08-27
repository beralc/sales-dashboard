import { createContext, useContext, useState, useEffect } from 'react'
import { auth, googleProvider } from '../firebase'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'

const AuthContext = createContext()

const ALLOWED_DOMAINS = ['edelvives.es', 'fundacionedelvives.org']

function isAllowedEmail(email) {
  const normalizedEmail = (email || '').toLowerCase()
  return ALLOWED_DOMAINS.some(domain => normalizedEmail.endsWith(`@${domain}`))
}

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Verify domain
        const email = user.email || ''
        if (isAllowedEmail(email)) {
          setUser(user)
          setError(null)
        } else {
          // Sign out users from other domains
          signOut(auth)
          setUser(null)
          setError('Solo usuarios de @edelvives.es o @fundacionedelvives.org pueden acceder')
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const login = async () => {
    try {
      setError(null)
      const result = await signInWithPopup(auth, googleProvider)
      const email = result.user.email || ''

      if (!isAllowedEmail(email)) {
        await signOut(auth)
        setError('Solo usuarios de @edelvives.es o @fundacionedelvives.org pueden acceder')
        return false
      }

      return true
    } catch (err) {
      console.error('Login error:', err)
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Inicio de sesión cancelado')
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('Dominio no autorizado. Contacta al administrador.')
      } else {
        setError('Error al iniciar sesión. Inténtalo de nuevo.')
      }
      return false
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      setUser(null)
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
