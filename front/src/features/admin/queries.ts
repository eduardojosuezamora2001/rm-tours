import { useQuery } from '@tanstack/react-query'
import { request } from '@/lib/api'
import type { Tour } from '../../../../shared/contracts'
export function useAdminTours() {
  return useQuery({
    queryKey: ['admin-tours'],
    queryFn: ({ signal }) => request<Tour[]>('/admin/tours', { signal }, true),
    refetchInterval: 20 * 60 * 1000,
  })
}
export function useAdminTour(id: string) {
  return useQuery({
    queryKey: ['admin-tour', id],
    queryFn: ({ signal }) => request<Tour>(`/admin/tours/${id}`, { signal }, true),
    enabled: id !== 'new',
  })
}
