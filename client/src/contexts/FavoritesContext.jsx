import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { getFavorites, addFavorite, removeFavorite } from '../firebase'

const FavoritesContext = createContext({ favorites: [], toggle: () => {}, isFavorite: () => false })

export function FavoritesProvider({ children }) {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState([])
  const [error, setError] = useState(null)
  // Ref always holds latest favorites so toggle never has a stale closure
  const favRef = useRef(favorites)
  useEffect(() => { favRef.current = favorites }, [favorites])

  useEffect(() => {
    if (!user) { setFavorites([]); return }
    getFavorites(user.uid)
      .then(setFavorites)
      .catch((err) => setError(err.message))
  }, [user])

  const toggle = useCallback(async (teamId) => {
    if (!user) return
    const removing = favRef.current.includes(teamId)
    setFavorites((f) => removing ? f.filter((id) => id !== teamId) : [...f, teamId])
    try {
      if (removing) await removeFavorite(user.uid, teamId)
      else await addFavorite(user.uid, teamId)
      setError(null)
    } catch (err) {
      // Roll back
      setFavorites((f) => removing ? [...f, teamId] : f.filter((id) => id !== teamId))
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
