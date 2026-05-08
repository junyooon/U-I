import { useQuery } from '@tanstack/react-query'
import { apiFetch } from './client'
import { useAuthStore } from '../store/auth'
import type { GraphData } from '../types'

export function useGraph() {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['graph'],
    queryFn: () => apiFetch<GraphData>('/graph', token!),
    enabled: !!token,
    refetchInterval: 60_000,
  })
}
