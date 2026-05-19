'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Building2, CalendarDays, Users, Settings, LogOut, LayoutDashboard } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/logo'

const navItems = [
  { href: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/facilities', label: '施設管理', icon: Building2 },
  { href: '/dashboard/bookings', label: '予約管理', icon: CalendarDays },
  { href: '/dashboard/guests', label: '宿泊者名簿', icon: Users },
  { href: '/dashboard/settings', label: '設定', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-60 min-h-screen bg-navy-700 flex flex-col shrink-0">
      <div className="px-6 py-5 border-b border-navy-600">
        <Logo variant="default" size="sm" />
        <p className="text-xs text-navy-100 mt-0.5">管理ダッシュボード</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-navy-500 text-white'
                  : 'text-navy-100 hover:bg-navy-600 hover:text-white'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-navy-600">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-navy-100 hover:bg-navy-600 hover:text-white transition-colors"
        >
          <LogOut size={18} />
          ログアウト
        </button>
      </div>
    </aside>
  )
}
