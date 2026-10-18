import { lazy, Suspense, useEffect } from 'react'
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Map, Settings, FileText, LogOut, ArrowUpRight } from 'lucide-react'
import { request } from '@/lib/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Brand } from '@/components/layout'
import { StitchIcon } from '@/components/stitch-icon'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Loading } from '@/components/feedback'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar'
const TourList = lazy(() => import('./tour-list'))
export default function AdminLayout() {
  const { t, i18n } = useTranslation('admin', { lng: 'es' })
  const { t: auth } = useTranslation('auth', { lng: 'es' })
  const { t: common } = useTranslation('common', { lng: 'es' })
  const client = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const editing = location.pathname.startsWith('/admin-tours/tours/')
  useEffect(() => {
    void i18n.changeLanguage('es')
    document.documentElement.lang = 'es'
    document.title = 'Administración · RM Tours'
  }, [i18n])
  return (
    <SidebarProvider className="admin-shell">
      <Sidebar collapsible="none" className="admin-sidebar">
        <SidebarHeader>
          <Link to="/admin-tours">
            <Brand />
          </Link>
          <div className="stitch-admin-season">
            <StitchIcon name="location_on" />
            Península de Nicoya<span>{t('management')}</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <nav aria-label={t('management')}>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.pathname === '/admin-tours'}>
                      <NavLink to="/admin-tours" end>
                        <Map />
                        {t('workspace')}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === '/admin-tours/settings'}
                    >
                      <NavLink to="/admin-tours/settings">
                        <Settings />
                        {t('settings')}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === '/admin-tours/legal'}
                    >
                      <NavLink to="/admin-tours/legal">
                        <FileText />
                        {t('legal')}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </nav>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <Button asChild variant="outline">
            <Link to="/es" target="_blank">
              {t('openWebsite')}
              <ArrowUpRight data-icon="inline-end" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            onClick={async () => {
              try {
                await request('/auth/logout', { method: 'POST' }, true)
                client.clear()
                navigate('/admin-tours/login')
              } catch {
                toast.error(common('errors.GENERIC'))
              }
            }}
          >
            <LogOut data-icon="inline-start" />
            {auth('signOut')}
          </Button>
        </SidebarFooter>
      </Sidebar>
      <main className="admin-main">
        <div className="stitch-admin-topbar">
          <span>{t('ops')}</span>
          <Link to="/es" target="_blank">
            <StitchIcon name="public" />
            {t('openWebsite')}
          </Link>
          <Avatar className="stitch-admin-avatar">
            <AvatarFallback>RM</AvatarFallback>
          </Avatar>
        </div>
        {editing ? (
          <>
            <Suspense fallback={<Loading />}>
              <TourList />
            </Suspense>
            <Sheet
              open
              onOpenChange={(open) => {
                if (!open) navigate('/admin-tours')
              }}
            >
              <SheetContent
                className="stitch-editor-drawer"
                closeLabel={common('close')}
                showCloseButton={false}
                aria-describedby={undefined}
              >
                <SheetHeader className="sr-only">
                  <SheetTitle>{t('edit')}</SheetTitle>
                </SheetHeader>
                <Outlet />
              </SheetContent>
            </Sheet>
          </>
        ) : (
          <Outlet />
        )}
      </main>
    </SidebarProvider>
  )
}
