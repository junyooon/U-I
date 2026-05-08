import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import { useAuthStore } from '../store/auth'

interface CreateCategoryInput {
  name: string
  color: string
}

export function useCreateCategory() {
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateCategoryInput) =>
      apiFetch('/categories', token!, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['graph'] })
    },
  })
}
