import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const SEED_PROSPECTS = [
  { personId: 822501, type: 'hitter' },
  { personId: 800231, type: 'hitter' },
  { personId: 821107, type: 'hitter' },
  { personId: 693311, type: 'pitcher' },
  { personId: 695766, type: 'pitcher' },
  { personId: 701509, type: 'pitcher' },
]

export const useProspects = create(
  persist(
    (set, get) => ({
      prospects: SEED_PROSPECTS,

      addProspect: (personId, type) => {
        const exists = get().prospects.some((p) => p.personId === personId)
        if (!exists) {
          set((state) => ({
            prospects: [...state.prospects, { personId, type }],
          }))
        }
      },

      removeProspect: (personId) => {
        set((state) => ({
          prospects: state.prospects.filter((p) => p.personId !== personId),
        }))
      },

      hitters: () => get().prospects.filter((p) => p.type === 'hitter'),
      pitchers: () => get().prospects.filter((p) => p.type === 'pitcher'),
    }),
    {
      name: 'yfp-prospects',
      // Merge seed data with any saved data so new seeds appear on first load
      merge: (persisted, current) => ({
        ...current,
        prospects: persisted.prospects ?? SEED_PROSPECTS,
      }),
    },
  ),
)
