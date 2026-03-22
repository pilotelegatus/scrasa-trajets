'use client'
// components/layout/Topbar.tsx
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Profile } from '@/lib/types'
import { LogOut, LayoutDashboard, Users, FileText, Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/dashboard',   label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/compagnons',  label: 'Compagnons',       icon: Users },
  { href: '/rapports',    label: 'Rapports',          icon: FileText },
  { href: '/admin',       label: 'Administration',    icon: Settings, adminOnly: true },
]

export default function Topbar({ profile }: { profile: Profile }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="bg-scrasa-gray border-b-4 border-scrasa-green sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-6 flex items-center gap-6 h-14">
        {/* Logo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="bg-scrasa-green text-white font-display font-black text-lg px-3 py-1 rounded">
            SCRASA
          </div>
          <span className="text-gray-400 text-sm hidden sm:block">Compensations Trajets</span>
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-1 flex-1">
          {NAV.filter(n => !n.adminOnly || profile.role === 'admin').map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-body transition-colors ${
                pathname.startsWith(href)
                  ? 'bg-scrasa-green text-white'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon size={15} />
              <span className="hidden md:block">{label}</span>
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-white text-sm font-medium leading-tight">{profile.nom}</div>
            <div className={`text-xs ${profile.role === 'admin' ? 'text-scrasa-green' : 'text-gray-400'}`}>
              {profile.role === 'admin' ? 'Administrateur' : 'RH'}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-white transition-colors p-1.5 rounded hover:bg-white/10"
            title="Se déconnecter"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  )
}
