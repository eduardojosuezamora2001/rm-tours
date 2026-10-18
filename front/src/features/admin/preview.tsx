import { useEffect } from 'react'
import { useParams } from 'react-router'
import { TourContent } from '@/features/catalog/tour-detail'
import { useAdminTour } from './queries'
import { ErrorState, Loading } from '@/components/feedback'
export default function Preview() {
  const { id = '' } = useParams()
  const query = useAdminTour(id)
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex,nofollow'
    document.head.append(meta)
    return () => meta.remove()
  }, [])
  return query.isPending ? (
    <Loading />
  ) : query.isError ? (
    <ErrorState error={query.error} retry={() => void query.refetch()} />
  ) : (
    <TourContent tour={query.data} preview />
  )
}
