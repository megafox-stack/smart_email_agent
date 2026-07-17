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

  const isUnauthorized = error?.status === 401

  useEffect(() => {
    if (isUnauthorized) {
      setSelectedEmail(null)
    }
  }, [isUnauthorized, setSelectedEmail])

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

  const visibleEmails = isUnauthorized ? [] : filteredEmails

  const visibleStats = isUnauthorized
    ? { total: 0, important: 0, university: 0, spam: 0 }
    : stats

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
      if (isUnauthorized) {
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

    if (visibleEmails.length === 0) {
      return (
        <div className="flex min-h-[160px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-700/80 bg-slate-950/70 p-10 text-center text-slate-400">
          <p className="text-lg font-semibold text-slate-100">No matching emails found</p>
          <p className="mt-2 max-w-md">Try updating your search criteria or refresh your inbox to load the latest messages.</p>
        </div>
      )
    }

    return (
      <div className="grid gap-4 xl:grid-cols-1">
        {visibleEmails.map((email) => (
          <EmailCard key={email.id} email={email} onSelect={setSelectedEmail} />
        ))}
      </div>
    )
  }, [visibleEmails, loading, error, isUnauthorized, setSelectedEmail])

  return (
    <div className="h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_transparent_34%),linear-gradient(180deg,_#020617_0%,_#020617_45%,_#030712_100%)] px-3 py-3 text-slate-100 sm:px-4 lg:px-5">
      <div className="mx-auto grid h-full max-w-[1720px] gap-4 xl:grid-cols-[240px_1fr_500px]">
        <Sidebar active={activeFolder} onSelect={setActiveFolder} />

        {activeFolder === 'Settings' ? (
          <main className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
            <SettingsPanel
              error={error}
              emailCount={emails.length}
              refreshing={loading}
              onRefreshInbox={() => refresh()}
            />
          </main>
        ) : activeFolder === 'Drafts' ? (
          <main className="min-h-0 overflow-hidden xl:col-span-2">
            <DraftMessagesPanel />
          </main>
        ) : (
          <>
            <main className="flex min-h-0 flex-col gap-4 overflow-hidden">
              <Navbar searchTerm={searchTerm} onSearchChange={setSearchTerm} />

              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatsCard label="Total Emails" value={visibleStats.total} accent="" />
                <StatsCard label="Important Emails" value={visibleStats.important} accent="" />
                <StatsCard label="University Emails" value={visibleStats.university} accent="" />
                <StatsCard label="Spam Emails" value={visibleStats.spam} accent="" />
              </section>

              <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] p-4 shadow-[0_24px_80px_rgba(2,6,23,0.55)] backdrop-blur-xl">
                <div className="mb-4 flex flex-col gap-3 border-b border-white/5 pb-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Inbox</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Recent messages</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-slate-400">Showing {visibleEmails.length} message(s)</p>
                    <button onClick={() => refresh()} className="inline-flex items-center rounded-2xl border border-sky-500/20 bg-sky-500/10 px-3 py-2 text-sm font-medium text-sky-100 transition hover:border-sky-400/40 hover:bg-sky-500/15">Refresh</button>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                  <div className="grid gap-3">{content}</div>
                </div>
              </section>
            </main>

            <div className="hidden h-full min-h-0 xl:flex">
              <EmailDrawer email={selectedEmail} onClose={() => setSelectedEmail(null)} />
            </div>
          </>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 block border-t border-white/10 bg-slate-950/95 px-4 py-4 backdrop-blur-xl xl:hidden">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4">
          <p className="text-sm text-slate-400">Tap an email card to open details.</p>
          <p className="font-medium text-slate-100">Mobile-friendly inbox</p>
        </div>
      </div>

      {selectedEmail && (
        <div className="fixed inset-0 z-40 bg-slate-950/70 p-4 backdrop-blur-sm xl:hidden">
          <div className="mx-auto max-w-lg">
            <EmailDrawer email={selectedEmail} onClose={() => setSelectedEmail(null)} />
          </div>
        </div>
      )}
    </div>
  )
}
