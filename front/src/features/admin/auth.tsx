import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { ApiError, request } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { Brand } from '@/components/layout'
import { ErrorState, Loading } from '@/components/feedback'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
export function OwnerGuard() {
  const navigate = useNavigate()
  const session = useQuery({
    queryKey: ['admin-session'],
    queryFn: () => request<{ id: string }>('/admin/session', {}, true),
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: true,
  })
  const client = useQueryClient()
  const [logoutError, setLogoutError] = useState<unknown>(null)
  const { t } = useTranslation('auth', { lng: 'es' })
  useEffect(() => {
    const expired = () => {
      void client.invalidateQueries({ queryKey: ['admin-session'] })
    }
    window.addEventListener('admin-session-expired', expired)
    return () => window.removeEventListener('admin-session-expired', expired)
  }, [client])
  if (session.isPending) return <Loading />
  if (session.error instanceof ApiError && session.error.code === 'UNAUTHORIZED')
    return <Navigate to="/admin-tours/login" replace />
  if (session.error instanceof ApiError && session.error.code === 'FORBIDDEN')
    return (
      <div className="container page-pad">
        <Alert variant="destructive">
          <AlertTitle>{t('unauthorized')}</AlertTitle>
        </Alert>
        {logoutError ? <ErrorState error={logoutError} /> : null}
        <Button
          onClick={async () => {
            try {
              await request('/auth/logout', { method: 'POST' }, true)
              client.clear()
              navigate('/admin-tours/login', { replace: true })
            } catch (error) {
              setLogoutError(error)
            }
          }}
        >
          {t('signOut')}
        </Button>
      </div>
    )
  if (session.error)
    return (
      <div className="container page-pad">
        <ErrorState error={session.error} retry={() => void session.refetch()} />
      </div>
    )
  return <Outlet />
}
export default function AuthPage() {
  const { t } = useTranslation('auth', { lng: 'es' })
  const location = useLocation()
  const client = useQueryClient()
  const mode = location.pathname.endsWith('recover')
    ? 'recover'
    : location.pathname.endsWith('reset-password')
      ? 'reset'
      : 'login'
  const form = useForm<{ email: string; password: string }>({
    defaultValues: { email: '', password: '' },
  })
  const code = mode === 'reset' ? new URLSearchParams(location.search).get('code') : null
  const [result, setResult] = useState<'error' | 'sent' | 'updated' | null>(
    location.search.includes('error=') ? 'error' : null,
  )
  const [loggedIn, setLoggedIn] = useState(false)
  useEffect(() => {
    if (code) window.location.replace(`/api/v1/auth/callback?code=${encodeURIComponent(code)}`)
  }, [code])
  useEffect(() => {
    document.documentElement.lang = 'es'
    document.title = 'Administración · RM Tours'
  }, [])
  async function submit(values: { email: string; password: string }) {
    setResult(null)
    try {
      if (mode === 'recover') {
        await request(
          '/auth/recover',
          { method: 'POST', body: JSON.stringify({ email: values.email }) },
          true,
        )
        setResult('sent')
      } else if (mode === 'reset') {
        await request(
          '/auth/reset-password',
          { method: 'POST', body: JSON.stringify({ password: values.password }) },
          true,
        )
        client.clear()
        setResult('updated')
      } else {
        const user = await request<{ id: string }>(
          '/auth/login',
          { method: 'POST', body: JSON.stringify(values) },
          true,
        )
        client.setQueryData(['admin-session'], user)
        setLoggedIn(true)
      }
    } catch {
      setResult('error')
    }
  }
  if (code) return <Loading />
  if (loggedIn)
    return (
      <>
        <Navigate to="/admin-tours" replace />
        <Loading />
      </>
    )
  return (
    <div className="auth-page">
      <Link to="/es">
        <Brand />
      </Link>
      <Card className="auth-panel">
        <CardHeader>
          <CardTitle asChild>
            <h1>{mode === 'recover' ? t('recoverTitle') : t('title')}</h1>
          </CardTitle>
          <CardDescription asChild>
            <p>{t('subtitle')}</p>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(submit)} noValidate>
            <FieldGroup>
              {mode !== 'reset' && (
                <Field data-invalid={!!form.formState.errors.email}>
                  <FieldLabel htmlFor="auth-email">{t('email')}</FieldLabel>
                  <Input
                    id="auth-email"
                    type="email"
                    autoComplete="email"
                    aria-invalid={!!form.formState.errors.email}
                    {...form.register('email', {
                      required: t('error'),
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: t('error') },
                    })}
                  />
                  {form.formState.errors.email && (
                    <FieldError>{form.formState.errors.email.message}</FieldError>
                  )}
                </Field>
              )}
              {mode !== 'recover' && (
                <Field data-invalid={!!form.formState.errors.password}>
                  <FieldLabel htmlFor="auth-password">
                    {mode === 'reset' ? t('newPassword') : t('password')}
                  </FieldLabel>
                  <Input
                    id="auth-password"
                    type="password"
                    autoComplete={mode === 'reset' ? 'new-password' : 'current-password'}
                    aria-invalid={!!form.formState.errors.password}
                    {...form.register('password', {
                      required: t('error'),
                      minLength: { value: mode === 'reset' ? 12 : 1, message: t('error') },
                    })}
                  />
                  {form.formState.errors.password && (
                    <FieldError>{form.formState.errors.password.message}</FieldError>
                  )}
                </Field>
              )}
              {result && (
                <Alert variant={result === 'error' ? 'destructive' : 'default'}>
                  <AlertTitle>{t(result)}</AlertTitle>
                </Alert>
              )}
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                aria-busy={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting && <Spinner aria-hidden="true" />}
                {t(mode === 'recover' ? 'recover' : mode === 'reset' ? 'update' : 'signIn')}
              </Button>
              {mode === 'login' ? (
                <Link to="/admin-tours/recover">{t('forgot')}</Link>
              ) : (
                <Link to="/admin-tours/login">{t('signIn')}</Link>
              )}
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
