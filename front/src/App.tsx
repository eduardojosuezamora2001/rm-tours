import { Suspense } from 'react'
import { createBrowserRouter, RouterProvider, Link, redirect, useRouteError } from 'react-router'
import { NuqsAdapter } from 'nuqs/adapters/react-router/v8'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import i18n from './i18n'
import { PublicLayout } from '@/components/layout'
import { Loading, ErrorState } from '@/components/feedback'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { ApiError } from '@/lib/api'
import type { LoaderFunctionArgs } from 'react-router'
const client = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchInterval: 20 * 60 * 1000,
      retry: (count, error) =>
        count < 1 &&
        !(
          error instanceof ApiError &&
          ['NOT_FOUND', 'UNAUTHORIZED', 'FORBIDDEN', 'NOT_CONFIGURED'].includes(error.code)
        ),
    },
  },
})
async function publicLoader({ params }: LoaderFunctionArgs) {
  if (!['es', 'en'].includes(params.lang ?? '')) return redirect('/es')
  await i18n.changeLanguage(params.lang)
  return null
}
function NotFound() {
  const { t } = useTranslation()
  return (
    <div className="container page-pad legal-copy">
      <h1>{t('notFound')}</h1>
      <p>{t('notFoundBody')}</p>
      <Button asChild>
        <Link to="/es/tours">{t('tours')}</Link>
      </Button>
    </div>
  )
}
function RouteError() {
  return (
    <div className="container page-pad">
      <ErrorState error={useRouteError()} retry={() => window.location.reload()} />
    </div>
  )
}
const router = createBrowserRouter([
  { path: '/', loader: () => redirect('/es') },
  {
    path: '/:lang',
    HydrateFallback: Loading,
    Component: PublicLayout,
    loader: publicLoader,
    errorElement: <RouteError />,
    children: [
      {
        index: true,
        lazy: async () => ({ Component: (await import('./features/catalog/home-page')).default }),
      },
      {
        path: 'tours',
        lazy: async () => ({
          Component: (await import('./features/catalog/catalog-page')).default,
        }),
      },
      {
        path: 'tours/:slug',
        lazy: async () => ({ Component: (await import('./features/catalog/tour-detail')).default }),
      },
      {
        path: 'cotizar',
        lazy: async () => ({ Component: (await import('./features/quote/quote-page')).default }),
      },
      {
        path: 'privacidad',
        lazy: async () => ({ Component: (await import('./features/catalog/legal-page')).default }),
      },
      {
        path: 'terminos',
        lazy: async () => ({ Component: (await import('./features/catalog/legal-page')).default }),
      },
      { path: '*', Component: NotFound },
    ],
  },
  {
    path: '/admin-tours',
    HydrateFallback: Loading,
    errorElement: <RouteError />,
    children: [
      {
        path: 'login',
        lazy: async () => ({ Component: (await import('./features/admin/auth')).default }),
      },
      {
        path: 'recover',
        lazy: async () => ({ Component: (await import('./features/admin/auth')).default }),
      },
      {
        path: 'reset-password',
        lazy: async () => ({ Component: (await import('./features/admin/auth')).default }),
      },
      {
        lazy: async () => ({ Component: (await import('./features/admin/auth')).OwnerGuard }),
        children: [
          {
            path: 'tours/:id',
            lazy: async () => ({
              Component: (await import('./features/admin/tour-editor')).default,
            }),
          },
          {
            lazy: async () => ({ Component: (await import('./features/admin/layout')).default }),
            children: [
              {
                index: true,
                lazy: async () => ({
                  Component: (await import('./features/admin/tour-list')).default,
                }),
              },
              {
                path: 'settings',
                lazy: async () => ({
                  Component: (await import('./features/admin/settings')).default,
                }),
              },
              {
                path: 'legal',
                lazy: async () => ({
                  Component: (await import('./features/admin/legal-editor')).default,
                }),
              },
              {
                path: 'preview/:id',
                lazy: async () => ({
                  Component: (await import('./features/admin/preview')).default,
                }),
              },
            ],
          },
        ],
      },
    ],
  },
])
export default function App() {
  const { t } = useTranslation()
  return (
    <QueryClientProvider client={client}>
      <Suspense fallback={<Loading />}>
        <NuqsAdapter>
          <RouterProvider router={router} />
        </NuqsAdapter>
        <Toaster theme="light" richColors containerAriaLabel={t('notifications')} />
      </Suspense>
    </QueryClientProvider>
  )
}
