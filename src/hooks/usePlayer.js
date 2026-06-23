import { useQuery } from '@tanstack/react-query'

const BASE = 'https://statsapi.mlb.com/api/v1'
const SEASON = 2026

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`)
  return res.json()
}

function parseBio(data) {
  const p = data?.people?.[0]
  if (!p) return null
  const team = p.currentTeam
  const sport = p.sport?.abbreviation ?? ''
  return {
    fullName: p.fullName,
    firstName: p.firstName,
    lastName: p.lastName,
    primaryPosition: p.primaryPosition?.abbreviation ?? '',
    age: p.currentAge,
    batSide: p.batSide?.code ?? '',
    pitchHand: p.pitchHand?.code ?? '',
    birthCity: p.birthCity ?? '',
    birthStateProvince: p.birthStateProvince ?? '',
    birthCountry: p.birthCountry ?? '',
    currentTeam: team?.name ?? '',
    currentTeamId: team?.id ?? null,
    parentOrgId: team?.parentOrgId ?? null,
    level: null, // populated after stats fetch
    draftYear: p.draftYear ?? null,
    draftRound: null, // not available from this endpoint; enrich separately if needed
    mlbDebutDate: p.mlbDebutDate ?? null,
  }
}

function parseSeasonStats(data, group) {
  const splits = data?.stats?.[0]?.splits
  if (!splits?.length) return null
  const s = splits[0].stat
  if (group === 'hitting') {
    return {
      g: s.gamesPlayed ?? 0,
      pa: s.plateAppearances ?? 0,
      h: s.hits ?? 0,
      doubles: s.doubles ?? 0,
      hr: s.homeRuns ?? 0,
      rbi: s.rbi ?? 0,
      sb: s.stolenBases ?? 0,
      so: s.strikeOuts ?? 0,
      bb: s.baseOnBalls ?? 0,
      avg: s.avg ?? '.---',
      obp: s.obp ?? '.---',
      slg: s.slg ?? '.---',
      ops: s.ops ?? '.---',
      bbPct: s.plateAppearances > 0 ? ((s.baseOnBalls / s.plateAppearances) * 100).toFixed(1) : '0.0',
      kPct: s.plateAppearances > 0 ? ((s.strikeOuts / s.plateAppearances) * 100).toFixed(1) : '0.0',
    }
  }
  // pitching
  return {
    gs: s.gamesStarted ?? 0,
    g: s.gamesPlayed ?? 0,
    ip: s.inningsPitched ?? '0.0',
    h: s.hits ?? 0,
    bb: s.baseOnBalls ?? 0,
    so: s.strikeOuts ?? 0,
    er: s.earnedRuns ?? 0,
    baa: s.avg ?? '.---',
    era: s.era ?? '-.-',
    k9: s.strikeoutsPer9Inn ?? '-.-',
    bb9: s.walksPer9Inn ?? '-.-',
    hr9: s.homeRunsPer9 ?? '-.-',
  }
}

function getRecentSplits(data, group, days) {
  const splits = data?.stats?.[0]?.splits
  if (!splits?.length) return null

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)

  const recent = splits.filter((s) => {
    const d = new Date(s.date)
    return d >= cutoff
  })

  if (!recent.length) return null

  // Aggregate counting stats across recent game log entries
  const agg = recent.reduce(
    (acc, s) => {
      const st = s.stat
      if (group === 'hitting') {
        acc.g += 1
        acc.pa += st.plateAppearances ?? 0
        acc.h += st.hits ?? 0
        acc.doubles += st.doubles ?? 0
        acc.hr += st.homeRuns ?? 0
        acc.rbi += st.rbi ?? 0
        acc.sb += st.stolenBases ?? 0
        acc.so += st.strikeOuts ?? 0
        acc.bb += st.baseOnBalls ?? 0
        acc.ab += st.atBats ?? 0
      } else {
        // pitching — inningsPitched is a string like "6.0" or "6.2" (thirds)
        const ipToOuts = (ip) => {
          const [full, frac = 0] = String(ip).split('.').map(Number)
          return full * 3 + frac
        }
        acc.g += 1
        acc.gs += st.gamesStarted ?? 0
        acc.outs += ipToOuts(st.inningsPitched ?? '0.0')
        acc.h += st.hits ?? 0
        acc.bb += st.baseOnBalls ?? 0
        acc.so += st.strikeOuts ?? 0
        acc.er += st.earnedRuns ?? 0
        acc.hr += st.homeRuns ?? 0
      }
      return acc
    },
    group === 'hitting'
      ? { g: 0, pa: 0, h: 0, doubles: 0, hr: 0, rbi: 0, sb: 0, so: 0, bb: 0, ab: 0 }
      : { g: 0, gs: 0, outs: 0, h: 0, bb: 0, so: 0, er: 0, hr: 0 },
  )

  if (group === 'hitting') {
    const avg = agg.ab > 0 ? (agg.h / agg.ab).toFixed(3).replace(/^0/, '') : '.000'
    const obpDenom = agg.pa
    const obpNum = agg.h + agg.bb
    const obp = obpDenom > 0 ? (obpNum / obpDenom).toFixed(3).replace(/^0/, '') : '.000'
    const slg = agg.ab > 0 ? ((agg.h + agg.doubles + agg.hr * 3) / agg.ab).toFixed(3).replace(/^0/, '') : '.000'
    const opsVal = (parseFloat(obp) + parseFloat(slg)).toFixed(3).replace(/^0/, '')
    return {
      g: agg.g,
      pa: agg.pa,
      h: agg.h,
      doubles: agg.doubles,
      hr: agg.hr,
      rbi: agg.rbi,
      sb: agg.sb,
      so: agg.so,
      bb: agg.bb,
      avg,
      obp,
      slg,
      ops: opsVal,
      bbPct: agg.pa > 0 ? ((agg.bb / agg.pa) * 100).toFixed(1) : '0.0',
      kPct: agg.pa > 0 ? ((agg.so / agg.pa) * 100).toFixed(1) : '0.0',
    }
  }

  // pitching
  const fullInnings = Math.floor(agg.outs / 3)
  const partialOuts = agg.outs % 3
  const ip = `${fullInnings}.${partialOuts}`
  const ipDecimal = fullInnings + partialOuts / 3
  return {
    g: agg.g,
    gs: agg.gs,
    ip,
    h: agg.h,
    bb: agg.bb,
    so: agg.so,
    era: ipDecimal > 0 ? ((agg.er * 9) / ipDecimal).toFixed(2) : '-.-',
    baa: (agg.h + agg.bb) > 0 ? (agg.h / (agg.h + agg.bb + agg.so)).toFixed(3).replace(/^0/, '') : '.000',
    k9: ipDecimal > 0 ? ((agg.so * 9) / ipDecimal).toFixed(1) : '-.-',
    bb9: ipDecimal > 0 ? ((agg.bb * 9) / ipDecimal).toFixed(1) : '-.-',
    hr9: ipDecimal > 0 ? ((agg.hr * 9) / ipDecimal).toFixed(1) : '-.-',
  }
}

export function usePlayer(personId, type) {
  const group = type === 'pitcher' ? 'pitching' : 'hitting'
  const recentDays = type === 'pitcher' ? 14 : 7

  return useQuery({
    queryKey: ['player', personId, type],
    queryFn: async () => {
      const statsBase = `${BASE}/people/${personId}/stats`
      const milb = 'leagueListId=milb_all'

      const [bioData, seasonData, gameLogData] = await Promise.all([
        fetchJson(`${BASE}/people/${personId}?hydrate=currentTeam`),
        fetchJson(`${statsBase}?stats=season&group=${group}&season=${SEASON}&${milb}`),
        fetchJson(`${statsBase}?stats=gameLog&group=${group}&season=${SEASON}&${milb}`),
      ])

      const bio = parseBio(bioData)

      // Level comes from stats response — bio endpoint doesn't expose sport
      const levelAbbr = seasonData?.stats?.[0]?.splits?.[0]?.sport?.abbreviation ?? null
      if (bio) bio.level = levelAbbr

      const seasonStats = parseSeasonStats(seasonData, group)
      const recentStats = getRecentSplits(gameLogData, group, recentDays)

      return { bio, seasonStats, recentStats }
    },
    enabled: !!personId,
  })
}
