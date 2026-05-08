import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import { useAuthStore } from '../store/auth'

interface CreateContactInput {
  name: string
  email?: string | null
  phone?: string | null
  category_ids?: string[]
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
