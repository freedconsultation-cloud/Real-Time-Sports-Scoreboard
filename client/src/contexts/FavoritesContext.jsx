import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { getFavorites, addFavorite, removeFavorite } from '../firebase'

const FavoritesContext = createContext({ favorites: [], toggle: () => {}, isFavorite: () => false })

export function FavoritesProvider({ children }) {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState([])
  const [error, setError] = useState(null)

  // Track latest favorites synchronously so toggle never reads stale state
  const favRef = useRef([])
  const setFavs = (next) => {
    const value = typeof next === 'function' ? next(favRef.current) : next
    favRef.current = value
    setFavorites(value)
  }

  // Only reload from Firestore when the user UID actually changes
  const loadedUidRef = useRef(null)
  useEffect(() => {
    const uid = user?.uid ?? null
    if (uid === loadedUidRef.current) return
    loadedUidRef.current = uid
    if (!uid) { setFavs([]); return }
    getFavorites(uid)
      .then(setFavs)
      .catch((err) => setError(err.message))
  }, [user])

  const toggle = useCallback(async (teamId) => {
    if (!user) return
    const before = favRef.current
    const removing = before.includes(teamId)
    const after = removing ? before.filter((id) => id !== teamId) : [...before, teamId]

    setFavs(after) // optimistic — update ref + state together

    try {
      if (removing) await removeFavorite(user.uid, teamId)
      else await addFavorite(user.uid, teamId)
      setError(null)
    } catch (err) {
      setFavs(before) // roll back to exact pre-toggle state
      setError(err.message)
    }
  }, [user])

  return (
    <FavoritesContext.Provider value={{ favorites, toggle, isFavorite: (id) => favorites.includes(id), error }}>
      {children}
      {error && (
        <div
          className="fixed bottom-4 left-4 z-50 text-xs px-4 py-2 rounded-xl max-w-xs"
          style={{ background: '#7f1d1d', color: '#fca5a5', border: '1px solid #ef4444' }}
        >
          Firestore error: {error}
        </div>
      )}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  return useContext(FavoritesContext)
}
