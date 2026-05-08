import { useQuery } from '@tanstack/react-query'
import { apiFetch } from './client'
import { useAuthStore } from '../store/auth'

export interface TimelineInteraction {
  id: string
  type: string
  occurred_at: string
  notes: string | null
  contact: {
    id: string
    name: string
    primary_color: string
  }
}

export interface DriftingContact {
  id: string
  name: string
  primary_color: string
  last_contact_at: string | null
  drift_score: number
}

export interface TimelineData {
  interactions: TimelineInteraction[]
  drifting: DriftingContact[]
}

export function useTimeline() {
  const token = useAuthStore((s) => s.token)
  return useQuery<TimelineData>({
    queryKey: ['timeline'],
    queryFn: () => apiFetch('/timeline', token!),
    enabled: !!token,
  })
}
