import { create } from 'zustand'

interface GraphStore {
  hiddenCategories: Set<string>
  hoveredNodeId: string | null
  toggleCategory: (id: string) => void
  setHoveredNode: (id: string | null) => void
}

export const useGraphStore = create<GraphStore>((set) => ({
  hiddenCategories: new Set(),
  hoveredNodeId: null,
  toggleCategory: (id) =>
    set((state) => {
      const next = new Set(state.hiddenCategories)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return { hiddenCategories: next }
    }),
  setHoveredNode: (id) => set({ hoveredNodeId: id }),
}))
