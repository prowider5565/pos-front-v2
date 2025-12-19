"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  Wallet,
  Receipt,
} from "lucide-react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Logo } from "@/components/logo"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/auth-context"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isAuthenticated } = useAuth()
  const { t } = useTranslation('common')

  const navGroups = [
    {
      label: t('navigation.dashboard'),
      items: [
        {
          title: t('navigation.dashboard'),
          url: "/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      label: t('navigation.savdo'),
      items: [
        {
          title: t('navigation.mahsulotlar'),
          url: "/products",
          icon: Package,
        },
        {
          title: t('navigation.soldProducts'),
          url: "/sales",
          icon: Receipt,
        },
        {
          title: t('navigation.sotuv'),
          url: "/savdo/sotuv",
          icon: ShoppingCart,
        },
      ],
    },
    {
      label: t('navigation.management'),
      items: [
        {
          title: t('navigation.clients'),
          url: "/clients",
          icon: Users,
        },
        {
          title: t('navigation.suppliers'),
          url: "/suppliers",
          icon: Users,
        },
        {
          title: t('navigation.employees'),
          url: "/users",
          icon: Users,
        },
      ],
    },
    {
      label: t('navigation.debts'),
      items: [
        {
          title: t('navigation.supplierDebts'),
          url: "/debts/suppliers",
          icon: Wallet,
        },
        {
          title: t('navigation.clientDebts'),
          url: "/debts/clients",
          icon: Wallet,
        },
      ],
    },
  ]

  // Generate user display data from auth context
  const userData = React.useMemo(() => {
    if (isAuthenticated && user) {
      const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username
      return {
        name: fullName,
        email: user.phone_number || user.username,
        avatar: "",
      }
    }
    return {
      name: "Guest",
      email: "guest@example.com",
      avatar: "",
    }
  }, [user, isAuthenticated])

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Logo size={24} className="text-current" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{t('app.name')}</span>
                  <span className="truncate text-xs">{t('app.tagline')}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <NavMain key={group.label} label={group.label} items={group.items} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
