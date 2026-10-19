import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Separator } from '@/components/ui/separator'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { SidebarInset, SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import { AppSidebar } from './app-sidebar'

export default function AdminLayout() {
  return (
    <SidebarProvider className="admin-workspace">
      <AdminWorkspace />
    </SidebarProvider>
  )
}

function AdminWorkspace() {
  const { t, i18n } = useTranslation('admin', { lng: 'es' })
  const { t: common } = useTranslation('common', { lng: 'es' })
  const location = useLocation()
  const { open, openMobile, isMobile } = useSidebar()
  const section = location.pathname.includes('/settings')
    ? t('settings')
    : location.pathname.includes('/legal')
      ? t('legal')
      : t('workspace')
  useEffect(() => {
    void i18n.changeLanguage('es')
    document.documentElement.lang = 'es'
    document.title = 'Administración · RM Tours'
  }, [i18n])
  return (
    <>
      <a href="#admin-content" className="skip-link">
        {common('skip')}
      </a>
      <AppSidebar />
      <SidebarInset className="admin-main">
        <header className="admin-workspace-header">
          <SidebarTrigger
            aria-label={common('menu')}
            aria-expanded={isMobile ? openMobile : open}
            aria-haspopup={isMobile ? 'dialog' : undefined}
          />
          <Separator orientation="vertical" className="data-vertical:h-4 data-vertical:self-auto" />
          <Breadcrumb aria-label={t('title')}>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link to="/admin-tours">{t('title')}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{section}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="admin-workspace-preferences">
            <ThemeToggle />
          </div>
        </header>
        <div id="admin-content" tabIndex={-1} className="admin-workspace-content">
          <Outlet />
        </div>
      </SidebarInset>
    </>
  )
}
