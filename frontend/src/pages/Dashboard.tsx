import { useMemo, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import StatsCard from '../components/StatsCard'
import EmailCard from '../components/EmailCard'
import EmailDrawer from '../components/EmailDrawer'
import SettingsPanel from '../components/SettingsPanel'
import DraftMessagesPanel from '../components/DraftMessagesPanel'
import { useEmails } from '../hooks/useEmails'

export default function Dashboard() {
  const {
    emails,
    filteredEmails,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    selectedEmail,
    setSelectedEmail,
    stats,
    refresh,
    loginUrl,
    activeFolder,
    setActiveFolder,
  } = useEmails()

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      if (params.get('auth') === 'success') {
        // remove query param and refresh data
        params.delete('auth')
        const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '')
        window.history.replaceState({}, '', newUrl)
        refresh()
      }
    } catch (e) {
      // ignore
    }
  }, [refresh])

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="flex min-h-[160px] items-center justify-center rounded-3xl border border-dashed border-slate-700/80 bg-slate-950/70 p-10 text-slate-400">
          Loading emails…
        </div>
      )
    }

    if (error) {
      // Show helpful action when unauthenticated
      if (error.status === 401) {
        return (
          <div className="flex min-h-[160px] flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-slate-700/80 bg-slate-950/70 p-10 text-center text-slate-400">
            <p className="text-lg font-semibold text-slate-100">You're not signed in</p>
            <p className="max-w-md">Please sign in with Google to allow the app to read your emails.</p>
            <div className="flex gap-3">
              <a href={loginUrl} target="_blank" rel="noreferrer" className="rounded-2xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white">Sign in with Google</a>
              <button onClick={() => refresh()} className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-2 text-sm text-slate-100">Retry</button>
            </div>
          </div>
        )
      }

      return (
        <div className="flex min-h-[160px] items-center justify-center rounded-3xl border border-red-500/20 bg-red-500/5 p-10 text-red-200">
          {error.message}
        </div>
      )
    }

    if (filteredEmails.length === 0) {
      return (
        <div className="flex min-h-[160px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-700/80 bg-slate-950/70 p-10 text-center text-slate-400">
          <p className="text-lg font-semibold text-slate-100">No matching emails found</p>
          <p className="mt-2 max-w-md">Try updating your search criteria or refresh your inbox to load the latest messages.</p>
        </div>
      )
    }

    return (
      <div className="grid gap-4 xl:grid-cols-1">
        {filteredEmails.map((email) => (
          <EmailCard key={email.id} email={email} onSelect={setSelectedEmail} />
        ))}
      </div>
    )
  }, [filteredEmails, loading, error, setSelectedEmail])

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1480px] gap-6 xl:grid-cols-[280px_minmax(0,_1fr)_420px] xl:items-start">
        <Sidebar active={activeFolder} onSelect={setActiveFolder} />

        {activeFolder === 'Settings' ? (
          <main className="space-y-6 xl:col-span-2">
            <SettingsPanel
              error={error}
              emailCount={emails.length}
              refreshing={loading}
              onRefreshInbox={() => refresh()}
            />
          </main>
        ) : activeFolder === 'Drafts' ? (
          <main className="space-y-6 xl:col-span-2">
            <DraftMessagesPanel />
          </main>
        ) : (
          <>
            <main className="space-y-6">
              <Navbar searchTerm={searchTerm} onSearchChange={setSearchTerm} />

              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatsCard label="Total Emails" value={stats.total} accent="" />
                <StatsCard label="Important Emails" value={stats.important} accent="" />
                <StatsCard label="University Emails" value={stats.university} accent="" />
                <StatsCard label="Spam Emails" value={stats.spam} accent="" />
              </section>

              <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-soft">
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Inbox</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">Recent messages</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-slate-400">Showing {filteredEmails.length} message(s)</p>
                    <button onClick={() => refresh()} className="rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-slate-100">Refresh</button>
                  </div>
                </div>

                <div className="grid gap-4">{content}</div>
              </section>
            </main>

            <div className="xl:block hidden">
              <EmailDrawer email={selectedEmail} onClose={() => setSelectedEmail(null)} />
            </div>
          </>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 block xl:hidden border-t border-white/10 bg-slate-950/95 px-4 py-4">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4">
          <p className="text-sm text-slate-400">Tap an email card to open details.</p>
          <p className="font-medium text-slate-100">Mobile-friendly inbox</p>
        </div>
      </div>

      {selectedEmail && (
        <div className="xl:hidden fixed inset-0 z-40 bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="mx-auto max-w-lg">
            <EmailDrawer email={selectedEmail} onClose={() => setSelectedEmail(null)} />
          </div>
        </div>
      )}
    </div>
  )
}
