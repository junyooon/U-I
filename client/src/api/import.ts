import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import { useAuthStore } from '../store/auth'

export interface ImportRow {
  name: string
  email: string | null
  phone: string | null
  notes: string | null
  category_names: string[]
}

export function useImportContacts() {
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (contacts: ImportRow[]) =>
      apiFetch<{ imported: number }>('/contacts/import', token!, {
        method: 'POST',
        body: JSON.stringify({ contacts }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['graph'] })
      queryClient.invalidateQueries({ queryKey: ['timeline'] })
    },
  })
}
