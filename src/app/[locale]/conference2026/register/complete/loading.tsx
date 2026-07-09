/**
 * Instant skeleton while the complete-registration page is server-rendered
 * (session verification + prefill lookup after the confirmation link).
 */
export default function CompleteRegistrationLoading() {
  return (
    <>
      <section className="relative pt-32 pb-10">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="h-4 w-40 rounded bg-black/5 animate-pulse mb-8" />
          <div className="h-8 w-72 max-w-full rounded bg-black/10 animate-pulse" />
          <div className="mt-3 h-4 w-80 max-w-full rounded bg-black/5 animate-pulse" />
        </div>
      </section>

      <section className="pb-24">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-black/10 bg-white p-6 sm:p-8 shadow-sm space-y-5">
            <div className="h-12 rounded-xl bg-green-50 border border-green-200 animate-pulse" />
            <div className="h-24 rounded-xl bg-black/5 animate-pulse" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-10 rounded-lg bg-black/5 animate-pulse" />
              <div className="h-10 rounded-lg bg-black/5 animate-pulse" />
            </div>
            <div className="h-10 rounded-lg bg-black/5 animate-pulse" />
            <div className="h-10 rounded-lg bg-black/5 animate-pulse" />
            <div className="h-11 rounded-full bg-black/10 animate-pulse" />
          </div>
        </div>
      </section>
    </>
  )
}
