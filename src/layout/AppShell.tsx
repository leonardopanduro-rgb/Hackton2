import { LogOut, RadioTower, ScrollText, Table2, Waves } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider.tsx'
import { Button } from '../components/ui.tsx'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: RadioTower },
  { to: '/tropels', label: 'Tropeles', icon: Table2 },
  { to: '/signals', label: 'Senales', icon: Waves },
  { to: '/sectors', label: 'Sectores', icon: ScrollText },
]

export function AppShell() {
  const auth = useAuth()

  return (
    <div className="min-h-screen bg-stone-50 text-stone-950">
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-teal-800">TropelCare Control Room</p>
            <p className="text-xs text-stone-500">{auth.session?.user.teamCode} · {auth.session?.user.displayName}</p>
          </div>
          <nav className="flex flex-wrap items-center gap-1" aria-label="Principal">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      'inline-flex min-h-10 items-center gap-2 rounded px-3 text-sm font-medium transition',
                      isActive ? 'bg-teal-700 text-white' : 'text-stone-700 hover:bg-stone-100',
                    ].join(' ')
                  }
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>
          <Button type="button" variant="secondary" onClick={auth.logout}>
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Salir
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
