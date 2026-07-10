import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import BulkEmailPage from './pages/BulkEmail'
import EventCalendar from './pages/EventCalendar'
import ContactsPage from './pages/ContactsPage'

function App() {
  const [activePage, setActivePage] = useState<'Dashboard' | 'Bulk Email' | 'Event Calendar' | 'Contacts'>('Dashboard')

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 rounded-[2rem] border border-white/10 bg-slate-950/80 p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-sky-400/80">Email Automation</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Smart Email Agent</h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setActivePage('Dashboard')}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${activePage === 'Dashboard' ? 'bg-sky-500 text-white' : 'bg-slate-900 text-slate-200 hover:bg-slate-800'}`}
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => setActivePage('Bulk Email')}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${activePage === 'Bulk Email' ? 'bg-sky-500 text-white' : 'bg-slate-900 text-slate-200 hover:bg-slate-800'}`}
            >
              Bulk Email
            </button>
            <button
              type="button"
              onClick={() => setActivePage('Event Calendar')}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${activePage === 'Event Calendar' ? 'bg-sky-500 text-white' : 'bg-slate-900 text-slate-200 hover:bg-slate-800'}`}
            >
              Event Calendar
            </button>
            <button
              type="button"
              onClick={() => setActivePage('Contacts')}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${activePage === 'Contacts' ? 'bg-sky-500 text-white' : 'bg-slate-900 text-slate-200 hover:bg-slate-800'}`}
            >
              Contacts
            </button>
          </div>
        </div>

        {activePage === 'Dashboard' ? (
          <Dashboard />
        ) : activePage === 'Bulk Email' ? (
          <BulkEmailPage />
        ) : activePage === 'Event Calendar' ? (
          <EventCalendar />
        ) : (
          <ContactsPage />
        )}
      </div>
    </div>
  )
}

export default App
