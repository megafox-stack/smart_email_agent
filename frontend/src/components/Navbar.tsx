import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import api from '../services/api'

interface NavbarProps {
  searchTerm: string
  onSearchChange: (query: string) => void
}

export default function Navbar({ searchTerm, onSearchChange }: NavbarProps) {
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function fetchProfile() {
      try {
        const res = await api.get('/profile')
        if (!mounted) return
        setEmail(res.data.email || null)
      } catch (e) {
        // ignore - show generic when unauthenticated
      }
    }
    fetchProfile()
    return () => { mounted = false }
  }, [])

  const initial = email ? email.split('@')[0].charAt(0).toUpperCase() : 'U'
  const display = email || 'User'

  return (
    <header className="flex flex-col gap-5 rounded-[2rem] border border-white/10 bg-slate-950/80 p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-sky-400/80">Dashboard</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">AI Gmail Assistant</h1>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <label className="relative block w-full max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search emails by subject or sender"
            className="w-full rounded-3xl border border-slate-800 bg-slate-900/90 py-3 pl-11 pr-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          />
        </label>

        <div className="flex items-center gap-3 rounded-3xl bg-slate-900/80 px-4 py-3 text-slate-100 shadow-sm ring-1 ring-white/10">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-800 text-sky-300">{initial}</div>
          <div className="text-sm">
            <p className="text-slate-400">Signed in as</p>
            <p className="font-semibold text-white">{display}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
