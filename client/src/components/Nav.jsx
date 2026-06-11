import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'
import { logout } from '../firebase'
import AuthModal from './AuthModal'

export default function Nav({ showFavOnly, onToggleFavOnly }) {
  const { user } = useAuth()
  const { connected } = useSocket()
  const [showAuth, setShowAuth] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  return (
    <>
      <nav
        className="sticky top-0 z-40 flex items-center justify-between px-4 py-3"
        style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <h1 className="text-base font-black tracking-tight" style={{ color: 'var(--fg)' }}>
            ScoreStream
          </h1>
          <span
            className="flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full"
            style={{
              background: connected ? 'rgba(52,211,153,0.12)' : 'rgba(239,68,68,0.12)',
              color: connected ? 'var(--green)' : 'var(--red)',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: connected ? 'var(--green)' : 'var(--red)' }}
            />
            {connected ? 'Live' : 'Offline'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <button
              onClick={onToggleFavOnly}
              className="text-sm px-3 py-1.5 rounded-lg font-medium transition-colors"
              style={{
                background: showFavOnly ? 'var(--accent)' : 'var(--surface)',
                color: showFavOnly ? '#000' : 'var(--muted)',
                border: '1px solid var(--border)',
              }}
            >
              ★ Favourites
            </button>
          )}

          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowMenu((v) => !v)}
                className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg)' }}
              >
                {user.photoURL
                  ? <img src={user.photoURL} className="w-5 h-5 rounded-full" alt="" />
                  : <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: 'var(--accent)', color: '#000' }}>{user.email?.[0]?.toUpperCase()}</span>
                }
                <span className="max-w-[100px] truncate hidden sm:block">{user.displayName || user.email}</span>
              </button>
              {showMenu && (
                <div
                  className="absolute right-0 mt-1 w-40 rounded-xl overflow-hidden shadow-xl"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <button
                    onClick={() => { logout(); setShowMenu(false) }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:opacity-80"
                    style={{ color: 'var(--red)' }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className="text-sm px-3 py-1.5 rounded-lg font-semibold"
              style={{ background: 'var(--accent)', color: '#000' }}
            >
              Sign in
            </button>
          )}
        </div>
      </nav>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  )
}
