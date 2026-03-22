// app/admin/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Topbar from '@/components/layout/Topbar'
import AdminClient from '@/components/ui/AdminClient'

export default async function AdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: profiles } = await supabase.from('profiles').select('*').order('nom')
  const { data: moisList }  = await supabase.from('mois').select('*').order('annee', { ascending: false }).order('mois', { ascending: false })

  return (
    <div className="min-h-screen bg-scrasa-gray-light">
      <Topbar profile={profile} />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="font-display font-bold text-4xl text-scrasa-gray">Administration</h1>
          <p className="text-gray-400 mt-1">Gestion des comptes RH et du barème</p>
        </div>
        <AdminClient profiles={profiles || []} moisList={moisList || []} />
      </main>
    </div>
  )
}
