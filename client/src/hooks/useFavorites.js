import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getFavorites, addFavorite, removeFavorite } from '../firebase'

export function useFavorites() {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState([])

  useEffect(() => {
    if (!user) { setFavorites([]); return }
    getFavorites(user.uid).then(setFavorites).catch(() => setFavorites([]))
  }, [user])

  const toggle = useCallback(async (teamId) => {
    if (!user) return
    if (favorites.includes(teamId)) {
      setFavorites((f) => f.filter((id) => id !== teamId))
      await removeFavorite(user.uid, teamId).catch(() => {})
    } else {
      setFavorites((f) => [...f, teamId])
      await addFavorite(user.uid, teamId).catch(() => {})
    }
  }, [user, favorites])

  return { favorites, toggle, isFavorite: (id) => favorites.includes(id) }
}
