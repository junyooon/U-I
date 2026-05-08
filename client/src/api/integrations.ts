import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import { useAuthStore } from '../store/auth'

interface Integration {
  provider: string
  status: 'connected' | 'disconnected' | 'error'
  last_synced_at: string | null
}

export function useIntegrations() {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['integrations'],
    queryFn: () => apiFetch<{ integrations: Integration[] }>('/integrations', token!),
    enabled: !!token,
  })
}

export function useConnectGoogle() {
  const token = useAuthStore((s) => s.token)
  return useMutation({
    mutationFn: async () => {
      const data = await apiFetch<{ url: string }>('/integrations/google/auth-url', token!)
      window.location.href = data.url
    },
  })
}

export function useSyncNow() {
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiFetch('/integrations/sync', token!, { method: 'POST' }),
    onSuccess: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['graph'] })
        queryClient.invalidateQueries({ queryKey: ['integrations'] })
      }, 5000)
    },
  })
}
