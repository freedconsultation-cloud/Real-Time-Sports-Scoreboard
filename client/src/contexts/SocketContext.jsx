import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

const SocketContext = createContext(null)

import { SERVER_URL } from '../config.js'

const ALL_LEAGUES = ['nfl', 'nba', 'mlb', 'nhl', 'soccer', 'worldcup', 'ncaaf', 'ncaab', 'ncaaw']

export function SocketProvider({ children, onKeyEvent }) {
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [gamesByLeague, setGamesByLeague] = useState({})
  const seededRef = useRef(false)

  useEffect(() => {
    const socket = io(SERVER_URL, { transports: ['websocket', 'polling'] })
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      if (!seededRef.current) {
        seededRef.current = true
        ALL_LEAGUES.forEach(async (l) => {
          try {
            const res = await fetch(`${SERVER_URL}/api/games/${l}`)
            if (res.ok) {
              const games = await res.json()
              setGamesByLeague((prev) => ({ ...prev, [l]: games }))
            }
          } catch {}
        })
      }
    })
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
