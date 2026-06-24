import { useState, useCallback } from 'react'
import { usePlayer } from '../hooks/usePlayer'
import { useDraftInfo } from '../hooks/useDraftInfo'

function getOrgLogo(parentOrgId) {
  if (!parentOrgId) return null
  return `https://www.mlbstatic.com/team-logos/${parentOrgId}.svg`
}

function getInitials(name) {
  if (!name) return '??'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const LEVEL_COLORS = {
  AAA: 'bg-gray-800 text-white',
  AA: 'bg-gray-800 text-white',
  'A+': 'bg-gray-800 text-white',
  A: 'bg-gray-800 text-white',
  ROK: 'bg-gray-800 text-white',
}

function LevelBadge({ level }) {
  const cls = LEVEL_COLORS[level] ?? 'bg-gray-600 text-white'
  return (
    <span className={`absolute bottom-0 left-0 text-[9px] font-semibold px-1 py-0.5 rounded ${cls}`} style={{ fontFamily: 'Inter, sans-serif' }}>
      {level || '?'}
    </span>
  )
}

function Avatar({ personId, name, level }) {
  const [imgFailed, setImgFailed] = useState(false)
  const initials = getInitials(name)
  const headshotUrl = `https://img.mlbstatic.com/mlb-photos/image/upload/w_213,q_auto:best/v1/people/${personId}/headshot/67/current`

  return (
    <div className="relative w-12 h-12 shrink-0">
      {!imgFailed ? (
        <img
          src={headshotUrl}
          alt={name}
          className="w-12 h-12 rounded-full object-cover object-top bg-gray-100"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold text-white"
          style={{ background: '#6B7280', fontFamily: 'Inter, sans-serif' }}
        >
          {initials}
        </div>
      )}
      <LevelBadge level={level} />
    </div>
  )
}

function StatBox({ label, value, trend }) {
  let bg = 'var(--color-stat-box)'
  let textColor = '#374151'

  if (trend === 'up') {
    bg = 'var(--color-trend-up-bg)'
    textColor = 'var(--color-trend-up-text)'
  } else if (trend === 'down') {
    bg = 'var(--color-trend-down-bg)'
    textColor = 'var(--color-trend-down-text)'
  }

  return (
    <div
      className="flex flex-col items-center justify-center rounded px-1 py-1.5 flex-1 min-w-0"
      style={{ background: bg }}
    >
      <span className="text-[13px] font-semibold leading-tight" style={{ color: textColor, fontFamily: 'Inter, sans-serif' }}>
        {value ?? '—'}
      </span>
      <span className="text-[9px] uppercase tracking-wide mt-0.5" style={{ color: '#9CA3AF', fontFamily: 'Inter, sans-serif' }}>
        {label}
      </span>
    </div>
  )
}

function CountStat({ label, value }) {
  return (
    <div className="flex flex-col items-center flex-1 min-w-0">
      <span className="text-[12px] font-medium text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>
        {value ?? '—'}
      </span>
      <span className="text-[9px] uppercase text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>
        {label}
      </span>
    </div>
  )
}

function LevelPills({ splits, activeSportId, onChange }) {
  if (!splits || splits.length < 2) return null
  const pills = [{ sportId: null, abbreviation: 'All' }, ...splits]
  return (
    <div className="flex gap-1">
      {pills.map((p) => {
        const active = p.sportId === activeSportId
        return (
          <button
            key={p.sportId ?? 'all'}
            onClick={() => onChange(p.sportId)}
            className="text-[9px] px-1.5 py-0.5 rounded font-semibold transition-colors"
            style={{
              fontFamily: 'Inter, sans-serif',
              background: active ? '#1F2937' : 'transparent',
              color: active ? '#fff' : '#9CA3AF',
            }}
          >
            {p.abbreviation}
          </button>
        )
      })}
    </div>
  )
}

function trendFor(recentVal, seasonVal) {
  const r = parseFloat(recentVal)
  const s = parseFloat(seasonVal)
  if (isNaN(r) || isNaN(s)) return 'neutral'
  if (r > s) return 'up'
  if (r < s) return 'down'
  return 'neutral'
}

function HitterStats({ season, recent, label, splits, activeSportId, onLevelChange }) {
  const isRecent = !!recent

  const stats = recent ?? season
  if (!stats) return <p className="text-xs text-gray-400 py-2">No stats available</p>

  const avgTrend = isRecent ? trendFor(recent.avg, season?.avg) : 'neutral'
  const obpTrend = isRecent ? trendFor(recent.obp, season?.obp) : 'neutral'
  const slgTrend = isRecent ? trendFor(recent.slg, season?.slg) : 'neutral'
  const opsTrend = isRecent ? trendFor(recent.ops, season?.ops) : 'neutral'
  const bbTrend = isRecent ? trendFor(recent.bbPct, season?.bbPct) : 'neutral'
  const kTrendActual = isRecent
    ? parseFloat(recent.kPct) < parseFloat(season?.kPct) ? 'up' : parseFloat(recent.kPct) > parseFloat(season?.kPct) ? 'down' : 'neutral'
    : 'neutral'

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[9px] uppercase tracking-widest text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>
          {label}
          {isRecent && <span className="ml-1 text-gray-300">· vs season</span>}
        </p>
        {!isRecent && <LevelPills splits={splits} activeSportId={activeSportId} onChange={onLevelChange} />}
      </div>
      <div className="flex mb-2">
        <CountStat label="G" value={stats.g} />
        <CountStat label="PA" value={stats.pa} />
        <CountStat label="H" value={stats.h} />
        <CountStat label="2B" value={stats.doubles} />
        <CountStat label="HR" value={stats.hr} />
        <CountStat label="RBI" value={stats.rbi} />
        <CountStat label="SB" value={stats.sb} />
        <CountStat label="SO" value={stats.so} />
      </div>
      <div className="flex gap-1">
        <StatBox label="AVG" value={stats.avg} trend={avgTrend} />
        <StatBox label="OBP" value={stats.obp} trend={obpTrend} />
        <StatBox label="SLG" value={stats.slg} trend={slgTrend} />
        <StatBox label="OPS" value={stats.ops} trend={opsTrend} />
        <StatBox label="BB%" value={stats.bbPct ? `${stats.bbPct}%` : null} trend={bbTrend} />
        <StatBox label="K%" value={stats.kPct ? `${stats.kPct}%` : null} trend={kTrendActual} />
      </div>
    </div>
  )
}

function PitcherStats({ season, recent, label, splits, activeSportId, onLevelChange }) {
  const isRecent = !!recent
  const stats = recent ?? season
  if (!stats) return <p className="text-xs text-gray-400 py-2">No stats available</p>

  const eraTrend = isRecent ? trendFor(season?.era, recent.era) : 'neutral'
  const whipTrend = isRecent ? trendFor(season?.whip, recent.whip) : 'neutral'
  const baaTrend = isRecent ? trendFor(season?.baa, recent.baa) : 'neutral'
  const k9Trend = isRecent ? trendFor(recent.k9, season?.k9) : 'neutral'
  const bb9Trend = isRecent ? trendFor(season?.bb9, recent.bb9) : 'neutral'
  const hr9Trend = isRecent ? trendFor(season?.hr9, recent.hr9) : 'neutral'

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[9px] uppercase tracking-widest text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>
          {label}
          {isRecent && <span className="ml-1 text-gray-300">· vs season</span>}
        </p>
        {!isRecent && <LevelPills splits={splits} activeSportId={activeSportId} onChange={onLevelChange} />}
      </div>
      <div className="flex mb-2">
        <CountStat label="G" value={stats.g} />
        <CountStat label="GS" value={stats.gs} />
        <CountStat label="W" value={stats.w} />
        <CountStat label="L" value={stats.l} />
        <CountStat label="IP" value={stats.ip} />
        <CountStat label="H" value={stats.h} />
        <CountStat label="BB" value={stats.bb} />
        <CountStat label="SO" value={stats.so} />
      </div>
      <div className="flex gap-1">
        <StatBox label="ERA" value={stats.era} trend={eraTrend} />
        <StatBox label="WHIP" value={stats.whip} trend={whipTrend} />
        <StatBox label="BAA" value={stats.baa} trend={baaTrend} />
        <StatBox label="K/9" value={stats.k9} trend={k9Trend} />
        <StatBox label="BB/9" value={stats.bb9} trend={bb9Trend} />
        <StatBox label="HR/9" value={stats.hr9} trend={hr9Trend} />
      </div>
    </div>
  )
}

function CardSkeleton() {
  return (
    <div
      className="rounded-xl p-4 border animate-pulse"
      style={{ background: 'var(--color-card-bg)', borderColor: 'var(--color-border)' }}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-gray-200" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-36 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-24 mb-1" />
          <div className="h-3 bg-gray-200 rounded w-20" />
        </div>
      </div>
      <div className="h-3 bg-gray-200 rounded w-full mb-2" />
      <div className="h-8 bg-gray-200 rounded w-full" />
    </div>
  )
}

export default function PlayerCard({ personId, type, onRemove }) {
  const { data, isLoading, isError } = usePlayer(personId, type)
  const { data: draftInfo } = useDraftInfo(personId, data?.bio?.draftYear)
  const [activeSportId, setActiveSportId] = useState(null)
  const handleLevelChange = useCallback((sportId) => setActiveSportId(sportId), [])

  if (isLoading) return <CardSkeleton />

  if (isError || !data?.bio) {
    return (
      <div
        className="rounded-xl p-4 border"
        style={{ background: 'var(--color-card-bg)', borderColor: 'var(--color-border)' }}
      >
        <p className="text-xs text-gray-400">Failed to load player {personId}</p>
        {onRemove && (
          <button onClick={() => onRemove(personId)} className="text-xs text-red-400 mt-1 hover:underline">
            Remove
          </button>
        )}
      </div>
    )
  }

  const { bio, seasonStats, seasonSplits, recentStats } = data
  const StatsComponent = type === 'pitcher' ? PitcherStats : HitterStats
  const recentLabel = type === 'pitcher' ? 'Last 14 Days' : 'Last 7 Days'
  const orgLogo = getOrgLogo(bio.parentOrgId)

  const displaySeasonStats = activeSportId
    ? (seasonSplits?.find((s) => s.sportId === activeSportId)?.stats ?? seasonStats)
    : seasonStats

  const location = [bio.birthCity, bio.birthStateProvince || bio.birthCountry].filter(Boolean).join(', ')

  return (
    <div
      className="rounded-xl p-4 border relative"
      style={{ background: 'var(--color-card-bg)', borderColor: 'var(--color-border)' }}
    >
      {/* Header row */}
      <div className="flex items-start gap-3 mb-3">
        <Avatar personId={personId} name={bio.fullName} level={bio.level} />

        <div className="flex-1 min-w-0">
          <h3
            className="text-base font-semibold leading-tight text-gray-900 truncate"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            {bio.fullName}
          </h3>
          <p className="text-[11px] text-gray-500 mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>
            {bio.primaryPosition} · {bio.age} · {bio.batSide}/{bio.pitchHand || bio.batSide}
            {location ? ` · ${location}` : ''}
          </p>
          <div className="flex gap-1.5 flex-wrap mt-1.5">
            {bio.currentTeam && (
              <span
                className="text-[10px] px-2 py-0.5 rounded-full border"
                style={{ borderColor: 'var(--color-border)', color: '#4B5563', fontFamily: 'Inter, sans-serif' }}
              >
                {bio.currentTeam}
              </span>
            )}
            {draftInfo ? (
              <span
                className="text-[10px] px-2 py-0.5 rounded-full border"
                style={{ borderColor: 'var(--color-border)', color: '#4B5563', fontFamily: 'Inter, sans-serif' }}
              >
                {draftInfo.label}
              </span>
            ) : !bio.draftYear && bio.birthCountry && bio.birthCountry !== 'USA' ? (
              <span
                className="text-[10px] px-2 py-0.5 rounded-full border"
                style={{ borderColor: 'var(--color-border)', color: '#4B5563', fontFamily: 'Inter, sans-serif' }}
              >
                Int&apos;l FA
              </span>
            ) : null}
          </div>
        </div>

        {/* Org logo top-right */}
        <div className="shrink-0">
          <img
            src={orgLogo}
            alt="org logo"
            className="w-8 h-8 object-contain"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        </div>
      </div>

      {/* Divider */}
      <div className="border-t my-3" style={{ borderColor: 'var(--color-border)' }} />

      {/* Full season stats */}
      <StatsComponent
        season={displaySeasonStats}
        recent={null}
        label="Full Season"
        splits={seasonSplits}
        activeSportId={activeSportId}
        onLevelChange={handleLevelChange}
      />

      {recentStats && (
        <>
          <div className="border-t my-3" style={{ borderColor: 'var(--color-border)' }} />
          <StatsComponent season={seasonStats} recent={recentStats} label={recentLabel} />
        </>
      )}

      {/* Remove button */}
      {onRemove && (
        <button
          onClick={() => onRemove(personId)}
          className="absolute top-2 right-10 text-[10px] text-gray-300 hover:text-red-400 transition-colors"
          title="Remove prospect"
        >
          ✕
        </button>
      )}
    </div>
  )
}
