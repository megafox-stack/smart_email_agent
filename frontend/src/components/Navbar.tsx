import { Search, Mail, RefreshCw, Sparkles } from 'lucide-react'
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
      } catch {}
    }

    fetchProfile()

    return () => {
      mounted = false
    }
  }, [])

  const initial = email ? email.split('@')[0].charAt(0).toUpperCase() : 'U'
  const display = email || 'User'

  return (
    <header className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 shadow-[0_18px_60px_rgba(2,6,23,0.5)] backdrop-blur-xl lg:p-5">
      <div className="flex flex-col gap-5">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-300">Welcome Back</p>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
              <Mail className="h-3.5 w-3.5" />
              Gmail Connected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-sky-300" />
            <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl lg:text-[2rem]">
              AI Email Automation Platform
            </h1>
          </div>

          <p className="max-w-xl text-sm leading-6 text-slate-400 lg:text-[15px]">
            Manage emails, AI insights and security from one place.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search emails..."
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 py-2.5 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-500/60 focus:bg-slate-950"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-100 transition hover:border-sky-400/40 hover:bg-sky-500/15">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>

            <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 font-semibold text-white shadow-lg shadow-sky-500/20">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-400">Signed in</p>
                <p className="max-w-[180px] truncate text-sm font-semibold text-white">{display}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}