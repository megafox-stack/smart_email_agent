interface SearchBarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
}

export default function SearchBar({ searchTerm, onSearchChange }: SearchBarProps) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-4 shadow-soft">
      <label className="block text-sm font-medium text-slate-400">Search</label>
      <input
        type="search"
        value={searchTerm}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search by subject or sender"
        className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
      />
    </div>
  )
}
