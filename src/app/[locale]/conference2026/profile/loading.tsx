/**
 * Instant skeleton while the profile is server-rendered (auth check +
 * database reads) — the navigation feels immediate instead of stalled.
 */
export default function ProfileLoading() {
  return (
    <>
      <section className="relative pt-32 pb-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="h-4 w-40 rounded bg-black/5 animate-pulse mb-8" />
          <div className="h-8 w-56 rounded bg-black/10 animate-pulse" />
          <div className="mt-3 h-4 w-80 max-w-full rounded bg-black/5 animate-pulse" />
        </div>
      </section>

      <section className="pb-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-5">
          <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
            <div className="h-6 w-48 rounded bg-black/10 animate-pulse" />
            <div className="mt-3 h-4 w-64 max-w-full rounded bg-black/5 animate-pulse" />
            <div className="mt-2 h-4 w-52 max-w-full rounded bg-black/5 animate-pulse" />
            <div className="mt-6 pt-5 border-t border-black/[0.07] flex items-center gap-3">
              <div className="h-6 w-6 rounded-full bg-black/10 animate-pulse" />
              <div className="h-3 flex-1 rounded bg-black/5 animate-pulse" />
              <div className="h-6 w-6 rounded-full bg-black/5 animate-pulse" />
              <div className="h-3 flex-1 rounded bg-black/5 animate-pulse" />
              <div className="h-6 w-6 rounded-full bg-black/5 animate-pulse" />
            </div>
          </div>
          <div className="h-12 rounded-full border border-black/10 bg-white shadow-sm animate-pulse" />
          <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm space-y-4">
            <div className="h-5 w-32 rounded bg-black/10 animate-pulse" />
            <div className="h-24 rounded-xl bg-black/5 animate-pulse" />
            <div className="h-24 rounded-xl bg-black/5 animate-pulse" />
          </div>
        </div>
      </section>
    </>
  )
}
