import { useState } from 'react'
import { useProspects } from '../hooks/useProspects'
import PlayerCard from '../components/PlayerCard'
import PlayerSearch from '../components/PlayerSearch'

function Navbar() {
  return (
    <header className="px-6 py-4 border-b" style={{ borderColor: 'var(--color-border)', background: 'var(--color-page-bg)' }}>
      <h1
        className="text-lg font-semibold tracking-tight"
        style={{ fontFamily: 'Playfair Display, serif', color: '#1a1a1a' }}
      >
        YourFavoriteProspect
        <span style={{ color: 'var(--color-cardinals-red)' }}>.com</span>
      </h1>
    </header>
  )
}

function SectionHeader({ label, count, onAdd, addLabel }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2
        className="text-2xl font-semibold italic"
        style={{ fontFamily: 'Playfair Display, serif', color: '#1a1a1a' }}
      >
        {label}
      </h2>
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-400 uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>
          {count} Tracked
        </span>
        <button
          onClick={onAdd}
          className="text-xs font-medium px-3 py-1.5 rounded-full border transition-colors hover:opacity-80"
          style={{
            borderColor: 'var(--color-cardinals-red)',
            color: 'var(--color-cardinals-red)',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          + {addLabel}
        </button>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [searchModal, setSearchModal] = useState(null) // 'hitter' | 'pitcher' | null
  const prospects = useProspects((s) => s.prospects)
  const removeProspect = useProspects((s) => s.removeProspect)

  const hitters = prospects.filter((p) => p.type === 'hitter')
  const pitchers = prospects.filter((p) => p.type === 'pitcher')

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-page-bg)' }}>
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Hero */}
        <div className="mb-12">
          <h2
            className="text-3xl font-semibold text-gray-900 mb-1"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Your favorite prospects, all in one place.
          </h2>
          <p className="text-sm text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
            Every farm system, every level — refreshed every morning.
          </p>
        </div>

        {/* Hitters section */}
        <section className="mb-14">
          <SectionHeader
            label="Hitters"
            count={hitters.length}
            onAdd={() => setSearchModal('hitter')}
            addLabel="Add hitter"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {hitters.map(({ personId }) => (
              <PlayerCard
                key={personId}
                personId={personId}
                type="hitter"
                onRemove={removeProspect}
              />
            ))}
          </div>
        </section>

        {/* Pitchers section */}
        <section>
          <SectionHeader
            label="Pitchers"
            count={pitchers.length}
            onAdd={() => setSearchModal('pitcher')}
            addLabel="Add pitcher"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pitchers.map(({ personId }) => (
              <PlayerCard
                key={personId}
                personId={personId}
                type="pitcher"
                onRemove={removeProspect}
              />
            ))}
          </div>
        </section>
      </main>

      {/* Search modal */}
      {searchModal && (
        <PlayerSearch
          type={searchModal}
          onClose={() => setSearchModal(null)}
        />
      )}
    </div>
  )
}
