import { useState, useCallback, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useProspects } from '../hooks/useProspects'

const BASE = 'https://statsapi.mlb.com/api/v1'

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

async function searchPlayers(names) {
  const res = await fetch(`${BASE}/people/search?names=${encodeURIComponent(names)}&sportIds=11,12,13,14,15,16`)
  if (!res.ok) throw new Error('Search failed')
  const data = await res.json()
  return data?.people ?? []
}

export default function PlayerSearch({ type, onClose }) {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)
  const addProspect = useProspects((s) => s.addProspect)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchPlayers(debouncedQuery),
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 1000 * 30,
  })

  function handleSelect(player) {
    addProspect(player.id, type)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div
        className="rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        style={{ background: 'var(--color-card-bg)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2
            className="text-lg font-semibold text-gray-900"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Add a {type === 'pitcher' ? 'Pitcher' : 'Hitter'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Search input */}
        <div className="px-5 pb-3">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search player name…"
            className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-opacity-30"
            style={{
              borderColor: 'var(--color-border)',
              fontFamily: 'Inter, sans-serif',
              background: 'var(--color-stat-box)',
              '--tw-ring-color': 'var(--color-cardinals-red)',
            }}
          />
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto px-5 pb-5">
          {isFetching && (
            <p className="text-xs text-gray-400 py-3" style={{ fontFamily: 'Inter, sans-serif' }}>
              Searching…
            </p>
          )}
          {!isFetching && debouncedQuery.length >= 2 && results.length === 0 && (
            <p className="text-xs text-gray-400 py-3" style={{ fontFamily: 'Inter, sans-serif' }}>
              No players found.
            </p>
          )}
          {results.map((player) => (
            <button
              key={player.id}
              onClick={() => handleSelect(player)}
              className="w-full text-left flex items-center gap-3 py-2.5 border-b hover:bg-gray-50 transition-colors"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div>
                <p
                  className="text-sm font-medium text-gray-800"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {player.fullName}
                </p>
                <p
                  className="text-[11px] text-gray-400"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {player.primaryPosition?.abbreviation ?? '?'} · {player.currentTeam?.name ?? 'Unknown'}{' '}
                  {player.sport?.abbreviation ? `· ${player.sport.abbreviation}` : ''}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
