import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

const SocketContext = createContext(null)

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'

export function SocketProvider({ children, onKeyEvent }) {
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [gamesByLeague, setGamesByLeague] = useState({})

  useEffect(() => {
    const socket = io(SERVER_URL, { transports: ['websocket', 'polling'] })
    socketRef.current = socket

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    socket.on('games:update', ({ league, games }) => {
      setGamesByLeague((prev) => ({ ...prev, [league]: games }))
    })

    socket.on('key:event', (event) => {
      onKeyEvent?.(event)
    })

    return () => socket.disconnect()
  }, [])

  async function subscribe(league) {
    // Fetch immediately from REST so data shows before the first socket push
    if (!gamesByLeague[league]) {
      try {
        const res = await fetch(`${SERVER_URL}/api/games/${league}`)
        if (res.ok) {
          const games = await res.json()
          setGamesByLeague((prev) => ({ ...prev, [league]: games }))
        }
      } catch {}
    }
    socketRef.current?.emit('subscribe', league)
  }

  function unsubscribe(league) {
    socketRef.current?.emit('unsubscribe', league)
  }

  return (
    <SocketContext.Provider value={{ connected, gamesByLeague, subscribe, unsubscribe }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  return useContext(SocketContext)
}
