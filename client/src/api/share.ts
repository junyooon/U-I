import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import { useAuthStore } from '../store/auth'
import type { GraphData } from '../types'

export function useShareToken() {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['share-token'],
    queryFn: () => apiFetch<{ share_token: string | null }>('/share', token!),
    enabled: !!token,
  })
}

export function useGenerateShareToken() {
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiFetch<{ share_token: string }>('/share', token!, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['share-token'] }),
  })
}

export function useRevokeShareToken() {
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiFetch<{ message: string }>('/share', token!, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['share-token'] }),
  })
}

export async function fetchPublicGraph(shareToken: string): Promise<GraphData & { owner: string }> {
  const res = await fetch(`/api/v1/share/${shareToken}`)
  if (!res.ok) throw new Error(`${res.status}`)
  return res.json()
}
