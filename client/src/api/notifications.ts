import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import { useAuthStore } from '../store/auth'

export interface NotificationSettings {
  global_thresholds: {
    warn_days: number
    alert_days: number
    critical_days: number
  }
  channels: {
    in_app: boolean
    push: boolean
    email_digest: boolean
  }
}

export function useNotificationSettings() {
  const token = useAuthStore((s) => s.token)
  return useQuery<NotificationSettings>({
    queryKey: ['notification-settings'],
    queryFn: () => apiFetch('/settings/notifications', token!),
    enabled: !!token,
  })
}

export function usePatchNotificationSettings() {
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      warn_days?: number
      alert_days?: number
      critical_days?: number
      channel_in_app?: boolean
      channel_push?: boolean
      channel_email_digest?: boolean
    }) =>
      apiFetch('/settings/notifications', token!, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(['notification-settings'], data)
    },
  })
}

export function useSendTestDigest() {
  const token = useAuthStore((s) => s.token)
  return useMutation({
    mutationFn: () =>
      apiFetch('/settings/notifications/test-digest', token!, { method: 'POST' }),
  })
}
