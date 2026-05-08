import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import { useAuthStore } from '../store/auth'

interface CreateContactInput {
  name: string
  email?: string | null
  phone?: string | null
  category_ids?: string[]
}

export interface Interaction {
  id: string
  type: string
  occurred_at: string
  notes: string | null
}

export interface ContactDetail {
  id: string
  name: string
  email: string | null
  phone: string | null
  category_ids: string[]
  last_contact_at: string | null
  drift_score: number
  distance: number
  created_at: string
}

export function useCreateContact() {
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateContactInput) =>
      apiFetch('/contacts', token!, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['graph'] })
    },
  })
}

export function useContact(id: string | null) {
  const token = useAuthStore((s) => s.token)
  return useQuery<{ contact: ContactDetail; interactions: Interaction[] }>({
    queryKey: ['contact', id],
    queryFn: () => apiFetch(`/contacts/${id}`, token!),
    enabled: !!token && !!id,
  })
}

export function useCreateInteraction(contactId: string) {
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { type: 'manual' | 'in_person'; occurred_at: string; notes?: string | null }) =>
      apiFetch(`/contacts/${contactId}/interactions`, token!, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact', contactId] })
      queryClient.invalidateQueries({ queryKey: ['graph'] })
    },
  })
}

export function useDeleteInteraction(contactId: string) {
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (interactionId: string) =>
      apiFetch(`/contacts/${contactId}/interactions/${interactionId}`, token!, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact', contactId] })
      queryClient.invalidateQueries({ queryKey: ['graph'] })
    },
  })
}

export function useDeleteContact() {
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (contactId: string) =>
      apiFetch(`/contacts/${contactId}`, token!, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['graph'] })
    },
  })
}
