import {
  Archive,
  Bookmark,
  CalendarDays,
  LayoutDashboard,
  Settings,
  ShieldAlert,
  Sparkles,
  Star,
} from 'lucide-react'

const items = [
  { label: 'Inbox', icon: LayoutDashboard },
  { label: 'Important', icon: Star },
  { label: 'University', icon: Bookmark },
  { label: 'Promotions', icon: Sparkles },
  { label: 'Spam', icon: ShieldAlert },
  { label: 'Drafts', icon: Archive },
  { label: 'Settings', icon: Settings },
]

interface SidebarProps {
  active?: string
  onSelect?: (label: string) => void
}

export default function Sidebar({ active = 'Inbox', onSelect }: SidebarProps) {
  return (
    <aside className="hidden xl:flex xl:w-72 xl:flex-col xl:gap-4 xl:rounded-3xl xl:border xl:border-white/10 xl:bg-slate-950/80 xl:px-5 xl:py-6 xl:shadow-soft">
      <div className="mb-6 flex items-center gap-3 rounded-3xl bg-slate-900/80 px-4 py-4 text-slate-100 shadow-sm ring-1 ring-white/5">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white">
          A
        </div>
        <div>
          <p className="text-sm text-slate-400">Welcome back</p>
          <h2 className="text-lg font-semibold text-white">AI Gmail Assistant</h2>
        </div>
      </div>

      <nav className="flex flex-col gap-2">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = item.label === active
          return (
            <button
              key={item.label}
              onClick={() => onSelect?.(item.label)}
              className={`flex items-center gap-3 rounded-3xl px-4 py-3 text-left text-sm font-medium transition ${isActive ? 'bg-sky-600 text-white' : 'text-slate-200 hover:bg-slate-900/80 hover:text-white'}`}
            >
              <Icon className="h-5 w-5 text-slate-400" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
