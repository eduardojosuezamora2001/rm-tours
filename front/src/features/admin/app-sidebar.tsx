// Adapted from the official @shadcn/sidebar-07 block (Radix).
import { Link, NavLink, useLocation, useNavigate } from 'react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import {
  ArrowUpRight,
  ChevronRight,
  ChevronsUpDown,
  FileText,
  LogOut,
  Map,
  Settings,
  Waves,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { request } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'

export function AppSidebar() {
  const { t } = useTranslation('admin', { lng: 'es' })
  const { t: common } = useTranslation('common', { lng: 'es' })
  const { setOpenMobile, isMobile } = useSidebar()
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" tooltip="RM Tours" aria-label="RM Tours">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Waves />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">RM Tours</span>
                    <span className="truncate text-xs">{t('title')}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side={isMobile ? 'bottom' : 'right'}
                align="start"
                sideOffset={4}
                className="min-w-56"
              >
                <DropdownMenuLabel>{t('title')}</DropdownMenuLabel>
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link to="/admin-tours" onClick={() => setOpenMobile(false)}>
                      <Waves />
                      RM Tours
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link to="/es" target="_blank" rel="noopener noreferrer">
                      <ArrowUpRight />
                      {t('openWebsite')}
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label={common('close')}
              onClick={() => setOpenMobile(false)}
            >
              <X />
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>{t('openWebsite')}</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/es" target="_blank" rel="noopener noreferrer">
                  <ArrowUpRight />
                  <span>{t('openWebsite')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

function NavMain() {
  const { t } = useTranslation('admin', { lng: 'es' })
  const { pathname } = useLocation()
  const { setOpenMobile, state, setOpen } = useSidebar()
  const [catalogOpen, setCatalogOpen] = useState(true)
  const catalogActive = pathname === '/admin-tours' || pathname.startsWith('/admin-tours/tours/')
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t('management')}</SidebarGroupLabel>
      <nav
        aria-label={t('management')}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest('a')) setOpenMobile(false)
        }}
      >
        <SidebarMenu>
          <Collapsible
            asChild
            open={catalogOpen}
            onOpenChange={(next) => {
              if (state === 'collapsed') {
                setOpen(true)
                setCatalogOpen(true)
              } else setCatalogOpen(next)
            }}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip={t('workspace')} isActive={catalogActive}>
                  <Map />
                  <span>{t('workspace')}</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === '/admin-tours'}>
                      <NavLink to="/admin-tours" end>
                        <span>{t('workspace')}</span>
                      </NavLink>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === '/admin-tours/tours/new'}>
                      <Link to="/admin-tours/tours/new">
                        <span>{t('new')}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
          {[
            { title: t('settings'), url: '/admin-tours/settings', icon: Settings },
            { title: t('legal'), url: '/admin-tours/legal', icon: FileText },
          ].map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild tooltip={item.title} isActive={pathname === item.url}>
                <NavLink to={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </nav>
    </SidebarGroup>
  )
}

function NavUser() {
  const { t } = useTranslation('admin', { lng: 'es' })
  const { t: auth } = useTranslation('auth', { lng: 'es' })
  const { t: common } = useTranslation('common', { lng: 'es' })
  const { isMobile } = useSidebar()
  const client = useQueryClient()
  const navigate = useNavigate()
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" aria-label={t('title')}>
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="rounded-lg">RM</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">RM Tours</span>
                <span className="truncate text-xs">{t('title')}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel>RM Tours · {t('title')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link to="/es" target="_blank" rel="noopener noreferrer">
                  <ArrowUpRight />
                  {t('openWebsite')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={async () => {
                  try {
                    await request('/auth/logout', { method: 'POST' }, true)
                    client.clear()
                    navigate('/admin-tours/login')
                  } catch {
                    toast.error(common('errors.GENERIC'))
                  }
                }}
              >
                <LogOut />
                {auth('signOut')}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
