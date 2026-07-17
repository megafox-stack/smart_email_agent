import { useEffect, useState } from 'react'

type Toast = { id: string; message: string; type?: 'success' | 'error' }

export default function ToastHost() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    function onShow(e: Event) {
      const detail = (e as CustomEvent)?.detail || { message: '' }
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      const t: Toast = { id, message: detail.message || '', type: detail.type }
      setToasts((s) => [t, ...s])
      setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), 3500)
    }

    window.addEventListener('show-toast', onShow as EventListener)
    return () => window.removeEventListener('show-toast', onShow as EventListener)
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed right-4 bottom-6 z-50 flex flex-col gap-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-2xl border border-white/10 px-4 py-3 shadow-md transition transform ${
            t.type === 'error' ? 'bg-rose-600 text-rose-50' : 'bg-emerald-600 text-emerald-50'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
