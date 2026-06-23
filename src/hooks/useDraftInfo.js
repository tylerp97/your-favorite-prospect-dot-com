import { useQuery } from '@tanstack/react-query'

const BASE = 'https://statsapi.mlb.com/api/v1'

function formatRound(round) {
  if (!round) return ''
  return /^\d+$/.test(round) ? `R${round}` : round
}

export function useDraftInfo(personId, draftYear) {
  return useQuery({
    queryKey: ['draft', personId, draftYear],
    queryFn: async () => {
      const data = await fetch(`${BASE}/draft/${draftYear}?playerId=${personId}`).then((r) => r.json())
      const pick = data?.drafts?.rounds?.[0]?.picks?.[0]
      if (!pick) return null
      return {
        year: draftYear,
        round: formatRound(pick.pickRound),
        pickNumber: pick.displayPickNumber,
        label: `${draftYear} Draft · ${formatRound(pick.pickRound)}`,
      }
    },
    enabled: !!personId && !!draftYear,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
